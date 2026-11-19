import { haversine, formatWalkTime } from '../../utils/geo';

describe('haversine()', () => {
  it('returns 0 for identical coordinates', () => {
    expect(haversine(40.7128, -74.006, 40.7128, -74.006)).toBe(0);
  });

  it('returns a positive distance for different coordinates', () => {
    const dist = haversine(40.7128, -74.006, 40.7589, -73.9851);
    expect(dist).toBeGreaterThan(0);
  });

  it('calculates roughly 3,963 miles from NYC to London (within 1%)', () => {
    // NYC: 40.7128° N, 74.0060° W
    // London: 51.5074° N, 0.1278° W
    const dist = haversine(40.7128, -74.006, 51.5074, -0.1278);
    expect(dist).toBeGreaterThan(3400);
    expect(dist).toBeLessThan(3700);
  });

  it('calculates roughly 0.36 miles for two nearby points in NYC', () => {
    // Approx 0.36mi from Bryant Park to Times Square
    const dist = haversine(40.7536, -73.9832, 40.758, -73.9855);
    expect(dist).toBeGreaterThan(0);
    expect(dist).toBeLessThan(1);
  });

  it('is symmetric — A→B equals B→A', () => {
    const d1 = haversine(40.7128, -74.006, 34.0522, -118.2437);
    const d2 = haversine(34.0522, -118.2437, 40.7128, -74.006);
    expect(d1).toBeCloseTo(d2, 5);
  });

  it('handles southern hemisphere coordinates', () => {
    // Sydney: -33.8688, 151.2093
    // Melbourne: -37.8136, 144.9631
    const dist = haversine(-33.8688, 151.2093, -37.8136, 144.9631);
    expect(dist).toBeGreaterThan(400);
    expect(dist).toBeLessThan(600);
  });
});

describe('formatWalkTime()', () => {
  it('never shows less than 1 minute', () => {
    expect(formatWalkTime(0)).toBe('1 min walk');
    expect(formatWalkTime(0.01)).toBe('1 min walk');
  });

  it('converts miles at ~3 mph', () => {
    expect(formatWalkTime(0.2)).toBe('4 min walk');
    expect(formatWalkTime(1)).toBe('20 min walk');
  });

  it('switches to plain miles beyond a reasonable walk', () => {
    expect(formatWalkTime(2.64)).toBe('2.6 mi');
  });

  it('returns empty for invalid input', () => {
    expect(formatWalkTime(NaN)).toBe('');
    expect(formatWalkTime(-1)).toBe('');
  });
});
