type Lang = 'es' | 'en' | 'pt';

interface FeedbackTranslations {
    pageTitle: string;
    pageSubtitle: string;
    q1: string;
    q2: string;
    q3: string;
    q4: string;
    optional: string;
    placeholder: string;
    submit: string;
    submitting: string;
    thankTitle: string;
    thankBody: string;
    clarityOptions: [string, string, string];
    helpfulnessOptions: [string, string, string];
    identificationOptions: [string, string, string];
}

const feedbackTranslations: Record<Lang, FeedbackTranslations> = {
    es: {
        pageTitle: 'Tu opinión nos ayuda a mejorar',
        pageSubtitle: 'Son solo 4 preguntas \u00b7 30 segundos',
        q1: '1. ¿Qué tan claro te resultó el informe?',
        q2: '2. ¿Sientes que te ayuda a comprender mejor al deportista?',
        q3: '3. ¿Qué tan identificado te sentiste con el resultado?',
        q4: '4. ¿Qué cambiarías o mejorarías?',
        optional: '(opcional)',
        placeholder: 'Tu sugerencia...',
        submit: 'Enviar opinión',
        submitting: 'Enviando...',
        thankTitle: 'Gracias por tu opinión',
        thankBody: 'Tu feedback nos ayuda a mejorar la experiencia para cada deportista.',
        clarityOptions: ['Muy claro', 'Algo claro', 'Confuso'],
        helpfulnessOptions: ['Mucho', 'Algo', 'Poco'],
        identificationOptions: ['Identificado', 'Más o menos', 'Nada'],
    },
    en: {
        pageTitle: 'Your feedback helps us improve',
        pageSubtitle: 'Just 4 questions \u00b7 30 seconds',
        q1: '1. How clear was the report?',
        q2: '2. Do you feel it helps you better understand the athlete?',
        q3: '3. How well did the result match your perception?',
        q4: '4. What would you change or improve?',
        optional: '(optional)',
        placeholder: 'Your suggestion...',
        submit: 'Submit feedback',
        submitting: 'Submitting...',
        thankTitle: 'Thank you for your feedback',
        thankBody: 'Your feedback helps us improve the experience for every athlete.',
        clarityOptions: ['Very clear', 'Somewhat clear', 'Confusing'],
        helpfulnessOptions: ['A lot', 'Somewhat', 'Not much'],
        identificationOptions: ['Spot on', 'Somewhat', 'Not at all'],
    },
    pt: {
        pageTitle: 'Sua opinião nos ajuda a melhorar',
        pageSubtitle: 'São apenas 4 perguntas \u00b7 30 segundos',
        q1: '1. Quão claro foi o relatório?',
        q2: '2. Você sente que ajuda a compreender melhor o atleta?',
        q3: '3. Quão identificado você se sentiu com o resultado?',
        q4: '4. O que você mudaria ou melhoraria?',
        optional: '(opcional)',
        placeholder: 'Sua sugestão...',
        submit: 'Enviar opinião',
        submitting: 'Enviando...',
        thankTitle: 'Obrigado pela sua opinião',
        thankBody: 'Seu feedback nos ajuda a melhorar a experiência para cada atleta.',
        clarityOptions: ['Muito claro', 'Um pouco claro', 'Confuso'],
        helpfulnessOptions: ['Muito', 'Um pouco', 'Pouco'],
        identificationOptions: ['Identificado', 'Mais ou menos', 'Nada'],
    },
};

export function getFeedbackT(lang: string): FeedbackTranslations {
    return feedbackTranslations[lang as Lang] ?? feedbackTranslations.es;
}
