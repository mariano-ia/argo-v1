# Rediseño de informes (niño + Puente) — spec as-built + handoff

> **Actualizado:** 2026-07-22. **Estado:** DISEÑO APROBÁNDOSE, vive en PREVIEW (no en los componentes
> reales todavía). Este doc es la especificación para, cuando el equipo lo apruebe, **portarlo a todos los
> informes**. Todo lo visual está prototipado en una maqueta HTML autocontenida generada por un script.

## URLs
- **Preview del informe del niño (completo):** https://claude.ai/code/artifact/bcff3439-11ad-4c34-8f67-28acbf9739f8
- **Preview del Puente:** https://claude.ai/code/artifact/526959ea-89e1-4096-b55f-c3680b25e2af
- **En develop (público, sin login):** https://develop.argomethod.com/redesign/ · `/redesign/informe.html` · `/redesign/puente.html`

## Fuente de la maqueta (durable, turnkey)
`preview/redesign-informes-2026-07/` (gitignoreado con `preview/`, commiteado con `git add -f`):
- `gen_preview.py` — genera el **informe del niño** (`report-data.json` + `inter-var.b64` + `fraunces.b64` -> `argo-informe-preview.html`). ES LA IMPLEMENTACIÓN DE REFERENCIA del rediseño.
- `gen_puente.py` — genera el **Puente**.
- `report-data.json` — informe v4 real de "Mateo" extraído del engine (hero + secciones + tips).
- `inter-var.b64`, `fraunces.b64`, `playfair.b64` — fuentes variables latin en base64.
- **Regenerar:** `cd preview/redesign-informes-2026-07 && python3 gen_preview.py && python3 gen_puente.py`.
- El deploy en develop se hace copiando los `.html` a `public/redesign/` (Vercel sirve archivos reales antes que el rewrite SPA).

---

## PARTE A — Cambios de CONTENIDO del informe (aparte del rediseño visual)
Están en la rama **`redesign-informes-hero-2026-07`** (verificados `tsc`+`qa:unit`, sin mergear). NO están en develop.
Tres cambios en el engine (es/en/pt): (1) "N de 12" -> proporción (`cuantasKey` en `reportV4.ts` + léxico `cuantas`);
(2) `(i)` por módulo (`reportSectionTips.ts` + `InfoTip` del sistema); (3) "Qué lo enciende" -> "Qué lo motiva".
Copy es GENERADO: editar `scripts/gen_copy.py` + `docs/_i18n/report-v4-translations.json`, correr `gen_copy.py`, snapshot congela.

---

## PARTE B — El REDISEÑO VISUAL (spec as-built, para portar)

### B.0 Sistema de diseño
- **Fuentes:** Inter (cuerpo, ya en el producto vía Google Fonts) + **Fraunces** (serif de display SOLO para el nombre del arquetipo — ELEMENTO NUEVO; alternativa cargada: Playfair). En la maqueta van embebidas b64; en el real hay que sumar Fraunces al pipeline de fuentes.
- **Card:** papel blanco, `border-radius:16px`, `box-shadow` sutil (`0 1px 3px rgba(0,0,0,.04)`), sin borde. Padding **con aire**: cards `28px 32px`, hero `36px 38px`, mezcla `30px 32px 28px`.
- **Aire (interlineado/espacios):** cuerpo `line-height:1.72`; separación generosa entre párrafos, ejemplo (`margin-top:20px`), secciones y grupos (grupo `margin-top:42px`).
- **REGLA DE COLOR (clave):** color del **eje = IDENTIDAD** (nombre, orbes, dots, marcadores); **violeta** (`argo-violet-*`) = **MARCA/INTERACCIÓN** (el `(i)`, asides, eyebrow); neutros para el resto. El **verde quedó prohibido** salvo semántica real (se sacó de "Palabras").
- **Primitiva ORBE (firma visual):** disco de **vidrio transparente** (radiales ~30% alpha en el núcleo, brillo blanco arriba-izq, rim fino de color por `inset box-shadow`). **Vivo:** morfa (`border-radius` keyframes `orbMorphA/B`) + float lento; **respeta `prefers-reduced-motion`** (queda quieto). Helpers `orb_bg(hex)` / `orb_shadow(hex)` en `gen_preview.py`.

### B.1 HERO (card principal)
Layout **dos columnas** (nombre+lead+confianza a la izq; orbes+pills a la der), apila en mobile.
- **Nombre del arquetipo** en Fraunces `clamp(19px,3.1vw,26px)`, weight 440, identidad **por color** (no por peso): palabra primaria en color del eje, conector ("con veta"/"con tonos de"/"con destellos de"/"y") en navy, veta en su color. Eyebrow "Su perfil hoy" en violeta.
- **Orbes = los 2 ejes principales**, con **jerarquía de tamaño por caso** (regla importante):
  - Un solo eje (sin veta): **70%** (un orbe grande, "llena").
  - Compuesto: primario **62%** + secundario según la **banda de veta**: destellos **40%**, tonos **48%**, veta **56%**.
  - Parejo (dos ejes sin jerarquía): **56% + 56%** (iguales).
  - El contenedor de orbes usa **`aspect-ratio`** (no altura fija) para que en mobile NO se desborden.
