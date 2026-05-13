import { motion } from 'framer-motion';
import { getPuentesCopy } from '../../lib/puentesTranslations';
import type { Lang } from '../../types/puentes';

export function PuentesGenerating({ lang }: { lang: Lang }) {
    const c = getPuentesCopy(lang);
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-md mx-auto text-center py-16"
        >
            <div className="inline-block w-12 h-12 rounded-full border-4 border-argo-violet-100 border-t-argo-violet-500 animate-spin" />
            <p className="mt-6 text-argo-secondary font-medium">
                {c.finish.generating}
            </p>
            <p className="mt-2 text-sm text-argo-grey">
                {lang === 'en' ? 'This may take up to 30 seconds.' : lang === 'pt' ? 'Pode levar até 30 segundos.' : 'Puede tardar hasta 30 segundos.'}
            </p>
        </motion.div>
    );
}
