import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Clock, Mail, ChevronDown } from 'lucide-react';

/**
 * Dedicated Argo One landing page — optimized for IG ad conversion (Argentina).
 * Route: /one
 * Mobile-first. Pricing visible without scrolling.
 */

const PACKS = [
    { n: 1, ars: 9999,  regularArs: 20699,  perArs: '',      discount: 52, popular: false, useCase: 'Para conocer a tu hijo' },
    { n: 3, ars: 24999, regularArs: 48299,  perArs: '8.333', discount: 48, popular: true,  useCase: 'Para hermanos o repetir en el tiempo' },
    { n: 5, ars: 34999, regularArs: 68999,  perArs: '7.000', discount: 49, popular: false, useCase: 'Para el equipo o compartir con amigos' },
];

const FAQ_ITEMS = [
    { q: '¿En que se diferencia de un test psicologico?', a: 'Un test psicologico diagnostica y clasifica. Argo no. Es una herramienta de comunicacion basada en el modelo DISC que te muestra como tu hijo procesa decisiones y presion en el deporte, para que puedas acompanarlo mejor.' },
    { q: '¿Es un test psicologico?', a: 'No. No diagnostica, no clasifica, no predice. Es una herramienta para entender y comunicarte mejor.' },
    { q: '¿Que edad debe tener?', a: 'Entre 8 y 16 anos.' },
    { q: '¿Cuanto toma?', a: '10 a 12 minutos de aventura interactiva.' },
    { q: '¿Necesito crear cuenta?', a: 'No. Solo un email para recibir el informe. Sin suscripcion, sin compromisos.' },
    { q: '¿Es seguro?', a: 'Si. No recopilamos datos sensibles del menor. El informe se envia solo al adulto responsable.' },
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
    const [selectedPack, setSelectedPack] = useState<number>(3);
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleBuy = async () => {
        if (!selectedPack || !email) return;
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/one-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, pack_size: selectedPack }),
            });
            const data = await res.json();
            if (data.checkout_url) {
                window.location.href = data.checkout_url;
            } else {
                setError('Error al crear el checkout. Intenta de nuevo.');
                setLoading(false);
            }
        } catch {
            setError('Error de conexion. Intenta de nuevo.');
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#FAFAFA' }}>

            {/* ── Header (minimal, no competing CTA) ──────────────────── */}
            <header style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderBottom: '1px solid #E8E8ED' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <span style={{ fontSize: '18px', fontWeight: 800, color: '#1D1D1F', letterSpacing: '-0.02em' }}>Argo</span>
                    <span style={{ fontSize: '18px', fontWeight: 100, color: '#1D1D1F', letterSpacing: '-0.02em' }}>Method</span>
                </div>
                <span style={{
                    fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                    color: '#fff', background: '#e97320',
                    padding: '4px 12px', borderRadius: '3px',
                    transform: 'rotate(-2deg)', display: 'inline-block',
                    boxShadow: '0 1px 3px rgba(233,115,32,0.3)',
                }}>Precio de lanzamiento</span>
            </header>

            {/* ── Hero (pain-driven, not descriptive) + Stats ─────────── */}
            <section style={{ background: 'linear-gradient(180deg, #F3EDF7 0%, #FAFAFA 100%)', padding: '32px 20px 24px' }}>
              <div style={{ maxWidth: '480px', margin: '0 auto' }}>
                <motion.div {...fade()} style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <h1 style={{ fontWeight: 700, fontSize: 'clamp(1.4rem, 5vw, 1.85rem)', lineHeight: 1.2, letterSpacing: '-0.025em', color: '#1D1D1F', marginBottom: '10px' }}>
                        Tu hijo tiene un perfil deportivo unico. Descubrelo en 10 minutos y ayudalo a disfrutar mas del juego.
                    </h1>
                    <p style={{ fontSize: '14px', color: '#424245', lineHeight: 1.5 }}>
                        Cada chico vive el deporte a su manera. El informe te da las claves para acompanarlo mejor y que disfrute mas.
                    </p>
                </motion.div>

                <div style={{ width: '40px', height: '1px', background: '#D2D2D7', margin: '0 auto 16px' }} />

                {/* ── Pack selector with use cases ────────────────────── */}
                <div className="flex flex-col gap-2">
                    {PACKS.map((p, i) => (
                        <motion.button
                            key={p.n}
                            {...fade(i * 0.04)}
                            onClick={() => setSelectedPack(p.n)}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '14px 16px', borderRadius: '12px', cursor: 'pointer',
                                border: selectedPack === p.n ? '2px solid #955FB5' : '1px solid #E8E8ED',
                                background: selectedPack === p.n ? 'rgba(149,95,181,0.04)' : '#fff',
                                transition: 'all 0.15s', position: 'relative', textAlign: 'left', width: '100%',
                            }}
                        >
                            {p.popular && (
                                <span style={{
                                    position: 'absolute', top: '-9px', left: '14px',
                                    fontSize: '9px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
                                    background: '#955FB5', color: '#fff', padding: '2px 10px', borderRadius: '5px',
                                }}>
                                    Mas elegido
                                </span>
                            )}
                            <span style={{
                                position: 'absolute', top: '-9px', right: '14px',
                                fontSize: '9px', fontWeight: 700,
                                background: '#16a34a', color: '#fff', padding: '2px 8px', borderRadius: '5px',
                            }}>
                                -{p.discount}%
                            </span>
                            <div>
                                <p style={{ fontSize: '14px', fontWeight: 600, color: '#1D1D1F' }}>
                                    {p.n} {p.n === 1 ? 'informe' : 'informes'}
                                </p>
                                <p style={{ fontSize: '11px', color: '#86868B', marginTop: '1px' }}>
                                    {p.useCase}
                                </p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '11px', color: '#AEAEB2', textDecoration: 'line-through' }}>
                                    ${p.regularArs.toLocaleString('es-AR')}
                                </p>
                                <p style={{ fontSize: '18px', fontWeight: 700, color: '#955FB5' }}>
                                    ${p.ars.toLocaleString('es-AR')}
                                </p>
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
                            {loading ? 'Procesando...' : `Comprar ${selectedPack} ${selectedPack === 1 ? 'informe' : 'informes'}`}
                        </button>
                        {error && <p style={{ fontSize: '12px', color: '#DC2626', textAlign: 'center' }}>{error}</p>}
                    </div>
                </motion.div>

                {/* Trust badges */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '12px' }}>
                    {[
                        { icon: <Shield size={12} />, text: 'Pago seguro' },
                        { icon: <Clock size={12} />, text: 'Acceso inmediato' },
                        { icon: <Mail size={12} />, text: 'Sin cuenta ni suscripcion' },
                    ].map((b, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#86868B' }}>
                            {b.icon} {b.text}
                        </div>
                    ))}
                </div>
              </div>
            </section>

            {/* ── Report preview (visual mockup) ──────────────────────── */}
            <section style={{ padding: '32px 20px', maxWidth: '480px', margin: '0 auto' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#86868B', marginBottom: '14px', textAlign: 'center' }}>
                    Esto es lo que vas a recibir
                </p>
                <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #E8E8ED' }}>
                    {/* Mock report header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid #F0F0F5' }}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, #f97316 0%, #f59e0b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>IC</span>
                        </div>
                        <div>
                            <p style={{ fontSize: '14px', fontWeight: 600, color: '#1D1D1F' }}>Impulsor Conectivo</p>
                            <p style={{ fontSize: '11px', color: '#86868B' }}>Motor Ritmico | 12 anos | Futbol</p>
                        </div>
                    </div>
                    {/* Mock sections */}
                    {[
                        { title: 'Resumen del perfil', lines: 3, color: '#f97316' },
                        { title: 'Palabras puente', lines: 2, color: '#22c55e' },
                        { title: 'Combustible y corazon', lines: 2, color: '#f59e0b' },
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
            </section>

            {/* ── How it works (compact) ──────────────────────────────── */}
            <section style={{ padding: '0 20px 32px', maxWidth: '480px', margin: '0 auto' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#86868B', marginBottom: '14px', textAlign: 'center' }}>
                    Como funciona
                </p>
                <div className="flex flex-col gap-3">
                    {[
                        { n: '1', title: 'Compras un pack', desc: 'Pagas con MercadoPago o tarjeta.' },
                        { n: '2', title: 'Tu hijo juega 10 min', desc: 'Aventura interactiva. Sin cuenta ni datos.' },
                        { n: '3', title: 'Recibes el informe', desc: 'Perfil + claves de comunicacion por email.' },
                    ].map(s => (
                        <div key={s.n} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
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
            </section>

            {/* ── FAQ (compact) ───────────────────────────────────────── */}
            <section style={{ padding: '0 20px 32px', maxWidth: '480px', margin: '0 auto' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#86868B', marginBottom: '12px', textAlign: 'center' }}>
                    Preguntas frecuentes
                </p>
                <div>
                    {FAQ_ITEMS.map((item, i) => <FaqItem key={i} q={item.q} a={item.a} />)}
                </div>
            </section>

            {/* ── Footer ──────────────────────────────────────────────── */}
            <footer style={{ padding: '20px', borderTop: '1px solid #E8E8ED', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#1D1D1F' }}>Argo</span>
                    <span style={{ fontSize: '13px', fontWeight: 100, color: '#1D1D1F' }}>Method</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                    <a href="/terms" style={{ fontSize: '11px', color: '#86868B', textDecoration: 'none' }}>Terminos</a>
                    <a href="/privacy" style={{ fontSize: '11px', color: '#86868B', textDecoration: 'none' }}>Privacidad</a>
                </div>
            </footer>
        </div>
    );
};

export default ArgoOneLanding;
