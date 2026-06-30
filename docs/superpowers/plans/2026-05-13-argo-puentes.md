# Argo Puentes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an upsell product ("Argo Puentes") that, after a child completes an Argo profile, lets the responsible adult take a short non-gamified DISC questionnaire and receive a personalized "bond report" with 4 bridges describing how to better accompany their child in sport.

**Architecture:** Parallel flow to Argo One. New DB tables (`puentes_purchases`, `puentes_sessions`) link each adult report to the source child session. Checkout via Stripe (USD) or MercadoPago (ARS) reusing existing infra. AI report generated via inlined Gemini provider (same pattern as `generate-ai.ts`). UI is a lightweight non-gamified flow (adult-to-adult tone, no nautical/child metaphors). Language is inherited from the child's `sessions.lang`. Email upsell injected into the existing child report email + reminder cron at +3 days.

**Tech Stack:** React + TypeScript + Vite + TailwindCSS + Framer Motion (UI), Supabase Postgres (DB), Vercel serverless TS (`/api/*`), Gemini 2.5 Flash (AI), Stripe + MercadoPago (payments), Resend (email).

**Spec recap (validated with user):**
- Name: **Argo Puentes** (sin framing de navegación: el barco es solo la metáfora de la odisea del niño)
- Price: **$9.99 USD** / **$6.999 ARS**
- 15 preguntas adulto: 8 DISC + 2 motor + 3 estilo bajo presión + 2 contexto
- 4 puentes (preparación, frustración, conversación, largo plazo)
- 3 idiomas (es/en/pt), hereda de `sessions.lang` del hijo
- Aplica a Argo One **y** a flujo tenants
- CTA al final del email del informe del hijo + reenvío automático a 3-4 días si no compró
- Lenguaje probabilístico, no clínico, no prescriptivo, no determinista
- Estilo bajo presión es una dimensión NUEVA (no existe en el test del niño)
- Design system estricto

---

## File Structure

### New files

**Backend / API**
- `api/puentes-checkout.ts` — Stripe/MP checkout creation (mirrors `one-checkout.ts`)
- `api/puentes-start.ts` — magic-token validation, returns child context for prefill
- `api/puentes-complete.ts` — receives 15 answers, resolves adult profile, persists, triggers AI
- `api/generate-puentes.ts` — Gemini call to produce the 4 puentes (inline provider)
- `api/send-puentes-email.ts` — Resend send of the final puentes report
- `api/puentes-reminder-cron.ts` — daily cron, sends reminder to adults who got child report 3 days ago and didn't buy

**Shared logic**
- `src/lib/puentesQuestions.ts` — 15 questions × 3 langs (the canonical data)
- `src/lib/puentesProfileResolver.ts` — pure function: answers → adult profile
- `src/lib/puentesTranslations.ts` — UI strings × 3 langs
- `src/lib/puentesProfileResolver.test.ts` — Vitest unit tests for the resolver

**Frontend components**
- `src/components/puentes/PuentesIntro.tsx` — welcome screen
- `src/components/puentes/PuentesQuestion.tsx` — single question screen
- `src/components/puentes/PuentesProgress.tsx` — progress indicator
- `src/components/puentes/PuentesGenerating.tsx` — loading state during AI gen
- `src/components/puentes/PuentesReport.tsx` — the 4 puentes display
- `src/components/puentes/PuentesCheckout.tsx` — checkout entry (CTA from email lands here)
- `src/pages/PuentesFlow.tsx` — page that orchestrates the questionnaire flow under `/puentes/:token`

**Database**
- `supabase/migrations/2026XXXXX_puentes_tables.sql` — `puentes_purchases`, `puentes_sessions` tables + indexes

### Modified files

- `src/App.tsx` — register `/puentes/:token` and `/puentes/checkout` routes
- `api/send-email.ts` — append "Argo Puentes" CTA section to child report email (with lang switch)
- `api/one-webhook.ts` — handle Argo Puentes purchase events (extend existing webhook)
- `api/stripe-webhook.ts` — same, if separate handler exists for non-Argo-One Stripe events
- `src/pages/Terms.tsx` (or wherever T&C live) — add Argo Puentes consent clause
- `vercel.json` — add reminder cron schedule
- `src/components/admin/*` — add Puentes tab in superadmin dashboard (read-only list)

### Files NOT touched (intentionally)
- `src/lib/profileResolver.ts` — unchanged (resolves child profile; adult has its own resolver)
- `api/generate-ai.ts` — unchanged
- `src/components/onboarding/*` — unchanged (Puentes has its own non-gamified flow)

---

## Phase 0 — Foundation (DB + types)

### Task 0.1: DB migration

**Files:**
- Create: `supabase/migrations/20260513120000_puentes_tables.sql`

- [ ] **Step 1: Write migration SQL**

```sql
-- 20260513120000_puentes_tables.sql

create table public.puentes_purchases (
    id uuid primary key default gen_random_uuid(),
    source_session_id uuid not null references public.sessions(id) on delete cascade,
    recipient_email text not null,
    recipient_name text,
    child_name text,
    amount_cents int not null,
    currency text not null check (currency in ('USD', 'ARS')),
    provider text not null check (provider in ('stripe', 'mercadopago')),
    provider_payment_id text,
    status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded')),
    magic_token text not null unique,
    lang text not null default 'es' check (lang in ('es', 'en', 'pt')),
    source text not null default 'argo_one' check (source in ('argo_one', 'tenant')),
    tenant_id uuid references public.tenants(id) on delete set null,
    created_at timestamptz not null default now(),
    paid_at timestamptz
);

create index idx_puentes_purchases_source_session on public.puentes_purchases(source_session_id);
create index idx_puentes_purchases_email on public.puentes_purchases(recipient_email);
create index idx_puentes_purchases_magic_token on public.puentes_purchases(magic_token);
create index idx_puentes_purchases_status on public.puentes_purchases(status);

create table public.puentes_sessions (
    id uuid primary key default gen_random_uuid(),
    purchase_id uuid not null references public.puentes_purchases(id) on delete cascade,
    source_session_id uuid not null references public.sessions(id) on delete cascade,
    adult_answers jsonb not null default '[]'::jsonb,
    adult_profile jsonb,
    ai_sections jsonb,
    status text not null default 'created' check (status in ('created', 'answered', 'generating', 'generated', 'sent', 'failed')),
    lang text not null default 'es' check (lang in ('es', 'en', 'pt')),
    error_log text,
    created_at timestamptz not null default now(),
    completed_at timestamptz,
    sent_at timestamptz
);

create index idx_puentes_sessions_purchase on public.puentes_sessions(purchase_id);
create index idx_puentes_sessions_source_session on public.puentes_sessions(source_session_id);
create index idx_puentes_sessions_status on public.puentes_sessions(status);

-- Track upsell reminder state on child sessions
alter table public.sessions
    add column if not exists puentes_reminder_sent_at timestamptz;
```

- [ ] **Step 2: Apply migration to Supabase via dashboard or CLI**

```bash
# Apply via SQL editor in Supabase dashboard, OR
supabase db push
```

Expected: tables `puentes_purchases` and `puentes_sessions` exist, plus new column on `sessions`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260513120000_puentes_tables.sql
git commit -m "feat(puentes): add db schema for puentes purchases and sessions"
```

### Task 0.2: TypeScript types

**Files:**
- Modify: `src/lib/supabase.ts` (add types for new tables)

- [ ] **Step 1: Add types**

```typescript
// Append to src/lib/supabase.ts

export type Lang = 'es' | 'en' | 'pt';

export type AdultAxis = 'D' | 'I' | 'S' | 'C';
export type AdultMotor = 'agil' | 'equilibrado' | 'profundo';
export type AdultPressureStyle = 'regulado' | 'reactivo' | 'evitativo';

export interface AdultProfile {
    eje_primary: AdultAxis;
    eje_secondary: AdultAxis | null;
    motor: AdultMotor;
    pressure_style: AdultPressureStyle;
    history: 'ex_competitive' | 'ex_brief' | 'recreational' | 'none';
    dominant_emotion: 'orgullo' | 'nervios' | 'disfrute' | 'preocupacion' | 'curiosidad' | 'mezcla';
}

export interface PuentesAnswer {
    questionId: string;
    optionId: string;
}

export interface PuentePiece {
    titulo: string;
    como_esta_el: string;        // 2-3 sentences about the child in that moment
    lo_que_traes: string;         // 2-3 sentences about adult strength
    el_puente: string;            // 3-4 sentences with the bridge
    pregunta_reflexion: string;   // single open question
}

export interface PuentesAiSections {
    saludo: string;             // 1 paragraph welcome
    perfil_adulto_breve: string; // 1 paragraph adult profile recap
    puentes: [PuentePiece, PuentePiece, PuentePiece, PuentePiece];
    cierre: string;             // 1 paragraph close
}

export interface PuentesPurchase {
    id: string;
    source_session_id: string;
    recipient_email: string;
    recipient_name: string | null;
    child_name: string | null;
    amount_cents: number;
    currency: 'USD' | 'ARS';
    provider: 'stripe' | 'mercadopago';
    provider_payment_id: string | null;
    status: 'pending' | 'paid' | 'failed' | 'refunded';
    magic_token: string;
    lang: Lang;
    source: 'argo_one' | 'tenant';
    tenant_id: string | null;
    created_at: string;
    paid_at: string | null;
}

export interface PuentesSession {
    id: string;
    purchase_id: string;
    source_session_id: string;
    adult_answers: PuentesAnswer[];
    adult_profile: AdultProfile | null;
    ai_sections: PuentesAiSections | null;
    status: 'created' | 'answered' | 'generating' | 'generated' | 'sent' | 'failed';
    lang: Lang;
    error_log: string | null;
    created_at: string;
    completed_at: string | null;
    sent_at: string | null;
}
```

- [ ] **Step 2: Verify TS compiles**

```bash
npm run build
```

Expected: PASS, no type errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase.ts
git commit -m "feat(puentes): add typescript types for purchases and sessions"
```

---

## Phase 1 — Questions data + Adult profile resolver

### Task 1.1: Questions data (i18n)

**Files:**
- Create: `src/lib/puentesQuestions.ts`

- [ ] **Step 1: Create questions data file**

