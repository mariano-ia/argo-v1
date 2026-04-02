import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * One-time fix: completes truncated blog posts.
 * GET /api/blog-fix-truncated
 * Delete this file after running it once.
 */

interface AIMessage { role: 'system' | 'user' | 'assistant'; content: string; }

async function callAI(messages: AIMessage[], opts: { temperature?: number; maxTokens?: number } = {}) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('Missing GEMINI_API_KEY');
    const systemMsg = messages.find(m => m.role === 'system');
    const conversationMsgs = messages.filter(m => m.role !== 'system');
    const contents = conversationMsgs.map(m => ({ role: 'user', parts: [{ text: m.content }] }));
    const body: Record<string, unknown> = {
        contents,
        generationConfig: { temperature: opts.temperature ?? 0.4, maxOutputTokens: opts.maxTokens ?? 4000 },
    };
    if (systemMsg) body.systemInstruction = { parts: [{ text: systemMsg.content }] };
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Gemini error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Fetch all published posts
    const { data: posts } = await supabase
        .from('blog_posts')
        .select('id, slug, lang, title, content')
        .eq('status', 'published');

    if (!posts) return res.status(500).json({ error: 'Failed to fetch posts' });

    const truncated = posts.filter(p => !p.content.trim().endsWith('>'));
    if (truncated.length === 0) {
        return res.status(200).json({ message: 'No truncated posts found', total: posts.length });
    }

    const results = [];

    for (const post of truncated) {
        const content = post.content.trim();
        const tail = content.slice(-2000);
        const langLabel = post.lang === 'pt' ? 'portugues brasileiro' : post.lang === 'en' ? 'English' : 'espanol latinoamericano neutro (tuteo, nunca voseo)';

        try {
            const completion = await callAI([
                {
                    role: 'system',
                    content: `Eres editor de Argo Method (perfilamiento conductual DISC para deportistas juveniles 8-16 anos). Recibes el FINAL de un articulo HTML que fue cortado abruptamente. Tu trabajo: completa SOLO lo que falta. Cierra la oracion cortada, agrega 1-2 parrafos de cierre (reflexion o invitacion a la accion), y cierra todos los tags HTML abiertos (</li>, </ul>, </p>, etc). Devuelve SOLO el fragmento faltante, NO repitas lo que ya existe. Idioma: ${langLabel}. Usa lenguaje de probabilidad. No uses guiones largos. No uses terminologia clinica.`,
                },
                {
                    role: 'user',
                    content: `Estas son las ultimas lineas del articulo "${post.title}" (esta cortado, falta el final):\n\n${tail}`,
                },
            ], { temperature: 0.4, maxTokens: 2000 });

            const trimmed = completion.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();

            if (trimmed.length > 10) {
                const fixed = content + trimmed;
                await supabase.from('blog_posts').update({ content: fixed }).eq('id', post.id);
                results.push({ id: post.id, slug: post.slug, lang: post.lang, added: trimmed.length, status: 'fixed' });
            } else {
                results.push({ id: post.id, slug: post.slug, lang: post.lang, status: 'no_completion' });
            }
        } catch (err) {
            results.push({ id: post.id, slug: post.slug, lang: post.lang, status: 'error', error: (err as Error).message });
        }
    }

    return res.status(200).json({ total: posts.length, truncated: truncated.length, results });
}
