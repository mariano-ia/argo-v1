# Plan de correcciones — ronda 2 (post revisión de expertos)

> Correcciones a `METODO-CALCULO-NUEVO.md` que resuelven los hallazgos del panel (`METODO-REVISION-EXPERTOS-20260706.md`). Objetivo: pasar el método de "promete de más" a "defendible y honesto". Todo es diseño acotado, no rediseño. Una sola decisión de producto queda abierta (Motor, §G). Fecha: 2026-07-06.

## Principio que ordena casi todo: la certeza escala con la improbabilidad bajo el azar

El eje central del panel: el lenguaje, el nombre y la evolución NO deben afirmar más de lo que la separación-del-azar sostiene. Se calibra todo contra el nulo (enumeración exacta de las 455 composiciones, no Monte Carlo).

## A. Recalibrar la banda de confianza (C2) — bajar el lenguaje al ruido

- Masa del nulo por banda: B=0 → 22.8%, B=1 → 36.5%, B=2-3 → 33.7%, B≥4 → 7.1%.
- **Pasar a 3 bandas** (la escala de 12 votos no sostiene 4 honestas):
  - **B ≥ 4** (P≈7%) → "Definido": lenguaje claro ("se inclina con claridad hacia X"). Fuerte solo desde B≥6 (P≈0.8%).
  - **B = 2-3** (P≈34%) → "Con matices": tentativo ("se asoma un poco más X, con Y presente"). **Ya NO "claramente".**
  - **B = 0-1** (P≈59%) → "Mezcla": sin dominante claro ("dos formas casi con el mismo peso").
- Documentar `P(banda)` bajo azar junto a cada corte, auditable.

## B. Gatear el NOMBRE del arquetipo (C3) — no etiquetar sobre ruido

- **No dar nombre único [Eje][Motor] por debajo de B=2.** En B=0-1, presentar como par ("entre X e Y") o tendencia sin sustantivo propio.
- Gatear además por **altura del dominante** sobre el azar: exigir `top_count ≥ 6` (o p-valor del nulo) para nombre único; si no, co-líderes. (Un 4-3-3-2 tiene B=1 y dominante 33%, apenas sobre el 25% del azar → no lleva nombre.)

## C. Evolución con umbral de cambio confiable (C1) — no narrar ruido como cambio

- **Narrar cambio de eje dominante solo si AMBOS perfilamientos tenían B≥2 y los ejes difieren.** Cambio de motor solo si el composite cruza el umbral por más que el SEM estimado.
- Si no supera el gate: "se mantiene estable dentro de lo esperable" (texto estático honesto), nunca una trayectoria fabricada.
- **Prohibido narrar evolución si cualquiera de las dos tomas tuvo B≤1.**

## D. Arreglar las fuentes de los temas (C4, C5, C6, C11)

- **"Cuánto lo mueve el grupo"** (renombrado desde "cómo se lleva con los demás", C4): derivar de **I + S combinados** (la mitad-personas de DISC), no solo Conector. Nunca leer bajo-I como individualismo (cruzar con S). Aclarar que NO mide habilidad social ni amistades.
- **Manejo del éxito** (C5): degradar a **observación de escena literal** ("en la meta eligió mirar al próximo reto"), como el momento notable (§4), sin nombre de rasgo. O exigir convergencia (Q12 + eje dominante) antes de afirmar un "así maneja el éxito".
- **"Ante lo inesperado"** (renombrado desde "cómo responde a los cambios", C6): derivar del **eje S** (el sub-puntaje de adaptación como matiz secundario, con regla de reconciliación si divergen). Aplicar corrección por edad a ese sub-puntaje (ver F) o marcarlo no-narratable en edades menores.
- **Frustración**: renombrar a "ante la tormenta / lo adverso, tendió a…"; emitir solo si 2 de 3 escenas coinciden en eje; ante 1-1-1, "respondió de formas distintas según la escena". NUNCA leer afecto (una pausa puede ser reflexión o bloqueo ansioso; no interpretar).
- **Declarar la dependencia entre temas** (C11): frustración + inesperado + momento notable comparten las escenas de tormenta; no presentarlos como evidencia independiente que "coincide".

## E. Banda de incertidumbre para el Motor (C8)

- Zona de amortiguación alrededor de 67 y 33 (p. ej. **60-74 = "entre rítmico y dinámico"**) con lenguaje graduado; no comprometer el nombre del arquetipo a un motor en la zona de amortiguación.
- Exigir los 3 mini-juegos o marcar `motor_narratable=false` cuando falte el de mayor peso (Adaptación, 0.40), en vez de reponderar y aplicar el mismo corte.

## F. Normalización por edad, bien hecha (hallazgos de Estadística)

