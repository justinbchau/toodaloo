import {
  formatTime, parseHours, getOpenStatus, isOpenNow, statusLine, weekRows, buildHours,
} from '../../lib/hours';

// 2026-11-18 is a Wednesday.
const at = (hh: number, mm = 0, dayOffset = 0) => new Date(2026, 10, 18 + dayOffset, hh, mm);
const NINE_TO_NINE = { open: '09:00', close: '21:00' };

describe('formatTime', () => {
  it('formats 12-hour clock with optional minutes', () => {
    expect(formatTime(0)).toBe('12 AM');
    expect(formatTime(480)).toBe('8 AM');
    expect(formatTime(720)).toBe('12 PM');
    expect(formatTime(1290)).toBe('9:30 PM');
    expect(formatTime(1440 + 60)).toBe('1 AM');
  });
});

describe('parseHours', () => {
  it('rejects junk and keeps valid days', () => {
    expect(parseHours(null)).toBeNull();
    expect(parseHours([])).toBeNull();
    expect(parseHours({ mon: { open: '9', close: 'x' } })).toBeNull();
    expect(parseHours({ mon: NINE_TO_NINE, tue: null, foo: 1 })).toEqual({ mon: NINE_TO_NINE, tue: null });
  });
});

describe('getOpenStatus', () => {
  const daily = buildHours(NINE_TO_NINE, NINE_TO_NINE);

  it('24-hour places are always open', () => {
    expect(getOpenStatus({ is24: true, hours: null }, at(3))).toEqual({ state: 'open', label: 'Open 24 hours' });
  });

  it('unknown when there are no hours', () => {
    expect(getOpenStatus({ hours: null }, at(12)).state).toBe('unknown');
  });

  it('open with closing time', () => {
    const s = getOpenStatus({ hours: daily }, at(12));
    expect(s).toEqual({ state: 'open', label: 'Open', detail: 'Closes 9 PM' });
    expect(isOpenNow(s)).toBe(true);
    expect(statusLine(s)).toBe('Open · Closes 9 PM');
  });

  it('closing soon within 30 minutes', () => {
    expect(getOpenStatus({ hours: daily }, at(20, 40)).state).toBe('closing_soon');
  });

  it('closed before opening → opens later today', () => {
    expect(getOpenStatus({ hours: daily }, at(7))).toEqual({ state: 'closed', label: 'Closed', detail: 'Opens 9 AM' });
  });

  it('closed after closing → opens tomorrow', () => {
    expect(getOpenStatus({ hours: daily }, at(22)).detail).toBe('Opens tomorrow 9 AM');
  });

  it('skips closed days to the next opening (weekend-closed)', () => {
    const weekdaysOnly = buildHours(NINE_TO_NINE, null);
    // Friday 10 PM → closed Sat/Sun → opens Mon
    expect(getOpenStatus({ hours: weekdaysOnly }, at(22, 0, 2)).detail).toBe('Opens Mon 9 AM');
  });

  it('handles windows past midnight, including the spill into the next morning', () => {
    const late = buildHours({ open: '18:00', close: '02:00' }, { open: '18:00', close: '02:00' });
    expect(getOpenStatus({ hours: late }, at(23)).detail).toBe('Closes 2 AM');
    expect(getOpenStatus({ hours: late }, at(1)).state).toBe('open');
    expect(getOpenStatus({ hours: late }, at(3)).state).toBe('closed');
  });
});

describe('weekRows', () => {
  it('lists Monday first and marks today', () => {
    const rows = weekRows(buildHours(NINE_TO_NINE, null), at(12));
    expect(rows.map((r) => r.day)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    expect(rows.find((r) => r.isToday)?.day).toBe('Wed');
    expect(rows[0].text).toBe('9 AM – 9 PM');
    expect(rows[5].text).toBe('Closed');
  });
});
