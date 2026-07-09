# ArgoOne — Fase C: Flujos

> Fase C del roadmap (`ARGOONE-MODELO-NUEVO.md` §9). Diseña los 8 flujos objetivo del ArgoOne
> fusionado, anclados al código real, con un crítico adversarial de completitud encima. Aún NO
> tocado en código. Sale de un workflow (8 diseñadores + 1 crítico, 808k tokens, 2026-07-09).
> Complementa `ARGOONE-MODELO-DATOS.md` (Fase B). Lo que sigue está listo para revisar con el owner;
> **NO para construir** hasta cerrar las decisiones abiertas de §D y las 3 reglas de plata.

## A. Los 8 flujos (resumen + estados clave)

### F1 — Padre compra ArgoOne $12.99 (comprador = autorizador, caso típico)
Un solo producto $12.99 (muere el selector One/One+); el puente va siempre incluido. El pago habilita
en paralelo (orden libre): que el niño juegue (informe individual) y que el adulto haga su cuestionario
genérico (adult_profiles reusable). El puente se genera recién cuando existen las dos mitades. El hub
passwordless muestra los dos informes.
Estados: compra pending→paid→refunded; slot available→sent→completed; adult_profile none→listo→vencido;
perfilamiento in_flight→resolved→report_status(pending/held/ready/sent)→vencido; bridge no-listo→
generando→listo→enviado→vencido; hub one-and-done vs familia.

### F2 — Entrenador compra $12.99, la familia autoriza (comprador ≠ autorizador)
El coach paga, hace su cuestionario, manda el link. La familia autoriza (responsible_adult_email) y el
niño juega. El informe **individual** va a la familia; el **puente** (DISC del coach × ese niño) va al
coach, recién cuando el niño jugó. Es el flujo que expone las 3 contradicciones estructurales (ver §B).
Estados extra: bridge awaiting_child / awaiting_adult_questionnaire; consent pending→confirmed→expired;
panel del coach vs panel de la familia (dos state-machines distintas).

### F3 — Sumar ArgoPuente® $4.99 a un niño ya jugado, vía invitación (abuela/tía)
Desde su panel, el responsable invita por email a otro adulto. La invitación ES la autorización (el niño
no re-juega). El invitado paga $4.99, hace su cuestionario (o reusa su perfil DISC si está fresco), obtiene
su puente hacia el niño y, por el entitlement de ese bridge, acceso al informe individual.
Estados: bridge_invite pending/accepted/completed/expired/revoked; adult_profile ausente/fresco/vencido;
niño vigente / borrado (deletion_id cascade → invite y bridge fallan cerrado).

### F4 — Upsell $4.99 al autorizador que recibió el individual gratis
El adulto que autorizó y recibió el informe individual gratis (porque pagó otro, p.ej. el coach) recibe un
impulso de bajo roce para crear SU puente hacia ese niño por $4.99. Vive inline en el email del informe y
en el hub. Si su adult_profile está fresco, el $4.99 salta el cuestionario y solo genera el bridge.
Estados: individual_ready→upsell_offered; report_not_ready→NO ofrecer; already_has_bridge→ir al puente;
profile_fresh_fastpath vs profile_missing/expired; child_revoked→bloquear/refund.

### F5 — Re-perfilado a los 6 meses ($12.99) + rama $4.99 de solo-refrescar-puente
El vencimiento es DERIVADO (now ≥ expires_at), nunca un cron que mute. El informe viejo se sigue viendo,
marcado "retrasado", con CTA de refresco pago. Dos relojes independientes (perfilamiento del niño y bridge
del adulto) deciden si el refresco es el ciclo completo $12.99 (niño re-juega, dos informes frescos) o el
add-on $4.99 (solo el puente contra un informe de niño aún vigente).
Estados: ficha vigente | retrasado_informe | retrasado_puente | retrasado_ambos | en_juego | preparando.

### F6 — Panel magic-link universal ("entrá con tu email")
La identidad se muda del token por-compra (`one_purchases.access_token`) al EMAIL del adulto
(`adult_profiles` como ancla passwordless). El panel deja de ser "pack de N informes" y pasa a ser un hub
que agrega compras + perfil de adulto + niños (por responsible_adult_email) + bridges, y se adapta al
estado de cada pieza. Cada email de producto abre la misma pantalla. Es el flujo transversal: su lista de
estados es la unión de todas las máquinas (acceso, perfil A0-A2, niño C0-C4, puente B0-B5, roles).
Roles: one_and_done / family / invited_adult (read-only del niño, no puede re-perfilar ni invitar) /
buyer_no_child_yet / empty.

