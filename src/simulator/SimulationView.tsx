
import React, { useState } from 'react';
import { getReportData } from '../lib/argosEngine';
import { ARCHETYPE_DATA } from '../lib/archetypeData';
import { generateAISections, AISections, AIUsage, ReportContext } from '../lib/openaiService';
import { FullReport } from '../components/FullReport';
import { motion } from 'framer-motion';
import { RefreshCw, ChevronRight, Sparkles, Zap } from 'lucide-react';

type Eje = 'D' | 'I' | 'S' | 'C';
type Motor = 'Rápido' | 'Medio' | 'Lento';
type Destinatario = 'padre' | 'entrenador';

const EJES: { value: Eje; label: string; color: string }[] = [
    { value: 'D', label: 'Impulsor (D)', color: 'bg-red-50 border-red-200 text-red-700' },
    { value: 'I', label: 'Conector (I)', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
    { value: 'S', label: 'Sostén (S)',   color: 'bg-green-50 border-green-200 text-green-700' },
    { value: 'C', label: 'Estratega (C)', color: 'bg-blue-50 border-blue-200 text-blue-700' },
];

const MOTORES: { value: Motor; label: string }[] = [
    { value: 'Rápido', label: 'Rápido' },
    { value: 'Medio',  label: 'Medio'  },
    { value: 'Lento',  label: 'Lento'  },
];

const DEPORTES = [
    'Fútbol', 'Hockey', 'Básquet', 'Rugby', 'Tenis', 'Natación',
    'Voley', 'Atletismo', 'Handball', 'Béisbol',
];

const NOMBRES = ['Sofía', 'Mateo', 'Valentina', 'Santiago', 'Camila', 'Lucía', 'Nicolás', 'Mariana'];

function randomName() {
    return NOMBRES[Math.floor(Math.random() * NOMBRES.length)];
}

type AIStatus = 'idle' | 'loading' | 'done' | 'error';

export const SimulationView: React.FC = () => {
    const [eje,    setEje]    = useState<Eje>('D');
    const [motor,  setMotor]  = useState<Motor>('Rápido');
    const [nombre, setNombre] = useState(randomName());
    const [deporte, setDeporte] = useState('Fútbol');
    const [deporteCustom, setDeporteCustom] = useState('');
    const [edad,   setEdad]   = useState(10);
    const [destinatario, setDestinatario] = useState<Destinatario>('padre');
    const [aiEnabled, setAiEnabled] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [aiStatus,  setAiStatus]  = useState<AIStatus>('idle');
    const [aiSections, setAiSections] = useState<AISections | null>(null);
    const [aiUsage,   setAiUsage]   = useState<AIUsage | null>(null);
    const [aiError,   setAiError]   = useState('');

    const deporteFinal = deporte === '__custom__' ? deporteCustom : deporte;
    const currentArchetype = Object.values(ARCHETYPE_DATA).find(
        a => a.eje === eje && a.motor === motor
    );
    const baseReport = getReportData(eje, motor, '', nombre);

    const handleGenerate = async () => {
        setShowReport(true);
        if (!aiEnabled) return;

        setAiStatus('loading');
        setAiSections(null);
        setAiUsage(null);
        setAiError('');
        try {
            const ctx: ReportContext = { nombre, deporte: deporteFinal, edad, destinatario };
            const { sections, usage } = await generateAISections(baseReport, ctx);
            setAiSections(sections);
            setAiUsage(usage);
            setAiStatus('done');
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error('[Argo AI] Error al generar con IA:', err);
            setAiError(msg);
            setAiStatus('error');
        }
    };

    const handleReset = () => {
        setShowReport(false);
        setAiSections(null);
        setAiUsage(null);
        setAiStatus('idle');
        setAiError('');
    };

    // Merge AI sections into base report
    const report = aiSections
        ? {
            ...baseReport,
            wow:       aiSections.wow,
            motorDesc: aiSections.motorDesc,
            combustible: aiSections.combustible,
            corazon:   aiSections.corazon,
            reseteo:   aiSections.reseteo,
            ecos:      aiSections.ecos,
            checklist: aiSections.checklist,
          }
        : baseReport;

    return (
        <div className="max-w-2xl mx-auto space-y-8 pb-20 pt-10">
            {/* Header */}
            <div className="border-b border-argo-border pb-6">
                <div className="text-[10px] text-argo-indigo font-bold uppercase tracking-[0.2em] mb-1">
                    Entorno de Pruebas
                </div>
                <h1 className="font-display text-3xl font-bold text-argo-navy tracking-tight">
                    Simulador de Informes
                </h1>
                <p className="text-sm text-argo-grey mt-1">Explorá los 12 arquetipos del Método Argo</p>
            </div>

            {!showReport ? (
                <motion.div
                    key="selector"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                >
                    {/* — Nombre — */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-argo-grey uppercase tracking-widest">
                            Nombre del Deportista
                        </label>
                        <div className="flex gap-2 items-center">
                            <input
                                type="text"
                                value={nombre}
                                onChange={e => setNombre(e.target.value)}
                                className="flex-1 border border-argo-border rounded-argo-sm px-4 py-2.5 text-sm text-argo-navy focus:outline-none focus:border-argo-indigo font-medium"
                                placeholder="Nombre..."
                            />
                            <button
                                onClick={() => setNombre(randomName())}
                                className="p-2.5 border border-argo-border rounded-argo-sm text-argo-grey hover:text-argo-indigo hover:border-argo-indigo transition-all"
                                title="Nombre aleatorio"
                            >
                                <RefreshCw size={16} />
                            </button>
                        </div>
                    </div>

                    {/* — Eje DISC — */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-argo-grey uppercase tracking-widest">
                            Eje Dominante (DISC)
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {EJES.map(e => (
                                <button
                                    key={e.value}
                                    onClick={() => setEje(e.value)}
                                    className={`px-4 py-3 rounded-argo-sm border text-sm font-semibold transition-all text-left ${
                                        eje === e.value
                                            ? e.color + ' ring-2 ring-offset-1 ring-argo-indigo'
                                            : 'bg-white border-argo-border text-argo-grey hover:border-argo-indigo'
                                    }`}
                                >
                                    {e.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* — Motor — */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-argo-grey uppercase tracking-widest">
                            Motor (Ritmo de Procesamiento)
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {MOTORES.map(m => (
                                <button
                                    key={m.value}
                                    onClick={() => setMotor(m.value)}
                                    className={`px-4 py-3 rounded-argo-sm border text-sm font-semibold transition-all ${
                                        motor === m.value
                                            ? 'bg-argo-navy text-white border-argo-navy'
                                            : 'bg-white border-argo-border text-argo-grey hover:border-argo-navy'
                                    }`}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* — Arquetipo preview — */}
                    {currentArchetype && (
                        <div className="p-6 bg-argo-neutral border border-argo-border rounded-argo-lg space-y-1">
                            <div className="text-[10px] font-bold text-argo-indigo uppercase tracking-widest">
                                Arquetipo resultante
                            </div>
                            <div className="text-2xl font-bold text-argo-navy font-display">
                                {currentArchetype.label}
                            </div>
                            <div className="text-sm text-argo-grey italic">{currentArchetype.perfil}</div>
                        </div>
                    )}

                    {/* — Mapa 12 arquetipos — */}
                    <div className="space-y-3">
                        <div className="text-[10px] font-bold text-argo-grey uppercase tracking-widest">
                            Mapa de los 12 Arquetipos
                        </div>
                        <div className="border border-argo-border rounded-argo-lg overflow-hidden">
                            <div className="grid grid-cols-4 bg-argo-neutral border-b border-argo-border text-center">
                                <div className="p-2 text-[9px] font-bold text-argo-grey uppercase tracking-widest">Eje</div>
                                {MOTORES.map(m => (
                                    <div key={m.value} className="p-2 text-[9px] font-bold text-argo-grey uppercase tracking-widest border-l border-argo-border">
                                        {m.label}
                                    </div>
                                ))}
                            </div>
                            {EJES.map(e => (
                                <div key={e.value} className="grid grid-cols-4 border-t border-argo-border">
                                    <div className="p-3 flex items-center">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${e.color}`}>
                                            {e.value}
                                        </span>
                                    </div>
                                    {MOTORES.map(m => {
                                        const arch = Object.values(ARCHETYPE_DATA).find(
                                            a => a.eje === e.value && a.motor === m.value
                                        );
                                        const isActive = eje === e.value && motor === m.value;
                                        return (
                                            <button
                                                key={m.value}
                                                onClick={() => { setEje(e.value); setMotor(m.value); }}
                                                className={`p-3 border-l border-argo-border text-left transition-all ${
                                                    isActive
                                                        ? 'bg-argo-indigo/10 text-argo-indigo'
                                                        : 'hover:bg-argo-neutral text-argo-grey'
                                                }`}
                                            >
                                                <span className="text-[10px] font-semibold leading-tight block">
                                                    {arch ? arch.label : '-'}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ─── Separador ─── */}
                    <div className="border-t border-argo-border pt-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-[10px] font-bold text-argo-grey uppercase tracking-widest mb-0.5">
                                    Modo IA
                                </div>
                                <div className="text-xs text-argo-grey/70">
                                    Personaliza el informe con deporte, edad y destinatario
                                </div>
                            </div>
                            {/* Toggle */}
                            <button
                                onClick={() => setAiEnabled(v => !v)}
                                className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                                    aiEnabled ? 'bg-argo-indigo' : 'bg-argo-border'
                                }`}
                            >
                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                                    aiEnabled ? 'translate-x-6' : 'translate-x-0'
                                }`} />
                            </button>
                        </div>

                        {/* Campos AI — solo visibles si AI está activado */}
                        {aiEnabled && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-5 overflow-hidden"
                            >
                                {/* Deporte */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-argo-grey uppercase tracking-widest">
                                        Deporte
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {DEPORTES.map(d => (
                                            <button
                                                key={d}
                                                onClick={() => setDeporte(d)}
                                                className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                                                    deporte === d && deporte !== '__custom__'
                                                        ? 'bg-argo-navy text-white border-argo-navy'
                                                        : 'bg-white border-argo-border text-argo-grey hover:border-argo-navy'
                                                }`}
                                            >
                                                {d}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => setDeporte('__custom__')}
                                            className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                                                deporte === '__custom__'
                                                    ? 'bg-argo-navy text-white border-argo-navy'
                                                    : 'bg-white border-argo-border text-argo-grey hover:border-argo-navy'
                                            }`}
                                        >
                                            Otro...
                                        </button>
                                    </div>
                                    {deporte === '__custom__' && (
                                        <input
                                            type="text"
                                            value={deporteCustom}
                                            onChange={e => setDeporteCustom(e.target.value)}
                                            placeholder="Escribí el deporte..."
                                            className="w-full border border-argo-border rounded-argo-sm px-4 py-2.5 text-sm text-argo-navy focus:outline-none focus:border-argo-indigo"
                                        />
                                    )}
                                </div>

                                {/* Edad */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-argo-grey uppercase tracking-widest">
                                        Edad — {edad} años
                                    </label>
                                    <input
                                        type="range"
                                        min={8} max={16} value={edad}
                                        onChange={e => setEdad(Number(e.target.value))}
                                        className="w-full accent-argo-indigo"
                                    />
                                    <div className="flex justify-between text-[10px] text-argo-grey">
                                        <span>8</span><span>12</span><span>16</span>
                                    </div>
                                </div>

                                {/* Destinatario */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-argo-grey uppercase tracking-widest">
                                        Destinatario del informe
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {([
                                            { value: 'padre',      label: 'Padre / Madre' },
                                            { value: 'entrenador', label: 'Entrenador / Coach' },
                                        ] as const).map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setDestinatario(opt.value)}
                                                className={`px-4 py-3 rounded-argo-sm border text-sm font-semibold transition-all ${
                                                    destinatario === opt.value
                                                        ? 'bg-argo-indigo text-white border-argo-indigo'
                                                        : 'bg-white border-argo-border text-argo-grey hover:border-argo-indigo'
                                                }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* CTA */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleGenerate}
                        disabled={!currentArchetype || (aiEnabled && deporte === '__custom__' && !deporteCustom)}
                        className={`w-full font-bold py-4 rounded-argo-sm shadow-lg flex items-center justify-center gap-3 uppercase tracking-widest text-xs disabled:opacity-40 transition-colors ${
                            aiEnabled
                                ? 'bg-argo-indigo text-white shadow-argo-indigo/20'
                                : 'bg-argo-navy text-white shadow-argo-navy/20'
                        }`}
                    >
                        {aiEnabled ? <Sparkles size={16} /> : <ChevronRight size={18} />}
                        {aiEnabled ? 'GENERAR CON IA' : 'GENERAR INFORME'}
                    </motion.button>
                </motion.div>
            ) : (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-2 text-xs font-bold text-argo-grey hover:text-argo-indigo uppercase tracking-widest transition-all"
                        >
                            ← Volver al selector
                        </button>
                        {aiEnabled && (
                            <div className="flex items-center gap-1.5">
                                {aiStatus === 'loading' && (
                                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-argo-indigo uppercase tracking-widest animate-pulse">
                                        <Sparkles size={12} /> Generando con IA...
                                    </span>
                                )}
                                {aiStatus === 'done' && (
                                    <div className="flex flex-col items-end gap-0.5">
                                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-600 uppercase tracking-widest">
                                            <Zap size={12} /> IA Activa · {deporteFinal} · {edad} años · {destinatario}
                                        </span>
                                        {aiUsage && (
                                            <span className="text-[9px] text-argo-grey/60 font-mono tracking-wide">
                                                {aiUsage.totalTokens.toLocaleString()} tokens · ${aiUsage.costUsd.toFixed(4)}
                                            </span>
                                        )}
                                    </div>
                                )}
                                {aiStatus === 'error' && (
                                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">
                                        Error IA — mostrando base
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {aiStatus === 'error' && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-argo-md text-xs text-red-600">
                            <span className="font-bold block mb-1">Error al generar con IA:</span>
                            <span className="font-mono break-all">{aiError || 'Error desconocido. Revisá la consola del navegador (F12) para más detalles.'}</span>
                        </div>
                    )}

                    <FullReport
                        report={report}
                        onReset={handleReset}
                        aiActive={aiStatus === 'done'}
                        aiLoading={aiStatus === 'loading'}
                        deporte={deporteFinal}
                    />
                </div>
            )}
        </div>
    );
};
