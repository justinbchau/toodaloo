/**
 * Haversine distance calculation between two GPS coordinates.
 * Returns distance in miles.
 */
export function haversine(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 3959; // Earth radius in miles
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Average walking pace used for ETA copy (~3 mph, the usual maps-app default).
const WALK_MPH = 3;
// Past this, "walk" stops being a useful framing — show plain distance instead.
const MAX_WALK_MILES = 2;

/**
 * Human walking ETA for a distance in miles, e.g. "4 min walk".
 * Falls back to "2.6 mi" once a walk would take longer than ~40 minutes.
 */
export function formatWalkTime(miles: number): string {
  if (!Number.isFinite(miles) || miles < 0) return '';
  if (miles > MAX_WALK_MILES) return `${miles.toFixed(1)} mi`;
  const minutes = Math.max(1, Math.round((miles / WALK_MPH) * 60));
  return `${minutes} min walk`;
}

export const KM_TO_MILES = 0.621371;
export const MILES_TO_KM = 1.60934;