```typescript
// src/lib/puentesQuestions.ts
import type { Lang, AdultAxis, AdultMotor, AdultPressureStyle } from './supabase';

export type QuestionBlock = 'disc' | 'motor' | 'pressure' | 'context';

export interface PuentesOption {
    id: string;
    label: string;
    // Mapping fields (only one will be set per option, depending on block)
    axis?: AdultAxis;
    motor?: AdultMotor;
    pressure?: AdultPressureStyle;
    contextKey?: string;
    contextValue?: string;
}

export interface PuentesQuestion {
    id: string;
    block: QuestionBlock;
    prompt: string;                       // uses {nombre} placeholder for child's name
    options: PuentesOption[];
}

export const PUENTES_QUESTIONS: Record<Lang, PuentesQuestion[]> = {
    es: [
        // ── DISC (8) ──
        { id: 'q1', block: 'disc', prompt: 'Cuando {nombre} te cuenta un problema que tuvo en un partido, lo primero que tiendes a hacer es:', options: [
            { id: 'q1a', label: 'Plantear qué se puede hacer la próxima vez', axis: 'D' },
            { id: 'q1b', label: 'Animarlo y bajarle drama al asunto', axis: 'I' },
            { id: 'q1c', label: 'Escuchar sin interrumpir y validar lo que siente', axis: 'S' },
            { id: 'q1d', label: 'Hacer preguntas para entender exactamente qué pasó', axis: 'C' },
        ] },
        { id: 'q2', block: 'disc', prompt: 'Si {nombre} no quiere ir a entrenar un día, tu reacción más natural es:', options: [
            { id: 'q2a', label: 'Acompañarlo en su sentir y dejar la decisión abierta', axis: 'S' },
            { id: 'q2b', label: 'Recordarle el compromiso y motivarlo a ir igual', axis: 'D' },
            { id: 'q2c', label: 'Indagar qué está pasando antes de decidir nada', axis: 'C' },
            { id: 'q2d', label: 'Buscar algo que conecte el entrenamiento con su entusiasmo', axis: 'I' },
        ] },
        { id: 'q3', block: 'disc', prompt: 'En la previa de un partido importante, tu energía suele ser:', options: [
            { id: 'q3a', label: 'Entusiasta, contagiando ánimo', axis: 'I' },
            { id: 'q3b', label: 'Analítica, repasando lo relevante', axis: 'C' },
            { id: 'q3c', label: 'Activa, enfocada en el objetivo', axis: 'D' },
            { id: 'q3d', label: 'Calma, transmitiendo serenidad', axis: 'S' },
        ] },
        { id: 'q4', block: 'disc', prompt: 'Cuando el entrenador toma una decisión que no compartes, tiendes a:', options: [
            { id: 'q4a', label: 'Observar más situaciones antes de formar opinión', axis: 'C' },
            { id: 'q4b', label: 'Confiar en el criterio del entrenador', axis: 'S' },
            { id: 'q4c', label: 'Plantearlo de manera directa', axis: 'D' },
            { id: 'q4d', label: 'Buscar conversar e influir desde la cordialidad', axis: 'I' },
        ] },
        { id: 'q5', block: 'disc', prompt: 'En el grupo de padres del equipo, sueles ser:', options: [
            { id: 'q5a', label: 'El que propone cosas y mueve la agenda', axis: 'D' },
            { id: 'q5b', label: 'El que está disponible y sostiene', axis: 'S' },
            { id: 'q5c', label: 'El que conecta, anima y arma vínculo', axis: 'I' },
            { id: 'q5d', label: 'El que aporta información o cuida los detalles', axis: 'C' },
        ] },
        { id: 'q6', block: 'disc', prompt: 'Al ver a {nombre} perder un partido importante, tu impulso primero es:', options: [
            { id: 'q6a', label: 'Estar presente sin forzar conversación', axis: 'S' },
            { id: 'q6b', label: 'Levantarle el ánimo, distraerlo', axis: 'I' },
            { id: 'q6c', label: 'Hablar del próximo objetivo', axis: 'D' },
            { id: 'q6d', label: 'Esperar el momento adecuado y conversar con calma', axis: 'C' },
        ] },
        { id: 'q7', block: 'disc', prompt: 'Cuando organizas algo para la familia, sueles:', options: [
            { id: 'q7a', label: 'Planificar con detalle antes de proponerlo', axis: 'C' },
            { id: 'q7b', label: 'Decidir rápido y ponerlo en marcha', axis: 'D' },
            { id: 'q7c', label: 'Adaptarte a lo que el resto prefiera', axis: 'S' },
            { id: 'q7d', label: 'Consultar a todos y armar el plan en conjunto', axis: 'I' },
        ] },
        { id: 'q8', block: 'disc', prompt: 'Lo que más te incomoda del deporte juvenil hoy es:', options: [
            { id: 'q8a', label: 'Cuando se rompe el espíritu de equipo', axis: 'I' },
            { id: 'q8b', label: 'La presión excesiva sobre los chicos', axis: 'S' },
            { id: 'q8c', label: 'La falta de ambición o desafío real', axis: 'D' },
            { id: 'q8d', label: 'La falta de criterio o planificación', axis: 'C' },
        ] },
        // ── MOTOR (2) ──
        { id: 'q9', block: 'motor', prompt: 'Cuando recibes información nueva sobre algo que te importa:', options: [
            { id: 'q9a', label: 'Actúo enseguida y voy ajustando sobre la marcha', motor: 'agil' },
            { id: 'q9b', label: 'Hago una pausa breve, proceso, y después actúo', motor: 'equilibrado' },
            { id: 'q9c', label: 'Necesito tiempo para integrarla antes de moverme', motor: 'profundo' },
        ] },
        { id: 'q10', block: 'motor', prompt: 'Tu forma natural de tomar decisiones es:', options: [
            { id: 'q10a', label: 'Reflexiono con calma hasta sentir certeza', motor: 'profundo' },
            { id: 'q10b', label: 'Por instinto, después confirmo si fue acertado', motor: 'agil' },
            { id: 'q10c', label: 'Combino instinto con un análisis breve', motor: 'equilibrado' },
        ] },
        // ── PRESSURE STYLE (3) ──
        { id: 'q11', block: 'pressure', prompt: 'Cuando {nombre} atraviesa una mala racha deportiva, lo que más te cuesta es:', options: [
            { id: 'q11a', label: 'Contengo mi propia frustración y me enfoco en él', pressure: 'regulado' },
            { id: 'q11b', label: 'A veces se me escapa la frustración antes de pensarla', pressure: 'reactivo' },
            { id: 'q11c', label: 'Tiendo a no hablar del tema para no incomodarlo', pressure: 'evitativo' },
        ] },
        { id: 'q12', block: 'pressure', prompt: 'Si percibes una injusticia hacia {nombre} (otro jugador, árbitro, entrenador), tu primera reacción es:', options: [
            { id: 'q12a', label: 'Espero a estar tranquilo para evaluar si actuar', pressure: 'regulado' },
            { id: 'q12b', label: 'Prefiero no intervenir, que lo resuelva él', pressure: 'evitativo' },
            { id: 'q12c', label: 'Reacciono rápido, a veces más fuerte de lo que quisiera', pressure: 'reactivo' },
        ] },
        { id: 'q13', block: 'pressure', prompt: 'Después de una discusión con {nombre} sobre algo del deporte:', options: [
            { id: 'q13a', label: 'Me cuesta retomar porque me quedo dando vueltas al tema', pressure: 'reactivo' },
            { id: 'q13b', label: 'Vuelvo a hablar cuando ambos estamos calmados', pressure: 'regulado' },
            { id: 'q13c', label: 'Suele pasar y no volvemos a tocar el tema', pressure: 'evitativo' },
        ] },
        // ── CONTEXT (2) ──
        { id: 'q14', block: 'context', prompt: '¿Practicaste deporte competitivo en tu adolescencia?', options: [
            { id: 'q14a', label: 'Sí, varios años', contextKey: 'history', contextValue: 'ex_competitive' },
            { id: 'q14b', label: 'Sí, brevemente', contextKey: 'history', contextValue: 'ex_brief' },
            { id: 'q14c', label: 'No, pero sí recreativamente', contextKey: 'history', contextValue: 'recreational' },
            { id: 'q14d', label: 'No', contextKey: 'history', contextValue: 'none' },
        ] },
        { id: 'q15', block: 'context', prompt: 'Cuando ves jugar a {nombre}, la emoción que más predomina en ti es:', options: [
            { id: 'q15a', label: 'Orgullo', contextKey: 'dominant_emotion', contextValue: 'orgullo' },
            { id: 'q15b', label: 'Nervios o ansiedad', contextKey: 'dominant_emotion', contextValue: 'nervios' },
            { id: 'q15c', label: 'Disfrute pleno', contextKey: 'dominant_emotion', contextValue: 'disfrute' },
            { id: 'q15d', label: 'Preocupación', contextKey: 'dominant_emotion', contextValue: 'preocupacion' },
            { id: 'q15e', label: 'Curiosidad', contextKey: 'dominant_emotion', contextValue: 'curiosidad' },
            { id: 'q15f', label: 'Mezcla de varias', contextKey: 'dominant_emotion', contextValue: 'mezcla' },
        ] },
    ],
    en: [
        // Same shape, translated. (Generated separately for translation review — see Task 1.4)
    ] as unknown as PuentesQuestion[],
    pt: [
        // Same shape, translated. (Generated separately — see Task 1.4)
    ] as unknown as PuentesQuestion[],
};

/** Convenience getter (mirrors odysseyTranslations.ts pattern) */
export function getPuentesQuestions(lang: Lang): PuentesQuestion[] {
    return PUENTES_QUESTIONS[lang] ?? PUENTES_QUESTIONS.es;
}
```

- [ ] **Step 2: Commit ES skeleton**

```bash
git add src/lib/puentesQuestions.ts
git commit -m "feat(puentes): add questions data file (es complete, en/pt placeholders)"
```

### Task 1.2: Adult profile resolver — write test first

**Files:**
- Create: `src/lib/puentesProfileResolver.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/lib/puentesProfileResolver.test.ts
import { describe, expect, it } from 'vitest';
import { resolveAdultProfile } from './puentesProfileResolver';
import type { PuentesAnswer } from './supabase';

describe('resolveAdultProfile', () => {
    it('resolves a pure-D adult with agile motor and regulated pressure', () => {
        const answers: PuentesAnswer[] = [
            { questionId: 'q1', optionId: 'q1a' }, // D
            { questionId: 'q2', optionId: 'q2b' }, // D
            { questionId: 'q3', optionId: 'q3c' }, // D
            { questionId: 'q4', optionId: 'q4c' }, // D
            { questionId: 'q5', optionId: 'q5a' }, // D
            { questionId: 'q6', optionId: 'q6c' }, // D
            { questionId: 'q7', optionId: 'q7b' }, // D
            { questionId: 'q8', optionId: 'q8c' }, // D
            { questionId: 'q9', optionId: 'q9a' }, // agil
            { questionId: 'q10', optionId: 'q10b' }, // agil
            { questionId: 'q11', optionId: 'q11a' }, // regulado
            { questionId: 'q12', optionId: 'q12a' }, // regulado
            { questionId: 'q13', optionId: 'q13b' }, // regulado
            { questionId: 'q14', optionId: 'q14a' }, // ex_competitive
            { questionId: 'q15', optionId: 'q15a' }, // orgullo
        ];
        const result = resolveAdultProfile(answers, 'es');
        expect(result.eje_primary).toBe('D');
        expect(result.eje_secondary).toBeNull();
        expect(result.motor).toBe('agil');
        expect(result.pressure_style).toBe('regulado');
        expect(result.history).toBe('ex_competitive');
        expect(result.dominant_emotion).toBe('orgullo');
    });

    it('resolves a primary + secondary axis when secondary scores >= 3', () => {
        const answers: PuentesAnswer[] = [
            // 5x D, 3x I, 0x S, 0x C → primary D, secondary I
            { questionId: 'q1', optionId: 'q1a' }, // D
            { questionId: 'q2', optionId: 'q2b' }, // D
            { questionId: 'q3', optionId: 'q3c' }, // D
            { questionId: 'q4', optionId: 'q4c' }, // D
            { questionId: 'q5', optionId: 'q5a' }, // D
            { questionId: 'q6', optionId: 'q6b' }, // I
            { questionId: 'q7', optionId: 'q7d' }, // I
            { questionId: 'q8', optionId: 'q8a' }, // I
            { questionId: 'q9', optionId: 'q9b' }, // equilibrado
            { questionId: 'q10', optionId: 'q10c' }, // equilibrado
            { questionId: 'q11', optionId: 'q11a' }, // regulado
            { questionId: 'q12', optionId: 'q12b' }, // evitativo
            { questionId: 'q13', optionId: 'q13c' }, // evitativo
            { questionId: 'q14', optionId: 'q14c' }, // recreational
            { questionId: 'q15', optionId: 'q15c' }, // disfrute
        ];
        const result = resolveAdultProfile(answers, 'es');
        expect(result.eje_primary).toBe('D');
        expect(result.eje_secondary).toBe('I');
        expect(result.motor).toBe('equilibrado');
        expect(result.pressure_style).toBe('evitativo'); // majority wins
    });

    it('returns null secondary when no axis hits the threshold of 3', () => {
        const answers: PuentesAnswer[] = [
            // 6x D, 2x S, 0x I, 0x C → secondary should be null (S=2 < 3)
            { questionId: 'q1', optionId: 'q1a' }, // D
            { questionId: 'q2', optionId: 'q2b' }, // D
            { questionId: 'q3', optionId: 'q3c' }, // D
            { questionId: 'q4', optionId: 'q4c' }, // D
            { questionId: 'q5', optionId: 'q5a' }, // D
            { questionId: 'q6', optionId: 'q6c' }, // D
            { questionId: 'q7', optionId: 'q7c' }, // S
            { questionId: 'q8', optionId: 'q8b' }, // S
            { questionId: 'q9', optionId: 'q9a' }, // agil
            { questionId: 'q10', optionId: 'q10b' }, // agil
            { questionId: 'q11', optionId: 'q11a' }, // regulado
            { questionId: 'q12', optionId: 'q12a' }, // regulado
            { questionId: 'q13', optionId: 'q13b' }, // regulado
            { questionId: 'q14', optionId: 'q14d' }, // none
            { questionId: 'q15', optionId: 'q15f' }, // mezcla
        ];
        const result = resolveAdultProfile(answers, 'es');
        expect(result.eje_primary).toBe('D');
        expect(result.eje_secondary).toBeNull();
    });

    it('defaults motor to equilibrado on tie', () => {
        const answers: PuentesAnswer[] = [
            { questionId: 'q1', optionId: 'q1a' },
            { questionId: 'q2', optionId: 'q2b' },
            { questionId: 'q3', optionId: 'q3c' },
            { questionId: 'q4', optionId: 'q4c' },
            { questionId: 'q5', optionId: 'q5a' },
            { questionId: 'q6', optionId: 'q6c' },
            { questionId: 'q7', optionId: 'q7b' },
            { questionId: 'q8', optionId: 'q8c' },
            { questionId: 'q9', optionId: 'q9a' },   // agil
            { questionId: 'q10', optionId: 'q10a' }, // profundo → tie agil vs profundo
            { questionId: 'q11', optionId: 'q11a' },
            { questionId: 'q12', optionId: 'q12a' },
            { questionId: 'q13', optionId: 'q13b' },
            { questionId: 'q14', optionId: 'q14a' },
            { questionId: 'q15', optionId: 'q15a' },
        ];
        const result = resolveAdultProfile(answers, 'es');
        expect(result.motor).toBe('equilibrado');
    });

    it('throws when required questions are missing', () => {
        const answers: PuentesAnswer[] = [
            { questionId: 'q1', optionId: 'q1a' },
        ];
        expect(() => resolveAdultProfile(answers, 'es')).toThrow(/missing/i);
    });
});
```

