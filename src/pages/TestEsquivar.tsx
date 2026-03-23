import { useState } from 'react';
import { MiniGame1, RhythmMetrics } from '../components/onboarding/screens/MiniGame1';

export const TestEsquivar: React.FC = () => {
    const [metrics, setMetrics] = useState<RhythmMetrics | null>(null);

    if (metrics) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
                <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full text-white space-y-6">
                    <h2 className="font-adventure text-2xl text-center">Metricas de ritmo</h2>

                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between border-b border-slate-700 pb-2">
                            <span className="text-slate-400">Tiempo total</span>
                            <span className="font-mono">{(metrics.totalTimeMs / 1000).toFixed(1)}s</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-700 pb-2">
                            <span className="text-slate-400">Reaccion promedio</span>
                            <span className="font-mono">{metrics.avgReaction}ms</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-700 pb-2">
                            <span className="text-slate-400">Total taps</span>
                            <span className="font-mono">{metrics.totalTaps}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-700 pb-2">
                            <span className="text-slate-400">Taps extra (sin obstaculo)</span>
                            <span className="font-mono">{metrics.extraTaps}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-700 pb-2">
                            <span className="text-slate-400">Cadencia promedio</span>
                            <span className="font-mono">{metrics.avgCadence}ms</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-700 pb-2">
                            <span className="text-slate-400">Tendencia</span>
                            <span className="font-mono">
                                {metrics.trend < -100 ? 'Acelerando' : metrics.trend > 100 ? 'Desacelerando' : 'Estable'}
                                {' '}({metrics.trend > 0 ? '+' : ''}{metrics.trend}ms)
                            </span>
                        </div>

                        <div className="pt-2">
                            <span className="text-slate-400 text-xs block mb-2">Tiempos de reaccion:</span>
                            <div className="flex gap-1.5">
                                {metrics.reactionTimes.map((rt, i) => (
                                    <div key={i} className="flex-1 text-center">
                                        <div
                                            className="bg-cyan-500/30 rounded-t"
                                            style={{ height: Math.max(8, (rt / Math.max(...metrics.reactionTimes)) * 60) }}
                                        />
                                        <span className="text-[9px] font-mono text-slate-500 mt-1 block">
                                            {rt}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => setMetrics(null)}
                        className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-sm font-semibold transition-colors"
                    >
                        Jugar de nuevo
                    </button>
                </div>
            </div>
        );
    }

    return <MiniGame1 onComplete={setMetrics} />;
};
