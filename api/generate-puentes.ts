import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// The child's real name is NEVER sent to the AI provider. We inject a placeholder
// into the prompt (and scrub it out of the injected child-report summary), then
// rehydrate the real name into the output server-side. Mirrors generate-ai.ts /
// tenant-chat.ts / child-memory-cron.ts and honors the Privacy Policy's
// anonymization promise. (Security audit 2026-07-06.)
// The token the AI writes in place of the child's real name (rehydrated after
// generation). MUST NOT be Markdown: the old '__NAME__' reads as bold markup,
// so Gemini stripped the underscores and emitted a bare "NAME" that the
// exact-string replace never matched — the literal word leaked into the report
// AND the email (bug 2026-07-19). Brackets survive far better; the robust
// rehydrator below catches every variant regardless.
const NAME_PLACEHOLDER = '[NAME]';

// Matches the NAME token whether the model kept the brackets, converted them to
// other markers, or dropped them entirely (bare NAME). Case-SENSITIVE, and
// bounded by (?<![A-Za-z0-9])/(?![A-Za-z0-9]) instead of \b so an adjacent
// underscore (which \b treats as a word char, missing "__NAME__") still counts
// as a boundary — while a real word like "NAMED" or lowercase "name" never matches.
const NAME_TOKEN_RE = /(?:\[\[|\[|\{\{|\{|__|\*\*|_|\*|<)?(?<![A-Za-z0-9])NAME(?![A-Za-z0-9])(?:\]\]|\]|\}\}|\}|__|\*\*|_|\*|>)?/g;

function deepReplaceStrings<T>(value: T, from: string, to: string): T {
    if (!from || from === to) return value;
    if (typeof value === 'string') return value.split(from).join(to) as unknown as T;
    if (Array.isArray(value)) return value.map((v) => deepReplaceStrings(v, from, to)) as unknown as T;
    if (value && typeof value === 'object') {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
            out[k] = deepReplaceStrings(v, from, to);
        }
        return out as unknown as T;
    }
    return value;
}

// Rehydrate the real child name over any placeholder variant the model produced.
function rehydrateName<T>(value: T, realName: string): T {
    if (typeof value === 'string') return value.replace(NAME_TOKEN_RE, realName) as unknown as T;
    if (Array.isArray(value)) return value.map((v) => rehydrateName(v, realName)) as unknown as T;
    if (value && typeof value === 'object') {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
            out[k] = rehydrateName(v, realName);
        }
        return out as unknown as T;
    }
    return value;
}

/**
 * POST /api/generate-puentes
 * Body: { puentes_session_id }
 *
 * Reads the puentes_session (with its adult_profile + source child session),
 * generates the 4 bridges via Gemini, persists ai_sections, and marks the
 * session as 'generated'.
 *
 * Anti-hallucination layers:
 *  1. System message instructs probabilistic language and forbidden vocab
 *  2. JSON-mode output for clean parse
 *  3. Post-gen prohibited-words check with correction retry
 *  4. Two retries: API failure (2s delay) + JSON parse failure
 */

const PROHIBITED_WORDS: string[] = [
    // Spanish — deficit/clinical
    'error', 'errores', 'equivocación', 'equivocaciones', 'equivocarse',
    'fallo', 'falla', 'fallas', 'fracaso', 'fracasos',
    'déficit', 'problema', 'problemas', 'problemático', 'problemática',
    'corregir', 'arreglar', 'solucionar',
    'débil', 'debilidad', 'inseguro', 'incapaz',
    'agresivo', 'violento', 'torpe',
    'diagnóstico', 'diagnosticar', 'trastorno', 'patología', 'síndrome',
    'terapia', 'tratamiento',
    'frustración', 'frustraciones', 'frustrado', 'frustrada', 'frustrante', 'frustrar', 'frustra', 'frustran',
    'siempre será', 'nunca podrá', 'nació para', 'está destinado',
    // Adult-parent specific: avoid blame language
    'culpa', 'culpable', 'malo padre', 'mala madre', 'fallaste',
    'chocan', 'chocás', 'choque de perfiles',
    // English
    'mistake', 'mistakes', 'failure', 'failures', 'deficit',
    'fix', 'correct', 'weakness', 'weak', 'incapable',
    'aggressive', 'violent', 'clumsy',
    'diagnosis', 'disorder', 'pathology', 'syndrome',
    'therapy', 'treatment',
    'frustration', 'frustrated', 'frustrating', 'frustrate',
    'will always be', 'will never', 'born to', 'is destined',
    'bad parent', 'you failed',
    'profiles clash', 'profiles conflict',
    // Portuguese
    'erro', 'erros', 'engano', 'enganos', 'falha', 'fracasso',
    'déficit', 'problema', 'problemático',
    'corrigir', 'consertar',
    'fraco', 'fraqueza', 'incapaz',
    'agressivo', 'violento', 'desajeitado',
    'transtorno', 'patologia', 'síndrome',
    'terapia', 'tratamento',
    'frustração', 'frustrado', 'frustrada', 'frustrante', 'frustrar',
    'sempre será', 'nunca poderá', 'nasceu para',
    'culpa', 'mau pai', 'má mãe', 'falhou',
    'perfis chocam',
];

