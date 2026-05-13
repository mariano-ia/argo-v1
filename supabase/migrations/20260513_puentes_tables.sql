-- Argo Puentes — upsell flow that gives the responsible adult a parallel
-- DISC-based questionnaire and a personalized "bond report" with 4 bridges
-- connecting their profile to the child's.
--
-- Two new tables linked to the child's session that originated the upsell.

create table if not exists public.puentes_purchases (
    id uuid primary key default gen_random_uuid(),
    source_session_id uuid not null references public.sessions(id) on delete cascade,
    recipient_email text not null,
    recipient_name text,
    child_name text,
    amount_cents int not null,
    currency text not null check (currency in ('USD', 'ARS')),
    provider text not null check (provider in ('stripe', 'mercadopago')),
    provider_payment_id text,
    status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded')),
    magic_token text not null unique,
    lang text not null default 'es' check (lang in ('es', 'en', 'pt')),
    source text not null default 'argo_one' check (source in ('argo_one', 'tenant')),
    tenant_id uuid references public.tenants(id) on delete set null,
    created_at timestamptz not null default now(),
    paid_at timestamptz
);

create index if not exists idx_puentes_purchases_source_session on public.puentes_purchases(source_session_id);
create index if not exists idx_puentes_purchases_email on public.puentes_purchases(recipient_email);
create index if not exists idx_puentes_purchases_magic_token on public.puentes_purchases(magic_token);
create index if not exists idx_puentes_purchases_status on public.puentes_purchases(status);

create table if not exists public.puentes_sessions (
    id uuid primary key default gen_random_uuid(),
    purchase_id uuid not null references public.puentes_purchases(id) on delete cascade,
    source_session_id uuid not null references public.sessions(id) on delete cascade,
    adult_answers jsonb not null default '[]'::jsonb,
    adult_profile jsonb,
    ai_sections jsonb,
    status text not null default 'created' check (status in ('created', 'answered', 'generating', 'generated', 'sent', 'failed')),
    lang text not null default 'es' check (lang in ('es', 'en', 'pt')),
    error_log text,
    created_at timestamptz not null default now(),
    completed_at timestamptz,
    sent_at timestamptz
);

create index if not exists idx_puentes_sessions_purchase on public.puentes_sessions(purchase_id);
create index if not exists idx_puentes_sessions_source_session on public.puentes_sessions(source_session_id);
create index if not exists idx_puentes_sessions_status on public.puentes_sessions(status);

-- Track which child sessions already received the +3 day reminder for Argo Puentes
alter table public.sessions
    add column if not exists puentes_reminder_sent_at timestamptz;
