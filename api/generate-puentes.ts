import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

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
        'When things go wrong: the frustration',
        'After the match: the conversation',
        'In the long run: sustaining their bond with sport',
    ] : lang === 'pt' ? [
        'Antes do jogo: o pré-jogo',
        'Quando algo não dá certo: a frustração',
        'Depois da partida: a conversa',
        'No longo prazo: sustentar o vínculo com o esporte',
    ] : [
        'Antes del juego: la previa',
        'Cuando algo no sale: la frustración',
        'Después del partido: la conversación',
        'El largo plazo: sostener su vínculo con el deporte',
    ];

    return `Tarea: Generar un informe "Argo Puentes" para un adulto responsable de ${childName} (deporte: ${sport}).
El informe es un upsell tras el informe del niño y propone 4 PUENTES (no diagnósticos) entre el estilo natural del adulto y el del niño.

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
7. NUNCA usar las siguientes palabras: error, problema, fallo, déficit, corregir, débil, agresivo, diagnóstico, trastorno, terapia, tratamiento, culpa, culpable.
8. ${langInstruction}
9. Sin guiones largos (em dash, en dash). Si necesitas pausa, usá comas, paréntesis o punto.
10. Cada puente debe combinar específicamente el perfil del niño con el del adulto. El Puente 2 (frustración) DEBE incorporar el estilo bajo presión del adulto (${pressureLabel}).

ESTRUCTURA EXACTA (devuelve SOLO este JSON, sin markdown):
{
  "saludo": "1 párrafo cálido (3-4 frases) que reconoce el paso del adulto al hacer el cuestionario y enmarca el informe como invitación, no diagnóstico",
  "perfil_adulto_breve": "1 párrafo (4-5 frases). Refleja al adulto su eje primario${ejeSecondaryLabel ? ' (y secundario)' : ''}, motor, estilo bajo presión. Reconocedor, valida su estilo natural sin juzgar.",
  "puentes": [
    {
      "titulo": "${titles[0]}",
      "como_esta_el": "2-3 frases probabilísticas sobre cómo tiende a estar ${childName} antes de jugar, según su eje + motor",
      "lo_que_traes": "2-3 frases reconociendo lo que el adulto aporta naturalmente en ese momento, según su eje y motor",
      "el_puente": "3-4 frases. Cómo se combinan ambos perfiles aquí. Observaciones o pequeños ajustes (no prescripciones). Lenguaje de invitación.",
      "pregunta_reflexion": "Una pregunta abierta para sostener en el tiempo, en segunda persona"
    },
    {
      "titulo": "${titles[1]}",
      "como_esta_el": "2-3 frases sobre cómo tiende a responder ${childName} cuando algo sale mal, según su eje + motor",
      "lo_que_traes": "2-3 frases reconociendo cómo el adulto vive ese momento, según su eje",
      "el_puente": "3-4 frases. CRÍTICO: combinar el estilo del niño con el ESTILO BAJO PRESIÓN del adulto (${pressureLabel}). Este es el puente más sensible. Reconocer primero, invitar después.",
      "pregunta_reflexion": "Una pregunta para llevarse"
    },
    {
      "titulo": "${titles[2]}",
      "como_esta_el": "2-3 frases sobre el timing y la forma en que ${childName} procesa lo vivido, según su motor (ritmo)",
      "lo_que_traes": "2-3 frases sobre el estilo conversacional natural del adulto",
      "el_puente": "3-4 frases. Timing y lenguaje: cuándo abrir conversación, cuándo dar espacio, qué tipo de frases pueden llegar mejor.",
      "pregunta_reflexion": "Una pregunta reflexiva"
    },
    {
      "titulo": "${titles[3]}",
      "como_esta_el": "2-3 frases sobre qué nutre el disfrute deportivo de ${childName} en el largo plazo, según su perfil",
      "lo_que_traes": "2-3 frases. Considera la historia deportiva del adulto (${historyLabel}) y su emoción dominante (${emotionLabel}). Reconoce sin juzgar.",
      "el_puente": "3-4 frases. Prácticas sostenibles que protegen el gozo del niño en el deporte. Reconocer que ambas formas son válidas.",
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

        // Fetch puentes_session + source child session
        const { data: pSession, error: pErr } = await sb
            .from('puentes_sessions')
            .select('*, source:sessions!source_session_id(id, child_name, sport, eje, motor, archetype_label, ai_sections, lang)')
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
            ? 'Eres un especialista en DISC aplicado a la psicología deportiva juvenil. Trabajas para Argo Method. Respondes SOLO con JSON válido, sin markdown ni explicaciones. Tono adulto a adulto, lenguaje probabilístico, sin etiquetas clínicas.'
            : lang === 'pt'
                ? 'Você é um especialista em DISC aplicado à psicologia esportiva juvenil. Trabalha para o Argo Method. Responde SOMENTE com JSON válido, sem markdown nem explicações. Tom adulto a adulto, linguagem probabilística, sem rótulos clínicos.'
                : 'You are a specialist in DISC applied to youth sports psychology. You work for Argo Method. Respond ONLY with valid JSON, no markdown or explanations. Adult to adult tone, probabilistic language, no clinical labels.';

        const userContent = buildPrompt({
            childProfile: {
                eje: child.eje,
                motor: child.motor,
                archetype_label: child.archetype_label,
                ai_sections: child.ai_sections,
            },
            adultProfile: pSession.adult_profile,
            childName: child.child_name || (lang === 'en' ? 'your child' : lang === 'pt' ? 'seu filho' : 'tu hijo'),
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
        if (!aiSections.puentes || !Array.isArray(aiSections.puentes) || aiSections.puentes.length !== 4) {
            console.error('[generate-puentes] Invalid shape from AI:', JSON.stringify(aiSections).slice(0, 500));
            await sb.from('puentes_sessions').update({
                status: 'failed',
                error_log: 'Invalid AI response shape',
            }).eq('id', puentes_session_id);
            return res.status(502).json({ error: 'Invalid AI response shape' });
        }

        // Prohibited words enforcement
        const offenders = findProhibitedWords(aiSections);
        if (offenders.length > 0) {
            console.warn('[generate-puentes] Prohibited words found on first pass:', offenders.join(', '));
            const correctionUser = `${userContent}\n\nThe previous response contained these forbidden words: ${offenders.join(', ')}. Rewrite the complete JSON without them, keeping the same structure and meaning. Use probabilistic and non-clinical language.`;
            try {
                const correction = await callGemini({ systemContent, userContent: correctionUser });
                const corrected = parseJsonResponse(correction.content);
                const stillOffending = findProhibitedWords(corrected as any);
                if (stillOffending.length === 0) {
                    aiSections = corrected;
                    resp = correction;
                } else {
                    console.warn('[generate-puentes] Still has prohibited words after correction:', stillOffending.join(', '));
                }
            } catch (corrErr) {
                console.warn('[generate-puentes] Correction retry failed', corrErr);
            }
        }

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
