import { useState, useEffect } from 'react';
import { getCurrentPacificTime } from '../utils/dateUtils';

export const useTimer = (interval = 1000) => {
    const [currentTime, setCurrentTime] = useState(() => getCurrentPacificTime());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(getCurrentPacificTime());
        }, interval);

        return () => clearInterval(timer);
    }, [interval]);

    return currentTime;
};