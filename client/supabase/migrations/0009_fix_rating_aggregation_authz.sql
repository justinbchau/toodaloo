-- 0009_fix_rating_aggregation_authz.sql
--
-- Fixes two authorization bugs in the bathrooms rating aggregate
-- (rating_avg / review_count), which the reviews trigger is meant to own:
--
--   1. Ratings went stale for most reviewers. refresh_bathroom_rating() ran as
--      SECURITY INVOKER, i.e. as the reviewing user. Its UPDATE on bathrooms is
--      then filtered by the bathrooms_update_own RLS policy, so for anyone other
--      than the bathroom's creator it matched 0 rows and the aggregate never
--      moved. Fix: run the aggregation as the function owner (SECURITY DEFINER).
--
--   2. Creators could forge their own rating. The table-level
--      `grant insert, update on public.bathrooms to authenticated` (0004/0006)
--      covered every column, so a creator could write rating_avg/review_count on
--      their own row directly (or seed them on insert). Fix: replace it with
--      column-level grants on the user-editable columns only.
--
-- Plus a backfill so existing rows reflect their reviews.
--
-- Idempotent and safe to re-run: CREATE OR REPLACE / ALTER FUNCTION re-set the
-- same definition, REVOKE of an absent privilege is a no-op, the table-level
-- REVOKE also clears any column grants before they are re-granted, and the
-- backfill recomputes from scratch.

-- ---------------------------------------------------------------------------
-- 1) Rating aggregation runs as the function owner.
--
-- The body is restated (not just ALTERed) so every database, including a prod
-- whose function was originally created in the dashboard, ends up with the
-- same known-good definition. It only ever recomputes one bathroom's aggregate
-- from its reviews, so running it with the owner's rights cannot write anything
-- a caller chooses: the inputs are a bathroom id and the reviews table itself.
-- ---------------------------------------------------------------------------
create or replace function public.refresh_bathroom_rating(target_bathroom uuid)
returns void
language sql
security definer
set search_path = public
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

-- The trigger function becomes SECURITY DEFINER too, so its nested call to
-- refresh_bathroom_rating runs as the owner instead of the reviewing user.
-- (Only the trigger function itself is exempt from EXECUTE checks; a function it
-- calls is checked against the current role.) That lets us drop `authenticated`
-- from refresh_bathroom_rating's EXECUTE below. reviews_sync_rating is safe as a
-- definer: a trigger function can't be called directly, and 0007 already
-- revoked its EXECUTE from every API role.
alter function public.reviews_sync_rating() security definer;
alter function public.reviews_sync_rating() set search_path = public;

-- refresh_bathroom_rating is an internal helper, not an RPC. Only the trigger
-- (via the owner) needs it now, so remove the API roles' EXECUTE as well as the
-- PUBLIC/anon exposure 0007 already closed.
revoke execute on function public.refresh_bathroom_rating(uuid) from public, anon, authenticated;
revoke execute on function public.reviews_sync_rating()        from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2) Clients may write only user-editable columns of bathrooms.
--
-- REVOKE of a table-level privilege also revokes that privilege on every
-- column, so this starts from a clean slate on each run. `anon` is included to
-- cover legacy projects whose default privileges granted it writes (see 0006).
-- SELECT grants from 0004/0006 are untouched.
--
-- Excluded on purpose: id and created_at (defaults), rating_avg and
-- review_count (trigger-owned). created_by is insert-only: the bathrooms_insert
-- policy requires it to equal auth.uid(), and it never changes afterwards.
-- ---------------------------------------------------------------------------
revoke insert, update on public.bathrooms from anon, authenticated;

grant insert (name, address, lat, lng, tags, access_type, is_24_hours, created_by)
  on public.bathrooms to authenticated;
grant update (name, address, lat, lng, tags, access_type, is_24_hours)
  on public.bathrooms to authenticated;

-- `hours` (opening hours) is user-editable but is added by a separate migration
-- that may land before or after this one. Grant it only if the column exists; a
-- migration adding it later must grant it itself, because column-level grants
-- don't extend to new columns the way the old table-level grant did.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'bathrooms' and column_name = 'hours'
  ) then
    grant insert (hours), update (hours) on public.bathrooms to authenticated;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3) Backfill: recompute every bathroom's aggregate from its reviews, fixing
-- rows left stale by bug 1 and any values forged through bug 2.
-- ---------------------------------------------------------------------------
select public.refresh_bathroom_rating(id) from public.bathrooms;
