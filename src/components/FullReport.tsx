import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { ReportData } from '../lib/argosEngine';
import { useLang } from '../context/LangContext';
import { getOdysseyT } from '../lib/odysseyTranslations';
import { AXIS_COLORS } from '../lib/designTokens';

interface FullReportProps {
    report: ReportData;
    onReset?: () => void;
    aiActive?: boolean;
    aiLoading?: boolean;
    deporte?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EJE_ORDER = ['D', 'I', 'S', 'C'] as const;

const MOTOR_GAUGE_POS: Record<string, number> = {
    'Rápido': 85, 'Medio': 50, 'Lento': 15,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function splitParagraphs(text: string): string[] {
    if (!text) return [];
    if (text.includes('\n\n')) {
        return text.split('\n\n').map(p => p.trim()).filter(Boolean);
    }
    const raw = text.match(/[^.!?]+[.!?]+/g) ?? [text];
    const sentences: string[] = [];
    for (const s of raw) {
        if (s.trim().length < 10 && sentences.length > 0) {
            sentences[sentences.length - 1] += s;
        } else {
            sentences.push(s);
        }
    }
    const paragraphs: string[] = [];
    for (let i = 0; i < sentences.length; i += 2) {
        paragraphs.push([sentences[i], sentences[i + 1]].filter(Boolean).join(' ').trim());
    }
    return paragraphs;
}

function getConfidence(axisCounts?: Record<string, number>): number {
    if (!axisCounts) return 3;
    const vals = Object.values(axisCounts).sort((a, b) => b - a);
    const diff = vals[0] - vals[1];
    if (diff <= 1) return 2;
    if (diff === 2) return 3;
    if (diff <= 4) return 4;
    return 5;
}

// ─── Section Icons (inline SVGs) ──────────────────────────────────────────────

const SectionIcons: Record<string, React.ReactNode> = {
    compass: (
        <svg viewBox="0 0 16 16" fill="none" stroke="#6366f1" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="8" r="6.5"/><path d="M8 3v2M8 11v2M3 8h2M11 8h2"/><circle cx="8" cy="8" r="1.5" fill="#6366f1" stroke="none"/>
        </svg>
    ),
    contract: (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 8.5V4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h4.5"/><path d="M10.5 10.5l1.5 1.5 3-3"/>
        </svg>
    ),
    ship: (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12l2-1 4 2 4-2 2 1"/><path d="M8 3v10"/><path d="M4 6l4-3 4 3"/>
        </svg>
    ),
    secondaryCompass: (
        <svg viewBox="0 0 16 16" fill="none" stroke="#6366f1" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="8" r="6.5"/><path d="M8 4v4l3 2"/>
        </svg>
    ),
    motor: (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 13L7 3l3 6 3-4"/><circle cx="13" cy="5" r="1" fill="currentColor" stroke="none"/>
        </svg>
    ),
    fuel: (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 2C6.5 4 4 6.5 4 9a4 4 0 0 0 8 0c0-2.5-2.5-5-4-7z"/>
        </svg>
    ),
    group: (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="6" cy="6" r="2.5"/><circle cx="11" cy="10" r="2.5"/><path d="M2 14c0-2 1.5-3.5 4-3.5"/><path d="M14 14c0-2-1.5-3-4-3"/>
        </svg>
    ),
    intention: (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 14c3.3 0 6-2.7 6-6S11.3 2 8 2 2 4.7 2 8c0 1.2.4 2.3 1 3.2L2 14l3-1"/>
        </svg>
    ),
    words: (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 4h12M2 8h8M2 12h10"/>
        </svg>
    ),
    guide: (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="8" r="6.5"/><circle cx="8" cy="8" r="2"/><line x1="8" y1="1.5" x2="8" y2="3"/><line x1="8" y1="13" x2="8" y2="14.5"/>
        </svg>
    ),
    reset: (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 8a6 6 0 0 1 6-6"/><path d="M5 2l-3 0 0 3"/><path d="M14 8a6 6 0 0 1-6 6"/><path d="M11 14l3 0 0-3"/>
        </svg>
    ),
    echoes: (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 2v12l4-3h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1H3z"/>
        </svg>
    ),
    checklist: (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="12" height="12" rx="2"/><path d="M5 8l2 2 4-4"/>
        </svg>
    ),
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionTitle: React.FC<{ title: string; icon?: React.ReactNode; light?: boolean }> = ({ title, icon, light }) => (
    <div className="mb-5 flex items-center gap-2">
        {icon && (
            <span className={`w-5 h-5 flex-shrink-0 flex items-center justify-center ${light ? 'text-white/60' : 'text-[#86868B]'}`}>
                <span className="w-4 h-4 block">{icon}</span>
            </span>
        )}
        <h3 className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${light ? 'text-white/60' : 'text-[#86868B]'}`}>
            {title}
        </h3>
    </div>
);

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-white border border-[#D2D2D7] rounded-xl p-7 ${className}`}>
        {children}
    </div>
);

const AISkeleton: React.FC = () => (
    <div className="space-y-2 animate-pulse">
        <div className="h-3 bg-[#D2D2D7] rounded w-full" />
        <div className="h-3 bg-[#D2D2D7] rounded w-5/6" />
        <div className="h-3 bg-[#D2D2D7] rounded w-4/6" />
        <div className="h-3 bg-[#D2D2D7] rounded w-full mt-4" />
        <div className="h-3 bg-[#D2D2D7] rounded w-3/4" />
    </div>
);

const TextBlock: React.FC<{ text: string; leadBold?: boolean }> = ({ text, leadBold }) => {
    const paragraphs = splitParagraphs(text);
    return (
        <div className="space-y-3">
            {paragraphs.map((para, idx) => {
                if (leadBold && idx === 0) {
                    const firstDot = para.search(/[.!?]/);
                    if (firstDot !== -1) {
                        const lead = para.slice(0, firstDot + 1);
                        const rest = para.slice(firstDot + 1).trim();
                        return (
                            <p key={idx} className="text-sm text-[#424245] leading-[1.75]">
                                <strong className="text-[#1D1D1F] font-semibold">{lead}</strong>
                                {rest && ` ${rest}`}
                            </p>
                        );
                    }
                }
                return (
                    <p key={idx} className="text-sm text-[#424245] leading-[1.75]">
                        {para}
                    </p>
                );
            })}
        </div>
    );
};

/** Renders text with **bold** markdown markers as <strong> */
const RichTextBlock: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
    const paragraphs = splitParagraphs(text);
    return (
        <div className={`space-y-3 ${className}`}>
            {paragraphs.map((para, idx) => {
                const parts = para.split(/(\*\*[^*]+\*\*)/g);
                return (
                    <p key={idx} className="text-[15px] text-[#424245] leading-[1.8]">
                        {parts.map((part, i) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                                return <strong key={i} className="text-[#1D1D1F] font-semibold">{part.slice(2, -2)}</strong>;
                            }
                            return <span key={i}>{part}</span>;
                        })}
                    </p>
                );
            })}
        </div>
    );
};

