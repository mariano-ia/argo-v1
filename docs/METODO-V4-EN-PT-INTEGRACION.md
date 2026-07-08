# Informe v4 — en/pt: INTEGRADO ✅ (2026-07-07)

> **DONE 2026-07-07.** El informe v4 genera y renderiza en **es/en/pt**. Engine lang-keyed, contenido de
> ejes + motor en/pt, gate abierto a en/pt, render (ReportV4View) por idioma. **es quedó byte-idéntico**
> (snapshot 24 = 8 perfiles × 3 idiomas). Lo que sigue es **entrega** (email i18n + "qué idioma usa cada
> jugada"), parte del flip, NO de la integración. Estado general: `METODO-V4-ESTADO-Y-RUNBOOK.md`.

## Cómo quedó (as-built)

Arquitectura: **lógica compartida** (reportV4.ts computa slots desde la ficha) + **copy por idioma**.
- `src/lib/reportV4Copy.ts` (GENERADO por `scripts/gen_copy.py`): `COPY: Record<Lang, CopyPack>` con léxico +
  lead (5 registros + veta_clause) + section/group titles + footer + bodies (templates de secciones con verbos
  de concordancia + frases de marco equipo/individual) + `ui` (micro-copy del render). `fill()` sustituye `${slot}`;
  `listaClara()` toma los conectores "y"/"and"/"e" por idioma.
- `src/lib/reportEjeContentI18n.ts` (GENERADO por `scripts/gen_eje.py`): `EJE_BASE_EN/PT` (combustible/palabras/
  guia/reset/ecos) + `MOTOR_EN/PT` (voz nueva, con ejemplo). `getEjeBase(axis, lang)` y `getMotorInsight` ya
  devuelven en/pt.
- `reportV4.ts`: los builders indexan `COPY[ctx.lang]`; `ReportContext.lang`, `ReportV4.lang`, `ReportHero.veta`
  {pre,word,post} (para pintar el H1 por idioma). `arquetipoLabel` lang-aware (getBlendName).
- Gate (`reportQuality.ts` + inline en `session.ts`): idioma-hold solo para idiomas NO soportados (es/en/pt pasan);
  no-guiones universal; voseo es-only; `veta_inconsistente` lang-agnóstico (chequea el arquetipo secundario en
  el lead vía `hero.veta.word`, no la palabra "veta"). `reportPipeline` arma en `opts.lang`.
- `ReportV4View.tsx`: consume `COPY[report.lang]` (group_titles, footer, ui). H1 con piezas de veta coloreadas.

**Fixes de gramática/traducción hallados y corregidos en la integración:** contracción PT `em`+artículo → `n`
(`na ação`/`no vínculo`, antes `em a ação`) en el lead rotundo/claro; los 6 fixes del verificador (ver abajo).

**Tests:** snapshot 3 idiomas (24), `reportV4.i18n.test.ts` (sin placeholders residuales; EN ASCII puro = no hay
es/pt colado; PT sin marcas es-only; label/títulos/veta por idioma), gate/pipeline/view actualizados. Suite v4: 92 verde.

**Pendiente (ENTREGA, no integración):** (1) email `buildHtmlV4` sigue es (todos los report_v4 guardados son es;
ningún en/pt se entrega aún) — i18n del email va con el flip. (2) plumbing "qué idioma usa cada jugada" (hoy el
shadow arma es). Ambos son del flip (`V4_SEAL=on` + selección de idioma + rollout).

## Traducciones (fuente)

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

## Plan de integración — EJECUTADO ✅

El plan (9 pasos: léxico → lead → secciones → motor → contenido de ejes → titles/footer → gate → tests) se
ejecutó completo el 2026-07-07, protegido en cada paso por el snapshot de es (byte-idéntico). Ver "Cómo quedó
(as-built)" arriba. Para regenerar el copy: `python3 scripts/gen_copy.py` (COPY) y `python3 scripts/gen_eje.py`
(contenido de ejes + motor); ambos leen `docs/_i18n/report-v4-translations.json`. NO editar los .ts generados
a mano. El snapshot es la red de seguridad (regenerarlo solo con intención explícita de cambiar copy).
