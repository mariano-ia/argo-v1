import React, { useState, createContext, useContext } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AXIS_COLORS } from '../lib/designTokens';

// ─── Language types & static translations ────────────────────────────────────
type Lang = 'es' | 'en';

const T = {
    es: {
        nav: { back: 'Volver al sitio', deckLabel: 'Investor Deck' },
        hero: {
            headlineA: 'Entrenamos a personas.',
            headlineB: 'No las conocemos.',
            subhead:
                'Argo Method traduce cincuenta años de ciencia conductual al deporte infantil. Un sistema que el niño juega y el adulto entiende.',
            beforeArgo: 'Antes de Argo',
            leftTitle: 'Lo que un coach sabe hoy de un niño.',
            withArgo: 'Con Argo',
            rightTitle: 'Lo que el mismo coach recibe.',
            data: [
                { label: 'Nombre', value: 'Joaquín M.', muted: false },
                { label: 'Edad', value: '11 años', muted: false },
                { label: 'Posición', value: 'Mediocampista', muted: false },
                { label: 'Altura', value: '1,42 m', muted: false },
                { label: 'Asistencia', value: '92%', muted: false },
                { label: 'Personalidad', value: '—', muted: true },
                { label: 'Combustible interno', value: '—', muted: true },
                { label: 'Forma de procesar', value: '—', muted: true },
            ],
        },
        report: {
            header: 'Informe de sintonía',
            meta: '11 años · Fútbol',
            profileLabel: 'Informe de perfil',
            archetype: 'Sostenedor Rítmico',
            secondary: 'con brújula social',
            profileBold: 'Joaquín tiende a leer al grupo antes de moverse.',
            profileRest:
                ' Su presencia ordena el clima del equipo aun cuando no es el más vocal. Sostiene el ritmo cuando otros se aceleran o se quedan. Es probable que su mayor aporte no se note en el resultado, sino en cómo el equipo se siente cuando él está.',
            motorLabel: 'Motor de rendimiento',
            motorBold: 'Su tempo es rítmico.',
            motorRest:
                ' Procesa antes de actuar, pero no se queda quieto. Necesita un momento breve para integrar la jugada y luego responde con consistencia.',
            fuelLabel: 'Qué lo mueve',
            fuelBold: 'Se enciende cuando lo nombras parte del plan.',
            fuelRest:
                ' Sentir que su rol es claro y que el equipo lo necesita es su mejor combustible. No persigue protagonismo, persigue pertenencia.',
            decisionLabel: 'Patrón de decisión',
            decisionBold: 'Decide por estabilidad antes que por velocidad.',
            decisionRest: ' Antes de elegir, pesa cómo afecta su decisión al grupo.',
            digestBold: 'Qué significa para el entrenamiento.',
            digestRest:
                ' Dale tiempo para responder. Si lo apuras, tiende a pasar la jugada en lugar de asumirla.',
            commLabel: 'Comunicación',
            bridgeLabel: 'Palabras puente',
            bridgeWords: ['Cuento contigo', 'Tu turno', 'Mantén el equipo', 'Calma'],
            avoidLabel: 'Evitar',
            avoidWords: ['Ya', 'Reacciona', 'Más rápido', 'Solo'],
            secLabel: 'Tendencia secundaria · con brújula social',
            secBody:
                'Lo social no es ruido para Joaquín. Es información. Lee gestos, tonos, cambios de ánimo del grupo. Esa sensibilidad lo convierte en un puente natural entre los que empujan y los que se quedan atrás.',
            checklistLabel: 'Checklist de entrenamiento',
            beforeTitle: 'Antes del entrenamiento',
            beforeBody:
                'Recuérdale su rol concreto. Una frase es suficiente: "Hoy te necesito leyendo el medio".',
            duringTitle: 'Durante la sesión',
            duringBody:
                'Ubícalo cerca de jugadores que necesiten anclaje, no de los más expansivos. Su ritmo les ordena.',
            afterTitle: 'Después del partido',
            afterBody:
                'Pregúntale qué sintió del grupo, no solo qué hizo él. Es la pregunta que más le importa.',
            echoesLabel: 'Ecos fuera de la cancha',
            echoesBody:
                'En casa es probable que sea el que pregunta antes de pedir, el que cede el último pedazo de pizza. Esa misma sensibilidad puede llevarlo a callarse cosas que le duelen. Conviene abrirle la puerta sin obligarlo a pasar.',
            resetLabel: 'Consejo de reset',
            resetBold: 'Cuando se desordena, no necesita corrección.',
            resetRest: ' Necesita una pausa breve y una pregunta abierta. ',
            resetQuote: '"¿Qué sentiste recién?"',
            resetClose: ' Eso suele bastar.',
            disclaimerA: 'Este informe no evalúa talento ni predice el futuro deportivo.',
            disclaimerB: 'Describe tendencias actuales que evolucionarán con la maduración de Joaquín.',
            scrollHint: '↓ Desliza para leer el informe completo',
        },
        insight: {
            eyebrow: 'La premisa',
            h1: 'La nave Argo llevaba cincuenta tripulantes.',
            h2: 'Cada uno tenía un lugar exacto.',
            p1: 'Esa es la imagen con la que pensamos a los niños en el deporte.',
            p2Bold: 'No hay niños incorrectos. Hay niños mal ubicados.',
            p2Rest: ' Detrás de cada uno, casi siempre, un adulto que no lo terminó de entender.',
            p3:
                'Argo existe para cambiar eso. Para que los chicos disfruten más del deporte y los adultos los acompañen mejor.',
        },
        how: {
            eyebrow: 'Cómo funciona',
            h1: 'El niño no responde un test.',
            h2: 'Vive una aventura.',
            sub:
                'La gamificación no es decoración. Es lo que ayuda a que el niño responda con mayor autenticidad. Un niño no responde con autenticidad cuando se siente evaluado.',
            step1Title: 'El niño juega',
            step1Body:
                'Una odisea náutica de doce minutos. Tres mini juegos de reacción y doce decisiones contadas como capítulos de una historia. Sin formularios, sin preguntas clínicas, sin etiquetas.',
            step2Title: 'Nuestro modelo procesa',
            step2Body:
                'Cada decisión y cada reacción se traducen en dos dimensiones: cómo se comporta en grupo (conducta) y a qué tempo decide y procesa (motor). Doce arquetipos y doce tendencias secundarias resuelven la combinación.',
            step3Title: 'El adulto recibe',
            step3Body:
                'Un informe completo con arquetipo, tendencia secundaria, combustible interno, palabras puente, checklist de entrenamiento y consejos de acompañamiento. Llega al coach y a la familia por correo.',
            mapLabel: 'El mapa primario',
            matrixHeaders: ['Dinámico', 'Rítmico', 'Sereno'],
            matrixAxes: { D: 'Impulsor', I: 'Conector', S: 'Sostenedor', C: 'Estratega' } as Record<'D' | 'I' | 'S' | 'C', string>,
            matrixCObservador: 'Observador',
            captionA: 'Cuatro ejes de conducta. Tres tempos de procesamiento. Doce arquetipos primarios.',
            captionB: 'Cada uno se cruza con una de doce tendencias secundarias. ',
            captionBold: 'Más de cien combinaciones posibles.',
            captionC: ' Ninguna mejor que otra.',
        },
        intel: {
            eyebrow: 'La inteligencia detrás de Argo',
            h1: 'El informe es solo el comienzo.',
            h2: 'La IA acompaña al coach durante toda la temporada.',
            sub:
                'Tres capas conectadas, entrenadas sobre los doce arquetipos, las doce tendencias secundarias y cincuenta y siete situaciones reales de coaching infantil.',
            layer1: 'Capa 1',
            layer1Title: 'Argo Coach',
            layer1Body:
                'Un asistente conversacional al que el coach puede preguntarle cualquier cosa sobre cualquier jugador. La IA trabaja con el perfil de tendencias que mostró cada niño y responde con lenguaje cercano, concreto, probabilístico, libre de jerga clínica.',
            layer1Quote: '"¿Cómo motivo a un Sostenedor Rítmico que no quiere arrancar el entrenamiento?"',
            layer2: 'Capa 2',
            layer2Title: 'Equipos Equilibrados',
            layer2Body:
                'Lee la composición conductual del grupo y sugiere agrupamientos. Detecta cuándo un equipo está dominado por una sola energía, cuándo le falta sostén, qué duplas se potencian. El coach decide. Argo informa.',
            layer2Quote:
                'Energía competitiva alta. Sugerencia: rotar al Estratega Rítmico al medio para anclar la presión.',
            layer3: 'Capa 3',
            layer3Title: 'Predictor de situaciones',
            layer3Body:
                'Cincuenta y siete escenarios reales mapeados por perfil. Frustración tras la derrota, miedo previo al partido, jugador que se castiga al equivocarse. Para cada situación, una respuesta distinta según el arquetipo.',
            layer3Quote: 'Joaquín se castiga después de un error. Tres pasos para resetearlo sin sermones.',
        },
        glance: {
            eyebrow: 'El producto',
            h1: 'Un sistema. Tres superficies.',
            s1Caption: 'Para el niño',
            s1Title: 'La odisea',
            s1Body:
                'Una experiencia gamificada de doce minutos. Tres escenas, tres mini juegos, cero formularios.',
            s2Caption: 'Para el club',
            s2Title: 'El dashboard',
            s2Body:
                'Equipo completo, perfiles por jugador, balance grupal, Argo Coach entrenado con los doce arquetipos.',
            s3Caption: 'Para la familia',
            s3Title: 'El reporte',
            s3Body:
                'Llega por mail al adulto responsable. Lenguaje probabilístico, basado en fortalezas, libre de jerga clínica.',
            closeA: 'Cada niño tiene un lugar en la nave.',
            closeB: 'Argo lo ayuda a encontrarlo.',
        },
        phone: {
            chapter: 'Mar Abierto',
            name: 'Joaquín',
            question: '¿Qué haces primero?',
            options: [
                'Reviso que todo esté listo.',
                '¡Salto al barco ya!',
                'Me instalo con calma.',
                'Busco a mis amigos.',
            ],
        },
        dashboard: { team: 'Equipo Sub-12' },
        email: {
            from: 'De: Argo Method',
            subject: 'El perfil de Joaquín está listo',
            archetype: 'Sostenedor Rítmico',
            body: 'Joaquín tiende a leer al grupo antes de moverse…',
            cta: 'Leer reporte completo',
        },
    },
    en: {
        nav: { back: 'Back to site', deckLabel: 'Investor Deck' },
        hero: {
            headlineA: 'We train people.',
            headlineB: 'We don\'t know them.',
            subhead:
                'Argo Method translates fifty years of behavioral science into youth sport. A system the child plays and the adult understands.',
            beforeArgo: 'Before Argo',
            leftTitle: 'What a coach knows about a child today.',
            withArgo: 'With Argo',
            rightTitle: 'What the same coach receives.',
            data: [
                { label: 'Name', value: 'Joaquín M.', muted: false },
                { label: 'Age', value: '11 years old', muted: false },
                { label: 'Position', value: 'Midfielder', muted: false },
                { label: 'Height', value: '1.42 m', muted: false },
                { label: 'Attendance', value: '92%', muted: false },
                { label: 'Personality', value: '—', muted: true },
                { label: 'Internal fuel', value: '—', muted: true },
                { label: 'Processing style', value: '—', muted: true },
            ],
        },
        report: {
            header: 'Attunement report',
            meta: 'age 11 · soccer',
            profileLabel: 'Profile',
            archetype: 'Rhythmic Sustainer',
            secondary: 'with a social compass',
            profileBold: 'Joaquín tends to read the group before he moves.',
            profileRest:
                ' His presence settles the team\'s mood even when he isn\'t the loudest voice. He holds the rhythm when others speed up or fall behind. His biggest contribution is unlikely to show up in the score. It shows up in how the team feels when he\'s on the field.',
            motorLabel: 'Performance tempo',
            motorBold: 'His tempo is rhythmic.',
            motorRest:
                ' He processes before acting, but he doesn\'t freeze. He needs a brief moment to absorb the play, then responds with consistency.',
            fuelLabel: 'What moves him',
            fuelBold: 'He lights up when you name him as part of the plan.',
            fuelRest:
                ' Feeling that his role is clear and that the team needs him is his best fuel. He doesn\'t chase the spotlight. He chases belonging.',
            decisionLabel: 'Decision pattern',
            decisionBold: 'He decides for stability before speed.',
            decisionRest: ' Before choosing, he weighs how the decision will affect the group.',
            digestBold: 'What this means for training.',
            digestRest:
                ' Give him time to respond. If you rush him, he tends to pass the play instead of taking it on.',
            commLabel: 'Communication',
            bridgeLabel: 'Bridge words',
            bridgeWords: ['Counting on you', 'Your turn', 'Hold the team', 'Easy'],
            avoidLabel: 'Avoid',
            avoidWords: ['Now!', 'React!', 'Faster!', 'Alone'],
            secLabel: 'Secondary tendency · with a social compass',
            secBody:
                'The social layer isn\'t noise for Joaquín. It\'s information. He reads gestures, tones, shifts in the group\'s mood. That sensitivity makes him a natural bridge between the kids who push and the ones who fall behind.',
            checklistLabel: 'Training checklist',
            beforeTitle: 'Before training',
            beforeBody:
                'Remind him of his concrete role. One sentence is enough: "Today I need you reading the midfield."',
            duringTitle: 'During the session',
            duringBody:
                'Place him near players who need anchoring, not next to the loudest ones. His rhythm settles them.',
            afterTitle: 'After the match',
            afterBody:
                'Ask him what he felt from the group, not only what he did. That\'s the question he cares about most.',
            echoesLabel: 'Echoes off the field',
            echoesBody:
                'At home he\'s likely the one who asks before he takes, who gives up the last slice of pizza. That same sensitivity can lead him to keep painful things to himself. It helps to leave the door open without forcing him to walk through it.',
            resetLabel: 'Reset advice',
            resetBold: 'When he wobbles, he doesn\'t need correction.',
            resetRest: ' He needs a brief pause and an open question. ',
            resetQuote: '"What did you feel just now?"',
            resetClose: ' That tends to be enough.',
            disclaimerA: 'This report doesn\'t evaluate talent or predict future athletic outcomes.',
            disclaimerB: 'It describes current tendencies that will evolve as Joaquín matures.',
            scrollHint: '↓ Scroll to read the full report',
        },
        insight: {
            eyebrow: 'The premise',
            h1: 'The Argo carried fifty crew members.',
            h2: 'Each one had an exact place.',
            p1: 'That is the image we hold for children in sport.',
            p2Bold: 'There are no wrong children. There are children in the wrong place.',
            p2Rest: ' Behind each one, almost always, an adult who never quite understood them.',
            p3:
                'Argo exists to change that. So kids enjoy sport more, and the adults around them know how to walk alongside.',
        },
        how: {
            eyebrow: 'How it works',
            h1: 'The child doesn\'t take a test.',
            h2: 'They live an adventure.',
            sub:
                'Gamification isn\'t decoration. It\'s the only thing that makes the results believable. A child doesn\'t answer authentically when they feel they\'re being evaluated.',
            step1Title: 'The child plays',
            step1Body:
                'A twelve-minute nautical odyssey. Three reaction mini-games and twelve decisions told as chapters of a story. No forms, no clinical questions, no labels.',
            step2Title: 'Our model processes',
            step2Body:
                'Every decision and every reaction translates into two dimensions: how they behave in a group (conduct) and at what tempo they decide and process (motor). Twelve archetypes and twelve secondary tendencies resolve the combination.',
            step3Title: 'The adult receives',
            step3Body:
                'A complete report with archetype, secondary tendency, internal fuel, bridge words, training checklist, and accompaniment advice. Delivered to the coach and the family by email.',
            mapLabel: 'The primary map',
            matrixHeaders: ['Dynamic', 'Rhythmic', 'Serene'],
            matrixAxes: { D: 'Driver', I: 'Connector', S: 'Sustainer', C: 'Strategist' } as Record<'D' | 'I' | 'S' | 'C', string>,
            matrixCObservador: 'Observant',
            captionA: 'Four behavioral axes. Three processing tempos. Twelve primary archetypes.',
            captionB: 'Each crosses with one of twelve secondary tendencies. ',
            captionBold: 'Over a hundred possible combinations.',
            captionC: ' None better than another.',
        },
        intel: {
            eyebrow: 'The intelligence behind Argo',
            h1: 'The report is just the beginning.',
            h2: 'The AI walks with the coach through the entire season.',
            sub:
                'Three connected layers, trained on the twelve archetypes, the twelve secondary tendencies, and fifty-seven real situations from youth coaching.',
            layer1: 'Layer 1',
            layer1Title: 'Argo Coach',
            layer1Body:
                'A conversational assistant the coach can ask anything about any player. The AI knows the real profile of every child on the team and answers in concrete, probabilistic language, free of clinical jargon.',
            layer1Quote: '"How do I motivate a Rhythmic Sustainer who doesn\'t want to start training?"',
            layer2: 'Layer 2',
            layer2Title: 'Balanced Teams',
            layer2Body:
                'Reads the group\'s behavioral composition and suggests pairings. Detects when a team is dominated by a single energy, when it lacks support, which pairs amplify each other. The coach decides. Argo informs.',
            layer2Quote:
                'High competitive energy. Suggestion: rotate the Rhythmic Strategist to the center to anchor the pressure.',
            layer3: 'Layer 3',
            layer3Title: 'Situation Predictor',
            layer3Body:
                'Fifty-seven real scenarios mapped by profile. Frustration after a loss, pre-match nerves, a player who punishes himself after a mistake. For each situation, a distinct response depending on the archetype.',
            layer3Quote: 'Joaquín punishes himself after a mistake. Three steps to reset him without lecturing.',
        },
        glance: {
            eyebrow: 'The product',
            h1: 'One system. Three surfaces.',
            s1Caption: 'For the child',
            s1Title: 'The odyssey',
            s1Body:
                'A twelve-minute gamified experience. Three scenes, three mini-games, zero forms.',
            s2Caption: 'For the club',
            s2Title: 'The dashboard',
            s2Body:
                'The full team, profiles per player, group balance, Argo Coach trained on the twelve archetypes.',
            s3Caption: 'For the family',
            s3Title: 'The report',
            s3Body:
                'Delivered by email to the responsible adult. Probabilistic language, strength-based, free of clinical jargon.',
            closeA: 'Every child has a place on the ship.',
            closeB: 'Argo helps them find it.',
        },
        phone: {
            chapter: 'Open Sea',
            name: 'Joaquín',
            question: 'What do you do first?',
            options: [
                'Check that everything is ready.',
                'Jump on board now!',
                'Settle in calmly.',
                'Look for my friends.',
            ],
        },
        dashboard: { team: 'Under-12 team' },
        email: {
            from: 'From: Argo Method',
            subject: 'Joaquín\'s profile is ready',
            archetype: 'Rhythmic Sustainer',
            body: 'Joaquín tends to read the group before he moves…',
            cta: 'Read full report',
        },
    },
};

