# Descripción del cambio de perfil entre re-perfilados

> Estado: **IMPLEMENTADO en develop (2026-06-30).** Surgió ideando sobre el timeline de historial
> de perfiles (ya en producción, ver `IDENTIDAD-NINO-Y-PERFILAMIENTOS.md`). Documento autocontenido.

## 0. As-built (lo que quedó construido)
- **Función pura:** `src/lib/profileChange.ts` → `describeProfileChange(curr, prev, lang, childId, childName)`.
  Sin IA. Implementa la matriz de §4 (vector DISC desde `answers`, `S` = intersección de histogramas,
  `argmax Δ` = eje que asoma, motor) y el banco de §5 en es/en/pt, todo probabilístico.
- **Datos:** `api/tenant-sessions.ts` ahora expone `answers` por item del `history` (antes no lo hacía),
  para calcular el vector en el cliente. Se compara `history[0]` (actual) vs `history[1]` (anterior).
- **Render:** `src/pages/tenant/TenantPlayers.tsx`. El bloque del timeline pasó a 2 columnas: historial a la
  izquierda y, a la derecha, una tarjeta compacta destacada (ícono `Sprout`, acento violeta, `text-xs`,
  un par de líneas) con la frase. Solo aparece cuando hay ≥2 perfilamientos resueltos.
- **Variedad:** 3 aperturas × 2 acciones = 6 variantes por situación; se elige por `hash(child_id) mod 6`
  (consistente por niño, variado entre niños). El idioma usado es el del dashboard del tenant (`lang`).
- **Desvíos vs spec:** (1) la garantía anti-adyacente (§5.6) NO se implementó: la frase vive en el detalle
  expandido (un niño a la vez), así que dos frases idénticas pegadas no son visibles; el hash ya da variedad
  entre niños. Si en el futuro se listan varias frases juntas, agregar el dedup adyacente. (2) Umbrales de S
  por defecto del spec (0.85 / 0.6). (3) Cláusula de motor: se muestra siempre que el motor cambie.

## 1. Para qué (contexto)
El timeline ya muestra el cambio entre re-perfilados (ej. Olivia: Conector Rítmico → Impulsor Rítmico, con fechas).
Pero **el padre o entrenador no es especialista en DISC**: ver "Conector → Impulsor" no le dice qué hacer. La idea
es **"masticarle" el cambio**: una frase breve que traduzca, en lenguaje simple, qué se mantiene y qué nuevo
potencial podría estar asomando, cerrando con una **acción concreta** para acompañar. Va como una línea gris
discreta a la derecha/debajo de la entrada "actual" del timeline.

## 2. Decisiones ya tomadas
- **Aporta valor: sí** (traducir el cambio para quien no es especialista).
- **100% determinístico, sin IA.** Los hechos del cambio no pueden estar mal, y se acababa de arreglar un bug de
  alucinación del coach: no se abre una superficie de generación libre en un lugar tan sensible. IA solo en una
  v2 opcional, como redactora, con la matriz como restricción dura + filtro de palabras prohibidas + ground-truth.
- **Idioma:** latino neutro (tuteo, NUNCA voseo), en los 3 idiomas (es/en/pt).

## 3. Principio de voz Argo (vale para TODA la copy del producto)
**Siempre en clave de POTENCIAL. Siempre cerrar con una ACCIÓN concreta. Nunca tajante.**
**Lenguaje SIEMPRE probabilístico** (puede, podría, suele, parece, tiende a): nunca afirmar el comportamiento del
niño de forma categórica. Ej: "podría responder más rápido", NO "responde más rápido"; "parece asomar", NO "asoma".
(Sin "ahora es", "mejoró/empeoró", "cambio notable", talento, ganar, errores, etiquetas, diagnóstico. Cálido,
invitacional. Pasa por el filtro de palabras prohibidas existente.) Registrado también en las reglas de copy.

## 4. La matriz (cómo se calcula el cambio) — dato duro
Cada perfilamiento ya tiene `answers` (`{axis, responseTimeMs}[]`) y `motor`. De ahí:
- **Vector DISC normalizado** `v = (D,I,S,C)` = proporción de las 12 respuestas por eje (suma 1).
- **Estabilidad** `S = Σ min(v_viejo[e], v_nuevo[e])` ∈ [0,1] (intersección de histogramas = 1 − distancia de variación total).
- **Corrimiento por eje** `Δ[e] = v_nuevo[e] − v_viejo[e]`; `argmax Δ` = "lo que más creció".
- **Motor**: igual / más rápido / más pausado.
- **Umbral de ruido (clave):** 12 respuestas → 1 respuesta ≈ 8.3 pp. Corrimientos < ~2 respuestas (≈ `S ≥ 0.85`) se
  describen como "estable / matices", NO como cambio real. Evita leer ruido como evolución.
