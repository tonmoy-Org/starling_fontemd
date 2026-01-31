import { useMemo } from 'react';
import {
    isDaylightSavingTime,
    getCurrentPacificTimezoneOffset
} from '../utils/timeHelpers';

export const useTimeHelpers = () => {
    const getCurrentPacificTimezoneOffsetMemo = useMemo(() => {
        return getCurrentPacificTimezoneOffset();
    }, []);

    return {
        isDaylightSavingTime,
        getCurrentPacificTimezoneOffset: () => getCurrentPacificTimezoneOffsetMemo
    };
};