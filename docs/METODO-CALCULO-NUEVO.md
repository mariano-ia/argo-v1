# Método Argo — CÁLCULO DEL PERFIL Y EL INFORME (especificación v3, corregida)

> Documento autoritativo del método reformado, **ronda 3**. Parte de la v2 (ronda 2: 12 correcciones del panel + líneas rojas de constructos + resolución del naming) y aplica encima el **balde A + balde B + decisión motor (M1) + decisión veta opuesta (O1) + cambios menores (X1-X4)** de la ronda 3. Estructura numerada idéntica (secciones 0-15) para comparar manzana con manzana; se preserva todo lo que la ronda 3 no toca. Es la referencia de implementación y de re-revisión (reemplaza la v2, conservada en git).
>
> **Principio que ordena todo (eje rector, recalibrado en la ronda 3 — A9):** la improbabilidad de un patrón bajo el azar autoriza SOLO a afirmar que **"esto no parece ruido / no es azar"**. NO autoriza a **intensificar** el lenguaje sobre el niño. El techo de intensidad lo fija la **confianza del instrumento** (media/baja), no la rareza del patrón: por muy improbable que sea una composición, un instrumento de confianza media no habilita lenguaje fuerte. La separación-del-azar decide *si* se dice algo; la confianza del instrumento decide *con cuánta fuerza*. Todo se calibra contra el nulo por **enumeración exacta de las 455 composiciones** de 12 votos en 4 ejes (no Monte Carlo).
>
> **Naturaleza del método (para revisores):** Argo NO es un test validado. Toma constructos públicos (DISC como puerta de entrada; funciones ejecutivas y SDT en el roadmap), los adapta y los mide por juego. Claims permitidos: "anclado en la teoría, es una fotografía del presente, no es una medida clínica". Prohibidos: "validado", "diagnóstico", "predice el rendimiento". La **confianza techo del instrumento es media** (solo tempo de decisión/reacción y costo de reacomodo llegan a media; todo lo demás es baja).

---

## 0. Arquitectura de dos capas

- **Capa 1 (determinista, sin IA).** De las 12 respuestas + métricas de mini-juego + tiempos + la ficha del perfilamiento anterior, computa una **ficha de evidencia** (hechos con magnitudes) y ensambla el **esqueleto**: qué bloque de concepto pre-aprobado aplica y en qué sección cae.
- **Capa 2 (IA, acotada).** Recibe `ficha + esqueleto + manual de estilo + palabras prohibidas` y SOLO reescribe en prosa cálida. No introduce rasgo, magnitud, eje, veta, motor, escena ni ejemplo que no esté en el esqueleto.
- **Correctitud ipsativa:** una respuesta suelta es UN VOTO (débil). Toda afirmación nace del agregado, nunca del patrón "eligió A → afirmá X".
- **Eje rector operativo (A9):** el nivel de improbabilidad-bajo-el-azar solo abre la puerta a *afirmar que no es ruido*; el registro de intensidad (tentativo / con claridad / fuerte) lo gobierna por separado la banda + la confianza del instrumento (§3, §9). Nunca se sube el tono porque un patrón sea raro.
- **Separación de fuentes (C9):** el **nombre** (eje primario + eje secundario/veta) sale exclusivamente de las **elecciones** (votos DISC). Los **insights de los mini-juegos** (tempo de decisión, reacomodo, etc.) salen de los **mini-juegos** (velocidad) y viven solo en el contenido del informe, nunca en el nombre. Las dos fuentes están desacopladas por diseño: el nombre son **dos ejes** (ambos de elecciones), así que ya no puede aparecer una palabra de tempo en la denominación ni un nombre contradictorio del tipo "Impulsor Sereno". Regla dura: **el eje DISC no se deduce de la velocidad**.

---

## 1. Perfil = eje primario + eje secundario (ambos desde las elecciones)

- **12 preguntas forzadas, 1 voto por eje.** Dominante = más votado; **veta = 2.º más votado**. Se conserva el **vector completo** de votos (D/I/S/C), no solo el ganador.
- Derivados: `B = votos(1.º) − votos(2.º)` (gatea el **primario**); **`B2 = second_count − third_count`** (gatea la **veta**, NUEVO A1); `top_count`, `second_count`, `third_count`; flags de empate (`secundario_empatado` si 2.º==3.º).
- **El nombre es un blend DISC estándar: eje dominante + eje secundario (C9/decisión G del owner).** El perfil canónico es **`[Eje primario] con veta [Eje secundario]`** (p. ej. "Impulsor con veta Estratega"). Como el dominante tiene 4 opciones y la veta es **uno de los otros 3 ejes**, hay 4 × 3 = **12 perfiles** y ni uno más (no 132: la veta es un eje, no un arquetipo entero). La veta es un **eje** (Impulsor/Conector/Sostenedor/Estratega), no una palabra de tempo. Es exactamente cómo DISC describe los "blends": estándar y defendible. Puntos críticos:
  - **La veta NO es el motor.** Las palabras de tempo (Dinámico/Rítmico/Sereno/Observador) **salen del nombre por completo**: no nombran perfiles ni vetas. Toda señal de velocidad vive solo en el contenido del informe (§2, §8) y nunca en la denominación. Esto elimina de raíz la contradicción C9: el 2.º término del nombre es siempre otro eje, medido con la misma escala de elecciones que el 1.º.
  - **Derivación de la veta (definida acá, no un stub):** veta = eje del `second_count`. Si `secundario_empatado`, no se cierra una veta única (se presenta el par). Nada de esto toca los mini-juegos.
  - **La veta se gatea por su propio estadístico `B2`, NO por `B` (A1).** `B` gatea SOLO el primario (§3); la confianza de la veta la fija la separación 2.º↔3.º:
    - **`B2 ≤ 1` → SIN veta** (71.40% del nulo). El perfil se lee casi como **primario puro**: "asoma una segunda inclinación, sin margen claro". El nombre no incorpora veta.
    - **`B2 = 2-3` → veta TENTATIVA** (26.49%): "con algo de X" (lenguaje tentativo; no se cierra un blend afirmado).
    - **`B2 ≥ 4` → veta AFIRMADA** (2.11%): entra al nombre como blend `[primario] con veta [secundario]`.
  - **Consecuencia honesta declarada:** el nombre-blend completo (veta afirmada en el nombre) es **minoría, ~2% del nulo** (`P(B2≥4)=2.11%`). La **mayoría de los informes lideran con un primario casi puro**, sin veta en el nombre. Esto ya no es un stub: es la lectura calibrada y honesta de lo que 12 votos sostienen.
  - **Ejes opuestos (O1, §3.2):** si el eje de la veta es el **diagonal opuesto** del primario (D↔S, I↔C), la veta **no entra al nombre aunque `B2≥4`**; se resuelve en el cuerpo del informe (ver §3.2).
  - **Requiere reescribir `docs/archetype-naming.md`:** hoy define los 12 como eje × tempo. Debe pasar a eje × eje secundario. Es un cambio de branding downstream de esta spec (lista de impacto de interfaces, no en esta corrida). **No agrega filas por ejes opuestos:** esos casos se resuelven solo en la capa de copy (§3.2/O1), con una nota/apéndice en ese doc.

---

## 2. Insights de los mini-juegos (tempo psicomotor) — fuera del nombre, per-child, lectura normativa por edad

