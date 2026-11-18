# toodaloo TestFlight runbook

How toodaloo gets from `main` to Justin's iPhone through TestFlight, and how
to decide whether a change needs a backend deploy, an OTA update, a TestFlight
build, or an App Store release. It is written for Justin, Claude Code, and CI,
and follows the same model as the Faros release runbook (`faros-app/docs/releasing.md`):
same Apple team, same Expo account (`jchau`), and the same `testflight` profile
and manual GitHub workflows.

`docs/RELEASE.md` describes the older `production` profile / EAS Workflows path
(`eas workflow:run production-release.yml`). This file describes the
`testflight` path. Both build from the committed bare `client/ios/` project.

---

## Status: what is in place and what is pending

| Item | State |
|---|---|
| EAS project `@jchau/toodaloo`, `updates.url`, `runtimeVersion: "1.0.0"` (`app.json`) | In repo |
| `cli.appVersionSource: "remote"`, `production` profile (store, `autoIncrement`, channel `production`) | In repo (`eas.json`) |
| Submit profile `production` with `ascAppId: 6788189154` | In repo. This suggests an App Store Connect record exists; confirm it (step S3) |
| Native project `client/ios/` (bundle id `com.jchau.toodaloo`, iOS 15.1+, location string, privacy manifest, 1024 px icon with no alpha) | In repo |
| `Podfile.lock` matches every autolinked native module in `node_modules` | Verified 2026-11-18 |
| `testflight` build and submit profiles in `eas.json` | **Pending.** Proposed change, apply before the first run |
| `.github/workflows/testflight.yml` and `testflight-submit.yml` | **Pending.** Proposed change, apply before the first run |
| `ITSAppUsesNonExemptEncryption = false` in `ios/toodaloo/Info.plist` | **Pending.** Until it lands, answer export compliance by hand for each build (Troubleshooting) |
| `ios/toodaloo/Supporting/Expo.plist` committed with updates enabled | **Pending.** EAS CLI fixes it at build time; see Troubleshooting "Expo.plist modified after a build" |
| `EXPO_TOKEN` GitHub secret, EAS `preview` env vars, ASC API key on EAS, signing credentials | **Justin, one time** (setup checklist below) |

Until the pending repo changes land, use the CLI fallback in "Fastest path".

---

## Authorization boundary

A recommendation is not authorization to release.

Agents must not start an EAS build, submit a build, publish or promote an EAS
Update, push Supabase migrations or content, create a release tag, or release
to the public App Store unless Justin explicitly authorizes that action. After
making a recommendation, ask whether to run it now, defer it, or only record
it. A public App Store release needs its own explicit approval, even when a
TestFlight build already exists.

Anything that uses Justin's Apple or Expo accounts (`eas login`, `eas build`,
`eas submit`, `eas update`, `eas credentials`, `eas env:*`, App Store Connect,
GitHub secrets) is marked **[Justin]** below.

---

## One-time setup checklist [Justin]

Do these once. Each step says how to check whether it is already done.

**S0. Apple Developer Program.** Membership is active. Before a release, check
it hasn't expired (developer.apple.com → Account → Membership details).

**S1. Expo access.** Make sure you can act as the `jchau` owner.

```bash
cd client
npx eas-cli@latest login          # or: npm i -g eas-cli && eas login
eas whoami                         # should print jchau (or an account with access to @jchau/toodaloo)
eas project:info                   # should show @jchau/toodaloo, id 2d1c0223-…
```

**S2. Bundle identifier.** `com.jchau.toodaloo` must be registered on the same
Apple team as Faros. EAS registers it the first time it creates credentials (S4).
Check it at developer.apple.com → Certificates, IDs & Profiles → Identifiers.

**S3. App Store Connect app record.** Pick the branch that applies.

