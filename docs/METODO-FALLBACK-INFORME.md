# Fallback del informe Argo — arquitectura de diseño

> Diseño cerrado (4 frentes de falla estresados + síntesis). Regla del owner (2026-07-07): el esqueleto determinista solo NO puede salir; ante un problema real, se RETIENE, no se manda basura. Descubrimiento urgente: el sistema HOY es fail-open y ya deja salir informes rotos / abandona chicos en silencio. La Fase A tapa eso, con o sin v4.

# Arquitectura de fallback del informe Argo — diseño CERRADO

> Consolidación de los 4 frentes. Todo lo referido a archivos usa lo reportado; no se inventan rutas.

---

## 1. La regla de oro

**Nunca se envía un informe que no selló `report_status='ready'` en un control de calidad determinista; ante cualquier defecto real (dato podrido, generación caída, texto sucio, esqueleto pelado) el sistema RETIENE (HOLD) + alerta al humano y le muestra al adulto "tu informe se está preparando" — jamás basura, jamás un informe roto o a media frase, jamás el esqueleto determinista solo.**

---

## 2. Los 3 estados + diagrama de decisión

| Estado | Qué es | Sale al padre |
|---|---|---|
| **E1 — feliz** | La IA individualizó todas las secciones y el informe pasó el QC sin degradar ninguna. | Sí, informe completo e individualizado. |
| **E2 — IA-degradada por sección (con TECHO)** | Degradaciones **aisladas**: 1 o pocas secciones no-CORE cayeron a su estático **curado**; el resto quedó individualizado y el informe pasó el QC. | Sí, pero SOLO si respeta el techo de procedencia (ver §3, check 10). |
| **E3 — HOLD** | Cualquier defecto duro: dato insuficiente, ambos proveedores caídos, texto que sobrevive a un guard, nombre ajeno, idioma mezclado, **fallback-dominante**, o el corazón (resumenPerfil/Retrato) caído a estático. | No. Se retiene, se alerta, humano en el loop. |

### Diagrama de decisión (orden estricto)

```
perfilamiento status='resolved'
│
├─▶ [GATE DE DATOS]  (pre-generación, sobre EvidenceFicha persistida)
│      sum(votos)≠12 | length≠12 | child_name vacío/>40 | eje/arquetipo irresoluble
│      | EJE_BASE[ejePrimario] o sus 6 campos ausentes | edadMeses∉[96,192]/NaN
│      | empate total 4 ejes | questionVersion incoherente con vector
│         └── cualquiera ▶ E3 HOLD (held_reason: datos_insuficientes / axis_mismatch / cobertura_eje)
│      OK ▼
│
├─▶ [GENERACIÓN + DEGRADACIÓN POR SECCIÓN]
│      • timeout por proveedor (~20-25s, AbortController) ; si primario cuelga → fallback con margen
│      • ambos proveedores caídos tras retry ▶ E3 HOLD (ai_unavailable)
│      • JSON no parsea / falta una clave → esa sección MISSING
│      • por CADA sección, en orden: prohibited → deterministic → groundTruth(top-2)
│        → band → closedExample → closedMoment → name-guard → language-guard
│      • guard sobrevive a 1 corrección (cross-provider) | vacía | fuera de rango | idioma malo
│           └── degradar esa sección a su ESTÁTICO CURADO  (procedencia = 'fallback')
│                 • si el estático tampoco pasa forma/guard ▶ E3 HOLD (nunca truncar/clampear)
│      • nombre propio ajeno pre-rehydrate ▶ E3 HOLD (error de identidad, no degradable)
│      • si la sección sucia/faltante es el CORAZÓN (resumenPerfil/Retrato) ▶ E3 HOLD
│      ▼
│
├─▶ [QC DETERMINISTA]  (sobre el informe ENSAMBLADO final, §3)
│      falla HARD (forma | placeholder | guard | idioma | veta | PROCEDENCIA)  ▶ E3 HOLD
│      falla SOFT (repetición marginal, largo apenas bajo) → intentar degradar → re-QC
│                                                            → si sigue mal ▶ E3 HOLD
│      PASS ▶ report_status='ready'   (E1 si 0 fallback ; E2 si ≤techo fallback)
│      ▼
│
└─▶ [send-email]  envía SOLO si report_status='ready' ; estampa email_sent_at
       report_status≠'ready' → 409, no envía, deja 'held'
```

---

## 3. El CONTROL DE CALIDAD (el gate SEND vs HOLD)

