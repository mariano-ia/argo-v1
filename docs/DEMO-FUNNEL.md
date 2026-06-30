# Argo Demo Funnel — "Jugar gratis" → demo report → buy / gift

> Status: In progress 2026-06-30.
> Discovery: most infra already existed — `is_demo` column (migration `20260602`), demo persists via `api/session.ts` + `OnboardingFlowV2` demoMode, email captured, admin "Demo" badge, and "gift full report" via `api/admin-grant-access.ts`.
> BUILT 2026-06-30: demo now actually LOCKS (api/report.ts returns `is_demo`; ReportPage lock fires on `(tenant_plan==='trial' || is_demo) && !full_access`); Motor de rendimiento shown in the demo; "Motor" removed from the locked teaser; one-demo-per-email guard (`api/check-demo.ts`) + "ya jugaste con este email" cartel in `Demo.tsx`; nav button "14 días gratis" → "Jugar gratis" → `/demo`.
> BUILT (Gap C, 2026-06-30): buy-to-unlock. `api/unlock-checkout.ts` ($9.99 Stripe USD / MercadoPago ARS tied to `session_id`, no one_purchases row); `api/one-webhook.ts` `handleUnlockPaid` sets `full_access=true` on the session (Stripe `metadata.source='unlock'`, MP `external_reference='unlock_<id>'`); the demo report CTA "Obtener informe completo" calls `/api/unlock-checkout` and redirects. VERIFIED on the develop preview 2026-06-30 (NOT on main): `/api/report` returns `is_demo` so the demo locks; `/api/check-demo` works (both the false case and the TRUE query path); `/api/unlock-checkout` creates real Stripe AND MercadoPago checkouts; guards work (`Session not found`, `Already unlocked`); `full_access` propagates to the report API (unlocked session serves `full_access:true`). The ONLY unverified link is the payment completion (Stripe/MP event → webhook `handleUnlockPaid` → `full_access`) — deferred to a real/test payment; the webhook branch mirrors the proven One/Puentes handlers and typechecks. Webhook-lag nuance: the success redirect may briefly show the report still locked until the webhook fires; acceptable for v1, could add a short retry on `?unlocked=1`.
> Decision locked: one demo per email = HARD BLOCK with a "ya jugaste con este email" notice (counts completed demos, case-insensitive, fail-open on API error).
> Related: `docs/pricing-v3.md` (pricing model), `src/pages/ReportPage.tsx` (locked report), `/demo` route + `DemoEndScreen.tsx`

## What it is

The free top-of-funnel entry that **replaces the "14 días gratis" trial**. A visitor plays the real odyssey, receives a **demo (locked) report**, and is invited to unlock the full report for **$9.99** (Argo One) — or the Argo team **gifts** it to promising leads. **One demo per email.** The same entry feeds both the consumer (One/Puente) and the institutional (Academy) funnels.

## Why

- **Product-led growth, low friction.** Instead of a dashboard trial (high setup, and Academy is now consultive), the person *lives the odyssey* and sees a piece of the report immediately.
- **The demo is the hook.** They see there is a full profile and want it (curiosity gap). The locked report state already exists.
- **Lead gen + qualification.** Every demo captures a real lead (email, child data, engagement). The team gifts the full report to interesting leads — a sales-assist lever that fits consultive Academy.

## The demo report — LOCKED, final spec (decided 2026-06-30)

Route: `/report/:sessionId` (the same report page). When the session is a **demo** (`is_demo`) and **not unlocked** (`full_access` false), it renders the LOCKED layout:

1. **Header** — child name, age, sport, date, responsible adult.
2. **Card 1** — archetype + profile summary + DISC distribution ("Composición del perfil").
3. **Card 2 — Motor de rendimiento** (shown in the demo).
4. **Lock card** — "El informe completo incluye mucho más" + the list of what is locked + a violet CTA button **"Obtener informe completo"**.

Everything after Motor (Qué lo mueve, Patrón de decisión, Palabras puente/ruido, Guía rápida, Checklist del día, Ecos fuera de la cancha) stays behind the lock.

The CTA is **gated on `is_demo`**: a trial-tenant locked report (a coach) keeps the old "contacta con quien te compartió el link" text; only demos show the $9.99 buy CTA. (This gating is already implemented in `ReportPage.tsx`.)

## What already exists (reuse, do not rebuild)

- **`/demo` route + `Demo` page + `DemoEndScreen`** — plays a demo odyssey, generates a report, renders it inline via `mockSession`. **Does NOT persist a session.**
- The real **odyssey onboarding**.
- The **locked report layout + `is_demo`-gated CTA** (built 2026-06-30).
- **`full_access` grant + full report email** — admin can unlock/gift any session (regenerates AI if missing, then emails the full report).
- **Argo One purchase** (`/one`, `one-checkout`, `one-webhook`).
- **`/api/report`** serves sessions publicly with a share token.
- **Parental consent** step in the play flow.

