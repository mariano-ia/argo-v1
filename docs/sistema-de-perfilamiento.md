# Argo Method — Sistema de Perfilamiento Conductual

## Documento de referencia interno

Este documento describe el sistema completo de perfilamiento conductual de Argo Method: qué medimos, cómo lo medimos, qué significa cada resultado y cómo se construye el informe final. Está pensado para cualquier persona que necesite entender el sistema sin conocimiento previo de DISC ni de la plataforma.

---

## 1. Qué es Argo Method

Argo Method es una herramienta de inteligencia deportiva para niños y jóvenes de 8 a 16 años. A través de una experiencia interactiva gamificada de aproximadamente 12 minutos ("La Odisea del Argo"), genera un perfil conductual personalizado basado en dos dimensiones:

1. **Eje conductual** — cómo el niño se comporta naturalmente (basado en el modelo DISC)
2. **Motor de procesamiento** — con qué tempo toma decisiones y reacciona a cambios

El resultado es un informe único que le dice al adulto (entrenador, padre, institución) cómo comunicarse de manera efectiva con ese niño en el contexto deportivo.

---

## 2. El modelo DISC aplicado al deporte

El modelo DISC es un marco de comportamiento desarrollado originalmente por William Moulton Marston en 1928. Clasifica el comportamiento observable en 4 ejes. Argo lo adapta al contexto deportivo infantil con nombres accesibles:

### Los 4 ejes

| Eje DISC | Nombre en Argo | Motivación central | Rol en el equipo |
|----------|----------------|--------------------|--------------------|
| **D** (Dominancia) | Impulsor | Impacto y control | Acción, resolución inmediata, coraje |
| **I** (Influencia) | Conector | Conexión y energía grupal | Cohesión social, entusiasmo del equipo |
| **S** (Estabilidad) | Sostén | Estabilidad y bienestar del grupo | Confiabilidad, apoyo, consistencia |
| **C** (Conciencia) | Estratega | Precisión y comprensión | Análisis, reconocimiento de patrones, calidad |

Cada niño tiene actividad en los 4 ejes, pero uno predomina. Ese eje dominante define la primera mitad de su perfil.

### Cómo se mide el eje

El niño responde 12 preguntas situacionales durante La Odisea. Cada pregunta presenta un escenario deportivo con 4 opciones de respuesta. Cada opción mapea internamente a un eje (D, I, S o C), pero el niño nunca ve esta clasificación.

**Ejemplo:**

> *"El puerto ya es una línea en el horizonte. ¿Qué haces?"*
> - A) Revisas el mapa para saber exactamente dónde están → **C**
> - B) Tomas el timón y marcas el rumbo → **D**
> - C) Te aseguras de que todos estén cómodos → **S**
> - D) Empiezas a cantar para animar al grupo → **I**

Las opciones siempre se presentan con colores posicionales fijos (A=celeste, B=ámbar, C=violeta, D=esmeralda) que no revelan el eje.

Al finalizar las 12 preguntas, se cuenta cuántas respuestas cayeron en cada eje. El eje con más respuestas es el **eje dominante**.

**Desempate:** Si dos ejes empatan exactamente en cantidad de respuestas, el sistema consulta las últimas 50 sesiones previas y elige el eje menos representado entre los candidatos empatados. Esto mejora la diversidad de perfiles en la base de datos sin alterar la precisión individual.

---

## 3. El motor de procesamiento

El motor mide el **tempo conductual** del niño: con qué velocidad procesa estímulos y toma decisiones. No es velocidad física ni inteligencia — es una preferencia de ritmo.

### Los 3 tipos de motor

| Motor | Nombre descriptivo | Descripción |
|-------|-------------------|-------------|
| **Rápido** | Dinámico | Actúa primero, ajusta después. Distancia corta entre percepción y acción. Necesita canalizar la energía. |
| **Medio** | Rítmico | Se adapta al contexto. Puede acelerar y frenar según lo que pide la situación. |
| **Lento** | Sereno | Procesa antes de actuar. Lee la situación, elige con calma. Necesita anticipación, no presión. |

