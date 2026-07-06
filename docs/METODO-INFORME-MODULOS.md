# Plan de enriquecimiento de módulos del informe

> Análisis de las secciones reales del informe + los datos deterministas disponibles, para decidir qué quitar, enriquecer y agregar. Cada módulo nuevo exige un número atrás (regla de oro). Producido y verificado adversarialmente el 2026-07-06 (inventario real -> panel de 3 ángulos -> síntesis -> 3 lentes de verificación).

## Correcciones clave de la verificación (aplicar sobre la propuesta de la Parte A)

1. **A2 ("un momento que lo mostró") NO es shippeable hoy tal cual.** Las respuestas se guardan como `{axis, responseTimeMs}` SIN identidad de pregunta (no hay `question_id`). Para citar la escena real de forma determinista hay que **persistir `question_id` por respuesta + versionar el banco de preguntas**. Extiende la decisión D8 (guardar todo). Hasta entonces, A2 no cumple su propia regla de oro.
2. **A2 debe ser un mapa fijo + texto literal de la pregunta, NUNCA IA.** El copy de ejemplo interpretaba la elección ("eligió esperar y observar antes de decidir") = justo la alucinación que se quiere evitar. Solo se cita "eligió la opción X" verbatim, sin narrar intención.
3. **F6 (sub-motores) es BARATO, no caro.** `game_metrics` ya persiste los tres sub-vectores (impulso/ritmo/adaptación); solo se colapsan. E2/A6 pasan a Tier 1 (S), no Ola 4 (L).
4. **Colapsar redundancias:** E1/A1/A5 son el mismo hecho (brecha F4) -> una sola superficie por vista. E3/A3 idem (un solo clasificador de ritmo; reusar `classifyDecisionPattern`, no inventar un segundo). A10/A12 narran el mismo delta.
5. **Copy/valores:** renombrar "Motor de rendimiento" quitando "rendimiento" en AMBAS vistas (proceso, no resultado); reencuadrar lenguaje de déficit ("se dispersó", "de más", "lo desborda"); nunca exponer un número 0-1 (se lee como puntaje); pasar todo heading por el hook de guiones.
6. **Casos nulos obligatorios:** A2 necesita rama para el niño consistente (citar su escena más representativa del dominante); el bloque de evolución necesita placeholder "esperando la segunda fotografía" para el niño de una sola foto.

---

# Parte A — Propuesta única

# Propuesta única de enriquecimiento del informe Argo

**Metodólogo jefe — síntesis de los tres ángulos (inventario, coach, familia, evolución).**

Regla de oro aplicada sin excepción: **sin hecho determinista atrás (campo F1–F11, `answers[]`, `responseTimeMs` o un diff sobre esos), el módulo no entra.** Todo lo que hoy es "IA libre con forma de dato" se quita o se ancla.

## Decisión estructural que ordena todo (resuelve la mayor discrepancia)

Los tres ángulos chocan en "quitar vs. conservar" (Ecos, Checklist, Reset) **porque están discutiendo audiencias distintas sobre el mismo render**. `ReportPage.tsx` sirve hoy al coach y al adulto con el mismo árbol. La resolución no es borrar globalmente: es **introducir un `viewer` (coach | adulto)** y rutear secciones. Una sección sin hecho no se salva por rutearla, pero varias "peleas" se disuelven así.

> Discrepancia Ecos (coach lo quita / familia lo necesita) → **se rutea**, no se borra: fuera del informe del coach, vive en el de familia / ArgoPuente®. Justificación: su marco "fuera de la actividad" es material del adulto, no de cancha.

---

## (1) QUITAR

| # | Módulo | Por qué sale | Destino |
|---|---|---|---|
| **Q1** | Campos de salida muertos: `axisCounts`, `sessionId`, `wow`, `perfilExtended` | Sin consumidor en el render; `axisCounts` duplica el conteo F1 que AxisBars recomputa inline (dos fuentes de verdad). Deuda + superficie para que la IA los "rellene". **Consenso de los tres ángulos.** | Borrar de la interfaz de salida. Unificar AxisBars para leer una sola fuente F1. Dejar `corazon`/`grupoEspacio`/`wow` **explícitamente marcados como insumo de prompt**, nunca salida. |
| **Q2** | **Checklist del día (Antes/Durante/Después)** en la vista de familia | Es IA libre; su fuente declarada (F8/F10/F5/F11) **no se inyecta** → hoy es coaching de día de partido inventado. Además excluye por diseño al adulto que nunca va a una práctica. | Quitar de `viewer=adulto`. En `viewer=coach` **solo sobrevive si se ancla** a F8+F10 reales (si no, cae también). Su lugar en familia lo toma A1 ("En casa vas a notar"). |
| **Q3** | **Consejo de reset** (`reseteo`) tal como está | IA libre que dice mirar F10b (coherencia bajo presión) y F10; **ninguno existe**. Genérico por arquetipo con barniz individual. | **Anclar a F10b (→ A7) o quitar.** No queda "como está". |
| **Q4** | La **condicionalidad** de "Tendencia secundaria" | Aparece/desaparece según si la IA escribió texto → rompe lectura comparable entre dos niños y viola el contrato §7 ("nunca se saltee"). | No se quita la sección: se quita la condicionalidad (→ E4). |
| **Q5** | Cualquier "trayectoria proyectada", "score/% de mejora", "relato IA del cambio" | Del ángulo evolución: proyección = predicción sin campo; "mejora" = juicio de valor prohibido; IA como **fuente** del delta = alucinación garantizada. | Fuera por diseño. Un delta se muestra como **movimiento neutro**; si la IA interviene, solo viste un número ya calculado y validado (como el ground-truth de eje actual). |

---

## (2) ENRIQUECER (secciones vivas que sub-usan un dato determinista)

**E1. AxisBars "Composición del perfil" (F1) → sumarle la banda de forma/confianza (F4/F4b).**
- Qué agrega: una línea que dice **cuán marcado** salió el perfil, para que un 9-1 y un 5-4 dejen de narrarse igual.
- Fuente exacta: **cómputo nuevo sobre `votos` ya contados.** `brecha = top_count − second_count`; `n_ejes_fuertes` = ejes con conteo ≥ (top_count − 1). Umbrales fijos → pico / con matices / combinado. Sin IA.
- **Es la capa de honestidad entera (F4) que hoy falta. Los tres ángulos la piden. Máxima prioridad.**

**E2. "Motor de rendimiento" (F5) → individualizar con sub-motores (F6) + renombrar por viewer.**
- Qué agrega: matiz de ritmo propio (arranca rápido y sostiene / entra de a poco) en vez del texto genérico por arquetipo. En `viewer=adulto`, renombrar heading a **"Su ritmo natural"** (la palabra "rendimiento" no va al ángulo familia).
- Fuente exacta: **F6, sub-puntajes del mini-juego.** **DEPENDE de instrumentar y persistir F6** (hoy no se computa). Sin esa captura, no entra. Si `motor_divergencia` es alta, el copy degrada a neutro.

