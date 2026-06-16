# Context Switcher — Implementation Plan

Status: **design locked 2026-06-16, not built.** This is the implementation
reference. It supersedes nothing yet; no code/migrations applied.

Builds on `docs/CLUB-TEAMS-HIERARCHY.md` (plantel/grupo model). Design rationale
lives in the conversation that produced this; the locked decisions are below.

---

## 1. Goal

One person, one login, can belong to **several institutions** and, within each,
wear different **hats** (Administración or a specific plantel they coach). A
single **context switcher** (institución × sombrero) is the only source of
"scope": whatever is selected reconfigures the entire dashboard (data + nav).

This solves two current pain points:
- An admin has no simple way to also act as a coach of a plantel.
- A coach cannot belong to more than one institution.

## 2. Core model (recap of locked decisions)

- **Identity ≠ membership ≠ assignment.** One auth user (identity) → many
  memberships (one per institution) → each membership has a **level**
  (admin/coach) + **plantel assignments**.
- **Coach is a capability, not an exclusive role.** An admin with planteles
  assigned = the admin who also coaches.
- **One active context at a time.** Each plantel is its own context
  (Slack-style). No "all my links on one screen".
- **Blocking is per-institution/per-context.** Plan lives on the tenant, so a
  person can have one membership live and another blocked. Never blocks the
  identity.

### The hats available per membership
Given a membership in tenant T:
- If `role ∈ {owner, admin/member}`: hats = `["Administración"]` + one hat per
  plantel they are assigned to (via `group_coaches`).
- If `role = coach`: hats = one hat per assigned plantel (no "Administración").

So `membership.role` is the **permission level**, and the **active hat** is
chosen in the switcher among the hats above.

## 3. Current state (grounded)

**Schema already supports most of this:**
- `tenant_members`: PK `id`, `tenant_id`, `auth_user_id` (FK auth.users,
  nullable), `email`, `role` (`owner|member|coach`), `status`
  (`pending|active`). UNIQUE is `(tenant_id, lower(email))` — **not** global on
  email → the same identity can already be a member of multiple tenants.
- `group_coaches` (group_id, member_id) M:N → a coach already maps to many
  planteles within a tenant. No constraint blocks an owner from appearing here.
- `tenants`: `plan`, `roster_limit`, `trial_expires_at`, `subscription_*`,
  UNIQUE `auth_user_id`.
- `chem_groups.owner_member_id` → groups are per-member.

**App-layer blockers (the real work):**
- `api/tenant-info.ts` resolves the caller's tenant with `.maybeSingle()` →
  assumes one tenant per user. No context selection.
- `api/invite-user.ts` calls `auth.admin.generateLink({type:'invite'})`, which
  fails with `email_already_exists` when the email is already a registered auth
  user → cannot add an existing coach to a second institution.
- `src/pages/TenantDashboard.tsx` fetches a single tenant, derives
  `isCoach = role === 'coach'`, builds nav from it, fires `TrialEndModal`
  globally from the single tenant.
- `src/pages/tenant/TenantHome.tsx` lists each assigned team with its name +
  its own `LinkWidget` (disabled when `active_players_count >= roster_limit`).
- Scoped read endpoints (`tenant-sessions`, `tenant-groups`,
  `tenant-chem-groups`, `tenant-chat`, `tenant-members`, …) infer the tenant
  from the caller's single membership — they do **not** take an explicit
  tenant_id.

**Structural caveat (out of scope):** `tenants.auth_user_id` is UNIQUE → an
identity can OWN only one institution. Being a coach elsewhere is fine. If
"owner of A + owner of B" is ever needed, ownership must move into
`tenant_members`. Design without breaking this, but do not build it now.

## 4. The central abstraction: `ActiveContext` + scope

Introduce a single value that drives everything:

```
ActiveContext = {
  tenantId: string,
  hat: 'admin' | { plantelId: string },
}
```

- The client holds the active context and passes `tenantId` (+ `plantelId` when
  the hat is a plantel) to every scoped API call.
- The server **re-authorizes** every call against that tenant/plantel (see §5).
- Data scope:
  - `hat = 'admin'`: all planteles/players of the tenant; admin nav
    (Usuarios + Planteles visible).
  - `hat = plantelId`: only that plantel's players; coach nav.
- Persisted client-side first (localStorage key per auth user, e.g.
  `argo_active_context_<userId>`). Optional server persistence
  (`tenant_members.last_active_at` or a `user_prefs` row) can come later; not
  required for v1.

