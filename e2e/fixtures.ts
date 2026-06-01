import { test as base, expect } from '@playwright/test';
import { attachConsoleGuard } from './helpers/console-guard';

// Extends Playwright's test with a per-test console error collector.
export const test = base.extend<{ consoleErrors: string[] }>({
  consoleErrors: async ({ page }, use) => {
    const errors = attachConsoleGuard(page);
    await use(errors);
  },
});
export { expect };
