# Ola v3 de preguntas — Propuesta para aprobación del owner

> **ESTADO 2026-07-15 — APLICADO AL CÓDIGO (sin push).** El set final del owner (PDF `docs/ARGO-PREGUNTAS-V3-NINOS.pdf`) quedó aplicado a la banca viva `src/lib/onboardingDataI18n.ts` (es/en/pt) y a la banca admin `src/lib/onboardingData.ts` (es). Q5 fue **reescrita por el owner** superando la del PDF ("la tormenta se acerca", fix de situación fuerte; ver `METODO-OLA-V3-COPY-NINOS.md` §Q5). `INSTRUMENT_VERSION` bumpeado a `v3-items-20260715` para no mezclar wordings. Los monitores de esta sección ya no son teóricos: viven en el cron `api/item-quality-cron.ts` (cada 200 jugadas reales del instrumento vivo computa entropía/share por eje/piso de eje/sesgo posicional, guarda snapshot en `item_quality_snapshots` y alerta al owner por Telegram+email; `?force=1` corre el análisis on-demand). Pendiente: revisión nativa de las traducciones en/pt (hechas en esta pasada) y regenerar el PDF (su Q5 quedó vieja). NO pusheado.
>
> Fecha: 2026-07-08. Estado original: **PROPUESTA, nada aplicado**. Origen: panel de expertos (`METODO-REVISION-EXPERTOS-JUEGO-20260708.md`; IDs refieren al anexo).
> Regla de ejecución acordada: **una sola ola versionada** (`question_version: v3-...`), con re-mapeo de contextos y pasada final de rúbrica sobre el set completo, para no resetear el reloj de normas dos veces (M8) ni fabricar imanes nuevos (riesgo R4 del crítico).
> Ya ejecutado por separado (no es parte de esta aprobación): shuffle + telemetría + versionado + desempates grupales apagados (commit `b501e33`).

## Cómo leer cada ficha
- **Diagnóstico**: qué falla y con qué dato.
- **Propuesta**: texto nuevo es (en/pt reciben la misma cirugía; se traducen al aprobar).
- **Fuente**: hallazgo(s) del panel que la sostienen. Donde los expertos chocaron, se indica qué receta gané y por qué.
- **Tier A** = lista para aplicar con tu OK. **Tier B** = requiere piloto o decisión extra (afecto competitivo, escena nueva).

Criterios de redacción aplicados a TODAS las opciones (rúbrica final):
1. Ninguna opción es la única que resuelve el problema del stem (anti guion, h3).
2. Las 4 opciones: misma valencia, concreción, calidez y elogiabilidad ante el DT (4.6 + PD-04).
3. Cada opción codifica cuadrante completo (ritmo × orientación), no velocidad o afiliación solas (h4).
4. Léxico al piso de 8 años, sin metacognición en el stem (PD-03).
5. Las S llevan su "para qué" en ≤9 palabras (H2 redacción); las C sin palabras de falla.
6. Plantillas: Q6 (escena ambigua) y Q12 (cuatro lecturas del mismo momento).

---

## TIER A (aplicar con tu OK, todas juntas como v3)

### A1. Q5 "El Momento del Caos" — el imán probado del set
**Diagnóstico:** D "Me muevo rápido a ayudar" = 50% ganando DESDE la posición castigada (z=-5.3): imán de contenido puro, el más fuerte del set vivo (+30pp sobre base). Contamina además el contexto adversidad (la señal de contingencia sale "D" para media cohorte). Fuente: H1 redacción, PD2, ECD-03, h3.
**Arbitraje:** había 4 recetas (reescritura in-place / dilema capitán-compañero / reemplazo por desacuerdo entre pares / recast de C). Gana la **in-place** (H1 redacción): conserva escena y mapa de contextos, riesgo mínimo, ataca el mecanismo (el monopolio de "ayudar"). El desacuerdo entre pares (h5) queda como candidato Tier B.
**Propuesta:**
- Stem: "¡La tormenta nos atrapa! **¿Qué te sale hacer?**" (elicitación disposicional, la de Q6)
- [D] "Reacciono rápido a lo que el barco necesite"
- [S] "Sigo firme con mi tarea hasta que pase"
- [C] "Hago una pausa corta y ordeno qué va primero"
- [I] "Les recuerdo a todos que estamos juntos en esto"
(en: "I move fast to help out" pierde el "help"; pt ídem "ajudar")

