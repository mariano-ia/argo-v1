import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppLayout } from './components/layout/AppLayout';
import { SelectionStepper } from './components/ui/SelectionStepper';
import { Brujula } from './components/charts/Brujula';
import { TuningTable } from './components/ui/TuningTable';
import { getReportData, EjeInput, MotorInput, SintoniaInput } from './lib/argosEngine';
import { ArrowRight, RotateCcw, Microscope } from 'lucide-react';
import { SimulationView } from './components/SimulationView';

function App() {
    const [mode, setMode] = useState<'app' | 'simulation'>('simulation');

    // Legacy App State
    const [step, setStep] = useState<'inputs' | 'report'>('inputs');
    const [eje, setEje] = useState<EjeInput>('D');
    const [motor, setMotor] = useState<MotorInput>('Lento');
    const [sintonia, setSintonia] = useState<SintoniaInput>('Mantenga su interés');

    const report = getReportData(eje, motor, sintonia, "Usuario");

    // Chart data mapping based on Eje
    const getChartData = (axis: string) => {
        // Deterministic simulation for the chart based on the primary axis
        const base = 30;
        const peak = 90;
        return [
            { subject: 'D', A: axis.includes('D') ? peak : base, fullMark: 100 },
            { subject: 'I', A: axis.includes('I') ? peak : base, fullMark: 100 },
            { subject: 'S', A: axis.includes('S') ? peak : base, fullMark: 100 },
            { subject: 'C', A: axis.includes('C') ? peak : base, fullMark: 100 },
        ];
    };

    return (
        <AppLayout>
            <div className="flex justify-end -mb-4 relative z-20">
                <button
                    onClick={() => setMode(mode === 'app' ? 'simulation' : 'app')}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-argo-border rounded-full text-[10px] font-bold text-argo-grey hover:text-argo-indigo hover:border-argo-indigo transition-all uppercase tracking-widest"
                >
                    <Microscope size={12} />
                    {mode === 'app' ? 'Ir al Simulador' : 'Ver App Usuario'}
                </button>
            </div>

            {mode === 'simulation' ? (
                <SimulationView />
            ) : (
                <AnimatePresence mode="wait">
                    {step === 'inputs' ? (
                        <motion.div
                            key="inputs"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="flex flex-col gap-10 max-w-lg mx-auto w-full py-10"
                        >
                            <div className="space-y-3">
                                <div className="text-[10px] text-argo-indigo font-bold uppercase tracking-[0.2em]">Configuración de Sensores</div>
                                <h2 className="font-display text-3xl font-bold text-argo-navy tracking-tight">
                                    Calibración de Perfil
                                </h2>
                                <p className="text-sm text-argo-grey border-l-2 border-argo-indigo pl-4 italic leading-relaxed">
                                    Ajuste los drivers de comportamiento para generar una cartografía de sintonía precisa.
                                </p>
                            </div>

                            <div className="space-y-8">
                                <SelectionStepper
                                    title="Eje Dominante (Vectores DISC)"
                                    selectedValue={eje}
                                    onSelect={setEje}
                                    options={[
                                        { id: 'd', label: 'Impulsor (D)', value: 'D' },
                                        { id: 'i', label: 'Conector (I)', value: 'I' },
                                        { id: 's', label: 'Sostén (S)', value: 'S' },
                                        { id: 'c', label: 'Estratega (C)', value: 'C' },
                                        { id: 'cs', label: 'Estratega (C+S)', value: 'C+S' },
                                    ]}
                                />

                                <SelectionStepper
                                    title="Motor (Dinámica de Ritmo)"
                                    selectedValue={motor}
                                    onSelect={setMotor}
                                    options={[
                                        { id: 'rapido', label: 'Rápido', value: 'Rápido' },
                                        { id: 'medio', label: 'Medio', value: 'Medio' },
                                        { id: 'lento', label: 'Lento', value: 'Lento' },
                                    ]}
                                />

                                <SelectionStepper
                                    title="Protocolo de Sintonía (Contexto)"
                                    selectedValue={sintonia}
                                    onSelect={setSintonia}
                                    options={[
                                        { id: 'interes', label: 'Mantenga su interés', value: 'Mantenga su interés' },
                                        { id: 'stress', label: 'Bajo Presión', value: 'Bajo Presión' },
                                    ]}
                                />
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setStep('report')}
                                className="w-full bg-argo-navy text-white font-bold py-4 rounded-argo-sm shadow-lg shadow-argo-navy/20 flex items-center justify-center gap-3 mt-6 uppercase tracking-widest text-xs"
                            >
                                INICIAR PROCESAMIENTO <ArrowRight size={18} />
                            </motion.button>

                        </motion.div>
                    ) : (
                        <motion.div
                            key="report"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col gap-8 max-w-2xl mx-auto w-full py-10"
                        >
                            {/* Header Reporte: v2.0 */}
                            <div className="flex items-end justify-between border-b border-argo-border pb-6">
                                <div>
                                    <div className="text-[10px] uppercase tracking-[0.2em] text-argo-indigo font-bold mb-2">Identidad Visualizada</div>
                                    <h2 className="font-display text-4xl font-bold text-argo-navy tracking-tight">{report.arquetipo.label}</h2>
                                </div>
                                <div className="px-4 py-1.5 bg-gray-50 border border-argo-border rounded-full text-[10px] font-bold text-argo-grey uppercase tracking-widest">
                                    REF: {report.arquetipo.id.toUpperCase()}
                                </div>
                            </div>

                            {/* Bienvenida: Authority Style */}
                            <div className="bg-argo-neutral p-8 border border-argo-border rounded-argo-lg italic text-argo-grey leading-relaxed text-lg text-center border-l-4 border-l-argo-indigo shadow-sm">
                                "{report.bienvenida}"
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Brújula */}
                                <div className="bg-white p-8 border border-argo-border rounded-argo-lg shadow-sm">
                                    <h3 className="text-[10px] font-bold text-argo-grey uppercase tracking-widest mb-6 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-argo-indigo"></div> Cartografía DISC
                                    </h3>
                                    <div className="h-[300px] flex items-center justify-center">
                                        <Brujula axesData={getChartData(eje)} />
                                    </div>
                                    <p className="mt-6 text-xs text-argo-grey text-center leading-relaxed">
                                        {report.brujula}
                                    </p>
                                </div>

                                {/* Ritmo */}
                                <div className="bg-white p-8 border border-argo-border rounded-argo-lg shadow-sm space-y-6">
                                    <h3 className="text-[10px] font-bold text-argo-grey uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-argo-navy"></div> Dinámica Temporal
                                    </h3>
                                    <div className="flex items-center gap-5 p-4 bg-argo-neutral rounded-argo-md border border-argo-border">
                                        <div className="w-14 h-14 rounded-full bg-argo-navy flex items-center justify-center text-white text-xl font-bold font-display shadow-md">
                                            {motor[0]}
                                        </div>
                                        <div>
                                            <div className="text-xs text-argo-grey font-bold uppercase tracking-widest">Motor / Ritmo</div>
                                            <div className="text-2xl font-bold text-argo-navy">{motor}</div>
                                        </div>
                                    </div>
                                    <p className="text-sm leading-relaxed text-argo-grey">{report.ritmo}</p>
                                </div>
                            </div>

                            {/* Sintonía: Tuning Module */}
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-bold text-argo-grey uppercase tracking-widest flex items-center gap-2 px-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div> Módulo de Sintonía Activo
                                </h3>
                                <div className="bg-white border border-argo-border rounded-argo-lg shadow-sm overflow-hidden">
                                    <TuningTable data={report.sintonia} />
                                </div>
                            </div>

                            {/* Reset Action */}
                            <button
                                onClick={() => setStep('inputs')}
                                className="mx-auto flex items-center gap-2 bg-white border border-argo-border px-6 py-2.5 rounded-full text-argo-grey hover:text-argo-indigo hover:border-indigo-200 hover:bg-indigo-50 transition-all text-xs font-bold uppercase tracking-widest shadow-sm mt-4"
                            >
                                <RotateCcw size={14} /> Calibrar Nuevo Perfil
                            </button>

                        </motion.div>
                    )}
                </AnimatePresence>
            )}
        </AppLayout>
    );
}

export default App;
