# Plan de implementación — Rediseño del método Argo

> Generado por una revisión grado-implementación (10 agentes leyendo el código real contra la spec v4 `METODO-CALCULO-NUEVO.md` + el mapa `METODO-IMPACTO-NAMING.md`). Forward-only, todo local en `develop`, **sin push**. Fecha: 2026-07-06 (corrida autónoma nocturna).

## Decisiones tomadas por default (owner dormido — REVISAR a la mañana)

El plan (§6 más abajo) lista 15 decisiones abiertas. Con el owner durmiendo, tomé el default **más conservador y honesto** de cada bloqueante para no frenar, y las dejo marcadas. Ninguna se pushea; todas son reversibles.

| # | Decisión | Default tomado | Reversible en |
|---|---|---|---|
| 1 | Edad en meses | **Aproximar `edad*12`** (el engine funciona; capturar mes/fecha de nacimiento queda como mejora flagueada). Se pierde el gradiente intra-celda hasta capturar DOB real — anotado como límite. | AdultRegistration + `factorEdad` |
| 2 | Tabla de normas p33/p67 por edad | **Semilla = anclas `factorEdad` del spec (8:1.45…16:1.00); sin percentiles reales, `tempo_zona` SIEMPRE = `intermedio` (el IC cruza el corte).** Nunca se afirma una zona hasta tener norma real. Fail-safe honesto. | `ageNorms.ts` (dato) |
| 3 | Léxico "con veta" | **es: "con veta [Eje]"** (spec + owner). **en: "with a [Axis] lean". pt: "com veta [Eixo]".** Flagueado para confirmar. | `archetype-naming.md` |
| 4 | 4 bases vs 12 blends editoriales | **4 bases por eje + diferencial de veta** (recomendado: honesto con el modelo, menor copy). | `archetypeData.ts` |
| 5 | Eje-tiebreaker en B=0 | **Eliminar** (contamina la ipsatividad); `session-context.ts` pierde `motors`. | engine |
| 6 | `method_version` de filas viejas | **NULL = legacy** (sin backfill); branch en report-recovery/admin-grant. | migración |
| 7 | decisionPattern | **Eliminar del informe** (§12.7). | render |
| 8 | STATIC_FALLBACK copy | **Genero un placeholder honesto es/en/pt por sección** ("no reunimos suficiente para esta parte"); el owner puede refinar. | generate-ai |
| 9 | ai_events guards | **Columnas nuevas** (telemetría por guard). | migración ai_events |
| 10 | "Su motor" a nivel GRUPO | **Eliminar toda vista agregada de motor** (cualquier barra/tipo reintroduce comparación cruda §12). | dashboard |
| 11 | "Su motor" individual en dashboard | **Solo en el informe** por ahora (no exponer en tenant-sessions). | dashboard |
| 12 | AdultMotor del Puente | **Fuera de esta corrida** (constructo adulto separado; decisión de producto). | — |
| 13 | Barandas §16/§17 en demo | **Sí, mostrarlas** (son barandas éticas). | render |
| 14 | Gancho "12" en marketing | **Conservar "12" (4 puros + 8 blends)**; DistributionChart→eliminar MotorChart, Metrics agrupa por eje. | web |
| 15 | Lead-in banda tentativa | **Prefijo genérico** por ahora (curado por combo = mejora futura). | render |

**Cosas que NO hago solo (última milla, requieren al owner):** aplicar la migración a la DB de prod (escribo el SQL, no lo corro), `git push`, y confirmar los defaults de arriba. Ver el reporte de cierre al final de la corrida.

---

# Plan de implementación — Rediseño del método Argo (naming eje×veta + motor como insight)

Consolidado de las 10 revisiones grado-implementación. Forward-only, todo local en `develop`, sin push hasta orden explícita. Solo se referencian archivos reportados por las áreas; lo no cubierto queda marcado como GAP.

---

## 1. Resumen y contrato de datos (la ficha de evidencia)

La Capa 1 (determinista) **produce** una `EvidenceFicha`; render, IA, persistencia, dashboard y coach la **consumen**. El nombre sale SOLO de votos; el motor nunca nombra; ninguna palabra de tempo entra al `arquetipoLabel`.

### 1.1 Reconciliación de enums (las áreas divergían — se fija valor canónico)

Las revisiones usaron spellings distintos. **Canónico único** (todo lo demás se corrige on sight):

| Concepto | Canónico (código + DB) | Variantes a NORMALIZAR (prohibidas) |
|---|---|---|
| banda | `'mezcla' \| 'con_matices' \| 'definido'` | `'matices'` (dashboard), `'Definido'/'Con matices'/'Mezcla'` capitalizado (coach) |
| registro | `'mezcla' \| 'tentativo' \| 'claridad'` (`'claridad'` SOLO B≥5) | `'afirmativo'` (engine) |
| forma | `'duo_empate'\|'equilibrio'\|'duo'\|'versatil'\|'lider_acompanante'\|'definido'\|'muy_definido'` | consistente en todas |
| tempo/motor zona (almacenado) | `'lento' \| 'intermedio' \| 'rapido' \| null` | `'se_tomo_mas_tiempo'/'respondio_rapido'` (engine), `'reflexivo'/'agil'` (dashboard — DISPOSICIONAL, doble prohibición) |
| veta banda (derivable de B2) | `'sin' \| 'tentativa' \| 'afirmada'` | — |

El léxico cronométrico (`"respondió tomándose más tiempo"` / `"respondió rápido"`) es **copy de display**, NO el valor del enum. El `zona:'reflexivo'/'agil'` del dashboard viola §2.2 y se descarta.

### 1.2 Forma canónica