### F7 — Cuestionario genérico del adulto (reescritura + reuso)
El cuestionario deja de anclarse a un niño puntual ({nombre}) y mide el DISC/motor/presión del PROPIO
adulto, genérico y reusable, guardado una vez por email (se pisa, vence a 6m). Si ya hay perfil vigente,
NO se re-responde: se reusa el snapshot para el nuevo bridge. Los ids de opción y sus tags axis/motor/
pressure quedan intactos (no se toca el resolver).

### F8 — Borrado / revocación por el responsable (deletion_id + cascade)
Cada niño lleva un `deletion_id` de alta entropía en el pie de todo email a su responsable, y alcanzable
desde el panel. Borrar el registro ejecuta un cascade idempotente (perfilamientos del niño + bridges de
TODOS los adultos hacia ese niño, incluidos satélite), preservando `adult_profiles` (son del email, no
del niño) y el registro financiero de `one_purchases` (scrub de PII, no delete). Revocar = borrar.

## B. Reglas canónicas (resuelven las 3 contradicciones estructurales)

El crítico encontró tres contradicciones que hay que cerrar ANTES de construir. Estas 7 reglas las resuelven:

- **R1 — `responsible_adult_email` tiene una sola fuente de verdad: el AUTORIZADOR** (quien acepta el
  consentimiento en el registro del niño), nunca el comprador ni el "recipient" que tipeó el coach. En F1
  coinciden (comprador = autorizador). En F2, es la familia. De este campo cuelgan: a quién va el informe
  individual, quién puede borrar (deletion_id) y quién puede invitar.
- **R2 — Entitlement = un bridge en estado PAGADO hacia ESE perfilamiento.** Ningún placeholder PENDING/
  pre-pago otorga acceso jamás. Cierra la fuga de "bridge PENDING = informe gratis".
- **R3 — El comprador SIEMPRE ve el informe individual del niño que pagó, desacoplado del bridge.** El
  puente es el extra que requiere su cuestionario. Resuelve el gap "coach paga $12.99 y no recibe nada si
  nunca hace su cuestionario": el individual es del que pagó; el puente es el opcional.
- **R4 — El puente incluido en $12.99 es del COMPRADOR**, no de quien juega (fix del bug vivo LEAK #3 en
  `one-complete.ts`). En F1 son la misma persona; en F2, es el coach.
- **R5 — Supresión del upsell $4.99 = "este email YA tiene un bridge pagado hacia ESTE perfilamiento".**
  Es el único discriminador que funciona en los dos casos (el coach dueño queda suprimido, la familia
  autorizadora sí ve el upsell). No usar "es responsable" ni "recibió el individual".
- **R6 — Frontera de plata: un perfil de adulto fresco salta el CUESTIONARIO, nunca el PAGO.** La creación
  del bridge se gatea por compra pagada, no por existencia de perfil. "Actualizar mi perfil" (gratis, dato)
  está separado de "generar/refrescar un puente" (pago).
- **R7 — Vencimiento derivado, nunca un cron que mute.** El informe vencido sigue legible con banner
  "retrasado" (soft-nudge, no hard-gate): nunca se le quita a quien pagó algo ya entregado.

## C. Fugas de plata vivas en el código de hoy (verificadas leyendo el código)

Independientes del rediseño. No hay compradores reales, así que la exposición financiera es ~cero, pero
LEAK #1 es broken-access-control de PII de menores. Recomiendo patchearlas (ya sea ahora o como parte del rework).

- **LEAK #1** — `puentes-checkout.ts:196-214`: toma `source_session_id` libre del body, solo exige
  `consent_given=true` (un checkbox del cliente). Cualquiera con un `perfilamiento_id` compra el puente
  $4.99 → magic link → lee el informe individual de ese niño. Limitado por UUID no-enumerable, pero sin
  verificación de relación/consentimiento real. **Fix (R2/R1):** gatear el $4.99 detrás de invitación
  firmada o del email del responsable; nunca `source_session_id` abierto.
- **LEAK #2** — `puentes-checkout.ts:219-234`: bloquea doble compra por `recipient_email` con "One purchase
  covers all their children" → en el modelo por-niño, un $4.99 cubre a varios niños. **Fix:** bloquear solo
  si ya existe bridge activo a ESE niño; matar el fan-out.
