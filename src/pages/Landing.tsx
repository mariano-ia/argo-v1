import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Plus, Minus, Check } from 'lucide-react';
import { InfoTip } from '../components/ui/Tooltip';
import { useLang, type Lang } from '../context/LangContext';
import { APP_VERSION } from '../lib/version';
import { AXIS_COLORS } from '../lib/designTokens';

// ─── Design tokens ───────────────────────────────────────────────────────────
// #1D1D1F  text-argo-navy
// #955FB5  (CTA only)
// #86868B  text-argo-grey    (secondary)
// #D2D2D7  border-argo-border
// #F5F5F7  bg-argo-neutral

const fadeUp = (delay = 0) => ({
    initial:  { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6, ease: [0.25, 0, 0, 1], delay },
});

// ─── Twelve archetypes ───────────────────────────────────────────────────────
const ARCHETYPES = [
    { labelEs: 'Impulsor Dinámico',    labelEn: 'Dynamic Driver',        labelPt: 'Impulsionador Dinâmico',    motorEs: 'Dinámico', motorEn: 'Fast',     motorPt: 'Dinâmico', eje: 'D' },
    { labelEs: 'Impulsor Rítmico',     labelEn: 'Rhythmic Driver',       labelPt: 'Impulsionador Rítmico',     motorEs: 'Rítmico',  motorEn: 'Rhythmic', motorPt: 'Rítmico',  eje: 'D' },
    { labelEs: 'Impulsor Sereno',      labelEn: 'Serene Driver',         labelPt: 'Impulsionador Sereno',      motorEs: 'Sereno',   motorEn: 'Serene',   motorPt: 'Sereno',   eje: 'D' },
    { labelEs: 'Conector Dinámico',    labelEn: 'Dynamic Connector',     labelPt: 'Conector Dinâmico',         motorEs: 'Dinámico', motorEn: 'Fast',     motorPt: 'Dinâmico', eje: 'I' },
    { labelEs: 'Conector Rítmico',     labelEn: 'Rhythmic Connector',    labelPt: 'Conector Rítmico',          motorEs: 'Rítmico',  motorEn: 'Rhythmic', motorPt: 'Rítmico',  eje: 'I' },
    { labelEs: 'Conector Sereno',      labelEn: 'Serene Connector',      labelPt: 'Conector Sereno',           motorEs: 'Sereno',   motorEn: 'Serene',   motorPt: 'Sereno',   eje: 'I' },
    { labelEs: 'Sostenedor Dinámico',  labelEn: 'Dynamic Sustainer',     labelPt: 'Sustentador Dinâmico',      motorEs: 'Dinámico', motorEn: 'Fast',     motorPt: 'Dinâmico', eje: 'S' },
    { labelEs: 'Sostenedor Rítmico',   labelEn: 'Rhythmic Sustainer',    labelPt: 'Sustentador Rítmico',       motorEs: 'Rítmico',  motorEn: 'Rhythmic', motorPt: 'Rítmico',  eje: 'S' },
    { labelEs: 'Sostenedor Sereno',    labelEn: 'Serene Sustainer',      labelPt: 'Sustentador Sereno',        motorEs: 'Sereno',   motorEn: 'Serene',   motorPt: 'Sereno',   eje: 'S' },
    { labelEs: 'Estratega Dinámico',   labelEn: 'Dynamic Strategist',    labelPt: 'Estrategista Dinâmico',     motorEs: 'Dinámico', motorEn: 'Fast',     motorPt: 'Dinâmico', eje: 'C' },
    { labelEs: 'Estratega Rítmico',    labelEn: 'Rhythmic Strategist',   labelPt: 'Estrategista Rítmico',      motorEs: 'Rítmico',  motorEn: 'Rhythmic', motorPt: 'Rítmico',  eje: 'C' },
    { labelEs: 'Estratega Observador', labelEn: 'Observant Strategist',  labelPt: 'Estrategista Observador',   motorEs: 'Sereno',   motorEn: 'Serene',   motorPt: 'Sereno',   eje: 'C' },
];

// ─── Archetype descriptions (ES + EN + PT) ──────────────────────────────────
const ARCHETYPE_DESCRIPTIONS: Record<Lang, string>[] = [
    {
        es: 'Vive el deporte desde la acción. Su energía no espera instrucciones, necesita movimiento constante para estar en su zona. Bajo presión, acelera. Cuando se lo frena sin razón, pierde la chispa. El reto permanente y la autonomía son su combustible.',
        en: 'Lives sport through action. Their energy does not wait for instructions — it needs constant movement to stay in the zone. Under pressure, they accelerate. When held back without reason, they lose their spark. Constant challenge and autonomy are their fuel.',
        pt: 'Vive o esporte pela ação. Sua energia não espera instruções — precisa de movimento constante para estar na zona. Sob pressão, acelera. Quando é freado sem razão, perde a centelha. O desafio permanente e a autonomia são seu combustível.',
    },
    {
        es: 'Combina la determinación del líder con la capacidad de dosificar energía en el momento justo. No es el primero en salir, pero tampoco el último en llegar. Decide con claridad y actúa con propósito. Necesita objetivos claros y espacio para ejecutarlos a su ritmo.',
        en: 'Combines a leader\'s determination with the ability to pace their energy at exactly the right moment. Not the first to leave, but never the last to arrive. Decides clearly and acts with purpose. Needs clear objectives and space to execute at their own rhythm.',
        pt: 'Combina a determinação de um líder com a capacidade de dosar energia no momento certo. Não é o primeiro a sair, mas também não é o último a chegar. Decide com clareza e age com propósito. Precisa de objetivos claros e espaço para executá-los no seu ritmo.',
    },
    {
        es: 'Tiene la voluntad de un líder y la paciencia de un estratega. Procesa antes de actuar, pero cuando decide, lo hace con convicción absoluta. No se precipita, pero tampoco retrocede. Necesita tiempo para comprender el plan y luego libertad para ejecutarlo sin interrupciones.',
        en: 'Has a leader\'s will and a strategist\'s patience. Processes before acting, but when they decide, they do so with absolute conviction. Does not rush, but does not retreat. Needs time to understand the plan, then freedom to execute it without interruption.',
        pt: 'Tem a vontade de um líder e a paciência de um estrategista. Processa antes de agir, mas quando decide, faz com convicção absoluta. Não se precipita, mas também não recua. Precisa de tempo para compreender o plano e depois liberdade para executá-lo sem interrupções.',
    },
    {
        es: 'El equipo es su hábitat natural. Se activa con el contacto, el juego y la energía colectiva. Reacciona rápido y habla rápido. Su entusiasmo contagia al grupo, pero también puede dispersarse si no hay estructura que lo contenga. Necesita un entorno dinámico que no apague su llama.',
        en: 'The team is their natural habitat. They activate through contact, play, and collective energy. They react fast and speak fast. Their enthusiasm is contagious, but they can also scatter if there is no structure to contain them. Needs a dynamic environment that does not dim their flame.',
        pt: 'A equipe é seu habitat natural. Ativa-se com o contato, o jogo e a energia coletiva. Reage rápido e fala rápido. Seu entusiasmo contagia o grupo, mas também pode se dispersar se não houver estrutura que o contenha. Precisa de um ambiente dinâmico que não apague sua chama.',
    },
    {
        es: 'Construye puentes con calma y convicción. Se relaciona con todos y sabe cuándo hablar y cuándo escuchar. No corre detrás de cada estímulo. Selecciona los momentos para brillar. Necesita espacios de reconocimiento genuino y un equipo donde sentir que importa.',
        en: 'Builds bridges with calm and conviction. Connects with everyone and knows when to speak and when to listen. Does not chase every stimulus — selects their moments to shine. Needs genuine recognition and a team where they feel they matter.',
        pt: 'Constrói pontes com calma e convicção. Relaciona-se com todos e sabe quando falar e quando ouvir. Não corre atrás de cada estímulo. Seleciona os momentos para brilhar. Precisa de espaços de reconhecimento genuíno e uma equipe onde sinta que importa.',
    },
    {
        es: 'La profundidad no es debilidad, es su superpoder silencioso. Conecta con los demás desde la escucha y la empatía, no desde el ruido. Observa antes de participar, pero cuando lo hace, deja huella. Necesita un ambiente de confianza donde el vínculo sea más importante que el resultado.',
        en: 'Depth is not weakness — it is their silent superpower. Connects with others through listening and empathy, not noise. Observes before participating, but when they do, they leave a mark. Needs a trusting environment where the bond matters more than the result.',
        pt: 'A profundidade não é fraqueza — é seu superpoder silencioso. Conecta-se com os outros pela escuta e empatia, não pelo ruído. Observa antes de participar, mas quando o faz, deixa marca. Precisa de um ambiente de confiança onde o vínculo seja mais importante que o resultado.',
    },
    {
        es: 'Tiene el corazón del equipo y los pies de un velocista. Es el primero en dar la mano y también en llegar a la pelota. Estabiliza el grupo desde la acción, no solo desde el apoyo. Necesita sentir que su aporte es visible y que el equipo lo reconoce como parte esencial.',
        en: 'Has the heart of the team and the feet of a sprinter. First to offer a hand and first to reach the ball. Stabilizes the group through action, not just support. Needs to feel their contribution is visible and that the team recognizes them as essential.',
        pt: 'Tem o coração da equipe e os pés de um velocista. É o primeiro a estender a mão e também a chegar à bola. Estabiliza o grupo pela ação, não apenas pelo apoio. Precisa sentir que sua contribuição é visível e que a equipe o reconhece como parte essencial.',
    },
    {
        es: 'La columna vertebral del equipo. No busca el protagonismo, pero sin esta figura nada funciona. Ejecuta con consistencia, apoya sin condiciones y mantiene el ritmo cuando los demás fallan. Necesita un entorno predecible y relaciones estables para dar lo mejor de sí.',
        en: 'The backbone of the team. Does not seek the spotlight, but without them nothing works. Executes with consistency, supports unconditionally, and keeps the rhythm when others falter. Needs a predictable environment and stable relationships to give their best.',
        pt: 'A coluna vertebral da equipe. Não busca o protagonismo, mas sem ele nada funciona. Executa com consistência, apoia sem condições e mantém o ritmo quando os outros falham. Precisa de um ambiente previsível e relações estáveis para dar o melhor de si.',
    },
    {
        es: 'La calma en medio de la tormenta. Procesa cada situación con paciencia y actúa con una consistencia que pocos logran mantener. No reacciona, responde. Necesita tiempo y confianza para adaptarse a los cambios, pero una vez que lo hace, es el ancla del grupo.',
        en: 'Calm in the eye of the storm. Processes every situation with patience and acts with a consistency few can sustain. Does not react — responds. Needs time and trust to adapt to changes, but once they do, they become the group\'s anchor.',
        pt: 'A calma no meio da tempestade. Processa cada situação com paciência e age com uma consistência que poucos conseguem manter. Não reage — responde. Precisa de tempo e confiança para se adaptar às mudanças, mas uma vez que o faz, torna-se a âncora do grupo.',
    },
    {
        es: 'Analiza en segundos lo que otros tardan minutos en ver. Combina velocidad de procesamiento con precisión táctica, una rareza que convierte cada partido en un ejercicio de inteligencia aplicada. Necesita retos complejos y espacio para liderar desde el análisis, sin que nadie interrumpa su proceso.',
        en: 'Analyzes in seconds what others take minutes to see. Combines processing speed with tactical precision — a rarity that turns every game into applied intelligence. Needs complex challenges and space to lead from analysis, without anyone interrupting their process.',
        pt: 'Analisa em segundos o que outros levam minutos para ver. Combina velocidade de processamento com precisão tática — uma raridade que transforma cada jogo em um exercício de inteligência aplicada. Precisa de desafios complexos e espaço para liderar pela análise, sem que ninguém interrompa seu processo.',
    },
    {
        es: 'Piensa antes de hablar y habla antes de actuar. Su proceso no es lento, es exacto. Cada decisión está sustentada en observación y criterio. Prefiere la calidad a la velocidad y la precisión al volumen. Necesita un entorno que valore el análisis y no lo presione a actuar antes de estar listo.',
        en: 'Thinks before speaking and speaks before acting. Their process is not slow — it is exact. Every decision is grounded in observation and judgment. Prefers quality over speed and precision over volume. Needs an environment that values analysis and does not pressure them to act before they are ready.',
        pt: 'Pensa antes de falar e fala antes de agir. Seu processo não é lento — é exato. Cada decisão é sustentada em observação e critério. Prefere qualidade à velocidade e precisão ao volume. Precisa de um ambiente que valorize a análise e não o pressione a agir antes de estar pronto.',
    },
    {
        es: 'Su talento no está en la velocidad de la carrera, sino en la claridad de su mirada. Tiende a procesar el entorno con profundidad antes de actuar, aportando calma y orden táctico incluso en momentos de presión. El deporte es un tablero que prefiere comprender antes de ejecutar.',
        en: 'Their talent lies not in the speed of the run, but in the clarity of their gaze. Tends to process the environment deeply before acting, bringing calm and tactical order even under pressure. For them, sport is a board they prefer to understand before executing.',
        pt: 'Seu talento não está na velocidade da corrida, mas na clareza do seu olhar. Tende a processar o ambiente com profundidade antes de agir, trazendo calma e ordem tática mesmo em momentos de pressão. Para ele, o esporte é um tabuleiro que prefere compreender antes de executar.',
    },
];


