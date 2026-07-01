import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Clock, Mail, ChevronDown } from 'lucide-react';

/**
 * Dedicated Argo One landing page — optimized for ad conversion.
 * Route: /one  (/one?kind=puente preselects the combo)
 * Mobile-first, responsive: single column on phones, a desktop two-column
 * hero (pitch + selector left, report preview right) on lg+. USD via Stripe.
 */

type OneKind = 'one' | 'one_puente';

const OPTIONS: { kind: OneKind; title: string; price: string; regular: string; desc: string; popular: boolean }[] = [
    { kind: 'one',        title: 'Argo One',   price: '$9.99',  regular: '$12.99', desc: 'El informe del perfil del niño.',                    popular: false },
    { kind: 'one_puente', title: 'Argo One +', price: '$12.99', regular: '$14.99', desc: 'El informe del niño y tu propio Puente con el niño.', popular: true },
];

// Brand-styled product name (Argo bold + One light + "+" bold), matching the home pricing card.
const BrandName: React.FC<{ kind: OneKind }> = ({ kind }) => (
    <>
        <span style={{ fontWeight: 800 }}>Argo</span>
        <span style={{ fontWeight: 300 }}> One</span>
        {kind === 'one_puente' && <span style={{ fontWeight: 800 }}> +</span>}
    </>
);

const FAQ_ITEMS = [
    { q: '¿En qué se diferencia de un test psicológico?', a: 'Un test psicológico diagnostica y clasifica. Argo no. Es una herramienta de comunicación basada en el modelo DISC que te muestra cómo el niño procesa decisiones y presión en el deporte, para que puedas acompañarlo mejor.' },
    { q: '¿Es un test psicológico?', a: 'No. No diagnostica, no clasifica, no predice. Es una herramienta para entender y comunicarte mejor.' },
    { q: '¿Qué edad debe tener?', a: 'Entre 8 y 16 años.' },
    { q: '¿Cuánto toma?', a: '10 a 12 minutos de aventura interactiva.' },
    { q: '¿Necesito crear cuenta?', a: 'No. Solo un email para recibir el informe. Sin suscripción, sin compromisos.' },
    { q: '¿Es seguro?', a: 'Sí. No recopilamos datos sensibles del menor. El informe se envía solo al adulto responsable.' },
];

const fade = (delay = 0) => ({
    initial: { opacity: 0, y: 12 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.4, ease: [0.25, 0, 0, 1], delay },
});

