# Engine del informe Argo — spec definitiva (holes-closed)

> Diseño definitivo end-to-end (5 capas) + caza adversarial (5 ángulos) + registro de huecos. Sin urgencia, sin parche. Fecha 2026-07-07.

# SPEC DEFINITIVA — Engine del Informe Argo

Documento de arquitectura consolidado. Reconcilia los 5 sub-diseños de capa (escritos por separado, con definiciones divergentes) a un valor canónico único, y adjudica los 55 ataques de la fase adversarial. Lectura para el owner: **no hay hueco-sorpresa. Hay dos huecos ABIERTOS que son el caso central, no residual, y están marcados en rojo.**

---

## 1. Resumen del engine

### Recorrido punta a punta

```
  12 respuestas + métricas de juego + edad + versión + ficha previa
        │
        ▼
 ┌─────────────────────────────────────────────────────────────┐
 │ CAPA 1a — FICHA DETERMINISTA (pura, total, autocontenida)     │
 │   evidenceFicha.ts / profileResolver.ts / ageNorms.ts        │
 │   → EvidenceFicha (votes+perfilTipo, respuestas[12], motor)  │
 │   → evaluateFichaGate() = ÚNICA autoridad de datos           │
 └─────────────────────────────────────────────────────────────┘
        │  (ficha jsonb autocontenida)
        ▼
 ┌─────────────────────────────────────────────────────────────┐
 │ CAPA 1b — SUSTRATO CURADO (esqueleto = fallback bueno)        │
 │   archetypeContentV4.ts / reportV4.ts / reportV4Slots.ts     │
 │   → ReportV4: 15 secciones, slots resueltos, es/en/pt        │
 │   Este texto YA es un informe válido (pasa su propio QC)      │
 └─────────────────────────────────────────────────────────────┘
        │  (SectionSkeleton[] con factCard + allowedScenes)
        ▼
 ┌─────────────────────────────────────────────────────────────┐
 │ CAPA 2 — IA ATADA (editor, no redactor) + AFG                │
 │   reportGrounding.ts (fuente) → inline en generate-ai.ts     │
 │   La IA SOLO pule tono; AFG rebota todo hecho nuevo          │
 │   → SectionResult[] { text, origen:'ai'|'fallback' }         │
 └─────────────────────────────────────────────────────────────┘
        │  (informe ensamblado, versión __NAME__/__SPORT__)
        ▼
 ┌═════════════════════════════════════════════════════════════┐
 ║ CHOKE-POINT DE CALIDAD (fail-CLOSED, server-side)            ║
 ║   reportQuality.ts (codegen inline en seal-report)           ║
 ║   A) qualityGate()  determinista, ~1ms, SIEMPRE             ║
 ║   B) judgeQuality() IA, solo sobre gate-PASS, con floor riq  ║
 ║   → seal-report RECOMPUTA el gate y SELLA report_status      ║
 └═════════════════════════════════════════════════════════════┘
        │  report_status ∈ {ready | held}
        ▼
 ┌─────────────────────────────────────────────────────────────┐
 │ ENTREGA (send-email) + DURABLE (report-recovery-cron)        │
 │   Solo report_status='ready' sale. Claim atómico. Resend arc │
 │   HOLD → cola humana (HUMAN) o auto-reintento (AUTO)         │
 └─────────────────────────────────────────────────────────────┘
```

### Garantía central

**Nunca sale basura.** El único predicado que autoriza el envío es `report_status='ready'`, sellado server-side por el choke-point que recomputa el gate. Ante cualquier problema (datos corruptos, fabricación detectada, guard disparado, IA caída, juez caído, idioma/contenido faltante), el sistema hace **HOLD**, jamás degrada a esqueleto pelado ni filtra `ai_sections` sucios.

**Ningún HOLD vive en limbo.** Toda fila termina en `sent`, en `held`-visto-por-humano, o en auto-resuelto cuando vuelve el proveedor. El stuck-sweeper garantiza que ninguna fila `pending` sobreviva sin verse.

**Límite honesto de la garantía (§4):** el engine impide que salga una fabricación *concreta* (número, nombre propio, evento datado, escena inventada) y un esqueleto *sucio*. **NO impide** que salga una fabricación *conductual en prosa ordinaria* ni un informe Barnum bien formado. Eso solo lo cierra la generación restringida construida + más señal por-niño (§4).

---

## 2. Diseño por capa (canónico, reconciliado)

### Enums canónicos (fuente única, resuelve todos los drifts)

| Concepto | Valor CANÓNICO | Supersede |
|---|---|---|
| `registro` | `'parejo' \| 'matices' \| 'claro' \| 'rotundo'` (piso owner 2026-07-07) | `'mezcla'\|'tentativo'\|'claridad'` (plan §1.1) — eliminar on sight |
| `banda` | `'mezcla' \| 'con_matices' \| 'definido'` | — |
| `tempoZona` | `'lento' \| 'intermedio' \| 'rapido' \| null` | — |
| `vetaBanda` | `'sin' \| 'tentativa' \| 'afirmada'` | — |
| `perfilFamilia` | `'lider' \| 'duo' \| 'versatil' \| 'parejo'` | — |
| **`arquetipoLabel`** | **`= perfilTipo.label` (familia-aware)** | El `'[Primario] con veta [Secundario]'` **incondicional** (profileResolver.ts l.307) queda **ELIMINADO**. Ver reconciliación R1. |

