-- tenant_members: maps auth users to tenants (owner + invited members)
-- Run this migration in Supabase SQL editor before deploying the invite feature.

CREATE TABLE IF NOT EXISTS public.tenant_members (
    id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id    uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    auth_user_id uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
    email        text        NOT NULL,
    role         text        NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
    status       text        NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active')),
    invited_at   timestamptz NOT NULL DEFAULT now(),
    created_at   timestamptz NOT NULL DEFAULT now()
);

-- One member per email per tenant (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS tenant_members_tenant_email_idx
    ON public.tenant_members (tenant_id, lower(email));

-- Fast lookup by auth_user_id
CREATE INDEX IF NOT EXISTS tenant_members_auth_user_id_idx
    ON public.tenant_members (auth_user_id);

-- Migrate existing tenant owners into the new table
INSERT INTO public.tenant_members (tenant_id, auth_user_id, email, role, status)
SELECT id, auth_user_id, email, 'owner', 'active'
FROM public.tenants
WHERE auth_user_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- RLS: all access goes through the API with service_role key
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No direct client access" ON public.tenant_members USING (false);
