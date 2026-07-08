# Revisión del juego por panel de expertos DISC (2026-07-08)

> **Objetivo único del ejercicio (owner):** capturar mejor el espíritu de cada niño. Que la foto sea lo más FIEL posible y NO sea la misma para todos, sin fabricar diferencias falsas.
> **Método:** dossier de evidencia (código + 86 perfiles reales de producción) → panel de 8 expertos con lentes en conflicto → 6 careos adversariales → crítico de completitud. 15 agentes, 59 hallazgos.
> **Piezas:** este documento (síntesis + plan) · `METODO-REVISION-EXPERTOS-JUEGO-20260708-DOSSIER.md` (la evidencia que todos citaron) · `METODO-REVISION-EXPERTOS-JUEGO-20260708-ANEXO.md` (los 59 hallazgos, careos y crítico, texto completo).

---

## 1. Veredicto en cinco líneas

1. El chasis es correcto (escenas conductuales + elección forzada + naming eje×veta v4), pero **12 votos nominales no financian todo lo que el encabezado promete** (nombre + veta + patrones): el 58.1% de los niños tiene su eje decidido por 1 voto o empate, casi calcado del azar puro (59.3%).
2. Parte de la diferenciación histórica era **fabricada por el pipeline**: tiebreaker que mira al grupo (decidió ~1 de cada 5 nombres), 13 puntos de share por posición en pantalla, ítems imán, y un motor que cambió de identidad dos veces (67% Lento en marzo → 0% en julio).
3. Las señales finas v4 (contingencia, ritmoAcople, veta siempre impresa) **tal como están gateadas fabricarían personalización desde ruido** (bajo el nulo: ~79% de los niños recibiría algún "patrón"; la veta afirmable solo existe en 2.11% del azar).
4. La homogeneidad intra-plantel es real (Coco 7/9 mismo eje, p≈0.008) pero **inatribuible hoy** entre: instrumento, toma grupal, autoselección del club. Hay discriminadores baratos con datos existentes.
5. La mejora no es una sola palanca: es **higiene inmediata (config) + cirugía de ítems dirigida por datos + honestidad estructural en el nombre + telemetría para aprender**. Y varias decisiones son solo del owner (sección 6).

---

## 2. Protocolo utilizado

- **Capa 1, dossier:** ítems vivos (es/en/pt) + scoring legacy y v4 exactos + minijuegos + constantes del nulo (455 composiciones) + evidencia empírica de producción (n=86 reales): distribuciones, márgenes B/B2, acuerdo ítem-perfil, tiempos, sesgo de posición (z hasta 7.4), regímenes del motor, homogeneidad por tenant.
- **Capa 2, panel (paralelo, cada uno citando solo el dossier):** psicometrista clásico (PSI) · psicólogo del desarrollo 8-16 (PD-xx) · DISC ortodoxo (h1-h8) · psicometrista crítico anti-tipologías (H1-H7) · psicólogo deportivo infantil (PD1-PD6) · diseñador de stealth assessment (ECD) · especialista en redacción de ítems (H1-H8 redacción) · metodólogo de datos y normas (M1-M8).
- **Capa 3, careos:** 6 tensiones con steelman de ambos lados, convergencias, desacuerdo irreducible, trade-off del owner y dato resolutorio. Cierre: crítico de completitud (lentes faltantes, hallazgos que nadie dijo, contradicciones internas, riesgos de mala lectura).

---

## 3. Los hallazgos donde TODO el panel converge (máxima confianza)

Ordenados por relación impacto/costo. "Convergencia" = lo firmaron expertos de escuelas opuestas sin coordinarse.

### C1. Matar YA los dos desempates acoplados al grupo (config, esta semana)
El scoring legacy resuelve empates favoreciendo al eje menos representado en los perfiles previos del grupo, y empuja el motor Medio a Rápido/Lento si el grupo venía >60% Medio. Con B=0 en el 18.6% de la cohorte, **~1 de cada 5 nombres dependió de quién jugó antes**. Es fabricación literal de diferencias falsas (unánime: PSI-03, PD-02, h2, H4). Reemplazo: desempate con señal interna del niño o nombrar el empate como dúo (v4 ya lo contempla). Verificar que v4 no lo herede y marcar en DB las sesiones históricas con `tiebreakerApplied`.

