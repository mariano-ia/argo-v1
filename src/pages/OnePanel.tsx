import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, ExternalLink, X } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { AXIS_COLORS } from '../lib/designTokens';
import { InfoTip, ToastProvider, useToast } from '../components/ui';

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface OneLink {
    id: string;
    slug: string;
    status: 'available' | 'sent' | 'pending' | 'completed';
    recipient_email: string | null;
    child_name: string | null;
    sport: string | null;
    completed_at: string | null;
    session_id: string | null;
    report_token?: string | null;  // perfilamiento.share_token, required for the /report link
    report_status?: string | null; // held/pending => "preparando" (no ver informe todavía)
}

interface PanelData {
    purchase: { email: string; pack_size: number; paid_at: string };
    links: OneLink[];
    summary: { total: number; completed: number; pending: number; available: number };
}

/* ── i18n ──────────────────────────────────────────────────────────────────── */

const T = {
    es: {
        title: 'Mis informes',
        pack: (n: number) => `Pack de ${n} ${n === 1 ? 'informe' : 'informes'}`,
        used: (n: number, t: number) => `${n} de ${t} usados`,
        available: 'Disponible',
        availableDesc: 'Genera un link para que un deportista juegue.',
        sent: 'Link enviado',
        pending: 'Pendiente',
        completed: 'Completado',
        sentTo: 'Enviado a',
        generateLink: 'Generar link',
        copyLink: 'Copiar link',
        copied: 'Copiado',
        viewReport: 'Ver informe',
        buyMore: 'Comprar más informes',
        howTitle: 'Cómo funciona',
        how1: 'Genera un link para cada deportista que quieras perfilar.',
        how2: 'El adulto responsable completa el registro y le pasa el dispositivo al deportista.',
        how3: 'El deportista juega una aventura de menos de 10 minutos.',
        how4: 'El informe completo llega al email del adulto responsable.',
        modalTitle: 'Generar link de juego',
        modalDesc: 'Ingresa el email del adulto responsable. Recibirá las instrucciones y luego el informe.',
        emailPlaceholder: 'Email del adulto responsable',
        namePlaceholder: 'Nombre del deportista (opcional)',
        sportSelect: 'Deporte del deportista',
        sportOtherPlaceholder: 'Escribe el deporte...',
        sports: ['Fútbol', 'Hockey', 'Básquet', 'Rugby', 'Tenis', 'Natación', 'Voley', 'Atletismo', 'Handball', 'Béisbol', 'Otro'],
        cancel: 'Cancelar',
        generateAndSend: 'Generar y enviar',
        loading: 'Cargando...',
        notFound: 'Compra no encontrada',
        notFoundDesc: 'Verifica el link que recibiste por email.',
        notPaid: 'Pago pendiente',
        notPaidDesc: 'Tu pago todavía no fue confirmado. Si ya pagaste, espera unos minutos e intenta de nuevo.',
        accessTitle: 'Accede a tus informes',
        accessDesc: 'Ingresa el email con el que compraste y te enviamos un link de acceso a tu panel.',
        accessEmailPlaceholder: 'Tu email',
        accessSend: 'Enviarme el link',
        accessSending: 'Enviando...',
        accessSentTitle: 'Revisa tu email',
        accessSentDesc: 'Si tienes compras con ese email, te enviamos un link para acceder a tu panel.',
    },
    en: {
        title: 'My reports',
        pack: (n: number) => `Pack of ${n} ${n === 1 ? 'report' : 'reports'}`,
        used: (n: number, t: number) => `${n} of ${t} used`,
        available: 'Available',
        availableDesc: 'Generate a link for an athlete to play.',
        sent: 'Link sent',
        pending: 'Pending',
        completed: 'Completed',
        sentTo: 'Sent to',
        generateLink: 'Generate link',
        copyLink: 'Copy link',
        copied: 'Copied',
        viewReport: 'View report',
        buyMore: 'Buy more reports',
        howTitle: 'How it works',
        how1: 'Generate a link for each athlete you want to profile.',
        how2: 'The responsible adult registers and hands the device to the athlete.',
        how3: 'The athlete plays an adventure of less than 10 minutes.',
        how4: 'The full report arrives at the adult\'s email.',
        modalTitle: 'Generate play link',
        modalDesc: 'Enter the responsible adult\'s email. They will receive instructions and then the report.',
        emailPlaceholder: 'Responsible adult\'s email',
        namePlaceholder: 'Athlete\'s name (optional)',
        sportSelect: 'Athlete\'s sport',
        sportOtherPlaceholder: 'Type the sport...',
        sports: ['Soccer', 'Hockey', 'Basketball', 'Rugby', 'Tennis', 'Swimming', 'Volleyball', 'Track & Field', 'Handball', 'Baseball', 'Other'],
        cancel: 'Cancel',
        generateAndSend: 'Generate & send',
        loading: 'Loading...',
        notFound: 'Purchase not found',
        notFoundDesc: 'Check the link you received by email.',
        notPaid: 'Payment pending',
        notPaidDesc: 'Your payment has not been confirmed yet. If you already paid, wait a few minutes and try again.',
        accessTitle: 'Access your reports',
        accessDesc: 'Enter the email you purchased with and we will send you a link to your panel.',
        accessEmailPlaceholder: 'Your email',
        accessSend: 'Send me the link',
        accessSending: 'Sending...',
        accessSentTitle: 'Check your email',
        accessSentDesc: 'If you have purchases with that email, we sent you a link to access your panel.',
    },
    pt: {
        title: 'Meus relatórios',
        pack: (n: number) => `Pack de ${n} ${n === 1 ? 'relatório' : 'relatórios'}`,
        used: (n: number, t: number) => `${n} de ${t} usados`,
        available: 'Disponível',
        availableDesc: 'Gere um link para um atleta jogar.',
        sent: 'Link enviado',
        pending: 'Pendente',
        completed: 'Completado',
        sentTo: 'Enviado para',
        generateLink: 'Gerar link',
        copyLink: 'Copiar link',
        copied: 'Copiado',
        viewReport: 'Ver relatório',
        buyMore: 'Comprar mais relatórios',
        howTitle: 'Como funciona',
        how1: 'Gere um link para cada atleta que deseja perfilar.',
        how2: 'O adulto responsável completa o registro e passa o dispositivo ao atleta.',
        how3: 'O atleta joga uma aventura de menos de 10 minutos.',
        how4: 'O relatório completo chega no email do adulto responsável.',
        modalTitle: 'Gerar link de jogo',
        modalDesc: 'Insira o email do adulto responsável. Ele receberá as instruções e depois o relatório.',
        emailPlaceholder: 'Email do adulto responsável',
        namePlaceholder: 'Nome do atleta (opcional)',
        sportSelect: 'Esporte do atleta',
        sportOtherPlaceholder: 'Digite o esporte...',
        sports: ['Futebol', 'Hóquei', 'Basquete', 'Rugby', 'Tênis', 'Natação', 'Vôlei', 'Atletismo', 'Handebol', 'Beisebol', 'Outro'],
        cancel: 'Cancelar',
        generateAndSend: 'Gerar e enviar',
        loading: 'Carregando...',
        notFound: 'Compra não encontrada',
        notFoundDesc: 'Verifique o link que recebeu por email.',
        notPaid: 'Pagamento pendente',
        notPaidDesc: 'Seu pagamento ainda não foi confirmado. Se já pagou, aguarde alguns minutos e tente novamente.',
        accessTitle: 'Acesse seus relatórios',
        accessDesc: 'Insira o email com que comprou e enviaremos um link de acesso ao seu painel.',
        accessEmailPlaceholder: 'Seu email',
        accessSend: 'Enviar o link',
        accessSending: 'Enviando...',
        accessSentTitle: 'Verifique seu email',
        accessSentDesc: 'Se você tem compras com esse email, enviamos um link para acessar seu painel.',
    },
};

/* ══════════════════════════════════════════════════════════════════════════
 * HUB v2 (ArgoOne fusion) — rendered when the payload has version === 2.
 * The panel adapts to WHO enters (resolved by email in api/one-panel.ts): the
 * owned/bought children, this adult's bridges, and pending play links. Behind
 * VITE_BRIDGES_V2 on the backend; the front branches on payload.version so old
 * tokens still get the v1 panel below (backward-compat by shape).
 * ════════════════════════════════════════════════════════════════════════════ */

