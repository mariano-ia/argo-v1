# Método Argo — CÁLCULO DEL PERFIL Y EL INFORME (especificación v4, pulido final)

> Documento autoritativo del método reformado, **ronda 4 (pulido final)**. Parte de la v3 (ronda 3: balde A + balde B + decisión motor M1 + decisión veta opuesta O1 + cambios menores X1-X4, sobre la v2 del panel) y aplica encima el **pulido final R4-* (PILA 1 de arreglos técnicos + copy, y PILA 3 de consolidación de límites y agenda empírica)**. Estructura numerada idéntica (secciones 0-15) para comparar manzana con manzana; se preserva todo lo que la ronda 4 no toca. Es la referencia de implementación y de re-revisión (reemplaza la v3, conservada en git). **Gobernanza (división de autoridad):** `docs/archetype-naming.md` = fuente de verdad de los **nombres/labels** trilingües + prohibidos + mapas espejo; **este doc** = fuente del **cálculo** (gates B/B2, bandas, formas, motor age-fair, guards); `sistema-de-perfilamiento.md` y `PREGUNTAS-Y-CALCULO-PERFIL.md` pasan a **derivados** (remiten, no re-especifican). Plan de implementación por fases: `docs/METODO-PLAN-IMPLEMENTACION.md`.
>
> **Principio que ordena todo (eje rector, recalibrado en la ronda 3 — A9; endurecido en R4-A):** la improbabilidad de un patrón bajo el azar autoriza SOLO a afirmar que **"esto no parece ruido uniforme"** (R4-B: separación de la respuesta al azar, no presencia de rasgo). NO autoriza a **intensificar** el lenguaje sobre el niño. El techo de intensidad lo fija la **confianza del instrumento** (media/baja), no la rareza del patrón: por muy improbable que sea una composición, un instrumento de confianza media no habilita lenguaje fuerte. **Con ese techo, el registro máximo alcanzable es "se inclina con claridad" (solo a `B ≥ 5`); el registro "fuerte / marcado" queda ELIMINADO del band-guard (R4-A), porque contradice el propio eje rector: la rareza del patrón NO intensifica el lenguaje. Única excepción: "marcado" puede describir el MARGEN DE VOTOS de esta toma ("el margen fue amplio esta vez"), nunca al niño ni al rasgo.** La separación-del-azar decide *si* se dice algo; la confianza del instrumento decide *con cuánta fuerza*. Todo se calibra contra el nulo por **enumeración exacta de las 455 composiciones** de 12 votos en 4 ejes (no Monte Carlo).
>
> **Naturaleza del método (para revisores):** Argo NO es un test validado. Toma constructos públicos (DISC como puerta de entrada; funciones ejecutivas y SDT en el roadmap), los adapta y los mide por juego. Claims permitidos: "anclado en la teoría, es una fotografía del presente, no es una medida clínica". Prohibidos: "validado", "diagnóstico", "predice el rendimiento". La **confianza techo del instrumento es media** (solo tempo de decisión/reacción y costo de reacomodo llegan a media; todo lo demás es baja).

---

## 0. Arquitectura de dos capas

- **Capa 1 (determinista, sin IA).** De las 12 respuestas + métricas de mini-juego + tiempos + la ficha del perfilamiento anterior, computa una **ficha de evidencia** (hechos con magnitudes) y ensambla el **esqueleto**: qué bloque de concepto pre-aprobado aplica y en qué sección cae.
- **Capa 2 (IA, acotada).** Recibe `ficha + esqueleto + manual de estilo + palabras prohibidas` y SOLO reescribe en prosa cálida. No introduce rasgo, magnitud, eje, veta, motor, escena ni ejemplo que no esté en el esqueleto.
- **Correctitud ipsativa:** una respuesta suelta es UN VOTO (débil). Toda afirmación nace del agregado, nunca del patrón "eligió A → afirmá X".
- **Eje rector operativo (A9, endurecido R4-A/R4-B):** el nivel de improbabilidad-bajo-el-azar solo abre la puerta a *afirmar que no es ruido uniforme*; el registro de intensidad (tentativo / con claridad) lo gobierna por separado la banda + la confianza del instrumento (§3, §9). El registro **"fuerte / marcado" ya no existe** como escalón del band-guard (R4-A): el máximo es "con claridad" (solo `B ≥ 5`). Nunca se sube el tono porque un patrón sea raro.
- **Qué mide realmente `P(banda)` (R4-B):** mide la **separación de la RESPUESTA UNIFORME AL AZAR**, NO "ausencia de rasgo". Una banda alta autoriza SOLO "**no es ruido uniforme**", nunca "hay rasgo". La alternativa relevante al patrón observado no es "azar puro" sino **tendencias de respuesta sistemáticas no-DISC** (deseabilidad social, aquiescencia, comprensión del ítem), que **vencen el nulo uniforme igual que lo haría un rasgo**. En un DISC forzado el sesgo es **direccional**: las opciones D (mandar/ganar) suelen ser menos deseables que las S (cuidar) o I (celebrar) entre 8-16 años, corriendo masa hacia S/I y pudiendo **fabricar "Definidos" de artefacto** que sesgan la distribución de arquetipos. Hasta re-enumerar contra un **nulo de deseabilidad** (§14), las `P(banda)` se rotulan **"referencia optimista"**.
- **Separación de fuentes (C9):** el **nombre** (eje primario + eje secundario/veta) sale exclusivamente de las **elecciones** (votos DISC). Los **insights de los mini-juegos** (tempo de decisión, reacomodo, etc.) salen de los **mini-juegos** (velocidad) y viven solo en el contenido del informe, nunca en el nombre. Las dos fuentes están desacopladas por diseño: el nombre son **dos ejes** (ambos de elecciones), así que ya no puede aparecer una palabra de tempo en la denominación ni un nombre contradictorio del tipo "Impulsor Sereno". Regla dura: **el eje DISC no se deduce de la velocidad**.

---

## 1. Perfil = eje primario + eje secundario (ambos desde las elecciones)

- **12 preguntas forzadas, 1 voto por eje.** Dominante = más votado; **veta = 2.º más votado**. Se conserva el **vector completo** de votos (D/I/S/C), no solo el ganador.
- Derivados: `B = votos(1.º) − votos(2.º)` (gatea el **primario**); **`B2 = second_count − third_count`** (gatea la **veta**, NUEVO A1); `top_count`, `second_count`, `third_count`; flags de empate (`secundario_empatado` si 2.º==3.º).
- **El nombre es un blend construido por Argo, inspirado en los blends DISC: eje dominante + eje secundario (C9/decisión G del owner).** El perfil canónico es **`[Eje primario] con veta [Eje secundario]`** (p. ej. "Impulsor con veta Estratega"). La veta es un **eje** (Impulsor/Conector/Sostenedor/Estratega), no una palabra de tempo. **NO es "exactamente cómo DISC describe los blends" (R4-DISC d):** es una construcción de Argo **más conservadora que el estándar** (gateada por `B2` y por la regla de opuestos), anclada en la idea de blend pero no idéntica a ella. **Conteo exacto de nombres (R4-DISC b):** el dominante tiene 4 opciones y la veta es uno de los otros 3 ejes, pero la **regla de ejes opuestos** (§3.2/O1) impide nombrar el diagonal opuesto. En rigor: **4 primarios puros + 8 blends no-opuestos = 12 combinaciones nombrables como blend**; los **4 pares diagonales** (D↔S, I↔C) **no llevan nombre de blend** y se resuelven en el cuerpo del informe. Así que "12 y ni uno más" vale como cuenta de etiquetas nombrables, no como un producto 4×3=12 ingenuo (ese incluiría los opuestos que no se nombran). No 132: la veta es un eje, no un arquetipo entero. Puntos críticos:
  - **La veta NO es el motor.** Las palabras de tempo (Dinámico/Rítmico/Sereno/Observador) **salen del nombre por completo**: no nombran perfiles ni vetas. Toda señal de velocidad vive solo en el contenido del informe (§2, §8) y nunca en la denominación. Esto elimina de raíz la contradicción C9: el 2.º término del nombre es siempre otro eje, medido con la misma escala de elecciones que el 1.º.
  - **Derivación de la veta (definida acá, no un stub):** veta = eje del `second_count`. Si `secundario_empatado`, no se cierra una veta única (se presenta el par). Nada de esto toca los mini-juegos.
  - **La veta se gatea por su propio estadístico `B2`, NO por `B` (A1).** `B` gatea SOLO el primario (§3); la confianza de la veta la fija la separación 2.º↔3.º. **Las masas de banda de veta se reportan CONDICIONADAS a que exista un primario con brecha ≥ 1** (dominante único, no co-líderes), porque §3.2 excluye los `B=0` (co-líderes sin veta). Denominador **`P(B ≥ 1) = 77.21%`**; las masas condicionales (R4-H) son:
    - **`B2 ≤ 1` → SIN veta** (**75.72%** condicional; marginal sobre las 455 = 71.40%, solo como referencia). El perfil se lee casi como **primario puro**: "asoma una segunda inclinación, sin margen claro". El nombre no incorpora veta.
    - **`B2 = 2-3` → veta TENTATIVA** (**23.14%** condicional; marginal 26.49% de referencia): "con algo de X" (lenguaje tentativo; no se cierra un blend afirmado).
    - **`B2 ≥ 4` → veta AFIRMADA** (**1.15%** condicional; marginal 2.11% de referencia): entra al nombre como blend `[primario] con veta [secundario]`.
  - **Consecuencia honesta declarada (corregida R4-H):** el **nombre-blend COMPLETO (veta afirmada EN EL NOMBRE) aparece por azar en ≈0.09% del nulo**, NO ~2%. El número honesto es `P(B2 ≥ 4 ∧ primario nombrado) = 0.092%` (~0.09%); restringido a vetas **no opuestas** (las únicas que entran al nombre, ×2/3) baja a **0.061% (~0.06%)**. El viejo **2.11% era el marginal** e **incluía co-líderes `B=0` sin primario** (que §3.2 excluye), por eso sobrestimaba. La **mayoría de los informes lideran con un primario casi puro**, sin veta en el nombre. Esto **refuerza** la conclusión honesta: el blend nombrado es **aún MÁS raro** que lo declarado antes. No es un stub: es la lectura calibrada de lo que 12 votos sostienen.
  - **Ejes opuestos (O1, §3.2):** si el eje de la veta es el **diagonal opuesto** del primario (D↔S, I↔C), la veta **no entra al nombre aunque `B2≥4`**; se resuelve en el cuerpo del informe (ver §3.2).
  - **Requiere reescribir `docs/archetype-naming.md`:** hoy define los 12 como eje × tempo. Debe pasar a eje × eje secundario. Es un cambio de branding downstream de esta spec (lista de impacto de interfaces, no en esta corrida). **No agrega filas por ejes opuestos:** esos casos se resuelven solo en la capa de copy (§3.2/O1), con una nota/apéndice en ese doc.

