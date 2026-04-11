# TooDaLoo

**Yelp for public bathrooms.** Find bathrooms near you, read and write reviews, and help others in need.

TooDaLoo is a cross-platform mobile app built with Expo and React Native, backed by Supabase for auth and data.

## Why

When you're out in public and urgently need a bathroom, there's no reliable way to find one. TooDaLoo solves that with crowd-sourced, location-aware bathroom discovery.

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
