# ArgoCoach: modo consultivo + grupos de química

> As-built del cambio del 2026-07-02 en `api/tenant-chat.ts`. Objetivo: que el
> consultor deje de responder "en automático" ante consultas vagas y adopte una
> postura consultiva (indagar antes de recetar), y que conozca los grupos de
> química además de los planteles.

## Problema

Ante una consulta abierta y sin contexto ("Juancito se porta mal, ¿qué hago?"),
el asistente respondía de inmediato con la receta del arquetipo. Tres causas:
los ejemplos few-shot solo modelaban "pregunta → consejo inmediato", la regla de
brevedad empujaba a resolver en un turno, y las tarjetas situacionales inyectadas
le daban la respuesta servida. Además, el chat no conocía los grupos de química
(`chem_groups`): solo veía planteles (`groups`) y el equipo completo.

## Solución (4 piezas, todas en `api/tenant-chat.ts`)

### 1. Sección MODO CONSULTIVO en los 3 system prompts (es/en/pt)
- Distingue pregunta ESPECÍFICA (responder directo) de PROBLEMA ABIERTO sin
  contexto (indagar primero).
- Contexto mínimo para recomendar: desde cuándo, en qué momentos, qué señales
  concretas observa el adulto.
- Turno exploratorio de 3 partes: validar + UNA lectura tentativa anclada al
  perfil real + 2-3 preguntas discriminantes. Nunca responder solo con
  preguntas (cada turno aporta valor; relevante para el cap de trial).
- Límite de seguridad de las preguntas: siempre comportamiento observable en la
  actividad; nunca preguntas de corte clínico ni sobre la vida privada de la
  familia (coherente con las reglas 3 y 12).
- UNA sola ronda de indagación por situación; si el entrenador ya dio contexto
  o pide respuesta directa, responder.

### 2. Nuevo ejemplo few-shot por idioma
"Tengo un jugador que se porta mal, ¿qué hago?" → respuesta modelo con el
formato consultivo. Es la palanca más fuerte en Gemini Flash: los ejemplos
pesan más que las reglas abstractas.

### 3. Empujón determinístico de primer turno
- El fetch de historia del hilo se movió al `Promise.all` de sesiones/grupos
  (de paso ahorra un round-trip) para conocer `isFirstTurn` antes de armar las
  inyecciones.
- Si el hilo ABRE con un jugador mencionado, un grupo mencionado o una
  situación detectada, se inyecta en `extraContext` la nota "PRIMERA CONSULTA
  DE ESTE HILO..." que le recuerda al modelo evaluar el contexto mínimo y
  aplicar el modo consultivo si falta. El juicio de suficiencia queda en el
  modelo; la nota solo hace confiable la regla en Flash.
- En primer turno, el encabezado de la tarjeta situacional se reencuadra como
  "mapa de hipótesis para elegir preguntas", no receta a recitar.

### 4. Grupos de química en el contexto del chat
- Se traen los `chem_groups` del caller (scope espejo de
  `tenant-chem-groups.ts`: `owner_member_id` = miembro llamador, filtrados por
  plantel cuando hay sombrero de plantel activo; callers legacy sin member row
  no tienen).
- Se normalizan a la misma forma que los planteles y entran al MISMO matcher de
  menciones (fuerte/débil con triggers de proximidad) y a `buildGroupStats`.
- En las inyecciones se etiquetan: `(plantel, N jugadores)` vs
  `(grupo de química del usuario, N jugadores)`.
- El resumen de equipo ahora lista también "Grupos de química del usuario" para
  que el modelo pueda pedir aclaración cuando el matcher no dispara.

## Qué NO cambió (guardrails intactos)

Filtro de palabras prohibidas + retry + fallback seguro, detector de lenguaje
determinista, validación de ground truth (eje + etiquetas viejas), anonimización
`{{Pn}}` (Gemini nunca ve nombres reales), nota anti-invención para nombres
desconocidos, reglas de dominio/derivación. Todos corren post-generación sobre
cada respuesta, incluidos los turnos de indagación.

## Verificación

- `npm run typecheck:api`, `npm run check:api-imports`, `qa:unit`
  (coach-helpers 10/10) y `npm run lint:content` en verde.
- Revisión adversarial multi-agente del diff (correctness, privacidad, copy):
  4 hallazgos confirmados, todos corregidos en el mismo commit:
  1. **Nombres de grupos anonimizados antes de inyectar** (`promptGroupName` =
     `sanitize` + `anonymize`): los nombres de grupos de química son texto del
     usuario y pueden contener nombres reales de niños ("Dupla Juan y Mateo");
     ahora pasan por el mismo `{{Pn}}` que todo lo demás. Aplica también a los
     planteles (hueco pre-existente) y endurece la superficie de prompt
     injection vía nombres de grupo.
  2. **Desambiguación por tipo**: si un plantel y un grupo de química comparten
     nombre, la pregunta de aclaración incluye el tipo ("¿Te refieres a X
     (plantel) o a X (grupo de química del usuario)?").
  3. **Guard de `member_id` en la historia del POST** (pre-existente): el fetch
     de historia ahora se scopea al miembro llamador, igual que el GET, para
     que un `thread_id` ajeno adivinado no inyecte la conversación de otro
     miembro al contexto del modelo.
  4. **Em dash eliminado** del encabezado de tarjeta situacional en primer
     turno (regla de puntuación del proyecto).

## Pendientes sugeridos

- Casos de eval en `scripts/qa/ai-eval.ts`: (a) primer turno vago → la
  respuesta contiene preguntas; (b) pregunta específica → respuesta directa;
  (c) segundo turno con contexto → guía completa sin re-preguntar.
- Ver análisis de mejoras de ArgoCoach (sesión 2026-07-02) para el roadmap.
