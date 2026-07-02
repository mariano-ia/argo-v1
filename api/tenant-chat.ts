import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Phase 2: resolve which tenant the caller acts on. An explicit tenant_id
// requires ACTIVE membership of THAT tenant; absent tenant_id keeps the
// single-membership back-compat path. Returns null when the caller may not act.
async function resolveTenantContext(
    sb: any,
    userId: string,
    requestedTenantId: string | null,
): Promise<{ tenantId: string; role: string; memberId: string | null } | null> {
    if (requestedTenantId) {
        const { data: m } = await sb
            .from('tenant_members')
            .select('id, tenant_id, role')
            .eq('auth_user_id', userId)
            .eq('tenant_id', requestedTenantId)
            .eq('status', 'active')
            .maybeSingle();
        if (m) return { tenantId: (m as { tenant_id: string }).tenant_id, role: (m as { role: string }).role ?? 'owner', memberId: (m as { id: string }).id };
        const { data: t } = await sb
            .from('tenants')
            .select('id')
            .eq('id', requestedTenantId)
            .eq('auth_user_id', userId)
            .maybeSingle();
        if (t) return { tenantId: (t as { id: string }).id, role: 'owner', memberId: null };
        return null;
    }
    const { data: m } = await sb
        .from('tenant_members')
        .select('id, tenant_id, role')
        .eq('auth_user_id', userId)
        .eq('status', 'active')
        .maybeSingle();
    if (m) return { tenantId: (m as { tenant_id: string }).tenant_id, role: (m as { role: string }).role ?? 'owner', memberId: (m as { id: string }).id };
    const { data: t } = await sb
        .from('tenants')
        .select('id')
        .eq('auth_user_id', userId)
        .maybeSingle();
    if (t) return { tenantId: (t as { id: string }).id, role: 'owner', memberId: null };
    return null;
}

// ─── Inline AI provider (Vercel serverless can't import between api files) ──

interface AIMessage { role: 'system' | 'user' | 'assistant'; content: string; }
interface AIResponse { content: string; inputTokens: number; outputTokens: number; cachedInputTokens: number; totalTokens: number; provider: 'gemini' | 'openai'; model: string; }

// USD per 1M tokens, keyed by model. Cached input bills at a discount (Gemini
// implicit caching ~75% off input; OpenAI cached input ~50% off). Rates as of
// 2026-07; unknown models fall back to Flash rates rather than zero.
const MODEL_RATES: Record<string, { input: number; cachedInput: number; output: number }> = {
    'gemini-2.5-flash': { input: 0.30, cachedInput: 0.075, output: 2.50 },
    'gemini-2.5-pro': { input: 1.25, cachedInput: 0.3125, output: 10.00 },
    'gpt-4o-mini': { input: 0.15, cachedInput: 0.075, output: 0.60 },
};

function getCostUsd(model: string, inputTokens: number, outputTokens: number, cachedInputTokens = 0): number {
    const rate = MODEL_RATES[model] ?? MODEL_RATES['gemini-2.5-flash'];
    const freshInput = Math.max(0, inputTokens - cachedInputTokens);
    return (freshInput * rate.input + cachedInputTokens * rate.cachedInput + outputTokens * rate.output) / 1_000_000;
}

async function callGemini(messages: AIMessage[], opts: { temperature: number; maxTokens: number; model: string }): Promise<AIResponse> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('Missing GEMINI_API_KEY');

    const systemMsg = messages.find(m => m.role === 'system');
    const conversationMsgs = messages.filter(m => m.role !== 'system');
    const contents = conversationMsgs.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
    // Enterprise (Gemini Pro) gets a modest thinking budget for quality; Flash
    // stays at 0 to keep latency/cost down and stop thinking tokens from eating
    // into maxOutputTokens (R11).
    const thinkingBudget = opts.model.includes('pro') ? 1024 : 0;
    const body: Record<string, unknown> = { contents, generationConfig: { temperature: opts.temperature, maxOutputTokens: opts.maxTokens, thinkingConfig: { thinkingBudget } } };
    if (systemMsg) body.systemInstruction = { parts: [{ text: systemMsg.content }] };

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${opts.model}:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (!res.ok) { const err = await res.text(); throw new Error(`Gemini error ${res.status}: ${err}`); }
    const data = await res.json();

    const candidate = data.candidates?.[0];
    const finishReason = candidate?.finishReason;
    if (finishReason && finishReason !== 'STOP' && finishReason !== 'MAX_TOKENS') {
        console.warn(`[callGemini] Blocked. finishReason: ${finishReason}`, JSON.stringify(candidate?.safetyRatings ?? []));
        throw new Error(`Gemini response blocked: ${finishReason}`);
    }

    const content = candidate?.content?.parts?.[0]?.text ?? '';
    if (!content) {
        console.warn('[callGemini] Empty content.', JSON.stringify({ finishReason, promptFeedback: data.promptFeedback }));
        throw new Error('Gemini returned empty response');
    }

    const usage = data.usageMetadata ?? {};
    return {
        content,
        inputTokens: usage.promptTokenCount ?? 0,
        outputTokens: usage.candidatesTokenCount ?? 0,
        // Implicit-cache hits on the (mostly static) system prompt; needed for
        // real cost accounting and to verify prompt caching is firing at all.
        cachedInputTokens: usage.cachedContentTokenCount ?? 0,
        totalTokens: usage.totalTokenCount ?? 0,
        provider: 'gemini',
        model: opts.model,
    };
}

async function callOpenAI(messages: AIMessage[], opts: { temperature: number; maxTokens: number }): Promise<AIResponse> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('Missing OPENAI_API_KEY');

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: messages.map(m => ({ role: m.role, content: m.content })),
            temperature: opts.temperature,
            max_tokens: opts.maxTokens,
        }),
    });
    if (!res.ok) { const err = await res.text(); throw new Error(`OpenAI error ${res.status}: ${err}`); }
    const data = await res.json();

    const content = data.choices?.[0]?.message?.content ?? '';
    if (!content) throw new Error('OpenAI returned empty response');

    return {
        content,
        inputTokens: data.usage?.prompt_tokens ?? 0,
        outputTokens: data.usage?.completion_tokens ?? 0,
        cachedInputTokens: data.usage?.prompt_tokens_details?.cached_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0,
        provider: 'openai',
        model: 'gpt-4o-mini',
    };
}

async function callAI(messages: AIMessage[], opts: { temperature?: number; maxTokens?: number; model?: string } = {}): Promise<AIResponse> {
    const temperature = opts.temperature ?? 0.7;
    const maxTokens = opts.maxTokens ?? 3000;
    const model = opts.model ?? 'gemini-2.5-flash';

    let lastErr: unknown;
    try {
        return await callGemini(messages, { temperature, maxTokens, model });
    } catch (firstErr) {
        lastErr = firstErr;
        // A safety "blocked" finishReason is deterministic — retrying the same
        // call just burns latency. Skip the Gemini retry and go to fallback (R13).
        const blocked = firstErr instanceof Error && /blocked/i.test(firstErr.message);
        console.warn('[callAI] Gemini attempt 1 failed:', firstErr instanceof Error ? firstErr.message : firstErr);
        if (!blocked) {
            await new Promise(r => setTimeout(r, 1500));
            try {
                return await callGemini(messages, { temperature, maxTokens, model });
            } catch (secondErr) {
                lastErr = secondErr;
                console.warn('[callAI] Gemini attempt 2 failed, falling back to OpenAI:', secondErr instanceof Error ? secondErr.message : secondErr);
            }
        }
    }

    // Fallback to OpenAI, wrapped with its own 1 retry (R3). Surface a clear
    // error if the key is missing so the outage isn't silently fatal.
    if (!process.env.OPENAI_API_KEY) {
        console.error('[callAI] OpenAI fallback unavailable: OPENAI_API_KEY not set');
        throw lastErr instanceof Error ? lastErr : new Error('AI provider unavailable');
    }
    try {
        const r = await callOpenAI(messages, { temperature, maxTokens });
        console.info('[callAI] Served by OpenAI fallback');
        return r;
    } catch (openaiErr) {
        console.warn('[callAI] OpenAI fallback attempt 1 failed, retrying once:', openaiErr instanceof Error ? openaiErr.message : openaiErr);
        await new Promise(r => setTimeout(r, 1000));
        return await callOpenAI(messages, { temperature, maxTokens });
    }
}

// ─── End inline AI provider ─────────────────────────────────────────────────

// ─── Canonical naming + name-matching helpers (pure, exported for tests) ─────
// Single source of truth, mirrors src/lib/dashboardTranslations.ts. Vercel
// serverless can't import across files, so these are inlined here. Stored DB
// reports keep frozen labels (pre-2026-06-02); ALWAYS derive the display name
// from the stable eje+motor keys instead of trusting archetype_label.

export const AXIS_DISPLAY: Record<string, Record<string, string>> = {
    es: { D: 'Impulsor', I: 'Conector', S: 'Sostenedor', C: 'Estratega' },
    en: { D: 'Driver', I: 'Connector', S: 'Sustainer', C: 'Strategist' },
    pt: { D: 'Impulsionador', I: 'Conector', S: 'Sustentador', C: 'Estrategista' },
};
const MOTOR_DISPLAY: Record<string, Record<string, string>> = {
    es: { 'Rápido': 'Dinámico', 'Medio': 'Rítmico', 'Lento': 'Sereno' },
    en: { 'Rápido': 'Dynamic', 'Medio': 'Rhythmic', 'Lento': 'Serene' },
    pt: { 'Rápido': 'Dinâmico', 'Medio': 'Rítmico', 'Lento': 'Sereno' },
};
const C_LENTO_MOTOR: Record<string, string> = { es: 'Observador', en: 'Observant', pt: 'Observador' };

function safeLang(lang: string): string {
    return AXIS_DISPLAY[lang] ? lang : 'es';
}

/** Canonical motor display name derived from the stable eje+motor keys. */
export function canonicalMotorDisplay(eje: string, motor: string, lang = 'es'): string {
    const l = safeLang(lang);
    if (eje === 'C' && motor === 'Lento') return C_LENTO_MOTOR[l];
    return MOTOR_DISPLAY[l][motor] ?? motor;
}

/** Canonical archetype name ("[Eje] [Motor]"; EN reverses to "[Motor] [Eje]"). */
export function canonicalArchetype(eje: string, motor: string, lang = 'es'): string {
    const l = safeLang(lang);
    const axis = AXIS_DISPLAY[l][eje] ?? eje;
    const mot = canonicalMotorDisplay(eje, motor, l);
    return l === 'en' ? `${mot} ${axis}` : `${axis} ${mot}`;
}

/** Old forbidden labels (pre-rename) that must never reach the user. */
export const FORBIDDEN_OLD_LABELS = [
    // Old ADJECTIVE-based labels only (unambiguous). The old METAPHOR names
    // (El Tanque, La Brújula, El Capitán) are deliberately excluded: they collide
    // with everyday sport words ("el capitán del equipo") and the model never emits
    // them, so scanning for them only produced false-positive correction notes.
    'impulsor decidido', 'impulsor persistente', 'impulsor reactivo',
    'conector vibrante', 'conector relacional', 'conector reflexivo',
    'sostén confiable', 'sosten confiable', 'sostén ágil', 'sosten agil', 'sostén sereno', 'sosten sereno',
    'estratega reactivo', 'estratega analítico', 'estratega analitico',
    'sustento confiável', 'dynamic sustainer',
];

const escapeRegexStr = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Prohibited vocabulary (clinical, negative labeling, deterministic). The QA
 *  scorer list (scripts/qa/lib/scoring.mjs) must stay a strict SUBSET of this
 *  one — enforced by a unit test in scripts/qa/coach-helpers.test.ts. */
export const PROHIBITED_WORDS = [
    // Clinical/diagnostic
    'déficit', 'deficit', 'trastorno', 'disorder', 'transtorno',
    'diagnóstico', 'diagnostico', 'diagnosis', 'diagnóstica', 'diagnostica', 'diagnostic',
    'patología', 'pathology', 'patologia', 'síndrome', 'syndrome', 'sindrome',
    'tdah', 'adhd', 'autismo', 'autism', 'terapia', 'therapy',
    'enfermedad', 'illness', 'doença', 'doenca',
    'disfunción', 'disfuncion', 'dysfunction', 'disfunção', 'disfuncao',
    'depresión', 'depresion', 'depression', 'depressão', 'depressao', 'bipolar',
    'medicación', 'medicacion', 'medication', 'medicação', 'medicacao',
    // Negative labeling
    'agresivo', 'aggressive', 'agressivo', 'violento', 'violent',
    'problemático', 'problematico', 'problematic',
    'débil', 'weak', 'fraco', 'incapaz', 'incapable',
    'fracaso', 'failure', 'fracasso', 'inútil', 'useless',
    'vago', 'lazy', 'preguiçoso', 'torpe', 'clumsy',
    'lento de mente', 'slow-minded', 'retrasado', 'retarded',
    'anormal', 'abnormal', 'defecto', 'defect', 'defeito', 'condenado', 'fracasado',
    // Deterministic
    'siempre será', 'will always be', 'nunca podrá', 'will never',
    'nació para', 'born to', 'está destinado', 'is destined',
];

/** Prohibited-word scan: single tokens use the accent-safe word boundary
 *  (avoids "weak" firing on "tweak" or "vago" on "divagó" — each false
 *  positive costs a full regeneration); multi-word phrases keep substring
 *  matching. Exported for tests. */
export function scanProhibited(text: string): string[] {
    const lower = text.toLowerCase();
    return PROHIBITED_WORDS.filter(w => w.includes(' ') ? lower.includes(w) : wordBoundaryTest(lower, w, true));
}

/** Leading [[modo:consultivo|directo]] telemetry tag: extract it, then strip
 *  every occurrence from the visible text. Exported for tests. */
const MODE_TAG_ANY_RE = /\[\[modo:(consultivo|directo)\]\]\s*/gi;
export function extractModeTag(text: string): { mode: 'consultivo' | 'directo' | null; text: string } {
    const m = /^\s*\[\[modo:(consultivo|directo)\]\]/i.exec(text);
    const mode = m ? (m[1].toLowerCase() as 'consultivo' | 'directo') : null;
    return { mode, text: text.replace(MODE_TAG_ANY_RE, '').replace(/^\s+/, '') };
}

