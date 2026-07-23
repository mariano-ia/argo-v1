import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Printer, Link2, CheckCircle } from 'lucide-react';
import { AXIS_COLORS } from '../../lib/designTokens';
import { getArchetypeLabel } from '../../lib/archetypeContentV4';
import { getPuentesCopy } from '../../lib/puentesTranslations';
import { InfoTip } from '../ui/Tooltip';
import { useCardFade } from '../report/useCardFade';
import { REPORT_REDESIGN_CSS } from '../report/reportRedesignStyles';
import type {
    AdultAxis,
    AdultProfile,
    Lang,
    PuentesAiSections,
} from '../../types/puentes';

interface ChildProfileSnapshot {
    eje: string;
    // Entitlement cut (frozen model 2026-07-10): puentes-start always sends null
    // for the child's headline profile data — the $4.99 viewer gets ONLY the bridge.
    motor: string | null;
    archetype_label: string | null;
    sport: string;
}

interface ChildEntry {
    puentes_session_id: string;
    source_session_id: string;
    child_name: string | null;
    child_profile: ChildProfileSnapshot | null;
    status: string;
    ai_sections: PuentesAiSections | null;
}

interface Props {
    lang: Lang;
    adultProfile?: AdultProfile | null;
    recipientEmail?: string | null;
    recipientName?: string | null;
    fecha?: string | null;   // fecha ya formateada ("23 de julio de 2026"); PuentesFlow la pasa en prod
    children: ChildEntry[];
    // Re-launch generation for a bridge whose AI generation FAILED (status
    // 'failed'). Provided by PuentesFlow; without it failed bridges show the
    // failure copy with no button.
    onRetryChild?: (puentesSessionId: string) => void;
}

const EJE_ORDER: AdultAxis[] = ['D', 'I', 'S', 'C'];

// Accent violet of the design system (v500 = marker / v600 = bridge label).
const V500 = '#955FB5';
const V600 = '#7A4D96';

/** Convierte **negrita** (markdown) en <strong>. El engine (generate-puentes.ts)
 *  destaca 1-2 frases por bloque; sin esto el `**` se filtraría literal. */
function renderRich(text: string): React.ReactNode[] {
    return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
        const m = part.match(/^\*\*([^*]+)\*\*$/);
        return m
            ? <strong key={i}>{m[1]}</strong>
            : <React.Fragment key={i}>{part}</React.Fragment>;
    });
}

