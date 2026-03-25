import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PairResult } from '../../../lib/groupBalance';
import { getPairGuide } from '../../../lib/groupPairCompatibility';
import { AXIS_CONFIG } from '../../../lib/groupBalanceRules';
import { getDashboardT } from '../../../lib/dashboardTranslations';
import { useLang } from '../../../context/LangContext';

interface Props {
    complementarias: PairResult[];
    afinidades: PairResult[];
}

const PairCard: React.FC<{ pair: PairResult }> = ({ pair }) => {
    const { lang } = useLang();
    const guide = getPairGuide(pair.member1.eje, pair.member2.eje);
    const [expanded, setExpanded] = React.useState(false);

    if (!guide) return null;

    return (
        <div className="rounded-xl border border-argo-border bg-white p-4 space-y-2.5">
            {/* Player names — simple text, no colored badges */}
            <div className="flex items-center gap-2 text-sm">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: AXIS_CONFIG[pair.member1.eje]?.color }} />
                <span className="font-medium text-argo-navy">{pair.member1.child_name}</span>
                <span className="text-argo-light text-xs">+</span>
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: AXIS_CONFIG[pair.member2.eje]?.color }} />
                <span className="font-medium text-argo-navy">{pair.member2.child_name}</span>
            </div>

            {/* Guide title + strength */}
            <p className="text-xs font-semibold text-argo-navy">{guide.title}</p>
            <p className="text-xs text-argo-grey leading-relaxed">{guide.strength}</p>

            {/* Expand: recommendation */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-[10px] font-medium text-argo-grey hover:text-argo-navy transition-colors"
            >
                <motion.svg
                    animate={{ rotate: expanded ? 90 : 0 }}
                    transition={{ duration: 0.18 }}
                    className="w-2.5 h-2.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </motion.svg>
                {expanded
                    ? (lang === 'en' ? 'Hide' : lang === 'pt' ? 'Ocultar' : 'Ocultar')
                    : (lang === 'en' ? 'Recommendation' : lang === 'pt' ? 'Recomendação' : 'Recomendación')
                }
            </button>

            <AnimatePresence>
                {expanded && (
                    <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-xs text-argo-grey leading-relaxed pl-3 border-l-2 border-argo-border overflow-hidden"
                    >
                        {guide.opportunity}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
};

export const PairSuggestions: React.FC<Props> = ({ complementarias, afinidades }) => {
    const { lang } = useLang();
    const dt = getDashboardT(lang);

    if (complementarias.length === 0 && afinidades.length === 0) return null;

    return (
        <div className="space-y-5">
            {complementarias.length > 0 && (
                <div className="space-y-2.5">
                    <p className="text-[11px] font-semibold text-argo-grey uppercase tracking-wide">
                        {dt.groupBalance.estilosComplementan}
                    </p>
                    <div className="space-y-2.5">
                        {complementarias.map((p, i) => (
                            <PairCard key={`c-${i}`} pair={p} />
                        ))}
                    </div>
                </div>
            )}

            {afinidades.length > 0 && (
                <div className="space-y-2.5">
                    <p className="text-[11px] font-semibold text-argo-grey uppercase tracking-wide">
                        {dt.groupBalance.estilosAfines}
                    </p>
                    <div className="space-y-2.5">
                        {afinidades.map((p, i) => (
                            <PairCard key={`a-${i}`} pair={p} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
