import { useState } from 'react';
import { LaTormenta, AdaptationMetrics } from '../components/games/LaTormenta';

export const TestTormenta: React.FC = () => {
    const [metrics, setMetrics] = useState<AdaptationMetrics | null>(null);

    if (metrics) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
                <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full text-white space-y-6">
                    <h2 className="font-adventure text-2xl text-center">Metricas de adaptacion</h2>

                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between border-b border-slate-700 pb-2">
                            <span className="text-slate-400">Tiempo total</span>
                            <span className="font-mono">{(metrics.totalTimeMs / 1000).toFixed(1)}s</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-700 pb-2">
                            <span className="text-slate-400">Adaptacion promedio</span>
                            <span className="font-mono">{metrics.avgAdaptation}ms</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-700 pb-2">
                            <span className="text-slate-400">Errores de inercia</span>
                            <span className="font-mono">{metrics.inertiaErrors}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-700 pb-2">
                            <span className="text-slate-400">Taps correctos</span>
                            <span className="font-mono">{metrics.correctTaps}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-700 pb-2">
                            <span className="text-slate-400">Taps incorrectos</span>
                            <span className="font-mono">{metrics.wrongTaps}</span>
                        </div>

                        {metrics.adaptationTimes.length > 0 && (
                            <div className="pt-2">
                                <span className="text-slate-400 text-xs block mb-2">Tiempo de adaptacion por cambio:</span>
                                <div className="flex gap-3">
                                    {metrics.adaptationTimes.map((at, i) => (
                                        <div key={i} className="flex-1 text-center">
                                            <div
                                                className="bg-amber-500/30 rounded-t mx-auto"
                                                style={{
                                                    width: '100%',
                                                    height: Math.max(12, (at / Math.max(...metrics.adaptationTimes)) * 60),
                                                }}
                                            />
                                            <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                                                {(at / 1000).toFixed(1)}s
                                            </span>
                                            <span className="text-[9px] text-slate-600">
                                                Cambio {i + 1}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setMetrics(null)}
                        className="w-full py-3 bg-amber-600 hover:bg-amber-500 rounded-xl text-sm font-semibold transition-colors"
                    >
                        Jugar de nuevo
                    </button>
                </div>
            </div>
        );
    }

    return <LaTormenta onComplete={setMetrics} />;
};
