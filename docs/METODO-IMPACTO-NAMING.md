# Mapa de Impacto — Cambio de naming Argo (eje×tempo → eje×veta)

> Barrido exhaustivo del repo (8 frentes en paralelo: frontend, engine, API/IA, web/deck, datos/DB, i18n, docs, caza de residuos) sobre el cambio de método documentado en `METODO-CALCULO-NUEVO.md`. Fecha: 2026-07-06. Objetivo: inventariar TODA superficie que hoy muestra o depende del esquema viejo `[Eje][Motor]`, con archivo:línea, esfuerzo, forward-only vs migración, y orden de ejecución por dependencia. El diseño del informe individual (mockup `preview/informe-final.html`) queda fuera de alcance; su reimplementación en código, dentro.

## 1. Resumen ejecutivo

El cambio es **estructural y transversal**, no un rename de superficie: el "Motor" (tempo Rápido/Medio/Lento → Dinámico/Rítmico/Sereno, C+Lento=Observador) está cableado como **segunda palabra del nombre del arquetipo en toda la pila** (cálculo → datos → render → email/IA → marketing → tests). El nombre pasa a **`[Eje primario] con veta [Eje secundario]`** (blend DISC, 4×3=12) y el tempo sale del nombre para vivir como **insight medido per-child** en la sección "Su motor". Los cuatro focos mayores: (1) la **capa de cálculo determinista** (`profileResolver.ts` + `argosEngine.ts`), que hoy deriva un motor-tipo y lo mete al nombre; (2) el **contenido/datos base** trilingüe (`archetypeData.*`, 12 registros keyed por eje×motor); (3) la **reimplementación del render del informe** (`ReportPage.tsx` + `api/generate-ai.ts` + email), con banda de confianza, gates y "Su motor" como insight; (4) la **base de conocimiento de IA + marketing** (coach GENERATED, Landing, Decks, index.html/SEO). Casi todo es **forward-only** (precedente 2026-06-02): los informes guardados conservan sus labels viejos; la migración de DB es **solo aditiva** (columnas de la ficha de evidencia + persistir `game_metrics` + `question_id`).

---

## 2. Mapa por área

### A. FUENTE DE VERDAD (todo lo demás deriva de aquí) — hacer PRIMERO
| Lugar | Qué cambia | User-facing | Esfuerzo |
|---|---|---|---|
| **`docs/archetype-naming.md`** (archivo completo) | Reescritura total a `[Eje primario] con veta [Eje secundario]`; quitar columna Motor y mapeo tempo→nombre; nueva tabla trilingüe de 12 blends; AÑADIR los 12 nombres eje×tempo viejos a "PROHIBIDOS"; actualizar lista de mapas espejo/gotchas | No (normativo) | Alto |
| **`CLAUDE.md` §"Archetype naming (SINGLE source of truth)"** | Reescribir la ley del proyecto al esquema eje+veta; tempo = insight, no tipo; palabras de tempo prohibidas en nombres. Revisar también la regla STRICT de `MOTOR_CHIP` en el design-system | No | Medio |
| **Memoria persistente** `project_archetype_naming.md` + línea índice `MEMORY.md` | Actualizar bloque canónico a eje+veta; mover eje×tempo a "Forbidden" (si no, cada sesión reinstala el esquema viejo) | No | Bajo |

> Nota: `METODO-CALCULO-NUEVO.md` es la spec target ya alineada; puede ceder autoridad de cálculo a ella o remitir. Confirmar qué doc queda autoritativo.

