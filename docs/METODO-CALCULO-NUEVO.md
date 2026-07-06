# Método Argo — CÁLCULO DEL PERFIL Y INFORME (especificación nueva, completa)

> Documento autoritativo del método reformado. Reúne la arquitectura, la ficha de evidencia, los umbrales/reglas exactos (aprobados con el owner 2026-07-06) y la estructura del informe. Es la referencia para implementar y para revisión externa. Complementos: diseño detallado en `METODO-INFORME-DETERMINISTA.md`, módulos en `METODO-INFORME-MODULOS.md`, decisiones en `METODO-INFORME-DECISIONES.md`, estado previo en `METODO-ESTADO-ACTUAL.md`.
>
> Naturaleza del método (importante para revisores): Argo NO es un test validado. Toma constructos públicos (DISC como puerta de entrada; funciones ejecutivas y SDT en el roadmap), los adapta y los mide por juego. Claims permitidos: "anclado en la teoría, no es una medida clínica, es una fotografía del presente". Prohibidos: "validado", "diagnóstico", "predice el rendimiento".

## 0. Arquitectura de dos capas

- **Capa 1 (determinista, sin IA).** De las 12 respuestas + métricas de mini-juego + tiempos + la ficha del perfilamiento anterior, computa una **ficha de evidencia** de hechos con magnitudes, y ensambla el esqueleto de qué bloque de concepto pre-aprobado aplica y en qué sección cae.
- **Capa 2 (IA, acotada).** Recibe `ficha + esqueleto + manual de estilo + palabras prohibidas` y SOLO reescribe en prosa cálida. No introduce rasgo, magnitud, eje, motor, escena ni ejemplo que no esté en el esqueleto.
- **Correctitud ipsativa:** una respuesta suelta es UN VOTO (débil). Toda afirmación nace del agregado, nunca del patrón "eligió A → afirmá X".

## 1. Eje (se mantiene) + votos como forma completa

- 12 preguntas forzadas, 1 voto por eje. Dominante = más votado, secundario = 2.º. **Se conserva el vector completo de votos** (D/I/S/C), no solo el ganador.
- Nuevo: `brecha B = votos(1.º) − votos(2.º)`; `second_count`, `third_count`, y flags de empate (`secundario_empatado` si 2.º==3.º).

## 2. Motor con normalización por edad (v1 de bibliografía, auto-adaptable)

- Se conserva la fórmula de los tres vectores del estado actual, pero la **latencia cruda se divide por un factor de edad** antes de puntuar, para medir tempo relativo a la edad y no madurez del desarrollo. `latenciaEfectiva = latenciaCruda / factorEdad(edad)`.

| Edad | factorEdad | | Edad | factorEdad |
|---|---|---|---|---|
| 8 | 1.45 | | 12 | 1.16 |
| 9 | 1.38 | | 13 | 1.10 |
| 10 | 1.30 | | 14 | 1.05 |
| 11 | 1.23 | | 15-16 | 1.00 |

- **Auto-adaptación:** < 500 juegos reales → semilla (tabla). ≥ 500 → cada banda de edad mezcla gradualmente sus propios datos, pesado por tamaño de muestra. Excluir del conteo y de las normas: `marianonoceti@gmail.com`, `mariano@yacare.io`, `federico.diaz.goberna@gmail.com`, y todo `is_demo`.
- Umbrales de banda 67/33 se conservan, aplicados sobre el composite age-fair.
- Sub-motores: `impulso`, `ritmo`, `adaptacion` (0-100 c/u) se **exponen** (hoy se aplastan). Divergencia = varianza entre los tres contra umbral.
- `motor_narratable=false` si el motor viene de fallback (sin medición de tempo real); en ese caso no se afirma cadencia.

## 3. Banda de veta / confianza (NUEVO) — umbrales exactos

Sobre `B = votos(1.º) − votos(2.º)` (12 votos totales), 4 bandas:

| B | Banda | Registro de lenguaje | Se siente |
|---|---|---|---|
| **≥ 4** | Definido | "se inclina con claridad hacia X" (no "es definitivamente / puro") | Nítido |
| **2 o 3** | Marcado, con acompañante | "se inclina claramente hacia X, con Y presente" | Identificado |
| **1** | Con matices | "se asoma un poco más X, muy cerca de Y" | Mezcla suave |
| **0** | Equilibrio | "dos formas con el mismo peso" | Mezcla real |

- El arquetipo (nombre) se da **siempre salvo B=0** (ahí, co-líderes). La sensación "identificado pero no forzado" surge de: nombre siempre + nombrar el secundario cuando está cerca + lenguaje probabilístico gateado por la banda.
- **Estos umbrales son de arranque.** A los 500 juegos se recalibran con la distribución real (ver §7).

## 4. Momento notable (NUEVO) — regla de selección determinista

- **Candidato** = respuesta cuyo eje ≠ dominante.
- **Citable** solo si: (a) su eje es el secundario (tiene corroboración) **o** (b) ocurrió en escena firma (la tormenta). Esto evita citar ruido (un voto suelto en el eje más débil no se cita).
- **Prioridad de selección:** 1) escena firma; 2) elección hacia el eje secundario; 3) desempate por escena más temprana.
- **Tope:** 1 momento (2 si ambos muy fuertes). Texto = **la escena literal**, nunca interpretado.
- **Caso nulo** (chico perfectamente consistente): citar su escena más representativa del dominante ("sostuvo su forma en..."). La sección siempre existe.

## 5. Los 4 temas nuevos — mapeo exacto (fuente → lectura)

Cada tema sale de UNA fuente determinista, mapeada a una lectura pre-escrita. Sin invención.

