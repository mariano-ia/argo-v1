# Juego Animado — Fondos en Video (Fase 1)

**Estado 2026-07-16: INTEGRADO y desplegado en preview aislado. Juego completo jugable con videos en
https://argo-juego-animado.vercel.app (deploy de preview vía Vercel CLI, `--build-env
VITE_BGVIDEO_DEFAULT=1`, NO toca prod ni develop, sin git push; rama `feature/bg-video`, 17 commits
locales). En esa URL los videos van POR DEFECTO; `?bgvideo=0` compara contra PNG. En cualquier otro
deploy el flag sigue apagado = prod intacta.**

Iniciativa: reemplazar los fondos del onboarding (hoy PNG estáticos + overlays CSS/SVG) por
**loops de video estilo dibujo animado**. Generados con **Seedance 2.0 vía kie.ai** a partir de
frames de referencia hechos en GPT.

- **Fase 1 (esta):** los 5 fondos + el clip de llegada a la playa. HECHO.
- **Fase 2 (futuro):** personajes apareciendo en las transiciones entre momentos.

---

## 1. Dónde viven los fondos en el código

- **Componente vivo:** [`src/components/onboarding/scenes/AnimatedScene.tsx`](../src/components/onboarding/scenes/AnimatedScene.tsx).
  Hoy: `<img>` PNG (de `public/scenes/`) con parallax + overlays animados (lluvia, olas, rayos, pájaros, nubes).
- **Fases por índice de pregunta** (en `OnboardingFlowV2.tsx`, función `getPhase`):
  | Fase code | Preguntas | Escena de referencia nueva |
  |---|---|---|
  | `port` | Q1-Q2 | Puerto (escena 01) |
  | `open-sea` | Q3-Q4 | Mar Abierto |
  | `storm` | Q5-Q7 | Tormenta (3 cuadros, escalan) |
  | `calm` | Q8-Q10 | Calma |
  | `island` | Q11-Q12 + resultado | La Playa (llegada + loop) |
- El fondo solo se muestra en pantallas `question` / `story` / `child-result`. Los **3 minijuegos**
  (IslasDesconocidas, MiniGame1, LaTormenta) renderizan su propio mundo: **no se tocan** en Fase 1.
- **Código muerto:** `SceneManager.tsx` y `PortScene/OpenSeaScene/StormScene/CalmScene/IslandScene.tsx` NO se usan.

**Nota de contenido:** la escena final se rediseñó de "isla tropical con loros/tripulación"
(`island.png` viejo) a **llegada a una playa al atardecer**. La fase de código se sigue llamando `island`.

---

## 2. Assets producidos (carpeta `Argo Anitamed Game/`)

Todos: **9:16 vertical (720×1280), 5s, H.264, sin audio, ~1.5-5 MB**. El loop se cierra en edición
(CapCut) salvo donde se indica loop nativo.

| Escena | Archivo keeper | Loop | Notas |
|---|---|---|---|
| Puerto toma 1 | `escena 01/01_seedance_v1.mp4` | **nativo** (first==last) | barco atracado, balanceo en el lugar, agua/vela/pájaros |
| Puerto toma 2 | `escena 01/02_v1_more.mp4` | **nativo** (first==last) | POV muelle, más movimiento |
| Mar Abierto | `mar abierto/mar-abierto_v2_smooth.mp4` | edición (crossfade) | first-frame only; olas rodando, barco centrado cabeceando |
| Tormenta 1 | `tormenta/tormenta01_v2_forward.mp4` | edición | forward-fix aplicado; lluvia, relámpagos, olas |
| Tormenta 2 | `tormenta/tormenta02_v1.mp4` | edición | más severa, relámpago grande |
| Tormenta 3 | `tormenta/tormenta03_v2_noZoom.mp4` | edición | clímax; regenerado sin push-in para que loopee |
| Calma | `calma/calma01_v1.mp4` | edición (casi nativo, 1.5%) | atardecer, avance gentil, la más suave |
| Playa (loop) | `la_playa/playa01_loop_v1.mp4` | **nativo** (first==last, 1.02%) | barco encallado quieto, pájaros cruzan, olas en la orilla |
| Playa (llegada) | `la_playa/playa_arrival_v1.mp4` | one-pass, **va ANTES del loop** | barco entra bow-first y encalla; termina en el frame 0 del loop (join 3.8% → crossfade 0.3s) |

**Descartes (borrar):** `tormenta01_v1.mp4` (iba para atrás), `tormenta03_v1.mp4` (tenía zoom),
`mar-abierto_v1_more.mp4` (saltos), `escena 01/02_v1_subtle.mp4` (elegimos "more"),
`la_playa/playa_departure_raw.mp4` (intermedio de la reversión).

**Edición de la playa:** secuencia `[playa_arrival_v1]` → `[playa01_loop_v1]` con crossfade ~0.3s en el corte.

---

## 3. Pipeline kie.ai (cómo se generaron — para reproducir/rehacer)

- `KIE_API_KEY` está en `.env`. Modelo: `bytedance/seedance-2` (image-to-video).
- **Upload:** `POST https://kieai.redpandaai.co/api/file-stream-upload` (Bearer, `-F file=@...`).
  La URL usable está en **`data.downloadUrl`** (NO `data.fileUrl`).