Función pura y determinista `qualityGate(report, ficha, lang) → { pass, reasons[], sectionsStatic, provenance[] }`. Corre **siempre** antes de enviar, sea legacy o Capa1+Capa2. Reglas **HARD** = cualquier fallo → HOLD. Reglas **SOFT** = intentar degradar una vez, si no → HOLD. Ante duda: HOLD.

**Checks de DATOS (pre-generación, HARD)**
1. `sum(vector)===12 && answersDISC.length===12`. Prohibido interpolar el literal "12" desde un vector que no suma 12; usar el conteo real derivado.
2. `child_name` trim 1..40, sin caracteres de control, sin placeholder.
3. Eje + arquetipo resolubles (nunca `'Desconocido'/'unknown'`); `edadMeses∈[96,192]` y finito.
4. Cobertura de contenido: `EJE_BASE[ejePrimario]` presente + sus 6 campos obligatorios (perfil, combustible, corazon, guia, palabrasPuente, palabrasRuido) strings no vacíos.
5. Empate: `nEjesFuertes===4` → HOLD; `===3` → exige plantilla "baja definición" (no el genérico que nombra 2 de 4).

**Checks de FORMA / ESTRUCTURA (HARD)**
6. ≥5 secciones obligatorias no vacías (hero-lead, perfil, combustible, corazon, guia); **motor es OPCIONAL y NO cuenta**. Cada sección obligatoria ≥180 chars (~30 palabras); informe total (sin título) ≥900 chars (~150 palabras).
7. 0 matches de `/\{[^}]+\}/` y 0 literales basura (`undefined`, `null`, `NaN`, `Desconocido`, `unknown`, `[object Object]`). Interpolación con callback (`replaceAll('{nombre}', () => nombre)`) para neutralizar `$&`/`$1`.

**Checks de GUARDS (HARD, umbral cero, corridos contra la plantilla / `__NAME__`)**
8. 0 hits de: `prohibited` (35+ términos) · `deterministic` (patrones "es un líder/siempre/nunca") · `groundTruth` extendido a **top-2** (rechaza ejes fuera de {dominante, secundario}) · `band-guard` (intensidad verbal vs `banda_veta`) · `closed-example` + `closed-moment` (whitelist = `momentos.seleccionados[]`; toda otra escena rebota) · `name-guard` (ningún nombre propio ajeno) · `language-guard` (idioma del output === `langCode`).

**Checks de CALIDAD TEXTUAL (SOFT → degradar; si no, HOLD)**
9. Repetición: Jaccard de trigramas < 0.35 entre cada par de secciones; ninguna oración idéntica repetida; las primeras 6 palabras de dos secciones no pueden coincidir.

**Check de PROCEDENCIA (HARD — el que cierra el hueco del "esqueleto disfrazado")**
10. Cada sección lleva `origen ∈ {ai, fallback}`. HOLD si:
    - el informe es **fallback-dominante** (≥2 secciones CORE en fallback, o >40% del total), **o**
    - el **corazón** (resumenPerfil/Retrato, la sección que "debe sonar a ESTE niño") cayó a fallback.
    E2 tiene techo: degradar una sección aislada es aceptable; degradar medio informe es un HOLD disfrazado de envío.

**Check de CONSISTENCIA INTERNA (HARD)**
11. `hero.vetaLabel!=null` ⇒ bloque de veta presente y no vacío para ese par, sin lexemas de conflicto (`raro`, `en tensión`, `sin embargo`, `pero le cuesta`, `contradice`) en pares opuestos no auditados.
12. Idioma consistente en TODAS las secciones (hoy en Capa1: `lang!=='es'` → HOLD hasta que exista i18n).

**Métrica de salud:** `tasa_fallback` = % de informes con ≥1 sección `fallback` o `held`. Objetivo **≤1%**. HOLD **no** cuenta como "informe roto enviado" — cuenta como retención correcta. Si `tasa_fallback_7d > 1%`: afinar prompt/guards (D9), **no** sumar filtros.

---

## 4. El estado HOLD

**Cómo se marca (decisión PERSISTIDA, no rama de runtime):** columnas nuevas en `perfilamientos`:
`report_status ('pending'|'ready'|'held'|'sent')`, `held_reason`, `held_at`, `retry_count`, `last_error`, `report_qc jsonb` (razones + secciones degradadas + procedencia por sección), `evidence_ficha jsonb`. Tras `NOTIFY pgrst, 'reload schema';`.

**Alerta al admin:** se dispara **una sola vez, en el borde `pending→held`** (nunca por cada lectura de una fila ya `held`, para evitar tormenta). Reusa el `sendAlert` de `qa-monitor.ts` inlineado (Resend `qa@` + Telegram `TELEGRAM_BOT_TOKEN`/`CHAT_ID`): id, nombre, arquetipo, `held_reason`, link a la cola admin. Escalado por **SLA**: si `held_at < now - Xh` (X = 2-4h) sin resolver → segundo aviso, severidad mayor.

