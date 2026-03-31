-- ============================================================================
-- Migration: Argo One — standalone parent purchase flow
-- Date: 2026-03-31
-- Description: Tables for one-time profile purchases (no tenant, no dashboard).
--              Supports packs of 1, 3, or 5 profiles with magic-link panel access.
-- ============================================================================

BEGIN;

-- ── 1. Purchases table ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS one_purchases (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email           text NOT NULL,
    pack_size       integer NOT NULL CHECK (pack_size IN (1, 3, 5)),
    amount_cents    integer NOT NULL,
    currency        text NOT NULL DEFAULT 'usd',
    payment_provider text NOT NULL CHECK (payment_provider IN ('stripe', 'mercadopago')),
    payment_id      text,                          -- Stripe session_id or MP preference_id
    payment_status  text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    access_token    text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),  -- magic link token
    created_at      timestamptz NOT NULL DEFAULT now(),
    paid_at         timestamptz
);

CREATE INDEX IF NOT EXISTS idx_one_purchases_email ON one_purchases (email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_purchases_payment ON one_purchases (payment_provider, payment_id) WHERE payment_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_purchases_token ON one_purchases (access_token);

COMMENT ON TABLE one_purchases IS 'Argo One: one-time profile pack purchases by parents (no tenant)';
COMMENT ON COLUMN one_purchases.access_token IS 'Random 64-hex token for magic-link panel access';

-- ── 2. Links table ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS one_links (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id     uuid NOT NULL REFERENCES one_purchases(id) ON DELETE CASCADE,
    slug            text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),  -- 12 hex chars
    status          text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'sent', 'pending', 'completed')),
    recipient_email text,                          -- email of the responsible adult (may differ from buyer)
    child_name      text,                          -- optional, set when link is generated
    session_id      uuid,                          -- FK to sessions table once odyssey is completed
    created_at      timestamptz NOT NULL DEFAULT now(),
    sent_at         timestamptz,
    completed_at    timestamptz
);

CREATE INDEX IF NOT EXISTS idx_one_links_purchase ON one_links (purchase_id);
CREATE INDEX IF NOT EXISTS idx_one_links_slug ON one_links (slug);

COMMENT ON TABLE one_links IS 'Individual play links within an Argo One purchase (1 link per profile slot)';

-- ── 3. RLS policies ─────────────────────────────────────────────────────────

ALTER TABLE one_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE one_links ENABLE ROW LEVEL SECURITY;

-- Service role has full access (API endpoints use service key)
CREATE POLICY "service_full_access_one_purchases" ON one_purchases
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "service_full_access_one_links" ON one_links
    FOR ALL USING (true) WITH CHECK (true);

COMMIT;
