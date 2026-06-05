// src/lib/principia/activityLog.ts
// Principia / Vigia v1 — canonical activity-row builder + best-effort writer.
// buildActivityRow() is PURE (unit-tested). logActivity() is a thin wrapper that
// must NEVER throw into the caller's product path — every emission is best-effort.
// Row shape follows the design spec (section 7.1) and matches the system_activity_log
// migration plus what Parts C/D read/write.

export type Area = 'producto' | 'marketing' | 'ventas' | 'personas' | 'finanzas' | 'sistema';

// Free-ish text in the DB; this union documents the expected values.
export type SourceType = 'sensor' | 'controller' | 'actuator' | 'cron' | 'human' | 'webhook' | 'system';

// Includes 'info' (observations), unlike the SEVERITY_COLORS keys. Views must
// index SEVERITY_COLORS defensively (?.).
export type Severity = 'info' | 'sano' | 'medio' | 'alto' | 'offline';

export interface ActivityInput {
    area: Area;
    action: string;
    sourceType?: SourceType;
    eventType?: string;
    actor?: string;
    resourceType?: string;
    resourceId?: string;
    severity?: Severity;
    status?: string;
    reason?: Record<string, unknown>;
    result?: Record<string, unknown>;
    relatedLogs?: string[];
    incidentId?: number;
    occurredAt?: string;
}

// The shape of a row to INSERT into system_activity_log. recorded_at is omitted on
// purpose — the DB default owns it.
export interface ActivityRow {
    area: Area;
    source_type: SourceType;
    event_type: string | null;
    actor: string | null;
    action: string;
    resource_type: string | null;
    resource_id: string | null;
    severity: Severity;
    status: string | null;
    reason: Record<string, unknown> | null;
    result: Record<string, unknown> | null;
    related_logs: string[];
    incident_id: number | null;
    occurred_at: string | null;
}

export function buildActivityRow(input: ActivityInput): ActivityRow {
    if (!input || !input.area) throw new Error('buildActivityRow: area is required');
    if (!input.action) throw new Error('buildActivityRow: action is required');

    return {
        area: input.area,
        source_type: input.sourceType ?? 'system',
        event_type: input.eventType ?? null,
        actor: input.actor ?? null,
        action: input.action,
        resource_type: input.resourceType ?? null,
        resource_id: input.resourceId ?? null,
        severity: input.severity ?? 'info',
        status: input.status ?? null,
        reason: input.reason ?? null,
        result: input.result ?? null,
        related_logs: input.relatedLogs ?? [],
        incident_id: input.incidentId ?? null,
        occurred_at: input.occurredAt ?? null,
    };
}

// Minimal structural type so we don't depend on @supabase/supabase-js here.
interface MinimalSupabase {
    from(table: string): { insert(values: unknown): Promise<{ error: unknown } | unknown> };
}

/**
 * Best-effort write of one activity row. NEVER throws into the caller. Pass the
 * handler's existing service-role client. Safe to await or fire-and-forget.
 */
export async function logActivity(sb: MinimalSupabase, input: ActivityInput): Promise<void> {
    try {
        const row = buildActivityRow(input);
        await sb.from('system_activity_log').insert(row);
    } catch (err) {
        console.warn('[principia:logActivity] non-blocking write failed:', err);
    }
}