### C2. Las señales finas v4 no pueden narrar rasgo con los gates actuales (config)
- **Contingencia** ("en la adversidad elige C"): con mayoría estricta 2/3, un niño respondiendo al azar recibe algún "patrón" en ~79% de los casos (62.5% solo en adversidad). Regla nueva: 3/3 afirma (o test exacto per-child contra su propia receta); 2/3 se narra como conteo literal ("en 2 de las 3 escenas de tormenta eligió...") y nunca como rasgo. Corregir la copy "Ese contraste es genuinamente suyo" (verificada en los snapshots de reportV4): solo en la rama gateada.
- **RitmoAcople:** 6-24% de falsos positivos según la paridad del conteo + confound de largo de ítem (medianas 7.5-12.2s). Estandarizar RT por ítem + test de permutación per-child, o apagarlo. Y la rama nula debe ser SILENCIO real: hoy narra "linda señal de consistencia" a casi todos (la misma foto otra vez).
- **Veta:** ver D2 (decisión del owner), pero el dato es del panel entero: P(B2≥4) = 2.11% bajo el nulo, y los secundarios históricos cargan artefacto documentado (D+S = 67% de las vetas, con Q10 vieja 76% D y S seis veces en posición favorecida).

### C3. El motor no narra zonas absolutas hasta tener norma real (config + gate)
El "motor" cambió de identidad con el régimen (marzo 67% Lento midiendo lectura; julio 0% Lento con umbrales fijos sin edad). Nadie del panel defendió que el composite legacy siga decidiendo informes. Acciones: etiquetar `motor_regime` retroactivo por fechas de deploy; cuarentenar el histórico de toda norma; sacar extraTaps del score (v4 ya lo hace); mientras tanto "Su motor" narra SOLO señales intra-niño (razones, trend), que cancelan edad y dispositivo. Zonas Rápido/Lento: recién cuando la validación por banda de edad pase (ver careo T5). Nota del careo: la contradicción ya vive en `ageNorms.ts` (decisión "honest default" del 07-06 vs "value over caution" del 07-07 en el mismo archivo).

### C4. Telemetría de interacción + versionado, HOY, porque cada día sin ella es dato irrecuperable (config)
El shuffle de hoy no registra ni el orden mostrado ni la posición tocada (verificado en QuestionScreenV2: el orden vive en un ref y se descarta). Sin eso no se puede: auditar si el shuffle mató el sesgo de posición, detectar respondedores posicionales (que ahora reciben un perfil pseudoaleatorio en vez de sesgado), ni construir person-fit. Agregar por respuesta: `displayed_order`, `chosen_pos`, tap antes de fin del enunciado, taps durante el lock; por sesión: clase de dispositivo. Y estampar `instrument_version` (v1_fixed_order / v2_shuffle_q8q10), `motor_regime`, `norm_version` en cada perfilamiento, retro-etiquetando el histórico (M3). Hoy nació el "instrumento v2" sin registro formal; sin versionado, el error del motor se repetirá con los ítems.

### C5. Cirugía de ítems dirigida por datos, no reescritura masiva (copy, en UNA ventana v3)
- **Q5 "El Momento del Caos" es el único imán probado neto de posición**: D "Me muevo rápido a ayudar" capturó 50% DESDE la posición castigada (z=-5.3). Se puede reescribir ya (cuatro recetas propuestas en el anexo; requiere un dueño del spec que arbitre, ver R4 del crítico).
- **Q1 (C 52%), Q7 (D 48%), Q9 (S 44%), Q12/Q3/Q2**: esperar ~100-200 partidas post-shuffle con umbral pre-escrito (top >40% o entropía <0.85 dispara cirugía); parte de su concentración era posición y reescribir hoy fabricaría sesgos nuevos.
- **Q9 y Q11 son los ítems más muertos del set** (acuerdo ítem-perfil 36%, apenas sobre su baseline de azar). Q9 además mide activación (tempo), justo el constructo que v4 sacó del nombre. Candidatos a re-situar (ver T2/PD1).
- **Las nuevas Q8/Q10 quedan en observación con predicción registrada**: riesgo de imán D residual (la D de Q10 sigue siendo la resolución literal del stem; la D de Q8 dobla acción "remo más fuerte Y marco el ritmo"; el intro "el barco se frena" declara un problema que solo D/C resuelven; y pt "perde o ritmo" no plantea el mismo problema que es "se frena"). Umbral: a n≈100, cualquier opción >40-45% dispara la receta ya escrita en el anexo.
- **Patrón sistémico descubierto por el redactor:** la compresión corto-vs-largo amputó la cláusula de propósito de las opciones S en 7 de 12 ítems (S = "quedarse quieto" sin el "para que el equipo se apoye"). S cosechaba share posicional (6 veces en pos3) que el shuffle va a quitar: **predicción pre-registrada: S cae post-shuffle sin que ningún niño haya cambiado**. El pase de copy que devuelve la función a las S está escrito en el anexo (H2 redacción).
- Plantillas de diseño validadas por datos: **Q6** (escena ambigua sin respuesta enseñada: entropía 0.96, mejor acuerdo 56%) y **Q12** (cuatro lecturas del mismo momento). Toda escena nueva se escribe contra esas dos.

