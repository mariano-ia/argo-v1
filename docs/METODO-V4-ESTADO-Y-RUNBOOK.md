# Informe v4 — estado y runbook de activación

> Autoritativo al 2026-07-07 (corrida autónoma). Todo **local en `develop`, sin push** (regla del owner: push necesita OK explícito). El camino **legacy sigue siendo el default vivo**: todo lo v4 es **aditivo o detrás de flag**, así que producción no cambió su comportamiento. Diseño: `METODO-FALLBACK-INFORME.md` (fail-closed) · voz aprobada: maqueta equipo/individual (artifact) · cálculo: `METODO-CALCULO-NUEVO.md`.

## TL;DR

El informe v4 (determinista, en la voz que el owner aprobó) está **construido, testeado y previsualizable**. La entrega real sigue siendo la legacy. Falta la **activación** (que v4 sea el informe entregado). **A un flag (`V4_SEAL`) + un render flip de estar vivo.**

## ACTUALIZACIÓN 2026-07-07 (segunda tanda, autónoma) — leer esto primero

Desde que se escribió el resto del doc se sumó (todo en develop, verificado, legacy intacto):

| Pieza | Qué | Estado |
|---|---|---|
| **Género** | El informe es **100% GÉNERO-NEUTRO**. Decisión del owner: NO se recolecta el género del niño (no es apropiado). Se neutralizó cada clítico/adjetivo (patrón, grupo, logro, contenido de ejes). Un informe de nena da cero marcas de género. | ✅ pusheado |
| **Gate server-side** | `session.ts` sella `report_status` server-side (el cliente NUNCA lo setea). Gate inlineado (subconjunto de qualityGate). Detrás de env **`V4_SEAL`** (default OFF → `report_status` NULL → choke-point sin gatear → **legacy entrega, sin cambios**). 7 tests (`src/lib/serverGate.test.ts`). | ✅ inerte hasta el flip |
| **Email v4** | `buildHtmlV4` en `send-email.ts`: diseño **aprobado por el owner** (maqueta `scratchpad/email-v4.html`). Arquetipo eje×veta coloreado, **sin chip de motor legacy** (Dinámico/Rítmico/Sereno), voz nueva, CTA al informe, **ArgoPuente USD 4.99**. Se usa cuando `report_status` es ready/sent; si no, email legacy. 4 tests. | ✅ cableado, inerte hasta el flip |
| **Bug precio Puente** | El email mostraba **"ARS 4.999"** (arbitrario y engañoso: el checkout es USD only). Ahora siempre **USD 4.99**. | ✅ pusheado |
| **Contador de normas** | `scripts/norm-progress.sh`: avance hacia las 500 jugadas reales (con `evidence_ficha`) para definir normas de motor propias y reemplazar la referencia bibliográfica. Hoy 0/500. | ✅ |
| **Motor (normas)** | Owner 2026-07-07: **bibliografía (banda 60/40) hasta 500 jugadas reales**, de las que se definen los percentiles p33/p67 por franja de edad; ahí se flipea `normaLabel` biblio→poblacion_argo. La banda 60/40 fue decisión del owner ("valor sobre cautela"), NO recomendación de expertos (ellos pedían cautela). GOTCHA descubierto: la columna `game_metrics` histórica está vacía (0/86); la fuente de normas es `evidence_ficha` (shadow), que sí trae los tiempos crudos, desde ahora. | plan confirmado |

**Commits de esta tanda:** `7b8af7b`..`b422459`. Suite v4: ~73 tests verdes.

**Qué falta para el flip (activación):** cola de retenidos + "preparando" (3 superficies) + vista admin + cron · en/pt (i18n de reportV4, refactor grande) · Capa 2 (IA) · y el flip en sí (`V4_SEAL=on` + render v4 por default + rollout escalonado + push a main con OK del owner).

## Decisión de arquitectura (owner 2026-07-07): OPCIÓN 1

- **Capa 1 (determinista, aprobada) = el piso que sale por defecto.** Grounded, no puede fabricar.
- **Capa 2 (IA, variación grounded) = pulido OPCIONAL** detrás del mismo gate. Si no está / falla / no pasa el gate → sale la Capa 1.
- **HOLD** se reserva para defectos reales de dato (ficha rota), no para "la IA no corrió".
- La fortaleza legacy ("no hay dos informes iguales") se **reubica** en la Capa 2 (variación), no se pierde; el idéntico solo ocurriría en el fallback (IA caída) y ahí el informe igual es correcto.

## Qué quedó HECHO y VERIFICADO (compila + tests + build)

| # | Pieza | Archivos | Commit | Verificación |
|---|---|---|---|---|
| 1 | Motor v4: 4 ejes en la voz aprobada, capa equipo/individual, género | `reportV4.ts`, `archetypeContentV4.ts` | `ffa001d`,`752c4bb` | 38 tests; auditoría adversarial (0 bloqueantes, 4 menores aplicados) |
| 2 | Gate fail-closed + guards compartidos | `reportQuality.ts`, `reportGuards.ts` | `c6d9433` | 13 tests adversariales (informe real pasa; cada defecto retiene) |
| 3 | Pipeline opción 1 (Capa1 piso, Capa2 opcional/gate-checked/never-throws) | `reportPipeline.ts` | `ed6cca7` | 7 tests |
| 4 | Migración `report_status` **APLICADA a prod** | `supabase/migrations/20260707_report_status.sql` | `ed6cca7` | verificada en DB (7 cols + CHECK + índice); vía `supabase db query --linked --file` |
| 5 | Choke-point en `send-email` (solo envía `ready`/`sent`/NULL-legacy; `held`/`pending`→409) | `api/send-email.ts` | `1718d3b` | tsc + check:api-imports |
| 6 | Persistencia additive + shadow hookup (cliente computa v4, persiste artefactos, **nunca** setea report_status) | `api/session.ts`, `OnboardingFlowV2.tsx` | `1cc6741`,`73c72bc` | tsc, api-imports, 7 tests, vite build |
| 7 | Render v4 en ReportPage detrás de `?engine=v4` (legacy intacto) | `ReportV4View.tsx`, `ReportPage.tsx`, `api/report.ts` | `533660e` | 2 tests de render (HTML vía react-dom/server), vite build |

