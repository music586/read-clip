import { expect, test } from '@playwright/test';

const rawBase = process.env.BASE_PATH || '/';
const base = rawBase === '/' ? '' : `/${rawBase.replace(/^\/+|\/+$/g, '')}`;
const path = (value: string) => `${base}${value}` || '/';

test('timeline links to a readable pure-Markdown clip', async ({ page }) => {
  await page.goto(path('/'));
  await expect(page.getByRole('heading', { name: '最近摘抄' })).toBeVisible();
  await page.getByRole('link', { name: '阅读也是一种思考', exact: true }).click();
  await expect(page.getByText('真正的阅读')).toBeVisible();
  await expect(page.locator('article.prose h1')).toHaveCount(0);
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
  await page.getByRole('searchbox', { name: '搜索摘抄' }).fill('NO_RESULT_7f41a9');
  await expect(page.getByRole('button', { name: '清除搜索' })).toBeVisible();
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
  await page.goto(path('/'));
  await page.getByRole('link', {
    name: '我用 Obsidian 搭了一套 Agent 知识系统，保姆教程来了！',
    exact: true,
  }).click();

  const externalLink = page.locator('article.prose a[href^="https://"]').first();
  await expect(externalLink).toBeVisible();

  const openedPagePromise = context.waitForEvent('page');
  await externalLink.click();
  const openedPage = await openedPagePromise;

  await expect(openedPage).toHaveURL(/^https:\/\//);
  await expect(page).toHaveURL(/\/clips\/[a-f0-9]{16}\/$/);
});

test('navigation stays under the configured Pages subpath', async ({ page }) => {
  test.skip(!base, 'only relevant when BASE_PATH is configured');
  await page.goto(path('/'));
  await expect(page.getByRole('link', { name: '分类', exact: true })).toHaveAttribute('href', `${base}/tags/`);
  await expect(page.getByRole('link', { name: '搜索', exact: true })).toHaveAttribute('href', `${base}/search/`);
  await expect(page.locator('link[rel="stylesheet"]')).toHaveAttribute('href', new RegExp(`${base}/`));
});
