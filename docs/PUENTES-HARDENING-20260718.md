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

## Bug del placeholder "NAME" (2026-07-19)
El informe del puente mostraba la palabra literal "NAME" donde iba el nombre del
niño ("Antes de un partido, NAME tiende a..."), y se arrastraba al email.

**Causa raíz:** el nombre real del niño nunca se envía a Gemini; se usa un
placeholder que se rehidrata después. El placeholder era `__NAME__`, que en
Markdown es **negrita**. Gemini lo interpreta como formato, le saca los guiones
bajos y emite `NAME` a secas. La rehidratación hacía un reemplazo EXACTO de
`__NAME__` (split/join), no matcheaba `NAME` desnudo, y el token quedaba en el
`ai_sections` guardado, visible en informe web + email.

**Alcance en prod:** 1 sola sesión de puente (la de prueba del owner), email ya
enviado. El informe del NIÑO (`generate-ai.ts`) tenía 0 leaks en 167 informes
porque su prompt SÍ instruye explícitamente preservar el placeholder, pero
comparte el mismo patrón frágil.

**Fix (doble capa):**
- `generate-puentes.ts`: placeholder cambiado a `[NAME]` (no-Markdown) +
  rehidratación robusta por regex (`NAME_TOKEN_RE`) que captura cualquier forma
  (`NAME`, `[NAME]`, `__NAME__`, `**NAME**`, `{NAME}`, `<NAME>`, `_NAME_`).
  Case-sensitive y con lookarounds `(?<![A-Za-z0-9])`/`(?![A-Za-z0-9])` (en vez
  de `\b`, que trata `_` como word-char y perdía `__NAME__`), así "NAMED",
  "username" y "name" en minúscula nunca matchean. Check determinista reforzado
  para anclar también al token desnudo.
- `generate-ai.ts` (informe del niño): misma red de seguridad de rehidratación,
  sin tocar el placeholder ni la instrucción probada (0 leaks) → cero riesgo de
  calidad en el producto principal.
- Datos: la fila filtrada reparada en prod (nombre real rehidratado); 0
  placeholders NAME en toda la base tras la reparación.
- Verificado: 13/13 casos del regex (captura variantes, respeta palabras
  legítimas), tsc + gates verdes.

**Deuda menor:** `tenant-chat.ts` usa placeholders `{{Pn}}` en otro flujo (chat);
no auditado en esta pasada, pero el LLM podría normalizarlos igual. Revisar.

## Deuda consciente (no bloqueante, decidido 2026-07-18)
- `full_access` se estampa antes de la entrega (idempotencia de webhook); el
  riesgo de crash a mitad quedó mitigado con try/catch por paso, no eliminado.
- El tap tardío con jank extremo (>350ms de retraso de exit animation) puede
  en teoría pisar una respuesta; aceptado.
- `puentes-complete` acepta respuestas duplicadas/extra (sin camino de
  explotación real tras la guardia del front).
