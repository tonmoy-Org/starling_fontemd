import React, { useState, useMemo, useEffect } from 'react';
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
  Snackbar,
  Alert,
  Stack,
  Checkbox,
  Button,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  TablePagination,
  Modal,
  Grid,
  FormControlLabel,
  TextField,
  LinearProgress,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alpha } from '@mui/material/styles';
import axiosInstance from '../../../api/axios';
import StyledTextField from '../../../components/ui/StyledTextField';

import {
  CheckCircle,
  Clock,
  Timer,
  X,
  Trash2,
  Search,
  AlertCircle,
  Edit,
  Construction,
  FileText,
  CheckSquare,
  Square,
  Info,
  ChevronRight,
  ChevronDown,
  Calendar,
  Home,
  User,
  MapPin,
  FileCheck,
  ClipboardCheck,
  ShieldCheck,
  TestTube,
  Award,
  AlertTriangle,
  History,
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import DashboardLoader from '../../../components/Loader/DashboardLoader';
import { Add, ArrowBack, ArrowForward, ThumbUp, ExpandMore } from '@mui/icons-material';
import GradientButton from '../../../components/ui/GradientButton';
import UpdateButton from '../../../components/ui/UpdateButton';
import OutlineButton from '../../../components/ui/OutlineButton';
import RecycleBinModal from './RecycleBinModal';
import { useAuth } from '../../../auth/AuthProvider';

const TEXT_COLOR = '#0F1115';
const BLUE_COLOR = '#1976d2';
const GREEN_COLOR = '#10b981';
const RED_COLOR = '#ef4444';
const ORANGE_COLOR = '#ed6c02';
const GRAY_COLOR = '#6b7280';
const PURPLE_COLOR = '#8b5cf6';
const YELLOW_COLOR = '#f59e0b';
const TEAL_COLOR = '#06b6d4';

// Define repair stages
const REPAIR_STAGES = [
  { id: 'creation', name: '1: Job Creation', color: GRAY_COLOR },
  { id: 'moreWork', name: '1B: More Work Needed', color: ORANGE_COLOR },
  { id: 'permitting', name: '2: Permitting', color: BLUE_COLOR },
  { id: 'approved', name: '3: Approved', color: YELLOW_COLOR },
  { id: 'testing', name: '4: Testing', color: TEAL_COLOR },
  { id: 'completed', name: '5: Project Complete', color: GREEN_COLOR }
];

// As-Built Requirements list
const AS_BUILT_REQUIREMENTS = [
  "Drain-Field depth",
  "Lateral length",
  "Lateral material",
  "Waterline locations",
  "Tank size",
  "Drinking Water Well -- If present",
  "Impervious surfaces",
  "Surface water (Creeks, streams, lakes, ponds)",
  "Transport line location",
  "How we located components",
  "Structures",
  "Tanks less than 750 gallons must have already approved as-built",
  "Tanks 750 gallons or more may be repaired with a proper site plan"
];

// Stress Test Options - Updated to match document requirements
const STRESS_TEST_OPTIONS = [
  {
    value: 'vacant_passed',
    label: 'Vacant - Completed 120 Gallons Per Bedroom Stress Test',
    description: 'Property is vacant and passed the 120 gallons per bedroom stress test'
  },
  {
    value: 'occupied_passed',
    label: 'Occupied - Completed 120 Gallon Stress Test',
    description: 'Property is occupied and passed the 120 gallons stress test'
  },
  {
    value: 'failed',
    label: 'Failed Stress Test - Drain Field Repair Scheduled',
    description: 'Stress test failed - Move to 1B: Drain Field Repair'
  }
];

// Format date to YYYY-MM-DD for API
const formatDateForAPI = (date) => {
  if (!date) return null;

  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }

  if (typeof date === 'string') {
    // If it's already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }

    // Try to parse and format
    const parsedDate = new Date(date);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toISOString().split('T')[0];
    }
  }

  return null;
};

// Transform API data to match expected format with proper null handling
const transformRepairData = (apiData) => {
  if (!apiData) return null;

  return {
    id: apiData.id?.toString() || `repair-${apiData.id}`,
    workOrderId: apiData.id,
    workOrderNumber: apiData.work_order_number || `REP-${(apiData.id || '').toString().padStart(4, '0')}`,
    address: apiData.address || '',
    name: apiData.name || 'Unknown Customer',
    stage: apiData.stage || 'creation',
    stageName: apiData.stage_name || '',
    stageColor: apiData.stage_color || GRAY_COLOR,
    createdDate: apiData.created_date || new Date().toISOString(),
    lastUpdated: apiData.last_updated || new Date().toISOString(),
    // Job Creation Details - Updated to match document
    stressTest: apiData.stress_test || null,
    stressTestDescription: apiData.stress_test_description ||
      (apiData.stress_test ? STRESS_TEST_OPTIONS.find(opt => opt.value === apiData.stress_test)?.label : null),
    asBuiltCondition: apiData.as_built_condition || null,
    rmeReport: apiData.rme_report || null,
    rmeInspectionFiled: apiData.rme_inspection_filed || false,
    // More Work Needed Details
    neededItems: Array.isArray(apiData.needed_items) ? apiData.needed_items : (apiData.needed_items ? [apiData.needed_items] : []),
    // Permitting Details
    permitSubmittedDate: apiData.permit_submitted_date || null,
    permitDaysPending: apiData.permit_days_pending || 0,
    // Approved Details
    approvedDate: apiData.approved_date || null,
    readyToSchedule: apiData.ready_to_schedule || false,
    approvedSymbol: apiData.approved_symbol || false, // Thumbs-up symbol
    // Testing Details
    waterTightnessTest: apiData.water_tightness_test || false,
    followUpReport: apiData.follow_up_report || false,
    // Completed Details
    completionDate: apiData.completion_date || null,
    // General
    notes: apiData.notes || '',
    assignedTo: apiData.assigned_to || 'Unassigned',
    priority: apiData.priority || 'Standard',
    // Delete tracking
    isDeleted: apiData.is_deleted || false,
    deletedBy: apiData.deleted_by || null,
    deletedByEmail: apiData.deleted_by_email || null,
    deletedDate: apiData.deleted_date || null
  };
};

// Transform component data to API format (snake_case)
const transformToAPIFormat = (data) => {
  if (!data) return {};

  const apiData = {};

  // Transform field by field
  if (data.stressTest !== undefined) apiData.stress_test = data.stressTest;
  if (data.stressTestDescription !== undefined) apiData.stress_test_description = data.stressTestDescription;
  if (data.asBuiltCondition !== undefined) apiData.as_built_condition = data.asBuiltCondition;
  if (data.rmeReport !== undefined) apiData.rme_report = data.rmeReport;
  if (data.rmeInspectionFiled !== undefined) apiData.rme_inspection_filed = data.rmeInspectionFiled;
  if (data.neededItems !== undefined) apiData.needed_items = Array.isArray(data.neededItems) ? data.neededItems : [];
  if (data.permitSubmittedDate !== undefined) apiData.permit_submitted_date = formatDateForAPI(data.permitSubmittedDate);
  if (data.permitDaysPending !== undefined) apiData.permit_days_pending = data.permitDaysPending;
  if (data.approvedDate !== undefined) apiData.approved_date = formatDateForAPI(data.approvedDate);
  if (data.readyToSchedule !== undefined) apiData.ready_to_schedule = data.readyToSchedule;
  if (data.approvedSymbol !== undefined) apiData.approved_symbol = data.approvedSymbol;
  if (data.waterTightnessTest !== undefined) apiData.water_tightness_test = data.waterTightnessTest;
  if (data.followUpReport !== undefined) apiData.follow_up_report = data.followUpReport;
  if (data.completionDate !== undefined) apiData.completion_date = formatDateForAPI(data.completionDate);
  if (data.notes !== undefined) apiData.notes = data.notes;
  if (data.assignedTo !== undefined) apiData.assigned_to = data.assignedTo;
  if (data.priority !== undefined) apiData.priority = data.priority;
  if (data.name !== undefined) apiData.name = data.name;
  if (data.address !== undefined) apiData.address = data.address;
  if (data.stage !== undefined) apiData.stage = data.stage;
  if (data.stageName !== undefined) apiData.stage_name = data.stageName;
  if (data.stageColor !== undefined) apiData.stage_color = data.stageColor;
  if (data.createdDate !== undefined) apiData.created_date = data.createdDate;
  if (data.lastUpdated !== undefined) apiData.last_updated = data.lastUpdated;
  if (data.isDeleted !== undefined) apiData.is_deleted = data.isDeleted;
  if (data.deletedBy !== undefined) apiData.deleted_by = data.deletedBy;
  if (data.deletedByEmail !== undefined) apiData.deleted_by_email = data.deletedByEmail;
  if (data.deletedDate !== undefined) apiData.deleted_date = data.deletedDate;

  return apiData;
};

// Confirmation Modal Component
const DeleteConfirmationModal = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Move to Recycle Bin",
  cancelText = "Cancel",
  severity = "warning"
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {severity === 'warning' ? (
            <AlertTriangle size={24} color={ORANGE_COLOR} />
          ) : (
            <Trash2 size={24} color={RED_COLOR} />
          )}
          <Typography variant="h6" sx={{ fontSize: '0.95rem', fontWeight: 600, color: TEXT_COLOR }}>
            {title}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ fontSize: '0.85rem', color: TEXT_COLOR, lineHeight: 1.6 }}>
          {message}
        </Typography>
        <Box sx={{ mt: 2, p: 2, bgcolor: alpha(ORANGE_COLOR, 0.05), borderRadius: 1 }}>
          <Typography variant="caption" sx={{ fontSize: '0.75rem', color: ORANGE_COLOR, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Info size={14} />
            Note: Items moved to Recycle Bin can be restored later
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <OutlineButton onClick={onClose} sx={{ fontSize: '0.85rem' }}>
          {cancelText}
        </OutlineButton>
        <OutlineButton
          variant="outlined"
          color="error"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          startIcon={<Trash2 size={16} />}
          sx={{ fontSize: '0.85rem' }}
        >
          {confirmText}
        </OutlineButton>
      </DialogActions>
    </Dialog>
  );
};

