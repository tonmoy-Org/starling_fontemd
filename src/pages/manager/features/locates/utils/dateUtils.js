import { addHours, addDays, format, parseISO, isAfter } from 'date-fns';
import { TIMEZONE_OFFSET } from './constants';

export const toPacificTime = (dateString) => {
    if (!dateString) return null;
    try {
        const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
        return new Date(date.getTime() + TIMEZONE_OFFSET);
    } catch (e) {
        console.error('Error converting to Pacific Time:', e);
        return null;
    }
};

export const toUTC = (pacificTime) => {
    if (!pacificTime) return null;
    try {
        return new Date(pacificTime.getTime() - TIMEZONE_OFFSET);
    } catch (e) {
        console.error('Error converting to UTC:', e);
        return null;
    }
};

export const getCurrentPacificTime = () => {
    const now = new Date();
    return new Date(now.getTime() + TIMEZONE_OFFSET);
};

export const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
        const date = toPacificTime(dateString);
        return format(date, 'MMM dd, yyyy HH:mm');
    } catch (e) {
        return '—';
    }
};

export const formatDateShort = (dateString) => {
    if (!dateString) return '—';
    try {
        const date = toPacificTime(dateString);
        return format(date, 'MMM dd, HH:mm');
    } catch (e) {
        return '—';
    }
};

export const formatMonthDay = (dateString) => {
    if (!dateString) return '—';
    try {
        const date = toPacificTime(dateString);
        return format(date, 'MMM dd');
    } catch (e) {
        return '—';
    }
};

export const formatTimeRemaining = (remainingMs) => {
    if (remainingMs <= 0) return 'EXPIRED';

    if (remainingMs > 24 * 60 * 60 * 1000) {
        const hours = Math.round(remainingMs / (60 * 60 * 1000));
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;

        if (days > 0) {
            return `${days}d ${remainingHours}h`;
        } else {
            return `${hours}h`;
        }
    }

    const totalSeconds = Math.floor(remainingMs / 1000);
    const hours = Math.floor(totalSeconds / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    } else {
        return `${seconds}s`;
    }
};

export const calculateExpirationDate = (calledAt, callType) => {
    if (!calledAt || !callType) return null;

    try {
        const calledDate = toPacificTime(calledAt);
        if (!calledDate) return null;

        if (callType === 'EMERGENCY' || callType === 'Emergency') {
            return addHours(calledDate, 4);
        } else if (callType === 'STANDARD' || callType === 'Standard') {
            return addDays(calledDate, 2);
        }

        return null;
    } catch (e) {
        console.error('Error calculating expiration:', e);
        return null;
    }
};

export const isTimerExpired = (calledAt, callType) => {
    if (!calledAt || !callType) return true;

    const expirationDate = calculateExpirationDate(calledAt, callType);
    if (!expirationDate) return true;

    const nowPacific = getCurrentPacificTime();
    return isAfter(nowPacific, expirationDate);
};

export const formatTargetWorkDate = (scheduledDateRaw) => {
    if (!scheduledDateRaw || scheduledDateRaw === 'ASAP') return 'ASAP';

    try {
        const datePart = scheduledDateRaw.split(' ')[0];
        if (!datePart) return 'ASAP';

        const [month, day, year] = datePart.split('/').map(Number);
        if (!month || !day || !year) return 'ASAP';

        const date = new Date(year, month - 1, day);
        const pacificDate = toPacificTime(date);
        return format(pacificDate, 'MMM dd, yyyy');
    } catch (e) {
        console.error('Error formatting target work date:', e);
        return 'ASAP';
    }
};