-- 0006_reconcile_least_privilege_grants.sql
--
-- Older Supabase projects (this one was created 2026-04-10) predate the modern
-- least-privilege defaults: their ALTER DEFAULT PRIVILEGES auto-granted ALL on
-- every new public table/view to `anon` and `authenticated`. That silently masks
-- the least-privilege grants declared in 0004 — e.g. `anon` ends up with
-- INSERT/UPDATE/DELETE on bathrooms/reviews even though 0004 only intends SELECT.
--
-- This migration tightens the schema default privileges and resets the existing
-- tables/view to exactly the grants 0004 declares. It is a safe no-op on a fresh
-- database (where nothing extra was ever granted): the ALTER DEFAULT PRIVILEGES
-- revoke matches nothing, and the REVOKE/GRANT pair re-establishes the same
-- least-privilege state 0004 already set.

-- 1) Stop future tables from auto-granting table privileges to the API roles.
--    (Function EXECUTE defaults are intentionally left alone — RPCs rely on them.)
alter default privileges in schema public revoke all on tables from anon, authenticated;

-- 2) Reset the existing objects to a clean slate for the API roles...
revoke all on public.bathrooms            from anon, authenticated;
revoke all on public.reviews              from anon, authenticated;
revoke all on public.profiles             from anon, authenticated;
revoke all on public.saved_bathrooms      from anon, authenticated;
revoke all on public.reviews_with_authors from anon, authenticated;

-- 3) ...then reassert exactly the grants declared in 0004_grants.sql.
grant select on public.bathrooms            to anon, authenticated;
grant select on public.reviews              to anon, authenticated;
grant select on public.profiles             to anon, authenticated;
grant select on public.reviews_with_authors to anon, authenticated;

grant insert, update         on public.bathrooms       to authenticated;
grant insert, update, delete on public.reviews         to authenticated;
grant insert, update         on public.profiles        to authenticated;
grant select, insert, delete on public.saved_bathrooms to authenticated;
