import { test, expect } from './fixtures';

const SLUG = process.env.QA_TENANT_SLUG || 'qa-robot';
const RUNS = Number(process.env.MONKEY_RUNS || 5);

function rnd<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

for (let run = 1; run <= RUNS; run++) {
  test(`monkey odyssey run ${run} never crashes`, async ({ page, consoleErrors }) => {
    await page.goto(`/play/${SLUG}`);
    await page.getByLabel(/nombre.*adulto|tu nombre/i).fill(rnd(['Ana', 'José Müller', "O'Brien", '  ', '🚀 test']));
    await page.getByLabel(/email|correo/i).fill('qa-robot@argomethod.test');
    await page.getByLabel(/nombre.*nin|nombre.*hij|deportista/i).fill(rnd(['Pipe', 'a', 'NombreMuyLargoooooooooooooo']));
    await page.getByLabel(/edad/i).fill(rnd(['8', '16', '10']));
    await page.getByRole('button', { name: /empezar|comenzar|continuar/i }).click();

    for (let i = 0; i < 12; i++) {
      const options = await page.getByRole('button').filter({ hasText: /.+/ }).all();
      if (options.length) await rnd(options).click();
      const next = page.getByRole('button', { name: /siguiente|continuar/i });
      if (await next.isVisible().catch(() => false)) await next.click();
      await page.waitForTimeout(200);
    }
    await expect(page.getByText(/perfil|arquetipo|combustible/i).first()).toBeVisible({ timeout: 45_000 });
    expect(consoleErrors, consoleErrors.join('\n')).toHaveLength(0);
  });
}
