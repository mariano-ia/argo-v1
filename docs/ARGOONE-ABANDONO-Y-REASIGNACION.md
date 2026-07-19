# ArgoOne® — Abandono de juego, duplicados y reasignación de link (as-built)

> Estado: **LIVE en prod** (main), 2026-07-19.
> Commits: `0e9bbc5` (cuelgue), `0a18b81` (duplicados + reasignar + recordatorio + guard), `8cfcd70` (fix qa-monitor).
> Disparador: reporte de Federico (socio) probando la odisea — pantalla "Trazando tu rumbo…" colgada + jugadas duplicadas en el panel.

Este documento cubre un mismo hilo: qué pasa cuando un juego de ArgoOne® **se empieza y no se termina**, y cómo evitamos que eso genere duplicados, cuelgues o links inservibles.

---

## 1. El cuelgue "Trazando tu rumbo…" (dead-end en el cierre) — `0e9bbc5`

**Síntoma:** al terminar la odisea, la pantalla de resolución del perfil (`child-result`, fondo `#0b1a2a`, texto "Trazando tu rumbo…") quedaba **girando para siempre**, sin error ni salida.

**Causa raíz:** el loader se ocultaba SOLO cuando `revealReady` pasaba a true, y eso sucede en un único punto del `useEffect` de completado. Si ese effect cortaba temprano (`answers.length < questions.length`, alcanzable por un snapshot de recovery inconsistente) o la resolución lanzaba una excepción, `revealReady` nunca se activaba, `saveError` **solo se renderizaba en el modo demo** (`DemoEndScreen`), y en el flujo pagado no había timeout, ni error, ni reintento. Cuelgue garantizado ante cualquier tropiezo. Confirmado en prod: filas `in_flight` con `question_version` NULL y 0 respuestas (la resolución nunca completó).

**Arreglo (3 capas, en `src/components/onboarding/OnboardingFlowV2.tsx`):**
1. **Red de seguridad en pantalla:** timeout de **20 s** + tarjeta de error con acción inteligente — "Reintentar" (re-corre el completado vía `retryNonce`) si las respuestas están completas, "Continuar" (va a la primera pregunta sin contestar) si faltan. El loader ahora se oculta ante `saveError`/`resolveTimedOut`. La guarda de respuestas incompletas ahora **muestra el error** en vez de hacer `return` en silencio.
2. **Validación al retomar (`handleResume`):** nunca re-ancla a la pantalla de resultado con preguntas sin contestar (el `screenIndex` crudo persistido puede desalinearse si cambió el layout de `SCREENS` en un deploy). Reancla a la siguiente pregunta.
3. **Telemetría:** beacon fire-and-forget a `/api/client-errors` con un `kind` nuevo **`completion_stuck`** (motivos `incomplete_answers` / `resolve_threw` / `resolve_timeout`), deduplicado por motivo. Cae en la misma señal que Vigía ya vigila (`client_errors`).

Verificado end-to-end en prod: el `kind` `completion_stuck` se acepta (204) y persiste; un `kind` desconocido no persiste.

---

## 2. Duplicados: un niño por link de ArgoOne® — `0a18b81` (#1)

**Síntoma:** el mismo "chico" aparecía varias veces en el panel (p. ej. "Fede Prueba 2" arrancado 5 veces en 17 min = 5 niños; "Fútbol Prueba 18.07.26" con 2 informes de resultado distinto).

**Causa raíz:** por diseño (split de identidad 2026-06-29), **cada arranque fresco crea un niño nuevo** (`api/session.ts`, "same name ≠ same child"). No hay deduplicación por nombre — deliberado, porque un coach puede tener dos chicos que se llamen igual. La duplicación aparece al reintentar/recargar el mismo link.

**Arreglo (`api/session.ts`, acción `start`):** un link de ArgoOne® es **1:1 con un chico**. Al arrancar con un `one_link_id`, si el link ya tiene un niño **no completado** (vía `one_links.session_id → perfilamiento.child_id`, o `one_links.child_id`), se **reusa** ese niño en vez de crear uno nuevo:
- Refresca la identidad del niño con el registro más nuevo (colapsa el caso "cargó mal el nombre, reinició").
- Da de baja (soft-delete) los perfilamientos `in_flight` viejos de ese niño (un solo intento activo).
- Re-apunta `one_links.session_id` al intento nuevo (se sacó el `.is('session_id', null)`), para que el `report-recovery-cron` complete el último intento, no el retirado.
- `childWasFreshlyCreated` distingue el rollback: nunca borra un niño reusado ante un fallo.

Solo aplica cuando hay `one_link_id` (ArgoOne). Los juegos de tenant/demo no se tocan. Gate implícito por `ONE_V2_COMPLETE`/`ONE_UNIFIED_SKU` (ambos **on** en prod).

**Qué pasa si el chico nunca vuelve:** el link queda `pending` con **un** niño placeholder (nunca se multiplica), sigue **jugable y reasignable**, no ocupa cupo (ArgoOne no tiene cupo), y se purga solo por retención a los **2 años** (`retention-cron` regla 4). No se auto-borra el niño de un link pago.

---

## 3. Higiene de demos (barrido nocturno) — `0a18b81` (#2)

`api/retention-cron.ts`, regla 6 nueva (corre 03:00 UTC, **solo `is_demo=true`**):
- **Abandonados:** niños demo sin perfilamiento resuelto, con más de **24 h** → soft-delete.
- **Duplicados resueltos:** demos con mismo `(email, nombre)` → conserva el más nuevo, da de baja el resto.
- Soft-delete (reversible); la regla 5 los purga en firme a los **30 días**. Nunca toca datos reales.

