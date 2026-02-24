import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ChevronUp, ChevronDown, RotateCcw, Save, ChevronRight } from 'lucide-react';
import { Question } from '../../lib/onboardingData';
import { useQuestions } from '../../lib/useQuestions';

type Axis = 'D' | 'I' | 'S' | 'C';

const AXIS_CONFIG: Record<Axis, { label: string; color: string; bg: string; border: string }> = {
    D: { label: 'Impulsor (D)', color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200' },
    I: { label: 'Conector (I)',  color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    S: { label: 'Sostén (S)',    color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200' },
    C: { label: 'Estratega (C)', color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200' },
};

const AxisBadge: React.FC<{ axis: Axis; onClick?: () => void; clickable?: boolean }> = ({ axis, onClick, clickable }) => {
    const cfg = AXIS_CONFIG[axis];
    return (
        <button
            onClick={onClick}
            disabled={!clickable}
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all ${cfg.bg} ${cfg.border} ${cfg.color} ${clickable ? 'hover:scale-105 cursor-pointer' : 'cursor-default'}`}
            title={clickable ? 'Clic para cambiar eje' : undefined}
        >
            {axis}
        </button>
    );
};

const AXIS_CYCLE: Axis[] = ['D', 'I', 'S', 'C'];

interface QuestionRowProps {
    question: Question;
    index: number;
    total: number;
    onUpdate: (q: Question) => void;
    onDelete: () => void;
    onMove: (dir: 'up' | 'down') => void;
}

const QuestionRow: React.FC<QuestionRowProps> = ({ question, index, total, onUpdate, onDelete, onMove }) => {
    const [expanded, setExpanded] = useState(false);
    const [local, setLocal] = useState<Question>(question);

    const cycleAxis = (optIdx: number) => {
        const current = local.options[optIdx].axis as Axis;
        const next = AXIS_CYCLE[(AXIS_CYCLE.indexOf(current) + 1) % AXIS_CYCLE.length];
        const updated = {
            ...local,
            options: local.options.map((o, i) => i === optIdx ? { ...o, axis: next } : o),
        };
        setLocal(updated);
        onUpdate(updated);
    };

    const saveField = (field: 'title' | 'intro', val: string) => {
        const updated = { ...local, [field]: val };
        setLocal(updated);
        onUpdate(updated);
    };

    const saveOption = (optIdx: number, val: string) => {
        const updated = {
            ...local,
            options: local.options.map((o, i) => i === optIdx ? { ...o, label: val } : o),
        };
        setLocal(updated);
        onUpdate(updated);
    };

    const allAxes = local.options.map(o => o.axis as Axis);
    const axisSet = new Set(allAxes);
    const hasAllAxes = axisSet.size === 4;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="border border-argo-border rounded-argo-lg overflow-hidden bg-white"
        >
            {/* Header row */}
            <div className="flex items-center gap-3 px-4 py-3">
                <span className="w-6 h-6 rounded-full bg-argo-navy text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                    {index + 1}
                </span>
                <span className="flex-1 text-sm font-semibold text-argo-navy truncate">{local.title}</span>

                <div className="flex items-center gap-0.5">
                    {local.options.map((o, i) => (
                        <AxisBadge key={i} axis={o.axis as Axis} />
                    ))}
                </div>

                {!hasAllAxes && (
                    <span className="text-[9px] font-bold text-amber-600 uppercase tracking-widest">
                        ⚠ Ejes repetidos
                    </span>
                )}

                <div className="flex items-center gap-1 ml-2">
                    <button onClick={() => onMove('up')} disabled={index === 0} className="p-1 text-argo-grey hover:text-argo-navy disabled:opacity-20 cursor-pointer">
                        <ChevronUp size={14} />
                    </button>
                    <button onClick={() => onMove('down')} disabled={index === total - 1} className="p-1 text-argo-grey hover:text-argo-navy disabled:opacity-20 cursor-pointer">
                        <ChevronDown size={14} />
                    </button>
                    <button
                        onClick={() => setExpanded(e => !e)}
                        className="p-1.5 text-argo-grey hover:text-argo-indigo transition-colors cursor-pointer"
                    >
                        <ChevronRight size={14} className={`transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`} />
                    </button>
                    <button onClick={onDelete} className="p-1.5 text-argo-grey hover:text-red-500 transition-colors cursor-pointer">
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {/* Expanded edit form */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-argo-border"
                    >
                        <div className="p-5 space-y-5 bg-argo-neutral/50">
                            {/* Title */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-argo-grey uppercase tracking-widest">Título</label>
                                <input
                                    value={local.title}
                                    onChange={e => saveField('title', e.target.value)}
                                    className="w-full border border-argo-border rounded-argo-sm px-3 py-2 text-sm text-argo-navy focus:outline-none focus:border-argo-indigo bg-white"
                                />
                            </div>

                            {/* Intro */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-argo-grey uppercase tracking-widest">Enunciado</label>
                                <textarea
                                    value={local.intro}
                                    onChange={e => saveField('intro', e.target.value)}
                                    rows={2}
                                    className="w-full border border-argo-border rounded-argo-sm px-3 py-2 text-sm text-argo-navy focus:outline-none focus:border-argo-indigo bg-white resize-none"
                                />
                            </div>

                            {/* Options */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-argo-grey uppercase tracking-widest">
                                    Opciones — clic en el eje para rotarlo
                                </label>
                                {local.options.map((opt, optIdx) => (
                                    <div key={optIdx} className="flex items-start gap-2">
                                        <AxisBadge
                                            axis={opt.axis as Axis}
                                            onClick={() => cycleAxis(optIdx)}
                                            clickable
                                        />
                                        <input
                                            value={opt.label}
                                            onChange={e => saveOption(optIdx, e.target.value)}
                                            className="flex-1 border border-argo-border rounded-argo-sm px-3 py-1.5 text-sm text-argo-navy focus:outline-none focus:border-argo-indigo bg-white"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export const QuestionManager: React.FC = () => {
    const { questions, updateQuestion, addQuestion, deleteQuestion, moveQuestion, resetToDefaults } = useQuestions();
    const [confirmReset, setConfirmReset] = useState(false);

    return (
        <div className="max-w-2xl mx-auto py-8 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <div className="text-[10px] font-bold text-argo-indigo uppercase tracking-[0.2em] mb-1">
                        Panel de Administración
                    </div>
                    <h2 className="font-display text-2xl font-bold text-argo-navy">Gestor de Preguntas</h2>
                    <p className="text-sm text-argo-grey mt-1">
                        {questions.length} preguntas · Cambios guardados automáticamente
                    </p>
                </div>
                <div className="flex gap-2 items-center">
                    {confirmReset ? (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-red-600 font-semibold">¿Seguro?</span>
                            <button onClick={() => { resetToDefaults(); setConfirmReset(false); }} className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-argo-sm cursor-pointer">
                                Sí, restaurar
                            </button>
                            <button onClick={() => setConfirmReset(false)} className="px-3 py-1.5 border border-argo-border text-xs font-bold rounded-argo-sm cursor-pointer">
                                Cancelar
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setConfirmReset(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-argo-border text-xs font-bold text-argo-grey hover:text-argo-navy rounded-argo-sm transition-all cursor-pointer"
                        >
                            <RotateCcw size={12} /> Restaurar
                        </button>
                    )}
                </div>
            </div>

            {/* Save indicator */}
            <div className="flex items-center gap-2 text-[10px] text-green-600 font-bold uppercase tracking-widest">
                <Save size={11} /> Los cambios se guardan automáticamente en este dispositivo
            </div>

            {/* Question list */}
            <AnimatePresence mode="popLayout">
                {questions.map((q, i) => (
                    <QuestionRow
                        key={`${q.number}-${i}`}
                        question={q}
                        index={i}
                        total={questions.length}
                        onUpdate={updated => updateQuestion(i, updated)}
                        onDelete={() => deleteQuestion(i)}
                        onMove={dir => moveQuestion(i, dir)}
                    />
                ))}
            </AnimatePresence>

            {/* Add */}
            <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={addQuestion}
                className="w-full border-2 border-dashed border-argo-border hover:border-argo-indigo text-argo-grey hover:text-argo-indigo rounded-argo-lg py-4 flex items-center justify-center gap-2 text-sm font-semibold transition-all cursor-pointer"
            >
                <Plus size={18} /> Agregar pregunta
            </motion.button>
        </div>
    );
};
