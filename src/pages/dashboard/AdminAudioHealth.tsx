import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Activity, AlertTriangle } from 'lucide-react';

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface RawEvent {
    created_at: string;
    recovery_type: string;
    screen_index: number | null;
    ctx_state: string | null;
    effect_src: string | null;
    ua: string | null;
    is_demo: boolean;
}

interface HealthData {
    total: number;
    demo_count: number;
    by_day: Record<string, number>;
    by_type: Record<string, number>;
    by_screen: Record<number, number>;
    by_device: Record<string, number>;
    recent: RawEvent[];
    window: { days: number; since: string };
}

/* ── Component ──────────────────────────────────────────────────────────────── */

const Stat: React.FC<{ label: string; value: string | number; sub?: string; accent?: 'green' | 'amber' | 'red' }> = ({
    label, value, sub, accent,
}) => {
    const colorMap = {
        green: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        amber: 'bg-amber-50  border-amber-200  text-amber-700',
        red:   'bg-red-50    border-red-200    text-red-700',
    } as const;
    const cls = accent ? colorMap[accent] : 'bg-white border-gray-200 text-gray-900';
    return (
        <div className={`rounded-lg border px-4 py-3 ${cls}`}>
            <p className="text-[11px] font-semibold uppercase opacity-70">{label}</p>
            <p className="text-lg font-bold">{value}</p>
            {sub && <p className="text-[10px] opacity-60">{sub}</p>}
        </div>
    );
};

const BarRow: React.FC<{ label: string; count: number; max: number; tint?: string }> = ({ label, count, max, tint = '#955FB5' }) => {
    const pct = max > 0 ? (count / max) * 100 : 0;
    return (
        <div className="flex items-center gap-3 mb-1.5">
            <span className="text-xs text-gray-600 w-40 truncate">{label}</span>
            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: tint }} />
            </div>
            <span className="text-xs font-mono text-gray-700 w-12 text-right">{count}</span>
        </div>
    );
};

export const AdminAudioHealth: React.FC = () => {
    const [data, setData] = useState<HealthData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setError('No active session');
                return;
            }
            const res = await fetch('/api/admin-audio-health', {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                setError(body.error ?? `HTTP ${res.status}`);
                return;
            }
            const payload = await res.json() as HealthData;
            setData(payload);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Unexpected error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-5 h-5 rounded-full border-2 border-argo-violet-500 border-t-transparent animate-spin" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                    {error ?? 'No data'}
                </div>
            </div>
        );
    }

    const perDay = data.total / Math.max(data.window.days, 1);
    // Heuristic alert: more than 30 recoveries/day on average suggests
    // a real-world regression worth investigating.
    const alarm = perDay > 30;

    const screenEntries = Object.entries(data.by_screen)
        .map(([k, v]) => ({ screen: Number(k), count: v }))
        .sort((a, b) => b.count - a.count);
    const maxScreen = Math.max(1, ...screenEntries.map(s => s.count));

    const typeEntries = Object.entries(data.by_type).sort((a, b) => b[1] - a[1]);
    const maxType = Math.max(1, ...typeEntries.map(([, v]) => v));

    const deviceEntries = Object.entries(data.by_device).sort((a, b) => b[1] - a[1]);
    const maxDevice = Math.max(1, ...deviceEntries.map(([, v]) => v));

    const dayEntries = Object.entries(data.by_day)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-14);
    const maxDay = Math.max(1, ...dayEntries.map(([, v]) => v));

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
                <Activity className="w-5 h-5 text-argo-violet-500" />
                <h1 className="text-xl font-bold text-argo-navy">Audio health</h1>
                <span className="text-xs text-gray-500">últimos {data.window.days} días</span>
            </div>

            {alarm && (
                <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 items-start">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800">
                        Tasa elevada de auto-recuperaciones ({perDay.toFixed(1)} / día). Posible regresión silenciosa. Revisá los breakdowns abajo.
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <Stat label="Total recoveries" value={data.total} sub={`${perDay.toFixed(1)} / día`} accent={alarm ? 'amber' : 'green'} />
                <Stat label="En demo" value={data.demo_count} sub="vs prod plays" />
                <Stat label="Tipos distintos" value={typeEntries.length} />
                <Stat label="Devices afectados" value={deviceEntries.length} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h2 className="text-sm font-bold text-argo-navy mb-3">Recoveries por día</h2>
                    {dayEntries.length === 0
                        ? <p className="text-xs text-gray-400">Sin eventos en la ventana.</p>
                        : dayEntries.map(([day, count]) =>
                            <BarRow key={day} label={day} count={count} max={maxDay} tint="#955FB5" />
                          )}
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h2 className="text-sm font-bold text-argo-navy mb-3">Por tipo</h2>
                    {typeEntries.length === 0
                        ? <p className="text-xs text-gray-400">Sin eventos.</p>
                        : typeEntries.map(([type, count]) =>
                            <BarRow key={type} label={type} count={count} max={maxType} tint="#f97316" />
                          )}
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h2 className="text-sm font-bold text-argo-navy mb-3">Top pantallas</h2>
                    {screenEntries.length === 0
                        ? <p className="text-xs text-gray-400">Sin eventos.</p>
                        : screenEntries.slice(0, 10).map(({ screen, count }) =>
                            <BarRow key={screen} label={`idx ${screen}`} count={count} max={maxScreen} tint="#6366f1" />
                          )}
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h2 className="text-sm font-bold text-argo-navy mb-3">Por device</h2>
                    {deviceEntries.length === 0
                        ? <p className="text-xs text-gray-400">Sin eventos.</p>
                        : deviceEntries.map(([device, count]) =>
                            <BarRow key={device} label={device} count={count} max={maxDevice} tint="#22c55e" />
                          )}
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 mt-6">
                <h2 className="text-sm font-bold text-argo-navy mb-3">Últimos 50 eventos</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="text-left text-gray-500 border-b border-gray-200">
                                <th className="py-2 pr-3 font-semibold">Hora</th>
                                <th className="py-2 pr-3 font-semibold">Tipo</th>
                                <th className="py-2 pr-3 font-semibold">Idx</th>
                                <th className="py-2 pr-3 font-semibold">Ctx</th>
                                <th className="py-2 pr-3 font-semibold">Effect</th>
                                <th className="py-2 pr-3 font-semibold">Device</th>
                                <th className="py-2 pr-3 font-semibold">Demo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.recent.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-6 text-gray-400">Sin eventos.</td></tr>
                            ) : data.recent.map((e, i) => (
                                <tr key={i} className="border-b border-gray-100">
                                    <td className="py-1.5 pr-3 text-gray-600 whitespace-nowrap">
                                        {new Date(e.created_at).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'medium' })}
                                    </td>
                                    <td className="py-1.5 pr-3 font-medium text-argo-navy">{e.recovery_type}</td>
                                    <td className="py-1.5 pr-3 font-mono text-gray-700">{e.screen_index ?? '—'}</td>
                                    <td className="py-1.5 pr-3 text-gray-600">{e.ctx_state ?? '—'}</td>
                                    <td className="py-1.5 pr-3 text-gray-600 truncate max-w-[140px]">{e.effect_src?.split('/').pop() ?? '—'}</td>
                                    <td className="py-1.5 pr-3 text-gray-600 truncate max-w-[200px]">{e.ua?.slice(0, 40) ?? '—'}</td>
                                    <td className="py-1.5 pr-3">{e.is_demo ? '✓' : ''}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
