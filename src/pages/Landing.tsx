import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Anchor } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { APP_VERSION } from '../lib/version';

// ─── Reusable tiny components ────────────────────────────────────────────────

const Eyebrow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="text-[10px] uppercase tracking-[0.22em] text-argo-indigo font-bold mb-3">
        {children}
    </div>
);

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
};

const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12 } },
};

// ─── Landing page ─────────────────────────────────────────────────────────────

export const Landing: React.FC = () => {
    const navigate = useNavigate();
    const { lang, setLang, t } = useLang();

    const goToApp = () => navigate('/app');

    return (
        <div className="min-h-screen bg-white text-argo-navy font-sans">

            {/* ── NAV ── */}
            <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-argo-border">
                <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Anchor size={16} className="text-argo-indigo" />
                        <span className="font-display text-sm font-bold text-argo-navy tracking-tight">Argo</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
                            className="text-[10px] font-bold uppercase tracking-widest text-argo-grey hover:text-argo-navy border border-argo-border rounded-full px-3 py-1 transition-all"
                        >
                            {t.nav.lang}
                        </button>
                        <button
                            onClick={goToApp}
                            className="bg-argo-navy text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full hover:bg-argo-indigo transition-all"
                        >
                            {t.nav.cta}
                        </button>
                    </div>
                </div>
            </nav>

            {/* ── HERO ── */}
            <section className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
                <motion.div variants={stagger} initial="hidden" animate="show">
                    <motion.div variants={fadeUp}>
                        <Eyebrow>{t.hero.eyebrow}</Eyebrow>
                    </motion.div>
                    <motion.h1
                        variants={fadeUp}
                        className="font-display text-5xl md:text-7xl font-bold text-argo-navy tracking-tight leading-[1.05] mb-6"
                    >
                        {t.hero.headline}<br />
                        <span className="text-argo-indigo">{t.hero.headlineAccent}</span>
                    </motion.h1>
                    <motion.p
                        variants={fadeUp}
                        className="text-base md:text-lg text-argo-grey max-w-xl mx-auto leading-relaxed mb-10"
                    >
                        {t.hero.sub}
                    </motion.p>
                    <motion.div variants={fadeUp} className="flex flex-col items-center gap-3">
                        <button
                            onClick={goToApp}
                            className="inline-flex items-center gap-3 bg-argo-navy text-white font-bold px-8 py-4 rounded-full text-sm uppercase tracking-widest hover:bg-argo-indigo transition-all shadow-xl shadow-argo-navy/20"
                        >
                            {t.hero.cta} <ArrowRight size={16} />
                        </button>
                        <span className="text-[10px] text-argo-grey/60 uppercase tracking-widest">
                            {t.hero.ctaSub}
                        </span>
                    </motion.div>
                </motion.div>
            </section>

            {/* ── PROBLEM ── */}
            <section className="bg-argo-neutral border-y border-argo-border py-20">
                <div className="max-w-5xl mx-auto px-6">
                    <Eyebrow>{t.problem.eyebrow}</Eyebrow>
                    <h2 className="font-display text-3xl md:text-4xl font-bold text-argo-navy mb-12 max-w-2xl leading-snug">
                        {t.problem.headline}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {t.problem.cards.map((card, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white border border-argo-border rounded-2xl p-6"
                            >
                                <h3 className="font-bold text-argo-navy mb-2">{card.title}</h3>
                                <p className="text-sm text-argo-grey leading-relaxed">{card.body}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── INSIGHT ── */}
            <section className="bg-argo-navy py-20">
                <div className="max-w-5xl mx-auto px-6 text-center">
                    <motion.blockquote
                        initial={{ opacity: 0, scale: 0.97 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="font-display text-3xl md:text-5xl font-bold text-white leading-tight mb-8"
                    >
                        "{t.insight.quote}"
                    </motion.blockquote>
                    <p className="text-sm text-white/60 max-w-xl mx-auto leading-relaxed">
                        {t.insight.body}
                    </p>
                </div>
            </section>

            {/* ── HOW IT WORKS ── */}
            <section className="py-20 max-w-5xl mx-auto px-6">
                <Eyebrow>{t.howItWorks.eyebrow}</Eyebrow>
                <h2 className="font-display text-3xl md:text-4xl font-bold text-argo-navy mb-14 max-w-xl leading-snug">
                    {t.howItWorks.headline}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {t.howItWorks.steps.map((step, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.12 }}
                            className="relative"
                        >
                            <div className="text-5xl font-display font-bold text-argo-indigo/15 mb-4 leading-none">
                                {step.number}
                            </div>
                            <h3 className="font-bold text-argo-navy mb-2">{step.title}</h3>
                            <p className="text-sm text-argo-grey leading-relaxed">{step.body}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ── ARCHETYPES ── */}
            <section className="bg-argo-neutral border-y border-argo-border py-20">
                <div className="max-w-5xl mx-auto px-6">
                    <Eyebrow>{t.archetypes.eyebrow}</Eyebrow>
                    <h2 className="font-display text-3xl md:text-4xl font-bold text-argo-navy mb-3 max-w-xl leading-snug">
                        {t.archetypes.headline}
                    </h2>
                    <p className="text-sm text-argo-grey mb-10 max-w-lg leading-relaxed">{t.archetypes.sub}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {t.archetypes.profiles.map((name, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.04 }}
                                className="bg-white border border-argo-border rounded-xl px-4 py-3 text-sm font-semibold text-argo-navy text-center hover:border-argo-indigo hover:text-argo-indigo transition-all cursor-default"
                            >
                                {name}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FOR WHOM ── */}
            <section className="py-20 max-w-5xl mx-auto px-6">
                <Eyebrow>{t.audience.eyebrow}</Eyebrow>
                <h2 className="font-display text-3xl md:text-4xl font-bold text-argo-navy mb-12 max-w-xl leading-snug">
                    {t.audience.headline}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {t.audience.cards.map((card, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="border border-argo-border rounded-2xl p-6"
                        >
                            <div className="text-3xl mb-4">{card.icon}</div>
                            <h3 className="font-bold text-argo-navy mb-2">{card.title}</h3>
                            <p className="text-sm text-argo-grey leading-relaxed">{card.body}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ── FINAL CTA ── */}
            <section className="bg-argo-indigo py-24 text-center">
                <div className="max-w-5xl mx-auto px-6">
                    <motion.h2
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="font-display text-4xl md:text-5xl font-bold text-white mb-4"
                    >
                        {t.finalCta.headline}
                    </motion.h2>
                    <p className="text-white/70 mb-10 text-sm">{t.finalCta.sub}</p>
                    <button
                        onClick={goToApp}
                        className="inline-flex items-center gap-3 bg-white text-argo-navy font-bold px-8 py-4 rounded-full text-sm uppercase tracking-widest hover:scale-105 transition-transform shadow-xl"
                    >
                        {t.finalCta.cta} <ArrowRight size={16} />
                    </button>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer className="border-t border-argo-border py-8">
                <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Anchor size={14} className="text-argo-indigo" />
                        <span className="text-sm font-bold text-argo-navy">Argo Method</span>
                        <span className="text-xs text-argo-grey/50">— {t.footer.tagline}</span>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] text-argo-grey/50 uppercase tracking-widest">
                        <span>v{APP_VERSION}</span>
                        <span>© 2025 Argo. {t.footer.rights}</span>
                        <button
                            onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
                            className="hover:text-argo-grey transition-colors font-bold"
                        >
                            {t.nav.lang}
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    );
};
