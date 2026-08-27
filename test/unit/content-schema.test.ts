import { describe, expect, it } from 'vitest';
import { clipSchema, hasExplicitTimezone } from '../../src/content.config';

describe('clip schema', () => {
  it('accepts a minimal public clip and applies defaults', () => {
    const result = clipSchema.parse({
      title: '阅读也是一种思考',
      source: '如何阅读一本书',
      createdAt: '2026-08-28T20:30:00+08:00',
    });
    expect(result.tags).toEqual([]);
    expect(result.private).toBe(false);
  });

  it.each(['2026-08-28', '2026-08-28T20:30:00'])('rejects a date without timezone: %s', (createdAt) => {
    expect(() => clipSchema.parse({ title: 'x', source: 'y', createdAt })).toThrow();
  });

  it('rejects invalid URLs and blank required strings', () => {
    expect(() =>
      clipSchema.parse({ title: ' ', source: 'x', url: 'nope', createdAt: '2026-08-28T12:00:00Z' }),
    ).toThrow();
  });
});

describe('hasExplicitTimezone', () => {
  it('accepts Z and numeric offsets', () => {
    expect(hasExplicitTimezone('2026-08-28T12:00:00Z')).toBe(true);
    expect(hasExplicitTimezone('2026-08-28T20:00:00+08:00')).toBe(true);
  });
});
