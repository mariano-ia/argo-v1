import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
// Inlined emails (best-effort). Serverless functions here don't bundle
// cross-directory imports — importing ../src/lib throws ERR_MODULE_NOT_FOUND.
function lifecycleShell(heading: string, body: string, cta: string, url: string): string {
    return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F5F5F7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F7;padding:32px 16px;"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);"><tr><td style="background:#1D1D1F;padding:24px 28px;"><span style="font-size:18px;color:#fff;font-weight:800;">Argo</span><span style="font-size:18px;color:#fff;font-weight:100;"> Method</span></td></tr><tr><td style="padding:28px;"><h2 style="font-size:20px;font-weight:300;color:#1D1D1F;margin:0 0 12px;">${heading}</h2><p style="font-size:14px;color:#86868B;margin:0 0 12px;line-height:1.6;">${body}</p><a href="${url}" style="display:inline-block;background:#955FB5;color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px;margin-top:4px;">${cta}</a></td></tr><tr><td style="background:#F5F5F7;padding:16px 28px;text-align:center;border-top:1px solid #E8E8ED;"><p style="font-size:11px;color:#AEAEB2;margin:0;">Argo Method · Perfilamiento conductual para deportistas jóvenes</p></td></tr></table></td></tr></table></body></html>`;
}
function trialExpiringEmail(lang: string, displayName: string, daysLeft: number): { subject: string; html: string } {
    const url = `${process.env.SITE_URL || 'https://argomethod.com'}/dashboard/pricing`;
    const days = lang === 'en' ? `${daysLeft} day${daysLeft === 1 ? '' : 's'}` : lang === 'pt' ? `${daysLeft} dia${daysLeft === 1 ? '' : 's'}` : `${daysLeft} día${daysLeft === 1 ? '' : 's'}`;
    const c = lang === 'en' ? { s: `Your Argo trial ends in ${days}`, h: 'Your trial is about to end', b: `Hi ${displayName}, your trial has ${days} left. To keep access to your team and keep adding athletes, choose a plan whenever you are ready.`, cta: 'See plans' }
        : lang === 'pt' ? { s: `Seu teste do Argo termina em ${days}`, h: 'Seu teste está terminando', b: `Olá ${displayName}, faltam ${days} para o fim do seu teste. Para manter o acesso ao seu time e continuar adicionando atletas, escolha um plano quando quiser.`, cta: 'Ver planos' }
        : { s: `Tu prueba de Argo vence en ${days}`, h: 'Tu prueba está por terminar', b: `Hola ${displayName}, a tu periodo de prueba le quedan ${days}. Para no perder acceso a tu equipo y seguir sumando deportistas, elige un plan cuando quieras.`, cta: 'Ver planes' };
    return { subject: c.s, html: lifecycleShell(c.h, c.b, c.cta, url) };
}
function trialExpiredEmail(lang: string, displayName: string): { subject: string; html: string } {
    const url = `${process.env.SITE_URL || 'https://argomethod.com'}/dashboard/pricing`;
    const c = lang === 'en' ? { s: 'Your Argo trial has ended', h: 'Your trial has ended', b: `Hi ${displayName}, your trial period ended. Your profiles and reports are still saved. To add athletes again and use every feature, choose a plan.`, cta: 'Choose a plan' }
        : lang === 'pt' ? { s: 'Seu teste do Argo terminou', h: 'Seu teste terminou', b: `Olá ${displayName}, seu período de teste terminou. Seus perfis e relatórios continuam salvos. Para adicionar atletas novamente e usar todas as funções, escolha um plano.`, cta: 'Escolher um plano' }
        : { s: 'Tu prueba de Argo terminó', h: 'Tu prueba terminó', b: `Hola ${displayName}, tu periodo de prueba finalizó. Tus perfiles y reportes siguen guardados. Para volver a sumar deportistas y usar todas las funciones, elige un plan.`, cta: 'Elegir un plan' };
    return { subject: c.s, html: lifecycleShell(c.h, c.b, c.cta, url) };
}
async function sendTenantEmail(to: string, subject: string, html: string): Promise<void> {
    const key = process.env.RESEND_API_KEY;
    if (!key) { console.warn('[trial-lifecycle-cron] RESEND_API_KEY not set'); return; }
    try {
        const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: 'Argo Method <hola@argomethod.com>', to: [to], subject, html }) });
        if (!r.ok) console.error('[trial-lifecycle-cron] resend error:', r.status);
    } catch (e) { console.error('[trial-lifecycle-cron] email failed:', e); }
}

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

    // Liveness heartbeat for qa-monitor's dead-man's-switch (best-effort, never throws).
    try {
        const _hbAt = new Date().toISOString();
        await sb.from('health_checks').insert({
            area: 'sistema', signal_key: 'trial-lifecycle-cron_heartbeat', source_type: 'cron', source_ref: 'trial-lifecycle-cron',
            shape: 'threshold', measured_value: 0, setpoint_value: 0, comparator: '>=', unit: 'runs',
            breached: false, severity: 'sano', checked_at: _hbAt, last_successful_check_at: _hbAt,
        });
    } catch (e) { console.warn('[trial-lifecycle-cron] heartbeat failed:', e); }

    try {
        const { data: tenants } = await sb
            .from('tenants')
            .select('id, email, display_name, trial_expires_at, lang')
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
            const lang = (t.lang as string) || DEFAULT_LANG;

            if (msLeft <= 0) {
                // Expired: only within the first 24h after expiry (fires once/day).
                if (-msLeft < DAY_MS) {
                    const e = trialExpiredEmail(lang, name);
                    await sendTenantEmail(t.email as string, e.subject, e.html);
                    expired++;
                } else {
                    skipped++;
                }
                continue;
            }

            const daysLeft = Math.ceil(msLeft / DAY_MS);
            if (daysLeft === 3) {
                const e = trialExpiringEmail(lang, name, 3);
                await sendTenantEmail(t.email as string, e.subject, e.html);
                expiring3++;
            } else if (daysLeft === 1) {
                const e = trialExpiringEmail(lang, name, 1);
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
