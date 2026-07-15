export type Axis = 'D' | 'I' | 'S' | 'C';

export interface QuestionOption {
    label: string;
    axis: Axis;
}

export interface Question {
    number: number;
    title: string;
    intro: string;
    options: QuestionOption[];
}

// ─── v4: stable question identity + signature scenes (persistence, spec §4/§10) ──────
/** Bump when the question bank changes so evolution never compares across instruments. */
export const QUESTION_VERSION = 'v4-2026-07';
/** Stable per-question id derived from the 1-12 order (persisted with each answer). */
export function questionId(questionNumber: number): string {
    return `q${questionNumber}`;
}
/** Signature scenes for the "momento notable" module: storm/adversity (Q5-7) + goal (Q12). */
export const SIGNATURE_SCENES: Record<number, 'tormenta' | 'meta'> = {
    5: 'tormenta', 6: 'tormenta', 7: 'tormenta', 12: 'meta',
};

export interface StorySlideData {
    id: string;
    title?: string;
    body: string;
}

// ─── Adult Intro Slides (shown before registration) ───────────────────────────

export const ADULT_INTRO_SLIDES: StorySlideData[] = [
    {
        id: 'adult_intro_1',
        title: 'Bienvenido a Argo',
        body: 'Argo es una herramienta de autoconocimiento deportivo para niños y niñas de 8 a 16 años. A través de una historia interactiva, exploramos tendencias en cómo se motiva el deportista, cómo aprende y cómo suele reaccionar bajo presión.',
    },
    {
        id: 'adult_intro_2',
        title: '12 decisiones. Una aventura.',
        body: 'El deportista navega una historia ambientada en el mundo del Argo (la nave legendaria) y toma 12 decisiones que dejan ver tendencias de su forma de decidir y relacionarse hoy. No hay respuestas correctas ni incorrectas. Solo elecciones auténticas.',
    },
    {
        id: 'adult_intro_3',
        title: 'El Informe',
        body: 'Al finalizar, te enviamos a tu email un informe personalizado con el arquetipo que mejor describe sus tendencias actuales, su motor de motivación, claves de comunicación y sugerencias concretas para acompañarlo en su actividad.',
    },
];

// ─── Story Slides ─────────────────────────────────────────────────────────────

export const STORY_SLIDES: Record<string, StorySlideData> = {
    intro_a: {
        id: 'intro_a',
        title: 'El Misterio del Argo',
        body: 'Hace mucho tiempo, existió un barco legendario llamado el Argo. No era un barco común. Su misión era cruzar mares desconocidos para encontrar un tesoro perdido.',
    },
    intro_b: {
        id: 'intro_b',
        title: 'La Tripulación de Especialistas',
        body: 'Cincuenta compañeros muy distintos entre sí formaron la tripulación del Argo. La verdadera magia ocurrió cuando cada uno aportó su talento único: unos pusieron la fuerza, otros el ritmo y otros el rumbo.',
    },
    intro_c: {
        id: 'intro_c',
        title: 'Tu Lugar en la Nave',
        body: 'Hoy, el Argo vuelve a navegar y te invitamos a ser parte de esta nueva aventura. Tu forma de navegar es la pieza que falta en nuestra tripulación.',
    },
    intro_0: {
        id: 'intro_0',
        title: '¡A bordo!',
        body: 'El Argo está en el muelle. Los remos brillan bajo el sol y el mar parece un espejo esperando a ser cruzado. Jasón te hace una señal desde la proa: "¡A bordo!". No buscamos soldados, buscamos compañeros de viaje. Súbete, elige tu remo y prepárate para la aventura.',
    },
    slide_1: {
        id: 'slide_1',
        title: 'Mar Abierto',
        body: 'El puerto ya es solo una línea pequeña en el horizonte. El azul del mar nos rodea y el Argo se desliza con fuerza. Cada uno de nosotros ha encontrado su lugar en el banco de remo, pero el viaje es largo y el mar siempre tiene secretos.',
    },
    slide_2: {
        id: 'slide_2',
        title: 'El Desafío',
        body: 'De pronto, el cielo se vuelve gris y las olas empiezan a saltar dentro del barco. El viento ruge y el capitán grita órdenes que casi no se oyen. Es el momento de que el Argo demuestre de qué madera está hecho.',
    },
    slide_3: {
        id: 'slide_3',
        title: 'El Aliento de la Tripulación',
        body: 'La tormenta se aleja. El equipo está cansado y los remos pesan más que antes. El sol vuelve a salir, pero la meta todavía está lejos. Es el momento de ayudarnos a seguir adelante.',
    },
    slide_4: {
        id: 'slide_4',
        title: 'El Horizonte',
        body: 'A lo lejos, una franja de arena dorada aparece entre las olas. ¡Es la isla! El viaje casi termina. Hemos cruzado el mar, hemos superado la tormenta y lo hemos hecho juntos.',
    },
};

