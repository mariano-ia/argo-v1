import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * POST /api/report-variant  — Capa 2 (variación por IA), el PROXY de reescritura.
 * Recibe el informe determinista de Capa 1 (report_v4) y devuelve una VARIANTE reescrita: solo prosa,
 * misma estructura, mismos hechos. NO escribe DB, NO decide entrega: es un proxy puro de IA. El cliente
 * aplica los recaudos (src/lib/reportCapa2.makeCapa2: distinción + hechos + gate) y el pipeline decide si
 * la Capa 2 sale o cae a Capa 1. La IA NO recibe ni toca las palabras puente/ruido (tono curado) ni los
 * labels/contadores (van inmutables desde Capa 1). Gateado por env V4_CAPA2: off => {variant:null}.
 *
 * api/ no puede importar src/lib (ERR_MODULE_NOT_FOUND): el provider de IA va inlineado (igual que generate-ai).
 */

export const maxDuration = 60;

// ─── Inline AI providers (copiado de generate-ai; api/ no bundlea imports cruzados) ──
type AIProvider = 'gemini' | 'openai';
interface AIMsg { role: 'system' | 'user' | 'assistant'; content: string; }
interface AIResp { content: string; inputTokens: number; outputTokens: number; totalTokens: number; provider: AIProvider; }
const PRICING: Record<AIProvider, { in: number; out: number }> = {
    gemini: { in: 0.15 / 1_000_000, out: 0.60 / 1_000_000 },
    openai: { in: 2.50 / 1_000_000, out: 10.0 / 1_000_000 },
};
const getCostUsd = (r: AIResp): number => r.inputTokens * PRICING[r.provider].in + r.outputTokens * PRICING[r.provider].out;

async function callGemini(messages: AIMsg[], opts: { temperature?: number; maxTokens?: number } = {}): Promise<AIResp> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('Missing GEMINI_API_KEY');
    const temperature = opts.temperature ?? 0.85;
    const maxTokens = opts.maxTokens ?? 8000; // Flash "thinking" tokens count against this; be generous.
    const systemMsg = messages.find(m => m.role === 'system');
    const conv = messages.filter(m => m.role !== 'system');
    const contents = conv.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
    const body: Record<string, unknown> = { contents, generationConfig: { temperature, maxOutputTokens: maxTokens, responseMimeType: 'application/json' } };
    if (systemMsg) body.systemInstruction = { parts: [{ text: systemMsg.content }] };
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Gemini error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const u = data.usageMetadata ?? {};
    return { content: data.candidates?.[0]?.content?.parts?.[0]?.text ?? '', inputTokens: u.promptTokenCount ?? 0, outputTokens: u.candidatesTokenCount ?? 0, totalTokens: u.totalTokenCount ?? 0, provider: 'gemini' };
}
async function callOpenAI(messages: AIMsg[], opts: { temperature?: number; maxTokens?: number } = {}): Promise<AIResp> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('Missing OPENAI_API_KEY');
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: 'gpt-4o', messages: messages.map(m => ({ role: m.role, content: m.content })), temperature: opts.temperature ?? 0.85, max_tokens: opts.maxTokens ?? 8000, response_format: { type: 'json_object' } }),
    });
    if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const u = data.usage ?? {};
    return { content: data.choices?.[0]?.message?.content ?? '', inputTokens: u.prompt_tokens ?? 0, outputTokens: u.completion_tokens ?? 0, totalTokens: u.total_tokens ?? 0, provider: 'openai' };
}
async function callAI(messages: AIMsg[], opts: { temperature?: number; maxTokens?: number } = {}): Promise<AIResp> {
    try { return await callGemini(messages, opts); }
    catch (e) { console.warn('[report-variant] gemini failed, trying openai:', e instanceof Error ? e.message : e); return await callOpenAI(messages, opts); }
}

