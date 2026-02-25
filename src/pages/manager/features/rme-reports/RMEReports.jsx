import React, { useState, useMemo, useCallback } from 'react';
import {
    Box,
    Typography,
    Button,
    useTheme,
    useMediaQuery,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Alert,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { AlertTriangle, History, RotateCcw, Trash2 } from 'lucide-react';

// Hooks
import { useRmeData } from './hooks/useRmeData';
import { useRmeMutations } from './hooks/useRmeMutations';
import { useGlobalSnackbar } from '../../../../context/GlobalSnackbarContext';

// Components
import DashboardLoader from '../../../../components/Loader/DashboardLoader';
import Section from './components/shared/Section';
import SearchInput from './components/shared/SearchInput';
// Remove SnackbarAlert import since it's now global

// Tables
import ReportNeededTable from './components/tables/ReportNeededTable';
import ReportSubmittedTable from './components/tables/ReportSubmittedTable';
import HoldingTable from './components/tables/HoldingTable';
import FinalizedTable from './components/tables/FinalizedTable';

// Modals
import PDFViewerModal from './components/modals/PDFViewerModal';
import EditFormModal from './components/modals/EditFormModal';
import RmeRecycleBinModal from './components/modals/RmeRecycleBinModal';
import {
    DeleteConfirmationModal,
    RestoreConfirmationModal,
    PermanentDeleteConfirmationModal,
    LockConfirmationModal,
    DiscardConfirmationModal
} from './components/modals/ConfirmationModals';

// Constants
import {
    BLUE_COLOR,
    CYAN_COLOR,
    ORANGE_COLOR,
    GREEN_COLOR,
    PURPLE_COLOR,
    GRAY_COLOR,
    TEXT_COLOR,
    RED_COLOR
} from './utils/constants';
import RefreshButton from '../../../../components/ui/RefreshButton';

const RMEReports = () => {
    const queryClient = useQueryClient();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // Use global snackbar instead of local state
    const { showSnackbar } = useGlobalSnackbar();

    // State
    const [selectedReportNeeded, setSelectedReportNeeded] = useState(new Set());
    const [selectedReportSubmitted, setSelectedReportSubmitted] = useState(new Set());
    const [selectedHolding, setSelectedHolding] = useState(new Set());
    const [selectedFinalized, setSelectedFinalized] = useState(new Set());

    const [waitToLockAction, setWaitToLockAction] = useState(new Set());
    const [waitToLockDetails, setWaitToLockDetails] = useState({});

    const [pageReportNeeded, setPageReportNeeded] = useState(0);
    const [rowsPerPageReportNeeded, setRowsPerPageReportNeeded] = useState(isMobile ? 5 : 10);
    const [pageReportSubmitted, setPageReportSubmitted] = useState(0);
    const [rowsPerPageReportSubmitted, setRowsPerPageReportSubmitted] = useState(isMobile ? 5 : 10);
    const [pageHolding, setPageHolding] = useState(0);
    const [rowsPerPageHolding, setRowsPerPageHolding] = useState(isMobile ? 5 : 10);
    const [pageFinalized, setPageFinalized] = useState(0);
    const [rowsPerPageFinalized, setRowsPerPageFinalized] = useState(isMobile ? 5 : 10);

    const [searchReportNeeded, setSearchReportNeeded] = useState('');
    const [searchReportSubmitted, setSearchReportSubmitted] = useState('');
    const [searchHolding, setSearchHolding] = useState('');
    const [searchFinalized, setSearchFinalized] = useState('');

    const [recycleBinModalOpen, setRecycleBinModalOpen] = useState(false);
    const [recycleBinSearch, setRecycleBinSearch] = useState('');
    const [recycleBinPage, setRecycleBinPage] = useState(0);
    const [recycleBinRowsPerPage, setRecycleBinRowsPerPage] = useState(isMobile ? 5 : 10);
    const [selectedRecycleBinItems, setSelectedRecycleBinItems] = useState(new Set());

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedForDeletion, setSelectedForDeletion] = useState(new Set());
    const [deletionSection, setDeletionSection] = useState('');

    const [permanentDeleteDialogOpen, setPermanentDeleteDialogOpen] = useState(false);
    const [selectedForPermanentDeletion, setSelectedForPermanentDeletion] = useState(new Set());

    const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
    const [selectedForRestore, setSelectedForRestore] = useState(new Set());

    const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
    const [currentPdfUrl, setCurrentPdfUrl] = useState('');

    const [editFormModalOpen, setEditFormModalOpen] = useState(false);
    const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);

    const [lockedConfirmModal, setLockedConfirmModal] = useState({
        open: false,
        itemId: null,
        itemData: null,
        isLoading: false,
    });

    const [discardConfirmModal, setDiscardConfirmModal] = useState({
        open: false,
        itemId: null,
        itemData: null,
        isLoading: false,
    });

    // Single item actions for recycle bin
    const [selectedSingleItem, setSelectedSingleItem] = useState(null);
    const [singleRestoreDialogOpen, setSingleRestoreDialogOpen] = useState(false);
    const [singleDeleteDialogOpen, setSingleDeleteDialogOpen] = useState(false);

    // Custom Hooks
    const {
        processedData,
        deletedWorkOrders,
        isLoading,
        currentUser
    } = useRmeData();

    // Get all mutations - pass showSnackbar to useRmeMutations
    const {
        bulkSoftDeleteMutation,
        singleSoftDeleteMutation,
        permanentDeleteFromRecycleBinMutation,
        bulkPermanentDeleteMutation,
        restoreFromRecycleBinMutation,
        bulkRestoreMutation,
        lockReportMutation,
        waitToLockMutation,
        deleteReportMutation,
        invalidateAndRefetch
    } = useRmeMutations(currentUser, showSnackbar);

    // Filter data
    const filteredData = useMemo(() => {
        const filterItems = (items, search) => {
            if (!search) return items;
            const searchLower = search.toLowerCase();
            return items.filter(item =>
                item.technician?.toLowerCase().includes(searchLower) ||
                item.address?.toLowerCase().includes(searchLower) ||
                item.street?.toLowerCase().includes(searchLower) ||
                item.city?.toLowerCase().includes(searchLower) ||
                item.woNumber?.toLowerCase().includes(searchLower)
            );
        };

        return {
            reportNeeded: filterItems(processedData.reportNeeded, searchReportNeeded),
            reportSubmitted: filterItems(processedData.reportSubmitted, searchReportSubmitted),
            holding: filterItems(processedData.holding, searchHolding),
            finalized: filterItems(processedData.finalized, searchFinalized)
        };
    }, [processedData, searchReportNeeded, searchReportSubmitted, searchHolding, searchFinalized]);

    // Page items
    const pageItems = useMemo(() => ({
        reportNeeded: filteredData.reportNeeded.slice(
            pageReportNeeded * rowsPerPageReportNeeded,
            pageReportNeeded * rowsPerPageReportNeeded + rowsPerPageReportNeeded
        ),
        reportSubmitted: filteredData.reportSubmitted.slice(
            pageReportSubmitted * rowsPerPageReportSubmitted,
            pageReportSubmitted * rowsPerPageReportSubmitted + rowsPerPageReportSubmitted
        ),
        holding: filteredData.holding.slice(
            pageHolding * rowsPerPageHolding,
            pageHolding * rowsPerPageHolding + rowsPerPageHolding
        ),
        finalized: filteredData.finalized.slice(
            pageFinalized * rowsPerPageFinalized,
            pageFinalized * rowsPerPageFinalized + rowsPerPageFinalized
        )
    }), [filteredData, pageReportNeeded, rowsPerPageReportNeeded, pageReportSubmitted, rowsPerPageReportSubmitted, pageHolding, rowsPerPageHolding, pageFinalized, rowsPerPageFinalized]);

    // Handlers
    const handleViewPDF = useCallback((pdfUrl) => {
        setCurrentPdfUrl(pdfUrl);
        setPdfViewerOpen(true);
    }, []);

    const handleEditClick = useCallback((item) => {
        setSelectedWorkOrder(item);
        setEditFormModalOpen(true);
    }, []);

    const handleSaveForm = useCallback(() => {
        showSnackbar('Form saved successfully', 'success');
        invalidateAndRefetch();
        setEditFormModalOpen(false);
    }, [showSnackbar, invalidateAndRefetch]);

    const handleLockedClick = useCallback((id, itemData) => {
        setLockedConfirmModal({
            open: true,
            itemId: id,
            itemData: itemData,
            isLoading: false,
        });
    }, []);

    const confirmLockedAction = useCallback(async () => {
        const { itemId } = lockedConfirmModal;

        // 🔥 CLOSE MODAL IMMEDIATELY
        setLockedConfirmModal({
            open: false,
            itemId: null,
            itemData: null,
            isLoading: false,
        });

        // ℹ️ Show processing info
        showSnackbar('Locking report… please wait', 'info');

        try {
            await lockReportMutation.mutateAsync({ id: itemId });
            showSnackbar('Report locked successfully', 'success');
        } catch (error) {
            showSnackbar('Failed to lock report', 'error');
        }
    }, [lockedConfirmModal, lockReportMutation, showSnackbar]);

    const handleDiscardClick = useCallback((id, itemData) => {
        setDiscardConfirmModal({
            open: true,
            itemId: id,
            itemData: itemData,
            isLoading: false,
        });
    }, []);

    const confirmDiscardAction = useCallback(async () => {
        const { itemId } = discardConfirmModal;

        // 🔥 CLOSE MODAL IMMEDIATELY
        setDiscardConfirmModal({
            open: false,
            itemId: null,
            itemData: null,
            isLoading: false,
        });

        // ℹ️ Show processing info
        showSnackbar('Discarding report… please wait', 'info');

        try {
            await deleteReportMutation.mutateAsync({ id: itemId });
            showSnackbar('Report discarded successfully', 'success');
        } catch (error) {
            showSnackbar('Failed to discard report', 'error');
        }
    }, [discardConfirmModal, deleteReportMutation, showSnackbar]);

    const handleWaitToLockToggle = useCallback((id) => {
        setWaitToLockAction(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
                setWaitToLockDetails(prevDetails => {
                    const newDetails = { ...prevDetails };
                    delete newDetails[id];
                    return newDetails;
                });
            } else {
                newSet.add(id);
                setWaitToLockDetails(prevDetails => ({
                    ...prevDetails,
                    [id]: { reason: '', notes: '' }
                }));
            }
            return newSet;
        });
    }, []);

    const handleWaitToLockReasonChange = useCallback((id, reason) => {
        setWaitToLockDetails(prev => ({
            ...prev,
            [id]: { ...prev[id], reason }
        }));
    }, []);

    const handleWaitToLockNotesChange = useCallback((id, notes) => {
        setWaitToLockDetails(prev => ({
            ...prev,
            [id]: { ...prev[id], notes }
        }));
    }, []);

    const handleSaveReportSubmittedChanges = useCallback(async () => {
        const selectedItems = pageItems.reportSubmitted.filter(item =>
            waitToLockAction.has(item.id)
        );

        const actions = {
            waitToLock: [],
            invalidCombinations: []
        };

        selectedItems.forEach(item => {
            const details = waitToLockDetails[item.id] || { reason: '', notes: '' };
            if (details.reason) {
                actions.waitToLock.push({
                    id: item.id,
                    reason: details.reason,
                    notes: details.notes,
                });
            } else {
                actions.invalidCombinations.push({
                    id: item.id,
                    address: item.address,
                    error: 'Missing reason for Wait to Lock'
                });
            }
        });

        try {
            let message = '';

            if (actions.waitToLock.length > 0) {
                for (const action of actions.waitToLock) {
                    await waitToLockMutation.mutateAsync({
                        id: action.id,
                        reason: action.reason,
                        notes: action.notes,
                    });
                }
                message += `${actions.waitToLock.length} report(s) moved to Holding. `;
            }

            if (actions.invalidCombinations.length > 0) {
                const invalidAddresses = actions.invalidCombinations.map(ic => ic.address).join(', ');
                message += `${actions.invalidCombinations.length} report(s) have errors: ${invalidAddresses}.`;
                showSnackbar(message, 'warning');
            } else if (message) {
                showSnackbar(message, 'success');
            } else {
                showSnackbar('No Wait to Lock changes to save', 'info');
            }

            setWaitToLockAction(new Set());
            setWaitToLockDetails({});

        } catch (error) {
            showSnackbar('Failed to save changes', 'error');
        }
    }, [pageItems.reportSubmitted, waitToLockAction, waitToLockDetails, waitToLockMutation, showSnackbar]);

    // Soft delete handlers
    const handleSoftDelete = useCallback((selectionSet, section) => {
        if (selectionSet.size === 0) return;
        setSelectedForDeletion(selectionSet);
        setDeletionSection(section);
        setDeleteDialogOpen(true);
    }, []);

    const executeSoftDelete = useCallback(async () => {
        try {
            await bulkSoftDeleteMutation.mutateAsync(selectedForDeletion);
            // Clear selections after successful deletion
            setSelectedReportNeeded(new Set());
            setSelectedReportSubmitted(new Set());
            setSelectedHolding(new Set());
            setSelectedFinalized(new Set());
            setSelectedForDeletion(new Set());
            setDeleteDialogOpen(false);
        } catch (error) {
            // Error handled in mutation
        }
    }, [selectedForDeletion, bulkSoftDeleteMutation]);

    // Permanent delete handlers
    const handlePermanentDelete = useCallback((selectionSet) => {
        if (selectionSet.size === 0) return;
        setSelectedForPermanentDeletion(selectionSet);
        setPermanentDeleteDialogOpen(true);
    }, []);

    const executePermanentDelete = useCallback(async () => {
        try {
            await bulkPermanentDeleteMutation.mutateAsync(Array.from(selectedForPermanentDeletion));
            setSelectedRecycleBinItems(new Set());
            setPermanentDeleteDialogOpen(false);
            setSelectedForPermanentDeletion(new Set());
        } catch (error) {
            // Error handled in mutation
        }
    }, [selectedForPermanentDeletion, bulkPermanentDeleteMutation]);

    // Restore handlers
    const handleRestore = useCallback((selectionSet) => {
        if (selectionSet.size === 0) return;
        setSelectedForRestore(selectionSet);
        setRestoreDialogOpen(true);
    }, []);

    const executeRestore = useCallback(async () => {
        try {
            await bulkRestoreMutation.mutateAsync(Array.from(selectedForRestore));
            setSelectedRecycleBinItems(new Set());
            setRestoreDialogOpen(false);
            setSelectedForRestore(new Set());
        } catch (error) {
            // Error handled in mutation
        }
    }, [selectedForRestore, bulkRestoreMutation]);

    // Single item handlers for recycle bin
    const handleSingleRestore = useCallback((item) => {
        setSelectedSingleItem(item);
        setSingleRestoreDialogOpen(true);
    }, []);

    const handleSinglePermanentDelete = useCallback((item) => {
        setSelectedSingleItem(item);
        setSingleDeleteDialogOpen(true);
    }, []);

    // Fixed: Single restore handler with proper modal closing
    const executeSingleRestore = useCallback(() => {
        if (selectedSingleItem) {
            restoreFromRecycleBinMutation.mutate(selectedSingleItem.id, {
                onSuccess: () => {
                    setSingleRestoreDialogOpen(false);
                    setSelectedSingleItem(null);
                },
                onSettled: () => {
                    setSingleRestoreDialogOpen(false);
                    setSelectedSingleItem(null);
                }
            });
        }
    }, [selectedSingleItem, restoreFromRecycleBinMutation]);

    // Fixed: Single delete handler with proper modal closing
    const executeSinglePermanentDelete = useCallback(() => {
        if (selectedSingleItem) {
            permanentDeleteFromRecycleBinMutation.mutate(selectedSingleItem.id, {
                onSuccess: () => {
                    setSingleDeleteDialogOpen(false);
                    setSelectedSingleItem(null);
                },
                onSettled: () => {
                    setSingleDeleteDialogOpen(false);
                    setSelectedSingleItem(null);
                }
            });
        }
    }, [selectedSingleItem, permanentDeleteFromRecycleBinMutation]);

    // Move to recycle bin from edit form
    const handleMoveToRecycleBinFromEditForm = useCallback(async (id) => {
        try {
            await singleSoftDeleteMutation.mutateAsync(id);
        } catch (error) {
            throw error;
        }
    }, [singleSoftDeleteMutation]);

    // Selection helpers
    const toggleSelection = useCallback((setState, id) => {
        setState(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    }, []);

    const toggleAllSelection = useCallback((items, pageItems, selectedSet) => {
        const allPageIds = new Set(pageItems.map(item => item.id));
        const currentSelected = new Set(selectedSet);
        const allSelectedOnPage = Array.from(allPageIds).every(id => currentSelected.has(id));

        if (allSelectedOnPage) {
            const newSet = new Set(currentSelected);
            allPageIds.forEach(id => newSet.delete(id));
            return newSet;
        } else {
            const newSet = new Set([...currentSelected, ...allPageIds]);
            return newSet;
        }
    }, []);

    // Recycle bin pagination and selection helpers
    const recycleBinPageItems = useMemo(() => {
        return deletedWorkOrders.slice(
            recycleBinPage * recycleBinRowsPerPage,
            recycleBinPage * recycleBinRowsPerPage + recycleBinRowsPerPage
        );
    }, [deletedWorkOrders, recycleBinPage, recycleBinRowsPerPage]);

    const toggleRecycleBinSelection = useCallback((itemKey) => {
        setSelectedRecycleBinItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemKey)) newSet.delete(itemKey);
            else newSet.add(itemKey);
            return newSet;
        });
    }, []);

    const toggleAllRecycleBinSelection = useCallback(() => {
        const currentPageItems = recycleBinPageItems;
        const allPageIds = new Set(currentPageItems.map(item => item.id.toString()));
        const currentSelected = new Set(selectedRecycleBinItems);
        const allSelectedOnPage = Array.from(allPageIds).every(id => currentSelected.has(id));

        if (allSelectedOnPage) {
            const newSet = new Set(currentSelected);
            allPageIds.forEach(id => newSet.delete(id));
            setSelectedRecycleBinItems(newSet);
        } else {
            const newSet = new Set([...currentSelected, ...allPageIds]);
            setSelectedRecycleBinItems(newSet);
        }
    }, [recycleBinPageItems, selectedRecycleBinItems]);

    const handleChangeRecycleBinPage = useCallback((event, newPage) => {
        setRecycleBinPage(newPage);
    }, []);

    const handleChangeRecycleBinRowsPerPage = useCallback((event) => {
        setRecycleBinRowsPerPage(parseInt(event.target.value, 10));
        setRecycleBinPage(0);
    }, []);

    if (isLoading) {
        return <DashboardLoader />;
    }

    return (
        <Box>
            <Helmet>
                <title>RME Reports | Sterling Septic & Plumbing LLC</title>
                <meta name="description" content="Super Admin RME Reports page" />
            </Helmet>

            {/* FIXED: Header section with better mobile layout */}
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexDirection: isMobile ? 'column' : 'row',
                mb: 3,
                gap: isMobile ? 2 : 0
            }}>
                <Box>
                    <Typography
                        sx={{
                            fontWeight: 600,
                            mb: 0.5,
                            fontSize: isMobile ? '0.95rem' : '1rem',
                            color: TEXT_COLOR,
                            letterSpacing: '-0.01em',
                        }}
                    >
                        RME Report Tracking
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            color: GRAY_COLOR,
                            fontSize: isMobile ? '0.8rem' : '0.85rem',
                            fontWeight: 400,
                        }}
                    >
                        Track RME reports through 4 stages
                    </Typography>
                </Box>

                <Box>
                    <RefreshButton />
                    <Button
                        variant="outlined"
                        startIcon={<History size={isMobile ? 14 : 16} />}
                        onClick={() => setRecycleBinModalOpen(true)}
                        sx={{
                            textTransform: 'none',
                            ml: isMobile ? 1 : 1,
                            fontSize: isMobile ? '0.8rem' : '0.85rem',
                            fontWeight: 500,
                            color: PURPLE_COLOR,
                            borderColor: alpha(PURPLE_COLOR, 0.3),
                            minWidth: isMobile ? 'auto' : undefined,
                            '&:hover': {
                                borderColor: PURPLE_COLOR,
                                backgroundColor: alpha(PURPLE_COLOR, 0.05),
                            },
                        }}
                    >
                        {isSmallMobile ? `Bin (${deletedWorkOrders.length})` :
                            isMobile ? `Recycle Bin (${deletedWorkOrders.length})` :
                                `Recycle Bin (${deletedWorkOrders.length})`}
                    </Button>
                </Box>
            </Box>

            {/* Stage 1: Report Needed - FIXED: Hide search when items selected */}
            <Section
                title="Stage 1: Report Needed"
                color={BLUE_COLOR}
                count={filteredData.reportNeeded.length}
                selectedCount={selectedReportNeeded.size}
                additionalActions={
                    <Box sx={{
                        width: '100%',
                        mt: isMobile ? 1 : 0
                    }}>
                        {selectedReportNeeded.size > 0 ? (
                            <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                startIcon={<Trash2 size={16} />}
                                onClick={() => handleSoftDelete(selectedReportNeeded, 'Report Needed')}
                                sx={{
                                    textTransform: 'none',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    width: isMobile ? '100%' : 'auto',
                                }}
                            >
                                {isMobile ? `Delete (${selectedReportNeeded.size})` : `Delete Selected (${selectedReportNeeded.size})`}
                            </Button>
                        ) : (
                            <Box sx={{ width: '100%' }}>
                                <SearchInput
                                    value={searchReportNeeded}
                                    onChange={setSearchReportNeeded}
                                    placeholder="Search report needed..."
                                    fullWidth
                                    isMobile={isMobile}
                                />
                            </Box>
                        )}
                    </Box>
                }
                showDeleteButton={false}
                isMobile={isMobile}
            >
                <ReportNeededTable
                    items={pageItems.reportNeeded.slice().reverse()}
                    selected={selectedReportNeeded}
                    onToggleSelect={(id) => toggleSelection(setSelectedReportNeeded, id)}
                    onToggleAll={() => setSelectedReportNeeded(
                        toggleAllSelection(filteredData.reportNeeded, pageItems.reportNeeded, selectedReportNeeded)
                    )}
                    color={BLUE_COLOR}
                    totalCount={filteredData.reportNeeded.length}
                    page={pageReportNeeded}
                    rowsPerPage={rowsPerPageReportNeeded}
                    onPageChange={(e, newPage) => setPageReportNeeded(newPage)}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPageReportNeeded(parseInt(e.target.value, 10));
                        setPageReportNeeded(0);
                    }}
                    onViewPDF={handleViewPDF}
                    isMobile={isMobile}
                />
            </Section>

            {/* Stage 2: Report Submitted - FIXED: Hide search when items selected */}
            <Section
                title="Stage 2: Report Submitted"
                color={CYAN_COLOR}
                count={filteredData.reportSubmitted.length}
                selectedCount={selectedReportSubmitted.size}
                additionalActions={
                    <Box sx={{
                        width: '100%',
                        mt: isMobile ? 1 : 0
                    }}>
                        {selectedReportSubmitted.size > 0 ? (
                            <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                startIcon={<Trash2 size={16} />}
                                onClick={() => handleSoftDelete(selectedReportSubmitted, 'Report Submitted')}
                                sx={{
                                    textTransform: 'none',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    width: isMobile ? '100%' : 'auto',
                                }}
                            >
                                {isMobile ? `Delete (${selectedReportSubmitted.size})` : `Delete Selected (${selectedReportSubmitted.size})`}
                            </Button>
                        ) : (
                            <Box sx={{ width: '100%' }}>
                                <SearchInput
                                    value={searchReportSubmitted}
                                    onChange={setSearchReportSubmitted}
                                    placeholder="Search report submitted..."
                                    fullWidth
                                    isMobile={isMobile}
                                />
                            </Box>
                        )}
                    </Box>
                }
                showDeleteButton={false}
                isMobile={isMobile}
            >
                <ReportSubmittedTable
                    items={pageItems.reportSubmitted.slice().reverse()}
                    selected={selectedReportSubmitted}
                    onToggleSelect={(id) => toggleSelection(setSelectedReportSubmitted, id)}
                    onToggleAll={() => setSelectedReportSubmitted(
                        toggleAllSelection(filteredData.reportSubmitted, pageItems.reportSubmitted, selectedReportSubmitted)
                    )}
                    onLockedClick={handleLockedClick}
                    waitToLockAction={waitToLockAction}
                    onWaitToLockToggle={handleWaitToLockToggle}
                    onDiscardClick={handleDiscardClick}
                    waitToLockDetails={waitToLockDetails}
                    onWaitToLockReasonChange={handleWaitToLockReasonChange}
                    onWaitToLockNotesChange={handleWaitToLockNotesChange}
                    onSaveChanges={handleSaveReportSubmittedChanges}
                    waitToLockActionSize={waitToLockAction.size}
                    onEditClick={handleEditClick}
                    color={CYAN_COLOR}
                    totalCount={filteredData.reportSubmitted.length}
                    page={pageReportSubmitted}
                    rowsPerPage={rowsPerPageReportSubmitted}
                    onPageChange={(e, newPage) => setPageReportSubmitted(newPage)}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPageReportSubmitted(parseInt(e.target.value, 10));
                        setPageReportSubmitted(0);
                    }}
                    onViewPDF={handleViewPDF}
                    isMobile={isMobile}
                />
            </Section>

            {/* Stage 3: Holding - FIXED: Hide search when items selected */}
            <Section
                title="Stage 3: Holding"
                color={ORANGE_COLOR}
                count={filteredData.holding.length}
                selectedCount={selectedHolding.size}
                additionalActions={
                    <Box sx={{
                        width: '100%',
                        mt: isMobile ? 1 : 0
                    }}>
                        {selectedHolding.size > 0 ? (
                            <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                startIcon={<Trash2 size={16} />}
                                onClick={() => handleSoftDelete(selectedHolding, 'Holding')}
                                sx={{
                                    textTransform: 'none',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    width: isMobile ? '100%' : 'auto',
                                }}
                            >
                                {isMobile ? `Delete (${selectedHolding.size})` : `Delete Selected (${selectedHolding.size})`}
                            </Button>
                        ) : (
                            <Box sx={{ width: '100%' }}>
                                <SearchInput
                                    value={searchHolding}
                                    onChange={setSearchHolding}
                                    placeholder="Search holding..."
                                    fullWidth
                                    isMobile={isMobile}
                                />
                            </Box>
                        )}
                    </Box>
                }
                showDeleteButton={false}
                isMobile={isMobile}
            >
                <HoldingTable
                    items={pageItems.holding.slice().reverse()}
                    selected={selectedHolding}
                    onToggleSelect={(id) => toggleSelection(setSelectedHolding, id)}
                    onToggleAll={() => setSelectedHolding(
                        toggleAllSelection(filteredData.holding, pageItems.holding, selectedHolding)
                    )}
                    onLockedClick={handleLockedClick}
                    onDiscardClick={handleDiscardClick}
                    onEditClick={handleEditClick}
                    color={ORANGE_COLOR}
                    totalCount={filteredData.holding.length}
                    page={pageHolding}
                    rowsPerPage={rowsPerPageHolding}
                    onPageChange={(e, newPage) => setPageHolding(newPage)}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPageHolding(parseInt(e.target.value, 10));
                        setPageHolding(0);
                    }}
                    onViewPDF={handleViewPDF}
                    isMobile={isMobile}
                />
            </Section>

            {/* Stage 4: Finalized - FIXED: Hide search when items selected */}
            <Section
                title="Stage 4: Finalized"
                color={GREEN_COLOR}
                count={filteredData.finalized.length}
                selectedCount={selectedFinalized.size}
                additionalActions={
                    <Box sx={{
                        width: '100%',
                        mt: isMobile ? 1 : 0
                    }}>
                        {selectedFinalized.size > 0 ? (
                            <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                startIcon={<Trash2 size={16} />}
                                onClick={() => handleSoftDelete(selectedFinalized, 'Finalized')}
                                sx={{
                                    textTransform: 'none',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    width: isMobile ? '100%' : 'auto',
                                }}
                            >
                                {isMobile ? `Delete (${selectedFinalized.size})` : `Delete Selected (${selectedFinalized.size})`}
                            </Button>
                        ) : (
                            <Box sx={{ width: '100%' }}>
                                <SearchInput
                                    value={searchFinalized}
                                    onChange={setSearchFinalized}
                                    placeholder="Search finalized..."
                                    fullWidth
                                    isMobile={isMobile}
                                />
                            </Box>
                        )}
                    </Box>
                }
                showDeleteButton={false}
                isMobile={isMobile}
            >
                <FinalizedTable
                    items={pageItems.finalized}
                    selected={selectedFinalized}
                    onToggleSelect={(id) => toggleSelection(setSelectedFinalized, id)}
                    onToggleAll={() => setSelectedFinalized(
                        toggleAllSelection(filteredData.finalized, pageItems.finalized, selectedFinalized)
                    )}
                    color={GREEN_COLOR}
                    totalCount={filteredData.finalized.length}
                    page={pageFinalized}
                    rowsPerPage={rowsPerPageFinalized}
                    onPageChange={(e, newPage) => setPageFinalized(newPage)}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPageFinalized(parseInt(e.target.value, 10));
                        setPageFinalized(0);
                    }}
                    isMobile={isMobile}
                />
            </Section>

            {/* Modals */}
            <PDFViewerModal
                open={pdfViewerOpen}
                onClose={() => setPdfViewerOpen(false)}
                pdfUrl={currentPdfUrl}
            />

            <EditFormModal
                open={editFormModalOpen}
                onClose={() => setEditFormModalOpen(false)}
                workOrderData={selectedWorkOrder}
                onSave={handleSaveForm}
                showSnackbar={showSnackbar}
                onMoveToRecycleBin={handleMoveToRecycleBinFromEditForm}
            />

            <RmeRecycleBinModal
                open={recycleBinModalOpen}
                onClose={() => setRecycleBinModalOpen(false)}
                recycleBinItems={deletedWorkOrders}
                recycleBinSearch={recycleBinSearch}
                setRecycleBinSearch={setRecycleBinSearch}
                recycleBinPage={recycleBinPage}
                recycleBinRowsPerPage={recycleBinRowsPerPage}
                handleChangeRecycleBinPage={handleChangeRecycleBinPage}
                handleChangeRecycleBinRowsPerPage={handleChangeRecycleBinRowsPerPage}
                selectedRecycleBinItems={selectedRecycleBinItems}
                toggleRecycleBinSelection={toggleRecycleBinSelection}
                toggleAllRecycleBinSelection={toggleAllRecycleBinSelection}
                confirmBulkRestore={() => handleRestore(selectedRecycleBinItems)}
                confirmBulkPermanentDelete={() => handlePermanentDelete(selectedRecycleBinItems)}
                handleSingleRestore={handleSingleRestore}
                handleSinglePermanentDelete={handleSinglePermanentDelete}
                restoreFromRecycleBinMutation={restoreFromRecycleBinMutation}
                permanentDeleteFromRecycleBinMutation={permanentDeleteFromRecycleBinMutation}
                bulkRestoreMutation={bulkRestoreMutation}
                bulkPermanentDeleteMutation={bulkPermanentDeleteMutation}
                isMobile={isMobile}
                isSmallMobile={isSmallMobile}
            />

            {/* Confirmation Modals */}
            <DeleteConfirmationModal
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                title="Move to Recycle Bin"
                count={selectedForDeletion.size}
                section={deletionSection}
                isLoading={bulkSoftDeleteMutation.isPending}
                onConfirm={executeSoftDelete}
            />

            <RestoreConfirmationModal
                open={restoreDialogOpen}
                onClose={() => setRestoreDialogOpen(false)}
                count={selectedForRestore.size}
                isLoading={bulkRestoreMutation.isPending}
                onConfirm={executeRestore}
            />

            <PermanentDeleteConfirmationModal
                open={permanentDeleteDialogOpen}
                onClose={() => setPermanentDeleteDialogOpen(false)}
                count={selectedForPermanentDeletion.size}
                isLoading={bulkPermanentDeleteMutation.isPending}
                onConfirm={executePermanentDelete}
            />

            <LockConfirmationModal
                open={lockedConfirmModal.open}
                onClose={() => setLockedConfirmModal({ ...lockedConfirmModal, open: false })}
                itemData={lockedConfirmModal.itemData}
                isLoading={lockedConfirmModal.isLoading}
                onConfirm={confirmLockedAction}
            />

            <DiscardConfirmationModal
                open={discardConfirmModal.open}
                onClose={() => setDiscardConfirmModal({ ...discardConfirmModal, open: false })}
                itemData={discardConfirmModal.itemData}
                isLoading={discardConfirmModal.isLoading}
                onConfirm={confirmDiscardAction}
            />

            {/* Single Item Dialogs for Recycle Bin */}
            <Dialog
                open={singleRestoreDialogOpen}
                onClose={() => {
                    setSingleRestoreDialogOpen(false);
                    setSelectedSingleItem(null);
                }}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        bgcolor: 'white',
                        borderRadius: '6px',
                    }
                }}
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <RotateCcw size={20} color={GREEN_COLOR} />
                        <Typography variant="h6" sx={{ fontSize: '0.95rem', fontWeight: 600 }}>
                            Restore Item
                        </Typography>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2, fontSize: '0.85rem' }}>
                        Are you sure you want to restore work order <strong>{selectedSingleItem?.wo_number}</strong>?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            setSingleRestoreDialogOpen(false);
                            setSelectedSingleItem(null);
                        }}
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
                        color="success"
                        onClick={executeSingleRestore}
                        disabled={restoreFromRecycleBinMutation.isPending}
                        startIcon={restoreFromRecycleBinMutation.isPending ? <CircularProgress size={16} /> : <RotateCcw size={16} />}
                        sx={{
                            textTransform: 'none',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            px: 2,
                            bgcolor: GREEN_COLOR,
                            boxShadow: 'none',
                            '&:hover': {
                                bgcolor: alpha(GREEN_COLOR, 0.9),
                                boxShadow: 'none',
                            },
                        }}
                    >
                        {restoreFromRecycleBinMutation.isPending ? 'Restoring...' : 'Restore'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={singleDeleteDialogOpen}
                onClose={() => {
                    setSingleDeleteDialogOpen(false);
                    setSelectedSingleItem(null);
                }}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        bgcolor: 'white',
                        borderRadius: '6px',
                    }
                }}
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Trash2 size={20} color={RED_COLOR} />
                        <Typography variant="h6" sx={{ fontSize: '0.95rem', fontWeight: 600 }}>
                            Permanent Delete
                        </Typography>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2, fontSize: '0.85rem' }}>
                        Are you sure you want to permanently delete work order <strong>{selectedSingleItem?.wo_number}</strong>?
                        This action cannot be undone.
                    </Typography>
                    <Alert severity="warning" icon={<AlertTriangle size={20} />} sx={{ fontSize: '0.85rem' }}>
                        Item will be permanently removed and cannot be recovered.
                    </Alert>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            setSingleDeleteDialogOpen(false);
                            setSelectedSingleItem(null);
                        }}
                        variant='outlined'
                        color='error'
                        sx={{
                            textTransform: 'none',
                            fontSize: '0.85rem',
                            fontWeight: 400,
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={executeSinglePermanentDelete}
                        disabled={permanentDeleteFromRecycleBinMutation.isPending}
                        startIcon={permanentDeleteFromRecycleBinMutation.isPending ? <CircularProgress size={16} /> : <Trash2 size={16} />}
                        sx={{
                            textTransform: 'none',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                        }}
                    >
                        {permanentDeleteFromRecycleBinMutation.isPending ? 'Deleting...' : 'Delete Permanently'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default RMEReports;