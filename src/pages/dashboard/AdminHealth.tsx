import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Activity, AlertTriangle, Bug } from 'lucide-react';
import { Stat, BarRow } from '../../components/ui';

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface AudioRaw {
    created_at: string;
    recovery_type: string;
    screen_index: number | null;
    ctx_state: string | null;
    effect_src: string | null;
    ua: string | null;
    is_demo: boolean;
}

interface ErrorRaw {
    created_at: string;
    kind: string;
    message: string | null;
    source: string | null;
    line: number | null;
    col: number | null;
    stack: string | null;
    url: string | null;
    ua: string | null;
}

interface HealthData {
    audio: {
        total: number;
        demo_count: number;
        by_day: Record<string, number>;
        by_type: Record<string, number>;
        by_screen: Record<number, number>;
        by_device: Record<string, number>;
        recent: AudioRaw[];
    };
    errors: {
        total: number;
        by_day: Record<string, number>;
        by_kind: Record<string, number>;
        by_msg: Record<string, number>;
        by_device: Record<string, number>;
        recent: ErrorRaw[];
    };
    window: { days: number; since: string };
}

/* ── Building blocks ───────────────────────────────────────────────────────── */



/* ── Component ──────────────────────────────────────────────────────────────── */

export const AdminHealth: React.FC = () => {
    const [data, setData] = useState<HealthData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tab, setTab] = useState<'audio' | 'errors'>('audio');

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { setError('No active session'); return; }
            const res = await fetch('/api/admin-health', {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                setError(body.error ?? `HTTP ${res.status}`);
                return;
            }
            setData(await res.json() as HealthData);
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
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">{error ?? 'No data'}</div>
            </div>
        );
    }

    const audioPerDay = data.audio.total / Math.max(data.window.days, 1);
    const errorsPerDay = data.errors.total / Math.max(data.window.days, 1);
    const audioAlarm  = audioPerDay > 30;
    const errorAlarm  = errorsPerDay > 5;

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
                <Activity className="w-5 h-5 text-argo-violet-500" />
                <h1 className="text-xl font-bold text-argo-navy">Health</h1>
                <span className="text-xs text-gray-500">últimos {data.window.days} días</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <Stat label="Audio recoveries" value={data.audio.total} sub={`${audioPerDay.toFixed(1)} / día`} accent={audioAlarm ? 'amber' : 'green'} />
                <Stat label="Audio en demo"     value={data.audio.demo_count} sub="vs prod plays" />
                <Stat label="Client errors"     value={data.errors.total} sub={`${errorsPerDay.toFixed(1)} / día`} accent={errorAlarm ? 'red' : 'green'} />
                <Stat label="Devices con error" value={Object.keys(data.errors.by_device).length} />
            </div>

            <div className="flex gap-1 border-b border-gray-200 mb-5">
                <button
                    onClick={() => setTab('audio')}
                    className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                        tab === 'audio' ? 'text-argo-violet-700 border-argo-violet-500' : 'text-gray-500 border-transparent hover:text-gray-700'
                    }`}
                >
                    <Activity className="w-4 h-4" /> Audio
                </button>
                <button
                    onClick={() => setTab('errors')}
                    className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                        tab === 'errors' ? 'text-argo-violet-700 border-argo-violet-500' : 'text-gray-500 border-transparent hover:text-gray-700'
                    }`}
                >
                    <Bug className="w-4 h-4" /> Errors
                </button>
            </div>

            {tab === 'audio' && <AudioView data={data} alarm={audioAlarm} perDay={audioPerDay} />}
            {tab === 'errors' && <ErrorsView data={data} alarm={errorAlarm} perDay={errorsPerDay} />}
        </div>
    );
};

/* ── Audio tab ──────────────────────────────────────────────────────────────── */