// ─── Rotating profiles for Sistema animation ──────────────────────────────────
const ROTATING_PROFILES = [
    {
        eje: 'D',
        ejeLabelEs: 'Impulsor',          ejeLabelEn: 'Driver',         ejeLabelPt: 'Impulsionador',
        behaviorsEs: ['Domina', 'Decide', 'Compite'],
        behaviorsEn: ['Dominates', 'Decides', 'Competes'],
        behaviorsPt: ['Domina', 'Decide', 'Compete'],
        motorEs: 'Dinámico',             motorEn: 'Fast',              motorPt: 'Dinâmico',         motorBars: 3,
        motorDescEs: 'Responde en segundos. Necesita acción constante.',
        motorDescEn: 'Responds in seconds. Needs constant action.',
        motorDescPt: 'Responde em segundos. Precisa de ação constante.',
        archetypeEs: 'Impulsor Dinámico', archetypeEn: 'Dynamic Driver', archetypePt: 'Impulsionador Dinâmico',
        archetypeDescEs: 'Necesita reto constante y autonomía. Responde al feedback directo.',
        archetypeDescEn: 'Needs constant challenge and autonomy. Responds to direct feedback.',
        archetypeDescPt: 'Precisa de desafio constante e autonomia. Responde ao feedback direto.',
    },
    {
        eje: 'S',
        ejeLabelEs: 'Sostenedor',        ejeLabelEn: 'Sustainer',      ejeLabelPt: 'Sustentador',
        behaviorsEs: ['Estabiliza', 'Cuida', 'Persiste'],
        behaviorsEn: ['Stabilizes', 'Nurtures', 'Persists'],
        behaviorsPt: ['Estabiliza', 'Cuida', 'Persiste'],
        motorEs: 'Sereno',               motorEn: 'Serene',            motorPt: 'Sereno',           motorBars: 1,
        motorDescEs: 'Procesa en profundidad antes de actuar.',
        motorDescEn: 'Processes in depth before acting.',
        motorDescPt: 'Processa em profundidade antes de agir.',
        archetypeEs: 'Sostenedor Sereno', archetypeEn: 'Serene Sustainer', archetypePt: 'Sustentador Sereno',
        archetypeDescEs: 'Necesita tiempo y seguridad. Evita los cambios abruptos sin aviso.',
        archetypeDescEn: 'Needs time and security. Avoids abrupt changes without warning.',
        archetypeDescPt: 'Precisa de tempo e segurança. Evita mudanças abruptas sem aviso.',
    },
    {
        eje: 'I',
        ejeLabelEs: 'Conector',          ejeLabelEn: 'Connector',      ejeLabelPt: 'Conector',
        behaviorsEs: ['Influye', 'Entusiasma', 'Conecta'],
        behaviorsEn: ['Influences', 'Enthuses', 'Connects'],
        behaviorsPt: ['Influencia', 'Entusiasma', 'Conecta'],
        motorEs: 'Rítmico',              motorEn: 'Rhythmic',          motorPt: 'Rítmico',          motorBars: 2,
        motorDescEs: 'Equilibra impulso y reflexión.',
        motorDescEn: 'Balances impulse and reflection.',
        motorDescPt: 'Equilibra impulso e reflexão.',
        archetypeEs: 'Conector Rítmico',  archetypeEn: 'Rhythmic Connector', archetypePt: 'Conector Rítmico',
        archetypeDescEs: 'Se motiva con el equipo. Necesita reconocimiento y variedad.',
        archetypeDescEn: 'Motivated by the team. Needs recognition and variety.',
        archetypeDescPt: 'Se motiva com a equipe. Precisa de reconhecimento e variedade.',
    },
    {
        eje: 'C',
        ejeLabelEs: 'Estratega',         ejeLabelEn: 'Strategist',     ejeLabelPt: 'Estrategista',
        behaviorsEs: ['Analiza', 'Planifica', 'Precisa'],
        behaviorsEn: ['Analyzes', 'Plans', 'Executes'],
        behaviorsPt: ['Analisa', 'Planeja', 'Precisa'],
        motorEs: 'Dinámico',             motorEn: 'Fast',              motorPt: 'Dinâmico',         motorBars: 3,
        motorDescEs: 'Responde en segundos. Actúa con precisión.',
        motorDescEn: 'Responds in seconds. Acts with precision.',
        motorDescPt: 'Responde em segundos. Age com precisão.',
        archetypeEs: 'Estratega Dinámico', archetypeEn: 'Dynamic Strategist', archetypePt: 'Estrategista Dinâmico',
        archetypeDescEs: 'Analiza rápido y necesita estructura clara. Odia la improvisación.',
        archetypeDescEn: 'Analyzes quickly and needs clear structure. Hates improvisation.',
        archetypeDescPt: 'Analisa rápido e precisa de estrutura clara. Odeia improvisação.',
    },
];

// ─── FAQs per language ───────────────────────────────────────────────────────
const FAQS: Record<Lang, { q: string; a: string }[]> = {
    es: [
        { q: '¿Qué es Argo Method?', a: 'No hay deportistas jóvenes incorrectos, hay deportistas que todavía no encontraron un adulto que los entienda. Argo Method es una herramienta de perfilamiento conductual para atletas jóvenes (8 a 16 años) basada en el modelo DISC. A través de una experiencia gamificada de 10 minutos, genera un informe personalizado que ayuda al adulto responsable a entender cómo piensa, siente y reacciona cada deportista en contextos deportivos.' },
        { q: '¿Qué es el modelo DISC?', a: 'DISC es un modelo de comportamiento observable utilizado en todo el mundo durante más de 30 años. Describe cuatro patrones conductuales: Impulsor (orientado a la acción y los resultados), Conector (orientado a las personas y la energía), Sostenedor (orientado a la estabilidad y el equipo) y Estratega (orientado al análisis y la precisión). Argo adapta este marco al deporte juvenil con lenguaje para niños, gamificación y una capa adicional —el Motor— que mide el ritmo de procesamiento de cada deportista.' },
        { q: '¿Para quién es el informe?', a: 'Para el adulto que acompaña al atleta: entrenadores, padres, madres o referentes de instituciones deportivas. El informe llega por email al finalizar la experiencia. No es un informe para el menor, es una herramienta para que el adulto pueda acompañar mejor.' },
        { q: '¿Se necesita crear una cuenta?', a: 'No. Solo se completa un formulario breve con nombre, edad y deporte. Sin contraseñas, sin descargas, sin instalar nada.' },
        { q: '¿Cuánto dura la experiencia?', a: 'Aproximadamente 10 minutos. Una aventura interactiva con mini-juegos y decisiones, presentada con temática náutica. Se responden a solas, en un ambiente tranquilo.' },
        { q: '¿Hay respuestas correctas o incorrectas?', a: 'No. Cada respuesta refleja una tendencia conductual, no un acierto ni un error. No se miden capacidades ni se emiten diagnósticos. Todas las respuestas son válidas.' },
        { q: '¿Es un test psicológico?', a: 'No. Argo Method no sustituye a psicólogos deportivos ni a especialistas en desarrollo infantil. Es una herramienta de observación conductual que ofrece un punto de partida para individualizar el acompañamiento deportivo.' },
        { q: '¿Cuánto cuesta?', a: 'La experiencia es gratuita durante esta etapa.' },
        { q: '¿Qué datos recopilan?', a: 'Nombre del adulto, email, nombre del menor, edad y deporte. Las respuestas del juego se usan exclusivamente para generar el informe. No vendemos ni compartimos datos con terceros.' },
    ],
    en: [
        { q: 'What is Argo Method?', a: 'There are no incorrect children — only children who haven\'t yet found an adult who understands them. Argo Method is a behavioral profiling tool for young athletes (ages 8 to 16) based on the DISC model. Through a 12-minute gamified experience, it generates a personalized report that helps the responsible adult understand how the child thinks, feels, and reacts in sports contexts.' },
        { q: 'What is the DISC model?', a: 'DISC is a behavioral observation model used worldwide for over 30 years. It describes four behavioral patterns: Driver (action and results oriented), Connector (people and energy oriented), Sustainer (stability and team oriented), and Strategist (analysis and precision oriented). Argo adapts this framework to youth sports with child-friendly language, gamification, and an additional layer — the Engine — that measures each athlete\'s processing pace.' },
        { q: 'Who receives the report?', a: 'The adult who accompanies the athlete: coaches, parents, or representatives of sports institutions. The report is sent by email when the experience ends. It\'s not a report for the child — it\'s a tool for the adult to better support them.' },
        { q: 'Does the child need to create an account?', a: 'No. Only a brief form with name, age, and sport is needed. No passwords, no downloads, no installations.' },
        { q: 'How long does the experience take?', a: 'About 12 minutes. An interactive adventure with mini-games and decisions, presented with a nautical theme. The child answers them alone, in a quiet environment.' },
        { q: 'Are there correct or incorrect answers?', a: 'No. Each answer reflects a behavioral tendency, not a right or wrong choice. No abilities are measured and no diagnoses are issued. All answers are valid.' },
        { q: 'Is it a psychological test?', a: 'No. Argo Method does not replace sports psychologists or child development specialists. It\'s a behavioral observation tool that offers a starting point for individualizing sports coaching.' },
        { q: 'How much does it cost?', a: 'The experience is free during this stage.' },
        { q: 'What data do you collect?', a: 'Adult\'s name, email, child\'s name, age, and sport. Game answers are used exclusively to generate the report. We do not sell or share data with third parties.' },
    ],
    pt: [
        { q: 'O que é o Argo Method?', a: 'Não existem crianças incorretas — existem crianças que ainda não encontraram um adulto que as compreenda. Argo Method é uma ferramenta de perfilamento comportamental para jovens atletas (8 a 16 anos) baseada no modelo DISC. Através de uma experiência gamificada de 10 minutos, gera um relatório personalizado que ajuda o adulto responsável a entender como a criança pensa, sente e reage em contextos esportivos.' },
        { q: 'O que é o modelo DISC?', a: 'DISC é um modelo de comportamento observável utilizado em todo o mundo há mais de 30 anos. Descreve quatro padrões comportamentais: Impulsionador (orientado à ação e resultados), Conector (orientado às pessoas e energia), Sustentador (orientado à estabilidade e equipe) e Estrategista (orientado à análise e precisão). Argo adapta esse modelo ao esporte juvenil com linguagem para crianças, gamificação e uma camada adicional — o Motor — que mede o ritmo de processamento de cada atleta.' },
        { q: 'Para quem é o relatório?', a: 'Para o adulto que acompanha o atleta: treinadores, pais, mães ou representantes de instituições esportivas. O relatório chega por email ao finalizar a experiência. Não é um relatório para a criança — é uma ferramenta para que o adulto possa acompanhá-la melhor.' },
        { q: 'A criança precisa criar uma conta?', a: 'Não. Apenas um formulário breve com nome, idade e esporte. Sem senhas, sem downloads, sem instalar nada.' },
        { q: 'Quanto tempo dura a experiência?', a: 'Aproximadamente 10 minutos. Uma aventura interativa com mini-jogos e decisões, apresentada com temática náutica. A criança responde sozinha, em um ambiente tranquilo.' },
        { q: 'Existem respostas certas ou erradas?', a: 'Não. Cada resposta reflete uma tendência comportamental, não um acerto ou erro. Não se medem capacidades nem se emitem diagnósticos. Todas as respostas são válidas.' },
        { q: 'É um teste psicológico?', a: 'Não. Argo Method não substitui psicólogos esportivos nem especialistas em desenvolvimento infantil. É uma ferramenta de observação comportamental que oferece um ponto de partida para individualizar o acompanhamento esportivo.' },
        { q: 'Quanto custa?', a: 'A experiência é gratuita durante esta etapa.' },
        { q: 'Quais dados são coletados?', a: 'Nome do adulto, email, nome da criança, idade e esporte. As respostas do jogo são usadas exclusivamente para gerar o relatório. Não vendemos nem compartilhamos dados com terceiros.' },
    ],
};

