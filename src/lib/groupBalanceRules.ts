/**
 * Group Balance Rules. All texts for group analysis.
 * Deterministic, zero AI. Based on docs/reglas-equilibrio-grupal.md
 *
 * Principles:
 * - No groups are incorrect. Every combination has strengths.
 * - Never "lacks", "weak", "problem". Always from strength + tools.
 * - Spanish latam neutro, tú conjugation, no voseo.
 */

import type {
    GroupType, IndicatorLevel, DiversityLevel, MotorGroupType,
} from './groupBalance';

/* ── Group Profile Texts ───────────────────────────────────────────────────── */

interface GroupProfileText {
    identity: string;
    strengths: string[];
    tools: string[];
}

export const GROUP_PROFILE_TEXTS: Record<GroupType, GroupProfileText> = {
    Competitivo: {
        identity: 'Un grupo que se enciende con los desafíos. La energía competitiva es su combustible natural y el ritmo lo marca quien toma la iniciativa.',
        strengths: [
            'Alta capacidad de reacción ante situaciones de presión',
            'Determinación para sostener el esfuerzo cuando el resultado importa',
            'Tendencia grupal hacia la toma de decisiones distribuida: en este momento, varios jugadores muestran iniciativa en cancha',
        ],
        tools: [
            'Asigna roles claros dentro del grupo. Cuando cada jugador sabe cuál es su espacio de liderazgo, la energía competitiva se canaliza hacia afuera y no hacia adentro.',
            'Usa desafíos internos con estructura: competencias por tiempo, por equipos rotativos, con reglas claras. La competencia es el lenguaje natural de este grupo. Observa siempre el nivel de disfrute: si la competencia genera frustración en algún jugador, vuelve a dinámicas de juego libre.',
            'Después de cada actividad competitiva, dedica un momento breve a reconocer el esfuerzo colectivo, no solo el resultado individual.',
        ],
    },
    Social: {
        identity: 'Un grupo donde la conexión humana es protagonista. La energía viene del vínculo entre los jugadores y el clima emocional marca el ritmo del entrenamiento.',
        strengths: [
            'Clima positivo que facilita la integración de nuevos jugadores',
            'Alta capacidad de motivación colectiva en momentos clave',
            'Comunicación fluida dentro del grupo',
        ],
        tools: [
            'Incorpora rituales de inicio y cierre en cada sesión (una ronda de palabras, un grito de equipo). Este grupo rinde mejor cuando siente que pertenece a algo.',
            'Para momentos que requieren concentración individual, establece señales claras de transición: "ahora es momento de escuchar con atención" funciona mejor que pedir silencio.',
            'Aprovecha la energía social como herramienta de enseñanza: ejercicios en grupo, explicaciones entre pares, liderazgo rotativo.',
        ],
    },
    Cohesivo: {
        identity: 'Un grupo con base sólida. La consistencia y la lealtad son el tejido que une a los jugadores, y el ritmo se construye desde la confianza acumulada.',
        strengths: [
            'Alta confiabilidad: lo que se acuerda, se cumple',
            'Estabilidad emocional que sostiene al grupo en momentos difíciles',
            'Compañerismo natural y bajo nivel de conflicto interno',
        ],
        tools: [
            'Introduce cambios de manera gradual y explica el porqué. Este grupo procesa mejor las novedades cuando entiende la razón detrás del cambio.',
            'Desafía al grupo con metas progresivas: "la semana pasada llegamos hasta aquí, esta semana sumamos esto". El crecimiento incremental es el ritmo natural de este grupo.',
            'Valora explícitamente la consistencia del grupo. A veces la estabilidad es invisible, y reconocerla refuerza lo que el grupo hace bien.',
        ],
    },
    Metódico: {
        identity: 'Un grupo que observa antes de actuar. La precisión y la comprensión profunda son su manera natural de abordar cualquier desafío deportivo.',
        strengths: [
            'Atención al detalle que reduce errores técnicos',
            'Capacidad de análisis táctico superior al promedio',
            'Tendencia hacia la comprensión y seguimiento de instrucciones estructuradas',
        ],
        tools: [
            'Explica el "para qué" de cada ejercicio. Este grupo se compromete más cuando entiende el propósito detrás de la actividad.',
            'Intercala ejercicios analíticos con momentos de juego libre o improvisación. La espontaneidad es un músculo que este grupo puede ejercitar con la guía correcta.',
            'Cuando un jugador analiza demasiado antes de actuar, valida su proceso: "buena lectura" y después invita a la acción: "ahora ejecuta lo que viste".',
        ],
    },
    Balanceado: {
        identity: 'Un grupo diverso donde conviven diferentes estilos de comportamiento. Esta variedad es una fortaleza que permite adaptarse a múltiples situaciones deportivas.',
        strengths: [
            'Flexibilidad para abordar distintos tipos de desafíos',
            'Cada jugador aporta una perspectiva diferente al grupo',
            'Menor riesgo de caer en un solo patrón de comportamiento',
        ],
        tools: [
            'Alterna el estilo de los ejercicios: competitivos, colaborativos, técnicos, creativos. La diversidad del grupo responde bien a la variedad.',
            'Ten en cuenta que la comunicación grupal requiere más matices: lo que motiva a uno puede no resonar con otro. Observa las reacciones individuales.',
            'Usa la diversidad como recurso explícito: "vamos a necesitar que algunos lideren, otros sostengan y otros observen. cada uno tiene su rol".',
        ],
    },
};

