# Método Argo — CÁLCULO DEL PERFIL Y EL INFORME (especificación v2, corregida)

> Documento autoritativo del método reformado, **ronda 2**. Incorpora las 12 correcciones del panel de expertos (`METODO-CORRECCIONES-RONDA2.md`), las líneas rojas del análisis de constructos (`METODO-MINIJUEGOS-CONSTRUCTOS.md`) y la resolución del naming (perfil = eje primario + eje secundario; el tempo son insights per-child de los mini-juegos, fuera del nombre). Es la referencia de implementación y de re-revisión (reemplaza la v1, conservada en git). Estructura numerada idéntica a la v1 (secciones 0-12) para comparar manzana con manzana; se agregan §13 (límites inherentes visibles) y §14 (trazabilidad vs. validez), que la ronda 2 exige hacer visibles.
>
> **Principio que ordena todo (nuevo eje rector):** la certeza del lenguaje escala con la **improbabilidad bajo el azar**. El nombre, la banda, la evolución y las formas NO afirman más de lo que la separación-del-azar sostiene. Todo se calibra contra el nulo por **enumeración exacta de las 455 composiciones** de 12 votos en 4 ejes (no Monte Carlo).
>
> **Naturaleza del método (para revisores):** Argo NO es un test validado. Toma constructos públicos (DISC como puerta de entrada; funciones ejecutivas y SDT en el roadmap), los adapta y los mide por juego. Claims permitidos: "anclado en la teoría, es una fotografía del presente, no es una medida clínica". Prohibidos: "validado", "diagnóstico", "predice el rendimiento". La **confianza techo del instrumento es media** (solo tempo de decisión/reacción y costo de reacomodo llegan a media; todo lo demás es baja).

---

## 0. Arquitectura de dos capas

- **Capa 1 (determinista, sin IA).** De las 12 respuestas + métricas de mini-juego + tiempos + la ficha del perfilamiento anterior, computa una **ficha de evidencia** (hechos con magnitudes) y ensambla el **esqueleto**: qué bloque de concepto pre-aprobado aplica y en qué sección cae.
- **Capa 2 (IA, acotada).** Recibe `ficha + esqueleto + manual de estilo + palabras prohibidas` y SOLO reescribe en prosa cálida. No introduce rasgo, magnitud, eje, veta, motor, escena ni ejemplo que no esté en el esqueleto.
- **Correctitud ipsativa:** una respuesta suelta es UN VOTO (débil). Toda afirmación nace del agregado, nunca del patrón "eligió A → afirmá X".
- **Separación de fuentes (NUEVO, C9):** el **nombre** (eje primario + eje secundario/veta) sale exclusivamente de las **elecciones** (votos DISC). Los **insights de los mini-juegos** (tempo de decisión, reacomodo, etc.) salen de los **mini-juegos** (velocidad) y viven solo en el contenido del informe, nunca en el nombre. Las dos fuentes están desacopladas por diseño: el nombre son **dos ejes** (ambos de elecciones), así que ya no puede aparecer una palabra de tempo en la denominación ni un nombre contradictorio del tipo "Impulsor Sereno". Regla dura: **el eje DISC no se deduce de la velocidad**.

---

## 1. Perfil = eje primario + eje secundario (ambos desde las elecciones)

- **12 preguntas forzadas, 1 voto por eje.** Dominante = más votado; **veta = 2.º más votado**. Se conserva el **vector completo** de votos (D/I/S/C), no solo el ganador.
- Derivados: `B = votos(1.º) − votos(2.º)`; `top_count`, `second_count`, `third_count`; flags de empate (`secundario_empatado` si 2.º==3.º).
- **El nombre es un blend DISC estándar: eje dominante + eje secundario (C9/decisión G resuelta por el owner).** El perfil canónico es **`[Eje primario] con veta [Eje secundario]`** (p. ej. "Impulsor con veta Estratega"). Como el dominante tiene 4 opciones y la veta es **uno de los otros 3 ejes**, hay 4 × 3 = **12 perfiles** y ni uno más (no 132: la veta es un eje, no un arquetipo entero). La veta es un **eje** (Impulsor/Conector/Sostenedor/Estratega), no una palabra de tempo. Esto es exactamente cómo DISC describe perfiles combinados (los "blends"): la definición es estándar y defendible. Puntos críticos:
  - **La veta NO es el motor.** Las palabras de tempo (Dinámico/Rítmico/Sereno/Observador) **salen del nombre por completo**: no nombran perfiles ni vetas. Toda señal de velocidad vive solo en el contenido del informe (§2, §8) y nunca en la denominación. Esto elimina de raíz la contradicción C9: ya no puede existir "Impulsor Sereno" porque el 2.º término del nombre es siempre otro eje, medido con la misma escala de elecciones que el 1.º.
  - **Derivación (ahora trivial y definida acá, ya no un stub):** veta = eje del `second_count`. Si `secundario_empatado`, no se cierra una veta única (se presenta el par). Nada de esto toca los mini-juegos.
  - La veta se **gatea por banda** igual que el eje (§3): en "Mezcla" (B=0-1) no se compromete una veta única (el nombre no se cierra); en "Con matices" (B=2-3) la veta se ofrece con lenguaje tentativo; en "Definido" (B≥4) se afirma con claridad.
  - **Requiere reescribir `docs/archetype-naming.md`:** hoy define los 12 como eje × tempo (Impulsor Dinámico…). Debe pasar a eje × eje secundario. Es un cambio de branding real, downstream de esta spec, que va en la lista de impacto de interfaces (no en esta corrida).

