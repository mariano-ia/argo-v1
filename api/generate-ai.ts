import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Report generation (Gemini + OpenAI fallback) can take 20-40s. Without this,
// a slower model response would hit the platform's default timeout and fail.
export const maxDuration = 60;

// ─── Types (mirrored from client) ────────────────────────────────────────────

interface Archetype {
    id: string;
    eje: string;
    motor: string;
    label: string;
}

interface Checklist {
    antes: string;
    durante: string;
    despues: string;
}

interface GuiaRow {
    situacion: string;
    activador: string;
    desmotivacion: string;
}

interface ReportData {
    nombre: string;
    arquetipo: Archetype;
    perfil: string;
    bienvenida: string;
    wow: string;
    motorDesc: string;
    combustible: string;
    grupoEspacio: string;
    corazon: string;
    reseteo: string;
    ecos: string;
    checklist: Checklist;
    palabrasPuente: string[];
    palabrasRuido: string[];
    guia: GuiaRow[];
    ejeSecundario?: string;
    tendenciaLabel?: string;
    tendenciaParagraph?: string;
    palabrasPuenteExtra?: string[];
    palabrasRuidoExtra?: string[];
    resumenPerfil?: string;
}

interface ReportContext {
    nombre: string;
    deporte: string;
    edad: number;
    destinatario: 'padre' | 'entrenador';
    lang?: string;
}

interface AISections {
    resumenPerfil: string;
    wow: string;
    motorDesc: string;
    combustible: string;
    corazon: string;
    reseteo: string;
    ecos: string;
    checklist: { antes: string; durante: string; despues: string };
}

interface AIUsage {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    costUsd: number;
}

// ─── Prompt logic ────────────────────────────────────────────────────────────

const WRITING_RULES = `
REGLAS DE REDACCIÓN OBLIGATORIAS (Método Argo):

LENGUAJE DE PROBABILIDAD (nunca de sentencia):
- Usa SIEMPRE "tiende a...", "es probable que...", "podría sentirse más cómodo si...".
- NUNCA afirmaciones absolutas como "Él es...", "Él necesita...", "Esto le pasa...".
- Esto describe tendencias presentes que pueden evolucionar, no identidad fija.

DEL "HACER" AL "ACOMPAÑAR":
- Los consejos NO son órdenes operativas ("Llegar temprano", "Explicar reglas").
- Son invitaciones a ajustar el entorno para que el deportista fluya naturalmente.
- El adulto acompaña, observa y facilita — no interviene ni corrige al niño.

DEL "DÉFICIT" AL "RITMO NATURAL":
- Cada característica es una fortaleza de adaptación, nunca una debilidad.
- No es que "tarda en reaccionar" (déficit), sino que "procesa con profundidad" (valor).
- Ninguna recomendación debe sonar a que el niño está "roto" o necesita ser "arreglado".

VOCABULARIO PROHIBIDO — jamás uses estas palabras:
error, control, dominación, agresividad, confrontación, rígido, estructurado (negativo), lento (negativo), pesado, débil, inseguro, problema, déficit, corregir, falla.

VOCABULARIO POSITIVO por eje:
- D (Dominancia) → "Energía de Impulso", iniciativa, coraje, proponer desafíos
- I (Influencia) → "Energía Conectora", motivar, integrar, alegría al juego
- S (Estabilidad) → "Energía de Sostén", lealtad, constancia, pilar de confianza
- C (Cumplimiento) → "Energía Estratega", atención al detalle, calidad, excelencia

TONO Y FOCO:
- Profesional pero cálido. No clínico, no infantil.
- Foco en bienestar y disfrute deportivo, no en rendimiento ni éxito.
- Los "Evitar" son condiciones de entorno a cuidar, no errores del niño.
- El informe debe ser una "Invitación al Disfrute", no un "Manual del Niño".
- Personaliza con el nombre del deportista y ejemplos concretos del deporte.
`.trim();

