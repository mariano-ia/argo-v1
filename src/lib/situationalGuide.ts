/**
 * Situational Guide — 15 situations × 4 DISC profiles = 57 cards.
 * Zero AI tokens. All content pre-written and curated.
 *
 * Reviewed by psychologist. Principles:
 * - Validate the emotion first, then offer tools
 * - Never pressure the child to stay/perform
 * - Connect with Motor when relevant
 * - Language: plain, coach-to-coach, no jargon
 */

export interface Situation {
    id: string;
    title: string;
    whatYouSee: string;
    whatsHappening: string;
    category: string;
    icon: string; // emoji for quick visual ID in the UI
}

export interface SituationCard {
    situationId: string;
    eje: 'D' | 'I' | 'S' | 'C' | 'group'; // 'group' for situation 15
    whatsHappeningForProfile: string;
    howToAccompany: string[];
    ifNotResponding: string;
}

/* ── The 15 situations ─────────────────────────────────────────────────────── */

export const SITUATIONS: Situation[] = [
    {
        id: 'no-quiere-arrancar',
        title: 'No quiere arrancar',
        whatYouSee: 'El jugador llega al entrenamiento y no quiere participar. Está apático, se queja, se sienta al costado o dice "hoy no tengo ganas".',
        whatsHappening: 'No es falta de compromiso. El niño todavía está en el "modo" de lo que estaba haciendo antes (el colegio, la casa, una pelea con un amigo). Necesita un momento para hacer el cambio de chip hacia el deporte.',
        category: 'Motivación',
        icon: '⚡',
    },
    {
        id: 'se-frustra-cuando-pierde',
        title: 'Se frustra mucho cuando pierde',
        whatYouSee: 'El jugador reacciona con enojo, se pone mal, a veces tira cosas o se niega a seguir después de perder un punto, un partido o un ejercicio.',
        whatsHappening: 'Siente que perder borra todo el esfuerzo que hizo. En ese momento no puede separar "me fue mal en esta jugada" de "soy malo". La emoción tapa el aprendizaje. Lo primero es validar lo que siente antes de intentar explicar la jugada.',
        category: 'Emocional',
        icon: '😤',
    },
    {
        id: 'no-hace-lo-que-pido',
        title: 'No hace lo que le pido',
        whatYouSee: 'Das una instrucción y el jugador hace otra cosa, se demora mucho en arrancar, o parece que no escuchó.',
        whatsHappening: 'No te está ignorando. Cada niño procesa las instrucciones a su propio ritmo. Algunos actúan antes de terminar de escuchar, otros necesitan más tiempo para entender la lógica de lo que les pediste. Es una diferencia de velocidad de procesamiento, no de actitud.',
        category: 'Comunicación',
        icon: '🗣️',
    },
    {
        id: 'raro-antes-del-partido',
        title: 'Está raro antes de un partido',
        whatYouSee: 'El jugador está más callado o más inquieto de lo normal antes de competir. Puede estar nervioso, ir al baño muchas veces, o al revés, estar hiperactivo y no parar de moverse.',
        whatsHappening: 'Siente que las expectativas son altas (las propias o las de afuera) y su cuerpo reacciona ante la incertidumbre de lo que va a pasar. Cada perfil lo muestra distinto: unos se cierran, otros se aceleran.',
        category: 'Presión',
        icon: '😰',
    },
    {
        id: 'mira-desde-afuera',
        title: 'Se queda mirando desde afuera',
        whatYouSee: 'El jugador no se suma al grupo. Se queda en el borde de la cancha observando, especialmente cuando es un ejercicio nuevo o un grupo que no conoce bien.',
        whatsHappening: 'Está haciendo un "escaneo" del terreno. Necesita entender cómo funciona la dinámica antes de meterse. No es timidez ni cobardía — es su forma de prepararse para participar con seguridad.',
        category: 'Social',
        icon: '👀',
    },
    {
        id: 'llora-o-se-enoja',
        title: 'Llora o se enoja en pleno entrenamiento',
        whatYouSee: 'El jugador se quiebra emocionalmente durante una actividad. Puede ser llanto, enojo, o ambos. A veces es después de una corrección, a veces parece "de la nada".',
        whatsHappening: 'Se le juntó todo: el cansancio, el ruido, las correcciones, la exigencia del ejercicio. Su sistema se saturó y la emoción se desbordó. No es un capricho — es que en ese momento la demanda superó lo que podía procesar.',
        category: 'Emocional',
        icon: '😢',
    },
    {
        id: 'roce-con-companero',
        title: 'Tiene un roce con un compañero',
        whatYouSee: 'Dos jugadores chocan durante un ejercicio. Puede ser una discusión, una queja, o simplemente que no logran trabajar juntos.',
        whatsHappening: 'Cada niño tiene un estilo natural de encarar las cosas. Cuando dos estilos muy distintos se encuentran sin mediación, se genera fricción. No es que uno tenga razón y el otro no — son ritmos y enfoques diferentes.',
        category: 'Social',
        icon: '⚡',
    },
    {
        id: 'se-castiga',
        title: 'Se castiga a sí mismo cuando falla',
        whatYouSee: 'Después de un error, el jugador se golpea la cabeza, se insulta, dice "soy un desastre" o se enoja consigo mismo de forma exagerada.',
        whatsHappening: 'Mide su valor personal en función de la perfección del movimiento. Cada error lo siente como una prueba de que "no sirve". La autoexigencia se le fue de las manos y entró en un circuito de castigo que no lo deja seguir jugando bien.',
        category: 'Emocional',
        icon: '💔',
    },
    {
        id: 'se-distrae',
        title: 'Se distrae todo el tiempo',
        whatYouSee: 'El jugador mira para otro lado, habla con el de al lado, juega con algo que no tiene nada que ver, o simplemente no está "presente" en el ejercicio.',
        whatsHappening: 'El entrenamiento no está sintonizando con su ritmo. Puede ser que el ejercicio sea demasiado lento para su motor (se aburre) o demasiado caótico para su estilo (se desconecta). La distracción es una señal de que algo del formato no le está llegando.',
        category: 'Concentración',
        icon: '🌀',
    },
    {
        id: 'quiere-dejar',
        title: 'Dice que quiere dejar el deporte',
        whatYouSee: 'El jugador dice que no quiere venir más, que no le gusta, o simplemente deja de aparecer.',
        whatsHappening: 'El esfuerzo emocional que le cuesta adaptarse al entorno deportivo se volvió más grande que lo que disfruta. No es que no le guste el deporte — es que algo del contexto lo está agotando más de lo que lo llena. El objetivo no es convencerlo de quedarse a toda costa, sino ajustar el entorno para ver si el disfrute puede volver.',
        category: 'Motivación',
        icon: '🚪',
    },
    {
        id: 'jugador-nuevo',
        title: 'Llega un jugador nuevo al grupo',
        whatYouSee: 'Se incorpora un jugador que no conoce a nadie. El grupo reacciona: algunos lo reciben bien, otros lo ignoran, otros se sienten incómodos con el cambio.',
        whatsHappening: 'La llegada de alguien nuevo altera el equilibrio que el grupo ya tenía. Los jugadores que valoran la estabilidad sienten que se rompió algo. Los que son más sociales probablemente lo reciban rápido. Cada perfil vive el cambio distinto.',
        category: 'Social',
        icon: '🆕',
    },
    {
        id: 'se-congela',
        title: 'Se congela en el partido',
        whatYouSee: 'Un jugador que en el entrenamiento rinde bien, en el partido parece otro: no corre, no pide la pelota, no reacciona. Como si se hubiera "apagado".',
        whatsHappening: 'La presión del partido activó un mecanismo de protección. Frente a la mirada del público o la importancia del momento, su cuerpo elige "no hacer nada" para evitar equivocarse. No es que no quiera — es que se bloqueó.',
        category: 'Presión',
        icon: '🧊',
    },
    {
        id: 'no-quiere-ser-centro',
        title: 'No quiere ser el centro de atención',
        whatYouSee: 'Cuando toca liderar una actividad, hablar frente al grupo, o hacer una demostración solo, el jugador se niega, se esconde o se pone muy incómodo.',
        whatsHappening: 'Su forma natural de participar es desde un lugar más reservado. Obligarlo a ser el centro de atención es como pedirle a un zurdo que escriba con la derecha: puede hacerlo, pero lo pasa mal. Hay formas de liderazgo que no requieren estar en el centro.',
        category: 'Social',
        icon: '🙈',
    },
    {
        id: 'cambio-repentino',
        title: 'Cambió de un día para el otro',
        whatYouSee: 'Un jugador que siempre fue de una manera de repente está distinto: callado, agresivo, o desconectado. Y no vuelve a su estado normal.',
        whatsHappening: 'Algo fuera de la cancha lo está afectando: puede ser la escuela, la casa, una situación familiar, un problema con amigos. El cambio de comportamiento sostenido es una señal de que algo externo está drenando su energía emocional.',
        category: 'Observación',
        icon: '🔄',
    },
    {
        id: 'derrota-grupal',
        title: 'El equipo perdió y nadie quiere saber nada',
        whatYouSee: 'Después de una derrota, el grupo entero está desanimado. Nadie habla, o todos se culpan entre sí. El clima se pone pesado.',
        whatsHappening: 'El equipo como grupo dejó de ver el proceso y se quedó pegado en el resultado. La derrota se siente colectiva y eso pesa más que cuando pierde un solo jugador. El grupo necesita volver a conectar con lo que los une más allá del marcador.',
        category: 'Grupal',
        icon: '📉',
    },
];

