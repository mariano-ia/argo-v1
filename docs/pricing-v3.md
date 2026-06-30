# Argo Method — Pricing & Product Model v3

> Status: Design locked (logic), implementation pending
> Date: 2026-06-30
> Supersedes: `docs/pricing-v2.md` (roster/subscription self-serve model)
> Related: `docs/superpowers/plans/2026-05-13-argo-puentes.md` (original Puentes build), `docs/PAYMENTS-READINESS.md`

This document is the single source of truth for the consumer (B2C) product line: **Argo One**, **Argo Puente**, and the consultive **Argo Coach**. It replaces the self-serve subscription ladder of v2 with a transactional model built around three entities and a reusable adult profile.

---

## 1. The three products

| Product | What it is | Price (per unit) | Buyer | Delivery |
|---|---|---|---|---|
| **Argo One** | The child's behavioral profile (the odyssey). | **$9.99** | Parent OR coach without dashboard | Child report by email to **both** the buyer and the authorizing adult |
| **Argo Puente** | Argo One **plus** a bridge report for the buyer (how that adult connects with that child). | **$12.99** | Parent OR coach | One report (buyer + authorizing adult) + bridge report for the buyer |
| **Argo Coach** | The dashboard/roster product (situational guide, AI consultant, group tools). | Consultive (no public price) | Institutions, clubs, serious coaches | Web card with "pedir más información" CTA, no digital checkout |

Plus one post-purchase add-on:

| Add-on | What it is | Price | Who |
|---|---|---|---|
| **Puente adicional** | A bridge on a child who is **already profiled** (no new One). | **$4.99 per adult** | The authorizing adult (always offered) and any additional adult (mother, father, grandparent, coach) |

### Pricing logic (no ambiguity)

- The bridge costs **$3 less only if committed upfront** by choosing the Argo Puente product ($12.99 vs $9.99). After the child has played, a bridge is **always $4.99** (the add-on). There is no "+$3 toggle" after purchase.
- **Argo One and Argo Puente are separate products in the cart.** You cannot add a bridge to a One in the cart. If you want the bridge, you buy Argo Puente (which includes a new One), or you buy the $4.99 add-on later on an already-profiled child.
- The add-on is sold via the post-play upsell flow, not the main cart.

### Volume packs (RECOMMENDED, pending confirmation)

| Pack | Argo One | Argo Puente |
|---|---|---|
| 1 | $9.99 | $12.99 |
| 3 | $24.99 ($8.33/u) | $34.99 ($11.66/u) |
| 5 | $39.99 ($8.00/u) | $54.99 ($11.00/u) |

- **PARKED:** a 20%-off pack for coaches buying 10+ units in one purchase. To be designed later.
- ARS prices must be **fixed per currency**, not FX-converted live (see §8).

---

## 2. The three-entity model (architectural backbone)

Stop thinking in "products" and think in three entities. Everything else falls out of this.

1. **Child profile** — the result of a child playing Argo One once. Lives in `sessions`. Already exists.
2. **Adult profile (NEW, reusable)** — the result of an adult playing the **core questionnaire once**. Stored against the adult's email, **no expiry, never replayed**. This entity does not exist today and is the central new piece.
3. **Bridge (the billable unit)** — the *cross* of one adult profile and one specific child session, plus that adult's **per-child relational answers**. Generated when both ends exist. Each bridge is a paid item.

**The join rule:** a bridge needs an adult profile **and** a child session. It generates the moment both exist, in any order:
- Adult has profile + child already profiled → bridge generates immediately.
- Adult has no profile → adult plays the core once; bridge generates on completion.
- Child has not played → bridge waits for the child.

A bridge is unique per `(adult_profile, child_session)` — generate and charge once.

---

## 3. The questionnaire split (the unlock)

The current 15-question test bakes the adult's answers into each purchase and references the specific child throughout (`{nombre}`). That contradicts a reusable adult profile. The test is split in two:

### Core (played once, reusable, no expiry)

Defines the adult's stable traits. Must be reworded to be **child-agnostic** (today q1, q2, q6, q11-13, q15 reference `{nombre}`).

- DISC (8 questions) — adult behavioral axis
- Motor (2 questions) — processing cadence
- Pressure style (3 questions) — regulated / reactive / avoidant (reworded to general framing)
- History/context (1 question) — competitive sport background