---

## 2. Insights de los mini-juegos (tempo psicomotor) — fuera del nombre, per-child, con normalización por edad bien hecha

**No existe "el Motor" como un tipo ni una etiqueta.** Los mini-juegos no clasifican al chico en una categoría; producen un puñado de **insights medidos, propios de cada niño** (tempo de decisión, tempo de reacción, cómo se reacomoda ante un cambio de regla) que solo alimentan contenido del informe (§8, sección "Su motor"). Son **medidas continuas del presente**, no el "pace" de DISC ni un puntaje de capacidad; y como son continuas y multi-señal, son **prácticamente únicas por chico** (dos niños con el mismo nombre de perfil casi nunca comparten estos insights). Confianza **media** solo para tempo de decisión + reacción y costo de reacomodo; cadencia y señales de estilo son **baja**, solo color. Ningún insight entra en el nombre.

### 2.1 Qué mide y con qué respaldo (del doc de constructos)
- **Tempo de decisión** `avgLatency` (Juego A, choice reaction time) + **tempo de reacción** `avgReaction` (Juego B, TR simple). Su **convergencia** entre juegos sostiene la lectura del motor (confianza media). Si divergen, lenguaje aún más tentativo.
- `avgCadence`, `stdDevLatency`, `trend`, `extraTaps` → **confianza baja**, solo como color, nunca como afirmación autónoma. La etiqueta interna del código "impulsivos/nerviosos" para `extraTaps` está **prohibida** (no mide afecto).

### 2.2 Banda de incertidumbre del motor (NUEVO, C8/§E)
- Sobre la señal age-fair de tempo (0-100), tres zonas con **amortiguación**, aplicadas al **insight de tempo** (no a un "tipo"): **≤ 59 → "reflexivo, se toma su tiempo"**, **60-74 → "en zona intermedia" (incertidumbre, lenguaje graduado, sin cerrar un rótulo)**, **≥ 75 → "ágil, resuelve rápido"**. En la zona 60-74 nunca se compromete una lectura tajante. El vocabulario del tempo (reflexivo/ágil) es propio de esta señal y **no reutiliza** ningún nombre de eje ni de veta.
- **Exigir los 3 mini-juegos** o marcar `motor_narratable = false`. Si falta el juego de mayor peso (Adaptación, 0.40) o cualquiera de los que sostienen el tempo, NO se reponderar-y-cortar: no se narra motor. `motor_narratable = false` también en fallback por tiempo de respuesta.

### 2.3 Normalización por edad, bien hecha (C7/§F — corrige los hallazgos de Estadística)
- **Corrección por edad a los TRES sub-motores** (latencia de decisión, reacción, adaptación) y a los **términos de conteo** (`extraTaps`, `inertiaErrors`), o declarar explícitamente por qué un término no se normaliza. No solo a la latencia (bug de la v1).
- **Modelo declarado (piso fijo):** la edad afecta el **span**, no todo el valor. `score = 1 − (x − F) / (R · f(edad))`, con **F = piso fijo** (no se mueve al dividir) y `R` = rango. Se descarta el modelo "dividir toda la latencia" porque desplazaba artificialmente el piso de 800 ms.
- **factorEdad continuo** `f(edad)`: interpolación **por meses** entre anclas de bibliografía (v1 semilla, abajo), no escalón por año. Se separan 15 y 16 (o se justifica el bin en el doc de calibración).

