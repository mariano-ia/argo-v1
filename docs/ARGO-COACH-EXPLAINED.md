# Argo Coach — cómo funciona, de punta a punta

> Explicación de fondo del consultor IA: qué es, la teoría que lo sustenta, qué datos usa y cómo procesa una consulta. Para que cualquiera del equipo entienda el motor sin leer el código.
> Última actualización: 2026-06-04. Relacionados: [CHECK-SYSTEM.md](CHECK-SYSTEM.md), [ARGO-COACH-AUDIT.md](ARGO-COACH-AUDIT.md), `docs/archetype-naming.md`.

## Qué es

El consultor IA del dashboard del entrenador. No perfila niños (eso lo hace la odisea); **lee los perfiles ya calculados de los jugadores de ese tenant y asesora al entrenador en lenguaje natural**: cómo motivar a un jugador, cómo equilibrar un grupo, qué hacer ante una situación de entrenamiento. Backend: `api/tenant-chat.ts`. UI: `src/pages/tenant/TenantChat.tsx`.

---

## 1) La teoría de fondo (el modelo Argo)

Argo es un **DISC reinterpretado para deporte juvenil**. Dos dimensiones ortogonales describen al niño.

**El EJE — qué energía lo mueve** (cada uno con su "combustible", lo que lo hace querer volver a jugar):

| Eje | Energía | Combustible |
|---|---|---|
| **D — Impulsor** | liderazgo, iniciativa, acción directa | impacto visible y desafíos |
| **I — Conector** | social, entusiasmo, cohesión | reconocimiento y pertenencia |
| **S — Sostenedor** | estabilidad, lealtad, constancia | seguridad y rutinas predecibles |
| **C — Estratega** | analítica, precisión, observación | comprensión y tiempo para procesar |

> Detalle de naming: el eje S se llama "Sostén" (la cualidad), pero el arquetipo es "Sostenedor" (quien sostiene). Es intencional (ver `docs/archetype-naming.md`).

**El MOTOR — a qué tempo decide** (de percibir a actuar). Clave interna → nombre visible: **Rápido → Dinámico, Medio → Rítmico, Lento → Sereno**. Una sola excepción: **C + Lento = "Observador"**. El método insiste: *no hay motor mejor ni peor*; el lento se reencuadra como "profundidad de procesamiento", nunca como falta.

**Los 12 arquetipos = 4 ejes × 3 motores**: Impulsor Dinámico/Rítmico/Sereno, Conector Dinámico/Rítmico/Sereno, Sostenedor Dinámico/Rítmico/Sereno, Estratega Dinámico/Rítmico/Observador. El nombre visible se **deriva siempre de eje+motor** (`canonicalArchetype`), nunca del `archetype_label` congelado en DB.

**La brújula secundaria**: el segundo eje más fuerte matiza al principal (ej. un Impulsor con brújula social *lidera pero busca consenso*).

**La filosofía — es regla dura en el prompt, no un adorno:**
- **Lenguaje probabilístico obligatorio**: "tiende a", "puede", "probablemente". Nunca categórico.
- **Siempre desde la fortaleza**: prohibido "le falta / es débil / tiene un problema". ~35 palabras vetadas.
- **"No hay niños incorrectos, hay adultos que todavía no encontraron la sintonía."**
- **El objetivo es que el adulto sintonice con el niño, no que el niño cambie.** El perfil es una "fotografía del presente", no evalúa talento ni predice el futuro.

Replicada idéntica en es/en/pt en los tres `SYSTEM_PROMPTS`.

---

## 2) De dónde salen los datos que usa

El Coach lee filas de la tabla `sessions`. Esos datos nacen de 3 etapas **durante el juego del niño**:

1. **La odisea → eje + motor (100% determinista, en el cliente).** Las 12 preguntas registran el eje elegido **y el tiempo de respuesta** por pregunta (`profileResolver.ts`). El **eje** sale del más votado; el **motor** de 3 mini-juegos ponderados (impulso 0.30 + ritmo 0.30 + adaptación 0.40) o, sin juegos, del tiempo promedio (`<5s` Dinámico, `>12s` Sereno). Hay desempates que dispersan ejes/motores para que un grupo no quede todo igual. **La IA no decide el arquetipo: lo decide el algoritmo.**
2. **Reporte determinista** (`argosEngine.ts`): con eje+motor arma el esqueleto del informe (perfil, combustible, corazón, checklist, palabras puente/ruido), localizado es/en/pt.
3. **`ai_sections` con Gemini** (`api/generate-ai.ts`): redacta la prosa final personalizada. El perfil se guarda **antes** que la IA; si la IA falla, la fila queda con `ai_sections=null` para regenerar (nunca se manda un reporte genérico).

