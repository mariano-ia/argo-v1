# Ola v3 de copy: banco de preguntas para lector de 9 años

**Fecha:** 2026-07-15 (3 rondas el mismo día)
**Estado:** PROPUESTA FINAL verificada. NO aplicada a código. Pendiente de aprobación final del owner.
**Origen:** orden del owner (2026-07-15): la redacción del banco no está ajustada a un niño de 9 años; convocar panel de expertos. Se cruza con la ola v3 de ítems de la auditoría de expertos (`docs/METODO-REVISION-EXPERTOS-JUEGO-20260708.md`, decisión D7).

## Proceso (3 rondas de workflow multi-agente)

1. **Ronda 1** (45 agentes, run `wf_28c9a2a8-87a`): 4 expertos independientes (lecturabilidad infantil, psicometría DISC, escritora infantil, entrenador formativo) reescribieron el set completo; un juez por pregunta fundió la mejor versión; doble verificación adversarial (maestra de 4to grado + psicómetra) con reparación. 5 preguntas reparadas.
2. **Ronda 2** (22 agentes, run `wf_b6b6b077-dd1`): el owner revisó y dejó 8 observaciones ítem por ítem; un editor por pregunta las integró con criterio técnico y todo volvió a doble verificación. Hallazgos extra de los verificadores: defecto estructural en Q2 (enunciado en puntos suspensivos que una opción no completaba), regionalismo "¿qué te sale hacer?" en enunciados, ambigüedades léxicas. Una reparación (Q6) violó vetos y fue descartada a mano.
3. **Ronda 3** (12 agentes, run `wf_393aa89b-447`): arbitraje final de los 4 puntos disputados (Q6 completa, I de Q2, D de Q8, S de Q11) con vetos codificados como reglas duras. Los 4 pasaron sin reparación.

## Reglas duras aplicadas

- Lector piso: 9 años, español latam neutro pan-regional (sin rioplatensismos ni mexicanismos), tuteo estricto, sin guiones.
- Opciones ≤12 palabras (ideal 8-10), enunciados ≤20, una cláusula cuando se puede.
- Cada opción mide UN eje; los ejes y conductas del banco NO cambiaron (no requiere re-mapeo de `dischSignals`).
- Deseabilidad pareja; la D nunca es héroe solitario (siempre "ayudar a"); las S llevan propósito de equipo (excepción: ítems de disfrute interno); las C llevan un "para qué" positivo (ataca la repulsión anti-C medida, hallazgo PD-03).
- Vetos del owner (2026-07-15): **fuerza / fuerte** (palabra valorizada por niños, desvía elección) y **despacio** (palabra de velocidad; S mide cuidado, no lentitud). Extendidos por consistencia: **rápido/enseguida** solo donde la inmediatez ES la conducta D diseñada (Q1 D, Q3 D, Q5 D, Q2 D, Q10 D); **jalar/voltear** (regionalismos); **reto** (en rioplatense retar = regañar).
- Anti-patrón léxico: no repetir el mismo verbo inicial en 3+ opciones del mismo eje (los niños aprenden el patrón). Estado: C con "Miro" ×3 (Q1, Q4, Q9: tope), C alternas: Reviso (Q7), Me fijo (Q8), Busco (Q6); I con ánimo/animar ×3 tolerado pero al tope (Q6, Q8, Q9).
- Q6 y Q12 conservan su estructura validada por datos.

## SET FINAL (es)

### Q1. La Salida
**"El barco está por salir del puerto. ¿Qué te dan ganas de hacer?"**
- (C) Miro que las cuerdas estén bien atadas antes de salir.
- (D) Subo rápido al barco para salir ya.
- (S) Me acomodo tranquilo para ayudar durante el viaje.
- (I) Busco a mis amigos para sentarnos juntos.

### Q2. El Nuevo Ritmo
**"El capitán te enseña una forma nueva de remar. ¿Qué haces tú para aprenderla?"**
- (C) Primero quiero entender por qué se hace así.
- (D) La pruebo enseguida con mis propios brazos.
- (S) La repito paso a paso para remar al ritmo del equipo.
- (I) La practico con mis amigos para divertirnos.

Ronda 2: el enunciado dejó los puntos suspensivos (defecto estructural: la I no completaba la frase). La S perdió "despacio" (veto del owner extendido) y el figurado "acompañar al equipo". La I pasó de sentimiento a conducta.

### Q3. Lo que más te gusta del viaje
**"¿Qué es lo que más te hace sonreír cuando estamos en el agua?"**
- (C) Aprender trucos para que mi remo entre al agua sin salpicar.
- (S) Remar parejo para ayudar a que el barco no se frene.
- (I) Contar historias con los demás mientras el barco avanza.
- (D) Sentir que vamos cada vez más rápido hacia la isla.

