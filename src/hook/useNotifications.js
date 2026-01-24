// hooks/useNotifications.js
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../api/axios';
import { useAuth } from '../auth/AuthProvider';

const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
        return new Date(dateString);
    } catch {
        return null;
    }
};

export const useNotifications = () => {
    const { user } = useAuth();

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['notifications-count', user?.role],
        queryFn: async () => {
            if (!user) {
                return {
                    locates: [],
                    workOrders: [],
                    count: 0,
                    latestNotifications: [],
                    totalActualCount: 0,
                };
            }

            const role = user.role?.toUpperCase();

            if (role !== 'SUPERADMIN' && role !== 'MANAGER') {
                return {
                    locates: [],
                    workOrders: [],
                    count: 0,
                    latestNotifications: [],
                    totalActualCount: 0,
                };
            }

            const [locatesResponse, workOrdersResponse] = await Promise.all([
                axiosInstance.get('/locates/'),
                axiosInstance.get('/work-orders-today/'),
            ]);

            const locatesData = Array.isArray(locatesResponse.data)
                ? locatesResponse.data
                : locatesResponse.data?.data || [];

            const workOrdersData = Array.isArray(workOrdersResponse.data)
                ? workOrdersResponse.data
                : [];

            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

            let count = 0;
            const latestNotifications = [];

            locatesData.forEach(locate => {
                const createdDate = formatDate(
                    locate.created_at || locate.created_date
                );
                if (!createdDate || locate.is_seen) return;
                if (createdDate >= oneMonthAgo) {
                    if (latestNotifications.length < 10) {
                        latestNotifications.push({
                            id: `locate-${locate.id}`,
                            type: 'locate',
                            timestamp: createdDate,
                        });
                    }
                    count++;
                }
            });

            workOrdersData.forEach(workOrder => {
                const elapsedDate = formatDate(workOrder.elapsed_time);
                if (!elapsedDate || workOrder.is_seen) return;
                if (elapsedDate >= oneMonthAgo) {
                    if (latestNotifications.length < 10) {
                        latestNotifications.push({
                            id: `rme-${workOrder.id}`,
                            type: 'RME',
                            timestamp: elapsedDate,
                        });
                    }
                    count++;
                }
            });

            latestNotifications.sort((a, b) => b.timestamp - a.timestamp);

            return {
                locates: locatesData,
                workOrders: workOrdersData,
                count: Math.min(count, 10),
                latestNotifications: latestNotifications.slice(0, 10),
                totalActualCount: count,
            };
        },
        staleTime: 30000,
        refetchInterval: 60000,
    });

    return {
        notifications: data,
        isLoading,
        error,
        refetch,
        badgeCount: data?.count || 0,
        totalCount: data?.totalActualCount || 0,
    };
};