### Capa 1a — Ficha determinista

Función pura y **total**: 12 respuestas + métricas + edad + versión + ficha previa → `EvidenceFicha` jsonb **autocontenida** (regenera el informe entero sin la DB de origen; requisito del cron que no importa `src/lib`).

- **Orden/desempate:** `AXIS_ORDER=['D','I','S','C']`, sort estable, empate → menor índice. Cosmético por construcción.
- **VotesEvidence:** `B=1º−2º`, `B2=2º−3º`, `nEjesFuertes`, `secundarioEmpatado`. Clasificadores: `banda(B)`, `registro(B)` (4 niveles), `forma` (7 valores), `vetaBanda(B2)`, `vetaOpuesta`.
- **`perfilTipo` familia-aware (CANÓNICO, único label):** `{ familia, label, primario, secundario, coLideres[], vetaMostrada }`. Deriva:
  - `B≥2` → `lider`, label `"[Primario]"` (+ sufijo de veta según `vetaMostrada`).
  - `B=1 & forma=duo` → `duo`, `"Perfil de doble motor: [1º] y [2º]"`, coLíderes nombrados.
  - `B=1 & forma=versatil` → `versatil`, `"Perfil versátil, con base [1º]"`.
  - `B=0 & duo_empate` → `duo`; `B=0 & equilibrio` → `parejo`, `secundario=null`.
  - **`arquetipoLabel` persistido = `perfilTipo.label`.** La columna plana `veta_eje` guarda el EJE de veta (para dashboard/query), nunca el string de display.
  - **Opuestos:** la veta opuesta SÍ figura en el encabezado, con label de **co-ocurrencia** (`"Impulsor y Sostenedor"`, no `"con veta"`); `vetaOpuesta=true` es flag de modo-de-copy para el cuerpo (conector "y", vocabulario positivo).
- **`respuestas: AnswerRecord[12]`** embebido en la ficha (`{questionId, axis, responseTimeMs, signatureScene}`). Requisito duro: tormenta/meta/momentos/evolución regeneran desde la ficha sola.
- **MotorInsight bandeado** (`referencia_bibliografica`, IC ancho): `narratable` exige `isFinite(edadMeses) && 96≤edadMeses≤192 && sub-motores avg finito>0 && nTrials≥MIN_TRIALS_TEMPO(3)`. **Guard NaN:** `!isFinite(edadMeses) ⇒ edadValidaParaMotor=false` (no propaga NaN a tempo). `tempoScore=0.5·score(decision.af)+0.5·score(reaction.af)`; `impulsivityBonus/errorPenalty` **eliminados**. Motor es **OPCIONAL**: `narratable=false` ⇒ sección omitida limpio.
- **Gate de datos = ÚNICA autoridad (`evaluateFichaGate`):** HOLD duro solo por `sum≠12`, `respuestas.length≠12`, axis inválido, questionId desconocido. Edad inválida / juegos faltantes ⇒ `motorDrop` (degrada, NO HOLD). `ESCENA_LITERAL` ausente ⇒ `themeDegrade`. `nEjesFuertes===4` ⇒ enruta a plantilla `parejo` (**NO HOLD**).

### Capa 1b — Sustrato curado

Anti-explosión: cada sección depende de **un** driver-dimension, no del producto cruzado. ~77 unidades autorables por idioma (×3 = 231). Records **totales** por enum (celda faltante NO COMPILA, mata el bug vivo `EJE_BASE_DRAFT_ES: Partial`).

- Clases: EJE (10 sec, `Record<Axis,_>`), TONO (registro-keyed), ZONA (motor), PATRON, VETA (12 pares + sin-veta), RELACIONAL (grupo), EVOLUCION, INVARIANTE.
- **Plantilla vs Dato:** prosa fija espejada (pre-validada en build) + slots de vocabulario cerrado. `{cifra}` solo en `rotundo/claro`; `{escena}/{opcionTexto}` solo en variante con-momento y **verbatim** de `momentos.seleccionados[]`.
- **`buildReportV4`** ensambla 15 secciones; cada `SectionV4.texto` es simultáneamente el fallback bueno y el esqueleto que Capa 2 reescribe.
- **QC en build-time (`seedQuality.test.ts`):** cada seed pasa el mismo `qualityGate` + rango de largo + lint de opuestos (0 hits de conflicto en los 4 pares diagonales).

### Capa 2 — IA atada + AFG

La IA es **editor de tono**, no redactor. El esqueleto es el borrador casi-final; la tarea es pulido. Temp **0.4**. Contrato de tokens **FROZEN / MUTABLE / PROHIBIDO INTRODUCIR**. `__NAME__`/`__SPORT__` se rehidratan **después** de todos los checks.