const ChecklistBlock: React.FC<{ label: string; text: string; color: string; isLoading: boolean }> = ({
    label, text, color, isLoading,
}) => (
    <div className="flex gap-0 rounded-xl overflow-hidden border border-[#D2D2D7]">
        <div className={`w-1 flex-shrink-0 ${color}`} />
        <div className="flex-1 p-4">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-[#1D1D1F] mb-2">{label}</div>
            {isLoading ? <AISkeleton /> : <TextBlock text={text} />}
        </div>
    </div>
);

// ─── Axis Bars ────────────────────────────────────────────────────────────────

const AxisBars: React.FC<{
    axisCounts: Record<string, number>;
    dominantEje: string;
    axisNames: Record<string, string>;
}> = ({ axisCounts, dominantEje, axisNames }) => {
    const total = Object.values(axisCounts).reduce((s, v) => s + v, 0) || 1;
    return (
        <div className="flex flex-col gap-3.5 mt-5 mb-2">
            {EJE_ORDER.map(axis => {
                const pct = Math.round((axisCounts[axis] / total) * 100);
                const isDominant = axis === dominantEje;
                return (
                    <div key={axis} className="flex items-center gap-2.5">
                        <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: AXIS_COLORS[axis] }}
                        />
                        <span className={`text-xs w-[90px] flex-shrink-0 ${isDominant ? 'font-extrabold text-[#1D1D1F]' : 'font-semibold text-[#1D1D1F]'}`}>
                            {axisNames[axis] ?? axis}
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
                        <span className={`text-[11px] w-8 text-right flex-shrink-0 ${isDominant ? 'font-bold text-[#1D1D1F]' : 'font-semibold text-[#86868B]'}`}>
                            {pct}%
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

// ─── Motor Gauge ──────────────────────────────────────────────────────────────

const MotorGauge: React.FC<{
    motor: string;
    label: string;
    displayNames: Record<string, string>;
}> = ({ motor, label, displayNames }) => {
    const pos = MOTOR_GAUGE_POS[motor] ?? 50;
    const labels = ['Lento', 'Medio', 'Rápido'];
    return (
        <div className="mt-5">
            <div className="text-[9px] font-semibold tracking-[0.12em] uppercase text-[#86868B] mb-2">{label}</div>
            <div className="relative h-1.5 bg-black/[0.06] rounded-full my-2">
                <motion.div
                    className="absolute left-0 top-0 h-1.5 rounded-full"
                    style={{ background: 'linear-gradient(90deg, #C4A6D8, #955FB5)' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pos}%` }}
                    transition={{ duration: 0.8, delay: 0.5, ease: [0.25, 0, 0, 1] }}
                />
                <motion.div
                    className="absolute top-[-3px] w-3.5 h-3.5 rounded-full bg-white border-[3px] border-[#955FB5] shadow-sm"
                    initial={{ left: 0 }}
                    animate={{ left: `${pos}%` }}
                    transition={{ duration: 0.8, delay: 0.5, ease: [0.25, 0, 0, 1] }}
                    style={{ transform: 'translateX(-50%)' }}
                />
            </div>
            <div className="flex justify-between mt-1">
                {labels.map(m => (
                    <span
                        key={m}
                        className={`text-[10px] tracking-wide ${m === motor ? 'text-[#955FB5] font-bold' : 'text-[#86868B] font-medium'}`}
                    >
                        {displayNames[m] ?? m}
                    </span>
                ))}
            </div>
        </div>
    );
};

// ─── Confidence Meter ─────────────────────────────────────────────────────────

const ConfidenceMeter: React.FC<{
    axisCounts?: Record<string, number>;
    label: string;
    levels: string[];
}> = ({ axisCounts, label, levels }) => {
    const filled = getConfidence(axisCounts);
    const levelLabel = levels[filled - 1] ?? '';
    return (
        <div className="mt-5 pt-4 border-t border-black/[0.06]">
            <div className="flex justify-between items-center">
                <span className="text-[10px] text-[#86868B] font-medium tracking-[0.06em] uppercase">{label}</span>
                <span className="text-[11px] text-[#955FB5] font-semibold">{levelLabel}</span>
            </div>
            <div className="flex gap-[3px] mt-1.5">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div
                        key={i}
                        className={`h-1 flex-1 rounded-sm ${i < filled ? 'bg-[#955FB5]' : 'bg-black/[0.06]'}`}
                    />
                ))}
            </div>
        </div>
    );
};

// ─── Review CTA ───────────────────────────────────────────────────────────────

const ReviewCTA: React.FC<{
    sessionId?: string;
    lang: string;
    title: string;
    question: string;
    chips: [string, string, string];
    sub: string;
}> = ({ sessionId, lang, title, question, chips, sub }) => {
    const base = sessionId ? `/review/${sessionId}` : '#';
    const chipValues = ['muy_claro', 'algo_claro', 'confuso'];
    const chipStyles = [
        'bg-[#955FB5] text-white shadow-[0_2px_8px_rgba(149,95,181,0.3)]',
        'bg-white text-[#424245] border border-[#D2D2D7]',
        'bg-white text-[#86868B] border border-[#D2D2D7]',
    ];
    return (
        <div className="text-center mt-8 p-8 bg-[#E3E3FF] border-2 border-[#955FB5] rounded-2xl">
            <div className="w-10 h-10 mx-auto mb-3 bg-[#955FB5] rounded-full flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 2v6l4 2"/><circle cx="10" cy="10" r="8"/>
                </svg>
            </div>
            <p className="text-[17px] font-bold text-[#1D1D1F] mb-1.5">{title}</p>
            <p className="text-[13px] text-[#424245] mb-4">{question}</p>
            <div className="flex justify-center gap-2.5 flex-wrap mb-2.5">
                {chips.map((chip, i) => (
                    <a
                        key={i}
                        href={sessionId ? `${base}?q1=${chipValues[i]}&lang=${lang}` : '#'}
                        className={`inline-block px-6 py-3 rounded-3xl text-sm font-semibold no-underline transition-transform hover:scale-[1.04] ${chipStyles[i]}`}
                    >
                        {chip}
                    </a>
                ))}
            </div>
            <p className="text-[11px] text-[#86868B] mt-2">{sub}</p>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const FullReport: React.FC<FullReportProps> = ({ report, aiActive, aiLoading, deporte }) => {
    const { lang } = useLang();
    const ot = getOdysseyT(lang);
    const s = ot.reportSections;
    const {
        arquetipo, perfil,
        bienvenida, wow, motorDesc, combustible, grupoEspacio, corazon,
        palabrasPuente, palabrasRuido, guia, reseteo, ecos, checklist,
        tendenciaParagraph, palabrasPuenteExtra, palabrasRuidoExtra,
        axisCounts, sessionId, resumenPerfil,
    } = report;

    const aiSectionKeys = ['resumenPerfil', 'wow', 'motorDesc', 'combustible', 'corazon', 'reseteo', 'ecos', 'checklist'];
    const isLoading = (section: string) => !!aiLoading && aiSectionKeys.includes(section);

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 max-w-lg mx-auto w-full pb-20"
        >
            {/* ── 0. La Brújula (Executive Summary) ── */}
            <div className="bg-[#E3E3FF] border border-[#C8C8F0] rounded-xl p-7">
                <SectionTitle title={ot.compassLabel} icon={SectionIcons.compass} />
                <h1 className="text-[28px] font-light tracking-tight leading-tight text-[#1D1D1F]">
                    {arquetipo.label}
                </h1>
                {report.tendenciaLabel && (
                    <p className="text-sm text-[#6366f1] italic mt-1">{report.tendenciaLabel}</p>
                )}
                {perfil && (
                    <p className="text-sm text-[#86868B] italic mt-1">{perfil}</p>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mt-3.5">
                    <span className="px-3 py-1 rounded-full text-[11px] font-semibold text-white" style={{ backgroundColor: AXIS_COLORS[arquetipo.eje] ?? '#86868B' }}>
                        {arquetipo.eje}
                    </span>
                    <span className="px-3 py-1 bg-[#1D1D1F] text-white rounded-full text-[11px] font-semibold">
                        {ot.motorDisplayNames[arquetipo.motor] ?? arquetipo.motor}
                    </span>
                    {deporte && (
                        <span className="px-3 py-1 bg-[#E3E3FF] border border-[#C8C8F0] text-[#4338CA] rounded-full text-[11px] font-semibold">
                            {deporte}
                        </span>
                    )}
                    {(aiActive || aiLoading) && (
                        <span className="px-3 py-1 bg-[#6366f1] text-white rounded-full text-[11px] font-semibold flex items-center gap-1">
                            <Sparkles size={10} />
                            {aiLoading ? ot.generatingAI : ot.aiTag}
                        </span>
                    )}
                </div>

                {/* Axis Bars */}
                {axisCounts && (
                    <AxisBars
                        axisCounts={axisCounts}
                        dominantEje={arquetipo.eje}
                        axisNames={ot.axisNames}
                    />
                )}

                {/* Motor Gauge */}
                <MotorGauge
                    motor={arquetipo.motor}
                    label={ot.motorGaugeLabel}
                    displayNames={ot.motorDisplayNames}
                />

                {/* Confidence */}
                <ConfidenceMeter
                    axisCounts={axisCounts}
                    label={ot.confidenceLabel}
                    levels={ot.confidenceLevels}
                />
            </div>

            {/* ── 1. Retrato de Sintonía ── */}
            <Card>
                <SectionTitle title={s.contract} icon={SectionIcons.contract} />
                {isLoading('resumenPerfil')
                    ? <AISkeleton />
                    : resumenPerfil
                        ? <RichTextBlock text={resumenPerfil} />
                        : <TextBlock text={bienvenida} />
                }
                {/* Disclaimer — subtle note */}
                <div className="mt-5 flex items-start gap-2.5 p-3.5 bg-[#F5F5F7] rounded-xl">
                    <svg viewBox="0 0 16 16" fill="none" stroke="#86868B" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0 mt-0.5">
                        <circle cx="8" cy="8" r="6.5"/><path d="M8 5.5v3"/><circle cx="8" cy="11.5" r="0.5" fill="#86868B" stroke="none"/>
                    </svg>
                    <p className="text-[11px] text-[#86868B] leading-relaxed">{s.disclaimer}</p>
                </div>
            </Card>

            {/* ── 2. Su lugar en la Nave (WOW) ── */}
            <Card>
                <SectionTitle title={s.placeInShip} icon={SectionIcons.ship} />
                {isLoading('wow') ? <AISkeleton /> : <TextBlock text={wow} leadBold />}
            </Card>

            {/* ── 3. Brújula Secundaria ── */}
            {tendenciaParagraph && (
                <Card>
                    <SectionTitle title={s.secondaryCompass} icon={SectionIcons.secondaryCompass} />
                    <TextBlock text={tendenciaParagraph} leadBold />
                </Card>
            )}

            {/* ── 4. El Ritmo del Motor ── */}
            <Card>
                <SectionTitle title={s.motorRhythm} icon={SectionIcons.motor} />
                {isLoading('motorDesc') ? <AISkeleton /> : <TextBlock text={motorDesc} leadBold />}
            </Card>

            {/* ── 5. El Combustible ── */}
            <Card>
                <SectionTitle title={s.fuel} icon={SectionIcons.fuel} />
                {isLoading('combustible') ? <AISkeleton /> : <TextBlock text={combustible} leadBold />}
            </Card>

            {/* ── 6. Vida en el Grupo ── */}
            <Card>
                <SectionTitle title={s.groupLife} icon={SectionIcons.group} />
                <TextBlock text={grupoEspacio} />
            </Card>

            {/* ── 7. Lenguaje de Intención ── */}
            <Card>
                <SectionTitle title={s.intentionLanguage} icon={SectionIcons.intention} />
                {isLoading('corazon') ? <AISkeleton /> : <TextBlock text={corazon} leadBold />}
            </Card>

            {/* ── 8. Cómo hablarle (Palabras) ── */}
            <Card>
                <SectionTitle title={s.captainLanguage} icon={SectionIcons.words} />
                <p className="text-[13px] text-[#86868B] mb-4 leading-relaxed">{
                    lang === 'en' ? 'Words that connect with their nature vs. words that create emotional noise.'
                    : lang === 'pt' ? 'Palavras que conectam com sua natureza vs. palavras que geram ruído emocional.'
                    : 'Palabras que conectan con su naturaleza vs. palabras que generan ruido emocional.'
                }</p>

                <div className="grid grid-cols-2 gap-4 mb-5">
                    {/* Connect column */}
                    <div className="flex flex-wrap gap-2 content-start">
                        <div className="w-full text-[9px] font-bold tracking-[0.1em] uppercase text-green-600 mb-0.5">{s.bridgeWords}</div>
                        {palabrasPuente.map((p, i) => (
                            <span key={i} className="inline-block px-3 py-1.5 bg-green-50 border border-green-200 rounded-full text-xs font-medium text-green-700">
                                {p}
                            </span>
                        ))}
                    </div>
                    {/* Disconnect column */}
                    <div className="flex flex-wrap gap-2 content-start">
                        <div className="w-full text-[9px] font-bold tracking-[0.1em] uppercase text-amber-600 mb-0.5">{s.noiseWords}</div>
                        {palabrasRuido.map((p, i) => (
                            <span key={i} className="inline-block px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-xs font-medium text-amber-700">
                                {p}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Tendencia extras */}
                {(palabrasPuenteExtra?.length || palabrasRuidoExtra?.length) ? (
                    <div className="mt-4 pt-3.5 border-t border-[#D2D2D7]">
                        <p className="text-[10px] font-semibold text-[#6366f1] tracking-[0.1em] uppercase mb-2.5">{s.byTendency}</p>
                        {palabrasPuenteExtra && palabrasPuenteExtra.length > 0 && (
                            <div className="mb-1.5 flex flex-wrap gap-2">
                                {palabrasPuenteExtra.map((p, i) => (
                                    <span key={i} className="px-3 py-1.5 bg-green-50 border border-dashed border-green-300 rounded-full text-xs font-medium text-green-600">
                                        {p}
                                    </span>
                                ))}
                            </div>
                        )}
                        {palabrasRuidoExtra && palabrasRuidoExtra.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {palabrasRuidoExtra.map((p, i) => (
                                    <span key={i} className="px-3 py-1.5 bg-amber-50 border border-dashed border-amber-300 rounded-full text-xs font-medium text-amber-600">
                                        {p}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                ) : null}
            </Card>

            {/* ── 9. Guía de Sintonía ── */}
            {guia.length > 0 && (
                <Card>
                    <SectionTitle title={s.tuningGuide} icon={SectionIcons.guide} />
                    <div className="space-y-3">
                        {guia.map((row, i) => (
                            <div key={i}>
                                <div className="text-xs font-semibold text-[#1D1D1F] pb-2.5 mb-3 border-b border-[#D2D2D7]">
                                    {i + 1}. {row.situacion}
                                </div>
                                <div className="grid grid-cols-2 gap-2.5">
                                    <div className="p-3.5 rounded-xl bg-green-50 border border-green-200">
                                        <div className="text-[9px] font-bold tracking-[0.1em] uppercase text-green-600 mb-2">{s.activators}</div>
                                        <p className="text-[13px] text-[#424245] leading-relaxed">{row.activador}</p>
                                    </div>
                                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                                        <div className="text-[9px] font-bold tracking-[0.1em] uppercase text-amber-600 mb-2">{s.toAvoid}</div>
                                        <p className="text-[13px] text-[#424245] leading-relaxed">{row.desmotivacion}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* ── 10. Gestión del Desajuste ── */}
            <Card>
                <SectionTitle title={s.adjustmentManagement} icon={SectionIcons.reset} />
                {isLoading('reseteo') ? <AISkeleton /> : <TextBlock text={reseteo} leadBold />}
            </Card>

            {/* ── 11. Ecos de la Nave ── */}
            <Card>
                <SectionTitle title={s.shipEchoes} icon={SectionIcons.echoes} />
                {isLoading('ecos') ? <AISkeleton /> : <TextBlock text={ecos} />}
            </Card>

            {/* ── 12. Checklist del Día ── */}
            <Card>
                <SectionTitle title={s.dayChecklist} icon={SectionIcons.checklist} />
                <div className="space-y-3">
                    <ChecklistBlock
                        label={s.beforeTraining}
                        text={checklist.antes}
                        color="bg-[#6366f1]"
                        isLoading={isLoading('checklist')}
                    />
                    <ChecklistBlock
                        label={s.duringTraining}
                        text={checklist.durante}
                        color="bg-[#1D1D1F]"
                        isLoading={isLoading('checklist')}
                    />
                    <ChecklistBlock
                        label={s.afterTraining}
                        text={checklist.despues}
                        color="bg-green-500"
                        isLoading={isLoading('checklist')}
                    />
                </div>
            </Card>

            {/* ── Review CTA ── */}
            <ReviewCTA
                sessionId={sessionId}
                lang={lang}
                title={ot.reviewTitle}
                question={ot.reviewQuestion}
                chips={ot.reviewChips}
                sub={ot.reviewSub}
            />

            {/* ── Footer ── */}
            <div className="text-center mt-6">
                <p className="text-[11px] text-[#86868B] leading-relaxed">
                    <span className="font-extrabold">Argo</span>
                    <span className="font-thin"> Method</span>
                    {' '}
                    <span className="inline-block bg-[#BBBCFF] text-[#1D1D1F] text-[8px] font-semibold px-1.5 py-0.5 rounded align-middle ml-0.5 tracking-wide">
                        beta
                    </span>
                </p>
                <p className="text-[11px] text-[#86868B] mt-0.5">{ot.designedBy}</p>
            </div>
        </motion.div>
    );
};
