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

interface ReportData {
    nombre: string;
    arquetipo: Archetype;
    perfil: string;
    wow: string;
    motorDesc: string;
    combustible: string;
    corazon: string;
    reseteo: string;
    ecos: string;
    checklist: Checklist;
    ejeSecundario?: string;
    tendenciaLabel?: string;
    tendenciaParagraph?: string;
}

interface ReportContext {
    nombre: string;
    deporte: string;
    edad: number;
    destinatario: 'padre' | 'entrenador';
}

interface AISections {
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
- Profesional pero cálido. No clínico, no infantil. Español latinoamericano neutro.
- Foco en bienestar y disfrute deportivo, no en rendimiento ni éxito.
- Los "Evitar" son condiciones de entorno a cuidar, no errores del niño.
- El informe debe ser una "Invitación al Disfrute", no un "Manual del Niño".
- Personaliza con el nombre del deportista y ejemplos concretos del deporte.
`.trim();

function buildPrompt(base: ReportData, ctx: ReportContext): string {
    const destinatarioLabel = ctx.destinatario === 'padre'
        ? 'el padre/madre del deportista (tono cálido, doméstico, empático)'
        : 'el entrenador/coach (tono táctico, de cancha, práctico)';

    return `Eres un redactor especialista del Método Argo, un sistema de perfilado conductual para deportistas infantiles basado en DISC.

${WRITING_RULES}

CONTEXTO DEL DEPORTISTA:
- Nombre: ${ctx.nombre}
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
${base.ejeSecundario ? `\nEl perfil tiene una tendencia secundaria "${base.tendenciaLabel}" (eje ${base.ejeSecundario}) que refleja una flexibilidad natural.${base.tendenciaParagraph ? ` Contexto de la tendencia: ${base.tendenciaParagraph}` : ''} Menciona sutilmente esta tendencia en las secciones "wow", "combustible" y "corazon", sin diluir la identidad del arquetipo primario. Usa la información del párrafo de tendencia para enriquecer la personalización.` : ''}

Devuelve ÚNICAMENTE un JSON válido con esta estructura exacta (sin markdown, sin explicaciones):
{
  "wow": "texto sección 1",
  "motorDesc": "texto sección 2",
  "combustible": "texto sección 3",
  "corazon": "texto sección 5",
  "reseteo": "texto sección 9",
  "ecos": "texto sección 10",
  "checklist": {
    "antes": "texto antes",
    "durante": "texto durante",
    "despues": "texto después"
  }
}`;
}

// ─── Pricing ─────────────────────────────────────────────────────────────────

const GPT4O_INPUT_COST_PER_TOKEN = 2.50 / 1_000_000;
const GPT4O_OUTPUT_COST_PER_TOKEN = 10.00 / 1_000_000;

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.error('[generate-ai] Missing OPENAI_API_KEY');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
        const { report, context } = req.body as { report: ReportData; context: ReportContext };

        if (!report?.arquetipo || !context?.nombre) {
            return res.status(400).json({ error: 'Missing report or context' });
        }

        const prompt = buildPrompt(report, context);

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                temperature: 0.7,
                max_tokens: 2500,
                messages: [
                    {
                        role: 'system',
                        content: 'Eres un experto redactor del Método Argo. Respondes SOLO con JSON válido, sin markdown ni explicaciones adicionales.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
            }),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            console.error('[generate-ai] OpenAI error:', response.status, err);
            return res.status(502).json({ error: `OpenAI error ${response.status}` });
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content ?? '';

        // Strip potential markdown code fences
        const cleaned = content.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();

        let sections: AISections;
        try {
            sections = JSON.parse(cleaned);
        } catch {
            console.error('[generate-ai] Failed to parse OpenAI response:', cleaned.slice(0, 200));
            return res.status(502).json({ error: 'Invalid AI response format' });
        }

        const inputTokens: number = data.usage?.prompt_tokens ?? 0;
        const outputTokens: number = data.usage?.completion_tokens ?? 0;
        const usage: AIUsage = {
            inputTokens,
            outputTokens,
            totalTokens: data.usage?.total_tokens ?? 0,
            costUsd: inputTokens * GPT4O_INPUT_COST_PER_TOKEN + outputTokens * GPT4O_OUTPUT_COST_PER_TOKEN,
        };

        return res.status(200).json({ sections, usage });
    } catch (err) {
        console.error('[generate-ai] Unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
