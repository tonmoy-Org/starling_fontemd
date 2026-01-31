import { format } from 'date-fns';
import { toPacificTime } from './timeHelpers';
import {
    GREEN_COLOR,
    ORANGE_COLOR,
    RED_COLOR,
    GRAY_COLOR
} from './constants';

export const formatDate = (dateString) => {
    const date = toPacificTime(dateString);
    if (!date) return '—';
    return format(date, 'MMM dd, yyyy');
};

export const formatTime = (dateString) => {
    const date = toPacificTime(dateString);
    if (!date) return '—';
    return format(date, 'h:mm a');
};

export const formatDateTimeWithTZ = (dateString) => {
    const date = toPacificTime(dateString);
    if (!date) return '—';
    return format(date, 'MMM dd, yyyy h:mm a');
};

export const calculateElapsedTime = (createdDate) => {
    if (!createdDate) return '—';
    try {
        const now = new Date();
        const created = toPacificTime(createdDate);
        if (!created) return '—';

        const diffMs = now - created;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

        if (diffHours < 1) {
            const diffMinutes = Math.floor(diffMs / (1000 * 60));
            return `${diffMinutes} MIN${diffMinutes !== 1 ? 'S' : ''}`;
        } else if (diffHours < 24) {
            return `${diffHours} HR${diffHours !== 1 ? 'S' : ''}`;
        } else {
            return `${diffHours} HR${diffHours !== 1 ? 'S' : ''}`;
        }
    } catch (e) {
        return '—';
    }
};

export const getElapsedColor = (createdDate) => {
    if (!createdDate) return GRAY_COLOR;
    try {
        const now = new Date();
        const created = toPacificTime(createdDate);
        if (!created) return GRAY_COLOR;

        const diffMs = now - created;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

        if (diffHours < 24) return GREEN_COLOR;
        if (diffHours < 48) return ORANGE_COLOR;
        return RED_COLOR;
    } catch (e) {
        return GRAY_COLOR;
    }
};

export const getTechnicianInitial = (technicianName) => {
    if (!technicianName) return '?';
    return technicianName.charAt(0).toUpperCase();
};