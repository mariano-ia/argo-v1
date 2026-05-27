import { test, expect } from './fixtures';

const EMAIL = process.env.QA_TENANT_EMAIL || 'qa-robot@argomethod.test';
const PASSWORD = process.env.QA_TENANT_PASSWORD || '';

// Logs in as the synthetic qa-robot tenant and confirms the dashboard loads.
// Selectors are language-agnostic (input types + bilingual button regex) because the auth page
// renders in EN or ES depending on locale.
test('test tenant can log in and reach its dashboard', async ({ page }) => {
  test.skip(!PASSWORD, 'QA_TENANT_PASSWORD not set');
  await page.goto('/signup');

  // Switch from signup to login mode.
  await page.getByRole('button', { name: /sign in|iniciar sesi[oó]n/i }).first().click().catch(() => {});
  await page.waitForTimeout(500);

  await page.locator('input[type=email]:visible').first().fill(EMAIL);
  await page.locator('input[type=password]:visible').first().fill(PASSWORD);
  await page.getByRole('button', { name: /^(sign in|iniciar sesi[oó]n|ingresar|entrar)/i }).first().click();

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
});

test('signup submit is disabled until the form is valid', async ({ page }) => {
  await page.goto('/signup');
  // The "Create account" button is gated: disabled while the form is empty/invalid.
  await expect(page.getByRole('button', { name: /crear cuenta|create account/i }).first()).toBeDisabled();
});