- **AFG** (puro, por sección, pre-rehydration): `allowed = tokens(bundle.texto) ∪ factCard ∪ allowedScenes ∪ SAFE_VOCAB ∪ {__NAME__,__SPORT__,edad}`. Cuatro tiers: número, nombre propio, léxico episódico, actor ajeno. **`allowedNumbers` global compartido `{topCount, 12}`** (no per-sección aislado — reconcilia A5.8). **Léxico episódico ampliado** a sustantivos-evento en minúscula (`el clásico/la final/el mundial/la copa/el torneo`) es/en/pt. **Detector de estado emocional de mini-juego** (lexicón cerrado) en la sección motor.
- **Licencia de "gesto genérico del deporte": REVOCADA** (reconcilia A1.2/A1.4/A3.6). El deporte aparece **solo como slot-sustantivo validado**, nunca como observación de juego inventada. Posiciones/roles **fuera** de `SPORT_LEXICON` de display.
- **Deporte con D-validación** (reconcilia A1.3): mismo D3 que el nombre (largo, control-chars, blacklist), tokenizado, nunca crudo en el prompt.
- **Presupuesto:** `AbortController` + `deadline=t0+54s`; caps 18/16/16s. Corrección única cross-provider al proveedor opuesto. Guard que sobrevive ⇒ degrada a esqueleto (grounded por construcción). Ambos proveedores caídos ⇒ señal `ai_unavailable` ⇒ HOLD.

### Capa QC — Choke-point (fail-CLOSED)

Dos etapas, ambas fail-closed, sobre versión `__NAME__` (pre-rehydrate).

- **Etapa A — `qualityGate()` (determinista, siempre, gratis):** GROUP 1 DATOS (**espeja `evaluateFichaGate`, no lo contradice**: edad → degrade, `nEjesFuertes===4` → parejo, `questionVersion` validado en ingest), GROUP 2 FORMA, GROUP 3 BASURA (umbral 0), GROUP 4 GUARDS (prohibited, deterministic **ampliado con hedges de frecuencia y claims longitudinales**, ground-truth con whitelist **expandida a ejes co-fuertes** cuando `nEjesFuertes≥3`, band, closed-scene, name, language), GROUP 5 PROCEDENCIA (corazón fallback → HOLD; ≥2 CORE o >40% → HOLD), GROUP 6 CONSISTENCIA (C6 compara `perfilTipo.label`; `secundarioEmpatado` nombra co-líderes en subtítulo+tendencia), GROUP 7 REPETICIÓN (SOFT, degrada una vez). R5 **relabelado** a "presencia de deporte", no "prueba de individuación".
- **Etapa B — `judgeQuality()` (IA, solo sobre gate-PASS):** rúbrica 1-5 (coherencia 0.40, riqueza 0.30, interna 0.15, tono 0.15). **UMBRAL CANÓNICO: `ready` solo si `overall≥3.5 Y coherencia≥3 Y riqueza≥3 Y vetoes===0`** (floor de riqueza añadido — reconcilia A3.1). Few-shot de calibración incluye un caso "competente-pero-intercambiable → riqueza 2". Fail-closed: caído/timeout/parse/veto → HOLD.

### Capa Entrega — Estados + HOLD + medición

- Máquina `report_status ∈ {pending|ready|held|sent}`. Invariante: **solo `ready` sale**.
- **`seal-report` = único writer, RECOMPUTA el gate server-side** sobre `(ai_sections, evidence_ficha)` — el browser **no puede proponer** `report_status` (reconcilia A4.1). Alerta solo en el borde `→held` (race-safe por `WHERE report_status<>'held' RETURNING`), con **agregación global por ventana** además del dedup per-row.
- **`send-email`:** guard 409 si `≠ready`; **claim atómico** `UPDATE...SET report_status='sent' WHERE report_status IN ('ready') RETURNING` **antes** de Resend + **send-ledger con clave de idempotencia escrita pre-Resend** (reconcilia A4.2/A4.3). **Arco de reenvío:** resend permitido con `status IN ('ready','sent')` (reconcilia A4.8).
- **`/api/report`:** gate **server-side** — si `≠ready/sent` devuelve shape "preparando", nunca `ai_sections` (reconcilia A4.7).
- **Cron:** query accionable incluye `held WHERE held_class='auto' AND retry_count<bound` (reconcilia A4.4); **claim atómico de fila** (`status='processing'` / SKIP LOCKED, reconcilia A4.9); regenera **desde `evidence_ficha`**, no flat cols (reconcilia A4.13); stuck-sweeper sin ventana; `held_reason='sin_email'` con captura admin (reconcilia A4.12).
- **Live path (canónico, reconcilia A4.10):** generación + gate + juez + sello corren en **un endpoint server** invocado fire-and-forget por el browser; el niño **siempre** ve "preparando"; la entrega es por email. El live nunca sella `ready` en el browser.
- **Cutover:** feature-flag `report_gate_enabled` + orden de deploy (emisor de verdict → seal-report → guard de send-email último).
- **Medición:** `tasa_fallback` (ratio, existe día-1). **Discriminación con decoys INTRA-CELDA** (mismo eje+veta+registro, distinto niño, contra azar 1/2), no inter-eje (reconcilia A3.2/A3.11). El carril inter-eje se conserva solo como piso-de-sanidad.

---

## 3. REGISTRO DE HUECOS (los 55 ataques, con veredicto)

