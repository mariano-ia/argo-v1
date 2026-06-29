# La Odisea de Argo — Preguntas, cálculo del perfil y personalización del informe

> Documento de referencia interna. Fuente de verdad del código:
> - Preguntas en vivo: `src/lib/onboardingDataI18n.ts` (`QUESTIONS_I18N.es`)
> - Cálculo del perfil: `src/lib/profileResolver.ts`
> - Datos del arquetipo (base del informe): `src/lib/argosEngine.ts` + `src/lib/archetypeData.ts`
> - Personalización con IA: `api/generate-ai.ts`

---

## 1. Cómo leer el mapeo de ejes

Los 4 ejes del modelo DISC, con su nombre Argo:

| Eje | Nombre Argo | Idea central |
|-----|-------------|--------------|
| **D** | **Impulsor** | Acción, velocidad, lanzarse |
| **I** | **Conector** | Vínculo, equipo, charla |
| **S** | **Sostenedor** | Calma, constancia, sostener al grupo |
| **C** | **Estratega** | Análisis, orden, precisión |

**Importante:** una pregunta NO corresponde a un solo eje. Cada una de las 12 preguntas ofrece **4 opciones, y cada opción apunta a un eje distinto** (D, I, S, C). El niño "vota" un eje cada vez que elige una opción. Por eso, las 12 preguntas reparten siempre los 4 ejes.

> El orden de las opciones y sus colores (A=sky, B=amber, C=violet, D=emerald) son **posicionales** y nunca delatan el eje. El eje está oculto detrás de cada opción.

---

## 2. Listado de las 12 preguntas (con el eje de cada opción)

### Pregunta 1 — El Despegue
*¡Es hora de zarpar! ¿Qué haces primero?*

| Opción | Eje |
|--------|-----|
| Reviso que todo esté listo | **C** (Estratega) |
| ¡Salto al barco ya! | **D** (Impulsor) |
| Me instalo con calma | **S** (Sostenedor) |
| Busco a mis amigos | **I** (Conector) |

### Pregunta 2 — El Nuevo Ritmo
*El capitán enseña una nueva forma de remar. ¿Cómo la aprendes?*

| Opción | Eje |
|--------|-----|
| Primero entiendo cómo funciona | **C** (Estratega) |
| Me lanzo a probar de una | **D** (Impulsor) |
| Que me muestren paso a paso | **S** (Sostenedor) |
| La practicamos todos juntos | **I** (Conector) |

### Pregunta 3 — El Motor del Viaje
*¿Qué te hace sonreír mientras navegamos?*

| Opción | Eje |
|--------|-----|
| Aprender trucos nuevos | **C** (Estratega) |
| Mantener un ritmo constante | **S** (Sostenedor) |
| Charlar con los demás | **I** (Conector) |
| Sentir que vamos rápido | **D** (Impulsor) |

### Pregunta 4 — La Encrucijada
*El mapa muestra dos caminos. ¿Cómo decides?*

| Opción | Eje |
|--------|-----|
| Escucho qué opinan todos | **I** (Conector) |
| Analizo el mapa y el viento | **C** (Estratega) |
| Elijo el más directo | **D** (Impulsor) |
| Me aseguro de que el camino sea seguro | **S** (Sostenedor) |

### Pregunta 5 — El Momento del Caos
*¡La tormenta nos atrapa! ¿Qué haces?*

| Opción | Eje |
|--------|-----|
| Mantengo mi posición para que el barco no se mueva | **S** (Sostenedor) |
| Me muevo rápido a ayudar | **D** (Impulsor) |
| Pienso qué es lo importante | **C** (Estratega) |
| Busco a mis compañeros | **I** (Conector) |

### Pregunta 6 — El Desajuste
*Una ola inclina el barco. ¿Qué te sale hacer?*

| Opción | Eje |
|--------|-----|
| ¡Grito "vamos equipo!" | **I** (Conector) |
| Agarro lo que pueda | **D** (Impulsor) |
| Miro qué se soltó | **C** (Estratega) |
| Me quedo firme en mi lugar | **S** (Sostenedor) |

### Pregunta 7 — El Nudo Rebelde
*Tu nudo se soltó. ¿Qué haces primero?*

| Opción | Eje |
|--------|-----|
| Respiro y lo intento de nuevo | **S** (Sostenedor) |
| Veo qué parte falló | **C** (Estratega) |
| Lo rehago con más fuerza | **D** (Impulsor) |
| Pido ayuda a un compañero | **I** (Conector) |