// ── Vidrio de los orbes (mismas fórmulas que la maqueta / ReportV4View: orb_bg/orb_shadow) ──
function hexToRgb(hex: string): [number, number, number] {
    const h = hex.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function orbBg(hex: string): string {
    const [r, g, b] = hexToRgb(hex);
    return `radial-gradient(circle at 36% 30%, rgba(255,255,255,.62), rgba(255,255,255,0) 48%),` +
        `radial-gradient(circle at 52% 55%, rgba(${r},${g},${b},.30), rgba(${r},${g},${b},.15) 62%, rgba(${r},${g},${b},.05) 100%)`;
}
function orbShadow(hex: string): string {
    const [r, g, b] = hexToRgb(hex);
    return `inset 0 0 0 1px rgba(${r},${g},${b},.16), inset 0 1px 12px rgba(255,255,255,.45), ` +
        `0 14px 38px -18px rgba(${r},${g},${b},.30)`;
}

// Animación (morph + duración) de cada orbe de "Composición" — variedad orgánica, igual que ReportV4View.
const MZ_MORPH: Record<string, string> = { D: 'argoOrbMorphA', I: 'argoOrbMorphB', S: 'argoOrbMorphA', C: 'argoOrbMorphB' };
const MZ_DUR: Record<string, string> = { D: '9s', I: '8s', S: '10.5s', C: '7.5s' };

// Espectro de presión: 3 estados con su posición fija sobre la pista.
const PRESS_POS: Record<'regulado' | 'reactivo' | 'evitativo', number> = { regulado: 0.15, reactivo: 0.5, evitativo: 0.85 };

const PRESSURE_DISPLAY: Record<string, Record<string, string>> = {
    es: { regulado: 'Regulado', reactivo: 'Reactivo', evitativo: 'Evitativo' },
    en: { regulado: 'Regulated', reactivo: 'Reactive', evitativo: 'Avoidant' },
    pt: { regulado: 'Regulado', reactivo: 'Reativo', evitativo: 'Evitativo' },
};

const PRESSURE_LABEL: Record<Lang, string> = {
    es: 'Estilo bajo presión',
    en: 'Style under pressure',
    pt: 'Estilo sob pressão',
};

const PRINT_LABEL: Record<Lang, string> = {
    es: 'Imprimir',
    en: 'Print',
    pt: 'Imprimir',
};

const SHARE_LABEL: Record<Lang, string> = {
    es: 'Compartir',
    en: 'Share',
    pt: 'Compartilhar',
};

const COPIED_LABEL: Record<Lang, string> = {
    es: 'Copiado',
    en: 'Copied',
    pt: 'Copiado',
};

const COMPOSITION_LABEL: Record<Lang, string> = {
    es: 'Tu mezcla',
    en: 'Your mix',
    pt: 'Sua mistura',
};

const ENCUENTRO_LABEL: Record<Lang, string> = {
    es: 'El punto de encuentro',
    en: 'The meeting point',
    pt: 'O ponto de encontro',
};

const TU_LABEL: Record<Lang, string> = { es: 'Tú', en: 'You', pt: 'Você' };

const COMPOSITION_TIP: Record<Lang, string> = {
    es: 'Cómo se reparten tus respuestas entre los cuatro colores del modelo. El tamaño de cada orbe muestra cuánto pesa ese eje hoy.',
    en: "How your answers spread across the model's four colors. Each orb's size shows how much that axis weighs today.",
    pt: 'Como suas respostas se distribuem entre as quatro cores do modelo. O tamanho de cada orbe mostra quanto esse eixo pesa hoje.',
};

const PRESSURE_TIP: Record<Lang, string> = {
    es: 'Cómo tiendes a responder cuando la situación aprieta: regulando y ordenando, reaccionando en caliente, o corriéndote del problema.',
    en: 'How you tend to respond when things get tight: regulating and settling, reacting in the heat of the moment, or stepping away from the problem.',
    pt: 'Como você tende a responder quando a situação aperta: regulando e organizando, reagindo no calor do momento, ou se afastando do problema.',
};

const HERO_EYEBROW: Record<Lang, string> = {
    es: 'Tu perfil hoy',
    en: 'Your profile today',
    pt: 'Seu perfil hoje',
};

// "{niño} y tú" (tuteo; el producto no usa voseo). Encabeza el informe como el vínculo, no como "informe para el adulto".
const AND_YOU: Record<Lang, string> = { es: 'y tú', en: 'and you', pt: 'e você' };

const SWITCHER_LABEL: Record<Lang, string> = {
    es: 'Los puentes con',
    en: 'Bridges with',
    pt: 'As pontes com',
};

const EMAIL_NOTE: Record<Lang, (email?: string) => string> = {
    es: (email) => email
        ? `También te enviamos este informe a ${email}. Puedes revisarlo cuando quieras.`
        : 'También te enviamos este informe por email.',
    en: (email) => email
        ? `We also sent this report to ${email}. You can revisit it whenever you want.`
        : 'We also sent this report by email.',
    pt: (email) => email
        ? `Também enviamos este relatório para ${email}. Você pode revisitá-lo quando quiser.`
        : 'Também enviamos este relatório por email.',
};

const FOREVER_NOTE: Record<Lang, string> = {
    es: 'Guardamos tu perfil para reutilizarlo en nuevos puentes sin repetir el cuestionario. Si quieres que lo eliminemos, escríbenos a hola@argomethod.com.',
    en: 'We keep your profile so we can reuse it for new bridges without repeating the questionnaire. If you want us to delete it, write to hola@argomethod.com.',
    pt: 'Guardamos seu perfil para reutilizá-lo em novas pontes sem repetir o questionário. Se quiser que apaguemos, escreva para hola@argomethod.com.',
};

const GENERATING_NOTE: Record<Lang, (child: string | null) => string> = {
    es: (child) => `Todavía estamos generando los puentes con ${child ?? 'el niño'}. Esto suele tardar unos segundos.`,
    en: (child) => `We are still generating the bridges with ${child ?? 'the child'}. This usually takes a few seconds.`,
    pt: (child) => `Ainda estamos gerando as pontes com ${child ?? 'a criança'}. Geralmente leva alguns segundos.`,
};

// Conector de la veta en el nombre serif, por idioma. Mismas formas que getVetaLabel (banda afirmada):
// es "con veta X", en "with a X lean", pt "com veta X" — troceado en pre/word/post para colorear la X.
function vetaConnector(lang: Lang, secondary: AdultAxis): { pre: string; word: string; post: string } {
    const word = getArchetypeLabel(secondary, lang);
    if (lang === 'en') return { pre: 'with a', word, post: 'lean' };
    if (lang === 'pt') return { pre: 'com veta', word, post: '' };
    return { pre: 'con veta', word, post: '' };
}

/** "Composición": reparte los 4 ejes (D,I,S,C) en % de sus votos, redondeo por resto mayor (Hamilton)
 *  para que sumen 100 exactos — misma lógica que computeMezcla del informe del niño (reportV4.ts). */
function computeMezcla(counts: Record<AdultAxis, number>): { axis: AdultAxis; pct: number }[] {
    const c = EJE_ORDER.map((a) => counts[a] ?? 0);
    const total = c.reduce((s, x) => s + x, 0);
    if (total === 0) return EJE_ORDER.map((axis) => ({ axis, pct: 0 }));
    const raw = c.map((x) => (x / total) * 100);
    const pcts = raw.map(Math.floor);
    const remainder = 100 - pcts.reduce((s, x) => s + x, 0);
    const byFrac = raw.map((r, i) => ({ i, frac: r - Math.floor(r) })).sort((a, b) => b.frac - a.frac);
    for (let k = 0; k < remainder; k++) pcts[byFrac[k].i]++;
    return EJE_ORDER.map((axis, i) => ({ axis, pct: pcts[i] }));
}

const ORB_RING = (
    <svg className="orb-ring" viewBox="0 0 400 360" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <circle cx="232" cy="172" r="152" fill="none" stroke="#D4BCE8" strokeWidth="1" strokeDasharray="2 8" opacity="0.6" />
    </svg>
);

// CSS específico del Puente (clases que el rediseño del niño no tiene): divider del hero, bajada de sección,
// sub-header del widget de presión, las 3 etiquetas del espectro, la triada de los puentes y la reflexión.
// Scope-eado bajo `.argo-report-v4` (misma raíz que REPORT_REDESIGN_CSS) para no filtrar al resto de la app.
const PUENTE_REDESIGN_CSS = `
.argo-report-v4 .card + .card{margin-top:14px;}
.argo-report-v4 .hero-divider{height:1px;margin:26px 0 20px;background:linear-gradient(90deg,transparent,var(--border) 12%,var(--border) 88%,transparent);}
.argo-report-v4 .sec-sub{margin:-5px 0 9px 15px;font-size:12.5px;color:var(--grey);}
.argo-report-v4 .widget-h{display:flex;align-items:center;gap:7px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--grey);margin-bottom:16px;}
.argo-report-v4 .sp-labels3{position:relative;height:14px;margin-top:12px;}
.argo-report-v4 .sp-labels3 span{position:absolute;transform:translateX(-50%);font-size:10.5px;font-weight:500;color:var(--light);white-space:nowrap;}
.argo-report-v4 .sp-labels3 .sp-on{color:var(--v600);font-weight:700;}
.argo-report-v4 .triad{display:flex;flex-direction:column;gap:14px;}
.argo-report-v4 .tri{padding:1px 0 1px 14px;border-left:2px solid;}
.argo-report-v4 .tri-label{display:block;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px;}
.argo-report-v4 .tri-text{display:block;font-size:14px;line-height:1.65;color:var(--sec);}
.argo-report-v4 .tri-text strong{font-weight:600;color:var(--navy);}
.argo-report-v4 .refl-sep{height:1px;margin:16px 0 14px;background:linear-gradient(90deg,transparent,var(--border) 18%,var(--border) 82%,transparent);}
.argo-report-v4 .refl{font-size:13.5px;line-height:1.65;color:var(--sec);}
.argo-report-v4 .refl strong{font-weight:600;color:var(--navy);}
.argo-report-v4 .refl-label{display:block;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--v600);margin-bottom:5px;}
.argo-report-v4 .notes{margin-top:24px;padding:0 6px;color:var(--grey);}
.argo-report-v4 .notes p{margin:0 0 6px;font-size:12px;line-height:1.6;}
.argo-report-v4 .notes .notes-mut{color:var(--light);font-size:11px;}
/* El punto de encuentro: dos orbes de vidrio (adulto + niño) cruzándose, centrados; texto debajo */
.argo-report-v4 .enc-orbs{position:relative;height:184px;margin:8px 0 18px;}
.argo-report-v4 .enc-orb{position:absolute;top:20px;width:150px;height:150px;border-radius:50%;will-change:border-radius;}
.argo-report-v4 .enc-orb-a{left:calc(50% - 135px);animation:argoOrbMorphA 9s ease-in-out infinite;}
.argo-report-v4 .enc-orb-c{left:calc(50% - 15px);animation:argoOrbMorphB 11s ease-in-out infinite;}
.argo-report-v4 .enc-pill-a{top:6px;left:calc(50% - 162px);right:auto;bottom:auto;}
.argo-report-v4 .enc-pill-c{bottom:6px;right:calc(50% - 162px);top:auto;left:auto;}
@media (prefers-reduced-motion:reduce){.argo-report-v4 .enc-orb{animation:none;}}
`;

/** Header de sección: punto de eje + título + (i) InfoTip + bajada opcional + hairline. */
function SectionHeader({ titulo, dotColor, tip, sub }: { titulo: string; dotColor: string; tip?: string; sub?: string }) {
    return (
        <>
            <h2 className="sec-h">
                <span className="dot" style={{ background: dotColor }} />
                <span>{titulo}</span>
                {tip && <InfoTip text={tip} />}
            </h2>
            {sub && <div className="sec-sub">{sub}</div>}
            <div className="title-rule" />
        </>
    );
}

/** Estado failure / generating de un puente (el niño activo sin ai_sections). */
const StateCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <section className="card">
        <div className="py-6 text-center">{children}</div>
    </section>
);

