import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface AuditEntry {
    id: string;
    admin_email: string;
    action: string;
    target_type: string | null;
    target_id: string | null;
    details: Record<string, unknown> | null;
    created_at: string;
}

const fmt = (iso: string) => new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });

export const AdminAuditLog: React.FC = () => {
    const [entries, setEntries] = useState<AuditEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        const { data } = await supabase
            .from('admin_audit_log')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);
        setEntries(data ?? []);
        setLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (loading) {
        return <div className="flex items-center justify-center py-20"><div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-gray-900">Audit log</h1>
                <p className="text-sm text-gray-500 mt-0.5">Registro de acciones administrativas.</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50 text-left">
                            <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase">Fecha</th>
                            <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase">Admin</th>
                            <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase">Acción</th>
                            <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase">Target</th>
                            <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase">Detalles</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {entries.map(e => (
                            <tr key={e.id} className="hover:bg-gray-50/50">
                                <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{fmt(e.created_at)}</td>
                                <td className="px-4 py-3 text-gray-700 text-xs">{e.admin_email}</td>
                                <td className="px-4 py-3">
                                    <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[11px] font-medium">{e.action}</span>
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-500">
                                    {e.target_type && <span className="text-gray-400">{e.target_type}:</span>}
                                    {e.target_id && <span className="ml-1 font-mono text-[10px]">{e.target_id.slice(0, 8)}...</span>}
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-400 max-w-[200px] truncate">
                                    {e.details ? JSON.stringify(e.details) : '—'}
                                </td>
                            </tr>
                        ))}
                        {entries.length === 0 && (
                            <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">Sin acciones registradas</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
