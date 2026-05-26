// scripts/qa/lint-content.mjs
// Repo-wide content linter: scans src/ for voseo + dashes in Spanish string/JSX text.
// Run: npm run lint:content  (exits non-zero on findings)
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hasVoseo, hasDash } from './lib/scoring.mjs';

const SPANISH_HINT = /[a-záéíóúñü]{3,}/i;

// Debug / log strings are not user-facing copy: skip them (e.g. '[Argo Dev] ...', '— sessionId:').
const DEBUG_LITERAL = /sessionId|console\.|^\W*\[[A-Za-z]|\bmock\b|\bDEV\b|\bDEBUG\b|would (send|request)/i;

// Portuguese markers: if present, the string is PT (em dash is fine there).
const PORTUGUESE = /[ãõç]|\b(não|você|muito|seu|sua|pela|ação|está o|tempo de)\b/i;
// Spanish markers: distinctive chars or stopwords. Used to gate the (Spanish-only) dash rule.
const SPANISH = /[ñ¿¡]|\b(que|los|las|una|según|también|tú|más|niño|niña|deportista|del|años|cómo|qué|para el|con el|tu )\b/i;

function looksSpanish(text) {
  if (PORTUGUESE.test(text)) return false;
  return SPANISH.test(text);
}

// Returns findings [{file, line, type, text}] for a single source string.
export function scanContent(source, file) {
  const findings = [];
  source.split('\n').forEach((line, idx) => {
    const literals = line.match(/(["'`])(?:(?!\1).){4,}\1/g) || [];
    for (const lit of literals) {
      const inner = lit.slice(1, -1);
      if (!SPANISH_HINT.test(inner)) continue;
      if (DEBUG_LITERAL.test(inner)) continue;
      // Voseo forms are inherently Spanish, so flag them in any non-debug literal.
      if (hasVoseo(inner)) findings.push({ file, line: idx + 1, type: 'voseo', text: inner.slice(0, 80) });
      // The no-dash rule is Spanish-only: only flag dashes in strings that look Spanish (not EN/PT).
      if (hasDash(inner) && looksSpanish(inner)) findings.push({ file, line: idx + 1, type: 'dash', text: inner.slice(0, 80) });
    }
  });
  return findings;
}

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    // Skip English / Portuguese content files: the voseo + no-dash rules are Spanish-only,
    // and em dashes are legitimate punctuation in those languages.
    if (/\.(en|pt)\.(ts|tsx)$/.test(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else if (['.ts', '.tsx'].includes(extname(full))) acc.push(full);
  }
  return acc;
}

// Only run the scan when executed directly (not when imported by the test).
// Use fileURLToPath so paths with spaces (e.g. "Argo Project") compare correctly.
if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
  const files = walk('src');
  let all = [];
  for (const f of files) all = all.concat(scanContent(readFileSync(f, 'utf8'), f));
  if (all.length) {
    console.error(`Content lint: ${all.length} finding(s):\n`);
    for (const x of all) console.error(`  ${x.file}:${x.line} [${x.type}] ${x.text}`);
    process.exit(1);
  }
  console.log('Content lint: clean.');
}
