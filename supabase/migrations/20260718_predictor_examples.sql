-- Predictor Conductual: per-child AI example cache.
-- One row per (child, situation, lang) for the CURRENT perfilamiento; a
-- re-profile changes perfilamiento_id so the cache misses naturally and the
-- example regenerates against the new profile. Content stores the {{P}} name
-- placeholder, never the child's name (no name PII at rest here).
create table if not exists public.predictor_examples (
    id uuid primary key default gen_random_uuid(),
    child_id uuid not null references public.children(id) on delete cascade,
    perfilamiento_id uuid not null references public.perfilamientos(id) on delete cascade,
    tenant_id uuid not null references public.tenants(id) on delete cascade,
    situation_id text not null,
    lang text not null default 'es',
    content jsonb not null,
    model text,
    created_at timestamptz not null default now()
);

create unique index if not exists predictor_examples_key
    on public.predictor_examples (child_id, situation_id, lang);

create index if not exists predictor_examples_tenant
    on public.predictor_examples (tenant_id);

-- Service-role only (all reads/writes go through /api/predictor-example).
alter table public.predictor_examples enable row level security;
