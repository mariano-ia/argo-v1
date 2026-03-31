-- ============================================================================
-- Migration: Audit log for superadmin actions
-- Date: 2026-03-31
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS admin_audit_log (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_email text NOT NULL,
    action      text NOT NULL,
    target_type text,           -- 'tenant', 'session', 'subscription', etc.
    target_id   text,           -- ID of the affected entity
    details     jsonb,          -- Additional context
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_created ON admin_audit_log (created_at DESC);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_full_access_audit" ON admin_audit_log FOR ALL USING (true) WITH CHECK (true);

COMMIT;
