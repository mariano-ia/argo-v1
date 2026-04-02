import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * On-demand blog generation from natural language.
 * POST { idea: "Como un entrenador puede usar perfiles para armar equipos" }
 *
 * Generates ES first, then translates to EN/PT (cheaper than regenerating).
 */

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

    const { idea } = req.body;
    if (!idea || typeof idea !== 'string' || idea.trim().length < 5) {
        return res.status(400).json({ error: 'idea is required (min 5 chars)' });
    }

    try {
        const baseUrl = process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : process.env.SITE_URL ?? 'https://argomethod.com';

        // Step 1: Generate Spanish (full generation + humanization)
        const esRes = await fetch(`${baseUrl}/api/blog-generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: idea.trim(),
                lang: 'es',
                auto_publish: true,
            }),
        });

        if (!esRes.ok) {
            const err = await esRes.text();
            return res.status(500).json({ error: `ES generation failed: ${err}` });
        }

        const esResult = await esRes.json();
        const langGroup = esResult.lang_group;

        const results = [{ lang: 'es', post_id: esResult.post_id, slug: esResult.slug, title: esResult.title }];

        // Step 2: Fetch the Spanish post content for translation mode
        const sb = createClient(
            process.env.VITE_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
        );
        const { data: esPost } = await sb
            .from('blog_posts')
            .select('title, meta_description, content, category, tags')
            .eq('id', esResult.post_id)
            .single();

        // Step 3: Translate to EN and PT in parallel (skips humanization, much cheaper)
        const otherLangs = ['en', 'pt'] as const;
        const otherResults = await Promise.allSettled(
            otherLangs.map(async (lang) => {
                const r = await fetch(`${baseUrl}/api/blog-generate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prompt: idea.trim(),
                        lang,
                        lang_group: langGroup,
                        auto_publish: true,
                        // Translation mode: pass Spanish content to adapt
                        source_content: esPost?.content,
                        source_title: esPost?.title,
                        source_meta: esPost?.meta_description,
                        source_category: esPost?.category,
                        source_tags: esPost?.tags,
                    }),
                });
                if (!r.ok) throw new Error(`${lang} generation failed: ${await r.text()}`);
                return r.json();
            })
        );

        for (let i = 0; i < otherLangs.length; i++) {
            const result = otherResults[i];
            if (result.status === 'fulfilled') {
                results.push({
                    lang: otherLangs[i],
                    post_id: result.value.post_id,
                    slug: result.value.slug,
                    title: result.value.title,
                });
            } else {
                console.error(`blog-now ${otherLangs[i]} failed:`, result.reason);
            }
        }

        // Trigger Vercel redeploy so new posts get pre-rendered HTML
        const deployHook = process.env.VERCEL_DEPLOY_HOOK_URL;
        if (deployHook) {
            fetch(deployHook, { method: 'POST' }).catch(e => console.error('Deploy hook failed:', e));
        }

        return res.status(200).json({ lang_group: langGroup, results });
    } catch (err) {
        console.error('blog-now error:', err);
        return res.status(500).json({ error: (err as Error).message });
    }
}
