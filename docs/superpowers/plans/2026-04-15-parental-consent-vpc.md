# Verifiable Parental Consent (VPC) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Block data collection from children under 13 until a parent confirms consent via a unique email link, applied uniformly across all three onboarding flows (auth, tenant, Argo One), with the backend as the source of truth.

**Architecture:** New Supabase table `parental_consents` stores pending/confirmed tokens with 24h TTL. Frontend routes children under 13 through a new waiting screen that polls for confirmation. A new public landing page at `/consent/:token` lets the parent confirm via email link. `api/session.ts` is modified to reject session creation for children under 13 without a valid consent token. Zero behavior change for children 13 and older.

**Tech Stack:** TypeScript, React 18, Vite, `@vercel/node` serverless functions, Supabase (PostgreSQL) via `@supabase/supabase-js`, Resend for email, `crypto.randomBytes` for token generation, polling via `setInterval`.

**Testing reality:** This project has no unit test framework installed (`package.json` has only `dev`, `build`, `lint`, `preview` scripts). Verification for each task uses `npm run lint && npm run build` (TypeScript type-checking + ESLint). End-to-end verification uses the manual QA checklist in the final task. Do not add a test framework as part of this plan — it's out of scope.

**Reference:** [docs/superpowers/specs/2026-04-15-parental-consent-vpc-design.md](../specs/2026-04-15-parental-consent-vpc-design.md)

---

## File structure

**Create:**

- `supabase/migrations/20260415_parental_consents.sql` — schema for `parental_consents` table.
- `api/lib/consent-email-templates.ts` — three language templates for the verification email (pure functions, no I/O).
- `api/request-consent.ts` — `POST /api/request-consent` endpoint. Creates record + sends email.
- `api/consent-status.ts` — `GET /api/consent-status?token=...` endpoint. Polled by frontend every 5s.
- `api/confirm-consent.ts` — `POST /api/confirm-consent` endpoint. Called from landing page.
- `src/lib/maskEmail.ts` — tiny helper to display `ma***@gmail.com`.
- `src/lib/consentStore.ts` — frontend client wrapping the three consent endpoints + localStorage recovery.
- `src/components/onboarding/screens/ParentalConsentWaiting.tsx` — waiting screen shown between form and device handoff when age < 13.
- `src/pages/ConsentLanding.tsx` — public landing at `/consent/:token`.

**Modify:**

- `api/session.ts` — inject consent_token validation into `start` action.
- `src/lib/odysseyTranslations.ts` — add new i18n keys (consolidated check, waiting screen, landing, email).
- `src/lib/sessionStore.ts` — extend `startSession()` to forward `consent_token`.
- `src/components/onboarding/screens/AdultRegistration.tsx` — consolidate 4 checkboxes into 1 + branch by age.
- `src/components/onboarding/OnboardingFlowV2.tsx` — insert `parental-consent-waiting` screen + wire token through.
- `src/App.tsx` — add `/consent/:token` route.

---

## Task 1: Database migration for `parental_consents`

**Files:**
- Create: `supabase/migrations/20260415_parental_consents.sql`

- [ ] **Step 1.1: Create migration file**

Create `supabase/migrations/20260415_parental_consents.sql` with:

```sql
-- Parental Consent (VPC) — COPPA compliance foundation
-- Creates the parental_consents table that holds pending and confirmed
-- verification tokens issued via email-plus flow for children under 13.

create table if not exists parental_consents (
  id              uuid primary key default gen_random_uuid(),
  token           text unique not null,

  -- Adult data (retained for COPPA audit trail)
  adult_name      text not null,
  adult_email     text not null,

  -- Child data (minimum needed to create the session once confirmed)
  child_name      text not null,
  child_age       integer not null check (child_age >= 8 and child_age <= 16),
  sport           text,

  -- Flow context (one of the three onboarding entry points)
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

  -- Single-use enforcement: once the session is created, this token is burned.
  session_id      uuid references sessions(id),
  consumed_at     timestamptz
);

create index if not exists parental_consents_token_idx
  on parental_consents(token);

create index if not exists parental_consents_expires_idx
  on parental_consents(expires_at)
  where status = 'pending';

-- No RLS policies needed: all access flows through /api/* endpoints
-- using SUPABASE_SERVICE_ROLE_KEY (same pattern as the sessions table).
alter table parental_consents enable row level security;
```

- [ ] **Step 1.2: User runs the migration in Supabase SQL Editor**

Stop and ask the user to run the migration in their Supabase dashboard (SQL Editor → paste contents → Run). Wait for confirmation that the table was created successfully before proceeding.

- [ ] **Step 1.3: Commit migration file**

```bash
git add supabase/migrations/20260415_parental_consents.sql
git commit -m "feat(db): add parental_consents table for VPC

Supports COPPA verifiable parental consent via email-plus.
Stores token, adult + child data, flow context, verification
state, TTL, and audit trail (IP, UA, timestamps)."
```

---

## Task 2: Consent email templates helper

**Files:**
- Create: `api/lib/consent-email-templates.ts`

- [ ] **Step 2.1: Create the email templates file**

Create `api/lib/consent-email-templates.ts` with three pure functions — one per language — each returning `{ subject, html, text }`. This file has no runtime imports and no I/O.