The Outlet context in `TenantDashboard` (today `{ tenant, role, teams,
memberId, … }`) is extended to expose: `memberships` (all contexts), the
`activeContext`, a `setActiveContext` setter, and the resolved `scope`
(tenant + hat + plan status). Every page reads scope from there instead of
assuming a single tenant.

## 5. Authorization (critical, cross-cutting)

Because one identity now belongs to many tenants, **every** server endpoint must
stop inferring the tenant from "the caller's only membership" and instead:

1. Read an explicit `tenant_id` (and `plantel_id` when relevant) from the
   request.
2. Verify the caller has an **active** `tenant_members` row for that
   `tenant_id`.
3. For a coach hat, verify the caller is assigned to that `plantel_id` via
   `group_coaches`; for an admin hat, verify the membership role is admin-level.
4. Enforce the tenant's plan/block state for write actions (read-only when
   blocked — see §8).

This is the highest-risk change: it touches the authorization of all
`/api/tenant-*` endpoints. Treat it as a security task, not a plumbing one. A
regression here could expose one tenant's data to a member of another.

## 6. Data model changes

Minimal. The schema already supports multi-membership and coach M:N.
- **No required migration for the core.** Owners can self-assign to planteles by
  inserting `group_coaches` rows (already allowed by the schema); only the app
  blocks it today.
- **Optional (later):** persist active context server-side (`user_prefs` table
  or a column) for cross-device continuity. v1 uses localStorage.
- **Confirm** the `role` CHECK includes `coach` (added in
  `20260610_teams_hierarchy.sql`); keep `role` meaning the permission level.

## 7. API changes

- **`tenant-info` → contexts list.** Return ALL active memberships, each with:
  tenant summary (`id, slug, display_name, plan, roster_limit,
  active_players_count, trial_expires_at`), the membership `role`, the assigned
  planteles (id, name, slug), and a derived **plan/block status**
  (`active | trial | trial_expired | blocked`). Keep a back-compat shape for
  single-membership callers (the common case must behave identically).
- **All scoped read endpoints** (`tenant-sessions`, `tenant-groups`,
  `tenant-chem-groups`, `tenant-chat`, `tenant-members`, `tenant-setup`,
  archive/save, …): accept explicit `tenant_id` (+ `plantel_id` for coach
  scope), authorize per §5, scope results to the hat.
- **`invite-user` → attach-or-create.** If the email is already a registered
  auth user (or already an active member elsewhere): do NOT call
  `generateLink`; instead insert the `tenant_members` row (+ `group_coaches`
  assignments) linked to the existing `auth_user_id`, and send an
  "added to institution" email. Keep the create-new-identity path for genuinely
  new emails. (Optional follow-up: a "join as coach" link per plantel for
  self-service, sidestepping email entirely.)
- **`create-tenant` / signup:** unaffected by design (owner of one), but verify
  a person who already has memberships can still create their own institution
  and that signup routes them sensibly.

## 8. Billing / blocking per context

- "Blocked" is **derived from the tenant's plan state**
  (`trial_expired | cancelled | unpaid`). No new field on the membership.
