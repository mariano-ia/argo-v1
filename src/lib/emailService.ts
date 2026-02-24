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
    const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    });

    if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Error desconocido' }));
        const msg = typeof data.error === 'string'
            ? data.error
            : JSON.stringify(data.error);
        throw new Error(msg);
    }
}