---

## 2. Insights de los mini-juegos (tempo psicomotor) — fuera del nombre, per-child, lectura normativa por edad

**No existe "el Motor" como un tipo ni una etiqueta.** Los mini-juegos no clasifican al chico en una categoría; producen un puñado de **insights medidos, propios de cada niño** (tempo de decisión, tempo de reacción, cómo se reacomoda ante un cambio de regla) que solo alimentan contenido del informe (§8, "Su motor"). Son **medidas continuas del presente**, no el "pace" de DISC ni un puntaje de capacidad.

- **El motor es una lectura NORMATIVA (M1).** A diferencia del perfil DISC —que es **ipsativo** y genuinamente **no comparable** entre chicos—, un tempo solo significa algo **contra una referencia de su edad**. Por eso el motor SÍ se lee en relación a la población y se dice honesto: *"comparado con chicos de su edad, tardó un poco más en resolver"*, **siempre con intervalo ancho visible** y **nunca para rankear ni seleccionar** (§2.3, §12, §13).
- **Casi-únicos, pero eso NO es precisión (M1).** Como son medidas continuas y multi-señal, dos niños con el mismo nombre de perfil casi nunca comparten estos insights. Eso es **granularidad de medidas continuas y ruidosas**, NO que el método distinga con exactitud. Nunca se vende la casi-unicidad como precisión: el intervalo ancho va siempre al lado.
- Confianza **media** solo para tempo de decisión + reacción y costo de reacomodo; cadencia y señales de estilo son **baja**, solo color. Ningún insight entra en el nombre.
- **El motor es una medida CON VALENCIA (R4-DISC e).** En DISC "ningún polo es mejor" es una ética válida (los ejes son estilos simétricos), **pero el tempo cronométrico tiene valencia real de desempeño**: responder más rápido o más lento no es simétrico como lo es un eje. Por honestidad **no se le aplica la simetría DISC** al motor; se admite que es una medida con valencia, y esa es una **razón extra** para el **intervalo ancho** y para **no rankear ni seleccionar** jamás con ella. La simetría "ningún polo es mejor" se reserva para los ejes DISC (elecciones), no para el tempo.

### 2.1 Qué mide y con qué respaldo (del doc de constructos)
- **Tempo de decisión** `avgLatency` (Juego A, choice reaction time) + **tempo de reacción** `avgReaction` (Juego B, TR simple).
- **La correlación entre ambos NO es validación de constructo (X2).** Choice-RT y simple-RT **comparten varianza de método y de velocidad**, así que su acuerdo es esperable por construcción y **no prueba** que midan un rasgo. La confianza **media** del tempo viene de la **calidad de la medición cronométrica** (número de ensayos, limpieza de outliers), no de esa correlación ni de un supuesto control del dispositivo. Si divergen, lenguaje aún más tentativo.
- **NO se invoca "control de la latencia del dispositivo" como respaldo (R4-G).** Argo es una **web app corriendo sobre teléfonos ajenos**: la latencia de pantalla, de input y de refresco **NO se controla** (y §13.6 ya la lista como contaminante, así que decir "controlada" era una **contradicción interna directa**). En su lugar: **declarar el N real de ensayos por mini-juego** en la ficha; si es bajo, el lenguaje del tempo es **aún más tentativo**.
- **Decisión del owner sobre el motor: se MANTIENE la lectura NORMATIVA (M1), no se revierte (R4-G).** El motor se sigue leyendo relativo a la población de la edad, pero se **refuerzan las salvaguardas**: intervalo ancho siempre, sin ranking ni selección, y las correcciones de percentilado age-fair y shrinkage de banda (§2.3/R4-D/R4-E). La lectura **intra-individual** queda documentada como **FALLBACK en la agenda (§14)**: registrar latencia de dispositivo por sesión como covariable o criterio de exclusión y, si el ruido resulta demasiado, migrar a intra-individual. El owner eligió normativo; esto solo endurece los caveats y deja el fallback trazado.
- `avgCadence`, `stdDevLatency`, `trend`, `extraTaps` → **confianza baja**, solo color, nunca afirmación autónoma. La etiqueta interna "impulsivos/nerviosos" para `extraTaps` está **prohibida** (no mide afecto); también quedan prohibidas como lectura las palabras "reflexivo/impulsivo/meditado/ágil/calmo/tranquilo/nervioso" (A2, §2.2/§9).

### 2.2 Banda de incertidumbre del tempo (C8/§E; recalibrada A7/A8/A2)
- **La banda del tempo se calcula SOLO con `avgLatency` + `avgReaction` (peso 0.50/0.50).** Se descarta el composite heredado 30/30/40. **La Adaptación (La Tormenta, set-shifting) NO entra al tempo**: alimenta únicamente "ante lo inesperado" (§5).
- **Orden de cálculo explícito (A7):** (1) age-fair de latencia y de reacción a 0-100 (§2.3); (2) `tempo = 0.50·latencia_af + 0.50·reacción_af`; (3) los términos de conteo `extraTaps`/`inertiaErrors` **NO entran al número** (son color de baja confianza); si alguna vez se conservaran como ajuste, se aplican **ANTES del clamp** y se re-clampa; (4) **clamp final a [0,100]**.
- **Tres zonas por PERCENTIL DENTRO DE LA CELDA DE EDAD** (no cortes absolutos, A8): **< p33 → "esta vez respondió tomándose más tiempo"**; **p33-p67 → zona intermedia** (incertidumbre, lenguaje graduado, sin cerrar rótulo); **> p67 → "esta vez respondió rápido"**. Los viejos cortes fijos 59/75 se **reemplazan** por p33/p67 de la celda: un corte absoluto no respeta la varianza por edad.
- **Léxico puramente cronométrico (A2):** se describe la **conducta observada** ("respondió tomándose más tiempo" / "respondió rápido"), NO disposiciones ni estilos cognitivos. **Prohibido "reflexivo, impulsivo, meditado, ágil, calmo, tranquilo, nervioso"** en el afecto-guard/motor-gate (igual que ya se prohíbe "impulsivos/nerviosos"). El vocabulario del tempo no reutiliza ningún nombre de eje ni de veta.
- **Exigir los dos mini-juegos de tempo** (A: latencia, B: reacción) o marcar `motor_narratable = false`. La **Adaptación faltante NO bloquea el tempo** (ya no pesa en él): bloquea solo el matiz de adaptación de §5. `motor_narratable = false` también en fallback por tiempo de respuesta.

