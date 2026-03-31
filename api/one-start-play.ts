import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/one-start-play
 * Body: { slug }
 * Validates an Argo One link slug is valid and not used.
 * Returns: { ok, link_id, purchase_email }
 */

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });

    const sb = createClient(supabaseUrl, serviceKey);

    try {
        const { slug } = req.body as { slug?: string };
        if (!slug) return res.status(400).json({ error: 'Missing slug' });

        // Find the link
        const { data: link } = await sb
            .from('one_links')
            .select('id, status, purchase_id, recipient_email, child_name')
            .eq('slug', slug)
            .single();

        if (!link) return res.status(404).json({ error: 'Link not found' });
        if (link.status === 'completed') return res.status(403).json({ error: 'link_already_used' });

        // Verify the purchase is paid
        const { data: purchase } = await sb
            .from('one_purchases')
            .select('payment_status')
            .eq('id', link.purchase_id)
            .single();

        if (!purchase || purchase.payment_status !== 'paid') {
            return res.status(403).json({ error: 'Payment not confirmed' });
        }

        // Mark as pending (in progress)
        if (link.status !== 'pending') {
            await sb.from('one_links').update({ status: 'pending' }).eq('id', link.id);
        }

        return res.status(200).json({
            ok: true,
            link_id: link.id,
            recipient_email: link.recipient_email,
            child_name: link.child_name,
        });
    } catch (err) {
        console.error('[one-start-play] Error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
