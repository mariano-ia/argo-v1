#!/usr/bin/env node
/**
 * CI guard: api/ serverless functions must NOT import from ../src.
 *
 * Vercel transpiles (does not bundle) these functions, so a cross-directory
 * import to ../src resolves fine at type-check time but throws
 * ERR_MODULE_NOT_FOUND at RUNTIME. This is the exact bug class that broke
 * production on 2026-06-05 (create-tenant, session, one-webhook, send-email,
 * report-recovery-cron, admin-tenants). Inline the shared helper into the
 * function instead (see CLAUDE.md "Serverless endpoints").
 *
 * `tsc` cannot catch this (resolution succeeds), so this static guard is the
 * real safety net. Exit 1 on any offender.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const API_DIR = 'api';
const STATIC_IMPORT = /\bfrom\s+['"]\.\.\/src\//;       // import ... from '../src/...'
const DYNAMIC_IMPORT = /\bimport\s*\(\s*['"]\.\.\/src\//; // import('../src/...')

const offenders = [];

function scan(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { scan(p); continue; }
    if (!p.endsWith('.ts') && !p.endsWith('.mts')) continue;
    const lines = readFileSync(p, 'utf8').split('\n');
    lines.forEach((line, i) => {
      if (STATIC_IMPORT.test(line) || DYNAMIC_IMPORT.test(line)) {
        offenders.push(`${p}:${i + 1}: ${line.trim()}`);
      }
    });
  }
}

scan(API_DIR);

if (offenders.length) {
  console.error('\n✗ api/ functions import from ../src (forbidden — fails at runtime on Vercel):\n');
  offenders.forEach(o => console.error('  ' + o));
  console.error('\nInline the shared helper into the function instead (see CLAUDE.md "Serverless endpoints").\n');
  process.exit(1);
}

console.log('✓ api/ has no cross-directory ../src imports');
