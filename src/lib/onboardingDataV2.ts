/**
 * Odyssey V2 — Shortened texts for children.
 * Axis mappings are IDENTICAL to v1. Only the text is reduced.
 */
import type { Question, StorySlideData } from './onboardingData';
export type { Axis, Question, QuestionOption, StorySlideData } from './onboardingData';

// Re-export adult intro slides unchanged (adult-facing, no need to shorten)
export { ADULT_INTRO_SLIDES } from './onboardingData';

// ─── Story Slides (slightly shorter) ─────────────────────────────────────────

export const STORY_SLIDES_V2: Record<string, StorySlideData> = {
    intro_a: {
        id: 'intro_a',
        title: 'El Misterio del Argo',
        body: 'Hace mucho tiempo existió un barco legendario llamado el Argo. Su misión: cruzar mares desconocidos para encontrar un tesoro perdido.',
    },
    intro_b: {
        id: 'intro_b',
        title: 'La Tripulación',
        body: 'Cincuenta compañeros muy distintos formaron la tripulación. Cada uno aportó su talento único: unos pusieron la fuerza, otros el ritmo y otros el rumbo.',
    },
    intro_c: {
        id: 'intro_c',
        title: 'Tu Lugar en la Nave',
        body: 'Hoy, el Argo vuelve a navegar y te invitamos a ser parte. Tu forma de navegar es la pieza que falta.',
    },
    intro_0: {
        id: 'intro_0',
        title: '¡A bordo!',
        body: 'El Argo está en el muelle. Jasón te hace una señal desde la proa: "¡A bordo!". Elige tu remo y prepárate para la aventura.',
    },
    slide_1: {
        id: 'slide_1',
        title: 'Mar Abierto',
        body: 'El puerto ya es una línea en el horizonte. El Argo se desliza con fuerza. El viaje es largo y el mar tiene secretos.',
    },
    slide_2: {
        id: 'slide_2',
        title: 'La Tormenta',
        body: 'El cielo se vuelve gris y las olas saltan dentro del barco. El viento ruge. Es hora de demostrar de qué está hecho el equipo.',
    },
    slide_3: {
        id: 'slide_3',
        title: 'Después de la Tormenta',
        body: 'La tormenta se aleja. El equipo está cansado pero el sol vuelve a salir. La meta todavía está lejos.',
    },
    slide_4: {
        id: 'slide_4',
        title: 'El Horizonte',
        body: '¡A lo lejos aparece la isla! Arena dorada entre las olas. El viaje casi termina.',
    },
};

// ─── Questions (shortened — same axis mappings) ──────────────────────────────