const LANG_LABELS: Record<string, string> = {
    es: 'Spanish (Latin American, neutral — use "tú" conjugations, never voseo)',
    en: 'English (American, natural and warm)',
    pt: 'Portuguese (Brazilian, natural and warm)',
};

// Placeholder used in prompts + AI responses instead of the child's real name.
// The real name never leaves our servers. We strip it before sending and
// restore it in the response before saving/returning to the client.
// Short and unique so it doesn't inflate the token count or confuse JSON.
const NAME_PLACEHOLDER = '__NAME__';

function buildPrompt(base: ReportData, ctx: ReportContext): string {
    const destinatarioLabel = ctx.destinatario === 'padre'
        ? 'el padre/madre del deportista (tono cálido, doméstico, empático)'
        : 'el entrenador/coach (tono táctico, de cancha, práctico)';

    const langCode = ctx.lang || 'es';
    const langLabel = LANG_LABELS[langCode] || LANG_LABELS.es;
    const isNonEs = langCode !== 'es';

    const langInstruction = isNonEs
        ? `\n\nCRITICAL LANGUAGE INSTRUCTION: Write ALL output text in ${langLabel}. The base content below is in Spanish — use it as conceptual reference ONLY. Your response MUST be entirely in ${langLabel}. Do NOT mix languages.`
        : '';

    const jsonSchema = `{
  "resumenPerfil": "section text (3-4 sentences, use **bold** for key traits)",
  "wow": "section text",
  "motorDesc": "section text",
  "combustible": "section text",
  "corazon": "section text",
  "reseteo": "section text",
  "ecos": "section text",
  "checklist": {
    "antes": "text",
    "durante": "text",
    "despues": "text"
  }
}`;

    // Every field is plain text. The model sometimes formats the checklist as
    // an HTML `<ul><li>` list, which renders as literal tags in the report.
    const formatRule = `\n\nFORMATO (OBLIGATORIO): Todos los campos son TEXTO PLANO. NO uses HTML (nada de <ul>, <li>, <b>, <p>, <br>) ni listas con viñetas ni numeración. La única marca permitida es **negrita** con dobles asteriscos donde el esquema lo indique. Cada campo del checklist ("antes", "durante", "despues") debe ser UNA frase breve y fluida (máximo 2 oraciones), no una lista.`;

    return `Eres un redactor especialista del Método Argo, un sistema de perfilado conductual para deportistas infantiles basado en DISC.${langInstruction}

${WRITING_RULES}

PRIVACY: The athlete's real name is anonymized. Use ${NAME_PLACEHOLDER} as a placeholder wherever you refer to the athlete by name. Our server will replace it with the real name before display.

CONTEXTO DEL DEPORTISTA:
- Nombre: ${NAME_PLACEHOLDER}
- Deporte: ${ctx.deporte}
- Edad: ${ctx.edad} años
- Arquetipo: ${base.arquetipo.label} (Eje ${base.arquetipo.eje}, Motor ${base.arquetipo.motor})
- Perfil: ${base.perfil}
- Eje Secundario: ${base.ejeSecundario ?? 'N/A'} (${base.tendenciaLabel ?? ''})
- Destinatario: ${destinatarioLabel}

CONTENIDO BASE (usa esto como esqueleto de referencia conceptual, NO lo copies textualmente):
- Lugar en la Nave: ${base.wow}
- Motor: ${base.motorDesc}
- Combustible: ${base.combustible}
- Lenguaje de Intención: ${base.corazon}
- Gestión del Desajuste: ${base.reseteo}
- Ecos de la Nave: ${base.ecos}
- Checklist Antes: ${base.checklist.antes}
- Checklist Durante: ${base.checklist.durante}
- Checklist Después: ${base.checklist.despues}

TAREA: Reescribe las siguientes secciones personalizando con el deporte "${ctx.deporte}" y la edad de ${ctx.edad} años. Incluye ejemplos específicos del deporte (jugadas, momentos del partido, situaciones de entrenamiento propias de ${ctx.deporte}). Mantén la esencia del arquetipo pero haz el texto único para este perfil. Si el contenido base contiene afirmaciones categóricas sobre el niño, conviértelas a lenguaje probabilístico ("tiende a", "suele", "es probable que"); nunca afirmes una identidad fija ("es un...", "siempre", "será", "destinado a").

SECCIÓN ESPECIAL — "resumenPerfil" (Retrato de Sintonía):
Este es EL momento central del informe. Un párrafo de 3-4 oraciones que capture la esencia de ${NAME_PLACEHOLDER} en el deporte. Debe ser:
- Único e irrepetible (que un padre lea esto y sienta "esto ES mi hijo")
- Usa **negritas** en las frases clave para que sea escaneable (2-3 frases en negrita por párrafo)
- Abre con algo específico sobre cómo ${NAME_PLACEHOLDER} tiende a vivir ${ctx.deporte} (no genérico)
- Nombra su fortaleza central, cómo se manifiesta en cancha, y qué lo hace especial en un equipo
- Cierra con una invitación sutil al adulto a seguir leyendo el informe para sintonizar mejor con el deportista (adapta esta frase al idioma de salida)
- NO repitas contenido del "wow" ni del "combustible", este es un retrato rápido y emocional
- Tono: cálido, directo, que enganche desde la primera línea
${base.ejeSecundario ? `\nEl perfil tiene una tendencia secundaria "${base.tendenciaLabel}" (eje ${base.ejeSecundario}) que refleja una flexibilidad natural.${base.tendenciaParagraph ? ` Contexto de la tendencia: ${base.tendenciaParagraph}` : ''} Menciona sutilmente esta tendencia en las secciones "wow", "combustible" y "corazon", sin diluir la identidad del arquetipo primario. Usa la información del párrafo de tendencia para enriquecer la personalización.` : ''}

Devuelve ÚNICAMENTE un JSON válido con esta estructura exacta (sin markdown, sin explicaciones). Usa ${NAME_PLACEHOLDER} para mencionar al deportista.${formatRule}
${jsonSchema}`;
}

