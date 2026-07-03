# Argo Method — Project Context

## What is Argo
Behavioral profiling tool for young athletes (8-16 years) based on the DISC model.
A gamified "odyssey" with nautical theme generates a personalized report for the responsible adult (coach, parent, institution).

## Archetype naming (SINGLE source of truth)
The 12 profile names follow **`[Eje] [Motor]`**: D=Impulsor, I=Conector, S=Sostenedor, C=Estratega × Dinámico/Rítmico/Sereno (C+Lento = "Observador"). This is the ONLY valid naming. Old metaphor names (El Tanque, La Brújula, El Capitán) and old adjective schemes (Impulsor Decidido, Conector Vibrante, Estratega Reactivo, etc.) are **forbidden** — remove on sight. Full canonical table (es/en/pt) + every mirror map that must stay in sync: `docs/archetype-naming.md`. Naming aligned forward-only 2026-06-02 (stored DB reports keep old labels).

## Stack
React + TypeScript + Vite + TailwindCSS + Framer Motion + Google Gemini AI
Deployed on Vercel (argomethod.com). Email via Resend. Database: Supabase (PostgreSQL). Auth: Supabase Auth (email/password + Google OAuth). Payments: Stripe.

## Language
- All user-facing copy: **español latam neutro (NO voseo)**. Use "tú" conjugations.
- Code, comments, commits: English.

### Punctuation rules (STRICT)
- **No dashes** (em dash —, en dash –) in user-facing copy. Use periods, commas, or parentheses instead.
  - Wrong: "Compártelo con el adulto — padre, madre o tutor."
  - Correct: "Compártelo con el adulto (padre, madre o tutor)."

### Framing rule (STRICT): activity, not only "training"
Never frame copy as if Argo were only about training. The profile applies equally to matches, competitions, free play and the day-to-day of the sport, and to parents who never attend a practice. Use the umbrella **"la actividad"** (en "the activity" / pt "a atividade"), **"el deporte"**, or **"en la cancha"** instead of "el entrenamiento / training / treino". Exceptions to keep: the **coach role** ("entrenador/coach"), code identifiers / i18n keys, and the deliberate training-vs-match contrast that calms the Sostén who freezes in a match. Full vocabulary + as-built: `docs/COPY-MARCO-ACTIVIDAD.md`.

### Product naming + buyer-neutral copy (STRICT)
Consumer product names (match EXACTLY in checkout, emails, and the pricing card):
- **ArgoOne®** ($9.99) — the child's report. A One buyer is later offered a Puente proposal for the authorizing adult.
- **ArgoOne+®** ($12.99) — the child's report **plus** the adult's Puente (no later proposal; the Puente is delivered prepaid). Written **joined: "ArgoOne+®"**, never "ArgoOne + Puente" / "Argo One + Puente".
- **ArgoPuente®** — the adult bridge (the add-on / the upsell). **Always singular AND joined: "ArgoPuente®", never the plural "Argo Puentes" nor the spaced "Argo Puente"** (aligned 2026-07-02). The DB tables `puentes_*` and the `/puentes/` route keep their names; only user-facing copy changes.
- **ArgoAcademy®** / **Argo Coach** — consultive dashboard, no digital checkout ("Solicitar demo").

