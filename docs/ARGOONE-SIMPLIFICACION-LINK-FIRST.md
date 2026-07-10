# ArgoOne — Simplificación "compartir un link" (análisis funcional + propuesta)

> Sale de un workflow multi-agente (5 lectores del código real → 3 diseñadores
> independientes → crítico adversarial → síntesis), 2026-07-10. Ancla el principio
> del owner ("todo el producto es compartir un link") contra el código vivo en
> develop. Complementa `ARGOONE-FLUJOS.md` (R1-R7) y `ARGOONE-MODELO-NUEVO.md`.
>
> **⚠️ LEER PRIMERO §9 — MODELO CONGELADO CON EL OWNER (2026-07-10).** La revisión
> en vivo con el owner CERRÓ las decisiones abiertas de §7 y CORRIGIÓ parte de la
> propuesta (§7 D1/D3/D5/D8 quedaron superseded; el "single-claim" murió a favor
> del link único re-compartible + entitlement bridge-only). §1-§8 quedan como
> registro del análisis; §9 es la especificación vigente.

## 1. Veredicto

El principio del owner **es correcto, y en el ~80% del producto YA es la arquitectura
viva** — no es un cambio, es terminar de aplicar lo que el lado-niño ya hace. El niño
es link-first puro: el checkout acuña un `one_links` en blanco (sin nombre ni email
del jugador; el único email que existe es el del PAGADOR) y la identidad recién se
aprende en el onboarding-antes-de-jugar. El lado-adulto (puente) invierte esto: exige
el email del recipient por adelantado y lo bloquea con un gate.

**Un solo caveat, real y no negociable:** "compartir un link en todas partes" no puede
significar "mismo ORDEN DE PAGO en todas partes". La decisión cerrada fija que el
add-on de $4.99 es **cuestionario primero, pago al final**, mientras el combo de $12.99
es pago-primero. La frase del owner ("pagás, te queda un link") describe el combo, no
el add-on. Resolución: el momento del cobro es una **propiedad por-tipo (`funding`)**,
no parte del principio. Así el principio se sostiene a nivel ENTIDAD (todo es un
slot-link en blanco que rinde un resultado con nombre) sin pisar el pay-last cerrado.

## 2. Respuestas a las 3 preguntas del owner

- **Q1 — ¿Cobrar + pedir el email de la abuela por adelantado está mal vs link-first? SÍ.**
  El único email inherente a la compra es el del pagador. El del recipient sólo se
  front-loadea en el lado-adulto; peor, el path directo ni siquiera puede cobrarle a un
  tercero (el gate `recipient==adult_email → 403` fuerza que sea el propio responsable).
- **Q2 — ¿Link-first exige un onboarding del adulto (email/T&C) antes del cuestionario? SÍ, y hoy no existe.**
  Con un matiz de simetría: el onboarding del adulto NO es igual al del niño. Adulto =
  email + auto-atestación T&C, **nombre opcional** (su identidad ES el email), **sin
  consentimiento parental**. Niño = el responsable aporta consentimiento parental (<13,
  COPPA). La rama COPPA se deriva DURO del tipo de link, nunca la elige el usuario.
- **Q3 — ¿Una tarjeta "preparando" es sólo un link sin resultado? SÍ en espíritu, pero hoy no es el trigger literal.**
  Hoy "Preparando…" se dispara sólo sobre un link YA JUGADO cuyo informe está en revisión
  (hold de calidad server-side), no sobre un slot vacío. Unificarlos es correcto como
  dirección, PERO hay que conservar un sub-estado para distinguir "no jugó todavía" de
  "jugó, informe en revisión".

## 3. Modelo recomendado — TRES CAPAS, aditivo, cero drops en este envío

- **Capa 1 — LEDGER / pago (sin cambios):** `one_purchases` (combo prepago; email =
  pagador, correcto) + `puentes_purchases` (unlock $4.99 y comp $0).
- **Capa 2 — SLOT / link compartible (EL primitivo único):** `one_links` + 3 columnas
  aditivas:
  - `kind` (`'child' | 'adult_bridge'`, default `'child'`)
  - `target_perfilamiento_id` (a qué niño puentea; NULL en child-links)
  - `funding` (`'prepaid' | 'unlock'`) — codifica la asimetría de pago SIN partir el flujo
  - `recipient_email`/`child_name` (ya existen) → degradados a **courier-label opcional
    que NO gatea nada**.
  `bridge_invites` queda **superseded-in-place** (sus 3 piezas las absorbe el slot
  `kind='adult_bridge'`); se dropea en un cleanup destructivo posterior.
