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

1. **Hero**: campo de 4 orbes vivos con parallax al puntero + titular Fraunces con palabra rotativa
   ("a su manera / a pura chispa / en equipo / con calma / entendiéndolo todo", cada una en su color de eje).
2. **Los 4 colores + el mezclador** ("Cuatro colores, doce perfiles, una mezcla única"): 4 cards orbe
   interactivas que enseñan los ejes, y debajo **el mezclador**: el visitante elige primario y
   acompañante y forma los **12 perfiles canónicos** (4 puros + 8 eje×veta) con nombre real en Fraunces,
   orbes jerarquizados y una lectura por perfil. Las vetas ofrecidas excluyen los opuestos D-S / I-C
   (nota al pie lo explica). Tocar una card de eje también setea el primario. Ajuste 2026-07-23: el
   owner marcó que hablar solo de 4 "acotaba mucho"; la sección ahora muestra que 4 son los colores
   y 12 los perfiles, y que la mezcla exacta hace único a cada niño.
3. **Mini odisea (#pruebalo)**: el visitante juega 3 decisiones (colores de opción POSICIONALES,
   nunca revelan eje) y ve formarse SU mezcla de orbes en vivo, con lectura honesta
   (3 = de lleno / 2+1 = con destellos de, bloqueado si es diagonal D-S o I-C / 1+1+1 = mezcla pareja)
   y nota "tres decisiones son una tendencia, no un perfil". CTA a /demo.
4. **Cómo funciona**: 3 pasos con orbes (juega → el método lee → el adulto recibe claves) + línea DISC.
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
