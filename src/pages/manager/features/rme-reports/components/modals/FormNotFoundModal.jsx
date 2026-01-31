import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    Alert,
    Button,
    IconButton,
    CircularProgress
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useTheme, useMediaQuery } from '@mui/material';
import { X, AlertCircle, Trash2 } from 'lucide-react';
import OutlineButton from '../../../../../../components/ui/OutlineButton';
import {
    RED_COLOR,
    GRAY_COLOR,
    TEXT_COLOR,
    ORANGE_COLOR
} from '../../utils/constants';

const FormNotFoundModal = ({ open, onClose, workOrderData, onMoveToRecycleBin }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [isMoving, setIsMoving] = useState(false);

    const handleMoveToRecycleBin = async () => {
        if (!workOrderData?.id) return;

        setIsMoving(true);
        try {
            await onMoveToRecycleBin(workOrderData.id);
            onClose();
        } catch (error) {
            console.error('Error moving to recycle bin:', error);
        } finally {
            setIsMoving(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            fullScreen={isMobile}
            PaperProps={{
                sx: {
                    bgcolor: 'white',
                    borderRadius: isMobile ? 0 : '8px',
                    border: `1px solid ${alpha(RED_COLOR, 0.1)}`,
                }
            }}
        >
            <DialogTitle sx={{
                borderBottom: `1px solid ${alpha(RED_COLOR, 0.1)}`,
                bgcolor: alpha(RED_COLOR, 0.03),
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                py: 2,
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: alpha(RED_COLOR, 0.1),
                        color: RED_COLOR,
                    }}>
                        <AlertCircle size={20} />
                    </Box>
                    <Box>
                        <Typography variant="h6" sx={{
                            fontSize: '1rem',
                            fontWeight: 600,
                            color: TEXT_COLOR,
                            mb: 0.5,
                        }}>
                            Form Not Found
                        </Typography>
                        <Typography variant="body2" sx={{
                            fontSize: '0.85rem',
                            color: GRAY_COLOR,
                        }}>
                            Work Order #{workOrderData?.woNumber || 'N/A'}
                        </Typography>
                    </Box>
                </Box>
                <IconButton
                    size="small"
                    onClick={onClose}
                    sx={{
                        color: GRAY_COLOR,
                        '&:hover': {
                            backgroundColor: alpha(GRAY_COLOR, 0.1),
                        },
                    }}
                >
                    <X size={20} />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
                <Typography variant="body1" sx={{ mb: 2, fontSize: '0.9rem', color: TEXT_COLOR }}>
                    The form data for this work order could not be found (Error 400). This may be due to:
                </Typography>
                <Box component="ul" sx={{ pl: 2, mb: 3 }}>
                    <Typography component="li" variant="body2" sx={{ mb: 1, fontSize: '0.85rem', color: TEXT_COLOR }}>
                        • Corrupted or missing form data
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 1, fontSize: '0.85rem', color: TEXT_COLOR }}>
                        • Database synchronization issues
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ fontSize: '0.85rem', color: TEXT_COLOR }}>
                        • Invalid work order configuration
                    </Typography>
                </Box>
                <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                        To resolve this issue, you can move this work order to the recycle bin. You can restore it later if needed.
                    </Typography>
                </Alert>
                <Box sx={{
                    p: 2,
                    borderRadius: '6px',
                    backgroundColor: alpha(GRAY_COLOR, 0.05),
                    border: `1px solid ${alpha(GRAY_COLOR, 0.1)}`,
                }}>
                    <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 600, color: TEXT_COLOR, mb: 1 }}>
                        Work Order Details:
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.85rem', color: TEXT_COLOR, mb: 0.5 }}>
                        <strong>WO #:</strong> {workOrderData?.woNumber || 'N/A'}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.85rem', color: TEXT_COLOR, mb: 0.5 }}>
                        <strong>Address:</strong> {workOrderData?.street || 'N/A'}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.85rem', color: TEXT_COLOR }}>
                        <strong>Technician:</strong> {workOrderData?.technician || 'N/A'}
                    </Typography>
                </Box>
            </DialogContent>
            <DialogActions sx={{
                p: 3,
                pt: 2,
                borderTop: `1px solid ${alpha(GRAY_COLOR, 0.1)}`,
            }}>
                <OutlineButton
                    onClick={onClose}
                    variant="outlined"
                    size="small"
                    disabled={isMoving}
                    sx={{ minWidth: 100 }}
                >
                    Cancel
                </OutlineButton>
                <Button
                    onClick={handleMoveToRecycleBin}
                    variant="contained"
                    color="warning"
                    startIcon={isMoving ? <CircularProgress size={16} /> : <Trash2 size={18} />}
                    disabled={isMoving}
                    sx={{
                        minWidth: 180,
                        bgcolor: ORANGE_COLOR,
                        textTransform: 'none',
                        '&:hover': {
                            bgcolor: alpha(ORANGE_COLOR, 0.9),
                        },
                        fontSize: '0.85rem',
                    }}
                >
                    {isMoving ? 'Moving...' : 'Move to Recycle Bin'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default FormNotFoundModal;