| Edad (ancla) | f | | Edad (ancla) | f |
|---|---|---|---|---|
| 8 | 1.45 | | 13 | 1.10 |
| 9 | 1.38 | | 14 | 1.05 |
| 10 | 1.30 | | 15 | 1.02 |
| 11 | 1.23 | | 16 | 1.00 |
| 12 | 1.16 | | | |

- **Cortes por edad, no absolutos.** Un factor único alinea la media pero no la varianza. La banda del motor se define por **percentil DENTRO de la banda de edad** (p33/p67 de la celda de edad) o por **z por edad** (centro + escala propios de la celda), no por el 67/33 absoluto. Modelo elegido: **percentil por celda** (más robusto en muestra chica); z por edad como alternativa documentada.
- **Normas etiquetadas como "población Argo" (autoseleccionada), no del desarrollo general** (§F2). Nunca se presentan como norma clínica.

### 2.4 Auto-adaptación a datos, robusta (§F2)
- El blending se dispara por **n POR celda de edad**, no por el total global de 500. Encogimiento **empírico-Bayes**: `peso_celda = n_celda / (n_celda + k)`, con **k ≈ 100-200**; el resto pondera la semilla de bibliografía. Percentiles robustos (p10/p90) para floor/range.
- Nulo de calibración: **enumeración exacta** (§7) para las señales de votos; **permutación sobre respuestas reales** para el motor cuando haya datos. Nunca Monte Carlo.
- Excluir del conteo y de las normas: `marianonoceti@gmail.com`, `mariano@yacare.io`, `federico.diaz.goberna@gmail.com`, y todo `is_demo`.

---

## 3. Banda de confianza — TRES niveles calibrados al nulo (C2/§A)

La escala de 12 votos **no sostiene 4 bandas honestas**. Se pasa a **3**, con el corte por encima del ruido y `P(banda)` bajo azar documentado y auditable. Masas exactas por enumeración de las 455 (script `scripts/enum-bandas.mjs`, determinista):

| Banda | Regla sobre B | P(banda) bajo azar | Registro de lenguaje | Prohibido |
|---|---|---|---|---|
| **Definido** | **B ≥ 4** | **7.06%** (B=4: 4.28% · B=5: 1.98% · B≥6: 0.79%) | "se inclina **con claridad** hacia X". **"Fuerte / marcado" solo desde B ≥ 6** (P≈0.8%). | "es / puro / definitivamente" |
| **Con matices** | **B = 2 o 3** | **33.67%** (B=2: 23.85% · B=3: 9.82%) | "se asoma **un poco más** X, con Y presente" (tentativo) | **"claramente" ya NO se usa aquí** |
| **Mezcla** | **B = 0 o 1** | **59.27%** (B=0: 22.79% · B=1: 36.48%) | "dos formas **casi con el mismo peso**", sin dominante claro | cualquier sustantivo de arquetipo único |

- Referencia adicional del nulo: `P(B≥2)=40.73%`, `P(top_count≥6)=21.73%`, `P(B≥2 ∧ top_count≥6)=20.90%`. Cada corte se documenta con su `P` al lado, y el script que lo enumera es reproducible.
- **Estos cortes son de arranque.** A los 500 juegos por celda se recalibran con la distribución propia (§7), sin bajar por debajo del nulo.

### 3.1 Gate del NOMBRE del arquetipo (C3/§B — no etiquetar sobre ruido)
- **No se da nombre único `[Eje][veta]` por debajo de B=2.** Además, se exige **altura del dominante sobre el azar**: `top_count ≥ 6` (P≈21.7% bajo el nulo). El nombre único se libera **solo si `B ≥ 2` Y `top_count ≥ 6`**.
- **Por debajo del gate:**
  - **B = 0-1 (Mezcla):** presentar como **par** ("una mezcla entre X e Y") o **tendencia sin sustantivo propio**; nunca un arquetipo. En B=0, co-líderes explícitos.
  - **B = 2-3 con `top_count < 6`** (p. ej. 5-3-2-2): también **co-líderes / tendencia**, no sustantivo único (el dominante al 33-42% apenas supera el 25% del azar).
- Ejemplo que la v1 etiquetaba mal: **4-3-3-2** → B=1, dominante 33%. **No lleva nombre**; se presenta como mezcla.

---

## 4. Momento notable — regla determinista + dependencia declarada

