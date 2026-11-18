// Opening hours: storage shape (matches bathrooms.hours jsonb, migration 0010)
// and the "Open now" logic shared by the map, cards, detail and filter.
//
// Times are interpreted in the device's local time. That's right for the
// core case (you're standing near the bathroom); a searched area in another
// time zone will be off by the offset — acceptable until listings carry a tz.

export type DayKey = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';
/** Indexed by Date#getDay(). */
export const DAY_KEYS: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const DAY_SHORT: Record<DayKey, string> = { sun: 'Sun', mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat' };

export type DayHours = { open: string; close: string } | null;
export type WeeklyHours = Partial<Record<DayKey, DayHours>>;

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** 480 → "8 AM", 1290 → "9:30 PM", 0/1440 → "12 AM". */
export function formatTime(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440;
  const h24 = Math.floor(m / 60);
  const mm = m % 60;
  const suffix = h24 < 12 ? 'AM' : 'PM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return mm === 0 ? `${h12} ${suffix}` : `${h12}:${String(mm).padStart(2, '0')} ${suffix}`;
}

/** Validate untrusted jsonb into WeeklyHours; null when absent/invalid/empty. */
export function parseHours(raw: unknown): WeeklyHours | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const out: WeeklyHours = {};
  let any = false;
  for (const key of DAY_KEYS) {
    const v = (raw as Record<string, unknown>)[key];
    if (v === null) {
      out[key] = null;
      any = true;
    } else if (v && typeof v === 'object') {
      const { open, close } = v as Record<string, unknown>;
      if (typeof open === 'string' && typeof close === 'string' && HHMM.test(open) && HHMM.test(close)) {
        out[key] = { open, close };
        any = true;
      }
    }
  }
  return any ? out : null;
}

export type OpenState = 'open' | 'closing_soon' | 'closed' | 'unknown';
export type OpenStatus = {
  state: OpenState;
  /** Short status, e.g. "Open", "Closes soon", "Closed", "Open 24 hours". Empty when unknown. */
  label: string;
  /** Secondary detail, e.g. "Closes 9 PM", "Opens tomorrow 8 AM". */
  detail?: string;
};

const CLOSING_SOON_MIN = 30;

/** Is a window overnight (closes on the following day)? open === close means all day. */
const isOvernight = (d: { open: string; close: string }) => toMinutes(d.close) < toMinutes(d.open);
const isAllDay = (d: { open: string; close: string }) => d.open === d.close;

export function getOpenStatus(
  input: { hours?: unknown; is24?: boolean },
  now: Date = new Date(),
): OpenStatus {
  if (input.is24) return { state: 'open', label: 'Open 24 hours' };
  const hours = parseHours(input.hours);
  if (!hours) return { state: 'unknown', label: '' };

  const day = now.getDay();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const today = hours[DAY_KEYS[day]];
  const yesterday = hours[DAY_KEYS[(day + 6) % 7]];

  const openUntil = (closeMin: number): OpenStatus => {
    const left = closeMin - nowMin;
    return left <= CLOSING_SOON_MIN
      ? { state: 'closing_soon', label: 'Closes soon', detail: `Closes ${formatTime(closeMin)}` }
      : { state: 'open', label: 'Open', detail: `Closes ${formatTime(closeMin)}` };
  };

  // Still inside last night's overnight window?
  if (yesterday && !isAllDay(yesterday) && isOvernight(yesterday) && nowMin < toMinutes(yesterday.close)) {
    return openUntil(toMinutes(yesterday.close));
  }

  if (today) {
    if (isAllDay(today)) return { state: 'open', label: 'Open', detail: 'Open all day' };
    const o = toMinutes(today.open);
    const c = toMinutes(today.close);
    if (isOvernight(today)) {
      if (nowMin >= o) return openUntil(c + 1440);
    } else if (nowMin >= o && nowMin < c) {
      return openUntil(c);
    }
    if (nowMin < o) return { state: 'closed', label: 'Closed', detail: `Opens ${formatTime(o)}` };
  }

  // Find the next day with hours.
  for (let i = 1; i <= 7; i++) {
    const key = DAY_KEYS[(day + i) % 7];
    const d = hours[key];
    if (d) {
      const when = i === 1 ? 'tomorrow' : DAY_SHORT[key];
      return { state: 'closed', label: 'Closed', detail: `Opens ${when} ${formatTime(toMinutes(d.open))}` };
    }
  }
  return { state: 'closed', label: 'Closed' };
}

export const isOpenNow = (s: OpenStatus) => s.state === 'open' || s.state === 'closing_soon';

/** One-line status for cards: "Open · Closes 9 PM". */
export const statusLine = (s: OpenStatus) => (s.detail && s.label !== 'Open 24 hours' ? `${s.label} · ${s.detail}` : s.label);

/** Week table for the detail page, Monday first. */
export function weekRows(hours: unknown, now: Date = new Date()): { key: DayKey; day: string; text: string; isToday: boolean }[] {
  const h = parseHours(hours);
  if (!h) return [];
  const order: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  return order.map((key) => {
    const d = h[key];
    const text = !d ? 'Closed' : isAllDay(d) ? 'Open 24 hours' : `${formatTime(toMinutes(d.open))} – ${formatTime(toMinutes(d.close))}`;
    return { key, day: DAY_SHORT[key], text, isToday: DAY_KEYS[now.getDay()] === key };
  });
}

/** Weekday/weekend schedule (what the Add form collects) → WeeklyHours. */
export function buildHours(weekdays: DayHours, weekends: DayHours): WeeklyHours {
  const out: WeeklyHours = {};
  for (const key of DAY_KEYS) {
    out[key] = key === 'sat' || key === 'sun' ? weekends : weekdays;
  }
  return out;
}

/** Half-hour slots for time pickers: "00:00" … "23:30". */
export const TIME_SLOTS: string[] = Array.from({ length: 48 }, (_, i) =>
  `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`,
);
