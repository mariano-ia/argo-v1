import React, { createContext, useContext, useEffect, useState } from 'react';

export type Lang = 'es' | 'en' | 'pt';

// ─── Translations ─────────────────────────────────────────────────────────────

export const translations = {
    es: {
        nav: {
            cta: 'Probar Argo',
            lang: 'EN',
        },
        hero: {
            eyebrow: 'Método Argo · Perfilamiento Deportivo',
            headline: 'Tu atleta tiene un código.',
            headlineAccent: 'Aprende a leerlo.',
            sub: 'Argo revela el perfil de comportamiento de cada deportista para que el adulto — entrenador o padre — sepa exactamente cómo comunicar, motivar y acompañar.',
            cta: 'Comenzar la Odisea',
            ctaSub: '10 minutos · Gratis · Sin registro previo',
        },
        problem: {
            eyebrow: 'El problema',
            headline: 'El 80 % de los entrenadores hablan un idioma. El 80 % de los atletas escuchan otro.',
            cards: [
                {
                    title: 'Burnout temprano',
                    body: 'Los deportistas jóvenes abandonan el deporte no por falta de talento, sino porque el entorno no sintoniza con su forma de procesar la presión.',
                },
                {
                    title: 'Comunicación rota',
                    body: 'Un atleta de tipo S necesita tiempo y seguridad. Un atleta de tipo D necesita autonomía y reto. Hablarles igual los apaga a los dos.',
                },
                {
                    title: 'Motivación mal dirigida',
                    body: 'Lo que motiva a un deportista puede desmotivar a otro. Sin un mapa de comportamiento, el adulto navega a ciegas.',
                },
            ],
        },
        insight: {
            quote: 'El que se adapta es el adulto, no el deportista.',
            body: 'La ciencia del comportamiento deportivo muestra que los perfiles de respuesta emocional se forman antes de los 12 años y son altamente estables. Argo los detecta en 10 minutos de juego y le devuelve al adulto un manual de sintonía preciso.',
        },
        howItWorks: {
            eyebrow: 'Cómo funciona',
            headline: 'Tres pasos. Un informe que cambia todo.',
            steps: [
                {
                    number: '01',
                    title: 'El adulto registra',
                    body: 'Completas los datos del deportista: nombre, edad, deporte. Tres minutos.',
                },
                {
                    number: '02',
                    title: 'El deportista juega',
                    body: 'Le entregas el dispositivo. La Odisea del Argo es una aventura interactiva de 10 minutos que mide 12 dimensiones de comportamiento sin que lo note.',
                },
                {
                    number: '03',
                    title: 'El adulto recibe el informe',
                    body: 'Llega a tu email un informe personalizado con el arquetipo del deportista, su motor de rendimiento y el lenguaje exacto para conectar mejor.',
                },
            ],
        },
        archetypes: {
            eyebrow: 'Los 12 arquetipos',
            headline: '12 perfiles. Cada deportista en uno.',
            sub: 'Combinando eje dominante y motor de ritmo, Argo mapea 12 arquetipos únicos de comportamiento deportivo.',
            profiles: [
                'Impulsor Dinámico', 'Impulsor Decidido', 'Impulsor Persistente',
                'Conector Dinámico', 'Conector Decidido', 'Conector Persistente',
                'Sostenedor Dinámico', 'Sostenedor Decidido', 'Sostenedor Persistente',
                'Estratega Dinámico', 'Estratega Decidido', 'Estratega Persistente',
            ],
        },
        audience: {
            eyebrow: 'Para quién',
            headline: 'Diseñado para los adultos que rodean al deportista.',
            cards: [
                {
                    title: 'Entrenadores',
                    body: 'Individualiza tu comunicación. Conoce qué tipo de feedback activa a cada atleta y cuál lo apaga.',
                    icon: '🏋️',
                },
                {
                    title: 'Padres y madres',
                    body: 'Deja de adivinar qué necesita tu hijo después de un partido. Argo te da el mapa.',
                    icon: '👨‍👩‍👧',
                },
                {
                    title: 'Instituciones deportivas',
                    body: 'Perfila a toda tu base de jugadores. Asignación de roles, detección de talentos y retención.',
                    icon: '🏟️',
                },
            ],
        },
        finalCta: {
            headline: 'Empieza hoy.',
            sub: 'El informe llega a tu email. Sin apps, sin instalaciones.',
            cta: 'Probar Argo ahora',
        },
        footer: {
            tagline: 'Perfilamiento deportivo basado en comportamiento.',
            rights: 'Todos los derechos reservados.',
        },
    },

    en: {
        nav: {
            cta: 'Try Argo',
            lang: 'PT',
        },
        hero: {
            eyebrow: 'Argo Method · Sports Behavioral Profiling',
            headline: 'Your athlete has a code.',
            headlineAccent: 'Learn to read it.',
            sub: 'Argo reveals the behavioral profile of each young athlete so the coach or parent knows exactly how to communicate, motivate, and support them.',
            cta: 'Start the Odyssey',
            ctaSub: '10 minutes · Free · No prior sign-up',
        },
        problem: {
            eyebrow: 'The problem',
            headline: '80% of coaches speak one language. 80% of athletes hear another.',
            cards: [
                {
                    title: 'Early burnout',
                    body: 'Kids quit sports not from lack of talent, but because the environment fails to sync with how they process pressure.',
                },
                {
                    title: 'Broken communication',
                    body: 'An S-type athlete needs time and security. A D-type athlete needs autonomy and challenge. Talking to them the same way shuts both of them down.',
                },
                {
                    title: 'Misdirected motivation',
                    body: 'What motivates one child can demotivate another. Without a behavioral map, adults navigate blind.',
                },
            ],
        },
        insight: {
            quote: 'The adult adapts — not the child.',
            body: 'Sports behavioral science shows emotional response profiles form before age 12 and are highly stable. Argo detects them in 10 minutes of play and gives the adult a precise communication manual.',
        },
        howItWorks: {
            eyebrow: 'How it works',
            headline: 'Three steps. One report that changes everything.',
            steps: [
                {
                    number: '01',
                    title: 'Adult registers',
                    body: "Fill in the athlete's name, age, and sport. Three minutes.",
                },
                {
                    number: '02',
                    title: 'Child plays',
                    body: 'Hand them the device. The Argo Odyssey is a 10-minute interactive adventure that measures 12 behavioral dimensions without the child knowing.',
                },
                {
                    number: '03',
                    title: 'Adult receives the report',
                    body: "A personalized report arrives in your inbox with the athlete's archetype, performance engine, and the exact language to connect with them.",
                },
            ],
        },
        archetypes: {
            eyebrow: 'The 12 archetypes',
            headline: '12 profiles. Every athlete fits one.',
            sub: 'By combining dominant axis and rhythm engine, Argo maps 12 unique sports behavioral archetypes.',
            profiles: [
                'Dynamic Driver', 'Decisive Driver', 'Persistent Driver',
                'Dynamic Connector', 'Decisive Connector', 'Persistent Connector',
                'Dynamic Sustainer', 'Decisive Sustainer', 'Persistent Sustainer',
                'Dynamic Strategist', 'Decisive Strategist', 'Persistent Strategist',
            ],
        },
        audience: {
            eyebrow: 'Who it\'s for',
            headline: 'Built for the adults around the athlete.',
            cards: [
                {
                    title: 'Coaches',
                    body: 'Individualize your communication. Know what feedback activates each athlete — and what shuts them down.',
                    icon: '🏋️',
                },
                {
                    title: 'Parents',
                    body: "Stop guessing what your child needs after a game. Argo gives you the map.",
                    icon: '👨‍👩‍👧',
                },
                {
                    title: 'Sports institutions',
                    body: 'Profile your entire player base. Role assignment, talent detection, and retention.',
                    icon: '🏟️',
                },
            ],
        },
        finalCta: {
            headline: 'Start today.',
            sub: 'The report goes to your email. No apps, no installs.',
            cta: 'Try Argo now',
        },
        footer: {
            tagline: 'Sports profiling based on behavior.',
            rights: 'All rights reserved.',
        },
    },

    pt: {
        nav: {
            cta: 'Experimentar Argo',
            lang: 'ES',
        },
        hero: {
            eyebrow: 'Método Argo · Perfilamento Esportivo Comportamental',
            headline: 'Seu atleta tem um código.',
            headlineAccent: 'Aprenda a lê-lo.',
            sub: 'Argo revela o perfil comportamental de cada jovem atleta para que o treinador ou pai saiba exatamente como comunicar, motivar e acompanhar.',
            cta: 'Iniciar a Odisseia',
            ctaSub: '10 minutos · Gratuito · Sem cadastro prévio',
        },
        problem: {
            eyebrow: 'O problema',
            headline: '80% dos treinadores falam uma língua. 80% dos atletas ouvem outra.',
            cards: [
                {
                    title: 'Burnout precoce',
                    body: 'Crianças abandonam o esporte não por falta de talento, mas porque o ambiente não sintoniza com a forma como processam a pressão.',
                },
                {
                    title: 'Comunicação quebrada',
                    body: 'Um atleta tipo S precisa de tempo e segurança. Um atleta tipo D precisa de autonomia e desafio. Falar com os dois da mesma forma desliga ambos.',
                },
                {
                    title: 'Motivação mal direcionada',
                    body: 'O que motiva uma criança pode desmotivar outra. Sem um mapa comportamental, o adulto navega às cegas.',
                },
            ],
        },
        insight: {
            quote: 'Quem se adapta é o adulto, não a criança.',
            body: 'A ciência do comportamento esportivo mostra que os perfis de resposta emocional se formam antes dos 12 anos e são altamente estáveis. Argo os detecta em 10 minutos de jogo e entrega ao adulto um manual de sintonia preciso.',
        },
        howItWorks: {
            eyebrow: 'Como funciona',
            headline: 'Três passos. Um relatório que muda tudo.',
            steps: [
                {
                    number: '01',
                    title: 'O adulto registra',
                    body: 'Preencha os dados do atleta: nome, idade, esporte. Três minutos.',
                },
                {
                    number: '02',
                    title: 'A criança joga',
                    body: 'Entregue o dispositivo. A Odisseia do Argo é uma aventura interativa de 10 minutos que mede 12 dimensões comportamentais sem que a criança perceba.',
                },
                {
                    number: '03',
                    title: 'O adulto recebe o relatório',
                    body: 'Um relatório personalizado chega ao seu email com o arquétipo do atleta, seu motor de rendimento e a linguagem exata para se conectar.',
                },
            ],
        },
        archetypes: {
            eyebrow: 'Os 12 arquétipos',
            headline: '12 perfis. Cada atleta em um.',
            sub: 'Combinando eixo dominante e motor de ritmo, Argo mapeia 12 arquétipos únicos de comportamento esportivo.',
            profiles: [
                'Impulsionador Dinâmico', 'Impulsionador Decidido', 'Impulsionador Persistente',
                'Conector Dinâmico', 'Conector Decidido', 'Conector Persistente',
                'Sustentador Dinâmico', 'Sustentador Decidido', 'Sustentador Persistente',
                'Estrategista Dinâmico', 'Estrategista Decidido', 'Estrategista Persistente',
            ],
        },
        audience: {
            eyebrow: 'Para quem',
            headline: 'Projetado para os adultos que cercam o atleta.',
            cards: [
                {
                    title: 'Treinadores',
                    body: 'Individualize sua comunicação. Saiba qual feedback ativa cada atleta e qual o desliga.',
                    icon: '🏋️',
                },
                {
                    title: 'Pais e mães',
                    body: 'Pare de adivinhar o que seu filho precisa depois de um jogo. Argo te dá o mapa.',
                    icon: '👨‍👩‍👧',
                },
                {
                    title: 'Instituições esportivas',
                    body: 'Perfile toda sua base de jogadores. Atribuição de funções, detecção de talentos e retenção.',
                    icon: '🏟️',
                },
            ],
        },
        finalCta: {
            headline: 'Comece hoje.',
            sub: 'O relatório chega ao seu email. Sem apps, sem instalações.',
            cta: 'Experimentar Argo agora',
        },
        footer: {
            tagline: 'Perfilamento esportivo baseado em comportamento.',
            rights: 'Todos os direitos reservados.',
        },
    },
} as const;

type Translations = typeof translations;
type LangTranslations = Translations['es'];

// ─── Context ──────────────────────────────────────────────────────────────────

interface LangContextValue {
    lang: Lang;
    setLang: (l: Lang) => void;
    t: LangTranslations;
}

const LangContext = createContext<LangContextValue | null>(null);

function getBrowserLang(): Lang {
    const nav = (navigator.language || navigator.languages?.[0] || '').toLowerCase();
    if (nav.startsWith('es')) return 'es';
    if (nav.startsWith('pt')) return 'pt';
    return 'en';
}

export const LangProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [lang, setLang] = useState<Lang>(getBrowserLang);
    const t = translations[lang] as LangTranslations;

    // Keep <html lang> in sync with current language
    useEffect(() => {
        document.documentElement.lang = lang;
    }, [lang]);

    return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
};

export function useLang(): LangContextValue {
    const ctx = useContext(LangContext);
    if (!ctx) throw new Error('useLang must be used inside LangProvider');
    return ctx;
}