type Translations = typeof T['es'];

// ─── Context ─────────────────────────────────────────────────────────────────
const DeckLangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
    lang: 'es',
    setLang: () => {},
});
const useT = (): Translations => T[useContext(DeckLangContext).lang];

// ─── Motion helper ───────────────────────────────────────────────────────────
const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-80px' },
    transition: { duration: 0.7, ease: [0.25, 0, 0, 1] as [number, number, number, number], delay },
});

// ─── Lang toggle ─────────────────────────────────────────────────────────────
const LangToggle: React.FC = () => {
    const { lang, setLang } = useContext(DeckLangContext);
    const btn = (l: Lang, label: string) => (
        <button
            type="button"
            onClick={() => setLang(l)}
            className="px-2.5 py-1 rounded-full transition-colors"
            style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.08em',
                color: lang === l ? '#1D1D1F' : '#86868B',
                backgroundColor: lang === l ? '#fff' : 'transparent',
                boxShadow: lang === l ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
            }}
        >
            {label}
        </button>
    );
    return (
        <div
            className="inline-flex items-center rounded-full p-0.5"
            style={{ backgroundColor: '#F0F0F3', border: '1px solid #E8E8ED' }}
        >
            {btn('es', 'ES')}
            {btn('en', 'EN')}
        </div>
    );
};

