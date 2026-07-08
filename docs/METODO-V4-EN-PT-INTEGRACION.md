# Informe v4 — en/pt: traducciones LISTAS, integración pendiente

> 2026-07-07. Las traducciones de TODO el copy del informe v4 a EN + PT están **producidas y verificadas adversarialmente** (3 workflows). Falta la **integración** (refactor lang-keyed del engine + abrir el gate). El camino **es sigue intacto** (nada de esto se aplicó todavía). Estado general: `METODO-V4-ESTADO-Y-RUNBOOK.md`.

## Dónde están las traducciones

**`docs/_i18n/report-v4-translations.json`** (47 KB), con 3 buckets:
- `copy`: léxico (meter_labels, eje_word, eje_lead, receta_ejemplo, storm_ejemplo, success_anchor, meta_choice, context_word), section_titles, group_titles, lead (5 registros + veta_clause), footer.
- `bodies`: templates de secciones (receta/contingencia/patron/tormenta/grupo/logro, con sus verbos y frases de marco equipo/individual) + motor (rapido/intermedio/lento).
- `eje`: contenido de los 4 ejes (D/I/S/C: combustible, palabrasPuente/Ruido, palabrasNota, guia, reset, ecos).

Placeholders (`${n}`, `${corta}`, `{nombre}`, etc.) y **negritas** preservados. Voz: cálida, positiva, probabilística, género-neutro (EN "they/them"; PT sin marcas o/a). Los workflows quedan cacheados (resumeFromRunId) por si hay que regenerar.

## FIXES del verificador a aplicar en la integración (NO olvidar)

**EN:**
- `eje.D.combustible.cuerpo`: doble `{nombre}` → 2ª ocurrencia a "they" ("When they sense…").
- `eje.D.guia.antes`: doble `{nombre}` → "Offer them a concrete goal…".
- `eje.*.label`: usar los labels canónicos de `archetype-naming.md` (D Driver, I Connector, S Sustainer, C Strategist) — NO el "label" del payload (D vino sin traducir; I/S/C sin label). Igual, el label del EJE ya vive en `archetypeContentV4.AXIS_ARCHETYPE_LABEL`; usar ese, ignorar el del payload.

**PT:**
- `eje.S.palabrasNota`: quitar las comillas dobles envolventes de más.
- `eje.I.reset.cuerpo`: "sozinho" (género) → neutro ("que tem companhia" / "que não enfrenta isso em solidão").
- `eje.S.palabrasPuente`: "Obrigado por sustentar…" (género del adulto) → neutro ("Que bom poder contar com você para sustentar o grupo").
- `eje.D.ecos.cuerpo`: `{nombre}` quedó DENTRO de la negrita final → "**seu jeito de estar no mundo**" (sin nombre en la negrita).
- `eje.I.guia.despues`: `{nombre}` DENTRO de la negrita → "**quando soma ao ânimo do grupo**".
- `eje.S.guia.lead`: unificar con D/I/C ("Três momentos em que uma pequena intenção muda muita coisa").
- (heredado, opcional) `eje.D.ecos.ejemplo`: "dos primeiros" genérico masculino — neutralizar en ambos idiomas si se quiere.

## Plan de integración (refactor, protegido por los tests de es)

Arquitectura: centralizar el copy en `Record<Lang, ...>` (es verbatim + en/pt del JSON). El engine (`reportV4.ts`) computa SLOTS (nombre, conducta, count, qué rama) y llama a un template por idioma. Separa LÓGICA (compartida) de COPY (por idioma). `lang` ya está threadeado en `ReportContext` (opcional, default es).

Pasos (correr `qa:unit`/tests de es DESPUÉS DE CADA UNO — blindan es):
1. **Léxico → `Record<Lang>`**: EJE_WORD, EJE_LEAD, RECETA_EJEMPLO, STORM_EJEMPLO, SUCCESS_ANCHOR, META_CHOICE, CONTEXT_WORD, METER_LABELS. AXIS_ARQ desde `AXIS_ARCHETYPE_LABEL`. Builders indexan por `ctx.lang`.
2. **Lead** (`leadParagraph`) → templates por idioma (5 registros + veta_clause). getVetaLabel ya es lang-aware.
3. **Secciones** (receta/contingencia/patron/tormenta/grupo/logro) → templates por idioma (bodies + verbos + frases de marco). Cuidado con las concordancias (verbo2/suman/pesa) y `listaClara` (el separador "y también" tiene su equivalente EN "and also" / PT "e também").
4. **Motor** (`archetypeContentV4.MOTOR_INSIGHT_TEMPLATES`) → reemplazar el en/pt viejo por el nuevo (bodies.motor), con ejemplo.
5. **Contenido de ejes** (`archetypeContentV4.EJE_BASE`) → `Record<Lang>` (es + en + pt del bucket eje, con los fixes). `getEjeBase(axis, lang)` devuelve en/pt.
6. **Section/group titles + footer** (ReportV4View) → por idioma.
7. **Gate**: abrir a en/pt (`reportQuality.ts` idioma check + el gate server-side inlineado en `session.ts` — hoy retienen lang≠es). Recalibrar los guards (el voseo-guard es es-only; en/pt tienen sus propios patrones — o desactivarlo para no-es).
8. **Tests**: generar informes en/pt (Mateo) + inspeccionar HTML (como se hizo con es); tests de que en/pt renderizan sin `{...}` residual y sin mezcla de idioma.
9. Recién ahí, con en/pt verificado, el pipeline/gate dejan pasar en/pt.

**Riesgo**: es el refactor más invasivo del engine vivo. Mitigación: es verbatim (tests de es lo prueban) + gate cerrado para en/pt hasta el paso 8 + inspección del HTML en/pt. Hacerlo como pasada enfocada.