### B. Engine / cálculo determinista (Capa 1) — corazón del cambio
| Lugar | Qué cambia | User-facing | Esfuerzo |
|---|---|---|---|
| **`src/lib/profileResolver.ts`** (`resolveProfile` 98-152, `resolveMotorFromGames` 23-66, `resolveFromAnswers` 164-262, `TENDENCIA_LABELS`) | El nombre deja de depender del motor: pasa a eje 1º (más votado) + veta (2º más votado, ya se calcula). Añadir B=top−second, top/second/third_count, flags de empate; banda de confianza 3 niveles; **gate de nombre** (B≥2 ∧ top_count≥6, si no par/tendencia sin sustantivo); cascada de forma (6 tipos). `resolveMotorFromGames` deja de devolver tipo: produce insights continuos con banda (≤59/60-74/≥75), normalización por edad y `motor_narratable`. Prohibir bonos que lean afecto (impulsivityBonus, extraTaps). **Sacar el tiebreaker por tiempo del motor** | Sí | Alto |
| **`src/lib/argosEngine.ts`** (`getReportData(eje,motor)`, `getArchetypeByEjeMotor`, `type Motor`, `ARQUETIPOS`, `TENDENCIA_LABELS_I18N`) | `getReportData` pasa a indexar por (ejePrimario, ejeSecundario); ARQUETIPOS eje×motor se elimina/reemplaza por catálogo de 12 blends; `motor:string` pasa a estructura de insights. Reutilizar `getLocalizedTendenciaContent` como base. Es el ensamblador del informe → reimplementar | Sí | Alto |
| **`src/lib/profileChange.ts`** (`MOTOR_RANK`, `describeProfileChange`) | Gate RCI (§15): narrar cambio de eje solo si ambas tomas B≥2 y ejes difieren; cambio de motor solo si cruza SEM; fallback estático. Requiere B y sub-motores age-fair persistidos en ambas tomas | Sí | Alto |
| **`src/lib/argosEngine.test.ts`, `puentesProfileResolver.test.ts`, `scripts/test-profile.ts`, `scripts/qa/*`** | Reescribir aserciones al nuevo esquema; sumar tests de banda/forma/gate/enumeración. `argosEngine.test` ya está stale (menciona brujula/ritmo/ajedrecista) | No | Medio |

### C. Datos base / contenido editorial (el mayor volumen i18n)
| Lugar | Qué cambia | User-facing | Esfuerzo |
|---|---|---|---|
| **`src/lib/archetypeData.ts` / `.en.ts` / `.pt.ts`** (12 registros eje×motor + `motorDesc`, ~94KB×3) | Re-keyar a blends eje×eje (o colapsar a 4 bases por eje + diferencial de veta). `motorDesc` sale del arquetipo → "Su motor" per-child. Borrar labels de tempo de los 12 nombres. Copy sensible, no traducción automática | Sí | Alto |
| **`src/lib/archetypeData.ts` `TENDENCIA_CONTENT`** (12 combos eje×eje, es/en/pt) | **ASSET reutilizable clave**: ya es el substrato del nombre-por-veta. Solo gatearlo por banda (Mezcla no cierra veta / Con matices tentativa / Definido afirmada) y elevarlo de "tendencia" a parte del nombre | Sí | Bajo |
| **`src/lib/childRevealTexts.ts` (+ _EN/_PT)** (12 claves eje×motor) | Re-keyar; lo más simple: 1 texto por eje primario (4). El nombre no debe devolverse como etiqueta identitaria al niño (§12) | Sí | Medio |
| **`TENDENCIA_LABELS_I18N` / `TENDENCIA_LABELS` / `dashboardTranslations.tendenciaLabels`** | Las etiquetas metafóricas ("con chispa de acción", "con brújula social") pasan a nombrar el EJE ("con veta Estratega") | Sí | Bajo |
| **`src/lib/designTokens.ts`** (`MOTOR_CHIP`, `MOTOR_CHIP_STYLE`) + **`src/components/ui/Badge.tsx`** (`MotorBadge`) | El chip de motor-tempo desaparece del naming; a lo sumo sobrevive como chip de la sección "Su motor" con léxico de banda (reflexivo/intermedio/ágil). Seguir a todos los consumidores para no dejar imports colgando | Sí | Medio |

