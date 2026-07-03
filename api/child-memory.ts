import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * "Memoria del asistente" per child (M2, docs/ARGOCOACH-MEMORIA-NINO.md):
 * the coach's own view of what the assistant remembers about a child, with
 * full edit/delete control. Member-scoped: each member sees and manages ONLY
 * the memory built from their own consultations (owner = member_id null).
 * Nobody at Argo reads this; there are no flags and no audits by design.
 *
 * GET  ?child_id=<uuid>                      → { summary, updated_at, user_edited_at, events: [...] }
 * POST { action: 'update_summary', child_id, summary }
 * POST { action: 'delete', child_id }        → deletes summary + the caller's events
 */

// Inline (Vercel serverless can't import between api files) — mirrors tenant-chat.
async function resolveTenantContext(
    sb: any,
    userId: string,
    requestedTenantId: string | null,
): Promise<{ tenantId: string; memberId: string | null } | null> {
    if (requestedTenantId) {
        const { data: m } = await sb.from('tenant_members')
            .select('id, tenant_id')
            .eq('auth_user_id', userId)
            .eq('tenant_id', requestedTenantId)
            .eq('status', 'active')
            .maybeSingle();
        if (m) return { tenantId: (m as { tenant_id: string }).tenant_id, memberId: (m as { id: string }).id };
        const { data: t } = await sb.from('tenants').select('id').eq('id', requestedTenantId).eq('auth_user_id', userId).maybeSingle();
        if (t) return { tenantId: (t as { id: string }).id, memberId: null };
        return null;
    }
    const { data: m } = await sb.from('tenant_members')
        .select('id, tenant_id')
        .eq('auth_user_id', userId)
        .eq('status', 'active')
        .maybeSingle();
    if (m) return { tenantId: (m as { tenant_id: string }).tenant_id, memberId: (m as { id: string }).id };
    const { data: t } = await sb.from('tenants').select('id').eq('auth_user_id', userId).maybeSingle();
    if (t) return { tenantId: (t as { id: string }).id, memberId: null };
    return null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SUMMARY_MAX_CHARS = 1500;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing auth token' });
    const sb = createClient(supabaseUrl, serviceKey);

    try {
        const { data: { user }, error: authError } = await sb.auth.getUser(authHeader.replace('Bearer ', ''));
        if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

        const requestedTenantId = (typeof req.query.tenant_id === 'string' && req.query.tenant_id ? req.query.tenant_id : null)
            ?? (typeof req.body?.tenant_id === 'string' && req.body.tenant_id ? req.body.tenant_id : null);
        const ctx = await resolveTenantContext(sb, user.id, requestedTenantId);
        if (!ctx) return res.status(requestedTenantId ? 403 : 404).json({ error: requestedTenantId ? 'Not a member of this tenant' : 'Tenant not found' });

        const childId = (typeof req.query.child_id === 'string' && req.query.child_id ? req.query.child_id : null)
            ?? (typeof req.body?.child_id === 'string' && req.body.child_id ? req.body.child_id : null);
        if (!childId || !UUID_RE.test(childId)) return res.status(400).json({ error: 'child_id (uuid) required' });

        // The child must belong to the tenant (defense in depth).
        const { data: child } = await sb.from('children')
            .select('id')
            .eq('id', childId)
            .eq('tenant_id', ctx.tenantId)
            .maybeSingle();
        if (!child) return res.status(404).json({ error: 'Child not found' });

        // Caller's own memory scope (owner = null member). `any` keeps tsc from
        // exploding on deep PostgREST builder generics (same as tenant-chat).
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const memberScope = (q: any): any => (ctx.memberId ? q.eq('member_id', ctx.memberId) : q.is('member_id', null));

        if (req.method === 'GET') {
            const [memRes, evRes] = await Promise.all([
                memberScope(sb.from('child_memory')
                    .select('summary, updated_at, user_edited_at')
                    .eq('tenant_id', ctx.tenantId)
                    .eq('child_id', childId)).maybeSingle(),
                memberScope(sb.from('child_memory_events')
                    .select('content, advice, situation_id, updated_at, source')
                    .eq('tenant_id', ctx.tenantId)
                    .eq('child_id', childId))
                    .order('updated_at', { ascending: false })
                    .limit(10),
            ]);
            return res.status(200).json({
                summary: memRes.data?.summary ?? null,
                updated_at: memRes.data?.updated_at ?? null,
                user_edited_at: memRes.data?.user_edited_at ?? null,
                events: evRes.data ?? [],
            });
        }

        const action = req.body?.action;

        if (action === 'update_summary') {
            const raw = req.body?.summary;
            if (typeof raw !== 'string') return res.status(400).json({ error: 'summary (string) required' });
            const summary = raw.trim().slice(0, SUMMARY_MAX_CHARS);
            const { data: existing } = await memberScope(sb.from('child_memory')
                .select('id')
                .eq('tenant_id', ctx.tenantId)
                .eq('child_id', childId)).maybeSingle();
            const now = new Date().toISOString();
            if (summary.length === 0) {
                // Emptying the text deletes the summary row (but keeps events).
                if (existing) await sb.from('child_memory').delete().eq('id', (existing as { id: number }).id);
                return res.status(200).json({ ok: true, summary: null });
            }
            if (existing) {
                const { error } = await sb.from('child_memory')
                    .update({ summary, user_edited_at: now, updated_at: now })
                    .eq('id', (existing as { id: number }).id);
                if (error) return res.status(500).json({ error: 'Failed to save' });
            } else {
                const { error } = await sb.from('child_memory').insert({
                    tenant_id: ctx.tenantId, child_id: childId, member_id: ctx.memberId,
                    summary, user_edited_at: now, updated_at: now,
                });
                if (error) return res.status(500).json({ error: 'Failed to save' });
            }
            return res.status(200).json({ ok: true, summary });
        }

        if (action === 'delete') {
            // Full wipe of the caller's memory about this child: summary + events.
            const delMem = memberScope(sb.from('child_memory').delete()
                .eq('tenant_id', ctx.tenantId).eq('child_id', childId));
            const delEv = memberScope(sb.from('child_memory_events').delete()
                .eq('tenant_id', ctx.tenantId).eq('child_id', childId));
            const [r1, r2] = await Promise.all([delMem, delEv]);
            if (r1.error || r2.error) {
                console.error('[child-memory] delete failed:', r1.error?.message ?? r2.error?.message);
                return res.status(500).json({ error: 'Failed to delete' });
            }
            return res.status(200).json({ ok: true });
        }

        return res.status(400).json({ error: 'Unknown action' });
    } catch (err) {
        console.error('[child-memory] Unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