```ts
type Axis='D'|'I'|'S'|'C';
type Banda='mezcla'|'con_matices'|'definido';
type Registro='mezcla'|'tentativo'|'claridad';
type FormaId='duo_empate'|'equilibrio'|'duo'|'versatil'|'lider_acompanante'|'definido'|'muy_definido';
type VetaBanda='sin'|'tentativa'|'afirmada';
type MotorZona='lento'|'intermedio'|'rapido';

interface VotesEvidence {
  vector: Record<Axis,number>;        // conteos crudos, suman 12
  ejePrimario: Axis; ejeSecundario: Axis;
  topCount:number; secondCount:number; thirdCount:number;
  B:number;                            // top-second, gatea primario
  B2:number;                           // second-third, gatea veta
  nEjesFuertes:number;                 // ejes con conteo >= topCount-1
  secundarioEmpatado:boolean;
  banda:Banda; registro:Registro; forma:FormaId;
  nombrarPrimario:boolean;             // B>=4 || (B>=2 && topCount>=7)
  vetaBanda:VetaBanda;                 // B2<=1 sin / 2-3 tentativa / >=4 afirmada
  vetaOpuesta:boolean;                 // diagonal D<->S, I<->C
  vetaEnNombre:boolean;                // afirmada && !opuesta && nombrarPrimario
  arquetipoLabel:string|null;          // ya gateado; null => par/tendencia sin sustantivo
}

interface SubMotor {
  rawMs:number; ageFair:number;        // rawMs / factorEdad
  nTrials:number;                      // arrays.length real
  percentilCelda:number|null;
  ic:[number,number];                  // intervalo ANCHO
  zona:MotorZona|null;                 // null si el IC cruza p33/p67 => intermedia
  confianza:'media'|'baja';
}

interface MotorInsight {
  narratable:boolean;                  // false si falta A o B, o fallback por tiempo
  edadMeses:number; factorEdad:number;
  normaLabel:'referencia_bibliografica'|'poblacion_argo';
  decision:SubMotor|null;              // Juego A latencia
  reaction:SubMotor|null;              // Juego B reacción
  adaptation:SubMotor|null;            // Juego C (NO entra al tempo; alimenta §5)
  tempoScore:number|null;              // 0.50*latencia_af + 0.50*reaccion_af, clamp[0,100]
  tempoZona:MotorZona|null;
}

interface EvidenceFicha {
  version:4; methodVersion:string;     // 'v4'
  questionVersion:string;
  votes:VotesEvidence;
  motor:MotorInsight;
  gameMetricsRaw:{ impulse:IslandMetrics|null; rhythm:RhythmMetrics|null; adaptation:AdaptationMetrics|null };
}
```

### 1.3 Reglas duras del contrato
1. El nombre sale de `votes`, nunca del motor.
2. Ninguna palabra de tempo (Dinámico/Rítmico/Sereno/Observador/Rápido/Medio/Lento/reflexivo/ágil) en `arquetipoLabel`.
3. `tempoZona` se degrada a `intermedio` (=null en `zona`) si el IC cruza el corte.
4. Todo campo serializable a `jsonb` (persiste la ficha completa).

### 1.4 Dónde vive el tipo (decisión de arquitectura)
`EvidenceFicha` vive en **`src/lib/evidenceFicha.ts`** (módulo dedicado, re-exportado por `profileResolver.ts`). Los endpoints `api/*` **no pueden importar de `src/`**: cada endpoint que la use (`generate-ai`, `report`, `session`, `one-complete`, `report-recovery-cron`, `admin-grant-access`, `journey-canary`, `qa-monitor`) **inline-a** una copia del tipo. Igual patrón para `canonicalArchetype` (vive exportada en `tenant-chat.ts`, se duplica inline en `generate-puentes.ts`).

---

## 2. Plan por fases (orden de dependencia)

### FASE 0 — Fuente de verdad y gobernanza (bloquea TODO)
**Archivos:** `docs/archetype-naming.md` (reescritura total a eje×veta: 3 formas nombrables, regla de opuestos D↔S/I↔C, tabla trilingüe 4 puros + 8 blends, sección "el tempo NO es nombre", prohibidos +12 nombres eje×tempo es/en/pt, registro COMPLETO de mapas espejo como checklist); `CLAUDE.md` §naming + regla STRICT MOTOR_CHIP; `docs/METODO-CALCULO-NUEVO.md` (nota de gobernanza: naming.md=nombres, CALCULO-NUEVO=cálculo, resto=derivados); memory `project_archetype_naming.md` + `MEMORY.md` (para que agentes futuros no "re-corrijan" al esquema viejo).
**Bloquea:** nada.
**Checkpoint:** los cinco docs citados coherentes entre sí; ids snake_case declarados estables; ningún doc contradice a otro. (Sin test automatizado; el lint de grep se agrega en Fase 10.)

### FASE 1 — Contrato + constantes del nulo (aritmética pura, casi desbloqueada)
**Archivos:** `src/lib/evidenceFicha.ts` (NUEVO, el tipo de §1); `scripts/enum-bandas.mjs` (NUEVO — enumeración exacta de las 455 composiciones, NO Monte Carlo; masas P(B=k), P(B2=k|B≥1), gate `B≥4||(B≥2&&top≥7)`, fracción opuestos); `scripts/test-formas.mjs` (NUEVO — cascada de 7 formas cubre las 455, cada forma ≥1 comp, suma 100%, ninguna cruza banda); `src/lib/nullDistribution.ts` (NUEVO — consts congeladas `P_B_GE_4`, `NAME_GATE_MASS`, helpers `NAME_GATE(B,top)`, `VETA_OPUESTA(p,s)`).
**Bloquea:** solo los strings de label dependen de Fase 0; las masas son puras.
**Checkpoint:** `node scripts/enum-bandas.mjs --check` y `test-formas.mjs` reproducen los números del spec §7 a 0.01% (gate 7.68%, P(B2≥4|B≥1)=1.15%, blend no-opuesto 0.061%, etc.); `nullDistribution.test.ts` verde. **Estas constantes se congelan ANTES de que el resolver banda-ee.**