// Recursively walks an object and replaces {{NOMBRE}} with the real name in
// every string value. Used to "rehydrate" the AI response before saving to DB
// or returning to the client.
function rehydrateName<T>(value: T, realName: string): T {
    if (typeof value === 'string') {
        // split/join avoids the ES2021 String.prototype.replaceAll requirement.
        return value.split(NAME_PLACEHOLDER).join(realName) as unknown as T;
    }
    if (Array.isArray(value)) {
        return value.map(v => rehydrateName(v, realName)) as unknown as T;
    }
    if (value !== null && typeof value === 'object') {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
            out[k] = rehydrateName(v, realName);
        }
        return out as T;
    }
    return value;
}

// Strips HTML markup from a string while preserving readable plain text.
// The schema asks every field for plain text, but the model occasionally
// formats fields (notably the checklist) as `<ul><li><b>...` lists. Those
// tags render as literal text in the React report page (auto-escaped) and
// would render as actual markup in the email/PDF, so we normalize at the
// source. `**bold**` markdown is intentionally left intact — renderers
// convert it. List items and line breaks become spaces so the prose flows.
function stripHtmlTags(s: string): string {
    return s
        .replace(/<\/(li|p|div|ul|ol)>/gi, ' ')
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

// Recursively strips HTML from every string value of the AI response so no
// markup reaches the database. Only runs the regex when a tag is present.
function sanitizeSections<T>(value: T): T {
    if (typeof value === 'string') {
        return (/<[^>]+>/.test(value) ? stripHtmlTags(value) : value) as unknown as T;
    }
    if (Array.isArray(value)) {
        return value.map(v => sanitizeSections(v)) as unknown as T;
    }
    if (value !== null && typeof value === 'object') {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
            out[k] = sanitizeSections(v);
        }
        return out as T;
    }
    return value;
}

