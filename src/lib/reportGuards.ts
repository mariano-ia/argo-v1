// src/lib/reportGuards.ts
// Guards deterministas compartidos para el fail-closed engine (doc METODO-FALLBACK-INFORME.md §3, Fase B.12).
// Canónico en src/lib (rompe el patrón de copias inlined). api/ duplica-por-build cuando lo necesite.
// Espejo fiel de las listas de api/generate-ai.ts + api/tenant-chat.ts (mantener en sync).

// ─── Palabras prohibidas (framing de déficit / clínico / determinista) ───────
export const PROHIBITED_WORDS: string[] = [
  // es — déficit/clínico
  'error', 'errores', 'equivocación', 'equivocaciones', 'equivocarse',
  'fallo', 'falla', 'fallas', 'fracaso', 'fracasos',
  'déficit', 'problema', 'problemas', 'problemático', 'problemática',
  'corregir', 'arreglar', 'solucionar',
  'débil', 'debilidad', 'inseguro', 'incapaz',
  'agresivo', 'violento', 'torpe',
  'diagnóstico', 'diagnosticar', 'trastorno', 'patología', 'síndrome',
  'tdah', 'autismo', 'terapia', 'tratamiento',
  'siempre será', 'nunca podrá', 'nació para', 'está destinado',
  // en
  'mistake', 'mistakes', 'failure', 'failures', 'deficit',
  'fix', 'correct', 'weakness', 'weak',
  'aggressive', 'violent', 'clumsy',
  'diagnosis', 'disorder', 'pathology', 'syndrome',
  'adhd', 'autism', 'therapy', 'treatment',
  'will always be', 'will never', 'born to', 'is destined',
  // pt
  'erro', 'erros', 'engano', 'enganos',
  'corrigir', 'consertar',
  'fraco', 'fraqueza',
  'agressivo', 'desajeitado',
  'transtorno', 'patologia',
  'tratamento',
  'sempre será', 'nunca poderá', 'nasceu para',
];

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Palabras prohibidas presentes en el texto (whole-word para 1 palabra, includes para frases). */
export function findProhibited(text: string): string[] {
  const found = new Set<string>();
  for (const w of PROHIBITED_WORDS) {
    const re = /\s/.test(w) ? new RegExp(escapeRe(w), 'i') : new RegExp(`\\b${escapeRe(w)}\\b`, 'i');
    if (re.test(text)) found.add(w);
  }
  return [...found];
}

// ─── Patrones deterministas (identidad fija SOBRE EL NIÑO) ───────────────────
// En el informe v4 el nombre real YA está interpolado, así que las formas atadas al niño
// se arman dinámicamente con el nombre. Las categóricas standalone son fijas.
const STANDALONE_DETERMINISTIC: RegExp[] = [
  /\bva a ser\b/iu, /\bserá siempre\b/iu,
  /\bdefinitivamente\b/iu, /\bsin duda\b/iu, /\bgarantiza\b/iu,
  /\bnació para\b/iu, /\bestá destinad[oa]\b/iu,
  /\bwill always\b/iu, /\bwill never\b/iu, /\bdefinitely\b/iu,
  /\bwithout a doubt\b/iu, /\bguarantees?\b/iu, /\bborn to\b/iu, /\bis destined\b/iu,
  /\bvai ser\b/iu, /\bsempre será\b/iu, /\bsem dúvida\b/iu, /\bgarante\b/iu, /\bnasceu para\b/iu,
];

/** Patrones deterministas presentes. `nombre` ata las formas "X es un(a) …" / "X siempre …". */
export function findDeterministic(text: string, nombre: string): string[] {
  const found = new Set<string>();
  const n = escapeRe(nombre);
  const nameTied: RegExp[] = [
    new RegExp(`(?:${n}|él|ella|el niño|la niña|el deportista)\\s+(?:es|será)\\s+un[ao]?\\s+\\p{L}`, 'iu'),
    new RegExp(`(?:${n}|he|she|the athlete|the child)\\s+is\\s+a\\s+\\p{L}`, 'iu'),
    new RegExp(`(?:${n}|ele|ela|a criança|o atleta)\\s+é\\s+um[a]?\\s+\\p{L}`, 'iu'),
    new RegExp(`(?:${n}|él|ella)\\s+(?:siempre|nunca|jamás)(?![\\p{L}\\p{N}])`, 'iu'),
    new RegExp(`(?:${n}|he|she)\\s+(?:always|never)(?![\\p{L}\\p{N}])`, 'iu'),
    new RegExp(`(?:${n}|ele|ela)\\s+(?:sempre|nunca)(?![\\p{L}\\p{N}])`, 'iu'),
  ];
  for (const re of [...nameTied, ...STANDALONE_DETERMINISTIC]) {
    if (re.test(text)) found.add(re.source);
  }
  return [...found];
}

// ─── Placeholders sin resolver + literales basura ─────────────────────────────
const JUNK_LITERALS = ['undefined', 'null', 'NaN', 'Desconocido', 'unknown', '[object Object]'];

/** Placeholders `{...}` sin interpolar. (Las **negritas** no son `{}`, no matchean.) */
export function findPlaceholders(text: string): string[] {
  return text.match(/\{[^}]+\}/g) ?? [];
}

/** Literales basura como palabra suelta. */
export function findJunkLiterals(text: string): string[] {
  const found = new Set<string>();
  for (const j of JUNK_LITERALS) {
    const re = j.includes(' ') ? new RegExp(escapeRe(j), 'i') : new RegExp(`\\b${escapeRe(j)}\\b`);
    if (re.test(text)) found.add(j);
  }
  return [...found];
}

// ─── Guard de voseo (defensa en profundidad; el hook de contenido es la 1ª línea) ──
const VOSEO_PATTERNS: RegExp[] = [
  /\b(podés|querés|tenés|sabés|hacés|venís|sentís|decís|ponés|salís)\b/i,
  /\b(mirá|hacé|poné|tomá|vení|dejá|hablá|armá|buscá|esperá|bajá|fijate|acercate|sentate|enfocate)\b/i,
  /\b(decile|pedile|ponelo|dejalo|sacalo|haceme|explicale|mostrale|contale|resolvelo|seguí|tomate)\b/i,
  /\bde vos\b/i, /\ba vos\b/i, /\ben vos\b/i, /\bsos\b/i,
];
export function findVoseo(text: string): string[] {
  const found = new Set<string>();
  for (const re of VOSEO_PATTERNS) {
    const m = text.match(re);
    if (m) found.add(m[0].toLowerCase());
  }
  return [...found];
}

/** Guiones em/en en copy es. */
export function findDashes(text: string): boolean {
  return /[—–]/.test(text);
}