### FASE 2 — Datos + DB

**2A. Migración aditiva + shape de answers**
**Archivos:** `supabase/migrations/20260706_perfilamiento_ficha.sql` (NUEVO, ver §3); `src/lib/onboardingData.ts` (`Question += id:string, signatureScene?:'tormenta'|'meta'`; Q5-Q7→tormenta, Q12→meta; `export QUESTION_VERSION`); `src/lib/profileResolver.ts` (`QuestionAnswer += question_id:string`); `QuestionScreenV2.tsx` (emitir `question_id` en `onAnswer`); `DemoEndScreen.tsx` (propagar `question_id` en el map).
**Bloquea:** DDL no bloquea, pero los VALORES de band/forma/veta dependen de Fase 0 (enums congelados).
**Checkpoint:** las 24 columnas existen y la view `current_perfilamiento` las expone (`SELECT ... LIMIT 0`); migración idempotente; `count(method_version IS NULL) == count previo` (nada mutó); los 12 `question.id` únicos.

**2B. Catálogo editorial (deja de producir el nombre; pasa a copy puro)**
**Archivos:** `src/lib/archetypeData.ts` (re-key 12→4 bases por eje `getEjeBase(eje)`, `EjeBaseContent` sin motor/label/motorDesc, semilla=variante Medio depurada de tempo; `TendenciaContent += opposite:boolean` marcando D_S/S_D/I_C/C_I + auditoría de esos 4 párrafos; NUEVO `MOTOR_INSIGHT_TEMPLATES` + `getMotorInsight(zona,lang)` cronométrico; NUEVO `VETA_LABELS`/`getVetaLabel(axis,lang)`); espejos `.en.ts`/`.pt.ts`; `src/lib/childRevealTexts.ts` (+_EN/_PT) (colapsar 12→4 keys por eje, sin tempo, sin etiqueta identitaria al niño).
**Bloquea:** Fase 0 (naming) para que no se re-corrija; MOTOR_INSIGHT_TEMPLATES depende de que el léxico de zona esté fijado.
**Checkpoint:** `archetypeData.test.ts` — exactamente 4 keys en cada lang; paridad es/en/pt (4/4/4 bases, 12/12/12 tendencias); los 4 opposite con `opposite===true` y sin `/pero|raro|inusual|en tensión|contradictor/`; `getMotorInsight` sin `/reflexivo|impulsivo|ágil|calmo|nervioso/`; `getVetaLabel('C','es')==='con veta Estratega'`; grep 0 de `'con chispa'/'con brújula'/'con tendencia a'`.

### FASE 3 — Engine (cálculo determinista)
**Archivos:** `src/lib/ageNorms.ts` (NUEVO — `factorEdad(edadMeses)` interpolación por meses {8:1.45…16:1.00}, reescalado multiplicativo x/f, `percentilAgeFair`, `shrinkBand` hacia la curva de edad, IC cruza corte⇒null, `normaLabel` dinámico); `src/lib/profileResolver.ts` (`buildVotesEvidence(vector)` puro con cascada de 7 formas + gates, importando `nullDistribution`; `resolveMotorInsights(games,edadMeses,norms)` exige impulse+rhythm, elimina `impulsivityBonus`/`errorPenalty`, adaptation fuera del tempo; `resolveFromAnswers` ensambla `EvidenceFicha`; elimina motor-tipo y ambos tiebreakers salvo decisión owner del eje-tiebreaker en B=0); `src/lib/argosEngine.ts` (`getReportData(ficha,nombre,lang)` indexa por eje×eje, elimina `type Motor`/`MotorInput`/`ARQUETIPOS`/`getArchetypeByEjeMotor`, reutiliza `getLocalizedTendenciaContent` gateado por vetaBanda); `src/lib/profileChange.ts` (quitar `MOTOR_RANK`; evolución puramente descriptiva de dos fotos, sin RCI/SEM, guard por methodVersion distinta); `src/lib/designTokens.ts` (renombrar `MOTOR_CHIP`→`MOTOR_ZONA_CHIP` cronométrico o eliminar; `AXIS_LABELS` = fuente del 2º término).
**Bloquea:** Fase 1 (nullDistribution + evidenceFicha), Fase 2B (archetypeData re-key), y que `edadMeses` llegue al resolver (decisión abierta).
**Checkpoint:** `profileResolver.test.ts` (4-3-3-2⇒versatil sin nombre; 5-3-2-2⇒co-líderes sin sustantivo; 6-2-2-2⇒definido nombra; 12-0-0-0⇒muy_definido claridad; veta afirmada no-opuesta⇒vetaEnNombre; D+veta S⇒vetaOpuesta true/vetaEnNombre false); property test sobre las 455; `ageNorms.test.ts` (f monótona, x/f neutraliza edad, IC cruza⇒null, extraTaps no mueven tempoScore); `argosEngine.test.ts` reescrito (label nunca contiene tempo; narratable=false omite "Su motor"); resolver y enumeración no divergen (test contra `nullDistribution`).

