import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * On-demand blog generation from natural language.
 * POST { idea: "Como un entrenador puede usar perfiles para armar equipos" }
 *
 * Accepts a raw idea in natural language, generates and publishes immediately.
 * Thin wrapper over blog-generate — enriches the raw idea with context.
 */

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

    const { idea, lang } = req.body;
    if (!idea || typeof idea !== 'string' || idea.trim().length < 5) {
        return res.status(400).json({ error: 'idea is required (min 5 chars)' });
    }

    try {
        const baseUrl = process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : process.env.SITE_URL ?? 'https://argomethod.com';

        const genRes = await fetch(`${baseUrl}/api/blog-generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: idea.trim(),
                lang: lang ?? 'es',
                auto_publish: true,
            }),
        });

        if (!genRes.ok) {
            const err = await genRes.text();
            return res.status(500).json({ error: `Generation failed: ${err}` });
        }

        const result = await genRes.json();
        return res.status(200).json(result);
    } catch (err) {
        console.error('blog-now error:', err);
        return res.status(500).json({ error: (err as Error).message });
    }
}
