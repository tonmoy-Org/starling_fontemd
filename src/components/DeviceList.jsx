import React from 'react';
import {
    Box,
    Paper,
    Typography,
    Chip,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider,
    alpha,
    Tooltip,
} from '@mui/material';

// Import Lucide React icons
import {
    Smartphone,
    Laptop,
    Tablet,
    Monitor,
    CheckCircle,
    Clock,
    Globe,
    Cpu,
    ChevronRight,
} from 'lucide-react';

// Define color constants (same as previous component)
const TEXT_COLOR = '#0F1115';
const BLUE_LIGHT = '#A8C9E9';
const BLUE_COLOR = '#1976d2';
const BLUE_DARK = '#1565c0';
const RED_COLOR = '#ef4444';
const RED_DARK = '#dc2626';
const GREEN_COLOR = '#10b981';
const GREEN_DARK = '#059669';
const GRAY_COLOR = '#6b7280';
const GRAY_LIGHT = '#f3f4f6';
const PURPLE_COLOR = '#8b5cf6';
const ORANGE_COLOR = '#f97316';

const DeviceList = ({ devices = [], title = "Active Devices", subtitle = "View and manage active devices" }) => {
    const getDeviceIcon = (deviceType) => {
        const type = deviceType?.toLowerCase();
        if (type === 'mobile' || type === 'phone') {
            return <Smartphone size={18} color={BLUE_COLOR} />;
        } else if (type === 'tablet') {
            return <Tablet size={18} color={PURPLE_COLOR} />;
        } else if (type === 'laptop' || type === 'notebook') {
            return <Laptop size={18} color={ORANGE_COLOR} />;
        } else {
            return <Monitor size={18} color={GREEN_DARK} />;
        }
    };

    const getDeviceColor = (deviceType) => {
        const type = deviceType?.toLowerCase();
        if (type === 'mobile' || type === 'phone') return BLUE_COLOR;
        if (type === 'tablet') return PURPLE_COLOR;
        if (type === 'laptop' || type === 'notebook') return ORANGE_COLOR;
        return GREEN_DARK;
    };

    const formatDate = (date) => {
        if (!date) return 'Unknown';

        const now = new Date();
        const lastActive = new Date(date);
        const diffInHours = Math.floor((now - lastActive) / (1000 * 60 * 60));

        if (diffInHours < 1) {
            return 'Just now';
        } else if (diffInHours < 24) {
            return `${diffInHours}h ago`;
        } else if (diffInHours < 168) { // 7 days
            const days = Math.floor(diffInHours / 24);
            return `${days}d ago`;
        } else {
            return lastActive.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            });
        }
    };

    const formatFullDate = (date) => {
        if (!date) return 'Unknown date';
        return new Date(date).toLocaleString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getBrowserIcon = (browser) => {
        const browserName = browser?.toLowerCase();
        if (browserName?.includes('chrome')) return '🟡';
        if (browserName?.includes('firefox')) return '🟠';
        if (browserName?.includes('safari')) return '🔵';
        if (browserName?.includes('edge')) return '🔷';
        return '🌐';
    };

    if (!devices || devices.length === 0) {
        return (
            <>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
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
                            {title}
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{
                                color: GRAY_COLOR,
                                fontSize: '0.8rem',
                                fontWeight: 400,
                            }}
                        >
                            {subtitle}
                        </Typography>
                    </Box>
                </Box>

                <Paper
                    elevation={0}
                    sx={{
                        p: 4,
                        borderRadius: '6px',
                        border: `1px solid ${alpha(BLUE_COLOR, 0.15)}`,
                        bgcolor: 'white',
                        textAlign: 'center',
                    }}
                >
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 2,
                    }}>
                        <Box sx={{
                            width: 64,
                            height: 64,
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: `linear-gradient(135deg, ${alpha(BLUE_LIGHT, 0.2)} 0%, ${alpha(BLUE_COLOR, 0.1)} 100%)`,
                            border: `1px solid ${alpha(BLUE_COLOR, 0.2)}`,
                        }}>
                            <Laptop size={32} color={alpha(TEXT_COLOR, 0.3)} />
                        </Box>
                        <Box>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: TEXT_COLOR,
                                    fontSize: '0.9rem',
                                    fontWeight: 600,
                                    mb: 0.5,
                                }}
                            >
                                No active devices
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: GRAY_COLOR,
                                    fontSize: '0.8rem',
                                    fontWeight: 400,
                                }}
                            >
                                No devices are currently connected to this account.
                            </Typography>
                        </Box>
                    </Box>
                </Paper>
            </>
        );
    }

    // Sort devices by last active date (most recent first)
    const sortedDevices = [...devices].sort((a, b) => {
        const dateA = new Date(a.lastActive || a.date || 0);
        const dateB = new Date(b.lastActive || b.date || 0);
        return dateB - dateA;
    });

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
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
                        {title}
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            color: GRAY_COLOR,
                            fontSize: '0.8rem',
                            fontWeight: 400,
                        }}
                    >
                        {subtitle}
                    </Typography>
                </Box>
            </Box>

            <Paper
                elevation={0}
                sx={{
                    borderRadius: '6px',
                    overflow: 'hidden',
                    border: `1px solid ${alpha(BLUE_COLOR, 0.15)}`,
                    bgcolor: 'white'
                }}
            >
                {/* Header Section */}
                <Box
                    sx={{
                        p: 1.5,
                        bgcolor: 'white',
                        borderBottom: `1px solid ${alpha(BLUE_COLOR, 0.1)}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Laptop size={18} color={BLUE_COLOR} />
                            <Typography
                                sx={{
                                    fontSize: '0.9rem',
                                    color: TEXT_COLOR,
                                    fontWeight: 600,
                                }}
                            >
                                Active Devices
                            </Typography>
                        </Box>
                        <Chip
                            size="small"
                            label={sortedDevices.length}
                            sx={{
                                bgcolor: alpha(BLUE_COLOR, 0.08),
                                color: TEXT_COLOR,
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                height: '22px',
                                '& .MuiChip-label': {
                                    px: 1,
                                },
                            }}
                        />
                    </Box>
                </Box>

                <List sx={{ p: 0 }}>
                    {sortedDevices.map((device, index) => {
                        const deviceColor = getDeviceColor(device.deviceType);
                        const isCurrentDevice = index === 0; // First device is most recent/current

                        return (
                            <React.Fragment key={device.deviceId || device.id || index}>
                                <ListItem
                                    sx={{
                                        px: 2.5,
                                        py: 1.5,
                                        bgcolor: 'white',
                                        '&:hover': {
                                            backgroundColor: alpha(BLUE_COLOR, 0.02),
                                        },
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 40 }}>
                                        {getDeviceIcon(device.deviceType)}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        color: TEXT_COLOR,
                                                        fontSize: '0.85rem',
                                                        fontWeight: 600,
                                                        lineHeight: 1.2,
                                                    }}
                                                >
                                                    {device.deviceType || 'Desktop'}
                                                    {device.deviceModel && ` • ${device.deviceModel}`}
                                                </Typography>
                                                {isCurrentDevice && (
                                                    <Chip
                                                        icon={<CheckCircle size={12} />}
                                                        label="Current"
                                                        size="small"
                                                        sx={{
                                                            height: '22px',
                                                            bgcolor: alpha(GREEN_COLOR, 0.08),
                                                            color: GREEN_DARK,
                                                            border: `1px solid ${alpha(GREEN_COLOR, 0.3)}`,
                                                            fontSize: '0.75rem',
                                                            fontWeight: 500,
                                                            '& .MuiChip-icon': {
                                                                color: GREEN_DARK,
                                                                marginLeft: '6px',
                                                            },
                                                            '& .MuiChip-label': {
                                                                px: 1,
                                                                fontSize: '0.75rem',
                                                            },
                                                        }}
                                                    />
                                                )}
                                            </Box>
                                        }
                                        secondary={
                                            <Box sx={{ mt: 0.5 }}>
                                                {/* Browser and OS Info */}
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
                                                    {device.browser && (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <Globe size={12} color={GRAY_COLOR} />
                                                            <Typography
                                                                variant="caption"
                                                                sx={{
                                                                    color: TEXT_COLOR,
                                                                    fontSize: '0.75rem',
                                                                    fontWeight: 400,
                                                                }}
                                                            >
                                                                {device.browser} {device.browserVersion && `v${device.browserVersion}`}
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                    {device.os && (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <Cpu size={12} color={GRAY_COLOR} />
                                                            <Typography
                                                                variant="caption"
                                                                sx={{
                                                                    color: TEXT_COLOR,
                                                                    fontSize: '0.75rem',
                                                                    fontWeight: 400,
                                                                }}
                                                            >
                                                                {device.os} {device.osVersion && `v${device.osVersion}`}
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                </Box>

                                                {/* Last Active Info */}
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <Clock size={12} color={GRAY_COLOR} />
                                                    <Tooltip title={formatFullDate(device.date)} arrow>
                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                color: TEXT_COLOR,
                                                                fontSize: '0.75rem',
                                                                fontWeight: 400,
                                                                opacity: 0.8,
                                                                cursor: 'help',
                                                            }}
                                                        >
                                                            Last active {formatDate(device.date)}
                                                        </Typography>
                                                    </Tooltip>
                                                </Box>

                                                {/* IP Address (if available) */}
                                                {device.ipAddress && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                color: GRAY_COLOR,
                                                                fontSize: '0.7rem',
                                                                fontWeight: 400,
                                                                fontFamily: 'monospace',
                                                            }}
                                                        >
                                                            IP: {device.ipAddress}
                                                        </Typography>
                                                    </Box>
                                                )}

                                                {/* Location (if available) */}
                                                {device.location && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                color: GRAY_COLOR,
                                                                fontSize: '0.7rem',
                                                                fontWeight: 400,
                                                            }}
                                                        >
                                                            📍 {device.location}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Box>
                                        }
                                    />
                                    <ChevronRight size={16} color={GRAY_COLOR} />
                                </ListItem>
                                {index < sortedDevices.length - 1 && (
                                    <Divider
                                        component="li"
                                        sx={{
                                            backgroundColor: alpha(TEXT_COLOR, 0.08),
                                            margin: '0 16px',
                                            width: 'calc(100% - 32px)',
                                        }}
                                    />
                                )}
                            </React.Fragment>
                        );
                    })}
                </List>

                {/* Footer with device summary */}
                <Box sx={{
                    px: 2,
                    py: 1.5,
                    borderTop: `1px solid ${alpha(TEXT_COLOR, 0.08)}`,
                    backgroundColor: alpha(BLUE_COLOR, 0.02),
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                }}>
                    <Typography
                        variant="body2"
                        sx={{
                            color: GRAY_COLOR,
                            fontSize: '0.8rem',
                            fontWeight: 400,
                        }}
                    >
                        Showing {sortedDevices.length} active device{sortedDevices.length !== 1 ? 's' : ''}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
                        {sortedDevices.some(d => d.deviceType?.toLowerCase().includes('mobile')) && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Smartphone size={14} color={BLUE_COLOR} />
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: TEXT_COLOR,
                                        fontSize: '0.75rem',
                                        fontWeight: 400,
                                    }}
                                >
                                    {sortedDevices.filter(d => d.deviceType?.toLowerCase().includes('mobile')).length}
                                </Typography>
                            </Box>
                        )}
                        {sortedDevices.some(d => d.deviceType?.toLowerCase().includes('laptop')) && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Laptop size={14} color={ORANGE_COLOR} />
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: TEXT_COLOR,
                                        fontSize: '0.75rem',
                                        fontWeight: 400,
                                    }}
                                >
                                    {sortedDevices.filter(d => d.deviceType?.toLowerCase().includes('laptop')).length}
                                </Typography>
                            </Box>
                        )}
                        {sortedDevices.some(d => !d.deviceType?.toLowerCase().match(/mobile|laptop|tablet|phone/)) && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Monitor size={14} color={GREEN_DARK} />
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: TEXT_COLOR,
                                        fontSize: '0.75rem',
                                        fontWeight: 400,
                                    }}
                                >
                                    {sortedDevices.filter(d => !d.deviceType?.toLowerCase().match(/mobile|laptop|tablet|phone/)).length}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
};

// Optional: Add prop types for better development experience
DeviceList.defaultProps = {
    devices: [],
    title: "Active Devices",
    subtitle: "View and manage active devices"
};

export default DeviceList;