import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthProvider';
import axiosInstance from '../api/axios';

const NOTIFICATIONS_CACHE_KEY = 'notifications-cache';
const NOTIFICATIONS_LAST_UPDATE = 'notifications-last-update';
const CACHE_DURATION = 15000; // 15 seconds local cache
const STALE_TIME = 20000; // 20 seconds before stale
const REFETCH_INTERVAL = 45000; // 45 seconds auto-refetch

const ONE_MONTH_AGO = (() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date;
})();

const EMPTY_RESPONSE = {
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

const formatDate = (dateString) => {
    if (!dateString) return null;
    const timestamp = new Date(dateString).getTime();
    return isNaN(timestamp) ? null : timestamp;
};

const filterUnseenNotifications = (data, createdAtField) => {
    return data.filter((item) => {
        const timestamp = formatDate(item[createdAtField]);
        return timestamp !== null && timestamp >= ONE_MONTH_AGO.getTime() && item.is_seen === false;
    });
};

const processLocates = (locatesData) => {
    const unseenLocates = filterUnseenNotifications(locatesData, 'created_at');
    
    return {
        count: unseenLocates.length,
        ids: unseenLocates.map(locate => `locate-${locate.id}`),
        notifications: unseenLocates.map(locate => ({
            id: `locate-${locate.id}`,
            type: 'locate',
            timestamp: formatDate(locate.created_at),
        })),
    };
};

const processWorkOrders = (workOrdersData) => {
    const unseenWorkOrders = filterUnseenNotifications(workOrdersData, 'elapsed_time');
    
    return {
        count: unseenWorkOrders.length,
        ids: unseenWorkOrders.map(wo => `rme-${wo.id}`),
        notifications: unseenWorkOrders.map(wo => ({
            id: `rme-${wo.id}`,
            type: 'RME',
            timestamp: formatDate(wo.elapsed_time),
        })),
    };
};

const buildResponse = (locatesData, workOrdersData) => {
    const locatesResult = processLocates(locatesData);
    const workOrdersResult = processWorkOrders(workOrdersData);

    const latestNotifications = [
        ...locatesResult.notifications,
        ...workOrdersResult.notifications,
    ].sort((a, b) => b.timestamp - a.timestamp);

    const totalCount = locatesResult.count + workOrdersResult.count;

    return {
        locates: locatesData,
        workOrders: workOrdersData,
        latestNotifications,
        locatesCount: locatesResult.count,
        workOrdersCount: workOrdersResult.count,
        totalActualCount: totalCount,
        unseenLocateIds: locatesResult.ids,
        unseenRmeIds: workOrdersResult.ids,
        unseenIds: [...locatesResult.ids, ...workOrdersResult.ids],
        count: totalCount,
    };
};

const getLocalCache = () => {
    try {
        const cached = sessionStorage.getItem(NOTIFICATIONS_CACHE_KEY);
        const lastUpdate = sessionStorage.getItem(NOTIFICATIONS_LAST_UPDATE);
        
        if (!cached || !lastUpdate) return null;
        
        const age = Date.now() - parseInt(lastUpdate, 10);
        if (age > CACHE_DURATION) {
            sessionStorage.removeItem(NOTIFICATIONS_CACHE_KEY);
            sessionStorage.removeItem(NOTIFICATIONS_LAST_UPDATE);
            return null;
        }
        
        return JSON.parse(cached);
    } catch {
        return null;
    }
};

const setLocalCache = (data) => {
    try {
        sessionStorage.setItem(NOTIFICATIONS_CACHE_KEY, JSON.stringify(data));
        sessionStorage.setItem(NOTIFICATIONS_LAST_UPDATE, Date.now().toString());
    } catch {
        // Silently fail if sessionStorage unavailable
    }
};

export const useNotifications = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data, isLoading, error, refetch, isFetching } = useQuery({
        queryKey: ['notifications', user?.role],
        queryFn: async () => {
            if (!user) return EMPTY_RESPONSE;

            const role = user.role?.toUpperCase();
            if (role !== 'SUPERADMIN' && role !== 'MANAGER') {
                return EMPTY_RESPONSE;
            }

            const localCache = getLocalCache();
            if (localCache) return localCache;

            try {
                const [locatesResult, workOrdersResult] = await Promise.allSettled([
                    axiosInstance.get('/locates/'),
                    axiosInstance.get('/work-orders-today/'),
                ]);

                const locatesData = locatesResult.status === 'fulfilled'
                    ? (Array.isArray(locatesResult.value.data)
                        ? locatesResult.value.data
                        : locatesResult.value.data?.data || [])
                    : [];

                const workOrdersData = workOrdersResult.status === 'fulfilled'
                    ? (Array.isArray(workOrdersResult.value.data)
                        ? workOrdersResult.value.data
                        : workOrdersResult.value.data?.data || [])
                    : [];

                const response = buildResponse(locatesData, workOrdersData);
                setLocalCache(response);
                return response;
            } catch (err) {
                console.error('Error fetching notifications:', err);
                return EMPTY_RESPONSE;
            }
        },
        staleTime: STALE_TIME,
        refetchInterval: REFETCH_INTERVAL,
        refetchOnWindowFocus: 'stale',
        refetchOnReconnect: 'stale',
        retry: 1,
        enabled: !!user,
    });

    const invalidateCache = () => {
        try {
            sessionStorage.removeItem(NOTIFICATIONS_CACHE_KEY);
            sessionStorage.removeItem(NOTIFICATIONS_LAST_UPDATE);
        } catch {
            // Silently fail
        }
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    return {
        notifications: data,
        isLoading,
        isFetching,
        error,
        refetch,
        invalidateCache,
        badgeCount: data?.count || 0,
        totalCount: data?.totalActualCount || 0,
        locatesCount: data?.locatesCount || 0,
        rmeCount: data?.workOrdersCount || 0,
        unseenLocateIds: data?.unseenLocateIds || [],
        unseenRmeIds: data?.unseenRmeIds || [],
        unseenIds: data?.unseenIds || [],
    };
};