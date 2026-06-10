-- Club -> Teams -> Coaches + Players hierarchy.
-- "Teams" reuse the existing `groups`/`group_members` tables (table names kept for
-- backward-compat with production `main`). Players belong to teams via group_members
-- (M:N, so a player can be shared across teams). A coach is a tenant_members row
-- assigned to one or more teams via group_coaches. Additive only.

-- 1) Per-team play link slug on groups (teams).
alter table public.groups add column if not exists slug text;
update public.groups set slug = encode(gen_random_bytes(6), 'hex') where slug is null;
alter table public.groups alter column slug set default encode(gen_random_bytes(6), 'hex');
create unique index if not exists groups_slug_idx on public.groups(slug);
alter table public.groups alter column slug set not null;

-- 2) Coach <-> team assignment (M:N). A coach is a tenant_members row.
create table if not exists public.group_coaches (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.groups(id) on delete cascade,
  member_id  uuid not null references public.tenant_members(id) on delete cascade,
  created_at timestamptz not null default now()
);
create unique index if not exists group_coaches_group_member_idx on public.group_coaches(group_id, member_id);
create index if not exists group_coaches_member_idx on public.group_coaches(member_id);
alter table public.group_coaches enable row level security;
drop policy if exists "no_direct_client_access_group_coaches" on public.group_coaches;
create policy "no_direct_client_access_group_coaches" on public.group_coaches using (false) with check (false);

-- 3) Add 'coach' role.
alter table public.tenant_members drop constraint if exists tenant_members_role_check;
alter table public.tenant_members add constraint tenant_members_role_check check (role in ('owner', 'member', 'coach'));

-- 4) Backfill: default "General" team for tenants that have ungrouped active players,
--    then attach those orphan sessions to it. (All current tenants are test data.)
insert into public.groups (tenant_id, name)
select distinct s.tenant_id, 'General'
from public.sessions s
where s.tenant_id is not null and s.deleted_at is null and s.archived_at is null
  and not exists (select 1 from public.group_members gm where gm.session_id = s.id)
  and not exists (select 1 from public.groups g where g.tenant_id = s.tenant_id and g.name = 'General' and g.deleted_at is null);

insert into public.group_members (group_id, session_id)
select g.id, s.id
from public.sessions s
join public.groups g on g.tenant_id = s.tenant_id and g.name = 'General' and g.deleted_at is null
where s.tenant_id is not null and s.deleted_at is null and s.archived_at is null
  and not exists (select 1 from public.group_members gm where gm.session_id = s.id)
on conflict (group_id, session_id) do nothing;
