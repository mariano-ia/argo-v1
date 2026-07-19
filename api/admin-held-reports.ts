import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/admin-held-reports
 * The "Retenidos" (held queue) data source for the superadmin dashboard.
 * Lists v4 reports the fail-closed gate withheld (report_status='held') plus any
 * stuck 'pending' rows, with the hold reason + the full QC detail. Read-only.
 *
 * Uses the partial index idx_perfilamientos_held ON (held_at) WHERE report_status='held'.
 * Inert until V4_SEAL is flipped on (today every row is report_status NULL => empty queue).
 */

async function verifyAdmin(req: VercelRequest, sb: ReturnType<typeof createClient<any, any>>): Promise<boolean> {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return false;
    const { data: { user }, error } = await sb.auth.getUser(authHeader.replace('Bearer ', ''));
    if (error || !user || !user.email) return false;
    const { data: admin } = await sb.from('admin_users').select('id, role').eq('email', user.email).maybeSingle();
    // Held queue exposes child report content/PII: SUPERADMIN only (a 'limited' co-admin must not see it),
    // matching the SuperadminOnly route + admin-approve-report's role check.
    if (!admin || (admin as { role?: string }).role === 'limited') return false;
    return true;
}

const COLS = 'id, child_name, child_age, sport, adult_name, adult_email, archetype_label, eje, lang, report_status, held_reason, held_at, retry_count, last_error, report_qc, tenant_id, created_at';

// Clasificación de holds — espejo INLINE de src/lib/reportQuality.ts (api/ no puede importar src/).
// DATA = defecto de la ENTRADA (ficha rota / idioma): necesita un humano, regenerar no lo arregla.
// CONTENT = defecto de forma/guard del texto: con el piso probado limpio NO debería ocurrir; si aparece
// es una regresión de template/guard (o de Capa 2) y es auto-recuperable. 'recovery_failed' (razón del
// cron) se trata como content: es un envío que se trabó, no un dato roto.
const DATA_HOLD_REASONS = new Set<string>(['datos_insuficientes', 'nombre_invalido', 'axis_mismatch', 'empate_total', 'idioma']);
const holdClass = (reason: string | null | undefined): 'data' | 'content' =>
    (reason && DATA_HOLD_REASONS.has(reason)) ? 'data' : 'content';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });

    const sb = createClient(supabaseUrl, serviceKey);
    if (!(await verifyAdmin(req, sb))) return res.status(403).json({ error: 'Admin access required' });

    try {
        // Held: withheld by the gate, human-in-loop. Order by held_at (oldest first) — uses the partial index.
        const { data: held, error: heldErr } = await sb
            .from('perfilamientos')
            .select(COLS)
            .eq('report_status', 'held')
            .order('held_at', { ascending: true })
            .limit(200);
        if (heldErr) throw heldErr;

        // Pending: designed interim state; a row stuck here means the cron/gate never resolved it.
        const { data: pending, error: pendErr } = await sb
            .from('perfilamientos')
            .select(COLS)
            .eq('report_status', 'pending')
            .order('created_at', { ascending: true })
            .limit(200);
        if (pendErr) throw pendErr;

        // Annotate every row with hold_class so the human triaging the queue can tell apart
        // "necesita un humano" (data) de "esto no debería pasar, es un bug" (content).
        const annotate = (rows: any[] | null) =>
            (rows ?? []).map((r) => ({ ...r, hold_class: holdClass(r.held_reason) }));
        const heldRows = annotate(held as any[] | null);
        const pendingRows = annotate(pending as any[] | null);

        const byReason: Record<string, number> = {};
        const byClass: Record<'data' | 'content', number> = { data: 0, content: 0 };
        for (const r of (held ?? []) as any[]) {
            const k = (r.held_reason as string) ?? 'sin_motivo';
            byReason[k] = (byReason[k] ?? 0) + 1;
            byClass[holdClass(r.held_reason)] += 1;
        }

        return res.status(200).json({
            held: heldRows,
            pending: pendingRows,
            summary: { heldCount: heldRows.length, pendingCount: pendingRows.length, byReason, byClass },
        });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[admin-held-reports] Error:', msg);
        return res.status(500).json({ error: msg });
    }
}