// ─── Top nav ─────────────────────────────────────────────────────────────────
const Nav: React.FC = () => {
    const t = useT();
    return (
        <nav className="absolute top-0 left-0 right-0 z-30 px-6 md:px-10 py-5 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-argo-navy">
                <span style={{ fontSize: 18, letterSpacing: '-0.02em' }}>
                    <span style={{ fontWeight: 800 }}>Argo</span>
                    <span style={{ fontWeight: 100 }}> Method</span>
                </span>
                <span className="hidden sm:inline-block text-[10px] tracking-widest uppercase text-argo-grey font-medium ml-2">
                    {t.nav.deckLabel}
                </span>
            </Link>
            <div className="flex items-center gap-4">
                <LangToggle />
                <Link to="/" className="hidden md:inline text-sm text-argo-grey hover:text-argo-navy transition-colors">
                    {t.nav.back}
                </Link>
            </div>
        </nav>
    );
};

// ─── Hero: contrast split ────────────────────────────────────────────────────
const Hero: React.FC = () => {
    const t = useT();
    return (
        <section className="relative min-h-screen w-full overflow-hidden">
            <Nav />

            <div className="absolute top-0 left-0 right-0 pt-28 md:pt-36 px-6 md:px-10 z-20 pointer-events-none">
                <motion.h1
                    {...fadeUp(0.1)}
                    className="max-w-5xl mx-auto text-center text-argo-navy"
                    style={{
                        fontWeight: 300,
                        fontSize: 'clamp(32px, 5.5vw, 64px)',
                        lineHeight: 1.05,
                        letterSpacing: '-0.025em',
                    }}
                >
                    {t.hero.headlineA}
                    <br />
                    <span style={{ fontWeight: 500 }}>{t.hero.headlineB}</span>
                </motion.h1>
                <motion.p
                    {...fadeUp(0.3)}
                    className="max-w-2xl mx-auto text-center mt-6 text-argo-grey"
                    style={{ fontSize: 'clamp(15px, 1.4vw, 18px)', lineHeight: 1.6 }}
                >
                    {t.hero.subhead}
                </motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen pt-[44vh] md:pt-[42vh]">
                <motion.div
                    {...fadeUp(0.5)}
                    className="px-6 md:px-12 py-12 md:py-20 flex flex-col justify-start"
                    style={{ backgroundColor: '#F5F5F7' }}
                >
                    <div className="max-w-sm mx-auto md:ml-auto md:mr-12 w-full">
                        <div className="text-[10px] tracking-widest uppercase text-argo-grey font-semibold mb-4">
                            {t.hero.beforeArgo}
                        </div>
                        <h3
                            className="text-argo-navy mb-8"
                            style={{ fontWeight: 400, fontSize: 22, letterSpacing: '-0.01em' }}
                        >
                            {t.hero.leftTitle}
                        </h3>
                        <ul className="space-y-3 text-argo-secondary" style={{ fontSize: 15 }}>
                            {t.hero.data.map((d) => (
                                <DataRow key={d.label} label={d.label} value={d.value} muted={d.muted} />
                            ))}
                        </ul>
                    </div>
                </motion.div>

                <motion.div
                    {...fadeUp(0.65)}
                    className="relative px-6 md:px-12 py-12 md:py-20 flex flex-col justify-start overflow-hidden"
                    style={{ backgroundColor: '#1D1D1F' }}
                >
                    <div
                        aria-hidden
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background:
                                'radial-gradient(circle at 80% 20%, rgba(149,95,181,0.15), transparent 60%)',
                        }}
                    />
                    <div className="relative max-w-sm mx-auto md:mr-auto md:ml-12 w-full">
                        <div className="text-[10px] tracking-widest uppercase font-semibold mb-4" style={{ color: '#BBBCFF' }}>
                            {t.hero.withArgo}
                        </div>
                        <h3
                            className="mb-8"
                            style={{ fontWeight: 400, fontSize: 22, letterSpacing: '-0.01em', color: '#fff' }}
                        >
                            {t.hero.rightTitle}
                        </h3>
                        <ReportPreview />
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