### D. Render del informe (individual + email + IA de generación)
| Lugar | Qué cambia | User-facing | Esfuerzo |
|---|---|---|---|
| **`src/pages/ReportPage.tsx`** | Reimplementar contra el mockup nuevo (`preview/informe-final.html`): nombre eje+veta, quitar chip de Motor por tempo, "Su motor" como insights medidos con banda (omitir si `motor_narratable=false`), banda de confianza 3 niveles, componentes fijos §16/§17 (marco/límites), renombres de temas (frustración→ante la tormenta) | Sí | Alto |
| **`api/generate-ai.ts`** (gen del informe + WRITING_RULES/PROHIBITED/DETERMINISTIC_PATTERNS) | Reimplementación completa: nombre sin motor; **arquitectura de 2 capas** (ficha determinista + IA acotada); ~17 secciones §8; agregar guards fail-closed §9: **band-guard, name-gate, motor-gate, afecto-guard** + degradación a texto estático; reencuadrar a marco "la actividad" y lenguaje intra-individual | Sí | Alto |
| **`api/send-email.ts`** (`MOTOR_LABELS/STYLE`, `isObservador`) | Nombre = eje+veta; **quitar el chip de Motor del encabezado** (alta visibilidad); motor pasa a fila "Su motor" del cuerpo | Sí | Medio |
| **`src/lib/decisionPattern.ts`** | No depende del nombre; revisar encuadre contra barandas del motor-insight; probablemente encaje dentro de "Su motor" | Sí | Bajo |

### E. Dashboard tenant + admin
| Lugar | Qué cambia | User-facing | Esfuerzo |
|---|---|---|---|
| **`src/pages/tenant/TenantHome.tsx`** (mapa `ARCHETYPE_NAMES` eje×tempo, key `${eje}-${motor}`) | Reemplazar mapa por eje+veta; key pasa a `eje-ejeSecundario`; actualizar dev-data | Sí | Medio |
| **`src/pages/tenant/TenantPlayers.tsx`** (chip motor, "tendencia secundaria", `getReportData`) | Quitar chip de Motor; tendencia se integra al nombre como veta; sumar banda de confianza; actualizar dev-data | Sí | Alto |
| **`DistributionChart.tsx` (`MotorChart`) + `GroupBalancePanel.tsx` + `src/lib/groupBalance.ts` + `groupBalanceRules.ts` (`MOTOR_TEXTS`)** | El Motor deja de ser tipo agregable: **"distribución por motor" y `MotorGroupType` pierden base conceptual**. Eliminar o redefinir como insight continuo age-fair con baranda de no-comparación cruda (§12). `eje_secundario` de `MemberProfile` sobrevive (afinidad por eje se mantiene) | Sí | Alto |
| **`TenantGroups.tsx` / `TenantGrupos.tsx`** (duplicados; split plantel/grupo pendiente) | Retipar `motor` como campo; segundo término identitario = eje_secundario; actualizar dev-data y mapeo a `MemberProfile` | No | Medio |
| **`src/pages/dashboard/Metrics.tsx`** | Quitar/redefinir chart "Distribución por motor"; el chart de arquetipos agrupa por nuevos labels eje+veta | Sí (admin) | Medio |
| **`src/pages/dashboard/Sessions.tsx`** | Adaptar select/armado de nombre y export CSV (hoy incluye motor/tempo) a la ficha de evidencia nueva | No | Medio |
| **`src/lib/dashboardTranslations.ts`** (`motorNames`, `distribucionMotor`, `perfilMotorGrupo`) | `motorNames` (Rápido→Dinámico) sale del nombre; se conserva a lo sumo como léxico de "Su motor" con vocabulario de banda | Sí | Medio |
| **`src/pages/tenant/TenantGuide.tsx`** | Bajo impacto: es eje-based, sigue válido. Opcional anclar también a la veta | Sí | Bajo |

