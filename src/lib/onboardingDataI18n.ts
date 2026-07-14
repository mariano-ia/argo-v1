import type { Question, StorySlideData } from './onboardingData';
import type { Lang } from '../context/LangContext';

// ─── Adult Intro Slides (shown before registration) ─────────────────────────

const ADULT_INTRO_SLIDES_I18N: Record<Lang, StorySlideData[]> = {
    es: [
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
    ],

    en: [
        {
            id: 'adult_intro_1',
            title: 'Welcome to Argo',
            body: 'Argo is a sports self-discovery tool for kids ages 8 to 16. Through an interactive story, we explore tendencies in how the athlete is motivated, how they learn, and how they tend to react under pressure.',
        },
        {
            id: 'adult_intro_2',
            title: '12 decisions. One adventure.',
            body: 'The athlete navigates a story set in the world of the Argo (the legendary ship) and makes 12 decisions that let their behavioral tendencies show. There are no right or wrong answers. Only authentic choices.',
        },
        {
            id: 'adult_intro_3',
            title: 'The Report',
            body: 'When it\'s done, we send a personalized report to your email with the archetype that best describes the athlete\'s current tendencies, their motivation engine, communication keys, and concrete suggestions to support them in their activity.',
        },
    ],

    pt: [
        {
            id: 'adult_intro_1',
            title: 'Bem-vindo ao Argo',
            body: 'Argo é uma ferramenta de autoconhecimento esportivo para meninos e meninas de 8 a 16 anos. Através de uma história interativa, exploramos tendências em como o atleta se motiva, como aprende e como costuma reagir sob pressão.',
        },
        {
            id: 'adult_intro_2',
            title: '12 decisões. Uma aventura.',
            body: 'O atleta navega uma história ambientada no mundo do Argo (o navio lendário) e toma 12 decisões que deixam ver tendências de sua forma de decidir e se relacionar hoje. Não há respostas certas ou erradas. Apenas escolhas autênticas.',
        },
        {
            id: 'adult_intro_3',
            title: 'O Relatório',
            body: 'Ao finalizar, enviamos para o seu e-mail um relatório personalizado com o arquétipo que melhor descreve suas tendências atuais, seu motor de motivação, chaves de comunicação e sugestões concretas para acompanhá-lo na sua atividade.',
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
            intro: '¡Es hora de zarpar! ¿Qué te sale hacer?',
            options: [
                { label: 'Reviso las cuerdas y miro el mapa', axis: 'C' },
                { label: 'Salto a bordo y tomo mi remo', axis: 'D' },
                { label: 'Acomodo mis cosas con calma', axis: 'S' },
                { label: 'Busco a mis amigos para ir charlando', axis: 'I' },
            ],
        },
        {
            number: 2,
            title: 'El Nuevo Ritmo',
            intro: 'El capitán enseña una nueva forma de remar. ¿Cómo la aprendes?',
            options: [
                { label: 'Primero entiendo cómo funciona', axis: 'C' },
                { label: 'Me lanzo a probar enseguida', axis: 'D' },
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
                { label: 'Que el equipo cuente conmigo', axis: 'S' },
                { label: 'Charlar con los demás', axis: 'I' },
                { label: 'Sentir que llegamos más lejos', axis: 'D' },
            ],
        },
        {
            number: 4,
            title: 'La Encrucijada',
            intro: 'El mapa muestra dos caminos. ¿Qué haces?',
            options: [
                { label: 'Escucho qué opinan todos', axis: 'I' },
                { label: 'Miro bien el mapa y el viento', axis: 'C' },
                { label: 'Elijo el más directo', axis: 'D' },
                { label: 'Elijo el camino más seguro', axis: 'S' },
            ],
        },
        {
            number: 5,
            title: 'El Momento del Caos',
            intro: '¡La tormenta nos atrapa! ¿Qué te sale hacer?',
            options: [
                { label: 'Me muevo enseguida, sin dudar', axis: 'D' },
                { label: 'Sigo firme con mi tarea hasta que pase', axis: 'S' },
                { label: 'Pienso rápido qué hacer primero', axis: 'C' },
                { label: 'Les recuerdo que estamos todos juntos', axis: 'I' },
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
                { label: 'Busco qué parte se aflojó', axis: 'C' },
                { label: 'Lo vuelvo a armar enseguida', axis: 'D' },
                { label: 'Llamo a un compañero y lo armamos juntos', axis: 'I' },
            ],
        },
        {
            number: 8,
            title: 'El Empuje',
            intro: 'El equipo está cansado y cuesta seguir remando. ¿Qué te sale hacer?',
            options: [
                { label: 'Remo más fuerte para empujar el barco', axis: 'D' },
                { label: 'Busco cómo remar mejor para avanzar', axis: 'C' },
                { label: 'Remo tranquilo y firme para ayudarlos', axis: 'S' },
                { label: 'Suelto una broma para que volvamos con ganas', axis: 'I' },
            ],
        },
        {
            number: 9,
            title: 'La Espera',
            intro: 'El capitán dice que en esta parte reman otros. ¿Qué haces mientras esperas?',
            options: [
                { label: 'Miro cómo reman para mejorar mi remada', axis: 'C' },
                { label: 'Me activo para entrar con todo', axis: 'D' },
                { label: 'Me quedo listo para cuando me toque', axis: 'S' },
                { label: 'Animo fuerte a los que reman', axis: 'I' },
            ],
        },
        {
            number: 10,
            title: 'El Apoyo',
            intro: 'A un compañero se le cae el remo y se desanima. ¿Qué haces?',
            options: [
                { label: 'Le alcanzo el remo enseguida', axis: 'D' },
                { label: 'Le muestro cómo agarrarlo mejor', axis: 'C' },
                { label: 'Bajo el ritmo y remo a su lado', axis: 'S' },
                { label: 'Le choco los cinco y lo hago reír', axis: 'I' },
            ],
        },
        {
            number: 11,
            title: 'La Práctica Final',
            intro: 'Hay que repetir el mismo movimiento muchas veces. ¿Qué haces?',
            options: [
                { label: 'Mejoro algo pequeño cada vez', axis: 'C' },
                { label: 'La hago divertida con los demás', axis: 'I' },
                { label: 'Repito tranquilo hasta que salga sola', axis: 'S' },
                { label: 'Me pongo un reto de velocidad', axis: 'D' },
            ],
        },
        {
            number: 12,
            title: 'La Meta',
            intro: '¡Llegamos a la playa! ¿Qué piensas primero?',
            options: [
                { label: '¡Increíble aventura juntos!', axis: 'I' },
                { label: '¡Qué bien salió el plan!', axis: 'C' },
                { label: '¡Ayudé a que llegáramos todos a salvo!', axis: 'S' },
                { label: '¡Lo logramos! ¿Cuál es la próxima isla?', axis: 'D' },
            ],
        },
    ],

    en: [
        {
            number: 1,
            title: 'The Launch',
            intro: 'It\'s time to set sail! What do you feel like doing?',
            options: [
                { label: 'I check the ropes and look at the map', axis: 'C' },
                { label: 'I jump aboard and grab my oar', axis: 'D' },
                { label: 'I settle my things calmly', axis: 'S' },
                { label: 'I look for my friends to chat with', axis: 'I' },
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
                { label: 'That the team can count on me', axis: 'S' },
                { label: 'Chatting with the others', axis: 'I' },
                { label: 'Feeling like we\'re getting further', axis: 'D' },
            ],
        },
        {
            number: 4,
            title: 'The Crossroads',
            intro: 'The map shows two paths. What do you do?',
            options: [
                { label: 'I listen to what everyone thinks', axis: 'I' },
                { label: 'I look closely at the map and the wind', axis: 'C' },
                { label: 'I pick the most direct route', axis: 'D' },
                { label: 'I pick the safest path', axis: 'S' },
            ],
        },
        {
            number: 5,
            title: 'The Moment of Chaos',
            intro: 'The storm catches us! What do you feel like doing?',
            options: [
                { label: 'I move right away, no hesitation', axis: 'D' },
                { label: 'I keep steady at my task until it passes', axis: 'S' },
                { label: 'I think fast about what to do first', axis: 'C' },
                { label: 'I remind everyone we\'re all in this together', axis: 'I' },
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
                { label: 'I look for the part that came loose', axis: 'C' },
                { label: 'I tie it again right away', axis: 'D' },
                { label: 'I call a teammate and we tie it together', axis: 'I' },
            ],
        },
        {
            number: 8,
            title: 'The Push',
            intro: 'The crew is tired and it\'s getting hard to keep rowing. What do you feel like doing?',
            options: [
                { label: 'I row harder to push the boat', axis: 'D' },
                { label: 'I find a better way to row and move on', axis: 'C' },
                { label: 'I row calm and steady to help them', axis: 'S' },
                { label: 'I crack a joke so we get our spark back', axis: 'I' },
            ],
        },
        {
            number: 9,
            title: 'The Wait',
            intro: 'The captain says others row this stretch. What do you do while you wait?',
            options: [
                { label: 'I watch how they row to improve mine', axis: 'C' },
                { label: 'I get pumped to jump in full-on', axis: 'D' },
                { label: 'I stay ready for my turn', axis: 'S' },
                { label: 'I cheer hard for the ones rowing', axis: 'I' },
            ],
        },
        {
            number: 10,
            title: 'The Support',
            intro: 'A teammate drops their oar and gets discouraged. What do you do?',
            options: [
                { label: 'I hand them the oar right away', axis: 'D' },
                { label: 'I show them a better way to hold it', axis: 'C' },
                { label: 'I ease my pace and row beside them', axis: 'S' },
                { label: 'I high-five them and make them laugh', axis: 'I' },
            ],
        },
        {
            number: 11,
            title: 'The Final Practice',
            intro: 'We have to repeat the same move many times. What do you do?',
            options: [
                { label: 'I improve one small thing each time', axis: 'C' },
                { label: 'I turn it into a game with everyone', axis: 'I' },
                { label: 'I repeat calmly until it comes naturally', axis: 'S' },
                { label: 'I set myself a speed challenge', axis: 'D' },
            ],
        },
        {
            number: 12,
            title: 'The Finish',
            intro: 'We made it to the beach! What\'s your first thought?',
            options: [
                { label: 'What an incredible adventure together!', axis: 'I' },
                { label: 'The plan worked out great!', axis: 'C' },
                { label: 'I helped us all make it safe and sound!', axis: 'S' },
                { label: 'We did it! What\'s the next island?', axis: 'D' },
            ],
        },
    ],

    pt: [
        {
            number: 1,
            title: 'A Largada',
            intro: 'Hora de zarpar! O que você tem vontade de fazer?',
            options: [
                { label: 'Confiro as cordas e olho o mapa', axis: 'C' },
                { label: 'Pulo no barco e pego meu remo', axis: 'D' },
                { label: 'Arrumo minhas coisas com calma', axis: 'S' },
                { label: 'Procuro meus amigos pra ir conversando', axis: 'I' },
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
                { label: 'Que a equipe conte comigo', axis: 'S' },
                { label: 'Bater papo com os outros', axis: 'I' },
                { label: 'Sentir que chegamos mais longe', axis: 'D' },
            ],
        },
        {
            number: 4,
            title: 'A Encruzilhada',
            intro: 'O mapa mostra dois caminhos. O que você faz?',
            options: [
                { label: 'Escuto o que todo mundo acha', axis: 'I' },
                { label: 'Olho bem o mapa e o vento', axis: 'C' },
                { label: 'Escolho o mais direto', axis: 'D' },
                { label: 'Escolho o caminho mais seguro', axis: 'S' },
            ],
        },
        {
            number: 5,
            title: 'O Momento do Caos',
            intro: 'A tempestade nos pega! O que você tem vontade de fazer?',
            options: [
                { label: 'Me mexo na hora, sem hesitar', axis: 'D' },
                { label: 'Sigo firme na minha tarefa até passar', axis: 'S' },
                { label: 'Penso rápido no que fazer primeiro', axis: 'C' },
                { label: 'Lembro a todos que estamos juntos nessa', axis: 'I' },
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
                { label: 'Procuro que parte se soltou', axis: 'C' },
                { label: 'Refaço na hora', axis: 'D' },
                { label: 'Chamo um companheiro e a gente refaz junto', axis: 'I' },
            ],
        },
        {
            number: 8,
            title: 'O Empurrão',
            intro: 'A equipe está cansada e está difícil continuar remando. O que você tem vontade de fazer?',
            options: [
                { label: 'Remo com mais força pra empurrar o barco', axis: 'D' },
                { label: 'Procuro um jeito melhor de remar e avançar', axis: 'C' },
                { label: 'Remo tranquilo e firme pra ajudar', axis: 'S' },
                { label: 'Solto uma piada pra voltarmos com vontade', axis: 'I' },
            ],
        },
        {
            number: 9,
            title: 'A Espera',
            intro: 'O capitão diz que nesta parte remam outros. O que você faz enquanto espera?',
            options: [
                { label: 'Olho como remam pra melhorar a minha', axis: 'C' },
                { label: 'Fico ligado pra entrar com tudo', axis: 'D' },
                { label: 'Fico pronto pra quando for minha vez', axis: 'S' },
                { label: 'Animo forte quem está remando', axis: 'I' },
            ],
        },
        {
            number: 10,
            title: 'O Apoio',
            intro: 'Um companheiro deixa o remo cair e desanima. O que você faz?',
            options: [
                { label: 'Passo o remo pra ele na hora', axis: 'D' },
                { label: 'Mostro um jeito melhor de segurar', axis: 'C' },
                { label: 'Diminuo o ritmo e remo do lado dele', axis: 'S' },
                { label: 'Dou um toque nele e faço ele rir', axis: 'I' },
            ],
        },
        {
            number: 11,
            title: 'A Prática Final',
            intro: 'Temos que repetir o mesmo movimento várias vezes. O que você faz?',
            options: [
                { label: 'Melhoro uma coisinha cada vez', axis: 'C' },
                { label: 'Transformo num jogo com todo mundo', axis: 'I' },
                { label: 'Repito tranquilo até sair sozinho', axis: 'S' },
                { label: 'Crio um desafio de velocidade', axis: 'D' },
            ],
        },
        {
            number: 12,
            title: 'A Meta',
            intro: 'Chegamos na praia! Qual seu primeiro pensamento?',
            options: [
                { label: 'Que aventura incrível juntos!', axis: 'I' },
                { label: 'O plano deu super certo!', axis: 'C' },
                { label: 'Ajudei a gente a chegar bem!', axis: 'S' },
                { label: 'Conseguimos! Qual é a próxima ilha?', axis: 'D' },
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