const DataRow: React.FC<{ label: string; value: string; muted?: boolean }> = ({ label, value, muted }) => (
    <li className="flex items-baseline justify-between gap-4 border-b border-argo-border/70 pb-2">
        <span className="text-argo-grey" style={{ fontSize: 13 }}>{label}</span>
        <span
            className={muted ? 'text-argo-light' : 'text-argo-navy'}
            style={{ fontSize: 14, fontWeight: muted ? 400 : 500 }}
        >
            {value}
        </span>
    </li>
);

// ─── Report preview card ─────────────────────────────────────────────────────
const ReportPreview: React.FC = () => {
    const t = useT().report;
    const sustenColor = AXIS_COLORS.S;
    const conectorColor = AXIS_COLORS.I;

    return (
        <div
            className="rounded-[14px] overflow-hidden flex flex-col"
            style={{
                backgroundColor: '#fff',
                boxShadow: '0 24px 70px -20px rgba(0,0,0,0.55)',
                maxHeight: '70vh',
            }}
        >
            <div className="px-5 py-4 flex-shrink-0" style={{ backgroundColor: '#1D1D1F', color: '#fff' }}>
                <div className="text-[10px] tracking-widest uppercase mb-1" style={{ color: '#86868B', fontWeight: 600 }}>
                    {t.header}
                </div>
                <div style={{ fontSize: 14, fontWeight: 400 }}>
                    Joaquín M. <span style={{ color: '#86868B' }}>· {t.meta}</span>
                </div>
            </div>

            <div className="overflow-y-auto px-5 py-5 space-y-6 scroll-smooth" style={{ backgroundColor: '#FBFBFD' }}>
                <div>
                    <ReportLabel>{t.profileLabel}</ReportLabel>
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span
                            className="rounded-full px-2.5 py-0.5 flex items-center gap-1.5"
                            style={{ backgroundColor: sustenColor + '22', color: sustenColor, fontSize: 11, fontWeight: 600 }}
                        >
                            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: sustenColor }} />
                            {t.archetype}
                        </span>
                        <span style={{ fontSize: 11, fontStyle: 'italic', color: '#86868B' }}>{t.secondary}</span>
                    </div>
                    <ReportBody>
                        <strong>{t.profileBold}</strong>
                        {t.profileRest}
                    </ReportBody>
                    <AxisBars />
                </div>

                <ReportDivider />

                <ReportItem label={t.motorLabel}>
                    <strong>{t.motorBold}</strong>
                    {t.motorRest}
                </ReportItem>

                <ReportItem label={t.fuelLabel}>
                    <strong>{t.fuelBold}</strong>
                    {t.fuelRest}
                </ReportItem>

                <ReportItem label={t.decisionLabel}>
                    <strong>{t.decisionBold}</strong>
                    {t.decisionRest}
                    <DigestBox>
                        <strong>{t.digestBold}</strong>
                        {t.digestRest}
                    </DigestBox>
                </ReportItem>

                <ReportItem label={t.commLabel}>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                        <div>
                            <div className="text-[9px] tracking-widest uppercase font-semibold mb-1.5" style={{ color: '#22c55e' }}>
                                {t.bridgeLabel}
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {t.bridgeWords.map((w) => (
                                    <Pill key={w} color="#22c55e">{w}</Pill>
                                ))}
                            </div>
                        </div>
                        <div>
                            <div className="text-[9px] tracking-widest uppercase font-semibold mb-1.5" style={{ color: '#ef4444' }}>
                                {t.avoidLabel}
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {t.avoidWords.map((w) => (
                                    <Pill key={w} color="#ef4444">{w}</Pill>
                                ))}
                            </div>
                        </div>
                    </div>
                </ReportItem>

                <ReportItem label={t.secLabel}>
                    <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', backgroundColor: conectorColor, marginRight: 8, verticalAlign: 'middle' }} />
                    {t.secBody}
                </ReportItem>

                <ReportItem label={t.checklistLabel}>
                    <div className="space-y-2 mt-2">
                        <ChecklistRow dot="#955FB5" title={t.beforeTitle}>{t.beforeBody}</ChecklistRow>
                        <ChecklistRow dot="#22c55e" title={t.duringTitle}>{t.duringBody}</ChecklistRow>
                        <ChecklistRow dot="#f59e0b" title={t.afterTitle}>{t.afterBody}</ChecklistRow>
                    </div>
                </ReportItem>

                <ReportItem label={t.echoesLabel}>{t.echoesBody}</ReportItem>

                <ReportItem label={t.resetLabel}>
                    <strong>{t.resetBold}</strong>
                    {t.resetRest}
                    <em>{t.resetQuote}</em>
                    {t.resetClose}
                </ReportItem>

                <div className="text-center py-4 mt-2" style={{ fontSize: 10, color: '#AEAEB2', lineHeight: 1.6 }}>
                    {t.disclaimerA}
                    <br />
                    {t.disclaimerB}
                </div>
            </div>

            <div
                className="flex-shrink-0 text-center py-2.5"
                style={{
                    backgroundColor: '#F5F5F7',
                    borderTop: '1px solid #E8E8ED',
                    fontSize: 10,
                    color: '#86868B',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                }}
            >
                {t.scrollHint}
            </div>
        </div>
    );
};

const ReportLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="text-[9px] tracking-widest uppercase font-semibold mb-2" style={{ color: '#86868B', letterSpacing: '0.12em' }}>
        {children}
    </div>
);

const ReportBody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div style={{ color: '#424245', fontSize: 12.5, lineHeight: 1.65 }}>{children}</div>
);

const ReportItem: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <ReportLabel>{label}</ReportLabel>
        <ReportBody>{children}</ReportBody>
    </div>
);

const ReportDivider: React.FC = () => <div style={{ height: 1, backgroundColor: '#E8E8ED' }} />;

const DigestBox: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div
        className="rounded-md mt-2 px-3 py-2"
        style={{
            borderLeft: '2px solid #955FB5',
            backgroundColor: '#F9F5FC',
            fontSize: 11.5,
            color: '#424245',
            lineHeight: 1.6,
        }}
    >
        {children}
    </div>
);

const Pill: React.FC<{ children: React.ReactNode; color: string }> = ({ children, color }) => (
    <span
        className="rounded-full px-2 py-0.5"
        style={{
            backgroundColor: color + '18',
            color,
            fontSize: 10,
            fontWeight: 600,
            border: `1px solid ${color}25`,
        }}
    >
        {children}
    </span>
);

const ChecklistRow: React.FC<{ dot: string; title: string; children: React.ReactNode }> = ({ dot, title, children }) => (
    <div className="flex items-start gap-2.5">
        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: dot, marginTop: 6, flexShrink: 0 }} />
        <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#1D1D1F', marginBottom: 2 }}>{title}</div>
            <div style={{ fontSize: 11.5, color: '#424245', lineHeight: 1.55 }}>{children}</div>
        </div>
    </div>
);

const AxisBars: React.FC = () => {
    const axes: { eje: 'D' | 'I' | 'S' | 'C'; pct: number }[] = [
        { eje: 'D', pct: 18 },
        { eje: 'I', pct: 28 },
        { eje: 'S', pct: 42 },
        { eje: 'C', pct: 12 },
    ];
    return (
        <div className="mt-4 space-y-1.5">
            {axes.map((a) => (
                <div key={a.eje} className="flex items-center gap-2">
                    <span style={{ width: 10, fontSize: 9, fontWeight: 700, color: AXIS_COLORS[a.eje] }}>{a.eje}</span>
                    <div className="flex-1 rounded-full overflow-hidden" style={{ height: 4, backgroundColor: '#F0F0F3' }}>
                        <div
                            style={{
                                width: `${a.pct}%`,
                                height: '100%',
                                backgroundColor: AXIS_COLORS[a.eje],
                                opacity: a.eje === 'S' ? 1 : 0.4,
                            }}
                        />
                    </div>
                    <span style={{ width: 24, textAlign: 'right', fontSize: 9, color: '#86868B', fontWeight: 600 }}>{a.pct}%</span>
                </div>
            ))}
        </div>
    );
};

