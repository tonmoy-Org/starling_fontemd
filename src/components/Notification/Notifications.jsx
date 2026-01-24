import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Badge,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
  Stack,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../api/axios';
import {
  Bell,
  MapPin,
  Wrench,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle,
  X,
  TrendingUp,
} from 'lucide-react';

const TEXT_COLOR = '#0F1115';
const BLUE_COLOR = '#1976d2';
const GREEN_COLOR = '#10b981';
const RED_COLOR = '#ef4444';
const ORANGE_COLOR = '#ed6c02';
const GRAY_COLOR = '#6b7280';
const PURPLE_COLOR = '#8b5cf6';

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

export default function Notifications() {
  // Fetch combined data in a single query
  const { data: combinedData, isLoading, error } = useQuery({
    queryKey: ['notifications-data'],
    queryFn: async () => {
      try {
        // Fetch both data sources in parallel
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
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });

  // Process and combine notifications
  const notifications = useMemo(() => {
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
          color: BLUE_COLOR,
          rawData: locate,
        });
      }
    });

    // Process work orders data (now RME)
    workOrders.forEach((workOrder) => {
      const elapsedTime = workOrder.elapsed_time;
      if (!elapsedTime) return;

      try {
        // Parse elapsed_time to get the date
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
            color: GREEN_COLOR,
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

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    const groups = {};

    notifications.forEach((notification) => {
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
  }, [notifications]);

  // Get counts by type
  const counts = useMemo(() => {
    const locateCount = notifications.filter(n => n.type === 'locate').length;
    const rmeCount = notifications.filter(n => n.type === 'RME').length;

    return {
      total: notifications.length,
      locateCount,
      rmeCount,
    };
  }, [notifications]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Error loading notifications: {error.message}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Box>
            <Typography
              sx={{
                fontWeight: 600,
                mb: 0.5,
                fontSize: '0.95rem',
                color: TEXT_COLOR,
                letterSpacing: '-0.01em',
              }}
            >
              Notifications
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: GRAY_COLOR,
                fontSize: '0.8rem',
                fontWeight: 400,
              }}
            >
              Last 30 days activity
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Bell size={48} color={alpha(GRAY_COLOR, 0.3)} />
          <Typography variant="h6" sx={{ mt: 2, color: GRAY_COLOR, fontWeight: 500 }}>
            No recent activity
          </Typography>
          <Typography variant="body2" sx={{ color: GRAY_COLOR, mt: 1 }}>
            No new locates or RME in the last 30 days
          </Typography>
        </Box>
      ) : (
        <Paper
          elevation={0}
          sx={{
            borderRadius: '8px',
            border: `1px solid ${alpha(GRAY_COLOR, 0.1)}`,
            overflow: 'hidden',
          }}
        >
          {Object.entries(groupedNotifications).map(([date, dateNotifications]) => (
            <Box key={date}>
              {/* Date Header */}
              <Box sx={{
                p: 2,
                bgcolor: alpha(GRAY_COLOR, 0.03),
                borderBottom: `1px solid ${alpha(GRAY_COLOR, 0.1)}`,
              }}>
                <Typography variant="subtitle2" sx={{ color: GRAY_COLOR, fontWeight: 600 }}>
                  {date}
                </Typography>
              </Box>

              {/* Notifications for this date */}
              <List disablePadding>
                {dateNotifications.map((notification, index) => {
                  const Icon = notification.icon;
                  const isLast = index === dateNotifications.length - 1;

                  return (
                    <React.Fragment key={notification.id}>
                      <ListItem
                        sx={{
                          p: 2,
                          '&:hover': {
                            bgcolor: alpha(notification.color, 0.03),
                          },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <Box sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: alpha(notification.color, 0.1),
                            color: notification.color,
                          }}>
                            <Icon size={18} />
                          </Box>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography variant="subtitle2" sx={{ color: TEXT_COLOR, fontWeight: 600 }}>
                                {notification.description}
                              </Typography>
                              <Chip
                                label={notification.type === 'locate' ? 'Locate' : 'RME'}
                                size="small"
                                sx={{
                                  height: '20px',
                                  fontSize: '0.7rem',
                                  fontWeight: 500,
                                  backgroundColor: alpha(notification.color, 0.1),
                                  color: notification.color,
                                  border: `1px solid ${alpha(notification.color, 0.2)}`,
                                }}
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                <Typography variant="caption" sx={{ color: GRAY_COLOR, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <MapPin size={12} />
                                  {notification.address}
                                </Typography>
                                <Typography variant="caption" sx={{ color: GRAY_COLOR, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Clock size={12} />
                                  {notification.type === 'locate' ? 'WO' : 'WO'}: {notification.type === 'locate' ? notification.workOrderNumber : notification.rmeNumber}
                                </Typography>
                                <Typography variant="caption" sx={{ color: GRAY_COLOR, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Calendar size={12} />
                                  {notification.formattedTime}
                                </Typography>
                              </Box>
                            </Box>
                          }
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" sx={{ color: GRAY_COLOR, whiteSpace: 'nowrap' }}>
                            {notification.formattedTime.split(',')[1]?.trim()}
                          </Typography>
                        </Box>
                      </ListItem>
                      {!isLast && <Divider />}
                    </React.Fragment>
                  );
                })}
              </List>
            </Box>
          ))}
        </Paper>
      )}

      {/* Summary */}
      {notifications.length > 0 && (
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: GRAY_COLOR }}>
            Showing {notifications.length} notifications from the last 30 days
          </Typography>
        </Box>
      )}
    </Box>
  );
}

// Helper function for alpha colors (if not imported)
const alpha = (color, opacity) => {
  // Simple alpha function - you might want to use @mui/material's alpha function
  return color + Math.round(opacity * 255).toString(16).padStart(2, '0');
};