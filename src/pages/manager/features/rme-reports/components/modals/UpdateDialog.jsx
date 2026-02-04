import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    FormControl,
    InputLabel,
    Button,
    MenuItem,
    IconButton,
    useTheme,
    useMediaQuery,
    Paper
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Save, X, ArrowLeft } from 'lucide-react';
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

const UpdateComponent = ({ item, onSubmit, onClose, showBackButton = false }) => {
    const [formData, setFormData] = useState({
        category: '',
        componentType: '',
        manufacturer: '',
        model: '',
        customLabel: ''
    });

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const categories = Object.keys(septic_components).map((categoryName, index) => ({
        value: (index + 1).toString(),
        label: categoryName
    }));

    // Add empty option for placeholder
    const categoriesWithPlaceholder = [
        { value: '', label: 'Select Category' },
        ...categories
    ];

    const categoryComponents = Object.keys(septic_components).reduce((acc, categoryName, index) => {
        const categoryId = (index + 1).toString();
        const components = Object.keys(septic_components[categoryName]).map(compName => ({
            value: compName,
            label: compName,
            componentData: septic_components[categoryName][compName]
        }));

        acc[categoryId] = [{ value: '', label: 'Select Component Type' }, ...components];
        return acc;
    }, {});

    categoryComponents['default'] = [{ value: '', label: 'Select Component Type' }];

    const getComponentsForCategory = () => {
        if (!formData.category) {
            return [{ value: '', label: 'Select Component Type' }];
        }
        return categoryComponents[formData.category] || categoryComponents['default'];
    };

    const getManufacturersForComponent = () => {
        if (!formData.componentType || !formData.category) {
            return [{ value: '', label: 'Select Manufacturer' }];
        }

        const components = categoryComponents[formData.category];
        const component = components.find(comp => comp.value === formData.componentType);

        if (!component || !component.componentData) {
            return [{ value: '', label: 'Select Manufacturer' }];
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

        return [{ value: '', label: 'Select Manufacturer' }, ...manufacturers];
    };

    const getModelsForManufacturer = () => {
        if (!formData.manufacturer || !formData.componentType || !formData.category) {
            return [{ value: '', label: 'Select Model' }];
        }

        const components = categoryComponents[formData.category];
        const component = components.find(comp => comp.value === formData.componentType);

        if (!component || !component.componentData) {
            return [{ value: '', label: 'Select Model' }];
        }

        const componentData = component.componentData;
        const manufacturerName = Object.keys(componentData).find(manName => {
            return componentData[manName].id === formData.manufacturer;
        });

        if (!manufacturerName) {
            return [{ value: '', label: 'Select Model' }];
        }

        const manufacturerData = componentData[manufacturerName];

        if (!manufacturerData.models || manufacturerData.models.length === 0) {
            return [{ value: '', label: 'No models available' }];
        }

        const models = manufacturerData.models.map(model => ({
            value: model.id,
            label: model.name
        }));

        return [{ value: '', label: 'Select Model' }, ...models];
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
        resetForm();
    };

    const handleClose = () => {
        if (onClose) {
            onClose();
        }
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
        if (item) {
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
    }, [item]);

    // Compact sizing adjustments
    const iconSize = isMobile ? 14 : 16;
    const titleFontSize = isMobile ? '0.85rem' : '1rem';
    const subtitleFontSize = isMobile ? '0.7rem' : '0.75rem';
    const bodyFontSize = isMobile ? '0.75rem' : '0.8rem';
    const captionFontSize = isMobile ? '0.65rem' : '0.7rem';
    const inputFontSize = isMobile ? '0.7rem' : '0.75rem';
    const buttonFontSize = isMobile ? '0.7rem' : '0.75rem';
    const paddingValue = isMobile ? 1 : 1.5;
    const formControlMargin = isMobile ? 0.75 : 1;

    return (
        <Box sx={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5
        }}>
            {/* Header - Matching table style */}
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 0.5
            }}>
                <Typography variant="h6" sx={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: TEXT_COLOR,
                    letterSpacing: '0.3px'
                }}>
                    Update Component
                </Typography>

                {showBackButton && (
                    <IconButton
                        size="small"
                        onClick={onClose}
                        sx={{
                            p: 0.5,
                            '& svg': {
                                fontSize: '1rem'
                            }
                        }}
                    >
                        <ArrowLeft size={16} />
                    </IconButton>
                )}
            </Box>

            {/* Form Container - Matching table container style */}
            <Box sx={{
                borderRadius: '3px',
                border: `1px solid ${alpha(GRAY_COLOR, 0.2)}`,
                backgroundColor: 'white',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Form Fields Container */}
                <Box sx={{
                    p: 1.5,
                    flex: 1,
                    backgroundColor: alpha(GRAY_COLOR, 0.01)
                }}>
                    {/* Category Selection - Table row style */}
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mb: 1.5,
                        p: 1,
                        backgroundColor: alpha(GRAY_COLOR, 0.03),
                        borderRadius: '4px'
                    }}>
                        <Box sx={{ flex: '0 0 140px', minWidth: 0 }}>
                            <Typography variant="body2" sx={{
                                fontSize: '0.7rem',
                                color: GRAY_COLOR,
                                fontWeight: 500
                            }}>
                                Category
                            </Typography>
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <FormControl fullWidth size="small">
                                <StyledSelect
                                    value={formData.category}
                                    onChange={(e) => handleChange('category', e.target.value)}
                                    displayEmpty
                                    sx={{
                                        '& .MuiSelect-select': {
                                            fontSize: '0.8rem',
                                            py: 0.5,
                                            minHeight: 'auto',
                                            fontWeight: 500,
                                            color: formData.category ? TEXT_COLOR : alpha(GRAY_COLOR, 0.7)
                                        }
                                    }}
                                >
                                    {categoriesWithPlaceholder.map((cat) => (
                                        <MenuItem
                                            key={cat.value}
                                            value={cat.value}
                                            sx={{ 
                                                fontSize: '0.8rem', 
                                                py: 0.5,
                                                color: cat.value ? TEXT_COLOR : alpha(GRAY_COLOR, 0.7)
                                            }}
                                        >
                                            {cat.label}
                                        </MenuItem>
                                    ))}
                                </StyledSelect>
                            </FormControl>
                            <Typography variant="caption" sx={{
                                color: 'error.main',
                                fontSize: '0.65rem',
                                mt: 0.5,
                                display: 'block'
                            }}>
                                Required
                            </Typography>
                        </Box>
                    </Box>

                    {/* Component Type - Table row style */}
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mb: 1.5,
                        p: 1,
                        backgroundColor: alpha(GRAY_COLOR, 0.03),
                        borderRadius: '4px'
                    }}>
                        <Box sx={{ flex: '0 0 140px', minWidth: 0 }}>
                            <Typography variant="body2" sx={{
                                fontSize: '0.7rem',
                                color: GRAY_COLOR,
                                fontWeight: 500
                            }}>
                                Component Type
                            </Typography>
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <FormControl fullWidth size="small">
                                <StyledSelect
                                    value={formData.componentType}
                                    onChange={(e) => handleChange('componentType', e.target.value)}
                                    disabled={!formData.category}
                                    displayEmpty
                                    sx={{
                                        '& .MuiSelect-select': {
                                            fontSize: '0.8rem',
                                            py: 0.5,
                                            minHeight: 'auto',
                                            fontWeight: 500,
                                            color: formData.componentType ? TEXT_COLOR : alpha(GRAY_COLOR, 0.7)
                                        }
                                    }}
                                >
                                    {getComponentsForCategory().map((type) => (
                                        <MenuItem
                                            key={type.value}
                                            value={type.value}
                                            sx={{ 
                                                fontSize: '0.8rem', 
                                                py: 0.5,
                                                color: type.value ? TEXT_COLOR : alpha(GRAY_COLOR, 0.7)
                                            }}
                                        >
                                            {type.label}
                                        </MenuItem>
                                    ))}
                                </StyledSelect>
                            </FormControl>
                            <Typography variant="caption" sx={{
                                color: 'error.main',
                                fontSize: '0.65rem',
                                mt: 0.5,
                                display: 'block'
                            }}>
                                Required
                            </Typography>
                        </Box>
                    </Box>

                    {/* Manufacturer - Table row style */}
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mb: 1.5,
                        p: 1,
                        backgroundColor: alpha(GRAY_COLOR, 0.03),
                        borderRadius: '4px'
                    }}>
                        <Box sx={{ flex: '0 0 140px', minWidth: 0 }}>
                            <Typography variant="body2" sx={{
                                fontSize: '0.7rem',
                                color: GRAY_COLOR,
                                fontWeight: 500
                            }}>
                                Manufacturer
                            </Typography>
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <FormControl fullWidth size="small">
                                <StyledSelect
                                    value={formData.manufacturer}
                                    onChange={(e) => handleChange('manufacturer', e.target.value)}
                                    disabled={!formData.componentType}
                                    displayEmpty
                                    sx={{
                                        '& .MuiSelect-select': {
                                            fontSize: '0.8rem',
                                            py: 0.5,
                                            minHeight: 'auto',
                                            fontWeight: 500,
                                            color: formData.manufacturer ? TEXT_COLOR : alpha(GRAY_COLOR, 0.7)
                                        }
                                    }}
                                >
                                    {getManufacturersForComponent().map((man) => (
                                        <MenuItem
                                            key={man.value}
                                            value={man.value}
                                            sx={{ 
                                                fontSize: '0.8rem', 
                                                py: 0.5,
                                                color: man.value ? TEXT_COLOR : alpha(GRAY_COLOR, 0.7)
                                            }}
                                        >
                                            {man.label}
                                        </MenuItem>
                                    ))}
                                </StyledSelect>
                            </FormControl>
                            <Typography variant="caption" sx={{
                                color: 'text.secondary',
                                fontSize: '0.65rem',
                                mt: 0.5,
                                display: 'block'
                            }}>
                                Optional
                            </Typography>
                        </Box>
                    </Box>

                    {/* Model - Table row style */}
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mb: 1.5,
                        p: 1,
                        backgroundColor: alpha(GRAY_COLOR, 0.03),
                        borderRadius: '4px'
                    }}>
                        <Box sx={{ flex: '0 0 140px', minWidth: 0 }}>
                            <Typography variant="body2" sx={{
                                fontSize: '0.7rem',
                                color: GRAY_COLOR,
                                fontWeight: 500
                            }}>
                                Model
                            </Typography>
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <FormControl fullWidth size="small">
                                <StyledSelect
                                    value={formData.model}
                                    onChange={(e) => handleChange('model', e.target.value)}
                                    disabled={!formData.manufacturer}
                                    displayEmpty
                                    sx={{
                                        '& .MuiSelect-select': {
                                            fontSize: '0.8rem',
                                            py: 0.5,
                                            minHeight: 'auto',
                                            fontWeight: 500,
                                            color: formData.model ? TEXT_COLOR : alpha(GRAY_COLOR, 0.7)
                                        }
                                    }}
                                >
                                    {getModelsForManufacturer().map((model) => (
                                        <MenuItem
                                            key={model.value}
                                            value={model.value}
                                            sx={{ 
                                                fontSize: '0.8rem', 
                                                py: 0.5,
                                                color: model.value ? TEXT_COLOR : alpha(GRAY_COLOR, 0.7)
                                            }}
                                        >
                                            {model.label}
                                        </MenuItem>
                                    ))}
                                </StyledSelect>
                            </FormControl>
                            <Typography variant="caption" sx={{
                                color: 'text.secondary',
                                fontSize: '0.65rem',
                                mt: 0.5,
                                display: 'block'
                            }}>
                                Optional
                            </Typography>
                        </Box>
                    </Box>

                    {/* Custom Label - Table row style */}
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        p: 1,
                        backgroundColor: alpha(GRAY_COLOR, 0.03),
                        borderRadius: '4px'
                    }}>
                        <Box sx={{ flex: '0 0 140px', minWidth: 0, pt: 0.5 }}>
                            <Typography variant="body2" sx={{
                                fontSize: '0.7rem',
                                color: GRAY_COLOR,
                                fontWeight: 500
                            }}>
                                Custom Label
                            </Typography>
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <StyledTextField
                                fullWidth
                                size="small"
                                value={formData.customLabel}
                                onChange={(e) => handleChange('customLabel', e.target.value)}
                                placeholder="Enter custom label (optional)"
                                InputProps={{
                                    sx: {
                                        fontSize: '0.8rem',
                                        py: 0.5,
                                        minHeight: 'auto',
                                        fontWeight: 500,
                                        color: formData.customLabel ? TEXT_COLOR : alpha(GRAY_COLOR, 0.7)
                                    }
                                }}
                            />
                            <Typography variant="caption" sx={{
                                color: 'text.secondary',
                                fontSize: '0.65rem',
                                mt: 0.5,
                                display: 'block'
                            }}>
                                Optional
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Footer Actions - Matching table footer style */}
                <Box sx={{
                    borderTop: `1px solid ${alpha(GRAY_COLOR, 0.2)}`,
                    p: 1.5,
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 1,
                    backgroundColor: alpha(GRAY_COLOR, 0.01)
                }}>
                    <OutlineButton
                        variant="outlined"
                        onClick={handleClose}
                        startIcon={<X size={14} />}
                        sx={{
                            fontSize: '0.75rem',
                            py: 0.375,
                            px: 1.5,
                            minHeight: '32px',
                            borderWidth: '1px',
                            '& .MuiButton-startIcon': {
                                mr: 0.5
                            }
                        }}
                    >
                        Cancel
                    </OutlineButton>
                    <UpdateButton
                        variant="contained"
                        onClick={handleSubmit}
                        color="warning"
                        size="small"
                        startIcon={<Save size={14} />}
                        sx={{
                            fontSize: '0.75rem',
                            py: 0.375,
                            px: 1.5,
                            minHeight: '32px',
                            '& .MuiButton-startIcon': {
                                mr: 0.5
                            }
                        }}
                    >
                        Update Component
                    </UpdateButton>
                </Box>
            </Box>
        </Box>
    );
};

export default UpdateComponent;