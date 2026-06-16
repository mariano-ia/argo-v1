import React, { useEffect, useMemo, useState } from 'react';
import { useOutletContext, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, HelpCircle, ChevronDown, ArrowRight, Lightbulb, Lock } from 'lucide-react';
import { useLang } from '../../context/LangContext';
import { SectionIntro } from '../../components/dashboard/SectionIntro';
import {
    getHelpArticles, getHelpCategoryLabel, HELP_CATEGORY_ORDER,
    type HelpArticle,
} from '../../lib/helpContent';

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface TenantData { id: string; plan: string; }
interface Ctx { tenant: TenantData | null; role: string; }

/* ── i18n (page chrome only; article copy lives in helpContent.*) ───────────── */

const T = {
    es: {
        title: 'Ayuda',
        subtitle: 'Guías rápidas para sacarle el máximo a tu panel.',
        intro: 'Encuentra cómo empezar, crear planteles, leer perfiles y más. Busca por palabra o explora por tema.',
        searchPlaceholder: 'Busca una pregunta...',
        tipLabel: 'Ten en cuenta',
        noResultsA: 'No encontramos nada para',
        noResultsB: 'Prueba con otra palabra.',
    },
    en: {
        title: 'Help',
        subtitle: 'Quick guides to get the most out of your dashboard.',
        intro: 'Find how to get started, create teams, read profiles and more. Search by keyword or browse by topic.',
        searchPlaceholder: 'Search a question...',
        tipLabel: 'Keep in mind',
        noResultsA: 'No results for',
        noResultsB: 'Try another keyword.',
    },
    pt: {
        title: 'Ajuda',
        subtitle: 'Guias rápidos para aproveitar ao máximo o seu painel.',
        intro: 'Encontre como começar, criar plantéis, ler perfis e mais. Busque por palavra ou explore por tema.',
        searchPlaceholder: 'Busque uma pergunta...',
        tipLabel: 'Tenha em conta',
        noResultsA: 'Nada encontrado para',
        noResultsB: 'Tente outra palavra.',
    },
} as const;

// Strip combining diacritics (U+0300 to U+036F) so search is accent-insensitive.
const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/* ── Component ─────────────────────────────────────────────────────────────── */

