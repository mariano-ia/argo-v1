# Home v2 — propuesta de rediseño lúdico interactivo (2026-07-23)

> **Estado:** PROPUESTA en develop. La home actual queda intacta en `/` (`public/sales/argo-home.html`).
> La propuesta vive en **`public/home-v2/index.html`** y se sirve como archivo estático en
> **https://develop.argomethod.com/home-v2/** (el filesystem de Vercel gana al rewrite SPA, mismo
> mecanismo que `/redesign/`). No toca `promote-home.mjs` ni el swap de `/`.

## Concepto: "El sitio te lee mientras lo navegas"

La página entera se construye con el lenguaje visual del rediseño de informes 2026-07
(`docs/REDISENO-INFORMES-2026-07.md`): **orbes de vidrio vivos** (morph + float), **Fraunces** como
serif de display, spectrums, hairlines que se desvanecen, paneles glass y la regla de color
(eje = identidad, violeta = marca/interacción). Sin fotos stock: los orbes son la identidad.

El movimiento ganador: la home no describe el producto, **lo demuestra**. Objetivo: explicar simple
y claro ArgoOne® y ArgoAcademy® (un método, dos mercados).

## Secciones (en orden)

1. **HERO = escenario interactivo "la crew te pregunta"** (iteración 2026-07-23, concepto del owner;
   reemplazó al hero de orbes + la forja + la mini odisea, que se ELIMINARON):
   - **Escenario**: el loop ya aprobado del puerto (`/scenes/video/port.mp4`, 340K, la nave Argos
     llegando al muelle) como video de fondo + una capa PLACEHOLDER de 4 sprites de la crew
     (`public/home-v2/crew/`, limpiados de su falsa transparencia con flood-fill PIL y recortados)
     parados en el muelle mirando a cámara, con idle bob y **reacciones CSS por eje**
     (D salto / I se inclinan juntos / S se plantan / C ladean la cabeza).
   - **Secuencia**: llegada (la crew entra) → "Te miran. Esperan tu decisión." (caption pill) →
     aparece el TELÉFONO con la pregunta 1 → al responder, la crew REACCIONA (animación + caption
     narrativo) → pregunta 2 (determina la veta, JUGADA, no elegida) → el teléfono muestra
     "Su perfil hoy": nombre eje×veta + orbes + lectura + nota honesta (12 decisiones reales,
     455 mezclas, su motor) + CTAs (/demo, #argoone) + probar de nuevo.
   - **Reglas de naming respetadas**: 2ª decisión == primario → perfil puro; == diagonal (D-S/I-C) →
     puro + nota "los opuestos no forman nombre"; si no → "X con veta Z" (las 12 combinaciones).
   - **Mobile**: SIN mockup (el visitante ya está en un teléfono): el video full-bleed recortado,
     titular compacto arriba, y las preguntas como **hoja inferior** (bottom sheet) con el caption
     narrativo dentro de la hoja. El mockup de teléfono es solo desktop.
   - **VIDEO TODO** (marcado en código): cuando existan los clips reales de la crew (llegada /
     espera-loop / 4 reacciones, todos anclados al MISMO frame), `setStage()` conmuta clips y la
     capa de sprites se retira. La API de estados ya queda lista. Los captions actuales por eje
     sirven como brief de los prompts de video.
2. **Cómo funciona**: 3 pasos con orbes (juega → el método lee → el adulto recibe claves) + línea DISC.
5. **Un método, dos caminos**: cards espejo ArgoOne® (padres/responsables/entrenadores; "el niño juega
   y el responsable recibe los dos informes") y ArgoAcademy® (instituciones/clubes/colegios/academias;
   "los dos informes + el dashboard"), con mini flujos de orbes. Anclan a sus secciones.
6. **Showcase ArgoOne® (scrollytelling)**: el "Perfil conductual de Benjamín (fútbol)" en miniatura
   fiel al rediseño (hero eje×veta, Su mezcla con proporciones no números, spectrum del motor,
   paneles de palabras, timeline antes/durante/después, reset) se recorre solo dentro de un marco
   mientras el usuario scrollea; 4 anotaciones laterales se encienden por progreso.
7. **Showcase ArgoPuente®**: ídem más corto con "El puente entre Carlos y Benjamín (fútbol)"
   (donde se encuentran / la previa / el traspié típico / después de jugar).
8. **Playground ArgoAcademy®**: un dashboard DE VERDAD interactivo (equipo de ejemplo "Las Gaviotas",
   hockey Sub 12: Juan, Pedro, María, Mateo, Julia, Aurora) con 4 tabs:
   - **Equipo**: roster con (i); tocar un jugador abre su mini informe reducido (orbes + palabras + consejo).
   - **Química de grupo**: drag & drop real (pointer events + tap fallback) entre Línea A y B;
     la lectura de química y el medidor de mezcla se recalculan en vivo (motor de reglas por composición de ejes).
   - **Argo Coach**: chat guionado con preguntas sugeridas + matcher por nombre; cada respuesta cierra
     con una pregunta (convención del producto). Fallback honesto ("en esta demo respondo con guiones").
   - **Predictor conductual**: jugador × situación (previa / error / no quiere ir / derrota) →
     conductas probables + cómo acompañar + disclaimer probabilístico.
9. **Precios**: ArgoOne® $12.99 (Puente incluido) + ArgoAcademy® "Solicitar demo" (modal → `/api/demo-request`, `source: 'home-v2'`).
10. **FAQ / CTA final / Footer**: reusados de la home actual, restilados.
11. **Chat FAB**: mismo asistente (`/api/deck-chat`).

## Detalles técnicos

- HTML estático autocontenido (~2.470 líneas), vanilla JS, sin dependencias nuevas salvo
  **Fraunces vía Google Fonts** (ya se carga Inter igual) y lucide (ya usado).
- Orbes: clases `.orb--d/i/s/c/v/grey` con los gradientes exactos portados de
  `preview/redesign-informes-2026-07/gen_preview.py` (orb_bg/orb_shadow).
- `prefers-reduced-motion`: todas las animaciones continuas se apagan; el coach responde sin delay.
- Hover solo en `(hover:hover)`; drag por pointer events con fallback tap (mueve a la otra línea).
- `<meta name="robots" content="noindex">` mientras sea propuesta.
- Barra de progreso "travesía" en el nav (hairline + mini orbe que viaja).
- Verificado con Playwright (desktop 1440 + mobile 390): 0 errores de consola, 0 overflow horizontal,
  interacciones probadas (juego completo, tabs, drag, coach, predictor, scrub en mobile).

## Reglas de copy cumplidas

Tuteo sin voseo, sin guiones largos, marco "la actividad" (no entrenamiento), comprador-neutro
("el niño", "el responsable"), wordmarks unidos con ® (ArgoOne®, ArgoOne+® n/a aquí, ArgoPuente®,
ArgoAcademy®, ArgoMethod®), naming eje×veta sin motor en el nombre, lenguaje probabilístico
("suele", "tiende", "hoy") en todas las lecturas.

## Si se aprueba (cutover)

1. Mover el contenido a `public/sales/argo-home.html` (o apuntar `promote-home.mjs` al nuevo archivo).
2. Quitar `noindex` y restaurar canonical/OG/JSON-LD de la home actual.
3. Decidir si el juego de la mini odisea reemplaza al flipcard como pieza central de conversión.
4. Revisar peso: hoy todo inline; si crece, extraer CSS/JS a archivos.
