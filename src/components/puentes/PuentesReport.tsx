import React from 'react';
import { motion } from 'framer-motion';
import { AXIS_COLORS, AXIS_LABELS } from '../../lib/designTokens';
import { getPuentesCopy } from '../../lib/puentesTranslations';
import type {
    AdultAxis,
    AdultProfile,
    Lang,
    PuentesAiSections,
} from '../../types/puentes';

interface ChildProfile {
    eje: string;
    motor: string;
    archetype_label: string;
    sport: string;
}

interface Props {
    aiSections: PuentesAiSections;
    lang: Lang;
    adultProfile?: AdultProfile | null;
    childProfile?: ChildProfile | null;
    recipientEmail?: string | null;
}

const EJE_ORDER: AdultAxis[] = ['D', 'I', 'S', 'C'];

const MOTOR_DISPLAY: Record<string, Record<string, string>> = {
    es: { agil: 'Ágil', equilibrado: 'Equilibrado', profundo: 'Profundo' },
    en: { agil: 'Agile', equilibrado: 'Balanced', profundo: 'Deep' },
    pt: { agil: 'Ágil', equilibrado: 'Equilibrado', profundo: 'Profundo' },
};

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

const ENCOUNTER_LABEL: Record<Lang, string> = {
    es: 'Carta de Navegación',
    en: 'Navigation Chart',
    pt: 'Carta de Navegação',
};

const EMAIL_NOTE: Record<Lang, (email?: string) => string> = {
    es: (email) => email
        ? `También te enviamos este informe a ${email}. Podés revisarlo cuando quieras.`
        : 'También te enviamos este informe por email. Podés revisarlo cuando quieras.',
    en: (email) => email
        ? `We also sent this report to ${email}. You can revisit it whenever you want.`
        : 'We also sent this report by email. You can revisit it whenever you want.',
    pt: (email) => email
        ? `Também enviamos este relatório para ${email}. Você pode revisitá-lo quando quiser.`
        : 'Também enviamos este relatório por email. Você pode revisitá-lo quando quiser.',
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
    <div className={`bg-white border border-[#D2D2D7] rounded-xl p-7 ${className}`}>
        {children}
    </div>
);

interface AxisBarsProps {
    counts: Record<AdultAxis, number>;
    dominant: AdultAxis;
}

const AxisBars: React.FC<AxisBarsProps> = ({ counts, dominant }) => {
    const total = EJE_ORDER.reduce((s, a) => s + (counts[a] || 0), 0) || 1;
    return (
        <div className="flex flex-col gap-3 mt-5 mb-1">
            {EJE_ORDER.map(axis => {
                const pct = Math.round(((counts[axis] || 0) / total) * 100);
                const isDominant = axis === dominant;
                return (
                    <div key={axis} className="flex items-center gap-2.5">
                        <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: AXIS_COLORS[axis] }}
                        />
                        <span className={`text-xs w-[90px] flex-shrink-0 ${isDominant ? 'font-extrabold text-argo-navy' : 'font-semibold text-argo-navy'}`}>
                            {AXIS_LABELS[axis]}
                        </span>
                        <div className="flex-1 h-2 bg-black/[0.06] rounded overflow-hidden">
                            <motion.div
                                className="h-full rounded"
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0, 0, 1] }}
                                style={{ backgroundColor: AXIS_COLORS[axis] }}
                            />
                        </div>
                        <span className={`text-[11px] w-8 text-right flex-shrink-0 ${isDominant ? 'font-bold text-argo-navy' : 'font-semibold text-argo-grey'}`}>
                            {pct}%
                        </span>
                    </div>
                );
            })}
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
    color: string;        // hex of the stripe + label tint
    labelColor?: string;  // optional override for the label tint (e.g. for violet bridge block)
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

