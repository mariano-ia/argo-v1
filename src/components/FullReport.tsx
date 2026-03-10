import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { ReportData } from '../lib/argosEngine';

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
    const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];
    const paragraphs: string[] = [];
    for (let i = 0; i < sentences.length; i += 2) {
        paragraphs.push([sentences[i], sentences[i + 1]].filter(Boolean).join(' ').trim());
    }
    return paragraphs;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionTitle: React.FC<{ number: string; title: string; light?: boolean }> = ({ number, title, light }) => (
    <div className="flex items-center gap-3 mb-5">
        <span className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0 ${light ? 'bg-white/15 text-white/60' : 'bg-argo-neutral text-argo-grey'}`}>
            {number}
        </span>
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
const DISC_LABELS: Record<string, string> = {
    D: 'Dominio',
    I: 'Influencia',
    S: 'Estabilidad',
    C: 'Conciencia',
};

const DiscTelemetry: React.FC<{ eje: string }> = ({ eje }) => (
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
                Eje dominante<br />
                <strong className="text-argo-navy text-[11px]">{DISC_LABELS[eje] ?? eje}</strong>
            </span>
        </div>
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const FullReport: React.FC<FullReportProps> = ({ report, aiActive, aiLoading, deporte }) => {
    const {
        nombre, arquetipo, perfil,
        bienvenida, wow, motorDesc, combustible, grupoEspacio, corazon,
        palabrasPuente, palabrasRuido, guia, reseteo, ecos, checklist,
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
                    Informe de Sintonía Deportiva
                </div>
                <h1 className="font-display text-4xl font-bold text-argo-navy tracking-tight leading-tight">
                    {arquetipo.label}
                </h1>
                {perfil && (
                    <p className="text-sm text-argo-grey mt-1.5 leading-relaxed">{perfil}</p>
                )}

                {/* DISC telemetry */}
                <DiscTelemetry eje={arquetipo.eje} />

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mt-4">
                    <span className="px-3 py-1 bg-argo-neutral border border-argo-border rounded-full text-[10px] font-semibold text-argo-grey uppercase tracking-widest">
                        Motor {arquetipo.motor}
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
                            {aiLoading ? 'Generando...' : 'IA'}
                        </span>
                    )}
                </div>
            </div>

            {/* 0. Bienvenida */}
            <Card>
                <SectionTitle number="0" title="El Contrato de Sintonía" />
                <blockquote className="border-l-2 border-argo-indigo pl-5">
                    <TextBlock text={bienvenida} />
                </blockquote>
            </Card>

            {/* 1. WOW */}
            <Card>
                <SectionTitle number="1" title="Su lugar en la Nave" />
                {isLoading('wow') ? <AISkeleton /> : <TextBlock text={wow} leadBold />}
            </Card>

            {/* 2 + 3 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <SectionTitle number="2" title="El Ritmo del Motor" />
                    {isLoading('motorDesc') ? <AISkeleton /> : <TextBlock text={motorDesc} />}
                </Card>
                <Card>
                    <SectionTitle number="3" title="El Combustible" />
                    {isLoading('combustible') ? <AISkeleton /> : <TextBlock text={combustible} />}
                </Card>
            </div>

            {/* 4 + 5 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <SectionTitle number="4" title="Vida en el Grupo" />
                    <TextBlock text={grupoEspacio} />
                </Card>
                <Card>
                    <SectionTitle number="5" title="Lenguaje de Intención" />
                    {isLoading('corazon') ? <AISkeleton /> : <TextBlock text={corazon} />}
                </Card>
            </div>

            {/* 6. Palabras */}
            <Card>
                <SectionTitle number="6" title="Lenguaje del Capitán" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <div className="text-[10px] font-semibold text-green-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            Palabras Puente
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {palabrasPuente.map((p, i) => (
                                <span key={i} className="px-3 py-1.5 bg-green-50 border border-green-200 rounded-full text-xs font-medium text-green-700">
                                    {p}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div>
                        <div className="text-[10px] font-semibold text-red-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                            Palabras Ruido
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {palabrasRuido.map((p, i) => (
                                <span key={i} className="px-3 py-1.5 bg-red-50 border border-red-200 rounded-full text-xs font-medium text-red-600">
                                    {p}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>

            {/* 8. Guía */}
            {guia.length > 0 && (
                <Card>
                    <SectionTitle number="8" title="Guía de Sintonía" />
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
                                            Activadores
                                        </div>
                                        <TextBlock text={row.activador} />
                                    </div>
                                    <div className="p-5">
                                        <div className="text-[9px] font-semibold text-red-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                            A evitar
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
                <SectionTitle number="9" title="Gestión del Desajuste" />
                {isLoading('reseteo') ? <AISkeleton /> : <TextBlock text={reseteo} leadBold />}
            </Card>

            {/* 10. Ecos */}
            <Card>
                <SectionTitle number="10" title="Ecos de la Nave" />
                {isLoading('ecos') ? <AISkeleton /> : <TextBlock text={ecos} />}
            </Card>

            {/* 11. Checklist */}
            <Card>
                <SectionTitle number="11" title="Checklist del Día" />
                <div className="space-y-3">
                    <ChecklistBlock
                        label="Antes del entrenamiento"
                        text={checklist.antes}
                        color="bg-argo-indigo"
                        isLoading={isLoading('checklist')}
                    />
                    <ChecklistBlock
                        label="Durante el entrenamiento"
                        text={checklist.durante}
                        color="bg-argo-navy"
                        isLoading={isLoading('checklist')}
                    />
                    <ChecklistBlock
                        label="Después del entrenamiento"
                        text={checklist.despues}
                        color="bg-green-500"
                        isLoading={isLoading('checklist')}
                    />
                </div>
                <p className="text-[10px] text-argo-grey/40 text-center mt-8 uppercase tracking-widest">
                    Diseñado bajo los principios de seguridad emocional de Argo Method
                </p>
            </Card>
        </motion.div>
    );
};