### C6. Exponer la diferenciación que YA se midió y el label esconde (config/copy, no-regret)
El "78% mismo eje" colapsa un vector de 4 dimensiones a 1 etiqueta: dos niños I con vectores 4-3-3-2 y 8-2-1-1 son "el mismo" para el entrenador aunque el instrumento los distinguió. Sin tocar la medición: dashboard de plantel y encabezado lideran con eje + forma + registro ("2 Conectores muy definidos, 3 con matices, 2 parejos"), conteo visible junto al nombre ("eligió Impulsor 5 de 12 veces"), y 1-2 enunciados DIFERENCIALES por informe anclados en datos de ese niño (verbatim de una escena + el eje ausente como hecho sin déficit). Esto además ataca el efecto Barnum (H5): hoy ninguna frase del informe le permite al adulto descubrir un mal calce.
**Advertencia del crítico:** la cascada "forma" (7 categorías) nunca fue auditada contra el nulo; derivar su distribución y estabilidad ANTES de hacerla protagonista del dashboard.

### C7. Discriminar las hipótesis de la homogeneidad intra-plantel con datos existentes (gratis, esta semana)
(a) clusters temporales: homogeneidad en tomas agrupadas (mismo tenant, ventana <2-3h) vs dispersas del mismo tenant; (b) share de I en tomas caseras ArgoOne vs tomas de plantel; (c) similitud de recetas completas entre los 7 I de Coco. Si tomas dispersas y caseras son igual de homogéneas Y las recetas son casi idénticas, la homogeneidad es real (autoselección) y **no se corrige: se narra** ("7 de 9 comparten brújula Conectora; lo que los distingue es intensidad y mezcla"). Fabricar variedad ahí violaría el objetivo.

### C8. Split-half retroactivo sobre los 86 vectores (gratis, y nadie del panel lo propuso: lo aportó el crítico)
El parámetro en disputa de TODOS los careos (¿cuánta consistencia intra-niño hay?) se acota YA con datos guardados: acuerdo del primario entre ítems pares e impares contra su nulo, y acuerdo ítem→resto excluyendo el voto propio. Mueve el prior de tres careos esta semana, gratis.

---

## 4. Las 6 tensiones (careos): qué se decidió y qué queda abierto

### T1. Formato: ¿pick-one o most/least ("la que MÁS" + "la que MENOS")?
- **Convergencia dura:** nadie defiende que 12 votos most-only financien todo el encabezado; y most/least NO se activa ahora (primero madurar el fix de hoy). El DISC clásico es most/least por tétrada; pick-one es la desviación.
- **Desacuerdo irreducible:** si el 58.1% B≤1 es artefacto reparable por copy+shuffle o techo matemático del formato. Ambas posiciones predicen la misma B-dist a n=86.
- **Camino pre-registrado:** a n≈180-200 partidas v2, comparar B-dist contra el nulo ESTRUCTURAL (marginales post-fix). Exceso ≥8pp en B≥4 → pick-one basta. Exceso <5pp → piloto most/least en 8-10 años (n≈30, comprensión + tiempo real) y test-retest n≥40. Mientras: prototipar el segundo tap con copy de 8 años ("¿Y cuál NO harías?").
- Prior declarado del moderador: el techo probablemente es real; la carga de la prueba queda sobre pick-one.

