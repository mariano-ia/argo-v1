import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useLang } from '../../../context/LangContext';
import { getOdysseyT } from '../../../lib/odysseyTranslations';
import { requestConsent } from '../../../lib/consentStore';

interface AdultData {
    nombreAdulto: string;
    email: string;
    nombreNino: string;
    edad: number;
    deporte: string;
}

interface Props {
    userEmail?: string;
    flowType: 'auth' | 'tenant' | 'one';
    tenantId?: string;
    oneLinkId?: string;
    onComplete: (data: AdultData) => void;
    onConsentRequired: (args: { token: string; adultData: AdultData }) => void;
}

export const AdultRegistration: React.FC<Props> = ({
    userEmail = '',
    flowType,
    tenantId,
    oneLinkId,
    onComplete,
    onConsentRequired,
}) => {
    const { lang } = useLang();
    const ot = getOdysseyT(lang);

    const [nombreAdulto, setNombreAdulto]   = useState('');
    const [email, setEmail]                 = useState(userEmail);
    const [nombreNino, setNombreNino]       = useState('');
    const [edad, setEdad]                   = useState(10);
    const [deporte, setDeporte]             = useState('');
    const [deporteCustom, setDeporteCustom] = useState('');
    const [accepted, setAccepted]           = useState(false);
    const [submitting, setSubmitting]       = useState(false);
    const [submitError, setSubmitError]     = useState<string | null>(null);

    const lastSport = ot.sports[ot.sports.length - 1];
    const deporteFinal = deporte === lastSport ? deporteCustom : deporte;
    const emailFinal = userEmail || email.trim();

    const isValid =
        nombreAdulto.trim() &&
        emailFinal &&
        nombreNino.trim() &&
        deporteFinal.trim() &&
        accepted &&
        !submitting;

    const handleSubmit = async () => {
        if (!isValid) return;
        setSubmitError(null);

        const adultData: AdultData = {
            nombreAdulto: nombreAdulto.trim(),
            email: emailFinal,
            nombreNino: nombreNino.trim(),
            edad,
            deporte: deporteFinal.trim(),
        };

        if (edad < 13) {
            setSubmitting(true);
            const result = await requestConsent({
                adultData,
                flowType,
                tenantId,
                oneLinkId,
                lang,
            });
            setSubmitting(false);
            if (result.ok && result.token) {
                onConsentRequired({ token: result.token, adultData });
            } else {
                setSubmitError(result.error ?? 'unknown');
            }
        } else {
            onComplete(adultData);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 max-w-lg mx-auto"
        >
            <div>
                <div className="text-[10px] font-medium text-[#86868B] uppercase tracking-[0.2em] mb-1">
                    {ot.registration}
                </div>
                <h2 className="font-display text-2xl font-light text-[#1D1D1F]" style={{ letterSpacing: '-0.02em' }}>
                    {ot.registrationSub}
                </h2>
                <p className="text-sm text-argo-grey mt-1.5 leading-relaxed">
                    {userEmail
                        ? <>{ot.reportWillBeSentTo(userEmail)} {ot.fillDataBefore(nombreNino)}</>
                        : <>{ot.fillDataBefore(nombreNino)}</>
                    }
                </p>
            </div>

            {/* Form fields */}
            <div className="space-y-4">
                {[
                    { label: ot.yourName, value: nombreAdulto, setter: setNombreAdulto, placeholder: ot.yourNamePlaceholder, type: 'text' },
                    ...(!userEmail ? [{ label: ot.yourEmail, value: email, setter: setEmail, placeholder: ot.yourEmailPlaceholder, type: 'email' }] : []),
                    { label: ot.athleteName, value: nombreNino, setter: setNombreNino, placeholder: ot.athleteNamePlaceholder, type: 'text' },
                ].map(f => (
                    <div key={f.label} className="space-y-1.5">
                        <label className="text-[10px] font-bold text-argo-grey uppercase tracking-widest">
                            {f.label}
                        </label>
                        <input
                            type={f.type}
                            value={f.value}
                            onChange={e => f.setter(e.target.value)}
                            placeholder={f.placeholder}
                            className="w-full border border-[#D2D2D7] rounded-xl px-4 py-3 text-sm text-[#1D1D1F] focus:outline-none focus:border-[#1D1D1F] transition-colors"
                        />
                    </div>
                ))}

                {/* Edad */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-argo-grey uppercase tracking-widest">
                        {ot.athleteAge(edad)}
                    </label>
                    <input
                        type="range" min={8} max={16} value={edad}
                        onChange={e => setEdad(Number(e.target.value))}
                        className="w-full accent-argo-indigo"
                    />
                    <div className="flex justify-between text-[10px] text-argo-grey">
                        <span>8</span><span>12</span><span>16</span>
                    </div>
                </div>

                {/* Deporte */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-argo-grey uppercase tracking-widest">{ot.sport}</label>
                    <div className="flex flex-wrap gap-2">
                        {ot.sports.map(d => (
                            <button
                                key={d}
                                onClick={() => setDeporte(d)}
                                className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                                    deporte === d
                                        ? 'bg-[#1D1D1F] text-white border-[#1D1D1F]'
                                        : 'bg-white border-[#D2D2D7] text-[#424245] hover:border-[#1D1D1F]'
                                }`}
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                    {deporte === lastSport && (
                        <input
                            type="text"
                            value={deporteCustom}
                            onChange={e => setDeporteCustom(e.target.value)}
                            placeholder={ot.sportOtherPlaceholder}
                            className="w-full border border-[#D2D2D7] rounded-xl px-4 py-2.5 text-sm text-[#1D1D1F] focus:outline-none focus:border-[#1D1D1F] transition-colors"
                        />
                    )}
                </div>
            </div>

            {/* Consolidated consent block */}
            <div className="space-y-4">
                <div className="text-[10px] font-bold text-argo-grey uppercase tracking-widest">
                    {ot.philosophicalAgreement}
                </div>

                <div className="rounded-xl bg-[#F5F5F7] p-4 space-y-2">
                    {ot.consentBullets.map((textFn, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-argo-navy leading-relaxed">
                            <span className="text-argo-grey mt-0.5">•</span>
                            <span>{textFn(nombreNino)}</span>
                        </div>
                    ))}
                </div>

                <button
                    onClick={() => setAccepted(prev => !prev)}
                    className={`w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                        accepted
                            ? 'border-[#1D1D1F] bg-white'
                            : 'border-[#D2D2D7] bg-white hover:border-[#424245]'
                    }`}
                >
                    <div className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-all ${
                        accepted ? 'bg-[#1D1D1F] border-[#1D1D1F]' : 'border-[#D2D2D7]'
                    }`}>
                        {accepted && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                    </div>
                    <span className="text-sm text-argo-navy leading-relaxed">
                        {ot.consentCheck(nombreNino)}{' '}
                        <a href="/privacy" target="_blank" rel="noreferrer" className="underline text-argo-indigo">
                            {lang === 'en' ? 'Privacy Policy' : lang === 'pt' ? 'Política de Privacidade' : 'Política de Privacidad'}
                        </a>
                        {' · '}
                        <a href="/terms" target="_blank" rel="noreferrer" className="underline text-argo-indigo">
                            {lang === 'en' ? 'Terms' : lang === 'pt' ? 'Termos' : 'Términos'}
                        </a>
                    </span>
                </button>
            </div>

            {submitError && (
                <p className="text-sm text-red-500 text-center">
                    {lang === 'en'
                        ? 'Something went wrong. Please try again.'
                        : lang === 'pt'
                            ? 'Algo deu errado. Tente novamente.'
                            : 'Algo salió mal. Inténtalo de nuevo.'}
                </p>
            )}

            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={!isValid}
                className="w-full bg-[#1D1D1F] text-white font-medium py-4 rounded-xl flex items-center justify-center gap-2 text-sm disabled:opacity-40 transition-all"
            >
                {submitting
                    ? (lang === 'en' ? 'Sending...' : lang === 'pt' ? 'Enviando...' : 'Enviando...')
                    : <>{ot.continue} <ChevronRight size={16} /></>}
            </motion.button>
        </motion.div>
    );
};
