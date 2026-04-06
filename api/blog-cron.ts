import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ─── Inline AI provider ────────────────────────────────────────────────────

interface AIMessage { role: 'system' | 'user' | 'assistant'; content: string; }
interface AIResponse { content: string; inputTokens: number; outputTokens: number; totalTokens: number; }

async function callAI(messages: AIMessage[], opts: { temperature?: number; maxTokens?: number; model?: string; jsonMode?: boolean } = {}): Promise<AIResponse> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('Missing GEMINI_API_KEY');
    const temperature = opts.temperature ?? 0.7;
    const maxTokens = opts.maxTokens ?? 4000;
    const model = opts.model ?? 'gemini-2.5-flash';

    const systemMsg = messages.find(m => m.role === 'system');
    const conversationMsgs = messages.filter(m => m.role !== 'system');
    const contents = conversationMsgs.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
    const genConfig: Record<string, unknown> = { temperature, maxOutputTokens: maxTokens };
    if (opts.jsonMode) genConfig.responseMimeType = 'application/json';
    const body: Record<string, unknown> = { contents, generationConfig: genConfig };
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

// ─── Content pillars for autonomous topic generation ────────────────────────

const PILLARS = [
    { pillar: 'arquetipos', weight: 25, audiences: ['coaches', 'padres'], formats: ['guia', 'analisis', 'caso'] },
    { pillar: 'coaching', weight: 20, audiences: ['coaches'], formats: ['guia', 'opinion', 'caso'] },
    { pillar: 'padres', weight: 20, audiences: ['padres'], formats: ['guia', 'opinion', 'caso'] },
    { pillar: 'disc', weight: 15, audiences: ['coaches', 'padres', 'instituciones'], formats: ['analisis', 'guia', 'comparativa'] },
    { pillar: 'deporte', weight: 10, audiences: ['coaches', 'padres'], formats: ['opinion', 'analisis'] },
    { pillar: 'motivacion', weight: 10, audiences: ['padres', 'coaches'], formats: ['guia', 'caso', 'opinion'] },
];

const ARCHETYPES = [
    'impulsor_dinamico', 'impulsor_decidido', 'impulsor_persistente',
    'conector_expresivo', 'conector_armonico', 'conector_profundo',
    'sosten_adaptable', 'sosten_estable', 'sosten_reflexivo',
    'estratega_agil', 'estratega_preciso', 'estratega_cauteloso',
];

const ARCHETYPE_LABELS: Record<string, string> = {
    impulsor_dinamico: 'Impulsor Dinamico', impulsor_decidido: 'Impulsor Decidido', impulsor_persistente: 'Impulsor Persistente',
    conector_expresivo: 'Conector Expresivo', conector_armonico: 'Conector Armonico', conector_profundo: 'Conector Profundo',
    sosten_adaptable: 'Sosten Adaptable', sosten_estable: 'Sosten Estable', sosten_reflexivo: 'Sosten Reflexivo',
    estratega_agil: 'Estratega Agil', estratega_preciso: 'Estratega Preciso', estratega_cauteloso: 'Estratega Cauteloso',
};

// ─── Topic idea generation ──────────────────────────────────────────────────

async function generateTopicIdea(
    pillar: string,
    audience: string,
    format: string,
    archetype: string | null,
    recentTitles: string[],
): Promise<{ title: string; description: string }> {
    const archetypeContext = archetype ? `\nIncluye referencia al arquetipo "${ARCHETYPE_LABELS[archetype] ?? archetype}".` : '';
    const recentList = recentTitles.length > 0 ? `\n\nTemas ya publicados (NO repitas):\n- ${recentTitles.join('\n- ')}` : '';

    const prompt = `Genera UNA idea de articulo para el blog de Argo Method (perfilamiento conductual DISC para deportistas juveniles 8-16 anos).

Pilar: ${pillar}
Audiencia: ${audience}
Formato: ${format}${archetypeContext}${recentList}

Responde SOLO un JSON: {"title": "titulo concreto y atractivo", "description": "descripcion de 1-2 oraciones de que cubriria el articulo"}
Sin backticks ni texto adicional.`;

    const response = await callAI([
        { role: 'user', content: prompt },
    ], { temperature: 0.9, maxTokens: 1500, jsonMode: true });

    const cleaned = response.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    // Extract JSON object even if surrounded by extra text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON object found in response');
    return JSON.parse(jsonMatch[0]);
}