**No existe "el Motor" como un tipo ni una etiqueta.** Los mini-juegos no clasifican al chico en una categoría; producen un puñado de **insights medidos, propios de cada niño** (tempo de decisión, tempo de reacción, cómo se reacomoda ante un cambio de regla) que solo alimentan contenido del informe (§8, "Su motor"). Son **medidas continuas del presente**, no el "pace" de DISC ni un puntaje de capacidad.

- **El motor es una lectura NORMATIVA (M1).** A diferencia del perfil DISC —que es **ipsativo** y genuinamente **no comparable** entre chicos—, un tempo solo significa algo **contra una referencia de su edad**. Por eso el motor SÍ se lee en relación a la población y se dice honesto: *"comparado con chicos de su edad, tardó un poco más en resolver"*, **siempre con intervalo ancho visible** y **nunca para rankear ni seleccionar** (§2.3, §12, §13).
- **Casi-únicos, pero eso NO es precisión (M1).** Como son medidas continuas y multi-señal, dos niños con el mismo nombre de perfil casi nunca comparten estos insights. Eso es **granularidad de medidas continuas y ruidosas**, NO que el método distinga con exactitud. Nunca se vende la casi-unicidad como precisión: el intervalo ancho va siempre al lado.
- Confianza **media** solo para tempo de decisión + reacción y costo de reacomodo; cadencia y señales de estilo son **baja**, solo color. Ningún insight entra en el nombre.

### 2.1 Qué mide y con qué respaldo (del doc de constructos)
- **Tempo de decisión** `avgLatency` (Juego A, choice reaction time) + **tempo de reacción** `avgReaction` (Juego B, TR simple).
- **La correlación entre ambos NO es validación de constructo (X2).** Choice-RT y simple-RT **comparten varianza de método y de velocidad**, así que su acuerdo es esperable por construcción y **no prueba** que midan un rasgo. La confianza **media** del tempo viene de la **calidad de la medición cronométrica** (control de la latencia del dispositivo, número de ensayos, limpieza de outliers), no de esa correlación. Si divergen, lenguaje aún más tentativo.
- `avgCadence`, `stdDevLatency`, `trend`, `extraTaps` → **confianza baja**, solo color, nunca afirmación autónoma. La etiqueta interna "impulsivos/nerviosos" para `extraTaps` está **prohibida** (no mide afecto); también quedan prohibidas como lectura las palabras "reflexivo/impulsivo/meditado/ágil/calmo/tranquilo/nervioso" (A2, §2.2/§9).

### 2.2 Banda de incertidumbre del tempo (C8/§E; recalibrada A7/A8/A2)
- **La banda del tempo se calcula SOLO con `avgLatency` + `avgReaction` (peso 0.50/0.50).** Se descarta el composite heredado 30/30/40. **La Adaptación (La Tormenta, set-shifting) NO entra al tempo**: alimenta únicamente "ante lo inesperado" (§5).
- **Orden de cálculo explícito (A7):** (1) age-fair de latencia y de reacción a 0-100 (§2.3); (2) `tempo = 0.50·latencia_af + 0.50·reacción_af`; (3) los términos de conteo `extraTaps`/`inertiaErrors` **NO entran al número** (son color de baja confianza); si alguna vez se conservaran como ajuste, se aplican **ANTES del clamp** y se re-clampa; (4) **clamp final a [0,100]**.
- **Tres zonas por PERCENTIL DENTRO DE LA CELDA DE EDAD** (no cortes absolutos, A8): **< p33 → "esta vez respondió tomándose más tiempo"**; **p33-p67 → zona intermedia** (incertidumbre, lenguaje graduado, sin cerrar rótulo); **> p67 → "esta vez respondió rápido"**. Los viejos cortes fijos 59/75 se **reemplazan** por p33/p67 de la celda: un corte absoluto no respeta la varianza por edad.
- **Léxico puramente cronométrico (A2):** se describe la **conducta observada** ("respondió tomándose más tiempo" / "respondió rápido"), NO disposiciones ni estilos cognitivos. **Prohibido "reflexivo, impulsivo, meditado, ágil, calmo, tranquilo, nervioso"** en el afecto-guard/motor-gate (igual que ya se prohíbe "impulsivos/nerviosos"). El vocabulario del tempo no reutiliza ningún nombre de eje ni de veta.
- **Exigir los dos mini-juegos de tempo** (A: latencia, B: reacción) o marcar `motor_narratable = false`. La **Adaptación faltante NO bloquea el tempo** (ya no pesa en él): bloquea solo el matiz de adaptación de §5. `motor_narratable = false` también en fallback por tiempo de respuesta.

### 2.3 Normalización por edad — un solo mecanismo (C7/§F + A8 + M1)
- **Un solo mecanismo de edad (A8).** El percentil por celda y el factor paramétrico `f(edad)` se pisaban: un percentil dentro de la celda es **invariante a cualquier transformación monótona uniforme**, así que `f(edad)` es casi un no-op para el banding. Se elige UNO:
  - **El banding del tempo se define por PERCENTIL DENTRO DE LA CELDA DE EDAD** (no-paramétrico, robusto en muestra chica; p33/p67, alineado con §2.2).
  - **`f(edad)` se usa SOLO para el número 0-100 que se muestra**, dicho explícito, **nunca para la banda** (ni para RCI, que además se elimina — §15/B1).
- **Modelo de edad corregido (multiplicativo, no piso-fijo).** El modelo piso-fijo `score = 1 − (x − F) / (R · f(edad))` **contradice el enlentecimiento multiplicativo del desarrollo**: Kail muestra que **media Y desvío escalan por el mismo factor**, así que un piso constante `F` es insostenible. Se pasa a **reescalado multiplicativo** (`x / f(edad)`) o, si se mantiene un piso, a **piso dependiente de la edad `F(edad)`**. El piso de **800 ms** de la v1 debe **documentar su fuente**: si incluye tiempo de decisión, **madura con la edad y NO puede ser fijo**.
- **Corrección por edad a los TRES sub-motores** (latencia de decisión, reacción, adaptación) y a los **términos de conteo** (`extraTaps`, `inertiaErrors`), o declarar por qué un término no se normaliza. Aunque la adaptación **no entra al tempo** (A7), se age-corrige para su uso en §5.
- **`factorEdad` continuo `f(edad)`:** interpolación **por meses** entre anclas de bibliografía (tabla abajo), no escalón por año. Se separan 15 y 16 (o se justifica el bin en el doc de calibración).

| Edad (ancla) | f | | Edad (ancla) | f |
|---|---|---|---|---|
| 8 | 1.45 | | 13 | 1.10 |
| 9 | 1.38 | | 14 | 1.05 |
| 10 | 1.30 | | 15 | 1.02 |
| 11 | 1.23 | | 16 | 1.00 |
| 12 | 1.16 | | | |

- **Dos regímenes separados (M1).** El **PERFIL DISC** (votos) es **ipsativo** → genuinamente **no comparable** entre chicos ("no comparamos niños" vale **ahí**). El **MOTOR** (tiempos) es **normativo** → es una **lectura relativa a su edad**, honesta y **siempre con intervalo ancho**, jamás para rankear ni seleccionar. **Despersonalizar "Su motor":** un tempo más pausado a menor edad **puede ser maduración, no disposición**.
- **Norma etiquetada dinámicamente (A8):** mientras el peso empírico de la celda es bajo, la referencia se nombra **"referencia bibliográfica"**; **solo cuando el dato Argo domina** la celda se nombra **"población Argo"** (autoseleccionada). Nunca norma clínica ni del desarrollo general.

