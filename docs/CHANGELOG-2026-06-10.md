# Changelog — 2026-06-10 · Finalización de la jerarquía Club/Plantel/Grupo

Registro metódico de todo lo hecho el 2026-06-10. 20 commits en `develop`, migraciones a prod, datos demo, auditoría exhaustiva y fixes. Mergeado a `main` (producción) al cierre del día.

Estado del modelo final: [CLUB-TEAMS-HIERARCHY.md](CLUB-TEAMS-HIERARCHY.md). Ajustes de monitoreo: [CHECK-SYSTEM.md](CHECK-SYSTEM.md) §11.

---

## Fase A — Fundación de la jerarquía (mañana)

`a87eb5a` · **club → planteles → entrenadores + jugadores.** Migración `20260610_teams_hierarchy.sql` (groups.slug, group_coaches, rol 'coach', backfill "General"). Atribución por link de plantel firmada en el play_token. Dedup de identidad. Scoping del coach en sessions/groups/chat.

`4f19d4c` · **crear plantel inline al invitar un entrenador** (desde Usuarios).

> **Superseded (2026-06):** el formulario de invitación ya no asigna ni crea planteles; solo pide email + nivel. Los planteles se crean en Planteles y la asignación se hace allí con chips toggleables. Ver `CLUB-TEAMS-HIERARCHY.md`.

`b6aa8b0` · **scoping por rol de ajustes + link de juego** para coaches (settings owner-only; el coach ve su link, no el institucional).

`b297f24` · **historial de Argo Coach por-usuario.** Migración `20260610_chat_messages_member_scope.sql` (chat_messages.member_id).

`65a1bf4` · rename de la sección a "Química de grupos" + simplificación de la vista del coach.

## Fase B — El split (la corrección de fondo)

`580c8d4` · **separar Planteles (estructural) de Química de grupos (analítico).** Migración `20260610_chem_groups_analytic_tool.sql` (chem_groups + chem_group_members). Endpoint `api/tenant-chem-groups.ts`. Página `TenantGrupos.tsx`. Antes ambos conceptos vivían en `groups`; se separaron porque conflaban estructura (dueña del link) con análisis (sin link).

## Fase C — Destacados del dashboard

`2470792` · ocultar el badge de plan/roster a los entrenadores.
`d4f9bdf` · reorganizar los stat cards por rol.
`79523da` · unificar: los mismos 4 destacados para admin y coach (Jugadores · Planteles · Este mes · Grupos), con tooltips por rol.

## Fase D — Finalización del dashboard club

`77560d1` · **Jugadores** (antes "Mi equipo"): rename + **filtro por plantel** (admin); **Planteles** adelgazado; **link solo por plantel** (saqué el institucional de Inicio/Jugadores/Guía; en Inicio se muestran los links de los planteles asignados).

`30beda2` · **Planteles**: listado de jugadores del plantel en **solo lectura** para el admin.

`1226381` · **admin solo lectura en jugadores** (sin archivar/reenviar/reactivar; PDF queda) — la potestad de los jugadores es del entrenador. Filas de jugador estilo "Jugadores" en Planteles (nombre + arquetipo + edad + deporte).

> **Superseded (2026-06):** el listado de jugadores en Planteles ahora muestra el roster completo y cada jugador se expande al informe completo con descarga de PDF (admin en solo lectura: PDF sí; archivar/reenviar del entrenador). Ver `CLUB-TEAMS-HIERARCHY.md`.

## Fase E — Detalles de UX

`d7a2e6d` · ícono (i) con tooltip al lado de "Descargar PDF" (explica que es el informe extendido que reciben los padres).
`349c61b` · **fix: el tooltip del (i) ya no se corta** — InfoTip pasado a portal con posición fija, anclado a la derecha y clampeado al viewport (escapa al overflow-hidden). Mejora todos los (i) de la app.
`94e0628` · pulir el copy del Inicio cuando el admin no tiene plantel asignado.

## Fase F — Sincronización de copy con el modelo

