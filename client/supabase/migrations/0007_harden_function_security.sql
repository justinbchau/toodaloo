-- 0007_harden_function_security.sql
--
-- Hardening from `supabase db advisors` (security). Applies to any database built
-- from these migrations (local, prod, fresh):
--   1. Pin an explicit search_path on functions that lacked one (prevents
--      search_path-based function hijacking).
--   2. Stop the internal trigger/helper functions from being reachable as public
--      PostgREST RPC endpoints — they are only meant to run from triggers.
--   3. Ensure delete_own_account is callable only by `authenticated` (older
--      Supabase projects' function default-privileges also granted `anon`).
--
-- Idempotent and safe to re-run: ALTER FUNCTION ... SET re-sets the same value,
-- and REVOKE of an absent grant is a no-op.

-- 1) Pin search_path. No behavior change — every table reference in these bodies
--    is already schema-qualified, and pg_catalog is always implicitly first.
alter function public.bathrooms_nearby(double precision, double precision, double precision)
  set search_path = public;
alter function public.refresh_bathroom_rating(uuid) set search_path = public;
alter function public.reviews_sync_rating() set search_path = public;

-- 2) Trigger functions must never be callable as RPC. Revoking EXECUTE does not
--    affect trigger firing (the trigger mechanism does not check EXECUTE).
revoke execute on function public.handle_new_user()     from anon, authenticated, public;
revoke execute on function public.reviews_sync_rating() from anon, authenticated, public;

-- 3) refresh_bathroom_rating is an internal helper called by the reviews trigger
--    as the acting user, so `authenticated` must keep EXECUTE; `anon` never writes
--    reviews and does not need it.
revoke execute on function public.refresh_bathroom_rating(uuid) from anon;

-- 4) Account deletion is for signed-in users only. 0005 grants EXECUTE to
--    `authenticated`; remove the `anon` exposure left by the legacy function
--    default-privilege. (The function also self-guards with an auth.uid() check.)
revoke execute on function public.delete_own_account() from anon, public;