### 2.4 Auto-adaptación a datos, robusta (§F2 + A8)
- El blending se dispara por **n POR celda de edad**, no por el total global de 500.
- **Encogimiento empírico-Bayes hacia la MEDIA GLOBAL de Argo (grand mean de la misma población), NO hacia la bibliografía general (A8):** `peso_celda = n_celda / (n_celda + k)`. **`k` se estima de los datos** (no se fija a mano; el viejo `k ≈ 100-200` queda solo como semilla inicial hasta poder estimar la varianza entre celdas). El resto pondera el grand mean; la **etiqueta** de la norma sigue la regla dinámica de §2.3.
- Percentiles robustos (p10/p90) para floor/range.
- Nulo de calibración: **enumeración exacta** (§7) para señales de votos; **permutación sobre respuestas reales** para el motor cuando haya datos. Nunca Monte Carlo.
- Excluir del conteo y de las normas: `marianonoceti@gmail.com`, `mariano@yacare.io`, `federico.diaz.goberna@gmail.com`, y todo `is_demo`.

---

## 3. Banda de confianza — TRES niveles calibrados al nulo (C2/§A; intensificadores re-gateados A9)

La escala de 12 votos **no sostiene 4 bandas honestas**. Se usan **3**, con el corte por encima del ruido y `P(banda)` bajo azar documentado. Masas exactas por enumeración de las 455 (script `scripts/enum-bandas.mjs`, determinista). **El registro de intensidad se re-gatea por A9** (la improbabilidad no intensifica; la confianza del instrumento es el techo):

| Banda | Regla sobre B | P(banda) bajo azar | Registro de lenguaje (A9) | Prohibido |
|---|---|---|---|---|
| **Definido** | **B ≥ 4** | **7.06%** (B=4: 4.28% · B=5: 1.98% · B≥6: 0.79%) | Lenguaje **afirmativo solo desde B ≥ 5** ("se inclina **con claridad** hacia X", P(B≥5)=2.78%); **"fuerte / marcado" solo B ≥ 6** (0.79%). **A B=4 el lenguaje es tentativo** (usa el registro de "Con matices"). | "es / puro / definitivamente"; **"con claridad" a B=4** |
| **Con matices** | **B = 2 o 3** | **33.67%** (B=2: 23.85% · B=3: 9.82%) | "se inclina, **con margen visible**" (tentativo). Junto con B=4 forma el registro tentativo **B=2-4** (37.95%). | **"claramente" / "con claridad"** |
| **Mezcla** | **B = 0 o 1** | **59.27%** (B=0: 22.79% · B=1: 36.48%) | "dos formas **casi con el mismo peso**", sin dominante claro | cualquier sustantivo de arquetipo único |

- **Nota de intensificadores (A9):** el registro de lenguaje se gatea por **intensificador, no solo por banda**. El registro **tentativo** ("se inclina, con margen visible") cubre **B = 2-4** (37.95%); el **afirmativo** ("con claridad") se reserva para **B ≥ 5** (2.78%); **"fuerte/marcado"** para **B ≥ 6** (0.79%). La banda estructural **Definido** (B≥4) **no autoriza intensidad por sí sola**: a B=4 se usa lenguaje tentativo, porque el techo lo pone la confianza del instrumento (media/baja), no la banda.
- **Referencia del nulo:** `P(B≥2)=40.73%`, `P(B=2-4)=37.95%`, `P(B≥5)=2.78%`, `P(B≥6)=0.79%`, `P(B=0-1)=59.27%`. Gate del nombre adoptado (§3.1/B3): `B≥4 O (B≥2 ∧ top_count≥7) = 7.68%` (vs el viejo `B≥2 ∧ top_count≥6 = 20.90%`, demasiado laxo; el componente `B≥2 ∧ top≥7` solo = 5.70%). Veta: `P(B2≤1)=71.40%`, `P(B2=2-3)=26.49%`, `P(B2≥3)=5.86%`, `P(B2≥4)=2.11%` (§1). Cada corte se documenta con su `P`; el script que lo enumera es reproducible. **La validez de estas `P` como exactas depende del balance del banco de ítems** (§7, §13/B2).
- **Estos cortes son de arranque.** A los 500 juegos por celda se recalibran con la distribución propia (§7), sin bajar por debajo del nulo.

### 3.1 Gate del NOMBRE del arquetipo (C3/§B + B3 — no etiquetar sobre ruido)
- **Nombre único del primario si `B ≥ 4` (banda Definido: siempre nombra) O si `B ≥ 2` Y `top_count ≥ 7`.** El gate viejo (`B≥2 ∧ top_count ≥ 6`) dejaba pasar el **20.90%** de los nombres bajo puro azar (demasiado laxo). Se endurece (B3): un primario en banda **Definido (`B≥4`) siempre nombra** (está separado del azar por brecha, 7.06%); con **brecha moderada (`B=2-3`) exige `top_count ≥ 7`**. Masa nula del gate adoptado = **7.68%** (vs 20.90% viejo). Por debajo → **par / tendencia sin sustantivo**. (Esto resuelve el caso 6-2-2-2: `B=4`, `top_count=6` — dominante claro al 50%, se nombra aunque no llegue a `top≥7`.)
- **Por debajo del gate:**
  - **B = 0-1 (Mezcla):** presentar como **par** ("una mezcla entre X e Y") o **tendencia sin sustantivo propio**; nunca un arquetipo. En B=0, co-líderes explícitos.
  - **B = 2-3 con `top_count < 7`** (p. ej. 5-3-2-2, `top_count=5`): también **co-líderes / tendencia**, no sustantivo único.
- **Ejemplos:** **4-3-3-2** → B=1 → **mezcla** (sin nombre). **5-3-2-2** → B=2, `top_count=5 < 7` → **co-líderes** (sin sustantivo). **6-2-2-2** → B=4 → **nombra** (banda Definido, aunque `top_count=6`).
- **La veta se agrega al nombre solo si `B2 ≥ 4`** (§1) **y no es eje opuesto** (§3.2/O1). El primario mantiene su banda por `B` intacta en todos los casos.

### 3.2 Ejes opuestos — regla de copy + monitor de sistema (O1)
- **Regla por chico:** si el eje de la veta es el **diagonal opuesto** del primario (**Impulsor↔Sostenedor = D↔S**; **Conector↔Estratega = I↔C**), setear `veta_opuesta = true` y `veta_confidence = capped`. Efectos:
  1. **La veta opuesta NO entra al nombre.** No existe el label compuesto "Impulsor con veta Sostenedor": el nombre se **queda en el primario** (con su banda por `B` intacta).
  2. **Se narra en el CUERPO** como **dos conductas observables dependientes del contexto que co-ocurren** ("en unas escenas empujó hacia adelante, en otras cuidó al equipo"), con **lenguaje tentativo**, **vocabulario de eje POSITIVO** (iniciativa / proponer para D; sostener / ser parte del equipo para S), **cerrando por lo accionable de cada eje**, enmarcado como **foto del presente**.
  3. **PROHIBIDO** entregarle al adulto el adjetivo **"raro / inusual / en tensión / contradictorio"**, y prohibido el **"pero"** que fabrica conflicto (usar **"y"**).
