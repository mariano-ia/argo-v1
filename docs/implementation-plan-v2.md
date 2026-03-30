# Argo Method — Implementation Plan: Pricing v2

> Created: 2026-03-30
> Target branch: develop

---

## Overview

Migration from credit-based model to roster-based model, elimination of Squad plan,
Gemini AI integration, Argo One standalone flow, and fair use AI policy.

---

## Phase 1: Database & API (roster model)

### 1.1 Database schema changes

- [ ] Add `roster_limit` column to `tenants` table (integer, default 8 for trial)
- [ ] Add `roster_used` computed or cached column (count of active players)
- [ ] Add `archived_at` column to `sessions` table (nullable timestamp, for archiving players)
- [ ] Add `last_profiled_at` column to `sessions` table (timestamp, for 6-month cooldown)
- [ ] Add `ai_queries_count` column to `tenants` table (integer, resets monthly)
- [ ] Add `ai_queries_reset_at` column to `tenants` table (timestamp)
- [ ] Deprecate `credits_remaining` column (keep for migration, remove later)
- [ ] Drop or archive `credit_transactions` table
- [ ] Update RLS policies if applicable

### 1.2 API: start-play.ts

- [ ] Replace credit check with roster capacity check:
  - New player: `active_players_count < roster_limit`
  - Existing player (re-profile): `last_profiled_at` older than 6 months
- [ ] Remove credit deduction logic
- [ ] Return appropriate error messages:
  - Roster full: "roster_full" (not "no_credits")
  - Cooldown active: "cooldown_active" with remaining days

### 1.3 API: create-tenant.ts

- [ ] Set `roster_limit: 8` instead of `credits_remaining: 3`
- [ ] Set `plan: 'trial'`
- [ ] Set `trial_expires_at: now + 14 days`

### 1.4 API: tenant-info.ts

- [ ] Return `roster_limit` and `active_players_count` instead of `credits_remaining`
- [ ] Return `plan` details (features, limits)

### 1.5 API: tenant-setup.ts

- [ ] Remove any credit-related fields from update logic

### 1.6 New API: archive-player.ts

- [ ] POST endpoint to archive a player (set `archived_at`)
- [ ] Validates: player belongs to tenant, player is active
- [ ] Decrements active player count

### 1.7 New API: reactivate-player.ts

- [ ] POST endpoint to reactivate an archived player
- [ ] Validates: roster has space, player was archived
- [ ] Clears `archived_at`

### 1.8 API: AI query tracking

