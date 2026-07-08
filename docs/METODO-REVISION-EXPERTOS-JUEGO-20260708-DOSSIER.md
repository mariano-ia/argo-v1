# DOSSIER DE EVIDENCIA — Auditoría del juego Argo por panel de expertos DISC
> Fecha: 2026-07-08. Confidencial, uso interno. TODA cifra citada en hallazgos debe salir de este dossier.

## 0. Objetivo del análisis (del owner)
"Capturar mejor el espíritu de ese niño. Que la foto que generamos sea lo más fiel posible y **no sea la misma para todos**. Podemos aceptar que a algunos les calce mejor o peor, pero no que salga siempre la misma."
Dos criterios de éxito, en tensión potencial: **fidelidad** (la foto describe a ESE niño) y **diferenciación** (fotos distintas entre niños distintos, sin fabricar diferencias falsas).

## 1. El producto y sus restricciones duras
- Argo Method: perfilamiento conductual DISC-based para deportistas de 8 a 16 años. El niño juega una "odisea" náutica (~10 min, móvil, una sola sesión, sin login). El informe lo recibe el adulto (entrenador O padre; copy buyer-neutral).
- 3 idiomas (es/en/pt); 96% del histórico es español.
- Lenguaje obligatorio del producto: probabilístico ("tiende a", "suele"), jamás determinista; prohibido léxico clínico o de déficit (error, problema, corregir, lento como defecto, impulsivo, etc.); el motor/tempo JAMÁS se narra como defecto; el informe es invitación al disfrute, no manual del niño.
- Naming vigente (v4, diseño 2026-07-06): el perfil se nombra `[Eje primario] con veta [Eje secundario]` (D=Impulsor, I=Conector, S=Sostenedor, C=Estratega). Los opuestos diagonales (D↔S, I↔C) NUNCA forman nombre compuesto (se narran en el cuerpo). El tempo (Rápido/Medio/Lento) salió del nombre: es un insight per-child en la sección "Su motor" con léxico cronométrico. REGLA DURA del owner (2026-07-07): SIEMPRE se nombra perfil + veta en el encabezado (salvo 2º eje con 0 votos); la confianza se comunica con el "registro" de tono, nunca ocultando el nombre.
- Los informes viejos en DB conservan labels del esquema anterior eje×motor ("Conector Dinámico"); forward-only.

## 2. El instrumento hoy
### 2.1 Las 12 preguntas vivas (versión i18n corta, ES; la que juega el niño)
Formato: forced-choice, 4 opciones, una por eje. El niño elige UNA. Cada elección = 1 voto al eje. 12 votos totales.
ORDEN HISTÓRICO = orden fijo en pantalla hasta 2026-07-08 (hoy se deployó shuffle aleatorio por pregunta). Se lista `[posición 1..4]`.

- Q1 "El Despegue" (contexto: inicio) — "¡Es hora de zarpar! ¿Qué haces primero?"
  [C] Reviso que todo esté listo / [D] ¡Salto al barco ya! / [S] Me instalo con calma / [I] Busco a mis amigos
- Q2 "El Nuevo Ritmo" (inicio) — "El capitán enseña una nueva forma de remar. ¿Cómo la aprendes?"
  [C] Primero entiendo cómo funciona / [D] Me lanzo a probar de una / [S] Que me muestren paso a paso / [I] La practicamos todos juntos
- Q3 "El Motor del Viaje" (disfrute) — "¿Qué te hace sonreír mientras navegamos?"
  [C] Aprender trucos nuevos / [S] Mantener un ritmo constante / [I] Charlar con los demás / [D] Sentir que vamos rápido
- Q4 "La Encrucijada" (decisión) — "El mapa muestra dos caminos. ¿Cómo decides?"
  [I] Escucho qué opinan todos / [C] Analizo el mapa y el viento / [D] Elijo el más directo / [S] Me aseguro de que el camino sea seguro
- Q5 "El Momento del Caos" (adversidad) — "¡La tormenta nos atrapa! ¿Qué haces?"
  [S] Mantengo mi posición para que el barco no se mueva / [D] Me muevo rápido a ayudar / [C] Pienso qué es lo importante / [I] Busco a mis compañeros
- Q6 "El Desajuste" (adversidad) — "Una ola inclina el barco. ¿Qué te sale hacer?"
  [I] ¡Grito "vamos equipo!" / [D] Agarro lo que pueda / [C] Miro qué se soltó / [S] Me quedo firme en mi lugar