### F. Onboarding / juego / reveal
| Lugar | Qué cambia | User-facing | Esfuerzo |
|---|---|---|---|
| **`src/components/onboarding/OnboardingFlowV2.tsx`** | El resolver deja de producir motor-tipo para el nombre; métricas de mini-juego alimentan "Su motor"; persistir ficha de evidencia completa (B, top/second_count, forma, banda, sub-motores, `game_metrics`, `question_id`); aplicar gates | Sí | Alto |
| **`src/lib/odysseyTranslations.ts`** (`motorDisplayNames`, "El Ritmo del Motor") | El jugador ya no recibe etiqueta de tempo; el gauge, si se mantiene, muestra insight con banda (zona 60-74 no compromete lectura) | Sí | Medio |
| **`DemoEndScreen.tsx`, `ChildResultReveal.tsx`, `ResultRevealPreview.tsx`** | Ajustar shape (`report.arquetipo.motor` deja de existir); el label cambia solo al fluir la fuente; revisar tono del reveal (no devolver etiqueta como identidad) | Parcial | Bajo |
| **`src/lib/onboardingData.ts` / `onboardingDataI18n.ts`** ("su motor de motivación", "El Motor del Viaje") | **Colisión terminológica**: "motor de motivación" (=combustible) choca con el nuevo módulo "Su motor" (tempo). Renombrar a "qué lo enciende / su combustible" | Sí | Bajo |

### G. IA / ArgoCoach (regiones GENERATED — editar fuente, no el archivo)
| Lugar | Qué cambia | User-facing | Esfuerzo |
|---|---|---|---|
| **`scripts/coach-prompt-source.ts`** (`knowledge`, `examples`, `consultive`) | Reescribir los 12 a eje×veta; eliminar Motor como tipo/tabla; reescribir few-shots ("¿cómo motivo a un Impulsor Dinámico?" → blend); tempo solo como insight. **Correr `npm run gen:coach`** (`check:coach-gen` falla si driftea) | Sí | Alto |
| **`api/tenant-chat.ts`** (`canonicalArchetype`, `MOTOR_DISPLAY`, inyección de contexto 2098-2137, `FORBIDDEN_OLD_LABELS`, ground-truth, región GENERATED:COACH_SITUATIONS) | `canonicalArchetype` pasa a (ejePrimario, ejeSecundario); motor solo para "Su motor"; gate de banda al nombre; sumar nombres de tempo a `FORBIDDEN_OLD_LABELS`. **COACH_SITUATIONS se genera desde `src/lib/situationalGuide*.ts`** — editar ahí | Sí | Alto |
| **`src/lib/situationalGuide.ts` (+ .en/.pt)** | Depurar copy "su motor rápido/lento": la conducta se ancla al eje (elecciones), no a la velocidad. No afirmar "el Impulsor tiene motor rápido" (§12.7) | Sí | Medio |
| **`api/generate-puentes.ts` + `PuentesFlow.tsx` + `PuentesReport.tsx` + `puentesProfileResolver.ts`** | El bloque "perfil del niño" usa nombre nuevo (eje+veta), motor como insight. El adulto tiene esquema motor propio (agil/equilibrado/profundo) ya más cerca del esquema nuevo — decidir si también sale del nombre. Backend adult-profile aún sin construir: definirlo ya con el esquema nuevo | Sí | Medio |
| **`api/deck-chat.ts`** | Actualizar KB del método a eje+eje; distinguir "motor determinístico" (algoritmo) del motor del perfil | No | Bajo |

