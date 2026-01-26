// NotificationDrawer.jsx - Modified to show 10 most recent notifications
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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../api/axios';
import { useAuth } from '../../auth/AuthProvider';
import { Bell, X, Clock, MapPin, Wrench, ArrowRight, Check } from 'lucide-react';
import { useNotifications } from '../../hook/useNotifications';

const GREEN_COLOR = '#10b981';

// Notification-specific colors
const NOTIFICATION_COLORS = {
    primary: "#1976d2",
    success: "#10b981",
    bg: "#ffffff",
    textPrimary: "#2d3748",
    textSecondary: "#718096",
    textTertiary: "#a0aec0",
    borderLight: "#e2e8f0",
    gray: "#6b7280",
    grayLight: "#f8fafc",
};

const NotificationScrollableBox = styled(Box)({
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    '&::-webkit-scrollbar': {
        width: '6px',
    },
    '&::-webkit-scrollbar-track': {
        background: '#f1f5f9',
        borderRadius: '4px',
    },
    '&::-webkit-scrollbar-thumb': {
        background: '#cbd5e0',
        borderRadius: '4px',
        '&:hover': {
            background: '#94a3b8',
        },
    },
});

// Helpers
const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);
        const diffInDays = Math.floor(diffInHours / 24);

        // For dates within last 7 days
        if (diffInDays === 0) {
            return `Today at ${date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
            })}`;
        } else if (diffInDays === 1) {
            return `Yesterday at ${date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
            })}`;
        } else if (diffInDays < 7) {
            return `${date.toLocaleDateString('en-US', {
                weekday: 'short',
            })} at ${date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
            })}`;
        }

        // For older dates
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        }).replace(',', '');
    } catch (e) {
        console.error('Error formatting detailed date:', e);
        return '—';
    }
};

const formatGroupDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
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
    return { street, city: cityState[0] || '', state: cityState[1] || '', zip, original: fullAddress };
};

