import { test, expect } from './fixtures';

const GARBAGE_EMAILS = ['', 'not-an-email', 'a@b', 'x'.repeat(300) + '@test.com', '"><script>alert(1)</script>@x.com'];
const GARBAGE_PASSWORDS = ['', '123', 'aaaaaaaa', 'ñ', ' '.repeat(20)];

test('signup handles garbage input without crashing', async ({ page, consoleErrors }) => {
  await page.goto('/signup');
  for (let i = 0; i < GARBAGE_EMAILS.length; i++) {
    await page.getByLabel(/email|correo/i).fill(GARBAGE_EMAILS[i]);
    await page.getByLabel(/contrase[ñn]a|password/i).first().fill(GARBAGE_PASSWORDS[i % GARBAGE_PASSWORDS.length]);
    await page.getByRole('button', { name: /crear cuenta|registrarme|14 d[ií]as/i }).first().click();
    // Must stay on /signup (validation blocks) and must not throw an uncaught error.
    await expect(page).toHaveURL(/\/signup/);
    await page.waitForTimeout(150);
  }
  // No XSS execution and no uncaught errors (ignore expected validation messages).
  expect(consoleErrors.filter(e => !/validation|required|invalid/i.test(e)),
    consoleErrors.join('\n')).toHaveLength(0);
});
