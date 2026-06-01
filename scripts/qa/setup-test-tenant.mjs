// scripts/qa/setup-test-tenant.mjs
// Step 1 of provisioning the synthetic QA tenant: create the auth user via the public signUp
// flow (anon key, so gotrue fills every auth.users column correctly) and persist credentials
// to .env (gitignored). Email confirmation + tenant/member rows are done via privileged SQL
// (MCP) because the local env only has the anon key, not the service role key.
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
config();

const url = process.env.VITE_SUPABASE_URL;
const anon = process.env.VITE_SUPABASE_ANON_KEY;
if (!url || !anon) { console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY'); process.exit(1); }
const sb = createClient(url, anon, { auth: { autoRefreshToken: false, persistSession: false } });

const EMAIL = process.env.QA_TENANT_EMAIL || 'qa-robot@argomethod.test';
const SLUG = process.env.QA_TENANT_SLUG || 'qa-robot';
const PASSWORD = process.env.QA_TENANT_PASSWORD || `Qa!${randomBytes(12).toString('base64url')}`;

const { data, error } = await sb.auth.signUp({ email: EMAIL, password: PASSWORD });
if (error && !/already registered|already exists/i.test(error.message)) {
  console.error('signUp error:', error.message); process.exit(1);
}
console.log(error ? `user already existed (${error.message}) — password reset will be applied via SQL` : `signUp ok, user id: ${data.user?.id}`);

// Persist credentials to .env (upsert each key).
const envPath = '.env';
let env = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
const vars = {
  QA_TENANT_EMAIL: EMAIL,
  QA_TENANT_PASSWORD: PASSWORD,
  QA_TENANT_SLUG: SLUG,
  QA_ALERT_EMAIL: process.env.QA_ALERT_EMAIL || 'marianonoceti@gmail.com',
  QA_BASE_URL: process.env.QA_BASE_URL || 'https://www.argomethod.com',
};
for (const [k, v] of Object.entries(vars)) {
  const re = new RegExp(`^${k}=.*$`, 'm');
  if (re.test(env)) env = env.replace(re, `${k}=${v}`);
  else env += (env === '' || env.endsWith('\n') ? '' : '\n') + `${k}=${v}\n`;
}
writeFileSync(envPath, env);
console.log('wrote QA_* vars to .env');
console.log('NEXT: confirm email + insert tenant/member via SQL for', EMAIL);
