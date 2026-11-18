import AsyncStorage from '@react-native-async-storage/async-storage';

// Recent location searches, newest first — a per-device convenience, so local
// storage (not Supabase) is the right home. Failures are swallowed: recents are
// nice-to-have and must never break searching.
const KEY = 'toodaloo.recentSearches';
export const MAX_RECENTS = 5;

export async function loadRecents(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((q) => typeof q === 'string').slice(0, MAX_RECENTS) : [];
  } catch {
    return [];
  }
}

/** Move `query` to the front (case-insensitive de-dupe) and persist. Returns the new list. */
export async function addRecent(query: string, current: string[]): Promise<string[]> {
  const q = query.trim();
  if (!q) return current;
  const next = [q, ...current.filter((c) => c.toLowerCase() !== q.toLowerCase())].slice(0, MAX_RECENTS);
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Non-fatal.
  }
  return next;
}

export async function clearRecents(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // Non-fatal.
  }
}