- **Candidato** = respuesta cuyo eje ≠ dominante.
- **Citable** solo si: (a) su eje es el secundario (corroboración) **o** (b) ocurrió en escena firma (la tormenta, Q5-Q7). Evita citar ruido (un voto suelto en el eje más débil no se cita).
- **Prioridad:** 1) escena firma; 2) elección hacia el eje secundario; 3) desempate por escena más temprana.
- **Tope:** 1 momento (2 solo si ambos ejes están en banda Definido o Con matices). Texto = **la escena literal**, nunca interpretado ("en la tormenta eligió buscar a los compañeros"), sin leer afecto ni intención.
- **Caso nulo** (chico consistente): citar su escena más representativa del dominante ("sostuvo su forma en…"). La sección siempre existe.
- **Dependencia declarada (NUEVO, C11):** el momento notable, "ante la tormenta" (§5) y "ante lo inesperado" (§5) **comparten las escenas de tormenta Q5-Q7**. NO se presentan como tres evidencias independientes que "coinciden": es la **misma fuente** leída con distinto foco. El informe lo dice explícitamente para no fabricar una falsa triangulación.

---

## 5. Los temas del informe — fuentes deterministas, renombradas y honestas (C4/C5/C6/C11/§D)

Cada tema sale de UNA fuente determinista mapeada a una lectura pre-escrita. Sin invención. Cambios de la ronda 2:

**"Cuánto lo mueve el grupo" (renombrado desde "cómo se lleva con los demás", C4):**
- Fuente: **I + S combinados** (la mitad-personas de DISC), **no** solo Conector.
- Lectura **intra-individual** (§G, sin Alto/Medio/Bajo): "el vínculo con el grupo aparece **entre sus motores más elegidos**" vs. "aparece **menos que su propio empuje**".
- **Nunca** leer bajo-I como individualismo: se cruza con S antes de decir nada. Aclaración fija: **no mide habilidad social, popularidad ni amistades.**

**"Manejo del éxito" (C5) — degradado a escena literal:**
- Fuente: **la escena literal de La Meta (Q12)**, tratada como un momento notable, **sin nombre de rasgo**: "en la meta, eligió mirar al próximo reto" / "eligió celebrarlo con los demás" / "eligió repasar qué del plan funcionó" / "eligió que todos llegaran bien".
- Solo se afirma un "así maneja el éxito" si hay **convergencia** (Q12 + eje dominante apuntan a lo mismo); si no, queda en la escena observada.

**"Ante lo inesperado" (renombrado desde "cómo responde a los cambios", C6):**
- Fuente primaria: **eje S** (elecciones). El sub-puntaje **`avgAdaptation`** entra como **matiz secundario** (confianza media), con **regla de reconciliación**: si eje-S y adaptación divergen, se narra el eje y la adaptación se menciona solo como "en el juego de reglas cambiantes, tendió a…", sin cerrar contradicción.
- Corrección por edad aplicada a `avgAdaptation` (§2.3); en edades menores, si no es narratable, se marca no-narratable en vez de forzar.

**"Ante la tormenta / lo adverso" (renombrado desde "frustración", C11):**
- Fuente: **eje dominante de las elecciones en las escenas de tormenta (Q5-Q7)**. Se emite **solo si 2 de 3 escenas coinciden** en eje ("ante lo adverso, en el juego tendió a…"). Ante **1-1-1**: "respondió de formas distintas según la escena".
- **NUNCA leer afecto.** Una pausa puede ser reflexión o bloqueo; no se interpreta emoción, ansiedad ni frustración sentida. El nombre viejo ("manejo de la frustración") queda **prohibido** por implicar estado afectivo.
- Comparte fuente con el momento notable y con "ante lo inesperado" → dependencia declarada (§4).

**"Su motor" (tempo, §2) y "cómo responde a los cambios / flexibilidad":**
- "Su motor" = **tempo** (avgLatency + avgReaction, media, con banda de incertidumbre §2.2).
- La **flexibilidad** (`avgAdaptation`, media) NO va sola: se combina con el **eje S** en "Ante lo inesperado" / "Cómo responde a los cambios", con reconciliación. Señales de **confianza baja** (`extraTaps`, `inertiaErrors`, `stdDevLatency`, `trend`, `avgCadence`) **solo como color**, nunca afirmación.

Todo el copy de temas respeta las **líneas rojas** (§12): nada de emoción/ansiedad, rasgo fijo, diagnóstico, comparación entre niños, talento, bien/mal; todo relativo a la edad; siempre "en el juego, tendió a… / suele / parece", nunca "es".

---

## 6. Forma del perfil — cascada corregida, alcanzable y alineada a las bandas (C12/§H)