**Qué consume el Coach de cada jugador:** `eje, motor, eje_secundario, archetype_label, child_name, child_age, sport` en bloque (liviano) y, solo cuando mencionas a un jugador puntual, su `ai_sections` (resumen, combustible, corazón, reseteo, palabras puente/ruido).

> En simple: el "qué es" del niño lo decide un algoritmo determinista; la IA solo lo pone en palabras. El Coach es la tercera capa que conversa sobre todo eso.

---

## 3) Cómo procesa una consulta (el flujo)

1. **Auth + tenant**: valida el Bearer token y resuelve el tenant.
2. **Guardas**: fair-use (no bloqueante), trial (tope 10 mensajes), rate-limit (60/hora), recorta el mensaje a 2000 chars.
3. **Carga el equipo**: sesiones del tenant (hasta su `roster_limit`, máx 1000) + grupos; arma un resumen de equipo (distribución por eje/motor), con nombres canónicos.
4. **Detecta de qué hablas** e inyecta contexto (las 3 features de abajo).
5. **Anonimiza** todo (nombres → `{{Pn}}`).
6. **Llama al modelo** (Gemini Flash/Pro, fallback OpenAI).
7. **Post-procesa**: filtro de palabras prohibidas + validación de eje correcto.
8. **Rehidrata** (`{{Pn}}` → nombre real), guarda la conversación, escribe telemetría (`ai_events`), responde.

---

## 4) Las 3 features de contexto

- **Perfil individual**: si nombras a un jugador, inyecta su perfil real (arquetipo derivado de eje+motor + su reporte). Matcher acento-insensible y a prueba de homónimos.
- **Dinámica de grupo**: si nombras un grupo, calcula su distribución por eje/motor y lo clasifica en uno de 5 perfiles grupales (Competitivo / Social / Cohesivo / Metódico / Balanceado) con herramientas concretas.
- **Guías situacionales**: matriz curada de **12 situaciones × 4 ejes = 48 tarjetas** ("no quiere arrancar", "se frustra cuando pierde"…), detectada por palabras clave y orientada al perfil del jugador/grupo.

---

## 5) Anti-alucinación y privacidad

**5 capas anti-alucinación:**
1. **Base de conocimiento cerrada** en el prompt (los 12 arquetipos) → no puede inventar un perfil.
2. **Inyección del perfil real** derivado de eje+motor (nunca el label viejo congelado).
3. **Filtro de ~35 palabras prohibidas**: si aparece lenguaje clínico/negativo, reintenta; si persiste, sirve un mensaje neutro seguro. Nunca entrega copy clínico sobre un niño.
4. **Few-shot por idioma** que fija el tono.
5. **Validación ground-truth**: chequea que no atribuya el eje equivocado al jugador ni use nombres viejos prohibidos.

**Privacidad: Gemini/OpenAI NUNCA ven el nombre real de un niño.** Cada jugador recibe un placeholder `{{Pn}}`; los nombres se reemplazan con un regex acento-seguro (protege José/Ángel) antes de enviar y se rehidratan solo para mostrar. Ni los logs ni la telemetría guardan el nombre. Lo único que llega al modelo es edad/deporte/perfil DISC, desvinculado de la identidad.

---

## 6) Modelos, límites y producto

- **Modelos por plan**: Enterprise → **Gemini 2.5 Pro** (con thinking budget); PRO/Academy → **Gemini 2.5 Flash**; fallback a **OpenAI gpt-4o-mini**. Temperatura 0.4, máx 2000 tokens.
- **Límites**: fair-use soft cap **invisible y no bloqueante** (trial 10 / PRO 500 / Academy 1000 al mes); trial duro 10 mensajes; rate-limit 60/hora.
- **UX**: panel de historial (Hoy/Semana/Anteriores), prompts sugeridos clickeables, errores con botón "Reintentar" (sin perder la pregunta y sin consumir consulta), disclaimer "Argo Coach puede cometer errores… no reemplazan el criterio profesional".
- **Posicionamiento**: convierte el reporte estático en **asesoría aplicada** (perfil real + balance de equipo + guía situacional). "Incluido" en los planes institucionales.

---

## 7) El Coach hoy (estado endurecido — junio 2026)

Naming canónico derivado de eje+motor, matcher acento/mayúscula-insensible, fallback resiliente, fallback seguro de palabras prohibidas, y **3 capas de monitoreo en producción** (telemetría `ai_events` + checks de tasa + canary diario). Auditoría completa: [ARGO-COACH-AUDIT.md](ARGO-COACH-AUDIT.md). Monitoreo: [CHECK-SYSTEM.md](CHECK-SYSTEM.md).
