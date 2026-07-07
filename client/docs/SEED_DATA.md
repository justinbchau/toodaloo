# Launch-city seed data (runbook)

Why: an empty map is a dead app — nobody writes review #1 into a void. We seed
the launch city with real bathroom locations so the map has credible density on
day one (FAF-35).

- **Launch city:** San Francisco (center `37.7749, -122.4194`, radius 25 km).
- **Source:** [Refuge Restrooms](https://www.refugerestrooms.org) — a free,
  open, community-maintained restroom database (code AGPLv3). We credit it in
  the app's legal/privacy page (`docs/legal`). Data © Refuge Restrooms
  contributors.
- **Generator:** `client/scripts/import-refuge.mjs` (Node 20+, no deps, no
  secrets — the Refuge API is public and unauthenticated).
- **Output:** `client/supabase/seed/sf.sql` — a committed, reviewable,
  **idempotent** SQL seed. Imported rows have `created_by = null` (no owning
  user), so they can't be edited/deleted through the app's owner-scoped RLS.

## Re-import (regenerate the SQL)

```bash
cd client
node scripts/import-refuge.mjs               # San Francisco defaults
# other city:
node scripts/import-refuge.mjs --lat 40.7128 --lng -74.0060 \
  --radius 20 --city "New York" --out supabase/seed/nyc.sql
```

Flags: `--lat --lng --radius`(km) `--city --out --max`(row cap, default 300)
`--per-page`. The script fetches Refuge `by_location`, then keeps only rows that
are **approved**, have **net-positive votes**, sit **>30 m from the query point**
(centroid geocode-failures cluster there), and pass a junk-name check — then
**dedupes by coordinate** (~11 m) so the same spot submitted under two names
collapses to one. It prints how many were scanned vs. kept.

## Apply

The seed inserts rows with `created_by = null`, which the owner-scoped RLS insert
policy forbids for normal clients — so it must be applied with **elevated
privilege** (bypasses RLS):

**Local (dev stack up):**
```bash
cd client
docker exec -i "$(docker ps --filter name=supabase_db --format '{{.Names}}' | head -1)" \
  psql -U postgres -d postgres < supabase/seed/sf.sql
```
Note: `dev.sh db:reset` re-applies migrations + `seed.sql` (the 5 NYC dev
samples) only — re-run the command above afterward to restore the SF launch set
locally.

**Production:** apply via the Supabase **MCP** (`execute_sql` with the contents
of `sf.sql`, or `apply_migration` if you want it in migration history). This is a
privileged production write — do it deliberately, against the restored prod
project.

Idempotent either way: rows are keyed by `(name, address)` via `WHERE NOT
EXISTS`, so re-applying is a no-op (`INSERT 0 0`).

## Manual curation

Two supported paths, both idempotent:

1. **Edit `sf.sql`'s manual block.** The file has a generated block (which the
   script **overwrites** on re-import) and a commented **manual curation block**
   at the bottom that survives regeneration. Add/fix rows there.
2. **Fix rows directly in the DB** (psql / MCP) for one-off corrections —
   e.g. `update public.bathrooms set access_type = 'purchase_required' where …`.

## Field mapping (Refuge → `bathrooms`)

| Refuge | `bathrooms` |
|---|---|
| `name` | `name` |
| `street`, `city`, `state` | `address` (composed) |
| `latitude` / `longitude` | `lat` / `lng` |
| `unisex = true` | tag `Gender Neutral` |
| `accessible = true` | tag `Handicap` |
| `changing_table = true` | tag `Baby Friendly` |
| — | `access_type = 'public'` (Refuge has no access model) |
| — | `is_24_hours = false` (Refuge has no hours model) |

Tags use the exact vocabulary in `pages/AddBathroom.tsx` (`TAG_OPTIONS`).