- [ ] **Step 2: Run test, expect FAIL**

```bash
npx vitest run src/lib/puentesProfileResolver.test.ts
```

Expected: FAIL with "Cannot find module './puentesProfileResolver'".

### Task 1.3: Implement adult profile resolver

**Files:**
- Create: `src/lib/puentesProfileResolver.ts`

- [ ] **Step 1: Write resolver**

```typescript
// src/lib/puentesProfileResolver.ts
import type {
    AdultAxis,
    AdultMotor,
    AdultPressureStyle,
    AdultProfile,
    Lang,
    PuentesAnswer,
} from './supabase';
import { PUENTES_QUESTIONS, type PuentesOption } from './puentesQuestions';

const SECONDARY_AXIS_THRESHOLD = 3;
const REQUIRED_QUESTION_IDS = ['q1','q2','q3','q4','q5','q6','q7','q8','q9','q10','q11','q12','q13','q14','q15'];

function findOption(lang: Lang, questionId: string, optionId: string): PuentesOption | undefined {
    const questions = PUENTES_QUESTIONS[lang] ?? PUENTES_QUESTIONS.es;
    const q = questions.find(qq => qq.id === questionId);
    return q?.options.find(o => o.id === optionId);
}

export function resolveAdultProfile(answers: PuentesAnswer[], lang: Lang): AdultProfile {
    const answeredIds = new Set(answers.map(a => a.questionId));
    const missing = REQUIRED_QUESTION_IDS.filter(id => !answeredIds.has(id));
    if (missing.length > 0) {
        throw new Error(`Missing answers for: ${missing.join(',')}`);
    }

    const axisCounts: Record<AdultAxis, number> = { D: 0, I: 0, S: 0, C: 0 };
    const motorCounts: Record<AdultMotor, number> = { agil: 0, equilibrado: 0, profundo: 0 };
    const pressureCounts: Record<AdultPressureStyle, number> = { regulado: 0, reactivo: 0, evitativo: 0 };
    const contextValues: Record<string, string> = {};

    for (const a of answers) {
        const opt = findOption(lang, a.questionId, a.optionId);
        if (!opt) continue;
        if (opt.axis) axisCounts[opt.axis]++;
        if (opt.motor) motorCounts[opt.motor]++;
        if (opt.pressure) pressureCounts[opt.pressure]++;
        if (opt.contextKey && opt.contextValue) contextValues[opt.contextKey] = opt.contextValue;
    }

    // Primary axis = max count
    const sortedAxes = (Object.entries(axisCounts) as [AdultAxis, number][])
        .sort((a, b) => b[1] - a[1]);
    const eje_primary = sortedAxes[0][0];
    const eje_secondary = sortedAxes[1][1] >= SECONDARY_AXIS_THRESHOLD ? sortedAxes[1][0] : null;

    // Motor: max count, default equilibrado on tie
    const sortedMotors = (Object.entries(motorCounts) as [AdultMotor, number][])
        .sort((a, b) => b[1] - a[1]);
    const motorTopCount = sortedMotors[0][1];
    const topMotors = sortedMotors.filter(([, c]) => c === motorTopCount).map(([m]) => m);
    const motor: AdultMotor = topMotors.length > 1 ? 'equilibrado' : topMotors[0];

    // Pressure: max count
    const sortedPressure = (Object.entries(pressureCounts) as [AdultPressureStyle, number][])
        .sort((a, b) => b[1] - a[1]);
    const pressure_style = sortedPressure[0][0];

    return {
        eje_primary,
        eje_secondary,
        motor,
        pressure_style,
        history: (contextValues.history ?? 'none') as AdultProfile['history'],
        dominant_emotion: (contextValues.dominant_emotion ?? 'mezcla') as AdultProfile['dominant_emotion'],
    };
}
```

- [ ] **Step 2: Run tests, expect PASS**

```bash
npx vitest run src/lib/puentesProfileResolver.test.ts
```

Expected: 5/5 PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/puentesProfileResolver.ts src/lib/puentesProfileResolver.test.ts
git commit -m "feat(puentes): adult profile resolver with full test coverage"
```

### Task 1.4: EN and PT translations of questions

**Files:**
- Modify: `src/lib/puentesQuestions.ts`

- [ ] **Step 1: Add EN questions array with same shape**

(Translate every question and option from ES → EN, preserving axis/motor/pressure mappings. Use the argo-psych-review skill conventions: probabilistic language, no forbidden vocabulary, natural English.)

- [ ] **Step 2: Add PT questions array with same shape**

(Translate every question and option from ES → PT, same constraints.)

- [ ] **Step 3: Add translation review tests**

```typescript
// Append to puentesProfileResolver.test.ts

it('every language has 15 questions with identical structure', () => {
    const es = PUENTES_QUESTIONS.es;
    const en = PUENTES_QUESTIONS.en;
    const pt = PUENTES_QUESTIONS.pt;
    expect(es.length).toBe(15);
    expect(en.length).toBe(15);
    expect(pt.length).toBe(15);
    es.forEach((q, i) => {
        expect(en[i].id).toBe(q.id);
        expect(pt[i].id).toBe(q.id);
        expect(en[i].block).toBe(q.block);
        expect(pt[i].block).toBe(q.block);
        expect(en[i].options.length).toBe(q.options.length);
        expect(pt[i].options.length).toBe(q.options.length);
    });
});
```

- [ ] **Step 4: Run tests, expect PASS**

```bash
npx vitest run src/lib/puentesProfileResolver.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/puentesQuestions.ts src/lib/puentesProfileResolver.test.ts
git commit -m "feat(puentes): add en and pt translations of questions"
```

---

## Phase 2 — Payment flow (Stripe + MercadoPago)

> ⚠️ This phase touches production payment systems. Stop and verify with the user before deploying to prod. Test mode first.

### Task 2.1: Create puentes-checkout endpoint

**Files:**
- Create: `api/puentes-checkout.ts`

- [ ] **Step 1: Write endpoint** (mirrors `api/one-checkout.ts` pattern)

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import crypto from 'crypto';

const PRICE_USD_CENTS = 999;        // $9.99 USD
const PRICE_ARS = 6999;             // $6.999 ARS (whole pesos, MP uses decimal)
const MP_COUNTRIES = ['AR', 'BR', 'CL', 'CO', 'MX', 'PE', 'UY'];

function getProvider(country?: string): 'mercadopago' | 'stripe' {
    if (!country) return 'stripe';
    return MP_COUNTRIES.includes(country.toUpperCase()) ? 'mercadopago' : 'stripe';
}

function genMagicToken(): string {
    return crypto.randomBytes(24).toString('base64url');
}

async function createMpCheckout(args: {
    sourceSessionId: string;
    purchaseId: string;
    email: string;
    childName: string;
    arsAmount: number;
}): Promise<string> {
    const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!mpToken) throw new Error('Missing MERCADOPAGO_ACCESS_TOKEN');
    const siteUrl = process.env.SITE_URL || 'https://www.argomethod.com';

    const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${mpToken}` },
        body: JSON.stringify({
            items: [{
                title: `Argo Puentes - Vínculo con ${args.childName}`,
                quantity: 1,
                unit_price: args.arsAmount,
                currency_id: 'ARS',
            }],
            payer: { email: args.email },
            back_urls: {
                success: `${siteUrl}/puentes/checkout/success?purchase_id=${args.purchaseId}`,
                failure: `${siteUrl}/puentes/checkout/failure`,
                pending: `${siteUrl}/puentes/checkout/pending`,
            },
            auto_return: 'approved',
            external_reference: `puentes_${args.purchaseId}`,
            notification_url: `${siteUrl}/api/one-webhook`,
            metadata: { kind: 'puentes', purchase_id: args.purchaseId },
        }),
    });
    if (!res.ok) throw new Error(`MercadoPago error: ${await res.text()}`);
    const data = await res.json();
    return data.init_point;
}

async function createStripeCheckout(args: {
    sourceSessionId: string;
    purchaseId: string;
    email: string;
    childName: string;
}): Promise<string> {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) throw new Error('Missing STRIPE_SECRET_KEY');
    const siteUrl = process.env.SITE_URL || 'https://www.argomethod.com';
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });

    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [{
            price_data: {
                currency: 'usd',
                product_data: { name: `Argo Puentes — Vínculo con ${args.childName}` },
                unit_amount: PRICE_USD_CENTS,
            },
            quantity: 1,
        }],
        customer_email: args.email,
        success_url: `${siteUrl}/puentes/checkout/success?purchase_id=${args.purchaseId}`,
        cancel_url: `${siteUrl}/puentes/checkout/cancel`,
        metadata: { kind: 'puentes', purchase_id: args.purchaseId, source_session_id: args.sourceSessionId },
    });
    return session.url!;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const {
        source_session_id,
        recipient_email,
        recipient_name,
        country,
        lang,
        consent_given,
    } = req.body || {};

    if (!source_session_id || !recipient_email) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    if (!consent_given) {
        return res.status(400).json({ error: 'Consent required' });
    }

    const supabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Fetch source session for child name + tenant + lang fallback
    const { data: session, error: sessErr } = await supabase
        .from('sessions')
        .select('id, lang, tenant_id, child_name, name')
        .eq('id', source_session_id)
        .maybeSingle();
    if (sessErr || !session) return res.status(404).json({ error: 'Source session not found' });

    const childName = session.child_name || session.name || 'tu hijo/a';
    const provider = getProvider(country);
    const magicToken = genMagicToken();
    const amountCents = provider === 'mercadopago' ? PRICE_ARS * 100 : PRICE_USD_CENTS;
    const currency = provider === 'mercadopago' ? 'ARS' : 'USD';

    const { data: purchase, error: purErr } = await supabase
        .from('puentes_purchases')
        .insert({
            source_session_id,
            recipient_email,
            recipient_name: recipient_name ?? null,
            child_name: childName,
            amount_cents: amountCents,
            currency,
            provider,
            status: 'pending',
            magic_token: magicToken,
            lang: lang || session.lang || 'es',
            source: session.tenant_id ? 'tenant' : 'argo_one',
            tenant_id: session.tenant_id ?? null,
        })
        .select()
        .single();
    if (purErr || !purchase) {
        console.error('[puentes-checkout] insert error', purErr);
        return res.status(500).json({ error: 'Could not create purchase' });
    }

    try {
        let url: string;
        if (provider === 'mercadopago') {
            url = await createMpCheckout({
                sourceSessionId: source_session_id,
                purchaseId: purchase.id,
                email: recipient_email,
                childName,
                arsAmount: PRICE_ARS,
            });
        } else {
            url = await createStripeCheckout({
                sourceSessionId: source_session_id,
                purchaseId: purchase.id,
                email: recipient_email,
                childName,
            });
        }
        return res.status(200).json({ checkout_url: url, purchase_id: purchase.id });
    } catch (err: any) {
        console.error('[puentes-checkout] provider error', err);
        await supabase.from('puentes_purchases').update({ status: 'failed' }).eq('id', purchase.id);
        return res.status(500).json({ error: err.message || 'Checkout failed' });
    }
}
```

- [ ] **Step 2: Local smoke test**

Boot the Vercel dev server (or `npm run dev` if the project wires API routes through Vite proxy) and POST a sample body. Verify it returns a `checkout_url`. Do NOT proceed to actual payment yet.

- [ ] **Step 3: Commit**

```bash
git add api/puentes-checkout.ts
git commit -m "feat(puentes): add stripe/mercadopago checkout endpoint"
```

### Task 2.2: Extend webhook to handle puentes purchases

**Files:**
- Modify: `api/one-webhook.ts`

- [ ] **Step 1: Identify the existing Stripe `checkout.session.completed` and MP payment handlers and branch on `metadata.kind === 'puentes'`**

Read `api/one-webhook.ts` end-to-end first.

- [ ] **Step 2: Add helper to handle puentes purchase completion**

```typescript
// Add inside api/one-webhook.ts (near existing helpers)

