-- One bridge session per (purchase, source perfilamiento).
-- Dedups the single legacy duplicate (keeps the delivered row: status 'sent'
-- first, then has-ai, then newest) and adds the unique index that makes every
-- session-mint path idempotent: webhook retries, the puentes-start self-heal
-- race, send-email's ensure branch and the cron can all insert blindly and
-- lose gracefully (23505) instead of duplicating bridges.
with ranked as (
  select id, row_number() over (
    partition by purchase_id, source_session_id
    order by (status = 'sent') desc, (ai_sections is not null) desc, created_at desc
  ) rn
  from puentes_sessions
)
delete from puentes_sessions s
using ranked r
where s.id = r.id and r.rn > 1;

create unique index if not exists puentes_sessions_purchase_source_uidx
  on puentes_sessions (purchase_id, source_session_id);
