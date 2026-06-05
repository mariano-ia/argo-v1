import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

interface ConsiliumSummary {
    incidents_opened: number; incidents_resolved: number;
    mttr_minutes: number | null; approval_rate: number | null;
    decisions: number; top_classes: Array<{ class_id: string; count: number }>;
}
interface ConsiliumData { periodStart: string; periodEnd: string; summary: ConsiliumSummary; }

export const Consilium: React.FC = () => {
    const [data, setData] = useState<ConsiliumData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setLoading(false); return; }
        const res = await fetch('/api/principia-consilium', { headers: { Authorization: `Bearer ${session.access_token}` } });
        if (res.ok) setData(await res.json());
        setLoading(false);
    }, []);
    useEffect(() => { fetchData(); }, [fetchData]);

    if (loading) return <p className="text-argo-grey">Cargando...</p>;
    if (!data) return <p className="text-argo-grey">Sin datos del Consilium.</p>;
    const s = data.summary;
    const fmt = (n: number | null, suffix = '') => (n == null ? '-' : `${n}${suffix}`);

    return (
        <div>
            <h1 className="text-2xl font-bold text-argo-navy">Consilium</h1>
            <p className="mt-1 text-sm text-argo-grey">
                El reloj lento. Resumen de la semana (solo lectura). {data.periodStart} a {data.periodEnd}.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                    { label: 'Incidentes abiertos', value: fmt(s.incidents_opened) },
                    { label: 'Resueltos', value: fmt(s.incidents_resolved) },
                    { label: 'MTTR (min)', value: fmt(s.mttr_minutes) },
                    { label: 'Tasa de aprobacion', value: fmt(s.approval_rate, '%') },
                ].map(k => (
                    <div key={k.label} className="rounded-lg border border-argo-border bg-white px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-widest text-argo-grey">{k.label}</p>
                        <p className="text-lg font-bold text-argo-navy">{k.value}</p>
                    </div>
                ))}
            </div>

            <h2 className="mt-6 text-xs font-semibold uppercase tracking-widest text-argo-grey">Clases mas frecuentes</h2>
            <div className="mt-2 rounded-[14px] border border-argo-border bg-white p-4 shadow-argo">
                {s.top_classes.length === 0
                    ? <p className="text-argo-grey">Sin incidentes esta semana.</p>
                    : (
                        <ul className="space-y-1 text-sm text-argo-secondary">
                            {s.top_classes.map(c => (
                                <li key={c.class_id} className="flex justify-between">
                                    <span>Clase {c.class_id}</span>
                                    <span className="font-mono text-argo-navy">{c.count}</span>
                                </li>
                            ))}
                        </ul>
                    )}
            </div>

            <p className="mt-4 text-xs text-argo-light">
                El Consilium es de solo lectura en v1. Ajustar el rumbo y graduar la autonomia llega despues.
            </p>
        </div>
    );
};
