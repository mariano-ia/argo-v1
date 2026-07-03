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

## M2 as-built (2026-07-03)

- Tabla `child_memory` (summary por niño+miembro, `events_through` como
  watermark, `user_edited_at`). RLS sin policies (solo service role).
- `api/child-memory-cron.ts` (Vercel cron diario 06:00 UTC en vercel.json):
  agrupa eventos nuevos por (tenant, niño, miembro), consolida con
  Flash-Lite (1 llamada por grupo, cap 60 grupos/run), guardrails inlined
  (palabras prohibidas + frases deterministas) con 1 retry; si el output
  sigue sucio conserva el resumen anterior y avanza el watermark (la memoria
  se atrasa, nunca loopea con input envenenado). Si la IA no responde, NO
  avanza el watermark (reintenta al día siguiente). Un resumen editado por
  el usuario se usa como base, no se reescribe entero. Heartbeat a
  health_checks + costo a ai_events (source 'child-memory-cron').
- Confiabilidad del cron (defensa en profundidad):
  1. Ventana de descubrimiento de 7 días + watermark por grupo: si el cron
     no corre durante días, el siguiente run exitoso recupera todo lo
     pendiente sin duplicar trabajo.
  2. Dead-man's-switch: registrado en `CRON_MAX_STALE_MIN` de qa-monitor
     (corre cada hora); si el heartbeat tiene más de 48 h, pagea a ops por
     Telegram/email como los demás crons.
  3. Degradación elegante: el chat nunca depende del cron; sin resumen, la
     inyección M1 de episodios crudos sigue funcionando (la memoria pierde
     compresión, no continuidad).
  4. Disparo manual: `GET /api/child-memory-cron` con el CRON_SECRET
     re-consolida on demand.
- Privacidad reforzada del cron: los nombres NUNCA viajan a Gemini tampoco en
  la consolidación: antes de la llamada, el niño objetivo se reemplaza por
  "el niño" y cualquier otro niño del tenant por "un compañero" (scrub
  tenant-wide, mismo criterio que el fix C1 del chat); el prompt además
  prohíbe nombres propios, así los resúmenes quedan sin nombres por
  construcción.
- Índice único (tenant, child, member) NULLS NOT DISTINCT en `child_memory`:
  una carrera cron/endpoint no puede duplicar filas.
- `api/child-memory.ts`: GET resumen+episodios / POST update_summary /
  POST delete (borra resumen + episodios del caller). Scope por miembro
  (owner = member_id null); child validado contra el tenant.
- Inyección: el resumen consolidado entra en JUGADOR MENCIONADO (scrubbed),
  antes de los episodios.
- UI: FichaAction "Memoria" en el área de acciones de la ficha → modal con
  resumen editable (Guardar), episodios recientes de solo lectura, "Borrar
  memoria" con confirmación, y la nota de privacidad ("esta memoria es tuya,
  nadie más la lee").

## M3/M4 as-built (2026-07-03)

- **Cierre de loop (M3a)**: regla de Continuidad en MODO CONSULTIVO (es/en/pt,
  vía `coach-prompt-source.ts` + gen): si la memoria muestra una guía previa,
  el asistente la reconoce y pregunta cómo resultó antes de sumar guía nueva.
  La respuesta del entrenador entra al diario como cualquier turno, cerrando
  el ciclo guía → resultado → memoria.
- **merge_children fusiona memorias**: eventos re-apuntados al superviviente
  (descartando duplicados de hilo por el índice único) y resúmenes fusionados
  por miembro con watermark al más viejo (el cron re-consolida la historia
  unida). Auditado en system_activity_log como el resto del merge.
- **M4 poda jerárquica**: tras cada consolidación exitosa, los episodios ya
  reflejados en el resumen (<= watermark) y con más de 90 días se borran; el
  prompt del cron conserva lo viejo útil comprimido como contexto histórico
  ("la temporada pasada..."). El diario queda acotado para siempre.

## Pendiente

- **M3b**: integración de la feature de notas cuando exista (los eventos
  `source='nota'` ya tienen su lugar en el modelo y la UI del modal los
  mostrará sin cambios).
- Decisiones abiertas del owner: memoria compartida por institución (hoy por
  miembro); comportamiento al archivar (propuesta: congelar); confirmación
  del formato visible/editable en M2.

## Costo

Almacenamiento: ~30 KB por niño activo en estado estable (episodios podados +
resumen); irrelevante frente a `chat_messages`/`ai_sections`. Tokens: la
consolidación M2 es una llamada Flash-Lite por niño activo por día; la
inyección agrega ~300-500 tokens de input solo cuando se menciona un niño.
Ambos visibles en `ai_events`.
