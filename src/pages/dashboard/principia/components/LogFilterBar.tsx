import React from 'react';

export interface LogFilters { area: string; severity: string; eventType: string; }

const AREAS = ['all', 'producto', 'marketing', 'ventas', 'personas', 'finanzas', 'sistema'];
const SEVERITIES = ['all', 'alto', 'medio', 'sano', 'offline'];
const EVENT_TYPES = ['all', 'user_action', 'ai_decision', 'health_check', 'delivery', 'audit'];

export const LogFilterBar: React.FC<{ value: LogFilters; onChange: (f: LogFilters) => void }> = ({ value, onChange }) => {
    const sel = 'rounded-lg border border-argo-border bg-white px-2 py-1 text-sm text-argo-secondary';
    return (
        <div className="flex flex-wrap gap-2">
            <select className={sel} value={value.area} onChange={e => onChange({ ...value, area: e.target.value })}>
                {AREAS.map(a => <option key={a} value={a}>{a === 'all' ? 'Toda area' : a}</option>)}
            </select>
            <select className={sel} value={value.severity} onChange={e => onChange({ ...value, severity: e.target.value })}>
                {SEVERITIES.map(s => <option key={s} value={s}>{s === 'all' ? 'Toda severidad' : s}</option>)}
            </select>
            <select className={sel} value={value.eventType} onChange={e => onChange({ ...value, eventType: e.target.value })}>
                {EVENT_TYPES.map(t => <option key={t} value={t}>{t === 'all' ? 'Todo tipo' : t}</option>)}
            </select>
        </div>
    );
};
