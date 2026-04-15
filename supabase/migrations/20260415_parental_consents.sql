-- Parental Consent (VPC) — COPPA compliance foundation
-- Creates the parental_consents table that holds pending and confirmed
-- verification tokens issued via email-plus flow for children under 13.

create table if not exists parental_consents (
  id              uuid primary key default gen_random_uuid(),
  token           text unique not null,

  -- Adult data (retained for COPPA audit trail)
  adult_name      text not null,
  adult_email     text not null,

  -- Child data (minimum needed to create the session once confirmed)
  child_name      text not null,
  child_age       integer not null check (child_age >= 8 and child_age <= 16),
  sport           text,

  -- Flow context (one of the three onboarding entry points)
  flow_type       text not null check (flow_type in ('auth', 'tenant', 'one')),
  tenant_id       uuid references tenants(id),
  one_link_id     uuid references one_links(id),
  lang            text not null default 'es' check (lang in ('es', 'en', 'pt')),

  -- Verification state
  status          text not null default 'pending'
                    check (status in ('pending', 'confirmed', 'expired')),
  confirmed_at    timestamptz,
  confirmed_ip    text,
  confirmed_user_agent text,

  -- TTL
  created_at      timestamptz not null default now(),
  expires_at      timestamptz not null,

  -- Single-use enforcement: once the session is created, this token is burned.
  session_id      uuid references sessions(id),
  consumed_at     timestamptz
);

create index if not exists parental_consents_token_idx
  on parental_consents(token);

create index if not exists parental_consents_expires_idx
  on parental_consents(expires_at)
  where status = 'pending';

-- No RLS policies needed: all access flows through /api/* endpoints
-- using SUPABASE_SERVICE_ROLE_KEY (same pattern as the sessions table).
alter table parental_consents enable row level security;