```ts
// Consent verification email templates (ES / EN / PT).
// Returns { subject, html, text } — called by /api/request-consent.
//
// Important: do NOT include child age, sport, or profile data.
// The only child PII in the email is the first name, which is the
// minimum needed for the adult to recognize the request.

interface TemplateArgs {
    adultName: string;
    childName: string;
    confirmUrl: string;
}

interface EmailTemplate {
    subject: string;
    html: string;
    text: string;
}

const baseStyles = `
  body { margin: 0; padding: 0; background: #f5f5f7; font-family: -apple-system, system-ui, 'Segoe UI', Roboto, sans-serif; color: #1D1D1F; }
  .wrap { max-width: 560px; margin: 0 auto; padding: 32px 16px; }
  .card { background: #fff; border-radius: 14px; padding: 32px 28px; box-shadow: 0 1px 2px rgba(0,0,0,0.04); }
  h1 { font-size: 18px; font-weight: 600; margin: 0 0 8px; letter-spacing: -0.01em; }
  p  { font-size: 15px; line-height: 1.6; color: #424245; margin: 0 0 16px; }
  .cta { display: inline-block; background: #0071E3; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; font-size: 15px; margin: 8px 0 20px; }
  .fallback { font-size: 12px; color: #86868B; word-break: break-all; }
  .hr { height: 1px; background: #E8E8ED; margin: 24px 0; border: 0; }
  .note { font-size: 13px; color: #86868B; line-height: 1.6; }
  .footer { font-size: 12px; color: #86868B; text-align: center; margin-top: 24px; }
  .footer a { color: #86868B; }
  .brand { font-size: 14px; letter-spacing: -0.01em; color: #1D1D1F; margin-bottom: 20px; }
  .brand b { font-weight: 800; } .brand span { font-weight: 100; }
`;

export function consentEmailES(args: TemplateArgs): EmailTemplate {
    const { adultName, childName, confirmUrl } = args;
    return {
        subject: `Confirma que eres el adulto responsable de ${childName}`,
        html: `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Confirma tu identidad</title><style>${baseStyles}</style></head><body>
  <div class="wrap">
    <div class="card">
      <div class="brand"><b>Argo</b><span> Method</span></div>
      <h1>Hola ${adultName},</h1>
      <p>${childName} está a punto de comenzar su odisea en Argo Method. Antes de que comience, necesitamos que confirmes que eres el padre, madre o tutor legal responsable de ${childName}.</p>
      <a class="cta" href="${confirmUrl}">Confirmar y continuar</a>
      <p class="fallback">O copia este enlace en tu navegador:<br>${confirmUrl}</p>
      <p class="note">⏱ Este enlace expira en 24 horas. Si no lo usas a tiempo, deberás empezar de nuevo.</p>
      <hr class="hr">
      <p class="note"><b>¿Por qué te pedimos esto?</b><br>Para proteger la privacidad de los menores, necesitamos verificar que eres el adulto responsable antes de recopilar cualquier dato de ${childName}.</p>
      <p class="note">Si no reconoces este email, puedes ignorarlo. No se recopilará ningún dato hasta que confirmes.</p>
    </div>
    <div class="footer">
      Argo Method · <a href="mailto:hola@argomethod.com">hola@argomethod.com</a><br>
      <a href="https://argomethod.com/privacy">Política de Privacidad</a> · <a href="https://argomethod.com/terms">Términos</a>
    </div>
  </div>
</body></html>`,
        text: `Hola ${adultName},\n\n${childName} está a punto de comenzar su odisea en Argo Method. Antes de que comience, necesitamos que confirmes que eres el padre, madre o tutor legal responsable de ${childName}.\n\nConfirma aquí:\n${confirmUrl}\n\nEste enlace expira en 24 horas.\n\n¿Por qué? Para proteger la privacidad de los menores, necesitamos verificar que eres el adulto responsable antes de recopilar cualquier dato de ${childName}.\n\nSi no reconoces este email, puedes ignorarlo. No se recopilará ningún dato hasta que confirmes.\n\nArgo Method — hola@argomethod.com`,
    };
}

export function consentEmailEN(args: TemplateArgs): EmailTemplate {
    const { adultName, childName, confirmUrl } = args;
    return {
        subject: `Confirm you're the responsible adult for ${childName}`,
        html: `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Confirm your identity</title><style>${baseStyles}</style></head><body>
  <div class="wrap">
    <div class="card">
      <div class="brand"><b>Argo</b><span> Method</span></div>
      <h1>Hi ${adultName},</h1>
      <p>${childName} is about to start their odyssey on Argo Method. Before they begin, we need you to confirm that you are the parent or legal guardian responsible for ${childName}.</p>
      <a class="cta" href="${confirmUrl}">Confirm and continue</a>
      <p class="fallback">Or copy this link into your browser:<br>${confirmUrl}</p>
      <p class="note">⏱ This link expires in 24 hours. If you don't use it in time, you'll need to start over.</p>
      <hr class="hr">
      <p class="note"><b>Why are we asking this?</b><br>To comply with COPPA (the U.S. Children's Online Privacy Protection Act), we need to verify you are the responsible adult before collecting any data about ${childName}.</p>
      <p class="note">If you don't recognize this email, you can ignore it. No data will be collected until you confirm.</p>
    </div>
    <div class="footer">
      Argo Method · <a href="mailto:hola@argomethod.com">hola@argomethod.com</a><br>
      <a href="https://argomethod.com/privacy">Privacy Policy</a> · <a href="https://argomethod.com/terms">Terms</a>
    </div>
  </div>
</body></html>`,
        text: `Hi ${adultName},\n\n${childName} is about to start their odyssey on Argo Method. Before they begin, we need you to confirm that you are the parent or legal guardian responsible for ${childName}.\n\nConfirm here:\n${confirmUrl}\n\nThis link expires in 24 hours.\n\nWhy? To comply with COPPA (U.S. Children's Online Privacy Protection Act), we need to verify you are the responsible adult before collecting any data about ${childName}.\n\nIf you don't recognize this email, you can ignore it. No data will be collected until you confirm.\n\nArgo Method — hola@argomethod.com`,
    };
}

export function consentEmailPT(args: TemplateArgs): EmailTemplate {
    const { adultName, childName, confirmUrl } = args;
    return {
        subject: `Confirme que você é o responsável por ${childName}`,
        html: `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Confirme sua identidade</title><style>${baseStyles}</style></head><body>
  <div class="wrap">
    <div class="card">
      <div class="brand"><b>Argo</b><span> Method</span></div>
      <h1>Olá ${adultName},</h1>
      <p>${childName} está prestes a começar sua odisseia no Argo Method. Antes de começar, precisamos que você confirme que é o pai, mãe ou responsável legal por ${childName}.</p>
      <a class="cta" href="${confirmUrl}">Confirmar e continuar</a>
      <p class="fallback">Ou copie este link no seu navegador:<br>${confirmUrl}</p>
      <p class="note">⏱ Este link expira em 24 horas. Se não for usado a tempo, será necessário começar de novo.</p>
      <hr class="hr">
      <p class="note"><b>Por que pedimos isso?</b><br>Para proteger a privacidade dos menores, precisamos verificar que você é o responsável antes de coletar qualquer dado de ${childName}.</p>
      <p class="note">Se você não reconhece este email, pode ignorá-lo. Nenhum dado será coletado até sua confirmação.</p>
    </div>
    <div class="footer">
      Argo Method · <a href="mailto:hola@argomethod.com">hola@argomethod.com</a><br>
      <a href="https://argomethod.com/privacy">Política de Privacidade</a> · <a href="https://argomethod.com/terms">Termos</a>
    </div>
  </div>
</body></html>`,
        text: `Olá ${adultName},\n\n${childName} está prestes a começar sua odisseia no Argo Method. Antes de começar, precisamos que você confirme que é o pai, mãe ou responsável legal por ${childName}.\n\nConfirme aqui:\n${confirmUrl}\n\nEste link expira em 24 horas.\n\nPor quê? Para proteger a privacidade dos menores, precisamos verificar que você é o responsável antes de coletar qualquer dado de ${childName}.\n\nSe você não reconhece este email, pode ignorá-lo. Nenhum dado será coletado até sua confirmação.\n\nArgo Method — hola@argomethod.com`,
    };
}

export function getConsentEmailTemplate(lang: string, args: TemplateArgs): EmailTemplate {
    if (lang === 'en') return consentEmailEN(args);
    if (lang === 'pt') return consentEmailPT(args);
    return consentEmailES(args);
}
```

- [ ] **Step 2.2: Verify type-check passes**

Run: `npm run lint && npm run build`
Expected: No errors. The new file is a leaf with no runtime dependencies beyond its own types.

- [ ] **Step 2.3: Commit**

```bash
git add api/lib/consent-email-templates.ts
git commit -m "feat(api): add consent email templates (ES/EN/PT)

Pure string builders for the parental consent verification
email. English variant mentions COPPA as a trust signal;
Spanish/Portuguese use generic privacy language."
```

---

## Task 3: `POST /api/request-consent` endpoint

**Files:**
- Create: `api/request-consent.ts`

- [ ] **Step 3.1: Create the endpoint file**

Create `api/request-consent.ts`:

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import { getConsentEmailTemplate } from './lib/consent-email-templates';

/**
 * POST /api/request-consent
 *
 * Called from the frontend when an adult submits the registration form
 * with child_age < 13. Creates a parental_consents row (pending, 24h TTL)
 * and sends the verification email via Resend.
 *
 * Returns: { ok: true, token } on success.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ ok: false, error: 'method_not_allowed' });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const resendKey = process.env.RESEND_API_KEY;
    const siteUrl = process.env.SITE_URL || 'https://argomethod.com';

    if (!serviceKey || !supabaseUrl) {
        console.error('[request-consent] Missing Supabase env');
        return res.status(500).json({ ok: false, error: 'server_config' });
    }
    if (!resendKey) {
        console.error('[request-consent] Missing RESEND_API_KEY');
        return res.status(500).json({ ok: false, error: 'server_config' });
    }

    const {
        adult_name, adult_email, child_name, child_age, sport,
        flow_type, tenant_id, one_link_id, lang,
    } = req.body ?? {};

    // Basic validation
    if (
        typeof adult_name !== 'string' || !adult_name.trim() ||
        typeof adult_email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adult_email) ||
        typeof child_name !== 'string' || !child_name.trim() ||
        typeof child_age !== 'number' || child_age < 8 || child_age >= 13 ||
        typeof flow_type !== 'string' || !['auth', 'tenant', 'one'].includes(flow_type)
    ) {
        return res.status(400).json({ ok: false, error: 'invalid_input' });
    }

    const langSafe: 'es' | 'en' | 'pt' = lang === 'en' || lang === 'pt' ? lang : 'es';
    const sb = createClient(supabaseUrl, serviceKey);

    try {
        const token = randomBytes(16).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        const { error: insertErr } = await sb.from('parental_consents').insert({
            token,
            adult_name: adult_name.trim(),
            adult_email: adult_email.trim().toLowerCase(),
            child_name: child_name.trim(),
            child_age,
            sport: typeof sport === 'string' && sport.trim() ? sport.trim() : null,
            flow_type,
            tenant_id: typeof tenant_id === 'string' ? tenant_id : null,
            one_link_id: typeof one_link_id === 'string' ? one_link_id : null,
            lang: langSafe,
            expires_at: expiresAt,
        });

        if (insertErr) {
            console.error('[request-consent] insert error:', insertErr.message);
            return res.status(500).json({ ok: false, error: 'db_error' });
        }

        // Send email via Resend
        const confirmUrl = `${siteUrl}/consent/${token}`;
        const tpl = getConsentEmailTemplate(langSafe, {
            adultName: adult_name.trim(),
            childName: child_name.trim(),
            confirmUrl,
        });

        const resendRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'Argo Method <hola@argomethod.com>',
                to: [adult_email.trim()],
                subject: tpl.subject,
                html: tpl.html,
                text: tpl.text,
            }),
        });

        if (!resendRes.ok) {
            const errText = await resendRes.text().catch(() => '');
            console.error('[request-consent] Resend failed:', resendRes.status, errText.slice(0, 200));
            // Don't expose Resend details to client
            return res.status(500).json({ ok: false, error: 'email_send_failed' });
        }

        // Minimal structured log (no PII)
        console.info('[request-consent] ok', {
            flow_type,
            lang: langSafe,
            token_prefix: token.slice(0, 6),
        });

        return res.status(200).json({ ok: true, token });
    } catch (err) {
        console.error('[request-consent] unexpected:', err);
        return res.status(500).json({ ok: false, error: 'internal' });
    }
}
```

- [ ] **Step 3.2: Verify type-check passes**

Run: `npm run lint && npm run build`
Expected: No errors.

- [ ] **Step 3.3: Commit**

```bash
git add api/request-consent.ts
git commit -m "feat(api): add POST /api/request-consent

Creates parental_consents row with 24h TTL and sends the
verification email via Resend. Validates child_age 8-12
(VPC applies only to children under 13)."
```

---

## Task 4: `GET /api/consent-status` endpoint

**Files:**
- Create: `api/consent-status.ts`

- [ ] **Step 4.1: Create the endpoint file**

Create `api/consent-status.ts`:

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/consent-status?token=xxx
 *
 * Polled by the frontend waiting screen every 5s. Lazily marks
 * pending-but-expired records as expired. Always safe to call.
 *
 * Responses:
 *   { status: 'pending' }
 *   { status: 'confirmed', token }
 *   { status: 'expired' }
 *   { status: 'not_found' }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ status: 'not_found' });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) {
        console.error('[consent-status] Missing Supabase env');
        return res.status(500).json({ status: 'not_found' });
    }

    const token = typeof req.query.token === 'string' ? req.query.token : null;
    if (!token || !/^[a-f0-9]{32}$/.test(token)) {
        return res.status(200).json({ status: 'not_found' });
    }

    const sb = createClient(supabaseUrl, serviceKey);

    try {
        const { data, error } = await sb
            .from('parental_consents')
            .select('token, status, expires_at')
            .eq('token', token)
            .maybeSingle();

        if (error) {
            console.error('[consent-status] select error:', error.message);
            return res.status(500).json({ status: 'not_found' });
        }
        if (!data) {
            return res.status(200).json({ status: 'not_found' });
        }

        // Lazy expiration for pending rows past their deadline
        if (data.status === 'pending' && new Date(data.expires_at) < new Date()) {
            await sb.from('parental_consents')
                .update({ status: 'expired' })
                .eq('token', token);
            return res.status(200).json({ status: 'expired' });
        }

        if (data.status === 'confirmed') {
            return res.status(200).json({ status: 'confirmed', token });
        }
        if (data.status === 'expired') {
            return res.status(200).json({ status: 'expired' });
        }
        return res.status(200).json({ status: 'pending' });
    } catch (err) {
        console.error('[consent-status] unexpected:', err);
        return res.status(500).json({ status: 'not_found' });
    }
}
```

- [ ] **Step 4.2: Verify type-check passes**

Run: `npm run lint && npm run build`
Expected: No errors.

- [ ] **Step 4.3: Commit**

```bash
git add api/consent-status.ts
git commit -m "feat(api): add GET /api/consent-status

Polled by the waiting screen. Lazily marks expired pending
records. Returns pending/confirmed/expired/not_found."
```

---

## Task 5: `POST /api/confirm-consent` endpoint

**Files:**
- Create: `api/confirm-consent.ts`

- [ ] **Step 5.1: Create the endpoint file**

Create `api/confirm-consent.ts`:

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/confirm-consent
 *
 * Called by the landing page /consent/:token when the adult clicks
 * the email link. Captures IP and user-agent for the COPPA audit trail.
 * Idempotent — calling twice on a confirmed record returns the same success.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ ok: false, error: 'method_not_allowed' });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) {
        console.error('[confirm-consent] Missing Supabase env');
        return res.status(500).json({ ok: false, error: 'server_config' });
    }

    const token = typeof req.body?.token === 'string' ? req.body.token : null;
    if (!token || !/^[a-f0-9]{32}$/.test(token)) {
        return res.status(404).json({ ok: false, error: 'not_found' });
    }

    const sb = createClient(supabaseUrl, serviceKey);

    try {
        const { data, error } = await sb
            .from('parental_consents')
            .select('token, status, expires_at, child_name, lang')
            .eq('token', token)
            .maybeSingle();

        if (error) {
            console.error('[confirm-consent] select error:', error.message);
            return res.status(500).json({ ok: false, error: 'db_error' });
        }
        if (!data) {
            return res.status(404).json({ ok: false, error: 'not_found' });
        }

        // Expired?
        if (new Date(data.expires_at) < new Date()) {
            if (data.status === 'pending') {
                await sb.from('parental_consents').update({ status: 'expired' }).eq('token', token);
            }
            return res.status(410).json({ ok: false, error: 'expired' });
        }

        // Idempotent: already confirmed is success.
        if (data.status === 'confirmed') {
            return res.status(200).json({ ok: true, child_name: data.child_name, lang: data.lang });
        }
        if (data.status === 'expired') {
            return res.status(410).json({ ok: false, error: 'expired' });
        }

        // Capture audit trail
        const forwardedFor = req.headers['x-forwarded-for'];
        const ip = Array.isArray(forwardedFor) ? forwardedFor[0] : (forwardedFor ?? '').split(',')[0].trim() || null;
        const ua = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null;

        const { error: updErr } = await sb
            .from('parental_consents')
            .update({
                status: 'confirmed',
                confirmed_at: new Date().toISOString(),
                confirmed_ip: ip,
                confirmed_user_agent: ua ? ua.slice(0, 500) : null,
            })
            .eq('token', token);

        if (updErr) {
            console.error('[confirm-consent] update error:', updErr.message);
            return res.status(500).json({ ok: false, error: 'db_error' });
        }

        console.info('[confirm-consent] ok', { token_prefix: token.slice(0, 6) });
        return res.status(200).json({ ok: true, child_name: data.child_name, lang: data.lang });
    } catch (err) {
        console.error('[confirm-consent] unexpected:', err);
        return res.status(500).json({ ok: false, error: 'internal' });
    }
}
```

- [ ] **Step 5.2: Verify type-check passes**

Run: `npm run lint && npm run build`
Expected: No errors.

- [ ] **Step 5.3: Commit**

```bash
git add api/confirm-consent.ts
git commit -m "feat(api): add POST /api/confirm-consent

Marks a consent as confirmed and captures IP + UA for the
COPPA audit trail. Idempotent — safe to call twice. Returns
410 for expired tokens and 404 for unknown tokens."
```

---

## Task 6: Gatekeeper in `api/session.ts`

**Files:**
- Modify: `api/session.ts`

- [ ] **Step 6.1: Add consent validation to `start` action**

Open `api/session.ts`. Replace the entire `start` action block — from the line `// ── Start session ──────────────` through the closing `}` of `if (action === 'start') { ... }` (lines 28-58 in the current file) — with:

```ts
        // ── Start session ────────────────────────────────────────────────────
        if (action === 'start') {
            const { adult_name, adult_email, child_name, child_age, sport, tenant_id, lang, consent_token } = fields;

            if (!adult_email || !child_name) {
                return res.status(400).json({ error: 'Missing required fields: adult_email, child_name' });
            }

            // ── COPPA gate: children under 13 require a confirmed consent token ──
            if (typeof child_age === 'number' && child_age < 13) {
                if (typeof consent_token !== 'string' || !/^[a-f0-9]{32}$/.test(consent_token)) {
                    return res.status(403).json({ error: 'consent_required' });
                }

                const { data: consent, error: consentErr } = await sb
                    .from('parental_consents')
                    .select('token, status, expires_at, child_name, child_age, consumed_at')
                    .eq('token', consent_token)
                    .maybeSingle();

                if (consentErr) {
                    console.error('[session:start] consent lookup error:', consentErr.message);
                    return res.status(500).json({ error: 'consent_lookup_failed' });
                }
                if (!consent) {
                    return res.status(403).json({ error: 'consent_invalid' });
                }
                if (consent.status !== 'confirmed') {
                    return res.status(403).json({ error: 'consent_not_confirmed' });
                }
                if (consent.consumed_at) {
                    return res.status(403).json({ error: 'consent_already_used' });
                }
                if (new Date(consent.expires_at) < new Date()) {
                    return res.status(403).json({ error: 'consent_expired' });
                }
                // Validate consent matches the session payload (prevents token reuse for a different child)
                if (
                    consent.child_name !== child_name ||
                    consent.child_age !== child_age
                ) {
                    return res.status(403).json({ error: 'consent_mismatch' });
                }
            }

            const share_token = randomBytes(16).toString('hex');
            const { data, error } = await sb.from('sessions').insert({
                adult_name,
                adult_email,
                child_name,
                child_age,
                sport:           sport || null,
                tenant_id:       tenant_id ?? null,
                lang:            lang ?? 'es',
                eje:             '_pending',
                motor:           '_pending',
                archetype_label: '_pending',
                answers:         [],
                share_token,
            }).select('id, share_token').single();

            if (error) {
                console.error('[session:start] Insert error:', error.message, error.details);
                return res.status(500).json({ error: error.message });
            }

            // Burn the consent token so it can't be reused
            if (typeof child_age === 'number' && child_age < 13 && typeof consent_token === 'string') {
                await sb.from('parental_consents')
                    .update({ consumed_at: new Date().toISOString(), session_id: data.id })
                    .eq('token', consent_token);
            }

            return res.status(200).json({ ok: true, id: data.id, share_token: data.share_token });
        }
```

- [ ] **Step 6.2: Verify type-check passes**

Run: `npm run lint && npm run build`
Expected: No errors.

- [ ] **Step 6.3: Commit**

```bash
git add api/session.ts
git commit -m "feat(api): gate session start on parental consent (<13)

Rejects /api/session action=start with 403 when child_age<13
and no valid confirmed consent_token is provided. Burns the
consent token by marking consumed_at on successful session
creation. No-op for children 13+."
```

---

## Task 7: `maskEmail` helper

**Files:**
- Create: `src/lib/maskEmail.ts`

- [ ] **Step 7.1: Create the helper**

Create `src/lib/maskEmail.ts`:

```ts
/**
 * Masks an email for display in UI: `mariano@gmail.com` -> `ma***@gmail.com`.
 * Keeps the first 2 chars of the local part and the full domain.
 * Returns the input unchanged if it doesn't look like an email.
 */
export function maskEmail(email: string): string {
    if (!email || typeof email !== 'string') return '';
    const at = email.indexOf('@');
    if (at < 0) return email;
    const local = email.slice(0, at);
    const domain = email.slice(at);
    if (local.length <= 2) return `${local}***${domain}`;
    return `${local.slice(0, 2)}***${domain}`;
}
```

- [ ] **Step 7.2: Verify type-check passes**

Run: `npm run lint && npm run build`
Expected: No errors.

- [ ] **Step 7.3: Commit**

```bash
git add src/lib/maskEmail.ts
git commit -m "feat(lib): add maskEmail helper"
```

---

## Task 8: Add i18n keys for VPC UI

**Files:**
- Modify: `src/lib/odysseyTranslations.ts`

- [ ] **Step 8.1: Extend the OdysseyT type**

Open `src/lib/odysseyTranslations.ts`. Find the type definition block that contains `philosophicalAgreement: string;` and `checks: ((name: string) => string)[];` (around line 30-31). Below `checks`, add the following new fields to the type:

```ts
    // Consolidated consent check (COPPA-anchored, replaces the 4 philosophical checks)
    consentBullets: ((name: string) => string)[];
    consentCheck: (name: string) => string;

    // Parental consent waiting screen
    consentWaitingTitle: string;
    consentWaitingSubtitle: (maskedEmail: string) => string;
    consentWaitingWhy: (name: string) => string;
    consentWaitingExpiry: string;
    consentWaitingStatus: string;
    consentWaitingResend: string;
    consentWaitingChangeEmail: string;
    consentWaitingCoppaFooter: string; // shown only when lang === 'en'
    consentWaitingExpired: string;
    consentWaitingInvalid: string;
    consentWaitingRestart: string;

    // Consent landing page (/consent/:token)
    consentLandingLoading: string;
    consentLandingSuccess: (name: string) => string;
    consentLandingExpired: string;
    consentLandingInvalid: string;
```

- [ ] **Step 8.2: Add Spanish translations**

In the Spanish `es` block of `odysseyTranslations.ts`, find the `checks:` array (around line 182). Immediately after the closing `],` of that array, insert:

```ts
    consentBullets: [
        (name) => `Argo Method es una "fotografía del presente", no una etiqueta permanente para ${name || 'tu deportista'}.`,
        (name) => `El objetivo es priorizar el disfrute y el bienestar de ${name || 'tu deportista'} sobre el rendimiento competitivo.`,
        () => 'No es un diagnóstico clínico ni médico.',
    ],
    consentCheck: (name) => `Soy el padre, madre o tutor legal de ${name || 'este deportista'} y acepto la Política de Privacidad y los Términos.`,
    consentWaitingTitle: 'Revisa tu email',
    consentWaitingSubtitle: (masked) => `Te enviamos un enlace a ${masked}`,
    consentWaitingWhy: (name) => `Para proteger la privacidad de ${name || 'tu deportista'}, necesitamos que confirmes que eres el adulto responsable.`,
    consentWaitingExpiry: 'Este enlace expira en 24 horas.',
    consentWaitingStatus: 'Esperando confirmación...',
    consentWaitingResend: 'Reenviar email',
    consentWaitingChangeEmail: 'Cambiar email',
    consentWaitingCoppaFooter: '',
    consentWaitingExpired: 'Este enlace expiró. Por seguridad, debes empezar de nuevo.',
    consentWaitingInvalid: 'Este enlace no es válido.',
    consentWaitingRestart: 'Empezar de nuevo',
    consentLandingLoading: 'Confirmando...',
    consentLandingSuccess: (name) => `¡Listo! Ya puedes volver a la pantalla donde ${name} está esperando para comenzar.`,
    consentLandingExpired: 'Este enlace expiró. Por seguridad, el adulto responsable debe empezar de nuevo.',
    consentLandingInvalid: 'Este enlace no es válido.',
```

- [ ] **Step 8.3: Add English translations**

In the English `en` block of `odysseyTranslations.ts`, find the `checks:` array (around line 332). Immediately after the closing `],` of that array, insert:

```ts
    consentBullets: [
        (name) => `Argo Method is a "snapshot of the present," not a permanent label for ${name || 'your athlete'}.`,
        (name) => `The goal is to prioritize ${name || 'your athlete'}'s enjoyment and well-being over competitive performance.`,
        () => 'This is not a clinical or medical diagnosis.',
    ],
    consentCheck: (name) => `I am the parent or legal guardian of ${name || 'this athlete'} and I accept the Privacy Policy and Terms of Service.`,
    consentWaitingTitle: 'Check your email',
    consentWaitingSubtitle: (masked) => `We sent a link to ${masked}`,
    consentWaitingWhy: (name) => `To comply with COPPA (U.S. children's privacy law), we need you to confirm you are the responsible adult for ${name || 'your athlete'}.`,
    consentWaitingExpiry: 'This link expires in 24 hours.',
    consentWaitingStatus: 'Waiting for confirmation...',
    consentWaitingResend: 'Resend email',
    consentWaitingChangeEmail: 'Change email',
    consentWaitingCoppaFooter: 'Argo Method complies with the Children\'s Online Privacy Protection Act (COPPA).',
    consentWaitingExpired: 'This link has expired. For security, you must start over.',
    consentWaitingInvalid: 'This link is not valid.',
    consentWaitingRestart: 'Start over',
    consentLandingLoading: 'Confirming...',
    consentLandingSuccess: (name) => `Done! You can now return to the screen where ${name} is waiting to begin.`,
    consentLandingExpired: 'This link has expired. For security, the responsible adult must start over.',
    consentLandingInvalid: 'This link is not valid.',
```

- [ ] **Step 8.4: Add Portuguese translations**

In the Portuguese `pt` block of `odysseyTranslations.ts`, find the `checks:` array (around line 482). Immediately after the closing `],` of that array, insert:

```ts
    consentBullets: [
        (name) => `Argo Method é uma "fotografia do presente", não um rótulo permanente para ${name || 'seu atleta'}.`,
        (name) => `O objetivo é priorizar o prazer e bem-estar de ${name || 'seu atleta'} sobre o rendimento competitivo.`,
        () => 'Não é um diagnóstico clínico nem médico.',
    ],
    consentCheck: (name) => `Sou o pai, mãe ou responsável legal por ${name || 'este atleta'} e aceito a Política de Privacidade e os Termos.`,
    consentWaitingTitle: 'Verifique seu email',
    consentWaitingSubtitle: (masked) => `Enviamos um link para ${masked}`,
    consentWaitingWhy: (name) => `Para proteger a privacidade de ${name || 'seu atleta'}, precisamos que você confirme que é o responsável.`,
    consentWaitingExpiry: 'Este link expira em 24 horas.',
    consentWaitingStatus: 'Aguardando confirmação...',
    consentWaitingResend: 'Reenviar email',
    consentWaitingChangeEmail: 'Alterar email',
    consentWaitingCoppaFooter: '',
    consentWaitingExpired: 'Este link expirou. Por segurança, você precisa começar de novo.',
    consentWaitingInvalid: 'Este link não é válido.',
    consentWaitingRestart: 'Começar de novo',
    consentLandingLoading: 'Confirmando...',
    consentLandingSuccess: (name) => `Pronto! Você já pode voltar à tela onde ${name} está esperando para começar.`,
    consentLandingExpired: 'Este link expirou. Por segurança, o responsável deve começar de novo.',
    consentLandingInvalid: 'Este link não é válido.',
```

- [ ] **Step 8.5: Verify type-check passes**

Run: `npm run lint && npm run build`
Expected: No errors. TypeScript will verify that all three language blocks satisfy the extended type.

- [ ] **Step 8.6: Commit**

```bash
git add src/lib/odysseyTranslations.ts
git commit -m "feat(i18n): add VPC consent keys (ES/EN/PT)

Adds consolidated consent check copy, parental consent
waiting screen copy, and landing page copy. English
variant includes COPPA mentions as a trust signal."
```

---

## Task 9: `consentStore` frontend client

**Files:**
- Create: `src/lib/consentStore.ts`

- [ ] **Step 9.1: Create the consent store**

Create `src/lib/consentStore.ts`:

```ts
import type { AdultData } from '../components/onboarding/OnboardingFlowV2';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RequestConsentInput {
    adultData: AdultData;
    flowType: 'auth' | 'tenant' | 'one';
    tenantId?: string;
    oneLinkId?: string;
    lang: string;
}

export interface RequestConsentResult {
    ok: boolean;
    token?: string;
    error?: string;
}

export type ConsentStatus = 'pending' | 'confirmed' | 'expired' | 'not_found';

// ─── API calls ───────────────────────────────────────────────────────────────

export async function requestConsent(input: RequestConsentInput): Promise<RequestConsentResult> {
    const body = {
        adult_name:  input.adultData.nombreAdulto,
        adult_email: input.adultData.email,
        child_name:  input.adultData.nombreNino,
        child_age:   input.adultData.edad,
        sport:       input.adultData.deporte,
        flow_type:   input.flowType,
        tenant_id:   input.tenantId ?? null,
        one_link_id: input.oneLinkId ?? null,
        lang:        input.lang,
    };

    if (import.meta.env.DEV) {
        const mockToken = 'dev' + Math.random().toString(16).slice(2).padEnd(29, '0').slice(0, 29);
        console.info('[consentStore] DEV — would request consent:', body, '→ token:', mockToken);
        return { ok: true, token: mockToken };
    }

    try {
        const res = await fetch('/api/request-consent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const json = await res.json().catch(() => ({ ok: false, error: 'parse_error' }));
        if (!res.ok || !json.ok) {
            return { ok: false, error: json.error || `http_${res.status}` };
        }
        return { ok: true, token: json.token };
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'unexpected';
        console.error('[consentStore] requestConsent failed:', msg);
        return { ok: false, error: msg };
    }
}

export async function checkConsentStatus(token: string): Promise<ConsentStatus> {
    if (import.meta.env.DEV && token.startsWith('dev')) {
        // In DEV we auto-confirm after 2 seconds of waiting
        return 'confirmed';
    }
    try {
        const res = await fetch(`/api/consent-status?token=${encodeURIComponent(token)}`);
        if (!res.ok) return 'not_found';
        const json = await res.json().catch(() => null);
        const status = json?.status;
        if (status === 'confirmed' || status === 'pending' || status === 'expired') return status;
        return 'not_found';
    } catch {
        return 'pending'; // transient errors — keep polling
    }
}

export async function confirmConsent(token: string): Promise<{ ok: boolean; childName?: string; lang?: string; error?: string }> {
    try {
        const res = await fetch('/api/confirm-consent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
        });
        const json = await res.json().catch(() => null);
        if (res.status === 410) return { ok: false, error: 'expired' };
        if (res.status === 404) return { ok: false, error: 'not_found' };
        if (!res.ok || !json?.ok) return { ok: false, error: json?.error || `http_${res.status}` };
        return { ok: true, childName: json.child_name, lang: json.lang };
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'unexpected';
        return { ok: false, error: msg };
    }
}

// ─── localStorage recovery (separate slot from argo_session_recovery) ────────

const CONSENT_RECOVERY_KEY = 'argo_consent_recovery';

export interface ConsentRecoveryData {
    token: string;
    adultData: AdultData;
    flowType: 'auth' | 'tenant' | 'one';
    tenantId?: string;
    oneLinkId?: string;
    lang: string;
    timestamp: number;
}

export function saveConsentRecovery(data: Omit<ConsentRecoveryData, 'timestamp'>): void {
    try {
        const payload: ConsentRecoveryData = { ...data, timestamp: Date.now() };
        localStorage.setItem(CONSENT_RECOVERY_KEY, JSON.stringify(payload));
    } catch {
        // non-critical
    }
}

export function getConsentRecovery(): ConsentRecoveryData | null {
    try {
        const raw = localStorage.getItem(CONSENT_RECOVERY_KEY);
        if (!raw) return null;
        const data: ConsentRecoveryData = JSON.parse(raw);
        const twentyFourHoursMs = 24 * 60 * 60 * 1000;
        if (Date.now() - data.timestamp > twentyFourHoursMs) {
            localStorage.removeItem(CONSENT_RECOVERY_KEY);
            return null;
        }
        return data;
    } catch {
        return null;
    }
}

export function clearConsentRecovery(): void {
    try {
        localStorage.removeItem(CONSENT_RECOVERY_KEY);
    } catch {
        // non-critical
    }
}
```

- [ ] **Step 9.2: Verify type-check passes**

Run: `npm run lint && npm run build`
Expected: No errors.

- [ ] **Step 9.3: Commit**

```bash
git add src/lib/consentStore.ts
git commit -m "feat(lib): add consentStore frontend client

Wraps /api/request-consent, /api/consent-status,
/api/confirm-consent and provides a 24h localStorage
recovery slot (separate from argo_session_recovery)."
```

---

## Task 10: `ParentalConsentWaiting` component

**Files:**
- Create: `src/components/onboarding/screens/ParentalConsentWaiting.tsx`

- [ ] **Step 10.1: Create the component**

Create `src/components/onboarding/screens/ParentalConsentWaiting.tsx`:

```tsx
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, RefreshCw, ArrowLeft } from 'lucide-react';
import { useLang } from '../../../context/LangContext';
import { getOdysseyT } from '../../../lib/odysseyTranslations';
import { maskEmail } from '../../../lib/maskEmail';
import { checkConsentStatus, requestConsent, type RequestConsentInput } from '../../../lib/consentStore';

type UiState = 'waiting' | 'expired' | 'invalid';

interface Props {
    token: string;
    childName: string;
    adultEmail: string;
    resendInput: RequestConsentInput; // snapshot used if the user clicks Resend
    onConfirmed: (token: string) => void;
    onCancel: () => void;
}

const POLL_INTERVAL_MS = 5000;
const RESEND_COOLDOWN_MS = 60_000;

export const ParentalConsentWaiting: React.FC<Props> = ({
    token: initialToken,
    childName,
    adultEmail,
    resendInput,
    onConfirmed,
    onCancel,
}) => {
    const { lang } = useLang();
    const ot = getOdysseyT(lang);

    const [token, setToken] = useState(initialToken);
    const [uiState, setUiState] = useState<UiState>('waiting');
    const [resendCooldownUntil, setResendCooldownUntil] = useState(0);
    const [resendFlash, setResendFlash] = useState(false);

    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Polling loop
    useEffect(() => {
        if (uiState !== 'waiting') return;

        let cancelled = false;
        const tick = async () => {
            const status = await checkConsentStatus(token);
            if (cancelled) return;
            if (status === 'confirmed') {
                if (pollRef.current) clearInterval(pollRef.current);
                onConfirmed(token);
            } else if (status === 'expired') {
                if (pollRef.current) clearInterval(pollRef.current);
                setUiState('expired');
            } else if (status === 'not_found') {
                if (pollRef.current) clearInterval(pollRef.current);
                setUiState('invalid');
            }
            // 'pending' → keep polling
        };

        // Kick once immediately so we don't wait 5s on mount
        void tick();
        pollRef.current = setInterval(tick, POLL_INTERVAL_MS);

        return () => {
            cancelled = true;
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = null;
        };
    }, [token, uiState, onConfirmed]);

    const onResend = async () => {
        if (Date.now() < resendCooldownUntil) return;
        setResendCooldownUntil(Date.now() + RESEND_COOLDOWN_MS);
        const result = await requestConsent(resendInput);
        if (result.ok && result.token) {
            setToken(result.token);
            setResendFlash(true);
            setTimeout(() => setResendFlash(false), 3000);
        }
    };

    const masked = maskEmail(adultEmail);

    // ── Error states ──
    if (uiState === 'expired' || uiState === 'invalid') {
        const msg = uiState === 'expired' ? ot.consentWaitingExpired : ot.consentWaitingInvalid;
        return (
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md mx-auto text-center space-y-6 py-12"
            >
                <div className="mx-auto w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                    <Mail className="w-7 h-7 text-red-500" />
                </div>
                <p className="text-argo-navy text-base leading-relaxed">{msg}</p>
                <button
                    onClick={onCancel}
                    className="w-full bg-[#1D1D1F] text-white font-medium py-4 rounded-xl text-sm"
                >
                    {ot.consentWaitingRestart}
                </button>
            </motion.div>
        );
    }

    // ── Waiting state ──
    const resendDisabled = Date.now() < resendCooldownUntil;

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto space-y-8 py-8"
        >
            <div className="flex justify-center">
                <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
                    className="w-16 h-16 rounded-full bg-[#F5F5F7] flex items-center justify-center"
                >
                    <Mail className="w-8 h-8 text-[#1D1D1F]" />
                </motion.div>
            </div>

            <div className="text-center space-y-2">
                <h2 className="font-display text-2xl font-light text-[#1D1D1F]" style={{ letterSpacing: '-0.02em' }}>
                    {ot.consentWaitingTitle}
                </h2>
                <p className="text-sm text-argo-grey">{ot.consentWaitingSubtitle(masked)}</p>
            </div>

            <div className="rounded-xl bg-[#F5F5F7] p-4 text-center">
                <p className="text-sm text-argo-navy leading-relaxed">{ot.consentWaitingWhy(childName)}</p>
                <p className="text-xs text-argo-grey mt-3">⏱ {ot.consentWaitingExpiry}</p>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-argo-grey">
                <div className="w-4 h-4 rounded-full border-2 border-argo-indigo border-t-transparent animate-spin" />
                <span>{ot.consentWaitingStatus}</span>
            </div>

            <div className="space-y-2">
                <button
                    onClick={onResend}
                    disabled={resendDisabled}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-[#D2D2D7] text-sm font-medium text-argo-navy hover:border-[#1D1D1F] disabled:opacity-40 transition-all"
                >
                    <RefreshCw className="w-4 h-4" />
                    {resendFlash ? '✓' : ot.consentWaitingResend}
                </button>
                <button
                    onClick={onCancel}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm text-argo-grey hover:text-argo-navy transition-all"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {ot.consentWaitingChangeEmail}
                </button>
            </div>

            {lang === 'en' && ot.consentWaitingCoppaFooter && (
                <p className="text-[11px] text-argo-grey text-center leading-relaxed">{ot.consentWaitingCoppaFooter}</p>
            )}
        </motion.div>
    );
};
```

- [ ] **Step 10.2: Verify type-check passes**

Run: `npm run lint && npm run build`
Expected: No errors.

- [ ] **Step 10.3: Commit**

```bash
git add src/components/onboarding/screens/ParentalConsentWaiting.tsx
git commit -m "feat(onboarding): add ParentalConsentWaiting screen

Shown between AdultRegistration and DeviceHandoff when
child_age<13. Polls /api/consent-status every 5s, supports
resend (60s cooldown) and cancel. Advances on confirmed."
```

---

## Task 11: `ConsentLanding` page

**Files:**
- Create: `src/pages/ConsentLanding.tsx`

- [ ] **Step 11.1: Create the landing page**

Create `src/pages/ConsentLanding.tsx`:

```tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { confirmConsent } from '../lib/consentStore';
import { useLang } from '../context/LangContext';
import { getOdysseyT, type Lang } from '../lib/odysseyTranslations';

type UiState = 'loading' | 'success' | 'expired' | 'invalid';

export const ConsentLanding: React.FC = () => {
    const { token = '' } = useParams<{ token: string }>();
    const { lang, setLang } = useLang();

    const [uiState, setUiState] = useState<UiState>('loading');
    const [childName, setChildName] = useState<string>('');

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const result = await confirmConsent(token);
            if (cancelled) return;
            if (result.ok) {
                if (result.lang === 'es' || result.lang === 'en' || result.lang === 'pt') {
                    setLang(result.lang as Lang);
                }
                setChildName(result.childName ?? '');
                setUiState('success');
            } else if (result.error === 'expired') {
                setUiState('expired');
            } else {
                setUiState('invalid');
            }
        })();
        return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const ot = getOdysseyT(lang);

    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-argo-neutral">
            <div className="max-w-md w-full text-center space-y-6 py-12">
                <div className="flex items-center justify-center gap-1.5 mb-8">
                    <span style={{ fontSize: 18, letterSpacing: '-0.02em', color: '#1D1D1F' }}>
                        <span style={{ fontWeight: 800 }}>Argo</span><span style={{ fontWeight: 100 }}> Method</span>
                    </span>
                </div>

                {uiState === 'loading' && (
                    <>
                        <div className="mx-auto w-14 h-14 rounded-full border-2 border-argo-indigo border-t-transparent animate-spin" />
                        <p className="text-argo-grey text-sm">{ot.consentLandingLoading}</p>
                    </>
                )}

                {uiState === 'success' && (
                    <>
                        <div className="mx-auto w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                            <CheckCircle2 className="w-10 h-10 text-green-500" />
                        </div>
                        <p className="text-argo-navy text-base leading-relaxed">
                            {ot.consentLandingSuccess(childName || '—')}
                        </p>
                    </>
                )}

                {uiState === 'expired' && (
                    <>
                        <div className="mx-auto w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center">
                            <Clock className="w-10 h-10 text-amber-500" />
                        </div>
                        <p className="text-argo-navy text-base leading-relaxed">{ot.consentLandingExpired}</p>
                    </>
                )}

                {uiState === 'invalid' && (
                    <>
                        <div className="mx-auto w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                            <XCircle className="w-10 h-10 text-red-500" />
                        </div>
                        <p className="text-argo-navy text-base leading-relaxed">{ot.consentLandingInvalid}</p>
                    </>
                )}
            </div>
        </div>
    );
};
```

- [ ] **Step 11.2: Fix the `Lang` import**

The file I scaffolded imports `Lang` from `odysseyTranslations.ts`, but `Lang` is actually exported from `../context/LangContext`. Change the import lines at the top of `src/pages/ConsentLanding.tsx` from:

```tsx
import { useLang } from '../context/LangContext';
import { getOdysseyT, type Lang } from '../lib/odysseyTranslations';
```

to:

```tsx
import { useLang, type Lang } from '../context/LangContext';
import { getOdysseyT } from '../lib/odysseyTranslations';
```

- [ ] **Step 11.3: Verify type-check passes**

Run: `npm run lint && npm run build`
Expected: No errors.

- [ ] **Step 11.4: Commit**

```bash
git add src/pages/ConsentLanding.tsx
git commit -m "feat(pages): add /consent/:token landing page

