/**
 * Pair Compatibility Guide. All pairs are valid.
 * Each combination has strengths and tools for the adult.
 * No scores, no rankings, no "bad" pairs.
 */

export interface PairGuide {
    title: string;
    strength: string;
    opportunity: string;
}

/**
 * Keyed by sorted axis pair: "C+D", "D+I", etc.
 * Same-axis pairs: "C+C", "D+D", etc.
 */
export const PAIR_GUIDES: Record<string, PairGuide> = {
    'D+D': {
        title: 'Dos líderes naturales',
        strength: 'La dupla que no le tiene miedo a ningún desafío. Cuando se alinean, la determinación se duplica.',
        opportunity: 'Asigna a cada uno un aspecto diferente del ejercicio. "Uno lidera la estrategia, el otro lidera la ejecución." Cuando cada uno tiene su territorio, la energía fluye.',
    },
    'D+I': {
        title: 'Acción y energía',
        strength: 'Una dupla que combina iniciativa con comunicación. El impulso se contagia y la energía es alta.',
        opportunity: 'Esta dupla genera ideas y actúa rápido. Después de cada ejercicio, un momento breve de revisión ("¿qué funcionó?") les ayuda a capitalizar lo que hicieron bien.',
    },
    'D+S': {
        title: 'Iniciativa y soporte',
        strength: 'Una dupla con roles naturalmente complementarios. Uno propone, el otro sostiene. La confianza se construye rápido.',
        opportunity: 'Alterna quién toma la iniciativa. El jugador S tiene capacidad de liderazgo que emerge cuando el contexto lo invita. "Hoy lidera cada uno una mitad del ejercicio."',
    },
    'C+D': {
        title: 'Decisión e inteligencia',
        strength: 'Una dupla que combina velocidad de acción con profundidad de análisis. Las decisiones tienden a ser rápidas y bien fundamentadas.',
        opportunity: 'Valida ambos ritmos: "buena lectura" para el análisis y "buena reacción" para la acción. Los ejercicios de toma de decisión bajo presión son el terreno ideal.',
    },
    'I+I': {
        title: 'Doble conexión',
        strength: 'La dupla que eleva el clima del grupo. La comunicación es abierta, la expresividad es alta y el vínculo se fortalece rápido.',
        opportunity: 'Establece un objetivo claro para cada ejercicio. La energía social es el combustible, y el objetivo concreto es la dirección.',
    },
    'I+S': {
        title: 'Calidez y soporte',
        strength: 'Una de las duplas con mayor capacidad de cuidado mutuo. La comunicación es abierta y la contención emocional es alta.',
        opportunity: 'Ideal para integrar a un jugador nuevo, para ejercicios de mentoría, o para momentos de recuperación emocional. La dupla cuida naturalmente.',
    },
    'C+I': {
        title: 'Expresión y observación',
        strength: 'Una dupla que puede leer una situación y comunicarla al grupo. Uno observa patrones, el otro los traduce a lenguaje grupal.',
        opportunity: 'Los ejercicios que combinan análisis con comunicación ("observen la jugada y explíquenla al grupo") son ideales. Respeta el ritmo de cada uno: uno procesa hablando, el otro procesando en silencio primero.',
    },
    'S+S': {
        title: 'Doble estabilidad',
        strength: 'La dupla más consistente y confiable. Lo que se acuerda se cumple, y el compañerismo es natural.',
        opportunity: 'Introduce desafíos progresivos dentro de la dupla. "La semana pasada hicieron X, hoy sumamos Y." El crecimiento gradual es el ritmo natural de esta combinación.',
    },
    'C+S': {
        title: 'Paciencia y precisión',
        strength: 'Una dupla metódica que ejecuta con calidad. La atención al detalle es alta y los errores son mínimos.',
        opportunity: 'Los ejercicios técnicos son el terreno ideal. Incorpora momentos de velocidad controlada ("ahora lo mismo pero en la mitad de tiempo") para que la precisión se active también bajo presión.',
    },
    'C+C': {
        title: 'Doble análisis',
        strength: 'La dupla con mayor profundidad de observación. Si hay un patrón, esta dupla lo encuentra.',
        opportunity: 'Alterna entre ejercicios de observación y ejercicios de acción inmediata. "Primero observen, después ejecuten sin pensar." La práctica de la acción rápida complementa la capacidad analítica natural.',
    },
};

/**
 * Get pair guide by two axes (order doesn't matter).
 */
export function getPairGuide(axis1: string, axis2: string): PairGuide | null {
    const key = [axis1, axis2].sort().join('+');
    return PAIR_GUIDES[key] ?? null;
}
