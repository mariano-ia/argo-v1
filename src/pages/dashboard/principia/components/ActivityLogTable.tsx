import React from 'react';
import { SEVERITY_COLORS, type Severity } from '../../../../lib/designTokens';

export interface ActivityRow {
    id: number; recorded_at: string; area: string; source_type: string;
    event_type: string; action: string; resource_id: string | null;
    severity: string | null; status: string | null; incident_id?: number | null;
}

export const ActivityLogTable: React.FC<{ rows: ActivityRow[] }> = ({ rows }) => {
    return (
        <table className="w-full text-sm">
            <thead>
                <tr className="border-b border-argo-border text-left text-xs uppercase tracking-widest text-argo-grey">
                    <th className="py-2 pr-3">Hora</th><th className="pr-3">Area</th><th className="pr-3">Origen</th>
                    <th className="pr-3">Tipo</th><th className="pr-3">Accion</th><th className="pr-3">Recurso</th><th>Estado</th>
                </tr>
            </thead>
            <tbody>
                {rows.map(r => {
                    const sev = (r.severity ?? 'sano') as Severity;
                    const dot = SEVERITY_COLORS[sev]?.dot ?? SEVERITY_COLORS.sano.dot;
                    return (
                        <tr key={r.id} className="border-b border-argo-border/60 text-argo-secondary">
                            <td className="py-1.5 pr-3 font-mono text-xs">{new Date(r.recorded_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}</td>
                            <td className="pr-3">{r.area}</td>
                            <td className="pr-3">{r.source_type}</td>
                            <td className="pr-3">{r.event_type}</td>
                            <td className="pr-3 text-argo-navy">{r.action}</td>
                            <td className="pr-3 font-mono text-xs truncate max-w-[160px]" title={r.resource_id ?? ''}>{r.resource_id ?? '.'}</td>
                            <td><span className={`inline-block h-2 w-2 rounded-full ${dot}`} title={sev} /> <span className="text-xs">{r.status ?? ''}</span></td>
                        </tr>
                    );
                })}
                {rows.length === 0 && (
                    <tr><td colSpan={7} className="py-6 text-center text-argo-grey">Sin registros para estos filtros.</td></tr>
                )}
            </tbody>
        </table>
    );
};