Nota: los abandonos **no-demo** de ArgoOne (link pago) NO se barren — el comprador puede retomar.

---

## 4. Recordatorio de link a medias — `0a18b81` (#3)

Migración `supabase/migrations/20260719_one_links_reminder_sent_at.sql`: columna `one_links.reminder_sent_at`.

`api/report-recovery-cron.ts`: a los **3 días** de un juego empezado y no terminado (`one_links.status='pending'`, perfilamiento `in_flight`), se manda **un** mail al comprador (buyer-neutral, "el niño"), deep-link a `/one/panel?token=<access_token>`, con el copy "retomalo o reasignalo". `reminder_sent_at` evita repetir; se resetea al reasignar (un re-abandono vuelve a recordar). Helper `sendAbandonReminderEmail` inlineado (Resend, sin cross-imports).

---

## 5. Reasignar el link (control del comprador) — `0a18b81` (#4)

**Endpoint** (`api/one-panel.ts`, acción `reassign-link`): valida que el comprador sea dueño del link y que no esté `completed` → da de baja el niño abandonado + su `in_flight` (nunca uno con informe resuelto) → resetea `one_links` a `available` (`session_id`/`child_id`/`reminder_sent_at` a NULL). Mismo URL, pizarra limpia.

**Payload del hub:** `play_link` ahora expone `link_id` + `started_at` (created_at del `in_flight` de un link `pending`).

**UI** (`src/pages/OnePanel.tsx`): en un link `pending`, botón **"Reasignar a otro niño"** (self-serve, con modal de confirmación porque descarta el progreso). Si el intento lleva más de **7 días** a medias, aparece un **alert ámbar + tooltip** avisando que puede reasignar. Claves i18n es/en/pt (`reassign*`, `linkPending*`).

**Escalera de tiempos:** 3 días → mail "retomá"; 7 días → alert "reasigná". Ambos son constantes ajustables.

---

## 6. Guard del que vuelve ("link ya utilizado") — `0a18b81`

- **Servidor** (`api/session.ts`, acción `update`): rechaza actualizar un perfilamiento con `deleted_at` seteado → `409 session_superseded`. Un intento retirado (por reasignación) **no puede completarse**.
- **Cliente** (`OnboardingFlowV2.tsx`): al recibir `session_superseded` en el completado, limpia el recovery local y muestra pantalla terminal **"Este link ya fue utilizado"** (sin reintento).
- El caso `completed` clásico ya mostraba "Link ya utilizado" vía `one-start-play` (403). Borde aceptado: si el comprador reasigna y **nadie jugó todavía** (link `available`), un chico que vuelve de cero puede jugar (después de reasignar, el que juega primero es el dueño del link).

---

## 7. Fix del monitor (falso positivo V4) — `8cfcd70`

`api/qa-monitor.ts` CHECK 5 usaba `ai_sections IS NULL` como señal de "no entregado". Los informes **V4 entregan por `report_v4`** y tienen `ai_sections` NULL a propósito, así que cada informe V4 recién entregado (con `email_sent_at` seteado, `report_status` ready/sent) daba **rojo falso**.

Arreglo V4-aware: la señal de entrega es **`email_sent_at`** (se excluyen filas ya emailadas) + un **piso de 15 min** para no paginar un informe en pleno reparto. Verificado: la query vieja contaba 3 (los 3 con mail enviado = entregados), la nueva cuenta 0, y sigue capturando fallas reales (email NULL).

---

## Archivos tocados

| Archivo | Qué |
|---|---|
| `src/components/onboarding/OnboardingFlowV2.tsx` | Red de seguridad + validación de resume + terminal superseded + beacon |
| `api/client-errors.ts` | `kind` `completion_stuck` |
| `api/session.ts` | Reuse de niño por link + guard `session_superseded` |
| `api/retention-cron.ts` | Barrido demo (regla 6) |
| `api/report-recovery-cron.ts` | Recordatorio a 3 días + helper de email |
| `api/one-panel.ts` | Acción `reassign-link` + payload `started_at`/`link_id` |
| `src/pages/OnePanel.tsx` | Botón reasignar + modal + alert/tooltip 7 días |
| `api/qa-monitor.ts` | CHECK 5 V4-aware |
| `supabase/migrations/20260719_one_links_reminder_sent_at.sql` | Columna `reminder_sent_at` |

## Constantes ajustables

| Qué | Valor | Dónde |
|---|---|---|
| Timeout del loader de cierre | 20 s | `OnboardingFlowV2.tsx` (effect de timeout) |
| Recordatorio al comprador | 3 días | `report-recovery-cron.ts` |
| Alert de reasignar en el panel | 7 días | `OnePanel.tsx` (`SEVEN_DAYS_MS`) |
| Barrido demo abandonado | > 24 h | `retention-cron.ts` (`oneDayAgo`) |
| Piso de "settle" del monitor | 15 min | `qa-monitor.ts` (`settleFloor`) |
| Purga de soft-deletes | 30 días / 2 años | `retention-cron.ts` (reglas 5 / 4) |

## Pendientes / futuro (opcional)

- Detección de recovery obsoleto **antes** de reanudar (comparar `recovery.sessionId` vs `one_links.session_id` devuelto por `one-start-play`) para evitar que el chico rejuege un par de preguntas antes de ver "link utilizado". Hoy el guard corta en el completado; alcanza, pero se podría adelantar.
- A/B del timing del recordatorio (3 días) y del alert (7 días).
