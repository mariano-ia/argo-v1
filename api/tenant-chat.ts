import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

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
    const body: Record<string, unknown> = { contents, generationConfig: { temperature: opts.temperature, maxOutputTokens: opts.maxTokens, thinkingConfig: { thinkingBudget: 0 } } };
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

    // Try Gemini first with 1 retry
    try {
        return await callGemini(messages, { temperature, maxTokens, model });
    } catch (firstErr) {
        console.warn('[callAI] Gemini attempt 1 failed:', firstErr instanceof Error ? firstErr.message : firstErr);
        await new Promise(r => setTimeout(r, 1500));
        try {
            return await callGemini(messages, { temperature, maxTokens, model });
        } catch (secondErr) {
            console.warn('[callAI] Gemini attempt 2 failed, falling back to OpenAI:', secondErr instanceof Error ? secondErr.message : secondErr);
        }
    }

    // Fallback to OpenAI
    return callOpenAI(messages, { temperature, maxTokens });
}

// ─── End inline AI provider ─────────────────────────────────────────────────

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
  D+Medio: Impulsor Decidido (iniciativa estratégica, ejecución con propósito)
  D+Lento: Impulsor Persistente (determinación constante, resiliencia)
  I+Rápido: Conector Vibrante (entusiasmo contagioso, cohesión por energía)
  I+Medio: Conector Relacional (vínculo equilibrado, cohesión a ritmo firme)
  I+Lento: Conector Reflexivo (cohesión profunda, observación del clima grupal)
  S+Rápido: Sostén Ágil (auxilio veloz, apoyo dinámico)
  S+Medio: Sostén Confiable (consistencia serena, apoyo estructurado)
  S+Lento: Sostén Sereno (resistencia imperturbable, calma estructural)
  C+Rápido: Estratega Reactivo (precisión instantánea, ajuste táctico veloz)
  C+Medio: Estratega Analítico (procesamiento técnico, ejecución con propósito)
  C+Lento: Estratega Observador (análisis profundo, precisión lógica)
- Brújula secundaria: el segundo eje más fuerte matiza el perfil principal (ej: Impulsor con brújula social = lidera pero busca consenso)
- No hay niños incorrectos, hay adultos que todavía no encontraron la sintonía

EJEMPLOS DE RESPUESTAS CORRECTAS:

Pregunta: "¿Cómo motivo a un Impulsor Dinámico en fútbol?"
Respuesta correcta: "Un Impulsor Dinámico tiende a necesitar sentir que sus acciones producen impacto visible. Prueba darle una responsabilidad concreta ('Tu rol es activar la presión en la salida'). Su combustible es el desafío, así que las consignas vagas o pasivas tienden a desconectarlo. Valida su iniciativa, no solo el resultado: 'Me encantó cómo te animaste a intentar ese pase'."

Pregunta: "Tengo un Sostén Sereno que no participa en los ejercicios."
Respuesta correcta: "Un Sostén Sereno tiende a necesitar previsibilidad y tiempo. Es probable que no sea falta de interés, sino su ritmo natural de procesamiento. Prueba anticiparle la dinámica antes de empezar: 'Ahora vamos a hacer X, tu rol va a ser Y'. Eso le da estructura y tiende a reducir la incertidumbre que puede estar frenándolo."

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
  D+Medium: Decisive Driver (strategic initiative, purposeful execution)
  D+Slow: Persistent Driver (constant determination, resilience)
  I+Fast: Vibrant Connector (contagious enthusiasm, energy-driven cohesion)
  I+Medium: Relational Connector (balanced bonds, steady cohesion)
  I+Slow: Reflective Connector (deep cohesion, group climate awareness)
  S+Fast: Agile Sustainer (swift support, dynamic aid)
  S+Medium: Reliable Sustainer (serene consistency, structured support)
  S+Slow: Serene Sustainer (imperturbable resistance, structural calm)
  C+Fast: Reactive Strategist (instant precision, swift tactical adjustment)
  C+Medium: Analytical Strategist (technical processing, purposeful execution)
  C+Slow: Observer Strategist (deep analysis, logical precision)
- Secondary compass: the second strongest axis nuances the main profile
- There are no incorrect children, only adults who haven't found the right attunement yet

EXAMPLE CORRECT RESPONSES:

