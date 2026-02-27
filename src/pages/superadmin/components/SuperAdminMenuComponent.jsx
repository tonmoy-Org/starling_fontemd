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

const MARK_SEEN_TIMEOUT = 5000; // 5 second timeout
const DEBOUNCE_DELAY = 500; // 500ms debounce

const getOneMonthAgo = () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d;
};

// ── Utility function: Debounce helper ──
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
};

// ── Utility function: Validate date safely ──
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

    // ── Optimistic state: tracks paths whose badges have been cleared locally ──
    const [optimisticallyCleared, setOptimisticallyCleared] = useState(new Set());

    const markNotificationsAsSeenForPath = useCallback(async (path) => {
        // Early exit if no notifications data
        if (!notifications?.locates || !notifications?.workOrders) {
            console.warn('Notifications data not available yet');
            return;
        }

        // Prevent duplicate requests for same path
        if (pendingMarkSeen.current.has(path)) {
            console.log(`Already processing mark-seen for path: ${path}`);
            return;
        }

        const oneMonthAgo = getOneMonthAgo();

        // ── Filter IDs based on path ──────────────────────────────────────────
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

        // If no unseen notifications, skip API call
        if (ids.length === 0) {
            console.log(`No unseen notifications for path: ${path}`);
            return;
        }

        // ── 1. Optimistic update: clear badge immediately ──────────────────────
        setOptimisticallyCleared(prev => new Set([...prev, path]));
        pendingMarkSeen.current.add(path);

        // ── Set timeout to prevent stuck loading state ────────────────────────
        const timeoutId = setTimeout(() => {
            console.error(`Timeout marking notifications as seen for path: ${path}`);
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

            // ── 2. Server confirmed: sync real data ───────────────────────────
            clearTimeout(timeoutId);
            timeoutRefs.current.delete(path);

            // Invalidate and refetch notifications
            queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
            await refetch();

            console.log(`Successfully marked as seen for path: ${path}`);
        } catch (error) {
            // ── 3. On failure: roll back the optimistic clear ─────────────────
            console.error('Error marking notifications as seen:', error);
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

    // ── Debounced version of markNotificationsAsSeenForPath ──
    const debouncedMarkSeen = useMemo(
        () => debounce(markNotificationsAsSeenForPath, DEBOUNCE_DELAY),
        [markNotificationsAsSeenForPath]
    );

    // ── When real data refreshes and the server confirms seen, remove from optimistic set ──
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

                // If server data is now clean, no need to keep optimistic override
                if (!hasUnseen) {
                    next.delete(path);
                }
            }

            return next;
        });
    }, [notifications]);

    // ── Mark seen on navigation (debounced to prevent multiple calls) ──
    useEffect(() => {
        if (NOTIFICATION_PATHS.includes(location.pathname)) {
            debouncedMarkSeen(location.pathname);
        }
    }, [location.pathname, debouncedMarkSeen]);

    // ── Cleanup timeouts on unmount ──
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

    // ── Compute counts — zeroed out immediately for optimistically cleared paths ──
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