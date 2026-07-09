import type {
    AdultAxis,
    AdultMotor,
    AdultPressureStyle,
    Lang,
} from '../types/puentes';

export type QuestionBlock = 'disc' | 'motor' | 'pressure' | 'context';

export interface PuentesOption {
    id: string;
    label: string;
    axis?: AdultAxis;
    motor?: AdultMotor;
    pressure?: AdultPressureStyle;
    contextKey?: 'history' | 'dominant_emotion';
    contextValue?: string;
}

export interface PuentesQuestion {
    id: string;
    block: QuestionBlock;
    prompt: string;
    options: PuentesOption[];
}

export const REQUIRED_QUESTION_IDS = [
    'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8',
    'q9', 'q10',
    'q11', 'q12', 'q13',
    'q14', 'q15',
] as const;

export const PUENTES_QUESTIONS: Record<Lang, PuentesQuestion[]> = {
    es: [
        { id: 'q1', block: 'disc', prompt: 'Cuando {nombre} te cuenta un problema que tuvo en un partido, lo primero que tiendes a hacer es:', options: [
            { id: 'q1a', label: 'Plantear qué se puede hacer la próxima vez', axis: 'D' },
            { id: 'q1b', label: 'Animarlo y bajarle drama al asunto', axis: 'I' },
            { id: 'q1c', label: 'Escuchar sin interrumpir y validar lo que siente', axis: 'S' },
            { id: 'q1d', label: 'Hacer preguntas para entender exactamente qué pasó', axis: 'C' },
        ] },
        { id: 'q2', block: 'disc', prompt: 'Si {nombre} no quiere ir a la actividad un día, tu reacción más natural es:', options: [
            { id: 'q2a', label: 'Acompañarlo en su sentir y dejar la decisión abierta', axis: 'S' },
            { id: 'q2b', label: 'Recordarle el compromiso y motivarlo a ir igual', axis: 'D' },
            { id: 'q2c', label: 'Indagar qué está pasando antes de decidir nada', axis: 'C' },
            { id: 'q2d', label: 'Buscar algo que conecte la actividad con su entusiasmo', axis: 'I' },
        ] },
        { id: 'q3', block: 'disc', prompt: 'En la previa de un partido importante, tu energía suele ser:', options: [
            { id: 'q3a', label: 'Entusiasta, contagiando ánimo', axis: 'I' },
            { id: 'q3b', label: 'Analítica, repasando lo relevante', axis: 'C' },
            { id: 'q3c', label: 'Activa, enfocada en el objetivo', axis: 'D' },
            { id: 'q3d', label: 'Calma, transmitiendo serenidad', axis: 'S' },
        ] },
        { id: 'q4', block: 'disc', prompt: 'Cuando el entrenador toma una decisión que no compartes, tiendes a:', options: [
            { id: 'q4a', label: 'Observar más situaciones antes de formar opinión', axis: 'C' },
            { id: 'q4b', label: 'Confiar en el criterio del entrenador', axis: 'S' },
            { id: 'q4c', label: 'Plantearlo de manera directa', axis: 'D' },
            { id: 'q4d', label: 'Buscar conversar e influir desde la cordialidad', axis: 'I' },
        ] },
        { id: 'q5', block: 'disc', prompt: 'En el grupo de padres del equipo, sueles ser:', options: [
            { id: 'q5a', label: 'El que propone cosas y mueve la agenda', axis: 'D' },
            { id: 'q5b', label: 'El que está disponible y sostiene', axis: 'S' },
            { id: 'q5c', label: 'El que conecta, anima y arma vínculo', axis: 'I' },
            { id: 'q5d', label: 'El que aporta información o cuida los detalles', axis: 'C' },
        ] },
        { id: 'q6', block: 'disc', prompt: 'Al ver a {nombre} perder un partido importante, tu impulso primero es:', options: [
            { id: 'q6a', label: 'Estar presente sin forzar conversación', axis: 'S' },
            { id: 'q6b', label: 'Levantarle el ánimo, distraerlo', axis: 'I' },
            { id: 'q6c', label: 'Hablar del próximo objetivo', axis: 'D' },
            { id: 'q6d', label: 'Esperar el momento adecuado y conversar con calma', axis: 'C' },
        ] },
        { id: 'q7', block: 'disc', prompt: 'Cuando organizas algo para la familia, sueles:', options: [
            { id: 'q7a', label: 'Planificar con detalle antes de proponerlo', axis: 'C' },
            { id: 'q7b', label: 'Decidir rápido y ponerlo en marcha', axis: 'D' },
            { id: 'q7c', label: 'Adaptarte a lo que el resto prefiera', axis: 'S' },
            { id: 'q7d', label: 'Consultar a todos y armar el plan en conjunto', axis: 'I' },
        ] },
        { id: 'q8', block: 'disc', prompt: 'Lo que más te incomoda del deporte juvenil hoy es:', options: [
            { id: 'q8a', label: 'Cuando se rompe el espíritu de equipo', axis: 'I' },
            { id: 'q8b', label: 'La presión excesiva sobre los chicos', axis: 'S' },
            { id: 'q8c', label: 'La falta de ambición o desafío real', axis: 'D' },
            { id: 'q8d', label: 'La falta de criterio o planificación', axis: 'C' },
        ] },
        { id: 'q9', block: 'motor', prompt: 'Cuando recibes información nueva sobre algo que te importa:', options: [
            { id: 'q9a', label: 'Actúo enseguida y voy ajustando sobre la marcha', motor: 'agil' },
            { id: 'q9b', label: 'Hago una pausa breve, proceso, y después actúo', motor: 'equilibrado' },
            { id: 'q9c', label: 'Necesito tiempo para integrarla antes de moverme', motor: 'profundo' },
        ] },
        { id: 'q10', block: 'motor', prompt: 'Tu forma natural de tomar decisiones es:', options: [
            { id: 'q10a', label: 'Reflexiono con calma hasta sentir certeza', motor: 'profundo' },
            { id: 'q10b', label: 'Por instinto, después confirmo si fue acertado', motor: 'agil' },
            { id: 'q10c', label: 'Combino instinto con un análisis breve', motor: 'equilibrado' },
        ] },
        { id: 'q11', block: 'pressure', prompt: 'Cuando {nombre} atraviesa una mala racha deportiva, lo que más te cuesta es:', options: [
            { id: 'q11a', label: 'Contengo mi propia frustración y me enfoco en él', pressure: 'regulado' },
            { id: 'q11b', label: 'A veces se me escapa la frustración antes de pensarla', pressure: 'reactivo' },
            { id: 'q11c', label: 'Tiendo a no hablar del tema para no incomodarlo', pressure: 'evitativo' },
        ] },
        { id: 'q12', block: 'pressure', prompt: 'Si percibes una injusticia hacia {nombre} (otro jugador, árbitro, entrenador), tu primera reacción es:', options: [
            { id: 'q12a', label: 'Espero a estar tranquilo para evaluar si actuar', pressure: 'regulado' },
            { id: 'q12b', label: 'Prefiero no intervenir, que lo resuelva él', pressure: 'evitativo' },
            { id: 'q12c', label: 'Reacciono rápido, a veces más fuerte de lo que quisiera', pressure: 'reactivo' },
        ] },
        { id: 'q13', block: 'pressure', prompt: 'Después de una conversación con {nombre} sobre algo del deporte:', options: [
            { id: 'q13a', label: 'Me cuesta soltar, me quedo dando vueltas al tema', pressure: 'reactivo' },
            { id: 'q13b', label: 'Vuelvo a hablar cuando ambos estamos calmados', pressure: 'regulado' },
            { id: 'q13c', label: 'Suele pasar y no volvemos a tocar el tema', pressure: 'evitativo' },
        ] },
        { id: 'q14', block: 'context', prompt: '¿Practicaste deporte competitivo en tu adolescencia?', options: [
            { id: 'q14a', label: 'Sí, varios años', contextKey: 'history', contextValue: 'ex_competitive' },
            { id: 'q14b', label: 'Sí, brevemente', contextKey: 'history', contextValue: 'ex_brief' },
            { id: 'q14c', label: 'No, pero sí recreativamente', contextKey: 'history', contextValue: 'recreational' },
            { id: 'q14d', label: 'No', contextKey: 'history', contextValue: 'none' },
        ] },
        { id: 'q15', block: 'context', prompt: 'Cuando ves jugar a {nombre}, la emoción que más predomina en ti es:', options: [
            { id: 'q15a', label: 'Orgullo', contextKey: 'dominant_emotion', contextValue: 'orgullo' },
            { id: 'q15b', label: 'Nervios o ansiedad', contextKey: 'dominant_emotion', contextValue: 'nervios' },
            { id: 'q15c', label: 'Disfrute pleno', contextKey: 'dominant_emotion', contextValue: 'disfrute' },
            { id: 'q15d', label: 'Preocupación', contextKey: 'dominant_emotion', contextValue: 'preocupacion' },
            { id: 'q15e', label: 'Curiosidad', contextKey: 'dominant_emotion', contextValue: 'curiosidad' },
            { id: 'q15f', label: 'Mezcla de varias', contextKey: 'dominant_emotion', contextValue: 'mezcla' },
        ] },
    ],

    en: [
        { id: 'q1', block: 'disc', prompt: 'When {nombre} tells you about a problem they had in a match, the first thing you tend to do is:', options: [
            { id: 'q1a', label: 'Suggest what could be done next time', axis: 'D' },
            { id: 'q1b', label: 'Cheer them up and lighten the moment', axis: 'I' },
            { id: 'q1c', label: 'Listen without interrupting and validate what they feel', axis: 'S' },
            { id: 'q1d', label: 'Ask questions to understand exactly what happened', axis: 'C' },
        ] },
        { id: 'q2', block: 'disc', prompt: 'If {nombre} does not want to go to the activity one day, your most natural reaction is:', options: [
            { id: 'q2a', label: 'Stay close to what they feel and leave the decision open', axis: 'S' },
            { id: 'q2b', label: 'Remind them of their commitment and motivate them to go anyway', axis: 'D' },
            { id: 'q2c', label: 'Ask what is going on before deciding anything', axis: 'C' },
            { id: 'q2d', label: 'Find something that connects the activity to their enthusiasm', axis: 'I' },
        ] },
        { id: 'q3', block: 'disc', prompt: 'Before an important match, your energy tends to be:', options: [
            { id: 'q3a', label: 'Enthusiastic, lifting the mood', axis: 'I' },
            { id: 'q3b', label: 'Analytical, going over what matters', axis: 'C' },
            { id: 'q3c', label: 'Active, focused on the goal', axis: 'D' },
            { id: 'q3d', label: 'Calm, transmitting serenity', axis: 'S' },
        ] },
        { id: 'q4', block: 'disc', prompt: 'When the coach makes a decision you do not share, you tend to:', options: [
            { id: 'q4a', label: 'Observe more situations before forming an opinion', axis: 'C' },
            { id: 'q4b', label: 'Trust the coach’s criteria', axis: 'S' },
            { id: 'q4c', label: 'Raise it directly', axis: 'D' },
            { id: 'q4d', label: 'Look for a conversation and influence with warmth', axis: 'I' },
        ] },
        { id: 'q5', block: 'disc', prompt: 'In the team parent group, you tend to be:', options: [
            { id: 'q5a', label: 'The one who proposes things and moves the agenda', axis: 'D' },
            { id: 'q5b', label: 'The one who is available and supportive', axis: 'S' },
            { id: 'q5c', label: 'The one who connects, encourages and builds bonds', axis: 'I' },
            { id: 'q5d', label: 'The one who brings information or takes care of the details', axis: 'C' },
        ] },
        { id: 'q6', block: 'disc', prompt: 'Seeing {nombre} lose an important match, your first impulse is:', options: [
            { id: 'q6a', label: 'Be present without forcing conversation', axis: 'S' },
            { id: 'q6b', label: 'Lift their spirits, distract them', axis: 'I' },
            { id: 'q6c', label: 'Talk about the next goal', axis: 'D' },
            { id: 'q6d', label: 'Wait for the right moment and talk calmly', axis: 'C' },
        ] },
        { id: 'q7', block: 'disc', prompt: 'When you organize something for the family, you tend to:', options: [
            { id: 'q7a', label: 'Plan in detail before proposing it', axis: 'C' },
            { id: 'q7b', label: 'Decide quickly and set it in motion', axis: 'D' },
            { id: 'q7c', label: 'Adapt to what the rest prefer', axis: 'S' },
            { id: 'q7d', label: 'Consult everyone and build the plan together', axis: 'I' },
        ] },
        { id: 'q8', block: 'disc', prompt: 'What most concerns you about youth sport today is:', options: [
            { id: 'q8a', label: 'When team spirit breaks down', axis: 'I' },
            { id: 'q8b', label: 'Excessive pressure on the kids', axis: 'S' },
            { id: 'q8c', label: 'Lack of ambition or real challenge', axis: 'D' },
            { id: 'q8d', label: 'Lack of criteria or planning', axis: 'C' },
        ] },
        { id: 'q9', block: 'motor', prompt: 'When you receive new information about something that matters to you:', options: [
            { id: 'q9a', label: 'I act right away and adjust as I go', motor: 'agil' },
            { id: 'q9b', label: 'I pause briefly, process, and then act', motor: 'equilibrado' },
            { id: 'q9c', label: 'I need time to integrate it before moving', motor: 'profundo' },
        ] },
        { id: 'q10', block: 'motor', prompt: 'Your natural way of making decisions is:', options: [
            { id: 'q10a', label: 'I reflect calmly until I feel certain', motor: 'profundo' },
            { id: 'q10b', label: 'By instinct, then I check if it was right', motor: 'agil' },
            { id: 'q10c', label: 'I combine instinct with a brief analysis', motor: 'equilibrado' },
        ] },
        { id: 'q11', block: 'pressure', prompt: 'When {nombre} goes through a rough sports patch, what is hardest for you is:', options: [
            { id: 'q11a', label: 'I contain my own frustration and focus on them', pressure: 'regulado' },
            { id: 'q11b', label: 'Sometimes frustration slips out before I think it through', pressure: 'reactivo' },
            { id: 'q11c', label: 'I tend not to bring it up so as not to make them uncomfortable', pressure: 'evitativo' },
        ] },
        { id: 'q12', block: 'pressure', prompt: 'If you sense an unfair situation toward {nombre} (another player, referee, coach), your first reaction is:', options: [
            { id: 'q12a', label: 'I wait until I am calm to assess whether to act', pressure: 'regulado' },
            { id: 'q12b', label: 'I prefer not to intervene and let them resolve it', pressure: 'evitativo' },
            { id: 'q12c', label: 'I react quickly, sometimes more strongly than I wanted', pressure: 'reactivo' },
        ] },
        { id: 'q13', block: 'pressure', prompt: 'After a conversation with {nombre} about something related to sport:', options: [
            { id: 'q13a', label: 'It is hard for me to let go, I keep turning it over in my mind', pressure: 'reactivo' },
            { id: 'q13b', label: 'I come back to talk when we are both calm', pressure: 'regulado' },
            { id: 'q13c', label: 'It usually fades and we do not revisit it', pressure: 'evitativo' },
        ] },
        { id: 'q14', block: 'context', prompt: 'Did you play competitive sport during your teenage years?', options: [
            { id: 'q14a', label: 'Yes, for several years', contextKey: 'history', contextValue: 'ex_competitive' },
            { id: 'q14b', label: 'Yes, briefly', contextKey: 'history', contextValue: 'ex_brief' },
            { id: 'q14c', label: 'No, but I played recreationally', contextKey: 'history', contextValue: 'recreational' },
            { id: 'q14d', label: 'No', contextKey: 'history', contextValue: 'none' },
        ] },
        { id: 'q15', block: 'context', prompt: 'When you watch {nombre} play, the emotion that predominates in you is:', options: [
            { id: 'q15a', label: 'Pride', contextKey: 'dominant_emotion', contextValue: 'orgullo' },
            { id: 'q15b', label: 'Nerves or anxiety', contextKey: 'dominant_emotion', contextValue: 'nervios' },
            { id: 'q15c', label: 'Full enjoyment', contextKey: 'dominant_emotion', contextValue: 'disfrute' },
            { id: 'q15d', label: 'Concern', contextKey: 'dominant_emotion', contextValue: 'preocupacion' },
            { id: 'q15e', label: 'Curiosity', contextKey: 'dominant_emotion', contextValue: 'curiosidad' },
            { id: 'q15f', label: 'A mix of several', contextKey: 'dominant_emotion', contextValue: 'mezcla' },
        ] },
    ],

    pt: [
        { id: 'q1', block: 'disc', prompt: 'Quando {nombre} te conta um problema que teve em uma partida, a primeira coisa que você tende a fazer é:', options: [
            { id: 'q1a', label: 'Propor o que pode ser feito na próxima vez', axis: 'D' },
            { id: 'q1b', label: 'Animá-lo e tirar o drama da situação', axis: 'I' },
            { id: 'q1c', label: 'Escutar sem interromper e validar o que sente', axis: 'S' },
            { id: 'q1d', label: 'Fazer perguntas para entender exatamente o que aconteceu', axis: 'C' },
        ] },
        { id: 'q2', block: 'disc', prompt: 'Se {nombre} não quiser ir à atividade um dia, sua reação mais natural é:', options: [
            { id: 'q2a', label: 'Acompanhá-lo no que sente e deixar a decisão em aberto', axis: 'S' },
            { id: 'q2b', label: 'Lembrá-lo do compromisso e motivá-lo a ir mesmo assim', axis: 'D' },
            { id: 'q2c', label: 'Investigar o que está acontecendo antes de decidir', axis: 'C' },
            { id: 'q2d', label: 'Buscar algo que conecte a atividade ao seu entusiasmo', axis: 'I' },
        ] },
        { id: 'q3', block: 'disc', prompt: 'No pré-jogo de uma partida importante, sua energia costuma ser:', options: [
            { id: 'q3a', label: 'Entusiasta, contagiando o ânimo', axis: 'I' },
            { id: 'q3b', label: 'Analítica, revisando o que importa', axis: 'C' },
            { id: 'q3c', label: 'Ativa, focada no objetivo', axis: 'D' },
            { id: 'q3d', label: 'Calma, transmitindo serenidade', axis: 'S' },
        ] },
        { id: 'q4', block: 'disc', prompt: 'Quando o treinador toma uma decisão que você não compartilha, você tende a:', options: [
            { id: 'q4a', label: 'Observar mais situações antes de formar opinião', axis: 'C' },
            { id: 'q4b', label: 'Confiar no critério do treinador', axis: 'S' },
            { id: 'q4c', label: 'Colocar de forma direta', axis: 'D' },
            { id: 'q4d', label: 'Buscar conversar e influenciar com cordialidade', axis: 'I' },
        ] },
        { id: 'q5', block: 'disc', prompt: 'No grupo de pais do time, você costuma ser:', options: [
            { id: 'q5a', label: 'Quem propõe coisas e movimenta a agenda', axis: 'D' },
            { id: 'q5b', label: 'Quem está disponível e sustenta', axis: 'S' },
            { id: 'q5c', label: 'Quem conecta, anima e cria vínculo', axis: 'I' },
            { id: 'q5d', label: 'Quem traz informação ou cuida dos detalhes', axis: 'C' },
        ] },
        { id: 'q6', block: 'disc', prompt: 'Ao ver {nombre} perder uma partida importante, seu primeiro impulso é:', options: [
            { id: 'q6a', label: 'Estar presente sem forçar conversa', axis: 'S' },
            { id: 'q6b', label: 'Levantar o ânimo, distraí-lo', axis: 'I' },
            { id: 'q6c', label: 'Falar do próximo objetivo', axis: 'D' },
            { id: 'q6d', label: 'Esperar o momento certo e conversar com calma', axis: 'C' },
        ] },
        { id: 'q7', block: 'disc', prompt: 'Quando você organiza algo para a família, costuma:', options: [
            { id: 'q7a', label: 'Planejar com detalhes antes de propor', axis: 'C' },
            { id: 'q7b', label: 'Decidir rápido e colocar em prática', axis: 'D' },
            { id: 'q7c', label: 'Adaptar-se ao que os outros preferirem', axis: 'S' },
            { id: 'q7d', label: 'Consultar todos e montar o plano em conjunto', axis: 'I' },
        ] },
        { id: 'q8', block: 'disc', prompt: 'O que mais te incomoda no esporte juvenil hoje é:', options: [
            { id: 'q8a', label: 'Quando o espírito de equipe se rompe', axis: 'I' },
            { id: 'q8b', label: 'A pressão excessiva sobre as crianças', axis: 'S' },
            { id: 'q8c', label: 'A falta de ambição ou desafio real', axis: 'D' },
            { id: 'q8d', label: 'A falta de critério ou planejamento', axis: 'C' },
        ] },
        { id: 'q9', block: 'motor', prompt: 'Quando você recebe informação nova sobre algo que importa para você:', options: [
            { id: 'q9a', label: 'Ajo na hora e vou ajustando no caminho', motor: 'agil' },
            { id: 'q9b', label: 'Faço uma pausa breve, processo e depois ajo', motor: 'equilibrado' },
            { id: 'q9c', label: 'Preciso de tempo para integrar antes de me mover', motor: 'profundo' },
        ] },
        { id: 'q10', block: 'motor', prompt: 'Sua forma natural de tomar decisões é:', options: [
            { id: 'q10a', label: 'Reflito com calma até sentir certeza', motor: 'profundo' },
            { id: 'q10b', label: 'Por instinto, depois confirmo se foi acertado', motor: 'agil' },
            { id: 'q10c', label: 'Combino instinto com uma análise breve', motor: 'equilibrado' },
        ] },
        { id: 'q11', block: 'pressure', prompt: 'Quando {nombre} atravessa uma fase difícil no esporte, o que mais te custa é:', options: [
            { id: 'q11a', label: 'Contenho minha própria frustração e me concentro nele', pressure: 'regulado' },
            { id: 'q11b', label: 'Às vezes a frustração escapa antes de eu pensar', pressure: 'reactivo' },
            { id: 'q11c', label: 'Costumo não falar do tema para não incomodá-lo', pressure: 'evitativo' },
        ] },
        { id: 'q12', block: 'pressure', prompt: 'Se você percebe uma injustiça com {nombre} (outro jogador, árbitro, treinador), sua primeira reação é:', options: [
            { id: 'q12a', label: 'Espero estar tranquilo para avaliar se atuo', pressure: 'regulado' },
            { id: 'q12b', label: 'Prefiro não intervir, que ele resolva', pressure: 'evitativo' },
            { id: 'q12c', label: 'Reajo rápido, às vezes mais forte do que gostaria', pressure: 'reactivo' },
        ] },
        { id: 'q13', block: 'pressure', prompt: 'Depois de uma conversa com {nombre} sobre algo do esporte:', options: [
            { id: 'q13a', label: 'Tenho dificuldade de soltar, fico dando voltas no tema', pressure: 'reactivo' },
            { id: 'q13b', label: 'Volto a falar quando ambos estamos calmos', pressure: 'regulado' },
            { id: 'q13c', label: 'Costuma passar e não voltamos ao assunto', pressure: 'evitativo' },
        ] },
        { id: 'q14', block: 'context', prompt: 'Você praticou esporte competitivo na adolescência?', options: [
            { id: 'q14a', label: 'Sim, por vários anos', contextKey: 'history', contextValue: 'ex_competitive' },
            { id: 'q14b', label: 'Sim, brevemente', contextKey: 'history', contextValue: 'ex_brief' },
            { id: 'q14c', label: 'Não, mas pratiquei de forma recreativa', contextKey: 'history', contextValue: 'recreational' },
            { id: 'q14d', label: 'Não', contextKey: 'history', contextValue: 'none' },
        ] },
        { id: 'q15', block: 'context', prompt: 'Quando você vê {nombre} jogar, a emoção que mais predomina em você é:', options: [
            { id: 'q15a', label: 'Orgulho', contextKey: 'dominant_emotion', contextValue: 'orgullo' },
            { id: 'q15b', label: 'Nervosismo ou ansiedade', contextKey: 'dominant_emotion', contextValue: 'nervios' },
            { id: 'q15c', label: 'Diversão plena', contextKey: 'dominant_emotion', contextValue: 'disfrute' },
            { id: 'q15d', label: 'Preocupação', contextKey: 'dominant_emotion', contextValue: 'preocupacion' },
            { id: 'q15e', label: 'Curiosidade', contextKey: 'dominant_emotion', contextValue: 'curiosidad' },
            { id: 'q15f', label: 'Mistura de várias', contextKey: 'dominant_emotion', contextValue: 'mezcla' },
        ] },
    ],
};

export function getPuentesQuestions(lang: Lang): PuentesQuestion[] {
    return PUENTES_QUESTIONS[lang] ?? PUENTES_QUESTIONS.es;
}
