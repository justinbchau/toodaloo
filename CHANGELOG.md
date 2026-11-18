# Changelog

All notable changes to toodaloo's app design and UX are recorded here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); newest first.
Branch: `claude/epic-rubin-a9ft9v`.

## [Unreleased]

_Nothing yet._

---

## [Batch 2] — 2026-11-18 · `363dd04`

**Review quick tags, opening hours & "Open now"**

### Added
- **Migration `0009_review_tags_and_hours.sql`**:
  - `reviews.tags text[] not null default '{}'`, limited by a CHECK constraint to a fixed
    list of 12 tags, at most 6 per review, and a flat list only.
  - `bathrooms.hours jsonb` (nullable weekly schedule). A CHECK requires a JSON object
    with weekday keys only and caps its size at 1 KB.
  - `reviews_with_authors` gains `tags`; `bathrooms_nearby` is dropped and re-created to
    return `hours`, with `search_path` pinned and EXECUTE re-granted to anon and
    authenticated.
  - Reviewed by the repo's `migration-reviewer` agent on a throwaway Postgres: no
    blockers. Its two suggestions (cap `hours` size and keys, reject 2-D tag arrays)
    were applied.
- **One-tap review tags** in Write Review (AllTrails/Gojek pattern):
  - They appear once you pick a rating. The group that matches the rating comes first
    (complaints first at 1–2 stars).
  - Up to 6 per review. Saved tags are prefilled when editing.
  - The 12 tags: Clean, Well stocked, No wait, Spacious, Private, Feels safe · Dirty,
    Out of supplies, Long wait, Smelly, Something broken, Felt unsafe.
- **"People mention" summary** on the detail page: the most-used tags with counts
  (green for good, red for bad), plus the tags on each review.
- **Opening hours**:
  - The Add Bathroom form has an optional weekday/weekend schedule with a half-hour time
    picker (JavaScript only, no native date picker) and a "Closed" toggle per row.
  - The detail page has an **Hours** table (Monday first, today in bold) and a status
    badge ("Open · Closes 9 PM", "Closes soon", "Closed · Opens tomorrow 8 AM").
  - List cards and the Nearest card show a colored status: green open, amber closing
    soon, red closed.
- Shared helpers:
  - `lib/hours.ts`: open-now logic, including windows past midnight, "Closes soon"
    within 30 minutes, and finding the next opening.
  - `lib/reviewTags.ts`: the tag list, plus helpers that clean and count tags.
  - `lib/bathroomCard.ts`: `toCardData()` is now the one row-to-card mapper for Map,
    Saved and Submitted.
  - `components/TimeSelect.tsx`.
- `types/database.ts` hand-updated for `tags` and `hours`. Regenerate it with
  `dev.sh db:types` once the migration is applied.

### Changed
- The map's **"Open 24h" filter is now "Open now"**: it includes 24-hour places and
  places open right now per their hours. Places with unknown hours are excluded.
- The access line on cards no longer appends "· Open 24h"; the status text covers it.
- **Detail page header**: a solid header with the bathroom's name fades in as the map
  scrolls away, so the floating back/share/save buttons never sit on top of text.
- **Map sheet**: full height now stops just below the search bar and filter chips. Snap
  heights are measured from the sheet's container, which ends above the tab bar.

### Behavior & copy changes
- Filter chip "Open 24h" → "Open now".
- Review insert/update payloads now always include `tags` (an empty array when none are
  chosen).

### Notes
- **Deploy order:** apply migration `0009` **before** shipping this app update. The new
  client writes `reviews.tags` and reads `hours`; against an un-migrated database,
  review submission would fail.
- **Time zones:** "Open now" uses the phone's local time. That's correct when you're
  near the bathroom, but off by the time difference when browsing a searched city in
  another time zone.
- Only a bathroom's creator can set or edit its hours (existing `bathrooms_update_own`
  policy).
- **Pre-existing bug found during review (not fixed here, queued as a separate task):**
  `refresh_bathroom_rating` runs as the reviewer, so for anyone other than the
  bathroom's creator the RLS policy blocks the rating update and
  `rating_avg`/`review_count` go stale. Creators can also write those columns directly.