### Pregunta 8 — El Empuje
*El equipo está cansado. ¿Cómo los animas?*

| Opción | Eje |
|--------|-----|
| Digo algo divertido | **I** (Conector) |
| Recuerdo cuánto falta | **C** (Estratega) |
| Sigo remando igual | **S** (Sostenedor) |
| Remo más fuerte | **D** (Impulsor) |

### Pregunta 9 — La Espera
*Te toca descansar un momento. ¿Qué haces?*

| Opción | Eje |
|--------|-----|
| Observo y aprendo | **C** (Estratega) |
| Me preparo para actuar | **D** (Impulsor) |
| Recupero energía | **S** (Sostenedor) |
| Doy ánimos al equipo | **I** (Conector) |

### Pregunta 10 — El Apoyo
*A un compañero se le cae el remo. ¿Qué haces?*

| Opción | Eje |
|--------|-----|
| Le choco la mano, ¡todos bien! | **I** (Conector) |
| Le enseño un truco | **C** (Estratega) |
| Lo ayudo a recuperarlo rápido | **D** (Impulsor) |
| Me pongo a su lado | **S** (Sostenedor) |

### Pregunta 11 — La Práctica Final
*Hay que repetir una maniobra muchas veces. ¿Qué te ayuda?*

| Opción | Eje |
|--------|-----|
| Que cada vez salga mejor | **C** (Estratega) |
| Hacerla como un juego con todos | **I** (Conector) |
| Que se vuelva fácil y natural | **S** (Sostenedor) |
| Ponerme un reto de velocidad | **D** (Impulsor) |

### Pregunta 12 — La Meta
*¡Llegamos a la playa! ¿Qué piensas primero?*

| Opción | Eje |
|--------|-----|
| ¡Increíble aventura juntos! | **I** (Conector) |
| ¡Qué bien salió el plan! | **C** (Estratega) |
| ¡Llegamos todos a salvo! | **S** (Sostenedor) |
| ¿Cuál es la próxima isla? | **D** (Impulsor) |

> Las 12 preguntas están perfectamente balanceadas: cada eje aparece exactamente **una vez por pregunta** y **12 veces en total** a lo largo del juego.

---

## 3. Cómo se calcula el perfil definitivo (versión simple)

El perfil final es siempre la combinación de **dos cosas**:

```
PERFIL = EJE  +  MOTOR
         (cómo decide)  (a qué velocidad)
```

Eso da uno de los **12 arquetipos** (`[Eje] [Motor]`: Impulsor/Conector/Sostenedor/Estratega × Dinámico/Rítmico/Sereno; el caso C + Lento se llama "Observador").

### El EJE → sale de las 12 preguntas
1. Se cuenta cuántas veces el niño eligió cada eje (D, I, S, C) en las 12 respuestas.
2. El eje con **más votos** es el **eje dominante** (el arquetipo principal).
3. El segundo eje más votado es el **eje secundario** ("tendencia"), que matiza el perfil.

Ejemplo: 6 respuestas D, 3 I, 2 S, 1 C → eje dominante = **D (Impulsor)**, tendencia secundaria = **I (Conector)**.

### El MOTOR → NO sale de las preguntas, sale de 3 minijuegos
El motor mide la **velocidad/impulsividad** con 3 minijuegos durante la odisea:

| Minijuego | Qué mide | Peso |
|-----------|----------|------|
| El cofre del Capitán (Islas) | Impulso (latencia al elegir cartas) | 30% |
| Mar abierto (esquivar) | Ritmo (tiempo de reacción) | 30% |
| La Tormenta (adaptar) | Adaptación (rapidez + errores) | 40% |

Cada juego da un puntaje de 0 a 100, se promedian con esos pesos, y el promedio define el motor:
- **≥ 67 → Rápido** (Dinámico)
- **34 a 66 → Medio** (Rítmico)
- **≤ 33 → Lento** (Sereno)

> **Plan B (legacy):** si por algún motivo no hay datos de los minijuegos, el motor se estima con el **tiempo promedio de respuesta** de las preguntas (< 5 s = Rápido, > 12 s = Lento, en medio = Medio).

### Un ajuste fino: el "tiebreaker" de dispersión
Para que un grupo entero no salga con el mismo arquetipo, cuando hay un **empate exacto** entre ejes (o demasiados "Medio" seguidos), el sistema desempata favoreciendo el eje/motor **menos representado** en ese grupo. Esto solo actúa en empates; nunca cambia un resultado claro.

