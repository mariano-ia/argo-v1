import { useState } from 'react';
import { Button, Input } from './ui';

type Lang = 'es' | 'en' | 'pt';

interface Props {
    lang?: Lang;
    onClose: () => void;
}

const COUNTRIES = [
    'Argentina', 'México', 'Colombia', 'Chile', 'Perú', 'Uruguay', 'Paraguay',
    'Bolivia', 'Ecuador', 'Venezuela', 'Brasil', 'España', 'Estados Unidos', 'Otro',
];
const SPORTS = ['Fútbol', 'Básquet', 'Vóley', 'Handball', 'Rugby', 'Hockey', 'Tenis', 'Natación', 'Otro'];

function copy(lang: Lang) {
    if (lang === 'en') return {
        title: 'Request an ArgoAcademy® demo', sub: 'Leave your details and our team will reach out to arrange a demo, no commitment.',
        name: 'Full name', email: 'Email', institution: 'Institution or team', whatsapp: 'WhatsApp', country: 'Country',
        sport: 'Sport (optional)', select: 'Select', consent: 'I accept being contacted about ArgoAcademy®.',
        submit: 'Send request', sending: 'Sending…', cancel: 'Cancel',
        okTitle: 'Request sent', okSub: 'Thanks. Our team will reach out very soon to arrange your demo.',
        errMissing: 'Please complete all required fields.', errEmail: 'Enter a valid email.', errConsent: 'Please accept to continue.', errGeneric: 'Something went wrong. Please try again.',
    };
    if (lang === 'pt') return {
        title: 'Solicitar demo do ArgoAcademy®', sub: 'Deixe seus dados e nossa equipe entra em contato para agendar uma demo, sem compromisso.',
        name: 'Nome completo', email: 'Email', institution: 'Instituição ou equipe', whatsapp: 'WhatsApp', country: 'País',
        sport: 'Esporte (opcional)', select: 'Selecione', consent: 'Aceito ser contatado sobre o ArgoAcademy®.',
        submit: 'Enviar solicitação', sending: 'Enviando…', cancel: 'Cancelar',
        okTitle: 'Solicitação enviada', okSub: 'Obrigado. Nossa equipe entra em contato em breve para agendar sua demo.',
        errMissing: 'Complete todos os campos obrigatórios.', errEmail: 'Digite um email válido.', errConsent: 'Aceite para continuar.', errGeneric: 'Algo deu errado. Tente novamente.',
    };
    return {
        title: 'Solicitar demo de ArgoAcademy®', sub: 'Déjanos tus datos y el equipo te contacta para coordinar una demo, sin compromiso.',
        name: 'Nombre y apellido', email: 'Email', institution: 'Institución o equipo', whatsapp: 'WhatsApp', country: 'País',
        sport: 'Deporte (opcional)', select: 'Selecciona', consent: 'Acepto que me contacten sobre ArgoAcademy®.',
        submit: 'Enviar solicitud', sending: 'Enviando…', cancel: 'Cancelar',
        okTitle: 'Solicitud enviada', okSub: 'Gracias. El equipo te contacta muy pronto para coordinar tu demo.',
        errMissing: 'Completa todos los campos obligatorios.', errEmail: 'Ingresa un email válido.', errConsent: 'Acepta para continuar.', errGeneric: 'Algo no anduvo. Intenta nuevamente.',
    };
}

const selectCls = 'w-full border border-argo-border rounded-lg px-4 py-2.5 text-sm text-argo-navy bg-white focus:outline-none focus:ring-2 focus:ring-argo-violet-500/30 focus:border-argo-violet-200 transition-colors';

export function DemoRequestModal({ lang = 'es', onClose }: Props) {
    const t = copy(lang);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [institution, setInstitution] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [country, setCountry] = useState('');
    const [sport, setSport] = useState('');
    const [consent, setConsent] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [done, setDone] = useState(false);

    const submit = async () => {
        setError('');
        if (!name.trim() || !email.trim() || !institution.trim() || !whatsapp.trim() || !country) {
            setError(t.errMissing); return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError(t.errEmail); return; }
        if (!consent) { setError(t.errConsent); return; }
        setSending(true);
        try {
            const res = await fetch('/api/demo-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, institution, whatsapp, country, sport, consent, lang, source: 'one_panel' }),
            });
            if (!res.ok) throw new Error('failed');
            setDone(true);
        } catch {
            setError(t.errGeneric);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-argo-navy/40 px-4 py-8 overflow-y-auto" onClick={onClose}>
            <div className="bg-white rounded-[14px] shadow-lg w-full max-w-md my-auto" onClick={e => e.stopPropagation()}>
                {done ? (
                    <div className="p-8 text-center">
                        <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-4">
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                        </div>
                        <h2 className="text-lg font-bold text-argo-navy">{t.okTitle}</h2>
                        <p className="mt-2 text-sm text-argo-secondary leading-relaxed">{t.okSub}</p>
                        <div className="mt-6"><Button variant="primary" onClick={onClose}>OK</Button></div>
                    </div>
                ) : (
                    <div className="p-6">
                        <div className="flex items-start justify-between mb-1">
                            <h2 className="text-lg font-bold text-argo-navy pr-4">{t.title}</h2>
                            <button onClick={onClose} aria-label="Cerrar" className="text-argo-grey hover:text-argo-navy transition-colors -mt-1">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                            </button>
                        </div>
                        <p className="text-sm text-argo-secondary leading-relaxed mb-5">{t.sub}</p>

                        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">{error}</p>}

                        <div className="space-y-3">
                            <Input label={t.name} value={name} onChange={e => setName(e.target.value)} autoComplete="name" />
                            <Input label={t.email} type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
                            <Input label={t.institution} value={institution} onChange={e => setInstitution(e.target.value)} autoComplete="organization" />
                            <div className="grid grid-cols-2 gap-3">
                                <Input label={t.whatsapp} type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="+54 11 ..." autoComplete="tel" />
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold text-argo-grey tracking-wide uppercase">{t.country}</label>
                                    <select className={selectCls} value={country} onChange={e => setCountry(e.target.value)}>
                                        <option value="" disabled>{t.select}</option>
                                        {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-argo-grey tracking-wide uppercase">{t.sport}</label>
                                <select className={selectCls} value={sport} onChange={e => setSport(e.target.value)}>
                                    <option value="">{t.select}</option>
                                    {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
                                <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-0.5 w-4 h-4 accent-argo-violet-500" />
                                <span className="text-[13px] text-argo-secondary leading-relaxed">{t.consent}</span>
                            </label>
                        </div>

                        <div className="flex items-center gap-2 mt-6">
                            <Button variant="primary" onClick={submit} disabled={sending}>{sending ? t.sending : t.submit}</Button>
                            <Button variant="ghost" onClick={onClose} disabled={sending}>{t.cancel}</Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
