import { ARCHETYPE_DATA, TENDENCIA_CONTENT, getArchetypeByEjeMotor, ArchetypeData } from './archetypeData';
import { ARCHETYPE_DATA_EN, TENDENCIA_CONTENT_EN } from './archetypeData.en';
import { ARCHETYPE_DATA_PT, TENDENCIA_CONTENT_PT } from './archetypeData.pt';

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
    perfilExtended?: string;
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
    ejeSecundario?: string;
    tendenciaLabel?: string;
    tendenciaParagraph?: string;
    palabrasPuenteExtra?: string[];
    palabrasRuidoExtra?: string[];
    axisCounts?: Record<string, number>;
    sessionId?: string;
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

const TENDENCIA_LABELS_I18N: Record<string, Record<string, string>> = {
    es: { D: 'con chispa de acción', I: 'con brújula social', S: 'con raíz firme', C: 'con ojo de detalle' },
    en: { D: 'with a spark of action', I: 'with a social compass', S: 'with firm roots', C: 'with an eye for detail' },
    pt: { D: 'com faísca de ação', I: 'com bússola social', S: 'com raiz firme', C: 'com olho de detalhe' },
};

export function getLocalizedTendenciaLabel(axis: string, lang: string = 'es'): string {
    return TENDENCIA_LABELS_I18N[lang]?.[axis] ?? TENDENCIA_LABELS_I18N.es[axis] ?? '';
}

export function getReportData(
    eje: EjeInput,
    motor: MotorInput,
    _sintonia: SintoniaInput = '',
    nombre: string = 'el deportista',
    lang: string = 'es'
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

    const t = lang === 'en'
        ? (ARCHETYPE_DATA_EN[data.id] ?? data)
        : lang === 'pt'
            ? (ARCHETYPE_DATA_PT[data.id] ?? data)
            : data;

    return {
        nombre,
        arquetipo: { id: data.id, eje: data.eje, motor: data.motor, label: t.label },
        perfil: t.perfil,
        perfilExtended: injectNombre(t.perfilExtended ?? '', nombre),
        bienvenida: injectNombre(t.bienvenida, nombre),
        wow: injectNombre(t.wow, nombre),
        motorDesc: injectNombre(t.motorDesc, nombre),
        combustible: injectNombre(t.combustible, nombre),
        grupoEspacio: injectNombre(t.grupoEspacio, nombre),
        corazon: injectNombre(t.corazon, nombre),
        palabrasPuente: t.palabrasPuente,
        palabrasRuido: t.palabrasRuido,
        guia: t.guia.map(row => ({
            situacion: row.situacion,
            activador: injectNombre(row.activador, nombre),
            desmotivacion: injectNombre(row.desmotivacion, nombre),
        })),
        reseteo: injectNombre(t.reseteo, nombre),
        ecos: injectNombre(t.ecos, nombre),
        checklist: {
            antes: injectNombre(t.checklist.antes, nombre),
            durante: injectNombre(t.checklist.durante, nombre),
            despues: injectNombre(t.checklist.despues, nombre),
        },
    };
}

export function getLocalizedTendenciaContent(
    ejePrimario: string,
    ejeSecundario: string,
    lang: string = 'es'
): { parrafo: string; palabrasPuenteExtra: string[]; palabrasRuidoExtra: string[] } | null {
    const key = `${ejePrimario}_${ejeSecundario}`;
    if (lang === 'en') return TENDENCIA_CONTENT_EN[key] ?? TENDENCIA_CONTENT[key] ?? null;
    if (lang === 'pt') return TENDENCIA_CONTENT_PT[key] ?? TENDENCIA_CONTENT[key] ?? null;
    return TENDENCIA_CONTENT[key] ?? null;
}

// Legacy compat
export interface SintoniaData {
    situacion: string;
    hacer: string;
    evitar: string;
}