### A2. Q1 "El Despegue" — el niño aplicado en el peor lugar (ítem 1)
**Diagnóstico:** C 52% (+22pp sobre pos1). "¿Qué haces primero?" activa el guion de secuencia correcta (primero se revisa) en el momento de máxima deseabilidad; "¡Salto al barco ya!" marca a D como imprudente. Fuente: H3 redacción, h3, PD-04.
**Propuesta:**
- Stem: "¡Es hora de zarpar! **¿Qué te nace hacer?**"
- [C] "Reviso los cabos y miro el mapa" (análisis concreto, no obediencia)
- [D] "Salto a bordo y tomo mi remo" (sin el "ya!")
- [S] "Me instalo con calma" (queda)
- [I] "Busco a mis amigos para sentarnos juntos" (propósito restituido)

### A3. Q7 "El Nudo Rebelde" — I castigada por costo social + léxico de falla
**Diagnóstico:** D 48% (+15pp). "Pido ayuda a un compañero" es admisión de necesidad (costo de imagen máximo en 12-16, el 74% de la cohorte); "Veo qué parte falló" es el único léxico de falla del set es; "con más fuerza" se repite en Q7-Q8 consecutivas (un solo rasgo vota D dos veces). Fuente: H4 redacción.
**Propuesta (in-place; la versión "visto por todos" de PD1 queda Tier B):**
- [D] "Lo vuelvo a armar de una"
- [C] "Busco qué parte se aflojó"
- [I] "Llamo a un compañero y lo armamos juntos" (iniciador, no rescatado)
- [S] "Respiro y lo intento de nuevo" (queda)

### A4. Q8 "El Empuje" (v2 de hoy → v3) — sacarle el acertijo al stem
**Diagnóstico (predicción registrada del panel sobre MI reescritura de hoy):** "y el barco se frena" declara un problema físico que solo D/C resuelven; la D dobla acción (fuerza + mando = dos imanes en un tap); pt "perde o ritmo" no plantea el mismo problema que es "se frena"; la S corta volvió a perder su "para qué". Fuente: PD-05, H6 redacción, H7 anti-tipologías, PD5 deportivo (4 expertos independientes predijeron lo mismo).
**Propuesta:**
- Stem: "El equipo está cansado y cuesta seguir remando. **¿Qué te sale hacer?**" (es/en/pt alineados)
- [D] "Remo más fuerte para que el barco agarre impulso" (UNA conducta)
- [C] "Busco cómo remar mejor para que el barco avance" (léxico piso 8 años, PD-03)
- [S] "Sostengo mi remada pareja para que se apoyen en mí" (función restituida)
- [I] "Suelto una broma para que volvamos con ganas"
(estructura paralela: acción + beneficio en las 4)

### A5. Q10 "El Apoyo" (v2 de hoy → v3) — devolverle la emoción al stem
**Diagnóstico:** el stem corto es un problema puramente físico cuyo único cierre causal es la D ("le alcanzo el remo"); la versión larga SÍ tiene la pista emocional ("se ve un poco frustrado") que hace pertinentes a las 4. Fuente: H5 redacción, PD-05, H7.
**Propuesta:** stem: "A un compañero se le cae el remo **y se desanima**. ¿Qué haces?" (en: "...and looks discouraged"; pt: "...e desanima"). Las 4 opciones de hoy quedan igual.

### A6. Q9 "La Espera" → "El Tramo de Otros" (suplencia)
**Diagnóstico:** el ítem más muerto del set (acuerdo 36%, RT 7.5s el más rápido): "Recupero energía" es la única opción que obedece al stem ("te toca descansar") y mide activación, justo el constructo que v4 sacó del nombre. Fuente: PSI-06, h7, PD1/PD6; el careo T2 convergió en re-situarla a suplencia (la primera escena social-evaluativa, sin crecer el set).
**Propuesta:**
- Stem: "El capitán dice que en este tramo reman otros. ¿Qué haces mientras esperas?"
- [D] "Le pido al capitán entrar en el próximo tramo"
- [I] "Aliento fuerte a los que reman"
- [S] "Me quedo listo para cuando me toque"
- [C] "Observo la maniobra para mejorar la mía"
(rotación normal del equipo, sin drama de exclusión: apta 8-10; PD1 la marcó "casi sirve tal cual" en seguridad emocional)

### A7. Q11 "La Práctica Final" — de stem metacognitivo a conductual
**Diagnóstico:** el otro ítem muerto (36%), stem metacognitivo ("¿qué te ayuda?") que es el más lento del set (12.2s de mediana), C y S semánticamente adyacentes. Fuente: PSI-06, PD-03, PD6.
**Propuesta (plantilla Q6, acciones concretas):**
- Stem: "Hay que repetir la maniobra muchas veces. **¿Qué haces?**"
- [D] "Le pongo un reto de velocidad a cada vuelta"
- [I] "La hago divertida con los demás"
- [S] "Repito tranquilo hasta que salga sola"
- [C] "Ajusto un detalle en cada repetición"
(la escena del rival de PD1 queda Tier B como posible reemplazo futuro)

