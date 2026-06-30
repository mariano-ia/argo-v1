import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Heart,
    Compass,
    ShieldCheck,
    Lightbulb,
    Lock,
    Ship,
    Sparkles,
    MessageCircle,
    ChevronLeft,
    ChevronRight,
    Mail,
} from 'lucide-react';
import { useLang, type Lang } from '../context/LangContext';

/**
 * Familias — public, mobile-first, swipeable explainer a coach sends to parents
 * via WhatsApp BEFORE their child plays the Argo odyssey. Builds trust: what Argo
 * is, that it is NOT a diagnosis or label, what happens with the data, and how to
 * reach us. Trilingual es/en/pt with a manual (non-AI) language selector wired to
 * the app LangContext (browser-detected default). Copy reviewed against the strict
 * Argo rules (tuteo, no dashes, activity-not-only-training framing, no labels,
 * probabilistic language). Typography mirrors the home: light-weight headings,
 * muted kicker, left-aligned. **bold** markers in body/note create reading levels.
 */

const SUPPORT_EMAIL = 'hola@argomethod.com';

const ICONS = [Heart, Compass, ShieldCheck, Lightbulb, Lock, Ship, Sparkles, MessageCircle];

interface Slide {
    id: string;
    eyebrow: string;
    title: string;
    body: string;
    note: string;
}

interface UIStrings {
    swipeHint: string;
    prev: string;
    next: string;
    card: string;
    privacy: string;
    writeUs: string;
    moreInfo: string;
    mailSubject: string;
}