- **Pills flotantes:** los ejes (Impulsor/Estratega...) + la confianza como pastilla **"Perfil ___"** con `(i)`. Anillo punteado tenue detrás.
- **Confianza "Perfil ___":** mapea el nivel (Parejo/Con matices/Claro/De lleno) a: parejo / con matices / claro / **muy marcado**. En flujo, **debajo del párrafo** (izq). Tooltip (i) DEFINICIÓN PROFESIONAL: "Expresa cuán definido se ve el perfil hoy: si un eje sobresale con claridad o si conviven varios de forma pareja. No es una nota: un perfil parejo no es mejor ni peor, solo menos marcado."
- **Todos los casos de naming** están resueltos (sin veta / destellos / tonos / veta / distintos cruces de color / parejo). Ver `CASES` en `gen_preview.py`.
- **(i) tooltips:** icono `Info` de lucide redondo, hover violeta, burbuja navy. `white-space:normal` + `width:max-content;max-width:230px` (se ajusta al texto, siempre envuelve aunque esté dentro de una pill `nowrap`). Variante `.tipbox-up` (abre hacia arriba, anclado derecha) para pills al borde.

### B.2 "Su mezcla" (reemplaza la receta de texto)
Card con los **4 ejes como 4 orbes** dimensionados por su peso %:
- Diámetro = `MIN(22px)..MAX(96px)` según %. **Siempre los 4**, aunque uno sea 0% (queda en el mínimo: "sin nada de un eje" también es parte del perfil).
- Alineados a una base (align-items:flex-end), con **punto de color del eje + nombre + %** debajo de cada orbe.
- Debajo: **divider hairline muy delicado** (gradiente que se desvanece) y luego el **texto descriptivo real** de la sección + su ejemplo (aside violeta).
- Orden actual: modelo (Impulsor, Conector, Sostenedor, Estratega). Los orbes respiran.

### B.3 Viz por sección (primitiva `spectrum`)
- **Su motor** y **Su patrón de decisión** -> **spectrum**: hairline con relleno tenue + **marcador = mini-orbe de vidrio que respira**, sobre un eje con extremos rotulados (Pausado<->Ágil; Ritmo parejo<->Ritmo diverso). Va entre el header y el cuerpo.
- **Se SACÓ** la viz de "Ante la tormenta" y "Cuánto lo mueve el grupo" (quedan de texto). (La primitiva `orbset` existe en el generador por si se retoma.)
- **Pendiente sugerido:** motor y patrón se leen parecidos (dos spectrums); dar a "patrón" un pulso/latido para diferenciar.

### B.4 "Antes, durante y después" -> línea de tiempo
3 pasos (Antes/Durante/Después), cada uno con un **nodo mini-orbe** del color del eje, conectados por un **hilo vertical fino**; label + texto por paso. Lead arriba, ejemplo (aside) abajo.

### B.5 "Palabras que conectan" (opción C — dos paneles glass)
Dos paneles suaves (glass), reemplazan los chips verde/gris (que quedaban fuera de sistema):
- **Conectan:** panel con **wash tenue del color del eje** + borde del mismo tono, encabezado por un **mini-orbe de vidrio** + label en el color del eje. Frases como **líneas** (puntito de acento + separación finísima entre cada una).
- **Hacen ruido:** panel **neutro** (gris), mini-orbe gris, frases en gris atenuado.
- Grid 2 col en desktop, apila en mobile. La nota va debajo.

### B.6 Dividers (dos tipos, ambos hairline que se desvanece en los extremos)
- **`title-rule`:** hairline **debajo de cada título** de sección.
- **`sec-divider`:** hairline **entre secciones** dentro de un grupo.
- **`mz-divider`:** el de "Su mezcla" entre orbes y texto.

### B.7 Estructura del informe (as-built)
Hero -> grupo "Quién es hoy" (Su mezcla / Su patrón / Su motor) -> "Cómo se le ve en la actividad" (Ante la tormenta / Cuánto lo mueve el grupo / Cuando le sale bien) -> "Cómo acompañar" (Qué lo motiva / Palabras / Antes-durante-después / Un reset) -> "Más allá del deporte" -> footer "Cómo leer este informe". Cada grupo con su eyebrow.

---

## PARTE C — Decisiones ABIERTAS (resolver antes o durante la implementación)
1. **Los % (mezcla + posiciones de spectrum):** ¿proporción de decisiones (suma 100) o score independiente por eje? Y la **normalización** conteo(0-12) -> 0-100. Hoy la maqueta usa valores de muestra.
2. **"0%":** hoy explícito; decidir si se suaviza ("casi nada" / "<5%").
3. **Serif:** adoptar **Fraunces** (o Playfair) como fuente de display, o no (hoy sistema = solo Inter).
4. **Motor vs Patrón:** dos spectrums parecidos; ¿pulso para "patrón"?
5. **Animación como herramienta:** criterio = lento, ambiental, con propósito, siempre con salida por `reduced-motion`.

---

