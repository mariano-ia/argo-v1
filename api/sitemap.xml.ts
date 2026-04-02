import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(_req: VercelRequest, res: VercelResponse) {
    const baseUrl = 'https://argomethod.com';

    const CATEGORIES = ['arquetipos', 'coaching', 'padres', 'disc', 'deporte', 'motivacion'];

    // Static pages
    const staticPages = [
        { loc: '/', changefreq: 'weekly', priority: '1.0' },
        { loc: '/blog', changefreq: 'daily', priority: '0.9' },
        ...CATEGORIES.map(c => ({ loc: `/blog/category/${c}`, changefreq: 'weekly' as const, priority: '0.6' })),
        { loc: '/pricing', changefreq: 'monthly', priority: '0.8' },
        { loc: '/terms', changefreq: 'yearly', priority: '0.3' },
        { loc: '/privacy', changefreq: 'yearly', priority: '0.3' },
    ];

    // Dynamic blog posts with language variants
    const { data: posts } = await supabase
        .from('blog_posts')
        .select('slug, lang, lang_group, published_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

    const allPosts = posts ?? [];

    // Group posts by lang_group for hreflang linking
    const langGroups = new Map<string, { lang: string; slug: string }[]>();
    for (const p of allPosts) {
        if (p.lang_group) {
            const group = langGroups.get(p.lang_group) ?? [];
            group.push({ lang: p.lang, slug: p.slug });
            langGroups.set(p.lang_group, group);
        }
    }

    // Build blog entries with hreflang
    const blogEntries = allPosts.map(p => {
        const lastmod = p.published_at ? new Date(p.published_at).toISOString().split('T')[0] : undefined;
        const alternates = p.lang_group ? (langGroups.get(p.lang_group) ?? []) : [];
        return { loc: `/blog/${p.slug}`, lastmod, changefreq: 'monthly', priority: '0.8', alternates };
    });

    // Build XML
    const staticXml = staticPages.map(p => `  <url>
    <loc>${baseUrl}${p.loc}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n');

    const blogXml = blogEntries.map(p => {
        const altLinks = p.alternates.length > 1
            ? p.alternates.map(a =>
                `\n    <xhtml:link rel="alternate" hreflang="${a.lang}" href="${baseUrl}/blog/${a.slug}"/>`
            ).join('')
            : '';
        return `  <url>
    <loc>${baseUrl}${p.loc}</loc>${p.lastmod ? `\n    <lastmod>${p.lastmod}</lastmod>` : ''}
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>${altLinks}
  </url>`;
    }).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${staticXml}
${blogXml}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(xml);
}