// ─── Seed topics into the queue ─────────────────────────────────────────────

async function seedTopicsIfNeeded(): Promise<{ seeded: number; errors: string[] }> {
    const seedErrors: string[] = [];
    // Check how many pending topics exist
    const { count } = await supabase
        .from('blog_topics')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

    const pendingCount = count ?? 0;
    if (pendingCount >= 10) return { seeded: 0, errors: [] }; // enough topics in queue

    // Get recent posts to avoid duplication
    const { data: recentPosts } = await supabase
        .from('blog_posts')
        .select('title')
        .order('created_at', { ascending: false })
        .limit(20);
    const recentTitles = (recentPosts ?? []).map(p => p.title);

    // Get recently used pillars and archetypes to force variety
    const { data: recentTopics } = await supabase
        .from('blog_topics')
        .select('pillar, archetype_ref, audience, format')
        .order('created_at', { ascending: false })
        .limit(10);

    const recentPillars = (recentTopics ?? []).map(t => t.pillar);
    const recentArchetypes = (recentTopics ?? []).map(t => t.archetype_ref).filter(Boolean);

    // Generate 5 new topics
    const topicsToSeed = 5;
    for (let i = 0; i < topicsToSeed; i++) {
        // Weighted pillar selection, deprioritize recent ones
        const availablePillars = PILLARS.map(p => ({
            ...p,
            effectiveWeight: p.weight * (recentPillars.filter(r => r === p.pillar).length > 1 ? 0.3 : 1),
        }));
        const totalWeight = availablePillars.reduce((s, p) => s + p.effectiveWeight, 0);
        let rand = Math.random() * totalWeight;
        let selectedPillar = availablePillars[0];
        for (const p of availablePillars) {
            rand -= p.effectiveWeight;
            if (rand <= 0) { selectedPillar = p; break; }
        }

        const audience = selectedPillar.audiences[Math.floor(Math.random() * selectedPillar.audiences.length)];
        const format = selectedPillar.formats[Math.floor(Math.random() * selectedPillar.formats.length)];

        // Pick archetype if relevant, avoiding recent ones
        let archetype: string | null = null;
        if (['arquetipos', 'coaching', 'padres'].includes(selectedPillar.pillar) && Math.random() > 0.3) {
            const unused = ARCHETYPES.filter(a => !recentArchetypes.includes(a));
            const pool = unused.length > 0 ? unused : ARCHETYPES;
            archetype = pool[Math.floor(Math.random() * pool.length)];
        }

        try {
            const idea = await generateTopicIdea(selectedPillar.pillar, audience, format, archetype, recentTitles);

            // Assign relevance score (pillar weight + random variance)
            const relevance = Math.min(100, selectedPillar.weight * 2 + Math.floor(Math.random() * 30));

            await supabase.from('blog_topics').insert({
                title: idea.title,
                description: idea.description,
                pillar: selectedPillar.pillar,
                audience,
                format,
                archetype_ref: archetype,
                relevance_score: relevance,
                status: 'pending',
                lang: 'es',
                source: 'pillar',
            });

            recentTitles.push(idea.title);
            recentPillars.push(selectedPillar.pillar);
            if (archetype) recentArchetypes.push(archetype);
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error(`Failed to seed topic ${i}:`, msg);
            seedErrors.push(`topic_${i}: ${msg.slice(0, 200)}`);
        }
    }

    const { count: newCount } = await supabase
        .from('blog_topics')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

    return { seeded: (newCount ?? 0) - pendingCount, errors: seedErrors };
}

// ─── Pick the best topic and trigger generation ─────────────────────────────

const ALL_LANGS = ['es', 'en', 'pt'] as const;

async function unstickGeneratingTopics(): Promise<number> {
    // Reset topics stuck in "generating" from failed previous runs.
    // Cron runs every 3-4 days, so any "generating" topic at start is definitely stuck.
    const { data } = await supabase
        .from('blog_topics')
        .update({ status: 'pending' })
        .eq('status', 'generating')
        .select('id');
    return data?.length ?? 0;
}

