# El corazón del método: informe determinista de Argo

> Fuente de verdad del diseño del informe (Capa 1 determinista + Capa 2 IA acotada).
> Producido y verificado adversarialmente el 2026-07-06 (panel de 3 autores -> sintesis -> 6 ejemplos de casos limite -> 5 lentes adversariales -> critico de completitud).
> **ESTADO: diseño verificado, NO listo para código.** La verificación encontró huecos reales; requiere ~4 cierres duros P0, cierres mecánicos P1, y **5 decisiones del owner (P2)** antes de implementar. Ver la seccion final.

---

# Parte A — Esqueleto canónico (Capa 1)

# ESQUELETO CANÓNICO DEL INFORME ARGO — Capa 1 (determinista)

> Fuente única de verdad para la generación del informe. Síntesis de los tres borradores (rigor / seguridad / experiencia). Gobierna la implementación de `profileResolver.ts`, `argosEngine.ts`, `decisionPattern.ts` y `api/generate-ai.ts`. Copy de ejemplo: español latam, tuteo, probabilístico, sin guiones largos, buyer-neutral ("el niño").
>
> **Regla de síntesis:** donde los borradores discrepan, la decisión aparece marcada **[Elección]** con su justificación en una línea.

---

## 1. Principio y arquitectura de dos capas

### 1.1 Las dos capas

- **Capa 1 (determinista, SIN IA).** De las 12 respuestas + métricas de mini-juego + tiempos de respuesta computa una **ficha de evidencia** (hechos con magnitudes) y ensambla un **esqueleto de secciones** (qué bloque de concepto pre-aprobado aplica, con qué banda de fuerza/confianza, en qué sección cae). Todo número sale de `resolveFromAnswers` / `resolveMotorFromGames` / `classifyDecisionPattern`. No inventa nada.
- **Capa 2 (IA).** Recibe `ficha + esqueleto + manual de estilo (WRITING_RULES) + palabras prohibidas`. Su único trabajo es **reescribir en prosa cálida**. No puede introducir ningún rasgo, magnitud, eje, motor, escena ni ejemplo que no esté en el esqueleto.

### 1.2 Correctitud ipsativa (innegociable)

La escala es **forzada de 12 ítems**: 12 votos repartidos entre 4 ejes, suman 12. Una respuesta suelta es **UN VOTO**, débil por sí solo. **Está prohibido el patrón "eligió la opción A → afirmá X sobre el niño".** Toda afirmación del informe nace del **agregado**: los 12 votos, los sub-puntajes de mini-juego, y las respuestas marcadas como **notables** por reglas deterministas con umbral.

Consecuencia estadística que gobierna el lenguaje (de Borrador A): bajo respuesta al azar (p=0.25), el conteo esperado por eje es **3**, con desvío estándar ≈ **1.5** (varianza = 12·0.25·0.75 = 2.25). Un líder de 5 votos está a solo ~1.3 SD de la media; una **brecha ≤ 1** (el clásico 5-4) no distingue de forma fiable al líder del segundo. Esto no se maquilla: se comunica como **mezcla**. El error seguro es **sub-afirmar**.

### 1.3 La ficha de evidencia (artefacto que Capa 1 entrega)

Objeto único, 100% determinista, es el único universo de hechos que la IA puede citar. Cada campo lleva un ID `(Fn)` usado en el mapa de repercusión (§5).

```jsonc
{
  // --- VOTOS (forma completa, no solo el ganador) ---
  "votos":        { "D":0, "I":0, "S":0, "C":0 },   // suman 12                (F1)
  "votos_pct":    { "D":0, "I":0, "S":0, "C":0 },    // para AxisBars           (F1)
  "eje_dominante":"S",  "top_count":6,                                          // (F2)
  "eje_secundario":"C", "second_count":3,                                       // (F3)
  "brecha":       3,                                  // B = top - second       (F4)
  "banda_veta":   "clara",                            // derivada de B (§2.2)    (F4)
  "confianza_tier":"media",                           // registro de lenguaje   (F4)
  "forma_perfil": "lider_con_sombra",                 // silueta completa (§2.2) (F4b)
  "n_ejes_fuertes":2,                                 // ejes con >=3 votos      (F4b)
  "tiebreaker_eje_aplicado":false,                    // interno, NO se cita     (F7)

  // --- MOTOR ---
  "motor":        "Rítmico",                          // Dinámico/Rítmico/Sereno (F5)
  "motor_source": "games_full",                       // games_full|games_partial|time_fallback|vote_fallback
  "motor_composite":54,                               // 0-100 (null si fallback)(F5)
  "submotores":   { "impulso":40, "ritmo":61, "adaptacion":58,
                    "spread":21, "lead":"ritmo", "lag":"impulso" },             // (F6)
  "motor_divergencia":"parejo",                       // "parejo" | <patrón>     (F6)
  "motor_confianza":"alta",                           // alta|media|baja (§2.3)  (F6)
  "motor_tiebreaker_aplicado":false,                                            // (F7)

  // --- PATRÓN DE DECISIÓN (independiente, por tiempos) ---
  "patron_decision":"constante",                      // o null                  (F8)

  // --- TENDENCIA ---
  "tendencia_label":"con tendencia al detalle",       // TENDENCIA_LABELS[sec]   (F9)

  // --- MOMENTOS NOTABLES (≤2 citables + 1 booleano) ---
  "momentos": {
    "seleccionados":[                                  // 0..2, escena-ancla      (F10)
      { "tipo":"escena_firma", "q":5, "escena":"La Tormenta",
        "opcion_texto":"Mantengo mi posición para que el barco no se mueva",
        "eje_opcion":"S", "framing":"observacion_escena_ancla_no_rasgo" }
    ],
    "coherencia_presion":true                          // dom elegido en Q5-Q7    (F10b)
  },

  // --- ARQUETIPO ---
  "arquetipo_id":"S_Ritmico", "arquetipo_label":"Sostén Rítmico"               // (F11)
}
```

**Garantía de cobertura:** cada campo F1–F11 alimenta ≥1 sección (§5); ninguna sección de IA carece de al menos un hecho-fuente. `tiebreaker_eje_aplicado` (F7) es el único campo que **no se cita**: solo baja la confianza.

---

## 2. Biblioteca de conceptos (significados pre-aprobados)

La IA no define conceptos: toma la entrada que Capa 1 seleccionó según umbrales numéricos y la parafrasea. Diccionario cerrado.

### 2.1 Los 4 ejes (única lectura autorizada)

La IA solo puede atribuir al niño el **eje_dominante** y el **eje_secundario** de la ficha. Un eje puede además nombrarse si aparece en un momento notable (§4), siempre anclado a la escena. Los demás ejes solo se nombran en abstracto (describiendo el modelo), nunca como rasgo del niño.

| Eje | Nombre | Energía (rótulo canónico obligatorio) | Combustible (qué lo mueve) | Suele necesitar del entorno | Nunca (rebota filtro) |
|---|---|---|---|---|---|
| **D** | Impulsor | Energía de Impulso: iniciativa, coraje, proponer desafíos, arranque | avanzar, sentir que va rápido, el reto | espacio para arrancar y proponer | dominación, agresividad, control, confrontación |
| **I** | Conector | Energía Conectora: motivar, integrar, alegría al juego, tejer equipo | el vínculo, jugar con otros, el ánimo compartido | momentos de intercambio con el grupo | disperso, hablador |
| **S** | Sostén | Energía de Sostén: lealtad, constancia, pilar de confianza, calma firme | el ritmo estable, la seguridad, sostener al equipo | previsibilidad y tiempo para acomodarse | lento, pesado, pasivo, rígido |
| **C** | Estratega | Energía Estratega: atención al detalle, calidad, leer la jugada, excelencia | entender el cómo, mejorar cada vez, el plan | claridad de la lógica y del por qué | frío, obsesivo, controlador |

> Nombres canónicos de eje (labels AxisBars): D=Impulsor, I=Conector, S=Sostén, C=Estratega.

### 2.2 Fuerza de veta — regla numérica exacta sobre la brecha de votos

`B = top_count − second_count` (con 12 votos, `top_count ∈ [3,12]`).

**[Elección]** Adopto **5 bandas agrupando B=2-3 y B=4-5** (Borrador A) en lugar de una banda por entero (Borradores B/C): con SD≈1.5, distinguir B=2 de B=3 (o B=4 de B=5) cae dentro del ruido, así que agrupar es más honesto que fingir resolución.

| B | banda_veta | confianza_tier | Cómo lo dice el informe |
|---|---|---|---|
| **0** | `equilibrio` | `mezcla` | Dos ejes co-líderes. **Prohibido** afirmar un dominante único. Se describe la **combinación** de dos energías ("se mueve con comodidad entre…"). |
| **1** | `ligera` | `baja` | Inclinación apenas perceptible, cerca del azar para el eje perdedor. **Mezcla real:** principal y secundario casi a la par; hedge máximo ("se asoma un poco más de…"). |
| **2–3** | `clara` | `media` | Eje líder real con acompañante fuerte y visible. La mezcla se nombra explícitamente. |
| **4–5** | `marcada` | `alta` | Dominante claro; el secundario es un matiz. |
| **≥6** | `definida` | `muy_alta` | Señal fuerte y coherente. Aun así, lenguaje probabilístico, nunca identidad fija. |

**Forma del perfil** (silueta completa, complementaria a B; para que un 6-3-2-1 se cuente distinto de un 4-3-3-2 aunque el ganador sea el mismo).

**[Elección]** Unifico los nombres de A y C en **cuatro formas** con reglas exactas:

| forma_perfil | Condición | Lectura autorizada |
|---|---|---|
| `pico` | `top_count ≥ 6` y `B ≥ 3` | un eje claramente sobresale; seguridad probabilística alta |
| `lider_con_sombra` | `top_count ≥ 5` y `B ∈ {2,3}` | líder claro con una segunda energía fuerte detrás |
| `duo` | los dos primeros `≥ 4` y `B ≤ 1` (5-5-1-1, 5-4-2-1) | **dos energías co-protagonistas**; jamás el arquetipo como identidad única |
| `disperso` | `n_ejes_fuertes ≥ 3` y `B ≤ 1` (4-3-3-2, 3-3-3-3) | perfil amplio/versátil; confianza categórica baja, se habla de flexibilidad |

**Topes duros de degradación de confianza:**
- Si `tiebreaker_eje_aplicado == true` (se rompió un empate B=0 por dispersión de grupo) → `confianza_tier` se limita a **`mezcla`**; el arquetipo elegido es una lectura entre varias igualmente plausibles y la combinación va al frente.
- `forma_perfil ∈ {duo, disperso}` **fuerza** que la Tendencia secundaria (§5, sección 6) sea prominente y que el Retrato hable de dos energías, aunque B sugiera algo más.

### 2.3 Bandas de motor + patrones de divergencia

**Composite** (de `resolveMotorFromGames`: Impulso 0.30, Ritmo 0.30, Adaptación 0.40, con re-normalización de pesos si falta un juego; o fallback por tiempo/dominancia de votos):

| Composite | Interno | **Display** | Concepto aprobado |
|---|---|---|---|
| `≥ 67` | Rápido | **Dinámico** | tiende a encenderse rápido, gusto por el movimiento y el ir al frente |
| `34–66` | Medio | **Rítmico** | sostiene un pulso parejo, ni arranque explosivo ni pausa larga |
| `≤ 33` | Lento | **Sereno** | procesa con calma antes de moverse; valor en la constancia |

**Confianza del motor** (`motor_confianza`), regla exacta (de Borrador A, el único con calibración):
- **Cercanía al umbral:** composite en zona de transición (61–66 / 68–73 alrededor de 67; 27–32 / 34–39 alrededor de 33) → baja un nivel ("motor en transición").
- **Fuente:** `games_full` (alta) > `games_partial` (media) > `time_fallback` (baja) > `vote_fallback` (baja).
- **Coherencia:** `spread = max−min` de los tres sub-puntajes. `spread < 25` sube; `spread ≥ 25` baja y activa un patrón de divergencia.

**Sub-motores** (0-100, solo si `motor_source` empieza con `games`): Impulso (arranque), Ritmo (reacción sostenida), Adaptación (re-encuadre ante el cambio). Bandas de cada uno: Alto ≥67 · Medio 34–66 · Bajo ≤33.

**[Elección]** Umbral de divergencia = **`spread ≥ 25`** (Borrador B), en lugar del doble corte de A (≤25 / ≥40, que deja una zona gris indefinida) o el `<20` de C: un corte único y limpio.

Patrones nombrados (concept-blocks; la IA solo usa el que Capa 1 puso en `motor_divergencia`; toda penalización cruda va en positivo):

| Patrón (id) | Condición numérica | Concepto aprobado (probabilístico, sin "error") |
|---|---|---|
| `parejo` | `spread < 25` | "arranca, sostiene y se reacomoda de forma pareja; brilla en lo repetible y sostenido" |
| `arranque_fuerte_ajuste_con_aviso` | Impulso Alto & Adaptación Baja | "tiende a arrancar con mucha energía; suele sentirse más cómodo cuando los cambios de consigna llegan con un pequeño aviso" |
| `flexible_sin_apuro` | Adaptación Alta & Impulso Bajo | "no suele ser el primero en lanzarse, y a la vez se reacomoda con fluidez cuando el plan cambia sobre la marcha" |
| `sostenedor_de_cadencia` | Ritmo el `lead`, gap ≥25 | "brilla al sostener la cadencia sin perder foco" |
| `confirma_antes_de_cambiar` | Adaptación el `lag` aislado | "tiende a confirmar antes de cambiar de marcha; rinde mejor cuando el cambio se anticipa" |
| `calma_antes_del_movimiento` | Impulso el `lag` aislado | "procesa con calma antes de moverse; su aporte aparece en la constancia más que en el arranque" |

> Nota anti-déficit crítica: `impulsivityBonus` (extraTaps) y `errorPenalty` (inertiaErrors) YA están plegados dentro de cada sub-puntaje por el resolver. **Nunca se exponen como "toques de más" ni "errores"**: la IA solo ve el sub-puntaje resultante y su banda. Impulso bajo jamás es "lento/tarda"; es `calma_antes_del_movimiento` (profundidad).
> Con `motor_source == time_fallback`/`vote_fallback` NO hay sub-motores: la sección Motor se apoya solo en el composite-band + el patrón de decisión. La IA no puede inventar divergencia que no se midió.

### 2.4 Tendencia secundaria (`TENDENCIA_LABELS`, fija por `eje_secundario`)

D `con tendencia a la acción` · I `con tendencia a lo social` · S `con tendencia a la calma firme` · C `con tendencia al detalle`. El **peso** que la IA le da lo fija `banda_veta`: en `ligera`/`equilibrio` es casi co-protagonista; en `definida` es una pincelada.

### 2.5 Bloques de patrón de decisión (`classifyDecisionPattern`, independiente, por tiempos)

| Salida | Concepto aprobado |
|---|---|
| `constante` | "sostiene un pulso parejo de principio a fin" |
| `arranque_lento` | "tiende a tomarse el arranque con calma y a soltarse a medida que entra en ritmo" |
| `cierre_desgaste` | "suele dar lo mejor al principio; hacia el final le viene bien un respiro o un cambio de estímulo" |
| `contexto` | "su ritmo varía según la situación; se adapta a lo que cada momento pide" |
| `null` (<6 tiempos válidos) | la sección se **omite**; no se rellena con genérico |

---

## 3. Mapa respuesta → voto (las 12 preguntas reales)

Mecánica pura: cada opción suma **1 voto** a su eje; nada más. El orden de opciones varía por pregunta (el eje NO es posicional). Cada pregunta reparte exactamente un voto por eje. La escena se usa **solo** para computar salencia (§4), nunca para afirmar un rasgo desde un ítem.

| Q | Título · Escena | **D** (Impulsor) | **I** (Conector) | **S** (Sostén) | **C** (Estratega) |
|---|---|---|---|---|---|
| Q1 | El Despegue · **Puerto** | ¡Salto al barco ya! | Busco a mis amigos | Me instalo con calma | Reviso que todo esté listo |
| Q2 | El Nuevo Ritmo · Puerto→Mar | Me lanzo a probar de una | La practicamos todos juntos | Que me muestren paso a paso | Primero entiendo cómo funciona |
| Q3 | El Motor del Viaje · Mar abierto | Sentir que vamos rápido | Charlar con los demás | Mantener un ritmo constante | Aprender trucos nuevos |
| Q4 | La Encrucijada · Mar abierto | Elijo el más directo | Escucho qué opinan todos | Me aseguro de que el camino sea seguro | Analizo el mapa y el viento |
| Q5 | El Momento del Caos · **Tormenta** | Me muevo rápido a ayudar | Busco a mis compañeros | Mantengo mi posición… | Pienso qué es lo importante |
| Q6 | El Desajuste · **Tormenta** | Agarro lo que pueda | ¡Grito "vamos equipo"! | Me quedo firme en mi lugar | Miro qué se soltó |
| Q7 | El Nudo Rebelde · **Tormenta** | Lo rehago con más fuerza | Pido ayuda a un compañero | Respiro y lo intento de nuevo | Veo qué parte falló |
| Q8 | El Empuje · Calma | Remo más fuerte | Digo algo divertido | Sigo remando igual | Recuerdo cuánto falta |
| Q9 | La Espera · Calma | Me preparo para actuar | Doy ánimos al equipo | Recupero energía | Observo y aprendo |
| Q10 | El Apoyo · Calma | Lo ayudo a recuperarlo rápido | Le choco la mano, ¡todos bien! | Me pongo a su lado | Le enseño un truco |
| Q11 | La Práctica Final · Horizonte | Ponerme un reto de velocidad | Hacerla como un juego con todos | Que se vuelva fácil y natural | Que cada vez salga mejor |
| Q12 | La Meta · **Isla** | ¿Cuál es la próxima isla? | ¡Increíble aventura juntos! | ¡Llegamos todos a salvo! | ¡Qué bien salió el plan! |

Balance verificado: cada eje aparece exactamente una vez por pregunta. Conteo teórico por eje: 0–12.

**Salencia de escena** (entero determinista, para §4):
- **Tormenta** (Q5, Q6, Q7) = **3** (máxima presión).
- **Meta / Horizonte** (Q11, Q12) = **2**.
- **Mar abierto + Calma** (Q3, Q4, Q8, Q9, Q10) = **1**.
- **Puerto** (Q1, Q2) = **1**.

**Pseudocódigo de agregación (Capa 1):**
```
votos = tally(answers.axis)                    // 12 votos → 4 buckets
sorted = ejes ordenados por conteo desc
eje_dominante = sorted[0]; eje_secundario = sorted[1]
B = votos[sorted[0]] - votos[sorted[1]]
// empate B=0 con contexto de grupo → tiebreaker por dispersión (demueve líder a secundario, marca flag)
banda_veta, confianza_tier = bandaPorBrecha(B)          // §2.2
forma_perfil = formaPorVector(votos)                    // §2.2
motor, motor_composite, submotores, motor_source = resolverMotor(games, tiempos, B, total)
motor_confianza, motor_divergencia = calibrarMotor(...) // §2.3
patron_decision = classifyDecisionPattern(tiempos)      // independiente, §2.5
arquetipo = ARQUETIPOS.find(eje==eje_dominante && motor==motor)
momentos = reglasMomentoNotable(answers, ...)           // §4
```

---

## 4. Reglas de momento notable (con tope)

Un momento notable es la **única** licencia para citar una escena concreta, siempre encuadrada como observación anclada a la escena ("en la tormenta tendió a…"), **nunca** como rasgo permanente. Se computan en Capa 1 y se congelan en `momentos.seleccionados[]` (**tope duro: 2**). Todo lo demás es "momento no marcado" y lo rebota el closed-moment guard (§6). Como un voto solo es débil, ninguna regla se dispara por un único voto salvo el evento raro designado, y siempre con corroboración de salencia.

### 4.1 Candidatos

**a) `escena_firma` (grounding — "el niño siendo él/ella").** Entre las respuestas con `eje_opcion == eje_dominante`, elige **1** por máxima salencia (Tormenta > Meta/Horizonte > Mar/Calma > Puerto; a igual salencia, Q más bajo). Si el dominante no aparece en ninguna escena de salencia ≥1 relevante, se puede omitir. Cupo: 1.

**b) `tormenta_divergente` (firma bajo presión, alta prioridad — de Borrador A).** Eje modal de Q5+Q6+Q7. Dispara **solo si ≥2 de 3** respuestas de tormenta coinciden en un eje **distinto** del `eje_dominante`. Framing: "bajo presión, tendió a {eje_tormenta}", como contraste con la calma. Si el eje de tormenta = dominante, no es momento (solo alimenta `coherencia_presion`).

**c) `contra_tendencia` (elección minoritaria — scoring de Borrador C, el más riguroso).** Para cada respuesta `a` con `a.eje_opcion != eje_dominante`:
```
score(a) =
   +3  si a.eje_opcion es singleton (exactamente 1 voto total en ese eje)
   +1  si a.eje_opcion es el eje menos votado no-cero (y no singleton)
   +2  si escena ∈ Tormenta (Q5-Q7)
   +1  si escena ∈ {Q11 Horizonte, Q12 Meta}
   +1  si escena == Q10 (apoyo a un compañero)
   +1  si a.eje_opcion tampoco es el eje_secundario (minoría real)
```
**Califica** solo si `score ≥ 4` (garantiza que sea rara y/o bajo presión). Ranking desc por score; desempate: mayor salencia, luego Q más bajo.

**d) `coherencia_presion` (booleano, no cuenta contra el tope).** `true` si ≥1 de Q5-Q7 fue votada al `eje_dominante`. Alimenta una frase de estabilidad; no es una cita de escena, solo modula tono.

### 4.2 Selección final (tope 2, orden fijo)

**[Elección]** Prioridad **`tormenta_divergente` > `contra_tendencia` (mayor score) > `escena_firma`**, con **garantía de grounding**: si los 2 slots quedarían ocupados solo por momentos de contraste, se reserva 1 slot para `escena_firma` cuando exista (para que el informe no sea todo "excepciones" sin un ancla de "quién es"). Combino así la firma de presión de A, el scoring de C y el anclaje de B.

- Dedupe: si `tormenta_divergente` y un `contra_tendencia` apuntan a la misma respuesta, cuenta una sola vez.
- **Caso `banda_veta == equilibrio` (B=0):** se permiten **dos `escena_firma`** (una por cada eje co-líder) y se **omite** `contra_tendencia`, para no forzar un dominante inexistente (regla de Borrador B).
- Si ningún candidato califica → `seleccionados = []` y la IA **no puede inventar ninguna escena**.

Cada momento viaja como dato crudo cerrado: `{tipo, escena, opcion_texto (verbatim), eje_opcion, framing}`. La IA puede nombrar la escena náutica y parafrasear la elección textual; **no puede** añadir qué "sintió", trasladar la escena a un partido real, ni inventar una segunda anécdota.

---

## 5. Mapa de repercusión (hecho computado → sección real)

Orden de render de `ReportPage.tsx`. **Toda sección tiene fuente determinista; ninguna se escribe de la nada.** La columna "restricción de honestidad" (de Borrador A) es vinculante para la Capa 2.

| # | Sección (label ES) | Escrita por | Hechos-fuente (ficha) | Restricción de honestidad |
|---|---|---|---|---|
| 1 | Hero arquetipo + `resumenPerfil` ("Retrato de Sintonía") | IA (`resumenPerfil`; `wow` semilla estática reescrita, se integra al hero) | F11, F2/F3, F4 banda+tier, F4b forma, F5 motor, **F10 momentos**, F9 | Debe reflejar el tier: `mezcla`/`baja` → mezcla al frente + hedge fuerte; `duo`/`disperso` → dos energías, nunca "es un {arquetipo}". Los **momentos** se enrutan aquí como material principal (es donde debe sonar a "este niño"). |
| 1 | AxisBars "Composición del perfil" | Determinista (render) | F1 `votos_pct` | Muestra la mezcla real; ancla visual de que no hay pureza. La prosa no puede contradecir las barras. |
| 1 | Chip de motor | Determinista | F5 (Dinámico/Rítmico/Sereno) | Si `motor_confianza` baja, el Retrato no cierra afirmaciones fuertes sobre ritmo. |
| 2 | Motor de rendimiento (`motorDesc`) | IA | F5 composite-band, F6 sub-motores + `motor_divergencia`, `motor_confianza` | Solo el patrón presente en `motor_divergencia`. Con `parejo` no fuerza contraste; con `time/vote_fallback` no menciona sub-motores. Penalizaciones crudas en positivo (§2.3). |
| 3 | Qué lo mueve (`combustible`) | IA | F2 (+ voto **Q3**, disfrute literal) + F3 si `tier ≤ media` | En `duo`/`disperso` el combustible mezcla ambos ejes. |
| 4 | Patrón de decisión + "Qué significa para la actividad" | Determinista (client-side, `classifyDecisionPattern`) | F8 | Clasificador independiente sobre tiempos; no se mezcla con eje/motor. Si `null`, la sección **no se afirma**. |
| 5 | Palabras puente / Palabras que generan ruido | Estático por arquetipo (+ extras) | F11 + F3 (extras del secundario) | Listas pre-escritas; la IA no las genera. |
| 6 | Tendencia secundaria (solo si hay párrafo) | Estático (computado), peso por IA | F3, F9, F4 | **Prominencia gobernada por B:** `duo`/`disperso`/B≤1 → destacada (segunda energía casi a la par); B≥4 → matiz menor. |
| 7 | Guía rápida (Activar / A considerar) | Estático base, IA ajusta tono | F2, F5, F6 | Los "a considerar" son condiciones de **entorno** a cuidar, nunca fallas del niño. |
| 8 | Checklist (Antes/Durante/Después) | IA | F11, F5, F8, F10 (si hay escena firma) | Puede referenciar la escena firma solo si está en `seleccionados`; una frase corta por campo. |
| 9 | Ecos fuera de la cancha (`ecos`) | IA | F2 (+ F3 en mezcla) | Generaliza la energía del eje fuera del deporte, en abstracto; probabilístico. |
| 10 | Consejo de reset (`reseteo`) | IA | F2, F5, F6 adaptación, F10b `coherencia_presion` | Invitación a ajustar entorno, no orden operativa. |