**Registered mark ® + joined wordmark (STRICT, aligned 2026-07-02):** every consumer brand name is written **joined (NO spaces)** and carries a **trailing ®** on every place it is *displayed*: **`ArgoOne®`**, **`ArgoOne+®`**, **`ArgoPuente®`**, **`ArgoMethod®`** (and `ArgoAcademy®`). This now **includes the company mark**: the old spaced two-weight "Argo Method" logo becomes **`ArgoMethod®`** (still Argo `font-weight: 800` + rest thin `300` web / `200` deck; the **"+" stays 800**; the **® is thin and comes last** — after the "+" in `ArgoOne+®`). Applies to **every rendered surface**: `src/` (wordmark spans incl. the shared `ProductName`/`BrandName` components, prose, labels, titles, legal pages), `public/sales/*.html` (the sales deck), `api/` (email templates, crons, the Puente report + its AI-generation prompt), plus the human-visible `index.html` title/og/twitter/h1 and `manifest.json` name. **Do NOT add ® to** (keep the spaced "Argo Method" there): (a) code identifiers / component names (`ArgoOneLanding`, `AdminArgoOne`, `PuentesFlow`), i18n keys, routes, DB object names; (b) JSON-LD / schema.org fields in `index.html` (the structured-data entity stays `"Argo Method"`); (c) email sender/From display-names (`from: 'Argo Method <hola@…>'`); (d) machine/infra files (`public/llms.txt`) and internal-only artifacts (`preview/*.html`, `design-system/`, `docs/*.md`, `supabase/migrations`). Gotcha that caused a missed round: dynamic wordmark components (`<ProductName rest="One"/>`, `<BrandName/>`) render `Argo`+`{rest}` across split spans, so a contiguous-string regex/grep will NOT catch them — the ® must be added inside the component. In emails the product header is the `ArgoOne®` wordmark, never "Argo Method One"; `ArgoMethod®` is the **company** mark. As-built + the deterministic scripts (`scripts/brandify-frontend.mjs`, `scripts/brandify-api.mjs`): `docs/BRAND-NAMING.md`.

