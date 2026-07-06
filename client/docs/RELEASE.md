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
`build_ios` (profile `production`) → `submit_ios` (profile `production`). No
Apple prompts — signing is EAS-managed and submission uses the App Store Connect
API key.

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
  stored as **EAS project secrets** and injected at build time — production does
  **not** read a local `.env`. Update them with `eas secret:create --force`.
  (These are the publishable anon URL/key, safe to ship; never the
  `service_role` key.)
- **iOS signing:** EAS-managed (remote credentials). Generated on first build.
- **App Store Connect API key:** the `.p8` lives at
  `client/credentials/` (gitignored by `*.p8`, never committed). Its Key ID and
  Issuer ID are referenced in `eas.json` → `submit.production.ios`. The first
  `eas submit` uploads the key to EAS and, if the app record doesn't exist yet,
  creates it in App Store Connect automatically.

## First-run notes

- The **first** production build triggers EAS to generate the iOS Distribution
  Certificate + Provisioning Profile. With the ASC API key in place this is
  non-interactive; if Apple ever prompts for 2FA, approve it once.
- The **first** `eas update --channel production` creates the `production`
  update branch and links the channel to it.