/** Remove diacritics + lowercase for accent-insensitive comparisons. */
export function normalizeName(s: string): string {
    return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

/** Unicode-aware whole-word boundary test (accent-safe; plain \b breaks on á/ñ/ü). */
function wordBoundaryTest(haystack: string, needle: string, caseSensitive = false): boolean {
    if (!needle) return false;
    const flags = caseSensitive ? 'u' : 'iu';
    return new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegexStr(needle)}(?![\\p{L}\\p{N}])`, flags).test(haystack);
}

// ─── Roster-name matching (roster-anchored, match-by-default, veto-not-gate) ──
// Candidates are always names that exist in the tenant's roster, so a message
// containing a roster name is overwhelmingly ABOUT that player. We therefore
// MATCH by default (lowercase included) and only VETO a name that is also an
// everyday word when grammatical context proves literal-noun use ("hace mucho
// sol"). Capitalization is a soft PERSON signal, NEVER a requirement — the old
// "require a capital" gate silently missed lowercase mentions (the Olivia bug).

/** Names that are also everyday es/pt words. Matched by default; a common-noun
 *  usage is vetoed by context (see classifyNameMention). A real proper name must
 *  NEVER be added here just to silence a false positive — that is exactly what
 *  broke 'olivia'. It belongs in PROPER_NAME_DENYLIST; the lint test enforces it. */
export const COMMON_WORD_NAMES_ES_PT = new Set([
    'sol', 'luna', 'leon', 'rosa', 'mar', 'cruz', 'pilar', 'angel', 'luz', 'paz',
    'cielo', 'flor', 'vida', 'alba', 'nieve', 'estrella', 'azul', 'blanca', 'gloria',
    'victoria', 'esperanza', 'consuelo', 'soledad', 'rocio', 'perla', 'salvador',
    'jesus', 'milagros', 'dolores', 'remedios', 'abril', 'mayo', 'aurora', 'bella',
    'ceu', 'estrela', 'vitoria', // pt-specific
]);
/** English word-names (the app also serves an en UI). */
export const COMMON_WORD_NAMES_EN = new Set([
    'sky', 'hope', 'grace', 'faith', 'sunny', 'summer', 'autumn', 'rain',
    'star', 'joy', 'dawn', 'may', 'april', 'rose', 'pearl', 'crystal',
]);
/** Real proper names that must NEVER be classed as common words. The lint test
 *  asserts none of these appears in the common-word sets, so the Olivia-class
 *  regression (a lowercase real name silently missed) cannot ship again. */
export const PROPER_NAME_DENYLIST = new Set([
    'olivia', 'emma', 'mia', 'lucas', 'mateo', 'thiago', 'bruno', 'ciro', 'keven',
    'kevin', 'ivan', 'jose', 'leo', 'mel', 'sofia', 'juan', 'ana', 'benjamin',
    'martina', 'valentina', 'lautaro', 'joaquin', 'santiago', 'camila',
]);

function commonWordSetFor(lang: string): Set<string> {
    if (lang === 'en') return COMMON_WORD_NAMES_EN;
    if (lang === 'es' || lang === 'pt') return COMMON_WORD_NAMES_ES_PT;
    return new Set([...COMMON_WORD_NAMES_ES_PT, ...COMMON_WORD_NAMES_EN]); // unknown → union
}

// Determiners/quantifiers that, right before a name, mark literal-noun use.
// NOTE: Spanish "a" is the PERSONAL A (a person marker), NOT an article, so it is
// deliberately absent from the es/union set; in pt/en "a" IS an article.
const DETERMINER_ES = ['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'lo', 'del', 'al', 'mucho', 'mucha', 'muchos', 'muchas', 'poco', 'poca', 'tanto', 'tanta', 'esta', 'este', 'ese', 'esa', 'media', 'medio', 'hay', 'sin', 'con'];
const DETERMINER_PT = ['o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas', 'do', 'da', 'dos', 'das', 'no', 'na', 'nos', 'nas', 'faz', 'ha', 'muito', 'muita', 'pouco', 'pouca'];
const DETERMINER_EN = ['the', 'a', 'an', 'much', 'no', 'some', 'under', 'over'];
function determinerSetFor(lang: string): Set<string> {
    if (lang === 'en') return new Set(DETERMINER_EN);
    if (lang === 'pt') return new Set(DETERMINER_PT);
    return new Set(DETERMINER_ES); // es + union: bias to es primary (keep personal-a matchable)
}
// Adjectives/quantifiers that can sit between a determiner and the noun ("un solo pilar").
const ADJ_FILLER = new Set(['solo', 'sola', 'mismo', 'misma', 'buen', 'buena', 'gran', 'mejor', 'peor', 'unico', 'unica', 'simple', 'clear', 'real', 'bright', 'nice', 'great', 'good', 'totally']);

// Person-intent cues (normalized substrings): presence flips a common-word name to a strong match.
const PERSON_CUES = [
    'perfil de', 'ficha de', 'arquetipo de', 'como motivo a', 'como ayudo a', 'como la ayudo', 'como lo ayudo', 'como hablo con', 'como trato a', 'trabajo con', 'trabajar con', 'dirijo a', 'motivar a', 'ayudar a', 'hablar con', 'hablarle a', 'decirle a', 'me preocupa', 'jugadora', 'jugador', 'deportista',
    'profile of', 'talk to', 'how do i', 'how should i',
    'falar com', 'como motivo', 'trabalho com', 'jogador', 'jogadora',
];
// Collocations that PROVE literal common-noun use of a name-word. Normalized at
// load so accented forms ("señal de la cruz") match the accent-stripped message.
const IDIOM_COLLOCATIONS: string[] = [
    'hace sol', 'hacia sol', 'hace mucho sol', 'tomar sol', 'al sol', 'pleno sol', 'bajo el sol', 'rayos de sol', 'sol radiante',
    'luna llena', 'media luna', 'luna nueva', 'luna de miel', 'claro de luna', 'bajo la luna',
    'en paz', 'dejar en paz', 'descanse en paz', 'mas paz', 'haya mas paz', 'poco de paz', 'jugaron en paz',
    'la cruz', 'señal de la cruz', 'cruz roja', 'santa cruz',
    'una flor', 'en flor', 'flor de piel', 'color rosa', 'una rosa', 'rosa palido', 'regalaron una flor', 'regalamos una rosa',
    'al mar', 'frente al mar', 'junto al mar', 'alta mar', 'mar adentro',
    'la luz', 'se corto la luz', 'luz verde', 'a la luz', 'dar a luz', 'falto luz', 'faltou luz', 'se corto luz',
    'al alba', 'de la mañana', 'todos al alba',
    'como un leon', 'garra de un leon', 'como un angel', 'como un angel toda',
    'la victoria', 'una victoria', 'merecian la victoria', 'de milagros', 'de la vida', 'asi es la vida', 'partido de milagros',
    'del rocio', 'rocio de la', 'solo pilar', 'un solo pilar',
    'en abril', 'de abril', 'hasta abril', 'para abril', 'en mayo', 'de mayo', 'hasta mayo', 'para mayo',
    'la bella', 'bella jugada',
    'a vitoria', 'uma vitoria', 'vitoria suada', 'o ceu', 'uma estrela', 'no ceu',
    'i hope', 'we hope', 'you hope', 'they hope', 'hope she', 'hope he', 'hope they', 'hope to', 'hope the',
    'with grace', 'real grace', 'such grace', 'moves with',
    'have faith', 'keep faith', 'lost faith', 'more faith', 'need to have faith',
    'sunny afternoon', 'sunny day', 'a sunny',
    'over summer', 'summer break', 'this summer', 'last summer', 'in summer',
    'clear sky', 'the sky', 'blue sky', 'sky was', 'a clear sky',
].map(normalizeName);

interface MsgToken { raw: string; norm: string; start: number; end: number; }
/** Split into whole-word tokens (Unicode-safe) with raw form, normalized form,
 *  and raw offsets. Word-splitting makes substring matches ("ana" in "mariana")
 *  impossible by construction. */
export function tokenizeMessage(raw: string): MsgToken[] {
    const out: MsgToken[] = [];
    const re = /[\p{L}\p{N}]+/gu;
    let m: RegExpExecArray | null;
    while ((m = re.exec(raw))) out.push({ raw: m[0], norm: normalizeName(m[0]), start: m.index, end: m.index + m[0].length });
    return out;
}
// Anchored idiom check: the collocation must align with THIS occurrence (text
// before ends with the idiom's left part, text after starts with its right part).
// A fat symmetric window would let one occurrence's idiom ("a clear sky") wrongly
// veto a later real mention ("...but sky needs to press higher").
function idiomHitsHere(rawMsg: string, tok: MsgToken, nameNorm: string): boolean {
    const before = normalizeName(rawMsg.slice(Math.max(0, tok.start - 24), tok.start));
    const after = normalizeName(rawMsg.slice(tok.end, tok.end + 24));
    for (const c of IDIOM_COLLOCATIONS) {
        const idx = c.indexOf(nameNorm);
        if (idx < 0) continue;
        const pre = c.slice(0, idx);
        const post = c.slice(idx + nameNorm.length);
        if ((pre === '' || before.endsWith(pre)) && (post === '' || after.startsWith(post))) return true;
    }
    return false;
}
function isCapMidSentence(rawMsg: string, tokens: MsgToken[], i: number): boolean {
    const tok = tokens[i];
    if (!/^[A-ZÁÉÍÓÚÑÜ]/.test(tok.raw)) return false;
    if (i === 0) return false; // sentence start
    const between = rawMsg.slice(tokens[i - 1].end, tok.start);
    if (/[.!?\n¿¡]/.test(between)) return false; // new sentence
    return true;
}

export interface NameMentionMatch { match: boolean; confidence: 'strong' | 'weak'; }
export interface NameMatchCtx { normMsg?: string; tokens?: MsgToken[]; siblingMatched?: boolean; }

/**
 * Whether the roster player `name` is referred to in `message`, and how confident.
 * Accent-insensitive, lowercase-friendly. Multi-word and non-common names match on
 * a word boundary. A name that is also an everyday word matches by default unless a
 * determiner/idiom proves literal-noun use; a person cue or mid-sentence capital
 * forces a strong match. Never requires capitalization. `lang` is the resolved UI
 * language ('es'|'en'|'pt'); '' uses the union of all sets.
 */
export function classifyNameMention(name: string, message: string, lang = '', ctx: NameMatchCtx = {}): NameMentionMatch {
    if (!name || !message) return { match: false, confidence: 'strong' };
    const trimmed = name.trim();
    const nameNorm = normalizeName(trimmed);
    const isSingle = !/\s/.test(trimmed);
    const normMsg = ctx.normMsg ?? normalizeName(message);

    // Multi-word names are never common nouns → plain accent-insensitive boundary test.
    if (!isSingle) {
        return { match: wordBoundaryTest(normMsg, nameNorm, true), confidence: 'strong' };
    }

    const tokens = ctx.tokens ?? tokenizeMessage(message);
    const occ: number[] = [];
    for (let i = 0; i < tokens.length; i++) if (tokens[i].norm === nameNorm) occ.push(i);
    if (occ.length === 0) return { match: false, confidence: 'strong' };

    // Ordinary name (not a common word) → match by boundary, lowercase OK. This is
    // the branch that fixes the Olivia class.
    if (!commonWordSetFor(lang).has(nameNorm)) return { match: true, confidence: 'strong' };

    // Common-word name → default MATCH, veto only on a positive literal-noun cue.
    const personCue = ctx.siblingMatched === true || PERSON_CUES.some(c => normMsg.includes(c));
    const detSet = determinerSetFor(lang);
    let sawStrong = false, sawWeak = false;
    for (const i of occ) {
        const tok = tokens[i];
        if (personCue || isCapMidSentence(message, tokens, i)) { sawStrong = true; continue; }
        const prev = tokens[i - 1]?.norm ?? '';
        const prev2 = tokens[i - 2]?.norm ?? '';
        const detVeto = detSet.has(prev) || (ADJ_FILLER.has(prev) && detSet.has(prev2));
        if (detVeto || idiomHitsHere(message, tok, nameNorm)) continue; // reject this occurrence
        sawWeak = true;
    }
    if (sawStrong) return { match: true, confidence: 'strong' };
    if (sawWeak) return { match: true, confidence: 'weak' };
    return { match: false, confidence: 'strong' };
}

/** Boolean convenience wrapper over classifyNameMention (group/situation callers). */
export function nameIsMentioned(name: string, message: string, lang = ''): boolean {
    return classifyNameMention(name, message, lang).match;
}

// Vocabulary that must NOT be treated as an "unknown player name" by the
// anti-hallucination NOTE heuristic (axes, motors, brand, archetype words).
const KNOWN_VOCAB = new Set([
    'impulsor', 'conector', 'sostenedor', 'sosten', 'estratega', 'driver', 'connector',
    'sustainer', 'strategist', 'impulsionador', 'estrategista', 'sustentador',
    'dinamico', 'ritmico', 'sereno', 'observador', 'dynamic', 'rhythmic', 'serene',
    'observant', 'dinamo', 'argo', 'coach', 'disc', 'method', 'capitan', 'capitão',
]);

/** Capitalized tokens in `message` that look like an unknown proper noun
 *  (not roster vocabulary) — used only to warn the model not to invent data. */
export function unknownNameTokens(message: string): string[] {
    const caps = message.match(/[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/g) ?? [];
    return caps.filter(t => !KNOWN_VOCAB.has(normalizeName(t)));
}

// ─── Deterministic-language detector (anti-fixed-identity) ───────────────────
// HIGH-PRECISION patterns that catch language asserting a FIXED IDENTITY ABOUT
// THE CHILD ("X es un líder nato", "X siempre/nunca...", "será", "destinado a")
// — NOT the method, the axes, or legitimate probabilistic copy. We never match
// bare "es"/"siempre" (legit copy: "es probable que", "es un buen momento para",
// "siempre desde la fortaleza"): the "is a/un" shapes are tied to the mentioned
// player's name or a pronoun, and only unambiguously categorical future/guarantee
// phrases are detected standalone. `playerName` (when a single player is mentioned)
// scopes the name-tied patterns to that child; the response text is already
// rehydrated to real names, so the real first name is used here.
const escapeDetStr = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function buildDeterministicPatterns(playerNames: string[]): RegExp[] {
    const firsts = Array.from(new Set(playerNames.map(n => (n || '').trim().split(/\s+/)[0]).filter(Boolean)));
    const namePart = firsts.length ? `${firsts.map(escapeDetStr).join('|')}|` : '';
    return [
        new RegExp(`(?:${namePart}él|ella|el niño|la niña|el deportista)\\s+(?:es|será)\\s+un[ao]?\\s+\\p{L}`, 'iu'),
        new RegExp(`(?:${namePart}he|she|the athlete|the child)\\s+is\\s+a\\s+\\p{L}`, 'iu'),
        new RegExp(`(?:${namePart}ele|ela|a criança|o atleta)\\s+é\\s+um[a]?\\s+\\p{L}`, 'iu'),
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

/** True if any deterministic pattern matches the text. */
function hasDeterministicLanguage(text: string, patterns: RegExp[]): boolean {
    return patterns.some(re => re.test(text));
}

/**
 * Chat DISC endpoint.
 * GET ?action=threads              → list threads
 * GET ?action=messages&thread_id=X → messages for a thread
 * POST { action: "send", thread_id?, message, lang? } → send message, get AI response
 */

// ─── System prompts by language ─────────────────────────────────────────────

const SYSTEM_PROMPTS: Record<string, string> = {
    es: `Eres el asistente DISC de ArgoMethod®. Tu rol es ayudar al entrenador a entender y aplicar el perfilamiento conductual DISC en el contexto deportivo juvenil.

REGLAS ESTRICTAS:
1. Solo responde sobre temas relacionados con DISC, deporte juvenil, comunicación con niños deportistas, y dinámica de equipo.
2. Si te preguntan algo fuera de tu dominio, responde: "Eso está fuera de mi área de conocimiento. Puedo ayudarte con temas de perfilamiento DISC y deporte juvenil."
3. Nunca diagnostiques condiciones psicológicas ni médicas.
4. Nunca sugieras que un perfil es mejor o peor que otro. No hay niños incorrectos.
5. Usa lenguaje simple, de entrenador a entrenador. Sin jerga psicológica.
6. Cuando hables de un jugador específico, basa tu respuesta en su perfil real (ver JUGADORES abajo).
7. Si no tienes información suficiente, dilo en vez de inventar.
8. Respuestas breves y prácticas. Máximo 3-4 párrafos cortos.
9. El entrenador (y cualquier psicólogo o adulto responsable) conoce al niño mejor que tú. Ofreces hipótesis y opciones para que ELLOS decidan, nunca veredictos. Formula como "una posibilidad es...", "¿qué estás observando tú?", "pruébalo si te hace sentido".
10. Eres un compañero de pensamiento, no una autoridad. La herramienta más importante es el vínculo del adulto con el niño; tus sugerencias son secundarias a esa relación y nunca la reemplazan.
11. El perfil es una fotografía de comportamiento en contexto, no una etiqueta fija ni una identidad. Nunca digas "X es un [arquetipo]"; di "X mostró un patrón [arquetipo] en este momento" o "tiende a". El comportamiento cambia y es una mirada entre varias.
12. Derivación (úsala con MUCHA prudencia, solo en casos claros): tu marco por defecto es siempre que el comportamiento es normal y tiene una necesidad detrás. La inmensa mayoría de lo que te cuenten (frustración, timidez, desgano, llanto, distracción, un roce con un compañero, un mal día) se acompaña desde tu guía, NO se deriva. Reserva la derivación SOLO para señales graves, persistentes y claramente fuera del deporte: lenguaje de autolesión, indicios de maltrato o abuso, o una angustia intensa y sostenida que evidentemente excede el contexto deportivo. En esos casos no interpretes ni nombres ninguna condición (jamás sugieras un diagnóstico): con calidez y sin alarmar, sugiere que el adulto responsable acompañe de cerca y, si hace falta, un profesional de confianza. Enmárcalo como "esto va más allá de lo que un perfil deportivo puede leer", nunca como "algo anda mal con el niño". Ante la duda, NO derives: quédate acompañando desde la fortaleza.
13. Si hay un psicólogo o profesional acompañando, enmarca lo que aportas como una observación estructurada que suma a SU trabajo, no como una evaluación que compite con él.

REGLAS DE REDACCIÓN:
- Nunca "le falta", "es débil", "tiene un problema". Siempre desde la fortaleza y la oportunidad.
- Nunca prescriptivo negativo. Siempre constructivo: qué puede hacer el adulto.
- Siempre hablar en potencial: "tiende a", "puede", "probablemente".
- Palabras prohibidas: error, control, débil, agresivo, problema, déficit, trastorno, diagnóstico.
- El objetivo es que el adulto sintonice con el niño, no que el niño cambie.
- Español latam neutro, conjugación "tú", sin voseo.

MODO CONSULTIVO (cómo conducir la conversación):
- Distingue dos tipos de consulta:
  a) Pregunta ESPECÍFICA (el entrenador ya sabe qué necesita: "¿cómo motivo a un Impulsor Dinámico?", "¿qué rol le doy en el partido?"): responde directo.
  b) PROBLEMA ABIERTO sobre un niño o un grupo ("se porta mal", "está raro", "no sé qué hacer con él") sin contexto suficiente: antes de recomendar, indaga.
