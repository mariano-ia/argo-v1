import { test } from './fixtures';

// Full odyssey -> AI report -> result screen.
// SKIPPED: completing the odyssey by browser requires app test seams that do not exist yet:
//   1. a data-testid (or accessible label) on the custom consent checkbox, and
//   2. a test/demo mode that bypasses the mini-games (canvas) used to measure "motor".
// Until those exist, report generation is validated directly via the AI eval
// (npm run qa:ai-eval, hits /api/generate-ai for every archetype) and the player entry path is
// validated by odyssey.spec.ts. Remove the skip once the seams are added.
test.skip('full odyssey completes and renders the AI report', async () => {
  // intentionally empty — see comment above
});
