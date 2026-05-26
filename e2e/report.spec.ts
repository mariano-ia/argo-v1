import { test, expect } from './fixtures';

const SLUG = process.env.QA_TENANT_SLUG || 'qa-robot';

test('result screen renders AI report sections without errors', async ({ page, consoleErrors }) => {
  await page.goto(`/play/${SLUG}`);
  await page.getByLabel(/nombre.*adulto|tu nombre/i).fill('QA Adulto');
  await page.getByLabel(/email|correo/i).fill('qa-robot@argomethod.test');
  await page.getByLabel(/nombre.*nin|nombre.*hij|deportista/i).fill('QA Reporte');
  await page.getByLabel(/edad/i).fill('11');
  await page.getByRole('button', { name: /empezar|comenzar|continuar/i }).click();
  for (let i = 0; i < 12; i++) {
    await page.getByRole('button').filter({ hasText: /.+/ }).first().click();
    const next = page.getByRole('button', { name: /siguiente|continuar/i });
    if (await next.isVisible().catch(() => false)) await next.click();
    await page.waitForTimeout(300);
  }
  // AI sections present (resumen / combustible / corazón are part of the report).
  await expect(page.getByText(/combustible|coraz[oó]n|resumen|palabras/i).first())
    .toBeVisible({ timeout: 45_000 });
  // No "error generating" type text.
  await expect(page.getByText(/no se pudo generar|error al generar/i)).toHaveCount(0);
  expect(consoleErrors, consoleErrors.join('\n')).toHaveLength(0);
});