## PARTE D — Cómo PORTAR a los componentes reales (cuando se apruebe)
- **Informe del niño:** `src/components/report/ReportV4View.tsx` (presentacional puro; se renderiza en `ReportPage.tsx` standalone y dentro del dashboard en `TenantPlayers.tsx`). **Puente:** `src/components/puentes/PuentesReport.tsx`.
- **Fuente:** sumar Fraunces al pipeline (hoy `index.html` carga Inter por Google Fonts). Respetar el CSP si aplica.
- **Orbes/animación:** el morph de `border-radius` y los gradientes de vidrio NO los cubre Tailwind -> irán como CSS propio / `<style>` o CSS module, con `@keyframes` + `@media (prefers-reduced-motion: reduce)`.
- **Color:** usar SIEMPRE `AXIS_COLORS`/`AXIS_CHIP` de `src/lib/designTokens.ts` (no hardcodear). Violeta de `argo-violet-*`.
- **(i):** reusar `InfoTip` de `src/components/ui/Tooltip.tsx` (con el fix de `white-space:normal` + `max-width` si hace falta portarlo).
- **Datos:** el mezcla-% y las posiciones de spectrum necesitan cálculo real desde la ficha (`EvidenceFicha` / `reportV4.ts`), pendiente la normalización (ver Parte C).
- **Copy:** todo por proporción (no números), tuteo, sin guiones largos, comprador-neutro. Ya cohesionado con el dashboard.
- **Puente:** replicar el mismo lenguaje (hoy solo tiene la cohesión, no el hero premium con orbes).

## PARTE E — Gotchas
- Scratchpad de sesión efímero -> por eso todo se copió a `preview/redesign-informes-2026-07/`.
- Fuentes en artifacts: CSP bloquea CDNs -> embeber woff2 b64.
- **No push sin OK explícito** (regla del proyecto). Este deploy a develop fue autorizado; NO va a `main`/producción sin "mandalo a producción".
- `preview/` está en `.gitignore` -> se commitea con `git add -f`.
- Deploy: Vercel sirve `public/redesign/*.html` como archivos reales (filesystem gana al rewrite SPA).

---

## PARTE F — Design System del rediseño (elementos nuevos, reutilizables)
Vocabulario visual que salió del informe del niño y ahora es el sistema para el resto (Puente incluido).
Implementación de referencia: `preview/redesign-informes-2026-07/gen_preview.py`.

- **Fuentes:** Inter (cuerpo/UI) + **Fraunces** (serif de display, SOLO nombres/arquetipos). Embebidas b64 en la maqueta; en el real, sumar Fraunces al pipeline.
- **Orbe (primitiva firma):** disco de vidrio transparente. `orb_bg(hex)` = 2 radiales (brillo blanco 36%/30% + teñido del color ~30% alpha que se desvanece a ~5%). `orb_shadow(hex)` = rim de color por `inset box-shadow` + halo suave. **Vivo:** `@keyframes orbMorphA/B` (morfa el `border-radius`) + float lento, ritmos distintos por orbe. SIEMPRE con `@media (prefers-reduced-motion: reduce){animation:none}`. Contenedor con `aspect-ratio` para que no se desborde en mobile.
  - **Jerarquía de tamaño (identidad):** un solo eje 70% > primario compuesto 62% > secundario por banda de veta (destellos 40 / tonos 48 / veta 56); parejos iguales (56+56).
- **Mezcla (4 orbes):** un orbe por eje dimensionado por su % (min 22px..96px), alineados a una base, con punto de color + nombre + % debajo. Los 4 siempre presentes (aunque 0%).
- **Spectrum:** hairline (relleno tenue) con un **mini-orbe de vidrio que respira** como marcador sobre un eje con extremos rotulados. Para lecturas de dimensión (Pausado↔Ágil, etc.).
- **Orbset:** 1-N mini orbes de vidrio dimensionados por valor, con label + %. Para comparaciones de eje (Involucrar↔Sostener).
- **Timeline:** pasos en columna, cada uno con nodo mini-orbe del color del eje, conectados por un hilo vertical fino; label + texto por paso. Para secuencias (Antes/Durante/Después).
- **Paneles glass:** paneles suaves con wash tenue del color del eje (o neutro), encabezados por un mini-orbe + label; contenido como líneas. Para pares (Conectan / Hacen ruido).
- **Dividers hairline (se desvanecen en los extremos):** `title-rule` (debajo de cada título), `sec-divider` (entre secciones), `mz-divider` (dentro de una card, entre gráfico y texto).
- **Aire:** padding cards ~28/32 (hero ~36/38), `line-height` cuerpo ~1.72, espacios generosos entre párrafos/secciones/grupos.
- **Disciplina de color:** eje = IDENTIDAD; violeta (`argo-violet-*`) = MARCA/INTERACCIÓN (el `(i)`, asides); verde PROHIBIDO salvo semántica real.
- **(i) del sistema:** icono `Info` de lucide redondo, hover violeta, burbuja navy; tooltip `white-space:normal` + `max-width` (se ajusta al texto); variante que abre hacia arriba para bordes.
