import React from 'react';
import { alpha } from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';
import {
    User,
    ShieldCheck,
    Briefcase,
    UserCog,
    Mail,
    Shield,
    Calendar,
    Edit,
    X,
} from 'lucide-react';

const colors = {
    primary: '#3182ce',
    primaryLight: '#ebf8ff',
    primaryDark: '#2c5282',
    activeBg: '#ebf8ff',
    activeText: '#3182ce',
    activeBorder: '#3182ce',
    drawerBg: '#ffffff',
    textPrimary: '#2d3748',
    textSecondary: '#718096',
    textTertiary: '#a0aec0',
    borderLight: '#e2e8f0',
    hoverBg: '#f7fafc',
    white: '#ffffff',
    black: '#000000',
};

const ProfileDialog = ({ open, onClose, user, userRole }) => {
    const navigate = useNavigate();

    if (!user) return null;

    const getDashboardBasePath = () => {
        switch (userRole?.toUpperCase()) {
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

    const getRoleColor = (role) => {
        switch (role?.toUpperCase()) {
            case 'SUPERADMIN':
            case 'SUPER-ADMIN':
                return '#dc2626';
            case 'MANAGER':
                return '#059669';
            case 'TECH':
                return '#2563eb';
            default:
                return '#6b7280';
        }
    };

    const getRoleLabel = (role) => {
        switch (role?.toUpperCase()) {
            case 'SUPERADMIN':
            case 'SUPER-ADMIN':
                return 'Super Admin';
            case 'MANAGER':
                return 'Manager';
            case 'TECH':
                return 'Technician';
            default:
                return 'User';
        }
    };

    const getRoleIcon = (role) => {
        switch (role?.toUpperCase()) {
            case 'SUPERADMIN':
            case 'SUPER-ADMIN':
                return <ShieldCheck size={18} />;
            case 'MANAGER':
                return <Briefcase size={18} />;
            case 'TECH':
                return <UserCog size={18} />;
            default:
                return <User size={18} />;
        }
    };

    const handleEditProfile = () => {
        const basePath = getDashboardBasePath();
        onClose();
        navigate(`${basePath}/profile`);
    };

    const getInitials = (name) =>
        name?.split(' ').map((n) => n[0]).join('').toUpperCase() || 'U';

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    bgcolor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid rgba(0,0,0,0.08)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                }
            }}
        >
            <DialogTitle sx={{
                borderBottom: '1px solid rgba(0,0,0,0.06)',
                pb: 2,
                position: 'relative',
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: alpha(colors.primary, 0.1),
                            color: colors.primary,
                        }}>
                            <User size={20} />
                        </Box>
                        <Box>
                            <Typography variant="h6" sx={{
                                color: colors.textPrimary,
                                fontSize: '1rem',
                                fontWeight: 600,
                                lineHeight: 1.2,
                            }}>
                                User Profile
                            </Typography>
                            <Typography variant="caption" sx={{
                                color: colors.textSecondary,
                                fontSize: '0.75rem',
                                fontWeight: 400,
                            }}>
                                View and manage your profile information
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton
                        onClick={onClose}
                        size="small"
                        sx={{
                            color: colors.textSecondary,
                            '&:hover': {
                                backgroundColor: alpha(colors.textSecondary, 0.1),
                                color: colors.textPrimary,
                            },
                        }}
                    >
                        <X size={18} />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ pt: 3, pb: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ position: 'relative', mb: 0 }}>
                        <Avatar
                            sx={{
                                width: 100,
                                height: 100,
                                bgcolor: colors.primary,
                                color: colors.white,
                                fontSize: '2rem',
                                fontWeight: 600,
                                border: '4px solid #ffffff',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            }}
                        >
                            {getInitials(user?.name)}
                        </Avatar>
                    </Box>

                    <Typography variant="h5" sx={{
                        color: colors.textPrimary,
                        fontSize: '1.25rem',
                        fontWeight: 600,
                        mb: 0.5,
                        textAlign: 'center',
                    }}>
                        {user?.name || 'Jenny Wilson'}
                    </Typography>

                    <Chip
                        icon={getRoleIcon(userRole)}
                        label={getRoleLabel(userRole)}
                        sx={{
                            backgroundColor: alpha(getRoleColor(userRole), 0.1),
                            color: getRoleColor(userRole),
                            border: `1px solid ${alpha(getRoleColor(userRole), 0.3)}`,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            height: '28px',
                            mb: 3,
                            '& .MuiChip-icon': {
                                color: getRoleColor(userRole),
                                marginLeft: '8px',
                            },
                        }}
                    />
                </Box>

                <Box sx={{
                    backgroundColor: colors.hoverBg,
                    borderRadius: '8px',
                    p: 2.5,
                    mb: 2,
                }}>
                    <Typography variant="subtitle2" sx={{
                        color: colors.textSecondary,
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        mb: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.75,
                    }}>
                        <User size={14} />
                        Personal Information
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box>
                            <Typography variant="caption" sx={{
                                color: colors.textTertiary,
                                fontSize: '0.7rem',
                                fontWeight: 500,
                                mb: 0.5,
                                display: 'block',
                            }}>
                                Email Address
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Mail size={14} color={colors.textTertiary} />
                                <Typography variant="body2" sx={{
                                    color: colors.textPrimary,
                                    fontSize: '0.85rem',
                                    fontWeight: 500,
                                    wordBreak: 'break-word',
                                }}>
                                    {user?.email || 'jennywilson@gmail.com'}
                                </Typography>
                            </Box>
                        </Box>

                        <Box>
                            <Typography variant="caption" sx={{
                                color: colors.textTertiary,
                                fontSize: '0.7rem',
                                fontWeight: 500,
                                mb: 0.5,
                                display: 'block',
                            }}>
                                Account Role
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Shield size={14} color={colors.textTertiary} />
                                <Typography variant="body2" sx={{
                                    color: colors.textPrimary,
                                    fontSize: '0.85rem',
                                    fontWeight: 500,
                                }}>
                                    {getRoleLabel(userRole)}
                                </Typography>
                            </Box>
                        </Box>

                        <Box>
                            <Typography variant="caption" sx={{
                                color: colors.textTertiary,
                                fontSize: '0.7rem',
                                fontWeight: 500,
                                mb: 0.5,
                                display: 'block',
                            }}>
                                Member Since
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Calendar size={14} color={colors.textTertiary} />
                                <Typography variant="body2" sx={{
                                    color: colors.textPrimary,
                                    fontSize: '0.85rem',
                                    fontWeight: 500,
                                }}>
                                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    }) : 'January 2024'}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </DialogContent>

            <DialogActions sx={{
                p: 2.5,
                pt: 2,
                borderTop: '1px solid rgba(0,0,0,0.06)',
                justifyContent: 'space-between',
            }}>
                <Button
                    onClick={handleEditProfile}
                    variant="outlined"
                    startIcon={<Edit size={16} />}
                    sx={{
                        textTransform: 'none',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        color: colors.primary,
                        borderColor: colors.borderLight,
                        '&:hover': {
                            borderColor: colors.primary,
                            backgroundColor: alpha(colors.primary, 0.04),
                        },
                    }}
                >
                    Edit Profile
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ProfileDialog;