- **The record already exists.** This is likely: `eas.json` already pins
  `ascAppId: 6788189154`. Open App Store Connect → Apps → toodaloo → App
  Information and check that **Apple ID** = `6788189154` and **Bundle ID** =
  `com.jchau.toodaloo`. If both match, you're done; the proposed `testflight`
  submit profile reuses that ID.
- **No record yet, or the ID doesn't match.** Create one at App Store Connect →
  Apps → **+** → New App. Choose platform iOS, name "toodaloo" (the name must be
  unique on the App Store; pick a variant if it's taken), the primary language,
  bundle ID `com.jchau.toodaloo`, any SKU (for example `toodaloo-ios`), and Full
  Access. Then copy App Information → **Apple ID** into
  `submit.testflight.ios.ascAppId` (and `submit.production.ios.ascAppId`) in
  `eas.json`. Running `eas submit` interactively once can also create the record
  for you, but the CI workflow runs `--non-interactive` and needs `ascAppId` set.

**S4. Signing credentials (Distribution Certificate + Provisioning Profile).**
Credentials belong to the bundle id, not to a build profile, so `production` and
`testflight` share them.

```bash
cd client
eas credentials --platform ios     # pick a store profile (testflight or production)
```

- If it shows a valid Distribution Certificate and an App Store provisioning
  profile for `com.jchau.toodaloo`, you're done.
- If not, let EAS generate them. If Apple reports the team is at its
  certificate limit, choose **Use an existing Distribution Certificate** and
  pick the one Faros uses (same team).
- EAS will not create the *first* certificate in `--non-interactive` mode, so
  this step has to happen in a terminal before the GitHub workflow can build.

**S5. App Store Connect API key on EAS** (lets submits run non-interactively).
In the same `eas credentials --platform ios` menu, open **App Store Connect:
Manage your API Key**. ASC API keys belong to the team, so you can **reuse the
key Faros already uses** rather than making a new one. The `.p8` stays out of
git (`*.p8` is gitignored); never put the Key ID or Issuer ID in `eas.json`.

**S6. Supabase variables in the EAS `preview` environment.** The `testflight`
profile reads `environment: "preview"`. `EXPO_PUBLIC_*` values are inlined into
the JS bundle at build time, and `lib/supabase.ts` throws at startup if they're
missing, so **a build without them crashes on launch.**

```bash
cd client
eas env:list --environment preview                       # check what's there
# If missing (paste values when prompted; use the anon/publishable key, NEVER service_role):
eas env:create --environment preview --name EXPO_PUBLIC_SUPABASE_URL      --visibility plaintext
eas env:create --environment preview --name EXPO_PUBLIC_SUPABASE_ANON_KEY --visibility plaintext
```

Decide which Supabase project TestFlight testers should hit: production, or a
separate staging project. Whatever is in `preview` is what the TestFlight app
talks to.

**S7. `EXPO_TOKEN` GitHub secret.** Create a token at expo.dev → Account
settings → Access tokens (a robot user scoped to `jchau` is fine). Add it as a
repository secret on the toodaloo repo:

```bash
gh secret set EXPO_TOKEN --repo <owner>/toodaloo   # paste the token at the prompt
```

or GitHub → toodaloo → Settings → Secrets and variables → Actions → New
repository secret. It is the only secret the workflows use; EAS supplies the
env vars and signing.

**S8. TestFlight internal group.** App Store Connect → toodaloo → TestFlight →
Internal Testing → **+** → name it (e.g. "Owner"). Optionally tick **Enable
automatic distribution**. Then Invite Testers → add yourself (Account Holder
and Admin users qualify; you can have up to 100 internal testers). Internal
testing needs **no App Review**. Builds stay installable for 90 days.

**S9. On the iPhone.** Install **TestFlight** from the App Store and sign in
with the Apple ID that is the App Store Connect user from S8.

---

## Fastest path to your own iPhone

**Recommendation: TestFlight internal testing.** You already have Apple
membership and (very likely) the App Store Connect record, and it's the same
pipeline Faros uses. Internal TestFlight skips App Review and needs no device
UDID registration. Ad hoc / `distribution: internal` builds would mean
registering the phone with `eas device:create` and a separate ad hoc profile.
A development build would need Metro running. Neither is a reusable release
path.

Once the setup checklist is done:

**A. Via GitHub (after the pending workflows land).**

1. GitHub → Actions → **TestFlight build** → Run workflow, from `main`, with
   ref `main`. It runs `tsc` and Jest, then
   `eas build --platform ios --profile testflight --non-interactive --wait`.
2. Copy the EAS build ID from the run summary. Look at the build on expo.dev:
   status finished, version, build number, and that the logs say
   `Environment variables … loaded from the "preview" environment: EXPO_PUBLIC_SUPABASE_ANON_KEY, EXPO_PUBLIC_SUPABASE_URL`.
3. GitHub → Actions → **TestFlight submit** → Run workflow from `main` with
   that build ID.
4. Wait for Apple processing, usually 10–15 minutes. Answer export compliance
   if asked (Troubleshooting), add the build to your internal group (if
   automatic distribution is off), then open TestFlight on the phone and
   **Install**.

**B. CLI fallback [Justin], from a Mac or any machine with Node 20.19+.**
It works today with the existing `production` profile. Once the profiles land,
swap in `testflight`.

```bash
cd client
npm ci
npx tsc --noEmit && npm test
eas build  --platform ios --profile testflight            # or: --profile production (works today)
eas submit --platform ios --profile testflight --latest   # or: --id <EAS build id>
```

The first `eas build` runs interactively. Let it log in to Apple and reuse or
generate credentials (S4). After that, add `--non-interactive`.

---

## Determine the release baseline

Release impact is cumulative. A text-only change can still need a binary if
an earlier unshipped commit changed native code.

1. Find the source commit of the last build actually installed via TestFlight.
   Prefer a verified annotated tag `testflight/<version>-<build>`. **There
   are no such tags yet (Baseline: unknown).** After the first verified
   TestFlight build, create one with Justin's go-ahead.
2. Compare that commit with the candidate: `package.json`, `package-lock.json`,
   `app.json`, `eas.json`, `ios/**`, `supabase/migrations/**`.
3. If the baseline is unknown, assume the safer boundary (`TESTFLIGHT`).

As of 2026-11-18, the native module set (`ios/Podfile.lock`) has not changed
since the pipeline commit `5dedbfe`. The only dependency added since then,
`@gorhom/bottom-sheet`, is JS-only.

## Release types

Choose the highest required type across the cumulative diff.

### `NONE`

Nothing deployed or installed changes: docs, tests, developer tooling.

### `CONTENT_OR_BACKEND`

Only Supabase content, server configuration, or a backwards-compatible
migration (`client/supabase/migrations`). Installed apps stay compatible. Use
expand → migrate → contract: additive schema first, then app code that uses it,
and remove old schema only after no installed build depends on it. If app code
and schema depend on each other, deploy the backend first.

### `OTA_PREVIEW`

toodaloo **has** EAS Update configured: `expo-updates`, `updates.url`, a static
`runtimeVersion: "1.0.0"`, and build-profile channels. Eligible changes are
JS/TS, styles, copy, and bundled assets that don't change the native runtime.

A build gets an update only when platform, `runtimeVersion`, and channel all
match. The proposed `testflight` profile embeds channel `preview`, so publish
there first, and always pass the environment that build used:

```bash
cd client
eas update --channel preview --environment preview --message "<what changed>"
```

`--environment` is required for SDK 55+. Without it in CI, the bundle is built
with no Supabase variables and the app throws on launch. Verify on the
installed TestFlight build (force-quit and relaunch twice: the first launch
downloads the update, the second runs it). Ask separately before promoting to
`production`. If compatibility is uncertain, recommend `TESTFLIGHT`.

### `TESTFLIGHT`

Any native runtime or native configuration change, including:

- adding, removing, or upgrading a dependency that has native code (a pod),
  or an Expo SDK / React Native upgrade;
- anything under `client/ios/` (Info.plist strings, entitlements, icons,
  splash, Podfile/Podfile.lock, `Expo.plist`);
- bundle id, URL scheme, permissions, privacy manifest, signing;
- `updates.url`, `runtimeVersion`, or a profile's `channel`;
- the first install on a device, or any change whose native compatibility you
  can't establish.

**Bare-workflow note:** `client/ios/` is committed, so `app.json`
`ios`/`plugins`/`icon`/`splash`/`orientation` are **not** applied by EAS
(expo-doctor flags this). Make native changes in `ios/` directly, or mirror
them in both places.

For a native change, bump `runtimeVersion` in `app.json` (static string, e.g.
`"1.0.0"` → `"1.1.0"`) **and** cut a new build. Otherwise an OTA meant for the
new binary could reach an old one that lacks the native code, and it crashes.

### `APP_STORE`

Only when Justin's stated goal is a public release of a TestFlight-accepted
build. It needs explicit approval, App Store metadata, the App Privacy
questionnaire, screenshots, and App Review. Code changes never imply it.

## Decision order

1. Public distribution explicitly intended and ready → `APP_STORE`.
2. Native/runtime change, first install, or compatibility uncertain → `TESTFLIGHT`.
3. Compatible JS/asset change, with an update-enabled build installed → `OTA_PREVIEW`.
4. Backend/content-only change → `CONTENT_OR_BACKEND`.
5. No deployed behavior changed → `NONE`.

File paths are signals, not proof. `package.json`, the lockfile, `app.json`,
and `eas.json` need semantic inspection. A screen change can still depend on
a new native module or a migration.

## Required agent report

At the end of every task in scope:

```text
Release impact
Recommendation: NONE | CONTENT_OR_BACKEND | OTA_PREVIEW | TESTFLIGHT | APP_STORE
Baseline: <verified testflight/* tag + build, or unknown>
Current-task evidence: <files and semantic changes>
Cumulative evidence: <unshipped changes that raise or confirm the boundary>
Required order: <backend first, app first, or not applicable>
Release status: not started | partially complete | verified complete
Decision: <no release required, or ask Justin to run now / defer / record only>
```

## TestFlight preflight

1. Confirm the candidate commit is on `main` and the working tree is clean.
2. `cd client && npm ci && npx tsc --noEmit && npm test` all pass, along with CI.
3. If the build depends on new Supabase schema, apply and verify the migration
   first (backend before app).
4. `eas env:list --environment preview` shows only the two public
   `EXPO_PUBLIC_SUPABASE_*` values, pointing at the intended project.
5. Bump `runtimeVersion` if native code changed since the baseline.
6. Write down the tester-visible changes and the smoke-test plan.

## Verification and release record

Record each of these as a separate fact:

1. EAS build ID, source commit, app version, and build number.
2. Build log shows the `preview` env vars loaded and channel `preview`.
3. EAS submission ID and a successful upload.
4. Apple processing finished; export compliance answered.
5. Build added to the internal group; tester access confirmed.
6. Device smoke test (below).

Only after that, and with Justin's go-ahead, create an annotated tag
`testflight/<version>-<build>` on the source commit.

## toodaloo smoke-test minimum

- Install from TestFlight and cold launch. A crash on launch almost always
  means the Supabase env vars weren't inlined.
- The location prompt shows "Allow toodaloo to use your location to find
  bathrooms near you." The map loads nearby pins.
- Email OTP sign-up/sign-in. The session survives a relaunch.
- Bathroom detail, save/unsave (undo toast), write/edit/delete a review, report.
- Add a bathroom, including the duplicate warning.
- Settings shows the expected version.
- Anything named in the release notes.

Passing EAS Build or EAS Submit is not device acceptance.

---

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| App crashes immediately on launch | `EXPO_PUBLIC_SUPABASE_URL`/`_ANON_KEY` missing from the build's EAS environment (`lib/supabase.ts` throws). Check the build log line "Environment variables … loaded from the "preview" environment", fix with S6, rebuild. For an OTA, you forgot `--environment preview`. |
| Build shows **Missing Compliance** in TestFlight and testers can't install | `ITSAppUsesNonExemptEncryption` isn't in `ios/toodaloo/Info.plist` yet. In App Store Connect → TestFlight → the build → Manage, declare that the app uses only standard/exempt encryption (HTTPS via the OS). Permanent fix: the proposed Info.plist key. |
| `Distribution Certificate is not validated for non-interactive builds` / credentials errors in the GitHub workflow | S4 not done. Run `eas credentials --platform ios` (or one interactive `eas build`) once in a terminal. |
| `You have reached the maximum number of certificates` | Same Apple team as Faros. Reuse Faros's distribution certificate in `eas credentials`, or revoke an unused one. |
| `App Store Connect API Keys cannot be set up in --non-interactive mode` | S5 not done. Assign an ASC API key (Faros's works) under `eas credentials --platform ios`. |
| `ascAppId` missing / submit can't find the app | S3. Put the record's Apple ID in `submit.testflight.ios.ascAppId`. |
| Upload rejected: bundle version must be higher than the previously uploaded version | The remote build number is behind App Store Connect (e.g. builds uploaded before `appVersionSource: remote`). Run `eas build:version:set --platform ios` to set it above the highest build in App Store Connect, then rebuild. |
| Upload rejected for SDK/Xcode version | Since 2026-04-28 Apple requires Xcode 26 / iOS 26 SDK. The default EAS image for SDK 55 is Xcode 26.2, so don't pin an older `ios.image`. |
| `pod install` fails on EAS ("could not find compatible versions", or a missing `node_modules/...` pod path) | `ios/Podfile.lock` is out of sync with `node_modules`. On a Mac: `cd client/ios && pod install` (use `pod update <Pod>` when a version is locked), then commit `Podfile.lock`. It is in sync as of 2026-11-18. |
| `npm ci` fails on EAS or CI | `package.json` and `package-lock.json` disagree. Run `npm install`, then commit the lockfile. |
| `Expo.plist` shows as modified after a local `eas build`, and `eas update` complains the repo is dirty | Bare project: EAS CLI runs `expo-updates configuration:syncnative`, which rewrites the committed `Expo.plist` (`EXUpdatesEnabled` false → true, plus URL and runtime version). Commit the synced file (proposed change). |
| OTA doesn't arrive on the TestFlight build | Channel, runtime, or platform mismatch. The build must be on channel `preview` (check the build page), and the update must target the same `runtimeVersion` (`1.0.0`). Relaunch twice. `eas update:list --branch preview`. |
| `app.json` change (icon, splash, plugin, permission string) has no effect | Bare workflow: edit `client/ios/` directly (see TESTFLIGHT note above). |
| Build not in the TestFlight app | Still processing (10–15+ min); not added to the internal group; or the tester's Apple ID isn't the App Store Connect user. |

## Official references

- EAS Submit for iOS: https://docs.expo.dev/submit/ios/
- EAS environment variables: https://docs.expo.dev/eas/environment-variables/
- EAS build server images (SDK 55 → Xcode 26.2): https://docs.expo.dev/build-reference/infrastructure/
- EAS app version management: https://docs.expo.dev/build-reference/app-versions/
- Apple upload SDK requirement (Xcode 26 from 2026-04-28): https://developer.apple.com/news/upcoming-requirements/
- Export compliance: https://developer.apple.com/documentation/security/complying-with-encryption-export-regulations
- Add internal testers: https://developer.apple.com/help/app-store-connect/test-a-beta-version/add-internal-testers
