import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLang } from '../context/LangContext';

const I18N: Record<string, { title: string; home: string }> = {
    es: { title: 'Pagina no encontrada', home: 'Ir al inicio' },
    en: { title: 'Page not found', home: 'Go to home' },
    pt: { title: 'Pagina nao encontrada', home: 'Ir ao inicio' },
};

export const NotFound: React.FC = () => {
    const navigate = useNavigate();
    const { lang } = useLang();
    const t = I18N[lang] ?? I18N.es;

    return (
        <div style={{ backgroundColor: '#ffffff', color: '#1D1D1F', fontFamily: 'Inter, sans-serif' }}
             className="min-h-screen flex flex-col">

            <nav style={{ borderBottom: '1px solid #D2D2D7' }}
                 className="sticky top-0 z-50 bg-white/95 backdrop-blur-md">
                <div className="max-w-5xl mx-auto px-4 md:px-6 h-12 flex items-center">
                    <Link to="/" className="flex items-center gap-1.5 no-underline">
                        <span style={{ fontSize: '18px', letterSpacing: '-0.02em', color: '#1D1D1F' }}>
                            <span style={{ fontWeight: 800 }}>Argo</span><span style={{ fontWeight: 100 }}> Method</span>
                        </span>
                    </Link>
                </div>
            </nav>

            <div className="flex-1 flex flex-col items-center justify-center px-4">
                <span style={{ fontSize: '80px', fontWeight: 200, letterSpacing: '-0.04em', color: '#AEAEB2' }}>
                    404
                </span>
                <h1 style={{ fontWeight: 300, fontSize: '1.5rem', color: '#1D1D1F', marginTop: '8px', marginBottom: '16px' }}>
                    {t.title}
                </h1>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        style={{ fontSize: '14px', color: '#0071E3', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                    >
                        {t.home}
                    </button>
                    <button
                        onClick={() => navigate('/blog')}
                        style={{ fontSize: '14px', color: '#0071E3', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                    >
                        Blog
                    </button>
                </div>
            </div>
        </div>
    );
};