### 2.3 Normalización por edad — un solo mecanismo (C7/§F + A8 + M1)
- **Un solo mecanismo de edad (A8), corregido en R4-D.** El argumento de "invarianza del percentil" de la v3 estaba **mal aplicado**: un percentil es invariante a una transformación monótona **común a todos los sujetos**, PERO `f(edad)` **no es común** dentro de una celda anual: es una **familia por MES**. Como `f(edad)` se interpola por meses, dentro de la celda de 8 años hay un **gradiente de ~4.3%**, así que **percentilar el valor CRUDO conserva el confound de edad intra-celda**. Corrección: **se percentila el valor AGE-FAIR `x / f(edad)` DENTRO de la celda**, no el crudo. Se elige UN mecanismo, pero sobre el valor ya neutralizado por edad:
  - **El banding del tempo se define por PERCENTIL DEL VALOR AGE-FAIR `x/f(edad)` DENTRO DE LA CELDA DE EDAD** (no-paramétrico; p33/p67, alineado con §2.2). **No se lo llama "robusto en muestra chica" (R4-E):** un percentil p33/p67 de celda con `n` bajo es de **altísima varianza muestral**.
  - **`f(edad)` entra por partida doble:** neutraliza la edad **antes** de percentilar (age-fair) y **también** escala el **número 0-100** que se muestra, dicho explícito, **nunca como banda cruda** (ni para RCI, que además se elimina — §15/B1).
- **La banda se protege con el MISMO shrinkage que hoy solo protege el número 0-100 (R4-E).** Mientras el **peso empírico de la celda sea bajo**, la banda (el clasificador que dispara el lenguaje) se define **contra la referencia bibliográfica ENCOGIDA**, no contra el percentil crudo de la celda. **Regla dura:** se narra **"<p33"** o **">p67"** **solo si el intervalo de confianza del niño queda ENTERO de un lado del corte**; si el intervalo **cruza** el corte, se **degrada a la zona intermedia** (no se cierra rótulo).
- **El percentil intra-celda NO controla la varianza madurativa (R4-D, ver §13.6).** Un tempo relativo bajo **NO distingue** a un madurador tardío de una disposición: el motor **jamás** se lee como característica del niño.
- **Modelo de edad corregido (multiplicativo, no piso-fijo).** El modelo piso-fijo `score = 1 − (x − F) / (R · f(edad))` **contradice el enlentecimiento multiplicativo del desarrollo**: Kail muestra que **media Y desvío escalan por el mismo factor**, así que un piso constante `F` es insostenible. Se pasa a **reescalado multiplicativo** (`x / f(edad)`). El piso de **800 ms** de la v1 debe **documentar su fuente**: si incluye tiempo de decisión, **madura con la edad y NO puede ser fijo**.
- **Falsa alternativa "piso `F(edad)`" corregida (R4-F2).** Dividir `x / f` **equivale a escalar SIMULTÁNEAMENTE el piso `F` Y el rango `R` por el mismo `f`**. Escalar **solo el piso** (dejando `R` fijo) **NO es equivalente** y **contradice a Kail** (media Y desvío escalan por el mismo `f`, y el **desvío se corresponde con el RANGO**, no con el piso). Regla: aplicar `f` a **piso Y rango a la vez**, o directamente **dividir el valor por `f`**; **nunca escalar solo el piso**.
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
- **Encogimiento empírico-Bayes hacia la CURVA DE EDAD, NO hacia el grand mean crudo (corregido R4-F):** `peso_celda = n_celda / (n_celda + k)`. El grand mean *pooled* es un **target sesgado**: como el tempo **varía monótonamente con la edad** (Kail), las medias por celda **NO son intercambiables**, y encoger hacia la media global cruda **jala las celdas jóvenes hacia la media global (más rápida)**. Se encoge hacia la **predicción condicional a la edad** (`f(edad) · media_adulto`); equivalentemente, se **aplica `x/f(edad)` ANTES de estimar normas** y se encoge hacia el **grand mean de los valores age-fair** (neutral a la edad). **`k` se estima de la varianza ENTRE CELDAS de los residuos age-fair** (no se fija a mano; el viejo `k ≈ 100-200` queda solo como semilla inicial). La **etiqueta** de la norma sigue la regla dinámica de §2.3.
- Percentiles robustos (p10/p90) para floor/range.
- Nulo de calibración: **enumeración exacta** (§7) para señales de votos; **permutación sobre respuestas reales** para el motor cuando haya datos. Nunca Monte Carlo.
- Excluir del conteo y de las normas: `marianonoceti@gmail.com`, `mariano@yacare.io`, `federico.diaz.goberna@gmail.com`, y todo `is_demo`.

---

## 3. Banda de confianza — TRES niveles calibrados al nulo (C2/§A; intensificadores re-gateados A9)

La escala de 12 votos **no sostiene 4 bandas honestas**. Se usan **3**, con el corte por encima del ruido y `P(banda)` bajo azar documentado. Masas exactas por enumeración de las 455 (script `scripts/enum-bandas.mjs`, determinista). **El registro de intensidad se re-gatea por A9** (la improbabilidad no intensifica; la confianza del instrumento es el techo):

| Banda | Regla sobre B | P(banda) bajo azar | Registro de lenguaje (A9) | Prohibido |
|---|---|---|---|---|
| **Definido** | **B ≥ 4** | **7.06%** (B=4: 4.28% · B=5: 1.98% · B≥6: 0.79%) | Lenguaje **afirmativo solo desde B ≥ 5** ("se inclina **con claridad** hacia X", P(B≥5)=2.78%) — **ese es el registro MÁXIMO alcanzable**. **A B=4 el lenguaje es tentativo** (usa el registro de "Con matices"). **NO existe registro "fuerte / marcado" (R4-A).** | "es / puro / definitivamente"; **"con claridad" a B=4**; **"fuerte / marcado" en cualquier banda** (salvo describir el margen de votos, R4-A) |
| **Con matices** | **B = 2 o 3** | **33.67%** (B=2: 23.85% · B=3: 9.82%) | "se inclina, **con margen visible**" (tentativo). Junto con B=4 forma el registro tentativo **B=2-4** (37.95%). | **"claramente" / "con claridad"** |
| **Mezcla** | **B = 0 o 1** | **59.27%** (B=0: 22.79% · B=1: 36.48%) | "dos formas **casi con el mismo peso**", sin dominante claro | cualquier sustantivo de arquetipo único |

