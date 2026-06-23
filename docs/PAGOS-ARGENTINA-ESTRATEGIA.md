# Pagos y Argentina — Estrategia y decisión de modelo

Fecha: 2026-06-23. Estado: **análisis cerrado, decisión de modelo pendiente del owner.**

Documento de decisión para el founder. Resume todo el análisis de medios de pago
para comercializar Argo (US + Argentina), el marco impositivo argentino 2026, los
costos reales, las alternativas evaluadas y el plan recomendado.

> Aclaración importante: esto es orientación con fuentes, **no asesoramiento
> contable/legal**. Los puntos fiscales (estructura US-Argentina, monotributo,
> IVA) hay que cerrarlos con un contador que conozca US-AR.

Doc técnico complementario (qué está construido y probado): `docs/PAYMENTS-READINESS.md`.

---

## 1. TL;DR

- **US: sin fricción.** Stripe US ya funciona y está probado con ventas reales.
- **Argentina, para arrancar sin AFIP:** vender vía **Stripe US en USD**, mostrando
  el precio en USD + un estimado en pesos (al **dólar oficial**) con disclaimer. El
  toggle `AR_VIA_STRIPE` ya está construido para rutear Argentina a Stripe.
- **Argentina, peso nativo (mejor conversión):** requiere **MercadoPago**, que a su
  vez requiere estar inscripto (**monotributo** alcanza). Ese es el único desbloqueo
  real para cobrar pesos locales; es barato y rápido.
- **No existe ninguna pasarela que dé pesos nativos al argentino sin ser vendedor
  registrado en Argentina.** Las "alternativas mágicas" (MoR, dLocal) o no dan
  métodos locales, o igual exigen inscripción.
- **Decisión pendiente del owner:** lanzar todo-Stripe ya (sin AFIP, peor experiencia
  AR) vs. sacar monotributo primero y habilitar MercadoPago para Argentina.

---

## 2. Qué está construido y probado (a 2026-06-23, en `develop`)

- Stripe (pago único + suscripción) y MercadoPago (pago único + preapproval)
  integrados, ruteo por país.
- **Bug de MercadoPago arreglado:** MP nunca confirmaba pagos (0 de 16 en prod)
  porque dependía de un webhook de panel nunca conectado. Se agregó `notification_url`
  y se ajustó la verificación de firma. Detalle en `docs/PAYMENTS-READINESS.md`.
- **Toggle `AR_VIA_STRIPE`:** rutea compradores argentinos a Stripe USD en vez de MP.
  Activo en Preview (develop), **no en producción** (prod AR sigue a MP) hasta decidir.
- **13/13 tests E2E** en deployment real (webhooks firmados Stripe + MP, ruteo AR).
- Pendiente de owner: merge a producción, 1 pago real por rail en modo live,
  decisión de ruteo AR.

---

## 3. Marco impositivo Argentina 2026 (lo que cambió)

- **Impuesto PAÍS: eliminado** (venció 23/12/2024, Ley 27.541, no se prorrogó). Ya no
  existe. (Mi análisis inicial citó un recargo de ~60% que era el esquema viejo
  PAÍS + Ganancias; **quedó desactualizado**.)
- **Dólar blue:** tras levantarse el cepo (abril 2025), el paralelo convergió con el
  oficial. A efectos de cálculo se usa el **dólar oficial**.
- **Percepción del 30% a cuenta de Ganancias** (RG 5617/2024): es **recuperable** (pago
  a cuenta, no costo). En 2026 prácticamente **no pega a consumos de streaming/servicios
  del exterior con tarjeta**; el research tuvo señales mixtas (una fuente la da vigente
  al pesificar; otra, eliminada el 02/01/2026 para consumo en moneda extranjera). Para
  estimar precio en pesos: **usar el oficial**, sin +30%, y dejar que el disclaimer
  cubra cualquier caso de banco puntual.
