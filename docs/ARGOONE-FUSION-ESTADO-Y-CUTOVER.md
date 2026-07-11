# ArgoOne fusión — Estado y runbook de cutover (2026-07-10)

> Build nocturno autónomo de la fusión ArgoOne contra el **modelo congelado**
> (`ARGOONE-DECISIONES.md`). Fases 0-4 HECHAS, revisadas adversarialmente y **verdes
> en local** (commits sin push). Fase 5 = cutover a producción, **owner-gated**.

## Lo hecho (todo commiteado local, sin push)

| Fase | Commit | Qué |
|---|---|---|
| **0** Corte de entitlement | `762babb` | El $4.99 da SOLO el puente. Hub sin informe del niño para bridge-only. Pre-pago = solo primer nombre (bridge-invite-accept, puentes-check-purchase). puentes-start sin motor/archetype. Rol invitado = superficie de puentes. |
| **1** Link de puentes por niño | `ffff239` | UN link compartible por niño (`children.bridge_link_token`, **migración aplicada a prod**). Onboarding `/puente/:token` (nombre+email+T&C → Stripe pre-cargado pay-first → cuestionario). puentes-checkout Path C. one-panel: share/revoke/linked-adults + modal. `invite-adult`→410 (muere la invitación por email). |
| **2** Rol adulto + hub | `f8a50eb` | request-access da entrada al adulto autorizante no-comprador (adult_profiles mínimo por email). Matriz §7 (coach no comparte/no borra). Alerta "Ambos informes" 6m + tooltip. Re-perfilar visible al comprador. |
| **3** Ciclo de 6 meses | `c49a3ca` | Checkout re-perfilado ($12.99 atado a child_id, **migración aplicada a prod**). Webhook bifurca foto-fresca vs autorización al adulto inmutable. Append al niño existente + gate duro 6m + consentimiento por jugada (COPPA <13). Fan-out del informe al pagador. |
| **4** Emails (marca) | `37d8ee7` | Barrido joined+® en api/ (`brandify-api.mjs`) + fix de headers con spans partidos → **ArgoMethod®**. |

**Revisión adversarial:** cada fase pasó por un workflow de N lentes + verificación
por hallazgo. Fase 1: 21→19 confirmados, arreglados (incl. un HIGH de leak de
magic-token). Fase 3: 15→14 + re-verify (circuito de plata + consentimiento de
menores; HIGHs y residuales cerrados). **QA verde en cada fase:** typecheck:api, tsc,
check:api-imports, qa:unit, build.

**Migraciones aplicadas a prod (aditivas, shadow):** `children.bridge_link_token`
(M9), `one_purchases += child_id/kind/reprofile_status`. Verificadas presentes.

## V4 en los dos modelos

El sellado v4 (`sealV4`/`gateReportV4`) vive en `api/session.ts`, compartido por
**ambos** paths: el save del tenant (Academy) y el play de ArgoOne (que reusa la
fila row-A de session.ts vía one-complete). `ReportPage` renderiza el v4 **sellado**
(report_status ready/sent) en español. O sea V4 es idéntico para los dos modelos;
se enciende con `V4_SEAL=on` (ya on en develop). Verificación final = un informe
sellado real en develop tras el push.

## Lo que falta (Fase 5 — cutover, NECESITA "mandalo a producción")

Orden exacto, todo owner-gated:

1. **Push a develop** (tu OK). Verás la fusión completa en develop.argomethod.com.
2. **Prender `ONE_REPROFILE` en develop** (Vercel Preview) para probar el ciclo de 6 meses. Los otros flags de fusión ya están on en develop.
3. **Pasada manual en develop**: comprar ($12.99), jugar, puente ($4.99 con el link por niño), re-perfilar, verificar V4 sellado en un informe real (Academy + ArgoOne).
4. **Aplicar M7/M8 a prod** (`supabase/migrations/20260709_argoone_fusion_cutover_prep.sql`) — view + backfill 24 puentes. *(Surfaceable: no destructivo, pero toca el backfill.)*
5. **Merge `develop`→`main`** (tu OK explícito).
6. **Flags en Production, en orden**, verificando entre cada uno: `ONE_UNIFIED_SKU` → `ONE_V2_COMPLETE` → `PUENTES_BRIDGES` → `PUENTES_ADDON_V2` → `RENEWAL_CRON_V2` → `VITE_BRIDGES_V2` → `ONE_REPROFILE` → `V4_SEAL`. Rollback = apagar el flag.
7. **`CHILD_DELETE_ENABLED`** (borrado destructivo de datos de menor) — tu OK aparte.
8. **Marcar refunded** la compra sintética de prueba `04119d6e` (higiene de revenue).

**Provisionar antes del go-live (infra, no código):** Vercel KV (rate limits fail-open
sin él — cierra el timing/bomb de request-access), y reautorizar los conectores
**Stripe** y **Vercel** (Supabase MCP ya está autenticado). PostHog + MP webhook secret
si aplican (GTM hardening).

**DROPs destructivos = DESPUÉS del cutover, sin datos in-flight:** `bridge_invites`,
`PuenteInvite.tsx`/`PuentesCheckout.tsx` standalone (deprecados-in-place hoy).

## Cosas menores / deuda conocida (no bloquean)

- V4 default delivery es **es-only** hoy (en/pt caen a legacy aunque estén sellados).
- Onboarding del re-perfilado re-pregunta datos (no pre-rellena del niño); edge de
  cambio de edad <13 mitigado por el auto-resume del consent-landing.
- Doble-jugada concurrente: cerrada por guard de in_flight + single-use; residual
  same-millisecond ≈ nulo.
- Full header-unification por generador (5 patrones → 1) NO se hizo: se hizo el
  barrido de marca; la unificación total es follow-up cosmético.