- **NO se degrada la confianza EXTRA por ser opuesto:** `B2` ya midió separación real y el primario mantiene su banda. El cap es solo sobre el *destino* de la veta (cuerpo, no nombre), no una penalización de certeza.
- `docs/archetype-naming.md` **NO agrega filas**: las vetas de eje opuesto se resuelven **solo en la capa de copy** (nota/apéndice en ese doc).
- **Monitor de sistema (poblacional, no regla por chico):** telemetría de la **fracción de vetas afirmadas (`B2 ≥ 4`, con primario definido) que caen en el eje opuesto, contra el nulo `1/3` (33.3%)** — bajo el azar los 3 ejes no-dominantes son equiprobables (masa conjunta `P(B2≥4 ∧ opuesto ∧ primario definido) ≈ 0.30%`). Si la fracción observada es **< 1/3** → consistente con **estructura circumpleja real** (opuestos suprimidos, como espera la teoría). Si **≥ 1/3** → sube la **sospecha de artefacto de ítems**. (Se toma sobre perfiles con primario definido; los `B=0` son co-líderes sin veta y quedan fuera.) No cambia ningún informe: alimenta la revisión del banco (§13/B2).

---

## 4. Momento notable — regla determinista + dependencia declarada

- **Candidato** = respuesta cuyo eje ≠ dominante.
- **Citable** solo si: (a) su eje es el secundario (corroboración) **o** (b) ocurrió en escena firma (la tormenta, Q5-Q7). Evita citar ruido.
- **Prioridad:** 1) escena firma; 2) elección hacia el eje secundario; 3) desempate por escena más temprana.
- **Tope:** 1 momento (2 solo si ambos ejes están en banda Definido o Con matices). Texto = **la escena literal**, nunca interpretado ("en la tormenta eligió buscar a los compañeros"), sin leer afecto ni intención.
- **Caso nulo** (chico consistente): citar su escena más representativa del dominante ("sostuvo su forma en…"). La sección siempre existe.
- **Dependencia declarada (C11):** el momento notable, "ante la tormenta" (§5) y "ante lo inesperado" (§5) **comparten las escenas de tormenta Q5-Q7**. NO se presentan como tres evidencias independientes que "coinciden": es la **misma fuente** leída con distinto foco. El informe lo dice explícitamente para no fabricar una falsa triangulación.

---

## 5. Los temas del informe — fuentes deterministas, renombradas y honestas (C4/C5/C6/C11/§D; ronda 3: A2/A3/A4/A5/X1/M1)

Cada tema sale de UNA fuente determinista mapeada a una lectura pre-escrita. Sin invención. Cambios de la ronda 3:

**"Cuánto lo mueve el grupo" (renombrado desde "cómo se lleva con los demás", C4; corregido A3):**
- Fuente: **I y S por SEPARADO. NUNCA se suman.** `I` (energía social / búsqueda de estímulo) y `S` (estabilidad, pertenencia, armonía) son **orientaciones distintas y a menudo opuestas**; sumarlas haría que un mismo puntaje alto signifique cosas contrarias. Se **reportan por separado**, con lenguaje distinto para cada uno, o se **condiciona la lectura a cuál de los dos pesa más**.
- Lectura **intra-individual** (§G, sin Alto/Medio/Bajo): "el vínculo con el grupo aparece **entre sus motores más elegidos**" vs. "aparece **menos que su propio empuje**", dicho por separado para `I` y para `S`.
- **Nunca** leer bajo-I como individualismo: se cruza con `S` antes de decir nada. Aclaración fija: **no mide habilidad social, popularidad ni amistades.**

**"En la meta, qué eligió" (renombrado desde "manejo del éxito", C5/A5) — escena literal:**
- Fuente: **la escena literal de La Meta (Q12)**, tratada como un momento notable, **sin nombre de rasgo**: "en la meta, eligió mirar al próximo reto" / "eligió celebrarlo con los demás" / "eligió repasar qué del plan funcionó" / "eligió que todos llegaran bien".
- **Se elimina la regla de convergencia** (era **circular**: Q12 es uno de los votos que COMPONEN el eje dominante con el que "convergía"). Queda **siempre en la escena observada**, descriptiva.
- **Prohibido el sintagma "maneja el éxito"** (y "así maneja el éxito").

**"Ante lo inesperado" (renombrado desde "cómo responde a los cambios", C6; corregido X1):**
- **Dos lentes INDEPENDIENTES, no una contradicción a reconciliar (X1):** el **eje `S`** (elecciones, una lente de **preferencia**) y **`avgAdaptation`** (juego de reglas cambiantes, una lente de **reacomodo en el juego**). **No tienen por qué coincidir**, y cuando difieren **no se "cierra" ninguna contradicción**: se narran las dos por separado ("en sus elecciones tiende a…; en el juego de reglas cambiantes, tendió a…"), cada una con su confianza (`S` = elecciones; adaptación = media).
- Corrección por edad aplicada a `avgAdaptation` (§2.3); en edades menores, si no es narratable, se marca no-narratable en vez de forzar.

**"Ante la tormenta / lo adverso" (renombrado desde "frustración", C11; corregido A4):**
- Fuente: **eje dominante de las elecciones en las escenas de tormenta (Q5-Q7)**. Se emite una tendencia **SOLO si las 3 de 3 escenas coinciden** en eje ("ante lo adverso, en el juego tendió a…"). **Con 2 de 3 el azar ya cruza el umbral el 62.50% de las veces**, así que **2/3 NO alcanza**: si no hay 3/3, se ancla a la **escena literal del juego** ("en las escenas de tormenta del juego, tendió a…"), sin narrar tendencia. Ante **1-1-1**: "respondió de formas distintas según la escena".
- **NUNCA leer afecto.** Una pausa puede ser reflexión o bloqueo; no se interpreta emoción, ansiedad ni frustración sentida. El nombre viejo ("manejo de la frustración") queda **prohibido** por implicar estado afectivo.
- Comparte fuente con el momento notable y con "ante lo inesperado" → dependencia declarada (§4).

**"Su motor" (tempo, §2) y "flexibilidad":**
- "Su motor" = **tempo** (`avgLatency` + `avgReaction`, media, con banda de incertidumbre §2.2), en **léxico cronométrico** (A2): "esta vez respondió tomándose más tiempo" / "respondió rápido", **nunca disposiciones** ("reflexivo/ágil" prohibidos). **Lectura normativa y despersonalizada** (M1): relativa a la edad, con **intervalo ancho**, nunca para seleccionar; un tempo más pausado a menor edad **puede ser maduración**.
- La **flexibilidad** (`avgAdaptation`, media) **NO se funde con el eje `S`**: es la **lente independiente** de "Ante lo inesperado" (X1), no un matiz reconciliado. Señales de **confianza baja** (`extraTaps`, `inertiaErrors`, `stdDevLatency`, `trend`, `avgCadence`) **solo como color**, nunca afirmación.

Todo el copy de temas respeta las **líneas rojas** (§12): nada de emoción/ansiedad, rasgo fijo, diagnóstico, comparación entre niños (para el perfil), talento, bien/mal; todo relativo a la edad; siempre "en el juego, tendió a… / suele / parece", nunca "es".

---