- Q7 "El Nudo Rebelde" (adversidad) — "Tu nudo se soltó. ¿Qué haces primero?"
  [S] Respiro y lo intento de nuevo / [C] Veo qué parte falló / [D] Lo rehago con más fuerza / [I] Pido ayuda a un compañero
- Q8 "El Empuje" (esfuerzo) — REESCRITA HOY (2026-07-08). Antes: "El equipo está cansado. ¿Cómo los animas?" con [I] "Digo algo divertido" / [C] Recuerdo cuánto falta / [S] Sigo remando igual / [D] Remo más fuerte. AHORA: "El equipo está cansado y el barco se frena. ¿Qué haces?" [D] Remo con más fuerza y marco el ritmo / [C] Ajusto la técnica para que cada remada rinda / [S] Mantengo mi remada firme y pareja / [I] Suelto una broma y les levanto el ánimo
- Q9 "La Espera" (espera) — "Te toca descansar un momento. ¿Qué haces?"
  [C] Observo y aprendo / [D] Me preparo para actuar / [S] Recupero energía / [I] Doy ánimos al equipo
- Q10 "El Apoyo" (equipo) — REESCRITA HOY. Antes: "A un compañero se le cae el remo. ¿Qué haces?" [I] Le choco la mano, ¡todos bien! / [C] Le enseño un truco / [D] Lo ayudo a recuperarlo rápido / [S] Me pongo a su lado. AHORA: mismo intro, [D] Le alcanzo el remo enseguida / [C] Le muestro cómo agarrarlo firme / [S] Bajo el ritmo y remo a su lado / [I] Le choco los cinco y lo hago reír
- Q11 "La Práctica Final" (esfuerzo) — "Hay que repetir una maniobra muchas veces. ¿Qué te ayuda?"
  [C] Que cada vez salga mejor / [I] Hacerla como un juego con todos / [S] Que se vuelva fácil y natural / [D] Ponerme un reto de velocidad
- Q12 "La Meta" (meta) — "¡Llegamos a la playa! ¿Qué piensas primero?"
  [I] ¡Increíble aventura juntos! / [C] ¡Qué bien salió el plan! / [S] ¡Llegamos todos a salvo! / [D] ¿Cuál es la próxima isla?

Existe además una versión "larga" de los mismos 12 ítems (frases de ~15-25 palabras por opción, mismos ejes y mismo orden) usada en el deck/admin; el juego vivo usa la corta.
Mapa de contexto v4 (dischSignals): inicio {Q1,Q2}, disfrute {Q3}, decisión {Q4}, adversidad {Q5,Q6,Q7}, esfuerzo {Q8,Q11}, espera {Q9}, equipo {Q10}, meta {Q12}. Solo inicio/adversidad/esfuerzo tienen ≥2 escenas (pueden formar "patrón" robusto per-child).

### 2.2 Los 3 minijuegos (intercalados en la odisea; miden tempo, NO ejes)
- Islas Desconocidas (decisión): elegir cartas; mide latencies, avgLatency, stdDev, trend.
- Esquivar/Ritmo (reacción): tap para esquivar obstáculos; mide reactionTimes, avgReaction, extraTaps (taps sin obstáculo), avgCadence.
- La Tormenta (adaptación): la regla de color cambia; mide adaptationTimes (ms hasta el primer tap correcto tras cambio de regla), inertiaErrors, correctTaps, wrongTaps.

### 2.3 Scoring vigente (legacy, el que produjo TODOS los perfiles en DB)
- Eje = eje con más votos de 12. Empate exacto: tiebreaker que favorece al eje MENOS representado en los perfiles previos de la sesión/grupo (ingeniería de dispersión explícita; `tiebreakerApplied`).
- Motor con minijuegos (desde ~jun 2026): score compuesto = Impulso(0.30)+Ritmo(0.30)+Adaptación(0.40), cada uno mapeado a 0-100 con umbrales fijos NO normados por edad (p.ej. reacción <300ms→100, >1500ms→0; adaptación <500ms→100; extraTaps suman "bonus de impulsividad"). Composite ≥67 → Rápido; ≤33 → Lento; medio → Medio.
- Motor legacy (antes de los juegos): promedio de responseTimeMs de las 12 preguntas; <5s→Rápido, >12s→Lento, medio→Medio con desempates por diferencia de votos; además: si >60% de motores previos del grupo eran Medio, se empuja a Rápido/Lento según 8.5s (más dispersión artificial).
- Label almacenado = esquema viejo `[Eje][Motor]` (p.ej. "Conector Dinámico").