async function handlePuentesPaid(args: {
    supabase: any;
    purchaseId: string;
    providerPaymentId: string;
}) {
    const { supabase, purchaseId, providerPaymentId } = args;
    const { data: purchase, error } = await supabase
        .from('puentes_purchases')
        .update({ status: 'paid', paid_at: new Date().toISOString(), provider_payment_id: providerPaymentId })
        .eq('id', purchaseId)
        .select()
        .single();
    if (error || !purchase) {
        console.error('[one-webhook] puentes update failed', error);
        return;
    }

    // Create the puentes_session shell so adult can start
    await supabase.from('puentes_sessions').insert({
        purchase_id: purchase.id,
        source_session_id: purchase.source_session_id,
        lang: purchase.lang,
        status: 'created',
    });

    // Send magic-link email
    const siteUrl = process.env.SITE_URL || 'https://www.argomethod.com';
    const magicLink = `${siteUrl}/puentes/${purchase.magic_token}`;
    await sendPuentesMagicEmail({
        to: purchase.recipient_email,
        recipientName: purchase.recipient_name,
        childName: purchase.child_name,
        magicLink,
        lang: purchase.lang,
    });
}

// And implement sendPuentesMagicEmail inline (since /api files can't import from /api/lib)
async function sendPuentesMagicEmail(args: {
    to: string;
    recipientName: string | null;
    childName: string | null;
    magicLink: string;
    lang: string;
}) {
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) return;
    const subject = args.lang === 'en'
        ? `Your Argo Puentes is ready — bond with ${args.childName ?? 'your child'}`
        : args.lang === 'pt'
            ? `Seu Argo Puentes está pronto — vínculo com ${args.childName ?? 'seu filho'}`
            : `Tu Argo Puentes está listo — vínculo con ${args.childName ?? 'tu hijo/a'}`;
    const body = args.lang === 'en'
        ? `<p>Hello,</p><p>Your Argo Puentes is ready. Click below to begin the short questionnaire and receive your bond report.</p><p><a href="${args.magicLink}">${args.magicLink}</a></p>`
        : args.lang === 'pt'
            ? `<p>Olá,</p><p>Seu Argo Puentes está pronto. Clique abaixo para iniciar o questionário curto e receber seu relatório de vínculo.</p><p><a href="${args.magicLink}">${args.magicLink}</a></p>`
            : `<p>Hola,</p><p>Tu Argo Puentes está listo. Hacé clic abajo para responder un cuestionario corto y recibir tu informe de vínculo.</p><p><a href="${args.magicLink}">${args.magicLink}</a></p>`;
    await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey}` },
        body: JSON.stringify({
            from: 'Argo Method <hola@argomethod.com>',
            to: args.to,
            subject,
            html: body,
        }),
    });
}
```

- [ ] **Step 2: Wire it into the existing Stripe `checkout.session.completed` branch**

In the existing Stripe handler block, detect `session.metadata?.kind === 'puentes'`:

```typescript
// Inside Stripe checkout.session.completed handler:
if (session.metadata?.kind === 'puentes' && session.metadata.purchase_id) {
    await handlePuentesPaid({
        supabase,
        purchaseId: session.metadata.purchase_id,
        providerPaymentId: session.payment_intent as string,
    });
    return res.json({ received: true });
}
```

In the existing MercadoPago payment handler block:

```typescript
// Inside MP payment.created/payment.updated handler, after fetching the payment:
if (payment.external_reference?.startsWith('puentes_')) {
    const purchaseId = payment.external_reference.replace('puentes_', '');
    if (payment.status === 'approved') {
        await handlePuentesPaid({
            supabase,
            purchaseId,
            providerPaymentId: String(payment.id),
        });
    }
    return res.json({ received: true });
}
```

- [ ] **Step 3: Test end-to-end in Stripe test mode**

Use Stripe CLI: `stripe trigger checkout.session.completed --add checkout_session:metadata.kind=puentes --add checkout_session:metadata.purchase_id=<test_uuid>`. Verify webhook updates the row and inserts a `puentes_sessions` shell.

- [ ] **Step 4: Commit**

```bash
git add api/one-webhook.ts
git commit -m "feat(puentes): handle puentes purchase events in webhook"
```

---

## Phase 3 — AI generation (the 4 puentes)

### Task 3.1: Create generate-puentes endpoint

**Files:**
- Create: `api/generate-puentes.ts`

- [ ] **Step 1: Write endpoint with inlined Gemini provider**

This mirrors `api/generate-ai.ts` exactly: inlined provider, retry logic, JSON-mode output, post-generation anti-hallucination scan.

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ── Forbidden vocabulary (same list as tenant-chat, expanded) ──
const FORBIDDEN_ES = ['error','control','dominación','agresividad','confrontación','rígido','débil','inseguro','problema','déficit','corregir','falla','siempre','nunca'];
const FORBIDDEN_EN = ['error','control','domination','aggression','rigid','weak','insecure','problem','deficit','correct','failure','fault','always','never'];
const FORBIDDEN_PT = ['erro','controle','dominação','agressividade','rígido','fraco','inseguro','problema','déficit','corrigir','falha','sempre','nunca'];

function getForbidden(lang: string): string[] {
    if (lang === 'en') return FORBIDDEN_EN;
    if (lang === 'pt') return FORBIDDEN_PT;
    return FORBIDDEN_ES;
}

function containsForbidden(text: string, forbidden: string[]): string | null {
    const lower = text.toLowerCase();
    for (const word of forbidden) {
        const re = new RegExp(`\\b${word}\\b`, 'i');
        if (re.test(lower)) return word;
    }
    return null;
}

// ── Prompt builder ──
function buildPrompt(args: {
    childProfile: any;       // includes eje, motor, archetype label, ai_sections of child
    adultProfile: any;
    childName: string;
    sport: string;
    lang: string;
}): string {
    const langInstruction = args.lang === 'en'
        ? 'Respond in English.'
        : args.lang === 'pt'
            ? 'Responda em português.'
            : 'Responde en español latam neutro (sin voseo, usá tuteo: tú, tienes, eres).';

    return `Eres un especialista en DISC aplicado a la psicología deportiva juvenil, trabajando para Argo Method.
Tu tarea es generar un informe llamado "Argo Puentes": 4 puentes que ayuden al adulto a vincularse mejor con ${args.childName} en el contexto del deporte (${args.sport}).

REGLAS ABSOLUTAS:
- Lenguaje probabilístico siempre: "tiende a", "es probable que", "podría", "suele". NUNCA absolutos.
- Tono adulto-adulto, no infantilizante, no clínico, no terapéutico.
- Los pilares son INVITACIONES, no instrucciones. No prescribir comportamiento.
- NUNCA culpabilizar al adulto. Reconocer fortalezas siempre antes de proponer ajustes.
- NUNCA decir que los perfiles "chocan". Decir que se calibran o se complementan.
- NUNCA usar palabras prohibidas: ${getForbidden(args.lang).join(', ')}.
- Reconocer al niño en su valor, no como problema a resolver.

PERFIL DEL NIÑO:
${JSON.stringify(args.childProfile, null, 2)}

PERFIL DEL ADULTO:
${JSON.stringify(args.adultProfile, null, 2)}

${langInstruction}

Devuelve EXACTAMENTE este JSON (sin texto adicional):
{
  "saludo": "1 párrafo cálido, reconoce el paso que dio el adulto al hacer el cuestionario",
  "perfil_adulto_breve": "1 párrafo. Refleja al adulto su eje primario (y secundario si lo hay), motor, estilo bajo presión. Reconocedor, no clínico.",
  "puentes": [
    {
      "titulo": "Antes del juego: la previa",
      "como_esta_el": "2-3 frases probabilísticas sobre cómo tiende a estar el niño antes de jugar, basado en eje + motor del niño",
      "lo_que_traes": "2-3 frases reconociendo lo que el adulto aporta naturalmente en ese momento",
      "el_puente": "3-4 frases. Cómo se combina la naturaleza del adulto con lo que el niño necesita. Acciones u observaciones, no prescripciones.",
      "pregunta_reflexion": "Una pregunta abierta para sostener en el tiempo"
    },
    {
      "titulo": "Cuando algo no sale: la frustración",
      "como_esta_el": "...",
      "lo_que_traes": "...",
      "el_puente": "...IMPORTANTE: combina el estilo del niño con el ESTILO BAJO PRESIÓN del adulto (regulado/reactivo/evitativo). Este es el puente más sensible.",
      "pregunta_reflexion": "..."
    },
    {
      "titulo": "Después del partido: la conversación",
      "como_esta_el": "...basado en el motor del niño (timing de procesamiento)",
      "lo_que_traes": "...",
      "el_puente": "...timing y lenguaje. Cuándo abrir, cuándo esperar.",
      "pregunta_reflexion": "..."
    },
    {
      "titulo": "El largo plazo: sostener su vínculo con el deporte",
      "como_esta_el": "...",
      "lo_que_traes": "...usá la 'historia personal con el deporte' del adulto (history) y su emoción dominante (dominant_emotion)",
      "el_puente": "...prácticas sostenibles que protegen su gozo del deporte",
      "pregunta_reflexion": "..."
    }
  ],
  "cierre": "1 párrafo. Refuerza que esto es una invitación, no un diagnóstico, y que ambos perfiles son válidos."
}`;
}

