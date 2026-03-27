import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

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
    const openaiKey = process.env.OPENAI_API_KEY;

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

        const { data: memberRow } = await sb.from('tenant_members').select('tenant_id').eq('auth_user_id', user.id).eq('status', 'active').single();
        if (!memberRow) return res.status(404).json({ error: 'Tenant not found' });
        const tenant = { id: memberRow.tenant_id };

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // GET: List threads or messages
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        if (req.method === 'GET') {
            const action = req.query.action as string;

            if (action === 'threads') {
                // Get distinct threads with last message
                const { data: threads } = await sb
                    .from('chat_messages')
                    .select('thread_id, content, created_at')
                    .eq('tenant_id', tenant.id)
                    .eq('role', 'user')
                    .order('created_at', { ascending: false });

                // Deduplicate by thread_id, keep most recent
                const seen = new Set<string>();
                const unique = (threads ?? []).filter(t => {
                    if (seen.has(t.thread_id)) return false;
                    seen.add(t.thread_id);
                    return true;
                }).slice(0, 20);

                return res.status(200).json({ threads: unique });
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
        if (!openaiKey) return res.status(500).json({ error: 'AI not configured' });

        const { thread_id, message, lang = 'es' } = req.body ?? {};
        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return res.status(400).json({ error: 'Message required' });
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
        // Sanitize player data to prevent prompt injection
        const sanitize = (s: string, maxLen = 60) => s.replace(/[^\p{L}\p{N}\s'-]/gu, '').slice(0, maxLen);
        const playerList = (sessions ?? []).map(s => {
            const tend = s.eje_secundario ? `, ${tendLabels[s.eje_secundario] ?? ''}` : '';
            return `- ${sanitize(s.child_name)} (${s.child_age} años, ${sanitize(s.sport ?? 'N/A', 40)}): ${s.archetype_label}${tend}`;
        }).join('\n');

        // ── Context injection based on keywords ───────────────────────────
        let extraContext = '';
        const msgLower = trimmedMsg.toLowerCase();

        // Check if user mentions a player by name → inject full profile or warn
        const playerNames = (sessions ?? []).map(s => ({
            firstName: s.child_name.toLowerCase().split(' ')[0],
            fullName: s.child_name.toLowerCase(),
            session: s,
        }));

        // Extract potential names from message (words starting with uppercase in original message)
        const potentialNames = trimmedMsg.match(/[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/g) ?? [];

        const mentionedPlayer = playerNames.find(p =>
            potentialNames.some(n => n.toLowerCase() === p.firstName || p.fullName.includes(n.toLowerCase()))
        );

        if (mentionedPlayer) {
            const mp = mentionedPlayer.session;
            const tend = mp.eje_secundario ? tendLabels[mp.eje_secundario] ?? '' : '';
            // Sanitize player data to prevent prompt injection
            const safeName = mp.child_name.replace(/[^\p{L}\p{N}\s'-]/gu, '').slice(0, 60);
            const safeSport = (mp.sport ?? '').replace(/[^\p{L}\p{N}\s'-]/gu, '').slice(0, 40);
            extraContext += `\n\nDATOS DETALLADOS DEL JUGADOR MENCIONADO:\nNombre: ${safeName}\nEdad: ${mp.child_age}\nDeporte: ${safeSport}\nArquetipo: ${mp.archetype_label}\nEje dominante: ${mp.eje}\nMotor: ${mp.motor}\nBrújula secundaria: ${mp.eje_secundario ?? 'N/A'} (${tend})\n`;
        } else if (potentialNames.length > 0) {
            // User mentioned a name but it doesn't match any registered player
            const knownNames = (sessions ?? []).map(s => s.child_name).join(', ');
            extraContext += `\n\nNOTA IMPORTANTE: El usuario mencionó un nombre que NO coincide con ningún jugador registrado. NO inventes datos sobre ese jugador. Si te preguntan por alguien que no está en tu lista, responde que no tienes ese jugador registrado y muestra la lista de jugadores disponibles.\nJugadores registrados: ${knownNames || 'ninguno'}`;
        }

        // Check for situation keywords → inject relevant guidance
        for (const [sitId, keywords] of Object.entries(SITUATION_KEYWORDS)) {
            if (keywords.some(k => msgLower.includes(k.toLowerCase()))) {
                extraContext += `\n\n[Contexto situacional relevante: situación "${sitId}". Usa tu conocimiento DISC para dar una respuesta personalizada basada en el perfil del jugador si fue mencionado.]`;
                break;
            }
        }

        // ── Build conversation history ────────────────────────────────────
        const { data: history } = await sb
            .from('chat_messages')
            .select('role, content')
            .eq('tenant_id', tenant.id)
            .eq('thread_id', threadId)
            .in('role', ['user', 'assistant'])
            .order('created_at', { ascending: true })
            .limit(20);

        const systemPrompt = (SYSTEM_PROMPTS[promptLang] ?? SYSTEM_PROMPTS.es)
            + (playerList ? `\n\nJUGADORES DEL ENTRENADOR:\n${playerList}` : '\n\nEl entrenador todavía no tiene jugadores registrados.')
            + extraContext;

        const messages = [
            { role: 'system', content: systemPrompt },
            ...((history ?? []).map(m => ({ role: m.role, content: m.content }))),
            { role: 'user', content: trimmedMsg },
        ];

        // ── Call OpenAI ───────────────────────────────────────────────────
        const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages,
                temperature: 0.4,
                max_tokens: 800,
            }),
        });

        if (!aiRes.ok) {
            const errBody = await aiRes.text();
            console.error('[tenant-chat] OpenAI error:', aiRes.status, errBody);
            return res.status(502).json({ error: 'AI service error' });
        }

        const aiData = await aiRes.json();
        let assistantContent = aiData.choices?.[0]?.message?.content ?? '';
        const tokensIn = aiData.usage?.prompt_tokens ?? 0;
        const tokensOut = aiData.usage?.completion_tokens ?? 0;

        // ── Post-processing: scan for prohibited words ────────────────────
        const PROHIBITED_WORDS = [
            'déficit', 'deficit', 'trastorno', 'disorder', 'transtorno',
            'diagnóstico', 'diagnosis', 'diagnóstica', 'diagnostic',
            'agresivo', 'aggressive', 'agressivo',
        ];
        const contentLower = assistantContent.toLowerCase();
        const foundProhibited = PROHIBITED_WORDS.filter(w => contentLower.includes(w));

        if (foundProhibited.length > 0) {
            // Retry once with stronger guardrail
            console.warn('[tenant-chat] Prohibited words found in response:', foundProhibited.join(', '));
            const retryMessages = [
                ...messages,
                { role: 'assistant', content: assistantContent },
                { role: 'user', content: `SYSTEM: Tu respuesta anterior contenía palabras prohibidas (${foundProhibited.join(', ')}). Reformula sin usar esas palabras. Recuerda: siempre desde la fortaleza, nunca desde el déficit.` },
            ];
            const retryRes = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: 'gpt-4o-mini', messages: retryMessages, temperature: 0.3, max_tokens: 800 }),
            });
            if (retryRes.ok) {
                const retryData = await retryRes.json();
                const retryContent = retryData.choices?.[0]?.message?.content;
                if (retryContent) assistantContent = retryContent;
            }
        }

        // ── Save messages to DB ───────────────────────────────────────────
        await sb.from('chat_messages').insert([
            { tenant_id: tenant.id, thread_id: threadId, role: 'user', content: trimmedMsg, tokens_in: 0, tokens_out: 0 },
            { tenant_id: tenant.id, thread_id: threadId, role: 'assistant', content: assistantContent, tokens_in: tokensIn, tokens_out: tokensOut },
        ]);

        return res.status(200).json({
            thread_id: threadId,
            message: { role: 'assistant', content: assistantContent },
            usage: { tokensIn, tokensOut, costUsd: (tokensIn * 0.15 + tokensOut * 0.60) / 1_000_000 },
        });

    } catch (err) {
        console.error('[tenant-chat] Unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
