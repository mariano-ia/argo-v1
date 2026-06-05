/**
 * Tenant lifecycle emails (welcome, trial reminders, payment failures,
 * cancellation). Pure HTML builders + a Resend sender, no browser deps, so it
 * is safe to import from Vercel serverless handlers (api/ may import src/lib).
 *
 * Visual style mirrors the existing Argo One emails: dark header with the logo,
 * white card, violet CTA button, muted footer.
 */

type Lang = 'es' | 'en' | 'pt';

const VIOLET = '#955FB5';

function site(): string {
    return process.env.SITE_URL || 'https://argomethod.com';
}

function normalizeLang(lang?: string): Lang {
    return lang === 'en' || lang === 'pt' ? lang : 'es';
}

/** Standard Argo email wrapper. */
function emailShell(opts: { heading: string; body: string; ctaText?: string; ctaUrl?: string; footnote?: string }): string {
    const { heading, body, ctaText, ctaUrl, footnote } = opts;
    const cta = ctaText && ctaUrl
        ? `<a href="${ctaUrl}" style="display:inline-block;background:${VIOLET};color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px;margin-top:4px;">${ctaText}</a>`
        : '';
    const foot = footnote ? `<p style="font-size:11px;color:#AEAEB2;margin:20px 0 0;">${footnote}</p>` : '';
    return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F5F5F7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F7;padding:32px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
<tr><td style="background:#1D1D1F;padding:24px 28px;">
    <span style="font-size:18px;color:#fff;font-weight:800;">Argo</span><span style="font-size:18px;color:#fff;font-weight:100;"> Method</span>
</td></tr>
<tr><td style="padding:28px;">
    <h2 style="font-size:20px;font-weight:300;color:#1D1D1F;margin:0 0 12px;">${heading}</h2>
    ${body}
    ${cta}
    ${foot}
</td></tr>
<tr><td style="background:#F5F5F7;padding:16px 28px;text-align:center;border-top:1px solid #E8E8ED;">
    <p style="font-size:11px;color:#AEAEB2;margin:0;">Argo Method · Perfilamiento conductual para deportistas jóvenes</p>
</td></tr>
</table></td></tr></table>
</body></html>`;
}

function p(text: string): string {
    return `<p style="font-size:14px;color:#86868B;margin:0 0 12px;line-height:1.6;">${text}</p>`;
}

/** Send through Resend. No-ops (with a warning) if RESEND_API_KEY is absent. */
export async function sendTenantEmail(to: string, subject: string, html: string): Promise<void> {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
        console.warn('[tenantEmails] RESEND_API_KEY not set, skipping email:', subject);
        return;
    }
    try {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ from: 'Argo Method <hola@argomethod.com>', to: [to], subject, html }),
        });
        if (!res.ok) console.error('[tenantEmails] Resend error:', res.status, await res.text().catch(() => ''));
    } catch (err) {
        console.error('[tenantEmails] send failed:', err);
    }
}

/* ── Builders ────────────────────────────────────────────────────────────── */

export function welcomeEmail(lang: string, displayName: string, slug: string): { subject: string; html: string } {
    const L = normalizeLang(lang);
    const playUrl = `${site()}/play/${slug}`;
    const dashUrl = `${site()}/dashboard`;
    const copy = {
        es: {
            subject: 'Bienvenido a Argo Method',
            heading: `Bienvenido, ${displayName}`,
            b1: 'Tu cuenta ya está activa con 14 días de prueba. Desde tu panel puedes invitar a tus deportistas y ver sus perfiles a medida que completan la experiencia.',
            b2: `Tu link para compartir con las familias es <a href="${playUrl}" style="color:${VIOLET};">${playUrl}</a>. Cada deportista que juega ocupa un lugar de tu equipo.`,
            cta: 'Ir a mi panel',
            foot: 'Si no creaste esta cuenta, puedes ignorar este email.',
        },
        en: {
            subject: 'Welcome to Argo Method',
            heading: `Welcome, ${displayName}`,
            b1: 'Your account is active with a 14-day trial. From your dashboard you can invite your athletes and see their profiles as they complete the experience.',
            b2: `Your link to share with families is <a href="${playUrl}" style="color:${VIOLET};">${playUrl}</a>. Each athlete who plays takes a slot on your team.`,
            cta: 'Go to my dashboard',
            foot: 'If you did not create this account, you can ignore this email.',
        },
        pt: {
            subject: 'Bem-vindo ao Argo Method',
            heading: `Bem-vindo, ${displayName}`,
            b1: 'Sua conta está ativa com 14 dias de teste. No seu painel você pode convidar seus atletas e ver os perfis conforme eles completam a experiência.',
            b2: `Seu link para compartilhar com as famílias é <a href="${playUrl}" style="color:${VIOLET};">${playUrl}</a>. Cada atleta que joga ocupa uma vaga do seu time.`,
            cta: 'Ir ao meu painel',
            foot: 'Se você não criou esta conta, pode ignorar este email.',
        },
    }[L];
    return { subject: copy.subject, html: emailShell({ heading: copy.heading, body: p(copy.b1) + p(copy.b2), ctaText: copy.cta, ctaUrl: dashUrl, footnote: copy.foot }) };
}

export function trialExpiringEmail(lang: string, displayName: string, daysLeft: number): { subject: string; html: string } {
    const L = normalizeLang(lang);
    const pricingUrl = `${site()}/dashboard/pricing`;
    const dleft = (es: string, en: string, pt: string) => ({ es, en, pt }[L]);
    const days = daysLeft === 1
        ? dleft('1 día', '1 day', '1 dia')
        : dleft(`${daysLeft} días`, `${daysLeft} days`, `${daysLeft} dias`);
    const copy = {
        es: {
            subject: `Tu prueba de Argo vence en ${days}`,
            heading: 'Tu prueba está por terminar',
            b1: `Hola ${displayName}, a tu periodo de prueba le quedan ${days}. Para no perder acceso a tu equipo y seguir sumando deportistas, elige un plan cuando quieras.`,
            cta: 'Ver planes',
        },
        en: {
            subject: `Your Argo trial ends in ${days}`,
            heading: 'Your trial is about to end',
            b1: `Hi ${displayName}, your trial has ${days} left. To keep access to your team and keep adding athletes, choose a plan whenever you are ready.`,
            cta: 'See plans',
        },
        pt: {
            subject: `Seu teste do Argo termina em ${days}`,
            heading: 'Seu teste está terminando',
            b1: `Olá ${displayName}, faltam ${days} para o fim do seu teste. Para manter o acesso ao seu time e continuar adicionando atletas, escolha um plano quando quiser.`,
            cta: 'Ver planos',
        },
    }[L];
    return { subject: copy.subject, html: emailShell({ heading: copy.heading, body: p(copy.b1), ctaText: copy.cta, ctaUrl: pricingUrl }) };
}

export function trialExpiredEmail(lang: string, displayName: string): { subject: string; html: string } {
    const L = normalizeLang(lang);
    const pricingUrl = `${site()}/dashboard/pricing`;
    const copy = {
        es: {
            subject: 'Tu prueba de Argo terminó',
            heading: 'Tu prueba terminó',
            b1: `Hola ${displayName}, tu periodo de prueba finalizó. Tus perfiles y reportes siguen guardados.`,
            b2: 'Para volver a sumar deportistas y usar todas las funciones, elige un plan. Te toma menos de dos minutos.',
            cta: 'Elegir un plan',
        },
        en: {
            subject: 'Your Argo trial has ended',
            heading: 'Your trial has ended',
            b1: `Hi ${displayName}, your trial period ended. Your profiles and reports are still saved.`,
            b2: 'To add athletes again and use every feature, choose a plan. It takes less than two minutes.',
            cta: 'Choose a plan',
        },
        pt: {
            subject: 'Seu teste do Argo terminou',
            heading: 'Seu teste terminou',
            b1: `Olá ${displayName}, seu período de teste terminou. Seus perfis e relatórios continuam salvos.`,
            b2: 'Para adicionar atletas novamente e usar todas as funções, escolha um plano. Leva menos de dois minutos.',
            cta: 'Escolher um plano',
        },
    }[L];
    return { subject: copy.subject, html: emailShell({ heading: copy.heading, body: p(copy.b1) + p(copy.b2), ctaText: copy.cta, ctaUrl: pricingUrl }) };
}

export function paymentFailedEmail(lang: string): { subject: string; html: string } {
    const L = normalizeLang(lang);
    const dashUrl = `${site()}/dashboard`;
    const copy = {
        es: {
            subject: 'No pudimos procesar tu pago',
            heading: 'Hubo un problema con tu pago',
            b1: 'No pudimos procesar el cobro de tu suscripción. Lo intentaremos de nuevo automáticamente, pero puedes revisar tu medio de pago para evitar interrupciones.',
            cta: 'Revisar mi cuenta',
            foot: 'Si ya lo resolviste, puedes ignorar este email.',
        },
        en: {
            subject: 'We could not process your payment',
            heading: 'There was a problem with your payment',
            b1: 'We could not process your subscription charge. We will retry automatically, but you may want to review your payment method to avoid interruptions.',
            cta: 'Review my account',
            foot: 'If you already fixed it, you can ignore this email.',
        },
        pt: {
            subject: 'Não conseguimos processar seu pagamento',
            heading: 'Houve um problema com seu pagamento',
            b1: 'Não conseguimos processar a cobrança da sua assinatura. Vamos tentar de novo automaticamente, mas você pode revisar seu meio de pagamento para evitar interrupções.',
            cta: 'Revisar minha conta',
            foot: 'Se você já resolveu, pode ignorar este email.',
        },
    }[L];
    return { subject: copy.subject, html: emailShell({ heading: copy.heading, body: p(copy.b1), ctaText: copy.cta, ctaUrl: dashUrl, footnote: copy.foot }) };
}

export function subscriptionEndedEmail(lang: string): { subject: string; html: string } {
    const L = normalizeLang(lang);
    const pricingUrl = `${site()}/dashboard/pricing`;
    const copy = {
        es: {
            subject: 'Tu suscripción a Argo finalizó',
            heading: 'Tu suscripción finalizó',
            b1: 'Tu plan volvió al estado de prueba. Tus perfiles y reportes siguen guardados.',
            b2: 'Cuando quieras retomar, puedes activar un plan de nuevo en cualquier momento.',
            cta: 'Ver planes',
        },
        en: {
            subject: 'Your Argo subscription has ended',
            heading: 'Your subscription has ended',
            b1: 'Your plan returned to the trial state. Your profiles and reports are still saved.',
            b2: 'Whenever you want to resume, you can activate a plan again at any time.',
            cta: 'See plans',
        },
        pt: {
            subject: 'Sua assinatura do Argo terminou',
            heading: 'Sua assinatura terminou',
            b1: 'Seu plano voltou ao estado de teste. Seus perfis e relatórios continuam salvos.',
            b2: 'Quando quiser retomar, você pode ativar um plano novamente a qualquer momento.',
            cta: 'Ver planos',
        },
    }[L];
    return { subject: copy.subject, html: emailShell({ heading: copy.heading, body: p(copy.b1) + p(copy.b2), ctaText: copy.cta, ctaUrl: pricingUrl }) };
}