`420903d` · sync de labels de onboarding/intro/landing/chat/signup ("Dinámica Grupal"→"Química de grupos", "Mi equipo"→"Jugadores", etc.).
`1a26478` · **reescritura del onboarding del club** al modelo plantel (slide "La estructura" con visual Plantel→Entrenador→Familias; primer paso "crea un plantel"; sin el botón de copiar link institucional).
`ea07092` · alinear email de invitación + pricing ("Grupos ilimitados"→"Planteles y grupos ilimitados").

## Fase G — Usuarios: chips de plantel

`9f32058` · **chips de plantel removibles por entrenador** en Usuarios: X → confirmación → `unassign_coach` (desasigna al coach del plantel; el plantel y sus jugadores quedan). Resuelve "el coach con 2 planteles no podía quedarse con uno".

> **Superseded (2026-06):** los chips de plantel en Usuarios pasaron a solo lectura (informativos, sin X). La asignación/desasignación ahora se hace con chips toggleables (incluido el chip "Yo"), con confirmación, en la sección Planteles. Ver `CLUB-TEAMS-HIERARCHY.md`.

## Fase H — Datos demo (DB, sin commit de código)

20 jugadores demo para "Entrenador Marian" de Club San Fernando (10+10 en sus 2 planteles), perfiles DISC válidos y diversos (los 12 arquetipos), deporte = Rugby (el del club). `is_demo = true`, `email_sent_at` seteado (no los toca el cron). Insertados vía script con service-role. Corregido el deporte a Rugby tras feedback (el club define un único deporte).

## Fase I — Auditoría exhaustiva (multi-agente, solo lectura)

Gates deterministas + 5 chequeos de DB en vivo + workflow de 6 dimensiones (i18n, consistencia del modelo, scoping/seguridad de API, wiring del front, Vigía, flujos/dead-code), 28 agentes, cada hallazgo verificado adversarialmente. Resultado: base sólida y segura (0 fugas cross-tenant, scoping correcto, play_token infalsificable; 3 "vulnerabilidades" reportadas resultaron falsos positivos ya cubiertos por el gate admin-only). Hallazgos reales: copy desfasado, huecos de Vigía, y código muerto.

## Fase J — Fixes de la auditoría

`f01dab2` · **Vigía + modelo/copy.** Migración `20260610_ai_events_group_ids.sql`.
- **Vigía:** canary con paso **per-plantel** (start-play con team_slug → verifica fila en group_members); `ensureTeamMembership` ahora loguea el error del upsert (era silencioso); boot probes (CHECK 8) suman `start-play`, `tenant-groups`, `tenant-chem-groups`; `report-recovery-cron` salta `is_demo`; `ai_events.group_ids` para drill-down por plantel.
- **Modelo/copy:** borrado de `TenantLink` (página huérfana con el link institucional viejo); rama PT faltante en TenantChat; TrialEndModal "equipo"→"plantel"; Landing tiers "Grupos ilimitados"→"Planteles y grupos ilimitados"; TenantPlayers localiza "Error/Enviado" a PT; LinkWidget "roster"→"cupo"; emails ("Dinámica Grupal"→"Química de grupos"; admin Enterprise →"Planteles y grupos ilimitados").
- **NO implementado (decisión del owner):** filtrar `is_demo` del roster/dashboard (querés ver los demo, es un solo dashboard); mostrar el link del plantel en Planteles (no querés admins enviando juegos, eso es del entrenador).

---

## Migraciones aplicadas a prod (Supabase `Argo`, vía MCP)

1. `20260610_teams_hierarchy` — planteles + group_coaches + rol coach.
2. `20260610_chat_messages_member_scope` — historial de chat por-usuario.
3. `20260610_chem_groups_analytic_tool` — Química de grupos (tablas separadas).
4. `20260610_ai_events_group_ids` — telemetría del Coach por plantel.

Todas espejadas en `supabase/migrations/`. RLS verificado on en todas las tablas de la jerarquía.

## Cierre del día

`develop` (20 commits) mergeado a `main` por fast-forward → deploy a producción (argomethod.com). La jerarquía completa quedó live. Los refuerzos de Vigía (que corren contra `main`) recién a partir de aquí monitorean el flujo real per-plantel.