Public stateless page that confirms a consent token on
mount and shows one of four states: loading, success,
expired, invalid. No auth required."
```

---

## Task 12: Register `/consent/:token` route in App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 12.1: Add the lazy import**

Open `src/App.tsx`. Find the lazy-load block around lines 47-58. After the line:

```tsx
const OnePanel          = lazy(() => import('./pages/OnePanel').then(m => ({ default: m.OnePanel })));
```

Insert:

```tsx
const ConsentLanding    = lazy(() => import('./pages/ConsentLanding').then(m => ({ default: m.ConsentLanding })));
```

- [ ] **Step 12.2: Add the route**

In the `<Routes>` block, find the line:

```tsx
<Route path="/privacy"    element={<PrivacyPage />} />
```

Immediately below it, add:

```tsx
<Route path="/consent/:token" element={<ConsentLanding />} />
```

- [ ] **Step 12.3: Verify type-check passes**

Run: `npm run lint && npm run build`
Expected: No errors.

- [ ] **Step 12.4: Commit**

```bash
git add src/App.tsx
git commit -m "feat(app): add /consent/:token public route"
```

---

## Task 13: Extend `sessionStore.startSession` with `consentToken`

**Files:**
- Modify: `src/lib/sessionStore.ts`

- [ ] **Step 13.1: Extend the StartSessionPayload type**

Open `src/lib/sessionStore.ts`. Find the `StartSessionPayload` interface (around line 22) and replace it with:

```ts
interface StartSessionPayload {
    adultData: AdultData;
    tenantId?: string;
    lang?: string;
    consentToken?: string;
}
```

- [ ] **Step 13.2: Forward consentToken into the API body**

In the same file, find `startSession()` (around line 80) and replace its body (the `const body = {...}` block and everything up to and including the `return fetchWithRetry(...)` line) with:

```ts
    const body: Record<string, unknown> = {
        adult_name:  payload.adultData.nombreAdulto,
        adult_email: payload.adultData.email,
        child_name:  payload.adultData.nombreNino,
        child_age:   payload.adultData.edad,
        sport:       payload.adultData.deporte || null,
        tenant_id:   payload.tenantId ?? null,
        lang:        payload.lang ?? 'es',
    };
    if (payload.consentToken) {
        body.consent_token = payload.consentToken;
    }

    if (import.meta.env.DEV) {
        const mockId = `dev-${Date.now()}`;
        console.info('[sessionStore] DEV — would start session:', body, '→ id:', mockId);
        return { ok: true, id: mockId };
    }

    return fetchWithRetry('/api/session', { action: 'start', ...body });