// Prohibited vocabulary per the Argo writing rules. Listed across the three
// supported languages because the report can be generated in any of them and
// the model sometimes uses native synonyms of forbidden concepts.
const PROHIBITED_WORDS: string[] = [
    // Spanish — deficit/clinical framing
    'error', 'errores', 'equivocación', 'equivocaciones', 'equivocarse',
    'fallo', 'falla', 'fallas', 'fracaso', 'fracasos',
    'déficit', 'problema', 'problemas', 'problemático', 'problemática',
    'corregir', 'arreglar', 'solucionar',
    'débil', 'debilidad', 'inseguro', 'incapaz',
    'agresivo', 'violento', 'torpe',
    // Spanish — clinical/diagnostic
    'diagnóstico', 'diagnosticar', 'trastorno', 'patología', 'síndrome',
    'tdah', 'autismo', 'terapia', 'tratamiento',
    // Spanish — deterministic
    'siempre será', 'nunca podrá', 'nació para', 'está destinado',
    // English — deficit/clinical
    'mistake', 'mistakes', 'failure', 'failures', 'deficit',
    'fix', 'correct', 'weakness', 'weak',
    'aggressive', 'violent', 'clumsy',
    'diagnosis', 'disorder', 'pathology', 'syndrome',
    'adhd', 'autism', 'therapy', 'treatment',
    'will always be', 'will never', 'born to', 'is destined',
    // Portuguese — deficit/clinical
    'erro', 'erros', 'engano', 'enganos', 'falha', 'fracasso',
    'déficit', 'problema', 'problemático',
    'corrigir', 'consertar',
    'fraco', 'fraqueza', 'incapaz',
    'agressivo', 'violento', 'desajeitado',
    'diagnóstico', 'transtorno', 'patologia', 'síndrome',
    'tdah', 'autismo', 'terapia', 'tratamento',
    'sempre será', 'nunca poderá', 'nasceu para',
];