Leyenda: **CERRADO** (por parte del diseño consolidado) · **ACEPTADO** (con mitigante) · 🔴 **ABIERTO** (sin resolver).

### Ángulo 1 — IA que fabrica

| # | Ataque | Sev | Estado | Justificación |
|---|---|---|---|---|
| A1.1 | Fabricación conductual en prosa ordinaria recombinando tokens permitidos ("tiende a apagarse y se esconde") | crítico | 🔴 **ABIERTO** | Premisa del AFG (toda fabricación trae número/nombre/episodio/actor) es falsa. Solo se mitiga con generación restringida (§4). Caso central, no residual. |
| A1.2 | "Gesto genérico del deporte" como vector licenciado | crítico | **CERRADO** | Licencia **REVOCADA**. Deporte = slot-sustantivo validado, jamás observación de juego inventada. |
| A1.3 | `deporte` free-text sin D3, canal de inyección | crítico | **CERRADO** | D3-para-deporte (largo/control-chars/blacklist) + tokenización `__SPORT__` + nunca crudo en prompt. |
| A1.4 | Fabricación de posición/rol vía `SPORT_LEXICON` | alto | **CERRADO** | Posiciones fuera de `SPORT_LEXICON` de display; sigue del principio "atributo no en ficha ⇒ no afirmable" para dimensiones cerradas. Residual de prosa → A1.1. |
| A1.5 | Contradicción de eje sin nombrar el eje (S primario + conducta D) | alto | 🔴 **ABIERTO** | G3 mira labels, no conductas eje-típicas. Solo lo ve el juez (permisivo). Familia de A1.1. |
| A1.6 | Negación/frecuencia esquiva DETERMINISTIC ("casi nunca", "le cuesta") | alto | **ACEPTADO** | Lista de hedges ampliada + generación restringida reduce latitud; el whack-a-mole residual → A1.1. |
| A1.7 | Estado emocional inventado del mini-juego | medio | **CERRADO** | Detector determinista de emo-verbos (lexicón cerrado) en sección motor + motor es plantilla locked. |
| A1.8 | Sustantivos-evento en minúscula ("el clásico", "la final") | medio | **CERRADO** | `EPISODIC_TRIGGERS` ampliado a lexicón de eventos es/en/pt. Lista cerrada (residual exótico → ACEPTADO). |
| A1.9 | Backstory de desarrollo usando la edad allowlisteada ("a los 8 ya...") | medio | **ACEPTADO** | Patrón longitudinal ("a los N años"/"desde chico") añadido a deterministic; framing de tendencia residual → A1.1. |
| A1.10 | Todo recae en el juez, estructuralmente incapaz | crítico | 🔴 **ABIERTO** | El juez single-report no accede a verdad externa; premia lo rico-coherente = premia fabricación plausible. Es el fondo de A1.1/A3.3. |
| A1.11 | Esqueleto rico ⇒ `allowed` grande ⇒ AFG más débil | medio | **ACEPTADO** | Tensión reconocida; mitigante = generación restringida achica la superficie; residual → A1.1. |

### Ángulo 2 — Datos degenerados

| # | Ataque | Sev | Estado | Justificación |
|---|---|---|---|---|
| A2.1 | Label duo/parejo: `perfilTipo.label` vs `arquetipoLabel` vestigial → C6 HOLD masivo (59%) | crítico | **CERRADO** | R1: `arquetipoLabel = perfilTipo.label` canónico; C6 compara ese; `veta_eje` guarda el eje, no el display. |
| A2.2 | 3-3-3-3: `§6` enruta a parejo vs `D7` HOLD | alto | **CERRADO** | `evaluateFichaGate` es única autoridad. `nEjesFuertes===4` → plantilla parejo. `D7` eliminado (HOLD solo si la plantilla parejo falla su propio QC). |
| A2.3 | Edad fuera de rango: `§6` motorDrop vs `D5` HARD HOLD | alto | **CERRADO** | Canónico: motorDrop (motor opcional). `D5` degradado en QC a degrade-not-HOLD. |
| A2.4 | `questionVersion` defaultea 'unknown' → `D8` HOLD masivo | alto | **CERRADO** | `questionVersion` **required en ingest** (400 si falta). Sin default 'unknown'. |
| A2.5 | `edadMeses=NaN` / 0 trials → tempo real sobre basura | medio | **CERRADO** | Los 3 guards prometidos (`isFinite`, avg finito>0, `nTrials≥3`) van al build plan (Fase 1). |
| A2.6 | Celda `ESCENA_LITERAL[qv][qid][axis]` faltante → TypeError | medio | **CERRADO** | Guard per-celda: celda ausente ⇒ degrada a genérico, nunca indexa undefined. |
| A2.7 | Drift de versión: conteo tormenta ≠3 | medio | **CERRADO** | Builder maneja n∈{0,1,2,4} → cae a contextual/degrade; no asume 3. |
| A2.8 | Cron lee ficha sin `respuestas[]` (ventana intra-migración) | medio | **CERRADO** | Guard de shape/version (`version:4 && respuestas presente`) antes de `.length`; ficha vieja → path degrade. |
| A2.9 | Nombre con metacaracteres regex en `buildMotorSection` | bajo | **CERRADO** | Migrar `buildMotorSection` a `fillSlots` callback (Fase 1). |

