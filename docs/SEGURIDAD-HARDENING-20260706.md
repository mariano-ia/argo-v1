# Endurecimiento de seguridad — 2026-07-06

Cierre de la exposición de datos de menores encontrada en la auditoría del 2026-07-05, más la implementación del **vigilante** (monitoreo continuo de la capa de acceso). Este doc es el registro as-built.

## TL;DR

- La exposición **en vivo** (capa de base de datos) está **cerrada, aplicada en producción y verificada** en tres capas (grants, comportamiento RLS, sonda de caja negra 26/26).
- Los fixes de **endpoint y de producto** están **committeados en local**; requieren deploy (no se hizo push).
- El **vigilante** existe: sonda de caja negra (`npm run check:security`) + cron `security-canary` horario con alerta.
- Contexto: todavía no hubo ventas, así que los datos en la base eran de prueba/demo. No se dispara deber de notificación. El cierre llegó antes de meter data real.

## 1. Capa de base de datos (LIVE, verificada)

Migración: [`supabase/migrations/20260706_security_rls_lockdown.sql`](../supabase/migrations/20260706_security_rls_lockdown.sql) (aplicada vía MCP como `security_rls_lockdown` + `harden_function_search_path`).

Principio: **deny-by-default para clientes.** Toda escritura legítima ya pasa por `/api/*` con la service-role key (que bypassa RLS). Las lecturas de admin se preservan con políticas escopeadas a `admin_users` (espejando `admin_select_sessions`).

| Objeto | Antes | Después |
|---|---|---|
| `children` | `SELECT USING(true)` a authenticated → lectura cross-tenant | Sin política, grants de anon/authenticated revocados → solo service-role |
| `perfilamientos` | `auth_read` USING(true) + `anon_insert` + DELETE público | Solo `admin_select_sessions`; anon sin acceso; authenticated conserva SELECT (gateado por política admin) |
| `one_links`, `one_purchases` | `FOR ALL USING(true)` a público | Sin política de cliente; grants revocados → solo service-role |
| `admin_audit_log` | `FOR ALL USING(true)` a público | SELECT admin-only; escritura solo service-role → tamper-evident |
| `leads` | DELETE público + lectura permisiva | INSERT/UPDATE self-scoped (`user_id = auth.uid()`), SELECT propio+admin, DELETE admin |
| `blog_topics` | `FOR ALL USING(true)` a público | Gestión admin-only; INSERT vía `blog-cron` (service-role) |
| `system_activity_log` (+particiones) | RLS **deshabilitado** (abierto) | RLS habilitado, grants revocados → solo service-role |
| `current_perfilamiento` (vista) | `SECURITY DEFINER` (bypassa RLS del que consulta) | `security_invoker = true` + acceso de cliente revocado |
| RPCs `merge_children`, `add_credits`, `deduct_credit`, `check_roster_capacity`, `check_reprofile_cooldown`, `increment_ai_queries` | `EXECUTE` a PUBLIC (anon podía llamarlas vía `/rest/v1/rpc`) | `EXECUTE` revocado a PUBLIC/anon/authenticated; concedido solo a `service_role` |
| 7 funciones SECURITY DEFINER | `search_path` mutable (0011) | `SET search_path = public, pg_temp` |

### Verificación (evidencia)

1. **Privilegios efectivos** (`has_table_privilege`/`has_function_privilege`): anon y authenticated devuelven `false` en todas las tablas/funciones sensibles; `authenticated` conserva solo lo necesario (SELECT en perfilamientos para la política admin, INSERT en leads para el self-upsert); `service_role` conserva EXECUTE.
2. **Comportamiento RLS** (impersonando un authenticated no-admin con `SET LOCAL ROLE` + `request.jwt.claims`): `perfilamientos` y `leads` devuelven **0 filas**.
3. **Sonda de caja negra** (`npm run check:security`, con la anon key real contra prod): **26 superficies de ataque, 26 denegadas.**
4. **Advisor de Supabase** (`get_advisors security`): sin errores; los `rls_policy_always_true`, `security_definer_view`, `rls_disabled_in_public` y `*_security_definer_function_executable` desaparecieron. Los `rls_enabled_no_policy` restantes son el estado buscado (RLS on, sin política = deny-all).

## 2. Endpoints y producto (committeado local, requiere deploy)

