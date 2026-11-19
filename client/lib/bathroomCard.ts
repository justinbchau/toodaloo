import type { BathroomCardData } from '../components/BathroomCard';
import { ACCESS_ICON, DEFAULT_ACCESS_ICON } from './accessIcons';
import { accessLabel } from './format';
import { getOpenStatus, statusLine } from './hours';

export type ListBathroom = BathroomCardData & {
  accessType: string | null;
  is24: boolean;
};

/**
 * Map a `bathrooms` row (or a bathrooms_nearby RPC row) to list-card data,
 * including its open/closed status. Shared by the map sheet, Saved and
 * Submitted so every list reads the same way.
 */
export function toCardData(b: any, distance = '', now: Date = new Date()): ListBathroom {
  const status = getOpenStatus({ hours: b.hours, is24: b.is_24_hours }, now);
  const rating = Number(b.rating_avg) || 0;
  return {
    id: b.id,
    name: b.name,
    icon: ACCESS_ICON[b.access_type] ?? DEFAULT_ACCESS_ICON,
    // Legacy rows without an access type fall back to their address.
    sub: b.access_type == null ? (b.address ?? 'Nearby') : accessLabel(b.access_type),
    rating: Math.round(rating),
    score: rating.toFixed(1),
    reviewCount: `(${b.review_count ?? 0})`,
    distance,
    lat: b.lat,
    lng: b.lng,
    openState: status.state,
    statusText: statusLine(status),
    accessType: b.access_type ?? null,
    is24: !!b.is_24_hours,
  };
}
