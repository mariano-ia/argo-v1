import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

/**
 * ArgoOne® mini-panel API.
 * Auth: via access_token query param (magic link, no Supabase auth).
 *
 * GET  /api/one-panel?token=xxx  → ALL paid purchases + links for the token's email
 * POST /api/one-panel?token=xxx  { action: "generate-link", link_id, recipient_email, child_name?, sport }
 * POST /api/one-panel            { action: "request-access", email }  → emails a fresh magic link (no token needed)
 *
 * The panel is unified by EMAIL: any of a buyer's access tokens resolves to the
 * full set of their purchases, so "buy more" adds slots to the same panel.
 */

function clientIp(req: VercelRequest): string {
    const fwd = req.headers['x-forwarded-for'];
    const raw = Array.isArray(fwd) ? fwd[0] : (fwd ?? '');
    return raw.split(',')[0].trim() || 'unknown';
}

// Fixed-window rate limit via Vercel KV (Upstash REST). Fail-open if KV isn't
// configured (KV_REST_API_URL / KV_REST_API_TOKEN).
async function rateLimited(key: string, limit: number, windowSec: number): Promise<boolean> {
    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return false;
    try {
        const incr = await fetch(`${url}/incr/${encodeURIComponent(key)}`, { headers: { Authorization: `Bearer ${token}` } });
        const { result } = await incr.json();
        if (result === 1) {
            await fetch(`${url}/expire/${encodeURIComponent(key)}/${windowSec}`, { headers: { Authorization: `Bearer ${token}` } });
        }
        return typeof result === 'number' && result > limit;
    } catch {
        return false; // fail open — never block legit traffic on a KV hiccup
    }
}

// Emails a fresh magic link to the buyer's panel (access recovery).
async function sendAccessLinkEmail(email: string, accessToken: string, lang: string): Promise<void> {
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) return;
    const origin = process.env.SITE_URL || 'https://argomethod.com';
    const panelUrl = `${origin}/one/panel?token=${accessToken}`;
    // Buyer-neutral: the panel is now reached by a BUYER (play links + reports)
    // OR an authorizing adult (their bridges). The copy must not promise
    // buyer-only capabilities (frozen model §2 gives the authorizer a panel too).
    const PL = lang === 'en' ? {
        subject: 'Your ArgoOne® access link',
        heading: 'Here is your access link',
        body: 'Open your panel to see everything that is yours in one place.',
        cta: 'Open my panel',
        note: 'This link is personal. If you did not request it, you can ignore this email.',
    } : lang === 'pt' ? {
        subject: 'Seu link de acesso ao ArgoOne®',
        heading: 'Aqui está seu link de acesso',
        body: 'Abra seu painel para ver tudo o que é seu em um só lugar.',
        cta: 'Abrir meu painel',
        note: 'Este link é pessoal. Se você não o solicitou, pode ignorar este email.',
    } : {
        subject: 'Tu link de acceso a ArgoOne®',
        heading: 'Aquí está tu link de acceso',
        body: 'Abre tu panel para ver todo lo tuyo en un solo lugar.',
        cta: 'Abrir mi panel',
        note: 'Este link es personal. Si no lo solicitaste, puedes ignorar este email.',
    };
    await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            from: 'Argo Method <hola@argomethod.com>',
            to: [email],
            subject: PL.subject,
            html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F5F5F7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F7;padding:32px 16px;"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
<tr><td style="background:#1D1D1F;padding:24px 28px;">
    <span style="font-size:18px;color:#fff;font-weight:800;">Argo</span><span style="font-size:18px;color:#fff;font-weight:300;">One®</span>
</td></tr>
<tr><td style="padding:28px;">
    <h2 style="font-size:20px;font-weight:300;color:#1D1D1F;margin:0 0 8px;">${PL.heading}</h2>
    <p style="font-size:14px;color:#86868B;margin:0 0 24px;line-height:1.6;">${PL.body}</p>
    <div style="text-align:center;">
    <a href="${panelUrl}" style="display:inline-block;background:#955FB5;color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px;">${PL.cta}</a>
    </div>
    <p style="font-size:11px;color:#AEAEB2;margin:20px 0 0;text-align:center;">${PL.note}</p>