- 298 tests in 29 suites (26 new). The type check is clean. Verified in the web preview
  only, not yet on a device.

---

## [Batch 1] — 2026-11-18 · `670e379`

**Nearest CTA, pin previews, location priming, undo toasts**

### Added
- **"Nearest to you" hero card** at the top of the map results sheet with a one-tap
  `Directions · N min walk` button (walking directions in Apple Maps / Google Maps).
- **Pin preview card**: tapping a map pin highlights it (accent) and slides up a floating
  card with Directions / Details, instead of navigating away. Tap the map or ✕ to dismiss.
- **Location permission priming**: the app reads the permission first and shows an
  explanation screen ("Find the closest bathroom, fast") before the one-shot iOS prompt.
  Permanently denied → "Location is turned off" with Open Settings or "Search a location
  instead". Re-checks permission when returning from Settings.
- **Manual location mode**: browse by searching an area when there's no GPS
  ("Search an area" empty state, "Use my location" button).
- **Recent searches**: last 5 successful searches, stored on-device, shown when the empty
  search field is focused; tap to re-run; "Clear".
- **Undo toasts** (`ToastProvider` / `useToast`): unsave on detail → "Removed from Saved ·
  Undo"; save → "Saved to your places · View"; review delete in My Reviews is optimistic
  ("Review deleted · Undo") and the DB delete only runs after the toast expires.
- **Motion**: bookmark pop on save, staggered star spring in Write Review, skeleton
  placeholder for the detail page instead of a spinner.
- Shared helpers: `lib/directions.ts` (walking directions), `lib/recentSearches.ts`,
  `formatWalkTime` in `utils/geo.ts`, `components/NearestCard.tsx`,
  `components/SkeletonDetail.tsx`, `context/ToastContext.tsx`.
- Dependency: `@gorhom/bottom-sheet@^5.2.14`.

### Changed
- Map results sheet rebuilt on `@gorhom/bottom-sheet`: list scroll and sheet drag hand off
  to each other; 3 snap points; recenter FAB rides the sheet's top edge.
- Distances are shown as **walking time** ("4 min walk"); beyond ~2 mi, plain miles.
- Typing in the search field now dismisses a stale "Couldn't find that location" message.

### Removed
- Silent New York fallback when location was declined ("Maybe later").

### Behavior & copy changes
- Pin tap no longer opens the detail page directly (preview first).
- "Maybe later" → "Search a location instead"; new copy "Find the closest bathroom, fast",
  "Allow location", "Location is turned off".
- Review delete no longer asks for confirmation; it's undoable for ~4.5 s instead.
- Detail distance: "0 ft away" style → "1 min walk" style.

### Notes
- 272 tests passing (22 new); `tsc` clean.
- `@gorhom/bottom-sheet` is JS-only on top of existing reanimated / gesture-handler, so this
  batch should be OTA-shippable — verify against the EAS runtime version.
- Haptics (`expo-haptics`) deliberately **not** added: needs a native build.
- Verified in a web preview with mock data only — still to check on a real device: sheet
  drag vs list scroll, pin tap vs map tap, the real iOS location prompt.

---

## [Theme] — 2026-11-18 · `b78429d`

**"Tide" palette, role-based color tokens, System/Light/Dark appearance**

### Added
- **Appearance setting: System / Light / Dark** (segmented control in Settings). System
  follows the device, including iOS "Automatic" sunset switching. Legacy stored
  `'light'`/`'dark'` values are still honored.
- Tokens `primary`, `onPrimary`, `onAccent`, `cardBorder`.
- Tests for `ThemeContext` and the Settings appearance control.

### Changed
- Palette moved from violet on purple-tinted grays to **Tide**: neutral grays, ink primary
  buttons, one deep-teal accent (see Design system reference below).
- Tokens renamed from brand to role: `purple` → `accent`, `purpleDim` → `accentDim`,
  `purpleGlow` → `accentGlow`, `purpleText` → `accentText`.
