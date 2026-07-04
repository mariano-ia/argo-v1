# ArgoPuente — Partición del cuestionario (CORE del adulto + capa relacional por niño)

> Estado: **PROPUESTA (2026-07-02).** Diseño para revisar con socios. Sin fecha de ejecución. NADA construido todavía.
> Contexto: `docs/pricing-v3.md` §3 (el "unlock") y §13 Fase B. Fuente actual del test: `src/lib/puentesQuestions.ts` (15 preguntas, es/en/pt).
> Por qué importa: es la pieza que hace que el modelo del Puente a $4.99 por niño funcione de verdad y que le da coherencia a todo el pricing.

---

## 1. El principio que ordena todo

El cuestionario del adulto se parte en dos, y la pregunta que decide en qué parte va cada ítem es:

**¿Esto describe cómo ES el adulto (rasgo estable), o cómo se relaciona con ESTE niño (vínculo)?**

- **Rasgo estable → CORE.** Se juega **una vez**, se guarda contra el email del adulto (tabla `adult_profiles`), **no vence** y es reutilizable entre todos sus niños. Produce el perfil propio del adulto (su eje DISC + motor + regulación + historia), que es lo que alimenta su informe ("conócete a ti") y se cruza con el perfil de cada niño.
- **Vínculo específico → capa relacional.** Se juega (y se cobra) **por cada niño nuevo**. Es lo corto y lo que justifica el $4.99.

**El detalle fino:** hoy varias preguntas miden un rasgo del adulto pero usando al niño como ancla ("cuando {nombre} te cuenta un problema..."). Esas hay que reformularlas a genérico para que el CORE sea reutilizable. Ese es el grueso del trabajo de contenido.

---

## 2. Parte 1 — CORE: "Tu perfil conductual" (una vez, reutilizable)

Del test actual de 15 preguntas, 14 van al CORE (12 quedan como están o se reformulan; q15 se va a la capa relacional). Se puede podar DISC de 8 a ~6 para acortar, quedando el CORE en **~11-12 preguntas**.

| # | Bloque | Hoy | Destino |
|---|---|---|---|
| q1 | DISC | usa {nombre} | CORE — reformular a genérico |
| q2 | DISC | usa {nombre} | CORE — reformular a genérico |
| q3 | DISC | genérica | CORE — se queda |
| q4 | DISC | genérica | CORE — se queda |
| q5 | DISC | genérica | CORE — se queda |
| q6 | DISC | usa {nombre} | CORE — reformular a genérico |
| q7 | DISC | genérica | CORE — se queda |
| q8 | DISC | genérica | CORE — se queda |
| q9 | Motor | genérica | CORE — se queda |
| q10 | Motor | genérica | CORE — se queda |
| q11 | Presión | usa {nombre} | CORE — reformular a genérico |
| q12 | Presión | usa {nombre} | CORE — reformular a genérico |
| q13 | Presión | usa {nombre} | CORE — reformular a genérico |
| q14 | Historia | genérica | CORE — se queda |
| q15 | Emoción | usa {nombre} | **RELACIONAL** — pasa a la capa por niño |

**Reformular a genérico** significa sacar el nombre del niño y hablar del adulto en general o de "un joven que acompañas" (sin nombre), manteniendo la pregunta concreta. Riesgo de contenido a cuidar: al quitar el ancla del niño concreto, las respuestas pueden volverse más abstractas o aspiracionales. Mitigación: anclar a la vida real del adulto (la familia, el grupo de padres, su propia historia deportiva) en vez de a un hipotético. Esto lo revisa el skill `argo-psych-review`.

---

## 3. Parte 2 — Capa relacional: "Tu vínculo con {nombre}" (por niño, se cobra, se re-juega)

Hoy esto es **una sola** pregunta (la emoción). La llevamos a **6** para que el vínculo tenga señal real y el $4.99 se sienta justo. Borrador (copy en tuteo, pendiente de revisión psico):

1. **Rol / vínculo** (nuevo — define el tono del puente entero)
   *"Tu vínculo con {nombre} es el de:"* → madre o padre / otro familiar / entrenador / otro referente.

