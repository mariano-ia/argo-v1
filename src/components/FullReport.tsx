import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { ReportData } from '../lib/argosEngine';
import { useLang } from '../context/LangContext';
import { getOdysseyT } from '../lib/odysseyTranslations';

interface FullReportProps {
    report: ReportData;
    onReset?: () => void;
    aiActive?: boolean;
    aiLoading?: boolean;
    deporte?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function splitParagraphs(text: string): string[] {
    if (!text) return [];
    if (text.includes('\n\n')) {
        return text.split('\n\n').map(p => p.trim()).filter(Boolean);
    }
    const raw = text.match(/[^.!?]+[.!?]+/g) ?? [text];
    // Merge short fragments (e.g. orphan '".') with previous sentence
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

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionTitle: React.FC<{ title: string; light?: boolean }> = ({ title, light }) => (
    <div className="mb-5">
        <h3 className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${light ? 'text-white/60' : 'text-argo-grey'}`}>
            {title}
        </h3>
    </div>
);

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-white border border-argo-border rounded-argo-lg p-8 ${className}`}>
        {children}
    </div>
);

const AISkeleton: React.FC = () => (
    <div className="space-y-2 animate-pulse">
        <div className="h-3 bg-argo-border rounded w-full" />
        <div className="h-3 bg-argo-border rounded w-5/6" />
        <div className="h-3 bg-argo-border rounded w-4/6" />
        <div className="h-3 bg-argo-border rounded w-full mt-4" />
        <div className="h-3 bg-argo-border rounded w-3/4" />
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
                            <p key={idx} className="text-sm text-argo-grey leading-relaxed">
                                <strong className="text-argo-navy font-semibold">{lead}</strong>
                                {rest && ` ${rest}`}
                            </p>
                        );
                    }
                }
                return (
                    <p key={idx} className="text-sm text-argo-grey leading-relaxed">
                        {para}
                    </p>
                );
            })}
        </div>
    );
};

const ChecklistBlock: React.FC<{ label: string; text: string; color: string; isLoading: boolean }> = ({
    label, text, color, isLoading,
}) => (
    <div className="flex gap-0 rounded-argo-md overflow-hidden border border-argo-border">
        <div className={`w-1 flex-shrink-0 ${color}`} />
        <div className="flex-1 p-4">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-argo-navy mb-2">{label}</div>
            {isLoading ? <AISkeleton /> : <TextBlock text={text} />}
        </div>
    </div>
);

// ─── DISC Telemetry ────────────────────────────────────────────────────────────

const DISC_AXES = ['D', 'I', 'S', 'C'] as const;