Stored as **DISC/motor/pressure codes** in `adult_profiles` (language-agnostic; reusable across children in any language).

### Per-child relational layer (5-6 questions, answered for EACH child, billable)

Genuinely relational, about the dynamic with **this** child. This is what is charged on every new child and every re-profile.

- Dominant emotion toward this child (1)
- "Manejo del éxito": how the adult accompanies this child's good moments (relational framing, child-centered, never achievement/winning pressure — the "gestionar el éxito" situation already exists in the situational guide and sets the safe framing)
- Role: **familiar / entrenador** (folded in here, costs no extra step; drives home-vs-training content targeting)
- 2-3 additional relational items (TBD in content design)

Why 5-6 and not 2: charging $4.99 for "2 questions" reads as thin; 5-6 questions that produce a meaningfully different bridge justify the recurring charge and improve precision.

**Honest framing in copy:** "the long profile is done once; for each child, a few quick questions." Never "play once" alone.

### Science note (re-profiling)

- **Child:** re-profiled every 6 months (style still developing, 8-16y).
- **Adult core:** NOT re-profiled on a calendar. Adult trait DISC is stable; rank-order personality stability plateaus in adulthood. Forcing a 6-month replay is not defensible and reads as a cash grab.
- **Bridge:** refreshes when the **child** re-profiles, reusing the stable adult core + the child's new profile + a fresh per-child relational layer. This is the recurring revenue engine, value-led ("the child grew, here's the bridge today"), not a toll.

---

## 4. Roles & copy

- Two roles only: **familiar** and **entrenador**. Collected as one of the per-child questions (no separate step).
- **Copy uses the child's name everywhere** ("tu vínculo con Mateo"), never "tu hijo" or "tu deportista". This avoids assuming parent (covers grandparent/aunt) and removes the need for a role-gated wording switch.
- Role still drives **content**: "familiar" bridges speak to home / the pre-match / the conversation after the game; "entrenador" bridges speak to training / the group / giving corrections.

---

## 5. The full circuit

### Purchase types

| Kind | Contains | Buyer plays core? | Child plays One? |
|---|---|---|---|
| Argo One | child profile | no | yes (new) |
| Argo Puente | child profile + buyer's bridge | yes, once (if no profile yet) | yes (new) |
| Puente adicional ($4.99) | a bridge on an existing child | designated adult, once | no (already profiled) |

### Persona: coach buys 10 Argo Puente

1. Pays 10 × $12.99. Lands in the buyer panel (magic link).
2. Assigns each slot: authorizing adult email + child name + sport. Argo emails each child's play link.
3. Each child plays. Child report goes to the authorizing adult **and** the coach.
4. Coach plays the **core once**. For each child, answers the **5-6 relational questions**.
5. Each bridge (coach core + child profile + relational answers) generates and is emailed to the coach.
6. Each family receives the child report and the **$4.99 offer** for their own bridge.

### Persona: parent receives the $4.99 offer

1. Authorizing adult always receives an offer to buy a bridge ($4.99). They can buy **N** (themselves, mother, grandparent, aunt) in **one charge**.
2. Each designated adult who has no profile plays the core once + the 5-6 relational questions; those who already have a profile just answer the 5-6.
3. Child is already profiled, so each bridge generates as soon as each adult completes.

---

## 6. Lifecycle emails (operational heart — see risk in §11)

Per child, the sequence is:

1. **Child One report** — to the authorizing adult **and** the buyer (dedupe if same email).
2. **$4.99 bridge offer** — to the authorizing adult (always).
3. **+3 day reminder** — if not purchased (existing cron).
4. **Bridge report** — to each adult who completed (transactional).
5. **Family upsell, 30% off, 7 days** — after the bridge report is delivered, +3-5 days, only if they have not bought family bridges. Value-led + urgency.
6. **Re-profile refresh offer** — when the child re-profiles (~6 months), to each adult with an existing bridge ($4.99).

Every promotional step (2, 3, 5, 6) requires **exit conditions** (stop on purchase or opt-out), a **frequency cap**, and a working **unsubscribe**.

---

## 7. Discount / offer mechanism (gateway-agnostic)

The 30% family discount (and any future discount) lives in **our pricing engine, never in the gateway**. The gateway (Stripe / MercadoPago) only ever receives a **final amount to charge**. This decouples us from the payment provider.

