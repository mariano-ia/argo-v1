# Admin roles (superadmin dashboard)

Since 2026-07-04 the superadmin panel supports two admin roles, stored in
`admin_users.role` (`text NOT NULL DEFAULT 'superadmin'`, CHECK in
(`'superadmin'`, `'limited'`)). Migration: `supabase/migrations/20260704_admin_users_role.sql`
(applied to prod via MCP the same day).

## Roles

| Role | Access |
|---|---|
| `superadmin` | Full panel (all 14 tabs). Default, so pre-existing admins are unaffected. |
| `limited` | Only: Sesiones, Tenants (all actions), Consumo IA, Contactos, Blog. |

## Enforcement model (Option A: UI-level, deliberate)

- `src/components/AdminRoute.tsx` fetches `id, role` in the SAME query that decides
  admin membership (single query avoids a first-load race that would redirect the
  owner) and provides the role via `AdminRoleContext`. Exports:
  - `useAdminRole()` — current role.
  - `LIMITED_ADMIN_TABS` — single source for the allowed tab set.
  - `SuperadminOnly` — route guard, redirects limited admins to `/admin`.
- `src/pages/Dashboard.tsx` filters `NAV_ITEMS` by role (sidebar).
- `src/App.tsx` wraps restricted child routes (metrics, revenue, argo-one, audit,
  health, feedback, questions, users, principia) in `SuperadminOnly`, so direct
  URLs are blocked too.
- Server-side, ONLY `api/admin-users.ts` enforces the role: POST/DELETE return 403
  for limited callers (privilege-escalation guard) and unknown `role` values in
  POST are rejected with 400 (fail closed). The other `admin-*` endpoints still
  accept any admin: a limited admin who crafts direct API calls could read hidden
  data (e.g. revenue). Accepted trade-off for a non-technical co-admin; upgrade
  path is pasting a role check into each endpoint (they cannot share imports).

## Creating a co-admin

Admins tab → Agregar admin → email + password (min 12 chars) + selector
"Acceso completo" / "Acceso limitado". Creates the Supabase Auth user with the
email pre-confirmed (no email is sent); credentials are shared manually.
The list shows a role badge per admin ("Completo" / "Limitado").

## Known limitations / future work

- Role is set at creation only; changing it requires SQL (`UPDATE admin_users SET role = ... WHERE email = ...`).
- Pre-existing holes surfaced during this work (independent of roles, still open):
  `api/blog-now.ts` has no auth at all, and `admin_audit_log` RLS is
  `USING(true) TO PUBLIC` (any authenticated user can read it via REST).
