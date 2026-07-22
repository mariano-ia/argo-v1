# Rediseño de informes (niño + Puente) — estado y handoff

> **Fecha:** 2026-07-21. **Estado:** DISEÑO EN PREVIEW. La mayor parte NO está en los componentes
> reales todavía; se itera sobre maquetas HTML autocontenidas. Este doc alcanza para retomar mañana.

## TL;DR
Dos frentes, en dos estados distintos:

1. **Informe del niño — cambios de CONTENIDO:** YA están en el working tree (verificados, `tsc` + `qa:unit` verdes), **sin commit y sin push**. Son 3: proporciones en vez de números, `(i)` por módulo, y "Qué lo enciende" → "Qué lo motiva".
2. **Informe del niño + Puente — rediseño VISUAL:** solo en **preview** (cohesión con el dashboard + radar + hero premium animado). NADA de esto tocó los componentes reales.

## URLs de preview (artifacts, persisten en claude.ai)
- **Informe del niño (hero premium + resto cohesionado):** https://claude.ai/code/artifact/bcff3439-11ad-4c34-8f67-28acbf9739f8
- **ArgoPuente (cohesionado):** https://claude.ai/code/artifact/526959ea-89e1-4096-b55f-c3680b25e2af

## Dónde está el código de la preview (durable)
Copiado desde el scratchpad (efímero) al repo, en:
`preview/redesign-informes-2026-07/`
- `gen_preview.py` — genera la maqueta del **informe del niño** (lee `report-data.json` + `inter-var.b64` + `fraunces.b64`, escribe `argo-informe-preview.html`).
- `gen_puente.py` — genera la maqueta del **Puente** (lee `report-data.json` + `inter-var.b64`, escribe `argo-puente-preview.html`).
- `report-data.json` — datos reales del informe v4 de "Mateo" extraídos del engine (hero + secciones + tips). Sample base de ambas maquetas.
- `inter-var.b64`, `fraunces.b64`, `playfair.b64` — fuentes variables (latin) en base64 para embeber (el CSP de artifacts bloquea CDNs).
- `argo-informe-preview.html`, `argo-puente-preview.html` — salidas generadas.

**Regenerar (turnkey):**
```bash
cd preview/redesign-informes-2026-07 && python3 gen_preview.py && python3 gen_puente.py
```
**Republicar:** subir el HTML con el tool Artifact al MISMO URL (informe) o al del Puente. Desde otra
conversación hay que pasar el `url` para no crear uno nuevo.

---

## 1) Informe del niño — cambios de CONTENIDO (en working tree, sin push)
Verificado: `npx tsc --noEmit` ✓, `npm run qa:unit` ✓, tests de informe ✓, content-lint sobre las cadenas nuevas ✓.
**Decisión pendiente:** commitear (y eventualmente push) o seguir iterando. NO se pusheó nada.

**Qué cambió y dónde:**
- **Proporciones en vez de números** ("N de 12" → "en la mayoría / casi todas / muchas / varias / algunas de sus decisiones"). Afecta hero lead (rotundo/claro) y "Su mezcla" (receta_base). Lógica de bandas `cuantasKey(count)` en `src/lib/reportV4.ts`; léxico `cuantas` en el copy generado.
  - Bandas: ≥10 casi_todas · 8-9 mayoria · 6-7 muchas · 4-5 varias · ≤3 algunas. (Elegidas para no chocar con el adjetivo del registro: por aritmética de 12 respuestas, rotundo⟹topCount≥8, claro⟹≥6.)
- **`(i)` por módulo:** tooltips por sección. Copy en `src/lib/reportSectionTips.ts` (NUEVO, es/en/pt). Render con el `InfoTip` **del sistema** (`src/components/ui/Tooltip.tsx`) en `ReportV4View.tsx`.
- **"Qué lo enciende" → "Qué lo motiva"** (es/en/pt): `section_titles.combustible`.

**Pipeline i18n (OJO):** el copy es/en/pt vive en `src/lib/reportV4Copy.ts` que es **GENERADO** por `scripts/gen_copy.py` (es = dict `ES` en el script; en/pt = `docs/_i18n/report-v4-translations.json`). NO editar `reportV4Copy.ts` a mano: editar las fuentes y correr `python3 scripts/gen_copy.py`. El snapshot `src/lib/reportV4.snapshot.test.ts` congela la salida byte a byte (regenerado con intención en esta tanda).