### Resultado
Con el eje dominante + el motor, se busca la combinación en la tabla de 12 arquetipos y se obtiene el **arquetipo final** (ej. "Impulsor Dinámico"). Ese arquetipo + la tendencia secundaria son la base del informe.

---

### Versión técnica (resumen)
- `resolveFromAnswers(answers, sessionCtx, gameMetrics)` en `profileResolver.ts`:
  - **Eje:** `axisCounts[D/I/S/C]` ← suma de `answer.axis`; se ordena de mayor a menor. `dominantAxis = sorted[0]`, `ejeSecundario = sorted[1]`.
  - **Motor:** `resolveMotorFromGames()` (composite ponderado 0.30/0.30/0.40 → umbral 67/33). Si devuelve `null`, fallback por `avgMs` de `responseTimeMs`.
  - **Tiebreaker:** solo si `diff === 0` (eje) o si `priorMotors` tiene >60% "Medio"; usa `sessionCtx.priorEjes / priorMotors` para elegir el menos representado.
  - **Arquetipo:** `ARQUETIPOS.find(a => a.eje === dominantAxis && a.motor === motor)`.

---

## 4. Dónde está personalizado el informe

El informe se arma en **dos capas**: una base fija por arquetipo y una capa de IA que la reescribe para ese niño concreto.

### Capa 1 — Base determinista (igual para todos los del mismo arquetipo)
`getReportData(eje, motor, ...)` en `argosEngine.ts` toma el texto curado del arquetipo desde `archetypeData.ts` (es/en/pt). Ese contenido es fijo por arquetipo; la única personalización en esta capa es **inyectar el nombre** del deportista en cada sección (`injectNombre`).

Secciones que vienen de la base: `wow`, `motorDesc`, `combustible`, `corazon`, `reseteo`, `ecos`, `guia`, `checklist` (antes/durante/después), `palabrasPuente`, `palabrasRuido`.

### Capa 2 — Personalización con IA (lo que hace único cada informe)
`api/generate-ai.ts` (Gemini 2.5 Flash) toma esa base y la **reescribe personalizándola** con el contexto real del jugador. Esto es lo que de verdad hace el informe "a medida":

Variables de contexto que entran al prompt (`ReportContext`):
- **`nombre`** del deportista
- **`deporte`** → se piden ejemplos concretos (jugadas, momentos del partido, situaciones de entrenamiento de ese deporte)
- **`edad`** → ajusta el tono y los ejemplos
- **`destinatario`** (padre/madre o entrenador)
- **`lang`** (es/en/pt)
- **Eje secundario / tendencia** → se menciona sutilmente en `wow`, `combustible` y `corazon` sin diluir el arquetipo principal

Secciones que la IA genera/reescribe personalizadas:
- **`resumenPerfil`** (Retrato de Sintonía): retrato emocional rápido, nuevo en cada informe
- **`wow`**, **`motorDesc`**, **`combustible`**, **`corazon`**: reescritas con ejemplos del deporte y la edad
- Refuerzo de `palabrasPuente` / `palabrasRuido` y del párrafo de tendencia

### Controles de calidad sobre la salida de IA (anti-alucinación)
Antes de mandar el informe, `generate-ai.ts` aplica varias capas de seguridad:
- **Filtro de palabras prohibidas** (35+ términos clínicos / deterministas / etiquetas negativas) → si aparece alguno, regenera.
- **Validación de eje** (ground truth): verifica que la IA no le atribuya al niño el eje equivocado.
- **Resiliencia:** 1 reintento si falla la API + 1 reintento si el JSON no parsea, con fallback de proveedor.

### Resumen de quién aporta qué

| Parte del informe | Origen | ¿Personalizado por niño? |
|-------------------|--------|--------------------------|
| Arquetipo (Eje + Motor) | Cálculo determinista | Sí (según respuestas + juegos) |
| Texto base de cada sección | `archetypeData.ts` | Solo nombre inyectado |
| `resumenPerfil`, `wow`, `combustible`, `corazon`, `motorDesc` | IA (Gemini) | **Sí** (deporte, edad, nombre, tendencia) |
| Palabras puente/ruido, tendencia | Base + refuerzo IA | Parcial |
| Control anti-alucinación | `generate-ai.ts` | (validación, no contenido) |

---

*Última actualización: 2026-06-18.*
