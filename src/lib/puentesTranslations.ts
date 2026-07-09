import type { Lang } from '../types/puentes';

export interface PuentesCopy {
    intro: {
        eyebrow: string;
        title: string;
        subtitle: (childName: string) => string;
        startCta: string;
        estimatedTime: string;
        disclaimer: string;
    };
    progress: {
        questionOf: (current: number, total: number) => string;
    };
    finish: {
        generating: string;
        ready: string;
        viewReport: string;
    };
    report: {
        eyebrow: string;
        greetingLabel: string;
        adultProfileLabel: string;
        puenteLabel: (n: number) => string;
        closingLabel: string;
        sectionChildState: string;
        sectionAdultStrength: string;
        sectionBridge: string;
        sectionReflection: string;
        downloadCta: string;
    };
    checkout: {
        eyebrow: string;
        title: string;
        description: string;
        emailLabel: string;
        nameLabel: string;
        consentLabel: string;
        termsLink: string;
        payCta: string;
        priceUsd: string;
        priceArs: string;
    };
    errors: {
        invalidToken: string;
        generic: string;
    };
}

export const PUENTES_COPY: Record<Lang, PuentesCopy> = {
    es: {
        intro: {
            eyebrow: 'ArgoPuente® · Tu vínculo',
            title: 'ArgoPuente®',
            subtitle: (n) => `Conoce tu propio estilo y descubre cómo se complementa con el de ${n}.`,
            startCta: 'Empezar el cuestionario',
            estimatedTime: '5 a 7 minutos',
            disclaimer: 'No es un servicio clínico ni terapéutico. Es una invitación a la reflexión.',
        },
        progress: { questionOf: (c, t) => `Pregunta ${c} de ${t}` },
        finish: {
            generating: 'Generando tu informe de vínculo',
            ready: 'Tu informe está listo',
            viewReport: 'Ver mi informe',
        },
        report: {
            eyebrow: 'ArgoPuente® · Tu vínculo',
            greetingLabel: 'Bienvenida',
            adultProfileLabel: 'Tu estilo natural',
            puenteLabel: (n) => `Puente ${n}`,
            closingLabel: 'Para llevar',
            sectionChildState: 'Cómo tiende a estar',
            sectionAdultStrength: 'Lo que tú traes',
            sectionBridge: 'El puente',
            sectionReflection: 'Una pregunta para llevarte',
            downloadCta: 'Descargar informe',
        },
        checkout: {
            eyebrow: 'ArgoPuente®',
            title: 'Tu Puente',
            description: 'Recibirás un enlace por email para responder el cuestionario (5 a 7 minutos) y descubrir 4 puentes para acompañar al niño en el deporte.',
            emailLabel: 'Tu email',
            nameLabel: 'Tu nombre',
            consentLabel: 'Acepto los términos y entiendo que este informe no es un servicio clínico ni terapéutico.',
            termsLink: 'Ver términos',
            payCta: 'Continuar al pago',
            priceUsd: 'USD 9.99',
            priceArs: 'ARS 6.999',
        },
        errors: {
            invalidToken: 'Este enlace no es válido o ya expiró.',
            generic: 'Algo no anduvo. Intenta nuevamente en unos minutos.',
        },
    },
    en: {
        intro: {
            eyebrow: 'ArgoPuente® · Your bond',
            title: 'ArgoPuente®',
            subtitle: (n) => `Discover your own style and how it complements ${n}'s.`,
            startCta: 'Start the questionnaire',
            estimatedTime: '5 to 7 minutes',
            disclaimer: 'This is not a clinical or therapeutic service. It is an invitation to reflect.',
        },
        progress: { questionOf: (c, t) => `Question ${c} of ${t}` },
        finish: {
            generating: 'Generating your bond report',
            ready: 'Your report is ready',
            viewReport: 'View my report',
        },
        report: {
            eyebrow: 'ArgoPuente® · Your bond',
            greetingLabel: 'Welcome',
            adultProfileLabel: 'Your natural style',
            puenteLabel: (n) => `Bridge ${n}`,
            closingLabel: 'To carry with you',
            sectionChildState: 'How they tend to feel',
            sectionAdultStrength: 'What you bring',
            sectionBridge: 'The bridge',
            sectionReflection: 'A question to take with you',
            downloadCta: 'Download report',
        },
        checkout: {
            eyebrow: 'ArgoPuente®',
            title: 'Your Bridge',
            description: 'You will receive an email link to take the short questionnaire (5 to 7 minutes) and discover 4 bridges to accompany the child in their sport.',
            emailLabel: 'Your email',
            nameLabel: 'Your name',
            consentLabel: 'I accept the terms and understand this is not a clinical or therapeutic service.',
            termsLink: 'View terms',
            payCta: 'Continue to payment',
            priceUsd: 'USD 9.99',
            priceArs: 'ARS 6,999',
        },
        errors: {
            invalidToken: 'This link is no longer valid.',
            generic: 'Something did not work. Please try again in a few minutes.',
        },
    },
    pt: {
        intro: {
            eyebrow: 'ArgoPuente® · Seu vínculo',
            title: 'ArgoPuente®',
            subtitle: (n) => `Conheça seu próprio estilo e descubra como se complementa com o de ${n}.`,
            startCta: 'Começar o questionário',
            estimatedTime: '5 a 7 minutos',
            disclaimer: 'Não é um serviço clínico nem terapêutico. É um convite à reflexão.',
        },
        progress: { questionOf: (c, t) => `Pergunta ${c} de ${t}` },
        finish: {
            generating: 'Gerando seu relatório de vínculo',
            ready: 'Seu relatório está pronto',
            viewReport: 'Ver meu relatório',
        },
        report: {
            eyebrow: 'ArgoPuente® · Seu vínculo',
            greetingLabel: 'Bem-vindo',
            adultProfileLabel: 'Seu estilo natural',
            puenteLabel: (n) => `Ponte ${n}`,
            closingLabel: 'Para levar',
            sectionChildState: 'Como tende a estar',
            sectionAdultStrength: 'O que você traz',
            sectionBridge: 'A ponte',
            sectionReflection: 'Uma pergunta para levar',
            downloadCta: 'Baixar relatório',
        },
        checkout: {
            eyebrow: 'ArgoPuente®',
            title: 'Sua Ponte',
            description: 'Você receberá um link por email para responder o questionário curto (5 a 7 minutos) e descobrir 4 pontes para acompanhar a criança no esporte.',
            emailLabel: 'Seu email',
            nameLabel: 'Seu nome',
            consentLabel: 'Aceito os termos e entendo que este não é um serviço clínico nem terapêutico.',
            termsLink: 'Ver termos',
            payCta: 'Continuar para o pagamento',
            priceUsd: 'USD 9.99',
            priceArs: 'ARS 6.999',
        },
        errors: {
            invalidToken: 'Este link não é mais válido.',
            generic: 'Algo não funcionou. Tente novamente em alguns minutos.',
        },
    },
};

export function getPuentesCopy(lang: Lang): PuentesCopy {
    return PUENTES_COPY[lang] ?? PUENTES_COPY.es;
}