### Q4. Los Dos Caminos
**"El mapa muestra dos caminos para llegar a la isla. ¿Cómo te gusta elegir?"**
- (I) Pregunto a todos cuál camino les gusta más.
- (C) Miro bien el mapa y el viento antes de elegir.
- (D) Elijo el camino más corto para llegar antes.
- (S) Prefiero el camino que ya conocemos para ir todos tranquilos.

### Q5. La Tormenta (REESCRITA 2026-07-15 por el owner; supera la versión del PDF "nos atrapa")
**"La tormenta se acerca. ¿Qué haces?"**
- (D) Me pongo en marcha ya, sin esperar a que llegue.
- (C) Miro el cielo y reviso qué conviene asegurar antes.
- (I) Reúno al equipo para que estemos todos juntos.
- (S) Sigo firme con mi parte para que el barco no se frene.

Motivo del cambio (fix de "situación fuerte"): la Q5 era el único imán probado neto de posición del set (D "reaccionar rápido a ayudar" capturó ~50% desde la posición castigada, z=-5.3). El diagnóstico: con la tormenta YA encima ("nos atrapa"), actuar rápido no es un rasgo, es la respuesta correcta que cualquiera daría, y "pienso bien" queda como el lento de la escena. Las 4 recetas del anexo maquillaban las opciones sin desarmar el mecanismo. Al mover el estímulo a **anticipatorio** ("se acerca", con tiempo disponible) cada eje recupera una conducta natural distinta: D se pone en marcha ya, C evalúa antes de que llegue, I junta al equipo, S asegura su tarea. Recaudos aplicados: (a) se eliminó "ayudar" de la D (era el monopolio de deseabilidad que causaba el imán original); (b) la C es conducta observable concreta ("miro el cielo, reviso qué asegurar"), no virtud de prudencia, y evita pisar el "miro el mapa y el viento" de Q4; (c) se quitó el "¿qué haces primero?" (el "primero" activa el guion de secuencia correcta, ese cierre queda solo en Q7). Además reparte mejor el supercontexto adversidad {Q5, Q6, Q7}: antes (se acerca) / durante (la ola golpea) / después (el nudo falló). Vigilado por los monitores de la ola (entropía ≥0.85, ninguna opción >40%, piso de eje ≥15%, sesgo posicional) sobre las primeras jugadas de la versión final.

### Q6. La Ola Sorpresa (plantilla validada, estructura intacta)
**"Una ola inclina el barco de golpe y casi te caes. En ese segundo... ¿qué haces?"**
- (I) Grito ¡vamos, equipo! para dar ánimo a todos.
- (D) Agarro una cuerda para ayudar a acomodar el barco.
- (C) Busco qué se soltó para avisarle al capitán.
- (S) Sostengo a mis compañeros para que nadie se caiga.

Veto del owner ejecutado: "fuerza" salió de la D y de la S. La D quedó con objeto concreto (cuerda), verbo pan-latam (agarro) y marco de ayuda (nunca héroe único). La S ahora es sostén literal de personas. El cierre del enunciado pasó a "¿qué haces?" (el "¿qué te sale hacer?" era regionalismo Cono Sur y "primero" triplicaba el cierre de Q5/Q7). NOTA de historial: una reparación automática de ronda 2 produjo "Jalo una cuerda con fuerza para enderezar el barco" (3 vetos violados); fue descartada a mano y re-verificada en ronda 3.

### Q7. El Nudo Travieso
**"Hiciste un nudo para atar la vela y se soltó. ¿Qué haces primero?"**
- (S) Lo vuelvo a atar con cuidado para que el equipo siga navegando.
- (C) Reviso el nudo para descubrir por qué se soltó.
- (D) Lo intento otra vez con más energía.
- (I) Invito a un compañero a atarlo juntos.

S: "con cuidado" en vez de "despacio", sugerencia del owner aceptada tal cual (despacio = velocidad, contamina el eje con señal de tempo). D: "enseguida" fuera por la misma regla. I: la sugerencia del owner ("le pido que me ayude") se adaptó, no se adoptó: pedir ayuda baja la agencia del niño y rompe la paridad de deseabilidad; "Invito a un compañero" mantiene iniciativa y paridad. C: "Reviso" en vez de "Miro" (ya había 3 C con Miro).

### Q8. El Empuje
**"El equipo está cansado y nos cuesta seguir remando. ¿Qué te dan ganas de hacer?"**
- (D) Pongo más energía para que el barco avance.
- (C) Me fijo bien cómo mover el remo para que sea más fácil.
- (S) Sigo remando parejo para que el barco no pare.
- (I) Digo algo divertido para animar al equipo.

