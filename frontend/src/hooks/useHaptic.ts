import { useCallback } from 'react';

type HapticPattern = 'success' | 'error' | 'warning' | 'light' | 'medium' | 'heavy';

const patterns: Record<HapticPattern, number | number[]> = {
    success: [50, 30, 50],
    error: [100, 50, 100, 50, 100],
    warning: [80, 50, 80],
    light: 10,
    medium: 25,
    heavy: 50
};

export function useHaptic() {
    const vibrate = useCallback((pattern: HapticPattern = 'light') => {
        // Check if Vibration API is supported
        if (!('vibrate' in navigator)) {
            return false;
        }

        try {
            navigator.vibrate(patterns[pattern]);
            return true;
        } catch (error) {
            console.warn('Haptic feedback failed:', error);
            return false;
        }
    }, []);

    const cancel = useCallback(() => {
        if ('vibrate' in navigator) {
            navigator.vibrate(0);
        }
    }, []);

    return {
        vibrate,
        cancel,
        isSupported: 'vibrate' in navigator
    };
}

export default useHaptic;