function findProhibitedWords(sections: Record<string, unknown>): string[] {
    const found = new Set<string>();
    const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const walk = (v: unknown): void => {
        if (typeof v === 'string') {
            for (const w of PROHIBITED_WORDS) {
                const pattern = /\s/.test(w)
                    ? new RegExp(escape(w), 'i')
                    : new RegExp(`\\b${escape(w)}\\b`, 'i');
                if (pattern.test(v)) found.add(w);
            }
        } else if (Array.isArray(v)) {
            v.forEach(walk);
        } else if (v !== null && typeof v === 'object') {
            Object.values(v).forEach(walk);
        }
    };
    walk(sections);
    return [...found];
}

// ─── Deterministic-language detector (anti-fixed-identity) ───────────────────
// HIGH-PRECISION patterns that catch language asserting a FIXED IDENTITY ABOUT
// THE CHILD ("X es un líder nato", "X siempre/nunca...", "será", "destinado a")
// — NOT the method, the axes, or legitimate probabilistic copy. We never match
// bare "es"/"siempre" (which appear in legit copy like "es probable que",
// "siempre desde la fortaleza"): the "is a/un" shapes are tied to the child's
// name or a pronoun, and only unambiguously categorical future/guarantee phrases
// are detected standalone. The Puentes output already uses the child's REAL name
// (no placeholder), so the name is injected into the pattern at call time.
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function buildDeterministicPatterns(childName: string): RegExp[] {
    const first = (childName || '').trim().split(/\s+/)[0];
    // Tolerate the placeholder with OR without its delimiters: the model often
    // drops the brackets and emits a bare NAME, so anchor on both forms.
    const bare = first.replace(/[[\]{}<>_*]/g, '');
    const namePart = first
        ? (bare && bare !== first ? `${escapeRe(first)}|${escapeRe(bare)}|` : `${escapeRe(first)}|`)
        : '';
    return [
        // Child (name / pronoun) + "es/será un(a)" + word ⇒ "X es un líder".
        new RegExp(`(?:${namePart}él|ella|el niño|la niña|el deportista)\\s+(?:es|será)\\s+un[ao]?\\s+\\p{L}`, 'iu'),
        new RegExp(`(?:${namePart}he|she|the athlete|the child)\\s+is\\s+a\\s+\\p{L}`, 'iu'),
        new RegExp(`(?:${namePart}ele|ela|a criança|o atleta)\\s+é\\s+um[a]?\\s+\\p{L}`, 'iu'),
        // Child + siempre/nunca/jamás ⇒ "X siempre se frustra".
        new RegExp(`(?:${namePart}él|ella)\\s+(?:siempre|nunca|jamás)(?![\\p{L}\\p{N}])`, 'iu'),
        new RegExp(`(?:${namePart}he|she)\\s+(?:always|never)(?![\\p{L}\\p{N}])`, 'iu'),
        new RegExp(`(?:${namePart}ele|ela)\\s+(?:sempre|nunca)(?![\\p{L}\\p{N}])`, 'iu'),
        // Categorical future / guarantee phrases (safe to detect standalone).
        // (No bare "será un(a)" — appears in legit copy; the child-tied pattern covers it.)
        /\bva a ser\b/iu, /\bserá siempre\b/iu,
        /\bdefinitivamente\b/iu, /\bsin duda\b/iu, /\bgarantiza\b/iu,
        /\bnació para\b/iu, /\bestá destinad[oa]\b/iu,
        /\bwill always\b/iu, /\bwill never\b/iu, /\bdefinitely\b/iu,
        /\bwithout a doubt\b/iu, /\bguarantees?\b/iu, /\bborn to\b/iu, /\bis destined\b/iu,
        /\bvai ser\b/iu, /\bsempre será\b/iu, /\bsem dúvida\b/iu, /\bgarante\b/iu, /\bnasceu para\b/iu,
    ];
}

