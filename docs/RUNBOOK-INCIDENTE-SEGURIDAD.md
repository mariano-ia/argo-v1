# Runbook — incidente de seguridad / exposición de datos

Guía corta para responder cuando el **vigilante** alerta (o cuando se sospecha una exposición de datos, sobre todo de menores). El objetivo es no improvisar: preservar evidencia, contener, evaluar, notificar si corresponde.

## 0. Señal de disparo

- El cron `security-canary` devolvió 500 y llegó alerta por Telegram/email, **o**
- `npm run check:security` falla localmente, **o**
- El advisor de Supabase muestra un `rls_policy_always_true`, `rls_disabled_in_public` o `*_security_definer_function_executable` nuevo, **o**
- Sospecha manual de acceso indebido.

## 1. Preservar evidencia (ANTES de tocar nada)

Si hay sospecha de acceso real, **preservar primero**. Remediar borra el rastro.

1. Snapshot de los logs de Postgres / PostgREST de Supabase (panel → Logs, exportar el rango relevante). El `admin_audit_log` NO sirve como evidencia por sí solo si estuvo abierto (era forjable).
2. Anotar timestamp de detección (arranca cualquier reloj de notificación).
3. Guardar la salida de la sonda / advisor que disparó la alerta.

> Retención de logs de Supabase: limitada según el tier. El tiempo corre — preservar cuanto antes.

## 2. Contener (cerrar el agujero)

1. Identificar qué se reabrió: `npm run check:security` (dice qué superficie está expuesta) + `get_advisors security` vía MCP.
2. Cerrar la política/grant. Patrón de referencia: `supabase/migrations/20260706_security_rls_lockdown.sql`. Regla: **deny-by-default**; las escrituras van por `/api` con service-role; las lecturas de admin, por políticas escopeadas a `admin_users`.
3. Aplicar la migración de cierre (MCP `apply_migration`, quirúrgica; no `supabase db push`).
4. Re-verificar: `npm run check:security` debe volver a 26/26 denegado + advisor limpio.

## 3. Evaluar el alcance

- ¿Hubo acceso real? Revisar los logs preservados en busca de lecturas masivas anómalas desde roles `anon`/`authenticated`, o DELETE/UPDATE inesperados.
- ¿Qué dato y de quién? ¿Había PII de menores reales de terceros, o solo test/demo?
- Documentar el hallazgo (qué estuvo abierto, desde cuándo, qué se pudo alcanzar) — obligatorio bajo GDPR Art. 33(5) aunque se concluya no notificar.

## 4. Notificar (si corresponde)

Para datos de menores detrás de una llave pública, "no pudimos descartar acceso" tiende a obligar a considerar notificación. A quién, según dónde residan los afectados:

- **GDPR:** autoridad de control de cada país con menores afectados (reloj de **72h** desde el conocimiento) + aviso directo a los padres (dato de menores = presunción de alto riesgo). No hay representante Art. 27 designado → centralizar es más difícil.
- **LGPD (Brasil):** ANPD + titulares afectados.
- **EE.UU.:** FTC (regla COPPA de seguridad enmendada + Sec. 5) + fiscales estatales según leyes de brecha.
- **Argentina:** AAIP (Ley 25.326).
- **Contractual:** deberes de aviso a sub-procesadores (Supabase, Stripe, etc.).

> Esto no es asesoría legal. Ante un incidente con PII real de menores, 30 minutos con un abogado de privacidad ANTES de comunicar externamente.

## 5. Post-mortem

- ¿Cómo entró la regresión? (política cambiada por SQL directo fuera de migración, tabla nueva sin RLS, etc.)
- ¿Por qué el gate no la frenó? Ampliar cobertura: sumar la tabla nueva a `scripts/security/expected-denied.json`, sumar `check:security` al CI si no estaba, revisar a mano las políticas `SELECT USING(true)`.
- Registrar en este runbook lo aprendido.

## Referencia rápida

| Acción | Comando |
|---|---|
| ¿Están cerrados los agujeros? | `npm run check:security` |
| Advisor de seguridad | `get_advisors(type: security)` vía MCP Supabase |
| Ver políticas de una tabla | `SELECT polname, polcmd, pg_get_expr(polqual, polrelid) FROM pg_policy WHERE polrelid = 'public.<tabla>'::regclass;` |
| Migración de cierre (patrón) | `supabase/migrations/20260706_security_rls_lockdown.sql` |
| As-built del hardening | `docs/SEGURIDAD-HARDENING-20260706.md` |
