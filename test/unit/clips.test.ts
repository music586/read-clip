import { describe, expect, it } from 'vitest';
import { assertUniqueClipPaths, assertValidClipBodies, clipPath, excerpt, publicProjection } from '../../src/lib/clips';

const fixtures = [
  { id: 'old-public', body: 'old', data: { private: false, createdAt: '2025-01-01T00:00:00Z' } },
  { id: 'private', body: 'secret', data: { private: true, createdAt: '2027-01-01T00:00:00Z' } },
  { id: 'new-public', body: 'new', data: { private: false, createdAt: '2026-01-01T00:00:00Z' } },
];

describe('clip helpers', () => {
  it('removes private clips and sorts public clips newest first', () => {
    expect(publicProjection(fixtures).map((clip) => clip.id)).toEqual(['new-public', 'old-public']);
  });

  it('sorts equal timestamps by stable id', () => {
    const clips = [
      { id: 'z', data: { private: false, createdAt: '2026-01-01T00:00:00Z' } },
      { id: 'a', data: { private: false, createdAt: '2026-01-01T00:00:00Z' } },
    ];
    expect(publicProjection(clips).map(({ id }) => id)).toEqual(['a', 'z']);
  });

  it('removes Markdown and truncates an excerpt', () => {
    expect(excerpt('# 标题\n[真正的阅读](https://example.com) **开始**', 10)).toBe('标题 真正的阅读…');
  });

  it('creates URI-safe nested clip paths', () => {
    expect(clipPath('2026/中文 clip.md')).toBe('/clips/2026/%E4%B8%AD%E6%96%87%20clip/');
  });

  it('names an empty-body clip', () => {
    expect(() => assertValidClipBodies([{ id: 'empty.md', body: '  \n' }])).toThrow('Empty clip body: empty.md');
  });

  it('names both colliding IDs', () => {
    expect(() => assertUniqueClipPaths([{ id: 'same.md' }, { id: 'same.mdx' }])).toThrow(/same\.md.*same\.mdx/);
  });
});
