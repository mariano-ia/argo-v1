import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { randomBytes, createHmac, timingSafeEqual } from 'crypto';
// Inlined Principia activity logger (best-effort, never throws). Vercel serverless
// functions here don't bundle cross-directory imports, so importing ../src/lib
// throws ERR_MODULE_NOT_FOUND at runtime.
type ActivityInput = { area: string; action: string; sourceType?: string; eventType?: string; actor?: string; resourceType?: string; resourceId?: string; severity?: string; status?: string; reason?: Record<string, unknown>; result?: Record<string, unknown>; relatedLogs?: string[]; incidentId?: number; occurredAt?: string };
async function logActivity(sb: { from: (table: string) => { insert: (values: unknown) => unknown } }, input: ActivityInput): Promise<void> {
    try {
        await sb.from('system_activity_log').insert({
            area: input.area, source_type: input.sourceType ?? 'system', event_type: input.eventType ?? null,
            actor: input.actor ?? null, action: input.action, resource_type: input.resourceType ?? null,
            resource_id: input.resourceId ?? null, severity: input.severity ?? 'info', status: input.status ?? null,
            reason: input.reason ?? null, result: input.result ?? null, related_logs: input.relatedLogs ?? [],
            incident_id: input.incidentId ?? null, occurred_at: input.occurredAt ?? null,
        });
    } catch (err) { console.warn('[principia:logActivity] non-blocking write failed:', err); }
}

// ─── Fail-closed SERVER gate (inlined; api/ can't import src/lib) ──────────────
// Re-verifies the client-computed v4 report SERVER-SIDE and seals report_status.
// The client NEVER sets report_status; only this does. Mirrors the safety-critical
// subset of src/lib/reportQuality.ts. Gated by env V4_SEAL: unset/'off' => report_status
// stays NULL (choke-point ungated => legacy delivery, unchanged). Flip to 'on' ONLY once
// held-UI + v4 render/email are live, or a v4 'held' would block a delivery legacy would ship.
const V4_PROHIBITED = ['error', 'errores', 'fracaso', 'fracasos', 'déficit', 'débil', 'debilidad', 'incapaz', 'agresivo', 'violento', 'torpe', 'diagnóstico', 'trastorno', 'patología', 'síndrome', 'tdah', 'autismo', 'terapia', 'mistake', 'failure', 'weakness', 'weak', 'diagnosis', 'disorder', 'pathology', 'adhd', 'autism', 'erro', 'fracasso', 'fraco', 'transtorno'];
const V4_VOSEO = /\b(podés|querés|tenés|sabés|hacés|venís|sentís|decís|mirá|hacé|poné|tomá|vení|dejá|hablá|buscá|esperá|bajá|decile|pedile|ponelo|dejalo|sacalo|resolvelo|seguí|tomate|sos)\b/i;

