import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    FormControl,
    InputLabel,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    MenuItem,
    IconButton,
    useTheme,
    useMediaQuery
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Save, X } from 'lucide-react';
import StyledSelect from '../../../../../../components/ui/StyledSelect';
import {
    BLUE_COLOR,
    GRAY_COLOR,
    TEXT_COLOR,
    ORANGE_COLOR,
} from '../../utils/constants';
import OutlineButton from '../../../../../../components/ui/OutlineButton';
import septic_components from '../../data/septic_components.json';
import StyledTextField from '../../../../../../components/ui/StyledTextField';
import UpdateButton from '../../../../../../components/ui/UpdateButton';

const UpdateDialog = ({ open, onClose, item, onSubmit }) => {
    const [formData, setFormData] = useState({
        category: '',
        componentType: '',
        manufacturer: '',
        model: '',
        customLabel: ''
    });

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

    const categories = Object.keys(septic_components).map((categoryName, index) => ({
        value: (index + 1).toString(),
        label: categoryName
    }));

    const categoryComponents = Object.keys(septic_components).reduce((acc, categoryName, index) => {
        const categoryId = (index + 1).toString();
        const components = Object.keys(septic_components[categoryName]).map(compName => ({
            value: compName,
            label: compName,
            componentData: septic_components[categoryName][compName]
        }));

        acc[categoryId] = [{ value: '', label: '' }, ...components];
        return acc;
    }, {});

    categoryComponents['default'] = [{ value: '', label: '' }];

    const getComponentsForCategory = () => {
        if (!formData.category) {
            return [{ value: '', label: '' }];
        }
        return categoryComponents[formData.category] || categoryComponents['default'];
    };

    const getManufacturersForComponent = () => {
        if (!formData.componentType || !formData.category) {
            return [{ value: '', label: '' }];
        }

        const components = categoryComponents[formData.category];
        const component = components.find(comp => comp.value === formData.componentType);

        if (!component || !component.componentData) {
            return [{ value: '', label: '' }];
        }

        const componentData = component.componentData;
        const manufacturerNames = Object.keys(componentData);

        const manufacturers = manufacturerNames.map(manName => {
            const manData = componentData[manName];
            return {
                value: manData.id,
                label: manName,
                manufacturerData: manData
            };
        });

        return [{ value: '', label: '' }, ...manufacturers];
    };

    const getModelsForManufacturer = () => {
        if (!formData.manufacturer || !formData.componentType || !formData.category) {
            return [{ value: '', label: '' }];
        }

        const components = categoryComponents[formData.category];
        const component = components.find(comp => comp.value === formData.componentType);

        if (!component || !component.componentData) {
            return [{ value: '', label: '' }];
        }

        const componentData = component.componentData;
        const manufacturerName = Object.keys(componentData).find(manName => {
            return componentData[manName].id === formData.manufacturer;
        });

        if (!manufacturerName) {
            return [{ value: '', label: '' }];
        }

        const manufacturerData = componentData[manufacturerName];

        if (!manufacturerData.models || manufacturerData.models.length === 0) {
            return [{ value: '', label: '' }];
        }

        const models = manufacturerData.models.map(model => ({
            value: model.id,
            label: model.name
        }));

        return [{ value: '', label: '' }, ...models];
    };

    const handleChange = (field, value) => {
        if (field === 'category') {
            setFormData(prev => ({
                ...prev,
                [field]: value,
                componentType: '',
                manufacturer: '',
                model: ''
            }));
        }
        else if (field === 'componentType') {
            setFormData(prev => ({
                ...prev,
                [field]: value,
                manufacturer: '',
                model: ''
            }));
        }
        else if (field === 'manufacturer') {
            setFormData(prev => ({
                ...prev,
                [field]: value,
                model: ''
            }));
        }
        else {
            setFormData(prev => ({
                ...prev,
                [field]: value
            }));
        }
    };

    const handleSubmit = () => {
        const submittedData = {
            id: item.id,
            category: categories.find(cat => cat.value === formData.category)?.label || '',
            componentType: getComponentsForCategory().find(comp => comp.value === formData.componentType)?.label || '',
            manufacturer: getManufacturersForComponent().find(man => man.value === formData.manufacturer)?.label || '',
            model: getModelsForManufacturer().find(mod => mod.value === formData.model)?.label || '',
            customLabel: formData.customLabel
        };

        onSubmit(item.id, submittedData);
        onClose();
        resetForm();
    };

    const handleClose = () => {
        onClose();
        resetForm();
    };

    const resetForm = () => {
        setFormData({
            category: '',
            componentType: '',
            manufacturer: '',
            model: '',
            customLabel: ''
        });
    };

    useEffect(() => {
        if (item && open) {
            let categoryId = '';
            if (item.category) {
                const foundCategory = categories.find(cat =>
                    cat.label === item.category || cat.value === item.category
                );
                categoryId = foundCategory ? foundCategory.value : '';
            }

            let componentTypeValue = '';
            if (item.componentType && categoryId) {
                const components = getComponentsForCategory();
                const foundComponent = components.find(comp =>
                    comp.label === item.componentType || comp.value === item.componentType
                );
                componentTypeValue = foundComponent ? foundComponent.value : '';
            }

            let manufacturerId = '';
            if (item.manufacturer && categoryId && componentTypeValue) {
                const manufacturers = getManufacturersForComponent();
                const foundManufacturer = manufacturers.find(man =>
                    man.label === item.manufacturer || man.value === item.manufacturer
                );
                manufacturerId = foundManufacturer ? foundManufacturer.value : '';
            }

            let modelId = '';
            if (item.model && manufacturerId) {
                const models = getModelsForManufacturer();
                const foundModel = models.find(mod =>
                    mod.label === item.model || mod.value === item.model
                );
                modelId = foundModel ? foundModel.value : '';
            }

            setFormData({
                category: categoryId,
                componentType: componentTypeValue,
                manufacturer: manufacturerId,
                model: modelId,
                customLabel: item.customLabel || ''
            });
        }
    }, [item, open]);

    // Responsive sizing adjustments
    const dialogMaxWidth = isMobile ? 'sm' : 'md';
    const iconSize = isMobile ? 16 : 18;
    const titleFontSize = isMobile ? '0.9rem' : '0.95rem';
    const subtitleFontSize = isMobile ? '0.75rem' : '0.8rem';
    const bodyFontSize = isMobile ? '0.8rem' : '0.85rem';
    const captionFontSize = isMobile ? '0.7rem' : '0.75rem';
    const inputFontSize = isMobile ? '0.75rem' : '0.8rem';
    const buttonFontSize = isMobile ? '0.75rem' : '0.8rem';
    const dialogPadding = isMobile ? 1 : 2;

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth={dialogMaxWidth}
            fullWidth
            fullScreen={isMobile}
            PaperProps={{
                sx: {
                    bgcolor: 'white',
                    borderRadius: isMobile ? 0 : '5px',
                    height: isMobile ? '100%' : 'auto',
                    maxHeight: isMobile ? '100%' : '90vh',
                    m: 0,
                }
            }}
        >
            <DialogTitle sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                py: isMobile ? 1.5 : 1.5,
                px: isMobile ? 1.5 : 2,
            }}>
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: isMobile ? 1 : 2,
                    flex: 1,
                    mr: 1
                }}>
                    <Box sx={{
                        width: isMobile ? 32 : 36,
                        height: isMobile ? 32 : 36,
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: alpha(BLUE_COLOR, 0.1),
                        color: BLUE_COLOR,
                        flexShrink: 0
                    }}>
                        <Save size={isMobile ? 16 : 18} />
                    </Box>
                    <Box sx={{
                        flex: 1,
                        minWidth: 0 // Prevents overflow
                    }}>
                        <Typography variant="h6" sx={{
                            fontSize: titleFontSize,
                            fontWeight: 600,
                            color: TEXT_COLOR,
                            lineHeight: 1.2,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}>
                            Update Septic Components
                        </Typography>
                        <Typography variant="body2" sx={{
                            fontSize: subtitleFontSize,
                            color: GRAY_COLOR,
                            lineHeight: 1.2,
                            mt: 0.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}>
                            ID: {item?.id || 'N/A'} {!isSmallScreen && '|'} {isSmallScreen ? <br /> : ' '}
                            Tech: {item?.technician || 'N/A'}
                        </Typography>
                    </Box>
                </Box>
                <IconButton
                    size="small"
                    onClick={handleClose}
                    sx={{
                        color: GRAY_COLOR,
                        '&:hover': {
                            backgroundColor: alpha(GRAY_COLOR, 0.1),
                        },
                        flexShrink: 0
                    }}
                >
                    <X size={iconSize} />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{
                py: isMobile ? 1.5 : 2,
                px: isMobile ? 1.5 : 2,
                flex: 1,
                overflow: 'auto'
            }}>
                <Box sx={{
                    border: '1px solid #e0e0e0',
                    borderRadius: 1,
                    p: isMobile ? 1 : 1.5,
                }}>
                    <Box sx={{ mb: isMobile ? 1 : 1.5 }}>
                        <Typography variant="body2" sx={{
                            mb: 1,
                            fontWeight: 500,
                            fontSize: bodyFontSize
                        }}>
                            1. Select A Category
                        </Typography>
                        <FormControl fullWidth size="small">
                            <InputLabel sx={{ fontSize: inputFontSize }}>Category</InputLabel>
                            <StyledSelect
                                value={formData.category}
                                onChange={(e) => handleChange('category', e.target.value)}
                                label="Category"
                                sx={{
                                    '& .MuiSelect-select': {
                                        fontSize: inputFontSize,

                                    }
                                }}
                            >
                                {categories.map((cat) => (
                                    <MenuItem
                                        key={cat.value}
                                        value={cat.value}
                                        sx={{ fontSize: inputFontSize }}
                                    >
                                        {cat.label}
                                    </MenuItem>
                                ))}
                            </StyledSelect>
                        </FormControl>
                        <Typography variant="caption" sx={{
                            color: 'error.main',
                            fontSize: captionFontSize
                        }}>
                            (Required)
                        </Typography>
                    </Box>

                    <Box sx={{ mb: isMobile ? 1 : 1.5 }}>
                        <Typography variant="body2" sx={{
                            mb: 1,
                            fontWeight: 500,
                            fontSize: bodyFontSize
                        }}>
                            2. Select A Component
                        </Typography>
                        <FormControl fullWidth size="small">
                            <InputLabel sx={{ fontSize: inputFontSize }}>Component Type</InputLabel>
                            <StyledSelect
                                value={formData.componentType}
                                onChange={(e) => handleChange('componentType', e.target.value)}
                                label="Component Type"
                                disabled={!formData.category}
                                sx={{
                                    '& .MuiSelect-select': {
                                        fontSize: inputFontSize,

                                    }
                                }}
                            >
                                {getComponentsForCategory().map((type) => (
                                    <MenuItem
                                        key={type.value}
                                        value={type.value}
                                        sx={{ fontSize: inputFontSize }}
                                    >
                                        {type.label}
                                    </MenuItem>
                                ))}
                            </StyledSelect>
                        </FormControl>
                        <Typography variant="caption" sx={{
                            color: 'error.main',
                            fontSize: captionFontSize
                        }}>
                            (Required)
                        </Typography>
                    </Box>

                    <Box sx={{ mb: isMobile ? 1 : 1.5 }}>
                        <Typography variant="body2" sx={{
                            mb: 1,
                            fontWeight: 500,
                            fontSize: bodyFontSize
                        }}>
                            3. Select The Manufacturer
                        </Typography>
                        <FormControl fullWidth size="small">
                            <InputLabel sx={{ fontSize: inputFontSize }}>Manufacturer</InputLabel>
                            <StyledSelect
                                value={formData.manufacturer}
                                onChange={(e) => handleChange('manufacturer', e.target.value)}
                                label="Manufacturer"
                                disabled={!formData.componentType}
                                sx={{
                                    '& .MuiSelect-select': {
                                        fontSize: inputFontSize,

                                    }
                                }}
                            >
                                {getManufacturersForComponent().map((man) => (
                                    <MenuItem
                                        key={man.value}
                                        value={man.value}
                                        sx={{ fontSize: inputFontSize }}
                                    >
                                        {man.label}
                                    </MenuItem>
                                ))}
                            </StyledSelect>
                        </FormControl>
                        <Typography variant="caption" sx={{
                            color: 'maroon',
                            fontSize: captionFontSize
                        }}>
                            (optional)
                        </Typography>
                    </Box>

                    <Box sx={{ mb: isMobile ? 1 : 1.5 }}>
                        <Typography variant="body2" sx={{
                            mb: 1,
                            fontWeight: 500,
                            fontSize: bodyFontSize
                        }}>
                            4. Select The Model
                        </Typography>
                        <FormControl fullWidth size="small">
                            <InputLabel sx={{ fontSize: inputFontSize }}>Model</InputLabel>
                            <StyledSelect
                                value={formData.model}
                                onChange={(e) => handleChange('model', e.target.value)}
                                label="Model"
                                disabled={!formData.manufacturer}
                                sx={{
                                    '& .MuiSelect-select': {
                                        fontSize: inputFontSize,

                                    }
                                }}
                            >
                                {getModelsForManufacturer().map((model) => (
                                    <MenuItem
                                        key={model.value}
                                        value={model.value}
                                        sx={{ fontSize: inputFontSize }}
                                    >
                                        {model.label}
                                    </MenuItem>
                                ))}
                            </StyledSelect>
                        </FormControl>
                        <Typography variant="caption" sx={{
                            color: 'maroon',
                            fontSize: captionFontSize
                        }}>
                            (optional)
                        </Typography>
                    </Box>

                    <Box sx={{ mb: 0.5 }}>
                        <Typography variant="body2" sx={{
                            mb: 1,
                            fontWeight: 500,
                            fontSize: bodyFontSize
                        }}>
                            5. Add a Custom Label
                        </Typography>
                        <StyledTextField
                            fullWidth
                            size="small"
                            value={formData.customLabel}
                            onChange={(e) => handleChange('customLabel', e.target.value)}
                            placeholder="Enter custom label"
                            InputProps={{
                                sx: {
                                    fontSize: inputFontSize,
                                }
                            }}
                        />
                        <Typography variant="caption" sx={{
                            color: 'maroon',
                            fontSize: captionFontSize
                        }}>
                            (optional)
                        </Typography>
                    </Box>
                </Box>
            </DialogContent>

            <DialogActions sx={{
                borderTop: `1px solid ${alpha(GRAY_COLOR, 0.1)}`,
                py: isMobile ? 1 : 1.5,
                px: isMobile ? 1.5 : 2,
                gap: isMobile ? 0.5 : 1,
                flexWrap: isMobile ? 'wrap' : 'nowrap'
            }}>
                <OutlineButton
                    variant="outlined"
                    onClick={handleClose}
                    startIcon={<X size={isMobile ? 14 : 16} />}
                    sx={{
                        fontSize: buttonFontSize,
                        minWidth: isMobile ? 'calc(50% - 4px)' : 'auto',
                        flex: isMobile ? 1 : 'none'
                    }}
                >
                    Cancel
                </OutlineButton>
                <UpdateButton
                    variant="contained"
                    onClick={handleSubmit}
                    color="warning"
                    size="small"
                    startIcon={<Save size={isMobile ? 12 : 14} />}
                >
                    Update Component
                </UpdateButton>
            </DialogActions>
        </Dialog>
    );
};

export default UpdateDialog;