-- Add subscription tracking fields to tenants
-- Stores the payment provider and subscription ID for cancellation/management

ALTER TABLE tenants
    ADD COLUMN IF NOT EXISTS subscription_provider TEXT,      -- 'stripe' | 'mercadopago' | NULL
    ADD COLUMN IF NOT EXISTS subscription_id TEXT;             -- Stripe subscription ID or MP preapproval ID

COMMENT ON COLUMN tenants.subscription_provider IS 'Payment provider for active subscription (stripe or mercadopago)';
COMMENT ON COLUMN tenants.subscription_id IS 'External subscription ID (Stripe sub_xxx or MP preapproval UUID)';