### A8. Micro-fixes fundados (no tocar nada más de esos ítems)
- **Q3-S:** "Mantener un ritmo constante" → "Llevar un ritmo en el que el equipo se apoye" (función S restituida; H2/H8 redacción)
- **Q12-D:** "¿Cuál es la próxima isla?" → "¡Lo logramos! ¿Cuál es la próxima isla?" (era la única opción sin celebración en el momento de celebrar; H8)
- **Q12-S:** "¡Llegamos todos a salvo!" → "¡Ayudé a que llegáramos todos a salvo!" (agencia; H8, h7)
- **Q4-C:** "Analizo el mapa y el viento" → "Miro bien el mapa y el viento antes de elegir" (léxico piso 8; PD-03. Q4 es el ítem más sano: SOLO este cambio de lexicón, nada más)
- **Q2, Q6:** NO SE TOCAN. Q2 era mayormente posición (esperar datos); Q6 es la plantilla de oro.

### A9. Re-mapeo de contextos (config, va con la ola)
`CONTEXT_MAP_V4` pasa de 8 contextos (5 de escena única, ciegos para patrones) a 4 supercontextos × 3 escenas:
- **tarea nueva** {Q1, Q2, Q4} · **adversidad** {Q5, Q6, Q7} · **equipo bajo presión** {Q8, Q9', Q10} · **disfrute y cierre** {Q3, Q11, Q12}
Regla de disparo (ya acordada en C2): 3/3 afirma patrón; 2/3 solo conteo literal. Fuente: h8, careo T2.

### A10. Naming (D2, aprobado en principio por el owner): conector de veta graduado + fix del opuesto
- `con veta X` (B2≥4) · `con tonos de X` (B2 2-3) · `con destellos de X` (B2 0-1; con B2=0, "con destellos de X y Y")
- **Bug a corregir con esto:** el código v4 actual imprime "con veta [opuesto]" cuando el 2º eje es el diagonal (D↔S, I↔C), violando el canon de `archetype-naming.md`. Fix: primario solo en el encabezado, el opuesto se narra en el cuerpo, JAMÁS se promueve el 3º a veta (h6).
- Dúo real para registro parejo (B 0-1) con encuadre evolutivo por edad + línea fija de expectativa ("esta es la foto de hoy...").
- Solo cambian el conector y esos casos borde; el cuerpo del informe no cambia.

## TIER B (necesitan piloto o decisión extra; NO van en esta ola)
- **Escena de desacuerdo entre pares** (h5: "un compañero dice que tu nudo quedó flojo") — repone 4 facetas ausentes (asertividad D, reparación I, acomodación S, verificación C). Candidata a reemplazar Q5 o Q7 en v4 del instrumento.
- **Escena del rival** (PD1: "otro barco aparece a la par") — afecto competitivo leve; requiere revisión de seguridad emocional 8-10 y pilotaje.
- **Cierre de auto-verificación del niño** (1-2 taps al final; crítico) — diseño anti-deseabilidad pendiente.
- **Doble registro por edad** (PD4: aventura 8-11 / travesía sobria 12-16) — esperar señal de DIF por edad a n≥300.

## Secuencia de aplicación (cuando apruebes)
1. Aplicar A1-A8 en `onboardingDataI18n.ts` (es) + traducir en/pt con la misma cirugía + espejo en `onboardingData.ts` largo + sincronizar `onboardingDataV2.ts` (todavía tiene Q8/Q10 viejas).
2. A9 en `dischSignals.ts` (CONTEXT_MAP_V4 + MULTI_CONTEXTS + regla 3/3).
3. A10 en `profileResolver.ts` (buildVotesEvidence) + actualizar snapshots es/en/pt.
4. Bump `INSTRUMENT_VERSION` a `v3-items-<fecha>`.
5. Pasada final de la rúbrica (6 criterios) sobre el set COMPLETO por un revisor fresco.
6. Content-linter + qa:unit + verificación en localhost jugando la odisea.
7. Los monitores ya definidos (entropía <0.85, opción >40-45%, piso de eje <15%) vigilan la ola desde la primera partida.

## Qué esperamos que cambie (predicciones registradas, falsables)
- Entropía de Q5 ≥0.85 y ninguna opción >40% a n≈100 post-v3.
- El share primario de S NO cae (la función restituida compensa la pérdida del subsidio posicional).
- El share primario de C sube desde 20% hacia 22-28% (lexicón piso 8).
- El acuerdo ítem→resto de Q9' y Q11' sube de +11/12pp a ≥+15pp sobre baseline.
- La distribución de B se separa del nulo estructural (la lectura formal recién a n≈180-200).
