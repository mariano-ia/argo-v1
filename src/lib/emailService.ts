import emailjs from '@emailjs/browser';

const SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID  as string | undefined;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string | undefined;
const PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY  as string | undefined;

export interface EmailReportParams {
    toEmail: string;
    nombreAdulto: string;
    nombreNino: string;
    deporte: string;
    edad: number;
    arquetipo: string;
    reportHtml: string;
    maduracionTemprana: boolean;
}

export async function sendReport(params: EmailReportParams): Promise<void> {
    if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
        throw new Error('EmailJS no está configurado. Verificá las variables de entorno VITE_EMAILJS_*');
    }

    const maduracionNote = params.maduracionTemprana
        ? 'NOTA: Perfil en etapa de maduración temprana (menor de 7 años). Los perfiles DISC son muy plásticos a esta edad. Se recomienda revisar en 6 meses.'
        : '';

    await emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        {
            to_email:           params.toEmail,
            nombre_adulto:      params.nombreAdulto,
            nombre_nino:        params.nombreNino,
            deporte:            params.deporte,
            edad:               String(params.edad),
            arquetipo:          params.arquetipo,
            report_html:        params.reportHtml,
            maduracion_nota:    maduracionNote,
        },
        PUBLIC_KEY,
    );
}
