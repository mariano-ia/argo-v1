// scripts/qa/lib/run-monitor.mjs
// Curls the deployed /api/qa-monitor and prints the result; exits non-zero on failure.
import { config } from 'dotenv';
config();
const base = process.env.QA_BASE_URL || 'https://www.argomethod.com';
const secret = process.env.CRON_SECRET || '';
const r = await fetch(`${base}/api/qa-monitor?secret=${encodeURIComponent(secret)}`, { method: 'POST' });
const body = await r.json().catch(() => ({ ok: false }));
for (const c of body.checks || []) console.log(c.ok ? `OK   ${c.name}` : `FAIL ${c.name} (${c.detail})`);
if (!body.ok) { console.error('\nMONITOR FAILED'); process.exit(1); }
console.log('\nMONITOR PASSED');
