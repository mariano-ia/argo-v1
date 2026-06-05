// Pure-logic tests for the riskiest detect paths (action_key dedupe, severity,
// verify-loop resolution). The cron inlines copies of these; THIS is the tested source.
// Run: npx tsx --test src/lib/principia/detectLogic.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildActionKey, severityForCount, shouldResolveVerifying } from './detectLogic.ts';

test('buildActionKey is deterministic and order-independent for entity sets', () => {
    const a = buildActionKey('report_email_unsent', ['s2', 's1']);
    const b = buildActionKey('report_email_unsent', ['s1', 's2']);
    assert.equal(a, b);  // same set, same key -> dedupes to one open incident
    assert.notEqual(a, buildActionKey('report_email_unsent', ['s1']));
});

test('buildActionKey uses the day bucket when no entities (threshold signals)', () => {
    const k = buildActionKey('client_error_spike', [], '2026-06-05');
    assert.equal(k, 'client_error_spike:2026-06-05');
});

test('severityForCount escalates alto past the high watermark, else medio', () => {
    assert.equal(severityForCount(14, 14), 'alto');
    assert.equal(severityForCount(6, 14), 'medio');
    assert.equal(severityForCount(3, 3), 'alto');   // session stall: alto at >=3
    assert.equal(severityForCount(1, 3), 'medio');
});

test('shouldResolveVerifying only resolves when nothing is still broken', () => {
    assert.equal(shouldResolveVerifying(0, 2), true);    // all recovered
    assert.equal(shouldResolveVerifying(1, 2), false);   // one still broken -> no false-resolve
    assert.equal(shouldResolveVerifying(0, 0), false);   // no entities checked -> cannot assert recovery
});