**Cobertura inversa (garantía anti-hueco):** cada hecho F1–F11 alimenta ≥1 sección; ninguna sección de IA carece de hecho-fuente. `tiebreaker_eje_aplicado` (F7) no se cita: solo modula confianza. `corazon`/`grupoEspacio` alimentan el prompt (como "Lenguaje de Intención") pero no son secciones propias en el render actual. **Regla de degradación:** si una fuente falta (`patron_decision == null`, `motor_source == time_fallback`), la sección se degrada al material disponible o se omite; nunca se rellena con afirmaciones sin respaldo.

**Campos que la IA reescribe** (interfaz real `AISections` de `generate-ai.ts`): `resumenPerfil, wow, motorDesc, combustible, corazon, reseteo, ecos, checklist{antes,durante,despues}`. Todo lo demás (`perfil, label, bienvenida, guia, palabrasPuente/Ruido, tendencia*`, patrón de decisión, AxisBars) es estático o determinista y **no pasa por el modelo**.

---

## 6. Contrato con la IA + qué filtro enforcea cada regla

**Entrada a Capa 2:** `ficha (§1.3) + esqueleto (qué bloque de §2 va en qué sección, ya resuelto) + WRITING_RULES + PROHIBITED_WORDS + DETERMINISTIC_PATTERNS`. La IA es un **traductor de estilo, no un autor de contenido**.

### 6.1 Cláusulas

1. **Cero invención (whitelist).** Todo lo que escriba debe ser paráfrasis de un concepto presente en el esqueleto. No puede nombrar un eje, motor, magnitud, escena ni anécdota que no esté en la ficha. Lo que no está, no existe.
2. **Honrar `confianza_tier` como registro de lenguaje.** `mezcla`/`baja` → mezcla al frente, hedge máximo, prohibido presentar el arquetipo como definido. `media` → líder + acompañante explícito. `alta`/`muy_alta` → dominante claro, **igual** en lenguaje probabilístico ("tiende a", "suele").
3. **Forma completa, no solo el ganador.** En `duo`/`disperso` describe dos energías o versatilidad; un 5-4 se narra como dos protagonistas, jamás "es un {arquetipo}".
4. **Momentos solo los provistos** (máx 2), anclados a su escena real con su `opcion_texto`. No inventa otras escenas ni cita preguntas no marcadas.
5. **Sub-motores solo si medidos.** Describe el patrón nombrado tal cual; `parejo` sin contraste; sin sub-motores en fallback.
6. **Re-encuadre positivo obligatorio.** Del "déficit" al "ritmo natural" y del "hacer" al "acompañar": toda penalización cruda es fortaleza de adaptación; los consejos son ajustes de **entorno** para el adulto, no órdenes ni correcciones al niño.
7. **Copy:** español latam neutro, tuteo (no voseo), sin guiones largos, buyer-neutral ("el niño", nunca "tu hijo"), foco en bienestar y disfrute. Es una "Invitación al Disfrute", no un "Manual del Niño".
8. **Cláusula de no-upgrade.** Ante la duda, **baja** la intensidad, nunca la sube: no convierte una inclinación en identidad, no sube un tier, no "redondea" un perfil disperso a un arquetipo limpio. El footer lo sella: *"Este informe es una fotografía del presente, no una etiqueta permanente."*

### 6.2 Los cuatro tipos de invención → qué filtro rebota cada uno

**[Elección]** Adopto el modelo de guards de Borrador B (el más completo), separando lo que **ya existe** en `generate-ai.ts` de lo que hay que **construir**.

| Invención | Ejemplo que se cuela | Filtro que la rebota | Estado |
|---|---|---|---|
| **Magnitud** | ficha dice `ligera`, IA escribe "predomina totalmente"; "siempre reacciona así" | **DETERMINISTIC_PATTERNS** (existe: rebota "siempre/nunca/totalmente/definitivamente/sin duda/garantiza/será/destinado") **+ band-guard** (NUEVO: intensidad verbal vs `banda_veta` licenciada) | patrones ✔ · band-guard ✱ |
| **Rasgo** | atribuye un eje que no es principal ni secundario ("es muy competitivo/D" con D=1 voto); rótulo clínico | **PROHIBITED_WORDS** (existe: déficit/clínico) **+ ground-truth de eje extendido a top-2** (existe validando eje correcto; extender a rechazar todo eje fuera de {dominante, secundario}) | prohibidos ✔ · GT top-2 ✱ |
| **Ejemplo** | "una vez en un partido tiró un caño y…" (anécdota inventada) | **closed-example guard** (NUEVO: rebota toda referencia a escena/anécdota que no sea un `seleccionados[]` por su etiqueta náutica exacta) | ✱ |
| **Momento no marcado** | cita "El Nudo Rebelde" sin que ese Q entre en `seleccionados` | **closed-moment guard** (NUEVO, mismo whitelist: solo las escenas de §4 son citables) | ✱ |

Complementan los filtros **existentes**: `findProhibitedWords` (PROHIBITED_WORDS, con `\b…\b` para palabras y substring para frases) y `findDeterministicHits` (DETERMINISTIC_PATTERNS, alto-precisión, corre contra el placeholder `__NAME__`).

### 6.3 Flujo de aplicación (respeta el pipeline real, NUNCA bloquea el informe)

1. Se genera con `__NAME__` como placeholder (el nombre real se rehidrata **después** de todos los checks).
2. Corren en orden: `findProhibitedWords` → `findDeterministicHits` → `groundTruthAxisCheck (top-2)` → `bandGuard` → `closedExample/MomentGuard`.
3. Si **cualquiera** dispara → **una sola** pasada de corrección con el detalle del hit (mismo proveedor), pidiendo reescritura full-JSON en lenguaje probabilístico fiel al esqueleto.
4. El retry se acepta **solo si todos** los checks quedan en cero; si no, se sirve el original saneado (o el estático `bienvenida` de fallback). Nunca se bloquea el informe.
5. Post-aceptación: `sanitizeSections` (strip HTML) → `rehydrateName` (`__NAME__` → nombre real).
6. Telemetría a `ai_events`: `prohibited_hit` / `prohibited_after_retry` (los guards nuevos se pliegan a estos booleanos; se recomienda una columna `guard_type` para separar magnitud/rasgo/ejemplo/momento).

### 6.4 Piezas nuevas a construir (todo lo demás ya existe)

1. **`buildEvidenceFicha`** (Capa 1): función determinista que emite el JSON de §1.3 desde `answers` + métricas de juego, reutilizando `resolveFromAnswers` y `classifyDecisionPattern`.
2. **band-guard:** validador léxico intensidad-vs-`banda_veta`.
3. **ground-truth extendido a top-2:** rechaza todo eje atribuido al niño fuera de {dominante, secundario} (los ejes de momentos se permiten solo anclados a escena).
4. **closed-example / closed-moment guard:** whitelist de escenas = `momentos.seleccionados[]`; rebota toda otra escena náutica o anécdota real.

Los tres guards nuevos son deterministas, corren sin IA y comparten el camino "un retry → si no, fallback estático → nunca bloquea".

---

## Anexo A — Ejemplo trabajado: dos "Impulsor Dinámico" que se leen distinto

Prueba de que el esqueleto separa a dos chicos del mismo arquetipo por **cinco discriminadores** (forma del voto, eje secundario, divergencia de sub-motores, momentos notables, patrón de decisión):

**Niño A** — votos `D6 C3 S2 I1`, `B=3` → `banda_veta: clara`, `forma: lider_con_sombra`. Secundario `C` → *con tendencia al detalle*. Juegos: Impulso 82 (Alto), Ritmo 60, Adaptación 45, `spread=37` → `arranque_fuerte_ajuste_con_aviso`. Momento contra-tendencia: voto único `I` en Q12/Meta (score 3+1=4 → califica). Escena firma: `D` en Q5/Tormenta. Patrón: `cierre_desgaste`.
→ Retrato: impulso con ojo para el detalle, se enciende fuerte y hacia el final agradece un relevo, y sorprende con un gesto de equipo justo en la llegada.

**Niño B** — votos `D6 I4 S1 C1`, `B=2` → `banda_veta: clara`, `forma: lider_con_sombra`. Secundario `I` → *con tendencia a lo social*. Juegos: Impulso 70, Ritmo 75, Adaptación 80, `spread=10` → `parejo`. Contra-tendencia: singleton `C` en Q1/Puerto (score 3+0=3 → NO califica) → sin momento de contraste; se usa `escena_firma` `D` en Q6/Tormenta. Patrón: `constante`.
→ Retrato: impulso muy social, motor parejo que sostiene de principio a fin, sin picos ni bajones.

Mismo arquetipo, dos informes que suenan a dos chicos reales.

---

## Anexo B — Calibración pendiente

Las bandas de §2.2 usan `B` apoyadas en la media (3) y SD (≈1.5) exactas del multinomial(12, 0.25). Los **percentiles empíricos** de `P(B ≥ k)` y de cada `forma_perfil` bajo respuesta aleatoria deben fijarse con una **simulación Monte Carlo** e inyectarse en config, para mostrar internamente (no al usuario) un percentil real de "cuán por encima del azar" está cada perfil. Hasta entonces las bandas son conservadoras por diseño (`B ≤ 1` = mezcla). **Recomendación:** loguear `votos`, `B`, `confianza_tier`, `motor_source` y `motor_confianza` en telemetría para validar la distribución real contra la teórica y ajustar umbrales con datos.

Fuentes de código que anclan cada número: `src/lib/profileResolver.ts` (votos, brecha, secundario, motor, desempates), `src/lib/argosEngine.ts` (`resolveMotorFromGames`, pesos 0.30/0.30/0.40, cortes 67/33), `src/lib/decisionPattern.ts` (`classifyDecisionPattern`), `src/lib/onboardingDataI18n.ts` (mapa opción→eje), `api/generate-ai.ts` (`WRITING_RULES`, `PROHIBITED_WORDS`, `DETERMINISTIC_PATTERNS`, veto y rehidratación).

---

# Parte B — Contrato de formato

# CONTRATO DE FORMATO DETERMINISTA — Capa 1 del Informe Argo

> **Objetivo del owner:** *"todos los informes diferentes, pero iguales en estructura."*
> Este contrato fija el **molde invariante**: qué secciones existen SIEMPRE, cuánto miden, con qué forma interna, y qué dicen cuando el dato ideal no aparece. La variabilidad vive en el contenido (Capa 2 reescribe la prosa); el esqueleto no varía **nunca**. Ningún informe puede tener una sección de más, de menos, más larga o más corta que su rango. El validador de §Final es una **regla dura**, no una sugerencia: rechaza y regenera la sección infractora.

---

## 0. Reglas de conteo (deterministas, para que el validador sea reproducible)

Todo rango se mide con estas unidades exactas. El validador cuenta así y no de otra forma.

| Unidad | Definición operativa |
|---|---|
| **frase** | segmento no vacío tras `split(/[.!?…]+(?:\s|$)/)` sobre el texto plano (post-`sanitizeSections`). Un `**negrita**` no abre frase. |
| **palabra** | token tras `trim().split(/\s+/)`, contando solo tokens con ≥1 carácter alfanumérico. |
| **ítem** | longitud del array (`palabrasPuente.length`, filas de guía, claves de checklist). |
| **bloque** | clave obligatoria presente y no vacía en un objeto (`checklist.antes/durante/despues`). |

Regla transversal: **una sección presente jamás queda vacía** (string `""`, array `[]` o solo whitespace es tratado como AUSENTE por el validador). La única ausencia legítima está marcada explícitamente abajo (Patrón de decisión con `patron_decision == null`).

---

## 1. Encabezado de página · `reportTitle` + `guardian`

| Atributo | Especificación |
|---|---|
| **(a) PRESENCIA** | **Siempre.** UI estática, nunca condicional, nunca tras el lock. |
| **(b) LARGO** | Fijo: 1 título (`"Informe de perfil"`) + 1 subrótulo (`"Adulto responsable"` + nombre del adulto). Sin prosa generada. |
| **(c) FORMA** | 2 líneas estáticas. No pasa por IA. |
| **(d) CASO NULO** | Sin nombre de adulto → se muestra solo el rótulo `"Adulto responsable"`; nunca se omite el bloque. |

---

## 2. Hero: arquetipo + Retrato de Sintonía (`resumenPerfil`) · el corazón

Es el bloque más largo y el único que debe **sonar a ESTE niño**. Aquí se enrutan los momentos notables (F10) como material principal.

| Atributo | Especificación |
|---|---|
| **(a) PRESENCIA** | **Siempre** (pre-lock, visible en trial/demo). El arquetipo, el motor-chip y las AxisBars son deterministas y nunca faltan; el `resumenPerfil` es IA con fallback garantizado. |
| **(b) LARGO** | **Retrato (`resumenPerfil`): 4–6 frases, 55–130 palabras.** El más largo del informe por diseño (es el corazón). · Headline `perfil`: 1 línea estática. · Motor-chip: 1 chip. · AxisBars: exactamente **4** barras. |
| **(c) FORMA** | Orden fijo del Retrato: (1) apertura con la energía dominante **calibrada al `confianza_tier`**; (2) integración del **motor** (F5) en clave de ritmo; (3) al menos **1 `momento.seleccionados`** parafraseado y anclado a su escena náutica, si existe; (4) pincelada de tendencia secundaria (F9) con el peso que dicta `banda_veta`; (5) cierre suave, sin sentencia. AxisBars: `votos_pct` de los 4 ejes, siempre las 4, en orden D·I·S·C. |
| **(d) CASO NULO** | **Sin `resumenPerfil` de IA** → cae al `bienvenida` estático del arquetipo (2–4 frases); la sección nunca queda vacía. · **`momentos.seleccionados == []`** → el Retrato describe la energía en abstracto y **no cita ninguna escena** (lo enforcea el closed-moment guard). · **`banda_veta ∈ {equilibrio, ligera}` o `forma ∈ {duo, disperso}`** → la apertura habla de **dos energías al frente** (no "es un {arquetipo}"), hedge máximo; el secundario deja de ser pincelada y sube a co-protagonista. · **`motor_confianza` baja** → el Retrato no cierra afirmaciones fuertes de ritmo ("parece moverse con un pulso…" en vez de "su motor es…"). |

---

## 3. Motor de rendimiento · `motorDesc`

| Atributo | Especificación |
|---|---|
| **(a) PRESENCIA** | **Siempre** (visible pre-lock). |
| **(b) LARGO** | **2–4 frases, 30–75 palabras.** |
| **(c) FORMA** | (1) enunciado del composite-band (Dinámico/Rítmico/Sereno) en concepto aprobado (§2.3); (2) **exactamente el patrón que trae `motor_divergencia`** y ninguno más; penalizaciones crudas siempre en positivo. |
| **(d) CASO NULO** | **`motor_divergencia == "parejo"`** → describe cadencia pareja, **sin forzar contraste** de sub-motores. · **`motor_source ∈ {time_fallback, vote_fallback}`** → prohibido mencionar sub-motores (no se midieron); se apoya solo en el composite-band + patrón de decisión; se contrae a **1–2 frases** (el rango mínimo aplica, no el máximo). · Sin `motorDesc` de IA → fallback estático `motorDesc`-semilla del arquetipo. |

---

## 4. Qué lo mueve · `combustible` *(locked)*

| Atributo | Especificación |
|---|---|
| **(a) PRESENCIA** | **Siempre** (dentro del bloque locked; presente cuando el informe completo se muestra). |
| **(b) LARGO** | **2–3 frases, 25–60 palabras.** |
| **(c) FORMA** | Combustible del eje dominante (§2.1) atado al **disfrute literal de Q3** (F2); si `tier ≤ media` suma el combustible del secundario (F3). |
| **(d) CASO NULO** | El dominante siempre existe → nunca hay null de fuente. · **`forma ∈ {duo, disperso}`** → el combustible **mezcla ambos ejes** en igual peso. · Sin IA → fallback estático `combustible`-semilla. |

---

## 5. Patrón de decisión + "Qué significa para la actividad" · determinista

**Única sección con ausencia sancionada.** No pasa por IA; sale de `classifyDecisionPattern` (tiempos).

| Atributo | Especificación |
|---|---|
| **(a) PRESENCIA** | **Presente si y solo si `patron_decision != null`** (≥6 tiempos válidos). Es la ÚNICA omisión legítima del informe. Con `null`, la sección **se omite entera** (sin header huérfano): rellenarla con genérico violaría la honestidad, así que su ausencia limpia **es válida** para el validador. |
| **(b) LARGO** | Etiqueta de patrón (1 frase, concepto fijo de §2.5) + implicación **1–2 frases, 15–45 palabras**. Ambos textos **estáticos** por salida del clasificador. |
| **(c) FORMA** | 2 sub-bloques rotulados: patrón + "Qué significa para la actividad". Clasificador independiente sobre tiempos: **no se mezcla** con eje ni motor. |
| **(d) CASO NULO** | `patron_decision == null` → **sección omitida** (no vacía: ausente). El validador exige la equivalencia estricta: *presente ⟺ `patron_decision != null`*. Presencia con `null` = INVÁLIDO; ausencia con patrón ≠ null = INVÁLIDO. |

---

## 6. Palabras puente / Palabras que generan ruido · estático

| Atributo | Especificación |
|---|---|
| **(a) PRESENCIA** | **Siempre** (locked). Dos listas, ambas obligatorias. |
| **(b) LARGO** | **N exacto por arquetipo**, idéntico en todos los informes del mismo arquetipo. Piso duro **≥3**, techo **≤6** por lista. (Recomendado 4 + 4.) `palabrasPuenteExtra`/`palabrasRuidoExtra` del secundario se **anexan** sin bajar del piso ni pasar el techo. |
| **(c) FORMA** | Dos arrays rotulados (`Palabras puente` / `Palabras que suelen generar ruido`). **Pre-escritas**, la IA no las genera ni edita. |
| **(d) CASO NULO** | Siempre existen por arquetipo → nunca vacías. Si faltaran los extras del secundario, se muestran solo las base (nunca por debajo de N=3). |

---

## 7. Tendencia secundaria · estático (peso por IA)

**[Ajuste sobre el render actual]** El código sólo la muestra "si hay párrafo"; para cumplir *"nunca se saltee"*, Capa 1 **siempre computa** un `tendenciaParagraph` mínimo desde `eje_secundario` (F3/F9), de modo que la sección jamás quede fuera.

| Atributo | Especificación |
|---|---|
| **(a) PRESENCIA** | **Siempre.** Capa 1 garantiza `tendenciaLabel` (existe para todo secundario) + al menos 1 frase de párrafo. |
| **(b) LARGO** | **1–2 frases, 12–40 palabras.** El **peso** (1 vs 2 frases y su prominencia verbal) lo fija `banda_veta`: `duo`/`disperso`/`B≤1` → 2 frases, casi co-protagonista; `B≥4` (`marcada`/`definida`) → 1 frase, matiz menor. |
| **(c) FORMA** | Rótulo `Tendencia secundaria: {tendenciaLabel}` + párrafo. Label fijo de `TENDENCIA_LABELS` (§2.4). |
| **(d) CASO NULO** | **`banda_veta == equilibrio` (B=0, co-líderes)** → se re-encuadra como **"dos energías co-líderes"** en vez de "secundaria", pero la sección **sigue presente** (no se fuerza un dominante inexistente). · Secundario con muy pocos votos → párrafo mínimo (1 frase, hedge máximo), nunca ausente. |

---

## 8. Guía rápida (Activar / A considerar) · estático base, tono por IA

| Atributo | Especificación |
|---|---|
| **(a) PRESENCIA** | **Siempre** (locked). |
| **(b) LARGO** | **R filas fijas por arquetipo**, piso **2**, techo **4** (recomendado 3). Cada celda **1 frase, 5–18 palabras**. Cada fila SIEMPRE trae ambas columnas (`Activar` + `A considerar`) no vacías. |
| **(c) FORMA** | Tabla de pares `Activar` / `A considerar`. Los "A considerar" son **condiciones de entorno a cuidar**, nunca fallas del niño. |
| **(d) CASO NULO** | Base estática siempre existe. Si la IA no ajusta el tono → se sirve el base tal cual. Nunca una fila con una sola columna. |

---

## 9. Checklist del día (Antes / Durante / Después) · IA

| Atributo | Especificación |
|---|---|
| **(a) PRESENCIA** | **Siempre** (locked). |
| **(b) LARGO** | **Exactamente 3 bloques** (`antes`, `durante`, `despues`), ni uno más ni uno menos. Cada bloque **1 frase (máx 2), 6–26 palabras**. |
| **(c) FORMA** | Objeto de 3 claves obligatorias, cada una una frase corta y fluida (regla `formatRule`: sin listas, sin HTML). Puede referenciar la **escena firma sólo si está en `seleccionados[]`**. |
| **(d) CASO NULO** | **`seleccionados == []`** → los 3 bloques usan fraseo genérico-al-arquetipo, **sin citar ninguna escena**. · Sin IA → fallback estático `checklist` del arquetipo. · Un bloque vacío es INVÁLIDO: se regenera solo ese bloque, o cae al estático de ese campo. |

---

## 10. Ecos fuera de la cancha · `ecos` · IA

| Atributo | Especificación |
|---|---|
| **(a) PRESENCIA** | **Siempre** (locked). |
| **(b) LARGO** | **2–3 frases, 25–60 palabras.** |
| **(c) FORMA** | Generaliza la energía del eje dominante **fuera del deporte, en abstracto**, en lenguaje probabilístico; en mezcla suma el secundario (F3). |
| **(d) CASO NULO** | Dominante siempre existe. Sin IA → fallback estático `ecos`-semilla. |

---

## 11. Consejo de reset · `reseteo` · IA

| Atributo | Especificación |
|---|---|
| **(a) PRESENCIA** | **Siempre** (locked). |
| **(b) LARGO** | **1–2 frases, 12–40 palabras.** |
| **(c) FORMA** | Invitación a **ajustar el entorno** (no orden operativa), usando el sub-motor de Adaptación (F6) y el tono de `coherencia_presion` (F10b). |
| **(d) CASO NULO** | Con `motor_source` fallback → se apoya solo en el eje dominante y el tono de presión; sin IA → fallback estático `reseteo`-semilla. |

---

## 12. Footer · estático

| Atributo | Especificación |
|---|---|
| **(a) PRESENCIA** | **Siempre.** |
| **(b) LARGO** | Fijo: `"Generado por ArgoMethod®"` + `"Este informe es una fotografía del presente, no una etiqueta permanente."` |
| **(c) FORMA** | 2 líneas estáticas. Sella la cláusula de no-upgrade. |
| **(d) CASO NULO** | N/A (invariante). |

---

## HOJA DE CONTRATO (lookup único para el validador)

| # | Sección | Presencia | Rango | Forma dura verificable |
|---|---|---|---|---|
| 1 | Encabezado | siempre | 1 título + 1 subrótulo | 2 líneas estáticas |
| 2a | Retrato `resumenPerfil` | siempre (fallback `bienvenida`) | **4–6 frases / 55–130 pal** | escena solo si `seleccionados≠[]` |
| 2b | AxisBars | siempre | **exactamente 4 barras** | suman 12 votos / D·I·S·C |
| 2c | Motor-chip | siempre | 1 chip | ∈ {Dinámico, Rítmico, Sereno} |
| 3 | Motor `motorDesc` | siempre | 2–4 frases / 30–75 pal (fallback: 1–2) | patrón == `motor_divergencia`; sin sub-motores si fallback |
| 4 | Qué lo mueve `combustible` | siempre | 2–3 frases / 25–60 pal | — |
| 5 | Patrón de decisión | **⟺ `patron_decision≠null`** | implicación 1–2 frases / 15–45 pal | omitida si null (única omisión válida) |
| 6 | Palabras puente / ruido | siempre | N por arquetipo, **3≤N≤6** cada lista | 2 arrays no vacíos |
| 7 | Tendencia secundaria | siempre (Capa 1 garantiza párrafo) | 1–2 frases / 12–40 pal | label ∈ `TENDENCIA_LABELS` |
| 8 | Guía rápida | siempre | **2–4 filas**, celda 1 frase / 5–18 pal | cada fila con ambas columnas |
| 9 | Checklist | siempre | **exactamente 3 bloques**, c/u 1–2 frases / 6–26 pal | claves `antes/durante/despues` no vacías |
| 10 | Ecos | siempre | 2–3 frases / 25–60 pal | — |
| 11 | Reset `reseteo` | siempre | 1–2 frases / 12–40 pal | — |
| 12 | Footer | siempre | 2 líneas fijas | invariante |

---

## VALIDADOR POST-GENERACIÓN (Capa 1 · REGLA DURA, no sugerencia)

Corre **después** de generar/mergear las secciones y **antes** de `rehydrateName`, junto al pipeline de guards existente (`findProhibitedWords → findDeterministicHits → groundTruth → bandGuard → closedMoment`). Es determinista, sin IA. Verifica **presencia + rango + forma** de cada sección de la Hoja de Contrato. Si algo **falta, se pasa o queda corto**, la sección se **rechaza y se regenera** (retry dirigido a esa sola sección); nunca bloquea el informe.

### Verdictos por sección

```
validateSection(sec) → OK | MISSING | OUT_OF_RANGE | MALFORMED
```

1. **PRESENCIA.** Si la sección es obligatoria y su valor es `null`/`""`/`[]`/solo-whitespace → `MISSING`.
   - Excepción codificada: Patrón de decisión exige la **equivalencia estricta** `presente ⟺ patron_decision != null`. Presente con `null` → `MALFORMED`; ausente con patrón ≠ null → `MISSING`.