// Returns the deterministic patterns (as source strings) that matched any string
// value of the sections object. Mirrors findProhibitedWords' walk so deterministic
// hits flow through the SAME correction path as prohibited words.
function findDeterministicHits(sections: Record<string, unknown>, patterns: RegExp[]): string[] {
    const found = new Set<string>();
    const walk = (v: unknown): void => {
        if (typeof v === 'string') {
            for (const re of patterns) {
                if (re.test(v)) found.add(re.source);
            }
        } else if (Array.isArray(v)) {
            v.forEach(walk);
        } else if (v !== null && typeof v === 'object') {
            Object.values(v).forEach(walk);
        }
    };
    walk(sections);
    return [...found];
}

const AXIS_LABELS = {
    D: { es: 'Impulsor (energía de impulso)', en: 'Driver (impulse energy)', pt: 'Impulsor (energia de impulso)' },
    I: { es: 'Conector (energía conectora)', en: 'Connector (connecting energy)', pt: 'Conector (energia conectora)' },
    S: { es: 'Sostén (energía de apoyo)', en: 'Supporter (support energy)', pt: 'Sustento (energia de apoio)' },
    C: { es: 'Estratega (energía analítica)', en: 'Strategist (analytical energy)', pt: 'Estrategista (energia analítica)' },
};

const MOTOR_LABELS = {
    agil: { es: 'ritmo ágil', en: 'agile pace', pt: 'ritmo ágil' },
    equilibrado: { es: 'ritmo equilibrado', en: 'balanced pace', pt: 'ritmo equilibrado' },
    profundo: { es: 'ritmo profundo', en: 'deep pace', pt: 'ritmo profundo' },
};

const PRESSURE_LABELS = {
    regulado: { es: 'regulado', en: 'regulated', pt: 'regulado' },
    reactivo: { es: 'reactivo', en: 'reactive', pt: 'reativo' },
    evitativo: { es: 'evitativo', en: 'avoidant', pt: 'evitativo' },
};

const HISTORY_LABELS = {
    ex_competitive: { es: 'practicó deporte competitivo varios años en su adolescencia', en: 'practiced competitive sport for several years as a teen', pt: 'praticou esporte competitivo por vários anos na adolescência' },
    ex_brief: { es: 'practicó deporte competitivo brevemente en su adolescencia', en: 'briefly practiced competitive sport as a teen', pt: 'praticou esporte competitivo brevemente na adolescência' },
    recreational: { es: 'practicó deporte de manera recreativa', en: 'played sport recreationally', pt: 'praticou esporte de forma recreativa' },
    none: { es: 'no tiene historia deportiva propia previa', en: 'has no prior personal sport history', pt: 'não tem história esportiva própria prévia' },
};

const EMOTION_LABELS = {
    orgullo: { es: 'orgullo', en: 'pride', pt: 'orgulho' },
    nervios: { es: 'nervios o ansiedad', en: 'nerves or anxiety', pt: 'nervosismo ou ansiedade' },
    disfrute: { es: 'disfrute pleno', en: 'full enjoyment', pt: 'diversão plena' },
    preocupacion: { es: 'preocupación', en: 'concern', pt: 'preocupação' },
    curiosidad: { es: 'curiosidad', en: 'curiosity', pt: 'curiosidade' },
    mezcla: { es: 'una mezcla de varias emociones', en: 'a mix of several emotions', pt: 'uma mistura de várias emoções' },
};

