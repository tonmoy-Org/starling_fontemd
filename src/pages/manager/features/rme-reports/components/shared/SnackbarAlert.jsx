import React from 'react';
import { Snackbar, Alert, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { TEXT_COLOR } from '../../../locates/utils/constants';

const SnackbarAlert = ({ snackbar, onClose }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const getBorderColor = (severity) => {
        switch (severity) {
            case 'success':
                return 'success';
            case 'error':
                return 'error';
            case 'warning':
                return 'warning';
            default:
                return 'info';
        }
    };

    return (
        <Snackbar
            open={snackbar.open}
            autoHideDuration={3000}
            onClose={onClose}
            anchorOrigin={{
                vertical: isMobile ? 'top' : 'bottom',
                horizontal: 'right',
            }}
        >
            <Alert
                onClose={onClose}
                severity={snackbar.severity}
                iconMapping={{
                    success: <CheckCircle size={20} />,
                    error: <AlertCircle size={20} />,
                    warning: <AlertTriangle size={20} />,
                    info: <AlertCircle size={20} />,
                }}
                sx={{
                    width: '100%',
                    borderRadius: '6px',
                    backgroundColor:
                        snackbar.severity === 'success'
                            ? 'success'
                            : snackbar.severity === 'error'
                                ? 'error'
                                : snackbar.severity === 'warning'
                                    ? 'warning'
                                    : 'info',
                    borderLeft: `4px solid ${getBorderColor(snackbar.severity)}`,
                    '& .MuiAlert-icon': {
                        color: getBorderColor(snackbar.severity),
                    },
                    '& .MuiAlert-message': {
                        py: 0.5,
                    },
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
                    {snackbar.message}
                </Typography>
            </Alert>
        </Snackbar>
    );
};

export default SnackbarAlert;