**E3. "Patrón de decisión" (F8) → micro-lectura de ritmo por bloque.**
- Qué agrega: además de rápido/reflexivo, si resolvió parejo o se tomó más tiempo hacia el final.
- Fuente exacta: **cómputo nuevo sobre `answers[].responseTimeMs`** (ya llegan, hoy solo alimentan la categoría F8). Partir en tercios por orden, comparar medianas. Sin IA.

**E4. "Tendencia secundaria" (F3/F9) → siempre presente y ponderada por `second_count`.**
- Qué agrega: mismo contenido, pero el énfasis depende de la fuerza real del secundario, no de si la IA escribió. Resuelve Q4.
- Fuente exacta: **`second_count`, computado desde `votos`** (hoy no se calcula). Si el secundario es débil, el copy lo dice ("apenas se asoma"); si es fuerte, lo marca. Combina con la brecha de E1.

**E5. "Palabras puente/ruido" (F11+F3) → condicionar los "extra" a `second_count`.**
- Qué agrega: los matices de ruido del secundario aparecen con fuerza **solo si `second_count` supera umbral**; en un pico limpio no se carga al adulto con matices que no aplican. Encabezar como "palabras que suelen abrir/cerrar" (uso en casa, no solo cancha).
- Fuente exacta: F11 (base arquetipo) + F3 (`second_count`). Sin IA.

---

## (3) AGREGAR (módulos nuevos)

Leyenda de esfuerzo: **XS** aritmética sobre datos que ya llegan · **S** cómputo nuevo + tabla autoral · **M** requiere construir un campo de ficha · **L** requiere instrumentar captura o persistencia. **[D8]** = depende de la persistencia de perfilamientos (segunda foto / evolución).

### Bloque A — Honestidad y reconocimiento (informe individual)

**A1. "Confianza del retrato" — sello de firmeza (F4).**
- Qué dice: sello visible (marcado / con matices / combinado) al inicio, para saber cuánto apoyarse en la lectura antes de leer el resto.
- Fuente: `confianza_tier` derivado de la `brecha` de E1. Umbrales fijos sobre el total de respuestas. **Sin IA.**
- Por qué es seguro: resta de dos enteros contra umbral → una rama de copy. Vacuna contra tratar un 5-4 como certeza.
- Copy: *"Lectura con matices: el niño mostró una tendencia clara, con un segundo estilo presente. Úsala como punto de partida y ajústala con lo que veas."*
- Esfuerzo: **XS.** Convergen coach (A2) y familia (A5).

**A2. "Un momento que lo mostró" — la escena que eligió (versión computable HOY).**
- Qué dice: cita **un momento concreto** del viaje donde el niño eligió una opción de un eje distinto al dominante (o su escena firma). Es lo que hace que el informe suene a ESTE niño y da al adulto/coach un ancla real.
- Fuente: **cómputo sobre `answers[].axis`** (el eje elegido ya se conoce). Se detecta la respuesta cuyo eje ≠ `eje_dominante` y se cita la **escena literal, texto fijo de la pregunta**. Sin IA generativa: se describe la elección, nunca el porqué.
- Por qué es seguro: es literalmente lo que el niño eligió; o eligió esa opción o no. Reproduce un dato, no lo interpreta.
- Copy: *"Aunque en general se inclinó hacia la acción, hubo un momento en que eligió esperar y observar antes de decidir. Puede ser un buen punto para conversar sobre cómo se sintió ahí."*
- Esfuerzo: **S.**

> Discrepancia A2 (coach: computable ya sobre `answers[].axis` / familia A6: necesita tabla F10 escena×opción). **Elijo dos fases:** MVP ahora con `answers[].axis` + texto de la pregunta (ship inmediato); upgrade a la tabla autoral curada de escenas firma (F10) cuando se construya. Justificación: el reconocimiento es el mayor salto de valor y no hay razón para esperar a F10 para la versión honesta mínima.

**A3. "Ritmo de atención / Su tiempo para decidir" (F8 extendido).**
- Qué dice: cuánto tarda el niño y si sostuvo el ritmo o se dispersó hacia el final, traducido a una acción (cuánto esperar antes de intervenir). Sirve igual al adulto que nunca va (tareas, transiciones).
- Fuente: **mediana + dispersión de `answers[].responseTimeMs`** por bloque (ya llegan). Bucketizado a 3 bandas fijas → copy fijo. Sin IA.
- Por qué es seguro: aritmética sobre tiempos registrados; framing descriptivo de ritmo, nunca "rápido = bueno".
- Copy: *"El niño tiende a tomarse unos segundos de más antes de elegir. Eso no es duda, suele ser su forma de mirar bien antes de decidir. Si le das ese tiempo, es probable que responda más suelto."*
- Esfuerzo: **XS.** Convergen coach (E3/A4), familia (A2), evolución (E2/A4).

### Bloque B — Vida en casa (informe de familia, `viewer=adulto`)

**A4. "En casa vas a notar" (reemplaza el checklist quitado, Q2).**
- Qué dice: 2-3 conductas observables del día a día, para el adulto que nunca ve una práctica.
- Fuente: **matriz autoral fija `eje_dominante` (F2) × `patron_decision` (F8)** → celda con frase observable. Lookup en tabla, la IA no redacta.
- Por qué es seguro: la salida es una celda indexada por dos valores deterministas.
- Copy: *"Aunque no lo veas jugar, en el día a día suele decidir después de mirar un rato antes de moverse. Suele fluir mejor si le das ese momento en vez de apurarlo."*
- Esfuerzo: **S.**

**A5. "Es una mezcla, no una etiqueta" (F4/F4b, cara compasiva de A1).**
- Qué dice: si la brecha entre eje 1 y 2 es chica, se lo dice explícito al adulto para que no encasille al niño.
- Fuente: misma `brecha`/`n_ejes_fuertes` de E1/A1, rama de copy protectora. Sin IA.
- Copy: *"Dos formas de ser aparecen casi con la misma fuerza. El niño las combina según el momento; tómalo como un boceto de hoy, no como una única manera de ser."*
- Esfuerzo: **XS** (reusa E1). Es el hedging más protector del set.

**A6. "Cómo arranca" (F6, cara familiar del motor).**
- Qué dice: si enciende rápido o entra de a poco, y qué significa en transiciones de casa (mañanas, cambiar de actividad, arrancar la tarea).
- Fuente: **F6 sub-motores** (`impulso` vs `ritmo`/`lag`) contra cortes fijos → estado → copy autoral. **DEPENDE de construir/persistir F6.**
- Esfuerzo: **L** (instrumentación del mini-juego).

**A7. "Cuando la cosa se pone intensa" (F10b, ancla del reset — resuelve Q3).**
- Qué dice: si el niño sostiene su forma habitual cuando algo lo desborda o cambia de registro. Ancla el "Consejo de reset" que hoy es IA libre.
- Fuente: **comparar la opción elegida en la escena de presión (F10 `tormenta_divergente`) contra `eje_dominante`** → coincide "sostiene" / diverge "cambia de registro". Binario → copy fijo. **DEPENDE de construir F10/F10b.**
- Esfuerzo: **M.**

### Bloque C — Conjunto (dashboard del plantel/coach, NO en el PDF del niño)