### Ángulo 3 — Barnum / "pobre pero limpio"

| # | Ataque | Sev | Estado | Justificación |
|---|---|---|---|---|
| A3.1 | Juez: `riqueza` sin piso → riq=1 shippea | crítico | **CERRADO (con consecuencia)** | Floor `riqueza≥3` añadido. **Consecuencia:** holdea perfiles genéricos legítimos → expone A3.4/A3.5. |
| A3.2 | Discriminación mide eje equivocado (decoys inter-eje) | crítico | **CERRADO (diseño)** | Métrica corregida a decoys **intra-celda** vs azar. Validez → §4 (data-gated). |
| A3.3 | Juez ciego al Barnum por categoría (relacional, single-report) | crítico | 🔴 **ABIERTO** | Barnum es propiedad de conjunto; el juez ve un informe. Solo lo detecta la distancia léxica intra-celda offline + más señal. El juez no es el instrumento. |
| A3.4 | El cuerpo es UN texto por eje: ~144 esqueletos para toda la población | crítico | 🔴 **ABIERTO** | Arquitectónico. La única variación es {topCount, veta, tempoZona, 0-2 momentos}. Cerrarlo = más señal (momentos construidos + módulos) = §4. |
| A3.5 | Perfil modal (parejo) es el más Barnum y pasa más fácil | alto | 🔴 **ABIERTO** | Con floor de riqueza ahora HOLDEA o shippea genérico. Resolución = contenido parejo-específico genuino (build). |
| A3.6 | AFG permite la mutación que textura el Barnum | alto | **CERRADO** | Licencia de gesto deportivo revocada (A1.2). Calidez-genérica residual → A3.4. |
| A3.7 | `momentos` (único gancho) apagado en perfiles más nítidos | alto | 🔴 **ABIERTO** | `ESCENA_LITERAL` sin dueño → `momentos=[]` siempre; caso nulo cita escena compartida. Build-gated (§4). |
| A3.8 | R5 da falsa señal de individuación (mide presencia de string) | medio | **CERRADO** | R5 relabelado a "presencia de deporte"; no se lo cuenta como prueba de individuación. |
| A3.9 | Few-shot del juez calibra contra Barnum egregio, no competente | medio | **ACEPTADO** | Few-shot "competente-intercambiable → riqueza 2" añadido; no-determinismo residual ACEPTADO. |
| A3.10 | Deja niños sin informe por idioma (en/pt no autorado) | alto | 🔴 **ABIERTO** | Contenido en/pt inexistente. Launch-gate: no vender no-es hasta autorar (§4/§5). |
| A3.11 | Sintético verde oculta el colapso (mide inter-eje) | alto | **CERRADO (diseño)** | Sintético mide distancia intra-celda vs azar. Igual fix que A3.2. |

### Ángulo 4 — Entrega / concurrencia / persistencia

| # | Ataque | Sev | Estado | Justificación |
|---|---|---|---|---|
| A4.1 | `seal-report` browser-reachable confía en el verdict del body → ready forjable | crítico | **CERRADO** | `seal-report` **recomputa el gate server-side**; el browser no propone `report_status`. |
| A4.2 | Doble envío por idempotencia no-atómica | alto | **CERRADO** | Claim atómico `UPDATE...WHERE status='ready' RETURNING` + send-ledger con clave pre-Resend. |
| A4.3 | Estampa `email_sent_at` swallowed → re-envío | alto | **CERRADO** | Send-ledger escrito **antes** del fetch a Resend; sin catch que oculte la marca. |
| A4.4 | AUTO-hold vs query del cron que excluye held → nunca resuelve | alto | **CERRADO** | Query incluye `held WHERE held_class='auto' AND retry_count<bound`. |
| A4.5 | Cutover fail-open→closed sin secuencia → no-entrega masiva | alto | **CERRADO** | Feature-flag `report_gate_enabled` + orden de deploy explícito. |
| A4.6 | Cobertura de contenido incompleta → cohorte HELD | alto | 🔴 **ABIERTO** | I/S/C + en/pt sin autorar. Launch-gate duro (§4/§5). |
| A4.7 | Gate solo client-side; `/api/report` sirve `ai_sections` sucios | alto | **CERRADO** | Gate **server-side** en `/api/report`; devuelve "preparando" si `≠ready/sent`. |
| A4.8 | "Solo ready envía" rompe todos los resends de 'sent' | alto | **CERRADO** | Arco de reenvío: resend con `status IN ('ready','sent')`. |
| A4.9 | Cron sin claim → runs solapados doble-generan/envían | alto | **CERRADO** | Claim atómico (`status='processing'` / SKIP LOCKED). |
| A4.10 | Live path: pierde secciones / ¿quién corre el juez? | alto | **CERRADO** | Canónico: gate+juez+sello en un endpoint server; live nunca sella ready; niño ve "preparando". |
| A4.11 | Tormenta de alertas al flip/outage | medio | **ACEPTADO** | Agregación global por ventana sobre el dedup per-row; residual bajo ACEPTADO. |
| A4.12 | Fila sin `adult_email` nunca se entrega | medio | **CERRADO** | `held_reason='sin_email'` + ruta de captura admin. |
| A4.13 | Cron regenera desde flat cols, no `evidence_ficha` → durable degradado | medio | **CERRADO** | Cron pasa `evidence_ficha` a generate-ai. |
| A4.14 | Recreación de VIEW + NOTIFY como punto único de falla | bajo | **ACEPTADO** | `CREATE OR REPLACE` verificado en staging + NOTIFY obligatorio; riesgo de deploy estándar ACEPTADO. |

