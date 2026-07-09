import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Printer, Link2, CheckCircle } from 'lucide-react';
import { AXIS_COLORS, AXIS_LABELS, AXIS_CHIP } from '../../lib/designTokens';
import { getPuentesCopy } from '../../lib/puentesTranslations';
import type {
    AdultAxis,
    AdultProfile,
    Lang,
    PuentesAiSections,
} from '../../types/puentes';

interface ChildProfileSnapshot {
    eje: string;
    motor: string;
    archetype_label: string;
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
    children: ChildEntry[];
}

const EJE_ORDER: AdultAxis[] = ['D', 'I', 'S', 'C'];


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
    es: 'Composición del perfil',
    en: 'Profile composition',
    pt: 'Composição do perfil',
};

const PAGE_EYEBROW: Record<Lang, string> = {
    es: 'Informe para el adulto',
    en: 'Report for the adult',
    pt: 'Relatório para o adulto',
};

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
    es: 'Guardamos tu perfil para siempre, así sumamos a tus hijos futuros sin volver a cobrarte. Si quieres que lo eliminemos, escríbenos a hola@argomethod.com.',
    en: 'We keep your profile forever, so we can add your future children without charging you again. If you want us to delete it, write to hola@argomethod.com.',
    pt: 'Guardamos seu perfil para sempre, para podermos adicionar seus futuros filhos sem cobrar novamente. Se quiser que apaguemos, escreva para hola@argomethod.com.',
};

const SectionIcons: Record<string, React.ReactNode> = {
    compass: (
        <svg viewBox="0 0 16 16" fill="none" stroke="#6366f1" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="8" r="6.5"/><path d="M8 3v2M8 11v2M3 8h2M11 8h2"/><circle cx="8" cy="8" r="1.5" fill="#6366f1" stroke="none"/>
        </svg>
    ),
    welcome: (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 8.5V4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h4.5"/><path d="M10.5 10.5l1.5 1.5 3-3"/>
        </svg>
    ),
    profile: (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 2C6.5 4 4 6.5 4 9a4 4 0 0 0 8 0c0-2.5-2.5-5-4-7z"/>
        </svg>
    ),
    bridge1: (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12L8 3l6 9"/><path d="M2 14h12"/>
        </svg>
    ),
    bridge2: (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 2L3 9h4l-1 5 6-7h-4z"/>
        </svg>
    ),
    bridge3: (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 8a3 3 0 0 1 3-3h2a3 3 0 0 1 3 3a3 3 0 0 1-3 3H5l-2 2v-2.3"/>
            <circle cx="11" cy="12" r="1" fill="currentColor" stroke="none"/>
        </svg>
    ),
    bridge4: (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12h12"/><path d="M5 9l3-5 3 5"/><circle cx="11" cy="3" r="1" fill="currentColor" stroke="none"/>
        </svg>
    ),
    reflection: (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 14c3.3 0 6-2.7 6-6S11.3 2 8 2 2 4.7 2 8c0 1.2.4 2.3 1 3.2L2 14l3-1"/>
        </svg>
    ),
    closing: (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="12" height="12" rx="2"/><path d="M5 8l2 2 4-4"/>
        </svg>
    ),
    info: (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="8" r="6.5"/><path d="M8 5.5v3"/><circle cx="8" cy="11.5" r="0.5" fill="currentColor" stroke="none"/>
        </svg>
    ),
    mail: (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3.5" width="12" height="9" rx="1.5"/><path d="M2.5 4.5l5.5 4 5.5-4"/>
        </svg>
    ),
    pending: (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="8" r="6.5"/><polyline points="8 4 8 8 11 10"/>
        </svg>
    ),
};

