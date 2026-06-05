import type { LucideIcon } from 'lucide-react';

export type AreaId = 'producto' | 'marketing' | 'ventas' | 'personas' | 'finanzas';

export interface AreaSetpoint {
    /** El rumbo definido por el humano + escalacion. Editable en el Consilium (fase posterior). */
    signals: Array<{
        signal_key: string;
        label: string;          // user-facing es (tu, sin voseo, sin guiones)
        comparator: '<' | '>' | '<=' | '>=';
        target: number;
        unit: string;
        loop_id: string;
    }>;
    escalation: { alto: string; medio: string };  // a quien/que canal escala
}

export interface ControlLoop {
    id: string;                 // 'tecnica'|'entrega'|'calidad_ia'|'dashboards'
    label: string;
    status: 'live' | 'sensor_pending';
}

export interface SignalSource {
    id: string;
    kind: 'table' | 'cron' | 'webhook' | 'external_mcp';
    ref: string;                // 'client_errors'|'qa-monitor'|...
    shape: 'threshold' | 'entity';
    existsToday: boolean;       // gatea si el loop muestra datos reales o un stub
    loop_id: string;
}

export interface RuntimeActionCapability {
    type: 'retry' | 'resend_email' | 'trigger_report_recovery' | 'open_pr' | 'rollback' | 'feature_flag';
    executable: boolean;        // hoy: retry/resend/trigger = true; open_pr/rollback/feature_flag = false
}

export interface AreaModule {
    id: AreaId;
    label: string;              // p.ej. "Producto / Salud"
    agentName: string;          // el centurion, p.ej. "Vigia"
    icon: LucideIcon;
    status: 'live' | 'coming_soon';
    setpoint: AreaSetpoint;
    loops: ControlLoop[];
    signalSources: SignalSource[];
    capabilities: RuntimeActionCapability[];
    registroFilter: { area: AreaId };  // faceta sobre system_activity_log
    mandatum: string;           // descripcion del Mandatum (Commentarii), user-facing es
}
