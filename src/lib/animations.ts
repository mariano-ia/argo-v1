/**
 * Shared Framer Motion animation presets.
 * Easing curve [0.25, 0, 0, 1] matches Apple's system-level spring.
 */

export const ARGO_EASE = [0.25, 0, 0, 1] as const;

/** Fade-up entrance — cards, headings, chart wrappers. */
export const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 20 } as const,
    whileInView: { opacity: 1, y: 0 } as const,
    viewport: { once: true },
    transition: { duration: 0.6, ease: ARGO_EASE, delay },
});

/** Container variant for staggered children. */
export const staggerContainer = (stagger = 0.08) => ({
    hidden: {},
    visible: {
        transition: { staggerChildren: stagger },
    },
});

/** Child variant for items inside a stagger container. */
export const staggerItem = {
    hidden: { opacity: 0, y: 16 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: ARGO_EASE },
    },
};
