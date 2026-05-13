import { motion } from 'framer-motion';
import { Card } from '../ui';
import { getPuentesCopy } from '../../lib/puentesTranslations';
import type { Lang, PuentesAiSections } from '../../types/puentes';

interface Props {
    aiSections: PuentesAiSections;
    lang: Lang;
}

export function PuentesReport({ aiSections, lang }: Props) {
    const c = getPuentesCopy(lang);
    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-center mb-2">
                <p className="text-xs uppercase tracking-widest text-argo-violet-500 font-semibold">
                    {c.report.eyebrow}
                </p>
            </div>

            <Card padding="lg">
                <p className="text-xs uppercase tracking-widest text-argo-violet-500 mb-2 font-semibold">
                    {c.report.greetingLabel}
                </p>
                <p className="text-argo-navy leading-relaxed">{aiSections.saludo}</p>
            </Card>

            <Card padding="lg" className="bg-argo-bg">
                <p className="text-xs uppercase tracking-widest text-argo-grey mb-2 font-semibold">
                    {c.report.adultProfileLabel}
                </p>
                <p className="text-argo-secondary leading-relaxed">{aiSections.perfil_adulto_breve}</p>
            </Card>

            {aiSections.puentes.map((p, idx) => (
                <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06 }}
                >
                    <Card padding="lg" className="border-l-4 border-l-argo-violet-300">
                        <p className="text-xs uppercase tracking-widest text-argo-violet-500 mb-1 font-semibold">
                            {c.report.puenteLabel(idx + 1)}
                        </p>
                        <h3 className="text-xl font-semibold text-argo-navy mb-5 tracking-tight">
                            {p.titulo}
                        </h3>
                        <Section label={c.report.sectionChildState} text={p.como_esta_el} />
                        <Section label={c.report.sectionAdultStrength} text={p.lo_que_traes} />
                        <Section label={c.report.sectionBridge} text={p.el_puente} emphasis />
                        <Section label={c.report.sectionReflection} text={p.pregunta_reflexion} italic />
                    </Card>
                </motion.div>
            ))}

            <Card padding="lg" className="bg-argo-bg">
                <p className="text-xs uppercase tracking-widest text-argo-grey mb-2 font-semibold">
                    {c.report.closingLabel}
                </p>
                <p className="text-argo-secondary leading-relaxed">{aiSections.cierre}</p>
            </Card>
        </div>
    );
}

function Section({ label, text, emphasis, italic }: { label: string; text: string; emphasis?: boolean; italic?: boolean }) {
    return (
        <div className="mt-5 first:mt-0">
            <p className="text-xs uppercase tracking-widest text-argo-light mb-1.5 font-semibold">{label}</p>
            <p
                className={[
                    'leading-relaxed',
                    emphasis ? 'text-argo-navy font-medium' : 'text-argo-secondary',
                    italic ? 'italic' : '',
                ].join(' ')}
            >
                {text}
            </p>
        </div>
    );
}