- Se compara solo contra el perfilamiento `resolved` inmediatamente anterior del mismo niño.
- NOTA: la matriz es el dato duro (determinístico). Lo probabilístico va en la REDACCIÓN, no en el cálculo: la
  frase nunca afirma, siempre sugiere ("parece", "podría"), aunque el cálculo sea exacto.

## 5. El banco de frases (determinístico, es/en/pt)
Estructura: **plantilla (según S) + relleno por eje + cláusula de motor (si cambió).** `{N}` = nombre del niño
(se usa el nombre en la acción, no "lo/la", para evitar género). Todo en clave probabilística.

### 5.1 Plantillas según S
| Caso | es | en | pt |
|---|---|---|---|
| Estable (S≥0.85) | "{N} tiende a mantenerse fiel a su esencia, con [FORTALEZA]. [ACCIÓN_MANTENER]." | "{N} tends to stay true to their essence, with [STRENGTH]. [KEEP_ACTION]." | "{N} costuma se manter fiel à sua essência, com [FORÇA]. [AÇÃO_MANTER]." |
| Moderado (0.6–0.85) | "{N} sigue mostrando su esencia de siempre, y parece asomar un poco más de [RASGO]: un lindo potencial para acompañar. [ACCIÓN_EMERGENTE]." | "{N} keeps showing their usual essence, and a bit more [TRAIT] seems to be emerging: a lovely potential to nurture. [EMERGING_ACTION]." | "{N} segue mostrando a sua essência de sempre, e parece despontar um pouco mais de [TRAÇO]: um belo potencial para acompanhar. [AÇÃO_EMERGENTE]." |
| Mayor (S<0.6) | "En estos meses {N} parece ir mostrando una faceta nueva, con más [RASGO]: un potencial valioso para nutrir. [ACCIÓN_EMERGENTE]." | "Over these months {N} seems to be showing a new facet, with more [TRAIT]: a valuable potential to nurture. [EMERGING_ACTION]." | "Nestes meses {N} parece ir mostrando uma faceta nova, com mais [TRAÇO]: um potencial valioso para nutrir. [AÇÃO_EMERGENTE]." |

### 5.2 Por eje — RASGO que asoma + ACCIÓN_EMERGENTE (la acción es sugerencia al adulto: "puedes / una idea")
| Eje | RASGO (es / en / pt) | ACCIÓN_EMERGENTE (es / en / pt) |
|---|---|---|
| D Impulsor | iniciativa / initiative / iniciativa | "Puedes invitar a {N} a proponer una jugada o a liderar un ejercicio corto." / "You can invite {N} to suggest a play or lead a short drill." / "Você pode convidar {N} a propor uma jogada ou liderar um exercício curto." |
| I Conector | ganas de conectar con el grupo / eagerness to connect with the group / vontade de se conectar com o grupo | "Puedes darle a {N} un rol para animar y unir al grupo." / "You can give {N} a role to energize and bring the group together." / "Você pode dar a {N} um papel para animar e unir o grupo." |
| S Sostenedor | constancia para sostener al equipo / steadiness to support the team / constância para apoiar o time | "Puedes confiarle a {N} una tarea estable donde su constancia pueda lucirse." / "You can entrust {N} with a steady task where that consistency can shine." / "Você pode confiar a {N} uma tarefa estável onde essa constância possa brilhar." |
| C Estratega | atención al detalle / attention to detail / atenção aos detalhes | "Puedes explicarle a {N} el porqué de cada jugada o ejercicio." / "You can explain to {N} the why behind each play or drill." / "Você pode explicar a {N} o porquê de cada jogada ou exercício." |

### 5.3 Caso estable — FORTALEZA + ACCIÓN_MANTENER
| Eje | FORTALEZA (es / en / pt) | ACCIÓN_MANTENER (es / en / pt) |
|---|---|---|
| D | su empuje y sus ganas de tomar la delantera / their drive and eagerness to take the lead / sua garra e vontade de tomar a frente | "Es un buen momento para seguir dándole a {N} espacios donde liderar." / "It's a good time to keep giving {N} chances to lead." / "É um bom momento para continuar dando a {N} espaços para liderar." |
| I | su don para conectar con el equipo / their gift for connecting with the team / seu dom de conectar com o time | "Es un buen momento para seguir dándole a {N} un lugar para unir al grupo." / "It's a good time to keep giving {N} a place to bring the group together." / "É um bom momento para continuar dando a {N} um lugar para unir o grupo." |
| S | su constancia y su rol de sostén / their steadiness and supportive role / sua constância e seu papel de apoio | "Es un buen momento para seguir confiándole a {N} un rol estable en los entrenamientos." / "It's a good time to keep entrusting {N} with a steady role in training." / "É um bom momento para continuar confiando a {N} um papel estável nos treinos." |
| C | su mirada atenta al detalle / their keen eye for detail / seu olhar atento aos detalhes | "Es un buen momento para seguir explicándole a {N} el porqué de las cosas." / "It's a good time to keep explaining to {N} the why behind things." / "É um bom momento para continuar explicando a {N} o porquê das coisas." |