/* ── Composite Group Texts ─────────────────────────────────────────────────── */

interface CompositeText {
    identity: string;
    tools: string[];
}

export const COMPOSITE_TEXTS: Record<string, CompositeText> = {
    'Competitivo-Social': {
        identity: 'Un grupo con mucha energía y volumen. La intensidad viene tanto de la competencia como de la conexión social. El ritmo es alto y la expresividad es constante.',
        tools: [
            'Canaliza la energía con estructura flexible: reglas claras pero espacio para la expresión. "Compitan, pero el que gana le explica al que viene atrás cómo lo hizo."',
            'Incorpora pausas breves entre actividades de alta intensidad. No para frenar al grupo, sino para que puedan procesar lo que acaban de vivir.',
            'Este grupo responde muy bien al reconocimiento público y a los desafíos grupales con recompensa colectiva.',
        ],
    },
    'Competitivo-Cohesivo': {
        identity: 'Un grupo que combina determinación con lealtad. La competencia existe, pero dentro de un marco de cuidado mutuo. Compiten sin destruirse.',
        tools: [
            'Aprovecha que la competencia interna tiene límites naturales: este grupo sabe cuándo parar antes de que alguien la pase mal.',
            'Los líderes naturales tienden a proteger a los más estables. Reconoce esa dinámica y nómbrala: "me gusta cómo el equipo cuida a todos mientras compite".',
            'Las transiciones entre actividades competitivas y colaborativas son fluidas en este grupo. Úsalo a tu favor.',
        ],
    },
    'Competitivo-Metódico': {
        identity: 'Un grupo que quiere ganar y sabe cómo. La acción y el análisis conviven, generando un estilo de juego intenso pero inteligente.',
        tools: [
            'Dale al grupo información táctica antes de los ejercicios. La combinación de análisis + acción hace que procesen las instrucciones rápido y las ejecuten con convicción.',
            'Cuando surjan diferencias de ritmo (algunos quieren actuar ya, otros quieren entender primero), valida ambos: "buena lectura, ahora a ejecutar" reúne ambos estilos.',
            'Los ejercicios de toma de decisión bajo presión son ideales para este grupo: combinan lo mejor de ambos ejes.',
        ],
    },
    'Social-Cohesivo': {
        identity: 'Un grupo cálido y unido. La prioridad natural es el bienestar del equipo y la conexión entre los jugadores. El clima emocional es excelente.',
        tools: [
            'Aprovecha el clima positivo para introducir desafíos progresivos. Este grupo acepta salir de la zona cómoda cuando se siente seguro emocionalmente.',
            'Incorpora momentos de intensidad competitiva como "invitados": un ejercicio puntual de alta exigencia dentro de una sesión más relajada.',
            'Cuando necesites subir la intensidad, enmárcalo en el cuidado grupal: "vamos a esforzarnos un poco más porque confío en lo que este grupo puede lograr junto".',
        ],
    },
    'Social-Metódico': {
        identity: 'Un grupo que combina expresividad con observación. La comunicación es rica y detallada: se habla mucho y se analiza mucho.',
        tools: [
            'Usa la habilidad comunicativa del grupo para ejercicios de feedback entre pares: "explícale a tu compañero qué observaste de su jugada".',
            'Equilibra los momentos de análisis verbal con acción física. Este grupo tiende a procesar hablando, lo cual es valioso, pero también se beneficia de momentos de "menos charla, más juego".',
            'Los ejercicios que combinan creatividad con precisión (jugadas ensayadas, combinaciones tácticas) son el terreno ideal para este grupo.',
        ],
    },
    'Cohesivo-Metódico': {
        identity: 'Un grupo paciente y consistente. El ritmo es deliberado, la atención al detalle es alta, y la base emocional es sólida.',
        tools: [
            'Introduce elementos de sorpresa y velocidad de forma gradual: ejercicios con cambio de reglas a mitad de la actividad, variaciones inesperadas en la rutina.',
            'Valora la consistencia del grupo ("este grupo no comete el mismo error dos veces") y desde ahí invita a la acción más rápida.',
            'Los momentos de alta presión competitiva son la oportunidad de crecimiento de este grupo. Prepáralos con anticipación: "hoy vamos a practicar jugar con presión de tiempo".',
        ],
    },
    'Balanceado-Competitivo': {
        identity: 'Un grupo con base diversa que encuentra su motor en la competencia. La variedad de estilos le permite abordar los desafíos desde múltiples ángulos, y la energía competitiva le da dirección.',
        tools: [
            'Aprovecha la diversidad del grupo para crear equipos internos equilibrados: cada equipo tiene un poco de todo, y la competencia se vuelve más rica.',
            'Usa la variedad de estilos como ventaja táctica: "en este ejercicio, los que observan dan feedback a los que ejecutan, y después cambian". La rotación de roles mantiene a todos activos.',
            'La competencia en este grupo funciona mejor cuando es colectiva y no individual. Desafíos de equipo contra el reloj, récords grupales o metas compartidas canalizan la energía sin generar fricciones entre estilos distintos.',
        ],
    },
    'Balanceado-Social': {
        identity: 'Un grupo diverso que se une a través del vínculo. La variedad de estilos enriquece las interacciones, y la energía social actúa como el pegamento que mantiene cohesionado al grupo a pesar de las diferencias.',
        tools: [
            'Usa la energía social como puente entre estilos: "explícale a tu compañero cómo lo ves" genera intercambios naturales entre jugadores que piensan distinto.',
            'Las actividades de integración son especialmente efectivas en este grupo porque la diversidad garantiza que cada jugador aporte algo distinto al momento compartido.',
            'Alterna entre ejercicios sociales (en grupo, con comunicación) y ejercicios individuales (concentración, técnica). La diversidad del grupo tolera bien los cambios de formato si el clima emocional se mantiene positivo.',
        ],
    },
    'Balanceado-Cohesivo': {
        identity: 'Un grupo diverso que construye desde la confianza. La variedad de estilos se sostiene sobre una base de estabilidad emocional que permite que cada jugador encuentre su espacio sin competir por él.',
        tools: [
            'La estabilidad de este grupo permite introducir desafíos nuevos con seguridad: la base cohesiva amortigua la incomodidad del cambio, y la diversidad garantiza que alguien del grupo se adapte rápido.',
            'Mantén rituales y rutinas que refuercen la pertenencia, pero dentro de esas rutinas varía los ejercicios para activar los distintos estilos.',
            'Cuando incorpores un jugador nuevo, apóyate en la cohesión natural del grupo: "el equipo se va a encargar de integrarte". La diversidad hace que el nuevo encuentre rápidamente a alguien con un estilo similar.',
        ],
    },
    'Balanceado-Metódico': {
        identity: 'Un grupo diverso con tendencia a la reflexión. La variedad de estilos se complementa con una inclinación natural a observar, analizar y entender antes de actuar.',
        tools: [
            'Explica el propósito de cada ejercicio antes de empezar. La diversidad del grupo hace que cada jugador lo procese distinto, pero la tendencia analítica compartida necesita el "para qué" como punto de partida.',
            'Usa la capacidad de observación del grupo como herramienta de feedback: "¿qué vieron en esa jugada?" genera respuestas diversas y ricas porque cada estilo observa cosas diferentes.',
            'Alterna momentos de análisis con momentos de acción espontánea. El equilibrio entre reflexión y ejecución es clave: "primero piensen 10 segundos qué van a hacer, después ejecuten sin parar".',
        ],
    },
};

