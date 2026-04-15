-- Parental data deletion requests (COPPA §312.10 self-service flow)
-- Lets an adult request hard-deletion of their child's data via an
-- email-verification flow similar to the VPC flow in parental_consents.

create table if not exists deletion_requests (
  id              uuid primary key default gen_random_uuid(),
  token           text unique not null,

  -- Who is requesting the delete (must be the adult_email on the sessions)
  adult_email     text not null,
  -- Optional child name filter. When null, deletes ALL sessions matching the email.
  child_name      text,

  -- Verification state
  status          text not null default 'pending'
                    check (status in ('pending', 'confirmed', 'expired', 'completed')),
  confirmed_at    timestamptz,
  confirmed_ip    text,
  confirmed_user_agent text,

  -- Result of the deletion (set when status transitions to 'completed')
  deleted_count   integer,
  completed_at    timestamptz,

  -- TTL: 1h to keep the window tight for a destructive action
  created_at      timestamptz not null default now(),
  expires_at      timestamptz not null
);

create index if not exists deletion_requests_token_idx
  on deletion_requests(token);

create index if not exists deletion_requests_email_idx
  on deletion_requests(adult_email);

alter table deletion_requests enable row level security;
-- No RLS policies: all access via /api/* with SUPABASE_SERVICE_ROLE_KEY,
-- same pattern as parental_consents and sessions.