export function PuentesReport({
    lang,
    adultProfile,
    recipientEmail,
    fecha,
    children,
    onRetryChild,
}: Props) {
    const c = getPuentesCopy(lang);
    const fadeRef = useCardFade<HTMLDivElement>();
    const [activeIdx, setActiveIdx] = useState(0);
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        const url = window.location.href;
        const flash = () => { setCopied(true); setTimeout(() => setCopied(false), 2000); };
        // navigator.clipboard rejects (or is undefined) on denied permission,
        // http, or older in-app webviews — fall back to a hidden textarea so
        // the tap never dies silently with an unhandled rejection.
        const legacyCopy = () => {
            try {
                const ta = document.createElement('textarea');
                ta.value = url; ta.style.position = 'fixed'; ta.style.opacity = '0';
                document.body.appendChild(ta); ta.select();
                document.execCommand('copy'); document.body.removeChild(ta);
                flash();
            } catch { /* nothing more we can do; leave the URL in the address bar */ }
        };
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(url).then(flash).catch(legacyCopy);
        } else {
            legacyCopy();
        }
    };

    const activeChild = children[activeIdx] ?? null;
    const ai = activeChild?.ai_sections ?? null;

    // Colores de eje (nunca hardcodeados): primario del adulto = acento; veta = segundo eje; niño = triada.
    const accent = adultProfile?.eje_primary ? AXIS_COLORS[adultProfile.eje_primary] : V500;
    const vetaAxis = adultProfile?.eje_secondary ?? null;
    const vetaColor = vetaAxis ? AXIS_COLORS[vetaAxis] : V500;
    const childAxis = activeChild?.child_profile?.eje;
    const childAxisColor = childAxis && AXIS_COLORS[childAxis] ? AXIS_COLORS[childAxis] : '#86868B';

    const veta = adultProfile && vetaAxis ? vetaConnector(lang, vetaAxis) : null;
    const primaryLabel = adultProfile ? getArchetypeLabel(adultProfile.eje_primary, lang) : '';
    const mezcla = adultProfile?.axis_counts ? computeMezcla(adultProfile.axis_counts) : null;
    const pressurePos = adultProfile ? (PRESS_POS[adultProfile.pressure_style] ?? 0.5) * 100 : 50;
    const pressDisplay = PRESSURE_DISPLAY[lang] ?? PRESSURE_DISPLAY.es;

    const showSwitcher = useMemo(() => children.length > 1, [children]);

    return (
        <div className="min-h-screen bg-argo-neutral">
            {/* Top bar (matches the child report) */}
            <div className="no-print sticky top-0 z-10 bg-white border-b border-argo-border px-4 sm:px-6 py-3 flex items-center justify-between">
                <div className="flex items-center tracking-tight">
                    <span className="font-[800] text-base text-argo-navy">Argo</span>
                    <span className="font-[100] text-base text-argo-grey">Method®</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 text-xs font-medium text-argo-secondary border border-argo-border px-3 py-1.5 rounded-lg hover:bg-argo-bg transition-colors"
                    >
                        {copied
                            ? <><CheckCircle size={13} className="text-green-600" />{COPIED_LABEL[lang]}</>
                            : <><Link2 size={13} />{SHARE_LABEL[lang]}</>
                        }
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-1.5 text-xs font-medium text-argo-secondary border border-argo-border px-3 py-1.5 rounded-lg hover:bg-argo-bg transition-colors"
                    >
                        <Printer size={13} />{PRINT_LABEL[lang]}
                    </button>
                </div>
            </div>

            {/* Report body — scoped under .argo-report-v4 so the shared redesign CSS applies. Light theme only. */}
            <div ref={fadeRef} className="argo-report-v4 max-w-[700px] mx-auto px-4 sm:px-[18px] pt-6 pb-16">
                <style dangerouslySetInnerHTML={{ __html: REPORT_REDESIGN_CSS + PUENTE_REDESIGN_CSS }} />

                <motion.div>
                    {/* Child switcher (only when >1 children). Selecting a child swaps the per-child prose. */}
                    {showSwitcher && (
                        <section className="card">
                            <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-argo-grey mb-3">
                                {SWITCHER_LABEL[lang]}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {children.map((entry, idx) => {
                                    const eje = entry.child_profile?.eje;
                                    const color = eje && AXIS_COLORS[eje] ? AXIS_COLORS[eje] : '#86868B';
                                    const isActive = idx === activeIdx;
                                    const isReady = !!entry.ai_sections;
                                    const isFailed = entry.status === 'failed';
                                    // A failed bridge must be reachable so its retry card
                                    // shows; only a still-generating child stays disabled.
                                    const isSelectable = isReady || isFailed;
                                    return (
                                        <button
                                            key={entry.puentes_session_id}
                                            type="button"
                                            onClick={() => isSelectable && setActiveIdx(idx)}
                                            disabled={!isSelectable}
                                            className={[
                                                'px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5',
                                                isActive
                                                    ? 'text-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                                                    : isSelectable
                                                        ? 'text-argo-navy bg-argo-bg hover:bg-argo-neutral border border-argo-border'
                                                        : 'text-argo-grey bg-argo-bg border border-argo-border cursor-not-allowed opacity-60',
                                            ].join(' ')}
                                            style={isActive ? { backgroundColor: color } : undefined}
                                        >
                                            <span
                                                className="w-1.5 h-1.5 rounded-full"
                                                style={{ backgroundColor: isActive ? '#fff' : isFailed ? '#dc2626' : color }}
                                            />
                                            {entry.child_name || '—'}
                                            {!isReady && (
                                                <span className={`ml-1 text-[10px] ${isFailed ? 'text-red-500' : 'text-argo-grey'}`}>
                                                    {isFailed ? '!' : '…'}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* ── HERO: adult's eje×veta name in serif + two glass orbs + saludo below a hairline ── */}
                    <div className="card hero-lux">
                        <div className="hx-grid">
                            <div className="hx-left">
                                <div className="hx-meta">
                                    <div className="kidmeta">{(activeChild?.child_name || '—')} {AND_YOU[lang]}{fecha ? ` · ${fecha}` : ''}</div>
                                </div>
                                <p className="hx-eyebrow">{HERO_EYEBROW[lang]}</p>
                                {adultProfile && (
                                    <h1 className="hx-name">
                                        <span className="np" style={{ color: accent }}>{primaryLabel}</span>
                                        {veta && (
                                            <>
                                                {' '}<span className="nc">{veta.pre}</span>{' '}
                                                <span className="nv" style={{ color: vetaColor }}>{veta.word}</span>
                                                {veta.post && <>{' '}<span className="nc">{veta.post}</span></>}
                                            </>
                                        )}
                                    </h1>
                                )}
                                {ai && <p className="hx-lead">{renderRich(ai.saludo)}</p>}
                            </div>
                            {adultProfile && (
                                <div className="hx-right">
                                    {ORB_RING}
                                    {veta ? (
                                        <>
                                            <div className="orb orb-1" style={{ background: orbBg(accent), boxShadow: orbShadow(accent) }} />
                                            <div className="orb orb-2" style={{ width: '56%', background: orbBg(vetaColor), boxShadow: orbShadow(vetaColor) }} />
                                            <div className="opill opill-1"><span className="opill-dot" style={{ background: accent }} />{primaryLabel}</div>
                                            <div className="opill opill-2"><span className="opill-dot" style={{ background: vetaColor }} />{veta.word}</div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="orb orb-1 orb-solo" style={{ background: orbBg(accent), boxShadow: orbShadow(accent) }} />
                                            <div className="opill-solo"><span className="opill-dot" style={{ background: accent }} />{primaryLabel}</div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── EL PUNTO DE ENCUENTRO: orbes cruzándose (adulto + niño) a la izquierda + puntos en común a la derecha ── */}
                    {adultProfile && childAxis && (
                        <section className="card">
                            <SectionHeader titulo={ENCUENTRO_LABEL[lang]} dotColor={V600} sub={`${activeChild?.child_name || ''} ${AND_YOU[lang]}`} />
                            <div className="enc-orbs">
                                <div className="enc-orb enc-orb-a" style={{ background: orbBg(accent), boxShadow: orbShadow(accent) }} />
                                <div className="enc-orb enc-orb-c" style={{ background: orbBg(childAxisColor), boxShadow: orbShadow(childAxisColor) }} />
                                <div className="opill enc-pill-a"><span className="opill-dot" style={{ background: accent }} />{TU_LABEL[lang]} · {primaryLabel}</div>
                                <div className="opill enc-pill-c"><span className="opill-dot" style={{ background: childAxisColor }} />{activeChild?.child_name} · {getArchetypeLabel(childAxis as 'D' | 'I' | 'S' | 'C', lang)}</div>
                            </div>
                            {ai?.punto_encuentro && <p className="body">{renderRich(ai.punto_encuentro)}</p>}
                        </section>
                    )}

                    {/* ── COMPOSICIÓN: 4-orb mezcla + "Estilo bajo presión" spectrum (both per-adult).
                        Mezcla only when axis_counts exist (old sessions fall back to just the spectrum). ── */}
                    {adultProfile && (
                        <section className="card">
                            <SectionHeader titulo={COMPOSITION_LABEL[lang]} dotColor={accent} tip={COMPOSITION_TIP[lang]} />
                            {mezcla && (
                                <div className="mezcla">
                                    {mezcla.map(({ axis, pct }) => {
                                        const MIN = 22, MAX = 92;
                                        const d = Math.round(MIN + (pct / 100) * (MAX - MIN));
                                        const col = AXIS_COLORS[axis] ?? '#86868B';
                                        return (
                                            <div key={axis} className="mz-col">
                                                <div className="mz-orb" style={{
                                                    width: d, height: d, background: orbBg(col), boxShadow: orbShadow(col),
                                                    animation: `${MZ_MORPH[axis] ?? 'argoOrbMorphA'} ${MZ_DUR[axis] ?? '9s'} ease-in-out infinite`,
                                                }} />
                                                <div className="mz-axis"><span className="mz-dot" style={{ background: col }} />{getArchetypeLabel(axis, lang)}</div>
                                                <div className="mz-pct" style={{ color: col }}>{pct}%</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            {mezcla && <div className="mz-divider" />}
                            <div className="widget-h"><span>{PRESSURE_LABEL[lang]}</span><InfoTip text={PRESSURE_TIP[lang]} /></div>
                            <div className="spectrum">
                                <div className="sp-track">
                                    <span className="sp-mark" style={{ left: `${pressurePos}%`, background: orbBg(V500), boxShadow: orbShadow(V500) }} />
                                </div>
                                <div className="sp-labels3">
                                    {(['regulado', 'reactivo', 'evitativo'] as const).map((k) => (
                                        <span key={k} className={k === adultProfile.pressure_style ? 'sp-on' : ''} style={{ left: `${PRESS_POS[k] * 100}%` }}>
                                            {pressDisplay[k]}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* ── TU ESTILO NATURAL ── */}
                    {ai && (
                        <section className="card">
                            <SectionHeader titulo={c.report.adultProfileLabel} dotColor={accent} />
                            <p className="body">{renderRich(ai.perfil_adulto_breve)}</p>
                        </section>
                    )}

                    {/* ── THE 5 BRIDGES of the active child ── */}
                    {ai?.puentes.map((p, idx) => {
                        // Real engine titulo is "Title: bajada" — split on the first ": " for header + sub.
                        const sep = p.titulo.indexOf(': ');
                        const title = sep >= 0 ? p.titulo.slice(0, sep) : p.titulo;
                        const bajada = sep >= 0 ? p.titulo.slice(sep + 2) : undefined;
                        return (
                            <React.Fragment key={`${activeChild?.puentes_session_id}-${idx}`}>
                                {idx > 0 && <div className="sec-divider" />}
                                <section className="card">
                                    <SectionHeader titulo={title} dotColor={accent} sub={bajada} />
                                    <div className="triad">
                                        <div className="tri" style={{ borderColor: childAxisColor }}>
                                            <span className="tri-label" style={{ color: childAxisColor }}>{c.report.sectionChildState}</span>
                                            <span className="tri-text">{renderRich(p.como_esta_el)}</span>
                                        </div>
                                        <div className="tri" style={{ borderColor: accent }}>
                                            <span className="tri-label" style={{ color: accent }}>{c.report.sectionAdultStrength}</span>
                                            <span className="tri-text">{renderRich(p.lo_que_traes)}</span>
                                        </div>
                                        <div className="tri" style={{ borderColor: V600 }}>
                                            <span className="tri-label" style={{ color: V600 }}>{c.report.sectionBridge}</span>
                                            <span className="tri-text">{renderRich(p.el_puente)}</span>
                                        </div>
                                    </div>
                                    <div className="refl-sep" />
                                    <div className="refl">
                                        <span className="refl-label">{c.report.sectionReflection}</span>
                                        {renderRich(p.pregunta_reflexion)}
                                    </div>
                                </section>
                            </React.Fragment>
                        );
                    })}

                    {/* ── CIERRE ── */}
                    {ai && (
                        <section className="card">
                            <SectionHeader titulo={c.report.closingLabel} dotColor={accent} />
                            <p className="body">{renderRich(ai.cierre)}</p>
                        </section>
                    )}

                    {/* Active child's generation FAILED: say so and offer a retry. */}
                    {!ai && activeChild && activeChild.status === 'failed' && (
                        <StateCard>
                            <p className="text-sm text-argo-secondary">{c.errors.failedBridge}</p>
                            {onRetryChild && (
                                <button
                                    onClick={() => onRetryChild(activeChild.puentes_session_id)}
                                    className="mt-4 inline-block text-sm font-semibold text-white bg-argo-violet-500 hover:bg-argo-violet-600 px-5 py-2.5 rounded-lg transition-colors"
                                >
                                    {c.errors.retry}
                                </button>
                            )}
                        </StateCard>
                    )}

                    {/* Active child still generating. */}
                    {!ai && activeChild && activeChild.status !== 'failed' && (
                        <StateCard>
                            <div className="inline-block w-10 h-10 rounded-full border-4 border-argo-violet-100 border-t-argo-violet-500 animate-spin mb-4" />
                            <p className="text-sm text-argo-secondary">{GENERATING_NOTE[lang](activeChild.child_name)}</p>
                        </StateCard>
                    )}

                    {/* ── EMAIL + FOREVER NOTES ── */}
                    <div className="notes">
                        <p>{EMAIL_NOTE[lang](recipientEmail ?? undefined)}</p>
                        <p className="notes-mut">{FOREVER_NOTE[lang]}</p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
