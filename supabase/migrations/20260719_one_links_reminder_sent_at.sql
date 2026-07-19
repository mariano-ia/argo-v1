-- ArgoOne® abandoned-link reminder (#3): stamp when the buyer was nudged that a
-- play started but never finished, so report-recovery-cron sends the reminder at
-- most once per link. NULL = not yet reminded.
alter table public.one_links add column if not exists reminder_sent_at timestamptz;

notify pgrst, 'reload schema';
