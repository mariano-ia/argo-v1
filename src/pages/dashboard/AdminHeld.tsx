import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { AlertTriangle, Clock, RefreshCw, Send, ShieldCheck } from 'lucide-react';

// "Retenidos": la cola de informes v4 que el gate fail-closed no dejó salir (report_status='held')
// más los 'pending' atascados. Superadmin only. Acciones: Revisar y liberar (re-gatea el report_v4
// guardado; si pasa, lo envía) o Forzar envío (override humano tras revisión). Inerte hasta V4_SEAL='on'.

interface HeldRow {
    id: string;
    child_name: string | null;
    child_age: number | null;
    sport: string | null;
    adult_name: string | null;
    adult_email: string | null;
    archetype_label: string | null;
    eje: string | null;
    lang: string | null;
    report_status: string | null;
    held_reason: string | null;
    held_at: string | null;
    retry_count: number | null;
    last_error: string | null;
    report_qc: { pass?: boolean; reasons?: { code: string; detail: string }[] } | null;
    tenant_id: string | null;
    created_at: string;
}

// Motivos de retención en lenguaje humano (no técnico).
const REASON_LABEL: Record<string, string> = {
    datos_insuficientes: 'Datos insuficientes',
    nombre_invalido: 'Nombre inválido',
    axis_mismatch: 'Perfil irresoluble',
    empate_total: 'Empate de los 4 ejes',
    forma_corta: 'Informe muy corto',
    faltan_secciones: 'Faltan secciones',
    placeholder: 'Placeholder sin resolver',
    literal_basura: 'Texto basura',
    guard_prohibido: 'Palabra prohibida',
    guard_determinista: 'Lenguaje determinista',
    guard_voseo: 'Voseo',
    guard_guion: 'Guion largo',
    idioma: 'Idioma no soportado',
    veta_inconsistente: 'Veta inconsistente',
    repeticion: 'Secciones repetidas',
    procedencia_fallback: 'Origen fallback',
    recovery_failed: 'Falló la recuperación',
    sin_motivo: 'Sin motivo',
};

const holdAge = (iso: string | null): string => {
    if (!iso) return '—';
    const ms = Date.now() - Date.parse(iso);
    const h = Math.floor(ms / 3_600_000);
    if (h < 1) return `${Math.max(0, Math.floor(ms / 60_000))} min`;
    if (h < 48) return `${h} h`;
    return `${Math.floor(h / 24)} d`;
};

