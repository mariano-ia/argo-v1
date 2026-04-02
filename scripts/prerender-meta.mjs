/**
 * Post-build meta tag injection for SEO pre-rendering.
 *
 * Reads dist/index.html as template, fetches blog posts from Supabase,
 * and generates route-specific HTML files with correct <head> meta tags.
 *
 * Runs after `vite build` as part of `npm run build`.
 * No puppeteer, no Chrome — just string replacement. Takes ~2 seconds.
 */

import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// ─── Config ─────────────────────────────────────────────────────────────────

const DIST = path.resolve('dist');
const BASE_URL = 'https://argomethod.com';
const OG_IMAGE = `${BASE_URL}/og-cover.png`;

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://luutdozbhinfiogugjbv.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const CATEGORIES = ['arquetipos', 'coaching', 'padres', 'disc', 'deporte', 'motivacion'];
const CAT_LABELS = {
    arquetipos: 'Arquetipos conductuales',
    coaching: 'Coaching deportivo',
    padres: 'Padres y deporte',
    disc: 'Modelo DISC',
    deporte: 'Deporte juvenil',
    motivacion: 'Motivacion deportiva',
};

// ─── Meta injection engine ──────────────────────────────────────────────────

function injectMeta(template, config) {
    let html = template;

    // Title
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(config.title)}</title>`);

    // Meta description
    html = html.replace(
        /<meta name="description" content="[^"]*"/,
        `<meta name="description" content="${esc(config.description)}"`,
    );

    // Canonical
    html = html.replace(
        /<link rel="canonical" href="[^"]*"/,
        `<link rel="canonical" href="${esc(config.canonical)}"`,
    );

    // OG tags
    html = html.replace(/<meta property="og:type" content="[^"]*"/, `<meta property="og:type" content="${config.ogType || 'website'}"`);
    html = html.replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${esc(config.canonical)}"`);
    html = html.replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${esc(config.title)}"`);
    html = html.replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${esc(config.description)}"`);
    if (config.ogLocale) {
        html = html.replace(/<meta property="og:locale" content="[^"]*"/, `<meta property="og:locale" content="${config.ogLocale}"`);
    }

    // Twitter
    html = html.replace(/<meta name="twitter:title" content="[^"]*"/, `<meta name="twitter:title" content="${esc(config.title)}"`);
    html = html.replace(/<meta name="twitter:description" content="[^"]*"/, `<meta name="twitter:description" content="${esc(config.description)}"`);

    // JSON-LD: replace all existing structured data blocks with route-specific ones
    if (config.jsonLd && config.jsonLd.length > 0) {
        // Remove existing JSON-LD blocks (between <!-- Structured Data --> and </head>)
        html = html.replace(
            /\s*<!-- Structured Data -->[\s\S]*?(?=<\/head>)/,
            '\n  <!-- Structured Data -->\n' +
            config.jsonLd.map(schema => `  <script type="application/ld+json">\n  ${JSON.stringify(schema, null, 2).split('\n').join('\n  ')}\n  </script>`).join('\n') +
            '\n',
        );
    }

    // Hreflang links (insert before </head>)
    if (config.hreflangs && config.hreflangs.length > 0) {
        const links = config.hreflangs
            .map(h => `  <link rel="alternate" hreflang="${h.lang}" href="${h.href}" />`)
            .join('\n');
        html = html.replace('</head>', `${links}\n</head>`);
    }

    return html;
}

