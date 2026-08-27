import { describe, expect, it } from 'vitest';
import { withBase } from '../../src/lib/urls';

describe('withBase', () => {
  it('creates a base-aware absolute site path', () => {
    expect(withBase('/tags/reading/', '/read-clip')).toBe('/read-clip/tags/reading/');
    expect(withBase('/', '/')).toBe('/');
  });

  it('rejects relative paths', () => {
    expect(() => withBase('tags/')).toThrow('must start');
  });
});