- **Nota de intensificadores (A9, endurecida R4-A):** el registro de lenguaje se gatea por **intensificador, no solo por banda**. El registro **tentativo** ("se inclina, con margen visible") cubre **B = 2-4** (37.95%); el **afirmativo** ("con claridad") se reserva para **B ≥ 5** (2.78%) y **ese es el tope**. **El registro "fuerte/marcado" queda ELIMINADO (R4-A):** contradice el eje rector A9 (la rareza del patrón NO intensifica el lenguaje), y con techo de confianza media el máximo alcanzable es "con claridad". Única excepción permitida: **"marcado" SOLO como descriptor del MARGEN DE VOTOS de esta toma** ("el margen fue amplio esta vez"), **nunca del niño ni del rasgo**. La banda estructural **Definido** (B≥4) **no autoriza intensidad por sí sola**: a B=4 se usa lenguaje tentativo, porque el techo lo pone la confianza del instrumento (media/baja), no la banda.
- **Reencuadre del nulo (R4-B):** `P(banda)` mide **separación de la respuesta uniforme al azar**, no ausencia de rasgo; y el azar uniforme **no es la única alternativa** (las tendencias de respuesta no-DISC lo vencen igual). Por eso, hasta re-enumerar contra un **nulo de deseabilidad** (§14), estas `P` se rotulan **"referencia optimista"**.
- **Referencia del nulo:** `P(B≥2)=40.73%`, `P(B=2-4)=37.95%`, `P(B≥5)=2.78%`, `P(B≥6)=0.79%`, `P(B=0-1)=59.27%`. Gate del nombre adoptado (§3.1/B3): `B≥4 O (B≥2 ∧ top_count≥7) = 7.68%` (vs el viejo `B≥2 ∧ top_count≥6 = 20.90%`, demasiado laxo; el componente `B≥2 ∧ top≥7` solo = 5.70%). Veta, **condicional a primario con brecha ≥ 1** (denominador `P(B≥1)=77.21%`, R4-H): `P(B2≤1)=75.72%`, `P(B2=2-3)=23.14%`, `P(B2≥4)=1.15%`; el **nombre-blend completo por azar = 0.092%** (~0.09%; no-opuesto ~0.06%). Las masas **marginales** sobre las 455 (`P(B2≤1)=71.40%`, `P(B2=2-3)=26.49%`, `P(B2≥3)=5.86%`, `P(B2≥4)=2.11%`) se citan **solo como referencia** (incluyen co-líderes `B=0` que §3.2 excluye). Cada corte se documenta con su `P`; el script que lo enumera es reproducible. **La validez de estas `P` como exactas depende del balance del banco de ítems** (§7, §13/B2).
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
- **Monitor de sistema (poblacional, no regla por chico):** telemetría de la **fracción de vetas afirmadas (`B2 ≥ 4`, con primario con brecha ≥ 1 — dominante único, no co-líderes) que caen en el eje opuesto, contra el nulo `1/3` (33.3%)** — bajo el azar los 3 ejes no-dominantes son equiprobables. Las masas exactas (R4-H2): `P(B2≥4 ∧ B≥1) = 0.885%`; su tercio (fracción esperada en el opuesto) `× 1/3 = 0.295% ≈ 0.30%`. Si la fracción observada es **< 1/3** → consistente con **estructura circumpleja real** (opuestos suprimidos, como espera la teoría). Si **≥ 1/3** → sube la **sospecha de artefacto de ítems**. Se toma sobre **primario con brecha ≥ 1** (no "definido"): restringirlo a la banda **Definido (`B ≥ 4`) daría `0.012%`**, con **muy poca potencia**, por eso se usa `B ≥ 1`. Los `B=0` son co-líderes sin veta y quedan fuera. No cambia ningún informe: alimenta la revisión del banco (§13/B2).

---

## 4. Momento notable — regla determinista + dependencia declarada

- **Candidato** = respuesta cuyo eje ≠ dominante.
- **Citable** solo si: (a) su eje es el secundario (corroboración) **o** (b) ocurrió en escena firma (la tormenta, Q5-Q7). Evita citar ruido.
- **Prioridad:** 1) escena firma; 2) elección hacia el eje secundario; 3) desempate por escena más temprana.
- **Tope:** 1 momento (2 solo si ambos ejes están en banda Definido o Con matices). Texto = **la escena literal**, nunca interpretado ("en la tormenta eligió buscar a los compañeros"), sin leer afecto ni intención.
- **Caso nulo** (chico consistente): citar su escena más representativa del dominante ("sostuvo su forma en…"). La sección siempre existe.
- **Dependencia declarada, ahora de TODO el informe (C11, extendida R4-C):** el momento notable, "ante la tormenta" (§5) y "ante lo inesperado" (§5) **comparten las escenas de tormenta Q5-Q7**; y **`Q12` cumple DOBLE FUNCIÓN**: es a la vez **uno de los 12 votos del perfil** y la **escena "En la meta"** (§5), igual que Q5-Q7 son voto y escena de tormenta. Además, **el perfil y todos los temas de grupo (`I`/`S`) salen del mismo set de 12 elecciones**. Nota fija que va en el informe: **"el perfil y todos los temas basados en elecciones vienen del mismo cuestionario de 12 respuestas; no son mediciones independientes que se confirmen entre sí."** No se presentan como ~6-7 evidencias independientes que "coinciden": es **un solo set de 12 respuestas cortado varias veces**, leído con distinto foco. El informe lo dice explícitamente para no fabricar una falsa triangulación.

---

## 5. Los temas del informe — fuentes deterministas, renombradas y honestas (C4/C5/C6/C11/§D; ronda 3: A2/A3/A4/A5/X1/M1)

Cada tema sale de UNA fuente determinista mapeada a una lectura pre-escrita. Sin invención. Cambios de la ronda 3:

**"Cuánto lo mueve el grupo" (renombrado desde "cómo se lleva con los demás", C4; corregido A3):**
- Fuente: **I y S por SEPARADO. NUNCA se suman.** `I` (**influencia: persuasión, sociabilidad expansiva, ganas de involucrar a otros** — NO "arousal" ni "búsqueda de estímulo/sensación"; esa era una deriva conceptual, corregida R4-DISC a) y `S` (estabilidad, pertenencia, armonía) son **orientaciones distintas y a menudo opuestas**; sumarlas haría que un mismo puntaje alto signifique cosas contrarias. Se **reportan por separado**, con lenguaje distinto para cada uno, o se **condiciona la lectura a cuál de los dos pesa más**. **Ambos temas de grupo salen de las mismas 12 elecciones que el perfil** (dependencia declarada, §4/R4-C): no confirman nada de forma independiente.
- Lectura **intra-individual** (§G, sin Alto/Medio/Bajo): "el vínculo con el grupo aparece **entre sus motores más elegidos**" vs. "aparece **menos que su propio empuje**", dicho por separado para `I` y para `S`.
- **Nunca** leer bajo-I como individualismo: se cruza con `S` antes de decir nada. Aclaración fija: **no mide habilidad social, popularidad ni amistades.**

**"En la meta, qué eligió" (renombrado desde "manejo del éxito", C5/A5) — escena literal:**
- Fuente: **la escena literal de La Meta (Q12)**, tratada como un momento notable, **sin nombre de rasgo**: "ante esta escena del juego, prefirió mirar al próximo reto" / "prefirió celebrarlo con los demás" / "prefirió repasar qué del plan funcionó" / "prefirió que todos llegaran bien" (R4-J: **preferencia ante una escena hipotética**, no conducta observada ni predicción).
- **Micro-rótulo `n=1` obligatorio (R4-HIG b):** esta sección viene de **UNA sola elección** (Q12). Se rotula visiblemente como una única escena, no como una tendencia. Además Q12 tiene **doble función** (voto del perfil + esta escena), dependencia declarada §4/R4-C.
- **Se elimina la regla de convergencia** (era **circular**: Q12 es uno de los votos que COMPONEN el eje dominante con el que "convergía"). Queda **siempre en la escena observada**, descriptiva.
- **Prohibido el sintagma "maneja el éxito"** (y "así maneja el éxito").

**"Ante lo inesperado" (renombrado desde "cómo responde a los cambios", C6; corregido X1):**
- **Dos lentes INDEPENDIENTES, no una contradicción a reconciliar (X1):** el **eje `S`** (elecciones, una lente de **preferencia ante escenas hipotéticas** — R4-J) y **`avgAdaptation`** (juego de reglas cambiantes, una lente de **reacomodo observado en el juego**). **No tienen por qué coincidir**, y cuando difieren **no se "cierra" ninguna contradicción**: se narran las dos por separado ("en sus elecciones prefirió…; en el juego de reglas cambiantes, se reacomodó…"), cada una con su confianza (`S` = elecciones; adaptación = media).
- Corrección por edad aplicada a `avgAdaptation` (§2.3); en edades menores, si no es narratable, se marca no-narratable en vez de forzar.

