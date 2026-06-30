// scripts/qa/lint-content.mjs
// Repo-wide content linter: scans src/ for voseo + dashes in Spanish string/JSX text.
// Run: npm run lint:content  (exits non-zero on findings)
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hasVoseo, hasDash } from './lib/scoring.mjs';

const SPANISH_HINT = /[a-záéíóúñü]{3,}/i;

// Debug / log strings are not user-facing copy: skip them (e.g. '[Argo Dev] ...', '— sessionId:').
const DEBUG_LITERAL = /sessionId|console\.|^\W*\[[A-Za-z]|\bmock\b|\bDEV\b|\bDEBUG\b|would (send|request)/i;

// Activity-not-training framing rule (es/en/pt). See docs/COPY-MARCO-ACTIVIDAD.md + CLAUDE.md.
// Never frame copy as if Argo were only about training; use "la actividad / el deporte / la cancha".
const TRAINING_STEM = /\b(entrenamientos?|entrenos?|training|treinos?|treinamento)\b/i;
// Allowed when the SAME literal also names a match/competition/activity: it's an inclusive
// enumeration or the deliberate training-vs-match contrast, not training-only framing.
const TRAINING_ENUM_OK = /\b(partidos?|partidas?|competenc\w*|competi\w*|actividad\w*|atividade\w*|matches?|games?|jogos?)\b/i;
// Deliberate keeps (exact-ish phrases): the Sosten pre-match calming contrast + the Puentes q2 option.
const TRAINING_ALLOW = [
  /en el entrenamiento, nada/i,        // es: "(jugamos/lo mismo) como en el entrenamiento, nada raro/diferente"
  /no treino, nada/i,                  // pt: "(jogamos/o mesmo) como no treino, nada diferente"
  /entrenamiento con su entusiasmo/i,  // es: Puentes "conecte el entrenamiento con su entusiasmo"
  /treino ao seu entusiasmo/i,         // pt: Puentes "conecte o treino ao seu entusiasmo"
];

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

// Language-agnostic (es/en/pt) scan for training-only framing in user-facing literals.
export function scanTraining(source, file) {
  const findings = [];
  source.split('\n').forEach((line, idx) => {
    const literals = line.match(/(["'`])(?:(?!\1).){4,}\1/g) || [];
    for (const lit of literals) {
      const inner = lit.slice(1, -1);
      if (!TRAINING_STEM.test(inner)) continue;
      if (DEBUG_LITERAL.test(inner)) continue;
      if (TRAINING_ENUM_OK.test(inner)) continue;                  // inclusive enumeration / deliberate contrast
      if (TRAINING_ALLOW.some((re) => re.test(inner))) continue;   // explicit deliberate keep
      findings.push({ file, line: idx + 1, type: 'training', text: inner.slice(0, 80) });
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

// Like walk(), but keeps .en/.pt files too: the training-framing rule applies to all 3 languages.
function walkTraining(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walkTraining(full, acc);
    else if (['.ts', '.tsx'].includes(extname(full))) acc.push(full);
  }
  return acc;
}

// Only run the scan when executed directly (not when imported by the test).
// Use fileURLToPath so paths with spaces (e.g. "Argo Project") compare correctly.
if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
  const fileArgIdx = process.argv.indexOf('--file');
  if (fileArgIdx !== -1) {
    // Single-file mode: used by the per-edit hook. Exits 2 (block) on findings, 0 otherwise.
    const target = process.argv[fileArgIdx + 1];
    if (!target || !existsSync(target)) process.exit(0);
    const src = readFileSync(target, 'utf8');
    const findings = [...scanContent(src, target), ...scanTraining(src, target)];
    if (findings.length) {
      console.error(`CONTENT LINT en ${basename(target)} (voseo/guiones/encuadre de entrenamiento):`);
      for (const x of findings) console.error(`  L${x.line} [${x.type}] ${x.text}`);
      console.error('Usar tuteo (no voseo), evitar em/en dash (—/–) en copy ES, y no encuadrar solo en "entrenamiento": usar "la actividad / el deporte / la cancha" (ver docs/COPY-MARCO-ACTIVIDAD.md).');
      process.exit(2);
    }
    process.exit(0);
  }
  // Repo-wide mode (CI). Exits 1 on findings.
  // voseo/dash: Spanish-only (walk skips .en/.pt). training framing: all langs, src + api.
  const files = walk('src');
  let all = [];
  for (const f of files) all = all.concat(scanContent(readFileSync(f, 'utf8'), f));
  const trainingFiles = [...walkTraining('src'), ...walkTraining('api')];
  for (const f of trainingFiles) all = all.concat(scanTraining(readFileSync(f, 'utf8'), f));
  if (all.length) {
    console.error(`Content lint: ${all.length} finding(s):\n`);
    for (const x of all) console.error(`  ${x.file}:${x.line} [${x.type}] ${x.text}`);
    process.exit(1);
  }
  console.log('Content lint: clean.');
}
