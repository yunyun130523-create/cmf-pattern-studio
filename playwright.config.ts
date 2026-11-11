import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  timeout: 90000,
  expect: { timeout: 20000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173/cmf-pattern-studio/',
    trace: 'off',
    screenshot: 'off',
    video: 'off',
    acceptDownloads: true,
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
    { name: 'mobile-webkit', use: { ...devices['iPhone 13'] } },
  ],
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort --base=/cmf-pattern-studio/',
    url: 'http://127.0.0.1:4173/cmf-pattern-studio/',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