- **Crear:** `POST https://api.kie.ai/api/v1/jobs/createTask`, body
  `{"model":"bytedance/seedance-2","input":{prompt, first_frame_url, [last_frame_url], duration, resolution, aspect_ratio, generate_audio}}`.
- **Estado:** `GET https://api.kie.ai/api/v1/jobs/recordInfo?taskId=` hasta `data.state=="success"`;
  video en `data.resultJson.resultUrls[0]`. ~205 créditos por corrida 5s/720p, ~4-5 min.
- Ajustes usados: `aspect_ratio:"9:16"`, `duration:5`, `resolution:"720p"`, `generate_audio:false`.
- **Loop nativo:** `first_frame_url == last_frame_url` (mismo frame). Solo funciona bien en escenas calmas/estáticas.
- **`last_frame_url` solo NO se soporta** (422). Para la "llegada" que debía terminar en un frame exacto:
  se generó la **partida** (first_frame = frame 0 del loop, barco sale al mar sin girar) y se **reversó**
  con `ffmpeg -vf reverse`.
- Total gastado en la sesión: **~2665 créditos**.

---

## 4. Aprendizajes de prompt (críticos)

1. **Dirección de avance.** Sin instrucción explícita el barco lee "hacia atrás". Hay que decir que
   avanza hacia donde apunta el mascarón (en este arte, la **derecha**), con agua/espuma pasando de
   proa (derecha) a popa (izquierda) y salpicadura en la proa.
2. **Sin zoom / tamaño constante.** En composiciones dramáticas (clímax tormenta) Seedance ignora un
   "no zoom" enterrado y hace push-in (~18-20%), lo que **rompe el loop**. Poner una sección
   `CAMERA & SCALE` arriba: "el barco mantiene EXACTAMENTE el mismo tamaño y distancia".
   Excepción: en una **llegada** el crecimiento es natural y deseable.
3. **Loop según energía de escena:** calmas → `first==last` (nativo). Movidas (mar/tormenta) →
   `first-frame only` + crossfade en edición (si forzás `first==last` con mucho movimiento aparecen
   saltitos periódicos por el "reset" del modelo). Caóticas (tormenta) nunca loopean pixel-perfect
   (~9% en el mejor punto = agua random); lo salva que el barco esté a escala/posición constante,
   así el crossfade mezcla agua-con-agua.

## 5. Verificación (cómo se chequeó cada clip)

- No hay ffmpeg en el PATH ni brew: usar `/Users/marianonoceti/bin/ffmpeg` + `mdls` (dimensiones).
- `python3` (framework, con numpy+PIL) para: drift horizontal (detecta traveling no deseado),
  costura first-vs-last (calidad de loop), zoom (área de píxeles dorados del barco), suavidad
  (diferencia frame-a-frame **separando relámpagos** = ΔLuminancia grande, de saltos reales).
