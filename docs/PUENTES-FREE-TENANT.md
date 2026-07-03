# ArgoPuente® gratis por tenant

**Estado: LIVE en develop (2026-07-03). Columna `tenants.free_puentes` ya aplicada en prod.**

## Qué hace

Interruptor interno por tenant (`tenants.free_puentes`, default `false`). Cuando está
encendido, cada perfilamiento **resuelto** y **no demo** de ese tenant le otorga al
adulto responsable un ArgoPuente® de cortesía ($0, `provider='comp'`) creado ANTES de
que salga el email del informe. El adulto nunca ve la propuesta de compra de $4.99:
el mismo email del informe muestra la variante "incluido" con el magic link directo
al cuestionario.

## Cómo funciona (cadena completa)

1. **Toggle**: superadmin → `/admin` → Tenants → menú del tenant → "Activar ArgoPuente® gratis".
   UI: `src/pages/dashboard/AdminTenants.tsx` (chip violeta "Puente gratis" cuando está on).
   API: `POST /api/admin-tenants { action: 'toggle-free-puentes', tenant_id, enabled }`
   (queda en `admin_audit_log` + Principia).
2. **Grant**: `api/session.ts` → `maybeGrantTenantFreePuente()`, llamado en los dos
   caminos que resuelven un perfilamiento (`action: 'update'` y `action: 'save'`).
   Espeja el bloque combo de `one-complete.ts`. Guards: tenant con flag on,
   `adult_email` presente, no demo, y dedup (si el email ya tiene una compra `paid`,
   real o comp, no crea nada). `provider_payment_id = tenant_free_<tenantId>_<perfId>`.
   Best-effort: un fallo nunca bloquea el guardado de la sesión.
3. **Entrega**: `api/send-email.ts` (sin cambios) encuentra la compra paga del email,
   cambia el upsell por la copy "incluido" con el magic link, y crea la
   `puentes_session` del niño (heredando el perfil adulto si ya existía uno de un
   hermano, con generación automática de los puentes nuevos).

## Decisiones

- **Sin email dedicado de invitación**: la invitación viaja dentro del email del
  informe (variante "incluido" que ya existía). El botón manual del admin
  (`admin-grant-puentes-free.ts`) sigue disponible para invitar fuera de este flujo.
- **Dedup por email del adulto**: hermanos y re-perfilamientos no duplican compras;
  send-email agrega `puentes_sessions` por niño bajo la misma compra.
- **Costo controlado**: una generación Gemini por adulto (no por niño perfilado),
  solo en tenants con el flag encendido.

## Migración

`supabase/migrations/20260703_tenants_free_puentes.sql` (aplicada en prod vía MCP
el 2026-07-03 + `NOTIFY pgrst, 'reload schema'`).
