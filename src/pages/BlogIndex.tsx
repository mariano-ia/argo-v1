import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar } from 'lucide-react';
import { fetchPosts, type BlogPost } from '../lib/blog';
import { useLang } from '../context/LangContext';

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6, ease: [0.25, 0, 0, 1], delay },
});

const I18N: Record<string, { subtitle: string; empty: string; back: string; navCta: string; navLogin: string }> = {
    es: { subtitle: 'Ciencia del comportamiento, deporte juvenil y herramientas para entrenadores.', empty: 'No hay articulos publicados aun.', back: 'Volver', navCta: '14 dias gratis', navLogin: 'Iniciar sesion' },
    en: { subtitle: 'Behavioral science, youth sports and tools for coaches.', empty: 'No articles published yet.', back: 'Back', navCta: '14 days free', navLogin: 'Log in' },
    pt: { subtitle: 'Ciencia do comportamento, esporte juvenil e ferramentas para treinadores.', empty: 'Nenhum artigo publicado ainda.', back: 'Voltar', navCta: '14 dias gratis', navLogin: 'Entrar' },
};

export const BlogIndex: React.FC = () => {
    const { lang } = useLang();
    const navigate = useNavigate();
    const [posts, setPosts] = useState<Omit<BlogPost, 'content'>[]>([]);
    const [loading, setLoading] = useState(true);

    const t = I18N[lang] ?? I18N.es;

    useEffect(() => {
        fetchPosts(lang).then(setPosts).finally(() => setLoading(false));
    }, [lang]);

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString(lang === 'es' ? 'es-ES' : lang === 'pt' ? 'pt-BR' : 'en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
        });

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

            <div className="max-w-3xl mx-auto px-4 md:px-6 pt-16 pb-24">
                {/* Header */}
                <motion.div {...fadeUp(0)}>
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-1.5 text-argo-grey hover:text-argo-navy transition-colors mb-8"
                        style={{ fontSize: '13px', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                        <ArrowLeft size={14} /> {t.back}
                    </button>

                    <h1 style={{ fontWeight: 300, fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.1, letterSpacing: '-0.03em' }}
                        className="text-argo-navy mb-4">
                        Blog
                    </h1>
                    <p style={{ fontSize: '16px', lineHeight: 1.7, color: '#86868B' }} className="mb-12">
                        {t.subtitle}
                    </p>
                </motion.div>

                {/* Posts */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-6 h-6 rounded-full border-2 border-argo-indigo border-t-transparent animate-spin" />
                    </div>
                ) : posts.length === 0 ? (
                    <p style={{ color: '#86868B', fontSize: '15px' }}>{t.empty}</p>
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

            {/* Footer */}
            <footer style={{ borderTop: '1px solid #D2D2D7' }} className="py-8 px-4 text-center">
                <span style={{ fontSize: '11px', color: '#86868B', letterSpacing: '0.05em' }}>
                    &copy; 2026 Argo Method
                </span>
            </footer>
        </div>
    );
};