**A8. "Cómo leer tu equipo" — composición del plantel.** *(módulo estrella del ángulo coach)*
- Qué dice: reparto de ejes y motores del equipo; hoy el informe es 100% por-niño y el coach no tiene lectura de conjunto.
- Fuente: **group-by de `eje_dominante` (F2) y `motor` (F5) de `current_perfilamiento` sobre los `child_id` del plantel** (`group_members`). Puro conteo, cero IA.
- Por qué es seguro: cuenta perfiles ya calculados; no infiere química (eso sería alucinable y queda fuera).
- Copy: *"En este equipo predominan perfiles orientados a la acción, con pocos de sostén. Cuando armes propuestas que pidan calma, quizás valga apoyarte en los pocos niños que tienden a ese registro."*
- Esfuerzo: **S.**

**A9. "Pares y contrastes del plantel" (extensión de A8, opcional).**
- Qué dice: qué niños comparten eje (se refuerzan) y qué ejes faltan en el equipo.
- Fuente: misma agregación de A8, otra vista. Determinista.
- Esfuerzo: **XS** sobre A8.

### Bloque D — Evolución / el foso **[TODO ESTE BLOQUE DEPENDE DE D8]**

> El foso: persistir la ficha por perfilamiento convierte cada campo F1–F11 en **serie temporal por niño**. Comparar dos fotos es **aritmética sobre campos ya almacenados** — cero para inventar. El competidor de cuestionario de un solo tiro no puede producirlo. Guardrail obligatorio en todo módulo: **delta neutro** (nunca "mejoró"), **dos fotos no una flecha**, **movimiento chico = normal y esperable**, probabilístico siempre, cierre reusando el footer ("dos fotografías del presente").

**Tier 1 — envían sin backfill** (las materias primas `answers[]`+`responseTimeMs`+`created_at` ya se guardan; se recomputa el histórico):

**A10. AxisBars con foto anterior (F1 × 2).** Barra fantasma "hace ~6 meses" detrás de cada eje. Fuente: `votos_pct` recomputado de ambos perfilamientos, resta por eje. **XS.** Copy: *"La marca tenue muestra cómo se repartían hace unos meses. Los movimientos chicos son normales."*

**A11. Continuidad de perfil (F11 × 2).** Una línea: mismo arquetipo (continuidad) o vecino (nombrando ambos). Fuente: igualdad de `arquetipo_id`. **XS.** Copy: *"Hoy se acerca a [B]; antes a [A]. Son perfiles vecinos: cambió el acento, no toda la persona."*

**A12. Índice de movimiento del perfil (cómputo nuevo sobre F1).** Un número 0–1: cuánto se reacomodó la distribución. Fórmula cerrada: `mov = 0.5·Σ|pct_t1−pct_t0|` → banda verbal (bajo/medio/alto), **nunca "puntaje de mejora"**. **S.**

**A13. Estabilidad de respuestas (cómputo nuevo sobre `answers[]`, con gate).** De las preguntas repetidas, en cuántas eligió en la misma dirección. **Gate de seguridad:** solo si `question_version` coincide; si el banco cambió, degrada a A12. **S.** Copy: *"En la mayoría de las situaciones repetidas respondió en la misma línea. Da una base consistente, más allá de los ajustes propios de la edad."*

**A14. Patrón/ritmo de decisión con antecedente (F8 × 2).** Si antes decidía distinto. Fuente: `classifyDecisionPattern` sobre ambas fotos + delta de mediana de tiempo. **XS.**

**A15. Motor con nota de estabilidad (F5 × 2).** Si el motor se mantiene ("rasgo estable") o se movió (sin dramatizar). Igualdad de strings. **XS.**

**A16. Tendencia secundaria con dirección (F3 × 2).** Si la segunda inclinación se afirmó o se diluyó. Delta de `second_count`. **XS** (sobre E4).

**Tier 2 — encolar detrás de construir F4/F6/F10:**
- **A17. Nitidez en el tiempo (F4 brecha × 2)** — foto más definida o más mezclada. **M.**
- **A18. Forma en transición (F4b × 2)** — pico↔dúo↔disperso. **M.**
- **A19. Sub-señal del motor que se movió (F6 × 2)** — cuál subpuntaje cambió. **L.**
- **A20. Escenas repetidas vs. cambiadas (F10 × 2)** — si repitió su escena firma. "A este niño a lo largo del tiempo". **M.**

---

## Orden final por impacto/seguridad

**Ola 1 — barato, arregla el riesgo de honestidad más grande, consenso de los tres ángulos:**
1. **E1 + A1 + A5** (banda de forma/confianza F4) — aritmética sobre votos ya contados. Un 5-4 deja de narrarse como un 9-1. **XS.**
2. **Q1 + Q4 + E4** (limpieza de campos muertos + tendencia siempre presente ponderada) — en paralelo, bajo costo.

**Ola 2 — máximo "suena a ESTE niño" y valor de conjunto, todo sobre datos que ya llegan:**
3. **A2** (momento que lo mostró, MVP sobre `answers[].axis`) — reconocimiento, cero instrumentación. **S.**
4. **A8 + A9** (leer el equipo) — mayor salto para coach/institución, solo group-by. **S.**
5. **E3 + A3 + A4** (ritmo por tiempos + "en casa vas a notar") — `responseTimeMs` subexplotado + matriz autoral. **XS–S.**

**Ola 3 — el foso, D8, sin backfill (esto no lo tiene nadie):**
6. **A10 → A11 → A14 → A12 → A13** (Tier 1 evolución) — se activan cuando un niño tiene 2 perfilamientos resueltos. Empezar por E1/AxisBars-con-foto porque reusa cómputo existente.

**Ola 4 — requiere construir campos de ficha (encolar detrás de `buildEvidenceFicha`):**
7. **F4b → A18 → A17**, luego **F10 → A2 (upgrade) / A7 / A20**, por último **F6 → E2 / A6 / A19** (arrastra instrumentar el mini-juego, el más caro).

---

## Dónde aterriza (archivos)
- Cómputos nuevos (brecha F4, `second_count`, medianas de tiempo, coherencia A7, deltas D8): `src/lib/argosEngine.ts` junto a `getReportData`.
- Tablas autorales estáticas (A4 eje×patrón, A2/A20 escena×opción): mapas nuevos tipo `src/lib/archetypeData.ts`.
- Render + gate `viewer` (coach|adulto) y nuevas secciones tras el lock: `src/pages/ReportPage.tsx`.
- Vista de plantel (A8/A9): dashboard del coach, no el PDF.
- Ficha F4/F4b/F6/F10/F10b sigue siendo diseño TARGET (`docs/METODO-INFORME-DETERMINISTA.md` §1.3/§4/§6.4): A6, A7, A17–A20 y el upgrade de A2 dependen de construir `buildEvidenceFicha`. Todo lo demás se construye ya con `answers`, `responseTimeMs`, `votos`, `eje`, `motor`.

**Nada en Olas 1–3 depende de generación libre de IA.** Cada módulo sale de un campo F ya vivo, de un cómputo cerrado sobre datos que ya llegan, o de un diff entre dos fotos almacenadas. Sin número atrás, no entró.

---

# Parte B — Verificación adversarial (detalle)

## Lente: COPY Y VALORES (CON_HUECOS)

