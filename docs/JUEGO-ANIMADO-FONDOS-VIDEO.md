# Juego Animado — Fondos en Video (Fase 1)

**Estado: assets 100% generados y aprobados (2026-07-15). Integración al código PENDIENTE (mañana).**

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
