# Payments Readiness (pre-launch) — 2026-06-22

Deep audit of every payment rail before commercializing Argo, with end-to-end
test evidence. Covers the two go-to-market questions: (1) can we onboard users
and hand them a buy link, and (2) can users self-serve sign up and pay, in both
**Argentina** and **US**.

## Rails as built

| Flow | Endpoint | US | Latam/AR |
|------|----------|----|----|
| Argo One (parent, one-time) | `one-checkout` → `one-webhook` | Stripe USD | MercadoPago ARS (fixed prices) |
| Subscription (PRO/Academy) | `create-subscription` → `one-webhook` | Stripe USD recurring | MercadoPago ARS preapproval |
| Argo Puentes (one-time) | `puentes-checkout` → `one-webhook` | Stripe USD | MercadoPago ARS |

Provider routing: `MP_COUNTRIES = AR, MX, BR, CO, CL, UY, PE` → MercadoPago; all
others → Stripe. Country source: tenant.country > `x-vercel-ip-country` > `US`.

## Infra status (verified against live APIs)

- **Stripe**: account country US, USD, `charges_enabled` + `payouts_enabled` =
  true, `sk_live`. Two enabled live webhook endpoints → `www.argomethod.com/api/one-webhook`.
- **MercadoPago**: real AR seller (site MLA), `APP_USR` (production), site active.
- All four payment env vars present in prod + preview (`STRIPE_SECRET_KEY`,
  `STRIPE_WEBHOOK_SECRET`, `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`).

## The bug we found and fixed (2026-06-22)

**MercadoPago never confirmed a single payment.** In prod: 16 ARS purchases
`pending`, 0 `paid`, while Stripe converted (3 paid). Root cause: no endpoint set
`notification_url`, so MP confirmation depended entirely on a webhook configured
in the MP dashboard — which was never wired. Buyers could pay and receive nothing.

Fix (on `develop`, commit `85f6adf`):
1. `one-checkout` MP preference + `create-subscription` MP preapproval now set
   `notification_url` → MP notifies us directly, independent of dashboard config.
2. `one-webhook` MP signature handling: reject only when a signature is **present
   but invalid** (blocks tampering of v2 deliveries); accept unsigned IPN
   deliveries (which `notification_url` uses) and rely on the **authoritative
   re-fetch** of the payment/preapproval from MP's API as the real fraud gate —
   a forged "approved" cannot exist in our seller account.

## AR launch without AFIP — `AR_VIA_STRIPE` toggle

Selling to AR via the **US Stripe account in USD** means the sale is made (at the
entity level) by the US entity → **no AFIP factura to the customer**. New env
toggle `AR_VIA_STRIPE=true` routes Argentine buyers to Stripe USD instead of
MercadoPago, in both `one-checkout` and `create-subscription`. Default (unset)
keeps MP routing. Set on **Preview (develop)** for testing; **not set in
production** (prod AR still → MP) pending a launch decision.

> **Tax landscape corrected (2026-06-23).** An earlier version of this section
> said the AR buyer pays "oficial + ~60% país/perception taxes". That figure was
> stale (the old PAÍS + Ganancias scheme). The **Impuesto PAÍS expired Dec 2024**
> and the parallel "blue" rate converged with the official after the cepo was
> lifted, so the realistic AR card surcharge in 2026 is **near the dólar oficial**
> (estimate at oficial, not +30/60%). Argo is **not** on AFIP's Anexo II of
> foreign digital-service providers, so AR buyers most likely do **not** get the
> 21% IVA percepción that Netflix's customers pay (verify with real charges).
> "Only US taxes" is true only at the **entity** level — an Argentine-resident
> founder still owes AR tax on income drawn from the US entity. Full analysis,
> alternatives matrix, Stripe per-transaction costs, and the recommended phased
> plan: **`docs/PAGOS-ARGENTINA-ESTRATEGIA.md`**.

## End-to-end test evidence (13/13 on preview deployment)

Server side fully proven by driving real signed webhooks against a live deploy
(the only unautomatable leg is a human tapping a card on the hosted page in live
mode):

- **Stripe one-time**: checkout created → signed `checkout.session.completed` →
  `one_purchases` flips `paid` → idempotency blocks event-id replay → bad
  signature rejected (400).
- **Stripe subscription**: signed event → tenant upgraded to `pro` (roster 50,
  provider `stripe`).
- **MercadoPago**: preference carries `notification_url` pointing at the
  deployment; unsigned IPN passes the signature wall and runs the authoritative
  re-fetch; invalid-but-present signature rejected (401).
- **AR_VIA_STRIPE**: AR buyer routed to Stripe USD (`checkout.stripe.com`).

## Answers to the GTM questions

1. **Onboard + hand a buy link?** Yes for Argo One (a shareable link, pays
   self-serve). Subscriptions have no standalone payment link — buyer signs up
   then pays one-click in the dashboard. Enterprise = admin grant + welcome
   email, billed offline (no online charge).
2. **Self-serve sign up + pay?** Yes, both circuits are wired (parents via Argo
   One landing; clubs via signup → trial → dashboard pricing → upgrade).

## What still needs a human / a decision

- **Deploy to prod**: the MP fix + toggle live on `develop` only. AR MercadoPago
  stays broken in production until `develop` → `main` is approved.
- **One real money-in test per rail in live mode**: a single low-value real
  purchase (card on hosted page) closes the last leg the harness can't drive.
- **Launch routing decision for AR**: Stripe-USD-no-AFIP (cheaper to ship, worse
  AR conversion) vs MercadoPago-ARS (better conversion, requires formal AR seller
  + AFIP invoicing later).
- **MP account hygiene**: the MP account mixes unrelated personal activity;
  consider a dedicated application/account before scaling AR.
- **MP subscription ARS amount** is frozen at the dólar-oficial rate at signup —
  an inflation leak on recurring AR plans (one-time ARS packs are unaffected).
