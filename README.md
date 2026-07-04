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
│   ├── android/         # Bare workflow — native Gradle project
│   ├── app.json         # Static Expo config
│   ├── app.config.js    # Dynamic config (Android + env-driven values)
│   ├── .env.example
│   └── eas.json
└── README.md
```

## Getting started

Prerequisites: Node 20+, an [Expo account](https://expo.dev/), and a Supabase project. For local native builds you also need Xcode (iOS) and/or the Android SDK + JDK 17 (Android). If you only build via EAS, neither native toolchain is required locally.

```bash
cd client
npm install
```

Create `client/.env` (see `client/.env.example`):

```
EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
# Android only — required for react-native-maps to render the map:
GOOGLE_MAPS_ANDROID_API_KEY=<android-maps-key>
```

Run the dev client:

```bash
npm run ios       # iOS simulator (recommended)
npm run android   # Android emulator
npm start         # Metro bundler only
```

> **Note:** This is a bare-workflow Expo project (`client/ios/` and `client/android/` exist). `npm run ios` / `npm run android` run native builds via `expo run:*`. Expo Go is not supported.

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

## Native builds & deployment

The app is built and distributed via [EAS](https://expo.dev/eas). This is the recommended path for both platforms — it builds iOS in the cloud (no Mac required) as well as Android.

### Config source of truth

Native config comes from `app.json` + `app.config.js`. `app.config.js` is loaded on top of `app.json` and adds the Android package, location permissions, and the Google Maps key (read from `GOOGLE_MAPS_ANDROID_API_KEY`). After changing either file, regenerate the native projects:

```bash
cd client
npx expo prebuild --platform android   # or: --platform ios, or both
```

The committed `ios/` and `android/` directories are the generated output; treat the config files as the source of truth.

### Build profiles (`client/eas.json`)

- `development` — dev client, internal distribution (APK on Android, simulator on iOS)
- `preview` — internal distribution for QA (APK / simulator)
- `production` — store builds (Android App Bundle), `autoIncrement` version, `remote` version source

```bash
npm i -g eas-cli
eas login
eas build --profile preview --platform android
eas build --profile production --platform all
```

### Environment variables for builds

`EXPO_PUBLIC_*` values are embedded in the JS bundle (safe for the Supabase anon key, which is protected by RLS). Provide them per environment as [EAS environment variables](https://docs.expo.dev/eas/environment-variables/):

```bash
eas env:create --environment production --name EXPO_PUBLIC_SUPABASE_URL --value https://<project>.supabase.co
eas env:create --environment production --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value <anon-key>
# Sensitive — restrict by package + SHA-1 in Google Cloud Console:
eas env:create --environment production --name GOOGLE_MAPS_ANDROID_API_KEY --value <android-maps-key> --visibility secret
```

The `environment` key in each `eas.json` profile selects which set of variables is injected.

### Local Android builds (optional)

To build Android locally without EAS you need **JDK 17** and the **Android SDK** (`platform-tools`, `platforms;android-36`, `build-tools;36.0.0`, plus the NDK/CMake for the new architecture). Set `ANDROID_HOME`, then:

```bash
cd client && npm run android
```

iOS local builds require macOS + Xcode (`npm run ios`).

### Updates

OTA JS updates are delivered through EAS Update (channels match the build profiles: `development` / `preview` / `production`). New native builds are only required for native module changes, Expo SDK upgrades, or store releases.
