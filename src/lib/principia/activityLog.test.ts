// src/lib/principia/activityLog.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildActivityRow } from './activityLog';

test('buildActivityRow fills required fields and sensible defaults', () => {
    const row = buildActivityRow({
        area: 'producto',
        action: 'session_completed',
        entityType: 'session',
        entityRef: 'sess-123',
        summary: 'Sesion completada',
    });

    assert.equal(row.area, 'producto');
    assert.equal(row.action, 'session_completed');
    assert.equal(row.source_type, 'system');       // default
    assert.equal(row.severity, 'info');            // default
    assert.equal(row.entity_type, 'session');
    assert.equal(row.entity_ref, 'sess-123');
    assert.equal(row.summary, 'Sesion completada');
    assert.deepEqual(row.detail, {});              // default empty object
    assert.deepEqual(row.related_logs, []);        // default empty array
    // builder must NOT set created_at (DB default owns the timestamp)
    assert.equal('created_at' in row, false);
});

test('buildActivityRow honors explicit overrides', () => {
    const row = buildActivityRow({
        area: 'ventas',
        action: 'payment_received',
        sourceType: 'system',
        severity: 'sano',
        entityType: 'one_purchase',
        entityRef: 'pur-9',
        summary: 'Pago recibido',
        detail: { provider: 'stripe', pack_size: 3 },
        relatedLogs: ['webhook_events.evt_1'],
    });

    assert.equal(row.area, 'ventas');
    assert.equal(row.severity, 'sano');
    assert.deepEqual(row.detail, { provider: 'stripe', pack_size: 3 });
    assert.deepEqual(row.related_logs, ['webhook_events.evt_1']);
});

test('buildActivityRow throws on missing area or action', () => {
    // @ts-expect-error intentionally missing area
    assert.throws(() => buildActivityRow({ action: 'x' }), /area/);
    // @ts-expect-error intentionally missing action
    assert.throws(() => buildActivityRow({ area: 'producto' }), /action/);
});
