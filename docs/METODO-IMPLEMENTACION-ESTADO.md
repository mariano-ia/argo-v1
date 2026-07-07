# Estado de la implementación — rediseño del método (corrida nocturna 2026-07-06)

> Reporte de cierre de la corrida autónoma. Todo **local en `develop`, sin push**. Cero cambios en producción (no se aplicó ninguna migración, no se pusheó). Plan completo: `METODO-PLAN-IMPLEMENTACION.md`. Spec: `METODO-CALCULO-NUEVO.md`. Nombres: `archetype-naming.md`.

## Qué quedó HECHO y VERIFICADO (compila + tests verdes)

| Fase | Qué | Commit | Verificación |
|---|---|---|---|
| **0** | Fuente de verdad reescrita a eje×veta: `archetype-naming.md` (tabla 4 puros + 8 blends es/en/pt, regla de opuestos, 14 mapas espejo, 12 eje×tempo → prohibidos), `CLAUDE.md` §naming + MOTOR_CHIP, gobernanza en la spec, memoria (para que ninguna sesión futura vuelva al esquema viejo) | `928c194` | 5 docs coherentes entre sí |
| **1** | `evidenceFicha.ts` (el contrato de datos v4) + `nullDistribution.ts` (masas congeladas + clasificadores puros) + `scripts/enum-bandas.mjs --check` + `scripts/test-formas.mjs` | `6cb45af` | enum reproduce §7 exacto; cascada particiona las 455 al 100.00%; 4 tests TS; tsc 0 errores; **en `qa:unit`** |
| **3 (núcleo)** | Engine v4 **aditivo**: `ageNorms.ts` + `buildVotesEvidence` / `resolveMotorInsights` / `resolveEvidenceFicha` / `buildDisplayName` en `profileResolver.ts` (funciones NUEVAS, las viejas intactas) | `f9a6d58` | **9 tests de casos canónicos** (4-3-3-2, 5-3-2-2, 6-2-2-2, 12-0-0-0, veta afirmada, veta opuesta, motor) verdes; tsc 0 errores; **en `qa:unit`** |
| **2A** | Migración aditiva `20260706_perfilamiento_ficha.sql` **APLICADA en prod 2026-07-07** (25 cols, 151 filas intactas method_version=NULL, view OK, security_invoker preservado) + `question_id`/`QUESTION_VERSION`/`SIGNATURE_SCENES` | `203907c` | verificado en DB (0 filas mutadas) |
| **2B (borrador)** | `archetypeContentV4.ts`: MOTOR_INSIGHT_TEMPLATES (cronométrico es/en/pt) + getVetaLabel/getBlendName + Impulsor base de ejemplo. **Copy para revisión del owner** antes de completar las 4 bases + en/pt | `c681a29` | tsc 0 errores |

**El núcleo correcto está probado:** el engine produce el nombre gateado correcto (los dos gates B/B2, la cascada de 7 formas, la regla de opuestos, el motor como insight age-fair sin afirmar zona) y está anclado a la enumeración exacta de las 455 composiciones por tests que corren en `qa:unit`. Esta es la parte de mayor riesgo-de-equivocarse, y quedó cerrada y verificada.

## Estrategia usada: ADITIVO (no big-bang)

Construí las funciones/módulos v4 **al lado** de los viejos, sin cambiar firmas ni borrar nada. Por eso `tsc` quedó en **0 errores en todo momento** y nada se rompió. El camino nuevo (`resolveEvidenceFicha` → `EvidenceFicha`) existe y está testeado; los consumidores viejos siguen usando el camino viejo hasta que se migren uno por uno.

## Por qué FRENÉ acá (y no seguí con los 50 archivos)

Dos razones honestas, ambas para protegerte:

1. **Fase 2B (contenido `archetypeData`) es copy sensible.** Re-keyar los 12 arquetipos a 4 bases + veta implica tocar copy en es/en/pt que va a los chicos. Aunque reusa copy ya aprobado (la variante "Medio" depurada de tempo), no es algo para auto-generar y comitear a las 3am sin tu ojo. Lo dejo con la estructura definida para tu revisión.
2. **Las fases 4-10 (migración de consumidores) son big-bang.** Cambiar la firma de `getReportData` (eje×motor → EvidenceFicha) rompe `tsc` en decenas de archivos (render, dashboard, coach, email, marketing) hasta migrarlos TODOS coherentemente. Hacer una fracción deja el build roto, que es peor que no tocarlo. Eso es trabajo de día, con checkpoints y con vos disponible para las decisiones de UI y copy que van saliendo.

Preferí dejarte **una base verificada y que compila** + el plan completo, antes que un rewrite a medias que no arranca.

## Decisiones por default que tomé (owner dormido — confirmá o corregí)

Están todas en `METODO-PLAN-IMPLEMENTACION.md` (tabla al inicio). Las que ya toqué código:
- **Motor sin normas reales → `tempo_zona` SIEMPRE `intermedio`** (nunca afirma rápido/lento sobre semilla bibliográfica). Honesto; se desbloquea con datos.
- **Edad**: el engine toma `edadMeses`; el capturador real de mes/fecha de nacimiento es trabajo de Fase 4 (hoy hay `edad` en años; se aproxima `edad*12`, flagueado).
- **Label ES canónico** en la ficha; el i18n completo (en/pt "con veta") vive en la capa de render (Fase 5/6). Convención en/pt provisional a confirmar.

## La última milla (te necesita a vos)

1. **Aplicar la migración** `20260706_perfilamiento_ficha.sql` a la DB (la corremos juntos; es aditiva y no destructiva, pero toca la base de prod). Recordá el `NOTIFY pgrst` (ya está en el archivo).
2. **Revisar las decisiones por default** de la tabla del plan.
3. **Push** cuando quieras (todo está local en develop).
4. **Copy de Fase 2B** (las 4 descripciones base + templates de motor) — con tu revisión.

## Cómo seguir (orden recomendado)

Fase 2B (copy, con tu ok) → Fase 3 resto (`argosEngine`/`profileChange`) + **en el mismo lote** los consumidores (Fases 4-10), porque comparten la firma. Cada lote: compila + `qa:unit` verde antes del siguiente. El plan tiene el orden de commits exacto (§5).

**Riesgo controlado:** nada tocó producción. `git log --oneline` muestra 5 commits nuevos de docs + engine, todos reversibles.
