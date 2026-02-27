import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
    LayoutDashboard,
    Users,
    MapPin,
    ClipboardCheck,
    Search,
    Wrench,
} from 'lucide-react';
import { useNotifications } from '../../../hook/useNotifications';
import axiosInstance from '../../../api/axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

const ONE_MONTH_MILLISECONDS = 30 * 24 * 60 * 60 * 1000;
const ONE_MONTH_AGO_TIMESTAMP = Date.now() - ONE_MONTH_MILLISECONDS;

const NOTIFICATION_PATHS = [
    { path: '/super-admin-dashboard/locates', type: 'locates', endpoint: '/locates/mark-seen/' },
    { path: '/super-admin-dashboard/health-department-report-tracking/rme', type: 'workOrders', endpoint: '/work-orders-today/mark-seen/' },
];

const MENU_ITEMS_CONFIG = [
    { text: 'Dashboard', icon: LayoutDashboard, path: '/super-admin-dashboard', section: 'GENERAL' },
    { text: 'Locates', icon: MapPin, path: '/super-admin-dashboard/locates', section: 'GENERAL', parent: 'Operations', indent: 1 },
    { text: 'Tank Repairs', icon: Wrench, path: '/super-admin-dashboard/repairs', section: 'GENERAL', parent: 'Work Orders', indent: 1 },
    { text: 'Users', icon: Users, path: '/super-admin-dashboard/users', section: 'MANAGEMENT' },
    { text: 'RME Reports', icon: ClipboardCheck, path: '/super-admin-dashboard/health-department-report-tracking/rme', section: 'SYSTEM', parent: 'Health Dept Reports', grandparent: 'Reports', indent: 2 },
    { text: 'Lookup', icon: Search, path: 'https://dashboard.sterlingsepticandplumbing.com/lookup', section: 'RESOURCES', isExternal: true },
];

const getUnseenIds = (data, dateField, oneMonthAgoTimestamp) => {
    if (!Array.isArray(data)) return [];
    return data
        .filter(item => {
            const timestamp = new Date(item[dateField]).getTime();
            return !isNaN(timestamp) && timestamp >= oneMonthAgoTimestamp && item.is_seen === false;
        })
        .map(item => item.id);
};

const getUnseenCount = (data, dateField, oneMonthAgoTimestamp) => {
    return getUnseenIds(data, dateField, oneMonthAgoTimestamp).length;
};

export const SuperAdminMenuComponent = ({ onMenuItemClick }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const pendingMarkSeen = useRef(new Set());
    const optimisticCacheRef = useRef(new Map());

    const { notifications, refetch, invalidateCache } = useNotifications();
    const [optimisticallyCleared, setOptimisticallyCleared] = useState(new Set());

    const getPathConfig = useCallback((pathname) => {
        return NOTIFICATION_PATHS.find(config => config.path === pathname);
    }, []);

    const markNotificationsAsSeenForPath = useCallback(async (pathname) => {
        if (!notifications?.locates || !notifications?.workOrders) return;
        
        const pathConfig = getPathConfig(pathname);
        if (!pathConfig || pendingMarkSeen.current.has(pathname)) return;

        const dataSource = notifications[pathConfig.type];
        const dateField = pathConfig.type === 'locates' ? 'created_at' : 'elapsed_time';
        const ids = getUnseenIds(dataSource, dateField, ONE_MONTH_AGO_TIMESTAMP);

        if (ids.length === 0) return;

        setOptimisticallyCleared(prev => new Set([...prev, pathname]));
        optimisticCacheRef.current.set(pathname, ids);
        pendingMarkSeen.current.add(pathname);

        try {
            await axiosInstance.post(pathConfig.endpoint, { ids });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            invalidateCache?.();
            refetch();
        } catch (error) {
            console.error(`Error marking ${pathConfig.type} as seen:`, error);
            setOptimisticallyCleared(prev => {
                const next = new Set(prev);
                next.delete(pathname);
                return next;
            });
            optimisticCacheRef.current.delete(pathname);
        } finally {
            pendingMarkSeen.current.delete(pathname);
        }
    }, [notifications, getPathConfig, queryClient, refetch, invalidateCache]);

    useEffect(() => {
        if (!notifications) return;

        setOptimisticallyCleared(prev => {
            const next = new Set(prev);
            for (const pathname of prev) {
                const pathConfig = getPathConfig(pathname);
                if (!pathConfig) continue;

                const dataSource = notifications[pathConfig.type];
                const dateField = pathConfig.type === 'locates' ? 'created_at' : 'elapsed_time';
                const hasUnseen = getUnseenCount(dataSource, dateField, ONE_MONTH_AGO_TIMESTAMP) > 0;

                if (!hasUnseen) {
                    next.delete(pathname);
                    optimisticCacheRef.current.delete(pathname);
                }
            }
            return next;
        });
    }, [notifications, getPathConfig]);

    useEffect(() => {
        const pathConfig = getPathConfig(location.pathname);
        if (pathConfig) {
            markNotificationsAsSeenForPath(location.pathname);
        }
    }, [location.pathname, markNotificationsAsSeenForPath, getPathConfig]);

    const handleMenuItemClick = useCallback((path) => {
        if (path.startsWith('http')) {
            window.open(path, '_blank');
        } else {
            navigate(path);
        }
        onMenuItemClick?.(path);
    }, [navigate, onMenuItemClick]);

    const itemCounts = useMemo(() => {
        if (!notifications?.locates || !notifications?.workOrders) return {};

        const counts = {};
        NOTIFICATION_PATHS.forEach(({ path, type, endpoint }) => {
            const dateField = type === 'locates' ? 'created_at' : 'elapsed_time';
            counts[path] = optimisticallyCleared.has(path)
                ? 0
                : getUnseenCount(notifications[type], dateField, ONE_MONTH_AGO_TIMESTAMP);
        });

        return counts;
    }, [notifications, optimisticallyCleared]);

    const processedSections = useMemo(() => {
        const grouped = MENU_ITEMS_CONFIG.reduce((acc, item) => {
            if (!acc[item.section]) acc[item.section] = [];
            acc[item.section].push(item);
            return acc;
        }, {});

        return Object.entries(grouped).map(([sectionName, items]) => ({
            sectionName,
            items: items.map(item => ({
                ...item,
                icon: item.icon,
                onClick: () => handleMenuItemClick(item.path),
                count: itemCounts[item.path] ?? 0,
                hasCount: (itemCounts[item.path] ?? 0) > 0,
            })),
        }));
    }, [itemCounts, handleMenuItemClick]);

    return processedSections;
};