# Supabase schema

The toodaloo backend (Postgres + email OTP auth) is defined here as versioned
SQL migrations. Previously the schema lived only in the Supabase dashboard and
was not reproducible from the repo — these files fix that.

## Migrations

| File | Purpose |
|------|---------|
| `migrations/0001_init.sql` | Baseline: `bathrooms`, `reviews`, `saved_bathrooms`, RLS policies, the `bathrooms_nearby` RPC (pure-SQL haversine, **returns kilometers**), and the trigger that keeps `rating_avg` / `review_count` in sync. |
| `migrations/0002_profiles.sql` | `profiles` table, auto-create trigger on signup, backfill for existing users, and the `reviews_with_authors` view (reviews joined with usernames, no email exposure). |
| `migrations/0003_reviews_unique.sql` | One review per user per bathroom (`unique (user_id, bathroom_id)`), after de-duplicating existing rows. |
| `migrations/0004_delete_own_account.sql` | `delete_own_account()` RPC — lets a signed-in user permanently delete their auth row (cascades profiles, reviews, saved places). |

Every migration is idempotent (`if not exists` / `create or replace` /
`drop policy if exists`), so it is safe to run against the existing production
database without clobbering data.

## Applying

### With the Supabase CLI (recommended)

```bash
# From the client/ directory, once linked to your project:
supabase db push
```

If you have not linked yet:

```bash
supabase link --project-ref <project-ref>
```

### Manually

Paste each file, in order, into the Supabase dashboard SQL editor and run it.

## Notes

- **Units:** `bathrooms_nearby` returns `distance_km`. The Map screen converts to
  miles for display. Keep these in sync if you change the RPC.
- **Auth template:** the "Confirm signup" email template must use `{{ .Token }}`
  (not `{{ .ConfirmationURL }}`) so users receive a 6-digit code.
- **Local dev / seed:** `seed.sql` inserts a few sample bathrooms around NYC for
  manual testing. It does not insert reviews (those require real auth users).
