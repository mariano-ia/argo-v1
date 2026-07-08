import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/admin-approve-report
 * The held-queue ACTION. A superadmin reviews a withheld v4 report and either:
 *   - action 'release': re-run the fail-closed gate over the stored report_v4; if it now
 *     PASSES -> report_status='ready' + ship via the send-email choke-point. If it still
 *     fails, stay held and return the fresh reasons (nothing is shipped).
 *   - action 'force':   human override after review -> report_status='ready' + ship,
 *     regardless of the gate (the human vouches). Audited as an override.
 *
 * report_status is NEVER client-settable elsewhere; this server endpoint (admin-authed) is
 * the only human path that flips 'held'->'ready'. Sends ONLY through /api/send-email so the
 * choke-point's idempotency + template selection stay authoritative.
 *
 * api/ cannot import src/lib (ERR_MODULE_NOT_FOUND), so the gate is DUPLICATED inline from
 * api/session.ts (gateReportV4/v4Text). Keep the two copies in sync.
 */

// ─── Inlined fail-closed gate (verbatim subset of src/lib/reportQuality, mirrors api/session.ts) ──
const V4_PROHIBITED = ['error', 'errores', 'fracaso', 'fracasos', 'déficit', 'débil', 'debilidad', 'incapaz', 'agresivo', 'violento', 'torpe', 'diagnóstico', 'trastorno', 'patología', 'síndrome', 'tdah', 'autismo', 'terapia', 'mistake', 'failure', 'weakness', 'weak', 'diagnosis', 'disorder', 'pathology', 'adhd', 'autism', 'erro', 'fracasso', 'fraco', 'transtorno'];
const V4_VOSEO = /\b(podés|querés|tenés|sabés|hacés|venís|sentís|decís|mirá|hacé|poné|tomá|vení|dejá|hablá|buscá|esperá|bajá|decile|pedile|ponelo|dejalo|sacalo|resolvelo|seguí|tomate|sos)\b/i;

function v4Text(report: unknown): string {
    const parts: string[] = [];
    const r = report as { hero?: { lead?: string }; secciones?: Array<{ bloque?: { cuerpo?: string; ejemplo?: string }; palabras?: { puente?: string[]; ruido?: string[]; nota?: string }; guia?: Record<string, string> }> };
    if (r?.hero?.lead) parts.push(r.hero.lead);
    for (const s of r?.secciones ?? []) {
        if (s.bloque) { parts.push(s.bloque.cuerpo ?? '', s.bloque.ejemplo ?? ''); }
        if (s.palabras) { parts.push(...(s.palabras.puente ?? []), ...(s.palabras.ruido ?? []), s.palabras.nota ?? ''); }
        if (s.guia) parts.push(...Object.values(s.guia));
    }
    return parts.join('\n');
}

function gateReportV4(report: unknown, ficha: unknown, nombre: string, lang: string): { status: 'ready' | 'held'; reason: string | null } {
    const hold = (reason: string) => ({ status: 'held' as const, reason });
    const f = ficha as { votes?: { vector?: Record<string, number>; ejePrimario?: string; arquetipoLabel?: string } };
    const vec = f?.votes?.vector ?? {};
    const sum = Object.values(vec).reduce((a, b) => a + (b || 0), 0);
    if (sum !== 12) return hold('datos_insuficientes');
    const nm = (nombre ?? '').trim();
    if (nm.length < 1 || nm.length > 40 || /[{}]/.test(nombre ?? '')) return hold('nombre_invalido');
    if (!['D', 'I', 'S', 'C'].includes(f?.votes?.ejePrimario ?? '') || !f?.votes?.arquetipoLabel) return hold('axis_mismatch');
    if (!['es', 'en', 'pt'].includes(lang)) return hold('idioma');
    const text = v4Text(report);
    if (((report as { secciones?: unknown[] })?.secciones ?? []).length < 5) return hold('faltan_secciones');
    if (text.replace(/\s+/g, '').length < 900) return hold('forma_corta');
    if (/\{[^}]+\}/.test(text)) return hold('placeholder');
    if (/\b(undefined|null|NaN|Desconocido|unknown)\b|\[object Object\]/.test(text)) return hold('literal_basura');
    const low = text.toLowerCase();
    for (const w of V4_PROHIBITED) { if (new RegExp(`\\b${w}\\b`, 'i').test(low)) return hold('guard_prohibido'); }
    const n = nm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const det = [
        new RegExp(`(?:${n}|él|ella|el niño|la niña)\\s+(?:es|será)\\s+un[ao]?\\s+\\p{L}`, 'iu'),
        new RegExp(`(?:${n}|él|ella)\\s+(?:siempre|nunca|jamás)(?![\\p{L}])`, 'iu'),
        /\bva a ser\b/iu, /\bsin duda\b/iu, /\bnació para\b/iu, /\bdefinitivamente\b/iu,
    ];
    for (const re of det) { if (re.test(text)) return hold('guard_determinista'); }
    if (lang === 'es' && V4_VOSEO.test(text)) return hold('guard_voseo');
    if (/[—–]/.test(text)) return hold('guard_guion');
    return { status: 'ready', reason: null };
}