**"Ante la tormenta / lo adverso" (renombrado desde "frustración", C11; corregido A4):**
- Fuente: **eje dominante de las elecciones en las escenas de tormenta (Q5-Q7)**. Se emite una tendencia de **preferencia SOLO si las 3 de 3 escenas coinciden** en eje ("ante esta escena de tormenta del juego, prefirió…"). **Con 2 de 3 el azar ya cruza el umbral el 62.50% de las veces**, así que **2/3 NO alcanza**: si no hay 3/3, se ancla a la **escena literal del juego** ("en las escenas de tormenta del juego, prefirió…"), sin narrar tendencia. Ante **1-1-1**: "eligió de formas distintas según la escena".
- **Es una PREFERENCIA ANTE UNA ESCENA DE FICCIÓN, no conducta real ni predicción (R4-J).** Elegir qué haría un personaje en una tormenta de ficción **NO es cómo el niño regula su frustración real** en la cancha. Esto es **especialmente delicado en este tema**, donde el adulto es quien **más tiende a leer regulación emocional real**: por eso se enmarca explícito como "lo que prefirió en esta escena del juego", nunca "así maneja la adversidad".
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
| 7 | **Muy definido** | `B ≥ 6` | Definido | 104 | 0.79% | Sí |

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
- Valores nulos publicados y auditables: `P(B=0)=22.79%`, `P(B=1)=36.48%`, `P(B=2)=23.85%`, `P(B=3)=9.82%`, `P(B=4)=4.28%`, `P(B=5)=1.98%`, `P(B≥6)=0.79%`; `P(B=2-4)=37.95%`, `P(B≥5)=2.78%`; `P(top≥6)=21.73%`; `P(B≥2 ∧ top≥6)=20.90%` (gate viejo); componente `P(B≥2 ∧ top≥7)=5.70%`; **gate adoptado `B≥4 O (B≥2 ∧ top≥7) = 7.68%` (§3.1/B3)**; `P(B≥1)=77.21%` (denominador de la veta). Veta **condicional a primario con brecha ≥ 1** (R4-H): `P(B2≤1)=75.72%`, `P(B2=2-3)=23.14%`, `P(B2≥4)=1.15%`; **nombre-blend completo por azar `P(B2≥4 ∧ primario nombrado)=0.092%`** (~0.09%; no-opuesto `×2/3 = 0.061%` ~0.06%). Marginales sobre las 455 **solo como referencia**: `P(B2≤1)=71.40%`, `P(B2=2-3)=26.49%`, `P(B2≥3)=5.86%`, `P(B2≥4)=2.11%` (incluyen co-líderes `B=0` que §3.2 excluye). Ejes opuestos (monitor §3.2/R4-H2): fracción con veta=opuesto entre `B2≥4` con **primario con brecha ≥ 1** (no "definido"), nulo `1/3`; `P(B2≥4 ∧ B≥1)=0.885%`, su tercio `= 0.295% ≈ 0.30%`; restringido a `B≥4` daría `0.012%` (poca potencia).
- **Alcance de validez del nulo (B2 — NUEVO; reforzado R4-B).** La enumeración multinomial(¼) es **exacta como aritmética**, pero **solo describe el azar real** si el banco está **balanceado** (cada ítem expone los 4 ejes exactamente una vez), las respuestas son **independientes** y **no hay sesgos sistemáticos no-DISC** (posición, color, aquiescencia, complacencia; marcado en edades 8-10). Además, el nulo uniforme mide **separación de la respuesta al azar, no presencia de rasgo**: las **tendencias de respuesta no-DISC** (deseabilidad, aquiescencia, comprensión) **vencen ese nulo igual que un rasgo**, y en un DISC forzado el sesgo es **direccional** (las opciones **D** son menos deseables que **S/I** entre 8-16, subseleccionando D). Las `P(banda)` se tratan como **exactas SOLO tras VERIFICAR ese balance** con un chequeo objetivo (§13/B2); mientras tanto son **"referencia optimista"**, no una garantía.
- **Agenda: re-enumerar contra un nulo de DESEABILIDAD (R4-B, §14.1).** Estimar tasas base de elección por opción de los datos, re-computar las `P(banda)` contra ese nulo y verificar **paridad de tasa de ELECCIÓN por eje** (no solo de exposición), reportando la subselección de D como bandera.
- A los **500 juegos por celda de edad** (no global) se re-enumera/permuta con la distribución propia (§2.4), moviendo los cortes solo por encima del ruido y etiquetando las normas dinámicamente (§2.3).
- **Separación clave (C, §14):** esta enumeración da **trazabilidad y reproducibilidad**, NO validez de constructo. "Determinista/reproducible" ≠ "válido".

---

## 8. Estructura del informe (informe ÚNICO) — con componentes fijos de marco y de límites

Un solo informe (ArgoOne + coach). Estructura idéntica para todos; contenido distinto por chico. Mockup: `preview/informe-final.html`. Cada sección: presencia siempre, largo fijo, forma fija, caso nulo definido (contrato de formato) y tooltip explicativo.

1. **Su perfil** (nombre `[Eje primario] con veta [Eje secundario]` **solo si pasa el gate §3.1** —`B ≥ 4 O (B ≥ 2 ∧ top_count ≥ 7)`— **y**, para la veta, **`B2 ≥ 4` sin eje opuesto** —§1/§3.2—; si no, par/tendencia sin sustantivo).
2. **Qué tan clara es la inclinación** (banda de confianza a 3 niveles §3, con la lectura honesta de la incertidumbre; intensidad gateada por A9; renombrado en R4-A: el título ya no aplica "marcado" al niño/perfil). Extremos: "mezcla de dos" ↔ "una inclinación clara".
3. **Su motor** (insights §2: tempo de decisión y reacción, per-child, **léxico cronométrico**, banda de incertidumbre; **lectura normativa relativa a la edad con intervalo ancho**; `motor_narratable=false` ⇒ se omite). Es una lente de señales medidas, no un tipo.
4. **Cómo decide** (elecciones; sin leer velocidad como decisión).
5. **Qué lo enciende.**
6. **Palabras que lo encienden y las que lo apagan** (**preferencias del presente, no sensibilidades fijas** — X4).
7. **Guía rápida.**
8. **Checklist del día.**
9. **Consejo de reset.**
10. **En la meta, qué eligió** (escena literal de Q12, §5; sin "maneja el éxito"; **micro-rótulo `n=1`: viene de UNA sola elección** — R4-HIG b).
11. **Ante la tormenta / lo adverso** (§5; **solo si 3/3**, sin afecto).
12. **Cómo responde a los cambios / ante lo inesperado** (eje `S` y flexibilidad como **dos lentes independientes**, §5).
13. **Cuánto lo mueve el grupo** (`I` y `S` **por separado, nunca sumados**, intra-individual, §5).
14. **Ecos fuera de la cancha.**
15. **Cómo viene evolucionando** (desde el 2.º perfilamiento, **descriptivo, sin gate RCI** —ver §15/B1—; misma fuente que el dashboard).
16. **[FIJO] Marco de lectura / barandas** (componente visible §12): "foto del presente, no diagnóstico, el perfil no se compara entre niños, no se selecciona, no es una definición de quién es el chico" + nota al adulto de no devolverle la etiqueta.
17. **[FIJO] Qué mira y qué no mira este perfil** (componente visible §13): los límites inherentes en lenguaje simple.

Los componentes 16 y 17 son **parte del contrato de formato**, no solo del doc: se renderizan siempre, en el informe del adulto y en la superficie del coach.

- **Nota de dependencia de TODO el informe (fija, R4-C):** el perfil (§8.1), "Su motor" aparte, y **todos los temas basados en elecciones** (§8.5-8.13: qué lo enciende, palabras, en la meta, ante la tormenta, ante lo inesperado, cuánto lo mueve el grupo) **provienen del mismo cuestionario de 12 respuestas; no son mediciones independientes que se confirmen entre sí.** `Q5-Q7` (tormenta) y `Q12` (en la meta) tienen **doble función** (voto del perfil + escena). El informe evita presentar ~6-7 secciones como si "se corroboraran": son **un set de 12 respuestas cortado varias veces**.

### Renombres consolidados (para i18n y QA)
- "Cómo se lleva con los demás" → **"Cuánto lo mueve el grupo"** (`I` y `S` por separado, nunca sumados).
- "Manejo de la frustración" → **"Ante la tormenta / lo adverso"** (solo 3/3).
- **"Manejo del éxito" → "En la meta, qué eligió"** (escena literal Q12, sin regla de convergencia).
- "Cómo responde a los cambios" → integrado a **"Ante lo inesperado"** (eje `S` y flexibilidad como **dos lentes independientes**).
- El 2.º término del **nombre** = **veta (eje secundario, elecciones)**, gateada por **`B2`** (§1); los insights **medidos** de los mini-juegos → sección **"Su motor"** (tempo/reacomodo, per-child), nunca en el nombre.

---

## 9. Enforcement fail-closed + observabilidad