</td></tr>
</table></td></tr></table></body></html>`,
        }),
    });
}

/* ══════════════════════════════════════════════════════════════════════════
 * ArgoOne® fusion — HUB v2 (behind VITE_BRIDGES_V2)
 * ────────────────────────────────────────────────────────────────────────────
 * When VITE_BRIDGES_V2 is OFF this endpoint behaves EXACTLY as the v1 pack panel
 * below. When ON, GET resolves a state-adaptive hub BY EMAIL and returns a
 * { version: 2, ... } payload; the front branches on payload.version (backward-
 * compat BY SHAPE — old tokens/packs still render the v1 panel while the flag is
 * off). It reads children (by responsible_adult_email OR legacy adult_email),
 * their current perfilamiento, this email's bridges, and the buyer's one_links.
 * All helpers are INLINE (serverless: no cross-api and no src/ imports).
 * ════════════════════════════════════════════════════════════════════════════ */

// Accept the client ('1') and server ('on'/'true') truthy conventions so a single
// Vercel env value gates BOTH the front (import.meta.env, build-time) and this
// serverless read (process.env, runtime).
function bridgesV2On(): boolean {
    const v = (process.env.VITE_BRIDGES_V2 || '').trim().toLowerCase();
    return v === '1' || v === 'on' || v === 'true';
}

function normEmail(s: string | null | undefined): string {
    return (s || '').trim().toLowerCase();
}

// Escape LIKE metacharacters so a stored email with % or _ can't widen an ilike
// into a cross-account match (mirrors the v1 emailPattern logic).
function likeEscape(s: string): string {
    return s.replace(/([\\%_])/g, '\\$1');
}

function isStaleAt(expiresAt: string | null | undefined, nowMs: number): boolean {
    if (!expiresAt) return false;
    const t = Date.parse(expiresAt);
    return Number.isFinite(t) && t <= nowMs;
}

// A report is viewable when ready/sent (or legacy-null); held/pending => withheld.
function reportReady(status: string | null | undefined): boolean {
    return status == null || status === 'ready' || status === 'sent';
}

// One-line "Su motor" reading from a report_v4 blob: the section id 'motor',
// its bloque.cuerpo, markdown stripped, first sentence only. Null when absent.
function extractMotorLine(reportV4: unknown): string | null {
    try {
        const secs = (reportV4 as { secciones?: unknown[] })?.secciones;
        if (!Array.isArray(secs)) return null;
        const motor = secs.find((s) => s && (s as { id?: string }).id === 'motor') as { bloque?: { cuerpo?: unknown } } | undefined;
        const cuerpo = motor?.bloque?.cuerpo;
        if (typeof cuerpo !== 'string' || !cuerpo.trim()) return null;
        const plain = cuerpo.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
        const stop = plain.search(/\.(\s|$)/);
        return (stop > 0 ? plain.slice(0, stop + 1) : plain) || null;
    } catch { return null; }
}

interface HubReport {
    perfilamiento_id: string;
    status: string | null;
    ready: boolean;
    share_token: string | null;
    archetype_label: string | null;
    eje: string | null;
    motor_line: string | null;
    expires_at: string | null;
    is_stale: boolean;
}
interface HubBridge {
    status: string | null;
    ready: boolean;
    expires_at: string | null;
    is_stale: boolean;
}
interface HubChild {
    key: string;
    child_id: string | null;
    perfilamiento_id: string | null;
    name: string | null;
    age: number | null;
    sport: string | null;
    report: HubReport | null;
    is_buyer: boolean;
    is_responsible: boolean;
    is_invited: boolean;
    my_bridge: HubBridge | null;
    play_link: { slug: string; status: string } | null;
    deletion_id: string | null;
    // The included $12.99 comp: when the viewer holds a paid comp puente toward
    // this child's perfilamiento, they create their bridge FREE (not $4.99).
    comp_token: string | null;
    // Magic token of the viewer's paid puente purchase toward this child. The
    // /puentes/:token viewer handles every state (questionnaire, generating,
    // report), so "Ver mi puente" always links here.
    bridge_token: string | null;
    // Dead field (frozen model §8): per-email invitations are retired. Kept as
    // an always-empty array so older clients render nothing.
    invites: { email: string; status: string }[];
    // The child's ONE shareable bridges-link token (frozen model §4). Only set
    // for the authorizing adult (is_responsible); NULL until first minted via
    // the share-bridge-link action.
    bridge_link: string | null;
    // Adults who created their bridge with this child (distinct by email, every
    // perfilamiento). Only computed for is_responsible children.
    linked_adults: number;
}

// Canonical axis archetype names (es), per docs/archetype-naming.md. Used as the
// chip fallback for legacy rows: the old [Eje][Motor] compounds stored in
// archetype_label ("Sostén Confiable", "Impulsor Rítmico") are FORBIDDEN in the
// new canon and must not be displayed.
const AXIS_CANONICAL: Record<string, string> = { D: 'Impulsor', I: 'Conector', S: 'Sostenedor', C: 'Estratega' };

/* eslint-disable @typescript-eslint/no-explicit-any */
function buildReport(perf: any, nowMs: number): HubReport | null {
    if (!perf) return null;
    const ready = reportReady(perf.report_status);
    // Chip label: the v4 blend name when the row has one; else the CANONICAL axis
    // name derived from eje (never the retired compound in archetype_label).
    const label = (perf.report_v4?.hero?.arquetipoLabel as string | undefined)
        ?? (perf.eje ? AXIS_CANONICAL[perf.eje] ?? null : null)
        ?? perf.archetype_label ?? null;
    return {
        perfilamiento_id: perf.id,
        status: perf.report_status ?? null,
        ready,
        share_token: perf.share_token ?? null,
        archetype_label: label,
        eje: perf.eje ?? null,
        motor_line: ready ? extractMotorLine(perf.report_v4) : null,
        expires_at: perf.expires_at ?? null,
        is_stale: isStaleAt(perf.expires_at, nowMs),
    };
}

function buildBridge(b: any, nowMs: number): HubBridge {
    const s = b.status ?? null;
    return {
        status: s,
        // 'generated' = the bridge report exists (mirrors the puentes_sessions
        // ready test below). Its omission left a fully generated bridge showing
        // "Continuar mi puente" instead of "Ver mi puente".
        ready: s === 'ready' || s === 'sent' || s === 'completed' || s === 'generated',
        expires_at: b.expires_at ?? null,
        is_stale: isStaleAt(b.expires_at, nowMs),
    };
}

// Resolve the full state-adaptive hub for an email. In shadow (flags OFF on the
// write side) bridges/adult_profiles are empty and new children carry NULL
// responsible_adult_email — the by-EMAIL reads just come back empty, which is why
// the front is exercised via ?demo=<state> and real data fills in over later lotes.
async function buildHubPayload(sb: any, email: string, lang: string, nowMs: number): Promise<any> {
    const esc = likeEscape(email);

    // ── buyer path: paid purchases + their links ──
    const { data: purchases } = await sb
        .from('one_purchases')
        .select('id')
        .ilike('email', esc)
        .eq('payment_status', 'paid');
    const purchaseIds = (purchases ?? []).map((p: any) => p.id);
    let links: any[] = [];
    if (purchaseIds.length) {
        const { data } = await sb
            .from('one_links')
            .select('id, slug, status, recipient_email, child_name, sport, completed_at, session_id, child_id')
            .in('purchase_id', purchaseIds)
            .order('created_at', { ascending: true });
        links = data ?? [];
    }

    // ── owned children (responsible OR legacy adult email), not deleted ──
    const [respRes, adultRes] = await Promise.all([
        sb.from('children').select('id, child_name, child_age, sport, deletion_id, bridge_link_token').ilike('responsible_adult_email', esc).is('deleted_at', null),
        sb.from('children').select('id, child_name, child_age, sport, deletion_id, bridge_link_token').ilike('adult_email', esc).is('deleted_at', null),
    ]);
    // Fail LOUD, never silent: a swallowed error here (e.g. a missing column
    // after a bad deploy) would drop every owned child from the hub with a 200,
    // invisible to the 5xx probe. Throwing surfaces it as a 500 that qa-monitor
    // CHECK 8 catches.
    if (respRes.error || adultRes.error) {
        throw new Error(`hub owned-children query failed: ${respRes.error?.message || adultRes.error?.message}`);
    }
    const ownedById = new Map<string, any>();
    for (const c of [...(respRes.data ?? []), ...(adultRes.data ?? [])]) ownedById.set(c.id, c);
    const ownedChildren = [...ownedById.values()];

    // ── this email's bridges (empty in shadow until M8 backfill / B11 dual-write) ──
    const { data: bridgeRows } = await sb
        .from('bridges')
        .select('id, perfilamiento_id, status, expires_at')
        .ilike('adult_email', esc);
    const bridges = bridgeRows ?? [];

    // ── perfilamientos: latest resolved per owned child + explicit ids from links/bridges ──
    const perfCols = 'id, child_id, child_name, child_age, sport, eje, eje_secundario, archetype_label, report_status, share_token, expires_at, report_v4, last_profiled_at, status';
    const perfById = new Map<string, any>();
    const latestByChild = new Map<string, any>();
    const ownedIds = ownedChildren.map((c) => c.id);
    if (ownedIds.length) {
        // Mirror the canonical current_perfilamiento view: latest RESOLVED, not
        // deleted, picked by created_at DESC (last_profiled_at is NULL for the
        // general/tenant save path and sorts NULLS FIRST, which would surface a
        // stale report as "current").
        const { data } = await sb.from('perfilamientos').select(perfCols).in('child_id', ownedIds).eq('status', 'resolved').is('deleted_at', null).order('created_at', { ascending: false });
        for (const p of data ?? []) {
            perfById.set(p.id, p);
            if (p.child_id && !latestByChild.has(p.child_id)) latestByChild.set(p.child_id, p);
        }
    }
    const explicitIds = [
        ...links.filter((l) => l.status === 'completed' && l.session_id).map((l) => l.session_id),
        ...bridges.map((b: any) => b.perfilamiento_id).filter(Boolean),
    ].filter((id, i, a) => id && a.indexOf(id) === i && !perfById.has(id));
    if (explicitIds.length) {
        const { data } = await sb.from('perfilamientos').select(perfCols).in('id', explicitIds).is('deleted_at', null);
        for (const p of data ?? []) perfById.set(p.id, p);
    }

    // ── assemble children keyed by child_id (or perf/link id when unbound) ──
    const map = new Map<string, HubChild>();
    const blank = (key: string): HubChild => {
        let hc = map.get(key);
        if (!hc) {
            hc = { key, child_id: null, perfilamiento_id: null, name: null, age: null, sport: null, report: null, is_buyer: false, is_responsible: false, is_invited: false, my_bridge: null, play_link: null, deletion_id: null, comp_token: null, bridge_token: null, invites: [], bridge_link: null, linked_adults: 0 };
            map.set(key, hc);
        }
        return hc;
    };

    for (const c of ownedChildren) {
        const hc = blank(c.id);
        hc.child_id = c.id;
        hc.name = c.child_name ?? hc.name;
        hc.age = c.child_age ?? hc.age;
        hc.sport = c.sport ?? hc.sport;
        hc.is_responsible = true;
        hc.deletion_id = c.deletion_id ?? null;
        hc.bridge_link = (c.bridge_link_token as string | null) ?? null;
        const perf = latestByChild.get(c.id);
        if (perf) { hc.perfilamiento_id = perf.id; hc.report = buildReport(perf, nowMs); }
    }

    for (const l of links) {
        if (l.status === 'completed' && l.session_id) {
            const perf = perfById.get(l.session_id);
            if (!perf) continue;
            const key = perf.child_id ?? `perf:${perf.id}`;
            const hc = blank(key);
            hc.child_id = hc.child_id ?? perf.child_id ?? null;
            hc.name = hc.name ?? perf.child_name ?? null;
            hc.age = hc.age ?? perf.child_age ?? null;
            hc.sport = hc.sport ?? perf.sport ?? null;
            hc.perfilamiento_id = hc.perfilamiento_id ?? perf.id;
            hc.report = hc.report ?? buildReport(perf, nowMs);
            hc.is_buyer = true;
        } else if (l.status === 'available' || l.status === 'sent' || l.status === 'pending') {
            const hc = blank(`link:${l.id}`);
            hc.is_buyer = true;
            hc.play_link = { slug: l.slug, status: l.status };
            hc.name = hc.name ?? l.child_name ?? null;
            hc.sport = hc.sport ?? l.sport ?? null;
        }
    }

    for (const b of bridges) {
        const perf = perfById.get(b.perfilamiento_id);
        if (!perf) continue;
        const key = perf.child_id ?? `perf:${perf.id}`;
        const hc = blank(key);
        if (!hc.perfilamiento_id) {
            hc.child_id = hc.child_id ?? perf.child_id ?? null;
            hc.name = hc.name ?? perf.child_name ?? null;
            hc.age = hc.age ?? perf.child_age ?? null;
            hc.sport = hc.sport ?? perf.sport ?? null;
            hc.perfilamiento_id = perf.id;
            // ENTITLEMENT CUT (frozen model 2026-07-10, ARGOONE-DECISIONES.md §3):
            // a $4.99 bridge gives ONLY the bridge. A child reached exclusively via
            // a bridge carries NO report (no share_token, no archetype, no motor):
            // the individual report belongs to the buyer and the authorizing adult.
        }
        hc.my_bridge = buildBridge(b, nowMs);
    }

    const children = [...map.values()];
    // Invited = reachable ONLY via a bridge (not owner, not buyer) => read-only.
    for (const hc of children) hc.is_invited = !hc.is_responsible && !hc.is_buyer && !!hc.my_bridge;

    // The viewer's paid puente purchases (comps AND bought add-ons). They carry
    // the magic_token that opens the /puentes/:token viewer for every state, and
    // — while the shadow `bridges` table is unpopulated (dual-write off / M8 not
    // run) — their puentes_sessions are the LEGACY source of the bridge state, so
    // the hub shows real puentes today.
    const { data: pps } = await sb
        .from('puentes_purchases')
        .select('id, source_session_id, magic_token, provider, created_at')
        .ilike('recipient_email', esc)
        .eq('status', 'paid');
    const ppRows = pps ?? [];
    const ppIds = ppRows.map((p: any) => p.id);
    const tokenByPurchase = new Map<string, string>();
    for (const p of ppRows) if (p.magic_token) tokenByPurchase.set(p.id, p.magic_token);

    // ALL legacy sessions of those purchases. A pre-L0 fan-out purchase carries
    // several sessions (one per sibling child), each with its OWN
    // source_session_id — so the bridge state must be keyed per SESSION, never
    // per purchase (keying per purchase hid siblings' live bridges and let the
    // hub re-offer a $4.99 the adult already owned). Deterministic order.
    const compByPerf = new Map<string, string>();
    const tokenByPerf = new Map<string, string>();
    const readyByPerf = new Map<string, HubBridge>();
    const pendingByPerf = new Map<string, HubBridge>();
    // Purchase-anchored pass first: covers comps/purchases whose session doesn't
    // exist yet (e.g. an unmaterialized comp).
    for (const p of ppRows) {
        if (!p.source_session_id || !p.magic_token) continue;
        if (!tokenByPerf.has(p.source_session_id)) tokenByPerf.set(p.source_session_id, p.magic_token);
        if (p.provider === 'comp') compByPerf.set(p.source_session_id, p.magic_token);
    }
    if (ppIds.length) {
        const { data: pSess } = await sb
            .from('puentes_sessions')
            .select('purchase_id, source_session_id, status, ai_sections, created_at')
            .in('purchase_id', ppIds)
            .order('created_at', { ascending: false });
        for (const s of pSess ?? []) {
            const perfId = s.source_session_id;
            const token = tokenByPurchase.get(s.purchase_id);
            if (!perfId) continue;
            if (token) tokenByPerf.set(perfId, token);
            if (s.ai_sections && (s.status === 'generated' || s.status === 'sent')) {
                // A generated/sent session = a live bridge. Legacy expiry = session
                // created_at + 6 months (mirrors the M8 backfill interval).
                if (!readyByPerf.has(perfId)) {
                    const created = Date.parse(s.created_at ?? '');
                    const expMs = Number.isFinite(created) ? created + 183 * 24 * 3600 * 1000 : NaN;
                    readyByPerf.set(perfId, {
                        status: s.status,
                        ready: true,
                        expires_at: Number.isFinite(expMs) ? new Date(expMs).toISOString() : null,
                        is_stale: Number.isFinite(expMs) ? expMs <= nowMs : false,
                    });
                }
            } else if (!pendingByPerf.has(perfId)) {
                // Paid but not generated yet (created/answered/generating/failed):
                // an IN-PROGRESS bridge — the hub must offer to continue it, never
                // to buy it again.
                pendingByPerf.set(perfId, { status: s.status ?? 'created', ready: false, expires_at: null, is_stale: false });
            }
        }
    }
    for (const hc of children) {
        if (!hc.perfilamiento_id) continue;
        hc.comp_token = compByPerf.get(hc.perfilamiento_id) ?? null;
        hc.bridge_token = tokenByPerf.get(hc.perfilamiento_id) ?? null;
        // puentes_sessions is the source of truth for generation state. The
        // bridges table (M8 dual-write) can lag at 'answered' after the bridge
        // actually generated, so a READY session must win over a not-ready
        // bridges row — otherwise a finished bridge shows "Continuar mi puente".
        const fromSessions = readyByPerf.get(hc.perfilamiento_id) ?? pendingByPerf.get(hc.perfilamiento_id) ?? null;
        if (!hc.my_bridge) hc.my_bridge = fromSessions;
        else if (!hc.my_bridge.ready && fromSessions?.ready) hc.my_bridge = fromSessions;
    }

    // Linked adults per owned child (frozen model §4: the "Adultos vinculados"
    // list): distinct-by-email paid bridges toward ANY perfilamiento of the
    // child, excluding the viewer. (Replaces the retired bridge_invites
    // "invitaste a X · pendiente" producer — §8 kills that state.)
    {
        const perfToChild = new Map<string, string>();
        for (const p of perfById.values()) {
            if (p.child_id && ownedById.has(p.child_id)) perfToChild.set(p.id, p.child_id);
        }
        const perfIds = [...perfToChild.keys()];
        if (perfIds.length) {
            const viewerKey = email.trim().toLowerCase();
            const emailsByChild = new Map<string, Set<string>>();
            const add = (perfId: string, adultEmail: string | null) => {
                const childId = perfToChild.get(perfId);
                const k = (adultEmail ?? '').trim().toLowerCase();
                if (!childId || !k || k === viewerKey) return;
                const set = emailsByChild.get(childId) ?? new Set<string>();
                set.add(k);
                emailsByChild.set(childId, set);
            };
            const [{ data: paidPps }, { data: brRows }] = await Promise.all([
                sb.from('puentes_purchases').select('source_session_id, recipient_email').in('source_session_id', perfIds).eq('status', 'paid'),
                sb.from('bridges').select('perfilamiento_id, adult_email').in('perfilamiento_id', perfIds),
            ]);
            for (const p of paidPps ?? []) add(p.source_session_id, p.recipient_email);
            for (const b of brRows ?? []) add(b.perfilamiento_id, b.adult_email);
            for (const hc of children) {
                if (hc.child_id && hc.is_responsible) hc.linked_adults = emailsByChild.get(hc.child_id)?.size ?? 0;
            }
        }
    }

    // Pre-mint the bridges-link token for each authorizing adult's PLAYED child,
    // so the payload always carries `bridge_link`. This lets the front copy the
    // link SYNCHRONOUSLY inside the click gesture (WebKit rejects clipboard
    // writes after an await), and keeps the token stable/idempotent. Only for
    // is_responsible children with a resolved perfilamiento; the token is
    // bridge-only, so pre-existence leaks nothing until the adult shares it.
    {
        const toMint = children.filter((hc) => hc.is_responsible && hc.child_id && hc.perfilamiento_id && !hc.bridge_link);
        for (const hc of toMint) {
            const fresh = crypto.randomBytes(18).toString('base64url');
            const { error } = await sb
                .from('children')
                .update({ bridge_link_token: fresh })
                .eq('id', hc.child_id as string)
                .is('bridge_link_token', null);
            if (error) continue;               // lost race / transient: leave null, front falls back to the action
            const { data: again } = await sb.from('children').select('bridge_link_token').eq('id', hc.child_id as string).maybeSingle();
            hc.bridge_link = (again?.bridge_link_token as string | null) ?? fresh;
        }
    }

    const availableSlots = links.filter((l) => l.status === 'available').length;
    const ownedPlayed = children.filter((c) => (c.is_responsible || c.is_buyer) && c.perfilamiento_id);
    const invited = children.filter((c) => c.is_invited);
    const hasBuyerPending = children.some((c) => c.is_buyer && c.play_link);

    let role: string;
    if (children.length === 0) role = 'empty';
    else if (ownedPlayed.length === 0 && invited.length && !hasBuyerPending) role = 'invited_adult';
    else if (ownedPlayed.length === 0 && hasBuyerPending) role = 'buyer_no_child_yet';
    else if (ownedPlayed.length <= 1 && !invited.length) role = 'one_and_done';
    else role = 'family';

    // Academy CTA is gated by SCALE, never shown to plain families (owner rule).
    // ArgoOne® standalone has no coach signal, so child count is the scale proxy.
    const distinctOwned = new Set(children.filter((c) => c.is_responsible || c.is_buyer).map((c) => c.child_id ?? c.key)).size;
    const canUpgradeAcademy = distinctOwned >= 3;

    return { version: 2, email, lang, role, children, available_slots: availableSlots, can_upgrade_academy: canUpgradeAcademy };
}

// Re-send the ArgoOne® play-link email (v2 resend-play-link). Mirrors the v1
// generate-link email body; kept as its own helper so v1 stays byte-identical.
async function sendPlayLinkEmail(email: string, slug: string, childName: string | null, lang: string, origin: string): Promise<void> {
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) return;
    const playUrl = `${origin}/one/${slug}`;
    const child = childName || (lang === 'en' ? 'the child' : lang === 'pt' ? 'a criança' : 'el niño');
    const PL = lang === 'en' ? {
        subject: `ArgoOne®: ${child}'s experience is ready`,
        heading: `${child}'s experience is ready`,
        body1: `Someone invited ${child} to play an interactive adventure of under 10 minutes. When it ends, you'll receive a personalized behavioral profile report at this email.`,
        body2: 'Complete the registration, hand the device to the athlete, and you are done.',
        cta: 'Start the experience',
        note: 'This link is single-use. Once the experience is completed, it cannot be used again.',
    } : lang === 'pt' ? {
        subject: `ArgoOne®: a experiência de ${child} está pronta`,
        heading: `A experiência de ${child} está pronta`,
        body1: `Alguém convidou ${child} para jogar uma aventura interativa de menos de 10 minutos. Ao terminar, você receberá um relatório de perfil comportamental personalizado neste email.`,
        body2: 'Complete o registro, passe o dispositivo ao atleta, e pronto.',
        cta: 'Começar a experiência',
        note: 'Este link é de uso único. Uma vez completada a experiência, não poderá ser usado novamente.',
    } : {
        subject: `ArgoOne®: la experiencia de ${child} está lista`,
        heading: `La experiencia de ${child} está lista`,
        body1: `Alguien te invitó a que ${child} juegue una aventura interactiva de menos de 10 minutos. Al terminar, recibirás un informe de perfil conductual personalizado en este email.`,
        body2: 'Completa el registro, pásale el dispositivo al deportista, y listo.',
        cta: 'Comenzar la experiencia',
        note: 'Este link es de un solo uso. Una vez completada la experiencia, no podrá volver a usarse.',
    };
    await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            from: 'Argo Method <hola@argomethod.com>',
            to: [email],
            subject: PL.subject,
            html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F5F5F7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F7;padding:32px 16px;"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
