-- ─── Etapa 1: Institution onboarding ─────────────────────────────────────────

-- 1. Extend tenants with institution profile fields
ALTER TABLE public.tenants
    ADD COLUMN IF NOT EXISTS institution_type  text,
    ADD COLUMN IF NOT EXISTS sport             text,
    ADD COLUMN IF NOT EXISTS country           text,
    ADD COLUMN IF NOT EXISTS city              text,
    ADD COLUMN IF NOT EXISTS logo_url          text,
    ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- 2. Extend tenant_members with owner profile fields
--    (used for the owner at onboarding; members inherit institution context)
ALTER TABLE public.tenant_members
    ADD COLUMN IF NOT EXISTS full_name           text,
    ADD COLUMN IF NOT EXISTS role_in_institution text;

-- 3. Storage bucket for institution logos (public read, authenticated write via service role)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'institution-logos',
    'institution-logos',
    true,
    2097152,           -- 2 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Public read policy (anyone can view logos)
CREATE POLICY "Public read institution logos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'institution-logos');

-- Authenticated upload policy (service role bypasses this, but good to have)
CREATE POLICY "Authenticated upload institution logos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'institution-logos');

-- Allow replacing existing logo
CREATE POLICY "Authenticated update institution logos"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'institution-logos');
