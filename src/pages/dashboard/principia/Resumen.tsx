import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { SEVERITY_COLORS, type Severity } from '../../../lib/designTokens';
import { ActivityLogTable, type ActivityRow } from './components/ActivityLogTable';
import { AREA_MODULES } from '../../../lib/principia/areas';

interface Overview {
    verdict: Severity; detectorSilent: boolean; lastDetectAt: string | null;
    awaitingApproval: number; openByArea: Record<string, number>;
    incidents: Array<{ id: number; area: string; severity: string; status: string; title: string }>;
    recentActivity: ActivityRow[];
}

const VERDICT_COPY: Record<Severity, string> = {
    sano: 'Todo operativo. Vigia esta observando.',
    medio: 'Hay incidentes abiertos. Revisa la Bandeja.',
    alto: 'Atencion: un incidente ALTO requiere tu decision.',
    offline: 'Vigia sin senal. El detector no esta escribiendo. Revisa el cron.',
    info: 'Observaciones registradas.',
};

export const Resumen: React.FC = () => {
    const [data, setData] = useState<Overview | null>(null);

    const fetchData = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const res = await fetch('/api/principia-overview', { headers: { Authorization: `Bearer ${session.access_token}` } });
        if (res.ok) setData(await res.json());
    }, []);
    useEffect(() => { fetchData(); }, [fetchData]);

    if (!data) return <p className="text-argo-grey">Cargando...</p>;
    const v = SEVERITY_COLORS[data.verdict] ?? SEVERITY_COLORS.sano;

    return (
        <div>
            <div className={`flex items-center gap-3 rounded-[14px] border p-4 ${v.bg} ${v.border}`}>
                <span className={`h-3 w-3 rounded-full ${v.dot}`} />
                <p className={`font-semibold ${v.text}`}>{VERDICT_COPY[data.verdict] ?? VERDICT_COPY.sano}</p>
                {data.awaitingApproval > 0 && <span className="ml-auto text-sm">{data.awaitingApproval} esperan tu aprobacion</span>}
            </div>

            <h2 className="mt-6 text-xs font-semibold uppercase tracking-widest text-argo-grey">Estado por cohorte</h2>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
                {AREA_MODULES.map(a => {
                    const open = data.openByArea[a.id] ?? 0;
                    const sev: Severity = a.status !== 'live' ? 'offline' : open ? 'medio' : 'sano';
                    return (
                        <div key={a.id} className="rounded-lg border border-argo-border bg-white px-3 py-2">
                            <div className="flex items-center gap-1.5">
                                <span className={`h-2 w-2 rounded-full ${(SEVERITY_COLORS[sev] ?? SEVERITY_COLORS.sano).dot}`} />
                                <span className="text-sm font-medium text-argo-navy">{a.label}</span>
                            </div>
                            <p className="mt-0.5 text-xs text-argo-grey">{a.status === 'live' ? `${open} abiertos` : 'proximamente'}</p>
                        </div>
                    );
                })}
            </div>

            <h2 className="mt-6 text-xs font-semibold uppercase tracking-widest text-argo-grey">Actividad reciente</h2>
            <div className="mt-2 rounded-[14px] border border-argo-border bg-white p-4 shadow-argo">
                <ActivityLogTable rows={data.recentActivity} />
            </div>
        </div>
    );
};
