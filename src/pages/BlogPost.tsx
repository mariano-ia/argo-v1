import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar } from 'lucide-react';
import { fetchPostBySlug, type BlogPost as BlogPostType } from '../lib/blog';

export const BlogPost: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [post, setPost] = useState<BlogPostType | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!slug) return;
        fetchPostBySlug(slug)
            .then(data => {
                if (!data) setNotFound(true);
                else setPost(data);
            })
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));
    }, [slug]);

    // SEO meta tags
    useEffect(() => {
        if (!post) return;
        document.title = `${post.title} — Argo Method Blog`;
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
        setMeta('og:title', post.title);
        setMeta('og:type', 'article');

        return () => { document.title = 'Argo Method'; };
    }, [post]);

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

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
                    Artículo no encontrado
                </h1>
                <button onClick={() => navigate('/blog')}
                    style={{ fontSize: '14px', color: '#0071E3', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                    Volver al blog
                </button>
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: '#ffffff', color: '#1D1D1F', fontFamily: 'Inter, sans-serif' }}
             className="min-h-screen">

            {/* Nav */}
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
                    <Link to="/blog" style={{ fontSize: '13px', fontWeight: 500, color: '#86868B', textDecoration: 'none' }}
                          className="hover:text-argo-navy transition-colors">
                        Blog
                    </Link>
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
                        ¿Listo para conocer el perfil de tus deportistas?
                    </p>
                    <button
                        onClick={() => navigate('/app')}
                        style={{
                            fontWeight: 500, fontSize: '14px',
                            backgroundColor: '#955FB5', color: '#fff',
                            borderRadius: '10px', padding: '10px 24px', border: 'none', cursor: 'pointer',
                        }}
                        className="hover:opacity-90 transition-opacity"
                    >
                        Iniciar experiencia Argo
                    </button>
                </div>
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
