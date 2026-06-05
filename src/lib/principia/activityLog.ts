// src/lib/principia/activityLog.ts
// Principia / Vigia v1 — canonical activity-row builder + best-effort writer.
// buildActivityRow() is PURE (unit-tested). logActivity() is a thin wrapper
// that must NEVER throw into the caller's product path — every emission is
// best-effort and swallows errors.

export type Area =
    | 'producto'
    | 'marketing'
    | 'ventas'
    | 'personas'
    | 'finanzas'
    | 'sistema';

export type SourceType = 'system' | 'human' | 'agent';

// Note: includes 'info' (observations), unlike the SEVERITY_COLORS keys which
// are alto|medio|sano|offline. Views must index SEVERITY_COLORS defensively.
export type Severity = 'info' | 'sano' | 'medio' | 'alto' | 'offline';

export interface ActivityInput {
    area: Area;
    action: string;
    sourceType?: SourceType;
    severity?: Severity;
    entityType?: string;
    entityRef?: string;
    summary?: string;
    detail?: Record<string, unknown>;
    relatedLogs?: string[];
}

// The shape of a row to INSERT into system_activity_log. created_at is omitted
// on purpose — the DB default owns the timestamp.
export interface ActivityRow {
    area: Area;
    source_type: SourceType;
    action: string;
    severity: Severity;
    entity_type: string | null;
    entity_ref: string | null;
    summary: string | null;
    detail: Record<string, unknown>;
    related_logs: string[];
}

export function buildActivityRow(input: ActivityInput): ActivityRow {
    if (!input || !input.area) throw new Error('buildActivityRow: area is required');
    if (!input.action) throw new Error('buildActivityRow: action is required');

    return {
        area: input.area,
        source_type: input.sourceType ?? 'system',
        action: input.action,
        severity: input.severity ?? 'info',
        entity_type: input.entityType ?? null,
        entity_ref: input.entityRef ?? null,
        summary: input.summary ?? null,
        detail: input.detail ?? {},
        related_logs: input.relatedLogs ?? [],
    };
}

// Minimal structural type so we don't depend on @supabase/supabase-js here.
// Callers pass their existing service-role client.
interface MinimalSupabase {
    from(table: string): {
        insert(values: unknown): Promise<{ error: unknown } | unknown>;
    };
}

/**
 * Best-effort write of one activity row. NEVER throws into the caller.
 * Pass the handler's existing service-role client (created with
 * SUPABASE_SERVICE_ROLE_KEY). Safe to await or fire-and-forget.
 */
export async function logActivity(
    sb: MinimalSupabase,
    input: ActivityInput,
): Promise<void> {
    try {
        const row = buildActivityRow(input);
        await sb.from('system_activity_log').insert(row);
    } catch (err) {
        // Swallow — observability must never break the product path.
        console.warn('[principia:logActivity] non-blocking write failed:', err);
    }
}
