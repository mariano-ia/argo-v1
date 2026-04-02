import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar } from 'lucide-react';
import { fetchPostBySlug, fetchAlternateLangs, fetchRelatedPosts, type BlogPost as BlogPostType } from '../lib/blog';
import { useLang } from '../context/LangContext';

const I18N: Record<string, { ctaQuestion: string; ctaButton: string; navCta: string; navLogin: string }> = {
    es: { ctaQuestion: 'Descubre el perfil conductual de tus deportistas', ctaButton: 'Iniciar prueba gratuita', navCta: '14 dias gratis', navLogin: 'Iniciar sesion' },
    en: { ctaQuestion: 'Discover the behavioral profile of your athletes', ctaButton: 'Start free trial', navCta: '14 days free', navLogin: 'Log in' },
    pt: { ctaQuestion: 'Descubra o perfil comportamental dos seus atletas', ctaButton: 'Iniciar teste gratuito', navCta: '14 dias gratis', navLogin: 'Entrar' },
};

const LOCALE_MAP: Record<string, string> = { es: 'es-ES', en: 'en-US', pt: 'pt-BR' };

export const BlogPost: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { lang: uiLang } = useLang();
    const [post, setPost] = useState<BlogPostType | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [altLangs, setAltLangs] = useState<{ lang: string; slug: string }[]>([]);
    const [relatedPosts, setRelatedPosts] = useState<{ id: string; slug: string; title: string; meta_description: string | null; reading_time: number | null; published_at: string }[]>([]);

    useEffect(() => {
        if (!slug) return;
        fetchPostBySlug(slug)
            .then(data => {
                if (!data) setNotFound(true);
                else {
                    setPost(data);
                    if (data.lang_group) {
                        fetchAlternateLangs(data.lang_group).then(setAltLangs).catch(() => {});
                    }
                    fetchRelatedPosts(data.id, data.lang).then(setRelatedPosts).catch(() => {});
                }
            })
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));
    }, [slug]);

    // SEO meta tags + Article schema markup + hreflang
    useEffect(() => {
        if (!post) return;
        const seoTitle = post.seo_title || post.title;
        document.title = `${seoTitle} — Argo Method Blog`;
        const setMeta = (name: string, content: string) => {
            let el = document.querySelector(`meta[name="${name}"]`) || document.querySelector(`meta[property="${name}"]`);
            if (!el) {
                el = document.createElement('meta');
                el.setAttribute(name.startsWith('og:') ? 'property' : 'name', name);
                document.head.appendChild(el);
            }
            el.setAttribute('content', content);
        };
        if (post.meta_description) {
            setMeta('description', post.meta_description);
            setMeta('og:description', post.meta_description);
        }
        setMeta('og:title', seoTitle);
        setMeta('og:type', 'article');
        setMeta('og:url', `https://argomethod.com/blog/${post.slug}`);
        setMeta('article:published_time', post.published_at);
        setMeta('og:locale', post.lang === 'pt' ? 'pt_BR' : post.lang === 'en' ? 'en_US' : 'es_ES');
        setMeta('og:image', 'https://argomethod.com/og-cover.png');

        // Canonical link
        let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
        if (canonicalEl) canonicalEl.href = `https://argomethod.com/blog/${post.slug}`;

        // Hreflang links for alternate languages
        const hreflangEls: HTMLLinkElement[] = [];
        for (const alt of altLangs) {
            const link = document.createElement('link');
            link.rel = 'alternate';
            link.hreflang = alt.lang;
            link.href = `https://argomethod.com/blog/${alt.slug}`;
            document.head.appendChild(link);
            hreflangEls.push(link);
        }

        // Article + BreadcrumbList JSON-LD schemas
        const schemas = [
            {
                '@context': 'https://schema.org',
                '@type': 'Article',
                headline: seoTitle,
                description: post.meta_description || '',
                url: `https://argomethod.com/blog/${post.slug}`,
                image: 'https://argomethod.com/og-cover.png',
                inLanguage: post.lang === 'pt' ? 'pt-BR' : post.lang === 'en' ? 'en-US' : 'es',
                datePublished: post.published_at,
                dateModified: post.published_at,
                author: { '@type': 'Organization', name: 'Argo Method', url: 'https://argomethod.com' },
                publisher: {
                    '@type': 'Organization',
                    name: 'Argo Method',
                    url: 'https://argomethod.com',
                    logo: { '@type': 'ImageObject', url: 'https://argomethod.com/favicon.svg' },
                },
                mainEntityOfPage: { '@type': 'WebPage', '@id': `https://argomethod.com/blog/${post.slug}` },
            },
            {
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Argo Method', item: 'https://argomethod.com/' },
                    { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://argomethod.com/blog' },
                    { '@type': 'ListItem', position: 3, name: post.title },
                ],
            },
        ];
        let scriptEl = document.querySelector('script[data-blog-schema]');
        if (!scriptEl) {
            scriptEl = document.createElement('script');
            scriptEl.setAttribute('type', 'application/ld+json');
            scriptEl.setAttribute('data-blog-schema', 'true');
            document.head.appendChild(scriptEl);
        }
        scriptEl.textContent = JSON.stringify(schemas);

        return () => {
            document.title = 'Argo Method';
            const el = document.querySelector('script[data-blog-schema]');
            if (el) el.remove();
            hreflangEls.forEach(el => el.remove());
        };
    }, [post, altLangs]);

    const postLang = post?.lang ?? uiLang ?? 'es';

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString(LOCALE_MAP[postLang] ?? 'es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

    const t = I18N[postLang] ?? I18N.es;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="w-6 h-6 rounded-full border-2 border-argo-indigo border-t-transparent animate-spin" />
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white" style={{ fontFamily: 'Inter, sans-serif' }}>
                <h1 style={{ fontWeight: 300, fontSize: '2rem', color: '#1D1D1F', marginBottom: '12px' }}>
                    {postLang === 'en' ? 'Article not found' : postLang === 'pt' ? 'Artigo nao encontrado' : 'Articulo no encontrado'}
                </h1>
                <button onClick={() => navigate('/blog')}
                    style={{ fontSize: '14px', color: '#0071E3', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                    {postLang === 'en' ? 'Back to blog' : postLang === 'pt' ? 'Voltar ao blog' : 'Volver al blog'}
                </button>
            </div>
        );
    }

    // Filter alternate langs (exclude current post's language)
    const otherLangs = altLangs.filter(a => a.lang !== post!.lang);

    return (
        <div style={{ backgroundColor: '#ffffff', color: '#1D1D1F', fontFamily: 'Inter, sans-serif' }}
             className="min-h-screen">

            {/* Nav — matches Landing nav */}
            <nav style={{ borderBottom: '1px solid #D2D2D7' }}
                 className="sticky top-0 z-50 bg-white/95 backdrop-blur-md">
                <div className="max-w-5xl mx-auto px-4 md:px-6 h-12 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-1.5 no-underline">
                        <span style={{ fontSize: '18px', letterSpacing: '-0.02em', color: '#1D1D1F' }}>
                            <span style={{ fontWeight: 800 }}>Argo</span><span style={{ fontWeight: 100 }}> Method</span>
                        </span>
                        <span style={{ background: '#BBBCFF', color: '#1D1D1F', fontSize: '9px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.05em' }}>
                            beta
                        </span>
                    </Link>
                    <div className="flex items-center gap-3">
                        {/* Language switcher */}
                        {otherLangs.length > 0 && (
                            <div className="flex items-center gap-1">
                                {otherLangs.map(alt => (
                                    <Link
                                        key={alt.lang}
                                        to={`/blog/${alt.slug}`}
                                        className="px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-argo-grey hover:text-argo-navy hover:bg-argo-neutral rounded transition-all no-underline"
                                    >
                                        {alt.lang}
                                    </Link>
                                ))}
                            </div>
                        )}
                        <Link to="/blog" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '-0.01em', textDecoration: 'none' }}
                              className="text-argo-grey hover:text-argo-navy transition-colors">
                            Blog
                        </Link>
                        <button
                            onClick={() => navigate('/signup?login=1')}
                            className="hidden sm:block text-argo-grey hover:text-argo-navy transition-colors"
                            style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '-0.01em', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            {t.navLogin}
                        </button>
                        <button
                            onClick={() => navigate('/signup')}
                            style={{
                                fontWeight: 500, fontSize: '12px', letterSpacing: '-0.01em',
                                backgroundColor: '#955FB5', color: '#fff',
                                borderRadius: '8px', padding: '6px 16px', border: 'none', cursor: 'pointer',
                            }}
                            className="hover:opacity-90 transition-opacity"
                        >
                            {t.navCta}
                        </button>
                    </div>
                </div>
            </nav>

            <article className="max-w-3xl mx-auto px-4 md:px-6 pt-16 pb-24">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: [0.25, 0, 0, 1] }}>
                    <button
                        onClick={() => navigate('/blog')}
                        className="flex items-center gap-1.5 text-argo-grey hover:text-argo-navy transition-colors mb-8"
                        style={{ fontSize: '13px', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                        <ArrowLeft size={14} /> Blog
                    </button>

                    <div className="flex items-center gap-2 mb-6">
                        <Calendar size={12} className="text-argo-grey" />
                        <span style={{ fontSize: '12px', color: '#86868B', fontWeight: 500 }}>
                            {formatDate(post!.published_at)}
                        </span>
                        {post!.reading_time && (
                            <span style={{ fontSize: '12px', color: '#86868B', fontWeight: 500 }}>
                                · {post!.reading_time} min
                            </span>
                        )}
                    </div>

                    <h1 style={{ fontWeight: 300, fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.1, letterSpacing: '-0.03em' }}
                        className="text-argo-navy mb-10">
                        {post!.title}
                    </h1>
                </motion.div>

                {/* Article content */}
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="blog-content"
                    style={{ fontSize: '16px', lineHeight: 1.8, color: '#424245' }}
                    dangerouslySetInnerHTML={{ __html: post!.content }}
                />

                {/* CTA */}
                <div style={{ borderTop: '1px solid #D2D2D7' }} className="mt-16 pt-10 text-center">
                    <p style={{ fontSize: '18px', fontWeight: 300, color: '#1D1D1F', marginBottom: '16px' }}>
                        {t.ctaQuestion}
                    </p>
                    <button
                        onClick={() => navigate('/signup')}
                        style={{
                            fontWeight: 500, fontSize: '14px',
                            backgroundColor: '#955FB5', color: '#fff',
                            borderRadius: '10px', padding: '10px 24px', border: 'none', cursor: 'pointer',
                        }}
                        className="hover:opacity-90 transition-opacity"
                    >
                        {t.ctaButton}
                    </button>
                </div>

                {/* Related Posts */}
                {relatedPosts.length > 0 && (
                    <div style={{ borderTop: '1px solid #D2D2D7' }} className="mt-12 pt-10">
                        <p style={{ fontSize: '11px', fontWeight: 600, color: '#86868B', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px' }}>
                            {postLang === 'en' ? 'More articles' : postLang === 'pt' ? 'Mais artigos' : 'Mas articulos'}
                        </p>
                        <div className="space-y-0">
                            {relatedPosts.map(rp => (
                                <a
                                    key={rp.id}
                                    href={`/blog/${rp.slug}`}
                                    onClick={e => { e.preventDefault(); navigate(`/blog/${rp.slug}`); }}
                                    className="block py-4 group"
                                    style={{ borderBottom: '1px solid #E8E8ED', textDecoration: 'none' }}
                                >
                                    <h3 style={{ fontWeight: 600, fontSize: '16px', letterSpacing: '-0.02em', lineHeight: 1.3 }}
                                        className="text-argo-navy group-hover:text-argo-indigo transition-colors mb-0.5">
                                        {rp.title}
                                    </h3>
                                    {rp.meta_description && (
                                        <p style={{ fontSize: '13px', lineHeight: 1.5, color: '#86868B' }} className="line-clamp-1">
                                            {rp.meta_description}
                                        </p>
                                    )}
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </article>

            {/* Footer */}
            <footer style={{ borderTop: '1px solid #D2D2D7' }} className="py-8 px-4 text-center">
                <span style={{ fontSize: '11px', color: '#86868B', letterSpacing: '0.05em' }}>
                    &copy; 2026 Argo Method
                </span>
            </footer>
        </div>
    );
};