### Cómo se mide el motor

El motor se mide a través de 3 mini-juegos integrados en La Odisea. Cada juego mide un **vector conductual** distinto, y la combinación ponderada de los tres produce el motor final.

#### Vector 1 — Impulso Inicial (peso: 30%)

**Qué mide:** Cuánto tarda el niño en actuar cuando aparece un estímulo nuevo y desconocido. Un niño "dinámico" toca inmediatamente. Un niño "sereno" observa primero.

**Juego: "El cofre del Capitán"**
Aparece una grilla de posiciones vacías. Las cartas aparecen de a una, boca abajo, con un brillo suave. No hay timer visible, no hay instrucción de apurarse. El niño toca la carta cuando quiere para revelarla. Se repite 6 veces.

**Métricas capturadas:**
- Latencia por carta (milisegundos desde que aparece hasta que el niño la toca)
- Latencia promedio
- Desviación estándar (consistencia)
- Tendencia (las últimas cartas son más rápidas o más lentas que las primeras)

**Fórmula de puntuación (0-100):**
```
Puntuación = (1 - (latencia_promedio - 800) / 4200) × 100
```
- Menos de 800ms = 100 (muy rápido)
- Más de 5000ms = 0 (muy deliberado)

#### Vector 2 — Ritmo Sostenido (peso: 30%)

**Qué mide:** Cuál es la cadencia natural del niño cuando debe mantener una actividad repetitiva. Mide tanto la velocidad de reacción como la impulsividad (taps extra sin estímulo).

**Juego: "Mar Abierto" (esquivar olas)**
El barco navega y aparecen obstáculos (rocas, olas, remolinos). El niño toca la pantalla para saltar cada obstáculo. Dura 13 segundos.

**Métricas capturadas:**
- Tiempo de reacción por obstáculo (ms desde aparición hasta tap)
- Tiempo de reacción promedio
- Taps totales vs taps efectivos (los taps extra = impulsividad)
- Cadencia entre taps consecutivos
- Tendencia temporal (acelera o frena)

**Fórmula de puntuación (0-100):**
```
Puntuación_reacción = (1 - (reacción_promedio - 200) / 1300) × 100
Bonus_impulsividad = min(15, taps_extra × 5)
Puntuación = min(100, Puntuación_reacción + Bonus_impulsividad)
```
- Menos de 300ms de reacción = 100
- Más de 1500ms de reacción = 0
- Los taps impulsivos suman hasta +15 puntos (indican un motor rápido)

#### Vector 3 — Adaptación (peso: 40%)

**Qué mide:** Cuánto tarda el niño en ajustar su comportamiento cuando las condiciones cambian. Es el vector más importante porque en el deporte las condiciones cambian constantemente.

**Juego: "Después de la Tormenta"**
Aparecen estrellas doradas y plateadas sobre la escena del mar. La regla inicial es "toca las doradas". Después de unos segundos, un relámpago marca un cambio: ahora debe tocar las plateadas. La regla cambia dos veces durante el juego (3 fases en total, ~23 segundos).

**Métricas capturadas:**
- Tiempo de adaptación por cambio de regla (ms desde el cambio hasta el primer tap correcto)
- Tiempo de adaptación promedio
- Errores de inercia (tocar el color anterior después del cambio)
- Taps correctos totales vs incorrectos totales

**Fórmula de puntuación (0-100):**
```
Puntuación_adaptación = (1 - (adaptación_promedio - 300) / 3700) × 100
Penalidad_inercia = min(30, errores_de_inercia × 10)
Puntuación = max(0, Puntuación_adaptación - Penalidad_inercia)
```
- Menos de 500ms para adaptarse = 100
- Más de 4000ms para adaptarse = 0
- Cada error de inercia resta hasta 10 puntos (máximo -30)

