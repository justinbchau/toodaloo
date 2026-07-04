# toodaloo

**Yelp for public bathrooms.** Find bathrooms near you, read and write reviews, and help others in need.

toodaloo is a cross-platform mobile app built with Expo and React Native, backed by Supabase for auth and data.

## Why

When you're out in public and urgently need a bathroom, there's no reliable way to find one. toodaloo solves that with crowd-sourced, location-aware bathroom discovery.

## Stack

| Layer | Choice |
|-------|--------|
| Framework | Expo SDK 55 · React Native 0.83 · React 19 · TypeScript |
| Navigation | React Navigation v7 — bottom tabs + nested stacks |
| Forms | react-hook-form + Zod |
| Maps | react-native-maps + expo-location |
| Styling | StyleSheet + `ThemeContext` (dark/light tokens); NativeWind v4 installed |
| Fonts | Plus Jakarta Sans (via `@expo-google-fonts`) |
| State | `ThemeContext`, `LocationContext` |
| Backend | Supabase — Postgres + email OTP auth |
| Testing | jest-expo + @testing-library/react-native |
| Deploy | EAS Build + EAS Update (OTA) |

## Repo layout

```
toodaloo/
├── client/              # Expo app (all application code lives here)
│   ├── App.tsx
│   ├── pages/           # Screens (Home, Map, AddBathroom, BathroomDetail, ...)
│   ├── components/
│   ├── navigation/      # AppNavigator + stack definitions
│   ├── context/         # ThemeContext, LocationContext
│   ├── lib/              # Supabase client, helpers
│   ├── supabase/        # Migrations + RPCs
│   ├── __tests__/
│   ├── ios/             # Bare workflow — native Xcode project
│   ├── app.json
│   └── eas.json
└── README.md
```

## Getting started

Prerequisites: Node 20+, Xcode (for iOS), an [Expo account](https://expo.dev/), and a Supabase project.

```bash
cd client
npm install
```

Create `client/.env`:

```
EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

Run the dev client:

```bash
npm run ios       # iOS simulator (recommended)
npm run android   # Android emulator
npm start         # Metro bundler only
```

> **Note:** This is a bare-workflow Expo project (`client/ios/` exists). `npm run ios` runs a native build via `expo run:ios`. Expo Go is not supported.

## Working in Conductor worktrees

This repo is set up for [Conductor](https://www.conductor.build), which runs coding agents in isolated git worktrees. Config lives in `.conductor/settings.toml` and `.worktreeinclude` and is shared with everyone who uses the project.

What Conductor does automatically for each new workspace:

- **Setup** (`scripts.setup`): copies `client/.env` from your main checkout into the worktree, then runs `npm install` inside `client/`.
- **Files to copy** (`.worktreeinclude`): copies the gitignored `client/.env` into new local (Mac) workspaces. (Cloud workspaces don't run this step — the setup script handles the copy there.)
- **Run** (`scripts.run`): a menu of commands, each launched from the workspace and given a unique `$CONDUCTOR_PORT` so parallel workspaces don't collide:
  - `metro` (default) — `expo start --dev-client`
  - `test` — `jest --watch`
  - `typecheck` — `tsc --noEmit`
  - `ios` / `android` — native builds (local only)
- **Run mode** is `concurrent`, so multiple workspaces can run Metro at the same time.

Host prerequisites Conductor can't provision (install these once on the machine running the workspaces):

- **Node 20+** — for `npm install` and Metro.
- **`client/.env`** in your main checkout — with the Supabase and Google Maps keys (see [Getting started](#getting-started)). This is the file that gets copied into every worktree.
- **Xcode** (macOS) — only for the `ios` run script.
- **JDK 17 + Android SDK** — only for the `android` run script. **JDK 21 is not supported** (Gradle 9 fails with an `IBM_SEMERU` toolchain error); point `JAVA_HOME` at a JDK 17 install.

If you'd rather not commit these files, paste the `scripts.setup` command and the run commands above into Conductor's **Settings → project** UI instead.

## Testing

```bash
npm test              # full suite
npm run test:coverage # with coverage report
```

The suite uses `jest-expo` preset and `@testing-library/react-native` for component queries.

## Supabase

Schema is managed via SQL migrations under `client/supabase/`. Core tables:

- `bathrooms` — name, address, lat/lng, tags, access type, `is_24_hours`, `rating_avg`, `review_count`
- `reviews` — linked to bathrooms and users; a trigger keeps `rating_avg` + `review_count` in sync
- `saved_bathrooms` — user ↔ bathroom composite PK

Core RPC:

- `bathrooms_nearby(user_lat, user_lng, radius_km)` — haversine distance in pure SQL (no PostGIS). Called by the Map screen.

RLS is enabled on all three tables.

**Auth:** email OTP. The Supabase "Confirm signup" template must use `{{ .Token }}` (not `{{ .ConfirmationURL }}`) so users receive a 6-digit code instead of a magic link.

## Deployment

Built and distributed via [EAS](https://expo.dev/eas). Three profiles are defined in `client/eas.json`: `development`, `preview` (simulator), and `production`. OTA JS updates are delivered through EAS Update; native builds are only cut for native module changes, Expo SDK upgrades, or store releases.