// ─── Slot machine — generates a fresh random config per transition ────────────
const randomSlotConf = () => [0, 1, 2].map(() => ({
    dir: Math.random() > 0.5 ? 1 : -1,
    delay: Math.random() * 0.22,
    dur: 0.24 + Math.random() * 0.14,
}));

// ─── Language cycling ─────────────────────────────────────────────────────────
const OTHER_LANGS: Record<Lang, [Lang, Lang]> = { es: ['en', 'pt'], en: ['es', 'pt'], pt: ['es', 'en'] };

// ─── Components ──────────────────────────────────────────────────────────────

const Divider = () => (
    <div className="border-t border-argo-border" />
);

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <p style={{ fontWeight: 400, letterSpacing: '0.14em', fontSize: '10px' }}
       className="text-argo-grey uppercase mb-6">
        {children}
    </p>
);

// ─── FAQ accordion item ──────────────────────────────────────────────────────

const FaqItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="py-5">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-start justify-between gap-4 text-left cursor-pointer"
            >
                <span style={{ fontWeight: 500, fontSize: '16px', letterSpacing: '-0.01em', color: '#1D1D1F' }}>
                    {question}
                </span>
                {open
                    ? <Minus size={18} className="text-[#86868B] mt-0.5 shrink-0" />
                    : <Plus  size={18} className="text-[#86868B] mt-0.5 shrink-0" />}
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.25, 0, 0, 1] }}
                        className="overflow-hidden"
                    >
                        <p style={{ fontWeight: 400, fontSize: '15px', color: '#424245', lineHeight: 1.75 }}
                           className="pt-3">
                            {answer}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ─── Flip card data ───────────────────────────────────────────────────────────

// Real storm questions from the game (Q5 + Q6), slightly shortened for the card
const FLIP_QUESTIONS = [
    {
        intro: 'Una tormenta inesperada sacude el Argo. El equipo te necesita.',
        text: 'En medio del lío de la tormenta...',
        options: [
            'Me agarro y sigo haciendo mi tarea',
            'Me muevo rápido a donde me necesiten',
            'Pausa breve: busco el orden en el caos',
            'Busco la mirada de mis compañeros',
        ],
    },
    {
        intro: 'El barco se inclina de golpe. Todo se sacude a tu alrededor.',
        text: '¿Qué te sale hacer en ese segundo?',
        options: [
            '¡Vamos equipo! para que el ánimo no caiga',
            'Agarro lo primero para enderezar el barco',
            'Busco qué cambió para saber cómo arreglarlo',
            'Me quedo firme para dar equilibrio al grupo',
        ],
    },
];

const CARD_COLORS = ['#3B82F6', '#F59E0B', '#8B5CF6', '#10B981'] as const;


// ─── FlipCard ────────────────────────────────────────────────────────────────

const AXIS_BARS: Record<string, Record<string, number>> = {
    D: { D: 88, I: 34, S: 22, C: 45 },
    I: { D: 42, I: 85, S: 38, C: 28 },
    S: { D: 25, I: 55, S: 90, C: 40 },
    C: { D: 38, I: 22, S: 45, C: 88 },
};

const ANALYSIS_LABELS: Record<string, Record<Lang, string>> = {
    D: { es: 'Respuesta ante el reto',  en: 'Response to challenge',   pt: 'Resposta ao desafio' },
    I: { es: 'Vínculo con el equipo',   en: 'Bond with the team',      pt: 'Vínculo com a equipe' },
    S: { es: 'Constancia y sostén',     en: 'Consistency and support', pt: 'Constância e suporte' },
    C: { es: 'Análisis y precisión',    en: 'Analysis and precision',  pt: 'Análise e precisão' },
};

const DISC_IDX: Record<string, number> = { D: 0, I: 1, S: 2, C: 3 };

const STEP_LABELS: Record<Lang, [string, string, string]> = {
    es: ['El niño juega',  'Argo procesa',   'El perfil'],
    en: ['Child plays',    'Argo processes', 'The profile'],
    pt: ['A criança joga', 'Argo processa',  'O perfil'],
};

const CARD_H = 440;

// Communication tips per behavioral axis
const COMM_TIPS: Record<string, {
    bridgeEs: string[]; bridgeEn: string[]; bridgePt: string[];
    avoidEs:  string[]; avoidEn:  string[]; avoidPt:  string[];
}> = {
    D: {
        bridgeEs: ['Reto', 'Directo', 'Logra'],       bridgeEn: ['Challenge', 'Direct', 'Achieve'],    bridgePt: ['Desafio', 'Direto', 'Conquista'],
        avoidEs:  ['Espera', 'Sin razón'],             avoidEn:  ['Wait', 'No reason'],                avoidPt:  ['Espera', 'Sem motivo'],
    },
    I: {
        bridgeEs: ['Equipo', 'Juntos', 'Genial'],      bridgeEn: ['Team', 'Together', 'Great'],         bridgePt: ['Equipe', 'Juntos', 'Incrível'],
        avoidEs:  ['Solo', 'Aburrido'],                avoidEn:  ['Alone', 'Boring'],                  avoidPt:  ['Sozinho', 'Chato'],
    },
    S: {
        bridgeEs: ['Seguro', 'Paso a paso', 'Juntos'], bridgeEn: ['Safe', 'Step by step', 'Together'],  bridgePt: ['Seguro', 'Passo a passo', 'Juntos'],
        avoidEs:  ['De repente', 'Sin avisar'],        avoidEn:  ['Suddenly', 'No warning'],            avoidPt:  ['De repente', 'Sem avisar'],
    },
    C: {
        bridgeEs: ['¿Por qué?', 'Exacto', 'Con calma'],bridgeEn: ['Why?', 'Precise', 'Calmly'],         bridgePt: ['Por quê?', 'Exato', 'Com calma'],
        avoidEs:  ['Apresúrate', 'Sin datos'],         avoidEn:  ['Hurry up', 'No data'],               avoidPt:  ['Apressa-te', 'Sem dados'],
    },
};

type CardFace = 'game' | 'analysis' | 'profile';