La mayoría de los copy citados cumple las reglas Argo: buyer-neutral consistente ("el niño"/"el adulto", nunca "tu hijo"), tuteo correcto en todos los imperativos ("úsala", "ajústala", "tómalo", "das", "armes"), lenguaje probabilístico ("suele", "tiende", "es probable", "quizás"), y ningún ejemplo user-facing contiene guiones (usan dos puntos y punto y coma). A5 ("no una etiqueta") y Q5 (elimina "score/% de mejora") son defensas de valores bien puestas. PERO quedan huecos: (1) framing de déficit encubierto en A3 ("se dispersó", "segundos de más") y A7 ("lo desborda") que roza los módulos Foco/Presión deliberadamente OUT; (2) "Motor de rendimiento" mantiene la palabra rendimiento en la vista coach, contra el marco no-competitivo; (3) A12 propone renderizar un número 0-1 que se lee como puntaje/nota del niño; y (4) la superficie de alucinación real está en el copy conectivo de A2, que interpreta la elección del niño ("eligió esperar y observar antes de decidir") en vez de solo citarla. Ningún hallazgo es estructural: todos se corrigen a nivel de copy o de qué se renderiza.

- **[ALTA] A2:** El guardrail dice "se describe la elección, nunca el porqué", pero el copy de ejemplo SÍ interpreta la elección: "hubo un momento en que eligió esperar y observar antes de decidir". "Esperar y observar" y "antes de decidir" son una lectura del significado del eje elegido, no la escena literal. Si esa frase conectiva la redacta la IA, reinterpreta y etiqueta la elección del niño = alucinación + etiquetado, la superficie exacta que la propuesta dice cerrar. Es el único módulo de la Ola 1-2 donde el copy no sale de una tabla fija.  
  _fix:_ Prohibir texto libre en A2. El copy debe ser: (a) frase conectiva de un mapa fijo eje→verbo neutro (nunca AI), y (b) el texto literal de la pregunta tal cual está en el banco. Describir SOLO "eligió la opción X" citando la opción textual; jamás narrar intención ("antes de decidir", "para mirar bien"). Documentar que ningún token de A2 pasa por Gemini.
- **[MEDIA] A3:** El framing del módulo usa lenguaje de déficit: "si sostuvo el ritmo o se dispersó hacia el final" y el copy dice "se toma unos segundos de más". "Dispersarse" y "de más" connotan falla de atención / lentitud, y el módulo Foco fue deliberadamente sacado (memoria: Focus OUT). Traduce tiempo de respuesta a un juicio implícito de atención.  
  _fix:_ Reframear a ritmo neutro: en vez de "se dispersó hacia el final" usar "fue variando su ritmo hacia el final"; en el copy quitar "de más": "El niño tiende a tomarse unos segundos antes de elegir. Eso no es duda, suele ser su forma de mirar bien antes de decidir." El resto del copy ya está bien reencuadrado.
- **[MEDIA] E2 / A6:** El heading "Motor de rendimiento" conserva la palabra "rendimiento" en viewer=coach. La propuesta solo lo renombra a "Su ritmo natural" en familia, pero "rendimiento" es vocabulario de performance/competencia que Argo evita (sin ganar/talento/etiquetas; marco de "la actividad", no de resultado). El coach también debería recibir copy no-competitivo.  
  _fix:_ Renombrar el heading en AMBOS viewers a algo descriptivo del proceso, no del resultado: "Cómo se enciende" / "Motor de acción" / "Su ritmo natural". Reservar "rendimiento" para ningún surface del informe.
- **[MEDIA] A12:** Propone "Un número 0–1: cuánto se reacomodó la distribución". Aunque aclara que se muestra la banda verbal, describe explícitamente rendir un número. Un 0-1 visible al adulto se lee como puntaje/nota del niño, contra el valor "nunca puntaje" y "centrado en el niño, no en la métrica".  
  _fix:_ Especificar que el número 0-1 es SOLO interno para computar la banda; el render muestra únicamente "bajo/medio/alto movimiento" con copy neutro. Nunca exponer el índice numérico en UI ni PDF.
- **[BAJA] A7:** El copy/framing usa "cuando algo lo desborda". "Desbordar" patologiza (registro clínico/estrés), y el módulo Presión fue DEFERRED por diseño. El propio título ya ofrece una alternativa neutra ("cuando la cosa se pone intensa") que no se usa en la descripción.  
  _fix:_ Usar consistentemente el registro del título: "cuando algo se pone intenso o cambia de golpe". Evitar "desborda"/"lo supera". El binario sostiene/cambia-de-registro ya es neutro; solo ajustar la palabra gatillo.
- **[BAJA] A1:** Habla de un "sello visible" de firmeza estampado "al inicio". Un "sello" sobre el niño entra en tensión con A5 ("no una etiqueta"): visualmente un badge de categoría se lee como rótulo. Además el copy de ejemplo afirma "tendencia clara", frase que sería falsa/sobre-confiada en la rama "combinado" (5-4).  
  _fix:_ Framear A1 como confianza DE LA LECTURA, no como sello sobre el niño ("esta lectura es más/menos definida", no "el niño es X"). Y garantizar copy distinto por tier: la rama combinado debe reflejar A5 ("dos formas casi con la misma fuerza"), nunca decir "tendencia clara".
- **[BAJA] General (headings/copy a UI):** La prosa de la propuesta usa em dashes de forma masiva. Los ejemplos de copy citados están limpios, pero varios títulos de módulo y frases nacen en ese texto con guiones; si se portan literalmente a headings del informe violarían la regla de no-guiones.  
  _fix:_ Al implementar, pasar cada heading y copy por el hook de puntuación (reemplazar cualquier — por punto, coma o paréntesis). Verificar en particular subtítulos derivados de la propuesta antes de renderizar.

## Lente: REDUNDANCIA / ESTRUCTURA (CON_HUECOS)

La propuesta aplica bien la lente a lo existente (Q1 elimina axisCounts como segunda fuente de verdad; Q4/E4 mata la condicionalidad de "Tendencia secundaria", que verifiqué renderiza hoy solo con `report.tendenciaParagraph &&` en ReportPage §6). Pero es internamente inconsistente: mientras arregla la presencia condicional de Tendencia, introduce módulos nuevos con la misma falla sin caso nulo (A2 en MVP, A5) y varias redundancias donde 2-3 módulos consumen el mismo cómputo determinista y lo narran dos veces (brecha F4 en E1/A1/A5; responseTimeMs por bloque en E3/A3; deltas F1 en A10/A12; group-by en A8/A9). Ningún módulo abre superficie de IA libre (la regla de oro se respeta), pero sí hay pisadas de estructura y doble render del mismo hecho. Se arregla eligiendo una sola superficie por hecho y dando a cada módulo condicional una rama nula para todos los niños.