**Lo que ve el usuario:** "tu informe se está preparando, te llega por email en breve" en las **3 superficies**: end-screen de `OnboardingFlowV2`, `ReportPage.tsx` (`/report/:id`) y el mini-panel `one-panel`. Copy buyer-neutral ("el niño"), es/en/pt, sin guiones. Nunca un 404 ni un informe a medio armar. Detrás hay un SLA real, no una promesa vacía.

**Flujo humano-en-el-loop:** vista admin **"Informes retenidos"** (query `report_status='held'`, con razones y edad del hold). El admin edita/aprueba vía `POST /api/admin-approve-report` (auth admin, por id) que **re-corre QC** sobre el informe editado y, si pasa, lo marca `ready` y llama a `send-email`. **Sin límite de ventana** (independiente del cron de 6h). El cron **excluye** `report_status IN ('held','sent')` para no pelear con el humano.

---

## 5. La transición (sin Capa 2 todavía)

**Recomendación: seguir con el generador viejo (`generate-ai.ts`) como el que envía a producción, pero insertar YA el gate fail-CLOSED (QC + HOLD + loop humano) alrededor del envío. Capa1-solo NUNCA es el entregable.**

Por qué:
- **Capa1-solo es literalmente el output prohibido.** Hoy `reportV4.ts` arma solo `buildReportHero` (título + 1 párrafo) + motor opcional; `EJE_BASE_DRAFT_ES` solo tiene el eje **D** (I/S/C son `// TODO`), la veta no está cableada a V4, y es **es-only**. Un informe Capa1-solo hoy: crashea (`undefined.perfil`) para el 75% de los ejes, queda bajo el piso de largo, o sale bilingüe Frankenstein. No pasa su propio QC.
- **El viejo ya es IA y pasa la vara.** Es el único generador que hoy produce un informe completo, individualizado y multilingüe.
- **El gate va AFUERA del generador, en `send-email` (choke point único).** Así el viejo (que hoy es fail-OPEN) queda vetado por el QC persistido igual que lo estará Capa 2 mañana. Cuando Capa 2 llegue, se cambia el generador **detrás del mismo gate**, sin tocar la entrega.
- **Cutover atómico y gateado por métrica.** El path nuevo (Capa1 curada + Capa2 IA + validador + guards + gate global + procedencia) se construye en **shadow** contra tráfico real. Criterio de corte binario: Capa1-solo pasa `qualityGate()` en el **100%** de un set de cobertura (12 pares eje×veta × 3 idiomas × casos borde) **y** `tasa_fallback`/`hold_rate` shadow ≤1%. Recién ahí se flipea el flag `report_engine ('legacy'|'v4')`.

---

## 6. Qué construir, en orden (con archivos)

**Fase A — El gate fail-CLOSED alrededor del envío (ship YA, sobre el generador viejo).** Es lo que cierra el sangrado hoy.
1. Migración `perfilamientos`: `report_status`, `held_reason`, `held_at`, `retry_count`, `last_error`, `report_qc jsonb`, `evidence_ficha jsonb` + `NOTIFY pgrst`.
2. `src/lib/reportQuality.ts` — `qualityGate()` puro + suite de tests con fixtures adversariales (eje I/S/C sin base, vector 0, 3-3-3-3, nombre con `$`, lang=en, veta opuesta, plantilla con palabra prohibida, informe fallback-dominante).
3. `api/send-email.ts` — guard temprano: si `report_status!=='ready'` → 409, no envía. `email_sent_at` se estampa **exclusivamente** en el bloque post-Resend gateado por `ready`. Auditar los **6 callers** (path vivo, cron, `one-complete`, resend en `Sessions.tsx` y `TenantPlayers.tsx`, unlock/`full_access`) para que ninguno arme su propio envío.
4. `api/report-recovery-cron.ts` — rework: contar `retry_count`; ambos proveedores caídos / axis_mismatch / ficha ausente tras N intentos → transición a `held` + alerta (no `continue` silencioso, no reintento infinito). Query excluye `held`/`sent`. Desacoplar el HOLD de la ventana de 6h.
5. `api/admin-approve-report.ts` (nuevo) — re-QC + aprobar, sin ventana.
6. `OnboardingFlowV2.tsx` (corre QC → set status; end-screen "preparando"), `ReportPage.tsx`, `one-panel` — estado "preparando" es/en/pt.
7. Extender `ai_events`: `sections_total`, `sections_static`, `guard_types[]`, `held`, `hold_reason`, `provider`, `latency_ms`; tablero + alerta de umbral. Vista admin "Informes retenidos" + SLA en `qa-monitor.ts`.
8. `api/generate-ai.ts` — invertir el fail-open (guard que sobrevive → degradar a estático + marcar procedencia, no servir sucio); AbortController + timeout por proveedor; validación de claves + degradación por sección en vez del 502 global; corrección cross-provider; regla especial resumenPerfil→HOLD.

