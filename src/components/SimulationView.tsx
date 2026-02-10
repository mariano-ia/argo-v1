
import React, { useState, useEffect } from 'react';
import { generateRandomSimulation, SimulationState, QUESTIONS, OPTIONS } from '../lib/simulationData';
import { resolveProfile } from '../lib/profileResolver';
import { getReportData } from '../lib/argosEngine';
import { RefreshCw, Settings2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const SimulationView: React.FC = () => {
    const [simState, setSimState] = useState<SimulationState | null>(null);

    // Initial load
    useEffect(() => {
        handleNewSimulation();
    }, []);

    const handleNewSimulation = () => {
        setSimState(generateRandomSimulation());
    };

    const handleAnswerChange = (qId: number) => {
        if (!simState) return;
        const current = simState.answers[qId];
        const currentIndex = OPTIONS.indexOf(current);
        const nextIndex = (currentIndex + 1) % OPTIONS.length;
        const nextOption = OPTIONS[nextIndex];

        setSimState({
            ...simState,
            answers: {
                ...simState.answers,
                [qId]: nextOption
            }
        });
    };

    if (!simState) return <div className="p-10 text-center">Cargando simulador...</div>;

    // Execute Logic
    const answerValues = Object.values(simState.answers);
    const profile = resolveProfile(answerValues);
    const report = getReportData(profile.eje, profile.motor, "Mantenga su interés", simState.name);

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20 pt-10">
            {/* Control Header */}
            <div className="flex border-b border-argo-border pb-6 items-end justify-between">
                <div>
                    <h1 className="font-display text-3xl font-bold text-argo-navy tracking-tight">
                        Simulador Argo
                    </h1>
                    <p className="text-argo-grey text-sm font-medium">Entorno de Pruebas y Calibración</p>
                </div>
                <button
                    onClick={handleNewSimulation}
                    className="flex items-center gap-2 px-6 py-2.5 bg-argo-indigo text-white text-sm font-semibold rounded-argo-sm hover:bg-[#4B51E6] transition-all shadow-sm"
                >
                    <RefreshCw size={16} /> Simular Otro
                </button>
            </div>

            {/* Visualización de Inputs */}
            <div className="bg-white border border-argo-border rounded-argo-lg overflow-hidden shadow-sm">
                <div className="bg-gray-50/50 px-6 py-3 border-b border-argo-border">
                    <span className="text-[10px] font-bold text-argo-grey uppercase tracking-widest">Datos del Sujeto</span>
                </div>
                <div className="grid grid-cols-3 divide-x divide-argo-border text-center">
                    <div className="p-6">
                        <div className="text-[9px] text-argo-grey uppercase font-bold tracking-widest mb-1">Nombre</div>
                        <div className="text-xl font-bold text-argo-navy font-display">{simState.name}</div>
                    </div>
                    <div className="p-6">
                        <div className="text-[9px] text-argo-grey uppercase font-bold tracking-widest mb-1">Deporte</div>
                        <div className="text-xl font-bold text-argo-navy font-display">{simState.sport}</div>
                    </div>
                    <div className="p-6">
                        <div className="text-[9px] text-argo-grey uppercase font-bold tracking-widest mb-1">Edad</div>
                        <div className="text-xl font-bold text-argo-navy font-display">{simState.age}</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Inputs Matrix */}
                <div className="bg-white border border-argo-border rounded-argo-lg shadow-sm overflow-hidden">
                    <div className="bg-gray-50/50 px-6 py-3 border-b border-argo-border">
                        <span className="text-[10px] font-bold text-argo-grey uppercase tracking-widest">Matriz de Respuestas (Click para modificar)</span>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-4 gap-2">
                            {QUESTIONS.map((q) => {
                                const ans = simState.answers[q.id];
                                let color = "bg-argo-neutral border-argo-border text-argo-grey";

                                if (ans === 'IMP') color = "bg-indigo-50 border-argo-indigo text-argo-indigo font-bold";
                                if (ans === 'CON') color = "bg-indigo-50 border-argo-indigo text-argo-indigo font-bold";
                                if (ans === 'SOS') color = "bg-indigo-50 border-argo-indigo text-argo-indigo font-bold";
                                if (ans === 'EST') color = "bg-indigo-50 border-argo-indigo text-argo-indigo font-bold";

                                return (
                                    <motion.button
                                        key={q.id}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleAnswerChange(q.id)}
                                        className={`flex flex-col items-center justify-center p-2 rounded border ${color} transition-all`}
                                    >
                                        <div className="text-[10px] opacity-70 mb-0.5 uppercase">P{q.id}</div>
                                        <div className="font-bold text-sm tracking-tight">{ans}</div>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Logic Execution Display */}
                <div className="bg-white border border-argo-border rounded-argo-lg shadow-sm overflow-hidden">
                    <div className="bg-gray-50/50 px-6 py-3 border-b border-argo-border">
                        <span className="text-[10px] font-bold text-argo-grey uppercase tracking-widest">Lógica de Ejecución (Resolver)</span>
                    </div>
                    <div className="p-6 space-y-6">
                        <div>
                            <div className="text-[9px] text-argo-grey font-bold uppercase tracking-widest mb-2">Conteo de Factores</div>
                            <div className="flex gap-2">
                                {Object.entries(profile.counts).map(([key, val]) => (
                                    <div key={key} className="flex-1 bg-argo-neutral border border-argo-border rounded p-2 text-center">
                                        <span className="block text-[10px] font-bold text-argo-grey">{key}</span>
                                        <span className="font-bold text-argo-navy">{val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-6 bg-argo-navy rounded-argo-lg text-white shadow-xl">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Eje Dominante:</span>
                                <span className="font-bold text-white text-lg">{profile.eje}</span>
                            </div>
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Motor / Ritmo:</span>
                                <span className="font-bold text-white text-lg">{profile.motor}</span>
                            </div>
                            <div className="pt-4 border-t border-white/10">
                                <span className="block text-[9px] text-indigo-300 font-bold uppercase tracking-widest mb-1">Arquetipo Resultante</span>
                                <span className="block text-2xl font-bold font-display tracking-tight text-white">
                                    {profile.arquetipoLabel}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Report Preview */}
            <div className="space-y-4 pt-4">
                <div className="flex items-center gap-2 ml-1">
                    <Settings2 size={16} className="text-argo-indigo" />
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-argo-navy">Salida del Generador de Informes</h3>
                </div>

                <div className="bg-white border border-argo-border rounded-argo-lg shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-argo-border bg-gray-50/50">
                        <h2 className="text-3xl font-bold font-display text-argo-navy tracking-tight">{report.arquetipo.label}</h2>
                    </div>

                    <div className="p-10 space-y-10 text-argo-navy text-sm leading-relaxed">
                        <section>
                            <h4 className="text-[10px] font-bold text-argo-indigo uppercase tracking-widest mb-3">Bienvenida</h4>
                            <p className="bg-argo-neutral p-6 rounded-argo-lg italic border-l-4 border-argo-indigo text-argo-grey">
                                {report.bienvenida}
                            </p>
                        </section>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-y border-argo-border py-10">
                            <section>
                                <h4 className="text-[10px] font-bold text-argo-navy uppercase tracking-widest mb-2 font-display">Brújula ({profile.eje})</h4>
                                <p className="text-argo-grey leading-relaxed">{report.brujula}</p>
                            </section>
                            <section>
                                <h4 className="text-[10px] font-bold text-argo-navy uppercase tracking-widest mb-2 font-display">Ritmo ({profile.motor})</h4>
                                <p className="text-argo-grey leading-relaxed">{report.ritmo}</p>
                            </section>
                        </div>

                        <section>
                            <h4 className="text-[10px] font-bold text-argo-indigo uppercase tracking-widest mb-4">Sintonía (Protocolo Activo)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-6 bg-green-50/50 border border-green-100 rounded-argo-lg space-y-3">
                                    <div className="text-[10px] font-bold text-green-600 uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div> Hacer
                                    </div>
                                    <div className="text-argo-navy font-medium italic">{report.sintonia?.hacer}</div>
                                </div>
                                <div className="p-6 bg-red-50/50 border border-red-100 rounded-argo-lg space-y-3">
                                    <div className="text-[10px] font-bold text-red-600 uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-red-500"></div> Evitar
                                    </div>
                                    <div className="text-argo-navy font-medium italic">{report.sintonia?.evitar}</div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};
