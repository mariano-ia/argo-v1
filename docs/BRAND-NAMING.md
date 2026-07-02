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

## Scope: frontend only (as of this pass)

The 2026-07-02 pass changed **`src/` only** (owner: "hacé el cambio solo en front"). The
backend **`api/`** (email templates, crons, webhooks) still carries the OLD forms
(`Argo Puentes`, `Argo Method`, `ArgoOne`, no ®). **This is a known inconsistency:**
web UI shows `ArgoPuente®` / `ArgoMethod®`, emails still show `Argo Puentes` / `Argo Method`.
Align `api/` in a dedicated follow-up before it matters for live sends (respecting the
three exceptions above — especially the From display-names).

## As-built (2026-07-02)

- 46 `src/` files updated. Verified: `tsc --noEmit` clean, `vite build` green, no identifier
  corruption, no `®®`, JSON-LD preserved.
- Bulk pass was deterministic (idempotent regex); context-sensitive span wordmarks
  (`ArgoOne` / `ArgoOne+` split spans, the `BrandName` component with a conditional `+`)
  were edited by hand so the `®` lands after the `+`.
- Reusable script: `scripts/brandify-frontend.mjs` (walks `src/`, applies the span-join
  and contiguous-string rules; excludes `BlogPost.tsx` contiguous strings for the JSON-LD
  exception). Re-run is safe (idempotent). **It does not handle the split-span One/One+
  wordmarks** — those stay manual.

## Rendered-form counts after the pass (src/)

`ArgoMethod®` ×92 · `ArgoPuente®` ×36 · `ArgoOne®` ×39 · `ArgoOne+®` ×4
(plus the split-span wordmarks in `OnePanel`, `Landing`, `ArgoOneLanding`).
