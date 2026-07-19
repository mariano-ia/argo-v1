-- Per-adult archive of panel children (a coach with many bridges can hide the
-- ones they no longer follow). Per-email and isolated: archiving never affects
-- another adult's view of the same child. No PII beyond the email already held.
create table if not exists panel_archived (
  id uuid primary key default gen_random_uuid(),
  adult_email text not null,
  child_id uuid not null,
  archived_at timestamptz not null default now(),
  unique (adult_email, child_id)
);
create index if not exists panel_archived_email_idx on panel_archived (lower(adult_email));
