/**
 * useExamMode — Hook to manage exam mode state and countdown
 */

import { useEffect, useState } from 'react';
import { useAppStore } from '../stores/appStore';

export function useExamMode() {
    const { examMode, setExamMode, examCountdownTarget, setExamCountdownTarget } = useAppStore();
    const [countdown, setCountdown] = useState<string>('');

    useEffect(() => {
        if (!examMode || !examCountdownTarget) {
            setCountdown('');
            return;
        }

        const update = () => {
            const target = new Date(examCountdownTarget).getTime();
            const now = Date.now();
            const diff = target - now;

            if (diff <= 0) {
                setCountdown('Exam time!');
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            if (days > 0) {
                setCountdown(`${days}d ${hours}h ${mins}m`);
            } else if (hours > 0) {
                setCountdown(`${hours}h ${mins}m`);
            } else {
                setCountdown(`${mins}m`);
            }
        };

        update();
        const interval = setInterval(update, 60000);
        return () => clearInterval(interval);
    }, [examMode, examCountdownTarget]);

    return {
        examMode,
        countdown,
        toggleExamMode: () => setExamMode(!examMode),
        setExamMode,
        setExamCountdownTarget,
    };
}
