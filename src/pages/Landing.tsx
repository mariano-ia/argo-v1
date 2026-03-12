import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Plus } from 'lucide-react';
import { useLang } from '../context/LangContext';
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
    { labelEs: 'Impulsor Dinámico',    labelEn: 'Dynamic Driver',        motorEs: 'Dinámico', motorEn: 'Fast',     eje: 'D' },
    { labelEs: 'Impulsor Rítmico',     labelEn: 'Rhythmic Driver',       motorEs: 'Rítmico',  motorEn: 'Rhythmic', eje: 'D' },
    { labelEs: 'Impulsor Sereno',      labelEn: 'Serene Driver',         motorEs: 'Sereno',   motorEn: 'Serene',   eje: 'D' },
    { labelEs: 'Conector Dinámico',    labelEn: 'Dynamic Connector',     motorEs: 'Dinámico', motorEn: 'Fast',     eje: 'I' },
    { labelEs: 'Conector Rítmico',     labelEn: 'Rhythmic Connector',    motorEs: 'Rítmico',  motorEn: 'Rhythmic', eje: 'I' },
    { labelEs: 'Conector Sereno',      labelEn: 'Serene Connector',      motorEs: 'Sereno',   motorEn: 'Serene',   eje: 'I' },
    { labelEs: 'Sostenedor Dinámico',  labelEn: 'Dynamic Sustainer',     motorEs: 'Dinámico', motorEn: 'Fast',     eje: 'S' },
    { labelEs: 'Sostenedor Rítmico',   labelEn: 'Rhythmic Sustainer',    motorEs: 'Rítmico',  motorEn: 'Rhythmic', eje: 'S' },
    { labelEs: 'Sostenedor Sereno',    labelEn: 'Serene Sustainer',      motorEs: 'Sereno',   motorEn: 'Serene',   eje: 'S' },
    { labelEs: 'Estratega Dinámico',   labelEn: 'Dynamic Strategist',    motorEs: 'Dinámico', motorEn: 'Fast',     eje: 'C' },
    { labelEs: 'Estratega Rítmico',    labelEn: 'Rhythmic Strategist',   motorEs: 'Rítmico',  motorEn: 'Rhythmic', eje: 'C' },
    { labelEs: 'Estratega Observador', labelEn: 'Observant Strategist',  motorEs: 'Sereno',   motorEn: 'Serene',   eje: 'C' },
];

