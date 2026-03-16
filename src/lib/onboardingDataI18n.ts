import type { Question, StorySlideData } from './onboardingData';
import type { Lang } from '../context/LangContext';

// ─── Adult Intro Slides (shown before registration) ─────────────────────────

const ADULT_INTRO_SLIDES_I18N: Record<Lang, StorySlideData[]> = {
    es: [
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
    ],

    en: [
        {
            id: 'adult_intro_1',
            title: 'Welcome to Argo',
            body: 'Argo is a sports self-discovery tool for kids ages 8 to 16. Through an interactive story, we identify how the athlete is motivated, how they learn, and how they react under pressure.',
        },
        {
            id: 'adult_intro_2',
            title: '12 decisions. One adventure.',
            body: 'The athlete navigates a story set in the world of the Argo — the legendary ship — and makes 12 decisions that, without knowing it, reveal their behavioral profile. There are no right or wrong answers. Only authentic choices.',
        },
        {
            id: 'adult_intro_3',
            title: 'The Attunement Report',
            body: 'When it\'s done, we send a personalized report to your email with the athlete\'s archetype, motivation engine, communication keys, and concrete training suggestions. All generated with artificial intelligence.',
        },
    ],

    pt: [
        {
            id: 'adult_intro_1',
            title: 'Bem-vindo ao Argo',
            body: 'Argo é uma ferramenta de autoconhecimento esportivo para meninos e meninas de 8 a 16 anos. Através de uma história interativa, identificamos como o atleta se motiva, como aprende e como reage sob pressão.',
        },
        {
            id: 'adult_intro_2',
            title: '12 decisões. Uma aventura.',
            body: 'O atleta navega uma história ambientada no mundo do Argo — o navio lendário — e toma 12 decisões que, sem saber, revelam seu perfil comportamental. Não há respostas certas ou erradas. Apenas escolhas autênticas.',
        },
        {
            id: 'adult_intro_3',
            title: 'O Relatório de Sintonia',
            body: 'Ao finalizar, enviamos para o seu e-mail um relatório personalizado com o arquétipo do atleta, seu motor de motivação, chaves de comunicação e sugestões concretas para o treinamento. Tudo gerado com inteligência artificial.',
        },
    ],
};

// ─── Story Slides ────────────────────────────────────────────────────────────

const STORY_SLIDES_I18N: Record<Lang, Record<string, StorySlideData>> = {
    es: {
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
    },

    en: {
        intro_a: {
            id: 'intro_a',
            title: 'The Mystery of the Argo',
            body: 'A long time ago, there was a legendary ship called the Argo. Its mission: to cross unknown seas in search of a lost treasure.',
        },
        intro_b: {
            id: 'intro_b',
            title: 'The Crew',
            body: 'Fifty very different companions formed the crew. Each one brought a unique talent: some brought strength, others rhythm, and others direction.',
        },
        intro_c: {
            id: 'intro_c',
            title: 'Your Place on the Ship',
            body: 'Today, the Argo sets sail once more and you\'re invited aboard. Your way of sailing is the missing piece.',
        },
        intro_0: {
            id: 'intro_0',
            title: 'All aboard!',
            body: 'The Argo is at the dock. Jason signals you from the bow: "All aboard!" Pick your oar and get ready for the adventure.',
        },
        slide_1: {
            id: 'slide_1',
            title: 'Open Sea',
            body: 'The port is just a line on the horizon. The Argo glides with power. The voyage is long and the sea holds secrets.',
        },
        slide_2: {
            id: 'slide_2',
            title: 'The Storm',
            body: 'The sky turns gray and waves leap into the ship. The wind roars. It\'s time to show what the crew is made of.',
        },
        slide_3: {
            id: 'slide_3',
            title: 'After the Storm',
            body: 'The storm drifts away. The crew is tired but the sun comes out again. The finish line is still far off.',
        },
        slide_4: {
            id: 'slide_4',
            title: 'The Horizon',
            body: 'In the distance, the island appears! Golden sand between the waves. The voyage is almost over.',
        },
    },

    pt: {
        intro_a: {
            id: 'intro_a',
            title: 'O Mistério do Argo',
            body: 'Há muito tempo existiu um navio lendário chamado Argo. Sua missão: cruzar mares desconhecidos para encontrar um tesouro perdido.',
        },
        intro_b: {
            id: 'intro_b',
            title: 'A Tripulação',
            body: 'Cinquenta companheiros muito diferentes formaram a tripulação. Cada um trouxe seu talento único: uns trouxeram a força, outros o ritmo e outros o rumo.',
        },
        intro_c: {
            id: 'intro_c',
            title: 'Seu Lugar no Navio',
            body: 'Hoje, o Argo volta a navegar e você está convidado a fazer parte. Seu jeito de navegar é a peça que falta.',
        },
        intro_0: {
            id: 'intro_0',
            title: 'A bordo!',
            body: 'O Argo está no cais. Jasão faz um sinal da proa: "A bordo!". Escolha seu remo e prepare-se para a aventura.',
        },
        slide_1: {
            id: 'slide_1',
            title: 'Mar Aberto',
            body: 'O porto já é só uma linha no horizonte. O Argo desliza com força. A viagem é longa e o mar guarda segredos.',
        },
        slide_2: {
            id: 'slide_2',
            title: 'A Tempestade',
            body: 'O céu fica cinza e as ondas saltam para dentro do navio. O vento ruge. É hora de mostrar do que a equipe é feita.',
        },
        slide_3: {
            id: 'slide_3',
            title: 'Depois da Tempestade',
            body: 'A tempestade se afasta. A equipe está cansada, mas o sol volta a brilhar. A meta ainda está longe.',
        },
        slide_4: {
            id: 'slide_4',
            title: 'O Horizonte',
            body: 'Lá longe aparece a ilha! Areia dourada entre as ondas. A viagem está quase no fim.',
        },
    },
};

