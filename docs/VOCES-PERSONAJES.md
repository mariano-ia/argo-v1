# Voces de personajes — Casting oficial (decidido 2026-07-16)

Principio: **el video se genera mudo y es universal; la voz va por pista separada** con voz fija
por personaje. Cambiar de idioma = regenerar solo la pista de VO con la MISMA voz.

## Casting decidido por el owner

| Personaje | Motor | Voz | Post | Nota |
|---|---|---|---|---|
| **Narrador** | OpenAI `gpt-audio-1.5` (chat completions, modalities audio) | **ash** | **atempo 1.20x** (ffmpeg, preserva pitch) | Toma "actuada" con dirección de escena. El owner: "a 1.20 es LA voz del narrador" |
| **Jasón** | OpenAI `gpt-4o-mini-tts` | **verse** | ninguno | La lectura simple de la tanda 1 le ganó a la actuada |

## Recetas exactas (reproducibilidad multi-idioma)

### Narrador (gpt-audio-1.5 + ash)
- Endpoint: `POST /v1/chat/completions` con `modalities:["text","audio"]`, `audio:{voice:"ash",format:"mp3"}`.
- **System prompt** (la dirección; traducir el arco cuando cambie el guión):
  > Eres la VOZ de un narrador de tráiler de película épica de aventuras para niños. Español latinoamericano neutro, sin voseo. Registro grave, cálido, íntimo, con pausas largas entre frases, respiraciones sutiles y final luminoso. Tempo pausado. REGLA ABSOLUTA: tu salida de audio contiene ÚNICA y EXCLUSIVAMENTE las palabras del texto del usuario, dichas tal cual. PROHIBIDO decir en voz alta indicaciones de actuación, descripciones de tono, acotaciones o cualquier palabra extra. No anuncies lo que haces. Solo actúa el texto con la voz.
- User message = SOLO el texto de la línea.
- Post: `ffmpeg -filter:a "atempo=1.2"`.
- **GOTCHA crítico:** sin la "REGLA ABSOLUTA", el modelo actor DICE las acotaciones en voz alta
  ("con un susurro asombrado, cuenta la leyenda…"). SIEMPRE verificar cada toma transcribiendo con
  whisper-1 y comparando palabra a palabra contra el guión (normalizar tildes; tolerar fonética
  tipo "Jasón→Hasson"). Si aparece "pausa" u otra acotación hablada → regenerar agregando
  "no digas la palabra pausa; las pausas se HACEN en silencio, no se nombran".

### Jasón (gpt-4o-mini-tts + verse)
- Endpoint: `POST /v1/audio/speech`, `{"model":"gpt-4o-mini-tts","voice":"verse","response_format":"mp3"}`.
- **Instructions:** "Capitán joven, carismático y cercano, hablando a un niño. Español latinoamericano neutro. Enérgico pero cálido, invitador."

### Para otros idiomas
Mismos modelos y voces; traducir la línea y la dirección (registro/arco) al idioma objetivo, mantener
"español latinoamericano neutro" → "American English" / "português brasileiro" según corresponda.
La identidad de voz (ash/verse) es la misma en todos los idiomas.

## Multi-idioma pendiente
- [ ] Narrador en inglés y portugués (misma receta ash@1.2x)
- [ ] Jasón en inglés y portugués (verse)
- [ ] Comparativa ElevenLabs (endpoint `elevenlabs/text-to-speech-multilingual-v2` en kie.ai caído el
      2026-07-16 con "internal error" en todo intento; reintentarlo — candidatos anotados: Brian,
      Hank, Arabella narrador / Jamahal, Finn Jasón). La página de casting con todos los demos:
      artifact "Casting de voces — Argo" (claude.ai/code/artifact/9486bedb-9695-449f-8039-7d1c9fecb515).

## Assets producidos (en `Argo Anitamed Game/intro/`)
- `vo_narrador_ash_es_1.2x.mp3` — VO oficial español (14.6s)
- `vo_jason_verse_es.mp3` — línea de bienvenida de Jasón (8.9s)
- **`intro_completa_es_v2.mp4` — CORTE VIGENTE (20.2s)**: línea dorada 5s + descenso v2 5s + vela 5s +
  giro v3 5s, VO a +1.2s + cama de mar (`effects_02` al 12%, fades). Giro v3 aprobado por el owner.
- Clips: `introA_linea_dorada.mp4` (perfecta a la 1ra), `introB_descenso_v2.mp4` (tripulación quieta,
  sin morphing), `introB2_vela.mp4` (first=last=sb3, empalma exacto con el giro), `introC_giro_v3.mp4`
  (extremos con encuadre idéntico → cámara clavada 0px drift). Descartes: `introB_descenso.mp4` (proa
  deformada al caminar Jasón), `introC_giro.mp4` y `introC_giro_v2.mp4` (traveling/cuerpo girando),
  `intro_completa_muda.mp4`/`intro_completa_es_v1.mp4` (corte viejo).
- Storyboard: `sb1_linea_dorada.png`, `sb2_vista_aerea_tripulacion.png` (5 tripulantes),
  `sb3_jason_proa.png`, **`sb4_giro_fixed.png`** (variante de encuadre idéntico; el `sb4_giro_cabeza.png`
  original queda como arte suelto) — gpt-image-2, refs = character sheets + arte del barco.

## Lecciones de generación (video con personajes)
1. **Los frames extremos deben ser consistentes con la instrucción de cámara.** Si first/last tienen
   encuadres distintos y pedís "cámara fija", el modelo deforma al personaje o hace traveling. Para un
   gesto (giro de cabeza), generar el last frame como EDICIÓN del first ("cambiá SOLO la cabeza",
   gpt-image-2) y recién ahí animar.
2. **Nadie camina durante un movimiento de cámara.** Personaje que se traslada + cámara que baja =
   morphing (proa deformada). Separar: la cámara se mueve con tripulación quieta; el gesto ocurre con
   cámara quieta. Los cortes de edición son lenguaje de cine, no un fallback.
3. **Seedance 2.5 en kie.ai (`bytedance/seedance-2-5`): el route existe pero el backend no está
   operativo** (2026-07-16: error interno 500 hasta en el request mínimo, 0 créditos). El owner decidió
   NO reintentarlo: el corte v2 con Seedance 2.0 quedó aprobado como final. (Si algún día se quiere la
   toma única continua, la receta está arriba.)

## ESTADO FINAL (2026-07-16, cierre)
**`intro_completa_es_v2.mp4` APROBADA por el owner como versión final de la intro en español.**
Siguiente sesión: (a) VO en inglés y portugués (misma receta/voces) + mezcla por idioma;
(b) decidir dónde vive la intro dentro del juego (¿pre-idioma? ¿device-handoff?);
(c) opcional: comparativa ElevenLabs cuando kie.ai lo repare; (d) limpiar descartes de
`Argo Anitamed Game/intro/` (los marcados arriba).
