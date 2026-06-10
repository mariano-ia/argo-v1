-- Argo Coach history is personal: attribute each chat message to the member who
-- wrote it, so a newly invited coach doesn't see the institution's existing
-- conversations. Additive; production main ignores the new column.
alter table public.chat_messages add column if not exists member_id uuid references public.tenant_members(id) on delete set null;
create index if not exists chat_messages_member_idx on public.chat_messages(member_id);

-- Backfill existing conversations to each tenant's owner (created when the owner
-- was the only user). Newly invited coaches then start with an empty history.
update public.chat_messages cm
set member_id = (
  select tm.id from public.tenant_members tm
  where tm.tenant_id = cm.tenant_id and tm.role = 'owner'
  order by tm.created_at asc limit 1
)
where cm.member_id is null and cm.tenant_id is not null;
