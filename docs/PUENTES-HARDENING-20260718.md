# ArgoPuente® — Hardening del flujo completo (2026-07-18)

## Incidente origen
El cuestionario puente en mobile no se podía terminar. Dos causas independientes,
descubiertas en cadena:

1. **Layout mobile** (commit `9321645`): cada tarjeta de pregunta desbordaba el
   viewport de un teléfono, sin reset de scroll ni indicio de contenido abajo.
   La última pregunta (q15, única con 6 opciones) era la peor. Fix: layout
   compacto mobile, q15 en grilla de 2 columnas (`layout: 'compact'`),
   `min-h-dvh`, reset de scroll por pregunta, guardia anti doble tap (350ms),
   mock DEV `/puentes/demo-cuestionario`.
2. **Sesión faltante** (commit `b4c56fc`): los caminos comp del webhook (unlock
   ArgoOne® y reprofile foto-vigente) creaban `puentes_purchases` sin su
   `puentes_sessions`. `puentes-start` devolvía `children: []` y el submit de la
   pregunta 15 moría en silencio (`!anchorChild`). Se repararon 2 compras
   huérfanas en prod por SQL.

## Auditoría multiagente (95 agentes, panel adversarial 3 votos)
30 hallazgos brutos, 24 confirmados. Los graves: el mismo hueco de sesión en
`one-complete` (combo, caso comprador ≠ adulto del play), en
`report-recovery-cron` y en `session.ts` (grant free de tenant); la rama
ensure-session de `send-email` rota por `.maybeSingle()` multi-fila y por match
case-sensitive de email; fallos de generación de IA invisibles (spinner eterno);
poller del front con snapshot viejo; sin retry al fallar el submit.

## Fixes (commit `2af1dc8`)

### Defensa de fondo
- **`puentes-start` se auto-cura**: compra pagada sin sesión ⇒ materializa la
  sesión al abrir el link. Cualquier hueco pasado o futuro se arregla al primer
  click. Carrera concurrente cubierta por el índice único.
- **Índice único** `puentes_sessions (purchase_id, source_session_id)`
  (migración `20260718_puentes_sessions_unique_pair.sql`, aplicada a prod, con
  dedup de 1 duplicado legacy). Todos los caminos de creación quedan
  idempotentes.

### Caminos de creación (todos crean la sesión inline ahora)
`one-webhook` (handlePuentesPaid + unlock + reprofile), `one-complete` (combo),
`report-recovery-cron` (sweep), `session.ts` (tenant free grant). Los inserts
loguean el error en vez de tragarlo; el fallo es no-fatal gracias al self-heal.

### Red de seguridad reparada
- `send-email` ensure-branch: lookup `ilike` (case-insensitive, escapado) +
  `limit(1)`, prefiere la compra del propio niño y cae a la más nueva. Ya no
  explota con 2+ compras pagadas del mismo adulto.
- `puentes-sync-cron`: recorre TODAS las compras pagadas del adulto para el
  match de re-profile; backstop de emails no enviados con piso fijo
  `UNSENT_FORWARD_FROM = 2026-07-11` (cutover de la fusión) en vez de ventana
  rodante de 48h. Ojo: hay 6 filas legacy de mayo generated+unsent que quedan
  deliberadamente excluidas.

### Front (PuentesFlow / PuentesReport)
- `failed` es terminal para el poller y el informe muestra tarjeta de fallo con
  botón Reintentar (`onRetryChild` → `generate-puentes` → re-poll).
- El poller adopta `children` + `adult_profile` frescos en cada tick.
- Fallo del submit final: conserva las 15 respuestas y ofrece Reintentar.
- Roster vacío bloquea al cargar (no después de la pregunta 15).
- Errores pre-lang en idioma del navegador; solo 404 muestra "enlace inválido".
- Copys nuevos en `puentesTranslations.errors`: `retry`, `failedBridge` (es/en/pt).

## Verificación
- tsc + check:api-imports + tests resolver (6/6) verdes.
- E2E táctil (Playwright WebKit iPhone SE): 15 preguntas → informe.
- Workflow adversarial de revisión del diff (4 lentes + 2 escépticos por
  hallazgo) antes del push.
- Post-deploy: prueba viva del self-heal con compra sintética en prod
  (creada y borrada en el momento).

## Segunda pasada: revisión adversarial del propio fix
Un workflow de review (4 lentes + 2 escépticos por hallazgo) auditó el batch
antes del push y encontró 5 problemas reales, 2 introducidos por los fixes de
arriba. Corregidos (commit siguiente):

- **send-email fan-out (HIGH, regresión mía):** el fallback a "la compra más
  nueva de cualquier niño" adjuntaba el puente de un niño a la compra de otro
  (leak de entitlement + upsell suprimido). Ahora el fallback se restringe a
  `source = 'tenant'` (único caso donde el fan-out multi-niño es el diseño).
  Para argo_one solo la compra propia del niño (que siempre existe con el
  self-heal + inserts inline).
- **cron re-profile vs índice único (HIGH, regresión mía):** el UPDATE de
  `source_session_id` chocaba con el índice único (23505) y mandaba un email
  falso de "puentes actualizados". Ahora captura el error (23505 = la sesión
  fresca ya existe vía send-email, se saltea sin email) y solo repunta el
  bridge HACIA ADELANTE en el tiempo (fecha del perfilamiento), lo que también
  arregla el ping-pong con dos plays del mismo niño en la ventana.
- **switcher esconde el puente failed (MEDIUM):** el chip de un niño `failed`
  quedaba deshabilitado, así que la tarjeta de reintento era inalcanzable en
  multi-niño. Ahora el chip failed es seleccionable, con punto rojo + ícono de
  error, y lleva a la tarjeta de reintento.
- **clipboard sin catch (LOW):** el botón Compartir moría con rejection no
  manejada si el navegador negaba el clipboard. Ahora cae a un textarea +
  execCommand y siempre da feedback.
- **created_at floor (HIGH, ya estaba resuelto):** el panel revisó el commit
  pre-amend; HEAD ya tenía `UNSENT_FORWARD_FROM = 2026-07-11`. Verificado
  contra prod: excluye las 6 filas legacy, 0 filas espurias después del floor.

## Deuda consciente (no bloqueante, decidido 2026-07-18)
- `full_access` se estampa antes de la entrega (idempotencia de webhook); el
  riesgo de crash a mitad quedó mitigado con try/catch por paso, no eliminado.
- El tap tardío con jank extremo (>350ms de retraso de exit animation) puede
  en teoría pisar una respuesta; aceptado.
- `puentes-complete` acepta respuestas duplicadas/extra (sin camino de
  explotación real tras la guardia del front).
