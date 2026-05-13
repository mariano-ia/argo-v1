import { getPuentesCopy } from '../../lib/puentesTranslations';
import type { Lang } from '../../types/puentes';

interface Props {
    current: number;
    total: number;
    lang: Lang;
}

export function PuentesProgress({ current, total, lang }: Props) {
    const c = getPuentesCopy(lang);
    const pct = Math.round((current / total) * 100);
    return (
        <div className="w-full">
            <div className="flex justify-between text-xs uppercase tracking-widest text-argo-grey mb-2 font-semibold">
                <span>{c.progress.questionOf(current, total)}</span>
                <span>{pct}%</span>
            </div>
            <div className="h-1 bg-argo-border rounded-full overflow-hidden">
                <div
                    className="h-full bg-argo-violet-500 transition-all duration-300"
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}
