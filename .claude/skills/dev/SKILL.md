---
name: dev
description: >
  Launch the toodaloo Expo app locally on an iOS simulator against an isolated
  local Supabase stack. Use whenever asked to run, start, spin up, boot, or
  screenshot the app for local development, or to bring up / reset / inspect the
  local Supabase database. This is the project's canonical "run the app" entry
  point — prefer it over ad-hoc `expo`/`supabase` commands.
---

# Local dev environment (toodaloo)

Everything routes through **`client/scripts/dev.sh`** — a single, idempotent
launcher. This skill tells you which subcommand to run and how to run it well.
Never reinvent these steps with raw `expo`/`supabase` calls; the script encodes
the Colima and env-file specifics that make it work on this machine.

## Architecture (why it's built this way)

- **Isolated data.** `dev.sh db:up` runs a local Supabase stack in Docker (via
  **Colima**, not Docker Desktop) and applies `client/supabase/migrations/0001–0003`
  + `seed.sql`. Dev never touches the remote/prod project.
- **Non-destructive env switch.** The script writes the local stack's URL + anon
  key to `client/.env.development.local`, which Expo loads **ahead of** `.env` in
  development. The prod `.env` is left untouched; deleting `.env.development.local`
  (and restarting Metro with `-c`) falls back to remote.
- **`EXPO_PUBLIC_*` vars are inlined by Metro at bundle time**, not baked into the
  native binary — so switching backends only needs a Metro restart, never a rebuild.
- **iOS simulator reaches `127.0.0.1` directly**, so the local API just works.
- Studio and the analytics/vector stack are **disabled in `supabase/config.toml`**
  because they need chown/docker-socket behavior Colima's sshfs mounts don't support.
  Inspect data with `dev.sh db:psql` instead of the Studio GUI.

## The commands

Run from anywhere; the script cd's into `client/` itself.

| Goal | Command |
|---|---|
| Everyday: bring up DB + sim + app | `client/scripts/dev.sh up` |
| Preflight the toolchain | `client/scripts/dev.sh doctor` |
| Start/refresh local Supabase + env | `client/scripts/dev.sh db:up` |
| Wipe + re-seed local DB | `client/scripts/dev.sh db:reset` |
| Regenerate `types/database.ts` | `client/scripts/dev.sh db:types` |
| psql shell on local DB | `client/scripts/dev.sh db:psql` |
| Build/install dev client (first run) | `client/scripts/dev.sh ios` |
| Metro only (dev client installed) | `client/scripts/dev.sh start` |
| Stop local Supabase | `client/scripts/dev.sh db:down` |

Target simulator defaults to **iPhone 17 Pro**; override with `TOODALOO_SIM`,
e.g. `TOODALOO_SIM="iPhone 15" client/scripts/dev.sh up`.

## How to run it (important for the agent)

- `ios`, `start`, and `up` end in a **long-running foreground process** (Metro /
  the Xcode build). Launch these with `run_in_background: true` and then poll
  output — do **not** block on them.
- The **first** `up` (or `ios`) compiles native code + CocoaPods and can take
  5–10 minutes. Subsequent launches are fast (`start` reuses the installed client).
- Always run `doctor` first if anything seems off. The most common failure is the
  Docker daemon being down → the script auto-starts Colima, but if that fails tell
  the user to run `colima start`.
- After the app boots, verify against local data (the 5 seeded bathrooms), and
  read OTP sign-in codes from **Inbucket at http://127.0.0.1:54324** — no real
  emails are sent locally.

## Promoting schema changes to prod

Local iteration uses the Supabase **CLI** (above). To push a vetted migration to
the hosted project, use the Supabase **MCP** tools (`apply_migration`,
`get_advisors` for a security/perf lint, `generate_typescript_types`). Keep the
two lanes separate: CLI = local, MCP = remote.
