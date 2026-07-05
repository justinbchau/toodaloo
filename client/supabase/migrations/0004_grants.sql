-- 0004_grants.sql
--
-- Grant table/function privileges to the API roles (anon, authenticated).
--
-- RLS (enabled in 0001/0002) only decides WHICH ROWS a role may see; a role must
-- first hold a table-level privilege to touch the table at all. Modern Supabase no
-- longer auto-grants anon/authenticated on newly created tables, so without these
-- GRANTs PostgREST refuses every request with "42501 permission denied" before RLS
-- is ever evaluated. These grants mirror the intent already encoded in the RLS
-- policies and make the schema reproducible on a fresh database (local or remote).

grant usage on schema public to anon, authenticated;

-- Public reads: pre-login screens query as `anon`; the *_select policies use (true).
grant select on public.bathrooms            to anon, authenticated;
grant select on public.reviews              to anon, authenticated;
grant select on public.profiles             to anon, authenticated;
grant select on public.reviews_with_authors to anon, authenticated;

-- Owner-scoped writes: RLS with-check clauses already restrict rows to auth.uid().
grant insert, update         on public.bathrooms       to authenticated;
grant insert, update, delete on public.reviews         to authenticated;
grant insert, update         on public.profiles        to authenticated;
grant select, insert, delete on public.saved_bathrooms to authenticated;

-- Nearby search RPC (SECURITY INVOKER): callable by both roles; its internal
-- SELECT on bathrooms is covered by the grant above.
grant execute on function public.bathrooms_nearby(double precision, double precision, double precision)
  to anon, authenticated;
