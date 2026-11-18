-- 0009_review_tags_and_hours.sql
--
-- Batch 2 of the UX redesign:
--   1. reviews.tags      — one-tap "what stood out" tags on a review (Clean,
--                          Long wait, …), constrained to a fixed vocabulary.
--   2. bathrooms.hours   — optional weekly opening hours, powering "Open now".
--   3. reviews_with_authors gains `tags`; bathrooms_nearby gains `hours`.
--
-- No new tables, so no new RLS policies are needed: both columns live on
-- tables whose existing policies already scope writes to the row owner
-- (reviews_*_own, bathrooms_insert / bathrooms_update_own). Table-level grants
-- from 0004/0006 cover new columns automatically.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS, DROP CONSTRAINT IF EXISTS before ADD,
-- CREATE OR REPLACE VIEW, and DROP FUNCTION IF EXISTS before re-creating the RPC.
--
-- Deploy order: apply this migration BEFORE shipping the app update — the new
-- client sends `tags` on review insert/update and reads `hours`.

-- ---------------------------------------------------------------------------
-- 1) reviews.tags
-- ---------------------------------------------------------------------------
alter table public.reviews
  add column if not exists tags text[] not null default '{}';

-- Fixed vocabulary (slugs; labels/icons live in the app's lib/reviewTags.ts)
-- and a small cap so a review can't be stuffed with every tag.
alter table public.reviews
  drop constraint if exists reviews_tags_allowed;

alter table public.reviews
  add constraint reviews_tags_allowed check (
    coalesce(array_ndims(tags), 1) = 1   -- flat list only (no 2-D arrays)
    and cardinality(tags) <= 6
    and tags <@ array[
      -- the good
      'clean', 'stocked', 'no_wait', 'spacious', 'private', 'feels_safe',
      -- could be better
      'dirty', 'out_of_supplies', 'long_wait', 'smelly', 'broken', 'feels_unsafe'
    ]::text[]
  );

-- ---------------------------------------------------------------------------
-- 2) bathrooms.hours
-- Shape (validated in the app, loosely here):
--   { "mon": { "open": "08:00", "close": "21:00" } | null, ... "sun": ... }
-- Note: bathrooms_update_own also lets the creator edit hours later.
-- A missing key or null day means closed that day; `close` earlier than `open`
-- means the window runs past midnight. NULL hours = unknown.
-- is_24_hours stays the source of truth for always-open places.
-- ---------------------------------------------------------------------------
alter table public.bathrooms
  add column if not exists hours jsonb;

alter table public.bathrooms
  drop constraint if exists bathrooms_hours_is_object;

-- hours is user-supplied and fanned out to every nearby client by
-- bathrooms_nearby, so bound it: an object, only weekday keys, and small.
-- (Per-day value shape is validated by the app, which also parses defensively.)
alter table public.bathrooms
  add constraint bathrooms_hours_is_object check (
    hours is null or (
      jsonb_typeof(hours) = 'object'
      and hours - array['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] = '{}'::jsonb
      and pg_column_size(hours) <= 1024
    )
  );

-- ---------------------------------------------------------------------------
-- 3a) reviews_with_authors: append `tags`.
-- CREATE OR REPLACE VIEW may only add columns at the end, so existing columns
-- keep their order. security_invoker keeps the querying user's RLS in force;
-- grants are re-asserted below (CREATE OR REPLACE preserves them, but this
-- keeps the file self-describing and safe on a fresh database).
-- ---------------------------------------------------------------------------
create or replace view public.reviews_with_authors
with (security_invoker = true)
as
  select
    r.id,
    r.bathroom_id,
    r.user_id,
    r.rating,
    r.body,
    r.created_at,
    p.username as author_username,
    r.tags
  from public.reviews r
  left join public.profiles p on p.id = r.user_id;

grant select on public.reviews_with_authors to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3b) bathrooms_nearby: add `hours` to the result.
-- A function's RETURNS TABLE can't be changed with CREATE OR REPLACE, so drop
-- and re-create it, then restore what 0004/0007 established: search_path
-- pinned, EXECUTE for anon + authenticated (it's SECURITY INVOKER, so the
-- caller's bathrooms_select policy still applies).
-- ---------------------------------------------------------------------------
drop function if exists public.bathrooms_nearby(double precision, double precision, double precision);

create function public.bathrooms_nearby(
  user_lat  double precision,
  user_lng  double precision,
  radius_km double precision default 5.0
)
returns table (
  id           uuid,
  name         text,
  address      text,
  lat          double precision,
  lng          double precision,
  tags         text[],
  access_type  text,
  is_24_hours  boolean,
  rating_avg   numeric,
  review_count integer,
  created_by   uuid,
  created_at   timestamptz,
  distance_km  double precision,
  hours        jsonb
)
language sql
stable
set search_path = public
as $$
  select
    b.id,
    b.name,
    b.address,
    b.lat,
    b.lng,
    b.tags,
    b.access_type,
    b.is_24_hours,
    b.rating_avg,
    b.review_count,
    b.created_by,
    b.created_at,
    -- Haversine distance in kilometers (Earth radius = 6371 km)
    (2 * 6371 * asin(sqrt(
      power(sin(radians(b.lat - user_lat) / 2), 2) +
      cos(radians(user_lat)) * cos(radians(b.lat)) *
      power(sin(radians(b.lng - user_lng) / 2), 2)
    ))) as distance_km,
    b.hours
  from public.bathrooms b
  where (2 * 6371 * asin(sqrt(
      power(sin(radians(b.lat - user_lat) / 2), 2) +
      cos(radians(user_lat)) * cos(radians(b.lat)) *
      power(sin(radians(b.lng - user_lng) / 2), 2)
    ))) <= radius_km
  order by distance_km asc;
$$;

grant execute on function public.bathrooms_nearby(double precision, double precision, double precision)
  to anon, authenticated;