// ─── Section 2: The insight ──────────────────────────────────────────────────
const Insight: React.FC = () => {
    const t = useT().insight;
    return (
        <section className="py-32 md:py-40 px-6 md:px-10 bg-white">
            <div className="max-w-3xl mx-auto text-center">
                <motion.div {...fadeUp()} className="text-[10px] tracking-widest uppercase text-argo-grey font-semibold mb-6">
                    {t.eyebrow}
                </motion.div>
                <motion.h2
                    {...fadeUp(0.1)}
                    className="text-argo-navy"
                    style={{ fontWeight: 300, fontSize: 'clamp(28px, 4vw, 44px)', lineHeight: 1.18, letterSpacing: '-0.02em' }}
                >
                    {t.h1}
                    <br />
                    <span style={{ fontWeight: 500 }}>{t.h2}</span>
                </motion.h2>
                <motion.p
                    {...fadeUp(0.25)}
                    className="mt-10 text-argo-secondary max-w-2xl mx-auto"
                    style={{ fontSize: 18, lineHeight: 1.75 }}
                >
                    {t.p1}
                </motion.p>
                <motion.p
                    {...fadeUp(0.4)}
                    className="mt-6 text-argo-secondary max-w-2xl mx-auto"
                    style={{ fontSize: 17, lineHeight: 1.75 }}
                >
                    <strong className="text-argo-navy" style={{ fontWeight: 600 }}>{t.p2Bold}</strong>
                    {t.p2Rest}
                </motion.p>
                <motion.p
                    {...fadeUp(0.55)}
                    className="mt-8 text-argo-grey max-w-2xl mx-auto"
                    style={{ fontSize: 16, lineHeight: 1.75, fontStyle: 'italic' }}
                >
                    {t.p3}
                </motion.p>
            </div>
        </section>
    );
};

// ─── Section 3: How it works ─────────────────────────────────────────────────
const HowItWorks: React.FC = () => {
    const t = useT().how;
    return (
        <section className="py-28 md:py-36 px-6 md:px-10 bg-argo-neutral">
            <div className="max-w-6xl mx-auto">
                <motion.div {...fadeUp()} className="text-center mb-16">
                    <div className="text-[10px] tracking-widest uppercase text-argo-grey font-semibold mb-4">
                        {t.eyebrow}
                    </div>
                    <h2
                        className="text-argo-navy"
                        style={{ fontWeight: 300, fontSize: 'clamp(28px, 4vw, 42px)', lineHeight: 1.15, letterSpacing: '-0.02em' }}
                    >
                        {t.h1}
                        <br />
                        <span style={{ fontWeight: 500 }}>{t.h2}</span>
                    </h2>
                    <p className="mt-6 text-argo-secondary max-w-2xl mx-auto" style={{ fontSize: 16, lineHeight: 1.7 }}>
                        {t.sub}
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-24">
                    <Step n="01" title={t.step1Title} body={t.step1Body} delay={0.1} />
                    <Step n="02" title={t.step2Title} body={t.step2Body} delay={0.25} />
                    <Step n="03" title={t.step3Title} body={t.step3Body} delay={0.4} />
                </div>

                <motion.div {...fadeUp(0.2)}>
                    <div className="text-center mb-8">
                        <div className="text-[10px] tracking-widest uppercase text-argo-grey font-semibold">
                            {t.mapLabel}
                        </div>
                    </div>
                    <Matrix />
                    <p className="text-center text-argo-grey mt-6 max-w-2xl mx-auto" style={{ fontSize: 14, lineHeight: 1.7 }}>
                        {t.captionA}
                        <br />
                        {t.captionB}
                        <strong className="text-argo-navy" style={{ fontWeight: 700 }}>{t.captionBold}</strong>
                        {t.captionC}
                    </p>
                </motion.div>
            </div>
        </section>
    );
};

const Step: React.FC<{ n: string; title: string; body: string; delay: number }> = ({ n, title, body, delay }) => (
    <motion.div {...fadeUp(delay)} className="flex flex-col">
        <div className="text-argo-violet-500 mb-4" style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.08em' }}>
            {n}
        </div>
        <h3 className="text-argo-navy mb-3" style={{ fontWeight: 500, fontSize: 22, letterSpacing: '-0.01em' }}>
            {title}
        </h3>
        <p className="text-argo-secondary" style={{ fontSize: 15, lineHeight: 1.7 }}>{body}</p>
    </motion.div>
);

const Matrix: React.FC = () => {
    const t = useT().how;
    const axesOrder: ('D' | 'I' | 'S' | 'C')[] = ['D', 'I', 'S', 'C'];

    return (
        <div className="rounded-[14px] overflow-hidden bg-white" style={{ border: '1px solid #E8E8ED', boxShadow: '0 8px 30px -10px rgba(0,0,0,0.06)' }}>
            <div
                className="grid"
                style={{ gridTemplateColumns: '160px 1fr 1fr 1fr', borderBottom: '1px solid #E8E8ED', backgroundColor: '#FBFBFD' }}
            >
                <div />
                {t.matrixHeaders.map((m) => (
                    <div
                        key={m}
                        className="px-4 py-3 text-center"
                        style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: '#86868B',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                        }}
                    >
                        {m}
                    </div>
                ))}
            </div>

            {axesOrder.map((eje, idx) => {
                const motors =
                    eje === 'C'
                        ? [t.matrixHeaders[0], t.matrixHeaders[1], t.matrixCObservador]
                        : t.matrixHeaders;
                return (
                    <div
                        key={eje}
                        className="grid"
                        style={{
                            gridTemplateColumns: '160px 1fr 1fr 1fr',
                            borderBottom: idx < axesOrder.length - 1 ? '1px solid #F0F0F3' : 'none',
                        }}
                    >
                        <div className="px-4 py-5 flex items-center gap-3" style={{ backgroundColor: '#FBFBFD' }}>
                            <span
                                className="rounded-full"
                                style={{ width: 8, height: 8, backgroundColor: AXIS_COLORS[eje], flexShrink: 0 }}
                            />
                            <span className="text-argo-navy" style={{ fontSize: 13, fontWeight: 600 }}>
                                {t.matrixAxes[eje]}
                            </span>
                        </div>
                        {motors.map((motor) => (
                            <div
                                key={motor}
                                className="px-4 py-5 text-center text-argo-secondary border-l"
                                style={{ fontSize: 13, borderColor: '#F0F0F3', fontWeight: 400 }}
                            >
                                <span style={{ color: AXIS_COLORS[eje], fontWeight: 600 }}>{t.matrixAxes[eje]}</span>{' '}
                                <span style={{ color: '#86868B' }}>{motor}</span>
                            </div>
                        ))}
                    </div>
                );
            })}
        </div>
    );
};

