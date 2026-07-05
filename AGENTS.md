# toodaloo — agent instructions

Expo SDK 55 / React Native 0.83 app in **`client/`**. Supabase backend (Postgres + email OTP). Bare workflow (`client/ios/` exists; Android via `expo prebuild` when enabled).

## First-time environment bootstrap (use MCP)

When `client/.env` is missing or the database schema is not applied, run this bootstrap **using the Supabase and Expo MCP servers** (configured in `.cursor/mcp.json`). Confirm OAuth for both servers under **Cursor Settings → Tools & MCP** before starting.

### 1. Supabase credentials → `client/.env`

Use Supabase MCP:

1. `list_projects` — find the toodaloo project (or ask the user which project to use).
2. `get_project_url` — API URL for that project.
3. `get_publishable_keys` — use the **anon** / publishable key (never the service role key in the app).

Write `client/.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=<url from get_project_url>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key from get_publishable_keys>
GOOGLE_MAPS_ANDROID_API_KEY=
```

(`GOOGLE_MAPS_ANDROID_API_KEY` is optional for iOS; required for Android map tiles.)

### 2. Apply database migrations

Migrations live in `client/supabase/migrations/` (0001 → 0003, run in order).

Use Supabase MCP:

1. `list_tables` — check whether `bathrooms`, `reviews`, `profiles` already exist.
2. If missing, `apply_migration` for each file (name = filename without `.sql`, query = file contents), **or** run `execute_sql` with each migration body in order.

Also verify:

- Auth email template uses `{{ .Token }}` (6-digit OTP), not `{{ .ConfirmationURL }}`.
- Optionally run `client/supabase/seed.sql` via `execute_sql` for NYC sample bathrooms.

### 3. Expo / EAS sanity check

Use Expo MCP to confirm the linked EAS project:

- EAS project ID in `client/app.json` → `extra.eas.projectId` (`2d1c0223-c462-462d-85cc-d8a63e7ddbad`).
- Search docs if needed for SDK 55 / dev-client workflows.

For **local simulator automation** (screenshots, UI taps), the user must run Metro with MCP enabled on their Mac:

```bash
cd client && npm run start:mcp
```

Then reconnect the Expo MCP server in Cursor after Metro starts.

### 4. Install deps and verify

```bash
cd client && npm install && npm test && npx tsc --noEmit
```

## Day-to-day commands

| Task | Command |
|------|---------|
| Metro (dev client) | `cd client && npm start` |
| Metro + local Expo MCP | `cd client && npm run start:mcp` |
| Tests | `cd client && npm test` |
| Typecheck | `cd client && npx tsc --noEmit` |
| iOS (macOS + Xcode) | `cd client && npm run ios` |
| Push DB migrations (CLI) | `cd client && supabase db push` |

## Security

- Never commit `client/.env` or put service-role keys in the app.
- Prefer Supabase MCP **project scoping** (`?project_ref=...`) and review every MCP tool call before approving.
- Use a **development** Supabase project, not production, when experimenting with MCP SQL tools.

## Repo layout

- `client/pages/` — screens
- `client/supabase/migrations/` — schema source of truth
- `client/lib/supabase.ts` — Supabase client (reads `EXPO_PUBLIC_*` env vars)
- `.cursor/mcp.json` — Supabase + Expo MCP server URLs for Cursor