/**
 * Get composite key from two group types (sorted alphabetically).
 */
export function getCompositeKey(types: string[]): string | null {
    if (types.length !== 2) return null;
    const sorted = [...types].sort();
    return `${sorted[0]}-${sorted[1]}`;
}

/* ── Indicator Texts ───────────────────────────────────────────────────────── */

interface IndicatorText {
    label: string;
    description: string;
}

type AxisIndicatorTexts = Record<IndicatorLevel, IndicatorText>;

export const INDICATOR_TEXTS: Record<string, AxisIndicatorTexts> = {
    D: {
        equilibrada:   { label: 'Presencia equilibrada', description: 'El grupo tiene presencia de liderazgo natural bien distribuida.' },
        moderada:      { label: 'Presencia moderada', description: 'El liderazgo en este grupo tiende a depender más del adulto. Esto abre la oportunidad de desarrollar liderazgo en jugadores que todavía no lo expresan.' },
        marcada:       { label: 'Presencia marcada', description: 'El grupo tiene varios líderes naturales. Cada uno puede brillar si tiene un espacio claro de responsabilidad.' },
        definido_alto: { label: 'Estilo definido', description: 'El grupo tiene una densidad alta de jugadores que buscan liderar. Definir roles rotativos y espacios de responsabilidad permite que esa energía se canalice de forma productiva.' },
        definido_bajo: { label: 'Estilo definido', description: 'El grupo funciona bien con guía externa. El adulto es el referente principal de dirección, lo cual permite trabajar el liderazgo como habilidad a desarrollar.' },
    },
    I: {
        equilibrada:   { label: 'Presencia equilibrada', description: 'El grupo tiene buena capacidad de conexión social y expresividad.' },
        moderada:      { label: 'Presencia moderada', description: 'La expresividad social del grupo es contenida. Los rituales de equipo (gritos, saludos, celebraciones breves) ayudan a construir ese tejido social.' },
        marcada:       { label: 'Presencia marcada', description: 'El grupo tiene mucha energía social. Esa expresividad es un recurso valioso cuando se canaliza: celebraciones grupales, liderazgo motivacional, integración de nuevos jugadores.' },
        definido_alto: { label: 'Estilo definido', description: 'La energía social del grupo es su sello de identidad. Las señales claras de transición entre momentos sociales y momentos de concentración ayudan a que el grupo active ambos modos.' },
        definido_bajo: { label: 'Estilo definido', description: 'El grupo es reservado en su expresión social. Esto genera un ambiente enfocado y de bajo conflicto. Los momentos de conexión personal (una ronda de cómo llegan hoy, una anécdota compartida) enriquecen el vínculo.' },
    },
    S: {
        equilibrada:   { label: 'Presencia equilibrada', description: 'El grupo tiene una base emocional sólida que le da consistencia.' },
        moderada:      { label: 'Presencia moderada', description: 'El grupo tiene un ritmo cambiante que puede ser su fortaleza en contextos dinámicos. Las rutinas predecibles (mismo calentamiento, misma estructura) le dan un ancla cuando lo necesita.' },
        marcada:       { label: 'Presencia marcada', description: 'El grupo tiene una estabilidad emocional alta. Esa consistencia es la base sobre la cual el adulto puede ir construyendo desafíos graduales.' },
        definido_alto: { label: 'Estilo definido', description: 'La consistencia es el superpoder de este grupo. Los desafíos nuevos, introducidos de forma gradual y explicada, son la oportunidad de crecimiento. El grupo acepta cambios cuando entiende el porqué.' },
        definido_bajo: { label: 'Estilo definido', description: 'El grupo tiene un estilo reactivo y dinámico. Esto lo hace fuerte en situaciones cambiantes. Las rutinas breves y predecibles al inicio de cada sesión le dan una base de referencia.' },
    },
    C: {
        equilibrada:   { label: 'Presencia equilibrada', description: 'El grupo tiene buena capacidad de observación y atención táctica.' },
        moderada:      { label: 'Presencia moderada', description: 'El grupo se mueve más por instinto que por análisis. Esa espontaneidad es valiosa, y las pausas breves de observación ("mira esta jugada, ¿qué ves?") incorporan el análisis sin frenar la acción.' },
        marcada:       { label: 'Presencia marcada', description: 'El grupo tiene alta capacidad analítica. Los ejercicios que combinan observación con ejecución ("mira, decide, ejecuta") son ideales para este grupo.' },
        definido_alto: { label: 'Estilo definido', description: 'La observación es la fortaleza central de este grupo. Los ejercicios con tiempo limitado para decidir ("tres segundos para elegir") lo ayudan a conectar el análisis con la acción rápida.' },
        definido_bajo: { label: 'Estilo definido', description: 'El grupo actúa con fluidez y espontaneidad. Las revisiones breves post-ejercicio ("¿qué pasó ahí?") le permiten incorporar la reflexión sin interrumpir el ritmo natural.' },
    },
};

