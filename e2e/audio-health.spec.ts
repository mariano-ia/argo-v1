import { test, expect } from './fixtures';

/**
 * Drives the public /demo flow with the QA fastplay seam enabled, all the way
 * to slide_3 ("Después de la Tormenta", screen index 22 — the scene where
 * audio used to silently die). At each gate it asserts that the in-flow audio
 * subsystem reports healthy state via the window.__argoAudio debug surface.
 *
 * Requires the deploy under test to have VITE_QA_SEAMS_ENABLED=1 set. The
 * seam is dead code in the prod bundle (gated at build time), so this spec
 * skips itself unless the env is set on the runner.
 */

const REQUIRE_SEAMS = process.env.QA_SEAMS_ENABLED === '1';

interface ArgoAudioDebug {
    music: HTMLAudioElement | null;
    effect: HTMLAudioElement | null;
    ctx: AudioContext | null;
    currentSrc: string | null;
    screenIndex: number;
    muted: boolean;
    lastTick?: number;
    ctxState?: string;
    effectPaused?: boolean;
    effectTime?: number;
}
declare global {
    interface Window { __argoAudio?: ArgoAudioDebug }
}

(REQUIRE_SEAMS ? test : test.skip)('audio: survives to slide_3 (post-storm) with fastplay seam', async ({ page, consoleErrors }) => {
    // The demo route. ?qa=fastplay activates the seam in OnboardingFlowV2.
    await page.goto('/demo?qa=fastplay');

    // Demo form: name + email + language + Empezar la odisea.
    await page.locator('input[autocomplete="given-name"]').fill('QA');
    await page.locator('input[type="email"]').fill('qa@argomethod.test');
    await page.getByRole('button', { name: /empezar la odisea|start the odyssey/i }).click();

    // Wait for the odyssey to actually start. screenIndex moves to 7 at intro_a.
    await page.waitForFunction(() => (window.__argoAudio?.screenIndex ?? 0) >= 7, null, { timeout: 15_000 });

    // Click through every "continue" we encounter until screenIndex hits 22.
    // Mini-games auto-advance via the fastplay seam after 300ms each. Story
    // slides + questions need clicks. We tolerate a missing button (e.g. on a
    // mini-game frame still booting) by waiting a tick and retrying.
    const maxIter = 60;
    for (let i = 0; i < maxIter; i++) {
        const idx = await page.evaluate(() => window.__argoAudio?.screenIndex ?? -1);
        if (idx >= 22) break;

        const continueBtn = page.getByRole('button', { name: /continuar|continue|empezar|aceptar/i }).first();
        const answerChip  = page.locator('[data-testid^="answer-"]').first();

        if (await continueBtn.isVisible().catch(() => false)) {
            await continueBtn.click().catch(() => {});
        } else if (await answerChip.isVisible().catch(() => false)) {
            await answerChip.click().catch(() => {});
        }
        await page.waitForTimeout(700); // motion settle + fastplay tick
    }

    // We should be on slide_3 (idx 22). Read the audio debug state.
    const state = await page.evaluate(() => {
        const a = window.__argoAudio;
        if (!a) return null;
        return {
            screenIndex: a.screenIndex,
            ctxState:    a.ctx?.state ?? a.ctxState ?? null,
            effectPaused: a.effect?.paused ?? null,
            effectTime:  a.effect?.currentTime ?? null,
            effectSrc:   a.currentSrc,
            muted:       a.muted,
            lastTick:    a.lastTick,
            tickAge:     a.lastTick ? Date.now() - a.lastTick : null,
        };
    });

    expect(state, '__argoAudio should be exposed').not.toBeNull();
    expect(state!.screenIndex, 'reached slide_3 (idx 22)').toBeGreaterThanOrEqual(22);
    // Watchdog must be ticking (state was sampled within the last 1.5s).
    expect(state!.tickAge ?? 9999, 'watchdog heartbeat fresh').toBeLessThan(1500);
    // Effect is the storm track and is actively playing.
    expect(state!.ctxState, 'AudioContext running').toBe('running');
    expect(state!.effectPaused, 'effect not paused').toBe(false);
    expect(state!.effectSrc, 'effect src points to effects_03').toMatch(/effects_03/);

    // Wait 1s and confirm currentTime advanced (no decoder stall).
    const t1 = state!.effectTime ?? 0;
    await page.waitForTimeout(1100);
    const t2 = await page.evaluate(() => window.__argoAudio?.effect?.currentTime ?? 0);
    expect(t2, 'effect currentTime advanced').toBeGreaterThan(t1);

    // No unhandled console errors.
    expect(consoleErrors, consoleErrors.join('\n')).toHaveLength(0);
});