### H. Web / Deck / Marketing / SEO
| Lugar | Qué cambia | User-facing | Esfuerzo |
|---|---|---|---|
| **`src/pages/Landing.tsx` + `src/context/LangContext.tsx`** (array 12 nombres, `motorBars`, `archIdx=eje*3+tempo`, FAQ "el Motor") | Reescribir narrativa: 12 = eje×veta; quitar motorBars como identidad; `archIdx` se cae (2º término ya no es tempo). Falta el bloque EN en LangContext (revisar). es/en/pt | Sí | Alto |
| **`src/pages/Deck.tsx`** (matriz 4×3 headers tempo, "doce tendencias secundarias", "Su tempo es rítmico") | Rehacer matriz (columnas = ejes secundarios), captions, arquetipo de ejemplo, sección motor. es/en | Sí | Alto |
| **`public/sales/argo-instituciones.html`** (widget `PROFILES` + `motorBars` + CSS/JS `fc-motor-chip`) | Reimplementar data model (archetype = blend, sin motorBars); reescribir FAQ del origen de los 12; corregir demo "Sostenedor Sereno" (naming + determinismo) | Sí | Alto |
| **`index.html`** (meta/og/twitter, JSON-LD FAQPage, bloque SEO con lista de 12) | Conservar el 12 (4×3 ejes); quitar "DISC + Motor", 36 variantes, brújula secundaria; reemplazar lista. Entidad structured-data queda "Argo Method" | Sí | Medio |
| **`src/lib/helpContent.ts` (+ .en/.pt)** — art. "¿Qué significan los 12 perfiles?" / "¿Cómo se calcula el perfil?" | Perfil = eje+veta; motor como insight; fusionar brújula secundaria con la veta; sumar banda. **El owner pidió sugerir updates de Help Center** | Sí | Medio |
| **`public/llms.txt`** | 12 = 4 ejes × 3 vetas; motor = insight; actualizar estructura del informe y scientific basis (foto del presente, no validado) | No (machine) | Bajo |
| **`api/blog-generate.ts` + `blog-cron.ts`** (`ARGO_ARCHETYPES`) | Actualizar labels/ids al esquema nuevo para que artículos futuros no reintroduzcan nombres viejos. Posts publicados = forward-only | Sí (genera público) | Medio |
| **VERIFICADOS LIMPIOS (sin cambio):** `manifest.json`, `src/pages/ArgoOneLanding.tsx` | — | — | — |

### I. Datos / DB / persistencia
| Lugar | Qué cambia | User-facing | Esfuerzo |
|---|---|---|---|
| **`supabase/migrations/…child_perfilamiento_split.sql`** (`perfilamientos.motor/eje_secundario/archetype_label/game_metrics`, view `current_perfilamiento`) | Migración **aditiva**: nuevas columnas de ficha (banda, forma, B, top/second/third_count, motor_narratable, edad_meses, factorEdad, sub-motores age-fair). `motor` deja de ser identidad pero se conserva como dato; `eje_secundario` ya existe = veta. `NOTIFY pgrst 'reload schema'` tras cambio de view | No | Medio |
| **`src/lib/sessionStore.ts` + `api/session.ts` + shape `answers`** | Ampliar `answers` a `{question_id, axis, responseTimeMs}` + sellar `question_version`. Prerequisito del "momento notable", estabilidad y gate de evolución | No | Medio |
| **`api/session.ts` (`game_metrics`) + `OnboardingFlowV2` refs** | La columna existe pero **nunca se escribe**: empezar a persistir métricas crudas de los 3 mini-juegos (avgLatency, avgReaction, avgAdaptation, extraTaps, stdDev, trend, cadence). Sin esto no hay "Su motor" ni gate de motor | No | Bajo |
| **`src/lib/onboardingData.ts` `QUESTIONS`** | Añadir `question_id` estable + metadato de escena firma (Q5-Q7 tormenta, Q12 meta); versionar el banco (hoy overrides solo en localStorage) | No | Medio |
| **`api/one-complete.ts`** | Hereda cambios de `perfilamientos`; asegurar que escribe el nuevo shape (ficha + game_metrics + question_id). Sin migración propia | No | Bajo |
| **`supabase/…ai_events.sql` `label_violation`** | Redefinir "etiqueta vieja prohibida" (ahora eje×tempo) vs válida (eje×veta) | Sí | Medio |

