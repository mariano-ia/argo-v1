
export type Eje = 'D' | 'I' | 'S' | 'C' | 'C+S'; // Added C+S from archetype mapping
export type Motor = 'Rápido' | 'Medio' | 'Lento';

// Broad type for lookup keys to handle generic/missing strings safely
export type EjeInput = string;
export type MotorInput = string;
export type SintoniaInput = string;

export interface Archetype {
    id: string;
    eje: EjeInput;
    motor: MotorInput;
    label: string;
}

export interface SintoniaData {
    situacion: string;
    hacer: string;
    evitar: string;
}

export interface ReportData {
    bienvenida: string;
    brujula: string;
    ritmo: string;
    arquetipo: Archetype;
    sintonia: SintoniaData | null;
}

// Data Foundation
export const ARQUETIPOS: Archetype[] = [
    { id: "impulsor_persistente", eje: "D", motor: "Lento", label: "Impulsor Persistente" },
    { id: "impulsor_dinamico", eje: "D", motor: "Rápido", label: "Impulsor Dinámico" },
    { id: "conector_vibrante", eje: "I", motor: "Rápido", label: "Conector Vibrante" },
    { id: "estratega_observador", eje: "C+S", motor: "Lento", label: "Estratega Observador" }
];

const TEXT_BLOCKS = {
    seccion_0_bienvenida: "Este mapa nos permite asomarnos a la manera en que [Nombre] vive y siente el deporte hoy... Nota de evolución: Este informe es una fotografía del presente.",
    seccion_1_brujula_D: "Energía de Impulso. Muestra gran iniciativa y determinación para proponer desafíos.",
    seccion_1_brujula_I: "Energía Conectora. Entusiasmo y capacidad natural para motivar al equipo.",
    seccion_1_brujula_S: "Energía de Sostén. Constancia y lealtad, siendo un pilar fundamental de confianza.",
    seccion_1_brujula_C: "Energía Estratega. Atención al detalle y búsqueda de la excelencia en cada jugada.",
    seccion_2_ritmo_lento: "Ritmo de Precisión. Prioriza la firmeza y la seguridad, asegurando cada paso antes de avanzar.",
    seccion_2_ritmo_rapido: "Ritmo Ágil. Gran velocidad de respuesta y toma de decisiones dinámica.",
    seccion_2_ritmo_medio: "Ritmo Equilibrado. Combina la observación con la acción en tiempos armónicos.",
};

const SINTONIA_EXAMPLES: Record<string, SintoniaData> = {
    "Mantenga su interés": {
        situacion: "Mantenga su interés",
        hacer: "Roles de lectura o distribución del juego",
        evitar: "Pedirle que mantenga una intensidad física frenética sin propósito"
    }
};

/**
 * Deterministic lookup for text blocks.
 * Returns [DATA_MISSING] if specific key is not found.
 */
function getTextBlock(key: string): string {
    // @ts-ignore
    const val = TEXT_BLOCKS[key];
    return val || "[DATA_MISSING]";
}

/**
 * Reconstructs the 'Argos Method' report product.
 * @param eje - The DISC axis (D, I, S, C)
 * @param motor - The engine speed (Rápido, Medio, Lento)
 * @param sintonia - The tuning situation key (optional/specific)
 * @param nombre - Name for personalization
 */
export function getReportData(
    eje: EjeInput,
    motor: MotorInput,
    sintonia: SintoniaInput,
    nombre: string = "[Nombre]"
): ReportData {

    // 1. Find Archetype
    const arquetipo = ARQUETIPOS.find(
        (a) => a.eje === eje && a.motor === motor
    ) || {
        id: "unknown",
        eje: eje,
        motor: motor,
        label: "[DATA_MISSING]"
    };

    // 2. Resolve Text Blocks
    // Welcoming text with name injection
    let bienvenida = getTextBlock("seccion_0_bienvenida");
    bienvenida = bienvenida.replace("[Nombre]", nombre);

    // Compass/Brújula text (Based on Axis/Eje)
    // Mapping logic: seccion_1_brujula_{EJE}
    const brujulaKey = `seccion_1_brujula_${eje}`;
    const brujula = getTextBlock(brujulaKey);

    // Rhythm/Ritmo text (Based on Engine/Motor)
    // Mapping logic: seccion_2_ritmo_{MOTOR.lower}
    // Data has "seccion_2_ritmo_lento", so we lowercase the input "Lento" -> "lento"
    const motorLower = motor.toLowerCase();
    const ritmoKey = `seccion_2_ritmo_${motorLower}`;
    const ritmo = getTextBlock(ritmoKey);

    // 3. Resolve Tuning/Sintonía
    // If sintonia is provided, look it up.
    const sintoniaData = SINTONIA_EXAMPLES[sintonia] || null;

    return {
        bienvenida,
        brujula,
        ritmo,
        arquetipo,
        sintonia: sintoniaData
            ? sintoniaData
            : {
                situacion: sintonia,
                hacer: "[DATA_MISSING]",
                evitar: "[DATA_MISSING]"
            }
    };
}