const SLIDES_BY_LANG: Record<Lang, Slide[]> = {
    es: [
        {
            id: 'card-1',
            eyebrow: 'Argo para las familias',
            title: 'Conocerlo un poco mejor para acompañarlo mejor',
            body: '**Nadie lo conoce como tú.** Argo no viene a reemplazar esa mirada, viene a **sumarle algo**. Una forma simple de entender cómo tu hijo vive el deporte, para estar más cerca de lo que siente **dentro y fuera de la cancha**.',
            note: 'Te tomará menos de un minuto leer estas tarjetas. Desliza para conocer de qué se trata.',
        },
        {
            id: 'card-2',
            eyebrow: 'Qué es Argo',
            title: 'Una herramienta que te compartió la institución',
            body: 'Argo es una pequeña odisea, un juego, que ayuda a entender **qué motiva a tu hijo** y **cómo vive el deporte**: qué lo entusiasma, qué disfruta y cómo se siente en el día a día de la actividad.',
            note: 'La decisión de jugar **siempre es de la familia**. Es totalmente opcional.',
        },
        {
            id: 'card-3',
            eyebrow: 'Lo más importante',
            title: 'No es un diagnóstico ni una etiqueta',
            body: 'Argo **no es una prueba** que tu hijo pueda aprobar o reprobar. **No mide talento, no mide rendimiento y no le pone una etiqueta.** Solo describe tendencias, formas en las que suele reaccionar hoy. Esas formas **cambian con el tiempo**, y eso está perfectamente bien.',
            note: '**No hay respuestas correctas ni incorrectas.** Esto es una foto amable del presente, no una sentencia.',
        },
        {
            id: 'card-4',
            eyebrow: 'Para qué sirve',
            title: 'Una mirada para acompañarlo con más calma',
            body: 'Al terminar, se genera **un reporte pensado para ti**, en lenguaje simple. Te ayuda a entender por qué a veces se frustra, **qué lo hace disfrutar** y cómo apoyarlo en un partido o una competencia **sin presionarlo**. Y al entrenador le sirve para acompañarlo en la cancha, en las competencias y en el día a día.',
            note: 'Está escrito en lenguaje claro, sin tecnicismos.',
        },
        {
            id: 'card-5',
            eyebrow: 'Sus datos, con cuidado',
            title: 'La información de tu hijo se cuida',
            body: 'Pedimos **solo lo necesario** para generar el reporte y enviártelo. La información de tu hijo se usa para eso, llega al adulto responsable (madre, padre o tutor) y a la institución que te compartió esto, y nada más. **No vendemos datos ni los usamos para publicidad.**',
            note: 'Si en algún momento quieres que eliminemos la información, escríbenos y lo hacemos.',
        },
        {
            id: 'card-6',
            eyebrow: 'La odisea',
            title: 'Un juego de unos 10 minutos',
            body: 'Tu hijo se sube a un barco y navega una pequeña aventura. Va eligiendo qué haría en distintas situaciones, **sin respuestas buenas ni malas**. **Nada de examen, nada de presión, nada invasivo.** Son preguntas amables, con dibujos, donde simplemente elige lo que más se parece a él.',
            note: 'Lo ideal es que juegue tranquilo, sin apuro. Si en algún momento no quiere seguir, puede dejarlo y retomarlo después.',
        },
        {
            id: 'card-7',
            eyebrow: 'Para cerrar',
            title: 'Gracias por acompañarlo en esto',
            body: '**Cada niño vive el deporte a su manera**, y conocer la suya es una forma linda de cuidarlo y de que **se sienta visto en lo que ama hacer**.',
            note: 'Sin apuros. Cuando estén listos, tu hijo puede comenzar la odisea desde el enlace que te compartió el entrenador o la institución.',
        },
        {
            id: 'card-8',
            eyebrow: '¿Tienes dudas?',
            title: 'Estamos para ayudarte',
            body: 'Si tienes **cualquier pregunta** sobre Argo, cómo funciona o qué pasa con la información, habla con el entrenador o la institución que te compartió esto. También puedes **escribirnos directamente**, con confianza.',
            note: 'Tu tranquilidad y la de tu hijo son lo primero. Ninguna pregunta sobra.',
        },
    ],
    en: [
        {
            id: 'card-1',
            eyebrow: 'Argo for families',
            title: 'Knowing your child a little better to support them better',
            body: '**No one knows your child like you do.** Argo is not here to replace that view, it is here to **add to it**. A simple way to understand how your child experiences their sport, so you can be closer to what they feel **on and off the field**.',
            note: 'It will take you less than a minute to read these cards. Swipe to see what it is about.',
        },
        {
            id: 'card-2',
            eyebrow: 'What Argo is',
            title: 'A tool the institution shared with you',
            body: 'Argo is a small odyssey, a game, that helps understand **what motivates your child** and **how they experience their sport**: what excites them, what they enjoy and how they feel in the day to day of the activity.',
            note: 'The decision to play **is always the family’s**. It is completely optional.',
        },
        {
            id: 'card-3',
            eyebrow: 'The most important thing',
            title: 'It is not a diagnosis or a label',
            body: 'Argo **is not a test** your child can pass or fail. **It does not measure talent, it does not measure performance and it does not put a label on them.** It only describes tendencies, ways they tend to react today. Those ways **change over time**, and that is perfectly fine.',
            note: '**There are no right or wrong answers.** This is a gentle snapshot of the present, not a verdict.',
        },
        {
            id: 'card-4',
            eyebrow: 'What it is for',
            title: 'A view to support them more calmly',
            body: 'When it ends, **a report made for you** is generated, in simple language. It helps you understand why they sometimes get frustrated, **what makes them enjoy it** and how to support them in a match or a competition **without pressuring them**. And it helps the coach support them on the field, in competitions and in the day to day.',
            note: 'It is written in clear language, without jargon.',
        },
        {
            id: 'card-5',
            eyebrow: 'Their data, handled with care',
            title: 'Your child’s information is protected',
            body: 'We ask for **only what is necessary** to generate the report and send it to you. Your child’s information is used for that, it reaches the responsible adult (mother, father or guardian) and the institution that shared this with you, and nothing else. **We do not sell data or use it for advertising.**',
            note: 'If at any point you want us to delete the information, write to us and we will do it.',
        },
        {
            id: 'card-6',
            eyebrow: 'The odyssey',
            title: 'A game of about 10 minutes',
            body: 'Your child boards a ship and sails a small adventure. They choose what they would do in different situations, **with no good or bad answers**. **No exam, no pressure, nothing invasive.** They are gentle questions, with drawings, where they simply pick what is most like them.',
            note: 'Ideally they play calmly, without rushing. If at any point they do not want to continue, they can stop and pick it up later.',
        },
        {
            id: 'card-7',
            eyebrow: 'To close',
            title: 'Thank you for being part of this',
            body: '**Every child experiences sport in their own way**, and knowing theirs is a beautiful way to care for them and to help them **feel seen in what they love to do**.',
            note: 'No rush. When you are ready, your child can begin the odyssey from the link the coach or the institution shared with you.',
        },
        {
            id: 'card-8',
            eyebrow: 'Have questions?',
            title: 'We are here to help',
            body: 'If you have **any question** about Argo, how it works or what happens with the information, talk to the coach or the institution that shared this with you. You can also **write to us directly**, with confidence.',
            note: 'Your peace of mind and your child’s come first. No question is too small.',
        },
    ],
    pt: [
        {
            id: 'card-1',
            eyebrow: 'Argo para as famílias',
            title: 'Conhecê-lo um pouco melhor para acompanhá-lo melhor',
            body: '**Ninguém o conhece como você.** O Argo não vem substituir esse olhar, vem **somar algo a ele**. Uma forma simples de entender como seu filho vive o esporte, para estar mais perto do que ele sente **dentro e fora de campo**.',
            note: 'Você levará menos de um minuto para ler estes cartões. Deslize para conhecer do que se trata.',
        },
        {
            id: 'card-2',
            eyebrow: 'O que é o Argo',
            title: 'Uma ferramenta que a instituição compartilhou com você',
            body: 'O Argo é uma pequena odisseia, um jogo, que ajuda a entender **o que motiva seu filho** e **como ele vive o esporte**: o que o entusiasma, o que ele curte e como se sente no dia a dia da atividade.',
            note: 'A decisão de jogar **é sempre da família**. É totalmente opcional.',
        },
        {
            id: 'card-3',
            eyebrow: 'O mais importante',
            title: 'Não é um diagnóstico nem um rótulo',
            body: 'O Argo **não é uma prova** que seu filho possa passar ou reprovar. **Não mede talento, não mede desempenho e não coloca um rótulo nele.** Apenas descreve tendências, formas como ele costuma reagir hoje. Essas formas **mudam com o tempo**, e isso está perfeitamente bem.',
            note: '**Não há respostas certas ou erradas.** Isto é uma foto carinhosa do presente, não uma sentença.',
        },
        {
            id: 'card-4',
            eyebrow: 'Para que serve',
            title: 'Um olhar para acompanhá-lo com mais calma',
            body: 'Ao terminar, é gerado **um relatório pensado para você**, em linguagem simples. Ajuda você a entender por que às vezes ele se frustra, **o que o faz se divertir** e como apoiá-lo em uma partida ou uma competição **sem pressioná-lo**. E ajuda o treinador a acompanhá-lo em campo, nas competições e no dia a dia.',
            note: 'Está escrito em linguagem clara, sem termos técnicos.',
        },
        {
            id: 'card-5',
            eyebrow: 'Os dados dele, com cuidado',
            title: 'As informações do seu filho são protegidas',
            body: 'Pedimos **apenas o necessário** para gerar o relatório e enviá-lo a você. As informações do seu filho são usadas para isso, chegam ao adulto responsável (mãe, pai ou tutor) e à instituição que compartilhou isto com você, e nada mais. **Não vendemos dados nem os usamos para publicidade.**',
            note: 'Se em algum momento você quiser que apaguemos as informações, escreva para nós e faremos isso.',
        },
        {
            id: 'card-6',
            eyebrow: 'A odisseia',
            title: 'Um jogo de cerca de 10 minutos',
            body: 'Seu filho embarca em um barco e navega uma pequena aventura. Ele vai escolhendo o que faria em diferentes situações, **sem respostas certas ou erradas**. **Nada de prova, nada de pressão, nada invasivo.** São perguntas gentis, com desenhos, onde ele simplesmente escolhe o que mais se parece com ele.',
            note: 'O ideal é que ele jogue tranquilo, sem pressa. Se em algum momento não quiser continuar, pode parar e retomar depois.',
        },
        {
            id: 'card-7',
            eyebrow: 'Para encerrar',
            title: 'Obrigado por acompanhá-lo nisso',
            body: '**Cada criança vive o esporte à sua maneira**, e conhecer a dele é uma forma linda de cuidar dele e de fazê-lo **se sentir visto naquilo que ama fazer**.',
            note: 'Sem pressa. Quando estiverem prontos, seu filho pode começar a odisseia pelo link que o treinador ou a instituição compartilhou com você.',
        },
        {
            id: 'card-8',
            eyebrow: 'Tem dúvidas?',
            title: 'Estamos aqui para ajudar',
            body: 'Se você tiver **qualquer pergunta** sobre o Argo, como funciona ou o que acontece com as informações, fale com o treinador ou a instituição que compartilhou isto com você. Você também pode **escrever para nós diretamente**, com confiança.',
            note: 'A sua tranquilidade e a do seu filho vêm primeiro. Nenhuma pergunta é demais.',
        },
    ],
};

