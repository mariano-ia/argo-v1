import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;

    if (!serviceKey || !supabaseUrl) {
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const sb = createClient(supabaseUrl, serviceKey);

    // Verify caller is an admin
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing auth token' });
    }

    const { data: { user }, error: authError } = await sb.auth.getUser(
        authHeader.replace('Bearer ', '')
    );
    if (authError || !user?.email) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    const { data: callerAdmin } = await sb
        .from('admin_users')
        .select('id')
        .eq('email', user.email)
        .maybeSingle();

    if (!callerAdmin) {
        return res.status(403).json({ error: 'Not an admin' });
    }

    try {
        // GET — list all admins
        if (req.method === 'GET') {
            const { data, error } = await sb
                .from('admin_users')
                .select('id, email, created_at')
                .order('created_at', { ascending: true });

            if (error) return res.status(500).json({ error: error.message });
            return res.status(200).json({ admins: data });
        }

        // POST — create new admin
        if (req.method === 'POST') {
            const { email, password } = req.body as { email: string; password: string };

            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password are required' });
            }

            if (password.length < 6) {
                return res.status(400).json({ error: 'Password must be at least 6 characters' });
            }

            // Check if already admin
            const { data: existing } = await sb
                .from('admin_users')
                .select('id')
                .eq('email', email)
                .maybeSingle();

            if (existing) {
                return res.status(409).json({ error: 'This email is already an admin' });
            }

            // Create Supabase Auth user (or skip if exists)
            const { error: createError } = await sb.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
            });

            if (createError && !createError.message.includes('already been registered')) {
                return res.status(500).json({ error: createError.message });
            }

            // Insert into admin_users
            const { data: newAdmin, error: insertError } = await sb
                .from('admin_users')
                .insert({ email })
                .select('id, email, created_at')
                .single();

            if (insertError) {
                return res.status(500).json({ error: insertError.message });
            }

            return res.status(201).json({ admin: newAdmin });
        }

        // DELETE — remove admin
        if (req.method === 'DELETE') {
            const { email } = req.body as { email: string };

            if (!email) {
                return res.status(400).json({ error: 'Email is required' });
            }

            if (email === user.email) {
                return res.status(400).json({ error: 'Cannot remove yourself' });
            }

            const { error } = await sb
                .from('admin_users')
                .delete()
                .eq('email', email);

            if (error) return res.status(500).json({ error: error.message });
            return res.status(200).json({ ok: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        console.error('[admin-users] Error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
