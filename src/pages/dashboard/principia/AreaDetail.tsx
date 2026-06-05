import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { getArea } from '../../../lib/principia/areas';
import type { AreaId } from '../../../lib/principia/types';

interface ActaRow { id: number; recorded_at: string; event_type: string; action: string; status: string | null; }
interface OrdoRow { id: number; kind: string; description: string; status: string; origin: string | null; }

export const AreaDetail: React.FC = () => {
    const { areaId } = useParams<{ areaId: string }>();
    const area = getArea((areaId as AreaId) ?? 'producto');
    const [acta, setActa] = useState<ActaRow[]>([]);
    const [ordines, setOrdines] = useState<OrdoRow[]>([]);

    const fetchCommentarii = useCallback(async () => {
        if (area.status !== 'live') return;
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const res = await fetch(`/api/principia-area?area=${area.id}`, { headers: { Authorization: `Bearer ${session.access_token}` } });
        if (res.ok) { const b = await res.json(); setActa(b.acta ?? []); setOrdines(b.ordines ?? []); }
    }, [area]);
    useEffect(() => { fetchCommentarii(); }, [fetchCommentarii]);

    return (
        <div>
            <h1 className="text-2xl font-bold text-argo-navy">{area.label} - {area.agentName}</h1>
            <span className="mt-1 inline-block text-xs uppercase tracking-widest text-argo-grey">{area.status === 'live' ? 'EN VIVO' : 'proximamente'}</span>

            <section className="mt-6">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-argo-grey">Mandatum</h2>
                <p className="mt-2 text-sm text-argo-secondary">{area.mandatum}</p>
                {area.setpoint.signals.length > 0 && (
                    <ul className="mt-3 space-y-1 text-sm text-argo-secondary">
                        {area.setpoint.signals.map(s => (
                            <li key={s.signal_key}>- {s.label}: {s.comparator} {s.target} {s.unit}</li>
                        ))}
                    </ul>
                )}
            </section>

            {area.status !== 'live' ? (
                <div className="mt-6 rounded-[14px] border border-argo-border bg-argo-bg p-6 text-center">
                    <p className="font-semibold text-argo-navy">Modulo en construccion.</p>
                    <p className="mt-1 text-sm text-argo-grey">Esta cohorte heredara Bandeja, Incidentes y Registros cuando entre en vivo.</p>
                </div>
            ) : (
                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                    <section className="rounded-[14px] border border-argo-border bg-white p-4 shadow-argo">
                        <h2 className="text-xs font-semibold uppercase tracking-widest text-argo-grey">Acta (lo que hizo)</h2>
                        <ul className="mt-2 space-y-1 text-sm">
                            {acta.map(a => (
                                <li key={a.id} className="flex gap-2 text-argo-secondary">
                                    <span className="font-mono text-xs text-argo-grey">{new Date(a.recorded_at).toLocaleString('es', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</span>
                                    <span className="text-argo-navy">{a.action}</span>
                                </li>
                            ))}
                            {acta.length === 0 && <li className="text-argo-grey">Sin actividad aun.</li>}
                        </ul>
                    </section>
                    <section className="rounded-[14px] border border-argo-border bg-white p-4 shadow-argo">
                        <h2 className="text-xs font-semibold uppercase tracking-widest text-argo-grey">Ordines (lo que tiene pendiente)</h2>
                        <ul className="mt-2 space-y-1 text-sm">
                            {ordines.map(o => (
                                <li key={o.id} className="text-argo-secondary">- [{o.kind}] {o.description} <span className="text-xs text-argo-grey">({o.status})</span></li>
                            ))}
                            {ordines.length === 0 && <li className="text-argo-grey">Sin ordenes abiertas.</li>}
                        </ul>
                    </section>
                </div>
            )}
        </div>
    );
};