// ─── Questions ────────────────────────────────────────────────────────────────

export const QUESTIONS: Question[] = [
    {
        number: 1,
        title: 'El Despegue',
        intro: 'El barco está por salir del puerto. ¿Qué te dan ganas de hacer?',
        options: [
            { label: 'Miro que las cuerdas estén bien atadas antes de salir.', axis: 'C' },
            { label: 'Subo rápido al barco para salir ya.', axis: 'D' },
            { label: 'Me acomodo tranquilo para ayudar durante el viaje.', axis: 'S' },
            { label: 'Busco a mis amigos para sentarnos juntos.', axis: 'I' },
        ],
    },
    {
        number: 2,
        title: 'El Nuevo Ritmo',
        intro: 'El capitán te enseña una forma nueva de remar. ¿Qué haces tú para aprenderla?',
        options: [
            { label: 'Primero quiero entender por qué se hace así.', axis: 'C' },
            { label: 'La pruebo enseguida con mis propios brazos.', axis: 'D' },
            { label: 'La repito paso a paso para remar al ritmo del equipo.', axis: 'S' },
            { label: 'La practico con mis amigos para divertirnos.', axis: 'I' },
        ],
    },
    {
        number: 3,
        title: 'El Motor del Viaje',
        intro: '¿Qué es lo que más te hace sonreír cuando estamos en el agua?',
        options: [
            { label: 'Aprender trucos para que mi remo entre al agua sin salpicar.', axis: 'C' },
            { label: 'Remar parejo para ayudar a que el barco no se frene.', axis: 'S' },
            { label: 'Contar historias con los demás mientras el barco avanza.', axis: 'I' },
            { label: 'Sentir que vamos cada vez más rápido hacia la isla.', axis: 'D' },
        ],
    },
    {
        number: 4,
        title: 'La Encrucijada',
        intro: 'El mapa muestra dos caminos para llegar a la isla. ¿Cómo te gusta elegir?',
        options: [
            { label: 'Pregunto a todos cuál camino les gusta más.', axis: 'I' },
            { label: 'Miro bien el mapa y el viento antes de elegir.', axis: 'C' },
            { label: 'Elijo el camino más corto para llegar antes.', axis: 'D' },
            { label: 'Prefiero el camino que ya conocemos para ir todos tranquilos.', axis: 'S' },
        ],
    },
    {
        number: 5,
        title: 'La Tormenta',
        intro: 'La tormenta se acerca. ¿Qué haces?',
        options: [
            { label: 'Me pongo en marcha ya, sin esperar a que llegue.', axis: 'D' },
            { label: 'Miro el cielo y reviso qué conviene asegurar antes.', axis: 'C' },
            { label: 'Reúno al equipo para que estemos todos juntos.', axis: 'I' },
            { label: 'Sigo firme con mi parte para que el barco no se frene.', axis: 'S' },
        ],
    },
    {
        number: 6,
        title: 'El Desajuste',
        intro: 'Una ola inclina el barco de golpe y casi te caes. En ese segundo... ¿qué haces?',
        options: [
            { label: 'Grito "¡Vamos, equipo!" para dar ánimo a todos.', axis: 'I' },
            { label: 'Agarro una cuerda para ayudar a acomodar el barco.', axis: 'D' },
            { label: 'Busco qué se soltó para avisarle al capitán.', axis: 'C' },
            { label: 'Sostengo a mis compañeros para que nadie se caiga.', axis: 'S' },
        ],
    },
    {
        number: 7,
        title: 'El Nudo Rebelde',
        intro: 'Hiciste un nudo para atar la vela y se soltó. ¿Qué haces primero?',
        options: [
            { label: 'Lo vuelvo a atar con cuidado para que el equipo siga navegando.', axis: 'S' },
            { label: 'Reviso el nudo para descubrir por qué se soltó.', axis: 'C' },
            { label: 'Lo intento otra vez con más energía.', axis: 'D' },
            { label: 'Invito a un compañero a atarlo juntos.', axis: 'I' },
        ],
    },
    {
        number: 8,
        title: 'El Empuje',
        intro: 'El equipo está cansado y nos cuesta seguir remando. ¿Qué te dan ganas de hacer?',
        options: [
            { label: 'Pongo más energía para que el barco avance.', axis: 'D' },
            { label: 'Me fijo bien cómo mover el remo para que sea más fácil.', axis: 'C' },
            { label: 'Sigo remando parejo para que el barco no pare.', axis: 'S' },
            { label: 'Digo algo divertido para animar al equipo.', axis: 'I' },
        ],
    },
    {
        number: 9,
        title: 'La Espera',
        intro: 'Te toca descansar mientras otros acomodan las velas. ¿Qué haces en ese ratito?',
        options: [
            { label: 'Miro cómo lo hacen para aprender sus trucos.', axis: 'C' },
            { label: 'Espero atento la señal para volver a remar.', axis: 'D' },
            { label: 'Descanso tranquilo para ayudar cuando el equipo me necesite.', axis: 'S' },
            { label: 'Les doy ánimo a los que acomodan las velas.', axis: 'I' },
        ],
    },
    {
        number: 10,
        title: 'El Apoyo',
        intro: 'A un compañero se le escapa el remo y se pone un poco triste. ¿Qué te sale del corazón?',
        options: [
            { label: 'Le alcanzo el remo rápido para que siga remando.', axis: 'D' },
            { label: 'Le muestro un truco para agarrar mejor el remo.', axis: 'C' },
            { label: 'Remo a su lado para que no se sienta solo.', axis: 'S' },
            { label: 'Le hago un chiste para que se ría.', axis: 'I' },
        ],
    },
    {
        number: 11,
        title: 'La Práctica Final',
        intro: 'Para llegar a la orilla hay que repetir el mismo movimiento muchas veces. ¿Qué te ayuda a no aburrirte?',
        options: [
            { label: 'Mejorar algún detalle en cada intento.', axis: 'C' },
            { label: 'Sentir que es un juego con mis amigos.', axis: 'I' },
            { label: 'Sentir que mi ritmo ayuda al barco.', axis: 'S' },
            { label: 'Inventarme un desafío nuevo cada vez.', axis: 'D' },
        ],
    },
    {
        number: 12,
        title: 'La Meta',
        intro: '¡Llegamos! El barco toca la arena. Al bajar a la playa... ¿qué es lo primero que piensas?',
        options: [
            { label: '¡Qué lindo fue compartir esta aventura con el equipo!', axis: 'I' },
            { label: '¡Qué bien nos salió el plan del viaje!', axis: 'C' },
            { label: '¡Qué bueno que ayudé a que todos llegáramos bien!', axis: 'S' },
            { label: '¡Lo logramos! ¿Cuál será la próxima isla?', axis: 'D' },
        ],
    },
];
