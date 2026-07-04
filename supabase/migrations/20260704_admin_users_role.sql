-- Co-admin support: per-admin role on admin_users.
-- 'superadmin' = full panel (default, preserves existing admins).
-- 'limited'    = only Sesiones, Tenants, Consumo IA, Contactos, Blog.
-- Applied to prod (luutdozbhinfiogugjbv) via MCP on 2026-07-04.
ALTER TABLE public.admin_users
    ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'superadmin'
    CHECK (role IN ('superadmin', 'limited'));

NOTIFY pgrst, 'reload schema';