### J. QA / crons / canaries (gates de CI — romperán si no se actualizan)
| Lugar | Qué cambia | User-facing | Esfuerzo |
|---|---|---|---|
| **`api/report-recovery-cron.ts`, `api/admin-grant-access.ts`, `api/session-context.ts`** | Pasar ficha de evidencia nueva en vez de `{eje,motor,label}`; actualizar lista de features. Downstream de generate-ai/getReportData | No | Medio |
| **`api/journey-canary.ts` + `api/qa-monitor.ts`** (fixtures "Sostenedor Rítmico", aserción "S+Medio=Sostenedor Rítmico") | Migrar fixtures/aserciones al nombre nuevo o el monitor da falsos rojos. Watched por qa-monitor | No | Bajo |
| **`scripts/qa/eval/cases.ts`, `coach-helpers.test.ts`** | Reescribir eval-cases con nombres viejos | No | Bajo |

### K. Docs explicativos + artefactos internos (a actualizar / archivar)
| Lugar | Qué cambia | Esfuerzo |
|---|---|---|
| **`docs/BRIEF-PRODUCTO-MARKETING.md`, `FUNDAMENTO-CIENTIFICO-DISC.md`** (para revisores/inversores externos) | Realinear a eje×veta; el diferencial ya no es "el Motor como 2ª dimensión del nombre" sino el blend de 2 ejes + insights medidos. Riesgo reputacional si divergen del modelo implementado | Alto |
| **`docs/sistema-de-perfilamiento.md`, `PREGUNTAS-Y-CALCULO-PERFIL.md`, `ARGO-COACH-EXPLAINED.md`, `DESCRIPCION-CAMBIO-PERFIL.md`** | Separar nombre (votos) de motor (mini-juegos); reescribir tabla y cálculo; cláusula de motor → gate RCI | Medio c/u |
| **`docs/METODO-INFORME-DETERMINISTA.md`, `METODO-INFORME-MODULOS.md`, `design-system.md:140`** | Specs del código del informe: reconciliar contra `preview/informe-final.html` + METODO-CALCULO-NUEVO; chip de motor → sección "Su motor". Decidir reescribir vs marcar legacy | Medio-Alto |
| **`preview/*.html`, `design-system/index.html`, `dashboard-preview.html`, `assets/ads/`, `scripts/preview-email*.ts`** | Actualizar o marcar obsoletos (`informe-nuevo-mockup.html` ya superado por `informe-final.html`) | Bajo-Medio |
| **`.claude/skills/argo-psych-review`, `.agent/skills/argo-report-writer`, `argo-pedagogic-refiner`** | Actualizar para revisar/escribir contra el esquema nuevo (si no, refuerzan el viejo al operar sobre contenido) | Medio |
| **DEJAR como registro histórico:** `METODO-ESTADO-ACTUAL.md`, `AUDITORIA-*`, `CHANGELOG`, `ARGO-COACH-AUDIT`, `ARGOCOACH-MEJORAS` (refrescar ejemplos por higiene, baja prioridad) | — | — |

---

## 3. Orden de ejecución recomendado (por dependencia)

**Fase 0 — Fijar la verdad (bloquea TODO)**
1. `docs/archetype-naming.md` + `CLAUDE.md` §naming + memoria persistente. → Mientras digan `[Eje][Motor]`, cualquier agente "corrige" de vuelta al esquema viejo. **Bloquea todos los mapas espejo.**

**Fase 1 — Datos + esquema (bloquea cálculo y persistencia)**
2. Migración aditiva de `perfilamientos` (columnas de ficha) + `NOTIFY pgrst`. Cambiar shape de `answers` (question_id, question_version) + `question_id`/escena en `onboardingData.QUESTIONS`. Empezar a poblar `game_metrics`.
3. Reescritura editorial de `archetypeData.*` (re-key a blends; gatear `TENDENCIA_CONTENT` por banda). → **bloquea el ensamblador.**

**Fase 2 — Cálculo determinista (Capa 1)** *(bloquea todo render e IA)*
4. `profileResolver.ts` (nombre eje+veta, B/counts, banda 3 niveles, gate B≥2∧top≥6, cascada de forma, motor→insight age-fair). Pasar la edad en meses al resolver.
5. `argosEngine.ts` (`getReportData` por eje×veta; separar nombre de "Su motor"). Reescribir tests.
6. `profileChange.ts` (gate RCI) — requiere B/sub-motores persistidos (dep. de paso 2).