const FaqItem: React.FC<{ q: string; a: string }> = ({ q, a }) => {
    const [open, setOpen] = useState(false);
    return (
        <div style={{ borderBottom: '1px solid #E8E8ED' }}>
            <button onClick={() => setOpen(v => !v)} className="w-full flex items-center justify-between py-3 text-left" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#1D1D1F', paddingRight: '12px' }}>{q}</span>
                <ChevronDown size={16} style={{ color: '#86868B', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
            </button>
            {open && <p style={{ fontSize: '13px', color: '#424245', lineHeight: 1.6, paddingBottom: '12px' }}>{a}</p>}
        </div>
    );
};

const ReportPreview: React.FC = () => (
    <div>
        <p className="text-center lg:text-left" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#86868B', marginBottom: '14px' }}>
            Esto es lo que vas a recibir
        </p>
        <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #E8E8ED' }}>
            {/* Mock report header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid #F0F0F5' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, #f97316 0%, #f59e0b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>IC</span>
                </div>
                <div>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#1D1D1F' }}>Impulsor Rítmico</p>
                    <p style={{ fontSize: '11px', color: '#86868B' }}>Motor Rítmico | 12 años | Fútbol</p>
                </div>
            </div>
            {/* Mock sections */}
            {[
                { title: 'Resumen del perfil', lines: 3, color: '#f97316' },
                { title: 'Palabras puente', lines: 2, color: '#22c55e' },
                { title: 'Combustible y corazón', lines: 2, color: '#f59e0b' },
                { title: 'Orientaciones para el adulto', lines: 3, color: '#6366f1' },
            ].map((s, i) => (
                <div key={i} style={{ marginBottom: i < 3 ? '14px' : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: s.color, flexShrink: 0 }} />
                        <p style={{ fontSize: '12px', fontWeight: 600, color: '#1D1D1F' }}>{s.title}</p>
                    </div>
                    {Array.from({ length: s.lines }).map((_, j) => (
                        <div key={j} style={{
                            height: '8px', borderRadius: '4px',
                            background: '#F0F0F5',
                            width: j === s.lines - 1 ? '60%' : '100%',
                            marginBottom: '5px', marginLeft: '14px',
                        }} />
                    ))}
                </div>
            ))}
            {/* Blur overlay hint */}
            <div style={{ textAlign: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #F0F0F5' }}>
                <p style={{ fontSize: '11px', color: '#955FB5', fontWeight: 500 }}>
                    Informe completo generado por IA para cada perfil
                </p>
            </div>
        </div>
    </div>
);

const ArgoOneLanding: React.FC = () => {
    const [searchParams] = useSearchParams();
    const initialKind: OneKind = searchParams.get('kind') === 'puente' ? 'one_puente' : 'one';
    const [selectedKind, setSelectedKind] = useState<OneKind>(initialKind);
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Navigating here from the home pricing card carries the previous scroll
    // position; reset so the buyer lands on the hero (price + email + CTA).
    useEffect(() => { window.scrollTo(0, 0); }, []);

    const handleBuy = async () => {
        if (!email) return;
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/one-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, kind: selectedKind }),
            });
            const data = await res.json();
            if (data.checkout_url) {
                window.location.href = data.checkout_url;
            } else {
                setError('Error al crear el checkout. Intenta de nuevo.');
                setLoading(false);
            }
        } catch {
            setError('Error de conexión. Intenta de nuevo.');
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#FAFAFA' }}>

            {/* ── Header (minimal, no competing CTA) ──────────────────── */}
            <header style={{ background: '#fff', borderBottom: '1px solid #E8E8ED' }}>
                <div className="max-w-6xl mx-auto flex items-center justify-between" style={{ padding: '12px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <span style={{ fontSize: '18px', fontWeight: 800, color: '#1D1D1F', letterSpacing: '-0.02em' }}>Argo</span>
                        <span style={{ fontSize: '18px', fontWeight: 100, color: '#1D1D1F', letterSpacing: '-0.02em' }}>Method</span>
                    </div>
                </div>
            </header>

            {/* ── Hero: pitch + selector + CTA (left) · report preview (right) ── */}
            <section className="px-5 py-8 lg:py-16" style={{ background: 'linear-gradient(180deg, #F3EDF7 0%, #FAFAFA 100%)' }}>
                <div className="max-w-5xl mx-auto grid gap-10 lg:grid-cols-2 lg:gap-14 lg:items-center">

                    {/* LEFT column: pitch + selector + CTA */}
                    <div className="w-full max-w-[480px] mx-auto lg:mx-0">
                        <motion.div {...fade()} className="text-center lg:text-left" style={{ marginBottom: '16px' }}>
                            <h1 style={{ fontWeight: 700, fontSize: 'clamp(1.5rem, 4vw, 2.35rem)', lineHeight: 1.15, letterSpacing: '-0.025em', color: '#1D1D1F', marginBottom: '10px' }}>
                                Cada niño vive el deporte a su manera. Conoce sus tendencias en 10 minutos y ayúdalo a disfrutar más del juego.
                            </h1>
                            <p style={{ fontSize: '15px', color: '#424245', lineHeight: 1.55 }}>
                                El informe te da las claves para acompañarlo mejor y que disfrute más.
                            </p>
                        </motion.div>

                        <div className="mx-auto lg:mx-0" style={{ width: '40px', height: '1px', background: '#D2D2D7', marginBottom: '16px' }} />

                        {/* Selector */}
                        <div className="flex flex-col gap-2">
                            {OPTIONS.map((o, i) => (
                                <motion.button
                                    key={o.kind}
                                    {...fade(i * 0.04)}
                                    onClick={() => setSelectedKind(o.kind)}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '14px 16px', borderRadius: '12px', cursor: 'pointer',
                                        border: selectedKind === o.kind ? '2px solid #955FB5' : '1px solid #E8E8ED',
                                        background: selectedKind === o.kind ? 'rgba(149,95,181,0.04)' : '#fff',
                                        transition: 'all 0.15s', position: 'relative', textAlign: 'left', width: '100%',
                                    }}
                                >
                                    {o.popular && (
                                        <span style={{
                                            position: 'absolute', top: '-9px', left: '14px',
                                            fontSize: '9px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
                                            background: '#955FB5', color: '#fff', padding: '2px 10px', borderRadius: '5px',
                                        }}>
                                            Recomendado
                                        </span>
                                    )}
                                    <div style={{ paddingRight: '12px' }}>
                                        <p style={{ fontSize: '14px', color: '#1D1D1F' }}><BrandName kind={o.kind} /></p>
                                        <p style={{ fontSize: '11px', color: '#86868B', marginTop: '1px' }}>{o.desc}</p>
                                    </div>
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <p style={{ fontSize: '11px', color: '#AEAEB2', textDecoration: 'line-through' }}>{o.regular}</p>
                                        <p style={{ fontSize: '18px', fontWeight: 700, color: '#955FB5' }}>{o.price}</p>
                                    </div>
                                </motion.button>
                            ))}
                        </div>

                        {/* Email + buy CTA */}
                        <motion.div {...fade(0.12)} style={{ marginTop: '14px' }}>
                            <div className="flex flex-col gap-2">
                                <input
                                    type="email"
                                    placeholder="Tu email (para recibir el informe)"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleBuy()}
                                    style={{
                                        width: '100%', padding: '12px 14px', borderRadius: '10px',
                                        border: '1px solid #D2D2D7', fontSize: '14px', outline: 'none',
                                        boxSizing: 'border-box',
                                    }}
                                />
                                <button
                                    onClick={handleBuy}
                                    disabled={loading || !email}
                                    style={{
                                        width: '100%', padding: '14px', borderRadius: '10px', border: 'none',
                                        fontSize: '15px', fontWeight: 600,
                                        background: email ? '#955FB5' : '#D2D2D7', color: '#fff',
                                        cursor: email ? 'pointer' : 'default',
                                        opacity: loading ? 0.6 : 1, transition: 'all 0.2s',
                                    }}
                                >
                                    {loading ? 'Procesando...' : <>Comprar <BrandName kind={selectedKind} /></>}
                                </button>
                                {error && <p style={{ fontSize: '12px', color: '#DC2626', textAlign: 'center' }}>{error}</p>}
                            </div>
                        </motion.div>

                        {/* Trust badges */}
                        <div className="flex justify-center lg:justify-start" style={{ gap: '16px', marginTop: '12px' }}>
                            {[
                                { icon: <Shield size={12} />, text: 'Pago seguro' },
                                { icon: <Clock size={12} />, text: 'Acceso inmediato' },
                                { icon: <Mail size={12} />, text: 'Sin cuenta ni suscripción' },
                            ].map((b, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#86868B' }}>
                                    {b.icon} {b.text}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT column: report preview */}
                    <motion.div {...fade(0.16)} className="w-full max-w-[480px] mx-auto lg:mx-0">
                        <ReportPreview />
                    </motion.div>

                </div>
            </section>

            {/* ── How it works: stacked on mobile, 3-up on desktop ─────── */}
            <section className="px-5 py-10 lg:py-14">
                <div className="max-w-4xl mx-auto">
                    <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#86868B', marginBottom: '20px', textAlign: 'center' }}>
                        Cómo funciona
                    </p>
                    <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
                        {[
                            { n: '1', title: 'Compras el informe', desc: 'Pagas con tarjeta.' },
                            { n: '2', title: 'El niño juega 10 min', desc: 'Aventura interactiva. Sin cuenta ni datos.' },
                            { n: '3', title: 'Recibes el informe', desc: 'Perfil + claves de comunicación por email.' },
                        ].map(s => (
                            <div key={s.n} className="flex-1 flex items-center gap-3 lg:flex-col lg:items-start lg:gap-2">
                                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(149,95,181,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#955FB5', flexShrink: 0 }}>
                                    {s.n}
                                </div>
                                <div>
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#1D1D1F' }}>{s.title}</span>
                                    <span style={{ fontSize: '13px', color: '#86868B' }}> {s.desc}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FAQ ──────────────────────────────────────────────────── */}
            <section className="px-5 pb-12">
                <div className="max-w-2xl mx-auto">
                    <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#86868B', marginBottom: '12px', textAlign: 'center' }}>
                        Preguntas frecuentes
                    </p>
                    <div>
                        {FAQ_ITEMS.map((item, i) => <FaqItem key={i} q={item.q} a={item.a} />)}
                    </div>
                </div>
            </section>

            {/* ── Footer ──────────────────────────────────────────────── */}
            <footer style={{ padding: '20px', borderTop: '1px solid #E8E8ED', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#1D1D1F' }}>Argo</span>
                    <span style={{ fontSize: '13px', fontWeight: 100, color: '#1D1D1F' }}>Method</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                    <a href="/terms" style={{ fontSize: '11px', color: '#86868B', textDecoration: 'none' }}>Términos</a>
                    <a href="/privacy" style={{ fontSize: '11px', color: '#86868B', textDecoration: 'none' }}>Privacidad</a>
                </div>
            </footer>
        </div>
    );
};

export default ArgoOneLanding;