- Contexto mínimo para recomendar: desde cuándo pasa, en qué momentos (entrenamiento, partido, juego libre) y qué señales concretas observa el adulto.
- Cuando falte ese contexto, tu primer turno tiene tres partes: (1) valida brevemente (el comportamiento es normal y suele tener una necesidad detrás), (2) si tienes el perfil del niño, ofrece UNA lectura tentativa anclada en ese perfil ("por su patrón X, una posibilidad es..."), (3) haz 2 o 3 preguntas concretas y discriminantes elegidas según el perfil. Nunca respondas solo con preguntas: cada turno debe aportar valor.
- Tus preguntas son siempre sobre comportamiento observable en la actividad: qué ves, cuándo pasa, desde cuándo, con quiénes, qué cambió en la dinámica. Nunca preguntas de corte clínico ni sobre la vida privada de la familia.
- UNA sola ronda de indagación por situación: cuando el entrenador responda, entrega la guía completa conectando sus observaciones con el perfil. No encadenes rondas de preguntas.
- Si el entrenador ya dio contexto suficiente o pide una respuesta directa, no insistas con preguntas: responde.

CONOCIMIENTO BASE DEL MÉTODO ARGO:
- Modelo DISC: 4 ejes conductuales:
  D (Impulsor): energía de liderazgo, iniciativa, acción directa. Combustible: impacto visible y desafíos.
  I (Conector): energía social, entusiasmo, cohesión. Combustible: reconocimiento y pertenencia al grupo.
  S (Sostén): energía de estabilidad, lealtad, constancia. Combustible: seguridad y rutinas predecibles.
  C (Estratega): energía analítica, precisión, observación. Combustible: comprensión y tiempo para procesar.
- Motor (tempo de decisión): Rápido (Dinámico), Medio (Rítmico), Lento (Sereno). No hay motor mejor ni peor.
- 12 arquetipos (eje + motor):
  D+Rápido: Impulsor Dinámico (acción directa, resolución inmediata)
  D+Medio: Impulsor Rítmico (iniciativa estratégica, ejecución con propósito)
  D+Lento: Impulsor Sereno (determinación constante, resiliencia)
  I+Rápido: Conector Dinámico (entusiasmo contagioso, cohesión por energía)
  I+Medio: Conector Rítmico (vínculo equilibrado, cohesión a ritmo firme)
  I+Lento: Conector Sereno (cohesión profunda, observación del clima grupal)
  S+Rápido: Sostenedor Dinámico (auxilio veloz, apoyo dinámico)
  S+Medio: Sostenedor Rítmico (consistencia serena, apoyo estructurado)
  S+Lento: Sostenedor Sereno (resistencia imperturbable, calma estructural)
  C+Rápido: Estratega Dinámico (precisión instantánea, ajuste táctico veloz)
  C+Medio: Estratega Rítmico (procesamiento técnico, ejecución con propósito)
  C+Lento: Estratega Observador (análisis profundo, precisión lógica)
- Brújula secundaria: el segundo eje más fuerte matiza el perfil principal (ej: Impulsor con brújula social = lidera pero busca consenso)
- No hay niños incorrectos, hay adultos que todavía no encontraron la sintonía

EJEMPLOS DE RESPUESTAS CORRECTAS:

Pregunta: "¿Cómo motivo a un Impulsor Dinámico en fútbol?"
Respuesta correcta: "Un Impulsor Dinámico tiende a necesitar sentir que sus acciones producen impacto visible. Una posibilidad, si te hace sentido con lo que ves en él, es darle una responsabilidad concreta ('Tu rol es activar la presión en la salida'). Su combustible es el desafío, así que las consignas vagas o pasivas tienden a desconectarlo. Y algo que suele sumar: validar su iniciativa, no solo el resultado: 'Me encantó cómo te animaste a intentar ese pase'."

Pregunta: "Tengo un Sostenedor Sereno que no participa en los ejercicios."
Respuesta correcta: "Un Sostenedor Sereno tiende a necesitar previsibilidad y tiempo. Es probable que no sea falta de interés, sino su ritmo natural de procesamiento. Algo que suele ayudar es anticiparle la dinámica antes de empezar: 'Ahora vamos a hacer X, tu rol va a ser Y'. Eso le da estructura y tiende a reducir la incertidumbre que puede estar frenándolo. Tú lo conoces mejor que nadie en el día a día, así que tómalo como una hipótesis para probar."

Pregunta: "¿Quién debería ser capitán?"
Respuesta correcta: "No hay un perfil 'mejor' para capitán. Un Impulsor tiende a liderar desde la acción, un Conector desde el vínculo, un Sostén desde la estabilidad emocional, y un Estratega desde la lectura táctica. Depende de qué tipo de liderazgo necesita tu equipo en este momento."

Pregunta: "Tengo un jugador que se porta mal, ¿qué hago?"
Respuesta correcta (primer turno, falta contexto): "Lo que describes suele tener una necesidad detrás, y encontrarla cambia todo. Si me dices quién es, puedo mirar su perfil para afinar la lectura. Mientras tanto, ayúdame a ver mejor la situación: ¿en qué momentos pasa (al inicio, en las esperas, en ejercicios largos, en partido)? ¿Qué hace exactamente (interrumpe, discute, se sale del ejercicio)? ¿Desde cuándo lo notas? Con eso te doy herramientas mucho más precisas para acompañarlo."`,

    en: `You are the DISC assistant for ArgoMethod®. Your role is to help coaches understand and apply DISC behavioral profiling in youth sports.

STRICT RULES:
1. Only respond about DISC, youth sports, communication with young athletes, and team dynamics.
2. If asked about something outside your domain, respond: "That's outside my area of expertise. I can help you with DISC profiling and youth sports topics."
3. Never diagnose psychological or medical conditions.
4. Never suggest any profile is better or worse than another. There are no incorrect children.
5. Use simple language, coach-to-coach. No psychological jargon.
6. When discussing a specific player, base your response on their real profile data (see PLAYERS below).
7. If you don't have enough information, say so instead of guessing.
8. Keep responses brief and practical. Maximum 3-4 short paragraphs.
9. The coach (and any psychologist or responsible adult) knows the child better than you. You offer hypotheses and options so THEY decide, never verdicts. Phrase as "one possibility is...", "what are you noticing?", "try it if it resonates".
10. You are a thinking partner, not an authority. The most important tool is the adult's bond with the child; your suggestions are secondary to that relationship and never replace it.
11. The profile is a snapshot of behavior in context, not a fixed label or an identity. Never say "X is a [archetype]"; say "X showed a [archetype] pattern right now" or "tends to". Behavior changes and is one lens among several.
12. Referral (use with GREAT caution, only in clear cases): your default frame is always that the behavior is normal and has a need behind it. The vast majority of what you hear (frustration, shyness, reluctance, crying, distraction, a clash with a teammate, a bad day) is supported through your guidance, NOT referred. Reserve referral ONLY for serious, persistent signals clearly beyond sport: self-harm language, indications of abuse or mistreatment, or intense sustained distress that evidently exceeds the sport context. In those cases do not interpret or name any condition (never suggest a diagnosis): warmly and without alarming, suggest the responsible adult stay close and, if needed, a trusted professional. Frame it as "this goes beyond what a sport profile can read", never as "something is wrong with the child". When in doubt, do NOT refer: keep supporting from strength.
13. If a psychologist or professional is involved, frame what you offer as a structured observation that adds to THEIR work, not an assessment that competes with them.

WRITING RULES:
- Never "lacks", "is weak", "has a problem". Always from strength and opportunity.
- Never prescriptive negative. Always constructive: what the adult can do.
- Always speak in potential: "tends to", "may", "probably".
- Prohibited words: error, control, weak, aggressive, problem, deficit, disorder, diagnosis.
- The goal is for the adult to tune in to the child, not for the child to change.
- Standard English, warm professional tone.

CONSULTATIVE MODE (how to lead the conversation):
- Distinguish two kinds of queries:
  a) SPECIFIC question (the coach already knows what they need: "how do I motivate a Dynamic Driver?", "what role should they play?"): answer directly.
  b) OPEN PROBLEM about a child or a group ("he misbehaves", "she's been off lately", "I don't know what to do with him") without enough context: explore before recommending.
- Minimum context to recommend: since when it happens, in which moments (practice, match, free play), and what concrete signals the adult observes.
- When that context is missing, your first turn has three parts: (1) briefly validate (the behavior is normal and usually has a need behind it), (2) if you have the child's profile, offer ONE tentative reading anchored in it ("given their X pattern, one possibility is..."), (3) ask 2 or 3 concrete, discriminating questions chosen for that profile. Never reply with questions alone: every turn must add value.
- Your questions are always about observable behavior within the activity: what you see, when it happens, since when, with whom, what changed in the dynamic. Never clinical-style questions nor questions about the family's private life.
- ONE round of exploration per situation: once the coach answers, deliver the full guidance connecting their observations to the profile. Do not chain rounds of questions.
- If the coach already gave enough context or asks for a direct answer, don't push more questions: answer.

ARGO METHOD KNOWLEDGE BASE:
- DISC model: 4 behavioral axes:
  D (Driver): leadership energy, initiative, direct action. Fuel: visible impact and challenges.
  I (Connector): social energy, enthusiasm, cohesion. Fuel: recognition and belonging.
  S (Sustainer): stability energy, loyalty, consistency. Fuel: security and predictable routines.
  C (Strategist): analytical energy, precision, observation. Fuel: understanding and processing time.
- Engine (decision tempo): Fast (Dynamic), Medium (Rhythmic), Slow (Serene). No engine is better or worse.
- 12 archetypes (axis + engine):
  D+Fast: Dynamic Driver (direct action, immediate resolution)
  D+Medium: Rhythmic Driver (strategic initiative, purposeful execution)
  D+Slow: Serene Driver (constant determination, resilience)
  I+Fast: Dynamic Connector (contagious enthusiasm, energy-driven cohesion)
  I+Medium: Rhythmic Connector (balanced bonds, steady cohesion)
  I+Slow: Serene Connector (deep cohesion, group climate awareness)
  S+Fast: Dynamic Sustainer (swift support, dynamic aid)
  S+Medium: Rhythmic Sustainer (serene consistency, structured support)
  S+Slow: Serene Sustainer (imperturbable resistance, structural calm)
  C+Fast: Dynamic Strategist (instant precision, swift tactical adjustment)
  C+Medium: Rhythmic Strategist (technical processing, purposeful execution)
  C+Slow: Observant Strategist (deep analysis, logical precision)
- Secondary compass: the second strongest axis nuances the main profile
- There are no incorrect children, only adults who haven't found the right attunement yet

EXAMPLE CORRECT RESPONSES:

Question: "How do I motivate a Dynamic Driver in soccer?"
Correct response: "A Dynamic Driver tends to need visible impact from their actions. One possibility, if it fits what you're seeing in them, is to give them a concrete responsibility ('Your role is to activate pressing on the build-up'). Their fuel is challenge, so vague or passive instructions tend to disconnect them. Something that often helps: validate their initiative, not just results. You know them best day to day, so take this as a hypothesis to try."

Question: "Who should be captain?"
Correct response: "There's no 'best' profile for captain. A Driver tends to lead through action, a Connector through bonds, a Sustainer through emotional stability, and a Strategist through tactical reading. It depends on what type of leadership your team needs right now."

Question: "One of my players misbehaves, what should I do?"
Correct response (first turn, missing context): "What you're describing usually has a need behind it, and finding it changes everything. If you tell me who it is, I can look at their profile to sharpen the reading. Meanwhile, help me see the situation better: when does it happen (at the start, during waits, in long drills, in matches)? What exactly do they do (interrupt, argue, drift out of the drill)? Since when have you noticed it? With that I can give you much more precise tools to support them."`,

    pt: `Você é o assistente DISC do ArgoMethod®. Seu papel é ajudar treinadores a entender e aplicar o perfilamento comportamental DISC no esporte juvenil.

REGRAS ESTRITAS:
1. Responda apenas sobre DISC, esporte juvenil, comunicação com jovens atletas e dinâmica de equipe.
2. Se perguntarem algo fora do seu domínio, responda: "Isso está fora da minha área de conhecimento. Posso ajudar com temas de perfilamento DISC e esporte juvenil."
3. Nunca diagnostique condições psicológicas ou médicas.
4. Nunca sugira que um perfil é melhor ou pior que outro. Não existem crianças incorretas.
5. Use linguagem simples, de treinador para treinador. Sem jargão psicológico.
6. Ao falar de um jogador específico, baseie-se no perfil real dele (veja JOGADORES abaixo).
7. Se não tiver informação suficiente, diga isso em vez de inventar.
8. Respostas breves e práticas. Máximo 3-4 parágrafos curtos.
9. O treinador (e qualquer psicólogo ou adulto responsável) conhece a criança melhor que você. Você oferece hipóteses e opções para que ELES decidam, nunca veredictos. Formule como "uma possibilidade é...", "o que você está observando?", "experimente se fizer sentido".
10. Você é um parceiro de pensamento, não uma autoridade. A ferramenta mais importante é o vínculo do adulto com a criança; suas sugestões são secundárias a essa relação e nunca a substituem.
11. O perfil é uma fotografia de comportamento em contexto, não um rótulo fixo nem uma identidade. Nunca diga "X é um [arquétipo]"; diga "X mostrou um padrão [arquétipo] neste momento" ou "tende a". O comportamento muda e é um olhar entre vários.
12. Encaminhamento (use com MUITA prudência, só em casos claros): seu marco padrão é sempre que o comportamento é normal e tem uma necessidade por trás. A imensa maioria do que te contarem (frustração, timidez, desânimo, choro, distração, um atrito com um colega, um dia ruim) se acompanha pela sua guia, NÃO se encaminha. Reserve o encaminhamento SÓ para sinais graves, persistentes e claramente fora do esporte: linguagem de autolesão, indícios de maus-tratos ou abuso, ou uma angústia intensa e sustentada que evidentemente excede o contexto esportivo. Nesses casos não interprete nem nomeie nenhuma condição (jamais sugira um diagnóstico): com carinho e sem alarmar, sugira que o adulto responsável acompanhe de perto e, se necessário, um profissional de confiança. Enquadre como "isto vai além do que um perfil esportivo pode ler", nunca como "algo está errado com a criança". Na dúvida, NÃO encaminhe: continue acompanhando pela força.
13. Se houver um psicólogo ou profissional acompanhando, enquadre o que você oferece como uma observação estruturada que soma ao trabalho DELE, não uma avaliação que compete com ele.

REGRAS DE REDAÇÃO:
- Nunca "falta", "é fraco", "tem problema". Sempre pela força e oportunidade.
- Nunca prescritivo negativo. Sempre construtivo: o que o adulto pode fazer.
- Sempre falar em potencial: "tende a", "pode", "provavelmente".
- Palavras proibidas: erro, controle, fraco, agressivo, problema, déficit, transtorno, diagnóstico.
- O objetivo é que o adulto sintonize com a criança, não que a criança mude.
- Português brasileiro, tom profissional e acolhedor.

