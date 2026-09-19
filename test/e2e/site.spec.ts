import { expect, test, type Page } from '@playwright/test';

const rawBase = process.env.BASE_PATH || '/';
const base = rawBase === '/' ? '' : `/${rawBase.replace(/^\/+|\/+$/g, '')}`;
const path = (value: string) => `${base}${value}` || '/';

async function openTimelineClip(page: Page, title: string) {
  await page.goto(path('/'));
  const visited = new Set<string>();
  while (!visited.has(page.url())) {
    const currentUrl = page.url();
    visited.add(currentUrl);
    await expect(page.getByRole('heading', { name: '最近摘抄', exact: true })).toBeVisible();
    const article = page.getByRole('link', { name: title, exact: true });
    if (await article.count()) {
      await article.click();
      return;
    }
    const next = page.getByRole('navigation', { name: '分页' }).getByRole('link', { name: '下一页' });
    await expect(next, `未找到摘抄「${title}」，应能继续翻页`).toBeVisible();
    await Promise.all([page.waitForURL((url) => url.href !== currentUrl), next.click()]);
  }
  throw new Error(`分页出现循环，未找到摘抄：${title}`);
}

test('timeline links to a readable pure-Markdown clip', async ({ page }) => {
  await openTimelineClip(page, '阅读也是一种思考');
  await expect(page.getByText('真正的阅读')).toBeVisible();
  await expect(page.locator('article.prose h1')).toHaveCount(0);
  await expect(page).toHaveURL(new RegExp(`${base}/clips/[a-f0-9]{16}/$`));
});

test('mobile timeline cards link from the excerpt area', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('mobile'), 'only relevant on mobile');
  await page.goto(path('/'));

  const excerptBox = await page.locator('.clip-card .clip-excerpt').first().boundingBox();
  expect(excerptBox).not.toBeNull();
  await page.mouse.click(excerptBox!.x + excerptBox!.width / 2, excerptBox!.y + excerptBox!.height / 2);

  await expect(page).toHaveURL(new RegExp(`${base}/clips/[a-f0-9]{16}/$`));
});

test('search finds Chinese clip content and highlights the query', async ({ page }) => {
  await page.goto(path('/search/'));
  await page.getByRole('searchbox', { name: '搜索摘抄' }).fill('真正的阅读');
  const result = page.getByRole('link', { name: '阅读也是一种思考' });
  await expect(result).toBeVisible();
  await expect(result).toHaveAttribute('href', new RegExp(`${base}/clips/[a-f0-9]{16}/`));
  await expect(page.locator('mark', { hasText: '真正的阅读' })).toBeVisible();
});

test('search offers to clear an empty result', async ({ page }) => {
  await page.goto(path('/search/'));
  const searchbox = page.getByRole('searchbox', { name: '搜索摘抄' });
  await searchbox.fill('qzxvjkf41a9');

  const clearSearch = page.getByRole('button', { name: '清除搜索' });
  await expect(clearSearch).toBeVisible();
  await clearSearch.click();
  await expect(searchbox).toHaveValue('');
  await expect(page.getByText('输入关键词开始搜索')).toBeVisible();
});

test('tag directory opens a creation-time-sorted classification', async ({ page }) => {
  await page.goto(path('/tags/'));
  await expect(page.getByRole('heading', { name: '分类', exact: true })).toBeVisible();
  const firstTag = page.locator('.tag-directory a').first();
  await expect(firstTag).toBeVisible();
  await firstTag.click();
  await expect(page.getByText('按创建时间排列。')).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`${base}/tags/[\\w-]+/$`));
});

test('article tags stay outside the reader-mode article body', async ({ page }) => {
  await page.goto(path('/tags/'));
  await page.locator('.tag-directory a').first().click();
  await page.locator('.clip-card h2 a').first().click();
  const breadcrumbs = page.getByRole('navigation', { name: '面包屑导航' });
  await expect(breadcrumbs).toBeVisible();
  await expect(breadcrumbs.getByRole('link', { name: '首页' })).toHaveAttribute('href', path('/'));
  await expect(breadcrumbs.getByRole('link', { name: '分类' })).toHaveAttribute('href', path('/tags/'));
  await expect(page.locator('article.prose[data-pagefind-body] .breadcrumbs')).toHaveCount(0);
  await expect(page.locator('.detail-tags[data-pagefind-ignore]')).toBeVisible();
  await expect(page.locator('article.prose[data-pagefind-body] .tag-list')).toHaveCount(0);
});

test('external article links open in a new page', async ({ context, page }) => {
  await openTimelineClip(page, '我用 Obsidian 搭了一套 Agent 知识系统，保姆教程来了！');

  const externalLink = page.locator('article.prose a[href^="https://"]').first();
  await expect(externalLink).toBeVisible();

  const openedPagePromise = context.waitForEvent('page');
  await externalLink.click();
  const openedPage = await openedPagePromise;

  await expect(openedPage).toHaveURL(/^https:\/\//);
  await expect(page).toHaveURL(/\/clips\/[a-f0-9]{16}\/$/);
});

test('article images open in a full-size preview and close with Escape', async ({ page }) => {
  await openTimelineClip(page, '我用 Obsidian 搭了一套 Agent 知识系统，保姆教程来了！');

  const articleImage = page.locator('article.prose img').first();
  const source = await articleImage.getAttribute('src');
  await articleImage.click();

  const preview = page.getByRole('dialog', { name: '图片预览' });
  await expect(preview).toBeVisible();
  await expect(preview.locator('img')).toHaveAttribute('src', source!);

  await page.keyboard.press('Escape');
  await expect(preview).toBeHidden();
  await expect(articleImage).toBeFocused();
});

test('navigation stays under the configured Pages subpath', async ({ page }) => {
  test.skip(!base, 'only relevant when BASE_PATH is configured');
  await page.goto(path('/'));
  await expect(page.getByRole('link', { name: '分类', exact: true })).toHaveAttribute('href', `${base}/tags/`);
  await expect(page.getByRole('link', { name: '搜索', exact: true })).toHaveAttribute('href', `${base}/search/`);
  await expect(page.locator('link[rel="stylesheet"]')).toHaveAttribute('href', new RegExp(`${base}/`));
});

test('Markdown tables remain readable and scroll within the article', async ({ page }, testInfo) => {
  await openTimelineClip(page, '万字拆解 AI Agent 世代演变（2022–2026） \\#AI智能体');
  const region = page.getByRole('region', { name: '表格，可横向滚动' }).first();
  await expect(region).toBeVisible();
  await expect(region.getByRole('columnheader', { name: '世代', exact: true })).toBeVisible();
  await expect(region.getByRole('cell', { name: 'Gen 0', exact: true })).toBeVisible();
  await region.focus();
  await expect(region).toBeFocused();
  const dimensions = await region.evaluate((element) => ({
    width: element.clientWidth,
    scrollWidth: element.scrollWidth,
    pageWidth: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(dimensions.pageWidth).toBeLessThanOrEqual(dimensions.viewport);
  if (testInfo.project.name.startsWith('mobile')) {
    expect(dimensions.scrollWidth).toBeGreaterThan(dimensions.width);
    await region.press('ArrowRight');
    await expect.poll(() => region.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  }
  await region.screenshot({ path: testInfo.outputPath('table-light.png') });
  await page.emulateMedia({ colorScheme: 'dark' });
  await region.screenshot({ path: testInfo.outputPath('table-dark.png') });
});
