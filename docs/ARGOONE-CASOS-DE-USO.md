# ArgoOne — Fase A: Casos de uso

> Fase A del roadmap de `docs/ARGOONE-MODELO-NUEVO.md`. Enumera todos los escenarios con
> **quién paga, cuánto, quién autoriza, qué se genera y quién recibe qué**, más edge cases.
> Draft para validar con el owner. Todavía NO tocado en código.

## Actores

- **Comprador** — paga. Recibe SU informe puente (tiene que completar el cuestionario del adulto).
  Identidad = su email.
- **Adulto responsable / autorizador** — recibe el link, autoriza, y recibe el **informe individual**
  del niño. Es el dueño del consentimiento de ese registro de niño. Identidad = su email.
- **Niño** — juega, genera el informe individual. Sin identidad global (vive en el scope del
  adulto responsable).

Nota: comprador y autorizador **pueden ser la misma persona o distintas**. Cada adulto (por email)
tiene su propio perfil DISC reutilizable y su propio hub.

---

## Grupo 1 — Primera compra ($12.99)

### UC1 · Padre self-serve (comprador = autorizador) — el ~80%
- **Disparador:** un padre compra ArgoOne para su propio hijo.
- **Paga:** el padre. **$12.99.**
- **Secuencia:** el padre completa el cuestionario del adulto (→ su perfil DISC) y recibe un link.
  Autoriza (a sí mismo) → el niño juega → se genera el informe individual. Con los dos perfiles
  listos → se genera el informe puente (padre × niño).
- **Recibe:** el padre recibe **los dos**: informe individual del niño + su informe puente.
- **Edge:** orden libre (puede hacer su cuestionario antes o después de que el niño juegue).

### UC2 · Entrenador compra y manda link a un padre (comprador ≠ autorizador)
- **Disparador:** un entrenador compra ArgoOne para perfilar a un jugador.
- **Paga:** el entrenador. **$12.99.**
- **Secuencia:** el entrenador completa su cuestionario (→ su perfil) y recibe un link. Se lo manda
  al padre del niño. El padre autoriza → el niño juega → informe individual. Con los dos → informe
  puente (entrenador × niño).
- **Recibe:**
  - **Entrenador (comprador):** su informe puente (entrenador × niño) **+ el informe individual del
    niño** (lo pagó y lo necesita para sus puentes).
  - **Padre (autorizador/responsable):** el informe individual del niño. **Sin puente** → recibe el
    email de upsell de $4.99 (ver UC6).
- **Edge/decisión:** el **adulto responsable** del registro del niño = el padre (autorizador),
  aunque haya comprado el entrenador. El consentimiento del padre debe cubrir explícitamente que
  el entrenador recibe el perfil del niño (copy de autorización). → **Decisión D2.**

---

## Grupo 2 — Sumar más

### UC3 · El mismo adulto suma OTRO niño distinto (María además de Juancito) — $12.99
- **Disparador:** el padre ya tiene a Juancito, quiere testear a María (otro niño).
- **Paga:** **$12.99** (es un test real nuevo).
- **Secuencia:** el perfil del adulto se **REUSA** (no re-hace el cuestionario). Recibe un link
  nuevo para María → María juega → informe individual → informe puente (padre × María) usando el
  perfil reusado.
- **Recibe:** informe individual de María + puente del padre hacia María.

### UC4 · Sumar otro adulto a un niño ya jugado (la abuela/tía) — $4.99
- **Disparador:** desde el panel, el responsable invita a otro adulto; o la abuela llega y quiere
  su puente con un niño ya testeado.
- **Paga:** **$4.99** (quién paga → **Decisión D3**: el responsable comprando para ella, o la abuela
  self-serve).
- **Secuencia:** la abuela completa su cuestionario (→ su perfil). El responsable **autoriza el uso
  del perfil del niño** (la invitación ES la autorización; o pedido de autorización si la abuela
  inicia). Se genera el informe puente (abuela × niño). **El niño NO re-juega.**
- **Recibe:** la abuela recibe su informe puente (+ ve el informe individual del niño, con la
  autorización del responsable).

### UC5 · Upsell al adulto responsable que recibió el informe gratis — $4.99
- **Disparador:** en UC2, el padre recibió el informe individual gratis, sin puente. Le llega un
  email ofreciendo su puente por $4.99. (El embudo de impulso.)