- An **offer** is a DB record: `{ recipient_email, child_session_id, type, percent, base, expires_at, status, max_uses }`.
- Delivered as a **magic-link token** that lands in the cart with the discount pre-applied (no code typing).
- Optionally show a vanity code ("FAMILIA30, vence en 7 días") for urgency; the **token + server-side validation** is the real enforcement.
- Single-use (or N-use matching the family size), bound to email + child, **idempotent**, and **reverts to active if the payment fails**.

---

## 8. Pricing engine (single source of truth)

There are several discount axes (volume packs, the $3 upfront-commit delta, the $4.99 add-on, the 30% family offer). To avoid incoherent cart totals, **all price computation goes through one server-side function**:

```
price(kind, quantity, currency, offerToken?) -> finalAmountInCents
```

- Prices are **fixed per currency** (USD and ARS), not FX-converted at request time.
- The cart calls this function to show live totals; the gateway receives only its return value.
- Multi-quantity purchases are **bundled into a single charge** (micro-amounts like $4.99 / $3.49 get eaten by fixed gateway fees if split).

---

## 9. Consent & privacy

- The buyer receiving the child report is **conditioned on the child playing**, and the child's play flow includes the **consent step**. So "buyer gets report" is automatically gated by consent — no separate conflict. **Until there is a child profile, nothing exists.**
- Consent copy at registration must **explicitly name** that the report is shared with whoever invited the child (the buyer), so consent is informed. Uses the existing `parental_consents` table.
- A coach receiving a bridge about another person's child is coaching guidance derived from the child's profile; it stays inside the same consent gate and the existing non-clinical/forbidden-words filters.

---

## 10. Identity & data rules

- **Adult identity = email.** The reusable profile is anchored to the email. Same person, two emails = two profiles (accepted for v1).
- **Child identity = most recent completed session.** The child has no account. A bridge anchors to the **specific session** it was generated against; a re-profile creates a **new session that becomes the current one** for future crosses. So "one child profile" resolves to "the most recent" without a child account.

---

## 11. Argo Coach (consultive)

- 100% consultive. **No digital conversion.** Web card + "pedir más información" lead capture, no public subscribe button.
- The self-serve subscription machinery (`create-subscription`, `cancel-subscription`, Stripe subscription webhooks, trial, roster enforcement, dashboard) **stays as internal plumbing**, activated manually when sales closes a client. It is not deleted, it is removed from the public front door.
- **Puente is out of the Coach (dashboard) world for now.** The re-profile refresh inside a subscription is deferred.
- A buyer who purchases 10+ Argo Puente is a **strong Coach lead** — flag for sales outreach.
- Bulk Argo Puente is **not** Argo Coach. The pricing page and purchase confirmation must set this expectation (no dashboard with bulk One/Puente).

---

## 12. Locked vs pending

**Locked (logic):**
- Three products + $4.99 add-on; per-unit prices $9.99 / $12.99 / $4.99.
- Three-entity model; questionnaire split (core once + 5-6 relational per child, billable).
- Adult core never replayed; bridge refreshes with child re-profile at $4.99.
- Buyer receives child report, gated by consent.
- Authorizing adult always offered the bridge; can buy N.
- Family upsell 30% / 7 days as a server-side token.
- Role folded into per-child questions; child's name used in all copy.
- Child identity = most recent session.
- Coach consultive; Puente out of Coach world for now.

**Pending confirmation:**
- Volume pack breakpoints and prices (§1 table is a recommendation).
- Exact composition of the 2-3 additional relational items in the per-child layer (§3).
- ARS price points per SKU.
- 20%-off 10+ coach pack (parked).

---

## 13. Implementation action list

Ordered by dependency. Much of the plumbing already exists and is **extended**, not built from zero (checkout, webhook, generate, send-email, panel, the 15-question test in es/en/pt).