export const AdminHeld: React.FC = () => {
    const [held, setHeld] = useState<HeldRow[]>([]);
    const [pending, setPending] = useState<HeldRow[]>([]);
    const [summary, setSummary] = useState<{ heldCount: number; pendingCount: number; byReason: Record<string, number> } | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState<string | null>(null);
    const [msg, setMsg] = useState<{ id: string; text: string; ok: boolean } | null>(null);

    const fetchData = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        try {
            const res = await fetch('/api/admin-held-reports', { headers: { Authorization: `Bearer ${session.access_token}` } });
            if (res.ok) {
                const data = await res.json();
                setHeld(data.held ?? []);
                setPending(data.pending ?? []);
                setSummary(data.summary ?? null);
            }
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const act = useCallback(async (row: HeldRow, action: 'release' | 'force') => {
        if (action === 'force' && !window.confirm(`Forzar el envío del informe de ${row.child_name ?? 'este niño'} pese al control de calidad. ¿Confirmás?`)) return;
        setBusy(row.id);
        setMsg(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            const res = await fetch('/api/admin-approve-report', {
                method: 'POST',
                headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: row.id, action }),
            });
            const data = await res.json();
            if (res.ok && data.ok) {
                setMsg({ id: row.id, ok: true, text: data.sent ? 'Liberado y enviado.' : 'Liberado (sin email: sin dirección o ya enviado).' });
            } else if (res.ok && !data.ok) {
                setMsg({ id: row.id, ok: false, text: `Sigue retenido: ${REASON_LABEL[data.reason] ?? data.reason}.` });
            } else {
                setMsg({ id: row.id, ok: false, text: data.error ?? 'Error al procesar.' });
            }
            await fetchData();
        } catch (e) {
            setMsg({ id: row.id, ok: false, text: e instanceof Error ? e.message : 'Error de red.' });
        } finally {
            setBusy(null);
        }
    }, [fetchData]);

    if (loading) {
        return <div className="flex items-center justify-center py-20"><div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" /></div>;
    }

    const rows = [...held, ...pending];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-gray-900">Retenidos</h1>
                <p className="text-sm text-gray-500 mt-0.5">Informes que el control de calidad frenó antes de enviar. Revisá el motivo y liberá o forzá el envío.</p>
            </div>

            {summary && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                        <p className="text-[11px] font-semibold text-gray-400 uppercase">Retenidos</p>
                        <p className="text-lg font-bold text-amber-700">{summary.heldCount}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                        <p className="text-[11px] font-semibold text-gray-400 uppercase">Pendientes</p>
                        <p className="text-lg font-bold text-gray-900">{summary.pendingCount}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                        <p className="text-[11px] font-semibold text-gray-400 uppercase">Motivo más común</p>
                        <p className="text-sm font-bold text-gray-900">
                            {Object.entries(summary.byReason).sort((a, b) => b[1] - a[1])[0]
                                ? REASON_LABEL[Object.entries(summary.byReason).sort((a, b) => b[1] - a[1])[0][0]] ?? Object.entries(summary.byReason).sort((a, b) => b[1] - a[1])[0][0]
                                : '—'}
                        </p>
                    </div>
                </div>
            )}

            <div className="space-y-3">
                {rows.map(row => (
                    <div key={row.id} className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-900">{row.child_name ?? '(sin nombre)'}</span>
                                    {row.child_age != null && <span className="text-xs text-gray-400">{row.child_age} años</span>}
                                    {row.sport && <span className="text-xs text-gray-400">· {row.sport}</span>}
                                    {row.lang && row.lang !== 'es' && <span className="text-[10px] uppercase bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{row.lang}</span>}
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">{row.archetype_label ?? row.eje ?? ''}{row.adult_email ? ` · ${row.adult_email}` : ''}</div>
                            </div>
                            <div className="flex items-center gap-2 flex-none">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-flex items-center gap-1 ${row.report_status === 'held' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                                    <AlertTriangle size={11} /> {REASON_LABEL[row.held_reason ?? 'sin_motivo'] ?? row.held_reason}
                                </span>
                                <span className="text-[11px] text-gray-400 inline-flex items-center gap-1"><Clock size={11} /> {holdAge(row.held_at ?? row.created_at)}</span>
                            </div>
                        </div>

                        {(row.report_qc?.reasons?.length || row.last_error || (row.retry_count ?? 0) > 0) && (
                            <div className="mt-2 text-[11px] text-gray-500 space-y-0.5">
                                {row.report_qc?.reasons?.slice(0, 6).map((rr, i) => (
                                    <div key={i}><span className="font-semibold text-gray-600">{REASON_LABEL[rr.code] ?? rr.code}:</span> {rr.detail}</div>
                                ))}
                                {row.last_error && <div><span className="font-semibold text-gray-600">Último error:</span> {row.last_error}</div>}
                                {(row.retry_count ?? 0) > 0 && <div className="text-gray-400">Reintentos: {row.retry_count}</div>}
                            </div>
                        )}

                        <div className="mt-3 flex items-center gap-2">
                            <button
                                onClick={() => act(row, 'release')}
                                disabled={busy === row.id}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
                                {busy === row.id ? <RefreshCw size={13} className="animate-spin" /> : <ShieldCheck size={13} />} Revisar y liberar
                            </button>
                            <button
                                onClick={() => act(row, 'force')}
                                disabled={busy === row.id}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-amber-300 text-amber-700 hover:bg-amber-50 disabled:opacity-50">
                                <Send size={13} /> Forzar envío
                            </button>
                            {msg && msg.id === row.id && (
                                <span className={`text-xs ${msg.ok ? 'text-green-600' : 'text-red-500'}`}>{msg.text}</span>
                            )}
                        </div>
                    </div>
                ))}
                {rows.length === 0 && (
                    <div className="bg-white rounded-lg border border-gray-200 px-4 py-10 text-center">
                        <ShieldCheck size={20} className="mx-auto text-green-400 mb-2" />
                        <p className="text-sm text-gray-400">No hay informes retenidos. Todo lo que se generó pasó el control de calidad.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminHeld;
