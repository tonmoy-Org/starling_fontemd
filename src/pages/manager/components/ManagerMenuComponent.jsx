import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
    LayoutDashboard,
    MapPin,
    ClipboardCheck,
    Wrench,
    Search,
} from 'lucide-react';
import { useNotifications } from '../../../hook/useNotifications';
import axiosInstance from '../../../api/axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

const NOTIFICATION_PATHS = [
    '/manager-dashboard/locates',
    '/manager-dashboard/health-department-report-tracking/rme',
];

const getOneMonthAgo = () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d;
};

export const ManagerMenuComponent = ({ onMenuItemClick }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const pendingMarkSeen = useRef(new Set());

    const { notifications, refetch } = useNotifications();

    // ── Optimistic state: tracks paths whose badges have been cleared locally ──
    const [optimisticallyCleared, setOptimisticallyCleared] = useState(new Set());

    const markNotificationsAsSeenForPath = useCallback(async (path) => {
        if (!notifications?.locates || !notifications?.workOrders) return;
        if (pendingMarkSeen.current.has(path)) return;

        const oneMonthAgo = getOneMonthAgo();

        let ids = [];
        let endpoint = '';

        if (path === '/manager-dashboard/locates') {
            ids = notifications.locates
                .filter(l => new Date(l.created_at || l.created_date) >= oneMonthAgo && !l.is_seen)
                .map(l => l.id);
            endpoint = '/locates/mark-seen/';
        } else if (path === '/manager-dashboard/health-department-report-tracking/rme') {
            ids = notifications.workOrders
                .filter(w => new Date(w.elapsed_time) >= oneMonthAgo && !w.is_seen)
                .map(w => w.id);
            endpoint = '/work-orders-today/mark-seen/';
        }

        if (ids.length === 0) return;

        // ── 1. Optimistic update: clear badge immediately ──────────────────────
        setOptimisticallyCleared(prev => new Set([...prev, path]));

        pendingMarkSeen.current.add(path);
        try {
            await axiosInstance.post(endpoint, { ids });
            // ── 2. Server confirmed: sync real data ───────────────────────────
            queryClient.invalidateQueries(['notifications-count']);
            refetch();
        } catch (error) {
            // ── 3. On failure: roll back the optimistic clear ─────────────────
            console.error('Error marking notifications as seen:', error);
            setOptimisticallyCleared(prev => {
                const next = new Set(prev);
                next.delete(path);
                return next;
            });
        } finally {
            pendingMarkSeen.current.delete(path);
        }
    }, [notifications, queryClient, refetch]);

    // When real data refreshes and server confirms seen, remove from optimistic set
    useEffect(() => {
        if (!notifications) return;
        const oneMonthAgo = getOneMonthAgo();

        setOptimisticallyCleared(prev => {
            const next = new Set(prev);
            for (const path of prev) {
                let hasUnseen = false;
                if (path === '/manager-dashboard/locates') {
                    hasUnseen = notifications.locates?.some(
                        l => new Date(l.created_at || l.created_date) >= oneMonthAgo && !l.is_seen
                    );
                } else if (path === '/manager-dashboard/health-department-report-tracking/rme') {
                    hasUnseen = notifications.workOrders?.some(
                        w => new Date(w.elapsed_time) >= oneMonthAgo && !w.is_seen
                    );
                }
                if (!hasUnseen) next.delete(path);
            }
            return next;
        });
    }, [notifications]);

    // Mark seen on navigation
    useEffect(() => {
        if (NOTIFICATION_PATHS.includes(location.pathname)) {
            markNotificationsAsSeenForPath(location.pathname);
        }
    }, [location.pathname, markNotificationsAsSeenForPath]);

    const handleMenuItemClick = useCallback((path) => {
        if (path.startsWith('http')) {
            window.open(path, '_blank');
        } else {
            navigate(path);
        }
        onMenuItemClick?.(path);
    }, [navigate, onMenuItemClick]);

    // Compute counts — zeroed out immediately for optimistically cleared paths
    const itemCounts = useMemo(() => {
        if (!notifications?.locates || !notifications?.workOrders) return {};

        const oneMonthAgo = getOneMonthAgo();
        const locatesPath = '/manager-dashboard/locates';
        const rmePath = '/manager-dashboard/health-department-report-tracking/rme';

        return {
            [locatesPath]: optimisticallyCleared.has(locatesPath)
                ? 0
                : notifications.locates.filter(l =>
                    new Date(l.created_at || l.created_date) >= oneMonthAgo && !l.is_seen
                ).length,

            [rmePath]: optimisticallyCleared.has(rmePath)
                ? 0
                : notifications.workOrders.filter(w =>
                    new Date(w.elapsed_time) >= oneMonthAgo && !w.is_seen
                ).length,
        };
    }, [notifications, optimisticallyCleared]);

    const menuItems = [
        // 🧭 GENERAL
        {
            text: 'Dashboard',
            icon: <LayoutDashboard size={18} />,
            path: '/manager-dashboard',
            section: 'GENERAL',
        },
        {
            text: 'Locates',
            icon: <MapPin size={18} />,
            path: '/manager-dashboard/locates',
            parent: 'Operations',
            indent: 1,
            section: 'GENERAL',
        },
        {
            text: 'Tank Repairs',
            icon: <Wrench size={18} />,
            path: '/manager-dashboard/repairs',
            parent: 'Work Orders',
            indent: 1,
            section: 'GENERAL',
        },

        // ⚙️ SYSTEM
        {
            text: 'RME Reports',
            icon: <ClipboardCheck size={18} />,
            path: '/manager-dashboard/health-department-report-tracking/rme',
            parent: 'Health Dept Reports',
            grandparent: 'Reports',
            indent: 2,
            section: 'SYSTEM',
        },

        // 📚 RESOURCES
        {
            text: 'Lookup',
            icon: <Search size={18} />,
            path: 'https://dashboard.sterlingsepticandplumbing.com/lookup',
            section: 'RESOURCES',
        },
    ];

    const processedSections = useMemo(() => {
        const grouped = menuItems.reduce((acc, item) => {
            if (!acc[item.section]) acc[item.section] = [];
            acc[item.section].push(item);
            return acc;
        }, {});

        return Object.entries(grouped).map(([sectionName, items]) => ({
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
    }, [itemCounts, handleMenuItemClick]);

    return processedSections;
};