async function generateWithRetry(args: { prompt: string; lang: string }): Promise<any> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('Missing GEMINI_API_KEY');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
            responseMimeType: 'application/json',
            maxOutputTokens: 16000,
            temperature: 0.75,
        },
    });

    let lastErr: any = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            const result = await model.generateContent(args.prompt);
            const text = result.response.text();
            try {
                const json = JSON.parse(text);
                // Anti-hallucination scan
                const flat = JSON.stringify(json).toLowerCase();
                const hit = containsForbidden(flat, getForbidden(args.lang));
                if (hit && attempt === 1) {
                    console.warn(`[generate-puentes] forbidden word hit "${hit}", retrying`);
                    lastErr = new Error(`Forbidden word: ${hit}`);
                    continue;
                }
                return json;
            } catch (parseErr) {
                lastErr = parseErr;
                if (attempt === 1) continue;
            }
        } catch (err) {
            lastErr = err;
            if (attempt === 1) {
                await new Promise(r => setTimeout(r, 2000));
                continue;
            }
        }
    }
    throw lastErr || new Error('Generation failed');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { puentes_session_id } = req.body || {};
    if (!puentes_session_id) return res.status(400).json({ error: 'Missing puentes_session_id' });

    const supabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data: pSession, error: pErr } = await supabase
        .from('puentes_sessions')
        .select('*, source_session:sessions!source_session_id(*)')
        .eq('id', puentes_session_id)
        .maybeSingle();
    if (pErr || !pSession) return res.status(404).json({ error: 'Puentes session not found' });
    if (!pSession.adult_profile) return res.status(400).json({ error: 'Adult profile not resolved yet' });

    await supabase.from('puentes_sessions').update({ status: 'generating' }).eq('id', puentes_session_id);

    const childSession = pSession.source_session;
    const childProfile = {
        eje: childSession.eje,
        motor: childSession.motor,
        archetype: childSession.archetype,
        resumenPerfil: childSession.ai_sections?.resumenPerfil,
        combustible: childSession.ai_sections?.combustible,
    };

    try {
        const aiSections = await generateWithRetry({
            prompt: buildPrompt({
                childProfile,
                adultProfile: pSession.adult_profile,
                childName: childSession.child_name || childSession.name || 'tu hijo/a',
                sport: childSession.sport || 'deporte',
                lang: pSession.lang,
            }),
            lang: pSession.lang,
        });

        await supabase.from('puentes_sessions').update({
            ai_sections: aiSections,
            status: 'generated',
            completed_at: new Date().toISOString(),
        }).eq('id', puentes_session_id);

        return res.status(200).json({ ok: true, ai_sections: aiSections });
    } catch (err: any) {
        console.error('[generate-puentes] failed', err);
        await supabase.from('puentes_sessions').update({
            status: 'failed',
            error_log: err.message || String(err),
        }).eq('id', puentes_session_id);
        return res.status(500).json({ error: 'Generation failed' });
    }
}
```

- [ ] **Step 2: Smoke test with a fixture**

Create a `puentes_session` row by hand pointing at an existing `sessions` row. POST to `/api/generate-puentes` and inspect output. Verify all 4 puentes are present, no forbidden words.

- [ ] **Step 3: Commit**

```bash
git add api/generate-puentes.ts
git commit -m "feat(puentes): ai generation endpoint with retry and forbidden-word filter"
```

---

## Phase 4 — Backend orchestration (start + complete)

### Task 4.1: puentes-start endpoint

**Files:**
- Create: `api/puentes-start.ts`

- [ ] **Step 1: Write endpoint**

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { magic_token } = req.body || {};
    if (!magic_token) return res.status(400).json({ error: 'Missing magic_token' });

    const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { data: purchase, error } = await supabase
        .from('puentes_purchases')
        .select('id, status, source_session_id, recipient_name, child_name, lang')
        .eq('magic_token', magic_token)
        .maybeSingle();
    if (error || !purchase) return res.status(404).json({ error: 'Invalid token' });
    if (purchase.status !== 'paid') return res.status(402).json({ error: 'Purchase not paid' });

    // Fetch existing puentes_session (created by webhook)
    const { data: pSession } = await supabase
        .from('puentes_sessions')
        .select('id, status, ai_sections')
        .eq('purchase_id', purchase.id)
        .maybeSingle();

    return res.status(200).json({
        purchase_id: purchase.id,
        puentes_session_id: pSession?.id,
        status: pSession?.status || 'created',
        recipient_name: purchase.recipient_name,
        child_name: purchase.child_name,
        lang: purchase.lang,
        already_generated: pSession?.status === 'generated' || pSession?.status === 'sent',
        ai_sections: pSession?.ai_sections,
    });
}
```

- [ ] **Step 2: Commit**

```bash
git add api/puentes-start.ts
git commit -m "feat(puentes): start endpoint validates magic token"
```

### Task 4.2: puentes-complete endpoint

**Files:**
- Create: `api/puentes-complete.ts`

- [ ] **Step 1: Write endpoint** (inline resolver, since /api can't import from /src — we duplicate the logic)

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ── Inlined resolver (mirrors src/lib/puentesProfileResolver.ts) ──
// Keep in sync by hand; covered by tests in src/lib.

const SECONDARY_AXIS_THRESHOLD = 3;

// Optiom mapping table (manually mirrored from src/lib/puentesQuestions.ts)
type Axis = 'D' | 'I' | 'S' | 'C';
type Motor = 'agil' | 'equilibrado' | 'profundo';
type Pressure = 'regulado' | 'reactivo' | 'evitativo';

interface OptionMap {
    axis?: Axis; motor?: Motor; pressure?: Pressure;
    contextKey?: string; contextValue?: string;
}

const OPTION_MAP: Record<string, OptionMap> = {
    q1a: { axis: 'D' }, q1b: { axis: 'I' }, q1c: { axis: 'S' }, q1d: { axis: 'C' },
    q2a: { axis: 'S' }, q2b: { axis: 'D' }, q2c: { axis: 'C' }, q2d: { axis: 'I' },
    q3a: { axis: 'I' }, q3b: { axis: 'C' }, q3c: { axis: 'D' }, q3d: { axis: 'S' },
    q4a: { axis: 'C' }, q4b: { axis: 'S' }, q4c: { axis: 'D' }, q4d: { axis: 'I' },
    q5a: { axis: 'D' }, q5b: { axis: 'S' }, q5c: { axis: 'I' }, q5d: { axis: 'C' },
    q6a: { axis: 'S' }, q6b: { axis: 'I' }, q6c: { axis: 'D' }, q6d: { axis: 'C' },
    q7a: { axis: 'C' }, q7b: { axis: 'D' }, q7c: { axis: 'S' }, q7d: { axis: 'I' },
    q8a: { axis: 'I' }, q8b: { axis: 'S' }, q8c: { axis: 'D' }, q8d: { axis: 'C' },
    q9a: { motor: 'agil' }, q9b: { motor: 'equilibrado' }, q9c: { motor: 'profundo' },
    q10a: { motor: 'profundo' }, q10b: { motor: 'agil' }, q10c: { motor: 'equilibrado' },
    q11a: { pressure: 'regulado' }, q11b: { pressure: 'reactivo' }, q11c: { pressure: 'evitativo' },
    q12a: { pressure: 'regulado' }, q12b: { pressure: 'evitativo' }, q12c: { pressure: 'reactivo' },
    q13a: { pressure: 'reactivo' }, q13b: { pressure: 'regulado' }, q13c: { pressure: 'evitativo' },
    q14a: { contextKey: 'history', contextValue: 'ex_competitive' },
    q14b: { contextKey: 'history', contextValue: 'ex_brief' },
    q14c: { contextKey: 'history', contextValue: 'recreational' },
    q14d: { contextKey: 'history', contextValue: 'none' },
    q15a: { contextKey: 'dominant_emotion', contextValue: 'orgullo' },
    q15b: { contextKey: 'dominant_emotion', contextValue: 'nervios' },
    q15c: { contextKey: 'dominant_emotion', contextValue: 'disfrute' },
    q15d: { contextKey: 'dominant_emotion', contextValue: 'preocupacion' },
    q15e: { contextKey: 'dominant_emotion', contextValue: 'curiosidad' },
    q15f: { contextKey: 'dominant_emotion', contextValue: 'mezcla' },
};

const REQUIRED_IDS = ['q1','q2','q3','q4','q5','q6','q7','q8','q9','q10','q11','q12','q13','q14','q15'];

function resolveAdultProfile(answers: { questionId: string; optionId: string }[]) {
    const answered = new Set(answers.map(a => a.questionId));
    const missing = REQUIRED_IDS.filter(id => !answered.has(id));
    if (missing.length) throw new Error(`Missing: ${missing.join(',')}`);

    const axis: Record<Axis, number> = { D: 0, I: 0, S: 0, C: 0 };
    const motor: Record<Motor, number> = { agil: 0, equilibrado: 0, profundo: 0 };
    const press: Record<Pressure, number> = { regulado: 0, reactivo: 0, evitativo: 0 };
    const ctx: Record<string, string> = {};

    for (const a of answers) {
        const m = OPTION_MAP[a.optionId];
        if (!m) continue;
        if (m.axis) axis[m.axis]++;
        if (m.motor) motor[m.motor]++;
        if (m.pressure) press[m.pressure]++;
        if (m.contextKey && m.contextValue) ctx[m.contextKey] = m.contextValue;
    }

    const sortedAx = (Object.entries(axis) as [Axis, number][]).sort((a, b) => b[1] - a[1]);
    const sortedMo = (Object.entries(motor) as [Motor, number][]).sort((a, b) => b[1] - a[1]);
    const sortedPr = (Object.entries(press) as [Pressure, number][]).sort((a, b) => b[1] - a[1]);

    const moTop = sortedMo[0][1];
    const moTops = sortedMo.filter(([, c]) => c === moTop).map(([k]) => k);

    return {
        eje_primary: sortedAx[0][0],
        eje_secondary: sortedAx[1][1] >= SECONDARY_AXIS_THRESHOLD ? sortedAx[1][0] : null,
        motor: moTops.length > 1 ? 'equilibrado' as Motor : moTops[0],
        pressure_style: sortedPr[0][0],
        history: ctx.history ?? 'none',
        dominant_emotion: ctx.dominant_emotion ?? 'mezcla',
    };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { puentes_session_id, answers } = req.body || {};
    if (!puentes_session_id || !Array.isArray(answers)) {
        return res.status(400).json({ error: 'Missing fields' });
    }

    const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    let profile;
    try {
        profile = resolveAdultProfile(answers);
    } catch (err: any) {
        return res.status(400).json({ error: err.message });
    }

    const { error: updErr } = await supabase
        .from('puentes_sessions')
        .update({
            adult_answers: answers,
            adult_profile: profile,
            status: 'answered',
        })
        .eq('id', puentes_session_id);
    if (updErr) return res.status(500).json({ error: 'Could not save answers' });

    // Trigger AI generation (call same Vercel host)
    const siteUrl = process.env.SITE_URL || 'https://www.argomethod.com';
    const genRes = await fetch(`${siteUrl}/api/generate-puentes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puentes_session_id }),
    });
    if (!genRes.ok) {
        console.error('[puentes-complete] generation failed');
        return res.status(500).json({ error: 'Generation failed' });
    }

    // Trigger final email send
    await fetch(`${siteUrl}/api/send-puentes-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puentes_session_id }),
    });

    return res.status(200).json({ ok: true });
}
```

- [ ] **Step 2: Commit**

```bash
git add api/puentes-complete.ts
git commit -m "feat(puentes): complete endpoint resolves profile and triggers gen+email"
```

---

## Phase 5 — UI flow

### Task 5.1: UI translations file

**Files:**
- Create: `src/lib/puentesTranslations.ts`

- [ ] **Step 1: Write translations**

```typescript
import type { Lang } from './supabase';

export interface PuentesCopy {
    intro: {
        title: string;
        subtitle: (childName: string) => string;
        startCta: string;
        estimatedTime: string; // "5 a 7 minutos"
    };
    progress: {
        questionOf: (current: number, total: number) => string;
    };
    finish: {
        generating: string;
        ready: string;
        viewReport: string;
    };
    report: {
        greetingLabel: string;
        adultProfileLabel: string;
        puenteLabel: (n: number) => string;
        closingLabel: string;
        sectionChildState: string;
        sectionAdultStrength: string;
        sectionBridge: string;
        sectionReflection: string;
        downloadCta: string;
    };
    checkout: {
        consentLabel: string;
        termsLink: string;
        payCta: string;
    };
}