// ─── Archetype descriptions (ES + EN) ────────────────────────────────────────
const ARCHETYPE_DESCRIPTIONS: { es: string; en: string }[] = [
    {
        es: 'Vive el deporte desde la acción. Su energía no espera instrucciones, necesita movimiento constante para estar en su zona. Bajo presión, acelera. Cuando se lo frena sin razón, pierde la chispa. El reto permanente y la autonomía son su combustible.',
        en: 'Lives sport through action. Their energy does not wait for instructions — it needs constant movement to stay in the zone. Under pressure, they accelerate. When held back without reason, they lose their spark. Constant challenge and autonomy are their fuel.',
    },
    {
        es: 'Combina la determinación del líder con la capacidad de dosificar energía en el momento justo. No es el primero en salir, pero tampoco el último en llegar. Decide con claridad y actúa con propósito. Necesita objetivos claros y espacio para ejecutarlos a su ritmo.',
        en: 'Combines a leader\'s determination with the ability to pace their energy at exactly the right moment. Not the first to leave, but never the last to arrive. Decides clearly and acts with purpose. Needs clear objectives and space to execute at their own rhythm.',
    },
    {
        es: 'Tiene la voluntad de un líder y la paciencia de un estratega. Procesa antes de actuar, pero cuando decide, lo hace con convicción absoluta. No se precipita, pero tampoco retrocede. Necesita tiempo para comprender el plan y luego libertad para ejecutarlo sin interrupciones.',
        en: 'Has a leader\'s will and a strategist\'s patience. Processes before acting, but when they decide, they do so with absolute conviction. Does not rush, but does not retreat. Needs time to understand the plan, then freedom to execute it without interruption.',
    },
    {
        es: 'El equipo es su hábitat natural. Se activa con el contacto, el juego y la energía colectiva. Reacciona rápido y habla rápido. Su entusiasmo contagia al grupo, pero también puede dispersarse si no hay estructura que lo contenga. Necesita un entorno dinámico que no apague su llama.',
        en: 'The team is their natural habitat. They activate through contact, play, and collective energy. They react fast and speak fast. Their enthusiasm is contagious, but they can also scatter if there is no structure to contain them. Needs a dynamic environment that does not dim their flame.',
    },
    {
        es: 'Construye puentes con calma y convicción. Se relaciona con todos y sabe cuándo hablar y cuándo escuchar. No corre detrás de cada estímulo. Selecciona los momentos para brillar. Necesita espacios de reconocimiento genuino y un equipo donde sentir que importa.',
        en: 'Builds bridges with calm and conviction. Connects with everyone and knows when to speak and when to listen. Does not chase every stimulus — selects their moments to shine. Needs genuine recognition and a team where they feel they matter.',
    },
    {
        es: 'La profundidad no es debilidad, es su superpoder silencioso. Conecta con los demás desde la escucha y la empatía, no desde el ruido. Observa antes de participar, pero cuando lo hace, deja huella. Necesita un ambiente de confianza donde el vínculo sea más importante que el resultado.',
        en: 'Depth is not weakness — it is their silent superpower. Connects with others through listening and empathy, not noise. Observes before participating, but when they do, they leave a mark. Needs a trusting environment where the bond matters more than the result.',
    },
    {
        es: 'Tiene el corazón del equipo y los pies de un velocista. Es el primero en dar la mano y también en llegar a la pelota. Estabiliza el grupo desde la acción, no solo desde el apoyo. Necesita sentir que su aporte es visible y que el equipo lo reconoce como parte esencial.',
        en: 'Has the heart of the team and the feet of a sprinter. First to offer a hand and first to reach the ball. Stabilizes the group through action, not just support. Needs to feel their contribution is visible and that the team recognizes them as essential.',
    },
    {
        es: 'La columna vertebral del equipo. No busca el protagonismo, pero sin él nada funciona. Ejecuta con consistencia, apoya sin condiciones y mantiene el ritmo cuando los demás fallan. Necesita un entorno predecible y relaciones estables para dar lo mejor de sí.',
        en: 'The backbone of the team. Does not seek the spotlight, but without them nothing works. Executes with consistency, supports unconditionally, and keeps the rhythm when others falter. Needs a predictable environment and stable relationships to give their best.',
    },
    {
        es: 'La calma en medio de la tormenta. Procesa cada situación con paciencia y actúa con una consistencia que pocos logran mantener. No reacciona, responde. Necesita tiempo y confianza para adaptarse a los cambios, pero una vez que lo hace, es el ancla del grupo.',
        en: 'Calm in the eye of the storm. Processes every situation with patience and acts with a consistency few can sustain. Does not react — responds. Needs time and trust to adapt to changes, but once they do, they become the group\'s anchor.',
    },
    {
        es: 'Analiza en segundos lo que otros tardan minutos en ver. Combina velocidad de procesamiento con precisión táctica, una rareza que convierte cada partido en un ejercicio de inteligencia aplicada. Necesita retos complejos y espacio para liderar desde el análisis, sin que nadie interrumpa su proceso.',
        en: 'Analyzes in seconds what others take minutes to see. Combines processing speed with tactical precision — a rarity that turns every game into applied intelligence. Needs complex challenges and space to lead from analysis, without anyone interrupting their process.',
    },
    {
        es: 'Piensa antes de hablar y habla antes de actuar. Su proceso no es lento, es exacto. Cada decisión está sustentada en observación y criterio. Prefiere la calidad a la velocidad y la precisión al volumen. Necesita un entorno que valore el análisis y no lo presione a actuar antes de estar listo.',
        en: 'Thinks before speaking and speaks before acting. Their process is not slow — it is exact. Every decision is grounded in observation and judgment. Prefers quality over speed and precision over volume. Needs an environment that values analysis and does not pressure them to act before they are ready.',
    },
    {
        es: 'Su talento no está en la velocidad de la carrera, sino en la claridad de su mirada. Tiende a procesar el entorno con profundidad antes de actuar, aportando calma y orden táctico incluso en momentos de presión. Para él, el deporte es un tablero que prefiere comprender antes de ejecutar.',
        en: 'Their talent lies not in the speed of the run, but in the clarity of their gaze. Tends to process the environment deeply before acting, bringing calm and tactical order even under pressure. For them, sport is a board they prefer to understand before executing.',
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
        ejeLabelEs: 'Impulsor',      ejeLabelEn: 'Driver',
        behaviorsEs: ['Domina', 'Decide', 'Compite'],
        behaviorsEn: ['Dominates', 'Decides', 'Competes'],
        motorEs: 'Dinámico',         motorEn: 'Fast',        motorBars: 3,
        motorDescEs: 'Responde en segundos. Necesita acción constante.',
        motorDescEn: 'Responds in seconds. Needs constant action.',
        archetypeEs: 'Impulsor Dinámico', archetypeEn: 'Dynamic Driver',
        archetypeDescEs: 'Necesita reto constante y autonomía. Responde al feedback directo.',
        archetypeDescEn: 'Needs constant challenge and autonomy. Responds to direct feedback.',
    },
    {
        eje: 'S',
        ejeLabelEs: 'Sostenedor',    ejeLabelEn: 'Sustainer',
        behaviorsEs: ['Estabiliza', 'Cuida', 'Persiste'],
        behaviorsEn: ['Stabilizes', 'Nurtures', 'Persists'],
        motorEs: 'Sereno',           motorEn: 'Serene',      motorBars: 1,
        motorDescEs: 'Procesa en profundidad antes de actuar.',
        motorDescEn: 'Processes in depth before acting.',
        archetypeEs: 'Sostenedor Sereno', archetypeEn: 'Serene Sustainer',
        archetypeDescEs: 'Necesita tiempo y seguridad. Evita los cambios abruptos sin aviso.',
        archetypeDescEn: 'Needs time and security. Avoids abrupt changes without warning.',
    },
    {
        eje: 'I',
        ejeLabelEs: 'Conector',      ejeLabelEn: 'Connector',
        behaviorsEs: ['Influye', 'Entusiasma', 'Conecta'],
        behaviorsEn: ['Influences', 'Enthuses', 'Connects'],
        motorEs: 'Rítmico',          motorEn: 'Rhythmic',    motorBars: 2,
        motorDescEs: 'Equilibra impulso y reflexión.',
        motorDescEn: 'Balances impulse and reflection.',
        archetypeEs: 'Conector Rítmico', archetypeEn: 'Rhythmic Connector',
        archetypeDescEs: 'Se motiva con el equipo. Necesita reconocimiento y variedad.',
        archetypeDescEn: 'Motivated by the team. Needs recognition and variety.',
    },
    {
        eje: 'C',
        ejeLabelEs: 'Estratega',     ejeLabelEn: 'Strategist',
        behaviorsEs: ['Analiza', 'Planifica', 'Precisa'],
        behaviorsEn: ['Analyzes', 'Plans', 'Executes'],
        motorEs: 'Dinámico',         motorEn: 'Fast',        motorBars: 3,
        motorDescEs: 'Responde en segundos. Actúa con precisión.',
        motorDescEn: 'Responds in seconds. Acts with precision.',
        archetypeEs: 'Estratega Dinámico', archetypeEn: 'Dynamic Strategist',
        archetypeDescEs: 'Analiza rápido y necesita estructura clara. Odia la improvisación.',
        archetypeDescEn: 'Analyzes quickly and needs clear structure. Hates improvisation.',
    },
];