C: dirección del owner aceptada (coincide con la repulsión anti-C medida): ahora tiene un para qué tentador y literal en la escena de cansancio (que sea más fácil). D: la reparación automática había propuesto "Remo más fuerte" (veto); quedó "Pongo más energía para que el barco avance" (propósito concreto, sin fuerte, no se pisa con la S: D empuja para avanzar, S mantiene para no parar). Enunciado: "nos cuesta" (sin "nos" se leía como precio) y "¿Qué te dan ganas de hacer?" (regionalismo fuera).

### Q9. La Espera
**"Te toca descansar mientras otros acomodan las velas. ¿Qué haces en ese ratito?"**
- (C) Miro cómo lo hacen para aprender sus trucos.
- (D) Espero atento la señal para volver a remar.
- (S) Descanso tranquilo para ayudar cuando el equipo me necesite.
- (I) Les doy ánimo a los que acomodan las velas.

Sigue candidata a re-situarse de fondo (ítem muerto que mide tempo, decisión PD1); esta copy solo la hace legible.

### Q10. El Apoyo
**"A un compañero se le escapa el remo y se pone un poco triste. ¿Qué te sale del corazón?"**
- (D) Le alcanzo el remo rápido para que siga remando.
- (C) Le muestro un truco para agarrar mejor el remo.
- (S) Remo a su lado para que no se sienta solo.
- (I) Le hago un chiste para que se ría.

"¿Qué te sale del corazón?" se conserva: "del corazón" desambigua la construcción y es cálido.

### Q11. Casi Llegamos
**"Para llegar a la orilla hay que repetir el mismo movimiento muchas veces. ¿Qué te ayuda a no aburrirte?"**
- (C) Mejorar algún detalle en cada intento.
- (I) Sentir que es un juego con mis amigos.
- (S) Sentir que mi ritmo ayuda al barco.
- (D) Inventarme un desafío nuevo cada vez.

S: tercera iteración (el owner marcó las dos anteriores como difíciles); 7 palabras, sin metacognición, conserva ritmo + propósito de equipo. El árbitro mantuvo "Sentir" repetido con la I a propósito: verbo natural del disfrute interno y empareja deseabilidad; "Notar" arrastraría léxico observacional (C) a una opción S. D: "Inventarme" (juguetón); no se usa "reto" (en rioplatense retar = regañar).

### Q12. La Meta (plantilla validada, estructura intacta)
**"¡Llegamos! El barco toca la arena. Al bajar a la playa... ¿qué es lo primero que piensas?"**
- (I) ¡Qué lindo fue compartir esta aventura con el equipo!
- (C) ¡Qué bien nos salió el plan del viaje!
- (S) ¡Qué bueno que ayudé a que todos llegáramos bien!
- (D) ¡Lo logramos! ¿Cuál será la próxima isla?

## Resolución de las 8 observaciones del owner (2026-07-15)

| # | Observación | Resolución |
|---|---|---|
| 1 | Q5 C poco elegible, sumar "pienso bien" | ACEPTADA (fusión con la conducta de priorizar); "para no equivocarse" descartado por léxico de error |
| 2 | Q5 I "me aseguro que trabajemos en equipo" | DIAGNÓSTICO aceptado, redacción no (imán de deseabilidad + sin conducta observable) → "Reúno al equipo" |
| 3 | Q6 D "fuerza" desviadora | ACEPTADA, veto extendido a todo el set |
| 4 | Q6 S "otra vez la fuerza" | ACEPTADA → "Sostengo a mis compañeros" |
| 5 | Q7 S "con cuidado" mejor que "despacio" | ACEPTADA tal cual + extendida a Q2 S y Q7 D (regla de tempo) |
| 6 | Q7 I "le pido que me ayude" más simple | ADAPTADA: "Invito a un compañero a atarlo juntos" (pedir ayuda baja agencia) |
| 7 | Q8 C poco elegible, darle un por qué | ACEPTADA (coincide con hallazgo PD-03 anti-C) → "para que sea más fácil" |
| 8 | Q11 S y D difíciles | ACEPTADA: S reescrita entera (7 palabras), D "Inventarme un desafío nuevo cada vez" |

## Pendientes para aplicar

1. **Aprobación final del owner** del set completo de arriba.
2. Aplicar a `src/lib/onboardingData.ts` + versiones en/pt en `src/lib/onboardingDataI18n.ts` (equivalencia es/en/pt en la misma pasada, hallazgo H1.5 de la auditoría). Los títulos renombrados (La Salida, Los Dos Caminos, La Tormenta, La Ola Sorpresa, El Nudo Travieso, Casi Llegamos, Lo que más te gusta del viaje) también.
3. Ejes y conductas sin cambios: NO hace falta re-mapear `dischSignals`.
4. Desplegar como un solo corte con fecha registrada (ola v3 de copy) para que el antes/después sea medible; umbrales pre-registrados de la auditoría siguen vigentes.