2. **RANGO.** Cuenta frases/palabras/ítems (reglas §0) contra `[min,max]` de la Hoja. `count < min` o `count > max` → `OUT_OF_RANGE`.
3. **FORMA.** Chequeos estructurales duros:
   - AxisBars: exactamente 4 barras, `Σ votos == 12`.
   - Motor-chip ∈ {Dinámico, Rítmico, Sereno}.
   - `motorDesc`: si `motor_source` es fallback → **no** puede nombrar sub-motores (léxico de Impulso/Ritmo/Adaptación prohibido).
   - Checklist: exactamente las 3 claves, todas no vacías.
   - Palabras puente/ruido: dos arrays, cada uno `3 ≤ len ≤ 6`.
   - Guía: `2 ≤ filas ≤ 4`, cada fila con `activate` y `consider` no vacíos.
   - Retrato/Checklist: si `momentos.seleccionados == []`, ninguna etiqueta náutica del set §4 puede aparecer (se apoya en el closed-moment guard).

### Bucle de reparación (por sección, no global)

```
for sec in SECCIONES_CONTRATO:
    v = validateSection(sec)
    if v == OK: continue
    regenerar SOLO sec  (1 retry dirigido: se pasa a la IA el defecto exacto —
                         "quedó en {n} frases, el rango es {min}-{max}; reescribí solo esta sección")
    if validateSection(sec) != OK:
        sec = fallbackEstatico(sec)      // bienvenida / *-semilla / lista base del arquetipo
        if validateSection(sec) != OK:   // p. ej. estático también fuera de forma
            sec = recortarOClamp(sec)    // truncado determinista a max, o padding-mínimo estático a min
// El informe SIEMPRE se sirve. Nunca se bloquea.
```

- **Presupuesto:** 1 retry por sección. Comparte proveedor y camino con el pipeline real.
- **Prioridad de degradación:** IA regenerada → estático del arquetipo → clamp/truncado determinista. En ningún paso una sección obligatoria queda vacía ni fuera de rango en el output final.
- **Telemetría:** cada verdicto ≠ OK se registra en `ai_events` con un `guard_type` recomendado (`presence` / `range` / `form`), plegado a los booleanos existentes `prohibited_hit` / `prohibited_after_retry` si no se agrega la columna.

### Garantía que entrega el validador

Todo informe que sale cumple, sección por sección: **presencia** (con la única omisión sancionada de Patrón de decisión), **rango** (dentro de `[min,max]`) y **forma** (estructura fija). Dos informes cualesquiera tienen **el mismo esqueleto, las mismas secciones, los mismos rangos y las mismas formas** — y contenido distinto. Eso es, literalmente, *"todos diferentes, pero iguales en estructura"*.

---

# Parte C — Informes de ejemplo (prueba: distintos pero iguales en estructura)

Seis casos límite trazados por el esqueleto: perfil claro sin veta (Clara), veta fuerte (Mateo), empate a tres / baja confianza (Lucía), sin momentos notables (Tomás), divergencia extrema de motor (Sofía), empate total 3/3/3/3 (Benja).

## Ejemplo 1

A continuación, el informe de Clara resuelto tal como lo emitiría la Capa 1 (determinista) y lo reescribiría la Capa 2, respetando el esqueleto canónico, el contrato de formato y las copy rules. Todo número sale de sus datos; cada frase de prosa queda anclada a un hecho `(Fn)` de la ficha o a la biblioteca §2.

---

## PASO 1 — FICHA DE EVIDENCIA (100% determinista)

Cómputo previo sobre sus votos `S7 I2 C2 D1` (suman 12):
- Dominante = **S** (7). Segundo lugar = **empate I=2 / C=2**.
- `B = 7 − 2 = 5` → banda_veta **`marcada`**, confianza **`alta`**.
- `forma_perfil`: `pico` exige `top≥6 ∧ B≥3` → 7≥6 y 5≥3 → **`pico`**.
- `n_ejes_fuertes` (ejes con ≥3 votos) = **1** (solo S; I,C,D quedan por debajo de 3).
- Bajo azar el conteo esperado por eje es 3 (SD≈1.5): S está a ~2.7 SD por encima (señal fuerte); **el segundo eje (2) queda por debajo del azar** → es ruido ipsativo, no una veta real.

```jsonc
{
  "votos":        { "D":1, "I":2, "S":7, "C":2 },              // (F1) suman 12
  "votos_pct":    { "D":8, "I":17, "S":58, "C":17 },           // (F1) para AxisBars, orden D·I·S·C
  "eje_dominante":"S",  "top_count":7,                          // (F2)
  "eje_secundario":"I", "second_count":2,                       // (F3) empate I=C=2 → tiebreak, ver §3
  "brecha":       5,                                            // (F4) B = 7 − 2
  "banda_veta":   "marcada",                                    // (F4) B∈4-5
  "confianza_tier":"alta",                                      // (F4)
  "forma_perfil": "pico",                                       // (F4b) top≥6 ∧ B≥3
  "n_ejes_fuertes":1,                                           // (F4b) solo S ≥3
  "tiebreaker_eje_aplicado":false,                              // (F7) dominante no fue empate; NO se cita

  "motor":        "Rítmico",                                    // (F5) composite en 34-66
  "motor_source": "games_full",                                // sub-puntajes medidos
  "motor_composite":50,                                         // (F5) ~50, lejos de umbrales 34/67 → sin transición
  "submotores":   { "impulso":48, "ritmo":52, "adaptacion":50,
                    "spread":4, "lead":"ritmo", "lag":"impulso" }, // (F6) parejos
  "motor_divergencia":"parejo",                                // (F6) spread 4 < 25
  "motor_confianza":"alta",                                    // (F6) games_full + spread<25 + composite no fronterizo

  "patron_decision":"constante",                               // (F8) asume ≥6 tiempos válidos; ver caso null en Paso 3

  "tendencia_label":"con tendencia a lo social",               // (F9) TENDENCIA_LABELS[I]

  "momentos": {
    "seleccionados":[                                          // (F10) tope 2; aquí 1 (solo grounding)
      { "tipo":"escena_firma", "q":5, "escena":"La Tormenta",
        "opcion_texto":"Mantengo mi posición para que el barco no se mueva",
        "eje_opcion":"S", "framing":"observacion_escena_ancla_no_rasgo" }
    ],
    "coherencia_presion":true                                  // (F10b) votó S en Q5,Q6,Q7
  },

  "arquetipo_id":"S_Ritmico", "arquetipo_label":"Sostenedor Rítmico" // (F11)
}
```

Cómputo de momentos (§4), que justifica `seleccionados` con 1 solo elemento:
- **`escena_firma`**: entre sus votos S, el de máxima salencia es **Q5 (Tormenta, salencia 3)** → seleccionado (garantiza grounding).
- **`tormenta_divergente`**: NO dispara. El eje modal de Q5+Q6+Q7 es **S = dominante**, no un eje distinto → en vez de momento, marca `coherencia_presion=true`.
- **`contra_tendencia`**: el único candidato es el voto singleton **D** (Q8, Calma, salencia 1). Score = +3 (singleton) + 0 (sin escena salente) + **[+1 "no es el secundario" NO se aplica, ver Paso 3 · empate]** = **3 < 4 → no califica**.

---

## PASO 2 — CADA SECCIÓN DEL INFORME (contenido que le toca)

### 1 · Encabezado — `reportTitle` + `guardian` *(estático, 2 líneas)*
> **Informe de perfil**
> Adulto responsable: [nombre del adulto]

Anclas: UI estática, no pasa por IA. Presencia siempre.

### 2 · Hero: arquetipo + Retrato de Sintonía

**Headline (estático):** `Sostenedor Rítmico` (F11) · **Motor-chip (determinista):** `Rítmico` (F5)

**AxisBars (determinista, F1, orden D·I·S·C, suman 12):**
`D ▏8%` · `I ▎17%` · `S ▇▇▇ 58%` · `C ▎17%`

**Retrato (`resumenPerfil`, IA) — 5 frases / ~105 palabras (rango 4–6 / 55–130):**
> Clara se mueve con una Energía de Sostén que aparece con claridad: tiende a ser un punto de apoyo estable para el equipo, alguien que aporta constancia y calma firme. Su motor suele sostener un pulso parejo, sin arranques explosivos ni pausas largas, apoyándose en la seguridad de un ritmo previsible. En plena tormenta eligió mantener su posición para que el barco no se moviera, un gesto que refleja bien esa firmeza serena cuando todo se agita. Cada tanto asoma también una chispa de conexión con los demás, un matiz suave que acompaña sin robar protagonismo. Nada de esto es una foto fija: describe cómo se mueve hoy.

Anclas por frase: (1) apertura con energía dominante calibrada a `tier alta` → S (F2, F4); (2) motor Rítmico (F5); (3) **momento escena_firma Q5/La Tormenta** parafraseado y anclado (F10); (4) pincelada de tendencia secundaria I, mínima por `banda marcada` (F9); (5) cierre suave, sin sentencia (cláusula no-upgrade).

### 3 · Motor de rendimiento — `motorDesc` (IA), 2 frases / ~48 palabras (rango 2–4 / 30–75)
> El motor de Clara tiende a moverse en un registro rítmico: sostiene un pulso parejo, ni se enciende de golpe ni se toma pausas largas. Arranca, sostiene y se reacomoda de forma bastante pareja, y suele rendir mejor en lo repetible y sostenido, donde el ritmo se mantiene estable.

Anclas: composite-band Rítmico (F5); patrón **`parejo`** exacto de `motor_divergencia` (F6), **sin forzar contraste** de sub-motores. Ninguna penalización cruda (§2.3).

### 4 · Qué lo mueve — `combustible` (IA), 2 frases / ~44 palabras (rango 2–3 / 25–60)
> A Clara la mueve el ritmo estable y la sensación de sostener al equipo. Cuando eligió qué disfruta del viaje, se inclinó por mantener un ritmo constante: esa cadencia previsible en la que se siente segura y desde donde aporta lo mejor de sí.

Anclas: combustible del eje S (§2.1, F2) atado al **disfrute literal de Q3** ("mantener un ritmo constante"). `tier=alta` (> media) → **no se suma el secundario** (F3 se omite por regla).

### 5 · Patrón de decisión + "Qué significa para la actividad" *(determinista, F8)*
> **Patrón:** sostiene un pulso parejo de principio a fin.
> **Qué significa para la actividad:** suele mantener su nivel de foco a lo largo de la actividad, sin grandes altibajos; le viene bien un entorno con consignas claras y estables donde ese ritmo parejo pueda expresarse.

Implicación: 1 frase / ~30 palabras (rango 1–2 / 15–45). Clasificador independiente sobre tiempos; no se mezcla con eje ni motor. *(Presencia condicionada, ver Paso 3.)*

### 6 · Palabras puente / que generan ruido *(estático por arquetipo, F11)*
> **Palabras puente (4):** "Tómate tu tiempo" · "Cuento contigo" · "Paso a paso" · "Tu constancia suma"
> **Palabras que suelen generar ruido (4):** "Apúrate" · "Cambio de planes ya" · "Improvisa" · "Reacciona en el acto"

Piso ≥3, techo ≤6 por lista. La IA no las genera ni edita. Extras del secundario (I) podrían anexarse, pero con `tier alta` se sirven solo las base sin superar el techo.

### 7 · Tendencia secundaria *(estático, peso por IA)*, 1 frase / ~33 palabras (rango 1–2 / 12–40)
> **Tendencia secundaria: con tendencia a lo social.** Muy de fondo, a Clara le asoma de a ratos el gusto por compartir con el grupo y sumar ánimo, un matiz apenas perceptible que acompaña sin definir su manera de jugar.

Anclas: label fijo `TENDENCIA_LABELS[I]` (F9). Peso = **1 frase, matiz menor**, porque `banda marcada` (B≥4). *(Caso empate/ruido: ver Paso 3.)*

### 8 · Guía rápida (Activar / A considerar) *(estático base, tono por IA)* — 3 filas
| Activar | A considerar |
|---|---|
| Dale previsibilidad y tiempo para acomodarse a lo nuevo. | Los cambios bruscos de consigna pueden costarle al arranque. |
| Reconoce su constancia y su papel de sostén del grupo. | Un aviso anticipado antes de un cambio le da seguridad. |
| Ofrécele un ritmo estable donde encuentre su cadencia. | La presión por reaccionar de golpe puede tensionarla. |

Anclas: F2, F5. Cada celda 1 frase / 5–18 palabras, ambas columnas presentes. Los "A considerar" son **condiciones de entorno**, nunca fallas de Clara.

### 9 · Checklist del día *(IA)* — exactamente 3 bloques (6–26 palabras c/u)
> **Antes:** Ayúdala a ubicarse con calma en lo que viene; un repaso tranquilo del plan le da seguridad.
> **Durante:** Confía en su constancia; si todo se agita, suele mantener su posición firme, como en la tormenta.
> **Después:** Reconoce su aporte estable al grupo y date un momento para escuchar cómo se sintió.

Anclas: F11, F5. **"Durante" referencia la escena firma** (La Tormenta) porque está en `seleccionados[]` (licencia del closed-moment guard).

### 10 · Ecos fuera de la cancha — `ecos` (IA), 2 frases / ~55 palabras (rango 2–3 / 25–60)
> Fuera de la cancha, esa misma Energía de Sostén suele notarse en la vida diaria de Clara: tiende a ser alguien constante y de fiar, un punto de calma en el que otros se apoyan. En grupos y rutinas, es probable que aporte estabilidad y sostenga el clima cuando las cosas se ponen movidas.

Anclas: generaliza la energía del eje S (F2) **en abstracto**, probabilístico. `tier alta` → sin mezcla del secundario.

### 11 · Consejo de reset — `reseteo` (IA), 1 frase / ~30 palabras (rango 1–2 / 12–40)
> Para que Clara recupere su eje, suele ayudarle un momento de calma y un ritmo previsible antes de retomar; anticípale los cambios con un pequeño aviso y su seguridad vuelve sola.

Anclas: sub-motor de Adaptación (F6) + tono de `coherencia_presion` (F10b). Invitación a ajustar entorno, no orden operativa.

### 12 · Footer *(estático, invariante)*
> Generado por ArgoMethod®
> Este informe es una fotografía del presente, no una etiqueta permanente.

---

## PASO 3 — RESOLUCIÓN EXPLÍCITA DE LOS CASOS NULOS

**A) EMPATE de secundario (I=2 / C=2) — aplica.**
El pseudocódigo §3 ordena por conteo desc; ante el empate en segundo lugar, el desempate determinista usa el orden canónico de eje **D>I>S>C** → entre {I, C} gana **I** → `eje_secundario = I`, `tendencia_label = "con tendencia a lo social"`. Como **ambos empatados (2) están por debajo del azar (3)**, la elección es casi cosmética: la sección 7 se **hedgea al piso** ("muy de fondo", "apenas perceptible") y **sigue presente** (nunca se omite). Efecto de segundo orden: el empate en el piso de ruido **suprime el bonus "+1 no es el secundario"** del scoring `contra_tendencia`, porque no existe un secundario limpio del cual el singleton D pueda distinguirse (toda la cola 2-2-1 es ruido ipsativo). Esto enlaza directamente con el caso (C).

**B) SIN VETA (secundario real) — aplica, con aclaración de terminología.**
Hay que separar dos usos de "veta":
- El **campo** `banda_veta = "marcada"` no describe un secundario: mide la **brecha de dominancia** (B=5, S muy por encima). Por eso `confianza_tier = alta`.
- La ausencia de una **veta secundaria** (lo que la ficha llama "sin veta marcada") se codifica en **`forma_perfil = "pico"` + `n_ejes_fuertes = 1`** + segundo eje por debajo del azar.
Resolución: es un **pico limpio**. El Retrato (§2) abre con **una sola** energía dominante y firme; el secundario baja de co-protagonista a **pincelada** (§2.4, banda marcada). No se narra como `duo`/`disperso`. Lenguaje igualmente probabilístico ("tiende a", "suele"), nunca identidad fija (cláusula no-upgrade §6.1.8).

**C) SIN MOMENTOS de contraste — aplica.**
- `tormenta_divergente`: **no dispara** (sus 3 votos de tormenta son S = dominante) → en su lugar `coherencia_presion=true`, que solo modula el tono (secciones 9 y 11), no cita escena.
- `contra_tendencia`: el único candidato (singleton D) queda en **score 3 < 4** tras la supresión del bonus por el empate del secundario → **no se selecciona ningún momento de contraste**.
- Queda **solo la `escena_firma` de grounding** (S en La Tormenta), que es un ancla de "quién es", no un contraste. Por eso `seleccionados` tiene 1 elemento y el informe suena a Clara sin inventar excepciones.
- **Sub-caso de nulo total** (para mostrar el molde): si Clara nunca hubiese votado S en una escena de salencia ≥1 (todos sus S en Puerto/Calma), `escena_firma` también se omitiría → **`seleccionados = []`**. Entonces el Retrato (§2) y el Checklist (§9) describirían la Energía de Sostén **en abstracto y no citarían NINGUNA escena náutica** (lo fuerza el closed-moment guard); la estructura y los rangos se mantienen idénticos, solo cambia el contenido.

**D) Nota sobre Patrón de decisión (§5) — la única omisión sancionada.**
Aquí lo dejé presente con `patron_decision = "constante"` asumiendo ≥6 tiempos válidos. Si la partida hubiese registrado <6 tiempos → `patron_decision = null` → la sección 5 se **omite entera** (sin header huérfano). Es la **única** ausencia legítima del contrato; el validador exige la equivalencia estricta `presente ⟺ patron_decision != null`.

---

**Conclusión de la demostración.** El informe de Clara sale con **las 12 secciones del molde**, cada una dentro de su rango de frases/palabras y su forma dura (4 AxisBars que suman 12, motor-chip ∈ {Dinámico, Rítmico, Sereno}, checklist de exactamente 3 bloques, listas de 3–6, etc.). Los tres nulos (empate, sin veta secundaria, sin momentos de contraste) se resuelven **degradando contenido, nunca estructura**: hedge al piso, pico limpio de una energía, grounding sin contraste. Es un informe inconfundiblemente individual con esqueleto idéntico al de cualquier otro chico.

---

## Ejemplo 2

A continuación, el informe de Mateo derivado **solo** de la Capa 1 determinista y reescrito según el contrato. Nada de lo que aparece abajo sale de fuera de la ficha.

---

## PASO 1 — FICHA DE EVIDENCIA (100% determinista)

```jsonc
{
  // VOTOS (F1) — suman 12
  "votos":      { "D":5, "I":2, "S":1, "C":4 },
  "votos_pct":  { "D":41.7, "I":16.7, "S":8.3, "C":33.3 },  // AxisBars, orden D·I·S·C

  "eje_dominante":"D", "top_count":5,                        // (F2) Impulsor
  "eje_secundario":"C", "second_count":4,                    // (F3) Estratega
  "brecha":1,                                                // (F4) B = 5 - 4
  "banda_veta":"ligera",                                     // (F4) B=1 → §2.2
  "confianza_tier":"baja",                                   // (F4) registro de lenguaje
  "forma_perfil":"duo",                                      // (F4b) 5-4-2-1: dos primeros ≥4 y B≤1
  "n_ejes_fuertes":2,                                        // (F4b) D y C con ≥3
  "tiebreaker_eje_aplicado":false,                           // (F7) B≠0, no hubo empate

  // MOTOR
  "motor":"Dinámico",                                        // (F5) composite 72 ≥67
  "motor_source":"games_full",
  "motor_composite":72,                                      // en zona de transición 68-73
  "submotores":{ "impulso":88, "ritmo":75, "adaptacion":58,  // (F6) ritmo derivado p/ composite 72
                 "spread":30, "lead":"impulso", "lag":"adaptacion" },
  "motor_divergencia":"confirma_antes_de_cambiar",          // (F6) adaptación = lag aislado
  "motor_confianza":"baja",                                  // (F6) transición baja 1 + spread≥25 baja 1

  // PATRÓN DE DECISIÓN (F8) — sin tiempos provistos
  "patron_decision":null,                                    // <6 tiempos válidos

  // TENDENCIA (F9)
  "tendencia_label":"con tendencia al detalle",             // C

  // MOMENTOS (F10) — ver Paso 3
  "momentos":{ "seleccionados":[], "coherencia_presion":false },

  // ARQUETIPO (F11)
  "arquetipo_id":"D_Dinamico", "arquetipo_label":"Impulsor Dinámico"
}
```

**Derivaciones clave (por qué la ficha dice lo que dice):**
- **B = 1 → `ligera` / tier `baja`.** El "veta FUERTE de Estratega" que trae la ficha del chico es, en la lógica del contrato, justo lo contrario a una veta marcada: la *brecha de dominancia es débil* **porque** el secundario es fuerte (4 votos). Margen chico = mezcla real.
- **`forma_perfil = duo`.** 5-4-2-1 es literalmente el caso `duo` de §2.2 (los dos primeros ≥4, B≤1). Esto **fuerza** que la Tendencia secundaria sea prominente y que el Retrato hable de dos energías (tope de §2.2).
- **Motor Dinámico pero `motor_confianza = baja`.** Composite 72 cae en la zona de transición (68-73) → baja un nivel; `spread = 88 − 58 = 30 ≥ 25` → baja otro. De `alta` (games_full) queda en `baja`.
- **Divergencia = `confirma_antes_de_cambiar`, no `arranque_fuerte_ajuste_con_aviso`.** El patrón "de manual" para un Impulso alto exige **Adaptación Baja**; acá Adaptación cae en **Medio (58)**, así que ese gate no dispara y el resolver toma el patrón por lag aislado (adaptación es el sub-puntaje más bajo y separado). Detalle determinista, no estético.

---

## PASO 2 — INFORME, SECCIÓN POR SECCIÓN (respetando presencia · rango · forma)

**1 · Encabezado** *(siempre · 2 líneas estáticas)*
> Informe de perfil
> Adulto responsable: [nombre del adulto]

**2a · Retrato de Sintonía — `resumenPerfil`** *(siempre · 4–6 frases / 55–130 pal — aquí 5 frases, ~124 pal)*
> En el mapa de Mateo se asoman dos energías casi a la par: la de Impulso, que empuja a proponer y a ir al frente, y la Estratega, que busca entender el cómo y leer la jugada. Por muy poco la primera aparece un poco más seguido, así que conviene leerlo como una combinación viva y no como una sola etiqueta. En la actividad suele moverse con un pulso que tiende a encenderse rápido, con gusto por el movimiento, aunque ese ritmo puede variar según el día. Su costado más analítico (con tendencia al detalle) pesa casi tanto como su empuje y aparece cuando algo lo invita a pensar antes de resolver. Es una fotografía de este momento, con dos motores que se turnan según lo que la cancha le pide.

*Anclas:* apertura calibrada a tier `baja` + forma `duo` ("dos energías casi a la par", "no como una sola etiqueta") = F4/F4b · motor Dinámico suavizado por `motor_confianza` baja ("tiende a", "puede variar") = F5 · pincelada secundaria promovida a co-protagonista por B≤1 = F3/F9 · **cero escena náutica** porque `seleccionados == []` = F10 (caso nulo). Sin guiones, tuteo, probabilístico.

**2b · AxisBars** *(siempre · exactamente 4 barras · suman 12, orden D·I·S·C)*
> Impulsor ▓▓▓▓ 42% · Conector ▓▓ 17% · Sostén ▓ 8% · Estratega ▓▓▓ 33%

*Ancla:* F1 `votos_pct`. La barra hace visible el casi-empate D/C: la prosa no puede contradecirlo.

**2c · Motor-chip** *(siempre · 1 chip ∈ {Dinámico, Rítmico, Sereno})*
> ⚡ Dinámico

**3 · Motor de rendimiento — `motorDesc`** *(siempre · 2–4 frases / 30–75 pal — aquí 3 frases, ~55 pal)*
> Su motor parece moverse en clave dinámica: tiende a encenderse rápido y disfruta del movimiento y de ir al frente. Al mismo tiempo, cuando el plan cambia sobre la marcha, suele confirmar antes de cambiar de marcha y rinde mejor cuando ese cambio se le anticipa un poco. Es un ritmo que hoy se lee con matices, más que como una marca fija.

*Anclas:* composite-band Dinámico = F5 · **exactamente** el patrón `confirma_antes_de_cambiar` y ningún otro, en positivo (el lag de adaptación es "confirmar antes de cambiar", nunca "tarda") = F6 · `motor_confianza` baja cierra flojo ("parece", "se lee con matices").

**4 · Qué lo mueve — `combustible`** *(siempre · 2–3 frases / 25–60 pal — aquí 3 frases, ~48 pal)*
> A Mateo suele moverlo la sensación de avanzar y de sentir que va rápido, el gusto por el reto y por proponer el próximo paso. Y casi con el mismo peso lo enciende entender el cómo: mejorar cada vez y descubrir por qué una jugada funciona. Son dos combustibles que conviven.

*Anclas:* combustible D + disfrute literal de Q3 = F2 · combustible C sumado porque `tier ≤ media` y forma `duo` (mismo peso) = F3.

**5 · Patrón de decisión** → **SECCIÓN OMITIDA** (ver Paso 3, es la única omisión legítima).

**6 · Palabras puente / Palabras que suelen generar ruido** *(siempre · listas estáticas por arquetipo, 3≤N≤6 c/u)*
> **Puente:** "Adelante, tú abres la jugada" · "¿Cuál es el próximo reto?" · "Buena idea, probémosla" · "Cuéntame cómo lo pensarías" · "¿Qué le mejorarías?"
> **Ruido:** "Espera y no hagas nada" · "Siempre igual, sin cambios" · "No preguntes por qué" · "Hazlo sin pensarlo"

*Anclas:* base del arquetipo Impulsor Dinámico + `palabras*Extra` del secundario C anexadas ("Cuéntame cómo lo pensarías", "¿Qué le mejorarías?") = F11 + F3. La IA no las genera: salen de la biblioteca.