## Implementation plan

### Phase 0 — Data
- [ ] Migration: add `is_demo boolean not null default false` to `sessions` (+ index). Used to flag demos, gate the CTA, and filter demos out of real metrics.

### Phase 1 — Demo play + persist + one-per-email guard
- [ ] "Jugar gratis" enters the odyssey in **demo mode**.
- [ ] On completion, **persist the session with `is_demo=true`** and the captured adult email (extend `save-session` with the demo flag). Generate AI sections as usual, so the full report already exists for unlock/gift.
- [ ] **One demo per email:** `POST /api/start-demo` validates the email and dedupes — if a demo already exists for that email, send them to their existing demo report instead of creating a second.
- [ ] Keep the existing **parental consent** gate unchanged.

### Phase 2 — Demo report (mostly done)
- [x] Locked layout + Motor + `is_demo`-gated "Obtener informe completo" CTA (`ReportPage.tsx`, 2026-06-30).
- [ ] Remove "Motor de rendimiento" from the locked teaser list (`lockedBody`) since it is now shown above the lock.

### Phase 3 — Buy to unlock (the CTA)
- [ ] **The CTA unlocks THIS session, it is not a fresh Argo One.** The child already played in the demo; unlocking = pay $9.99 → set `full_access=true` on that session → send the full report email.
- [ ] Build a **demo-unlock checkout** tied to `session_id` (reuse `one-checkout` payment infra with a session reference, or a dedicated endpoint — decision below). On webhook payment success, grant `full_access` to that session and trigger the full report email.

### Phase 4 — Admin / gifting
- [ ] Demo sessions in `/admin` sessions list with a **"demo" badge + filter**.
- [ ] **Gift the full report = the existing `full_access` grant** (regenerates AI if missing + sends full report). Verify it works on demo sessions.

### Phase 5 — Entry point
- [ ] Change the **"14 días gratis" button → "Jugar gratis"**, routing to the demo onboarding (NOT `/signup`). Retire the trial CTA (Academy is consultive).

### Phase 6 — Nurturing (DEFERRED, design later)
- Email sequence to demo leads who did not buy. Out of scope for v1.

## Open decisions

1. **Buy-to-unlock plumbing:** reuse `one-checkout` with a `session_id` ref, or a dedicated `demo-unlock` endpoint? (Reuse is less code; dedicated is cleaner to reason about.)
2. **One-per-email behavior:** redirect to the existing demo report (recommended) vs a hard block.
3. **Email the locked demo report** to the parent (nurturing hook) or only show on screen? (At minimum, capture the email.)
4. **"Jugar gratis" placement:** nav button + hero CTA.
5. **Abuse:** add an IP rate-limit on top of one-per-email?

## Guardrails / risks

- **Cost:** each demo = 1 AI generation. One-per-email caps it. Filter `is_demo` out of real metrics so demos do not skew the dashboard.
- **Cannibalization:** the demo shows archetype + summary + DISC + Motor. If that gives away too much vs the $9.99 One, tighten what card 1 reveals.
- **Consent:** a real minor's behavioral data is captured to produce the demo. The parental consent gate must hold.
- **CTA context:** the $9.99 "Obtener informe completo" must never appear in a trial-tenant locked report (a coach) — it is gated on `is_demo`.

---

## Appendix — Today's session (2026-06-30)

Context for what led here.

**Pricing model + home card (shipped to prod, commits up to `8e5a887`):**
- Rebuilt the `/` home pricing block into a **3-column card**: **Argo One** ($9.99), **Argo One +** ($12.99, featured center), consultive **Argo Academy**. Brand typography (Argo bold + word light), each item with title + bajada using the **literal report section names** (Arquetipo, Qué lo mueve, Motor de rendimiento, Palabras puente, Palabras que suelen generar ruido, Guía rápida, Checklist del día). Anchored strikethrough prices ($12.99 / $14.99). Header "Planes para cada escala" + range subtitle. Buyer-neutral copy ("el niño", works for parents and coaches) with potential-based language. Academy CTA "Solicitar demo"; an Academy item clarifies every child gets the same individual report as One.
- Removed **"Carta de Navegación"** naming everywhere (UI/emails/crons/plan doc, es/en/pt). Eyebrows → "Argo Puentes · Tu vínculo", report title → "Tu Puente". The nautical metaphor belongs only to the child odyssey.

**Demo funnel (this doc):** designed the "Jugar gratis" → demo report → buy/gift flow; locked the demo report spec; implemented the locked layout + Motor + `is_demo`-gated CTA in `ReportPage.tsx`.
</content>
