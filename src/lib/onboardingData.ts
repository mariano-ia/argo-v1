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
        body: 'Argo es una herramienta de autoconocimiento deportivo para chicos y chicas de 8 a 16 años. A través de una historia interactiva, identificamos cómo se motiva el deportista, cómo aprende y cómo reacciona bajo presión.',
    },
    {
        id: 'adult_intro_2',
        title: '12 decisiones. Una aventura.',
        body: 'El deportista navega una historia ambientada en el mundo del Argo —la nave legendaria— y toma 12 decisiones que, sin saberlo, revelan su perfil comportamental. No hay respuestas correctas ni incorrectas. Solo elecciones auténticas.',
    },
    {
        id: 'adult_intro_3',
        title: 'El Informe de Sintonía',
        body: 'Al finalizar, te enviamos a tu email un informe personalizado con el arquetipo del deportista, su motor de motivación, claves de comunicación y sugerencias concretas para el entrenamiento. Todo generado con inteligencia artificial.',
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
        intro: 'Antes de soltar las amarras y dejar atrás el puerto... ¿qué te nace hacer?',
        options: [
            { label: 'Reviso que los cabos estén bien atados y el equipo en su sitio para que nada nos sorprenda.', axis: 'C' },
            { label: 'Salto al barco y me ubico rápido para empezar a movernos ya mismo.', axis: 'D' },
            { label: 'Me instalo con calma, disfrutando de cómo el agua empieza a mover el casco.', axis: 'S' },
            { label: 'Busco a mis amigos para ver quién se sienta conmigo y compartir el viaje.', axis: 'I' },
        ],
    },
    {
        number: 2,
        title: 'El Nuevo Ritmo',
        intro: 'El capitán enseña una forma de mover el remo que nunca viste. Para aprenderla...',
        options: [
            { label: 'Me gusta entender primero el "por qué" se hace así para que mi movimiento sea preciso.', axis: 'C' },
            { label: 'Me lanzo a probarlo de una vez para sentir el ritmo en mis propios brazos.', axis: 'D' },
            { label: 'Prefiero que me lo muestren paso a paso y despacio hasta que me salga fluido.', axis: 'S' },
            { label: 'Me divierte ver cómo nos sale a todos y bromear un poco mientras lo intentamos.', axis: 'I' },
        ],
    },
    {
        number: 3,
        title: 'El Motor del Viaje',
        intro: '¿Qué es lo que más te hace sonreír mientras estamos en el agua?',
        options: [
            { label: 'Aprender trucos nuevos para que mi remo entre al agua sin hacer ni una gota de espuma.', axis: 'C' },
            { label: 'Sentir que mi ritmo es constante y que el equipo puede apoyarse en mi esfuerzo.', axis: 'S' },
            { label: 'Charlar y contar historias con los demás mientras el barco avanza.', axis: 'I' },
            { label: 'Sentir que vamos a toda velocidad y que cada vez nos falta menos para llegar.', axis: 'D' },
        ],
    },
    {
        number: 4,
        title: 'La Encrucijada',
        intro: 'Llegamos a un punto donde el mapa muestra dos caminos para llegar a la isla. ¿Cómo preferís decidir?',
        options: [
            { label: 'Escucho qué opinan los demás para que elijamos el camino que más nos entusiasme a todos.', axis: 'I' },
            { label: 'Analizo el mapa y el viento para ver qué ruta es la más lógica y clara para avanzar.', axis: 'C' },
            { label: 'Elijo el camino más directo para llegar cuanto antes a la aventura que nos espera.', axis: 'D' },
            { label: 'Sigo el camino que ya conocemos y que nos da la seguridad de que saldrá bien.', axis: 'S' },
        ],
    },
    {
        number: 5,
        title: 'El Momento del Caos',
        intro: 'En medio del lío de la tormenta...',
        options: [
            { label: 'Me agarro fuerte a mi puesto y sigo haciendo mi tarea con cuidado hasta que pase el peligro.', axis: 'S' },
            { label: 'Me muevo rápido para reaccionar a lo que sea que el barco necesite en ese instante.', axis: 'D' },
            { label: 'Hago una pausa breve para encontrar el orden entre tanto ruido y saber qué es lo más importante.', axis: 'C' },
            { label: 'Busco la mirada de mis compañeros para sentir que estamos todos juntos en esto.', axis: 'I' },
        ],
    },
    {
        number: 6,
        title: 'El Desajuste',
        intro: 'El mar inclina el barco de golpe y te desequilibrás. En ese segundo... ¿qué te sale hacer?',
        options: [
            { label: 'Grito un "¡Vamos equipo!" para que el ánimo no decaiga en la tormenta.', axis: 'I' },
            { label: 'Agarro con fuerza lo primero que tenga cerca para ayudar a enderezar el barco.', axis: 'D' },
            { label: 'Busco con la vista qué se soltó o qué cambió para avisar cómo arreglarlo.', axis: 'C' },
            { label: 'Me quedo firme en mi sitio, haciendo fuerza para que el grupo recupere el equilibrio.', axis: 'S' },
        ],
    },
    {
        number: 7,
        title: 'El Error del Nudo',
        intro: 'Intentaste asegurar una vela con un nudo, pero se soltó. ¿Qué es lo primero que hacés?',
        options: [
            { label: 'Respiro hondo y vuelvo a intentarlo con más paciencia y cuidado.', axis: 'S' },
            { label: 'Me detengo a ver qué parte del nudo falló para que no vuelva a pasar.', axis: 'C' },
            { label: 'Lo intento de nuevo enseguida, poniendo más energía en el movimiento.', axis: 'D' },
            { label: 'Miro si algún compañero puede darme un consejo o ayudarme a sujetar la cuerda.', axis: 'I' },
        ],
    },
    {
        number: 8,
        title: 'El Empuje',
        intro: '¿Qué hacés vos para que el Argo no se detenga?',
        options: [
            { label: 'Hago un gesto o digo algo divertido para que todos nos riamos y olvidemos el cansancio.', axis: 'I' },
            { label: 'Recuerdo a todos cuánto nos falta y qué pasos faltan para terminar la tarea.', axis: 'C' },
            { label: 'Sigo remando con el mismo ritmo, demostrando que se puede mantener la constancia.', axis: 'S' },
            { label: 'Empiezo a tirar con más fuerza para animar a los demás a seguir mi ritmo.', axis: 'D' },
        ],
    },
    {
        number: 9,
        title: 'La Espera',
        intro: 'Ahora te toca descansar un momento mientras otros compañeros ajustan las velas. ¿Cómo vivís ese minuto?',
        options: [
            { label: 'Observo con atención cómo lo hacen ellos para aprender sus técnicas.', axis: 'C' },
            { label: 'Estoy atento para volver a entrar en acción en cuanto me den la señal.', axis: 'D' },
            { label: 'Aprovecho para recuperar aire y estar listo para cuando el equipo me necesite.', axis: 'S' },
            { label: 'Aprovecho para dar ánimos y felicitar a los que están trabajando ahora.', axis: 'I' },
        ],
    },
    {
        number: 10,
        title: 'El Apoyo',
        intro: 'A un compañero se le escapa el remo de las manos y se ve un poco frustrado. ¿Qué te sale del corazón?',
        options: [
            { label: 'Le choco la mano y le digo que a cualquiera le puede pasar, que siga adelante.', axis: 'I' },
            { label: 'Le digo un pequeño truco de cómo agarrarlo para que no se le vuelva a resbalar.', axis: 'C' },
            { label: 'Lo ayudo a recuperar el remo rápido para que no perdamos tiempo de viaje.', axis: 'D' },
            { label: 'Me pongo a su lado para que sienta que no está solo y que el equipo lo apoya.', axis: 'S' },
        ],
    },
    {
        number: 11,
        title: 'La Práctica Final',
        intro: 'Para llegar a la orilla hay que repetir una maniobra muchas veces. ¿Qué te ayuda a no aburrirte?',
        options: [
            { label: 'Intentar que cada repetición me salga un poco más perfecta que la anterior.', axis: 'C' },
            { label: 'Sentir que la práctica es como un juego compartido con mis amigos.', axis: 'I' },
            { label: 'Notar que el movimiento se vuelve familiar y que cada vez me cuesta menos.', axis: 'S' },
            { label: 'Ponerme un pequeño reto personal de velocidad o dificultad cada vez.', axis: 'D' },
        ],
    },
    {
        number: 12,
        title: 'La Meta',
        intro: '¡Llegamos! El barco toca la arena. Al bajar a la playa... ¿qué es lo primero que pensás?',
        options: [
            { label: '¡Qué increíble fue compartir esta aventura con este equipo!', axis: 'I' },
            { label: '¡Qué bien nos salió el plan de navegación y la llegada!', axis: 'C' },
            { label: '¡Qué bueno que pude ayudar a que todos llegáramos sanos y salvos!', axis: 'S' },
            { label: '¡Lo logramos! ¿Cuál será la próxima isla que vamos a conquistar?', axis: 'D' },
        ],
    },
];