### Cálculo del motor final

Los tres vectores se combinan con promedio ponderado:

```
Motor = (Impulso × 0.30) + (Ritmo × 0.30) + (Adaptación × 0.40)
```

Adaptación pesa más porque es el indicador más relevante para el deporte real.

| Rango del compuesto | Motor resultante |
|----------------------|------------------|
| 67 a 100 | Rápido (Dinámico) |
| 34 a 66 | Medio (Rítmico) |
| 0 a 33 | Lento (Sereno) |

**Normalización:** Si un mini-juego no se completó por cualquier motivo, los pesos se redistribuyen proporcionalmente entre los juegos disponibles.

**Fallback:** Si ningún mini-juego está disponible (por ejemplo, en sesiones anteriores al nuevo sistema), se usa un método legacy basado en el tiempo promedio de respuesta a las 12 preguntas.

---

## 4. Los 12 arquetipos

La combinación de eje dominante (4 opciones) × motor (3 opciones) produce 12 arquetipos posibles:

### Impulsores (eje D — Dominancia)

| Arquetipo | Motor | Perfil |
|-----------|-------|--------|
| **Impulsor Dinámico** | Rápido | Acción directa y resolución inmediata. Lidera con velocidad. |
| **Impulsor Decidido** | Medio | Iniciativa estratégica con ejecución con propósito. |
| **Impulsor Persistente** | Lento | Determinación firme con análisis previo a la acción. |

### Conectores (eje I — Influencia)

| Arquetipo | Motor | Perfil |
|-----------|-------|--------|
| **Conector Vibrante** | Rápido | Energía social inmediata. Contagia entusiasmo al grupo. |
| **Conector Relacional** | Medio | Construye vínculos con timing social. Lee el ambiente. |
| **Conector Reflexivo** | Lento | Conexión profunda y selectiva. Escucha antes de hablar. |

### Sostenes (eje S — Estabilidad)

| Arquetipo | Motor | Perfil |
|-----------|-------|--------|
| **Sostén Ágil** | Rápido | Soporte rápido y proactivo. Primero en ayudar. |
| **Sostén Confiable** | Medio | Consistencia y regularidad. Siempre está cuando se lo necesita. |
| **Sostén Sereno** | Lento | Estabilidad profunda. Ancla emocional del grupo. |

### Estrategas (eje C — Conciencia)

| Arquetipo | Motor | Perfil |
|-----------|-------|--------|
| **Estratega Reactivo** | Rápido | Análisis veloz y ejecución inmediata de lo observado. |
| **Estratega Analítico** | Medio | Balance entre observación y acción. Procesa con método. |
| **Estratega Observador** | Lento | Observación profunda antes de intervenir. Detecta lo que otros no ven. |

---

## 5. El sub-perfil (brújula secundaria)

El eje dominante define el arquetipo principal, pero el **segundo eje más fuerte** matiza el comportamiento. Lo llamamos "brújula secundaria" o "tendencia".

### Las 4 tendencias secundarias

| Eje secundario | Etiqueta | Significado |
|----------------|----------|-------------|
| D | "con chispa de acción" | La conducta dominante se tiñe de iniciativa y resolución |
| I | "con brújula social" | La conducta dominante se tiñe de conexión y empatía grupal |
| S | "con raíz firme" | La conducta dominante se tiñe de estabilidad y cuidado |
| C | "con ojo de detalle" | La conducta dominante se tiñe de análisis y precisión |

### Las 12 combinaciones de tendencia

Cada combinación de eje primario + eje secundario produce un matiz único:

#### Impulsor (D) con tendencia secundaria:

**D con brújula social (D+I):** *"Lidera arrastrando"*
No solo toma la iniciativa, sino que arrastra al grupo con carisma. Motiva con energía contagiosa mientras avanza.
- Palabras clave: Equipo, Contagiar, Juntos
- Evitar: "Hazlo solo", "No hables", "Silencio total"

