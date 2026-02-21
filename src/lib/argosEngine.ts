import { ARCHETYPE_DATA, getArchetypeByEjeMotor, ArchetypeData } from './archetypeData';

export type Eje = 'D' | 'I' | 'S' | 'C';
export type Motor = 'Rápido' | 'Medio' | 'Lento';
export type EjeInput = string;
export type MotorInput = string;
export type SintoniaInput = string;

export interface Archetype {
    id: string;
    eje: EjeInput;
    motor: MotorInput;
    label: string;
}

export interface GuiaRow {
    situacion: string;
    activador: string;
    desmotivacion: string;
}

export interface Checklist {
    antes: string;
    durante: string;
    despues: string;
}

export interface ReportData {
    nombre: string;
    arquetipo: Archetype;
    perfil: string;
    bienvenida: string;
    wow: string;
    motorDesc: string;
    combustible: string;
    grupoEspacio: string;
    corazon: string;
    palabrasPuente: string[];
    palabrasRuido: string[];
    guia: GuiaRow[];
    reseteo: string;
    ecos: string;
    checklist: Checklist;
}

// Legacy: list of archetypes for the resolver
export const ARQUETIPOS: Archetype[] = Object.values(ARCHETYPE_DATA).map(a => ({
    id: a.id,
    eje: a.eje,
    motor: a.motor,
    label: a.label,
}));

function injectNombre(text: string, nombre: string): string {
    return text.replace(/\{nombre\}/g, nombre);
}

export function getReportData(
    eje: EjeInput,
    motor: MotorInput,
    _sintonia: SintoniaInput = '',
    nombre: string = 'el deportista'
): ReportData {
    const data: ArchetypeData | null = getArchetypeByEjeMotor(eje, motor);

    if (!data) {
        return {
            nombre,
            arquetipo: { id: 'unknown', eje, motor, label: '[ARQUETIPO NO ENCONTRADO]' },
            perfil: '',
            bienvenida: `No se encontró un arquetipo para Eje: ${eje} / Motor: ${motor}.`,
            wow: '',
            motorDesc: '',
            combustible: '',
            grupoEspacio: '',
            corazon: '',
            palabrasPuente: [],
            palabrasRuido: [],
            guia: [],
            reseteo: '',
            ecos: '',
            checklist: { antes: '', durante: '', despues: '' },
        };
    }

    return {
        nombre,
        arquetipo: { id: data.id, eje: data.eje, motor: data.motor, label: data.label },
        perfil: data.perfil,
        bienvenida: injectNombre(data.bienvenida, nombre),
        wow: injectNombre(data.wow, nombre),
        motorDesc: injectNombre(data.motorDesc, nombre),
        combustible: injectNombre(data.combustible, nombre),
        grupoEspacio: injectNombre(data.grupoEspacio, nombre),
        corazon: injectNombre(data.corazon, nombre),
        palabrasPuente: data.palabrasPuente,
        palabrasRuido: data.palabrasRuido,
        guia: data.guia.map(row => ({
            situacion: row.situacion,
            activador: injectNombre(row.activador, nombre),
            desmotivacion: injectNombre(row.desmotivacion, nombre),
        })),
        reseteo: injectNombre(data.reseteo, nombre),
        ecos: injectNombre(data.ecos, nombre),
        checklist: {
            antes: injectNombre(data.checklist.antes, nombre),
            durante: injectNombre(data.checklist.durante, nombre),
            despues: injectNombre(data.checklist.despues, nombre),
        },
    };
}

// Legacy compat
export interface SintoniaData {
    situacion: string;
    hacer: string;
    evitar: string;
}