const DiscTelemetry: React.FC<{ eje: string; discLabels: Record<string, string>; dominantAxisLabel: string }> = ({ eje, discLabels, dominantAxisLabel }) => (
    <div className="flex items-end gap-3 pt-2">
        {DISC_AXES.map(axis => {
            const active = axis === eje;
            return (
                <div key={axis} className="flex flex-col items-center gap-1.5">
                    <motion.div
                        className="w-7 rounded-sm"
                        initial={{ height: 4 }}
                        animate={{ height: active ? 28 : 8 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 24, delay: active ? 0.3 : 0.5 }}
                        style={{ backgroundColor: active ? '#0071E3' : '#D2D2D7' }}
                    />
                    <span
                        className="text-[9px] font-bold uppercase tracking-wider"
                        style={{ color: active ? '#0071E3' : '#86868B' }}
                    >
                        {axis}
                    </span>
                </div>
            );
        })}
        <div className="ml-2 flex flex-col justify-end pb-5">
            <span className="text-[10px] text-argo-grey/70 leading-snug">
                {dominantAxisLabel}<br />
                <strong className="text-argo-navy text-[11px]">{discLabels[eje] ?? eje}</strong>
            </span>
        </div>
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const FullReport: React.FC<FullReportProps> = ({ report, aiActive, aiLoading, deporte }) => {
    const { lang } = useLang();
    const ot = getOdysseyT(lang);
    const s = ot.reportSections;
    const {
        nombre, arquetipo, perfil,
        bienvenida, wow, motorDesc, combustible, grupoEspacio, corazon,
        palabrasPuente, palabrasRuido, guia, reseteo, ecos, checklist,
        tendenciaParagraph, palabrasPuenteExtra, palabrasRuidoExtra,
    } = report;

    const aiSections = ['wow', 'motorDesc', 'combustible', 'corazon', 'reseteo', 'ecos', 'checklist'];
    const isLoading = (section: string) => !!aiLoading && aiSections.includes(section);

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-2xl mx-auto w-full pb-20"
        >
            {/* Header */}
            <div className="border-b border-argo-border pb-6">
                <div className="text-[10px] uppercase tracking-[0.2em] text-argo-grey font-semibold mb-2">
                    {ot.reportHeader}
                </div>
                <h1 className="font-display text-4xl font-bold text-argo-navy tracking-tight leading-tight">
                    {arquetipo.label}
                </h1>
                {perfil && (
                    <p className="text-sm text-argo-grey mt-1.5 leading-relaxed">{perfil}</p>
                )}

                {/* DISC telemetry */}
                <DiscTelemetry eje={arquetipo.eje} discLabels={ot.discLabels} dominantAxisLabel={ot.dominantAxis} />

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mt-4">
                    <span className="px-3 py-1 bg-argo-neutral border border-argo-border rounded-full text-[10px] font-semibold text-argo-grey uppercase tracking-widest">
                        {ot.motorTag} {arquetipo.motor}
                    </span>
                    {nombre && nombre !== 'el deportista' && (
                        <span className="px-3 py-1 bg-blue-50 border border-argo-indigo/30 rounded-full text-[10px] font-semibold text-argo-indigo uppercase tracking-widest">
                            {nombre}
                        </span>
                    )}
                    {deporte && (
                        <span className="px-3 py-1 bg-argo-neutral border border-argo-border rounded-full text-[10px] font-semibold text-argo-grey uppercase tracking-widest">
                            {deporte}
                        </span>
                    )}
                    {(aiActive || aiLoading) && (
                        <span className="px-3 py-1 bg-argo-indigo text-white rounded-full text-[10px] font-semibold uppercase tracking-widest flex items-center gap-1">
                            <Sparkles size={10} />
                            {aiLoading ? ot.generatingAI : ot.aiTag}
                        </span>
                    )}
                </div>
            </div>

            {/* 0. Bienvenida */}
            <Card>
                <SectionTitle title={s.contract} />
                <blockquote className="border-l-2 border-argo-indigo pl-5">
                    <TextBlock text={bienvenida} />
                </blockquote>
            </Card>

            {/* 1. WOW */}
            <Card>
                <SectionTitle title={s.placeInShip} />
                {isLoading('wow') ? <AISkeleton /> : <TextBlock text={wow} leadBold />}
            </Card>

            {/* Brújula Secundaria */}
            {tendenciaParagraph && (
                <Card>
                    <SectionTitle title={s.secondaryCompass} />
                    <TextBlock text={tendenciaParagraph} leadBold />
                </Card>
            )}

            {/* 2 + 3 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <SectionTitle title={s.motorRhythm} />
                    {isLoading('motorDesc') ? <AISkeleton /> : <TextBlock text={motorDesc} />}
                </Card>
                <Card>
                    <SectionTitle title={s.fuel} />
                    {isLoading('combustible') ? <AISkeleton /> : <TextBlock text={combustible} />}
                </Card>
            </div>

            {/* 4 + 5 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <SectionTitle title={s.groupLife} />
                    <TextBlock text={grupoEspacio} />
                </Card>
                <Card>
                    <SectionTitle title={s.intentionLanguage} />
                    {isLoading('corazon') ? <AISkeleton /> : <TextBlock text={corazon} />}
                </Card>
            </div>

            {/* 6. Palabras */}
            <Card>
                <SectionTitle title={s.captainLanguage} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <div className="text-[10px] font-semibold text-green-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            {s.bridgeWords}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {palabrasPuente.map((p, i) => (
                                <span key={i} className="px-3 py-1.5 bg-green-50 border border-green-200 rounded-full text-xs font-medium text-green-700">
                                    {p}
                                </span>
                            ))}
                        </div>
                        {palabrasPuenteExtra && palabrasPuenteExtra.length > 0 && (
                            <>
                                <div className="text-[9px] text-argo-grey uppercase tracking-widest mt-3 mb-1.5">{s.byTendency}</div>
                                <div className="flex flex-wrap gap-2">
                                    {palabrasPuenteExtra.map((p, i) => (
                                        <span key={i} className="px-3 py-1.5 bg-green-50 border border-dashed border-green-300 rounded-full text-xs font-medium text-green-600">
                                            {p}
                                        </span>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                    <div>
                        <div className="text-[10px] font-semibold text-amber-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            {s.noiseWords}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {palabrasRuido.map((p, i) => (
                                <span key={i} className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-xs font-medium text-amber-700">
                                    {p}
                                </span>
                            ))}
                        </div>
                        {palabrasRuidoExtra && palabrasRuidoExtra.length > 0 && (
                            <>
                                <div className="text-[9px] text-argo-grey uppercase tracking-widest mt-3 mb-1.5">{s.byTendency}</div>
                                <div className="flex flex-wrap gap-2">
                                    {palabrasRuidoExtra.map((p, i) => (
                                        <span key={i} className="px-3 py-1.5 bg-amber-50 border border-dashed border-amber-300 rounded-full text-xs font-medium text-amber-600">
                                            {p}
                                        </span>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </Card>

            {/* 8. Guía */}
            {guia.length > 0 && (
                <Card>
                    <SectionTitle title={s.tuningGuide} />
                    <div className="space-y-4">
                        {guia.map((row, i) => (
                            <div key={i} className="border border-argo-border rounded-argo-md overflow-hidden">
                                <div className="px-5 py-2.5 bg-argo-neutral border-b border-argo-border">
                                    <span className="text-[10px] font-semibold text-argo-navy uppercase tracking-widest">
                                        {row.situacion}
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-argo-border">
                                    <div className="p-5">
                                        <div className="text-[9px] font-semibold text-green-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                            {s.activators}
                                        </div>
                                        <TextBlock text={row.activador} />
                                    </div>
                                    <div className="p-5">
                                        <div className="text-[9px] font-semibold text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                            {s.toAvoid}
                                        </div>
                                        <TextBlock text={row.desmotivacion} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* 9. Reseteo */}
            <Card>
                <SectionTitle title={s.adjustmentManagement} />
                {isLoading('reseteo') ? <AISkeleton /> : <TextBlock text={reseteo} leadBold />}
            </Card>

            {/* 10. Ecos */}
            <Card>
                <SectionTitle title={s.shipEchoes} />
                {isLoading('ecos') ? <AISkeleton /> : <TextBlock text={ecos} />}
            </Card>

            {/* 11. Checklist */}
            <Card>
                <SectionTitle title={s.dayChecklist} />
                <div className="space-y-3">
                    <ChecklistBlock
                        label={s.beforeTraining}
                        text={checklist.antes}
                        color="bg-argo-indigo"
                        isLoading={isLoading('checklist')}
                    />
                    <ChecklistBlock
                        label={s.duringTraining}
                        text={checklist.durante}
                        color="bg-argo-navy"
                        isLoading={isLoading('checklist')}
                    />
                    <ChecklistBlock
                        label={s.afterTraining}
                        text={checklist.despues}
                        color="bg-green-500"
                        isLoading={isLoading('checklist')}
                    />
                </div>
                <p className="text-[10px] text-argo-grey/40 text-center mt-8 uppercase tracking-widest">
                    {ot.designedBy}
                </p>
            </Card>
        </motion.div>
    );
};