- Primary buttons are ink (near-black in light, near-white in dark) with no colored glow.
- **Map pins are neutral** white pills; only the nearest result is accent-filled.
- Decorative icon tiles, badges, avatars and empty-state icons are neutral.
- Cards are borderless in light mode (surface contrast does the work).
- Welcome-screen illustration recolored to neutral grays.

### Removed
- The one-way "Dark mode" switch (replaced by System / Light / Dark).

### Notes
- 255 tests passing at this commit; `tsc` clean. JS-only (OTA-shippable).

---

## [Redesign] — 2026-11-18 · `472fd3d`

**Redesign every screen using Mobbin reference patterns**

### Added
- Design-system primitives: `IconButton`, `ScreenHeader` (large / inline), `EmptyState`,
  `ListGroup` (inset grouped lists), `StarRating`, `Fade` (SVG scrim), `AuthLayout`.
- Theme tokens `greenDim`, `redDim`, `yellowDim`, `glass`, `overlay`, `shadow`; shadow
  presets (`theme/shadows.ts`); `lib/format.ts` (access labels, amenity icons, relative
  dates, initials); `hooks/useInsets.ts`.

### Changed
- **Welcome**: full-bleed illustrated map hero with rating pins and a preview card.
- **Login / Sign up / OTP**: shared layout, CTA pinned above the keyboard, 6-box code entry.
- **Map**: floating search pill, always-visible filter chips (replaced the hidden filter
  panel), rating-pill markers, vertical results sheet, recenter FAB on the sheet edge.
- **Tab bar**: safe-area aware, outline/filled icons, raised Add button.
- **Bathroom detail**: Yelp-style map hero, access / 24h badges, Directions CTA + action
  tiles, amenity icons, rating distribution, avatar review rows.
- **Write review**: large centered stars with a live caption ("Awful" → "Spotless!").
- **Add bathroom**: grouped cards, radio access options with descriptions, amenity chips.
- **Saved / Submitted / My Reviews / Profile / Settings / Success**: large titles,
  skeletons, empty states with CTAs, stat tiles, inset grouped settings.
- `BathroomCard` became a full-width list row shared by the map sheet, Saved and Submitted.

