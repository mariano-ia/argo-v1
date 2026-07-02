# ArgoCoach: roadmap de mejoras (análisis 2026-07-02)

> Síntesis del análisis multi-perspectiva (7 analistas: producto/UX, prompt/AI,
> contexto/retrieval, seguridad/calidad, costo/latencia, negocio/retención,
> workflow del entrenador) corrido tras el ship del modo consultivo
> (`docs/ARGOCOACH-MODO-CONSULTIVO.md`). Impacto/esfuerzo según los analistas,
> deduplicado. Nada de esto está construido salvo que se indique.

## Decisiones del owner (2026-07-02)

Quick wins: **aprobados para implementar: 2, 3, 5, 6, 7, 8, 9, 10** (el 9 con
la condición de no perder eficacia ni seguridad). **Descartados: 1 y 4** (la
prueba gratis no se está usando hoy). Sobre el 8: la visión es memoria
persistente por niño (que el asistente "ya conozca al niño" cuando el
entrenador vuelve); se viene una feature de notas sobre el niño que debe
alimentar esa misma memoria; encarar por etapas. Sobre el 10: se aprueba
además el like/dislike del usuario sobre cada respuesta (item 18).

Apuestas de producto: **aprobados: 11 (en fila, "muy importante"), 12, 13, 17,
18**. **Descartado: 14** (postura del owner: no leer los mensajes de los
clientes ni meterse ahí; no habrá detección server-side ni registro auditable
de señales de derivación. La regla 12 del prompt sigue vigente: el modelo
sigue manejando esos casos con calidez, pero sin detección ni log nuestro).
**15 aprobado en concepto**: desarrollar una propuesta detallada del digest
semanal antes de construir. **16 se agranda**: no solo arreglar el chat en
mobile; pensar una versión exclusiva mobile de TODA la herramienta, quizás
reducida (workstream de diseño nuevo, pendiente de exploración).

Estructural: **aprobados: 20 ("muy importante"), 21, 22, 23** (el 23 recién
después de tener el seguimiento de telemetría/costos funcionando, como A/B).
**Diferidos: 19 (streaming) y 24 (thinking budget)**, para más adelante.
Higiene menor: va como batch de mantenimiento junto a los quick wins.

## 1. Quick wins (alto impacto, esfuerzo chico)

1. **Trial cap por consulta, no por mensaje.** El cap de 10 cuenta cada mensaje
   del usuario; el modo consultivo gasta un turno en preguntas, así que una
   consulta vaga ahora cuesta 2 mensajes y el trial rinde 4-5 consultas reales.
   Contar `DISTINCT thread_id` (10 consultas) o no contar el mensaje que
   responde a la indagación del primer turno. Espejar en el contador 0/10 de
   `TenantChat.tsx`. Es la interacción más urgente entre el cambio nuevo y el
   funnel de conversión.
2. **Entry points `?q=` desde jugadores y grupos.** El deep link `?q=` con
   auto-send ya funciona (`TenantChat.tsx:136-145`) pero solo lo usa el widget
   de TenantHome. Botón "Consultar al asistente" en la ficha de cada jugador,
   plantel y grupo de química: dispara el matcher con el nombre exacto y la
   inyección de perfil completa. Convierte reporte y química (los dos
   artefactos de más valor) en sesiones recurrentes de chat.
