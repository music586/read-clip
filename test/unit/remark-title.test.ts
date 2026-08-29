import { describe, expect, it } from 'vitest';
import { removeFirstHeading } from '../../scripts/remark-remove-first-heading.mjs';

describe('Markdown title rendering', () => {
  it('removes only the first top-level heading from the rendered body', () => {
    const tree = {
      type: 'root',
      children: [
        { type: 'heading', depth: 1, children: [{ type: 'text', value: '文章标题' }] },
        { type: 'paragraph', children: [{ type: 'text', value: '正文' }] },
        { type: 'heading', depth: 2, children: [{ type: 'text', value: '正文小节' }] },
      ],
    };

    removeFirstHeading(tree);
    expect(tree.children.map((node) => node.type)).toEqual(['paragraph', 'heading']);
    expect(tree.children[1]).toMatchObject({ depth: 2 });
  });

  it('leaves heading-free Markdown unchanged', () => {
    const tree = { type: 'root', children: [{ type: 'paragraph', children: [] }] };
    removeFirstHeading(tree);
    expect(tree.children).toHaveLength(1);
  });
});