### T2. ¿Más escenas (16-20) o mantener 12?
- **Convergencia:** ningún experto propuso crecer como palanca primaria. La palanca es información por pantalla y por minuto (el costo del ítem es LECTURA: medianas 7.5-12.2s). 20 escenas descartado (rompe los 10 min para el lector de 8-9).
- **Acciones sin crecer:** reagrupar contextos a 4×3 (hoy 5 de 8 contextos son de escena única y la contingencia está ciega en medio instrumento); re-situar Q9 (suplencia: "el capitán dice que en este tramo reman otros") como primera escena social-evaluativa; regla 3/3-o-silencio.
- **El hueco de dominio es real (deportivo):** cero escenas con rival, mirada pública, derrota, suplencia, injusticia: justo donde los estilos divergen en el deporte. Entra en la ola v3 con revisión de seguridad emocional para 8-10 y pilotaje.
- **Dato faltante:** curva de finalización por ítem por banda de edad (computable ya con in_flight vs resolved).

### T3. ¿Presupuesto a cuestionario o a conducta (stealth)?
- **Recomendación asimétrica:** el cuestionario DECIDE (firma el 100% del nombre y sus fixes rinden en semanas), la conducta se INSTRUMENTA (una vez, ahora): telemetría C4 + carta elegida en Islas Desconocidas en shadow (hoy el juego cronometra la elección y TIRA el contenido: es la única elección sin audiencia ni opción "buena" del instrumento). Mezcla propuesta ~70/30.
- **Convergencia fuerte:** la conducta NO nombra ejes, ni ahora ni después; a lo sumo corrobora el registro de tono tras validar convergencia a n=500. Y el stealth cronométrico que hoy toca el informe debe RETROCEDER (motor, ritmoAcople) hasta tener normas.

### T4. ¿Nombrar siempre (REGLA DURA) o gates honestos?
- **Convergencia notable:** nadie pide volver al "no pudimos"; y el name-gate como interruptor de visibilidad tiene el mismo defecto que denuncia (B=4 vs B=3 difieren en 1 voto). El careo defendió mantener la letra de la regla.
- **La recomendación más convergente de TODO el ejercicio** (tres escuelas sin coordinarse: PSI-02, h6, H1): **graduar el conector de la veta por B2** dentro del nombre: "con veta X" (B2≥4) / "con tonos de X" (B2 2-3) / "con destellos de X" (B2 0-1, y con B2=0 nombrar ambos empatados). Más: dúo real en B 0-1 con encuadre evolutivo por edad; línea fija de expectativa ("esta es la foto de hoy; puede cambiar, sobre todo cuando estuvo pareja"); y definir el caso sin especificar: si el 2º eje es el opuesto diagonal, primario solo + opuesto narrado en el cuerpo, JAMÁS promover el 3º a veta.
- **El porqué:** retest estimado (cota bajo supuestos declarados, no medición) del primario en B≤1: 26-39%; del par primario+veta: 10-14%. El producto vende re-perfilado a 6 meses: sin gramática graduada, el entrenador verá mutar etiquetas y lo facturará como contradicción. Pre-registrar HOY los umbrales de estabilidad del re-test (M6) antes de que lleguen datos.
- **Alerta del crítico:** la excepción escrita de la regla ("salvo 2º eje con 0 votos") es decorativa: bajo el nulo ocurre con probabilidad ~2×10⁻⁷. Hoy la veta se imprime al 100%. No leer la deferencia del panel como validación del conector fijo.

### T5. ¿El motor se narra ya o se silencia?
- **Escalonado acordado:** (1) ya: que el composite legacy deje de decidir informes + higiene de régimen (C3); (2) interim: solo capa intra-niño que pase fiabilidad (razones, trend, con los gates de C2); (3) zonas absolutas: dark 4-6 semanas hasta la validación retrospectiva por banda de edad (computable en semanas con game_metrics ya persistido); si el score age-fair queda plano por edad, activar con "referencia bibliográfica", solo extremos, margen visible; si no, esperar la norma POR CELDA de edad.
- **Reloj corregido (M4):** el hito real no es "500 partidas" globales: al mix actual eso deja ~128 en la banda 8-11 (y menos en 8-9). Verificar qué mide exactamente el contador en curso.