## 6. Forma del perfil — cascada corregida, alcanzable y alineada a las bandas (C12/§H; ronda 3: A6/B3)

La rama "leve/equilibrio" de la v1 era **inalcanzable** (0 de 455) y "equilibrio" no coincidía con la banda B=0. Cascada corregida (evaluada de arriba abajo, gana la primera; `n_ejes_fuertes` = ejes con conteo ≥ `top_count − 1`), **testeada sobre las 455** (`scripts/test-formas.mjs`). En la ronda 3 la rama **B=0 se ramifica** (A6) y el gate de nombre único pasa a `B≥4 O (B≥2 ∧ top_count ≥ 7)` (B3, §3.1):

| # | Forma | Regla | Banda | Comps (de 455) | Masa nula | ¿Nombre único? |
|---|---|---|---|---|---|---|
| 1 | **Dúo en empate / co-líderes** | `B = 0` y `n_ejes_fuertes = 2` | Mezcla | 30 | 9.85% | No (co-líderes) |
| 2 | **Equilibrio** | `B = 0` y `n_ejes_fuertes ≥ 3` | Mezcla | 17 | 12.94% | No (dispersión plana) |
| 3 | **Dúo** | `B = 1` y `second_count ≥ 4` | Mezcla | 72 | 16.65% | No (par) |
| 4 | **Versátil** | `B = 1` (resto; siempre `n_ejes_fuertes ≥ 3`) | Mezcla | 12 | 19.83% | No (tendencia) |
| 5 | **Líder con acompañante** | `B ∈ {2,3}` | Con matices | 132 | 33.67% | Solo si `top_count ≥ 7` |
| 6 | **Definido** | `B ∈ {4,5}` | Definido | 88 | 6.27% | Sí |
| 7 | **Muy marcado** | `B ≥ 6` | Definido | 104 | 0.79% | Sí |

- **Ramificación de B=0 (A6).** Dentro de `B = 0` se ramifica por `n_ejes_fuertes`:
  - **= 2 → "Dúo en empate / co-líderes"** (dos picos altos, tercero bajo: 6-6-0-0, 5-5-2-0, 5-5-1-1, 4-4-2-2). 30 comps / 9.85%.
  - **≥ 3 → "Equilibrio"** (dispersión plana, tercero alto: 4-4-4-0, 4-4-3-1, 3-3-3-3). 17 comps / 12.94%.
  - Ambas viven en la **banda Mezcla** (B=0), así que la ramificación **no cruza bandas**; suman 47 comps / 22.79% = `P(B=0)` exacto. Se reserva "Equilibrio" para la **dispersión plana** y "Dúo en empate" para los **dos co-líderes** con el resto bajo, según el pedido A6.
- **Las formas de B=0 se evalúan antes que cualquier forma B≥1** (mapean toda la banda Mezcla/B=0, alineado con §3). Bug de "equilibrio" de la v1 resuelto.
- **Cobertura probada:** cada forma tiene ≥ 1 composición, las masas suman **100.00%** (9.85+12.94+16.65+19.83+33.67+6.27+0.79), y **ninguna forma cruza dos bandas**. "Líder con acompañante" es la única donde el nombre único depende además de **`top_count ≥ 7`** (coherente con el gate endurecido de §3.1/B3).
- `LeveHaciaUno` de la v1 se **elimina**: no existe ninguna composición B=1 que no sea Dúo o Versátil (demostrado por enumeración).

---

## 7. Calibración estadística ipsativa — enumeración exacta (metodología, no cambia el informe)

- Los cortes de §3 y las formas de §6 se fijan/defienden con la **distribución exacta** del máximo y de la brecha bajo **multinomial(12, ¼)**, por **enumeración de las 455 composiciones** (`scripts/enum-bandas.mjs`), **no** con Monte Carlo ni con el desvío marginal de un eje.
- Valores nulos publicados y auditables: `P(B=0)=22.79%`, `P(B=1)=36.48%`, `P(B=2)=23.85%`, `P(B=3)=9.82%`, `P(B=4)=4.28%`, `P(B=5)=1.98%`, `P(B≥6)=0.79%`; `P(B=2-4)=37.95%`, `P(B≥5)=2.78%`; `P(top≥6)=21.73%`; `P(B≥2 ∧ top≥6)=20.90%` (gate viejo); componente `P(B≥2 ∧ top≥7)=5.70%`; **gate adoptado `B≥4 O (B≥2 ∧ top≥7) = 7.68%` (§3.1/B3)**; veta: `P(B2≤1)=71.40%`, `P(B2=2-3)=26.49%`, `P(B2≥3)=5.86%`, `P(B2≥4)=2.11%`; ejes opuestos (monitor §3.2): fracción con veta=opuesto entre `B2≥4` con primario definido, nulo `1/3`; masa conjunta ≈ `0.30%`.
- **Alcance de validez del nulo (B2 — NUEVO).** La enumeración multinomial(¼) es **exacta como aritmética**, pero **solo describe el azar real** si el banco está **balanceado** (cada ítem expone los 4 ejes exactamente una vez), las respuestas son **independientes** y **no hay sesgos sistemáticos no-DISC** (posición, color, aquiescencia, complacencia; marcado en edades 8-10). Las `P(banda)` se tratan como **exactas SOLO tras VERIFICAR ese balance** con un chequeo objetivo (§13/B2); mientras tanto son una **referencia**, no una garantía.
- A los **500 juegos por celda de edad** (no global) se re-enumera/permuta con la distribución propia (§2.4), moviendo los cortes solo por encima del ruido y etiquetando las normas dinámicamente (§2.3).
- **Separación clave (C, §14):** esta enumeración da **trazabilidad y reproducibilidad**, NO validez de constructo. "Determinista/reproducible" ≠ "válido".

---

## 8. Estructura del informe (informe ÚNICO) — con componentes fijos de marco y de límites

Un solo informe (ArgoOne + coach). Estructura idéntica para todos; contenido distinto por chico. Mockup: `preview/informe-final.html`. Cada sección: presencia siempre, largo fijo, forma fija, caso nulo definido (contrato de formato) y tooltip explicativo.

1. **Su perfil** (nombre `[Eje primario] con veta [Eje secundario]` **solo si pasa el gate §3.1** —`B ≥ 2 ∧ top_count ≥ 7`— **y**, para la veta, **`B2 ≥ 4` sin eje opuesto** —§1/§3.2—; si no, par/tendencia sin sustantivo).
2. **Qué tan marcado es** (banda de confianza a 3 niveles §3, con la lectura honesta de la incertidumbre; intensidad gateada por A9).
3. **Su motor** (insights §2: tempo de decisión y reacción, per-child, **léxico cronométrico**, banda de incertidumbre; **lectura normativa relativa a la edad con intervalo ancho**; `motor_narratable=false` ⇒ se omite). Es una lente de señales medidas, no un tipo.
4. **Cómo decide** (elecciones; sin leer velocidad como decisión).
5. **Qué lo enciende.**
6. **Palabras que lo encienden y las que lo apagan** (**preferencias del presente, no sensibilidades fijas** — X4).
7. **Guía rápida.**
8. **Checklist del día.**
9. **Consejo de reset.**
10. **En la meta, qué eligió** (escena literal de Q12, §5; sin "maneja el éxito").
11. **Ante la tormenta / lo adverso** (§5; **solo si 3/3**, sin afecto).
12. **Cómo responde a los cambios / ante lo inesperado** (eje `S` y flexibilidad como **dos lentes independientes**, §5).
13. **Cuánto lo mueve el grupo** (`I` y `S` **por separado, nunca sumados**, intra-individual, §5).
14. **Ecos fuera de la cancha.**
15. **Cómo viene evolucionando** (desde el 2.º perfilamiento, **descriptivo, sin gate RCI** —ver §15/B1—; misma fuente que el dashboard).
16. **[FIJO] Marco de lectura / barandas** (componente visible §12): "foto del presente, no diagnóstico, el perfil no se compara entre niños, no se selecciona, no es una definición de quién es el chico" + nota al adulto de no devolverle la etiqueta.
17. **[FIJO] Qué mira y qué no mira este perfil** (componente visible §13): los límites inherentes en lenguaje simple.

