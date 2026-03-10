import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

interface AdultData {
    nombreAdulto: string;
    email: string;
    nombreNino: string;
    edad: number;
    deporte: string;
}

interface Props {
    onComplete: (data: AdultData) => void;
}

const DEPORTES = [
    'Fútbol', 'Hockey', 'Básquet', 'Rugby', 'Tenis', 'Natación',
    'Voley', 'Atletismo', 'Handball', 'Béisbol', 'Otro',
];

const CHECKS = [
    (nombre: string) => `Entiendo que Argo Method es una "fotografía del presente" y no una etiqueta permanente para ${nombre || 'mi hijo/a'}.`,
    (nombre: string) => `Acepto que el objetivo de este informe es priorizar el disfrute y el bienestar de ${nombre || 'mi hijo/a'} por sobre el rendimiento competitivo.`,
    () => 'Comprendo que esta herramienta no es un diagnóstico clínico ni médico.',
];

export const AdultRegistration: React.FC<Props> = ({ onComplete }) => {
    const [nombreAdulto, setNombreAdulto] = useState('');
    const [email, setEmail]               = useState('');
    const [nombreNino, setNombreNino]     = useState('');
    const [edad, setEdad]                 = useState(10);
    const [deporte, setDeporte]           = useState('');
    const [deporteCustom, setDeporteCustom] = useState('');
    const [checks, setChecks]             = useState([false, false, false]);

    const deporteFinal = deporte === 'Otro' ? deporteCustom : deporte;

    const isValid =
        nombreAdulto.trim() &&
        email.includes('@') &&
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
            email: email.trim(),
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
                    Registro
                </div>
                <h2 className="font-display text-2xl font-light text-[#1D1D1F]" style={{ letterSpacing: '-0.02em' }}>
                    Tus datos y los del deportista
                </h2>
                <p className="text-sm text-argo-grey mt-1.5 leading-relaxed">
                    Estos datos nos permiten personalizar el informe y enviártelo al email que indiques.
                    Completá todo antes de pasarle el dispositivo a {nombreNino || 'el/la deportista'}.
                </p>
            </div>

            {/* Form fields */}
            <div className="space-y-4">
                {[
                    { label: 'Tu nombre', value: nombreAdulto, setter: setNombreAdulto, placeholder: 'Ej: Laura García', type: 'text' },
                    { label: 'Tu email — recibirás el informe aquí', value: email, setter: setEmail, placeholder: 'correo@ejemplo.com', type: 'email' },
                    { label: 'Nombre del deportista', value: nombreNino, setter: setNombreNino, placeholder: 'Ej: Mateo', type: 'text' },
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
                        Edad del deportista — {edad} años
                    </label>
                    <input
                        type="range" min={5} max={18} value={edad}
                        onChange={e => setEdad(Number(e.target.value))}
                        className="w-full accent-argo-indigo"
                    />
                    <div className="flex justify-between text-[10px] text-argo-grey">
                        <span>5</span><span>11</span><span>18</span>
                    </div>
                </div>

                {/* Deporte */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-argo-grey uppercase tracking-widest">Deporte</label>
                    <div className="flex flex-wrap gap-2">
                        {DEPORTES.map(d => (
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
                    {deporte === 'Otro' && (
                        <input
                            type="text"
                            value={deporteCustom}
                            onChange={e => setDeporteCustom(e.target.value)}
                            placeholder="Escribí el deporte..."
                            className="w-full border border-[#D2D2D7] rounded-xl px-4 py-2.5 text-sm text-[#1D1D1F] focus:outline-none focus:border-[#1D1D1F] transition-colors"
                        />
                    )}
                </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-3">
                <div className="text-[10px] font-bold text-argo-grey uppercase tracking-widest">
                    Acuerdo filosófico
                </div>
                {CHECKS.map((textFn, i) => (
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
                Continuar <ChevronRight size={16} />
            </motion.button>
        </motion.div>
    );
};
