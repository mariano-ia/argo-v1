import { test, expect } from './fixtures';

const EMAIL = process.env.QA_TENANT_EMAIL || 'qa-robot@argomethod.test';
const PASSWORD = process.env.QA_TENANT_PASSWORD || '';

test('AI consultant responds to a question', async ({ page, consoleErrors }) => {
  await page.goto('/signup');
  const toLogin = page.getByRole('button', { name: /iniciar sesi[oó]n|ya tengo cuenta/i });
  if (await toLogin.isVisible().catch(() => false)) await toLogin.click();
  await page.getByLabel(/email|correo/i).fill(EMAIL);
  await page.getByLabel(/contrase[ñn]a|password/i).first().fill(PASSWORD);
  await page.getByRole('button', { name: /iniciar sesi[oó]n|ingresar|entrar/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });

  // Open the consultant and send a generic, safe question.
  await page.getByRole('link', { name: /asistente|consultor|chat/i }).first().click();
  const input = page.getByRole('textbox').first();
  await input.fill('¿Cómo motivo a un perfil estratega antes de una competencia?');
  await page.getByRole('button', { name: /enviar|preguntar/i }).first().click();

  // A response with non-trivial length appears within the AI timeout.
  await expect(page.getByText(/.{40,}/).last()).toBeVisible({ timeout: 45_000 });
  expect(consoleErrors, consoleErrors.join('\n')).toHaveLength(0);
});
