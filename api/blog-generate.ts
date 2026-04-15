import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ─── Inline AI provider (Vercel serverless can't import between api files) ──

interface AIMessage { role: 'system' | 'user' | 'assistant'; content: string; }
interface AIResponse { content: string; inputTokens: number; outputTokens: number; totalTokens: number; }

async function callAI(messages: AIMessage[], opts: { temperature?: number; maxTokens?: number; model?: string } = {}): Promise<AIResponse> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('Missing GEMINI_API_KEY');
    const temperature = opts.temperature ?? 0.7;
    const maxTokens = opts.maxTokens ?? 8000;
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

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Argo domain knowledge ──────────────────────────────────────────────────

const ARGO_ARCHETYPES = [
    { id: 'impulsor_dinamico', eje: 'D', motor: 'Rapido', label: 'Impulsor Dinamico', desc: 'Accion directa, resolucion inmediata. Chispa que inicia el movimiento.' },
    { id: 'impulsor_decidido', eje: 'D', motor: 'Medio', label: 'Impulsor Decidido', desc: 'Iniciativa estrategica, ejecucion con proposito.' },
    { id: 'impulsor_persistente', eje: 'D', motor: 'Lento', label: 'Impulsor Persistente', desc: 'Determinacion constante, resiliencia en el esfuerzo.' },
    { id: 'conector_expresivo', eje: 'I', motor: 'Rapido', label: 'Conector Expresivo', desc: 'Energia social contagiosa, comunicacion espontanea.' },
    { id: 'conector_armonico', eje: 'I', motor: 'Medio', label: 'Conector Armonico', desc: 'Puente entre personas, equilibrio emocional del grupo.' },
    { id: 'conector_profundo', eje: 'I', motor: 'Lento', label: 'Conector Profundo', desc: 'Vinculos selectivos y duraderos, empatia silenciosa.' },
    { id: 'sosten_adaptable', eje: 'S', motor: 'Rapido', label: 'Sosten Adaptable', desc: 'Flexibilidad con base firme, rapida lectura del entorno.' },
    { id: 'sosten_estable', eje: 'S', motor: 'Medio', label: 'Sosten Estable', desc: 'Pilar del equipo, consistencia y confianza.' },
    { id: 'sosten_reflexivo', eje: 'S', motor: 'Lento', label: 'Sosten Reflexivo', desc: 'Observador profundo, sostiene desde la calma.' },
    { id: 'estratega_agil', eje: 'C', motor: 'Rapido', label: 'Estratega Agil', desc: 'Analisis rapido, pensamiento tactico en tiempo real.' },
    { id: 'estratega_preciso', eje: 'C', motor: 'Medio', label: 'Estratega Preciso', desc: 'Metodico, busca la excelencia en cada detalle.' },
    { id: 'estratega_cauteloso', eje: 'C', motor: 'Lento', label: 'Estratega Cauteloso', desc: 'Planificacion profunda, calidad sobre velocidad.' },
];

const DISC_AXES = {
    D: { name: 'Impulsor', desc: 'Tendencia a la accion directa, toma de decisiones, liderazgo natural. Necesita impacto visible.' },
    I: { name: 'Conector', desc: 'Tendencia a la conexion social, comunicacion, entusiasmo. Necesita reconocimiento y pertenencia.' },
    S: { name: 'Sosten', desc: 'Tendencia a la estabilidad, lealtad, consistencia. Necesita seguridad y previsibilidad.' },
    C: { name: 'Estratega', desc: 'Tendencia al analisis, precision, planificacion. Necesita logica y estructura.' },
};

// ─── Brand voice system prompt ──────────────────────────────────────────────

const BRAND_VOICE_SYSTEM = `Eres el redactor senior de Argo Method, una herramienta de perfilamiento conductual para deportistas juveniles (8-16 anos) basada en el modelo DISC.

TU VOZ:
- Directa, calida, con opinion. No eres un chatbot generico.
- Hablas desde la experiencia de trabajo con entrenadores y padres.
- Tienes perspectiva propia: "En Argo creemos que...", "Hemos visto que..."
- Respetas la inteligencia del lector. No explicas lo obvio.
- Usas lenguaje simple pero no simplista. No condesciendes.

DOMINIO QUE DOMINAS (contenido unico de Argo):
- 12 arquetipos conductuales: ${ARGO_ARCHETYPES.map(a => `${a.label} (${a.desc})`).join('; ')}
- 4 ejes DISC: ${Object.entries(DISC_AXES).map(([k, v]) => `${v.name} (${k}): ${v.desc}`).join('; ')}
- 3 motores (ritmo de procesamiento): Rapido, Medio, Lento
- Combustible (motivacion), Corazon (intencion detras de la conducta), Palabras Puente/Ruido
- Contexto: deporte juvenil, psicologia deportiva infantil, comunicacion padre-hijo, dinamica de equipo

REGLAS DE ESCRITURA OBLIGATORIAS:
1. NUNCA empieces con "En el mundo del deporte...", "En el ambito de...", "Sabias que..?", "Hoy en dia...", "En la actualidad..."
2. NUNCA uses listas genericas de "5 tips para...". Si usas lista, que cada punto tenga profundidad y especificidad.
3. VARIA la estructura: algunos parrafos largos, otros cortos. No hagas todos iguales.
4. USA datos especificos de Argo (nombres de arquetipos, ejes, motores) cuando sea natural. Este contenido NO existe en otro lado.
5. INCLUYE perspectiva: no solo informes, opina. "Creemos que la etiqueta de 'hiperactivo' es una forma perezosa de describir a un Impulsor Dinamico".
6. USA lenguaje de probabilidad cuando hables de conducta: "tiende a", "es probable que", "suele". NUNCA "es", "siempre", "nunca" en referencia a conducta infantil.
7. Espanol latinoamericano neutro. Tuteo (NUNCA voseo argentino). Usa siempre "puedes", "tienes", "eres", "tu", "aqui".
8. NO uses guiones largos (— ni –). Usa puntos, comas o parentesis.
9. Genero inclusivo natural: alterna "el nino / la nina", usa "deportistas", "jugadores".
10. NUNCA uses terminologia clinica: no "trastorno", "deficit", "diagnostico", "patologia", "sindrome".

FORMATO DE SALIDA:
Devuelve un JSON con esta estructura exacta:
{
  "title": "titulo del articulo (50-70 chars, atractivo, con keyword natural)",
  "seo_title": "titulo SEO si es diferente del titulo principal (max 60 chars)",
  "slug": "slug-url-amigable",
  "meta_description": "descripcion para Google (150-160 chars, con call-to-action implicito)",
  "category": "una de: arquetipos, coaching, padres, disc, deporte, motivacion",
  "tags": ["3-5 tags relevantes"],
  "reading_time": numero_en_minutos,
  "content": "contenido completo en HTML semantico (h2, h3, p, strong, em, ul/li, blockquote)"
}

ESTRUCTURA DEL CONTENIDO HTML:
- Arranca con un parrafo gancho que atrape sin ser clickbait
- Usa <h2> para secciones principales (3-5 por articulo)
- Usa <h3> para subsecciones cuando sea natural
- Parrafos de largo variable (2-6 oraciones)
- Usa <blockquote> para frases destacadas o reflexiones
- Usa <strong> para conceptos clave, no para decorar
- Si hay lista, que sea con contenido sustancial por item
- Cierra con un parrafo de reflexion o invitacion a la accion (no un resumen). El ultimo parrafo debe ser una oracion COMPLETA, nunca dejes una idea a medias.
- Entre 1200 y 2000 palabras. Ni mas ni menos.
- NO incluyas el titulo (h1) en el contenido HTML, solo h2 en adelante.
- IMPORTANTE: Asegurate de que TODOS los tags HTML esten cerrados y que la ultima oracion este completa. Nunca cortes el texto a mitad de una idea.`;

// ─── Anti-AI humanizer prompt ───────────────────────────────────────────────

const HUMANIZER_SYSTEM = `Eres un editor experto. Tu trabajo es revisar un articulo y eliminar TODOS los signos de escritura generada por IA.

DETECTA Y CORRIGE estos patrones:
1. MULETILLAS DE APERTURA: "En el mundo de...", "En la actualidad...", "Es importante destacar que...", "Cabe mencionar que...", "Sin lugar a dudas..."
2. ESTRUCTURA PREDECIBLE: si todos los parrafos tienen el mismo largo, varia. Si hay patron "afirmacion + ejemplo + conclusion" en cada seccion, rompe.
3. TRANSICIONES ARTIFICIALES: "Ahora bien,", "Por otro lado,", "En este sentido,", "Dicho esto,", "Es por ello que..."
4. VOCABULARIO IA: "fundamental", "crucial", "holístico", "integral", "paradigma", "potenciar", "empoderar", "sinergia", "transformador", "robusto"
5. LISTAS DE TIPS GENERICOS: si los items de una lista podrian aplicar a cualquier contexto, hazlos mas especificos al dominio
6. FALTA DE OPINION: si el texto solo informa sin tomar posicion, agrega perspectiva editorial
7. EXCESO DE EM DASH (— o –): reemplaza con puntos, comas o parentesis
8. FRASES HECHAS: "no es casualidad que", "la realidad es que", "al final del dia", "en definitiva"
9. REGLA DE TRES: "inspira, motiva y transforma" — rompe estos patrones
10. EXCESO DE ADVERBIOS EN -MENTE: reduce a maximo 2 por parrafo

REGLAS:
- NO cambies el significado, solo la forma
- Mantiene el idioma original del texto intacto
- Si es espanol: mantiene latam neutro con tuteo (nunca voseo)
- Si es ingles o portugues: mantiene el idioma natural, no traduzcas
- Mantiene el HTML intacto (tags, estructura)
- Devuelve SOLO el HTML corregido, nada mas
- Si el texto ya es bueno, devuelvelo como esta`;

// ─── Internal link injection ────────────────────────────────────────────────

async function getExistingPosts(): Promise<{ slug: string; title: string; tags: string[] }[]> {
    const { data } = await supabase
        .from('blog_posts')
        .select('slug, title, tags')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(20);
    return data ?? [];
}

function injectInternalLinks(html: string, currentSlug: string, posts: { slug: string; title: string; tags: string[] }[]): string {
    const others = posts.filter(p => p.slug !== currentSlug);
    if (others.length === 0) return html;

    // Find up to 2 natural link insertion points
    let linksAdded = 0;
    const maxLinks = Math.min(2, others.length);

    for (const post of others) {
        if (linksAdded >= maxLinks) break;
        // Try to find a keyword from the post title in the content
        const keywords = post.title.split(' ').filter(w => w.length > 5).slice(0, 2);
        for (const keyword of keywords) {
            const regex = new RegExp(`(?<![<a][^>]*)(\\b${keyword}\\b)(?![^<]*<\\/a>)`, 'i');
            if (regex.test(html)) {
                html = html.replace(regex, `<a href="/blog/${post.slug}" title="${post.title}">$1</a>`);
                linksAdded++;
                break;
            }
        }
    }

    return html;
}

// ─── Estimate reading time ──────────────────────────────────────────────────

function estimateReadingTime(html: string): number {
    const text = html.replace(/<[^>]+>/g, '');
    const words = text.split(/\s+/).filter(Boolean).length;
    return Math.max(3, Math.ceil(words / 200));
}

// ─── Slugify ────────────────────────────────────────────────────────────────

function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

// ─── Main generation flow ───────────────────────────────────────────────────

interface GenerateInput {
    prompt: string;       // topic description or raw idea
    pillar?: string;
    audience?: string;
    format?: string;
    archetype_ref?: string;
    lang?: string;
    topic_id?: string;
    lang_group?: string;  // shared UUID linking translations
    source_content?: string; // Spanish HTML for translation mode (avoids full regeneration)
    source_title?: string;
    source_meta?: string;
    source_category?: string;
    source_tags?: string[];
}

interface GenerateResult {
    post_id: string;
    slug: string;
    title: string;
    status: string;
    lang: string;
    lang_group: string;
}

const LANG_INSTRUCTIONS: Record<string, string> = {
    es: 'Espanol latinoamericano neutro (tuteo). NUNCA voseo argentino.',
    en: 'English. Professional but warm. Adapt Argo terminology naturally: Impulsor=Driver, Conector=Connector, Sosten=Sustainer, Estratega=Strategist. Keep archetype names in Spanish with English translation in parentheses on first use.',
    pt: 'Portugues brasileiro. Tom profissional e acolhedor. Adapte a terminologia Argo naturalmente: Impulsor=Impulsionador, Conector=Conector, Sosten=Sustentador, Estratega=Estrategista. Mantenha os nomes dos arquetipos em espanhol com traducao em portugues na primeira mencao.',
};

async function generateBlogPost(input: GenerateInput, autoPublish: boolean): Promise<GenerateResult> {
    const lang = input.lang ?? 'es';
    const langGroup = input.lang_group ?? crypto.randomUUID();

    // Track AI cost across all calls
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    // Fetch recent posts to avoid duplication and enable internal linking
    const existingPosts = await getExistingPosts();
    const recentTitles = existingPosts.map(p => p.title).join('\n- ');

    // ── Translation mode: adapt existing Spanish content to target language ──
    const isTranslation = lang !== 'es' && input.source_content;

    let genResponse;

    if (isTranslation) {
        // Translation is much cheaper: ~40% fewer tokens than full generation
        const translatePrompt = `Adapta este articulo de blog de Argo Method al ${lang === 'en' ? 'ingles' : 'portugues brasileiro'}.

NO es una traduccion literal. El articulo debe sentirse nativo en ${lang === 'en' ? 'ingles' : 'portugues'}. Adapta expresiones, ejemplos y tono cultural.

${LANG_INSTRUCTIONS[lang]}

Titulo original: "${input.source_title}"
Meta description original: "${input.source_meta}"

Contenido HTML original:
${input.source_content}

Devuelve un JSON con esta estructura exacta:
{
  "title": "titulo adaptado al idioma (50-70 chars)",
  "seo_title": "titulo SEO si es diferente (max 60 chars)",
  "slug": "slug-en-el-idioma-del-articulo",
  "meta_description": "descripcion adaptada (150-160 chars)",
  "category": "${input.source_category || 'coaching'}",
  "tags": ${JSON.stringify(input.source_tags || [])},
  "reading_time": ${estimateReadingTime(input.source_content ?? '')},
  "content": "contenido HTML completo adaptado"
}

Devuelve SOLO el JSON, sin markdown ni backticks.`;

        genResponse = await callAI([
            { role: 'system', content: 'Eres un traductor y adaptador cultural experto para Argo Method (perfilamiento conductual DISC para deportistas juveniles). Mantiene la voz de marca, el lenguaje de probabilidad, y la terminologia Argo. Adapta nombres de arquetipos: en ingles usa traducciones entre parentesis en la primera mencion.' },
            { role: 'user', content: translatePrompt },
        ], { temperature: 0.5, maxTokens: 16000 });
        totalInputTokens += genResponse.inputTokens;
        totalOutputTokens += genResponse.outputTokens;
    } else {
        // Full generation mode (Spanish or no source content)
        let userPrompt = `Escribe un articulo de blog para Argo Method sobre:\n\n"${input.prompt}"`;

        if (input.pillar) userPrompt += `\n\nPilar tematico: ${input.pillar}`;
        if (input.audience) userPrompt += `\nAudiencia principal: ${input.audience}`;
        if (input.format) userPrompt += `\nFormato sugerido: ${input.format}`;
        if (input.archetype_ref) {
            const arch = ARGO_ARCHETYPES.find(a => a.id === input.archetype_ref);
            if (arch) userPrompt += `\n\nArquetipo de referencia: ${arch.label} (Eje ${arch.eje}, Motor ${arch.motor}). ${arch.desc}`;
        }

        if (recentTitles) {
            userPrompt += `\n\nARTICULOS YA PUBLICADOS (no repitas temas ni enfoques):\n- ${recentTitles}`;
        }

        userPrompt += `\n\nIdioma de escritura: ${LANG_INSTRUCTIONS[lang] || LANG_INSTRUCTIONS.es}`;
        userPrompt += `\n\nEl slug debe ser en el idioma del articulo.`;
        if (lang !== 'es') {
            userPrompt += `\nAdapta el contenido culturalmente, no hagas una traduccion literal. El articulo debe sentirse nativo en ${lang === 'en' ? 'ingles' : 'portugues'}.`;
        }
        userPrompt += `\n\nDevuelve SOLO el JSON, sin markdown ni backticks.`;

        genResponse = await callAI([
            { role: 'system', content: BRAND_VOICE_SYSTEM },
            { role: 'user', content: userPrompt },
        ], { temperature: 0.8, maxTokens: 16000 });
        totalInputTokens += genResponse.inputTokens;
        totalOutputTokens += genResponse.outputTokens;
    }

    // Parse JSON (with retry on failure)
    let article: {
        title: string;
        seo_title?: string;
        slug: string;
        meta_description: string;
        category: string;
        tags: string[];
        reading_time: number;
        content: string;
    };

    try {
        const cleaned = genResponse.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        article = JSON.parse(cleaned);
    } catch {
        // Retry once — re-send the same messages with stricter instruction
        const retryMessages = isTranslation
            ? [
                { role: 'system' as const, content: 'Eres un traductor y adaptador cultural experto para Argo Method. Devuelve SOLO JSON valido.' },
                { role: 'user' as const, content: genResponse.content + '\n\nEl texto anterior no es JSON valido. Extrae el contenido y devuelve SOLO un JSON valido con: title, seo_title, slug, meta_description, category, tags, reading_time, content. Sin backticks.' },
              ]
            : [
                { role: 'system' as const, content: BRAND_VOICE_SYSTEM },
                { role: 'user' as const, content: `Reescribe este articulo como JSON valido.\n\n${genResponse.content}\n\nIMPORTANTE: Devuelve JSON valido. Sin backticks, sin texto adicional.` },
              ];
        const retryResponse = await callAI(retryMessages, { temperature: 0.6, maxTokens: 16000 });
        totalInputTokens += retryResponse.inputTokens;
        totalOutputTokens += retryResponse.outputTokens;
        const cleaned = retryResponse.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        article = JSON.parse(cleaned);
    }

    // Step 1b: Validate content completeness — fix truncated endings
    const content = article.content.trim();
    const lastTag = content.lastIndexOf('</');
    const lastClose = content.lastIndexOf('>');
    const isTruncated = lastClose < lastTag || !content.endsWith('>');

    if (isTruncated) {
        // Content was cut off — ask AI to complete it
        const completionResponse = await callAI([
            { role: 'system', content: 'Eres un editor. Recibes un articulo HTML que fue cortado abruptamente. Completa SOLO la parte faltante (cierra la oracion, el parrafo y los tags HTML abiertos). Devuelve el articulo COMPLETO, no solo el fragmento faltante. Mantiene el mismo tono, idioma y estilo.' },
            { role: 'user', content: content },
        ], { temperature: 0.4, maxTokens: 4000 });
        totalInputTokens += completionResponse.inputTokens;
        totalOutputTokens += completionResponse.outputTokens;
        article.content = completionResponse.content.trim();
    }

    // Step 2: Humanize (skip for translations — source was already humanized)
    let humanizedContent: string;
    if (isTranslation) {
        humanizedContent = article.content.trim();
    } else {
        const humanizeResponse = await callAI([
            { role: 'system', content: HUMANIZER_SYSTEM },
            { role: 'user', content: article.content },
        ], { temperature: 0.4, maxTokens: 16000 });
        totalInputTokens += humanizeResponse.inputTokens;
        totalOutputTokens += humanizeResponse.outputTokens;
        humanizedContent = humanizeResponse.content.trim();
    }

    // Step 3: Internal links
    const slug = slugify(article.slug || article.title);
    const contentWithLinks = injectInternalLinks(humanizedContent, slug, existingPosts);

    // Step 4: Save to blog_posts
    const readingTime = article.reading_time || estimateReadingTime(contentWithLinks);
    const status = autoPublish ? 'published' : 'draft';
    const now = new Date().toISOString();

    const { data: post, error } = await supabase
        .from('blog_posts')
        .insert({
            title: article.title,
            seo_title: article.seo_title || null,
            slug,
            meta_description: article.meta_description,
            content: contentWithLinks,
            lang,
            status,
            category: article.category,
            tags: article.tags || [],
            reading_time: readingTime,
            generated_by: input.topic_id ? 'ai-cron' : 'ai-demand',
            topic_id: input.topic_id || null,
            lang_group: langGroup,
            ai_tokens_input: totalInputTokens,
            ai_tokens_output: totalOutputTokens,
            ai_cost_usd: totalInputTokens * (0.15 / 1_000_000) + totalOutputTokens * (0.60 / 1_000_000),
            published_at: status === 'published' ? now : null,
            created_at: now,
        })
        .select('id, slug')
        .single();

    if (error) throw new Error(`DB insert failed: ${error.message}`);

    // Step 5: Update topic if linked
    if (input.topic_id) {
        await supabase.from('blog_topics').update({
            status: autoPublish ? 'published' : 'generated',
            post_id: post.id,
            generated_at: now,
            published_at: autoPublish ? now : null,
        }).eq('id', input.topic_id);
    }

    return { post_id: post.id, slug, title: article.title, status, lang, lang_group: langGroup };
}

// ─── HTTP handler ───────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

    try {
        const { prompt, pillar, audience, format, archetype_ref, lang, topic_id, lang_group, auto_publish, source_content, source_title, source_meta, source_category, source_tags } = req.body;

        if (!prompt) return res.status(400).json({ error: 'prompt is required' });

        const result = await generateBlogPost(
            { prompt, pillar, audience, format, archetype_ref, lang, topic_id, lang_group, source_content, source_title, source_meta, source_category, source_tags },
            auto_publish ?? false,
        );

        return res.status(200).json(result);
    } catch (err) {
        console.error('blog-generate error:', err);
        return res.status(500).json({ error: (err as Error).message });
    }
}