### T6. ¿La "misma foto" se arregla en el instrumento o en el informe?
- **Secuencia recomendada:** la vía informe primero PERO con los gates del lado instrumento (narrar conteos literales no puede fabricar; reescribir sin datos sí; y el statu quo ya fabrica). Congelar contenido ~8 semanas para acumular la ventana v2 limpia; en paralelo, el retest study decide si hay que levantar el techo (T1).
- **La trampa vetada:** la vía informe SIN gates sería "la fábrica de diferencias falsas más eficiente de todo el sistema".
- **Y la hipótesis incómoda:** si los discriminadores (C7) dicen homogeneidad real, no perseguir más diferenciación de eje; narrarla con la cuantización abierta. Una foto homogénea de un grupo homogéneo ES una foto fiel.

---

## 5. Lo que agregó el crítico de completitud (nadie del panel lo vio)

**Lentes que faltaron** (para una segunda ronda si se quiere):
1. **Ética del etiquetado infantil:** nadie auditó qué hace el adulto con la foto (profecía autocumplida, etiqueta como apodo de vestuario, usos prohibidos no escritos: titularidad, comparaciones públicas). El niño es medido sin asentimiento ni devolución.
2. **Neurodivergencia:** el niño con TDAH acumula extraTaps y sale "Rápido" o protocolo sospechoso; el disléxico cae "Lento" por lectura. El índice de validez propuesto (ECD-07) degradaría en silencio SIEMPRE al mismo subgrupo: la respuesta inclusiva es invitar a repetir otro día, no degradar en silencio.
3. **Transcultural es/en/pt:** cada informe en/pt sale de un instrumento con n=1 y n=2 de evidencia. Los spot-checks ya encontraron 2 divergencias de constructo (pt "perde o ritmo" vs es "se frena"; "falló" solo en es). Auditar la matriz completa 3×48 AHORA (costo copy) + flag interno "traducción no validada".
4. **Diseño de juegos:** el arousal del minijuego previo puede sesgar la pregunta siguiente (carryover, medible con timestamps); el ORDEN de las preguntas es fijo por la narrativa; el niño no recibe ningún cierre ni voz.
5. **Privacidad del menor:** el panel pide más telemetría fina sobre menores sin login y nadie puso el marco (propósito por campo, retención, minimización; el "flag de toma grupal" es una inferencia sobre el ADULTO escrita en el registro del niño). Verificar alcance del consentimiento parental antes de sumar streams.
6. **Recepción del adulto (user research):** la bisagra de T4/T5 es una hipótesis nunca medida (que el hedge no viaja con la etiqueta). Un estudio de recuerdo a 48h con 10-15 entrenadores reales arbitra la decisión central más barato que cualquier estudio psicométrico. Es el único árbitro posible del dilema "identidad vs lectura de hoy".

**Hallazgos que nadie dijo:**
- **Contexto ≡ posición serial:** el shuffle baraja opciones, no preguntas; "inicio" es siempre ítems 1-2 y "adversidad" siempre 5-7. Cualquier deriva intra-sesión (fatiga, arousal) se imprime como "patrón de contexto". No corregible barajando (rompería la narrativa): narrar como "momento del viaje" o validar contra el gradiente serial de RT del propio niño.
- **Respuesta por proxy:** sin login, un protocolo asistido por el adulto es coherente, pausado y de B alto: invisible al person-fit. Y el régimen legacy ya etiquetó como "Rápido" (promedio <5s) a protocolos que no leían: el producto ya estampó protocolos inválidos como tempo.
- **El espejo anti-C:** C tuvo exposición posicional levemente FAVORABLE y aun así salió último (20% primarios, 13/86 secundarios). Neto de posición, la repulsión anti-C es mayor que la cruda (léxico adulto de sus opciones, PD-03). Falta la **alerta de piso por eje** (share <15% dispara auditoría de las opciones de ese eje): todas las watch-lists miran imanes, ninguna mira ejes reprimidos. Y post-shuffle C pierde ese subsidio: puede caer más.
- **El reloj de volumen:** el flujo es por camadas (55 en marzo, ~2 en abril-mayo, 14 en junio, 15 en la primera semana de julio). Los hitos "n≈200" pueden ser un año. Cada gate necesita FECHA además de n, y una camada nueva domina la ventana post-fix arrastrando su contexto de toma.
- **La voz del niño:** un cierre de auto-verificación de 1-2 taps al final ("¿cuál se parece más a ti?" entre las dos frases del posible dúo) daría validez externa per-child justo en la banda B≤1, asentimiento del menor, y un desempate intra-niño superior al RT. ~10-15 segundos. Corrobora el registro, nunca suma votos al nombre.