La rama "leve/equilibrio" de la v1 era **inalcanzable** (0 de 455) y "equilibrio" no coincidía con la banda B=0. Cascada corregida (evaluada de arriba abajo, gana la primera; `n_ejes_fuertes` = ejes con conteo ≥ `top_count − 1`), **testeada sobre las 455** (`scripts/test-formas.mjs`):

| # | Forma | Regla | Banda | Comps (de 455) | Masa nula | ¿Nombre único? |
|---|---|---|---|---|---|---|
| 1 | **Equilibrio** | `B = 0` | Mezcla | 47 | 22.79% | No (co-líderes) |
| 2 | **Dúo** | `B = 1` y `second_count ≥ 4` | Mezcla | 72 | 16.65% | No (par) |
| 3 | **Versátil** | `B = 1` (resto; siempre `n_ejes_fuertes ≥ 3`) | Mezcla | 12 | 19.83% | No (tendencia) |
| 4 | **Líder con acompañante** | `B ∈ {2,3}` | Con matices | 132 | 33.67% | Solo si `top_count ≥ 6` |
| 5 | **Definido** | `B ∈ {4,5}` | Definido | 88 | 6.27% | Sí |
| 6 | **Muy marcado** | `B ≥ 6` | Definido | 104 | 0.79% | Sí |

- **Equilibrio va primero** (antes de cualquier otra regla), de modo que **3-3-3-3 y todo B=0** mapean a "equilibrio", alineado con la banda Mezcla/B=0 de §3. Bug de la v1 resuelto.
- **Cobertura probada:** cada forma tiene ≥ 1 composición, las masas suman **100.00%**, y **ninguna forma cruza dos bandas** (cada forma vive en una sola banda). "Líder con acompañante" es la única donde el nombre único depende además de `top_count ≥ 6` (coherente con el gate de §3.1).
- `LeveHaciaUno` de la v1 se **elimina**: no existe ninguna composición B=1 que no sea Dúo o Versátil (demostrado por enumeración).

---

## 7. Calibración estadística ipsativa — enumeración exacta (metodología, no cambia el informe)

- Los cortes de §3 y las formas de §6 se fijan/defienden con la **distribución exacta** del máximo y de la brecha bajo **multinomial(12, ¼)**, por **enumeración de las 455 composiciones** (`scripts/enum-bandas.mjs`), **no** con Monte Carlo ni con el desvío marginal de un eje.
- Valores nulos publicados y auditables: `P(B=0)=22.79%`, `P(B=1)=36.48%`, `P(B=2)=23.85%`, `P(B=3)=9.82%`, `P(B=4)=4.28%`, `P(B=5)=1.98%`, `P(B≥6)=0.79%`; `P(top≥6)=21.73%`; `P(B≥2 ∧ top≥6)=20.90%`.
- A los **500 juegos por celda de edad** (no global) se re-enumera/permuta con la distribución propia (§2.4), moviendo los cortes solo por encima del ruido y etiquetando las normas como **"población Argo" autoseleccionada**.
- **Separación clave (C, §14):** esta enumeración da **trazabilidad y reproducibilidad**, NO validez de constructo. "Determinista/reproducible" ≠ "válido".

---

## 8. Estructura del informe (informe ÚNICO) — con componentes fijos de marco y de límites

Un solo informe (ArgoOne + coach). Estructura idéntica para todos; contenido distinto por chico. Mockup: `preview/informe-final.html`. Cada sección: presencia siempre, largo fijo, forma fija, caso nulo definido (contrato de formato) y tooltip explicativo.

1. **Su perfil** (nombre `[Eje primario] con veta [Eje secundario]` **solo si pasa el gate §3.1**; si no, par/tendencia sin sustantivo).
2. **Qué tan marcado es** (banda de confianza a 3 niveles §3, con la lectura honesta de la incertidumbre).
3. **Su motor** (insights de los mini-juegos §2: tempo de decisión y reacomodo, per-child, con banda de incertidumbre; `motor_narratable=false` ⇒ se omite, no se inventa). Es una lente de señales medidas, no un tipo.
4. **Cómo decide** (elecciones; sin leer velocidad como decisión).
5. **Qué lo enciende.**
6. **Palabras que lo encienden y las que lo apagan.**
7. **Guía rápida.**
8. **Checklist del día.**
9. **Consejo de reset.**
10. **Manejo del éxito** (escena literal de Q12, §5).
11. **Ante la tormenta / lo adverso** (§5; solo 2/3, sin afecto).
12. **Cómo responde a los cambios / ante lo inesperado** (eje S + flexibilidad como matiz, §5).
13. **Cuánto lo mueve el grupo** (I+S, intra-individual, §5).
14. **Ecos fuera de la cancha.**
15. **Cómo viene evolucionando** (desde el 2.º perfilamiento, con **gate RCI** §15/§C; misma fuente que el dashboard).
16. **[FIJO] Marco de lectura / barandas** (NUEVO, componente visible §12): "foto del presente, no diagnóstico, no comparar entre niños, no seleccionar, no es una definición de quién es el chico" + nota al adulto de no devolverle la etiqueta.
17. **[FIJO] Qué mira y qué no mira este perfil** (NUEVO, componente visible §13): los límites inherentes en lenguaje simple.