- **Paga:** el padre. **$4.99.**
- **Secuencia:** el padre completa su cuestionario (→ su perfil) → informe puente (padre × niño).
  El niño NO re-juega (ya jugó vía la compra del entrenador).
- **Recibe:** su informe puente.

---

## Grupo 3 — Re-perfilado (6 meses)

### UC6 · Re-perfilado del ciclo completo — $12.99
- **Disparador:** 6 meses después, invitación de re-perfilar.
- **Paga:** **$12.99.**
- **Secuencia:** el niño **re-juega** (informe individual fresco) **y** el adulto re-hace su puente
  (perfil refrescado) → informe puente fresco. Reinicia el ciclo completo.
- **Recibe:** los dos informes frescos.
- **Edge/decisión:** ¿el adulto re-hace el cuestionario o se reusa su perfil (estable) y solo se
  recalculan los puentes contra el informe fresco del niño? → **Decisión D4.**

### UC7 · Refrescar solo el puente de un adulto (sin re-juego del niño) — $4.99
- **Disparador:** un adulto quiere refrescar su puente contra un informe de niño existente, sin que
  el niño re-juegue.
- **Paga:** **$4.99.**
- **Recibe:** informe puente refrescado (adulto × informe de niño existente).

---

## Grupo 4 — Identidad y consentimiento

### UC8 · El mismo Juancito jugado por dos adultos no conectados
- La madre juega a Juancito (su scope); el padre, independiente, compra y juega a Juancito (su
  scope). **Dos registros, dos informes individuales**, cada uno con su consentimiento válido. Sin
  dedup. Cada adulto es el responsable de su registro. Duplicación aceptada.

### UC9 · Adulto nuevo quiere puente con un Juancito que ya está en el panel de otro
- **Si están conectados** (invitado por el responsable) → UC4 ($4.99, autorización vía invitación).
- **Si NO están conectados** (sin invitación) → no puede referenciar ese Juancito (no hay directorio
  ni ID) → juega un Juancito nuevo (como UC3, $12.99, registro nuevo). Sin cross-linking.

### UC10 · Autorización cuando el niño ya jugó (mismo scope)
- Si el disparo cae sobre el mismo adulto que ya autorizó y sabemos que Juancito ya jugó, le pedimos
  solo **autorización de uso del perfil** (no re-juega). Es el flujo de "sumar adulto" dentro del scope.

---

## Grupo 5 — Estados incompletos / pagos

### UC11 · El comprador nunca completa su cuestionario del adulto
- Pagó $12.99, el niño jugó (informe individual entregado), pero el comprador no completó su
  cuestionario → el informe puente queda **pendiente**. Recordatorio por email para que lo ejecute.

### UC12 · El niño nunca juega
- Pagó $12.99, tiene el link, pero el niño no juega. Sin informe individual, sin puente. El perfil
  del adulto puede existir (si hizo el cuestionario), pero sin niño no hay puente. Recordatorio.
  Política de reembolso → fuera de scope, notar.

### UC13 · ¿Un link = un niño? (roster/entrenador con varios chicos)
- El modelo es **un niño por $12.99** ("un link para el niño que quiera testear"). Un entrenador que
  quiere testear a todo un plantel = $12.99 × N, o es territorio de **ArgoAcademy** (el consultivo).
  → **Decisión D6:** confirmar un-link-un-niño y que el bulk es Academy.

---

## Decisiones a validar (owner)

- **D1** — UC2: ¿el comprador (entrenador) recibe el informe individual del niño? (Propongo **sí**:
  lo pagó y lo necesita para sus puentes.)
- **D2** — UC2: copy/mecánica de consentimiento cuando el comprador ≠ el responsable (el padre
  autoriza sabiendo que el entrenador recibe el perfil).
- **D3** — UC4: ¿quién paga el puente de la abuela: el responsable comprándolo para ella, o la
  abuela self-serve? (¿O las dos puertas?)
- **D4** — UC6: en el re-perfilado a 6 meses, ¿el adulto re-hace el cuestionario o se reusa su perfil
  y solo se recalculan los puentes?
- **D5** — UC11/UC12: estados "pendiente" (comprador no completó el puente / niño no jugó):
  recordatorios + política de reembolso.