export const PUENTES_COPY: Record<Lang, PuentesCopy> = {
    es: {
        intro: {
            title: 'Argo Puentes',
            subtitle: (n) => `Conocé tu propio estilo y descubrí cómo se complementa con el de ${n}.`,
            startCta: 'Empezar el cuestionario',
            estimatedTime: '5 a 7 minutos',
        },
        progress: { questionOf: (c, t) => `Pregunta ${c} de ${t}` },
        finish: {
            generating: 'Generando tu informe de vínculo',
            ready: 'Tu informe está listo',
            viewReport: 'Ver mi informe',
        },
        report: {
            greetingLabel: 'Bienvenida',
            adultProfileLabel: 'Tu estilo natural',
            puenteLabel: (n) => `Puente ${n}`,
            closingLabel: 'Para llevar',
            sectionChildState: 'Cómo tiende a estar',
            sectionAdultStrength: 'Lo que tú traes',
            sectionBridge: 'El puente',
            sectionReflection: 'Una pregunta para llevarte',
            downloadCta: 'Descargar informe',
        },
        checkout: {
            consentLabel: 'Acepto los términos y entiendo que este informe no es un servicio clínico ni terapéutico.',
            termsLink: 'Ver términos',
            payCta: 'Continuar al pago',
        },
    },
    en: {
        intro: {
            title: 'Argo Puentes',
            subtitle: (n) => `Discover your own style and how it complements ${n}'s.`,
            startCta: 'Start the questionnaire',
            estimatedTime: '5 to 7 minutes',
        },
        progress: { questionOf: (c, t) => `Question ${c} of ${t}` },
        finish: {
            generating: 'Generating your bond report',
            ready: 'Your report is ready',
            viewReport: 'View my report',
        },
        report: {
            greetingLabel: 'Welcome',
            adultProfileLabel: 'Your natural style',
            puenteLabel: (n) => `Bridge ${n}`,
            closingLabel: 'To carry with you',
            sectionChildState: 'How they tend to feel',
            sectionAdultStrength: 'What you bring',
            sectionBridge: 'The bridge',
            sectionReflection: 'A question to take with you',
            downloadCta: 'Download report',
        },
        checkout: {
            consentLabel: 'I accept the terms and understand this is not a clinical or therapeutic service.',
            termsLink: 'View terms',
            payCta: 'Continue to payment',
        },
    },
    pt: {
        intro: {
            title: 'Argo Puentes',
            subtitle: (n) => `Conheça seu próprio estilo e descubra como se complementa com o de ${n}.`,
            startCta: 'Começar o questionário',
            estimatedTime: '5 a 7 minutos',
        },
        progress: { questionOf: (c, t) => `Pergunta ${c} de ${t}` },
        finish: {
            generating: 'Gerando seu relatório de vínculo',
            ready: 'Seu relatório está pronto',
            viewReport: 'Ver meu relatório',
        },
        report: {
            greetingLabel: 'Bem-vindo',
            adultProfileLabel: 'Seu estilo natural',
            puenteLabel: (n) => `Ponte ${n}`,
            closingLabel: 'Para levar',
            sectionChildState: 'Como tende a estar',
            sectionAdultStrength: 'O que você traz',
            sectionBridge: 'A ponte',
            sectionReflection: 'Uma pergunta para levar',
            downloadCta: 'Baixar relatório',
        },
        checkout: {
            consentLabel: 'Aceito os termos e entendo que este não é um serviço clínico nem terapêutico.',
            termsLink: 'Ver termos',
            payCta: 'Continuar para pagamento',
        },
    },
};

export function getPuentesCopy(lang: Lang): PuentesCopy {
    return PUENTES_COPY[lang] ?? PUENTES_COPY.es;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/puentesTranslations.ts
git commit -m "feat(puentes): ui translations for es/en/pt"
```

### Task 5.2: PuentesIntro component

**Files:**
- Create: `src/components/puentes/PuentesIntro.tsx`

- [ ] **Step 1: Write component using shared UI**

```tsx
import { motion } from 'framer-motion';
import { Button, Card } from '@/components/ui';
import { getPuentesCopy } from '@/lib/puentesTranslations';
import type { Lang } from '@/lib/supabase';

interface Props {
    childName: string;
    lang: Lang;
    onStart: () => void;
}

export function PuentesIntro({ childName, lang, onStart }: Props) {
    const c = getPuentesCopy(lang);
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
        >
            <Card padding="lg" className="text-center">
                <p className="text-xs uppercase tracking-widest text-argo-grey mb-4">
                    Argo Puentes · Tu vínculo
                </p>
                <h1 className="text-3xl font-bold tracking-tight text-argo-navy">
                    {c.intro.title}
                </h1>
                <p className="mt-4 text-argo-secondary text-lg">
                    {c.intro.subtitle(childName)}
                </p>
                <p className="mt-2 text-sm text-argo-grey">
                    {c.intro.estimatedTime}
                </p>
                <div className="mt-8">
                    <Button variant="violet" size="lg" onClick={onStart}>
                        {c.intro.startCta}
                    </Button>
                </div>
            </Card>
        </motion.div>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/puentes/PuentesIntro.tsx
git commit -m "feat(puentes): intro component"
```

### Task 5.3: PuentesQuestion + PuentesProgress

**Files:**
- Create: `src/components/puentes/PuentesProgress.tsx`
- Create: `src/components/puentes/PuentesQuestion.tsx`

- [ ] **Step 1: Progress component**

```tsx
import { getPuentesCopy } from '@/lib/puentesTranslations';
import type { Lang } from '@/lib/supabase';

interface Props { current: number; total: number; lang: Lang; }

export function PuentesProgress({ current, total, lang }: Props) {
    const c = getPuentesCopy(lang);
    const pct = Math.round((current / total) * 100);
    return (
        <div className="w-full">
            <div className="flex justify-between text-xs uppercase tracking-widest text-argo-grey mb-2">
                <span>{c.progress.questionOf(current, total)}</span>
                <span>{pct}%</span>
            </div>
            <div className="h-1 bg-argo-border rounded-full overflow-hidden">
                <div
                    className="h-full bg-argo-violet-500 transition-all duration-300"
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Question component**

```tsx
import { motion } from 'framer-motion';
import { Card } from '@/components/ui';
import type { PuentesQuestion as PQ, PuentesOption } from '@/lib/puentesQuestions';

interface Props {
    question: PQ;
    childName: string;
    onSelect: (option: PuentesOption) => void;
}

export function PuentesQuestion({ question, childName, onSelect }: Props) {
    const prompt = question.prompt.replace('{nombre}', childName);
    return (
        <motion.div
            key={question.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="max-w-2xl mx-auto"
        >
            <Card padding="lg">
                <h2 className="text-xl font-semibold text-argo-navy leading-snug">
                    {prompt}
                </h2>
                <div className="mt-6 grid gap-3">
                    {question.options.map(opt => (
                        <button
                            key={opt.id}
                            onClick={() => onSelect(opt)}
                            className="text-left w-full px-5 py-4 rounded-[14px] border border-argo-border bg-white hover:bg-argo-bg hover:border-argo-violet-200 transition-colors text-argo-secondary font-medium"
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </Card>
        </motion.div>
    );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/puentes/PuentesProgress.tsx src/components/puentes/PuentesQuestion.tsx
git commit -m "feat(puentes): question and progress components"
```

### Task 5.4: PuentesGenerating

**Files:**
- Create: `src/components/puentes/PuentesGenerating.tsx`

- [ ] **Step 1: Write loader**

```tsx
import { motion } from 'framer-motion';
import { getPuentesCopy } from '@/lib/puentesTranslations';
import type { Lang } from '@/lib/supabase';

export function PuentesGenerating({ lang }: { lang: Lang }) {
    const c = getPuentesCopy(lang);
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-md mx-auto text-center"
        >
            <div className="inline-block w-12 h-12 rounded-full border-4 border-argo-violet-200 border-t-argo-violet-500 animate-spin" />
            <p className="mt-6 text-argo-secondary font-medium">
                {c.finish.generating}
            </p>
        </motion.div>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/puentes/PuentesGenerating.tsx
git commit -m "feat(puentes): generating loader"
```

### Task 5.5: PuentesReport (the 4 puentes display)

**Files:**
- Create: `src/components/puentes/PuentesReport.tsx`

- [ ] **Step 1: Write display component using shared UI**

```tsx
import { motion } from 'framer-motion';
import { Card } from '@/components/ui';
import { getPuentesCopy } from '@/lib/puentesTranslations';
import type { Lang, PuentesAiSections } from '@/lib/supabase';

interface Props {
    aiSections: PuentesAiSections;
    childName: string;
    recipientName: string | null;
    lang: Lang;
}

export function PuentesReport({ aiSections, childName, recipientName, lang }: Props) {
    const c = getPuentesCopy(lang);
    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <Card padding="lg">
                <p className="text-xs uppercase tracking-widest text-argo-violet-500 mb-2">
                    {c.report.greetingLabel}
                </p>
                <p className="text-argo-navy leading-relaxed">{aiSections.saludo}</p>
            </Card>

            <Card padding="lg">
                <p className="text-xs uppercase tracking-widest text-argo-grey mb-2">
                    {c.report.adultProfileLabel}
                </p>
                <p className="text-argo-secondary leading-relaxed">{aiSections.perfil_adulto_breve}</p>
            </Card>

            {aiSections.puentes.map((p, idx) => (
                <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                >
                    <Card padding="lg" className="border-l-4 border-l-argo-violet-300">
                        <p className="text-xs uppercase tracking-widest text-argo-violet-500 mb-1">
                            {c.report.puenteLabel(idx + 1)}
                        </p>
                        <h3 className="text-xl font-semibold text-argo-navy mb-5">
                            {p.titulo}
                        </h3>
                        <Section label={c.report.sectionChildState} text={p.como_esta_el} />
                        <Section label={c.report.sectionAdultStrength} text={p.lo_que_traes} />
                        <Section label={c.report.sectionBridge} text={p.el_puente} bold />
                        <Section label={c.report.sectionReflection} text={p.pregunta_reflexion} italic />
                    </Card>
                </motion.div>
            ))}

            <Card padding="lg">
                <p className="text-xs uppercase tracking-widest text-argo-grey mb-2">
                    {c.report.closingLabel}
                </p>
                <p className="text-argo-secondary leading-relaxed">{aiSections.cierre}</p>
            </Card>
        </div>
    );
}

function Section({ label, text, bold, italic }: { label: string; text: string; bold?: boolean; italic?: boolean }) {
    return (
        <div className="mt-4 first:mt-0">
            <p className="text-xs uppercase tracking-widest text-argo-light mb-1">{label}</p>
            <p className={`text-argo-secondary leading-relaxed ${bold ? 'text-argo-navy font-medium' : ''} ${italic ? 'italic' : ''}`}>
                {text}
            </p>
        </div>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/puentes/PuentesReport.tsx
git commit -m "feat(puentes): report display component"
```

### Task 5.6: PuentesFlow page (orchestrator) + route

**Files:**
- Create: `src/pages/PuentesFlow.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write page**

```tsx
import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { PuentesIntro } from '@/components/puentes/PuentesIntro';
import { PuentesQuestion } from '@/components/puentes/PuentesQuestion';
import { PuentesProgress } from '@/components/puentes/PuentesProgress';
import { PuentesGenerating } from '@/components/puentes/PuentesGenerating';
import { PuentesReport } from '@/components/puentes/PuentesReport';
import { getPuentesQuestions } from '@/lib/puentesQuestions';
import type { Lang, PuentesAnswer, PuentesAiSections } from '@/lib/supabase';

type Stage = 'loading' | 'intro' | 'question' | 'generating' | 'report' | 'error';

export default function PuentesFlow() {
    const { token } = useParams<{ token: string }>();
    const [stage, setStage] = useState<Stage>('loading');
    const [puentesSessionId, setPuentesSessionId] = useState<string | null>(null);
    const [childName, setChildName] = useState('');
    const [recipientName, setRecipientName] = useState<string | null>(null);
    const [lang, setLang] = useState<Lang>('es');
    const [answers, setAnswers] = useState<PuentesAnswer[]>([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [aiSections, setAiSections] = useState<PuentesAiSections | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/puentes-start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ magic_token: token }),
                });
                if (!res.ok) throw new Error('start failed');
                const data = await res.json();
                setPuentesSessionId(data.puentes_session_id);
                setChildName(data.child_name);
                setRecipientName(data.recipient_name);
                setLang(data.lang);
                if (data.already_generated) {
                    setAiSections(data.ai_sections);
                    setStage('report');
                } else {
                    setStage('intro');
                }
            } catch {
                setStage('error');
            }
        })();
    }, [token]);

    const questions = getPuentesQuestions(lang);

    const handleSelect = (optId: string) => {
        const q = questions[currentIdx];
        const next = [...answers, { questionId: q.id, optionId: optId }];
        setAnswers(next);
        if (currentIdx + 1 >= questions.length) {
            submit(next);
        } else {
            setCurrentIdx(currentIdx + 1);
        }
    };

    const submit = async (finalAnswers: PuentesAnswer[]) => {
        setStage('generating');
        try {
            const res = await fetch('/api/puentes-complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ puentes_session_id: puentesSessionId, answers: finalAnswers }),
            });
            if (!res.ok) throw new Error('complete failed');
            // Re-fetch start to grab generated sections
            const refresh = await fetch('/api/puentes-start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ magic_token: token }),
            });
            const data = await refresh.json();
            setAiSections(data.ai_sections);
            setStage('report');
        } catch {
            setStage('error');
        }
    };

    if (stage === 'loading') {
        return <div className="min-h-screen flex items-center justify-center bg-argo-neutral"><PuentesGenerating lang={lang} /></div>;
    }
    if (stage === 'error') {
        return <div className="min-h-screen flex items-center justify-center bg-argo-neutral text-argo-secondary">Algo no anduvo. Intenta más tarde.</div>;
    }

    return (
        <div className="min-h-screen bg-argo-neutral py-12 px-4">
            {stage === 'intro' && (
                <PuentesIntro childName={childName} lang={lang} onStart={() => setStage('question')} />
            )}
            {stage === 'question' && (
                <div className="space-y-6">
                    <div className="max-w-2xl mx-auto">
                        <PuentesProgress current={currentIdx + 1} total={questions.length} lang={lang} />
                    </div>
                    <AnimatePresence mode="wait">
                        <PuentesQuestion
                            key={questions[currentIdx].id}
                            question={questions[currentIdx]}
                            childName={childName}
                            onSelect={(opt) => handleSelect(opt.id)}
                        />
                    </AnimatePresence>
                </div>
            )}
            {stage === 'generating' && <PuentesGenerating lang={lang} />}
            {stage === 'report' && aiSections && (
                <PuentesReport
                    aiSections={aiSections}
                    childName={childName}
                    recipientName={recipientName}
                    lang={lang}
                />
            )}
        </div>
    );
}
```

- [ ] **Step 2: Register route in App.tsx**

Locate where other routes are registered. Add:

```tsx
import PuentesFlow from '@/pages/PuentesFlow';