### FASE 4 — Persistencia (cablear la ficha)
**Archivos:** `api/session.ts` (extender `safeKeys` update + destructure/insert save con las 23 claves de ficha + `question_version`; validación fail-closed de band/tempo_zona vs enum⇒400); `src/lib/sessionStore.ts` (`SessionPayload += gameMetrics?, ficha?:EvidenceFicha, questionVersion?`; mapear camelCase→snake_case); `src/components/onboarding/OnboardingFlowV2.tsx` (`profileFields` de 5→~27 campos; **cablear `game_metrics` desde los 3 refs — es EL punto donde empieza a escribirse**; pasar `edadMeses` al resolver; retirar logs de `profile.motor`); `api/one-complete.ts` (extender `session_data` type + insert con ficha + game_metrics + question_version; answers con question_id).
**Bloquea:** Fase 2A (columnas), Fase 3 (el resolver debe proveer la ficha), decisión de `edadMeses`.
**Checkpoint:** completar cuestionario ⇒ el UPDATE a `/api/session` incluye `game_metrics` no-nulo + `question_version`; `band='xxx'`⇒400; en DB `game_metrics` deja de ser NULL para perfilamientos nuevos; `one-complete` con ficha persiste band/game_metrics y sin ficha (retrocompat) sigue guardando NULL.

### FASE 5 — Render + IA + email
**Archivos:** `api/report.ts` (ampliar SELECT con todas las columnas de ficha, devolver `ficha`); `src/lib/openaiService.ts` (`AISections`: `motorDesc`→`motorInsight`; +`enLaMeta,anteLaTormenta,anteLoInesperado,grupoMovimiento,comoDecide` opcionales; `ReportContext += ficha`); `api/generate-ai.ts` (arquitectura 2 capas: ficha=esqueleto, IA solo reescribe; quitar "Motor Y" del contexto; guards §9 fail-closed band/afecto/name/veta/motor/opuesto con detectores post-generación + degradación a `STATIC_FALLBACK` por sección en vez de 502; telemetría con booleans por guard); `src/pages/ReportPage.tsx` (quitar chip de motor del hero; nombre=`ficha.archetypeName`; nueva card "Qué tan clara es la inclinación" con banda/registro gateado; "Su motor" solo si `motorNarratable`; cards nuevas En la meta / Ante la tormenta 3-de-3 / Ante lo inesperado / Cuánto lo mueve el grupo I y S por separado; cards fijas §16/§17); `src/lib/reportFrame.ts` (NUEVO — Marco de lectura + Límites, compartido); `src/lib/buildDownloadableReport.ts` (espejar ReportPage, `motorDesc`→`motorInsight`, quitar "Brújula secundaria"); `api/send-email.ts` (quitar chip de motor del header; `params.arquetipo`=archetypeName; fila "Su motor" opcional en cuerpo); `src/lib/emailService.ts` (contrato `{eje,ejeSecundario,archetypeName,motorInsight?,motorNarratable,...}`, `motor` legacy opcional; propagar a 4-5 callers); `src/lib/decisionPattern.ts` (DECISIÓN owner: eliminar del informe o reconvertir a color de baja confianza cronométrico dentro de "Su motor").
**Bloquea:** Fase 2A (migración+NOTIFY, sin esto `/api/report` no trae la ficha y los guards fallan closed sobre datos vacíos), Fase 3, Fase 2B (esqueleto + STATIC_FALLBACK copy), decisión decisionPattern.
**Checkpoint:** contract test `/api/report` devuelve banda/motorNarratable para v4 y degrada seguro en filas viejas; unit por guard (`'se inclina con fuerza'` B=3⇒band-guard; `'motor calmo'`⇒afecto-guard; motorNarratable=false + motorInsight⇒motor-gate degrada a estático); simular todos los proveedores caídos⇒200 con secciones estáticas (no 502); snapshot hero sin "Motor Dinámico/Observador"; AISections de `openaiService` y el inline de `generate-ai` coinciden campo a campo.

### FASE 6 — Dashboard tenant + admin
**Archivos:** consumir `buildDisplayName(ficha,lang)` de argosEngine (owner del gating, no reimplementar); `api/tenant-sessions.ts` (SELECT + payload += banda/name_gated/veta_gated/motor_insight); `TenantHome.tsx` (borrar `ARCHETYPE_LABELS`/`MICRO_DESC` por motor; chip via buildDisplayName; DEV_SESSIONS a eje×veta); `TenantPlayers.tsx` (quitar chip Motor + `MOTOR_CHIP_STYLE`; veta integrada al nombre; "Su motor" solo si narratable); `groupBalance.ts` (eliminar `MotorDistribution`/`calcMotorDistribution`/`MotorGroupType`/`getMotorGroupType`; `MemberProfile.motor` opcional); `groupBalanceRules.ts` (+.en/.pt) (eliminar `MOTOR_TEXTS`/`getMotorText`); `DistributionChart.tsx` (borrar `MotorChart` código muerto; decidir AxisChart); `GroupBalancePanel.tsx` (quitar motorDist/motorType; DECISIÓN owner: eliminar "Ritmo de procesamiento" vs baranda sin números); `Metrics.tsx` admin (eliminar card "Distribución por motor"); `Sessions.tsx` admin (getReportData nueva firma; guard no exige motor; CSV: Veta+Banda, motor como zona/insight); `dashboardTranslations.ts` (motorNames→cronométrico o fuera; tendenciaLabels→"con veta X"; eliminar distribucionMotor/perfilMotorGrupo; +`bandaLabels`); `TenantGroups.tsx`/`TenantGrupos.tsx` (motor opcional, DEV_MEMBERS eje×veta, cambiar los dos juntos).
**Bloquea:** Fase 3 (buildDisplayName + firma getReportData), Fase 2A (payload), decisiones de "Su motor" grupo/individual.
**Checkpoint:** `npm run build`/tsc sin imports rotos (grep consumidores de MOTOR_CHIP/MotorDistribution); render fila `name_gated=false`⇒tendencia sin sustantivo; panel de grupo sin "Ritmo" agregado; DashboardTexts con `bandaLabels` en es/en/pt.