### 2.4 Motor v4 (diseñado, código aditivo, AÚN NO decide el informe en prod)
- EvidenceFicha per-child: vector de votos, B = 1º−2º, B2 = 2º−3º, banda (B≥4 definido / B≥2 con_matices / B≤1 mezcla), registro de tono (B≥6 rotundo / 4-5 claro / 2-3 matices / 0-1 parejo: los dos ejes en el nombre), name-gate (B≥4 OR (B≥2 ∧ top≥7)), veta afirmada si B2≥4 y no-opuesta, forma (cascada de 7: duo_empate, equilibrio, duo, versatil, lider_acompanante, definido, muy_definido).
- Señales per-child adicionales (diferenciación DENTRO del mismo nombre): receta (orden completo de los 4 ejes con presencia principal/presente/apenas/ausente), contingencia (patrón por contexto SOLO si mayoría estricta en contextos multi-escena; "en adversidad elige C aunque su primario sea I"), ritmoAcople (¿responde más rápido cuando elige su primario? gap ≥0.5 o silencio), tempo age-fair (factorEdad por edadMeses; zonas; normas bibliográficas placeholder hasta juntar 500 partidas reales; contador en curso).
- Filosofía v4: el nombre sale SOLO de votos; el motor nunca nombra; siempre hay perfil (nunca "no pudimos").

## 3. Constantes del nulo (enumeración exacta de las 455 composiciones de multinomial(12, ¼))
Si un niño respondiera AL AZAR uniforme: P(B=0)=22.79%, P(B=1)=36.48%, P(B=2)=23.85%, P(B=3)=9.82%, P(B≥4)=7.06%. P(B≤1)=59.27%.
Name-gate adoptado (B≥4 OR B≥2∧top≥7) deja pasar 7.68% del nulo.
Veta: P(B2≥4)=2.11% marginal.

## 4. EVIDENCIA EMPÍRICA (producción, cohorte real: resolved, no demo, 12 respuestas; n=86)
### 4.1 Distribución final ("la foto")
- Eje primario: I=28 (33%), D=22 (26%), S=19 (22%), C=17 (20%). Uniforme sería 25% c/u.
- Eje secundario: D=31, S=27, I=15, C=13 (skew D/S).
- Motor: Lento=39 (45%), Medio=26 (30%), Rápido=21 (24%)… PERO ver 4.5: es la mezcla de dos regímenes incompatibles.
- Labels: 24 distintos sobre 86; top = "Impulsor Persistente" 12 (14%). La diversidad global es aceptable; el problema es POR COHORTE (4.7).
- Idioma: es=83, en=1, pt=2. Edad: 8-11 n=22 (I 36%), 12-16 n=64 (I 31%).

### 4.2 Márgenes de decisión del nombre (B, B2) observados vs nulo
Observado: B=0: 16 (18.6%) | B=1: 34 (39.5%) | B=2: 15 (17.4%) | B=3: 11 (12.8%) | B≥4: 10 (11.6%).
Nulo:      B=0: 22.8%      | B=1: 36.5%      | B=2: 23.9%      | B=3: 9.8%       | B≥4: 7.1%.
LECTURA CRUDA: la distribución de márgenes observada es CASI la del azar puro (señal apenas superior al ruido: B≥4 11.6% vs 7.1%). El 58.1% de los niños tiene B≤1: su eje primario se decidió por 1 voto o empate. Bajo v4, ~30% pasaría el name-gate; hoy el 100% recibe nombre pleno.
CAVEAT que el panel debe considerar: esto NO prueba que los niños respondan al azar (los ítems tienen distribuciones muy no-uniformes, ver 4.3); niños heterogéneos + ítems sesgados pueden producir esta agregación. Pero sí acota la estabilidad test-retest esperable del nombre.

### 4.3 Ítems: concentración de respuesta (n=86 por ítem)
Opción más elegida por ítem y % (esquema viejo de Q8/Q10):
Q10: D 76% | Q8: I 62% | Q1: C 52% | Q5: D 50% | Q7: D 48% | Q3: I 44% | Q9: S 44% | Q2: S 40% | Q12: S 38% | Q11: S 37% | Q6: I 34% | Q4: I 33%.
Entropía normalizada (1.0=balanceado): Q10 0.58, Q8 0.77, Q1 0.85, Q5 0.88, Q7 0.88, Q9 0.90, Q12 0.91, Q2 0.92, Q3 0.92, Q6 0.96, Q11 0.96, Q4 0.97.
Acuerdo ítem→eje final (P(voto del ítem == primario final); inflado por parte-todo): Q6 56%, Q8 47%, Q12 45%, Q3 44%, Q1/Q2/Q4 41-42%, Q5 40%, Q10 38%, Q9 36%, Q11 36%.
Tiempo de respuesta mediano por ítem: 7.5s (Q9, Q10) a 12.2s (Q11); p90 17-30s.

