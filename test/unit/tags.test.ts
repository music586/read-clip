import { describe, expect, it } from 'vitest';
import { groupByTag } from '../../src/lib/tags';

describe('tag helpers', () => {
  it('deduplicates repeated tags within one clip and sorts groups by label', () => {
    const fixtures = [
      { id: 'a', data: { tags: ['阅读', '学习', '阅读'], createdAt: '2025-01-01T00:00:00Z' } },
      { id: 'b', data: { tags: ['学习'], createdAt: '2026-01-01T00:00:00Z' } },
    ];
    const groups = groupByTag(fixtures);
    expect(groups.map(({ tag, count }) => [tag, count])).toEqual([['学习', 2], ['阅读', 1]]);
    expect(groups[0].clips.map(({ id }) => id)).toEqual(['b', 'a']);
  });
});
