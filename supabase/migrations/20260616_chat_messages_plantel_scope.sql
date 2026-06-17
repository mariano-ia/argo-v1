-- Scope Argo Coach chat history per plantel: a Sub-12 conversation should not
-- mix with Sub-14. Nullable = admin-level (Administración hat) / legacy chats.
alter table public.chat_messages
  add column if not exists plantel_id uuid references public.groups(id) on delete set null;

create index if not exists chat_messages_plantel_idx on public.chat_messages(plantel_id);
