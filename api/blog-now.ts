import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * On-demand blog generation from natural language.
 * POST { idea: "Como un entrenador puede usar perfiles para armar equipos" }
 *
 * Generates 3 versions (es, en, pt) linked by lang_group, publishes all.
 */

const LANGS = ['es', 'en', 'pt'] as const;

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

        // Generate Spanish first to get the lang_group UUID
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

        // Generate en and pt in parallel, sharing the same lang_group
        const otherLangs = LANGS.filter(l => l !== 'es');
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