export function v4Text(report: unknown): string {
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

/** Sound server-side subset of the fail-closed gate. Returns 'ready' or 'held'+reason. */
export function gateReportV4(report: unknown, ficha: unknown, nombre: string, lang: string): { status: 'ready' | 'held'; reason: string | null } {
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
    // Deterministic-labeling guard, per language (a report must not decree what the
    // child IS/WILL ALWAYS be). The es set ran for all langs before, which is
    // harmless (Spanish anchors don't match en/pt) but LEAKY — it let deterministic
    // English/Portuguese phrasing through. Now each language has parity.
    const detEs = [
        new RegExp(`(?:${n}|él|ella|el niño|la niña)\\s+(?:es|será)\\s+un[ao]?\\s+\\p{L}`, 'iu'),
        new RegExp(`(?:${n}|él|ella)\\s+(?:siempre|nunca|jamás)(?![\\p{L}])`, 'iu'),
        /\bva a ser\b/iu, /\bsin duda\b/iu, /\bnació para\b/iu, /\bdefinitivamente\b/iu,
    ];
    const detEn = [
        new RegExp(`(?:${n}|he|she|the child)\\s+is\\s+an?\\s+\\p{L}`, 'iu'),
        new RegExp(`(?:${n}|he|she)\\s+(?:always|never)(?![\\p{L}])`, 'iu'),
        /\bwill always\b/iu, /\bwithout a doubt\b/iu, /\bborn to\b/iu, /\bis going to be\b/iu, /\bdefinitely\b/iu,
    ];
    const detPt = [
        new RegExp(`(?:${n}|ele|ela|a criança|o menino|a menina)\\s+é\\s+um[a]?\\s+\\p{L}`, 'iu'),
        new RegExp(`(?:${n}|ele|ela)\\s+(?:sempre|nunca|jamais)(?![\\p{L}])`, 'iu'),
        /\bvai ser\b/iu, /\bsem dúvida\b/iu, /\bnasceu para\b/iu, /\bcom certeza\b/iu, /\bdefinitivamente\b/iu,
    ];
    const det = lang === 'en' ? detEn : lang === 'pt' ? detPt : detEs;
    for (const re of det) { if (re.test(text)) return hold('guard_determinista'); }
    if (lang === 'es' && V4_VOSEO.test(text)) return hold('guard_voseo'); // voseo: solo español
    if (/[—–]/.test(text)) return hold('guard_guion'); // no-guiones: regla universal (es/en/pt)
    return { status: 'ready', reason: null };
}

/** Wrapper: seals report_status ONLY when V4_SEAL is on. Off => {null,null} (shadow, legacy delivery). */
function sealV4(report_v4: unknown, ficha: unknown, nombre: string, lang: string): { report_status: string | null; held_reason: string | null } {
    if (process.env.V4_SEAL !== 'on' || !report_v4 || !ficha) return { report_status: null, held_reason: null };
    try {
        const g = gateReportV4(report_v4, ficha, nombre, lang);
        return { report_status: g.status, held_reason: g.reason };
    } catch (e) {
        console.warn('[v4:seal] gate threw, leaving report_status NULL:', e);
        return { report_status: null, held_reason: null };
    }
}

/**
 * Unified session endpoint. Routes by `action` field in POST body:
 *   - "start"  → create a child (or re-profile an existing one) + a started perfilamiento
 *   - "update" → update an existing perfilamiento by id (+ share_token)
 *   - "save"   → create a complete perfilamiento in one call (legacy fallback)
 *
 * Data model (2026-06-29 split): a `children` row is the persistent roster entity
 * (one child = one slot + identity + reprofile_token). Each play writes an append-only
 * `perfilamientos` row (the assessment + its report). The general link ALWAYS creates a
 * new child; re-profile appends a perfilamiento to an existing child, identified ONLY by
 * the signed `cid` inside the play_token (never from the body — closes the IDOR).
 *
 * Tenant attribution is protected: attaching to a tenant requires a valid play_token
 * (from /api/start-play, which enforces roster capacity) or, for re-profile, from
 * /api/start-reprofile (which carries the signed child id and skips the roster gate).
 */

// Loose client type for the inline helpers below — the concrete Supabase client
// carries heavy generics that don't unify cleanly across helper boundaries.
type SB = { from: (table: string) => any };

// Verifies a play_token signed by /api/start-play or /api/start-reprofile. Returns the
// tenant_id + team_id it authorizes, plus (for re-profile) the signed child_id and mode.
// Everything is signed server-side so a player can't spoof tenant, team, or which child
// a re-profile lands on.
function verifyPlayToken(token: unknown, secret: string): { tenantId: string; teamId: string | null; childId: string | null; mode: 'new' | 'reprofile' } | null {
    if (typeof token !== 'string' || !token.includes('.')) return null;
    const [payload, sig] = token.split('.');
    if (!payload || !sig) return null;
    const expected = createHmac('sha256', secret).update(payload).digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    try {
        const { t, tm, cid, m, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
        if (typeof t !== 'string' || typeof exp !== 'number' || Date.now() > exp) return null;
        return {
            tenantId: t,
            teamId: typeof tm === 'string' ? tm : null,
            childId: typeof cid === 'string' ? cid : null,
            mode: m === 'r' ? 'reprofile' : 'new',
        };
    } catch {
        return null;
    }
}

// Attaches a CHILD to a team (idempotent). No-op when teamId is null. Membership is
// per-child so it survives re-profiles (which only add perfilamientos).
async function ensureTeamMembership(sb: SB, teamId: string | null, childId: string): Promise<void> {
    if (!teamId) return;
    const { error } = await sb.from('group_members').upsert({ group_id: teamId, child_id: childId }, { onConflict: 'group_id,child_id' });
    if (error) console.error('[session] ensureTeamMembership failed to attribute child to plantel:', error.message, { childId, teamId });
}

// ── Sport resolution (per-plantel, 2026-07-14) ───────────────────────────────
// Sport comes from the club's structures, NEVER trusted from the client body:
// a re-profile keeps the child's frozen sport; a team-link play takes the SIGNED
// plantel's sport (groups.sport); tenants.sport remains only as the legacy
// account-level default (general /play/:slug link, pre-sport planteles). The
// client value applies last, only when the club has no server-side sport at all
// (sport-less legacy tenant via the general link, where the adult is asked).
async function resolveClubSport(sb: SB, tenantId: string, teamId: string | null, reproChildId: string | null, clientSport: string | null): Promise<string | null> {
    if (reproChildId) {
        const { data: child } = await sb.from('children').select('sport').eq('id', reproChildId).maybeSingle();
        if (child?.sport) return child.sport;
    }
    if (teamId) {
        const { data: team } = await sb.from('groups').select('sport').eq('id', teamId).maybeSingle();
        if (team?.sport) return team.sport;
    }
    const { data: tenantRow } = await sb.from('tenants').select('sport').eq('id', tenantId).maybeSingle();
    return tenantRow?.sport ?? clientSport ?? null;
}

// ── Tenant free ArgoPuente® grant ────────────────────────────────────────────
// When a tenant has free_puentes enabled, every resolved (non-demo) perfilamiento
// grants the responsible adult a complimentary ($0, provider='comp') ArgoPuente®
// purchase, mirroring the ArgoOne+® combo block in one-complete.ts. The purchase
// must exist BEFORE the report email goes out: send-email then swaps the $4.99
// upsell for the "included" copy + magic link and creates the puentes_session
// itself. Skips if the adult already has a paid purchase (real or comp), so
// siblings and re-profiles never duplicate. Best-effort: never blocks the save.
async function maybeGrantTenantFreePuente(sb: SB, perf: {
    id: string; tenantId: string | null; adultEmail: string | null;
    adultName: string | null; childName: string | null; lang: string | null; isDemo: boolean;
}): Promise<void> {
    try {
        if (!perf.tenantId || !perf.adultEmail || perf.isDemo) return;

        const { data: tenant } = await sb.from('tenants')
            .select('free_puentes').eq('id', perf.tenantId).maybeSingle();
        if (!tenant?.free_puentes) return;

        const { data: existing } = await sb.from('puentes_purchases')
            .select('id')
            .eq('recipient_email', perf.adultEmail)
            .eq('status', 'paid')
            .maybeSingle();
        if (existing) return;

        const { error } = await sb.from('puentes_purchases').insert({
            source_session_id: perf.id,
            recipient_email: perf.adultEmail,
            recipient_name: perf.adultName ?? null,
            child_name: perf.childName,
            amount_cents: 0,
            currency: 'USD',
            provider: 'comp',
            provider_payment_id: `tenant_free_${perf.tenantId}_${perf.id}`,
            status: 'paid',
            paid_at: new Date().toISOString(),
            magic_token: randomBytes(24).toString('base64url'),
            lang: perf.lang ?? 'es',
            source: 'tenant',
            tenant_id: perf.tenantId,
        });
        if (error) {
            console.warn('[session] tenant free Puente insert failed (non-blocking):', error.message);
        } else {
            console.info('[session] tenant free Puente granted for perfilamiento', perf.id);
        }
    } catch (err) {
        console.warn('[session] tenant free Puente grant failed (non-blocking):', err instanceof Error ? err.message : err);
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;

    if (!serviceKey || !supabaseUrl) {
        console.error('[session] Missing SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_URL');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const sb = createClient(supabaseUrl, serviceKey);
    const { action, ...fields } = req.body;

    try {
        // ── Start session ────────────────────────────────────────────────────
        if (action === 'start') {
            const { adult_name, adult_email, child_name, child_age, sport, tenant_id, lang, consent_token, play_token, is_demo, one_link_id } = fields;

            if (!adult_email || !child_name) {
                return res.status(400).json({ error: 'Missing required fields: adult_email, child_name' });
            }

            // ── Tenant attribution gate ──────────────────────────────────────
            // To attach to a tenant the caller must present a valid play_token. We
            // trust the tenant_id, team_id, and (for re-profile) child_id from the
            // SIGNED token, never the body. ArgoOne® / self-play (no tenant) needs no token.
            let effectiveTenantId: string | null = null;
            let effectiveTeamId: string | null = null;
            let reproChildId: string | null = null;
            // For an ArgoOne® re-profile of a child >=13 (no COPPA claim below), the
            // authorization consent is claimed single-use HERE; hold its token so a
            // later perfilamiento-insert failure can release it.
            let reproAuthToken: string | null = null;
            if (tenant_id) {
                const verified = verifyPlayToken(play_token, serviceKey);
                if (!verified || verified.tenantId !== tenant_id) {
                    console.warn('[session:start] Rejected tenant attribution — invalid play_token for tenant', tenant_id);
                    return res.status(403).json({ error: 'invalid_play_token' });
                }
                effectiveTenantId = verified.tenantId;
                effectiveTeamId = verified.teamId;
                if (verified.mode === 'reprofile') reproChildId = verified.childId;
            }

            // ── ArgoOne® re-profile (Fase 3) ──────────────────────────────────
            // A replay one_link carries the child_id server-side (minted by the
            // webhook). We trust that child_id (never the body), append to the
            // existing child, and enforce, at play time: (1) a CONFIRMED
            // authorization consent bound to THIS slot — the responsible adult
            // clicked (both ages, closes the ">=13 no auth" hole); (2) the hard
            // 6-month cooldown; (3) single-use of the authorization so the same paid
            // re-profile can't append two perfilamientos. Gated on the DURABLE facts
            // (replay slot child_id + paid reprofile purchase), not the runtime flag,
            // so a flag flip mid-play can't misroute it into new-child creation.
            // Tenant-less only, so the tenant reprofile path above is untouched.
            if (!reproChildId && !tenant_id && typeof one_link_id === 'string' && one_link_id) {
                const { data: rlink } = await sb.from('one_links')
                    .select('id, child_id, status, purchase_id')
                    .eq('id', one_link_id)
                    .maybeSingle();
                if (rlink?.child_id && rlink.status !== 'completed') {
                    const { data: rp } = await sb.from('one_purchases')
                        .select('payment_status, kind').eq('id', rlink.purchase_id).maybeSingle();
                    if (rp?.payment_status === 'paid' && rp?.kind === 'reprofile') {
                        // (1) Authorization: a confirmed consent bound to this slot.
                        const { data: authC } = await sb.from('parental_consents')
                            .select('token, status, expires_at, consumed_at')
                            .eq('one_link_id', one_link_id)
                            .eq('status', 'confirmed')
                            .maybeSingle();
                        if (!authC) return res.status(403).json({ error: 'reprofile_not_authorized' });
                        if (new Date(authC.expires_at) < new Date()) return res.status(403).json({ error: 'reprofile_auth_expired' });

                        // (2) Hard 6-month cooldown (belt to the webhook's gate).
                        const { data: cd, error: cdErr } = await sb.rpc('check_reprofile_cooldown', { p_child_id: rlink.child_id });
                        if (cdErr) {
                            console.error('[session:start] one reprofile cooldown RPC error:', cdErr.message);
                            return res.status(500).json({ error: 'Internal server error' });
                        }
                        if (cd && cd.allowed === false) {
                            return res.status(403).json({ error: 'reprofile_too_soon', months_remaining: cd.months_remaining, available_at: cd.available_at });
                        }

                        // (2b) Concurrent double-play guard. The cooldown RPC counts
                        // only RESOLVED perfilamientos, so two plays STARTED before
                        // either resolves would both pass it. If a RECENT in_flight
                        // perfilamiento already exists for this child (another play in
                        // progress), reject. 30-min window so an abandoned play can be
                        // retried later (single-use consent already blocks same-slot
                        // retries; this closes the rare two-slot concurrency race).
                        const { data: infl } = await sb.from('perfilamientos')
                            .select('id')
                            .eq('child_id', rlink.child_id)
                            .eq('status', 'in_flight')
                            .is('deleted_at', null)
                            .gte('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString())
                            .limit(1)
                            .maybeSingle();
                        if (infl) return res.status(409).json({ error: 'reprofile_in_progress' });

                        // (3) Single-use. For <13 the COPPA gate below atomically
                        // claims the same consent by consent_token, so here we only
                        // BIND (the submitted token must be THIS authorization). For
                        // >=13 (no COPPA claim) we atomically claim it now.
                        if (typeof child_age === 'number' && child_age < 13) {
                            if (consent_token !== authC.token) return res.status(403).json({ error: 'consent_mismatch' });
                        } else {
                            const { data: claimed } = await sb.from('parental_consents')
                                .update({ consumed_at: new Date().toISOString() })
                                .eq('token', authC.token)
                                .is('consumed_at', null)
                                .select('token')
                                .maybeSingle();
                            if (!claimed) return res.status(403).json({ error: 'reprofile_already_used' });
                            reproAuthToken = authC.token as string;
                        }

                        reproChildId = rlink.child_id;
                    }
                }
            }

            // ── Sport is defined by the club, not the parent ─────────────────
            // Per-plantel (2026-07-14): signed team's sport wins; re-profile keeps
            // the child's frozen sport; tenants.sport is the legacy fallback.
            let effectiveSport: string | null = sport || null;
            if (effectiveTenantId) {
                effectiveSport = await resolveClubSport(sb, effectiveTenantId, effectiveTeamId, reproChildId, sport || null);
            }

            // ── COPPA gate: children under 13 require a confirmed consent token ──
            if (typeof child_age === 'number' && child_age < 13) {
                if (typeof consent_token !== 'string' || !/^[a-f0-9]{32}$/.test(consent_token)) {
                    return res.status(403).json({ error: 'consent_required' });
                }
                const { data: consent, error: consentErr } = await sb
                    .from('parental_consents')
                    .select('token, status, expires_at, child_name, child_age, consumed_at, one_link_id')
                    .eq('token', consent_token)
                    .maybeSingle();
                if (consentErr) {
                    console.error('[session:start] consent lookup error:', consentErr.message);
                    return res.status(500).json({ error: 'consent_lookup_failed' });
                }
                if (!consent) return res.status(403).json({ error: 'consent_invalid' });
                if (consent.status !== 'confirmed') return res.status(403).json({ error: 'consent_not_confirmed' });
                if (consent.consumed_at) return res.status(403).json({ error: 'consent_already_used' });
                if (new Date(consent.expires_at) < new Date()) return res.status(403).json({ error: 'consent_expired' });
                if (consent.child_name !== child_name || consent.child_age !== child_age) {
                    return res.status(403).json({ error: 'consent_mismatch' });
                }
                // Bind the consent to the slot it was issued for (mirrors the reprofile
                // path above). Soft check: only enforced when both ids are present, so
                // legacy or tenant consents without a one_link_id are unaffected.
                if (consent.one_link_id && typeof one_link_id === 'string' && one_link_id && consent.one_link_id !== one_link_id) {
                    return res.status(403).json({ error: 'consent_mismatch' });
                }
            }

            // ── Atomic consent claim (race-safe) ──────────────────────────────
            if (typeof child_age === 'number' && child_age < 13 && typeof consent_token === 'string') {
                const { data: claimed, error: claimErr } = await sb
                    .from('parental_consents')
                    .update({ consumed_at: new Date().toISOString() })
                    .eq('token', consent_token)
                    .is('consumed_at', null)
                    .select('token')
                    .maybeSingle();
                if (claimErr) {
                    console.error('[session:start] consent claim error:', claimErr.message);
                    return res.status(500).json({ error: 'consent_claim_failed' });
                }
                if (!claimed) return res.status(403).json({ error: 'consent_already_used' });
            }

            const rollbackConsent = async () => {
                if (typeof child_age === 'number' && child_age < 13 && typeof consent_token === 'string') {
                    await sb.from('parental_consents').update({ consumed_at: null }).eq('token', consent_token);
                }
                // >=13 ArgoOne® re-profile claimed its authorization above; release it
                // so an insert failure doesn't strand a paid, unplayed re-profile.
                if (reproAuthToken) {
                    await sb.from('parental_consents').update({ consumed_at: null }).eq('token', reproAuthToken);
                }
            };

            // ── Resolve the child: re-profile an existing one, or create a new one ──
            let childId: string;
            if (reproChildId) {
                // Re-profile: append to an existing child. Verify it belongs to this
                // tenant and is active (the cid is signed, but re-validate state).
                const { data: childRow } = await sb.from('children')
                    .select('id, tenant_id, archived_at, deleted_at, merged_into')
                    .eq('id', reproChildId).maybeSingle();
                if (!childRow || childRow.tenant_id !== effectiveTenantId || childRow.archived_at || childRow.deleted_at || childRow.merged_into) {
                    await rollbackConsent();
                    return res.status(403).json({ error: 'child_inactive' });
                }
                childId = reproChildId;
            } else {
                // New child (general link always creates a new child — same name ≠ same child).
                const { data: childRow, error: childErr } = await sb.from('children').insert({
                    tenant_id:   effectiveTenantId,
                    adult_name,
                    adult_email,
                    child_name,
                    child_age:   typeof child_age === 'number' ? child_age : null,
                    sport:       effectiveSport,
                    lang:        lang ?? 'es',
                    is_demo:     is_demo === true,
                }).select('id').single();
                if (childErr || !childRow) {
                    console.error('[session:start] child insert error:', childErr?.message);
                    await rollbackConsent();
                    return res.status(500).json({ error: childErr?.message ?? 'child_create_failed' });
                }
                childId = childRow.id;
            }

            // ── Create the started perfilamiento (in_flight) ──────────────────
            const share_token = randomBytes(16).toString('hex');
            const { data: perf, error } = await sb.from('perfilamientos').insert({
                child_id:        childId,
                adult_name,
                adult_email,
                child_name,
                child_age:       typeof child_age === 'number' ? child_age : null,
                sport:           effectiveSport,
                tenant_id:       effectiveTenantId,
                lang:            lang ?? 'es',
                eje:             '_pending',
                motor:           '_pending',
                archetype_label: '_pending',
                answers:         [],
                status:          'in_flight',
                share_token,
                is_demo:         is_demo === true,
            }).select('id, share_token').single();

            if (error || !perf) {
                console.error('[session:start] perfilamiento insert error:', error?.message, error?.details);
                await rollbackConsent();
                // If we just created a fresh childless child, remove it.
                if (!reproChildId) await sb.from('children').delete().eq('id', childId);
                return res.status(500).json({ error: error?.message ?? 'perfilamiento_create_failed' });
            }

            // Link the consent to the perfilamiento + child for audit (COPPA chain).
            if (typeof child_age === 'number' && child_age < 13 && typeof consent_token === 'string') {
                await sb.from('parental_consents').update({ session_id: perf.id, child_id: childId }).eq('token', consent_token);
            }

            // ── ArgoOne® fusion: bind the one_link to the session AT START ──────
            // (ONE_V2_COMPLETE / ONE_UNIFIED_SKU). The browser-driven one-complete
            // can die with the tab; binding link→session here (while the tab is
            // provably alive) lets the report-recovery-cron sweep finish any
            // completion server-side. Best-effort: only an UNBOUND, not-completed
            // link may bind, and a failure never blocks the play.
            if ((process.env.ONE_V2_COMPLETE === 'on' || process.env.ONE_UNIFIED_SKU === 'on') && typeof one_link_id === 'string' && one_link_id) {
                try {
                    await sb.from('one_links')
                        .update({ session_id: perf.id })
                        .eq('id', one_link_id)
                        .neq('status', 'completed')
                        .is('session_id', null);
                } catch (e) {
                    console.warn('[session:start] one_link bind failed (non-blocking):', e);
                }
            }

            await ensureTeamMembership(sb, effectiveTeamId, childId);

            return res.status(200).json({ ok: true, id: perf.id, share_token: perf.share_token, child_id: childId });
        }

        // ── Update perfilamiento ─────────────────────────────────────────────
        if (action === 'update') {
            const { id, share_token, ...rest } = fields;
            if (!id) return res.status(400).json({ error: 'Missing required field: id' });

            // Ownership gate: only the client holding this perfilamiento's share_token may update it.
            if (typeof share_token !== 'string' || !share_token) {
                return res.status(403).json({ error: 'missing_session_token' });
            }
            const { data: ownRow, error: ownErr } = await sb
                .from('perfilamientos').select('id, share_token, child_id, tenant_id, adult_email, adult_name, child_name, lang, is_demo').eq('id', id).maybeSingle();
            if (ownErr) {
                console.error('[session:update] ownership lookup error:', ownErr.message);
                return res.status(500).json({ error: 'update_lookup_failed' });
            }
            if (!ownRow || ownRow.share_token !== share_token) {
                console.warn('[session:update] Rejected update — share_token mismatch for perfilamiento', id);
                return res.status(403).json({ error: 'invalid_session_token' });
            }

            const allowed: Record<string, unknown> = {};
            const safeKeys = [
                'eje', 'motor', 'archetype_label', 'eje_secundario',
                'answers', 'ai_tokens_input', 'ai_tokens_output', 'ai_cost_usd', 'ai_sections', 'game_metrics',
                // v4 SHADOW artifacts (data only; report_status is NEVER client-settable — sealed server-side).
                'evidence_ficha', 'report_v4', 'report_qc',
                // Instrument version stamp (panel audit 2026-07-08 / M3): separates item-set cohorts.
                'question_version',
            ];
            for (const key of safeKeys) {
                if (rest[key] !== undefined) allowed[key] = rest[key];
            }
            if (Object.keys(allowed).length === 0) {
                return res.status(400).json({ error: 'No valid fields to update' });
            }

            // Fail-closed server gate: when the v4 report is being persisted, the SERVER (never the
            // client) seals report_status. NULL unless V4_SEAL='on' (shadow => legacy delivery).
            if (allowed.report_v4) {
                const sealUpd = sealV4(allowed.report_v4, allowed.evidence_ficha, ownRow.child_name ?? '', ownRow.lang ?? 'es');
                allowed.report_status = sealUpd.report_status;
                allowed.held_reason = sealUpd.held_reason;
                if (sealUpd.report_status === 'held') allowed.held_at = new Date().toISOString();
            }

            // Completing the questionnaire (a real eje) resolves the perfilamiento.
            const resolves = typeof allowed.eje === 'string' && allowed.eje !== '_pending';
            if (resolves) allowed.status = 'resolved';

            const { error } = await sb.from('perfilamientos').update(allowed).eq('id', id);
            if (error) {
                console.error('[session:update] Update error:', error.message, error.details);
                return res.status(500).json({ error: error.message });
            }

            if (resolves) {
                await logActivity(sb, {
                    area: 'producto', action: 'session_completed', sourceType: 'system', severity: 'info',
                    resourceType: 'session', resourceId: String(id),
                    reason: { session_id: id, child_id: ownRow.child_id, eje: allowed.eje, motor: allowed.motor, tenant_id: ownRow.tenant_id },
                    relatedLogs: [`perfilamientos.${id}`],
                });
                await maybeGrantTenantFreePuente(sb, {
                    id: String(id),
                    tenantId: ownRow.tenant_id ?? null,
                    adultEmail: ownRow.adult_email ?? null,
                    adultName: ownRow.adult_name ?? null,
                    childName: ownRow.child_name ?? null,
                    lang: ownRow.lang ?? null,
                    isDemo: ownRow.is_demo === true,
                });
            }

            return res.status(200).json({ ok: true });
        }

        // ── Save session (legacy — complete in one call) ─────────────────────
        if (action === 'save') {
            const {
                adult_name, adult_email, child_name, child_age, sport,
                eje, motor, archetype_label, eje_secundario,
                answers, tenant_id, lang, play_token,
                ai_tokens_input, ai_tokens_output, ai_cost_usd, ai_sections, game_metrics,
                is_demo, question_version,
                // v4 method (client-computed; see METODO-FALLBACK-INFORME.md). Additive + optional.
                // report_status is NEVER accepted from the client (a malicious client could set
                // 'ready'+garbage and bypass the choke-point); only server-side code seals it. The
                // client sends evidence_ficha/report_v4/report_qc (data only) for SHADOW observation.
                evidence_ficha, report_v4, report_qc,
            } = fields;

            if (!adult_email || !eje || !motor) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            let saveTenantId: string | null = null;
            let saveTeamId: string | null = null;
            let saveReproChildId: string | null = null;
            if (tenant_id) {
                const verified = verifyPlayToken(play_token, serviceKey);
                if (!verified || verified.tenantId !== tenant_id) {
                    console.warn('[session:save] Rejected tenant attribution — invalid play_token for tenant', tenant_id);
                    return res.status(403).json({ error: 'invalid_play_token' });
                }
                saveTenantId = verified.tenantId;
                saveTeamId = verified.teamId;
                if (verified.mode === 'reprofile') saveReproChildId = verified.childId;
            }

            // Per-plantel sport resolution — mirrors the start branch above.
            let saveSport: string | null = sport || null;
            if (saveTenantId) {
                saveSport = await resolveClubSport(sb, saveTenantId, saveTeamId, saveReproChildId, sport || null);
            }

            const resolved = typeof eje === 'string' && eje !== '_pending';

            // Resolve the child (re-profile existing or create new).
            let saveChildId: string;
            if (saveReproChildId) {
                const { data: childRow } = await sb.from('children')
                    .select('id, tenant_id, archived_at, deleted_at, merged_into')
                    .eq('id', saveReproChildId).maybeSingle();
                if (!childRow || childRow.tenant_id !== saveTenantId || childRow.archived_at || childRow.deleted_at || childRow.merged_into) {
                    return res.status(403).json({ error: 'child_inactive' });
                }
                saveChildId = saveReproChildId;
            } else {
                const { data: childRow, error: childErr } = await sb.from('children').insert({
                    tenant_id:  saveTenantId,
                    adult_name,
                    adult_email,
                    child_name,
                    child_age:  typeof child_age === 'number' ? child_age : null,
                    sport:      saveSport,
                    lang:       lang ?? 'es',
                    is_demo:    is_demo === true,
                }).select('id').single();
                if (childErr || !childRow) {
                    console.error('[session:save] child insert error:', childErr?.message);
                    return res.status(500).json({ error: childErr?.message ?? 'child_create_failed' });
                }
                saveChildId = childRow.id;
            }

            const save_share_token = randomBytes(16).toString('hex');
            const sealSave = sealV4(report_v4, evidence_ficha, child_name, lang ?? 'es');
            const { data: saveData, error } = await sb.from('perfilamientos').insert({
                child_id:         saveChildId,
                adult_name,
                adult_email,
                child_name,
                child_age:        typeof child_age === 'number' ? child_age : null,
                sport:            saveSport,
                eje,
                motor,
                archetype_label,
                eje_secundario:   eje_secundario ?? null,
                tenant_id:        saveTenantId,
                lang:             lang ?? 'es',
                answers:          answers ?? [],
                ai_tokens_input:  ai_tokens_input ?? 0,
                ai_tokens_output: ai_tokens_output ?? 0,
                ai_cost_usd:      ai_cost_usd ?? 0,
                ai_sections:      ai_sections ?? null,
                game_metrics:     game_metrics ?? null,
                question_version: question_version ?? null,
                status:           resolved ? 'resolved' : 'in_flight',
                share_token:      save_share_token,
                is_demo:          is_demo === true,
                // v4 method (additive; NULL for legacy callers). report_status is sealed ONLY by the
                // server gate (sealV4), never from the client; NULL unless V4_SEAL is 'on'.
                evidence_ficha:   evidence_ficha ?? null,
                report_v4:        report_v4 ?? null,
                report_qc:        report_qc ?? null,
                report_status:    sealSave.report_status,
                held_reason:      sealSave.held_reason,
                held_at:          sealSave.report_status === 'held' ? new Date().toISOString() : null,
            }).select('id, share_token').single();

            if (error || !saveData) {
                console.error('[session:save] Insert error:', error?.message, error?.details);
                if (!saveReproChildId) await sb.from('children').delete().eq('id', saveChildId);
                return res.status(500).json({ error: error?.message ?? 'perfilamiento_create_failed' });
            }

            await ensureTeamMembership(sb, saveTeamId, saveChildId);

            if (resolved) {
                await logActivity(sb, {
                    area: 'producto', action: 'session_completed', sourceType: 'system', severity: 'info',
                    resourceType: 'session', resourceId: String(saveData.id),
                    reason: { session_id: saveData.id, child_id: saveChildId, eje, motor, tenant_id: saveTenantId },
                    relatedLogs: [`perfilamientos.${saveData.id}`],
                });
                await maybeGrantTenantFreePuente(sb, {
                    id: String(saveData.id),
                    tenantId: saveTenantId,
                    adultEmail: adult_email ?? null,
                    adultName: adult_name ?? null,
                    childName: child_name ?? null,
                    lang: lang ?? null,
                    isDemo: is_demo === true,
                });
            }

            return res.status(200).json({ ok: true, id: saveData.id, share_token: saveData.share_token, child_id: saveChildId });
        }

        return res.status(400).json({ error: `Unknown action: ${action}` });
    } catch (err) {
        console.error('[session] Unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