function buildPrompt(args: {
    childProfile: any;
    adultProfile: any;
    childName: string;
    sport: string;
    lang: 'es' | 'en' | 'pt';
}): string {
    const { childProfile, adultProfile, childName, sport, lang } = args;
    const ejePrimaryLabel = AXIS_LABELS[adultProfile.eje_primary as keyof typeof AXIS_LABELS][lang];
    const ejeSecondaryLabel = adultProfile.eje_secondary ? AXIS_LABELS[adultProfile.eje_secondary as keyof typeof AXIS_LABELS][lang] : null;
    const motorLabel = MOTOR_LABELS[adultProfile.motor as keyof typeof MOTOR_LABELS][lang];
    const pressureLabel = PRESSURE_LABELS[adultProfile.pressure_style as keyof typeof PRESSURE_LABELS][lang];
    const historyLabel = HISTORY_LABELS[adultProfile.history as keyof typeof HISTORY_LABELS][lang];
    const emotionLabel = EMOTION_LABELS[adultProfile.dominant_emotion as keyof typeof EMOTION_LABELS][lang];

    const childAxisLabel = AXIS_LABELS[childProfile.eje as keyof typeof AXIS_LABELS]?.[lang] ?? childProfile.eje;

    const langInstruction = lang === 'en'
        ? 'Write ALL text values in natural English. No Spanish whatsoever.'
        : lang === 'pt'
            ? 'Escreva TODOS os valores de texto em português natural. Nada de espanhol.'
            : 'Escribe TODOS los valores de texto en español latinoamericano neutro, sin voseo. Usa tuteo (tú, tienes, eres, puedes). Sin guiones largos (em dash).';

    const titles = lang === 'en' ? [
        'Before the game: the warm-up',
        'During the game: your presence',
        'When things go wrong: the setback',
        'After the match: the conversation',
        'In the long run: sustaining their bond with sport',
    ] : lang === 'pt' ? [
        'Antes do jogo: o pré-jogo',
        'Durante o jogo: a presença',
        'Quando algo não dá certo: o tropeço',
        'Depois da partida: a conversa',
        'No longo prazo: sustentar o vínculo com o esporte',
    ] : [
        'Antes del juego: la previa',
        'Durante el juego: la presencia',
        'Cuando algo no sale: el traspié',
        'Después del partido: la conversación',
        'El largo plazo: sostener su vínculo con el deporte',
    ];

    return `Tarea: Generar un informe "ArgoPuente®" para un adulto responsable de ${childName} (deporte: ${sport}).
El informe es un upsell tras el informe del niño y propone 5 PUENTES (no diagnósticos) entre el estilo natural del adulto y el del niño.

PERFIL DEL NIÑO (ya conocido):
- Arquetipo: ${childProfile.archetype_label || 'no especificado'}
- Eje: ${childAxisLabel}
- Motor (ritmo): ${childProfile.motor}
${childProfile.ai_sections?.resumenPerfil ? '- Resumen del informe del niño: ' + JSON.stringify(childProfile.ai_sections.resumenPerfil).slice(0, 600) : ''}

PERFIL DEL ADULTO (recién resuelto):
- Eje primario: ${ejePrimaryLabel}
${ejeSecondaryLabel ? '- Eje secundario: ' + ejeSecondaryLabel : ''}
- Motor: ${motorLabel}
- Estilo bajo presión: ${pressureLabel}
- Historia deportiva: ${historyLabel}
- Emoción predominante al ver jugar: ${emotionLabel}

REGLAS DE REDACCIÓN (estrictas):
1. Lenguaje probabilístico siempre: "tiende a", "es probable que", "podría", "suele", "parece". NUNCA absolutos.
2. Tono adulto a adulto. Reconocedor de fortalezas. No infantilizante. No clínico. No terapéutico.
3. NUNCA decir que los perfiles "chocan", "tienen conflicto" o son "incompatibles". Decir que se complementan o se calibran.
4. NUNCA culpabilizar al adulto. Cada puente reconoce primero lo que el adulto aporta naturalmente, después propone un puente.
5. NUNCA usar lenguaje determinista ("siempre será", "nunca podrá", "está destinado a").
6. NUNCA dar instrucciones prescriptivas ("debes", "tienes que"). Solo invitaciones ("podrías observar", "vale la pena registrar").
7. NUNCA usar las siguientes palabras: error, problema, fallo, déficit, corregir, débil, agresivo, diagnóstico, trastorno, terapia, tratamiento, culpa, culpable, frustración, frustrado, frustrante.
8. ${langInstruction}
9. Sin guiones largos (em dash, en dash). Si necesitas pausa, usa comas, paréntesis o punto.
10. Cada puente debe combinar específicamente el perfil del niño con el del adulto. El puente del traspié (cuando algo no sale, el 3º) DEBE incorporar el estilo bajo presión del adulto (${pressureLabel}).
11. No conocemos el género del niño ni del adulto. Refiérete a cada uno por su nombre y evita pronombres y adjetivos con marca de género (nada de él/ella, contento/a, cansado/a, listo/a, nervioso/a, seguro/a). Cuando una concordancia en español o portugués sea inevitable, reformula la frase o usa el nombre en lugar del pronombre. Nunca asumas si es varón o mujer.
12. VETA: ${ejeSecondaryLabel ? `el adulto tiene eje secundario (veta) ${ejeSecondaryLabel}. TÉJELO en el contenido de los puentes, no solo en el perfil: sobre todo en "lo_que_traes" y "el_puente", que se sientan los DOS ejes del adulto (${ejePrimaryLabel} y ${ejeSecondaryLabel}), no solo el primario.` : 'el adulto no tiene veta clara; trabaja solo su eje primario.'}
13. NEGRITAS: destaca con **negrita** (markdown, dobles asteriscos) 1 o 2 frases CLAVE en cada "como_esta_el", "lo_que_traes" y "el_puente" (NO en la pregunta_reflexion, NO en saludo/perfil/cierre). Sobre la frase más significativa, nunca palabras sueltas al azar.
14. NUNCA uses la palabra "frustración" (ni "frustrado", "frustrante"). Para ese momento habla del "traspié", de "cuando algo no sale", o describe la reacción sin etiquetarla.

ESTRUCTURA EXACTA (devuelve SOLO este JSON, sin markdown):
{
  "saludo": "1 párrafo cálido y breve (2-3 frases) que enmarca el informe como una invitación a mirar, no un diagnóstico ni una etiqueta. NO abras con saludo ni agradecimiento (nada de 'Hola' ni 'gracias por responder el cuestionario'): entra directo al encuadre.",
  "perfil_adulto_breve": "1 párrafo (4-5 frases). Refleja al adulto su eje primario${ejeSecondaryLabel ? ' (y secundario)' : ''}, motor, estilo bajo presión. Reconocedor, valida su estilo natural sin juzgar.",
  "punto_encuentro": "2-3 frases sobre EL PUNTO DE ENCUENTRO entre ${childName} y tú: el hilo de fondo que COMPARTEN, su terreno común, NUNCA sus diferencias de estilo (los 5 puentes ya trabajan las diferencias; aquí no las repitas ni las insinúes). Abre con el marco 'el niño y tú' (por ejemplo 'A ${childName} y a ti...') en segunda persona, y cierra con un ángulo NUEVO, positivo y verdadero, que no suene a fórmula. Halla el terreno común más genuino cruzando el eje PRIMARIO del adulto (${ejePrimaryLabel}, el orbe que muestra la tarjeta) con el eje de ${childName} (${childAxisLabel}), según esta lógica DISC de dos dimensiones: Impulsor y Estratega son ejes de TAREA (comparten el foco en el objetivo, en que las cosas salgan); Conector y Sostenedor son ejes de VÍNCULO (comparten el cuidado del clima y de la relación); Impulsor y Conector son ACTIVOS (energía, iniciativa, ir hacia afuera); Estratega y Sostenedor son PAUSADOS (calma, constancia, procesar antes de actuar); si es el MISMO eje, comparten esa misma fortaleza de base, un idioma que ya hablan sin traducir; si son diagonalmente opuestos (Impulsor con Sostenedor, o Conector con Estratega, sin dimensión de estilo en común), no fuerces una similitud: el encuentro está en lo que sostiene a ambos por debajo, el mismo interés genuino por ${childName} y por su deporte, cada uno desde una esquina distinta. Cuando el cruce toque dos lógicas a la vez, elige UN solo hilo, el más real, no los enumeres. Solo teje la veta (eje secundario) si refuerza ese mismo hilo. Refiérete a cada uno por su nombre (sin pronombres ni adjetivos con marca de género) y usa lenguaje probabilístico.",
  "puentes": [
    {
      "titulo": "${titles[0]}",
      "como_esta_el": "2-3 frases probabilísticas sobre cómo tiende a estar ${childName} antes de jugar (la previa), según su perfil",
      "lo_que_traes": "2-3 frases reconociendo lo que el adulto aporta naturalmente en la previa, según su eje (y su veta si la tiene) y su motor",
      "el_puente": "3-4 frases. Cómo se combinan ambos perfiles antes de empezar. Observaciones o pequeños ajustes (no prescripciones). Lenguaje de invitación.",
      "pregunta_reflexion": "Una pregunta abierta para sostener en el tiempo, en segunda persona"
    },
    {
      "titulo": "${titles[1]}",
      "como_esta_el": "2-3 frases sobre cómo tiende a estar ${childName} DURANTE el juego, en vivo, según su perfil y su motor (ritmo): cómo lee el clima y las señales mientras juega",
      "lo_que_traes": "2-3 frases reconociendo lo que el adulto transmite EN VIVO desde afuera (su temperatura, su presencia), según su eje (y su veta si la tiene), su motor y su estilo bajo presión",
      "el_puente": "3-4 frases. El canal en tiempo real: lo que el adulto TRANSMITE (calma, señal, confianza) pesa tanto como lo que dice; vale para quien mira desde la tribuna Y para quien dirige desde la línea. La dosis de señal según el ritmo del niño. NO es cómo reaccionar cuando algo sale mal (eso va en el puente del traspié): aquí va la presencia estable de base.",
      "pregunta_reflexion": "Una pregunta abierta sobre la presencia en vivo, en segunda persona"
    },
    {
      "titulo": "${titles[2]}",
      "como_esta_el": "2-3 frases sobre cómo tiende a responder ${childName} cuando algo sale mal (un traspié), según su perfil. NO uses la palabra frustración.",
      "lo_que_traes": "2-3 frases reconociendo cómo el adulto vive ese momento, según su eje (y su veta si la tiene)",
      "el_puente": "3-4 frases. CRÍTICO: combinar el estilo del niño con el ESTILO BAJO PRESIÓN del adulto (${pressureLabel}). Este es el puente más sensible. Reconocer primero, invitar después.",
      "pregunta_reflexion": "Una pregunta para llevarse"
    },
    {
      "titulo": "${titles[3]}",
      "como_esta_el": "2-3 frases sobre el timing y la forma en que ${childName} procesa lo vivido después del partido, según su motor (ritmo). Cubre TANTO un partido difícil COMO uno muy bueno (no asumas que siempre salió mal).",
      "lo_que_traes": "2-3 frases sobre el estilo conversacional natural del adulto, según su eje (y su veta si la tiene)",
      "el_puente": "3-4 frases. Timing y lenguaje después de jugar, gane o pierda: cuándo abrir conversación, cuándo dar espacio, qué frases pueden llegar mejor. Incluye también cómo acompañar cuando salió MUY bien (celebrar sin inflar, nombrar lo que hizo más allá del resultado).",
      "pregunta_reflexion": "Una pregunta reflexiva"
    },
    {
      "titulo": "${titles[4]}",
      "como_esta_el": "2-3 frases sobre qué nutre el disfrute deportivo de ${childName} en el largo plazo, según su perfil",
      "lo_que_traes": "2-3 frases. Considera la historia deportiva del adulto (${historyLabel}) y su emoción dominante (${emotionLabel}). Reconoce sin juzgar.",
      "el_puente": "3-4 frases. Prácticas sostenibles que protegen el gozo del niño en el deporte. Deja claro que el cariño y el vínculo NO están atados al resultado de un partido. Reconocer que ambas formas son válidas.",
      "pregunta_reflexion": "Una pregunta de cierre"
    }
  ],
  "cierre": "1 párrafo (3-4 frases). Refuerza que esto NO es un diagnóstico, que ambos perfiles son válidos, y que el vínculo se construye día a día."
}`;
}

