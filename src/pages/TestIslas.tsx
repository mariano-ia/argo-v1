import { useState } from 'react';
import { IslasDesconocidas, IslandMetrics } from '../components/games/IslasDesconocidas';

export const TestIslas: React.FC = () => {
    const [metrics, setMetrics] = useState<IslandMetrics | null>(null);

    if (metrics) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
                <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full text-white space-y-6">
                    <h2 className="font-adventure text-2xl text-center">Resultados del juego</h2>

                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between border-b border-slate-700 pb-2">
                            <span className="text-slate-400">Tiempo total</span>
                            <span className="font-mono">{(metrics.totalTimeMs / 1000).toFixed(1)}s</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-700 pb-2">
                            <span className="text-slate-400">Latencia promedio</span>
                            <span className="font-mono">{metrics.avgLatency}ms</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-700 pb-2">
                            <span className="text-slate-400">Desviacion estandar</span>
                            <span className="font-mono">{metrics.stdDevLatency}ms</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-700 pb-2">
                            <span className="text-slate-400">Tendencia</span>
                            <span className="font-mono">
                                {metrics.trend < 0 ? 'Acelerando' : metrics.trend > 200 ? 'Desacelerando' : 'Estable'}
                                {' '}({metrics.trend > 0 ? '+' : ''}{metrics.trend}ms)
                            </span>
                        </div>

                        <div className="pt-2">
                            <span className="text-slate-400 text-xs block mb-2">Latencias por isla:</span>
                            <div className="flex gap-2">
                                {metrics.latencies.map((lat, i) => (
                                    <div key={i} className="flex-1 text-center">
                                        <div
                                            className="bg-cyan-500/30 rounded-t"
                                            style={{ height: Math.max(8, (lat / Math.max(...metrics.latencies)) * 80) }}
                                        />
                                        <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                                            {(lat / 1000).toFixed(1)}s
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

    return <IslasDesconocidas onComplete={setMetrics} />;
};
