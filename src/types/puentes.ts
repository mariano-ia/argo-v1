export type Lang = 'es' | 'en' | 'pt';

export type AdultAxis = 'D' | 'I' | 'S' | 'C';
export type AdultMotor = 'agil' | 'equilibrado' | 'profundo';
export type AdultPressureStyle = 'regulado' | 'reactivo' | 'evitativo';
export type AdultHistory = 'ex_competitive' | 'ex_brief' | 'recreational' | 'none';
export type AdultDominantEmotion =
    | 'orgullo'
    | 'nervios'
    | 'disfrute'
    | 'preocupacion'
    | 'curiosidad'
    | 'mezcla';

export interface AdultProfile {
    eje_primary: AdultAxis;
    eje_secondary: AdultAxis | null;
    motor: AdultMotor;
    pressure_style: AdultPressureStyle;
    history: AdultHistory;
    dominant_emotion: AdultDominantEmotion;
}

export interface PuentesAnswer {
    questionId: string;
    optionId: string;
}

export interface PuentePiece {
    titulo: string;
    como_esta_el: string;
    lo_que_traes: string;
    el_puente: string;
    pregunta_reflexion: string;
}

export interface PuentesAiSections {
    saludo: string;
    perfil_adulto_breve: string;
    puentes: [PuentePiece, PuentePiece, PuentePiece, PuentePiece];
    cierre: string;
}

export type PuentesPurchaseStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PuentesSessionStatus =
    | 'created'
    | 'answered'
    | 'generating'
    | 'generated'
    | 'sent'
    | 'failed';

export interface PuentesPurchase {
    id: string;
    source_session_id: string;
    recipient_email: string;
    recipient_name: string | null;
    child_name: string | null;
    amount_cents: number;
    currency: 'USD' | 'ARS';
    provider: 'stripe' | 'mercadopago';
    provider_payment_id: string | null;
    status: PuentesPurchaseStatus;
    magic_token: string;
    lang: Lang;
    source: 'argo_one' | 'tenant';
    tenant_id: string | null;
    created_at: string;
    paid_at: string | null;
}

export interface PuentesSession {
    id: string;
    purchase_id: string;
    source_session_id: string;
    adult_answers: PuentesAnswer[];
    adult_profile: AdultProfile | null;
    ai_sections: PuentesAiSections | null;
    status: PuentesSessionStatus;
    lang: Lang;
    error_log: string | null;
    created_at: string;
    completed_at: string | null;
    sent_at: string | null;
}