Los componentes 16 y 17 son **parte del contrato de formato**, no solo del doc: se renderizan siempre, en el informe del adulto y en la superficie del coach.

### Renombres consolidados (para i18n y QA)
- "Cómo se lleva con los demás" → **"Cuánto lo mueve el grupo"** (`I` y `S` por separado, nunca sumados).
- "Manejo de la frustración" → **"Ante la tormenta / lo adverso"** (solo 3/3).
- **"Manejo del éxito" → "En la meta, qué eligió"** (escena literal Q12, sin regla de convergencia).
- "Cómo responde a los cambios" → integrado a **"Ante lo inesperado"** (eje `S` y flexibilidad como **dos lentes independientes**).
- El 2.º término del **nombre** = **veta (eje secundario, elecciones)**, gateada por **`B2`** (§1); los insights **medidos** de los mini-juegos → sección **"Su motor"** (tempo/reacomodo, per-child), nunca en el nombre.

---

## 9. Enforcement fail-closed + observabilidad

- **Fail-closed:** una sección no se libera hasta pasar todos los filtros. Tras un tope de reintentos, degrada al **texto estático pre-aprobado**. Nunca se sirve IA sin aprobar; nunca se deja a un niño sin informe.
- **Filtros:** palabras prohibidas + lenguaje determinista + **band-guard** (intensificadores por banda **según A9**: "con claridad" solo **B≥5**; "fuerte/marcado" solo **B≥6**; "con claridad"/"claramente" **bloqueadas a B≤4**, incluida la banda Con matices y el B=4 de Definido) + closed-moment (escenas inventadas) + validador de formato + **eje correcto** + **name-gate** (bloquea sustantivo de arquetipo si no se cumple **`B≥4 O (B≥2 ∧ top_count≥7)`**) + **veta-gate** (bloquea veta en el nombre si `B2 < 4` o si es eje opuesto §3.2) + **motor-gate** (bloquea tempo si `motor_narratable=false` o zona intermedia p33-p67; **bloquea léxico no-cronométrico "reflexivo/impulsivo/meditado/ágil/calmo/tranquilo/nervioso"**) + **afecto-guard** (bloquea toda lectura emocional de señales de mini-juego, incluidas **"reflexivo/impulsivo/meditado/ágil/calmo/tranquilo/nervioso"** y "impulsivos/nerviosos") + **opuesto-guard** (bloquea "raro/inusual/en tensión/contradictorio" y el "pero" de conflicto cuando `veta_opuesta=true`) + **trazabilidad** (toda magnitud/ejemplo/momento se rastrea a la ficha o a la biblioteca).
- **Objetivo:** caída al respaldo estático **≤ 1%**, registrada por informe. Alerta si supera el umbral.

---

## 10. Persistencia

- Se guarda la **ficha de evidencia completa** por perfilamiento (vector de votos, `B`, **`B2`**, top/second/third_count, forma, banda, **veta / `veta_opuesta`**, sub-motores age-fair, `motor_narratable`, edad en meses, `factorEdad`) → regeneración determinista + historia/evolución.
- Persistir `question_id` por respuesta + versionar el banco (`question_version`): requisito del momento notable (§4), de la estabilidad de respuestas y del gate de evolución (§15).

---

## 11. i18n (transversal)

- Cada lista/tabla/biblioteca es `Record<Lang, …>` (es/en/pt) desde el diseño: conceptos, lecturas de temas, nombres de escena (La Tormenta / The Storm / A Tempestade), listas de filtros. Se redacta es como fuente y en/pt en paralelo, revisadas (no traducción automática para copy sensible).
- Renombres de §8 propagados a las tres lenguas. Los nombres de arquetipo (eje primario × eje secundario) salen de la tabla canónica trilingüe de `docs/archetype-naming.md`, **que debe reescribirse** desde el esquema viejo eje × tempo (ver §1); las **vetas de eje opuesto no agregan filas** (se resuelven en copy, §3.2).

---

## 12. Barandas éticas — VISIBLES como componente fijo (C10/§I; ronda 3: M1/X3/X4/A3)

Deja de ser solo texto del doc: es **componente renderizado** del informe y de la superficie del coach (§8.16), parte del contrato de formato.

**Marco fijo en el informe (foto, no diagnóstico):**
- "Es una **fotografía del presente**, no una definición de quién es el chico." · "**No es un diagnóstico**; no mide inteligencia, talento, condiciones psicológicas ni rendimiento futuro."
- **Dos regímenes, dicho honesto (M1):**
  - "El **PERFIL** (las elecciones) es **ipsativo**: dice cómo se ordena el chico **consigo mismo**, no cómo se compara con otro. **Ahí no hay comparación válida entre niños.**"
  - "El **MOTOR** (los tiempos) sí es una **lectura relativa a su edad**; se dice honesto ('comparado con chicos de su edad…'), **siempre con intervalo ancho**, y aun así **NUNCA para seleccionar, rankear ni descartar**."
- "**No se usa para seleccionar ni descartar.**"
- **Nota al adulto (obligatoria):** el perfil es para **entender y acompañar**, no para devolvérselo al niño como identidad ("sos un X"). El nombre es una lente del momento, no una etiqueta.

**Superficie del coach (barandas activas):**
- Advertencia visible de **no-comparación (perfil) / no-selección**.
- **Prohibido mostrar barras de eje crudas comparables columna a columna** entre niños. La comparación cross-child es **solo cualitativa** (misma forma, ejes compartidos), **nunca magnitudes** ni números crudos.
- **Reconocimiento explícito (X3, no se declara resuelto por texto):** el **nombre y la forma del perfil ya son, de hecho, claves de selección** para el coach. La **mitigación real es de diseño de interfaz** —**no ofrecer una grilla de plantel ordenable ni agrupable por arquetipo**—, que queda como **decisión de interfaz**, no como una frase de advertencia.

**Reencuadre de todo copy deficitario (obligatorio):**
- "le cuesta" → "en el juego, tendió a tomarse un momento".
- "Bajo / Alto / Medio" en conteos ipsativos → lenguaje **intra-individual** (§G). **`I` y `S` se reportan por separado, nunca sumados** (§5/A3).
- "no es su primer motor" → "tiende primero a su propio empuje; el grupo aparece después".
- Todo polo (ágil/pausado, anticipatorio/calibrado, reacomodo rápido/pausado) se presenta como **preferencia del presente**, sin mejor/peor; también las **"palabras que lo apagan" son preferencias del presente, no sensibilidades fijas** (X4).