export const DIVERSITY_TEXTS: Record<DiversityLevel, IndicatorText> = {
    alta:         { label: 'Alta diversidad', description: 'El grupo tiene buena diversidad de estilos de comportamiento. Esto le permite adaptarse a distintos tipos de situaciones deportivas.' },
    moderada_div: { label: 'Diversidad moderada', description: 'El grupo tiene una tendencia marcada hacia algunos estilos de comportamiento. Esto le da identidad clara, y el adulto puede complementar con ejercicios que activen otros estilos.' },
    definida:     { label: 'Identidad definida', description: 'El grupo tiene un estilo de comportamiento muy definido. Esto es una fortaleza en situaciones que requieren ese estilo, y una oportunidad de crecimiento en contextos que pidan algo diferente.' },
};

/* ── Motor Texts ───────────────────────────────────────────────────────────── */

interface MotorText {
    identity: string;
    tools: string;
}

export const MOTOR_TEXTS: Record<MotorGroupType, MotorText> = {
    Rápido: {
        identity: 'Un grupo de reacción inmediata. La primera respuesta es rápida y la intensidad inicial es alta.',
        tools: 'Las pausas estratégicas entre ejercicios ("antes de arrancar, observen 5 segundos") le aportan una capa de reflexión que complementa la velocidad natural.',
    },
    Medio: {
        identity: 'Un grupo adaptable que puede ajustar su ritmo según el contexto. La flexibilidad es su característica principal.',
        tools: 'Alterna ejercicios de alta velocidad con ejercicios de pausa y análisis. Este grupo responde bien a la variedad porque su ritmo se adapta.',
    },
    Lento: {
        identity: 'Un grupo que procesa antes de actuar. Las decisiones tienden a ser reflexionadas y la calidad de ejecución es alta.',
        tools: 'Anticipa las transiciones ("en 30 segundos vamos a cambiar de ejercicio") para que el grupo pueda prepararse. Los ejercicios con tiempo de preparación seguidos de ejecución rápida combinan lo mejor del estilo reflexivo con la práctica de la acción.',
    },
    Diverso: {
        identity: 'Un grupo con variedad de ritmos. Conviven estilos rápidos, medios y reflexivos, lo cual enriquece la dinámica grupal.',
        tools: 'Los ejercicios que requieren diferentes ritmos en diferentes roles son ideales. "Uno lee la jugada (reflexivo), otro la comunica (medio), otro la ejecuta (rápido)." La diversidad de motor es un recurso táctico.',
    },
};