**7 · Tendencia secundaria** *(siempre · 1–2 frases / 12–40 pal — aquí 2 frases, ~38 pal; peso alto por B≤1)*
> **Tendencia secundaria: con tendencia al detalle.** En Mateo esta energía Estratega no queda atrás: pesa casi tanto como su empuje y suele aparecer cuando algo lo invita a leer la jugada antes de resolver. Conviene darle lugar tanto como al arranque.

*Anclas:* label fijo de `TENDENCIA_LABELS[C]` = F9 · prominencia de co-protagonista forzada por `forma = duo` = F3/F4.

**8 · Guía rápida** *(siempre · 2–4 filas, ambas columnas, celda 5–18 pal — aquí 3 filas)*

| Activar | A considerar |
|---|---|
| Dale espacio para proponer y abrir la jugada. | Cuando cambie la consigna, anticípale el cambio con una señal breve. |
| Reconoce su costado analítico y pídele que lea la jugada. | Evita que sienta que debe elegir entre pensar y avanzar. |
| Ofrécele retos cortos con un porqué claro. | Cuida que la prisa no tape su necesidad de entender. |

*Anclas:* F2 (empuje D) + F5/F6 (aviso ante el cambio, del lag de adaptación). Los "a considerar" son condiciones de **entorno**, nunca fallas del niño.

**9 · Checklist del día** *(siempre · exactamente 3 bloques · 6–26 pal c/u)*
> **Antes:** dale un momento para proponer algo suyo y recordarle el porqué de la actividad.
> **Durante:** si algo cambia, avísale con una señal breve para que acomode su ritmo.
> **Después:** pregúntale qué mejoraría la próxima vez; su mirada al detalle lo disfruta.

*Anclas:* F11, F5, F6 · **ninguna escena náutica citada** porque `seleccionados == []` (lo enforcea el closed-moment guard).

**10 · Ecos fuera de la cancha — `ecos`** *(siempre · 2–3 frases / 25–60 pal — aquí 3 frases, ~48 pal)*
> Fuera de la cancha, esa energía de impulso suele notarse en las ganas de arrancar cosas y de proponer el siguiente paso. Y su costado estratega puede asomar cuando algo lo invita a entender cómo funcionan las cosas y a mejorarlas. Son tendencias, no reglas fijas.

*Anclas:* F2 generalizado en abstracto + F3 por mezcla. Probabilístico.

**11 · Consejo de reset — `reseteo`** *(siempre · 1–2 frases / 12–40 pal — aquí 1 frase, ~24 pal)*
> Si algo lo desacomoda, suele ayudarle un aviso breve antes del cambio y un momento para reordenar su plan, más que apurarlo a seguir.

*Anclas:* F6 (sub-motor adaptación) + tono de F10b `coherencia_presion` (conservador). Es invitación a ajustar el entorno, no una orden.

**12 · Footer** *(siempre · 2 líneas fijas)*
> Generado por ArgoMethod®
> Este informe es una fotografía del presente, no una etiqueta permanente.

---

## PASO 3 — RESOLUCIÓN EXPLÍCITA DE LOS CASOS NULO

**A) SIN VETA (mezcla) — APLICA.** `B = 1` → `banda_veta: ligera`, `confianza_tier: baja`, `forma_perfil: duo`. Efecto en cadena: el Retrato (2a) abre con **dos energías co-protagonistas** y hedge máximo, **prohibido** "es un Impulsor Dinámico"; las AxisBars (2b) muestran el casi-empate 42/33; el combustible (4) mezcla ambos ejes por igual; la Tendencia secundaria (7) sube de pincelada a co-protagonista (2 frases). El arquetipo se nombra, pero nunca como identidad única.

**B) SIN MOMENTOS — APLICA.** `momentos.seleccionados = []`, y esto es lo más instructivo del caso Mateo. El "momento notable" que trae la ficha (Q5/Tormenta = opción Estratega, "pienso qué es lo importante") se puntúa como `contra_tendencia` (§4.1c):
- singleton de C: **no** (C tiene 4 votos) → 0
- eje menos votado no-cero: **no** (el menos votado es S=1) → 0
- escena en Tormenta: **sí** → +2
- escena Q11/Q12 o Q10: no → 0
- eje distinto del secundario: **no** (C *es* el secundario) → 0

**score = 2 < 4 → NO califica.** Deterministamente, elegir hacia tu **secundario fuerte** (C=4) bajo presión no es una "contra-tendencia rara": es mostrar tu segunda energía, que ya pesa casi como la primera (justo el punto ipsativo de §1.2). `tormenta_divergente` tampoco dispara (no hay ≥2 de 3 respuestas de tormenta confirmadas en un eje no dominante) y no se provee ninguna escena de salencia con voto D para `escena_firma`. Resultado: `seleccionados = []` y `coherencia_presion = false` (conservador). Por eso el Retrato (2a) y el Checklist (9) describen la energía **en abstracto y no citan ninguna escena náutica**. El momento que "parecía" notable, bajo el contrato, simplemente no se cita.

**C) EMPATE — NO APLICA (se marca igual).** `B = 1 ≠ 0` → `tiebreaker_eje_aplicado = false`; la confianza **no** queda topeada a `mezcla` por desempate. Si hubiera sido `B = 0` (p. ej. 4-4-... co-líderes), se habría permitido **doble `escena_firma`** (una por eje), omitido `contra_tendencia`, y la Tendencia secundaria (7) se re-rotularía "dos energías co-líderes" sin forzar un dominante.

**D) PATRÓN DE DECISIÓN nulo — APLICA (la única omisión sancionada).** La ficha no trae tiempos de respuesta → `patron_decision = null` (<6 tiempos válidos). La sección 5 **se omite entera**, sin header huérfano. El validador exige la equivalencia estricta *presente ⟺ `patron_decision ≠ null`*: rellenarla con genérico sería INVÁLIDO. Es el único hueco legítimo del informe.

---

**Conclusión de la demostración.** El informe de Mateo salió con **la misma silueta que cualquier otro**: encabezado, Retrato, AxisBars, motor-chip, motor, combustible, palabras puente/ruido, tendencia secundaria, guía, checklist, ecos, reset y footer, cada uno dentro de su rango exacto de frases/palabras y con su forma dura. Lo único que falta es la sección 5, por la **única omisión que el contrato autoriza** (sin tiempos). El contenido es inconfundiblemente de este chico (un `duo` Impulsor/Estratega de veta ligera, motor Dinámico de baja confianza, sin momento citable), pero el molde es idéntico al de los demás. Eso es "todos diferentes, iguales en estructura".

---

## Ejemplo 3

A continuación el informe de Lucía tal como saldría de la Capa 1 (determinista) y su reescritura de Capa 2, respetando esqueleto, contrato de largos y reglas de copy. Marco al final cada caso nulo que se dispara.

---

## PASO 1 — FICHA DE EVIDENCIA (100% determinista)

```jsonc
{
  // --- VOTOS ---
  "votos":        { "D":1, "I":4, "S":4, "C":3 },      // suman 12            (F1)
  "votos_pct":    { "D":8,  "I":33, "S":33, "C":25 },  // AxisBars D·I·S·C     (F1)
  "eje_dominante":"I",  "top_count":4,                 // nominal (ver F7)     (F2)
  "eje_secundario":"S", "second_count":4,              //                      (F3)
  "brecha":       0,                                   // B = 4 - 4            (F4)
  "banda_veta":   "equilibrio",                        // B=0  → §2.2          (F4)
  "confianza_tier":"mezcla",                           // forzada por B=0      (F4)
  "forma_perfil": "disperso",                          // n_ejes_fuertes≥3, B≤1(F4b)
  "n_ejes_fuertes":3,                                  // I,S,C con ≥3 votos   (F4b)
  "tiebreaker_eje_aplicado":true,                      // I=S=4, NO se cita    (F7)

  // --- MOTOR ---
  "motor":        "Rítmico",                           //                      (F5)
  "motor_source": "games_full",
  "motor_composite":53,                                // 0.30·45+0.30·58+0.40·55 (F5)
  "submotores":   { "impulso":45, "ritmo":58, "adaptacion":55,
                    "spread":13, "lead":"ritmo", "lag":"impulso" },          // (F6)
  "motor_divergencia":"parejo",                        // spread 13 < 25       (F6)
  "motor_confianza":"alta",                            // games_full+spread<25 (F6)
  "motor_tiebreaker_aplicado":false,                                          // (F7)

  // --- PATRÓN DE DECISIÓN (por tiempos, independiente) ---
  "patron_decision":"constante",                       // ≥6 tiempos válidos   (F8)

  // --- TENDENCIA ---
  "tendencia_label":"con tendencia a la calma firme",  // S; se re-encuadra    (F9)

  // --- MOMENTOS NOTABLES (regla equilibrio §4.2) ---
  "momentos": {
    "seleccionados":[                                  // dos escena_firma     (F10)
      { "tipo":"escena_firma", "q":6, "escena":"La Tormenta",
        "opcion_texto":"¡Grito 'vamos equipo'!",
        "eje_opcion":"I", "framing":"observacion_escena_ancla_no_rasgo" },
      { "tipo":"escena_firma", "q":5, "escena":"La Tormenta",
        "opcion_texto":"Mantengo mi posición para que el barco no se mueva",
        "eje_opcion":"S", "framing":"observacion_escena_ancla_no_rasgo" }
    ],
    "coherencia_presion":true                          // co-líderes en Q5-Q7  (F10b)
  },

  // --- ARQUETIPO ---
  "arquetipo_id":"I_Ritmico", "arquetipo_label":"Conector Rítmico"           // (F11)
}
```

**Cómo se computó cada número (nada inventado):**
- **Empate arriba.** Ordenados: I=4, S=4, C=3, D=1. `top_count=4`, `second_count=4` → **B=0** → `banda_veta = equilibrio`, `confianza_tier = mezcla` (§2.2, fila B=0).
- **Forma.** `n_ejes_fuertes = 3` (I, S, C con ≥3) y B≤1 → `disperso`. (Nota de resolver: 4-4-3-1 también satisface la condición de `duo` "los dos primeros ≥4 y B≤1"; con un tercer eje fuerte, `disperso` debe ganarle a `duo` porque llamarlo dúo sobre-afirmaría; ambas formas fuerzan el mismo render, así que la salida no cambia. Es un borde de precedencia que el resolver debe fijar por regla.)
- **Motor.** Rítmico dado; sub-puntajes parejos (Impulso 45 / Ritmo 58 / Adaptación 55) → `spread=13 < 25` → `parejo`, confianza alta.
- **Nominal I.** El empate I=S se rompe con el orden fijo interno del resolver (`tiebreaker_eje_aplicado=true`, campo F7 que **no se cita**); solo sirve para nombrar el chip. El tope de §2.2 ya tenía la confianza en `mezcla`.

Todos los campos F1–F11 quedan poblados: cada sección tiene fuente.

---

## PASO 2 — Recorrido de CADA sección (contrato de largos)

### 1 · Encabezado `reportTitle` + `guardian` — estático
> **Informe de perfil**
> Adulto responsable: [nombre del adulto]
2 líneas fijas. (Caso nulo: sin nombre → solo "Adulto responsable"; nunca se omite.)

### 2a · Retrato de Sintonía `resumenPerfil` — IA · *4–6 frases / 55–130 pal*
> En el perfil de Lucía asoman dos energías casi a la par: la Conectora, que se enciende con el vínculo y con jugar junto a otros, y la de Sostén, que aporta constancia y una calma firme. Su motor parece moverse con un pulso parejo, sin arranques explosivos ni pausas largas, muy a gusto en lo repetible. En una escena de tormenta eligió gritar "vamos equipo", y en otra mantener su posición para que el barco no se moviera: dos maneras suyas de estar presente cuando sube la presión. La tercera energía, la del Estratega atenta al detalle, también se deja ver y suma matices. Más que un rasgo único, hoy se lee como una mezcla amplia y flexible.

*(5 frases, ~108 palabras.)* Anclas: F4b forma → "dos energías" (nunca "es un Conector"); F5+F6 → "pulso parejo"; **F10** → las dos escena_firma (Q6 y Q5) parafraseadas y ancladas a "la tormenta"; F4b C=3 → tercera energía como matiz; F4 tier `mezcla` → hedge fuerte ("asoman", "parece", "hoy se lee").

### 2b · AxisBars — determinista
> Impulsor 8% · Conector 33% · Sostén 33% · C/Estratega 25%

Exactamente **4** barras, orden D·I·S·C, suman 12 votos (F1). La prosa no puede contradecir que I y S van iguales.

### 2c · Motor-chip — determinista
> **Rítmico**  (∈ {Dinámico, Rítmico, Sereno}) — F5.

### 3 · Motor de rendimiento `motorDesc` — IA · *2–4 frases / 30–75 pal*
> Su motor tiende a sostener una cadencia pareja: arranca, mantiene y se reacomoda de forma equilibrada, sin picos ni bajones marcados. Suele brillar en lo repetible y sostenido, donde el ritmo constante juega a su favor.

*(2 frases, ~38 palabras.)* Ancla F5 (Rítmico) + F6 `parejo`. Como `motor_divergencia == "parejo"`, **no fuerza contraste** de sub-motores (caso nulo (d) resuelto). `motor_source = games_full`, así que sí puede hablar de cadencia medida; toda penalización cruda va en positivo.

### 4 · Qué lo mueve `combustible` — IA · *2–3 frases / 25–60 pal*
> A Lucía parece moverla el vínculo: jugar con otros y compartir el ánimo del grupo es de lo que más disfruta. Muy cerca, la mueve también el ritmo estable y la sensación de sostener al equipo, esa seguridad de un pulso que no se pierde.

*(2 frases, ~46 palabras.)* Ancla F2 (combustible I + disfrute literal de Q3 "charlar con los demás") y, como `tier ≤ media`, suma F3 (combustible S). En mezcla el combustible integra ambos ejes.

### 5 · Patrón de decisión — determinista · *implicación 1–2 frases / 15–45 pal*
> **Patrón:** sostiene un pulso parejo de principio a fin.
> **Qué significa para la actividad:** suele encarar la actividad con un ritmo estable de arranque a cierre; le sienta bien un plan previsible donde ese pulso constante pueda desplegarse sin sobresaltos.

*(implicación ~29 palabras.)* Sale de F8 `constante`; texto fijo de §2.5, no pasa por IA, no se mezcla con eje/motor. **Presente porque `patron_decision != null`.**

### 6 · Palabras puente / que generan ruido — estático · *3 ≤ N ≤ 6 por lista*
> **Palabras puente:** juntos · equipo · compartir · tu ritmo · con calma · paso a paso
> **Palabras que suelen generar ruido:** en silencio · cada uno por su lado · apúrate · cambio de golpe

Pre-escritas por arquetipo (Conector Rítmico) con los extras del secundario S anexados sin pasar el techo de 6. La IA no las genera ni edita.

### 7 · Tendencia secundaria — estático (peso por IA) · *1–2 frases / 12–40 pal*
> **Tendencia secundaria:** con tendencia a la calma firme
> Más que una energía secundaria, aquí conviven dos casi a la par: la Conectora y la de Sostén. Junto al empuje social aparece una calma firme que da constancia, y ambas se turnan según lo que el momento pide.

*(2 frases, ~38 palabras.)* Label fijo `TENDENCIA_LABELS[S]`. `forma ∈ {disperso}` y B≤1 → **peso máximo (2 frases, casi co-protagonista)**. Caso nulo `equilibrio` resuelto: re-encuadre a "dos energías co-líderes", sin forzar un dominante.

### 8 · Guía rápida — estático base, tono por IA · *2–4 filas / celda 5–18 pal*
| Activar | A considerar |
|---|---|
| Momentos de juego compartido con el grupo. | Cuidar que los cambios lleguen con un pequeño aviso. |
| Un ritmo previsible donde pueda sostener su pulso. | Darle tiempo para acomodarse antes de exigir velocidad. |
| Reconocer su rol de sostén dentro del equipo. | Evitar apuros bruscos que corten su cadencia. |

3 filas, ambas columnas siempre llenas. Los "a considerar" son condiciones de **entorno**, nunca fallas de Lucía.

### 9 · Checklist del día — IA · *exactamente 3 bloques / c/u 6–26 pal*
> **Antes:** recuérdale que su lugar en el equipo cuenta, como cuando eligió mantener su posición en la tormenta.
> **Durante:** dale un ritmo claro y momentos para conectar con sus compañeros.
> **Después:** celebren juntos lo compartido y dale un respiro tranquilo antes de lo que sigue.

3 claves obligatorias. El "antes" referencia la escena Q5 **solo porque está en `seleccionados[]`** (licencia del closed-moment guard).

### 10 · Ecos fuera de la cancha `ecos` — IA · *2–3 frases / 25–60 pal*
> Fuera del agua, esta misma energía suele aparecer cuando arma puentes entre personas y disfruta de los planes en grupo. Es probable que también se la vea sostener a los suyos con constancia, esa presencia estable en la que otros se apoyan.

*(2 frases, ~42 palabras.)* Generaliza F2 (I) + F3 (S, por mezcla) fuera del deporte, en abstracto y probabilístico.

### 11 · Consejo de reset `reseteo` — IA · *1–2 frases / 12–40 pal*
> Cuando el clima se agita, a Lucía suele ayudarla un cambio anticipado junto a un momento de calma compartida: un espacio breve para reacomodarse antes de volver a entrar.

*(1 frase, ~28 palabras.)* Ancla F6 (Adaptación) + tono de F10b `coherencia_presion=true`. Invitación a ajustar el entorno, no una orden.

### 12 · Footer — estático
> Generado por ArgoMethod®
> Este informe es una fotografía del presente, no una etiqueta permanente.

---

## PASO 3 — Resolución explícita de los CASOS NULOS

1. **Empate arriba / SIN VETA (B=0).** I=4 y S=4 → `banda_veta = equilibrio`, `confianza_tier = mezcla`. Se **prohíbe** afirmar un dominante único: el Hero (2a) y la Tendencia (7) abren con **dos energías co-líderes**, hedge máximo, y el arquetipo del chip (`Conector Rítmico`) se sostiene con pinzas. El desempate para nombrarlo (`tiebreaker_eje_aplicado = true`, F7) **no se cita**; solo dejó la confianza en `mezcla`. Este es el eje del informe de Lucía.

2. **Forma `disperso` vs `duo` (borde de precedencia).** 4-4-3-1 activa las dos condiciones; con un tercer eje fuerte (C=3) gana `disperso` para no sobre-afirmar. Ambas fuerzan el mismo render (Retrato con dos energías + Tendencia prominente), así que el output no cambia; queda como regla de precedencia a fijar en el resolver.

3. **Momentos — regla de equilibrio (§4.2).** Como `banda_veta == equilibrio`, se **omite `contra_tendencia`** (aunque el voto singleton D=1 habría sumado score 4 y calificado en otro perfil) y se permiten **dos `escena_firma`, una por cada co-líder**: I en Q6 y S en Q5, ambas en la Tormenta. Por eso el Retrato cita esas dos escenas y ninguna más.
   - **Sub-caso "SIN MOMENTOS" (no disparado aquí, pero así se resolvería):** si los co-líderes solo hubieran aparecido en escenas de baja salencia sin calificar, `seleccionados = []`; entonces el Retrato (2a) y el Checklist (9) describirían la energía **en abstracto, sin nombrar ninguna escena náutica**, y el closed-moment guard rebotaría cualquier escena inventada.

4. **Motor `parejo` (caso nulo (d) de §3).** `spread=13 < 25` → `motor_divergencia = "parejo"`: el `motorDesc` describe cadencia pareja **sin forzar contraste** de sub-motores. (Si `motor_source` hubiera sido `time_fallback`/`vote_fallback`, no podría nombrar sub-motores y se contraería a 1–2 frases; no es el caso, hay `games_full`.)

5. **Patrón de decisión — presente.** `patron_decision = "constante"` (≥6 tiempos) → la sección **se incluye**. Si hubiera sido `null`, sería la **única omisión sancionada** del contrato: la sección se quita entera (sin header huérfano), nunca se rellena con genérico.

**Resultado:** mismas 12 secciones, en el mismo orden, cada una dentro de su rango y forma que cualquier otro informe (validador post-generación en verde), pero con contenido que solo puede ser de Lucía: dos energías co-líderes bajo `mezcla`, motor Rítmico parejo, y sus dos gestos de tormenta como ancla. Todos diferentes, iguales en estructura.

---

## Ejemplo 4

He verificado la biblioteca canónica. Acá va el informe de Tomás resuelto por el molde. Todo hecho lleva su ancla entre corchetes.

---

# PASO 1 · FICHA DE EVIDENCIA (Capa 1, 100% determinista)

Computada de sus 12 votos + motor. Es el único universo de hechos que la IA puede citar.

```jsonc
{
  // --- VOTOS ---
  "votos":        { "D":1, "I":1, "S":2, "C":8 },         // suman 12          (F1)
  "votos_pct":    { "D":8.3, "I":8.3, "S":16.7, "C":66.7 },//                  (F1)
  "eje_dominante":"C",  "top_count":8,                                         // (F2)
  "eje_secundario":"S", "second_count":2,                                      // (F3)
  "brecha":       6,                                       // B = 8 - 2         (F4)
  "banda_veta":   "definida",                              // B≥6 (§2.2)        (F4)
  "confianza_tier":"muy_alta",                                                 // (F4)
  "forma_perfil": "pico",                                  // top≥6 && B≥3      (F4b)
  "n_ejes_fuertes":1,                                      // solo C tiene ≥3   (F4b)
  "tiebreaker_eje_aplicado":false,                                            // (F7)

  // --- MOTOR ---
  "motor":        "Sereno",                                // banda ≤33 = Lento (F5)
  "motor_display":"Observador",                            // excepción C+Lento (naming)
  "motor_source": "games_full",                            // composite presente ⇒ games
  "motor_composite":28,                                                        // (F5)
  "submotores":   null,                                    // ver CASO NULO §motor (F6)
  "motor_divergencia":"parejo",                            // asumido spread<25 (F6)
  "motor_confianza":"media",                               // baja 1 nivel: 28 ∈ 27-32 (transición) (F6)

  // --- PATRÓN DE DECISIÓN (por tiempos, independiente) ---
  "patron_decision":"constante",                           // supone ≥6 tiempos (F8)

  // --- TENDENCIA ---
  "tendencia_label":"con tendencia a la calma firme",      // S secundario §2.4 (F9)

  // --- MOMENTOS NOTABLES ---
  "momentos": {
    "seleccionados":[                                       // 1 de 2 slots     (F10)
      { "tipo":"escena_firma", "q":5, "escena":"La Tormenta",
        "opcion_texto":"Pienso qué es lo importante",
        "eje_opcion":"C", "framing":"observacion_escena_ancla_no_rasgo" }
    ],
    "coherencia_presion":true                               // C elegido en Q5-Q7 (F10b)
  },

  // --- ARQUETIPO ---
  "arquetipo_id":"estratega_observador",
  "arquetipo_label":"Estratega Observador"                                     // (F11)
}
```

**Cómo salió cada número (auditoría):**
- **B = 6** → `definida` / `muy_alta` (§2.2, banda ≥6). Es un perfil de señal muy fuerte y coherente.
- **forma = `pico`** (§2.2): `top_count 8 ≥ 6` y `B 6 ≥ 3`. Un eje sobresale claramente. `n_ejes_fuertes = 1` (solo C llega a 3 votos). Nada empuja a `duo`/`disperso`, así que el Retrato NO se abre en dos energías: habla de un dominante claro.
- **Momentos:** sus dos votos minoritarios (D=1, I=1) son singletons (score +3), pero cayeron en escenas de baja salencia, así que NO tienen la corroboración de salencia que exige §4 ("ninguna regla se dispara por un único voto salvo el evento raro designado, y siempre con corroboración de salencia"). Por eso `contra_tendencia = ninguno` y `tormenta_divergente = ninguno` (el eje modal de la Tormenta ES el dominante). Lo único que sí dispara es la `escena_firma` de grounding (ver Paso 3, matiz importante).

---

# PASO 2 · Informe sección por sección (mismo molde que todos)

Anoto entre `[ ]` el hecho de la ficha o el bloque de biblioteca que ancla cada frase. La prosa respeta el rango del Contrato.

### 1 · Encabezado (estático, siempre)
> **Informe de perfil**
> Adulto responsable: [nombre del adulto] `[estático]`

### 2 · Hero: arquetipo + Retrato de Sintonía

**Headline (estático):** Estratega Observador · *Análisis Profundo del Entorno y Precisión Lógica* `[F11]`

**Motor-chip (determinista):** `Observador` `[F5 banda Sereno + excepción de naming C+Lento]`

**AxisBars (determinista, exactamente 4, suman 12):**
```
Impulsor  ▓ 8.3%   [F1]
Conector  ▓ 8.3%   [F1]
Sostén    ▓▓ 16.7% [F1]
Estratega ▓▓▓▓▓▓▓▓ 66.7%  [F1]   ← ancla visual: hay un pico real, no pureza
```

**Retrato (`resumenPerfil`, IA · rango 4-6 frases / 55-130 palabras):**
> El perfil de Tomás se asocia con fuerza a la Energía Estratega: esa mirada que lee la jugada, cuida el detalle y busca entender el cómo antes de moverse. `[F2 dominante C, tier muy_alta ⇒ dominante claro // biblioteca §2.1 C]` Su ritmo parece profundo y sereno, y tiende a tomarse un instante para procesar antes de actuar, que es donde suele aparecer buena parte de su valor. `[F5 Sereno; motor_confianza media ⇒ "parece", sin cerrar]` En un momento de mucha presión, como La Tormenta del juego, se inclinó por "pensar qué es lo importante" en vez de reaccionar de golpe, un gesto muy propio de su manera de resolver. `[F10 escena_firma Q5, anclada a la escena]` Por detrás asoma una tendencia a la calma firme, como matiz que lo acompaña. `[F3 S; banda definida ⇒ pincelada, no co-protagonista]` Es una fotografía de cómo se está moviendo hoy, no una etiqueta. `[cláusula no-upgrade §6.1]`

