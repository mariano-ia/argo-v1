import React from 'react';
import type { PairResult } from '../../../lib/groupBalance';
import { getPairGuide } from '../../../lib/groupPairCompatibility';
import { AXIS_CONFIG } from '../../../lib/groupBalanceRules';

interface Props {
    complementarias: PairResult[];
    afinidades: PairResult[];
}

const PairCard: React.FC<{ pair: PairResult }> = ({ pair }) => {
    const guide = getPairGuide(pair.member1.eje, pair.member2.eje);
    const [expanded, setExpanded] = React.useState(false);

    if (!guide) return null;

    const c1 = AXIS_CONFIG[pair.member1.eje];
    const c2 = AXIS_CONFIG[pair.member2.eje];

    return (
        <div className="border border-argo-border rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
                <span
                    className="px-2 py-0.5 rounded text-[10px] font-bold text-white"
                    style={{ background: c1?.color ?? '#666' }}
                >
                    {pair.member1.eje}
                </span>
                <span className="text-xs font-medium text-argo-navy truncate">{pair.member1.child_name}</span>
                <span className="text-argo-grey text-xs">+</span>
                <span
                    className="px-2 py-0.5 rounded text-[10px] font-bold text-white"
                    style={{ background: c2?.color ?? '#666' }}
                >
                    {pair.member2.eje}
                </span>
                <span className="text-xs font-medium text-argo-navy truncate">{pair.member2.child_name}</span>
            </div>

            <p className="text-xs font-semibold text-argo-navy">{guide.title}</p>
            <p className="text-xs text-argo-grey leading-relaxed">{guide.strength}</p>

            <button
                onClick={() => setExpanded(!expanded)}
                className="text-[11px] text-argo-indigo hover:text-argo-navy transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-argo-indigo/30 rounded-lg"
            >
                {expanded ? 'Ocultar herramientas' : 'Ver herramientas para el adulto'}
            </button>
            {expanded && (
                <p className="text-xs text-argo-grey leading-relaxed pl-3 border-l-2 border-argo-indigo/20">
                    {guide.opportunity}
                </p>
            )}
        </div>
    );
};

export const PairSuggestions: React.FC<Props> = ({ complementarias, afinidades }) => {
    if (complementarias.length === 0 && afinidades.length === 0) return null;

    return (
        <div className="space-y-4">
            <h3 className="text-xs font-bold text-argo-navy uppercase tracking-widest">Guía de duplas</h3>

            {complementarias.length > 0 && (
                <div className="space-y-2">
                    <p className="text-[11px] font-semibold text-argo-grey uppercase tracking-wider">Mayor complementariedad</p>
                    {complementarias.map((p, i) => <PairCard key={`c-${i}`} pair={p} />)}
                </div>
            )}

            {afinidades.length > 0 && (
                <div className="space-y-2">
                    <p className="text-[11px] font-semibold text-argo-grey uppercase tracking-wider">Mayor afinidad natural</p>
                    {afinidades.map((p, i) => <PairCard key={`a-${i}`} pair={p} />)}
                </div>
            )}
        </div>
    );
};
