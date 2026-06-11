-- Add per-plantel attribution to AI chat telemetry so coach quality signals
-- (groundtruth/label violations, prohibited hits) can be drilled down per plantel.
-- For coach-sourced events this stores the group ids the coach was scoped to;
-- null for owner/admin (unscoped). Applied to prod via MCP 2026-06-10.
ALTER TABLE ai_events ADD COLUMN IF NOT EXISTS group_ids text[];

COMMENT ON COLUMN ai_events.group_ids IS 'For coach-sourced events: the plantel (group) ids the coach was scoped to, so chat quality telemetry can be drilled down per plantel. Null for owner/admin (unscoped).';