Archivos tocados: `reportV4.ts`, `reportV4Copy.ts`, `scripts/gen_copy.py`, `docs/_i18n/report-v4-translations.json`, `reportSectionTips.ts` (nuevo), `ReportV4View.tsx`, `archetypeContentV4.ts` (comentario), `api/report-variant.ts` (limpieza del prompt), tests (`reportV4.test.ts`, `reportCapa2.test.ts`, `emailV4.test.ts`, `ReportV4View.test.tsx`) + snapshots es/en/pt.

Nota: arreglé de paso un test stale pre-existente (`ReportV4View.test.tsx` esperaba "con veta" pero Mateo con B2=2 da "con tonos de").

---

## 2) Informe del niño — rediseño VISUAL (SOLO preview)

### 2a. Cohesión con el dashboard (aprobada por el owner)
Regla base para que "parezca hecho por la misma mano":
- **Fuente Inter** (la del producto). El informe real corre Inter globalmente (`font-sans`), pero la maqueta la embebe.
- **Card shell del dashboard:** `rounded-[14px]`, `shadow-argo` (`0 1px 3px rgba(0,0,0,.04)`), **sin borde**. (Antes el informe usaba radio 20 + borde + sombra de hover en reposo.)
- **Escala/pesos de facto del dashboard:** títulos de sección 15/semibold, cuerpo ~15, muted 11-13.
- **REGLA DE COLOR (clave):**
  - **color del eje = IDENTIDAD** (nombre, punto de sección, medidor, radar, orbes).
  - **violeta (`argo-violet-*`) = MARCA/INTERACCIÓN** (el `(i)`, el eyebrow del hero, los filetes de los asides/ejemplos).
  - **verde = SEMÁNTICO** (Conectan).
- Los "ejemplos" (bajada a tierra) pasaron de caja gris con filete grueso a **aside con filete fino violeta** (patrón de nota-al-margen del dashboard).

### 2b. "Su mezcla" = RADAR de los 4 ejes
- Radar SVG, **monocromo en el color del eje primario** (naranja para Mateo; como la referencia del owner que era verde por ser Sostenedor).
- **Opuestos del modelo enfrentados:** Impulsor↕Sostenedor (vertical), Conector↔Estratega (horizontal). Más fiel al DISC que la referencia.
- Grilla tenue, glow en el eje dominante, labels como texto SVG en las puntas.
- **PENDIENTE:** el radar reintroduce cifras `/100` (choca con "no números absolutos"). Falta decidir: dejarlas / atenuarlas / ocultarlas / solo hover. Y falta **definir la normalización** de conteo(0-12) → score(0-100) de forma justa. En la maqueta hay valores representativos (`RADAR_SCORES` en `gen_preview.py`).

### 2c. HERO premium (última dirección, "me encanta" del owner)
Inspirado en una referencia que el owner amó (dos orbes de vidrio + serif). Layout de **dos columnas** (nombre+lead+chip a la izquierda, orbes+pills a la derecha), apila en mobile.
- **Nombre en serif de display (Fraunces):** `clamp(27px,4.4vw,37px)`, weight ~440, identidad **por color y por letra** (no por peso). Palabra primaria en color del eje, "con tonos de" en navy, la veta en su color. Eyebrow "Su perfil hoy" en violeta.
  - **DECISIÓN ABIERTA:** la serif es un elemento NUEVO (hoy el sistema es solo Inter). Hay que decidir si se adopta como fuente de titulares. Alternativa cargada: **Playfair** (`playfair.b64`, más clásica) vs **Fraunces** (más moderna, la puesta ahora).
- **Orbes vivos (el pedido central):** dos discos de **vidrio transparente** (radiales ~30% alpha en el núcleo, se ve a través), **superpuestos** (se cruzan en el centro-derecha), con **rim fino de su color** (inset ring) para que se lea el borde donde se cruzan. Representan los **dos ejes principales** (primario + veta). **Animados:** `border-radius` que morfa (círculo imperfecto) + float lento, ritmos distintos por orbe. **Respetan `prefers-reduced-motion`** (quietos si el SO lo pide).
- **Pills flotantes:** Impulsor (naranja), Estratega (violeta), y la **confianza** como pastilla **"Perfil claro"** con `(i)` al lado; **anillo punteado** tenue detrás.
- **Chip "Tendencia clara"** con `(i)` (la explicación vive en el tooltip; se sacó el texto "Este patrón…").
- **Tooltip de la pill "Perfil claro"** se salía por el borde derecho → ahora **abre hacia arriba y centrado** (clase `.tipbox-up`). Los `(i)` de secciones siguen abriendo hacia abajo.

**Texto en general más chico / más delicado** en todo el hero (pedido del owner en la última ronda).

