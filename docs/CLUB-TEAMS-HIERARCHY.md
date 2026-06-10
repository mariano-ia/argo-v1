# Club → Teams → Coaches + Players hierarchy

Status: implemented on `develop` (2026-06-10). DB migration applied to prod Supabase (`Argo`, ref `luutdozbhinfiogugjbv`). Additive only; production `main` is unaffected.

## What this delivers

The club (tenant) is no longer one shared list. It now has:

- **Equipos (teams)** — created by the institution admin. Each team has its own play link.
- **Entrenadores (coaches)** — invited by the admin and assigned to one or more teams. A coach sees only the players of their teams (dashboard, players list, and the AI consultant are all scoped). Coaches do not see the Users section.
- **Jugadores (players)** — a player is a completed session. When a child plays via a team's link they land in that team automatically. A player is a single canonical record: re-playing updates the same player (no duplicate, one roster slot), and the update is reflected in every team the player belongs to.
- **Mover / compartir** — the admin can move a player between teams or share a player across two teams (one profile, one slot, visible to both coaches).

The old "Dinámica Grupal" feature is renamed: the section is **"Equipos"** and the collective-profile analytics inside a team is **"Química del equipo"**.

## Data model (migration `20260610_teams_hierarchy.sql`)

Teams reuse the existing `groups` / `group_members` tables (names kept so production `main` keeps working). Changes, all additive:

- `groups.slug` — unique, auto-generated (`encode(gen_random_bytes(6),'hex')`). The per-team play-link slug. Existing rows backfilled; column is `NOT NULL`.
- `group_coaches (group_id, member_id)` — coach ↔ team assignment (M:N). `member_id` → `tenant_members(id)`. RLS denies direct client access (service-role API only).
- `tenant_members.role` CHECK now allows `'coach'` (was `owner|member`).
- Backfill: every tenant with ungrouped active players got a default team named **"General"** with those players attached. (All current tenants are test data.)

Player ↔ team membership = `group_members` (already M:N, which is what makes "compartir" free). Coach scoping derives from `group_coaches → group_members → sessions`.

## How attribution works (the key mechanism)

- The play link is `argomethod.com/play/:tenantSlug/:teamSlug` (the old `/play/:tenantSlug` still works and lands the player tenant-level/unassigned).
- `start-play` resolves the team slug within the tenant and signs the team id into the existing HMAC `play_token` (payload `{t, tm, exp}`). The team id is therefore **server-verified and unspoofable**, exactly like `tenant_id`.
- `session.ts` extracts the team from the verified token and:
  - **Identity dedup**: looks up an existing active player by `tenant_id + adult_email + child_name` (case-insensitive). If found, it updates that player in place (re-profile) instead of inserting — no new row, no extra roster slot. Otherwise it inserts a new player.
  - **Team membership**: attaches the player to the team via `group_members` (idempotent, additive).

## Roles & scoping

- **Admin** = tenant `owner` (label: "Administrador de la institución"). Sees all players and all teams; can create teams, invite/assign coaches, move/share players. Legacy `member` is treated as admin (full visibility) for backward-compat.
- **Coach** = `tenant_members.role = 'coach'`. Sees only players in their assigned teams across: `tenant-sessions`, `tenant-groups` (list + detail), and `tenant-chat` (AI consultant roster + mentioned-player injection). The Users nav and page are hidden/blocked for coaches. A coach can copy their team link to invite players.

## How to test (on the develop preview)

1. Log in as an existing (admin) tenant. Open **Equipos**. You'll see your teams (test tenants now have a "General" team). Create a new team.
2. Select a team → copy its **play link** (it's `/play/<tenant>/<team>`). Assign a coach (after step 3).
3. Open **Usuarios** → invite a user as **Entrenador**, optionally pick teams to assign. They get the invite email → set password → they're a coach.
4. As the coach (log in with that account): you should see only the players of your team(s), no **Usuarios** section, and the **Argo Coach** assistant only knows your players.
5. Play the odyssey via a team link (`/play/<tenant>/<team>`) → the finished player appears in that team, attributed to its coach.
6. Re-play with the same adult email + child name → the same player updates (no duplicate, roster count unchanged).
7. As admin, in a team's detail use **Agregar jugadores** / the per-player **X** to share/move players between teams.

## Decisions made (all reversible)

- Admin label: "Administrador de la institución". New role: "Entrenador". ("Superadmin" stays reserved for the Argo global dashboard.)
- Identity key for dedup: tenant + adult email + child name.
- Each existing tenant got a default "General" team with its players.
- "Dinámica Grupal" → section **"Equipos"**, analytics → **"Química del equipo"** (en: Teams / Team chemistry; pt: Equipes / Química da equipe).
- Membership on play is single-team (the link used); move/share are admin actions.
- Team creation is allowed on all plans (teams are structural, not a premium analytic). The chemistry analytics stays locked on trial, as before.
- Mutations (create/rename/delete/assign coach/add-remove players/move-share) are admin-only, enforced server-side.

## Deferred / known limitations (not blockers)

- **Players-page team filter + a dedicated one-click "move" UI**: the `set_player_teams` endpoint (atomic move/share) exists but the players list doesn't yet expose a team filter or a move dialog. Today move/share is done from a team's detail (add/remove members). `tenant-sessions` already returns `team_ids` per player to drive a future filter/column.
- **Team name on the play screen**: attribution is silent (no "estás jugando con el equipo X" confirmation yet).
- **Per-member chat history**: `tenant-chat` scopes the player context to the coach, but chat threads are still tenant-wide (a coach could see another member's past threads). Player data (the sensitive part) is scoped; thread isolation is a follow-up.
- **Re-profile at a full roster**: `start-play`'s roster pre-gate runs before the child is identified, so a re-play could be blocked at a full roster. Dedup prevents double-counting on save; the pre-gate edge is unsolved (would require passing identity to start-play).
- **RLS defense-in-depth on `sessions`**: scoping is enforced in the service-role API. A second RLS layer on `sessions` keyed off team membership is a worthwhile follow-up for minors' data.

## Files changed

- Migration: `supabase/migrations/20260610_teams_hierarchy.sql`
- API: `api/tenant-info.ts`, `api/tenant-sessions.ts`, `api/tenant-groups.ts`, `api/tenant-members.ts`, `api/invite-user.ts`, `api/start-play.ts`, `api/session.ts`, `api/tenant-chat.ts`
- Frontend: `src/App.tsx`, `src/pages/TenantPlay.tsx`, `src/pages/TenantDashboard.tsx`, `src/pages/tenant/TenantGroups.tsx`, `src/pages/tenant/TenantUsers.tsx`, `src/lib/dashboardTranslations.ts`

## Verification run before commit

`check:api-imports` ✓ · `typecheck:api` ✓ · `tsc` (src) ✓ · `qa:unit` ✓ · `lint:content` ✓ · `vite build` ✓.
(`npm run lint` is pre-existing broken — no ESLint config file in the repo.)
