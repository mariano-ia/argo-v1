import { test, expect } from './fixtures';

const GARBAGE_INST = ['', '  ', '<script>alert(1)</script>', 'x'.repeat(200), '🚀 Club'];
const GARBAGE_EMAILS = ['', 'not-an-email', 'a@b', 'x'.repeat(300) + '@test.com', '"><img src=x onerror=alert(1)>@x.com'];
const GARBAGE_PASSWORDS = ['', '123', 'aaaaaaaa', 'ñ', ' '.repeat(20)];

// Fuzz the signup form with garbage input. Uses input types (page renders EN or ES, no labels).
// Does NOT click the submit (it is correctly disabled until the form is valid); the point is that
// odd input neither crashes the page nor navigates away nor executes injected markup.
test('signup handles garbage input without crashing', async ({ page, consoleErrors }) => {
  let dialog = false;
  page.on('dialog', async d => { dialog = true; await d.dismiss().catch(() => {}); });

  await page.goto('/signup');
  const inst = page.locator('input[type=text]:visible').first();
  const email = page.locator('input[type=email]:visible').first();
  const pwds = page.locator('input[type=password]:visible');

  for (let i = 0; i < GARBAGE_EMAILS.length; i++) {
    await inst.fill(GARBAGE_INST[i % GARBAGE_INST.length]).catch(() => {});
    await email.fill(GARBAGE_EMAILS[i]).catch(() => {});
    await pwds.nth(0).fill(GARBAGE_PASSWORDS[i % GARBAGE_PASSWORDS.length]).catch(() => {});
    if (await pwds.count() > 1) await pwds.nth(1).fill('different-' + i).catch(() => {}); // mismatched
    await page.waitForTimeout(150);
    await expect(page).toHaveURL(/\/signup/); // never navigates on invalid input
  }

  expect(dialog, 'an injected alert() dialog fired (XSS)').toBe(false);
  expect(consoleErrors.filter(e => !/validation|required|invalid/i.test(e)), consoleErrors.join('\n')).toHaveLength(0);
});
