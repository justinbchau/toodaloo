// Tests for the Refuge import's pure logic — filtering + dedupe. Run with:
//   node --test scripts/import-refuge.test.mjs
// (Standalone Node test runner; the app's jest suite doesn't cover scripts/.)
//
// Three rounds of review found real dedupe defects here, all via the same
// failure mode: the same physical restroom submitted under different name /
// address / coordinate representations. These lock that class down.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dedupe, isSane, normAddr } from './import-refuge.mjs';

const R = (name, address, lat, lng) => ({ name, address, lat, lng, tags: [] });

test('dedupe: bit-identical coordinates collapse regardless of name/address', () => {
  const out = dedupe([
    R('Whole Foods Market', '24th St, San Francisco, CA', 37.75254169999999, -122.4135418),
    R('the pizza shop', '24th street, San Francisco, CA', 37.75254169999999, -122.4135418),
  ]);
  assert.equal(out.length, 1);
  assert.equal(out[0].name, 'Whole Foods Market'); // nearest-first survivor
});

test('dedupe: same address across St/Street abbreviation, nearby', () => {
  const out = dedupe([
    R("Martuni's", '4 Valencia St., San Francisco, CA', 37.7721289, -122.4227604),
    R('Martunis', '4 Valencia street, San Francisco, CA', 37.772129, -122.4227605),
  ]);
  assert.equal(out.length, 1);
});

test('dedupe: same name nearby collapses (Exploratorium x2, ~30m)', () => {
  const out = dedupe([
    R('Exploratorium', 'Pier 15, San Francisco, CA', 37.8013881, -122.3975432),
    R('Exploratorium', 'Pier 15, San Francisco, CA', 37.8016, -122.3977),
  ]);
  assert.equal(out.length, 1);
});

test('dedupe: keeps distinct neighbors — different name AND address, ~17m', () => {
  const out = dedupe([
    R('El Rio', '3158 Mission St, San Francisco, CA', 37.7468059, -122.4194721),
    R("Virgil's Sea Room", '3152 Mission Street, San Francisco, CA', 37.7469285, -122.4193508),
  ]);
  assert.equal(out.length, 2);
});

test('dedupe: keeps same-named venues far apart (two Starbucks citywide)', () => {
  const out = dedupe([
    R('Starbucks', '201 Powell St, San Francisco, CA', 37.786527, -122.408149),
    R('Starbucks', '2222 Fillmore St, San Francisco, CA', 37.7902132, -122.4338594),
  ]);
  assert.equal(out.length, 2);
});

test('normAddr canonicalizes street-type abbreviations', () => {
  assert.equal(normAddr('4 Valencia St.'), normAddr('4 Valencia street'));
  assert.equal(normAddr('50 Phelan Ave'), normAddr('50 Phelan Avenue'));
  assert.equal(normAddr('1 Market Blvd'), normAddr('1 Market boulevard'));
});

test('isSane rejects unapproved, spam, centroid, and junk rows', () => {
  const ok = {
    name: 'Real Cafe', latitude: 37.78, longitude: -122.42,
    distance: 1.0, approved: true, upvote: 3, downvote: 1,
  };
  assert.equal(isSane(ok), true);
  assert.equal(isSane({ ...ok, approved: false }), false); // unmoderated
  assert.equal(isSane({ ...ok, upvote: 1, downvote: 5 }), false); // net-negative votes
  assert.equal(isSane({ ...ok, distance: 0.01 }), false); // centroid geocode dump (<30m)
  assert.equal(isSane({ ...ok, name: 'test' }), false); // junk name
  assert.equal(isSane({ ...ok, name: 'x' }), false); // too short
});
