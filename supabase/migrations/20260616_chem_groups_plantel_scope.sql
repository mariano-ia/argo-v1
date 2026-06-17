-- Tie each "Química de grupos" group to the plantel it belongs to, so chem
-- analysis stays within a single category (e.g. U12 vs U14 are not comparable).
-- Nullable for back-compat: legacy groups keep plantel_id = null.
alter table public.chem_groups
  add column if not exists plantel_id uuid references public.groups(id) on delete set null;

create index if not exists chem_groups_plantel_idx on public.chem_groups(plantel_id);