| Archivo | Cambio |
|---|---|
| `api/generate-puentes.ts` | El nombre real del niño ya no va a Gemini: placeholder `__NAME__` en el prompt + scrub del `resumenPerfil` inyectado + rehidratación server-side. Patrones deterministas anclados en el placeholder. Cierra la contradicción con la Política de Privacidad. |
| `api/report.ts` | Fail-**closed**: rechaza cuando `share_token` es null (antes `data.share_token && …` devolvía el registro completo del niño con cualquier token). |
| `api/one-complete.ts` | Genera y guarda `share_token` en el perfilamiento de ArgoOne. |
| `api/one-panel.ts` + `src/pages/OnePanel.tsx` | El panel adjunta `report_token` y arma el link `/report/:id?token=…`. |
| `api/one-start-play.ts` | Rate limit KV inline (60/min por IP) sobre este endpoint público que devuelve PII. |
| `api/retention-cron.ts` | El fallback de `User-Agent` ahora está gateado en `!cronSecret` (con secreto configurado, el Bearer es obligatorio; UA es spoofeable). |
| `api/delete-account.ts` | Borra de verdad el roster de niños del tenant (COPPA §312.10 / GDPR 17); antes hacía soft-delete "for audit" y retenía la PII. |
| `src/lib/odysseyTranslations.ts` | El checkbox de consentimiento ahora atesta mayoría de edad (18+) además de tutela, en es/en/pt. |

## 3. El vigilante (monitoreo continuo)

Filosofía: **el piso es determinístico** (tests que fallan fuerte), el agente va arriba como analista, no como guardia único. El punto ciego del advisor de Supabase (excluye a propósito el patrón `SELECT USING(true)`, que fue justo la fuga principal) lo cubre la sonda de caja negra, que prueba exploitabilidad real.

| Componente | Qué hace |
|---|---|
| `scripts/security/security-probe.mjs` | Sonda de caja negra: con la anon key intenta leer/borrar/ejecutar cada superficie de `expected-denied.json` y afirma que TODAS están denegadas. Sale con código ≠ 0 ante cualquier exposición. Autocontenida (solo anon key + fetch). |
| `scripts/security/expected-denied.json` | Baseline commiteado: la lista de tablas/RPCs que la anon key nunca debe alcanzar. La cobertura es tan ancha como esta lista → al agregar una tabla sensible, agregarla acá. |
| `api/security-canary.ts` | Cron (`vercel.json`, horario a los :15) que corre la misma sonda server-side, devuelve 500 y **alerta por Telegram/email** si algo se reabre. Auth CRON_SECRET estricta (sin bypass de UA). Segundo net: qa-monitor alerta ante cualquier 5xx. |
| `package.json` → `check:security` | Corre la sonda local/CI (`npm run check:security`). Correr **antes de cada deploy** y sumar al gate de CI. |

### Cómo se usa
- **Pre-deploy / CI:** `npm run check:security` (necesita `SUPABASE_URL` + `SUPABASE_ANON_KEY`, o `.env.local`). Rojo = no deployar.
- **Continuo:** el cron `security-canary` corre solo una vez que se deploya; alerta al toque si una política o grant regresa.
- **Revisión manual periódica:** `get_advisors security` vía MCP + revisar a mano toda política `SELECT USING(true)` (el punto ciego del linter).

## 4. Pendiente (no ejecutado hoy)

- **Consentimiento server-side 13-16 años.** Hoy es un checkbox de cliente que no se persiste. Spec: columnas de auditoría de consentimiento (accepted_at, ip, user_agent, policy_version) + captura en `session.ts` para el tramo 13-16, espejando el flujo &lt;13. El age-gate (atestación 18+) ya se renderiza.
- **Envoltorio legal internacional** (GDPR/GDPR-K, LGPD, Argentina): política de privacidad para los mercados donde se venda, mecanismo de transferencia (DPF/SCCs), DPIA de perfilado de menores, representante Art. 27, DPAs con sub-procesadores. Requiere abogado.
- **Toggle de "leaked password protection"** en Supabase Auth (un clic en el panel).
- **Buckets públicos** (`institution-logos`, `blog-images`): política de SELECT amplia permite listar. Bajo riesgo; ajustar sin romper el servido de imágenes.
- `storyhunt_tasks` con `FOR ALL USING(true)`: es de otro proyecto que comparte la base, fuera de scope de Argo.

## 5. Nota de compliance / brecha

Como todavía no hubo ventas, la data en la base era de prueba/demo (no menores reales de terceros). No se dispara deber de notificación (GDPR 33/34, ANPD, leyes estatales US, AAIP). El cierre llegó **antes** de ingresar data real de clientes, que es el mejor momento posible. Runbook de incidente por si en el futuro hay que responder a uno: [`RUNBOOK-INCIDENTE-SEGURIDAD.md`](./RUNBOOK-INCIDENTE-SEGURIDAD.md).