### 4.4 SESGO DE POSICIÓN (histórico, orden fijo; n=1032 elecciones)
Share por posición en pantalla: pos1=30.4% (z=+4.0), pos2=17.8% (z=−5.3), pos3=35.0% (z=+7.4), pos4=16.8% (z=−6.1). Excluyendo los dos ítems rotos (Q8/Q10): pos1 29.9%, pos2 19.5%, pos3 32.8%, pos4 17.8% (persiste).
Implicación: ~13 puntos de share viajaban por POSICIÓN, no por contenido. Nota de asignación histórica: S estuvo 6 veces en pos3 (favorecida) e I estuvo 5 veces en pos4 (castigada) → el 33% de primarios I ocurrió A PESAR del handicap de posición; la señal de contenido pro-I es mayor que la cruda. Mitigación deployada HOY: orden aleatorio por pregunta (Fisher-Yates). Los 86 perfiles históricos cargan el artefacto.

### 4.5 El motor cambió de identidad a mitad del producto (regímenes)
Por mes (Rápido/Medio/Lento): 2026-03: 7/11/37 (67% Lento; régimen legacy RT: mediana ~10s por ítem hace que >12s promedio sea frecuente → "Lento" mide LECTURA, no deliberación). 2026-06: 5/7/2 y 2026-07: 9/6/0 (régimen minijuegos: umbrales fijos sin norma de edad → casi nadie Lento, mayoría Rápido).
Implicación: "motor" nunca estuvo calibrado; cada régimen estampa su propio sesgo. v4 lo sabe (age-fair + normas 500) pero no está activo.

### 4.6 Ítems ya corregidos HOY (no re-recomendar; SÍ auditar las versiones nuevas)
Q8/Q10 rebalanceadas (es/en/pt) con el criterio valencia/concreción/calidez igualadas; intro de Q8 neutralizado; shuffle global. El panel debe: (a) evaluar críticamente las NUEVAS redacciones (¿quedó algún imán?), (b) buscar el MISMO patrón en los otros 10 ítems (candidatos por datos: Q1 C=52%, Q5 D=50%, Q7 D=48%).

### 4.7 Homogeneidad intra-plantel (la queja del owner, cuantificada)
Tenants con ≥5 perfiles: Coco Fútbol 9 perfiles → 78% mismo eje primario (7 I); Team Argo US 10 → 50%; Yacaré 5 → 40%. La "misma foto" es realidad vivida por el entrenador aun cuando la distribución global no es tan mala. Hipótesis abiertas para el panel: (i) ítems imán + posición inflaban un eje; (ii) homogeneidad real del grupo (autoselección del deporte/club); (iii) contexto de toma compartido (mismo día, respondiendo juntos, deseabilidad ante el entrenador); (iv) el instrumento no resuelve dentro del rango normal de niños deportistas.

## 5. Mandato del panel
1. El ÚNICO objetivo es la foto fiel y diferenciada del niño (8-16) SIN fabricar diferencias falsas. No optimizamos conversión ni marketing.
2. Cada hallazgo debe: citar evidencia de ESTE dossier (número, ítem o regla concreta), explicar el mecanismo, y proponer una mejora accionable con su costo (copy | configuracion | metodo | investigacion).
3. Criticar también lo ya diseñado (v4, REGLA DURA siempre-nombra, gates, señales, las nuevas Q8/Q10) si corresponde: nada es sagrado. Pero no re-descubrir lo ya corregido (4.6).
4. Toda propuesta de copy debe respetar la filosofía de lenguaje del producto (probabilístico, sin déficit, español latam neutro sin voseo, sin guiones largos).
5. Los 3 minijuegos y las latencias también son material de análisis (señal conductual), no solo las 12 preguntas.
6. Restricción de realidad: niño de 8-16 en móvil, ~10 min total, una sesión, sin supervisión estandarizada. Cualquier propuesta que rompa esto debe declararlo y justificar el trade-off.
