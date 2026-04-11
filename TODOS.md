# TODOS — TooDaLoo

Deferred items from code reviews and planning sessions.
Format: **P1** = blocking, **P2** = high value, **P3** = polish.

---

## P2: Wire Location FAB on Map screen

**What:** The `◎` FAB on Map.tsx (line 273-287) calls `console.log('center on user location')`. Dead tap target.

**Why:** Users who pan the map lose their location context. The FAB is already visible — it just doesn't do anything. Wiring it is a high-value, low-effort polish item that makes the map feel finished.

**Where to start:** Get a `MapView` ref via `useRef`, call `mapRef.current?.animateToRegion(...)` using the current GPS coords from `LocationCtx`. ~20 lines total.

**Effort:** S (human: ~1h / CC: ~5 min)

---

## P3: Add max-length validation to AddBathroom form fields

**What:** The `title` and `address` fields in `AddBathroom.tsx` have `z.string().min(1)` but no upper bound. A very long string passes validation, goes to `Location.geocodeAsync()`, and may surface as a generic "Failed to submit" error.

**Why:** Supabase column constraints would reject it anyway, but the error message is opaque to the user. Explicit Zod validation gives a user-readable error at the right layer.

**Where to start:** `AddBathroom.tsx` schema (lines 36-39). Add `.max(100, 'Too long')` to `title`, `.max(300, 'Too long')` to `address`.

**Effort:** S (human: ~15 min / CC: ~1 min)

---
