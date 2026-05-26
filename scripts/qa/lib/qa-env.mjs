// scripts/qa/lib/qa-env.mjs
// Shared helpers for QA scripts: env loading, supabase client, assertions, cleanup.
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
config();

export const QA = {
  baseUrl: process.env.QA_BASE_URL || 'https://argomethod.com',
  tenantSlug: process.env.QA_TENANT_SLUG || 'qa-robot',
  tenantEmail: process.env.QA_TENANT_EMAIL,
  tenantPassword: process.env.QA_TENANT_PASSWORD,
  alertEmail: process.env.QA_ALERT_EMAIL || 'marianonoceti@gmail.com',
};

export function supabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key);
}

// Returns an assert function that records {name, ok} into the given array.
export function makeAssert(results) {
  return (name, cond) => {
    const ok = Boolean(cond);
    results.push({ name, ok });
    console.log(ok ? `  OK:   ${name}` : `  FAIL: ${name}`);
    return ok;
  };
}

// Hard-deletes every session belonging to the QA test tenant. Call at end of each run.
export async function cleanupSyntheticSessions(sb, tenantId) {
  const { error } = await sb.from('sessions').delete().eq('tenant_id', tenantId);
  if (error) console.warn('[qa cleanup] could not delete sessions:', error.message);
}

// Resolves the QA tenant id from its slug.
export async function getQaTenantId(sb) {
  const { data, error } = await sb.from('tenants').select('id').eq('slug', QA.tenantSlug).single();
  if (error || !data) throw new Error(`QA tenant '${QA.tenantSlug}' not found. Run Task 0.2.`);
  return data.id;
}