interface HubReportF {
    perfilamiento_id: string;
    status: string | null;
    ready: boolean;
    share_token: string | null;
    archetype_label: string | null;
    eje: string | null;
    motor_line: string | null;
    expires_at: string | null;
    is_stale: boolean;
}
interface HubBridgeF {
    status: string | null;
    ready: boolean;
    expires_at: string | null;
    is_stale: boolean;
}
interface HubChildF {
    key: string;
    child_id: string | null;
    perfilamiento_id: string | null;
    name: string | null;
    age: number | null;
    sport: string | null;
    report: HubReportF | null;
    is_buyer: boolean;
    is_responsible: boolean;
    is_invited: boolean;
    my_bridge: HubBridgeF | null;
    play_link: { slug: string; status: string } | null;
    deletion_id: string | null;
    comp_token: string | null;
    bridge_token: string | null;
    invites?: { email: string; status: string }[];
    // The child's ONE shareable bridges-link (frozen model §4); minted lazily.
    bridge_link?: string | null;
    linked_adults?: number;
}
interface HubData {
    version: 2;
    email: string;
    lang: string;
    role: string;
    children: HubChildF[];
    available_slots: number;
    can_upgrade_academy: boolean;
}

type HubLang = 'es' | 'en' | 'pt';

const TH = {
    es: {
        greeting: {
            one_and_done: { t: 'Tu panel', s: 'Todo lo tuyo en un lugar. Guarda este link para volver cuando quieras.' },
            family: { t: 'Tu panel', s: 'Aquí se acumula todo lo tuyo: los niños que autorizaste y tus puentes.' },
            buyer_no_child_yet: { t: '¡Gracias por tu compra!', s: 'Te quedan dos pasos, en el orden que prefieras.' },
            invited_adult: { t: 'Tus puentes', s: 'Aquí tienes tu puente con cada niño. Queda guardado para siempre.' },
            empty: { t: 'Tu panel', s: 'Guarda este link para volver cuando quieras.' },
        } as Record<string, { t: string; s: string }>,
        kidsOne: 'El niño',
        kidsMany: 'Los niños',
        motor: 'Su motor:',
        viewReport: 'Ver el informe',
        preparing: 'Preparando…',
        stale: 'El informe tiene más de 6 meses. Puede estar desactualizado, pero puedes seguir consultándolo. Si quieres la foto de hoy, vuelve a jugar.',
        updateReport: 'Actualizar el informe',
        shareBridgeLink: 'Compartir link de puentes',
        shareBridgeLinkTip: (n: string) => `Este es el link de puentes de ${n}. Compártelo con los adultos cercanos (abuelos, tíos, quien lo acompaña) para que cada uno cree su propio puente con ${n}. Cada adulto paga el suyo (USD 4.99) y solo ve su puente, nunca el informe de ${n}. Solo tú puedes compartirlo.`,
        linkCopied: 'Link copiado. Ahora compártelo con quien quieras.',
        linkedAdults: (n: number) => `Adultos vinculados (${n})`,
        linkedTitle: (n: string) => `Adultos vinculados a ${n}`,
        linkedSub: 'Crearon su puente con el link que compartiste.',
        linkedEmpty: 'Todavía nadie creó su puente. Comparte el link con los adultos cercanos.',
        linkedCreated: 'creó su puente',
        revokeLink: 'Revocar link',
        revokeConfirm: '¿Revocar el link? Se genera uno nuevo. Los puentes ya creados no se pierden; el link viejo deja de funcionar.',
        linkRevoked: 'Link revocado. Se generó uno nuevo.',
        close: 'Cerrar',
        roleTag: 'tu puente',
        roleNote: 'Tu puente es tuyo para siempre. El informe individual del niño lo tiene el adulto que lo autorizó: si lo necesitas, pídeselo a él.',
        notPlayedTitle: 'El niño todavía no jugó',
        notPlayedDesc: 'Comparte este link con el adulto que va a acompañarlo. Cuando el niño complete la aventura (menos de 10 minutos), su informe aparece aquí.',
        copyLink: 'Copiar el link para compartir',
        copied: 'Copiado',
        resend: 'Reenviar el link',
        bridgeReady: (n: string) => `Tu puente hacia ${n}: listo`,
        viewMyBridge: 'Ver mi puente',
        continueMyBridge: 'Continuar mi puente',
        bridgeInProgress: (n: string) => `Tu puente hacia ${n} está en curso.`,
        bridgeStale: (n: string) => `Tu puente hacia ${n} tiene más de 6 meses.`,
        refreshBridge: 'Refrescar mi puente',
        noBridgeYet: (n: string) => `Todavía no sumaste tu puente hacia ${n}.`,
        addBridge: 'Sumar mi puente',
        buyerBridgePrompt: 'Tu puente te muestra cómo conectar con el niño. Adelántalo ahora (5 min).',
        compBridgePrompt: 'Tu puente está incluido en tu compra. Créalo para conectar mejor con el niño.',
        createMyBridge: 'Crear mi puente',
        otherTitle: 'Perfila a otro niño',
        otherDesc: 'Otra aventura, otro informe. Para sumar más adultos a un niño que ya jugó, usa "Compartir link de puentes" en la tarjeta del niño.',
        otherCta: 'Perfilar a otro niño',
        academyEyebrow: '¿Acompañas a un equipo?',
        academyDesc: 'Un panel para todo tu grupo: química de equipo, un asistente que conoce a cada niño, y roles para varios adultos sin volver a autorizar de a uno.',
        academyLead: 'Da el paso a',
        academyCta: 'Hacer upgrade a',
        ageUnit: 'años',
        linkResent: 'Link reenviado.',
        footerRefresh: 'Cada perfil (del niño y del adulto) se actualiza cada 6 meses.',
        footerPrices: 'Precios en dólares. Al comprar desde Argentina se cobra al valor del dólar del día.',
        manageData: 'Administrar o eliminar datos',
        terms: 'Términos',
        cancel: 'Cancelar',
        comingSoon: 'Muy pronto disponible.',
        genericError: 'Algo salió mal. Intenta de nuevo.',
        alreadyBridge: 'Ya tienes un puente activo hacia este niño.',
    },
    en: {
        greeting: {
            one_and_done: { t: 'Your panel', s: 'Everything in one place. Save this link to come back anytime.' },
            family: { t: 'Your panel', s: 'Everything gathers here: the children you authorized and your bridges.' },
            buyer_no_child_yet: { t: 'Thanks for your purchase!', s: 'Two steps left, in whatever order you prefer.' },
            invited_adult: { t: 'Your bridges', s: 'Here is your bridge with each child. It lives here forever.' },
            empty: { t: 'Your panel', s: 'Save this link to come back anytime.' },
        } as Record<string, { t: string; s: string }>,
        kidsOne: 'The child',
        kidsMany: 'The children',
        motor: 'Their engine:',
        viewReport: 'View the report',
        preparing: 'Preparing…',
        stale: "This report is over 6 months old. It may be outdated, but you can still consult it. For today's snapshot, play again.",
        updateReport: 'Update the report',
        shareBridgeLink: 'Share the bridges link',
        shareBridgeLinkTip: (n: string) => `This is ${n}'s bridges link. Share it with the adults close to ${n} (grandparents, uncles, whoever accompanies them) so each one creates their own bridge. Each adult pays their own (USD 4.99) and sees only their bridge, never ${n}'s report. Only you can share it.`,
        linkCopied: 'Link copied. Now share it with whoever you want.',
        linkedAdults: (n: number) => `Linked adults (${n})`,
        linkedTitle: (n: string) => `Adults linked to ${n}`,
        linkedSub: 'They created their bridge with the link you shared.',
        linkedEmpty: 'No one has created their bridge yet. Share the link with the adults close to them.',
        linkedCreated: 'created their bridge',
        revokeLink: 'Revoke link',
        revokeConfirm: 'Revoke the link? A new one is generated. Bridges already created are kept; the old link stops working.',
        linkRevoked: 'Link revoked. A new one was generated.',
        close: 'Close',
        roleTag: 'your bridge',
        roleNote: "Your bridge is yours forever. The child's individual report belongs to the adult who authorized them: if you need it, ask them.",
        notPlayedTitle: "The child hasn't played yet",
        notPlayedDesc: 'Share this link with the adult who will accompany them. When the child completes the adventure (under 10 minutes), their report appears here.',
        copyLink: 'Copy the link to share',
        copied: 'Copied',
        resend: 'Resend the link',
        bridgeReady: (n: string) => `Your bridge with ${n}: ready`,
        viewMyBridge: 'View my bridge',
        continueMyBridge: 'Continue my bridge',
        bridgeInProgress: (n: string) => `Your bridge with ${n} is in progress.`,
        bridgeStale: (n: string) => `Your bridge with ${n} is over 6 months old.`,
        refreshBridge: 'Refresh my bridge',
        noBridgeYet: (n: string) => `You haven't added your bridge with ${n} yet.`,
        addBridge: 'Add my bridge',
        buyerBridgePrompt: 'Your bridge shows you how to connect with the child. Get a head start now (5 min).',
        compBridgePrompt: 'Your bridge is included in your purchase. Create it to connect better with the child.',
        createMyBridge: 'Create my bridge',
        otherTitle: 'Profile another child',
        otherDesc: 'Another adventure, another report. To add more adults to a child who already played, use "Share the bridges link" on the child\'s card.',
        otherCta: 'Profile another child',
        academyEyebrow: 'Do you accompany a team?',
        academyDesc: 'One panel for your whole group: team chemistry, an assistant that knows each child, and roles for several adults without authorizing one by one.',
        academyLead: 'Take the step to',
        academyCta: 'Upgrade to',
        ageUnit: 'years',
        linkResent: 'Link resent.',
        footerRefresh: 'Each profile (the child\'s and the adult\'s) refreshes every 6 months.',
        footerPrices: 'Prices in US dollars. When buying from Argentina you are charged at the day\'s dollar value.',
        manageData: 'Manage or delete data',
        terms: 'Terms',
        cancel: 'Cancel',
        comingSoon: 'Available very soon.',
        genericError: 'Something went wrong. Try again.',
        alreadyBridge: 'You already have an active bridge with this child.',
    },
    pt: {
        greeting: {
            one_and_done: { t: 'Seu painel', s: 'Tudo em um só lugar. Guarde este link para voltar quando quiser.' },
            family: { t: 'Seu painel', s: 'Aqui se acumula tudo seu: as crianças que você autorizou e suas pontes.' },
            buyer_no_child_yet: { t: 'Obrigado pela sua compra!', s: 'Faltam dois passos, na ordem que preferir.' },
            invited_adult: { t: 'Suas pontes', s: 'Aqui está a sua ponte com cada criança. Ela vive aqui para sempre.' },
            empty: { t: 'Seu painel', s: 'Guarde este link para voltar quando quiser.' },
        } as Record<string, { t: string; s: string }>,
        kidsOne: 'A criança',
        kidsMany: 'As crianças',
        motor: 'Seu motor:',
        viewReport: 'Ver o relatório',
        preparing: 'Preparando…',
        stale: 'Este relatório tem mais de 6 meses. Pode estar desatualizado, mas você ainda pode consultá-lo. Para a foto de hoje, jogue de novo.',
        updateReport: 'Atualizar o relatório',
        shareBridgeLink: 'Compartilhar link de pontes',
        shareBridgeLinkTip: (n: string) => `Este é o link de pontes de ${n}. Compartilhe com os adultos próximos (avós, tios, quem acompanha) para que cada um crie a sua própria ponte com ${n}. Cada adulto paga a sua (USD 4.99) e vê apenas a sua ponte, nunca o relatório de ${n}. Só você pode compartilhá-lo.`,
        linkCopied: 'Link copiado. Agora compartilhe com quem quiser.',
        linkedAdults: (n: number) => `Adultos vinculados (${n})`,
        linkedTitle: (n: string) => `Adultos vinculados a ${n}`,
        linkedSub: 'Criaram a sua ponte com o link que você compartilhou.',
        linkedEmpty: 'Ainda ninguém criou a sua ponte. Compartilhe o link com os adultos próximos.',
        linkedCreated: 'criou a sua ponte',
        revokeLink: 'Revogar link',
        revokeConfirm: 'Revogar o link? Um novo é gerado. As pontes já criadas não se perdem; o link antigo para de funcionar.',
        linkRevoked: 'Link revogado. Um novo foi gerado.',
        close: 'Fechar',
        roleTag: 'sua ponte',
        roleNote: 'A sua ponte é sua para sempre. O relatório individual da criança pertence ao adulto que a autorizou: se precisar dele, peça a ele.',
        notPlayedTitle: 'A criança ainda não jogou',
        notPlayedDesc: 'Compartilhe este link com o adulto que vai acompanhá-la. Quando a criança completar a aventura (menos de 10 minutos), seu relatório aparece aqui.',
        copyLink: 'Copiar o link para compartilhar',
        copied: 'Copiado',
        resend: 'Reenviar o link',
        bridgeReady: (n: string) => `Sua ponte com ${n}: pronta`,
        viewMyBridge: 'Ver minha ponte',
        continueMyBridge: 'Continuar minha ponte',
        bridgeInProgress: (n: string) => `Sua ponte com ${n} está em andamento.`,
        bridgeStale: (n: string) => `Sua ponte com ${n} tem mais de 6 meses.`,
        refreshBridge: 'Atualizar minha ponte',
        noBridgeYet: (n: string) => `Você ainda não somou sua ponte com ${n}.`,
        addBridge: 'Somar minha ponte',
        buyerBridgePrompt: 'Sua ponte mostra como conectar com a criança. Adiante agora (5 min).',
        compBridgePrompt: 'Sua ponte está incluída na sua compra. Crie-a para conectar melhor com a criança.',
        createMyBridge: 'Criar minha ponte',
        otherTitle: 'Perfilar outra criança',
        otherDesc: 'Outra aventura, outro relatório. Para somar mais adultos a uma criança que já jogou, use "Compartilhar link de pontes" no cartão da criança.',
        otherCta: 'Perfilar outra criança',
        academyEyebrow: 'Você acompanha uma equipe?',
        academyDesc: 'Um painel para todo o seu grupo: química de equipe, um assistente que conhece cada criança, e papéis para vários adultos sem autorizar um a um.',
        academyLead: 'Dê o passo para',
        academyCta: 'Fazer upgrade para',
        ageUnit: 'anos',
        linkResent: 'Link reenviado.',
        footerRefresh: 'Cada perfil (da criança e do adulto) se atualiza a cada 6 meses.',
        footerPrices: 'Preços em dólares. Ao comprar da Argentina cobra-se pelo valor do dólar do dia.',
        manageData: 'Administrar ou excluir dados',
        terms: 'Termos',
        cancel: 'Cancelar',
        comingSoon: 'Disponível em breve.',
        genericError: 'Algo deu errado. Tente de novo.',
        alreadyBridge: 'Você já tem uma ponte ativa com esta criança.',
    },
};