*(5 frases, ~100 palabras: dentro de rango. Cita UNA escena, la única en `seleccionados`.)*

### 3 · Motor de rendimiento (`motorDesc`, IA · 2-4 frases / 30-75 palabras)
> Su ritmo parece naturalmente sereno: tiende a arrancar, sostener y reacomodarse de forma pareja, sin picos ni pausas largas. `[F5 banda Sereno + F6 parejo §2.3]` Suele lucirse en lo repetible y sostenido, donde su calidad se nota con el tiempo. `[biblioteca §2.3 parejo]` Como su pulso está cerca de una zona de transición, conviene leerlo como una tendencia más que como una regla fija. `[motor_confianza media, near-threshold]`

*(3 frases, ~55 palabras. `parejo` ⇒ no fuerza contraste de sub-motores.)*

### 4 · Qué lo mueve (`combustible`, IA · 2-3 frases / 25-60 palabras)
> A Tomás suele moverlo entender el cómo y mejorar cada vez: le entusiasma aprender trucos nuevos y sentir que cada intento sale un poco mejor. `[F2 combustible C + Q3 disfrute literal "aprender trucos nuevos"]` Darle claridad sobre la lógica y el porqué de las cosas tiende a encenderlo. `[biblioteca §2.1 C "suele necesitar del entorno"]`

*(tier `muy_alta` (> media) ⇒ NO se suma el combustible del secundario. §5.)*

### 5 · Patrón de decisión + "Qué significa para la actividad" (determinista, no-IA)
> **Patrón:** sostiene un pulso parejo de principio a fin. `[F8 constante §2.5]`
> **Qué significa para la actividad:** probablemente rinde estable a lo largo de la sesión, sin necesitar demasiados cambios de estímulo para mantenerse enfocado. `[§2.5 constante, implicación estática]`

*(Ojo: sale de tiempos, es independiente del eje/motor. Ver Paso 3 para el CASO NULO si hubiera <6 tiempos.)*

### 6 · Palabras puente / Palabras que generan ruido (estático por arquetipo)
> **Palabras puente (6):** Analiza · Fíjate · Qué ves · Tómate tu tiempo · Lógica · Precisión `[F11 lista base]`
> **Palabras que suelen generar ruido (5):** "¡No pienses!" · "¡Reacciona sin analizar!" · "¡Corre como sea!" · "Olvida el plan" · "No observes, actúa" `[F11 lista base]`

*(Los extras del secundario S — Paciencia/Observar/Tu momento — NO se anexan: la lista puente ya está en el techo N=6. §6d del Contrato: "sin pasar el techo".)*

### 7 · Tendencia secundaria (estático, peso por IA · 1-2 frases / 12-40 palabras)
> **Tendencia secundaria: con tendencia a la calma firme.** `[F9 label fijo TENDENCIA_LABELS(S)]` Su perfil analítico suele venir con una paciencia que le deja observar sin prisa y aportar detalles que otros pasan por alto. `[F3 S, contenido C_S; banda definida ⇒ 1 frase, matiz menor]`

*(banda `definida` (B≥4) ⇒ peso mínimo, 1 frase de párrafo. La sección igual está SIEMPRE presente.)*

### 8 · Guía rápida (Activar / A considerar) (estático base, tono por IA · 3 filas)
| Activar | A considerar (condición de entorno) |
|---|---|
| Ofrecer una "misión de lectura": "fíjate por dónde atacan más". | Pedirle ser explosivo de forma constante y sin motivo táctico. |
| Validar su lectura: "qué buena visión del campo tuviste hoy". | Exponer su ritmo pausado como algo a corregir frente al grupo. |
| Explicar con detalle la lógica de una consigna nueva. | Cambios de plan repentinos que rompan su mapa mental. |
`[F11 guía base; 3 filas ∈ [2,4]; cada fila con ambas columnas]`

### 9 · Checklist del día (IA · exactamente 3 bloques / 6-26 palabras c/u)
> **Antes:** Llegar con tiempo para que observe el campo y el clima, como hizo al leer La Tormenta. `[F11 + F10 escena firma permitida (está en seleccionados)]`
> **Durante:** Usar un tono calmado y confiar en su proceso interno, sin indicaciones constantes. `[F11 + F5 sereno]`
> **Después:** Preguntarle qué fue lo más interesante que notó hoy en el otro equipo. `[F11]`

### 10 · Ecos fuera de la cancha (`ecos`, IA · 2-3 frases / 25-60 palabras)
> Fuera del deporte, esa misma energía suele buscar el porqué de las cosas: es probable que disfrute los juegos de estrategia, los puzzles o cualquier plan que le pida pensar. `[F2 C, generalizado en abstracto]` Puede parecer en su mundo y, al preguntarle, traer la respuesta más profunda. `[biblioteca §2.1 C]`

*(tier `muy_alta` ⇒ no mezcla el secundario.)*

### 11 · Consejo de reset (`reseteo`, IA · 1-2 frases / 12-40 palabras)
> Cuando algo no sale, en vez de "ya pasó", darle un dato nuevo para procesar ("volvé a observar el centro") suele ayudarlo a salir del análisis y volver al presente. `[F2 C + F10b coherencia_presion; invitación de entorno, no orden]`

### 12 · Footer (estático)
> Generado por ArgoMethod®
> Este informe es una fotografía del presente, no una etiqueta permanente. `[cláusula no-upgrade]`

---

# PASO 3 · CASOS NULO, resueltos explícitamente

**a) SIN VETA (empate / mezcla) — NO aplica, y por qué.**
Tomás es el extremo opuesto: `B=6`, `banda_veta=definida`, `confianza_tier=muy_alta`, `forma=pico`. Ninguno de los topes de degradación (`duo`/`disperso`/`equilibrio`) se activa, así que el Retrato presenta UN dominante claro (siempre en lenguaje probabilístico: "se asocia con fuerza", nunca "es"). Si su vector hubiera sido, por ejemplo, `C6 S5 …` (B=1, `duo`), el mismo molde forzaría apertura en dos energías y subiría la Tendencia (§7) a casi co-protagonista. La estructura no cambia; cambia el peso.

**b) SIN MOMENTOS — aplica PARCIAL, y es el matiz más importante.**
Hay que separar dos cosas que el molde trata distinto:
- **Momentos de CONTRASTE = vacíos (correcto).** `tormenta_divergente` no dispara (bajo presión eligió su propio eje: el modal de Q5-Q7 es C = dominante, así que solo alimenta `coherencia_presion=true`). `contra_tendencia` no califica: sus votos D e I son singletons, pero cayeron en baja salencia y les falta la corroboración obligatoria (§4). Resultado: cero citas de escena por desvío.
- **Grounding = SÍ existe (1 `escena_firma`).** Como su dominante C aparece bajo la máxima salencia (La Tormenta, Q5), la regla `escena_firma` reserva ese slot para que el Retrato "suene a este chico" y no sea todo abstracto. Por eso `seleccionados` tiene 1 elemento, no 0.

Es decir: "todas Estratega, nada contra-tendencia" da un informe **sin contrastes pero con un ancla de identidad**, que es exactamente lo que el diseño busca para un perfil de una sola nota.

**Sub-caso NULO puro (si su C nunca hubiera tocado una escena de salencia ≥1 relevante):** `seleccionados=[]`. Entonces el **closed-moment guard** prohíbe nombrar cualquier escena náutica: el Retrato (§2) y el Checklist (§9) describirían la energía en abstracto ("en momentos de presión suele buscar leer la jugada") y el validador rechazaría cualquier etiqueta como "La Tormenta". La sección sigue existiendo, con el mismo rango; solo se vacía de escena.

**c) CASO NULO del MOTOR (real en estos datos): sin sub-motores + cercanía al umbral.**
El prompt dio composite pero no los tres sub-puntajes. Se resuelve así: `motor_divergencia=parejo` por defecto (sin divergencia medida no se inventa contraste, §2.3), y como `composite 28 ∈ 27-32` (zona de transición del corte 33), `motor_confianza` baja un nivel a `media` ("motor en transición"). Efecto en el molde: el §3 se queda en 3 frases sin nombrar sub-motores, y el Retrato usa "parece" en vez de "su motor es". Si el origen fuera `time_fallback`/`vote_fallback`, el §3 se contraería a 1-2 frases y el léxico de sub-motores quedaría prohibido por el validador.

**d) CASO NULO del PATRÓN de decisión (la única omisión sancionada).**
Asumí `constante` porque hay tiempos válidos. Si hubiera **<6 tiempos válidos** → `patron_decision=null` → **la sección 5 se omite entera** (sin header huérfano). Es la ÚNICA ausencia legítima del informe; el validador exige la equivalencia estricta `presente ⟺ patron_decision != null`. Ninguna otra sección puede faltar.

---

**Conclusión de la demostración.** Tomás produce un informe **inconfundiblemente suyo** (pico Estratega Observador, motor sereno en transición, una sola foto de La Tormenta, cero contrastes) y a la vez **estructuralmente idéntico** al de cualquier otro chico: las 12 secciones presentes, en el mismo orden, dentro de los mismos rangos, con la única omisión permitida (patrón de decisión si faltan tiempos). Diferente en contenido, igual en molde.

**Nota de implementación detectada:** el validador de forma del Contrato define `motor-chip ∈ {Dinámico, Rítmico, Sereno}`, pero el naming canónico obliga a mostrar **"Observador"** para C+Lento (`docs/archetype-naming.md` línea 14). El set del validador debería incluir "Observador", o el chip de este arquetipo lo hará fallar como `MALFORMED`.

---

## Ejemplo 5

# Informe worked-example — Sofía, 13, atletismo

## PASO 1 — FICHA DE EVIDENCIA (Capa 1, 100% determinista)

Todo campo sale de reglas con umbral sobre los datos dados; nada se infiere de una respuesta suelta.

```jsonc
{
  // --- VOTOS ---
  "votos":        { "D":5, "I":4, "S":1, "C":2 },      // suman 12          (F1)
  "votos_pct":    { "D":41.7, "I":33.3, "S":8.3, "C":16.7 },              // (F1)
  "eje_dominante":"D", "top_count":5,                                     // (F2)
  "eje_secundario":"I", "second_count":4,                                 // (F3)
  "brecha": 1,                                          // B = 5 − 4        (F4)
  "banda_veta":"ligera",                               // B=1 → §2.2       (F4)
  "confianza_tier":"baja",                             // B=1 → §2.2       (F4)
  "forma_perfil":"duo",                                // D5,I4 ambos ≥4 y B≤1 (F4b)
  "n_ejes_fuertes":2,                                  // ejes con ≥3 votos (F4b)
  "tiebreaker_eje_aplicado":false,                     // no hubo B=0       (F7)

  // --- MOTOR ---
  "motor":"Rítmico",                                   // composite 52 → §2.3 (F5)
  "motor_source":"games_full",
  "motor_composite":52,                                // 90·.30+50·.30+25·.40
  "submotores":{ "impulso":90, "ritmo":50, "adaptacion":25,
                 "spread":65, "lead":"impulso", "lag":"adaptacion" },     // (F6)
  "motor_divergencia":"arranque_fuerte_ajuste_con_aviso", // Impulso Alto & Adapt Baja
  "motor_confianza":"baja",                            // spread 65 ≥25 → baja (F6)
  "motor_tiebreaker_aplicado":false,                                       // (F7)

  // --- PATRÓN DE DECISIÓN ---
  "patron_decision":null,                              // sin tiempos dados  (F8)

  // --- TENDENCIA ---
  "tendencia_label":"con tendencia a lo social",       // eje_sec = I → §2.4 (F9)

  // --- MOMENTOS ---
  "momentos":{
    "seleccionados":[],                                // ver derivación abajo (F10)
    "coherencia_presion":false                         // Q5-Q7 no provistos → default conservador (F10b)
  },

  // --- ARQUETIPO ---
  "arquetipo_id":"D_Ritmico", "arquetipo_label":"Impulsor Rítmico"        // (F11)
}
```

**Tres derivaciones que gobiernan todo el informe:**

1. **B = 1 → `ligera` / `baja` + `forma: duo`.** D=5 e I=4 están a un voto (dentro del ruido: SD≈1.5). No es un "Impulsor" con sombra: son **dos energías co-protagonistas**. El `duo` es un tope duro que **fuerza** retrato de dos energías y tendencia prominente (§2.2), aunque el chip diga "Impulsor Rítmico".

2. **Impulso 90 NO la hace "Dinámica".** El composite pondera Adaptación 0.40, y con Adaptación 25 el resultado cae a **52 → Rítmico**. El impulso extremo no se refleja como "motor rápido": se surfacea aparte como **divergencia** (`arranque_fuerte_ajuste_con_aviso`, Impulso Alto & Adaptación Baja). `spread=65` ≥25 baja `motor_confianza` a **baja**.

3. **El "momento notable" de la meta NO califica.** La opción Conector en Q12 tiene `eje_opcion = I`, que es el **secundario**. Scoring §4c: singleton +0 (I tiene 4 votos), menos votado +0, Tormenta +0 (Q12 es Meta), Meta/Horizonte **+1**, Q10 +0, no-secundario **+0** (I *es* el secundario). **Score = 1 < 4 → rechazado.** Elegir Conector cuando Conector ya pesa 4 votos es esperable, no notable. Sin datos de D-en-escena ni de tormenta, `seleccionados = []`.

---

## PASO 2 — Recorrido de CADA sección (mismo molde que cualquier informe)

**§1 · Encabezado** (estático, siempre)
> **Informe de perfil**
> Adulto responsable: [nombre del adulto]

_2 líneas fijas, no pasa por IA._

**§2a · Retrato de Sintonía `resumenPerfil`** (IA · 4–6 frases / 55–130 pal) — 6 frases, ~115 pal ✓
> En el perfil de Sofía se asoman dos energías casi a la par: la de impulso, que la lleva a proponer y a arrancar, y la conectora, que disfruta del juego compartido y de tejer equipo. Ninguna de las dos manda con claridad sobre la otra, así que conviene leerla como una mezcla más que como un solo rasgo. En su motor parece moverse con un pulso parejo, ni arranque explosivo ni pausa larga, aunque esa lectura es apenas una aproximación. Suele encenderse con ganas cuando algo la entusiasma, sin perder las ganas de compartir ese envión con el grupo. Su costado social acompaña muy de cerca: buena parte de lo que la mueve tiene que ver con estar y hacer junto a otros. Es una foto de este momento, abierta a seguir cambiando.

_Anclas: apertura dos energías (F4b `duo` + F2/F3) · hedge máximo por tier `baja` (F4, "conviene leerla como mezcla") · motor en clave de ritmo sin cerrar fuerte por `motor_confianza: baja` ("parece", "apenas una aproximación", F5) · tendencia social como co-protagonista (F9) · **ninguna escena citada** (F10 = []) · cierre no-upgrade._

**§2b · AxisBars** (determinista, siempre · exactamente 4 barras, Σ=12)
> D Impulsor ██████ 41.7 · I Conector █████ 33.3 · S Sostén █ 8.3 · C Estratega ██ 16.7

_Ancla: F1 `votos_pct`, orden fijo D·I·S·C. La prosa no puede contradecir la casi-paridad D/I que muestran las barras._

**§2c · Motor-chip** (determinista): `Rítmico` (F5). Por `motor_confianza: baja`, el Retrato ya evitó afirmaciones fuertes de ritmo.

**§3 · Motor de rendimiento `motorDesc`** (IA · 2–4 frases / 30–75 pal) — 3 frases, ~70 pal ✓
> En lo medido, su motor tiende a sostener una cadencia intermedia, sin un arranque explosivo ni pausas largas. Al mirar más fino, aparece un rasgo probable: suele largar con mucha energía y se siente más cómoda cuando los cambios de consigna llegan con un pequeño aviso. Esa combinación es una preferencia de ritmo y no una dificultad, porque le rinde tener un momento breve para reacomodarse cuando algo cambia sobre la marcha.

_Anclas: composite-band Rítmico (F5) · **exactamente** el patrón `arranque_fuerte_ajuste_con_aviso` y ninguno más (F6) · `motor_source: games_full` habilita nombrar sub-motores (impulso/adaptación) · Adaptación baja re-encuadrada en positivo (§2.3, prohibido "lento/tarda/errores")._

**§4 · Qué lo mueve `combustible`** (IA · 2–3 frases / 25–60 pal) — 3 frases, ~50 pal ✓
> A Sofía suele moverla la sensación de avanzar, de sentir que va rápido y de proponer el próximo paso. Muy cerca aparece el motor del vínculo: jugar con otros y el ánimo compartido también la encienden. En la mezcla de esas dos ganas está buena parte de su combustible.

_Anclas: combustible D (F2) atado al disfrute literal de Q3 ("sentir que vamos rápido") · como `tier: baja ≤ media`, **suma** el combustible del secundario I (F3) · `forma: duo` → mezcla ambos ejes en igual peso._

**§5 · Patrón de decisión** → **SECCIÓN OMITIDA** (ver Paso 3). `patron_decision = null`.

**§6 · Palabras puente / Palabras que suelen generar ruido** (estático por arquetipo · 3≤N≤6) — base D + extras del secundario I
> **Puente:** "vamos", "buen arranque", "prueba tú primero", "en equipo"
> **Que suelen generar ruido:** "quédate quieto", "hazlo igual que siempre", "no cambies nada", "esto lo haces solo"

_Anclas: listas pre-escritas del arquetipo D (F11) + `palabrasPuenteExtra` del secundario I anexadas (F3) sin bajar de 3 ni pasar de 6. La IA no las genera._

**§7 · Tendencia secundaria** (estático, peso por IA · 1–2 frases / 12–40 pal) — `forma: duo` → 2 frases, prominente
> **Tendencia secundaria: con tendencia a lo social.** En Sofía esta segunda energía no queda atrás, sino que aparece casi a la par de su impulso. Muchas veces elige lo compartido y disfruta cuando la actividad deja lugar para el grupo.

_Anclas: label fijo de `TENDENCIA_LABELS` para I (F9) · prominencia elevada porque `forma ∈ {duo}` y B≤1 (F4b fuerza 2 frases, co-protagonista, no pincelada)._

**§8 · Guía rápida** (estático base, tono por IA · 2–4 filas, ambas columnas)
| Activar | A considerar (condición de entorno) |
|---|---|
| Darle espacio para proponer y arrancar. | Un aviso breve antes de cambiar la consigna la acompaña. |
| Sumar momentos de juego con el grupo. | La espera quieta y larga tiende a apagarla. |
| Reconocer su envión y su entusiasmo. | Los cambios muy bruscos le rinden menos sin una transición. |

_Anclas: base del arquetipo D + sabor I (F2, F5, F6). Los "A considerar" son condiciones del entorno a cuidar, nunca fallas del niño._

**§9 · Checklist del día** (IA · exactamente 3 bloques / 6–26 pal c/u)
> **Antes:** Contarle qué va a pasar y darle un rol para arrancar con ganas.
> **Durante:** Avisarle con algo de tiempo si la consigna va a cambiar.
> **Después:** Reconocer su envión y el modo en que sumó al grupo.

_Anclas: F11 (arquetipo D), F5/F6 (el aviso ante el cambio). `seleccionados = []` → **sin citar ninguna escena náutica**, fraseo genérico-al-arquetipo._

**§10 · Ecos fuera de la cancha `ecos`** (IA · 2–3 frases / 25–60 pal) — 2 frases, ~45 pal ✓
> Fuera de la cancha, esa misma energía de impulso podría notarse en las ganas de proponer planes y de no quedarse quieta. Y su costado social suele aparecer en el gusto por hacer las cosas acompañada, en grupo más que en soledad.

_Anclas: generaliza la energía D en abstracto (F2) + suma el secundario I por ser mezcla (F3), lenguaje probabilístico ("podría", "suele")._

**§11 · Consejo de reset `reseteo`** (IA · 1–2 frases / 12–40 pal) — 2 frases, ~30 pal ✓
> A Sofía suele ayudarla contar con un momento breve para reacomodarse antes de retomar, sobre todo cuando algo cambió de golpe. Es un ajuste del entorno, no una exigencia hacia ella.

_Anclas: sub-motor Adaptación bajo (F6) como necesidad de re-encuadre · tono de `coherencia_presion: false` (F10b) → invitación general, sin apoyarse en estabilidad bajo presión no medida._

**§12 · Footer** (estático, invariante)
> Generado por ArgoMethod®
> Este informe es una fotografía del presente, no una etiqueta permanente.

---

## PASO 3 — Resolución explícita de los CASOS NULOS

| Caso | ¿Aplica a Sofía? | Cómo se resuelve |
|---|---|---|
| **Sin veta** (dominante limpio) | **NO.** Es lo contrario: `banda_veta: ligera`, secundario I=4 a un voto. | Si aplicara (`marcada`/`definida`, B≥4), la Tendencia (§7) bajaría a **1 frase pincelada** y el Retrato lideraría con una sola energía. En Sofía la rama tomada es la opuesta: `duo` empuja **ambas energías al frente** y sube la tendencia a co-protagonista. |
| **Sin momentos** | **SÍ.** `seleccionados = []`. | El único candidato (Q12 Conector) puntúa **1 < 4** porque I es el secundario y Meta aporta solo +1; no hay `escena_firma` de D ni datos de tormenta provistos. Resolución: el **Retrato (§2a) describe la energía en abstracto y no cita ninguna escena**; el **Checklist (§9) usa fraseo genérico-al-arquetipo**. Si la IA intentara escribir "en La Meta eligió la aventura compartida", el **closed-moment guard** lo rebota (la etiqueta "La Meta" no está en el whitelist). Esta es la lección de correctitud ipsativa: un voto secundario esperado no es evidencia citable. |
| **Empate (B=0)** | **NO**, pero a **un solo voto**. | Si fuera 5-5 o 4-4 en D/I: `banda_veta: equilibrio`, `confianza_tier: mezcla`, posible `tiebreaker_eje_aplicado` (que tope la confianza a `mezcla`). La Tendencia (§7) se **re-encuadra como "dos energías co-líderes"** en vez de "secundaria", y §4 permitiría **dos `escena_firma`** (una por co-líder) omitiendo `contra_tendencia`. Nota: el `duo` de Sofía ya se comporta casi así (retrato de dos energías), de modo que la diferencia práctica con el empate es mínima. |
| **Patrón de decisión null** (extra, aplica) | **SÍ.** `patron_decision = null` (sin tiempos). | **§5 se omite entera**, sin header huérfano. Es la **única omisión sancionada** del contrato. El validador exige la equivalencia estricta `presente ⟺ patron_decision ≠ null`: aquí ausencia limpia = VÁLIDO. Rellenarla con genérico sería MALFORMED. |
| **`motor_confianza: baja`** (modulador, aplica) | **SÍ.** `spread=65`. | No omite nada: baja el registro. El Retrato (§2a) y el chip (§2c) **no cierran afirmaciones fuertes de ritmo** ("parece moverse con un pulso parejo… apenas una aproximación"). |

---

**Conclusión.** El informe de Sofía sale con **las 12 secciones del molde**, cada una dentro de su rango de frases/palabras y su forma dura, y con **una sola omisión sancionada** (§5, `patron_decision = null`). Todas las frases anclan a un hecho F1–F11 o a la biblioteca de §2. El contenido es inconfundiblemente suyo (una **dupla Impulsor+Conector**, motor Rítmico con arranque fuerte y ajuste con aviso, sin momentos citables), pero el **esqueleto es idéntico** al de cualquier otro niño: mismas secciones, mismos rangos, mismas formas. Eso es "todos diferentes, pero iguales en estructura".

---

## Ejemplo 6

# Informe de Benja (9, tenis) — trazado por el esqueleto canónico

Caso: votos **3/3/3/3**, el empate ipsativo total. Es el peor caso posible de veta. Sirve para probar que aun sin dominante claro sale un informe con estructura idéntica a los demás. Todo lo que sigue está anclado a un hecho de la ficha (Fn) o a la biblioteca (§2).

---

## PASO 1 — FICHA DE EVIDENCIA (Capa 1, 100% determinista)

```jsonc
{
  // --- VOTOS ---
  "votos":        { "D":3, "I":3, "S":3, "C":3 },        // suman 12          (F1)
  "votos_pct":    { "D":25, "I":25, "S":25, "C":25 },    // AxisBars          (F1)
  "eje_dominante":"D",  "top_count":3,                    // por sort estable  (F2)
  "eje_secundario":"I", "second_count":3,                 // D·I·S·C           (F3)
  "brecha":       0,                                      // B = 3 - 3         (F4)
  "banda_veta":   "equilibrio",                           // B=0 (§2.2)        (F4)
  "confianza_tier":"mezcla",                              // techo duro        (F4)
  "forma_perfil": "disperso",                             // n_ejes_fuertes≥3 && B≤1 (F4b)
  "n_ejes_fuertes":4,                                     // los 4 con ≥3 votos(F4b)
  "tiebreaker_eje_aplicado":false,                        // sin contexto grupo(F7)

  // --- MOTOR ---
  "motor":        "Rítmico",                              // Medio → Rítmico   (F5)
  "motor_source": "games_full",
  "motor_composite":50,                                   // 34–66             (F5)
  "submotores":   { "impulso":48, "ritmo":52, "adaptacion":50,
                    "spread":4, "lead":"ritmo", "lag":"impulso" },        //   (F6)
  "motor_divergencia":"parejo",                           // spread < 25       (F6)
  "motor_confianza":"alta",                               // spread bajo, lejos de umbral (F6)
  "motor_tiebreaker_aplicado":false,                                       //   (F7)

  // --- PATRÓN DE DECISIÓN ---
  "patron_decision":"constante",                          // ≥6 tiempos válidos(F8)

  // --- TENDENCIA ---
  "tendencia_label":"con tendencia a lo social",          // secundario I (§2.4)(F9)

  // --- MOMENTOS NOTABLES ---
  "momentos": {
    "seleccionados":[],                                   // CASO NULO (ver Paso 3)(F10)
    "coherencia_presion":false                            // no verificable    (F10b)
  },

  // --- ARQUETIPO ---
  "arquetipo_id":"D_Ritmico", "arquetipo_label":"Impulsor Rítmico"        //   (F11)
}
```