- **IVA servicios digitales 21%** (Decreto 354/2018 + RG 4240): lo cobra el **emisor de
  la tarjeta** como agente de percepción, **no el vendedor**, y solo a proveedores que
  están en el **Anexo II** de ARCA (caso Netflix). **Argo NO está en ese listado**, así
  que lo más probable es que el comprador argentino **no pague ese 21%** (verificar con
  cobros reales).
- **Monotributo (junio 2026):** tope hasta Cat. K = **$108.357.084/año**. Dato clave:
  los ingresos por **exportación de servicios** (lo cobrado del exterior vía Stripe) se
  facturan como **Factura E** y **no consumen el tope** del monotributo (regla ARCA desde
  2021). O sea, monotributo no limita tu facturación internacional.
- **Régimen cambiario:** Comunicación BCRA A 8417 (2026) — las personas humanas
  exportadoras de servicios pueden **no liquidar** divisas (se eliminó el tope de USD
  36.000); hay que ingresarlas al país en un plazo. (Verificar norma vigente con contador.)

Fuentes: [fin Impuesto PAÍS (Chequeado)](https://chequeado.com/el-explicador/fin-del-impuesto-pais-que-impacto-tendra-en-las-compras-de-bienes-y-servicios-en-el-exterior-en-el-turismo-y-en-las-importaciones/),
[RG 5617 percepción (argentina.gob.ar)](https://www.argentina.gob.ar/noticias/ganancias-y-bienes-personales-se-eliminaron-las-percepciones-cuenta-por-compras-de-moneda),
[RG 4240 servicios digitales (AFIP/ARCA)](https://www.afip.gob.ar/iva/servicios-digitales/reg-percepcion-4240.asp),
[monotributo junio 2026](https://www.iprofesional.com/impuestos/454116-monotributo-asi-quedan-las-escalas-topes-e-importes-a-pagar-desde-junio-2026).

---

## 4. Cómo funciona Stripe para Argentina

- La venta la hace (a nivel entidad) la **cuenta US** → para el comprador argentino es
  un **cargo del exterior en USD**. No es una transacción doméstica en pesos.
- **Mostrar pesos estimados: permitido y legal** (Res. 4/2025, Ley 24.240; servicios
  prestados desde el exterior pueden exhibirse en USD con el peso como referencia). El
  monto real es USD; el peso va como "aprox." con disclaimer.
- **Estimar al dólar oficial** (no +30%). Disclaimer sugerido: *"El cobro se realiza en
  USD. El monto en pesos es estimado y orientativo; tu banco aplica la cotización del día
  más los impuestos vigentes, por lo que el total final puede variar."*
- **Qué ve el cliente en la tarjeta:** pesos (las tarjetas argentinas liquidan en pesos),
  pero es el cargo USD convertido por **su banco** a su cotización, marcado como **consumo
  del exterior**. El monto en pesos lo pone el banco, no nosotros; puede diferir del
  estimado y en algunas tarjetas figura directamente en USD.
- **Algunas tarjetas argentinas van a rechazar** el cargo internacional. Es el costo de
  no tener pesos nativos.
- **IVA:** nosotros nunca lo cobramos ni remitimos. Como Argo no está en el Anexo II,
  probablemente el cliente tampoco pague el 21% (a verificar con cobros reales).

Stripe **no abre cuentas de comercio radicadas en Argentina**; la cuenta US/entidad
extranjera es justamente el camino correcto.

---

## 5. Costos de Stripe por transacción (cuenta US, tarifa estándar)

| Concepto | Fee |
|---|---|
| Tarjeta doméstica (US) | **2,9% + US$0,30** |
| Tarjeta internacional (toda tarjeta argentina) | **+1,5%** → 4,4% + US$0,30 |
| Conversión de moneda | +1% (no aplica si cobrás en USD y liquidás en USD) |
| Suscripciones (Stripe Billing) | **+0,7%** sobre el recurrente |
| Contracargo/disputa | US$15 |
| Reembolsos | sin costo emitir, pero no devuelven el fee original |

Efectivo en casos reales de Argo (el $0,30 fijo pesa en tickets chicos):

- Argo One $14.99, cliente **US**: ≈ $0,73 (**~4,9%**)
- Argo One $14.99, cliente **AR**: ≈ $0,96 (**~6,4%**)
- PRO $49/mes, cliente **US** (con Billing): ≈ $2,06 (**~4,2%**)
- PRO $49/mes, cliente **AR** (con Billing): ≈ $2,80 (**~5,7%**)

Toda tarjeta argentina entra como internacional (el +1,5% lo dispara el país emisor de
la tarjeta, no la dirección del cliente). Comparar con MercadoPago/Mobbex abajo.

Fuentes: [Stripe Pricing](https://stripe.com/pricing), [breakdown 2026](https://flexprice.io/blog/stripe-pricing-breakdown-2026).

---

## 6. El modelo Netflix (y por qué NO replicarlo)

Cómo lo hace Netflix en Argentina:
- Factura desde el exterior (**Netflix International B.V.**, Holanda). Tiene sociedades
  argentinas registradas, pero el streaming se factura afuera. **No emite factura
  argentina** al suscriptor.
- El cargo es **consumo del exterior** (no doméstico), aunque el banco lo muestre en pesos.
- El **21% de IVA lo cobra el banco del cliente** (Netflix está en el Anexo II de RG 4240),
  no Netflix. Recargo 2026 ≈ 21% IVA + IIBB (~23-25%), tras caer el 30%.
- Saca la plata vía redes de tarjeta + sub-adquirente cross-border (tipo dLocal/EBANX).

Por qué Argo no debe replicarlo:
- El modelo Netflix **no evita impuestos**: garantiza que el cliente pague 21% de IVA.
  Lo único que evita es la factura local.
- Estar en el Anexo II / montar entidad offshore es **over-engineering** para un SaaS
  chico, y **encarecería** el producto al sumarle el 21% al cliente argentino (que hoy
  probablemente no paga).
- dLocal/EBANX son **enterprise** (TPV multimillonario, onboarding de meses): inaccesible.
- No resuelve el problema real (la obligación fiscal del founder en Argentina).
- **Dato a favor:** como Argo NO está en el listado, sale **más barato** al argentino que
  Netflix. Justamente NO querés ser Netflix.

---

## 7. Alternativas evaluadas

| Opción | ¿Evita factura AR? | ¿Pesos nativos AR? | Suscripciones | Apto SaaS chico | Veredicto |
|---|---|---|---|---|---|
| **Stripe US** (actual) | Sí (nivel entidad) | No (tarjeta USD) | Sí | Ya integrado | Base para US + arranque AR |
| **Stripe Managed Payments** (MoR nativo de Stripe, feb-2026) | Sí (factura por vos, mundo) | No | Sí | Sí (flag sobre Stripe) | Mejor MoR cuando crezca volumen internacional |
| **Paddle / Polar** (MoR) | Sí (mundo) | No | Sí | Sí | Redundante teniendo Stripe Managed Payments |
| **Lemon Squeezy** | Sí | No | Sí | Sí | Descartar (Stripe lo compró, en wind-down) |
| **dLocal Go / Rebill** (cross-border) | No (la cuenta debe ser AR con CUIT) | Sí | Rebill sí | dLocal Go self-serve | No saltea el monotributo; no gana a MP |
| **MercadoPago** (actual) | No (vendedor AR + factura) | Sí | Sí (preapproval) | Sí, requiere monotributo | El camino para AR peso nativo |
| **Mobbex** (doméstica) | No | Sí | Sí (nativas) | Sí, requiere CUIT | ~2,6% crédito vs 6,29% MP: evaluar para abaratar AR |
| **Otras domésticas** (Ualá Bis, MODO, Payway, Pomelo, etc.) | No | Sí | Limitado/no | Varias B2B/infra | Sin valor para Argo |
| **Cripto/stablecoin** | — | — | — | — | Fricción alta para padres/clubes: descartar |

Punto clave que ordena todo: **un MoR sirve para venderle al MUNDO sin facturar cliente
por cliente, no para darle pesos nativos al argentino.** Y ningún MoR exime al founder
de declarar el payout como ingreso en Argentina.

---

## 8. Plan recomendado (por fases)

**Fase 0 — Arranque, sin monotributo:**
- Todo por **Stripe US**, incluida Argentina (toggle `AR_VIA_STRIPE`).
- Precio en USD + pesos estimados (al oficial) con disclaimer.
- MercadoPago: arreglado pero **apagado en prod**.
- Honestidad: aun el ingreso de Stripe es declarable; "sin AFIP" sirve mientras validás
  o sos chico. El fix real (monotributo) es barato, así que esta fase debería durar
  semanas, no meses.

**Fase 1 — Con monotributo:**
- Prender **MercadoPago para Argentina** (peso nativo, sin rechazos): flip del toggle.
- Stripe para el resto del mundo (exportación de servicios, Factura E, no consume el tope).
- Opcional: evaluar **Mobbex** para abaratar el tramo argentino.

**Cuando crezca el volumen internacional:** evaluar **Stripe Managed Payments** para
descargar el compliance de impuestos del mundo (flag sobre la integración actual).

---

## 9. Decisiones abiertas / a confirmar con contador

1. **Modelo de lanzamiento AR:** todo-Stripe ya (sin AFIP, peor UX AR) vs. monotributo
   primero + MercadoPago. **← decisión principal del owner.**
2. **Estructura fiscal US-Argentina:** "facturamos todo con Stripe y solo tributamos en
   US" es cierto **a nivel entidad**, pero como **residente fiscal argentino el founder
   igual tributa** sobre lo que retira de la entidad US (renta mundial; posibles reglas
   de transparencia fiscal). Cerrar con contador US-AR.
3. **Verificar con cobros reales** si la tarjeta argentina recibe o no el 21% de IVA en
   un cargo de Argo vía Stripe (lo esperado: no, por no estar en Anexo II).
4. **Merge a producción** del fix de pagos + toggle, y 1 pago real por rail en modo live.
5. **Plazo de liquidación de divisas** del régimen de exportación de servicios vigente.

---

## 10. Fuentes principales

- Impuestos AR: [Chequeado (fin PAÍS)](https://chequeado.com/el-explicador/fin-del-impuesto-pais-que-impacto-tendra-en-las-compras-de-bienes-y-servicios-en-el-exterior-en-el-turismo-y-en-las-importaciones/), [RG 4240 (AFIP/ARCA)](https://www.afip.gob.ar/iva/servicios-digitales/reg-percepcion-4240.asp), [Res. 4/2025 precios](https://www.argentina.gob.ar/normativa/nacional/resoluci%C3%B3n-4-2025), [monotributo 2026](https://www.iprofesional.com/impuestos/454116-monotributo-asi-quedan-las-escalas-topes-e-importes-a-pagar-desde-junio-2026)
- Stripe: [Pricing](https://stripe.com/pricing), [Managed Payments](https://docs.stripe.com/payments/managed-payments), [global availability](https://stripe.com/global)
- Alternativas: [Mobbex planes](https://mobbex.com/planes), [dLocal Go](https://dlocalgo.com), [Rebill](https://www.rebill.com)
- Netflix AR: [impuestos Netflix 2026](https://www.cuentasdigitales.com.ar/ayuda/netflix-cuanto-son-los-impuestos-argentina), [CUIT Netflix Argentina](https://www.cuitonline.com/detalle/30716987112/netflix-servicios-de-transmision-argentina-s.r.l.html)