- **Fail-closed:** una sección no se libera hasta pasar todos los filtros. Tras un tope de reintentos, degrada al **texto estático pre-aprobado**. Nunca se sirve IA sin aprobar; nunca se deja a un niño sin informe.
- **Filtros:** palabras prohibidas + lenguaje determinista + **band-guard** (intensificadores por banda **según A9/R4-A**: "con claridad" solo **B≥5** — registro máximo; "con claridad"/"claramente" **bloqueadas a B≤4**, incluida la banda Con matices y el B=4 de Definido; **"fuerte/marcado" BLOQUEADAS en toda banda** como descriptor del niño o del rasgo — R4-A eliminó ese registro — salvo el uso permitido de "marcado" para el **margen de votos** de la toma) + closed-moment (escenas inventadas) + validador de formato + **eje correcto** + **name-gate** (bloquea sustantivo de arquetipo si no se cumple **`B≥4 O (B≥2 ∧ top_count≥7)`**) + **veta-gate** (bloquea veta en el nombre si `B2 < 4` o si es eje opuesto §3.2) + **motor-gate** (bloquea tempo si `motor_narratable=false` o zona intermedia p33-p67; **bloquea léxico no-cronométrico "reflexivo/impulsivo/meditado/ágil/calmo/tranquilo/nervioso"**) + **afecto-guard** (bloquea toda lectura emocional de señales de mini-juego, incluidas **"reflexivo/impulsivo/meditado/ágil/calmo/tranquilo/nervioso"** y "impulsivos/nerviosos") + **opuesto-guard** (bloquea "raro/inusual/en tensión/contradictorio" y el "pero" de conflicto cuando `veta_opuesta=true`) + **trazabilidad** (toda magnitud/ejemplo/momento se rastrea a la ficha o a la biblioteca).
- **Objetivo:** caída al respaldo estático **≤ 1%**, registrada por informe. Alerta si supera el umbral.

---

## 10. Persistencia

- Se guarda la **ficha de evidencia completa** por perfilamiento (vector de votos, `B`, **`B2`**, top/second/third_count, forma, banda, **veta / `veta_opuesta`**, sub-motores age-fair, `motor_narratable`, edad en meses, `factorEdad`) → regeneración determinista + historia/evolución.
- Persistir `question_id` por respuesta + versionar el banco (`question_version`): requisito del momento notable (§4), de la estabilidad de respuestas y del gate de evolución (§15).
- **Versionar cada perfilamiento por VERSIÓN DE MÉTODO (`method_version`, R4-HIG c):** comparar un perfilamiento nuevo contra uno viejo **mezcla cambio-de-instrumento con cambio-del-niño**. Sin registrar qué versión del método (v3/v4/…) produjo cada ficha, la evolución (§15) no puede separar una cosa de la otra. Es requisito para cualquier lectura de trayectoria.

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
6. **Nada de bien/mal** ("aprobó/reprobó", "acertó/falló", "le costó"). En los **ejes DISC** todo es estilo, **ningún polo es mejor** (simetría DISC). **Excepción honesta (R4-DISC e): el MOTOR (tempo cronométrico) SÍ tiene valencia de desempeño** y NO se le aplica esa simetría; por eso el tempo va siempre con **intervalo ancho** y **nunca se rankea ni selecciona** con él. La simetría "ningún polo es mejor" cubre los ejes de elección, no el tempo.
7. **El eje DISC no sale de la velocidad.** El tempo alimenta "Su motor" y el color; el eje se define por las **elecciones**.

---

## 13. [visible] Límites inherentes del método (se asumen, no se corrigen)

Componente fijo del informe/superficie (§8.17), en lenguaje simple. Estos límites **no** tienen arreglo de ingeniería *hoy*; se comunican con honestidad. **Por cada límite se declara qué DATO cerraría la brecha** (agenda empírica, §14):

1. **Comparación entre niños no válida PARA EL PERFIL.** Los conteos DISC son **ipsativos** (suman 12): dicen cómo se ordena el chico **consigo mismo**, no cómo se compara con otro. **No hay ranking de perfiles.** (El **MOTOR** es normativo y sí admite una **lectura relativa a la edad**, con **intervalo ancho**, pero tampoco se usa para rankear ni seleccionar — §2.3/M1.)
2. **Certeza acotada por la NATURALEZA del instrumento (no por calibración).** Son **12 elecciones ipsativas de UNA sola toma**, midiendo personalidad, que a estas edades tiene **baja estabilidad rank-order**. Por eso el techo es **tentativo para TODO `B`** (no solo cuando el nulo lo permite): más de la mitad de los perfiles posibles caen, bajo azar, en "mezcla o con matices" (§3), y el **nombre-blend completo (veta afirmada) aparece por azar en ≈0.09% del nulo** (§1/R4-H, no ~2%). **La improbabilidad de un patrón NO sube la intensidad** (§0/A9/R4-A): el techo lo pone la confianza media/baja del instrumento, y el registro máximo es "con claridad". **Dato que cierra la brecha:** **test-retest** (medir la estabilidad real del perfil entre dos tomas).
3. **El cambio en el tiempo tiene fiabilidad NO ESTIMABLE sin test-retest (R4-HIG a).** No es un cero medido: es una cantidad que **no se ha estimado** porque falta el coeficiente test-retest. Sin re-medición controlada no se puede separar cambio real de ruido; por eso la evolución se narra **SOLO de forma descriptiva** (§15), sin afirmar "cambió" ni "estable", y **sin invocar RCI/SEM**. **A estas edades un cambio observado es tan compatible con maduración normal como con un cambio de disposición** (dos tomas no permiten afirmar trayectoria). **Dato que cierra la brecha:** **dos tomas cercanas en una cohorte** (para estimar fiabilidad del cambio).
4. **Validez de constructo no establecida.** El método es reproducible y trazable, pero **no está validado** contra criterios externos (§14). En particular, **sin análisis a nivel ítem** (el `question_id` recién se persiste, §10) **no hay evidencia de homogeneidad de los ítems de un mismo eje**. Por eso el claim honesto es **"eligió con más frecuencia la familia de opciones X"**, NO "tiene el eje X". **Dato que cierra la brecha:** **homogeneidad ítem-eje** (que los ítems de un eje covaríen entre sí).
5. **Muestra autoseleccionada.** Las normas son de quienes usan Argo, **no del desarrollo general**; se etiquetan dinámicamente ("referencia bibliográfica" mientras el dato empírico es escaso, "población Argo" cuando domina — §2.3/§2.4).
6. **Motor de una sola toma, con intervalo ancho y CON VALENCIA.** El tempo es una **foto** de un momento, contaminada por **dispositivo, pantalla, maduración y motivación** (una web app sobre teléfonos ajenos: la latencia **no se controla**, §2.1/R4-G), así que la comparación peer **no es del todo honesta**; es **defendible con caveats** (se mantiene normativo por decisión del owner, con intra-individual como fallback, §2.1/§14). El intervalo de confianza es amplio, sobre todo a menor edad, y el **percentil intra-celda NO controla la varianza madurativa** (R4-D): un tempo relativo bajo **NO distingue** madurador tardío de disposición. Es además una **medida con valencia de desempeño** (R4-DISC e), razón extra para el intervalo ancho y para no rankear. Su **casi-unicidad por chico es granularidad de medidas continuas y ruidosas, no precisión** (M1). **Dato que cierra la brecha:** **latencia de dispositivo por sesión** (como covariable/exclusión) **+ test-retest**.
7. **La calibración al azar solo vale si el banco está balanceado, y el nulo uniforme NO es la única alternativa (B2 + R4-B).** El nulo multinomial(¼) asume que **cada ítem expone los 4 ejes exactamente una vez**, que las respuestas son **independientes** y que un chico de **8-10** no trae **sesgos sistemáticos no-DISC** (posición, color, aquiescencia, complacencia). Además, `P(banda)` mide separación de la **respuesta uniforme al azar**, no presencia de rasgo: las **tendencias de respuesta no-DISC vencen ese nulo igual que un rasgo**, y el sesgo es **direccional** (las opciones **D** son menos deseables que **S/I**, subseleccionando D y pudiendo fabricar "Definidos" de artefacto). Donde el ¼ no sea defendible, las `P(banda)` **NO son exactas** y se rotulan **"referencia optimista"**. **Las edades 8-10 quedan flagueadas.** **Dato que cierra la brecha:** **tasas base de ELECCIÓN por opción** (para estimar un nulo de deseabilidad y verificar paridad de tasa de elección por eje, no solo de exposición).
8. **Efecto Barnum / Forer (R4-DISC c).** El lenguaje **tentativo y no-deficitario** que exige el método **agrava** el efecto: produce frases que **casi cualquier adulto acepta como propias del niño**, dando una sensación de acierto que no es evidencia de validez. Se asume como límite, no se corrige por copy. **Dato que cierra la brecha:** contrastar el reconocimiento del informe real contra un informe **genérico/barajado** (control Forer).
9. **Riesgos ASUMIDOS por decisión del owner (2026-07-06), documentados, NO mitigados por diseño.** (a) Se **entrega el sustantivo-arquetipo también a niños de 8-11** (instrumento más débil a esa edad, mayor riesgo de etiqueta). (b) El informe **nombra un arquetipo por niño** que, **exportado a un club, puede usarse de facto como selección de menores**. El owner **evaluó ambas recomendaciones del panel** (un **techo de nombramiento por edad** y un **informe de club separado**) y **decidió AVANZAR SIN ELLAS, bajo su responsabilidad**. Se registra textual, sin editorializar.
10. **Asentimiento del adolescente (13-16) y derecho del niño a ver / cuestionar su perfil.** Es un **gancho de diseño ético-legal PENDIENTE**, no un límite estadístico: falta el flujo que recoja el asentimiento del adolescente y que permita al niño acceder y objetar su propio perfil. **Dato/entregable que cierra la brecha:** diseño del consentimiento/asentimiento por edad y de la vista del niño.