const FlipCard: React.FC = () => {
    const { lang }  = useLang();
    const [qIdx,   setQIdx]   = useState(0);
    const [fpIdx,  setFpIdx]  = useState(0);
    const [face,   setFace]   = useState<CardFace>('game');
    const [selOpt, setSelOpt] = useState<number | null>(null);
    const [bars0,  setBars0]  = useState(false);
    const [paused, setPaused] = useState(false);

    useEffect(() => {
        if (paused) return;
        if (face === 'game') {
            const t1 = setTimeout(() => setSelOpt(Math.floor(Math.random() * 4)), 1500);
            const t2 = setTimeout(() => { setSelOpt(null); setBars0(false); setFace('analysis'); }, 5500);
            return () => { clearTimeout(t1); clearTimeout(t2); };
        }
        if (face === 'analysis') {
            const t1 = setTimeout(() => setBars0(true), 180);
            const t2 = setTimeout(() => setFace('profile'), 4500);
            return () => { clearTimeout(t1); clearTimeout(t2); };
        }
        // profile
        const t = setTimeout(() => {
            setFace('game');
            setQIdx( i => (i + 1) % FLIP_QUESTIONS.length);
            setFpIdx(i => (i + 1) % ROTATING_PROFILES.length);
        }, 6000);
        return () => clearTimeout(t);
    }, [face, paused]);

    const jumpToFace = (target: CardFace) => {
        setSelOpt(null);
        setBars0(false);
        setFace(target);
    };

    const q  = FLIP_QUESTIONS[qIdx];
    const fp = ROTATING_PROFILES[fpIdx];
    const axBars = AXIS_BARS[fp.eje] ?? AXIS_BARS.D;

    const archetypeName = lang === 'es' ? fp.archetypeEs   : lang === 'pt' ? fp.archetypePt   : fp.archetypeEn;
    const ejeLabel      = lang === 'es' ? fp.ejeLabelEs    : lang === 'pt' ? fp.ejeLabelPt    : fp.ejeLabelEn;
    const motorLabel    = lang === 'es' ? fp.motorEs       : lang === 'pt' ? fp.motorPt       : fp.motorEn;
    const motorDesc     = lang === 'es' ? fp.motorDescEs   : lang === 'pt' ? fp.motorDescPt   : fp.motorDescEn;
    const behaviors     = lang === 'es' ? fp.behaviorsEs   : lang === 'pt' ? fp.behaviorsPt   : fp.behaviorsEn;
    const archIdx       = DISC_IDX[fp.eje] * 3 + (3 - fp.motorBars);
    const richDesc      = ARCHETYPE_DESCRIPTIONS[archIdx]?.[lang] ?? '';
    const comm          = COMM_TIPS[fp.eje] ?? COMM_TIPS.D;
    const bridge        = lang === 'es' ? comm.bridgeEs : lang === 'pt' ? comm.bridgePt : comm.bridgeEn;
    const avoid         = lang === 'es' ? comm.avoidEs  : lang === 'pt' ? comm.avoidPt  : comm.avoidEn;

    const stepIdx = face === 'game' ? 0 : face === 'analysis' ? 1 : 2;
    const steps   = STEP_LABELS[lang];

    return (
        <div className="select-none">
            <div
                style={{ perspective: '1200px' }}
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
            >
            <AnimatePresence mode="wait">
                <motion.div
                    key={face}
                    initial={{ rotateY: 90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    exit={{ rotateY: -90, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.25, 0, 0, 1] }}
                    style={{ transformOrigin: 'center center', height: CARD_H }}
                >

                    {/* ── GAME FACE ── */}
                    {face === 'game' && (
                        <div style={{
                            borderRadius: '20px', overflow: 'hidden', height: '100%',
                            position: 'relative', boxShadow: '0 12px 52px rgba(0,0,0,0.22)',
                        }}>
                            <img
                                src="/scenes/storm.png"
                                alt=""
                                aria-hidden="true"
                                style={{
                                    position: 'absolute', inset: 0,
                                    width: '100%', height: '100%',
                                    objectFit: 'cover', objectPosition: 'center',
                                }}
                            />
                            <div style={{
                                position: 'absolute', inset: 0,
                                background: 'linear-gradient(165deg, rgba(5,10,20,0.78) 0%, rgba(5,15,30,0.88) 100%)',
                            }} />
                            <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
                                {/* Chapter header */}
                                <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
                                     className="flex items-center justify-between">
                                    <span style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                                        La Tormenta
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        {[0,1,2,3,4,5,6].map(i => (
                                            <div key={i} style={{
                                                width: i === 4 ? 9 : 6, height: i === 4 ? 9 : 6, borderRadius: '50%',
                                                background: i < 4 ? 'rgba(34,211,238,0.6)' : i === 4 ? '#ffffff' : 'rgba(255,255,255,0.18)',
                                            }} />
                                        ))}
                                    </div>
                                </div>

                                {/* Story intro */}
                                <p style={{ padding: '16px 18px 4px', fontSize: '11px', fontStyle: 'italic', color: 'rgba(255,255,255,0.32)', lineHeight: 1.55 }}>
                                    {q.intro}
                                </p>

                                {/* Question */}
                                <AnimatePresence mode="wait">
                                    <motion.p
                                        key={qIdx}
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -4 }}
                                        transition={{ duration: 0.22 }}
                                        style={{ padding: '10px 18px 16px', fontSize: '16px', fontWeight: 500, color: '#fff', lineHeight: 1.4, letterSpacing: '-0.01em' }}
                                    >
                                        {q.text}
                                    </motion.p>
                                </AnimatePresence>

                                {/* Options 2×2 */}
                                <div style={{ padding: '0 14px 18px', flex: 1 }} className="grid grid-cols-2 gap-2 content-start">
                                    {q.options.map((opt, i) => (
                                        <motion.div
                                            key={`${qIdx}-${i}`}
                                            animate={{
                                                backgroundColor: selOpt === i ? `${CARD_COLORS[i]}22` : 'rgba(255,255,255,0.05)',
                                                borderColor:     selOpt === i ? CARD_COLORS[i]        : 'rgba(255,255,255,0.1)',
                                                opacity:         selOpt !== null && selOpt !== i ? 0.34 : 1,
                                            }}
                                            transition={{ duration: 0.22 }}
                                            style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '13px', padding: '11px 11px' }}
                                        >
                                            <div style={{
                                                width: 28, height: 28, borderRadius: '8px',
                                                background: CARD_COLORS[i],
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                marginBottom: '9px', flexShrink: 0,
                                            }}>
                                                <span style={{ fontSize: '11px', fontWeight: 800, color: '#fff' }}>{String.fromCharCode(65 + i)}</span>
                                            </div>
                                            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.82)', lineHeight: 1.48 }}>{opt}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── ANALYSIS FACE ── */}
                    {face === 'analysis' && (
                        <div style={{
                            borderRadius: '20px', background: '#F8F8FA', height: '100%',
                            border: '1px solid #E8E8ED', padding: '28px 24px',
                            boxShadow: '0 4px 32px rgba(0,0,0,0.06)',
                            display: 'flex', flexDirection: 'column',
                        }}>
                            <div className="flex items-center gap-2.5 mb-4">
                                <motion.div
                                    animate={{ scale: [1, 1.4, 1] }}
                                    transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                                    style={{ width: 8, height: 8, borderRadius: '50%', background: '#955FB5', flexShrink: 0 }}
                                />
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#1D1D1F', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
                                    {lang === 'es' ? 'Argo analiza' : lang === 'pt' ? 'Argo analisa' : 'Argo analyzes'}
                                </span>
                            </div>
                            <p style={{ fontSize: '13px', color: '#424245', lineHeight: 1.65, marginBottom: '20px' }}>
                                {lang === 'es'
                                    ? 'Argo cruza las 12 respuestas del juego con patrones conductuales para construir el perfil único de este deportista.'
                                    : lang === 'pt'
                                    ? 'Argo cruza as 12 respostas do jogo com padrões comportamentais para construir o perfil único deste atleta.'
                                    : 'Argo cross-references the 12 game responses with behavioral patterns to build this athlete\'s unique profile.'}
                            </p>
                            <div className="space-y-4" style={{ flex: 1 }}>
                                {(['D', 'I', 'S', 'C'] as const).map((axis, ai) => (
                                    <div key={axis}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span style={{ fontSize: '10px', fontWeight: 600, color: '#86868B' }}>
                                                {ANALYSIS_LABELS[axis][lang]}
                                            </span>
                                            <motion.span
                                                animate={{ opacity: bars0 ? 1 : 0 }}
                                                transition={{ delay: ai * 0.1 + 0.5 }}
                                                style={{ fontSize: '10px', fontWeight: 600, color: '#86868B' }}
                                            >
                                                {axBars[axis]}%
                                            </motion.span>
                                        </div>
                                        <div style={{ height: '5px', background: '#E8E8ED', borderRadius: 3, overflow: 'hidden' }}>
                                            <motion.div
                                                animate={{ width: bars0 ? `${axBars[axis]}%` : '3%' }}
                                                transition={{ duration: 0.65, delay: ai * 0.1, ease: [0.25, 0, 0, 1] }}
                                                style={{ height: '100%', background: AXIS_COLORS[axis], borderRadius: 3 }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* Motor note */}
                            <motion.div
                                animate={{ opacity: bars0 ? 1 : 0 }}
                                transition={{ delay: 0.8 }}
                                style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #E8E8ED' }}
                                className="flex items-center gap-2.5"
                            >
                                <div className="flex items-center gap-1">
                                    {[1,2,3].map(b => (
                                        <div key={b} style={{ height: 3, width: 12, borderRadius: 2, backgroundColor: b <= fp.motorBars ? '#1D1D1F' : '#D2D2D7' }} />
                                    ))}
                                </div>
                                <span style={{ fontSize: '10px', fontWeight: 700, color: '#1D1D1F' }}>{motorLabel}</span>
                                <span style={{ fontSize: '10px', color: '#AEAEB2' }}>·</span>
                                <span style={{ fontSize: '10px', color: '#86868B', lineHeight: 1.4 }}>{motorDesc}</span>
                            </motion.div>
                        </div>
                    )}

                    {/* ── PROFILE FACE ── */}
                    {face === 'profile' && (
                        <div style={{
                            borderRadius: '20px', background: '#fff', height: '100%',
                            border: '1px solid #E8E8ED', padding: '28px 24px',
                            boxShadow: '0 4px 32px rgba(0,0,0,0.07)',
                            display: 'flex', flexDirection: 'column', overflow: 'hidden',
                        }}>
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-2">
                                    <div style={{ width: 9, height: 9, borderRadius: '50%', background: AXIS_COLORS[fp.eje], flexShrink: 0 }} />
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: AXIS_COLORS[fp.eje], letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>{ejeLabel}</span>
                                </div>
                                <span style={{ fontSize: '10px', fontWeight: 500, color: '#86868B', background: '#F5F5F7', borderRadius: '20px', padding: '3px 10px' }}>{motorLabel}</span>
                            </div>
                            <p style={{ fontWeight: 300, fontSize: '24px', letterSpacing: '-0.025em', color: '#1D1D1F', lineHeight: 1.15, marginBottom: '14px' }}>{archetypeName}</p>
                            <div className="flex flex-wrap gap-1.5 mb-4">
                                {(behaviors as string[]).map(b => (
                                    <span key={b} style={{ fontSize: '11px', fontWeight: 500, color: AXIS_COLORS[fp.eje], background: `${AXIS_COLORS[fp.eje]}14`, borderRadius: '20px', padding: '3px 10px' }}>{b}</span>
                                ))}
                            </div>
                            <div className="flex items-center gap-2 mb-5">
                                {[1, 2, 3].map(b => (
                                    <div key={b} style={{ height: 3, width: 20, borderRadius: 2, backgroundColor: b <= fp.motorBars ? '#1D1D1F' : '#D2D2D7' }} />
                                ))}
                            </div>
                            <p style={{ fontSize: '13px', color: '#424245', lineHeight: 1.65, marginBottom: '16px' }}>{richDesc}</p>
                            <div style={{ marginTop: 'auto', paddingTop: '14px', borderTop: '1px solid #F5F5F7' }}>
                                <div className="flex items-start gap-2 mb-2">
                                    <span style={{ fontSize: '9px', fontWeight: 700, color: '#86868B', letterSpacing: '0.1em', textTransform: 'uppercase', paddingTop: '3px', flexShrink: 0, whiteSpace: 'nowrap' }}>
                                        {lang === 'es' ? 'Palabras puente' : lang === 'pt' ? 'Palavras ponte' : 'Bridge words'}
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {bridge.map(w => (
                                            <span key={w} style={{ fontSize: '10px', fontWeight: 500, color: AXIS_COLORS[fp.eje], background: `${AXIS_COLORS[fp.eje]}12`, borderRadius: '20px', padding: '2px 9px' }}>{w}</span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span style={{ fontSize: '9px', fontWeight: 700, color: '#86868B', letterSpacing: '0.1em', textTransform: 'uppercase', paddingTop: '3px', flexShrink: 0, whiteSpace: 'nowrap' }}>
                                        {lang === 'es' ? 'Palabras a evitar' : lang === 'pt' ? 'Palavras a evitar' : 'Words to avoid'}
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {avoid.map(w => (
                                            <span key={w} style={{ fontSize: '10px', fontWeight: 500, color: '#86868B', background: '#F5F5F7', borderRadius: '20px', padding: '2px 9px' }}>{w}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </motion.div>
            </AnimatePresence>
            </div>

            {/* ── Step indicator ── */}
            <div className="flex items-center justify-center mt-5">
                {steps.map((label, i) => {
                    const target: CardFace = i === 0 ? 'game' : i === 1 ? 'analysis' : 'profile';
                    const active = i === stepIdx;
                    return (
                        <React.Fragment key={i}>
                            <button
                                onClick={() => jumpToFace(target)}
                                className="flex flex-col items-center gap-1.5"
                                style={{ cursor: 'pointer', background: 'none', border: 'none', padding: '4px 0' }}
                            >
                                <div style={{
                                    width: 7, height: 7, borderRadius: '50%',
                                    background: active ? '#955FB5' : '#D2D2D7',
                                    transition: 'background 0.3s ease',
                                }} />
                                <span style={{
                                    fontSize: '10px', fontWeight: active ? 600 : 400,
                                    color: active ? '#955FB5' : '#AEAEB2',
                                    transition: 'color 0.3s ease',
                                    whiteSpace: 'nowrap',
                                }}>{label}</span>
                            </button>
                            {i < 2 && (
                                <div style={{ width: 28, height: 1, background: '#E8E8ED', margin: '0 8px', marginBottom: '20px' }} />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};

// ─── Pricing section (inline in landing) ─────────────────────────────────────

const PricingFeature: React.FC<{ label: string; sub?: string }> = ({ label, sub }) => (
    <li className="flex items-start gap-2 py-[7px] border-b border-[#F5F5F7] last:border-b-0">
        <Check size={13} className="flex-shrink-0 mt-0.5" style={{ color: '#955FB5' }} />
        <span style={{ fontSize: '13px', color: '#424245' }}>
            {label}{sub && <span style={{ color: '#AEAEB2' }}> ({sub})</span>}
        </span>
    </li>
);

const PricingSection: React.FC<{
    L: (es: string, en: string, pt: string) => string;
    navigate: (path: string) => void;
    lang: string;
}> = ({ L, navigate }) => {
    const [annual, setAnnual] = useState(true);
    const [onePack, setOnePack] = useState<number | null>(null);
    const [oneEmail, setOneEmail] = useState('');
    const [oneLoading, setOneLoading] = useState(false);
    const [oneError, setOneError] = useState('');

    const handleOneBuy = async () => {
        if (!onePack || !oneEmail) return;
        setOneLoading(true);
        setOneError('');
        try {
            const res = await fetch('/api/one-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: oneEmail, pack_size: onePack }),
            });
            const data = await res.json();
            if (data.checkout_url) {
                window.location.href = data.checkout_url;
            } else {
                setOneError(L('Error al crear el checkout. Intenta de nuevo.', 'Checkout error. Try again.', 'Erro ao criar o checkout. Tente novamente.'));
                setOneLoading(false);
            }
        } catch {
            setOneError(L('Error de conexión. Intenta de nuevo.', 'Connection error. Try again.', 'Erro de conexão. Tente novamente.'));
            setOneLoading(false);
        }
    };

    const included = L('incluido', 'included', 'incluído');
    const unlimited = L('ilimitado', 'unlimited', 'ilimitado');

    return (
        <div>
            {/* Header */}
            <div className="text-center mb-10">
                <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#AEAEB2', marginBottom: '12px' }}>
                    {L('Precios', 'Pricing', 'Preços')}
                </p>
                <h2 style={{ fontWeight: 300, fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '12px' }} className="text-argo-navy">
                    {L('El plan que se ajusta a tu equipo', 'The plan that fits your team', 'O plano que se ajusta ao seu time')}
                </h2>
            </div>

            {/* Toggle */}
            <div className="flex items-center justify-center gap-3 mb-8">
                <span style={{ fontSize: '13px', fontWeight: annual ? 400 : 600, color: annual ? '#86868B' : '#1D1D1F' }}>{L('Mensual', 'Monthly', 'Mensal')}</span>
                <button
                    onClick={() => setAnnual(v => !v)}
                    style={{ width: '44px', height: '24px', borderRadius: '12px', position: 'relative', transition: 'background 0.2s', background: annual ? '#955FB5' : '#D2D2D7', border: 'none', cursor: 'pointer' }}
                >
                    <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '2px', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)', ...(annual ? { right: '2px' } : { left: '2px' }) }} />
                </button>
                <span style={{ fontSize: '13px', fontWeight: annual ? 600 : 400, color: annual ? '#1D1D1F' : '#86868B' }}>{L('Anual', 'Annual', 'Anual')}</span>
                {annual && (
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff', background: '#955FB5', padding: '3px 10px', borderRadius: '20px' }}>
                        {L('Ahorra hasta 21%', 'Save up to 21%', 'Economize até 21%')}
                    </span>
                )}
            </div>

            {/* Trial */}
            <div style={{ background: 'rgba(149,95,181,0.06)', border: '1px solid rgba(149,95,181,0.15)', borderRadius: '12px', padding: '14px 24px', textAlign: 'center', marginBottom: '32px' }}>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#955FB5', marginBottom: '2px' }}>
                    {L('Comienza con 14 días gratis', 'Start with 14 free days', 'Comece com 14 dias grátis')}
                </p>
                <p style={{ fontSize: '12px', color: '#86868B' }}>
                    {L(
                        'Dashboard completo, 8 deportistas, consultor IA. Sin tarjeta de crédito.',
                        'Full dashboard, 8 athletes, AI consultant. No credit card required.',
                        'Dashboard completo, 8 atletas, consultor IA. Sem cartão de crédito.',
                    )}
                </p>
            </div>

            {/* Plans */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-12">

                {/* PRO */}
                <div style={{ background: '#fff', borderRadius: '16px', padding: '28px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <p style={{ fontSize: '11px', fontWeight: 700, color: '#955FB5', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>PRO</p>
                        <span style={{ fontSize: '9px', fontWeight: 700, color: '#955FB5', background: 'rgba(149,95,181,0.1)', padding: '2px 7px', borderRadius: '4px', letterSpacing: '0.04em' }}>
                            {L('Precio beta', 'Beta price', 'Preço beta')}
                        </span>
                    </div>
                    <p style={{ fontSize: '34px', fontWeight: 700, color: '#1D1D1F', letterSpacing: '-0.03em', lineHeight: 1 }}>
                        {annual ? '$40' : '$49'} <span style={{ fontSize: '14px', fontWeight: 400, color: '#86868B' }}>/ {L('mes', 'mo', 'mês')}</span>
                    </p>
                    {annual ? (
                        <>
                            <div style={{ marginTop: '6px', marginBottom: '4px' }}>
                                <span style={{ fontSize: '13px', color: '#AEAEB2', textDecoration: 'line-through', marginRight: '6px' }}>$49/{L('mes', 'mo', 'mês')}</span>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#955FB5', background: 'rgba(149,95,181,0.1)', padding: '2px 8px', borderRadius: '6px' }}>{L('Ahorra 18%', 'Save 18%', 'Economize 18%')}</span>
                            </div>
                            <p style={{ fontSize: '12px', color: '#AEAEB2', marginBottom: '16px' }}>
                                {L('Facturado como $480/año', 'Billed as $480/year', 'Cobrado como $480/ano')}
                            </p>
                        </>
                    ) : (
                        <p style={{ fontSize: '12px', color: '#AEAEB2', marginTop: '6px', marginBottom: '16px' }}>
                            {L('Facturación mensual', 'Billed monthly', 'Cobrança mensal')}
                        </p>
                    )}
                    <ul style={{ listStyle: 'none', flex: 1, marginBottom: '20px' }}>
                        <PricingFeature label={L('Consultor IA', 'AI Consultant', 'Consultor IA')} sub={included} />
                        <PricingFeature label={L('Hasta 50 jugadores activos', 'Up to 50 active players', 'Até 50 jogadores ativos')} />
                        <PricingFeature label={L('Grupos ilimitados', 'Unlimited groups', 'Grupos ilimitados')} />
                        <PricingFeature label={L('Guía situacional completa', 'Full situational guide', 'Guia situacional completo')} />
                        <PricingFeature label={L('Palabras puente y checklist', 'Bridge words & checklist', 'Palavras-ponte e checklist')} />
                        <PricingFeature label={L('Re-perfilamiento cada 6 meses', 'Re-profiling every 6 months', 'Re-perfilamento a cada 6 meses')} sub={included} />
                        <PricingFeature label={L('Dashboard completo', 'Full dashboard', 'Dashboard completo')} />
                    </ul>
                    <button
                        onClick={() => navigate('/signup')}
                        style={{ width: '100%', padding: '14px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, border: '1px solid #E8E8ED', background: '#fff', color: '#1D1D1F', cursor: 'pointer' }}
                    >
                        {L('Probar PRO gratis', 'Try PRO free', 'Testar PRO grátis')}
                    </button>
                    <p style={{ fontSize: '11px', color: '#AEAEB2', textAlign: 'center', marginTop: '8px' }}>
                        {L('Sin tarjeta de crédito · 14 días', 'No credit card · 14 days', 'Sem cartão · 14 dias')}
                    </p>
                </div>

                {/* ACADEMY */}
                <div style={{ background: '#fff', borderRadius: '16px', padding: '28px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', border: '2px solid #955FB5', position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '-11px', left: '50%', transform: 'translateX(-50%)', background: '#955FB5', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '3px 14px', borderRadius: '20px', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                        {L('Más popular', 'Most popular', 'Mais popular')}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <p style={{ fontSize: '11px', fontWeight: 700, color: '#955FB5', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Academy</p>
                        <span style={{ fontSize: '9px', fontWeight: 700, color: '#955FB5', background: 'rgba(149,95,181,0.1)', padding: '2px 7px', borderRadius: '4px', letterSpacing: '0.04em' }}>
                            {L('Precio beta', 'Beta price', 'Preço beta')}
                        </span>
                    </div>
                    <p style={{ fontSize: '34px', fontWeight: 700, color: '#1D1D1F', letterSpacing: '-0.03em', lineHeight: 1 }}>
                        {annual ? '$70' : '$89'} <span style={{ fontSize: '14px', fontWeight: 400, color: '#86868B' }}>/ {L('mes', 'mo', 'mês')}</span>
                    </p>
                    {annual ? (
                        <>
                            <div style={{ marginTop: '6px', marginBottom: '4px' }}>
                                <span style={{ fontSize: '13px', color: '#AEAEB2', textDecoration: 'line-through', marginRight: '6px' }}>$89/{L('mes', 'mo', 'mês')}</span>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#955FB5', background: 'rgba(149,95,181,0.1)', padding: '2px 8px', borderRadius: '6px' }}>{L('Ahorra 21%', 'Save 21%', 'Economize 21%')}</span>
                            </div>
                            <p style={{ fontSize: '12px', color: '#AEAEB2', marginBottom: '16px' }}>
                                {L('Facturado como $840/año', 'Billed as $840/year', 'Cobrado como $840/ano')}
                            </p>
                        </>
                    ) : (
                        <p style={{ fontSize: '12px', color: '#AEAEB2', marginTop: '6px', marginBottom: '16px' }}>
                            {L('Facturación mensual', 'Billed monthly', 'Cobrança mensal')}
                        </p>
                    )}
                    <ul style={{ listStyle: 'none', flex: 1, marginBottom: '20px' }}>
                        <PricingFeature label={L('Consultor IA', 'AI Consultant', 'Consultor IA')} sub={included} />
                        <PricingFeature label={L('Hasta 100 jugadores activos', 'Up to 100 active players', 'Até 100 jogadores ativos')} />
                        <PricingFeature label={L('Grupos ilimitados', 'Unlimited groups', 'Grupos ilimitados')} />
                        <PricingFeature label={L('Guía situacional completa', 'Full situational guide', 'Guia situacional completo')} />
                        <PricingFeature label={L('Palabras puente y checklist', 'Bridge words & checklist', 'Palavras-ponte e checklist')} />
                        <PricingFeature label={L('Re-perfilamiento cada 6 meses', 'Re-profiling every 6 months', 'Re-perfilamento a cada 6 meses')} sub={included} />
                        <PricingFeature label={L('Dashboard completo', 'Full dashboard', 'Dashboard completo')} />
                        <PricingFeature label={L('Multi-usuario', 'Multi-user access', 'Multi-usuário')} sub={L('varios coaches', 'multiple coaches', 'vários treinadores')} />
                        <PricingFeature label={L('Soporte prioritario', 'Priority support', 'Suporte prioritário')} />
                    </ul>
                    <button
                        onClick={() => navigate('/signup')}
                        style={{ width: '100%', padding: '14px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, border: 'none', background: '#955FB5', color: '#fff', cursor: 'pointer', boxShadow: '0 4px 18px rgba(149,95,181,0.25)' }}
                    >
                        {L('Probar Academy gratis', 'Try Academy free', 'Testar Academy grátis')}
                    </button>
                    <p style={{ fontSize: '11px', color: '#AEAEB2', textAlign: 'center', marginTop: '8px' }}>
                        {L('Sin tarjeta de crédito · 14 días', 'No credit card · 14 days', 'Sem cartão · 14 dias')}
                    </p>
                </div>

                {/* ENTERPRISE */}
                <div style={{ background: '#FAFAFA', borderRadius: '16px', padding: '28px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: '#1D1D1F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Enterprise</p>
                    <p style={{ fontSize: '22px', fontWeight: 700, color: '#1D1D1F', letterSpacing: '-0.02em', marginBottom: '4px' }}>
                        {L('A medida', 'Custom', 'Sob medida')}
                    </p>
                    <p style={{ fontSize: '12px', color: '#AEAEB2', marginBottom: '16px' }}>
                        {L('A partir de 150 jugadores', 'From 150 players', 'A partir de 150 jogadores')}
                    </p>
                    <ul style={{ listStyle: 'none', flex: 1, marginBottom: '20px' }}>
                        <PricingFeature label={L('Consultor IA', 'AI Consultant', 'Consultor IA')} sub={unlimited} />
                        <PricingFeature label={L('Jugadores ilimitados', 'Unlimited players', 'Jogadores ilimitados')} />
                        <PricingFeature label={L('Re-perfilamiento cada 6 meses', 'Re-profiling every 6 months', 'Re-perfilamento a cada 6 meses')} sub={included} />
                        <PricingFeature label={L('Grupos ilimitados', 'Unlimited groups', 'Grupos ilimitados')} />
                        <PricingFeature label={L('Dashboard completo + API', 'Full dashboard + API', 'Dashboard completo + API')} />
                        <PricingFeature label={L('Integraciones custom', 'Custom integrations', 'Integrações custom')} />
                        <PricingFeature label={L('Onboarding asistido', 'Assisted onboarding', 'Onboarding assistido')} />
                        <PricingFeature label={L('Soporte dedicado', 'Dedicated support', 'Suporte dedicado')} />
                    </ul>
                    <a
                        href="mailto:hola@argomethod.com"
                        style={{ display: 'block', width: '100%', padding: '14px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, border: '1px solid #E8E8ED', background: '#fff', color: '#1D1D1F', cursor: 'pointer', textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box' }}
                    >
                        {L('Contactar ventas', 'Contact sales', 'Contatar vendas')}
                    </a>
                </div>
            </div>

            {/* Argo One — compact with buy flow */}
            <div style={{ borderTop: '1px solid #E8E8ED', paddingTop: '32px' }}>
                <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#AEAEB2', marginBottom: '12px' }}>
                    {L('Padres y familias', 'Parents & families', 'Pais e famílias')}
                </p>
                <div style={{ background: '#fff', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-5">
                        <div className="flex-1">
                            <p style={{ fontSize: '15px', fontWeight: 600, color: '#1D1D1F', marginBottom: '4px' }}>Argo One</p>
                            <p style={{ fontSize: '13px', color: '#86868B', lineHeight: 1.6 }}>
                                {L(
                                    'Tu hijo juega una aventura de 10 minutos y recibes un informe personalizado con su perfil conductual, palabras clave para comunicarte mejor, y orientaciones concretas para acompañarlo. Sin suscripción, sin crear cuenta.',
                                    'Your child plays a 10-minute adventure and you receive a personalized report with their behavioral profile, key communication phrases, and concrete guidance. No subscription, no account needed.',
                                    'Seu filho joga uma aventura de 10 minutos e você recebe um relatório personalizado com o perfil comportamental, palavras-chave para se comunicar melhor e orientações concretas. Sem assinatura, sem criar conta.',
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Pack selector */}
                    <div className="flex gap-3 mb-4">
                        {[
                            { n: 1, price: '$14.99', each: '' },
                            { n: 3, price: '$34.99', each: '$11.66' },
                            { n: 5, price: '$49.99', each: '$10.00' },
                        ].map(p => (
                            <button
                                key={p.n}
                                onClick={() => setOnePack(p.n)}
                                style={{
                                    textAlign: 'center', padding: '12px 16px', borderRadius: '12px', minWidth: '96px', flex: 1,
                                    border: onePack === p.n ? '2px solid #955FB5' : '1px solid #E8E8ED',
                                    background: onePack === p.n ? 'rgba(149,95,181,0.04)' : '#fff',
                                    cursor: 'pointer', transition: 'all 0.2s',
                                }}
                            >
                                <p style={{ fontSize: '14px', fontWeight: 500, color: '#1D1D1F' }}>
                                    {p.n} {p.n === 1 ? L('informe', 'report', 'relatório') : L('informes', 'reports', 'relatórios')}
                                </p>
                                <p style={{ fontSize: '14px', fontWeight: 700, color: '#955FB5', marginTop: '2px' }}>{p.price}</p>
                                {p.each && <p style={{ fontSize: '10px', color: '#AEAEB2', marginTop: '1px' }}>{p.each} {L('por informe', 'per report', 'por relatório')}</p>}
                            </button>
                        ))}
                    </div>

                    {/* Email + buy */}
                    {onePack && (
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="email"
                                placeholder={L('Tu email', 'Your email', 'Seu email')}
                                value={oneEmail}
                                onChange={e => setOneEmail(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleOneBuy()}
                                style={{ flex: 1, padding: '12px 16px', borderRadius: '10px', border: '1px solid #D2D2D7', fontSize: '14px', outline: 'none' }}
                            />
                            <button
                                onClick={handleOneBuy}
                                disabled={oneLoading || !oneEmail}
                                style={{
                                    padding: '12px 24px', borderRadius: '10px', border: 'none', fontSize: '14px', fontWeight: 600,
                                    background: oneEmail ? '#955FB5' : '#D2D2D7', color: '#fff', cursor: oneEmail ? 'pointer' : 'default',
                                    opacity: oneLoading ? 0.6 : 1, transition: 'all 0.2s', whiteSpace: 'nowrap',
                                }}
                            >
                                {oneLoading
                                    ? '...'
                                    : L('Comprar', 'Buy', 'Comprar')
                                }
                            </button>
                        </div>
                    )}
                    {oneError && <p style={{ fontSize: '12px', color: '#DC2626', marginTop: '8px' }}>{oneError}</p>}
                </div>
            </div>
        </div>
    );
};

// ─── Landing ─────────────────────────────────────────────────────────────────

export const Landing: React.FC = () => {
    const navigate = useNavigate();
    const { lang, setLang } = useLang();

    // Trilingual helper
    const L = (es: string, en: string, pt: string) =>
        lang === 'es' ? es : lang === 'pt' ? pt : en;

    // Keyed lookup for archetype/profile suffix fields
    const langKey = (base: string) =>
        `${base}${lang === 'es' ? 'Es' : lang === 'pt' ? 'Pt' : 'En'}` as const;

    // Rotating profile index + random slot config per transition
    const [profileIdx, setProfileIdx] = useState(0);
    const slotConfRef = useRef(randomSlotConf());
    useEffect(() => {
        const id = setInterval(() => {
            slotConfRef.current = randomSlotConf();
            setProfileIdx(i => (i + 1) % ROTATING_PROFILES.length);
        }, 3000);
        return () => clearInterval(id);
    }, []);
    const profile = ROTATING_PROFILES[profileIdx];
    const slotConf = slotConfRef.current;

    // Selected archetype for description card (index into ARCHETYPES)
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

    // Helper to read suffix-keyed fields from profile/archetype objects
    const pk = (obj: Record<string, unknown>, base: string) =>
        obj[langKey(base)] as string;
    const pkArr = (obj: Record<string, unknown>, base: string) =>
        obj[langKey(base)] as string[];

    return (
        <div style={{ backgroundColor: '#ffffff', color: '#1D1D1F', fontFamily: 'Inter, sans-serif' }}
             className="min-h-screen" role="main">

            {/* ── NAV ── */}
            <nav style={{ borderBottom: '1px solid #D2D2D7' }}
                 className="sticky top-0 z-50 bg-white/95 backdrop-blur-md">
                <div className="max-w-5xl mx-auto px-4 md:px-6 h-12 flex items-center justify-between">
                    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-1.5" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <span style={{ fontSize: '18px', letterSpacing: '-0.02em', color: '#1D1D1F' }}>
                            <span style={{ fontWeight: 800 }}>Argo</span><span style={{ fontWeight: 100 }}> Method</span>
                        </span>
                        <span style={{ background: '#BBBCFF', color: '#1D1D1F', fontSize: '9px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.05em' }}>
                            beta
                        </span>
                    </button>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' })}
                            style={{ fontWeight: 500, fontSize: '12px', letterSpacing: '-0.01em' }}
                            className="text-argo-grey hover:text-argo-navy transition-colors hidden sm:block"
                        >
                            {L('Cómo funciona', 'How it works', 'Como funciona')}
                        </button>
                        <button
                            onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                            style={{ fontWeight: 500, fontSize: '12px', letterSpacing: '-0.01em' }}
                            className="text-argo-grey hover:text-argo-navy transition-colors"
                        >
                            {L('Precios', 'Pricing', 'Preços')}
                        </button>
                        <button
                            onClick={() => navigate('/signup?login=1')}
                            style={{ fontWeight: 500, fontSize: '12px', letterSpacing: '-0.01em' }}
                            className="text-argo-grey hover:text-argo-navy transition-colors hidden sm:block"
                        >
                            {L('Iniciar sesión', 'Log in', 'Entrar')}
                        </button>
                        <button
                            onClick={() => navigate('/signup')}
                            style={{
                                fontWeight: 500, fontSize: '12px', letterSpacing: '-0.01em',
                                backgroundColor: '#955FB5', color: '#fff',
                                borderRadius: '8px', padding: '6px 16px',
                            }}
                            className="hover:opacity-90 transition-opacity"
                        >
                            {L('14 días gratis', '14 days free', '14 dias grátis')}
                        </button>
                    </div>
                </div>
            </nav>

            {/* ── HERO ── */}
            <section className="relative max-w-5xl mx-auto px-4 md:px-6 pt-14 pb-8 md:pt-24 md:pb-12 overflow-hidden">
                <motion.div {...fadeUp(0)}>
                    <SectionLabel>
                        {L('Ciencia del Comportamiento', 'Behavioral Science', 'Ciência do Comportamento')}
                    </SectionLabel>
                </motion.div>

                <motion.h1
                    {...fadeUp(0.08)}
                    style={{
                        fontWeight: 300,
                        fontSize: 'clamp(1.9rem, 3.8vw, 3.2rem)',
                        lineHeight: 1.06,
                        letterSpacing: '-0.03em',
                        color: '#1D1D1F',
                        maxWidth: '820px',
                    }}
                    className="mb-8"
                >
                    {lang === 'en'
                        ? <>Every child is unique.<br />Argo discovers their ideal way of experiencing sport.</>
                        : lang === 'pt'
                        ? <>Cada criança é única.<br />O Argo descobre sua maneira ideal de viver o esporte.</>
                        : <>Cada niño es único.<br />Argo descubre su manera ideal de vivir el deporte.</>}
                </motion.h1>

                <motion.p
                    {...fadeUp(0.16)}
                    style={{ fontWeight: 400, fontSize: '17px', lineHeight: 1.65, color: '#424245', maxWidth: '560px' }}
                    className="mb-8"
                >
                    {L(
                        '10 minutos de juego para el niño, generan un mapa de sintonía inmediato para el club y la familia.',
                        'Based on the DISC + Engine methodology, we align the environment with the athlete\'s nature. A technical solution to eliminate sports stress and ensure children\'s genuine enjoyment.',
                        'Através de uma dinâmica gamificada baseada em DISC + Motor, alinhamos o ambiente com a natureza do atleta. Uma solução técnica para eliminar o estresse e garantir o prazer genuíno das crianças.',
                    )}
                </motion.p>

                <motion.div
                    {...fadeUp(0.20)}
                    className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-10"
                >
                    {[
                        { num: '01', text: 'El niño juega' },
                        { num: '02', text: 'Argo analiza su perfil' },
                        { num: '03', text: 'La institución y la familia reciben el informe' },
                    ].map(({ num, text }, i, arr) => (
                        <React.Fragment key={num}>
                            <div className="flex items-center gap-2">
                                <span style={{ fontWeight: 600, fontSize: '10px', color: '#86868B', letterSpacing: '0.08em' }}>{num}</span>
                                <span style={{ fontWeight: 400, fontSize: '13px', color: '#424245' }}>{text}</span>
                            </div>
                            {i < arr.length - 1 && (
                                <span style={{ color: '#D2D2D7', fontSize: '13px', lineHeight: 1 }}>→</span>
                            )}
                        </React.Fragment>
                    ))}
                </motion.div>

                <motion.div {...fadeUp(0.28)} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
                    <button
                        onClick={() => navigate('/signup')}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            backgroundColor: '#955FB5', color: '#fff',
                            fontWeight: 500, fontSize: '15px', letterSpacing: '-0.01em',
                            borderRadius: '8px', padding: '14px 28px',
                            border: 'none', cursor: 'pointer',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    >
                        {L('Iniciar prueba gratuita', 'Start free trial', 'Iniciar avaliação gratuita')}
                        <ArrowRight size={15} />
                    </button>
                    <button
                        onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            fontWeight: 500, fontSize: '13px', letterSpacing: '-0.01em',
                            color: '#86868B', background: 'none', border: 'none', cursor: 'pointer',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#1D1D1F')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#86868B')}
                    >
                        {L('Ver planes', 'See plans', 'Ver planos')}
                        <ArrowRight size={13} />
                    </button>
                </motion.div>

            </section>

            {/* ── LA HERRAMIENTA ── */}
            <div id="como-funciona" style={{ position: 'relative', paddingTop: '80px', paddingBottom: '80px', overflowX: 'clip' }}>
                {/* Violet strip — narrower than the card, creating the overflow effect */}
                <div style={{
                    position: 'absolute', left: 0, right: 0,
                    top: '128px', bottom: '128px',
                    background: '#E3E3FF',
                }} />
                {/* Floating white card — -mx-14 expands 56px each side to match other sections' content width */}
                <div className="max-w-5xl mx-auto px-4 md:px-6" style={{ position: 'relative', zIndex: 1 }}>
                    <motion.div
                        {...fadeUp(0)}
                        className="bg-white rounded-3xl p-8 md:p-14 md:-mx-14"
                        style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.09), 0 4px 20px rgba(0,0,0,0.05)' }}
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

                            {/* Text */}
                            <div>
                                <SectionLabel>La herramienta · Dos experiencias</SectionLabel>
                                <h2 style={{ fontWeight: 300, fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', lineHeight: 1.08, letterSpacing: '-0.025em' }}>
                                    Cómo funciona.
                                </h2>
                                <div className="mt-10 space-y-7">
                                    <div>
                                        <p style={{ fontWeight: 600, fontSize: '10px', letterSpacing: '0.12em', color: '#1D1D1F', textTransform: 'uppercase', marginBottom: '7px' }}>
                                            01 — El juego
                                        </p>
                                        <p style={{ fontSize: '15px', color: '#424245', lineHeight: 1.75 }}>
                                            Los niños experimentan una aventura gráfica de 10 minutos. Sus elecciones revelan su perfil conductual de forma natural, sin preguntas directas.
                                        </p>
                                    </div>
                                    <div>
                                        <p style={{ fontWeight: 600, fontSize: '10px', letterSpacing: '0.12em', color: '#1D1D1F', textTransform: 'uppercase', marginBottom: '7px' }}>
                                            02 — La plataforma
                                        </p>
                                        <p style={{ fontSize: '15px', color: '#424245', lineHeight: 1.75 }}>
                                            La institución conoce el perfil de cada deportista, consulta al asistente de IA y toma decisiones para que cada niño disfrute el deporte desde su naturaleza.
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-8 flex flex-wrap gap-2">
                                    {[
                                        { label: 'Mi equipo',           tip: 'El perfil conductual de cada deportista y su historial de informes.' },
                                        { label: 'Grupos de sintonía',  tip: 'Agrupa deportistas y entiende la dinámica colectiva de cada equipo.' },
                                        { label: 'Brújula situacional', tip: 'Guía para actuar según el perfil de cada niño en situaciones concretas del deporte.' },
                                        { label: 'Consultor IA',        tip: 'Hazle consultas sobre tus deportistas y recibe consejos personalizados.' },
                                    ].map(({ label, tip }) => (
                                        <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#424245', background: '#F5F5F7', border: '1px solid #E8E8ED', borderRadius: '20px', padding: '3px 8px 3px 11px' }}>
                                            {label}
                                            <InfoTip text={tip} position="top" />
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Flip card */}
                            <motion.div {...fadeUp(0.1)}>
                                <FlipCard />
                            </motion.div>

                        </div>
                    </motion.div>
                </div>
            </div>

            {/* ── EL MITO ── */}
            <div style={{ backgroundColor: '#ffffff' }}>
            <section className="max-w-5xl mx-auto px-4 md:px-6 py-16 md:py-32">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20">
                    <motion.div {...fadeUp(0)}>
                        <SectionLabel>
                            {L('El origen · La nave Argos', 'The origin · The Argo ship', 'A origem · O navio Argo')}
                        </SectionLabel>
                        <h2 style={{ fontWeight: 300, fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', lineHeight: 1.1, letterSpacing: '-0.025em' }}>
                            {{ es: <>50 especialistas.<br />Una sola misión.</>, en: <>50 specialists.<br />One single mission.</>, pt: <>50 especialistas.<br />Uma única missão.</> }[lang]}
                        </h2>
                        <div style={{ marginTop: '24px', display: 'inline-block', borderRadius: '12px', overflow: 'hidden', maxWidth: '280px' }}>
                            <img
                                src="/argonautas.jpg"
                                alt="Los argonautas"
                                style={{ display: 'block', width: '100%', opacity: 0.88 }}
                            />
                        </div>
                    </motion.div>

                    <motion.div {...fadeUp(0.1)} className="flex flex-col justify-center">
                        <p style={{ fontWeight: 400, fontSize: '16px', lineHeight: 1.75, color: '#424245' }} className="mb-6">
                            {L(
                                'En la mitología griega, la nave Argos cumplió su misión no porque todos sus tripulantes fueran iguales, sino porque cada uno ocupó el rol exacto según su naturaleza. Orfeo ponía el ritmo. Hércules, la fuerza. Tifis, el rumbo.',
                                'In Greek mythology, the Argo succeeded not because all her crew were equal, but because each occupied the exact role suited to their nature. Orpheus set the rhythm. Hercules, the strength. Tiphys, the course.',
                                'Na mitologia grega, o navio Argo cumpriu sua missão não porque todos os tripulantes fossem iguais, mas porque cada um ocupou o papel exato segundo sua natureza. Orfeu marcava o ritmo. Hércules, a força. Tífis, o rumo.',
                            )}
                        </p>
                        <p style={{ fontWeight: 400, fontSize: '16px', lineHeight: 1.75, color: '#424245' }}>
                            {L(
                                'Aplicamos esta sabiduría milenaria a la ciencia del comportamiento deportivo. No existen deportistas jóvenes incorrectos. Existen deportistas fuera de sintonía. Cuando alguien no disfruta del deporte, no es por falta de capacidad, es porque está ocupando un lugar en la tripulación que no le corresponde.',
                                'We apply this ancient wisdom to sports behavioral science. There are no wrong children. There are children out of sync. When a child does not enjoy sport, it is not from lack of ability, it is because they are filling a role in the crew that does not match their nature.',
                                'Aplicamos essa sabedoria milenar à ciência do comportamento esportivo. Não existem crianças incorretas. Existem crianças fora de sintonia. Quando uma criança não aproveita o esporte, não é por falta de capacidade — é porque está ocupando um lugar na tripulação que não lhe corresponde.',
                            )}
                        </p>
                    </motion.div>
                </div>
            </section>
            </div>

            {/* ── EL SISTEMA ── */}
            <div style={{ backgroundColor: '#F5F5F7' }}>
            <section className="max-w-5xl mx-auto px-4 md:px-6 py-16 md:py-32">
                <motion.div {...fadeUp(0)} className="mb-16">
                    <SectionLabel>
                        {L('El sistema · Tres dimensiones', 'The system · Three dimensions', 'O sistema · Três dimensões')}
                    </SectionLabel>
                    <h2 style={{ fontWeight: 300, fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', lineHeight: 1.1, letterSpacing: '-0.025em' }}>
                        {L('Conducta + Motor = Sintonía.', 'Behavior + Engine = Synergy.', 'Conduta + Motor = Sintonia.')}
                    </h2>

                    {/* Inline definitions */}
                    <div className="flex flex-wrap items-start gap-8 mt-8">
                        <div style={{ maxWidth: '160px' }}>
                            <p style={{ fontWeight: 500, fontSize: '11px', color: '#1D1D1F', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '5px' }}>
                                {L('Conducta', 'Behavior', 'Conduta')}
                            </p>
                            <p style={{ fontWeight: 400, fontSize: '13px', color: '#86868B', lineHeight: 1.5 }}>
                                {L('Cómo actúa bajo presión y en equipo', 'How they act under pressure and in a team', 'Como age sob pressão e em equipe')}
                            </p>
                        </div>
                        <span style={{ fontWeight: 300, fontSize: '22px', color: '#D2D2D7', paddingTop: '2px' }}>+</span>
                        <div style={{ maxWidth: '160px' }}>
                            <p style={{ fontWeight: 500, fontSize: '11px', color: '#1D1D1F', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '5px' }}>
                                Motor
                            </p>
                            <p style={{ fontWeight: 400, fontSize: '13px', color: '#86868B', lineHeight: 1.5 }}>
                                {L('A qué ritmo procesa y toma decisiones', 'At what pace they process and decide', 'Em que ritmo processa e toma decisões')}
                            </p>
                        </div>
                        <span style={{ fontWeight: 300, fontSize: '22px', color: '#D2D2D7', paddingTop: '2px' }}>=</span>
                        <div style={{ maxWidth: '180px' }}>
                            <p style={{ fontWeight: 500, fontSize: '11px', color: '#1D1D1F', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '5px' }}>
                                {L('Sintonía', 'Synergy', 'Sintonia')}
                            </p>
                            <p style={{ fontWeight: 400, fontSize: '13px', color: '#86868B', lineHeight: 1.5 }}>
                                {L('El lugar exacto donde disfruta y rinde', 'The exact place where they thrive', 'O lugar exato onde aproveita e rende')}
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Slot-machine rotating profile card */}
                <div
                    className="grid grid-cols-1 md:grid-cols-3 gap-px"
                    style={{ border: '1px solid #D2D2D7', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#D2D2D7' }}
                >
                    {/* Conducta */}
                    <div className="p-6 md:p-10 bg-white overflow-hidden">
                        <p style={{ fontWeight: 600, fontSize: '10px', letterSpacing: '0.14em', color: '#86868B' }} className="uppercase mb-6">
                            01 · {L('Conducta', 'Behavior', 'Conduta')}
                        </p>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`c-${profileIdx}`}
                                initial={{ opacity: 0, y: slotConf[0].dir * 24 }}
                                animate={{ opacity: 1, y: 0, transition: { duration: slotConf[0].dur, delay: slotConf[0].delay, ease: [0.25, 0, 0, 1] } }}
                                exit={{ opacity: 0, y: slotConf[0].dir * -24, transition: { duration: 0.2, ease: [0.25, 0, 0, 1] } }}
                            >
                                <div className="flex items-center gap-2 mb-5">
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: AXIS_COLORS[profile.eje], flexShrink: 0 }} />
                                    <p style={{ fontWeight: 300, fontSize: '20px', letterSpacing: '-0.02em', color: '#1D1D1F' }}>
                                        {pk(profile, 'ejeLabel')}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    {pkArr(profile, 'behaviors').map(b => (
                                        <div key={b} className="flex items-center gap-2">
                                            <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#D2D2D7', flexShrink: 0 }} />
                                            <span style={{ fontWeight: 400, fontSize: '13px', color: '#424245' }}>{b}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Motor */}
                    <div className="p-6 md:p-10 bg-white overflow-hidden">
                        <p style={{ fontWeight: 600, fontSize: '10px', letterSpacing: '0.14em', color: '#86868B' }} className="uppercase mb-6">
                            02 · Motor
                        </p>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`m-${profileIdx}`}
                                initial={{ opacity: 0, y: slotConf[1].dir * 24 }}
                                animate={{ opacity: 1, y: 0, transition: { duration: slotConf[1].dur, delay: slotConf[1].delay, ease: [0.25, 0, 0, 1] } }}
                                exit={{ opacity: 0, y: slotConf[1].dir * -24, transition: { duration: 0.2, ease: [0.25, 0, 0, 1] } }}
                            >
                                <div className="flex items-center gap-2 mb-5">
                                    {[1, 2, 3].map(b => (
                                        <div key={b} style={{
                                            height: 4, width: 24, borderRadius: 2,
                                            backgroundColor: b <= profile.motorBars ? '#1D1D1F' : '#D2D2D7',
                                        }} />
                                    ))}
                                    <span style={{ fontWeight: 300, fontSize: '20px', letterSpacing: '-0.02em', color: '#1D1D1F', marginLeft: 6 }}>
                                        {pk(profile, 'motor')}
                                    </span>
                                </div>
                                <p style={{ fontWeight: 400, fontSize: '13px', color: '#86868B', lineHeight: 1.55 }}>
                                    {pk(profile, 'motorDesc')}
                                </p>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Sintonía */}
                    <div className="p-6 md:p-10 bg-white overflow-hidden">
                        <p style={{ fontWeight: 600, fontSize: '10px', letterSpacing: '0.14em', color: '#86868B' }} className="uppercase mb-6">
                            03 · {L('Sintonía', 'Synergy', 'Sintonia')}
                        </p>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`s-${profileIdx}`}
                                initial={{ opacity: 0, y: slotConf[2].dir * 24 }}
                                animate={{ opacity: 1, y: 0, transition: { duration: slotConf[2].dur, delay: slotConf[2].delay, ease: [0.25, 0, 0, 1] } }}
                                exit={{ opacity: 0, y: slotConf[2].dir * -24, transition: { duration: 0.2, ease: [0.25, 0, 0, 1] } }}
                            >
                                <p style={{ fontWeight: 300, fontSize: '20px', letterSpacing: '-0.02em', color: '#1D1D1F', marginBottom: '12px', lineHeight: 1.2 }}>
                                    {pk(profile, 'archetype')}
                                </p>
                                <p style={{ fontWeight: 400, fontSize: '13px', color: '#86868B', lineHeight: 1.55 }}>
                                    {pk(profile, 'archetypeDesc')}
                                </p>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </section>
            </div>

            <Divider />

            {/* ── ARQUETIPOS ── */}
            <section className="max-w-5xl mx-auto px-4 md:px-6 py-16 md:py-32">
                <motion.div {...fadeUp(0)} className="mb-16">
                    <SectionLabel>
                        {L('La cartografía · 12 perfiles', 'The map · 12 profiles', 'A cartografia · 12 perfis')}
                    </SectionLabel>
                    <p style={{ fontWeight: 400, fontSize: '16px', color: '#424245', marginTop: '8px', maxWidth: '600px', lineHeight: 1.75 }}>
                        {L(
                            'Cada deportista tiene un ritmo y una forma única de procesar el juego. A través de la ciencia del comportamiento, identificamos estas tendencias naturales para que los adultos puedan crear el entorno de sintonía que cada niño necesita para disfrutar y permanecer en el deporte.',
                            'Every athlete has a unique rhythm and way of processing the game. Through behavioral science, we identify these natural tendencies so adults can create the attuned environment each child needs to enjoy and stay in sport.',
                            'Cada atleta tem um ritmo e uma forma única de processar o jogo. Através da ciência do comportamento, identificamos essas tendências naturais para que os adultos possam criar o ambiente de sintonia que cada criança precisa para aproveitar e permanecer no esporte.',
                        )}
                    </p>
                </motion.div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px"
                     style={{ border: '1px solid #D2D2D7', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#D2D2D7' }}>
                    {ARCHETYPES.map((arch, i) => {
                        const isSelected = selectedIdx === i;
                        const label = pk(arch, 'label');
                        const motor = pk(arch, 'motor');
                        return (
                            <motion.div
                                key={i}
                                {...fadeUp(i * 0.03)}
                                onClick={() => setSelectedIdx(isSelected ? null : i)}
                                style={{
                                    cursor: 'pointer',
                                    backgroundColor: isSelected ? AXIS_COLORS[arch.eje] : '#ffffff',
                                    transition: 'background-color 0.2s ease',
                                }}
                                className="p-4 md:p-6"
                            >
                                <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: isSelected ? 'rgba(255,255,255,0.6)' : AXIS_COLORS[arch.eje], marginBottom: '10px' }} />
                                <p style={{ fontWeight: 500, fontSize: '12px', color: isSelected ? '#ffffff' : '#1D1D1F', lineHeight: 1.3, marginBottom: '6px' }}>
                                    {label}
                                </p>
                                <p style={{ fontWeight: 400, fontSize: '10px', color: isSelected ? 'rgba(255,255,255,0.7)' : '#86868B', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                                    {motor}
                                </p>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Description card */}
                <AnimatePresence mode="wait">
                    {selectedIdx !== null && (
                        <motion.div
                            key={selectedIdx}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.35, ease: [0.25, 0, 0, 1] }}
                            style={{
                                marginTop: '20px',
                                padding: '28px 32px',
                                border: `1px solid ${AXIS_COLORS[ARCHETYPES[selectedIdx].eje]}40`,
                                borderLeft: `3px solid ${AXIS_COLORS[ARCHETYPES[selectedIdx].eje]}`,
                                borderRadius: '12px',
                                backgroundColor: '#F5F5F7',
                            }}
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: AXIS_COLORS[ARCHETYPES[selectedIdx].eje], flexShrink: 0 }} />
                                <p style={{ fontWeight: 500, fontSize: '12px', color: '#1D1D1F', letterSpacing: '0.02em' }}>
                                    {pk(ARCHETYPES[selectedIdx], 'label')}
                                </p>
                            </div>
                            <p style={{ fontWeight: 400, fontSize: '15px', color: '#424245', lineHeight: 1.75 }}>
                                {ARCHETYPE_DESCRIPTIONS[selectedIdx][lang]}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>

            <Divider />

            {/* ── SALVAGUARDA ÉTICA ── */}
            <section className="max-w-5xl mx-auto px-4 md:px-6 py-16 md:py-32">
                <div className="max-w-2xl mx-auto text-center">
                    <motion.div {...fadeUp(0)}>
                        <SectionLabel>
                            {L('Compromiso · Observador aliado', 'Commitment · Allied observer', 'Compromisso · Observador aliado')}
                        </SectionLabel>
                        <h2 style={{ fontWeight: 300, fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', lineHeight: 1.15, letterSpacing: '-0.025em' }} className="mb-8 text-argo-navy">
                            {L('Sin etiquetas. Sin juicios clínicos.', 'No labels. No clinical judgments.', 'Sem rótulos. Sem julgamentos clínicos.')}
                        </h2>
                        <p style={{ fontWeight: 400, fontSize: '16px', color: '#424245', lineHeight: 1.75 }} className="mb-4">
                            {L(
                                'Argo Method no clasifica capacidades ni predice futuros. No sustituye el trabajo de psicólogos deportivos ni especialistas en desarrollo infantil.',
                                'Argo Method does not classify abilities or predict futures. It does not replace sports psychologists or child development specialists.',
                                'Argo Method não classifica capacidades nem prevê futuros. Não substitui o trabalho de psicólogos esportivos nem de especialistas em desenvolvimento infantil.',
                            )}
                        </p>
                    </motion.div>
                </div>
            </section>

            <Divider />

            {/* ── PRICING ── */}
            <section id="pricing" className="max-w-5xl mx-auto px-4 md:px-6 py-16 md:py-32">
                <PricingSection L={L} navigate={navigate} lang={lang} />
            </section>

            <Divider />

            {/* ── FAQs ── */}
            <section className="max-w-5xl mx-auto px-4 md:px-6 py-16 md:py-32">
                <div className="max-w-2xl mx-auto">
                    <motion.div {...fadeUp(0)} className="text-center mb-12">
                        <SectionLabel>
                            {L('Preguntas frecuentes', 'Frequently asked questions', 'Perguntas frequentes')}
                        </SectionLabel>
                    </motion.div>

                    <motion.div {...fadeUp(0.1)} className="divide-y divide-[#D2D2D7]">
                        {FAQS[lang].map((faq, i) => (
                            <FaqItem key={i} question={faq.q} answer={faq.a} />
                        ))}
                    </motion.div>
                </div>
            </section>

            <Divider />

            {/* ── CTA FINAL ── */}
            <section className="max-w-5xl mx-auto px-4 md:px-6 py-16 md:py-32 text-center">
                <motion.div {...fadeUp(0)}>
                    <h2 style={{ fontWeight: 300, fontSize: 'clamp(2.2rem, 4.5vw, 3.8rem)', lineHeight: 1.08, letterSpacing: '-0.03em' }} className="mb-6 text-argo-navy">
                        {L('¿En qué lugar de la nave está tu atleta?', 'Where on the ship is your athlete?', 'Em que lugar do navio está seu atleta?')}
                    </h2>
                    <p style={{ fontWeight: 400, fontSize: '16px', color: '#86868B', marginBottom: '40px' }}>
                        {L(
                            '10 minutos. Un informe al email. Sin apps ni instalaciones.',
                            '12 minutes. A report to your inbox. No apps or installs.',
                            '10 minutos. Um relatório no email. Sem apps nem instalações.',
                        )}
                    </p>
                    <button
                        onClick={() => navigate('/signup')}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '10px',
                            backgroundColor: '#955FB5', color: '#fff',
                            fontWeight: 500, fontSize: '16px', letterSpacing: '-0.01em',
                            borderRadius: '8px', padding: '16px 36px',
                            border: 'none', cursor: 'pointer',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    >
                        {L('Iniciar prueba gratuita', 'Start free trial', 'Iniciar avaliação gratuita')}
                        <ArrowRight size={16} />
                    </button>
                </motion.div>
            </section>

            {/* ── FOOTER ── */}
            <footer style={{ borderTop: '1px solid #D2D2D7', backgroundColor: '#E3E3FF' }} className="py-10">
                <div className="max-w-5xl mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span style={{ fontSize: '18px', letterSpacing: '-0.02em', color: '#1D1D1F' }}>
                            <span style={{ fontWeight: 800 }}>Argo</span><span style={{ fontWeight: 100 }}> Method</span>
                        </span>
                        <span style={{ background: '#BBBCFF', color: '#1D1D1F', fontSize: '9px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.05em' }}>
                            beta
                        </span>
                        <span style={{ fontWeight: 400, fontSize: '11px', color: '#86868B', marginLeft: '4px' }}>
                            {L('Cartografía de Sintonía Deportiva', 'Sports Behavioral Mapping', 'Cartografia de Sintonia Esportiva')}
                        </span>
                    </div>
                    <div style={{ fontWeight: 400, fontSize: '11px', color: '#86868B', letterSpacing: '0.06em' }}
                         className="flex items-center gap-6 uppercase">
                        <span>v{APP_VERSION}</span>
                        <a href="https://www.yacare.io" target="_blank" rel="noopener noreferrer"
                           className="hover:text-argo-navy transition-colors" style={{ textDecoration: 'none' }}>
                            Yacaré Lab
                        </a>
                        <button
                            onClick={() => navigate('/blog')}
                            className="hover:text-argo-navy transition-colors"
                        >
                            Blog
                        </button>
                        <span>© 2026 Argo.</span>
                        {OTHER_LANGS[lang].map(l => (
                            <button
                                key={l}
                                onClick={() => setLang(l)}
                                className="hover:text-argo-navy transition-colors"
                            >
                                {l.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
            </footer>
        </div>
    );
};