const Repairs = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  const [selectedRepairs, setSelectedRepairs] = useState({
    creation: new Set(),
    moreWork: new Set(),
    permitting: new Set(),
    approved: new Set(),
    testing: new Set(),
    completed: new Set()
  });

  const [page, setPage] = useState({
    creation: 0,
    moreWork: 0,
    permitting: 0,
    approved: 0,
    testing: 0,
    completed: 0
  });

  const [rowsPerPage, setRowsPerPage] = useState({
    creation: 10,
    moreWork: 10,
    permitting: 10,
    approved: 10,
    testing: 10,
    completed: 10
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStage, setFilterStage] = useState('all');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Dialog states
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newRepairDialogOpen, setNewRepairDialogOpen] = useState(false);
  const [asBuiltModalOpen, setAsBuiltModalOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [recycleBinModalOpen, setRecycleBinModalOpen] = useState(false);

  // Confirmation modal states
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [bulkDeleteConfirmationOpen, setBulkDeleteConfirmationOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState({
    type: 'single', // 'single' or 'bulk'
    stageId: null,
    repairId: null,
    count: 0,
    workOrderNumber: null,
    customerName: null
  });

  // New repair form state
  const [newRepair, setNewRepair] = useState({
    name: '',
    address: '',
    stressTest: '',
    asBuiltCondition: '',
    rmeReport: '',
    rmeInspectionFiled: false
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    stressTest: '',
    asBuiltCondition: '',
    rmeReport: '',
    rmeInspectionFiled: false,
    neededItems: [],
    waterTightnessTest: false,
    followUpReport: false,
    readyToSchedule: false,
    notes: ''
  });

  // Top dashboard state
  const [showTopDashboard, setShowTopDashboard] = useState(true);

  // Recycle bin state
  const [recycleBinSearch, setRecycleBinSearch] = useState('');
  const [recycleBinPage, setRecycleBinPage] = useState(0);
  const [recycleBinRowsPerPage, setRecycleBinRowsPerPage] = useState(10);
  const [selectedRecycleBinItems, setSelectedRecycleBinItems] = useState(new Set());
  const [isRecycleBinLoading, setIsRecycleBinLoading] = useState(false);

  // Mock user data (in a real app, this would come from auth context)
  const currentUser = {
    name: user?.name || 'Admin User',
    email: user?.email || ''
  };

  // ============================
  // API QUERIES AND MUTATIONS
  // ============================

  // Fetch all repairs (non-deleted)
  const { data: repairsData = [], isLoading, refetch } = useQuery({
    queryKey: ['tank-repairs'],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get('/tank-repairs/');
        // console.log('API Response:', response.data);

        // Transform API data to match expected format
        const transformedData = response.data.map(transformRepairData);
        console.log('Transformed Data:', transformedData);

        return transformedData;
      } catch (error) {
        console.error('Error fetching repairs:', error);
        throw error;
      }
    }
  });

  // Create new repair mutation
  const createRepairMutation = useMutation({
    mutationFn: async (repairData) => {
      try {
        const apiData = transformToAPIFormat(repairData);
        console.log('Creating repair with data:', apiData);

        const response = await axiosInstance.post('/tank-repairs/', apiData);
        return transformRepairData(response.data);
      } catch (error) {
        console.error('Error creating repair:', error);
        console.error('Error details:', error.response?.data);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tank-repairs']);
      showSnackbar('Repair created successfully', 'success');
    },
    onError: (error) => {
      console.error('Error creating repair:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.detail || 'Failed to create repair';
      showSnackbar(errorMessage, 'error');
    }
  });

  // Update repair mutation
  const updateRepairMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      try {
        const apiData = transformToAPIFormat(data);
        console.log('Updating repair with data:', apiData);

        const response = await axiosInstance.put(`/tank-repairs/${id}/`, apiData);
        return transformRepairData(response.data);
      } catch (error) {
        console.error('Error updating repair:', error);
        console.error('Error details:', error.response?.data);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tank-repairs']);
      showSnackbar('Repair updated successfully', 'success');
    },
    onError: (error) => {
      console.error('Error updating repair:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.detail || 'Failed to update repair';
      showSnackbar(errorMessage, 'error');
    }
  });

  // Patch repair mutation (for partial updates)
  const patchRepairMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      try {
        const apiData = transformToAPIFormat(data);
        console.log('Patching repair with data:', apiData);

        const response = await axiosInstance.patch(`/tank-repairs/${id}/`, apiData);
        return transformRepairData(response.data);
      } catch (error) {
        console.error('Error patching repair:', error);
        console.error('Error details:', error.response?.data);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tank-repairs']);
    },
    onError: (error) => {
      console.error('Error patching repair:', error);
    }
  });

  // Soft delete repair mutation (move to recycle bin)
  const softDeleteRepairMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      try {
        const apiData = transformToAPIFormat(data);
        console.log('Soft deleting repair with data:', apiData);

        const response = await axiosInstance.patch(`/tank-repairs/${id}/`, apiData);
        return transformRepairData(response.data);
      } catch (error) {
        console.error('Error soft deleting repair:', error);
        console.error('Error details:', error.response?.data);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tank-repairs']);
      showSnackbar('Repair moved to recycle bin', 'success');
    },
    onError: (error) => {
      console.error('Error soft deleting repair:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.detail || 'Failed to move repair to recycle bin';
      showSnackbar(errorMessage, 'error');
    }
  });

  // Bulk soft delete mutation
  const bulkSoftDeleteMutation = useMutation({
    mutationFn: async (ids) => {
      try {
        const promises = ids.map(id => {
          const data = {
            is_deleted: true,
            deleted_by: currentUser.name,
            deleted_by_email: currentUser.email,
            deleted_date: new Date().toISOString().split('T')[0] // Format to YYYY-MM-DD
          };
          console.log('Bulk soft deleting repair:', id, data);
          return axiosInstance.patch(`/tank-repairs/${id}/`, data);
        });
        await Promise.all(promises);
        return ids;
      } catch (error) {
        console.error('Error bulk soft deleting repairs:', error);
        console.error('Error details:', error.response?.data);
        throw error;
      }
    },
    onSuccess: (ids) => {
      queryClient.invalidateQueries(['tank-repairs']);
      showSnackbar(`${ids.length} repair(s) moved to recycle bin`, 'success');
    },
    onError: (error) => {
      console.error('Error bulk soft deleting repairs:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.detail || 'Failed to move repairs to recycle bin';
      showSnackbar(errorMessage, 'error');
    }
  });

  // Restore from recycle bin mutation
  const restoreRepairMutation = useMutation({
    mutationFn: async (id) => {
      try {
        const data = {
          is_deleted: false,
          deleted_by: null,
          deleted_by_email: null,
          deleted_date: null
        };
        console.log('Restoring repair:', id, data);

        const response = await axiosInstance.patch(`/tank-repairs/${id}/`, data);
        return transformRepairData(response.data);
      } catch (error) {
        console.error('Error restoring repair:', error);
        console.error('Error details:', error.response?.data);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tank-repairs']);
      showSnackbar('Repair restored successfully', 'success');
    },
    onError: (error) => {
      console.error('Error restoring repair:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.detail || 'Failed to restore repair';
      showSnackbar(errorMessage, 'error');
    }
  });

  // Bulk restore mutation
  const bulkRestoreMutation = useMutation({
    mutationFn: async (ids) => {
      try {
        const promises = ids.map(id => {
          const data = {
            is_deleted: false,
            deleted_by: null,
            deleted_by_email: null,
            deleted_date: null
          };
          console.log('Bulk restoring repair:', id, data);
          return axiosInstance.patch(`/tank-repairs/${id}/`, data);
        });
        await Promise.all(promises);
        return ids;
      } catch (error) {
        console.error('Error bulk restoring repairs:', error);
        console.error('Error details:', error.response?.data);
        throw error;
      }
    },
    onSuccess: (ids) => {
      queryClient.invalidateQueries(['tank-repairs']);
      showSnackbar(`${ids.length} repair(s) restored`, 'success');
    },
    onError: (error) => {
      console.error('Error bulk restoring repairs:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.detail || 'Failed to restore repairs';
      showSnackbar(errorMessage, 'error');
    }
  });

  // Permanent delete mutation
  const permanentDeleteMutation = useMutation({
    mutationFn: async (id) => {
      try {
        console.log('Permanently deleting repair:', id);
        await axiosInstance.delete(`/tank-repairs/${id}/`);
        return id;
      } catch (error) {
        console.error('Error permanently deleting repair:', error);
        console.error('Error details:', error.response?.data);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tank-repairs']);
      showSnackbar('Repair permanently deleted', 'success');
    },
    onError: (error) => {
      console.error('Error permanently deleting repair:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.detail || 'Failed to permanently delete repair';
      showSnackbar(errorMessage, 'error');
    }
  });

  // Bulk permanent delete mutation
  const bulkPermanentDeleteMutation = useMutation({
    mutationFn: async (ids) => {
      try {
        console.log('Bulk permanently deleting repairs:', ids);
        const promises = ids.map(id =>
          axiosInstance.delete(`/tank-repairs/${id}/`)
        );
        await Promise.all(promises);
        return ids;
      } catch (error) {
        console.error('Error bulk permanently deleting repairs:', error);
        console.error('Error details:', error.response?.data);
        throw error;
      }
    },
    onSuccess: (ids) => {
      queryClient.invalidateQueries(['tank-repairs']);
      showSnackbar(`${ids.length} repair(s) permanently deleted`, 'success');
    },
    onError: (error) => {
      console.error('Error bulk permanently deleting repairs:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.detail || 'Failed to permanently delete repairs';
      showSnackbar(errorMessage, 'error');
    }
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Calculate days in current stage
  const getDaysInStage = (repair) => {
    if (!repair || !repair.lastUpdated) return 0;
    const lastUpdate = new Date(repair.lastUpdated);
    if (!lastUpdate || isNaN(lastUpdate.getTime())) return 0;
    const now = currentTime;
    const diffTime = Math.abs(now - lastUpdate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // Get what's missing for a repair - Updated to match document requirements
  const getWhatsMissing = (repair) => {
    if (!repair) return [];

    const missing = [];

    if (repair.stage === 'creation') {
      if (!repair.stressTest) missing.push('Stress Test');
      if (!repair.asBuiltCondition) missing.push('As-Built Condition');
      if (!repair.rmeReport || !repair.rmeInspectionFiled) missing.push('RME Report');
    }

    if (repair.stage === 'moreWork') {
      if (repair.neededItems && Array.isArray(repair.neededItems) && repair.neededItems.length > 0) {
        missing.push(...repair.neededItems);
      }
    }

    if (repair.stage === 'permitting') {
      missing.push('Health Department Approval');
    }

    if (repair.stage === 'approved') {
      if (!repair.readyToSchedule) missing.push('Schedule Installation');
    }

    if (repair.stage === 'testing') {
      if (!repair.waterTightnessTest) missing.push('Water Tightness Test');
      if (!repair.followUpReport) missing.push('Follow-up Report');
    }

    return missing;
  };

  const parseDashboardAddress = (fullAddress) => {
    if (!fullAddress) return { street: '', city: '', state: '', zip: '', original: '' };

    try {
      const parts = fullAddress.split(' - ');
      if (parts.length < 2) return { street: fullAddress, city: '', state: '', zip: '', original: fullAddress };
      const street = parts[0].trim();
      const remaining = parts[1].trim();
      const zipMatch = remaining.match(/\b\d{5}\b/);
      const zip = zipMatch ? zipMatch[0] : '';
      const withoutZip = remaining.replace(zip, '').trim();
      const cityState = withoutZip.split(',').map(s => s.trim());
      return {
        street,
        city: cityState[0] || '',
        state: cityState[1] || '',
        zip,
        original: fullAddress,
      };
    } catch (error) {
      console.error('Error parsing address:', error);
      return { street: fullAddress, city: '', state: '', zip: '', original: fullAddress };
    }
  };

  // Filter active repairs (non-deleted)
  const activeRepairs = useMemo(() => {
    return repairsData.filter(repair => !repair.isDeleted);
  }, [repairsData]);

  // Get deleted repairs for recycle bin
  const deletedRepairs = useMemo(() => {
    return repairsData
      .filter(repair => repair.isDeleted)
      .map(repair => {
        const address = parseDashboardAddress(repair.address);
        return {
          ...repair,
          street: address.street,
          city: address.city,
          state: address.state,
          zip: address.zip,
          type: 'REPAIR'
        };
      });
  }, [repairsData]);

  // Top dashboard data
  const topDashboardData = useMemo(() => {
    return activeRepairs.map(repair => {
      const address = parseDashboardAddress(repair.address);
      const stage = REPAIR_STAGES.find(s => s.id === repair.stage);

      return {
        id: repair.id,
        address: repair.address,
        street: address.street,
        cityState: `${address.city}, ${address.state} ${address.zip}`.trim().replace(/^,\s*/, ''),
        customer: repair.name,
        currentStage: stage?.name || repair.stageName,
        stageColor: repair.stageColor,
        whatsMissing: getWhatsMissing(repair),
        daysInStage: getDaysInStage(repair),
        repair
      };
    });
  }, [activeRepairs, currentTime]);

  // Group repairs by stage for dashboard
  const repairsByStage = useMemo(() => {
    const grouped = {};
    REPAIR_STAGES.forEach(stage => {
      grouped[stage.id] = activeRepairs.filter(r => r.stage === stage.id);
    });
    return grouped;
  }, [activeRepairs]);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleOpenDetails = (repair) => {
    setSelectedRepair(repair);
    setEditForm({
      stressTest: repair.stressTest || '',
      asBuiltCondition: repair.asBuiltCondition || '',
      rmeReport: repair.rmeReport || '',
      rmeInspectionFiled: repair.rmeInspectionFiled || false,
      neededItems: Array.isArray(repair.neededItems) ? repair.neededItems : [],
      waterTightnessTest: repair.waterTightnessTest || false,
      followUpReport: repair.followUpReport || false,
      readyToSchedule: repair.readyToSchedule || false,
      notes: repair.notes || ''
    });
    setDetailsDialogOpen(true);
  };

  const handleOpenEdit = (repair) => {
    setSelectedRepair(repair);
    setEditForm({
      stressTest: repair.stressTest || '',
      asBuiltCondition: repair.asBuiltCondition || '',
      rmeReport: repair.rmeReport || '',
      rmeInspectionFiled: repair.rmeInspectionFiled || false,
      neededItems: Array.isArray(repair.neededItems) ? repair.neededItems : [],
      waterTightnessTest: repair.waterTightnessTest || false,
      followUpReport: repair.followUpReport || false,
      readyToSchedule: repair.readyToSchedule || false,
      notes: repair.notes || ''
    });
    setActiveStep(0);
    setEditDialogOpen(true);
  };

  const handleOpenNewRepair = () => {
    setNewRepair({
      name: '',
      address: '',
      stressTest: '',
      asBuiltCondition: '',
      rmeReport: '',
      rmeInspectionFiled: false
    });
    setActiveStep(0);
    setNewRepairDialogOpen(true);
  };

  const handleOpenRecycleBin = () => {
    setRecycleBinModalOpen(true);
    setIsRecycleBinLoading(true);
    // Simulate API loading
    setTimeout(() => {
      setIsRecycleBinLoading(false);
    }, 500);
  };

  const handleSaveRepair = () => {
    if (!selectedRepair) return;

    const updateData = {
      ...editForm,
      lastUpdated: new Date().toISOString()
    };

    // Add stage transition logic if needed
    if (selectedRepair.stage === 'permitting' && editForm.readyToSchedule) {
      updateData.stage = 'approved';
      updateData.stageName = '3: Approved';
      updateData.stageColor = YELLOW_COLOR;
      updateData.approvedDate = new Date().toISOString();
    } else if (selectedRepair.stage === 'approved' &&
      (editForm.waterTightnessTest || editForm.followUpReport)) {
      updateData.stage = 'testing';
      updateData.stageName = '4: Testing';
      updateData.stageColor = TEAL_COLOR;
    } else if (selectedRepair.stage === 'testing' &&
      editForm.waterTightnessTest && editForm.followUpReport) {
      updateData.stage = 'completed';
      updateData.stageName = '5: Project Complete';
      updateData.stageColor = GREEN_COLOR;
      updateData.completionDate = new Date().toISOString();
    }

    updateRepairMutation.mutate({
      id: selectedRepair.id,
      data: updateData
    });

    setEditDialogOpen(false);
    setDetailsDialogOpen(false);
  };

  const handleAddNewRepair = () => {
    if (!newRepair.name || !newRepair.address) {
      showSnackbar('Please fill in name and address', 'error');
      return;
    }

    let stage = 'creation';
    let stageName = '1: Job Creation';
    let neededItems = [];
    let stageColor = GRAY_COLOR;

    // Determine initial stage based on selections - Updated per document
    if (newRepair.stressTest === 'failed' ||
      newRepair.asBuiltCondition === 'insufficient' ||
      newRepair.rmeReport === 'missing' ||
      !newRepair.rmeInspectionFiled) {
      stage = 'moreWork';
      stageName = '1B: More Work Needed';
      stageColor = ORANGE_COLOR;

      if (newRepair.stressTest === 'failed') neededItems.push('Drain Field Repair');
      if (newRepair.asBuiltCondition === 'insufficient') neededItems.push('As-Built Creation');
      if (newRepair.rmeReport === 'missing' || !newRepair.rmeInspectionFiled) {
        neededItems.push('Inspection RME On File');
      }
    } else if (newRepair.stressTest && newRepair.stressTest !== 'failed' &&
      newRepair.asBuiltCondition === 'meets_criteria' &&
      newRepair.rmeReport === 'filed' &&
      newRepair.rmeInspectionFiled) {
      stage = 'permitting';
      stageName = '2: Permitting';
      stageColor = BLUE_COLOR;
    }

    const repairData = {
      name: newRepair.name,
      address: newRepair.address,
      stage: stage,
      stageName: stageName,
      stageColor: stageColor,
      stressTest: newRepair.stressTest,
      asBuiltCondition: newRepair.asBuiltCondition,
      rmeReport: newRepair.rmeReport,
      rmeInspectionFiled: newRepair.rmeInspectionFiled,
      neededItems: neededItems,
      notes: 'New repair job created',
      createdDate: new Date().toISOString().split('T')[0], // Format to YYYY-MM-DD
      lastUpdated: new Date().toISOString().split('T')[0], // Format to YYYY-MM-DD
      isDeleted: false,
      assignedTo: 'Unassigned',
      priority: 'Standard'
    };

    createRepairMutation.mutate(repairData);
    setNewRepairDialogOpen(false);
  };

  const handleMoveStage = (repairId, direction) => {
    const repair = activeRepairs.find(r => r.id === repairId);
    if (!repair) return;

    const currentStageIndex = REPAIR_STAGES.findIndex(s => s.id === repair.stage);
    let newStageIndex = currentStageIndex;

    if (direction === 'forward' && currentStageIndex < REPAIR_STAGES.length - 1) {
      newStageIndex = currentStageIndex + 1;
    } else if (direction === 'backward' && currentStageIndex > 0) {
      newStageIndex = currentStageIndex - 1;
    } else {
      return;
    }

    const newStage = REPAIR_STAGES[newStageIndex];

    patchRepairMutation.mutate({
      id: repairId,
      data: {
        stage: newStage.id,
        stageName: newStage.name,
        stageColor: newStage.color,
        lastUpdated: new Date().toISOString().split('T')[0] // Format to YYYY-MM-DD
      }
    });
  };

  const handleCompleteItem = (repairId, item) => {
    const repair = activeRepairs.find(r => r.id === repairId);
    if (!repair) return;

    const currentNeededItems = Array.isArray(repair.neededItems) ? repair.neededItems : [];
    const newNeededItems = currentNeededItems.filter(i => i !== item);
    const updateData = {
      neededItems: newNeededItems,
      lastUpdated: new Date().toISOString().split('T')[0] // Format to YYYY-MM-DD
    };

    // If all items are completed and status is moreWork, check if we can move to permitting
    if (newNeededItems.length === 0 && repair.stage === 'moreWork') {
      // Check if all conditions are met for permitting
      if (repair.stressTest && repair.stressTest !== 'failed' &&
        repair.asBuiltCondition === 'meets_criteria' &&
        repair.rmeReport === 'filed' &&
        repair.rmeInspectionFiled) {
        const newStage = REPAIR_STAGES.find(s => s.id === 'permitting');
        updateData.stage = 'permitting';
        updateData.stageName = newStage.name;
        updateData.stageColor = newStage.color;
      }
    }

    patchRepairMutation.mutate({
      id: repairId,
      data: updateData
    });
  };

  const handleToggleSelection = (stageId, repairId) => {
    setSelectedRepairs(prev => {
      const newSet = new Set(prev[stageId]);
      if (newSet.has(repairId)) {
        newSet.delete(repairId);
      } else {
        newSet.add(repairId);
      }
      return { ...prev, [stageId]: newSet };
    });
  };

  const handleToggleAllSelection = (stageId, items) => {
    if (!items || !Array.isArray(items)) return;

    setSelectedRepairs(prev => {
      const currentSet = prev[stageId];
      const allPageIds = new Set(items.map(item => item?.id).filter(Boolean));
      const allSelected = Array.from(allPageIds).every(id => currentSet.has(id));

      if (allSelected) {
        const newSet = new Set(currentSet);
        allPageIds.forEach(id => newSet.delete(id));
        return { ...prev, [stageId]: newSet };
      } else {
        const newSet = new Set([...currentSet, ...allPageIds]);
        return { ...prev, [stageId]: newSet };
      }
    });
  };

  // Open confirmation modal for single delete
  const handleSingleSoftDeleteClick = (repairId, workOrderNumber = null, customerName = null) => {
    setDeleteTarget({
      type: 'single',
      stageId: null,
      repairId,
      count: 1,
      workOrderNumber,
      customerName
    });
    setDeleteConfirmationOpen(true);
  };

  // Open confirmation modal for bulk delete
  const handleBulkSoftDeleteClick = (stageId) => {
    const selectedIds = Array.from(selectedRepairs[stageId]);
    if (selectedIds.length === 0) return;

    setDeleteTarget({
      type: 'bulk',
      stageId,
      repairId: null,
      count: selectedIds.length,
      workOrderNumber: null,
      customerName: null
    });
    setBulkDeleteConfirmationOpen(true);
  };

  // Execute single delete after confirmation
  const confirmSingleSoftDelete = () => {
    const { repairId } = deleteTarget;

    softDeleteRepairMutation.mutate({
      id: repairId,
      data: {
        isDeleted: true,
        deletedBy: currentUser.name,
        deletedByEmail: currentUser.email,
        deletedDate: new Date().toISOString().split('T')[0] // Format to YYYY-MM-DD
      }
    });

    // Remove from selected sets if it was selected
    REPAIR_STAGES.forEach(stage => {
      setSelectedRepairs(prev => {
        const newSet = new Set(prev[stage.id]);
        newSet.delete(repairId);
        return { ...prev, [stage.id]: newSet };
      });
    });

    // Close details dialog if it's open
    if (detailsDialogOpen) {
      setDetailsDialogOpen(false);
    }
  };

  // Execute bulk delete after confirmation
  const confirmBulkSoftDelete = () => {
    const { stageId } = deleteTarget;
    const selectedIds = Array.from(selectedRepairs[stageId]);

    bulkSoftDeleteMutation.mutate(selectedIds);
    setSelectedRepairs(prev => ({ ...prev, [stageId]: new Set() }));
  };

  // Soft delete (move to recycle bin) - old function kept for backward compatibility
  const handleSoftDeleteSelected = (stageId) => {
    const selectedIds = Array.from(selectedRepairs[stageId]);
    if (selectedIds.length === 0) return;

    bulkSoftDeleteMutation.mutate(selectedIds);
    setSelectedRepairs(prev => ({ ...prev, [stageId]: new Set() }));
  };

  // Single repair soft delete - old function kept for backward compatibility
  const handleSingleSoftDelete = (repairId) => {
    softDeleteRepairMutation.mutate({
      id: repairId,
      data: {
        isDeleted: true,
        deletedBy: currentUser.name,
        deletedByEmail: currentUser.email,
        deletedDate: new Date().toISOString().split('T')[0] // Format to YYYY-MM-DD
      }
    });

    // Remove from selected sets if it was selected
    REPAIR_STAGES.forEach(stage => {
      setSelectedRepairs(prev => {
        const newSet = new Set(prev[stage.id]);
        newSet.delete(repairId);
        return { ...prev, [stage.id]: newSet };
      });
    });
  };

  // Recycle bin functionality
  const toggleRecycleBinSelection = (itemId) => {
    const newSet = new Set(selectedRecycleBinItems);
    if (newSet.has(itemId)) {
      newSet.delete(itemId);
    } else {
      newSet.add(itemId);
    }
    setSelectedRecycleBinItems(newSet);
  };

  const toggleAllRecycleBinSelection = () => {
    const currentItems = deletedRepairs.slice(
      recycleBinPage * recycleBinRowsPerPage,
      recycleBinPage * recycleBinRowsPerPage + recycleBinRowsPerPage
    ).map(item => item?.id).filter(Boolean);

    const allSelected = currentItems.every(id => selectedRecycleBinItems.has(id));

    const newSet = new Set(selectedRecycleBinItems);
    if (allSelected) {
      currentItems.forEach(id => newSet.delete(id));
    } else {
      currentItems.forEach(id => newSet.add(id));
    }
    setSelectedRecycleBinItems(newSet);
  };

  const handleRestoreFromRecycleBin = (itemIds) => {
    bulkRestoreMutation.mutate(itemIds);
    setSelectedRecycleBinItems(new Set());
  };

  const handlePermanentDeleteFromRecycleBin = (itemIds) => {
    bulkPermanentDeleteMutation.mutate(itemIds);
    setSelectedRecycleBinItems(new Set());
  };

  const confirmBulkRestore = () => {
    if (selectedRecycleBinItems.size === 0) return;
    handleRestoreFromRecycleBin(Array.from(selectedRecycleBinItems));
  };

  const confirmBulkPermanentDelete = () => {
    if (selectedRecycleBinItems.size === 0) return;
    if (window.confirm(`Are you sure you want to permanently delete ${selectedRecycleBinItems.size} item(s)? This action cannot be undone.`)) {
      handlePermanentDeleteFromRecycleBin(Array.from(selectedRecycleBinItems));
    }
  };

  const handleSingleRestore = (item) => {
    if (!item || !item.id) return;
    restoreRepairMutation.mutate(item.id);
  };

  const handleSinglePermanentDelete = (item) => {
    if (!item || !item.id) return;
    if (window.confirm(`Are you sure you want to permanently delete work order ${item.workOrderNumber || 'N/A'}? This action cannot be undone.`)) {
      permanentDeleteMutation.mutate(item.id);
    }
  };

  const handleChangePage = (stageId, newPage) => {
    setPage(prev => ({ ...prev, [stageId]: newPage }));
  };

  const handleChangeRowsPerPage = (stageId, event) => {
    setRowsPerPage(prev => ({ ...prev, [stageId]: parseInt(event.target.value, 10) }));
    setPage(prev => ({ ...prev, [stageId]: 0 }));
  };

  const getStageItems = (stageId) => {
    const items = repairsByStage[stageId] || [];
    const start = page[stageId] * rowsPerPage[stageId];
    const end = start + rowsPerPage[stageId];
    return items.slice(start, end);
  };

  const getDaysSince = (dateString) => {
    if (!dateString) return 0;
    const date = new Date(dateString);
    if (!date || isNaN(date.getTime())) return 0;
    const now = currentTime;
    const diffTime = Math.abs(now - date);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  // Format date for recycle bin display
  const formatDateShort = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Render stage content function
  const renderStageContent = (stageIndex, context = 'edit') => {
    // Use appropriate form data based on context
    const formData = context === 'new' ? newRepair : editForm;
    const currentRepair = selectedRepair;

    switch (stageIndex) {
      case 0: // Stage 1: Job Creation - UPDATED PER DOCUMENT
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ color: TEXT_COLOR, fontWeight: 600, fontSize: '0.85rem' }}>
              Must fill in at least 1 check box per question to move forward.
            </Typography>

            <Accordion defaultExpanded sx={{ mb: 2, border: `1px solid ${alpha(BLUE_COLOR, 0.1)}` }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography sx={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.85rem' }}>
                  <FileCheck size={18} color={BLUE_COLOR} />
                  1. Stress Test Section (Required)
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary" paragraph sx={{ fontSize: '0.85rem' }}>
                  <strong>User must select at least 1 checkbox</strong> before moving to next stage
                </Typography>

                {/* Stress Test Section with Checkboxes as per document */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" fontWeight={500} gutterBottom sx={{ fontSize: '0.85rem' }}>
                    Stress Test
                  </Typography>
                  <Stack spacing={1}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={formData.stressTest === 'vacant_passed'}
                          onChange={(e) => {
                            if (context === 'edit') {
                              setEditForm({
                                ...editForm,
                                stressTest: e.target.checked ? 'vacant_passed' : ''
                              });
                            } else {
                              setNewRepair({
                                ...newRepair,
                                stressTest: e.target.checked ? 'vacant_passed' : ''
                              });
                            }
                          }}
                        />
                      }
                      label={
                        <Typography sx={{ fontSize: '0.85rem' }}>
                          Vacant - Completed 120 Gallons Per Bedroom Stress Test
                        </Typography>
                      }
                    />

                    <Box sx={{ ml: 4 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        OR
                      </Typography>
                    </Box>

                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={formData.stressTest === 'occupied_passed'}
                          onChange={(e) => {
                            if (context === 'edit') {
                              setEditForm({
                                ...editForm,
                                stressTest: e.target.checked ? 'occupied_passed' : ''
                              });
                            } else {
                              setNewRepair({
                                ...newRepair,
                                stressTest: e.target.checked ? 'occupied_passed' : ''
                              });
                            }
                          }}
                        />
                      }
                      label={
                        <Typography sx={{ fontSize: '0.85rem' }}>
                          Occupied - Completed 120 Gallon Stress Test
                        </Typography>
                      }
                    />

                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={formData.stressTest === 'failed'}
                          onChange={(e) => {
                            if (context === 'edit') {
                              setEditForm({
                                ...editForm,
                                stressTest: e.target.checked ? 'failed' : ''
                              });
                            } else {
                              setNewRepair({
                                ...newRepair,
                                stressTest: e.target.checked ? 'failed' : ''
                              });
                            }
                          }}
                        />
                      }
                      label={
                        <Typography sx={{ fontSize: '0.85rem', color: RED_COLOR }}>
                          Failed Stress Test - Drain Field Repair Scheduled (Move to 1B - 'Drain Field Repair')
                        </Typography>
                      }
                    />
                  </Stack>
                </Box>

                <Box sx={{ mt: 2, p: 2, bgcolor: alpha(ORANGE_COLOR, 0.05), borderRadius: 1 }}>
                  <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.75rem' }}>
                    <AlertTriangle size={14} color={ORANGE_COLOR} />
                    <strong>Note:</strong> If "Failed Stress Test" is selected, job will automatically move to "1B: More Work Needed"
                  </Typography>
                </Box>
              </AccordionDetails>
            </Accordion>

            <Accordion defaultExpanded sx={{ mb: 2, border: `1px solid ${alpha(PURPLE_COLOR, 0.1)}` }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography sx={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.85rem' }}>
                  <ClipboardCheck size={18} color={PURPLE_COLOR} />
                  2. Existing As-Built Condition Check
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary" paragraph sx={{ fontSize: '0.85rem' }}>
                  System will determine if permitting is possible based on this check
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" fontWeight={500} gutterBottom sx={{ fontSize: '0.85rem' }}>
                    Existing As-Built Condition
                  </Typography>
                  <Stack spacing={1}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={formData.asBuiltCondition === 'meets_criteria'}
                          onChange={(e) => {
                            if (context === 'edit') {
                              setEditForm({
                                ...editForm,
                                asBuiltCondition: e.target.checked ? 'meets_criteria' : ''
                              });
                            } else {
                              setNewRepair({
                                ...newRepair,
                                asBuiltCondition: e.target.checked ? 'meets_criteria' : ''
                              });
                            }
                          }}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>"Meets Permit Criteria"</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                            (Move to PERMITTING if stress test was passed as well)
                          </Typography>
                        </Box>
                      }
                    />

                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={formData.asBuiltCondition === 'insufficient'}
                          onChange={(e) => {
                            if (context === 'edit') {
                              setEditForm({
                                ...editForm,
                                asBuiltCondition: e.target.checked ? 'insufficient' : ''
                              });
                            } else {
                              setNewRepair({
                                ...newRepair,
                                asBuiltCondition: e.target.checked ? 'insufficient' : ''
                              });
                            }
                          }}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>"Does Not Meet Permitting Criteria"</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                            (Move to MORE WORK NEEDED + "AS-BUILT CREATION")
                          </Typography>
                        </Box>
                      }
                    />
                  </Stack>
                </Box>

                <OutlineButton
                  variant="text"
                  size="small"
                  startIcon={<Info size={16} />}
                  onClick={() => setAsBuiltModalOpen(true)}
                  sx={{ mt: 2 }}
                >
                  View As-Built Requirements
                </OutlineButton>
              </AccordionDetails>
            </Accordion>

            <Accordion defaultExpanded sx={{ mb: 2, border: `1px solid ${alpha(TEAL_COLOR, 0.1)}` }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography sx={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.85rem' }}>
                  <ShieldCheck size={18} color={TEAL_COLOR} />
                  3. RME Report Section
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary" paragraph sx={{ fontSize: '0.85rem' }}>
                  Both conditions must be checked to move to PERMITTING
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" fontWeight={500} gutterBottom sx={{ fontSize: '0.85rem' }}>
                    RME Report
                  </Typography>
                  <Stack spacing={1}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={formData.rmeReport === 'filed'}
                          onChange={(e) => {
                            if (context === 'edit') {
                              setEditForm({
                                ...editForm,
                                rmeReport: e.target.checked ? 'filed' : '',
                                rmeInspectionFiled: e.target.checked ? true : false
                              });
                            } else {
                              setNewRepair({
                                ...newRepair,
                                rmeReport: e.target.checked ? 'filed' : '',
                                rmeInspectionFiled: e.target.checked ? true : false
                              });
                            }
                          }}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>Filed Inspection Of All Components</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                            (Move to PERMITTING IF BOTH CHECKED)
                          </Typography>
                        </Box>
                      }
                    />

                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={formData.stressTest && formData.stressTest !== 'failed'}
                          disabled
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>Stress Test Passed</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                            (Move to PERMITTING IF BOTH CHECKED)
                          </Typography>
                        </Box>
                      }
                    />

                    <Box sx={{ ml: 4 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        OR
                      </Typography>
                    </Box>

                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={formData.rmeReport === 'missing'}
                          onChange={(e) => {
                            if (context === 'edit') {
                              setEditForm({
                                ...editForm,
                                rmeReport: e.target.checked ? 'missing' : '',
                                rmeInspectionFiled: false
                              });
                            } else {
                              setNewRepair({
                                ...newRepair,
                                rmeReport: e.target.checked ? 'missing' : '',
                                rmeInspectionFiled: false
                              });
                            }
                          }}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>Inspection Not Filed</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                            (Move to MORE WORK NEEDED with any other items needed)
                          </Typography>
                        </Box>
                      }
                    />
                  </Stack>
                </Box>

                <Box sx={{ mt: 2, p: 2, bgcolor: alpha(ORANGE_COLOR, 0.05), borderRadius: 1 }}>
                  <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.75rem' }}>
                    <AlertTriangle size={14} color={ORANGE_COLOR} />
                    <strong>Final Rule:</strong> All three sections must be submitted as "Yes" to move to step 2.
                    Otherwise, Job will move to 1B, where between 1-3 more items will have to be satisfied.
                  </Typography>
                </Box>
              </AccordionDetails>
            </Accordion>
          </Box>
        );

      case 1: // Stage 1B: More Work Needed - UPDATED PER DOCUMENT
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ color: TEXT_COLOR, fontWeight: 600, fontSize: '0.85rem' }}>
              MORE WORK NEEDED (Must be no remaining items to move to next step)
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph sx={{ fontSize: '0.85rem' }}>
              Only shows missing items that need to be completed
            </Typography>

            {/* Drain Field Repair Section */}
            <Accordion defaultExpanded sx={{ mb: 2, border: `1px solid ${alpha(ORANGE_COLOR, 0.1)}` }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography sx={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.85rem' }}>
                  <Construction size={18} color={ORANGE_COLOR} />
                  Drain Field Repair
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" fontWeight={500} gutterBottom sx={{ fontSize: '0.85rem' }}>
                  Stress test passed?
                </Typography>
                <Stack spacing={1}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={formData.stressTest === 'vacant_passed'}
                        onChange={(e) => {
                          if (e.target.checked) {
                            if (context === 'edit') {
                              setEditForm({
                                ...editForm,
                                stressTest: 'vacant_passed'
                              });
                              // Remove Drain Field Repair from needed items if checked
                              const newNeededItems = formData.neededItems.filter(item => item !== 'Drain Field Repair');
                              if (context === 'edit') {
                                setEditForm(prev => ({ ...prev, neededItems: newNeededItems }));
                              }
                            }
                          }
                        }}
                      />
                    }
                    label={
                      <Typography sx={{ fontSize: '0.85rem' }}>
                        Yes -- Vacant -- 120 Gallons Per Bedroom
                      </Typography>
                    }
                  />

                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={formData.stressTest === 'occupied_passed'}
                        onChange={(e) => {
                          if (e.target.checked) {
                            if (context === 'edit') {
                              setEditForm({
                                ...editForm,
                                stressTest: 'occupied_passed'
                              });
                              // Remove Drain Field Repair from needed items if checked
                              const newNeededItems = formData.neededItems.filter(item => item !== 'Drain Field Repair');
                              if (context === 'edit') {
                                setEditForm(prev => ({ ...prev, neededItems: newNeededItems }));
                              }
                            }
                          }
                        }}
                      />
                    }
                    label={
                      <Typography sx={{ fontSize: '0.85rem' }}>
                        Yes -- Occupied -- 120 Gallons
                      </Typography>
                    }
                  />

                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={formData.stressTest === 'failed'}
                        onChange={(e) => {
                          if (e.target.checked) {
                            if (context === 'edit') {
                              setEditForm({
                                ...editForm,
                                stressTest: 'failed'
                              });
                              // Add Drain Field Repair to needed items if not already there
                              if (!formData.neededItems.includes('Drain Field Repair')) {
                                if (context === 'edit') {
                                  setEditForm(prev => ({
                                    ...prev,
                                    neededItems: [...prev.neededItems, 'Drain Field Repair']
                                  }));
                                }
                              }
                            }
                          }
                        }}
                      />
                    }
                    label={
                      <Typography sx={{ fontSize: '0.85rem', color: RED_COLOR }}>
                        No -- (Save job in 'Canceled/Complete' File)
                      </Typography>
                    }
                  />
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* As-Built Creation Section */}
            <Accordion defaultExpanded sx={{ mb: 2, border: `1px solid ${alpha(PURPLE_COLOR, 0.1)}` }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography sx={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.85rem' }}>
                  <FileText size={18} color={PURPLE_COLOR} />
                  As-Built Creation
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={formData.asBuiltCondition === 'meets_criteria'}
                      onChange={(e) => {
                        if (e.target.checked) {
                          if (context === 'edit') {
                            setEditForm({
                              ...editForm,
                              asBuiltCondition: 'meets_criteria'
                            });
                            // Remove As-Built Creation from needed items if checked
                            const newNeededItems = formData.neededItems.filter(item => item !== 'As-Built Creation');
                            if (context === 'edit') {
                              setEditForm(prev => ({ ...prev, neededItems: newNeededItems }));
                            }
                          }
                        }
                      }}
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: '0.85rem' }}>
                      As-built sufficient for submission? (Move to 'PERMIT PROCESS')
                    </Typography>
                  }
                />

                <OutlineButton
                  variant="text"
                  size="small"
                  startIcon={<Info size={16} />}
                  onClick={() => setAsBuiltModalOpen(true)}
                  sx={{ mt: 2 }}
                >
                  View As-Built Requirements
                </OutlineButton>
              </AccordionDetails>
            </Accordion>

            {/* Inspection RME On File Section */}
            <Accordion defaultExpanded sx={{ mb: 2, border: `1px solid ${alpha(TEAL_COLOR, 0.1)}` }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography sx={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.85rem' }}>
                  <ShieldCheck size={18} color={TEAL_COLOR} />
                  Inspection RME On File
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={formData.rmeReport === 'filed' && formData.rmeInspectionFiled}
                      onChange={(e) => {
                        if (e.target.checked) {
                          if (context === 'edit') {
                            setEditForm({
                              ...editForm,
                              rmeReport: 'filed',
                              rmeInspectionFiled: true
                            });
                            // Remove Inspection RME On File from needed items if checked
                            const newNeededItems = formData.neededItems.filter(item => item !== 'Inspection RME On File');
                            if (context === 'edit') {
                              setEditForm(prev => ({ ...prev, neededItems: newNeededItems }));
                            }
                          }
                        }
                      }}
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: '0.85rem' }}>
                      RME Report with passing stress test and full inspection of all components? (Move to 'PERMIT PROCESS')
                    </Typography>
                  }
                />
              </AccordionDetails>
            </Accordion>

            {/* Summary of Missing Items - Only for edit context */}
            {context === 'edit' && (
              <Box sx={{ mt: 3, p: 2, bgcolor: alpha(GRAY_COLOR, 0.05), borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.85rem' }}>
                  Current Missing Items ({formData.neededItems.length})
                </Typography>
                {formData.neededItems.length > 0 ? (
                  <Stack spacing={1}>
                    {formData.neededItems.map((item, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Checkbox
                          size="small"
                          onChange={() => handleCompleteItem(currentRepair?.id, item)}
                        />
                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{item}</Typography>
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Box sx={{ p: 2, textAlign: 'center', bgcolor: alpha(GREEN_COLOR, 0.05), borderRadius: 1 }}>
                    <CheckCircle size={24} color={GREEN_COLOR} />
                    <Typography variant="body2" sx={{ mt: 1, color: GREEN_COLOR, fontSize: '0.85rem' }}>
                      All tasks completed! Ready to move to PERMITTING
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            <Box sx={{ mt: 3, p: 2, bgcolor: alpha(GREEN_COLOR, 0.05), borderRadius: 1 }}>
              <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.75rem' }}>
                <CheckCircle size={14} color={GREEN_COLOR} />
                <strong>Completion Rule:</strong> When all boxes are checked → "SUBMITTED TO HEALTH DEPARTMENT FOR APPROVAL" → Move to PERMITTING
              </Typography>
            </Box>
          </Box>
        );

      case 2: // Stage 2: Permitting - UPDATED PER DOCUMENT
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ color: TEXT_COLOR, fontWeight: 600, fontSize: '0.85rem' }}>
              PERMITTING - Submitted: Waiting for Approval
            </Typography>

            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Clock size={24} color={BLUE_COLOR} />
                <Box>
                  <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.85rem' }}>
                    Status: {currentRepair?.permitSubmittedDate ? 'Submitted' : 'Not Submitted'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    {currentRepair?.permitSubmittedDate
                      ? `Submitted ${getDaysSince(currentRepair.permitSubmittedDate)} days ago`
                      : 'Ready to submit to health department'}
                  </Typography>
                </Box>
              </Box>

              {/* Timer display as per document */}
              <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(BLUE_COLOR, 0.05) }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Timer size={20} color={BLUE_COLOR} />
                  <Box>
                    <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.85rem' }}>
                      Time Since Submission
                    </Typography>
                    <Typography variant="h6" color={BLUE_COLOR} sx={{ fontSize: '1rem' }}>
                      {currentRepair?.permitSubmittedDate ?
                        `${getDaysSince(currentRepair.permitSubmittedDate)} days` :
                        'Not submitted yet'}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              <Box sx={{ p: 2, bgcolor: alpha(BLUE_COLOR, 0.05), borderRadius: 1 }}>
                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.75rem' }}>
                  <Timer size={14} color={BLUE_COLOR} />
                  <strong>Special Feature:</strong> Timer shows days pending for management review
                </Typography>
              </Box>
            </Stack>
          </Box>
        );

      case 3: // Stage 3: Approved - UPDATED PER DOCUMENT
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ color: TEXT_COLOR, fontWeight: 600, fontSize: '0.85rem' }}>
              APPROVED - Approved: Ready to Schedule
            </Typography>

            <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: alpha(YELLOW_COLOR, 0.05) }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.readyToSchedule}
                    onChange={(e) => {
                      if (context === 'edit') {
                        setEditForm({ ...editForm, readyToSchedule: e.target.checked });
                        if (e.target.checked) {
                          // Show thumbs up symbol when approved
                          showSnackbar('Project approved! Thumbs up symbol added.', 'success');
                        }
                      }
                    }}
                    size="small"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.85rem' }}>
                      "APPROVED -- READY TO SCHEDULE"
                    </Typography>
                    {formData.readyToSchedule && (
                      <ThumbUp sx={{ fontSize: 20, color: GREEN_COLOR }} />
                    )}
                  </Box>
                }
              />
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                When this box is checked, indicate somehow that the job is approved with a symbol of some sort. Maybe a thumbs up?
              </Typography>
            </Paper>

            <Box sx={{ mt: 2, p: 2, bgcolor: alpha(YELLOW_COLOR, 0.05), borderRadius: 1 }}>
              <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.75rem' }}>
                <ThumbUp size={14} color={YELLOW_COLOR} />
                <strong>Once checked:</strong> Job will be visually marked as Approved with thumbs-up symbol
              </Typography>
            </Box>
          </Box>
        );

      case 4: // Stage 4: Testing - UPDATED PER DOCUMENT
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ color: TEXT_COLOR, fontWeight: 600, fontSize: '0.85rem' }}>
              TESTING
            </Typography>

            <Stack spacing={2}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="body2" fontWeight={500} gutterBottom sx={{ fontSize: '0.85rem' }}>
                  Water Tightness Test
                </Typography>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.waterTightnessTest}
                      onChange={(e) => {
                        if (context === 'edit') {
                          setEditForm({ ...editForm, waterTightnessTest: e.target.checked })
                        }
                      }}
                      size="small"
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: '0.85rem' }}>
                      "Water-Tightness Check Passed"
                    </Typography>
                  }
                />
              </Paper>

              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="body2" fontWeight={500} gutterBottom sx={{ fontSize: '0.85rem' }}>
                  Follow-up Report Submit
                </Typography>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.followUpReport}
                      onChange={(e) => {
                        if (context === 'edit') {
                          setEditForm({ ...editForm, followUpReport: e.target.checked })
                        }
                      }}
                      size="small"
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: '0.85rem' }}>
                      "Follow-up Report Submitted"
                    </Typography>
                  }
                />
              </Paper>
            </Stack>

            <Box sx={{ mt: 3, p: 2, bgcolor: alpha(TEAL_COLOR, 0.05), borderRadius: 1 }}>
              <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.75rem' }}>
                <TestTube size={14} color={TEAL_COLOR} />
                <strong>Completion Rule:</strong> Both tests must pass → Move to Completed Projects
              </Typography>
            </Box>
          </Box>
        );

      case 5: // Stage 5: Completed
        return (
          <Box sx={{ mt: 2, textAlign: 'center', p: 4 }}>
            <Award size={48} color={GREEN_COLOR} />
            <Typography variant="h6" sx={{ mt: 2, color: GREEN_COLOR, fontSize: '1rem' }}>
              Project Completed!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: '0.85rem' }}>
              Move projects here once they have been completed for tracking.
            </Typography>
            <Box sx={{ mt: 3, p: 2, bgcolor: alpha(GREEN_COLOR, 0.05), borderRadius: 1 }}>
              <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                <strong>Note:</strong> No more edits can be made to completed projects
              </Typography>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  const renderStatusDetails = (item, stage) => {
    if (!item) return null;

    switch (stage.id) {
      case 'creation':
        return (
          <Stack spacing={0.5}>
            <Typography variant="caption" sx={{ color: GRAY_COLOR, fontSize: '0.75rem' }}>
              Initial Assessment Needed
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {!item.stressTest && (
                <Chip
                  label="Stress Test"
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', height: '20px' }}
                />
              )}
              {!item.asBuiltCondition && (
                <Chip
                  label="As-Built"
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', height: '20px' }}
                />
              )}
              {!item.rmeReport && (
                <Chip
                  label="RME Report"
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', height: '20px' }}
                />
              )}
            </Box>
          </Stack>
        );

      case 'moreWork':
        const neededItems = Array.isArray(item.neededItems) ? item.neededItems : [];
        return (
          <Stack spacing={0.5}>
            <Typography variant="caption" sx={{
              color: ORANGE_COLOR,
              fontSize: '0.75rem',
              fontWeight: 500
            }}>
              {neededItems.length} item(s) needed
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {neededItems.map((neededItem, index) => (
                <Chip
                  key={index}
                  label={neededItem}
                  size="small"
                  color="warning"
                  onDelete={() => handleCompleteItem(item.id, neededItem)}
                  deleteIcon={<CheckSquare size={12} />}
                  sx={{ fontSize: '0.7rem', height: '20px' }}
                />
              ))}
            </Box>
          </Stack>
        );

      case 'permitting':
        return (
          <Stack spacing={0.5}>
            <Typography variant="caption" sx={{
              color: BLUE_COLOR,
              fontSize: '0.75rem',
              fontWeight: 500
            }}>
              Submitted {item.permitDaysPending || getDaysSince(item.permitSubmittedDate)} days ago
            </Typography>
            <LinearProgress
              variant="determinate"
              value={Math.min((item.permitDaysPending || getDaysSince(item.permitSubmittedDate)) * 5, 100)}
              sx={{ height: 4, borderRadius: 2 }}
            />
          </Stack>
        );

      case 'approved':
        return (
          <Stack spacing={0.5} direction="row" alignItems="center">
            <ThumbUp sx={{ fontSize: 16, color: YELLOW_COLOR }} />
            <Typography variant="caption" sx={{
              color: YELLOW_COLOR,
              fontSize: '0.75rem',
              fontWeight: 500
            }}>
              {item.readyToSchedule ? 'APPROVED – READY TO SCHEDULE' : 'Awaiting Approval'}
            </Typography>
          </Stack>
        );

      case 'testing':
        return (
          <Stack spacing={0.5}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Chip
                label="Water Tightness Test"
                size="small"
                color={item.waterTightnessTest ? "success" : "default"}
                variant={item.waterTightnessTest ? "filled" : "outlined"}
                sx={{ fontSize: '0.7rem', height: '20px' }}
              />
              <Chip
                label="Follow-up Report"
                size="small"
                color={item.followUpReport ? "success" : "default"}
                variant={item.followUpReport ? "filled" : "outlined"}
                sx={{ fontSize: '0.7rem', height: '20px' }}
              />
            </Box>
          </Stack>
        );

      case 'completed':
        return (
          <Stack spacing={0.5} direction="row" alignItems="center">
            <CheckCircle size={16} color={GREEN_COLOR} />
            <Typography variant="caption" sx={{
              color: GREEN_COLOR,
              fontSize: '0.75rem',
              fontWeight: 500
            }}>
              Completed {item.lastUpdated ? new Date(item.lastUpdated).toLocaleDateString() : '—'}
            </Typography>
          </Stack>
        );

      default:
        return null;
    }
  };

  // Show loading state
  if (isLoading) {
    return <DashboardLoader />;
  }

  // Render top dashboard summary table
  const renderTopDashboard = () => (
    <Paper elevation={0} sx={{ mb: 4, borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
      <Box sx={{
        p: 2,
        bgcolor: '#f8fafc',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="h6" sx={{ fontSize: '0.95rem', fontWeight: 600, color: TEXT_COLOR }}>
          Repair  Summary
        </Typography>
        <IconButton
          size="small"
          onClick={() => setShowTopDashboard(!showTopDashboard)}
          sx={{ color: GRAY_COLOR }}
        >
          {showTopDashboard ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </IconButton>
      </Box>

      {showTopDashboard && (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem', color: TEXT_COLOR, width: '25%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Home size={16} />
                    Address
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem', color: TEXT_COLOR, width: '20%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ClipboardCheck size={16} />
                    Current Stage
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem', color: TEXT_COLOR, width: '25%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AlertTriangle size={16} />
                    What's Missing
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem', color: TEXT_COLOR, width: '15%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Calendar size={16} />
                    Days in Stage
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem', color: TEXT_COLOR, width: '15%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <User size={16} />
                    Customer
                  </Box>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {topDashboardData.map((row) => (
                <TableRow
                  key={row.id}
                  hover
                  sx={{
                    '&:hover': { bgcolor: '#f8fafc' },
                    cursor: 'pointer'
                  }}
                  onClick={() => handleOpenDetails(row.repair)}
                >
                  <TableCell sx={{ py: 1.5 }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>
                        {row.street}
                      </Typography>
                      <Typography variant="caption" sx={{ color: GRAY_COLOR, fontSize: '0.75rem' }}>
                        {row.cityState}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: row.stageColor
                      }} />
                      <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                        {row.currentStage}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 1.5 }}>
                    {row.whatsMissing.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {row.whatsMissing.map((item, index) => (
                          <Chip
                            key={index}
                            label={item}
                            size="small"
                            sx={{
                              fontSize: '0.7rem',
                              height: '20px',
                              bgcolor: alpha(ORANGE_COLOR, 0.1),
                              color: ORANGE_COLOR
                            }}
                          />
                        ))}
                      </Box>
                    ) : (
                      <Chip
                        label="All Clear"
                        size="small"
                        sx={{
                          fontSize: '0.7rem',
                          height: '20px',
                          bgcolor: alpha(GREEN_COLOR, 0.1),
                          color: GREEN_COLOR
                        }}
                      />
                    )}
                  </TableCell>
                  <TableCell sx={{ py: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{
                        fontSize: '0.85rem',
                        fontWeight: row.daysInStage > 14 ? 600 : 400,
                        color: row.daysInStage > 14 ? ORANGE_COLOR : TEXT_COLOR
                      }}>
                        {row.daysInStage} days
                      </Typography>
                      {row.daysInStage > 14 && (
                        <AlertTriangle size={14} color={ORANGE_COLOR} />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 1.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                      {row.customer}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );

  const renderStageCard = (stage) => {
    const items = repairsByStage[stage.id] || [];
    const pageItems = getStageItems(stage.id);
    const selectedCount = selectedRepairs[stage.id].size;
    const allSelectedOnPage = pageItems.length > 0 && pageItems.every(item => selectedRepairs[stage.id].has(item.id));
    const someSelectedOnPage = pageItems.length > 0 && pageItems.some(item => selectedRepairs[stage.id].has(item.id));

    return (
      <Paper
        elevation={0}
        sx={{
          mb: 4,
          borderRadius: '6px',
          overflow: 'hidden',
          border: `1px solid ${alpha(stage.color, 0.15)}`,
          bgcolor: 'white'
        }}
      >
        <Box
          sx={{
            p: 1.5,
            bgcolor: 'white',
            borderBottom: `1px solid ${alpha(stage.color, 0.1)}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box>
              <Typography
                sx={{
                  fontSize: '0.9rem',
                  color: TEXT_COLOR,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                {stage.name}
                <Chip
                  size="small"
                  label={items.length}
                  sx={{
                    bgcolor: alpha(stage.color, 0.08),
                    color: TEXT_COLOR,
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    height: '22px',
                    '& .MuiChip-label': {
                      px: 1,
                    },
                  }}
                />
              </Typography>
              {stage.id === 'permitting' && items.length > 0 && (
                <Typography
                  variant="caption"
                  sx={{
                    color: GRAY_COLOR,
                    fontSize: '0.75rem',
                    fontWeight: 400,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  <Timer size={12} />
                  Average pending: {Math.round(items.reduce((sum, item) => sum + (item.permitDaysPending || 0), 0) / items.length)} days
                </Typography>
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {selectedCount > 0 && (
              <>
                <OutlineButton
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={() => handleBulkSoftDeleteClick(stage.id)}
                  startIcon={<Trash2 size={14} />}
                  sx={{
                    fontSize: '0.75rem',
                    height: '30px',
                    px: 1.5,
                  }}
                >
                  Delete ({selectedCount})
                </OutlineButton>
              </>
            )}
          </Box>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{
                bgcolor: alpha(stage.color, 0.04),
                '& th': {
                  borderBottom: `2px solid ${alpha(stage.color, 0.1)}`,
                }
              }}>
                <TableCell
                  padding="checkbox"
                  width={50}
                  sx={{
                    color: TEXT_COLOR,
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    py: 1.5,
                    pl: 2.5,
                  }}
                >
                  <Checkbox
                    size="small"
                    checked={allSelectedOnPage}
                    indeterminate={someSelectedOnPage && !allSelectedOnPage}
                    onChange={() => handleToggleAllSelection(stage.id, pageItems)}
                    sx={{
                      color: TEXT_COLOR,
                      padding: '4px',
                    }}
                  />
                </TableCell>
                <TableCell sx={{
                  color: TEXT_COLOR,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  py: 1.5,
                }}>
                  Customer
                </TableCell>
                <TableCell sx={{
                  color: TEXT_COLOR,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  py: 1.5,
                }}>
                  Address
                </TableCell>
                <TableCell sx={{
                  color: TEXT_COLOR,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  py: 1.5,
                }}>
                  Status Details
                </TableCell>
                <TableCell sx={{
                  color: TEXT_COLOR,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  py: 1.5,
                }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pageItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Box sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 1,
                    }}>
                      <AlertCircle size={32} color={alpha(TEXT_COLOR, 0.2)} />
                      <Typography
                        variant="body2"
                        sx={{
                          color: TEXT_COLOR,
                          opacity: 0.6,
                          fontSize: '0.85rem',
                          fontWeight: 500,
                        }}
                      >
                        No repairs in this stage
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                pageItems.map(item => {
                  if (!item) return null;

                  const isSelected = selectedRepairs[stage.id].has(item.id);
                  const address = parseDashboardAddress(item.address);

                  return (
                    <TableRow
                      key={item.id}
                      hover
                      sx={{
                        bgcolor: isSelected ? alpha(stage.color, 0.1) : 'white',
                        '&:hover': {
                          backgroundColor: alpha(stage.color, 0.05),
                        },
                        '&:last-child td': {
                          borderBottom: 'none',
                        },
                      }}
                    >
                      <TableCell padding="checkbox" sx={{ pl: 2.5, py: 1.5 }}>
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleToggleSelection(stage.id, item.id)}
                          size="small"
                          sx={{
                            color: TEXT_COLOR,
                            padding: '4px',
                          }}
                        />
                      </TableCell>

                      <TableCell sx={{ py: 1.5 }}>
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{
                              color: TEXT_COLOR,
                              fontSize: '0.85rem',
                              fontWeight: 500,
                              mb: 0.25,
                            }}
                          >
                            {item.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: GRAY_COLOR,
                              fontSize: '0.75rem',
                              fontWeight: 400,
                            }}
                          >
                            Created: {item.createdDate ? new Date(item.createdDate).toLocaleDateString() : '—'}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell sx={{ py: 1.5 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            color: TEXT_COLOR,
                            fontSize: '0.85rem',
                            fontWeight: 400,
                            mb: 0.25,
                          }}
                        >
                          {address.street}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: GRAY_COLOR,
                            fontSize: '0.75rem',
                            fontWeight: 400,
                          }}
                        >
                          {[address.city, address.state, address.zip].filter(Boolean).join(', ')}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ py: 1.5 }}>
                        {renderStatusDetails(item, stage)}
                      </TableCell>

                      <TableCell sx={{ py: 1.5 }}>
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDetails(item)}
                              sx={{
                                color: BLUE_COLOR,
                                '&:hover': {
                                  backgroundColor: alpha(BLUE_COLOR, 0.1),
                                },
                              }}
                            >
                              <Info size={16} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEdit(item)}
                              sx={{
                                color: GREEN_COLOR,
                                '&:hover': {
                                  backgroundColor: alpha(GREEN_COLOR, 0.1),
                                },
                              }}
                            >
                              <Edit size={16} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Move to Recycle Bin">
                            <IconButton
                              size="small"
                              onClick={() => handleSingleSoftDeleteClick(item.id, item.workOrderNumber, item.name)}
                              sx={{
                                color: RED_COLOR,
                                '&:hover': {
                                  backgroundColor: alpha(RED_COLOR, 0.1),
                                },
                              }}
                            >
                              <Trash2 size={16} />
                            </IconButton>
                          </Tooltip>
                          {stage.id !== 'completed' && (
                            <Tooltip title="Move Forward">
                              <IconButton
                                size="small"
                                onClick={() => handleMoveStage(item.id, 'forward')}
                                sx={{
                                  color: stage.color,
                                  '&:hover': {
                                    backgroundColor: alpha(stage.color, 0.1),
                                  },
                                }}
                              >
                                <ArrowForward size={16} />
                              </IconButton>
                            </Tooltip>
                          )}
                          {stage.id !== 'creation' && (
                            <Tooltip title="Move Back">
                              <IconButton
                                size="small"
                                onClick={() => handleMoveStage(item.id, 'backward')}
                                sx={{
                                  color: GRAY_COLOR,
                                  '&:hover': {
                                    backgroundColor: alpha(GRAY_COLOR, 0.1),
                                  },
                                }}
                              >
                                <ArrowBack size={16} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {items.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={items.length}
            rowsPerPage={rowsPerPage[stage.id]}
            page={page[stage.id]}
            onPageChange={(event, newPage) => handleChangePage(stage.id, newPage)}
            onRowsPerPageChange={(event) => handleChangeRowsPerPage(stage.id, event)}
            sx={{
              borderTop: `1px solid ${alpha(stage.color, 0.1)}`,
              '& .MuiTablePagination-toolbar': {
                minHeight: '52px',
                padding: '0 16px',
              },
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                fontSize: '0.8rem',
                color: TEXT_COLOR,
                fontWeight: 400,
              },
            }}
          />
        )}
      </Paper>
    );
  };

  return (
    <Box>
      <Helmet>
        <title>Tank Repairs | Sterling Septic & Plumbing LLC</title>
        <meta name="description" content="Manage tank repair process and tracking" />
      </Helmet>

      {/* Dashboard Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography
            sx={{
              fontWeight: 600,
              mb: 0.5,
              fontSize: '0.95rem',
              color: TEXT_COLOR,
              letterSpacing: '-0.01em',
            }}
          >
            Tank Repair
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: GRAY_COLOR,
              fontSize: '0.85rem',
              fontWeight: 400,
            }}
          >
            Track and manage tank repairs through each stage of the process
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<History size={16} />}
            onClick={handleOpenRecycleBin}
            sx={{
              textTransform: 'none',
              fontSize: '0.85rem',
              fontWeight: 500,
              color: PURPLE_COLOR,
              borderColor: alpha(PURPLE_COLOR, 0.3),
              minWidth: 'auto',
              '&:hover': {
                borderColor: PURPLE_COLOR,
                backgroundColor: alpha(PURPLE_COLOR, 0.05),
              },
            }}
          >
            Recycle Bin ({deletedRepairs.length})
          </Button>
          <GradientButton
            variant="contained"
            startIcon={<Add size={16} />}
            onClick={handleOpenNewRepair}
            sx={{
              fontSize: '0.85rem',
              fontWeight: 500,
              px: 2,
            }}
          >
            New Repair Job
          </GradientButton>
        </Box>
      </Box>

      {/* TOP DASHBOARD SUMMARY - Very Important Feature */}
      {renderTopDashboard()}

      {/* Search and Filter */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <StyledTextField
          size="small"
          placeholder="Search repairs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: 250 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={16} color={GRAY_COLOR} />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => setSearchTerm('')}
                  edge="end"
                  sx={{ p: 0.5 }}
                >
                  <X size={16} />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <Box sx={{ flex: 1 }} />
        <Typography variant="body2" sx={{ color: GRAY_COLOR, fontSize: '0.85rem' }}>
          Filter by stage:
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label="All"
            size="small"
            variant={filterStage === 'all' ? 'filled' : 'outlined'}
            onClick={() => setFilterStage('all')}
            sx={{ fontSize: '0.75rem' }}
          />
          {REPAIR_STAGES.map(stage => (
            <Chip
              key={stage.id}
              label={stage.name}
              size="small"
              variant={filterStage === stage.id ? 'filled' : 'outlined'}
              onClick={() => setFilterStage(stage.id)}
              sx={{
                fontSize: '0.75rem',
                borderColor: stage.color,
                color: filterStage === stage.id ? 'white' : stage.color,
                backgroundColor: filterStage === stage.id ? stage.color : 'transparent'
              }}
            />
          ))}
        </Box>
      </Paper>

      {/* Render all stages or filtered stage */}
      {filterStage === 'all' ? (
        REPAIR_STAGES.map(stage => renderStageCard(stage))
      ) : (
        renderStageCard(REPAIR_STAGES.find(s => s.id === filterStage))
      )}

      {/* Single Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={deleteConfirmationOpen}
        onClose={() => setDeleteConfirmationOpen(false)}
        onConfirm={confirmSingleSoftDelete}
        title="Move to Recycle Bin"
        message={
          deleteTarget.type === 'single' && deleteTarget.customerName
            ? `Are you sure you want to move repair for "${deleteTarget.customerName}" to the Recycle Bin?`
            : "Are you sure you want to move this repair to the Recycle Bin?"
        }
        confirmText="Move to Recycle Bin"
        cancelText="Cancel"
        severity="warning"
      />

      {/* Bulk Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={bulkDeleteConfirmationOpen}
        onClose={() => setBulkDeleteConfirmationOpen(false)}
        onConfirm={confirmBulkSoftDelete}
        title="Move Multiple Items to Recycle Bin"
        message={`Are you sure you want to move ${deleteTarget.count} selected repair(s) to the Recycle Bin?`}
        confirmText={`Move ${deleteTarget.count} Items to Recycle Bin`}
        cancelText="Cancel"
        severity="warning"
      />

      {/* Repair Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedRepair && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontSize: '0.95rem', fontWeight: 600, color: TEXT_COLOR }}>
                    {selectedRepair.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: GRAY_COLOR, fontSize: '0.75rem' }}>
                    {selectedRepair.stageName}
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.85rem', fontWeight: 600, color: TEXT_COLOR }}>
                    Address
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                    {selectedRepair.address}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Divider />
                </Grid>

                {/* Stage Specific Details */}
                {selectedRepair.stage === 'creation' || selectedRepair.stage === 'moreWork' ? (
                  <>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.85rem', fontWeight: 600, color: TEXT_COLOR }}>
                        Job Creation Details
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="caption" display="block" gutterBottom sx={{ fontSize: '0.75rem', color: GRAY_COLOR }}>
                        Stress Test
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                        {selectedRepair.stressTestDescription || 'Not specified'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="caption" display="block" gutterBottom sx={{ fontSize: '0.75rem', color: GRAY_COLOR }}>
                        As-Built Condition
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                        {selectedRepair.asBuiltCondition === 'meets_criteria' ?
                          'Meets Permit Criteria' :
                          selectedRepair.asBuiltCondition === 'insufficient' ?
                            'Does Not Meet Criteria' :
                            'Not specified'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="caption" display="block" gutterBottom sx={{ fontSize: '0.75rem', color: GRAY_COLOR }}>
                        RME Report
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                        {selectedRepair.rmeReport === 'filed' ?
                          'Filed Inspection' :
                          selectedRepair.rmeReport === 'missing' ?
                            'Inspection Not Filed' :
                            'Not specified'}
                      </Typography>
                    </Grid>
                  </>
                ) : null}

                {selectedRepair.stage === 'moreWork' && Array.isArray(selectedRepair.neededItems) && selectedRepair.neededItems.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.85rem', fontWeight: 600, color: TEXT_COLOR }}>
                      Required Items
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {selectedRepair.neededItems.map((item, index) => (
                        <Chip
                          key={index}
                          label={item}
                          color="warning"
                          size="small"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      ))}
                    </Box>
                  </Grid>
                )}

                {selectedRepair.stage === 'permitting' && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.85rem', fontWeight: 600, color: TEXT_COLOR }}>
                      Permitting Status
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Clock size={20} color={BLUE_COLOR} />
                      <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                        Submitted {selectedRepair.permitDaysPending || getDaysSince(selectedRepair.permitSubmittedDate)} days ago
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {selectedRepair.stage === 'testing' && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.85rem', fontWeight: 600, color: TEXT_COLOR }}>
                      Testing Status
                    </Typography>
                    <Stack spacing={1}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Checkbox
                          checked={selectedRepair.waterTightnessTest}
                          disabled
                          size="small"
                        />
                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                          Water Tightness Test {selectedRepair.waterTightnessTest ? 'Passed' : 'Pending'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Checkbox
                          checked={selectedRepair.followUpReport}
                          disabled
                          size="small"
                        />
                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                          Follow-up Report {selectedRepair.followUpReport ? 'Submitted' : 'Pending'}
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>
                )}

                {selectedRepair.notes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.85rem', fontWeight: 600, color: TEXT_COLOR }}>
                      Notes
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                      <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                        {selectedRepair.notes}
                      </Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>

              <OutlineButton
                variant="text"
                size="small"
                startIcon={<FileText size={16} />}
                onClick={() => setAsBuiltModalOpen(true)}
                sx={{ mt: 2 }}
              >
                View As-Built Requirements
              </OutlineButton>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <OutlineButton onClick={() => setDetailsDialogOpen(false)} sx={{ fontSize: '0.85rem' }}>
                Close
              </OutlineButton>
              <OutlineButton
                variant="outlined"
                color="error"
                onClick={() => {
                  setDetailsDialogOpen(false);
                  handleSingleSoftDeleteClick(selectedRepair.id, selectedRepair.workOrderNumber, selectedRepair.name);
                }}
                startIcon={<Trash2 size={16} />}
                sx={{ fontSize: '0.85rem' }}
              >
                Move to Recycle Bin
              </OutlineButton>
              <UpdateButton
                variant="contained"
                onClick={() => {
                  setDetailsDialogOpen(false);
                  handleOpenEdit(selectedRepair);
                }}
                sx={{ fontSize: '0.85rem' }}
              >
                Edit
              </UpdateButton>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Edit Repair Dialog with Stepper */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedRepair && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontSize: '0.95rem', fontWeight: 600, color: TEXT_COLOR }}>
                    Edit Repair - {selectedRepair.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: GRAY_COLOR, fontSize: '0.75rem' }}>
                    Current Stage: {selectedRepair.stageName}
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              {renderStageContent(activeStep, 'edit')}
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'space-between', px: 3, py: 2 }}>
              <Box>
                {activeStep > 0 && (
                  <OutlineButton onClick={() => setActiveStep(prev => prev - 1)} sx={{ fontSize: '0.85rem' }}>
                    Previous
                  </OutlineButton>
                )}
              </Box>

              <Box>
                <OutlineButton onClick={() => setEditDialogOpen(false)} sx={{ mr: 1, fontSize: '0.85rem' }}>
                  Cancel
                </OutlineButton>
                {activeStep < REPAIR_STAGES.length - 1 ? (
                  <GradientButton
                    variant="contained"
                    onClick={() => setActiveStep(prev => prev + 1)}
                    sx={{ fontSize: '0.85rem' }}
                  >
                    Next Stage
                  </GradientButton>
                ) : (
                  <UpdateButton variant="contained" onClick={handleSaveRepair} sx={{ fontSize: '0.85rem' }}>
                    Save Changes
                  </UpdateButton>
                )}
              </Box>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* New Repair Dialog with Stepper */}
      <Dialog
        open={newRepairDialogOpen}
        onClose={() => setNewRepairDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <>
          <DialogTitle sx={{ pb: 1 }}>
            <Typography variant="h6" sx={{ fontSize: '0.95rem', fontWeight: 600, color: TEXT_COLOR }}>
              Create New Tank Repair Job
            </Typography>
          </DialogTitle>

          <DialogContent dividers>
            {activeStep === 0 ? (
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="Customer Name"
                  value={newRepair.name}
                  onChange={(e) => setNewRepair({ ...newRepair, name: e.target.value })}
                  size="small"
                  required
                  InputLabelProps={{ sx: { fontSize: '0.85rem' } }}
                  InputProps={{ sx: { fontSize: '0.85rem' } }}
                />
                <TextField
                  fullWidth
                  label="Address"
                  multiline
                  rows={2}
                  value={newRepair.address}
                  onChange={(e) => setNewRepair({ ...newRepair, address: e.target.value })}
                  size="small"
                  placeholder="Street Address - City, State ZIP"
                  required
                  InputLabelProps={{ sx: { fontSize: '0.85rem' } }}
                  InputProps={{ sx: { fontSize: '0.85rem' } }}
                />
              </Stack>
            ) : (
              renderStageContent(activeStep - 1, 'new')
            )}
          </DialogContent>

          <DialogActions sx={{ justifyContent: 'space-between', px: 3, py: 2 }}>
            <Box>
              {activeStep > 0 && (
                <OutlineButton onClick={() => setActiveStep(prev => prev - 1)} sx={{ fontSize: '0.85rem' }}>
                  Previous
                </OutlineButton>
              )}
            </Box>

            <Box>
              <OutlineButton onClick={() => setNewRepairDialogOpen(false)} sx={{ mr: 1, fontSize: '0.85rem' }}>
                Cancel
              </OutlineButton>
              {activeStep < 2 ? (
                <GradientButton
                  variant="contained"
                  onClick={() => setActiveStep(prev => prev + 1)}
                  disabled={activeStep === 0 && (!newRepair.name || !newRepair.address)}
                  sx={{ fontSize: '0.85rem' }}
                >
                  Next
                </GradientButton>
              ) : (
                <UpdateButton variant="contained" onClick={handleAddNewRepair} sx={{ fontSize: '0.85rem' }}>
                  Create Repair Job
                </UpdateButton>
              )}
            </Box>
          </DialogActions>
        </>
      </Dialog>

      {/* As-Built Requirements Modal */}
      <Modal
        open={asBuiltModalOpen}
        onClose={() => setAsBuiltModalOpen(false)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper sx={{
          width: '90%',
          maxWidth: 600,
          maxHeight: '80vh',
          overflow: 'auto',
          p: 3,
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', fontSize: '0.95rem' }}>
              <ClipboardCheck size={20} style={{ marginRight: 2, verticalAlign: 'middle' }} />
              As-Built Requirements
            </Typography>
            <IconButton onClick={() => setAsBuiltModalOpen(false)} size="small">
              <X size={20} />
            </IconButton>
          </Box>
          <Typography variant="body2" color="text.secondary" paragraph sx={{ fontSize: '0.85rem' }}>
            Full list of requirements for a functional as-built:
          </Typography>
          <List dense>
            {AS_BUILT_REQUIREMENTS.map((requirement, index) => (
              <ListItem key={index} sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Square size={16} color={GRAY_COLOR} />
                </ListItemIcon>
                <ListItemText
                  primary={requirement}
                  primaryTypographyProps={{ variant: 'body2', sx: { fontSize: '0.85rem' } }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Modal>

      {/* Recycle Bin Modal */}
      <RecycleBinModal
        open={recycleBinModalOpen}
        onClose={() => setRecycleBinModalOpen(false)}
        recycleBinItems={deletedRepairs}
        isRecycleBinLoading={isRecycleBinLoading}
        recycleBinSearch={recycleBinSearch}
        setRecycleBinSearch={setRecycleBinSearch}
        recycleBinPage={recycleBinPage}
        recycleBinRowsPerPage={recycleBinRowsPerPage}
        handleChangeRecycleBinPage={(event, newPage) => setRecycleBinPage(newPage)}
        handleChangeRecycleBinRowsPerPage={(event) => {
          setRecycleBinRowsPerPage(parseInt(event.target.value, 10));
          setRecycleBinPage(0);
        }}
        selectedRecycleBinItems={selectedRecycleBinItems}
        toggleRecycleBinSelection={toggleRecycleBinSelection}
        toggleAllRecycleBinSelection={toggleAllRecycleBinSelection}
        confirmBulkRestore={confirmBulkRestore}
        confirmBulkPermanentDelete={confirmBulkPermanentDelete}
        handleSingleRestore={handleSingleRestore}
        handleSinglePermanentDelete={handleSinglePermanentDelete}
        formatDateShort={formatDateShort}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{
            width: '100%',
            borderRadius: '6px',
            backgroundColor: snackbar.severity === 'success'
              ? alpha(GREEN_COLOR, 0.05)
              : alpha(RED_COLOR, 0.05),
            borderLeft: `4px solid ${snackbar.severity === 'success' ? GREEN_COLOR : RED_COLOR}`,
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
    </Box>
  );
};

export default Repairs;