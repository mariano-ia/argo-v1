import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { SEVERITY_COLORS, type Severity } from '../../../lib/designTokens';

interface IncidentRow { id: number; area: string; loop_id: string; title: string; severity: string; status: string; signal_count: number; first_seen_at: string; last_seen_at: string; }
interface TimelineRow { id: number; recorded_at: string; event_type: string; action: string; severity: string | null; status: string | null; }

export const Incidentes: React.FC = () => {
    const [list, setList] = useState<IncidentRow[]>([]);
    const [selected, setSelected] = useState<number | null>(null);
    const [timeline, setTimeline] = useState<TimelineRow[]>([]);

    const fetchList = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const res = await fetch('/api/principia-incidents', { headers: { Authorization: `Bearer ${session.access_token}` } });
        if (res.ok) { const b = await res.json(); setList(b.incidents ?? []); }
    }, []);
    useEffect(() => { fetchList(); }, [fetchList]);

    const openDetail = useCallback(async (id: number) => {
        setSelected(id);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const res = await fetch(`/api/principia-incidents?id=${id}`, { headers: { Authorization: `Bearer ${session.access_token}` } });
        if (res.ok) { const b = await res.json(); setTimeline(b.timeline ?? []); }
    }, []);

    return (
        <div>
            <h1 className="text-2xl font-bold text-argo-navy">Incidentes</h1>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-[14px] border border-argo-border bg-white p-2 shadow-argo">
                    {list.map(i => {
                        // severity may be 'info' (observations); guard the index with ?.
                        const sev = (i.severity ?? 'sano') as Severity;
                        const dot = (SEVERITY_COLORS[sev] ?? SEVERITY_COLORS.sano).dot;
                        return (
                            <button key={i.id} onClick={() => openDetail(i.id)}
                                className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm ${selected === i.id ? 'bg-argo-bg' : 'hover:bg-argo-bg'}`}>
                                <span className={`h-2 w-2 rounded-full ${dot}`} />
                                <span className="flex-1 text-argo-navy">{i.title}</span>
                                <span className="text-xs text-argo-grey">{i.status}</span>
                            </button>
                        );
                    })}
                    {list.length === 0 && <p className="py-6 text-center text-argo-grey">Sin incidentes.</p>}
                </div>
                <div className="rounded-[14px] border border-argo-border bg-white p-4 shadow-argo">
                    {selected == null ? <p className="text-argo-grey">Elige un incidente para ver su linea de tiempo.</p> : (
                        <ol className="space-y-2">
                            {timeline.map(t => (
                                <li key={t.id} className="flex items-start gap-2 text-sm">
                                    <span className="font-mono text-xs text-argo-grey">{new Date(t.recorded_at).toLocaleString('es', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</span>
                                    <span className="text-argo-navy">{t.action}</span>
                                    <span className="text-xs text-argo-grey">{t.status}</span>
                                </li>
                            ))}
                            {timeline.length === 0 && <p className="text-argo-grey">Sin transiciones registradas.</p>}
                        </ol>
                    )}
                </div>
            </div>
        </div>
    );
};
