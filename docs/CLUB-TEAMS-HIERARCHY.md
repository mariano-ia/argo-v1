# Club → Planteles → Entrenadores + Jugadores (jerarquía multi-tenant)

> Estado: **en producción** (`main`, argomethod.com) desde 2026-06-10. Migraciones aplicadas a la prod Supabase (`Argo`, ref `luutdozbhinfiogugjbv`).
> Esta es la fuente de verdad del modelo. El registro cronológico de cómo se construyó está en [CHANGELOG-2026-06-10.md](CHANGELOG-2026-06-10.md).

## El modelo (definitivo)

El club (tenant) dejó de ser una lista compartida. La jerarquía es:

- **Club** = el tenant. Lo administra el **Administrador de la institución** (rol `owner`), que ve todo.
- **Plantel** = la unidad **estructural**. **Es dueña del link de juego.** El admin crea planteles y les asigna entrenadores. El plantel persiste aunque el entrenador se vaya. (DB: tabla `groups`; el nombre de la tabla se mantuvo para no romper, el concepto se llama "plantel".)
- **Entrenador** (rol `coach`) = se asigna a uno o más planteles. Ve **solo** los jugadores de sus planteles (scoping en todos lados: lista, dashboard, Argo Coach). Comparte el link de su plantel desde Inicio. No ve la sección Usuarios.
- **Jugador** = una sesión completada. Cuando un niño juega por el link de un plantel, queda atribuido a ese plantel automáticamente. Identidad canónica: re-jugar actualiza al mismo jugador (sin duplicado, un solo cupo).

Y, **separado de lo anterior**:

- **Química de grupos** = herramienta **analítica** (tabla `chem_groups` + `chem_group_members`). El admin y el entrenador arman grupos con sus propios jugadores para analizar la química. **No tiene link, no asigna entrenadores.** Es por-usuario.

> **Plantel ≠ Grupo.** El plantel es estructura (dueño del link, lo crea el admin). El grupo es análisis (lo arma cada usuario con sus jugadores). Al principio ambos vivían en `groups`; el 2026-06-10 se separaron.

## Reglas de potestad (quién puede qué)

| Acción | Admin (owner) | Entrenador (coach) |
|---|---|---|
| Crear/renombrar/eliminar **planteles** | ✅ | ❌ |
| Asignar/quitar **entrenadores** de un plantel | ✅ | ❌ |
| Ver **todos** los jugadores de la institución | ✅ | ❌ (solo los de sus planteles) |
| **Gestionar** jugadores (archivar, reenviar informe, reactivar) | ❌ | ✅ (los suyos) |
| Descargar PDF del informe | ✅ | ✅ |
| **Compartir link de juego** | ✅ **solo si está asignado a un plantel** | ✅ (el de sus planteles) |
| Crear **grupos** (Química de grupos) | ✅ (con sus jugadores) | ✅ (con los suyos) |
| Usuarios, facturación, ajustes de institución | ✅ | ❌ |

Principios clave (decisiones del owner):
- **El link es del plantel, no del entrenador.** Hay un link por plantel. El entrenador decide a qué grupos lo asigna después.
- **La potestad de los jugadores es del entrenador.** El admin ve a todos en solo lectura (incluido el listado dentro de cada plantel, donde cada jugador abre el informe completo con descarga de PDF); archivar/reenviar son del entrenador.
- **El admin solo envía juegos si también es entrenador de un plantel.** No hay link institución-wide: ese link no tendría plantel al cual atribuir. ("No queremos administradores de clubes compartiendo links.")

## Modelo de datos (migraciones)

Todo aditivo. Aplicado a prod vía MCP el 2026-06-10.

| Migración | Qué agrega |
|---|---|
| `20260610_teams_hierarchy.sql` | `groups.slug` (único, `encode(gen_random_bytes(6),'hex')`, NOT NULL) = slug del link por plantel; `group_coaches(group_id, member_id)` (asignación coach↔plantel, M:N, `member_id`→`tenant_members.id`, RLS deny); `tenant_members.role` CHECK ahora permite `'coach'`; backfill de planteles "General". |
| `20260610_chat_messages_member_scope.sql` | `chat_messages.member_id` + backfill al owner → historial de Argo Coach por-usuario. |
| `20260610_chem_groups_analytic_tool.sql` | `chem_groups(id, tenant_id, owner_member_id, name, created_at, deleted_at)` + `chem_group_members(group_id, session_id)` + RLS deny. = la herramienta "Química de grupos", separada de planteles. |
| `20260610_ai_events_group_ids.sql` | `ai_events.group_ids text[]` = scope de planteles del coach en cada evento del chat → telemetría drill-down por plantel. |

- Atribución jugador↔plantel = `group_members` (M:N). El scoping del coach deriva de `group_coaches → group_members → sessions`.
- Atribución jugador↔grupo = `chem_group_members`.

## Cómo funciona la atribución (mecanismo clave)

