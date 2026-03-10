import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { APP_VERSION } from '../lib/version';

// ─── Design tokens ───────────────────────────────────────────────────────────
// #1D1D1F  text-argo-navy
// #0071E3  text-argo-indigo  (CTA only)
// #86868B  text-argo-grey    (secondary)
// #D2D2D7  border-argo-border
// #F5F5F7  bg-argo-neutral

const fadeUp = (delay = 0) => ({
    initial:  { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6, ease: [0.25, 0, 0, 1], delay },
});

// ─── Twelve archetypes ───────────────────────────────────────────────────────
const ARCHETYPES = [
    { label: 'Impulsor Dinámico',      motor: 'Rápido', eje: 'D' },
    { label: 'Impulsor Decidido',      motor: 'Medio',  eje: 'D' },
    { label: 'Impulsor Persistente',   motor: 'Lento',  eje: 'D' },
    { label: 'Conector Dinámico',      motor: 'Rápido', eje: 'I' },
    { label: 'Conector Decidido',      motor: 'Medio',  eje: 'I' },
    { label: 'Conector Persistente',   motor: 'Lento',  eje: 'I' },
    { label: 'Sostenedor Dinámico',    motor: 'Rápido', eje: 'S' },
    { label: 'Sostenedor Decidido',    motor: 'Medio',  eje: 'S' },
    { label: 'Sostenedor Persistente', motor: 'Lento',  eje: 'S' },
    { label: 'Estratega Dinámico',     motor: 'Rápido', eje: 'C' },
    { label: 'Estratega Decidido',     motor: 'Medio',  eje: 'C' },
    { label: 'Estratega Persistente',  motor: 'Lento',  eje: 'C' },
];

const EJE_COLOR: Record<string, string> = {
    D: '#ef4444',
    I: '#f59e0b',
    S: '#22c55e',
    C: '#6366f1',
};

// ─── Components ──────────────────────────────────────────────────────────────

const Divider = () => (
    <div className="border-t border-argo-border" />
);

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <p style={{ fontWeight: 400, letterSpacing: '0.14em', fontSize: '10px' }}
       className="text-argo-grey uppercase mb-6">
        {children}
    </p>
);

// ─── Landing ─────────────────────────────────────────────────────────────────

