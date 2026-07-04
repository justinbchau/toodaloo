-- seed.sql
-- Sample bathrooms for local development / manual testing (centered on NYC).
-- Reviews are intentionally omitted because they require real auth users.
-- Safe to re-run: rows are keyed by a deterministic name+address pair.

insert into public.bathrooms (name, address, lat, lng, tags, access_type, is_24_hours)
select * from (values
  ('Bryant Park Restrooms', 'Bryant Park, New York, NY', 40.7536, -73.9832,
     array['Gender Neutral', 'Mirrors', 'Baby Friendly'], 'public', false),
  ('Starbucks — 5th Ave', '150 5th Ave, New York, NY', 40.7392, -73.9903,
     array['Multi Stalls', 'Keypad Locked'], 'purchase_required', false),
  ('Whole Foods — Union Sq', '4 Union Square S, New York, NY', 40.7347, -73.9906,
     array['Handicap', 'Multi Stalls'], 'purchase_required', false),
  ('Grand Central Terminal', '89 E 42nd St, New York, NY', 40.7527, -73.9772,
     array['Multi Stalls', 'Handicap'], 'public', true),
  ('The High Line — 14th St', 'The High Line, New York, NY', 40.7420, -74.0048,
     array['Gender Neutral'], 'public', false)
) as v(name, address, lat, lng, tags, access_type, is_24_hours)
where not exists (
  select 1 from public.bathrooms b
  where b.name = v.name and b.address = v.address
);