```

- [ ] **Step 13.3: Verify type-check passes**

Run: `npm run lint && npm run build`
Expected: No errors.

- [ ] **Step 13.4: Commit**

```bash
git add src/lib/sessionStore.ts
git commit -m "feat(lib): forward consentToken through startSession

Adds optional consentToken to StartSessionPayload. When
present, it is forwarded to /api/session action=start as
consent_token. Used by OnboardingFlowV2 for children <13."
```

---

## Task 14: Consolidate checks + age branching in `AdultRegistration.tsx`

**Files:**
- Modify: `src/components/onboarding/screens/AdultRegistration.tsx`

- [ ] **Step 14.1: Rewrite the component**

Replace the entire contents of `src/components/onboarding/screens/AdultRegistration.tsx` with:

```tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useLang } from '../../../context/LangContext';
import { getOdysseyT } from '../../../lib/odysseyTranslations';
import { requestConsent } from '../../../lib/consentStore';

interface AdultData {
    nombreAdulto: string;
    email: string;
    nombreNino: string;
    edad: number;
    deporte: string;
}

interface Props {
    userEmail?: string;
    flowType: 'auth' | 'tenant' | 'one';
    tenantId?: string;
    oneLinkId?: string;
    onComplete: (data: AdultData) => void;
    onConsentRequired: (args: { token: string; adultData: AdultData }) => void;
}

