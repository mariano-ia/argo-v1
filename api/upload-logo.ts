import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Phase 2: resolve which tenant the caller acts on. An explicit tenant_id
// requires ACTIVE membership of THAT tenant; absent tenant_id keeps the
// single-membership back-compat path. Returns null when the caller may not act.
async function resolveTenantContext(
    sb: any,
    userId: string,
    requestedTenantId: string | null,
): Promise<{ tenantId: string; role: string; memberId: string | null } | null> {
    if (requestedTenantId) {
        const { data: m } = await sb
            .from('tenant_members')
            .select('id, tenant_id, role')
            .eq('auth_user_id', userId)
            .eq('tenant_id', requestedTenantId)
            .eq('status', 'active')
            .maybeSingle();
        if (m) return { tenantId: (m as { tenant_id: string }).tenant_id, role: (m as { role: string }).role ?? 'owner', memberId: (m as { id: string }).id };
        const { data: t } = await sb
            .from('tenants')
            .select('id')
            .eq('id', requestedTenantId)
            .eq('auth_user_id', userId)
            .maybeSingle();
        if (t) return { tenantId: (t as { id: string }).id, role: 'owner', memberId: null };
        return null;
    }
    const { data: m } = await sb
        .from('tenant_members')
        .select('id, tenant_id, role')
        .eq('auth_user_id', userId)
        .eq('status', 'active')
        .maybeSingle();
    if (m) return { tenantId: (m as { tenant_id: string }).tenant_id, role: (m as { role: string }).role ?? 'owner', memberId: (m as { id: string }).id };
    const { data: t } = await sb
        .from('tenants')
        .select('id')
        .eq('auth_user_id', userId)
        .maybeSingle();
    if (t) return { tenantId: (t as { id: string }).id, role: 'owner', memberId: null };
    return null;
}

// Vercel parses multipart automatically when using formData — we receive a Buffer
// via the raw body. The file is sent as multipart/form-data with field name "logo".
export const config = { api: { bodyParser: false } };

async function readRawBody(req: VercelRequest): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });
}

// Minimal multipart parser — extracts first file field from multipart/form-data
function parseMultipart(body: Buffer, boundary: string): { data: Buffer; contentType: string } | null {
    const boundaryBuf = Buffer.from(`--${boundary}`);
    const start = body.indexOf(boundaryBuf) + boundaryBuf.length;
    const end   = body.lastIndexOf(boundaryBuf) - 2; // trim trailing \r\n
    const part  = body.slice(start, end);

    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) return null;

    const headers = part.slice(0, headerEnd).toString();
    const data    = part.slice(headerEnd + 4, part.length - 2); // trim trailing \r\n

    const ctMatch = headers.match(/Content-Type:\s*([^\r\n]+)/i);
    const contentType = ctMatch ? ctMatch[1].trim() : 'application/octet-stream';

    return { data, contentType };
}

// Extract a multipart text field value by its Content-Disposition name.
function parseMultipartField(body: Buffer, boundary: string, fieldName: string): string | null {
    const boundaryBuf = Buffer.from(`--${boundary}`);
    let idx = body.indexOf(boundaryBuf);
    while (idx !== -1) {
        const partStart = idx + boundaryBuf.length;
        const nextIdx = body.indexOf(boundaryBuf, partStart);
        if (nextIdx === -1) break;
        const part = body.slice(partStart, nextIdx);

        const headerEnd = part.indexOf('\r\n\r\n');
        if (headerEnd !== -1) {
            const headers = part.slice(0, headerEnd).toString();
            const cdMatch = headers.match(/Content-Disposition:[^\r\n]*name="([^"]+)"/i);
            const hasFilename = /filename=/i.test(headers);
            if (!hasFilename && cdMatch && cdMatch[1] === fieldName) {
                // Slice the part start (after the leading \r\n) and value, trimming wrapping CRLFs.
                let value = part.slice(headerEnd + 4).toString();
                value = value.replace(/^\r\n/, '').replace(/\r\n$/, '');
                return value;
            }
        }
        idx = nextIdx;
    }
    return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing auth token' });

    const sb = createClient(supabaseUrl, serviceKey);

    try {
        const { data: { user }, error: authError } = await sb.auth.getUser(authHeader.replace('Bearer ', ''));
        if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

        // Parse multipart body
        const contentType = req.headers['content-type'] ?? '';
        const boundaryMatch = contentType.match(/boundary=([^\s;]+)/);
        if (!boundaryMatch) return res.status(400).json({ error: 'Missing multipart boundary' });

        const raw = await readRawBody(req);

        // Read an explicit tenant_id from the multipart form (Phase 2).
        const requestedTenantId: string | null = parseMultipartField(raw, boundaryMatch[1], 'tenant_id') || null;

        // Resolve caller's tenant
        const ctx = await resolveTenantContext(sb, user.id, requestedTenantId);
        if (!ctx) return res.status(requestedTenantId ? 403 : 404).json({ error: requestedTenantId ? 'Not a member of this tenant' : 'Tenant not found' });
        const tenantId: string = ctx.tenantId;

        const file = parseMultipart(raw, boundaryMatch[1]);
        if (!file) return res.status(400).json({ error: 'Could not parse file' });

        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowed.includes(file.contentType)) {
            return res.status(400).json({ error: 'Invalid file type. Use JPEG, PNG or WebP.' });
        }
        if (file.data.length > 2 * 1024 * 1024) {
            return res.status(400).json({ error: 'File too large. Maximum 2 MB.' });
        }

        const ext = file.contentType === 'image/png' ? 'png' : file.contentType === 'image/webp' ? 'webp' : 'jpg';
        const path = `${tenantId}/logo.${ext}`;

        const { error: uploadError } = await sb.storage
            .from('institution-logos')
            .upload(path, file.data, { contentType: file.contentType, upsert: true });

        if (uploadError) {
            console.error('[upload-logo] Storage error:', uploadError.message);
            return res.status(500).json({ error: uploadError.message });
        }

        const { data: { publicUrl } } = sb.storage
            .from('institution-logos')
            .getPublicUrl(path);

        // Bust browser cache by appending a timestamp
        const logoUrl = `${publicUrl}?t=${Date.now()}`;

        // Persist logo_url on the tenant record
        await sb.from('tenants').update({ logo_url: logoUrl }).eq('id', tenantId);

        return res.status(200).json({ url: logoUrl });
    } catch (err) {
        console.error('[upload-logo] Unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
