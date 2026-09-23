import { defineConfig, devices } from '@playwright/test';

const rawBase = process.env.BASE_PATH || '/';
const base = rawBase === '/' ? '/' : `/${rawBase.replace(/^\/+|\/+$/g, '')}/`;
const origin = 'http://127.0.0.1:4321';

export default defineConfig({
  testDir: './test/e2e',
  fullyParallel: true,
  expect: { timeout: process.env.E2E_DEV === '1' ? 20_000 : 5_000 },
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `${origin}${base}`,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: process.env.E2E_DEV === '1'
      ? 'npm run dev -- --host 127.0.0.1'
      : 'npm run build && npm run preview -- --host 127.0.0.1',
    url: `${origin}${base}`,
    reuseExistingServer: !process.env.CI && process.env.E2E_DEV !== '1',
    timeout: 120_000,
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
  ],
});