### Ángulo 5 — Coherencia inter-capa / i18n / producto

| # | Ataque | Sev | Estado | Justificación |
|---|---|---|---|---|
| A5.1 | Doble fuente de nombre (perfilTipo vs arquetipoLabel + C6) | crítico | **CERRADO** | R1 (= A2.1). |
| A5.2 | Motor cronométrico contradice el perfil de votos en la cara del padre | alto | **ACEPTADO** | Mitigante: framing de lente-separada explícita + hedge/supresión cuando `tempoZona` contradice fuerte + IC ancho + label `referencia_bibliografica`. Validez del confound de dispositivo → §4. |
| A5.3 | i18n roto de raíz (`buildReportHero` sin lang, `'es'` hardcodeado) | alto | 🔴 **ABIERTO** | Cablear `lang` en todo el render + autorar en/pt. Familia A3.10/A4.6. Build-gate. |
| A5.4 | Lead 'matices' se autocontradice ("presencia clara"+"asoma algo de") | medio | **CERRADO** | Reescribir lead matices; desacoplar `conVeta` de `vetaBanda='sin'`. |
| A5.5 | Veta arbitraria por empate visible en subtítulo y tendencia | alto | **CERRADO** | `secundarioEmpatado` nombra co-líderes simétricamente en subtítulo+tendencia cuando 2º==3º. |
| A5.6 | Meter de confianza contradice el texto en 'parejo' (barra 1/4 vs "fortaleza") | medio | **CERRADO** | Rediseño semántico del meter: eje "forma del perfil", no "confianza 1-4"; parejo no se lee como "peor". |
| A5.7 | G3 top-2 choca con perfiles multi-eje co-fuertes | medio | **CERRADO** | Whitelist de G3 derivada de la ficha (incluye ejes co-fuertes cuando `nEjesFuertes≥3` / `secundarioEmpatado`). |
| A5.8 | AFG degrada CORE por repetir '12' → HOLD | medio | **CERRADO** | `allowedNumbers` global `{topCount, 12}` compartido, no per-sección. |
| A5.9 | `questionVersion` 'unknown' → D8 HOLD | medio | **CERRADO** | = A2.4. |
| A5.10 | Veta opuesta entra al subtítulo crudo como par de opuestos | bajo | **CERRADO** | Subtítulo usa label de co-ocurrencia (`"Impulsor y Sostenedor"`); el cuerpo carga el frame con "y" no "pero". |

**Conteo:** 55 ataques. **ABIERTOS (🔴): 7** — A1.1, A1.5, A1.10, A3.3, A3.4, A3.5, A3.7 (familia fabricación-en-prosa/Barnum) + A3.10, A4.6, A5.3 (familia contenido/i18n). Nota: A1.5/A1.10/A3.3/A3.4/A3.5/A3.7 son **el mismo hueco raíz** visto desde seis ángulos.

---

## 4. Lo que SOLO se cierra con datos/build (explícito, no escondido)

### 🔴 HUECO 1 — Fabricación conductual en prosa + Barnum intra-eje (el caso CENTRAL)

Ataques A1.1, A1.5, A1.10, A3.3, A3.4, A3.5, A3.6, A3.7. **El post-hoc (AFG + guards + juez) NO lo cierra**, por dos razones estructurales demostradas por los ataques:

1. El AFG es un diff de tokens: recombinar tokens permitidos en una afirmación nueva y falsa (o negativa) no introduce ningún token nuevo.
2. El juez es single-report: no accede a verdad externa y no puede ver que 40 niños del mismo eje recibieron el mismo párrafo. Premiar "rico y coherente" premia la fabricación plausible.

**Qué lo cierra (build + volumen):**
- **Generación restringida construida:** que la IA reescriba **solo tokens del esqueleto** (no prosa libre), con un entity-diff que verifique que ninguna entidad/afirmación conductual de la salida esté ausente de la ficha. Hoy no existe; es una reescritura de Capa 2 que hay que **construir y medir en shadow**.
- **Métrica de discriminación intra-celda corrida a VOLUMEN:** el sintético da un número día-1, pero su correlación con reconocimiento humano real solo se prueba con el carril 2AFC in-product (mismo arquetipo, distinto niño) acumulado desde el usuario #1. **Hasta ese volumen, "el engine identifica" es una hipótesis, no un hecho.**
- **Más señal por-niño genuina:** los momentos no alcanzan (se apagan en los perfiles más nítidos). Individuación real más allá del eje requiere `ESCENA_LITERAL` construido (Fase B, hoy sin dueño) + módulos científicos adicionales (`docs/CIENCIA-MODULOS-ARGO.md`).

