# Memoria de largo plazo por niño ("ficha viva")

> Diseño aprobado en conversación 2026-07-03. M1 construido (local, pendiente
> de push por instrucción del owner). M2-M4 pendientes.

## Concepto

Cada niño tiene una memoria de dos capas, como la memoria humana:

1. **Diario de episodios** (`child_memory_events`, append-only): eventos
   crudos y baratos (sin IA). Hoy: cada consulta del chat sobre un niño
   registra qué contó el entrenador y qué guía se le dio (un evento por
   conversación y niño, actualizado al último turno). Mañana: las notas del
   entrenador (`source='nota'`) y hitos de perfilamiento entran al mismo log.
2. **Resumen consolidado** (`child_memory.summary`, M2): un cron nocturno
   destila los eventos nuevos en un resumen de ~300-500 tokens por niño, con
   los mismos guardrails de lenguaje del producto (probabilístico, desde la
   fortaleza, sin etiquetas). Consolidación jerárquica en M4: episodios de
   más de ~3 meses se comprimen en la sección "historia" del resumen y se
   podan del diario, acotando el almacenamiento para siempre.

Al mencionar al niño en el chat se inyecta la memoria (hoy: últimos 3
episodios con consulta + guía; M2: también el resumen), con instrucción de
dar continuidad y abrir preguntando cómo resultó la última guía (semilla de
M3, cierre de loop).

## Privacidad (límites acordados)

- **Distinto del punto 14 rechazado**: esto es una herramienta DEL entrenador,
  no un detector nuestro. Nadie de Argo la lee; no genera flags ni auditorías.
- En M2 la memoria será **visible y editable** en la ficha del jugador
  (sección "Memoria del asistente", entra como `FichaAction` en el área de
  acciones nueva).
- Los nombres reales nunca viajan a Gemini: la inyección pasa por el pipeline
  `{{Pn}}` + el scrub tenant-wide de nombres fuera de scope (fix C1).
- Scope **por miembro** (default M1, igual que el chat): un coach no ve la
  memoria construida por otro. Compartirla a nivel institución es decisión
  futura del owner; el modelo de datos ya lo soporta (`member_id` nullable).
- Ciclo de vida: niño archivado no se menciona → memoria inactiva de facto;
  `merge_children` debe fusionar memorias (agregar al RPC cuando se toque);
  borrado del niño debe borrar memoria (hard delete futuro).

## M1 as-built (2026-07-03)

- Tabla `child_memory_events` (id, tenant_id, member_id, child_id, source,
  content, advice, situation_id, thread_id, created_at, updated_at). RLS
  habilitado sin policies (solo service role). Índice único (thread_id,
  child_id) NO parcial (requisito de upsert vía PostgREST; los NULL no
  colisionan, así las notas sin thread insertan libres).
- Escritura: best-effort en el batch post-respuesta de `api/tenant-chat.ts`
  cuando hay jugador mencionado (content = consulta 240c, advice = guía 240c,
  situation_id del matcher). Reglas endurecidas por revisión adversarial:
  (a) NO se escribe si se sirvió el fallback seguro ni si la respuesta es
  demasiado corta (una disculpa o un "ok" nunca pisa una guía guardada);
  (b) solo el autor original del evento lo actualiza (el owner continuando el
  hilo de un coach no le roba el scope al evento); (c) errores de PostgREST
  se loguean (no se tragan); (d) al borrar una conversación se borran sus
  eventos de memoria (la intención de borrado cubre los datos derivados);
  (e) `thread_id` del cliente se valida como UUID antes de usarse en filtros.
- Lectura: la inyección JUGADOR MENCIONADO reemplazó el recap crudo de
  `chat_messages` por los últimos 3 episodios (excluye el thread actual,
  incluye eventos sin thread para las notas futuras).
- `chat_messages.matched_child_id` sigue poblándose (títulos + analítica),
  ya no alimenta el recap.

## Pendiente

- **M2**: tabla `child_memory` + cron nocturno de consolidación (inlined,
  patrón cron+guardrails) + UI "Memoria del asistente" en la ficha.
- **M3**: cierre de loop explícito + integración de la feature de notas.
- **M4**: consolidación jerárquica + poda (>3 meses).
- Decisiones abiertas del owner: memoria compartida por institución (hoy por
  miembro); comportamiento al archivar (propuesta: congelar); confirmación
  del formato visible/editable en M2.

## Costo

Almacenamiento: ~30 KB por niño activo en estado estable (episodios podados +
resumen); irrelevante frente a `chat_messages`/`ai_sections`. Tokens: la
consolidación M2 es una llamada Flash-Lite por niño activo por día; la
inyección agrega ~300-500 tokens de input solo cuando se menciona un niño.
Ambos visibles en `ai_events`.
