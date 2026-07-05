---
name: create-migration
description: >
  Scaffold a new Supabase SQL migration for toodaloo following the repo's house style
  (idempotent, RLS + GRANTs together, security-definer safety). Use when adding or
  changing database schema — a new table, column, RPC, view, policy, trigger, or
  constraint. Invoke with a short description of the change, e.g.
  "/create-migration reports table for content moderation".
disable-model-invocation: true
---

# Create a Supabase migration

Migrations live in `client/supabase/migrations/` as `NNNN_short_name.sql`. Follow this exactly — the conventions are load-bearing, not stylistic.

## Steps

1. **Find the next number.** List `client/supabase/migrations/`, take the highest `NNNN`, add one, zero-pad to 4 digits. Never reuse or skip a number; never edit an already-applied file (append a new one instead).

2. **Verify against the live schema before writing — never fabricate.** Read the relevant existing migrations and, if the local stack is up, inspect the actual objects (via `client/scripts/dev.sh` / the `/dev` skill). Confirm real table names, column names/types, and function signatures before referencing them. Guessing an argument order or type is a hard "no" in this repo.

3. **Write the file from the template below**, keeping every statement idempotent.

4. **If the change adds a new table, RPC, or view, you MUST add matching GRANTs** (see the checklist) — RLS alone is not enough.

5. **Apply locally and test.** Reset/apply against the local Supabase stack (`/dev` skill), then run the app and/or `npm test` to confirm nothing regressed. Do not touch the paused production project (that's tracked separately in Linear).

6. **Review before landing.** Hand the diff to the `migration-reviewer` subagent.

## Non-negotiable checklist

- [ ] Idempotent: `create table if not exists`, `create or replace function`, `drop policy if exists` before `create policy`, `drop trigger if exists` before `create trigger`, `add constraint if not exists` semantics.
- [ ] New table → `enable row level security` **and** `create policy` for each needed operation **and** matching `grant` to `anon`/`authenticated`. (Missing grants = `42501 permission denied` before RLS runs. This bug shipped once — never again.)
- [ ] Write policies use `with check (auth.uid() = <owner>)`; select policies never expose `auth.users`/emails.
- [ ] `security definer` functions `set search_path = public`.
- [ ] New RPC → `grant execute`; new view → `grant select` (and prefer `security_invoker = true`).
- [ ] Don't hand-write `bathrooms.rating_avg` / `review_count` — a trigger owns them.
- [ ] Destructive/backfill statements are scoped; constraint adds clean up violating rows first.
- [ ] No secrets or real emails in the SQL (public repo).

## Template

```sql
-- NNNN_short_name.sql
-- <one-paragraph description: what this changes and why. Note if it is safe to
--  re-run against an existing database.>

-- ---------------------------------------------------------------------------
-- <table / object>
-- ---------------------------------------------------------------------------
create table if not exists public.<name> (
  id         uuid primary key default gen_random_uuid(),
  -- ... columns ...
  created_at timestamptz not null default now()
);

-- RLS
alter table public.<name> enable row level security;

drop policy if exists "<name>_select" on public.<name>;
create policy "<name>_select" on public.<name>
  for select using (<condition>);

drop policy if exists "<name>_insert_own" on public.<name>;
create policy "<name>_insert_own" on public.<name>
  for insert with check (auth.uid() = <owner_col>);

-- GRANTs (REQUIRED — RLS does not imply table privilege)
grant select on public.<name> to anon, authenticated;
grant insert on public.<name> to authenticated;
```

Mirror the tone and structure of `0001_init.sql` and `0004_grants.sql`. When in doubt, read them.
