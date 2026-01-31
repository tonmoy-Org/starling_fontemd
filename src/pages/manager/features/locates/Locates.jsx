import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Snackbar,
  Alert,
  Button,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../../../auth/AuthProvider';
import DashboardLoader from '../../../../components/Loader/DashboardLoader';
import OutlineButton from '../../../../components/ui/OutlineButton';
import {
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  History,
  Trash2,
  CheckCheck,
  RotateCcw,
} from 'lucide-react';

import { useLocates } from './hooks/useLocates';
import { useSelections } from './hooks/useSelections';
import LocateTable from './components/LocateTable';
import SearchInput from './components/SearchInput';
import RecycleBinModal from './components/RecycleBinModal';
import {
  DeleteDialog,
  RestoreDialog,
  CompleteDialog,
  PermanentDeleteDialog
} from './components/ConfirmationDialogs';

import {
  BLUE_COLOR,
  GREEN_COLOR,
  RED_COLOR,
  ORANGE_COLOR,
  GRAY_COLOR,
  PURPLE_COLOR,
  TEXT_COLOR,
} from './utils/constants';

// Move this function outside the component or use a proper utility
const getCalledAtDate = (item) => {
  if (!item?.calledAt) return '—';
  
  // Check if calledAt is a valid date
  const date = new Date(item.calledAt);
  if (isNaN(date.getTime())) return '—';
  
  // Format the date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const Locates = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();

  const [pagePending, setPagePending] = useState(0);
  const [rowsPerPagePending, setRowsPerPagePending] = useState(isMobile ? 5 : 10);
  const [pageInProgress, setPageInProgress] = useState(0);
  const [rowsPerPageInProgress, setRowsPerPageInProgress] = useState(isMobile ? 5 : 10);
  const [pageCompleted, setPageCompleted] = useState(0);
  const [rowsPerPageCompleted, setRowsPerPageCompleted] = useState(isMobile ? 5 : 10);

  const [searchPending, setSearchPending] = useState('');
  const [searchInProgress, setSearchInProgress] = useState('');
  const [searchCompleted, setSearchCompleted] = useState('');

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletionSection, setDeletionSection] = useState('');
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [recycleBinOpen, setRecycleBinOpen] = useState(false);
  const [recycleBinSearch, setRecycleBinSearch] = useState('');
  const [recycleBinPage, setRecycleBinPage] = useState(0);
  const [recycleBinRowsPerPage, setRecycleBinRowsPerPage] = useState(isMobile ? 5 : 10);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [permanentDeleteDialogOpen, setPermanentDeleteDialogOpen] = useState(false);
  const [singleRestoreDialogOpen, setSingleRestoreDialogOpen] = useState(false);
  const [singleDeleteDialogOpen, setSingleDeleteDialogOpen] = useState(false);
  const [selectedSingleItem, setSelectedSingleItem] = useState(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const currentUserName = user?.name || 'Admin User';
  const currentUserEmail = user?.email || 'admin@company.com';

  const {
    isLoading,
    isRecycleBinLoading,
    allPending,
    inProgress,
    completed,
    recycleBinItems,
    mutations: {
      markCalledMutation,
      softDeleteBulkMutation,
      completeWorkOrderManuallyMutation,
      bulkCompleteWorkOrdersMutation,
      restoreFromRecycleBinMutation,
      bulkRestoreMutation,
      permanentDeleteFromRecycleBinMutation,
      bulkPermanentDeleteMutation,
    },
  } = useLocates(currentUserName, currentUserEmail);

  const {
    selected: selectedPending,
    setSelected: setSelectedPending,
    toggleSelection: toggleSelectionPending,
    toggleAllSelection: toggleAllSelectionPending,
    clearSelection: clearSelectionPending,
  } = useSelections();

  const {
    selected: selectedInProgress,
    setSelected: setSelectedInProgress,
    toggleSelection: toggleSelectionInProgress,
    toggleAllSelection: toggleAllSelectionInProgress,
    clearSelection: clearSelectionInProgress,
  } = useSelections();

  const {
    selected: selectedCompleted,
    setSelected: setSelectedCompleted,
    toggleSelection: toggleSelectionCompleted,
    toggleAllSelection: toggleAllSelectionCompleted,
    clearSelection: clearSelectionCompleted,
  } = useSelections();

  const {
    selected: selectedRecycleBinItems,
    setSelected: setSelectedRecycleBinItems,
    toggleSelection: toggleRecycleBinSelection,
    toggleAllSelection: toggleAllRecycleBinSelection,
    clearSelection: clearSelectionRecycleBin,
  } = useSelections();

  const filteredPending = useMemo(() => {
    if (!searchPending) return allPending;
    const searchLower = searchPending.toLowerCase();
    return allPending.filter(l =>
      l.workOrderNumber?.toLowerCase().includes(searchLower) ||
      l.customerName?.toLowerCase().includes(searchLower) ||
      l.street?.toLowerCase().includes(searchLower) ||
      l.city?.toLowerCase().includes(searchLower) ||
      l.techName?.toLowerCase().includes(searchLower)
    );
  }, [allPending, searchPending]);

  const filteredInProgress = useMemo(() => {
    if (!searchInProgress) return inProgress;
    const searchLower = searchInProgress.toLowerCase();
    return inProgress.filter(l =>
      l.workOrderNumber?.toLowerCase().includes(searchLower) ||
      l.customerName?.toLowerCase().includes(searchLower) ||
      l.street?.toLowerCase().includes(searchLower) ||
      l.city?.toLowerCase().includes(searchLower) ||
      l.techName?.toLowerCase().includes(searchLower) ||
      l.calledByName?.toLowerCase().includes(searchLower)
    );
  }, [inProgress, searchInProgress]);

  const filteredCompleted = useMemo(() => {
    if (!searchCompleted) return completed;
    const searchLower = searchCompleted.toLowerCase();
    return completed.filter(l =>
      l.workOrderNumber?.toLowerCase().includes(searchLower) ||
      l.customerName?.toLowerCase().includes(searchLower) ||
      l.street?.toLowerCase().includes(searchLower) ||
      l.city?.toLowerCase().includes(searchLower) ||
      l.techName?.toLowerCase().includes(searchLower) ||
      l.calledByName?.toLowerCase().includes(searchLower)
    );
  }, [completed, searchCompleted]);

  const handleChangePagePending = (event, newPage) => {
    setPagePending(newPage);
  };

  const handleChangeRowsPerPagePending = (event) => {
    setRowsPerPagePending(parseInt(event.target.value, 10));
    setPagePending(0);
  };

  const handleChangePageInProgress = (event, newPage) => {
    setPageInProgress(newPage);
  };

  const handleChangeRowsPerPageInProgress = (event) => {
    setRowsPerPageInProgress(parseInt(event.target.value, 10));
    setPageInProgress(0);
  };

  const handleChangePageCompleted = (event, newPage) => {
    setPageCompleted(newPage);
  };

  const handleChangeRowsPerPageCompleted = (event) => {
    setRowsPerPageCompleted(parseInt(event.target.value, 10));
    setPageCompleted(0);
  };

  const handleChangeRecycleBinPage = (event, newPage) => {
    setRecycleBinPage(newPage);
  };

  const handleChangeRecycleBinRowsPerPage = (event) => {
    setRecycleBinRowsPerPage(parseInt(event.target.value, 10));
    setRecycleBinPage(0);
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleMarkCalled = (id, callType) => {
    markCalledMutation.mutate(
      { id, callType },
      {
        onSuccess: () => showSnackbar('Locate call status updated', 'success'),
        onError: (err) => showSnackbar(err?.response?.data?.message || 'Update failed', 'error'),
      }
    );
  };

  const handleManualCompletion = (id) => {
    completeWorkOrderManuallyMutation.mutate(id, {
      onSuccess: () => {
        clearSelectionInProgress();
        showSnackbar('Work order marked as complete', 'success');
      },
      onError: (err) => showSnackbar(err?.response?.data?.message || 'Manual completion failed', 'error'),
    });
  };

  const confirmSoftDelete = (selectionSet, section) => {
    if (selectionSet.size === 0) return;
    setDeletionSection(section);
    setDeleteDialogOpen(true);
  };

  const executeSoftDelete = () => {
    softDeleteBulkMutation.mutate(Array.from(getSelectedForDeletion()), {
      onSuccess: () => {
        clearAllSelections();
        setDeleteDialogOpen(false);
        showSnackbar('Selected items moved to recycle bin', 'success');
      },
      onError: (err) => showSnackbar(err?.response?.data?.message || 'Delete failed', 'error'),
    });
  };

  const confirmBulkComplete = () => {
    if (selectedInProgress.size === 0) return;
    setCompleteDialogOpen(true);
  };

  const executeBulkComplete = () => {
    bulkCompleteWorkOrdersMutation.mutate(Array.from(selectedInProgress), {
      onSuccess: () => {
        clearSelectionInProgress();
        setCompleteDialogOpen(false);
        showSnackbar(`${selectedInProgress.size} work order(s) marked as complete`, 'success');
      },
      onError: (err) => showSnackbar(err?.response?.data?.message || 'Bulk completion failed', 'error'),
    });
  };

  const confirmBulkRestore = () => {
    if (selectedRecycleBinItems.size === 0) return;
    setRestoreDialogOpen(true);
  };

  const executeBulkRestore = () => {
    bulkRestoreMutation.mutate(Array.from(selectedRecycleBinItems), {
      onSuccess: () => {
        clearSelectionRecycleBin();
        setRestoreDialogOpen(false);
        showSnackbar(`${selectedRecycleBinItems.size} item(s) restored`, 'success');
      },
      onError: (err) => showSnackbar(err?.response?.data?.message || 'Bulk restore failed', 'error'),
    });
  };

  const confirmBulkPermanentDelete = () => {
    if (selectedRecycleBinItems.size === 0) return;
    console.log('Opening permanent delete dialog for', selectedRecycleBinItems.size, 'items');
    setPermanentDeleteDialogOpen(true);
  };

  const executeBulkPermanentDelete = () => {
    bulkPermanentDeleteMutation.mutate(Array.from(selectedRecycleBinItems), {
      onSuccess: () => {
        clearSelectionRecycleBin();
        setPermanentDeleteDialogOpen(false);
        showSnackbar(`${selectedRecycleBinItems.size} item(s) permanently deleted`, 'success');
      },
      onError: (err) => showSnackbar(err?.response?.data?.message || 'Bulk permanent delete failed', 'error'),
    });
  };

  const handleSingleRestore = (item) => {
    setSelectedSingleItem(item);
    setSingleRestoreDialogOpen(true);
  };

  const executeSingleRestore = () => {
    if (selectedSingleItem) {
      restoreFromRecycleBinMutation.mutate(selectedSingleItem.id, {
        onSuccess: () => {
          setSingleRestoreDialogOpen(false);
          setSelectedSingleItem(null);
          showSnackbar('Item restored successfully', 'success');
        },
        onError: (err) => showSnackbar(err?.response?.data?.message || 'Restore failed', 'error'),
      });
    }
  };

  const handleSinglePermanentDelete = (item) => {
    setSelectedSingleItem(item);
    setSingleDeleteDialogOpen(true);
  };

  const executeSinglePermanentDelete = () => {
    if (selectedSingleItem) {
      permanentDeleteFromRecycleBinMutation.mutate(selectedSingleItem.id, {
        onSuccess: () => {
          setSingleDeleteDialogOpen(false);
          setSelectedSingleItem(null);
          showSnackbar('Item permanently deleted', 'success');
        },
        onError: (err) => showSnackbar(err?.response?.data?.message || 'Permanent delete failed', 'error'),
      });
    }
  };

  const getSelectedForDeletion = () => {
    if (deletionSection === 'Pending Locates') return selectedPending;
    if (deletionSection === 'In Progress') return selectedInProgress;
    if (deletionSection === 'Completed') return selectedCompleted;
    return new Set();
  };

  const clearAllSelections = () => {
    if (deletionSection === 'Pending Locates') clearSelectionPending();
    if (deletionSection === 'In Progress') clearSelectionInProgress();
    if (deletionSection === 'Completed') clearSelectionCompleted();
  };

  // Helper function to toggle all items on current page for recycle bin
  const toggleAllRecycleBinSelectionHandler = () => {
    const currentPageItems = recycleBinItems.slice(
      recycleBinPage * recycleBinRowsPerPage,
      recycleBinPage * recycleBinRowsPerPage + recycleBinRowsPerPage
    );
    const currentPageIds = new Set(currentPageItems.map(item => item.id));
    const currentSelected = new Set(selectedRecycleBinItems);
    const allSelectedOnPage = Array.from(currentPageIds).every(id => currentSelected.has(id));

    if (allSelectedOnPage) {
      const newSet = new Set(currentSelected);
      currentPageIds.forEach(id => newSet.delete(id));
      setSelectedRecycleBinItems(newSet);
    } else {
      const newSet = new Set([...currentSelected, ...currentPageIds]);
      setSelectedRecycleBinItems(newSet);
    }
  };

  const pendingPageItems = filteredPending.slice(
    pagePending * rowsPerPagePending,
    pagePending * rowsPerPagePending + rowsPerPagePending
  );

  const inProgressPageItems = filteredInProgress.slice(
    pageInProgress * rowsPerPageInProgress,
    pageInProgress * rowsPerPageInProgress + rowsPerPageInProgress
  );

  const completedPageItems = filteredCompleted.slice(
    pageCompleted * rowsPerPageCompleted,
    pageCompleted * rowsPerPageCompleted + rowsPerPageCompleted
  );

  if (isLoading) {
    return <DashboardLoader />;
  }

  return (
    <Box>
      <Helmet>
        <title>Locates | Sterling Septic & Plumbing LLC</title>
        <meta name="description" content="Super Admin Locates page" />
      </Helmet>

      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3,
      }}>
        <Box>
          <Typography sx={{
            fontWeight: 600,
            mb: 0.5,
            fontSize: '1rem',
            color: TEXT_COLOR,
            letterSpacing: '-0.01em',
          }}>
            Locate Management
          </Typography>
          <Typography variant="body2" sx={{
            color: GRAY_COLOR,
            fontSize: '0.85rem',
            fontWeight: 400,
          }}>
            Dispatch and monitor locate
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<History size={16} />}
          onClick={() => setRecycleBinOpen(true)}
          sx={{
            textTransform: 'none',
            fontSize: '0.85rem',
            fontWeight: 500,
            color: PURPLE_COLOR,
            borderColor: alpha(PURPLE_COLOR, 0.3),
            '&:hover': {
              borderColor: PURPLE_COLOR,
              backgroundColor: alpha(PURPLE_COLOR, 0.05),
            },
          }}
        >
          {isMobile ? `Bin (${recycleBinItems.length})` : `Recycle Bin (${recycleBinItems.length})`}
        </Button>
      </Box>

      {/* Pending Locates */}
      <Paper elevation={0} sx={{
        mb: 4,
        borderRadius: '6px',
        overflow: 'hidden',
        border: `1px solid ${alpha(BLUE_COLOR, 0.15)}`,
        bgcolor: 'white',
      }}>
        <Box sx={{
          p: isMobile ? 1 : 1.5,
          bgcolor: 'white',
          borderBottom: `1px solid ${alpha(BLUE_COLOR, 0.1)}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 1 : 0,
        }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            width: isMobile ? '100%' : 'auto',
            justifyContent: isMobile ? 'space-between' : 'flex-start',
          }}>
            <Typography sx={{
              fontSize: isMobile ? '0.85rem' : '1rem',
              color: TEXT_COLOR,
              fontWeight: 600,
            }}>
              Pending Locates
              <Chip
                size="small"
                label={allPending.length}
                sx={{
                  ml: 1,
                  bgcolor: alpha(BLUE_COLOR, 0.08),
                  color: TEXT_COLOR,
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  height: '22px',
                  '& .MuiChip-label': { px: 1 },
                }}
              />
            </Typography>
            {selectedPending.size > 0 && (
              <OutlineButton
                size="small"
                onClick={() => confirmSoftDelete(selectedPending, 'Pending Locates')}
                startIcon={<Trash2 size={14} />}
              >
                Delete ({selectedPending.size})
              </OutlineButton>
            )}
          </Box>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            width: isMobile ? '100%' : 'auto',
            justifyContent: isMobile ? 'space-between' : 'flex-end',
          }}>
            <SearchInput
              value={searchPending}
              onChange={setSearchPending}
              placeholder="Search pending locates..."
              color={BLUE_COLOR}
              fullWidth={isMobile}
            />
          </Box>
        </Box>
        <LocateTable
          items={pendingPageItems}
          selected={selectedPending}
          onToggleSelect={toggleSelectionPending}
          onToggleAll={() => toggleAllSelectionPending(pendingPageItems)}
          onMarkCalled={handleMarkCalled}
          color={BLUE_COLOR}
          showCallAction
          totalCount={filteredPending.length}
          page={pagePending}
          rowsPerPage={rowsPerPagePending}
          onPageChange={handleChangePagePending}
          onRowsPerPageChange={handleChangeRowsPerPagePending}
          markCalledMutation={markCalledMutation}
          tableType="pending"
          getCalledAtDate={getCalledAtDate}
          isMobile={isMobile}
        />
      </Paper>

      {/* In Progress */}
      <Paper elevation={0} sx={{
        mb: 4,
        borderRadius: '6px',
        overflow: 'hidden',
        border: `1px solid ${alpha(ORANGE_COLOR, 0.15)}`,
        bgcolor: 'white',
      }}>
        <Box sx={{
          p: isMobile ? 1 : 1.5,
          bgcolor: 'white',
          borderBottom: `1px solid ${alpha(ORANGE_COLOR, 0.1)}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 1 : 0,
        }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            width: isMobile ? '100%' : 'auto',
            justifyContent: isMobile ? 'space-between' : 'flex-start',
          }}>
            <Typography sx={{
              fontSize: isMobile ? '0.85rem' : '1rem',
              color: TEXT_COLOR,
              fontWeight: 600,
            }}>
              In Progress
              <Chip
                size="small"
                label={inProgress.length}
                sx={{
                  ml: 1,
                  bgcolor: alpha(ORANGE_COLOR, 0.08),
                  color: TEXT_COLOR,
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  height: '22px',
                  '& .MuiChip-label': { px: 1 },
                }}
              />
            </Typography>
            {selectedInProgress.size > 0 && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  onClick={confirmBulkComplete}
                  startIcon={<CheckCheck size={14} />}
                  disabled={bulkCompleteWorkOrdersMutation.isPending}
                  sx={{
                    textTransform: 'none',
                    fontSize: '0.75rem',
                    px: 1.5,
                    borderRadius: '2px',
                    bgcolor: GREEN_COLOR,
                    '&:hover': { bgcolor: alpha(GREEN_COLOR, 0.9) },
                  }}
                >
                  Complete ({selectedInProgress.size})
                </Button>
                <OutlineButton
                  size="small"
                  onClick={() => confirmSoftDelete(selectedInProgress, 'In Progress')}
                  startIcon={<Trash2 size={14} />}
                >
                  Delete ({selectedInProgress.size})
                </OutlineButton>
              </Box>
            )}
          </Box>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            width: isMobile ? '100%' : 'auto',
            justifyContent: isMobile ? 'space-between' : 'flex-end',
          }}>
            <SearchInput
              value={searchInProgress}
              onChange={setSearchInProgress}
              placeholder="Search in progress..."
              color={ORANGE_COLOR}
              fullWidth={isMobile}
            />
          </Box>
        </Box>
        <LocateTable
          items={inProgressPageItems}
          selected={selectedInProgress}
          onToggleSelect={toggleSelectionInProgress}
          onToggleAll={() => toggleAllSelectionInProgress(inProgressPageItems)}
          onManualComplete={handleManualCompletion}
          color={ORANGE_COLOR}
          showTimerColumn
          showCalledBy
          showManualCompleteAction={true}
          totalCount={filteredInProgress.length}
          page={pageInProgress}
          rowsPerPage={rowsPerPageInProgress}
          onPageChange={handleChangePageInProgress}
          onRowsPerPageChange={handleChangeRowsPerPageInProgress}
          completeWorkOrderManuallyMutation={completeWorkOrderManuallyMutation}
          tableType="inProgress"
          getCalledAtDate={getCalledAtDate}
          isMobile={isMobile}
        />
      </Paper>

      {/* Completed */}
      <Paper elevation={0} sx={{
        mb: 4,
        borderRadius: '6px',
        overflow: 'hidden',
        border: `1px solid ${alpha(GREEN_COLOR, 0.15)}`,
        bgcolor: 'white',
      }}>
        <Box sx={{
          p: isMobile ? 1 : 1.5,
          bgcolor: 'white',
          borderBottom: `1px solid ${alpha(GREEN_COLOR, 0.1)}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 1 : 0,
        }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            width: isMobile ? '100%' : 'auto',
            justifyContent: isMobile ? 'space-between' : 'flex-start',
          }}>
            <Typography sx={{
              fontSize: isMobile ? '0.85rem' : '1rem',
              color: TEXT_COLOR,
              fontWeight: 600,
            }}>
              Completed
              <Chip
                size="small"
                label={completed.length}
                sx={{
                  ml: 1,
                  bgcolor: alpha(GREEN_COLOR, 0.08),
                  color: TEXT_COLOR,
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  height: '22px',
                  '& .MuiChip-label': { px: 1 },
                }}
              />
            </Typography>
            {selectedCompleted.size > 0 && (
              <OutlineButton
                size="small"
                onClick={() => confirmSoftDelete(selectedCompleted, 'Completed')}
                startIcon={<Trash2 size={14} />}
              >
                Delete ({selectedCompleted.size})
              </OutlineButton>
            )}
          </Box>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            width: isMobile ? '100%' : 'auto',
            justifyContent: isMobile ? 'space-between' : 'flex-end',
          }}>
            <SearchInput
              value={searchCompleted}
              onChange={setSearchCompleted}
              placeholder="Search completed..."
              color={GREEN_COLOR}
              fullWidth={isMobile}
            />
          </Box>
        </Box>
        <LocateTable
          items={completedPageItems}
          selected={selectedCompleted}
          onToggleSelect={toggleSelectionCompleted}
          onToggleAll={() => toggleAllSelectionCompleted(completedPageItems)}
          color={GREEN_COLOR}
          showCalledBy
          showTimerColumn={false}
          totalCount={filteredCompleted.length}
          page={pageCompleted}
          rowsPerPage={rowsPerPageCompleted}
          onPageChange={handleChangePageCompleted}
          onRowsPerPageChange={handleChangeRowsPerPageCompleted}
          tableType="completed"
          getCalledAtDate={getCalledAtDate}
          isMobile={isMobile}
        />
      </Paper>

      {/* Recycle Bin Modal */}
      <RecycleBinModal
        open={recycleBinOpen}
        onClose={() => setRecycleBinOpen(false)}
        recycleBinItems={recycleBinItems}
        isRecycleBinLoading={isRecycleBinLoading}
        recycleBinSearch={recycleBinSearch}
        setRecycleBinSearch={setRecycleBinSearch}
        recycleBinPage={recycleBinPage}
        recycleBinRowsPerPage={recycleBinRowsPerPage}
        handleChangeRecycleBinPage={handleChangeRecycleBinPage}
        handleChangeRecycleBinRowsPerPage={handleChangeRecycleBinRowsPerPage}
        selectedRecycleBinItems={selectedRecycleBinItems}
        toggleRecycleBinSelection={toggleRecycleBinSelection}
        toggleAllRecycleBinSelection={toggleAllRecycleBinSelectionHandler}
        confirmBulkRestore={confirmBulkRestore}
        confirmBulkPermanentDelete={confirmBulkPermanentDelete}
        handleSingleRestore={handleSingleRestore}
        handleSinglePermanentDelete={handleSinglePermanentDelete}
        restoreFromRecycleBinMutation={restoreFromRecycleBinMutation}
        permanentDeleteFromRecycleBinMutation={permanentDeleteFromRecycleBinMutation}
        bulkRestoreMutation={bulkRestoreMutation}
        bulkPermanentDeleteMutation={bulkPermanentDeleteMutation}
        isMobile={isMobile}
        isSmallMobile={isSmallMobile}
      />

      {/* Confirmation Dialogs */}
      <DeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={executeSoftDelete}
        selectedCount={getSelectedForDeletion().size}
        deletionSection={deletionSection}
        isLoading={softDeleteBulkMutation.isPending}
      />

      <CompleteDialog
        open={completeDialogOpen}
        onClose={() => setCompleteDialogOpen(false)}
        onConfirm={executeBulkComplete}
        selectedCount={selectedInProgress.size}
        isLoading={bulkCompleteWorkOrdersMutation.isPending}
      />

      <RestoreDialog
        open={restoreDialogOpen}
        onClose={() => setRestoreDialogOpen(false)}
        onConfirm={executeBulkRestore}
        selectedCount={selectedRecycleBinItems.size}
        isLoading={bulkRestoreMutation.isPending}
      />

      <PermanentDeleteDialog
        open={permanentDeleteDialogOpen}
        onClose={() => setPermanentDeleteDialogOpen(false)}
        onConfirm={executeBulkPermanentDelete}
        selectedCount={selectedRecycleBinItems.size}
        isLoading={bulkPermanentDeleteMutation.isPending}
      />

      {/* Single Action Dialogs */}
      <SingleActionDialog
        open={singleRestoreDialogOpen}
        onClose={() => {
          setSingleRestoreDialogOpen(false);
          setSelectedSingleItem(null);
        }}
        onConfirm={executeSingleRestore}
        title="Restore Item"
        message={`Are you sure you want to restore work order ${selectedSingleItem?.workOrderNumber}?`}
        confirmText="Restore"
        isLoading={restoreFromRecycleBinMutation.isPending}
        icon={<RotateCcw size={20} color={GREEN_COLOR} />}
        confirmColor={GREEN_COLOR}
      />

      <SingleActionDialog
        open={singleDeleteDialogOpen}
        onClose={() => {
          setSingleDeleteDialogOpen(false);
          setSelectedSingleItem(null);
        }}
        onConfirm={executeSinglePermanentDelete}
        title="Permanent Delete"
        message={`Are you sure you want to permanently delete work order ${selectedSingleItem?.workOrderNumber}? This action cannot be undone.`}
        confirmText="Delete Permanently"
        isLoading={permanentDeleteFromRecycleBinMutation.isPending}
        icon={<Trash2 size={20} color={RED_COLOR} />}
        confirmColor={RED_COLOR}
        showWarning
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
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
            backgroundColor: snackbar.severity === 'success'
              ? alpha(GREEN_COLOR, 0.05)
              : snackbar.severity === 'error'
                ? alpha(RED_COLOR, 0.05)
                : snackbar.severity === 'warning'
                  ? alpha(ORANGE_COLOR, 0.05)
                  : alpha(BLUE_COLOR, 0.05),
            borderLeft: `4px solid ${snackbar.severity === 'success' ? GREEN_COLOR :
              snackbar.severity === 'error' ? RED_COLOR :
                snackbar.severity === 'warning' ? ORANGE_COLOR : BLUE_COLOR}`,
            '& .MuiAlert-icon': {
              color: snackbar.severity === 'success' ? GREEN_COLOR :
                snackbar.severity === 'error' ? RED_COLOR :
                  snackbar.severity === 'warning' ? ORANGE_COLOR : BLUE_COLOR,
            },
            '& .MuiAlert-message': { py: 0.5 },
          }}
          elevation={6}
        >
          <Typography sx={{
            fontSize: '0.85rem',
            fontWeight: 500,
            color: TEXT_COLOR,
          }}>
            {snackbar.message}
          </Typography>
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Single Action Dialog Component
const SingleActionDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  isLoading,
  icon,
  confirmColor,
  showWarning = false,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { bgcolor: 'white', borderRadius: '6px' },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {icon}
          <Typography variant="h6" sx={{ fontSize: '0.95rem', fontWeight: 600 }}>
            {title}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2, fontSize: '0.85rem' }}>
          {message}
        </Typography>
        {showWarning && (
          <Alert severity="warning" icon={<AlertTriangle size={20} />} sx={{ fontSize: '0.85rem' }}>
            Item will be permanently removed and cannot be recovered.
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          sx={{
            textTransform: 'none',
            color: TEXT_COLOR,
            fontSize: '0.85rem',
            fontWeight: 400,
            px: 2,
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={isLoading}
          startIcon={icon}
          sx={{
            textTransform: 'none',
            fontSize: '0.85rem',
            fontWeight: 500,
            px: 2,
            bgcolor: confirmColor,
            boxShadow: 'none',
            '&:hover': {
              bgcolor: alpha(confirmColor, 0.9),
              boxShadow: 'none',
            },
          }}
        >
          {isLoading ? `${confirmText}...` : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Locates;