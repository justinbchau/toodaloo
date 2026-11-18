import { sanitizeTags, tallyTags, REVIEW_TAGS } from '../../lib/reviewTags';

describe('reviewTags', () => {
  it('has 12 unique slugs (must match migration 0009)', () => {
    expect(new Set(REVIEW_TAGS.map((t) => t.slug)).size).toBe(12);
  });

  it('sanitizeTags drops unknown values', () => {
    expect(sanitizeTags(['clean', 'nope', 3, 'smelly'])).toEqual(['clean', 'smelly']);
    expect(sanitizeTags(null)).toEqual([]);
  });

  it('tallyTags counts and orders by frequency', () => {
    const tally = tallyTags([{ tags: ['clean', 'long_wait'] }, { tags: ['clean'] }, { tags: null }]);
    expect(tally.map((t) => [t.tag.slug, t.count])).toEqual([['clean', 2], ['long_wait', 1]]);
  });
});
