#!/usr/bin/env node
// import-refuge.mjs — generate launch-city seed SQL from Refuge Restrooms.
//
// Fetches the public Refuge Restrooms API (https://www.refugerestrooms.org)
// around a lat/lng, filters out crowd-sourced spam / bad geocodes, dedupes,
// maps Refuge's booleans to our tag vocabulary, and writes an idempotent SQL
// seed file that inserts rows with created_by = null.
//
// No secrets, no dependencies — Node 20+ (global fetch). Re-runnable: the
// output SQL is keyed by (name, address) with WHERE NOT EXISTS, so applying it
// twice is a no-op. See docs/SEED_DATA.md for the runbook.
//
// Usage (from client/):
//   node scripts/import-refuge.mjs                        # San Francisco defaults
//   node scripts/import-refuge.mjs --lat 40.7128 --lng -74.0060 \
//     --radius 20 --city "New York" --out supabase/seed/nyc.sql
//
// Flags: --lat --lng --radius(km) --city --out --max --per-page

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

// --- args --------------------------------------------------------------------
function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const LAT = Number(arg('lat', '37.7749'));
const LNG = Number(arg('lng', '-122.4194'));
const RADIUS_KM = Number(arg('radius', '25'));
const CITY = arg('city', 'San Francisco');
const OUT = arg('out', 'supabase/seed/sf.sql');
const MAX_ROWS = Number(arg('max', '300'));
const PER_PAGE = Number(arg('per-page', '100'));
const MAX_PAGES = 25; // safety cap on API paging

// Refuge → our tag vocabulary (must match TAG_OPTIONS in pages/AddBathroom.tsx).
const TAG_MAP = [
  ['unisex', 'Gender Neutral'],
  ['accessible', 'Handicap'],
  ['changing_table', 'Baby Friendly'],
];

// --- fetch -------------------------------------------------------------------
async function fetchPage(page) {
  const url =
    `https://www.refugerestrooms.org/api/v1/restrooms/by_location.json` +
    `?lat=${LAT}&lng=${LNG}&per_page=${PER_PAGE}&page=${page}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'toodaloo-seed-import' } });
  if (!res.ok) throw new Error(`Refuge API ${res.status} on page ${page}`);
  return res.json();
}

// Results are nearest-first with a `distance` (km) field, so page until we pass
// the radius or run out.
async function fetchAll() {
  const rows = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const batch = await fetchPage(page);
    if (!Array.isArray(batch) || batch.length === 0) break;
    rows.push(...batch);
    const last = batch[batch.length - 1];
    if (typeof last?.distance === 'number' && last.distance > RADIUS_KM) break;
  }
  return rows;
}

// --- clean / filter ----------------------------------------------------------
const JUNK_NAME = /^(test\b|asdf|qwerty|http|n\/?a$|none$|\.+$)/i;

function isSane(r) {
  if (r.approved !== true) return false; // unmoderated
  if (!Number.isFinite(r.latitude) || !Number.isFinite(r.longitude)) return false;
  if (typeof r.distance === 'number' && r.distance > RADIUS_KM) return false;
  // Rows within ~30m of the query point are almost always geocode failures
  // dumped on the city centroid (e.g. a Mallorca listing landing on SF center),
  // not a real toilet at our arbitrary search coordinate.
  if (typeof r.distance === 'number' && r.distance < 0.03) return false;
  // Net-negative votes flag spam / wrong entries (e.g. a Mallorca listing dumped
  // on the SF centroid with more down- than up-votes).
  if ((r.upvote ?? 0) - (r.downvote ?? 0) < 0) return false;
  const name = (r.name ?? '').trim();
  if (name.length < 2 || name.length > 80) return false;
  if (JUNK_NAME.test(name)) return false;
  return true;
}

function titleCase(s) {
  return s.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
}

function toRow(r) {
  const name = r.name.trim();
  const state = (r.state ?? '').trim();
  const parts = [
    (r.street ?? '').trim(),
    r.city ? titleCase(r.city.trim()) : '',
    state.length <= 2 ? state.toUpperCase() : titleCase(state),
  ].filter(Boolean);
  const address = parts.join(', ');
  const tags = TAG_MAP.filter(([field]) => r[field] === true).map(([, tag]) => tag);
  return { name, address, lat: r.latitude, lng: r.longitude, tags };
}

function haversineM(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Dedupe on physical proximity alone. Refuge duplicates a spot every which way
// — same name/diff coords ("Exploratorium" x2, ~30m apart), diff name/same
// address ("Coffee Bar" / "Arc Cafe" at 1890 Bryant, ~10m apart), diff spelling
// same coords ("The market" / "the Market SF") — so name and address strings are
// all unreliable keys. Proximity is the honest one: two toilets within DEDUPE_M
// are the same findable location. Drop a row if it's within DEDUPE_M of any
// already-kept row. Rows arrive nearest-first, so the survivor is the closest to
// the query point. (Tight enough — ~one building — that genuinely distinct
// venues a block apart survive.)
const DEDUPE_M = 40;

function dedupe(rows) {
  const kept = [];
  for (const row of rows) {
    if (kept.some((k) => haversineM(k.lat, k.lng, row.lat, row.lng) < DEDUPE_M)) continue;
    kept.push(row);
  }
  return kept;
}

// --- emit SQL ----------------------------------------------------------------
const sqlStr = (s) => `'${String(s).replace(/'/g, "''")}'`;
const sqlTags = (tags) =>
  tags.length ? `array[${tags.map(sqlStr).join(', ')}]::text[]` : `'{}'::text[]`;

