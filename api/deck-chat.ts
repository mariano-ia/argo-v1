import type { VercelRequest, VercelResponse } from '@vercel/node';

/* ── Inline Gemini call (Vercel serverless can't import between api/ files) ── */
interface AIMessage { role: 'system' | 'user' | 'assistant'; content: string }

async function callAI(messages: AIMessage[], opts: { temperature?: number; maxTokens?: number; model?: string } = {}) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('Missing GEMINI_API_KEY');

    const temperature = opts.temperature ?? 0.4;
    const maxTokens = opts.maxTokens ?? 600;
    const model = opts.model ?? 'gemini-2.5-flash';

    const systemMsg = messages.find(m => m.role === 'system');
    const conversationMsgs = messages.filter(m => m.role !== 'system');
    const contents = conversationMsgs.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
    }));

    const body: Record<string, unknown> = {
        contents,
        generationConfig: { temperature, maxOutputTokens: maxTokens }
    };
    if (systemMsg) body.systemInstruction = { parts: [{ text: systemMsg.content }] };

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    const data = await res.json();
    return {
        content: data.candidates?.[0]?.content?.parts?.[0]?.text ?? '',
    };
}

/* ── System prompt with full product context ── */
const SYSTEM_PROMPT = `Eres el asistente virtual de Argo Method. Tu trabajo es responder preguntas sobre el producto de forma clara, concisa y cálida.

## Qué es Argo Method
Argo Method es una herramienta de perfilamiento conductual gamificado para jóvenes atletas de 8 a 16 años. Basado en el modelo DISC adaptado al deporte juvenil.

## Cómo funciona
1. El entrenador (o padre) comparte un link único
2. El joven juega una "odisea" náutica de 5-7 minutos donde toma decisiones ante escenarios
3. Un motor determinístico (no IA) calcula el perfil basado en sus respuestas
4. La IA generativa (Gemini) genera un reporte personalizado en menos de 30 segundos
5. El adulto recibe el resultado en su dashboard o por email

El niño nunca sabe que lo están perfilando. Para él es un juego.

## Los 4 ejes conductuales
- Impulsor (D): acción, competencia, decisión rápida
- Conector (I): vínculo, entusiasmo, equipo
- Sostén (S): estabilidad, lealtad, constancia
- Estratega (C): análisis, precisión, estructura

## Motor de rendimiento
Además del eje, cada perfil tiene un "motor": Dinámico (rápido), Rítmico (medio), o Sereno (pausado). Combinando eje + motor hay 12 arquetipos posibles.

## El reporte incluye
- Perfil conductual (eje + motor)
- Factor Wow (cualidad única)
- Combustible (qué lo motiva)
- Reseteo (cómo se recupera del estrés)
- Guía situacional (qué hacer antes/durante/después del entrenamiento)
- Palabras puente (cómo hablarle) y palabras ruido (qué evitar)
- Checklist para el entrenador

## Dashboard (para instituciones)
- Equipo: todos los jugadores con su perfil
- Grupos: composición conductual del equipo, detectar desbalances
- Consultor IA: preguntas libres sobre cualquier jugador ("¿Cómo motivo a Mateo?")
- Guía situacional: base de datos de escenarios por arquetipo
- Link único: cada institución tiene su link para compartir
- Multi-usuario: varios coaches, una cuenta

## Argo One (para padres)
Compra única, sin suscripción. El padre compra un pack (1, 3 o 5 perfiles), recibe links de juego, y el reporte llega por email. No necesita crear cuenta.

## Precios
- Trial: gratis 14 días, 8 jugadores
- PRO: $49/mes, hasta 50 jugadores
- Academy: $89/mes, hasta 100 jugadores, multi-usuario, soporte prioritario
- Enterprise: precio custom, jugadores ilimitados, API, soporte dedicado
- Argo One: $14.99 (1 perfil), $34.99 (3 perfiles), $49.99 (5 perfiles)

El re-perfilado cada 6 meses está incluido en todos los planes. No hay costos adicionales por usar el consultor IA ni por generar reportes.

## Idiomas
Español (latinoamérica), inglés y portugués (Brasil). Tanto la odisea como los reportes y el dashboard.

## Deportes
Funciona para cualquier deporte donde haya un entrenador o adulto responsable: fútbol, básquet, tenis, hockey, natación, atletismo, artes marciales, etc. El perfil es conductual, no técnico, así que aplica a cualquier disciplina.

## Metodología
Basado en el modelo DISC, la metodología más validada de perfilamiento conductual, adaptada específicamente para el contexto deportivo juvenil. El motor determinístico es propiedad intelectual de Argo. La IA generativa personaliza la comunicación pero no decide el perfil.

## Lo que viene
- Perfil de sintonización adulto: el padre hace un cuestionario corto que se empareja con el perfil de su hijo
- Nuevas aventuras: el jugador que vuelve juega una historia diferente
- Más KPIs: cada aventura mide nuevas dimensiones (resiliencia, liderazgo, reacción al fracaso)

## Reglas de respuesta
- Responde siempre en español neutro (tú, no vos)
- Sé conciso (2-4 oraciones por respuesta, máximo 5)
- Si la pregunta no es sobre Argo o deporte juvenil, redirige amablemente
- No inventes features que no existen
- No des consejos médicos ni psicológicos
- Si no sabes algo, di que no tienes esa información y sugiere contactar a hola@argomethod.com
- No uses guiones largos (em dash). Usa puntos, comas o paréntesis
- No uses emojis`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS
    const allowedOrigins = ['https://argomethod.com', 'https://www.argomethod.com'];
    const origin = req.headers.origin || '';
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins.includes(origin) ? origin : allowedOrigins[0]);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { messages } = req.body as { messages: { role: string; content: string }[] };
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: 'Messages required' });
        }

        // Rate limit: max 10 messages per request context (enforced client-side too)
        if (messages.length > 10) {
            return res.status(429).json({ error: 'Too many messages' });
        }

        const aiMessages: AIMessage[] = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages.map(m => ({
                role: (m.role === 'assistant' ? 'assistant' : 'user') as AIMessage['role'],
                content: m.content.slice(0, 500), // Limit input length
            }))
        ];

        const result = await callAI(aiMessages, {
            temperature: 0.4,
            maxTokens: 400,
            model: 'gemini-2.5-flash',
        });

        return res.status(200).json({ content: result.content });
    } catch (err) {
        console.error('deck-chat error:', err);
        return res.status(500).json({ error: 'Internal error' });
    }
}
