import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useLang } from '../../../context/LangContext';
import { getOdysseyT } from '../../../lib/odysseyTranslations';

interface AdultData {
    nombreAdulto: string;
    email: string;
    nombreNino: string;
    edad: number;
    deporte: string;
}

interface Props {
    userEmail?: string;
    onComplete: (data: AdultData) => void;
}

export const AdultRegistration: React.FC<Props> = ({ userEmail = '', onComplete }) => {
    const { lang } = useLang();
    const ot = getOdysseyT(lang);

    const [nombreAdulto, setNombreAdulto] = useState('');
    const [email, setEmail]               = useState(userEmail);
    const [nombreNino, setNombreNino]     = useState('');
    const [edad, setEdad]                 = useState(10);
    const [deporte, setDeporte]           = useState('');
    const [deporteCustom, setDeporteCustom] = useState('');
    const [checks, setChecks]             = useState([false, false, false]);

    const lastSport = ot.sports[ot.sports.length - 1]; // "Otro" / "Other" / "Outro"
    const deporteFinal = deporte === lastSport ? deporteCustom : deporte;
    const emailFinal = userEmail || email.trim();

    const isValid =
        nombreAdulto.trim() &&
        emailFinal &&
        nombreNino.trim() &&
        deporteFinal.trim() &&
        checks.every(Boolean);

    const toggleCheck = (i: number) => {
        setChecks(prev => prev.map((v, idx) => idx === i ? !v : v));
    };

    const handleSubmit = () => {
        if (!isValid) return;
        onComplete({
            nombreAdulto: nombreAdulto.trim(),
            email: emailFinal,
            nombreNino: nombreNino.trim(),
            edad,
            deporte: deporteFinal.trim(),
        });
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

            {/* Checkboxes */}
            <div className="space-y-3">
                <div className="text-[10px] font-bold text-argo-grey uppercase tracking-widest">
                    {ot.philosophicalAgreement}
                </div>
                {ot.checks.map((textFn, i) => (
                    <button
                        key={i}
                        onClick={() => toggleCheck(i)}
                        className={`w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                            checks[i]
                                ? 'border-[#1D1D1F] bg-[#F5F5F7]'
                                : 'border-[#D2D2D7] bg-white hover:border-[#424245]'
                        }`}
                    >
                        <div className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-all ${
                            checks[i] ? 'bg-[#1D1D1F] border-[#1D1D1F]' : 'border-[#D2D2D7]'
                        }`}>
                            {checks[i] && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </div>
                        <span className="text-sm text-argo-navy leading-relaxed">{textFn(nombreNino)}</span>
                    </button>
                ))}
            </div>

            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={!isValid}
                className="w-full bg-[#1D1D1F] text-white font-medium py-4 rounded-xl flex items-center justify-center gap-2 text-sm disabled:opacity-40 transition-all"
            >
                {ot.continue} <ChevronRight size={16} />
            </motion.button>
        </motion.div>
    );
};
