import { test, expect } from './fixtures';

// Skipped by default: production uses LIVE Stripe, so we must NOT drive a real checkout here.
// Enable with QA_ALLOW_STRIPE=1 against a target that uses Stripe TEST keys (e.g. a preview).
test('Argo One purchase starts Stripe checkout', async ({ page }) => {
  test.skip(process.env.QA_ALLOW_STRIPE !== '1', 'set QA_ALLOW_STRIPE=1 against a Stripe test-mode target');

  await page.goto('/one');
  await page.locator('input[type=email]:visible').first().fill('qa-robot@argomethod.test').catch(() => {});
  await page.getByRole('button', { name: /comprar/i }).first().click();

  await page.waitForURL(/checkout\.stripe\.com/, { timeout: 20_000 });
  expect(page.url()).toContain('checkout.stripe.com');
});