// Returns a deduped list of prohibited words found in any string value of
// the given sections object (case-insensitive, whole-word match).
function findProhibitedWords(sections: Record<string, unknown>): string[] {
    const found = new Set<string>();
    const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const walk = (v: unknown): void => {
        if (typeof v === 'string') {
            for (const w of PROHIBITED_WORDS) {
                // Use word boundary for single words; plain includes for multi-word phrases
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
// THE CHILD ("X is a born leader", "X will always be...") — NOT the method, the
// axes, or legitimate probabilistic copy. To stay safe we never match bare "es"
// or bare "siempre" (which appear in legit copy like "es probable que", "es un
// buen momento para", "siempre desde la fortaleza"): the "is a/un" shapes are
// tied to the child's name placeholder or a pronoun, and only unambiguously
// categorical future/guarantee phrases are detected standalone.
// In generate-ai the child's name is the `__NAME__` placeholder (real name is
// rehydrated AFTER this check), so detection runs against the placeholder.
const NAME = NAME_PLACEHOLDER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const DETERMINISTIC_PATTERNS: RegExp[] = [
    // Child (name placeholder / pronoun) + "es/será un(a)" + word ⇒ "X es un líder".
    new RegExp(`(?:${NAME}|él|ella|el niño|la niña|el deportista)\\s+(?:es|será)\\s+un[ao]?\\s+\\p{L}`, 'iu'),
    new RegExp(`(?:${NAME}|he|she|the athlete|the child)\\s+is\\s+a\\s+\\p{L}`, 'iu'),
    new RegExp(`(?:${NAME}|ele|ela|a criança|o atleta)\\s+é\\s+um[a]?\\s+\\p{L}`, 'iu'),
    // Child + siempre/nunca/jamás (+ verb implied) ⇒ "X siempre se frustra".
    new RegExp(`(?:${NAME}|él|ella)\\s+(?:siempre|nunca|jamás)(?![\\p{L}\\p{N}])`, 'iu'),
    new RegExp(`(?:${NAME}|he|she)\\s+(?:always|never)(?![\\p{L}\\p{N}])`, 'iu'),
    new RegExp(`(?:${NAME}|ele|ela)\\s+(?:sempre|nunca)(?![\\p{L}\\p{N}])`, 'iu'),
    // Categorical future / guarantee phrases (safe to detect standalone).
    // (No bare "será un(a)" — it appears in legit copy like "el informe será una
    // invitación"; the child-tied "X es/será un(a)" pattern above covers the real case.)
    /\bva a ser\b/iu, /\bserá siempre\b/iu,
    /\bdefinitivamente\b/iu, /\bsin duda\b/iu, /\bgarantiza\b/iu,
    /\bnació para\b/iu, /\bestá destinad[oa]\b/iu,
    /\bwill always\b/iu, /\bwill never\b/iu, /\bdefinitely\b/iu,
    /\bwithout a doubt\b/iu, /\bguarantees?\b/iu, /\bborn to\b/iu, /\bis destined\b/iu,
    /\bvai ser\b/iu, /\bsempre será\b/iu, /\bsem dúvida\b/iu, /\bgarante\b/iu, /\bnasceu para\b/iu,
];

// Returns the deterministic patterns (as source strings) that matched any string
// value of the sections object. Mirrors findProhibitedWords' walk so deterministic
// hits flow through the SAME correction+telemetry path as prohibited words.
function findDeterministicHits(sections: Record<string, unknown>): string[] {
    const found = new Set<string>();
    const walk = (v: unknown): void => {
        if (typeof v === 'string') {
            for (const re of DETERMINISTIC_PATTERNS) {
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

// ─── Inline AI providers (Vercel serverless can't import between api files) ──
// Primary: Gemini 2.5 Flash. Fallback: OpenAI (gpt-4o) when Gemini fails — so a
// report is never blocked by a single provider's outage. A personalized report
// is only ever produced when one of these succeeds; we never fall back to
// un-personalized base content.

type AIProvider = 'gemini' | 'openai';
interface AIMsg { role: 'system' | 'user' | 'assistant'; content: string; }
interface AIResp { content: string; inputTokens: number; outputTokens: number; totalTokens: number; provider: AIProvider; }

// Per-provider pricing (USD per token), used for usage cost reporting.
const PRICING: Record<AIProvider, { in: number; out: number }> = {
    gemini: { in: 0.15 / 1_000_000, out: 0.60 / 1_000_000 },  // gemini-2.5-flash
    openai: { in: 2.50 / 1_000_000, out: 10.0 / 1_000_000 },  // gpt-4o
};

function getCostUsd(r: AIResp): number {
    const p = PRICING[r.provider];
    return r.inputTokens * p.in + r.outputTokens * p.out;
}

async function callGemini(messages: AIMsg[], opts: { temperature?: number; maxTokens?: number } = {}): Promise<AIResp> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('Missing GEMINI_API_KEY');
    const temperature = opts.temperature ?? 0.7;
    const maxTokens = opts.maxTokens ?? 3000;
    const systemMsg = messages.find(m => m.role === 'system');
    const conversationMsgs = messages.filter(m => m.role !== 'system');
    const contents = conversationMsgs.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
    const body: Record<string, unknown> = {
        contents,
        generationConfig: { temperature, maxOutputTokens: maxTokens, responseMimeType: 'application/json' },
    };
    if (systemMsg) body.systemInstruction = { parts: [{ text: systemMsg.content }] };
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (!res.ok) { const err = await res.text(); throw new Error(`Gemini error ${res.status}: ${err}`); }
    const data = await res.json();
    const usage = data.usageMetadata ?? {};
    return { content: data.candidates?.[0]?.content?.parts?.[0]?.text ?? '', inputTokens: usage.promptTokenCount ?? 0, outputTokens: usage.candidatesTokenCount ?? 0, totalTokens: usage.totalTokenCount ?? 0, provider: 'gemini' };
}

async function callOpenAI(messages: AIMsg[], opts: { temperature?: number; maxTokens?: number } = {}): Promise<AIResp> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('Missing OPENAI_API_KEY');
    const temperature = opts.temperature ?? 0.7;
    const maxTokens = opts.maxTokens ?? 3000;
    // OpenAI's chat API uses the system/user/assistant roles as-is.
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
            model: 'gpt-4o',
            messages: messages.map(m => ({ role: m.role, content: m.content })),
            temperature,
            max_tokens: maxTokens,
            response_format: { type: 'json_object' },
        }),
    });
    if (!res.ok) { const err = await res.text(); throw new Error(`OpenAI error ${res.status}: ${err}`); }
    const data = await res.json();
    const usage = data.usage ?? {};
    return { content: data.choices?.[0]?.message?.content ?? '', inputTokens: usage.prompt_tokens ?? 0, outputTokens: usage.completion_tokens ?? 0, totalTokens: usage.total_tokens ?? 0, provider: 'openai' };
}

// Orchestrator: try the preferred provider, fall back to the other on any error.
async function callAI(messages: AIMsg[], opts: { temperature?: number; maxTokens?: number; provider?: AIProvider } = {}): Promise<AIResp> {
    const preferred: AIProvider = opts.provider ?? 'gemini';
    const primary = preferred === 'gemini' ? callGemini : callOpenAI;
    const fallback = preferred === 'gemini' ? callOpenAI : callGemini;
    try {
        return await primary(messages, opts);
    } catch (primaryErr) {
        const other: AIProvider = preferred === 'gemini' ? 'openai' : 'gemini';
        console.warn(`[generate-ai] ${preferred} failed, falling back to ${other}:`, primaryErr instanceof Error ? primaryErr.message : primaryErr);
        return await fallback(messages, opts);
    }
}

// ─── Rate limit (Vercel KV / Upstash REST) ──────────────────────────────────
// Protects this expensive (paid AI) endpoint from abuse. No-ops if KV isn't
// configured. High limit so a club running many kids at once isn't blocked.
function clientIp(req: VercelRequest): string {
    const fwd = req.headers['x-forwarded-for'];
    const raw = Array.isArray(fwd) ? fwd[0] : (fwd ?? '');
    return raw.split(',')[0].trim() || 'unknown';
}

async function rateLimited(key: string, limit: number, windowSec: number): Promise<boolean> {
    // Accept either the Vercel KV or the Upstash Redis env var names, depending
    // on which Marketplace integration provisions the store.
    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return false;
    try {
        const incr = await fetch(`${url}/incr/${encodeURIComponent(key)}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const { result } = await incr.json();
        if (result === 1) {
            await fetch(`${url}/expire/${encodeURIComponent(key)}/${windowSec}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
        }
        return typeof result === 'number' && result > limit;
    } catch {
        return false; // fail open
    }
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const t0 = Date.now();
    try {
        // 80 report generations/min per IP — generous for a club, caps abuse.
        if (await rateLimited(`rl:generate-ai:${clientIp(req)}`, 80, 60)) {
            return res.status(429).json({ error: 'rate_limited' });
        }

        const { report, context } = req.body as { report: ReportData; context: ReportContext };

        if (!report?.arquetipo || !context?.nombre) {
            return res.status(400).json({ error: 'Missing report or context' });
        }

        const prompt = buildPrompt(report, context);
        const langCode = context.lang || 'es';
        const langLabel = LANG_LABELS[langCode] || LANG_LABELS.es;

        const systemContent = langCode !== 'es'
            ? `You are an expert writer for the Argo Method. Respond ONLY with valid JSON, no markdown or additional explanations. Write all text values in ${langLabel}. Every single string in the response must be in ${langLabel} — no Spanish whatsoever.`
            : 'Eres un experto redactor del Método Argo. Respondes SOLO con JSON válido, sin markdown ni explicaciones adicionales.';

        const messages: AIMsg[] = [
            { role: 'system', content: systemContent },
            { role: 'user', content: prompt },
        ];
        // 8192 tokens: gemini-2.5-flash uses 'thinking tokens' that count
        // against this budget. With the long prompt + JSON schema + thinking,
        // 4096 was getting truncated mid-JSON, causing parse failures.
        const aiOpts = { temperature: 0.7, maxTokens: 8192 };

        // Generate + parse in one shot. callAI already falls back Gemini→OpenAI
        // on an API error; this helper lets us also recover from a JSON parse
        // error by forcing a clean second attempt on the other provider.
        const generateOnce = async (provider?: AIProvider): Promise<{ sections: AISections; resp: AIResp }> => {
            const resp = await callAI(messages, { ...aiOpts, provider });
            const cleaned = resp.content.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
            const parsed = JSON.parse(cleaned) as AISections;
            return { sections: parsed, resp };
        };

        let sections: AISections;
        let aiResponse: AIResp;
        try {
            ({ sections, resp: aiResponse } = await generateOnce());
        } catch (firstErr) {
            // First pass failed: either both providers errored, or the response
            // was not valid JSON. Wait briefly and force OpenAI for a clean retry.
            console.warn('[generate-ai] First generation failed (API or JSON parse), forcing OpenAI retry:', firstErr instanceof Error ? firstErr.message : String(firstErr));
            await new Promise(r => setTimeout(r, 1500));
            try {
                ({ sections, resp: aiResponse } = await generateOnce('openai'));
            } catch (secondErr) {
                console.error('[generate-ai] All providers failed after retry:', secondErr instanceof Error ? secondErr.message : String(secondErr));
                return res.status(502).json({ error: 'AI generation failed on all providers' });
            }
        }

        // Prohibited words check (post-generation enforcement of the writing
        // rules). The prompt asks Gemini to avoid deficit/clinical language,
        // but the model sometimes leaks them anyway. If we find any, ask it
        // to rewrite the response without those words. One retry max.
        const sectionsAsObj = sections as unknown as Record<string, unknown>;
        const firstProhibited = findProhibitedWords(sectionsAsObj);
        // Deterministic-language hits flow through the SAME single-retry path as
        // prohibited words; both surface to ai_events telemetry below. If either
        // survives the retry we behave exactly as before (log + serve, never block).
        const firstDeterministic = findDeterministicHits(sectionsAsObj);
        const firstFound = [...firstProhibited, ...firstDeterministic];
        const prohibitedHit = firstProhibited.length > 0;
        const determinismHit = firstDeterministic.length > 0;
        // Assume a hit survives until the correction pass clears it; surfaced to ai_events telemetry below.
        let prohibitedAfterRetry = prohibitedHit;
        let determinismAfterRetry = determinismHit;
        if (firstFound.length > 0) {
            if (firstProhibited.length > 0) console.warn('[generate-ai] Prohibited words detected on first pass:', firstProhibited.join(', '));
            if (firstDeterministic.length > 0) console.warn('[generate-ai] Deterministic language detected on first pass:', firstDeterministic.join(' | '));
            const correctionMessages: AIMsg[] = [
                ...messages,
                { role: 'assistant', content: aiResponse.content },
                {
                    role: 'user',
                    content: `Tu respuesta anterior contenía lenguaje que las reglas de Argo no permiten${firstProhibited.length > 0 ? ` (palabras prohibidas: ${firstProhibited.join(', ')})` : ''}${firstDeterministic.length > 0 ? ` y afirmaciones deterministas sobre el niño ("X es un...", "siempre/nunca", "será", "destinado a")` : ''}. Reformula TODO el JSON sin usar esas palabras ni lenguaje categórico sobre el niño: usa SIEMPRE lenguaje probabilístico ("tiende a", "suele", "es probable que", "podría"). Nunca afirmes una identidad fija. Recuerda: siempre desde la fortaleza, nunca desde el déficit. Devuelve ÚNICAMENTE el JSON con la misma estructura.`,
                },
            ];
            try {
                const correctedResp = await callAI(correctionMessages, { ...aiOpts, provider: aiResponse.provider });
                const correctedCleaned = correctedResp.content.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
                const correctedSections = JSON.parse(correctedCleaned) as AISections;
                const correctedObj = correctedSections as unknown as Record<string, unknown>;
                const stillProhibited = findProhibitedWords(correctedObj);
                const stillDeterministic = findDeterministicHits(correctedObj);
                // Accept the correction only if it cleared everything; otherwise keep
                // the original (same behavior as before for prohibited words).
                if (stillProhibited.length === 0 && stillDeterministic.length === 0) {
                    sections = correctedSections;
                    aiResponse = correctedResp;
                    prohibitedAfterRetry = false;
                    determinismAfterRetry = false;
                } else {
                    if (stillProhibited.length > 0) console.warn('[generate-ai] Correction still had prohibited words:', stillProhibited.join(', '));
                    if (stillDeterministic.length > 0) console.warn('[generate-ai] Correction still had deterministic language:', stillDeterministic.join(' | '));
                }
            } catch (correctionErr) {
                console.warn('[generate-ai] Correction pass failed, keeping original response:', correctionErr instanceof Error ? correctionErr.message : correctionErr);
            }
        }

        // Strip any HTML the model leaked into plain-text fields before it ever
        // reaches the DB (the model sometimes returns the checklist as a
        // `<ul><li>` list, which renders as literal tags in the report page).
        sections = sanitizeSections(sections);

        // Rehydrate the placeholder with the real name. The real name was never
        // sent to Gemini — it exists only on our server and in this response.
        sections = rehydrateName(sections, context.nombre);

        if (typeof sections.resumenPerfil !== 'string' || !sections.resumenPerfil.trim()) {
            console.warn('[generate-ai] AI response missing resumenPerfil');
        }

        const usage: AIUsage = {
            inputTokens: aiResponse.inputTokens,
            outputTokens: aiResponse.outputTokens,
            totalTokens: aiResponse.totalTokens,
            costUsd: getCostUsd(aiResponse),
        };

        // Best-effort latency/quality telemetry (mirrors tenant-chat's ai_events log).
        // Report generation runs 15-27s against a 60s ceiling; this lets us watch how
        // close real traffic runs to the limit and whether prohibited-word leaks survive
        // the correction pass. Never breaks the response; no-ops if env/table is absent.
        try {
            const sbUrl = process.env.VITE_SUPABASE_URL;
            const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
            if (sbUrl && sbKey) {
                await createClient(sbUrl, sbKey).from('ai_events').insert({
                    source: 'generate-ai',
                    provider: aiResponse.provider,
                    model: aiResponse.provider === 'gemini' ? 'gemini-2.5-flash' : 'gpt-4o',
                    lang: langCode,
                    tokens_in: aiResponse.inputTokens,
                    tokens_out: aiResponse.outputTokens,
                    cost_usd: getCostUsd(aiResponse),
                    latency_ms: Date.now() - t0,
                    // Determinism hits are folded into the existing prohibited_* booleans
                    // (no new column needed; the existing telemetry registers them).
                    prohibited_hit: prohibitedHit || determinismHit,
                    prohibited_after_retry: prohibitedAfterRetry || determinismAfterRetry,
                });
            }
        } catch (telemetryErr) {
            console.warn('[generate-ai] ai_events telemetry insert failed (non-fatal):', telemetryErr instanceof Error ? telemetryErr.message : telemetryErr);
        }

        return res.status(200).json({ sections, usage });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[generate-ai] Unexpected error:', msg);
        return res.status(500).json({ error: 'Internal server error', detail: msg });
    }
}
