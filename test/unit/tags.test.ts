import { describe, expect, it } from 'vitest';
import { groupByTag, tagKey, tagPath } from '../../src/lib/tags';

describe('tag classification', () => {
  it('creates stable URL-safe paths for Chinese tags', () => {
    expect(tagPath('阅读')).toBe(`/tags/${tagKey('阅读')}/`);
    expect(tagKey('阅读')).toMatch(/^[\w-]+$/);
  });

  it('groups unique tags and sorts groups by article count', () => {
    const clips = [
      { id: 'new', data: { createdAt: '2026-02-01', tags: ['思考', '阅读', '阅读'] } },
      { id: 'old', data: { createdAt: '2026-01-01', tags: ['阅读'] } },
    ] as never;
    const groups = groupByTag(clips);
    expect(groups.map(({ tag, count }) => [tag, count])).toEqual([['阅读', 2], ['思考', 1]]);
    expect(groups[0].clips.map(({ id }) => id)).toEqual(['new', 'old']);
  });
});