function esc(str) {
    return (str || '').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function writePage(routePath, html) {
    const dir = path.join(DIST, routePath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf-8');
}

// ─── Static route definitions ───────────────────────────────────────────────

function getStaticRoutes() {
    const routes = [];

    // /blog
    routes.push({
        path: '/blog',
        meta: {
            title: 'Blog | Argo Method — Perfilamiento conductual DISC',
            description: 'Articulos sobre perfilamiento conductual DISC, coaching deportivo juvenil y herramientas para entrenadores y padres.',
            canonical: `${BASE_URL}/blog`,
            jsonLd: [
                {
                    '@context': 'https://schema.org',
                    '@type': 'CollectionPage',
                    name: 'Blog — Argo Method',
                    description: 'Articulos sobre perfilamiento conductual DISC para deportistas juveniles.',
                    url: `${BASE_URL}/blog`,
                    publisher: { '@type': 'Organization', name: 'Argo Method', url: BASE_URL },
                },
                {
                    '@context': 'https://schema.org',
                    '@type': 'BreadcrumbList',
                    itemListElement: [
                        { '@type': 'ListItem', position: 1, name: 'Argo Method', item: BASE_URL },
                        { '@type': 'ListItem', position: 2, name: 'Blog' },
                    ],
                },
            ],
        },
    });

    // /blog/category/:cat
    for (const cat of CATEGORIES) {
        const label = CAT_LABELS[cat] || cat;
        routes.push({
            path: `/blog/category/${cat}`,
            meta: {
                title: `${label} | Blog — Argo Method`,
                description: `Articulos sobre ${label.toLowerCase()} en el blog de Argo Method. Perfilamiento conductual DISC para deportistas juveniles.`,
                canonical: `${BASE_URL}/blog/category/${cat}`,
                jsonLd: [
                    {
                        '@context': 'https://schema.org',
                        '@type': 'CollectionPage',
                        name: `${label} — Argo Method Blog`,
                        url: `${BASE_URL}/blog/category/${cat}`,
                        publisher: { '@type': 'Organization', name: 'Argo Method', url: BASE_URL },
                    },
                    {
                        '@context': 'https://schema.org',
                        '@type': 'BreadcrumbList',
                        itemListElement: [
                            { '@type': 'ListItem', position: 1, name: 'Argo Method', item: BASE_URL },
                            { '@type': 'ListItem', position: 2, name: 'Blog', item: `${BASE_URL}/blog` },
                            { '@type': 'ListItem', position: 3, name: label },
                        ],
                    },
                ],
            },
        });
    }

    // /pricing
    routes.push({
        path: '/pricing',
        meta: {
            title: 'Planes y precios | Argo Method',
            description: 'Planes PRO, Academy y Enterprise para entrenadores, clubes e instituciones deportivas. Prueba gratis 14 dias.',
            canonical: `${BASE_URL}/pricing`,
            jsonLd: [
                {
                    '@context': 'https://schema.org',
                    '@type': 'WebPage',
                    name: 'Planes y precios — Argo Method',
                    url: `${BASE_URL}/pricing`,
                    publisher: { '@type': 'Organization', name: 'Argo Method', url: BASE_URL },
                },
            ],
        },
    });

    // /terms
    routes.push({
        path: '/terms',
        meta: {
            title: 'Terminos de servicio | Argo Method',
            description: 'Terminos y condiciones de uso de Argo Method.',
            canonical: `${BASE_URL}/terms`,
        },
    });

    // /privacy
    routes.push({
        path: '/privacy',
        meta: {
            title: 'Politica de privacidad | Argo Method',
            description: 'Como Argo Method protege y maneja tus datos personales.',
            canonical: `${BASE_URL}/privacy`,
        },
    });

    return routes;
}

// ─── Dynamic blog routes from Supabase ──────────────────────────────────────

async function getBlogRoutes() {
    if (!SUPABASE_KEY) {
        console.warn('[prerender] No SUPABASE_SERVICE_ROLE_KEY — skipping blog posts');
        return [];
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data: posts, error } = await supabase
        .from('blog_posts')
        .select('slug, title, seo_title, meta_description, lang, lang_group, published_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

    if (error) {
        console.error('[prerender] Supabase error:', error.message);
        return [];
    }
    if (!posts || posts.length === 0) return [];

    // Group by lang_group for hreflang
    const langGroups = new Map();
    for (const p of posts) {
        if (p.lang_group) {
            const group = langGroups.get(p.lang_group) || [];
            group.push({ lang: p.lang, slug: p.slug });
            langGroups.set(p.lang_group, group);
        }
    }

    const LOCALE_MAP = { es: 'es_ES', en: 'en_US', pt: 'pt_BR' };
    const routes = [];

    for (const post of posts) {
        const seoTitle = post.seo_title || post.title;
        const alternates = post.lang_group ? (langGroups.get(post.lang_group) || []) : [];
        const hreflangs = alternates.length > 1
            ? alternates.map(a => ({ lang: a.lang, href: `${BASE_URL}/blog/${a.slug}` }))
            : [];

        routes.push({
            path: `/blog/${post.slug}`,
            meta: {
                title: `${seoTitle} — Argo Method Blog`,
                description: post.meta_description || '',
                canonical: `${BASE_URL}/blog/${post.slug}`,
                ogType: 'article',
                ogLocale: LOCALE_MAP[post.lang] || 'es_ES',
                hreflangs,
                jsonLd: [
                    {
                        '@context': 'https://schema.org',
                        '@type': 'Article',
                        headline: seoTitle,
                        description: post.meta_description || '',
                        url: `${BASE_URL}/blog/${post.slug}`,
                        image: OG_IMAGE,
                        inLanguage: post.lang === 'pt' ? 'pt-BR' : post.lang === 'en' ? 'en-US' : 'es',
                        datePublished: post.published_at,
                        dateModified: post.published_at,
                        author: { '@type': 'Organization', name: 'Argo Method', url: BASE_URL },
                        publisher: {
                            '@type': 'Organization',
                            name: 'Argo Method',
                            url: BASE_URL,
                            logo: { '@type': 'ImageObject', url: `${BASE_URL}/favicon.svg` },
                        },
                        mainEntityOfPage: { '@type': 'WebPage', '@id': `${BASE_URL}/blog/${post.slug}` },
                    },
                    {
                        '@context': 'https://schema.org',
                        '@type': 'BreadcrumbList',
                        itemListElement: [
                            { '@type': 'ListItem', position: 1, name: 'Argo Method', item: BASE_URL },
                            { '@type': 'ListItem', position: 2, name: 'Blog', item: `${BASE_URL}/blog` },
                            { '@type': 'ListItem', position: 3, name: post.title },
                        ],
                    },
                ],
            },
        });
    }

    return routes;
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
    const start = Date.now();

    // Load env vars for local dev
    try {
        const dotenv = await import('dotenv');
        dotenv.config();
    } catch { /* dotenv not available in Vercel build, that's fine */ }

    // Re-read env after dotenv load (Vercel already has them)
    const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_KEY;

    const templatePath = path.join(DIST, 'index.html');
    if (!fs.existsSync(templatePath)) {
        console.error('[prerender] dist/index.html not found — run vite build first');
        process.exit(1);
    }

    const template = fs.readFileSync(templatePath, 'utf-8');
    console.log('[prerender] Template loaded');

    // Gather all routes
    const staticRoutes = getStaticRoutes();

    // Override SUPABASE_KEY if dotenv loaded it
    if (supaKey && !SUPABASE_KEY) {
        // Patch for the getBlogRoutes function
        process.env.SUPABASE_SERVICE_ROLE_KEY = supaKey;
    }
    const blogRoutes = await getBlogRoutes();

    const allRoutes = [...staticRoutes, ...blogRoutes];
    console.log(`[prerender] Generating ${allRoutes.length} pages (${staticRoutes.length} static + ${blogRoutes.length} blog)`);

    // Generate each page
    let count = 0;
    for (const route of allRoutes) {
        const html = injectMeta(template, route.meta);
        writePage(route.path, html);
        count++;
    }

    const elapsed = Date.now() - start;
    console.log(`[prerender] Done — ${count} pages in ${elapsed}ms`);
}

main().catch(err => {
    console.error('[prerender] Fatal:', err);
    process.exit(1);
});