---

## 14. [visible] Trazabilidad/reproducibilidad ≠ validez (C, §I)

- **Lo que el método SÍ da:** **trazabilidad** (toda afirmación se rastrea a un hecho de la ficha o a la biblioteca pre-aprobada) y **reproducibilidad** (la misma ficha produce el mismo esqueleto; el nulo se enumera de forma exacta y auditable).
- **Lo que el método NO da (aún):** **validez de constructo, de criterio y predictiva.** No se ha establecido que las señales midan lo que dicen medir contra referencias externas, ni que predigan nada.
- **Regla de discurso:** **"determinista/reproducible" no es un argumento de validez.** Prohibido presentar la trazabilidad como si fuera evidencia de que el perfil "es verdadero". El claim máximo permitido sigue siendo: *anclado en teoría, foto del presente, no clínico.*

### 14.1 Agenda empírica — qué DATO cierra cada brecha (R4, PILA 3)

Cada límite de §13 tiene un dato que lo cerraría. Mientras no exista, el caveat se mantiene:

1. **Test-retest** (dos tomas cercanas por niño): estima la **estabilidad rank-order** del perfil (cierra §13.2) y la **fiabilidad del cambio** (cierra §13.3, hoy NO ESTIMABLE); es el prerrequisito para reintroducir cualquier gate de cambio (RCI/SEM) en §15.
2. **Nulo de DESEABILIDAD (R4-B):** estimar **tasas base de elección por opción** con los datos reales, **re-enumerar las `P(banda)` contra ESE nulo** (no el uniforme ¼), y que el **chequeo de balance del banco verifique paridad de tasa de ELECCIÓN por eje** (no solo de exposición), **reportando la subselección de D como bandera**. Hasta tenerlo, las `P` son **"referencia optimista"**. Cierra §13.7.
3. **Homogeneidad ítem-eje:** con el `question_id` ya persistido (§10), analizar a **nivel ítem** si los ítems de un mismo eje covarían; sin eso, el claim honesto es "eligió la familia de opciones X", no "tiene el eje X". Cierra §13.4.
4. **Latencia de dispositivo por sesión (R4-G):** registrarla como **covariable o criterio de exclusión** del tempo. Si el ruido resulta demasiado, **migrar el motor a lectura INTRA-INDIVIDUAL** (fallback documentado; el owner mantiene el motor normativo hasta entonces). Cierra parte de §13.6.
5. **Control Forer/Barnum:** contrastar el reconocimiento del informe real contra uno **genérico/barajado** para medir cuánto del "acierto" es efecto Barnum. Cierra §13.8.
6. **Ganchos ético-legales PENDIENTES (no estadísticos):** flujo de **asentimiento 13-16** y **vista del niño** para ver/objetar su perfil (§13.10). Y quedan **registrados como riesgos asumidos por el owner** (sin mitigar por diseño): sustantivo-arquetipo a 8-11 y uso de facto del nombre como selección en clubes (§13.9); el owner decidió avanzar sin el techo de nombramiento por edad ni el informe de club separado que recomendó el panel.

---

## 15. [Detalle de §8.15] Evolución — descriptiva hasta tener test-retest (C1/§C, degradado en la ronda 3 por B1)

- **El gate RCI NO es computable:** requiere un **coeficiente de fiabilidad test-retest** que el método **no tiene** (§13.3: la fiabilidad del cambio es **NO ESTIMABLE**, no un cero medido — R4-HIG a). Hasta tener **datos test-retest reales**, la evolución se narra de forma **PURAMENTE DESCRIPTIVA**.
- **Comparar solo entre perfilamientos de la MISMA versión de método (R4-HIG c).** Cada ficha guarda su `method_version` (§10). Comparar contra un perfilamiento producido por el método viejo **mezcla cambio-de-instrumento con cambio-del-niño**; se declara la versión de cada toma y no se lee como trayectoria un salto que puede ser solo un cambio de método.
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
| R3-A1 | **Veta gateada por su propio estadístico `B2`** (B2≤1 sin veta / 2-3 tentativa / ≥4 afirmada). Nombre-blend completo ~2% del nulo *(corregido en R4-H: masas condicionales 75.72/23.14/1.15 y blend nombrado por azar ≈0.09%)*; la mayoría lidera con primario casi puro. `B` gatea solo el primario | §1, §3 |
| R3-A2 | **Léxico del tempo puramente cronométrico** ("respondió tomándose más tiempo/rápido"); "reflexivo/impulsivo/meditado/ágil/calmo/tranquilo/nervioso" prohibidos en afecto-guard/motor-gate | §2.2, §5, §9 |
| R3-A3 | **`I` y `S` NUNCA se suman**: se reportan por separado o se condiciona a cuál pesa | §5, §8, §12 |
| R3-A4 | **"Ante la tormenta" exige 3/3** (2/3 = 62.50% de azar); si no, escena literal | §5, §8 |
| R3-A5 | **"Manejo del éxito" → "En la meta, qué eligió"**; se elimina la regla de convergencia (circular); "maneja el éxito" prohibido | §5, §8 |
| R3-A6 | **Cascada B=0 ramificada** por `n_ejes_fuertes`: "Dúo en empate" (=2, 30 comps/9.85%) vs "Equilibrio" (≥3, 17 comps/12.94%) | §6 |
| R3-A7 | **Banda de tempo = solo latencia+reacción (0.50/0.50)**; Adaptación fuera del tempo (va solo a §5); `extraTaps`/`inertiaErrors` fuera del número; orden clamp explícito | §2.2, §2.3, §5 |
| R3-A8 | **Un solo mecanismo de edad**: percentil por celda = banding; `f(edad)` solo para el número; **modelo multiplicativo** (Kail); shrinkage al **grand mean Argo**; `k` estimado; norma etiquetada dinámicamente | §2.3, §2.4 |
| R3-A9 | **Eje rector recalibrado**: la improbabilidad NO intensifica; techo = confianza del instrumento. "con claridad" B≥5, B=2-4 tentativo *(en R4-A se ELIMINA el registro "fuerte/marcado": el máximo es "con claridad")* | §0, §3, §9 |
| R3-B1 | **Evolución descriptiva** hasta tener test-retest (sin RCI/SEM, sin "cambió/estable") | §15, §13 |
| R3-B2 | **Alcance de validez del nulo declarado**; verificar balance del banco; edades 8-10 flagueadas | §3, §7, §13 |
| R3-B3 | **Name-gate endurecido a `B≥2 ∧ top_count≥7`** (5.70% vs 20.90%) | §3.1, §6, §9 |
| R3-M1 | **Motor = lectura normativa relativa a la población** (dos regímenes: perfil ipsativo vs motor normativo); despersonalizado; casi-unicidad ≠ precisión; intervalo ancho siempre | §2, §2.3, §12, §13 |
| R3-O1 | **Regla de ejes opuestos**: la veta opuesta no entra al nombre, se narra en el cuerpo con eje positivo, sin "raro/pero"; sin degradar confianza extra; **monitor poblacional**: fracción `veta=opuesto` entre `B2≥4` *(en R4-H2: **primario con brecha ≥1**, no "definido")* vs `1/3` (masa ≈0.30%) | §1, §3.2, §9 |
| R3-X1 | `avgAdaptation` y eje-`S` = **dos lentes independientes** (no se reconcilia contradicción) | §5 |
| R3-X2 | Convergencia choice-RT/simple-RT **NO es validación de constructo** (varianza de método/velocidad compartida) | §2.1 |
| R3-X3 | Nombre/forma **ya son claves de selección**; mitigación = **diseño de interfaz** (no grilla ordenable por arquetipo) | §12 |
| R3-X4 | "Palabras que lo apagan" = **preferencias del presente**, no sensibilidades fijas | §8, §12 |