**Cómo se computaron los campos sensibles del empate:**
- `B = top - second = 3 - 3 = 0` → `banda_veta: equilibrio`, `confianza_tier: mezcla` (§2.2, fila B=0).
- Vector 3-3-3-3 cumple `forma_perfil: disperso` (`n_ejes_fuertes ≥ 3` y `B ≤ 1`). Esto **fuerza** tendencia secundaria prominente y Retrato de dos energías (tope duro §2.2).
- `eje_dominante`/`eje_secundario`: con conteos idénticos, el sort estable resuelve por orden canónico D·I·S·C, así que salen D y I. Es un artefacto de orden, no una señal: por eso `confianza_tier` queda clavado en `mezcla` y el arquetipo nunca se afirma como identidad.
- Motor Medio → composite 50 → banda **Rítmico** (§2.3). `spread = 52-48 = 4 < 25` → `parejo`, sin patrón de divergencia.

---

## PASO 2 — CADA SECCIÓN DEL INFORME (misma Hoja de Contrato, mismos rangos)

### 1. Encabezado · estático
> **Informe de perfil**
> Adulto responsable: [nombre del adulto]

Presencia siempre, 2 líneas fijas. Ancla: contrato §1.

---

### 2a. Retrato de Sintonía · `resumenPerfil` (IA) — 4–6 frases / 55–130 pal
> Benja se mueve con una versatilidad poco común: sus respuestas se repartieron de forma pareja entre las cuatro energías del modelo, sin que una se imponga sobre las demás. Esto sugiere, más que un perfil marcado, una gran flexibilidad para adaptarse a lo que cada momento del juego pide. Su motor parece sostener un pulso parejo, ni arranque explosivo ni pausa larga, algo que acompaña bien esa amplitud. Entre los matices que asoman, aparecen con fuerza parecida el impulso de proponer y el gusto por lo compartido con otros. Nada de esto lo define de una sola manera: es una fotografía de un chico que, hoy, disfruta explorando desde varios lugares.

*(5 frases, ~103 pal.)* Anclas: apertura calibrada a `mezcla`+`disperso` (F4/F4b, "dos energías al frente", nunca "es un Impulsor Rítmico"); motor Rítmico integrado (F5); tendencia secundaria elevada a co-protagonista (F9); **ninguna escena náutica citada** porque `seleccionados == []` (F10, lo enforcea el closed-moment guard); cierre suave.

### 2b. AxisBars · determinista — exactamente 4 barras, Σ=12
> Impulsor ▉▉▉▉▉ 25% · Conector ▉▉▉▉▉ 25% · Sostén ▉▉▉▉▉ 25% · Estratega ▉▉▉▉▉ 25%

Anca: `votos_pct` (F1). Las cuatro barras a la par son el ancla visual de que no hay pureza; la prosa no puede contradecirlas.

### 2c. Motor-chip · determinista
> Motor: **Rítmico**

Ancla: F5, ∈ {Dinámico, Rítmico, Sereno}.

---

### 3. Motor de rendimiento · `motorDesc` (IA) — 2–4 frases / 30–75 pal
> En los juegos de ritmo, Benja mostró un pulso parejo: arranca, sostiene y se reacomoda de forma equilibrada, sin picos ni bajones bruscos. Es un motor que suele rendir bien en lo repetible y sostenido, donde la constancia pesa más que el estallido inicial. Se lo ve cómodo cuando puede encontrar su cadencia y mantenerla.

*(3 frases, ~52 pal.)* Anclas: composite-band Rítmico (F5) + **solo** el patrón `parejo` (F6), sin forzar contraste de sub-motores. Impulso como `lag` (48) jamás se dice "lento": va plegado en positivo (§2.3).

---

### 4. Qué lo mueve · `combustible` (IA, locked) — 2–3 frases / 25–60 pal
> A Benja lo mueve una mezcla: por un lado, la sensación de avanzar y proponer; por otro, el disfrute de compartir el juego con otros. En su elección sobre qué disfruta del viaje asomó ese gusto por el vínculo y el movimiento a la par.

*(2 frases, ~48 pal.)* Anclas: combustible de D + I (F2/F3) atado al disfrute literal de Q3; como `forma ∈ disperso`, mezcla ambos ejes en igual peso (§5 sección 3).

---

### 5. Patrón de decisión · determinista — implicación 1–2 frases / 15–45 pal
> **Patrón:** sostiene un pulso parejo de principio a fin.
> **Qué significa para la actividad:** en la práctica, Benja suele mantener su energía estable a lo largo de la actividad, sin necesitar demasiados reinicios. Le sienta bien un ritmo continuo.

Ancla: F8 = `constante` (§2.5), clasificador independiente sobre tiempos. Presente porque `patron_decision != null`.

---

### 6. Palabras puente / que generan ruido · estático por arquetipo — 3≤N≤6
> **Palabras puente:** "Vamos, tú puedes" · "Buen arranque" · "Probemos algo nuevo" · "Hagámoslo en equipo"
> **Palabras que suelen generar ruido:** "Quédate quieto y espera" · "Aún no es tu turno" · "Hazlo bien lento" · "No propongas todavía"

Ancla: F11 (base Impulsor) + extras del secundario Conector (F3), anexados sin bajar de 3 ni pasar de 6. Pre-escritas; la IA no las genera.

---

### 7. Tendencia secundaria · estático, peso por IA — 1–2 frases / 12–40 pal
> **Tendencia secundaria: con tendencia a lo social.** Junto a su impulso por proponer, en Benja pesa casi igual el disfrute de lo compartido: sumar a los demás y hacer del juego algo colectivo. En un perfil tan parejo, es una de sus varias puertas de entrada.

*(2 frases, ~38 pal.)* Anclas: label fijo de `TENDENCIA_LABELS` (F9). Peso alto (2 frases, co-protagonista) porque `forma ∈ disperso` fuerza prominencia (contrato §7-b).

---

### 8. Guía rápida (Activar / A considerar) · estático base — 2–4 filas
| Activar | A considerar |
|---|---|
| Ofrécele varias formas de encarar el ejercicio. | Demasiada rigidez en un solo método puede aburrirlo. |
| Dale espacio para proponer y también para sumar a otros. | Un entorno muy solitario le quita una de sus energías. |
| Reconoce su constancia, no solo los picos. | Si todo se vuelve urgente, pierde su ritmo parejo. |

*(3 filas, cada celda 5–18 pal, ambas columnas llenas.)* Anclas: F2, F5, F6. Los "A considerar" son condiciones de **entorno**, nunca fallas del niño.

---

### 9. Checklist del día · IA — exactamente 3 bloques / 6–26 pal c/u
> **Antes:** recuérdale que puede encarar el juego a su manera; no hay una sola forma correcta.
> **Durante:** déjale espacio para proponer y también para jugar con los demás.
> **Después:** celebra que mantuvo su ritmo parejo de principio a fin, más allá del resultado.

Anclas: F11, F5, F8. **Sin escena náutica** (F10 vacío → closed-moment guard).

---

### 10. Ecos fuera de la cancha · `ecos` (IA) — 2–3 frases / 25–60 pal
> Fuera de la cancha, es probable que Benja lleve esa misma versatilidad a otros espacios: se anima a proponer cosas nuevas y, a la vez, disfruta cuando hay otros con quienes compartirlas. Su comodidad para moverse entre distintos roles puede notarse tanto en un juego como en una tarea en grupo.

*(2 frases, ~52 pal.)* Anclas: energía de D generalizada en abstracto + I en mezcla (F2/F3), probabilístico.

---

### 11. Consejo de reset · `reseteo` (IA) — 1–2 frases / 12–40 pal
> Cuando Benja necesite recargar, suele ayudarle volver a un ritmo conocido y tranquilo antes de retomar. Ofrecerle un momento para reencontrar su cadencia, sin apuro, lo acerca a su mejor versión.

*(2 frases, ~32 pal.)* Anclas: sub-motor Adaptación (F6) + tono de `coherencia_presion` (F10b, falso → se apoya en cadencia, no en presión).

---

### 12. Footer · estático
> Generado por ArgoMethod®
> Este informe es una fotografía del presente, no una etiqueta permanente.

---

## PASO 3 — RESOLUCIÓN EXPLÍCITA DE LOS CASOS NULOS

**A) SIN VETA / EMPATE (B=0, el eje del pedido).**
`brecha = 0` → `banda_veta: equilibrio`, `confianza_tier: mezcla`; vector 3-3-3-3 → `forma_perfil: disperso`. Efectos deterministas:
- Prohibido afirmar un dominante único (§2.2 fila B=0). El hero **sí** muestra el chip técnico "Impulsor Rítmico" (F11 nunca falta), pero la prosa jamás dice "es un Impulsor Rítmico": el Retrato (2a) abre con versatilidad y el band-guard rebota cualquier intensidad verbal por encima de `mezcla`.
- `forma: disperso` **fuerza** que la Tendencia secundaria (sección 7) sea prominente (2 frases) y que el Combustible (4) mezcle ambos ejes. Esas dos secciones cambian de peso, no de existencia.
- **Desempate de eje:** con conteos idénticos, `eje_dominante = D` / `secundario = I` salen del sort estable D·I·S·C, con `tiebreaker_eje_aplicado = false` (no hubo contexto de grupo). Si lo hubiera habido, el flag sería `true` y `confianza_tier` **seguiría** topado en `mezcla`: el arquetipo se presentaría como "una lectura entre varias igualmente plausibles". Aquí ya está topado igual, así que el resultado visible es el mismo.

**B) SIN MOMENTOS (`seleccionados == []`).**
Con la distribución plana no hay concentración de eje que dispare candidatos: `escena_firma` no tiene un dominante privilegiado; `tormenta_divergente` no alcanza el umbral de ≥2/3 en un eje distinto; y bajo `banda_veta == equilibrio` la regla §4.2 **omite** `contra_tendencia` para no fabricar un dominante inexistente. Resultado: `seleccionados = []`. Consecuencias forzadas:
- El Retrato (2a) y el Checklist (9) describen la energía en abstracto y **no citan ninguna escena náutica** (La Tormenta, La Meta, etc.). Lo enforcea el closed-moment / closed-example guard: cualquier etiqueta náutica fuera del whitelist vacío se rebota y se regenera.
- `coherencia_presion = false` (no verificable con datos planos) → el Reset (11) se apoya en la cadencia, no en un tono de "firmeza bajo presión".

**C) Casos nulos que aquí NO se activan (pero el molde los contempla):**
- *Patrón de decisión null:* si Benja tuviera <6 tiempos válidos, `patron_decision = null` y la sección 5 se **omite entera** (única omisión sancionada del contrato: presente ⟺ `patron_decision != null`). Aquí hay tiempos, así que la sección está presente con `constante`.
- *Motor fallback:* si no hubiera datos de juego (`motor_source ∈ {time_fallback, vote_fallback}`), la sección 3 no podría nombrar sub-motores y se contraería a 1–2 frases apoyada solo en el composite-band. Aquí `games_full` habilita el patrón `parejo` completo.

---

## Conclusión de la demostración

El informe de Benja sale **individual** (versatilidad al frente, motor parejo, tendencia social elevada, cero escenas citadas) pero con **estructura idéntica** a cualquier otro: las mismas 12 entradas de la Hoja de Contrato, presentes, dentro de sus rangos y con su forma dura. El empate total no rompe el molde: solo cambia qué banda de lenguaje se licencia (`mezcla`), qué secciones ganan peso (tendencia + combustible) y qué se apaga limpiamente (momentos = sin escena, `coherencia_presion` = false). Eso es, literalmente, "todos diferentes, iguales en estructura".

---

# Parte D — Verificación adversarial (39 hallazgos, 5 lentes)

Las cinco lentes volvieron CON_HUECOS. Detalle:

## Lente: LENGUAJE (probabilístico / no clínico-déficit / buyer-neutral / sin guiones / tuteo) (CON_HUECOS)

El diseño es lingüísticamente robusto en lo estructural: el mandato ipsativo (toda afirmación desde el agregado, prohibido el patrón \"opción A -> afirmá X\"), el reencuadre anti-déficit explícito (Impulso bajo = calma/profundidad, penalizaciones crudas nunca expuestas), la columna \"Nunca (rebota filtro)\" por eje, y el buyer-neutral consistente (\"el niño\"/\"el adulto\", sin \"tu hijo\") están bien resueltos. No hay \"siempre/nunca/garantiza/destinado\" literales en la biblioteca. Los huecos son concretos y acotados: (1) el superlativo \"brilla\" en dos patrones de motor que ningún guard rebota y llega vía motorDesc; (2) el bloque estático `constante` se sirve verbatim sin IA con el absoluto \"de principio a fin\" y sin hedge, cuando el resto del sistema asume que la IA suaviza; (3) un voseo (\"reescribí\") en el prompt del bucle de reparación que el hook marcaría; y (3 menores) \"sin picos ni bajones\" en el anexo-modelo, \"excelencia/calidad\" en el eje C, y \"chicos\" en lugar de \"niños\". Antes de implementar: hedgear todos los seeds estáticos de §2.5/§2.3 en la propia biblioteca (no dependen de reescritura de IA), agregar \"brilla\" y superlativos de excelencia al band-guard/PROHIBITED_WORDS, y pasar el prompt de retry a tuteo. Con esos ajustes queda a prueba de balas.

- **[MEDIA]** El concepto aprobado usa el superlativo categórico "brilla" en dos patrones de motor (§2.3): parejo = "...se reacomoda de forma pareja; BRILLA en lo repetible y sostenido" y sostenedor_de_cadencia = "BRILLA al sostener la cadencia sin perder foco". "Brilla" es una afirmación de excelencia en presente indicativo, no probabilística, y roza el eje de rendimiento/talento que la copy-sensitivity prohíbe. Estos patrones alimentan motorDesc; ningún guard existente (band-guard mira intensidad-vs-banda_veta; DETERMINISTIC_PATTERNS solo caza siempre/nunca/totalmente...) rebota "brilla", así que puede llegar verbatim al usuario.  
  _fix:_ Reescribir los seeds sin superlativo y con hedge: parejo -> "arranca, sostiene y se reacomoda de forma pareja; suele sentirse cómodo en lo repetible y sostenido"; sostenedor_de_cadencia -> "tiende a sostener la cadencia sin perder foco". Además agregar "brilla/brillar" (y sinónimos de excelencia categórica) a la lista que vigila el band-guard o a PROHIBITED_WORDS para que no reentre por la reescritura de Capa 2.
- **[MEDIA]** El bloque estático `constante` de patrón de decisión (§2.5) se renderiza cliente-side SIN IA (§5, fila 4: "Determinista, no pasa por el modelo"), o sea es copy final verbatim, y dice "sostiene un pulso parejo de PRINCIPIO A FIN". "De principio a fin" es un absoluto generalizante (equivalente semántico de "siempre") sin ningún "suele/tiende" que lo atempere, y al no pasar por IA nadie le agrega el hedge que el resto del sistema asume. Los otros tres (arranque_lento, cierre_desgaste, contexto) sí traen hedge; `constante` es el único desnudo.  
  _fix:_ Acotar al juego medido y hedgear: "suele mantener un pulso parejo a lo largo del juego" (o "tiende a sostener un ritmo parejo durante toda la travesía"). Regla general para TODOS los bloques estáticos de §2.5 (que no pasan por Capa 2): deben venir ya hedgeados en la biblioteca, porque no hay reescritura de IA que los suavice después.
- **[MEDIA]** Voseo en el string de prompt del bucle de reparación del validador (§Validador post-generación y §6.3): "...el rango es {min}-{max}; REESCRIBÍ solo esta sección". "reescribí" es forma voseo; el tuteo es "reescribe". La regla de voseo es STRICT y está enforced por post-edit hook, que marcaría esta línea al implementarla aunque sea un prompt interno.  
  _fix:_ Cambiar a tuteo: "...el rango es {min}-{max}; reescribe solo esta sección". Revisar cualquier otra instruccion imperativa de los prompts de retry por la misma forma (verificar tambien mensajes de correccion en §6.3 paso 3).
- **[BAJA]** En el retrato ejemplo del Niño B (Anexo A) el cierre es "...motor parejo que sostiene de principio a fin, SIN PICOS NI BAJONES". "Sin picos ni bajones" es un absoluto categórico (implica "nunca baja"), del tipo que DETERMINISTIC_PATTERNS busca evitar, y como es el ejemplo trabajado sienta el molde de tono para la implementación. Reincide además el "de principio a fin".  
  _fix:_ Hedgear el ejemplo: "...motor parejo que suele sostenerse durante toda la travesía, con pocos altibajos". Que el anexo modele el registro probabilístico que se le exige a la Capa 2.
- **[BAJA]** Vocabulario de rendimiento/excelencia en la lectura autorizada del eje C (§2.1): Energía Estratega = "...calidad, leer la jugada, EXCELENCIA". "Excelencia" (y en menor grado "calidad") inclina hacia performance/ganar, marco que la copy-sensitivity de Argo pide evitar a favor de bienestar y disfrute. Al ser "lectura única autorizada" del eje, cualquier seccion que cite el eje C puede heredar ese encuadre.  
  _fix:_ Reencuadrar hacia el disfrute del proceso, no el resultado: reemplazar "excelencia" por "el gusto por hacerlo cada vez mejor a su modo" o "disfrutar de entender el cómo"; "calidad" -> "el detalle bien cuidado". Mantener el foco en la motivación interna, no en el estándar de rendimiento.
- **[BAJA]** Uso de "chicos" en la prosa del Anexo A ("separa a dos CHICOS del mismo arquetipo", "dos CHICOS reales"). La convención de copy fijada es "niños", no "chicos". Es prosa interna del spec, pero fija vocabulario para quien implemente y puede filtrarse a copy visible.  
  _fix:_ Sustituir "chicos" por "niños" en las dos ocurrencias del Anexo A ("dos niños del mismo arquetipo", "suenan a dos niños reales").

## Lente: CONTRATO DE FORMATO: presencia+rango+forma+caso nulo por sección; determinismo del validador post-generación; cierre del fallo "un módulo 800 palabras / otro vacío"; rangos que permiten variar contenido con estructura idéntica. (CON_HUECOS)

El contrato SÍ cierra el fallo central '800 vs vacío': cada sección obligatoria tiene max (nada de 800) y min + no-vacío + clamp (nada vacío), con bucle de reparación que termina. Pero tiene huecos concretos. Dura (alta): (1) contradicción numérica — el fallback `bienvenida` (2–4 frases) está por debajo del rango del Retrato (4–6), así que la ruta de degradación del corazón siempre cae OUT_OF_RANGE y termina en padding/truncado de texto genérico; (2) la 'forma dura verificable' de las secciones de prosa no es deterministamente verificable — el validador sólo enforcea presencia+rango+denylist de escena, y el requisito de incluir el momento es unidireccional (prohíbe, no exige), así que 'misma forma' no está realmente garantizada donde más importa; (3) el retry global full-JSON de los guards y el retry por-sección del validador no están reconciliados (orden/re-validación indefinidos), lo que abre una fisura al cierre del fallo. Media: item-count de palabras puente varía 4 vs 6 entre informes del mismo arquetipo (contradice 'idéntico'); sub-rango de fallback de Motor incompleto (sin rango de palabras); denylist de sub-motor y de etiquetas náuticas mal especificados y con falsos positivos; la omisión de la sección 5 rompe literalmente 'iguales en estructura'. Baja: el clamp corta a mitad de frase sin re-validar; conteo sobre `__NAME__` subestima nombres de 2 tokens. Ninguno es fatal, pero los tres 'alta' deben cerrarse antes de implementar para que el invariante 'todos diferentes, iguales en estructura' sea real y no aspiracional.

- **[ALTA]** Contradicción numérica dura en el fallback del corazón. El Retrato (§2a) exige 4–6 frases / 55–130 palabras, pero su caso nulo designado, el `bienvenida` estático, está especificado como 2–4 frases (§2 (d) y (b)). 2–4 frases < 4 frases mínimo: SIEMPRE que se caiga a fallback, el validador lo marca OUT_OF_RANGE, y el bucle termina forzando padding estático o truncado sobre texto genérico-al-arquetipo. La sección más importante ('debe sonar a ESTE niño') es la que peor degrada.  
  _dónde:_ Contrato §2 (b)(d) + Hoja fila 2a; skeleton §5  
  _fix:_ Reautorar cada `bienvenida`-semilla al MISMO rango de su sección (4–6 frases / 55–130 pal), o crear un fallback dedicado `resumenPerfil-semilla` por arquetipo dentro de rango. Regla general del contrato: todo fallback estático de una sección DEBE estar pre-validado dentro del [min,max] de esa sección; agregar un test de build que corra el validador sobre los 12×3 fallbacks estáticos y falle si alguno cae fuera de rango.
- **[ALTA]** La 'FORMA' de las secciones de prosa NO es verificable deterministamente, así que 'misma forma' no está garantizada donde más importa. El validador sólo enforcea presencia + rango + denylist de escena. La forma ordenada del Retrato (apertura dominante → motor → momento → tendencia → cierre), la 'integración del motor' en §3, y el requisito 'al menos 1 momento si existe' son semánticos: ningún chequeo determinista los valida. El guard de escena es unidireccional (prohíbe citar escena si seleccionados==[], pero NUNCA exige incluir el momento cuando SÍ existe). Un Retrato que ignora el momento disponible y no integra el motor pasa el validador.  
  _dónde:_ Contrato §2 (c), §3 (c); Validador FORMA; Hoja fila 2a/3  
  _fix:_ Aceptar explícitamente que para prosa la 'forma' garantizada es presencia+rango+denylist, y añadir los pocos chequeos que SÍ son deterministas: (a) requisito positivo de momento — si `momentos.seleccionados!=[]`, exigir que aparezca la etiqueta náutica exacta del/los `seleccionados` (presence-of-token, no sólo absence-of-others), MALFORMED si falta; (b) requisito de motor — exigir presencia del token de banda (Dinámico|Rítmico|Sereno) en `motorDesc`. Lo no verificable (orden de las 5 partes) sale de la columna 'forma dura verificable' y pasa a 'guía de prompt', para no prometer enforcement que no existe.
- **[ALTA]** Dos sistemas de retry sin reconciliar. El skeleton (§6.3) define UN retry global full-JSON ante cualquier guard hit; el contrato define retry POR SECCIÓN dirigido. No se especifica orden ni interacción. Una reescritura full-JSON del pipeline de guards puede re-romper rangos de secciones que el validador ya había dejado OK (y viceversa), y no hay re-validación cruzada especificada. El cierre del fallo '800 vs vacío' no es hermético si el guard global corre después del validador de rango sin re-chequear rangos.  
  _dónde:_ Skeleton §6.3 vs Contrato 'Bucle de reparación'  
  _fix:_ Definir un orden único y un fixpoint: (1) generar → (2) guards léxicos (prohibited/deterministic/band/GT/closedMoment) con su retry full-JSON → (3) validador de presencia/rango/forma por sección → (4) si el paso 3 regeneró alguna sección, re-correr los guards léxicos SOLO sobre las secciones tocadas. Cota: máx 1 pasada de cada tipo; si tras el fixpoint algo sigue ≠OK, degradar esa sección a estático/clamp. Documentar que un retry full-JSON del paso 2 obliga a re-correr el paso 3 completo.
- **[MEDIA]** 'Palabras puente/ruido idéntico en todos los informes del mismo arquetipo' se contradice con 'los extras del secundario se anexan'. Con base 4 + 2 extras del secundario = 6 para un niño, y 4 para otro niño del MISMO arquetipo sin/otros extras: el conteo de ítems varía 4 vs 6 entre informes del mismo arquetipo. Eso es una diferencia estructural (item-count) que rompe 'iguales en estructura', y falsea la afirmación 'idéntico por arquetipo'.  
  _dónde:_ Contrato §6 (b)(d); Hoja fila 6  
  _fix:_ Decidir uno de dos: (a) congelar N por arquetipo — los extras del secundario REEMPLAZAN ítems base (swap, no append), manteniendo N constante; o (b) eliminar la palabra 'idéntico' y declarar el invariante real como 'ambas listas presentes, 3≤N≤6, N puede diferir por secundario'. Si el owner quiere estructura idéntica literal, va (a).
- **[MEDIA]** Sub-rango de fallback de §3 (Motor) sub-especificado. Se dice 'se contrae a 1–2 frases (fallback: 1–2)' pero no se da rango de PALABRAS para el caso fallback; el rango normal es 30–75 pal. El validador no sabe qué min/max de palabras aplicar en fallback: un fallback de 1 frase / 18 palabras fallaría el min 30 y entraría en loop de reparación innecesario.  
  _dónde:_ Contrato §3 (d); Hoja fila 3  
  _fix:_ Especificar el rango completo del caso fallback en la Hoja: p. ej. §3 fallback = 1–2 frases / 15–45 palabras, y wirear el validador para que seleccione el sub-rango en función de `motor_source ∈ {time_fallback, vote_fallback}` (input explícito al validador, no inferido del texto).
- **[MEDIA]** El chequeo determinista 'sin sub-motores si fallback' se define como 'léxico de Impulso/Ritmo/Adaptación prohibido', pero esas palabras colisionan con vocabulario permitido. La banda-composite 'Rítmico' se describe como 'sostiene un pulso parejo' y el motor mismo se llama Rítmico; 'ritmo' aparece en conceptos aprobados. Un denylist crudo sobre 'ritmo/impulso/adaptación' genera falsos positivos y puede rebotar texto correcto de composite-band.  
  _dónde:_ Validador FORMA ('léxico de Impulso/Ritmo/Adaptación'); skeleton §2.3  
  _fix:_ No banear los lexemas genéricos. Definir el denylist de sub-motor como los términos-firma del sub-puntaje medido (p. ej. nombres de patrón de divergencia y frases como 'arranque fuerte', 'se reacomoda con fluidez', o los ids de patrón), no 'ritmo'/'impulso' sueltos. Mejor aún: marcar estructuralmente las frases de sub-motor en el prompt con un token y prohibir el token en fallback, evitando NLP frágil.
- **[MEDIA]** El closed-moment guard (base de la FORMA de Retrato/Checklist) depende de un denylist de etiquetas náuticas que NO está enumerado, y es propenso a falsos positivos con metáfora ('cuando llega una tormenta de nervios', 'remar juntos'). Además 'tormenta', 'puerto', 'meta', 'isla', 'calma' son palabras comunes del copy infantil. Sin la lista cerrada exacta de tokens citables/prohibidos, el chequeo no es reproducible.  
  _dónde:_ Contrato §2 (c)(d), §9 (d); skeleton §6.2/§6.4  
  _fix:_ Enumerar en el contrato la lista cerrada de ETIQUETAS de escena citables (los títulos exactos: 'El Despegue', 'La Tormenta', 'El Nudo Rebelde', etc. + los rótulos 'Puerto/Tormenta/Isla…') y matchear sólo esos tokens con mayúscula inicial / verbatim del `opcion_texto`, no lexemas sueltos en minúscula. Documentar que el guard ignora usos metafóricos en minúscula. Cuando seleccionados≠[], permitir SOLO las etiquetas de los `seleccionados[]` y rebotar cualquier otra etiqueta de la lista cerrada.
- **[MEDIA]** La omisión de la sección 5 (Patrón de decisión con patron_decision==null) rompe literalmente 'todos iguales en estructura': el conjunto de secciones renderizadas difiere entre informes (con vs sin sección 5). Está marcada como excepción sancionada, pero el owner pidió estructura idéntica y esto es una divergencia estructural real, no de contenido.  
  _dónde:_ Contrato §5; Validador 'equivalencia estricta'; Garantía final  
  _fix:_ Elegir postura y documentarla: (a) mantener la omisión pero reescribir la garantía final como 'estructura idéntica salvo la sección 5, condicionada a ≥6 tiempos válidos'; o (b) mantener SIEMPRE presente el bloque con un estado explícito honesto cuando null ('No reunimos suficientes tiempos de respuesta para leer un patrón de ritmo en esta sesión.') — texto estático, no genérico-inventado, preservando estructura idéntica sin violar honestidad. (b) cumple mejor el pedido del owner.
- **[BAJA]** El último recurso del bucle ('recortarOClamp': truncado determinista a max / padding estático a min) puede producir output que viola la propia FORMA/rango y se sirve SIN re-validar (el loop termina ahí). Truncar un Retrato de 200→130 palabras corta a mitad de frase (deja una frase incompleta, puede alterar el conteo de frases fuera de rango, o partir una cita de escena a la mitad). El padding estático puede empujar sobre el frase-max o mezclar voz genérica con prosa específica.  
  _dónde:_ Contrato 'Bucle de reparación' / 'Prioridad de degradación'  
  _fix:_ El clamp debe operar en fronteras de frase (recortar frases enteras hasta entrar en [min,max] de AMBAS unidades) y re-correr validateSection una vez más; si aún falla, servir el estático completo de la sección en vez del truncado. Prohibir padding con texto que introduzca etiquetas de escena. Para prosa, preferir 'estático completo dentro de rango' (ver hallazgo alta #1) por sobre truncar.
- **[BAJA]** El validador corre sobre el placeholder `__NAME__` (antes de rehydrateName) y cuenta palabras ahí. Un nombre real de 2 tokens ('Juan Pablo') infla el conteo real por cada aparición; un Retrato validado en el máximo (130) puede superar el max tras rehidratar.  
  _dónde:_ Validador ('antes de rehydrateName'); §0 unidad 'palabra'  
  _fix:_ Contar `__NAME__` con el largo en tokens del nombre real (o normalizar nombres a 1 token para conteo), o descontar un margen igual a (apariciones de __NAME__ × (tokens_nombre−1)) al validar contra el max. Alternativa simple: cap de nombre a 1 token en la prosa.

## Lente: Solidez ipsativa: honestidad de las bandas de fuerza de veta y del esqueleto ante 12 votos forzados (¿comunica mezcla/confianza o finge certeza?). (CON_HUECOS)

La disciplina de dos capas y el sesgo a sub-afirmar son sólidos, y en B<=1 el esqueleto es honesto (dice mezcla). Pero verifiqué las bandas con Monte Carlo (multinomial 12,0.25; 2M draws) y enumeración exhaustiva de las 455 composiciones, y hay cuatro sobre-afirmaciones concretas: (1) forma_perfil es ambigua para ~10% de perfiles (6 firmas caen en dos formas sin precedencia), permitiendo la lectura de mayor confianza; (2) el Hero muestra un arquetipo único aun en empates B=0/B=1, contradiciendo visualmente el texto de 'dos energías'; (3) los tiers 'alta' se asignan antes de la calibración que el propio Anexo B declara pendiente, y B=4-5='dominante claro' captura 6.3% del azar; (4) B=2-3='eje líder real' sobre-afirma donde P(B>=2)=41%. Suma un empate second==third no manejado y una SD marginal mal aplicada en §1.2. Ninguno es fatal: todos se cierran con precedencia explícita de forma, rótulo dual en el Hero para mezcla, y gate del registro de lenguaje detrás de los percentiles de Anexo B.

- **[ALTA]** forma_perfil es no determinista: 6 firmas de voto satisfacen DOS formas a la vez sin regla de precedencia. Enumeración exhaustiva de las 455 composiciones: (7-4-1-0),(6-3-3-0),(6-3-2-1) son pico Y lider_con_sombra; (5-4-3-0),(4-4-4-0),(4-4-3-1) son duo Y disperso. formaPorVector queda indefinida para ~10% de perfiles reales. Peor para la lente ipsativa: un 6-3-2-1 puede resolverse como 'pico -> seguridad probabilística alta' (sobre-afirma) o como 'lider_con_sombra' (mezcla). Rompe además la garantía 'iguales en estructura'.  
  _dónde:_ Esqueleto §2.2 tabla forma_perfil / formaPorVector  
  _fix:_ Convertir las 4 formas en cascada mutuamente excluyente con orden explícito, de más conservador a menos: 1) disperso (nf>=3 && B<=1); 2) duo (s[1]>=4 && B<=1 && nf<3); 3) pico (top>=6 && B>=4); 4) lider_con_sombra (top>=5 && B in {2,3}); else ligera/equilibrio. Subir el corte de pico de B>=3 a B>=4 lo separa limpio de lider (B in {2,3}). Agregar test que recorra las 455 composiciones y verifique exactamente una forma por vector.
