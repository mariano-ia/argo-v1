# Argo Method — Project Context

## What is Argo
Behavioral profiling tool for young athletes (8-16 years) based on the DISC model.
A gamified "odyssey" with nautical theme generates a personalized report for the responsible adult (coach, parent, institution).

## Stack
React + TypeScript + Vite + TailwindCSS + Framer Motion + OpenAI
Deployed on Vercel (argomethod.com). Email via Resend. Database: Supabase (PostgreSQL). Auth: Supabase Auth (email/password + Google OAuth).

## Language
- All user-facing copy: español latam neutro (NO voseo). Use "tú" conjugations: "aprende", "empieza", "individualiza" — never "aprendé", "empezá", "individualizá".
- Code, comments, commits: English.

## Architecture

### Current (MVP — v1.7)
Single-instance. All sessions fall into one shared table. One admin dashboard.

### Target (next phase): Multi-tenant SaaS

#### Roles
| Role | Description |
|------|-------------|
| **Superadmin** | Argo team. Sees all tenants, all sessions, global metrics. Evolution of current dashboard. |
| **Tenant** | Paying user (coach, club, institution, parent). Has login, own dashboard, credits, unique shareable link. |
| **Player** | Child + accompanying adult. Arrives via tenant's link. Lightweight identification (no full account). |

#### Tenant flow
1. Registers / logs in (Google or email)
2. Hits paywall → receives credits (1 credit = 1 play)
3. Accesses own dashboard → sees unique link, sessions, remaining credits
4. Shares link with players

#### Player flow
1. Receives link (`argomethod.com/play/:slug`)
2. Lightweight identification (form: name, email, child name, age, sport — no account creation)
3. Plays the odyssey → **credit deducted at start**
4. If completes: full result in tenant's dashboard
5. If abandons: credit consumed, recorded as "started / not completed" in tenant's dashboard

#### Key decisions (confirmed)
- Credits deduct on **start**, not on completion
- Abandoned sessions are visible in tenant dashboard with status
- Player does NOT need a full account — lightweight form only (same as current onboarding)
- Current admin dashboard becomes superadmin view
- Tenant dashboard is a new, scoped view

#### Data model implications
- `tenant_id` on `sessions` table to link each play to the link owner
- `tenants` table: plan, remaining credits, slug, auth user reference
- `credit_transactions` table: who paid, how many credits, when
- Session states: `started` → `completed` | `abandoned`
- RLS or server-side logic: each tenant sees only their own sessions

## Git workflow
- **`main`** branch = production (`argomethod.com`). Do NOT push here unless the user explicitly says "mandalo a producción" or "push to main".
- **`develop`** branch = testing/staging. All new work goes here by default. Vercel generates a preview URL for each push.
- When unsure which branch to target, **always ask the user**.
- Never merge `develop` into `main` without explicit user approval.

## Serverless endpoints (Vercel)
All DB writes go through `/api/*` endpoints using `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS:
- `POST /api/save-session` — insert completed session
- `POST /api/delete-session` — soft-delete session or hard-delete lead
- `POST /api/send-email` — send report email via Resend
- `POST /api/create-tenant` — create tenant record on signup (idempotent)

## Key conventions
- Option colors in questions are positional (A=sky, B=amber, C=violet, D=emerald) — never reveal DISC axis
- Email auto-sends when AI generation completes (no manual button)
- Nautical theme for children: ship progress bar, explorer metaphors
- Professional but warm tone for adults
- Logo: **Argo** (fontWeight: 800) **Method** (fontWeight: 100)
