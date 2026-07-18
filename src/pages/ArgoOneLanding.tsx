import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Clock, Mail, ChevronDown, Check } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { CouponField, type AppliedCoupon } from '../components/CouponField';

const BASE_CENTS = 1299; // ArgoOne® $12.99
const fmtUsd = (cents: number) => `$${(cents / 100).toFixed(2)}`;

/**
 * Dedicated ArgoOne® landing page — optimized for ad conversion.
 * Route: /one
 * Single unified product (ArgoOne® fusion): the child's report + the buyer's
 * Puente included, $12.99 USD via Stripe. No tiers, no account, no subscription.
 */

// Brand-styled product name (Argo bold + One light + ®), joined + ®.
const BrandName: React.FC = () => (
    <>
        <span style={{ fontWeight: 800 }}>Argo</span>
        <span style={{ fontWeight: 300 }}>One</span>
        <span style={{ fontWeight: 300 }}>®</span>
    </>
);

const INCLUDED = [
    'El arquetipo del niño y qué lo mueve en el deporte.',
    'Su motor: a qué ritmo procesa y decide.',
    'Palabras que conectan y palabras que suelen generar ruido.',
    'Guía rápida y checklist del día: antes, durante y después.',
    'Tu Puente con el niño, incluido: cómo acompañar desde tu propio estilo.',
];