const UI: Record<Lang, UIStrings> = {
    es: {
        swipeHint: 'Desliza para avanzar',
        prev: 'Anterior',
        next: 'Siguiente',
        card: 'Tarjeta',
        privacy: 'Conoce nuestra política de privacidad',
        writeUs: 'Escríbenos',
        moreInfo: 'Ver más info en la web',
        mailSubject: 'Consulta sobre Argo',
    },
    en: {
        swipeHint: 'Swipe to continue',
        prev: 'Previous',
        next: 'Next',
        card: 'Card',
        privacy: 'Read our privacy policy',
        writeUs: 'Write to us',
        moreInfo: 'More info on the website',
        mailSubject: 'Question about Argo',
    },
    pt: {
        swipeHint: 'Deslize para avançar',
        prev: 'Anterior',
        next: 'Próximo',
        card: 'Cartão',
        privacy: 'Conheça nossa política de privacidade',
        writeUs: 'Escreva para nós',
        moreInfo: 'Mais informações no site',
        mailSubject: 'Dúvida sobre o Argo',
    },
};

// Render **bold** segments as semibold navy to create reading levels.
const renderRich = (text: string) =>
    text.split('**').map((part, i) =>
        i % 2 === 1
            ? <strong key={i} className="font-semibold text-argo-navy">{part}</strong>
            : <React.Fragment key={i}>{part}</React.Fragment>
    );