**Fase 3 — Persistencia de escritura** *(dep. 2 y 4)*
7. `OnboardingFlowV2.tsx` + `api/session.ts` + `one-complete.ts`: persistir ficha completa.

**Fase 4 — Render + IA** *(dep. 4-5-7)*
8. `ReportPage.tsx` + `api/generate-ai.ts` (2 capas + guards) + `send-email.ts`.
9. Dashboard (`TenantHome/Players/Groups`, `DistributionChart`, `GroupBalancePanel`, `dashboardTranslations`, admin `Metrics/Sessions`).
10. IA Coach: **editar `scripts/coach-prompt-source.ts` + `src/lib/situationalGuide*.ts` → `npm run gen:coach`** → luego `tenant-chat.ts` helpers (`canonicalArchetype`, `FORBIDDEN_OLD_LABELS`, inyección). `generate-puentes.ts` downstream.
11. `childRevealTexts`, `odysseyTranslations`, `DemoEndScreen`, reveal.

**Fase 5 — Marketing + machine-facing** *(dep. Fase 0)*
12. `Landing.tsx`, `LangContext.tsx`, `Deck.tsx`, `argo-instituciones.html`, `index.html`, `llms.txt`, `helpContent.*`, `blog-generate/cron`, `deck-chat`.

**Fase 6 — QA + docs**
13. Actualizar fixtures/aserciones (`journey-canary`, `qa-monitor`, `eval/cases`, tests), `ai_events.label_violation`, docs explicativos, skills argo-*.

> **Qué bloquea a qué (crítico):** Fase 0 → todo. Datos (archetypeData) + Capa 1 → todos los renders. Los prompts GENERATED (coach situations) requieren **editar fuente + `gen:coach`**, no hand-edit. `profileChange` (RCI) y "momento notable" están bloqueados por la persistencia de la ficha (Fase 1-3).

---

## 4. Forward-only vs migración de datos

**Forward-only (NO tocar datos viejos — precedente 2026-06-02):**
- Filas ya guardadas en `perfilamientos` / `one_purchases`: conservan `motor='Rápido/Medio/Lento'` y `archetype_label` viejo. **No se backfillean.**
- Informes ya persistidos, posts de blog publicados (`archetype_ref` viejos), respuestas históricas sin `question_id` (el "momento notable" simplemente no dispara en históricos).
- Todo el trabajo de docs y código es hacia adelante.

**SÍ requiere migración — pero solo ADITIVA (nunca destructiva):**
- `ADD COLUMN` en `perfilamientos`: banda, forma, B, top/second/third_count, motor_narratable, edad_meses, factorEdad, sub-motores age-fair. + `NOTIFY pgrst 'reload schema'`.
- Cambio de **shape** (no de datos viejos) de `answers` jsonb → `{question_id, axis, responseTimeMs}` + `question_version`.
- Empezar a **poblar** `game_metrics` (columna ya existe, hoy se descarta).

> No hay ninguna migración destructiva ni backfill de labels en el plan. La reescritura de `archetype_label` aplica solo a perfilamientos nuevos.

---

## 5. Riesgos y gotchas