- **[ALTA] A2 (Un momento que lo mostró) — MVP:** Presencia condicional sin caso nulo. A2 MVP cita una respuesta cuyo eje != dominante sobre answers[].axis. Un niño perfectamente consistente (todas sus elecciones en el eje dominante) NO tiene ningún momento divergente que citar. El fallback 'o su escena firma' depende de la tabla F10 (fase upgrade), que no existe en el MVP. Resultado: en MVP el módulo aparece solo para los niños con elecciones divergentes y desaparece para el niño consistente. Rompe 'iguales en estructura' y crea silueta de informe distinta entre dos niños.  
  _fix:_ Definir una rama nula computable YA sin F10: si no hay respuesta de eje distinto, citar la escena/pregunta mas representativa del eje dominante (la de mayor separacion o la primera del dominante) con copy 'sostuvo su forma en...'. Asi TODO niño recibe el modulo. No shippear el MVP sin esa rama.
- **[MEDIA] E1 + A1 + A5 (banda de forma / sello de confianza, brecha F4):** Triple render de un unico computo. E1 (banda 'cuan marcado' dentro de AxisBars), A1 (sello al inicio) y A5 (cara compasiva familia) derivan TODOS de la misma brecha/n_ejes_fuertes. Dentro de un mismo viewer=coach conviven E1 y A1, que enuncian el mismo hecho 'cuan marcado salio el perfil' dos veces (banda en las barras + sello arriba). Es exactamente la redundancia de dos superficies para un dato que la propia propuesta condena en Q1.  
  _fix:_ Un solo hecho, una sola superficie por viewer. Elegir E1 (banda integrada a AxisBars) O A1 (sello suelto), no ambos en la misma vista. A5 queda como rama de copy del mismo componente ruteado a familia, nunca un tercer render independiente.
- **[MEDIA] E3 + A3 (ritmo de decision sobre responseTimeMs):** Mismo computo, misma salida, dos modulos. E3 'micro-lectura de ritmo por bloque' (tercios por orden, medianas) y A3 'su tiempo para decidir' (mediana + dispersion por bloque) operan sobre el MISMO answers[].responseTimeMs particionado por bloque y producen la misma lectura ('resolvio parejo o se tomo mas tiempo hacia el final' == 'sostuvo el ritmo o se disperso hacia el final'). El propio orden final los agrupa ('E3 + A3 + A4'), señal de que son uno.  
  _fix:_ Fusionar en un unico modulo de ritmo de decision (una linea que combina rapidez base + dispersion hacia el final). Borrar el duplicado; que E3 sea el enriquecimiento del render y A3 su copy, no dos entradas.
- **[MEDIA] A5 (Es una mezcla, no una etiqueta):** Presencia condicional sin caso nulo si se lista como modulo propio. Por su titulo A5 solo tiene sentido cuando la brecha eje1-eje2 es chica; para un niño de pico limpio (9-1) no aplica y no se define que ve la familia en su lugar. Como modulo independiente aparece solo para algunos niños.  
  _fix:_ No tratar A5 como modulo: es UNA rama del sello de confianza familia siempre presente, que tiene tres ramas (marcado / con matices / combinado). El niño de pico limpio recibe la rama 'marcado' del mismo componente, preservando estructura comparable.
- **[MEDIA] Bloque D completo (evolucion):** Todo el tier aparece solo para niños con 2+ perfilamientos resueltos y la propuesta no define el estado nulo para el niño de una sola foto. El gate por condicion-de-dato es defendible y uniforme, pero sin un placeholder explicito la silueta del informe difiere entre un niño con una foto y otro con dos, sin marcar por que.  
  _fix:_ Definir un estado nulo explicito y uniforme: bloque 'Evolucion' siempre presente en el esqueleto con copy placeholder 'Esperando la segunda fotografia (proximo perfilamiento a los ~6 meses)'. Asi la estructura es igual para todos; solo cambia el contenido.
- **[BAJA] A10 + A12 (foto anterior AxisBars + indice de movimiento):** Doble narracion del mismo delta + roce con Q5. A12 (indice 0-1 = 0.5·Sigma|pct diff|) es el agregado escalar de los mismos deltas por eje que A10 ya muestra como barra fantasma. Ademas un indice 0-1 se lee como 'score de movimiento', justo el tipo de numero que Q5 quiere desterrar, pese al disclaimer.  
  _fix:_ No surfacear un escalar aparte: plegar A12 en la banda verbal de A10 (bajo/medio/alto) sin exponer el numero. Un solo modulo de movimiento con las barras + una etiqueta verbal, no barras + indice numerico.