// ─── Slot machine — generates a fresh random config per transition ────────────
const randomSlotConf = () => [0, 1, 2].map(() => ({
    dir: Math.random() > 0.5 ? 1 : -1,
    delay: Math.random() * 0.22,
    dur: 0.24 + Math.random() * 0.14,
}));

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
        <div
            className="py-5 px-5 -mx-5 rounded-xl transition-colors duration-300"
            style={{ backgroundColor: open ? '#F5F5F7' : 'transparent' }}
        >
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-start justify-between gap-4 text-left cursor-pointer"
            >
                <span style={{ fontWeight: 500, fontSize: '16px', letterSpacing: '-0.01em', color: '#1D1D1F' }}>
                    {question}
                </span>
                <motion.span
                    animate={{ rotate: open ? 45 : 0 }}
                    transition={{ duration: 0.2, ease: [0.25, 0, 0, 1] }}
                    className="text-[#86868B] mt-0.5 shrink-0"
                >
                    <Plus size={18} />
                </motion.span>
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
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
                            style={{ fontWeight: 400, fontSize: '11px', letterSpacing: '0.06em' }}
                            className="text-argo-grey hover:text-argo-navy transition-colors uppercase"
                        >
                            {t.nav.lang}
                        </button>
                        <button
                            onClick={() => navigate('/app')}
                            aria-label={lang === 'es' ? 'Iniciar experiencia Argo' : 'Start the Argo experience'}
                            style={{
                                fontWeight: 500, fontSize: '12px', letterSpacing: '-0.01em',
                                backgroundColor: '#955FB5', color: '#fff',
                                borderRadius: '8px', padding: '6px 16px',
                            }}
                            className="hover:opacity-90 transition-opacity"
                        >
                            {lang === 'es' ? 'Iniciar experiencia Argo' : 'Start the Argo experience'}
                        </button>
                    </div>
                </div>
            </nav>

            {/* ── HERO ── */}
            <section className="relative max-w-5xl mx-auto px-4 md:px-6 pt-20 pb-20 md:pt-32 md:pb-36 overflow-hidden">
                <motion.div {...fadeUp(0)}>
                    <SectionLabel>
                        {lang === 'es' ? 'Ciencia del Comportamiento' : 'Behavioral Science'}
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
                    {lang === 'es'
                        ? 'Inteligencia deportiva para que cada niño disfrute el deporte.'
                        : 'Sports intelligence so every child can enjoy sport.'}
                </motion.h1>

                <motion.p
                    {...fadeUp(0.16)}
                    style={{ fontWeight: 400, fontSize: '17px', lineHeight: 1.65, color: '#424245', maxWidth: '560px' }}
                    className="mb-12"
                >
                    {lang === 'es'
                        ? 'Basado en la metodología DISC + Motor, alineamos el entorno con la naturaleza del deportista. Una solución técnica para eliminar el estrés deportivo y asegurar el disfrute genuino de los niños.'
                        : 'Based on the DISC + Engine methodology, we align the environment with the athlete\'s nature. A technical solution to eliminate sports stress and ensure children\'s genuine enjoyment.'}
                </motion.p>

                <motion.div {...fadeUp(0.22)} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
                    <button
                        onClick={() => navigate('/app')}
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
                        {lang === 'es' ? 'Iniciar experiencia Argo' : 'Start the Argo experience'}
                        <ArrowRight size={15} />
                    </button>
                    <span style={{ fontWeight: 400, fontSize: '12px', color: '#86868B' }}>
                        {lang === 'es' ? '10 minutos para comprender mejor a tu pequeño atleta' : '10 minutes to better understand your young athlete'}
                    </span>
                </motion.div>

            </section>

            {/* ── EL MITO ── */}
            <div style={{ backgroundColor: '#E3E3FF' }}>
            <section className="max-w-5xl mx-auto px-4 md:px-6 py-16 md:py-32">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20">
                    <motion.div {...fadeUp(0)}>
                        <SectionLabel>
                            {lang === 'es' ? 'El origen · La nave Argos' : 'The origin · The Argo ship'}
                        </SectionLabel>
                        <h2 style={{ fontWeight: 300, fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', lineHeight: 1.1, letterSpacing: '-0.025em' }}>
                            {lang === 'es'
                                ? <>50 especialistas.<br />Una sola misión.</>
                                : <>50 specialists.<br />One single mission.</>}
                        </h2>
                    </motion.div>

                    <motion.div {...fadeUp(0.1)} className="flex flex-col justify-center">
                        <p style={{ fontWeight: 400, fontSize: '16px', lineHeight: 1.75, color: '#424245' }} className="mb-6">
                            {lang === 'es'
                                ? 'En la mitología griega, la nave Argos cumplió su misión no porque todos sus tripulantes fueran iguales, sino porque cada uno ocupó el rol exacto según su naturaleza. Orfeo ponía el ritmo. Hércules, la fuerza. Tifis, el rumbo.'
                                : 'In Greek mythology, the Argo succeeded not because all her crew were equal, but because each occupied the exact role suited to their nature. Orpheus set the rhythm. Hercules, the strength. Tiphys, the course.'}
                        </p>
                        <p style={{ fontWeight: 400, fontSize: '16px', lineHeight: 1.75, color: '#424245' }}>
                            {lang === 'es'
                                ? 'Aplicamos esta sabiduría milenaria a la ciencia del comportamiento deportivo. No existen niños incorrectos. Existen niños fuera de sintonía. Cuando un niño no disfruta del deporte, no es por falta de capacidad, es porque está ocupando un lugar en la tripulación que no le corresponde.'
                                : 'We apply this ancient wisdom to sports behavioral science. There are no wrong children. There are children out of sync. When a child does not enjoy sport, it is not from lack of ability, it is because they are filling a role in the crew that does not match their nature.'}
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
                        {lang === 'es' ? 'El sistema · Tres dimensiones' : 'The system · Three dimensions'}
                    </SectionLabel>
                    <h2 style={{ fontWeight: 300, fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', lineHeight: 1.1, letterSpacing: '-0.025em' }}>
                        {lang === 'es' ? 'Conducta + Motor = Sintonía.' : 'Behavior + Engine = Synergy.'}
                    </h2>

                    {/* Inline definitions */}
                    <div className="flex flex-wrap items-start gap-8 mt-8">
                        <div style={{ maxWidth: '160px' }}>
                            <p style={{ fontWeight: 500, fontSize: '11px', color: '#1D1D1F', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '5px' }}>
                                {lang === 'es' ? 'Conducta' : 'Behavior'}
                            </p>
                            <p style={{ fontWeight: 400, fontSize: '13px', color: '#86868B', lineHeight: 1.5 }}>
                                {lang === 'es' ? 'Cómo actúa bajo presión y en equipo' : 'How they act under pressure and in a team'}
                            </p>
                        </div>
                        <span style={{ fontWeight: 300, fontSize: '22px', color: '#D2D2D7', paddingTop: '2px' }}>+</span>
                        <div style={{ maxWidth: '160px' }}>
                            <p style={{ fontWeight: 500, fontSize: '11px', color: '#1D1D1F', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '5px' }}>
                                Motor
                            </p>
                            <p style={{ fontWeight: 400, fontSize: '13px', color: '#86868B', lineHeight: 1.5 }}>
                                {lang === 'es' ? 'A qué ritmo procesa y toma decisiones' : 'At what pace they process and decide'}
                            </p>
                        </div>
                        <span style={{ fontWeight: 300, fontSize: '22px', color: '#D2D2D7', paddingTop: '2px' }}>=</span>
                        <div style={{ maxWidth: '180px' }}>
                            <p style={{ fontWeight: 500, fontSize: '11px', color: '#1D1D1F', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '5px' }}>
                                {lang === 'es' ? 'Sintonía' : 'Synergy'}
                            </p>
                            <p style={{ fontWeight: 400, fontSize: '13px', color: '#86868B', lineHeight: 1.5 }}>
                                {lang === 'es' ? 'El lugar exacto donde disfruta y rinde' : 'The exact place where they thrive'}
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
                            01 · {lang === 'es' ? 'Conducta' : 'Behavior'}
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
                                        {lang === 'es' ? profile.ejeLabelEs : profile.ejeLabelEn}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    {(lang === 'es' ? profile.behaviorsEs : profile.behaviorsEn).map(b => (
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
                                        {lang === 'es' ? profile.motorEs : profile.motorEn}
                                    </span>
                                </div>
                                <p style={{ fontWeight: 400, fontSize: '13px', color: '#86868B', lineHeight: 1.55 }}>
                                    {lang === 'es' ? profile.motorDescEs : profile.motorDescEn}
                                </p>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Sintonía */}
                    <div className="p-6 md:p-10 bg-white overflow-hidden">
                        <p style={{ fontWeight: 600, fontSize: '10px', letterSpacing: '0.14em', color: '#86868B' }} className="uppercase mb-6">
                            03 · {lang === 'es' ? 'Sintonía' : 'Synergy'}
                        </p>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`s-${profileIdx}`}
                                initial={{ opacity: 0, y: slotConf[2].dir * 24 }}
                                animate={{ opacity: 1, y: 0, transition: { duration: slotConf[2].dur, delay: slotConf[2].delay, ease: [0.25, 0, 0, 1] } }}
                                exit={{ opacity: 0, y: slotConf[2].dir * -24, transition: { duration: 0.2, ease: [0.25, 0, 0, 1] } }}
                            >
                                <p style={{ fontWeight: 300, fontSize: '20px', letterSpacing: '-0.02em', color: '#1D1D1F', marginBottom: '12px', lineHeight: 1.2 }}>
                                    {lang === 'es' ? profile.archetypeEs : profile.archetypeEn}
                                </p>
                                <p style={{ fontWeight: 400, fontSize: '13px', color: '#86868B', lineHeight: 1.55 }}>
                                    {lang === 'es' ? profile.archetypeDescEs : profile.archetypeDescEn}
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
                        {lang === 'es' ? 'La cartografía · 12 perfiles' : 'The map · 12 profiles'}
                    </SectionLabel>
                    <p style={{ fontWeight: 400, fontSize: '16px', color: '#424245', marginTop: '8px', maxWidth: '600px', lineHeight: 1.75 }}>
                        {lang === 'es'
                            ? 'Cada deportista tiene un ritmo y una forma única de procesar el juego. A través de la ciencia del comportamiento, identificamos estas tendencias naturales para que los adultos puedan crear el entorno de sintonía que cada niño necesita para disfrutar y permanecer en el deporte.'
                            : 'Every athlete has a unique rhythm and way of processing the game. Through behavioral science, we identify these natural tendencies so adults can create the attuned environment each child needs to enjoy and stay in sport.'}
                    </p>
                </motion.div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px"
                     style={{ border: '1px solid #D2D2D7', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#D2D2D7' }}>
                    {ARCHETYPES.map((arch, i) => {
                        const isSelected = selectedIdx === i;
                        const label = lang === 'es' ? arch.labelEs : arch.labelEn;
                        const motor = lang === 'es' ? arch.motorEs : arch.motorEn;
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
                                    {lang === 'es' ? ARCHETYPES[selectedIdx].labelEs : ARCHETYPES[selectedIdx].labelEn}
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
                            {lang === 'es' ? 'Compromiso · Observador aliado' : 'Commitment · Allied observer'}
                        </SectionLabel>
                        <h2 style={{ fontWeight: 300, fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', lineHeight: 1.15, letterSpacing: '-0.025em' }} className="mb-8 text-argo-navy">
                            {lang === 'es'
                                ? 'Sin etiquetas. Sin juicios clínicos.'
                                : 'No labels. No clinical judgments.'}
                        </h2>
                        <p style={{ fontWeight: 400, fontSize: '16px', color: '#424245', lineHeight: 1.75 }} className="mb-4">
                            {lang === 'es'
                                ? 'Argo Method no clasifica capacidades ni predice futuros. No sustituye el trabajo de psicólogos deportivos ni especialistas en desarrollo infantil.'
                                : 'Argo Method does not classify abilities or predict futures. It does not replace sports psychologists or child development specialists.'}
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
                            {lang === 'es' ? 'Preguntas frecuentes' : 'Frequently asked questions'}
                        </SectionLabel>
                    </motion.div>

                    <motion.div {...fadeUp(0.1)} className="divide-y divide-[#D2D2D7]">
                        {(lang === 'es' ? [
                            {
                                q: '¿Qué es Argo Method?',
                                a: 'No hay niños incorrectos, hay niños que todavía no encontraron un adulto que los entienda. Argo Method es una herramienta de perfilamiento conductual para atletas jóvenes (8 a 16 años) basada en el modelo DISC. A través de una experiencia gamificada de 10 minutos, genera un informe personalizado que ayuda al adulto responsable a entender cómo piensa, siente y reacciona el niño en contextos deportivos.',
                            },
                            {
                                q: '¿Para quién es el informe?',
                                a: 'Para el adulto que acompaña al atleta: entrenadores, padres, madres o referentes de instituciones deportivas. El informe llega por email al finalizar la experiencia. No es un informe para el niño, es una herramienta para que el adulto pueda acompañarlo mejor.',
                            },
                            {
                                q: '¿El niño necesita crear una cuenta?',
                                a: 'No. Solo se completa un formulario breve con nombre, edad y deporte. Sin contraseñas, sin descargas, sin instalar nada.',
                            },
                            {
                                q: '¿Cuánto dura la experiencia?',
                                a: 'Aproximadamente 10 minutos. Son 12 decisiones rápidas presentadas como un juego con temática náutica. El niño las responde solo, en un ambiente tranquilo.',
                            },
                            {
                                q: '¿Hay respuestas correctas o incorrectas?',
                                a: 'No. Cada respuesta refleja una tendencia conductual, no un acierto ni un error. No se miden capacidades ni se emiten diagnósticos. Todas las respuestas son válidas.',
                            },
                            {
                                q: '¿Es un test psicológico?',
                                a: 'No. Argo Method no sustituye a psicólogos deportivos ni a especialistas en desarrollo infantil. Es una herramienta de observación conductual que ofrece un punto de partida para individualizar el acompañamiento deportivo.',
                            },
                            {
                                q: '¿Cuánto cuesta?',
                                a: 'La experiencia es gratuita durante esta etapa.',
                            },
                            {
                                q: '¿Qué datos recopilan?',
                                a: 'Nombre del adulto, email, nombre del niño, edad y deporte. Las respuestas del juego se usan exclusivamente para generar el informe. No vendemos ni compartimos datos con terceros.',
                            },
                        ] : [
                            {
                                q: 'What is Argo Method?',
                                a: 'There are no incorrect children — only children who haven\'t yet found an adult who understands them. Argo Method is a behavioral profiling tool for young athletes (ages 8 to 16) based on the DISC model. Through a 10-minute gamified experience, it generates a personalized report that helps the responsible adult understand how the child thinks, feels, and reacts in sports contexts.',
                            },
                            {
                                q: 'Who receives the report?',
                                a: 'The adult who accompanies the athlete: coaches, parents, or representatives of sports institutions. The report is sent by email when the experience ends. It\'s not a report for the child — it\'s a tool for the adult to better support them.',
                            },
                            {
                                q: 'Does the child need to create an account?',
                                a: 'No. Only a brief form with name, age, and sport is needed. No passwords, no downloads, no installations.',
                            },
                            {
                                q: 'How long does the experience take?',
                                a: 'About 10 minutes. It consists of 12 quick decisions presented as a nautical-themed game. The child answers them alone, in a quiet environment.',
                            },
                            {
                                q: 'Are there correct or incorrect answers?',
                                a: 'No. Each answer reflects a behavioral tendency, not a right or wrong choice. No abilities are measured and no diagnoses are issued. All answers are valid.',
                            },
                            {
                                q: 'Is it a psychological test?',
                                a: 'No. Argo Method does not replace sports psychologists or child development specialists. It\'s a behavioral observation tool that offers a starting point for individualizing sports coaching.',
                            },
                            {
                                q: 'How much does it cost?',
                                a: 'The experience is free during this stage.',
                            },
                            {
                                q: 'What data do you collect?',
                                a: 'Adult\'s name, email, child\'s name, age, and sport. Game answers are used exclusively to generate the report. We do not sell or share data with third parties.',
                            },
                        ]).map((faq, i) => (
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
                        {lang === 'es'
                            ? '¿En qué lugar de la nave está tu atleta?'
                            : 'Where on the ship is your athlete?'}
                    </h2>
                    <p style={{ fontWeight: 400, fontSize: '16px', color: '#86868B', marginBottom: '40px' }}>
                        {lang === 'es'
                            ? '10 minutos. Un informe al email. Sin apps ni instalaciones.'
                            : '10 minutes. A report to your inbox. No apps or installs.'}
                    </p>
                    <button
                        onClick={() => navigate('/app')}
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
                        {lang === 'es' ? 'Iniciar experiencia Argo' : 'Start the Argo experience'}
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
                            {lang === 'es' ? 'Cartografía de Sintonía Deportiva' : 'Sports Behavioral Mapping'}
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
                            onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
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
