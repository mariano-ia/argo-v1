import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * GET/POST /api/puentes-check-purchase?purchase_id=...
 *
 * Used by the post-payment success page to poll the purchase status until
 * the webhook confirms it (typically 1-3 seconds). Returns the magic_token
 * once status='paid' so the page can redirect into the questionnaire.
 */

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });

    const sb = createClient(supabaseUrl, serviceKey);

    try {
        const purchase_id = (req.query.purchase_id as string) || (req.body as any)?.purchase_id;
        if (!purchase_id) return res.status(400).json({ error: 'Missing purchase_id' });

        const { data: purchase, error } = await sb
            .from('puentes_purchases')
            .select('id, status, magic_token, recipient_email, child_name, lang')
            .eq('id', purchase_id)
            .maybeSingle();
        if (error || !purchase) return res.status(404).json({ error: 'Purchase not found' });

        // Only expose magic_token once paid. While pending, return status only —
        // and, per the frozen model's pre-payment PII rule (ARGOONE-DECISIONES.md),
        // only the child's FIRST name until the purchase is paid.
        if (purchase.status !== 'paid') {
            const firstName = ((purchase.child_name as string | null) ?? '').trim().split(/\s+/)[0] || null;
            return res.status(200).json({
                status: purchase.status,
                recipient_email: purchase.recipient_email,
                child_name: firstName,
                lang: purchase.lang,
            });
        }

        return res.status(200).json({
            status: 'paid',
            magic_token: purchase.magic_token,
            recipient_email: purchase.recipient_email,
            child_name: purchase.child_name,
            lang: purchase.lang,
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[puentes-check-purchase] Error:', msg);
        return res.status(500).json({ error: 'Internal error', detail: msg });
    }
}