**Buyer-neutral (STRICT):** ArgoOne® / ArgoOne+® / ArgoPuente® are bought by a **parent OR a coach**. Never assume the parent. Say **"el niño"** (the pricing card's term), never **"tu hijo / your son / seu filho"**; call the grown-up **"el adulto" / "quien lo acompaña"**, not only "padre/madre". Only parental-consent legal text may name "padre/madre/tutor".

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
Single-instance. One admin dashboard.

**Child/perfilamiento split (LIVE 2026-06-29).** The old `sessions` table was split: `children` = the persistent player/roster entity (identity + slot + `reprofile_token`); `perfilamientos` = append-only assessment history (the re-homed `sessions` table, ids preserved) with `status` (`in_flight`/`resolved`). The **current profile** is the `current_perfilamiento` VIEW (latest resolved per child) — read it for current-profile data, read `perfilamientos` by id for a specific assessment. Memberships (`group_members`/`chem_group_members`) key on `child_id`. Re-profiling appends a perfilamiento (never overwrites); duplicates are unified via `merge_children`. Full spec + as-built: `docs/IDENTIDAD-NINO-Y-PERFILAMIENTOS.md`. NOTE: after creating a table/view via raw SQL in prod, run `NOTIFY pgrst, 'reload schema';` or PostgREST 500s on the new object.

### Target (next phase): Multi-tenant SaaS

#### Roles
| Role | Description |
|------|-------------|
| **Superadmin** | Argo team. Sees all tenants, all sessions, global metrics. Evolution of current dashboard. |
| **Tenant** | Paying user (coach, club, institution, parent). Has login, own dashboard, credits, unique shareable link. |
| **Player** | Child + accompanying adult. Arrives via tenant's link. Lightweight identification (no full account). |

#### Tenant flow
1. Registers / logs in (Google or email) → 14-day trial (8 players)
2. Accesses dashboard → sees unique link, sessions, roster usage
3. Shares link with players
4. Upgrades via Stripe (international) or MercadoPago (Latam) when ready (PRO/Academy)

#### Player flow
1. Receives link (`argomethod.com/play/:slug`)
2. Lightweight identification (form: name, email, child name, age, sport — no account creation)
3. Plays the odyssey → occupies a roster slot
4. If completes: full result in tenant's dashboard + email to adult
5. If abandons: slot occupied, profile shows as "pending", can retry

#### Pricing model (roster-based, NO credits)
- **No credits.** Users pay for roster capacity (active player slots).
- Re-profiling included every 6 months per player.
- Trial: 8 players, 14 days. PRO: 50 players. Academy: 100. Enterprise: custom.
- AI consultant included in all plans (fair use soft cap, invisible to user).
- Enterprise gets Gemini 2.5 Pro (premium model); others get Gemini 2.5 Flash.
- ArgoOne (parent OR coach): one-time purchase, no dashboard, report by email. Copy is buyer-neutral ("el niño", never "tu hijo") — see the naming rule above.
- Full pricing docs: `docs/pricing-v3.md`

#### Key decisions (confirmed)
- **Never reference "credits"** — the concept is eliminated
- Use "equipo" (not "roster") in user-facing Spanish copy
- A slot = an active child with ≥1 **resolved** perfilamiento. A child who started but never finished (in-flight only) does NOT occupy a slot; the slot is charged at the first resolved profile. Re-profiling never costs a slot. (Supersedes the old "abandoned sessions occupy a slot" rule, changed in the 2026-06-29 split.)
- Player does NOT need a full account — lightweight form only
- Superadmin can create Enterprise accounts with personalized welcome email
- All admin actions logged in audit_log table

#### Data model
- `tenants` table: plan, roster_limit, ai_queries_count, slug, auth user reference, subscription_provider, subscription_id
- `children` (player/roster entity, `tenant_id` links to tenant) + `perfilamientos` (append-only assessment history, was `sessions`) + `current_perfilamiento` view; see the split note above
- `one_purchases` + `one_links` for Argo One standalone purchases
- `admin_audit_log` for superadmin action tracking
- Stripe handles subscription billing; webhook at `/api/one-webhook`

## Git workflow
- **`main`** branch = production (`argomethod.com`). Do NOT push here unless the user explicitly says "mandalo a producción" or "push to main".
- **`develop`** branch = testing/staging. All new work goes here by default. Vercel generates a preview URL for each push.
- When unsure which branch to target, **always ask the user**.
- Never merge `develop` into `main` without explicit user approval.

## CLI / MCP autonomy (owner authorization, 2026-06-05)
The owner has authorized the agent to carry out **any action it can perform via CLI or MCP without asking first**: Supabase migrations/SQL, Vercel env vars and deploys, and other infra/config. Do them directly. The owner explicitly cannot perform these external/config steps themselves, so never hand them back as "things for you to do" when a CLI/MCP path exists.
- This **supersedes** the earlier "prod migrations need explicit per-action OK" rule.
- Still surface (do not silently execute) genuinely destructive or irreversible actions: dropping tables/columns, deleting or truncating data, hard-deleting accounts, cancelling live subscriptions, or pushing to `main`. Act on those only on a clear request and report exactly what changed.
- Prefer surgical changes over broad ones: apply a single targeted migration via MCP rather than `supabase db push`, which applies every pending local migration.

## Serverless endpoints (Vercel)
All DB writes go through `/api/*` endpoints using `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS:
- `POST /api/save-session` — insert completed session
- `POST /api/delete-session` — soft-delete session or hard-delete lead
- `POST /api/send-email` — send report email via Resend
- `POST /api/generate-ai` — generate AI report sections via Gemini
- `POST /api/create-tenant` — create tenant record on signup (idempotent)
- `POST /api/start-play` — validate roster capacity + start play (general link = NEW child)
- `POST /api/start-reprofile` — re-profile an existing child via its `reprofile_token` (6-month hard gate, skips roster); signs the child_id into the play_token
- `POST /api/merge-players` — unify two duplicate children into one (calls `merge_children` RPC)
- `POST /api/archive-player` — archive/reactivate players (operates on the child)
- `POST /api/create-subscription` — subscription checkout (Stripe or MercadoPago based on country)
- `POST /api/cancel-subscription` — cancel active subscription (Stripe or MercadoPago)
- `POST /api/delete-account` — delete tenant account (cancels subscription + removes auth user)
- `POST /api/one-checkout` — Argo One checkout (Stripe USD or MercadoPago ARS, auto-detected)
- `POST /api/one-webhook` — webhook for Stripe + MercadoPago (Argo One + subscriptions)
- `GET/POST /api/one-panel` — Argo One mini-panel (magic link auth)
- `POST /api/one-start-play` — validate Argo One link
- `POST /api/one-complete` — save Argo One session
- `GET/POST /api/tenant-chat` — AI consultant (Gemini)
- `GET /api/admin-tenants` — superadmin tenant management
- `GET /api/admin-ai-usage` — AI consumption per tenant
- `GET /api/admin-revenue` — revenue metrics
- `GET /api/admin-argo-one` — Argo One purchases
- **Important**: Vercel serverless functions here are transpiled, NOT bundled. They **cannot import** between `/api` files **nor from `src/` (`../src/...`)** — such an import passes `tsc` but throws `ERR_MODULE_NOT_FOUND` at runtime (this caused a prod outage on 2026-06-05: 7 functions down, incl. report-recovery-cron). **Inline** any shared helper into each function (AI provider, Principia `logActivity`, lifecycle emails are all inlined this way). Enforced by `npm run check:api-imports` (CI gate). Detected by qa-monitor CHECK 8 (probes every endpoint, fails on 5xx).

## AI quality & anti-hallucination
The AI consultant (`tenant-chat.ts`) has 5 anti-hallucination layers:
1. **Expanded knowledge base**: all 12 Argo archetypes with axis descriptions and combustible
2. **Full report injection**: when a player is mentioned, their ai_sections are injected (resumenPerfil, combustible, corazon, palabras puente/ruido)
3. **Prohibited words filter**: 35+ terms scanned post-generation (clinical, negative labeling, deterministic language). If found, response is regenerated.
4. **Few-shot examples**: 4 correct Q&A per language showing expected tone, format, and probabilistic language (incl. the consultive first-turn example)
5. **Ground truth validation**: post-generation check verifies the response doesn't attribute the wrong DISC axis to a named player

Consultive mode (2026-07-02): when a thread OPENS with a vague problem about a child/group, the assistant explores first (validate + ONE tentative profile-anchored reading + 2-3 observable-behavior questions, single round) instead of prescribing; specific questions are still answered directly. Enforced by a MODO CONSULTIVO prompt section + a deterministic first-turn nudge injected when a player/group/situation is detected. The chat also knows the caller's chem groups (`chem_groups`, owner-scoped) in the same mention matcher as planteles. As-built: `docs/ARGOCOACH-MODO-CONSULTIVO.md`.

**GENERATED regions (STRICT, 2026-07-02):** `api/tenant-chat.ts` contains two machine-generated regions fenced by `// >>> GENERATED:COACH_PROMPTS` and `// >>> GENERATED:COACH_SITUATIONS` markers. NEVER hand-edit inside them: edit `scripts/coach-prompt-source.ts` (prompts es/en/pt + situation keywords) or `src/lib/situationalGuide*.ts` (situation cards), then run `npm run gen:coach`. `npm run check:coach-gen` (part of `qa:unit`) fails when the file drifts from its sources. Chat telemetry lands in `ai_events` (mode consultivo/directo, situation_matched, tokens_cached, model-aware cost_usd) and per-response ratings in `chat_messages.rating`. Full execution log: `docs/ARGOCOACH-MEJORAS.md`.

Report generation (`generate-ai.ts`) has retry resilience: 1 retry on API failure + 1 retry on JSON parse failure.
Admin can grant `full_access` on any session — regenerates AI if missing before sending full report email.

## Key conventions
- Option colors in questions are positional (A=sky, B=amber, C=violet, D=emerald) — never reveal DISC axis
- Email auto-sends when AI generation completes (no manual button)
- Nautical theme for children: ship progress bar, explorer metaphors
- Professional but warm tone for adults
- Logo: **Argo** (fontWeight: 800) **Method** (fontWeight: 100)
- User-facing copy: "equipo" (not "roster"), never mention "credits"

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

### Hover and touch behavior
Tailwind `hover:` utilities are gated by `@media (hover: hover) and (pointer: fine)` via `future.hoverOnlyWhenSupported: true` in `tailwind.config.js`. Hover styles fire on desktop (mouse) but **never on touch devices**. This prevents iOS Safari sticky `:hover` from making the previously tapped button position look "pre-selected" when a new screen mounts.
- For touch feedback on press, use `active:*` (fires only during tap, releases on touchend).
- Do not rely on `hover:` for any state that must be visible on mobile.
- Never disable this flag without a deliberate UX decision and re-testing the questionnaire flows.

### What NOT to do
- Do not define `EJE_COLORS`, `EJE_COLOR`, `AXIS_DOT` locally — use `designTokens.ts`
- Do not use `style={{ color: '#1D1D1F' }}` — use `text-argo-navy`
- Do not use `style={{ borderRadius: '14px' }}` — use `rounded-[14px]`
- Do not build custom buttons/inputs/cards from scratch — use `src/components/ui/*`
- Do not use `bg-[#xxx]` or `text-[#xxx]` for colors that exist as tokens