- **[ALTA]** El Hero muestra SIEMPRE un arquetipo único (nombre + chip), el elemento más prominente del informe, incluso cuando las bandas niegan la dominancia. Con B=0/B=1 o forma duo, eje_dominante = sorted[0] es un desempate arbitrario entre ejes empatados; un 4-4-2-2 D/S se rotula 'Impulsor Rítmico' y un solo voto voltea el rótulo entero. La prosa hedgea 'dos energías' pero el título visual afirma una dominancia inexistente. El flag F7 (tiebreaker) solo se activa con contexto de grupo, no en un B=0 suelto, así que la confianza tampoco baja.  
  _dónde:_ Esqueleto §1.3 arquetipo_id + §5 fila 1 (Hero) + §2.2 caso equilibrio  
  _fix:_ En banda_veta ∈ {equilibrio, ligera} o forma == duo, el Hero NO debe renderizar un arquetipo_id único: usar rótulo de combinación ('Sostén + Estratega, en equilibrio') y chip de motor sin eje único, o marcar arquetipo como 'lectura entre dos'. Además setear tiebreaker_eje_aplicado=true y confianza_tier=mezcla SIEMPRE que top_count==second_count, no solo bajo desempate por dispersión de grupo.
- **[ALTA]** Los tiers 'alta'/'muy_alta' se hard-codean como registro de lenguaje ANTES de la calibración que el propio Anexo B declara pendiente, y B=4-5='alta' ('dominante claro') sobre-afirma. Monte Carlo (2M draws): P(B en 4-5)=6.3%, P(B>=6)=0.8%. La banda marcada/alta etiqueta como dominante claro a 1 de cada 16 respondientes al azar, por encima del umbral usual del 5% para 'alta confianza'. Anexo B afirma que las bandas son 'conservadoras por diseño' hasta correr la simulación: contradicción directa. Solo B>=6 (0.8%) resiste un corte del 5%.  
  _dónde:_ Esqueleto §2.2 tabla de bandas + Anexo B  
  _fix:_ Hasta inyectar los percentiles de Anexo B: prohibir en copy la frase 'dominante claro/definido' por debajo de B>=6; en B=4-5 usar 'inclinación marcada, con matices'. Alternativa numérica: mover 'alta' a B>=6 y 'muy_alta' a B>=7-8. Gate del registro de lenguaje detrás del flag de calibración, para que el esqueleto no prometa una confianza que su propio anexo dice no haber validado.
- **[MEDIA]** B=2-3 rotulado 'Eje líder real con acompañante fuerte' (tier media) sobre-afirma justo en el punto de máxima ambigüedad. P(B>=2)=41% y P(B en 2-3)=34% bajo respuesta al azar: se atribuye 'un eje líder real' a un tercio del ruido. El propio §1.2 admite que un líder de 5 está a ~1.3 SD de la media; B=2 apenas supera el azar, y es exactamente el borde donde el informe empieza a afirmar dominancia.  
  _dónde:_ Esqueleto §2.2 fila B=2-3  
  _fix:_ En la banda media, liderar SIEMPRE con la mezcla y bajar la intensidad del rótulo: 'se asoma un eje por delante, con un acompañante casi a la par' en vez de 'eje líder real'. Mantener eje_secundario como co-lectura, no como matiz. Reservar 'líder claro' para banda marcada+ ya recalibrada (ver finding de tiers).
- **[MEDIA]** Empate second_count==third_count no manejado: la Tendencia secundaria afirma una veta arbitraria. En 5-3-3-1 (B=2 -> lider_con_sombra, donde el secundario es 'segunda energía fuerte' prominente) los dos ejes de 3 votos empatan; sorted[1] elige uno por orden y TENDENCIA_LABELS afirma una veta específica ('con tendencia al detalle') que un solo voto voltea a otra ('a la calma firme'). La forma disperso solo cubre B<=1, así que este empate queda enmascarado en banda media/prominente.  
  _dónde:_ Esqueleto §1.3 eje_secundario/F3 + §2.4 + Contrato §7  
  _fix:_ Detectar second_count==third_count y emitir un flag secundario_empatado en la ficha. Cuando ocurra: nombrar ambas vetas ('con tendencia al detalle y a la calma firme') o generalizar ('con una segunda energía repartida'), y NO subir esa tendencia a co-protagonista aunque la forma sea lider_con_sombra; la Capa 2 debe hedgear.
- **[MEDIA]** El argumento estadístico de §1.2 aplica mal la SD marginal. Usa SD≈1.5 (desvío de UN eje binomial) para razonar sobre el líder (que es el MÁXIMO de 4 conteos correlacionados negativamente) y sobre la brecha B. Bajo el multinomial E[máx]≈4.7, no 3: un líder de 5 está cerca de la mediana del máximo, no a '1.3 SD' de la media. El razonamiento subestima cuán común es un líder de 5 y le da al esqueleto una falsa sensación de rigor calibratorio, pese a que la conclusión (sub-afirmar) sea correcta.  
  _dónde:_ Esqueleto §1.2 Correctitud ipsativa  
  _fix:_ Reescribir §1.2 en términos de la distribución del máximo y de B: reemplazar 'un líder de 5 está a ~1.3 SD' por los P(B>=k) empíricos (P(B>=2)=0.41, P(B>=4)=0.07, P(B>=6)=0.008) y remitir la fijación de bandas a esos percentiles (los mismos que pide Anexo B). Mantener la conclusión de sub-afirmar, pero apoyada en el estadístico correcto (máx/brecha), no en la SD marginal.

## Lente: ANTI-ALUCINACIÓN — cada magnitud/rasgo/motivación/momento debe rastrearse a una regla numérica de veta, un umbral de sub-puntaje, o un concept-block cerrado de la biblioteca. Busco todo punto donde Capa 2 aún puede afirmar algo del niño no derivable de un número. (CON_HUECOS)

La arquitectura de dos capas es sólida en su columna vertebral (voto→veta→banda→concept-block, ipsativo, cláusula de no-upgrade). Pero quedan huecos concretos por los que la IA todavía puede afirmar algo no anclado a un número. Los tres más peligrosos: (1) el propio Anexo A canoniza convertir un voto singleton (ruido puro, p=0.25) en un momento narrado con motivación atribuida ("sorprende con un gesto de equipo"); (2) el band-guard —la defensa primaria contra magnitud— está sin lexicón definido, y el filtro que YA existe (DETERMINISTIC_PATTERNS, verificado en api/generate-ai.ts:334) no captura "muy/fuerte/predomina/sobresale/marcado/su mayor fortaleza", justo las palabras que el owner teme; (3) los campos wow, corazon y grupoEspacio SÍ pasan por el modelo (verificado en AISections, generate-ai.ts:34-40,197) pero no tienen fila de hecho-fuente, restricción de honestidad ni rango en el validador. Además el prompt vivo (generate-ai.ts:186) ORDENA inventar jugadas y momentos de partido específicos: lo contrario exacto del closed-example guard. Con estos fixes (todos moviendo la decisión a Capa 1 o cerrando el concept-block) el esqueleto queda a prueba de balas.

- **[ALTA]** El propio Anexo A canoniza la alucinación que el sistema quiere prohibir: un voto singleton (Niño A, único voto I en Q12) se convierte vía score 3+1=4 en un momento notable narrado como 'sorprende con un gesto de equipo justo en la llegada'. Bajo respuesta al azar (p=0.25) un solo voto en una sola pregunta es ruido indistinguible (SD≈1.5); 'gesto de equipo' atribuye una MOTIVACIÓN social a ese ruido. El framing 'observacion_escena_ancla' no basta porque el ejemplo canónico ya añade el motivo. Es la brecha más clara: el documento de referencia enseña el error.  
  _dónde:_ Esqueleto §4.1c (contra_tendencia, +3 singleton) + §4.2 + Anexo A, Niño A  
  _fix:_ Dos cambios en Capa 1: (a) prohibir que un singleton alcance el umbral por sí solo — exigir score≥4 SIN contar el +3 de singleton, o sea requerir corroboración de salencia ≥2 además del rasgo minoritario; (b) el dato crudo del momento debe llevar un campo framing='solo_verbatim' que el closed-moment guard use para rebotar TODO verbo de atribución de motivo/rasgo ('gesto de equipo', 'costado', 'muestra que'). La IA solo puede decir 'en La Meta eligió: {opcion_texto verbatim}', jamás interpretar. Corregir el Anexo A para que no modele la interpretación.
- **[ALTA]** El band-guard (la defensa primaria contra alucinación de MAGNITUD) está especificado como 'validador léxico intensidad-vs-banda_veta' pero NUNCA define qué palabras se licencian en qué banda: es un stub inimplementable. Y el filtro que YA corre (DETERMINISTIC_PATTERNS, verificado en api/generate-ai.ts:334-346) solo captura 'siempre será / nunca podrá / nació para / está destinado / va a ser / será siempre' y 'niño+siempre/nunca/jamás'. NO captura 'muy', 'fuerte', 'marcadamente', 'predomina', 'sobresale', 'claramente el más', 'su mayor fortaleza', superlativos. Entonces 'es muy Conector' con I=secundario en banda ligera pasa TODOS los filtros. Estas son exactamente las palabras que el owner nombró ('fuerte','muy').  
  _dónde:_ Esqueleto §6.2 (band-guard '✱ construir') + api/generate-ai.ts:280-346 (DETERMINISTIC_PATTERNS real)  
  _fix:_ Definir en el doc una tabla-lexicón graduada por banda, enumerada, ej: equilibrio/ligera → solo 'se asoma/apenas/un poco más'; media → 'tiende a/suele/con un acompañante'; marcada/definida → 'claramente/sobresale' permitidos. Rebotar en banda ≤ media todo intensificador ('muy','fuerte','marcado','intenso','predomina','sobresale','su mayor','por encima de todo', superlativos -ísimo, 'el más'). El band-guard debe correr contra __NAME__ igual que findDeterministicHits. Sin esta tabla concreta el guard no existe.
- **[ALTA]** Los campos wow, corazon y grupoEspacio pasan por el modelo (verificado: AISections en generate-ai.ts:34-40,62-68; y el prompt línea 197 ordena mencionar la tendencia secundaria 'sutilmente en wow, combustible y corazon') pero NO tienen fila en el mapa de repercusión §5, ni hecho-fuente, ni restricción de honestidad, ni rango en el Contrato de Formato ni en el validador. Son superficies de generación libre sin ancla numérica ni banda: la IA puede meter un rasgo o magnitud ahí y ningún guard de banda/GT lo revisa contra una fuente declarada. corazon además realimenta el prompt como 'Lenguaje de Intención', así que una alucinación ahí siembra las secciones renderizadas.  
  _dónde:_ Esqueleto §5 ('corazon/grupoEspacio alimentan el prompt pero no son secciones') + Contrato (no existe sección wow/corazon) + generate-ai.ts:34-40,176-181,197  
  _fix:_ O bien volver wow/corazon/grupoEspacio 100% estáticos por arquetipo (no pasan por IA), o darles fila propia en §5 con hecho-fuente explícito (F11 + F2/F3), restricción de honestidad (honrar confianza_tier), rango en la Hoja de Contrato y paso obligatorio por band-guard + GT top-2. Ninguna cadena que la IA escriba puede quedar fuera del set de guards. Decidirlo explícitamente en el doc, no dejarlo implícito.
- **[ALTA]** El prompt VIVO (api/generate-ai.ts:186) ordena literalmente 'Incluye ejemplos específicos del deporte (jugadas, momentos del partido, situaciones propias de {deporte} en entrenamiento, partido y competencia)'. Esto es la instrucción opuesta exacta al closed-example guard que el esqueleto propone: induce activamente a inventar escenas/anécdotas no medidas (una jugada, un momento de partido) que jamás salieron de un voto. El esqueleto no marca que esta línea deba eliminarse.  
  _dónde:_ api/generate-ai.ts:186 vs Esqueleto §6.2 (closed-example guard) y §4 ('no puede trasladar la escena a un partido real')  
  _fix:_ El esqueleto debe listar explícitamente como paso de implementación: BORRAR la instrucción de 'incluye ejemplos específicos del deporte / jugadas / momentos del partido' del prompt. La única concreción permitida es la escena náutica de momentos.seleccionados[]. El deporte y la edad solo modulan vocabulario general, nunca autorizan narrar una jugada específica. Sin esto, los guards nuevos y el prompt se contradicen y gana el prompt.
- **[ALTA]** combustible se ancla al 'disfrute literal de Q3' (voto único de Q3, §5 fila 3). Si el voto de Q3 cae en un eje distinto del dominante, el informe afirma una MOTIVACIÓN del niño desde un solo voto que contradice el agregado. Ej: dominante S, pero en Q3 eligió 'Sentir que vamos rápido' (D) → combustible diría 'le gusta sentir que va rápido' = motivación D inventada desde 1 voto. Viola §1.2 (prohibido opción→afirmación).  
  _dónde:_ Esqueleto §5 fila 3 + Contrato §4(c)  
  _fix:_ Gatear en Capa 1: emitir booleano q3_alineado = (voto_Q3 ∈ {dominante} o {secundario si tier≤media}). Solo si q3_alineado la ficha licencia la frase de 'disfrute literal'; si no, combustible se apoya SOLO en el combustible de biblioteca del eje dominante (§2.1) y no cita Q3. La decisión de citar Q3 nunca la toma la IA.
- **[ALTA]** Con motor_source='vote_fallback' el motor (Dinámico/Rítmico/Sereno) se deriva de la dominancia de VOTOS DISC, no de ninguna medición de tempo. Sin embargo el chip muestra un motor como hecho y §2(c) del Contrato OBLIGA a integrar el motor 'en clave de ritmo' en TODO Retrato. Resultado: el informe afirma 'sostiene un pulso parejo' (claim de tempo) cuando el tempo jamás se midió — es circular desde el eje que ya ganó. Además motor_composite=null en fallback pero el display sigue mostrando una banda: §3(d) dice que fallback 'se apoya en el composite-band' que en vote_fallback no existe (contradicción).  
  _dónde:_ Esqueleto §1.3 (motor_source), §2.3, §5 fila 1-2, Contrato §3(d)  
  _fix:_ Capa 1 emite motor_narratable=false para vote_fallback (y opcionalmente time_fallback). Cuando es false: (a) el paso 2 del Retrato (integrar motor) se OMITE, no se fuerza; (b) el chip muestra el motor con marca de baja confianza explícita; (c) motorDesc no puede afirmar un claim de cadencia/tempo, solo lenguaje mínimo con hedge o se degrada al patrón de decisión. Resolver la contradicción del composite-band nulo en vote_fallback.
- **[ALTA]** ecos generaliza la energía del eje 'fuera del deporte' (§10 Contrato / §5 fila 9): es una licencia explícita para abandonar el dominio medido y afirmar conducta en contextos nunca observados (casa, escuela). 'en abstracto/probabilístico' no impide que la IA nombre situaciones concretas fuera de la cancha. checklist y reseteo son consejo generado libre cuyo contenido imperativo concreto no es un concept-block de biblioteca (solo tienen fallback estático). Un consejo puede implicar un rasgo ('dale tiempo porque le cuesta arrancar' = déficit encubierto).  
  _dónde:_ Esqueleto §5 filas 7,8,9,10 + Contrato §8,§9,§10,§11  
  _fix:_ Acotar estas secciones a REESCRITURA de una semilla estática por arquetipo (como palabrasPuente), no generación libre: la semilla ES la biblioteca. ecos debe quedarse en el nivel de la energía del eje en abstracto, con prohibición dura (closed-example guard) de nombrar escenarios concretos fuera del deporte. checklist/reseteo pasan por band-guard + prohibited para atrapar framing de déficit.
- **[MEDIA]** Cuando tiebreaker_eje_aplicado=true, el eje DOMINANTE del niño (y por tanto arquetipo_id/label, el titular del hero) se elige usando dispersión del GRUPO, no las respuestas del propio niño. Aun con confianza capada a 'mezcla', el hero sigue emitiendo un ÚNICO arquetipo_label como identidad del niño, derivado de datos de otros niños. Eso es atribuir un rasgo individual desde contexto externo.  
  _dónde:_ Esqueleto §3 pseudocódigo (tiebreaker por dispersión) + §2.2 topes de degradación + Contrato §2  
  _fix:_ Cuando tiebreaker_eje_aplicado=true, Capa 1 debe emitir arquetipo DUAL (ambos co-líderes) o suprimir el arquetipo_label único del titular, forzando el hero a hablar de dos energías igualmente plausibles. No basta con bajar el tier: el label único no puede encabezar cuando el desempate vino del grupo.
- **[MEDIA]** coherencia_presion (F10b) es true si ≥1 de las 3 respuestas de tormenta fue al dominante, y alimenta 'una frase de estabilidad' ('sostiene su esencia bajo presión'). Un solo voto de tres (1/3) es débil; afirmar estabilidad bajo presión desde 1/3 es un overclaim de magnitud no derivable de un umbral serio.  
  _dónde:_ Esqueleto §4.1d + §5 fila 10  
  _fix:_ Subir el umbral en Capa 1 a ≥2 de 3 respuestas de tormenta al dominante para licenciar la frase de estabilidad; con 1/3 el booleano no habilita ninguna afirmación de estabilidad (solo modula tono levemente o se omite).
- **[MEDIA]** El ground-truth extendido a top-2 usa un whitelist fijo {dominante, secundario} sin ser forma-aware. En forma=disperso (ej 4-3-3-2) o duo, existe un tercer eje con el MISMO conteo que el 'secundario' (n_ejes_fuertes≥3), pero GT rebotaría cualquier mención de ese tercer eje co-igual — justo cuando la narrativa de disperso pide 'versatilidad/dos energías'. O bloquea la amplitud honesta, o si se afloja deja pasar ruido. Contradicción entre el guard y forma_perfil.  
  _dónde:_ Esqueleto §2.2 (forma disperso/duo) vs §6.2/§6.4 (GT top-2)  
  _fix:_ Hacer el whitelist de GT forma-aware: en duo/disperso incluir TODOS los ejes cuyo conteo esté dentro de la banda de empate (p.ej. ≥ second_count), no un top-2 fijo. Capa 1 emite el set de ejes citables (ejes_narrables[]) y GT valida contra ese set, no contra {dominante,secundario} hardcodeado.
- **[MEDIA]** El framing de tormenta_divergente es 'bajo presión, tendió a {eje}' (§4.1b). 'bajo presión' se lee como un estado real medido del niño, pero la presión es solo la etiqueta de salencia de una escena de cuestionario (Tormenta=3); nunca se midió que el niño estuviera bajo presión. Afirma un estado no observado.  
  _dónde:_ Esqueleto §4.1b (framing) + §3 salencia  
  _fix:_ El framing debe anclar a la escena ficticia, no al estado: 'en la escena de la tormenta eligió {texto}', nunca 'bajo presión tendió a'. Alinear con la regla §4 de no trasladar la escena a la realidad. Fijar la cadena de framing en Capa 1 como literal cerrado.