- **Capa 3 — RESULT / identidad con nombre (sin cambios):** niño → `children` +
  `perfilamientos`; adulto → `adult_profiles` (reusable por email) + `bridges`. La
  unicidad por email se satisface gratis porque el email se aprende en el onboarding
  ANTES de escribir la fila-result.

**NO se adopta** un `authorized_by_email` en el slot (sería 2ª fuente de verdad y viola
R1). La autorización se DERIVA de `children.responsible_adult_email`.

## 4. El flujo único (niño y adulto, mismo esqueleto)

```
ACUÑAR (pago o autorización) → SLOT EN BLANCO (one_links, sin nombre) →
COMPARTIR (copiar/re-compartir) → ABRIR →
ONBOARDING-ANTES-DE-JUGAR (aprende identidad) → JUGAR → RESULTADO CON NOMBRE
```

- **Niño (ya es esto):** combo $12.99 → 1 slot `child` + 1 slot `adult_bridge`
  `funding='prepaid'` (el puente propio del comprador) → compartir → registro (nombre
  niño, email responsable, T&C, +consentimiento si <13) → odisea → perfilamiento.
- **Adulto (nuevo, simétrico):**
  1. **ACUÑAR** desde el hub del responsable: "Crear puente para otro adulto" (slot
     `adult_bridge`, `funding='unlock'`, en blanco) o "Crear mi puente" (auto-puente;
     cierra el hueco F4 de la familia cuyo comp fue al coach). El acuñar = la
     autorización, y SÓLO puede originarse en el hub del responsable (R1 intacto).
  2. **COMPARTIR** — tarjeta pendiente re-copiable. Nunca se tipea el email del tercero.
     (Opcional: email como courier para mandar el mail + etiquetar la tarjeta.)
  3. **ABRIR + ONBOARDING** — la abuela abre el link → onboarding (email propio + T&C,
     nombre opcional). Este es el paso simétrico que hoy falta.
  4. **JUGAR → PAGAR $4.99 al final → BRIDGE.** Cuestionario DISC (motor reusado) →
     unlock $4.99 → upsert `adult_profiles` (si ya existe fresco, se reusa y se saltea el
     cuestionario, R6 — pero NUNCA el onboarding/consentimiento) → `bridge`.

**Clave:** el MOTOR DISC del adulto se REUSA. Cambia la PUERTA (acuñar + onboarding +
entitlement), no el motor.

## 5. Qué SIMPLIFICA / DESAPARECE

1. El gate `recipient_email===adult_email → 403` (`puentes-checkout`) — DESAPARECE.
2. El comprador/invitador tipeando el email del tercero — DESAPARECE (courier opcional).
3. La página standalone `PuentesCheckout.tsx` (email tipeado) — DESAPARECE (redirect fino).
4. `puentes-start` devolviendo identidad desde la compra — la identidad entra por onboarding.
5. El stub `questionnaire_not_available` — pasa a onboarding+cuestionario real.
6. La asimetría de pago como DOS flujos — se reemplaza por la propiedad `funding` sobre UNO.
7. `generate-link` exigiendo email + sport up-front — email opcional; sport en onboarding.
8. `bridge_invites` — superseded-in-place (drop diferido).

## 6. Guardarraíles que NO se tocan

`one_purchases.email` (pagador up-front, correcto) · `children.responsible_adult_email`
como fuente única de R1 (NO agregar `authorized_by_email`) · entitlement = bridge PAGADO
(R2; NO overloadear `report_status` como paywall) · consentimiento parental del niño lo
da el responsable, jamás migra a quien abre un link · **sin drops de tablas en este envío**.

## 7. Decisiones abiertas para el owner (con recomendación)

- **D1 — Orden de pago del $4.99.** *Rec: mantener pay-LAST* (locked). El "pagás → link"
  del owner aplica al combo (prepaid); el add-on es autorizar → link → jugar → pagar
  (unlock). Forzar pay-first en todo baja la conversión del add-on frío.
- **D2 — Link abierto vs direccionado.** *Rec: abierto/en-blanco por default*, con email
  opcional que sólo etiqueta + manda mail, nunca gatea.
- **D3 — GUARDARRAÍL innegociable: single-claim.** Un token abierto re-compartible y
  self-claimable SIN LÍMITE derramaría el informe completo del menor a cualquier portador.
  *Rec: single-claim MANDATORIO* — bindear el email del reclamante en el primer checkout
  pagado, fail-closed en un 2º claim, y que el responsable pueda revocar un link pendiente.
  (Esto también resuelve el escenario del owner sobre re-perfilar: la autoridad se
  re-establece por consentimiento en cada jugada + acceso al registro atado al email; no
  se hereda un email posiblemente muerto.)
