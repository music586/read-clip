import { describe, expect, it } from 'vitest';
import { clipPath, excerpt, sortClips } from '../../src/lib/clips';

describe('clip helpers', () => {
  it('sorts clips newest first and resolves ties by id', () => {
    const clips = [
      { id: 'z', data: { createdAt: '2026-01-01T00:00:00Z' } },
      { id: 'old', data: { createdAt: '2025-01-01T00:00:00Z' } },
      { id: 'a', data: { createdAt: '2026-01-01T00:00:00Z' } },
    ];
    expect(sortClips(clips).map(({ id }) => id)).toEqual(['a', 'z', 'old']);
  });

  it('removes Markdown and truncates an excerpt', () => {
    expect(excerpt('# 标题\n[真正的阅读](https://example.com) **开始**', 10)).toBe('标题 真正的阅读…');
  });

  it('creates a route from a generated id', () => {
    expect(clipPath('9cb6591ab73822db')).toBe('/clips/9cb6591ab73822db/');
  });
});