3. **Prompts sugeridos personalizados.** `SUGGESTED_PROMPTS` son 3 preguntas
   genéricas estáticas; el entrenador nunca descubre que el asistente conoce a
   sus jugadores por nombre. Devolver 2-3 nombres reales en el GET
   `action=threads` y armar "¿Cómo motivo a {nombre}?". Además los ejemplos de
   TenantHome son divs inertes con nombres falsos hardcodeados ("Mateo y
   Allegra") y uno viola el marco de actividad ("no quiere entrenar"):
   hacerlos clickeables y reales.
4. **CTA de upgrade en el lockout del trial.** Al agotar las 10 consultas solo
   se muestra un candado sin botón. Es la señal de compra más fuerte del
   producto y hoy es un callejón sin salida. Botón "Ver planes" + email
   one-time "usaste tus 10 consultas" en `trial-lifecycle-cron.ts`.
5. **Prompt pt: falta la tabla de 12 arquetipos.** El prompt pt colapsa la
   enumeración a una línea ("12 arquétipos = 4 eixos × 3 motores"), así que en
   pt el modelo no tiene nombres canónicos para anclar y puede inventar
   etiquetas que `FORBIDDEN_OLD_LABELS` no atrapa. Drift real detectado; anexar
   la tabla y de paso ampliar few-shots (no hay ejemplo I ni C, ni de grupo,
   ni que use un placeholder `{{Pn}}`).
6. **Prohibited words con word-boundary.** El scan usa `includes()`: "weak"
   dispara en "tweak", "vago" en "divagó". Cada falso positivo cuesta una
   regeneración completa y puede degradar a `SAFE_FALLBACK` una respuesta
   correcta. `wordBoundaryTest` ya existe en el archivo; aplicarlo a las
   entradas de una sola palabra.
7. **`getCostUsd` model-aware.** Hardcodea precios de Flash; Enterprise corre
   Pro (~8-16x más caro) y el fallback es gpt-4o-mini, así que `ai_events.cost_usd`
   subreporta. Tabla de precios por provider+modelo y capturar
   `cachedContentTokenCount` (hoy se descarta) para ver si el caching implícito
   de Gemini está funcionando sobre el system prompt (~8.5k chars estáticos).
8. **Historial de perfilamientos al mencionar un jugador.** Una línea tipo
   "Historial: 2025-11 Sostenedor Sereno → 2026-05 Sostenedor Dinámico
   (2 perfilamientos)" en JUGADOR MENCIONADO. Sirve directo a la situación
   "cambio-repentino" y al modo consultivo (¿el patrón es estable o recién
   cambió?). El índice parcial ya existe; costo: una query + una línea.
9. **Paralelizar los gates pre-AI.** `increment_ai_queries`, plan select,
   conteo de trial y rate-limit corren en serie (~200-400ms de p50
   regalados). Un `Promise.all` como el que ya existe para sesiones/grupos.
10. **Telemetría del modo consultivo.** `ai_events` no registra si el modelo
    indagó o recetó. Instruir una etiqueta inicial `[[modo:consultivo|directo]]`,
    strippearla antes de guardar/mostrar y loguearla en una columna nueva.
    Sin esto, la feature no es medible ni regresionable.

## 2. Apuestas de producto (esfuerzo medio)

11. **Memoria por niño (la apuesta que más potencia el modo consultivo).**
    Tres piezas incrementales:
    a. *Recap cross-thread:* al mencionar un niño, inyectar un resumen
       extractivo de consultas pasadas del mismo miembro sobre ese niño
       (fechas + primeros ~80 chars, pasado por `anonymize()`). Hoy los hilos
       están aislados y el consultor re-pregunta contexto que el entrenador ya
       dio hace un mes, lo que el modo consultivo hace más visible.
    b. *Log de observaciones:* tabla `child_notes` + "Registrar observación"
       one-tap en la ficha del jugador; últimas 3-5 notas inyectadas en
       JUGADOR MENCIONADO. Convierte el registro post-sesión en contexto
       acumulativo.
    c. *Cerrar el loop:* persistir la última guía dada por niño (resumen +
       situación + fecha) e inyectarla en el próximo hilo con una regla de
       abrir preguntando cómo fue. Es la continuación natural del modo
       consultivo, que hoy solo gobierna el primer turno de cada hilo.
12. **Eval cases del modo consultivo (multi-turno).** `ai-eval.ts` tiene 3
    casos single-shot y nunca pasa `thread_id` (todo es primer turno ahora).
    Tres casos: vago → contiene 2-3 preguntas Y contenido sustantivo;
    específico → sin interrogatorio; segundo turno con contexto → guía sin
    re-preguntar. Heurísticas baratas (conteo de "?", verbos de consejo).
13. **Sincronizar las 22 situaciones, por idioma.** El chat inlinea solo 12 y
    las tarjetas son solo en español (a un coach en/pt se le inyecta guía en
    español). La guía canónica tiene 22 desde junio y el chat nunca se
    actualizó (drift silencioso). Script build-time desde
    `src/lib/situationalGuide*.ts` (patrón `scripts/brandify-*.mjs`) + check CI.
14. **Capa determinística de señales de derivación.** La regla 12 (autolesión,
    abuso) vive solo en el prompt: nada detecta esas señales en el mensaje,
    verifica que el modelo derivó, ni deja registro auditable. Scan trilingüe
    input-side + directiva reforzada en extraContext + flag `referral_signal`
    en `ai_events`. Hoy una regresión de Flash en la regla 12 sería invisible.
15. **Digest semanal por email con CTA al chat.** Convierte el consultor de
    pull a push: un insight del plantel por semana ("tu plantel es 60%
    Sostenedor; esta semana observa las esperas largas") + deep link `?q=`.
    Los building blocks existen (patrón cron+Resend probado, stats builders en
    tenant-chat; inlinear en el cron nuevo por la regla no-imports).
16. **Mobile-first del chat.** `TenantChat.tsx` no tiene ni un breakpoint: la
    sidebar fija de 280px deja ~100px de columna en un teléfono, y el
    contenedor pelea con el teclado de iOS. El usuario definicional está al
    borde de la cancha con el teléfono. Drawer overlay en pantallas chicas,
    `panelOpen` default false en mobile, unidades `dvh`.
17. **Gestión de hilos.** Cap duro de 20, sin borrar/renombrar/buscar; los
    títulos son el primer mensaje truncado. Mínimo: soft-delete + auto-título
    con el jugador/grupo matcheado ("Sobre Mateo · se frustra al perder").
    Convierte la sidebar en archivo de insights por jugador.
18. **Feedback thumbs up/down** en mensajes del asistente (columna `rating` +
    branch `action=rate`). Única forma de saber si el turno consultivo se
    siente útil o molesto antes de iterar el prompt.

## 3. Estructural (esfuerzo grande o requiere medición previa)

19. **Streaming SSE.** Hoy el coach mira dots hasta 55s; el modo consultivo
    alarga la primera respuesta justo en la primera impresión.
    `streamGenerateContent` + rehidratación incremental con buffer de cola;
    los guardrails post-generación quedan como cancel-and-replace (raro según
    `prohibited_hit`). Es el cambio de percepción de latencia más grande
    disponible; grande porque toca filtros y fallback OpenAI.
20. **Fuente única para los 3 prompts.** ~200 líneas triplicadas a mano ya
    driftearon (pt sin tabla de arquetipos, en sin el ejemplo del Sostenedor).
    Fuente estructurada + script generador (patrón brandify) + assert CI de
    paridad de secciones. Convierte el drift en build failure.
21. **Matcher semántico de situaciones.** El keyword matching es
    mayormente-español y frágil a paráfrasis ("últimamente lo veo apagado" no
    inyecta nada). Primero loguear `situation_matched` en `ai_events` para
    medir el hit-rate real; después decidir entre pre-call barato de
    clasificación o embeddings build-time de las 22 situaciones.
22. **LLM-judge de calidad de consejo.** Todo lo medido hoy es negativo
    (violaciones); una regresión a respuestas blandas y genéricas daría verde
    en todos lados. Rúbrica: anclado al perfil inyectado, accionable para el
    adulto, cumplimiento del modo consultivo, tono validante.
23. **A/B gemini-2.5-flash-lite** para planes no-enterprise (3-4x más barato,
    menor TTFT). El harness de medición ya existe en `ai_events`; solo si
    `prohibited_hit`/`groundtruth_violation` se mantienen planos.
24. **thinkingBudget ~256-512 solo en primer turno consultivo** (hoy Flash
    corre con 0): el juicio "¿el contexto alcanza? ¿qué 2-3 preguntas
    discriminan para este perfil?" es exactamente el tipo de tarea que se
    beneficia. Medible vía `latency_ms` + flags; requiere el fix de
    `getCostUsd` primero.

## 4. Higiene menor detectada de paso

- Retry de palabras prohibidas: re-envía TODO el contexto (duplica costo de
  input) y su `maxTokens=800` vs 2000 del original puede truncar un rewrite
  largo; enviar solo la instrucción de reescritura + texto marcado, cap igual
  al original. El mensaje de corrección además está hardcodeado en español
  (puede voltear el idioma de un hilo en/pt).
- Ground truth solo valida al único jugador mencionado; con varios
  placeholders en la respuesta, un eje equivocado del segundo niño pasa sin
  chequeo. Escanear qué `{{Pn}}` aparecen y validar cada uno.
- Lista de prohibited words drifteada respecto del scorer de QA
  (`scoring.mjs` tiene términos que el runtime no y viceversa: "enfermedad",
  "ansiedad", "depresión" pasan el filtro runtime hoy). Unificar + test de
  subset.
- `ai_sections` del jugador mencionado se trunca a ~700 chars y omite
  `motorDesc`/`ecos`; subir caps a ~500-600 por sección y sumar esas dos
  (ecos = cómo se ve el patrón en el día a día, justo el ancla de las
  preguntas consultivas).
- Roster para el prompt: lista pelada de `{{Pn}}` sin eje/motor, así que "¿
  cuáles de mis jugadores son Estrategas?" es incontestable aunque los datos
  ya están fetcheados. Anotar `{{P1}}:C/Sereno,12a` y capear en rosters
  enterprise.
- Escrituras post-AI en serie en el critical path (~100-250ms): `Promise.all`
  o responder primero y flushear con `waitUntil`.

## Recomendación de secuencia

Si hay que elegir: **(1) y (4)** protegen la conversión del trial ante el modo
consultivo recién shippeado (urgente y barato); **(2) + (3)** son la activación
más barata del valor diferencial ya construido; **(11)** es la apuesta de
producto que convierte a ArgoCoach de FAQ con contexto en un asistente que
acompaña procesos, que es la promesa implícita del modo consultivo. El batch de
higiene (5, 6, 7, 10) puede ir junto en un solo PR de mantenimiento.