- **D6** — UC13: confirmar un-link-un-niño; el bulk (entrenador con plantel) va a ArgoAcademy.
- **D7** — Dos emails de adulto en juego (comprador + autorizador) cuando son distintos: cada uno con
  su perfil y su hub. El registro del niño lo "posee" el responsable, pero el comprador tiene su
  vista (su puente + el informe individual que pagó). Implicación para el modelo de datos (Fase B).

---

# Addendum (crítico de completitud, cruzado contra el código vivo)

## Realidad del código: el checkout actual fue hecho para OTRO modelo

Tres choques concretos que hay que resolver (no sorpresa, es parte de la fusión, pero es concreto):

- **`puentes-checkout.ts:216-234` bloquea la 2ª compra del mismo email** ("una compra cubre a todos
  sus niños") **y exige un `source_session_id` de un niño que YA jugó** (:181/:196-214). Bajo ese
  código, **UC3/UC4/UC5/UC7 no se pueden construir**, y "orden libre" (comprar antes de que el niño
  juegue) tampoco.
- **`one-checkout.ts:17-20` todavía vende 2 SKUs:** `one` $9.99 (sin puente) y `one_puente` $12.99
  (ArgoOne+®). El $9.99-sin-puente debe morir como **producto** (pero "individual sin puente" sigue
  como **estado**, ver UC2/UC5).
- **Hay un camino MercadoPago/ARS completo** (`puentes-checkout.ts:15-24`, `PRICE_ARS=6999` TODO;
  `types/puentes.ts`: `currency: USD|ARS`, `provider: stripe|mercadopago`). La matriz es USD-only.

## Casos de uso que faltaban

### Grupo 6 — Baja, borrado, revocación (LEGAL, bloquea launch)
- **UC14 · Borrar mis datos.** El adulto borra su perfil DISC (que alimentó puentes en varios
  niños/otros adultos): ¿qué cascada? El responsable borra un registro de niño que la abuela/
  entrenador tenían invitado: ¿qué pasa con sus puentes ya entregados + su acceso al individual?
  Producto sobre datos de menores → no es opcional.
- **UC15 · Revocar autorización.** El padre se va del club → el entrenador debería perder acceso.
  Hoy no hay revoke: UC2/D7 le dan al entrenador copia perpetua. ¿Acceso compartido perpetuo o
  revocable/con expiración?

### Grupo 7 — Consentimiento / autorizador
- **UC16 · El autorizador rechaza o ghostea.** El entrenador pagó $12.99 e hizo su cuestionario,
  pero el padre no autoriza. Distinto de UC12: acá un tercero bloquea → remedio/reembolso distinto.
  Sub-caso: **consentimiento parcial** — deja jugar al niño pero NO comparte el perfil con el
  entrenador (lo que el entrenador pagó).
- **Coherencia crítica: "responsable" ≠ tutor legal.** Un entrenador que clickea "autorizar" no es
  el tutor del menor y no puede dar consentimiento parental verificable (COPPA). Magic-link = verif.
  débil. Distinguir "adulto que autorizó" de "adulto legalmente habilitado a consentir por ese niño".

### Grupo 8 — Ciclo de vida de datos
- **UC17 · Pago falla / checkout abandonado.** El enum ya tiene `failed`; no hay UC (emails, retry,
  limpieza de la fila `pending` + el `one_links` slot creado en checkout).
- **UC18 · Invitación emitida pero nunca aceptada.** Si el responsable PAGA el $4.99 de la abuela
  (D3) y ella nunca hace su cuestionario: compra paga sin entregable. ¿Cobrar al invitar o al
  aceptar? ¿Expira? ¿Reembolso?
- **UC19 · Perfil de adulto reusado pero viejo (>6 meses) al sumar un niño nuevo.** UC3 reusa sin
  re-cuestionario, pero es re-perfilable a 6 meses. Si suma a María 8 meses después: ¿reusa el DISC
  viejo o fuerza refresco (que cambia el precio)?
- **UC20 · Un adulto, varios niños con relojes de 6 meses independientes.** UC3 (un DISC reusado
  para varios) + UC6 (re-perfilar refresca el DISC) chocan: refrescar el DISC por el ciclo de
  Juancito cambia la base del puente de María, salvo que cada jugada tome un **snapshot** del perfil.
  Semántica live-vs-snapshot sin definir.
- **UC21 · Puentes satélite que se invalidan cuando el niño re-juega ($12.99).** En UC6 el niño
  re-juega → informe fresco, pero los puentes de abuela/tía/entrenador quedan viejos. ¿Se refrescan
  solos (¿gratis? ¿$4.99 c/u?) o se pudren? Con el pack "toda la familia" (§7) es todo un grupo
  que envejece en cada re-perfilado.
- **UC22 · Email mal tipeado / misma persona con dos emails.** Identidad = email, passwordless. Si
  el comprador se equivoca el email, no hay recuperación. Misma persona con 2º email = adulto nuevo
  que re-hace el DISC y pierde el reuso, sin merge.

## Under-specified a cerrar
- **Entitlement (crítico):** ¿el que paga un puente de $4.99 ve el informe individual COMPLETO del
  niño? **UC4 dice que la abuela SÍ; UC5 dice solo su puente.** Inconsistente + default de exposición
  (cada adulto satélite vería el perfil completo del menor). Necesita regla de entitlement explícita.
- **Colisión de nombres dentro del scope ("dos Juanes"):** el checkout etiqueta `vínculo con
  ${childName}`; dos "Juan" = filas/emails ambiguos. Falta desambiguador + un "¿querés decir tu Juan
  de antes?" para no cobrar $12.99 dos veces por el mismo niño real.

## Decisiones nuevas (D8-D18)
- **D8** — Borrado de datos: self-delete del adulto, borrado del niño por el responsable, y la
  cascada a los puentes/informes de adultos invitados (UC14).
- **D9** — Revocación de autorización: ¿el padre puede revocar el acceso del entrenador? ¿El informe
  compartido es perpetuo o expira? (UC15)
- **D10** — Moneda & MercadoPago: valores ARS de $12.99 y $4.99, fijo vs FX, redondeo; condiciones
  del flip `STRIPE_ONLY`.
- **D11** — Falla de pago & política de reembolso real: checkout abandonado/rechazado, y reembolso
  después de entregado el informe de un menor (no se puede "des-entregar"). Sube D5 de "diferir" a
  regla real.
- **D12** — Migración legacy: grandfather/upgrade de compradores $9.99 `one` y ArgoOne+®, **y remover
  el bloqueo de doble compra**.
- **D13** — Entitlement del $4.99 al informe individual: ¿el comprador de un puente satélite ve el
  informe completo del niño (UC4) o no (UC5)?
- **D14** — Colisión/duplicado dentro del scope: desambiguar dos "Juan" + confirm "¿tu niño de antes?"
  para evitar cobrar $12.99 dos veces por el mismo niño.
- **D15** — Perfil de adulto reusado viejo: reuse vs forzar refresco al sumar niño >6 meses; semántica
  live-vs-snapshot para adultos con varios niños.
- **D16** — Mecanismo de consentimiento verificable (COPPA) y si un no-tutor (entrenador) puede ser
  el "responsable"/dueño del consentimiento.
- **D17** — Ciclo de vida de invitaciones: pendiente/expirada/rechazada; cobrar al invitar vs al
  aceptar; reembolso si el invitado nunca completa.
- **D18** — Rechazo del autorizador / consentimiento parcial: remedio cuando el adulto linkeado no
  autoriza tras el pago, y el caso "el niño puede jugar pero el comprador NO recibe el perfil".

## Los 3 bloqueadores antes de Fase B
1. **C1 + M6** — el gate "una compra cubre a todos" + el SKU $9.99 hacen inconstruible medio matriz
   → decisión de migración (D12) + rework del checkout.
2. **M1 + M2 + C2 (legal)** — borrado, revocación y "responsable ≠ tutor legal (COPPA)": los huecos
   que bloquean launch. D1-D7 no los tocaban.
3. **U2 + C5** — "orden libre" choca con el checkout que exige un niño ya jugado → definir cómo se
   referencia un niño que todavía no jugó.

---

# Resoluciones del owner (2026-07-09)

- **Blocker 1 (migración) — NO APLICA.** No hubo compradores reales. El botón "Puente gratis por
  tenant" (admin) cubre lo que surja. Solo queda **reescribir** el checkout, no migrar.
- **Blocker 3 (orden libre) — RESUELTO.** El checkout vende el **combo = 2 links** (link del informe
  individual + link del informe puente), **link-first**, sin exigir un niño ya jugado. El registro
  del niño se crea cuando juega. Si el niño no juega, no es problema nuestro.
- **D8/D9 (borrado/revocación) — RESUELTO.** Cada informe lleva un **ID** que va en el email de
  autorización; el responsable lo guarda para borrar/revocar (revocar = borrar, mismo ID). Borrar el
  registro del niño **cascadea** (se van los puentes/accesos satélite). Foco = datos del **niño**;
  el adulto maneja lo suyo con su email. *(Refinamiento sugerido: que el borrado también sea
  alcanzable por "entrá con tu email" del responsable, para no depender de que guarde el ID — es el
  mismo patrón passwordless que ya adoptamos.)*
- **D16 (COPPA) — RESUELTO (self-attestation).** El que autoriza se hace cargo de ser adulto/
  responsable/veraz. El **hub magic-link es del comprador**; el adulto responsable (si es distinto)
  solo tiene a disposición el **informe individual** (+ el ID de borrado). *(Nota: es auto-declaración,
  no verificación dura; posición razonable para launch, fortalecible después si hace falta.)*
- **D13 (entitlement $4.99) — RESUELTO: SÍ ve el informe individual completo.** El satélite ($4.99)
  recibe su puente + el informe individual completo del niño. Es un upsell/oferta (alguien ya pagó
  $12.99 por ese niño) y **siempre con consentimiento del responsable** (la invitación autoriza el
  acceso). *(Guardrail: el copy de invitación debe decir explícito que invitar comparte el perfil
  del niño.)*
- **D11 (pago/reembolso) — parcial.** Postura: entregamos los links; si el niño no juega, no es
  nuestro problema (sin reembolso post-entrega). Falta el manejo técnico de pago fallido/abandonado
  (build).
- **Panel (universal) — RESUELTO.** Cualquier adulto entra por **"email → magic link → panel"**, y
  el panel muestra **el estado que tenga**: solo informe individual, solo puente, solo links sin
  enviar, o cualquier combinación. Es la puerta única (supera el "hub solo del comprador"); también
  le da al responsable el acceso robusto para borrar. El ID del email queda como atajo, no como
  única llave.
- **D10 (moneda) — RESUELTO: USD vía Stripe (única pasarela).** Se apaga el camino MercadoPago/ARS
  (`STRIPE_ONLY`). Opcional: un conversor que lee el dólar diario y **muestra** el equivalente en
  pesos a visitantes de Argentina (solo referencia; el cobro es USD). Disclaimer chiquito: "$12.99,
  convertible al valor del día de la compra". El **dólar BNA es lo que el usuario realmente paga**:
  el "dólar tarjeta" (impuesto PAÍS + percepciones) **ya no existe en Argentina** (owner, 2026-07-09;
  revisar si vuelve a aparecer). Entonces mostrar el BNA es exacto, sin sorpresa en el resumen.
- **D14 (colisión de nombres) — RESUELTO: no existe.** Puede haber mil Juancitos; no hacemos dedup
  ni detección de colisión. El usuario se hace responsable de mandar el link de juego al adulto que
  corresponde a su Juancito. Si crea dos, no es nuestro problema (consistente con "el niño no tiene
  identidad global").
- **D15 (snapshot vs live / cadencia) — RESUELTO.** **Todo perfil** (puente del adulto y odisea del
  niño) se re-genera cada 6 meses, cada uno con su **vencimiento independiente**. Si está vencido,
  el sistema lo marca **"retrasado"**. Los informes/puentes son snapshots datados: cuando el perfil
  base vence, el informe queda "retrasado" y se refresca explícitamente (pagando: $12.99 si implica
  que un niño re-juegue, $4.99 si es refresco del lado del adulto). Nada muta en silencio.

### Estado: TODAS las decisiones cerradas
Modelo (`ARGOONE-MODELO-NUEVO.md`) + casos de uso (UC1-UC22) + decisiones (D1-D18): resueltos.
Próximo: **Fase B — modelo de datos objetivo.**