/* ── Small wordmark spans (Argo bold + rest thin, ® last) ────────────────────── */
const Wordmark: React.FC<{ rest: string }> = ({ rest }) => (
    <span className="whitespace-nowrap"><span className="font-extrabold">Argo</span><span className="font-light">{rest}</span></span>
);

/* ── One child card ──────────────────────────────────────────────────────────── */
const HubChildCard: React.FC<{
    child: HubChildF;
    th: typeof TH['es'];
    onCopy: (slug: string) => void;
    copiedSlug: string | null;
    onResend: (linkId: string) => void;
    onShareLink: (child: HubChildF) => void;
    onLinkedAdults: (child: HubChildF) => void;
    onUpdate: (childId: string | null) => void;
    onAddBridge: (child: HubChildF) => void;
    onCreateBridge: () => void;
    onViewBridge: () => void;
}> = ({ child, th, onCopy, copiedSlug, onResend, onShareLink, onLinkedAdults, onUpdate, onAddBridge, onCreateBridge, onViewBridge }) => {
    const name = child.name || th.kidsOne;
    const eje = child.report?.eje ?? null;
    const avatarBg = eje ? AXIS_COLORS[eje] : '#F5F5F7';
    const avatarFg = eje ? '#fff' : '#AEAEB2';
    const meta = [child.age ? `${child.age} ${th.ageUnit}` : null, child.sport].filter(Boolean).join(' · ');
    const reportReady = !!(child.report && child.report.ready && child.report.perfilamiento_id);
    const reportPreparing = !!(child.report && !child.report.ready);
    // "Played" = the child has a resolved perfilamiento, regardless of whether
    // the REPORT display is ready (a 'held' report is still buildable-from). The
    // bridges-link is available as soon as the child played, so a report in
    // review never strips the authorizer's ability to invite adults.
    const played = !!child.perfilamiento_id;
    const reportLink = child.report?.share_token
        ? `/report/${child.report.perfilamiento_id}?token=${child.report.share_token}`
        : null;

    return (
        <div className="bg-white rounded-[14px] shadow-argo border border-argo-border overflow-hidden">
            <div className="px-5 py-5">
                {child.play_link && !child.report ? (
                    /* Buyer, not played yet */
                    <div className="flex items-start gap-3.5">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-[17px] bg-argo-neutral text-argo-light">?</div>
                        <div className="flex-1 min-w-0">
                            <p className="text-base font-bold text-argo-navy tracking-tight">{th.notPlayedTitle}</p>
                            <p className="text-[13px] text-argo-secondary mt-2 leading-relaxed">{th.notPlayedDesc}</p>
                            <div className="flex flex-wrap gap-2 mt-3">
                                <button onClick={() => onCopy(child.play_link!.slug)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-semibold bg-argo-violet-500 text-white hover:bg-argo-violet-600 transition-colors">
                                    {copiedSlug === child.play_link!.slug ? <><Check size={13} /> {th.copied}</> : <><Copy size={13} /> {th.copyLink}</>}
                                </button>
                                {child.play_link!.status === 'sent' && (
                                    <button onClick={() => onResend(child.key.replace(/^link:/, ''))} className="px-4 py-2 rounded-[10px] text-[13px] font-semibold bg-white border border-argo-border text-argo-navy hover:bg-argo-neutral transition-colors">{th.resend}</button>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-start gap-3.5">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-[17px]" style={{ background: avatarBg, color: avatarFg }}>
                            {name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-base font-bold text-argo-navy tracking-tight truncate">{name}</p>
                                    {meta && <p className="text-[12.5px] text-argo-grey mt-0.5">{meta}{child.is_invited ? ` · ${th.roleTag}` : ''}</p>}
                                </div>
                                {reportReady && child.report?.archetype_label && (
                                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-argo-neutral text-argo-secondary flex-shrink-0">
                                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: eje ? AXIS_COLORS[eje] : '#AEAEB2' }} />
                                        {child.report.archetype_label}
                                    </span>
                                )}
                            </div>

                            {reportReady && child.report?.motor_line && (
                                <p className="text-[13px] text-argo-secondary mt-3"><b className="font-semibold text-argo-navy">{th.motor}</b> {child.report.motor_line}</p>
                            )}

                            {reportReady && child.report?.is_stale && (
                                <div className="flex gap-2.5 items-start px-4 py-3 rounded-[10px] bg-amber-50 border border-amber-200 text-amber-700 text-[13px] mt-3.5">
                                    <span className="font-extrabold">!</span>
                                    <span>{th.stale}</span>
                                </div>
                            )}

                            <div className="flex flex-wrap items-center gap-2 mt-3.5">
                                {reportPreparing && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-xs font-semibold border border-amber-200 bg-amber-50 text-amber-700">{th.preparing}</span>
                                )}
                                {reportReady && reportLink && (
                                    <Link to={reportLink} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-semibold bg-argo-violet-500 text-white hover:bg-argo-violet-600 transition-colors">
                                        <ExternalLink size={13} /> {th.viewReport}
                                    </Link>
                                )}
                                {reportReady && child.report?.is_stale && child.is_responsible && (
                                    <button onClick={() => onUpdate(child.child_id)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-semibold bg-white border border-argo-border text-argo-navy hover:bg-argo-neutral transition-colors">
                                        {th.updateReport} <span className="text-[11.5px] font-bold opacity-80">USD 12.99</span>
                                    </button>
                                )}
                            </div>

                            {/* Bridges-link actions (frozen model §4): only the
                                authorizing adult, available as soon as the child played. */}
                            {played && !child.is_invited && child.is_responsible && (
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3">
                                    <span className="inline-flex items-center gap-1">
                                        <button onClick={() => onShareLink(child)} className="inline-flex items-center gap-1.5 py-1 text-[12.5px] font-semibold text-argo-grey border-b border-dotted border-argo-light hover:text-argo-violet-500 hover:border-argo-violet-500 transition-colors"><Copy size={12} /> {th.shareBridgeLink}</button>
                                        <InfoTip text={th.shareBridgeLinkTip(name)} position="top" />
                                    </span>
                                    <button onClick={() => onLinkedAdults(child)} className="inline-flex items-center py-1 text-[12.5px] font-semibold text-argo-grey border-b border-dotted border-argo-light hover:text-argo-violet-500 hover:border-argo-violet-500 transition-colors">{th.linkedAdults(child.linked_adults ?? 0)}</button>
                                </div>
                            )}

                            {child.is_invited && (
                                <p className="text-[12px] text-argo-light mt-2">{th.roleNote}</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Puente row */}
            {(() => {
                // buyer, not played → prompt to get a head start on their bridge
                if (child.play_link && !child.report) {
                    return (
                        <div className="flex items-center justify-between gap-3 px-5 py-3.5 bg-argo-neutral border-t border-argo-border">
                            <div className="text-[13px] text-argo-secondary flex-1 min-w-0">{th.buyerBridgePrompt}</div>
                            <button onClick={onCreateBridge} className="px-4 py-2 rounded-[10px] text-[13px] font-semibold bg-argo-violet-500 text-white hover:bg-argo-violet-600 transition-colors flex-shrink-0">{th.createMyBridge}</button>
                        </div>
                    );
                }
                if (child.my_bridge && child.my_bridge.ready && !child.my_bridge.is_stale) {
                    return (
                        <div className="flex items-center justify-between gap-3 px-5 py-3.5 bg-argo-neutral border-t border-argo-border">
                            <div className="text-[13px] text-argo-secondary flex-1 min-w-0"><b className="font-semibold text-argo-navy">{th.bridgeReady(name)}</b></div>
                            {child.bridge_token ? (
                                <Link to={`/puentes/${child.bridge_token}`} className="px-4 py-2 rounded-[10px] text-[13px] font-semibold bg-white border border-argo-border text-argo-navy hover:bg-argo-neutral transition-colors flex-shrink-0">{th.viewMyBridge}</Link>
                            ) : (
                                <button onClick={onViewBridge} className="px-4 py-2 rounded-[10px] text-[13px] font-semibold bg-white border border-argo-border text-argo-navy hover:bg-argo-neutral transition-colors flex-shrink-0">{th.viewMyBridge}</button>
                            )}
                        </div>
                    );
                }
                // In-progress paid bridge (created/answered/generating): offer to
                // CONTINUE it, never to buy it again.
                if (child.my_bridge && !child.my_bridge.ready && child.bridge_token) {
                    return (
                        <div className="flex items-center justify-between gap-3 px-5 py-3.5 bg-argo-neutral border-t border-argo-border">
                            <div className="text-[13px] text-argo-secondary flex-1 min-w-0">{th.bridgeInProgress(name)}</div>
                            <Link to={`/puentes/${child.bridge_token}`} className="px-4 py-2 rounded-[10px] text-[13px] font-semibold bg-argo-violet-500 text-white hover:bg-argo-violet-600 transition-colors flex-shrink-0">{th.continueMyBridge}</Link>
                        </div>
                    );
                }
                if (child.my_bridge && child.my_bridge.is_stale) {
                    // NOTE: the $4.99 refresh CTA is deliberately absent — the
                    // checkout is not cycle-aware yet (it 409s on the existing paid
                    // purchase), so a refresh button could never complete. It rides
                    // with the cycle-aware checkout at cutover.
                    return (
                        <div className="flex items-center justify-between gap-3 px-5 py-3.5 bg-argo-neutral border-t border-argo-border">
                            <div className="text-[13px] text-argo-secondary flex-1 min-w-0">{th.bridgeStale(name)}</div>
                            {child.bridge_token && (
                                <Link to={`/puentes/${child.bridge_token}`} className="px-4 py-2 rounded-[10px] text-[13px] font-semibold bg-white border border-argo-border text-argo-navy hover:bg-argo-neutral transition-colors flex-shrink-0">{th.viewMyBridge}</Link>
                            )}
                        </div>
                    );
                }
                // no bridge yet. A buyer with the included $12.99 comp creates it
                // FREE; otherwise the responsible adult self-adds it for $4.99.
                if (!child.my_bridge && reportReady && child.comp_token) {
                    return (
                        <div className="flex items-center justify-between gap-3 px-5 py-3.5 bg-argo-neutral border-t border-argo-border">
                            <div className="text-[13px] text-argo-secondary flex-1 min-w-0">{th.compBridgePrompt}</div>
                            <Link to={`/puentes/${child.comp_token}`} className="px-4 py-2 rounded-[10px] text-[13px] font-semibold bg-argo-violet-500 text-white hover:bg-argo-violet-600 transition-colors flex-shrink-0">{th.createMyBridge}</Link>
                        </div>
                    );
                }
                if (!child.my_bridge && child.is_responsible && reportReady) {
                    return (
                        <div className="flex items-center justify-between gap-3 px-5 py-3.5 bg-argo-neutral border-t border-argo-border">
                            <div className="text-[13px] text-argo-secondary flex-1 min-w-0">{th.noBridgeYet(name)}</div>
                            <button onClick={() => onAddBridge(child)} className="px-4 py-2 rounded-[10px] text-[13px] font-semibold bg-white border border-argo-border text-argo-navy hover:bg-argo-neutral transition-colors flex-shrink-0">{th.addBridge} <span className="text-[11.5px] font-bold opacity-80">USD 4.99</span></button>
                        </div>
                    );
                }
                return null;
            })()}
        </div>
    );
};

/* ── The hub itself ──────────────────────────────────────────────────────────── */
const HubV2Inner: React.FC<{ data: HubData; token: string; lang: HubLang; demo: boolean; onRefresh?: () => void }> = ({ data, token, lang, demo, onRefresh }) => {
    const th = TH[lang] ?? TH.es;
    const { toast } = useToast();
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://argomethod.com';
    const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    type LinkedAdult = { email: string; name: string | null; created_at: string };
    const [linked, setLinked] = useState<{ child: HubChildF; adults: LinkedAdult[] | null } | null>(null);

    const g = th.greeting[data.role] ?? th.greeting.empty;
    const played = data.children.filter(c => (c.is_responsible || c.is_buyer) && c.report);
    const kidsLabel = played.length > 1 || data.children.length > 1 ? th.kidsMany : th.kidsOne;
    const showOther = data.role === 'family' || played.length >= 1;

    const copyPlayLink = (slug: string) => {
        navigator.clipboard?.writeText(`${origin}/one/${slug}`);
        setCopiedSlug(slug);
        setTimeout(() => setCopiedSlug(null), 2000);
    };

    const postAction = useCallback(async (body: Record<string, unknown>): Promise<Response | null> => {
        if (demo) { toast('info', th.comingSoon); return null; }
        try {
            return await fetch(`/api/one-panel?token=${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
        } catch { toast('error', th.genericError); return null; }
    }, [demo, token, th, toast]);

    const startReplay = async (childId: string | null) => {
        if (demo) { toast('info', th.comingSoon); return; }
        setBusy(true);
        try {
            const res = await fetch('/api/one-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: data.email, kind: 'one_puente', lang, child_id: childId }),
            });
            const j = await res.json();
            if (j.checkout_url) window.location.href = j.checkout_url;
            else toast('error', th.genericError);
        } catch { toast('error', th.genericError); }
        setBusy(false);
    };

    const refreshBridge = async (child: HubChildF) => {
        if (demo) { toast('info', th.comingSoon); return; }
        if (!child.perfilamiento_id) { toast('error', th.genericError); return; }
        setBusy(true);
        try {
            const res = await fetch('/api/puentes-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // recipient_email MUST be the child's responsible-adult email (== the
                // viewer's own email here, since this button only shows to the
                // responsible adult) or the gate 403s. Debt #4: the email is locked.
                body: JSON.stringify({ source_session_id: child.perfilamiento_id, recipient_email: data.email, consent_given: true, lang }),
            });
            if (res.status === 409) {
                const j = await res.json();
                if (j.existing_magic_link) { window.location.href = j.existing_magic_link; return; }
                toast('info', th.alreadyBridge);
            } else {
                const j = await res.json();
                if (j.checkout_url) window.location.href = j.checkout_url;
                else toast('error', th.genericError);
            }
        } catch { toast('error', th.genericError); }
        setBusy(false);
    };

    // Frozen model §4: copy the child's ONE shareable bridges-link. The token is
    // pre-minted server-side (present as child.bridge_link), so the common path
    // copies SYNCHRONOUSLY inside the click gesture (WebKit rejects clipboard
    // writes after an await). Only the rare not-yet-minted case awaits the
    // action, where we fall back to the modal (a fresh gesture) instead of lying.
    const shareBridgeLink = (child: HubChildF) => {
        const url = child.bridge_link ? `${origin}/puente/${child.bridge_link}` : (demo ? `${origin}/puente/demo` : null);
        if (url) {
            navigator.clipboard?.writeText(url).catch(() => { /* denied: toast still guides */ });
            toast('success', th.linkCopied);
            return;
        }
        // No token yet: open the modal (which mints + offers a Copy button on a
        // fresh gesture) rather than claim a copy that did not happen.
        openLinkedAdults(child);
    };

    // Modal: the adults who created their bridge via this link + Copy + Revoke.
    const openLinkedAdults = async (child: HubChildF) => {
        setLinked({ child, adults: demo ? [] : null });
        if (demo) return;
        const res = await postAction({ action: 'linked-adults', child_id: child.child_id });
        if (!res || !res.ok) { setLinked({ child, adults: [] }); return; }
        const j = await res.json().catch(() => ({ adults: [] }));
        setLinked({ child, adults: (j.adults as LinkedAdult[]) ?? [] });
    };

    const copyBridgeLinkFromModal = async (child: HubChildF) => {
        let url = child.bridge_link ? `${origin}/puente/${child.bridge_link}` : (demo ? `${origin}/puente/demo` : null);
        if (!url && !demo) {
            const res = await postAction({ action: 'share-bridge-link', child_id: child.child_id });
            const j = res && res.ok ? await res.json().catch(() => ({})) : {};
            if (!j?.url) { toast('error', th.genericError); return; }
            url = j.url as string;
            onRefresh?.();
        }
        if (!url) return;
        try { await navigator.clipboard?.writeText(url); } catch { /* denied */ }
        toast('success', th.linkCopied);
    };

    const revokeBridgeLink = async (child: HubChildF) => {
        if (demo) { toast('info', th.comingSoon); return; }
        if (typeof window !== 'undefined' && !window.confirm(th.revokeConfirm)) return;
        const res = await postAction({ action: 'revoke-bridge-link', child_id: child.child_id });
        if (res && res.ok) { toast('success', th.linkRevoked); setLinked(null); onRefresh?.(); }
        else if (res) { toast('error', th.genericError); }
    };

    const resendPlayLink = async (linkId: string) => {
        const res = await postAction({ action: 'resend-play-link', link_id: linkId });
        if (res && res.ok) toast('success', th.linkResent);
    };

    const createMyBridge = async () => {
        const res = await postAction({ action: 'start-adult-profile' });
        if (res) { const j = await res.json().catch(() => ({})); toast('info', j?.pending ? th.comingSoon : th.comingSoon); }
    };

    return (
        <div className="min-h-screen bg-argo-neutral">
            <div className="max-w-[760px] mx-auto px-5 py-10 pb-24">
                {/* Header */}
                <div className="flex items-center justify-between gap-4 mb-1.5">
                    <Link to="/" className="text-[20px] tracking-tight text-argo-navy">
                        <span className="font-extrabold">Argo</span><span className="font-light">One</span><span className="font-light text-[0.62em] align-super opacity-70">®</span>
                    </Link>
                </div>
                <h1 className="text-[26px] font-bold text-argo-navy tracking-tight mt-4 mb-1 text-balance">{g.t}</h1>
                <p className="text-sm text-argo-grey mb-6">{g.s}</p>

                {/* Kids */}
                {data.children.length > 0 && (
                    <>
                        <div className="text-[10.5px] tracking-[0.12em] uppercase text-argo-light font-bold mt-7 mb-3">{kidsLabel}</div>
                        <div className="space-y-3.5">
                            {data.children.map(child => (
                                <HubChildCard
                                    key={child.key}
                                    child={child}
                                    th={th}
                                    onCopy={copyPlayLink}
                                    copiedSlug={copiedSlug}
                                    onResend={resendPlayLink}
                                    onShareLink={shareBridgeLink}
                                    onLinkedAdults={openLinkedAdults}
                                    onUpdate={startReplay}
                                    onAddBridge={refreshBridge}
                                    onCreateBridge={createMyBridge}
                                    onViewBridge={() => toast('info', th.comingSoon)}
                                />
                            ))}
                        </div>
                    </>
                )}

                {/* Other child */}
                {showOther && (
                    <>
                        <div className="text-[10.5px] tracking-[0.12em] uppercase text-argo-light font-bold mt-8 mb-3">{th.otherTitle}</div>
                        <div className="bg-white rounded-[14px] shadow-argo border border-argo-border px-5 py-5">
                            <p className="text-[15px] font-bold text-argo-navy">{th.otherTitle}</p>
                            <p className="text-[13px] text-argo-secondary mt-1 leading-relaxed">{th.otherDesc}</p>
                            <div className="mt-3">
                                <button disabled={busy} onClick={() => startReplay(null)} className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-semibold bg-white border border-argo-border text-argo-navy hover:bg-argo-neutral transition-colors disabled:opacity-50">
                                    {th.otherCta} <span className="text-[11.5px] font-bold opacity-80">USD 12.99</span>
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* Academy — gated by scale */}
                {data.can_upgrade_academy && (
                    <>
                        <div className="text-[10.5px] tracking-[0.12em] uppercase text-argo-light font-bold mt-8 mb-3">{th.academyEyebrow}</div>
                        <div className="rounded-[14px] border border-argo-violet-500/20 bg-argo-violet-500/[0.06] px-5 py-5">
                            <div className="flex items-center justify-between gap-4 flex-wrap">
                                <div className="flex-1 min-w-[220px]">
                                    <p className="text-[15px] font-bold text-argo-navy">{th.academyLead} <Wordmark rest="Academy®" /></p>
                                    <p className="text-[13px] text-argo-secondary mt-1 leading-relaxed">{th.academyDesc}</p>
                                </div>
                                <a href="mailto:hola@argomethod.com?subject=ArgoAcademy" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-semibold bg-argo-violet-500 text-white hover:bg-argo-violet-600 transition-colors">
                                    {th.academyCta} <Wordmark rest="Academy®" />
                                </a>
                            </div>
                        </div>
                    </>
                )}

                {/* Footer */}
                <p className="text-center text-[11.5px] text-argo-light mt-10 leading-relaxed">
                    {th.footerRefresh}<br />
                    {th.footerPrices}<br />
                    {(() => {
                        const first = data.children.find(c => c.is_responsible && c.deletion_id);
                        return first ? <a className="text-argo-violet-500 hover:underline" href={`/eliminar/${first.deletion_id}`}>{th.manageData}</a> : <span>{th.manageData}</span>;
                    })()}
                    {' · '}
                    <Link to="/terms" className="text-argo-violet-500 hover:underline">{th.terms}</Link>
                </p>
            </div>

            {/* Linked-adults modal (frozen model §4): the adults who created their
                bridge via this link + copy the link + revoke (rotate). */}
            <AnimatePresence>
                {linked && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setLinked(null)}>
                        <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                            <div className="flex items-start justify-between gap-3 mb-0.5">
                                <div>
                                    <h3 className="text-base font-bold text-argo-navy tracking-tight">{th.linkedTitle(linked.child.name || th.kidsOne)}</h3>
                                    <p className="text-[12px] text-argo-grey mt-0.5">{th.linkedSub}</p>
                                </div>
                                <button onClick={() => setLinked(null)} aria-label={th.close} className="text-argo-light hover:text-argo-grey transition-colors -mr-1"><X size={17} /></button>
                            </div>

                            <div className="mt-4 min-h-[48px]">
                                {linked.adults === null ? (
                                    <p className="text-[13px] text-argo-grey py-3">…</p>
                                ) : linked.adults.length === 0 ? (
                                    <p className="text-[13px] text-argo-grey py-3">{th.linkedEmpty}</p>
                                ) : (
                                    linked.adults.map(a => (
                                        <div key={a.email} className="flex items-center justify-between gap-3 py-2.5 border-b border-argo-border last:border-0">
                                            <div className="min-w-0">
                                                {a.name && <p className="text-[13.5px] font-semibold text-argo-navy truncate">{a.name}</p>}
                                                <p className="text-[12px] text-argo-grey truncate">{a.email}</p>
                                            </div>
                                            <span className="text-[11px] text-argo-light whitespace-nowrap">{th.linkedCreated}</span>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-argo-border">
                                <button onClick={() => copyBridgeLinkFromModal(linked.child)} className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-argo-violet-500 hover:text-argo-violet-600 transition-colors"><Copy size={13} /> {th.shareBridgeLink}</button>
                                <button onClick={() => revokeBridgeLink(linked.child)} className="text-[12px] font-semibold text-red-600 hover:text-red-700 transition-colors">{th.revokeLink}</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const HubV2: React.FC<{ data: HubData; token: string; lang: HubLang; demo: boolean; onRefresh?: () => void }> = (props) => (
    <ToastProvider><HubV2Inner {...props} /></ToastProvider>
);

/* DEV-only sample hub payloads: /one/panel?demo=padre|familia|comprador|invitada */
function buildDemoHub(state: string): HubData {
    const rep = (eje: string, label: string, motor: string, stale = false): HubReportF => ({
        perfilamiento_id: `demo-${eje}`, status: 'ready', ready: true, share_token: 'demo', archetype_label: label, eje, motor_line: motor, expires_at: null, is_stale: stale,
    });
    const juan: HubChildF = {
        key: 'c1', child_id: 'c1', perfilamiento_id: 'demo-D', name: 'Juan', age: 10, sport: 'fútbol',
        report: rep('D', 'Impulsor con veta Conector', 'ritmo dinámico. Arranca rápido y necesita mover el juego para engancharse.'),
        is_buyer: true, is_responsible: true, is_invited: false,
        my_bridge: { status: 'ready', ready: true, expires_at: null, is_stale: false }, play_link: null, deletion_id: 'del1', comp_token: null, bridge_token: 'demo',
        bridge_link: 'demo-token', linked_adults: 2,
    };
    if (state === 'familia') {
        const sofia: HubChildF = {
            key: 'c2', child_id: 'c2', perfilamiento_id: 'demo-S', name: 'Sofía', age: 13, sport: 'hockey',
            report: rep('S', 'Sostenedor con veta Conector', 'ritmo sereno. Procesa con calma antes de moverse.', true),
            is_buyer: true, is_responsible: true, is_invited: false, my_bridge: null, play_link: null, deletion_id: 'del2', comp_token: 'demo-comp', bridge_token: null,
            bridge_link: 'demo-token-2', linked_adults: 0,
        };
        const mateo: HubChildF = {
            key: 'c3', child_id: 'c3', perfilamiento_id: 'demo-M', name: 'Mateo', age: 8, sport: 'básquet',
            report: { perfilamiento_id: 'demo-M', status: 'held', ready: false, share_token: null, archetype_label: null, eje: null, motor_line: null, expires_at: null, is_stale: false },
            is_buyer: true, is_responsible: true, is_invited: false, my_bridge: null, play_link: null, deletion_id: 'del3', comp_token: null, bridge_token: null,
            bridge_link: 'demo-token-3', linked_adults: 0,
        };
        return { version: 2, email: 'tu@email.com', lang: 'es', role: 'family', children: [juan, sofia, mateo], available_slots: 0, can_upgrade_academy: true };
    }
    if (state === 'comprador') {
        const pending: HubChildF = {
            key: 'link:l1', child_id: null, perfilamiento_id: null, name: null, age: null, sport: null, report: null,
            is_buyer: true, is_responsible: false, is_invited: false, my_bridge: null, play_link: { slug: 'demo-slug', status: 'available' }, deletion_id: null, comp_token: null, bridge_token: null,
        };
        return { version: 2, email: 'tu@email.com', lang: 'es', role: 'buyer_no_child_yet', children: [pending], available_slots: 1, can_upgrade_academy: false };
    }
    if (state === 'invitada') {
        // Mirrors the real payload post entitlement cut: a bridge-only child
        // carries NO report (no share_token, no archetype, no motor).
        const invited: HubChildF = { ...juan, report: null, is_buyer: false, is_responsible: false, is_invited: true, deletion_id: null };
        return { version: 2, email: 'tu@email.com', lang: 'es', role: 'invited_adult', children: [invited], available_slots: 0, can_upgrade_academy: false };
    }
    // padre (one adult, one child)
    return { version: 2, email: 'tu@email.com', lang: 'es', role: 'one_and_done', children: [juan], available_slots: 0, can_upgrade_academy: false };
}

/* ── Component ─────────────────────────────────────────────────────────────── */

export const OnePanel: React.FC = () => {
    const { lang } = useLang();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') ?? '';
    const t = T[lang as keyof typeof T] ?? T.es;

    const [data, setData] = useState<PanelData | HubData | null>(null);
    const [status, setStatus] = useState<'loading' | 'ok' | 'not_found' | 'not_paid' | 'confirming' | 'need_email' | 'access_sent'>('loading');
    const [modal, setModal] = useState<string | null>(null); // link_id for modal
    const [modalEmail, setModalEmail] = useState('');
    const [modalName, setModalName] = useState('');
    const [modalSport, setModalSport] = useState('');
    const [modalSportCustom, setModalSportCustom] = useState('');
    const [sending, setSending] = useState(false);
    const [accessEmail, setAccessEmail] = useState('');
    const [requesting, setRequesting] = useState(false);

    const lastSport = t.sports[t.sports.length - 1];
    const sportFinal = modalSport === lastSport ? modalSportCustom.trim() : modalSport;
    const [copied, setCopied] = useState<string | null>(null);
    const pollRef = React.useRef<ReturnType<typeof setInterval>>();

    const isSuccess = searchParams.get('success') === '1';

    const fetchData = useCallback(async () => {
        // DEV preview: /one/panel?demo=<state> on localhost renders a sample hub v2
        // (padre|familia|comprador|invitada), or ?demo=1 the legacy v1 panel. The
        // /api is not available under Vite. No-op in production.
        const demoParam = import.meta.env.DEV ? new URLSearchParams(window.location.search).get('demo') : null;
        if (demoParam && demoParam !== '1') {
            setData(buildDemoHub(demoParam));
            setStatus('ok');
            return;
        }
        if (import.meta.env.DEV && demoParam === '1') {
            setData({
                purchase: { email: 'marianonoceti@gmail.com', pack_size: 3, paid_at: new Date().toISOString() },
                links: [
                    { id: '1', slug: 'abc123', status: 'completed', recipient_email: 'juan@ejemplo.com', child_name: 'Lucas', sport: 'Fútbol', completed_at: new Date().toISOString(), session_id: 's1' },
                    { id: '2', slug: 'def456', status: 'sent', recipient_email: 'ana@ejemplo.com', child_name: 'Sofía', sport: 'Hockey', completed_at: null, session_id: null },
                    { id: '3', slug: 'ghi789', status: 'available', recipient_email: null, child_name: null, sport: null, completed_at: null, session_id: null },
                ],
                summary: { total: 3, completed: 1, pending: 1, available: 1 },
            });
            setStatus('ok');
            return;
        }
        if (!token) { setStatus('need_email'); return; }
        try {
            const res = await fetch(`/api/one-panel?token=${token}`);
            if (res.ok) {
                setData(await res.json());
                setStatus('ok');
                // Stop polling if active
                if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = undefined; }
            } else if (res.status === 403) {
                // If coming from successful checkout, poll for webhook
                if (isSuccess && status !== 'ok') {
                    setStatus('confirming');
                } else {
                    setStatus('not_paid');
                }
            } else {
                setStatus('not_found');
            }
        } catch { setStatus('not_found'); }
    }, [token, isSuccess, status]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Poll when confirming payment (waiting for webhook)
    useEffect(() => {
        if (status === 'confirming' && !pollRef.current) {
            let attempts = 0;
            pollRef.current = setInterval(async () => {
                attempts++;
                try {
                    const res = await fetch(`/api/one-panel?token=${token}`);
                    if (res.ok) {
                        setData(await res.json());
                        setStatus('ok');
                        clearInterval(pollRef.current!);
                        pollRef.current = undefined;
                    } else if (attempts >= 15) { // 30 seconds max
                        setStatus('not_paid');
                        clearInterval(pollRef.current!);
                        pollRef.current = undefined;
                    }
                } catch { /* keep polling */ }
            }, 2000);
        }
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [status, token]);

    const requestAccess = async () => {
        if (!accessEmail.trim() || requesting) return;
        setRequesting(true);
        try {
            await fetch('/api/one-panel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'request-access', email: accessEmail.trim() }),
            });
        } catch { /* ignore — we always show the same confirmation */ }
        setRequesting(false);
        setStatus('access_sent');
    };

    const handleGenerate = async () => {
        if (!modal || !modalEmail || !sportFinal) return;
        setSending(true);
        await fetch(`/api/one-panel?token=${token}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'generate-link', link_id: modal, recipient_email: modalEmail, child_name: modalName, sport: sportFinal }),
        });
        setSending(false);
        setModal(null);
        setModalEmail('');
        setModalName('');
        setModalSport('');
        setModalSportCustom('');
        fetchData();
    };

    const handleCopy = (slug: string) => {
        const url = `${window.location.origin}/one/${slug}`;
        navigator.clipboard.writeText(url);
        setCopied(slug);
        setTimeout(() => setCopied(null), 2000);
    };

    if (status === 'loading' || status === 'confirming') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-argo-neutral">
                <div className="flex items-center justify-center gap-1.5 mb-8">
                    <span style={{ fontSize: '18px', letterSpacing: '-0.02em', color: '#1D1D1F' }}>
                        <span style={{ fontWeight: 800 }}>Argo</span><span style={{ fontWeight: 300 }}>One®</span>
                    </span>
                </div>
                <div className="w-6 h-6 rounded-full border-2 border-argo-violet-500 border-t-transparent animate-spin mb-4" />
                {status === 'confirming' && (
                    <div className="text-center" style={{ maxWidth: '320px' }}>
                        <p className="text-base font-semibold text-argo-navy mb-2">
                            {lang === 'en' ? 'We received your payment' : lang === 'pt' ? 'Recebemos seu pagamento' : 'Recibimos tu pago'}
                        </p>
                        <p className="text-sm text-argo-grey leading-relaxed">
                            {lang === 'en'
                                ? 'We are confirming your purchase. When it\'s ready, we\'ll send you an email and this page will update automatically.'
                                : lang === 'pt'
                                    ? 'Estamos confirmando sua compra. Quando estiver pronto, enviaremos um email e esta página será atualizada automaticamente.'
                                    : 'Estamos confirmando tu compra. Cuando esté listo, te enviaremos un email y esta página se actualizará automáticamente.'}
                        </p>
                    </div>
                )}
            </div>
        );
    }

    if (status === 'need_email' || status === 'access_sent') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-argo-neutral">
                <div className="w-full max-w-sm">
                    <div className="flex items-center justify-center gap-1.5 mb-8">
                        <span style={{ fontSize: '18px', letterSpacing: '-0.02em', color: '#1D1D1F' }}>
                            <span style={{ fontWeight: 800 }}>Argo</span><span style={{ fontWeight: 300 }}>One®</span>
                        </span>
                    </div>
                    {status === 'access_sent' ? (
                        <div className="text-center">
                            <h2 className="text-xl font-light text-argo-navy mb-3">{t.accessSentTitle}</h2>
                            <p className="text-sm text-argo-grey">{t.accessSentDesc}</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-[14px] shadow-argo px-6 py-7">
                            <h2 className="text-lg font-semibold text-argo-navy mb-1.5 text-center">{t.accessTitle}</h2>
                            <p className="text-[13px] text-argo-grey mb-5 text-center leading-relaxed">{t.accessDesc}</p>
                            <input
                                type="email"
                                placeholder={t.accessEmailPlaceholder}
                                value={accessEmail}
                                onChange={e => setAccessEmail(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && requestAccess()}
                                className="w-full px-4 py-3 rounded-xl border border-argo-border text-sm text-argo-navy placeholder:text-argo-light focus:outline-none focus:ring-2 focus:ring-argo-violet-300 mb-3"
                            />
                            <button
                                onClick={requestAccess}
                                disabled={requesting || !accessEmail.trim()}
                                className="w-full py-3 rounded-xl text-sm font-semibold bg-argo-violet-500 text-white hover:bg-argo-violet-600 transition-colors disabled:opacity-50"
                            >
                                {requesting ? t.accessSending : t.accessSend}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (status === 'not_found' || status === 'not_paid') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-argo-neutral">
                <div style={{ maxWidth: '360px' }}>
                    <div className="flex items-center justify-center gap-1.5 mb-8">
                        <span style={{ fontSize: '18px', letterSpacing: '-0.02em', color: '#1D1D1F' }}>
                            <span style={{ fontWeight: 800 }}>Argo</span><span style={{ fontWeight: 300 }}>One®</span>
                        </span>
                    </div>
                    <h2 className="text-xl font-light text-argo-navy mb-3">{status === 'not_found' ? t.notFound : t.notPaid}</h2>
                    <p className="text-sm text-argo-grey">{status === 'not_found' ? t.notFoundDesc : t.notPaidDesc}</p>
                </div>
            </div>
        );
    }

    // Hub v2: branch by payload shape (backward-compat — old v1 packs fall through
    // to the legacy panel below when the backend flag is off).
    if (data && (data as HubData).version === 2) {
        const demoParam = import.meta.env.DEV ? new URLSearchParams(window.location.search).get('demo') : null;
        return <HubV2 data={data as HubData} token={token} lang={lang as HubLang} demo={!!demoParam && demoParam !== '1'} onRefresh={fetchData} />;
    }

    const { purchase, links, summary } = data as PanelData;
    const completedPct = (summary.completed / summary.total) * 100;

    const statusColor = (s: string) => s === 'completed' ? '#22C55E' : s === 'pending' || s === 'sent' ? '#F59E0B' : '#D2D2D7';

    return (
        <div className="min-h-screen bg-argo-neutral">
            <div className="max-w-[560px] mx-auto px-5 py-12">

                {/* Logo */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-1.5">
                        <span style={{ fontSize: '17px', letterSpacing: '-0.02em', color: '#1D1D1F' }}>
                            <span style={{ fontWeight: 800 }}>Argo</span><span style={{ fontWeight: 300 }}>One®</span>
                        </span>
                    </Link>
                </div>

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-[22px] font-light text-argo-navy tracking-tight mb-1.5">{t.title}</h1>
                    <p className="text-[13px] text-argo-grey">
                        <span className="font-semibold text-argo-secondary">{purchase.email}</span> · {t.pack(purchase.pack_size)}
                    </p>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-2.5 mb-6 px-1">
                    <div className="flex-1 h-1 rounded-full bg-argo-border overflow-hidden">
                        <div className="h-full rounded-full bg-argo-violet-500 transition-all" style={{ width: `${completedPct}%` }} />
                    </div>
                    <span className="text-[11px] font-semibold text-argo-grey whitespace-nowrap">{t.used(summary.completed, summary.total)}</span>
                </div>

                {/* Slots */}
                <div className="space-y-3 mb-8">
                    {links.map(link => (
                        <motion.div
                            key={link.id}
                            layout
                            className={`bg-white rounded-[14px] shadow-argo px-5 py-4 flex items-center gap-4 ${link.status === 'completed' ? 'opacity-80' : ''}`}
                        >
                            <div className="w-10 h-10 rounded-[10px] border flex items-center justify-center flex-shrink-0"
                                 style={{ borderColor: `${statusColor(link.status)}40`, background: `${statusColor(link.status)}10` }}>
                                <div className="w-2.5 h-2.5 rounded-full" style={{ background: statusColor(link.status) }} />
                            </div>

                            <div className="flex-1 min-w-0">
                                {link.status === 'completed' && (
                                    <>
                                        <p className="text-sm font-semibold text-argo-navy truncate">{link.child_name || t.completed}</p>
                                        <p className="text-xs text-argo-grey">{link.sport ? `${link.sport} · ` : ''}{t.completed}{link.completed_at ? ` · ${new Date(link.completed_at).toLocaleDateString()}` : ''}</p>
                                    </>
                                )}
                                {(link.status === 'sent' || link.status === 'pending') && (
                                    <>
                                        <p className="text-sm font-semibold text-argo-navy">{link.child_name || t.sent}</p>
                                        <p className="text-xs text-argo-grey">{t.sentTo} <span className="text-argo-violet-500">{link.recipient_email}</span> · {link.sport ? `${link.sport} · ` : ''}{t.pending}</p>
                                    </>
                                )}
                                {link.status === 'available' && (
                                    <>
                                        <p className="text-sm font-semibold text-argo-navy">{t.available}</p>
                                        <p className="text-xs text-argo-grey">{t.availableDesc}</p>
                                    </>
                                )}
                            </div>

                            <div className="flex-shrink-0">
                                {link.status === 'completed' && link.session_id && (link.report_status === 'held' || link.report_status === 'pending') && (
                                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-amber-200 bg-amber-50 text-amber-700">
                                        {lang === 'en' ? 'Preparing…' : lang === 'pt' ? 'Preparando…' : 'Preparando…'}
                                    </span>
                                )}
                                {link.status === 'completed' && link.session_id && link.report_status !== 'held' && link.report_status !== 'pending' && (
                                    <Link
                                        to={`/report/${link.session_id}?token=${link.report_token ?? ''}`}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                                    >
                                        <ExternalLink size={12} /> {t.viewReport}
                                    </Link>
                                )}
                                {(link.status === 'sent' || link.status === 'pending') && (
                                    <button
                                        onClick={() => handleCopy(link.slug)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-argo-border text-argo-secondary hover:border-argo-violet-300 transition-colors"
                                    >
                                        {copied === link.slug ? <><Check size={12} /> {t.copied}</> : <><Copy size={12} /> {t.copyLink}</>}
                                    </button>
                                )}
                                {link.status === 'available' && (
                                    <button
                                        onClick={() => { setModal(link.id); setModalEmail(''); setModalName(''); setModalSport(''); setModalSportCustom(''); }}
                                        className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-argo-violet-500 text-white hover:bg-argo-violet-600 transition-colors"
                                    >
                                        {t.generateLink}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Buy more reports */}
                <div className="text-center mb-8">
                    <Link
                        to="/one"
                        className="inline-flex items-center px-5 py-2.5 rounded-lg text-[13px] font-semibold border border-argo-border text-argo-secondary hover:border-argo-violet-300 transition-colors"
                    >
                        {t.buyMore}
                    </Link>
                </div>

                {/* How it works */}
                <div className="bg-white rounded-[14px] shadow-argo px-5 py-5 mb-8">
                    <p className="text-[13px] font-semibold text-argo-navy mb-3">{t.howTitle}</p>
                    {[t.how1, t.how2, t.how3, t.how4].map((step, i) => (
                        <p key={i} className="text-xs text-argo-grey leading-relaxed mb-2 last:mb-0">
                            <strong className="text-argo-secondary">{i + 1}.</strong> {step}
                        </p>
                    ))}
                </div>

                {/* Footer */}
                <div className="text-center pt-4 border-t border-argo-border">
                    <p className="text-[11px] text-argo-light">
                        <Link to="/privacy" className="underline hover:text-argo-grey transition-colors">Privacy</Link>
                        {' · '}
                        <Link to="/terms" className="underline hover:text-argo-grey transition-colors">Terms</Link>
                        {' · '}
                        <a href="mailto:hola@argomethod.com" className="underline hover:text-argo-grey transition-colors">Help</a>
                    </p>
                </div>
            </div>

            {/* Generate link modal */}
            <AnimatePresence>
                {modal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
                        onClick={() => setModal(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-2xl p-7 w-full max-w-sm shadow-xl"
                        >
                            <div className="flex items-start justify-between mb-1">
                                <h3 className="text-base font-semibold text-argo-navy">{t.modalTitle}</h3>
                                <button onClick={() => setModal(null)} className="text-argo-light hover:text-argo-grey transition-colors -mr-1">
                                    <X size={18} />
                                </button>
                            </div>
                            <p className="text-[13px] text-argo-grey mb-5">{t.modalDesc}</p>
                            <input
                                type="email"
                                placeholder={t.emailPlaceholder}
                                value={modalEmail}
                                onChange={e => setModalEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-argo-border text-sm text-argo-navy placeholder:text-argo-light focus:outline-none focus:ring-2 focus:ring-argo-violet-300 mb-3"
                            />
                            <input
                                type="text"
                                placeholder={t.namePlaceholder}
                                value={modalName}
                                onChange={e => setModalName(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-argo-border text-sm text-argo-navy placeholder:text-argo-light focus:outline-none focus:ring-2 focus:ring-argo-violet-300 mb-3"
                            />
                            <select
                                value={modalSport}
                                onChange={e => setModalSport(e.target.value)}
                                className={`w-full px-4 py-3 rounded-xl border border-argo-border text-sm focus:outline-none focus:ring-2 focus:ring-argo-violet-300 ${modalSport ? 'text-argo-navy' : 'text-argo-light'} ${modalSport === lastSport ? 'mb-3' : 'mb-5'}`}
                            >
                                <option value="">{t.sportSelect}</option>
                                {t.sports.map(d => <option key={d} value={d} className="text-argo-navy">{d}</option>)}
                            </select>
                            {modalSport === lastSport && (
                                <input
                                    type="text"
                                    placeholder={t.sportOtherPlaceholder}
                                    value={modalSportCustom}
                                    onChange={e => setModalSportCustom(e.target.value)}
                                    autoFocus
                                    className="w-full px-4 py-3 rounded-xl border border-argo-border text-sm text-argo-navy placeholder:text-argo-light focus:outline-none focus:ring-2 focus:ring-argo-violet-300 mb-5"
                                />
                            )}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setModal(null)}
                                    className="flex-1 py-3 rounded-xl text-[13px] font-semibold border border-argo-border text-argo-grey hover:text-argo-navy transition-colors"
                                >
                                    {t.cancel}
                                </button>
                                <button
                                    onClick={handleGenerate}
                                    disabled={sending || !modalEmail || !sportFinal}
                                    className="flex-1 py-3 rounded-xl text-[13px] font-semibold bg-argo-violet-500 text-white hover:bg-argo-violet-600 transition-colors disabled:opacity-50"
                                >
                                    {sending ? '...' : t.generateAndSend}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