**D con raíz firme (D+S):** *"Perfil protector"*
Lidera pero no deja a nadie atrás. Empuja al grupo hacia adelante mientras se asegura de que todos estén bien.
- Palabras clave: Proteger, Cuidar, Todos juntos
- Evitar: "Deja al que se atrasa", "No mires atrás", "Cada uno por su cuenta"

**D con ojo de detalle (D+C):** *"Estratega ejecutor"*
Decide rápido pero con datos. Analiza en milisegundos antes de actuar.
- Palabras clave: Precisión, Inteligente, Dato clave
- Evitar: "No pienses tanto", "Da igual cómo", "Rápido y ya"

#### Conector (I) con tendencia secundaria:

**I con chispa de acción (I+D):** *"Conecta liderando"*
Propone actividades, organiza al grupo, mantiene la energía. Lidera desde la conexión.
- Palabras clave: Protagonismo, Tu idea, Liderar
- Evitar: "Quédate al margen", "Solo observa", "Tu opinión no importa"

**I con raíz firme (I+S):** *"Pegamento emocional"*
Nota al compañero excluido, mantiene la cohesión emocional. Es el que hace que todos se sientan parte.
- Palabras clave: Cuidar al otro, Incluir, Bienestar
- Evitar: "No te preocupes por los demás", "Enfócate solo en ti"

**I con ojo de detalle (I+C):** *"Traductor táctico"*
Observa patrones mientras conecta con el equipo. Traduce lo que ve a un lenguaje que el grupo entiende.
- Palabras clave: Observar, Entender, Notar
- Evitar: "No analices", "Deja de mirar", "Eso no importa"

#### Sostén (S) con tendencia secundaria:

**S con chispa de acción (S+D):** *"Reserva de emergencia"*
Calmo y estable normalmente, pero se activa con decisión cuando la situación lo requiere.
- Palabras clave: Momento clave, Reaccionar, Tu fuerza
- Evitar: "Nunca tomes la iniciativa", "Quédate siempre atrás"

**S con brújula social (S+I):** *"Acompañamiento silencioso"*
Presencia reconfortante sin necesidad de palabras. Los compañeros lo buscan instintivamente.
- Palabras clave: Acompañar, Escuchar, Estar presente
- Evitar: "No te metas", "Eso no va contigo", "Aléjate del grupo"

**S con ojo de detalle (S+C):** *"Ancla técnica"*
Consistencia metódica. Ejecuta la rutina sin errores, es el pilar técnico del equipo.
- Palabras clave: Método, Sistema, Paso a paso
- Evitar: "Cambia todo", "Improvisa", "Olvida lo que sabes"

#### Estratega (C) con tendencia secundaria:

**C con chispa de acción (C+D):** *"Estratega ejecutor"*
Analiza y después actúa rápido. Quiere implementar lo que observó.
- Palabras clave: Ejecutar, Decidir, Implementar
- Evitar: "Solo piensa, no hagas", "Espera indefinidamente"

**C con brújula social (C+I):** *"Traductor táctico"*
Observa profundamente y traduce sus hallazgos al lenguaje del equipo. Enseña desde la observación.
- Palabras clave: Compartir, Explicar, Enseñar
- Evitar: "Guárdatelo", "Nadie quiere saber eso", "No expliques"

**C con raíz firme (C+S):** *"Observador paciente"*
Nota detalles que otros no ven porque no tiene apuro por intervenir. Su paciencia es su superpoder analítico.
- Palabras clave: Paciencia, Observar, Tu momento
- Evitar: "Apúrate", "Responde ya", "No pierdas tiempo mirando"

---

## 6. Variantes totales

La combinación de las tres dimensiones produce:

- **4 ejes** × **3 motores** = **12 arquetipos base**
- **12 arquetipos** × **3 tendencias secundarias posibles** = **36 variantes únicas**