**Fase B — El sustrato curado y los guards (habilita el path v4 en shadow).**
9. Persistir `question_id` en cada answer (`onboardingData.questionId()` ya existe) + mapeo `question_id→escena` versionado por `questionVersion` (sin esto, `seleccionados=[]` siempre y ningún informe puede citar escena).
10. `archetypeContentV4.ts` — completar `EJE_BASE` I/S/C (9 campos, es/en/pt) + `MOTOR_FALLBACK` por eje + seeds curados **dedicados por sección** (no reusar "bienvenida" para el Retrato), cada uno pre-validado en build-time contra el mismo QC. Re-keyar/auditar `TENDENCIA_CONTENT` a V4 (12 pares, los 4 opuestos reescritos como co-ocurrencia, no tensión).
11. `reportV4.ts` — `buildReportV4()` ensamblador completo; `buildMotorSection` devuelve **fallback estático** en vez de `null`; sanitizador central de interpolación con callback.
12. Guards nuevos deterministas (band, closed-example, closed-moment, ground-truth top-2, name-guard, language-guard) en un **módulo compartido** consumible por `src` (romper el patrón de 5 copias inlined; duplicar-por-build para `api/`), corriendo contra la **plantilla** pre-interpolación. Test de fixture en build-time: si una plantilla nueva dispara un guard, falla CI.

**Fase C — Shadow + cutover.**
13. Feature flag `report_engine` + harness que corre `qualityGate` sobre el set de cobertura y reporta % PASS por celda. Cutover atómico cuando shadow ≤1% en verde.

---

## 7. El hueco que queda (para que el owner lo sepa)

El QC valida **forma y procedencia**, no **verdad**. Quedan tres huecos residuales:

1. **Fabricación bien formada (E1).** En E1 la IA individualiza; si escribe "en el partido del sábado Mateo dudó antes de tirar al arco", eso tiene largo, no repite, no es determinista, no tiene placeholder y su origen es `ai` — **pasa todo el QC y sale**. Un dato inventado bien redactado es indistinguible de uno real para un gate de regex. **Mitigación (no incluida en el gate determinista):** generación *grounded/constrained* (la IA solo reescribe tokens del esqueleto, no agrega hechos) + un check de que ninguna entidad/evento concreto aparezca en Capa2 que no estuviera en la EvidenceFicha. Los `closed-example`/`closed-moment` cubren escenas náuticas whitelisteadas, pero **no** una anécdota deportiva plausible fuera de esa whitelist. Sin grounding, el hueco queda abierto.

2. **"Pobre pero limpio" (E1/E2).** Un texto puede pasar los 12 checks y aun así ser genérico, blando, del deporte equivocado o **contradecir la ficha** (dice "claramente un líder" cuando banda=mezcla, sin disparar band-guard). Ningún regex detecta "ausencia de calidad" ni incoherencia semántica con el registro. Cerrarlo requiere un **juez-IA de calidad** (coherencia-con-la-ficha + riqueza) como gate adicional, él mismo fail-closed (si el juez cae o puntúa bajo → HOLD). Sin él, "pobre pero limpio" sale.

3. **Latigazo tonal residual dentro del techo de E2.** El check de procedencia (§3.10) impide el fallback-dominante y protege el corazón, pero un informe con 1 sección en voz fría de plantilla entre 5 cálidas **igual se lee con una costura**. Es un E2 legítimo por diseño; el owner debe saber que E2 nunca es tan homogéneo como E1. El único cierre total sería prohibir toda degradación (todo defecto → HOLD), a costa de disparar `hold_rate` por encima del 1%.

**Dependencia dura para que nada de esto sea peor:** el envío durable vive en `api/report-recovery-cron.ts`, que **no puede importar `src/lib`**. Si el QC y los estáticos curados no se **persisten** (`evidence_ficha jsonb` + skeleton renderizado) y el veredicto no se **sella en DB** (`report_status`), el cron seguiría enviando informes no-vetados o abandonándolos en silencio. Las columnas persistidas de la Fase A son el prerrequisito no negociable: sin ellas, "caída ≤1%" y "nunca un chico sin informe" **no son verificables** en el único camino que más lo necesita.