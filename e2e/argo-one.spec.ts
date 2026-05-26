import { test, expect } from './fixtures';

// Completing payment in Stripe's hosted checkout is flaky to automate, so this spec verifies the
// purchase STARTS checkout and redirects to Stripe (test mode). Webhook confirmation is covered
// at the API level by the synthetic monitor.
test('Argo One purchase starts Stripe checkout', async ({ page, consoleErrors }) => {
  await page.goto('/one');
  await page.getByRole('button', { name: /comprar|empezar|elegir|14\.99|1 informe/i }).first().click();

  const emailField = page.getByLabel(/email|correo/i);
  if (await emailField.isVisible().catch(() => false)) {
    await emailField.fill('qa-robot@argomethod.test');
    await page.getByRole('button', { name: /continuar|pagar|ir a pagar/i }).click();
  }

  // Expect redirect to Stripe Checkout (test mode). Assert the host, do not complete payment.
  await page.waitForURL(/checkout\.stripe\.com/, { timeout: 20_000 });
  expect(page.url()).toContain('checkout.stripe.com');
  expect(consoleErrors, consoleErrors.join('\n')).toHaveLength(0);
});