Cada variante tiene su propio informe con:
- Descripción del arquetipo
- Descripción del motor
- Párrafo de tendencia secundaria
- Palabras puente (lo que sí decirle)
- Palabras ruido (lo que no decirle)
- Guía de 3 escenarios (sostener conexión, acompañar confianza, facilitar cambios)
- Consejo de reset (qué hacer cuando nada funciona)
- Ecos en el hogar y la escuela
- Checklist pre/durante/post entrenamiento

---

## 7. El informe

El informe combina contenido determinístico (basado en tablas de arquetipos y tendencias) con contenido generado por inteligencia artificial que personaliza secciones específicas usando el nombre del niño, su deporte y su edad.

### Secciones personalizadas por IA:
- **Wow**: Frase de impacto inicial sobre el niño
- **Descripción del motor**: Explicación personalizada del tempo del niño
- **Combustible**: Qué lo motiva en el deporte
- **Escenarios de comunicación**: Estrategias específicas para 3 situaciones

### Secciones determinísticas (sin IA):
- Nombre del arquetipo y descripción base
- Palabras puente y palabras ruido
- Tendencia secundaria (párrafo + etiquetas extra)
- Checklist de entrenamiento
- Ecos en otros contextos

El informe se entrega al adulto por email automáticamente al finalizar la experiencia, y queda disponible en el dashboard del tenant.

---

## 8. Precisión y limitaciones

### Lo que Argo mide:
- Preferencias de comportamiento observable en contexto deportivo
- Tempo de decisión a través de interacción gamificada
- Tendencias de respuesta ante escenarios hipotéticos

### Lo que Argo NO mide:
- Capacidades cognitivas ni inteligencia
- Talento deportivo ni potencial competitivo
- Condiciones psicológicas ni trastornos
- Futuro rendimiento deportivo

### Limitaciones declaradas:
- El perfil refleja un momento en el tiempo. Los niños cambian.
- El contexto de la prueba (quién está presente, estado emocional, cansancio) puede influir en las respuestas.
- El modelo DISC es un marco de referencia, no un diagnóstico clínico.
- Argo no reemplaza al psicólogo deportivo ni al especialista en desarrollo infantil.

### Mecanismos de calidad:
- **Dispersión de perfiles**: El sistema de tiebreaker evita clustering cuando hay empates, favoreciendo distribución natural.
- **Motor multi-vectorial**: 3 juegos independientes reducen el error de medición respecto a una sola fuente.
- **Normalización**: Si un juego falla o no se completa, los pesos se redistribuyen sin invalidar el resultado.
- **Fallback**: Existe un método legacy de cálculo de motor como respaldo.

---

## 9. Glosario

| Término | Definición |
|---------|------------|
| **Eje** | La dimensión conductual dominante del niño (D, I, S o C) |
| **Motor** | El tempo de procesamiento y decisión (Rápido, Medio, Lento) |
| **Arquetipo** | La combinación de eje + motor (12 posibles) |
| **Brújula secundaria** | El segundo eje más fuerte, que matiza el perfil |
| **Tendencia** | El matiz que la brújula secundaria agrega al arquetipo |
| **Variante** | La combinación de arquetipo + brújula secundaria (36 posibles) |
| **Palabras puente** | Términos y frases que conectan con el niño según su perfil |
| **Palabras ruido** | Términos y frases que generan resistencia según su perfil |
| **Vector** | Cada una de las 3 dimensiones medidas para el motor |
| **Impulso** | Vector 1: velocidad de reacción ante estímulo novedoso |
| **Ritmo** | Vector 2: cadencia natural en actividad sostenida |
| **Adaptación** | Vector 3: velocidad de ajuste ante cambio de condiciones |
| **Tiebreaker** | Mecanismo de desempate que favorece diversidad de perfiles |
| **La Odisea** | La experiencia interactiva completa que juega el niño |
| **Tenant** | Usuario pagante (entrenador, club, institución, padre) |

---

*Documento generado para Argo Method v1.7. Actualizado a marzo 2026.*
