-- Webhook idempotency ledger.
-- Stripe (and MercadoPago) retry-deliver the same event multiple times. We
-- record each processed event id here and skip duplicates in /api/one-webhook,
-- so a retried "subscription upgraded" / "payment" event can't be applied twice
-- (e.g. duplicate plan changes or duplicate confirmation emails).
--
-- The webhook code fails OPEN if this table is missing, so applying this
-- migration simply turns idempotency ON — it does not change existing rows.

CREATE TABLE IF NOT EXISTS webhook_events (
    event_id     text PRIMARY KEY,
    provider     text NOT NULL,              -- 'stripe' | 'mercadopago'
    processed_at timestamptz NOT NULL DEFAULT now()
);

-- Housekeeping helper: events older than 90 days can be pruned safely
-- (Stripe never retries beyond ~3 days). Optional, run manually or via cron.
CREATE INDEX IF NOT EXISTS webhook_events_processed_at_idx
    ON webhook_events (processed_at);

-- RLS: this table is only ever touched by the service-role webhook endpoint.
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
-- No policies = no access for anon/authenticated clients (service role bypasses RLS).