// ─── Section 3b: The intelligence layer ──────────────────────────────────────
const Intelligence: React.FC = () => {
    const t = useT().intel;
    return (
        <section className="py-28 md:py-36 px-6 md:px-10 relative overflow-hidden" style={{ backgroundColor: '#1D1D1F' }}>
            <div
                aria-hidden
                className="absolute inset-0 pointer-events-none"
                style={{
                    background:
                        'radial-gradient(circle at 20% 30%, rgba(149,95,181,0.18), transparent 50%), radial-gradient(circle at 80% 70%, rgba(99,102,241,0.12), transparent 55%)',
                }}
            />
            <div className="relative max-w-6xl mx-auto">
                <motion.div {...fadeUp()} className="text-center mb-20">
                    <div className="text-[10px] tracking-widest uppercase font-semibold mb-4" style={{ color: '#BBBCFF' }}>
                        {t.eyebrow}
                    </div>
                    <h2 style={{ color: '#fff', fontWeight: 300, fontSize: 'clamp(28px, 4vw, 44px)', lineHeight: 1.18, letterSpacing: '-0.02em' }}>
                        {t.h1}
                        <br />
                        <span style={{ fontWeight: 500 }}>{t.h2}</span>
                    </h2>
                    <p className="mt-6 max-w-2xl mx-auto" style={{ color: '#AEAEB2', fontSize: 16, lineHeight: 1.7 }}>
                        {t.sub}
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
                    <IntelCard eyebrow={t.layer1} title={t.layer1Title} body={t.layer1Body} quote={t.layer1Quote} delay={0.1} />
                    <IntelCard eyebrow={t.layer2} title={t.layer2Title} body={t.layer2Body} quote={t.layer2Quote} delay={0.25} />
                    <IntelCard eyebrow={t.layer3} title={t.layer3Title} body={t.layer3Body} quote={t.layer3Quote} delay={0.4} />
                </div>
            </div>
        </section>
    );
};

const IntelCard: React.FC<{
    eyebrow: string;
    title: string;
    body: string;
    quote: string;
    delay: number;
}> = ({ eyebrow, title, body, quote, delay }) => (
    <motion.div
        {...fadeUp(delay)}
        className="rounded-[14px] p-7 flex flex-col"
        style={{
            backgroundColor: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(8px)',
        }}
    >
        <div className="text-[10px] tracking-widest uppercase font-semibold mb-4" style={{ color: '#BBBCFF', letterSpacing: '0.12em' }}>
            {eyebrow}
        </div>
        <h3 className="mb-3" style={{ color: '#fff', fontWeight: 500, fontSize: 20, letterSpacing: '-0.01em' }}>
            {title}
        </h3>
        <p style={{ color: '#D2D2D7', fontSize: 14, lineHeight: 1.7 }}>{body}</p>
        <div
            className="mt-5 pt-4 rounded-md px-4 py-3"
            style={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                borderLeft: '2px solid #BBBCFF',
                fontSize: 12.5,
                fontStyle: 'italic',
                color: '#AEAEB2',
                lineHeight: 1.55,
            }}
        >
            {quote}
        </div>
    </motion.div>
);

// ─── Section 4: Product at a glance ──────────────────────────────────────────
const Glance: React.FC = () => {
    const t = useT().glance;
    return (
        <section className="py-28 md:py-36 px-6 md:px-10 bg-white">
            <div className="max-w-6xl mx-auto">
                <motion.div {...fadeUp()} className="text-center mb-20">
                    <div className="text-[10px] tracking-widest uppercase text-argo-grey font-semibold mb-4">
                        {t.eyebrow}
                    </div>
                    <h2
                        className="text-argo-navy"
                        style={{ fontWeight: 300, fontSize: 'clamp(28px, 4vw, 42px)', lineHeight: 1.15, letterSpacing: '-0.02em' }}
                    >
                        {t.h1}
                    </h2>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Surface caption={t.s1Caption} title={t.s1Title} body={t.s1Body} delay={0.1}>
                        <PhoneMock />
                    </Surface>
                    <Surface caption={t.s2Caption} title={t.s2Title} body={t.s2Body} delay={0.25}>
                        <DashboardMock />
                    </Surface>
                    <Surface caption={t.s3Caption} title={t.s3Title} body={t.s3Body} delay={0.4}>
                        <EmailMock />
                    </Surface>
                </div>

                <motion.div {...fadeUp(0.3)} className="text-center mt-24 max-w-2xl mx-auto">
                    <p
                        className="text-argo-navy"
                        style={{ fontWeight: 300, fontSize: 'clamp(22px, 3vw, 32px)', lineHeight: 1.3, letterSpacing: '-0.02em' }}
                    >
                        {t.closeA}
                        <br />
                        <span style={{ fontWeight: 500 }}>{t.closeB}</span>
                    </p>
                </motion.div>
            </div>
        </section>
    );
};

const Surface: React.FC<{
    caption: string;
    title: string;
    body: string;
    delay: number;
    children: React.ReactNode;
}> = ({ caption, title, body, delay, children }) => (
    <motion.div
        {...fadeUp(delay)}
        className="rounded-[14px] overflow-hidden flex flex-col"
        style={{ border: '1px solid #E8E8ED', backgroundColor: '#FBFBFD' }}
    >
        <div className="aspect-[4/3] flex items-center justify-center p-6 relative overflow-hidden" style={{ backgroundColor: '#F5F5F7' }}>
            {children}
        </div>
        <div className="px-6 py-6 bg-white border-t border-argo-border">
            <div className="text-[10px] tracking-widest uppercase text-argo-grey font-semibold mb-2">{caption}</div>
            <h3 className="text-argo-navy mb-2" style={{ fontWeight: 500, fontSize: 18, letterSpacing: '-0.01em' }}>
                {title}
            </h3>
            <p className="text-argo-secondary" style={{ fontSize: 14, lineHeight: 1.6 }}>{body}</p>
        </div>
    </motion.div>
);