const AudioView: React.FC<{ data: HealthData; alarm: boolean; perDay: number }> = ({ data, alarm, perDay }) => {
    const screenEntries = Object.entries(data.audio.by_screen).map(([k, v]) => ({ screen: Number(k), count: v })).sort((a, b) => b.count - a.count);
    const maxScreen = Math.max(1, ...screenEntries.map(s => s.count));
    const typeEntries = Object.entries(data.audio.by_type).sort((a, b) => b[1] - a[1]);
    const maxType = Math.max(1, ...typeEntries.map(([, v]) => v));
    const deviceEntries = Object.entries(data.audio.by_device).sort((a, b) => b[1] - a[1]);
    const maxDevice = Math.max(1, ...deviceEntries.map(([, v]) => v));
    const dayEntries = Object.entries(data.audio.by_day).sort((a, b) => a[0].localeCompare(b[0])).slice(-14);
    const maxDay = Math.max(1, ...dayEntries.map(([, v]) => v));

    return (
        <>
            {alarm && (
                <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 items-start">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800">
                        Tasa elevada de auto-recuperaciones de audio ({perDay.toFixed(1)} / día). Posible regresión silenciosa.
                    </div>
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h2 className="text-sm font-bold text-argo-navy mb-3">Recoveries por día</h2>
                    {dayEntries.length === 0 ? <p className="text-xs text-gray-400">Sin eventos.</p>
                        : dayEntries.map(([d, c]) => <BarRow key={d} label={d} count={c} max={maxDay} tint="#955FB5" />)}
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h2 className="text-sm font-bold text-argo-navy mb-3">Por tipo</h2>
                    {typeEntries.length === 0 ? <p className="text-xs text-gray-400">Sin eventos.</p>
                        : typeEntries.map(([t, c]) => <BarRow key={t} label={t} count={c} max={maxType} tint="#f97316" />)}
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h2 className="text-sm font-bold text-argo-navy mb-3">Top pantallas</h2>
                    {screenEntries.length === 0 ? <p className="text-xs text-gray-400">Sin eventos.</p>
                        : screenEntries.slice(0, 10).map(({ screen, count }) => <BarRow key={screen} label={`idx ${screen}`} count={count} max={maxScreen} tint="#6366f1" />)}
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h2 className="text-sm font-bold text-argo-navy mb-3">Por device</h2>
                    {deviceEntries.length === 0 ? <p className="text-xs text-gray-400">Sin eventos.</p>
                        : deviceEntries.map(([d, c]) => <BarRow key={d} label={d} count={c} max={maxDevice} tint="#22c55e" />)}
                </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-sm font-bold text-argo-navy mb-3">Últimos 50 audio events</h2>
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
                            {data.audio.recent.length === 0
                                ? <tr><td colSpan={7} className="text-center py-6 text-gray-400">Sin eventos.</td></tr>
                                : data.audio.recent.map((e, i) => (
                                    <tr key={i} className="border-b border-gray-100">
                                        <td className="py-1.5 pr-3 text-gray-600 whitespace-nowrap">{new Date(e.created_at).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'medium' })}</td>
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
        </>
    );
};

/* ── Errors tab ─────────────────────────────────────────────────────────────── */

const ErrorsView: React.FC<{ data: HealthData; alarm: boolean; perDay: number }> = ({ data, alarm, perDay }) => {
    const kindEntries = Object.entries(data.errors.by_kind).sort((a, b) => b[1] - a[1]);
    const maxKind = Math.max(1, ...kindEntries.map(([, v]) => v));
    const msgEntries = Object.entries(data.errors.by_msg).sort((a, b) => b[1] - a[1]).slice(0, 12);
    const maxMsg = Math.max(1, ...msgEntries.map(([, v]) => v));
    const deviceEntries = Object.entries(data.errors.by_device).sort((a, b) => b[1] - a[1]);
    const maxDevice = Math.max(1, ...deviceEntries.map(([, v]) => v));
    const dayEntries = Object.entries(data.errors.by_day).sort((a, b) => a[0].localeCompare(b[0])).slice(-14);
    const maxDay = Math.max(1, ...dayEntries.map(([, v]) => v));

    return (
        <>
            {alarm && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3 items-start">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-red-800">
                        Tasa elevada de errores en browser ({perDay.toFixed(1)} / día). Revisá top messages abajo.
                    </div>
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h2 className="text-sm font-bold text-argo-navy mb-3">Errors por día</h2>
                    {dayEntries.length === 0 ? <p className="text-xs text-gray-400">Sin errores.</p>
                        : dayEntries.map(([d, c]) => <BarRow key={d} label={d} count={c} max={maxDay} tint="#dc2626" />)}
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h2 className="text-sm font-bold text-argo-navy mb-3">Por kind</h2>
                    {kindEntries.length === 0 ? <p className="text-xs text-gray-400">Sin errores.</p>
                        : kindEntries.map(([t, c]) => <BarRow key={t} label={t} count={c} max={maxKind} tint="#9333ea" />)}
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5 md:col-span-2">
                    <h2 className="text-sm font-bold text-argo-navy mb-3">Top mensajes</h2>
                    {msgEntries.length === 0 ? <p className="text-xs text-gray-400">Sin errores.</p>
                        : msgEntries.map(([m, c]) => <BarRow key={m} label={m} count={c} max={maxMsg} tint="#ef4444" />)}
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h2 className="text-sm font-bold text-argo-navy mb-3">Por device</h2>
                    {deviceEntries.length === 0 ? <p className="text-xs text-gray-400">Sin errores.</p>
                        : deviceEntries.map(([d, c]) => <BarRow key={d} label={d} count={c} max={maxDevice} tint="#0891b2" />)}
                </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-sm font-bold text-argo-navy mb-3">Últimos 50 client errors</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="text-left text-gray-500 border-b border-gray-200">
                                <th className="py-2 pr-3 font-semibold">Hora</th>
                                <th className="py-2 pr-3 font-semibold">Kind</th>
                                <th className="py-2 pr-3 font-semibold">Mensaje</th>
                                <th className="py-2 pr-3 font-semibold">URL</th>
                                <th className="py-2 pr-3 font-semibold">Device</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.errors.recent.length === 0
                                ? <tr><td colSpan={5} className="text-center py-6 text-gray-400">Sin errores.</td></tr>
                                : data.errors.recent.map((e, i) => (
                                    <tr key={i} className="border-b border-gray-100">
                                        <td className="py-1.5 pr-3 text-gray-600 whitespace-nowrap">{new Date(e.created_at).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'medium' })}</td>
                                        <td className="py-1.5 pr-3 font-medium text-argo-navy">{e.kind}</td>
                                        <td className="py-1.5 pr-3 text-gray-700 truncate max-w-[260px]" title={e.message ?? ''}>{e.message ?? '—'}</td>
                                        <td className="py-1.5 pr-3 text-gray-600 truncate max-w-[180px]" title={e.url ?? ''}>{e.url ?? '—'}</td>
                                        <td className="py-1.5 pr-3 text-gray-600 truncate max-w-[200px]">{e.ua?.slice(0, 40) ?? '—'}</td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};
