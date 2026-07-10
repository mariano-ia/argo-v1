# ArgoOne — Simplificación "compartir un link" (análisis funcional + propuesta)

> Sale de un workflow multi-agente (5 lectores del código real → 3 diseñadores
> independientes → crítico adversarial → síntesis), 2026-07-10. Ancla el principio
> del owner ("todo el producto es compartir un link") contra el código vivo en
> develop. **Propuesta para aprobar; nada implementado todavía.** Complementa
> `ARGOONE-FLUJOS.md` (R1-R7) y `ARGOONE-MODELO-NUEVO.md` (decisiones cerradas).

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
