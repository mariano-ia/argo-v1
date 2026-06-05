import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { SEVERITY_COLORS, type Severity } from '../../../lib/designTokens';
import { Button, useToast } from '../../../components/ui';

interface InboxItem {
    id: number; area: string; loop_id: string; agent: string; title: string; summary: string;
    severity: string; signal_count: number; last_seen_at: string;
    diagnosis: Record<string, unknown> | null;
    proposed_action: { type: string; executable: boolean; confidence?: number; blast_radius?: string } | null;
}

export const Bandeja: React.FC = () => {
    const [items, setItems] = useState<InboxItem[]>([]);
    const [busy, setBusy] = useState<number | null>(null);
    const { toast } = useToast();  // useToast() returns { toast: (type, text) => void }

    const fetchItems = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const res = await fetch('/api/principia-inbox', { headers: { Authorization: `Bearer ${session.access_token}` } });
        if (res.ok) { const b = await res.json(); setItems(b.items ?? []); }
    }, []);
    useEffect(() => { fetchItems(); }, [fetchItems]);

    const act = useCallback(async (id: number, decision: 'approve' | 'reject' | 'snooze') => {
        setBusy(id);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setBusy(null); return; }
        const res = await fetch('/api/principia-act', {
            method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
            body: JSON.stringify({ incident_id: id, decision }),
        });
        await res.json().catch(() => ({}));  // drain body; outcome is read from res.status/res.ok
        if (res.status === 409) toast('info', 'Esta propuesta se ejecuta de forma manual.');
        else if (res.ok) toast('success', decision === 'approve' ? 'Accion en verificacion.' : 'Decision registrada.');
        else toast('error', 'No se pudo completar. Intenta de nuevo.');
        setBusy(null);
        fetchItems();
    }, [toast, fetchItems]);

    if (items.length === 0) {
        return (
            <div className="rounded-[14px] border border-argo-border bg-white p-6 text-center shadow-argo">
                <p className="font-semibold text-argo-navy">Nada requiere tu atencion. Vigia esta observando.</p>
                <p className="mt-1 text-sm text-argo-grey">Las decisiones pendientes aparecen aqui.</p>
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-argo-navy">Bandeja</h1>
            <p className="mt-1 text-sm text-argo-grey">{items.length} decisiones esperan tu aprobacion.</p>
            <div className="mt-4 space-y-3">
                {items.map(it => {
                    // severity may be an unknown value; fall back so we never access undefined properties.
                    const rawSev = (it.severity ?? 'medio') as Severity;
                    const sevColors = SEVERITY_COLORS[rawSev] ?? SEVERITY_COLORS.medio;
                    const sev: Severity = SEVERITY_COLORS[rawSev] ? rawSev : 'medio';
                    const exec = it.proposed_action?.executable === true;
                    return (
                        <div key={it.id} className="rounded-[14px] border border-argo-border bg-white p-4 shadow-argo">
                            <div className="flex items-center gap-2">
                                <span className={`h-2.5 w-2.5 rounded-full ${sevColors.dot}`} />
                                <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${sevColors.bg} ${sevColors.text} ${sevColors.border}`}>{sev.toUpperCase()}</span>
                                <span className="text-sm text-argo-secondary">{it.area} - {it.agent}</span>
                                {it.signal_count > 1 && <span className="text-xs text-argo-grey">x{it.signal_count}</span>}
                            </div>
                            <p className="mt-2 font-semibold text-argo-navy">{it.title}</p>
                            <p className="text-sm text-argo-secondary">{it.summary}</p>
                            {it.proposed_action && (
                                <p className="mt-2 text-sm text-argo-secondary">
                                    Propone: <span className="font-medium">{it.proposed_action.type}</span>
                                    {!exec && <span className="ml-2 rounded bg-argo-bg px-1.5 py-0.5 text-xs text-argo-grey">propuesta (ejecucion manual)</span>}
                                    {it.proposed_action.confidence != null && <span className="ml-2 text-xs text-argo-grey">confianza {(it.proposed_action.confidence * 100).toFixed(0)}%</span>}
                                    {it.proposed_action.blast_radius && <span className="ml-2 text-xs text-argo-grey">alcance: {it.proposed_action.blast_radius}</span>}
                                </p>
                            )}
                            <div className="mt-3 flex gap-2">
                                {exec
                                    ? <Button size="sm" variant="primary" disabled={busy === it.id} onClick={() => act(it.id, 'approve')}>Aprobar</Button>
                                    : <Button size="sm" variant="secondary" disabled title="Ejecucion manual">Aprobar (manual)</Button>}
                                <Button size="sm" variant="ghost" disabled={busy === it.id} onClick={() => act(it.id, 'reject')}>Rechazar</Button>
                                <Button size="sm" variant="ghost" disabled={busy === it.id} onClick={() => act(it.id, 'snooze')}>Posponer</Button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