<tr><td style="background:#1D1D1F;padding:24px 28px;">
    <span style="font-size:18px;color:#fff;font-weight:800;">Argo</span><span style="font-size:18px;color:#fff;font-weight:300;">One®</span>
</td></tr>
<tr><td style="padding:28px;">
    <h2 style="font-size:20px;font-weight:300;color:#1D1D1F;margin:0 0 8px;">${PL.heading}</h2>
    <p style="font-size:14px;color:#86868B;margin:0 0 8px;">${PL.body1}</p>
    <p style="font-size:14px;color:#86868B;margin:0 0 24px;">${PL.body2}</p>
    <a href="${playUrl}" style="display:inline-block;background:#955FB5;color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px;">${PL.cta}</a>
    <p style="font-size:11px;color:#AEAEB2;margin:20px 0 0;">${PL.note}</p>
</td></tr>
</table></td></tr></table></body></html>`,
        }),
    });
}

// (invite-adult email retired — frozen model §8: the per-email invitation is
// superseded by the child's ONE shareable bridges-link; see share-bridge-link.)

/* eslint-enable @typescript-eslint/no-explicit-any */

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });

    const sb = createClient(supabaseUrl, serviceKey);

    // ── POST request-access: email a fresh magic link (NO token needed) ──────
    // Anti-enumeration: ALWAYS return { ok: true } whether or not the email has
    // purchases, so this endpoint can't be used to probe who bought.
    if (req.method === 'POST' && req.body?.action === 'request-access') {
        const email = String(req.body.email || '').trim().toLowerCase();
        const ip = clientIp(req);
        // Cap per IP and per email to prevent spamming a victim's inbox.
        const capped = (await rateLimited(`rl:one-access:ip:${ip}`, 20, 3600))
            || (email && await rateLimited(`rl:one-access:email:${email}`, 5, 3600));
        if (!capped && email && /.+@.+\..+/.test(email)) {
            const esc = email.replace(/([\\%_])/g, '\\$1');
            // 1) A buyer: paid one_purchases token.
            const { data: p } = await sb
                .from('one_purchases')
                .select('access_token, lang')
                .ilike('email', esc)
                .eq('payment_status', 'paid')
                .order('paid_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            if (p?.access_token) {
                await sendAccessLinkEmail(email, p.access_token, (p.lang as string) || 'es');
            } else if (bridgesV2On()) {
                // 2) An adult identity (frozen model §2: identity = email). An
                // adult who already has a profile (did a bridge) enters with its
                // token; an adult who ONLY authorized a child (coach case, no
                // purchase, no bridge yet) gets a minimal profile row minted so
                // they can reach their panel to share the bridges-link. Both are
                // gated on being a REAL authorizer, so this never mints for a
                // random email.
                const { data: ap } = await sb
                    .from('adult_profiles')
                    .select('access_token, lang')
                    .ilike('email', esc)
                    .maybeSingle();
                let apToken = ap?.access_token as string | undefined;
                let apLang = (ap?.lang as string) || 'es';
                if (!apToken) {
                    const { data: kid } = await sb
                        .from('children')
                        .select('id, lang')
                        .ilike('responsible_adult_email', esc)
                        .is('deleted_at', null)
                        .limit(1)
                        .maybeSingle();
                    if (kid) {
                        apLang = (kid.lang as string) || 'es';
                        const { data: ins } = await sb
                            .from('adult_profiles')
                            .insert({ email, lang: apLang })
                            .select('access_token')
                            .maybeSingle();
                        apToken = ins?.access_token as string | undefined;
                        if (!apToken) {
                            // Lost the unique-email race → re-read the winner.
                            const { data: again } = await sb.from('adult_profiles').select('access_token').ilike('email', esc).maybeSingle();
                            apToken = again?.access_token as string | undefined;
                        }
                    }
                }
                if (apToken) await sendAccessLinkEmail(email, apToken, apLang);
            }
        }
        return res.status(200).json({ ok: true });
    }

    const token = req.query.token as string;
    if (!token) return res.status(401).json({ error: 'Missing access token' });

    // ══ ArgoOne® fusion HUB v2 (behind VITE_BRIDGES_V2) ═══════════════════════
    // Self-contained branch: resolves the viewer's email from EITHER a
    // one_purchases OR an adult_profiles access_token (both 64-hex), returns the
    // { version: 2 } hub on GET, and handles the 4 inline sub-actions on POST.
    // The two paid actions (start-replay $12.99 / refresh-bridge $4.99) are posted
    // by the front directly to one-checkout / puentes-checkout. When the flag is
    // off this whole block is skipped and the v1 pack panel below runs unchanged.
    if (bridgesV2On()) {
        let email: string | null = null;
        let vLang = 'es';
        let purchaseUnpaid = false;
        const { data: op } = await sb
            .from('one_purchases')
            .select('email, lang, payment_status')
            .eq('access_token', token)
            .maybeSingle();
        if (op?.email) { email = op.email; vLang = (op.lang as string) || 'es'; purchaseUnpaid = op.payment_status !== 'paid'; }
        if (!email) {
            const { data: ap } = await sb
                .from('adult_profiles')
                .select('email, lang')
                .eq('access_token', token)
                .maybeSingle();
            if (ap?.email) { email = ap.email; vLang = (ap.lang as string) || 'es'; }
        }
        if (!email) return res.status(404).json({ error: 'Purchase not found' });
        // An unconfirmed one_purchases token keeps the v1 "confirming" polling UX.
        if (op && purchaseUnpaid) return res.status(403).json({ error: 'Payment not confirmed' });

        const nowMs = Date.now();
        const origin = process.env.SITE_URL || 'https://argomethod.com';

        if (req.method === 'GET') {
            const payload = await buildHubPayload(sb, email, vLang, nowMs);
            return res.status(200).json(payload);
        }

        const { action } = req.body ?? {};

        // Owner check shared by the bridges-link sub-actions: only the child's
        // authorizing adult (responsible_adult_email; adult_email = the legacy
        // same-person column) may share, rotate or inspect the bridges link.
        // A buyer who is NOT the authorizer (coach case) never passes it (§7).
        const loadOwnedChild = async (childId: string) => {
            const { data: child, error } = await sb
                .from('children')
                .select('id, child_name, responsible_adult_email, adult_email, bridge_link_token')
                .eq('id', childId)
                .is('deleted_at', null)
                .maybeSingle();
            // A DB error must NOT masquerade as "not authorized" (that would hide
            // a 500-class fault as a 403). Throw → surfaces as a real error.
            if (error) throw new Error(`loadOwnedChild failed: ${error.message}`);
            if (!child) return null;
            const owns = normEmail(child.responsible_adult_email) === normEmail(email) || normEmail(child.adult_email) === normEmail(email);
            return owns ? child : null;
        };

        // ── invite-adult (RETIRED, frozen model §8): the per-email invitation is
        //    superseded by the child's ONE shareable bridges-link. ──
        if (action === 'invite-adult') {
            return res.status(410).json({ error: 'superseded_by_bridge_link' });
        }

        // ── share-bridge-link: mint (lazily) and return the child's ONE shareable
        //    bridges-link (§4). Idempotent: same token until revoked. ──
        if (action === 'share-bridge-link') {
            const childId = String(req.body.child_id || '');
            if (!childId) return res.status(400).json({ error: 'Missing child_id' });
            const child = await loadOwnedChild(childId);
            if (!child) return res.status(403).json({ error: 'not_authorized' });
            let linkToken = child.bridge_link_token as string | null;
            if (!linkToken) {
                linkToken = crypto.randomBytes(18).toString('base64url');
                const { error } = await sb
                    .from('children')
                    .update({ bridge_link_token: linkToken })
                    .eq('id', childId)
                    .is('bridge_link_token', null);
                if (error) return res.status(500).json({ error: 'Failed to mint link' });
                // Lost the mint race → re-read the winner's token.
                const { data: again } = await sb.from('children').select('bridge_link_token').eq('id', childId).maybeSingle();
                linkToken = (again?.bridge_link_token as string | null) ?? linkToken;
            }
            return res.status(200).json({ ok: true, url: `${origin}/puente/${linkToken}` });
        }

        // ── revoke-bridge-link: rotate the token. The old link dies; bridges
        //    already paid are unaffected (they live on their own magic tokens). ──
        if (action === 'revoke-bridge-link') {
            const childId = String(req.body.child_id || '');
            if (!childId) return res.status(400).json({ error: 'Missing child_id' });
            const child = await loadOwnedChild(childId);
            if (!child) return res.status(403).json({ error: 'not_authorized' });
            const fresh = crypto.randomBytes(18).toString('base64url');
            const { error } = await sb.from('children').update({ bridge_link_token: fresh }).eq('id', childId);
            if (error) return res.status(500).json({ error: 'Failed to rotate link' });
            return res.status(200).json({ ok: true, url: `${origin}/puente/${fresh}` });
        }

        // ── linked-adults: the adults who created their bridge with this child
        //    (paid $4.99 or comp), across every perfilamiento of the child. ──
        if (action === 'linked-adults') {
            const childId = String(req.body.child_id || '');
            if (!childId) return res.status(400).json({ error: 'Missing child_id' });
            const child = await loadOwnedChild(childId);
            if (!child) return res.status(403).json({ error: 'not_authorized' });
            // Mirror the hub's linked_adults count EXACTLY: RESOLVED perfilamientos
            // only, and exclude the viewer (the authorizing adult isn't a "linked
            // adult"). Otherwise the modal list and the card count disagree.
            const { data: perfs } = await sb
                .from('perfilamientos')
                .select('id')
                .eq('child_id', childId)
                .eq('status', 'resolved')
                .is('deleted_at', null);
            const perfIds = (perfs ?? []).map((p: { id: string }) => p.id);
            const viewerKey = normEmail(email);
            const byEmail = new Map<string, { email: string; name: string | null; created_at: string }>();
            if (perfIds.length) {
                const { data: pps2 } = await sb
                    .from('puentes_purchases')
                    .select('recipient_email, recipient_name, created_at')
                    .in('source_session_id', perfIds)
                    .eq('status', 'paid')
                    .order('created_at', { ascending: true });
                for (const p of pps2 ?? []) {
                    const k = normEmail(p.recipient_email);
                    if (k && k !== viewerKey && !byEmail.has(k)) byEmail.set(k, { email: p.recipient_email, name: p.recipient_name ?? null, created_at: p.created_at });
                }
                const { data: brs } = await sb
                    .from('bridges')
                    .select('adult_email, created_at')
                    .in('perfilamiento_id', perfIds)
                    .order('created_at', { ascending: true });
                for (const b of brs ?? []) {
                    const k = normEmail(b.adult_email);
                    if (k && k !== viewerKey && !byEmail.has(k)) byEmail.set(k, { email: b.adult_email, name: null, created_at: b.created_at });
                }
            }
            return res.status(200).json({ ok: true, adults: [...byEmail.values()] });
        }

        // ── resend-play-link: re-send the play email for a buyer's assigned slot ──
        if (action === 'resend-play-link') {
            const linkId = String(req.body.link_id || '');
            if (!linkId) return res.status(400).json({ error: 'Missing link_id' });
            // Throttle: a resend fires an email to a stored recipient, so cap it
            // per IP / per caller / per link (mirrors invite-adult) to prevent
            // email-bombing a third party from the transactional domain.
            const ip = clientIp(req);
            if ((await rateLimited(`rl:one-resend:ip:${ip}`, 30, 3600))
                || (await rateLimited(`rl:one-resend:email:${normEmail(email)}`, 20, 3600))
                || (await rateLimited(`rl:one-resend:link:${linkId}`, 5, 3600))) {
                return res.status(429).json({ error: 'rate_limited' });
            }
            const { data: purchases } = await sb
                .from('one_purchases')
                .select('id')
                .ilike('email', likeEscape(email))
                .eq('payment_status', 'paid');
            const pIds = (purchases ?? []).map((p: { id: string }) => p.id);
            const { data: link } = await sb
                .from('one_links')
                .select('id, slug, status, recipient_email, child_name, purchase_id')
                .eq('id', linkId)
                .maybeSingle();
            if (!link || !pIds.includes(link.purchase_id)) return res.status(404).json({ error: 'Link not found' });
            if (!link.recipient_email) return res.status(400).json({ error: 'no_recipient' });
            // Only a slot that was already assigned (sent/pending) can be resent.
            if (link.status !== 'sent' && link.status !== 'pending') return res.status(400).json({ error: 'not_resendable' });
            await sendPlayLinkEmail(link.recipient_email, link.slug, link.child_name || null, vLang, origin);
            return res.status(200).json({ ok: true });
        }

        // ── delete-child: hand back the /eliminar route (NON-destructive; the
        //    actual cascade delete is B15 / the F9 page). ──
        if (action === 'delete-child') {
            const childId = String(req.body.child_id || '');
            if (!childId) return res.status(400).json({ error: 'Missing child_id' });
            const { data: child } = await sb
                .from('children')
                .select('id, deletion_id, responsible_adult_email, adult_email')
                .eq('id', childId)
                .is('deleted_at', null)
                .maybeSingle();
            if (!child) return res.status(404).json({ error: 'Child not found' });
            const owns = normEmail(child.responsible_adult_email) === normEmail(email) || normEmail(child.adult_email) === normEmail(email);
            if (!owns) return res.status(403).json({ error: 'not_authorized' });
            return res.status(200).json({ ok: true, deletion_url: `${origin}/eliminar/${child.deletion_id}` });
        }

        // ── start-adult-profile: the standalone before-play adult questionnaire
        //    (F7 saved-no-child) is not wired yet, so return a pending marker. A
        //    comp toward an ALREADY-PLAYED child is surfaced by the hub directly as
        //    a /puentes/:comp_token link (see buildHubPayload comp_token), not here. ──
        if (action === 'start-adult-profile') {
            return res.status(200).json({ ok: true, pending: true, reason: 'questionnaire_not_available' });
        }

        return res.status(400).json({ error: 'Unknown action' });
    }

    // Validate token → the owning purchase → its email.
    const { data: purchase } = await sb
        .from('one_purchases')
        .select('id, email, payment_status, lang')
        .eq('access_token', token)
        .single();

    if (!purchase) return res.status(404).json({ error: 'Purchase not found' });
    if (purchase.payment_status !== 'paid') return res.status(403).json({ error: 'Payment not confirmed' });

    // Unify by email: every PAID purchase for this buyer's email.
    // Escape LIKE metacharacters so a stored email containing % or _ can't widen
    // this into a cross-buyer match; ilike on the escaped value is a case-
    // insensitive EXACT match (mirrors invite-user.ts / request-delete.ts).
    const emailPattern = purchase.email.replace(/([\\%_])/g, '\\$1');
    const { data: purchases } = await sb
        .from('one_purchases')
        .select('id, pack_size, paid_at')
        .ilike('email', emailPattern)
        .eq('payment_status', 'paid')
        .order('paid_at', { ascending: true });
    const purchaseIds = (purchases ?? []).map(p => p.id);
    const totalPack = (purchases ?? []).reduce((s, p) => s + (p.pack_size || 0), 0);
    const earliestPaid = (purchases ?? [])[0]?.paid_at ?? null;

    // ── GET: return aggregated purchase + links ──────────────────────────────
    if (req.method === 'GET') {
        const { data: links } = await sb
            .from('one_links')
            .select('id, slug, status, recipient_email, child_name, sport, completed_at, session_id')
            .in('purchase_id', purchaseIds)
            .order('created_at', { ascending: true });
        const L = links ?? [];

        // Attach report_token (perfilamiento.share_token) to completed links so the
        // panel can build a tokenized /report link. report.ts fails closed on a null
        // token, so the bare /report/:id link no longer works. (Audit 2026-07-06.)
        const sessionIds = L.filter(l => l.status === 'completed' && l.session_id).map(l => l.session_id);
        if (sessionIds.length > 0) {
            const { data: reports } = await sb
                .from('perfilamientos')
                .select('id, share_token, report_status')
                .in('id', sessionIds);
            const tokenById = new Map((reports ?? []).map(r => [r.id, r.share_token as string | null]));
            const statusById = new Map((reports ?? []).map(r => [r.id, r.report_status as string | null]));
            for (const l of L) {
                (l as Record<string, unknown>).report_token = l.session_id ? (tokenById.get(l.session_id) ?? null) : null;
                // report_status of the underlying perfilamiento (held/pending => "preparando" on the panel).
                (l as Record<string, unknown>).report_status = l.session_id ? (statusById.get(l.session_id) ?? null) : null;
            }
        }

        return res.status(200).json({
            purchase: {
                email: purchase.email,
                pack_size: totalPack,
                paid_at: earliestPaid,
            },
            links: L,
            summary: {
                total: totalPack,
                completed: L.filter(l => l.status === 'completed').length,
                pending: L.filter(l => l.status === 'pending' || l.status === 'sent').length,
                available: L.filter(l => l.status === 'available').length,
            },
        });
    }

    // ── POST: generate link ─────────────────────────────────────────────
    const { action, link_id, recipient_email, child_name, sport } = req.body ?? {};

    if (action === 'generate-link') {
        if (!link_id) return res.status(400).json({ error: 'Missing link_id' });
        if (!recipient_email) return res.status(400).json({ error: 'Missing recipient_email' });
        if (!sport || !String(sport).trim()) return res.status(400).json({ error: 'Missing sport' });

        // The link must belong to one of THIS email's purchases and be available.
        const { data: link } = await sb
            .from('one_links')
            .select('id, status, slug, purchase_id')
            .eq('id', link_id)
            .single();

        if (!link || !purchaseIds.includes(link.purchase_id)) return res.status(404).json({ error: 'Link not found' });
        if (link.status !== 'available') return res.status(400).json({ error: 'Link already used or sent' });

        // Update link with recipient info
        await sb.from('one_links').update({
            status: 'sent',
            recipient_email: recipient_email.trim(),
            child_name: child_name?.trim() || null,
            sport: String(sport).trim(),
            sent_at: new Date().toISOString(),
        }).eq('id', link_id);

        // Send play link email to recipient
        const origin = process.env.SITE_URL || 'https://argomethod.com';
        const playUrl = `${origin}/one/${link.slug}`;

        const resendKey = process.env.RESEND_API_KEY;
        if (resendKey) {
            const pl = (purchase.lang as string) || 'es';
            const childDisplay = child_name?.trim() || (pl === 'en' ? 'the child' : pl === 'pt' ? 'a criança' : 'el niño');
            const PL = pl === 'en' ? {
                subject: `ArgoOne®: ${childDisplay}'s experience is ready`,
                heading: `${childDisplay}'s experience is ready`,
                body1: `Someone invited ${childDisplay} to play an interactive adventure of under 10 minutes. When it ends, you'll receive a personalized behavioral profile report at this email.`,
                body2: 'Complete the registration, hand the device to the athlete, and you are done.',
                cta: 'Start the experience',
                note: 'This link is single-use. Once the experience is completed, it cannot be used again.',
            } : pl === 'pt' ? {
                subject: `ArgoOne®: a experiência de ${childDisplay} está pronta`,
                heading: `A experiência de ${childDisplay} está pronta`,
                body1: `Alguém convidou ${childDisplay} para jogar uma aventura interativa de menos de 10 minutos. Ao terminar, você receberá um relatório de perfil comportamental personalizado neste email.`,
                body2: 'Complete o registro, passe o dispositivo ao atleta, e pronto.',
                cta: 'Começar a experiência',
                note: 'Este link é de uso único. Uma vez completada a experiência, não poderá ser usado novamente.',
            } : {
                subject: `ArgoOne®: la experiencia de ${childDisplay} está lista`,
                heading: `La experiencia de ${childDisplay} está lista`,
                body1: `Alguien te invitó a que ${childDisplay} juegue una aventura interactiva de menos de 10 minutos. Al terminar, recibirás un informe de perfil conductual personalizado en este email.`,
                body2: 'Completa el registro, pásale el dispositivo al deportista, y listo.',
                cta: 'Comenzar la experiencia',
                note: 'Este link es de un solo uso. Una vez completada la experiencia, no podrá volver a usarse.',
            };
            await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from: 'Argo Method <hola@argomethod.com>',
                    to: [recipient_email.trim()],
                    subject: PL.subject,
                    html: `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F5F5F7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F7;padding:32px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
<tr><td style="background:#1D1D1F;padding:24px 28px;">
    <span style="font-size:18px;color:#fff;font-weight:800;">Argo</span><span style="font-size:18px;color:#fff;font-weight:300;">One®</span>
</td></tr>
<tr><td style="padding:28px;">
    <h2 style="font-size:20px;font-weight:300;color:#1D1D1F;margin:0 0 8px;">${PL.heading}</h2>
    <p style="font-size:14px;color:#86868B;margin:0 0 8px;">${PL.body1}</p>
    <p style="font-size:14px;color:#86868B;margin:0 0 24px;">${PL.body2}</p>
    <a href="${playUrl}" style="display:inline-block;background:#955FB5;color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px;">
        ${PL.cta}
    </a>
    <p style="font-size:11px;color:#AEAEB2;margin:20px 0 0;">${PL.note}</p>
</td></tr>
<tr><td style="background:#F5F5F7;padding:16px 28px;text-align:center;border-top:1px solid #E8E8ED;">
    <p style="font-size:11px;color:#AEAEB2;margin:0;">ArgoMethod® · Perfilamiento conductual para deportistas jóvenes</p>
</td></tr>
</table></td></tr></table>
</body></html>`,
                }),
            });
        }

        return res.status(200).json({
            ok: true,
            slug: link.slug,
            play_url: `${origin}/one/${link.slug}`,
        });
    }

    return res.status(400).json({ error: 'Unknown action' });
}