**Total: 59 tests verdes, tsc 0 errores, check:api-imports OK, vite build OK.** Los 8 commits: `13e71c7`..`533660e`.

## Cómo está la seguridad (por qué nada se rompió)

- **Aditivo**: columnas nuevas nullable; funciones/módulos nuevos al lado de los viejos.
- **report_status NUNCA lo setea el cliente** (session.ts lo fuerza a NULL). Solo código server-side puede sellarlo. Un cliente malicioso no puede mandar `ready`+basura.
- **Shadow**: el cliente computa el informe v4 y lo persiste (`report_v4`/`report_qc`/`evidence_ficha`) envuelto en try/catch. `report_status` queda NULL → el choke-point no gatea → **entrega legacy sin cambios**.
- **Preview**: `?engine=v4` en cualquier `/report/:id` renderiza el v4 persistido. Sin el flag, no cambia nada.

## Cómo previsualizar (para el owner)

1. Deployar develop (push a `develop` — pendiente de tu OK).
2. Completar una sesión nueva (así se persiste `report_v4`).
3. Abrir `/report/:id?engine=v4` → ver el informe v4 real.
   (Las sesiones viejas no tienen `report_v4`; solo las completadas tras el deploy del shadow.)

## RUNBOOK DE ACTIVACIÓN (que v4 sea el informe entregado)

Orden sugerido. Cada paso es reversible (flag) y verificable.

1. **Push del shadow a develop** → recolectar unas sesiones reales → mirar `report_qc.pass` en `perfilamientos` (tasa de gate). Objetivo: ~99%+ pasa. Si algo retiene seguido, ver `report_qc.reasons` y ajustar copy/umbral (no sumar filtros).
2. **Eyeball**: abrir varios `/report/:id?engine=v4` reales y confirmar la voz/estructura en producción-real.
3. **Email v4** (PENDIENTE): inline en `send-email.ts` un builder `buildV4Email(report_v4)` (HTML con estilos inline; el email no puede importar `src/lib`). O, más simple para v1: el email mantiene su estructura y **linkea** a `/report/:id?engine=v4`. Verificable inspeccionando el HTML.
4. **Gate server-side + sellar report_status** (PENDIENTE): el server tiene que ser la autoridad del veredicto. Inline `reportGuards`+`qualityGate` en `session.ts` (patrón "duplicar-por-build para api/"), re-correr el gate sobre el `report_v4` que mandó el cliente, y setear `report_status='ready'|'held'` server-side. Recién ahí el choke-point se activa de verdad.
5. **Flag de entrega**: cuando 3-4 estén listos, cambiar el render/email a v4 por default (o por `report_engine` flag). El choke-point ya veta lo no-`ready`.
6. **Cola de retenidos** (PENDIENTE): rework de `report-recovery-cron.ts` (contar retry, transicionar a `held`, excluir `held`/`sent`), `admin-approve-report.ts` (re-QC + aprobar), vista admin "Informes retenidos", y el estado "preparando" en las 3 superficies (OnboardingFlowV2 end-screen, ReportPage, one-panel) es/en/pt.

## PENDIENTE (post-activación / mejoras)

- **Capa 2 (IA variación grounded)** + juez-IA fail-closed (el reemplazo del "no hay dos iguales"; hoy el gate ya tiene el hook `capa2` en `runReportPipeline`).
- **Espejo en/pt** del contenido nuevo (hoy es-only; el gate retiene lang≠es).
- **Sección evolución** (comparar dos perfilamientos).
- **Gender**: hoy el shadow usa `genero:'m'` por defecto (no lo recolectamos). Sumar recolección para la concordancia femenina (el engine ya la soporta).
- **Selector de variantes determinista** (opcional): variación cosmética por hash de la ficha para el camino fallback.

## Gotchas para la próxima sesión

- **`api/` no puede importar de `src/lib` ni entre archivos `api/`** (ERR_MODULE_NOT_FOUND en runtime, tumbó prod el 2026-06-05). Por eso el pipeline corre client-side y el gate server-side (paso 4) hay que **inlinearlo**.
- **Migraciones de este workstream**: aplicar con `supabase db query --linked --file <migración>` (usa la Management API, sin password; el MCP puede estar sin auth). NO `db push` (aplica todas las pendientes y el tracking está desalineado por nombres de 8 dígitos).
- **report_status del cliente = NUNCA**. Mantener esa invariante o el choke-point deja de ser fail-closed.
- **Voz aprobada**: bloques desarrollados + `**negrita**` + un ejemplo (sin rótulo "Por ejemplo") + por la positiva. Content-lint (`.claude/scripts/check-voseo.sh`) es la red contra voseo/guiones/encuadre-entrenamiento.