### FASE 7 — Onboarding / reveal (copy)
**Archivos:** `onboardingData.ts` + `onboardingDataI18n.ts` + `onboardingDataV2.ts` ("su motor de motivación"→"qué lo enciende"/"su combustible"; evaluar renombrar escena "El Motor del Viaje"; sincronizar los tres espejos); `odysseyTranslations.ts` (`motorDisplayNames`→`motorZonaLabels` cronométrico por zona; `reportSections.motorRhythm`→`suMotor`; conservar `fuel`); `ChildResultReveal.tsx` (re-key reveal por eje primario, caller pasa `.eje` no `.id`); `ResultRevealPreview.tsx` (ciclar 4 keys de eje).
**Bloquea:** Fase 2B (childRevealTexts re-keyado), coordinación con Render (odyssey consume via ReportPage).
**Checkpoint:** grep `'motor de motiva'` en 0; ReportPage compila con campos renombrados; reveal no muestra "Dinámico/Rítmico/Sereno"; DemoEndScreen render DEV sin crash cuando arquetipo no tiene `.motor`.

### FASE 8 — Coach / IA
**Archivos:** `scripts/coach-prompt-source.ts` (KB: 4 ejes + veta; sacar "Motor (tempo)" del nombre y reintroducir como "Su motor" insight; fundir "brújula secundaria" con veta; few-shots/consultive a eje×veta + un caso banda Mezcla; regla de intensidad gateada) → luego `npm run gen:coach`; `api/tenant-chat.ts` (`canonicalArchetype(ejePrimario,ejeSecundario,opts,lang)`; `motorInsightLabel(zona,lang)`; `FORBIDDEN_OLD_LABELS += 12 nombres eje×tempo es/en/pt`; `TENDENCIA`→"con veta"; SELECT + contexto de jugador con columnas de ficha; NOTE ground-truth sin motor); `situationalGuide.ts`/`.en.ts`/`.pt.ts` (depurar copy eje→velocidad, anclar al eje) → `gen:coach`; `api/generate-puentes.ts` (PERFIL DEL NIÑO con nombre eje×veta via copia inline de canonicalArchetype; "Motor (ritmo)"→"Su motor" insight; SELECT ampliado); `PuentesReport.tsx` (nombre eje×veta, sin chip motor-tempo); `api/deck-chat.ts` (KB perfil=eje+veta; distinguir "motor determinístico"=algoritmo de "Su motor"=insight); `scripts/qa/coach-helpers.test.ts` + `scripts/qa/eval/cases.ts` (migrar a firma nueva + casos de banda).
**Bloquea:** Fase 0 (tabla trilingüe autoritativa), Fase 2A (columnas), Fase 3 (valores de banda/zona). **NUNCA hand-editar las regiones GENERATED — editar fuentes + `npm run gen:coach`.**
**Checkpoint:** `npm run check:coach-gen` verde tras gen:coach (parte de `qa:unit`); `coach-helpers.test.ts` (Mezcla⇒sin nombre; veta afirmada no-opuesta⇒blend; opuesta⇒solo primario; `'Impulsor Dinámico'`⇒labelViolation true, `'Impulsor con veta Estratega'`⇒false, `'sostenedor'` suelto no dispara); contexto anonimizado no filtra `{{Pn}}`; ningún few-shot dispara el nuevo FORBIDDEN.

### FASE 9 — Web / deck / marketing / SEO
**Archivos:** `Landing.tsx` (`ARCHETYPES` 12 blends eje×veta, `ARCHETYPE_DESCRIPTIONS` sin tempo/velocidad/talento; `ROTATING_PROFILES` sin motorBars, tercer módulo "Su motor" aparte; FAQ/ReportItem "Su motor"); `LangContext.tsx` (3 arrays `profiles` a blends; `archetypes.sub` reescrito); `Deck.tsx` es/en (caso demo eje×veta p.ej. "Sostenedor con veta Conector"; Matrix filas=eje×columnas=veta con celda opuesta sin nombre; captions "4 ejes + veta = 12; tempo aparte"); `public/sales/argo-instituciones.html` (`PROFILES` shape nuevo, borrar motorBars/CSS motor, chips estáticos + FAQ a eje×veta); `index.html` (FAQ/noscript: quitar "36 variantes"/"DISC + Motor"/"brújula secundaria"; lista 12 blends; **NO tocar `name:'Argo Method'` de JSON-LD**); `public/llms.txt` (12 = 4 puros + 8 blends; secciones §8; motor=insight age-fair); `helpContent.ts`/.en/.pt (art. 12 perfiles + brújula→veta; sugerir al owner el cambio de Help Center); `api/blog-generate.ts` + `api/blog-cron.ts` (`ARGO_ARCHETYPES`/`ARCHETYPE_LABELS` a eje×veta, ids compartidos e idénticos entre ambos, quitar campo motor, regla dura anti eje×tempo en el prompt).
**Bloquea:** Fase 0 (catálogo + traducción de "veta" en/pt + old names prohibidos).
**Checkpoint:** content-linter falla si aparece string eje×tempo (Dinámico/Rítmico/Sereno/Observador junto a eje), "36 variantes", "DISC + Motor", "brújula secundaria"; `check:api-imports` verde (blog-generate autónomo); assert `ARCHETYPES` de blog-cron ⊆ ids de blog-generate.

