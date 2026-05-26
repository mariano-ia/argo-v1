import { test, expect } from './fixtures';

const EMAIL = process.env.QA_TENANT_EMAIL || 'qa-robot@argomethod.test';
const PASSWORD = process.env.QA_TENANT_PASSWORD || '';

test('test tenant can log in and see its dashboard', async ({ page, consoleErrors }) => {
  await page.goto('/signup'); // login lives on the same auth page (toggle) or /signup
  const toLogin = page.getByRole('button', { name: /iniciar sesi[oó]n|ya tengo cuenta/i });
  if (await toLogin.isVisible().catch(() => false)) await toLogin.click();

  await page.getByLabel(/email|correo/i).fill(EMAIL);
  await page.getByLabel(/contrase[ñn]a|password/i).first().fill(PASSWORD);
  await page.getByRole('button', { name: /iniciar sesi[oó]n|ingresar|entrar/i }).click();

  // Dashboard loaded: plan badge + team counter visible.
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
  await expect(page.getByText(/equipo/i).first()).toBeVisible();
  await expect(page.getByText(/sesiones/i).first()).toBeVisible();

  expect(consoleErrors, consoleErrors.join('\n')).toHaveLength(0);
});

test('signup form stays on page when submitted empty', async ({ page }) => {
  await page.goto('/signup');
  await page.getByRole('button', { name: /crear cuenta|registrarme|14 d[ií]as/i }).first().click();
  // Submitting empty should not navigate away.
  await expect(page).toHaveURL(/\/signup/);
});
