-- ═══════════════════════════════════════════════════════════════════════════
-- Argo Security Migration
-- Run this in Supabase SQL Editor (Dashboard → SQL)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Credit transactions table (idempotency for Stripe webhooks) ──────

CREATE TABLE IF NOT EXISTS credit_transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    credits integer NOT NULL,
    pack_id text,
    stripe_event_id text UNIQUE, -- prevents duplicate webhook processing
    type text NOT NULL DEFAULT 'purchase', -- 'purchase', 'trial', 'deduction', 'refund'
    created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_credit_transactions_tenant ON credit_transactions(tenant_id, created_at DESC);
CREATE UNIQUE INDEX idx_credit_transactions_stripe_event ON credit_transactions(stripe_event_id) WHERE stripe_event_id IS NOT NULL;

-- ── 2. Database indexes for tenant queries ──────────────────────────────

-- Sessions: tenant dashboard queries
CREATE INDEX IF NOT EXISTS idx_sessions_tenant_created
    ON sessions(tenant_id, created_at DESC)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_sessions_tenant_eje
    ON sessions(tenant_id, eje)
    WHERE deleted_at IS NULL AND eje != '_pending';

-- Chat messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_tenant_thread
    ON chat_messages(tenant_id, thread_id, created_at ASC);

-- Groups
CREATE INDEX IF NOT EXISTS idx_groups_tenant
    ON groups(tenant_id, created_at DESC)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_group_members_group
    ON group_members(group_id, created_at DESC);

-- Tenants
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_auth_user ON tenants(auth_user_id);

-- Feedback
CREATE INDEX IF NOT EXISTS idx_feedback_session ON feedback(session_id);

-- ── 3. Atomic credit deduction (prevents race conditions) ───────────────

CREATE OR REPLACE FUNCTION deduct_credit(tenant_slug text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tenant_id uuid;
    v_tenant_name text;
    v_remaining integer;
BEGIN
    -- Atomic: SELECT FOR UPDATE locks the row until transaction commits
    SELECT id, display_name, credits_remaining
    INTO v_tenant_id, v_tenant_name, v_remaining
    FROM tenants
    WHERE slug = tenant_slug
    FOR UPDATE;

    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'not found';
    END IF;

    IF v_remaining <= 0 THEN
        RAISE EXCEPTION 'no credits';
    END IF;

    -- Deduct
    UPDATE tenants
    SET credits_remaining = credits_remaining - 1
    WHERE id = v_tenant_id;

    -- Log transaction
    INSERT INTO credit_transactions (tenant_id, credits, type)
    VALUES (v_tenant_id, -1, 'deduction');

    RETURN json_build_object(
        'tenant_id', v_tenant_id,
        'tenant_name', v_tenant_name,
        'credits_remaining', v_remaining - 1
    );
END;
$$;

-- ── 4. Atomic credit addition (prevents duplicate webhook credits) ──────

CREATE OR REPLACE FUNCTION add_credits(
    p_tenant_id uuid,
    p_credits integer,
    p_stripe_event_id text,
    p_pack_id text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_credits integer;
BEGIN
    -- Check idempotency
    IF EXISTS (SELECT 1 FROM credit_transactions WHERE stripe_event_id = p_stripe_event_id) THEN
        RAISE EXCEPTION 'duplicate event';
    END IF;

    -- Atomic increment
    UPDATE tenants
    SET credits_remaining = credits_remaining + p_credits
    WHERE id = p_tenant_id
    RETURNING credits_remaining INTO v_new_credits;

    IF v_new_credits IS NULL THEN
        RAISE EXCEPTION 'tenant not found';
    END IF;

    -- Log transaction
    INSERT INTO credit_transactions (tenant_id, credits, pack_id, stripe_event_id, type)
    VALUES (p_tenant_id, p_credits, p_pack_id, p_stripe_event_id, 'purchase');

    RETURN json_build_object('new_credits', v_new_credits);
END;
$$;
