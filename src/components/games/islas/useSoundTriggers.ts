import { useCallback } from 'react';

export type SoundEvent =
    | 'ambient_ocean_start'
    | 'ambient_ocean_stop'
    | 'island_emerge'
    | 'tap_island'
    | 'discovery_reveal'
    | 'island_sink'
    | 'celebration_start'
    | 'ship_sail'
    | 'achievement_card';

export function useSoundTriggers() {
    const trigger = useCallback((event: SoundEvent) => {
        if (import.meta.env.DEV) {
            console.log(`[Sound] ${event}`);
        }
        window.dispatchEvent(new CustomEvent('argo:sound', { detail: event }));
    }, []);

    return { trigger };
}
