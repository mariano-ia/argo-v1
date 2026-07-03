-- Tenant-level free ArgoPuente® flag. When enabled, every resolved (non-demo)
-- perfilamiento of this tenant grants the responsible adult a complimentary
-- ($0, provider='comp') puentes_purchase BEFORE the report email goes out, so
-- send-email shows the "included" copy + magic link instead of the $4.99 upsell.
-- Toggled from the superadmin dashboard (admin-tenants action toggle-free-puentes).
alter table public.tenants
    add column if not exists free_puentes boolean not null default false;