const SectionTitle: React.FC<{ title: string; icon: React.ReactNode }> = ({ title, icon }) => (
    <div className="mb-5 flex items-center gap-2">
        <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center text-argo-grey">
            <span className="w-4 h-4 block">{icon}</span>
        </span>
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-argo-grey m-0">
            {title}
        </h3>
    </div>
);

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-white rounded-[14px] p-7 shadow-argo ${className}`}>
        {children}
    </div>
);

interface AxisBarsProps {
    counts: Record<AdultAxis, number>;
    dominant: AdultAxis;
    label: string;
}

// Styled to match the child's report composition (ReportPage AxisBars): a
// labelled section with a top separator, gray axis names, pill tracks, the
// dominant axis at full color and the rest faded — no dots, no % numbers.
const AxisBars: React.FC<AxisBarsProps> = ({ counts, dominant, label }) => {
    const maxCount = Math.max(...EJE_ORDER.map(a => counts[a] || 0), 1);
    return (
        <div className="mt-4 pt-4 border-t border-argo-border">
            <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-argo-light mb-3">{label}</p>
            <div className="space-y-2">
                {EJE_ORDER.map(axis => {
                    const pct = ((counts[axis] || 0) / maxCount) * 100;
                    const isDominant = axis === dominant;
                    return (
                        <div key={axis} className="flex items-center gap-3">
                            <span className="text-[11px] font-medium text-argo-grey w-20 flex-shrink-0">
                                {AXIS_LABELS[axis]}
                            </span>
                            <div className="flex-1 bg-argo-bg rounded-full h-2 overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0, 0, 1] }}
                                    style={{ background: AXIS_COLORS[axis], opacity: isDominant ? 1 : 0.35 }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

interface PressureIndicatorProps {
    pressure: 'regulado' | 'reactivo' | 'evitativo';
    lang: Lang;
}

const PressureIndicator: React.FC<PressureIndicatorProps> = ({ pressure, lang }) => {
    const order: Array<'regulado' | 'reactivo' | 'evitativo'> = ['regulado', 'reactivo', 'evitativo'];
    const display = PRESSURE_DISPLAY[lang] ?? PRESSURE_DISPLAY.es;
    return (
        <div className="mt-5 pt-4 border-t border-black/[0.06]">
            <div className="text-[10px] text-argo-grey font-semibold tracking-[0.12em] uppercase mb-2">
                {PRESSURE_LABEL[lang]}
            </div>
            <div className="flex gap-[3px]">
                {order.map(p => (
                    <div
                        key={p}
                        className={`h-1 flex-1 rounded-sm ${p === pressure ? 'bg-argo-violet-500' : 'bg-black/[0.06]'}`}
                    />
                ))}
            </div>
            <div className="flex justify-between mt-1.5">
                {order.map(p => (
                    <span
                        key={p}
                        className={`text-[10px] tracking-wide ${p === pressure ? 'text-argo-violet-500 font-bold' : 'text-argo-grey font-medium'}`}
                    >
                        {display[p]}
                    </span>
                ))}
            </div>
        </div>
    );
};

interface SubBlockProps {
    label: string;
    text: string;
    color: string;
    labelColor?: string;
}

const SubBlock: React.FC<SubBlockProps> = ({ label, text, color, labelColor }) => (
    <div className="flex border border-[#D2D2D7] rounded-xl overflow-hidden">
        <div className="w-1 flex-shrink-0" style={{ backgroundColor: color }} />
        <div className="flex-1 p-4">
            <p
                className="text-[10px] font-bold tracking-[0.16em] uppercase mb-1.5 m-0"
                style={{ color: labelColor ?? color }}
            >
                {label}
            </p>
            <p className="text-[13px] text-argo-secondary leading-relaxed m-0">{text}</p>
        </div>
    </div>
);

const Reflection: React.FC<{ label: string; text: string }> = ({ label, text }) => (
    <div className="mt-4 p-4 bg-[#F5F5F7] rounded-xl flex items-start gap-2.5">
        <span className="w-4 h-4 flex-shrink-0 mt-0.5 text-argo-violet-500">
            {SectionIcons.reflection}
        </span>
        <div className="flex-1">
            <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-argo-violet-500 mb-1 m-0">
                {label}
            </p>
            <p className="text-[13px] text-argo-navy font-medium leading-relaxed m-0">{text}</p>
        </div>
    </div>
);

const BRIDGE_ICONS = [
    SectionIcons.bridge1,
    SectionIcons.bridge2,
    SectionIcons.bridge3,
    SectionIcons.bridge4,
];

export function PuentesReport({
    lang,
    adultProfile,
    recipientEmail,
    recipientName,
    children,
}: Props) {
    const c = getPuentesCopy(lang);
    const [activeIdx, setActiveIdx] = useState(0);
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    // Filter children that have ai_sections — those that don't are still
    // generating; we still show them in the switcher with a pending state.
    const activeChild = children[activeIdx] ?? null;
    const ai = activeChild?.ai_sections ?? null;

    const adultAxis = adultProfile?.eje_primary;
    const adultAxisColor = adultAxis ? AXIS_COLORS[adultAxis] : '#955FB5';
    const childAxis = activeChild?.child_profile?.eje;
    const childAxisColor = childAxis && AXIS_COLORS[childAxis] ? AXIS_COLORS[childAxis] : '#86868B';
    const violet = '#955FB5';

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

            <div className="max-w-lg mx-auto px-4 py-8">
                {/* Page header — the adult this report is for */}
                <div className="mb-6">
                    <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-argo-light mb-1.5">{PAGE_EYEBROW[lang]}</p>
                    {recipientName && (
                        <h1 className="text-2xl font-bold text-argo-navy tracking-tight">{recipientName}</h1>
                    )}
                    {recipientEmail && (
                        <p className="text-xs text-argo-light mt-0.5">{recipientEmail}</p>
                    )}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3 pb-20"
                >
                    {/* ── 1. BRÚJULA: shared adult header (white card, like the child report) ── */}
                    <div className="bg-white rounded-[14px] shadow-argo p-7">
                        <div className="text-[28px] tracking-tight leading-tight">
                            <span className="font-[800] text-argo-navy">Argo</span><span className="font-[100] text-argo-grey">Puente®</span>
                        </div>

                {adultProfile && (
                    <div className="flex items-center gap-2.5 mt-3.5 flex-wrap">
                        <span
                            className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ background: adultAxisColor }}
                        />
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${AXIS_CHIP[adultProfile.eje_primary] ?? 'bg-violet-50 text-violet-700 border-violet-200'}`}>
                            {AXIS_LABELS[adultProfile.eje_primary]}
                        </span>
                        {adultProfile.eje_secondary && (
                            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${AXIS_CHIP[adultProfile.eje_secondary] ?? 'bg-violet-50 text-violet-700 border-violet-200'}`}>
                                con veta {AXIS_LABELS[adultProfile.eje_secondary]}
                            </span>
                        )}
                    </div>
                )}

                {adultProfile?.axis_counts && (
                    <AxisBars counts={adultProfile.axis_counts} dominant={adultProfile.eje_primary} label={COMPOSITION_LABEL[lang]} />
                )}

                {adultProfile && (
                    <PressureIndicator pressure={adultProfile.pressure_style} lang={lang} />
                )}
            </div>

            {/* ── 2. CHILD SWITCHER (only when >1 children) ───────────────────── */}
            {showSwitcher && (
                <Card>
                    <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-argo-grey mb-3">
                        {SWITCHER_LABEL[lang]}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {children.map((entry, idx) => {
                            const eje = entry.child_profile?.eje;
                            const color = eje && AXIS_COLORS[eje] ? AXIS_COLORS[eje] : '#86868B';
                            const isActive = idx === activeIdx;
                            const isReady = !!entry.ai_sections;
                            return (
                                <button
                                    key={entry.puentes_session_id}
                                    type="button"
                                    onClick={() => isReady && setActiveIdx(idx)}
                                    disabled={!isReady}
                                    className={[
                                        'px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5',
                                        isActive
                                            ? 'text-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                                            : isReady
                                                ? 'text-argo-navy bg-argo-bg hover:bg-argo-neutral border border-argo-border'
                                                : 'text-argo-grey bg-argo-bg border border-argo-border cursor-not-allowed opacity-60',
                                    ].join(' ')}
                                    style={isActive ? { backgroundColor: color } : undefined}
                                >
                                    <span
                                        className="w-1.5 h-1.5 rounded-full"
                                        style={{ backgroundColor: isActive ? '#fff' : color }}
                                    />
                                    {entry.child_name || '—'}
                                    {!isReady && (
                                        <span className="ml-1 w-3 h-3 inline-block text-argo-grey">
                                            {SectionIcons.pending}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </Card>
            )}

            {/* ── 3. SALUDO ────────────────────────────────────────────────────── */}
            {ai && (
                <Card>
                    <SectionTitle title={c.report.greetingLabel} icon={SectionIcons.welcome} />
                    <p className="text-[14px] text-argo-secondary leading-relaxed m-0">{ai.saludo}</p>
                    <div className="mt-5 flex items-start gap-2.5 p-3.5 bg-[#F5F5F7] rounded-xl">
                        <span className="w-4 h-4 flex-shrink-0 mt-0.5 text-argo-grey">{SectionIcons.info}</span>
                        <p className="text-[11px] text-argo-grey leading-relaxed m-0">
                            {lang === 'en'
                                ? 'ArgoPuente® is not a clinical or therapeutic service. It is a lens for self-knowledge and connection in sport.'
                                : lang === 'pt'
                                    ? 'ArgoPuente® não é um serviço clínico nem terapêutico. É uma lente para o autoconhecimento e a conexão no esporte.'
                                    : 'ArgoPuente® no es un servicio clínico ni terapéutico. Es una lente para autoconocerte y tender puentes con el niño en el deporte.'}
                        </p>
                    </div>
                </Card>
            )}

            {/* ── 4. TU ESTILO NATURAL ────────────────────────────────────────── */}
            {ai && (
                <Card>
                    <SectionTitle title={c.report.adultProfileLabel} icon={SectionIcons.profile} />
                    <p className="text-[14px] text-argo-secondary leading-relaxed m-0">{ai.perfil_adulto_breve}</p>
                </Card>
            )}

            {/* ── 5-8. LOS 4 PUENTES of the active child ──────────────────────── */}
            {ai?.puentes.map((p, idx) => (
                <motion.div
                    key={`${activeChild?.puentes_session_id}-${idx}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06 }}
                >
                    <Card>
                        <SectionTitle title={c.report.puenteLabel(idx + 1)} icon={BRIDGE_ICONS[idx] ?? SectionIcons.bridge1} />
                        <h2 className="text-[22px] font-light tracking-tight leading-tight text-argo-navy mb-4">
                            {p.titulo}
                        </h2>

                        <div className="flex flex-col gap-2.5 mt-4">
                            <SubBlock
                                label={c.report.sectionChildState}
                                text={p.como_esta_el}
                                color={childAxisColor}
                            />
                            <SubBlock
                                label={c.report.sectionAdultStrength}
                                text={p.lo_que_traes}
                                color={adultAxisColor}
                            />
                            <SubBlock
                                label={c.report.sectionBridge}
                                text={p.el_puente}
                                color={violet}
                            />
                        </div>

                        <Reflection label={c.report.sectionReflection} text={p.pregunta_reflexion} />
                    </Card>
                </motion.div>
            ))}

            {/* ── 9. CIERRE ───────────────────────────────────────────────────── */}
            {ai && (
                <Card>
                    <SectionTitle title={c.report.closingLabel} icon={SectionIcons.closing} />
                    <p className="text-[14px] text-argo-secondary leading-relaxed m-0">{ai.cierre}</p>
                </Card>
            )}

            {/* If the active child is still generating */}
            {!ai && activeChild && (
                <Card>
                    <div className="text-center py-8">
                        <div className="inline-block w-10 h-10 rounded-full border-4 border-argo-violet-100 border-t-argo-violet-500 animate-spin mb-4" />
                        <p className="text-sm text-argo-secondary">
                            {lang === 'en'
                                ? `We are still generating the bridges with ${activeChild.child_name}. This usually takes a few seconds.`
                                : lang === 'pt'
                                    ? `Ainda estamos gerando as pontes com ${activeChild.child_name}. Geralmente leva alguns segundos.`
                                    : `Todavía estamos generando los puentes con ${activeChild.child_name}. Esto suele tardar unos segundos.`}
                        </p>
                    </div>
                </Card>
            )}

            {/* ── 10. EMAIL + FOREVER NOTES ───────────────────────────────────── */}
            <div className="px-7 py-3 text-argo-grey space-y-2">
                <div className="flex items-center gap-2">
                    <span className="w-4 h-4 flex-shrink-0">{SectionIcons.mail}</span>
                    <p className="text-[12px] m-0 leading-relaxed">{EMAIL_NOTE[lang](recipientEmail ?? undefined)}</p>
                </div>
                <div className="flex items-start gap-2">
                    <span className="w-4 h-4 flex-shrink-0 mt-0.5 text-argo-light">{SectionIcons.info}</span>
                    <p className="text-[11px] m-0 leading-relaxed text-argo-light">{FOREVER_NOTE[lang]}</p>
                </div>
            </div>
                </motion.div>
            </div>
        </div>
    );
}
