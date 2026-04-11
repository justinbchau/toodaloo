# CLAUDE.md — TooDaLoo

> Read this at the start of every session working in this repo.

---

## What This App Is

**TooDaLoo** — "Yelp for public bathrooms." A mobile app for finding bathrooms near your current location, reading reviews, and adding new locations. Solo project by Justin Chau.

**The problem:** Finding a clean, accessible public bathroom when you need one is genuinely hard. No trusted, crowd-sourced resource exists. TooDaLoo fills that gap.

---

## Codebase Location

All source code lives in:
```
/Users/justinchau/Development/toodaloo/client/
```

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | **Expo SDK 55** · React Native · TypeScript |
| UI library | **NativeWind v5** + **ThemeContext** (dark/light design tokens) |
| Navigation | **React Navigation v7** — bottom tabs + nested stacks |
| Forms | **react-hook-form + Zod** |
| Maps | react-native-maps + expo-location |
| Location search | Plain TextInput stub (Google Places autocomplete deferred — crashes on iOS) |
| Animations | Lottie v7.3.6 |
| Bottom sheet | Custom `Animated` + `PanResponder` — snaps at 25% / 50% of screen height |
| Font | **Plus Jakarta Sans** (all weights via @expo-google-fonts) |
| State | ThemeContext (dark/light) + LocationCtx (user GPS coords) |
| Backend | **Supabase** — email/OTP auth + Postgres DB |
| Testing | **jest-expo** + **@testing-library/react-native** — 106 tests across 7 suites |

### Design Tokens

**Dark mode (default):**
- bg: `#0B0B0F` · surface1: `#111118` · surface2: `#18181F` · surface3: `#1E1E28`
- text1: `#EEEEF4` · text2: `#8B8B9E` · text3: `#44444F`
- purple: `#7B6EF6` · purpleDim: `rgba(123,110,246,0.16)` · purpleText: `#A99FF9`
- green: `#34C77A` · red: `#F05A5A` · yellow: `#F5C542`

**Light mode:** bg `#F6F4FF`, surfaces stepped light, same purple accent.

All tokens live in `context/ThemeContext.tsx`. Never hardcode colors — always use `useThemeContext().colors`.

---

## Navigation Structure

```
App (Stack)
├── ToodaLoo         — landing page
├── Auth (Stack)
│   ├── Login
│   ├── SignUp
│   ├── Confirmation
│   ├── Username
│   └── Password
├── MainTabs (Bottom Tabs)
│   ├── Map
│   ├── Saved
│   ├── Add (AddBathroom)
│   └── Profile (Stack)
│       ├── ProfileMain
│       ├── Settings
│       └── Billing
├── BathroomDetail   — tap a card → full detail + reviews
└── WriteReview      — star picker + text body submission
```

**Auth routing rule:** After `supabase.auth.verifyOtp()` succeeds, `onAuthStateChange(SIGNED_IN)` fires and `AppNavigator` re-routes to `MainTabs` automatically. Do NOT call `navigation.navigate()` manually in the same flow — it races and loses. The Confirmation screen is intentionally navigation-free after verify.

---

## Screen Status

| Screen | File | Status |
|--------|------|--------|
| Landing / Home | `pages/Home.tsx` | ✅ Complete |
| Login | `pages/Login.tsx` | ✅ react-hook-form + Supabase auth |
| Sign Up | `pages/SignUp.tsx` | ✅ react-hook-form + Supabase auth |
| Confirmation | `pages/Confirmation.tsx` | ✅ OTP verify → session → AppNavigator auto-routes |
| Username | `pages/Username.tsx` | ✅ |
| Password | `pages/Password.tsx` | ✅ |
| Map | `pages/Map.tsx` | ✅ BathroomSheet + LocationCtx write — no map pins yet |
| Add Bathroom | `pages/AddBathroom.tsx` | ✅ Form UI complete — Supabase insert needs schema verification |
| Profile | `pages/Profile.tsx` | ✅ |
| Settings | `pages/Settings.tsx` | ✅ Dark mode toggle wired |
| Saved | `pages/Saved.tsx` | ✅ Placeholder |
| Billing | `pages/Billing.tsx` | Stripe TBD |
| BathroomDetail | `pages/BathroomDetail.tsx` | ✅ Ratings, amenity chips, reviews, save toggle, action row |
| WriteReview | `pages/WriteReview.tsx` | ✅ Star picker, char counter, Supabase insert |

---

## What's Left to Build

1. **Map pins** — fetch bathrooms from Supabase, render as `<Marker>` on MapView (highest value)
2. **AddBathroom → DB** — verify `bathrooms` table columns, wire form submit to Supabase insert
3. **Location search** — replace TextInput stub with working autocomplete
4. **SocialButtons** — Apple/Google OAuth; needs `mode` prop (login vs signup)
5. **Hamburger / drawer** — Map FAB `onPress` is currently a dead tap target

---

## Engineering Traps — Read Before Touching These Areas

These are non-obvious bugs we've already hit. Don't repeat them.

### 1. LocationCtx must be written from Map.tsx
`Map.tsx` is the only GPS acquisition point in the app. All downstream screens (`BathroomDetail` distance calculation, future proximity sort) read from `LocationCtx`. The pattern is:

