import { defineConfig, devices } from '@playwright/test';

/**
 * System Chromium: the CDN (cdn.playwright.dev) is blocked on the server, so we do
 * NOT download a browser. `npx playwright install` must never be run there.
 * `channel: 'chrome'` makes Playwright drive the already-installed system Chrome
 * on the server instead of a downloaded build.
 */

export default defineConfig({
  timeout: 30_000,
  retries: 0,
  workers: 1,
  fullyParallel: false,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    launchOptions: { executablePath: '/usr/bin/chromium-browser' },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'setup-buyer',
      testMatch: /.*auth\/buyer\.setup\.ts/,
      use: { baseURL: 'http://185.164.73.143:3000' },
    },
    {
      name: 'setup-admin',
      testMatch: /.*auth\/admin\.setup\.ts/,
      use: { baseURL: 'http://185.164.73.143:3001' },
    },
    {
      name: 'setup-seller',
      testMatch: /.*auth\/seller\.setup\.ts/,
      use: { baseURL: 'http://185.164.73.143:3000' },
    },
    {
      // Buyer-side pages on :3000 — plus the multi-actor specs that drive the
      // buyer flow (they open their own :3001 admin context via browser.newContext).
      name: 'buyer',
      dependencies: ['setup-buyer'],
      testMatch:
        /health-check\.buyer\.spec\.ts$|rfq-flow|support-flow|custom-request-flow|load-test|button-health/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://185.164.73.143:3000',
        storageState: '.auth/buyer.json',
      },
      testIgnore: /.*auth\/.*/,
    },
    {
      // Admin-side pages on :3001 — health-check only. Multi-actor specs run
      // under `buyer` (once), never duplicated here.
      name: 'admin',
      dependencies: ['setup-admin'],
      testMatch: /health-check\.admin\.spec\.ts$/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://185.164.73.143:3001',
        storageState: '.auth/admin.json',
      },
      testIgnore: /.*auth\/.*/,
    },
    {
      // Seller-side pages on :3000 — multi-actor market listing flow runs here
      // exactly once. Depends on all three setups: the spec opens buyer, seller
      // AND admin contexts (scenarios 1/3 cancel via /admin-material-listings).
      name: 'seller',
      dependencies: ['setup-buyer', 'setup-seller', 'setup-admin'],
      testMatch: /market-listing-flow/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://185.164.73.143:3000',
        storageState: '.auth/seller.json',
      },
      testIgnore: /.*auth\/.*/,
    },
  ],
});
