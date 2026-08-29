import { describe, expect, it } from 'vitest';
import { rehypeExternalLinks } from '../../scripts/rehype-external-links.mjs';

function transform(tree: any) {
  rehypeExternalLinks()(tree);
  return tree;
}

describe('rehypeExternalLinks', () => {
  it('opens HTTP(S) links in a new tab with safe rel attributes', () => {
    const tree = transform({
      type: 'root',
      children: [
        { type: 'element', tagName: 'a', properties: { href: 'https://example.com' }, children: [] },
      ],
    });

    expect(tree.children[0].properties).toEqual({
      href: 'https://example.com',
      target: '_blank',
      rel: ['noopener', 'noreferrer'],
    });
  });

  it('leaves site links and non-link elements unchanged', () => {
    const tree = transform({
      type: 'root',
      children: [
        { type: 'element', tagName: 'a', properties: { href: '/about/' }, children: [] },
        { type: 'element', tagName: 'a', properties: { href: '#section' }, children: [] },
        { type: 'element', tagName: 'p', properties: {}, children: [] },
      ],
    });

    expect(tree.children[0].properties).toEqual({ href: '/about/' });
    expect(tree.children[1].properties).toEqual({ href: '#section' });
    expect(tree.children[2].properties).toEqual({});
  });
});
