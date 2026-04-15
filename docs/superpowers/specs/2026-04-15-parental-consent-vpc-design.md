# Verifiable Parental Consent (VPC) — Design Spec

**Date:** 2026-04-15
**Status:** Approved, ready for implementation plan
**Related analysis:** COPPA compliance audit (in-session, 2026-04-15)

## Context

Argo Method collects behavioral data from children aged 8-16 via a gamified odyssey. The platform plans to enter the US market, which brings COPPA (Children's Online Privacy Protection Act) into scope for users under 13.

The current onboarding collects parental data and shows 4 philosophical agreement checkboxes, but **none of them constitute verifiable parental consent** as required by COPPA §312.5. This spec addresses that single gap.

The broader COPPA audit flagged other issues (Gemini PII transmission, Google Analytics, privacy policy gaps, retention policy). Those are out of scope for this spec and will be addressed in separate initiatives.

## Goals

- Implement verifiable parental consent (VPC) before collecting any data from children under 13.
- Keep the friction minimal for children 13+, who are not required to have VPC under COPPA.
- Make the backend the source of truth — even a hacked frontend cannot bypass consent.
- Produce an audit trail (IP, user-agent, timestamp) sufficient for FTC inquiry.
- Apply uniformly across all three onboarding flows (authenticated, tenant, Argo One).

## Non-goals

- Data minimization toward Gemini (separate initiative).
- Removing Google Analytics from child-facing routes (separate initiative).
- Privacy policy rewrite (separate initiative).
- Hard-delete / retention automation (separate initiative).
- Consent management dashboard (fase 2, if needed).
- Cleanup cron for expired consents (optional, lazy check covers the critical path).

## Decisions made

| Question | Decision |
|---|---|
| Who is protected? | Only children under 13 (COPPA minimum). For age ≥13 the flow is unchanged. |
| VPC method? | Email-plus (link-only, no OTP code) with frontend polling. |
| When to gate? | After the adult registration form, before Device Handoff. |
| Token TTL? | 24 hours, then discarded. |
| Method language? | Link-only. No OTP code (avoids duplicated paths and copy friction). |
| COPPA mention in copy? | Yes in English (trust signal for US parents). No in ES/PT (generic privacy language). |
| Apply to which flows? | All three: authenticated, tenant (trial and paid), Argo One. |
| Consolidate legal checkboxes? | Yes — replace the 4 philosophical checkboxes with a single legally-anchored check plus a bulleted callout. |

## Architecture overview

```
Adult fills form (child_age < 13)
          │
          ▼
POST /api/request-consent ──► INSERT parental_consents (pending, 24h TTL)
          │                         │
          │                         └──► sendConsentEmail(Resend)
          ▼
ParentalConsentWaiting screen
   │  polls GET /api/consent-status every 5s
   │
   │                            Adult clicks email link
   │                                    │
   │                                    ▼
   │                            /consent/:token page
   │                                    │
   │                            POST /api/confirm-consent
   │                                    │
   │                                    ▼
   │                            UPDATE parental_consents
   │                            (confirmed, IP, UA, timestamp)
   │
   ▼ polling sees "confirmed"
Advance to Device Handoff
          │
          ▼
Session start includes consent_token
          │
          ▼
POST /api/session action=start
          │
          ▼
Backend validates token
  (exists, confirmed, not consumed, not expired)
          │
          ▼
INSERT sessions + mark parental_consents.consumed_at = now
```

For children 13+ the flow is **identical to today**: no new endpoints are hit, no new screens are shown, no new fields are sent. The only change they see is the consolidated consent checkbox (Section 7).

## Data model

New table: `parental_consents`.

```sql
create table parental_consents (
  id              uuid primary key default gen_random_uuid(),
  token           text unique not null,

  -- Adult data (COPPA audit)
  adult_name      text not null,
  adult_email     text not null,

  -- Child data (minimum needed to create the session later)
  child_name      text not null,
  child_age       integer not null check (child_age >= 8 and child_age <= 16),
  sport           text,

  -- Flow context
  flow_type       text not null check (flow_type in ('auth', 'tenant', 'one')),
  tenant_id       uuid references tenants(id),
  one_link_id     uuid references one_links(id),
  lang            text not null default 'es' check (lang in ('es', 'en', 'pt')),

  -- Verification state
  status          text not null default 'pending'
                    check (status in ('pending', 'confirmed', 'expired')),
  confirmed_at    timestamptz,
  confirmed_ip    text,
  confirmed_user_agent text,

  -- TTL
  created_at      timestamptz not null default now(),
  expires_at      timestamptz not null,

  -- Single-use enforcement
  session_id      uuid references sessions(id),
  consumed_at     timestamptz
);

create index parental_consents_token_idx on parental_consents(token);
create index parental_consents_expires_idx
  on parental_consents(expires_at)
  where status = 'pending';
```

**RLS:** Same pattern as `sessions` — all access goes through `/api/*` with `SUPABASE_SERVICE_ROLE_KEY`. No direct client access.

**Retention:** Confirmed records retained under the general retention policy (separate initiative). Expired records can be purged after 7 days by an optional cron. Lazy expiration in `/api/consent-status` covers the critical path.

**Token:** 32 hex chars (128 bits entropy) via `crypto.randomBytes(16).toString('hex')`. Non-guessable.

## API endpoints

### POST /api/request-consent

Called from the frontend when the adult submits the form with `edad < 13`.

**Request:**
```ts
{
  adult_name: string
  adult_email: string
  child_name: string
  child_age: number
  sport: string
  flow_type: 'auth' | 'tenant' | 'one'
  tenant_id?: string
  one_link_id?: string
  lang: 'es' | 'en' | 'pt'
}
```

**Logic:**
1. Validate inputs (age 8-12, email format, required fields).
2. If `flow_type` is `tenant`, validate `tenant_id` exists. If `one`, validate `one_link_id`.
3. Generate token via `crypto.randomBytes(16).toString('hex')`.
4. Insert `parental_consents` row with `expires_at = now + 24 hours`.
5. Call `sendConsentEmail(token, lang, adultName, childName, toEmail)`.
6. Return `{ ok: true, token }`.

**Responses:**
- `200 { ok: true, token }`
- `400 { ok: false, error: 'invalid_input' }`
- `500 { ok: false, error: 'internal' }`

**Logging:** No PII. Log only `{ flow_type, lang, token_prefix: token.slice(0, 6) }`.

### GET /api/consent-status?token=xxx

Called by the frontend every 5 seconds from the waiting screen.

**Logic:**
1. Look up `parental_consents` by token.
2. Not found → `{ status: 'not_found' }`.
3. If `status = 'pending'` and `expires_at < now`: UPDATE to `expired`, return `{ status: 'expired' }`.
4. If `status = 'confirmed'`: return `{ status: 'confirmed', token }`.
5. Otherwise: return `{ status: 'pending' }`.

**Rate limiting:** Not needed at launch. The token is a random 128-bit secret, so the endpoint cannot be enumerated, and the frontend polls at 5s intervals. If abuse becomes visible in logs, we can add persistent rate limiting (Redis/Upstash) later — Vercel serverless has no shared in-memory state, so naive in-memory limiters are ineffective.

### POST /api/confirm-consent

Called from `/consent/:token` landing page when the adult clicks the email link.

**Request:** `{ token: string }`

**Logic:**
1. Look up `parental_consents` by token.
2. Not found → 404.
3. If `expires_at < now`: mark `expired`, return 410 `{ error: 'expired' }`.
4. If already `confirmed`: return `{ ok: true, child_name, lang }` (idempotent — handles double-click).
5. If `pending`: UPDATE
   - `status = 'confirmed'`
   - `confirmed_at = now()`
   - `confirmed_ip = req.headers['x-forwarded-for']` (Vercel forwards real IP)
   - `confirmed_user_agent = req.headers['user-agent']`

   Return `{ ok: true, child_name, lang }`.

### POST /api/session (modified)

Add optional `consent_token` to the `start` action body.

**New logic (inserted before session insert):**
```
if (child_age < 13):
  if (!consent_token):
    return 403 { error: 'consent_required' }

  row = select * from parental_consents where token = consent_token
  if (!row):
    return 403 { error: 'consent_invalid' }
  if (row.status !== 'confirmed'):
    return 403 { error: 'consent_not_confirmed' }
  if (row.consumed_at !== null):
    return 403 { error: 'consent_already_used' }
  if (row.expires_at < now):
    return 403 { error: 'consent_expired' }

  // Validate match between consent and session data
  if (row.child_name !== body.child_name || row.child_age !== body.child_age):
    return 403 { error: 'consent_mismatch' }

// [...existing session insert...]

if (child_age < 13):
  UPDATE parental_consents
    SET consumed_at = now(), session_id = new_session.id
    WHERE token = consent_token
```

For `child_age >= 13`, `consent_token` is ignored entirely (backward compatible).

### Cleanup cron (optional, fase 2)

`GET /api/cron/cleanup-consents` — runs daily via Vercel Cron. Marks expired consents and deletes `expired` records older than 7 days. Not required for launch — lazy expiration covers correctness.

## Email template

New helper `sendConsentEmail()` in `api/lib/consent-email-templates.ts`, called from `/api/request-consent`.

### Subject

- ES: `Confirma que eres el adulto responsable de {childName}`
- EN: `Confirm you're the responsible adult for {childName}`
- PT: `Confirme que você é o responsável por {childName}`

### Body (structure)

- Header: Argo Method logo (same visual system as existing report email).
- Greeting: `Hola, {adultName}`.
- Lead paragraph: `{childName} está a punto de comenzar su odisea en Argo Method. Antes de que comience, necesitamos que confirmes que eres el padre, madre o tutor legal responsable de {childName}.`
- CTA button: `Confirmar y continuar` → `https://argomethod.com/consent/{token}`.
- Plaintext fallback URL below the button.
- Expiration notice: `⏱ Este link expira en 24 horas. Si no lo usas a tiempo, deberás empezar de nuevo.`
- "Why" section:
  - ES/PT: `Para proteger la privacidad de los menores, necesitamos verificar que eres el adulto responsable antes de recopilar cualquier dato de {childName}.`
  - EN: `To comply with COPPA (US children's online privacy law), we need to verify you're the responsible adult before collecting any data about {childName}.`
- Safe clause: `Si no reconoces este email, puedes ignorarlo. No se recopilará ningún dato hasta que confirmes.`
- Footer: `hola@argomethod.com`, Privacy Policy link, Terms link.

### Technical

- From: `Argo Method <hola@argomethod.com>`
- Reply-to: `hola@argomethod.com`
- HTML + plain text versions
- Preheader text: `Confirma para que {childName} pueda comenzar`
- **No PII beyond child_name**: no age, sport, or profile data in the email body. This email goes out before consent is confirmed and should carry the minimum possible data.

### File layout

- `api/lib/consent-email-templates.ts` — three exports: `consentEmailES()`, `consentEmailEN()`, `consentEmailPT()`. Each returns `{ subject, html, text }`.
- `/api/request-consent` — composes with the helper and sends via Resend directly (same pattern as existing `/api/send-email`).

## Frontend components

### AdultRegistration.tsx (modified)

New props: `flowType: 'auth' | 'tenant' | 'one'`, `tenantId?: string`, `oneLinkId?: string`, `onConsentRequired: (args: { token: string; adultData: AdultData }) => void`.

New state: `submitting`, `error`.

Submit handler branches by age:

```ts
const handleSubmit = async () => {
  if (!isValid) return;
  const adultData = { nombreAdulto, email, nombreNino, edad, deporte };

  if (edad < 13) {
    setSubmitting(true);
    try {
      const result = await requestConsent({ ...adultData, flowType, tenantId, oneLinkId, lang });
      if (result.ok) onConsentRequired({ token: result.token, adultData });
      else setError(result.error);
    } finally {
      setSubmitting(false);
    }
  } else {
    onComplete(adultData);
  }
};
```

### Consolidated legal check

Replace the 4 philosophical checkboxes with:

- A bulleted callout showing the 3 informational points (fotografía del presente, bienestar sobre rendimiento, no diagnóstico clínico). These are visible but not interactive.
- A single checkbox below with COPPA-compliant copy:
  - ES: `Soy el padre, madre o tutor legal de {childName} y acepto la Política de Privacidad y los Términos.`
  - EN: `I am the parent or legal guardian of {childName} and I accept the Privacy Policy and Terms of Service.`
  - PT: `Sou o pai, mãe ou responsável legal de {childName} e aceito a Política de Privacidade e os Termos.`

The "Privacy Policy" and "Terms" are clickable links (new tab) to `/privacy` and `/terms`.

The old "Confirmo que soy mayor de 18 años" check is removed — it's implied by "padre/madre/tutor legal" and adds no COPPA value.

**Validation:** `isValid` keeps same semantics — the single check must be ticked to enable submit.

### ParentalConsentWaiting.tsx (new)

Location: `src/components/onboarding/screens/ParentalConsentWaiting.tsx`

**Props:** `{ token: string; adultEmail: string; childName: string; lang: Lang; onConfirmed: (token: string) => void; onCancel: () => void; }`

**Visual structure:**
- Icon: envelope, subtle animation (framer motion).
- Title: `Revisa tu email` (per language).
- Subtitle: `Te enviamos un link a {maskEmail(adultEmail)}`.
- Explanation block (why), language-dependent. English includes "COPPA".
- Expiration notice: `⏱ Este link expira en 24 horas.`
- Status row: spinner + `Esperando confirmación...`.
- Secondary buttons: `Reenviar email` (60s cooldown), `Cambiar email` (triggers `onCancel`).
- Footer microtext (EN only): `Argo Method complies with the Children's Online Privacy Protection Act (COPPA).`

**Logic:**
- On mount: start `setInterval` polling `/api/consent-status?token=...` every 5000ms.
- On `confirmed`: call `onConfirmed(token)` and clear interval.
- On `expired` or `not_found`: switch to error state, show CTA "Empezar de nuevo" that calls `onCancel`.
- On unmount: clear interval.
- Refresh recovery: save `{ token, adultData, flowType, tenantId, oneLinkId, lang }` to a **new** `localStorage` slot (`argo_consent_recovery`) with 24h TTL. This is distinct from the existing 2h mid-odyssey recovery slot in `sessionStore.ts` — the two states don't overlap, so they stay in separate keys. On next mount, if recovery data exists and the token is still `pending` (verified via `/api/consent-status`), restore the waiting screen.

**maskEmail helper:** `mariano@gmail.com` → `ma***@gmail.com`. Keep first 2 chars, mask local part, keep domain.

### ConsentLanding.tsx (new)

Location: `src/pages/ConsentLanding.tsx`
Route: `/consent/:token`

**Flow:**
1. Read `token` from URL params.
2. On mount, POST `/api/confirm-consent` with `{ token }`.
3. Render one of four states:
   - Loading: spinner, "Confirmando...".
   - Success: checkmark, `¡Listo! Ya puedes volver a la pantalla donde {childName} está esperando.`
   - Expired (410): `Este link expiró. Por seguridad, el adulto responsable debe empezar de nuevo.`
   - Error (404 or other): `Este link no es válido.`
4. No auto-close, no redirect. Adult returns manually to the original tab/device.

**Stateless:** No localStorage, no auth required. Pure URL-based.

### App.tsx (modified)

Add public route:
```tsx
<Route path="/consent/:token" element={<ConsentLanding />} />
```

No auth required, no dashboard layout.

### OnboardingFlowV2.tsx (modified)

Insert new screen `parental-consent-waiting` between `adult-registration` and `device-handoff`:

```ts
{ type: 'adult-registration' },
{ type: 'parental-consent-waiting' },  // conditional, only if age < 13
{ type: 'device-handoff' },
```

Screen transitions:
- `adult-registration` → if age < 13, `onConsentRequired` stores `{ token, adultData }` in local state and advances to `parental-consent-waiting`. If age ≥ 13, `onComplete` stores `adultData` and advances to `device-handoff`.
- `parental-consent-waiting` → on `onConfirmed(token)`, store token in `consentTokenRef`, advance to `device-handoff`.

When `startSession()` is called (at `ODYSSEY_START`), it reads `consentTokenRef.current` and includes it in the `/api/session` body if present.

### sessionStore.ts (modified)

`startSession()` signature gains optional `consentToken`:
```ts
startSession({ adultData, tenantId, oneLinkId, lang, consentToken })
```

It forwards `consent_token` to `/api/session` action `start`.

Also extend the recovery slot to persist the waiting-screen state (`token`, `adultData`, etc.) for refresh resilience.

## User flow — concrete example

**Scenario:** Tenant link, child age 10.

1. Parent opens `https://argomethod.com/play/coach-roberto` on phone.
2. Sees Language Select → Adult Intro → Adult Registration form.
3. Fills name, email (`mariano@gmail.com`), child name ("Lucas"), age slider to 10, sport "fútbol".
4. Ticks the single consent checkbox.
5. Hits "Continue". Frontend detects `age < 13` → `POST /api/request-consent`.
6. Backend creates `parental_consents` row, sends email to `mariano@gmail.com`, returns `{ ok: true, token: 'a3f9...' }`.
7. Phone shows `ParentalConsentWaiting` screen: "Revisa tu email. Te enviamos un link a ma***@gmail.com...".
8. Parent opens Mail app, sees subject "Confirma que eres el adulto responsable de Lucas", taps "Confirmar y continuar".
9. Browser opens new tab at `/consent/a3f9...`.
10. Tab auto-POSTs `/api/confirm-consent` → record updated to `confirmed`, IP + UA captured.
11. Tab shows "¡Listo! Ya puedes volver a la pantalla donde Lucas está esperando."
12. Parent switches back to original tab. Meanwhile, the polling there has already received `{ status: 'confirmed' }` and advanced to Device Handoff.
13. Parent hands phone to Lucas. Device Handoff → Story Intro.
14. At Story Intro, `startSession()` fires with `consent_token: 'a3f9...'`.
15. Backend validates: exists ✓, confirmed ✓, not consumed ✓, not expired ✓, name+age match ✓. Creates session, marks consent as consumed.
16. Lucas plays the odyssey normally.

**Scenario:** Tenant link, child age 14.

1-4. Same as above, but age slider at 14.
5. Frontend sees `age >= 13` → `onComplete(adultData)` directly.
6. Screen advances to Device Handoff.
7. `startSession()` fires **without** `consent_token`.
8. Backend sees `child_age >= 13`, skips the consent check, creates session.
9. Child plays normally.

No new endpoints hit. Zero added friction.

## Edge cases

| # | Case | Handling |
|---|---|---|
| E1 | Adult confirms on a different device, never returns to original | Original tab keeps polling up to 24h (or until page closes). Confirmed consent token can still be consumed; if the original tab is closed, the token remains but is orphaned. No data leak — token alone is useless without the session start call. |
| E2 | Adult clicks email link twice | `/api/confirm-consent` is idempotent. Second call returns the same success response. |
| E3 | Adult clicks link after 24h | Landing shows "Este link expiró". No recovery path from the landing itself (we don't know where the original form was). |
| E4 | Two children, two simultaneous consent flows | Each has a unique token. No collision. Adult receives two distinct emails and confirms each independently. |
| E5 | Child bypass attempt (directly POSTs to `/api/session`) | Blocked: backend returns 403 `consent_required` if `child_age < 13` without a valid token. Backend is the source of truth. |
| E6 | Adult refreshes the waiting screen | Recovery slot in `sessionStore.ts` restores `{ token, adultData, ... }`. Polling resumes from current state (confirmed/pending/expired as returned by the API). |
| E7 | Email doesn't arrive (typo, spam) | Adult uses "Cambiar email" → returns to form. The stale consent record remains pending and expires naturally. |
| E8 | Adult closes browser during waiting | Recovery TTL is 24h. If they return within 24h from the same browser, waiting screen is restored. After 24h, everything is gone (consistent with token expiry). |
| E9 | Cleanup cron doesn't run | Not critical. `/api/consent-status` lazily marks records as expired on check. Cron is only housekeeping. |
| E10 | Name mismatch between consent and session (attempt to reuse a token for a different child) | Backend rejects with 403 `consent_mismatch`. Prevents token-sharing abuse. |

## Testing

### Backend integration

- `POST /api/request-consent`: creates record, sends email (mock Resend), returns token.
- `POST /api/request-consent`: rejects invalid inputs.
- `GET /api/consent-status`: returns `pending`, `confirmed`, `expired`, `not_found` correctly.
- `GET /api/consent-status`: marks pending records as expired lazily.
- `POST /api/confirm-consent`: happy path, captures IP + UA.
- `POST /api/confirm-consent`: idempotent (double call).
- `POST /api/confirm-consent`: returns 410 for expired.
- `POST /api/session` start: rejects 403 if age<13 without token.
- `POST /api/session` start: rejects 403 if token not confirmed.
- `POST /api/session` start: rejects 403 if token already consumed.
- `POST /api/session` start: rejects 403 if name/age mismatch.
- `POST /api/session` start: accepts and marks consumed on valid token.
- `POST /api/session` start: ignores token for age>=13 (backward compat).

### Frontend unit

- `AdultRegistration`: fires `requestConsent` for age<13.
- `AdultRegistration`: fires `onComplete` directly for age>=13.
- `AdultRegistration`: single consolidated check required to submit.
- `ParentalConsentWaiting`: starts polling on mount.
- `ParentalConsentWaiting`: advances on confirmed.
- `ParentalConsentWaiting`: shows error on expired/not_found.
- `ParentalConsentWaiting`: clears interval on unmount.
- `ConsentLanding`: shows each of 4 states correctly.
- `maskEmail` helper: correct output for various inputs.

### E2E / manual QA checklist

- Full flow with age 10 in each of 3 flow types (auth, tenant, one).
- Full flow with age 14 in each of 3 flow types (no consent step).
- Confirm on same device (tab switch).
- Confirm on different device (phone + desktop).
- Let link expire (24h or manually in DB), retry.
- Click confirmation link twice.
- Refresh during waiting screen.
- Network failure during polling (should not break UX).
- Email in each of 3 languages.
- Bypass attempt: directly call `/api/session` with age=10 and no token → expect 403.

## Rollout

1. Write and apply SQL migration (user runs in Supabase dashboard).
2. Build on `develop` branch.
3. Vercel preview gets a temporary env var `SITE_URL` if needed for correct consent link generation.
4. Manual QA checklist on preview URL.
5. Review + merge to `main` after user approval.
6. Post-launch: monitor `admin_audit_log` for consent request/confirm events (no PII).

## Files to create

- `supabase/migrations/20260415_parental_consents.sql` — new table.
- `api/request-consent.ts` — new endpoint.
- `api/consent-status.ts` — new endpoint.
- `api/confirm-consent.ts` — new endpoint.
- `api/lib/consent-email-templates.ts` — three language templates.
- `src/components/onboarding/screens/ParentalConsentWaiting.tsx` — new screen.
- `src/pages/ConsentLanding.tsx` — new landing page.

## Files to modify

- `api/session.ts` — gatekeeper logic for consent_token.
- `src/components/onboarding/screens/AdultRegistration.tsx` — branch by age, consolidate checks, add new props.
- `src/components/onboarding/OnboardingFlowV2.tsx` — insert waiting screen, wire consent token through.
- `src/lib/sessionStore.ts` — extend startSession with consent_token, extend recovery slot.
- `src/App.tsx` — add `/consent/:token` route.
- Translation files — add new copy keys for ES/EN/PT (email subjects, waiting screen, landing, consolidated check).
