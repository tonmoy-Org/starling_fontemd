import React from 'react';
import { Snackbar, Alert, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';

const SnackbarAlert = ({ snackbar, onClose }) => {
    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'success': return '#10b981';
            case 'error': return '#ef4444';
            case 'warning': return '#ed6c02';
            default: return '#1976d2';
        }
    };

    const getIcon = (severity) => {
        switch (severity) {
            case 'success': return <CheckCircle size={20} />;
            case 'error': return <AlertCircle size={20} />;
            case 'warning': return <AlertTriangle size={20} />;
            default: return <AlertCircle size={20} />;
        }
    };

    const color = getSeverityColor(snackbar.severity);
    const Icon = getIcon(snackbar.severity);

    return (
        <Snackbar
            open={snackbar.open}
            autoHideDuration={3000}
            onClose={onClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
            <Alert
                onClose={onClose}
                severity={snackbar.severity}
                icon={Icon}
                sx={{
                    width: '100%',
                    borderRadius: '6px',
                    backgroundColor: alpha(color, 0.05),
                    borderLeft: `4px solid ${color}`,
                    '& .MuiAlert-icon': {
                        color: color,
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
                        color: '#0F1115',
                    }}
                >
                    {snackbar.message}
                </Typography>
            </Alert>
        </Snackbar>
    );
};

export default SnackbarAlert;