/**
 * Odyssey UI translations — all hardcoded strings from onboarding screen components.
 * Keyed by Lang ('es' | 'en' | 'pt').
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface OdysseyTranslations {
    // LanguageSelect
    selectLanguage: string;

    // AdultIntroSlide
    next: string;
    startRegistration: string;

    // AdultRegistration
    registration: string;
    registrationSub: string;
    yourName: string;
    yourNamePlaceholder: string;
    yourEmail: string;
    yourEmailPlaceholder: string;
    athleteName: string;
    athleteNamePlaceholder: string;
    athleteAge: (age: number) => string;
    sport: string;
    sportOther: string;
    sportOtherPlaceholder: string;
    sports: string[];
    philosophicalAgreement: string;
    checks: ((name: string) => string)[];

    // Consolidated consent check (COPPA-anchored, replaces the 4 philosophical checks)
    consentBullets: ((name: string) => string)[];
    consentCheck: (name: string) => string;

    // Parental consent waiting screen
    consentWaitingTitle: string;
    consentWaitingSubtitle: (maskedEmail: string) => string;
    consentWaitingWhy: (name: string) => string;
    consentWaitingExpiry: string;
    consentWaitingStatus: string;
    consentWaitingResend: string;
    consentWaitingChangeEmail: string;
    consentWaitingCoppaFooter: string; // shown only when lang === 'en'
    consentWaitingExpired: string;
    consentWaitingInvalid: string;
    consentWaitingRestart: string;

    // Consent landing page (/consent/:token)
    consentLandingLoading: string;
    consentLandingSuccess: (name: string) => string;
    consentLandingRedirecting: (name: string) => string;
    consentLandingExpired: string;
    consentLandingInvalid: string;

    continue: string;
    reportWillBeSentTo: (email: string) => string;
    fillDataBefore: (name: string) => string;

    // DeviceHandoff
    handoffLabel: string;
    handoffTitle: (adult: string, child: string) => string;
    handoffBody: string;
    handoffNote: string;
    handoffCta: (child: string) => string;

    // QuestionScreenV2 phase labels
    phases: Record<string, string>;

    // ChildCompletion
    missionComplete: string;
    completionBody: (child: string) => string;
    returnDevice: (adult: string) => string;
    hasDevice: (adult: string) => string;

    // StorySlideV2
    continueDefault: string;
    aboard: string;

    // AdultReport
    archetypeOf: (name: string) => string;
    preparingReport: string;
    reportSentTo: string;
    emailError: string;
    retryEmail: string;
    personalizingAI: string;
    generatedByArgo: string;
    maturationTitle: string;
    maturationBody: string;
    maturationRevisit: string;
    fullReport: string;
    saveErrorTitle: string;

    // FullReport misc
    reportHeader: string;
    motorTag: string;
    generatingAI: string;
    aiTag: string;
    designedBy: string;
    dominantAxis: string;
    discLabels: Record<string, string>;

    // Brújula (executive summary)
    compassLabel: string;
    axisNames: Record<string, string>;
    motorGaugeLabel: string;
    motorDisplayNames: Record<string, string>;
    confidenceLabel: string;
    confidenceLevels: string[];

    // Review CTA
    reviewTitle: string;
    reviewQuestion: string;
    reviewChips: [string, string, string];
    reviewSub: string;

    // FullReport section titles
    reportSections: {
        contract: string;
        disclaimer: string;
        placeInShip: string;
        secondaryCompass: string;
        motorRhythm: string;
        fuel: string;
        groupLife: string;
        intentionLanguage: string;
        captainLanguage: string;
        bridgeWords: string;
        noiseWords: string;
        byTendency: string;
        tuningGuide: string;
        activators: string;
        toAvoid: string;
        adjustmentManagement: string;
        shipEchoes: string;
        dayChecklist: string;
        beforeTraining: string;
        duringTraining: string;
        afterTraining: string;
    };

    // Email wrapper strings (sent to API)
    emailSubject: (child: string, archetype: string) => string;
    emailHeader: string;
    emailPreparedFor: (name: string) => string;
    emailArchetypeOf: (name: string) => string;
    emailFooter: string;
    emailMaturationTitle: string;
    emailMaturationBody: string;

    // Email HTML section titles (buildReportHtml)
    emailSections: {
        contract: string;
        disclaimer: string;
        placeInShip: string;
        secondaryCompass: string;
        motorRhythm: string;
        fuel: string;
        groupLife: string;
        intentionLanguage: string;
        captainLanguage: string;
        bridgeWords: string;
        noiseWords: string;
        byTendency: string;
        tuningGuide: string;
        activators: string;
        toAvoid: string;
        adjustmentManagement: string;
        shipEchoes: string;
        dayChecklist: string;
        beforeTraining: string;
        duringTraining: string;
        afterTraining: string;
        // Callout labels
        calloutNotaFundamental: string;
        calloutNotaSeguridad: string;
        calloutInvitacion: string;
        calloutFeedback: string;
        calloutTermometro: string;
        calloutAcompanamiento: string;
    };
}

// ─── Spanish ────────────────────────────────────────────────────────────────

const es: OdysseyTranslations = {
    selectLanguage: 'Selecciona tu idioma',

    next: 'Siguiente',
    startRegistration: 'Comenzar el registro',

    registration: 'Registro',
    registrationSub: 'Tus datos y los del deportista',
    yourName: 'Tu nombre',
    yourNamePlaceholder: 'Ej: Kate',
    yourEmail: 'Tu email',
    yourEmailPlaceholder: 'ejemplo@mail.com',
    athleteName: 'Nombre del deportista',
    athleteNamePlaceholder: 'Ej: Kevin',
    athleteAge: (age) => `Edad del deportista — ${age} años`,
    sport: 'Deporte',
    sportOther: 'Otro',
    sportOtherPlaceholder: 'Escribe el deporte...',
    sports: ['Fútbol', 'Hockey', 'Básquet', 'Rugby', 'Tenis', 'Natación', 'Voley', 'Atletismo', 'Handball', 'Béisbol', 'Otro'],
    philosophicalAgreement: 'Acuerdo filosófico',
    checks: [
        (name) => `Entiendo que Argo Method es una "fotografía del presente" y no una etiqueta permanente para ${name || 'mi deportista'}.`,
        (name) => `Acepto que el objetivo de este informe es priorizar el disfrute y el bienestar de ${name || 'mi deportista'} por sobre el rendimiento competitivo.`,
        () => 'Comprendo que esta herramienta no es un diagnóstico clínico ni médico.',
        () => 'Confirmo que soy mayor de 18 años.',
    ],
    consentBullets: [
        (name) => `Argo Method es una "fotografía del presente", no una etiqueta permanente para ${name || 'tu deportista'}.`,
        (name) => `El objetivo es priorizar el disfrute y el bienestar de ${name || 'tu deportista'} sobre el rendimiento competitivo.`,
        () => 'No es un diagnóstico clínico ni médico.',
    ],
    consentCheck: (name) => `Soy el padre, madre o tutor legal de ${name || 'este deportista'} y acepto la Política de Privacidad y los Términos.`,
    consentWaitingTitle: 'Revisa tu email',
    consentWaitingSubtitle: (masked) => `Te enviamos un enlace a ${masked}`,
    consentWaitingWhy: (name) => `Para proteger la privacidad de ${name || 'tu deportista'}, necesitamos que confirmes que eres el adulto responsable.`,
    consentWaitingExpiry: 'Este enlace expira en 24 horas.',
    consentWaitingStatus: 'Esperando confirmación...',
    consentWaitingResend: 'Reenviar email',
    consentWaitingChangeEmail: 'Cambiar email',
    consentWaitingCoppaFooter: '',
    consentWaitingExpired: 'Este enlace expiró. Por seguridad, debes empezar de nuevo.',
    consentWaitingInvalid: 'Este enlace no es válido.',
    consentWaitingRestart: 'Empezar de nuevo',
    consentLandingLoading: 'Confirmando...',
    consentLandingSuccess: (name) => `¡Listo! Ya puedes volver a la pantalla donde ${name} está esperando para comenzar.`,
    consentLandingRedirecting: (name) => `¡Listo! Llevando a ${name} al juego...`,
    consentLandingExpired: 'Este enlace expiró. Por seguridad, el adulto responsable debe empezar de nuevo.',
    consentLandingInvalid: 'Este enlace no es válido.',
    continue: 'Continuar',
    reportWillBeSentTo: (email) => `El informe llegará a ${email}.`,
    fillDataBefore: (name) => `Completa estos datos antes de pasarle el dispositivo a ${name || 'tu deportista'}.`,

    handoffLabel: 'El Traspaso',
    handoffTitle: (adult, child) => `${adult}, es el turno de ${child}`,
    handoffBody: 'El juego consta de 12 decisiones rápidas. Es importante que las responda por su cuenta, sin ayuda, en un ambiente tranquilo.',
    handoffNote: 'No hay respuestas correctas ni incorrectas.',
    handoffCta: (child) => `Entregar dispositivo a ${child}`,

    phases: {
        port: 'El Puerto',
        'open-sea': 'Mar Abierto',
        storm: 'La Tormenta',
        calm: 'La Calma',
        island: 'La Isla',
    },

    missionComplete: 'Misión cumplida',
    completionBody: (child) => `El Argo ya sabe cómo te gusta más participar en la aventura hoy, ${child}.`,
    returnDevice: (adult) => `Por favor, devuelve el dispositivo a ${adult}.`,
    hasDevice: (adult) => `${adult} ya tiene el dispositivo`,

    continueDefault: 'Continuar',
    aboard: '¡A bordo!',

    archetypeOf: (name) => `Arquetipo de ${name}`,
    preparingReport: 'Preparando el informe…',
    reportSentTo: 'Informe enviado a',
    emailError: 'No pudimos enviar el email',
    retryEmail: 'Reintentar envío',
    personalizingAI: 'Personalizando con IA…',
    generatedByArgo: 'Generado por ArgoEngine',
    maturationTitle: 'Nota: Maduración Temprana',
    maturationBody: 'Los perfiles en la infancia temprana (menores de 7 años) son altamente plásticos.',
    maturationRevisit: 'Se recomienda revisitar este perfil en 6 meses para observar la evolución.',
    fullReport: 'Informe completo',
    saveErrorTitle: 'No se pudo guardar la sesión',

    reportHeader: 'Informe de Sintonía Deportiva',
    motorTag: 'Motor',
    generatingAI: 'Generando...',
    aiTag: 'IA',
    designedBy: 'Diseñado bajo los principios de seguridad emocional de Argo Method',
    dominantAxis: 'Eje dominante',
    discLabels: { D: 'Dominio', I: 'Influencia', S: 'Estabilidad', C: 'Conciencia' },

    compassLabel: 'Brújula de sintonía',
    axisNames: { D: 'Impulsor', I: 'Conector', S: 'Sostenedor', C: 'Estratega' },
    motorGaugeLabel: 'Ritmo de procesamiento',
    motorDisplayNames: { 'Rápido': 'Dinámico', 'Medio': 'Rítmico', 'Lento': 'Sereno' },
    confidenceLabel: 'Definición del perfil',
    confidenceLevels: ['Emergente', 'En formación', 'Moderado', 'Definido', 'Muy definido'],

    reviewTitle: 'Tu opinión nos ayuda a mejorar',
    reviewQuestion: '¿Qué tan claro te resultó el informe?',
    reviewChips: ['Muy claro', 'Algo claro', 'Confuso'],
    reviewSub: 'Solo 4 preguntas · 30 segundos',

    reportSections: {
        contract: 'Retrato de Sintonía',
        disclaimer: 'Este informe no evalúa talento ni predice el futuro deportivo. Describe tendencias presentes que pueden evolucionar. Es una fotografía del momento, no una etiqueta permanente.',
        placeInShip: 'Su lugar en la Nave',
        secondaryCompass: 'La Brújula Secundaria',
        motorRhythm: 'El Ritmo del Motor',
        fuel: 'El Combustible',
        groupLife: 'Vida en el Grupo',
        intentionLanguage: 'Lenguaje de Intención',
        captainLanguage: 'Cómo hablarle',
        bridgeWords: 'Palabras Puente',
        noiseWords: 'Palabras Ruido',
        byTendency: 'Por su tendencia',
        tuningGuide: 'Guía de Sintonía',
        activators: 'Activadores',
        toAvoid: 'A evitar',
        adjustmentManagement: 'Gestión del Desajuste',
        shipEchoes: 'Ecos de la Nave',
        dayChecklist: 'Checklist del Día',
        beforeTraining: 'Antes del entrenamiento',
        duringTraining: 'Durante el entrenamiento',
        afterTraining: 'Después del entrenamiento',
    },

    emailSubject: (child, archetype) => `Informe de Sintonía Argo · ${child} · ${archetype}`,
    emailHeader: 'Informe de Sintonía',
    emailPreparedFor: (name) => `Preparado para ${name}`,
    emailArchetypeOf: (name) => `Arquetipo de ${name}`,
    emailFooter: 'Argo Method · Este informe es una fotografía del presente, no una etiqueta permanente.',
    emailMaturationTitle: 'Nota: Maduración Temprana',
    emailMaturationBody: 'Los perfiles DISC en la infancia temprana (menores de 7 años) son altamente plásticos. Se recomienda revisitar este perfil en 6 meses para observar la evolución de las tendencias.',

    emailSections: {
        contract: 'Retrato de Sintonía',
        disclaimer: 'Este informe no evalúa talento ni predice el futuro deportivo. Describe tendencias presentes que pueden evolucionar. Es una fotografía del momento, no una etiqueta permanente.',
        placeInShip: 'Su lugar en la Nave',
        secondaryCompass: 'La Brújula Secundaria',
        motorRhythm: 'El Ritmo del Motor',
        fuel: 'El Combustible',
        groupLife: 'Vida en el Grupo',
        intentionLanguage: 'Lenguaje de Intención',
        captainLanguage: 'Cómo hablarle',
        bridgeWords: 'Palabras Puente',
        noiseWords: 'Palabras Ruido',
        byTendency: 'Por su tendencia',
        tuningGuide: 'Guía de Sintonía',
        activators: 'Activadores',
        toAvoid: 'A evitar',
        adjustmentManagement: 'Gestión del Desajuste',
        shipEchoes: 'Ecos de la Nave',
        dayChecklist: 'Checklist del Día',
        beforeTraining: 'Antes del entrenamiento',
        duringTraining: 'Durante el entrenamiento',
        afterTraining: 'Después del entrenamiento',
        calloutNotaFundamental: 'Nota fundamental',
        calloutNotaSeguridad: 'Nota de seguridad',
        calloutInvitacion: 'Invitación de sintonía',
        calloutFeedback: 'Feedback de sintonía',
        calloutTermometro: 'Termómetro emocional',
        calloutAcompanamiento: 'Acompañamiento sugerido',
    },
};

// ─── English ────────────────────────────────────────────────────────────────

const en: OdysseyTranslations = {
    selectLanguage: 'Select your language',

    next: 'Next',
    startRegistration: 'Start registration',

    registration: 'Registration',
    registrationSub: 'Your details and the athlete\'s',
    yourName: 'Your name',
    yourNamePlaceholder: 'E.g.: Kate',
    yourEmail: 'Your email',
    yourEmailPlaceholder: 'example@mail.com',
    athleteName: 'Athlete\'s name',
    athleteNamePlaceholder: 'E.g.: Kevin',
    athleteAge: (age) => `Athlete's age — ${age} years`,
    sport: 'Sport',
    sportOther: 'Other',
    sportOtherPlaceholder: 'Type the sport...',
    sports: ['Soccer', 'Hockey', 'Basketball', 'Rugby', 'Tennis', 'Swimming', 'Volleyball', 'Track & Field', 'Handball', 'Baseball', 'Other'],
    philosophicalAgreement: 'Philosophical agreement',
    checks: [
        (name) => `I understand that Argo Method is a "snapshot of the present" and not a permanent label for ${name || 'my child'}.`,
        (name) => `I accept that this report's goal is to prioritize ${name || 'my child'}'s enjoyment and well-being over competitive performance.`,
        () => 'I understand that this tool is not a clinical or medical diagnosis.',
        () => 'I confirm that I am over 18 years old.',
    ],
    consentBullets: [
        (name) => `Argo Method is a "snapshot of the present," not a permanent label for ${name || 'your athlete'}.`,
        (name) => `The goal is to prioritize ${name || 'your athlete'}'s enjoyment and well-being over competitive performance.`,
        () => 'This is not a clinical or medical diagnosis.',
    ],
    consentCheck: (name) => `I am the parent or legal guardian of ${name || 'this athlete'} and I accept the Privacy Policy and Terms of Service.`,
    consentWaitingTitle: 'Check your email',
    consentWaitingSubtitle: (masked) => `We sent a link to ${masked}`,
    consentWaitingWhy: (name) => `To comply with COPPA (U.S. children's privacy law), we need you to confirm you are the responsible adult for ${name || 'your athlete'}.`,
    consentWaitingExpiry: 'This link expires in 24 hours.',
    consentWaitingStatus: 'Waiting for confirmation...',
    consentWaitingResend: 'Resend email',
    consentWaitingChangeEmail: 'Change email',
    consentWaitingCoppaFooter: 'Argo Method complies with the Children\'s Online Privacy Protection Act (COPPA).',
    consentWaitingExpired: 'This link has expired. For security, you must start over.',
    consentWaitingInvalid: 'This link is not valid.',
    consentWaitingRestart: 'Start over',
    consentLandingLoading: 'Confirming...',
    consentLandingSuccess: (name) => `Done! You can now return to the screen where ${name} is waiting to begin.`,
    consentLandingRedirecting: (name) => `Done! Taking ${name} to the game...`,
    consentLandingExpired: 'This link has expired. For security, the responsible adult must start over.',
    consentLandingInvalid: 'This link is not valid.',
    continue: 'Continue',
    reportWillBeSentTo: (email) => `The report will be sent to ${email}.`,
    fillDataBefore: (name) => `Fill in this information before handing the device to ${name || 'the athlete'}.`,

    handoffLabel: 'The Handoff',
    handoffTitle: (adult, child) => `${adult}, it's ${child}'s turn`,
    handoffBody: 'The game consists of 12 quick decisions. It\'s important that they answer on their own, without help, in a calm environment.',
    handoffNote: 'There are no right or wrong answers.',
    handoffCta: (child) => `Hand device to ${child}`,

    phases: {
        port: 'The Harbor',
        'open-sea': 'Open Sea',
        storm: 'The Storm',
        calm: 'The Calm',
        island: 'The Island',
    },

    missionComplete: 'Mission complete',
    completionBody: (child) => `The Argo now knows how you like to be part of the adventure today, ${child}.`,
    returnDevice: (adult) => `Please return the device to ${adult}.`,
    hasDevice: (adult) => `${adult} already has the device`,

    continueDefault: 'Continue',
    aboard: 'All aboard!',

    archetypeOf: (name) => `${name}'s Archetype`,
    preparingReport: 'Preparing the report…',
    reportSentTo: 'Report sent to',
    emailError: 'We couldn\'t send the email',
    retryEmail: 'Retry sending',
    personalizingAI: 'Personalizing with AI…',
    generatedByArgo: 'Generated by ArgoEngine',
    maturationTitle: 'Note: Early Maturation',
    maturationBody: 'Profiles in early childhood (under 7 years) are highly plastic.',
    maturationRevisit: 'We recommend revisiting this profile in 6 months to observe its evolution.',
    fullReport: 'Full report',
    saveErrorTitle: 'Session could not be saved',

    reportHeader: 'Sports Tuning Report',
    motorTag: 'Motor',
    generatingAI: 'Generating...',
    aiTag: 'AI',
    designedBy: 'Designed under the emotional safety principles of Argo Method',
    dominantAxis: 'Dominant axis',
    discLabels: { D: 'Dominance', I: 'Influence', S: 'Steadiness', C: 'Conscientiousness' },

    compassLabel: 'Tuning compass',
    axisNames: { D: 'Driver', I: 'Connector', S: 'Sustainer', C: 'Strategist' },
    motorGaugeLabel: 'Processing pace',
    motorDisplayNames: { 'Rápido': 'Dynamic', 'Medio': 'Rhythmic', 'Lento': 'Serene' },
    confidenceLabel: 'Profile definition',
    confidenceLevels: ['Emerging', 'Forming', 'Moderate', 'Defined', 'Highly defined'],

    reviewTitle: 'Your feedback helps us improve',
    reviewQuestion: 'How clear was the report?',
    reviewChips: ['Very clear', 'Somewhat clear', 'Confusing'],
    reviewSub: 'Just 4 questions · 30 seconds',

    reportSections: {
        contract: 'Tuning Portrait',
        disclaimer: 'This report does not evaluate talent or predict athletic future. It describes present tendencies that may evolve. It is a snapshot, not a permanent label.',
        placeInShip: 'Their Place on the Ship',
        secondaryCompass: 'The Secondary Compass',
        motorRhythm: 'The Motor Rhythm',
        fuel: 'The Fuel',
        groupLife: 'Life in the Group',
        intentionLanguage: 'Language of Intention',
        captainLanguage: 'How to talk to them',
        bridgeWords: 'Bridge Words',
        noiseWords: 'Noise Words',
        byTendency: 'By their tendency',
        tuningGuide: 'Tuning Guide',
        activators: 'Activators',
        toAvoid: 'To avoid',
        adjustmentManagement: 'Adjustment Management',
        shipEchoes: 'Ship Echoes',
        dayChecklist: 'Day Checklist',
        beforeTraining: 'Before training',
        duringTraining: 'During training',
        afterTraining: 'After training',
    },

    emailSubject: (child, archetype) => `Argo Tuning Report · ${child} · ${archetype}`,
    emailHeader: 'Tuning Report',
    emailPreparedFor: (name) => `Prepared for ${name}`,
    emailArchetypeOf: (name) => `${name}'s Archetype`,
    emailFooter: 'Argo Method · This report is a snapshot of the present, not a permanent label.',
    emailMaturationTitle: 'Note: Early Maturation',
    emailMaturationBody: 'DISC profiles in early childhood (under 7 years) are highly plastic. We recommend revisiting this profile in 6 months to observe the evolution of tendencies.',

    emailSections: {
        contract: 'Tuning Portrait',
        disclaimer: 'This report does not evaluate talent or predict athletic future. It describes present tendencies that may evolve. It is a snapshot, not a permanent label.',
        placeInShip: 'Their Place on the Ship',
        secondaryCompass: 'The Secondary Compass',
        motorRhythm: 'The Motor Rhythm',
        fuel: 'The Fuel',
        groupLife: 'Life in the Group',
        intentionLanguage: 'Language of Intention',
        captainLanguage: 'How to talk to them',
        bridgeWords: 'Bridge Words',
        noiseWords: 'Noise Words',
        byTendency: 'By their tendency',
        tuningGuide: 'Tuning Guide',
        activators: 'Activators',
        toAvoid: 'To avoid',
        adjustmentManagement: 'Adjustment Management',
        shipEchoes: 'Ship Echoes',
        dayChecklist: 'Day Checklist',
        beforeTraining: 'Before training',
        duringTraining: 'During training',
        afterTraining: 'After training',
        calloutNotaFundamental: 'Key note',
        calloutNotaSeguridad: 'Safety note',
        calloutInvitacion: 'Tuning invitation',
        calloutFeedback: 'Tuning feedback',
        calloutTermometro: 'Emotional thermometer',
        calloutAcompanamiento: 'Suggested support',
    },
};

// ─── Portuguese ─────────────────────────────────────────────────────────────

const pt: OdysseyTranslations = {
    selectLanguage: 'Selecione seu idioma',

    next: 'Próximo',
    startRegistration: 'Iniciar registro',

    registration: 'Registro',
    registrationSub: 'Seus dados e os do atleta',
    yourName: 'Seu nome',
    yourNamePlaceholder: 'Ex: Kate',
    yourEmail: 'Seu email',
    yourEmailPlaceholder: 'exemplo@mail.com',
    athleteName: 'Nome do atleta',
    athleteNamePlaceholder: 'Ex: Kevin',
    athleteAge: (age) => `Idade do atleta — ${age} anos`,
    sport: 'Esporte',
    sportOther: 'Outro',
    sportOtherPlaceholder: 'Digite o esporte...',
    sports: ['Futebol', 'Hóquei', 'Basquete', 'Rugby', 'Tênis', 'Natação', 'Vôlei', 'Atletismo', 'Handebol', 'Beisebol', 'Outro'],
    philosophicalAgreement: 'Acordo filosófico',
    checks: [
        (name) => `Entendo que o Argo Method é uma "fotografia do presente" e não um rótulo permanente para ${name || 'meu filho/a'}.`,
        (name) => `Aceito que o objetivo deste relatório é priorizar o prazer e o bem-estar de ${name || 'meu filho/a'} acima do desempenho competitivo.`,
        () => 'Compreendo que esta ferramenta não é um diagnóstico clínico ou médico.',
        () => 'Confirmo que tenho mais de 18 anos.',
    ],
    consentBullets: [
        (name) => `Argo Method é uma "fotografia do presente", não um rótulo permanente para ${name || 'seu atleta'}.`,
        (name) => `O objetivo é priorizar o prazer e bem-estar de ${name || 'seu atleta'} sobre o rendimento competitivo.`,
        () => 'Não é um diagnóstico clínico nem médico.',
    ],
    consentCheck: (name) => `Sou o pai, mãe ou responsável legal por ${name || 'este atleta'} e aceito a Política de Privacidade e os Termos.`,
    consentWaitingTitle: 'Verifique seu email',
    consentWaitingSubtitle: (masked) => `Enviamos um link para ${masked}`,
    consentWaitingWhy: (name) => `Para proteger a privacidade de ${name || 'seu atleta'}, precisamos que você confirme que é o responsável.`,
    consentWaitingExpiry: 'Este link expira em 24 horas.',
    consentWaitingStatus: 'Aguardando confirmação...',
    consentWaitingResend: 'Reenviar email',
    consentWaitingChangeEmail: 'Alterar email',
    consentWaitingCoppaFooter: '',
    consentWaitingExpired: 'Este link expirou. Por segurança, você precisa começar de novo.',
    consentWaitingInvalid: 'Este link não é válido.',
    consentWaitingRestart: 'Começar de novo',
    consentLandingLoading: 'Confirmando...',
    consentLandingSuccess: (name) => `Pronto! Você já pode voltar à tela onde ${name} está esperando para começar.`,
    consentLandingRedirecting: (name) => `Pronto! Levando ${name} ao jogo...`,
    consentLandingExpired: 'Este link expirou. Por segurança, o responsável deve começar de novo.',
    consentLandingInvalid: 'Este link não é válido.',
    continue: 'Continuar',
    reportWillBeSentTo: (email) => `O relatório será enviado para ${email}.`,
    fillDataBefore: (name) => `Preencha estes dados antes de entregar o dispositivo para ${name || 'o/a atleta'}.`,

    handoffLabel: 'A Passagem',
    handoffTitle: (adult, child) => `${adult}, é a vez de ${child}`,
    handoffBody: 'O jogo consiste em 12 decisões rápidas. É importante que responda sozinho/a, sem ajuda, em um ambiente tranquilo.',
    handoffNote: 'Não existem respostas certas ou erradas.',
    handoffCta: (child) => `Entregar dispositivo para ${child}`,

    phases: {
        port: 'O Porto',
        'open-sea': 'Mar Aberto',
        storm: 'A Tempestade',
        calm: 'A Calmaria',
        island: 'A Ilha',
    },

    missionComplete: 'Missão cumprida',
    completionBody: (child) => `O Argo já sabe como você gosta mais de participar da aventura hoje, ${child}.`,
    returnDevice: (adult) => `Por favor, devolva o dispositivo para ${adult}.`,
    hasDevice: (adult) => `${adult} já tem o dispositivo`,

    continueDefault: 'Continuar',
    aboard: 'A bordo!',

    archetypeOf: (name) => `Arquétipo de ${name}`,
    preparingReport: 'Preparando o relatório…',
    reportSentTo: 'Relatório enviado para',
    emailError: 'Não conseguimos enviar o email',
    retryEmail: 'Tentar novamente',
    personalizingAI: 'Personalizando com IA…',
    generatedByArgo: 'Gerado pelo ArgoEngine',
    maturationTitle: 'Nota: Maturação Precoce',
    maturationBody: 'Os perfis na primeira infância (menores de 7 anos) são altamente plásticos.',
    maturationRevisit: 'Recomenda-se revisitar este perfil em 6 meses para observar a evolução.',
    fullReport: 'Relatório completo',
    saveErrorTitle: 'Não foi possível salvar a sessão',

    reportHeader: 'Relatório de Sintonia Esportiva',
    motorTag: 'Motor',
    generatingAI: 'Gerando...',
    aiTag: 'IA',
    designedBy: 'Projetado sob os princípios de segurança emocional do Argo Method',
    dominantAxis: 'Eixo dominante',
    discLabels: { D: 'Domínio', I: 'Influência', S: 'Estabilidade', C: 'Consciência' },

    compassLabel: 'Bússola de sintonia',
    axisNames: { D: 'Impulsionador', I: 'Conector', S: 'Sustentador', C: 'Estrategista' },
    motorGaugeLabel: 'Ritmo de processamento',
    motorDisplayNames: { 'Rápido': 'Dinâmico', 'Medio': 'Rítmico', 'Lento': 'Sereno' },
    confidenceLabel: 'Definição do perfil',
    confidenceLevels: ['Emergente', 'Em formação', 'Moderado', 'Definido', 'Muito definido'],

    reviewTitle: 'Sua opinião nos ajuda a melhorar',
    reviewQuestion: 'O relatório ficou claro para você?',
    reviewChips: ['Muito claro', 'Razoavelmente claro', 'Confuso'],
    reviewSub: 'Apenas 4 perguntas · 30 segundos',

    reportSections: {
        contract: 'Retrato de Sintonia',
        disclaimer: 'Este relatório não avalia talento nem prevê o futuro esportivo. Descreve tendências presentes que podem evoluir. É uma fotografia do momento, não um rótulo permanente.',
        placeInShip: 'Seu Lugar no Navio',
        secondaryCompass: 'A Bússola Secundária',
        motorRhythm: 'O Ritmo do Motor',
        fuel: 'O Combustível',
        groupLife: 'Vida no Grupo',
        intentionLanguage: 'Linguagem de Intenção',
        captainLanguage: 'Como falar com ele/ela',
        bridgeWords: 'Palavras Ponte',
        noiseWords: 'Palavras Ruído',
        byTendency: 'Por sua tendência',
        tuningGuide: 'Guia de Sintonia',
        activators: 'Ativadores',
        toAvoid: 'A evitar',
        adjustmentManagement: 'Gestão do Desajuste',
        shipEchoes: 'Ecos do Navio',
        dayChecklist: 'Checklist do Dia',
        beforeTraining: 'Antes do treino',
        duringTraining: 'Durante o treino',
        afterTraining: 'Depois do treino',
    },

    emailSubject: (child, archetype) => `Relatório de Sintonia Argo · ${child} · ${archetype}`,
    emailHeader: 'Relatório de Sintonia',
    emailPreparedFor: (name) => `Preparado para ${name}`,
    emailArchetypeOf: (name) => `Arquétipo de ${name}`,
    emailFooter: 'Argo Method · Este relatório é uma fotografia do presente, não um rótulo permanente.',
    emailMaturationTitle: 'Nota: Maturação Precoce',
    emailMaturationBody: 'Os perfis DISC na primeira infância (menores de 7 anos) são altamente plásticos. Recomenda-se revisitar este perfil em 6 meses para observar a evolução das tendências.',

    emailSections: {
        contract: 'Retrato de Sintonia',
        disclaimer: 'Este relatório não avalia talento nem prevê o futuro esportivo. Descreve tendências presentes que podem evoluir. É uma fotografia do momento, não um rótulo permanente.',
        placeInShip: 'Seu Lugar no Navio',
        secondaryCompass: 'A Bússola Secundária',
        motorRhythm: 'O Ritmo do Motor',
        fuel: 'O Combustível',
        groupLife: 'Vida no Grupo',
        intentionLanguage: 'Linguagem de Intenção',
        captainLanguage: 'Como falar com ele/ela',
        bridgeWords: 'Palavras Ponte',
        noiseWords: 'Palavras Ruído',
        byTendency: 'Por sua tendência',
        tuningGuide: 'Guia de Sintonia',
        activators: 'Ativadores',
        toAvoid: 'A evitar',
        adjustmentManagement: 'Gestão do Desajuste',
        shipEchoes: 'Ecos do Navio',
        dayChecklist: 'Checklist do Dia',
        beforeTraining: 'Antes do treino',
        duringTraining: 'Durante o treino',
        afterTraining: 'Depois do treino',
        calloutNotaFundamental: 'Nota fundamental',
        calloutNotaSeguridad: 'Nota de segurança',
        calloutInvitacion: 'Convite de sintonia',
        calloutFeedback: 'Feedback de sintonia',
        calloutTermometro: 'Termômetro emocional',
        calloutAcompanamiento: 'Acompanhamento sugerido',
    },
};

// ─── Export ─────────────────────────────────────────────────────────────────

export const odysseyTranslations: Record<string, OdysseyTranslations> = { es, en, pt };

/** Convenience getter — use inside components with useLang().lang */
export function getOdysseyT(lang: string): OdysseyTranslations {
    return odysseyTranslations[lang] ?? es;
}