export function PuentesReport({ aiSections, lang, adultProfile, childProfile, recipientEmail }: Props) {
    const c = getPuentesCopy(lang);

    const adultAxis = adultProfile?.eje_primary;
    const adultAxisColor = adultAxis ? AXIS_COLORS[adultAxis] : '#955FB5';
    const childAxis = childProfile?.eje;
    const childAxisColor = childAxis && AXIS_COLORS[childAxis] ? AXIS_COLORS[childAxis] : '#86868B';
    const violet = '#955FB5';
    const motorDisplay = adultProfile ? (MOTOR_DISPLAY[lang]?.[adultProfile.motor] ?? adultProfile.motor) : '';

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 max-w-lg mx-auto w-full pb-20"
        >
            {/* ── 1. BRÚJULA: header with adult profile ────────────────────────── */}
            <div className="bg-[#E3E3FF] border border-[#C8C8F0] rounded-xl p-7">
                <SectionTitle title={ENCOUNTER_LABEL[lang]} icon={SectionIcons.compass} />

                <h1 className="text-[28px] font-light tracking-tight leading-tight text-argo-navy">
                    {lang === 'en' ? 'Your bond' : lang === 'pt' ? 'Seu vínculo' : 'Tu vínculo'}
                </h1>
                <p className="text-sm text-argo-violet-500 italic mt-1">Argo Puentes</p>

                {/* Profile tags */}
                {adultProfile && (
                    <div className="flex flex-wrap gap-1.5 mt-3.5">
                        <span
                            className="px-3 py-1 rounded-full text-[11px] font-semibold text-white"
                            style={{ backgroundColor: adultAxisColor }}
                        >
                            {AXIS_LABELS[adultProfile.eje_primary]}
                        </span>
                        <span className="px-3 py-1 bg-argo-navy text-white rounded-full text-[11px] font-semibold">
                            {motorDisplay}
                        </span>
                        {adultProfile.eje_secondary && (
                            <span
                                className="px-3 py-1 rounded-full text-[11px] font-semibold border"
                                style={{
                                    borderColor: AXIS_COLORS[adultProfile.eje_secondary],
                                    color: AXIS_COLORS[adultProfile.eje_secondary],
                                    backgroundColor: '#fff',
                                }}
                            >
                                +{AXIS_LABELS[adultProfile.eje_secondary]}
                            </span>
                        )}
                    </div>
                )}

                {/* Axis bars (only when we have raw counts) */}
                {adultProfile?.axis_counts && (
                    <AxisBars counts={adultProfile.axis_counts} dominant={adultProfile.eje_primary} />
                )}

                {/* Pressure indicator */}
                {adultProfile && (
                    <PressureIndicator pressure={adultProfile.pressure_style} lang={lang} />
                )}
            </div>

            {/* ── 2. SALUDO ────────────────────────────────────────────────────── */}
            <Card>
                <SectionTitle title={c.report.greetingLabel} icon={SectionIcons.welcome} />
                <p className="text-[14px] text-argo-secondary leading-relaxed m-0">{aiSections.saludo}</p>
                <div className="mt-5 flex items-start gap-2.5 p-3.5 bg-[#F5F5F7] rounded-xl">
                    <span className="w-4 h-4 flex-shrink-0 mt-0.5 text-argo-grey">{SectionIcons.info}</span>
                    <p className="text-[11px] text-argo-grey leading-relaxed m-0">
                        {lang === 'en'
                            ? 'Argo Puentes is not a clinical or therapeutic service. It is a lens for self-knowledge and connection in sport.'
                            : lang === 'pt'
                                ? 'Argo Puentes não é um serviço clínico nem terapêutico. É uma lente para o autoconhecimento e a conexão no esporte.'
                                : 'Argo Puentes no es un servicio clínico ni terapéutico. Es una lente para autoconocerte y tender puentes con tu hijo en el deporte.'}
                    </p>
                </div>
            </Card>

            {/* ── 3. TU ESTILO NATURAL ────────────────────────────────────────── */}
            <Card>
                <SectionTitle title={c.report.adultProfileLabel} icon={SectionIcons.profile} />
                <p className="text-[14px] text-argo-secondary leading-relaxed m-0">{aiSections.perfil_adulto_breve}</p>
            </Card>

            {/* ── 4-7. LOS 4 PUENTES ──────────────────────────────────────────── */}
            {aiSections.puentes.map((p, idx) => (
                <motion.div
                    key={idx}
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

            {/* ── 8. CIERRE ───────────────────────────────────────────────────── */}
            <Card>
                <SectionTitle title={c.report.closingLabel} icon={SectionIcons.closing} />
                <p className="text-[14px] text-argo-secondary leading-relaxed m-0">{aiSections.cierre}</p>
            </Card>

            {/* ── 9. EMAIL NOTE (footer mention) ──────────────────────────────── */}
            <div className="flex items-center gap-2 px-7 py-3 text-argo-grey">
                <span className="w-4 h-4 flex-shrink-0">{SectionIcons.mail}</span>
                <p className="text-[12px] m-0 leading-relaxed">{EMAIL_NOTE[lang](recipientEmail ?? undefined)}</p>
            </div>
        </motion.div>
    );
}
