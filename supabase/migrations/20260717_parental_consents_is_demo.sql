-- Distinguish free-demo consents from the login-gated /app auth flow.
--
-- Both the free demo (/demo) and the legacy standalone user app (/app) issue
-- parental consents with flow_type='auth' (neither has a tenant_id nor a
-- one_link_id). When the adult clicks the email confirmation link, the consent
-- landing redirects flow_type='auth' to /app, which requires a Supabase login
-- the demo player never has, so it shows the login wall instead of resuming the
-- game. This flag lets the landing send demo consents back to /demo instead.
alter table parental_consents
  add column if not exists is_demo boolean not null default false;
