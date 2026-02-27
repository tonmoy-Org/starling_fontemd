import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthProvider';
import axiosInstance from '../api/axios';
import { useEffect, useRef, useCallback } from 'react';

const NOTIFICATIONS_CACHE_KEY = 'notifications-cache';
const NOTIFICATIONS_LAST_UPDATE = 'notifications-last-update';
const CACHE_DURATION = 8000; // 8 seconds local cache (reduced for real-time)
const STALE_TIME = 5000; // 5 seconds before stale
const REFETCH_INTERVAL = 10000; // 10 seconds auto-refetch (increased frequency)

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
            data: locate,
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
            data: wo,
        })),
    };
};

const buildResponse = (locatesData, workOrdersData) => {
    const locatesResult = processLocates(locatesData);
    const workOrdersResult = processWorkOrders(workOrdersData);

    const latestNotifications = [
        ...locatesResult.notifications,
        ...workOrdersResult.notifications,
    ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 50); // Limit to 50 latest

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
        lastUpdated: Date.now(),
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
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const isConnectingRef = useRef(false);

    // Initialize WebSocket connection for real-time updates
    const initializeWebSocket = useCallback(() => {
        if (!user || isConnectingRef.current) return;

        const role = user.role?.toUpperCase();
        if (role !== 'SUPERADMIN' && role !== 'MANAGER') return;

        isConnectingRef.current = true;

        try {
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${wsProtocol}//${window.location.host}/ws/notifications/`;
            
            wsRef.current = new WebSocket(wsUrl);

            wsRef.current.onopen = () => {
                console.log('WebSocket connected');
                isConnectingRef.current = false;
            };

            wsRef.current.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    
                    // Invalidate cache immediately on new notification
                    if (message.type === 'notification' || message.type === 'update') {
                        invalidateCache();
                    }
                } catch (error) {
                    console.error('Error processing WebSocket message:', error);
                }
            };

            wsRef.current.onerror = (error) => {
                console.error('WebSocket error:', error);
                isConnectingRef.current = false;
            };

            wsRef.current.onclose = () => {
                console.log('WebSocket disconnected');
                isConnectingRef.current = false;
                // Attempt reconnection after 5 seconds
                reconnectTimeoutRef.current = setTimeout(() => {
                    initializeWebSocket();
                }, 5000);
            };
        } catch (error) {
            console.error('Failed to initialize WebSocket:', error);
            isConnectingRef.current = false;
        }
    }, [user]);

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
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        retry: 2,
        enabled: !!user,
    });

    const invalidateCache = useCallback(() => {
        try {
            sessionStorage.removeItem(NOTIFICATIONS_CACHE_KEY);
            sessionStorage.removeItem(NOTIFICATIONS_LAST_UPDATE);
        } catch {
            // Silently fail
        }
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }, [queryClient]);

    // Handle visibility change - refetch when tab becomes visible
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                // Tab became visible, invalidate cache and refetch
                invalidateCache();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [invalidateCache]);

    // Handle online/offline events
    useEffect(() => {
        const handleOnline = () => {
            console.log('Connection restored');
            invalidateCache();
            initializeWebSocket();
        };

        const handleOffline = () => {
            console.log('Connection lost');
            // Close WebSocket if offline
            if (wsRef.current) {
                wsRef.current.close();
            }
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [invalidateCache, initializeWebSocket]);

    // Initialize WebSocket on mount
    useEffect(() => {
        initializeWebSocket();

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [initializeWebSocket]);

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
        latestNotifications: data?.latestNotifications || [],
    };
};