# Argo Method — Project Context

## What is Argo
Behavioral profiling tool for young athletes (8-16 years) based on the DISC model.
A gamified "odyssey" with nautical theme generates a personalized report for the responsible adult (coach, parent, institution).

## Stack
React + TypeScript + Vite + TailwindCSS + Framer Motion + OpenAI
Deployed on Vercel (argomethod.com). Email via Resend. Database: Supabase (PostgreSQL). Auth: Supabase Auth (email/password + Google OAuth).

## Language
- All user-facing copy: **español latam neutro (NO voseo)**. Use "tú" conjugations.
- Code, comments, commits: English.

### Voseo rules (STRICT — enforced by post-edit hook)
Never use Argentine voseo forms. Always use standard tuteo. Reference:

| Forbidden (voseo) | Correct (tuteo) |
|---|---|
| podés, querés, sabés, tenés, hacés, venís, sentís | puedes, quieres, sabes, tienes, haces, vienes, sientes |
| mirá, hacé, poné, tomá, vení, decí | mira, haz, pon, toma, ven, di |
| Dejá, Hablá, Armá, Buscá, Esperá, Bajá | Deja, Habla, Arma, Busca, Espera, Baja |
| acercate, sentáte, fijáte, enfocate | acércate, siéntate, fíjate, enfócate |
| decile, pedile, ponelo, dejalo, sacalo, mantenele | dile, pídele, ponlo, déjalo, sácalo, mantenle |
| haceme, explicale, incluilo, mostrale | hazme, explícale, inclúyelo, muéstrale |
| de vos, en vos, a vos, sos | de ti, en ti, a ti, eres |
| acá | aquí |

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

## Design System

### STRICT RULES
1. **Never hardcode axis colors** — import `AXIS_COLORS`, `AXIS_CHIP`, `AXIS_LABELS` from `src/lib/designTokens.ts`
2. **Never hardcode motor chip styles** — import `MOTOR_CHIP` from `src/lib/designTokens.ts`
3. **Use shared UI components** — import from `src/components/ui/index.ts`:
   - `Button` (variants: primary, violet, secondary, ghost, danger; sizes: sm, md, lg)
   - `Input` (with label, error, consistent focus ring)
   - `Badge`, `AxisBadge`, `MotorBadge` (consistent pill styling)
   - `Card` (padding: sm/md/lg, hover prop)
   - `ToastProvider`, `useToast` (feedback)
   - `Skeleton*` variants (loading states)
4. **Use Tailwind tokens, not inline styles** for colors/spacing/radii — inline styles only for dynamic values or animations

### Color palette (defined in tailwind.config.js)
| Token | Hex | Use |
|---|---|---|
| `argo-navy` | #1D1D1F | Primary text, headings |
| `argo-secondary` | #424245 | Body text |
| `argo-grey` | #86868B | Secondary/muted text |
| `argo-light` | #AEAEB2 | Tertiary text |
| `argo-border` | #E8E8ED | All borders |
| `argo-bg` | #F8F8FA | Light backgrounds, hover |
| `argo-neutral` | #F5F5F7 | Page backgrounds |
| `argo-indigo` | #0071E3 | Links, CTAs |
| `argo-violet-50..600` | #F9F5FC..#7A4D96 | Accent (SaaS features) |
| `axis-impulsor` | #f97316 | D axis |
| `axis-conector` | #f59e0b | I axis |
| `axis-sosten` | #22c55e | S axis |
| `axis-estratega` | #6366f1 | C axis |

### Typography
- **Font sizes:** `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl` — no arbitrary `text-[Npx]`
- **Font weights:** `font-medium` (body), `font-semibold` (labels/buttons), `font-bold` (headings)
- **Letter spacing:** `tracking-wide` (buttons), `tracking-widest` (uppercase labels), `tracking-tight` (headlines)
- **Border radius:** `rounded-lg` (inputs/buttons), `rounded-xl` (containers), `rounded-[14px]` (cards), `rounded-full` (pills/avatars)
- **Shadows:** `shadow-argo` (cards resting), `shadow-argo-hover` (cards hover), `shadow-lg` (modals/toasts)

### Status colors (semantic)
Use standard Tailwind for status: `red-*` (error), `green-*` (success), `amber-*` (warning), `blue-*` (info). Do NOT create argo-* tokens for these.

### What NOT to do
- Do not define `EJE_COLORS`, `EJE_COLOR`, `AXIS_DOT` locally — use `designTokens.ts`
- Do not use `style={{ color: '#1D1D1F' }}` — use `text-argo-navy`
- Do not use `style={{ borderRadius: '14px' }}` — use `rounded-[14px]`
- Do not build custom buttons/inputs/cards from scratch — use `src/components/ui/*`
- Do not use `bg-[#xxx]` or `text-[#xxx]` for colors that exist as tokens
