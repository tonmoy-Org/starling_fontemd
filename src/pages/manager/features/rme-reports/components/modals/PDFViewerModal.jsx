import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Box,
    Typography,
    IconButton
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useTheme, useMediaQuery } from '@mui/material';
import { X, FileText } from 'lucide-react';
import { BLUE_COLOR, GRAY_COLOR, TEXT_COLOR } from '../../utils/constants';

const PDFViewerModal = ({ open, onClose, pdfUrl }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            fullScreen={isMobile}
            PaperProps={{
                sx: {
                    bgcolor: 'white',
                    borderRadius: isMobile ? 0 : '8px',
                    height: isMobile ? '100%' : '90vh',
                    maxHeight: '90vh',
                }
            }}
        >
            <DialogTitle sx={{
                borderBottom: `1px solid ${alpha(BLUE_COLOR, 0.1)}`,
                bgcolor: alpha(BLUE_COLOR, 0.03),
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
                        backgroundColor: alpha(BLUE_COLOR, 0.1),
                        color: BLUE_COLOR,
                    }}>
                        <FileText size={20} />
                    </Box>
                    <Box>
                        <Typography variant="h6" sx={{
                            fontSize: '1rem',
                            fontWeight: 600,
                            color: TEXT_COLOR,
                            mb: 0.5,
                        }}>
                            PDF Viewer
                        </Typography>
                        <Typography variant="body2" sx={{
                            fontSize: '0.85rem',
                            color: GRAY_COLOR,
                        }}>
                            Last Locked Report
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
            <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
                {pdfUrl ? (
                    <iframe
                        src={pdfUrl}
                        style={{
                            width: '100%',
                            height: '100%',
                            border: 'none',
                            flex: 1,
                        }}
                        title="PDF Viewer"
                    />
                ) : (
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        gap: 2,
                        p: 4,
                    }}>
                        <FileText size={48} color={alpha(GRAY_COLOR, 0.3)} />
                        <Typography variant="body2" sx={{
                            color: GRAY_COLOR,
                            fontSize: '0.9rem',
                        }}>
                            No PDF available
                        </Typography>
                        <Typography variant="caption" sx={{
                            color: GRAY_COLOR,
                            fontSize: '0.8rem',
                        }}>
                            PDF will appear here when available
                        </Typography>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default PDFViewerModal;