```tsx
const { setLocation: setCtxLocation } = useContext(LocationCtx);
const setLocation = (loc: LocationObject) => {
  setLocalLocation(loc);   // for Map's own renders
  setCtxLocation(loc);     // for all other screens
};
```

If you write location only to local state, every downstream screen silently gets `undefined` and shows `'— mi'`.

### 2. Use `user?.id` not `user` as a useEffect dependency
Supabase refreshes auth tokens every ~59 minutes. Each refresh fires `onAuthStateChange` with a **new `User` object reference** even though the user hasn't changed. Using `user` as a dependency triggers a re-fetch on every token refresh. Use `user?.id` (a string) instead:

```tsx
// ✅ correct
useEffect(() => { fetchData(); }, [id, user?.id]);

// ❌ wrong — re-fetches every token refresh
useEffect(() => { fetchData(); }, [id, user]);
```

This applies in `BathroomDetail.tsx`, `Profile.tsx`, and anywhere user data gates a fetch.

### 3. Supabase mock must be thenable
The real Supabase PostgrestBuilder implements `.then()` / `.catch()` / `.finally()` so `await supabase.from('x').select().eq(...)` resolves. Test mocks must replicate this. Use the `createQueryMock` helper in `__tests__/helpers/mocks.ts`.

### 4. jest.mock factories are hoisted
Jest's Babel plugin moves all `jest.mock(...)` calls above variable declarations. Variables referenced inside a factory are `undefined` at hoist time unless they come from imports or their names start with `mock`. Use `jest.spyOn` inside individual test cases for objects that can't be imported (e.g. `Share`, `Linking`).

### 5. KeyboardAvoidingView + absolute footer
`behavior="padding"` on iOS shifts the KAV frame up. An `position: 'absolute'` footer is anchored to the shifted frame's bottom — it ends up behind the keyboard. Remove `position: 'absolute'` from footers inside a KAV; let them sit in normal flow below a `flex: 1` ScrollView.

### 6. LSP false positives — ignore "Cannot find module"
`moduleResolution: "bundler"` in `tsconfig.json` (required by Expo SDK 55) causes the TypeScript language server to report "Cannot find module" for all native packages. This does **not** affect compilation or Jest (which uses Babel). Every such error in the editor is a false positive — ignore them.

---

## Running Tests

```bash
cd client
npx jest
```

Test files live in `client/__tests__/`. Shared mocks and fixtures are in `client/__tests__/helpers/mocks.ts` (excluded from test discovery). Current coverage: **106 tests, 7 suites — all passing**.

Suites:
- `utils/geo.test.ts` — haversine distance calculations (12 tests)
- `validation/schemas.test.ts` — Zod schema validation (17 tests)
- `context/UserContext.test.tsx` — auth state machine (9 tests)
- `components/BathroomCard.test.tsx` — card render + onPress (12 tests)
- `components/BathroomSheet.test.tsx` — loading / empty / populated states (16 tests)
- `pages/WriteReview.test.tsx` — star picker, submit guard, Supabase insert (22 tests)
- `pages/BathroomDetail.test.tsx` — data load, save toggle, action buttons (18 tests)

---

## Design Assets

**Figma file:** `i2FsnAKS4ZY6XtSHX5vD4P` (editor access)
- **URL:** https://www.figma.com/design/i2FsnAKS4ZY6XtSHX5vD4P/ToodaLoo-New-File--Copy-
- **Pages:**
  - `Design System 📇` — component/token library
  - `✅ Restroom Search Flow` — completed user flow
  - `Work zone` — active working area

Claude Code has the Figma MCP plugin. Paste a Figma URL with `node-id` to pull design context directly.

---

## Vault

Project notes, decisions, and session logs live at:
```
/Users/justinchau/Second Brain/Projects/TooDaLoo/README.md
```

Update that file when making significant architectural decisions or completing a major phase.

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health

---

## Deploy Configuration (configured by /setup-deploy)
- Platform: Expo EAS (React Native mobile app)
- Project: @jchau/toodaloo (ID: 2d1c0223-c462-462d-85cc-d8a63e7ddbad)
- Expo dashboard: https://expo.dev/accounts/jchau/projects/toodaloo
- Deploy workflow: EAS Update (OTA) for JS changes; EAS Build for native changes
- Project type: React Native mobile app (Expo SDK 55)
- Backend: Supabase (managed — no server to deploy)

### Build profiles (client/eas.json)
- `development` — internal distribution, development client
- `preview` — internal distribution, iOS simulator
- `production` — auto-increment build number, App Store / Play Store

### Custom deploy hooks
- Pre-merge: `cd client && npx jest` (run test suite)
- OTA update (JS-only changes): `cd client && eas update --branch main --message "<description>"`
- Native build (new native deps or version bump): `cd client && eas build --platform all --profile production`
- Submit to App Store: `cd client && eas submit --platform ios --profile production`
- Deploy status: `cd client && eas update:list --branch main --limit 5`
- Health check: https://expo.dev/accounts/jchau/projects/toodaloo (check latest update)
