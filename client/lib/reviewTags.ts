// One-tap review tags. Slugs must match the CHECK constraint in
// supabase/migrations/0010_review_tags_and_hours.sql.
import type { MaterialCommunityIcons } from '@expo/vector-icons';

type Icon = keyof typeof MaterialCommunityIcons.glyphMap;
export type ReviewTag = { slug: string; label: string; icon: Icon; positive: boolean };

export const REVIEW_TAGS: ReviewTag[] = [
  { slug: 'clean', label: 'Clean', icon: 'shimmer', positive: true },
  { slug: 'stocked', label: 'Well stocked', icon: 'paper-roll-outline', positive: true },
  { slug: 'no_wait', label: 'No wait', icon: 'timer-sand-empty', positive: true },
  { slug: 'spacious', label: 'Spacious', icon: 'arrow-expand-all', positive: true },
  { slug: 'private', label: 'Private', icon: 'lock-outline', positive: true },
  { slug: 'feels_safe', label: 'Feels safe', icon: 'shield-check-outline', positive: true },
  { slug: 'dirty', label: 'Dirty', icon: 'delete-variant', positive: false },
  { slug: 'out_of_supplies', label: 'Out of supplies', icon: 'paper-roll-outline', positive: false },
  { slug: 'long_wait', label: 'Long wait', icon: 'timer-sand', positive: false },
  { slug: 'smelly', label: 'Smelly', icon: 'weather-windy', positive: false },
  { slug: 'broken', label: 'Something broken', icon: 'wrench-outline', positive: false },
  { slug: 'feels_unsafe', label: 'Felt unsafe', icon: 'shield-alert-outline', positive: false },
];

export const MAX_REVIEW_TAGS = 6;

const BY_SLUG: Record<string, ReviewTag> = Object.fromEntries(REVIEW_TAGS.map((t) => [t.slug, t]));
export const tagBySlug = (slug: string): ReviewTag | undefined => BY_SLUG[slug];

/** Keep only known slugs (defends against stale/unknown values from the server). */
export const sanitizeTags = (tags: unknown): string[] =>
  Array.isArray(tags) ? tags.filter((t): t is string => typeof t === 'string' && t in BY_SLUG) : [];

/** Tally tags across reviews, most-mentioned first (ties: positive first, then vocab order). */
export function tallyTags(reviews: { tags?: unknown }[]): { tag: ReviewTag; count: number }[] {
  const counts: Record<string, number> = {};
  for (const r of reviews) for (const t of sanitizeTags(r.tags)) counts[t] = (counts[t] ?? 0) + 1;
  return REVIEW_TAGS.filter((t) => counts[t.slug])
    .map((tag) => ({ tag, count: counts[tag.slug] }))
    .sort((a, b) => b.count - a.count || Number(b.tag.positive) - Number(a.tag.positive));
}