**Cómo NO leer este informe (riesgos de mala decisión):**
- **Las cifras de fabricación (79%, 6-24%, retest 26-39%, piso 28%) son COTAS derivadas bajo supuestos declarados, no mediciones del producto.** Repetirlas como hechos medidos llevaría a sobre-corregir (apagar todo, sobre-hedgear el 100%) castigando al ~30% bien tipificado, cuyo costo de sub-claim nadie costeó.
- **No leer la deferencia como validación:** el panel diseñó dentro de la REGLA DURA por respeto; el consenso cuantitativo dice que la veta con conector fijo es el número menos defendible del producto.
- **Absolución espuria post-shuffle:** el shuffle bajará la concentración de TODOS los ítems mecánicamente (respondedores posicionales → ruido). Los umbrales de "ítem sano" están sesgados a absolver. Leer la ventana post-shuffle solo sobre protocolos que pasen un screen mínimo de validez.
- **Cirugías incompatibles:** para Q5 hay 4 recetas, para Q9 tres, para Q7 dos. La ola v3 necesita UN dueño del spec, re-mapeo de dischSignals y una pasada final de la rúbrica sobre el SET completo, o fabricará imanes nuevos.
- **Parálisis por hitos sin fecha:** separar explícitamente lo ejecutable esta semana (no gateado por datos) de lo gateado; lo gateado lleva fecha calendario.

---

## 6. Decisiones que solo el owner puede tomar

| # | Decisión | Recomendación del panel | Costo de cada lado |
|---|---|---|---|
| D1 | **Formato most/least** | No ahora; pre-registrar el gate (n≈200 vs nulo estructural) y pilotar comprensión 8-10 en paralelo | Pick-one: retest bajo en B≤1, visible al re-perfilar. Most/least: +60-90s al niño, tercer reset del instrumento |
| D2 | **Veta: conector fijo vs graduado por B2** | Graduar (la recomendación más convergente del panel: 3 escuelas) | Fijo: imprime la estadística menos fiable del vector al 100%. Graduado: ~6 de 10 encabezados salen tentativos ("me venden un quizás") |
| D3 | **Encabezado: ¿identidad o lectura de hoy?** | Posicionar como "foto de hoy" + línea de expectativa | Identidad: los flips a 6 meses son contradicción de marca. Lectura: menos rotundidad comercial |
| D4 | **Motor: narrar ya vs escalonado** | Escalonado (intra-niño ya, zonas tras validación por edad) | Narrar ya: riesgo de tercera identidad del motor frente al mismo adulto. Callar: sección clave muda meses |
| D5 | **Presupuesto trimestre: cuestionario vs stealth** | ~70/30 (cuestionario decide, conducta se instrumenta una vez) | Ver careo T3 |
| D6 | **Si la homogeneidad resulta real (C7)** | Narrarla con cuantización abierta, no fabricar variedad | Comercial: el plantel "sale parecido" y hay que explicarlo |
| D7 | **Ola v3 de ítems: alcance y dueño** | Un solo spec, una sola ventana, con re-mapeo de contextos y rúbrica completa | Sin dueño: recetas incompatibles fabrican imanes nuevos |

---

## 7. Plan de acción propuesto

