# TODOS — TooDaLoo

Deferred items from code reviews and planning sessions.
Format: **P1** = blocking, **P2** = high value, **P3** = polish.

---

## P3: Add max-length validation to AddBathroom form fields

**What:** The `title` and `address` fields in `AddBathroom.tsx` have `z.string().min(1)` but no upper bound. A very long string passes validation, goes to `Location.geocodeAsync()`, and may surface as a generic "Failed to submit" error.

**Why:** Supabase column constraints would reject it anyway, but the error message is opaque to the user. Explicit Zod validation gives a user-readable error at the right layer.

**Where to start:** `AddBathroom.tsx` schema (lines 36-39). Add `.max(100, 'Too long')` to `title`, `.max(300, 'Too long')` to `address`.

**Effort:** S (human: ~15 min / CC: ~1 min)

---

## Completed

### Wire Location FAB on Map screen
**Completed:** 2026-04-10 — `features/login-otp-map-rpc-fix`
Wired the `◎` FAB via `useRef<MapView>(null)` + `mapRef.current?.animateToRegion(...)` at 500ms using `location.coords`. Dead tap target is now the expected re-center behavior.