- **`xfade` está roto** en el ffmpeg standalone y en el de CapCut (error -22 "no packets"). El
  cierre de loop se hace en el timeline de CapCut. `reverse` sí funciona.

---

## 6. Plan de mañana (integración al juego)

1. **Duplicar el juego** (branch o copia) para probar sin tocar producción.
2. En `AnimatedScene.tsx`, reemplazar el `<img>` del `ParallaxBg` por
   `<video autoPlay loop muted playsInline poster={png}>` (poster = el PNG actual para pintado instantáneo).
3. **Quitar los overlays redundantes por fase** (lluvia/olas/rayos/pájaros) donde el video ya los trae,
   para evitar doble movimiento y mejorar rendimiento en mobile. Evaluar dejar solo partículas baratas.
4. Colocar los mp4 en `public/scenes/video/` (o similar) y mapear cada fase a su clip.
5. **Preload/lazy-load** del video de la próxima fase; fallback a PNG con `prefers-reduced-motion` o low-data.
6. Probar en **mobile real**: peso, batería, autoplay iOS (muted+playsInline obligatorios), FPS.
7. Decidir para las 3 tormentas: ¿un clip por pregunta (Q5/Q6/Q7 = tormenta 1/2/3) para que escale?
   Encaja con las 3 preguntas de la fase `storm`.

## 7. Decisiones abiertas

- ¿Los loops se cierran pre-renderizados (crossfade en CapCut, entregar mp4 ya "loopeable") o se deja
  que el `<video loop>` corte solo? (para las casi-nativas el corte crudo casi no se nota).
- Nivel de movimiento por escena: aprobado el actual.
- Playa llegada: quedó el acercamiento **suave** (~125px); pendiente si se quiere una versión "desde más lejos".
- Los frames de referencia son cuadrados/2:3; se generó 9:16 y Seedance recompuso bien (extiende cielo/primer plano).

---

## 8. As-built de la integración (rama `feature/bg-video`, 2026-07-16)

Primer paso de integración, **todo detrás de un flag apagado por defecto** (prod/develop sin cambios):

- **`AnimatedScene.tsx`**: mapa `SCENE_VIDEOS` (las 5 fases cableadas: port ×2, open-sea, storm ×3,
  calm, island) + helper `videoBackgroundsEnabled()`. El flag `?bgvideo=1` (persistido en
  `sessionStorage`; `?bgvideo=0` lo limpia) hace que `ParallaxBg` renderice
  `<video autoPlay loop muted playsInline poster={png}>` en vez del `<img>`, con el PNG como
  fallback y **saltando el overlay** de esa fase (el video ya trae el movimiento). Sin flag: PNG idéntico a hoy.
- **Assets servidos**: `public/scenes/video/{port,port-2,open-sea,storm,storm-2,storm-3,calm,island}.mp4` (~20 MB).
  Los masters siguen en `Argo Anitamed Game/` (gitignoreada).
- **Link de preview directo (sin registro):** ruta **`/preview/escenas`** (`src/pages/ScenePreview.tsx`,
  no linkeada, solo fondos). Botones para cambiar de escena + toggle Video/PNG. Deep-link con `?s=<índice>`.
  Verificado headless: cada escena monta su `<video>` correcto, reproduce, 720×1280, 0 errores de consola.
- **Cobertura:** `develop` intacto; volver = `git checkout develop`. Nada pusheado.
- **Loop en runtime:** las nativas (puerto, playa) cierran solas con `<video loop>`; las movidas
  (mar/tormenta/calma) cortan en el loop (costura) hasta que se pre-cierren en edición o se acepte el corte.
- **Pendiente de rollout real:** decidir cómo se enciende para usuarios (flip del default por fase),
  optimización de peso/carga en mobile, y el cierre de loops de las escenas movidas.