export const TenantHelp: React.FC = () => {
    const { tenant, role } = useOutletContext<Ctx>();
    const { lang } = useLang();
    const t = T[lang as keyof typeof T] ?? T.es;
    const location = useLocation();

    const [search, setSearch] = useState('');
    const [openIds, setOpenIds] = useState<Set<string>>(new Set());

    const isCoach = role === 'coach';
    const isTrial = tenant?.plan === 'trial';

    // Role-aware article set.
    const articles = useMemo(() => getHelpArticles(lang).filter(a => {
        const aud = a.audience ?? 'all';
        if (aud === 'admin' && isCoach) return false;
        if (aud === 'coach' && !isCoach) return false;
        return true;
    }), [lang, isCoach]);

    const q = normalize(search.trim());
    const isSearching = q.length > 0;

    const visible = useMemo(() => articles.filter(a => {
        if (!q) return true;
        const hay = normalize([a.title, a.body, ...(a.steps ?? []), a.tip ?? ''].join(' '));
        return hay.includes(q);
    }), [articles, q]);

    const grouped = useMemo(() => HELP_CATEGORY_ORDER
        .map(cat => ({ cat, items: visible.filter(a => a.category === cat) }))
        .filter(g => g.items.length > 0), [visible]);

    // Deep-link: open + scroll to an article by hash (e.g. /dashboard/help#cupo-lleno).
    useEffect(() => {
        const hash = location.hash.replace('#', '');
        if (!hash) return;
        setOpenIds(prev => new Set(prev).add(hash));
        const el = document.getElementById(`help-${hash}`);
        if (el) {
            const id = window.setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120);
            return () => window.clearTimeout(id);
        }
    }, [location.hash]);

    const isOpen = (id: string) => isSearching || openIds.has(id);
    const toggle = (id: string) => setOpenIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
    });

    if (!tenant) {
        return <div className="flex items-center justify-center py-20"><div className="w-5 h-5 rounded-full border-2 border-argo-violet-500 border-t-transparent animate-spin" /></div>;
    }

    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <SectionIntro
                storageKey="argo_intro_help_v1"
                icon={<HelpCircle size={16} />}
                title={t.title}
                body={t.intro}
            />

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-[26px] font-bold text-argo-navy tracking-tight">{t.title}</h1>
                <p className="text-[13px] text-argo-grey mt-1">{t.subtitle}</p>
            </div>

            {/* Search (sticky) */}
            <div className="sticky top-0 z-10 -mx-1 px-1 pb-4 pt-1 bg-argo-bg">
                <div className="relative max-w-xl">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-argo-light" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder={t.searchPlaceholder}
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-argo-border bg-white text-[13px] outline-none focus:border-argo-violet-200 transition-colors"
                    />
                </div>
            </div>

            {/* Categories */}
            <div className="max-w-3xl space-y-8">
                {grouped.map(({ cat, items }) => (
                    <section key={cat}>
                        <h2 className="text-[11px] font-bold text-argo-light uppercase tracking-[0.1em] mb-2.5 px-1">
                            {getHelpCategoryLabel(cat, lang)}
                        </h2>
                        <div className="bg-white rounded-[14px] shadow-argo overflow-hidden">
                            {items.map(article => (
                                <ArticleRow
                                    key={article.id}
                                    article={article}
                                    open={isOpen(article.id)}
                                    onToggle={() => toggle(article.id)}
                                    isTrial={!!isTrial}
                                    tipLabel={t.tipLabel}
                                />
                            ))}
                        </div>
                    </section>
                ))}

                {grouped.length === 0 && (
                    <div className="bg-white rounded-[14px] shadow-argo py-12 flex flex-col items-center text-center px-6">
                        <Search size={24} className="text-argo-border mb-3" />
                        <p className="text-[14px] font-semibold text-argo-navy">{t.noResultsA} “{search.trim()}”</p>
                        <p className="text-[12px] text-argo-light mt-1">{t.noResultsB}</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

/* ── Article row ───────────────────────────────────────────────────────────── */

const ArticleRow: React.FC<{
    article: HelpArticle;
    open: boolean;
    onToggle: () => void;
    isTrial: boolean;
    tipLabel: string;
}> = ({ article, open, onToggle, isTrial, tipLabel }) => {
    const paragraphs = article.body.split('\n\n');
    return (
        <div id={`help-${article.id}`} className="border-b border-argo-border last:border-b-0 scroll-mt-24">
            <button
                onClick={onToggle}
                className={`w-full flex items-center gap-3 text-left px-5 py-4 transition-colors ${open ? 'bg-argo-violet-50/40' : 'hover:bg-argo-bg/50'}`}
            >
                <span className={`flex-1 text-[14px] font-semibold ${open ? 'text-argo-violet-500' : 'text-argo-navy'}`}>
                    {article.title}
                </span>
                <ChevronDown
                    size={16}
                    className={`flex-shrink-0 text-argo-light transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                />
            </button>

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 pb-5 pt-0 space-y-3.5">
                            {/* Body */}
                            <div className="space-y-2.5">
                                {paragraphs.map((p, i) => (
                                    <p key={i} className="text-[13px] text-argo-secondary leading-relaxed">{p}</p>
                                ))}
                            </div>

                            {/* Steps */}
                            {article.steps && article.steps.length > 0 && (
                                <div className="space-y-2.5 pt-0.5">
                                    {article.steps.map((step, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <span className="mt-0.5 w-5 h-5 rounded-full bg-argo-violet-50 text-argo-violet-500 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                                                {i + 1}
                                            </span>
                                            <p className="text-[13px] text-argo-secondary leading-relaxed">{step}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Tip */}
                            {article.tip && (
                                <div className="flex items-start gap-2.5 rounded-xl bg-argo-violet-50 border border-argo-violet-100 px-3.5 py-2.5">
                                    <Lightbulb size={15} className="text-argo-violet-500 flex-shrink-0 mt-0.5" />
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-bold text-argo-violet-600 uppercase tracking-[0.06em] mb-0.5">{tipLabel}</p>
                                        <p className="text-[12px] text-argo-secondary leading-relaxed">{article.tip}</p>
                                    </div>
                                </div>
                            )}

                            {/* Trial note (only for trial tenants) */}
                            {isTrial && article.trialNote && (
                                <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200/70 px-3.5 py-2.5">
                                    <Lock size={13} className="text-amber-600 flex-shrink-0" />
                                    <p className="text-[12px] text-amber-900 leading-relaxed">{article.trialNote}</p>
                                </div>
                            )}

                            {/* Deep links into the app */}
                            {article.links && article.links.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-0.5">
                                    {article.links.map(link => (
                                        <Link
                                            key={link.to + link.label}
                                            to={link.to}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-argo-border text-[12px] font-semibold text-argo-violet-500 hover:border-argo-violet-200 hover:bg-argo-violet-50 transition-colors"
                                        >
                                            {link.label}
                                            <ArrowRight size={13} />
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
