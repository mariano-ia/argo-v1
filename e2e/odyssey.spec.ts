import { test, expect } from './fixtures';
import { reachRegistrationForm } from './helpers/play';

// Validates the player ENTRY path: the tenant play link works and a player can get from the
// language gate, through the intro slides, to the registration form rendered with its fields.
// This is the part that breaks most often on a deploy (bad slug, tenant lookup, onboarding render).
// Full completion to the AI report is not automated here: the consent checkbox is a custom control
// and the question phase includes mini-games (canvas). Completing it reliably needs app test seams
// (a data-testid on consent + a mode that bypasses mini-games) — see report.spec.ts (skipped).
test('player entry: language -> intro -> registration form renders', async ({ page, consoleErrors }) => {
  await reachRegistrationForm(page);

  await expect(page.locator('input[type=email]')).toBeVisible();
  // In the club flow the sport comes from the club's structures (per-plantel since
  // 2026-07-14, with tenants.sport as the legacy default — the QA tenant has one),
  // so the parent is NOT asked for it (it shows read-only) and the sport-chip
  // selector must not render. Chips would only appear as the last-resort fallback
  // when a legacy tenant has no sport anywhere; that is not this tenant.
  await expect(page.getByRole('button', { name: 'Fútbol' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /continuar/i })).toBeVisible();

  expect(consoleErrors, consoleErrors.join('\n')).toHaveLength(0);
});
