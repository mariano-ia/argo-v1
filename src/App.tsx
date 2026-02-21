import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppLayout } from './components/layout/AppLayout';
import { SelectionStepper } from './components/ui/SelectionStepper';
import { getReportData, EjeInput, MotorInput } from './lib/argosEngine';
import { ArrowRight, RotateCcw, Microscope } from 'lucide-react';
import { SimulationView } from './components/SimulationView';
import { FullReport } from './components/FullReport';

function App() {
    const [mode, setMode] = useState<'app' | 'simulation'>('simulation');

    // Legacy App State
    const [step, setStep] = useState<'inputs' | 'report'>('inputs');
    const [eje, setEje] = useState<EjeInput>('D');
    const [motor, setMotor] = useState<MotorInput>('Rápido');

    const report = getReportData(eje, motor, '', 'Usuario');

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
                            className="flex flex-col gap-6 max-w-2xl mx-auto w-full py-10"
                        >
                            <button
                                onClick={() => setStep('inputs')}
                                className="self-start flex items-center gap-2 bg-white border border-argo-border px-4 py-2 rounded-full text-argo-grey hover:text-argo-indigo hover:border-indigo-200 hover:bg-indigo-50 transition-all text-xs font-bold uppercase tracking-widest shadow-sm"
                            >
                                <RotateCcw size={12} /> Nuevo perfil
                            </button>
                            <FullReport report={report} onReset={() => setStep('inputs')} />
                        </motion.div>
                    )}
                </AnimatePresence>
            )}
        </AppLayout>
    );
}

export default App;