**Consecuencia operativa:** el floor de riqueza (A3.1) que evita el Barnum **holdea** los perfiles genéricos legítimos (parejo/low-data). Sin contenido parejo-específico construido, o holdeás mucho o shippeás Barnum. **Esta tensión no se resuelve en diseño.**

### 🔴 HUECO 2 — Cobertura de contenido + i18n (launch-gate duro)

Ataques A3.10, A4.6, A5.3. La prosa I/S/C (hoy solo D esbozado) y los espejos en/pt **no están escritos**. El fail-closed es correcto (HOLD > basura), pero deja **~75% de perfiles no-D y 100% de en/pt sin informe**. No es parcheable: requiere **autoría gateada por el sign-off de voz del owner + revisión nativa en/pt**. Es una precondición dura del flip, no un residual.

### HUECO 3 (data-gated, menor) — Validez del motor

Ataque A5.2 (residual). Las bandas de tempo son `referencia_bibliografica`; el corte p33/p67 real por celda de edad necesita ~500 juegos/celda de población Argo (excluyendo demo/owners); el confound de latencia de dispositivo (teléfonos ajenos) no está instrumentado; la edad en meses reales necesita capturar DOB en la UI. Hasta entonces el motor se sirve con IC ancho, copy probabilístico y framing de lente-separada.

---

## 5. Plan de construcción DEFINITIVO

Principio: **todo detrás del choke-point de calidad desde el diseño.** Las fases 1, 3, 4, 6 corren en **SHADOW** (computan + loguean, sin cambiar la entrega). La fase 5 es el flip. Criterio de cutover **binario** por feature-flag, por-idioma/por-eje según completa el contenido.

### Fase 0 — Fundación (migraciones + required, sin flip de comportamiento)
- `supabase/migrations/20260707_report_status_hold.sql`: columnas `report_status/held_reason/held_at/held_alert_level/retry_count/last_error/report_qc(jsonb)/evidence_ficha(jsonb)/judge_score` + CHECK NOT VALID + 2 índices parciales + recrear `current_perfilamiento` (verificado en staging, CREATE OR REPLACE) + `NOTIFY pgrst`. Segunda migración aditiva: `ai_events` (telemetría) + tabla `report_discrimination_probe` + `send_ledger` (idempotencia).
- `api/session.ts` + `api/one-complete.ts`: **`questionVersion` required** (400 si falta) + persistir `evidence_ficha` + ~24 columnas planas + `answers` con `question_id`.
- **Shadow:** no. Es aditivo/infra. **Cutover:** ninguno (default `pending` sin backfill, forward-only).

### Fase 1 — Ficha determinista (SHADOW)
- `src/lib/evidenceFicha.ts`: `respuestas: AnswerRecord[]`; `perfilTipo` canónico; **`arquetipoLabel = perfilTipo.label`** (R1).
- `src/lib/profileResolver.ts`: `buildVotesEvidence` familia-aware; **eliminar** `'[P] con veta [S]'` incondicional (l.307); guards `edadValidaParaMotor`+`MIN_TRIALS_TEMPO`; eliminar `impulsivityBonus/errorPenalty`; embeber `respuestas[]`.
- `src/lib/ageNorms.ts`: guard NaN en `factorEdad`; `tempoZona` bandeado.
- `src/lib/reportV4.ts`: `buildReportV4` + 15 builders; `buildMotorSection` a `fillSlots` callback; builders de tormenta/meta/grupo/inesperado/momentos/evolución con guards per-celda `ESCENA_LITERAL` y n≠3.
- `src/lib/fichaGate.ts` (NUEVO): `evaluateFichaGate` **= única autoridad de datos**.
- `src/lib/onboardingData.ts`: mapa versionado `ESCENA_LITERAL`.
- **Shadow:** computar ficha+gate junto al path viejo, loguear divergencias de label. **Cutover parcial:** cuando divergencia de label inesperada = 0.

### Fase 2 — Sustrato curado (BUILD LONG POLE, gated por autoría)
- `src/lib/archetypeContentV4.ts` + `.en.ts` + `.pt.ts`: `EJE_BASE` total (I/S/C + en/pt); `PERFIL_LEAD`/`BANDA` (reescribir matices, A5.4); `TENDENCIA` (12 pares, 4 opuestos co-ocurrencia); `GRUPO`/`EVOLUCION`/`MARCO`; meter rediseñado (A5.6).
- `src/lib/reportV4Slots.ts` (NUEVO): `Slots`, `fillSlots` callback ($-safe), `rolGrupo`, `evoReg`.
- `src/lib/seedQuality.test.ts` (NUEVO): enumera section×index×lang, corre `qualityGate` + rangos + lint opuestos.
- **Gate de esta fase (bloqueante del flip):** sign-off de voz del owner sobre I/S/C + revisión nativa en/pt. **Sin esto, el flip queda restringido a `es`+`D`.**