/* ── Localized getters ──────────────────────────────────────────────────────── */

import { GROUP_PROFILE_TEXTS_EN, COMPOSITE_TEXTS_EN, INDICATOR_TEXTS_EN, DIVERSITY_TEXTS_EN, MOTOR_TEXTS_EN } from './groupBalanceRules.en';
import { GROUP_PROFILE_TEXTS_PT, COMPOSITE_TEXTS_PT, INDICATOR_TEXTS_PT, DIVERSITY_TEXTS_PT, MOTOR_TEXTS_PT } from './groupBalanceRules.pt';

export function getGroupProfileText(type: GroupType, lang: string): GroupProfileText {
    if (lang === 'en') return GROUP_PROFILE_TEXTS_EN[type] ?? GROUP_PROFILE_TEXTS[type];
    if (lang === 'pt') return GROUP_PROFILE_TEXTS_PT[type] ?? GROUP_PROFILE_TEXTS[type];
    return GROUP_PROFILE_TEXTS[type];
}

export function getCompositeText(key: string | null, lang: string): CompositeText | null {
    if (!key) return null;
    const map = lang === 'en' ? COMPOSITE_TEXTS_EN : lang === 'pt' ? COMPOSITE_TEXTS_PT : COMPOSITE_TEXTS;
    return map[key] ?? null;
}

