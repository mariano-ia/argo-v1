import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Plus, Minus } from 'lucide-react';
import { useLang, type Lang } from '../context/LangContext';
import { APP_VERSION } from '../lib/version';

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
        es: 'La columna vertebral del equipo. No busca el protagonismo, pero sin él nada funciona. Ejecuta con consistencia, apoya sin condiciones y mantiene el ritmo cuando los demás fallan. Necesita un entorno predecible y relaciones estables para dar lo mejor de sí.',
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
        es: 'Su talento no está en la velocidad de la carrera, sino en la claridad de su mirada. Tiende a procesar el entorno con profundidad antes de actuar, aportando calma y orden táctico incluso en momentos de presión. Para él, el deporte es un tablero que prefiere comprender antes de ejecutar.',
        en: 'Their talent lies not in the speed of the run, but in the clarity of their gaze. Tends to process the environment deeply before acting, bringing calm and tactical order even under pressure. For them, sport is a board they prefer to understand before executing.',
        pt: 'Seu talento não está na velocidade da corrida, mas na clareza do seu olhar. Tende a processar o ambiente com profundidade antes de agir, trazendo calma e ordem tática mesmo em momentos de pressão. Para ele, o esporte é um tabuleiro que prefere compreender antes de executar.',
    },
];

const EJE_COLOR: Record<string, string> = {
    D: '#f97316',
    I: '#f59e0b',
    S: '#22c55e',
    C: '#6366f1',
};

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
        { q: '¿Qué es Argo Method?', a: 'No hay niños incorrectos, hay niños que todavía no encontraron un adulto que los entienda. Argo Method es una herramienta de perfilamiento conductual para atletas jóvenes (8 a 16 años) basada en el modelo DISC. A través de una experiencia gamificada de 10 minutos, genera un informe personalizado que ayuda al adulto responsable a entender cómo piensa, siente y reacciona el niño en contextos deportivos.' },
        { q: '¿Para quién es el informe?', a: 'Para el adulto que acompaña al atleta: entrenadores, padres, madres o referentes de instituciones deportivas. El informe llega por email al finalizar la experiencia. No es un informe para el niño, es una herramienta para que el adulto pueda acompañarlo mejor.' },
        { q: '¿El niño necesita crear una cuenta?', a: 'No. Solo se completa un formulario breve con nombre, edad y deporte. Sin contraseñas, sin descargas, sin instalar nada.' },
        { q: '¿Cuánto dura la experiencia?', a: 'Aproximadamente 10 minutos. Son 12 decisiones rápidas presentadas como un juego con temática náutica. El niño las responde solo, en un ambiente tranquilo.' },
        { q: '¿Hay respuestas correctas o incorrectas?', a: 'No. Cada respuesta refleja una tendencia conductual, no un acierto ni un error. No se miden capacidades ni se emiten diagnósticos. Todas las respuestas son válidas.' },
        { q: '¿Es un test psicológico?', a: 'No. Argo Method no sustituye a psicólogos deportivos ni a especialistas en desarrollo infantil. Es una herramienta de observación conductual que ofrece un punto de partida para individualizar el acompañamiento deportivo.' },
        { q: '¿Cuánto cuesta?', a: 'La experiencia es gratuita durante esta etapa.' },
        { q: '¿Qué datos recopilan?', a: 'Nombre del adulto, email, nombre del niño, edad y deporte. Las respuestas del juego se usan exclusivamente para generar el informe. No vendemos ni compartimos datos con terceros.' },
    ],
    en: [
        { q: 'What is Argo Method?', a: 'There are no incorrect children — only children who haven\'t yet found an adult who understands them. Argo Method is a behavioral profiling tool for young athletes (ages 8 to 16) based on the DISC model. Through a 10-minute gamified experience, it generates a personalized report that helps the responsible adult understand how the child thinks, feels, and reacts in sports contexts.' },
        { q: 'Who receives the report?', a: 'The adult who accompanies the athlete: coaches, parents, or representatives of sports institutions. The report is sent by email when the experience ends. It\'s not a report for the child — it\'s a tool for the adult to better support them.' },
        { q: 'Does the child need to create an account?', a: 'No. Only a brief form with name, age, and sport is needed. No passwords, no downloads, no installations.' },
        { q: 'How long does the experience take?', a: 'About 10 minutes. It consists of 12 quick decisions presented as a nautical-themed game. The child answers them alone, in a quiet environment.' },
        { q: 'Are there correct or incorrect answers?', a: 'No. Each answer reflects a behavioral tendency, not a right or wrong choice. No abilities are measured and no diagnoses are issued. All answers are valid.' },
        { q: 'Is it a psychological test?', a: 'No. Argo Method does not replace sports psychologists or child development specialists. It\'s a behavioral observation tool that offers a starting point for individualizing sports coaching.' },
        { q: 'How much does it cost?', a: 'The experience is free during this stage.' },
        { q: 'What data do you collect?', a: 'Adult\'s name, email, child\'s name, age, and sport. Game answers are used exclusively to generate the report. We do not sell or share data with third parties.' },
    ],
    pt: [
        { q: 'O que é o Argo Method?', a: 'Não existem crianças incorretas — existem crianças que ainda não encontraram um adulto que as compreenda. Argo Method é uma ferramenta de perfilamento comportamental para jovens atletas (8 a 16 anos) baseada no modelo DISC. Através de uma experiência gamificada de 10 minutos, gera um relatório personalizado que ajuda o adulto responsável a entender como a criança pensa, sente e reage em contextos esportivos.' },
        { q: 'Para quem é o relatório?', a: 'Para o adulto que acompanha o atleta: treinadores, pais, mães ou representantes de instituições esportivas. O relatório chega por email ao finalizar a experiência. Não é um relatório para a criança — é uma ferramenta para que o adulto possa acompanhá-la melhor.' },
        { q: 'A criança precisa criar uma conta?', a: 'Não. Apenas um formulário breve com nome, idade e esporte. Sem senhas, sem downloads, sem instalar nada.' },
        { q: 'Quanto tempo dura a experiência?', a: 'Aproximadamente 10 minutos. São 12 decisões rápidas apresentadas como um jogo com temática náutica. A criança responde sozinha, em um ambiente tranquilo.' },
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
const NEXT_LANG: Record<Lang, Lang> = { es: 'en', en: 'pt', pt: 'es' };

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

// ─── Landing ─────────────────────────────────────────────────────────────────

export const Landing: React.FC = () => {
    const navigate = useNavigate();
    const { lang, setLang, t } = useLang();

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
                    <span className="flex items-center gap-1.5">
                        <span style={{ fontSize: '18px', letterSpacing: '-0.02em', color: '#1D1D1F' }}>
                            <span style={{ fontWeight: 800 }}>Argo</span><span style={{ fontWeight: 100 }}> Method</span>
                        </span>
                        <span style={{ background: '#BBBCFF', color: '#1D1D1F', fontSize: '9px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.05em' }}>
                            beta
                        </span>
                    </span>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setLang(NEXT_LANG[lang])}
                            style={{ fontWeight: 400, fontSize: '11px', letterSpacing: '0.06em' }}
                            className="text-argo-grey hover:text-argo-navy transition-colors uppercase"
                        >
                            {t.nav.lang}
                        </button>
                        <button
                            onClick={() => navigate('/signup')}
                            style={{ fontWeight: 500, fontSize: '12px', letterSpacing: '-0.01em' }}
                            className="text-argo-grey hover:text-argo-navy transition-colors"
                        >
                            {L('Ingresar', 'Log in', 'Entrar')}
                        </button>
                        <button
                            onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                            aria-label={L('Ver planes', 'See plans', 'Ver planos')}
                            style={{
                                fontWeight: 500, fontSize: '12px', letterSpacing: '-0.01em',
                                backgroundColor: '#955FB5', color: '#fff',
                                borderRadius: '8px', padding: '6px 16px',
                            }}
                            className="hover:opacity-90 transition-opacity"
                        >
                            {L('Ver planes', 'See plans', 'Ver planos')}
                        </button>
                    </div>
                </div>
            </nav>

            {/* ── HERO ── */}
            <section className="relative max-w-5xl mx-auto px-4 md:px-6 pt-20 pb-20 md:pt-32 md:pb-36 overflow-hidden">
                <motion.div {...fadeUp(0)}>
                    <SectionLabel>
                        {L('Ciencia del Comportamiento', 'Behavioral Science', 'Ciência do Comportamento')}
                    </SectionLabel>
                </motion.div>

                <motion.h1
                    {...fadeUp(0.08)}
                    style={{
                        fontWeight: 300,
                        fontSize: 'clamp(2.8rem, 6vw, 5rem)',
                        lineHeight: 1.06,
                        letterSpacing: '-0.03em',
                        color: '#1D1D1F',
                        maxWidth: '820px',
                    }}
                    className="mb-8"
                >
                    {L(
                        'Inteligencia deportiva para que cada niño disfrute el deporte.',
                        'Sports intelligence so every child can enjoy sport.',
                        'Inteligência esportiva para que cada criança aproveite o esporte.',
                    )}
                </motion.h1>

                <motion.p
                    {...fadeUp(0.16)}
                    style={{ fontWeight: 400, fontSize: '17px', lineHeight: 1.65, color: '#424245', maxWidth: '560px' }}
                    className="mb-12"
                >
                    {L(
                        'A través de una dinámica gamificada basada en DISC + Motor, alineamos el entorno con la naturaleza del deportista. Una solución técnica para eliminar el estrés y asegurar el disfrute genuino de los niños.',
                        'Based on the DISC + Engine methodology, we align the environment with the athlete\'s nature. A technical solution to eliminate sports stress and ensure children\'s genuine enjoyment.',
                        'Através de uma dinâmica gamificada baseada em DISC + Motor, alinhamos o ambiente com a natureza do atleta. Uma solução técnica para eliminar o estresse e garantir o prazer genuíno das crianças.',
                    )}
                </motion.p>

                <motion.div {...fadeUp(0.22)} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
                    <button
                        onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
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
                        {L('Empezar ahora', 'Get started', 'Começar agora')}
                        <ArrowRight size={15} />
                    </button>
                    <span style={{ fontWeight: 400, fontSize: '12px', color: '#86868B' }}>
                        {L(
                            '10 minutos para comprender mejor a tu pequeño atleta',
                            '10 minutes to better understand your young athlete',
                            '10 minutos para compreender melhor seu pequeno atleta',
                        )}
                    </span>
                </motion.div>

            </section>

            {/* ── EL MITO ── */}
            <div style={{ backgroundColor: '#E3E3FF' }}>
            <section className="max-w-5xl mx-auto px-4 md:px-6 py-16 md:py-32">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20">
                    <motion.div {...fadeUp(0)}>
                        <SectionLabel>
                            {L('El origen · La nave Argos', 'The origin · The Argo ship', 'A origem · O navio Argo')}
                        </SectionLabel>
                        <h2 style={{ fontWeight: 300, fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', lineHeight: 1.1, letterSpacing: '-0.025em' }}>
                            {{ es: <>50 especialistas.<br />Una sola misión.</>, en: <>50 specialists.<br />One single mission.</>, pt: <>50 especialistas.<br />Uma única missão.</> }[lang]}
                        </h2>
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
                                'Aplicamos esta sabiduría milenaria a la ciencia del comportamiento deportivo. No existen niños incorrectos. Existen niños fuera de sintonía. Cuando un niño no disfruta del deporte, no es por falta de capacidad, es porque está ocupando un lugar en la tripulación que no le corresponde.',
                                'We apply this ancient wisdom to sports behavioral science. There are no wrong children. There are children out of sync. When a child does not enjoy sport, it is not from lack of ability, it is because they are filling a role in the crew that does not match their nature.',
                                'Aplicamos essa sabedoria milenar à ciência do comportamento esportivo. Não existem crianças incorretas. Existem crianças fora de sintonia. Quando uma criança não aproveita o esporte, não é por falta de capacidade — é porque está ocupando um lugar na tripulação que não lhe corresponde.',
                            )}
                        </p>
                    </motion.div>
                </div>
            </section>
            </div>

            <Divider />

            {/* ── EL SISTEMA ── */}
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
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: EJE_COLOR[profile.eje], flexShrink: 0 }} />
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
                                    backgroundColor: isSelected ? EJE_COLOR[arch.eje] : '#ffffff',
                                    transition: 'background-color 0.2s ease',
                                }}
                                className="p-4 md:p-6"
                            >
                                <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: isSelected ? 'rgba(255,255,255,0.6)' : EJE_COLOR[arch.eje], marginBottom: '10px' }} />
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
                                border: `1px solid ${EJE_COLOR[ARCHETYPES[selectedIdx].eje]}40`,
                                borderLeft: `3px solid ${EJE_COLOR[ARCHETYPES[selectedIdx].eje]}`,
                                borderRadius: '12px',
                                backgroundColor: '#F5F5F7',
                            }}
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: EJE_COLOR[ARCHETYPES[selectedIdx].eje], flexShrink: 0 }} />
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

            {/* ── PRICING ── */}
            <section id="pricing" className="max-w-5xl mx-auto px-4 md:px-6 py-16 md:py-32">
                <motion.div {...fadeUp(0)} className="text-center mb-16">
                    <SectionLabel>
                        {L('Planes · Elige tu tripulación', 'Plans · Choose your crew', 'Planos · Escolha sua tripulação')}
                    </SectionLabel>
                    <h2 style={{ fontWeight: 300, fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', lineHeight: 1.1, letterSpacing: '-0.025em' }}>
                        {L('Un plan para cada necesidad.', 'A plan for every need.', 'Um plano para cada necessidade.')}
                    </h2>
                    <p style={{ fontWeight: 400, fontSize: '16px', color: '#86868B', marginTop: '12px' }}>
                        {L(
                            'Cada crédito es una experiencia completa: odisea + informe + email.',
                            'Each credit is a complete experience: odyssey + report + email.',
                            'Cada crédito é uma experiência completa: odisseia + relatório + email.',
                        )}
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Starter */}
                    <motion.div
                        {...fadeUp(0.05)}
                        className="bg-white border border-argo-border rounded-2xl p-8 flex flex-col"
                    >
                        <p className="text-[10px] font-semibold text-argo-grey uppercase tracking-widest mb-2">Starter</p>
                        <p style={{ fontWeight: 300, fontSize: '36px', letterSpacing: '-0.03em', color: '#1D1D1F' }}>
                            US$ 29
                        </p>
                        <p className="text-sm text-argo-grey mt-1 mb-6">10 {L('créditos', 'credits', 'créditos')}</p>
                        <ul className="space-y-3 text-sm text-[#424245] flex-1 mb-8">
                            <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">&#10003;</span> {L('Link de invitación único', 'Unique invitation link', 'Link de convite exclusivo')}</li>
                            <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">&#10003;</span> {L('Panel con resultados', 'Results dashboard', 'Painel com resultados')}</li>
                            <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">&#10003;</span> {L('Informe por email', 'Email report', 'Relatório por email')}</li>
                        </ul>
                        <button
                            onClick={() => navigate('/signup?plan=starter')}
                            className="w-full py-3 rounded-lg text-sm font-semibold border border-argo-border hover:bg-argo-neutral transition-all"
                        >
                            {L('Empezar', 'Get started', 'Começar')}
                        </button>
                    </motion.div>

                    {/* Team */}
                    <motion.div
                        {...fadeUp(0.1)}
                        className="bg-white border-2 border-[#955FB5] rounded-2xl p-8 flex flex-col relative"
                    >
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#955FB5] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                            Popular
                        </span>
                        <p className="text-[10px] font-semibold text-argo-grey uppercase tracking-widest mb-2">Team</p>
                        <p style={{ fontWeight: 300, fontSize: '36px', letterSpacing: '-0.03em', color: '#1D1D1F' }}>
                            US$ 69
                        </p>
                        <p className="text-sm text-argo-grey mt-1 mb-6">30 {L('créditos', 'credits', 'créditos')}</p>
                        <ul className="space-y-3 text-sm text-[#424245] flex-1 mb-8">
                            <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">&#10003;</span> {L('Todo lo de Starter', 'Everything in Starter', 'Tudo do Starter')}</li>
                            <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">&#10003;</span> {L('Exportar CSV', 'Export CSV', 'Exportar CSV')}</li>
                            <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">&#10003;</span> {L('Soporte prioritario', 'Priority support', 'Suporte prioritário')}</li>
                        </ul>
                        <button
                            onClick={() => navigate('/signup?plan=team')}
                            style={{ backgroundColor: '#955FB5' }}
                            className="w-full py-3 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-all"
                        >
                            {L('Elegir Team', 'Choose Team', 'Escolher Team')}
                        </button>
                    </motion.div>

                    {/* Club */}
                    <motion.div
                        {...fadeUp(0.15)}
                        className="bg-white border border-argo-border rounded-2xl p-8 flex flex-col"
                    >
                        <p className="text-[10px] font-semibold text-argo-grey uppercase tracking-widest mb-2">Club</p>
                        <p style={{ fontWeight: 300, fontSize: '36px', letterSpacing: '-0.03em', color: '#1D1D1F' }}>
                            US$ 179
                        </p>
                        <p className="text-sm text-argo-grey mt-1 mb-6">100 {L('créditos', 'credits', 'créditos')}</p>
                        <ul className="space-y-3 text-sm text-[#424245] flex-1 mb-8">
                            <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">&#10003;</span> {L('Todo lo de Team', 'Everything in Team', 'Tudo do Team')}</li>
                            <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">&#10003;</span> {L('Múltiples usuarios', 'Multiple users', 'Múltiplos usuários')}</li>
                            <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">&#10003;</span> {L('Métricas avanzadas', 'Advanced metrics', 'Métricas avançadas')}</li>
                        </ul>
                        <button
                            onClick={() => navigate('/signup?plan=club')}
                            className="w-full py-3 rounded-lg text-sm font-semibold border border-argo-border hover:bg-argo-neutral transition-all"
                        >
                            {L('Elegir Club', 'Choose Club', 'Escolher Club')}
                        </button>
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
                            '10 minutes. A report to your inbox. No apps or installs.',
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
                        {L('Crear cuenta gratis', 'Create free account', 'Criar conta grátis')}
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
                        <span>© 2025 Argo.</span>
                        <button
                            onClick={() => setLang(NEXT_LANG[lang])}
                            className="hover:text-argo-navy transition-colors"
                        >
                            {t.nav.lang}
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    );
};