- **LEAK #3** — `one-complete.ts:142-167`: el puente comp incluido se adjudica a `session_data.adult_email`
  (quien jugó), no al comprador. En F2 el coach paga y la familia recibe el puente. Hoy no pierde plata
  porque comprador=jugador en el self-serve, pero el modelo nuevo lo expone. **Fix (R4):** el bridge comp
  va al `one_purchases.email` (comprador).
- **Residuo MercadoPago/ARS** — `puentes-checkout.ts` conserva todo el path MP (`createMpCheckout`,
  `getArsRate`) gateado solo por `STRIPE_ONLY!=='false'`. Un flip de env deja cobrar en ARS. **Fix:** el
  peso es SOLO display (dólar BNA); remover el path MP, no dejarlo latente.

## D. Decisiones del owner (resueltas 2026-07-09, salvo D23)

- **D19 — Coach que nunca hace su cuestionario → CERRADO.** Se confirma R3, con matiz: mientras el
  comprador no haya completado SU cuestionario de adulto, solo ve el informe INDIVIDUAL del niño (no su
  puente). El individual es del que pagó; el puente es el extra que se destraba al hacer su parte.
- **D20 — Coach con N niños (escala) → CERRADO.** ArgoOne acumula tantos niños como el usuario quiera
  comprar (cada $12.99 = una jugada), con UN adult_profile reusado y el panel acumulando. Sin tope. El
  upgrade a ArgoAcademy es SOLO si el usuario lo solicita; a futuro, una rutina opcional de conversión
  (diferido, no se diseña ahora).
- **D21 — Refund / chargeback → CERRADO: SIN reembolsos.** "Si compraste, compraste." No se construye
  flujo de refund ni revocación-por-reembolso; el entitlement es permanente (sujeto al vencimiento 6m →
  retrasado, que es refresco, no revocación). Los chargebacks forzados por la tarjeta escapan a nuestra
  política; no revocamos proactivamente.
- **D22 — Re-consentimiento al re-jugar a los 6m → CERRADO: sí.** El re-juego re-pide el consentimiento
  parental en el re-registro (reabre datos de un menor).
- **D23 — Entrega del informe al email correcto → CERRADO.** El planteo original ("verificar el email") no
  calza: el link de juego se comparte por WhatsApp, NO está atado a un email. El email real entra en el
  REGISTRO/consentimiento (cuando el niño va a jugar, el adulto responsable tipea su email = a dónde va el
  informe individual). Ahí está el riesgo de typo→extraño. Solución aprobada (baja fricción, sin round-trip):
  (a) campo email-confirmación (tipear dos veces) en el paso de consentimiento (`one-start-play`/consent);
  (b) el email lleva un magic-link al hub, nunca el informe en crudo (la PII está detrás del link, no en el
  cuerpo del mail).
- **D24 — Borrado del propio perfil de adulto → CERRADO: sí.** Se agrega al hub una ruta para que el adulto
  borre SU perfil DISC (`adult_profiles`), aparte del deletion_id que borra al niño.

## E. Mapa de cambios de código consolidado (deduplicado de los 8 flujos) — base para Fase E

**Migraciones (nuevas):**
- `adult_profiles` (email único normalizado, `access_token`, DISC/motor/pressure/history/dominant_emotion,
  `axis_counts` jsonb, `adult_answers` jsonb, lang, `computed_at`, `expires_at` +6m; UPSERT por email).
- `children` ADD `responsible_adult_email` (backfill desde `adult_email`) + `deletion_id` (hex único,
  indexado) + `expires_at`.
- `bridges` (rediseño de `puentes_sessions`): `adult_profile_id`, `perfilamiento_id` (FK ON DELETE CASCADE),
  `disc_snapshot`, `adult_profile_computed_at`, `expires_at` +6m, `status`, `adult_email`,
  UNIQUE(adult_email, perfilamiento_id).
- `bridge_invites` (invitación adulto-a-adulto: token, perfilamiento_id, invited_email, estado).
- `perfilamientos` ADD `expires_at` + `renewal_reminder_sent_at`; `one_links` ADD `child_id` (replay);
  extender la vista `current_perfilamiento` para exponer `expires_at`. NOTIFY pgrst tras crear objetos.

