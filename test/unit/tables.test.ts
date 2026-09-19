import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import { expect, it } from 'vitest';
import { rehypeTables } from '../../scripts/rehype-tables.mjs';

it('renders Markdown tables in a keyboard-accessible region while preserving alignment and inline formatting', async () => {
  const processor = await createMarkdownProcessor({ rehypePlugins: [rehypeTables] });
  const { code } = await processor.render('| 名称 | 数量 |\n| :--- | ---: |\n| **摘抄** | 12 |');
  expect(code).toContain('class="table-scroll"');
  expect(code).toContain('tabindex="0"');
  expect(code).toContain('aria-label="表格，可横向滚动"');
  expect(code).toContain('<table>');
  expect(code).toContain('<strong>摘抄</strong>');
  expect(code).toMatch(/<td[^>]*(?:align="right"|text-align:right)[^>]*>12<\/td>/);
});
