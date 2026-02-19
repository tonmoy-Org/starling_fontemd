import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import {
    GREEN_COLOR,
    ORANGE_COLOR,
    RED_COLOR,
    GRAY_COLOR
} from './constants';

const TIMEZONE = 'Etc/GMT+8'; // GMT-8

const toGMT8 = (date) => toZonedTime(date, TIMEZONE);

export const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (isNaN(date)) return '—';
    return format(toGMT8(date), 'MMM dd, yyyy');
};

export const formatTime = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (isNaN(date)) return '—';
    return format(toGMT8(date), 'h:mm a');
};

export const formatDateTimeWithTZ = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (isNaN(date)) return '—';
    return format(toGMT8(date), "MMM dd, yyyy h:mm a");
};

export const calculateElapsedTime = (createdDate) => {
    if (!createdDate) return '—';

    try {
        const now = new Date();
        const created = new Date(createdDate);
        if (isNaN(created)) return '—';

        const diffMs = now - created;

        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffHours < 1) {
            return `${diffMinutes} MIN${diffMinutes !== 1 ? 'S' : ''}`;
        } else if (diffHours < 128) {
            return `${diffHours} HR${diffHours !== 1 ? 'S' : ''}`;
        } else {
            return `${diffDays}TH DAY${diffDays !== 1 ? 'S' : ''}`;
        }
    } catch {
        return '—';
    }
};

export const calculateCompletedElapsedTime = (completedDate) => {
    if (!completedDate) return '-';

    try {
        const now = new Date();

        // Parse MM/DD/YYYY
        const parts = completedDate.split('/');
        if (parts.length !== 3) return '-';

        const month = parseInt(parts[0], 10) - 1; // JS months 0-based
        const day = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);

        const completed = new Date(year, month, day);
        if (isNaN(completed.getTime())) return '-';

        const diffMs = now - completed;

        // Don't show negative time (future dates)
        if (diffMs < 0) return '-';

        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffHours < 1) {
            return `${diffMinutes} MIN${diffMinutes !== 1 ? 'S' : ''}`;
        } else if (diffHours < 128) {
            return `${diffHours} HR${diffHours !== 1 ? 'S' : ''}`;
        } else {
            return `${diffDays} DAY${diffDays !== 1 ? 'S' : ''}`;
        }
    } catch {
        return '-';
    }
};

export const getElapsedColor = (createdDate) => {
    if (!createdDate) return GRAY_COLOR;
    try {
        const now = new Date();
        const created = new Date(createdDate);
        if (isNaN(created)) return GRAY_COLOR;

        const diffMs = now - created;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

        if (diffHours < 24) return GREEN_COLOR;
        if (diffHours < 48) return ORANGE_COLOR;
        return RED_COLOR;
    } catch {
        return GRAY_COLOR;
    }
};

export const getTechnicianInitial = (technicianName) => {
    if (!technicianName) return '?';
    return technicianName.charAt(0).toUpperCase();
};