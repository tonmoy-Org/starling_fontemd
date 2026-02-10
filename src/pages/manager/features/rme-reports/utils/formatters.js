import { format } from 'date-fns';
import {
    GREEN_COLOR,
    ORANGE_COLOR,
    RED_COLOR,
    GRAY_COLOR
} from './constants';

export const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (isNaN(date)) return '—';
    return format(date, 'MMM dd, yyyy');
};

export const formatTime = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (isNaN(date)) return '—';
    return format(date, 'MMM dd, yyyy'); // ⬅ time removed
};

export const formatDateTimeWithTZ = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (isNaN(date)) return '—';
    return format(date, 'MMM dd, yyyy h:mm a');
};


export const calculateElapsedTime = (createdDate) => {
    if (!createdDate) return '—';
    try {
        const now = new Date();
        const created = new Date(createdDate);
        if (isNaN(created)) return '—';

        const diffMs = now - created;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

        if (diffHours < 1) {
            const diffMinutes = Math.floor(diffMs / (1000 * 60));
            return `${diffMinutes} MIN${diffMinutes !== 1 ? 'S' : ''}`;
        } else if (diffHours < 128) {
            return `${diffHours} HR${diffHours !== 1 ? 'S' : ''}`;
        } else {
            return created.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
        }
    } catch {
        return '—';
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