- **[MEDIA]** Con motor_confianza baja o 'en transición' (composite en 66, borde de umbral), el chip y motorDesc siguen NOMBRANDO una categoría única de motor como hecho ('Rítmico'), presentando un empate de moneda al aire como certeza. El esqueleto solo hedgea el CONTRASTE de sub-motores, no el nombre de la banda misma. Además los concept-blocks de motor_divergencia contienen magnitud ('brilla al sostener la cadencia') que se narra aunque motor_confianza sea baja.  
  _dónde:_ Esqueleto §2.3 (motor_confianza) + §5 fila 1,2 + Contrato §2(d),§3(c)  
  _fix:_ En motor_confianza baja/transición: (a) el chip marca incertidumbre visible (p.ej. 'Rítmico–Dinámico' o marcador de transición) y motorDesc hedgea el NOMBRE de la banda, no solo los sub-motores; (b) los patrones de motor_divergencia con palabras de magnitud ('brilla') solo se narran a partir de motor_confianza ≥ media; en baja se cae al composite-band con hedge. Gatear la narración del patrón por confianza en Capa 1.

## Lente: COBERTURA (mapa respuesta→voto de las 12 preguntas · fuente determinista por sección · secciones libradas a invención de la IA) (CON_HUECOS)

El mapa respuesta→voto es sólido y exacto: las 12 preguntas existen en onboardingDataI18n.ts con un voto por eje D/I/S/C cada una, y la tabla §3 coincide con el código (sólo una comilla mal ubicada en Q6, trivial). Toda sección RENDERIZADA del informe (resumenPerfil/bienvenida, motorDesc, combustible, patrón de decisión, tendencia, guía, checklist, ecos, reseteo, palabras puente/ruido, AxisBars, motor-chip) tiene fila con fuente determinista en el mapa de repercusión §5. Los huecos de cobertura son cinco y concretos: (1) `wow` y `corazon` son generados por la IA pero no se renderizan en ningún lado ni tienen fila en el validador ni fuente en §5, y el propio doc se contradice sobre ellos; (2) los nombres de escena náutica de la ficha ('La Tormenta') no existen en los datos (el title es 'El Momento del Caos'), por lo que falta la tabla determinista Q→escena y el closed-moment guard no es implementable de forma exacta; (3) 'disfrute literal de Q3' que exige el combustible no tiene ningún campo portador en la ficha §1.3; (4) `patron_decision` se recomputa client-side en ReportPage:473 de forma independiente a la ficha F8 que chequea el validador, creando divergencia; (5) las listas estáticas guia/palabrasPuente/palabrasRuido tienen una ruta de override IA sin candado en ReportPage:464-466. Ninguna sección visible queda librada a invención pura, pero dos campos generados (wow/corazon) sí escapan a toda gobernanza y tres fuentes deterministas están declaradas sin portador o con doble cómputo.

- **[ALTA]** Los campos `wow` y `corazon` SÍ los genera la IA (JSON schema en generate-ai.ts líneas 143/146; interfaz real AISections 62-69 los incluye; se asignan en ReportPage 457/459), pero NO se renderizan en ninguna parte del informe (no hay JSX que pinte report.wow/report.corazon ni en ReportPage ni en el email) y NO tienen fila en la HOJA DE CONTRATO ni fuente en el mapa de repercusión §5. El §5 los declara 'IA reescribe' y a la vez dice que corazon 'no es sección propia en el render actual': contradicción interna. Resultado: dos campos librados a invención de la IA, sin fuente determinista y sin validador (presencia/rango/forma), que consumen tokens y presupuesto de retry pero nadie los ve ni los gobierna. La garantía 'ninguna sección de IA carece de hecho-fuente' es falsa tal como está escrita.  
  _dónde:_ Esqueleto §5 (lista 'Campos que la IA reescribe') + Contrato HOJA DE CONTRATO; código: api/generate-ai.ts:62-69,143-146 y src/pages/ReportPage.tsx:457-459  
  _fix:_ Decidir explícitamente: (a) eliminar `wow` y `corazon` de AISections + del JSON schema del prompt + de las líneas 457/459 de ReportPage (son texto muerto hoy), O (b) si se conservan, agregarles fila en el mapa de repercusión §5 (hecho-fuente concreto), fila en la HOJA DE CONTRATO con [min,max] frases/palabras, y render real. Hasta resolverlo, quitar `wow`/`corazon` de la lista 'Campos que la IA reescribe' de §5 para que no mienta.
- **[ALTA]** La ficha §1.3 y §4 usan nombres de escena náutica ('La Tormenta', 'Puerto', 'Meta') como `momentos.seleccionados[].escena`, pero esos strings NO existen en los datos: cada Question sólo tiene `number`, `title` (Q5 = 'El Momento del Caos', NO 'La Tormenta') y `options[{label,axis}]`. No hay tabla determinista Q→escena en ningún lado. El closed-moment/closed-example guard (§6.2) debe hacer whitelist por 'la etiqueta náutica exacta', pero la etiqueta que la IA verá/parafraseará ('la tormenta') no coincide con el `title` real ('El Momento del Caos'), así que el guard no se puede construir de forma determinista: o bien deja pasar 'tormenta' sin validar contra nada, o bien rechaza el título real. Fuente indefinida = guard no implementable a prueba de balas.  
  _dónde:_ Esqueleto §3 (Salencia de escena) y §4; ficha §1.3 campo momentos.escena; datos reales en src/lib/onboardingDataI18n.ts:198+ (title != escena)  
  _fix:_ Agregar al esqueleto una tabla canónica Q→{escena_label, salience} (Q1-Q2 Puerto, Q3-Q4 Mar abierto, Q5-Q7 La Tormenta, Q8-Q10 Calma, Q11 Horizonte, Q12 Isla/Meta) y hacer que buildEvidenceFicha la use como única fuente de `escena`. El closed-moment guard debe tokenizar contra la UNIÓN de {escena_label canónico} ∪ {title real de cada Q}, no sólo uno, para no false-passear ni false-rejectear.
- **[MEDIA]** El mapa de repercusión §5 fila 3 obliga a que `combustible` esté 'atado al disfrute literal de Q3', pero la ficha §1.3 NO tiene ningún campo que cargue la respuesta elegida en Q3 (F2 sólo guarda eje_dominante/top_count; no hay portador del texto/eje de Q3). Sin ese campo, 'disfrute literal de Q3' no tiene fuente determinista: la IA tendría que recibir Q3 por fuera de la ficha o inventarlo, violando la regla de cero-invención.  
  _dónde:_ Esqueleto §5 fila 3 vs ficha §1.3 (no existe campo Q3)  
  _fix:_ Agregar a la ficha §1.3 un campo explícito, p. ej. `disfrute_q3: { eje_opcion, opcion_texto }`, poblado por buildEvidenceFicha desde answers[2]; O eliminar la cláusula 'literal de Q3' de §5 y anclar combustible sólo al eje dominante (§2.1). Sin una de las dos, la restricción es incoherente.
- **[MEDIA]** `patron_decision` tiene doble cómputo divergente. La ficha (F8) lo produce server-side, y el validador exige la equivalencia estricta 'presente ⟺ patron_decision != null'. Pero el render lo recomputa de forma independiente en ReportPage.tsx:473 con `classifyDecisionPattern(session.answers)` y renderiza según ESE valor (gate en línea 642), ignorando la ficha. Si los dos cálculos usan umbrales distintos de 'tiempos válidos', el validador puede marcar OK contra la ficha mientras el usuario ve (o no ve) una sección distinta. La única omisión sancionada del informe queda sin single-source-of-truth.  
  _dónde:_ src/pages/ReportPage.tsx:473 y :642 vs ficha F8 / Contrato §5 (equivalencia estricta)  
  _fix:_ Hacer que el render consuma `ficha.patron_decision` (F8) en vez de recomputar en ReportPage:473, o mover classifyDecisionPattern a un único punto (Capa 1) cuyo resultado alimente tanto la ficha como el render. El validador y el render deben leer el mismo campo.
- **[MEDIA]** El §5 declara `guia`, `palabrasPuente` y `palabrasRuido` como 'Estático por arquetipo, la IA no las genera'. Pero ReportPage.tsx:464-466 tiene rutas vivas `if (aiSections.guia) report.guia = aiSections.guia` (idem palabrasPuente/Ruido) que dejarían a la IA SOBRESCRIBIR las listas estáticas si el prompt/JSON llegara a devolver esas claves. Hoy la interfaz de salida AISections (62-69) no las incluye, así que el estático gana por accidente, no por candado. La garantía determinista de esas 3 secciones depende de que nadie agregue esas claves al prompt.  
  _dónde:_ src/pages/ReportPage.tsx:464-466 vs Esqueleto §5 filas 5 y 7  
  _fix:_ Blindar el merge: no permitir que claves de aiSections sobrescriban guia/palabrasPuente/palabrasRuido (eliminar las asignaciones 464-466 o gatearlas tras un allowlist), y tipar AISections para excluir explícitamente esas claves. Así 'estático' es una invariante estructural, no una coincidencia.

---

# Parte E — Síntesis, decisiones del owner y plan de implementación

Verifiqué el código: las cinco lentes son correctas en lo que afirman, pero **entre las cinco se les escapó la dimensión que más rompe en producción (i18n) y varias decisiones de producto quedaron sin dueño**. Confirmé en el repo lo load-bearing. Veredicto: la spec NO está lista para código todavía; le faltan ~4 cierres duros, 1 dimensión entera y 5 decisiones de owner.

---

# PARTE 1 — HUECOS RESIDUALES PRIORIZADOS

## P0 — Rompen en producción (bloquean el build)

**1. [NUEVO, ninguna lente lo vio] Todo el aparato es monolingüe; el producto es es/en/pt.**
Confirmado: `onboardingDataI18n.ts` es `Record<Lang, Question[]>` con es/en/pt, y las escenas se llaman `La Tormenta / The Storm / A Tempestade`. Pero la spec (biblioteca §2, WRITING_RULES, PROHIBITED_WORDS, DETERMINISTIC_PATTERNS, **el band-guard de intensificadores**, **el closed-moment whitelist de etiquetas náuticas**, TENDENCIA_LABELS, concept-blocks §2.1/§2.3/§2.5, semillas por arquetipo) está escrita solo en español. Un band-guard que rebota "muy/fuerte/brilla" no existe en inglés/portugués; un whitelist de escena que matchea "La Tormenta" deja pasar cualquier cosa en pt. **Fix:** declarar en la spec que *cada* lexicón, whitelist y biblioteca de conceptos es `Record<Lang, …>`, y que buildEvidenceFicha recibe `lang`. Sin esto, dos tercios de los informes salen sin guardas.

**2. [Confirmado en código, línea 186] El prompt vivo ORDENA inventar lo que el guard nuevo prohíbe.**
`generate-ai.ts:186` literal: *"Incluye ejemplos específicos del deporte (jugadas, momentos del partido…)"*. Es la instrucción exactamente opuesta al closed-example guard. Si se construyen los guards sin borrar esta línea, el pipeline entra en retry perpetuo → o siempre-fallback o latencia/costo disparados. **Fix:** borrar la instrucción de ejemplos deportivos; reescribir el prompt a "traductor de estilo, no autor"; deporte/edad solo modulan vocabulario, jamás autorizan narrar una jugada.

**3. [NUEVO] El prompt vivo pide `resumenPerfil` de 3–4 frases; el contrato exige 4–6 / 55–130 palabras.**
`generate-ai.ts:142` y `:189` dicen "3-4 sentences". El contrato de formato dice 4–6. La sección corazón nace fuera de rango por diseño del propio prompt → el validador la marcaría OUT_OF_RANGE en el caso feliz, no solo en fallback. **Fix:** alinear el prompt al contrato (4–6 / 55–130) antes de escribir el validador.

**4. [Format lens, elevado a P0] El fallback del corazón está por debajo del rango del corazón.**
`bienvenida`-semilla = 2–4 frases; Retrato exige 4–6. Toda degradación de la sección más importante cae OUT_OF_RANGE → termina en padding/truncado de texto genérico. **Fix (regla general):** *todo fallback estático debe estar pre-validado dentro del `[min,max]` de su sección*. Crear `resumenPerfil-semilla` (no reusar `bienvenida`) por arquetipo × 3 langs, cada uno dentro de rango, con test de build que corra el validador sobre los 12×3 fallbacks.

## P1 — Deben cerrarse antes de codear (mecánicos, con fix claro)

**5. [Ipsative + confirmado] `forma_perfil` es no-determinista Y el propio Anexo A se autocontradice.**
Niño A (`D6 C3 S2 I1`, B=3) satisface *a la vez* `pico` (top≥6 ∧ B≥3) y `lider_con_sombra` (top≥5 ∧ B∈{2,3}); el Anexo A lo llama `lider_con_sombra` sin regla. ~10% de vectores caen en doble forma. **Fix:** cascada mutuamente excluyente, del más conservador al menos: `disperso` → `duo` → `pico` (subir su corte a **B≥4** para separarlo limpio) → `lider_con_sombra` (B∈{2,3}) → resto. **Corregir el Anexo A** para que no modele la ambigüedad. Test que recorra las 455 composiciones y verifique exactamente una forma por vector.

**6. [Cobertura + confirmado] Falta la tabla canónica Q→escena, y hay DOS sistemas de nombres.**
Confirmado: el `title` de Q5 es "El Momento del Caos", pero la ficha cita `"escena":"La Tormenta"` (que es el título del *story-slide*, no de la pregunta). El closed-moment guard no es implementable sin una tabla explícita. **Fix:** tabla canónica `Q → {escena_label[lang], salience}` mapeando a los rótulos de story-slide por idioma (Q1-2 Puerto, Q3-4 Mar abierto, Q5-7 La Tormenta, Q8-10 Calma, Q11 Horizonte, Q12 Isla/Meta), única fuente de `escena`. El guard tokeniza contra el whitelist cerrado de esos rótulos (mayúscula/verbatim), ignora usos metafóricos en minúscula.

**7. [Anti-hall, alta] El Anexo A canoniza convertir ruido en motivación atribuida.**
Niño A: voto singleton I (p=0.25, ruido puro) → score 3+1=4 → momento narrado como "sorprende con un gesto de equipo". El framing `observacion_escena_ancla` no impide que el ejemplo añada el motivo. **Fix:** (a) un singleton no puede alcanzar el umbral por sí solo — exigir corroboración de salencia ≥2 *además* del rasgo minoritario (no contar el +3 aislado); (b) el momento viaja como `solo_verbatim`: la IA solo puede decir *"en La Meta eligió: {opcion_texto}"*, jamás interpretar; el guard rebota todo verbo de atribución de motivo. Corregir el Anexo A.

**8. [Cobertura + confirmado] `combustible` cita "disfrute literal de Q3" sin campo portador ni chequeo de alineación.**
La ficha §1.3 no tiene campo Q3. Y si el voto Q3 cae en un eje distinto del dominante, se afirma una motivación desde 1 voto (viola §1.2). **Fix:** ficha emite `disfrute_q3:{eje_opcion, opcion_texto}` + booleano `q3_alineado = voto_Q3 ∈ {dominante} ∪ {secundario si tier≤media}`. Solo si `q3_alineado` se licencia la frase; si no, combustible se apoya solo en la biblioteca del eje dominante.

**9. [Cobertura/Anti-hall + confirmado líneas 457-466, 474] Doble cómputo y overrides sin candado en el render.**
Confirmado: `ReportPage.tsx:474` recomputa `classifyDecisionPattern(session.answers)` ignorando la ficha F8 que valida el contrato; y `:464-466` deja que la IA sobrescriba `guia/palabrasPuente/palabrasRuido` si el JSON trae esas claves. **Fix:** el render consume `ficha.patron_decision` (single source); tipar `AISections` para excluir las 3 listas estáticas y eliminar/gatear las asignaciones 464-466.

**10. [Anti-hall] `motor` en `vote_fallback` es circular; `motor_composite` null contradice §3(d).**
Con `vote_fallback` el motor sale de la dominancia de votos, pero el chip lo muestra como hecho y el contrato obliga a integrarlo "en clave de ritmo" → el informe afirma tempo nunca medido. **Fix:** ficha emite `motor_narratable=false` en fallback; el paso 2 del Retrato se OMITE (no se fuerza), el chip marca baja confianza, `motorDesc` no afirma cadencia. Resolver el `composite-band` nulo en vote_fallback (no existe).

**11. [Anti-hall + Lenguaje] El band-guard es un stub y los seeds estáticos llegan verbatim sin hedge.**
`DETERMINISTIC_PATTERNS` (confirmado, líneas 334-346) NO captura "muy/fuerte/predomina/sobresale/brilla/su mayor". Los bloques §2.5 (`constante` = "de principio a fin") y §2.3 (`brilla`) se sirven **sin pasar por IA** → nadie los suaviza. **Fix:** (a) tabla-lexicón de intensidad graduada por banda (equilibrio/ligera → solo "se asoma/apenas"; media → "tiende a/suele"; marcada+ → "claramente"), enumerada y trilingüe, corriendo contra `__NAME__`; agregar "brilla" y superlativos a PROHIBITED_WORDS. (b) **Hedgear en la biblioteca** todos los seeds §2.3/§2.5 (no dependen de reescritura): "brilla"→"suele sentirse cómodo", "de principio a fin"→"a lo largo del juego", reencuadrar "excelencia/calidad" del eje C hacia disfrute del proceso.

**12. [Anti-hall/Ipsative] El Hero muestra arquetipo único aun en mezcla/empate.**
En `equilibrio/ligera/duo` el título visual afirma una dominancia que la prosa niega, y un voto voltea el rótulo. Además `tiebreaker_eje_aplicado` solo se marca con contexto de grupo, no en un B=0 suelto. **Fix:** cuando `top==second` → setear `tiebreaker=true` y `tier=mezcla` siempre; en `equilibrio/ligera/duo` el Hero renderiza rótulo de combinación ("Sostén + Estratega, en equilibrio"), no arquetipo_id único.

**13. [Format] Los dos sistemas de retry (guard global full-JSON vs validador por-sección) no están reconciliados.**
Una reescritura full-JSON puede re-romper rangos ya OK. **Fix:** fixpoint único y acotado: generar → guards léxicos (1 retry full-JSON) → validador presencia/rango/forma por sección → re-correr guards SOLO sobre secciones tocadas → si sigue ≠OK, degradar a estático/clamp. Clamp en **fronteras de frase** + re-validar una vez.

**Menores confirmados (fold-in):** voseo "reescribí"→"reescribe" en el prompt de reparación (hook lo marca); motor-chip validator debe incluir **"Observador"** (C+Lento, o Tomás falla MALFORMED); GT top-2 debe ser **forma-aware** (`ejes_narrables[]`, no {dom,sec} fijo, para no bloquear la versatilidad de `disperso`); `coherencia_presion` subir umbral a ≥2/3; conteo sobre `__NAME__` descuenta el largo del nombre real; palabras puente item-count varía 4 vs 6 entre informes del mismo arquetipo.

## P2 — DECISIONES AMBIGUAS que requieren llamada del owner (no las puede cerrar el implementador)

1. **Sección 5 (patrón de decisión): omisión limpia vs siempre-presente-con-null-honesto.** La spec elige omitir; el owner pidió "todos iguales en estructura". Son incompatibles. Opción (b) —bloque siempre presente con texto estático honesto "No reunimos suficientes tiempos…"— cumple mejor el pedido del owner sin violar honestidad. **Owner decide.**
2. **`wow` / `corazon` / `grupoEspacio`:** confirmado que se generan (líneas 34-41, 176-184, 197) y consumen tokens + el retry, pero no tienen fila en §5 ni en la Hoja de Contrato ni pasan por band-guard/GT. **Decisión: borrarlos (texto muerto) o gobernarlos** (fila en §5 + rango + guards). Hoy son superficie de invención libre sin ancla.
3. **Palabras puente: swap (N constante por arquetipo) vs append (N variable).** El contrato dice "idéntico por arquetipo" y a la vez "extras se anexan": contradicción. Si el owner quiere estructura literal idéntica, los extras reemplazan, no anexan.
4. **Registro de lenguaje "alta/muy_alta" antes de la calibración de Anexo B.** Monte Carlo: P(B∈4-5)=6.3% → "dominante claro" etiqueta 1 de cada 16 al azar. **Decisión: gatear los tiers detrás de los percentiles reales, o shippear conservador** (prohibir "dominante claro" bajo B≥6) hasta correr la simulación.
5. **Demo/abridged report:** ¿se generan (y guardan token) las secciones locked que el demo nunca muestra? ¿Corren los guards en demo? Sin definir.

**No cubierto por ninguna lente y sin resolver:** ¿dónde se **persiste** la ficha (o sus insumos: métricas de juego + tiempos de respuesta) por perfilamiento? Si al regenerar (grant `full_access`) se recomputa desde `answers` pero los tiempos/métricas de juego no están guardados, `motor_source` y `patron_decision` pueden **cambiar entre el informe original y el regenerado** → no-determinismo temporal. Hay que confirmar que `perfilamientos` guarda tiempos y sub-puntajes de juego, o guardar la ficha serializada.

---

# PARTE 2 — LISTA CONCRETA DE TRABAJO DE IMPLEMENTACIÓN

**Capa 1 — nueva lógica determinista**
- `src/lib/evidenceFicha.ts` (NUEVO): `buildEvidenceFicha(answers, gameMetrics, tiempos, lang)` → emite el JSON §1.3. Reúne: cascada `forma_perfil` excluyente (#5), flags `tiebreaker`/`tier=mezcla` en todo `top==second` (#12), `second_count==third_count` → flag `secundario_empatado`, `disfrute_q3` + `q3_alineado` (#8), `ejes_narrables[]` forma-aware para GT, `motor_narratable` (#10), `coherencia_presion≥2/3`, selección de momentos §4 con la corrección singleton (#7).
- `src/lib/escenaMap.ts` (NUEVO): tabla canónica `Q → {escena_label[es/en/pt], salience}` (#6). Fuente única para `momentos.escena` y el whitelist del guard.
- `src/lib/profileResolver.ts`: exponer votos/B/secundario/desempates hacia la ficha; NO recomputar en el render.
- `src/lib/argosEngine.ts`: `motor_confianza`, `submotores=null` + `motor_narratable=false` en fallback, `composite-band` sin nulo circular.
- `src/lib/decisionPattern.ts`: única fuente de `patron_decision`; su salida alimenta la ficha (no ReportPage).

**Biblioteca / seeds (por arquetipo × 3 langs, pre-validados en rango)**
- Concept-blocks §2.1/§2.3/§2.5 hedgeados en la biblioteca (#11), `resumenPerfil-semilla` dentro de 4–6 frases (#4), TENDENCIA_LABELS, palabras puente/ruido base+extra (con la decisión swap/append), guía base, checklist/reseteo/ecos/combustible/motorDesc semillas de fallback. Reword "excelencia/calidad" (C) y "brilla".

**Guards nuevos (deterministas, sin IA, trilingües) — en `api/generate-ai.ts` o `api/reportGuards.ts` inline**
- `bandGuard` (tabla-lexicón por banda × lang, #11), `groundTruthAxis` extendido a `ejes_narrables[]` (#P1-menores), `closedExample`/`closedMoment` guard (whitelist de `escenaMap` + `opcion_texto` verbatim, #6/#7).
- **Validador de formato §0**: contador frases/palabras/ítems + Hoja de Contrato lookup + bucle de reparación por sección + degradación IA→estático→clamp-en-frontera-de-frase + re-validar (#13). Sub-rangos de fallback completos (Motor 1–2 frases/15–45 pal seleccionado por `motor_source`).
- Reconciliar el pipeline en un fixpoint acotado (#13). Ajuste de conteo `__NAME__`. Set motor-chip += "Observador".

**`api/generate-ai.ts` — cambios al prompt existente**
- Borrar instrucción de ejemplos deportivos línea 186 (#2); cambiar `resumenPerfil` 3-4→4-6/55-130 (#3); inyectar `ficha+esqueleto+WRITING_RULES`; restringir Capa 2 a whitelist; voseo "reescribí"→"reescribe"; decidir wow/corazon/grupoEspacio (borrar del schema/interface/prompt o gobernar, #P2-2).

**`src/pages/ReportPage.tsx`**
- Consumir `ficha.patron_decision` (quitar recompute 474); quitar/candar overrides 464-466 de listas estáticas (#9); Hero con rótulo dual en mezcla/duo/equilibrio (#12); quitar o renderizar-y-gobernar wow/corazon/grupoEspacio.

**Datos / infra**
- Migración Supabase: persistir la ficha (o insumos: game metrics + tiempos) por `perfilamiento` para regeneración determinista; columnas de telemetría en `ai_events` (`guard_type`, verdicto de validador, votos/B/tier/motor_source/motor_confianza para Anexo B).
- `scripts/montecarlo-bandas.mjs` (NUEVO): simulación multinomial(12,0.25) → percentiles P(B≥k) y por forma → config; gatear tiers (#P2-4). Corregir §1.2 (usar distribución del máximo/brecha, no la SD marginal).

**Tests**
- 455-composiciones → una sola forma por vector; 12×3 fallbacks estáticos dentro de rango; unit de cada guard; **golden fixtures** de los 6 worked-examples (Clara/Mateo/Lucía/Tomás/Sofía/Benja) como regresión del pipeline completo.

**Orden sugerido:** P0 #2/#3 (destrabar el prompt) → escenaMap + ficha (#6/#8/#7/#5/#12/#10) → biblioteca hedgeada + semillas en rango (#4/#11) → guards + validador (#13) → render (#9) → i18n de todo el lexicón (#1, transversal, no dejar para el final) → telemetría/persistencia → Monte Carlo/tiers. **Bloqueante real: #1 (i18n) atraviesa todas las piezas; si no se diseña trilingüe desde el inicio hay que reescribir guards y biblioteca dos veces.**