MODO CONSULTIVO (como conduzir a conversa):
- Distinga dois tipos de consulta:
  a) Pergunta ESPECÍFICA (o treinador já sabe o que precisa: "como motivo um Impulsionador Dinâmico?", "que papel dou a ele no jogo?"): responda direto.
  b) PROBLEMA ABERTO sobre uma criança ou um grupo ("se comporta mal", "está estranho", "não sei o que fazer com ele") sem contexto suficiente: antes de recomendar, explore.
- Contexto mínimo para recomendar: desde quando acontece, em quais momentos (treino, jogo, brincadeira livre) e quais sinais concretos o adulto observa.
- Quando faltar esse contexto, seu primeiro turno tem três partes: (1) valide brevemente (o comportamento é normal e costuma ter uma necessidade por trás), (2) se você tiver o perfil da criança, ofereça UMA leitura tentativa ancorada nesse perfil ("pelo padrão X, uma possibilidade é..."), (3) faça 2 ou 3 perguntas concretas e discriminantes escolhidas segundo o perfil. Nunca responda só com perguntas: cada turno deve agregar valor.
- Suas perguntas são sempre sobre comportamento observável na atividade: o que você vê, quando acontece, desde quando, com quem, o que mudou na dinâmica. Nunca perguntas de corte clínico nem sobre a vida privada da família.
- UMA única rodada de exploração por situação: quando o treinador responder, entregue a orientação completa conectando as observações dele ao perfil. Não encadeie rodadas de perguntas.
- Se o treinador já deu contexto suficiente ou pede uma resposta direta, não insista com perguntas: responda.

BASE DE CONHECIMENTO DO MÉTODO ARGO:
- Modelo DISC: 4 eixos comportamentais:
  D (Impulsionador): energia de liderança, iniciativa, ação direta. Combustível: impacto visível e desafios.
  I (Conector): energia social, entusiasmo, coesão. Combustível: reconhecimento e pertencimento.
  S (Sustentador): energia de estabilidade, lealdade, constância. Combustível: segurança e rotinas previsíveis.
  C (Estrategista): energia analítica, precisão, observação. Combustível: compreensão e tempo para processar.
- Motor: Rápido (Dinâmico), Médio (Rítmico), Lento (Sereno). Nenhum motor é melhor ou pior.
- 12 arquétipos = 4 eixos × 3 motores
- Bússola secundária: o segundo eixo mais forte matiza o perfil principal
- Não existem crianças incorretas, apenas adultos que ainda não encontraram a sintonia certa

EXEMPLOS DE RESPOSTAS CORRETAS:

Pergunta: "Como motivo um Impulsionador Dinâmico no futebol?"
Resposta correta: "Um Impulsionador Dinâmico tende a precisar sentir que suas ações produzem impacto visível. Uma possibilidade, se fizer sentido com o que você vê nele, é dar-lhe uma responsabilidade concreta. Seu combustível é o desafio, então instruções vagas tendem a desconectá-lo. Você o conhece melhor no dia a dia, então tome isto como uma hipótese para experimentar."

Pergunta: "Quem deveria ser capitão?"
Resposta correta: "Não existe um perfil 'melhor' para capitão. Depende do tipo de liderança que sua equipe precisa neste momento."