async function callGemini(args: { systemContent: string; userContent: string; maxTokens?: number }): Promise<{ content: string; inputTokens: number; outputTokens: number }> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('Missing GEMINI_API_KEY');

    const body = {
        contents: [{ role: 'user', parts: [{ text: args.userContent }] }],
        systemInstruction: { parts: [{ text: args.systemContent }] },
        generationConfig: {
            temperature: 0.75,
            maxOutputTokens: args.maxTokens ?? 12000,
            responseMimeType: 'application/json',
        },
    };

    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!r.ok) { const err = await r.text(); throw new Error(`Gemini error ${r.status}: ${err}`); }
    const data = await r.json();
    const usage = data.usageMetadata ?? {};
    return {
        content: data.candidates?.[0]?.content?.parts?.[0]?.text ?? '',
        inputTokens: usage.promptTokenCount ?? 0,
        outputTokens: usage.candidatesTokenCount ?? 0,
    };
}

function parseJsonResponse(content: string): unknown {
    const cleaned = content.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
    return JSON.parse(cleaned);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });

    const sb = createClient(supabaseUrl, serviceKey);

    try {
        const { puentes_session_id } = req.body as { puentes_session_id?: string };
        if (!puentes_session_id) return res.status(400).json({ error: 'Missing puentes_session_id' });

        // Fetch puentes_session + source child perfilamiento
        const { data: pSession, error: pErr } = await sb
            .from('puentes_sessions')
            .select('*, source:perfilamientos!source_session_id(id, child_name, sport, eje, motor, archetype_label, ai_sections, lang, report_v4)')
            .eq('id', puentes_session_id)
            .maybeSingle();
        if (pErr || !pSession) return res.status(404).json({ error: 'Puentes session not found' });
        if (!pSession.adult_profile) return res.status(400).json({ error: 'Adult profile not resolved yet' });

        const child = pSession.source as any;
        if (!child) return res.status(404).json({ error: 'Source child session not found' });

        // Mark as generating
        await sb.from('puentes_sessions').update({ status: 'generating' }).eq('id', puentes_session_id);

        const lang = (pSession.lang || 'es') as 'es' | 'en' | 'pt';
        const systemContent = lang === 'es'
            ? 'Eres un especialista en DISC aplicado a la psicología deportiva juvenil. Trabajas para ArgoMethod®. Respondes SOLO con JSON válido, sin markdown ni explicaciones. Tono adulto a adulto, lenguaje probabilístico, sin etiquetas clínicas.'
            : lang === 'pt'
                ? 'Você é um especialista em DISC aplicado à psicologia esportiva juvenil. Trabalha para o ArgoMethod®. Responde SOMENTE com JSON válido, sem markdown nem explicações. Tom adulto a adulto, linguagem probabilística, sem rótulos clínicos.'
                : 'You are a specialist in DISC applied to youth sports psychology. You work for ArgoMethod®. Respond ONLY with valid JSON, no markdown or explanations. Adult to adult tone, probabilistic language, no clinical labels.';

        // Never send the real child name to Gemini: use a placeholder in the prompt
        // and scrub it out of the injected child-report summary. Rehydrated below.
        const realChildName: string = child.child_name || (lang === 'en' ? 'the child' : lang === 'pt' ? 'a criança' : 'el niño');
        const hasRealName = !!child.child_name;
        const scrubbedChildAiSections = hasRealName
            ? deepReplaceStrings(child.ai_sections, realChildName, NAME_PLACEHOLDER)
            : child.ai_sections;

        const userContent = buildPrompt({
            childProfile: {
                eje: child.eje,
                motor: child.motor,
                // V4 naming (2026-07-08): use the new eje×veta label ("Impulsor con veta Conector")
                // when the child has a v4 report, so the Puente doesn't reintroduce the old
                // eje×motor name ("Impulsor Dinámico") the adult no longer sees. Falls back to legacy.
                archetype_label: (child.report_v4 as { hero?: { arquetipoLabel?: string } } | null)?.hero?.arquetipoLabel || child.archetype_label,
                ai_sections: scrubbedChildAiSections,
            },
            adultProfile: pSession.adult_profile,
            childName: hasRealName ? NAME_PLACEHOLDER : realChildName,
            sport: child.sport || (lang === 'en' ? 'sport' : lang === 'pt' ? 'esporte' : 'deporte'),
            lang,
        });

        // Generation with retry on API failure and parse failure
        let resp;
        try {
            resp = await callGemini({ systemContent, userContent });
        } catch (err1) {
            console.warn('[generate-puentes] First attempt failed, retrying in 2s', err1 instanceof Error ? err1.message : err1);
            await new Promise(r => setTimeout(r, 2000));
            resp = await callGemini({ systemContent, userContent });
        }

        let aiSections: any;
        try {
            aiSections = parseJsonResponse(resp.content);
        } catch (parseErr) {
            console.warn('[generate-puentes] Parse failed, retrying. Last 200:', resp.content.slice(-200));
            await new Promise(r => setTimeout(r, 2000));
            const retry = await callGemini({ systemContent, userContent });
            aiSections = parseJsonResponse(retry.content);
            resp = retry;
        }

        // Sanity check shape
        if (!aiSections.puentes || !Array.isArray(aiSections.puentes) || aiSections.puentes.length !== 5) {
            console.error('[generate-puentes] Invalid shape from AI:', JSON.stringify(aiSections).slice(0, 500));
            await sb.from('puentes_sessions').update({
                status: 'failed',
                error_log: 'Invalid AI response shape',
            }).eq('id', puentes_session_id);
            return res.status(502).json({ error: 'Invalid AI response shape' });
        }

        // Prohibited words + deterministic-language enforcement. Deterministic
        // hits flow through the SAME single correction-retry path. If anything
        // persists after the retry we behave exactly as before (log + serve the
        // generated content; never block the report).
        // Patterns anchor on the placeholder because the AI output still carries
        // __NAME__ at this point (rehydrated to the real name only after the checks).
        const detPatterns = buildDeterministicPatterns(hasRealName ? NAME_PLACEHOLDER : '');
        const offenders = findProhibitedWords(aiSections);
        const detOffenders = findDeterministicHits(aiSections, detPatterns);
        if (offenders.length > 0 || detOffenders.length > 0) {
            if (offenders.length > 0) console.warn('[generate-puentes] Prohibited words found on first pass:', offenders.join(', '));
            if (detOffenders.length > 0) console.warn('[generate-puentes] Deterministic language found on first pass:', detOffenders.join(' | '));
            const correctionUser = `${userContent}\n\nThe previous response contained language Argo does not allow${offenders.length > 0 ? ` (forbidden words: ${offenders.join(', ')})` : ''}${detOffenders.length > 0 ? ` and deterministic statements about the child ("X es/será un...", "siempre/nunca", "destinado a")` : ''}. Rewrite the complete JSON without them, keeping the same structure and meaning. Use probabilistic, non-categorical and non-clinical language ("tiende a", "suele", "es probable que", "podría"); never assert a fixed identity about the child.`;
            try {
                const correction = await callGemini({ systemContent, userContent: correctionUser });
                const corrected = parseJsonResponse(correction.content);
                const stillOffending = findProhibitedWords(corrected as any);
                const stillDet = findDeterministicHits(corrected as any, detPatterns);
                if (stillOffending.length === 0 && stillDet.length === 0) {
                    aiSections = corrected;
                    resp = correction;
                } else {
                    if (stillOffending.length > 0) console.warn('[generate-puentes] Still has prohibited words after correction:', stillOffending.join(', '));
                    if (stillDet.length > 0) console.warn('[generate-puentes] Still has deterministic language after correction:', stillDet.join(' | '));
                }
            } catch (corrErr) {
                console.warn('[generate-puentes] Correction retry failed', corrErr);
            }
        }

        // Rehydrate the real child name into the output; it was never sent to
        // Gemini. Robust to any delimiter form the model produced (bare NAME,
        // [NAME], __NAME__, etc.) so the placeholder never leaks to the report.
        if (hasRealName) aiSections = rehydrateName(aiSections, realChildName);

        const costUsd = resp.inputTokens * (0.15 / 1_000_000) + resp.outputTokens * (0.60 / 1_000_000);

        await sb.from('puentes_sessions').update({
            ai_sections: aiSections,
            status: 'generated',
            completed_at: new Date().toISOString(),
        }).eq('id', puentes_session_id);

        return res.status(200).json({
            ok: true,
            ai_sections: aiSections,
            tokens_input: resp.inputTokens,
            tokens_output: resp.outputTokens,
            cost_usd: costUsd,
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[generate-puentes] Error:', msg);
        try {
            const sb2 = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
            const id = (req.body as any)?.puentes_session_id;
            if (id) await sb2.from('puentes_sessions').update({ status: 'failed', error_log: msg }).eq('id', id);
        } catch (e2) { /* ignore */ }
        return res.status(500).json({ error: 'Generation failed', detail: msg });
    }
}