### 2d. Superseded (pero documentado por si se vuelve)
Antes del hero premium hubo un **panel de diseño** (6 direcciones + juez, workflow) que produjo un
indicador de confianza "instrumento ordinal" en 3 remates: **A punto / B aguja / C susurrado** (hairline
+ ticks neutros + 1 marcador + labels con gradiente de peso, sin gauge). El hero premium lo reemplazó por
la pastilla "Perfil claro", pero si se abandona la dirección de orbes, esas 3 variantes son el mejor
fallback delicado (síntesis del juez guardada en el transcript del workflow de esa sesión).

---

## 3) ArgoPuente — rediseño VISUAL (SOLO preview)
El Puente ya usaba varios patrones del dashboard, pero con incoherencias. Se le aplicó **el mismo stylesheet** que el informe del niño (misma fuente, cards, aside violeta, `(i)`):
- **Perfil del adulto como el hero del informe:** nombre coloreado "Estratega con veta Sostenedor" (no pills sueltas).
- **Encabezados de sección:** de micro-caps `text-[11px]` tracking ancho + iconos a **punto + título 15/semibold**.
- **La triada de cada puente** (cómo está / lo que traes / el puente) dejó las cajas con borde `#D2D2D7` y pasó a **asides con filete**: niño en su color, adulto en el suyo, el puente en violeta.
- **`(i)`** en los widgets de datos (composición, presión).
- Contenido **de muestra** (caso Marian↔Mateo); el real lo genera la IA (`api/generate-puentes.ts`).
- **Aún NO tiene** el hero premium con orbes (solo cohesión). Si se aprueba el hero del niño, replicar el mismo lenguaje acá (los dos ejes del adulto como orbes, etc.).

Componente real a tocar cuando se implemente: `src/components/puentes/PuentesReport.tsx`.

---

## 4) Principio nuevo: animación como herramienta
El owner pidió pensar la **animación como herramienta de refinamiento** (es un touchpoint digital).
Criterio propuesto: **movimiento lento, ambiental y con propósito** (nunca decorativo ni que distraiga),
SIEMPRE con salida por `prefers-reduced-motion`. Candidatos: entrada suave al abrir el informe, el radar
que se "dibuja" al aparecer, micro-interacciones en `(i)`/pills, y los orbes que respiran (ya hecho).

---

## 5) Cómo bajar a los componentes reales (cuando se apruebe)
- **Informe del niño:** `src/components/report/ReportV4View.tsx` (presentacional puro). Hoy usa Tailwind + tokens de `src/lib/designTokens.ts`. El hero premium requiere: (a) sumar la serif de display al pipeline de fuentes (hoy Inter por Google Fonts en `index.html`); (b) el CSS de orbes/animación (keyframes) probablemente como CSS propio o `<style>`, ya que Tailwind no cubre morph de `border-radius`; (c) respetar `AXIS_COLORS`/`AXIS_CHIP` de `designTokens.ts` (no hardcodear). Se renderiza en `ReportPage.tsx` (standalone) y dentro del dashboard en `TenantPlayers.tsx`.
- **Puente:** `src/components/puentes/PuentesReport.tsx`.
- **Radar + gauge/pills:** componentes nuevos; mantener la regla de color (eje=identidad, violeta=marca).
- Reusar el `InfoTip` del sistema (`src/components/ui/Tooltip.tsx`) para los `(i)`, no reinventar.

## 6) Gotchas
- **El scratchpad de la sesión es efímero** — por eso se copió todo a `preview/redesign-informes-2026-07/`. Mañana es otra sesión.
- **Fuentes en artifacts:** el CSP bloquea CDNs → hay que embeber woff2 como data URI base64. Inter/Fraunces/Playfair latin variable pesan ~37-50KB, ideales.
- **No push / no commit** sin OK explícito del owner (regla del proyecto). Los cambios de contenido (frente 1) están listos pero sin commitear a propósito.
- **`gen_copy.py`** NO tiene check de CI (a diferencia de coach-gen); el snapshot test sí congela la salida.
- Archivos "... 2.tsx" / "... 2.sql" en `git status` son basura pre-existente (no míos), no tocar.

## 7) Próximos pasos sugeridos (para mañana)
1. Cerrar el hero del niño: ¿conectores finos pill→orbe? ¿serif Fraunces o Playfair? ¿cuánto solape/movimiento?
2. Decidir el tema de las cifras `/100` del radar (y su normalización).
3. Definir si el hero premium se replica en el Puente.
4. Decidir cuándo bajar a componentes reales (y si antes se commitean/pushean los cambios de contenido del frente 1).
