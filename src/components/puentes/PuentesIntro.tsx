import { motion } from 'framer-motion';
import { Button, Card } from '../ui';
import { getPuentesCopy } from '../../lib/puentesTranslations';
import type { Lang } from '../../types/puentes';

interface Props {
    lang: Lang;
    onStart: () => void;
    // Fast-path (R6): the adult has a fresh saved profile, so the questionnaire
    // is skipped — the intro explains it and the CTA generates directly.
    fastPath?: boolean;
}

// The adult questionnaire is generic and reusable (it measures the adult, not a
// specific child), so there is no child-anchor selector: one profile serves
// every child the adult bridges toward.
export function PuentesIntro({ lang, onStart, fastPath = false }: Props) {
    const c = getPuentesCopy(lang);

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl mx-auto"
        >
            <Card padding="lg" className="text-center">
                <p className="text-xs uppercase tracking-widest text-argo-violet-500 mb-3 font-semibold">
                    {c.intro.eyebrow}
                </p>
                <h1 className="text-3xl font-bold tracking-tight text-argo-navy">
                    {c.intro.title}
                </h1>
                <p className="mt-5 text-argo-secondary text-base leading-relaxed">
                    {fastPath ? c.intro.fastPathSubtitle : c.intro.subtitle}
                </p>
                {!fastPath && (
                    <p className="mt-4 text-sm text-argo-grey">
                        {c.intro.estimatedTime}
                    </p>
                )}

                <div className="mt-8">
                    <Button variant="violet" size="lg" onClick={onStart}>
                        {fastPath ? c.intro.fastPathCta : c.intro.startCta}
                    </Button>
                </div>
                <p className="mt-6 text-xs text-argo-light leading-relaxed max-w-sm mx-auto">
                    {c.intro.disclaimer}
                </p>
            </Card>
        </motion.div>
    );
}