- A blocked institution **still appears in the switcher** with a "Pausada"
  badge. Selecting it → **read-only** + a role-aware message (no data loss,
  consistent with today's cancel/trial behavior):
  - Admin/owner: "Reactivá tu plan." (they pay)
  - Coach: "Esta institución está pausada. Hablá con el administrador." (coaches
    never pay; collateral)
- The **switcher is always reachable**, even from a blocked context — never trap
  the user; they can jump to a live institution.
- Trial/block gating becomes **per active context** (today `TrialEndModal` +
  read-only fire at the dashboard root on the single tenant). Move them so they
  fire for the active context's tenant only.
- **Separate, not payment:** "suspend a member" (an admin revoking a coach's
  access) would be a per-membership status. Out of scope unless requested.

## 9. UI changes

- **Context switcher** at the top of the sidebar (`TenantDashboard` Sidebar).
  Level 1 = institución; nested under the current one = the hats
  (Administración + assigned planteles). Shows the active context as selected.
  "Pausada" badge on blocked institutions. Always interactive.
- **Context chip:** clickable (opens the switcher / ✕ returns to Administración),
  rendered **only when the hat is a plantel**, in the page header of data
  screens (Inicio, Jugadores, Destacados) and optionally next to the user name
  in the footer. Reminder + shortcut.
- **Users page** (`TenantUsers.tsx`): split the single role control into two —
  a **Nivel** selector (Administración/Entrenador) and **Planteles** chips
  (multi-select with `[+]`). The caller's own row becomes editable so they can
  self-assign planteles. A member can be Administración **with** planteles.
  Add an "Asignarme" shortcut on the plantel detail (`TenantGroups.tsx`).
- **Home share area** (`TenantHome.tsx` + `LinkWidget.tsx`): remove the
  team-name label above the share button. In a plantel context, the area is
  just "Link de juego" + copy (one active plantel = one link). `LinkWidget`
  stops receiving/showing the plantel name.
- **Nav** is driven by the active context's hat, not a single `role` field.

## 10. Phased rollout

Order = least → most risky. Each phase ships to `develop` (Vercel preview) and
is verifiable on its own. The common case (single membership) must behave
identically throughout.

### Phase 1 — Base, invisible
- `tenant-info` returns all memberships + per-membership plan/block status.
- Introduce `ActiveContext` + scope in the Outlet context; default it to the
  user's single (or first) membership so nothing visibly changes yet.
- Persist active context in localStorage.
- **Acceptance:** existing single-membership users see no change; the new
  contexts payload is present and correct for a seeded multi-membership QA user.
- **Risk:** low. No UI, no authz change yet. Rollback = revert endpoint shape.

### Phase 2 — Scoped endpoints + authorization
- Make every scoped `/api/tenant-*` endpoint take explicit `tenant_id`
  (+ `plantel_id`) and authorize per §5.
- Client passes the active context to all calls.
- **Acceptance:** a member of two tenants can only read each tenant's data when
  that tenant is the active context; cross-tenant access is denied (negative
  tests). Single-membership behavior unchanged.
- **Risk:** HIGH (security). Land behind tests; review authz on each endpoint.
  Rollback = endpoints fall back to implicit single-tenant resolution.

### Phase 3 — The switcher + context-driven nav/scope
- Build the switcher UI; wire `setActiveContext`.
- Nav, Inicio, Jugadores, Destacados, Argo Coach, Predictor, Grupos all read
  scope from the active context.
- **Acceptance:** switching context visibly changes data + nav; admin vs plantel
  hats render the right surfaces.
- **Risk:** medium (broad UI surface). Rollback = hide switcher, force admin hat.

### Phase 4 — Per-context billing/blocking
- Move `TrialEndModal` + read-only to the active context's tenant.
- "Pausada" badge + role-aware blocked state + always-reachable switcher.
- **Acceptance:** with one live + one blocked membership, the live one works
  fully and the blocked one is read-only with the correct per-role message; the
  switcher escapes the blocked context.
- **Risk:** medium. Rollback = global gating (current behavior).

### Phase 5 — Multi-institution onboarding + admin-as-coach UX
- `invite-user` attach-or-create for existing identities (+ optional join link).
- Users page redesign (Nivel + Planteles), self-assign, "Asignarme" shortcut.
- Context chip; remove team-name above the share button.
- **Acceptance:** an existing coach can be added to a second institution without
  `email_already_exists`; an admin can self-assign a plantel and see its link.
- **Risk:** medium. Rollback = keep current invite + Users UI.

## 11. Backward compatibility

The single-membership user (today's norm) must be unaffected at every phase: one
membership → one context auto-selected → dashboard looks and behaves as today.
The switcher can hide itself when the user has exactly one institution and one
hat.

## 12. Out of scope (explicit)

- Multi-ownership (`tenants.auth_user_id` uniqueness) — owner of two
  institutions.
- "Suspend member" (admin revokes a coach) — a per-membership status unrelated
  to payment.
- Server-side persistence of the active context (localStorage is enough for v1).

## 13. Testing

- Seed a QA identity with two memberships: admin of A (one plantel self-assigned)
  + coach of B (two planteles).
- E2E: switch contexts (data + nav change), one-link-per-plantel on Home, blocked
  context read-only + role message + escape via switcher, invite-existing-email
  attaches membership.
- Authorization negative tests: deny cross-tenant reads/writes when the tenant is
  not the active (and authorized) context.

## 14. Open questions

- Switcher density when a coach has many planteles (nest under institution;
  scroll). Confirm the nesting rule holds visually.
- Whether to surface a tenant's own play links in the **admin** hat (e.g., a
  Planteles overview listing each link) vs. only inside each plantel context.
