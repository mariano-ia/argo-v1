import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ─── Inline AI provider (Vercel serverless can't import between api files) ──

interface AIMessage { role: 'system' | 'user' | 'assistant'; content: string; }
interface AIResponse { content: string; inputTokens: number; outputTokens: number; totalTokens: number; }

function getCostUsd(r: AIResponse): number {
    const rate = 0.15 / 1_000_000; // gemini-2.5-flash input ≈ output
    return r.inputTokens * rate + r.outputTokens * (0.60 / 1_000_000);
}

async function callAI(messages: AIMessage[], opts: { temperature?: number; maxTokens?: number; model?: string } = {}): Promise<AIResponse> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('Missing GEMINI_API_KEY');
    const temperature = opts.temperature ?? 0.7;
    const maxTokens = opts.maxTokens ?? 3000;
    const model = opts.model ?? 'gemini-2.5-flash';

    const systemMsg = messages.find(m => m.role === 'system');
    const conversationMsgs = messages.filter(m => m.role !== 'system');
    const contents = conversationMsgs.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
    const body: Record<string, unknown> = { contents, generationConfig: { temperature, maxOutputTokens: maxTokens } };
    if (systemMsg) body.systemInstruction = { parts: [{ text: systemMsg.content }] };

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (!res.ok) { const err = await res.text(); throw new Error(`Gemini error ${res.status}: ${err}`); }
    const data = await res.json();
    const usage = data.usageMetadata ?? {};
    return {
        content: data.candidates?.[0]?.content?.parts?.[0]?.text ?? '',
        inputTokens: usage.promptTokenCount ?? 0,
        outputTokens: usage.candidatesTokenCount ?? 0,
        totalTokens: usage.totalTokenCount ?? 0,
    };
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

CONOCIMIENTO BASE:
- Modelo DISC: 4 ejes conductuales: D (Impulsor), I (Conector), S (Sostén), C (Estratega)
- Motor: 3 tipos de tempo: Rápido (Dinámico), Medio (Rítmico), Lento (Sereno)
- 12 arquetipos = 4 ejes × 3 motores
- Brújula secundaria: el segundo eje más fuerte matiza el perfil principal
- No hay niños incorrectos, hay adultos que todavía no encontraron la sintonía`,

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

KNOWLEDGE BASE:
- DISC model: 4 behavioral axes: D (Driver), I (Connector), S (Sustainer), C (Strategist)
- Engine: 3 tempo types: Fast (Dynamic), Medium (Rhythmic), Slow (Serene)
- 12 archetypes = 4 axes × 3 engines
- Secondary compass: the second strongest axis nuances the main profile
- There are no incorrect children, only adults who haven't found the right attunement yet`,

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

BASE DE CONHECIMENTO:
- Modelo DISC: 4 eixos comportamentais: D (Impulsionador), I (Conector), S (Sustentador), C (Estrategista)
- Motor: 3 tipos de ritmo: Rápido (Dinâmico), Médio (Rítmico), Lento (Sereno)
- 12 arquétipos = 4 eixos × 3 motores
- Bússola secundária: o segundo eixo mais forte matiza o perfil principal
- Não existem crianças incorretas, apenas adultos que ainda não encontraram a sintonia certa`,
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

        // Trial plan: hard cap at 10 total user messages
        const { data: tenantPlan } = await sb.from('tenants').select('plan').eq('id', tenant.id).maybeSingle();
        if (tenantPlan?.plan === 'trial') {
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
        const { data: sessions } = await sb
            .from('sessions')
            .select('child_name, child_age, sport, eje, motor, eje_secundario, archetype_label')
            .eq('tenant_id', tenant.id)
            .is('deleted_at', null)
            .not('eje', 'eq', '_pending')
            .order('created_at', { ascending: false })
            .limit(50);

        const tendLabels = TENDENCIA[promptLang] ?? TENDENCIA.es;
        const sanitize = (s: string, maxLen = 60) => s.replace(/[^\p{L}\p{N}\s'-]/gu, '').slice(0, maxLen);
        const allPlayers = sessions ?? [];

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
        const teamSummary = allPlayers.length > 0
            ? `\n\nEQUIPO: ${allPlayers.length} jugadores. Distribución: ${axisSummary}. Motores: ${motorSummary}.\nNombres: ${allPlayers.map(s => sanitize(s.child_name)).join(', ')}.`
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
            extraContext += `\n\nJUGADOR MENCIONADO:\n- ${sanitize(mp.child_name)} (${mp.child_age} años, ${sanitize(mp.sport ?? '', 40)})\n- Arquetipo: ${mp.archetype_label}, Eje: ${mp.eje}, Motor: ${mp.motor}, Secundario: ${mp.eje_secundario ?? 'N/A'} (${tend})`;
        } else if (potentialNames.length > 0) {
            extraContext += `\n\nNOTA: El nombre mencionado no coincide con ningún jugador registrado. Jugadores: ${allPlayers.map(s => s.child_name).join(', ') || 'ninguno'}.`;
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

        // ── OPT 4: Use cached system prompt (only send once per language) ──
        // Gemini's systemInstruction is already separate from contents,
        // so it gets cached internally by the API across requests.
        // We optimize by keeping the system prompt as compact as possible.
        const systemPrompt = (SYSTEM_PROMPTS[promptLang] ?? SYSTEM_PROMPTS.es)
            + teamSummary
            + extraContext;

        const aiMessages = [
            { role: 'system' as const, content: systemPrompt },
            ...historyMessages,
            { role: 'user' as const, content: trimmedMsg },
        ];

        // ── Call AI provider (enterprise gets premium model) ─────────────
        const aiModel = tenantPlan?.plan === 'enterprise' ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
        const chatOpts = { temperature: 0.4, maxTokens: 800, model: aiModel };
        let aiResult;
        try {
            aiResult = await callAI(aiMessages, chatOpts);
        } catch (firstErr) {
            console.warn('[tenant-chat] First attempt failed, retrying in 2s...', firstErr instanceof Error ? firstErr.message : firstErr);
            await new Promise(r => setTimeout(r, 2000));
            aiResult = await callAI(aiMessages, chatOpts);
        }
        let assistantContent = aiResult.content;

        // ── Post-processing: scan for prohibited words ────────────────────
        const PROHIBITED_WORDS = [
            'déficit', 'deficit', 'trastorno', 'disorder', 'transtorno',
            'diagnóstico', 'diagnosis', 'diagnóstica', 'diagnostic',
            'agresivo', 'aggressive', 'agressivo',
        ];
        const contentLower = assistantContent.toLowerCase();
        const foundProhibited = PROHIBITED_WORDS.filter(w => contentLower.includes(w));

        if (foundProhibited.length > 0) {
            console.warn('[tenant-chat] Prohibited words found in response:', foundProhibited.join(', '));
            const retryMessages = [
                ...aiMessages,
                { role: 'assistant' as const, content: assistantContent },
                { role: 'user' as const, content: `SYSTEM: Tu respuesta anterior contenía palabras prohibidas (${foundProhibited.join(', ')}). Reformula sin usar esas palabras. Recuerda: siempre desde la fortaleza, nunca desde el déficit.` },
            ];
            try {
                const retryResult = await callAI(retryMessages, { temperature: 0.3, maxTokens: 800 });
                if (retryResult.content) assistantContent = retryResult.content;
            } catch { /* keep original response */ }
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
