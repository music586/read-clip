import { describe, expect, it } from 'vitest';
import { withBase } from '../../src/lib/urls';

describe('withBase', () => {
  it('creates a base-aware absolute site path', () => {
    expect(withBase('/search/', '/read-clip')).toBe('/read-clip/search/');
    expect(withBase('/', '/')).toBe('/');
  });

  it('rejects relative paths', () => {
    expect(() => withBase('search/')).toThrow('must start');
  });
});
