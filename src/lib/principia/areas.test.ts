// Unit tests for the AreaModule registry shape.
// Run: npx tsx --test src/lib/principia/areas.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AREA_MODULES, getArea } from './areas.ts';

test('registry has all 5 cohorts', () => {
    assert.deepEqual(AREA_MODULES.map(a => a.id).sort(),
        ['finanzas', 'marketing', 'personas', 'producto', 'ventas']);
});

test('only Producto is live; the other four are coming_soon', () => {
    const live = AREA_MODULES.filter(a => a.status === 'live').map(a => a.id);
    assert.deepEqual(live, ['producto']);
    const soon = AREA_MODULES.filter(a => a.status === 'coming_soon').map(a => a.id).sort();
    assert.deepEqual(soon, ['finanzas', 'marketing', 'personas', 'ventas']);
});

test('Producto exposes real signal sources and executable capabilities', () => {
    const producto = getArea('producto');
    assert.ok(producto.signalSources.length >= 3);
    assert.ok(producto.signalSources.some(s => s.ref === 'client_errors' && s.existsToday));
    assert.ok(producto.signalSources.some(s => s.ref === 'sessions' && s.existsToday));
    const executable = producto.capabilities.filter(c => c.executable).map(c => c.type).sort();
    assert.deepEqual(executable, ['resend_email', 'retry', 'trigger_report_recovery']);
    // PR/rollback/feature_flag are proposals only (not executable) in v1.
    assert.ok(producto.capabilities.filter(c => !c.executable)
        .every(c => ['open_pr', 'rollback', 'feature_flag'].includes(c.type)));
});

test('coming_soon cohorts still expose id/label/agentName/icon/status (no 404 surface)', () => {
    for (const id of ['marketing', 'ventas', 'personas', 'finanzas'] as const) {
        const a = getArea(id);
        assert.equal(typeof a.label, 'string');
        assert.equal(typeof a.agentName, 'string');
        assert.ok(a.icon);
        assert.equal(a.status, 'coming_soon');
    }
});
