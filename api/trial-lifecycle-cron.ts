import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { trialExpiringEmail, trialExpiredEmail, sendTenantEmail } from '../src/lib/tenantEmails';

/**
 * GET /api/trial-lifecycle-cron
 *
 * Daily cron that nudges trial tenants toward conversion:
 *   - 3 days before expiry  → "trial expiring" email
 *   - 1 day before expiry   → "trial expiring" email
 *   - the day it expires     → "trial expired" email
 *
 * Idempotency without an extra column relies on the daily cadence: each
 * threshold (daysLeft 3 / 1) lands on a single day, and the expired email is
 * only sent within the first 24h after expiry, so a daily run fires it once.
 *
 * Auth: optional CRON_SECRET, mirrors the other crons.
 */

const DAY_MS = 86400000;
const BATCH_LIMIT = 500;
const DEFAULT_LANG = 'es';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && req.headers.authorization !== `Bearer ${cronSecret}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });

    const sb = createClient(supabaseUrl, serviceKey);

    try {
        const { data: tenants } = await sb
            .from('tenants')
            .select('id, email, display_name, trial_expires_at')
            .eq('plan', 'trial')
            .not('trial_expires_at', 'is', null)
            .limit(BATCH_LIMIT);

        const now = Date.now();
        let expiring3 = 0, expiring1 = 0, expired = 0, skipped = 0;

        for (const t of tenants ?? []) {
            if (!t.email) { skipped++; continue; }
            const expiry = new Date(t.trial_expires_at as string).getTime();
            const msLeft = expiry - now;
            const name = (t.display_name as string) || '';

            if (msLeft <= 0) {
                // Expired: only within the first 24h after expiry (fires once/day).
                if (-msLeft < DAY_MS) {
                    const e = trialExpiredEmail(DEFAULT_LANG, name);
                    await sendTenantEmail(t.email as string, e.subject, e.html);
                    expired++;
                } else {
                    skipped++;
                }
                continue;
            }

            const daysLeft = Math.ceil(msLeft / DAY_MS);
            if (daysLeft === 3) {
                const e = trialExpiringEmail(DEFAULT_LANG, name, 3);
                await sendTenantEmail(t.email as string, e.subject, e.html);
                expiring3++;
            } else if (daysLeft === 1) {
                const e = trialExpiringEmail(DEFAULT_LANG, name, 1);
                await sendTenantEmail(t.email as string, e.subject, e.html);
                expiring1++;
            } else {
                skipped++;
            }
        }

        return res.status(200).json({ ok: true, expiring3, expiring1, expired, skipped, scanned: tenants?.length ?? 0 });
    } catch (err) {
        console.error('[trial-lifecycle-cron] Error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