**Líneas rojas transversales (del doc de constructos, blindadas en filtros §9):**
1. **Nada de emoción / ansiedad / nervios.** Las señales captan solo comportamiento motor y temporal. `extraTaps` NO son nervios. **"reflexivo/impulsivo/meditado/ágil/calmo/tranquilo/nervioso" prohibidos** como lectura (A2).
2. **Nada de rasgo fijo.** Una sola toma = un estado, contaminado por motivación, familiaridad con la pantalla y latencia/tamaño del dispositivo. Siempre "tiende a / suele / parece", nunca "es".
3. **Nada de diagnóstico ni clínica** (TDAH, déficit atencional, impulsividad clínica, rigidez, perseveración patológica, daño frontal).
4. **Nada de comparación entre niños en el PERFIL.** Sin norma para las elecciones (ipsativas), distinto dispositivo, una sola toma; **todo relativo a la edad**. (El **motor** admite una lectura relativa a la edad, con intervalo ancho, pero **tampoco** se usa para rankear ni seleccionar — M1/§2.3.)
5. **Nada de talento, capacidad, inteligencia ni predicción de rendimiento.**
6. **Nada de bien/mal** ("aprobó/reprobó", "acertó/falló", "le costó"). Todo es estilo, ningún polo es mejor.
7. **El eje DISC no sale de la velocidad.** El tempo alimenta "Su motor" y el color; el eje se define por las **elecciones**.

---

## 13. [visible] Límites inherentes del método (se asumen, no se corrigen)

Componente fijo del informe/superficie (§8.17), en lenguaje simple. Estos límites **no** tienen arreglo de ingeniería; se comunican con honestidad:

1. **Comparación entre niños no válida PARA EL PERFIL.** Los conteos DISC son **ipsativos** (suman 12): dicen cómo se ordena el chico **consigo mismo**, no cómo se compara con otro. **No hay ranking de perfiles.** (El **MOTOR** es normativo y sí admite una **lectura relativa a la edad**, con **intervalo ancho**, pero tampoco se usa para rankear ni seleccionar — §2.3/M1.)
2. **Certeza acotada por diseño.** **12 elecciones** no sostienen alta certeza. Más de la mitad de los perfiles posibles caen, bajo azar, en "mezcla o con matices" (§3); y el **nombre-blend completo (veta afirmada) es ~2% del nulo** (§1). Por eso el lenguaje es tentativo y a menudo no hay un nombre único ni una veta en el nombre. **La improbabilidad de un patrón NO sube la intensidad** (§0/A9): el techo lo pone la confianza media/baja del instrumento.
3. **El cambio en el tiempo tiene fiabilidad ~0 sin test-retest.** Sin re-medición controlada no se puede separar cambio real de ruido; por eso la evolución se narra **SOLO de forma descriptiva** (§15), sin afirmar "cambió" ni "estable", y **sin invocar RCI/SEM** (no computables sin un coeficiente test-retest que el método aún no tiene). **A estas edades, además, un cambio observado es tan compatible con maduración normal como con un cambio de disposición.**
4. **Validez de constructo no establecida.** El método es reproducible y trazable, pero **no está validado** contra criterios externos (§14).
5. **Muestra autoseleccionada.** Las normas son de quienes usan Argo, **no del desarrollo general**; se etiquetan dinámicamente ("referencia bibliográfica" mientras el dato empírico es escaso, "población Argo" cuando domina — §2.3/§2.4).
6. **Motor de una sola toma con intervalo ancho en niños.** El tempo es una **foto** de un momento, contaminada por dispositivo, pantalla y motivación; el intervalo de confianza es amplio, sobre todo a menor edad. Su **casi-unicidad por chico es granularidad de medidas continuas y ruidosas, no precisión** (M1).
7. **La calibración al azar solo vale si el banco está balanceado (B2).** El nulo multinomial(¼) asume que **cada ítem expone los 4 ejes exactamente una vez**, que las respuestas son **independientes** y que un chico de **8-10** no trae **sesgos sistemáticos no-DISC** (posición, color, aquiescencia, complacencia). Donde el ¼ no sea defendible, las `P(banda)` **NO son exactas**. **Las edades 8-10 quedan flagueadas.** Antes de tratar las `P` como exactas hay que **VERIFICAR el balance del banco** con un chequeo objetivo (§7).

---

## 14. [visible] Trazabilidad/reproducibilidad ≠ validez (C, §I)

- **Lo que el método SÍ da:** **trazabilidad** (toda afirmación se rastrea a un hecho de la ficha o a la biblioteca pre-aprobada) y **reproducibilidad** (la misma ficha produce el mismo esqueleto; el nulo se enumera de forma exacta y auditable).
- **Lo que el método NO da (aún):** **validez de constructo, de criterio y predictiva.** No se ha establecido que las señales midan lo que dicen medir contra referencias externas, ni que predigan nada.
- **Regla de discurso:** **"determinista/reproducible" no es un argumento de validez.** Prohibido presentar la trazabilidad como si fuera evidencia de que el perfil "es verdadero". El claim máximo permitido sigue siendo: *anclado en teoría, foto del presente, no clínico.*

---

## 15. [Detalle de §8.15] Evolución — descriptiva hasta tener test-retest (C1/§C, degradado en la ronda 3 por B1)

- **El gate RCI NO es computable:** requiere un **coeficiente de fiabilidad test-retest** que el método **no tiene** (§13.3 admite fiabilidad ~0 del cambio). Hasta tener **datos test-retest reales**, la evolución se narra de forma **PURAMENTE DESCRIPTIVA**.
- **Lenguaje permitido:** "esta vez, en el juego, tendió a X; la vez anterior, a Y." **PROHIBIDO** afirmar "cambió", "se mantiene estable", "evolucionó", "mejoró/empeoró", y **prohibido invocar RCI / SEM / umbral de cambio confiable**.
- **No se compara la magnitud de motor entre tomas como "cambio":** se describen las **dos fotos**, cada una con su **intervalo ancho**, sin conclusión de trayectoria.
- **A estas edades un cambio observado es tan compatible con maduración normal como con cambio de disposición** (§13.3): por eso **no se atribuye causa**.
- **Reintroducción futura:** cuando existan datos test-retest reales que permitan **estimar fiabilidad**, recién ahí podrá reintroducirse un gate de cambio confiable (RCI). Hasta entonces, **solo descripción**.

---

### Resumen de qué cambió respecto de la v1 (ronda 2, para el panel)