### FASE 10 — QA / crons / canaries / docs finales
**Archivos:** `api/qa-monitor.ts` (`minimalReport()` a ficha nueva; CHECK 7 asserta eje×veta, FORBIDDEN += 12 eje×tempo); `api/journey-canary.ts` (`canaryReport()` + saves/send a ficha; fixture "Sostenedor" puro o con veta); `api/report-recovery-cron.ts` + `api/admin-grant-access.ts` (branch por `method_version`: v4⇒pasar ficha, NULL/<v4⇒path legacy; select += method_version); `api/session-context.ts` (quitar `motors`; decidir si `ejes` sobrevive según eje-tiebreaker); `scripts/qa/ai-eval.ts` (firma nueva, judge rubric marco eje×veta); `src/lib/argosEngine.test.ts` (reescritura total, eliminar brujula/ritmo/ajedrecista, unificar runner); `scripts/test-profile.ts` (reescritura total: motor sale del cuestionario, va a game_metrics; casos de banda/forma/gate); `scripts/qa/name-gate.test.mjs` (NUEVO); `package.json` (`qa:unit` += enum-bandas/test-formas/name-gate); content-linter (grep de nombres eje×tempo en src/ y api/); `supabase/migrations/20260604_ai_events.sql` (columnas de guard — ver §3, o fold, decisión owner); docs derivados `PREGUNTAS-Y-CALCULO-PERFIL.md`, `sistema-de-perfilamiento.md`, `FUNDAMENTO-CIENTIFICO-DISC.md`, `BRIEF-PRODUCTO-MARKETING.md` (realinear a eje×veta; el científico con `argo-psych-review` antes de exponer a externos).
**Bloquea:** todas las fases anteriores (es el gate final); los crons no arrancan hasta que generate-ai/tenant-chat/migración estén desplegados en develop.
**Checkpoint:** `npm run qa:unit` verde con los 3 gates nuevos; qa-monitor CHECK 6/7 y journey-canary corren contra develop.argomethod.com sin 5xx y con nombre eje×veta; report-recovery regenera fila v4 con ficha y fila legacy por el branch.

---

## 3. Migraciones de DB (todas aditivas)

### 3.1 `supabase/migrations/20260706_perfilamiento_ficha.sql`

```sql
-- Todo en una transacción, con guard de idempotencia. Ningún NOT NULL, ningún backfill.
ALTER TABLE public.perfilamientos
  ADD COLUMN IF NOT EXISTS method_version    text,
  ADD COLUMN IF NOT EXISTS question_version  text,
  ADD COLUMN IF NOT EXISTS band              text,   -- 'mezcla'|'con_matices'|'definido'
  ADD COLUMN IF NOT EXISTS registro          text,   -- 'mezcla'|'tentativo'|'claridad'
  ADD COLUMN IF NOT EXISTS forma             text,
  ADD COLUMN IF NOT EXISTS b_top             int,
  ADD COLUMN IF NOT EXISTS b2                int,
  ADD COLUMN IF NOT EXISTS top_count         int,
  ADD COLUMN IF NOT EXISTS second_count      int,
  ADD COLUMN IF NOT EXISTS third_count       int,
  ADD COLUMN IF NOT EXISTS vote_vector       jsonb,
  ADD COLUMN IF NOT EXISTS veta_eje          text,
  ADD COLUMN IF NOT EXISTS nombre_gated      boolean,
  ADD COLUMN IF NOT EXISTS veta_en_nombre    boolean,
  ADD COLUMN IF NOT EXISTS veta_opuesta      boolean,
  ADD COLUMN IF NOT EXISTS motor_narratable  boolean,
  ADD COLUMN IF NOT EXISTS edad_meses        int,
  ADD COLUMN IF NOT EXISTS factor_edad       numeric,
  ADD COLUMN IF NOT EXISTS latency_af        numeric,
  ADD COLUMN IF NOT EXISTS reaction_af       numeric,
  ADD COLUMN IF NOT EXISTS adaptation_af     numeric,
  ADD COLUMN IF NOT EXISTS tempo_score       numeric,
  ADD COLUMN IF NOT EXISTS tempo_zona        text,   -- 'lento'|'intermedio'|'rapido'|NULL
  ADD COLUMN IF NOT EXISTS evidence_ficha    jsonb;  -- snapshot completo (IC, nTrials, decisiones de esqueleto)
-- game_metrics jsonb YA existe (empieza a poblarse; no se agrega).

-- CHECKs aditivos (no fallan filas viejas: son NULL, no violan CHECK)
ALTER TABLE public.perfilamientos
  ADD CONSTRAINT perfilamientos_band_chk
    CHECK (band IS NULL OR band IN ('mezcla','con_matices','definido')) NOT VALID,
  ADD CONSTRAINT perfilamientos_tempo_zona_chk
    CHECK (tempo_zona IS NULL OR tempo_zona IN ('lento','intermedio','rapido')) NOT VALID;

-- Índice parcial para el monitor de opuestos (§3.2)
CREATE INDEX IF NOT EXISTS idx_perfilamientos_opposite_monitor
  ON public.perfilamientos (veta_opuesta) WHERE veta_en_nombre;

-- Recrear la view agregando los campos de ficha al SELECT.
-- Mantener DISTINCT ON (c.id) + ORDER BY p.created_at DESC intacto.
CREATE OR REPLACE VIEW public.current_perfilamiento AS
SELECT DISTINCT ON (c.id)
  /* ... columnas existentes ... */,
  p.method_version, p.question_version, p.band, p.registro, p.forma,
  p.b_top, p.b2, p.top_count, p.second_count, p.third_count, p.vote_vector,
  p.veta_eje, p.nombre_gated, p.veta_en_nombre, p.veta_opuesta,
  p.motor_narratable, p.edad_meses, p.factor_edad,
  p.latency_af, p.reaction_af, p.adaptation_af, p.tempo_score, p.tempo_zona,
  p.evidence_ficha, p.game_metrics
FROM public.children c
JOIN public.perfilamientos p ON p.child_id = c.id
WHERE p.status = 'resolved'
ORDER BY c.id, p.created_at DESC;

NOTIFY pgrst, 'reload schema';  -- OBLIGATORIO o PostgREST 500 sobre la view nueva
```