**Manejo del éxito ← eje de la opción elegida en La Meta (Q12):**
- Impulsor ("¿cuál es la próxima isla?") → mira al próximo reto; invitarlo a registrar lo logrado.
- Conector ("aventura juntos") → vive el logro compartido, lo celebra con otros.
- Estratega ("qué bien salió el plan") → disfruta que el cómo funcionó, aprende de lo que salió bien.
- Sostén ("llegamos todos a salvo") → el éxito es que el grupo esté bien.

**Manejo de la frustración ← eje dominante de las elecciones en las escenas de tormenta (Q5-Q7):**
- Estratega → se frena a leer antes de moverse. · Impulsor → se lanza a resolver. · Sostén → mantiene su lugar. · Conector → busca a los compañeros. · Repartido entre dos → se muestra la mezcla.

**Cómo responde a los cambios ← sub-puntaje de adaptación (mini-juego tormenta, ya persistido):**
- Alto → se reacomoda con fluidez. · Medio → se toma un instante y sigue. · Bajo → el cambio de golpe le cuesta; un aviso lo ayuda.

**Cómo se lleva con los demás ← conteo del eje Conector:**
- Alto → el grupo es su primer motor. · Medio → combina empuje con vínculo. · Bajo → tiende a su propio empuje, no lo evita pero no es su primer motor.

## 6. Forma del perfil (NUEVO) — cascada mutuamente excluyente

Evaluada de arriba abajo, gana la primera que matchea (garantiza una sola forma por vector; se testea contra las 455 composiciones posibles):

1. **Disperso** si `n_ejes_fuertes ≥ 3` y `B ≤ 1` → versátil.
2. **Dúo** si `second_count ≥ 4` y `B ≤ 1` → dos co-líderes.
3. **Pico** si `top_count ≥ 6` y `B ≥ 4` → forma muy marcada.
4. **Líder con sombra** si `top_count ≥ 5` y `B ∈ {2,3}` → forma clara con segundo fuerte.
5. Si no → **leve/equilibrio**.

`n_ejes_fuertes` = ejes con conteo ≥ (top_count − 1). Refinamiento sobre la banda de confianza; sirve sobre todo para detectar "versátil" y "dos co-líderes".

## 7. Calibración estadística ipsativa (metodología, NO cambia el informe)

- Los umbrales de §3 se fijan/defienden con la distribución del **máximo** y de la **brecha** bajo multinomial(12, 0.25), no con el desvío marginal de un eje.
- Script de una vez `scripts/montecarlo-bandas.mjs`: simula 12 votos al azar millones de veces → `P(B ≥ k)` empírico (referencia: P(B≥2)≈0.41, P(B≥4)≈0.07, P(B≥6)≈0.008). Los cortes se ponen por encima del ruido.
- A los 500 juegos reales se re-corre con la distribución propia para mover los cortes donde se sienten bien en nuestra población.

## 8. Estructura del informe (15 componentes, informe ÚNICO)

Un solo informe (ArgoOne + coach). Estructura idéntica para todos; contenido distinto por chico. Mockup fiel: `preview/informe-final.html`.

1. Su perfil (arquetipo + tendencia) · 2. Qué tan marcado es (banda de confianza) · 3. Su motor · 4. Cómo decide · 5. Qué lo enciende · 6. Palabras que lo encienden y las que lo apagan · 7. Guía rápida · 8. Checklist del día · 9. Consejo de reset · 10. Manejo del éxito · 11. Manejo de la frustración · 12. Cómo responde a los cambios · 13. Cómo se lleva con los demás · 14. Ecos fuera de la cancha · 15. Cómo viene evolucionando (desde el 2.º perfilamiento; misma fuente que el dashboard `describeProfileChange`).

- Cada sección: presencia siempre, rango de largo fijo, forma fija, caso nulo definido (contrato de formato).
- Cada título lleva un tooltip que explica qué representa.

## 9. Enforcement fail-closed + observabilidad

- **Fail-closed:** una sección no se libera hasta pasar todos los filtros. Camino de falla: tras un tope de reintentos por sección, degrada al **texto estático pre-aprobado** (pasa por construcción). Nunca se sirve texto de IA sin aprobar; nunca se deja a un niño sin informe.
- **Filtros:** palabras prohibidas + lenguaje determinista + band-guard (intensificadores "muy/fuerte/sobresale" graduados por banda) + closed-moment (escenas inventadas) + validador de formato + eje correcto + **trazabilidad** (toda magnitud/ejemplo/momento se rastrea a la ficha o a la biblioteca).
- **Objetivo:** tasa de caída al respaldo estático **≤ 1%**, registrada por informe (qué filtro se disparó, reintentos, si cayó al respaldo). Alerta si supera el umbral.

## 10. Persistencia

- Se guarda la **ficha de evidencia completa** por perfilamiento → regeneración determinista + historia/evolución.
- Extensión: persistir `question_id` por respuesta + versionar el banco (`question_version`), requisito del momento notable (§4) y de la estabilidad de respuestas.

## 11. i18n (transversal)

- Cada lista/tabla/biblioteca es `Record<Lang, …>` (es/en/pt) desde el diseño: conceptos, lecturas de temas, nombres de escena (La Tormenta / The Storm / A Tempestade), listas de filtros (prohibidas, intensificadores). Se redacta es como fuente y en/pt en paralelo, revisadas (no traducción automática para copy sensible).

## 12. Lo que el método NO afirma (barandas éticas)

No es diagnóstico. No mide inteligencia, talento, condiciones psicológicas ni rendimiento futuro. No se usa para seleccionar/descartar. Es una fotografía del presente, orientada a acompañar. Lenguaje probabilístico siempre.