- El link es `argomethod.com/play/:tenantSlug/:plantelSlug`. (`/play/:tenantSlug` solo sigue ruteando pero ya no se ofrece en el dashboard: dejaría al jugador sin plantel.)
- `start-play` resuelve el slug del plantel dentro del tenant y firma el `team_id` dentro del `play_token` HMAC (payload `{t, tm, exp}`, firmado con el service-role key). El plantel queda **verificado server-side e infalsificable**, igual que el `tenant_id`.
- `session.ts` extrae el plantel del token verificado y:
  - **Dedup de identidad**: busca un jugador activo por `tenant_id + lower(adult_email) + lower(child_name)`. Si existe, lo actualiza en lugar (re-perfilado) — sin fila nueva, sin cupo extra. Si no, inserta.
  - **Membresía**: lo ata al plantel vía `group_members` (idempotente). Desde 2026-06-10 el error del upsert se loguea (antes era silencioso).

## Las secciones del dashboard (estado final)

- **Inicio**: stats + el/los link(s) de los planteles asignados (ambos roles). Si no hay plantel asignado, un aviso (no el link institucional).
- **Jugadores** (antes "Mi equipo"): todos los jugadores de la institución (admin) / los del coach (coach), con **filtro por plantel** (admin). El admin es solo lectura de gestión (PDF sí; archivar/reenviar no).
- **Planteles** (solo admin): lista de planteles + su(s) entrenador(es) + ABM (crear/renombrar/eliminar). Los entrenadores se asignan con **chips toggleables** (tocar para asignar/quitar, **con confirmación**) más un chip **"Yo"** para autoasignarse en un toque. No se crean usuarios desde aquí (eso es en Usuarios). El plantel muestra su **listado completo de jugadores**; cada jugador se expande al informe completo con descarga de PDF. El admin gestiona en solo lectura (PDF sí; archivar/reenviar son del entrenador). Sin link.
- **Química de grupos**: arma grupos con tus jugadores y analiza la química (GroupBalancePanel). Ambos roles, scopeado.
- **Argo Coach** (chat): consultor IA, scopeado al coach; historial por-usuario.
- **Usuarios** (solo admin): crear usuarios (email + nivel Entrenador/Administrador), cambiar el nivel de un miembro, reenviar invitación (pendiente) y eliminar. Los planteles de cada miembro aparecen como **chips de solo lectura** (informativos, sin X). La asignación a planteles se hace **solo** en la sección Planteles.
- **Guía / Ajustes**: ajustes de institución solo del owner; el coach edita su propio perfil.

## Roles & scoping (resumen técnico)

- **Admin** = `owner` (o `member` legacy, tratado como admin). Visibilidad total.
- **Coach** = `tenant_members.role = 'coach'`. Scopeado en `tenant-sessions`, `tenant-groups`, `tenant-chem-groups` y `tenant-chat` (roster + inyección del jugador mencionado). Mutaciones admin-only enforced server-side (`if (!isAdmin) return 403` al tope del POST).

## Datos demo (Club San Fernando)

Para pruebas, el coach "Entrenador Marian" (`hello@storyhunt.city`) de **Club San Fernando** tiene **20 jugadores demo** (10 + 10 en sus 2 planteles), perfiles DISC válidos y diversos (los 12 arquetipos), deporte = Rugby (el del club). Marcados `is_demo = true` y con `email_sent_at` seteado (el cron de recovery no los toca). Borrables en cualquier momento (`WHERE is_demo = true`).

## Verificación (corrida antes de mergear a main)

`tsc` (src) ✓ · `typecheck:api` ✓ · `check:api-imports` ✓ · `lint:content` ✓ · `vite build` ✓. DB: RLS en todas las tablas de la jerarquía, 0 huérfanos, 0 fugas cross-tenant.

## Auditoría (2026-06-10)

Auditoría exhaustiva multi-agente (6 dimensiones, 28 agentes, cada hallazgo verificado adversarialmente). Confirmó seguridad y coherencia; los hallazgos accionables se implementaron antes de ir a prod (ver el changelog, fase J, y [CHECK-SYSTEM.md](CHECK-SYSTEM.md) §11 para los ajustes de Vigía). Decisiones de NO-implementar (del owner): no filtrar `is_demo` del dashboard (querés ver los demo), y no mostrar el link del plantel en la página Planteles (no querés admins enviando juegos).

## Archivos principales

- Migraciones: `supabase/migrations/20260610_*.sql` (teams_hierarchy, chat_messages_member_scope, chem_groups_analytic_tool, ai_events_group_ids).
- API: `api/tenant-info.ts`, `api/tenant-sessions.ts`, `api/tenant-groups.ts`, `api/tenant-chem-groups.ts`, `api/tenant-members.ts`, `api/invite-user.ts`, `api/start-play.ts`, `api/session.ts`, `api/tenant-chat.ts`, `api/tenant-setup.ts`, `api/cancel-subscription.ts`.
- Frontend: `src/App.tsx`, `src/pages/TenantPlay.tsx`, `src/pages/TenantDashboard.tsx`, `src/pages/tenant/{TenantHome,TenantPlayers,TenantGroups,TenantGrupos,TenantUsers,TenantOnboarding,TenantChat}.tsx`, `src/components/ui/Tooltip.tsx`, `src/lib/dashboardTranslations.ts`.