2. **Emoción dominante** (es la q15 actual)
   *"Cuando ves jugar a {nombre}, la emoción que más predomina en ti es:"* → orgullo / nervios o ansiedad / disfrute pleno / preocupación / curiosidad / mezcla de varias.

3. **Manejo del éxito** (nuevo — el eje que faltaba; hoy el test es todo presión/fracaso)
   *"Cuando a {nombre} le va muy bien (un gran partido, un logro), lo que más te sale es:"* → celebrarlo a lo grande / marcarle el próximo objetivo / cuidar que no se le suba / disfrutarlo en silencio a su lado.

4. **El vínculo bajo presión** (relacional, distinto del rasgo de regulación del CORE)
   *"Cuando las cosas se ponen difíciles entre tú y {nombre} en lo deportivo:"* → me cuesta no involucrarme de más / le doy demasiado espacio y me alejo / logro estar cerca sin invadir / no sé bien cómo leerlo.

5. **Lo que más deseas para él o ella** (nuevo — intención proyectada, clave para el consejo del puente)
   *"En el deporte, lo que más deseo para {nombre} es:"* → que la pase bien y disfrute / que crezca y se supere / que aprenda a manejar la frustración / que encuentre su lugar en el equipo.

6. **Dónde está la distancia** (opcional, enfoca dónde debe apuntar el puente)
   *"El momento en que más te cuesta conectar con {nombre} en el deporte es:"* → antes (los nervios previos) / durante el partido / en el análisis después / cuando hay una decepción.

---

## 4. Cómo encaja con el pricing (la lógica económica)

El CORE es exactamente el costo que se paga una vez; la capa relacional es lo que se cobra por cada niño. Se mapea solo:

- **ArgoOne+ / primer Puente:** el adulto juega **CORE + relacional** (para el niño A).
- **Puente adicional $4.99** (adulto que ya tiene CORE): **solo relacional** para el niño B. Rápido, 6 preguntas.
- **Re-perfilado del niño a los 6 meses:** el CORE del adulto **NO** se re-juega (es rasgo estable, decisión de ciencia); el puente se regenera contra el perfil fresco del niño.

Primera vez ≈ 17 preguntas; cada niño siguiente ≈ 6. Ese salto es lo que justifica y hace sentir barato el $4.99.

---

## 5. Decisiones abiertas (con recomendación)

1. **Presión: ¿rasgo o vínculo?** Propuesta: medirla como rasgo en el CORE (genérica) **y además** la pregunta relacional #4 para la dinámica específica. Alternativa: sacarla del CORE y medirla solo relacional. **Recomendación: la versión propuesta** (el CORE queda más completo y el adulto obtiene mejor perfil propio).
2. **Largo de la capa relacional: 5 o 6.** La #6 ("dónde está la distancia") es la más accionable para el puente pero suma una pregunta. **Recomendación: incluirla (6).**
3. **Re-perfilado del niño:** cuando el niño se re-perfila, ¿re-preguntamos la capa relacional (el vínculo evoluciona) o regeneramos el puente con las respuestas guardadas? **Recomendación: regenerar con lo guardado y ofrecer "actualizar tu vínculo" como opción.**
4. **Poda del CORE:** ¿bajamos DISC de 8 a 6 para acortar la primera vez? **Recomendación: sí**, quedándonos con las 6 más discriminantes.

---

## 6. Próximo paso (cuando se decida ejecutar)

1. Redactar la versión final: CORE reformulado (sin {nombre}) + la capa relacional completa, en **es / en / pt**.
2. Pasarlo por el skill **`argo-psych-review`** (lenguaje probabilístico, no clínico, centrado en el niño, framing relacional del éxito).
3. Recién ahí, las Fases A/B/C del plan (`docs/pricing-v3.md` §13): tablas `adult_profiles` + `bridges`, resolver `resolveAdultProfile` (core) + scoring relacional por niño, y el flujo profile-first idempotente (saltear el CORE si el adulto ya tiene perfil).
