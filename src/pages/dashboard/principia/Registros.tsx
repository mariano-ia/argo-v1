import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { ActivityLogTable, type ActivityRow } from './components/ActivityLogTable';
import { LogFilterBar, type LogFilters } from './components/LogFilterBar';
import { Button } from '../../../components/ui';

export const Registros: React.FC = () => {
    const [rows, setRows] = useState<ActivityRow[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [filters, setFilters] = useState<LogFilters>({ area: 'all', severity: 'all', eventType: 'all' });
    const [loading, setLoading] = useState(true);

    const fetchPage = useCallback(async (p: number, f: LogFilters) => {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setLoading(false); return; }
        const qs = new URLSearchParams({ page: String(p), area: f.area, severity: f.severity, event_type: f.eventType });
        const res = await fetch(`/api/principia-activity?${qs}`, { headers: { Authorization: `Bearer ${session.access_token}` } });
        const body = await res.json().catch(() => ({ rows: [], hasMore: false }));
        setRows(body.rows ?? []); setHasMore(!!body.hasMore); setLoading(false);
    }, []);

    useEffect(() => { fetchPage(page, filters); }, [page, filters, fetchPage]);

    return (
        <div>
            <h1 className="text-2xl font-bold text-argo-navy">Registros</h1>
            <p className="mt-1 text-sm text-argo-grey">Los registros de todo. Ventanas de 100 filas.</p>
            <div className="mt-4"><LogFilterBar value={filters} onChange={f => { setPage(0); setFilters(f); }} /></div>
            <div className="mt-4 rounded-[14px] border border-argo-border bg-white p-4 shadow-argo">
                {loading ? <p className="py-6 text-center text-argo-grey">Cargando...</p> : <ActivityLogTable rows={rows} />}
            </div>
            <div className="mt-4 flex items-center justify-between">
                <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>Anterior</Button>
                <span className="text-sm text-argo-grey">Pagina {page + 1}</span>
                <Button variant="secondary" size="sm" disabled={!hasMore} onClick={() => setPage(p => p + 1)}>Siguiente</Button>
            </div>
        </div>
    );
};
