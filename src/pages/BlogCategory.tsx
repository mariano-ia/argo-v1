import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar } from 'lucide-react';
import { fetchPosts, BLOG_CATEGORIES, type BlogPost } from '../lib/blog';
import { useLang } from '../context/LangContext';

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6, ease: [0.25, 0, 0, 1], delay },
});

export const BlogCategory: React.FC = () => {
    const { category } = useParams<{ category: string }>();
    const { lang } = useLang();
    const navigate = useNavigate();
    const [posts, setPosts] = useState<Omit<BlogPost, 'content'>[]>([]);
    const [loading, setLoading] = useState(true);

    const catLabel = category && BLOG_CATEGORIES[category]
        ? BLOG_CATEGORIES[category][lang] ?? BLOG_CATEGORIES[category].es
        : category ?? '';

    useEffect(() => {
        if (!category) return;
        fetchPosts(lang, category).then(setPosts).finally(() => setLoading(false));
    }, [lang, category]);

    // SEO
    useEffect(() => {
        document.title = `${catLabel} | Blog — Argo Method`;
        const descEl = document.querySelector('meta[name="description"]');
        if (descEl) descEl.setAttribute('content', `Articulos sobre ${catLabel.toLowerCase()} en el blog de Argo Method.`);
        return () => { document.title = 'Argo Method'; };
    }, [catLabel]);

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString(lang === 'es' ? 'es-ES' : lang === 'pt' ? 'pt-BR' : 'en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
        });

    return (
        <div style={{ backgroundColor: '#ffffff', color: '#1D1D1F', fontFamily: 'Inter, sans-serif' }}
             className="min-h-screen">

            <nav style={{ borderBottom: '1px solid #D2D2D7' }}
                 className="sticky top-0 z-50 bg-white/95 backdrop-blur-md">
                <div className="max-w-5xl mx-auto px-4 md:px-6 h-12 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-1.5 no-underline">
                        <span style={{ fontSize: '18px', letterSpacing: '-0.02em', color: '#1D1D1F' }}>
                            <span style={{ fontWeight: 800 }}>Argo</span><span style={{ fontWeight: 100 }}> Method</span>
                        </span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <Link to="/blog" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '-0.01em', textDecoration: 'none' }}
                              className="text-argo-grey hover:text-argo-navy transition-colors">
                            Blog
                        </Link>
                        <button
                            onClick={() => navigate('/signup')}
                            style={{
                                fontWeight: 500, fontSize: '12px', letterSpacing: '-0.01em',
                                backgroundColor: '#955FB5', color: '#fff',
                                borderRadius: '8px', padding: '6px 16px', border: 'none', cursor: 'pointer',
                            }}
                            className="hover:opacity-90 transition-opacity"
                        >
                            {lang === 'en' ? '14 days free' : lang === 'pt' ? '14 dias gratis' : '14 dias gratis'}
                        </button>
                    </div>
                </div>
            </nav>

            <div className="max-w-3xl mx-auto px-4 md:px-6 pt-16 pb-24">
                <motion.div {...fadeUp(0)}>
                    <button
                        onClick={() => navigate('/blog')}
                        className="flex items-center gap-1.5 text-argo-grey hover:text-argo-navy transition-colors mb-8"
                        style={{ fontSize: '13px', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                        <ArrowLeft size={14} /> Blog
                    </button>

                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#86868B', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        {lang === 'en' ? 'Category' : lang === 'pt' ? 'Categoria' : 'Categoria'}
                    </span>
                    <h1 style={{ fontWeight: 300, fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.1, letterSpacing: '-0.03em' }}
                        className="text-argo-navy mb-12 mt-1">
                        {catLabel}
                    </h1>
                </motion.div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-6 h-6 rounded-full border-2 border-argo-indigo border-t-transparent animate-spin" />
                    </div>
                ) : posts.length === 0 ? (
                    <p style={{ color: '#86868B', fontSize: '15px' }}>
                        {lang === 'en' ? 'No articles in this category yet.' : lang === 'pt' ? 'Nenhum artigo nesta categoria ainda.' : 'No hay articulos en esta categoria aun.'}
                    </p>
                ) : (
                    <div className="space-y-0">
                        {posts.map((post, i) => (
                            <motion.article key={post.id} {...fadeUp(i * 0.05)}>
                                <Link
                                    to={`/blog/${post.slug}`}
                                    className="block py-8 group"
                                    style={{ borderBottom: '1px solid #D2D2D7', textDecoration: 'none' }}
                                >
                                    <div className="flex items-center gap-2 mb-3">
                                        <Calendar size={12} className="text-argo-grey" />
                                        <span style={{ fontSize: '12px', color: '#86868B', fontWeight: 500 }}>
                                            {formatDate(post.published_at)}
                                        </span>
                                        {post.reading_time && (
                                            <span style={{ fontSize: '12px', color: '#86868B', fontWeight: 500 }}>
                                                · {post.reading_time} min
                                            </span>
                                        )}
                                    </div>
                                    <h2 style={{ fontWeight: 600, fontSize: '20px', letterSpacing: '-0.02em', lineHeight: 1.3 }}
                                        className="text-argo-navy group-hover:text-argo-indigo transition-colors mb-2">
                                        {post.title}
                                    </h2>
                                    {post.meta_description && (
                                        <p style={{ fontSize: '15px', lineHeight: 1.6, color: '#86868B' }}>
                                            {post.meta_description}
                                        </p>
                                    )}
                                </Link>
                            </motion.article>
                        ))}
                    </div>
                )}
            </div>

            <footer style={{ borderTop: '1px solid #D2D2D7' }} className="py-8 px-4 text-center">
                <span style={{ fontSize: '11px', color: '#86868B', letterSpacing: '0.05em' }}>
                    &copy; 2026 Argo Method
                </span>
            </footer>
        </div>
    );
};
