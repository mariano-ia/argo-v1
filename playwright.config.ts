import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config'; // load QA_* + QA_BASE_URL from .env for local runs (no-op in CI)

const BASE_URL = process.env.QA_BASE_URL || 'http://localhost:4173';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
