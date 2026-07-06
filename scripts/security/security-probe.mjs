#!/usr/bin/env node
// ============================================================================
// Security probe — the "vigilante", black-box edition.
//
// Impersonates an attacker holding ONLY the public anon key (the one that ships
// inside the browser bundle) and asserts that every sensitive table, delete path,
// and RPC in scripts/security/expected-denied.json is DENIED. This is the
// ground-truth regression guard for the 2026-07-06 RLS lockdown: if anyone ever
// re-opens a policy (e.g. a `SELECT USING(true)` — the exact pattern the Supabase
// advisor deliberately does NOT flag) or re-grants the anon role, a real anon
// request gets rows back and this probe FAILS loudly.
//
// Needs only SUPABASE_URL + SUPABASE_ANON_KEY (no service key, no DB driver), so
// it is safe to run anywhere: locally, in CI (`npm run check:security`), and from
// the scheduled cron (api/security-canary.ts inlines the same logic).
// ============================================================================
import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const NIL_UUID = '00000000-0000-0000-0000-000000000000';

export async function runProbe(opts = {}) {
  const url = opts.url || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anon = opts.anon || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error('security-probe: missing SUPABASE_URL / SUPABASE_ANON_KEY');

  const spec = opts.spec || JSON.parse(readFileSync(join(HERE, 'expected-denied.json'), 'utf8'));
  const headers = { apikey: anon, Authorization: `Bearer ${anon}`, 'Content-Type': 'application/json' };
  const failures = [];
  const passes = [];

  // 1) Forbidden reads — a NON-EMPTY array coming back means the table is exposed.
  //    A revoked grant returns 401; an RLS-deny returns 200 []. Both are "denied".
  for (const table of spec.forbidden_reads ?? []) {
    try {
      const res = await fetch(`${url}/rest/v1/${table}?select=*&limit=1`, { headers });
      let body = null;
      try { body = await res.json(); } catch { /* non-JSON error body = denied */ }
      if (res.ok && Array.isArray(body) && body.length > 0) {
        failures.push(`READ ${table} → anon got ${body.length} row(s) (HTTP ${res.status}) — EXPOSED`);
      } else {
        passes.push(`READ ${table} → denied (HTTP ${res.status})`);
      }
    } catch (e) {
      passes.push(`READ ${table} → network-denied (${e.message})`);
    }
  }

  // 2) Forbidden deletes — target a non-existent id so nothing is ever destroyed.
  //    Anon must be DENIED (non-2xx). A 2xx means anon holds DELETE — exposed.
  for (const table of spec.forbidden_deletes ?? []) {
    try {
      const res = await fetch(`${url}/rest/v1/${table}?id=eq.${NIL_UUID}`, { method: 'DELETE', headers });
      if (res.ok) failures.push(`DELETE ${table} → anon delete NOT denied (HTTP ${res.status}) — EXPOSED`);
      else passes.push(`DELETE ${table} → denied (HTTP ${res.status})`);
    } catch (e) {
      passes.push(`DELETE ${table} → network-denied (${e.message})`);
    }
  }

  // 3) Forbidden RPCs — SECURITY DEFINER functions must not be anon-executable.
  //    Dummy/nil args mean even an accidental execution is a harmless no-op.
  for (const rpc of spec.forbidden_rpcs ?? []) {
    try {
      const res = await fetch(`${url}/rest/v1/rpc/${rpc.name}`, {
        method: 'POST', headers, body: JSON.stringify(rpc.args ?? {}),
      });
      if (res.ok) failures.push(`RPC ${rpc.name} → anon execute NOT denied (HTTP ${res.status}) — EXPOSED`);
      else passes.push(`RPC ${rpc.name} → denied (HTTP ${res.status})`);
    } catch (e) {
      passes.push(`RPC ${rpc.name} → network-denied (${e.message})`);
    }
  }

  return { ok: failures.length === 0, failures, passes };
}

// CLI entry — exit non-zero on any exposure so it can gate CI / a deploy.
const isMain = (() => {
  try { return !!process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)); }
  catch { return false; }
})();
if (isMain) {
  runProbe()
    .then(({ ok, failures, passes }) => {
      for (const p of passes) console.log(`  ✓ ${p}`);
      if (!ok) {
        console.error(`\n✗ SECURITY PROBE FAILED — ${failures.length} exposed surface(s):`);
        for (const f of failures) console.error(`  ✗ ${f}`);
        console.error('\nAn anon-key attacker can reach data that must be locked. Do NOT deploy/sell until fixed.');
        process.exit(1);
      }
      console.log(`\n✓ Security probe passed — ${passes.length} attack surfaces, all denied.`);
    })
    .catch((err) => { console.error('security-probe error:', err.message); process.exit(2); });
}