**Preview enriquecido (2026-07-16):** `/preview/escenas` muestra el **juego completo**: fondo (video)
+ **UI real de preguntas** (`QuestionScreenV2`, alineada al marco con un `transform` que contiene su
`fixed`) + **audio real** (tema de fondo `argo_background.mp3` + efectos por fase `effects_01/02/03`,
sincronizados) + switcher **ES/EN/PT** + toggles Preguntas/Sonido/Video. La fase `island` usa
`SCENE_INTRO_VIDEOS`: reproduce la **llegada** (`island-intro.mp4`) una vez y encadena al **loop**
(`island.mp4`) — verificado headless (a los 3s corre el intro, a los 7s el loop).
El audio del juego real NO se toca (los videos son `muted`); queda sincronizado solo porque el mismo
`screenIndex` maneja fase, video y audio.

**Reencuadre del video (fix "las preguntas tapan el barco"):** los clips tienen la nave centrada
vertical, así que la tarjeta de preguntas (mitad inferior) le tapaba la mitad de abajo. Solución CSS
**sin re-generar**: `DEFAULT_VIDEO_REFRAME` / `SCENE_VIDEO_REFRAME` aplican `transform: translateY(-14%)
scale(1.26)` **solo al `<video>`** (el PNG / prod queda intacto), subiendo la nave a la franja despejada
de arriba. Verificado en las 6 escenas: nave completa sobre las preguntas, sin borde negro. Tunable por fase:
**Mar Abierto y Calma** usan `translateY(-22%) scale(1.42)` (naves más chicas/bajas en el arte).
Complemento: se **compactó** el enunciado (`text-3xl`→`text-2xl`) y los botones de respuesta
(`p-3`→`p-2.5`, badge `h-10`→`h-9`, label `15px`→`text-sm`) en `QuestionScreenV2` — OJO: esto afecta el
juego real, **todas las preguntas** (no solo con video), no es video-only.

**Refinamiento de loops por escena (2026-07-16, tras revisión visual del owner):**
- **Tormenta (v4, + rayo gigante):** en cada salto de loop, además del doble flash, cae un **rayo
  gigante de pantalla completa** (`public/scenes/video/bolt.png`, overlay `mix-blend-mode: screen`):
  extraído del propio arte (`tormenta02.png` luminance-key filtrado a tonos fríos + componentes que
  cuelgan del cielo, escalado a ~115% de pantalla, re-glow violeta, + telaraña de `tormenta03.png`
  tenue arriba). El rayo aparece a opacidad 1 en el golpe (decae 150ms más lento que el velo blanco,
  como afterimage) y el eco re-ilumina el mismo canal a 0.5 (return stroke). Cero créditos gastados.
- **Tormenta (v5, rayos extra sincronizados):** escaneo de discontinuidades DENTRO del segmento de
  loop → los picos son los relámpagos horneados del propio clip entrando de golpe. `VIDEO_EXTRA_STRIKES`
  dispara nuestro rayo gigante JUSTO sobre esas subidas (single burst 0.85 bolt / 0.6 velo, sin eco):
  storm-2 en t=3.58s; storm-3 (la que más acepta) en t=1.50s y t=2.58s. Guard anti-colisión: si un
  strike programado cae donde aterrizaría el eco de la costura (~in+1.2s), el eco se suprime (en
  storm-3 quedaban a 130ms). Cadencia verificada: separación mínima entre destellos 1.08s (storm-3:
  3 rayos/loop; storm-2: 2+eco; storm-1: costura+eco).
