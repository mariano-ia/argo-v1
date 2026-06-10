-- Analytical "Química de grupos" tool, SEPARATE from planteles (which live in the
-- `groups` table with slug + coaches + player attribution). A chem_group is a
-- personal grouping of a member's players to analyze chemistry/dynamics. No link.
create table if not exists public.chem_groups (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.tenants(id) on delete cascade,
  owner_member_id  uuid references public.tenant_members(id) on delete set null,
  name             text not null,
  created_at       timestamptz not null default now(),
  deleted_at       timestamptz
);
create index if not exists chem_groups_tenant_owner_idx on public.chem_groups(tenant_id, owner_member_id) where deleted_at is null;

create table if not exists public.chem_group_members (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.chem_groups(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  added_at   timestamptz not null default now()
);
create unique index if not exists chem_group_members_unique on public.chem_group_members(group_id, session_id);
create index if not exists chem_group_members_session_idx on public.chem_group_members(session_id);

alter table public.chem_groups enable row level security;
alter table public.chem_group_members enable row level security;
drop policy if exists "no_direct_client_access_chem_groups" on public.chem_groups;
create policy "no_direct_client_access_chem_groups" on public.chem_groups using (false) with check (false);
drop policy if exists "no_direct_client_access_chem_group_members" on public.chem_group_members;
create policy "no_direct_client_access_chem_group_members" on public.chem_group_members using (false) with check (false);