Pergunta: "Tenho um jogador que se comporta mal, o que faço?"
Resposta correta (primeiro turno, falta contexto): "O que você descreve costuma ter uma necessidade por trás, e encontrá-la muda tudo. Se você me disser quem é, posso olhar o perfil dele para afinar a leitura. Enquanto isso, me ajude a ver melhor a situação: em quais momentos acontece (no início, nas esperas, em exercícios longos, no jogo)? O que ele faz exatamente (interrompe, discute, sai do exercício)? Desde quando você percebe isso? Com isso te dou ferramentas muito mais precisas para acompanhá-lo."`,
};

// ─── Tendencia labels per language ──────────────────────────────────────────

const TENDENCIA: Record<string, Record<string, string>> = {
    es: { D: 'con chispa de acción', I: 'con brújula social', S: 'con raíz firme', C: 'con ojo de detalle' },
    en: { D: 'with a spark of action', I: 'with a social compass', S: 'with firm roots', C: 'with an eye for detail' },
    pt: { D: 'com faísca de ação', I: 'com bússola social', S: 'com raiz firme', C: 'com olho de detalhe' },
};

// ─── Keyword matching for context injection ─────────────────────────────────

const SITUATION_KEYWORDS: Record<string, string[]> = {
    'no-quiere-arrancar': ['no quiere', 'no quiere entrenar', 'doesn\'t want to train', 'não quer treinar', 'desgana', 'apático', 'sin ganas'],
    'se-frustra-cuando-pierde': ['frustra', 'frustration', 'pierde', 'loses', 'perde', 'enoja cuando pierde', 'angry when losing'],
    'no-hace-lo-que-pido': ['no hace caso', 'no escucha', 'doesn\'t listen', 'não obedece', 'ignora', 'instrucción', 'instruction'],
    'raro-antes-del-partido': ['nervioso', 'nervous', 'ansioso', 'antes del partido', 'before the game', 'antes do jogo'],
    'mira-desde-afuera': ['no se suma', 'mira desde afuera', 'watching from outside', 'observando', 'no participa'],
    'llora-o-se-enoja': ['llora', 'cries', 'chora', 'se enoja', 'se quiebra', 'desborde'],
    'roce-con-companero': ['pelea', 'conflicto', 'roce', 'fight', 'conflict', 'briga', 'compañero'],
    'se-castiga': ['se castiga', 'autocrítica', 'self-critical', 'soy un desastre', 'se golpea'],
    'se-distrae': ['distrae', 'distracted', 'distraído', 'no presta atención', 'no se concentra'],
    'quiere-dejar': ['quiere dejar', 'wants to quit', 'quer sair', 'abandonar', 'no quiere venir'],
    'se-congela': ['se congela', 'freezes', 'se bloquea', 'no reacciona', 'paraliza'],
    'cambio-repentino': ['cambió', 'changed', 'mudou', 'diferente', 'distinto', 'de un día para el otro'],
};

// ─── Group type texts (compact inline from src/lib/groupBalanceRules.ts) ────
// Five base profile types. Vercel serverless can't import between files.
interface GroupTypeText { identity: string; tools: string[]; }

const GROUP_TYPE_TEXTS: Record<string, GroupTypeText> = {
    Competitivo: {
        identity: 'Un grupo que se enciende con los desafíos. La energía competitiva es su combustible natural y el ritmo lo marca quien toma la iniciativa.',
        tools: [
            'Asigna roles claros. Cuando cada jugador sabe cuál es su espacio de liderazgo, la energía competitiva se canaliza hacia afuera, no adentro.',
            'Usa desafíos internos con estructura: competencias por tiempo, equipos rotativos, reglas claras. La competencia es el lenguaje natural del grupo.',
        ],
    },
    Social: {
        identity: 'Un grupo donde la conexión humana es protagonista. La energía viene del vínculo entre los jugadores y el clima emocional marca el ritmo.',
        tools: [
            'Incorpora rituales de inicio y cierre en cada sesión. Este grupo rinde mejor cuando siente que pertenece a algo.',
            'Aprovecha la energía social como herramienta de enseñanza: ejercicios en grupo, explicaciones entre pares, liderazgo rotativo.',
        ],
    },
    Cohesivo: {
        identity: 'Un grupo con base sólida. La consistencia y la lealtad son el tejido que une a los jugadores, y el ritmo se construye desde la confianza.',
        tools: [
            'Introduce cambios de manera gradual y explica el porqué. Este grupo procesa mejor las novedades cuando entiende la razón.',
            'Desafía con metas progresivas. El crecimiento incremental es el ritmo natural del grupo.',
        ],
    },
    Metódico: {
        identity: 'Un grupo que observa antes de actuar. La precisión y la comprensión profunda son su manera natural de abordar cualquier desafío.',
        tools: [
            'Explica el "para qué" de cada ejercicio. Este grupo se compromete más cuando entiende el propósito detrás de la actividad.',
            'Intercala ejercicios analíticos con momentos de juego libre. La espontaneidad es un músculo que este grupo puede ejercitar.',
        ],
    },
    Balanceado: {
        identity: 'Un grupo diverso donde conviven diferentes estilos de comportamiento. La variedad es una fortaleza que permite adaptarse a múltiples situaciones.',
        tools: [
            'Alterna el estilo de los ejercicios: competitivos, colaborativos, técnicos, creativos. La diversidad responde bien a la variedad.',
            'Usa la diversidad como recurso explícito: cada jugador aporta una perspectiva diferente al grupo.',
        ],
    },
};

// ─── Situation cards (compact inline from src/lib/situationalGuide.ts) ──────
// 12 situations × 4 ejes = 48 cards. Each card condenses whatsHappeningForProfile
// + primary howToAccompany tip + ifNotResponding fallback.
const SITUATION_CARDS_DATA: Record<string, Record<string, string>> = {
    'no-quiere-arrancar': {
        D: 'El Impulsor necesita sentir que lo que viene vale la pena. Propónle un mini-desafío personal para los primeros 5 minutos o dale un rol activo desde el inicio (armar los conos, elegir el primer ejercicio). Si no arranca, déjalo mirar: su instinto competitivo se activa solo cuando ve al grupo en acción.',
        I: 'El Conector necesita conexión social para activarse. Acércate y pregúntale algo personal (¿cómo estuvo el día?). Esa micro-conexión es su interruptor. Si no responde, súmalo a una actividad grupal divertida y no técnica; un juego donde se ría suele ser suficiente.',
        S: 'El Sostén necesita previsibilidad. Mantenlo en la rutina (mismo calentamiento, mismos compañeros) y dile "Arrancamos cuando estés listo", sin presión. Si no responde, dale una tarea pequeña y predecible al costado para que entre en ritmo sin saltar al grupo.',
        C: 'El Estratega necesita entender qué va a pasar antes de comprometerse. Cuéntale brevemente el plan del día (primero calentamiento, después táctico, después partido). Si cambió algo del plan habitual, explícale por qué. Si no entra, déjalo observar la primera actividad hasta que entienda la lógica.',
    },
    'se-frustra-cuando-pierde': {
        D: 'Para el Impulsor, perder es personal: siente que el resultado define su valor. Primero valida (entiendo que estás enojado, es normal), después redirige la energía: "¿qué harías diferente si pudieras repetir?". Si no escucha, dale un momento a solas para procesar en privado antes de cualquier consejo.',
        I: 'El Conector siente la derrota como un quiebre social (le fallé al grupo). Valida desde lo vincular (se nota que te importa el equipo) y sepáralo del "yo fallé" con datos: "mira todo lo que el equipo logró, tú fuiste parte". Si no se recupera, pídele a un compañero de confianza que le hable.',
        S: 'El Sostén no explota con la derrota, la guarda en silencio y la arrastra varios días. Valida sin forzar (si necesitas hablar, aquí estoy). No le pidas que procese en el momento. Las próximas veces que lo veas observa si está más callado: un "¿cómo estás?" sin presión abre la puerta.',
        C: 'El Estratega analiza la derrota en loop buscando el error exacto. Valida su análisis pero ponle límite (está bien pensarlo, elijamos una sola cosa para trabajar). Ofrécele datos concretos (en 10 jugadas acertaste 7): los números lo sacan del circuito emocional.',
    },
    'no-hace-lo-que-pido': {
        D: 'El Impulsor escuchó la instrucción pero ya decidió hacerla a su manera: su motor lo lanza a la acción antes de que termines de hablar. Dale instrucciones cortas y directas, en una frase (pase al pivote, tiro al arco). Si hizo algo diferente pero funcionó, reconócelo. Si no, dale el "por qué" competitivo: "esto te da una herramienta más para ganar".',
        I: 'El Conector probablemente estaba socializando cuando diste la instrucción. Asegúrate de tener su atención primero (contacto visual, nombre, después la consigna). Dale la instrucción en clave social: "tú y tu compañero van a hacer esto juntos". Si no, pídele que se la explique a otro compañero: al traducirla, la ejecuta.',
        S: 'El Sostén escuchó todo, pero su motor necesita más tiempo para cerrar la lógica antes de arrancar. Dale la instrucción paso a paso, no todo junto. Dale unos segundos después de la consigna antes de esperar que arranque: ese silencio es su tiempo de procesamiento. Si no, haz una demostración rápida; procesa mejor viendo que escuchando.',
        C: 'El Estratega está procesando la lógica de la instrucción. Si le dijiste algo que contradice lo anterior, se frena. Explica el "para qué" del ejercicio (trabaja la reacción lateral). Si pregunta "por qué", no lo tomes como cuestionamiento: es su forma de comprometerse. Si no arranca, dile "pruébalo una vez y después me dices".',
    },
    'raro-antes-del-partido': {
        D: 'El Impulsor canaliza los nervios con hiperactividad: habla más, se mueve mucho, o se pone irritable. La incertidumbre le molesta porque quiere controlar el resultado. Dale una tarea concreta de control (calienta con 20 tiros). Háblale en clave de plan: "tu rol es X, si pasa Y haces Z". Si no, déjalo calentar solo.',
        I: 'El Conector busca contención social: habla con todos, hace chistes. Si está más callado de lo normal, algo le pesa. Genera un momento grupal de conexión (ronda, grito de equipo). Si no, dale un rol social: "encárgate de que todos estén arriba"; transforma su ansiedad en energía positiva.',
        S: 'El Sostén se cierra y se pega a la rutina. Mantén la rutina pre-partido lo más igual posible (mismo calentamiento, mismo lugar, mismos compañeros cerca). Dile algo que le dé seguridad: "hoy jugamos como en el entrenamiento, nada raro". No lo fuerces a estar animado: compite bien desde la calma.',
        C: 'El Estratega piensa en todos los escenarios posibles. Dale información concreta (rival, plan de juego, su rol): los datos reemplazan la incertidumbre. Pregúntale "¿tienes alguna duda sobre lo que vamos a hacer?". Si sigue trabado, dile "pensaste mucho y eso está bien, ahora confía en lo que ya preparaste".',
    },
    'mira-desde-afuera': {
        D: 'Raro en un Impulsor. Cuando pasa, es porque no se siente seguro de poder dominar la situación. Dale un rol desde el borde (mira y dime qué harías diferente). Propónle un desafío con puerta de salida: "¿te animas? Si no te convence, vuelves". Si no, invítalo directo después de que mire una ronda: "¿listo?".',
        I: 'El Conector observa desde afuera hasta identificar a "su persona". Preséntale a alguien con afinidad (él está en tu misma posición, entrenen juntos). Inclúyelo en una dupla antes del grupo grande. Si no, dale un rol social desde afuera (ayúdame a contar los puntos): lo conecta sin forzar exposición.',
        S: 'Es el comportamiento más natural del Sostén ante lo nuevo: está haciendo su lectura de seguridad. No lo apures. "Cuando estés listo, súmate" sin presión es lo que más funciona. Si puedes, ponlo a hacer la actividad al costado en paralelo, sin exposición grupal. Déjalo mirar toda la sesión si hace falta.',
        C: 'El Estratega analiza las reglas del juego desde afuera. Explícale el ejercicio brevemente mientras observa (la idea es que hagas esto cuando pasa aquello). Pregúntale "¿quieres que te lo explique?". Si sigue afuera, dile "hazlo una vez de prueba, no cuenta": el primer intento sin evaluación lo desbloquea.',
    },
    'llora-o-se-enoja': {
        D: 'El Impulsor se enoja más que llora: siente que perdió el control. No lo enfrentes en caliente; déjalo que se enfríe unos segundos y acércate con tono neutro: "cuando estés listo, hablamos". Cuando se calme, dale una vía de acción: "ahora volvamos y hagamos bien ese ejercicio". Necesita sentir que puede recuperar el control.',
        I: 'El Conector se quiebra cuando siente que la corrección rompió el vínculo (¿me está retando porque no le caigo bien?). Repara primero: "no estoy enojado, quiero ayudarte a mejorar". Después conecta desde el afecto (una palmada, un "¿estamos bien?"). Si no se calma, pídele a un compañero de confianza que lo acompañe.',
        S: 'El Sostén rara vez se desborda, así que si llora es que se saturó hace rato. Dale pausa sin obligarlo a explicar (siéntate aquí un momento, no pasa nada). No le preguntes "¿qué te pasa?" en el momento. Mantenlo cerca pero sin actividad: la cercanía sin demanda es su forma de recuperarse.',
        C: 'El Estratega se frustra cuando algo no tiene lógica o la corrección se sintió injusta. Cuando se calme, dale una explicación clara (te corregí porque quiero que hagas esto mejor, y la forma es esta). Pregúntale qué lo frustró específicamente: el detonante no siempre es lo obvio. Si no, déjalo solo unos minutos para ordenar.',
    },
    'roce-con-companero': {
        D: 'El Impulsor choca cuando siente que otro le saca protagonismo. Separa el conflicto de la persona (los dos quieren ganar y eso está bien). Asígnale un aspecto del ejercicio donde él sea el que decide: con su territorio, baja la necesidad de pelear por el del otro. Si no, cámbialos de dupla temporalmente.',
        I: 'El Conector vive el roce como un quiebre en la relación. Habla con los dos juntos enfocándote en el vínculo (ustedes son compañeros, esto se resuelve hablando). Después del ejercicio, dale al Conector un momento de cierre: "¿estamos bien?". Necesita saber que la relación sigue. Si no, dale un rol de puente social.',
        S: 'El Sostén evita el conflicto y si tuvo un roce está incomodísimo. No lo obligues a "hablar las cosas" frente al grupo. Acércate en privado: "vi que hubo algo ahí, ¿estás bien?". Ayúdalo a volver a su zona de confort (la rutina de siempre). Si no, deja que el tiempo haga su trabajo; no necesita resolver verbalmente.',
        C: 'El Estratega choca cuando siente que el otro hace algo "mal" o sin lógica. Valida su perspectiva (tu forma de verlo tiene sentido) y amplía con la del otro (la de tu compañero también, viene de otro lugar). Propón un acuerdo de método: "primero a tu manera, después a la de él". Si no, dale una tarea individual breve.',
    },
    'se-castiga': {
        D: 'El Impulsor se castiga desde la bronca (¡soy un desastre!): cada error amenaza su autoimagen de líder. Interrumpe el circuito con acción: "ok, fallaste. Ahora haz 3 repeticiones y listo". Usa su competitividad: "los mejores jugadores fallan, la diferencia es qué hacen después". Si no, sácalo del ejercicio y dale una tarea física simple.',
        I: 'El Conector se castiga desde la vergüenza pública (todos me vieron fallar). Normaliza el error frente al grupo: "todos fallamos, así se aprende". En privado después: "a mí me importa que lo intentes, no que salga perfecto". Si no, ponlo en una actividad donde el error sea parte del juego: diluye la sensación de ser "el único".',
        S: 'El Sostén se castiga en silencio: se queda callado, baja la cabeza, pierde energía. Acércate con calma y devuélvele perspectiva: "ese error no define cómo juegas, mira todo lo que vienes haciendo bien". En el siguiente ejercicio ponlo en algo que domine para recuperar confianza. Si no, no insistas: se recupera cuando siente que el entorno no cambió.',
        C: 'El Estratega se castiga desde el análisis: repasa el error en loop. Dale datos que contrarresten: "fallaste esta, pero las 5 anteriores las hiciste perfecto". Los números lo sacan del loop. Propón que el error sea un dato, no un juicio: "¿qué información te da? ¿qué ajustarías?". Si no, dile "suficiente análisis por hoy".',
    },
    'se-distrae': {
        D: 'El Impulsor se distrae cuando el ejercicio no tiene suficiente intensidad. Sube el ritmo: "ahora en la mitad del tiempo" o "el que llega primero elige el próximo". Dale responsabilidad dentro del ejercicio: que cuente, que arbitre, que lidere una variante. Si no, propón un desafío paralelo: "mientras esperas, haz esto otro". No tolera el vacío.',
        I: 'El Conector se va hacia lo social porque su atención va primero a las personas. Convierte el ejercicio en algo social (en duplas con comunicación entre ellos). Usa su sociabilidad como herramienta: "explícale a tu compañero cómo se hace este ejercicio". Si no, ponlo de ayudante tuyo: la cercanía con el adulto recaptura su atención.',
        S: 'El Sostén se desconecta por exceso de estímulo (mucho ruido, cambios constantes). Baja el ritmo de cambios: que haga el mismo ejercicio más tiempo antes de pasar al siguiente. Dale un espacio predecible: "tú siempre en esta posición, tu trabajo es este". Si no, acércate y reconéctalo con calma y contacto personal.',
        C: 'El Estratega se distrae cuando el ejercicio le parece repetitivo o sin propósito. Dale una capa extra: "fíjate qué patrón se repite" o "qué compañero se mueve mejor y por qué". Explícale qué estás buscando con el ejercicio. Si no, propón que invente una variante: se concentra cuando puede diseñar.',
    },
    'quiere-dejar': {
        D: 'El Impulsor quiere dejar cuando siente que no puede ganar, crecer o liderar. Pregúntale qué cambiaría: "si pudieras cambiar algo del deporte, ¿qué sería?". Escucha la respuesta. Propón un objetivo concreto y medible a 3 semanas. Si no, no lo presiones: a veces necesita extrañar el desafío para volver con ganas.',
        I: 'El Conector quiere dejar cuando se rompieron los vínculos. Explora: "¿hay algo del grupo que te hace ruido?". Muchas veces la razón no es el deporte, es una relación social que se rompió. Si es posible, reconéctalo con un compañero cercano o cámbialo a un grupo con más afinidad. Si no, habla con el adulto responsable.',
        S: 'El Sostén quiere dejar cuando algo cambió demasiado del contexto. Identifica qué cambió: "¿hay algo que antes te gustaba y ahora no?". El Sostén puede señalar exactamente el punto de quiebre. Si puedes, restaura algo del contexto anterior. Si no, dale tiempo sin pedirle decisión definitiva: "no hace falta que decidas ahora".',
        C: 'El Estratega quiere dejar cuando no aprende nada nuevo o la actividad no tiene sentido. Muéstrale el progreso: "mira dónde estabas hace 3 meses y dónde estás ahora". Pregúntale qué le gustaría aprender. Si no, propón un desafío intelectual dentro del deporte (analizar video, planificar jugada).',
    },
    'se-congela': {
        D: 'Raro en un Impulsor, pero cuando se congela es porque la presión lo abrumó. Dale una instrucción concreta y simple: "la próxima pelota, tira al arco". Una sola acción clara lo desbloquea. Desde afuera, dale confianza: "tú sabes hacer esto, confío en ti". Si no, cámbialo de rol temporalmente a algo menos expuesto.',
        I: 'El Conector se congela por miedo a quedar mal frente al grupo: el bloqueo es social, no técnico. Quítale presión del resultado: "no importa si sale, quiero que lo intentes". Involucra a los compañeros (equipo, todos adentro). Si no, ponlo en una jugada grupal donde el éxito sea del equipo, no individual.',
        S: 'El Sostén se congela porque la presión del partido rompe su base de seguridad. Baja la presión con info: "haz lo mismo que en el entrenamiento, nada diferente". Dale una instrucción repetitiva y predecible (cada vez que la pelota venga, pásala a X). Si no, sácalo unos minutos: "respira, mira, y cuando estés listo vuelves".',
        C: 'El Estratega se congela por sobreanálisis: su mente trabaja más rápido que su cuerpo. Simplifica su toma de decisión: "si estás libre, tira. Si no, pasa". Reducir opciones lo desbloquea. Si sigue trabado, dile literal "no pienses, juega": necesita permiso explícito para apagar el análisis.',
    },
    'cambio-repentino': {
        D: 'Un Impulsor que se apaga perdió algo que lo hacía sentir poderoso (un rol, una relación, una seguridad fuera de la cancha). Observa unos días. Si persiste, acércate con algo concreto: "te noto diferente, ¿puedo ayudar?". Si no quiere hablar, habla con el adulto responsable: suele ser señal de algo importante fuera de la cancha.',
        I: 'Un Conector que se cierra es una señal fuerte. Algo le está doliendo en el plano vincular (familia, amigos, bullying). Acércate desde el vínculo: "te conozco y sé que algo te pasa. No hace falta que me cuentes, pero estoy aquí". Dale espacio a su ritmo. Si persiste, contacta al adulto responsable.',
        S: 'El Sostén es el que más aguanta antes de mostrar malestar, así que si ya lo ves, viene acumulando hace rato. Mantenlo en rutina estable (la actividad de siempre como refugio de normalidad). Acércate sin drama: "¿cómo estás hoy?", como parte natural de la rutina. Si no, contacta al adulto con delicadeza: rara vez pide ayuda, hay que ir a buscarla.',
        C: 'Un Estratega que cambia puede estar procesando algo internamente que no logra resolver (un problema familiar, una injusticia percibida). Ofrécele espacio para ordenar: "¿quieres contarme qué está pasando por tu cabeza?". Si no quiere, respétalo: propón que lo escriba. Si persiste, contacta al adulto responsable.',
    },
};

// ─── Deterministic helpers for group balance (inline from groupBalance.ts) ──
function computeAxisDistribution(players: Array<{ eje: string }>): Record<string, number> {
    const total = players.length;
    if (total === 0) return { D: 0, I: 0, S: 0, C: 0 };
    const counts: Record<string, number> = { D: 0, I: 0, S: 0, C: 0 };
    for (const p of players) { if (counts[p.eje] !== undefined) counts[p.eje]++; }
    return {
        D: Math.round((counts.D / total) * 100),
        I: Math.round((counts.I / total) * 100),
        S: Math.round((counts.S / total) * 100),
        C: Math.round((counts.C / total) * 100),
    };
}

function computeMotorDistribution(players: Array<{ motor: string }>): Record<string, number> {
    const total = players.length;
    if (total === 0) return { Rápido: 0, Medio: 0, Lento: 0 };
    const counts: Record<string, number> = { Rápido: 0, Medio: 0, Lento: 0 };
    for (const p of players) {
        if (p.motor === 'Rápido') counts['Rápido']++;
        else if (p.motor === 'Lento') counts['Lento']++;
        else counts['Medio']++;
    }
    return {
        Rápido: Math.round((counts.Rápido / total) * 100),
        Medio: Math.round((counts.Medio / total) * 100),
        Lento: Math.round((counts.Lento / total) * 100),
    };
}

function detectGroupTypes(dist: Record<string, number>): string[] {
    const types: string[] = [];
    if (dist.D > 35) types.push('Competitivo');
    if (dist.I > 35) types.push('Social');
    if (dist.S > 35) types.push('Cohesivo');
    if (dist.C > 35) types.push('Metódico');
    if (types.length === 0) types.push('Balanceado');
    return types;
}

// ─── Handler ────────────────────────────────────────────────────────────────

export const config = { maxDuration: 60 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) {
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing auth token' });
    }

    const sb = createClient(supabaseUrl, serviceKey);

    try {
        const { data: { user }, error: authError } = await sb.auth.getUser(authHeader.replace('Bearer ', ''));
        if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

        // Phase 2: an explicit tenant_id (query or body) targets a specific tenant
        // and requires active membership of THAT tenant; absent it, fall back to
        // the single-membership resolution.
        const requestedTenantId = (typeof req.query.tenant_id === 'string' && req.query.tenant_id ? req.query.tenant_id : null) ?? (typeof req.body?.tenant_id === 'string' && req.body.tenant_id ? req.body.tenant_id : null);
        const ctx = await resolveTenantContext(sb, user.id, requestedTenantId);
        if (!ctx) return res.status(requestedTenantId ? 403 : 404).json({ error: requestedTenantId ? 'Not a member of this tenant' : 'Tenant not found' });
        const callerRole: string = ctx.role;
        const callerMemberId: string | null = ctx.memberId;
        const tenant = { id: ctx.tenantId };

        // Coach scoping: a coach's AI consultant only sees players in the teams
        // they're assigned to (privacy — these are minors). null = unscoped
        // (owner/member see all). An empty list means "no players visible".
        const isCoach = callerRole === 'coach';
        let coachGroupIds: string[] | null = null;
        // Members are CHILDREN now (group_members.session_id -> child_id). These ids
        // match current_perfilamiento.id (the child id) used to scope the player list.
        let coachChildIds: string[] | null = null;
        if (isCoach && callerMemberId) {
            const { data: gc } = await sb.from('group_coaches').select('group_id').eq('member_id', callerMemberId);
            coachGroupIds = (gc ?? []).map((r: { group_id: string }) => r.group_id);
            if (coachGroupIds.length > 0) {
                const { data: gm } = await sb.from('group_members').select('child_id').in('group_id', coachGroupIds);
                coachChildIds = Array.from(new Set((gm ?? []).map((r: { child_id: string }) => r.child_id)));
            } else {
                coachChildIds = [];
            }
        }

        // Plantel-hat scoping: when the dashboard is focused on a specific plantel
        // (context switcher), scope the consultant to that plantel's players,
        // respecting the coach bound. Mirrors tenant-sessions ?team=.
        const teamFilter = (typeof req.query.team === 'string' && req.query.team ? req.query.team : null)
            ?? (typeof req.body?.team === 'string' && req.body.team ? req.body.team : null);
        if (teamFilter) {
            if (coachGroupIds && !coachGroupIds.includes(teamFilter)) {
                coachGroupIds = [];
                coachChildIds = [];
            } else {
                coachGroupIds = [teamFilter];
                const { data: gmTeam } = await sb.from('group_members').select('child_id').in('group_id', [teamFilter]);
                coachChildIds = Array.from(new Set((gmTeam ?? []).map((r: { child_id: string }) => r.child_id)));
            }
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // GET: List threads or messages
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        if (req.method === 'GET') {
            const action = req.query.action as string;

            if (action === 'threads') {
                // Get distinct threads with last message + total user message count
                // Chat history is personal: each user (coach or admin) sees only
                // their own threads. Legacy callers without a member row see all.
                let threadsQ = sb.from('chat_messages')
                    .select('thread_id, content, created_at')
                    .eq('tenant_id', tenant.id)
                    .eq('role', 'user');
                let countQ = sb.from('chat_messages')
                    .select('id', { count: 'exact', head: true })
                    .eq('tenant_id', tenant.id)
                    .eq('role', 'user');
                if (callerMemberId) {
                    threadsQ = threadsQ.eq('member_id', callerMemberId);
                    countQ = countQ.eq('member_id', callerMemberId);
                }
                // Threads are scoped to the active context: a plantel hat shows that
                // plantel's conversations; Administración shows admin-level (null) ones.
                // The count is NOT plantel-scoped (it stays per-member, powering the
                // trial query limit) so switching plantel never resets the cap.
                threadsQ = teamFilter ? threadsQ.eq('plantel_id', teamFilter) : threadsQ.is('plantel_id', null);
                const [{ data: threads }, { count: totalUserMessages }] = await Promise.all([
                    threadsQ.order('created_at', { ascending: false }),
                    countQ,
                ]);

                // Deduplicate by thread_id, keep most recent
                const seen = new Set<string>();
                const unique = (threads ?? []).filter(t => {
                    if (seen.has(t.thread_id)) return false;
                    seen.add(t.thread_id);
                    return true;
                }).slice(0, 20);

                return res.status(200).json({ threads: unique, total_user_messages: totalUserMessages ?? 0 });
            }

            if (action === 'messages') {
                const threadId = req.query.thread_id as string;
                if (!threadId) return res.status(400).json({ error: 'thread_id required' });

                let msgsQ = sb
                    .from('chat_messages')
                    .select('role, content, created_at')
                    .eq('tenant_id', tenant.id)
                    .eq('thread_id', threadId)
                    .in('role', ['user', 'assistant']);
                // Prevent reading another member's thread by guessing its id.
                if (callerMemberId) msgsQ = msgsQ.eq('member_id', callerMemberId);
                const { data: messages } = await msgsQ
                    .order('created_at', { ascending: true })
                    .limit(100);

                return res.status(200).json({ messages: messages ?? [] });
            }

            return res.status(400).json({ error: 'Unknown action' });
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // POST: Send message
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

        const t0 = Date.now(); // for latency telemetry
        const { thread_id, message, lang = 'es' } = req.body ?? {};
        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return res.status(400).json({ error: 'Message required' });
        }

        // Pre-AI gates run as ONE parallel batch (were 3-4 serial round trips,
        // ~200-400ms of p50). The trial total is a cheap head count fired
        // unconditionally and only consulted when plan === 'trial'. Check
        // ordering below is unchanged: trial gates before rate limit.
        const oneHourAgo = new Date(Date.now() - 3600_000).toISOString();
        const [fairUseRes, planRes, trialCountRes, rateCountRes] = await Promise.all([
            // Fair use: increment AI query counter and check soft cap.
            // Intentionally non-blocking (the soft cap is invisible to the user
            // by design) and fail-open: a telemetry hiccup must never block a
            // paying coach; the signal goes to ops instead (R4/E14).
            sb.rpc('increment_ai_queries', { p_tenant_id: tenant.id }),
            sb.from('tenants').select('plan, trial_expires_at, roster_limit').eq('id', tenant.id).maybeSingle(),
            sb.from('chat_messages').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id).eq('role', 'user'),
            sb.from('chat_messages').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id).eq('role', 'user').gt('created_at', oneHourAgo),
        ]);
        if (fairUseRes.error) {
            console.error('[tenant-chat] Fair use check error (failing open):', fairUseRes.error.message);
        }
        const fairUseExceeded = fairUseRes.data?.fair_use_exceeded === true;
        if (fairUseExceeded) {
            console.info(`[tenant-chat] Fair-use soft cap exceeded for tenant ${tenant.id} (non-blocking by design)`);
        }

        // Trial plan: check expiration + hard cap at 10 total user messages
        const tenantPlan = planRes.data;
        if (tenantPlan?.plan === 'trial') {
            if (tenantPlan.trial_expires_at && new Date(tenantPlan.trial_expires_at) < new Date()) {
                return res.status(403).json({ error: 'trial_expired', message: 'Tu periodo de prueba ha finalizado. Actualiza tu plan para seguir usando el asistente.' });
            }
            if ((trialCountRes.count ?? 0) >= 10) {
                return res.status(403).json({ error: 'Trial message limit reached' });
            }
        }

        // Rate limiting: max 60 messages per tenant per hour
        if ((rateCountRes.count ?? 0) >= 60) {
            return res.status(429).json({ error: 'Rate limit exceeded. Try again later.' });
        }

        const trimmedMsg = message.trim().slice(0, 2000); // Cap at 2000 chars
        const threadId = thread_id || crypto.randomUUID();
        const promptLang = (['es', 'en', 'pt'].includes(lang) ? lang : 'es') as string;

        // ── Fetch tenant's players for context ────────────────────────────
        // Use roster_limit from tenant (capped at 1000) instead of hardcoded 50,
        // so Academy (100) and Enterprise (500+) see their full team in context.
        // ai_sections is intentionally excluded here — it's a heavy JSONB blob
        // and we only need it when a specific player is mentioned (re-fetched below).
        const sessionLimit = Math.min(Math.max(tenantPlan?.roster_limit ?? 50, 50), 1000);
        const NO_MATCH = '00000000-0000-0000-0000-000000000000';
        // current_perfilamiento = one row per CHILD (latest resolved profile). Its
        // id is the CHILD id, which matches group_members.child_id used for scoping.
        // The view only contains resolved profiles, so '_pending' never appears (the
        // explicit guard is kept as defense in depth).
        let sessionsQuery = sb.from('current_perfilamiento')
            .select('id, child_name, child_age, sport, eje, motor, eje_secundario, archetype_label')
            .eq('tenant_id', tenant.id)
            .is('deleted_at', null)
            .not('eje', 'eq', '_pending')
            .order('current_profile_date', { ascending: false })
            .limit(sessionLimit);
        let groupsQuery = sb.from('groups')
            .select('id, name, group_members(child_id)')
            .eq('tenant_id', tenant.id)
            .is('deleted_at', null);
        // Coaches only see their teams' players (sentinel keeps an empty scope empty).
        if (coachChildIds !== null) {
            sessionsQuery = sessionsQuery.in('id', coachChildIds.length > 0 ? coachChildIds : [NO_MATCH]);
        }
        if (coachGroupIds !== null) {
            groupsQuery = groupsQuery.in('id', coachGroupIds.length > 0 ? coachGroupIds : [NO_MATCH]);
        }
        // Química de grupos: the caller's PERSONAL analytical groups (owner-scoped,
        // mirrors tenant-chem-groups.ts) so the consultant can answer about them.
        // Legacy callers without a member row have none (creation requires one).
        const chemGroupsPromise = (() => {
            if (!callerMemberId) return Promise.resolve({ data: null });
            let q = sb.from('chem_groups')
                .select('id, name, chem_group_members(child_id)')
                .eq('tenant_id', tenant.id)
                .eq('owner_member_id', callerMemberId)
                .is('deleted_at', null);
            if (teamFilter) q = q.eq('plantel_id', teamFilter);
            return q;
        })();
        // Thread history is fetched here (not later) so injections below can know
        // whether this is the thread's first turn (consultive-mode nudge). Most
        // RECENT messages first, then restored to chronological order (E1).
        // Member-scoped like GET action=messages: a guessed foreign thread_id
        // must not feed another member's conversation into the model's context.
        let historyQuery = sb
            .from('chat_messages')
            .select('role, content')
            .eq('tenant_id', tenant.id)
            .eq('thread_id', threadId)
            .in('role', ['user', 'assistant']);
        if (callerMemberId) historyQuery = historyQuery.eq('member_id', callerMemberId);
        const historyPromise = historyQuery
            .order('created_at', { ascending: false })
            .limit(12);
        const [{ data: sessions }, { data: groupsData }, { data: chemGroupsData }, { data: history }] = await Promise.all([sessionsQuery, groupsQuery, chemGroupsPromise, historyPromise]);

        const allHistory = (history ?? [])
            .slice()
            .reverse() // back to chronological (oldest → newest)
            .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));
        const isFirstTurn = allHistory.length === 0;

        const tendLabels = TENDENCIA[promptLang] ?? TENDENCIA.es;
        const sanitize = (s: string, maxLen = 60) => s.replace(/[^\p{L}\p{N}\s'-]/gu, '').slice(0, maxLen);
        // Filter out sessions without a usable name so one corrupt row can't
        // crash the matcher/anonymizer (E16).
        const allPlayers = (sessions ?? []).filter(s => typeof s.child_name === 'string' && s.child_name.trim().length > 0);

        // ─── Anonymization (Gemini never sees real player names) ────────
        // Each session gets a stable per-index placeholder {{Pn}}. We scrub all
        // player-name text before sending to Gemini and rehydrate afterwards.
        // The boundary uses Unicode lookarounds (accent-safe; plain \b leaks
        // names like "José"/"Ángel" — R1). A single precompiled alternation
        // replaces ~1000 per-name regex passes (O2).
        const idToIndex = new Map<string, number>();
        allPlayers.forEach((p, i) => idToIndex.set(p.id, i));
        const placeholderForId = (id: string): string => `{{P${(idToIndex.get(id) ?? 0) + 1}}}`;

        const placeholderToName = new Map<string, string>();
        const variantToPlaceholder = new Map<string, string>();
        const nameVariants: string[] = [];
        allPlayers.forEach((p, i) => {
            const placeholder = `{{P${i + 1}}}`;
            const fullName = p.child_name.trim();
            const firstName = fullName.split(/\s+/)[0];
            placeholderToName.set(placeholder, firstName);
            // First-name keys can collide across homonyms; first writer wins.
            // Display stays correct (same first name) and the mentioned-player
            // path below scrubs each player's own name to ITS placeholder (E5).
            for (const v of [fullName, firstName]) {
                const key = v.toLowerCase();
                if (!variantToPlaceholder.has(key)) { variantToPlaceholder.set(key, placeholder); nameVariants.push(v); }
            }
        });
        // Longest names first so "Juan Pablo" is consumed before "Juan".
        nameVariants.sort((a, b) => b.length - a.length);
        const anonRe = nameVariants.length
            ? new RegExp(`(?<![\\p{L}\\p{N}])(${nameVariants.map(escapeRegexStr).join('|')})(?![\\p{L}\\p{N}])`, 'giu')
            : null;
        const anonymize = (text: string): string => {
            if (!text || !anonRe) return text;
            return text.replace(anonRe, (m) => variantToPlaceholder.get(m.toLowerCase()) ?? m);
        };
        // Scrub a specific player's own name to a chosen placeholder, so a
        // mentioned player's report can never be tagged with a homonym's tag.
        const anonymizeAs = (text: string, fullName: string, placeholder: string): string => {
            if (!text) return text;
            const variants = [fullName.trim(), fullName.trim().split(/\s+/)[0]]
                .filter((v, i, a) => v && a.indexOf(v) === i)
                .sort((a, b) => b.length - a.length);
            let out = text;
            for (const v of variants) {
                out = out.replace(new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegexStr(v)}(?![\\p{L}\\p{N}])`, 'giu'), placeholder);
            }
            return out;
        };
        const rehydrate = (text: string): string => {
            if (!text || placeholderToName.size === 0) return text;
            let result = text;
            for (const [placeholder, realName] of placeholderToName) {
                // split/join avoids the ES2021 replaceAll requirement.
                result = result.split(placeholder).join(realName);
            }
            return result;
        };

        // ── OPT 2: Build compact team summary instead of full player list ──
        // Count players per axis for a compact overview
        const axisCounts: Record<string, number> = {};
        const motorCounts: Record<string, number> = {};
        for (const s of allPlayers) {
            axisCounts[s.eje] = (axisCounts[s.eje] ?? 0) + 1;
            motorCounts[s.motor] = (motorCounts[s.motor] ?? 0) + 1;
        }
        const axisLabels = AXIS_DISPLAY[safeLang(promptLang)];
        const axisSummary = Object.entries(axisCounts).map(([k, v]) => `${v} ${axisLabels[k] ?? k}`).join(', ');
        // Canonical motor display names (Dinámico/Rítmico/Sereno), not internal
        // keys (Rápido/Medio/Lento) which are jargon the user never sees.
        const motorSummary = Object.entries(motorCounts).map(([k, v]) => `${v} ${canonicalMotorDisplay('D', k, promptLang)}`).join(', ');
        // Player list uses per-session placeholders instead of real names.
        const playerListForPrompt = allPlayers.map(p => placeholderForId(p.id)).join(', ');
        // Team-level group awareness: list all groups so Gemini can ask for
        // clarification when the keyword matcher below doesn't fire.
        type GroupRowWithMembers = { id: string; name: string; group_members: Array<{ child_id: string }> | null };
        const groups = (groupsData ?? []) as GroupRowWithMembers[];
        // Chem groups are normalized to the same shape as planteles so the
        // mention matcher + stats builder treat both uniformly.
        type ChemGroupRow = { id: string; name: string; chem_group_members: Array<{ child_id: string }> | null };
        const chemGroups: GroupRowWithMembers[] = ((chemGroupsData ?? []) as ChemGroupRow[])
            .map(g => ({ id: g.id, name: g.name, group_members: g.chem_group_members }));
        // Group names are user-authored and may contain roster children's names
        // ("Dupla Juan y Mateo"). Sanitize (strips braces, so it can't corrupt
        // placeholders) THEN anonymize before ANY prompt injection, so the
        // "Gemini never sees real player names" invariant holds for group names
        // too; rehydrate() restores them in the reply (R14).
        const promptGroupName = (name: string) => anonymize(sanitize(name ?? '', 100));
        const groupsList = groups.length > 0
            ? `\nGrupos del equipo: ${groups.map(g => `"${promptGroupName(g.name)}" (${(g.group_members ?? []).length})`).join(', ')}.`
            : '';
        const chemGroupsList = chemGroups.length > 0
            ? `\nGrupos de química del usuario (agrupaciones analíticas propias): ${chemGroups.map(g => `"${promptGroupName(g.name)}" (${(g.group_members ?? []).length})`).join(', ')}.`
            : '';
        const teamSummary = allPlayers.length > 0
            ? `\n\nEQUIPO: ${allPlayers.length} jugadores. Distribución: ${axisSummary}. Motores: ${motorSummary}.\nJugadores: ${playerListForPrompt}.${groupsList}${chemGroupsList}`
            : '\n\nEl entrenador todavía no tiene jugadores registrados.';

        // ── Context injection based on message content ──────────────────
        let extraContext = '';
        // Quality signals captured through the flow for best-effort telemetry (Wave E).
        const qa = { contextMiss: false, contextWeak: false, groundtruthViolation: false, labelViolation: false, prohibitedHit: false, prohibitedAfterRetry: false };

        // ── Player mention detection (accent-insensitive, homonym-safe) ─────
        // Prefer explicit full-name matches; only fall back to first names when
        // no full name was written. A first name shared by 2+ players is treated
        // as ambiguous (ask) rather than guessing the wrong child (E2/E3/E6).
        // Roster names match by default (lowercase included); a name that is also
        // an everyday word ("Sol"/"Paz") is only vetoed on literal-noun context —
        // see classifyNameMention. Tokens/normMsg are computed once and reused.
        const matchLang = safeLang(promptLang);
        const matchCtx = { normMsg: normalizeName(trimmedMsg), tokens: tokenizeMessage(trimmedMsg) };
        const fullNameMatches = allPlayers.filter(p => {
            const full = p.child_name.trim();
            return /\s/.test(full) && classifyNameMention(full, trimmedMsg, matchLang, matchCtx).match;
        });
        const firstNameResults = allPlayers.map(p => ({ p, r: classifyNameMention(p.child_name.trim().split(/\s+/)[0], trimmedMsg, matchLang, matchCtx) }));
        const firstNameMatches = firstNameResults.filter(x => x.r.match).map(x => x.p);
        const mentionedSet = fullNameMatches.length > 0 ? fullNameMatches : firstNameMatches;
        const mentionedPlayers = mentionedSet.filter((p, i, a) => a.findIndex(q => q.id === p.id) === i);
        const mentionedPlayer = mentionedPlayers.length === 1 ? mentionedPlayers[0] : null;
        // Telemetry: a recall-biased "weak" accept (a common-word name with no
        // person cue and no literal-noun veto) — surfaced so a real player named
        // Sol/Luna/Paz repeatedly landing here is visible to ops.
        if (mentionedPlayer && !fullNameMatches.some(p => p.id === mentionedPlayer.id)) {
            const chosen = firstNameResults.find(x => x.p.id === mentionedPlayer.id);
            if (chosen?.r.confidence === 'weak') {
                qa.contextWeak = true;
                console.info(`[tenant-chat] weak name match: tenant=${tenant.id} player=${mentionedPlayer.id}`);
            }
        }
        // Capitalized tokens that aren't roster vocabulary ⇒ unknown proper noun.
        const unknownTokens = unknownNameTokens(trimmedMsg);

        if (mentionedPlayer) {
            const mp = mentionedPlayer;
            const tend = mp.eje_secundario ? tendLabels[mp.eje_secundario] ?? '' : '';
            const mentionedPlaceholder = placeholderForId(mp.id);
            // Re-fetch ai_sections on-demand for the child's CURRENT profile
            // (tenant-scoped: defense in depth, R12). mp.id is the CHILD id, so this
            // reads the same current_perfilamiento row that produced the player list.
            const { data: reportRow } = await sb
                .from('current_perfilamiento')
                .select('ai_sections')
                .eq('id', mp.id)
                .eq('tenant_id', tenant.id)
                .is('deleted_at', null)
                .maybeSingle();
            const ai = reportRow?.ai_sections;
            let aiContext = '';
            if (ai && typeof ai === 'object') {
                // Tolerant extraction: a malformed field is skipped, never thrown (E12).
                const a = ai as Record<string, unknown>;
                const parts: string[] = [];
                const pushStr = (label: string, v: unknown, n: number) => {
                    if (typeof v === 'string' && v.trim()) parts.push(`${label}: ${v.trim().slice(0, n)}`);
                };
                const pushArr = (label: string, v: unknown) => {
                    if (Array.isArray(v)) {
                        const items = v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
                        if (items.length) parts.push(`${label}: ${items.join(', ')}`);
                    }
                };
                pushStr('Resumen', a.resumenPerfil, 200);
                pushStr('Combustible', a.combustible, 150);
                pushStr('Lenguaje de intención', a.corazon, 150);
                pushStr('Gestión del desajuste', a.reseteo, 150);
                pushArr('Palabras puente', a.palabrasPuente);
                pushArr('Palabras a evitar', a.palabrasRuido);
                aiContext = parts.length ? '\n' + parts.join('\n') : '';
            }
            // Scrub THIS player's own name to THEIR placeholder first (E5), then
            // anonymize any other names that appear in the narrative text.
            const ownScrubbed = anonymizeAs(aiContext, mp.child_name, mentionedPlaceholder);
            // Derive canonical archetype/motor from eje+motor — never the frozen
            // archetype_label, which is stale for pre-2026-06-02 sessions and
            // contradicts the system-prompt knowledge base (E10).
            const lang = safeLang(promptLang);
            const archetype = canonicalArchetype(mp.eje, mp.motor, lang);
            const motorDisp = canonicalMotorDisplay(mp.eje, mp.motor, lang);
            const axisDisp = AXIS_DISPLAY[lang][mp.eje] ?? mp.eje;
            const secDisp = mp.eje_secundario ? (AXIS_DISPLAY[lang][mp.eje_secundario] ?? mp.eje_secundario) : 'N/A';
            extraContext += `\n\nJUGADOR MENCIONADO:\n- ${mentionedPlaceholder} (${mp.child_age} años, ${sanitize(mp.sport ?? '', 40)})\n- Arquetipo: ${archetype}, Eje: ${axisDisp}, Motor: ${motorDisp}, Secundario: ${secDisp} (${tend})${anonymize(ownScrubbed)}`;
        } else if (mentionedPlayers.length >= 2) {
            // Ambiguous: the message matches several players (e.g. two "Juan").
            const names = mentionedPlayers.map(p => placeholderForId(p.id)).join(', ');
            extraContext += `\n\nVARIOS JUGADORES MENCIONADOS: el mensaje coincide con más de un jugador (${names}). Si la pregunta necesita datos de uno solo, pregúntale al entrenador a cuál se refiere antes de dar datos específicos.`;
        } else if (unknownTokens.length > 0) {
            qa.contextMiss = true;
            extraContext += `\n\nNOTA: El nombre mencionado no coincide con ningún jugador registrado. NO inventes datos sobre ese jugador. Jugadores disponibles: ${playerListForPrompt || 'ninguno'}.`;
        }

        // ── Group mention detection + balance injection ────────────────────
        // Classification:
        //   - STRONG match: min 3 chars + word-boundary AND either the name
        //     contains a digit/hyphen (distinctive) OR a trigger word like
        //     "grupo" / "equipo" / "plantel" appears within ~30 chars of the
        //     name (proximity check, not global). This avoids false positives
        //     like "el cielo está azul" matching a group called "Azul".
        //   - WEAK match: word-boundary hit only. These are not injected but
        //     the team summary lists all groups, so Gemini can ask for
        //     clarification if the context suggests a real reference.
        // Outcomes:
        //   - 1 strong match → full injection (composition + profile text).
        //   - 2+ strong matches → compact list of all + instruction to Gemini
        //     to ask the coach which one before giving specific data.
        //   - 0 strong matches → no injection; Gemini sees the global list.
        const playersById = new Map<string, typeof allPlayers[number]>();
        for (const p of allPlayers) playersById.set(p.id, p);
        // Group matching runs on an accent-normalized copy of the message with
        // the same Unicode boundary as the player matcher, so "Águilas"/"Ñandú"
        // are detected consistently (E7).
        const normGroupMsg = normalizeName(trimmedMsg);
        const isDistinctiveGroupName = (n: string) => /\d/.test(n) || /-/.test(n);
        const TRIGGER_WORDS = 'grupo|grupos|equipo|equipos|categoria|categorias|plantel|cuadro';
        const groupNameInMsg = (name: string): boolean => wordBoundaryTest(normGroupMsg, normalizeName(name), true);
        const hasProximityTrigger = (name: string): boolean => {
            const escaped = escapeRegexStr(normalizeName(name));
            // Trigger word within ~30 non-period chars before OR after the name.
            const before = new RegExp(`(?<![\\p{L}\\p{N}])(?:${TRIGGER_WORDS})(?![\\p{L}\\p{N}])[^.]{0,30}?(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, 'u');
            const after = new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])[^.]{0,30}?(?<![\\p{L}\\p{N}])(?:${TRIGGER_WORDS})(?![\\p{L}\\p{N}])`, 'u');
            return before.test(normGroupMsg) || after.test(normGroupMsg);
        };
        // Planteles and chem groups share one matching pool; the kind label
        // lets the model tell them apart in the injected context.
        type MatchableGroup = GroupRowWithMembers & { kind: 'plantel' | 'quimica' };
        const kindLabel = (g: MatchableGroup) => g.kind === 'quimica' ? 'grupo de química del usuario' : 'plantel';
        const matchableGroups: MatchableGroup[] = [
            ...groups.map(g => ({ ...g, kind: 'plantel' as const })),
            ...chemGroups.map(g => ({ ...g, kind: 'quimica' as const })),
        ];
        const strongGroupMatches: MatchableGroup[] = [];
        const weakGroupMatches: MatchableGroup[] = [];
        for (const g of matchableGroups) {
            const n = g.name?.trim();
            if (!n || n.length < 3) continue;
            if (!groupNameInMsg(n)) continue;
            if (isDistinctiveGroupName(n) || hasProximityTrigger(n)) {
                strongGroupMatches.push(g);
            } else {
                weakGroupMatches.push(g);
            }
        }
        const buildGroupStats = (g: GroupRowWithMembers) => {
            const memberIds = (g.group_members ?? []).map(m => m.child_id);
            const groupMembers = memberIds
                .map(id => playersById.get(id))
                .filter((p): p is typeof allPlayers[number] => !!p);
            if (groupMembers.length === 0) return null;
            const axisDist = computeAxisDistribution(groupMembers);
            const motorDist = computeMotorDistribution(groupMembers);
            const groupTypes = detectGroupTypes(axisDist);
            const sortedAxes = Object.entries(axisDist).sort((a, b) => b[1] - a[1]);
            return {
                count: groupMembers.length,
                axisDist,
                motorDist,
                groupTypes,
                dominantAxis: sortedAxes[0]?.[0] ?? null,
            };
        };
        let groupDominantAxis: string | null = null;
        if (strongGroupMatches.length === 1) {
            const mentionedGroup = strongGroupMatches[0];
            const stats = buildGroupStats(mentionedGroup);
            if (stats) {
                const primaryType = stats.groupTypes[0];
                const typeText = GROUP_TYPE_TEXTS[primaryType];
                groupDominantAxis = stats.dominantAxis;
                const distText = `D ${stats.axisDist.D}% · I ${stats.axisDist.I}% · S ${stats.axisDist.S}% · C ${stats.axisDist.C}%`;
                const motorText = `Rápido ${stats.motorDist.Rápido}% · Medio ${stats.motorDist.Medio}% · Lento ${stats.motorDist.Lento}%`;
                extraContext += `\n\nGRUPO MENCIONADO: "${promptGroupName(mentionedGroup.name)}" (${kindLabel(mentionedGroup)}, ${stats.count} jugadores)\n- Distribución por eje: ${distText}\n- Motores: ${motorText}\n- Perfil grupal: ${primaryType}${stats.groupTypes.length > 1 ? ` (+${stats.groupTypes.slice(1).join(', ')})` : ''}\n- ${typeText.identity}\n- Herramientas: ${typeText.tools.join(' ')}`;
            }
        } else if (strongGroupMatches.length >= 2) {
            // Multiple strong matches → give Gemini compact stats for each
            // and tell it to ask the coach if the intent is unclear.
            const lines: string[] = [];
            for (const g of strongGroupMatches) {
                const stats = buildGroupStats(g);
                if (!stats) {
                    lines.push(`- "${promptGroupName(g.name)}" (${kindLabel(g)}): sin jugadores asignados todavía`);
                    continue;
                }
                const distText = `D ${stats.axisDist.D}% · I ${stats.axisDist.I}% · S ${stats.axisDist.S}% · C ${stats.axisDist.C}%`;
                lines.push(`- "${promptGroupName(g.name)}" (${kindLabel(g)}, ${stats.count} jug., perfil ${stats.groupTypes[0]}, ${distText})`);
            }
            // The kind label goes INSIDE the example question: a plantel and a chem
            // group can share the same name ("Sub 15" twice reads as a broken bot).
            extraContext += `\n\nGRUPOS MENCIONADOS (varios en el mismo mensaje):\n${lines.join('\n')}\n\nCLARIFICACIÓN: el entrenador mencionó más de un grupo. Si su pregunta requiere datos específicos de un solo grupo, pregúntale explícitamente a cuál se refiere antes de responder (ej: "¿Te refieres a ${promptGroupName(strongGroupMatches[0].name)} (${kindLabel(strongGroupMatches[0])}) o a ${promptGroupName(strongGroupMatches[1].name)} (${kindLabel(strongGroupMatches[1])})?"). Si el mensaje deja claro que quiere comparar o hablar de todos, responde directamente usando los datos de arriba.`;
        } else if (weakGroupMatches.length >= 2) {
            // 2+ weak matches: the message contains multiple group names but
            // none with a proximity trigger. The coincidence of having two
            // different group names in the same message suggests real intent,
            // but we can't be sure. Tell Gemini to confirm before answering
            // with specific group data.
            const names = weakGroupMatches.map(g => `"${promptGroupName(g.name)}" (${kindLabel(g)})`).join(', ');
            extraContext += `\n\nPOSIBLE REFERENCIA A GRUPOS: el mensaje contiene los nombres de varios grupos del tenant (${names}) pero sin contexto claro ("grupo", "equipo", etc.). Puede ser una mención real o una coincidencia de palabras. Antes de dar una respuesta con datos específicos de alguno de ellos, pregúntale al entrenador si se está refiriendo a esos grupos y a cuál (ej: "¿Estás hablando del grupo ${promptGroupName(weakGroupMatches[0].name)}?"). Si la conversación sugiere que no, ignora esos nombres y responde normalmente.`;
        }

        // ── Situation card injection ────────────────────────────────────────
        // Detect a situation by keyword match. When matched, inject the curated
        // card content from SITUATION_CARDS_DATA instead of just a [Situación: "x"] tag.
        // Priority for which eje to use: mentioned player → mentioned group dominant axis → all 4.
        // Pick the situation with the STRONGEST keyword signal (most boundary
        // matches), not just the first declared, and use word boundaries instead
        // of raw substring to avoid noise like "pierde" matching inside a word (E8).
        const normSitMsg = normalizeName(trimmedMsg);
        let bestSituation: { id: string; hits: number } | null = null;
        for (const [sitId, keywords] of Object.entries(SITUATION_KEYWORDS)) {
            let hits = 0;
            for (const k of keywords) {
                if (wordBoundaryTest(normSitMsg, normalizeName(k), true)) hits++;
            }
            if (hits > 0 && (!bestSituation || hits > bestSituation.hits)) bestSituation = { id: sitId, hits };
        }
        if (bestSituation) {
            const sitId = bestSituation.id;
            const cards = SITUATION_CARDS_DATA[sitId];
            // On a thread's first turn the card is a hypothesis map for asking
            // better questions, not a recipe to recite (consultive mode).
            const cardUse = isFirstTurn
                ? '; si aún falta contexto, usa esta guía como mapa de hipótesis para elegir tus preguntas y entrega sus herramientas cuando el contexto esté confirmado'
                : '';
            if (!cards) {
                extraContext += `\n\n[Situación: "${sitId}"]`;
            } else {
                const targetEje = mentionedPlayer?.eje ?? groupDominantAxis ?? null;
                if (targetEje && cards[targetEje]) {
                    extraContext += `\n\nGUÍA PARA ESTA SITUACIÓN (${sitId}, perfil ${targetEje}${cardUse}):\n${cards[targetEje]}`;
                } else {
                    // No player/group context → give all 4 perspectives compactly.
                    const all = Object.entries(cards).map(([eje, text]) => `- ${eje}: ${text}`).join('\n');
                    extraContext += `\n\nGUÍA PARA ESTA SITUACIÓN (${sitId}${cardUse}):\n${all}`;
                }
            }
        }

        // ── Consultive-mode nudge (first turn of a thread) ───────────────────
        // When a thread OPENS with a situation about a child or group, remind the
        // model to check for minimum context and explore before prescribing. The
        // sufficiency judgment stays with the model; this injection just makes the
        // prompt's MODO CONSULTIVO reliable on Flash at the moment it matters.
        if (isFirstTurn && (mentionedPlayer || mentionedPlayers.length >= 2 || bestSituation || strongGroupMatches.length > 0)) {
            extraContext += `\n\nPRIMERA CONSULTA DE ESTE HILO SOBRE UNA SITUACIÓN: antes de recomendar, evalúa si el entrenador ya dio el contexto mínimo (desde cuándo pasa, en qué momentos, qué señales concretas observa). Si falta, aplica el MODO CONSULTIVO: valida brevemente, ofrece UNA lectura tentativa basada en el perfil real de arriba (si lo tienes) y haz 2 o 3 preguntas concretas para entender mejor antes de dar la guía completa. Si el contexto ya es suficiente o la pregunta es específica (no describe un problema abierto), responde directo.`;
        }

        // ── OPT 1 + 3: Build conversation history (8 max, summarize older) ──
        // allHistory was fetched above (with the sessions/groups batch) so the
        // consultive-mode injections could see whether this is the first turn.
        let historyMessages: { role: 'user' | 'assistant'; content: string }[];

        if (allHistory.length > 8) {
            // OPT 3: Summarize older messages into a compact recap
            const older = allHistory.slice(0, allHistory.length - 8);
            const recent = allHistory.slice(allHistory.length - 8);
            const olderTopics = older
                .filter(m => m.role === 'user')
                .map(m => anonymize(m.content).slice(0, 60)) // anonymize BEFORE truncating, else a name split at 60 chars leaks
                .join('; ');
            const summaryMsg = { role: 'user' as const, content: `[Resumen de la conversación anterior: el usuario preguntó sobre: ${olderTopics}]` };
            historyMessages = [summaryMsg, ...recent];
        } else {
            historyMessages = allHistory;
        }

        // ── Privacy: append anonymization instruction to the system prompt ──
        // This tells Gemini that player names have been replaced with {{P1}},
        // {{P2}}, ... placeholders. The model must use the same placeholders
        // in its response. We rehydrate them to real names after the call.
        const privacyInstruction = allPlayers.length > 0
            ? `\n\nPRIVACY NOTICE (critical): Player names in this conversation have been replaced with placeholders like {{P1}}, {{P2}}, etc. In your response, refer to players using the same placeholders — never invent a name. Our server will replace the placeholders with the real names before displaying your response, so the output will read naturally.`
            : '';

        // No greetings: don't open with "Hola Entrenador" or by name; answer directly.
        const noGreeting: Record<string, string> = {
            es: `\n\nNo abras con saludos (ni "Hola Entrenador" ni por nombre). Responde directo a la consulta.`,
            en: `\n\nDo not open with greetings (neither "Hi Coach" nor by name). Answer the question directly.`,
            pt: `\n\nNão abra com saudações (nem "Olá Treinador" nem pelo nome). Responda diretamente à consulta.`,
        };
        const coachInstruction = noGreeting[safeLang(promptLang)];

        // Machine-readable mode tag so ai_events can record whether the model
        // explored or answered directly; stripped before display/storage.
        const modeTagInstruction = `\n\nETIQUETA DE MODO (interna, obligatoria): comienza tu respuesta con exactamente una etiqueta en su propia línea: [[modo:consultivo]] si en este turno principalmente indagas (haces preguntas antes de dar la guía completa) o [[modo:directo]] si principalmente respondes. La etiqueta se elimina antes de mostrar la respuesta; nunca la menciones ni la expliques.`;

        const systemPrompt = (SYSTEM_PROMPTS[promptLang] ?? SYSTEM_PROMPTS.es)
            + coachInstruction
            + privacyInstruction
            + modeTagInstruction
            + teamSummary
            + extraContext;

        // Anonymize conversation history and the current user message so
        // no real player names are sent to Gemini.
        const anonymizedHistory = historyMessages.map(m => ({
            role: m.role,
            content: anonymize(m.content),
        }));
        const anonymizedUserMsg = anonymize(trimmedMsg);

        const aiMessages = [
            { role: 'system' as const, content: systemPrompt },
            ...anonymizedHistory,
            { role: 'user' as const, content: anonymizedUserMsg },
        ];

        // ── Call AI provider (Gemini → retry → OpenAI fallback) ─────────
        const aiModel = tenantPlan?.plan === 'enterprise' ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
        let aiResult: AIResponse;
        try {
            aiResult = await callAI(aiMessages, { temperature: 0.4, maxTokens: 2000, model: aiModel });
        } catch (aiErr) {
            // Both providers failed. The user message is already saved, so the
            // thread keeps the question; return a friendly degraded message (R3).
            // Nothing is saved on failure, so a trial query isn't consumed and
            // the thread has no dangling question; the frontend keeps the text
            // for retry (E11 via the frontend path).
            console.error('[tenant-chat] AI providers unavailable:', aiErr instanceof Error ? aiErr.message : aiErr);
            const DEGRADED: Record<string, string> = {
                es: 'El asistente está teniendo problemas para responder en este momento. Tu mensaje se guardó; vuelve a intentarlo en unos segundos.',
                en: 'The assistant is having trouble responding right now. Your message was saved; please try again in a few seconds.',
                pt: 'O assistente está com dificuldades para responder agora. Sua mensagem foi salva; tente novamente em alguns segundos.',
            };
            return res.status(503).json({ thread_id: threadId, error: 'ai_unavailable', message: DEGRADED[safeLang(promptLang)] });
        }
        // Accumulate tokens across all AI calls in this request (incl. retry) so
        // cost/usage isn't under-counted (E13).
        let totalInputTokens = aiResult.inputTokens;
        let totalOutputTokens = aiResult.outputTokens;
        let totalCachedTokens = aiResult.cachedInputTokens;
        let servedProvider = aiResult.provider; // tracks which provider produced the SERVED content (may change on retry)
        let servedModel = aiResult.model;
        // Extract + strip the [[modo:...]] telemetry tag before anything else
        // sees the text. servedRaw keeps the pre-rehydration form (placeholders
        // intact) to detect which players the reply actually discusses.
        const firstTag = extractModeTag(aiResult.content);
        const servedMode = firstTag.mode;
        let servedRaw = firstTag.text;
        // Rehydrate placeholders with real names for display + storage.
        let assistantContent = rehydrate(servedRaw);

        // ── Post-processing: scan for prohibited words ────────────────────
        // Word-boundary scan against the module-level PROHIBITED_WORDS list
        // (kept a strict superset of the QA scorer's list; see the unit test).
        const foundProhibited = scanProhibited(assistantContent);
        // Every roster player the reply references via their {{Pn}} placeholder
        // is "discussed": the deterministic-language and ground-truth checks
        // cover each of them, not only the explicitly mentioned player (a
        // multi-player answer can assert a fixed identity about any of them).
        const discussedPlayers = allPlayers.filter(p => servedRaw.includes(placeholderForId(p.id)));
        if (mentionedPlayer && !discussedPlayers.some(p => p.id === mentionedPlayer.id)) discussedPlayers.push(mentionedPlayer);
        const detPatterns = buildDeterministicPatterns(discussedPlayers.map(p => p.child_name));
        const foundDeterministic = hasDeterministicLanguage(assistantContent, detPatterns);

        if (foundProhibited.length > 0 || foundDeterministic) {
            qa.prohibitedHit = qa.prohibitedHit || foundProhibited.length > 0 || foundDeterministic;
            if (foundProhibited.length > 0) console.warn('[tenant-chat] Prohibited words found in response:', foundProhibited.join(', '));
            if (foundDeterministic) console.warn('[tenant-chat] Deterministic language found in response');
            // Slim rewrite call: fixing the wording doesn't need the roster or
            // conversation context, so we send only a rewrite instruction plus
            // the flagged (still-anonymized) text — ~80% less input than
            // replaying the whole conversation. Localized so an en/pt thread
            // never gets its reply flipped into Spanish. Output cap matches the
            // original call so a long clean rewrite is never truncated (was 800).
            const rl = safeLang(promptLang);
            const REWRITE_SYS: Record<string, string> = {
                es: 'Eres un editor de estilo de ArgoMethod®. Reescribes textos para entrenadores manteniendo el significado, el idioma y el formato, con lenguaje probabilístico ("tiende a", "suele", "podría"), siempre desde la fortaleza, sin términos clínicos ni etiquetas fijas sobre el niño. Los marcadores {{P1}}, {{P2}}... son nombres de jugadores: consérvalos exactamente como están. Responde SOLO con el texto reescrito.',
                en: 'You are a style editor for ArgoMethod®. Rewrite texts for coaches keeping the meaning, language and format, using probabilistic language ("tends to", "often", "might"), always from strength, with no clinical terms or fixed labels about the child. Markers {{P1}}, {{P2}}... are player names: keep them exactly as they are. Reply ONLY with the rewritten text.',
                pt: 'Você é um editor de estilo do ArgoMethod®. Reescreva textos para treinadores mantendo o significado, o idioma e o formato, com linguagem probabilística ("tende a", "costuma", "poderia"), sempre pela força, sem termos clínicos nem rótulos fixos sobre a criança. Os marcadores {{P1}}, {{P2}}... são nomes de jogadores: preserve-os exatamente. Responda APENAS com o texto reescrito.',
            };
            const REWRITE_ASK: Record<string, string> = {
                es: `Reescribe el siguiente texto${foundProhibited.length > 0 ? ` eliminando estas palabras: ${foundProhibited.join(', ')}` : ''}${foundDeterministic ? `${foundProhibited.length > 0 ? ' y' : ''} quitando las afirmaciones deterministas sobre el niño ("es un...", "siempre", "nunca", "será", "destinado a")` : ''}. Mantén todo lo demás igual.`,
                en: `Rewrite the following text${foundProhibited.length > 0 ? ` removing these words: ${foundProhibited.join(', ')}` : ''}${foundDeterministic ? `${foundProhibited.length > 0 ? ' and' : ''} removing deterministic claims about the child ("is a...", "always", "never", "will be", "destined to")` : ''}. Keep everything else the same.`,
                pt: `Reescreva o texto a seguir${foundProhibited.length > 0 ? ` eliminando estas palavras: ${foundProhibited.join(', ')}` : ''}${foundDeterministic ? `${foundProhibited.length > 0 ? ' e' : ''} removendo as afirmações deterministas sobre a criança ("é um...", "sempre", "nunca", "será", "destinado a")` : ''}. Mantenha todo o resto igual.`,
            };
            const retryMessages: AIMessage[] = [
                { role: 'system', content: REWRITE_SYS[rl] },
                { role: 'user', content: `${REWRITE_ASK[rl]}\n\n${servedRaw}` },
            ];
            let cleaned: string | null = null;
            try {
                const retryResult = await callAI(retryMessages, { temperature: 0.3, maxTokens: 2000, model: aiModel });
                totalInputTokens += retryResult.inputTokens;
                totalOutputTokens += retryResult.outputTokens;
                totalCachedTokens += retryResult.cachedInputTokens;
                const candidateTag = extractModeTag(retryResult.content);
                const candidate = rehydrate(candidateTag.text);
                // Re-scan the retried text; only accept it if it's actually clean (R5):
                // free of BOTH prohibited words and deterministic language.
                if (candidate
                    && scanProhibited(candidate).length === 0
                    && !hasDeterministicLanguage(candidate, detPatterns)) {
                    cleaned = candidate;
                    servedRaw = candidateTag.text;
                    servedProvider = retryResult.provider;
                    servedModel = retryResult.model;
                }
            } catch (retryErr) {
                console.warn('[tenant-chat] Prohibited-words retry failed:', retryErr instanceof Error ? retryErr.message : retryErr);
            }
            if (cleaned) {
                assistantContent = cleaned;
            } else {
                // Retry failed or still contained prohibited/deterministic language.
                // Never serve clinical/negative/fixed-identity copy about a child —
                // use a safe neutral message (R6).
                qa.prohibitedAfterRetry = true;
                console.warn('[tenant-chat] Prohibited/deterministic language persisted after retry; serving safe fallback');
                const SAFE_FALLBACK: Record<string, string> = {
                    es: 'Prefiero reformular esto con más cuidado. ¿Puedes contarme un poco más sobre la situación para darte una respuesta enfocada en cómo acompañar mejor al niño?',
                    en: 'Let me rephrase this more carefully. Could you tell me a bit more about the situation so I can focus on how to best support the child?',
                    pt: 'Prefiro reformular isso com mais cuidado. Você pode me contar um pouco mais sobre a situação para eu focar em como acompanhar melhor a criança?',
                };
                assistantContent = SAFE_FALLBACK[safeLang(promptLang)];
                servedRaw = ''; // fallback references no players; keep ground truth consistent
            }
        }

        // ── Ground truth validation (axis + forbidden old labels) ──────────
        // Verify the response doesn't attribute the wrong axis to a named player,
        // and never surfaces an old forbidden archetype label (E4 / naming
        // forward-only). Motor-level validation lives in the daily canary, where
        // controlled fixtures avoid the false positives that motor words
        // ("dinámico", "rítmico") would cause in free-form advice.
        {
            // Runs for EVERY player the served reply references via their {{Pn}}
            // placeholder (was: only the single explicitly mentioned player).
            const finalDiscussed = allPlayers.filter(p => servedRaw.includes(placeholderForId(p.id)));
            if (mentionedPlayer && !finalDiscussed.some(p => p.id === mentionedPlayer.id)) finalDiscussed.push(mentionedPlayer);
            const wrongAxis: Record<string, string[]> = {
                D: ['conector', 'connector', 'sostén', 'sostenedor', 'sustainer', 'estratega', 'strategist'],
                I: ['impulsor', 'driver', 'sostén', 'sostenedor', 'sustainer', 'estratega', 'strategist'],
                S: ['impulsor', 'driver', 'conector', 'connector', 'estratega', 'strategist'],
                C: ['impulsor', 'driver', 'conector', 'connector', 'sostén', 'sostenedor', 'sustainer'],
            };
            // A player's SECONDARY axis (brújula) is legitimate to mention, so don't
            // flag it as a wrong-axis attribution (e.g. an S player with a D compass
            // discussed as "su brújula de Impulsor").
            const axisWords: Record<string, string[]> = {
                D: ['impulsor', 'driver'], I: ['conector', 'connector'],
                S: ['sostén', 'sostenedor', 'sustainer'], C: ['estratega', 'strategist'],
            };
            const gtLang = safeLang(promptLang);
            // The note IS shown to the coach (localized), so the real name is fine here.
            const NOTE: Record<string, (n: string, a: string, e: string, m: string) => string> = {
                es: (n, a, e, m) => `_Nota: el perfil registrado de ${n} corresponde a un patrón ${a} (eje ${e}, motor ${m}). Las recomendaciones se basan en ese perfil._`,
                en: (n, a, e, m) => `_Note: ${n}'s recorded profile corresponds to a ${a} pattern (axis ${e}, engine ${m}). Recommendations are based on that profile._`,
                pt: (n, a, e, m) => `_Nota: o perfil registrado de ${n} corresponde a um padrão ${a} (eixo ${e}, motor ${m}). As recomendações se baseiam nesse perfil._`,
            };
            const playerNote = (mp: typeof allPlayers[number]) =>
                NOTE[gtLang](mp.child_name, canonicalArchetype(mp.eje, mp.motor, gtLang), mp.eje, canonicalMotorDisplay(mp.eje, mp.motor, gtLang));
            const sentences = assistantContent.split(/[.!?]+/);
            const notes: string[] = [];
            for (const mp of finalDiscussed) {
                const secondaryWords = mp.eje_secundario ? (axisWords[mp.eje_secundario] ?? []) : [];
                const wrongLabels = (wrongAxis[mp.eje] ?? []).filter(w => !secondaryWords.includes(w));
                const playerNameLower = mp.child_name.toLowerCase().split(' ')[0];
                let factualError = false;
                for (const sentence of sentences) {
                    const sLower = sentence.toLowerCase();
                    if (sLower.includes(playerNameLower) && wrongLabels.some(w => sLower.includes(w))) {
                        factualError = true;
                        break;
                    }
                }
                if (factualError) {
                    qa.groundtruthViolation = true;
                    // Log the placeholder, never the child's real name (R2 — no PII in logs).
                    console.warn(`[tenant-chat] Ground truth violation for ${placeholderForId(mp.id)} (eje=${mp.eje}, motor=${mp.motor})`);
                    notes.push(playerNote(mp));
                }
            }
            const forbiddenLabel = FORBIDDEN_OLD_LABELS.find(l => assistantContent.toLowerCase().includes(l));
            if (forbiddenLabel) {
                qa.labelViolation = true;
                console.warn(`[tenant-chat] Forbidden old label in response: "${forbiddenLabel}"`);
                // Anchor the correction note to the single discussed player when
                // unambiguous (mirrors the previous single-player behavior).
                if (notes.length === 0 && finalDiscussed.length === 1) notes.push(playerNote(finalDiscussed[0]));
            }
            if (notes.length > 0) assistantContent += `\n\n${notes.join('\n')}`;
        }

        // Cost uses the served model's rates; when the retry switched models the
        // blend is approximated by the served one (retry input is tiny post-slim).
        const costUsd = getCostUsd(servedModel, totalInputTokens, totalOutputTokens, totalCachedTokens);

        // ── Save both turns + telemetry in one parallel batch (only on success,
        // so a failed AI call doesn't consume a trial query and leaves no
        // dangling question in the thread). ai_events stays best-effort. ──
        await Promise.all([
            sb.from('chat_messages').insert([
                { tenant_id: tenant.id, member_id: callerMemberId, thread_id: threadId, role: 'user', content: trimmedMsg, tokens_in: 0, tokens_out: 0, plantel_id: teamFilter },
                { tenant_id: tenant.id, member_id: callerMemberId, thread_id: threadId, role: 'assistant', content: assistantContent, tokens_in: totalInputTokens, tokens_out: totalOutputTokens, plantel_id: teamFilter },
            ]).then(({ error }) => {
                // Losing a turn breaks thread history + the trial count: log loudly.
                if (error) console.error('[tenant-chat] chat_messages insert failed:', error.message);
            }),
            // ── Best-effort quality telemetry (Wave E) — never breaks the chat ──
            // Stores only non-PII signals (placeholders/flags), never the child name.
            // If the ai_events table isn't migrated yet, the insert simply no-ops.
            (async () => {
                try {
                    await sb.from('ai_events').insert({
                        tenant_id: tenant.id,
                        thread_id: threadId,
                        source: 'tenant-chat',
                        provider: servedProvider,
                        model: servedModel,
                        lang: promptLang,
                        tokens_in: totalInputTokens,
                        tokens_out: totalOutputTokens,
                        tokens_cached: totalCachedTokens,
                        cost_usd: costUsd,
                        latency_ms: Date.now() - t0,
                        mentioned_player: !!mentionedPlayer,
                        groundtruth_violation: qa.groundtruthViolation,
                        label_violation: qa.labelViolation,
                        prohibited_hit: qa.prohibitedHit,
                        prohibited_after_retry: qa.prohibitedAfterRetry,
                        context_miss: qa.contextMiss,
                        fair_use_exceeded: fairUseExceeded,
                        group_ids: coachGroupIds, // per-plantel attribution for coaches; null for owner/admin
                        mode: servedMode, // consultivo | directo | null (model skipped the tag)
                        situation_matched: bestSituation?.id ?? null, // measures the keyword matcher's hit rate (#21a)
                    });
                } catch (telemetryErr) {
                    console.warn('[tenant-chat] ai_events telemetry insert failed (non-fatal):', telemetryErr instanceof Error ? telemetryErr.message : telemetryErr);
                }
            })(),
        ]);

        return res.status(200).json({
            thread_id: threadId,
            message: { role: 'assistant', content: assistantContent },
            usage: {
                tokensIn: totalInputTokens,
                tokensOut: totalOutputTokens,
                costUsd,
            },
            fair_use_exceeded: fairUseExceeded,
        });

    } catch (err) {
        console.error('[tenant-chat] Unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
