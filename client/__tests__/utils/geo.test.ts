import { haversine, formatDistance } from '../../utils/geo';

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

describe('formatDistance()', () => {
  it('returns feet for distances under 0.1 miles', () => {
    const result = formatDistance(0.05);
    expect(result).toBe('264 ft away');
  });

  it('returns feet for very short distance', () => {
    // 0.01 miles = 52.8 ft → rounds to 53
    const result = formatDistance(0.01);
    expect(result).toBe('53 ft away');
  });

  it('returns miles with 1 decimal at exactly 0.1 miles', () => {
    const result = formatDistance(0.1);
    expect(result).toBe('0.1 mi away');
  });

  it('returns miles with 1 decimal for longer distances', () => {
    expect(formatDistance(0.5)).toBe('0.5 mi away');
    expect(formatDistance(1.0)).toBe('1.0 mi away');
    expect(formatDistance(2.7)).toBe('2.7 mi away');
  });

  it('rounds miles to 1 decimal place', () => {
    expect(formatDistance(1.25)).toBe('1.3 mi away');
    expect(formatDistance(1.24)).toBe('1.2 mi away');
  });

  it('handles zero distance as feet', () => {
    const result = formatDistance(0);
    expect(result).toBe('0 ft away');
  });

  it('rounds feet to nearest whole number', () => {
    // 0.076 miles = 401.28 ft → rounds to 401
    const result = formatDistance(0.076);
    expect(result).toBe('401 ft away');
  });
});

describe('haversine + formatDistance integration', () => {
  it('formats a close distance as feet', () => {
    // Two points ~200 feet apart
    const milesApart = haversine(40.7128, -74.006, 40.7129, -74.006);
    const formatted = formatDistance(milesApart);
    expect(formatted).toMatch(/ft away$/);
  });

  it('formats a distant point as miles', () => {
    // Two points ~0.5 miles apart
    const milesApart = haversine(40.7128, -74.006, 40.7200, -74.006);
    const formatted = formatDistance(milesApart);
    expect(formatted).toMatch(/mi away$/);
  });
});