export const Landing: React.FC = () => {
    const navigate = useNavigate();
    const { lang, setLang, t } = useLang();

    return (
        <div style={{ backgroundColor: '#ffffff', color: '#1D1D1F', fontFamily: 'Inter, sans-serif' }}
             className="min-h-screen">

            {/* ── NAV ── */}
            <nav style={{ borderBottom: '1px solid #D2D2D7' }}
                 className="sticky top-0 z-50 bg-white/95 backdrop-blur-md">
                <div className="max-w-5xl mx-auto px-6 h-12 flex items-center justify-between">
                    <span style={{ fontWeight: 500, fontSize: '13px', letterSpacing: '-0.01em' }}
                          className="text-argo-navy">
                        Argo Method
                    </span>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
                            style={{ fontWeight: 400, fontSize: '11px', letterSpacing: '0.06em' }}
                            className="text-argo-grey hover:text-argo-navy transition-colors uppercase"
                        >
                            {t.nav.lang}
                        </button>
                        <button
                            onClick={() => navigate('/app')}
                            style={{
                                fontWeight: 500, fontSize: '12px', letterSpacing: '-0.01em',
                                backgroundColor: '#0071E3', color: '#fff',
                                borderRadius: '8px', padding: '6px 16px',
                            }}
                            className="hover:opacity-90 transition-opacity"
                        >
                            {lang === 'es' ? 'Descubrí su sintonía' : 'Discover their synergy'}
                        </button>
                    </div>
                </div>
            </nav>

            {/* ── HERO ── */}
            <section className="max-w-5xl mx-auto px-6 pt-32 pb-36">
                <motion.div {...fadeUp(0)}>
                    <SectionLabel>
                        Método Argo · Cartografía de Sintonía Deportiva
                    </SectionLabel>
                </motion.div>

                <motion.h1
                    {...fadeUp(0.08)}
                    style={{
                        fontWeight: 300,
                        fontSize: 'clamp(2.8rem, 6vw, 5rem)',
                        lineHeight: 1.06,
                        letterSpacing: '-0.03em',
                        color: '#1D1D1F',
                        maxWidth: '820px',
                    }}
                    className="mb-8"
                >
                    {lang === 'es'
                        ? 'Cada niño tiene un lugar en la tripulación.'
                        : 'Every child has a place in the crew.'}
                </motion.h1>

                <motion.p
                    {...fadeUp(0.16)}
                    style={{ fontWeight: 400, fontSize: '17px', lineHeight: 1.65, color: '#424245', maxWidth: '560px' }}
                    className="mb-12"
                >
                    {lang === 'es'
                        ? 'Inspirado en la épica de los 50 Argonautas. Argo Method identifica la naturaleza de los niños para que el deporte sea disfrute, no fricción.'
                        : 'Inspired by the epic of the 50 Argonauts. Argo Method identifies the nature of children so sport becomes joy, not friction.'}
                </motion.p>

                <motion.div {...fadeUp(0.22)} className="flex items-center gap-5">
                    <button
                        onClick={() => navigate('/app')}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            backgroundColor: '#0071E3', color: '#fff',
                            fontWeight: 500, fontSize: '15px', letterSpacing: '-0.01em',
                            borderRadius: '8px', padding: '14px 28px',
                            border: 'none', cursor: 'pointer',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    >
                        {lang === 'es' ? 'Descubrí su sintonía' : 'Discover their synergy'}
                        <ArrowRight size={15} />
                    </button>
                    <span style={{ fontWeight: 400, fontSize: '12px', color: '#86868B' }}>
                        {lang === 'es' ? '10 min · Gratis · Sin cuenta' : '10 min · Free · No account'}
                    </span>
                </motion.div>
            </section>

            <Divider />

            {/* ── EL MITO ── */}
            <section className="max-w-5xl mx-auto px-6 py-32">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
                    <motion.div {...fadeUp(0)}>
                        <SectionLabel>
                            {lang === 'es' ? 'El origen · La nave Argos' : 'The origin · The Argo ship'}
                        </SectionLabel>
                        <h2 style={{ fontWeight: 300, fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', lineHeight: 1.1, letterSpacing: '-0.025em' }}>
                            {lang === 'es'
                                ? '50 especialistas. Una sola misión.'
                                : '50 specialists. One single mission.'}
                        </h2>
                    </motion.div>

                    <motion.div {...fadeUp(0.1)} className="flex flex-col justify-center">
                        <p style={{ fontWeight: 400, fontSize: '16px', lineHeight: 1.75, color: '#424245' }} className="mb-6">
                            {lang === 'es'
                                ? 'En la mitología griega, la nave Argos cumplió su misión no porque todos sus tripulantes fueran iguales, sino porque cada uno ocupó el rol exacto según su naturaleza. Orfeo ponía el ritmo. Hércules, la fuerza. Tifis, el rumbo.'
                                : 'In Greek mythology, the Argo succeeded not because all her crew were equal, but because each occupied the exact role suited to their nature. Orpheus set the rhythm. Hercules, the strength. Tiphys, the course.'}
                        </p>
                        <p style={{ fontWeight: 400, fontSize: '16px', lineHeight: 1.75, color: '#424245' }}>
                            {lang === 'es'
                                ? 'Aplicamos esta sabiduría milenaria a la ciencia del comportamiento deportivo. No existen niños incorrectos. Existen niños fuera de sintonía. Cuando un niño no disfruta del deporte, no es por falta de capacidad — es porque está ocupando un lugar en la tripulación que no le corresponde.'
                                : 'We apply this ancient wisdom to sports behavioral science. There are no wrong children. There are children out of sync. When a child does not enjoy sport, it is not from lack of ability — it is because they are filling a role in the crew that does not match their nature.'}
                        </p>
                    </motion.div>
                </div>
            </section>

            <Divider />

            {/* ── EL SISTEMA ── */}
            <section className="max-w-5xl mx-auto px-6 py-32">
                <motion.div {...fadeUp(0)} className="mb-20">
                    <SectionLabel>
                        {lang === 'es' ? 'El sistema · Tres dimensiones' : 'The system · Three dimensions'}
                    </SectionLabel>
                    <h2 style={{ fontWeight: 300, fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', lineHeight: 1.1, letterSpacing: '-0.025em', maxWidth: '560px' }}>
                        {lang === 'es'
                            ? 'Conducta + Motor = Sintonía.'
                            : 'Behavior + Engine = Synergy.'}
                    </h2>
                </motion.div>

                {/* Three pillars */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-px" style={{ border: '1px solid #D2D2D7', borderRadius: '12px', overflow: 'hidden' }}>
                    {/* Conducta */}
                    <motion.div {...fadeUp(0)} style={{ borderRight: '1px solid #D2D2D7' }} className="p-10 bg-white">
                        <p style={{ fontWeight: 600, fontSize: '10px', letterSpacing: '0.14em', color: '#86868B' }} className="uppercase mb-6">
                            01 · {lang === 'es' ? 'Conducta' : 'Behavior'}
                        </p>
                        <p style={{ fontWeight: 300, fontSize: '22px', letterSpacing: '-0.02em', lineHeight: 1.2 }} className="mb-8 text-argo-navy">
                            {lang === 'es' ? 'Cómo actúa' : 'How they act'}
                        </p>
                        <div className="space-y-3">
                            {[
                                { eje: 'D', label: lang === 'es' ? 'Impulsor · Domina, decide, compite' : 'Driver · Dominates, decides, competes' },
                                { eje: 'I', label: lang === 'es' ? 'Conector · Influye, entusiasma, comparte' : 'Connector · Influences, enthuses, shares' },
                                { eje: 'S', label: lang === 'es' ? 'Sostenedor · Estabiliza, cuida, persiste' : 'Sustainer · Stabilizes, cares, persists' },
                                { eje: 'C', label: lang === 'es' ? 'Estratega · Analiza, planifica, precisa' : 'Strategist · Analyzes, plans, refines' },
                            ].map(({ eje, label }) => (
                                <div key={eje} className="flex items-center gap-3">
                                    <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: EJE_COLOR[eje], flexShrink: 0 }} />
                                    <span style={{ fontWeight: 400, fontSize: '12px', color: '#424245', lineHeight: 1.4 }}>{label}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Motor */}
                    <motion.div {...fadeUp(0.08)} style={{ borderRight: '1px solid #D2D2D7' }} className="p-10 bg-white">
                        <p style={{ fontWeight: 600, fontSize: '10px', letterSpacing: '0.14em', color: '#86868B' }} className="uppercase mb-6">
                            02 · Motor
                        </p>
                        <p style={{ fontWeight: 300, fontSize: '22px', letterSpacing: '-0.02em', lineHeight: 1.2 }} className="mb-8 text-argo-navy">
                            {lang === 'es' ? 'A qué ritmo procesa' : 'At what rhythm they process'}
                        </p>
                        <div className="space-y-5">
                            {[
                                { label: lang === 'es' ? 'Rápido' : 'Fast', bars: 3, desc: lang === 'es' ? 'Responde en segundos, necesita acción' : 'Responds in seconds, needs action' },
                                { label: lang === 'es' ? 'Medio' : 'Mid',   bars: 2, desc: lang === 'es' ? 'Equilibrio entre impulso y reflexión' : 'Balances impulse with reflection' },
                                { label: lang === 'es' ? 'Lento' : 'Slow',  bars: 1, desc: lang === 'es' ? 'Procesa en profundidad antes de actuar' : 'Processes deeply before acting' },
                            ].map(({ label, bars, desc }) => (
                                <div key={label}>
                                    <div className="flex items-center gap-2 mb-1">
                                        {[1, 2, 3].map(b => (
                                            <div key={b} style={{
                                                height: 3, width: 20, borderRadius: 2,
                                                backgroundColor: b <= bars ? '#1D1D1F' : '#D2D2D7',
                                            }} />
                                        ))}
                                        <span style={{ fontWeight: 500, fontSize: '11px', color: '#1D1D1F', marginLeft: 4 }}>{label}</span>
                                    </div>
                                    <p style={{ fontWeight: 400, fontSize: '11px', color: '#86868B' }}>{desc}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Sintonía */}
                    <motion.div {...fadeUp(0.16)} className="p-10 bg-white">
                        <p style={{ fontWeight: 600, fontSize: '10px', letterSpacing: '0.14em', color: '#86868B' }} className="uppercase mb-6">
                            03 · {lang === 'es' ? 'Sintonía' : 'Synergy'}
                        </p>
                        <p style={{ fontWeight: 300, fontSize: '22px', letterSpacing: '-0.02em', lineHeight: 1.2 }} className="mb-8 text-argo-navy">
                            {lang === 'es' ? 'Su lugar en el equipo' : 'Their place in the team'}
                        </p>
                        <div style={{ padding: '16px', border: '1px solid #D2D2D7', borderRadius: '8px', marginBottom: '12px' }}>
                            <p style={{ fontWeight: 600, fontSize: '11px', color: '#1D1D1F', marginBottom: 4 }}>Impulsor Dinámico</p>
                            <p style={{ fontWeight: 400, fontSize: '11px', color: '#86868B', lineHeight: 1.5 }}>
                                {lang === 'es'
                                    ? 'Necesita reto constante y autonomía. Responde al feedback directo.'
                                    : 'Needs constant challenge and autonomy. Responds to direct feedback.'}
                            </p>
                        </div>
                        <p style={{ fontWeight: 400, fontSize: '11px', color: '#86868B' }}>
                            {lang === 'es'
                                ? 'El informe entrega al adulto el lenguaje exacto para conectar con este perfil.'
                                : 'The report gives the adult the exact language to connect with this profile.'}
                        </p>
                    </motion.div>
                </div>

                <motion.p
                    {...fadeUp(0.2)}
                    style={{ fontWeight: 400, fontSize: '13px', color: '#86868B', marginTop: '16px', textAlign: 'center' }}
                >
                    {lang === 'es'
                        ? 'Conducta × Motor = 12 arquetipos únicos. Sin superposiciones.'
                        : 'Behavior × Engine = 12 unique archetypes. No overlaps.'}
                </motion.p>
            </section>

            <Divider />

            {/* ── ARQUETIPOS ── */}
            <section className="max-w-5xl mx-auto px-6 py-32">
                <motion.div {...fadeUp(0)} className="mb-16">
                    <SectionLabel>
                        {lang === 'es' ? 'La cartografía · 12 perfiles' : 'The map · 12 profiles'}
                    </SectionLabel>
                    <h2 style={{ fontWeight: 300, fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', lineHeight: 1.1, letterSpacing: '-0.025em', maxWidth: '560px' }}>
                        {lang === 'es'
                            ? '12 perfiles. Cada niño en uno.'
                            : '12 profiles. Every child fits one.'}
                    </h2>
                    <p style={{ fontWeight: 400, fontSize: '15px', color: '#86868B', marginTop: '16px', maxWidth: '440px', lineHeight: 1.6 }}>
                        {lang === 'es'
                            ? 'No es un diagnóstico. Es una fotografía del presente — un punto de partida para sintonizar.'
                            : 'Not a diagnosis. A photograph of the present — a starting point for tuning in.'}
                    </p>
                </motion.div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px"
                     style={{ border: '1px solid #D2D2D7', borderRadius: '12px', overflow: 'hidden' }}>
                    {ARCHETYPES.map(({ label, motor, eje }, i) => (
                        <motion.div
                            key={label}
                            {...fadeUp(i * 0.03)}
                            style={{ borderRight: '1px solid #D2D2D7', borderBottom: '1px solid #D2D2D7' }}
                            className="bg-white p-6 group hover:bg-argo-neutral transition-colors"
                        >
                            <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: EJE_COLOR[eje], marginBottom: '10px' }} />
                            <p style={{ fontWeight: 500, fontSize: '12px', color: '#1D1D1F', lineHeight: 1.3, marginBottom: '6px' }}>
                                {label}
                            </p>
                            <p style={{ fontWeight: 400, fontSize: '10px', color: '#86868B', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                                {motor}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </section>

            <Divider />

            {/* ── SALVAGUARDA ÉTICA ── */}
            <section className="max-w-5xl mx-auto px-6 py-32">
                <div className="max-w-2xl mx-auto text-center">
                    <motion.div {...fadeUp(0)}>
                        <SectionLabel>
                            {lang === 'es' ? 'Compromiso · Observador aliado' : 'Commitment · Allied observer'}
                        </SectionLabel>
                        <h2 style={{ fontWeight: 300, fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', lineHeight: 1.15, letterSpacing: '-0.025em' }} className="mb-8 text-argo-navy">
                            {lang === 'es'
                                ? 'Sin etiquetas. Sin juicios clínicos.'
                                : 'No labels. No clinical judgments.'}
                        </h2>
                        <p style={{ fontWeight: 400, fontSize: '16px', color: '#424245', lineHeight: 1.75 }} className="mb-4">
                            {lang === 'es'
                                ? 'Argo Method no clasifica capacidades ni predice futuros. No sustituye el trabajo de psicólogos deportivos ni especialistas en desarrollo infantil.'
                                : 'Argo Method does not classify abilities or predict futures. It does not replace sports psychologists or child development specialists.'}
                        </p>
                        <p style={{ fontWeight: 400, fontSize: '16px', color: '#424245', lineHeight: 1.75 }}>
                            {lang === 'es'
                                ? 'Solo herramientas para que el próximo domingo tu hijo quiera volver a jugar.'
                                : 'Just tools so that next Sunday, your child wants to play again.'}
                        </p>
                    </motion.div>
                </div>
            </section>

            <Divider />

            {/* ── CTA FINAL ── */}
            <section className="max-w-5xl mx-auto px-6 py-32 text-center">
                <motion.div {...fadeUp(0)}>
                    <h2 style={{ fontWeight: 300, fontSize: 'clamp(2.2rem, 4.5vw, 3.8rem)', lineHeight: 1.08, letterSpacing: '-0.03em' }} className="mb-6 text-argo-navy">
                        {lang === 'es'
                            ? '¿En qué lugar de la nave está tu atleta?'
                            : 'Where on the ship is your athlete?'}
                    </h2>
                    <p style={{ fontWeight: 400, fontSize: '16px', color: '#86868B', marginBottom: '40px' }}>
                        {lang === 'es'
                            ? '10 minutos. Un informe al email. Sin apps ni instalaciones.'
                            : '10 minutes. A report to your inbox. No apps or installs.'}
                    </p>
                    <button
                        onClick={() => navigate('/app')}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '10px',
                            backgroundColor: '#0071E3', color: '#fff',
                            fontWeight: 500, fontSize: '16px', letterSpacing: '-0.01em',
                            borderRadius: '8px', padding: '16px 36px',
                            border: 'none', cursor: 'pointer',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    >
                        {lang === 'es' ? 'Comenzar la Odisea' : 'Begin the Odyssey'}
                        <ArrowRight size={16} />
                    </button>
                </motion.div>
            </section>

            {/* ── FOOTER ── */}
            <footer style={{ borderTop: '1px solid #D2D2D7' }} className="py-10">
                <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div style={{ fontWeight: 500, fontSize: '13px' }} className="text-argo-navy">
                        Argo Method
                        <span style={{ fontWeight: 400, fontSize: '11px', color: '#86868B', marginLeft: '12px' }}>
                            {lang === 'es' ? 'Cartografía de Sintonía Deportiva' : 'Sports Behavioral Mapping'}
                        </span>
                    </div>
                    <div style={{ fontWeight: 400, fontSize: '11px', color: '#86868B', letterSpacing: '0.06em' }}
                         className="flex items-center gap-6 uppercase">
                        <span>v{APP_VERSION}</span>
                        <span>© 2025 Argo.</span>
                        <button
                            onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
                            className="hover:text-argo-navy transition-colors"
                        >
                            {t.nav.lang}
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    );
};
