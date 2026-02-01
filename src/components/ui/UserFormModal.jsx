// modals/UserFormModal.jsx
import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    FormControlLabel,
    Switch,
    MenuItem,
} from '@mui/material';
import {
    Edit,
    UserPlus,
    X,
    RefreshCw,
} from 'lucide-react';
import StyledTextField from '../ui/StyledTextField';
import StyledSelect from '../ui/StyledSelect';
import OutlineButton from '../ui/OutlineButton';
import GradientButton from '../ui/GradientButton';

const TEXT_COLOR = '#0F1115';
const GREEN_COLOR = '#10b981';

export const UserFormModal = ({
    open,
    onClose,
    onSubmit,
    selectedUser,
    formData,
    onInputChange,
    onSwitchChange,
    isLoading,
    title = "User",
    color = GREEN_COLOR,
}) => {
    const isCreating = !selectedUser;
    const buttonText = selectedUser ? `Update ${title}` : `Create ${title}`;
    const isSubmitting = isLoading;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '8px',
                    bgcolor: 'white',
                    border: `1px solid ${alpha(color, 0.15)}`,
                }
            }}
        >
            <DialogTitle sx={{
                p: 2,
                borderBottom: `1px solid ${alpha(color, 0.1)}`,
                bgcolor: 'white',
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {selectedUser ? (
                        <Edit size={18} color={color} />
                    ) : (
                        <UserPlus size={18} color={color} />
                    )}
                    <Typography
                        sx={{
                            fontSize: '0.95rem',
                            color: TEXT_COLOR,
                            fontWeight: 600,
                        }}
                    >
                        {selectedUser ? `Edit ${title}` : `Add New ${title}`}
                    </Typography>
                </Box>
            </DialogTitle>
            <DialogContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Name */}
                    <Box>
                        <Typography
                            variant="body2"
                            sx={{ mb: 1, fontSize: '0.8rem', fontWeight: 500, color: TEXT_COLOR }}
                        >
                            Name
                        </Typography>
                        <StyledTextField
                            fullWidth
                            name="name"
                            value={formData.name}
                            onChange={onInputChange}
                            placeholder="Enter full name"
                            variant="outlined"
                            size="small"
                            required
                        />
                    </Box>

                    {/* Email */}
                    <Box>
                        <Typography
                            variant="body2"
                            sx={{ mb: 1, fontSize: '0.8rem', fontWeight: 500, color: TEXT_COLOR }}
                        >
                            Email
                        </Typography>
                        <StyledTextField
                            fullWidth
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={onInputChange}
                            placeholder="Enter email address"
                            variant="outlined"
                            size="small"
                            required
                        />
                    </Box>

                    {/* Password */}
                    <Box>
                        <Typography
                            variant="body2"
                            sx={{ mb: 1, fontSize: '0.8rem', fontWeight: 500, color: TEXT_COLOR }}
                        >
                            Password
                        </Typography>
                        <StyledTextField
                            fullWidth
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={onInputChange}
                            placeholder={
                                selectedUser
                                    ? 'Leave blank to keep current password'
                                    : 'Enter password'
                            }
                            variant="outlined"
                            size="small"
                            required={!selectedUser}
                        />
                    </Box>

                    {/* Role - Only show if not tech user */}
                    {title !== "Tech User" && (
                        <Box>
                            <Typography
                                variant="body2"
                                sx={{ mb: 1, fontSize: '0.8rem', fontWeight: 500, color: TEXT_COLOR }}
                            >
                                Role
                            </Typography>
                            <StyledSelect
                                name="role"
                                value={formData.role || ''}
                                onChange={onInputChange}
                                displayEmpty
                                fullWidth
                                variant="outlined"
                                size="small"
                            >
                                <MenuItem value="manager">Manager</MenuItem>
                                <MenuItem value="superadmin">Super Admin</MenuItem>
                                <MenuItem value="tech">Tech</MenuItem>
                            </StyledSelect>
                        </Box>
                    )}

                    {/* Active Switch - Only show when editing */}
                    {selectedUser && (
                        <Box>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.isActive}
                                        onChange={onSwitchChange}
                                        size="small"
                                        sx={{
                                            '& .MuiSwitch-switchBase.Mui-checked': {
                                                color: color,
                                            },
                                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                backgroundColor: color,
                                            },
                                        }}
                                    />
                                }
                                label={
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontSize: '0.85rem',
                                            fontWeight: 500,
                                            color: TEXT_COLOR,
                                        }}
                                    >
                                        {formData.isActive ? 'Active' : 'Inactive'}
                                    </Typography>
                                }
                            />
                        </Box>
                    )}
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 2.5, pb: 2.5, pt: 0 }}>
                <OutlineButton
                    onClick={onClose}
                    startIcon={<X size={16} />}
                >
                    Cancel
                </OutlineButton>
                <GradientButton
                    onClick={onSubmit}
                    variant="contained"
                    disabled={
                        isSubmitting ||
                        !formData.name ||
                        !formData.email ||
                        (!selectedUser && !formData.password)
                    }
                    startIcon={selectedUser ? <Edit size={16} /> : <UserPlus size={16} />}
                >
                    {isSubmitting ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <RefreshCw size={14} className="animate-spin" />
                            {selectedUser ? 'Updating...' : 'Creating...'}
                        </Box>
                    ) : (
                        buttonText
                    )}
                </GradientButton>
            </DialogActions>
        </Dialog>
    );
};

// Helper function
const alpha = (color, opacity) => {
    // Simple alpha function - you might want to use MUI's alpha or a color library
    return color + Math.round(opacity * 255).toString(16).padStart(2, '0');
};