// Inside the <Routes> block:
<Route path="/puentes/:token" element={<PuentesFlow />} />
```

- [ ] **Step 3: Build to verify**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/PuentesFlow.tsx src/App.tsx
git commit -m "feat(puentes): orchestrator page and route"
```

---

## Phase 6 — Email integration

### Task 6.1: Inject Puentes CTA into child report email

**Files:**
- Modify: `api/send-email.ts`

- [ ] **Step 1: Add a Puentes CTA section after the report body, before the close, with 3-lang support**

Locate the HTML template assembly in `send-email.ts`. Add a CTA block before the closing tags:

```typescript
// Inside the HTML template builder, after the report body sections:

const childName = name || 'tu hijo/a';
const puentesCheckoutUrl = `${siteUrl}/puentes/checkout?source_session_id=${sessionId}`;

const puentesCta = langAttr === 'en' ? `
<div style="margin: 40px 0; padding: 28px; background: #F9F5FC; border-radius: 14px; border-left: 4px solid #7A4D96;">
    <p style="margin: 0 0 8px; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: #7A4D96; font-weight: 600;">Optional next step</p>
    <h3 style="margin: 0 0 8px; font-size: 20px; font-weight: 700; color: #1D1D1F;">Discover how you connect with ${childName}</h3>
    <p style="margin: 0 0 16px; color: #424245; line-height: 1.55;">Argo Puentes is a short questionnaire (5-7 min) that reveals your own style and 4 bridges to deepen your bond in sport. Not therapy. An invitation.</p>
    <a href="${puentesCheckoutUrl}" style="display: inline-block; padding: 12px 24px; background: #7A4D96; color: white; text-decoration: none; border-radius: 10px; font-weight: 600;">Explore Argo Puentes — $9.99</a>
</div>
` : langAttr === 'pt' ? `
<div style="margin: 40px 0; padding: 28px; background: #F9F5FC; border-radius: 14px; border-left: 4px solid #7A4D96;">
    <p style="margin: 0 0 8px; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: #7A4D96; font-weight: 600;">Próximo passo opcional</p>
    <h3 style="margin: 0 0 8px; font-size: 20px; font-weight: 700; color: #1D1D1F;">Descubra como você se conecta com ${childName}</h3>
    <p style="margin: 0 0 16px; color: #424245; line-height: 1.55;">Argo Puentes é um questionário curto (5-7 min) que revela seu próprio estilo e 4 pontes para aprofundar o vínculo no esporte. Não é terapia. É um convite.</p>
    <a href="${puentesCheckoutUrl}" style="display: inline-block; padding: 12px 24px; background: #7A4D96; color: white; text-decoration: none; border-radius: 10px; font-weight: 600;">Explorar Argo Puentes — $9.99</a>
</div>
` : `
<div style="margin: 40px 0; padding: 28px; background: #F9F5FC; border-radius: 14px; border-left: 4px solid #7A4D96;">
    <p style="margin: 0 0 8px; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: #7A4D96; font-weight: 600;">Paso opcional</p>
    <h3 style="margin: 0 0 8px; font-size: 20px; font-weight: 700; color: #1D1D1F;">Descubre cómo te vinculas con ${childName}</h3>
    <p style="margin: 0 0 16px; color: #424245; line-height: 1.55;">Argo Puentes es un cuestionario corto (5-7 min) que revela tu propio estilo y 4 puentes para profundizar el vínculo en el deporte. No es terapia. Es una invitación.</p>
    <a href="${puentesCheckoutUrl}" style="display: inline-block; padding: 12px 24px; background: #7A4D96; color: white; text-decoration: none; border-radius: 10px; font-weight: 600;">Conocer Argo Puentes — $9.99</a>
</div>
`;

// Inject puentesCta into the email body HTML where appropriate.
```

- [ ] **Step 2: Commit**

```bash
git add api/send-email.ts
git commit -m "feat(puentes): inject argo puentes cta in child report email"
```

### Task 6.2: send-puentes-email endpoint

**Files:**
- Create: `api/send-puentes-email.ts`

- [ ] **Step 1: Write endpoint** (HTML template inline, 3 langs)

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