**API:**
- `one-checkout.ts`: un SKU ArgoOne $12.99 (puente siempre incluido) + add-on $4.99; matar kind/includes_puente
  como diferenciador y el $9.99; STRIPE_ONLY.
- `one-webhook.ts`: email de confirmación = HUB de dos pistas; rutear SKUs nuevas (replay $12.99, addon $4.99);
  matar el fan-out multi-child en `handlePuentesPaid`.
- `one-complete.ts`: cerrar G2 (una sola fila; append al child existente en replay vía `child_id`); setear
  `responsible_adult_email` + `deletion_id` + `expires_at`; reemplazar el comp `puentes_purchases` por el
  trigger de bridge desde `adult_profiles`; **fix LEAK #3** (comp al comprador).
- `one-start-play.ts`: replay atado a child; capturar el email de la familia como responsable; firmar `child_id`.
- `one-panel.ts` + `OnePanel.tsx`: hub state-adaptive, resuelto por EMAIL (`adult_profiles.access_token`) sin
  exigir compra pagada; secciones perfil/niños/puentes/compartidos; acciones invite-adult, start-adult-profile,
  resend-play-link, start-replay $12.99, refresh-bridge $4.99, delete-child; backward-compat de tokens viejos.
- `puentes-checkout.ts`: repurpose a add-on $4.99 por (invited_email × perfilamiento); **fix LEAK #1**
  (gate por invitación/responsable) + **LEAK #2** (matar fan-out); cycle-aware; remover path MP.
- `puentes-start/complete/generate-puentes/send-puentes-email`: `puentes_sessions`→`bridges`; extraer
  `adult_profile` a `adult_profiles` (reusable); gate por entitlement pagado; fast-path de reuso; leer el
  perfil del snapshot del bridge.
- `puentes-reminder-cron.ts` → renewal-reminder-cron: vencimiento-based (no "3 días post-completion"); precio
  correcto $12.99/$4.99 (matar el stale "USD 9.99"); agrupar por `responsible_adult_email`; skip per-bridge;
  **incluir satélites** (hoy la abuela nunca recibe el nudge).
- `start-reprofile.ts`: mantener el rechazo del reprofile gratis para ArgoOne (el re-juego DEBE pasar por
  checkout $12.99).
- Borrado: nuevo `child-delete.ts` (determinístico por `deletion_id`, cascade a bridges + scrub de one_links +
  delete de child_memory); `request-child-delete.ts` (magic-link de auth al responsable, anti-enumeración);
  inyectar footer `/eliminar/:deletion_id` en todos los emisores de email al responsable.
- Nuevos: `bridge-invite-accept.ts`; `admin-grant-puentes-free.ts` re-scoping a per-niño;
  `admin-send-puentes-invite.ts` alinear al modelo por-niño.

**Front:**
- `ArgoOneLanding.tsx`: un solo producto $12.99 (matar tier ArgoOne+); botón "entrá con tu email"; display
  peso BNA + disclaimer "convertibles al valor del día de la compra".
- `puentesQuestions.ts` + `PuentesQuestion.tsx` + `PuentesIntro.tsx` + `puentesTranslations.ts` +
  `PuentesFlow.tsx`: cuestionario genérico (quitar {nombre} de q1/q2/q6/q11/q12/q13/q15 es/en/pt; quitar la
  prop childName y el selector de niño-ancla); rama fast-path (saltar cuestionario si perfil fresco); estado
  saved-no-child (orden libre); copy buyer-neutral ("los niños que acompañas", no "tus hijos").
- Nueva página `/puente/invite/:invite_token`; nueva `/eliminar/:deletion_id` (`DeleteMyData.tsx`).
- `report` + vistas puentes: banner "retrasado" cuando `expires_at ≤ now`.
- Legal (`PrivacyPage.tsx` + ToS): mecanismo deletion_id, fin de acceso de adultos adicionales al borrar,
  cláusula no-reembolso, retención del registro financiero, self-attestation COPPA.

**Copy a autorear bien (heredado, el crítico marcó violaciones en el diseño de los emails):** tuteo (no
voseo: "empieza/genera/comparte/recuerda/puedes"), marca ® (los emails de puente llevan ArgoPuente®, no
ArgoOne®; el wordmark siempre con ®), buyer-neutral (auditar PuentesIntro/translations por "hijo/padre/madre"
fuera del texto legal), sin guiones em/en.