Los componentes 16 y 17 son **parte del contrato de formato**, no solo del doc: se renderizan siempre, en el informe del adulto y en la superficie del coach.

### Renombres consolidados (para i18n y QA)
- "Cómo se lleva con los demás" → **"Cuánto lo mueve el grupo"**.
- "Manejo de la frustración" → **"Ante la tormenta / lo adverso"**.
- "Cómo responde a los cambios" (como sub-motor solo) → integrado a **"Ante lo inesperado"** (eje S + flexibilidad).
- El 2.º término del **nombre** ya no es una palabra de tempo: es la **veta = eje secundario** (elecciones). Los insights **medidos** de los mini-juegos → sección **"Su motor"** (tempo/reacomodo, per-child), nunca en el nombre.

---

## 9. Enforcement fail-closed + observabilidad

- **Fail-closed:** una sección no se libera hasta pasar todos los filtros. Tras un tope de reintentos, degrada al **texto estático pre-aprobado** (pasa por construcción). Nunca se sirve IA sin aprobar; nunca se deja a un niño sin informe.
- **Filtros:** palabras prohibidas + lenguaje determinista + **band-guard** (intensificadores graduados por banda: "con claridad" solo Definido; "fuerte/marcado" solo B≥6; "claramente" **fuera** de Con matices) + closed-moment (escenas inventadas) + validador de formato + **eje correcto** + **name-gate** (bloquea sustantivo de arquetipo si no se cumple `B≥2 ∧ top_count≥6`) + **motor-gate** (bloquea cadencia si `motor_narratable=false` o zona 60-74) + **afecto-guard** (bloquea toda lectura emocional de señales de mini-juego) + **trazabilidad** (toda magnitud/ejemplo/momento se rastrea a la ficha o a la biblioteca).
- **Objetivo:** caída al respaldo estático **≤ 1%**, registrada por informe (filtro disparado, reintentos, si cayó al respaldo). Alerta si supera el umbral.

---

## 10. Persistencia

- Se guarda la **ficha de evidencia completa** por perfilamiento (vector de votos, B, top/second_count, forma, banda, sub-motores age-fair, `motor_narratable`, edad en meses, `factorEdad`) → regeneración determinista + historia/evolución.
- Persistir `question_id` por respuesta + versionar el banco (`question_version`): requisito del momento notable (§4), de la estabilidad de respuestas y del gate de evolución (§15).

---

## 11. i18n (transversal)

- Cada lista/tabla/biblioteca es `Record<Lang, …>` (es/en/pt) desde el diseño: conceptos, lecturas de temas, nombres de escena (La Tormenta / The Storm / A Tempestade), listas de filtros. Se redacta es como fuente y en/pt en paralelo, revisadas (no traducción automática para copy sensible).
- Renombres de §8 propagados a las tres lenguas. Los nombres de arquetipo (eje primario × eje secundario) salen de la tabla canónica trilingüe de `docs/archetype-naming.md`, **que debe reescribirse** desde el esquema viejo eje × tempo (ver §1).

---

## 12. Barandas éticas — VISIBLES como componente fijo (C10/§I)

Deja de ser solo texto del doc: es **componente renderizado** del informe y de la superficie del coach (§8.16), parte del contrato de formato.

**Marco fijo en el informe (foto, no diagnóstico):**
- "Es una **fotografía del presente**, no una definición de quién es el chico." · "**No es un diagnóstico**; no mide inteligencia, talento, condiciones psicológicas ni rendimiento futuro." · "**No compares** a un niño con otro con esto." · "**No se usa para seleccionar ni descartar.**"
- **Nota al adulto (obligatoria):** el perfil es para **entender y acompañar**, no para devolvérselo al niño como identidad ("sos un X"). El nombre es una lente del momento, no una etiqueta.