- **D4 — Fuga de PII pre-pago.** Hoy `bridge-invite-accept` devuelve arquetipo/edad/deporte
  del menor a cualquier portador de token ANTES de pagar. *Rec: cerrarla en este envío* —
  el intro del adult-link devuelve sólo el primer nombre del niño hasta onboarding+pago.
- **D5 — Semántica de "preparando".** *Rec: dos sub-estados derivados* ("link sin resultado"
  vs "informe en revisión"), misma familia visual, copy distinto.
- **D6 — Dropear `bridge_invites` ahora o después.** *Rec: después* (superseded-in-place).
- **D7 — URL del adulto (`/one/:slug` vs `/puente/:token`).** *Rec: cosmético, diferir.*
- **D8 — Reconciliación courier vs identidad** (mandaste a `abuela@x`, jugó como `abu@y`).
  *Rec: aceptar `abu@y` como verdad + nota en el hub* ("invitaste a abuela@x · jugó como abu@y").

## 8. Plan coherente — qué sale JUNTO (no en cuotas)

Todo detrás de los flags existentes, oscuro hasta el flip. Unidad atómica:
1. Migración aditiva: `one_links += kind, target_perfilamiento_id, funding`.
2. Acuñar (hub): "Crear puente para otro adulto" + "Crear mi puente" (cierra F4).
3. Onboarding del adulto: pantalla nueva (email + T&C, nombre opcional, sin parental),
   rama-dura por `kind`, PII mínima pre-pago (D4).
4. Entitlement: single-claim obligatorio + revocable (D3); $4.99 pay-last, combo pay-first.
5. Hub unificado: tarjetas link(pending) vs result(named), ambos kinds, sub-estado
   "preparando" preservado (D5). (Sobre el mockup v3 aprobado en dirección.)
6. Repunte de las 4 salidas de email al hub + redirect fino en `/puentes/checkout`.
7. `bridge_invites` + `PuentesCheckout` standalone: deprecados-in-place (sin drop).

**Fuera de este envío:** drops destructivos y la unificación de URL — se surfacean por
separado cuando no queden datos in-flight. El motor DISC del adulto se reusa, no se reescribe.

**En una línea:** el primitivo `one_links.kind` hecho ship-safe (aditivo, detrás de flags,
single-claim obligatorio), organización en 3 capas SIN colapso de tablas, R1 derivado de
`children`, y el orden de pago como propiedad `funding` por-tipo en vez de dos productos.

## 9. MODELO CONGELADO CON EL OWNER (2026-07-10) — especificación vigente

Cerrado en revisión en vivo. Donde contradiga §1-§8 o los docs previos (CASOS D3/D13,
FLUJOS R2/F3/F5, MODELO-DATOS F6 "panel universal"), MANDA ESTA SECCIÓN.

### 9.1 Vocabulario de roles (del owner, usar SIEMPRE estos términos)

| Rol | Quién es | ¿Panel? | Qué recibe |
|---|---|---|---|
| **El comprador** | Quien paga los $12.99 (padre o coach) | SÍ | El informe individual de la jugada que pagó + su puente INCLUIDO (link para jugar su cuestionario) |
| **El adulto** | Quien AUTORIZA el juego del niño (responsable) | SÍ | **SIEMPRE el informe individual de CADA jugada** (la haya pagado o no), porque autorizó. Único que comparte el link de puentes |
| **La familia** | Adultos extra que reciben el link de puentes DEL adulto (abuela, tíos, etc.) | **NO** (sin login, sin cuenta, sin nada) | Un email con el link permanente a SU informe puente. Un informe = un email |

En el caso self-serve, comprador = adulto (una persona, un panel con todo). En el caso
coach son dos personas y CADA UNA tiene su panel (el del adulto entra por magic-link email).

### 9.2 Reglas de entitlement (cerradas)

1. **$12.99 (comprador):** informe individual del niño + puente propio incluido. El
   comprador NUNCA paga $4.99 (su puente siempre viene en sus $12.99).
2. **$4.99 (familia y adulto-no-comprador):** SOLO su informe puente. NUNCA el informe
   individual del niño (si lo quiere, se lo pide al adulto). Esto REEMPLAZA a D13/R2
   ("puente pagado da acceso al perfilamiento"): el entitlement del $4.99 es bridge-only.