- **[BAJA] A13 (estabilidad de respuestas):** Al degradar a A12 cuando question_version no coincide, dos niños con 2 perfilamientos cada uno pueden recibir modulos estructuralmente distintos (uno ve 'estabilidad de respuestas', otro 've 'indice de movimiento'). El fallback existe (bien) pero cambia la superficie, no solo el contenido.  
  _fix:_ Mantener A12 (banda de movimiento) como columna vertebral siempre visible; A13 pasa a ser una anotacion opcional SOBRE ese modulo cuando question_version coincide, no un swap del modulo entero. Asi la estructura no cambia entre niños.
- **[BAJA] A8 + A9 (composicion del plantel):** Redundancia reconocida por el propio autor: A9 es 'misma agregacion, otra vista' del group-by de A8. Dos entradas de modulo para un unico computo.  
  _fix:_ Colapsar A9 dentro de A8 como un detalle/expansion del mismo panel (pares que comparten eje + ejes ausentes), no un modulo separado.
- **[BAJA] E2 + A6 (motor F6 por viewer):** Mismo computo F6 (sub-motores) enunciado como dos modulos separados (coach 'su ritmo natural' / familia 'como arranca'). Aceptable si es puro ruteo por viewer, pero listado como dos modulos arriesga dos computos/dos fuentes cuando F6 se construya.  
  _fix:_ Explicitar que E2 y A6 son un unico computo F6 ruteado por viewer (una funcion en argosEngine, dos strings de copy), no dos modulos con logica propia.

## Lente: FUENTE DETERMINISTA — para cada módulo (agregar/enriquecer), ¿existe un campo F1–F11, un valor ya en `answers[]`/`game_metrics`/`votos`, o un cómputo cerrado bien definido que lo alimente, sin que la IA invente el dato o la escena? (CON_HUECOS)

La propuesta es en su mayoría disciplinada con la regla de oro: la Ola 1 completa (E1/A1/A5 banda de confianza, Q1/Q4/E4 secundaria ponderada) tiene fuente REAL y verificada — resolveProfile ya computa axisCounts, secondCount y diff (incluso el >= topCount−1 de n_ejes_fuertes ya está en código), y A8/A9/A10/A11/A12/A15/A16 se sostienen sobre eje/motor/answers ya persistidos por perfilamiento. Pero hay huecos concretos donde la 'fuente' declarada no existe en el modelo de datos actual: el más grave es que answers se guarda como [{axis, responseTimeMs}] SIN identidad de pregunta (QuestionAnswer, profileResolver.ts:68), lo que vuelve NO determinista citar 'la escena literal' (A2, que la propuesta marca como shippeable HOY) y alinear preguntas repetidas (A13, que además invoca un question_version inexistente). Dos módulos están mis-scopeados: E2/A6/A19 declaran F6 'sin instrumentar' cuando game_metrics ya persiste los tres sub-vectores (impulse/rhythm/adaptation) que resolveMotorFromGames colapsa — la fuente EXISTE. Y E3/A3 introducen un clasificador de ritmo 'tercios+medianas' subespecificado que duplica y contradice el classifyDecisionPattern existente (mitades+CV). Ningún hueco toca la Ola 1; se concentran en A2 y el tier de evolución. Verdicto: sólida en el núcleo, pero A2 y A13 no cumplen su propia regla ('sin número atrás, no entró') porque el dato de pregunta no se persiste — anclarlos a persistir question_id antes de shippear.

- **[ALTA] A2 — Un momento que lo mostró (MVP 'computable HOY' sobre answers[].axis):** Hueco duro de fuente. La propuesta afirma citar 'la escena literal, texto fijo de la pregunta' como reproducción de un dato, pero el dato persistido no tiene con qué. QuestionAnswer es SOLO {axis, responseTimeMs} (src/lib/profileResolver.ts:68) y perfilamientos.answers guarda ese mismo shape en jsonb: NO hay questionId, ni índice, ni texto de pregunta, ni optionId. Desde answers[].axis sabés QUÉ eje eligió, pero es imposible recuperar deterministamente EN QUÉ escena. Recuperarla por posición del array exige (a) que el banco esté fijo y no barajado y (b) que el orden se preserve — ninguna de las dos cosas está garantizada ni documentada, y el modelo de datos no la ancla. Además la regla de selección ('la respuesta cuyo eje ≠ dominante') es ambigua: en un 5-4 hay múltiples candidatas y no se define cuál se cita. Resultado: para nombrar la escena la IA tendría que inferirla → superficie de alucinación exactamente donde la propuesta jura que no la hay. No es shippeable 'HOY' como se afirma en la Ola 2.  
  _fix:_ Antes de A2: extender QuestionAnswer y el jsonb answers para persistir question_id (y fijar/versionar el banco), y citar el texto de la escena por lookup contra ese banco pineado. Definir una regla de selección determinista y única (p.ej. la primera ocurrencia del eje no-dominante con mayor conteo). Sin persistir la identidad de la pregunta, A2 NO entra por su propia regla de oro; degradarlo de 'S ship inmediato' a la fase de la tabla F10.
- **[ALTA] A13 — Estabilidad de respuestas (preguntas repetidas, misma dirección):** Fuente inexistente. Requiere alinear respuesta-a-respuesta la MISMA pregunta entre dos perfilamientos, pero answers guarda {axis, responseTimeMs} sin identidad de pregunta, así que no hay forma de saber cuál es 'la misma pregunta' salvo por posición del array (frágil e injustificada). Peor: el gate propuesto 'solo si question_version coincide' invoca un campo que NO existe — la lista de inserción en api/session.ts (eje, motor, archetype_label, eje_secundario, answers, ai_*, ai_sections, game_metrics) no tiene question_version, ni el jsonb answers lo lleva. El cómputo 'en cuántas eligió en la misma dirección' no está definido sobre los datos que realmente se guardan.  
  _fix:_ No entra hasta persistir question_id por respuesta + una versión de banco real en el perfilamiento. Y no presentarlo como 'degrada a A12' como si fuera equivalente: A12 (índice de movimiento sobre distribución) mide otra cosa. Hasta tener identidad de pregunta, sacar A13 del Tier 1.
- **[MEDIA] E2 / A6 / A19 — Sub-motores F6 ('DEPENDE de instrumentar y persistir F6', esfuerzo L, Ola 4):** Mis-scope de fuente en la dirección inversa: se declara inexistente algo que YA está instrumentado y persistido. game_metrics ya captura tres sub-vectores — impulse (latencia de carta), rhythm (reacción de esquive + extraTaps) y adaptation (tormenta) — y resolveMotorFromGames (src/lib/profileResolver.ts:23) los colapsa vía promedio ponderado en un solo Motor. game_metrics se guarda por perfilamiento (api/session.ts:439). O sea, la materia prima del 'sub-motor' (arranca rápido / entra de a poco / sostiene) EXISTE y ya llega; lo que falta es exponer los sub-scores en vez de aplastarlos, no instrumentar un mini-juego nuevo. Tratarlo como L/Ola 4 sobredimensiona el costo y posterga un módulo que en realidad es de fuente sólida. Aparte, la guardia 'motor_divergencia' que E2 usa para degradar a neutro no está definida en ningún lado.  
  _fix:_ Reclasificar E2/A6 como cómputo sobre game_metrics ya persistido (S, no L); derivar el copy del sub-motor de los tres scores existentes. Re-tierear A19 a Tier 1 (game_metrics ×2 ya está almacenado, no depende de construir nada). Definir motor_divergencia de forma cerrada (p.ej. varianza entre los 3 scores de vector contra umbral) o quitarla.
- **[MEDIA] E3 / A3 — Patrón/ritmo de decisión ('tercios por orden, comparar medianas' / '3 bandas fijas'):** Cómputo no definido + doble fuente de verdad. responseTimeMs sí llega, así que la materia prima existe, pero la operación está subespecificada: no se fijan los cortes de tercios, la dirección de comparación de medianas, ni los umbrales de las 3 bandas. Y compite con un cómputo YA existente y DISTINTO: classifyDecisionPattern (src/lib/decisionPattern.ts) parte en MITADES, usa coeficiente de variación (CV>0.45) y umbral del 20%, y produce 4 categorías (constante/arranque_lento/cierre_desgaste/contexto). Introducir un 'tercios+medianas→3 bandas' paralelo crea dos clasificadores de ritmo incompatibles sobre el mismo dato = lecturas contradictorias del mismo niño.  
  _fix:_ No inventar un segundo algoritmo: extender/reusar classifyDecisionPattern (ya determinista, ya con umbrales) para el matiz por bloque. Si de verdad se quiere tercios, especificar cortes, sentido de comparación y cutoffs exactos, y deprecar uno de los dos para no tener dos verdades.
- **[MEDIA] A7 (y Q3) — Cuando la cosa se pone intensa / anclar el reset a F10b:** Fuente inexistente hoy y riesgo de conflación. F10/F10b no existen (son diseño TARGET). El cómputo binario 'opción elegida en la escena de presión vs eje_dominante' está bien definido EN ABSTRACTO, pero requiere que la elección del jugador en una pregunta-de-presión esté taggeada y persistida como metadato de answers — y answers no distingue preguntas (ver A2). Ojo con conflar 'escena de presión' (una elección del cuestionario) con game_metrics.adaptation (la reacción motriz en el mini-juego tormenta): son señales distintas; usar adaptation como proxy del 'sostiene/cambia de registro' del cuestionario sería un salto no determinista.  
  _fix:_ Mantener gateado. Para habilitarlo hay que (a) marcar una pregunta como 'escena de presión' en un banco versionado y (b) persistir esa elección identificable en answers. No sustituir la elección del cuestionario por game_metrics.adaptation sin decir explícitamente que son cosas distintas.
- **[BAJA] E4 / E5 — Tendencia secundaria y extras condicionados a second_count:** Fuente sólida (second_count/secondCount ya se computa en resolveProfile, y palabrasPuenteExtra/RuidoExtra ya son texto estático de arquetipo), pero el 'umbral' que decide fuerte/débil y cuándo cargar los extras no está especificado con un valor. Es una constante libre, no una invención de IA, así que el riesgo es de comparabilidad entre niños (umbral arbitrario), no de alucinación.  
  _fix:_ Fijar el umbral numérico de second_count en un solo lugar (junto a resolveProfile) y documentarlo, para que dos niños con el mismo secondary se narren igual.
- **[BAJA] Q2 / Q3 — premisa 'IA libre' del checklist y del reseteo:** Mischaracterización de la fuente actual (no cambia el riesgo, sí la justificación). En getReportData, checklist (antes/durante/después) y reseteo NO son IA libre: son campos ESTÁTICOS por arquetipo del ARCHETYPE_DATA con {nombre} inyectado (src/lib/argosEngine.ts). La disposición (quitar del adulto / gatear en coach / anclar o quitar) es segura y no abre superficie, pero el argumento 'hoy es coaching inventado por la IA' es factualmente incorrecto: hoy es texto plantilla genérico por arquetipo. El problema real es que es genérico, no que aluciné.  
  _fix:_ Corregir el rationale: el defecto es genérico-por-arquetipo (sub-individualizado), no alucinación de IA. La decisión de quitar/anclar sigue válida.
- **[BAJA] A17 — Nitidez en el tiempo (F4 brecha × 2), tier/esfuerzo:** Mis-tier menor. Se encola en Tier 2 detrás de 'construir F4' (M), pero la brecha F4 es solo top_count−second_count sobre axisCounts, y axisCounts es recomputable desde el jsonb answers de cada perfilamiento (ambas fotos ya persistidas). O sea la fuente ya está almacenada; no depende de construir buildEvidenceFicha. Es Tier 1 recomputable, no M.  
  _fix:_ Reclasificar A17 (y en general 'F4 brecha') como cómputo Tier 1 sobre answers ya guardado, igual que A10/A12/A16. Reservar la etiqueta 'construir F4' solo para F4b (forma pico/dúo/disperso), que sí es un campo nuevo.

---

# Parte C — Inventario de referencia

# Inventario del informe Argo — secciones renderizadas, fuente determinista y campos F1–F11 sub-usados

Base: `src/pages/ReportPage.tsx` (render), `src/lib/archetypeData.ts` (campos por arquetipo), `src/lib/argosEngine.ts` (`ReportData` + `getReportData`), `docs/METODO-INFORME-DETERMINISTA.md` §1.3 (ficha F1–F11) y §5 (mapa de repercusión). Nota clave de estado: la **ficha F1–F11 es diseño TARGET, no está construida** (el doc dice "NO listo para código"; `buildEvidenceFicha` figura como "pieza nueva a construir", §6.4). Abajo separo lo que hoy realmente corre de lo que el doc propone.

---

## (1) + (2) Secciones que hoy ve el adulto, en orden de render, con su fuente

Orden real de `ReportPage.tsx`. El gate visual está en la línea 590: **Hero + Motor se muestran siempre (pre-lock, incl. demo/trial); todo lo demás vive detrás del lock** (`tenant_plan === 'trial' || is_demo` && !`full_access`).

**Encabezado de página** (`ReportPage.tsx:538-547`) — muestra `child_name`, edad, deporte, fecha, `adult_name`. **Estático** (datos de sesión, sin IA).

**1. Hero de arquetipo** (`:550-581`) — un solo `Card` con varias piezas:
- Chip de arquetipo `report.arquetipo.label` (`:557`) → **estático** `archetypeData.label`, override opcional por `ai_sections.label` (F11).
- Etiqueta de tendencia `report.tendenciaLabel` (`:559-561`) → **determinista** desde `eje_secundario` vía `getLocalizedTendenciaLabel` (F9).
- Chip de motor `motorDisplayName` (`:562-564`) → **determinista**: `session.motor` mapeado a Dinámico/Rítmico/Sereno por `t.motorNames` (`:43`) (F5).
- Headline `report.perfil` (`:566`) → **estático** `archetypeData.perfil`.
- Cuerpo: `report.resumenPerfil` (RichBodyText) si existe, si no `bienvenida` en DigestBox (`:567-570`) → **IA libre** (`resumenPerfil`), con **fallback estático** `bienvenida` (inyecta `{nombre}`).
- **AxisBars "Composición del perfil"** (`:573-580`, componente `:234-273`) → **determinista**: cuenta votos D/I/S/C **recomputados inline desde `session.answers`** (F1).

**2. Motor de rendimiento** (`:584-587`) — `report.motorDesc` → **IA libre** (override `ai_sections.motorDesc`), **fallback estático** `archetypeData.motorDesc`. Fuente-hecho hoy: solo F5 (el nombre del motor). Los sub-motores (F6) del diseño **no se inyectan**.

--- LOCK (`:590`) ---

**3. Qué lo mueve / `combustible`** (`:634-639`) — condicional a `report.combustible`. **IA libre** (override), fallback estático. Hecho-fuente objetivo: F2 (+Q3, +F3); hoy solo la semilla del eje dominante.

**4. Patrón de decisión + "Qué significa para la actividad"** (`:642-655`) — **100% determinista, client-side**: `classifyDecisionPattern(session.answers)` sobre los `responseTimeMs` (`:473-475`, import `../lib/decisionPattern`). No pasa por IA. Es la única sección que **se omite** si no clasifica (`decisionPattern && (...)`) (F8).

**5. Palabras puente / Palabras que generan ruido** (`:658-680`) — dos columnas. **Estático**: `report.palabrasPuente` + `palabrasPuenteExtra` y `palabrasRuido` + `palabrasRuidoExtra` (concatenados en `:482-483`). Base = arquetipo (F11); extras = tendencia secundaria (F3). La IA no las genera (aunque `ai_sections` puede sobrescribir puente/ruido, `:465-470`).

**6. Tendencia secundaria** (`:683-688`) — condicional a `report.tendenciaParagraph`. **Estático computado** desde `TENDENCIA_CONTENT` vía `getLocalizedTendenciaContent` (`:440-446`), override opcional por IA (F3/F9). Ojo: **hoy es condicional** ("solo si hay párrafo"), lo que el doc §7 marca como a corregir para que "nunca se saltee".

**7. Guía rápida (Activar / A considerar)** (`:691-708`) — condicional a `report.guia.length`. **Estático** `archetypeData.guia` (filas situación/activador/desmotivación), override posible por `ai_sections.guia` (`:464`). Anclada a F2/F5.

**8. Checklist del día (Antes/Durante/Después)** (`:711-727`) — condicional a `report.checklist`. **IA libre** (override), fallback estático. Cada campo pasa por `cleanText` (strip HTML, `:485-501`). Objetivo F11/F5/F8/F10.

**9. Ecos fuera de la cancha** (`:730-735`) — condicional a `report.ecos`. **IA libre**, fallback estático (F2).

**10. Consejo de reset** (`:738-743`) — condicional a `report.reseteo`. **IA libre**, fallback estático (F2/F5/F6/F10b).

**Footer** (`:748-751`) — **estático** ("Generado por ArgoMethod®" + "fotografía del presente, no una etiqueta permanente").

**Bloque de lock/upsell** (`:591-630`) — reemplaza las secciones 3–10 cuando el informe está bloqueado; incluye botón de checkout solo en `is_demo`.

Resumen de mecanismo: **deterministas puras** = AxisBars (F1) y Patrón de decisión (F8). **Determinista/estático** = arquetipo, motor-chip, tendencia, palabras puente/ruido, headline `perfil`. **IA libre con fallback estático** = `resumenPerfil`, `motorDesc`, `combustible`, `checklist`, `ecos`, `reseteo` (guía puede serlo vía override).

---

## (3) Inventario ficha F1–F11 y campos SUB-USADOS

Campos según §1.3. Marco: **[HOY]** = existe/alimenta algo en el render actual; **[NO EXISTE]** = campo del diseño target aún no computado; **[SUB-USADO]** = se computa (o hay dato equivalente) pero no alimenta ninguna sección o podría alimentar más.

| ID | Campo(s) | Estado hoy | Alimenta hoy | Diagnóstico |
|---|---|---|---|---|
| **F1** | `votos`, `votos_pct` | [HOY] recomputado inline en AxisBars desde `session.answers` (`:241-243`) | AxisBars (sec.1) | **Usado**. Único uso; `axisCounts` de `ReportData` (`argosEngine.ts:52`) queda **muerto** (AxisBars no lo lee). |
| **F2** | `eje_dominante`, `top_count` | [HOY] `eje_dominante` = `session.eje`; `top_count` no | arquetipo, todo el contenido por eje | **SUB-USADO**: `top_count` (magnitud del dominante) nunca se muestra ni modula lenguaje. Alimenta a más (combustible, ecos, reset lo referencian solo como semilla estática de eje). |
| **F3** | `eje_secundario`, `second_count` | [HOY] `eje_secundario` = `session.eje_secundario`; `second_count` no | tendencia (sec.6), palabras extra (sec.5) | **Parcial**: `second_count` no se computa/usa; el peso de la tendencia no depende de la fuerza real del secundario. |
| **F4** | `brecha`, `banda_veta`, `confianza_tier` | **[NO EXISTE]** | nada | **Hueco mayor**: hoy no se comunica mezcla ni confianza. Un 5-4 y un 9-1 rinden el mismo lenguaje. Es la capa de honestidad/hedging entera del diseño, ausente del render. |
| **F4b** | `forma_perfil`, `n_ejes_fuertes` | **[NO EXISTE]** | nada | **Hueco**: no se distingue `pico` de `duo`/`disperso`; el perfil disperso se presenta como arquetipo limpio (lo que el doc prohíbe). |
| **F5** | `motor`, `motor_source`, `motor_composite` | [HOY] `motor` = `session.motor` | chip de motor (sec.1) + `motorDesc` (sec.2) | **Parcial**: solo el nombre del motor. `motor_source`/`motor_composite`/`motor_confianza` no existen → `motorDesc` no puede degradar en fallback ni marcar "motor en transición". |
| **F6** | `submotores` (impulso/ritmo/adaptación/spread/lead/lag), `motor_divergencia`, `motor_confianza` | **[NO EXISTE]** en el render | nada | **Señal más rica desaprovechada**: los sub-puntajes del mini-juego no llegan a ninguna sección. `motorDesc`, guía y reset podrían individualizarse fuerte con esto y hoy son genéricos por arquetipo. |
| **F7** | `tiebreaker_eje_aplicado`, `motor_tiebreaker_aplicado` | **[NO EXISTE]** | nada (por diseño no se cita) | Correcto que no se cite; pero como no existe, tampoco degrada confianza cuando debería. |
| **F8** | `patron_decision` | [HOY] `classifyDecisionPattern` client-side (`:473`) | Patrón de decisión (sec.4) | **Usado** y bien aislado (solo tiempos). Único F plenamente vivo además de F1/F9/F11. |
| **F9** | `tendencia_label` | [HOY] `getLocalizedTendenciaLabel` | tendencia (sec.6) + chip hero | **Usado**. |
| **F10** | `momentos.seleccionados[]` (escena_firma / tormenta_divergente / contra_tendencia) | **[NO EXISTE]** | nada | **La mayor oportunidad de enriquecimiento**: hoy el informe **nunca cita una escena ni un momento concreto**. Es justamente lo que haría que "suene a ESTE niño" (el Retrato hoy es genérico por arquetipo). Todo el aparato de §4 está sin construir. |
| **F10b** | `coherencia_presion` | **[NO EXISTE]** | nada | **Hueco**: no modula el tono de estabilidad del Retrato ni del reset. |
| **F11** | `arquetipo_id`, `arquetipo_label` | [HOY] `report.arquetipo` | Hero (sec.1) | **Usado**. |

### Campos de contenido computados pero NO renderizados (además de la ficha)
En `getReportData`/`ReportData` y `archetypeData` se computan campos que **ningún componente muestra**:
- **`wow`** (`archetypeData.ts:27`, mergeado en `:457`) — semilla del "wow"; **nunca se renderiza**. Por diseño (§5) es semilla estática del Retrato, pero como campo suelto está muerto en el render.
- **`perfilExtended`** (`argosEngine.ts:34`, inyectado con nombre en `:118`) — **computado, nunca renderizado**.
- **`grupoEspacio`** (`:460`) y **`corazon`** (`:459`) — mergeados desde IA, **no se renderizan**; §5 aclara que alimentan el *prompt* de generación ("Lenguaje de Intención"), no una sección. Correcto pero conviene tenerlo explícito: son insumo de IA, no salida visible.
- **`axisCounts`** (`argosEngine.ts:52`) y **`sessionId`** (`:53`) — en la interfaz `ReportData` pero **sin uso** en el render (AxisBars recomputa desde `answers`).

---

## Lectura para decidir qué quitar / enriquecer / agregar

- **Sub-usados que ya tenés el dato**: `top_count`/`second_count` (magnitud del voto), `axisCounts` (dedup con AxisBars), y sobre todo los **tiempos de respuesta** ya llegan (`answers[].responseTimeMs`) pero solo alimentan F8; no F5/F6.
- **Lo más rico sin construir**: **F10 momentos notables** (cero escenas citadas hoy → Retrato genérico) y **F6 sub-motores del mini-juego** (individualización de motor/guía/reset). Son el mayor salto de "suena a ESTE niño".
- **Ausente y riesgoso para la honestidad**: **F4/F4b** (banda de veta, forma de perfil, confianza) — hoy un 5-4 se narra igual que un 9-1, justo lo que el método marca como error a evitar.
- **Muertos a limpiar**: `axisCounts`, `sessionId`, `wow`/`perfilExtended` como campos de salida sueltos; y la tendencia (sec.6) hoy es **condicional** cuando el contrato §7 pide que sea siempre presente.

Archivos citados: `src/pages/ReportPage.tsx` (render y gate de lock), `src/lib/argosEngine.ts` (`ReportData` líneas 30-55, `getReportData` 79-140), `src/lib/archetypeData.ts` (interface `ArchetypeData` 19-38), `src/lib/decisionPattern.ts` (F8, importado en ReportPage:6-11), `docs/METODO-INFORME-DETERMINISTA.md` §1.3 (F1-F11) y §5 (mapa de repercusión).