export function getIndicatorText(axis: string, level: IndicatorLevel, lang: string): IndicatorText {
    if (lang === 'en') return INDICATOR_TEXTS_EN[axis]?.[level] ?? INDICATOR_TEXTS[axis][level];
    if (lang === 'pt') return INDICATOR_TEXTS_PT[axis]?.[level] ?? INDICATOR_TEXTS[axis][level];
    return INDICATOR_TEXTS[axis][level];
}

export function getDiversityText(level: DiversityLevel, lang: string): IndicatorText {
    if (lang === 'en') return DIVERSITY_TEXTS_EN[level] ?? DIVERSITY_TEXTS[level];
    if (lang === 'pt') return DIVERSITY_TEXTS_PT[level] ?? DIVERSITY_TEXTS[level];
    return DIVERSITY_TEXTS[level];
}

export function getMotorText(type: MotorGroupType, lang: string): MotorText {
    if (lang === 'en') return MOTOR_TEXTS_EN[type] ?? MOTOR_TEXTS[type];
    if (lang === 'pt') return MOTOR_TEXTS_PT[type] ?? MOTOR_TEXTS[type];
    return MOTOR_TEXTS[type];
}

/* ── Axis display config ───────────────────────────────────────────────────── */

export const AXIS_CONFIG: Record<string, { name: string; indicatorLabel: string; color: string; bgColor: string; borderColor: string }> = {
    D: { name: 'Impulsor',  indicatorLabel: 'Energía de liderazgo',  color: '#dc2626', bgColor: '#fef2f2', borderColor: '#fecaca' },
    I: { name: 'Conector',  indicatorLabel: 'Capital social',        color: '#d97706', bgColor: '#fffbeb', borderColor: '#fde68a' },
    S: { name: 'Sostén',    indicatorLabel: 'Base de estabilidad',   color: '#059669', bgColor: '#ecfdf5', borderColor: '#a7f3d0' },
    C: { name: 'Estratega', indicatorLabel: 'Atención al detalle',   color: '#4f46e5', bgColor: '#eef2ff', borderColor: '#c7d2fe' },
};
