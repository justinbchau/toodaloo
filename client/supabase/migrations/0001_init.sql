-- 0001_init.sql
-- Baseline schema for toodaloo.
--
-- This migration reconstructs the schema that was previously created directly
-- in the Supabase dashboard (it was never committed to the repo). It is written
-- to be safe to run against the existing production database: every statement
-- is idempotent (IF NOT EXISTS / CREATE OR REPLACE / DROP POLICY IF EXISTS), so
-- applying it will not clobber existing data.
--
-- Tables: bathrooms, reviews, saved_bathrooms
-- RPC:    bathrooms_nearby(user_lat, user_lng, radius_km)
-- Trigger: keeps bathrooms.rating_avg + review_count in sync with reviews.

-- Needed for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- bathrooms
-- ---------------------------------------------------------------------------
create table if not exists public.bathrooms (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  address      text,
  lat          double precision not null,
  lng          double precision not null,
  tags         text[] not null default '{}',
  access_type  text not null default 'public'
                 check (access_type in ('public', 'key_required', 'purchase_required')),
  is_24_hours  boolean not null default false,
  rating_avg   numeric(3, 2) not null default 0,
  review_count integer not null default 0,
  created_by   uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now()
);

create index if not exists bathrooms_lat_lng_idx on public.bathrooms (lat, lng);
create index if not exists bathrooms_created_by_idx on public.bathrooms (created_by);

-- ---------------------------------------------------------------------------
-- reviews
-- ---------------------------------------------------------------------------
create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  bathroom_id uuid not null references public.bathrooms (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  rating      integer not null check (rating between 1 and 5),
  body        text,
  created_at  timestamptz not null default now()
);

create index if not exists reviews_bathroom_id_idx on public.reviews (bathroom_id);
create index if not exists reviews_user_id_idx on public.reviews (user_id);

-- ---------------------------------------------------------------------------
-- saved_bathrooms
-- ---------------------------------------------------------------------------
create table if not exists public.saved_bathrooms (
  user_id     uuid not null references auth.users (id) on delete cascade,
  bathroom_id uuid not null references public.bathrooms (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, bathroom_id)
);

create index if not exists saved_bathrooms_user_id_idx on public.saved_bathrooms (user_id);

-- ---------------------------------------------------------------------------
-- Rating aggregation trigger
-- Keeps bathrooms.rating_avg + review_count consistent on any change to reviews.
-- ---------------------------------------------------------------------------
create or replace function public.refresh_bathroom_rating(target_bathroom uuid)
returns void
language sql
as $$
  update public.bathrooms b
  set
    review_count = agg.cnt,
    rating_avg   = coalesce(agg.avg_rating, 0)
  from (
    select
      count(*)                        as cnt,
      round(avg(rating)::numeric, 2)  as avg_rating
    from public.reviews
    where bathroom_id = target_bathroom
  ) agg
  where b.id = target_bathroom;
$$;

create or replace function public.reviews_sync_rating()
returns trigger
language plpgsql
as $$
begin
  if (tg_op = 'DELETE') then
    perform public.refresh_bathroom_rating(old.bathroom_id);
    return old;
  else
    perform public.refresh_bathroom_rating(new.bathroom_id);
    -- If an update moved the review to a different bathroom, refresh the old one too.
    if (tg_op = 'UPDATE' and new.bathroom_id is distinct from old.bathroom_id) then
      perform public.refresh_bathroom_rating(old.bathroom_id);
    end if;
    return new;
  end if;
end;
$$;

drop trigger if exists reviews_sync_rating_trigger on public.reviews;
create trigger reviews_sync_rating_trigger
  after insert or update or delete on public.reviews
  for each row execute function public.reviews_sync_rating();

-- ---------------------------------------------------------------------------
-- bathrooms_nearby RPC
-- Pure-SQL haversine (no PostGIS). Returns bathrooms within radius_km of the
-- given point, annotated with distance_km and ordered nearest-first.
-- ---------------------------------------------------------------------------
create or replace function public.bathrooms_nearby(
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
  distance_km  double precision
)
language sql
stable
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
    ))) as distance_km
  from public.bathrooms b
  where (2 * 6371 * asin(sqrt(
      power(sin(radians(b.lat - user_lat) / 2), 2) +
      cos(radians(user_lat)) * cos(radians(b.lat)) *
      power(sin(radians(b.lng - user_lng) / 2), 2)
    ))) <= radius_km
  order by distance_km asc;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.bathrooms enable row level security;
alter table public.reviews enable row level security;
alter table public.saved_bathrooms enable row level security;

-- bathrooms: readable by anyone; authenticated users may add; authors may edit.
drop policy if exists "bathrooms_select" on public.bathrooms;
create policy "bathrooms_select" on public.bathrooms
  for select using (true);

drop policy if exists "bathrooms_insert" on public.bathrooms;
create policy "bathrooms_insert" on public.bathrooms
  for insert with check (auth.uid() = created_by);

drop policy if exists "bathrooms_update_own" on public.bathrooms;
create policy "bathrooms_update_own" on public.bathrooms
  for update using (auth.uid() = created_by) with check (auth.uid() = created_by);

-- reviews: readable by anyone; users may write/edit/delete only their own.
drop policy if exists "reviews_select" on public.reviews;
create policy "reviews_select" on public.reviews
  for select using (true);

drop policy if exists "reviews_insert_own" on public.reviews;
create policy "reviews_insert_own" on public.reviews
  for insert with check (auth.uid() = user_id);

drop policy if exists "reviews_update_own" on public.reviews;
create policy "reviews_update_own" on public.reviews
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "reviews_delete_own" on public.reviews;
create policy "reviews_delete_own" on public.reviews
  for delete using (auth.uid() = user_id);

-- saved_bathrooms: fully private to the owning user.
drop policy if exists "saved_select_own" on public.saved_bathrooms;
create policy "saved_select_own" on public.saved_bathrooms
  for select using (auth.uid() = user_id);

drop policy if exists "saved_insert_own" on public.saved_bathrooms;
create policy "saved_insert_own" on public.saved_bathrooms
  for insert with check (auth.uid() = user_id);

drop policy if exists "saved_delete_own" on public.saved_bathrooms;
create policy "saved_delete_own" on public.saved_bathrooms
  for delete using (auth.uid() = user_id);
