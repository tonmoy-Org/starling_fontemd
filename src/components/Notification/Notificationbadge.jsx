import React from 'react';
import { Badge, IconButton, Box, Tooltip } from '@mui/material';
import { Bell } from 'lucide-react';
import { useNotifications } from '../../hook/useNotifications';

const NotificationBadge = ({ onClick }) => {
    const { badgeCount } = useNotifications();

    return (
        <Tooltip title={`${badgeCount} notifications`} arrow>
            <IconButton
                onClick={onClick}
                aria-label={`${badgeCount} notifications`}
                sx={{
                    color: '#2d3748',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '5px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    },
                }}
            >
                <Badge
                    badgeContent={badgeCount}
                    color="error"
                    overlap="circular"
                    sx={{
                        '& .MuiBadge-badge': {
                            fontSize: '0.55rem',
                            height: '18px',
                            minWidth: '18px',
                            backgroundColor: badgeCount > 5 ? '#ef4444' : '#ed6c02',
                        },
                    }}
                >
                    <Bell size={22} />
                </Badge>
            </IconButton>
        </Tooltip>
    );
};

export default NotificationBadge;