**Superficie del coach (barandas activas):**
- Advertencia visible de **no-comparación / no-selección**.
- **Prohibido mostrar barras de eje crudas comparables columna a columna** entre niños. La comparación cross-child es **solo cualitativa** (misma forma, ejes compartidos), **nunca magnitudes** ni números crudos (ipsativos + una toma + distinto dispositivo).

**Reencuadre de todo copy deficitario (obligatorio):**
- "le cuesta" → "en el juego, tendió a tomarse un momento".
- "Bajo / Alto / Medio" en conteos ipsativos → lenguaje **intra-individual** (§G): "aparece entre sus más elegidos" / "aparece menos que su propio empuje".
- "no es su primer motor" → "tiende primero a su propio empuje; el grupo aparece después".
- Todo polo (ágil/profundo, anticipatorio/calibrado, reacomodo rápido/pausado) se presenta como **preferencia del presente**, sin mejor/peor.

**Líneas rojas transversales (del doc de constructos, blindadas en filtros §9):**
1. **Nada de emoción / ansiedad / nervios.** Las señales captan solo comportamiento motor y temporal. `extraTaps` NO son nervios.
2. **Nada de rasgo fijo.** Una sola toma = un estado, contaminado por motivación, familiaridad con la pantalla y latencia/tamaño del dispositivo. Siempre "tiende a / suele / parece", nunca "es".
3. **Nada de diagnóstico ni clínica** (TDAH, déficit atencional, impulsividad clínica, rigidez, perseveración patológica, daño frontal).
4. **Nada de comparación entre niños.** Sin norma, distinto dispositivo, una sola toma; y **todo relativo a la edad** (funciones que maduran de 8 a 16: "más lento/perseverativo" a menor edad es esperable, jamás un defecto).
5. **Nada de talento, capacidad, inteligencia ni predicción de rendimiento.**
6. **Nada de bien/mal** ("aprobó/reprobó", "acertó/falló", "le costó"). Todo es estilo, ningún polo es mejor.
7. **El eje DISC no sale de la velocidad.** El tempo alimenta "Su motor" y el color; el eje se define por las **elecciones**.

---

## 13. [NUEVO — visible] Límites inherentes del método (se asumen, no se corrigen)

Componente fijo del informe/superficie (§8.17), en lenguaje simple. Estos límites **no** tienen arreglo de ingeniería; se comunican con honestidad:

1. **Comparación entre niños no válida.** Los conteos son **ipsativos** (suman 12): dicen cómo se ordena el chico **consigo mismo**, no cómo se compara con otro. No hay ranking.
2. **Certeza acotada por diseño.** **12 elecciones** no sostienen alta certeza. Más de la mitad de los perfiles posibles caen, bajo azar, en "mezcla o con matices" (§3): por eso el lenguaje es tentativo y a veces no hay un nombre único.
3. **El cambio en el tiempo tiene fiabilidad ~0 sin test-retest.** Sin re-medición controlada no se puede separar cambio real de ruido; por eso la evolución solo se narra bajo el gate RCI (§15).
4. **Validez de constructo no establecida.** El método es reproducible y trazable, pero **no está validado** contra criterios externos (§14).
5. **Muestra autoseleccionada.** Las normas ("población Argo") son de quienes usan Argo, **no del desarrollo general**.
6. **Motor de una sola toma con intervalo ancho en niños.** El tempo es una **foto** de un momento, contaminada por dispositivo, pantalla y motivación; el intervalo de confianza es amplio, sobre todo a menor edad.

---

## 14. [NUEVO — visible] Trazabilidad/reproducibilidad ≠ validez (C, §I)

- **Lo que el método SÍ da:** **trazabilidad** (toda afirmación se rastrea a un hecho de la ficha o a la biblioteca pre-aprobada) y **reproducibilidad** (la misma ficha produce el mismo esqueleto; el nulo se enumera de forma exacta y auditable).
- **Lo que el método NO da (aún):** **validez de constructo, de criterio y predictiva.** No se ha establecido que las señales midan lo que dicen medir contra referencias externas, ni que predigan nada.
- **Regla de discurso:** **"determinista/reproducible" no es un argumento de validez.** Prohibido presentar la trazabilidad como si fuera evidencia de que el perfil "es verdadero". El claim máximo permitido sigue siendo: *anclado en teoría, foto del presente, no clínico.*

---

## 15. [Detalle de §8.15] Evolución con gate de cambio confiable (RCI) (C1/§C)