const variants = {
    enter: (dir: number) => ({ x: dir >= 0 ? 48 : -48, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir >= 0 ? -48 : 48, opacity: 0 }),
};

const SWIPE_THRESHOLD = 60;
const LANGS: Lang[] = ['es', 'en', 'pt'];

export const Familias: React.FC = () => {
    const { lang, setLang } = useLang();
    const [[index, direction], setPage] = useState<[number, number]>([0, 0]);

    const slides = SLIDES_BY_LANG[lang] ?? SLIDES_BY_LANG.es;
    const ui = UI[lang] ?? UI.es;
    const total = slides.length;
    const isFirst = index === 0;
    const isLast = index === total - 1;

    const paginate = useCallback((dir: number) => {
        setPage(([cur]) => {
            const next = Math.min(Math.max(cur + dir, 0), total - 1);
            return [next, dir];
        });
    }, [total]);

    const goTo = useCallback((target: number) => {
        setPage(([cur]) => [target, target > cur ? 1 : -1]);
    }, []);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') paginate(1);
            if (e.key === 'ArrowLeft') paginate(-1);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [paginate]);

    const slide = slides[index];
    const Icon = ICONS[index];

    return (
        <div
            className="min-h-[100dvh] flex flex-col items-center bg-argo-neutral"
            style={{ fontFamily: 'Inter, sans-serif' }}
        >
            {/* Header + language selector */}
            <header className="w-full max-w-md px-6 pt-7 pb-2 relative flex items-center justify-center">
                <span style={{ fontSize: '17px', letterSpacing: '-0.02em' }} className="text-argo-navy">
                    <span style={{ fontWeight: 800 }}>Argo</span>
                    <span style={{ fontWeight: 100 }}> Method</span>
                </span>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                    {LANGS.map(l => (
                        <button
                            key={l}
                            onClick={() => setLang(l)}
                            aria-label={l.toUpperCase()}
                            className={`px-1.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wide transition-colors ${
                                lang === l
                                    ? 'text-argo-violet-500 bg-argo-violet-50'
                                    : 'text-argo-light hover:text-argo-grey'
                            }`}
                        >
                            {l}
                        </button>
                    ))}
                </div>
            </header>

            {/* Progress dots */}
            <div className="w-full max-w-md px-6 pt-3 flex items-center justify-center gap-1.5">
                {slides.map((s, i) => (
                    <button
                        key={s.id}
                        onClick={() => goTo(i)}
                        aria-label={`${ui.card} ${i + 1}`}
                        className="py-2"
                    >
                        <span
                            className={`block h-1.5 rounded-full transition-all duration-300 ${
                                i === index
                                    ? 'w-6 bg-argo-violet-500'
                                    : i < index
                                        ? 'w-1.5 bg-argo-violet-200'
                                        : 'w-1.5 bg-argo-border'
                            }`}
                        />
                    </button>
                ))}
            </div>

            {/* Card */}
            <main className="w-full max-w-md flex-1 px-6 flex items-center">
                <div className="w-full overflow-hidden">
                    <AnimatePresence custom={direction} mode="wait">
                        <motion.div
                            key={`${lang}-${slide.id}`}
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.28, ease: [0.25, 0, 0, 1] }}
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.18}
                            onDragEnd={(_, info) => {
                                if (info.offset.x < -SWIPE_THRESHOLD && !isLast) paginate(1);
                                else if (info.offset.x > SWIPE_THRESHOLD && !isFirst) paginate(-1);
                            }}
                            className="bg-white rounded-[20px] shadow-argo px-7 py-9 text-left cursor-grab active:cursor-grabbing select-none"
                        >
                            <div className="flex mb-6">
                                <div className="w-14 h-14 rounded-full bg-argo-violet-50 flex items-center justify-center">
                                    <Icon size={24} className="text-argo-violet-500" />
                                </div>
                            </div>

                            <p className="text-xs font-semibold uppercase tracking-widest text-argo-light mb-3">
                                {slide.eyebrow}
                            </p>

                            <h1 className="text-2xl font-light text-argo-navy tracking-tight leading-tight mb-4">
                                {slide.title}
                            </h1>

                            <p className="text-base text-argo-secondary leading-relaxed mb-4">
                                {renderRich(slide.body)}
                            </p>

                            <p className="text-sm text-argo-grey leading-relaxed">
                                {renderRich(slide.note)}
                            </p>

                            {slide.id === 'card-5' && (
                                <Link
                                    to="/privacy"
                                    className="inline-block mt-4 text-sm font-semibold text-argo-violet-500 hover:underline"
                                >
                                    {ui.privacy}
                                </Link>
                            )}

                            {isLast && (
                                <div className="mt-7 flex items-center justify-between gap-3">
                                    <a
                                        href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(ui.mailSubject)}`}
                                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-argo-violet-500 text-white text-sm font-semibold tracking-wide hover:bg-argo-violet-400 transition-colors whitespace-nowrap"
                                    >
                                        <Mail size={14} />
                                        {ui.writeUs}
                                    </a>
                                    <Link
                                        to="/"
                                        className="text-sm font-medium text-argo-grey hover:text-argo-navy transition-colors whitespace-nowrap"
                                    >
                                        {ui.moreInfo}
                                    </Link>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            {/* Navigation */}
            <footer className="w-full max-w-md px-6 pb-9 pt-4">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => paginate(-1)}
                        disabled={isFirst}
                        aria-label={ui.prev}
                        className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                            isFirst
                                ? 'opacity-0 pointer-events-none'
                                : 'bg-white shadow-argo text-argo-grey hover:text-argo-navy'
                        }`}
                    >
                        <ChevronLeft size={20} />
                    </button>

                    {isFirst ? (
                        <motion.span
                            initial={{ opacity: 0.5 }}
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            className="text-xs text-argo-light tracking-wide"
                        >
                            {ui.swipeHint}
                        </motion.span>
                    ) : (
                        <span className="text-xs text-argo-light tabular-nums">
                            {index + 1} / {total}
                        </span>
                    )}

                    <button
                        onClick={() => paginate(1)}
                        disabled={isLast}
                        aria-label={ui.next}
                        className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                            isLast
                                ? 'opacity-0 pointer-events-none'
                                : 'bg-argo-violet-500 text-white shadow-argo hover:bg-argo-violet-400'
                        }`}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default Familias;