3. **Pay-FIRST en todo:** abrir link → email+nombre (+T&C) → Stripe (email pre-cargado)
   → jugar. Muere el freemium pay-last del add-on.
4. **1 puente por (email × niño):** la unicidad la da el email aprendido en el onboarding.
5. **Consentimiento (texto a agregar):** el adulto que autoriza acepta explícito que
   "quien pagó este perfilamiento recibirá el informe individual del niño y generará su
   informe puente basado en ese perfil".
6. **`children.responsible_adult_email` es INMUTABLE** entre jugadas: el re-perfilamiento
   siempre pide autorización a ESE email (si murió, el niño no puede re-perfilarse). Nunca
   se permite redirigirlo (un coach podría mandarlo a cualquier adulto).

### 9.3 Link de puentes (cerrado)

- **UN solo link de puentes por niño.** Lo comparte SOLO el adulto, cuantas veces quiera.
- Cada adulto de la familia que lo abre: onboarding (email + nombre + T&C, sin
  consentimiento parental) → paga SU $4.99 → juega su cuestionario → recibe por email el
  link permanente a su puente. Sin panel.
- Es seguro re-compartible PORQUE el $4.99 es bridge-only (9.2.2): lo peor que puede
  pasar es que un desconocido pague y reciba un puente; jamás ve el informe del niño.
- El "single-claim obligatorio" de §7-D3 queda **superseded** por este diseño.
- El adulto puede ver los adultos vinculados y revocar el link (rotarlo).

### 9.4 Links de juego (cerrado)

- Un link de juego EN BLANCO no sabe nada de nadie. **PROHIBIDO** mostrar "enviado a
  {email}, esperando que juegue": si conocemos un email es porque YA jugó.
- Estados: `disponible (copiar/compartir)` → (alguien juega) → deja de ser link y pasa a
  ser un NIÑO con nombre + informe en el panel. No existe el estado "preparando" como
  identidad; un informe retenido por control de calidad es un resultado cuyo botón espera.

### 9.5 Ciclo de 6 meses (cerrado)

- **El puente nunca muere.** Todo informe (individual o puente) queda legible para
  siempre en su link. Lo que envejece es el dato, no el acceso.
- **REGLA DURA: el niño NO puede jugar de nuevo antes de los 6 meses.** (Ya existe como
  gate en `start-reprofile`; se mantiene sin excepciones.)
- Al vencer: alert de re-perfilar a **comprador Y adulto**, cada uno en su panel,
  desacoplados (ninguno depende del otro).
- Quien paga los $12.99 del re-perfilamiento:
  - Foto vigente ≥6 meses → jugada nueva: email de autorización al adulto de la base
    (inmutable), el niño juega, el informe nuevo va al adulto (siempre) + al pagador,
    y el pagador recibe su link para re-jugar SU cuestionario puente (incluido).
  - Foto vigente <6 meses (el otro ya actualizó) → recibe la foto fresca SIN que el
    niño juegue + su link de puente propio. Pagar se paga siempre; la jugada no se repite.
- Quien no paga se queda con su foto vieja para siempre — EXCEPTO el adulto, que recibe
  el informe de cada jugada nueva sin pagar (porque autoriza cada una).
- Los puentes de la familia no se renuevan solos: puente sobre foto nueva = otro $4.99.

### 9.6 Matriz de acciones por panel

**Coach (comprador, no adulto):** ver informe de cada niño que pagó · ver su puente ·
enviar/copiar el link de juego · re-perfilar al vencer ($12.99) · comprar otro niño.
NO comparte link de puentes, NO ve adultos vinculados, NO borra al niño.

**Adulto (autoriza; con o sin compra):** ver el informe del niño (siempre, cada jugada) ·
compartir el link de puentes (potestad exclusiva) · ver adultos vinculados / revocar link ·
crear su propio puente ($4.99 si no es el comprador) · re-perfilar al vencer ($12.99) ·
borrar los datos del niño.

**Padre self-serve (comprador + adulto):** la unión de las dos columnas, con su puente
incluido (no paga $4.99).

**Familia:** sin panel. Email → informe puente permanente (ver / descargar / compartir).

Mockup alineado: `docs/mockups/argoone-roles.html` (4 vistas). Los huecos de mecánica a
resolver EN EL PLAN (no de modelo): rebuild del invite per-email → link único por niño;
checkout $4.99 pay-first con email pre-cargado; panel del adulto no-comprador (resolución
por `responsible_adult_email`, flag `is_responsible` ya existe); cierre de la fuga de PII
pre-pago de `bridge-invite-accept` (§7-D4, sigue vigente).