/* ── The 57 cards ──────────────────────────────────────────────────────────── */

export const SITUATION_CARDS: SituationCard[] = [
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 1. No quiere arrancar
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'no-quiere-arrancar',
        eje: 'D',
        whatsHappeningForProfile: 'El Impulsor necesita sentir que lo que viene vale la pena. Si no ve un desafío claro, la transición le cuesta más. Su motor lo empuja a la acción, pero solo cuando el objetivo lo motiva.',
        howToAccompany: [
            'Proponele un mini-desafío personal para los primeros 5 minutos: "A ver si hoy arrancas más rápido que la última vez".',
            'Dale un rol activo desde el inicio: que arme los conos, que elija el primer ejercicio, que lidere el calentamiento.',
        ],
        ifNotResponding: 'Dejalo mirar los primeros minutos sin presionarlo. Cuando vea al grupo en acción, su instinto competitivo se activa solo.',
    },
    {
        situationId: 'no-quiere-arrancar',
        eje: 'I',
        whatsHappeningForProfile: 'El Conector necesita conexión social para activarse. Si llegó solo, si su amigo no vino, o si el clima del grupo está raro, le cuesta engancharse. Su energía se enciende con las personas, no con la actividad en sí.',
        howToAccompany: [
            'Acercate y preguntale algo personal: "¿Cómo estuvo el día?". Esa micro-conexión es su interruptor de encendido.',
            'Ponelo al lado de alguien con quien tenga afinidad para el primer ejercicio.',
        ],
        ifNotResponding: 'Sumalo a una actividad grupal divertida (no técnica). Un juego de calentamiento donde se ría suele ser suficiente para que entre.',
    },
    {
        situationId: 'no-quiere-arrancar',
        eje: 'S',
        whatsHappeningForProfile: 'El Sostén necesita que todo esté "en su lugar" para sentirse seguro. Si el entrenamiento cambió de horario, si hay gente nueva, o si algo en su rutina se alteró, la transición se hace más pesada. Su motor más lento hace que el cambio de chip le tome más tiempo.',
        howToAccompany: [
            'Mantenelo en la rutina: que haga el mismo calentamiento de siempre, en el mismo lugar, con los mismos compañeros.',
            'No le pidas que explique por qué no quiere. Simplemente dale un par de minutos y decile: "Arrancamos cuando estés listo".',
        ],
        ifNotResponding: 'Dale una tarea pequeña y predecible ("Haceme 10 toques de pelota acá al lado") para que entre en el ritmo sin saltar al grupo directamente.',
    },
    {
        situationId: 'no-quiere-arrancar',
        eje: 'C',
        whatsHappeningForProfile: 'El Estratega necesita entender qué va a pasar antes de comprometerse. Si no sabe qué se va a entrenar, o si el plan cambió sin explicación, prefiere quedarse afuera procesando. Su motor de procesamiento necesita cerrar la lógica antes de arrancar.',
        howToAccompany: [
            'Contale brevemente qué van a hacer hoy: "Primero calentamiento, después un ejercicio táctico, y terminamos con partido". La previsibilidad lo activa.',
            'Si cambió algo del plan habitual, explicale por qué: "Hoy vamos a hacer algo diferente porque necesitamos practicar X".',
        ],
        ifNotResponding: 'Dejalo que observe la primera actividad desde afuera. Cuando entienda la lógica del ejercicio, se va a sumar solo.',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 2. Se frustra mucho cuando pierde
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'se-frustra-cuando-pierde',
        eje: 'D',
        whatsHappeningForProfile: 'Para el Impulsor, perder es personal. Siente que el resultado define su valor. Su energía de liderazgo se vuelve contra sí mismo o contra los demás cuando el marcador no lo acompaña.',
        howToAccompany: [
            'Primero valida: "Entiendo que estás enojado, es normal cuando das todo". No minimices lo que siente.',
            'Después redirigí la energía competitiva: "¿Qué harías diferente si pudieras repetir esa jugada?". Eso lo saca del resultado y lo lleva al proceso.',
        ],
        ifNotResponding: 'Dale un momento a solas. El Impulsor necesita procesar la frustración en privado antes de poder escuchar cualquier consejo.',
    },
    {
        situationId: 'se-frustra-cuando-pierde',
        eje: 'I',
        whatsHappeningForProfile: 'El Conector siente la derrota como un quiebre social: "le fallé al grupo", "no fui suficiente para el equipo". Su frustración viene más del impacto en los demás que del resultado en sí.',
        howToAccompany: [
            'Valida la emoción desde lo vincular: "Se nota que te importa mucho el equipo, eso habla bien de vos".',
            'Separalo del "yo le fallé al grupo" con datos: "Mirá todo lo que el equipo logró hoy, y vos fuiste parte de eso".',
        ],
        ifNotResponding: 'Pedile a un compañero de confianza que le hable. El Conector se recupera más rápido con el apoyo de un par que con la palabra del adulto.',
    },
    {
        situationId: 'se-frustra-cuando-pierde',
        eje: 'S',
        whatsHappeningForProfile: 'El Sostén no explota con la derrota, pero la guarda. Se queda callado, se retrae, y puede arrastrar la frustración por varios días. Su estabilidad natural lo hace parecer "bien" por fuera, pero por dentro le cuesta soltar.',
        howToAccompany: [
            'Valida sin forzar: "Si necesitas hablar, acá estoy". No le pidas que procese en el momento.',
            'En los entrenamientos siguientes, observa si está más callado de lo habitual. Si lo ves diferente, un "¿cómo venís?" sin presión suele abrir la puerta.',
        ],
        ifNotResponding: 'Mantenele la rutina y la normalidad. El Sostén se recupera cuando siente que todo sigue igual alrededor, a pesar del resultado.',
    },
    {
        situationId: 'se-frustra-cuando-pierde',
        eje: 'C',
        whatsHappeningForProfile: 'El Estratega analiza la derrota en loop: repasa cada error, cada jugada, buscando el momento exacto donde todo salió mal. Su frustración es más cerebral que emocional, pero igual lo paraliza.',
        howToAccompany: [
            'Valida su análisis: "Está bien que pienses en lo que pasó, eso te va a hacer mejorar". Después ponele límite al loop: "Elijamos una sola cosa para trabajar la próxima".',
            'Ofrecele datos concretos: "Mirá, en 10 jugadas acertaste 7. El balance es positivo". Los números lo sacan del circuito emocional.',
        ],
        ifNotResponding: 'Proponele que escriba o dibuje lo que sintió. El Estratega procesa mejor cuando puede ordenar sus pensamientos fuera de su cabeza.',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 3. No hace lo que le pido
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'no-hace-lo-que-pido',
        eje: 'D',
        whatsHappeningForProfile: 'El Impulsor escuchó la instrucción, pero ya decidió cómo hacerla a su manera. No es desobediencia — es que su motor rápido lo lanza a la acción antes de que termines de hablar, y confía en su instinto.',
        howToAccompany: [
            'Dile la instrucción corta y directa, en una frase. "Pase al pivote, tiro al arco." Menos palabras, más acción.',
            'Si hizo algo diferente pero funcionó, reconocelo: "Buena decisión. Ahora probemos también de esta otra forma".',
        ],
        ifNotResponding: 'Dale el "por qué" competitivo: "Si practicas esto, vas a tener una herramienta más para ganar". El Impulsor hace lo que entiende que lo hace mejor.',
    },
    {
        situationId: 'no-hace-lo-que-pido',
        eje: 'I',
        whatsHappeningForProfile: 'El Conector probablemente estaba hablando con alguien cuando diste la instrucción, o se enganchó con la dinámica social y perdió el foco. No es falta de respeto — es que su atención va primero a las personas y después a la tarea.',
        howToAccompany: [
            'Asegurate de tener su atención antes de dar la instrucción: contacto visual, nombre, y después la consigna.',
            'Dale la instrucción en clave social: "Vos y tu compañero van a hacer esto juntos" funciona mejor que una orden individual.',
        ],
        ifNotResponding: 'Pedile que le explique la consigna a otro compañero. Al traducirla, la procesa y la ejecuta.',
    },
    {
        situationId: 'no-hace-lo-que-pido',
        eje: 'S',
        whatsHappeningForProfile: 'El Sostén escuchó todo, pero si la instrucción fue compleja o nueva, su motor de procesamiento necesita más tiempo para cerrar la lógica antes de arrancar. No es lentitud — es que quiere hacerlo bien.',
        howToAccompany: [
            'Dile la instrucción paso a paso: "Primero hacemos esto... bien, ahora esto otro". No todo junto.',
            'Dale unos segundos después de la consigna antes de esperar que arranque. Ese silencio es su tiempo de procesamiento.',
        ],
        ifNotResponding: 'Hacé una demostración rápida del ejercicio. El Sostén procesa mucho mejor viendo que escuchando.',
    },
    {
        situationId: 'no-hace-lo-que-pido',
        eje: 'C',
        whatsHappeningForProfile: 'El Estratega está procesando la instrucción a fondo. Si le dijiste algo que no tiene lógica para él, o que contradice lo que hicieron antes, se frena. Su motor necesita cerrar la lógica de la primera instrucción antes de poder arrancar la segunda.',
        howToAccompany: [
            'Explica el "para qué" del ejercicio: "Hacemos esto porque trabaja la reacción lateral". Con el propósito claro, ejecuta.',
            'Si pregunta "por qué", no lo tomes como cuestionamiento. Es su forma de comprometerse: entender primero, actuar después.',
        ],
        ifNotResponding: 'Dile: "Probalo una vez y después me decís qué te parece". Al Estratega lo desbloquea la experiencia directa más que la explicación verbal.',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 4. Está raro antes de un partido
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'raro-antes-del-partido',
        eje: 'D',
        whatsHappeningForProfile: 'El Impulsor muestra los nervios con hiperactividad: habla más de la cuenta, se mueve mucho, o al revés, se pone irritable y callado. La incertidumbre le molesta porque quiere controlar el resultado y no puede.',
        howToAccompany: [
            'Dale una tarea concreta que lo haga sentir en control: "Calentá con pelota, hacé 20 tiros". La acción física canaliza la ansiedad.',
            'Hablale en clave de plan: "Hoy tu rol es X. Si pasa Y, hacés Z". La claridad del plan lo calma.',
        ],
        ifNotResponding: 'Dejalo calentar solo con música o en un espacio aparte. El Impulsor procesa la presión moviéndose, no hablando.',
    },
    {
        situationId: 'raro-antes-del-partido',
        eje: 'I',
        whatsHappeningForProfile: 'El Conector busca contención social: habla con todos, hace chistes, o se pega a su persona de confianza. Los nervios los procesa a través del vínculo. Si está callado, algo le pesa más de lo normal.',
        howToAccompany: [
            'Generá un momento grupal de conexión: una ronda de manos, un grito de equipo, un "¿cómo venimos?". Eso lo centra.',
            'Si está más callado de lo normal, acercate sin presionar: "¿Todo bien?" y un gesto de apoyo (palmada, choque de puños).',
        ],
        ifNotResponding: 'Pedile que anime al grupo. Darle un rol social ("Vos encargarte de que todos estén arriba") transforma su ansiedad en energía positiva.',
    },
    {
        situationId: 'raro-antes-del-partido',
        eje: 'S',
        whatsHappeningForProfile: 'El Sostén se cierra. Está más callado, más pegado a la rutina, hace exactamente lo mismo que siempre como para sentir que algo no cambió. La incertidumbre del partido le pega en su base de seguridad.',
        howToAccompany: [
            'Mantenele la rutina pre-partido lo más igual posible: mismo calentamiento, mismo lugar, mismos compañeros cerca.',
            'Dile algo que le dé seguridad: "Hoy jugamos como en el entrenamiento, nada raro, lo mismo que ya sabemos hacer".',
        ],
        ifNotResponding: 'No lo fuerces a "estar animado". El Sostén compite bien desde la calma. Dejalo que entre a la cancha a su ritmo.',
    },
    {
        situationId: 'raro-antes-del-partido',
        eje: 'C',
        whatsHappeningForProfile: 'El Estratega está pensando en todos los escenarios posibles: "¿Y si me toca marcar al más grande?", "¿Qué pasa si erramos en la salida?". Su mente analítica se convierte en una máquina de preocupaciones cuando no tiene datos suficientes.',
        howToAccompany: [
            'Dale información concreta: el rival, el plan de juego, su rol específico. Los datos reemplazan la incertidumbre.',
            'Preguntale: "¿Tenés alguna duda sobre lo que vamos a hacer?". Que pueda vaciar las preguntas lo alivia.',
        ],
        ifNotResponding: 'Dile: "Pensaste mucho y eso está bien. Ahora confiá en lo que ya preparaste y jugá". El permiso para soltar el análisis lo libera.',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 5. Se queda mirando desde afuera
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'mira-desde-afuera',
        eje: 'D',
        whatsHappeningForProfile: 'Raro en un Impulsor, pero cuando pasa, es porque no se siente seguro de poder dominar la situación. Si el ejercicio o el grupo son nuevos, prefiere esperar hasta tener claro cómo puede destacarse.',
        howToAccompany: [
            'Dale un rol desde el borde: "Mirá y decime qué harías diferente". Eso lo mantiene activo mientras observa.',
            'Proponele un desafío de entrada: "¿Te animás a probarlo? Si no te convence, volvés". La puerta de salida lo anima a entrar.',
        ],
        ifNotResponding: 'Dejalo mirar una ronda completa y después preguntale directamente: "¿Listo?". El Impulsor responde bien a la invitación directa.',
    },
    {
        situationId: 'mira-desde-afuera',
        eje: 'I',
        whatsHappeningForProfile: 'El Conector observa desde afuera cuando no conoce a nadie o cuando siente que el clima social no es seguro. Necesita identificar a "su persona" dentro del grupo antes de entrar.',
        howToAccompany: [
            'Presentale a alguien: "Él es Mateo, está en tu misma posición. Entrenen juntos". Un aliado es su puerta de entrada.',
            'Incluilo en una actividad en dupla o grupo chico antes de mandarlo al grupo grande.',
        ],
        ifNotResponding: 'Dale un rol social desde afuera: "Ayudame a contar los puntos" o "Avisame cuando terminen". Eso lo conecta con el grupo sin forzar la exposición.',
    },
    {
        situationId: 'mira-desde-afuera',
        eje: 'S',
        whatsHappeningForProfile: 'Es el comportamiento más natural del Sostén ante lo nuevo. Está haciendo su lectura de seguridad: quién está, cómo se mueven, cuáles son las reglas. No está perdiendo el tiempo — se está preparando.',
        howToAccompany: [
            'No lo apures. Dale el tiempo de observación que necesita. Un "Cuando estés listo, sumáte" sin presión es lo que más funciona.',
            'Si podés, ponelo a hacer la misma actividad pero al costado, en paralelo, sin exposición grupal.',
        ],
        ifNotResponding: 'Dejalo mirar toda la sesión si es necesario. La próxima vez va a entrar más rápido. El Sostén construye seguridad acumulando experiencias positivas de observación.',
    },
    {
        situationId: 'mira-desde-afuera',
        eje: 'C',
        whatsHappeningForProfile: 'El Estratega está analizando las reglas del juego desde afuera. Quiere entender la lógica del ejercicio antes de ejecutarlo. No entra hasta que tiene claro el "cómo".',
        howToAccompany: [
            'Explicale el ejercicio brevemente mientras observa: "Mirá, la idea es que hagas esto cuando pasa aquello". Con la lógica clara, entra.',
            'Preguntale: "¿Querés que te lo explique?" — eso le da permiso para hacer las preguntas que tiene en la cabeza.',
        ],
        ifNotResponding: 'Dile: "Hacelo una vez de prueba, no cuenta". El Estratega se anima cuando sabe que el primer intento es sin evaluación.',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 6. Llora o se enoja en pleno entrenamiento
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'llora-o-se-enoja',
        eje: 'D',
        whatsHappeningForProfile: 'El Impulsor se enoja más que llora. La frustración le sale como bronca: tira cosas, grita, o se va. Siente que perdió el control de la situación y eso lo desborda.',
        howToAccompany: [
            'No lo enfrentes en caliente. Dejalo que se enfríe unos segundos y después acercate con tono neutro: "Cuando estés listo, hablamos".',
            'Cuando se calme, dale una vía de acción: "Ahora volvamos y hagamos bien ese ejercicio". Necesita sentir que puede recuperar el control.',
        ],
        ifNotResponding: 'Sacalo de la actividad brevemente ("Tomá agua, respirá") y dejá que vuelva solo. El Impulsor necesita sentir que la decisión de volver fue suya.',
    },
    {
        situationId: 'llora-o-se-enoja',
        eje: 'I',
        whatsHappeningForProfile: 'El Conector se quiebra cuando siente que la corrección rompió el vínculo. "¿Me está retando porque no le caigo bien?" El desborde es emocional y social a la vez.',
        howToAccompany: [
            'Primero repará el vínculo: "No estoy enojado, quiero ayudarte a mejorar". Eso baja la amenaza emocional.',
            'Después de calmarse, conectá desde el afecto: una palmada, un "¿estamos bien?" — para él es fundamental saber que la relación no se rompió.',
        ],
        ifNotResponding: 'Pedile a un compañero de confianza que lo acompañe un momento. El Conector se regula mejor con un par que con una figura de autoridad.',
    },
    {
        situationId: 'llora-o-se-enoja',
        eje: 'S',
        whatsHappeningForProfile: 'El Sostén no suele desbordarse, así que si llora, es que realmente se saturó. Probablemente acumuló cansancio, frustración o incomodidad durante un buen rato antes de explotar.',
        howToAccompany: [
            'Dale pausa sin obligarlo a explicar: "Sentáte acá un momento, no pasa nada". La ausencia de presión es lo que más lo ayuda.',
            'No le preguntes "¿qué te pasa?" en el momento. Esperá a que se calme y después, con tranquilidad: "¿Cómo te sentís ahora?".',
        ],
        ifNotResponding: 'Mantenelo cerca pero sin actividad. Que se quede sentado al lado tuyo viendo al grupo. La cercanía sin demanda es su forma de recuperarse.',
    },
    {
        situationId: 'llora-o-se-enoja',
        eje: 'C',
        whatsHappeningForProfile: 'El Estratega se frustra cuando siente que algo no tiene lógica o que la corrección fue injusta. Su desborde puede parecer "de la nada" pero viene de un acumulado de cosas que no le cerraron.',
        howToAccompany: [
            'Cuando se calme, dale una explicación clara de lo que pasó: "Te corregí porque quiero que hagas esto mejor, y la forma de hacerlo es esta". La lógica lo ordena.',
            'Preguntale qué lo frustró específicamente. Muchas veces el detonante no es lo obvio.',
        ],
        ifNotResponding: 'Dejalo solo con sus pensamientos unos minutos. El Estratega necesita ordenar internamente lo que pasó antes de poder hablar.',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 7. Tiene un roce con un compañero
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'roce-con-companero',
        eje: 'D',
        whatsHappeningForProfile: 'El Impulsor choca cuando siente que otro le está sacando protagonismo o frenando su ritmo. La fricción viene de la competencia por el espacio de decisión.',
        howToAccompany: [
            'Separa el conflicto de la persona: "Los dos quieren ganar y eso está bien. Ahora veamos cómo lo hacen juntos".',
            'Asignale un aspecto del ejercicio donde sea el que decide. Si tiene su territorio, baja la necesidad de pelear por el del otro.',
        ],
        ifNotResponding: 'Cambialos de dupla temporalmente. A veces la mejor mediación es la distancia breve.',
    },
    {
        situationId: 'roce-con-companero',
        eje: 'I',
        whatsHappeningForProfile: 'El Conector vive el roce como un quiebre en la relación. Le duele más que "ya no nos llevemos bien" que el conflicto en sí. Puede reaccionar buscando aliados o poniéndose dramático.',
        howToAccompany: [
            'Hablá con los dos juntos y enfocate en el vínculo: "Ustedes son compañeros, esto se resuelve hablando. ¿Qué pasó?".',
            'Después del ejercicio, dale un momento al Conector para cerrar: "¿Estamos bien con tu compañero?". Necesita saber que la relación sigue.',
        ],
        ifNotResponding: 'Dale un rol de puente: "Ayudame a que el grupo funcione bien". Convertir el conflicto en misión social lo saca de la herida personal.',
    },
    {
        situationId: 'roce-con-companero',
        eje: 'S',
        whatsHappeningForProfile: 'El Sostén evita el conflicto. Si tuvo un roce, probablemente está incomodísimo y quiere que todo vuelva a la normalidad lo antes posible. No va a confrontar — se va a cerrar.',
        howToAccompany: [
            'No lo obligues a "hablar las cosas" frente al grupo. Acercate en privado: "Vi que hubo algo ahí, ¿estás bien?".',
            'Ayudalo a volver a su zona de confort: la misma actividad, los mismos compañeros de siempre, rutina normal.',
        ],
        ifNotResponding: 'Dejá que el tiempo haga su trabajo. El Sostén no necesita "resolver" el conflicto verbalmente — necesita sentir que todo volvió a la normalidad.',
    },
    {
        situationId: 'roce-con-companero',
        eje: 'C',
        whatsHappeningForProfile: 'El Estratega choca cuando siente que el otro hace las cosas "mal" o sin lógica. La fricción viene de la diferencia de criterio: él quiere hacerlo bien y el otro quiere hacerlo rápido (o viceversa).',
        howToAccompany: [
            'Valida su perspectiva: "Tu forma de verlo tiene sentido". Después ampliá: "Y la de tu compañero también, porque viene de otro lugar".',
            'Proponele un acuerdo de método: "Primero probemos a tu manera, después a la de él, y vemos cuál funcionó mejor".',
        ],
        ifNotResponding: 'Dale una tarea individual breve. El Estratega procesa mejor los conflictos interpersonales cuando tiene un momento a solas para ordenar sus ideas.',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 8. Se castiga a sí mismo cuando falla
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'se-castiga',
        eje: 'D',
        whatsHappeningForProfile: 'El Impulsor se castiga desde la bronca: "¡Soy un desastre!". Siente que debería ser capaz de hacerlo bien siempre, y cada error es una traición a su autoimagen de líder.',
        howToAccompany: [
            'Interrumpí el circuito con acción: "Ok, erraste. Ahora hacé 3 repeticiones y listo". La acción inmediata reemplaza la autocrítica.',
            'Usá su competitividad a favor: "Los mejores jugadores fallan, la diferencia es qué hacen después".',
        ],
        ifNotResponding: 'Sacalo del ejercicio un momento y dale una tarea física simple (correr, picar la pelota). El Impulsor regula la frustración moviéndose.',
    },
    {
        situationId: 'se-castiga',
        eje: 'I',
        whatsHappeningForProfile: 'El Conector se castiga desde la vergüenza: "Todos me vieron fallar". Lo que le pesa no es el error técnico sino la exposición social del error.',
        howToAccompany: [
            'Normalizá el error frente al grupo: "Todos fallamos, así se aprende". Eso baja la vergüenza pública.',
            'Después, en privado: "A mí me importa que lo intentes, no que salga perfecto". La reconexión con el adulto lo calma.',
        ],
        ifNotResponding: 'Ponelo en una actividad donde el error sea parte del juego (un ejercicio donde todos fallan). Eso diluye la sensación de ser "el único".',
    },
    {
        situationId: 'se-castiga',
        eje: 'S',
        whatsHappeningForProfile: 'El Sostén se castiga en silencio. No grita ni se golpea, pero se queda callado, baja la cabeza, y pierde energía. Se siente culpable por no haber mantenido la consistencia que se espera de él.',
        howToAccompany: [
            'Acercate con calma: "Ese error no define cómo jugás. Mirá todo lo que venís haciendo bien". Necesita que alguien le devuelva la perspectiva.',
            'En el siguiente ejercicio, ponelo en algo que domine bien para que recupere la confianza antes de volver a lo que falló.',
        ],
        ifNotResponding: 'No le insistas en que "no es para tanto". Simplemente seguí con el entrenamiento con normalidad. El Sostén se recupera cuando siente que el entorno no cambió por su error.',
    },
    {
        situationId: 'se-castiga',
        eje: 'C',
        whatsHappeningForProfile: 'El Estratega se castiga desde el análisis: repasa el error una y otra vez buscando qué hizo mal. Se autoexige porque tiene estándares altos y siente que debería haber previsto el fallo.',
        howToAccompany: [
            'Dale datos que contrarresten el error: "Fallaste esta, pero las 5 anteriores las hiciste perfecto". Los números lo sacan del loop negativo.',
            'Proponele que el error sea un dato, no un juicio: "¿Qué información te da este error? ¿Qué ajustarías?".',
        ],
        ifNotResponding: 'Dile: "Suficiente análisis por hoy. Mañana lo miramos con la cabeza fría". A veces el Estratega necesita permiso para dejar de pensar.',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 9. Se distrae todo el tiempo
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'se-distrae',
        eje: 'D',
        whatsHappeningForProfile: 'El Impulsor se distrae cuando el ejercicio no tiene suficiente intensidad o desafío. Su motor rápido necesita acción constante y si el ritmo baja, busca estímulos por su cuenta.',
        howToAccompany: [
            'Subile la intensidad: "Ahora lo mismo pero en la mitad del tiempo" o "El que llega primero elige el próximo ejercicio".',
            'Dale responsabilidad dentro del ejercicio: que cuente, que arbitre, que lidere una variante.',
        ],
        ifNotResponding: 'Proponele un desafío paralelo: "Mientras esperás tu turno, hacé esto otro". El Impulsor no tolera el vacío de actividad.',
    },
    {
        situationId: 'se-distrae',
        eje: 'I',
        whatsHappeningForProfile: 'El Conector se distrae porque lo que más le atrae es la interacción social. Si el ejercicio es individual o silencioso, su atención se va hacia el compañero de al lado.',
        howToAccompany: [
            'Convertí el ejercicio en algo social: en duplas, con comunicación entre ellos, o con roles que requieran hablar.',
            'Usá su sociabilidad como herramienta: "Explícale a tu compañero cómo se hace este ejercicio".',
        ],
        ifNotResponding: 'Ponelo en un rol de ayudante tuyo: "Vení, ayudame a organizar esto". La cercanía social con el adulto recaptura su atención.',
    },
    {
        situationId: 'se-distrae',
        eje: 'S',
        whatsHappeningForProfile: 'El Sostén se distrae cuando hay demasiado estímulo: mucho ruido, cambios constantes de ejercicio, o instrucciones nuevas sin pausa. Su sistema se desconecta para protegerse del caos.',
        howToAccompany: [
            'Bajá el ritmo de cambios: dejá que haga el mismo ejercicio un rato más largo antes de cambiar.',
            'Dale un espacio predecible dentro de la actividad: "Vos siempre en esta posición, tu trabajo es este".',
        ],
        ifNotResponding: 'Acercate y reconectalo con calma: "¿Estás conmigo? Bien. Lo próximo que hacemos es esto". El contacto personal lo trae de vuelta.',
    },
    {
        situationId: 'se-distrae',
        eje: 'C',
        whatsHappeningForProfile: 'El Estratega se distrae cuando el ejercicio le parece repetitivo o sin propósito. Su mente busca algo para analizar, y si el ejercicio no se lo da, busca estímulos por otro lado.',
        howToAccompany: [
            'Dale una capa extra al ejercicio: "Mientras hacés esto, contá cuántas veces se repite el patrón" o "Fijáte qué compañero se mueve mejor y por qué".',
            'Explicale qué estás buscando con el ejercicio: "Esto parece simple pero estamos trabajando X". El propósito lo reconecta.',
        ],
        ifNotResponding: 'Proponele que invente una variante del ejercicio. El Estratega se concentra cuando puede diseñar.',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 10. Dice que quiere dejar el deporte
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'quiere-dejar',
        eje: 'D',
        whatsHappeningForProfile: 'El Impulsor quiere dejar cuando siente que no puede ganar, crecer o liderar. Si lleva mucho tiempo sin desafíos nuevos o sin sentir que progresa, el deporte pierde sentido para él.',
        howToAccompany: [
            'Preguntale qué cambiaría para que tenga ganas de volver: "Si pudieras cambiar algo del entrenamiento, ¿qué sería?". Escuchá la respuesta.',
            'Proponele un objetivo concreto y medible: "¿Y si en las próximas 3 semanas trabajamos en esto específico?".',
        ],
        ifNotResponding: 'No lo presiones. Dile: "La puerta está abierta cuando quieras". El Impulsor a veces necesita extrañar el desafío para volver con ganas.',
    },
    {
        situationId: 'quiere-dejar',
        eje: 'I',
        whatsHappeningForProfile: 'El Conector quiere dejar cuando se rompieron los vínculos: si su amigo dejó, si el grupo cambió, o si siente que ya no pertenece. Para él, el deporte es el grupo, y si el grupo no lo sostiene, no tiene razón de ser.',
        howToAccompany: [
            'Explorá el vínculo: "¿Hay algo del grupo que te hace ruido?". Muchas veces el problema no es el deporte sino una relación social que se rompió.',
            'Si es posible, reconectalo con un compañero cercano o cambialo a un grupo donde tenga más afinidad.',
        ],
        ifNotResponding: 'Hablá con el adulto responsable. El abandono del Conector suele tener una raíz social que se puede resolver si se identifica a tiempo.',
    },
    {
        situationId: 'quiere-dejar',
        eje: 'S',
        whatsHappeningForProfile: 'El Sostén quiere dejar cuando algo cambió demasiado: nuevo entrenador, nuevos compañeros, un cambio de horario o de sede. No es que no le guste el deporte — es que el contexto ya no se siente como "su lugar".',
        howToAccompany: [
            'Identificá qué cambió: "¿Hay algo que antes te gustaba y ahora no?". El Sostén puede señalar exactamente el punto de quiebre.',
            'Si podés, restaurá algo del contexto anterior: el mismo horario, el mismo grupo, las mismas rutinas.',
        ],
        ifNotResponding: 'Dale tiempo. No le pidas una decisión definitiva. "No hace falta que decidas ahora. Vení la semana que viene y vemos". El Sostén necesita procesar los cambios lentamente.',
    },
    {
        situationId: 'quiere-dejar',
        eje: 'C',
        whatsHappeningForProfile: 'El Estratega quiere dejar cuando siente que no aprende nada nuevo o que el entrenamiento no tiene sentido. Si lleva semanas haciendo lo mismo sin entender para qué, su motivación se apaga.',
        howToAccompany: [
            'Mostrále el progreso que hizo: "Mirá dónde estabas hace 3 meses y dónde estás ahora". Los datos de evolución lo reconectan con el proceso.',
            'Preguntale qué le gustaría aprender: "¿Hay algo que te gustaría practicar?". Darle voz en el plan lo re-engancha.',
        ],
        ifNotResponding: 'Proponele un desafío intelectual dentro del deporte: analizar un video, planificar una jugada, observar un partido profesional. A veces el Estratega necesita conectar con el deporte desde la cabeza, no solo desde el cuerpo.',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 11. Llega un jugador nuevo al grupo
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'jugador-nuevo',
        eje: 'D',
        whatsHappeningForProfile: 'El Impulsor ve al nuevo como una variable a evaluar: "¿Es bueno? ¿Me va a sacar el lugar?". Puede reaccionar compitiendo para marcar territorio o ignorándolo.',
        howToAccompany: [
            'Dale un rol de bienvenida con liderazgo: "Mostrale cómo hacemos el calentamiento". Eso lo pone en posición de líder, no de competidor.',
            'Armá un ejercicio donde los dos se luzcan: "Uno ataca, otro defiende, después cambian".',
        ],
        ifNotResponding: 'Dejá que la competencia natural haga su trabajo. El Impulsor va a aceptar al nuevo cuando vea que eleva el nivel del grupo.',
    },
    {
        situationId: 'jugador-nuevo',
        eje: 'I',
        whatsHappeningForProfile: 'El Conector probablemente va a ser el primero en acercarse al nuevo. Si no lo hace, es porque algo del nuevo lo intimida o porque siente que su lugar social en el grupo está amenazado.',
        howToAccompany: [
            'Pedile que sea el "anfitrión": "Acompañalo hoy, explicale cómo funciona todo acá". Es su rol natural y lo empodera.',
            'Si el Conector se muestra reticente, hablá en privado: "¿Todo bien con la llegada de X?". Puede haber una inseguridad social que vale la pena explorar.',
        ],
        ifNotResponding: 'Armá una actividad donde tengan que cooperar obligatoriamente. La conexión del Conector se activa haciendo cosas juntos.',
    },
    {
        situationId: 'jugador-nuevo',
        eje: 'S',
        whatsHappeningForProfile: 'El Sostén es el que más siente la "ruptura" del equilibrio. Su grupo era predecible y seguro, y ahora hay alguien que cambia la dinámica. Puede mostrarse distante o incómodo.',
        howToAccompany: [
            'No cambies la rutina por la llegada del nuevo. Mantenele al Sostén todo lo que puedas igual: mismo lugar, mismo ejercicio, mismos compañeros.',
            'Presentá al nuevo como una "suma" y no como un "cambio": "Se suma alguien al grupo, todo lo demás sigue igual".',
        ],
        ifNotResponding: 'Dale tiempo. El Sostén va a aceptar al nuevo gradualmente, a medida que el nuevo se vuelva parte de la rutina. No fuerces la integración.',
    },
    {
        situationId: 'jugador-nuevo',
        eje: 'C',
        whatsHappeningForProfile: 'El Estratega observa al nuevo con curiosidad analítica: "¿Cómo juega? ¿Dónde se va a ubicar? ¿Cómo afecta al equipo?". No se acerca enseguida porque está procesando la información.',
        howToAccompany: [
            'Dale información sobre el nuevo: "Viene de tal club, juega en tal posición". Los datos lo tranquilizan y le permiten ubicar al nuevo en su mapa mental.',
            'Proponele que lo ayude tácticamente: "Explicále cómo hacemos esta jugada". Eso lo conecta desde su fortaleza.',
        ],
        ifNotResponding: 'Dejá que la integración sea orgánica. El Estratega va a acercarse al nuevo cuando tenga suficiente información. No lo apures.',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 12. Se congela en el partido
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'se-congela',
        eje: 'D',
        whatsHappeningForProfile: 'Raro en un Impulsor, pero cuando se congela es porque la presión lo abrumó más de lo que puede manejar. Siente que si se equivoca frente a todos, pierde su estatus.',
        howToAccompany: [
            'Dile una instrucción concreta y simple: "La próxima pelota, tirá al arco". Una sola acción clara lo desbloquea.',
            'Desde afuera, dale confianza en su capacidad: "Vos sabés hacer esto, confío en vos". El Impulsor reacciona al voto de confianza.',
        ],
        ifNotResponding: 'Cambiale el rol temporalmente a algo menos expuesto. Cuando haga una buena jugada desde ahí, devolvelo a su posición. Necesita una victoria chica para reactivarse.',
    },
    {
        situationId: 'se-congela',
        eje: 'I',
        whatsHappeningForProfile: 'El Conector se congela cuando siente que el error lo va a dejar "en evidencia" frente al grupo. Su bloqueo es social: tiene miedo de quedar mal ante los compañeros, no del error en sí.',
        howToAccompany: [
            'Quitale la presión del resultado: "No importa si sale o no, quiero que lo intentes". El permiso para fallar lo desbloquea.',
            'Involucra a los compañeros: "Equipo, todos adentro, todos juntos". Sentirse acompañado le devuelve la seguridad.',
        ],
        ifNotResponding: 'Ponelo en una jugada grupal donde el éxito sea del equipo, no individual. El Conector se reactiva cuando la responsabilidad es compartida.',
    },
    {
        situationId: 'se-congela',
        eje: 'S',
        whatsHappeningForProfile: 'El Sostén se congela porque la presión del partido rompe su base de seguridad. Lo que en el entrenamiento era predecible, en el partido es incierto. Su sistema se protege quedándose quieto.',
        howToAccompany: [
            'Bajá la presión con información: "Hacé lo mismo que en el entrenamiento, nada diferente". Conectarlo con lo conocido lo desbloquea.',
            'Dale una instrucción repetitiva: "Cada vez que la pelota venga, pasala a X". La tarea simple y predecible lo activa.',
        ],
        ifNotResponding: 'Sacalo unos minutos si es posible. Decile: "Respirá, mirá cómo va el juego, y cuando estés listo volvés". El Sostén se recupera con la pausa.',
    },
    {
        situationId: 'se-congela',
        eje: 'C',
        whatsHappeningForProfile: 'El Estratega se congela porque está sobreanalizando: "¿Paso o tiro? ¿Y si viene el rival? ¿Cuál es la mejor opción?". Su mente trabaja más rápido que su cuerpo, y el cuerpo se traba.',
        howToAccompany: [
            'Simplificá su toma de decisión: "Si estás libre, tirá. Si no, pasá". Reducir las opciones lo desbloquea.',
            'Antes del próximo partido, ensayá las decisiones: "Cuando pase esto, hacés aquello". La automatización previa libera la mente durante el juego.',
        ],
        ifNotResponding: 'Dile: "No pienses, jugá". A veces el Estratega necesita permiso explícito para apagar el análisis y confiar en el instinto.',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 13. No quiere ser el centro de atención
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'no-quiere-ser-centro',
        eje: 'D',
        whatsHappeningForProfile: 'Muy raro en un Impulsor. Si pasa, probablemente se siente inseguro sobre esa actividad específica. No quiere exponerse donde no se siente fuerte.',
        howToAccompany: [
            'Ofrecele liderar algo donde se sienta seguro: "¿Querés mostrar el ejercicio que mejor te sale?". El Impulsor se expone cuando sabe que va a brillar.',
            'Hacelo de a poco: "Hoy lo hacés con un compañero, la próxima lo hacés solo".',
        ],
        ifNotResponding: 'No lo fuerces. Decile: "Cuando estés listo, la oportunidad está". El Impulsor vuelve solo cuando se siente preparado.',
    },
    {
        situationId: 'no-quiere-ser-centro',
        eje: 'I',
        whatsHappeningForProfile: 'El Conector puede disfrutar la atención social pero no la atención evaluativa. Si siente que lo están "examinando" en vez de "acompañando", se retrae.',
        howToAccompany: [
            'Convertí la exposición en algo social: "Hacelo con tu compañero" o "Explicáselo al grupo mientras lo hacés".',
            'Quitale la carga evaluativa: "No es para ver quién lo hace mejor, es para que todos aprendamos".',
        ],
        ifNotResponding: 'Dejalo participar desde un rol social: que elija quién pasa, que comente la jugada, que anime. Es su forma de estar presente sin estar expuesto.',
    },
    {
        situationId: 'no-quiere-ser-centro',
        eje: 'S',
        whatsHappeningForProfile: 'Es natural en el Sostén. Su forma de aportar es desde el soporte, no desde el protagonismo. Forzarlo a ser el centro va en contra de su naturaleza y lo hace sentir vulnerable.',
        howToAccompany: [
            'Proponele formas de liderazgo silencioso: "Asegurate de que todos tengan lo que necesitan" o "Vos sos el que mantiene el ritmo".',
            'Si necesitás que se exponga, dale aviso previo: "La semana que viene te voy a pedir que muestres el ejercicio". La anticipación baja la ansiedad.',
        ],
        ifNotResponding: 'No insistas. Buscá otra forma de que participe donde se sienta cómodo. El Sostén aporta más desde su zona de seguridad que desde la exposición forzada.',
    },
    {
        situationId: 'no-quiere-ser-centro',
        eje: 'C',
        whatsHappeningForProfile: 'El Estratega no quiere exponerse si no está seguro de que lo va a hacer bien. Su estándar es alto y la idea de fallar en público le genera mucha incomodidad.',
        howToAccompany: [
            'Dale tiempo de preparación: "La semana que viene te pido que expliques esta jugada al grupo. Preparáte". Con tiempo, el Estratega se siente seguro.',
            'Ofrecele un formato que use su fortaleza: que analice una jugada en vez de demostrarla físicamente, que dibuje en una pizarra, que explique la lógica.',
        ],
        ifNotResponding: 'Proponele que lo haga por escrito o dibujado. El Estratega se expresa mejor cuando puede organizar sus ideas antes de compartirlas.',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 14. Cambió de un día para el otro
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'cambio-repentino',
        eje: 'D',
        whatsHappeningForProfile: 'Un Impulsor que se apaga probablemente perdió algo que lo hacía sentir poderoso: un rol, una relación, una seguridad fuera de la cancha. Su energía vital se está yendo en otra pelea.',
        howToAccompany: [
            'No le preguntes "¿qué te pasa?" de entrada. Primero observa unos días. Si persiste, acercate con algo concreto: "Te noto diferente, ¿puedo ayudar en algo?".',
            'Si no quiere hablar, dale un desafío físico que lo active: "Hoy necesito que lideres el calentamiento". A veces la acción le devuelve la energía que las palabras no pueden.',
        ],
        ifNotResponding: 'Hablá con el adulto responsable (padre, madre). El cambio persistente en un Impulsor suele ser señal de algo importante fuera de la cancha.',
    },
    {
        situationId: 'cambio-repentino',
        eje: 'I',
        whatsHappeningForProfile: 'Un Conector que se cierra es una señal fuerte. Su naturaleza es social, así que si está callado o aislado, algo le está doliendo en el plano vincular: una pelea con amigos, un cambio en la familia, o bullying.',
        howToAccompany: [
            'Acercate desde el vínculo: "Te conozco y sé que algo te pasa. No hace falta que me cuentes, pero quiero que sepas que estoy acá".',
            'Dale espacio para reconectarse a su ritmo. No lo fuerces a "estar contento" — eso invalida lo que siente.',
        ],
        ifNotResponding: 'Contactá al adulto responsable. El cambio sostenido en un Conector suele estar vinculado a una situación relacional que requiere atención fuera de la cancha.',
    },
    {
        situationId: 'cambio-repentino',
        eje: 'S',
        whatsHappeningForProfile: 'El Sostén que cambia repentinamente está mostrando que algo rompió su base de seguridad. Es el perfil que más "aguanta" antes de mostrar malestar, así que si ya lo ves, probablemente viene acumulando hace rato.',
        howToAccompany: [
            'Mantenele la rutina lo más estable posible. En medio de lo que sea que esté pasando afuera, el entrenamiento puede ser su refugio de normalidad.',
            'Acercate sin drama: "¿Cómo estás hoy?" de forma natural, como parte de la rutina. Si quiere hablar, va a hablar.',
        ],
        ifNotResponding: 'Contactá al adulto responsable con delicadeza: "Noté que viene diferente estas últimas semanas, ¿está todo bien en casa?". El Sostén rara vez pide ayuda — hay que ir a buscarla.',
    },
    {
        situationId: 'cambio-repentino',
        eje: 'C',
        whatsHappeningForProfile: 'Un Estratega que cambia de comportamiento puede estar procesando algo internamente que no logra resolver. Su mente analítica puede estar en loop con un problema que no tiene solución lógica (un problema familiar, una injusticia percibida).',
        howToAccompany: [
            'Ofrecele un espacio para ordenar lo que piensa: "¿Querés contarme qué está pasando por tu cabeza? A veces ayuda decirlo en voz alta".',
            'Si no quiere hablar, respetalo. Proponele algo que lo ayude a procesarlo a su manera: "Si querés, escribí lo que sentís y me lo mostrás cuando estés listo".',
        ],
        ifNotResponding: 'Contactá al adulto responsable. Los cambios sostenidos en el Estratega, especialmente si se vuelve irritable o agresivo, suelen indicar un problema que necesita contención profesional.',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 15. El equipo perdió y nadie quiere saber nada (GRUPAL)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'derrota-grupal',
        eje: 'group',
        whatsHappeningForProfile: 'Todo el grupo está procesando la derrota desde su propio perfil: los Impulsores están enojados, los Conectores sienten que fallaron como equipo, los Sostenes se cerraron, y los Estrategas están repasando cada error. El clima colectivo está bajo.',
        howToAccompany: [
            'No intentes hablar del partido inmediatamente después de perder. Dale al grupo unos minutos de silencio o de descompresión libre antes de reunirlos.',
            'Cuando los reúnas, empieza por lo que sí funcionó: "Hoy hicimos bien esto, esto y esto. Lo que no salió, lo trabajamos la semana que viene". Resultado al final, proceso al principio.',
            'Proponele al grupo un ritual de cierre: una ronda donde cada uno diga una cosa buena que vio en un compañero. Eso reconecta al equipo desde el vínculo, no desde el marcador.',
        ],
        ifNotResponding: 'No fuerces la positividad. A veces el grupo necesita estar triste un rato. Dile: "Hoy duele, y está bien que duela. Mañana arrancamos de nuevo". El permiso para sentir la derrota es el primer paso para superarla.',
    },
];

/* ── Helpers ────────────────────────────────────────────────────────────────── */

export function getCardsForSituation(situationId: string): SituationCard[] {
    return SITUATION_CARDS.filter(c => c.situationId === situationId);
}

export function getCardForSituationAndEje(situationId: string, eje: string): SituationCard | undefined {
    return SITUATION_CARDS.find(c => c.situationId === situationId && c.eje === eje);
}

export const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
    Motivación:    { bg: '#fef3c7', text: '#92400e' },
    Emocional:     { bg: '#fce7f3', text: '#9d174d' },
    Comunicación:  { bg: '#dbeafe', text: '#1e40af' },
    Presión:       { bg: '#fee2e2', text: '#991b1b' },
    Social:        { bg: '#d1fae5', text: '#065f46' },
    Concentración: { bg: '#e0e7ff', text: '#3730a3' },
    Observación:   { bg: '#fef9c3', text: '#854d0e' },
    Grupal:        { bg: '#f3e8ff', text: '#6b21a8' },
};
