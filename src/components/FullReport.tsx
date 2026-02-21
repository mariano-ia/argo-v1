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

const SectionTitle: React.FC<{ number: string; title: string; light?: boolean }> = ({ number, title, light }) => (
    <div className="flex items-center gap-3 mb-4">
        <span className={`w-7 h-7 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0 ${light ? 'bg-white/20 text-white' : 'bg-argo-navy text-white'}`}>
            {number}
        </span>
        <h3 className={`text-xs font-bold uppercase tracking-widest ${light ? 'text-white/70' : 'text-argo-navy'}`}>
            {title}
        </h3>
    </div>
);

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-white border border-argo-border rounded-argo-lg shadow-sm p-8 ${className}`}>
        {children}
    </div>
);

// Skeleton placeholder shown while AI generates
const AISkeleton: React.FC = () => (
    <div className="space-y-2 animate-pulse">
        <div className="h-3 bg-argo-border rounded w-full" />
        <div className="h-3 bg-argo-border rounded w-5/6" />
        <div className="h-3 bg-argo-border rounded w-4/6" />
    </div>
);

export const FullReport: React.FC<FullReportProps> = ({ report, aiActive, aiLoading, deporte }) => {
    const {
        nombre, arquetipo, perfil,
        bienvenida, wow, motorDesc, combustible, grupoEspacio, corazon,
        palabrasPuente, palabrasRuido, guia, reseteo, ecos, checklist,
    } = report;

    // Sections rewritten by AI
    const aiSections = ['wow', 'motorDesc', 'combustible', 'corazon', 'reseteo', 'ecos', 'checklist'];
    const isLoading = (section: string) => aiLoading && aiSections.includes(section);

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-2xl mx-auto w-full pb-20"
        >
            {/* Header */}
            <div className="border-b border-argo-border pb-6">
                <div className="text-[10px] uppercase tracking-[0.2em] text-argo-indigo font-bold mb-1">
                    Informe de Sintonía Deportiva
                </div>
                <h1 className="font-display text-4xl font-bold text-argo-navy tracking-tight">
                    {arquetipo.label}
                </h1>
                <p className="text-sm text-argo-grey mt-1 italic">{perfil}</p>
                <div className="flex flex-wrap gap-2 mt-4">
                    <span className="px-3 py-1 bg-argo-neutral border border-argo-border rounded-full text-[10px] font-bold text-argo-grey uppercase tracking-widest">
                        Eje {arquetipo.eje}
                    </span>
                    <span className="px-3 py-1 bg-argo-neutral border border-argo-border rounded-full text-[10px] font-bold text-argo-grey uppercase tracking-widest">
                        Motor {arquetipo.motor}
                    </span>
                    {nombre && nombre !== 'el deportista' && (
                        <span className="px-3 py-1 bg-indigo-50 border border-argo-indigo rounded-full text-[10px] font-bold text-argo-indigo uppercase tracking-widest">
                            {nombre}
                        </span>
                    )}
                    {deporte && (
                        <span className="px-3 py-1 bg-argo-neutral border border-argo-border rounded-full text-[10px] font-bold text-argo-grey uppercase tracking-widest">
                            {deporte}
                        </span>
                    )}
                    {(aiActive || aiLoading) && (
                        <span className="px-3 py-1 bg-argo-indigo text-white rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                            <Sparkles size={10} />
                            {aiLoading ? 'Generando...' : 'IA'}
                        </span>
                    )}
                </div>
            </div>

            {/* 0. Bienvenida */}
            <Card>
                <SectionTitle number="0" title="El Contrato de Sintonía" />
                <p className="text-sm text-argo-grey leading-relaxed italic border-l-4 border-argo-indigo pl-5">
                    {bienvenida}
                </p>
            </Card>

            {/* 1. WOW */}
            <Card>
                <SectionTitle number="1" title="Su lugar en la Nave" />
                {isLoading('wow') ? <AISkeleton /> : <p className="text-sm text-argo-grey leading-relaxed">{wow}</p>}
            </Card>

            {/* 2 + 3 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <SectionTitle number="2" title="El Ritmo del Motor" />
                    {isLoading('motorDesc') ? <AISkeleton /> : <p className="text-sm text-argo-grey leading-relaxed">{motorDesc}</p>}
                </Card>
                <Card>
                    <SectionTitle number="3" title="El Combustible" />
                    {isLoading('combustible') ? <AISkeleton /> : <p className="text-sm text-argo-grey leading-relaxed">{combustible}</p>}
                </Card>
            </div>

            {/* 4 + 5 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <SectionTitle number="4" title="Vida en el Grupo" />
                    <p className="text-sm text-argo-grey leading-relaxed">{grupoEspacio}</p>
                </Card>
                <Card>
                    <SectionTitle number="5" title="Lenguaje de Intención" />
                    {isLoading('corazon') ? <AISkeleton /> : <p className="text-sm text-argo-grey leading-relaxed">{corazon}</p>}
                </Card>
            </div>

            {/* 6. Palabras */}
            <Card>
                <SectionTitle number="6" title="Lenguaje del Capitán" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <div className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            Palabras Puente
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {palabrasPuente.map((p, i) => (
                                <span key={i} className="px-3 py-1.5 bg-green-50 border border-green-200 rounded-full text-xs font-semibold text-green-700">
                                    {p}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div>
                        <div className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-400" />
                            Palabras Ruido
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {palabrasRuido.map((p, i) => (
                                <span key={i} className="px-3 py-1.5 bg-red-50 border border-red-200 rounded-full text-xs font-semibold text-red-600">
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
                                    <span className="text-[10px] font-bold text-argo-navy uppercase tracking-widest">
                                        {row.situacion}
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-argo-border">
                                    <div className="p-5">
                                        <div className="text-[9px] font-bold text-green-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                            Activadores
                                        </div>
                                        <p className="text-xs text-argo-grey leading-relaxed">{row.activador}</p>
                                    </div>
                                    <div className="p-5">
                                        <div className="text-[9px] font-bold text-red-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                            A evitar
                                        </div>
                                        <p className="text-xs text-argo-grey leading-relaxed">{row.desmotivacion}</p>
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
                {isLoading('reseteo') ? <AISkeleton /> : <p className="text-sm text-argo-grey leading-relaxed">{reseteo}</p>}
            </Card>

            {/* 10. Ecos */}
            <Card>
                <SectionTitle number="10" title="Ecos de la Nave" />
                {isLoading('ecos') ? <AISkeleton /> : <p className="text-sm text-argo-grey leading-relaxed">{ecos}</p>}
            </Card>

            {/* 11. Checklist */}
            <Card>
                <SectionTitle number="11" title="Checklist del Día" />
                <div className="space-y-5">
                    {([
                        { label: 'Antes', text: checklist.antes },
                        { label: 'Durante', text: checklist.durante },
                        { label: 'Después', text: checklist.despues },
                    ] as const).map(({ label, text }) => (
                        <div key={label} className="flex gap-4">
                            <span className="text-[10px] font-bold text-argo-indigo uppercase tracking-widest w-16 flex-shrink-0 pt-0.5">
                                {label}
                            </span>
                            {isLoading('checklist')
                                ? <AISkeleton />
                                : <p className="text-sm text-argo-grey leading-relaxed">{text}</p>
                            }
                        </div>
                    ))}
                </div>
                <p className="text-[10px] text-argo-grey/40 text-center mt-8 uppercase tracking-widest">
                    Diseñado bajo los principios de seguridad emocional de Argo Method
                </p>
            </Card>
        </motion.div>
    );
};