### H0. Esta semana (config, NO gateado por datos)
1. Matar tiebreaker grupal de eje y push grupal de motor (C1).
2. Telemetría por respuesta + `instrument_version`/`motor_regime`/`norm_version` + retro-etiquetado (C4/M3). El save ya persiste `question_version`: extender.
3. Gates de contingencia (3/3 o test exacto; copy "genuinamente suyo" solo gateada) y ritmoAcople (estandarizar por ítem + permutación, o silencio; rama nula = silencio real) (C2).
4. Zonas absolutas del motor dark; solo intra-niño (C3).
5. Correr los discriminadores de homogeneidad (C7) y el split-half retroactivo (C8). Computar la curva de finalización por ítem por edad.
6. Montar el tablero psicométrico con alertas (M7 + piso por eje del crítico): posición post-shuffle 25±4pp; entropía por ítem (<0.85 u opción >45%); exceso B-dist vs nulo estructural mensual; zonas de tempo por banda y régimen (una zona <10% = alarma); homogeneidad intra-plantel vs bootstrap; n por celda de edad; mix de registros; estabilidad de re-perfilados vs piso; **share primario por eje <15% = auditoría del eje reprimido**.
7. Sincronizar `onboardingDataV2.ts` (aún tiene Q8/Q10 viejas) y revisar que el editor admin (localStorage `argo_custom_questions`) no persista bancos viejos.
8. Pre-registrar por escrito: umbrales de la ventana post-shuffle, análisis de estabilidad del re-test por banda B, y métricas de diversidad para el switch v4 (definición constante pre/post).

### H1. Semanas 1-6 (copy quirúrgico + naming)
1. Q5 (imán probado): reescritura con dueño del spec v3.
2. Pase de copy S (devolver la cláusula de propósito en ≤9 palabras) es/en/pt (H2 redacción).
3. Si el owner aprueba D2/D3: conector de veta graduado, dúo B 0-1 con encuadre evolutivo, línea de expectativa, caso opuesto-diagonal definido.
4. Dashboard de plantel: eje + forma + registro + conteos (C6), PREVIA derivación del nulo de "forma".
5. Auditoría de equivalencia es/en/pt de la matriz 3×48 + flag "traducción no validada".
6. Watch-list activa para Q1/Q7/Q9/Q11/Q12/Q3/Q2 y las nuevas Q8/Q10 con los umbrales pre-registrados.

### H2. Mes 2-3 (método, gateado)
1. Lectura del gate T1 (n≈200 o fecha límite): pick-one basta o piloto most/least (n≈30, 8-10 años).
2. Ola v3 ÚNICA de ítems: re-situar Q9 (suplencia) + escena social-evaluativa o de fricción entre pares (con revisión de seguridad emocional 8-10) + reagrupación de contextos 4×3 + re-mapeo dischSignals + rúbrica completa (heroísmo 4/4 + elogiabilidad + ambas dimensiones del circumplejo por opción).
3. Cartas de Islas Desconocidas: loggear contenido elegido en shadow; contrastes diseñados no sociales.
4. Validación retrospectiva del motor por banda de edad → activar zonas o esperar norma por celda.
5. Cierre de auto-verificación del niño (1-2 taps) si pasa diseño anti-deseabilidad.

### H3. Investigación continua
1. Test-retest formal (n≥40, 2-4 semanas, fuera del flujo comercial; viable con `/play/r/:token` saltando el gate de 6 meses para cohorte de estudio).
2. Estudio de recepción con 10-15 entrenadores (recuerdo a 48h del encabezado y los conectores): árbitro de D2/D3.
3. Normas por celda de edad (reformular el contador); DIF por banda etaria a n≥300; invariancia por idioma (moratoria de afirmaciones en/pt hasta n≥30 por idioma; norma etiquetada "ES").
4. Los re-perfilados a 6 meses como experimento pagado: estabilidad por banda B contra el piso, con umbrales ya pre-registrados.

---

## 8. KPIs de "la foto mejoró" (resumen)

1. Exceso de B≥4 observado sobre el nulo estructural (meta: positivo y creciente).
2. Entropía por ítem ≥0.85 y ninguna opción >40-45%.
3. Share por posición 25±4pp post-shuffle.
4. Share primario por eje entre 15% y 40% (alerta de imán Y de piso).
5. Homogeneidad intra-plantel vs bootstrap de planteles sintéticos.
6. Estabilidad del primario en re-perfilados, por banda B y registro, vs piso estructural.
7. Zonas de tempo por banda de edad sin degenerar (ninguna <10%).
8. % de informes por registro de tono (mix estable, no degenerado).

---

*Generado el 2026-07-08 con panel multi-agente (8 expertos + 6 careos + crítico, 15 agentes). Los IDs (PSI-01, h3, H5, PD1, ECD-02, M6...) refieren al anexo con el texto completo de cada hallazgo. Las tasas citadas bajo "el nulo" son derivaciones bajo supuestos declarados, no mediciones del producto.*
