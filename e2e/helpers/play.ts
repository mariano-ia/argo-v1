import { type Page, expect } from '@playwright/test';

const SLUG = process.env.QA_TENANT_SLUG || 'qa-robot';

// Drives the play flow from the language gate through the intro slides to the registration form.
// Waits ~1s between advances so the Framer Motion slide transitions settle (otherwise a fast click
// hits the outgoing slide's button and does not advance).
export async function reachRegistrationForm(page: Page): Promise<void> {
  await page.goto(`/play/${SLUG}`);
  await expect(page.getByText('Comenzar en español')).toBeVisible({ timeout: 20_000 });
  await page.getByText('Comenzar en español').click();
  await page.waitForTimeout(1000);

  for (let i = 0; i < 8; i++) {
    if (await page.getByRole('heading', { name: /tus datos y los del deportista/i }).isVisible().catch(() => false)) return;
    const next = page.getByRole('button', { name: /siguiente|comenzar el registro/i }).first();
    if (await next.isVisible().catch(() => false)) await next.click().catch(() => {});
    await page.waitForTimeout(1000);
  }
  await expect(page.getByRole('heading', { name: /tus datos y los del deportista/i })).toBeVisible({ timeout: 10_000 });
}
