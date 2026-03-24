---
name: qa
description: Run the Argo QA protocol — TypeScript, build, routes, flow integrity, API endpoints, env vars, and branch status
disable-model-invocation: true
---

# Argo QA Protocol

Run a comprehensive quality assurance check on the Argo codebase. Report results as a checklist with pass/fail per item and details for any failures.

## Checks to run (in order)

### 1. Branch & Git status
- Show current branch name
- List uncommitted changes (if any)
- Warn if on `main` with uncommitted changes

### 2. TypeScript
- Run `npx tsc --noEmit`
- Report errors (if any) with file:line details

### 3. Build
- Run `npx vite build`
- Report success or failure with error details

### 4. Route integrity
- Read `src/App.tsx` and list all `<Route>` paths
- Verify that each route's `element` component import resolves to an existing file
- Flag any route pointing to a missing component

### 5. Odyssey flow integrity
- Read the `SCREENS` array in `src/components/onboarding/OnboardingFlowV2.tsx`
- Verify the sequence is coherent: adult intro → registration → handoff → story/questions → child-result
- Verify `child-result` is the last screen before end
- Verify the profile resolution useEffect triggers on the correct screen type (`child-result`)
- Verify email sending happens in the completion flow (sendReport call exists)
- Verify `ODYSSEY_END` constant matches the index of `child-result`

### 6. API endpoints
- List all `.ts` files in `/api`
- Verify each exports a default function (valid Vercel handler)
- Check that referenced env vars (`SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_URL`, `RESEND_API_KEY`) are used consistently

### 7. Import sanity
- Run a quick check: grep for imports from `./screens/`, `../../lib/`, etc. in key files and verify the imported files exist
- Focus on OnboardingFlowV2, App.tsx, TenantHome, Sessions dashboard

### 8. Child reveal texts
- Verify `src/lib/childRevealTexts.ts` has exactly 12 entries (3 per DISC axis)
- Verify all keys match the pattern `{eje}_{motor_label}` used by `argosEngine`
- Cross-reference with archetype IDs in `archetypeData.ts`

### 9. Env vars
- Grep for `import.meta.env.VITE_` and `process.env.` across the codebase
- List all referenced env vars
- Flag any that seem unused or duplicated

## Output format

```
## Argo QA Report — [branch] — [date]

1. Branch & Git    [PASS/FAIL] details
2. TypeScript      [PASS/FAIL] details
3. Build           [PASS/FAIL] details
4. Routes          [PASS/FAIL] details
5. Odyssey flow    [PASS/FAIL] details
6. API endpoints   [PASS/FAIL] details
7. Import sanity   [PASS/FAIL] details
8. Reveal texts    [PASS/FAIL] details
9. Env vars        [PASS/FAIL] details

Summary: X/9 passed
```

If $ARGUMENTS contains extra context (e.g., "after deploy", "focus on email"), mention it in the report header and pay extra attention to those areas.
