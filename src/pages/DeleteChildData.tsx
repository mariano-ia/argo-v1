import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Button } from '../components/ui';
import { useLang } from '../context/LangContext';

/**
 * F9 — /eliminar/:deletion_id
 * Per-child data deletion via the high-entropy deletion_id from the responsible
 * adult's email footer / the hub. Distinct from /delete (the email-matched form).
 * Explicit two-step confirmation (D21 notice). Calls B15 (child-delete): GET to
 * preview, POST to delete. When CHILD_DELETE_ENABLED is off the POST is a dry-run
 * and reports it as such.
 */

const T = {
    es: {
        title: 'Eliminar datos',
        loading: 'Cargando…',
        gone: 'No hay datos asociados a este link.',
        goneDesc: 'Es posible que ya se hayan eliminado.',
        confirmTitle: (n: string) => `Vas a eliminar los datos de ${n}`,
        body: 'Se eliminan de forma permanente el perfil del niño, su informe y los puentes de todos los adultos hacia él. Tu registro de compra se conserva (sin datos del niño). Esta acción no se puede deshacer.',
        cta: 'Eliminar de forma permanente',
        cancel: 'No, conservar',
        deleting: 'Eliminando…',
        done: 'Datos eliminados',
        doneDesc: 'Se eliminaron los datos del niño. Gracias.',
        dryRun: 'Recibimos tu solicitud',
        dryRunDesc: 'Registramos tu pedido de eliminación. Lo procesamos y te confirmamos por email.',
        error: 'Algo salió mal. Intenta de nuevo.',
    },
    en: {
        title: 'Delete data',
        loading: 'Loading…',
        gone: 'There is no data linked to this link.',
        goneDesc: 'It may have already been deleted.',
        confirmTitle: (n: string) => `You are about to delete ${n}'s data`,
        body: "This permanently removes the child's profile, their report, and every adult's bridge toward them. Your purchase record is kept (without the child's data). This cannot be undone.",
        cta: 'Delete permanently',
        cancel: 'No, keep it',
        deleting: 'Deleting…',
        done: 'Data deleted',
        doneDesc: "The child's data has been deleted. Thank you.",
        dryRun: 'We received your request',
        dryRunDesc: 'We recorded your deletion request. We will process it and confirm by email.',
        error: 'Something went wrong. Try again.',
    },
    pt: {
        title: 'Excluir dados',
        loading: 'Carregando…',
        gone: 'Não há dados vinculados a este link.',
        goneDesc: 'É possível que já tenham sido excluídos.',
        confirmTitle: (n: string) => `Você vai excluir os dados de ${n}`,
        body: 'Isto remove de forma permanente o perfil da criança, seu relatório e as pontes de todos os adultos para ela. Seu registro de compra é mantido (sem dados da criança). Esta ação não pode ser desfeita.',
        cta: 'Excluir de forma permanente',
        cancel: 'Não, manter',
        deleting: 'Excluindo…',
        done: 'Dados excluídos',
        doneDesc: 'Os dados da criança foram excluídos. Obrigado.',
        dryRun: 'Recebemos sua solicitação',
        dryRunDesc: 'Registramos seu pedido de exclusão. Vamos processá-lo e confirmar por email.',
        error: 'Algo deu errado. Tente de novo.',
    },
};

export default function DeleteChildData() {
    const { deletion_id } = useParams<{ deletion_id: string }>();
    const { lang } = useLang();
    const t = T[(lang as keyof typeof T)] ?? T.es;
    const [status, setStatus] = useState<'loading' | 'confirm' | 'gone' | 'done' | 'dry_run'>('loading');
    const [childName, setChildName] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!deletion_id) { setStatus('gone'); return; }
        if (import.meta.env.DEV && deletion_id === 'demo') { setChildName('Juan'); setStatus('confirm'); return; }
        (async () => {
            try {
                const res = await fetch(`/api/child-delete?deletion_id=${encodeURIComponent(deletion_id)}`);
                const j = await res.json();
                if (j.ok && j.exists) { setChildName(j.child_name ?? null); setStatus('confirm'); }
                else setStatus('gone');
            } catch { setStatus('gone'); }
        })();
    }, [deletion_id]);

    const del = async () => {
        if (!deletion_id || busy) return;
        setBusy(true); setError('');
        try {
            const res = await fetch('/api/child-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deletion_id }),
            });
            const j = await res.json();
            if (!res.ok || !j.ok) { setError(t.error); setBusy(false); return; }
            setStatus(j.dry_run ? 'dry_run' : 'done');
        } catch { setError(t.error); setBusy(false); }
    };

    const name = childName || (lang === 'en' ? 'the child' : lang === 'pt' ? 'a criança' : 'el niño');

    return (
        <div className="min-h-screen bg-argo-neutral py-12 px-4 flex items-center justify-center">
            <div className="w-full max-w-lg">
                {status === 'loading' && <p className="text-center text-sm text-argo-grey">{t.loading}</p>}

                {status === 'gone' && (
                    <Card padding="lg" className="text-center">
                        <h1 className="text-xl font-light text-argo-navy mb-2">{t.gone}</h1>
                        <p className="text-sm text-argo-grey">{t.goneDesc}</p>
                    </Card>
                )}

                {status === 'confirm' && (
                    <Card padding="lg">
                        <p className="text-xs uppercase tracking-widest text-argo-grey font-semibold mb-3">{t.title}</p>
                        <h1 className="text-2xl font-bold tracking-tight text-argo-navy">{t.confirmTitle(name)}</h1>
                        <p className="mt-4 text-argo-secondary text-sm leading-relaxed">{t.body}</p>
                        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
                        <div className="mt-6 flex flex-col sm:flex-row gap-3">
                            <Button variant="danger" size="lg" onClick={del} disabled={busy}>{busy ? t.deleting : t.cta}</Button>
                            <a href="/" className="inline-flex items-center justify-center px-5 py-3 rounded-lg text-sm font-semibold border border-argo-border text-argo-grey hover:text-argo-navy transition-colors">{t.cancel}</a>
                        </div>
                    </Card>
                )}

                {(status === 'done' || status === 'dry_run') && (
                    <Card padding="lg" className="text-center">
                        <h1 className="text-xl font-light text-argo-navy mb-2">{status === 'done' ? t.done : t.dryRun}</h1>
                        <p className="text-sm text-argo-grey">{status === 'done' ? t.doneDesc : t.dryRunDesc}</p>
                    </Card>
                )}
            </div>
        </div>
    );
}
