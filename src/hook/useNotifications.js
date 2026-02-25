import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthProvider';
import axiosInstance from '../api/axios';

const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
};

export const useNotifications = () => {
    const { user } = useAuth();

    const { data, isLoading, error, refetch, isFetching } = useQuery({
        queryKey: ['notifications-count', user?.role],
        queryFn: async () => {
            const emptyResponse = {
                locates: [],
                workOrders: [],
                latestNotifications: [],
                locatesCount: 0,
                workOrdersCount: 0,
                totalActualCount: 0,
                unseenLocateIds: [],
                unseenRmeIds: [],
                unseenIds: [],
                count: 0,
            };

            if (!user) return emptyResponse;

            const role = user.role?.toUpperCase();
            if (role !== 'SUPERADMIN' && role !== 'MANAGER') {
                return emptyResponse;
            }

            try {
                // Use Promise.allSettled to handle partial failures gracefully
                const [locatesResult, workOrdersResult] = await Promise.allSettled([
                    axiosInstance.get('/locates/'),
                    axiosInstance.get('/work-orders-today/'),
                ]);

                // Handle locates response
                const locatesData = locatesResult.status === 'fulfilled'
                    ? (Array.isArray(locatesResult.value.data)
                        ? locatesResult.value.data
                        : locatesResult.value.data?.data || [])
                    : [];

                // Handle work orders response
                const workOrdersData = workOrdersResult.status === 'fulfilled'
                    ? (Array.isArray(workOrdersResult.value.data)
                        ? workOrdersResult.value.data
                        : workOrdersResult.value.data?.data || [])
                    : [];

                const oneMonthAgo = new Date();
                oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

                let locatesCount = 0;
                let workOrdersCount = 0;

                const latestNotifications = [];
                const unseenLocateIds = [];
                const unseenRmeIds = [];

                // ---- PROCESS LOCATES ----
                if (Array.isArray(locatesData)) {
                    locatesData.forEach((locate) => {
                        const createdDate = formatDate(locate.created_at || locate.created_date);
                        if (!createdDate) return;

                        if (createdDate >= oneMonthAgo && locate.is_seen === false) {
                            locatesCount++;
                            const id = `locate-${locate.id}`;
                            unseenLocateIds.push(id);
                            latestNotifications.push({
                                id,
                                type: 'locate',
                                timestamp: createdDate,
                            });
                        }
                    });
                }

                // ---- PROCESS WORK ORDERS / RME ----
                if (Array.isArray(workOrdersData)) {
                    workOrdersData.forEach((workOrder) => {
                        const elapsedDate = formatDate(workOrder.elapsed_time);
                        if (!elapsedDate) return;

                        if (elapsedDate >= oneMonthAgo && workOrder.is_seen === false) {
                            workOrdersCount++;
                            const id = `rme-${workOrder.id}`;
                            unseenRmeIds.push(id);
                            latestNotifications.push({
                                id,
                                type: 'RME',
                                timestamp: elapsedDate,
                            });
                        }
                    });
                }

                // Sort by latest timestamp
                latestNotifications.sort((a, b) => b.timestamp - a.timestamp);

                const unseenIds = [...unseenLocateIds, ...unseenRmeIds];
                const totalActualCount = locatesCount + workOrdersCount;

                return {
                    locates: locatesData,
                    workOrders: workOrdersData,
                    latestNotifications,
                    locatesCount,
                    workOrdersCount,
                    totalActualCount,
                    unseenLocateIds,
                    unseenRmeIds,
                    unseenIds,
                    count: totalActualCount,
                };
            } catch (err) {
                console.error('Error fetching notifications:', err);
                return emptyResponse;
            }
        },
        staleTime: 30000, // 30 seconds
        refetchInterval: 60000, // 1 minute
        retry: 2, // Retry failed requests twice
        enabled: !!user, // Only run query if user exists
    });

    return {
        notifications: data,
        isLoading,
        isFetching,
        error,
        refetch,
        badgeCount: data?.count || 0,
        totalCount: data?.totalActualCount || 0,
        locatesCount: data?.locatesCount || 0,
        rmeCount: data?.workOrdersCount || 0,
        unseenLocateIds: data?.unseenLocateIds || [],
        unseenRmeIds: data?.unseenRmeIds || [],
        unseenIds: data?.unseenIds || [],
    };
};