// ─── Phone mock (mirrors QuestionScreenV2) ───────────────────────────────────
const PhoneMock: React.FC = () => {
    const t = useT().phone;
    const optionColors = {
        A: '#3B82F6',
        B: '#F59E0B',
        C: '#8B5CF6',
        D: '#10B981',
    };
    const letters: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];

    return (
        <div
            className="rounded-[22px] overflow-hidden relative flex flex-col"
            style={{
                width: 160,
                height: 290,
                border: '4px solid #2A2A2E',
                boxShadow: '0 14px 40px -10px rgba(0,0,0,0.35)',
                background: 'linear-gradient(180deg, #0a1428 0%, #0f1f3d 40%, #1a3055 80%, #234070 100%)',
            }}
        >
            <div className="px-3 pt-4 pb-2">
                <div
                    className="text-center mb-2"
                    style={{
                        fontSize: 7.5,
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        color: 'rgba(255,255,255,0.55)',
                        fontWeight: 700,
                    }}
                >
                    {t.chapter}
                </div>
                <div className="flex items-center justify-center gap-1">
                    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                        <span
                            key={i}
                            style={{
                                width: i === 3 ? 6 : 4,
                                height: i === 3 ? 6 : 4,
                                borderRadius: '50%',
                                backgroundColor:
                                    i < 3 ? '#34D399' : i === 3 ? '#BBBCFF' : 'rgba(255,255,255,0.18)',
                                boxShadow: i === 3 ? '0 0 6px #BBBCFF' : 'none',
                            }}
                        />
                    ))}
                </div>
            </div>

            <div className="flex justify-center mt-1">
                <span
                    style={{
                        backgroundColor: 'rgba(0,0,0,0.4)',
                        color: '#fff',
                        fontSize: 7,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 999,
                    }}
                >
                    {t.name}
                </span>
            </div>

            <div
                className="px-3 pt-2 text-center"
                style={{ color: '#fff', fontSize: 11, lineHeight: 1.35, fontWeight: 400, letterSpacing: '-0.01em' }}
            >
                {t.question}
            </div>

            <div className="px-3 mt-2.5 space-y-1.5 flex-1">
                {letters.map((L, i) => (
                    <PhoneOption key={L} letter={L} color={optionColors[L]} text={t.options[i]} />
                ))}
            </div>
        </div>
    );
};

const PhoneOption: React.FC<{ letter: string; color: string; text: string }> = ({ letter, color, text }) => (
    <div
        className="flex items-center gap-1.5 rounded-md px-1.5 py-1.5"
        style={{
            backgroundColor: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(8px)',
        }}
    >
        <span
            className="flex items-center justify-center rounded-md flex-shrink-0"
            style={{ width: 14, height: 14, backgroundColor: color, color: '#fff', fontSize: 8, fontWeight: 700 }}
        >
            {letter}
        </span>
        <span style={{ color: '#fff', fontSize: 7.5, lineHeight: 1.25 }}>{text}</span>
    </div>
);

// ─── Dashboard mock ──────────────────────────────────────────────────────────
const DashboardMock: React.FC = () => {
    const t = useT().dashboard;
    const players: { name: string; eje: 'D' | 'I' | 'S' | 'C' }[] = [
        { name: 'Joaquín M.', eje: 'S' },
        { name: 'Allegra V.', eje: 'I' },
        { name: 'Mateo R.', eje: 'D' },
        { name: 'Tomás G.', eje: 'C' },
        { name: 'Sofía F.', eje: 'S' },
    ];
    return (
        <div
            className="rounded-[10px] overflow-hidden bg-white"
            style={{ width: '90%', border: '1px solid #E8E8ED', boxShadow: '0 14px 40px -10px rgba(0,0,0,0.08)' }}
        >
            <div className="flex items-center gap-1.5 px-3 py-2" style={{ backgroundColor: '#F5F5F7', borderBottom: '1px solid #E8E8ED' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#E8E8ED', display: 'inline-block' }} />
                <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#E8E8ED', display: 'inline-block' }} />
                <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#E8E8ED', display: 'inline-block' }} />
            </div>
            <div className="px-4 py-3">
                <div style={{ fontSize: 9, fontWeight: 700, color: '#86868B', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                    {t.team}
                </div>
                <div className="space-y-1.5">
                    {players.map((p) => (
                        <div key={p.name} className="flex items-center justify-between rounded px-2 py-1.5" style={{ backgroundColor: '#FBFBFD' }}>
                            <div className="flex items-center gap-2">
                                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: AXIS_COLORS[p.eje] }} />
                                <span style={{ fontSize: 10, color: '#1D1D1F', fontWeight: 500 }}>{p.name}</span>
                            </div>
                            <span style={{ fontSize: 8, color: '#86868B' }}>·····</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ─── Email mock ──────────────────────────────────────────────────────────────
const EmailMock: React.FC = () => {
    const t = useT().email;
    return (
        <div
            className="rounded-[10px] overflow-hidden bg-white"
            style={{ width: '88%', border: '1px solid #E8E8ED', boxShadow: '0 14px 40px -10px rgba(0,0,0,0.08)' }}
        >
            <div className="px-4 py-3" style={{ borderBottom: '1px solid #F0F0F3' }}>
                <div style={{ fontSize: 9, color: '#86868B', marginBottom: 2 }}>{t.from}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#1D1D1F' }}>{t.subject}</div>
            </div>
            <div className="px-4 py-4 space-y-2">
                <div
                    className="rounded-full inline-block px-2 py-0.5"
                    style={{ backgroundColor: AXIS_COLORS.S + '20', color: AXIS_COLORS.S, fontSize: 9, fontWeight: 600 }}
                >
                    {t.archetype}
                </div>
                <div style={{ fontSize: 10, color: '#424245', lineHeight: 1.6 }}>{t.body}</div>
                <div
                    className="mt-3 rounded px-3 py-2"
                    style={{
                        backgroundColor: '#F5F5F7',
                        fontSize: 9,
                        color: '#86868B',
                        fontWeight: 600,
                        textAlign: 'center',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                    }}
                >
                    {t.cta}
                </div>
            </div>
        </div>
    );
};

// ─── Footer ──────────────────────────────────────────────────────────────────
const Footer: React.FC = () => (
    <footer className="py-12 px-6 md:px-10 bg-argo-neutral border-t border-argo-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-argo-navy">
                <span style={{ fontSize: 14, letterSpacing: '-0.02em' }}>
                    <span style={{ fontWeight: 800 }}>Argo</span>
                    <span style={{ fontWeight: 100 }}> Method</span>
                </span>
            </div>
            <div className="text-argo-grey" style={{ fontSize: 12 }}>argomethod.com</div>
        </div>
    </footer>
);

// ─── Page ────────────────────────────────────────────────────────────────────
export const Deck: React.FC = () => {
    const [lang, setLang] = useState<Lang>('es');

    React.useEffect(() => {
        document.title = lang === 'es' ? 'Argo Method · Investor Deck' : 'Argo Method · Investor Deck';
        document.documentElement.lang = lang;
    }, [lang]);

    return (
        <DeckLangContext.Provider value={{ lang, setLang }}>
            <div className="bg-white min-h-screen" style={{ fontFamily: 'Inter, sans-serif' }}>
                <Hero />
                <Insight />
                <HowItWorks />
                <Intelligence />
                <Glance />
                <Footer />
            </div>
        </DeckLangContext.Provider>
    );
};

export default Deck;
