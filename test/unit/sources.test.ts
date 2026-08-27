import { describe, expect, it } from 'vitest';
import { groupBySource, normalizeSourcePart, sourceKey } from '../../src/lib/sources';

describe('source helpers', () => {
  it('normalizes source identity without fuzzy merging', () => {
    expect(normalizeSourcePart('  如何  阅读一本书 ')).toBe('如何 阅读一本书');
    expect(sourceKey({ source: '书名', author: '甲' })).not.toBe(sourceKey({ source: '书名', author: '乙' }));
    expect(sourceKey({ source: '书名' })).toBe(sourceKey({ source: ' 书名 ', author: '   ' }));
  });

  it('groups counts and records the latest date', () => {
    const clips = [
      { id: 'a', data: { source: '书名', author: '甲', createdAt: '2025-01-01T00:00:00Z' } },
      { id: 'b', data: { source: ' 书名 ', author: '甲', createdAt: '2026-01-01T00:00:00Z' } },
      { id: 'c', data: { source: '书名', author: '乙', createdAt: '2024-01-01T00:00:00Z' } },
    ];
    const groups = groupBySource(clips);
    expect(groups.map(({ author, count }) => [author, count])).toEqual([['甲', 2], ['乙', 1]]);
    expect(groups[0].latestAt).toBe('2026-01-01T00:00:00Z');
  });
});