- [ ] Add middleware/logic to increment `ai_queries_count` per tenant on each consultant query
- [ ] Monthly reset via cron or on-read check (`ai_queries_reset_at`)
- [ ] Soft cap check: if exceeded, return `fair_use_exceeded` flag (don't block)

---

## Phase 2: Dashboard UI (credit → roster)

### 2.1 Sidebar trial banner

- [ ] Replace "X creditos" with roster progress indicator: "X / Y jugadores"
- [ ] Visual: progress bar instead of count
- [ ] Update all 3 languages (ES/EN/PT) in dashboardTranslations.ts

### 2.2 Home page

- [ ] Replace credits widget with roster capacity widget
- [ ] Positive framing: "Te faltan X jugadores por perfilar" instead of "Te quedan X creditos"

### 2.3 Settings page

- [ ] Account section: show plan, roster used/limit, renewal date
- [ ] Remove credit display

### 2.4 Players page (TenantPlayers.tsx)

- [ ] Add "Archivar jugador" action per player
- [ ] Add "Jugadores archivados" section (collapsible)
- [ ] Add "Reactivar" action on archived players
- [ ] Show roster usage indicator: "X / Y jugadores activos"

### 2.5 Translations (dashboardTranslations.ts)

- [ ] Remove: creditosDisponibles, creditoNota, creditoConteo, comprarCreditos
- [ ] Add: rosterUsado, rosterLimite, jugadoresActivos, archivarJugador, reactivarJugador, rosterLleno, cooldownActivo
- [ ] Update all 3 languages

### 2.6 Onboarding (TenantOnboarding.tsx)

- [ ] Slide 1 creditNote: replace credit language with roster language
  - ES: "Cada deportista ocupa un lugar en tu equipo. Si no completa la experiencia, el perfil queda pendiente y puedes reintentar."
  - EN: "Each athlete takes a spot on your roster. If they don't complete the experience, the profile stays pending and you can retry."
  - PT: "Cada atleta ocupa um lugar no seu time. Se nao completar a experiencia, o perfil fica pendente e voce pode tentar novamente."

### 2.7 AI consultant soft cap UI

- [ ] When `fair_use_exceeded` flag is returned, show non-blocking banner:
  - ES: "Has superado el limite de uso justo de este mes. Si necesitas mas capacidad, contacta a nuestro equipo."
- [ ] Do NOT show a counter or progress bar for AI queries (invisible limit)

---

## Phase 3: Gemini AI migration

### 3.1 Integration

- [ ] Add `GEMINI_API_KEY` to environment variables (Vercel + local)
- [ ] Create `src/lib/geminiService.ts` (or refactor `openaiService.ts`)
- [ ] Implement Gemini 1.5 Pro API calls matching current OpenAI interface:
  - `generateAISections()` for report generation
  - Consultant chat endpoint
- [ ] Maintain same prompt structure (system prompt + player context + user query)

### 3.2 Testing

- [ ] Compare report quality: GPT-4o vs Gemini 1.5 Pro (sample of 10+ profiles)
- [ ] Compare consultant quality: same questions, evaluate responses
- [ ] Performance benchmark: latency comparison

### 3.3 Cutover

- [ ] Feature flag: `AI_PROVIDER=gemini|openai` in env vars
- [ ] Deploy with Gemini, monitor for 48h
- [ ] Remove OpenAI integration once stable

---

## Phase 4: Welcome emails update

### 4.1 Update email templates

- [ ] welcome-trial.html: "hasta 8 jugadores" instead of "3 creditos"
- [ ] welcome-paid.html: "Hasta {{roster}} jugadores activos" instead of "{{creditos}} creditos"
- [ ] welcome-upgrade.html: no changes needed (already credit-free)

### 4.2 Integrate send on signup

- [ ] Call send-welcome from `create-tenant.ts` after successful tenant creation
- [ ] Select template based on plan (trial vs paid)

---

## Phase 5: Argo One (standalone parent flow)

### 5.1 New payment flow

- [ ] Landing page section or dedicated `/one` page
- [ ] Pack selection (1 / 3 / 5 profiles)
- [ ] Payment via Stripe / MercadoPago
- [ ] On payment success: generate unique play link(s), send by email
- [ ] No tenant creation, no dashboard, no account

### 5.2 New API: create-one-purchase.ts

- [ ] Validates payment
- [ ] Generates 1/3/5 unique slugs (one-time use links)
- [ ] Stores in `one_purchases` table (email, slugs, status)
- [ ] Sends email with links

### 5.3 Play flow for Argo One

- [ ] `/play/:slug` detects if slug belongs to a tenant or an Argo One purchase
- [ ] Argo One flow: same odyssey, but on completion sends full report by email (no dashboard save)
- [ ] Mark slug as consumed after completion

---

## Phase 6: Terms of Service & Privacy Policy

- [ ] Draft Terms of Service including:
  - Fair use AI policy (500/1000 monthly consultation limits)
  - Roster and archiving rules
  - Re-profiling cooldown (6 months)
  - Data retention policy
  - Subscription terms (billing, cancellation, downgrades)
  - Argo One terms (non-refundable, one-time use)
- [ ] Draft Privacy Policy including:
  - Data collected (child behavioral responses, adult contact info)
  - DISC profiling methodology disclosure
  - Data storage (Supabase/PostgreSQL)
  - Third-party services (Gemini AI, Resend, Vercel)
  - Data subject rights (access, deletion, rectification)
  - Minors data handling (COPPA / local equivalents)
  - Cookie policy
- [ ] Create `/privacy` and `/terms` pages
- [ ] Add links to footer (Landing, Dashboard, Emails)
- [ ] Add links to signup flow (consent checkbox)

---

## Phase 7: Pricing page

- [ ] Create `/pricing` page with responsive comparison table
- [ ] Segment tabs: "Padres y familias" / "Instituciones y equipos"
- [ ] Argo One: pack cards with buy buttons
- [ ] Institutional: comparison table (Trial → PRO → Academy → Enterprise)
- [ ] FAQ section addressing common questions
- [ ] CTA buttons per plan
- [ ] Link from trial banner, home page, and landing page

---

## Priority order

1. **Phase 6** (T&C + Privacy) — legal foundation, blocks nothing else
2. **Phase 1** (Database + API) — core model change, everything depends on this
3. **Phase 2** (Dashboard UI) — user-facing roster model
4. **Phase 4** (Emails) — quick wins, already mostly done
5. **Phase 3** (Gemini) — can run in parallel with Phase 2
6. **Phase 7** (Pricing page) — needed before payment integration
7. **Phase 5** (Argo One) — separate flow, can be built last

---

## Migration notes

- Existing trial users with `credits_remaining`: convert to `roster_limit: 8`
- Existing paid users (if any): convert credits to equivalent roster limit
- `credits_remaining` column: keep in DB for 30 days post-migration, then drop
- No data loss: all existing sessions and profiles are preserved
