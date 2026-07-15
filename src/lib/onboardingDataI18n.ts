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
    ],

    en: [
        {
            number: 1,
            title: 'The Launch',
            intro: 'The ship is about to leave the harbor. What do you feel like doing?',
            options: [
                { label: 'I check that the ropes are tied tight before we go.', axis: 'C' },
                { label: 'I climb aboard fast so we can set off now.', axis: 'D' },
                { label: 'I settle in calmly, ready to help during the trip.', axis: 'S' },
                { label: 'I look for my friends so we can sit together.', axis: 'I' },
            ],
        },
        {
            number: 2,
            title: 'The New Rhythm',
            intro: 'The captain teaches you a new way to row. What do you do to learn it?',
            options: [
                { label: 'First I want to understand why it\'s done this way.', axis: 'C' },
                { label: 'I try it right away with my own arms.', axis: 'D' },
                { label: 'I repeat it step by step to row in time with the team.', axis: 'S' },
                { label: 'I practice it with my friends to have fun.', axis: 'I' },
            ],
        },
        {
            number: 3,
            title: 'What Drives the Voyage',
            intro: 'What makes you smile most when we\'re out on the water?',
            options: [
                { label: 'Learning tricks so my oar slips into the water without a splash.', axis: 'C' },
                { label: 'Rowing steady to help keep the boat from slowing down.', axis: 'S' },
                { label: 'Telling stories with the others while the boat moves along.', axis: 'I' },
                { label: 'Feeling us go faster and faster toward the island.', axis: 'D' },
            ],
        },
        {
            number: 4,
            title: 'The Crossroads',
            intro: 'The map shows two paths to reach the island. How do you like to choose?',
            options: [
                { label: 'I ask everyone which path they like best.', axis: 'I' },
                { label: 'I look closely at the map and the wind before choosing.', axis: 'C' },
                { label: 'I pick the shortest path to get there sooner.', axis: 'D' },
                { label: 'I\'d rather take the path we already know so we all stay at ease.', axis: 'S' },
            ],
        },
        {
            number: 5,
            title: 'The Storm',
            intro: 'The storm is coming. What do you do?',
            options: [
                { label: 'I get moving now, without waiting for it to hit.', axis: 'D' },
                { label: 'I look at the sky and check what\'s worth securing first.', axis: 'C' },
                { label: 'I gather the team so we\'re all together.', axis: 'I' },
                { label: 'I keep steady with my part so the boat doesn\'t slow down.', axis: 'S' },
            ],
        },
        {
            number: 6,
            title: 'The Tilt',
            intro: 'A wave tips the boat all at once and you almost fall. In that second... what do you do?',
            options: [
                { label: 'I shout "Let\'s go, team!" to lift everyone\'s spirits.', axis: 'I' },
                { label: 'I grab a rope to help steady the boat.', axis: 'D' },
                { label: 'I look for what came loose to tell the captain.', axis: 'C' },
                { label: 'I hold on to my teammates so no one falls.', axis: 'S' },
            ],
        },
        {
            number: 7,
            title: 'The Stubborn Knot',
            intro: 'You tied a knot to fasten the sail and it slipped loose. What do you do first?',
            options: [
                { label: 'I tie it again carefully so the team keeps sailing.', axis: 'S' },
                { label: 'I check the knot to find out why it slipped.', axis: 'C' },
                { label: 'I try again with more energy.', axis: 'D' },
                { label: 'I invite a teammate to tie it together.', axis: 'I' },
            ],
        },
        {
            number: 8,
            title: 'The Push',
            intro: 'The team is tired and it\'s getting hard to keep rowing. What do you feel like doing?',
            options: [
                { label: 'I put in more energy so the boat moves forward.', axis: 'D' },
                { label: 'I look closely at how to move the oar so it\'s easier.', axis: 'C' },
                { label: 'I keep rowing steady so the boat doesn\'t stop.', axis: 'S' },
                { label: 'I say something fun to cheer the team up.', axis: 'I' },
            ],
        },
        {
            number: 9,
            title: 'The Wait',
            intro: 'It\'s your turn to rest while others adjust the sails. What do you do in that little while?',
            options: [
                { label: 'I watch how they do it to learn their tricks.', axis: 'C' },
                { label: 'I wait alert for the signal to row again.', axis: 'D' },
                { label: 'I rest calmly so I\'m ready when the team needs me.', axis: 'S' },
                { label: 'I cheer on the ones adjusting the sails.', axis: 'I' },
            ],
        },
        {
            number: 10,
            title: 'The Support',
            intro: 'A teammate\'s oar slips from their hands and they get a little sad. What comes from your heart?',
            options: [
                { label: 'I hand them the oar quickly so they can keep rowing.', axis: 'D' },
                { label: 'I show them a trick to grip the oar better.', axis: 'C' },
                { label: 'I row by their side so they don\'t feel alone.', axis: 'S' },
                { label: 'I crack a joke so they laugh.', axis: 'I' },
            ],
        },
        {
            number: 11,
            title: 'The Final Practice',
            intro: 'To reach the shore you have to repeat the same move many times. What helps you not get bored?',
            options: [
                { label: 'Improving some little detail on every try.', axis: 'C' },
                { label: 'Feeling like it\'s a game with my friends.', axis: 'I' },
                { label: 'Feeling that my rhythm helps the boat.', axis: 'S' },
                { label: 'Making up a new challenge each time.', axis: 'D' },
            ],
        },
        {
            number: 12,
            title: 'The Finish',
            intro: 'We made it! The boat touches the sand. As you step onto the beach... what\'s the first thing you think?',
            options: [
                { label: 'What a great adventure to share with the team!', axis: 'I' },
                { label: 'Our trip\'s plan worked out so well!', axis: 'C' },
                { label: 'I\'m glad I helped us all get there safe!', axis: 'S' },
                { label: 'We did it! What\'s the next island?', axis: 'D' },
            ],
        },
    ],

    pt: [
        {
            number: 1,
            title: 'A Largada',
            intro: 'O barco está prestes a sair do porto. O que você tem vontade de fazer?',
            options: [
                { label: 'Confiro se as cordas estão bem amarradas antes de sair.', axis: 'C' },
                { label: 'Subo rápido no barco pra sair já.', axis: 'D' },
                { label: 'Me acomodo tranquilo pra ajudar durante a viagem.', axis: 'S' },
                { label: 'Procuro meus amigos pra sentarmos juntos.', axis: 'I' },
            ],
        },
        {
            number: 2,
            title: 'O Novo Ritmo',
            intro: 'O capitão te ensina um jeito novo de remar. O que você faz pra aprender?',
            options: [
                { label: 'Primeiro quero entender por que se faz assim.', axis: 'C' },
                { label: 'Já experimento na hora com meus próprios braços.', axis: 'D' },
                { label: 'Repito passo a passo pra remar no ritmo da equipe.', axis: 'S' },
                { label: 'Pratico com meus amigos pra nos divertirmos.', axis: 'I' },
            ],
        },
        {
            number: 3,
            title: 'O Motor da Viagem',
            intro: 'O que mais te faz sorrir quando estamos na água?',
            options: [
                { label: 'Aprender truques pra meu remo entrar na água sem respingar.', axis: 'C' },
                { label: 'Remar parelho pra ajudar o barco a não frear.', axis: 'S' },
                { label: 'Contar histórias com os outros enquanto o barco avança.', axis: 'I' },
                { label: 'Sentir que vamos cada vez mais rápido rumo à ilha.', axis: 'D' },
            ],
        },
        {
            number: 4,
            title: 'A Encruzilhada',
            intro: 'O mapa mostra dois caminhos pra chegar à ilha. Como você gosta de escolher?',
            options: [
                { label: 'Pergunto a todos de qual caminho eles gostam mais.', axis: 'I' },
                { label: 'Olho bem o mapa e o vento antes de escolher.', axis: 'C' },
                { label: 'Escolho o caminho mais curto pra chegar antes.', axis: 'D' },
                { label: 'Prefiro o caminho que já conhecemos pra irmos todos tranquilos.', axis: 'S' },
            ],
        },
        {
            number: 5,
            title: 'A Tempestade',
            intro: 'A tempestade se aproxima. O que você faz?',
            options: [
                { label: 'Já começo a agir, sem esperar ela chegar.', axis: 'D' },
                { label: 'Olho o céu e vejo o que convém prender antes.', axis: 'C' },
                { label: 'Reúno a equipe pra ficarmos todos juntos.', axis: 'I' },
                { label: 'Sigo firme na minha parte pro barco não frear.', axis: 'S' },
            ],
        },
        {
            number: 6,
            title: 'O Desequilíbrio',
            intro: 'Uma onda inclina o barco de repente e você quase cai. Nesse segundo... o que você faz?',
            options: [
                { label: 'Grito "vamos, equipe!" pra dar ânimo a todos.', axis: 'I' },
                { label: 'Agarro uma corda pra ajudar a acomodar o barco.', axis: 'D' },
                { label: 'Procuro o que se soltou pra avisar o capitão.', axis: 'C' },
                { label: 'Seguro meus companheiros pra ninguém cair.', axis: 'S' },
            ],
        },
        {
            number: 7,
            title: 'O Nó Rebelde',
            intro: 'Você fez um nó pra amarrar a vela e ele se soltou. O que você faz primeiro?',
            options: [
                { label: 'Amarro de novo com cuidado pra equipe seguir navegando.', axis: 'S' },
                { label: 'Reviso o nó pra descobrir por que se soltou.', axis: 'C' },
                { label: 'Tento outra vez com mais energia.', axis: 'D' },
                { label: 'Convido um companheiro pra amarrar junto.', axis: 'I' },
            ],
        },
        {
            number: 8,
            title: 'O Empurrão',
            intro: 'A equipe está cansada e está difícil continuar remando. O que você tem vontade de fazer?',
            options: [
                { label: 'Ponho mais energia pro barco avançar.', axis: 'D' },
                { label: 'Reparo bem como mover o remo pra ficar mais fácil.', axis: 'C' },
                { label: 'Sigo remando parelho pro barco não parar.', axis: 'S' },
                { label: 'Digo algo divertido pra animar a equipe.', axis: 'I' },
            ],
        },
        {
            number: 9,
            title: 'A Espera',
            intro: 'Chega sua vez de descansar enquanto outros ajeitam as velas. O que você faz nesse tempinho?',
            options: [
                { label: 'Olho como fazem pra aprender os truques deles.', axis: 'C' },
                { label: 'Espero atento o sinal pra voltar a remar.', axis: 'D' },
                { label: 'Descanso tranquilo pra ajudar quando a equipe precisar.', axis: 'S' },
                { label: 'Dou ânimo aos que estão ajeitando as velas.', axis: 'I' },
            ],
        },
        {
            number: 10,
            title: 'O Apoio',
            intro: 'Um companheiro deixa o remo escapar e fica um pouco triste. O que sai do seu coração?',
            options: [
                { label: 'Passo o remo pra ele rápido pra seguir remando.', axis: 'D' },
                { label: 'Mostro um truque pra segurar melhor o remo.', axis: 'C' },
                { label: 'Remo do lado dele pra não se sentir sozinho.', axis: 'S' },
                { label: 'Faço uma piada pra ele rir.', axis: 'I' },
            ],
        },
        {
            number: 11,
            title: 'A Prática Final',
            intro: 'Pra chegar à margem é preciso repetir o mesmo movimento muitas vezes. O que te ajuda a não ficar entediado?',
            options: [
                { label: 'Melhorar algum detalhe a cada tentativa.', axis: 'C' },
                { label: 'Sentir que é uma brincadeira com meus amigos.', axis: 'I' },
                { label: 'Sentir que meu ritmo ajuda o barco.', axis: 'S' },
                { label: 'Inventar um desafio novo cada vez.', axis: 'D' },
            ],
        },
        {
            number: 12,
            title: 'A Meta',
            intro: 'Chegamos! O barco toca a areia. Ao descer na praia... qual é a primeira coisa que você pensa?',
            options: [
                { label: 'Que legal foi compartilhar essa aventura com a equipe!', axis: 'I' },
                { label: 'Que bom que o plano da viagem deu certo!', axis: 'C' },
                { label: 'Que bom que ajudei a gente a chegar bem!', axis: 'S' },
                { label: 'Conseguimos! Qual será a próxima ilha?', axis: 'D' },
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
