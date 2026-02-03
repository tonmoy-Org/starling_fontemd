// EditFormModal.js
import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    Alert,
    IconButton,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    FormControl,
    RadioGroup,
    FormControlLabel,
    Radio,
    MenuItem
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useTheme, useMediaQuery } from '@mui/material';
import { X, Save } from 'lucide-react';
import axiosInstance from '../../../../../../api/axios';
import StyledTextField from '../../../../../../components/ui/StyledTextField';
import StyledSelect from '../../../../../../components/ui/StyledSelect';
import OutlineButton from '../../../../../../components/ui/OutlineButton';
import DashboardLoader from '../../../../../../components/Loader/DashboardLoader';
import FormNotFoundModal from './FormNotFoundModal';
import {
    BLUE_COLOR,
    GRAY_COLOR,
    TEXT_COLOR,
    RED_COLOR,
} from '../../utils/constants';
import UpdateButton from '../../../../../../components/ui/UpdateButton';

const EditFormModal = ({ open, onClose, workOrderData, onSave, showSnackbar, onMoveToRecycleBin }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [isLoading, setIsLoading] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [formData, setFormData] = useState([]);
    const [error, setError] = useState(null);
    const [yesNoFields, setYesNoFields] = useState({});
    const [inspectionFields, setInspectionFields] = useState({});
    const [showFormNotFoundModal, setShowFormNotFoundModal] = useState(false);

    useEffect(() => {
        const fetchFormData = async () => {
            if (!workOrderData?.id) return;

            setIsLoading(true);
            setError(null);
            try {
                const response = await axiosInstance.get(`/work-order-edit/${workOrderData.id}/`);

                let serverData = response.data;
                console.log('serverData', serverData);

                let formDataArray = [];

                if (serverData.data && serverData.data.form_data && Array.isArray(serverData.data.form_data)) {
                    formDataArray = serverData.data.form_data;
                } else if (serverData.form_data && Array.isArray(serverData.form_data)) {
                    formDataArray = serverData.form_data;
                } else if (Array.isArray(serverData)) {
                    formDataArray = serverData;
                }

                if (formDataArray.length > 0) {
                    const processedFormData = formDataArray.map(field => {
                        let value = '';
                        if (field.selected !== undefined && field.selected !== null) {
                            value = field.selected;
                        } else if (field.value !== undefined && field.value !== null) {
                            value = field.value;
                        }

                        // Clean up field labels - remove any text in parentheses
                        let label = field.label || field.name;
                        if (label) {
                            // Remove text in parentheses including the parentheses themselves
                            label = label.replace(/\s*\([^)]*\)/g, '');
                            // Remove text in brackets including the brackets themselves
                            label = label.replace(/\s*\[[^\]]*\]/g, '');
                            // Trim any extra spaces
                            label = label.trim();
                        }

                        return {
                            ...field,
                            value: value,
                            label: label
                        };
                    });

                    setFormData(processedFormData);

                    const initialYesNoFields = {};
                    const initialInspectionFields = {};

                    processedFormData.forEach((field) => {
                        if (field.type === 'select') {
                            const cleanOptions = field.options ? field.options.filter(opt => opt !== '' && opt !== null && opt !== undefined) : [];

                            const isYesNoField = cleanOptions.length <= 3 &&
                                cleanOptions.every(opt => {
                                    const optStr = opt.toString().toUpperCase();
                                    return optStr === 'YES' ||
                                        optStr === 'NO' ||
                                        optStr === 'N/A' ||
                                        optStr === 'NA';
                                });

                            const isInspectionField = cleanOptions.length === 3 &&
                                cleanOptions.includes('Fully Inspected') &&
                                cleanOptions.includes('Partially Inspected') &&
                                cleanOptions.includes('Not Inspected');

                            if (isYesNoField) {
                                initialYesNoFields[field.name] = {
                                    isYesNo: true
                                };
                            }

                            if (isInspectionField) {
                                initialInspectionFields[field.name] = {
                                    isInspection: true
                                };
                            }
                        }
                    });

                    setYesNoFields(initialYesNoFields);
                    setInspectionFields(initialInspectionFields);
                } else {
                    setFormData([]);
                    setShowFormNotFoundModal(true);
                }

            } catch (error) {
                if (error.response?.status === 400) {
                    setShowFormNotFoundModal(true);
                } else {
                    setError(error.response?.data?.message || 'Failed to load form data');
                }
                setFormData([]);
            } finally {
                setIsLoading(false);
            }
        };

        if (open && workOrderData?.id) {
            fetchFormData();
        }
    }, [workOrderData, open]);

    const handleInputChange = (fieldName, value) => {
        setFormData(prev =>
            prev.map(field =>
                field.name === fieldName
                    ? {
                        ...field,
                        value: value,
                        ...(field.type === 'select' ? { selected: value } : {})
                    }
                    : field
            )
        );
    };

    const handleSubmit = async () => {
        if (!workOrderData?.id) return;

        setSaveLoading(true);
        setError(null);

        try {
            const formDataArray = formData.map(field => {
                const fieldObj = {
                    name: field.name,
                    type: field.type,
                };

                if (field.type === 'select') {
                    fieldObj.selected = field.value || '';
                    if (field.options && Array.isArray(field.options)) {
                        fieldObj.options = field.options;
                    }
                } else {
                    fieldObj.value = field.value || '';
                }

                if (field.label) fieldObj.label = field.label;
                if (field.required !== undefined) fieldObj.required = field.required;
                if (field.placeholder) fieldObj.placeholder = field.placeholder;
                if (field.validation) fieldObj.validation = field.validation;

                return fieldObj;
            });

            const payload = {
                form_data: formDataArray,
                work_order_today: workOrderData.id,
                updated_at: new Date().toISOString(),
            };

            const response = await axiosInstance.patch(`/work-order-edit/${workOrderData.id}/`, payload);

            if (onSave) {
                onSave(formDataArray, response.data);
            }

            showSnackbar('Form saved successfully', 'success');

            setTimeout(() => {
                setSaveLoading(false);
                onClose();
            }, 1000);

        } catch (error) {
            setError(error.response?.data?.message || 'Failed to save form');
            if (showSnackbar) {
                showSnackbar('Failed to save form', 'error');
            }
            setSaveLoading(false);
        }
    };

    const isYesNoField = (fieldName) => {
        return yesNoFields[fieldName]?.isYesNo;
    };

    const isInspectionField = (fieldName) => {
        return inspectionFields[fieldName]?.isInspection;
    };

    const renderFormField = (field, index) => {
        const uniqueKey = `${field.name}-${index}`;
        const value = field.value || '';
        const cleanOptions = field.options ? field.options.filter(opt => opt !== '' && opt !== null && opt !== undefined) : [];
        const isYesNo = isYesNoField(field.name);
        const isInspection = isInspectionField(field.name);

        // Dark blue background for inspection fields (3 options)
        const rowBgColor = isInspection
            ? alpha(BLUE_COLOR, 0.6) // Darker blue background for inspection fields
            : 'transparent';

        if (isYesNo) {
            return (
                <TableRow key={uniqueKey} sx={{ backgroundColor: 'transparent' }}>
                    <TableCell sx={{
                        borderBottom: `1px solid ${alpha(GRAY_COLOR, 0.1)}`,
                        width: isMobile ? '40%' : '70%',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        color: TEXT_COLOR,
                        verticalAlign: 'top',
                        padding: '12px 16px',
                    }}>
                        {field.label || field.name}
                        {field.required && (
                            <Typography component="span" sx={{ color: RED_COLOR, ml: 0.5 }}>
                                *
                            </Typography>
                        )}
                    </TableCell>
                    <TableCell sx={{
                        borderBottom: `1px solid ${alpha(GRAY_COLOR, 0.1)}`,
                        padding: '12px 16px',
                    }}>
                        <RadioGroup
                            row
                            name={field.name}
                            value={value}
                            onChange={(e) => handleInputChange(field.name, e.target.value)}
                            sx={{ gap: isMobile ? 1 : 2 }}
                        >
                            {cleanOptions.map((option, optionIndex) => (
                                <FormControlLabel
                                    key={`${option}-${optionIndex}`}
                                    value={option}
                                    control={<Radio size="small" />}
                                    label={
                                        <Typography sx={{
                                            fontSize: '0.85rem',
                                            textTransform: option ? 'uppercase' : 'none'
                                        }}>
                                            {option || 'Select...'}
                                        </Typography>
                                    }
                                    disabled={isLoading || saveLoading}
                                    sx={{
                                        marginRight: isMobile ? 1 : 2,
                                        '& .MuiFormControlLabel-label': {
                                            fontSize: '0.85rem',
                                        }
                                    }}
                                />
                            ))}
                        </RadioGroup>
                        {field.required && !value && (
                            <Typography variant="caption" sx={{ color: RED_COLOR, display: 'block', mt: 0.5 }}>
                                This field is required
                            </Typography>
                        )}
                    </TableCell>
                </TableRow>
            );
        }

        if (isInspection) {
            return (
                <TableRow
                    key={uniqueKey}
                    sx={{
                        backgroundColor: rowBgColor,
                    }}
                >
                    <TableCell sx={{
                        borderBottom: index === formData.length - 1 ? 'none' : `1px solid ${alpha(GRAY_COLOR, 0.1)}`,
                        width: isMobile ? '40%' : '70%',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        color: TEXT_COLOR,
                        verticalAlign: 'top',
                        padding: '6px 16px',
                    }}>
                        {field.label || field.name}
                        {field.required && (
                            <Typography component="span" sx={{ color: RED_COLOR, ml: 0.5 }}>
                                *
                            </Typography>
                        )}
                    </TableCell>
                    <TableCell sx={{
                        borderBottom: index === formData.length - 1 ? 'none' : `1px solid ${alpha(GRAY_COLOR, 0.1)}`,
                        padding: '5px 16px',
                    }}>
                        <FormControl fullWidth size="small">
                            <StyledSelect
                                value={value}
                                onChange={(e) => handleInputChange(field.name, e.target.value)}
                                displayEmpty
                                disabled={isLoading || saveLoading}
                                error={field.required && !value}
                                sx={{
                                    '& .MuiSelect-select': {
                                        fontSize: '0.85rem',
                                        padding: '6px 12px',
                                        color: TEXT_COLOR,
                                        fontWeight: 600,
                                        backgroundColor: 'white',
                                    },
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: alpha(BLUE_COLOR, 0.3),
                                        borderWidth: '1px',
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: BLUE_COLOR,
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        borderColor: BLUE_COLOR,
                                    }
                                }}
                            >
                                {cleanOptions.map((option, optionIndex) => (
                                    <MenuItem
                                        key={`${option}-${optionIndex}`}
                                        value={option}
                                        sx={{
                                            fontSize: '0.85rem',
                                            color: TEXT_COLOR,
                                            fontWeight: 400,
                                        }}
                                    >
                                        {option}
                                    </MenuItem>
                                ))}
                            </StyledSelect>
                        </FormControl>
                    </TableCell>
                </TableRow>
            );
        }

        switch (field.type) {
            case 'select':
                return (
                    <TableRow key={uniqueKey} sx={{ backgroundColor: 'transparent' }}>
                        <TableCell sx={{
                            borderBottom: index === formData.length - 1 ? 'none' : `1px solid ${alpha(GRAY_COLOR, 0.1)}`,
                            width: isMobile ? '40%' : '70%',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            color: TEXT_COLOR,
                            verticalAlign: 'top',
                            padding: '12px 16px',
                        }}>
                            {field.label || field.name}
                            {field.required && (
                                <Typography component="span" sx={{ color: RED_COLOR, ml: 0.5 }}>
                                    *
                                </Typography>
                            )}
                        </TableCell>
                        <TableCell sx={{
                            borderBottom: index === formData.length - 1 ? 'none' : `1px solid ${alpha(GRAY_COLOR, 0.1)}`,
                            padding: '12px 16px',
                        }}>
                            <FormControl fullWidth size="small">
                                <StyledSelect
                                    value={value}
                                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                                    displayEmpty
                                    disabled={isLoading || saveLoading}
                                    error={field.required && !value}
                                    sx={{
                                        '& .MuiSelect-select': {
                                            fontSize: '0.85rem',
                                            padding: '8px 12px',
                                            color: value ? BLUE_COLOR : 'inherit',
                                            fontWeight: value ? 600 : 400,
                                        },
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: alpha(GRAY_COLOR, 0.3),
                                        },
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: BLUE_COLOR,
                                        }
                                    }}
                                >
                                    {cleanOptions.map((option, optionIndex) => (
                                        <MenuItem
                                            key={`${option}-${optionIndex}`}
                                            value={option}
                                            sx={{
                                                fontSize: '0.85rem',
                                                color: BLUE_COLOR,
                                                fontWeight: 600,
                                            }}
                                        >
                                            {option}
                                        </MenuItem>
                                    ))}
                                </StyledSelect>
                            </FormControl>
                        </TableCell>
                    </TableRow>
                );

            case 'text':
                return (
                    <TableRow key={uniqueKey} sx={{ backgroundColor: 'transparent' }}>
                        <TableCell sx={{
                            borderBottom: index === formData.length - 1 ? 'none' : `1px solid ${alpha(GRAY_COLOR, 0.1)}`,
                            width: isMobile ? '40%' : '70%',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            color: TEXT_COLOR,
                            verticalAlign: 'top',
                            padding: '12px 16px',
                        }}>
                            {field.label || field.name}
                            {field.required && (
                                <Typography component="span" sx={{ color: RED_COLOR, ml: 0.5 }}>
                                    *
                                </Typography>
                            )}
                        </TableCell>
                        <TableCell sx={{
                            borderBottom: index === formData.length - 1 ? 'none' : `1px solid ${alpha(GRAY_COLOR, 0.1)}`,
                            padding: '12px 16px',
                        }}>
                            <StyledTextField
                                value={value}
                                onChange={(e) => handleInputChange(field.name, e.target.value)}
                                fullWidth
                                size="small"
                                disabled={isLoading || saveLoading}
                                placeholder={field.placeholder}
                                error={field.required && !value}
                                sx={{
                                    '& .MuiInputBase-input': {
                                        fontSize: '0.85rem',
                                        padding: '8px 12px',
                                        color: BLUE_COLOR,
                                        fontWeight: 600,
                                    },
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: alpha(GRAY_COLOR, 0.3),
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: BLUE_COLOR,
                                    }
                                }}
                            />
                        </TableCell>
                    </TableRow>
                );

            case 'textarea':
                return (
                    <TableRow key={uniqueKey} sx={{ backgroundColor: 'transparent' }}>
                        <TableCell sx={{
                            borderBottom: index === formData.length - 1 ? 'none' : `1px solid ${alpha(GRAY_COLOR, 0.1)}`,
                            width: isMobile ? '40%' : '70%',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            color: TEXT_COLOR,
                            verticalAlign: 'top',
                            padding: '12px 16px',
                        }}>
                            {field.label || field.name}
                            {field.required && (
                                <Typography component="span" sx={{ color: RED_COLOR, ml: 0.5 }}>
                                    *
                                </Typography>
                            )}
                        </TableCell>
                        <TableCell sx={{
                            borderBottom: index === formData.length - 1 ? 'none' : `1px solid ${alpha(GRAY_COLOR, 0.1)}`,
                            padding: '12px 16px',
                        }}>
                            <StyledTextField
                                value={value}
                                onChange={(e) => handleInputChange(field.name, e.target.value)}
                                fullWidth
                                multiline
                                rows={field.rows || 3}
                                size="small"
                                disabled={isLoading || saveLoading}
                                placeholder={field.placeholder}
                                error={field.required && !value}
                                sx={{
                                    '& .MuiInputBase-input': {
                                        fontSize: '0.85rem',
                                        lineHeight: 1.5,
                                        color: BLUE_COLOR,
                                        fontWeight: 600,
                                    },
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: alpha(GRAY_COLOR, 0.3),
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: BLUE_COLOR,
                                    }
                                }}
                            />
                        </TableCell>
                    </TableRow>
                );

            default:
                return (
                    <TableRow key={uniqueKey} sx={{ backgroundColor: 'transparent' }}>
                        <TableCell sx={{
                            borderBottom: index === formData.length - 1 ? 'none' : `1px solid ${alpha(GRAY_COLOR, 0.1)}`,
                            width: isMobile ? '40%' : '70%',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            color: TEXT_COLOR,
                            verticalAlign: 'top',
                            padding: '12px 16px',
                        }}>
                            {field.label || field.name}
                            {field.required && (
                                <Typography component="span" sx={{ color: RED_COLOR, ml: 0.5 }}>
                                    *
                                </Typography>
                            )}
                        </TableCell>
                        <TableCell sx={{
                            borderBottom: index === formData.length - 1 ? 'none' : `1px solid ${alpha(GRAY_COLOR, 0.1)}`,
                            padding: '12px 16px',
                        }}>
                            <Typography variant="body2" sx={{ color: GRAY_COLOR, fontStyle: 'italic' }}>
                                Unsupported field type: {field.type}
                            </Typography>
                        </TableCell>
                    </TableRow>
                );
        }
    };

    const handleMoveToRecycleBin = async (id) => {
        if (!id || !onMoveToRecycleBin) return;

        try {
            await onMoveToRecycleBin(id);
            showSnackbar('Work order moved to recycle bin', 'success');
            setShowFormNotFoundModal(false);
            onClose();
        } catch (error) {
            showSnackbar('Failed to move to recycle bin', 'error');
        }
    };

    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth="lg"
                fullWidth
                fullScreen={isMobile}
                PaperProps={{
                    sx: {
                        bgcolor: 'white',
                        borderRadius: isMobile ? 0 : '5px',
                        maxHeight: isMobile ? '100%' : '90vh',
                        width: isMobile ? '100%' : '1200px',
                    }
                }}
            >
                <DialogTitle sx={{
                    borderBottom: `1px solid ${alpha(GRAY_COLOR, 0.1)}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 1.4,
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                    backgroundColor: 'white',
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
                            {saveLoading ? (
                                <CircularProgress size={20} />
                            ) : (
                                <Save size={20} />
                            )}
                        </Box>
                        <Box>
                            <Typography variant="h6" sx={{
                                fontSize: '1rem',
                                fontWeight: 600,
                                color: TEXT_COLOR,
                                mb: 0,
                            }}>
                                Edit RME Form
                            </Typography>
                            <Typography variant="body2" sx={{
                                fontSize: '0.75rem',
                                color: GRAY_COLOR,
                            }}>
                                {workOrderData?.street || 'Work Order'}
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton
                        size="small"
                        onClick={onClose}
                        disabled={saveLoading}
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

                <DialogContent sx={{ p: 3, overflowY: 'auto' }}>
                    {isLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                            <DashboardLoader />
                        </Box>
                    ) : (
                        <>
                            <Box sx={{ my: 3 }}>
                                <Typography variant="h6" sx={{ fontSize: '0.85rem', fontWeight: 600, mb: 2, color: TEXT_COLOR }}>
                                    Work Order Details
                                </Typography>
                                <Box sx={{
                                    display: 'flex',
                                    gap: 3,
                                    flexWrap: 'wrap',
                                    mb: 3,
                                }}>
                                    <Box>
                                        <Typography variant="body2" sx={{ fontSize: '0.8rem', color: GRAY_COLOR, mb: 0.5 }}>
                                            Address
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontSize: '0.9rem', fontWeight: 600, color: TEXT_COLOR }}>
                                            {workOrderData?.street || 'N/A'}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" sx={{ fontSize: '0.8rem', color: GRAY_COLOR, mb: 0.5 }}>
                                            Technician
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontSize: '0.9rem', fontWeight: 600, color: TEXT_COLOR }}>
                                            {workOrderData?.technician || 'N/A'}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" sx={{ fontSize: '0.8rem', color: GRAY_COLOR, mb: 0.5 }}>
                                            Date
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontSize: '0.9rem', fontWeight: 600, color: TEXT_COLOR }}>
                                            {workOrderData?.date || 'N/A'}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ ml: 'auto' }}>
                                        <Typography variant="body2" sx={{ fontSize: '0.8rem', color: GRAY_COLOR, mb: 0.5 }}>
                                            Work Order #
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontSize: '0.9rem', fontWeight: 600, color: TEXT_COLOR }}>
                                            {workOrderData?.woNumber || 'N/A'}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>

                            {error && (
                                <Alert
                                    severity="error"
                                    sx={{ mb: 2 }}
                                    onClose={() => setError(null)}
                                >
                                    {error}
                                </Alert>
                            )}

                            <Typography variant="h6" sx={{ fontSize: '0.85rem', fontWeight: 600, mb: 2, color: TEXT_COLOR }}>
                                RME Form Fields
                            </Typography>

                            {formData.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <Alert severity="info" sx={{ mb: 2 }}>
                                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                                            No form fields available for this work order
                                        </Typography>
                                    </Alert>
                                </Box>
                            ) : (
                                <TableContainer sx={{
                                    borderRadius: '6px',
                                    border: `1px solid ${alpha(GRAY_COLOR, 0.1)}`,
                                    maxHeight: '400px',
                                    overflowY: 'auto',
                                    '&::-webkit-scrollbar': {
                                        width: '8px',
                                    },
                                    '&::-webkit-scrollbar-track': {
                                        backgroundColor: alpha(GRAY_COLOR, 0.05),
                                    },
                                    '&::-webkit-scrollbar-thumb': {
                                        backgroundColor: alpha(GRAY_COLOR, 0.2),
                                        borderRadius: '4px',
                                    },
                                }}>
                                    <Table size="small" sx={{ minWidth: 600 }}>
                                        <TableBody>
                                            {formData.map((field, index) => renderFormField(field, index))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </>
                    )}
                </DialogContent>

                <DialogActions sx={{
                    p: 3,
                    pt: 2,
                    borderTop: `1px solid ${alpha(GRAY_COLOR, 0.1)}`,
                    position: 'sticky',
                    bottom: 0,
                    backgroundColor: 'white',
                    zIndex: 1,
                }}>
                    <OutlineButton
                        onClick={onClose}
                        variant="outlined"
                        color="error"
                        size="small"
                        disabled={saveLoading}
                        sx={{ minWidth: 100, fontSize: '0.85rem' }}
                    >
                        Cancel
                    </OutlineButton>
                    <UpdateButton
                        onClick={handleSubmit}
                        variant="contained"
                        color="primary"
                        startIcon={saveLoading ? <CircularProgress size={16} color="inherit" /> : <Save size={18} />}
                        disabled={isLoading || saveLoading || formData.length === 0}
                        sx={{ minWidth: 150, fontSize: '0.85rem' }}
                    >
                        {saveLoading ? 'Saving...' : 'Save Changes'}
                    </UpdateButton>
                </DialogActions>
            </Dialog>

            <FormNotFoundModal
                open={showFormNotFoundModal}
                onClose={() => {
                    setShowFormNotFoundModal(false);
                    onClose();
                }}
                workOrderData={workOrderData}
                onMoveToRecycleBin={handleMoveToRecycleBin}
            />
        </>
    );
};

export default EditFormModal;