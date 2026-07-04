-- 0002_profiles.sql
-- Adds a public profiles table so reviews can show a human username instead of
-- a raw user UUID. A row is created automatically for every new auth user, and
-- existing users are backfilled with a placeholder username derived from their
-- email local-part.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  username   text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Usernames are public (they appear on reviews); users may edit only their own.
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- Auto-create a profile row when a new auth user is created.
-- Derives an initial username from the email local-part, de-duplicated with a
-- short suffix if it collides.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  candidate     text;
  suffix        integer := 0;
begin
  base_username := split_part(coalesce(new.email, 'user'), '@', 1);
  -- Strip anything that is not a safe username character.
  base_username := regexp_replace(base_username, '[^a-zA-Z0-9_]', '', 'g');
  if base_username = '' then
    base_username := 'user';
  end if;

  candidate := base_username;
  while exists (select 1 from public.profiles where username = candidate) loop
    suffix := suffix + 1;
    candidate := base_username || suffix::text;
  end loop;

  insert into public.profiles (id, username)
  values (new.id, candidate)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Backfill profiles for any pre-existing users.
-- ---------------------------------------------------------------------------
insert into public.profiles (id, username)
select
  u.id,
  -- Best-effort unique username: email local-part + last 4 of the uuid on collision risk.
  coalesce(
    nullif(regexp_replace(split_part(u.email, '@', 1), '[^a-zA-Z0-9_]', '', 'g'), ''),
    'user'
  ) || '_' || right(u.id::text, 4)
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

-- ---------------------------------------------------------------------------
-- reviews_with_authors view
-- Lets the client fetch reviews joined with the author's username in one query
-- without ever exposing auth.users / emails. Runs with the querying user's RLS.
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
    p.username as author_username
  from public.reviews r
  left join public.profiles p on p.id = r.user_id;
