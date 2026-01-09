import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    TextField,
    InputAdornment,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Snackbar,
    Alert,
    CircularProgress,
    Avatar,
    Stack,
    Checkbox,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Radio,
    RadioGroup,
    FormControlLabel,
    Tooltip,
    IconButton,
    Menu,
} from '@mui/material';
import {
    Search as SearchIcon,
    PhoneCallback as PhoneCallbackIcon,
    Emergency as EmergencyIcon,
    Schedule as ScheduleIcon,
    AccessTime as AccessTimeIcon,
    Person as PersonIcon,
    CheckCircle as CheckCircleIcon,
    MoreVert as MoreVertIcon,
    LocalOffer as LocalOfferIcon,
    Sync as SyncIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import StyledTextField from '../../../components/ui/StyledTextField';
import OutlineButton from '../../../components/ui/OutlineButton';
import { alpha } from '@mui/material/styles';
import axiosInstance from '../../../api/axios';
import { format, addBusinessDays, addHours, isBefore, differenceInHours, differenceInBusinessDays } from 'date-fns';

const BLUE_COLOR = '#76AADA';
const BLUE_DARK = '#5A8FC8';
const GREEN_COLOR = '#10b981';
const RED_COLOR = '#ef4444';
const GRAY_COLOR = '#6b7280';
const ORANGE_COLOR = '#f97316';
const PURPLE_COLOR = '#8b5cf6';
const YELLOW_COLOR = '#f59e0b';

const LOCATE_TYPE_CONFIG = {
    STANDARD: {
        label: 'Standard',
        color: BLUE_COLOR,
        bgColor: alpha(BLUE_COLOR, 0.1),
        icon: <ScheduleIcon fontSize="small" />,
        timeLimit: '2 business days',
        timerColor: BLUE_COLOR,
    },
    EMERGENCY: {
        label: 'Emergency',
        color: RED_COLOR,
        bgColor: alpha(RED_COLOR, 0.1),
        icon: <EmergencyIcon fontSize="small" />,
        timeLimit: '4 hours',
        timerColor: RED_COLOR,
    },
};

// Improved address parser
const parseDashboardAddress = (fullAddress) => {
    if (!fullAddress) return { street: '', city: '', state: '', zip: '', original: '' };

    try {
        // Try splitting by ' - ' first
        const parts = fullAddress.split(' - ');
        if (parts.length >= 2) {
            const street = parts[0].trim();
            const remaining = parts[1].trim();

            // Try to extract zip code (5 digits at end)
            const zipMatch = remaining.match(/\b(\d{5})\b/);
            const zip = zipMatch ? zipMatch[1] : '';

            // Remove zip from remaining
            let withoutZip = remaining.replace(zip, '').trim();

            // Split by comma for city, state
            const cityStateParts = withoutZip.split(',');
            if (cityStateParts.length >= 2) {
                const city = cityStateParts[0].trim();
                const state = cityStateParts[1].trim();
                return { street, city, state, zip, original: fullAddress };
            } else {
                // If no comma, try to split by space
                const spaceParts = withoutZip.split(' ');
                if (spaceParts.length >= 2) {
                    const state = spaceParts.pop();
                    const city = spaceParts.join(' ');
                    return { street, city, state, zip, original: fullAddress };
                }
            }
        }

        // If ' - ' split didn't work, return original as street
        return { street: fullAddress, city: '', state: '', zip: '', original: fullAddress };
    } catch (error) {
        console.error('Error parsing address:', error);
        return { street: fullAddress || '', city: '', state: '', zip: '', original: fullAddress };
    }
};

const Locates = () => {
    const queryClient = useQueryClient();

    const [searchQuery, setSearchQuery] = useState('');
    const [searchQueryExcavator, setSearchQueryExcavator] = useState('');
    const [searchQueryInProgress, setSearchQueryInProgress] = useState('');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [typeFilterExcavator, setTypeFilterExcavator] = useState('ALL');
    const [typeFilterInProgress, setTypeFilterInProgress] = useState('ALL');
    const [removeCheckedLocates, setRemoveCheckedLocates] = useState(new Set());
    const [removeCheckedExcavatorLocates, setRemoveCheckedExcavatorLocates] = useState(new Set());
    const [removeCheckedInProgressLocates, setRemoveCheckedInProgressLocates] = useState(new Set());
    const [openRemoveConfirmDialog, setOpenRemoveConfirmDialog] = useState(false);
    const [openRemoveExcavatorConfirmDialog, setOpenRemoveExcavatorConfirmDialog] = useState(false);
    const [openRemoveInProgressConfirmDialog, setOpenRemoveInProgressConfirmDialog] = useState(false);

    // New state for excavator locates call status
    const [excavatorCallStatus, setExcavatorCallStatus] = useState({});
    const [calledInBy, setCalledInBy] = useState({});

    // State for row menu
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedLocate, setSelectedLocate] = useState(null);
    const [openTagDialog, setOpenTagDialog] = useState(false);

    // New state for manual tag form
    const [tagFormData, setTagFormData] = useState({
        name: '',
        email: ''
    });

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success',
    });

    // Fetch completed locates
    const { data: completedLocatesResponse = [], isLoading, refetch } = useQuery({
        queryKey: ['completed-locates'],
        queryFn: async () => {
            const response = await axiosInstance.get('/locates/all-locates');
            return Array.isArray(response.data)
                ? response.data
                : response.data?.data || response.data || [];
        },
    });

    // Mutation for syncing from Dashboard server
    const syncDashboardMutation = useMutation({
        mutationFn: () => axiosInstance.get('/locates/sync-dashboard'),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['completed-locates'] });
            showSnackbar('Successfully synced locates from Dashboard server', 'success');
        },
        onError: (error) => {
            console.error('Sync error:', error);
            showSnackbar(error.response?.data?.message || 'Failed to sync from Dashboard server', 'error');
        },
    });

    // Process completed locates with proper field mapping
    const completedLocates = React.useMemo(() => {
        if (!Array.isArray(completedLocatesResponse) || completedLocatesResponse.length === 0) {
            return [];
        }

        // Flatten and map the work orders
        return completedLocatesResponse
            .flatMap((item) => item.workOrders || [])
            .map((workOrder) => {
                // Parse address
                const addressInfo = parseDashboardAddress(workOrder.customerAddress || '');

                // Determine type - check priorityName or type field
                let locateType = 'STANDARD';
                if (workOrder.type) {
                    locateType = workOrder.type.toUpperCase().includes('EMERGENCY') ? 'EMERGENCY' : 'STANDARD';
                } else if (workOrder.priorityName) {
                    locateType = workOrder.priorityName.toUpperCase().includes('EMERGENCY') ? 'EMERGENCY' : 'STANDARD';
                }

                // Check if excavator locate needs a call (default true for excavator priority)
                const needsCall = workOrder.priorityName &&
                    workOrder.priorityName.toUpperCase() === 'EXCAVATOR' &&
                    !workOrder.locatesCalled;

                // Calculate timer information
                let timeRemaining = null;
                let isTimerExpired = false;
                let completionDate = null;

                if (workOrder.locatesCalled && workOrder.calledAt && workOrder.callType) {
                    const calledAt = new Date(workOrder.calledAt);
                    const typeConfig = LOCATE_TYPE_CONFIG[workOrder.callType] || LOCATE_TYPE_CONFIG.STANDARD;

                    if (workOrder.callType === 'EMERGENCY') {
                        completionDate = addHours(calledAt, 4);
                    } else {
                        // Standard - add 2 business days
                        completionDate = addBusinessDays(calledAt, 2);
                    }

                    const now = new Date();
                    isTimerExpired = isBefore(completionDate, now);

                    if (!isTimerExpired) {
                        if (workOrder.callType === 'EMERGENCY') {
                            timeRemaining = differenceInHours(completionDate, now);
                        } else {
                            timeRemaining = differenceInBusinessDays(completionDate, now);
                        }
                    }
                }

                return {
                    _id: workOrder._id || `external-${workOrder.workOrderNumber || Math.random().toString(36).substr(2, 9)}`,
                    jobId: workOrder.workOrderNumber || 'N/A',
                    customerName: workOrder.customerName || 'Unknown Customer',
                    address: addressInfo.street,
                    city: addressInfo.city,
                    state: addressInfo.state,
                    zip: addressInfo.zip,
                    fullAddress: workOrder.customerAddress || '',
                    description: workOrder.task || 'Locate Required',
                    type: locateType,
                    technician: workOrder.techName || workOrder.technician || 'Unknown',
                    techName: workOrder.techName || workOrder.technician || 'Unknown',
                    requestedDate: workOrder.createdDate || workOrder.requestedDate,
                    completedAt: workOrder.completedDate,
                    duration: workOrder.taskDuration || workOrder.duration || '',
                    priorityColor: workOrder.priorityColor || GREEN_COLOR,
                    priorityName: workOrder.priorityName || 'Standard',
                    locatesCalled: workOrder.locatesCalled || false,
                    callType: workOrder.callType || null, // 'STANDARD' or 'EMERGENCY'
                    needsCall: needsCall,
                    calledAt: workOrder.calledAt,
                    calledBy: workOrder.calledBy || '',
                    timeRemaining: timeRemaining,
                    isTimerExpired: isTimerExpired,
                    completionDate: completionDate,
                    manuallyTagged: workOrder.manuallyTagged || false,
                    taggedBy: workOrder.taggedBy || '',
                    taggedByEmail: workOrder.taggedByEmail || '',
                    taggedAt: workOrder.taggedAt || '',
                };
            });
    }, [completedLocatesResponse]);

    // Filter for excavator priority locates (CALL NEEDED)
    const excavatorLocates = React.useMemo(() => {
        return completedLocates.filter(locate =>
            (locate.priorityName && locate.priorityName.toUpperCase() === 'EXCAVATOR') ||
            locate.manuallyTagged
        );
    }, [completedLocates]);

    // Filter for in progress locates
    const inProgressLocates = React.useMemo(() => {
        return completedLocates.filter(locate =>
            locate.locatesCalled &&
            !locate.isTimerExpired
        );
    }, [completedLocates]);

    // Filter for completed locates (timer expired)
    const completedLocatesList = React.useMemo(() => {
        return completedLocates.filter(locate =>
            locate.locatesCalled &&
            locate.isTimerExpired
        );
    }, [completedLocates]);

    // Mutation for updating call status
    const updateCallStatusMutation = useMutation({
        mutationFn: ({ id, callType, calledBy }) =>
            axiosInstance.patch(`/locates/work-order/${id}/update-call-status`, {
                locatesCalled: true,
                callType: callType,
                calledAt: new Date().toISOString(),
                calledBy: calledBy,
            }),
        onSuccess: (response, variables) => {
            setExcavatorCallStatus(prev => ({
                ...prev,
                [variables.id]: variables.callType
            }));

            if (variables.calledBy) {
                setCalledInBy(prev => ({
                    ...prev,
                    [variables.id]: variables.calledBy
                }));
            }

            queryClient.invalidateQueries({ queryKey: ['completed-locates'] });
            showSnackbar(`Locates marked as ${variables.callType === 'EMERGENCY' ? 'Emergency' : 'Standard'} call`, 'success');
        },
        onError: (error) => {
            console.error('Update call status error:', error);
            showSnackbar(error.response?.data?.message || 'Failed to update call status', 'error');
        },
    });

    // Mutation for manually tagging individual locate by workOrderNumber
    const tagIndividualLocateMutation = useMutation({
        mutationFn: ({ workOrderNumber, name, email }) =>
            axiosInstance.post('/locates/tag-locates-needed', {
                workOrderNumber: workOrderNumber,
                name: name,
                email: email,
                manuallyTagged: true,
                taggedAt: new Date().toISOString(),
            }),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['completed-locates'] });
            setOpenTagDialog(false);
            setSelectedLocate(null);
            setTagFormData({ name: '', email: '' });
            showSnackbar('Locate manually tagged successfully', 'success');
        },
        onError: (error) => {
            console.error('Tag individual locate error:', error);
            showSnackbar(error.response?.data?.message || 'Failed to tag locate', 'error');
        },
    });

    // Fixed Delete mutation for regular locates
    const deleteLocateMutation = useMutation({
        mutationFn: (ids) => axiosInstance.delete('/locates/work-order/bulk-delete', {
            data: { ids: Array.from(ids) }
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['completed-locates'] });
            setRemoveCheckedLocates(new Set());
            setOpenRemoveConfirmDialog(false);
            showSnackbar('Locate(s) removed successfully', 'success');
        },
        onError: (error) => {
            console.error('Delete error:', error);
            showSnackbar(error.response?.data?.message || 'Failed to remove locate(s)', 'error');
        },
    });

    // Delete mutation for excavator locates
    const deleteExcavatorLocateMutation = useMutation({
        mutationFn: (ids) => axiosInstance.delete('/locates/work-order/bulk-delete', {
            data: { ids: Array.from(ids) }
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['completed-locates'] });
            setRemoveCheckedExcavatorLocates(new Set());
            setOpenRemoveExcavatorConfirmDialog(false);
            showSnackbar('Excavator locate(s) removed successfully', 'success');
        },
        onError: (error) => {
            console.error('Delete error:', error);
            showSnackbar(error.response?.data?.message || 'Failed to remove excavator locate(s)', 'error');
        },
    });

    // Delete mutation for in progress locates
    const deleteInProgressLocateMutation = useMutation({
        mutationFn: (ids) => axiosInstance.delete('/locates/work-order/bulk-delete', {
            data: { ids: Array.from(ids) }
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['completed-locates'] });
            setRemoveCheckedInProgressLocates(new Set());
            setOpenRemoveInProgressConfirmDialog(false);
            showSnackbar('In progress locate(s) removed successfully', 'success');
        },
        onError: (error) => {
            console.error('Delete error:', error);
            showSnackbar(error.response?.data?.message || 'Failed to remove in progress locate(s)', 'error');
        },
    });

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    // Handle call status change for excavator locates
    const handleCallStatusChange = (locateId, callType) => {
        const managerName = prompt('Please enter your name (manager):');
        if (!managerName) {
            showSnackbar('Manager name is required to mark call status', 'warning');
            return;
        }

        updateCallStatusMutation.mutate({
            id: locateId,
            callType: callType,
            calledBy: managerName
        });
    };

    // Handle manual tagging for individual locate
    const handleIndividualManualTag = (locate) => {
        console.log('Manual tag data for locate:', locate);
        setSelectedLocate(locate);
        setOpenTagDialog(true);
        // Reset form data
        setTagFormData({ name: '', email: '' });
    };

    const handleConfirmIndividualTag = () => {
        if (!selectedLocate) return;

        // Validate form data
        if (!tagFormData.name.trim()) {
            showSnackbar('Name is required to tag locate', 'warning');
            return;
        }

        if (!tagFormData.email.trim() || !isValidEmail(tagFormData.email)) {
            showSnackbar('Valid email is required', 'warning');
            return;
        }

        tagIndividualLocateMutation.mutate({
            workOrderNumber: selectedLocate.jobId,
            name: tagFormData.name.trim(),
            email: tagFormData.email.trim()
        });
    };

    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setTagFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle row menu open
    const handleMenuOpen = (event, locate) => {
        setAnchorEl(event.currentTarget);
        setSelectedLocate(locate);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedLocate(null);
    };

    // Handle sync from Dashboard
    const handleSyncDashboard = () => {
        if (window.confirm('Are you sure you want to sync locates from the Dashboard server? This will fetch the latest completed work orders.')) {
            syncDashboardMutation.mutate();
        }
    };

    // Filtering for regular locates
    const filteredLocates = completedLocatesList.filter((locate) => {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
            !searchQuery ||
            (locate.jobId && locate.jobId.toLowerCase().includes(searchLower)) ||
            (locate.address && locate.address.toLowerCase().includes(searchLower)) ||
            (locate.customerName && locate.customerName.toLowerCase().includes(searchLower)) ||
            (locate.description && locate.description.toLowerCase().includes(searchLower));

        const matchesType = typeFilter === 'ALL' || locate.type === typeFilter;

        return matchesSearch && matchesType;
    });

    // Filtering for excavator locates
    const filteredExcavatorLocates = excavatorLocates.filter((locate) => {
        const searchLower = searchQueryExcavator.toLowerCase();
        const matchesSearch =
            !searchQueryExcavator ||
            (locate.jobId && locate.jobId.toLowerCase().includes(searchLower)) ||
            (locate.address && locate.address.toLowerCase().includes(searchLower)) ||
            (locate.customerName && locate.customerName.toLowerCase().includes(searchLower)) ||
            (locate.description && locate.description.toLowerCase().includes(searchLower));

        const matchesType = typeFilterExcavator === 'ALL' || locate.type === typeFilterExcavator;

        return matchesSearch && matchesType;
    });

    // Filtering for in progress locates
    const filteredInProgressLocates = inProgressLocates.filter((locate) => {
        const searchLower = searchQueryInProgress.toLowerCase();
        const matchesSearch =
            !searchQueryInProgress ||
            (locate.jobId && locate.jobId.toLowerCase().includes(searchLower)) ||
            (locate.address && locate.address.toLowerCase().includes(searchLower)) ||
            (locate.customerName && locate.customerName.toLowerCase().includes(searchLower)) ||
            (locate.description && locate.description.toLowerCase().includes(searchLower));

        const matchesType = typeFilterInProgress === 'ALL' || locate.type === typeFilterInProgress;

        return matchesSearch && matchesType;
    });

    const toggleRemoveCheckbox = (locateId) => {
        const newSet = new Set(removeCheckedLocates);
        if (newSet.has(locateId)) {
            newSet.delete(locateId);
        } else {
            newSet.add(locateId);
        }
        setRemoveCheckedLocates(newSet);
    };

    const toggleExcavatorRemoveCheckbox = (locateId) => {
        const newSet = new Set(removeCheckedExcavatorLocates);
        if (newSet.has(locateId)) {
            newSet.delete(locateId);
        } else {
            newSet.add(locateId);
        }
        setRemoveCheckedExcavatorLocates(newSet);
    };

    const toggleInProgressRemoveCheckbox = (locateId) => {
        const newSet = new Set(removeCheckedInProgressLocates);
        if (newSet.has(locateId)) {
            newSet.delete(locateId);
        } else {
            newSet.add(locateId);
        }
        setRemoveCheckedInProgressLocates(newSet);
    };

    const handleConfirmRemove = () => {
        if (removeCheckedLocates.size === 0) return;
        const idsToDelete = Array.from(removeCheckedLocates);
        deleteLocateMutation.mutate(idsToDelete);
    };

    const handleConfirmExcavatorRemove = () => {
        if (removeCheckedExcavatorLocates.size === 0) return;
        const idsToDelete = Array.from(removeCheckedExcavatorLocates);
        deleteExcavatorLocateMutation.mutate(idsToDelete);
    };

    const handleConfirmInProgressRemove = () => {
        if (removeCheckedInProgressLocates.size === 0) return;
        const idsToDelete = Array.from(removeCheckedInProgressLocates);
        deleteInProgressLocateMutation.mutate(idsToDelete);
    };

    const formatDate = (dateString) => {
        if (!dateString || dateString === 'N/A') return 'N/A';
        try {
            if (typeof dateString === 'string') {
                if (dateString.includes('/')) {
                    const [datePart] = dateString.split(' ');
                    const [month, day, year] = datePart.split('/');
                    const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
                    return format(date, 'MMM dd, yyyy');
                }
            }
            return format(new Date(dateString), 'MMM dd, yyyy');
        } catch {
            return dateString || 'N/A';
        }
    };

    const getTechnicianName = (techName) => {
        if (!techName || techName === 'Unknown') return 'Unassigned';
        return techName;
    };

    const formatTimeRemaining = (locate) => {
        if (!locate.timeRemaining) return 'Calculating...';

        if (locate.callType === 'EMERGENCY') {
            const hours = Math.floor(locate.timeRemaining);
            const minutes = Math.round((locate.timeRemaining - hours) * 60);
            return `${hours}h ${minutes}m remaining`;
        } else {
            return `${locate.timeRemaining} business day${locate.timeRemaining !== 1 ? 's' : ''} remaining`;
        }
    };

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress sx={{ color: BLUE_COLOR }} />
            </Box>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography
                        sx={{
                            fontWeight: 'bold',
                            mb: 0.5,
                            fontSize: 20,
                            background: `linear-gradient(135deg, ${BLUE_DARK} 0%, ${BLUE_COLOR} 100%)`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}
                    >
                        Locates Management
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Manage locate calls and track progress
                    </Typography>
                </Box>
                <Box display="flex" gap={2}>
                    <Button
                        variant="contained"
                        startIcon={<SyncIcon />}
                        onClick={handleSyncDashboard}
                        disabled={syncDashboardMutation.isPending || isLoading}
                        sx={{
                            bgcolor: BLUE_COLOR,
                            '&:hover': { bgcolor: BLUE_DARK },
                            textTransform: 'none',
                            fontWeight: 600,
                        }}
                    >
                        {syncDashboardMutation.isPending ? 'Syncing...' : 'Sync from Dashboard'}
                    </Button>
                    <OutlineButton
                        onClick={() => refetch()}
                        disabled={isLoading}
                        startIcon={<SyncIcon />}
                    >
                        Refresh
                    </OutlineButton>
                </Box>
            </Box>

            {/* Excavator Priority Locates Table - CALL NEEDED */}
            <Paper
                elevation={0}
                sx={{
                    borderRadius: 2,
                    border: `1px solid ${alpha(ORANGE_COLOR, 0.2)}`,
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    mb: 4,
                }}
            >
                <Box
                    sx={{
                        p: 1.5,
                        borderBottom: `2px solid ${ORANGE_COLOR}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        bgcolor: alpha(ORANGE_COLOR, 0.05),
                    }}
                >
                    <Box display="flex" alignItems="center" gap={1}>
                        <Box display="flex" alignItems="center" gap={1}>
                            <PhoneCallbackIcon sx={{ color: ORANGE_COLOR, fontSize: 20 }} />
                            <Typography fontWeight={600} color={ORANGE_COLOR} fontSize={16}>
                                Call Needed
                            </Typography>
                        </Box>
                        <Chip
                            label={`${excavatorLocates.filter(l => l.needsCall).length} pending`}
                            size="small"
                            sx={{
                                bgcolor: alpha(ORANGE_COLOR, 0.2),
                                color: ORANGE_COLOR,
                                fontWeight: 600,
                                border: `1px solid ${ORANGE_COLOR}`,
                                fontSize: 12,
                            }}
                        />
                    </Box>

                    <Box display="flex" gap={2} alignItems="center">
                        <StyledTextField
                            placeholder="Search excavator locates..."
                            value={searchQueryExcavator}
                            onChange={(e) => setSearchQueryExcavator(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ color: ORANGE_COLOR }} />
                                    </InputAdornment>
                                ),
                            }}
                            size="small"
                            sx={{ minWidth: 250 }}
                        />
                        <FormControl size="small" sx={{ minWidth: 140, fontSize: 12 }}>
                            <InputLabel sx={{ fontSize: 14 }}>Type</InputLabel>
                            <Select value={typeFilterExcavator} onChange={(e) => setTypeFilterExcavator(e.target.value)} label="Type">
                                <MenuItem sx={{ fontSize: 14 }} value="ALL">All Types</MenuItem>
                                <MenuItem sx={{ fontSize: 14 }} value="STANDARD">Standard</MenuItem>
                                <MenuItem sx={{ fontSize: 14 }} value="EMERGENCY">Emergency</MenuItem>
                            </Select>
                        </FormControl>
                        {removeCheckedExcavatorLocates.size > 0 && (
                            <Button
                                variant="contained"
                                color="error"
                                size="small"
                                onClick={() => setOpenRemoveExcavatorConfirmDialog(true)}
                                disabled={deleteExcavatorLocateMutation.isPending}
                                sx={{
                                    textTransform: 'none',
                                    fontSize: 12,
                                    fontWeight: 600,
                                }}
                            >
                                Remove Selected ({removeCheckedExcavatorLocates.size})
                            </Button>
                        )}
                    </Box>
                </Box>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: alpha(ORANGE_COLOR, 0.05) }}>
                                <TableCell padding="checkbox">Remove</TableCell>
                                <TableCell>Call Status</TableCell>
                                <TableCell>Customer</TableCell>
                                <TableCell>Site Address</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell>Technician</TableCell>
                                <TableCell>Tag Type</TableCell>
                                <TableCell>Tagged By</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredExcavatorLocates.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                                        <Typography color="text.secondary">
                                            No excavator priority locates found
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredExcavatorLocates.map((locate) => {
                                    const typeConfig = LOCATE_TYPE_CONFIG[locate.type] || LOCATE_TYPE_CONFIG.STANDARD;
                                    const displayAddress = locate.fullAddress || locate.address || 'No Address';
                                    const displayCityStateZip = [locate.city, locate.state, locate.zip]
                                        .filter(Boolean)
                                        .join(', ');

                                    // Determine call status
                                    const isCalled = locate.locatesCalled || excavatorCallStatus[locate._id];
                                    const callType = locate.callType || excavatorCallStatus[locate._id];

                                    return (
                                        <TableRow
                                            key={locate._id}
                                            hover
                                            sx={{
                                                borderLeft: `4px solid ${ORANGE_COLOR}`,
                                                bgcolor: locate.needsCall ? alpha(ORANGE_COLOR, 0.03) : 'transparent',
                                                '&:hover': {
                                                    bgcolor: locate.needsCall ? alpha(ORANGE_COLOR, 0.08) : alpha(GRAY_COLOR, 0.04),
                                                }
                                            }}
                                        >
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    checked={removeCheckedExcavatorLocates.has(locate._id)}
                                                    onChange={() => toggleExcavatorRemoveCheckbox(locate._id)}
                                                    disabled={deleteExcavatorLocateMutation.isPending}
                                                    size="small"
                                                    color="error"
                                                />
                                            </TableCell>

                                            {/* Call Status Column - Standard/Emergency Checkboxes */}
                                            <TableCell>
                                                {isCalled ? (
                                                    <Box>
                                                        <Chip
                                                            label={callType === 'EMERGENCY' ? 'Emergency Call' : 'Standard Call'}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: callType === 'EMERGENCY'
                                                                    ? alpha(RED_COLOR, 0.1)
                                                                    : alpha(BLUE_COLOR, 0.1),
                                                                color: callType === 'EMERGENCY'
                                                                    ? RED_COLOR
                                                                    : BLUE_COLOR,
                                                                fontWeight: 500,
                                                                border: `1px solid ${callType === 'EMERGENCY' ? RED_COLOR : BLUE_COLOR}`,
                                                            }}
                                                            icon={callType === 'EMERGENCY' ? <EmergencyIcon /> : <ScheduleIcon />}
                                                        />
                                                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                                                            Called
                                                        </Typography>
                                                    </Box>
                                                ) : (
                                                    <Box>
                                                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                                                            Mark after calling:
                                                        </Typography>
                                                        <RadioGroup
                                                            row
                                                            value={callType || ''}
                                                            onChange={(e) => handleCallStatusChange(locate._id, e.target.value)}
                                                        >
                                                            <Tooltip title="Mark as Standard Locate Call">
                                                                <FormControlLabel
                                                                    value="STANDARD"
                                                                    control={
                                                                        <Radio
                                                                            size="small"
                                                                            sx={{
                                                                                color: BLUE_COLOR,
                                                                                '&.Mui-checked': { color: BLUE_COLOR }
                                                                            }}
                                                                        />
                                                                    }
                                                                    label="Standard"
                                                                    disabled={updateCallStatusMutation.isPending}
                                                                />
                                                            </Tooltip>
                                                            <Tooltip title="Mark as Emergency Locate Call">
                                                                <FormControlLabel
                                                                    value="EMERGENCY"
                                                                    control={
                                                                        <Radio
                                                                            size="small"
                                                                            sx={{
                                                                                color: RED_COLOR,
                                                                                '&.Mui-checked': { color: RED_COLOR }
                                                                            }}
                                                                        />
                                                                    }
                                                                    label="Emergency"
                                                                    disabled={updateCallStatusMutation.isPending}
                                                                />
                                                            </Tooltip>
                                                        </RadioGroup>
                                                    </Box>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Typography fontWeight={500}>
                                                    {locate.customerName || 'No Customer'}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: ORANGE_COLOR, fontWeight: 600 }}>
                                                    <span style={{ color: 'black' }}>Priority: </span>
                                                    {locate.priorityName}
                                                </Typography>
                                            </TableCell>

                                            <TableCell>
                                                <Typography variant="body2">{displayAddress}</Typography>
                                                {displayCityStateZip && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        {displayCityStateZip}
                                                    </Typography>
                                                )}
                                            </TableCell>

                                            <TableCell>
                                                <Stack spacing={0.5}>
                                                    <Typography variant="body2">
                                                        Requested: {formatDate(locate.requestedDate)}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Completed: {formatDate(locate.completedAt)}
                                                    </Typography>
                                                    {locate.duration && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            Duration: {locate.duration}
                                                        </Typography>
                                                    )}
                                                </Stack>
                                            </TableCell>

                                            <TableCell>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <Avatar
                                                        sx={{
                                                            width: 32,
                                                            height: 32,
                                                            bgcolor: ORANGE_COLOR,
                                                            fontSize: '0.875rem',
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        {getTechnicianName(locate.techName).charAt(0)}
                                                    </Avatar>
                                                    <Typography variant="body2">
                                                        {getTechnicianName(locate.techName)}
                                                    </Typography>
                                                </Box>
                                            </TableCell>

                                            <TableCell>
                                                <Box>
                                                    <Chip
                                                        label={locate.manuallyTagged ? "Manual Tag" : "Auto Generated"}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: locate.manuallyTagged ? alpha(PURPLE_COLOR, 0.1) : alpha(BLUE_COLOR, 0.1),
                                                            color: locate.manuallyTagged ? PURPLE_COLOR : BLUE_COLOR,
                                                            fontWeight: 500,
                                                            mb: 0.5,
                                                        }}
                                                    />
                                                </Box>
                                            </TableCell>

                                            <TableCell>
                                                {locate.manuallyTagged ? (
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={500}>
                                                            {locate.taggedBy}
                                                        </Typography>
                                                        <Typography variant="caption" display="block" color="text.secondary">
                                                            {locate.taggedByEmail}
                                                        </Typography>
                                                        {locate.taggedAt && (
                                                            <Typography variant="caption" display="block" color="text.secondary">
                                                                {format(new Date(locate.taggedAt), 'MMM dd, yyyy HH:mm')}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                ) : (
                                                    <Typography variant="caption" color="text.secondary">
                                                        System Generated
                                                    </Typography>
                                                )}
                                            </TableCell>

                                            <TableCell>
                                                <Tooltip title="More actions">
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => handleMenuOpen(e, locate)}
                                                        disabled={deleteExcavatorLocateMutation.isPending || updateCallStatusMutation.isPending}
                                                    >
                                                        <MoreVertIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* IN PROGRESS Table - Redesigned to match Call Needed table */}
            <Paper
                elevation={0}
                sx={{
                    borderRadius: 2,
                    border: `1px solid ${alpha(YELLOW_COLOR, 0.2)}`,
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    mb: 4,
                }}
            >
                <Box
                    sx={{
                        p: 1.5,
                        borderBottom: `2px solid ${YELLOW_COLOR}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        bgcolor: alpha(YELLOW_COLOR, 0.05),
                    }}
                >
                    <Box display="flex" alignItems="center" gap={1}>
                        <Box display="flex" alignItems="center" gap={1}>
                            <AccessTimeIcon sx={{ color: YELLOW_COLOR, fontSize: 20 }} />
                            <Typography fontWeight={600} color={YELLOW_COLOR} fontSize={16}>
                                In Progress
                            </Typography>
                        </Box>
                        <Chip
                            label={`${inProgressLocates.length} active`}
                            size="small"
                            sx={{
                                bgcolor: alpha(YELLOW_COLOR, 0.2),
                                color: YELLOW_COLOR,
                                fontWeight: 600,
                                border: `1px solid ${YELLOW_COLOR}`,
                                fontSize: 12,
                            }}
                        />
                    </Box>

                    <Box display="flex" gap={2} alignItems="center">
                        <StyledTextField
                            placeholder="Search in progress locates..."
                            value={searchQueryInProgress}
                            onChange={(e) => setSearchQueryInProgress(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ color: YELLOW_COLOR }} />
                                    </InputAdornment>
                                ),
                            }}
                            size="small"
                            sx={{ minWidth: 250 }}
                        />
                        <FormControl size="small" sx={{ minWidth: 140, fontSize: 12 }}>
                            <InputLabel sx={{ fontSize: 14 }}>Type</InputLabel>
                            <Select value={typeFilterInProgress} onChange={(e) => setTypeFilterInProgress(e.target.value)} label="Type">
                                <MenuItem sx={{ fontSize: 14 }} value="ALL">All Types</MenuItem>
                                <MenuItem sx={{ fontSize: 14 }} value="STANDARD">Standard</MenuItem>
                                <MenuItem sx={{ fontSize: 14 }} value="EMERGENCY">Emergency</MenuItem>
                            </Select>
                        </FormControl>
                        {removeCheckedInProgressLocates.size > 0 && (
                            <Button
                                variant="contained"
                                color="error"
                                size="small"
                                onClick={() => setOpenRemoveInProgressConfirmDialog(true)}
                                disabled={deleteInProgressLocateMutation.isPending}
                                sx={{
                                    textTransform: 'none',
                                    fontSize: 12,
                                    fontWeight: 600,
                                }}
                            >
                                Remove Selected ({removeCheckedInProgressLocates.size})
                            </Button>
                        )}
                    </Box>
                </Box>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: alpha(YELLOW_COLOR, 0.05) }}>
                                <TableCell padding="checkbox">Remove</TableCell>
                                <TableCell>Call Status</TableCell>
                                <TableCell>Timer</TableCell>
                                <TableCell>Customer</TableCell>
                                <TableCell>Site Address</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell>Technician</TableCell>
                                <TableCell>Called In By</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredInProgressLocates.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                                        <Typography color="text.secondary">
                                            No in progress locates found
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredInProgressLocates.map((locate) => {
                                    const typeConfig = LOCATE_TYPE_CONFIG[locate.callType] || LOCATE_TYPE_CONFIG.STANDARD;
                                    const displayAddress = locate.fullAddress || locate.address || 'No Address';
                                    const displayCityStateZip = [locate.city, locate.state, locate.zip]
                                        .filter(Boolean)
                                        .join(', ');

                                    return (
                                        <TableRow
                                            key={locate._id}
                                            hover
                                            sx={{
                                                borderLeft: `4px solid ${YELLOW_COLOR}`,
                                                bgcolor: alpha(YELLOW_COLOR, 0.03),
                                                '&:hover': {
                                                    bgcolor: alpha(YELLOW_COLOR, 0.08),
                                                }
                                            }}
                                        >
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    checked={removeCheckedInProgressLocates.has(locate._id)}
                                                    onChange={() => toggleInProgressRemoveCheckbox(locate._id)}
                                                    disabled={deleteInProgressLocateMutation.isPending}
                                                    size="small"
                                                    color="error"
                                                />
                                            </TableCell>

                                            <TableCell>
                                                <Box>
                                                    <Chip
                                                        label={typeConfig.label}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: typeConfig.bgColor,
                                                            color: typeConfig.color,
                                                            fontWeight: 500,
                                                            border: `1px solid ${typeConfig.color}`,
                                                        }}
                                                        icon={typeConfig.icon}
                                                    />
                                                    <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                                                        {typeConfig.timeLimit}
                                                    </Typography>
                                                </Box>
                                            </TableCell>

                                            <TableCell>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <AccessTimeIcon sx={{ color: typeConfig.timerColor }} />
                                                    <Typography
                                                        variant="body2"
                                                        fontWeight={600}
                                                        color={typeConfig.timerColor}
                                                    >
                                                        {formatTimeRemaining(locate)}
                                                    </Typography>
                                                </Box>
                                                {locate.completionDate && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        Complete by: {format(locate.completionDate, 'MMM dd, hh:mm a')}
                                                    </Typography>
                                                )}
                                            </TableCell>

                                            <TableCell>
                                                <Typography fontWeight={500}>
                                                    {locate.customerName || 'No Customer'}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: YELLOW_COLOR, fontWeight: 600 }}>
                                                    <span style={{ color: 'black' }}>Status: </span>In Progress
                                                </Typography>
                                            </TableCell>

                                            <TableCell>
                                                <Typography variant="body2">{displayAddress}</Typography>
                                                {displayCityStateZip && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        {displayCityStateZip}
                                                    </Typography>
                                                )}
                                            </TableCell>

                                            <TableCell>
                                                <Stack spacing={0.5}>
                                                    <Typography variant="body2">
                                                        Requested: {formatDate(locate.requestedDate)}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Called: {format(new Date(locate.calledAt), 'MMM dd, hh:mm a')}
                                                    </Typography>
                                                </Stack>
                                            </TableCell>

                                            <TableCell>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <Avatar
                                                        sx={{
                                                            width: 32,
                                                            height: 32,
                                                            bgcolor: YELLOW_COLOR,
                                                            fontSize: '0.875rem',
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        {getTechnicianName(locate.techName).charAt(0)}
                                                    </Avatar>
                                                    <Typography variant="body2">
                                                        {getTechnicianName(locate.techName)}
                                                    </Typography>
                                                </Box>
                                            </TableCell>

                                            <TableCell>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <PersonIcon sx={{ color: PURPLE_COLOR, fontSize: 20 }} />
                                                    <Typography variant="body2">
                                                        {locate.calledBy || calledInBy[locate._id] || 'Unknown'}
                                                    </Typography>
                                                </Box>
                                            </TableCell>

                                            <TableCell>
                                                <Tooltip title="More actions">
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => handleMenuOpen(e, locate)}
                                                        disabled={deleteInProgressLocateMutation.isPending}
                                                    >
                                                        <MoreVertIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* LOCATES COMPLETE Table - Redesigned to match Call Needed table */}
            <Paper
                elevation={0}
                sx={{
                    borderRadius: 2,
                    border: `1px solid ${alpha(GREEN_COLOR, 0.2)}`,
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                }}
            >
                <Box
                    sx={{
                        p: 1.5,
                        borderBottom: `2px solid ${GREEN_COLOR}`,
                        display: 'flex',
                        alignItems: "center",
                        justifyContent: 'space-between',
                        bgcolor: alpha(GREEN_COLOR, 0.05),
                    }}
                >
                    <Box display="flex" alignItems="center" gap={1}>
                        <Box display="flex" alignItems="center" gap={1}>
                            <CheckCircleIcon sx={{ color: GREEN_COLOR, fontSize: 20 }} />
                            <Typography fontWeight={600} color={GREEN_COLOR} fontSize={16}>
                                Locates Complete
                            </Typography>
                        </Box>
                        <Chip
                            label={filteredLocates.length}
                            size="small"
                            sx={{
                                bgcolor: alpha(GREEN_COLOR, 0.2),
                                color: GREEN_COLOR,
                                fontWeight: 600,
                                border: `1px solid ${GREEN_COLOR}`,
                                fontSize: 12,
                            }}
                        />
                    </Box>

                    <Box display="flex" gap={2} alignItems="center">
                        <StyledTextField
                            placeholder="Search complete locates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ color: GREEN_COLOR }} />
                                    </InputAdornment>
                                ),
                            }}
                            size="small"
                            sx={{ minWidth: 250 }}
                        />
                        <FormControl size="small" sx={{ minWidth: 140, fontSize: 12 }}>
                            <InputLabel sx={{ fontSize: 14 }}>Type</InputLabel>
                            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} label="Type">
                                <MenuItem sx={{ fontSize: 14 }} value="ALL">All Types</MenuItem>
                                <MenuItem sx={{ fontSize: 14 }} value="STANDARD">Standard</MenuItem>
                                <MenuItem sx={{ fontSize: 14 }} value="EMERGENCY">Emergency</MenuItem>
                            </Select>
                        </FormControl>
                        {removeCheckedLocates.size > 0 && (
                            <Button
                                variant="contained"
                                color="error"
                                size="small"
                                onClick={() => setOpenRemoveConfirmDialog(true)}
                                disabled={deleteLocateMutation.isPending}
                                sx={{
                                    textTransform: 'none',
                                    fontSize: 12,
                                    fontWeight: 600,
                                }}
                            >
                                Remove Selected ({removeCheckedLocates.size})
                            </Button>
                        )}
                    </Box>
                </Box>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: alpha(GREEN_COLOR, 0.05) }}>
                                <TableCell padding="checkbox">Remove</TableCell>
                                <TableCell>Call Status</TableCell>
                                <TableCell>Customer</TableCell>
                                <TableCell>Site Address</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell>Technician</TableCell>
                                <TableCell>Called In By</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredLocates.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                                        <Typography color="text.secondary">
                                            No complete locates found
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredLocates.map((locate) => {
                                    const typeConfig = LOCATE_TYPE_CONFIG[locate.callType] || LOCATE_TYPE_CONFIG.STANDARD;
                                    const displayAddress = locate.fullAddress || locate.address || 'No Address';
                                    const displayCityStateZip = [locate.city, locate.state, locate.zip]
                                        .filter(Boolean)
                                        .join(', ');

                                    return (
                                        <TableRow
                                            key={locate._id}
                                            hover
                                            sx={{
                                                borderLeft: `4px solid ${GREEN_COLOR}`,
                                                bgcolor: alpha(GREEN_COLOR, 0.02),
                                                '&:hover': {
                                                    bgcolor: alpha(GREEN_COLOR, 0.06),
                                                }
                                            }}
                                        >
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    checked={removeCheckedLocates.has(locate._id)}
                                                    onChange={() => toggleRemoveCheckbox(locate._id)}
                                                    disabled={deleteLocateMutation.isPending}
                                                    size="small"
                                                    color="error"
                                                />
                                            </TableCell>

                                            <TableCell>
                                                <Box>
                                                    <Chip
                                                        label={typeConfig.label}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: typeConfig.bgColor,
                                                            color: typeConfig.color,
                                                            fontWeight: 500,
                                                            border: `1px solid ${typeConfig.color}`,
                                                        }}
                                                        icon={typeConfig.icon}
                                                    />
                                                    <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                                                        Timer Expired
                                                    </Typography>
                                                </Box>
                                            </TableCell>

                                            <TableCell>
                                                <Typography fontWeight={500}>
                                                    {locate.customerName || 'No Customer'}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: GREEN_COLOR, fontWeight: 600 }}>
                                                    <span style={{ color: 'black' }}>Status: </span>Complete
                                                </Typography>
                                            </TableCell>

                                            <TableCell>
                                                <Typography variant="body2">{displayAddress}</Typography>
                                                {displayCityStateZip && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        {displayCityStateZip}
                                                    </Typography>
                                                )}
                                            </TableCell>

                                            <TableCell>
                                                <Stack spacing={0.5}>
                                                    <Typography variant="body2">
                                                        Requested: {formatDate(locate.requestedDate)}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Called: {format(new Date(locate.calledAt), 'MMM dd, hh:mm a')}
                                                    </Typography>
                                                    <Typography variant="caption" color={GREEN_COLOR} fontWeight={500}>
                                                        Completed: {locate.completionDate ? format(locate.completionDate, 'MMM dd, hh:mm a') : 'N/A'}
                                                    </Typography>
                                                </Stack>
                                            </TableCell>

                                            <TableCell>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <Avatar
                                                        sx={{
                                                            width: 32,
                                                            height: 32,
                                                            bgcolor: GREEN_COLOR,
                                                            fontSize: '0.875rem',
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        {getTechnicianName(locate.techName).charAt(0)}
                                                    </Avatar>
                                                    <Typography variant="body2">
                                                        {getTechnicianName(locate.techName)}
                                                    </Typography>
                                                </Box>
                                            </TableCell>

                                            <TableCell>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <PersonIcon sx={{ color: PURPLE_COLOR, fontSize: 20 }} />
                                                    <Typography variant="body2">
                                                        {locate.calledBy || 'Unknown'}
                                                    </Typography>
                                                </Box>
                                            </TableCell>

                                            <TableCell>
                                                <Tooltip title="More actions">
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => handleMenuOpen(e, locate)}
                                                        disabled={deleteLocateMutation.isPending}
                                                    >
                                                        <MoreVertIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Row Action Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
            >
                <MenuItem
                    onClick={() => {
                        handleIndividualManualTag(selectedLocate);
                        handleMenuClose();
                    }}
                // disabled={selectedLocate?.manuallyTagged}
                >
                    <LocalOfferIcon fontSize="small" sx={{ mr: 1, color: PURPLE_COLOR }} />
                    {selectedLocate?.manuallyTagged ? 'Already Manually Tagged' : 'Add Manual Tag'}
                </MenuItem>
            </Menu>

            {/* Manual Tag Dialog with form */}
            <Dialog open={openTagDialog} onClose={() => setOpenTagDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ color: PURPLE_COLOR, fontWeight: 600 }}>
                    <LocalOfferIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Add Manual Tag
                </DialogTitle>
                <DialogContent dividers>
                    {selectedLocate && (
                        <Box>
                            <Typography gutterBottom>
                                You are about to add a manual "Locates Needed" tag to:
                            </Typography>
                            <Alert severity="info" sx={{ mb: 3 }}>
                                <Typography variant="body2">
                                    <strong>Job ID:</strong> {selectedLocate.jobId}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Customer:</strong> {selectedLocate.customerName}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Address:</strong> {selectedLocate.fullAddress}
                                </Typography>
                            </Alert>

                            <Box component="form" sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Enter your details for tagging:
                                </Typography>

                                <TextField
                                    fullWidth
                                    label="Your Name"
                                    name="name"
                                    value={tagFormData.name}
                                    onChange={handleFormChange}
                                    margin="normal"
                                    size="small"
                                    required
                                    error={!tagFormData.name.trim() && tagFormData.name !== ''}
                                    helperText={!tagFormData.name.trim() && tagFormData.name !== '' ? "Name is required" : ""}
                                />

                                <TextField
                                    fullWidth
                                    label="Your Email"
                                    name="email"
                                    type="email"
                                    value={tagFormData.email}
                                    onChange={handleFormChange}
                                    margin="normal"
                                    size="small"
                                    required
                                    error={!isValidEmail(tagFormData.email) && tagFormData.email !== ''}
                                    helperText={!isValidEmail(tagFormData.email) && tagFormData.email !== '' ? "Valid email is required" : ""}
                                />
                            </Box>

                            <Alert severity="warning" sx={{ mt: 3 }}>
                                This will mark this locate as "Excavator Priority" and require a call to be made.
                            </Alert>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <OutlineButton onClick={() => setOpenTagDialog(false)}>
                        Cancel
                    </OutlineButton>
                    <Button
                        variant="contained"
                        sx={{
                            bgcolor: PURPLE_COLOR,
                            '&:hover': { bgcolor: '#7c3aed' },
                        }}
                        startIcon={<LocalOfferIcon />}
                        onClick={handleConfirmIndividualTag}
                        disabled={tagIndividualLocateMutation.isPending || !tagFormData.name.trim() || !isValidEmail(tagFormData.email)}
                    >
                        {tagIndividualLocateMutation.isPending ? 'Tagging...' : 'Add Manual Tag'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Bulk Remove Confirmation Dialogs */}
            <Dialog open={openRemoveConfirmDialog} onClose={() => setOpenRemoveConfirmDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ color: RED_COLOR, fontWeight: 600 }}>
                    Confirm Removal
                </DialogTitle>
                <DialogContent dividers>
                    <Typography>
                        You are about to permanently remove {removeCheckedLocates.size} complete locate(s).
                    </Typography>
                    <Alert severity="warning" sx={{ mt: 2 }}>
                        This action cannot be undone.
                    </Alert>
                </DialogContent>
                <DialogActions>
                    <OutlineButton onClick={() => setOpenRemoveConfirmDialog(false)}>
                        Cancel
                    </OutlineButton>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleConfirmRemove}
                        disabled={deleteLocateMutation.isPending}
                    >
                        {deleteLocateMutation.isPending ? 'Removing...' : 'Remove Permanently'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openRemoveExcavatorConfirmDialog} onClose={() => setOpenRemoveExcavatorConfirmDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ color: RED_COLOR, fontWeight: 600 }}>
                    Confirm Removal
                </DialogTitle>
                <DialogContent dividers>
                    <Typography>
                        You are about to permanently remove {removeCheckedExcavatorLocates.size} excavator locate(s).
                    </Typography>
                    <Alert severity="warning" sx={{ mt: 2 }}>
                        This action cannot be undone.
                    </Alert>
                </DialogContent>
                <DialogActions>
                    <OutlineButton onClick={() => setOpenRemoveExcavatorConfirmDialog(false)}>
                        Cancel
                    </OutlineButton>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleConfirmExcavatorRemove}
                        disabled={deleteExcavatorLocateMutation.isPending}
                    >
                        {deleteExcavatorLocateMutation.isPending ? 'Removing...' : 'Remove Permanently'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openRemoveInProgressConfirmDialog} onClose={() => setOpenRemoveInProgressConfirmDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ color: RED_COLOR, fontWeight: 600 }}>
                    Confirm Removal
                </DialogTitle>
                <DialogContent dividers>
                    <Typography>
                        You are about to permanently remove {removeCheckedInProgressLocates.size} in progress locate(s).
                    </Typography>
                    <Alert severity="warning" sx={{ mt: 2 }}>
                        This action cannot be undone. Timer will be stopped.
                    </Alert>
                </DialogContent>
                <DialogActions>
                    <OutlineButton onClick={() => setOpenRemoveInProgressConfirmDialog(false)}>
                        Cancel
                    </OutlineButton>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleConfirmInProgressRemove}
                        disabled={deleteInProgressLocateMutation.isPending}
                    >
                        {deleteInProgressLocateMutation.isPending ? 'Removing...' : 'Remove Permanently'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    severity={snackbar.severity}
                    variant="filled"
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Locates;