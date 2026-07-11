# ArgoOne — Decisiones consolidadas (owner, 2026-07-10)

> Documento simple y definitivo. Si algo contradice otro doc anterior
> (CASOS D3/D13, FLUJOS R2/F3/F5, MODELO-DATOS "panel universal"), **manda este**.
> Detalle técnico y trazabilidad: `ARGOONE-SIMPLIFICACION-LINK-FIRST.md` §9.

## 1. El producto en una frase

Todo gira alrededor de **compartir un link**. Un link en blanco no sabe nada de
nadie; la identidad (nombre, email) se aprende cuando alguien juega. Cada informe
generado vive **para siempre** en su propio link.

## 2. Los tres roles

| Rol | Quién es | ¿Panel? | Qué tiene |
|---|---|---|---|
| **Comprador** | Paga los $12.99 (padre o coach) | Sí | Informe individual del niño que pagó + su propio puente incluido |
| **Adulto** | Autoriza el juego del niño | Sí | **Siempre** recibe el informe individual de cada jugada + es el **único** que comparte el link de puentes |
| **Familia** | Abuela, tíos: reciben el link de puentes del adulto | **No** (sin login, sin cuenta) | Un email con el link permanente a **su** puente. Un informe = un email |

- Caso self-serve: comprador y adulto son la misma persona (un panel con todo).
- Caso coach: son dos personas, **cada una con su panel** (el adulto entra con su email, sin contraseña).
- Solo hay **un** adulto autorizante por niño: el que autorizó la primera vez. No verificamos parentesco; elegimos a uno. Su email **no se cambia nunca** (evita que un coach redirija la autorización a cualquier adulto). Si ese email muere, el niño no puede re-perfilarse.

## 3. Precios y qué compra cada uno

| Pago | Quién lo paga | Qué recibe |
|---|---|---|
| **$12.99** | El comprador | Informe individual del niño + su propio puente (incluido, nunca paga aparte) |
| **$4.99** | Cada adulto extra (familia, o el adulto cuando no fue el comprador) | **Solo su puente**. Nunca el informe individual del niño: si lo quiere, se lo pide al adulto |

- **Pay-first en todo**: abrir link → nombre + email + términos → Stripe (email pre-cargado) → jugar. No existe "jugar gratis y pagar después".
- **1 puente por persona por niño**: el mismo email no puede comprar dos puentes hacia el mismo niño.

## 4. Los dos links

**Link de juego (niño):**
- Nace en blanco al comprar. No dice nada de nadie hasta que un niño juega.
- Prohibido mostrar "enviado a tal email, esperando que juegue": si sabemos un email es porque ya jugó.
- Estados: *disponible (copiar y compartir)* → alguien juega → aparece el **niño con nombre e informe** en el panel. No existe "preparando".

**Link de puentes (por niño):**
- **Uno solo por niño.** Lo comparte **solo el adulto**, cuantas veces quiera.
- Cada persona que lo abre: onboarding (nombre + email + términos) → paga su $4.99 → juega su cuestionario → le llega por email el link permanente a su puente.
- Es seguro compartirlo libremente porque el $4.99 da **solo el puente**, nunca el informe del niño.
- El adulto ve la lista de adultos vinculados y puede revocar el link.

## 5. El ciclo de 6 meses

- **Nada muere.** Todo informe (individual o puente) queda legible para siempre en su link.
- **Regla dura: el niño no puede volver a jugar antes de los 6 meses.** Sin excepciones.
- Al cumplirse 6 meses: alerta de re-perfilar al **comprador y al adulto**, cada uno en su panel, desacoplados (ninguno depende del otro).
- Quien paga los $12.99 del re-perfilamiento:
  - Si la foto vigente ya tiene 6 meses → jugada nueva: email de autorización al adulto de siempre (el de la base), el niño juega, el informe nuevo va al adulto (siempre) y al pagador, y el pagador recibe su link para re-jugar su propio puente.
  - Si la foto es fresca (el otro ya actualizó hace poco) → recibe esa foto **sin que el niño juegue**, más su link de puente propio.
- Quien no paga, se queda con su foto vieja para siempre. Excepción: el adulto recibe cada informe nuevo sin pagar, porque autoriza cada jugada.
- Los puentes de la familia no se renuevan solos: puente sobre la foto nueva = otro $4.99.

### 5.1. "Pagué, pero la jugada no se concreta" (decisión del owner, 2026-07-10)

Dos caras del mismo caso: el email del adulto autorizante está muerto (o nunca hace click), o el adulto autoriza pero el niño nunca juega. Política:

- **Sin reembolso automático** (coherente con "sin reembolsos"). La compra queda **en espera como una jugada pendiente**.
- La **autorización vive 14 días**. Si vence, se puede volver a disparar (siempre al mismo adulto de la base, inmutable).
- Si el email del adulto está genuinamente muerto: la jugada queda trabada (el niño no puede re-perfilarse, §2) y lo resuelve **soporte caso por caso**, nunca un reembolso automático.
- El pagador nunca pierde la plata: queda como jugada a completar. La compra no se libera para otra jugada hasta completarse (dedup: un re-perfilamiento en curso por niño).

## 6. Consentimiento

- El adulto que autoriza acepta, explícito en el texto: *"quien pagó este perfilamiento
  recibirá el informe individual del niño y generará su informe puente basado en ese perfil"*.
- El consentimiento se pide en **cada** jugada (también en re-perfilamientos).
- La familia (adulto extra) solo acepta términos por sí misma; nunca consiente por el niño.

## 7. Qué puede hacer cada uno en su panel

**Coach (comprador, no adulto):**
ver informe de cada niño que pagó · ver su puente · copiar/enviar el link de juego ·
re-perfilar al vencer ($12.99) · comprar otro niño.
No comparte puentes, no ve adultos vinculados, no borra al niño.

**Adulto (autoriza):**
ver el informe del niño (siempre, cada jugada) · compartir el link de puentes (exclusivo) ·
ver adultos vinculados y revocar el link · crear su propio puente ($4.99 si no fue el
comprador) · re-perfilar al vencer ($12.99) · borrar los datos del niño.

**Padre self-serve (comprador + adulto):** todo lo anterior junto, con su puente incluido.

**Familia:** sin panel. Su email → su informe puente permanente (ver, descargar, compartir).

## 8. Qué desaparece del build actual

- La invitación por email tipeado (tabla `bridge_invites` + página de invite + gate de email).
- El checkout standalone de puentes con email tipeado.
- El estado "enviado a {email}, esperando que juegue" en links de juego.
- El estado "preparando" como identidad de tarjeta.
- El acceso del $4.99 al informe individual del niño (era la decisión D13; queda revertida).
- El "single-claim" (link de un solo uso): innecesario porque el $4.99 es solo-puente.

## 9. Mockup de referencia

`docs/mockups/argoone-roles.html` (4 vistas: familia, coach, adulto, padre).
Servido local: `http://localhost:8099/argoone-roles.html`.