- **Aplicar la corrección por edad a los TRES sub-motores** (latencia, reacción, adaptación), no solo a la latencia; y a los términos de conteo (extraTaps, inertiaErrors) o declarar por qué no.
- **Definir el modelo:** si el efecto de edad es multiplicativo sobre toda la latencia (dividir el valor mueve el piso de 800 ms) o solo sobre el span (`score = 1 − (x−F)/(R·f)`, piso fijo). Recomendado: declarar explícito cuál.
- Un factor único alinea la media pero no la varianza → considerar **cortes por percentil DENTRO de cada banda de edad** (p33/p67 de la banda) en vez del 67/33 absoluto, o z por edad (centro + escala).
- **factorEdad continuo** (interpolar por meses), no escalón por año; separar 15 y 16 o justificar el bin.
- Normalizar también el **fallback por tiempo de respuesta** (o no asignar motor al arquetipo si es fallback).
- Usar **enumeración exacta de las 455** en vez de Monte Carlo para el nulo; modelar el nulo con permutación sobre respuestas reales cuando haya datos.

## F2. Auto-adaptación a los 500, robusta (Estadística/Psicometría)

- Disparar el blending por **n POR celda (edad)**, no por el total global de 500. Peso de encogimiento empírico-Bayes: `peso = n_celda/(n_celda + k)`, k≈100-200. Percentiles robustos (p10/p90) para floor/range.
- Etiquetar las normas como **"población Argo" (autoseleccionada), no del desarrollo general**.

## G. Lenguaje intra-individual, sin normativas sobre ipsativo (C7)

- Reemplazar **Alto/Medio/Bajo** en conteos de eje por lenguaje relativo al propio chico ("el vínculo con el grupo aparece entre sus motores más elegidos" vs "aparece menos que su propio empuje"). Reservar Alto/Bajo solo para el motor medido, y solo con normas reales.

## H. Bug de la cascada de forma (C12)

- La rama "leve/equilibrio" es inalcanzable (0 de 455). Corregir para que **B=0 de baja concentración (3-3-3-3) mapee a "equilibrio"** (antes de la regla 1), alineado con la banda B=0 de §A. Re-enumerar las 455 y testear que cada forma tiene ≥1 composición y coincide con la banda.

## I. Barandas visibles + seguridad del niño + no-comparación (C10 + banderas)

- **Componente fijo y visible en el informe** con el marco: "foto del presente, no diagnóstico, no comparar entre niños, no seleccionar, no es una definición de quién es el chico". Parte del contrato de formato, no solo del doc.
- **Nota al adulto:** el perfil es para entender y acompañar, no para devolvérselo al niño como identidad ("sos un X").
- **Superficie del coach:** advertencia activa de no-comparación / no-selección; **no mostrar barras de eje crudas comparables columna a columna**; comparación cross-child solo cualitativa (misma forma, ejes compartidos), nunca magnitudes.
- **Reencuadrar todo copy deficitario** ("le cuesta", "Bajo", "no es su primer motor") a preferencia/contexto del presente en positivo o neutro.
- Separar en el doc **"trazabilidad/reproducibilidad" (que el método da) de "validez" (pendiente)**; no usar "determinista" como argumento de validez.

## G (decisión de producto abierta). Motor vs dimensión de pace de DISC (C9)

El Motor (rápido/medio/lento) se solapa con la dimensión de ritmo que DISC ya codifica en los ejes, generando nombres contradictorios ("Impulsor Sereno"). **Requiere decisión del owner.** Opciones en discusión (ver la charla):
- **A. Mantener [Eje][Motor], reencuadrar el Motor como tempo psicomotor** (constructo separado, del roadmap de EF), NO el pace de DISC; copy que no lo lea como un tipo único. Mínima disrupción; validar la correlación con datos.
- **B. Sacar el Motor del NOMBRE**; queda como atributo separado ("su tempo"). Resuelve la contradicción; cambia el esquema de 12 arquetipos (branding).
- **C. Redefinir qué mide el Motor** hacia algo ortogonal a DISC (p. ej. flexibilidad/adaptabilidad) y renombrarlo. Más cambio conceptual.

## Límites inherentes a comunicar (no se corrigen, se asumen)

Ipsativo no comparable entre niños; 12 votos no sostienen alta certeza; cambio con fiabilidad ~0 sin test-retest; validez de constructo no establecida; muestra autoseleccionada; motor de una sola toma en niños con intervalo ancho. Todos deben quedar visibles en el informe/superficie, no solo en el doc.

## Siguiente paso

Con estas correcciones aplicadas al `METODO-CALCULO-NUEVO.md` (y resuelta la decisión G del Motor), volver a pasar el método por **el mismo panel de 4 expertos con el mismo criterio** para confirmar el cierre.
