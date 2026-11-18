import { toCardData } from '../../lib/bathroomCard';

const row = {
  id: 'b1', name: 'Cafe', address: '1 Main', access_type: 'key_required', is_24_hours: false,
  rating_avg: '4.26', review_count: 7, lat: 1, lng: 2,
  hours: { wed: { open: '09:00', close: '21:00' } },
};
const wedNoon = new Date(2026, 10, 18, 12, 0);

describe('toCardData', () => {
  it('maps access, rating and open status', () => {
    const c = toCardData(row, '4 min walk', wedNoon);
    expect(c).toEqual(expect.objectContaining({
      sub: 'Key Required', score: '4.3', rating: 4, reviewCount: '(7)', distance: '4 min walk',
      openState: 'open', statusText: 'Open · Closes 9 PM', icon: 'key',
    }));
  });

  it('marks 24h places and unknown hours', () => {
    expect(toCardData({ ...row, is_24_hours: true }, '', wedNoon).statusText).toBe('Open 24 hours');
    expect(toCardData({ ...row, hours: null }, '', wedNoon)).toEqual(expect.objectContaining({ openState: 'unknown', statusText: '' }));
  });

  it('falls back to the address when access type is missing', () => {
    expect(toCardData({ ...row, access_type: null }, '', wedNoon).sub).toBe('1 Main');
  });
});