export const AdultRegistration: React.FC<Props> = ({
    userEmail = '',
    flowType,
    tenantId,
    oneLinkId,
    onComplete,
    onConsentRequired,
}) => {
    const { lang } = useLang();
    const ot = getOdysseyT(lang);

    const [nombreAdulto, setNombreAdulto]   = useState('');
    const [email, setEmail]                 = useState(userEmail);
    const [nombreNino, setNombreNino]       = useState('');
    const [edad, setEdad]                   = useState(10);
    const [deporte, setDeporte]             = useState('');
    const [deporteCustom, setDeporteCustom] = useState('');
    const [accepted, setAccepted]           = useState(false);
    const [submitting, setSubmitting]       = useState(false);
    const [submitError, setSubmitError]     = useState<string | null>(null);

    const lastSport = ot.sports[ot.sports.length - 1];
    const deporteFinal = deporte === lastSport ? deporteCustom : deporte;
    const emailFinal = userEmail || email.trim();

    const isValid =
        nombreAdulto.trim() &&
        emailFinal &&
        nombreNino.trim() &&
        deporteFinal.trim() &&
        accepted &&
        !submitting;

    const handleSubmit = async () => {
        if (!isValid) return;
        setSubmitError(null);

        const adultData: AdultData = {
            nombreAdulto: nombreAdulto.trim(),
            email: emailFinal,
            nombreNino: nombreNino.trim(),
            edad,
            deporte: deporteFinal.trim(),
        };

        if (edad < 13) {
            setSubmitting(true);
            const result = await requestConsent({
                adultData,
                flowType,
                tenantId,
                oneLinkId,
                lang,
            });
            setSubmitting(false);
            if (result.ok && result.token) {
                onConsentRequired({ token: result.token, adultData });
            } else {
                setSubmitError(result.error ?? 'unknown');
            }
        } else {
            onComplete(adultData);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 max-w-lg mx-auto"
        >
            <div>
                <div className="text-[10px] font-medium text-[#86868B] uppercase tracking-[0.2em] mb-1">
                    {ot.registration}
                </div>
                <h2 className="font-display text-2xl font-light text-[#1D1D1F]" style={{ letterSpacing: '-0.02em' }}>
                    {ot.registrationSub}
                </h2>
                <p className="text-sm text-argo-grey mt-1.5 leading-relaxed">
                    {userEmail
                        ? <>{ot.reportWillBeSentTo(userEmail)} {ot.fillDataBefore(nombreNino)}</>
                        : <>{ot.fillDataBefore(nombreNino)}</>
                    }
                </p>
            </div>

            {/* Form fields */}
            <div className="space-y-4">
                {[
                    { label: ot.yourName, value: nombreAdulto, setter: setNombreAdulto, placeholder: ot.yourNamePlaceholder, type: 'text' },
                    ...(!userEmail ? [{ label: ot.yourEmail, value: email, setter: setEmail, placeholder: ot.yourEmailPlaceholder, type: 'email' }] : []),
                    { label: ot.athleteName, value: nombreNino, setter: setNombreNino, placeholder: ot.athleteNamePlaceholder, type: 'text' },
                ].map(f => (
                    <div key={f.label} className="space-y-1.5">
                        <label className="text-[10px] font-bold text-argo-grey uppercase tracking-widest">
                            {f.label}
                        </label>
                        <input
                            type={f.type}
                            value={f.value}
                            onChange={e => f.setter(e.target.value)}
                            placeholder={f.placeholder}
                            className="w-full border border-[#D2D2D7] rounded-xl px-4 py-3 text-sm text-[#1D1D1F] focus:outline-none focus:border-[#1D1D1F] transition-colors"
                        />
                    </div>
                ))}

                {/* Edad */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-argo-grey uppercase tracking-widest">
                        {ot.athleteAge(edad)}
                    </label>
                    <input
                        type="range" min={8} max={16} value={edad}
                        onChange={e => setEdad(Number(e.target.value))}
                        className="w-full accent-argo-indigo"
                    />
                    <div className="flex justify-between text-[10px] text-argo-grey">
                        <span>8</span><span>12</span><span>16</span>
                    </div>
                </div>

                {/* Deporte */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-argo-grey uppercase tracking-widest">{ot.sport}</label>
                    <div className="flex flex-wrap gap-2">
                        {ot.sports.map(d => (
                            <button
                                key={d}
                                onClick={() => setDeporte(d)}
                                className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                                    deporte === d
                                        ? 'bg-[#1D1D1F] text-white border-[#1D1D1F]'
                                        : 'bg-white border-[#D2D2D7] text-[#424245] hover:border-[#1D1D1F]'
                                }`}
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                    {deporte === lastSport && (
                        <input
                            type="text"
                            value={deporteCustom}
                            onChange={e => setDeporteCustom(e.target.value)}
                            placeholder={ot.sportOtherPlaceholder}
                            className="w-full border border-[#D2D2D7] rounded-xl px-4 py-2.5 text-sm text-[#1D1D1F] focus:outline-none focus:border-[#1D1D1F] transition-colors"
                        />
                    )}
                </div>
            </div>

            {/* Consolidated consent block */}
            <div className="space-y-4">
                <div className="text-[10px] font-bold text-argo-grey uppercase tracking-widest">
                    {ot.philosophicalAgreement}
                </div>

                <div className="rounded-xl bg-[#F5F5F7] p-4 space-y-2">
                    {ot.consentBullets.map((textFn, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-argo-navy leading-relaxed">
                            <span className="text-argo-grey mt-0.5">•</span>
                            <span>{textFn(nombreNino)}</span>
                        </div>
                    ))}
                </div>

                <button
                    onClick={() => setAccepted(prev => !prev)}
                    className={`w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                        accepted
                            ? 'border-[#1D1D1F] bg-white'
                            : 'border-[#D2D2D7] bg-white hover:border-[#424245]'
                    }`}
                >
                    <div className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-all ${
                        accepted ? 'bg-[#1D1D1F] border-[#1D1D1F]' : 'border-[#D2D2D7]'
                    }`}>
                        {accepted && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                    </div>
                    <span className="text-sm text-argo-navy leading-relaxed">
                        {ot.consentCheck(nombreNino)}{' '}
                        <a href="/privacy" target="_blank" rel="noreferrer" className="underline text-argo-indigo">
                            {lang === 'en' ? 'Privacy Policy' : lang === 'pt' ? 'Política de Privacidade' : 'Política de Privacidad'}
                        </a>
                        {' · '}
                        <a href="/terms" target="_blank" rel="noreferrer" className="underline text-argo-indigo">
                            {lang === 'en' ? 'Terms' : lang === 'pt' ? 'Termos' : 'Términos'}
                        </a>
                    </span>
                </button>
            </div>

            {submitError && (
                <p className="text-sm text-red-500 text-center">
                    {lang === 'en'
                        ? 'Something went wrong. Please try again.'
                        : lang === 'pt'
                            ? 'Algo deu errado. Tente novamente.'
                            : 'Algo salió mal. Inténtalo de nuevo.'}
                </p>
            )}

            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={!isValid}
                className="w-full bg-[#1D1D1F] text-white font-medium py-4 rounded-xl flex items-center justify-center gap-2 text-sm disabled:opacity-40 transition-all"
            >
                {submitting
                    ? (lang === 'en' ? 'Sending...' : lang === 'pt' ? 'Enviando...' : 'Enviando...')
                    : <>{ot.continue} <ChevronRight size={16} /></>}
            </motion.button>
        </motion.div>
    );
};
```

- [ ] **Step 14.2: Verify type-check passes**

Run: `npm run lint && npm run build`
Expected: **One error** — `OnboardingFlowV2.tsx` still uses `<AdultRegistration userEmail={...} onComplete={...} />` without the new required props (`flowType`, `onConsentRequired`). Task 15 resolves this.

- [ ] **Step 14.3: Commit (knowing the build is temporarily broken)**

```bash
git add src/components/onboarding/screens/AdultRegistration.tsx
git commit -m "feat(onboarding): consolidate consent check + age branching

Replaces the 4 philosophical checkboxes with one COPPA-anchored
check (parent/legal guardian + Privacy Policy + Terms). When
child_age<13, submits to /api/request-consent via consentStore
and fires onConsentRequired; otherwise calls onComplete as before.

Build will be red until OnboardingFlowV2 is updated (next task)."
```

---

## Task 15: Wire consent waiting screen into `OnboardingFlowV2.tsx`

**Files:**
- Modify: `src/components/onboarding/OnboardingFlowV2.tsx`

- [ ] **Step 15.1: Add the new imports**

Open `src/components/onboarding/OnboardingFlowV2.tsx`. Find the import block around lines 10-27. After the line:

```tsx
import { DeviceHandoff } from './screens/DeviceHandoff';
```

Insert:

```tsx
import { ParentalConsentWaiting } from './screens/ParentalConsentWaiting';
```

- [ ] **Step 15.2: Extend the screen type union**

Find the `ScreenDef` type definition (around lines 41-48). Add a new variant to the union so it reads:

```tsx
type ScreenDef =
    | { type: 'language-select' }
    | { type: 'adult-intro'; slideIndex: number }
    | { type: 'adult-registration' }
    | { type: 'parental-consent-waiting' }
    | { type: 'device-handoff' }
    | { type: 'story'; slideId: string; useContinueLabelFromT?: boolean }
    | { type: 'question'; questionIndex: number }
    | { type: 'minigame'; gameId: 'minigame_a' | 'minigame_b' | 'minigame_c' }
    | { type: 'child-result' }
;
```

- [ ] **Step 15.3: Insert the waiting screen in the SCREENS array**

Find the SCREENS array (starts around line 52). Between the `{ type: 'adult-registration' }` entry and the `{ type: 'device-handoff' }` entry, insert the new entry:

```tsx
    { type: 'adult-registration' },                                 // 4
    { type: 'parental-consent-waiting' },                           // 5 (conditional; skipped when age >= 13)
    { type: 'device-handoff' },                                     // 6 (was 5)
```

The inline numeric comments on the subsequent lines (`// 6`, `// 7`, ..., `// 29`) are cosmetic labels for readers — they do not affect runtime behavior. You may update them to reflect the new indices for readability, but it is not required. The only index-dependent runtime logic is `ODYSSEY_START`, `ODYSSEY_END`, and the ranges inside `getEffectSrc` — those are updated in steps 15.4 and 15.5 below.

- [ ] **Step 15.4: Shift ODYSSEY_START / ODYSSEY_END constants**

Find the constants near the audio block (around line 195):

```tsx
    const ODYSSEY_START  = 6;
    const ODYSSEY_END    = 29;
```

Change to:

```tsx
    const ODYSSEY_START  = 7;
    const ODYSSEY_END    = 30;
```

- [ ] **Step 15.5: Update `getEffectSrc` ranges**

Find the function `getEffectSrc` (around line 210). Update its ranges to account for the +1 shift:

```tsx
    const getEffectSrc = (idx: number): string | null => {
        if (idx >= 7 && idx <= 13)  return '/audio/effects_01.mp3'; // intro + minigame_a + puerto
        if (idx >= 14 && idx <= 17) return '/audio/effects_02.mp3'; // mar abierto + minigame_b
        if (idx >= 18 && idx <= 22) return '/audio/effects_03.mp3'; // tormenta + minigame_c
        if (idx >= 23 && idx <= 30) return '/audio/effects_02.mp3'; // calma + isla + completion
        return null;
    };
```

- [ ] **Step 15.6: Add consent state refs and navigation helpers**

Find the block with `const sessionIdRef = useRef<string | null>(null);` (around line 150). Immediately below it, add:

```tsx
    // ── Parental consent (VPC, COPPA) ──
    const consentTokenRef = useRef<string | null>(null);
    const [consentCtx, setConsentCtx] = useState<{ token: string; adultData: AdultData } | null>(null);
```

- [ ] **Step 15.7: Update the `advance` helper to skip the waiting screen for age ≥ 13**

Find the existing `advance` helper (around line 356). It currently reads:

```tsx
    const advance = () => {
        const nextIdx = screenIndex + 1;
        try { startAudioIfNeeded(nextIdx); } catch (e) { console.warn('[audio] startAudio error:', e); }
        try { startEffectIfNeeded(nextIdx); } catch (e) { console.warn('[audio] startEffect error:', e); }
        setScreenIndex(i => Math.min(i + 1, SCREENS.length - 1));
        // [...any trailing logic — leave as-is]
    };
```

Replace **only the `setScreenIndex` line** with logic that skips the waiting screen when there's no pending consent:

```tsx
        setScreenIndex(i => {
            let next = Math.min(i + 1, SCREENS.length - 1);
            // Skip the parental-consent-waiting screen unless a token is pending
            if (SCREENS[next]?.type === 'parental-consent-waiting' && !consentCtx) {
                next = Math.min(next + 1, SCREENS.length - 1);
            }
            return next;
        });
```

Leave the audio-startup calls (`startAudioIfNeeded`, `startEffectIfNeeded`) and anything after the `setScreenIndex` call unchanged. Do **not** wrap the helper in `useCallback` — that changes its closure semantics and is out of scope for this task.

- [ ] **Step 15.8: Update the `adult-registration` screen render**

Find the block rendering the `AdultRegistration` screen (around line 700). Replace it with:

```tsx
                {screen.type === 'adult-registration' && (
                    <AdultRegistration
                        key="adult-reg"
                        userEmail={userEmail}
                        flowType={tenantId ? 'tenant' : oneLinkId ? 'one' : 'auth'}
                        tenantId={tenantId}
                        oneLinkId={oneLinkId}
                        onComplete={data => { setAdultData(data); advance(); }}
                        onConsentRequired={({ token, adultData: data }) => {
                            setAdultData(data);
                            setConsentCtx({ token, adultData: data });
                            advance();
                        }}
                    />
                )}
```

- [ ] **Step 15.9: Add the `parental-consent-waiting` screen render**

Immediately below the `adult-registration` block, add:

```tsx
                {screen.type === 'parental-consent-waiting' && consentCtx && (
                    <ParentalConsentWaiting
                        key="consent-wait"
                        token={consentCtx.token}
                        childName={consentCtx.adultData.nombreNino}
                        adultEmail={consentCtx.adultData.email}
                        resendInput={{
                            adultData: consentCtx.adultData,
                            flowType: tenantId ? 'tenant' : oneLinkId ? 'one' : 'auth',
                            tenantId,
                            oneLinkId,
                            lang,
                        }}
                        onConfirmed={(tok) => {
                            consentTokenRef.current = tok;
                            advance();
                        }}
                        onCancel={() => {
                            // Return to the registration form
                            setConsentCtx(null);
                            consentTokenRef.current = null;
                            setScreenIndex(i => Math.max(0, i - 1));
                        }}
                    />
                )}
```

- [ ] **Step 15.10: Forward consent token into the startSession call**

Find the `useEffect` that calls `startSession` (around line 177). Update the call to forward the consent token:

```tsx
    useEffect(() => {
        if (screenIndex !== ODYSSEY_START || !adultData || sessionIdRef.current || startingSessionRef.current) return;
        startingSessionRef.current = true;
        startSession({
            adultData,
            tenantId,
            lang,
            consentToken: consentTokenRef.current ?? undefined,
        }).then(result => {
            if (result.ok && result.id) {
                sessionIdRef.current = result.id;
                console.info('[session] Started session created:', result.id);
            } else {
                console.warn('[session] Failed to create started session:', result.error);
            }
        }).finally(() => { startingSessionRef.current = false; });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [screenIndex]);
```

- [ ] **Step 15.11: Verify build passes**

Run: `npm run lint && npm run build`
Expected: **No errors.** The AdultRegistration props from Task 14 are now satisfied.

- [ ] **Step 15.12: Commit**

```bash
git add src/components/onboarding/OnboardingFlowV2.tsx
git commit -m "feat(onboarding): insert parental consent waiting screen

Adds new 'parental-consent-waiting' screen between adult
registration and device handoff. Skipped when child_age>=13.
Forwards consent token into startSession for the COPPA gate
in /api/session."
```

---

## Task 16: Manual QA checklist (rollout gate)

**Files:** none (manual verification)

This task does not modify code. It is the gate between merging to `develop` and merging to `main`.

- [ ] **Step 16.1: Run the build and lint one more time**

```bash
npm run lint && npm run build
```

Expected: Clean.

- [ ] **Step 16.2: Push to `develop` for Vercel preview**

```bash
git push origin develop
```

Wait for Vercel to deploy the preview URL.

- [ ] **Step 16.3: Set `SITE_URL` on the preview environment (one-time)**

In Vercel project settings, make sure the preview environment has `SITE_URL` set to the preview URL (e.g. `https://argo-method-git-develop-*.vercel.app`). If not set, the email link will point to `argomethod.com` which breaks preview testing.

**Alternative:** temporarily hardcode the preview URL in `api/request-consent.ts` Step 3.1's `siteUrl` fallback and revert before merging.

- [ ] **Step 16.4: Execute the QA matrix**

Walk through each of these cases on the preview URL and verify the behavior. Mark each with ✅ or ❌.

| # | Flow | Age | Expected |
|---|---|---|---|
| 1 | `/app` (auth) | 10 | Form → waiting screen → email → click link → waiting advances → odyssey runs to completion → session appears in Supabase with `parental_consents.consumed_at` set. |
| 2 | `/app` (auth) | 14 | Form → device handoff (skips waiting) → odyssey runs. `parental_consents` row is NOT created. |
| 3 | `/play/:slug` (tenant) | 9 | Same as #1 but with tenant_id set on the consent row and on the session. |
| 4 | `/play/:slug` (tenant) | 15 | Same as #2 but with tenant_id set on the session. |
| 5 | `/one/:slug` (Argo One) | 8 | Same as #1 but with one_link_id set. Verify `one-complete` still marks the link as completed. |
| 6 | Same-device confirmation | 10 | Parent opens email in same browser, clicks link, sees success page, returns to original tab — waiting screen has already advanced (polling). |
| 7 | Other-device confirmation | 10 | Parent uses phone to click link from desktop session, desktop tab advances within 5s. |
| 8 | Double-click email link | 10 | Landing shows success on both clicks; no DB error. |
| 9 | Expired link | 10 | Manually set `expires_at` in the DB to a past timestamp, click link, expect expired state. |
| 10 | Bypass attempt | 10 | POST `/api/session` directly with `action=start`, `child_age=10`, no `consent_token` → expect `403 consent_required`. |
| 11 | Consent mismatch | 10 | Use a valid confirmed token, then POST `/api/session` with a different `child_name` → expect `403 consent_mismatch`. |
| 12 | Reuse consumed token | 10 | Use a token that already created a session, try again → expect `403 consent_already_used`. |
| 13 | ES copy | 10 | Spanish flow → email subject and body in Spanish, no COPPA mention. |
| 14 | EN copy | 10 | English flow → email subject and body in English, COPPA explicitly mentioned. |
| 15 | PT copy | 10 | Portuguese flow → email subject and body in Portuguese, no COPPA mention. |
| 16 | Resend button | 10 | Click resend → new token issued (verify in DB) → cooldown locks button for 60s. |
| 17 | Cancel (Change email) | 10 | Click "Change email" → returns to form → previous consent row remains `pending` and will expire. |
| 18 | Refresh during wait | 10 | Hard refresh the waiting screen → screen restores from `argo_consent_recovery` localStorage slot and resumes polling. (Note: this behavior requires wiring the recovery slot in OnboardingFlowV2 — if it was deferred, refresh returns the user to Language Select; document the gap.) |

- [ ] **Step 16.5: Address any ❌ by iterating on the relevant task**

If any case fails, return to the relevant task in this plan, fix, commit, redeploy, and re-verify. Do not proceed to main until every case passes.

- [ ] **Step 16.6: Merge to `main` after user approval**

Only after the full QA matrix is green AND the user explicitly approves, open a PR from `develop` to `main`. Do not auto-merge.

---

## Notes on refresh recovery (Task 18 follow-up)

The `getConsentRecovery` / `saveConsentRecovery` helpers from Task 9 are defined but not yet wired into `OnboardingFlowV2.tsx`. This is intentional: the waiting screen works without refresh recovery for the majority case, and wiring it in OnboardingFlowV2 requires touching the `getRecoverableSession` mount effect. If QA case #18 fails and the user wants to fix it, add:

1. In `AdultRegistration.handleSubmit()` (Task 14) after `onConsentRequired` fires, also call `saveConsentRecovery({ token: result.token, adultData, flowType, tenantId, oneLinkId, lang })`.
2. In `OnboardingFlowV2.tsx` mount effect, check `getConsentRecovery()` alongside `getRecoverableSession()`. If a recovery row exists and `checkConsentStatus(row.token)` returns `pending`, restore `consentCtx` and jump `screenIndex` to the `parental-consent-waiting` index.
3. Clear `consentRecovery` on `onConfirmed` and `onCancel`.

This is scoped as a follow-up because the base behavior ships without it and the user explicitly scoped recovery as "nice-to-have".