### Removed
- `components/AmenityToggle.tsx`, `components/BackButton.tsx`, `templates/Page.tsx`.
- Map filter panel and the separate "+" FAB on the map (the tab bar has Add).
- Back button on the Add tab (it's a tab root).

### Behavior & copy changes
- "Navigate ›" → **"Directions"**.
- 24-hour badge "Open" → **"Open 24/7"**.
- Map tab label → **"Explore"**.
- "add a bathroom" → "Add a bathroom"; profile stat labels "SAVED/REVIEWS/ADDED" →
  "Saved/Reviews/Added".
- New: "Add another" on the success screen; empty-state buttons to the map / Add tab.

### Notes
- 250 tests passing; tests changed only where copy/affordances changed intentionally.
- JS-only (OTA-shippable). Verified in a web preview, not on device.

---

## Design system reference

### Tide palette (`client/theme/colors.ts`)

| Token | Light | Dark |
|---|---|---|
| `bg` | `#F3F3F0` | `#0B0D0D` |
| `surface1` | `#FFFFFF` | `#151817` |
| `surface2` | `#EDEDEA` | `#1C201F` |
| `surface3` | `#E0E1DD` | `#272C2B` |
| `primary` / `onPrimary` | `#121413` / `#FFFFFF` | `#F1F3F2` / `#0B0D0D` |
| `accent` / `onAccent` | `#0F766E` / `#FFFFFF` | `#2DB5A5` / `#04211D` |
| `accentText` | `#0F766E` | `#5ED1C2` |
| `text1` / `text2` / `text3` | `#121413` / `#5C615F` / `#9A9F9C` | `#ECEFEE` / `#9AA19F` / `#5E6563` |
| `cardBorder` | `transparent` | `rgba(255,255,255,0.05)` |

Semantic colors stay separate from the brand: `green` (open/success), `red`
(errors/destructive), `yellow` (stars).

### Token roles & accent rules
- `primary` / `onPrimary` — the main call-to-action fill.
- `accent` / `onAccent` / `accentDim` / `accentGlow` / `accentText` — selection and state
  only: active tab, selected chip/pin/radio, saved state, focus rings, links, logo.
- If something isn't selected, focused or a link, it's neutral.
- Map pins are neutral; only the selected pin (or the nearest, when none is selected) is accent.
- Depth comes from surface layering, not borders; secondary text is gray, never tinted.

### Mobbin references
- Map + sheet: [Fresha](https://mobbin.com/screens/9c6ec1d7-3de4-4f92-9897-8b8b28e5b17c), [TikTok](https://mobbin.com/screens/dd025592-82d1-4161-810a-9b161b38338e), [Airbnb search map](https://mobbin.com/screens/ea2e0540-b4de-4683-ac7e-09e30142252f), [Airbnb map pins](https://mobbin.com/screens/37e9c92b-4803-43ea-b103-668b44c59560), [Uber](https://mobbin.com/screens/1634d7c8-5d3f-4223-8f11-df000b37f3ea)
- Pin preview: [komoot](https://mobbin.com/screens/8bebc13e-ce91-425e-9716-c2fa35db6a76), [GOAT](https://mobbin.com/screens/d9f5169a-004e-4f67-b50a-5beccbed9f13)
- Detail: [Yelp](https://mobbin.com/screens/263912e4-ca23-4ab0-8171-6e4fd6304054), [Airbnb listing](https://mobbin.com/screens/df3523e0-6209-461c-af3a-8b2ee4cbb8ba)
- Welcome: [Polarsteps](https://mobbin.com/screens/54d796cf-e760-429e-83d5-0c1d0afb7e1d)
- OTP: [DoorDash](https://mobbin.com/screens/db32d328-224f-40c0-8754-089b13974f3d), [7-Eleven](https://mobbin.com/screens/6f194d3c-c75c-49ad-99e5-ec308cc2a0ef)
- Write review: [DoorDash](https://mobbin.com/screens/8dc4bf69-3bd1-4213-a56f-e3d3fe0d8c50)
- Review tags (Batch 2): [Gojek](https://mobbin.com/screens/43cff87a-c5fb-480c-9e0a-1c847da28736), [AllTrails](https://mobbin.com/screens/ba351e09-74f4-490d-a1de-b5e79b606d1d), [Tabby](https://mobbin.com/screens/7b8fd721-ac7f-47c6-b226-af05beedfe54)
- Add place: [Swarm](https://mobbin.com/screens/4e4c9ced-50af-4325-b8de-a674df429cfe)
- Profile / settings: [Waymo](https://mobbin.com/screens/db94bab7-775a-45ce-8c79-55eab2ef8e7d), [Matter](https://mobbin.com/screens/6a350cd6-0c8c-4b62-b19b-21bebf368078), [Cash App](https://mobbin.com/screens/968d4ec4-578a-47ec-8c6d-4d249af10544), [Revolut](https://mobbin.com/screens/a2d088dd-3c73-4d57-a905-420857a2aa7a)
- Success: [Starling](https://mobbin.com/screens/f97e5488-2a3a-4815-9a3b-ddcc596fc0ba)
- Location priming: [Beli](https://mobbin.com/screens/1820315c-e7e6-468f-8bea-711ed8dc3291), [foodpanda](https://mobbin.com/screens/d24cbcca-bfd5-4722-81e8-6c1ac8d1ffd2)
- Recent searches: [Apple Maps](https://mobbin.com/screens/089a5ea8-c6bf-4f82-9d0f-84294ae6c25b), [Google Maps](https://mobbin.com/screens/2d9728f0-1a48-4a1d-aa85-98b5962d37fd)
- Undo toasts: [Medium](https://mobbin.com/screens/ed637f28-2d0d-40a6-bb79-b7fe7d8505e8), [CVS Health](https://mobbin.com/screens/f8dca081-488d-4e7c-b79f-9f9281222c3a)
- Color/design-system survey: [Spotify](https://mobbin.com/screens/236d47d8-37bc-4ce2-9a9b-bebc935372f2), [Headspace](https://mobbin.com/screens/1cba404f-413c-4a8b-be36-d791e9ca4fed), [Duolingo](https://mobbin.com/screens/02544e61-aefd-4d89-815e-ffcc83d83539)