- **Narrar cambio de eje dominante SOLO si:** ambos perfilamientos tuvieron **B ≥ 2** y los ejes **difieren**.
- **Cambio de motor** solo si el composite age-fair cruza el umbral por **más que el SEM estimado** (índice de cambio confiable, RCI). Cruces dentro del error no se narran.
- **Si no supera el gate:** texto estático honesto **"se mantiene estable dentro de lo esperable"** (nunca una trayectoria fabricada).
- **Prohibido narrar evolución si cualquiera de las dos tomas tuvo B ≤ 1** (banda Mezcla): sin señal confiable en alguna punta, no hay "cambio" que contar.
- Coherente con el límite §13.3: sin test-retest la fiabilidad del cambio es ~0; el gate RCI es la única forma honesta de hablar de evolución.

---

### Resumen de qué cambió respecto de la v1 (para el panel)

| # | Corrección | Dónde |
|---|---|---|
| C1 | Evolución con gate RCI; prohibida si B≤1 | §15 |
| C2 | Banda a 3 niveles calibrada al nulo, P(banda) documentada, enumeración exacta | §3, §7 |
| C3 | Nombre gateado: `B≥2 ∧ top_count≥6`; si no, par/tendencia | §3.1 |
| C4 | "Cuánto lo mueve el grupo" ← I+S; no habilidad social | §5 |
| C5 | "Manejo del éxito" ← escena literal Q12, sin rasgo | §5 |
| C6 | "Ante lo inesperado" ← eje S + flexibilidad como matiz | §5 |
| C7 | Lenguaje intra-individual (fuera Alto/Medio/Bajo ipsativo); norma edad a 3 sub-motores + conteos; modelo piso-fijo; factorEdad continuo; cortes por percentil/celda; EB shrinkage | §2.3, §2.4, §5, §12 |
| C8 | Banda de incertidumbre del motor (60-74); exigir 3 juegos o `motor_narratable=false` | §2.2 |
| C9 | **Tempo fuera del nombre**; nombre = eje primario × eje secundario (elecciones, blend DISC); insights de mini-juegos = contenido per-child | §0, §1, §2, §8 |
| C10 | Barandas visibles (informe + coach), sin barras crudas, copy reencuadrado | §12 |
| C11 | Dependencia entre temas de tormenta declarada; "frustración"→"ante la tormenta", sin afecto | §4, §5 |
| C12 | Cascada de forma corregida (6 formas, todas alcanzables, alineadas a banda, test 455) | §6 |
| — | Límites inherentes visibles + trazabilidad≠validez | §13, §14 |

---

**Notas de entrega para el orquestador:**

- Documento corregido completo entregado arriba en Markdown, español, con la estructura numerada 0-12 de la spec original preservada (para comparación manzana-con-manzana) + §13/§14/§15 agregadas porque la ronda 2 exige hacer visibles los límites inherentes, la separación trazabilidad/validez y el gate RCI de evolución.
- Las probabilidades del nulo NO son las aproximadas de la v1: fueron recomputadas por **enumeración exacta de las 455 composiciones** (multinomial 12, ¼). Valores clave verificados: `P(B=0)=22.79%`, `P(B=1)=36.48%`, `P(B=0-1)=59.27%`, `P(B=2-3)=33.67%`, `P(B≥4)=7.06%`, `P(B≥6)=0.79%`, `P(top≥6)=21.73%`, `P(B≥2 ∧ top≥6)=20.90%`.
- La **cascada de forma corregida fue testeada sobre las 455**: las 6 formas son alcanzables (comps ≥ 1 cada una), cada forma vive en una sola banda, y las masas suman 100.00%. `LeveHaciaUno` de la v1 se eliminó por ser inalcanzable (0 comps demostrado).
- Decisión de producto G resuelta y cerrada por el owner: **el nombre es un blend DISC = eje primario + eje secundario** (ambos de elecciones; 4×3 = 12, no 132), y **todo el tempo sale del nombre** y vive como insights per-child de los mini-juegos (§2/§8). La derivación veta↔votos ya NO es un stub: veta = eje del `second_count`, gateada por banda (§1). Único trabajo downstream (fuera de esta spec, en la lista de impacto de interfaces): **reescribir `docs/archetype-naming.md`** del esquema viejo eje × tempo al nuevo eje × eje secundario.
- Documento persistido como `docs/METODO-CALCULO-NUEVO.md` (reemplaza la v1; git conserva la v1 en el historial).