Question: "How do I motivate a Dynamic Driver in soccer?"
Correct response: "A Dynamic Driver tends to need visible impact from their actions. Try giving them a concrete responsibility ('Your role is to activate pressing on the build-up'). Their fuel is challenge, so vague or passive instructions tend to disconnect them. Validate their initiative, not just results."

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
Resposta correta: "Um Impulsionador Dinâmico tende a precisar sentir que suas ações produzem impacto visível. Tente dar-lhe uma responsabilidade concreta. Seu combustível é o desafio, então instruções vagas tendem a desconectá-lo."

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

        const { data: memberRow } = await sb.from('tenant_members').select('tenant_id').eq('auth_user_id', user.id).eq('status', 'active').maybeSingle();
        let tenantId: string | null = memberRow?.tenant_id ?? null;

        if (!tenantId) {
            // Fallback: owner who predates the tenant_members table
            const { data: tenantRow } = await sb.from('tenants').select('id').eq('auth_user_id', user.id).maybeSingle();
            if (tenantRow) tenantId = tenantRow.id;
        }

        if (!tenantId) return res.status(404).json({ error: 'Tenant not found' });
        const tenant = { id: tenantId };

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // GET: List threads or messages
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        if (req.method === 'GET') {
            const action = req.query.action as string;

            if (action === 'threads') {
                // Get distinct threads with last message + total user message count
                const [{ data: threads }, { count: totalUserMessages }] = await Promise.all([
                    sb.from('chat_messages')
                        .select('thread_id, content, created_at')
                        .eq('tenant_id', tenant.id)
                        .eq('role', 'user')
                        .order('created_at', { ascending: false }),
                    sb.from('chat_messages')
                        .select('id', { count: 'exact', head: true })
                        .eq('tenant_id', tenant.id)
                        .eq('role', 'user'),
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

                const { data: messages } = await sb
                    .from('chat_messages')
                    .select('role, content, created_at')
                    .eq('tenant_id', tenant.id)
                    .eq('thread_id', threadId)
                    .in('role', ['user', 'assistant'])
                    .order('created_at', { ascending: true })
                    .limit(100);

                return res.status(200).json({ messages: messages ?? [] });
            }

            return res.status(400).json({ error: 'Unknown action' });
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // POST: Send message
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

        const { thread_id, message, lang = 'es' } = req.body ?? {};
        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return res.status(400).json({ error: 'Message required' });
        }

        // Fair use: increment AI query counter and check soft cap
        const { data: fairUseData, error: fairUseErr } = await sb.rpc('increment_ai_queries', { p_tenant_id: tenant.id });
        if (fairUseErr) {
            console.error('[tenant-chat] Fair use check error:', fairUseErr.message);
        }
        const fairUseExceeded = fairUseData?.fair_use_exceeded === true;

        // Trial plan: check expiration + hard cap at 10 total user messages
        const { data: tenantPlan } = await sb.from('tenants').select('plan, trial_expires_at').eq('id', tenant.id).maybeSingle();
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
        // Mejora 2: fetch ai_sections for full report injection when player is mentioned
        const { data: sessions } = await sb
            .from('sessions')
            .select('child_name, child_age, sport, eje, motor, eje_secundario, archetype_label, ai_sections')
            .eq('tenant_id', tenant.id)
            .is('deleted_at', null)
            .not('eje', 'eq', '_pending')
            .order('created_at', { ascending: false })
            .limit(50);

        const tendLabels = TENDENCIA[promptLang] ?? TENDENCIA.es;
        const sanitize = (s: string, maxLen = 60) => s.replace(/[^\p{L}\p{N}\s'-]/gu, '').slice(0, maxLen);
        const allPlayers = sessions ?? [];

        // ─── Anonymization (Gemini never sees real player names) ────────
        // We build a bidirectional map between real names and {{Pn}} placeholders.
        // All player-name text is scrubbed before being sent to Gemini; the
        // assistant's response is then rehydrated with real names for display.
        const nameToPlaceholder = new Map<string, string>();
        const placeholderToName = new Map<string, string>();
        allPlayers.forEach((p, i) => {
            const placeholder = `{{P${i + 1}}}`;
            const fullName = p.child_name.trim();
            const firstName = fullName.split(/\s+/)[0];
            // When rehydrating, we use the first name (matches the informal tone
            // of the rest of the flow). Mapping multiple source variants lets
            // us catch both "Mateo" and "Mateo Pérez" in the coach's message.
            nameToPlaceholder.set(fullName.toLowerCase(), placeholder);
            nameToPlaceholder.set(firstName.toLowerCase(), placeholder);
            placeholderToName.set(placeholder, firstName);
        });

        const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const anonymize = (text: string): string => {
            if (!text || nameToPlaceholder.size === 0) return text;
            // Sort names by length desc so "Juan Pablo" is replaced before "Juan".
            const names = [...nameToPlaceholder.keys()].sort((a, b) => b.length - a.length);
            let result = text;
            for (const name of names) {
                const placeholder = nameToPlaceholder.get(name);
                if (!placeholder) continue;
                const pattern = new RegExp(`\\b${escapeRegex(name)}\\b`, 'gi');
                result = result.replace(pattern, placeholder);
            }
            return result;
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
        const axisLabels: Record<string, string> = { D: 'Impulsor', I: 'Conector', S: 'Sostenedor', C: 'Estratega' };
        const axisSummary = Object.entries(axisCounts).map(([k, v]) => `${v} ${axisLabels[k] ?? k}`).join(', ');
        const motorSummary = Object.entries(motorCounts).map(([k, v]) => `${v} ${k}`).join(', ');
        // Player list uses placeholders instead of real names. The mapping
        // (${placeholder} → name) stays on our server and is applied only
        // when rehydrating Gemini's response.
        const playerListForPrompt = allPlayers
            .map(s => nameToPlaceholder.get(s.child_name.trim().split(/\s+/)[0].toLowerCase()))
            .filter(Boolean)
            .join(', ');
        const teamSummary = allPlayers.length > 0
            ? `\n\nEQUIPO: ${allPlayers.length} jugadores. Distribución: ${axisSummary}. Motores: ${motorSummary}.\nJugadores: ${playerListForPrompt}.`
            : '\n\nEl entrenador todavía no tiene jugadores registrados.';

        // ── Context injection based on message content ──────────────────
        let extraContext = '';
        const msgLower = trimmedMsg.toLowerCase();

        // Check if user mentions a player by name → inject only that player's full profile
        const playerNames = allPlayers.map(s => ({
            firstName: s.child_name.toLowerCase().split(' ')[0],
            fullName: s.child_name.toLowerCase(),
            session: s,
        }));
        const potentialNames = trimmedMsg.match(/[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/g) ?? [];
        const mentionedPlayer = playerNames.find(p =>
            potentialNames.some(n => n.toLowerCase() === p.firstName || p.fullName.includes(n.toLowerCase()))
        );

        if (mentionedPlayer) {
            const mp = mentionedPlayer.session;
            const tend = mp.eje_secundario ? tendLabels[mp.eje_secundario] ?? '' : '';
            // Mejora 2: inject full AI-generated report if available
            const ai = mp.ai_sections as Record<string, unknown> | null;
            let aiContext = '';
            if (ai) {
                const parts: string[] = [];
                if (ai.resumenPerfil) parts.push(`Resumen: ${String(ai.resumenPerfil).slice(0, 200)}`);
                if (ai.combustible) parts.push(`Combustible: ${String(ai.combustible).slice(0, 150)}`);
                if (ai.corazon) parts.push(`Lenguaje de intención: ${String(ai.corazon).slice(0, 150)}`);
                if (ai.reseteo) parts.push(`Gestión del desajuste: ${String(ai.reseteo).slice(0, 150)}`);
                if (ai.palabrasPuente) parts.push(`Palabras puente: ${(ai.palabrasPuente as string[]).join(', ')}`);
                if (ai.palabrasRuido) parts.push(`Palabras a evitar: ${(ai.palabrasRuido as string[]).join(', ')}`);
                aiContext = '\n' + parts.join('\n');
            }
            // Use the placeholder for the mentioned player. The AI sections
            // may contain the real name embedded in narrative text — anonymize
            // them before injecting.
            const mentionedPlaceholder = nameToPlaceholder.get(mp.child_name.trim().split(/\s+/)[0].toLowerCase()) ?? '{{P?}}';
            extraContext += `\n\nJUGADOR MENCIONADO:\n- ${mentionedPlaceholder} (${mp.child_age} años, ${sanitize(mp.sport ?? '', 40)})\n- Arquetipo: ${mp.archetype_label}, Eje: ${mp.eje}, Motor: ${mp.motor}, Secundario: ${mp.eje_secundario ?? 'N/A'} (${tend})${anonymize(aiContext)}`;
        } else if (potentialNames.length > 0) {
            extraContext += `\n\nNOTA: El nombre mencionado no coincide con ningún jugador registrado. NO inventes datos sobre ese jugador. Jugadores disponibles: ${playerListForPrompt || 'ninguno'}.`;
        }

        // Situation keyword injection
        for (const [sitId, keywords] of Object.entries(SITUATION_KEYWORDS)) {
            if (keywords.some(k => msgLower.includes(k.toLowerCase()))) {
                extraContext += `\n\n[Situación: "${sitId}"]`;
                break;
            }
        }

        // ── OPT 1 + 3: Build conversation history (8 max, summarize older) ──
        const { data: history } = await sb
            .from('chat_messages')
            .select('role, content')
            .eq('tenant_id', tenant.id)
            .eq('thread_id', threadId)
            .in('role', ['user', 'assistant'])
            .order('created_at', { ascending: true })
            .limit(12); // Fetch 12, use last 8 full + summarize first 4

        const allHistory = (history ?? []).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));
        let historyMessages: { role: 'user' | 'assistant'; content: string }[];

        if (allHistory.length > 8) {
            // OPT 3: Summarize older messages into a compact recap
            const older = allHistory.slice(0, allHistory.length - 8);
            const recent = allHistory.slice(allHistory.length - 8);
            const olderTopics = older
                .filter(m => m.role === 'user')
                .map(m => m.content.slice(0, 60))
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

        const systemPrompt = (SYSTEM_PROMPTS[promptLang] ?? SYSTEM_PROMPTS.es)
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
        const chatOpts = { temperature: 0.4, maxTokens: 2000, model: aiModel };
        const aiResult = await callAI(aiMessages, chatOpts);
        if (aiResult.provider === 'openai') {
            console.info('[tenant-chat] Response served by OpenAI fallback');
        }
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
            console.warn('[tenant-chat] Prohibited words found in response:', foundProhibited.join(', '));
            // The retry sends the original (still-anonymized) assistant content
            // back to Gemini, not the rehydrated one. Use aiResult.content which
            // still has placeholders.
            const retryMessages = [
                ...aiMessages,
                { role: 'assistant' as const, content: aiResult.content },
                { role: 'user' as const, content: `SYSTEM: Tu respuesta anterior contenía palabras prohibidas (${foundProhibited.join(', ')}). Reformula sin usar esas palabras. Recuerda: siempre desde la fortaleza, nunca desde el déficit.` },
            ];
            try {
                const retryResult = await callAI(retryMessages, { temperature: 0.3, maxTokens: 800 });
                if (retryResult.content) assistantContent = rehydrate(retryResult.content);
            } catch { /* keep original response */ }
        }

        // ── Mejora 5: Ground truth validation ─────────────────────────────
        // If a player was mentioned, verify the response doesn't contradict their real data
        if (mentionedPlayer) {
            const mp = mentionedPlayer.session;
            const wrongAxis: Record<string, string[]> = {
                D: ['conector', 'connector', 'sostén', 'sustainer', 'estratega', 'strategist'],
                I: ['impulsor', 'driver', 'sostén', 'sustainer', 'estratega', 'strategist'],
                S: ['impulsor', 'driver', 'conector', 'connector', 'estratega', 'strategist'],
                C: ['impulsor', 'driver', 'conector', 'connector', 'sostén', 'sustainer'],
            };
            const wrongLabels = wrongAxis[mp.eje] ?? [];
            // Check if the response calls this player by the wrong archetype
            const playerNameLower = mp.child_name.toLowerCase().split(' ')[0];
            const sentences = assistantContent.split(/[.!?]+/);
            let factualError = false;
            for (const sentence of sentences) {
                const sLower = sentence.toLowerCase();
                if (sLower.includes(playerNameLower)) {
                    for (const wrong of wrongLabels) {
                        if (sLower.includes(wrong)) {
                            factualError = true;
                            break;
                        }
                    }
                }
                if (factualError) break;
            }
            if (factualError) {
                console.warn(`[tenant-chat] Ground truth violation: response attributed wrong axis to ${mp.child_name} (${mp.eje})`);
                // Append a correction note
                assistantContent += `\n\n_Nota: ${mp.child_name} es un ${mp.archetype_label} (eje ${mp.eje}, motor ${mp.motor}). Las recomendaciones están basadas en su perfil real._`;
            }
        }

        // ── Save messages to DB ───────────────────────────────────────────
        await sb.from('chat_messages').insert([
            { tenant_id: tenant.id, thread_id: threadId, role: 'user', content: trimmedMsg, tokens_in: 0, tokens_out: 0 },
            { tenant_id: tenant.id, thread_id: threadId, role: 'assistant', content: assistantContent, tokens_in: aiResult.inputTokens, tokens_out: aiResult.outputTokens },
        ]);

        return res.status(200).json({
            thread_id: threadId,
            message: { role: 'assistant', content: assistantContent },
            usage: { tokensIn: aiResult.inputTokens, tokensOut: aiResult.outputTokens, costUsd: getCostUsd(aiResult) },
            fair_use_exceeded: fairUseExceeded,
        });

    } catch (err) {
        console.error('[tenant-chat] Unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
