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
interface AIResponse { content: string; inputTokens: number; outputTokens: number; totalTokens: number; provider: 'gemini' | 'openai'; }

function getCostUsd(r: AIResponse): number {
    const rate = 0.15 / 1_000_000;
    return r.inputTokens * rate + r.outputTokens * (0.60 / 1_000_000);
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
    return { content, inputTokens: usage.promptTokenCount ?? 0, outputTokens: usage.candidatesTokenCount ?? 0, totalTokens: usage.totalTokenCount ?? 0, provider: 'gemini' };
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
        totalTokens: data.usage?.total_tokens ?? 0,
        provider: 'openai',
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

/** First names that are also everyday es/pt words; these require a capitalized
 *  proper-noun form so "hace mucho sol" doesn't trigger a player named "Sol". */
export const COMMON_WORD_NAMES = new Set([
    'sol', 'luna', 'leon', 'rosa', 'mar', 'cruz', 'pilar', 'angel', 'luz', 'paz',
    'cielo', 'flor', 'vida', 'alba', 'nieve', 'estrella', 'azul', 'blanca', 'gloria',
    'victoria', 'esperanza', 'consuelo', 'soledad', 'rocio', 'perla', 'salvador',
    'jesus', 'milagros', 'dolores', 'remedios', 'abril', 'mayo', 'olivia', 'aurora',
]);

/**
 * Whether `name` (a player's first or full name, original casing) is mentioned
 * in `message`. Accent-insensitive. Single-word names that collide with common
 * words require the capitalized (proper-noun) form to avoid false positives.
 */
export function nameIsMentioned(name: string, message: string): boolean {
    if (!name || !message) return false;
    const trimmed = name.trim();
    const norm = normalizeName(trimmed);
    const isSingle = !/\s/.test(trimmed);
    if (isSingle && COMMON_WORD_NAMES.has(norm)) {
        // Require the capitalized stored form in the original (un-normalized) text.
        return wordBoundaryTest(message, trimmed, true);
    }
    return wordBoundaryTest(normalizeName(message), norm, true);
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

/**
 * Chat DISC endpoint.
 * GET ?action=threads              → list threads
 * GET ?action=messages&thread_id=X → messages for a thread
 * POST { action: "send", thread_id?, message, lang? } → send message, get AI response
 */

// ─── System prompts by language ─────────────────────────────────────────────

const SYSTEM_PROMPTS: Record<string, string> = {
    es: `Eres el asistente DISC de Argo Method. Tu rol es ayudar al entrenador a entender y aplicar el perfilamiento conductual DISC en el contexto deportivo juvenil.

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
Respuesta correcta: "No hay un perfil 'mejor' para capitán. Un Impulsor tiende a liderar desde la acción, un Conector desde el vínculo, un Sostén desde la estabilidad emocional, y un Estratega desde la lectura táctica. Depende de qué tipo de liderazgo necesita tu equipo en este momento."`,

    en: `You are the DISC assistant for Argo Method. Your role is to help coaches understand and apply DISC behavioral profiling in youth sports.

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
Correct response: "There's no 'best' profile for captain. A Driver tends to lead through action, a Connector through bonds, a Sustainer through emotional stability, and a Strategist through tactical reading. It depends on what type of leadership your team needs right now."`,

    pt: `Você é o assistente DISC do Argo Method. Seu papel é ajudar treinadores a entender e aplicar o perfilamento comportamental DISC no esporte juvenil.

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
Resposta correta: "Não existe um perfil 'melhor' para capitão. Depende do tipo de liderança que sua equipe precisa neste momento."`,
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
        S: 'El Sostén no explota con la derrota, la guarda en silencio y la arrastra varios días. Valida sin forzar (si necesitas hablar, aquí estoy). No le pidas que procese en el momento. En los entrenamientos siguientes observa si está más callado: un "¿cómo estás?" sin presión abre la puerta.',
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
        D: 'El Impulsor quiere dejar cuando siente que no puede ganar, crecer o liderar. Pregúntale qué cambiaría: "si pudieras cambiar algo del entrenamiento, ¿qué sería?". Escucha la respuesta. Propón un objetivo concreto y medible a 3 semanas. Si no, no lo presiones: a veces necesita extrañar el desafío para volver con ganas.',
        I: 'El Conector quiere dejar cuando se rompieron los vínculos. Explora: "¿hay algo del grupo que te hace ruido?". Muchas veces la razón no es el deporte, es una relación social que se rompió. Si es posible, reconéctalo con un compañero cercano o cámbialo a un grupo con más afinidad. Si no, habla con el adulto responsable.',
        S: 'El Sostén quiere dejar cuando algo cambió demasiado del contexto. Identifica qué cambió: "¿hay algo que antes te gustaba y ahora no?". El Sostén puede señalar exactamente el punto de quiebre. Si puedes, restaura algo del contexto anterior. Si no, dale tiempo sin pedirle decisión definitiva: "no hace falta que decidas ahora".',
        C: 'El Estratega quiere dejar cuando no aprende nada nuevo o el entrenamiento no tiene sentido. Muéstrale el progreso: "mira dónde estabas hace 3 meses y dónde estás ahora". Pregúntale qué le gustaría aprender. Si no, propón un desafío intelectual dentro del deporte (analizar video, planificar jugada).',
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
        S: 'El Sostén es el que más aguanta antes de mostrar malestar, así que si ya lo ves, viene acumulando hace rato. Mantenlo en rutina estable (el entrenamiento como refugio de normalidad). Acércate sin drama: "¿cómo estás hoy?", como parte natural de la rutina. Si no, contacta al adulto con delicadeza: rara vez pide ayuda, hay que ir a buscarla.',
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

        // Fair use: increment AI query counter and check soft cap.
        // Intentionally non-blocking (the soft cap is invisible to the user by
        // design) and fail-open: a telemetry hiccup must never block a paying
        // coach. We surface the signal to ops instead of enforcing here (R4/E14).
        const { data: fairUseData, error: fairUseErr } = await sb.rpc('increment_ai_queries', { p_tenant_id: tenant.id });
        if (fairUseErr) {
            console.error('[tenant-chat] Fair use check error (failing open):', fairUseErr.message);
        }
        const fairUseExceeded = fairUseData?.fair_use_exceeded === true;
        if (fairUseExceeded) {
            console.info(`[tenant-chat] Fair-use soft cap exceeded for tenant ${tenant.id} (non-blocking by design)`);
        }

        // Trial plan: check expiration + hard cap at 10 total user messages
        const { data: tenantPlan } = await sb.from('tenants').select('plan, trial_expires_at, roster_limit').eq('id', tenant.id).maybeSingle();
        if (tenantPlan?.plan === 'trial') {
            // Check trial expiration
            if (tenantPlan.trial_expires_at && new Date(tenantPlan.trial_expires_at) < new Date()) {
                return res.status(403).json({ error: 'trial_expired', message: 'Tu periodo de prueba ha finalizado. Actualiza tu plan para seguir usando el asistente.' });
            }
            const { count: totalMessages } = await sb
                .from('chat_messages')
                .select('id', { count: 'exact', head: true })
                .eq('tenant_id', tenant.id)
                .eq('role', 'user');
            if ((totalMessages ?? 0) >= 10) {
                return res.status(403).json({ error: 'Trial message limit reached' });
            }
        }

        // Rate limiting: max 60 messages per tenant per hour
        const oneHourAgo = new Date(Date.now() - 3600_000).toISOString();
        const { count: recentCount } = await sb
            .from('chat_messages')
            .select('id', { count: 'exact', head: true })
            .eq('tenant_id', tenant.id)
            .eq('role', 'user')
            .gt('created_at', oneHourAgo);

        if ((recentCount ?? 0) >= 60) {
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
        const [{ data: sessions }, { data: groupsData }] = await Promise.all([sessionsQuery, groupsQuery]);

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
        const groupsList = groups.length > 0
            ? `\nGrupos del equipo: ${groups.map(g => `"${g.name}" (${(g.group_members ?? []).length})`).join(', ')}.`
            : '';
        const teamSummary = allPlayers.length > 0
            ? `\n\nEQUIPO: ${allPlayers.length} jugadores. Distribución: ${axisSummary}. Motores: ${motorSummary}.\nJugadores: ${playerListForPrompt}.${groupsList}`
            : '\n\nEl entrenador todavía no tiene jugadores registrados.';

        // ── Context injection based on message content ──────────────────
        let extraContext = '';
        // Quality signals captured through the flow for best-effort telemetry (Wave E).
        const qa = { contextMiss: false, groundtruthViolation: false, labelViolation: false, prohibitedHit: false, prohibitedAfterRetry: false };

        // ── Player mention detection (accent-insensitive, homonym-safe) ─────
        // Prefer explicit full-name matches; only fall back to first names when
        // no full name was written. A first name shared by 2+ players is treated
        // as ambiguous (ask) rather than guessing the wrong child (E2/E3/E6).
        const fullNameMatches = allPlayers.filter(p => {
            const full = p.child_name.trim();
            return /\s/.test(full) && nameIsMentioned(full, trimmedMsg);
        });
        const firstNameMatches = allPlayers.filter(p => nameIsMentioned(p.child_name.trim().split(/\s+/)[0], trimmedMsg));
        const mentionedSet = fullNameMatches.length > 0 ? fullNameMatches : firstNameMatches;
        const mentionedPlayers = mentionedSet.filter((p, i, a) => a.findIndex(q => q.id === p.id) === i);
        const mentionedPlayer = mentionedPlayers.length === 1 ? mentionedPlayers[0] : null;
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
        const strongGroupMatches: GroupRowWithMembers[] = [];
        const weakGroupMatches: GroupRowWithMembers[] = [];
        for (const g of groups) {
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
                extraContext += `\n\nGRUPO MENCIONADO: "${mentionedGroup.name}" (${stats.count} jugadores)\n- Distribución por eje: ${distText}\n- Motores: ${motorText}\n- Perfil grupal: ${primaryType}${stats.groupTypes.length > 1 ? ` (+${stats.groupTypes.slice(1).join(', ')})` : ''}\n- ${typeText.identity}\n- Herramientas: ${typeText.tools.join(' ')}`;
            }
        } else if (strongGroupMatches.length >= 2) {
            // Multiple strong matches → give Gemini compact stats for each
            // and tell it to ask the coach if the intent is unclear.
            const lines: string[] = [];
            for (const g of strongGroupMatches) {
                const stats = buildGroupStats(g);
                if (!stats) {
                    lines.push(`- "${g.name}": sin jugadores asignados todavía`);
                    continue;
                }
                const distText = `D ${stats.axisDist.D}% · I ${stats.axisDist.I}% · S ${stats.axisDist.S}% · C ${stats.axisDist.C}%`;
                lines.push(`- "${g.name}" (${stats.count} jug., perfil ${stats.groupTypes[0]}, ${distText})`);
            }
            extraContext += `\n\nGRUPOS MENCIONADOS (varios en el mismo mensaje):\n${lines.join('\n')}\n\nCLARIFICACIÓN: el entrenador mencionó más de un grupo. Si su pregunta requiere datos específicos de un solo grupo, pregúntale explícitamente a cuál se refiere antes de responder (ej: "¿Te refieres a ${strongGroupMatches[0].name} o a ${strongGroupMatches[1].name}?"). Si el mensaje deja claro que quiere comparar o hablar de todos, responde directamente usando los datos de arriba.`;
        } else if (weakGroupMatches.length >= 2) {
            // 2+ weak matches: the message contains multiple group names but
            // none with a proximity trigger. The coincidence of having two
            // different group names in the same message suggests real intent,
            // but we can't be sure. Tell Gemini to confirm before answering
            // with specific group data.
            const names = weakGroupMatches.map(g => `"${g.name}"`).join(', ');
            extraContext += `\n\nPOSIBLE REFERENCIA A GRUPOS: el mensaje contiene los nombres de varios grupos del tenant (${names}) pero sin contexto claro ("grupo", "equipo", etc.). Puede ser una mención real o una coincidencia de palabras. Antes de dar una respuesta con datos específicos de alguno de ellos, pregúntale al entrenador si se está refiriendo a esos grupos y a cuál (ej: "¿Estás hablando del grupo ${weakGroupMatches[0].name}?"). Si la conversación sugiere que no, ignora esos nombres y responde normalmente.`;
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
            if (!cards) {
                extraContext += `\n\n[Situación: "${sitId}"]`;
            } else {
                const targetEje = mentionedPlayer?.eje ?? groupDominantAxis ?? null;
                if (targetEje && cards[targetEje]) {
                    extraContext += `\n\nGUÍA PARA ESTA SITUACIÓN (${sitId}, perfil ${targetEje}):\n${cards[targetEje]}`;
                } else {
                    // No player/group context → give all 4 perspectives compactly.
                    const all = Object.entries(cards).map(([eje, text]) => `- ${eje}: ${text}`).join('\n');
                    extraContext += `\n\nGUÍA PARA ESTA SITUACIÓN (${sitId}):\n${all}`;
                }
            }
        }

        // ── OPT 1 + 3: Build conversation history (8 max, summarize older) ──
        // Fetch the most RECENT messages (descending + limit) then restore
        // chronological order. ascending + limit returned the OLDEST messages,
        // so long threads silently lost all recent context (E1).
        const { data: history } = await sb
            .from('chat_messages')
            .select('role, content')
            .eq('tenant_id', tenant.id)
            .eq('thread_id', threadId)
            .in('role', ['user', 'assistant'])
            .order('created_at', { ascending: false })
            .limit(12);

        const allHistory = (history ?? [])
            .slice()
            .reverse() // back to chronological (oldest → newest)
            .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));
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

        const systemPrompt = (SYSTEM_PROMPTS[promptLang] ?? SYSTEM_PROMPTS.es)
            + coachInstruction
            + privacyInstruction
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
        let servedProvider = aiResult.provider; // tracks which provider produced the SERVED content (may change on retry)
        // Rehydrate placeholders with real names for display + storage.
        let assistantContent = rehydrate(aiResult.content);

        // ── Post-processing: scan for prohibited words ────────────────────
        // Mejora 3: expanded prohibited words (30+ terms)
        const PROHIBITED_WORDS = [
            // Clinical/diagnostic
            'déficit', 'deficit', 'trastorno', 'disorder', 'transtorno',
            'diagnóstico', 'diagnosis', 'diagnóstica', 'diagnostic',
            'patología', 'pathology', 'patologia', 'síndrome', 'syndrome',
            'tdah', 'adhd', 'autismo', 'autism', 'terapia', 'therapy',
            // Negative labeling
            'agresivo', 'aggressive', 'agressivo', 'violento', 'violent',
            'problemático', 'problematic', 'problemático',
            'débil', 'weak', 'fraco', 'incapaz', 'incapable',
            'fracaso', 'failure', 'fracasso', 'inútil', 'useless',
            'vago', 'lazy', 'preguiçoso', 'torpe', 'clumsy',
            'lento de mente', 'slow-minded', 'retrasado', 'retarded',
            // Deterministic
            'siempre será', 'will always be', 'nunca podrá', 'will never',
            'nació para', 'born to', 'está destinado', 'is destined',
        ];
        const contentLower = assistantContent.toLowerCase();
        const foundProhibited = PROHIBITED_WORDS.filter(w => contentLower.includes(w));

        if (foundProhibited.length > 0) {
            qa.prohibitedHit = true;
            console.warn('[tenant-chat] Prohibited words found in response:', foundProhibited.join(', '));
            // The retry sends the original (still-anonymized) assistant content
            // back to Gemini, not the rehydrated one. Use aiResult.content which
            // still has placeholders.
            const retryMessages = [
                ...aiMessages,
                { role: 'assistant' as const, content: aiResult.content },
                { role: 'user' as const, content: `SYSTEM: Tu respuesta anterior contenía palabras prohibidas (${foundProhibited.join(', ')}). Reformula sin usar esas palabras. Recuerda: siempre desde la fortaleza, nunca desde el déficit.` },
            ];
            let cleaned: string | null = null;
            try {
                const retryResult = await callAI(retryMessages, { temperature: 0.3, maxTokens: 800, model: aiModel });
                totalInputTokens += retryResult.inputTokens;
                totalOutputTokens += retryResult.outputTokens;
                const candidate = rehydrate(retryResult.content);
                // Re-scan the retried text; only accept it if it's actually clean (R5).
                if (candidate && !PROHIBITED_WORDS.some(w => candidate.toLowerCase().includes(w))) {
                    cleaned = candidate;
                    servedProvider = retryResult.provider;
                }
            } catch (retryErr) {
                console.warn('[tenant-chat] Prohibited-words retry failed:', retryErr instanceof Error ? retryErr.message : retryErr);
            }
            if (cleaned) {
                assistantContent = cleaned;
            } else {
                // Retry failed or still contained prohibited language. Never serve
                // clinical/negative copy about a child — use a safe neutral message (R6).
                qa.prohibitedAfterRetry = true;
                console.warn('[tenant-chat] Prohibited words persisted after retry; serving safe fallback');
                const SAFE_FALLBACK: Record<string, string> = {
                    es: 'Prefiero reformular esto con más cuidado. ¿Puedes contarme un poco más sobre la situación para darte una respuesta enfocada en cómo acompañar mejor al niño?',
                    en: 'Let me rephrase this more carefully. Could you tell me a bit more about the situation so I can focus on how to best support the child?',
                    pt: 'Prefiro reformular isso com mais cuidado. Você pode me contar um pouco mais sobre a situação para eu focar em como acompanhar melhor a criança?',
                };
                assistantContent = SAFE_FALLBACK[safeLang(promptLang)];
            }
        }

        // ── Ground truth validation (axis + forbidden old labels) ──────────
        // Verify the response doesn't attribute the wrong axis to a named player,
        // and never surfaces an old forbidden archetype label (E4 / naming
        // forward-only). Motor-level validation lives in the daily canary, where
        // controlled fixtures avoid the false positives that motor words
        // ("dinámico", "rítmico") would cause in free-form advice.
        if (mentionedPlayer) {
            const mp = mentionedPlayer;
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
            const secondaryWords = mp.eje_secundario ? (axisWords[mp.eje_secundario] ?? []) : [];
            const wrongLabels = (wrongAxis[mp.eje] ?? []).filter(w => !secondaryWords.includes(w));
            const playerNameLower = mp.child_name.toLowerCase().split(' ')[0];
            const sentences = assistantContent.split(/[.!?]+/);
            let factualError = false;
            for (const sentence of sentences) {
                const sLower = sentence.toLowerCase();
                if (sLower.includes(playerNameLower) && wrongLabels.some(w => sLower.includes(w))) {
                    factualError = true;
                    break;
                }
            }
            const forbiddenLabel = FORBIDDEN_OLD_LABELS.find(l => assistantContent.toLowerCase().includes(l));
            if (factualError || forbiddenLabel) {
                qa.groundtruthViolation = factualError;
                qa.labelViolation = !!forbiddenLabel;
                // Log the placeholder, never the child's real name (R2 — no PII in logs).
                console.warn(`[tenant-chat] Ground truth violation for ${placeholderForId(mp.id)} (eje=${mp.eje}, motor=${mp.motor})${forbiddenLabel ? ` forbidden-label="${forbiddenLabel}"` : ''}`);
                const lang = safeLang(promptLang);
                const archetype = canonicalArchetype(mp.eje, mp.motor, lang);
                const motorDisp = canonicalMotorDisplay(mp.eje, mp.motor, lang);
                // The note IS shown to the coach, so the real name is fine here.
                assistantContent += `\n\n_Nota: el perfil registrado de ${mp.child_name} corresponde a un patrón ${archetype} (eje ${mp.eje}, motor ${motorDisp}). Las recomendaciones se basan en ese perfil._`;
            }
        }

        // ── Save both turns (only on success, so a failed AI call doesn't
        // consume a trial query and leaves no dangling question in the thread) ──
        await sb.from('chat_messages').insert([
            { tenant_id: tenant.id, member_id: callerMemberId, thread_id: threadId, role: 'user', content: trimmedMsg, tokens_in: 0, tokens_out: 0, plantel_id: teamFilter },
            { tenant_id: tenant.id, member_id: callerMemberId, thread_id: threadId, role: 'assistant', content: assistantContent, tokens_in: totalInputTokens, tokens_out: totalOutputTokens, plantel_id: teamFilter },
        ]);

        // ── Best-effort quality telemetry (Wave E) — never breaks the chat ──
        // Stores only non-PII signals (placeholders/flags), never the child name.
        // If the ai_events table isn't migrated yet, the insert simply no-ops.
        try {
            await sb.from('ai_events').insert({
                tenant_id: tenant.id,
                thread_id: threadId,
                source: 'tenant-chat',
                provider: servedProvider,
                model: aiModel,
                lang: promptLang,
                tokens_in: totalInputTokens,
                tokens_out: totalOutputTokens,
                cost_usd: getCostUsd({ ...aiResult, inputTokens: totalInputTokens, outputTokens: totalOutputTokens }),
                latency_ms: Date.now() - t0,
                mentioned_player: !!mentionedPlayer,
                groundtruth_violation: qa.groundtruthViolation,
                label_violation: qa.labelViolation,
                prohibited_hit: qa.prohibitedHit,
                prohibited_after_retry: qa.prohibitedAfterRetry,
                context_miss: qa.contextMiss,
                fair_use_exceeded: fairUseExceeded,
                group_ids: coachGroupIds, // per-plantel attribution for coaches; null for owner/admin
            });
        } catch (telemetryErr) {
            console.warn('[tenant-chat] ai_events telemetry insert failed (non-fatal):', telemetryErr instanceof Error ? telemetryErr.message : telemetryErr);
        }

        return res.status(200).json({
            thread_id: threadId,
            message: { role: 'assistant', content: assistantContent },
            usage: {
                tokensIn: totalInputTokens,
                tokensOut: totalOutputTokens,
                costUsd: getCostUsd({ ...aiResult, inputTokens: totalInputTokens, outputTokens: totalOutputTokens }),
            },
            fair_use_exceeded: fairUseExceeded,
        });

    } catch (err) {
        console.error('[tenant-chat] Unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