### 5.4 Cláusula de motor (solo si el motor cambió) — en probabilístico
| Cambio | es / en / pt |
|---|---|
| Más rápido | "Además, ahora podría responder de forma más inmediata." / "Also, {N} might now respond more immediately." / "Além disso, agora {N} poderia responder de forma mais imediata." |
| Más pausado | "Además, ahora podría tomarse un poco más de tiempo para decidir, lo que puede darle más calidad a sus jugadas." / "Also, {N} might now take a bit more time to decide, which can add quality to their play." / "Além disso, agora {N} poderia levar um pouco mais de tempo para decidir, o que pode dar mais qualidade às suas jogadas." |
| Igual | (no se agrega nada) |

### 5.5 Ejemplo armado (Olivia: moderado, asoma D, motor igual)
- es: "Olivia sigue mostrando su esencia de siempre, y parece asomar un poco más de iniciativa: un lindo potencial para acompañar. Puedes invitar a Olivia a proponer una jugada o a liderar un ejercicio corto."
- en: "Olivia keeps showing her usual essence, and a bit more initiative seems to be emerging: a lovely potential to nurture. You can invite Olivia to suggest a play or lead a short drill."
- pt: "Olivia segue mostrando a sua essência de sempre, e parece despontar um pouco mais de iniciativa: um belo potencial para acompanhar. Você pode convidar Olivia a propor uma jogada ou liderar um exercício curto."

### 5.6 Variedad — que NO se repita la misma frase entre niños
Riesgo: dos niños en la misma situación (mismo caso+eje+motor) dirían lo mismo, y pegados en la lista se ve robótico.
- Cada frase = **apertura × acción** → **3 aperturas (por caso) × 2 acciones (por eje) = 6 variantes por situación**
  (la cláusula de motor agrega más variación cuando el motor difiere).
- **Elección por niño:** `variante = hash_estable(child_id) mod 6`. Consistente por niño, variado entre niños.
- **Garantía anti-adyacente:** al renderizar, si la frase de un niño coincide con la del de arriba, se salta a la
  siguiente variante. Determinístico. Nunca dos pegados idénticos.
- Aperturas (es, todas probabilísticas, sin género): "sigue mostrando su esencia de siempre, y parece asomar..." /
  "tiende a mantener su forma de ser de siempre, y parece ir sumándose un poco más de..." / "conserva su sello de
  siempre, y parece empezar a crecer en...".
- Acciones (es, eje D): "Puedes invitar a {N} a proponer una jugada o a liderar un ejercicio corto." / "Una idea:
  darle a {N} la oportunidad de dirigir un momento del entrenamiento."

## 6. Decisiones para resolver
1. **¿Se construye?** (recomendado: sí.)
2. **¿Ajustar algún término o acción del banco?** (revisar 5.2/5.3: que el rol/deporte suene bien.)
3. **¿6 variantes por situación alcanzan, o subimos a 3×3 = 9?**
4. **¿Umbrales de S (0.85 / 0.6) ok**, o ajustar sensibilidad?
5. **¿La cláusula de motor se muestra siempre que cambie, o solo en el caso "estable"** (para no recargar)?

## 7. Implementación (cuando se apruebe construir) — referencia
- Función pura `describeProfileChange(prev, curr, lang)` en `src/lib/` (sin IA), alimentada por el `history` que
  `/api/tenant-sessions` ya devuelve (falta exponer `answers` por item, o precalcular el vector DISC en backend).
- Render: línea gris breve bajo la entrada "actual" del timeline en `src/pages/tenant/TenantPlayers.tsx`.
- Reusa `AXIS_*` de `designTokens`. Pasa por el lint de contenido (voseo/guiones) existente.

## 8. Verificación (al implementar)
- Recalcular la matriz a mano sobre los `answers` viejos vs nuevos de Olivia y confirmar la frase elegida.
- Revisar que TODA frase del banco sea probabilística (puede/podría/suele/parece/tiende a), en clave de potencial,
  con acción, sin etiquetas ni veredictos, en los 3 idiomas.
- Re-perfilar un niño de prueba y ver la frase correcta en su timeline, sin repetir con el de arriba.
