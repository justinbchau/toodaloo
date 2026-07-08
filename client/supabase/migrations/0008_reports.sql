-- 0008_reports.sql
--
-- UGC moderation minimum (Apple 1.2): a way for users to report objectionable
-- content, plus a mechanism to act on it. toodaloo is 100% user-generated
-- (bathrooms + reviews), so both are reportable.
--
-- Model: a single `reports` table with a polymorphic target. `target_id` is a
-- bare uuid rather than a foreign key because it points at EITHER a bathroom OR
-- a review depending on `target_type` — a single FK can't express that. The
-- tradeoff (no cascade-delete of reports when a target is removed) is fine: the
-- table is admin-triaged, and orphaned reports are harmless — the moderator
-- reads them and deletes them by hand.
--
-- Access model: reporters may INSERT their own rows and nothing else. There is
-- deliberately NO select policy AND no select grant, so no one can read reports
-- through the Data API. Moderation happens in the Supabase dashboard, where the
-- service_role bypasses RLS. Every statement is idempotent (house style).

create table if not exists public.reports (
  id           uuid primary key default gen_random_uuid(),
  reporter_id  uuid not null references auth.users (id) on delete cascade,
  target_type  text not null check (target_type in ('bathroom', 'review')),
  target_id    uuid not null,
  -- Bounded like target_type is enumerated: the app only ever sends one of a
  -- fixed set of short reason strings, so reject empty or oversized input.
  reason       text not null check (char_length(reason) between 1 and 200),
  created_at   timestamptz not null default now()
);

create index if not exists reports_target_idx   on public.reports (target_type, target_id);
create index if not exists reports_reporter_idx on public.reports (reporter_id);

-- One report per user per target: makes a re-submit a no-op the app can treat as
-- an idempotent "thanks" (see ReportSheet), and blocks a single user from
-- spamming the same target.
create unique index if not exists reports_unique_per_user
  on public.reports (reporter_id, target_type, target_id);

-- ---------------------------------------------------------------------------
-- Row Level Security + grants (they travel together — see 0004_grants.sql).
-- ---------------------------------------------------------------------------
alter table public.reports enable row level security;

-- Insert-own only. Scoped TO authenticated with an ownership with-check so a
-- user can only file reports under their own id.
drop policy if exists "reports_insert_own" on public.reports;
create policy "reports_insert_own" on public.reports
  for insert to authenticated
  with check ((select auth.uid()) = reporter_id);

-- No select/update/delete policy: reports are unreadable via the API by design.
-- Admin triage runs as service_role (bypasses RLS) in the dashboard.

-- Grants mirror the policy: authenticated may INSERT; nothing is granted to
-- anon, and SELECT is granted to no API role. (schema usage already granted in
-- 0004.) Without the missing SELECT grant, even an accidental future select
-- policy still can't leak rows.
grant insert on public.reports to authenticated;
