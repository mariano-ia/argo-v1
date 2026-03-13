import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

function generateSlug(name: string): string {
    const base = name
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 30);
    const suffix = Math.random().toString(36).slice(2, 8);
    return `${base}-${suffix}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;

    if (!serviceKey || !supabaseUrl) {
        console.error('[create-tenant] Missing env vars');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const sb = createClient(supabaseUrl, serviceKey);

    try {
        const { auth_user_id, email, display_name } = req.body;

        if (!auth_user_id || !email || !display_name) {
            return res.status(400).json({ error: 'Missing required fields: auth_user_id, email, display_name' });
        }

        // Check if tenant already exists for this auth user
        const { data: existing } = await sb
            .from('tenants')
            .select('id, slug')
            .eq('auth_user_id', auth_user_id)
            .single();

        if (existing) {
            return res.status(200).json({ ok: true, tenant: existing, existing: true });
        }

        // Create new tenant with unique slug
        const slug = generateSlug(display_name);

        const { data: tenant, error } = await sb
            .from('tenants')
            .insert({
                auth_user_id,
                email,
                display_name,
                slug,
                plan: 'trial',
                credits_remaining: 3,
            })
            .select('id, slug')
            .single();

        if (error) {
            // Slug collision — retry with different suffix
            if (error.code === '23505' && error.message.includes('slug')) {
                const retrySlug = generateSlug(display_name);
                const { data: retryTenant, error: retryError } = await sb
                    .from('tenants')
                    .insert({
                        auth_user_id,
                        email,
                        display_name,
                        slug: retrySlug,
                        plan: 'trial',
                        credits_remaining: 3,
                    })
                    .select('id, slug')
                    .single();

                if (retryError) {
                    console.error('[create-tenant] Retry insert error:', retryError.message);
                    return res.status(500).json({ error: retryError.message });
                }
                return res.status(200).json({ ok: true, tenant: retryTenant, existing: false });
            }

            console.error('[create-tenant] Insert error:', error.message);
            return res.status(500).json({ error: error.message });
        }

        return res.status(200).json({ ok: true, tenant, existing: false });
    } catch (err) {
        console.error('[create-tenant] Unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