export const QUESTIONS_V2: Question[] = [
    {
        number: 1,
        title: 'El Despegue',
        intro: '¡Es hora de zarpar! ¿Qué haces primero?',
        options: [
            { label: 'Reviso que todo esté listo', axis: 'C' },
            { label: '¡Salto al barco ya!', axis: 'D' },
            { label: 'Me instalo con calma', axis: 'S' },
            { label: 'Busco a mis amigos', axis: 'I' },
        ],
    },
    {
        number: 2,
        title: 'El Nuevo Ritmo',
        intro: 'El capitán enseña una nueva forma de remar. ¿Cómo la aprendes?',
        options: [
            { label: 'Primero entiendo el por qué', axis: 'C' },
            { label: 'Me lanzo a probar de una', axis: 'D' },
            { label: 'Que me muestren paso a paso', axis: 'S' },
            { label: 'La practicamos todos juntos', axis: 'I' },
        ],
    },
    {
        number: 3,
        title: 'El Motor del Viaje',
        intro: '¿Qué te hace sonreír mientras navegamos?',
        options: [
            { label: 'Aprender trucos nuevos', axis: 'C' },
            { label: 'Mantener un ritmo constante', axis: 'S' },
            { label: 'Charlar con los demás', axis: 'I' },
            { label: 'Sentir que vamos rápido', axis: 'D' },
        ],
    },
    {
        number: 4,
        title: 'La Encrucijada',
        intro: 'El mapa muestra dos caminos. ¿Cómo decides?',
        options: [
            { label: 'Escucho qué opinan todos', axis: 'I' },
            { label: 'Analizo el mapa y el viento', axis: 'C' },
            { label: 'Elijo el más directo', axis: 'D' },
            { label: 'Sigo el camino conocido', axis: 'S' },
        ],
    },
    {
        number: 5,
        title: 'El Momento del Caos',
        intro: '¡La tormenta nos atrapa! ¿Qué haces?',
        options: [
            { label: 'Me agarro fuerte y sigo', axis: 'S' },
            { label: 'Me muevo rápido a ayudar', axis: 'D' },
            { label: 'Pienso qué es lo importante', axis: 'C' },
            { label: 'Busco a mis compañeros', axis: 'I' },
        ],
    },
    {
        number: 6,
        title: 'El Desajuste',
        intro: 'Una ola inclina el barco. ¿Qué te sale hacer?',
        options: [
            { label: '¡Grito "vamos equipo!"', axis: 'I' },
            { label: 'Agarro lo que pueda', axis: 'D' },
            { label: 'Miro qué se soltó', axis: 'C' },
            { label: 'Me quedo firme en mi lugar', axis: 'S' },
        ],
    },
    {
        number: 7,
        title: 'El Error del Nudo',
        intro: 'Tu nudo se soltó. ¿Qué haces primero?',
        options: [
            { label: 'Respiro y lo intento de nuevo', axis: 'S' },
            { label: 'Veo qué parte falló', axis: 'C' },
            { label: 'Lo rehago con más fuerza', axis: 'D' },
            { label: 'Pido ayuda a un compañero', axis: 'I' },
        ],
    },
    {
        number: 8,
        title: 'El Empuje',
        intro: 'El equipo está cansado. ¿Cómo los animas?',
        options: [
            { label: 'Digo algo divertido', axis: 'I' },
            { label: 'Recuerdo cuánto falta', axis: 'C' },
            { label: 'Sigo remando igual', axis: 'S' },
            { label: 'Remo más fuerte', axis: 'D' },
        ],
    },
    {
        number: 9,
        title: 'La Espera',
        intro: 'Te toca descansar un momento. ¿Qué haces?',
        options: [
            { label: 'Observo y aprendo', axis: 'C' },
            { label: 'Me preparo para actuar', axis: 'D' },
            { label: 'Recupero energía', axis: 'S' },
            { label: 'Doy ánimos al equipo', axis: 'I' },
        ],
    },
    {
        number: 10,
        title: 'El Apoyo',
        intro: 'A un compañero se le cae el remo. ¿Qué haces?',
        options: [
            { label: 'Le choco la mano, ¡todos bien!', axis: 'I' },
            { label: 'Le enseño un truco', axis: 'C' },
            { label: 'Lo ayudo a recuperarlo rápido', axis: 'D' },
            { label: 'Me pongo a su lado', axis: 'S' },
        ],
    },
    {
        number: 11,
        title: 'La Práctica Final',
        intro: 'Hay que repetir una maniobra muchas veces. ¿Qué te ayuda?',
        options: [
            { label: 'Que cada vez salga mejor', axis: 'C' },
            { label: 'Hacerla como un juego con todos', axis: 'I' },
            { label: 'Que se vuelva fácil y natural', axis: 'S' },
            { label: 'Ponerme un reto de velocidad', axis: 'D' },
        ],
    },
    {
        number: 12,
        title: 'La Meta',
        intro: '¡Llegamos a la playa! ¿Qué piensas primero?',
        options: [
            { label: '¡Increíble aventura juntos!', axis: 'I' },
            { label: '¡Qué bien salió el plan!', axis: 'C' },
            { label: '¡Llegamos todos a salvo!', axis: 'S' },
            { label: '¿Cuál es la próxima isla?', axis: 'D' },
        ],
    },
];
