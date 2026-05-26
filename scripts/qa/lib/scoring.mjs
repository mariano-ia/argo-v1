// scripts/qa/lib/scoring.mjs
// Pure scoring helpers reused by the AI eval. Mirrors the anti-hallucination rules
// enforced in api/generate-ai.ts and api/tenant-chat.ts.

// Subset of the prohibited vocabulary used in the API filters (clinical / deterministic / labeling).
export const PROHIBITED_WORDS = [
  'trastorno', 'patología', 'patologia', 'diagnóstico', 'diagnostico', 'tdah', 'autismo',
  'enfermedad', 'déficit', 'deficit', 'disfunción', 'disfuncion', 'anormal', 'defecto',
  'siempre será', 'nunca podrá', 'condenado', 'incapaz', 'fracasado', 'problemático', 'problematico',
];

export function findProhibited(text) {
  const lower = String(text).toLowerCase();
  return PROHIBITED_WORDS.filter(w => lower.includes(w));
}

export function hasDash(text) {
  return /[—–]/.test(String(text));
}

// Exact accented voseo forms (case-sensitive), mirroring .claude/scripts/check-voseo.sh.
// CRITICAL 1: do NOT use [eé]/[aá] classes or the /i flag — the accent is what distinguishes
// voseo from correct tuteo ("sabés" is voseo, "sabes" is correct), so loose matching would
// flag valid tuteo as a false positive.
// CRITICAL 2: do NOT use \b boundaries — JS \b is ASCII-only, so "á" counts as a non-word char
// and \btomá\b would wrongly match the "tomá" inside "tomárselo". Use explicit letter lookarounds
// (including accented letters) so a form only matches when it is a standalone word.
const L = 'A-Za-zÁÉÍÓÚÜÑáéíóúüñ';
const VOSEO = new RegExp(
  `(?<![${L}])(?:podés|querés|sabés|sentís|tenés|hacés|venís|volvés|necesitás|animás|jugás|mostrás|sos|hacé|poné|tomá|vení|decí|fijáte|sentáte|acercate|enfocate|[Dd]ecile|[Pp]edile|[Mm]antenele|[Pp]onelo|[Dd]ejalo|[Ss]acalo|[Ss]umalo|[Mm]antenelo|[Ii]ncluilo|[Hh]aceme|[Ee]xplicale|de vos|en vos|a vos|con vos|acá)(?![${L}])`
);
export function hasVoseo(text) {
  return VOSEO.test(String(text));
}

// Probabilistic language is required: profiles must describe tendencies, not absolutes.
const PROBABILISTIC = /\b(tiende|suele|probablemente|en general|a menudo|puede que|es posible|inclina|prefiere)\b/i;
export function hasProbabilisticLanguage(text) {
  return PROBABILISTIC.test(String(text));
}

// Combined per-text score. Returns {ok, issues[]}.
export function scoreText(text, { requireProbabilistic = false } = {}) {
  const issues = [];
  const prohibited = findProhibited(text);
  if (prohibited.length) issues.push(`prohibited: ${prohibited.join(', ')}`);
  if (hasDash(text)) issues.push('contains dash (— or –)');
  if (hasVoseo(text)) issues.push('contains voseo');
  if (requireProbabilistic && !hasProbabilisticLanguage(text)) issues.push('lacks probabilistic language');
  return { ok: issues.length === 0, issues };
}