| # | Corrección | Dónde |
|---|---|---|
| C1 | Evolución con gate RCI; prohibida si B≤1 | §15 *(superado en R3-B1: ahora descriptiva sin RCI)* |
| C2 | Banda a 3 niveles calibrada al nulo, P(banda) documentada, enumeración exacta | §3, §7 |
| C3 | Nombre gateado: `B≥2 ∧ top_count≥6`; si no, par/tendencia | §3.1 *(endurecido en R3-B3 a top_count≥7)* |
| C4 | "Cuánto lo mueve el grupo" ← I+S; no habilidad social | §5 *(corregido en R3-A3: I y S por separado, nunca sumados)* |
| C5 | "Manejo del éxito" ← escena literal Q12, sin rasgo | §5 *(renombrado en R3-A5: "En la meta, qué eligió", sin convergencia)* |
| C6 | "Ante lo inesperado" ← eje S + flexibilidad como matiz | §5 *(corregido en R3-X1: dos lentes independientes)* |
| C7 | Lenguaje intra-individual; norma edad a 3 sub-motores + conteos; modelo piso-fijo; factorEdad continuo; cortes por percentil/celda; EB shrinkage | §2.3, §2.4, §5, §12 *(rehecho en R3-A8/M1)* |
| C8 | Banda de incertidumbre del motor (60-74); exigir 3 juegos o `motor_narratable=false` | §2.2 *(recalibrado en R3-A7: solo latencia+reacción, percentiles)* |
| C9 | **Tempo fuera del nombre**; nombre = eje primario × eje secundario (elecciones, blend DISC) | §0, §1, §2, §8 |
| C10 | Barandas visibles (informe + coach), sin barras crudas, copy reencuadrado | §12 |
| C11 | Dependencia entre temas de tormenta declarada; "frustración"→"ante la tormenta", sin afecto | §4, §5 |
| C12 | Cascada de forma corregida (6 formas, todas alcanzables, alineadas a banda, test 455) | §6 *(ramificada en R3-A6: 7 formas)* |
| — | Límites inherentes visibles + trazabilidad≠validez | §13, §14 |

### Ronda 3 — qué cambió sobre la ronda 2

| # | Cambio | Dónde |
|---|---|---|
| R3-A1 | **Veta gateada por su propio estadístico `B2`** (B2≤1 sin veta / 2-3 tentativa / ≥4 afirmada). Nombre-blend completo ~2% del nulo; la mayoría lidera con primario casi puro. `B` gatea solo el primario | §1, §3 |
| R3-A2 | **Léxico del tempo puramente cronométrico** ("respondió tomándose más tiempo/rápido"); "reflexivo/impulsivo/meditado/ágil/calmo/tranquilo/nervioso" prohibidos en afecto-guard/motor-gate | §2.2, §5, §9 |
| R3-A3 | **`I` y `S` NUNCA se suman**: se reportan por separado o se condiciona a cuál pesa | §5, §8, §12 |
| R3-A4 | **"Ante la tormenta" exige 3/3** (2/3 = 62.50% de azar); si no, escena literal | §5, §8 |
| R3-A5 | **"Manejo del éxito" → "En la meta, qué eligió"**; se elimina la regla de convergencia (circular); "maneja el éxito" prohibido | §5, §8 |
| R3-A6 | **Cascada B=0 ramificada** por `n_ejes_fuertes`: "Dúo en empate" (=2, 30 comps/9.85%) vs "Equilibrio" (≥3, 17 comps/12.94%) | §6 |
| R3-A7 | **Banda de tempo = solo latencia+reacción (0.50/0.50)**; Adaptación fuera del tempo (va solo a §5); `extraTaps`/`inertiaErrors` fuera del número; orden clamp explícito | §2.2, §2.3, §5 |
| R3-A8 | **Un solo mecanismo de edad**: percentil por celda = banding; `f(edad)` solo para el número; **modelo multiplicativo** (Kail); shrinkage al **grand mean Argo**; `k` estimado; norma etiquetada dinámicamente | §2.3, §2.4 |
| R3-A9 | **Eje rector recalibrado**: la improbabilidad NO intensifica; techo = confianza del instrumento. "con claridad" B≥5, "fuerte/marcado" B≥6, B=2-4 tentativo | §0, §3, §9 |
| R3-B1 | **Evolución descriptiva** hasta tener test-retest (sin RCI/SEM, sin "cambió/estable") | §15, §13 |
| R3-B2 | **Alcance de validez del nulo declarado**; verificar balance del banco; edades 8-10 flagueadas | §3, §7, §13 |
| R3-B3 | **Name-gate endurecido a `B≥2 ∧ top_count≥7`** (5.70% vs 20.90%) | §3.1, §6, §9 |
| R3-M1 | **Motor = lectura normativa relativa a la población** (dos regímenes: perfil ipsativo vs motor normativo); despersonalizado; casi-unicidad ≠ precisión; intervalo ancho siempre | §2, §2.3, §12, §13 |
| R3-O1 | **Regla de ejes opuestos**: la veta opuesta no entra al nombre, se narra en el cuerpo con eje positivo, sin "raro/pero"; sin degradar confianza extra; **monitor poblacional**: fracción `veta=opuesto` entre `B2≥4` (primario definido) vs `1/3` (masa ≈0.30%) | §1, §3.2, §9 |
| R3-X1 | `avgAdaptation` y eje-`S` = **dos lentes independientes** (no se reconcilia contradicción) | §5 |
| R3-X2 | Convergencia choice-RT/simple-RT **NO es validación de constructo** (varianza de método/velocidad compartida) | §2.1 |
| R3-X3 | Nombre/forma **ya son claves de selección**; mitigación = **diseño de interfaz** (no grilla ordenable por arquetipo) | §12 |
| R3-X4 | "Palabras que lo apagan" = **preferencias del presente**, no sensibilidades fijas | §8, §12 |

---

**Notas de entrega para el orquestador (ronda 3):**

- Documento corregido completo, español, con la estructura numerada 0-15 de la v2 preservada. La ronda 3 aplica balde A (A1-A9), balde B (B1-B3), decisión motor (M1), decisión veta opuesta (O1) y cambios menores (X1-X4), de forma coherente entre secciones.
- **Números del nulo (enumeración exacta de las 455, multinomial 12/¼), usados tal cual:** primario `P(B≥2)=40.73%`, `P(B=2-4)=37.95%`, `P(B≥5)=2.78%`, `P(B≥6)=0.79%`, `P(B=0-1)=59.27%`; veta `P(B2≤1)=71.40%`, `P(B2=2-3)=26.49%`, `P(B2≥3)=5.86%`, `P(B2≥4)=2.11%`; name-gate `B≥2 ∧ top≥6 = 20.90%` (viejo) vs adoptado `B≥4 O (B≥2 ∧ top≥7) = 7.68%` (componente top≥7 = 5.70%); veta opuesta (monitor, primario definido): fracción vs `1/3`, masa conjunta ≈ `0.30%`; "ante la tormenta" 2/3 bajo azar = `62.50%` (por eso 3/3).
- **Coherencias verificadas:** la veta se gatea por `B2` en §1, §3, §3.1, §8, §9 y §10 (nunca por `B`); el tempo excluye Adaptación en §2.2, §2.3 y §5, y la Adaptación vive solo en "ante lo inesperado" (§5) como lente independiente (X1); el name-gate dice `top_count≥7` en §3.1, §6, §7, §8 y §9; los intensificadores dicen B≥5 / B≥6 en §0, §3 y §9; la ramificación de B=0 (§6) suma 47 comps / 22.79% y la tabla completa suma 455 / 100.00%.
- Downstream (fuera de esta spec): **reescribir `docs/archetype-naming.md`** del esquema eje × tempo al eje × eje secundario; **no** agrega filas por ejes opuestos (se resuelven en copy, §3.2). Pendiente de producto/datos: verificar el **balance del banco de ítems** (B2), instrumentar el **monitor de ejes opuestos** (O1) y conseguir **datos test-retest** antes de reintroducir cualquier gate de cambio (B1).
- Documento persistido como `docs/METODO-CALCULO-NUEVO.md` (reemplaza la v2; git conserva la v2 en el historial).
