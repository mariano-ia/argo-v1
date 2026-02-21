import { ReportData } from './argosEngine';

export interface ReportContext {
    nombre: string;
    deporte: string;
    edad: number;
    destinatario: 'padre' | 'entrenador';
}

// Sections the AI rewrites (narrative)
export interface AISections {
    wow: string;
    motorDesc: string;
    combustible: string;
    corazon: string;
    reseteo: string;
    ecos: string;
    checklist: { antes: string; durante: string; despues: string };
}

export interface AIUsage {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    costUsd: number;
}

export interface AIResult {
    sections: AISections;
    usage: AIUsage;
}

const WRITING_RULES = `
REGLAS DE REDACCIÓN OBLIGATORIAS (Método Argo):
1. CONDICIONAL SIEMPRE: Usa "tiende a...", "es probable que...", "podría sentirse más cómodo...". NUNCA afirmaciones absolutas.
2. SIN ETIQUETAS RÍGIDAS: Evita diagnósticos o sentencias definitivas. Esto describe tendencias presentes, no identidad fija.
3. VOCABULARIO PROHIBIDO — jamás uses estas palabras: control, dominación, agresividad, confrontación, rígido, estructurado (en sentido negativo), lento, pesado, débil, inseguro.
4. VOCABULARIO POSITIVO por eje:
   - D (Dominancia) → "Energía de Impulso", iniciativa, coraje, proponer desafíos
   - I (Influencia) → "Energía Conectora", motivar, integrar, alegría al juego
   - S (Estabilidad) → "Energía de Sostén", lealtad, constancia, pilar de confianza
   - C (Cumplimiento) → "Energía Estratega", atención al detalle, calidad, excelencia
5. TONO: Profesional pero cálido. No clínico, no infantil.
6. FOCO: Bienestar y disfrute deportivo, no rendimiento ni éxito.
7. LOS "EVITAR" deben redactarse como condiciones de entorno para que el niño brille, no como errores del niño.
8. Personaliza con el nombre del deportista y el deporte específico con ejemplos concretos del deporte mencionado.
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

TAREA: Reescribe las siguientes secciones personalizando con el deporte "${ctx.deporte}" y la edad de ${ctx.edad} años. Incluye ejemplos específicos del deporte (jugadas, momentos del partido, situaciones de entrenamiento propias de ${ctx.deporte}). Mantén la esencia del arquetipo pero hacé el texto único para este perfil.

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

// GPT-4o pricing (per token)
const GPT4O_INPUT_COST_PER_TOKEN = 2.50 / 1_000_000;
const GPT4O_OUTPUT_COST_PER_TOKEN = 10.00 / 1_000_000;

export async function generateAISections(
    base: ReportData,
    ctx: ReportContext
): Promise<AIResult> {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
    if (!apiKey) throw new Error('VITE_OPENAI_API_KEY no está configurada');

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
                    content: buildPrompt(base, ctx),
                },
            ],
        }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(`OpenAI error ${response.status}: ${JSON.stringify(err)}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '';

    // Strip potential markdown code fences
    const cleaned = content.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();

    const sections: AISections = JSON.parse(cleaned);

    const inputTokens: number = data.usage?.prompt_tokens ?? 0;
    const outputTokens: number = data.usage?.completion_tokens ?? 0;
    const usage: AIUsage = {
        inputTokens,
        outputTokens,
        totalTokens: data.usage?.total_tokens ?? 0,
        costUsd: inputTokens * GPT4O_INPUT_COST_PER_TOKEN + outputTokens * GPT4O_OUTPUT_COST_PER_TOKEN,
    };

    return { sections, usage };
}
