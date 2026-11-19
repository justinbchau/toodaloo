// Small display helpers shared across bathroom/review screens.

const ACCESS_LABEL: Record<string, string> = {
  public: 'Public',
  key_required: 'Key Required',
  purchase_required: 'Purchase Required',
};

export function accessLabel(accessType: string | null | undefined): string {
  return (accessType && ACCESS_LABEL[accessType]) || 'Public';
}

// Amenity tag → icon. Unknown tags fall back to a generic check.
export const AMENITY_ICON: Record<string, string> = {
  'Gender Neutral': 'human-male-female',
  'Multi Stalls': 'view-grid-outline',
  Mirrors: 'mirror',
  Handicap: 'wheelchair-accessibility',
  Accessible: 'wheelchair-accessibility',
  'Keypad Locked': 'dialpad',
  'Baby Friendly': 'baby-face-outline',
};
export const DEFAULT_AMENITY_ICON = 'check-circle-outline';

/** "Today", "Yesterday", "3 days ago", "2 weeks ago", else a short date. */
export function relativeDate(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const days = Math.floor((now.getTime() - then.getTime()) / 86_400_000);
  if (Number.isNaN(days)) return '';
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) {
    const w = Math.floor(days / 7);
    return `${w} ${w === 1 ? 'week' : 'weeks'} ago`;
  }
  return then.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/** First letter of a username for avatar circles. */
export function initial(name: string | null | undefined): string {
  return (name?.trim()?.[0] ?? '?').toUpperCase();
}