function toSql(rows, meta) {
  const values = rows
    .map(
      (r) =>
        `  (${sqlStr(r.name)}, ${sqlStr(r.address)}, ${r.lat}, ${r.lng}, ` +
        `${sqlTags(r.tags)}, 'public', false)`,
    )
    .join(',\n');

  return `-- ${OUT.split('/').pop()}
-- Launch-city seed for ${CITY}, generated by scripts/import-refuge.mjs.
--
-- Source: Refuge Restrooms (https://www.refugerestrooms.org) — a free, open,
-- community-maintained restroom database. Attribution: data © Refuge Restrooms
-- contributors. Re-import + curation runbook: docs/SEED_DATA.md.
--
-- Generated ${meta.date} from lat=${LAT}, lng=${LNG}, radius=${RADIUS_KM}km.
-- ${meta.scanned} rows scanned → ${rows.length} kept (approved, net-positive
-- votes, deduped). Imported rows have created_by = null (no owning user).
--
-- Idempotent: keyed by (name, address) via WHERE NOT EXISTS — safe to re-apply.
-- To hand-curate, add rows to the manual block at the bottom (not the generated
-- block, which the script overwrites) or fix rows directly in the DB.

insert into public.bathrooms (name, address, lat, lng, tags, access_type, is_24_hours)
select * from (values
${values}
) as v(name, address, lat, lng, tags, access_type, is_24_hours)
where not exists (
  select 1 from public.bathrooms b
  where b.name = v.name and b.address = v.address
);

-- ---------------------------------------------------------------------------
-- Manual curation block — hand-added / corrected rows live here and survive
-- re-generation. Same idempotent shape; add VALUES rows as needed.
-- ---------------------------------------------------------------------------
-- insert into public.bathrooms (name, address, lat, lng, tags, access_type, is_24_hours)
-- select * from (values
--   ('Example Cafe', '1 Market St, San Francisco, CA', 37.7936, -122.3959,
--      array['Gender Neutral']::text[], 'purchase_required', false)
-- ) as v(name, address, lat, lng, tags, access_type, is_24_hours)
-- where not exists (
--   select 1 from public.bathrooms b where b.name = v.name and b.address = v.address
-- );
`;
}

// --- main --------------------------------------------------------------------
const raw = await fetchAll();
const kept = dedupe(raw.filter(isSane).map(toRow)).slice(0, MAX_ROWS);

if (kept.length === 0) {
  console.error('No rows survived filtering — check lat/lng/radius.');
  process.exit(1);
}

// Date is passed in so the script is deterministic when unit-run; default now.
const date = arg('date', new Date().toISOString().slice(0, 10));
const sql = toSql(kept, { date, scanned: raw.length });

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, sql);
console.error(
  `Wrote ${kept.length} rows to ${OUT} (scanned ${raw.length}, ` +
    `${raw.length - kept.length} filtered/deduped).`,
);