### Fase 3 — QC gate + juez (SHADOW)
- `src/lib/reportQuality.ts` (NUEVO): `qualityGate` puro (GROUP 1 **espeja fichaGate**; G3 whitelist expandida; C6 vs `perfilTipo.label`; `allowedNumbers` global) + detectores.
- `api/judge-quality.ts` (NUEVO): juez con **floor `riqueza≥3`** + few-shot competente-intercambiable + fail-closed.
- `scripts/gen-quality-gate.mjs` + `check:quality-gen` (codegen inline, patrón `gen:coach`).
- **Shadow:** correr gate+juez sobre informes live, loguear verdicts en `report_qc`, sin cambiar la entrega.

### Fase 4 — IA atada + AFG (SHADOW)
- `src/lib/reportGrounding.ts` (NUEVO) + `.test.ts`: AFG (episódico ampliado, actor, número global, detector emo-motor), `SPORT_LEXICON` sin posiciones, D3-deporte. Test build-time: correr AFG sobre TODAS las plantillas (0 falsos positivos).
- `api/generate-ai.ts`: esqueleto casi-final en el prompt (invertir l.175), FROZEN/MUTABLE, **licencia de gesto deportivo REVOCADA**, `__SPORT__` tokenizado+validado, `AbortController`+presupuesto, corrección cross-provider batcheada, invertir fail-open → degradar a esqueleto.
- `check:api-imports` extendido: diff del bloque AFG inline vs fuente.
- **Shadow:** generar con IA atada, correr AFG, loguear `origen`/`guardTrail`, comparar contra el path viejo.

### Fase 5 — Máquina de entrega (EL FLIP)
- `api/seal-report.ts` (NUEVO): único writer, **recomputa el gate server-side**, alerta de borde + agregación global, telemetría.
- `api/send-email.ts`: guard 409 `≠ready` + 400 sin `session_id` + claim atómico + send-ledger pre-Resend + arco resend (`ready|sent`) + `template:'report'|'unlock'` (absorbe `admin-grant-access`).
- `api/report.ts`: gate **server-side** (preparando si `≠ready/sent`).
- `api/report-recovery-cron.ts`: claim atómico de fila, query incluye AUTO-holds, regenera desde `evidence_ficha`, stuck-sweeper, `held_reason='sin_email'`.
- `api/admin-approve-report.ts` (NUEVO): re-QC + re-judge + aprobar.
- `src/components/onboarding/OnboardingFlowV2.tsx` + `src/pages/ReportPage.tsx` + one-panel: gate sobre `report_status`; `PreparandoState` es/en/pt.
- **Feature-flag `report_gate_enabled`** + orden de deploy: emisor de verdict → seal-report → guard de send-email **último**.

### Fase 6 — Discriminación / anti-Barnum (SHADOW + acumulación)
- `scripts/qa/discrimination.mjs`: sintético **intra-celda** (mismo eje+veta+registro, distinto niño) vs azar. Falla CI si distancia < umbral.
- Widget 2AFC in-product → `report_discrimination_probe`.

### Criterio BINARIO de cutover (flip de `report_gate_enabled`)

El flag se enciende **por idioma y por eje** solo cuando **TODAS** se cumplen:

1. **Contenido completo** para ese (idioma, eje): `EJE_BASE` autorado + sign-off de voz + `seedQuality.test` verde. (Sin esto, ese segmento NO se vende ni se flipea.)
2. **Shadow de gate** sobre tráfico live: `HOLD-rate` comprendido y `evidence_ficha` label-divergencia inesperada = 0.
3. **Shadow de seal-report** recompute == verdict de generate-ai = 100% de coincidencia.
4. **Discriminación intra-celda sintética** > azar por el margen definido en todas las celdas de ese segmento.
5. **Delivery** verificado: claim atómico + send-ledger sin doble-envío en carga sintética; `/api/report` no filtra `ai_sections` sucios.

Mientras un segmento no cumpla (1), su flag queda apagado y sus informes se retienen `held('language_mismatch'|'cobertura_eje')` con SLA humano visible. **No hay flip global. Es incremental por segmento a medida que el contenido se completa.**

---

## Nota final para el owner (lo ABIERTO, dicho fuerte)

🔴 **El engine es fail-closed y no dejará SALIR basura concreta ni esqueleto sucio.** Pero dos cosas quedan ABIERTAS y son el caso central, no un residual:

1. **Fabricación conductual en prosa + Barnum intra-eje.** El AFG + el juez no lo cierran por construcción (diff de tokens ciego a recombinación; juez single-report ciego al Barnum relacional). Se cierra **solo** construyendo generación restringida (medida en shadow) y probando "identifica" con la métrica intra-celda a volumen. Hasta entonces, para la mayoría de los niños del mismo eje el informe es cálido, correcto, pasa todo, y **le calza a cualquiera**. El floor de riqueza evita shippearlo pero **holdea** los perfiles genéricos legítimos: esa tensión no se resuelve en diseño, se resuelve con más contenido específico y más señal por-niño.

2. **Contenido I/S/C + en/pt sin autorar.** Es un launch-gate duro: hasta que exista, ~75% de perfiles y todo comprador no-español quedan en HOLD sin informe. No se parchea; se autora, con el flip incremental por segmento.

Todo lo demás (labels, contradicciones de gate, crashes, entrega/concurrencia/persistencia, i18n de render, coherencias de texto vivas) está **CERRADO en este diseño consolidado** y plegado en el plan de construcción.