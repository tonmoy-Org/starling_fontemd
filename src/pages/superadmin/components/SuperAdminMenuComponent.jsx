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

const NOTIFICATION_PATHS = [
    '/super-admin-dashboard/locates/work-orders',
    '/super-admin-dashboard/rme/work-orders',
];

const MARK_SEEN_TIMEOUT = 5000;
const DEBOUNCE_DELAY = 500;

const getOneMonthAgo = () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d;
};

const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
};

const isValidDate = (dateString) => {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
};

export const SuperAdminMenuComponent = ({ onMenuItemClick }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const pendingMarkSeen = useRef(new Set());
    const timeoutRefs = useRef(new Map());

    const { notifications, refetch } = useNotifications();
    const [optimisticallyCleared, setOptimisticallyCleared] = useState(new Set());

    const markNotificationsAsSeenForPath = useCallback(async (path) => {
        if (!notifications?.locates || !notifications?.workOrders) {
            return;
        }

        if (pendingMarkSeen.current.has(path)) {
            return;
        }

        const oneMonthAgo = getOneMonthAgo();

        const { ids, endpoint } = path === '/super-admin-dashboard/locates/work-orders'
            ? {
                ids: notifications.locates
                    .filter(l => {
                        const dateValue = l.created_at || l.created_date;
                        return (
                            isValidDate(dateValue) &&
                            new Date(dateValue) >= oneMonthAgo &&
                            !l.is_seen
                        );
                    })
                    .map(l => l.id),
                endpoint: '/locates/mark-seen/',
            }
            : path === '/super-admin-dashboard/rme/work-orders'
                ? {
                    ids: notifications.workOrders
                        .filter(w => {
                            const dateValue = w.elapsed_time;
                            return (
                                isValidDate(dateValue) &&
                                new Date(dateValue) >= oneMonthAgo &&
                                !w.is_seen
                            );
                        })
                        .map(w => w.id),
                    endpoint: '/work-orders-today/mark-seen/',
                }
                : { ids: [], endpoint: '' };

        if (ids.length === 0) {
            return;
        }

        setOptimisticallyCleared(prev => new Set([...prev, path]));
        pendingMarkSeen.current.add(path);

        const timeoutId = setTimeout(() => {
            pendingMarkSeen.current.delete(path);
            setOptimisticallyCleared(prev => {
                const next = new Set(prev);
                next.delete(path);
                return next;
            });
        }, MARK_SEEN_TIMEOUT);

        timeoutRefs.current.set(path, timeoutId);

        try {
            await axiosInstance.post(endpoint, { ids });

            clearTimeout(timeoutId);
            timeoutRefs.current.delete(path);

            queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
            await refetch();
        } catch (error) {
            clearTimeout(timeoutId);
            timeoutRefs.current.delete(path);

            setOptimisticallyCleared(prev => {
                const next = new Set(prev);
                next.delete(path);
                return next;
            });
        } finally {
            pendingMarkSeen.current.delete(path);
        }
    }, [notifications, queryClient, refetch]);

    const debouncedMarkSeen = useMemo(
        () => debounce(markNotificationsAsSeenForPath, DEBOUNCE_DELAY),
        [markNotificationsAsSeenForPath]
    );

    useEffect(() => {
        if (!notifications) return;

        const oneMonthAgo = getOneMonthAgo();

        setOptimisticallyCleared(prev => {
            const next = new Set(prev);

            for (const path of prev) {
                const hasUnseen = path === '/super-admin-dashboard/locates/work-orders'
                    ? notifications.locates?.some(l => {
                        const dateValue = l.created_at || l.created_date;
                        return (
                            isValidDate(dateValue) &&
                            new Date(dateValue) >= oneMonthAgo &&
                            !l.is_seen
                        );
                    })
                    : path === '/super-admin-dashboard/rme/work-orders'
                        ? notifications.workOrders?.some(w => {
                            const dateValue = w.elapsed_time;
                            return (
                                isValidDate(dateValue) &&
                                new Date(dateValue) >= oneMonthAgo &&
                                !w.is_seen
                            );
                        })
                        : false;

                if (!hasUnseen) {
                    next.delete(path);
                }
            }

            return next;
        });
    }, [notifications]);

    useEffect(() => {
        if (NOTIFICATION_PATHS.includes(location.pathname)) {
            debouncedMarkSeen(location.pathname);
        }
    }, [location.pathname, debouncedMarkSeen]);

    useEffect(() => {
        return () => {
            timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
            timeoutRefs.current.clear();
        };
    }, []);

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

        const oneMonthAgo = getOneMonthAgo();

        const locatesPath = '/super-admin-dashboard/locates/work-orders';
        const rmePath = '/super-admin-dashboard/rme/work-orders';

        return {
            [locatesPath]: optimisticallyCleared.has(locatesPath)
                ? 0
                : notifications.locates.filter(l => {
                    const dateValue = l.created_at || l.created_date;
                    return (
                        isValidDate(dateValue) &&
                        new Date(dateValue) >= oneMonthAgo &&
                        !l.is_seen
                    );
                }).length,

            [rmePath]: optimisticallyCleared.has(rmePath)
                ? 0
                : notifications.workOrders.filter(w => {
                    const dateValue = w.elapsed_time;
                    return (
                        isValidDate(dateValue) &&
                        new Date(dateValue) >= oneMonthAgo &&
                        !w.is_seen
                    );
                }).length,
        };
    }, [notifications, optimisticallyCleared]);

    const menuItems = [
        {
            text: 'Dashboard',
            icon: <LayoutDashboard size={18} />,
            path: '/super-admin-dashboard',
            section: 'GENERAL',
        },
        {
            text: 'Locates',
            icon: <MapPin size={18} />,
            path: '/super-admin-dashboard/locates/work-orders',
            parent: 'Operations',
            indent: 1,
            section: 'GENERAL',
        },
        {
            text: 'Tank Repairs',
            icon: <Wrench size={18} />,
            path: '/super-admin-dashboard/repairs',
            parent: 'Work Orders',
            indent: 1,
            section: 'GENERAL',
        },
        {
            text: 'Users',
            icon: <Users size={18} />,
            path: '/super-admin-dashboard/users',
            section: 'MANAGEMENT',
        },
        {
            text: 'RME Reports',
            icon: <ClipboardCheck size={18} />,
            path: '/super-admin-dashboard/rme/work-orders',
            parent: 'Health Dept Reports',
            grandparent: 'Reports',
            indent: 2,
            section: 'SYSTEM',
        },
        {
            text: 'Lookup',
            icon: <Search size={18} />,
            path: 'https://dashboard.sterlingsepticandplumbing.com/lookup',
            section: 'RESOURCES',
        },
    ];

    return Object.entries(
        menuItems.reduce((acc, item) => {
            if (!acc[item.section]) acc[item.section] = [];
            acc[item.section].push(item);
            return acc;
        }, {})
    ).map(([sectionName, items]) => ({
        sectionName,
        items: items.map(item => {
            const count = itemCounts[item.path] ?? 0;
            return {
                ...item,
                onClick: () => handleMenuItemClick(item.path),
                count,
                hasCount: count > 0,
            };
        }),
    }));
};