### Phase A — Data model (Supabase migrations)
- [ ] **A1.** New `adult_profiles` table: `id, email, profile jsonb (DISC/motor/pressure/history codes), lang_played, created_at, updated_at`. Index on email.
- [ ] **A2.** New `bridges` table (or repurpose `puentes_sessions`): `id, adult_profile_id, source_session_id, relational_answers jsonb, role, ai_sections, status, price_ref/offer_ref, created_at`. **Unique (adult_profile_id, source_session_id)** for idempotency.
- [ ] **A3.** Extend purchase model: `buyer_email`, `kind (one|puente|addon)`, `quantity`, `role`, optional `offer_id`. Add `puente_prepaid` flag to `one_links` for combo purchases.
- [ ] **A4.** New `offers` table for discount tokens (§7).
- [ ] **A5.** `one_links`: support slot **revoke/reassign** (free an abandoned sent link).
- [ ] **A6.** Migrate Argo One prices ($14.99→$9.99, pack table) in data/config, not hardcoded across files.

### Phase B — Questionnaire redesign (the unlock)
- [ ] **B1.** Split `src/lib/puentesQuestions.ts`: **core** (child-agnostic reword of DISC/motor/pressure/history) + **per-child relational layer** (5-6: emotion, "manejo del éxito" relational, role, +2-3 TBD), in es/en/pt.
- [ ] **B2.** Resolver: `resolveAdultProfile` (core only) + per-child relational scoring. Update tests.
- [ ] **B3.** Content review (argo-psych-review skill): probabilistic, non-clinical, child-centered, no forbidden vocab; relational framing of success.

### Phase C — Backend / API
- [ ] **C1.** Single server-side **pricing module** `price(kind, qty, currency, offerToken?)`; fixed USD+ARS tables; gateway-agnostic.
- [ ] **C2.** Checkout: One at $9.99 + packs; new Puente path ($12.99 + packs); addon ($4.99) with offer-token support; **bundle multi-buy into one charge**.
- [ ] **C3.** Adult-profile-first flow: `puentes-start/complete` write reusable `adult_profiles`, **idempotent** (skip core if profile exists), then store per-child relational answers + create bridge.
- [ ] **C4.** `generate-puentes`: operate on (adult profile + child session + relational answers + role); **idempotent per (adult, session)**; role-aware prompt; child's name in copy.
- [ ] **C5.** Buyer-gets-report: extend report send to also email the buyer (dedupe vs authorizing adult).
- [ ] **C6.** Offer engine: create/validate/apply tokens (§7); revert-on-failure.
- [ ] **C7.** Re-profile cascade: new child session → refresh offers ($4.99) to adults with existing bridges.
- [ ] **C8.** `one-panel`: slot reassign endpoint; scale queries for 20+.
- [ ] **C9.** Webhook (`one-webhook`): handle `puente` / `addon` / family-multi kinds and quantity.

### Phase D — Frontend / UI
- [ ] **D1.** Pricing page: 3 cards (One, Puente, Coach). One/Puente → cart; Coach → contact CTA.
- [ ] **D2.** Cart: separate One vs Puente products, quantity + **live volume pricing**.
- [ ] **D3.** Buyer panel (evolve one-panel): scale to 20+, **tree view** (child → bridges), slot assign, "play your Puente" entry, bridge statuses, slot reassign.
- [ ] **D4.** Adult questionnaire flow (`PuentesFlow`): core once (skip if profile exists) + per-child relational layer.
- [ ] **D5.** Family upsell mini-flow from the offer email: buy N, designate recipients, discount pre-applied, single charge.

### Phase E — Lifecycle emails (operational risk — gate before promotional sends)
- [ ] **E1.** Sequence (§6): One report to recipient + buyer; $4.99 offer; +3d reminder; bridge report; family 30% upsell; re-profile refresh. Each promotional step with exit conditions + frequency cap.
- [ ] **E2.** **Unsubscribe / consent / deliverability infra** — required before any promotional send. This is the #1 risk.

### Phase F — Ops / content / legal
- [ ] **F1.** Coach: web card + lead capture; retire public subscribe button; keep subscription machinery internal.
- [ ] **F2.** CRM hook: flag 10+ Puente buyers as Coach leads.
- [ ] **F3.** Consent copy update (buyer receives report).
- [ ] **F4.** T&C for add-on / family / re-profile charges.
- [ ] **F5.** Mark `docs/pricing-v2.md` superseded (done in header).

### Critical path
**B (questionnaire split) + A1/A2 (adult_profiles + bridges) + C3/C4 (profile-first flow + idempotent generation)** are the unlock — nothing else works without the reusable adult profile. **C1 (pricing module)** unblocks all of D. **E2 (unsubscribe/deliverability)** is the operational gate for the whole upsell thesis.
</content>
</invoke>
