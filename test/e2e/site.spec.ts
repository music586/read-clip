import { expect, test } from '@playwright/test';

const rawBase = process.env.BASE_PATH || '/';
const base = rawBase === '/' ? '' : `/${rawBase.replace(/^\/+|\/+$/g, '')}`;
const path = (value: string) => `${base}${value}` || '/';

test('timeline links to a readable pure-Markdown clip', async ({ page }) => {
  await page.goto(path('/'));
  await expect(page.getByRole('heading', { name: '阅读摘抄' })).toBeVisible();
  await page.getByRole('link', { name: '阅读也是一种思考', exact: true }).click();
  await expect(page.getByText('真正的阅读')).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`${base}/clips/[a-f0-9]{16}/$`));
});

test('theme preference persists', async ({ page }) => {
  await page.goto(path('/'));
  const toggle = page.getByRole('button', { name: '切换深色模式' });
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
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

test('navigation stays under the configured Pages subpath', async ({ page }) => {
  test.skip(!base, 'only relevant when BASE_PATH is configured');
  await page.goto(path('/'));
  await expect(page.getByRole('link', { name: '搜索' })).toHaveAttribute('href', `${base}/search/`);
  await expect(page.locator('link[rel="stylesheet"]')).toHaveAttribute('href', new RegExp(`${base}/`));
});
