# Cupones de descuento (checkout propio)

Estado: BUILT 2026-07-18, en `develop` (sin pushear salvo orden explícita). Stripe-only, USD, todos los mercados.

## Por qué
El campo de cupón nativo de Stripe (`allow_promotion_codes`) nunca estuvo habilitado, así que no aparecía en la pasarela (se percibía como "no funciona en Argentina", pero faltaba en todos los mercados). Decisión: poner el input de cupón en **nuestra** interfaz, con preview del descuento antes de redirigir a Stripe.

## Cómo funciona
1. El comprador escribe el código en el campo "¿Tienes un cupón de descuento?" (siempre visible) y toca **Aplicar**.
2. El front llama `POST /api/validate-coupon` → resuelve el código contra Stripe (`GET /v1/promotion_codes?code=...&active=true`) y devuelve el descuento **solo para preview** (precio tachado → nuevo total en pantalla y en el botón).
3. Al comprar, el front manda `coupon_code` al endpoint de checkout correspondiente.
4. El endpoint de checkout **re-resuelve** el código server-side (nunca confía en el cliente) y lo aplica con `discounts[0][promotion_code]` en la Checkout Session. Si el código dejó de ser válido → `400 { error: 'invalid_coupon' }` (la UI lo muestra y deja comprar sin cupón).
5. El webhook (`one-webhook.ts`) reconcilia el **monto real cobrado** (`session.amount_total`) en `amount_cents` de `one_purchases` / `puentes_purchases`, para que la base refleje lo pagado con descuento (antes guardaba siempre el precio de lista).

Nota Stripe: `discounts` y `allow_promotion_codes` son mutuamente excluyentes; usamos solo `discounts`.

**GOTCHA (arreglado en `e72feae`):** esta cuenta de Stripe devuelve el coupon bajo `promotion_code.promotion.coupon` (un **id string**), NO bajo `promotion_code.coupon` (objeto anidado). La primera versión leía `pc.coupon` → `null` → rechazaba TODOS los códigos como inválidos (FEDE50/FEDE100 rotos en prod). Fix: leer el id de `pc.promotion.coupon` (con fallback al legacy `pc.coupon`) y hacer `GET /v1/coupons/{id}` para verificar `valid` y obtener el % / monto off.

## Superficies cubiertas (todas las de pago único; suscripciones excluidas)
| Producto | Pantalla | Ruta | Endpoint |
|---|---|---|---|
| ArgoOne® $12.99 | ArgoOneLanding | `/one` | `one-checkout` |
| ArgoOne® $12.99 | OnePanel (comprar/actualizar) | `/one/panel` | `one-checkout` (vía modal) |
| ArgoOne® $12.99 | Desbloqueo demo | `/report/:id` | `unlock-checkout` |
| ArgoPuente® $4.99 | OnePanel (crear puente) | `/one/panel` | `puentes-checkout` (vía modal) |
| ArgoPuente® $4.99 | PuentesCheckout | `/puentes/checkout` | `puentes-checkout` |
| ArgoPuente® $4.99 | PuenteLink | `/puente/:token` | `puentes-checkout` |
| ArgoPuente® $4.99 | PuenteInvite | `/puente/invite/:token` | `puentes-checkout` |

- **Formularios** (input inline): ArgoOneLanding, PuentesCheckout, PuenteLink, PuenteInvite, y el desbloqueo demo (que además ahora muestra el precio, antes no lo mostraba).
- **Botones de un clic** (OnePanel): pasan por `CouponPurchaseModal` (confirmación con producto + cupón + total) porque redirigían directo a Stripe sin formulario.

## Componentes / archivos
- `api/validate-coupon.ts` — preview del descuento (rate-limited por IP, fail-open sin KV).
- `src/components/CouponField.tsx` — campo compartido (i18n es/en/pt, estados aplicado/error, preview en vivo).
- `src/components/CouponPurchaseModal.tsx` — modal reutilizable para superficies de un clic.
- Resolver inline `resolvePromotionCodeId()` duplicado en `one-checkout.ts`, `unlock-checkout.ts`, `puentes-checkout.ts` (los `api/*` de Vercel no pueden importarse entre sí; ver CLAUDE.md).
- Reconciliación de monto en `one-webhook.ts` (`handlePuentesPaid`, `handleReprofilePaid`, rama argo_one).

## Prerequisito del owner (una sola vez, en Stripe Dashboard)
1. **Products → Coupons → New**: definir el descuento (percent off, o **amount off en USD**).
2. En el cupón, **Add promotion code**: el string que escribe el cliente (ej. `ARGO20`).
3. **NO** usar restricción por producto (`applies_to.products`): nuestros checkouts usan `price_data` ad-hoc sin Stripe Product id, así que un cupón restringido por producto nunca matchea. Cupones a nivel orden (percent/amount off) funcionan en todas las superficies.
   - Restricciones que sí funcionan: fecha de vencimiento, máximo de canjes, monto mínimo (el preview avisa si no se alcanza).

## Pendiente / no incluido
- Suscripciones (`create-subscription.ts`, PRO/Academy): fuera de alcance por decisión (el cupón recurrente en Stripe se comporta distinto: once / repeating / forever).
- Test end-to-end con un promotion code de Stripe test → hacerlo en `develop` tras el deploy.