### Ronda 4 — pulido final (qué cambió sobre la ronda 3)

| # | Cambio | Dónde |
|---|---|---|
| R4-A | **Se ELIMINA el registro "fuerte / marcado"** del band-guard: con techo de confianza media el máximo es "se inclina con claridad" (solo `B≥5`); "fuerte/marcado" contradecía el eje rector A9. Única excepción: "marcado" para el **margen de votos** de la toma, nunca del niño/rasgo | §0, §3, §9 |
| R4-B | **Reencuadre del NULO:** `P(banda)` mide separación de la **respuesta uniforme al azar**, no ausencia de rasgo; la alternativa real son **tendencias no-DISC** (deseabilidad **direccional**: D subseleccionada vs S/I), que fabrican "Definidos" de artefacto. Las `P` = **"referencia optimista"** hasta re-enumerar contra un **nulo de deseabilidad** | §0, §3, §7, §13, §14 |
| R4-C | **Dependencia declarada de TODO el informe:** mismo cuestionario de 12 respuestas; **Q12 doble función** (voto + "En la meta") como ya Q5-Q7; extendido a temas de grupo (I/S). Evita la ilusión de ~6-7 secciones que "se corroboran" | §4, §5, §8 |
| R4-D | **Percentilar el valor AGE-FAIR `x/f(edad)` dentro de la celda, no el crudo** (f(edad) es familia por mes, ~4.3% de gradiente en la celda de 8; invarianza mal aplicada). Declarar que el percentil intra-celda **NO controla la varianza madurativa** | §2.3, §13.6 |
| R4-E | **Quitar "robusto en muestra chica";** proteger la **BANDA** con el mismo shrinkage que el número 0-100; **regla dura del intervalo de confianza** (rótulo <p33/>p67 solo si el IC queda entero de un lado; si cruza, zona intermedia) | §2.3 |
| R4-F | **Encoger las normas hacia la CURVA DE EDAD**, no hacia el grand mean crudo (target sesgado por el enlentecimiento monótono de Kail); `k` de la varianza entre celdas de los **residuos age-fair** | §2.4 |
| R4-F2 | **Falsa alternativa "piso `F(edad)`" corregida:** dividir `x/f` ≡ escalar **piso Y rango** por `f`; escalar solo el piso contradice a Kail (desvío ↔ rango) | §2.3 |
| R4-G | **Quitar "control de latencia del dispositivo"** como respaldo de la confianza media (web app sobre teléfonos ajenos; §13.6 ya la lista como contaminante). Declarar N real de ensayos. **Se mantiene el motor NORMATIVO (decisión del owner)**; intra-individual queda como **fallback** documentado | §2.1, §14 |
| R4-H | **Número del blend corregido:** nombre-blend completo por azar **≈0.09%** (`P(B2≥4 ∧ primario nombrado)=0.092%`; no-opuesto ~0.06%), **NO ~2%** (el 2.11% era marginal, incluía co-líderes `B=0`). Vetas **condicionales a primario con brecha ≥1** (`P(B≥1)=77.21%`): 75.72 / 23.14 / 1.15 | §1, §3, §7, §13 |
| R4-H2 | **Monitor de opuestos re-etiquetado:** "primario definido" → **"primario con brecha ≥1 (dominante único, no co-líderes)"**; `P(B2≥4 ∧ B≥1)=0.885%`, ×1/3=`0.295%≈0.30%`; restringir a `B≥4` daría `0.012%` (poca potencia) | §3.2, §7 |
| R4-J | **Los temas son PREFERENCIAS ANTE ESCENAS HIPOTÉTICAS**, no conducta observada ni predicción: "tendió a" → "ante esta escena del juego, prefirió…"; elegir en una tormenta de ficción ≠ regulación real (delicado en adversidad) | §5, §13, §14 |
| R4-DISC | Nits DISC: (a) **I = INFLUENCIA** (no arousal/búsqueda de estímulo); (b) el "12" son **4 puros + 8 blends no-opuestos**, los 4 pares diagonales no se nombran; (c) **efecto Barnum/Forer** agregado a límites; (d) sacar el "**exactamente** como DISC"; (e) el **motor tiene valencia** (no se le aplica la simetría DISC) | §1, §2, §5, §12, §13 |
| R4-HIG | Higiene: (a) "fiabilidad ~0" → **"NO ESTIMABLE"**; (b) **micro-rótulo `n=1`** en secciones de un solo ítem ("En la meta"); (c) **versionar perfilamientos por `method_version`** | §5, §8, §10, §13, §15 |
| R4-P3 | **Consolidación de §13/§14:** cada límite con el **DATO que cierra la brecha** + **agenda empírica** (§14.1). Registrados TEXTUAL los **riesgos asumidos por el owner** (arquetipo a 8-11; nombre usable como selección en clubes; avanza sin techo por edad ni informe de club separado) y el **gancho ético-legal pendiente** (asentimiento 13-16 + vista del niño) | §13, §14 |

---

**Notas de entrega para el orquestador (ronda 4, pulido final):**

- Documento corregido completo, español, con la estructura numerada 0-15 preservada. La ronda 4 (pulido final) aplica los R4-* (PILA 1: A, C, D, E, F, F2, G, H, H2, J, DISC, HIG; PILA 3: consolidación de límites §13 + agenda §14) sobre la v3, de forma coherente entre secciones y sin contradicciones internas.
- **Números del nulo (enumeración exacta de las 455, multinomial 12/¼), usados tal cual:** primario `P(B≥2)=40.73%`, `P(B=2-4)=37.95%`, `P(B≥5)=2.78%`, `P(B≥6)=0.79%`, `P(B=0-1)=59.27%`, `P(B≥1)=77.21%`; name-gate `B≥2 ∧ top≥6 = 20.90%` (viejo) vs adoptado `B≥4 O (B≥2 ∧ top≥7) = 7.68%` (componente top≥7 = 5.70%). **Veta CONDICIONAL a primario con brecha ≥1 (denominador `P(B≥1)=77.21%`, la honesta): `P(B2≤1)=75.72%`, `P(B2=2-3)=23.14%`, `P(B2≥4)=1.15%`; nombre-blend completo por azar `P(B2≥4 ∧ primario nombrado)=0.092%` (~0.09%; no-opuesto ~0.06%).** Marginales sobre las 455 solo como referencia: `P(B2≤1)=71.40%`, `P(B2=2-3)=26.49%`, `P(B2≥3)=5.86%`, `P(B2≥4)=2.11%`. Monitor de opuestos (**primario con brecha ≥1, no "definido"**): `P(B2≥4 ∧ B≥1)=0.885%`, ×1/3=`0.295%≈0.30%`, restringido a `B≥4` = `0.012%`. "Ante la tormenta" 2/3 bajo azar = `62.50%` (por eso 3/3).
- **Coherencias verificadas (R4):** la veta se gatea por `B2` (nunca por `B`); el registro **"fuerte/marcado" ya no existe** (máximo "con claridad", `B≥5`) en §0, §3 y §9; el número del blend es **≈0.09%** (no ~2%) en §1, §3, §7 y §13; las masas de veta son **condicionales** (75.72 / 23.14 / 1.15) con las marginales citadas solo como referencia; el monitor de opuestos dice **"primario con brecha ≥1"** en §3.2 y §7; el motor sigue **normativo** (decisión del owner) con intra-individual como fallback (§2.1/§14); el percentilado es del valor **age-fair** (§2.3); cada límite de §13 trae su **dato que cierra la brecha** con agenda en §14.1.
- Downstream (fuera de esta spec): **reescribir `docs/archetype-naming.md`** del esquema eje × tempo al eje × eje secundario; **no** agrega filas por ejes opuestos (se resuelven en copy, §3.2). Pendiente de producto/datos: **re-enumerar contra un nulo de deseabilidad** (R4-B), verificar el **balance del banco de ítems** con **paridad de tasa de elección por eje** (B2/R4-B), **análisis a nivel ítem** (homogeneidad ítem-eje, R4-DISC/§13.4), registrar **latencia de dispositivo por sesión** (R4-G), conseguir **datos test-retest** antes de reintroducir cualquier gate de cambio (B1), e instrumentar el **monitor de ejes opuestos** (O1). Ganchos ético-legales pendientes: **asentimiento 13-16 + vista del niño** (§13.10). Riesgos **asumidos por el owner** (§13.9), registrados sin editorializar.
- Documento persistido como `docs/METODO-CALCULO-NUEVO.md` (reemplaza la v3; git conserva la v3 en el historial).