Aplicar vía `mcp apply_migration` (migración única, NO `supabase db push`). Cambios de shape acompañantes (no DDL): `answers` pasa de `{axis,responseTimeMs}` a `{question_id,axis,responseTimeMs}`; `game_metrics` empieza a poblarse.

### 3.2 `ai_events` (guards de generate-ai) — DECISIÓN abierta
Segunda migración aditiva `ALTER TABLE ai_events ADD COLUMN band_guard_hit boolean, affect_hit boolean, motor_gate_hit boolean, veta_gate_hit boolean, opuesto_hit boolean, fell_to_static boolean` + `banda text, registro text`. Alternativa: foldear en el `prohibited_hit` existente. `label_violation` NO cambia de schema (booleana); solo cambia qué la dispara (FORBIDDEN invertido). Cerrar con `NOTIFY pgrst`.

**Nota forward-only:** ninguna columna se backfillea. Filas viejas quedan `method_version=NULL` y el branch legacy de report-recovery/admin-grant las trata como pre-v4. NO se agrega default 'v3' salvo que el owner lo pida (decisión #6 abajo).

---

## 4. Riesgos y gotchas de implementación

1. **`api/` no importa de `src/` ni entre `api/`.** Un import cruzado pasa `tsc` pero lanza `ERR_MODULE_NOT_FOUND` en runtime (outage 2026-06-05). `EvidenceFicha`, `canonicalArchetype`, guards y STATIC_FALLBACK se **inline-an/duplican** en cada endpoint. Enforced por `npm run check:api-imports` (CI gate) + qa-monitor CHECK 8.
2. **Regiones GENERATED en `tenant-chat.ts`** (`COACH_PROMPTS`, `COACH_SITUATIONS`). NUNCA hand-editar: cambiar `scripts/coach-prompt-source.ts` o `situationalGuide*.ts` y correr `npm run gen:coach`. `check:coach-gen` (en `qa:unit`) rompe si driftea.
3. **Resolvers/enums divergentes.** Las 10 áreas usaron spellings distintos de banda/registro/zona (`'matices'` vs `'con_matices'`, `'Definido'` capitalizado, `'reflexivo'/'agil'` disposicional prohibido). §1.1 fija el canónico; toda desviación se corrige on sight. La forma (7 formas) y `clasificarForma` deben ser LA MISMA función en el resolver y en `test-formas.mjs`, o forma-en-ficha y forma-enumerada divergen.
4. **`game_metrics` nunca se escribió.** Hoy `gameA/B/CMetricsRef` alimentan el resolver pero jamás se persisten. Fase 4 (`OnboardingFlowV2` + `one-complete`) es EL punto donde empieza a escribirse; sin esto el motor no tiene insumo real y `ageNorms` no puede poblar población Argo.
5. **Edad en MESES al resolver.** Hoy solo se captura `adultData.edad` (años). `factorEdad` necesita meses; aproximar `edad*12` pierde el gradiente intra-celda que §2.3/R4-D exige corregir. GAP: ningún área dio pasos concretos para el campo de captura (AdultRegistration) — decisión owner + trabajo no especificado.
6. **CI/canaries como falsos rojos durante la transición.** `qa-monitor` CHECK 7 y `journey-canary` hoy ASERTAN nombres eje×tempo ("Sostenedor Rítmico") como correctos; romperán apenas se migre el backend y deben migrarse en la MISMA tanda. `qa:unit` fallará hasta que existan `enum-bandas.mjs`/`test-formas.mjs`/`name-gate.test.mjs`. Los crons no corren en previews; validarlos manualmente vía `?secret=` contra develop tras Fase 5.
7. **Gate de fail-closed real.** `generate-ai` hoy hace 502 ante fallo total; el contrato nuevo exige degradar por sección a `STATIC_FALLBACK` (caída ≤1%), nunca dejar al niño sin informe. Requiere copy estático pre-aprobado es/en/pt por sección (no redactado).
8. **Wordmarks contiguos vs split spans.** `TENDENCIA_CONTENT` ya es eje×eje y el nombre se concatena en runtime (`label`+`tendenciaLabel`); un grep de string contiguo NO caza "Impulsor con veta X". Igual que `ProductName`/`BrandName`: los lints deben mirar la composición, no solo literales.
9. **NOTIFY pgrst.** Tras crear la view nueva, sin `NOTIFY pgrst, 'reload schema'` PostgREST 500ea sobre `current_perfilamiento`.
10. **Forward-only.** Filas DB viejas conservan labels eje×tempo y `motor`. Nada se reescribe; branches por `method_version`. Métricas de arquetipo mezclarán labels viejos/nuevos (aceptable).

---

## 5. Orden recomendado de commits (chunks pequeños, verificables, local en develop)

Cada commit compila y pasa su checkpoint antes del siguiente. Sin push.

1. `docs(naming): rewrite archetype-naming.md + CLAUDE.md + memory to eje×veta` (Fase 0, un commit atómico para que docs no se contradigan).
2. `feat(null): enum-bandas + test-formas + nullDistribution.ts + evidenceFicha.ts` (Fase 1).
3. `feat(db): migración aditiva perfilamientos ficha + recreate view + NOTIFY` (Fase 2A DDL, aplicada vía MCP).
4. `feat(questions): question_id estable + QUESTION_VERSION + signatureScene + QuestionAnswer` (Fase 2A código, + QuestionScreenV2/DemoEndScreen).
5. `refactor(content): archetypeData 4 bases + tendencia opposite + MOTOR_INSIGHT_TEMPLATES + VETA_LABELS (es/en/pt)` (Fase 2B).
6. `refactor(content): childRevealTexts 12→4 por eje (es/en/pt)` (Fase 2B).
7. `feat(engine): ageNorms.ts` (Fase 3).
8. `feat(engine): buildVotesEvidence + resolveMotorInsights (EvidenceFicha)` (Fase 3, núcleo).
9. `refactor(engine): argosEngine getReportData eje×eje + profileChange descriptivo + designTokens` (Fase 3).
10. `feat(persist): api/session allowlist + sessionStore + OnboardingFlowV2 wiring (game_metrics + edadMeses) + one-complete` (Fase 4).
11. `feat(report): api/report select + openaiService AISections + reportFrame.ts` (Fase 5, plumbing).
12. `feat(ai): generate-ai 2 capas + guards fail-closed + STATIC_FALLBACK` (Fase 5, núcleo).
13. `feat(report): ReportPage + buildDownloadableReport (banda, Su motor, §16/§17, temas)` (Fase 5).
14. `refactor(email): send-email + emailService + decisionPattern` (Fase 5).
15. `refactor(dashboard): tenant-sessions payload + TenantHome/TenantPlayers + buildDisplayName consumo` (Fase 6).
16. `refactor(dashboard): kill motor aggregation (groupBalance/rules/DistributionChart/GroupBalancePanel/Metrics/Sessions/translations/TenantGroups)` (Fase 6).
17. `refactor(onboarding): copy motor→combustible + odysseyTranslations + reveal por eje` (Fase 7).
18. `refactor(coach): coach-prompt-source + gen:coach + tenant-chat canonicalArchetype/FORBIDDEN/ficha + situationalGuide` (Fase 8).
19. `refactor(puentes+deck): generate-puentes + PuentesReport + deck-chat` (Fase 8).
20. `refactor(web): Landing + LangContext + Deck + sales html + index.html + llms.txt + help + blog` (Fase 9).
21. `test(qa): qa-monitor + journey-canary + recovery/grant branch + ai-eval + cases + argosEngine.test rewrite + name-gate + qa:unit` (Fase 10).
22. `chore(ai_events): guard columns + docs derivados realign` (Fase 10 cierre).

---

## 6. Decisiones abiertas para el owner (antes de tocar código)

**Bloqueantes (paran el engine o el arranque):**
1. **Edad en meses:** ¿se pide mes/fecha de nacimiento en AdultRegistration, o se aproxima `edad*12`? Bloquea `factorEdad` honesto (Fase 3/4). GAP: ningún área dio pasos concretos del campo de captura.
2. **Fuente de normas de arranque:** falta la tabla bibliográfica concreta de p33/p67 por celda de edad. ¿La provee el doc de constructos o hay que derivarla? Bloquea `ageNorms` real (arranca con referencia bibliográfica encogida, migra a población Argo a ~500 juegos/celda).
3. **Léxico de "con veta" + convención EN:** ¿"con veta X" (es) es final vs "con matiz/inclinación"? ¿EN "with a X streak" sin invertir (vs el viejo "Dynamic Driver")? Debe fijarlo `archetype-naming.md`; bloquea Landing/LangContext/Deck/help/blog/coach.
4. **4 bases eje-puras vs 12 blends editoriales full:** recomendado 4 bases + diferencial de veta (honesto con el modelo, menor esfuerzo). Confirmar antes de re-keyar archetypeData.

**No bloqueantes (afectan alcance de fases):**
5. **Eje-tiebreaker en B=0** (por dispersión de grupo): recomiendo eliminarlo (contamina la ipsatividad). Si se elimina, `session-context.ts` queda huérfano o solo devuelve `ejes`.
6. **`method_version` de filas viejas:** ¿NULL tratado como legacy (recomendado) o default 'v3' vía migración aditiva? Afecta el branch de report-recovery/admin-grant.
7. **decisionPattern:** ¿eliminar del informe (recomendado, §12.7) o reconvertir a color de baja confianza cronométrico en "Su motor"?
8. **STATIC_FALLBACK:** quién redacta el copy pre-aprobado es/en/pt por sección (contrato exige degradación, no 502).
9. **ai_events guards:** ¿columnas nuevas (recomendado, para telemetría por guard) o fold en `prohibited_hit`?
10. **"Su motor" a nivel GRUPO** (GroupBalancePanel/Metrics): recomiendo ELIMINAR toda vista agregada de motor (cualquier barra/tipo reintroduce comparación cruda prohibida §12) vs conservar baranda sin números.
11. **"Su motor" a nivel INDIVIDUAL en dashboard** (TenantPlayers): ¿insight cronométrico o solo en el informe? Depende de si `/api/tenant-sessions` expone `motor_insight`.
12. **AdultMotor del ArgoPuente** (ágil/equilibrado/profundo): ¿se realinea al esquema nuevo o queda como constructo adulto separado? Toca `puentesProfileResolver.test.ts` — **marcado FUERA de esta corrida** salvo que el owner lo incluya.
13. **Barandas §16/§17 en demo locked:** ¿se muestran antes de pagar? Recomiendo sí (son barandas éticas).
14. **Marketing:** ¿se conserva el gancho "12" (4 puros + 8 blends)? ¿DistributionChart AxisChart se elimina o se conserva? ¿Metrics agrupa por eje durante la transición?
15. **Banda tentativa (B2=2-3):** ¿lead-in curado por combo (nuevo campo) o prefijo genérico?

---

## GAPS / no cubierto por las revisiones
- **Captura de edad en meses** (UI AdultRegistration): mencionada como bloqueante, sin pasos por archivo.
- **`puentesProfileResolver.test.ts` / AdultMotor**: explícitamente fuera de alcance (decisión de producto pendiente).
- **Población Argo real para `ageNorms`**: requiere datos (excluyendo `is_demo` y owners) que aún no existen; arranque bibliográfico obligatorio.
- **Copy STATIC_FALLBACK por sección es/en/pt**: sin dueño asignado.
- **RCI/SEM test-retest** (evolución): fuera de alcance por falta de datos de re-toma (agenda §14).