import { format } from 'date-fns';
import {
    PACIFIC_TIMEZONE_OFFSET,
    PACIFIC_DAYLIGHT_OFFSET
} from './constants';

export const isDaylightSavingTime = (date) => {
    const year = date.getFullYear();
    const march = new Date(year, 2, 1);
    const november = new Date(year, 10, 1);

    let dstStart = new Date(march);
    while (dstStart.getDay() !== 0) {
        dstStart.setDate(dstStart.getDate() + 1);
    }
    dstStart.setDate(dstStart.getDate() + 7);

    let dstEnd = new Date(november);
    while (dstEnd.getDay() !== 0) {
        dstEnd.setDate(dstEnd.getDate() + 1);
    }

    return date >= dstStart && date < dstEnd;
};

export const toPacificTime = (dateString) => {
    if (!dateString) return null;
    try {
        const date = dateString instanceof Date ? dateString : new Date(dateString);
        if (isNaN(date.getTime())) {
            return null;
        }

        const utcDate = new Date(date.toISOString());
        const offset = isDaylightSavingTime(utcDate) ? PACIFIC_DAYLIGHT_OFFSET : PACIFIC_TIMEZONE_OFFSET;
        const pacificTime = new Date(utcDate.getTime() + (offset * 60 * 60 * 1000));
        return pacificTime;
    } catch (e) {
        return null;
    }
};

export const getCurrentPacificTimeISO = () => {
    const now = new Date();
    const offset = isDaylightSavingTime(now) ? PACIFIC_DAYLIGHT_OFFSET : PACIFIC_TIMEZONE_OFFSET;
    const pacificTime = new Date(now.getTime() + (offset * 60 * 60 * 1000));
    return new Date(pacificTime.getTime() - (offset * 60 * 60 * 1000)).toISOString();
};

export const getCurrentPacificTimezoneOffset = () => {
    return isDaylightSavingTime(new Date()) ? PACIFIC_DAYLIGHT_OFFSET : PACIFIC_TIMEZONE_OFFSET;
};