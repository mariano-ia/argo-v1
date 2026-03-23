import { useCallback } from 'react';
import { HAPTIC_MS } from './constants';

export function useHaptics() {
    const vibrate = useCallback((ms: number = HAPTIC_MS) => {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate(ms);
        }
    }, []);

    return { vibrate };
}
