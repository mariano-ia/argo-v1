-- Per-plantel sport (multi-sport institutions). Additive, forward-only.
-- The plantel's sport becomes the source of truth for plays entering through
-- its team link; tenants.sport remains only as a legacy account-level fallback
-- (general /play/:slug link, pre-existing planteles before backfill).
-- Sport is REQUIRED on plantel creation from this point on (enforced in
-- api/tenant-groups.ts create action + TenantGroups UI).

alter table public.groups add column if not exists sport text;

-- Backfill existing planteles from their institution's sport so every
-- current plantel keeps the sport its players were profiled under.
update public.groups g
set sport = t.sport
from public.tenants t
where g.tenant_id = t.id
  and g.sport is null
  and t.sport is not null;

-- PostgREST must reload its schema cache or selects on the new column 500.
notify pgrst, 'reload schema';
