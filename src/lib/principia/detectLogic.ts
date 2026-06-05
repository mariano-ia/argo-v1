/**
 * Pure detection logic for Vigia. Vercel /api cannot import from /src, so the cron
 * inlines copies of these helpers; THIS is the canonical, unit-tested source. Keep in sync.
 */

/** Deterministic, order-independent dedupe key. Entity signals key off the sorted id set;
 *  threshold signals key off the day bucket. */
export function buildActionKey(classKey: string, entityRefs: string[] = [], dayBucket?: string): string {
    if (entityRefs.length > 0) return `${classKey}:${[...entityRefs].sort().join(',')}`;
    return `${classKey}:${dayBucket ?? new Date().toISOString().slice(0, 10)}`;
}

/** Severity from a measured count vs. its high watermark. At/above watermark -> 'alto'. */
export function severityForCount(measured: number, altoWatermark: number): 'alto' | 'medio' {
    return measured >= altoWatermark ? 'alto' : 'medio';
}

/** Verify-loop decision: resolve ONLY when entities were checked AND none remain broken.
 *  A zero-entity check cannot assert recovery, so it never false-resolves. */
export function shouldResolveVerifying(stillBroken: number, totalChecked: number): boolean {
    return totalChecked > 0 && stillBroken === 0;
}