// ─── Questions ───────────────────────────────────────────────────────────────

const QUESTIONS_I18N: Record<Lang, Question[]> = {
    es: [
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
                { label: 'Primero entiendo cómo funciona', axis: 'C' },
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
                { label: 'Me aseguro de que el camino sea seguro', axis: 'S' },
            ],
        },
        {
            number: 5,
            title: 'El Momento del Caos',
            intro: '¡La tormenta nos atrapa! ¿Qué haces?',
            options: [
                { label: 'Mantengo mi posición para que el barco no se mueva', axis: 'S' },
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
            title: 'El Nudo Rebelde',
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
    ],

    en: [
        {
            number: 1,
            title: 'The Launch',
            intro: 'It\'s time to set sail! What do you do first?',
            options: [
                { label: 'I check that everything is ready', axis: 'C' },
                { label: 'I jump on the ship right away!', axis: 'D' },
                { label: 'I settle in calmly', axis: 'S' },
                { label: 'I look for my friends', axis: 'I' },
            ],
        },
        {
            number: 2,
            title: 'The New Rhythm',
            intro: 'The captain teaches a new way to row. How do you learn it?',
            options: [
                { label: 'First I understand how it works', axis: 'C' },
                { label: 'I dive right in and try it', axis: 'D' },
                { label: 'Show me step by step', axis: 'S' },
                { label: 'We practice it all together', axis: 'I' },
            ],
        },
        {
            number: 3,
            title: 'What Drives the Voyage',
            intro: 'What makes you smile while we\'re sailing?',
            options: [
                { label: 'Learning new tricks', axis: 'C' },
                { label: 'Keeping a steady rhythm', axis: 'S' },
                { label: 'Chatting with the others', axis: 'I' },
                { label: 'Feeling like we\'re going fast', axis: 'D' },
            ],
        },
        {
            number: 4,
            title: 'The Crossroads',
            intro: 'The map shows two paths. How do you decide?',
            options: [
                { label: 'I listen to what everyone thinks', axis: 'I' },
                { label: 'I study the map and the wind', axis: 'C' },
                { label: 'I pick the most direct route', axis: 'D' },
                { label: 'I make sure the path is safe', axis: 'S' },
            ],
        },
        {
            number: 5,
            title: 'The Moment of Chaos',
            intro: 'The storm catches us! What do you do?',
            options: [
                { label: 'I hold my position so the ship stays steady', axis: 'S' },
                { label: 'I move fast to help out', axis: 'D' },
                { label: 'I think about what matters most', axis: 'C' },
                { label: 'I look for my teammates', axis: 'I' },
            ],
        },
        {
            number: 6,
            title: 'The Tilt',
            intro: 'A wave tips the ship. What do you do?',
            options: [
                { label: 'I shout "Let\'s go, team!"', axis: 'I' },
                { label: 'I grab whatever I can', axis: 'D' },
                { label: 'I look at what came loose', axis: 'C' },
                { label: 'I stay firm in my spot', axis: 'S' },
            ],
        },
        {
            number: 7,
            title: 'The Stubborn Knot',
            intro: 'Your knot came undone. What do you do first?',
            options: [
                { label: 'I take a breath and try again', axis: 'S' },
                { label: 'I figure out what went wrong', axis: 'C' },
                { label: 'I redo it with more force', axis: 'D' },
                { label: 'I ask a teammate for help', axis: 'I' },
            ],
        },
        {
            number: 8,
            title: 'The Push',
            intro: 'The crew is tired. How do you cheer them on?',
            options: [
                { label: 'I say something funny', axis: 'I' },
                { label: 'I remind them how far we\'ve come', axis: 'C' },
                { label: 'I keep rowing the same', axis: 'S' },
                { label: 'I row harder', axis: 'D' },
            ],
        },
        {
            number: 9,
            title: 'The Wait',
            intro: 'It\'s your turn to rest for a moment. What do you do?',
            options: [
                { label: 'I watch and learn', axis: 'C' },
                { label: 'I get ready to jump back in', axis: 'D' },
                { label: 'I recharge my energy', axis: 'S' },
                { label: 'I cheer the team on', axis: 'I' },
            ],
        },
        {
            number: 10,
            title: 'The Support',
            intro: 'A teammate drops their oar. What do you do?',
            options: [
                { label: 'I high-five them — we\'re all good!', axis: 'I' },
                { label: 'I teach them a trick', axis: 'C' },
                { label: 'I help them grab it back fast', axis: 'D' },
                { label: 'I stand by their side', axis: 'S' },
            ],
        },
        {
            number: 11,
            title: 'The Final Practice',
            intro: 'We have to repeat a maneuver many times. What helps you?',
            options: [
                { label: 'Getting better each time', axis: 'C' },
                { label: 'Turning it into a game with everyone', axis: 'I' },
                { label: 'It becoming easy and natural', axis: 'S' },
                { label: 'Setting myself a speed challenge', axis: 'D' },
            ],
        },
        {
            number: 12,
            title: 'The Finish',
            intro: 'We made it to the beach! What\'s your first thought?',
            options: [
                { label: 'What an incredible adventure together!', axis: 'I' },
                { label: 'The plan worked out great!', axis: 'C' },
                { label: 'We all made it safe and sound!', axis: 'S' },
                { label: 'What\'s the next island?', axis: 'D' },
            ],
        },
    ],

    pt: [
        {
            number: 1,
            title: 'A Largada',
            intro: 'Hora de zarpar! O que você faz primeiro?',
            options: [
                { label: 'Verifico se tudo está pronto', axis: 'C' },
                { label: 'Pulo no barco de uma vez!', axis: 'D' },
                { label: 'Me acomodo com calma', axis: 'S' },
                { label: 'Procuro meus amigos', axis: 'I' },
            ],
        },
        {
            number: 2,
            title: 'O Novo Ritmo',
            intro: 'O capitão ensina um jeito novo de remar. Como você aprende?',
            options: [
                { label: 'Primeiro entendo como funciona', axis: 'C' },
                { label: 'Já parto pra prática de uma vez', axis: 'D' },
                { label: 'Quero que mostrem passo a passo', axis: 'S' },
                { label: 'Praticamos todos juntos', axis: 'I' },
            ],
        },
        {
            number: 3,
            title: 'O Motor da Viagem',
            intro: 'O que faz você sorrir enquanto navegamos?',
            options: [
                { label: 'Aprender truques novos', axis: 'C' },
                { label: 'Manter um ritmo constante', axis: 'S' },
                { label: 'Bater papo com os outros', axis: 'I' },
                { label: 'Sentir que estamos indo rápido', axis: 'D' },
            ],
        },
        {
            number: 4,
            title: 'A Encruzilhada',
            intro: 'O mapa mostra dois caminhos. Como você decide?',
            options: [
                { label: 'Escuto o que todo mundo acha', axis: 'I' },
                { label: 'Analiso o mapa e o vento', axis: 'C' },
                { label: 'Escolho o mais direto', axis: 'D' },
                { label: 'Garanto que o caminho é seguro', axis: 'S' },
            ],
        },
        {
            number: 5,
            title: 'O Momento do Caos',
            intro: 'A tempestade nos pega! O que você faz?',
            options: [
                { label: 'Seguro firme pra manter o barco estável', axis: 'S' },
                { label: 'Me mexo rápido pra ajudar', axis: 'D' },
                { label: 'Penso no que é mais importante', axis: 'C' },
                { label: 'Procuro meus companheiros', axis: 'I' },
            ],
        },
        {
            number: 6,
            title: 'O Desequilíbrio',
            intro: 'Uma onda inclina o barco. O que você faz?',
            options: [
                { label: 'Grito "vamos, equipe!"', axis: 'I' },
                { label: 'Agarro o que puder', axis: 'D' },
                { label: 'Olho o que se soltou', axis: 'C' },
                { label: 'Fico firme no meu lugar', axis: 'S' },
            ],
        },
        {
            number: 7,
            title: 'O Nó Rebelde',
            intro: 'Seu nó se soltou. O que você faz primeiro?',
            options: [
                { label: 'Respiro e tento de novo', axis: 'S' },
                { label: 'Vejo o que deu errado', axis: 'C' },
                { label: 'Refaço com mais força', axis: 'D' },
                { label: 'Peço ajuda a um companheiro', axis: 'I' },
            ],
        },
        {
            number: 8,
            title: 'O Empurrão',
            intro: 'A equipe está cansada. Como você anima todo mundo?',
            options: [
                { label: 'Falo algo engraçado', axis: 'I' },
                { label: 'Lembro quanto falta', axis: 'C' },
                { label: 'Continuo remando igual', axis: 'S' },
                { label: 'Remo com mais força', axis: 'D' },
            ],
        },
        {
            number: 9,
            title: 'A Espera',
            intro: 'É sua vez de descansar um momento. O que você faz?',
            options: [
                { label: 'Observo e aprendo', axis: 'C' },
                { label: 'Me preparo pra agir', axis: 'D' },
                { label: 'Recupero energia', axis: 'S' },
                { label: 'Dou ânimo à equipe', axis: 'I' },
            ],
        },
        {
            number: 10,
            title: 'O Apoio',
            intro: 'Um companheiro deixa o remo cair. O que você faz?',
            options: [
                { label: 'Dou um toque nele — tá tudo bem!', axis: 'I' },
                { label: 'Ensino um truque', axis: 'C' },
                { label: 'Ajudo a pegar de volta rápido', axis: 'D' },
                { label: 'Fico do lado dele', axis: 'S' },
            ],
        },
        {
            number: 11,
            title: 'A Prática Final',
            intro: 'Temos que repetir uma manobra várias vezes. O que te ajuda?',
            options: [
                { label: 'Que cada vez saia melhor', axis: 'C' },
                { label: 'Transformar num jogo com todo mundo', axis: 'I' },
                { label: 'Que fique fácil e natural', axis: 'S' },
                { label: 'Criar um desafio de velocidade', axis: 'D' },
            ],
        },
        {
            number: 12,
            title: 'A Meta',
            intro: 'Chegamos na praia! Qual seu primeiro pensamento?',
            options: [
                { label: 'Que aventura incrível juntos!', axis: 'I' },
                { label: 'O plano deu super certo!', axis: 'C' },
                { label: 'Chegamos todos bem!', axis: 'S' },
                { label: 'Qual é a próxima ilha?', axis: 'D' },
            ],
        },
    ],
};

// ─── Accessor functions ──────────────────────────────────────────────────────

export function getAdultIntroSlides(lang: Lang): StorySlideData[] {
    return ADULT_INTRO_SLIDES_I18N[lang];
}

export function getStorySlides(lang: Lang): Record<string, StorySlideData> {
    return STORY_SLIDES_I18N[lang];
}

export function getQuestions(lang: Lang): Question[] {
    return QUESTIONS_I18N[lang];
}