const NotificationDrawer = ({ onClose }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const { notifications, isLoading, error, refetch } = useNotifications();

    // Single mutation for marking notifications as seen
    const markAsSeenMutation = useMutation({
        mutationFn: async (notification) => {
            if (notification.type === 'RME') {
                // Mark RME/Work Order as seen
                await axiosInstance.post('/work-orders-today/mark-seen/', {
                    ids: [notification.entityId]
                });
            } else if (notification.type === 'locate') {
                // Mark Locate as seen
                await axiosInstance.post('/locates/mark-seen/', {
                    ids: [notification.entityId]
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['notifications-data', user?.role]);
            refetch();
        },
        onError: (error) => {
            console.error('Error marking notification as seen:', error);
        }
    });

    // Bulk mark all as seen
    const markAllAsSeenMutation = useMutation({
        mutationFn: async (notificationsArray) => {
            // Separate IDs by type
            const locateIds = notificationsArray
                .filter(n => n.type === 'locate')
                .map(n => n.entityId);
            
            const workOrderIds = notificationsArray
                .filter(n => n.type === 'RME')
                .map(n => n.entityId);

            // Make API calls for each type if there are IDs
            const promises = [];

            if (locateIds.length > 0) {
                promises.push(
                    axiosInstance.post('/locates/mark-seen/', { ids: locateIds })
                );
            }

            if (workOrderIds.length > 0) {
                promises.push(
                    axiosInstance.post('/work-orders-today/mark-seen/', { ids: workOrderIds })
                );
            }

            // Wait for all API calls to complete
            await Promise.all(promises);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['notifications-data', user?.role]);
            refetch();
        },
        onError: (error) => {
            console.error('Error marking all notifications as seen:', error);
        }
    });

    // Process notifications - Get only latest 10 (both seen and unseen)
    const latestNotifications = React.useMemo(() => {
        if (!notifications) return [];
        const { locates = [], workOrders = [] } = notifications;
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        const allNotifications = [];

        // Locates - Include both seen and unseen
        locates.forEach((locate) => {
            const createdAt = locate.created_at;
            if (!createdAt) return;
            const createdDate = new Date(createdAt);
            if (createdDate >= oneMonthAgo) {
                const addr = parseDashboardAddress(locate.customer_address || '');
                allNotifications.push({
                    id: `locate-${locate.id}`,
                    type: 'locate',
                    title: 'Locate Request',
                    description: `Locate request for ${addr.street || 'unknown address'}`,
                    address: addr.original || 'Unknown address',
                    workOrderNumber: locate.work_order_number || 'N/A',
                    customerName: locate.customer_name || 'Unknown',
                    timestamp: createdDate,
                    formattedTime: formatDate(createdAt),
                    icon: MapPin,
                    color: NOTIFICATION_COLORS.primary,
                    rawData: locate,
                    entityId: locate.id,
                    is_seen: locate.is_seen || false
                });
            }
        });

        // Work Orders (RME) - Include both seen and unseen
        workOrders.forEach((workOrder) => {
            const elapsedTime = workOrder.elapsed_time;
            if (!elapsedTime) return;
            const elapsedDate = new Date(elapsedTime);
            if (elapsedDate >= oneMonthAgo) {
                const addr = parseDashboardAddress(workOrder.full_address || '');
                allNotifications.push({
                    id: `rme-${workOrder.id}`,
                    type: 'RME',
                    title: 'RME Added',
                    description: `RME created for ${addr.street || 'unknown address'}`,
                    address: addr.original || 'Unknown address',
                    rmeNumber: workOrder.wo_number || workOrder.id || 'N/A',
                    customerName: workOrder.customer_name || 'Unknown',
                    timestamp: elapsedDate,
                    formattedTime: formatDate(elapsedTime),
                    icon: Wrench,
                    color: NOTIFICATION_COLORS.success,
                    rawData: workOrder,
                    entityId: workOrder.id,
                    is_seen: workOrder.is_seen || false
                });
            }
        });

        // Sort by newest first and take only latest 10 (both seen and unseen)
        return allNotifications
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 10);
    }, [notifications]);

    // Get total count for badge display (only unseen)
    const totalNotificationCount = React.useMemo(() => {
        if (!notifications) return 0;
        const { locates = [], workOrders = [] } = notifications;
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        let count = 0;

        // Count only unseen locates
        locates.forEach((locate) => {
            const createdAt = locate.created_at || locate.created_date;
            if (!createdAt || locate.is_seen) return;
            const createdDate = new Date(createdAt);
            if (createdDate >= oneMonthAgo) count++;
        });

        // Count only unseen work orders
        workOrders.forEach((workOrder) => {
            const elapsedTime = workOrder.elapsed_time;
            if (!elapsedTime || workOrder.is_seen) return;
            const elapsedDate = new Date(elapsedTime);
            if (elapsedDate >= oneMonthAgo) count++;
        });

        return count;
    }, [notifications]);

    const groupedNotifications = React.useMemo(() => {
        const groups = {};
        latestNotifications.forEach((n) => {
            const dateKey = formatGroupDate(n.timestamp);
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(n);
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

    const handleMarkAllSeen = () => {
        // Filter only unseen notifications to mark as seen
        const unseenNotifications = latestNotifications.filter(n => !n.is_seen);
        if (unseenNotifications.length) {
            markAllAsSeenMutation.mutate(unseenNotifications);
        }
    };

    const handleSingleSeen = (notification, e) => {
        e.stopPropagation();
        // Only mark as seen if it's currently unseen
        if (!notification.is_seen) {
            markAsSeenMutation.mutate(notification);
        }
    };

    const handleNotificationClick = (notification) => {
        // Mark as seen if not already seen
        if (!notification.is_seen) {
            markAsSeenMutation.mutate(notification);
        }

        // Get the base dashboard path
        const dashboardBasePath = getDashboardBasePath();
        onClose();

        // Redirect based on notification type
        if (notification.type === 'locate') {
            navigate(`${dashboardBasePath}/locates`, { 
                state: { 
                    highlightLocateId: notification.entityId,
                    fromNotifications: true
                }
            });
        } else if (notification.type === 'RME') {
            navigate(`${dashboardBasePath}/health-department-report-tracking/rme`, { 
                state: { 
                    highlightWorkOrderId: notification.entityId,
                    fromNotifications: true
                }
            });
        }
    };

    if (isLoading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '300px' }}>
            <CircularProgress size={32} />
        </Box>
    );

    if (error) return (
        <Box sx={{ p: 3 }}>
            <Alert severity="error" sx={{ mb: 2 }}>
                Error loading notifications: {error.message}
            </Alert>
            <Button
                onClick={() => queryClient.invalidateQueries(['notifications-data', user?.role])}
                variant="outlined"
                size="small"
                fullWidth
            >
                Retry
            </Button>
        </Box>
    );

    return (
        <Box sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: NOTIFICATION_COLORS.bg,
            color: NOTIFICATION_COLORS.textPrimary
        }}>
            {/* Header */}
            <Box sx={{
                p: 2,
                borderBottom: `1px solid ${NOTIFICATION_COLORS.borderLight}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: alpha(NOTIFICATION_COLORS.primary, 0.1),
                        color: NOTIFICATION_COLORS.primary
                    }}>
                        <Bell size={20} />
                    </Box>
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: NOTIFICATION_COLORS.textPrimary, fontSize: '0.85rem' }}>
                            Recent Notifications
                        </Typography>
                        {totalNotificationCount > 0 && (
                            <Typography variant="caption" sx={{
                                color: NOTIFICATION_COLORS.textSecondary,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5
                            }}>
                                <Box sx={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    backgroundColor: NOTIFICATION_COLORS.primary
                                }} />
                                {totalNotificationCount} new
                            </Typography>
                        )}
                        <Typography variant="caption" sx={{
                            color: NOTIFICATION_COLORS.textTertiary,
                            display: 'block',
                            fontSize: '0.7rem',
                            mt: 0.25
                        }}>
                            Showing 10 most recent
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    {totalNotificationCount > 0 && (
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Check size={14} />}
                            onClick={handleMarkAllSeen}
                            disabled={markAllAsSeenMutation.isLoading}
                            sx={{
                                textTransform: 'none',
                                fontSize: '0.75rem',
                                color: GREEN_COLOR,
                                borderColor: alpha(GREEN_COLOR, 0.3),
                                '&:hover': {
                                    borderColor: GREEN_COLOR,
                                    backgroundColor: alpha(GREEN_COLOR, 0.05),
                                },
                                '&.Mui-disabled': {
                                    color: alpha(GREEN_COLOR, 0.5),
                                    borderColor: alpha(GREEN_COLOR, 0.2),
                                }
                            }}
                        >
                            Mark all read
                        </Button>
                    )}
                    <IconButton
                        onClick={onClose}
                        size="small"
                        sx={{
                            color: NOTIFICATION_COLORS.textSecondary,
                            '&:hover': {
                                backgroundColor: alpha(NOTIFICATION_COLORS.gray, 0.1)
                            }
                        }}
                    >
                        <X size={18} />
                    </IconButton>
                </Box>
            </Box>

            {/* Notifications List */}
            <NotificationScrollableBox sx={{ backgroundColor: NOTIFICATION_COLORS.bg }}>
                {latestNotifications.length === 0 ? (
                    <Box sx={{
                        textAlign: 'center',
                        py: 8,
                        px: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Bell size={48} color={alpha(NOTIFICATION_COLORS.gray, 0.3)} />
                        <Typography variant="body1" sx={{
                            mt: 2,
                            color: NOTIFICATION_COLORS.textSecondary,
                            fontWeight: 600
                        }}>
                            No notifications
                        </Typography>
                        <Typography variant="caption" sx={{
                            color: NOTIFICATION_COLORS.textTertiary,
                            mt: 1,
                            display: 'block',
                            maxWidth: '80%'
                        }}>
                            No locates or RMEs found in the last 30 days.
                        </Typography>
                    </Box>
                ) : (
                    Object.entries(groupedNotifications).map(([date, dateNotifications]) => (
                        <Box key={date}>
                            <Box sx={{
                                p: 1,
                                bgcolor: NOTIFICATION_COLORS.grayLight,
                                borderBottom: `1px solid ${alpha(NOTIFICATION_COLORS.gray, 0.1)}`,
                                position: 'sticky',
                                top: 0,
                                zIndex: 1
                            }}>
                                <Typography variant="caption" sx={{
                                    color: NOTIFICATION_COLORS.textSecondary,
                                    fontWeight: 600,
                                    fontSize: '0.65rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    {date}
                                </Typography>
                            </Box>
                            <List disablePadding>
                                {dateNotifications.map((notification, index) => {
                                    const Icon = notification.icon;
                                    const isLast = index === dateNotifications.length - 1;
                                    return (
                                        <React.Fragment key={notification.id}>
                                            <ListItem
                                                onClick={() => handleNotificationClick(notification)}
                                                sx={{
                                                    p: 2,
                                                    backgroundColor: notification.is_seen 
                                                        ? NOTIFICATION_COLORS.bg 
                                                        : alpha(notification.color, 0.03),
                                                    cursor: 'pointer',
                                                    '&:hover': {
                                                        bgcolor: alpha(notification.color, notification.is_seen ? 0.03 : 0.06)
                                                    },
                                                    transition: 'background-color 0.2s ease',
                                                    position: 'relative'
                                                }}
                                            >
                                                <ListItemIcon sx={{ minWidth: 44 }}>
                                                    <Box sx={{
                                                        width: 36,
                                                        height: 36,
                                                        borderRadius: '8px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        backgroundColor: alpha(notification.color, 0.1),
                                                        color: notification.color
                                                    }}>
                                                        <Icon size={16} />
                                                    </Box>
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={
                                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.5 }}>
                                                            <Typography variant="body2" sx={{
                                                                color: notification.is_seen 
                                                                    ? NOTIFICATION_COLORS.textSecondary 
                                                                    : NOTIFICATION_COLORS.textPrimary,
                                                                fontWeight: notification.is_seen ? 500 : 600,
                                                                fontSize: '0.75rem',
                                                                lineHeight: 1.3
                                                            }}>
                                                                {notification.description}
                                                            </Typography>
                                                            <Chip
                                                                label={notification.type === 'locate' ? 'Locate' : 'RME'}
                                                                size="small"
                                                                sx={{
                                                                    height: '20px',
                                                                    fontSize: '0.65rem',
                                                                    fontWeight: 600,
                                                                    backgroundColor: alpha(notification.color, 0.1),
                                                                    color: notification.color,
                                                                    border: `1px solid ${alpha(notification.color, 0.2)}`
                                                                }}
                                                            />
                                                        </Box>
                                                    }
                                                    secondary={
                                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                                                            <Typography variant="caption" sx={{
                                                                color: notification.is_seen 
                                                                    ? NOTIFICATION_COLORS.textTertiary 
                                                                    : NOTIFICATION_COLORS.textSecondary,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 0.5,
                                                                fontSize: '0.75rem'
                                                            }}>
                                                                <Clock size={12} />
                                                                {notification.type === 'locate' ? `WO: ${notification.workOrderNumber}` : `WO: ${notification.rmeNumber}`}
                                                                <Box sx={{ mx: 0.5 }}>•</Box>
                                                                {notification.formattedTime}
                                                            </Typography>
                                                        </Box>
                                                    }
                                                    sx={{ m: 0 }}
                                                />
                                                {!notification.is_seen && (
                                                    <Box sx={{
                                                        width: 8,
                                                        height: 8,
                                                        borderRadius: '50%',
                                                        backgroundColor: notification.color,
                                                        ml: 1,
                                                        flexShrink: 0
                                                    }} />
                                                )}
                                                {!notification.is_seen && (
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => handleSingleSeen(notification, e)}
                                                        disabled={markAsSeenMutation.isLoading}
                                                        sx={{
                                                            ml: 1,
                                                            color: NOTIFICATION_COLORS.textTertiary,
                                                            '&:hover': {
                                                                color: NOTIFICATION_COLORS.textPrimary,
                                                                backgroundColor: alpha(NOTIFICATION_COLORS.gray, 0.1)
                                                            },
                                                            '&.Mui-disabled': {
                                                                color: alpha(NOTIFICATION_COLORS.textTertiary, 0.5),
                                                            }
                                                        }}
                                                    >
                                                        <X size={14} />
                                                    </IconButton>
                                                )}
                                            </ListItem>
                                            {!isLast && (
                                                <Divider
                                                    sx={{
                                                        mx: 2,
                                                        borderColor: alpha(NOTIFICATION_COLORS.borderLight, 0.5)
                                                    }}
                                                />
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </List>
                        </Box>
                    ))
                )}
            </NotificationScrollableBox>

            {/* Footer */}
            <Box sx={{
                p: 2,
                borderTop: `1px solid ${NOTIFICATION_COLORS.borderLight}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
                flexShrink: 0,
                backgroundColor: NOTIFICATION_COLORS.grayLight
            }}>
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
            </Box>
        </Box>
    );
};

export default NotificationDrawer;