# Brand naming — joined wordmarks + registered mark (®)

**Aligned 2026-07-02.** Single source of truth for how the consumer brand names are
written and rendered. Supersedes the older "Argo Method keeps its space / Argo Puente
spaced" rule in prior `CLAUDE.md` revisions.

## Canonical forms (what the user sees)

| Product / mark | Written as | Old form (forbidden in frontend) |
|---|---|---|
| Child report | **`ArgoOne®`** | `ArgoOne`, `Argo One` |
| Child report + adult bridge | **`ArgoOne+®`** | `ArgoOne +`, `Argo One +` |
| Adult bridge (add-on) | **`ArgoPuente®`** | `Argo Puentes` (plural), `Argo Puente` (spaced) |
| Company / consultive dashboard | **`ArgoAcademy®`** | `Argo Academy` |
| Company mark (logo) | **`ArgoMethod®`** | `Argo Method` (spaced) |

Rules:
- **Joined, no spaces.** All consumer names are written as a single token.
- **Trailing ® on every displayed instance**, in the frontend.
- **Singular** for the bridge: `ArgoPuente®`, never the plural.
- **Wordmark styling unchanged:** `Argo` is `font-weight: 800`; the tail (`One` / `One+` /
  `Method` / `Academy`) is thin (`300` on web, `200` in the sales deck). The **`+` stays
  `800`**. The **`®` is thin and comes LAST** — after the `+` in `ArgoOne+®`.
- Two-weight logos are split spans (`<span 800>Argo</span><span 100> Method</span>`). To
  join, the leading space in the tail span is removed and `®` appended:
  `<span 100>Method®</span>` → renders `ArgoMethod®`.

## Where ® is NOT applied (deliberate exceptions)

Even in the frontend, keep the **spaced, ®-less** form in:
1. **Code identifiers / component names**: `ArgoOneLanding`, `AdminArgoOne`, `PuentesFlow`,
   `PuentesReport`. i18n keys, route paths (`/one`, `/puentes/`), DB object names
   (`puentes_*`, `one_purchases`).
2. **JSON-LD / schema.org** `name` fields — the legal-entity string stays `"Argo Method"`
   (e.g. `BlogPost.tsx` Organization / breadcrumb structured data). ® in structured data is
   wrong for SEO.
3. **Email sender / From display-names** — `from: 'Argo Method <hola@argomethod.com>'`. A ®
   in a From header renders oddly across mail clients. (These all live in `api/`.)

## Scope: every rendered surface (round 2, 2026-07-02)

Round 1 changed `src/` only ("front"), which left real gaps the owner then caught. Round 2
covers **all rendered surfaces**:
- **`src/`** — incl. the shared dynamic wordmark components `ProductName` (Landing) and
  `BrandName` (ArgoOneLanding). See the gotcha below.
- **`public/sales/argo-instituciones.html`** — the institutions sales deck (all wordmarks,
  `®` after the `+` on `ArgoOne+®`).
- **`api/`** — email templates, crons, AND the Puente report + its AI-generation prompt
  (`generate-puentes.ts`), so new reports/emails say `ArgoPuente®`, not `Argo Puentes`.
  From display-names protected.
- **`index.html`** visible title / og:title / twitter:title / og:site_name / noscript `<h1>`,
  and **`manifest.json`** name.

### The gotcha that caused the missed round
`ProductName` and `BrandName` render `Argo` + `{rest}` across **separate spans**, so the
contiguous string `"ArgoOne"` never appears in source — a string regex/grep will not find
them. The `®` had to be added **inside the component**. Any new dynamic wordmark component
has the same trap.

### Deliberately left as-is (not a miss)
JSON-LD / schema.org in `index.html` (structured-data entity = `"Argo Method"`); email From
display-names; `public/llms.txt` (machine doc); internal-only `preview/*.html`,
`design-system/`, `docs/*.md`, `supabase/migrations`.

## As-built

- Round 1: 48 `src/` files (`scripts/brandify-frontend.mjs`).
- Round 2: `ProductName` ® fix + `public/sales/argo-instituciones.html` (manual span edits) +
  36 `api/` files (`scripts/brandify-api.mjs`, protects From-names) + `index.html` +
  `manifest.json` + `assets/ads/concept-a/*.html`.
- Verified each round: `tsc` (src + `typecheck:api`) clean, `vite build` green,
  `check:api-imports` OK, no identifier corruption, no `®®`, and a Playwright brand smoke
  (Landing / one / pricing / report / puentes / the deck) 6/6 green.
- Reusable idempotent scripts: `scripts/brandify-frontend.mjs`, `scripts/brandify-api.mjs`.
  Neither handles the split-span One/One+ wordmarks nor the dynamic components — those stay
  manual.
