// NotificationDrawer.jsx
import React from 'react';
import { styled, alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../api/axios';
import { useAuth } from '../auth/AuthProvider';
import {
    Bell,
    X,
    ExternalLink,
    Clock,
    Calendar,
    MapPin,
    Wrench,
    ArrowRight,
} from 'lucide-react';

// Notification-specific colors
const NOTIFICATION_COLORS = {
    primary: "#1976d2",
    bg: "#ffffff",
    textPrimary: "#2d3748",
    textSecondary: "#718096",
    textTertiary: "#a0aec0",
    borderLight: "#e2e8f0",
    gray: "#6b7280",
};

const NotificationScrollableBox = styled(Box)({
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    '&::-webkit-scrollbar': {
        width: '4px',
    },
    '&::-webkit-scrollbar-track': {
        background: '#f1f5f9',
        borderRadius: '2px',
    },
    '&::-webkit-scrollbar-thumb': {
        background: '#cbd5e0',
        borderRadius: '2px',
        '&:hover': {
            background: '#a0aec0',
        },
    },
});

// Helper functions for notifications
const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch (e) {
        return '—';
    }
};

const parseDashboardAddress = (fullAddress) => {
    if (!fullAddress) return { street: '', city: '', state: '', zip: '', original: '' };
    const parts = fullAddress.split(' - ');
    if (parts.length < 2) return { street: fullAddress, city: '', state: '', zip: '', original: fullAddress };
    const street = parts[0].trim();
    const remaining = parts[1].trim();
    const zipMatch = remaining.match(/\b\d{5}\b/);
    const zip = zipMatch ? zipMatch[0] : '';
    const withoutZip = remaining.replace(zip, '').trim();
    const cityState = withoutZip.split(',').map(s => s.trim());
    return {
        street,
        city: cityState[0] || '',
        state: cityState[1] || '',
        zip,
        original: fullAddress,
    };
};