const FAQ_ITEMS = [
    { q: '¿Es un test psicológico?', a: 'No. No diagnostica, no clasifica, no predice. Es una herramienta para entender y comunicarte mejor.' },
    { q: '¿En qué se diferencia de un test psicológico?', a: 'Un test psicológico diagnostica y clasifica. Argo no. Es una herramienta de comunicación basada en el modelo DISC que te muestra cómo el niño procesa decisiones y presión en el deporte, para que puedas acompañar mejor.' },
    { q: '¿Qué incluye la compra?', a: 'El informe individual del niño y tu propio Puente con el niño, ya incluido. Un solo pago, sin suscripción.' },
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

const ArgoOneLanding: React.FC = () => {
    const { lang } = useLang();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
    const totalCents = coupon ? coupon.discountedCents : BASE_CENTS;

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
                body: JSON.stringify({ email, kind: 'one_puente', lang, coupon_code: coupon?.code }),
            });
            const data = await res.json();
            if (data.checkout_url) {
                window.location.href = data.checkout_url;
            } else if (data.error === 'invalid_coupon') {
                setError('El cupón dejó de ser válido. Quítalo e intenta de nuevo.');
                setLoading(false);
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
                <div className="max-w-5xl mx-auto flex items-center justify-between" style={{ padding: '12px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
                        <span style={{ fontSize: '18px', fontWeight: 800, color: '#1D1D1F', letterSpacing: '-0.02em' }}>Argo</span>
                        <span style={{ fontSize: '18px', fontWeight: 100, color: '#1D1D1F', letterSpacing: '-0.02em' }}>Method®</span>
                    </div>
                </div>
            </header>

            {/* ── Hero: headline + checkout card (single, centered focal point) ── */}
            <section className="px-5 py-12 lg:py-16" style={{ background: 'linear-gradient(180deg, #F3EDF7 0%, #FAFAFA 100%)' }}>
                <div className="max-w-xl mx-auto">

                    {/* Headline — home style: eyebrow + thin heading */}
                    <motion.div {...fade()} className="text-center" style={{ marginBottom: '26px' }}>
                        <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#AEAEB2', marginBottom: '14px' }}>
                            El informe del niño
                        </p>
                        <h1 className="text-argo-navy" style={{ fontWeight: 300, fontSize: 'clamp(1.9rem, 4vw, 2.7rem)', lineHeight: 1.12, letterSpacing: '-0.03em', marginBottom: '14px' }}>
                            Cada niño vive el deporte a su manera.
                        </h1>
                        <p style={{ fontSize: '16px', color: '#424245', lineHeight: 1.6 }}>
                            Conoce sus tendencias en 10 minutos. El informe te da las claves para acompañar mejor y que disfrute más del juego, con tu Puente con el niño incluido.
                        </p>
                    </motion.div>

                    {/* Checkout card — the single focal point */}
                    <motion.div {...fade(0.1)}>
                        <div style={{ background: '#fff', borderRadius: '18px', border: '1px solid #EDE4F5', boxShadow: '0 14px 48px rgba(149,95,181,0.14)', padding: '24px' }}>

                            {/* Product summary — single unified ArgoOne® */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
                                <div>
                                    <p style={{ fontSize: '17px', color: '#1D1D1F', marginBottom: '2px' }}><BrandName /></p>
                                    <p style={{ fontSize: '12px', color: '#86868B', lineHeight: 1.5 }}>El informe del niño, con tu Puente incluido.</p>
                                </div>
                                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                                    {coupon && (
                                        <p style={{ fontSize: '14px', color: '#AEAEB2', textDecoration: 'line-through', margin: '0 0 1px' }}>{fmtUsd(BASE_CENTS)}</p>
                                    )}
                                    <p style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.02em', color: '#955FB5', margin: 0 }}>{fmtUsd(totalCents)}</p>
                                </div>
                            </div>

                            {/* What's included */}
                            <ul style={{ listStyle: 'none', marginBottom: '18px' }}>
                                {INCLUDED.map((item, i) => (
                                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '5px 0' }}>
                                        <Check size={14} style={{ color: '#955FB5', flexShrink: 0, marginTop: '3px' }} />
                                        <span style={{ fontSize: '13px', color: '#424245', lineHeight: 1.4 }}>{item}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* Discount coupon */}
                            <CouponField
                                product="one"
                                baseCents={BASE_CENTS}
                                lang={lang as 'es' | 'en' | 'pt'}
                                onChange={setCoupon}
                                className="mb-4"
                            />

                            {/* Email + buy CTA */}
                            <div className="flex flex-col gap-2.5">
                                <input
                                    type="email"
                                    placeholder="Tu email (para recibir el informe)"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleBuy()}
                                    style={{
                                        width: '100%', padding: '13px 14px', borderRadius: '12px',
                                        border: '1px solid #D2D2D7', fontSize: '14px', outline: 'none',
                                        boxSizing: 'border-box',
                                    }}
                                />
                                <button
                                    onClick={handleBuy}
                                    disabled={loading || !email}
                                    style={{
                                        width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                                        fontSize: '15px', fontWeight: 600,
                                        background: email ? '#955FB5' : '#D2D2D7', color: '#fff',
                                        cursor: email ? 'pointer' : 'default',
                                        opacity: loading ? 0.6 : 1, transition: 'all 0.2s',
                                        boxShadow: email ? '0 4px 18px rgba(149,95,181,0.25)' : 'none',
                                    }}
                                >
                                    {loading ? 'Procesando...' : <>Comprar <BrandName /> · {fmtUsd(totalCents)}</>}
                                </button>
                                {error && <p style={{ fontSize: '12px', color: '#DC2626', textAlign: 'center' }}>{error}</p>}
                            </div>

                            {/* Trust badges */}
                            <div className="flex flex-wrap items-center justify-center" style={{ gap: '16px', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #F0F0F5' }}>
                                {[
                                    { icon: <Shield size={12} />, text: 'Pago seguro' },
                                    { icon: <Clock size={12} />, text: 'Acceso inmediato' },
                                    { icon: <Mail size={12} />, text: 'Sin suscripción' },
                                ].map((b, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#86868B' }}>
                                        {b.icon} {b.text}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── How it works ─────────────────────────────────────────── */}
            <section className="px-5 py-12 lg:py-16">
                <div className="max-w-4xl mx-auto">
                    <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#AEAEB2', marginBottom: '8px', textAlign: 'center' }}>
                        Cómo funciona
                    </p>
                    <h2 className="text-argo-navy" style={{ fontWeight: 300, fontSize: 'clamp(1.5rem, 3vw, 2.1rem)', lineHeight: 1.15, letterSpacing: '-0.03em', textAlign: 'center', marginBottom: '38px' }}>
                        De un juego de 10 minutos a un informe que puedes usar.
                    </h2>
                    <div className="grid gap-8 lg:grid-cols-3 lg:gap-10">
                        {[
                            { n: '1', title: 'Compras y recibes el enlace', desc: <>Pagas con tarjeta y al instante recibes un enlace único para que el niño juegue. Sin crear cuenta ni suscripción, con tu Puente con el niño incluido.</> },
                            { n: '2', title: 'El niño juega 10 minutos', desc: 'Desde el celular vive una aventura náutica. No hay preguntas directas ni respuestas correctas: sus decisiones muestran cómo vive el juego, la presión y el equipo.' },
                            { n: '3', title: 'Recibes el informe por email', desc: 'Un informe claro con su perfil, qué lo motiva, las palabras que lo conectan y orientaciones concretas para acompañar en la cancha.' },
                        ].map(s => (
                            <div key={s.n}>
                                <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: 'rgba(149,95,181,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, color: '#955FB5', marginBottom: '14px' }}>
                                    {s.n}
                                </div>
                                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1D1D1F', letterSpacing: '-0.01em', marginBottom: '7px' }}>{s.title}</h3>
                                <p style={{ fontSize: '14px', color: '#86868B', lineHeight: 1.6 }}>{s.desc}</p>
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#1D1D1F' }}>Argo</span>
                    <span style={{ fontSize: '13px', fontWeight: 100, color: '#1D1D1F' }}>Method®</span>
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
