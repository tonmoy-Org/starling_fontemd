import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../../../../api/axios';
import { useAuth } from '../../../../../auth/AuthProvider';
import {
    formatDate,
    calculateElapsedTime,
    getElapsedColor,
    getTechnicianInitial,
    formatDateTimeWithTZ,
    formatTime 
} from '../utils/formatters';

export const useRmeData = () => {
    const { user: authUser } = useAuth();

    const currentUser = useMemo(() => {
        return authUser ? {
            name: authUser.name || authUser.full_name || authUser.username || 'Unknown User',
            email: authUser.email || authUser.email_address || 'unknown@example.com',
            id: authUser.id || authUser.user_id || 'unknown'
        } : {
            name: 'Unknown User',
            email: 'unknown@example.com',
            id: 'unknown'
        };
    }, [authUser]);

    const { data: workOrders = [], isLoading, refetch: refetchWorkOrders } = useQuery({
        queryKey: ['rme-work-orders'],
        queryFn: async () => {
            const res = await axiosInstance.get('/work-orders-today/');
            console.log(res.data);
            return Array.isArray(res.data) ? res.data : [];
        },
        staleTime: 1000,
        refetchInterval: 30000,
    });

    const { data: deletedWorkOrders = [] } = useQuery({
        queryKey: ['rme-deleted-work-orders'],
        queryFn: async () => {
            const res = await axiosInstance.get('/work-orders-today/');
            const allOrders = Array.isArray(res.data) ? res.data : [];
            return allOrders.filter(order => order.is_deleted);
        },
        staleTime: 1000,
        refetchInterval: 30000,
    });

    const processedData = useMemo(() => {
        const reportNeeded = [];
        const reportSubmitted = [];
        const holding = [];
        const finalized = [];

        workOrders.forEach(item => {
            const report = {
                id: item.id.toString(),
                woNumber: item.wo_number || 'N/A',
                date: formatDate(item.scheduled_date),
                scheduledDate: item.scheduled_date,
                elapsedTime: calculateElapsedTime(item.scheduled_date),
                elapsedColor: getElapsedColor(item.scheduled_date),
                technician: item.technician || 'Unassigned',
                technicianInitial: getTechnicianInitial(item.technician),
                address: item.full_address || 'No address',
                street: item.full_address ? item.full_address.split(',')[0]?.trim() || 'Unknown' : 'Unknown',
                city: item.full_address ? item.full_address.split(',')[1]?.trim().split(' ')[0] || 'Unknown' : 'Unknown',
                state: item.full_address ? item.full_address.split(',')[1]?.trim().split(' ')[1] || 'Unknown' : 'Unknown',
                zip: item.full_address ? item.full_address.split(',')[1]?.trim().split(' ')[2] || 'Unknown' : 'Unknown',
                lastReport: !!item.last_report_link,
                lastReportLink: item.last_report_link,
                unlockedReport: !!item.unlocked_report_link,
                unlockedReportLink: item.unlocked_report_link,
                techReportSubmitted: item.tech_report_submitted || false,
                waitToLock: item.wait_to_lock || false,
                reason: item.reason || '',
                notes: item.notes || '',
                movedToHoldingDate: item.moved_to_holding_date,
                isDeleted: item.is_deleted || false,
                deletedBy: item.deleted_by,
                deletedDate: item.deleted_date,
                deletedDateFormatted: formatDateTimeWithTZ(item.deleted_date),
                finalizedBy: item.finalized_by,
                finalizedByEmail: item.finalized_by_email,
                finalizedDate: item.finalized_date,
                finalizedDateFormatted: formatDateTimeWithTZ(item.finalized_date),
                reportId: item.report_id,
                createdAt: item.scheduled_date,
                timeCompleted: formatTime(item.scheduled_date),
                scheduledDateFormatted: formatDateTimeWithTZ(item.scheduled_date),
                movedToHoldingDateFormatted: formatDateTimeWithTZ(item.moved_to_holding_date),
                rawData: item,
                currentUser: currentUser,
            };

            if (item.is_deleted) {
                // Skip - these are handled separately
            } else if (item.status === 'DELETED' || item.rme_completed) {
                finalized.push({
                    ...report,
                    action: 'deleted',
                    actionTime: item.finalized_date || item.updated_at || item.created_at,
                    actionTimeFormatted: formatDateTimeWithTZ(item.finalized_date || item.updated_at || item.created_at),
                    by: item.finalized_by || 'System',
                    byEmail: item.finalized_by_email || '',
                    status: 'DELETED',
                    statusColor: '#ef4444',
                    isStatusDeleted: true,
                });
            } else if (item.status === 'LOCKED' || item.finalized_by || item.rme_completed) {
                finalized.push({
                    ...report,
                    action: 'locked',
                    actionTime: item.finalized_date,
                    actionTimeFormatted: formatDateTimeWithTZ(item.finalized_date),
                    by: item.finalized_by,
                    byEmail: item.finalized_by_email || '',
                    status: 'LOCKED',
                    statusColor: '#10b981',
                });
            } else if (item.wait_to_lock || item.moved_to_holding_date) {
                holding.push({
                    ...report,
                    priorLockedReport: !!item.last_report_link,
                    reason: item.reason || 'Pending Review',
                });
            } else if (item.tech_report_submitted) {
                reportSubmitted.push(report);
            } else {
                reportNeeded.push(report);
            }
        });

        return { reportNeeded, reportSubmitted, holding, finalized };
    }, [workOrders, currentUser]);

    return {
        workOrders,
        deletedWorkOrders,
        isLoading,
        processedData,
        refetchWorkOrders,
        currentUser
    };
};