- **Tormenta (v3, salto + crossfade + doble flash espaciado):** flash DOBLE (golpe 0.85→0 en 450ms +
  eco 0.55→0 en 250ms **1.2s después** — el owner pidió más aire entre ambos; `SCENE_LOOP_FLASH`), y el
  **crossfade convive con el salto**: la copia B trabaja sobre el segmento efectivo `[in, out]`
  (offset de medio segmento, wrap propio en `out`→`in`, resync mientras está oculta), el loop ya NO envuelve a frame 0 (el salto máximo): busca offline el **par de
  cuadros más parecidos estructuralmente** (métrica ciega a lluvia/relámpagos: downscale+blur+
  normalización de brillo, con peso en la franja del barco) y salta de `out`→`in` con el flash encima
  (`VIDEO_LOOP_JUMPS`, **v2 fase-del-barco**): el owner notó que el barco salía "arriba" y entraba
  "abajo" → se re-buscaron los pares rastreando por cuadro la posición x/y del barco Y su velocidad
  (fase del cabeceo): storm 4.542→1.542s, storm-2 4.958→0.750s (el viejo saltaba ~19px verticales con
  dirección invertida; el nuevo Δy=-0.1px misma dirección), storm-3 4.625→0.167s (Δy≈0). Verificado con
  overlays rojo/cian (salida vs entrada): el barco queda alineado; las olas no coinciden nunca (caos)
  y eso lo tapan crossfade+flash.
- **Calma (v3, anclada):** el clip original avanzaba +13px; un regen `first=last` salió peor (-25px
  hacia atrás) y el boomerang intermedio no convenció al owner. Ganó el **re-regen anclado** (2
  variantes en paralelo con prompt endurecido "ship pinned like a building" + first==last): la
  variante A quedó **inmóvil de verdad** (drift neto +0.2px, rango 0.9px, seam 1.23%). Master:
  `Argo Anitamed Game/calma/calma03a_anchored.mp4` → servido como `calm.mp4` (5s) **con crossfade**.
  Descartes: `calma02_inplace_loop.mp4` (-25px), `calma_boomerang.mp4` (superado), `calma03b` (drift -2px).
- **Crossfade por defecto en casi todo:** el ojo del owner nota costuras ~1.3%, así que solo `island`
  queda como loop nativo de un decoder (seam 0.65% + handoff del intro); puerto, mar, calma y las 3
  tormentas usan el doble decoder.
- **Playa:** el flashazo entre llegada y loop era el POSTER (el island.png viejo, arte tropical
  distinto) mostrado mientras el loop montaba y decodificaba. Fix: el loop se monta **precargado y
  pausado debajo del intro** (`active=false`) y arranca de su frame 0 ya decodificado al terminar la
  llegada. Verificado: handoff max diff 3.99%, sin frames >8%.
- **Un solo decoder donde el loop es nativo** (`SCENE_NATIVE_LOOP`: port, calm, island) — sin copia B
  ni rAF; el crossfade doble queda solo en open-sea y storm. Menos carga en mobile.
- Medición de origen (frame a frame de los 8 clips): el movimiento es 24fps real (sin judder 12fps);
  seams crudos: calmas <2%, mar 8%, storm 6.7-10.9%; en la salida compuesta el wrap NO genera pico
  extra vs el movimiento propio del clip.

**Crossfade de loop (HECHO 2026-07-16):** `CrossfadeLoopVideo` monta **dos decodificadores** del mismo
clip desfasados **medio loop**; cerca del corte de A se funde la copia B (que está a mitad de clip,
suave), con **plateau** para tapar el 100% de la costura. Endurecido tras **revisión adversarial** (7
hallazgos confirmados): poster PNG en AMBAS copias, B solo aparece cuando tiene frame real
(`readyState>=2`) y A ya pasó por el medio (no tapa el arranque ni muestra capa negra — era el bug HIGH),
degradación a loop simple si B no puede reproducir, y el intro de la playa tiene fallback
`onError`+timeout (no se traba nunca). Verificado headless: B=0 en el arranque, opacidad **1.00 exacta**
en la costura, 0 en el medio, sin ghosting. **Limitación a probar en device:** son 2 decoders
simultáneos; en iPhones viejos/con throttling el límite de videos concurrentes podría pausar uno (el
código degrada a loop simple). Testear en mobile real (está en los pendientes de rollout).