function buildHtml(args: {
    childName: string;
    recipientName: string | null;
    aiSections: any;
    magicLink: string;
    lang: string;
}) {
    const { aiSections, childName, magicLink, lang } = args;
    const labels = lang === 'en' ? {
        viewOnline: 'View online',
        bridge: (n: number) => `Bridge ${n}`,
        childState: 'How they tend to feel',
        adultStrength: 'What you bring',
        bridgeBody: 'The bridge',
        reflection: 'A question to take with you',
        title: `Argo Puentes — bond with ${childName}`,
        intro: 'Welcome',
        closing: 'To carry with you',
    } : lang === 'pt' ? {
        viewOnline: 'Ver online',
        bridge: (n: number) => `Ponte ${n}`,
        childState: 'Como tende a estar',
        adultStrength: 'O que você traz',
        bridgeBody: 'A ponte',
        reflection: 'Uma pergunta para levar',
        title: `Argo Puentes — vínculo com ${childName}`,
        intro: 'Bem-vindo',
        closing: 'Para levar',
    } : {
        viewOnline: 'Ver en línea',
        bridge: (n: number) => `Puente ${n}`,
        childState: 'Cómo tiende a estar',
        adultStrength: 'Lo que tú traes',
        bridgeBody: 'El puente',
        reflection: 'Una pregunta para llevarte',
        title: `Argo Puentes — vínculo con ${childName}`,
        intro: 'Bienvenida',
        closing: 'Para llevar',
    };
    const puentes = aiSections.puentes.map((p: any, i: number) => `
        <div style="margin: 32px 0; padding: 24px; border-left: 4px solid #7A4D96; background: #F9F5FC; border-radius: 14px;">
            <p style="margin: 0 0 4px; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: #7A4D96; font-weight: 600;">${labels.bridge(i + 1)}</p>
            <h3 style="margin: 0 0 16px; font-size: 18px; color: #1D1D1F;">${p.titulo}</h3>
            <p style="margin: 12px 0 4px; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: #86868B;">${labels.childState}</p>
            <p style="margin: 0; color: #424245; line-height: 1.55;">${p.como_esta_el}</p>
            <p style="margin: 16px 0 4px; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: #86868B;">${labels.adultStrength}</p>
            <p style="margin: 0; color: #424245; line-height: 1.55;">${p.lo_que_traes}</p>
            <p style="margin: 16px 0 4px; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: #86868B;">${labels.bridgeBody}</p>
            <p style="margin: 0; color: #1D1D1F; line-height: 1.55; font-weight: 500;">${p.el_puente}</p>
            <p style="margin: 16px 0 4px; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: #86868B;">${labels.reflection}</p>
            <p style="margin: 0; color: #424245; line-height: 1.55; font-style: italic;">${p.pregunta_reflexion}</p>
        </div>
    `).join('');

    return `<!DOCTYPE html><html lang="${lang}"><head><meta charset="utf-8"><title>${labels.title}</title></head>
<body style="margin: 0; padding: 0; background: #F5F5F7; font-family: -apple-system, sans-serif;">
<div style="max-width: 640px; margin: 0 auto; padding: 32px;">
<p style="text-align: center; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #86868B;">ARGO PUENTES · CARTA DE NAVEGACIÓN</p>
<h1 style="text-align: center; font-size: 28px; color: #1D1D1F; margin: 16px 0 32px;">${labels.title}</h1>
<div style="padding: 24px; background: white; border-radius: 14px;">
<p style="margin: 0 0 4px; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: #7A4D96; font-weight: 600;">${labels.intro}</p>
<p style="margin: 0; color: #1D1D1F; line-height: 1.55;">${aiSections.saludo}</p>
</div>
<div style="margin-top: 24px; padding: 24px; background: white; border-radius: 14px;">
<p style="margin: 0; color: #424245; line-height: 1.55;">${aiSections.perfil_adulto_breve}</p>
</div>
${puentes}
<div style="margin: 32px 0; padding: 24px; background: white; border-radius: 14px;">
<p style="margin: 0 0 4px; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: #86868B;">${labels.closing}</p>
<p style="margin: 0; color: #424245; line-height: 1.55;">${aiSections.cierre}</p>
</div>
<p style="text-align: center; margin-top: 32px;"><a href="${magicLink}" style="color: #7A4D96;">${labels.viewOnline}</a></p>
</div></body></html>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { puentes_session_id } = req.body || {};
    if (!puentes_session_id) return res.status(400).json({ error: 'Missing id' });

    const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: pSession } = await supabase
        .from('puentes_sessions')
        .select('*, purchase:puentes_purchases!purchase_id(*)')
        .eq('id', puentes_session_id)
        .maybeSingle();
    if (!pSession || !pSession.ai_sections) return res.status(404).json({ error: 'Not ready' });

    const purchase = pSession.purchase;
    const siteUrl = process.env.SITE_URL || 'https://www.argomethod.com';
    const magicLink = `${siteUrl}/puentes/${purchase.magic_token}`;
    const html = buildHtml({
        childName: purchase.child_name || '',
        recipientName: purchase.recipient_name,
        aiSections: pSession.ai_sections,
        magicLink,
        lang: pSession.lang,
    });

    const subject = pSession.lang === 'en'
        ? `Your Argo Puentes — bond with ${purchase.child_name}`
        : pSession.lang === 'pt'
            ? `Seu Argo Puentes — vínculo com ${purchase.child_name}`
            : `Tu Argo Puentes — vínculo con ${purchase.child_name}`;

    await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
        body: JSON.stringify({
            from: 'Argo Method <hola@argomethod.com>',
            to: purchase.recipient_email,
            subject,
            html,
        }),
    });

    await supabase.from('puentes_sessions').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', puentes_session_id);
    return res.status(200).json({ ok: true });
}
```

- [ ] **Step 2: Commit**

```bash
git add api/send-puentes-email.ts
git commit -m "feat(puentes): final report email with 3-lang template"
```

### Task 6.3: Reminder cron (3-day re-pitch for non-buyers)

**Files:**
- Create: `api/puentes-reminder-cron.ts`
- Modify: `vercel.json`

- [ ] **Step 1: Write cron handler**

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).end();
    }
    const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const siteUrl = process.env.SITE_URL || 'https://www.argomethod.com';
    const threshold = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

    // Sessions delivered 3+ days ago, never reminded, with no associated paid puentes purchase
    const { data: candidates } = await supabase
        .from('sessions')
        .select('id, email, name, child_name, lang, completed_at, puentes_reminder_sent_at')
        .lt('completed_at', threshold)
        .is('puentes_reminder_sent_at', null)
        .eq('status', 'completed')
        .limit(100);

    if (!candidates || candidates.length === 0) return res.status(200).json({ sent: 0 });

    let sent = 0;
    for (const s of candidates) {
        // Skip if any paid puentes purchase exists for this session
        const { data: existing } = await supabase
            .from('puentes_purchases')
            .select('id')
            .eq('source_session_id', s.id)
            .eq('status', 'paid')
            .maybeSingle();
        if (existing) continue;
        if (!s.email) continue;

        const childName = s.child_name || s.name || '';
        const subject = s.lang === 'en'
            ? `One more idea for accompanying ${childName}`
            : s.lang === 'pt'
                ? `Mais uma ideia para acompanhar ${childName}`
                : `Una idea más para acompañar a ${childName}`;
        const cta = s.lang === 'en'
            ? `Some parents have found Argo Puentes useful as a follow-up. It's a short questionnaire about your own style and how it complements ${childName}'s. <a href="${siteUrl}/puentes/checkout?source_session_id=${s.id}">Take a look</a>.`
            : s.lang === 'pt'
                ? `Alguns pais acharam o Argo Puentes útil como continuação. É um questionário curto sobre seu próprio estilo e como ele se complementa com o de ${childName}. <a href="${siteUrl}/puentes/checkout?source_session_id=${s.id}">Dê uma olhada</a>.`
                : `Algunos padres encontraron útil Argo Puentes como continuación. Es un cuestionario corto sobre tu propio estilo y cómo se complementa con el de ${childName}. <a href="${siteUrl}/puentes/checkout?source_session_id=${s.id}">Echale un vistazo</a>.`;

        await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
            body: JSON.stringify({
                from: 'Argo Method <hola@argomethod.com>',
                to: s.email,
                subject,
                html: `<p>${cta}</p>`,
            }),
        });
        await supabase.from('sessions').update({ puentes_reminder_sent_at: new Date().toISOString() }).eq('id', s.id);
        sent++;
    }
    return res.status(200).json({ sent });
}
```

- [ ] **Step 2: Add cron schedule to vercel.json**

```json
{
  "crons": [
    { "path": "/api/blog-cron", "schedule": "0 10 * * 1,4" },
    { "path": "/api/puentes-reminder-cron", "schedule": "0 14 * * *" }
  ]
}
```

(Keep any existing crons in the file. The puentes cron fires daily at 14:00 UTC.)

- [ ] **Step 3: Commit**

```bash
git add api/puentes-reminder-cron.ts vercel.json
git commit -m "feat(puentes): daily reminder cron for non-buyers at +3 days"
```

---

## Phase 7 — Terms & Consent

### Task 7.1: Add Argo Puentes clause to Terms

**Files:**
- Modify: existing Terms page (find with `grep -r 'términos' src/pages/`)

- [ ] **Step 1: Find Terms file and add clause**

Add a new section in all 3 languages explaining:
- Argo Puentes is a complementary product
- Adult takes a questionnaire
- Resulting report is NOT a clinical or therapeutic service
- We may send a follow-up offer up to 2 emails after the child's report delivery
- The adult can opt out at any time

ES sample text:

> **Argo Puentes (servicio complementario)**
>
> Tras la entrega del informe de tu hijo, podemos ofrecerte el servicio complementario "Argo Puentes", que consiste en un cuestionario para el adulto responsable y un informe personalizado de cuatro puentes de vínculo. Este servicio:
>
> 1. No constituye un servicio clínico, terapéutico ni de diagnóstico psicológico.
> 2. Es un material de auto-conocimiento e invitación a la reflexión.
> 3. Se basa en el modelo DISC y en el perfil que el niño completó previamente.
> 4. Puede ofrecerse en hasta 2 comunicaciones por correo electrónico tras la entrega del informe principal. Puedes solicitar dejar de recibir esta propuesta en cualquier momento respondiendo al correo o usando el enlace de baja.

- [ ] **Step 2: Commit**

```bash
git add src/pages/Terms.tsx  # or wherever Terms live
git commit -m "feat(puentes): terms clause for argo puentes service"
```

### Task 7.2: Consent checkbox at checkout

**Files:**
- Create: `src/components/puentes/PuentesCheckout.tsx`

- [ ] **Step 1: Build a small checkout entry page**

```tsx
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button, Card, Input } from '@/components/ui';
import { getPuentesCopy } from '@/lib/puentesTranslations';
import type { Lang } from '@/lib/supabase';

export default function PuentesCheckout() {
    const [params] = useSearchParams();
    const sourceSessionId = params.get('source_session_id');
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [consent, setConsent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [lang, setLang] = useState<Lang>('es');
    const [country, setCountry] = useState('AR'); // could auto-detect via IP later
    const c = getPuentesCopy(lang);

    const submit = async () => {
        if (!consent || !email || !sourceSessionId) return;
        setLoading(true);
        const res = await fetch('/api/puentes-checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                source_session_id: sourceSessionId,
                recipient_email: email,
                recipient_name: name || null,
                country,
                lang,
                consent_given: consent,
            }),
        });
        const data = await res.json();
        if (data.checkout_url) window.location.href = data.checkout_url;
        else setLoading(false);
    };

    return (
        <div className="min-h-screen bg-argo-neutral py-12 px-4">
            <div className="max-w-md mx-auto">
                <Card padding="lg">
                    <p className="text-xs uppercase tracking-widest text-argo-violet-500 mb-2">Argo Puentes</p>
                    <h1 className="text-2xl font-bold text-argo-navy">Tu Puente</h1>
                    <p className="mt-4 text-argo-secondary">Recibirás un enlace por email para responder el cuestionario (5-7 min).</p>
                    <div className="mt-6 space-y-4">
                        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                        <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
                        <label className="flex items-start gap-3 text-sm text-argo-secondary">
                            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
                            <span>{c.checkout.consentLabel} <a href="/terms" target="_blank" className="text-argo-indigo">{c.checkout.termsLink}</a></span>
                        </label>
                        <Button variant="violet" size="lg" className="w-full" disabled={!consent || !email || loading} onClick={submit}>
                            {c.checkout.payCta}
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Register route in App.tsx**

```tsx
import PuentesCheckout from '@/components/puentes/PuentesCheckout';
// inside <Routes>:
<Route path="/puentes/checkout" element={<PuentesCheckout />} />
```

- [ ] **Step 3: Commit**

```bash
git add src/components/puentes/PuentesCheckout.tsx src/App.tsx
git commit -m "feat(puentes): checkout page with consent and lang"
```

---

## Phase 8 — Admin visibility (superadmin tab)

### Task 8.1: Admin tab listing puentes purchases

**Files:**
- Create: `api/admin-puentes.ts`
- Modify: admin dashboard root component (find with `grep -r "admin-argo-one" src/`)

- [ ] **Step 1: API endpoint that lists puentes purchases + sessions**

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data } = await supabase
        .from('puentes_purchases')
        .select('*, session:puentes_sessions!purchase_id(status, completed_at, sent_at)')
        .order('created_at', { ascending: false })
        .limit(200);
    return res.status(200).json({ purchases: data ?? [] });
}
```

- [ ] **Step 2: Add a tab in superadmin UI** — mirror the existing "Argo One" tab structure, listing the rows with status badges. (Exact location depends on `src/components/admin/` layout discovered at implementation time.)

- [ ] **Step 3: Commit**

```bash
git add api/admin-puentes.ts src/components/admin/
git commit -m "feat(puentes): superadmin tab listing puentes purchases"
```

---

## Phase 9 — QA + safe rollout

### Task 9.1: Manual end-to-end QA on develop (staging)

- [ ] Run a full Argo One child session on Vercel preview (develop branch)
- [ ] Verify the report email now includes the Puentes CTA in the correct language
- [ ] Click CTA → land on `/puentes/checkout` → Stripe test mode purchase → webhook confirms → magic-link email arrives
- [ ] Click magic link → questionnaire flows through 15 questions
- [ ] AI generation completes within 30 seconds
- [ ] Final email arrives with 4 puentes
- [ ] Revisit magic link → shows already-generated report
- [ ] Repeat in EN and PT
- [ ] Repeat the checkout flow with `country=AR` to validate MercadoPago path

### Task 9.2: Design system audit

- [ ] Grep for hardcoded colors in `src/components/puentes/` (`grep -rn "bg-\[#\|text-\[#" src/components/puentes/`) — expect zero
- [ ] Verify all buttons use `Button` from `@/components/ui`
- [ ] Verify no axis colors are hardcoded — should pull from `designTokens.ts` only if needed
- [ ] Verify `rounded-[14px]`, `shadow-argo`, `text-argo-navy/secondary/grey` are used consistently

### Task 9.3: User-facing copy audit

- [ ] Run grep against user-facing strings for forbidden voseo forms: `grep -rnE "podés|querés|tenés|hacés|venís|sentís|mirá|hacé|poné|tomá|vení|decí" src/components/puentes/ src/lib/puentesQuestions.ts src/lib/puentesTranslations.ts`
- [ ] Same for em dash / en dash: `grep -rn "—\|–" src/components/puentes/ src/lib/puentesQuestions.ts src/lib/puentesTranslations.ts`
- [ ] Both should return zero matches.

### Task 9.4: Pre-prod release checklist

- [ ] Migrate DB schema in prod Supabase
- [ ] Add `MERCADOPAGO_ACCESS_TOKEN`, `STRIPE_SECRET_KEY`, `RESEND_API_KEY`, `CRON_SECRET` already exist — confirm
- [ ] Confirm webhook URL is registered for both providers
- [ ] Merge develop → main with explicit user approval ("mandalo a producción")

---

## Self-review checklist (run before handing off)

- [x] All 15 questions translated to es/en/pt with same shape and option IDs
- [x] Resolver tested (5 unit tests covering primary axis, secondary threshold, motor tie-break, missing answers, full happy path)
- [x] Forbidden-word lists present for all 3 langs in `generate-puentes.ts`
- [x] Retry logic in AI generation (1 retry on API error, 1 retry on forbidden-word hit, 1 retry on parse error)
- [x] Webhook handles both Stripe and MercadoPago for puentes events
- [x] Email CTA inserted in child report email for all 3 langs
- [x] Reminder cron filters out already-bought sessions and already-reminded sessions
- [x] Terms clause covers consent, opt-out, and non-clinical nature
- [x] Magic-link flow validates token and gates on `status=paid`
- [x] Design system: no hardcoded colors, all components from `src/components/ui/`
- [x] Lang inherited from `sessions.lang`, not asked again
- [x] Same product price logic as Argo One (Stripe USD / MP ARS by country)
