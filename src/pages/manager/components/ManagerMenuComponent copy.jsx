import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    Users,
    MapPin,
    FileText,
    ClipboardList,
    History,
    Database,
    BarChart3,
    AlertTriangle,
    ClipboardCheck,
    Activity,
    ChevronDown,
    ChevronUp,
    Briefcase,
    Truck,
    ListChecks,
    SignalHigh,
    GraduationCap,
    LibraryBig,
    Search,
    Settings,
    Wrench,
    Calendar,
    Quote,
    Target,
    Package,
    Shield,
    Award,
    FileEdit,
    CheckSquare,
    Map,
    TruckIcon,
} from 'lucide-react';
import { useNotifications } from '../../../hook/useNotifications';
import axiosInstance from '../../../api/axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

export const ManagerMenuComponent = ({ onMenuItemClick }) => {
    const [expandedSections, setExpandedSections] = useState({
        'general-section': false,
        'management-section': false,
        'system-section': false,
        'resources-section': false,
        'operations-subsection': false,
        'workorders-subsection': false,
        'assets-subsection': false,
        'reports-subsection': false,
        'forms-subsection': false,
        'health-reports': false,
        'technicians-subsection': false,
        'sales-subsection': false,
    });

    const location = useLocation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const toggleSection = (sectionId) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId],
        }));
    };

    const { notifications, badgeCount, locatesCount, rmeCount, unseenLocateIds, unseenRmeIds, refetch } = useNotifications();

    const calculateItemCounts = (path) => {
        if (!notifications || !notifications.locates || !notifications.workOrders) {
            return 0;
        }

        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        switch (path) {
            case '/manager-dashboard/locates':
                return notifications.locates.filter(locate => {
                    const createdDate = new Date(locate.created_at || locate.created_date);
                    return createdDate >= oneMonthAgo && !locate.is_seen;
                }).length;

            case '/manager-dashboard/health-department-report-tracking/rme':
                return notifications.workOrders.filter(workOrder => {
                    const elapsedDate = new Date(workOrder.elapsed_time);
                    return elapsedDate >= oneMonthAgo && !workOrder.is_seen;
                }).length;

            default:
                return 0;
        }
    };

    const calculateParentCount = (subItems) => {
        if (!subItems || subItems.length === 0) return 0;

        let totalCount = 0;
        subItems.forEach(subItem => {
            if (subItem.subItems) {
                totalCount += calculateParentCount(subItem.subItems);
            } else {
                totalCount += calculateItemCounts(subItem.path);
            }
        });
        return totalCount;
    };

    const markNotificationsAsSeenForPath = async (path) => {
        if (!notifications || !notifications.locates || !notifications.workOrders) {
            return;
        }

        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        try {
            switch (path) {
                case '/manager-dashboard/locates':
                    const locateIds = notifications.locates
                        .filter(locate => {
                            const createdDate = new Date(locate.created_at || locate.created_date);
                            return createdDate >= oneMonthAgo && !locate.is_seen;
                        })
                        .map(locate => locate.id);

                    if (locateIds.length > 0) {
                        await axiosInstance.post('/locates/mark-seen/', {
                            ids: locateIds
                        });
                    }
                    break;

                case '/manager-dashboard/health-department-report-tracking/rme':
                    const rmeIds = notifications.workOrders
                        .filter(workOrder => {
                            const elapsedDate = new Date(workOrder.elapsed_time);
                            return elapsedDate >= oneMonthAgo && !workOrder.is_seen;
                        })
                        .map(workOrder => workOrder.id);

                    if (rmeIds.length > 0) {
                        await axiosInstance.post('/work-orders-today/mark-seen/', {
                            ids: rmeIds
                        });
                    }
                    break;
            }

            queryClient.invalidateQueries(['notifications-count']);
            refetch();
        } catch (error) {
            console.error('Error marking notifications as seen:', error);
        }
    };

    const handleMenuItemClick = (path) => {
        if (path === '/manager-dashboard/locates' ||
            path === '/manager-dashboard/health-department-report-tracking/rme') {
            markNotificationsAsSeenForPath(path);
        }

        if (path.startsWith('http')) {
            window.open(path, '_blank');
        } else {
            navigate(path);
        }

        if (onMenuItemClick) {
            onMenuItemClick(path);
        }
    };

    useEffect(() => {
        const currentPath = location.pathname;

        const pathsToClear = [
            '/manager-dashboard/locates',
            '/manager-dashboard/health-department-report-tracking/rme'
        ];

        if (pathsToClear.includes(currentPath)) {
            markNotificationsAsSeenForPath(currentPath);
        }
    }, [location.pathname]);

    const menuItems = [
        // 🧭 GENERAL
        {
            sectionName: 'GENERAL',
            sectionId: 'general-section',
            isExpandable: true,
            items: [
                {
                    text: 'Dashboard',
                    icon: <LayoutDashboard size={18} />,
                    path: '/manager-dashboard',
                },
                {
                    text: 'Overview',
                    icon: <BarChart3 size={18} />,
                    path: '/manager-dashboard/overview',
                },
                {
                    text: 'Operations',
                    icon: <Briefcase size={18} />,
                    isExpandable: true,
                    sectionId: 'operations-subsection',
                    subItems: [
                        {
                            text: 'Dispatch',
                            icon: <Truck size={16} />,
                            path: '/manager-dashboard/dispatch',
                        },
                        {
                            text: 'Logistics Map',
                            icon: <Map size={16} />,
                            path: '/manager-dashboard/logistics-map',
                        },
                        {
                            text: 'Locates',
                            icon: <MapPin size={16} />,
                            path: '/manager-dashboard/locates',
                        },
                    ],
                },
                {
                    text: 'Work Orders',
                    icon: <ListChecks size={18} />,
                    isExpandable: true,
                    sectionId: 'workorders-subsection',
                    subItems: [
                        {
                            text: 'Installations',
                            icon: <Settings size={16} />,
                            path: '/manager-dashboard/installations',
                        },
                        {
                            text: 'Tank Repairs',
                            icon: <Wrench size={16} />,
                            path: '/manager-dashboard/repairs',
                        },
                    ],
                },
            ],
        },

        // 🛠️ MANAGEMENT
        {
            sectionName: 'MANAGEMENT',
            sectionId: 'management-section',
            isExpandable: true,
            items: [
                {
                    text: 'Technicians',
                    icon: <Users size={18} />,
                    isExpandable: true,
                    sectionId: 'technicians-subsection',
                    subItems: [
                        {
                            text: 'All Technicians',
                            icon: <Users size={16} />,
                            path: '/manager-dashboard/all-technicians',
                        },
                        {
                            text: 'Scheduling',
                            icon: <Calendar size={16} />,
                            path: '/manager-dashboard/scheduling',
                        },
                        {
                            text: 'Performance',
                            icon: <Activity size={16} />,
                            path: '/manager-dashboard/performance',
                        },
                    ],
                },
                {
                    text: 'Sales',
                    icon: <ClipboardList size={18} />,
                    isExpandable: true,
                    sectionId: 'sales-subsection',
                    subItems: [
                        {
                            text: 'Quotes',
                            icon: <Quote size={16} />,
                            path: '/manager-dashboard/quotes',
                        },
                        {
                            text: 'Leads',
                            icon: <Target size={16} />,
                            path: '/manager-dashboard/leads',
                        },
                    ],
                },
            ],
        },

        // ⚙️ SYSTEM
        {
            sectionName: 'SYSTEM',
            sectionId: 'system-section',
            isExpandable: true,
            items: [
                {
                    text: 'Assets',
                    icon: <Database size={18} />,
                    isExpandable: true,
                    sectionId: 'assets-subsection',
                    subItems: [
                        {
                            text: 'Vehicles & Tools',
                            icon: <TruckIcon size={16} />,
                            path: '/manager-dashboard/vehicles-tools',
                        },
                        {
                            text: 'Inventory',
                            icon: <Package size={16} />,
                            path: '/manager-dashboard/inventory',
                        },
                    ],
                },
                {
                    text: 'Reports',
                    icon: <SignalHigh size={18} />,
                    isExpandable: true,
                    sectionId: 'reports-subsection',
                    subItems: [
                        {
                            text: 'Health Dept Reports',
                            icon: <AlertTriangle size={16} />,
                            isExpandable: true,
                            sectionId: 'health-reports',
                            subItems: [
                                {
                                    text: 'RME Reports',
                                    icon: <ClipboardCheck size={14} />,
                                    path: '/manager-dashboard/health-department-report-tracking/rme',
                                },
                                {
                                    text: 'RSS Reports',
                                    icon: <Activity size={14} />,
                                    path: '/manager-dashboard/health-department-report-tracking/rss',
                                },
                                {
                                    text: 'TOS Reports',
                                    icon: <BarChart3 size={14} />,
                                    path: '/manager-dashboard/health-department-report-tracking/tos',
                                },
                            ],
                        },
                        {
                            text: 'Risk Management',
                            icon: <Shield size={16} />,
                            path: '/manager-dashboard/risk-management',
                        },
                        {
                            text: 'Scorecards',
                            icon: <Award size={16} />,
                            path: '/manager-dashboard/scorecards',
                        },
                    ],
                },
                {
                    text: 'Forms',
                    icon: <FileText size={18} />,
                    isExpandable: true,
                    sectionId: 'forms-subsection',
                    subItems: [
                        {
                            text: 'Forms',
                            icon: <FileEdit size={16} />,
                            path: '/manager-dashboard/forms',
                        },
                        {
                            text: 'Review Forms',
                            icon: <ClipboardCheck size={16} />,
                            path: '/manager-dashboard/review-forms',
                        },
                        {
                            text: 'Approvals',
                            icon: <CheckSquare size={16} />,
                            path: '/manager-dashboard/approvals',
                        },
                    ],
                },
            ],
        },

        // 📚 RESOURCES
        {
            sectionName: 'RESOURCES',
            sectionId: 'resources-section',
            isExpandable: true,
            items: [
                {
                    text: 'Lookup',
                    icon: <Search size={18} />,
                    path: 'https://dashboard.sterlingsepticandplumbing.com/lookup',
                },
                {
                    text: 'Training',
                    icon: <GraduationCap size={18} />,
                    path: '/manager-dashboard/training',
                },
                {
                    text: 'Tasks',
                    icon: <ClipboardList size={18} />,
                    path: '/manager-dashboard/tasks',
                },
                {
                    text: 'Library',
                    icon: <LibraryBig size={18} />,
                    path: '/manager-dashboard/library',
                },
            ],
        },
    ];

    // 🔄 Process menu items with counts
    const processedMenuItems = menuItems.map(section => {
        const processedItems = section.items.map(item => {
            let itemCount = 0;

            if (item.isExpandable && item.subItems) {
                itemCount = calculateParentCount(item.subItems);
            } else {
                itemCount = calculateItemCounts(item.path);
            }

            if (item.isExpandable) {
                const processedSubItems = item.subItems?.map(subItem => {
                    let subItemCount = 0;

                    if (subItem.isExpandable && subItem.subItems) {
                        subItemCount = calculateParentCount(subItem.subItems);
                    } else {
                        subItemCount = calculateItemCounts(subItem.path);
                    }

                    if (subItem.isExpandable) {
                        const processedNestedSubItems = subItem.subItems?.map(nestedSubItem => {
                            const nestedSubItemCount = calculateItemCounts(nestedSubItem.path);

                            return {
                                ...nestedSubItem,
                                onClick: () => handleMenuItemClick(nestedSubItem.path),
                                count: nestedSubItemCount,
                                hasCount: nestedSubItemCount > 0,
                            };
                        }) || [];

                        return {
                            ...subItem,
                            onClick: () => toggleSection(subItem.sectionId),
                            expanded: expandedSections[subItem.sectionId] || false,
                            expandIcon: expandedSections[subItem.sectionId]
                                ? <ChevronUp size={14} />
                                : <ChevronDown size={14} />,
                            subItems: processedNestedSubItems,
                            count: subItemCount,
                            hasCount: subItemCount > 0,
                        };
                    }

                    return {
                        ...subItem,
                        onClick: () => handleMenuItemClick(subItem.path),
                        count: subItemCount,
                        hasCount: subItemCount > 0,
                    };
                });

                return {
                    ...item,
                    onClick: () => toggleSection(item.sectionId),
                    expanded: expandedSections[item.sectionId] || false,
                    expandIcon: expandedSections[item.sectionId]
                        ? <ChevronUp size={16} />
                        : <ChevronDown size={16} />,
                    subItems: processedSubItems || [],
                    count: itemCount,
                    hasCount: itemCount > 0,
                };
            }

            return {
                ...item,
                onClick: () => handleMenuItemClick(item.path),
                count: itemCount,
                hasCount: itemCount > 0,
            };
        });

        const sectionCount = processedItems.reduce((total, item) => total + (item.count || 0), 0);

        return {
            ...section,
            onClick: () => toggleSection(section.sectionId),
            expanded: expandedSections[section.sectionId] || false,
            expandIcon: expandedSections[section.sectionId]
                ? <ChevronUp size={16} />
                : <ChevronDown size={16} />,
            items: processedItems,
            count: sectionCount,
            hasCount: false,
        };
    });

    return processedMenuItems;
};
