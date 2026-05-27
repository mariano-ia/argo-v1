import { test, expect } from './fixtures';
import { reachRegistrationForm } from './helpers/play';

const RUNS = Number(process.env.MONKEY_RUNS || 3);
function rnd<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

// Exploratory fuzz of the registration form (the reachable part of the play flow): hammers the
// fields with odd input and checks the page does not crash and the submit stays gated until consent.
for (let run = 1; run <= RUNS; run++) {
  test(`monkey registration run ${run} never crashes`, async ({ page, consoleErrors }) => {
    await reachRegistrationForm(page);

    const texts = page.locator('input[type=text]:visible');
    if (await texts.count()) await texts.nth(0).fill(rnd(['', '  ', 'José Müller', "O'Brien", '🚀🚀🚀', 'x'.repeat(120)]));
    if (await texts.count() > 1) await texts.nth(1).fill(rnd(['a', 'Pipe', '<script>alert(1)</script>']));
    await page.locator('input[type=email]:visible').first().fill(rnd(['not-an-email', 'a@b', 'qa-robot@argomethod.test']));
    await page.getByRole('button', { name: rnd(['Fútbol', 'Tenis', 'Otro']) }).first().click().catch(() => {});

    // Without consent, the submit must stay disabled (the gate holds).
    await expect(page.getByRole('button', { name: /continuar/i }).first()).toBeDisabled();
    // No uncaught script execution / page errors.
    expect(consoleErrors.filter(e => !/validation|required|invalid/i.test(e)), consoleErrors.join('\n')).toHaveLength(0);
  });
}
