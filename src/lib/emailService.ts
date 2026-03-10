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
    // In local dev (Vite) the Vercel serverless function isn't running.
    // Mock a successful send so the UI flow is fully testable without a deployed API.
    if (import.meta.env.DEV) {
        console.info('[Argo Dev] Email mock — would send to:', params.toEmail);
        await new Promise(r => setTimeout(r, 1400));
        return;
    }

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