const NotificationDrawer = ({ onClose }) => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Fetch combined data for notifications
    const { data: combinedData, isLoading, error } = useQuery({
        queryKey: ['notifications-data'],
        queryFn: async () => {
            try {
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

                return {
                    locates: locatesData,
                    workOrders: workOrdersData,
                    timestamp: new Date().toISOString(),
                };
            } catch (err) {
                console.error('Error fetching notifications data:', err);
                throw err;
            }
        },
        staleTime: 30000,
        refetchInterval: 60000,
    });

    // Process notifications
    const notifications = React.useMemo(() => {
        if (!combinedData) return [];

        const { locates = [], workOrders = [] } = combinedData;
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        const allNotifications = [];

        // Process locates data
        locates.forEach((locate) => {
            const createdAt = locate.created_at || locate.created_date;
            if (!createdAt) return;

            const createdDate = new Date(createdAt);
            if (createdDate >= oneMonthAgo) {
                const addr = parseDashboardAddress(locate.customer_address || '');

                allNotifications.push({
                    id: `locate-${locate.id}`,
                    type: 'locate',
                    title: 'New Locate Request',
                    description: `New locate request added for address: "${addr.street || 'unknown address'}"`,
                    address: addr.original || 'Unknown address',
                    workOrderNumber: locate.work_order_number || 'N/A',
                    customerName: locate.customer_name || 'Unknown',
                    timestamp: createdDate,
                    formattedTime: formatDate(createdAt),
                    icon: MapPin,
                    color: NOTIFICATION_COLORS.primary,
                    rawData: locate,
                });
            }
        });

        // Process work orders data (RME)
        workOrders.forEach((workOrder) => {
            const elapsedTime = workOrder.elapsed_time;
            if (!elapsedTime) return;

            try {
                const elapsedDate = new Date(elapsedTime);

                if (elapsedDate >= oneMonthAgo) {
                    const address = workOrder.full_address || workOrder.full_address || 'Unknown address';
                    const addr = parseDashboardAddress(address);

                    allNotifications.push({
                        id: `rme-${workOrder.id}`,
                        type: 'RME',
                        title: 'New RME Added',
                        description: `New RME created for address: "${addr.street || 'unknown address'}"`,
                        address: addr.original || 'Unknown address',
                        rmeNumber: workOrder.wo_number || workOrder.wo_number || workOrder.id || 'N/A',
                        customerName: workOrder.customer_name || 'Unknown',
                        timestamp: elapsedDate,
                        formattedTime: formatDate(elapsedTime),
                        icon: Wrench,
                        color: NOTIFICATION_COLORS.primary,
                        rawData: workOrder,
                    });
                }
            } catch (e) {
                console.error('Error parsing work order elapsed_time:', e);
            }
        });

        // Sort by timestamp (newest first)
        return allNotifications.sort((a, b) => b.timestamp - a.timestamp);
    }, [combinedData]);

    // Get only latest 10 notifications
    const latestNotifications = React.useMemo(() => {
        return notifications.slice(0, 10);
    }, [notifications]);

    // Group latest 10 notifications by date
    const groupedNotifications = React.useMemo(() => {
        const groups = {};

        latestNotifications.forEach((notification) => {
            const dateKey = notification.timestamp.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });

            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(notification);
        });

        return groups;
    }, [latestNotifications]);


    const getDashboardBasePath = () => {
        switch (user?.role?.toUpperCase()) {
            case 'SUPER-ADMIN':
            case 'SUPERADMIN':
                return '/super-admin-dashboard';
            case 'MANAGER':
                return '/manager-dashboard';
            case 'TECH':
                return '/tech-dashboard';
            default:
                return '/';
        }
    };

    const handleViewAll = () => {
        const basePath = getDashboardBasePath();
        onClose();
        navigate(`${basePath}/notifications`);
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress size={24} />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 2 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    Error loading notifications: {error.message}
                </Alert>
                <Button
                    onClick={() => window.location.reload()}
                    variant="outlined"
                    size="small"
                    fullWidth
                >
                    Retry
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: NOTIFICATION_COLORS.bg,
            color: NOTIFICATION_COLORS.textPrimary,
        }}>
            {/* Header */}
            <Box sx={{
                p: 2,
                borderBottom: `1px solid ${NOTIFICATION_COLORS.borderLight}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
                backgroundColor: NOTIFICATION_COLORS.bg,
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: alpha(NOTIFICATION_COLORS.primary, 0.1),
                        color: NOTIFICATION_COLORS.primary,
                    }}>
                        <Bell size={18} />
                    </Box>
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: NOTIFICATION_COLORS.textPrimary }}>
                            Notifications
                        </Typography>
                        {notifications.length > 0 && (
                            <Typography variant="caption" sx={{ color: NOTIFICATION_COLORS.textSecondary }}>
                                {notifications.length} total notifications
                            </Typography>
                        )}
                    </Box>
                </Box>
                <IconButton
                    onClick={onClose}
                    size="small"
                    sx={{
                        color: NOTIFICATION_COLORS.textSecondary,
                        '&:hover': {
                            backgroundColor: alpha(NOTIFICATION_COLORS.textSecondary, 0.1),
                            color: NOTIFICATION_COLORS.textPrimary,
                        },
                    }}
                >
                    <X size={16} />
                </IconButton>
            </Box>

            {/* Notifications List */}
            <NotificationScrollableBox sx={{ backgroundColor: NOTIFICATION_COLORS.bg }}>
                {latestNotifications.length === 0 ? (
                    <Box sx={{
                        textAlign: 'center',
                        py: 6,
                        px: 2,
                        backgroundColor: NOTIFICATION_COLORS.bg,
                    }}>
                        <Bell size={32} color={alpha(NOTIFICATION_COLORS.gray, 0.3)} />
                        <Typography variant="body1" sx={{ mt: 2, color: NOTIFICATION_COLORS.textSecondary, fontWeight: 500 }}>
                            No recent activity
                        </Typography>
                        <Typography variant="caption" sx={{ color: NOTIFICATION_COLORS.textTertiary, mt: 1, display: 'block' }}>
                            No new locates or RME in the last 30 days
                        </Typography>
                    </Box>
                ) : (
                    <Box sx={{ backgroundColor: NOTIFICATION_COLORS.bg }}>
                        {Object.entries(groupedNotifications).map(([date, dateNotifications]) => (
                            <Box key={date} sx={{ backgroundColor: NOTIFICATION_COLORS.bg }}>
                                {/* Date Header */}
                                <Box sx={{
                                    p: 1.5,
                                    px: 2,
                                    bgcolor: alpha(NOTIFICATION_COLORS.gray, 0.03),
                                    borderBottom: `1px solid ${alpha(NOTIFICATION_COLORS.gray, 0.1)}`,
                                    borderTop: `1px solid ${alpha(NOTIFICATION_COLORS.gray, 0.1)}`,
                                }}>
                                    <Typography variant="caption" sx={{ color: NOTIFICATION_COLORS.textSecondary, fontWeight: 600, fontSize: '0.75rem' }}>
                                        {date}
                                    </Typography>
                                </Box>

                                {/* Notifications for this date */}
                                <List disablePadding sx={{ backgroundColor: NOTIFICATION_COLORS.bg }}>
                                    {dateNotifications.map((notification, index) => {
                                        const Icon = notification.icon;
                                        const isLast = index === dateNotifications.length - 1;

                                        return (
                                            <React.Fragment key={notification.id}>
                                                <ListItem
                                                    sx={{
                                                        p: 1.5,
                                                        px: 2,
                                                        backgroundColor: NOTIFICATION_COLORS.bg,
                                                        '&:hover': {
                                                            bgcolor: alpha(notification.color, 0.03),
                                                        },
                                                    }}
                                                >
                                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                                        <Box sx={{
                                                            width: 28,
                                                            height: 28,
                                                            borderRadius: '6px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            backgroundColor: alpha(notification.color, 0.1),
                                                            color: notification.color,
                                                        }}>
                                                            <Icon size={14} />
                                                        </Box>
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
                                                                <Typography variant="body2" sx={{ color: NOTIFICATION_COLORS.textPrimary, fontWeight: 600, fontSize: '0.8rem' }}>
                                                                    {notification.description}
                                                                </Typography>
                                                                <Chip
                                                                    label={notification.type === 'locate' ? 'Locate' : 'RME'}
                                                                    size="small"
                                                                    sx={{
                                                                        height: '18px',
                                                                        fontSize: '0.6rem',
                                                                        fontWeight: 500,
                                                                        backgroundColor: alpha(notification.color, 0.1),
                                                                        color: notification.color,
                                                                        border: `1px solid ${alpha(notification.color, 0.2)}`,
                                                                    }}
                                                                />
                                                            </Box>
                                                        }
                                                        secondary={
                                                            <Box sx={{ backgroundColor: 'transparent' }}>
                                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                                    <Typography variant="caption" sx={{ color: NOTIFICATION_COLORS.textSecondary, display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.7rem' }}>
                                                                        <Clock size={10} />
                                                                        {notification.type === 'locate' ? 'WO' : 'WO'}: {notification.type === 'locate' ? notification.workOrderNumber : notification.rmeNumber}
                                                                    </Typography>
                                                                    <Typography variant="caption" sx={{ color: NOTIFICATION_COLORS.textSecondary, display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.7rem' }}>
                                                                        <Calendar size={10} />
                                                                        {notification.formattedTime}
                                                                    </Typography>
                                                                </Box>
                                                            </Box>
                                                        }
                                                    />
                                                    <IconButton size="small" sx={{ ml: 1 }}>
                                                        <ExternalLink size={12} />
                                                    </IconButton>
                                                </ListItem>
                                                {!isLast && <Divider sx={{ mx: 2 }} />}
                                            </React.Fragment>
                                        );
                                    })}
                                </List>
                            </Box>
                        ))}
                    </Box>
                )}
            </NotificationScrollableBox>

            {/* Summary and View All Button */}
            <Box sx={{
                p: 2,
                borderTop: `1px solid ${NOTIFICATION_COLORS.borderLight}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                flexShrink: 0,
                backgroundColor: NOTIFICATION_COLORS.bg,
            }}>
                {notifications.length > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: NOTIFICATION_COLORS.textTertiary }}>
                            Showing {Math.min(10, notifications.length)} of {notifications.length} notifications
                        </Typography>
                    </Box>
                )}
                {notifications.length > 10 && (
                    <Button
                        onClick={handleViewAll}
                        variant="outlined"
                        fullWidth
                        endIcon={<ArrowRight size={14} />}
                        sx={{
                            textTransform: 'none',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            color: NOTIFICATION_COLORS.primary,
                            borderColor: NOTIFICATION_COLORS.borderLight,
                            '&:hover': {
                                borderColor: NOTIFICATION_COLORS.primary,
                                backgroundColor: alpha(NOTIFICATION_COLORS.primary, 0.04),
                            },
                        }}
                    >
                        View All Notifications
                    </Button>
                )}
            </Box>
        </Box>
    );
};

export default NotificationDrawer;