1. **Componentes dinámicos que un grep NO caza:** `TENDENCIA_CONTENT`/`getLocalizedTendenciaContent` ya modelan eje×eje; el nombre se arma por concatenación en varios lugares (`arquetipoFull = label + tendenciaLabel`). Un grep de string contiguo NO encuentra los nombres compuestos en runtime (mismo patrón que el gotcha `ProductName`/`BrandName` del branding).
2. **Regiones GENERATED (fail si se hand-editan):** `api/tenant-chat.ts` COACH_PROMPTS (fuente `scripts/coach-prompt-source.ts`) y COACH_SITUATIONS (fuente `src/lib/situationalGuide*.ts`). Editar fuente + `npm run gen:coach`; `check:coach-gen` (parte de `qa:unit`) rompe el build si driftea.
3. **La divergencia de resolvers:** `resolveProfile` deriva motor del **ratio de votos DISC**, mientras `resolveMotorFromGames` lo deriva de la **latencia de mini-juegos** — dos fuentes distintas producen la misma etiqueta motor-tipo. Regla dura nueva: el nombre/eje **nunca** sale de la velocidad; solo los votos nombran, y el motor de juegos solo alimenta "Su motor".
4. **Esquema viejo acoplado a lógica agregable:** el Motor como **tipo clasificable de grupo** (`MotorGroupType`, `getMotorGroupType`, MotorChart, "distribución por motor") pierde base conceptual — no es un rename, hay que **decidir eliminar vs redefinir como insight ipsativo**. Baranda §12: prohibido barras crudas comparables entre niños.
5. **Colisiones terminológicas nuevas:** "su motor de motivación" (onboarding = combustible) y "El Motor del Viaje" (escena DISC) chocan con el módulo nuevo "Su motor" (tempo). Renombrar el combustible.
6. **Gates dependen de datos que hoy no se persisten:** band-guard/name-gate/motor-gate no pueden gatear sin banda/top_count/motor_narratable en la ficha. Si se implementan los guards antes que la persistencia, fallan closed sobre datos vacíos.
7. **Normalización por edad:** requiere que la **edad en meses llegue al resolver** — hoy no se pasa.
8. **CI/canaries como falsos rojos:** `journey-canary` y `qa-monitor` tienen fixtures y una aserción canónica con nombre viejo; romperán o (peor) pasarán validando el esquema viejo si no se migran junto con el código.
9. **`ai_events.label_violation` y `FORBIDDEN_OLD_LABELS`:** hay que **invertir** qué es "prohibido": ahora los nombres eje×tempo (Impulsor Dinámico) deben entrar a la lista de prohibidos para que la IA no los emita.
10. **Tests ya stale:** `argosEngine.test.ts` menciona campos inexistentes (brujula/ritmo/ajedrecista) — está desincronizado antes de empezar; buen momento para reconstruir la suite, pero no confiar en que "pasa" hoy.
11. **Duplicación `TenantGroups` vs `TenantGrupos`:** casi duplicados (split plantel/grupo pendiente) — cambiar ambos o divergen.

---

## 6. Explícitamente fuera de alcance ahora

- **El diseño del informe individual está resuelto** en `preview/informe-final.html` — NO se re-diseña ni se audita el mockup. **PERO su reimplementación en código SÍ está en alcance** (`ReportPage.tsx`, `api/generate-ai.ts`, email): esto es traducción del mockup a código, no rediseño.
- **Perfil del adulto (ArgoPuente):** el `AdultMotor` (agil/equilibrado/profundo) es un constructo separado. Su alineación al naming nuevo es **decisión de producto pendiente, no bloqueante** para el barrido del niño; el backend adult-profile/bridges aún está sin construir (conviene definirlo ya con el esquema nuevo, pero no es prerequisito).
- **Docs históricos** (`METODO-ESTADO-ACTUAL.md`, `AUDITORIA-*`, `CHANGELOG`): se dejan como registro/punto de retorno.

---

## 7. Huecos a confirmar antes de ejecutar

- La **cascada de forma (6 tipos)** y la **enumeración de las 455 combinaciones banda×forma** se mencionan (`scripts/enum-bandas.mjs`, `test-formas.mjs`) pero esos scripts no fueron barridos en detalle — verificar que existen y qué contienen.
- Qué doc queda como **spec de cálculo autoritativa** (`METODO-CALCULO-NUEVO` vs `PREGUNTAS-Y-CALCULO-PERFIL` / `sistema-de-perfilamiento`) es una decisión de gobernanza pendiente.
- El **léxico exacto de la banda de 3 zonas** (reflexivo/intermedio/ágil) y su gating de copy depende de `METODO-CALCULO-NUEVO` §1-§3 (y de las correcciones de la ronda 2: el léxico del tempo debe ser puramente cronométrico, no disposicional).
