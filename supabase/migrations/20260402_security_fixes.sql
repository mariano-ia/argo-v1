-- Security fixes for production readiness
BEGIN;

-- Share token for report URL protection (prevents UUID brute-force)
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS share_token text;

-- Backfill existing sessions with random tokens
UPDATE sessions SET share_token = encode(gen_random_bytes(16), 'hex')
WHERE share_token IS NULL;

-- Email sent tracking for idempotency
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS email_sent_at timestamptz;

-- RLS policies for tenant isolation (defense-in-depth)

-- chat_messages: tenant can only see their own
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tenant_read_chat' AND tablename = 'chat_messages') THEN
    CREATE POLICY "tenant_read_chat" ON chat_messages
      FOR SELECT TO authenticated
      USING (tenant_id IN (SELECT id FROM tenants WHERE auth_user_id = auth.uid()));
  END IF;
END $$;

-- groups: tenant can only see their own
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tenant_read_groups' AND tablename = 'groups') THEN
    CREATE POLICY "tenant_read_groups" ON groups
      FOR SELECT TO authenticated
      USING (tenant_id IN (SELECT id FROM tenants WHERE auth_user_id = auth.uid()));
  END IF;
END $$;

-- feedback: tenant can only see feedback on their sessions
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tenant_read_feedback' AND tablename = 'feedback') THEN
    CREATE POLICY "tenant_read_feedback" ON feedback
      FOR SELECT TO authenticated
      USING (session_id IN (
        SELECT id FROM sessions WHERE tenant_id IN (
          SELECT id FROM tenants WHERE auth_user_id = auth.uid()
        )
      ));
  END IF;
END $$;

-- Unique constraint on tenants.auth_user_id (prevents duplicate tenants)
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_auth_user_id ON tenants (auth_user_id);

COMMIT;
