import { test, expect } from './fixtures';

const SLUG = process.env.QA_TENANT_SLUG || 'qa-robot';

test('odyssey completes end-to-end and reaches the result screen', async ({ page, consoleErrors }) => {
  await page.goto(`/play/${SLUG}`);

  // 1) Lightweight adult identification form (name, email, child name, age, sport).
  //    Selectors confirmed via `npx playwright codegen` — adjust getByLabel targets if labels differ.
  await page.getByLabel(/nombre.*adulto|tu nombre/i).fill('QA Adulto');
  await page.getByLabel(/email|correo/i).fill('qa-robot@argomethod.test');
  await page.getByLabel(/nombre.*nin|nombre.*hij|deportista/i).fill('QA Kid');
  await page.getByLabel(/edad/i).fill('10');
  const sportChip = page.getByRole('button', { name: /f[uú]tbol|tenis|b[aá]squet/i }).first();
  if (await sportChip.isVisible().catch(() => false)) await sportChip.click();
  await page.getByRole('button', { name: /empezar|comenzar|continuar/i }).click();

  // 2) Answer all 12 questions by clicking the first option each time.
  for (let i = 0; i < 12; i++) {
    const options = page.getByRole('button').filter({ hasText: /.+/ });
    await options.first().click();
    const next = page.getByRole('button', { name: /siguiente|continuar/i });
    if (await next.isVisible().catch(() => false)) await next.click();
    await page.waitForTimeout(300);
  }

  // 3) Result screen: archetype label visible within the AI generation timeout.
  await expect(page.getByText(/perfil|arquetipo|impulsor|conector|sost[eé]n|estratega/i).first())
    .toBeVisible({ timeout: 45_000 });

  // 4) No browser console errors during the whole flow.
  expect(consoleErrors, consoleErrors.join('\n')).toHaveLength(0);
});