type AdminUser = { email: string } | null;
async function verifyAdmin(req: VercelRequest, sb: ReturnType<typeof createClient<any, any>>): Promise<AdminUser> {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return null;
    const { data: { user }, error } = await sb.auth.getUser(authHeader.replace('Bearer ', ''));
    if (error || !user || !user.email) return null;
    const { data: admin } = await sb.from('admin_users').select('id, role').eq('email', user.email).maybeSingle();
    if (!admin) return null;
    // Held queue is report-content sensitive: superadmin only (a 'limited' co-admin must not release).
    if ((admin as { role?: string }).role === 'limited') return null;
    return { email: user.email };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });

    const sb = createClient(supabaseUrl, serviceKey);
    const admin = await verifyAdmin(req, sb);
    if (!admin) return res.status(403).json({ error: 'Admin access required' });

    const { session_id, action } = (req.body ?? {}) as { session_id?: string; action?: string };
    if (!session_id) return res.status(400).json({ error: 'Missing session_id' });
    if (action !== 'release' && action !== 'force') return res.status(400).json({ error: "action must be 'release' or 'force'" });

    try {
        const { data: row, error } = await sb
            .from('perfilamientos')
            .select('id, child_name, child_age, sport, adult_name, adult_email, eje, motor, archetype_label, lang, report_status, held_reason, report_v4, evidence_ficha, share_token, email_sent_at')
            .eq('id', session_id)
            .maybeSingle();
        if (error || !row) return res.status(404).json({ error: 'Report not found' });

        // Only held/pending rows are actionable. Never touch a ready/sent/legacy(null) row.
        if (row.report_status !== 'held' && row.report_status !== 'pending') {
            return res.status(409).json({ error: `Report is '${row.report_status ?? 'legacy'}', not held/pending`, report_status: row.report_status });
        }
        if (!row.report_v4) return res.status(422).json({ error: 'No report_v4 to release (shadow artifact missing)' });

        // Re-gate (unless force override).
        let released = false;
        let gate: { status: 'ready' | 'held'; reason: string | null } = { status: 'ready', reason: null };
        if (action === 'release') {
            gate = gateReportV4(row.report_v4, row.evidence_ficha, row.child_name ?? '', row.lang || 'es');
            if (gate.status !== 'ready') {
                // Still defective: refresh the reason, keep it held, ship nothing.
                await sb.from('perfilamientos').update({ held_reason: gate.reason }).eq('id', session_id).eq('report_status', row.report_status);
                await audit(sb, admin.email, 'release-held-report:blocked', session_id, { prev_reason: row.held_reason, new_reason: gate.reason });
                return res.status(200).json({ ok: false, status: 'held', reason: gate.reason, released: false });
            }
        }
        released = true; // release-that-passed or force-override

        // Flip held/pending -> ready (server-only write). Conditional on the current status to avoid races.
        const { error: upErr } = await sb.from('perfilamientos')
            .update({ report_status: 'ready', held_reason: null, last_error: null })
            .eq('id', session_id)
            .eq('report_status', row.report_status);
        if (upErr) throw upErr;

        // Ship through the choke-point (idempotent; picks buildHtmlV4 for a ready v4 row).
        let sent = false;
        if (row.adult_email && !row.email_sent_at) {
            const origin = process.env.SITE_URL || 'https://www.argomethod.com';
            try {
                const emailRes = await fetch(`${origin}/api/send-email`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        toEmail: row.adult_email, nombreAdulto: row.adult_name ?? '', nombreNino: row.child_name,
                        deporte: row.sport ?? '', edad: row.child_age, eje: row.eje, motor: row.motor,
                        arquetipo: row.archetype_label, perfil: '', palabrasPuente: [],
                        sessionId: row.id, shareToken: row.share_token, lang: row.lang || 'es',
                    }),
                });
                sent = emailRes.ok;
                if (!sent) console.warn(`[admin-approve-report] send-email ${emailRes.status} for ${session_id}`);
            } catch (e) { console.warn('[admin-approve-report] send-email threw:', e); }
        }

        await audit(sb, admin.email, action === 'force' ? 'force-release-held-report' : 'release-held-report', session_id, {
            prev_status: row.report_status, prev_reason: row.held_reason, override: action === 'force', emailed: sent,
        });

        return res.status(200).json({ ok: true, status: 'ready', released, sent });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[admin-approve-report] Error:', msg);
        return res.status(500).json({ error: msg });
    }
}

async function audit(sb: ReturnType<typeof createClient<any, any>>, adminEmail: string, action: string, targetId: string, details: Record<string, unknown>) {
    try {
        await sb.from('admin_audit_log').insert({ admin_email: adminEmail, action, target_type: 'session', target_id: targetId, details });
    } catch { /* non-blocking */ }
}
