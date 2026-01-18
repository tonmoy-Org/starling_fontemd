import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Alert,
    Snackbar,
    CircularProgress,
    Avatar,
    Divider,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    LinearProgress,
    useTheme,
    useMediaQuery,
    alpha,
    IconButton,
    Button,
} from '@mui/material';
import axiosInstance from '../api/axios';
import { useAuth } from '../auth/AuthProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import StyledTextField from './ui/StyledTextField';
import GradientButton from './ui/GradientButton';
import OutlineButton from './ui/OutlineButton';
import DeviceList from './DeviceList';

// Import Lucide React icons
import {
    Edit,
    Save,
    X,
    Shield,
    Mail,
    User,
    Lock,
    Camera,
    Smartphone,
    Calendar,
    CheckCircle,
    AlertCircle,
    Eye,
    EyeOff,
    Key,
    RefreshCw,
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import DashboardLoader from './Loader/DashboardLoader';

// Define color constants
const TEXT_COLOR = '#0F1115';
const BLUE_LIGHT = '#A8C9E9';
const BLUE_COLOR = '#1976d2';
const BLUE_DARK = '#1565c0';
const RED_COLOR = '#ef4444';
const RED_DARK = '#dc2626';
const GREEN_COLOR = '#10b981';
const GRAY_COLOR = '#6b7280';

export const ProfilePage = ({ roleLabel }) => {
    const { user, updateUser } = useAuth();
    const queryClient = useQueryClient();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [passwordError, setPasswordError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
    });

    const {
        data: profile,
        isLoading,
        isError,
        error: fetchError
    } = useQuery({
        queryKey: ['userProfile', user?.id],
        queryFn: async () => {
            const response = await axiosInstance.get('/auth/me');
            const userData = response.data.user || response.data.data || response.data;
            return userData;
        },
        enabled: !!user?.id,
        retry: 1,
        staleTime: 5 * 60 * 1000,
    });
    console.log(profile);

    useEffect(() => {
        if (profile) {
            setFormData({
                name: profile.name || '',
                email: profile.email || '',
            });
        }
    }, [profile]);

    const updateProfileMutation = useMutation({
        mutationFn: async (formData) => {
            const response = await axiosInstance.put('/auth/profile', formData);
            return response.data.data || response.data;
        },
        onMutate: async (newData) => {
            await queryClient.cancelQueries({ queryKey: ['userProfile', user?.id] });
            const previousProfile = queryClient.getQueryData(['userProfile', user?.id]);

            const optimisticProfile = {
                ...previousProfile,
                ...newData,
                updatedAt: new Date().toISOString(),
            };

            queryClient.setQueryData(['userProfile', user?.id], optimisticProfile);
            setFormData(newData);

            if (updateUser) {
                updateUser(newData);
            }

            return { previousProfile };
        },
        onSuccess: (updatedData) => {
            setFormData({
                name: updatedData.name || '',
                email: updatedData.email || '',
            });

            if (updateUser) {
                updateUser(updatedData);
            }

            setIsEditing(false);
            setSuccess('Profile updated successfully!');
            setTimeout(() => setSuccess(''), 3000);
        },
        onError: (err, newData, context) => {
            if (context?.previousProfile) {
                queryClient.setQueryData(['userProfile', user?.id], context.previousProfile);
                setFormData({
                    name: context.previousProfile.name || '',
                    email: context.previousProfile.email || '',
                });

                if (updateUser) {
                    updateUser(context.previousProfile);
                }
            }

            setError(err.response?.data?.message || 'Failed to update profile. Please try again.');
            setTimeout(() => setError(''), 3000);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['userProfile', user?.id] });
        },
    });

    const changePasswordMutation = useMutation({
        mutationFn: async (passwordData) => {
            const response = await axiosInstance.put('/auth/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            });
            return response.data;
        },
        onSuccess: () => {
            setSuccess('Password changed successfully!');
            setOpenPasswordDialog(false);
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
            setTimeout(() => setSuccess(''), 3000);
        },
        onError: (err) => {
            setPasswordError(err.response?.data?.message || 'Failed to change password. Please check your current password.');
        },
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async () => {
        if (!formData.name?.trim()) {
            setError('Name is required');
            setTimeout(() => setError(''), 3000);
            return;
        }

        if (!formData.email?.trim()) {
            setError('Email is required');
            setTimeout(() => setError(''), 3000);
            return;
        }

        if (!/\S+@\S+\.\S+/.test(formData.email)) {
            setError('Please enter a valid email address');
            setTimeout(() => setError(''), 3000);
            return;
        }

        updateProfileMutation.mutate(formData);
    };

    const handleCancel = () => {
        setIsEditing(false);
        const currentProfile = queryClient.getQueryData(['userProfile', user?.id]);
        if (currentProfile) {
            setFormData({
                name: currentProfile.name || '',
                email: currentProfile.email || '',
            });
        } else if (profile) {
            setFormData({
                name: profile.name || '',
                email: profile.email || '',
            });
        }
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
        if (passwordError) {
            setPasswordError('');
        }
    };

    const handleChangePassword = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError('New passwords do not match');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setPasswordError('Password must be at least 6 characters');
            return;
        }

        changePasswordMutation.mutate(passwordData);
    };

    const handleClosePasswordDialog = () => {
        setOpenPasswordDialog(false);
        setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        });
        setPasswordError('');
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
    };

    const handleCloseSnackbar = () => {
        setSuccess('');
        setError('');
    };

    if (isLoading) {
        return (
            <DashboardLoader />
        );
    }

    if (isError) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                <Alert severity="error" sx={{
                    width: '100%',
                    maxWidth: 500,
                    borderRadius: '6px',
                    backgroundColor: alpha(RED_COLOR, 0.05),
                    borderLeft: `4px solid ${RED_COLOR}`,
                    '& .MuiAlert-icon': {
                        color: RED_COLOR,
                    },
                }}>
                    <Typography
                        variant="body1"
                        sx={{
                            color: TEXT_COLOR,
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            mb: 0.5,
                        }}
                        gutterBottom
                    >
                        Failed to load profile
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            color: GRAY_COLOR,
                            fontSize: '0.8rem',
                            fontWeight: 400,
                        }}
                    >
                        {fetchError?.message || 'Please try again later.'}
                    </Typography>
                </Alert>
            </Box>
        );
    }

    if (!profile && !isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                <Alert severity="warning" sx={{
                    width: '100%',
                    maxWidth: 500,
                    borderRadius: '6px',
                    backgroundColor: alpha('#f59e0b', 0.05),
                    borderLeft: `4px solid #f59e0b`,
                    '& .MuiAlert-icon': {
                        color: '#f59e0b',
                    },
                }}>
                    <Typography
                        variant="body1"
                        sx={{
                            color: TEXT_COLOR,
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            mb: 0.5,
                        }}
                        gutterBottom
                    >
                        Profile not found
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            color: GRAY_COLOR,
                            fontSize: '0.8rem',
                            fontWeight: 400,
                        }}
                    >
                        Unable to load profile data. Please refresh the page.
                    </Typography>
                </Alert>
            </Box>
        );
    }

    const updating = updateProfileMutation.isPending;

    return (
        <Box position="relative">
            <Helmet>
                <title>Profile | Sterling Septic & Plumbing LLC</title>
                <meta name="description" content="Profile page" />
            </Helmet>
            {(updateProfileMutation.isPending || changePasswordMutation.isPending) && (
                <LinearProgress
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        zIndex: 9999,
                        height: 2,
                        backgroundColor: alpha(BLUE_COLOR, 0.1),
                        '& .MuiLinearProgress-bar': {
                            backgroundColor: BLUE_COLOR,
                        },
                    }}
                />
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box>
                    <Typography sx={{
                        fontWeight: 600,
                        mb: 0.5,
                        fontSize: '0.95rem',
                        color: TEXT_COLOR,
                        letterSpacing: '-0.01em',
                    }}>
                        My Profile
                    </Typography>
                    <Typography variant="body2" sx={{
                        color: GRAY_COLOR,
                        fontSize: '0.8rem',
                        fontWeight: 400,
                    }}>
                        Manage your account settings and preferences
                    </Typography>
                </Box>
                {!isEditing ? (
                    <GradientButton
                        variant="contained"
                        startIcon={<Edit size={16} />}
                        onClick={() => setIsEditing(true)}
                        disabled={updating}
                        size="small"
                        sx={{
                            fontSize: '0.85rem',
                            height: '36px',
                            px: 2,
                        }}
                    >
                        Edit Profile
                    </GradientButton>
                ) : (
                    <Box display="flex" gap={1.5}>
                        <OutlineButton
                            startIcon={<X size={16} />}
                            onClick={handleCancel}
                            disabled={updating}
                            size="small"
                            sx={{
                                fontSize: '0.85rem',
                                height: '36px',
                                px: 2,
                            }}
                        >
                            Cancel
                        </OutlineButton>
                        <GradientButton
                            variant="contained"
                            startIcon={<Save size={16} />}
                            onClick={handleSave}
                            disabled={updating}
                            size="small"
                            sx={{
                                fontSize: '0.85rem',
                                height: '36px',
                                px: 2,
                            }}
                        >
                            {updating ? 'Saving...' : 'Save Changes'}
                        </GradientButton>
                    </Box>
                )}
            </Box>

            {updating && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: alpha('#ffffff', 0.7),
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1000,
                        borderRadius: '6px',
                    }}
                >
                    <CircularProgress
                        sx={{
                            color: BLUE_COLOR,
                            width: '32px !important',
                            height: '32px !important',
                        }}
                    />
                </Box>
            )}

            <Grid container spacing={2.5}>
                {/* Left Column - Personal Information */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2.5,
                            height: '100%',
                            borderRadius: '6px',
                            border: `1px solid ${alpha(TEXT_COLOR, 0.08)}`,
                            bgcolor: 'white'
                        }}
                    >
                        <Box display="flex" alignItems="center" mb={2.5}>
                            <Box sx={{
                                width: 32,
                                height: 32,
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: alpha(BLUE_COLOR, 0.1),
                                color: BLUE_COLOR,
                                mr: 1.5,
                            }}>
                                <User size={18} />
                            </Box>
                            <Typography
                                fontWeight="600"
                                sx={{
                                    color: TEXT_COLOR,
                                    fontSize: '0.9rem',
                                }}
                            >
                                Personal Information
                            </Typography>
                        </Box>

                        <Grid container spacing={2}>
                            {/* Name Field */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <StyledTextField
                                    fullWidth
                                    label="Full Name"
                                    name="name"
                                    value={formData.name || ''}
                                    onChange={handleInputChange}
                                    disabled={!isEditing || updating}
                                    error={!formData.name?.trim() && isEditing}
                                    helperText={!formData.name?.trim() && isEditing ? "Name is required" : ""}
                                    InputProps={{
                                        startAdornment: (
                                            <Box sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                mr: 1.5,
                                                color: GRAY_COLOR
                                            }}>
                                                <User size={16} />
                                            </Box>
                                        ),
                                        sx: { fontSize: '0.85rem' }
                                    }}
                                    sx={{
                                        '& .MuiFormLabel-root': {
                                            fontSize: '0.85rem',
                                        },
                                        '& .MuiFormHelperText-root': {
                                            fontSize: '0.75rem',
                                        },
                                        mb: 1.5,
                                    }}
                                    size="small"
                                />
                            </Grid>

                            {/* Email Field */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <StyledTextField
                                    fullWidth
                                    label="Email Address"
                                    name="email"
                                    type="email"
                                    value={formData.email || ''}
                                    onChange={handleInputChange}
                                    disabled={!isEditing || updating}
                                    error={(!/\S+@\S+\.\S+/.test(formData.email)) && isEditing && formData.email}
                                    helperText={(!/\S+@\S+\.\S+/.test(formData.email)) && isEditing && formData.email ? "Enter valid email" : ""}
                                    InputProps={{
                                        startAdornment: (
                                            <Box sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                mr: 1.5,
                                                color: GRAY_COLOR
                                            }}>
                                                <Mail size={16} />
                                            </Box>
                                        ),
                                        sx: { fontSize: '0.85rem' }
                                    }}
                                    sx={{
                                        '& .MuiFormLabel-root': {
                                            fontSize: '0.85rem',
                                        },
                                        '& .MuiFormHelperText-root': {
                                            fontSize: '0.75rem',
                                        },
                                        mb: 1.5,
                                    }}
                                    size="small"
                                />
                            </Grid>
                        </Grid>

                        <Divider sx={{
                            my: 3,
                            backgroundColor: alpha(TEXT_COLOR, 0.06),
                        }} />

                        {/* Device List */}
                        <Box mb={3}>
                            <Box display="flex" alignItems="center" mb={2}>
                                <Box sx={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: alpha(BLUE_COLOR, 0.1),
                                    color: BLUE_COLOR,
                                    mr: 1.5,
                                }}>
                                    <Smartphone size={18} />
                                </Box>
                                <Typography
                                    fontWeight="600"
                                    sx={{
                                        color: TEXT_COLOR,
                                        fontSize: '0.9rem',
                                    }}
                                >
                                    Active Devices
                                </Typography>
                            </Box>
                            <DeviceList devices={profile?.devices || []} />
                        </Box>

                        {profile?.createdAt && (
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                mt: 2,
                                pt: 2,
                                borderTop: `1px solid ${alpha(TEXT_COLOR, 0.06)}`,
                            }}>
                                <Calendar size={14} color={GRAY_COLOR} />
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: GRAY_COLOR,
                                        fontSize: '0.75rem',
                                        fontWeight: 400,
                                    }}
                                >
                                    Account created: {new Date(profile.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    })}
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>

                {/* Right Column - Profile Summary */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2.5,
                            height: '100%',
                            borderRadius: '6px',
                            border: `1px solid ${alpha(TEXT_COLOR, 0.08)}`,
                            bgcolor: 'white'
                        }}
                    >
                        <Box display="flex" flexDirection="column" alignItems="center">
                            {/* Profile Avatar */}
                            <Box sx={{ position: 'relative', mb: 2.5 }}>
                                <Avatar
                                    sx={{
                                        width: 100,
                                        height: 100,
                                        fontSize: '2rem',
                                        fontWeight: 600,
                                        bgcolor: BLUE_COLOR,
                                        color: '#ffffff',
                                        border: '4px solid #ffffff',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    }}
                                >
                                    {(formData.name?.charAt(0) || profile?.name?.charAt(0) || user?.name?.charAt(0) || 'U')?.toUpperCase()}
                                </Avatar>
                                {isEditing && (
                                    <IconButton
                                        sx={{
                                            position: 'absolute',
                                            bottom: 0,
                                            right: 0,
                                            backgroundColor: BLUE_COLOR,
                                            color: '#ffffff',
                                            width: 28,
                                            height: 28,
                                            border: '2px solid #ffffff',
                                            '&:hover': {
                                                backgroundColor: BLUE_DARK,
                                            },
                                        }}
                                        size="small"
                                    >
                                        <Camera size={14} />
                                    </IconButton>
                                )}
                            </Box>

                            {/* User Name */}
                            <Typography
                                variant="h6"
                                fontWeight="600"
                                align="center"
                                gutterBottom
                                sx={{
                                    color: TEXT_COLOR,
                                    fontSize: '1rem',
                                    mb: 0.5,
                                }}
                            >
                                {formData.name || profile?.name || user?.name || 'User'}
                            </Typography>
                            <Typography
                                variant="body2"
                                align="center"
                                mb={2.5}
                                sx={{
                                    color: GRAY_COLOR,
                                    fontSize: '0.85rem',
                                    fontWeight: 400,
                                }}
                            >
                                {formData.email || profile?.email || user?.email || ''}
                            </Typography>

                            {/* Role Badge */}
                            <Chip
                                icon={<Shield size={14} />}
                                label={roleLabel || (profile?.role || user?.role || 'USER').replace('_', ' ').toUpperCase()}
                                size="small"
                                sx={{
                                    mb: 3,
                                    fontWeight: 600,
                                    px: 1.5,
                                    py: 1,
                                    height: '28px',
                                    backgroundColor: alpha(BLUE_COLOR, 0.1),
                                    color: BLUE_COLOR,
                                    border: `1px solid ${alpha(BLUE_COLOR, 0.3)}`,
                                    fontSize: '0.75rem',
                                    '& .MuiChip-icon': {
                                        color: BLUE_COLOR,
                                        marginLeft: '6px',
                                    },
                                }}
                            />
                        </Box>

                        <Divider sx={{
                            my: 3,
                            backgroundColor: alpha(TEXT_COLOR, 0.06),
                        }} />

                        {/* Security Actions */}
                        <Box display="flex" flexDirection="column" gap={1.5}>
                            <OutlineButton
                                fullWidth
                                onClick={() => setOpenPasswordDialog(true)}
                                disabled={updating || changePasswordMutation.isPending}
                                startIcon={<Key size={16} />}
                                sx={{
                                    fontSize: '0.85rem',
                                    height: '38px',
                                    pl: 2,
                                }}
                            >
                                Change Password
                            </OutlineButton>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Password Change Dialog */}
            <Dialog
                open={openPasswordDialog}
                onClose={handleClosePasswordDialog}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: '8px',
                        bgcolor: 'white',
                        border: `1px solid ${alpha(TEXT_COLOR, 0.08)}`,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    }
                }}
            >
                <DialogTitle sx={{
                    borderBottom: `1px solid ${alpha(TEXT_COLOR, 0.06)}`,
                    pb: 1.5,
                }}>
                    <Box display="flex" alignItems="center" gap={1.5}>
                        <Box sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: alpha(BLUE_COLOR, 0.1),
                            color: BLUE_COLOR,
                        }}>
                            <Lock size={18} />
                        </Box>
                        <Box>
                            <Typography
                                variant="h6"
                                sx={{
                                    color: TEXT_COLOR,
                                    fontSize: '0.95rem',
                                    fontWeight: 600,
                                    lineHeight: 1.2,
                                }}
                            >
                                Change Password
                            </Typography>
                            <Typography
                                variant="caption"
                                sx={{
                                    color: GRAY_COLOR,
                                    fontSize: '0.75rem',
                                    fontWeight: 400,
                                }}
                            >
                                Update your account password
                            </Typography>
                        </Box>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ pt: 2.5, pb: 1.5 }}>
                    <Box sx={{ pt: 1 }}>
                        {passwordError && (
                            <Alert
                                severity="error"
                                icon={<AlertCircle size={18} />}
                                sx={{
                                    borderRadius: '6px',
                                    backgroundColor: alpha(RED_COLOR, 0.05),
                                    borderLeft: `4px solid ${RED_COLOR}`,
                                    '& .MuiAlert-icon': {
                                        color: RED_COLOR,
                                    },
                                    mb: 2.5,
                                }}
                            >
                                <Typography
                                    sx={{
                                        color: TEXT_COLOR,
                                        fontSize: '0.85rem',
                                        fontWeight: 500,
                                    }}
                                >
                                    {passwordError}
                                </Typography>
                            </Alert>
                        )}

                        {/* Current Password */}
                        <StyledTextField
                            fullWidth
                            label="Current Password"
                            name="currentPassword"
                            type={showCurrentPassword ? "text" : "password"}
                            value={passwordData.currentPassword}
                            onChange={handlePasswordChange}
                            margin="normal"
                            required
                            size="small"
                            disabled={changePasswordMutation.isPending}
                            InputProps={{
                                startAdornment: (
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        mr: 1.5,
                                        color: GRAY_COLOR
                                    }}>
                                        <Lock size={16} />
                                    </Box>
                                ),
                                endAdornment: (
                                    <IconButton
                                        size="small"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        sx={{ color: GRAY_COLOR }}
                                    >
                                        {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </IconButton>
                                ),
                                sx: { fontSize: '0.85rem' }
                            }}
                            sx={{
                                '& .MuiFormLabel-root': {
                                    fontSize: '0.85rem',
                                },
                                '& .MuiFormHelperText-root': {
                                    fontSize: '0.75rem',
                                },
                                mb: 2,
                            }}
                        />

                        {/* New Password */}
                        <StyledTextField
                            fullWidth
                            label="New Password"
                            name="newPassword"
                            type={showNewPassword ? "text" : "password"}
                            value={passwordData.newPassword}
                            onChange={handlePasswordChange}
                            margin="normal"
                            required
                            size="small"
                            helperText="Password must be at least 6 characters"
                            disabled={changePasswordMutation.isPending}
                            InputProps={{
                                startAdornment: (
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        mr: 1.5,
                                        color: GRAY_COLOR
                                    }}>
                                        <Key size={16} />
                                    </Box>
                                ),
                                endAdornment: (
                                    <IconButton
                                        size="small"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        sx={{ color: GRAY_COLOR }}
                                    >
                                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </IconButton>
                                ),
                                sx: { fontSize: '0.85rem' }
                            }}
                            sx={{
                                '& .MuiFormLabel-root': {
                                    fontSize: '0.85rem',
                                },
                                '& .MuiFormHelperText-root': {
                                    fontSize: '0.75rem',
                                },
                                mb: 2,
                            }}
                        />

                        {/* Confirm Password */}
                        <StyledTextField
                            fullWidth
                            label="Confirm New Password"
                            name="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordChange}
                            margin="normal"
                            required
                            size="small"
                            disabled={changePasswordMutation.isPending}
                            InputProps={{
                                startAdornment: (
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        mr: 1.5,
                                        color: GRAY_COLOR
                                    }}>
                                        <CheckCircle size={16} />
                                    </Box>
                                ),
                                endAdornment: (
                                    <IconButton
                                        size="small"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        sx={{ color: GRAY_COLOR }}
                                    >
                                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </IconButton>
                                ),
                                sx: { fontSize: '0.85rem' }
                            }}
                            sx={{
                                '& .MuiFormLabel-root': {
                                    fontSize: '0.85rem',
                                },
                                '& .MuiFormHelperText-root': {
                                    fontSize: '0.75rem',
                                },
                            }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{
                    p: 2.5,
                    pt: 2,
                    borderTop: `1px solid ${alpha(TEXT_COLOR, 0.06)}`,
                    justifyContent: 'space-between',
                }}>
                    <Button
                        onClick={handleClosePasswordDialog}
                        disabled={changePasswordMutation.isPending}
                        sx={{
                            textTransform: 'none',
                            fontSize: '0.85rem',
                            fontWeight: 400,
                            color: TEXT_COLOR,
                            px: 2,
                        }}
                    >
                        Cancel
                    </Button>
                    <GradientButton
                        onClick={handleChangePassword}
                        variant="contained"
                        disabled={changePasswordMutation.isPending}
                        startIcon={changePasswordMutation.isPending ? <RefreshCw size={16} /> : <Key size={16} />}
                        sx={{
                            fontSize: '0.85rem',
                            height: '36px',
                            px: 2,
                        }}
                    >
                        {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
                    </GradientButton>
                </DialogActions>
            </Dialog>

            {/* Success Snackbar */}
            <Snackbar
                open={!!success}
                autoHideDuration={3000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity="success"
                    icon={<CheckCircle size={20} />}
                    sx={{
                        width: '100%',
                        borderRadius: '6px',
                        backgroundColor: alpha(GREEN_COLOR, 0.05),
                        borderLeft: `4px solid ${GREEN_COLOR}`,
                        '& .MuiAlert-icon': {
                            color: GREEN_COLOR,
                        },
                        '& .MuiAlert-message': {
                            py: 0.5,
                        }
                    }}
                    elevation={6}
                >
                    <Typography
                        sx={{
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            color: TEXT_COLOR,
                        }}
                    >
                        {success}
                    </Typography>
                </Alert>
            </Snackbar>

            {/* Error Snackbar */}
            <Snackbar
                open={!!error}
                autoHideDuration={3000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity="error"
                    icon={<AlertCircle size={20} />}
                    sx={{
                        width: '100%',
                        borderRadius: '6px',
                        backgroundColor: alpha(RED_COLOR, 0.05),
                        borderLeft: `4px solid ${RED_COLOR}`,
                        '& .MuiAlert-icon': {
                            color: RED_COLOR,
                        },
                        '& .MuiAlert-message': {
                            py: 0.5,
                        }
                    }}
                    elevation={6}
                >
                    <Typography
                        sx={{
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            color: TEXT_COLOR,
                        }}
                    >
                        {error}
                    </Typography>
                </Alert>
            </Snackbar>
        </Box>
    );
};