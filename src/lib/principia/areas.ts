import { Activity, Megaphone, DollarSign, Users, Wallet } from 'lucide-react';
import type { AreaModule, AreaId } from './types';

/**
 * The Legion registry. ONE contract per cohort; the shell, transversal views and
 * the generic detail page are written once. Adding a cohort = registering a module.
 * v1: only Producto is 'live' with real signal sources; the other four render as
 * calm 'coming_soon' tiles (never 404) and inherit the shell unchanged.
 */
export const AREA_MODULES: AreaModule[] = [
    {
        id: 'producto',
        label: 'Producto / Salud',
        agentName: 'Vigia',
        icon: Activity,
        status: 'live',
        mandatum: 'Vigia cuida que la odisea funcione: que cada nino termine su sesion, reciba su reporte y que las herramientas del panel respondan. Vigila errores de cliente, recuperaciones de audio, entrega de reportes y la salud de los crons.',
        setpoint: {
            signals: [
                { signal_key: 'client_errors_per_day',  label: 'Errores de cliente por dia',     comparator: '<', target: 5,  unit: 'errores/dia',     loop_id: 'tecnica' },
                { signal_key: 'audio_recovery_sessions_per_day', label: 'Sesiones con recuperacion de audio por dia', comparator: '<', target: 3, unit: 'sesiones/dia', loop_id: 'tecnica' },
                { signal_key: 'sessions_without_report',  label: 'Sesiones sin reporte (mas de 4 h)', comparator: '<', target: 1, unit: 'sesiones',     loop_id: 'entrega' },
                { signal_key: 'report_email_delivery',    label: 'Entrega de reporte',               comparator: '>', target: 99, unit: '%',            loop_id: 'entrega' },
            ],
            escalation: { alto: 'telegram+email', medio: 'telegram+email' },
        },
        loops: [
            { id: 'tecnica',    label: 'Salud tecnica', status: 'live' },
            { id: 'entrega',    label: 'Entrega',       status: 'live' },
            { id: 'calidad_ia', label: 'Calidad IA',    status: 'sensor_pending' },
            { id: 'dashboards', label: 'Dashboards y herramientas', status: 'live' },
        ],
        signalSources: [
            { id: 'client_errors',  kind: 'table', ref: 'client_errors',  shape: 'threshold', existsToday: true, loop_id: 'tecnica' },
            { id: 'audio_events',   kind: 'table', ref: 'audio_events',   shape: 'threshold', existsToday: true, loop_id: 'tecnica' },
            { id: 'sessions',       kind: 'table', ref: 'sessions',       shape: 'threshold', existsToday: true, loop_id: 'entrega' },
            { id: 'qa_monitor',     kind: 'cron',  ref: 'qa-monitor',     shape: 'threshold', existsToday: true, loop_id: 'dashboards' },
        ],
        capabilities: [
            { type: 'retry',                   executable: true },
            { type: 'resend_email',            executable: true },
            { type: 'trigger_report_recovery', executable: true },
            { type: 'open_pr',                 executable: false },
            { type: 'rollback',                executable: false },
            { type: 'feature_flag',            executable: false },
        ],
        registroFilter: { area: 'producto' },
    },
    comingSoon('marketing', 'Marketing', 'Praeco', Megaphone,
        'Praeco cuida la presencia de Argo: cadencia de contenido, cobertura de los pilares y rendimiento de las campanas. Modulo en construccion.'),
    comingSoon('ventas', 'Ventas', 'Mercator', DollarSign,
        'Mercator cuida el crecimiento: signups, conversion de trial a pago, MRR y churn. Modulo en construccion.'),
    comingSoon('personas', 'Personas', 'Tribunus', Users,
        'Tribunus cuida a los coaches: activacion, onboarding y adopcion del panel. Modulo en construccion.'),
    comingSoon('finanzas', 'Finanzas', 'Quaestor', Wallet,
        'Quaestor cuida la salud financiera: MRR, costo de IA, margenes y runway. Modulo en construccion.'),
];

function comingSoon(id: AreaId, label: string, agentName: string, icon: AreaModule['icon'], mandatum: string): AreaModule {
    return {
        id, label, agentName, icon, status: 'coming_soon', mandatum,
        setpoint: { signals: [], escalation: { alto: '', medio: '' } },
        loops: [],
        signalSources: [],
        capabilities: [],
        registroFilter: { area: id },
    };
}

export function getArea(id: AreaId): AreaModule {
    const m = AREA_MODULES.find(a => a.id === id);
    if (!m) throw new Error(`Unknown area: ${id}`);
    return m;
}