// ─── Extracción del "source" reescribible desde report_v4 (NO incluye palabras puente/ruido) ──
type Rv4 = { hero?: { lead?: string; arquetipoLabel?: string }; secciones?: Array<{ id: string; kind: string; bloque?: { cuerpo?: string; ejemplo?: string }; guia?: Record<string, string>; palabras?: { nota?: string } }> };
function extractSource(rv4: Rv4) {
    const sections: Record<string, { cuerpo?: string; ejemplo?: string }> = {};
    let guia: Record<string, string> | undefined;
    let palabrasNota: string | undefined;
    for (const s of rv4.secciones ?? []) {
        if (s.kind === 'texto' && s.bloque) sections[s.id] = { cuerpo: s.bloque.cuerpo, ejemplo: s.bloque.ejemplo };
        if (s.kind === 'guia' && s.guia) guia = { lead: s.guia.lead, antes: s.guia.antes, durante: s.guia.durante, despues: s.guia.despues, ejemplo: s.guia.ejemplo };
        if (s.kind === 'palabras' && s.palabras) palabrasNota = s.palabras.nota;
    }
    return { lead: rv4.hero?.lead ?? '', sections, guia, palabrasNota };
}

const LANG_NAME: Record<string, string> = { es: 'español latinoamericano neutro (tuteo, NO voseo)', en: 'English', pt: 'português' };

function buildPrompt(source: ReturnType<typeof extractSource>, lang: string, nombre: string): AIMsg[] {
    const langName = LANG_NAME[lang] ?? LANG_NAME.es;
    const system = `Eres un reescritor cuidadoso de un informe de perfil conductual de un niño deportista. Recibes un informe YA escrito y correcto. Tu ÚNICA tarea es REESCRIBIR la prosa para que se lea como un documento fresco y DISTINTO, SIN cambiar ningún hecho. El informe debe leerse claramente diferente a otro informe de un perfil parecido, pero seguir siendo del MISMO niño.

REGLAS ESTRICTAS:
1. Conserva EXACTO todo número que aparezca (por ejemplo la edad). No los cambies ni los borres.
2. Nunca cambies el arquetipo, los ejes, ni qué color/motor predomina. La lectura del perfil es intocable.
3. Mismo significado por sección; variá las palabras, la estructura de las oraciones, el ritmo y el orden de las ideas dentro de cada sección.
4. Mantené los marcadores **negrita** alrededor de las frases clave (podés moverlos, pero conservá un énfasis parecido).
5. NUNCA inventes hechos, eventos, detalles del deporte, ni rasgos que no estén en el original.
6. Lenguaje probabilístico siempre ("tiende a", "suele", "es probable que"); jamás identidad categórica ("es un...", "siempre", "será", "nació para").
7. Sin palabras clínicas ni negativas (error, fracaso, déficit, débil, diagnóstico, trastorno, etc.).
8. Escribí en ${langName}.
9. El nombre del niño es "${nombre}": mantenelo tal cual, no lo cambies.
10. No uses guiones largos (— o –). Usá puntos, comas o paréntesis.

SALIDA: JSON estricto con EXACTAMENTE las mismas claves que el input ("lead", "sections" con los mismos ids, "guia", "palabrasNota" si vino). Cada campo es la reescritura del campo homónimo. No agregues ni quites claves.`;
    const user = `Reescribí este informe (mismas claves en la salida):\n\n${JSON.stringify(source, null, 1)}`;
    return [{ role: 'system', content: system }, { role: 'user', content: user }];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // Gateado: Capa 2 apagada => variante nula (el pipeline queda con Capa 1). Inerte hasta habilitarla.
    if (process.env.V4_CAPA2 !== 'on') return res.status(200).json({ variant: null, disabled: true });

    const body = (req.body ?? {}) as { report_v4?: Rv4; lang?: string; nombre?: string };
    const rv4 = body.report_v4;
    if (!rv4?.hero?.lead || !Array.isArray(rv4.secciones)) return res.status(400).json({ error: 'Missing or invalid report_v4' });
    const lang = ['es', 'en', 'pt'].includes(body.lang ?? '') ? body.lang! : 'es';
    const nombre = (body.nombre ?? '').slice(0, 40);

    try {
        const source = extractSource(rv4);
        const messages = buildPrompt(source, lang, nombre);
        const ai = await callAI(messages, { temperature: 0.9, maxTokens: 8000 });
        let variant: unknown = null;
        try { variant = JSON.parse(ai.content); }
        catch { return res.status(200).json({ variant: null, error: 'parse_failed' }); }
        return res.status(200).json({ variant, usage: { costUsd: getCostUsd(ai), inputTokens: ai.inputTokens, outputTokens: ai.outputTokens, provider: ai.provider } });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[report-variant] Error:', msg);
        // Nunca rompe el flujo: sin variante => Capa 1.
        return res.status(200).json({ variant: null, error: msg });
    }
}
