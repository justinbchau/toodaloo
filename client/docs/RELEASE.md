# Release runbook (iOS)

How toodaloo gets from `main` to a tester's phone. iOS-only (MVP decision).

The pipeline is **EAS**: cloud builds, TestFlight submission, and over-the-air
(OTA) JS updates. Config lives in `eas.json`, `app.json` (`updates`,
`runtimeVersion`), and `.eas/workflows/production-release.yml`.

---

## The one decision: native change or JS-only?

This is the whole runbook in one rule.

| You changed… | Ship it with… | Reaches users… |
|---|---|---|
| **Native** — a new library with native code, a config plugin, `app.json` `ios`/`plugins`, a permission string, the SDK version | a **new build + submit** (§1) | after an App Store / TestFlight review |
| **JS/TS/assets only** — screens, logic, styles, images | an **OTA update** (§2) | in seconds, no review |

When unsure, assume **native** and cut a build — an OTA update against a binary
that lacks the native code you rely on will crash on the client.

---

## 1. Cut a production build → TestFlight

Builds a store binary against **prod** Supabase and submits it to App Store
Connect. One command:

```bash
cd client
eas workflow:run production-release.yml
```

This runs the two-stage workflow (`.eas/workflows/production-release.yml`):
`build_ios` → `submit_ios` (TestFlight). Once credentials are bootstrapped (see
First-run notes), there are no Apple prompts — signing is EAS-managed and the
TestFlight submit uses the stored App Store Connect API key.

Prefer to drive the stages by hand?

```bash
eas build --platform ios --profile production      # cloud build
eas submit --platform ios --profile production      # push the finished build to TestFlight
# (or one shot:)
eas build --platform ios --profile production --auto-submit
```

**Before a native release, if native code changed**, bump `runtimeVersion` in
`app.json` (see §3). The iOS **build number** auto-increments on EAS
(`cli.appVersionSource: "remote"` + `autoIncrement`) — you do not touch it.

After the build finishes, it appears in App Store Connect → TestFlight within a
few minutes (Apple processing), then it's installable via the TestFlight app.

---

## 2. Ship a JS-only fix (OTA update)

No rebuild, no review. Publishes to the `production` channel that production
builds subscribe to:

```bash
cd client
eas update --channel production --message "Fix: <what changed>"
```

Installed apps pick it up on next launch. This ONLY works for JS/TS/asset
changes on the **same** `runtimeVersion` as the installed binary — that is the
guardrail that stops an update from reaching a binary it's incompatible with.

---

## 3. Version fields — what to bump, when

| Field | Where | When | How |
|---|---|---|---|
| `runtimeVersion` | `app.json` | **Native change only** | Bump **manually** (static string, e.g. `"1.0.0"` → `"1.1.0"`). Must stay a static string — `fingerprint`/`appVersion` policies broke local `expo start` in this bare workflow (PR #5). A new runtimeVersion means old binaries stop receiving new OTA updates until they update the binary. |
| iOS build number | EAS servers | Every production build | **Automatic** (`appVersionSource: remote` + `autoIncrement`). Don't edit by hand. |
| `version` (marketing) | `app.json` | New App Store release | Manually, per your public versioning. |

Rule of thumb: **native change → bump `runtimeVersion` AND cut a new binary.**
**JS-only change → leave `runtimeVersion`, publish an OTA update.**

---

## Configuration reference (already set up — one-time)

- **EAS project:** `@jchau/toodaloo` (`extra.eas.projectId` in `app.json`).
- **GitHub:** repo connected to the Expo project (required for cloud builds).
- **Env vars:** `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` are
  stored as **EAS environment variables** (plaintext, in the `production` and
  `preview` environments) and injected at build time — production does **not**
  read a local `.env`. Update them with
  `eas env:create --environment production --force`. (These are the publishable
  anon URL/key, safe to ship; never the `service_role` key.)
- **iOS signing:** EAS-managed (remote credentials). Generated on first setup.
- **App Store Connect API key:** the `.p8` lives at `client/credentials/`
  (gitignored by `*.p8`, never committed). To keep this **public** repo free of
  credential identifiers, the Key ID / Issuer ID are deliberately **not** in
  `eas.json` — the key is registered once, server-side, via
  `eas credentials --platform ios` (production → *App Store Connect: Manage your
  API Key*). After that, every `eas submit` / the `testflight` workflow job uses
  the stored key non-interactively, and the first submit creates the ASC app
  record if it doesn't exist yet.

## First-run notes (one-time credential bootstrap)

- iOS signing + submit credentials are set up **once, interactively**:
  `eas credentials --platform ios` → select `production` → generate the
  Distribution Certificate + Provisioning Profile, and set up the App Store
  Connect API Key. EAS deliberately won't mint the *first* Distribution
  Certificate in non-interactive mode (an Apple-safety guardrail against
  burning the 2-cert limit), so this step needs a terminal. After it, all
  builds/submits/updates run non-interactively (CLI, workflow, or MCP).
- The `production` EAS Update channel + branch are already created (during
  pipeline setup); the first `eas update --channel production` publishes to it.

## Security follow-ups (before public release)

- **EAS Update code signing is not yet configured.** Without it, a compromised
  update channel or Expo account could push unsigned JS to installed apps.
  Acceptable for internal TestFlight; set up before a public App Store release:
  `npx expo-updates codesigning:generate` + `codesigning:configure`, then ship a
  new binary embedding the public key.
