import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildActivityRow } from './activityLog';

test('buildActivityRow fills required fields and sane defaults', () => {
    const row = buildActivityRow({ area: 'producto', action: 'session_completed' });
    assert.equal(row.area, 'producto');
    assert.equal(row.action, 'session_completed');
    assert.equal(row.source_type, 'system');
    assert.equal(row.severity, 'info');
    assert.equal(row.event_type, null);
    assert.equal(row.actor, null);
    assert.equal(row.status, null);
    assert.equal(row.reason, null);
    assert.equal(row.result, null);
    assert.equal(row.incident_id, null);
    assert.equal(row.occurred_at, null);
    assert.deepEqual(row.related_logs, []);
    assert.ok(!('recorded_at' in row), 'recorded_at must be owned by the DB default');
});

test('buildActivityRow honors explicit overrides', () => {
    const row = buildActivityRow({
        area: 'producto', action: 'incident_detected', sourceType: 'controller',
        eventType: 'health_check', actor: 'vigia', severity: 'alto', status: 'pending_review',
        reason: { metric: 'client_errors_per_day', threshold: 5, current_value: 14 },
        incidentId: 42, occurredAt: '2026-06-05T12:00:00.000Z', relatedLogs: ['sessions.7'],
    });
    assert.equal(row.source_type, 'controller');
    assert.equal(row.event_type, 'health_check');
    assert.equal(row.actor, 'vigia');
    assert.equal(row.severity, 'alto');
    assert.equal(row.status, 'pending_review');
    assert.equal(row.incident_id, 42);
    assert.equal(row.occurred_at, '2026-06-05T12:00:00.000Z');
    assert.deepEqual(row.reason, { metric: 'client_errors_per_day', threshold: 5, current_value: 14 });
    assert.deepEqual(row.related_logs, ['sessions.7']);
});

test('buildActivityRow throws on missing area or action', () => {
    assert.throws(() => buildActivityRow({ area: 'producto' } as never), /action is required/);
    assert.throws(() => buildActivityRow({ action: 'x' } as never), /area is required/);
});
