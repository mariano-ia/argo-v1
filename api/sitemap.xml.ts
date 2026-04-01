import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(_req: VercelRequest, res: VercelResponse) {
    const baseUrl = 'https://argomethod.com';

    // Static pages
    const staticPages = [
        { loc: '/', changefreq: 'weekly', priority: '1.0' },
        { loc: '/blog', changefreq: 'daily', priority: '0.9' },
        { loc: '/app', changefreq: 'monthly', priority: '0.7' },
    ];

    // Dynamic blog posts
    const { data: posts } = await supabase
        .from('blog_posts')
        .select('slug, published_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

    const blogEntries = (posts ?? []).map(p => ({
        loc: `/blog/${p.slug}`,
        lastmod: p.published_at ? new Date(p.published_at).toISOString().split('T')[0] : undefined,
        changefreq: 'monthly',
        priority: '0.8',
    }));

    const allPages = [...staticPages, ...blogEntries];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(p => `  <url>
    <loc>${baseUrl}${p.loc}</loc>${p.lastmod ? `\n    <lastmod>${p.lastmod}</lastmod>` : ''}
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(xml);
}
