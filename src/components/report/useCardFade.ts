import { useLayoutEffect, useRef } from 'react';

/**
 * Fade-in de las cards de un informe a medida que entran al viewport (scroll).
 * - React-safe: agrega `.in-view` por classList sobre nodos con className estático
 *   ("card"), que React no re-pisa (no cambia el prop className).
 * - Sin flash: agrega `.cards-fade` al root en useLayoutEffect (antes del paint), y el
 *   reveal es una @keyframes (no una transition), así el ocultado inicial no anima.
 * - Degrada a visible: si no hay IntersectionObserver o el usuario pide reduced-motion,
 *   NO agrega `.cards-fade` y las cards quedan visibles por default.
 * Devuelve un ref para poner en el contenedor `.argo-report-v4` del informe.
 */
export function useCardFade<T extends HTMLElement = HTMLDivElement>() {
    const ref = useRef<T>(null);
    useLayoutEffect(() => {
        const root = ref.current;
        if (!root) return;
        const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        if (reduce || typeof IntersectionObserver === 'undefined') return; // cards visibles por default
        let io: IntersectionObserver | null = null;
        try {
            root.classList.add('cards-fade');
            io = new IntersectionObserver((entries, obs) => {
                for (const e of entries) {
                    if (e.isIntersecting) { e.target.classList.add('in-view'); obs.unobserve(e.target); }
                }
            }, { rootMargin: '0px 0px -6% 0px', threshold: 0.04 });
            root.querySelectorAll('.card').forEach((c) => io!.observe(c));
        } catch {
            root.classList.remove('cards-fade'); // ante cualquier error, dejar todo visible
        }
        return () => io?.disconnect();
    }, []);
    return ref;
}
