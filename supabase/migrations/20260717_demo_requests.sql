-- ArgoAcademy® "Solicitar demo" lead form.
-- Replaces the old mailto: a lightweight qualification lead captured from the
-- static home (public/sales/argo-home.html) and written via the service role
-- through /api/demo-request. RLS on, no public policies (service role bypasses).

create table if not exists public.demo_requests (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  -- required fields
  name        text not null,
  email       text not null,
  institution text not null,
  whatsapp    text not null,
  country     text not null,
  consent     boolean not null default false,
  -- optional fields
  sport       text,
  team_size   text,
  -- provenance / triage
  source      text not null default 'home',
  lang        text not null default 'es',
  status      text not null default 'new',
  user_agent  text,
  referrer    text
);

alter table public.demo_requests enable row level security;

create index if not exists idx_demo_requests_created_at
  on public.demo_requests (created_at desc);

create index if not exists idx_demo_requests_status
  on public.demo_requests (status);