async function pickAndGenerate(): Promise<{ generated: boolean; topic?: string; results?: { lang: string; post_id: string }[]; unstuck?: number }> {
    // First: unstick any topics from failed previous runs
    const unstuck = await unstickGeneratingTopics();

    // Get highest-relevance pending topic
    const { data: topics } = await supabase
        .from('blog_topics')
        .select('*')
        .eq('status', 'pending')
        .order('relevance_score', { ascending: false })
        .limit(1);

    if (!topics || topics.length === 0) {
        return { generated: false, unstuck };
    }

    const topic = topics[0];

    // Mark as generating
    await supabase.from('blog_topics').update({ status: 'generating' }).eq('id', topic.id);

    const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.SITE_URL ?? 'https://argomethod.com';

    const prompt = `${topic.title}. ${topic.description ?? ''}`;

    // Generate Spanish first (primary, linked to topic)
    const esRes = await fetch(`${baseUrl}/api/blog-generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            prompt,
            pillar: topic.pillar,
            audience: topic.audience,
            format: topic.format,
            archetype_ref: topic.archetype_ref,
            lang: 'es',
            topic_id: topic.id,
            auto_publish: true,
        }),
    });

    if (!esRes.ok) {
        const err = await esRes.text();
        console.error('blog-generate ES failed:', err);
        await supabase.from('blog_topics').update({ status: 'pending' }).eq('id', topic.id);
        return { generated: false };
    }

    const esResult = await esRes.json();
    const langGroup = esResult.lang_group;
    const results = [{ lang: 'es', post_id: esResult.post_id }];

    // Fetch Spanish content for translation mode (cheaper than regenerating)
    const { data: esPost } = await supabase
        .from('blog_posts')
        .select('title, meta_description, content, category, tags')
        .eq('id', esResult.post_id)
        .single();

    // Translate to en and pt in parallel (skips humanization, ~40% cheaper)
    const otherLangs = ALL_LANGS.filter(l => l !== 'es');
    const otherResults = await Promise.allSettled(
        otherLangs.map(async (lang) => {
            const r = await fetch(`${baseUrl}/api/blog-generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    pillar: topic.pillar,
                    audience: topic.audience,
                    format: topic.format,
                    archetype_ref: topic.archetype_ref,
                    lang,
                    lang_group: langGroup,
                    auto_publish: true,
                    source_content: esPost?.content,
                    source_title: esPost?.title,
                    source_meta: esPost?.meta_description,
                    source_category: esPost?.category,
                    source_tags: esPost?.tags,
                }),
            });
            if (!r.ok) throw new Error(`${lang}: ${await r.text()}`);
            return r.json();
        })
    );

    for (let i = 0; i < otherLangs.length; i++) {
        const result = otherResults[i];
        if (result.status === 'fulfilled') {
            results.push({ lang: otherLangs[i], post_id: result.value.post_id });
        } else {
            console.error(`blog-cron ${otherLangs[i]} failed:`, result.reason);
        }
    }

    return { generated: true, topic: topic.title, results, unstuck };
}

// ─── HTTP handler ───────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Verify cron secret (Vercel sends this for cron jobs)
    const authHeader = req.headers.authorization;
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        // Step 1: Ensure topic queue has ideas
        const seedResult = await seedTopicsIfNeeded();

        // Step 2: Pick best topic and generate + publish
        const result = await pickAndGenerate();

        // Step 3: Trigger Vercel redeploy so new posts get pre-rendered HTML
        if (result.generated) {
            const deployHook = process.env.VERCEL_DEPLOY_HOOK_URL;
            if (deployHook) {
                fetch(deployHook, { method: 'POST' }).catch(e => console.error('Deploy hook failed:', e));
            }
        }

        return res.status(200).json({
            ok: true,
            seed: seedResult,
            ...result,
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        console.error('blog-cron error:', err);
        // Safety net: reset any topics stuck in "generating" so next run can retry
        await supabase.from('blog_topics').update({ status: 'pending' }).eq('status', 'generating');
        return res.status(500).json({ error: (err as Error).message });
    }
}
