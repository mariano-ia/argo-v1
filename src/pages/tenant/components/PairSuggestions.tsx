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

const PlayerChip: React.FC<{ name: string; axis: string }> = ({ name, axis }) => {
    const cfg = AXIS_CONFIG[axis];
    return (
        <div className="flex items-center gap-1.5 min-w-0">
            <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                style={{ backgroundColor: cfg?.color ?? '#666' }}
            >
                {axis}
            </span>
            <span className="text-sm font-semibold text-argo-navy truncate">{name}</span>
        </div>
    );
};

const PairCard: React.FC<{ pair: PairResult }> = ({ pair }) => {
    const { lang } = useLang();
    const dt = getDashboardT(lang);
    const guide = getPairGuide(pair.member1.eje, pair.member2.eje);
    const [expanded, setExpanded] = React.useState(false);

    if (!guide) return null;

    const c1 = AXIS_CONFIG[pair.member1.eje];
    const c2 = AXIS_CONFIG[pair.member2.eje];

    // Use a gradient stop color for the card accent — pick first player's axis
    const accentColor = c1?.color ?? '#6366f1';
    const accentBg = c1?.bgColor ?? '#eef2ff';

    return (
        <div
            className="rounded-xl border border-argo-border bg-white shadow-sm overflow-hidden transition-all hover:shadow-md"
        >
            {/* Top accent strip */}
            <div className="h-1" style={{ background: `linear-gradient(to right, ${c1?.color ?? '#666'}, ${c2?.color ?? '#999'})` }} />

            <div className="p-4 space-y-3">
                {/* Player names */}
                <div className="flex items-center gap-2 flex-wrap">
                    <PlayerChip name={pair.member1.child_name} axis={pair.member1.eje} />
                    <span className="text-argo-grey text-xs font-medium">+</span>
                    <PlayerChip name={pair.member2.child_name} axis={pair.member2.eje} />
                </div>

                {/* Guide title */}
                <p className="text-xs font-bold text-argo-navy">{guide.title}</p>

                {/* Strength */}
                <p className="text-xs text-argo-grey leading-relaxed">{guide.strength}</p>

                {/* Expand: opportunity */}
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="flex items-center gap-1 text-[11px] font-semibold transition-opacity hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-offset-1 rounded-lg"
                    style={{ color: accentColor }}
                >
                    <motion.svg
                        animate={{ rotate: expanded ? 90 : 0 }}
                        transition={{ duration: 0.18 }}
                        className="w-3 h-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </motion.svg>
                    {expanded ? dt.groupBalance.ocultarSugerencia : dt.groupBalance.verSugerencia}
                </button>

                <AnimatePresence>
                    {expanded && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <p
                                className="text-xs leading-relaxed pl-3 border-l-2"
                                style={{ color: '#5a5a7a', borderColor: accentColor + '55', backgroundColor: accentBg, borderRadius: '0 6px 6px 0', padding: '8px 12px' }}
                            >
                                {guide.opportunity}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export const PairSuggestions: React.FC<Props> = ({ complementarias, afinidades }) => {
    const { lang } = useLang();
    const dt = getDashboardT(lang);

    if (complementarias.length === 0 && afinidades.length === 0) return null;

    return (
        <div className="space-y-6">
            {complementarias.length > 0 && (
                <div className="space-y-3">
                    <div className="space-y-0.5">
                        <p className="text-xs font-bold text-argo-navy uppercase tracking-widest">
                            {dt.groupBalance.estilosComplementan}
                        </p>
                        <p className="text-xs text-argo-grey">
                            {dt.groupBalance.estilosComplementanDesc}
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {complementarias.map((p, i) => (
                            <PairCard key={`c-${i}`} pair={p} />
                        ))}
                    </div>
                </div>
            )}

            {afinidades.length > 0 && (
                <div className="space-y-3">
                    <div className="space-y-0.5">
                        <p className="text-xs font-bold text-argo-navy uppercase tracking-widest">
                            {dt.groupBalance.estilosAfines}
                        </p>
                        <p className="text-xs text-argo-grey">
                            {dt.groupBalance.estilosAfinesDesc}
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {afinidades.map((p, i) => (
                            <PairCard key={`a-${i}`} pair={p} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
