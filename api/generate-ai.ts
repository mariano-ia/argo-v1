import type { VercelRequest, VercelResponse } from '@vercel/node';

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

TAREA: Reescribe las siguientes secciones personalizando con el deporte "${ctx.deporte}" y la edad de ${ctx.edad} años. Incluye ejemplos específicos del deporte (jugadas, momentos del partido, situaciones de entrenamiento propias de ${ctx.deporte}). Mantén la esencia del arquetipo pero haz el texto único para este perfil.

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

Devuelve ÚNICAMENTE un JSON válido con esta estructura exacta (sin markdown, sin explicaciones). Usa ${NAME_PLACEHOLDER} para mencionar al deportista.
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

// ─── Inline AI provider (Vercel serverless can't import between api files) ──

interface AIMsg { role: 'system' | 'user' | 'assistant'; content: string; }
interface AIResp { content: string; inputTokens: number; outputTokens: number; totalTokens: number; }

function getCostUsd(r: AIResp): number {
    return r.inputTokens * (0.15 / 1_000_000) + r.outputTokens * (0.60 / 1_000_000);
}

async function callAI(messages: AIMsg[], opts: { temperature?: number; maxTokens?: number } = {}): Promise<AIResp> {
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
    return { content: data.candidates?.[0]?.content?.parts?.[0]?.text ?? '', inputTokens: usage.promptTokenCount ?? 0, outputTokens: usage.candidatesTokenCount ?? 0, totalTokens: usage.totalTokenCount ?? 0 };
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
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

        // Try with 1 retry (2 second delay) for resilience
        let aiResponse: AIResp;
        try {
            aiResponse = await callAI(messages, aiOpts);
        } catch (firstErr) {
            console.warn('[generate-ai] First attempt failed, retrying in 2s...', firstErr instanceof Error ? firstErr.message : firstErr);
            await new Promise(r => setTimeout(r, 2000));
            aiResponse = await callAI(messages, aiOpts);
        }

        // Strip potential markdown code fences
        const cleaned = aiResponse.content.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();

        let sections: AISections;
        try {
            sections = JSON.parse(cleaned);
        } catch (parseErr) {
            console.warn(
                `[generate-ai] JSON parse failed, retrying AI call. Length: ${cleaned.length}, tokens: ${aiResponse.outputTokens}/${aiResponse.totalTokens}. First 200 chars:`,
                cleaned.slice(0, 200),
                'Last 200 chars:',
                cleaned.slice(-200),
                'Error:',
                parseErr instanceof Error ? parseErr.message : String(parseErr),
            );
            // Retry once — sometimes the model returns truncated JSON
            try {
                await new Promise(r => setTimeout(r, 2000));
                const retryResponse = await callAI(messages, aiOpts);
                const retryCleaned = retryResponse.content.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
                sections = JSON.parse(retryCleaned);
                // Update usage with retry totals
                aiResponse = retryResponse;
            } catch (retryErr) {
                console.error(
                    `[generate-ai] Retry also failed. Length: ${cleaned.length}, output tokens: ${aiResponse.outputTokens}. First 500 chars:`,
                    cleaned.slice(0, 500),
                    'Error:',
                    retryErr instanceof Error ? retryErr.message : String(retryErr),
                );
                return res.status(502).json({ error: 'Invalid AI response format after retry' });
            }
        }

        // Prohibited words check (post-generation enforcement of the writing
        // rules). The prompt asks Gemini to avoid deficit/clinical language,
        // but the model sometimes leaks them anyway. If we find any, ask it
        // to rewrite the response without those words. One retry max.
        const sectionsAsObj = sections as unknown as Record<string, unknown>;
        const firstFound = findProhibitedWords(sectionsAsObj);
        if (firstFound.length > 0) {
            console.warn('[generate-ai] Prohibited words detected on first pass:', firstFound.join(', '));
            const correctionMessages: AIMsg[] = [
                ...messages,
                { role: 'assistant', content: aiResponse.content },
                {
                    role: 'user',
                    content: `Tu respuesta anterior contenía palabras prohibidas por las reglas de redacción de Argo: ${firstFound.join(', ')}. Reformula TODO el JSON sin usar esas palabras ni sus sinónimos (déficit, clínico, diagnóstico, determinista). Recuerda: siempre desde la fortaleza, nunca desde el déficit. Devuelve ÚNICAMENTE el JSON con la misma estructura.`,
                },
            ];
            try {
                const correctedResp = await callAI(correctionMessages, aiOpts);
                const correctedCleaned = correctedResp.content.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
                const correctedSections = JSON.parse(correctedCleaned) as AISections;
                const stillFound = findProhibitedWords(correctedSections as unknown as Record<string, unknown>);
                if (stillFound.length === 0) {
                    sections = correctedSections;
                    aiResponse = correctedResp;
                } else {
                    console.warn('[generate-ai] Correction still had prohibited words:', stillFound.join(', '));
                }
            } catch (correctionErr) {
                console.warn('[generate-ai] Correction pass failed, keeping original response:', correctionErr instanceof Error ? correctionErr.message : correctionErr);
            }
        }

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

        return res.status(200).json({ sections, usage });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[generate-ai] Unexpected error:', msg);
        return res.status(500).json({ error: 'Internal server error', detail: msg });
    }
}
