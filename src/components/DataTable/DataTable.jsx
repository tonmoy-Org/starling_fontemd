import React from 'react';
import {
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Box,
    Chip,
    Typography,
    alpha,
} from '@mui/material';
import { Search, X, User } from 'lucide-react';

// Default color constants
const DEFAULT_COLORS = {
    text: '#0F1115',
    primary: '#1976d2',
    success: '#10b981',
    error: '#ef4444',
    warning: '#ed6c02',
    gray: '#6b7280',
};

// Search Input Component
const SearchInput = ({
    value,
    onChange,
    placeholder = 'Search...',
    color = DEFAULT_COLORS.primary,
    fullWidth = false,
    sx = {}
}) => {
    return (
        <Box sx={{ position: 'relative', width: fullWidth ? '100%' : 250, ...sx }}>
            <Box
                component="input"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                sx={{
                    width: '100%',
                    fontSize: '0.8rem',
                    height: '36px',
                    paddingLeft: '36px',
                    paddingRight: value ? '36px' : '16px',
                    border: `1px solid ${alpha(color, 0.2)}`,
                    borderRadius: '4px',
                    outline: 'none',
                    backgroundColor: 'white',
                    '&:focus': {
                        borderColor: color,
                        boxShadow: `0 0 0 2px ${alpha(color, 0.1)}`,
                    },
                    '&::placeholder': {
                        color: alpha(DEFAULT_COLORS.gray, 0.6),
                    },
                }}
            />
            <Search
                size={16}
                color={DEFAULT_COLORS.gray}
                style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                }}
            />
            {value && (
                <Box
                    component="button"
                    onClick={() => onChange('')}
                    sx={{
                        position: 'absolute',
                        right: '4px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        padding: '4px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: DEFAULT_COLORS.gray,
                        '&:hover': {
                            color: DEFAULT_COLORS.text,
                        },
                    }}
                >
                    <X size={16} />
                </Box>
            )}
        </Box>
    );
};

// Empty State Component
const EmptyState = ({
    icon: Icon = User,
    title,
    description,
    iconSize = 32,
    iconColor = 'rgba(15, 17, 21, 0.2)',
    textColor = DEFAULT_COLORS.text,
}) => {
    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
            py: 6,
        }}>
            <Icon size={iconSize} color={iconColor} />
            <Typography
                variant="body2"
                sx={{
                    color: textColor,
                    opacity: 0.6,
                    fontSize: '0.85rem',
                    fontWeight: 500,
                }}
            >
                {title}
            </Typography>
            {description && (
                <Typography
                    variant="caption"
                    sx={{
                        color: textColor,
                        opacity: 0.4,
                        fontSize: '0.75rem',
                    }}
                >
                    {description}
                </Typography>
            )}
        </Box>
    );
};

// Main DataTable Component
export const DataTable = ({
    // Data
    data = [],
    columns = [],

    // Pagination
    pagination = true,
    page = 0,
    rowsPerPage = 10,
    totalCount = 0,
    rowsPerPageOptions = [5, 10, 25, 50],
    onPageChange,
    onRowsPerPageChange,

    // Search
    search = true,
    searchValue = '',
    onSearchChange,
    searchPlaceholder = 'Search...',

    // Header
    title = '',
    subtitle = '',
    showCount = true,
    headerActions = null,

    // Styling
    color = DEFAULT_COLORS.primary,
    borderColor = null,
    elevation = 0,
    minWidth = 800,

    // Loading & Empty States
    loading = false,
    loadingComponent = null,
    emptyStateTitle = 'No data found.',
    emptyStateDescription = '',
    emptyStateIcon = User,

    // Custom rendering
    renderRow,
    renderHeader = null,
    renderFooter = null,

    // Mobile
    isMobile = false,

    // Callbacks
    onRowClick,

    // Additional props
    sx = {},
    tableSx = {},
    containerSx = {},
}) => {
    // Use provided border color or derive from primary color
    const tableBorderColor = borderColor || alpha(color, 0.15);
    const headerBgColor = alpha(color, 0.04);
    const headerBorderColor = alpha(color, 0.1);

    // Calculate showing count
    const showingCount = pagination
        ? Math.min((page * rowsPerPage) + rowsPerPage, totalCount || data.length)
        : data.length;

    // Handle row click
    const handleRowClick = (row, index) => {
        if (onRowClick) {
            onRowClick(row, index);
        }
    };

    // Render default row if no custom renderRow provided
    const renderDefaultRow = (row, index) => {
        return (
            <TableRow
                key={row.id || index}
                hover={!!onRowClick}
                onClick={() => handleRowClick(row, index)}
                sx={{
                    cursor: onRowClick ? 'pointer' : 'default',
                    '&:hover': {
                        backgroundColor: onRowClick ? alpha(color, 0.05) : 'inherit',
                    },
                    '&:last-child td': {
                        borderBottom: 'none',
                    },
                }}
            >
                {columns.map((column, colIndex) => (
                    <TableCell
                        key={colIndex}
                        align={column.align || 'left'}
                        sx={column.sx || {}}
                    >
                        {column.render ? column.render(row) : row[column.field]}
                    </TableCell>
                ))}
            </TableRow>
        );
    };

    return (
        <Paper
            elevation={elevation}
            sx={{
                mb: 4,
                borderRadius: '6px',
                overflow: 'hidden',
                border: `1px solid ${tableBorderColor}`,
                bgcolor: 'white',
                ...sx,
            }}
        >
            {/* Header Section */}
            {(title || search || headerActions) && (
                <Box
                    sx={{
                        p: isMobile ? 1 : 1.5,
                        bgcolor: 'white',
                        borderBottom: `1px solid ${headerBorderColor}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: isMobile ? 1 : 0,
                    }}
                >
                    {/* Left side - Title and count */}
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        width: isMobile ? '100%' : 'auto',
                        justifyContent: isMobile ? 'space-between' : 'flex-start'
                    }}>
                        {title && (
                            <Typography
                                sx={{
                                    fontSize: isMobile ? '0.85rem' : '1rem',
                                    color: DEFAULT_COLORS.text,
                                    fontWeight: 600,
                                }}
                            >
                                {title}
                                {showCount && (
                                    <Chip
                                        size="small"
                                        label={totalCount || data.length}
                                        sx={{
                                            ml: 1,
                                            bgcolor: alpha(color, 0.08),
                                            color: DEFAULT_COLORS.text,
                                            fontSize: '0.75rem',
                                            fontWeight: 500,
                                            height: '22px',
                                            '& .MuiChip-label': {
                                                px: 1,
                                            },
                                        }}
                                    />
                                )}
                            </Typography>
                        )}
                        {subtitle && (
                            <Typography
                                variant="body2"
                                sx={{
                                    color: DEFAULT_COLORS.gray,
                                    fontSize: '0.8rem',
                                    fontWeight: 400,
                                }}
                            >
                                {subtitle}
                            </Typography>
                        )}
                    </Box>

                    {/* Right side - Search and actions */}
                    <Box sx={{
                        display: { md: 'flex' },
                        alignItems: 'center',
                        gap: 1.5,
                        width: isMobile ? '100%' : 'auto',
                        justifyContent: isMobile ? 'space-between' : 'flex-end'
                    }}>
                        <Box sx={{
                            display: 'flex',
                            gap: 1,
                            width: isMobile ? '100%' : 'auto',
                            flexDirection: isMobile ? 'column' : 'row',
                            mt: isMobile ? 1 : 0
                        }}>
                            {search && (
                                <SearchInput
                                    value={searchValue}
                                    onChange={onSearchChange}
                                    placeholder={searchPlaceholder}
                                    color={color}
                                    fullWidth={isMobile}
                                />
                            )}
                            {headerActions && headerActions}
                        </Box>
                    </Box>
                </Box>
            )}

            {/* Custom Header Render */}
            {renderHeader && renderHeader()}

            {/* Table Container */}
            <TableContainer sx={{
                overflowX: 'auto',
                '&::-webkit-scrollbar': {
                    height: '8px',
                },
                '&::-webkit-scrollbar-track': {
                    backgroundColor: alpha(color, 0.05),
                },
                '&::-webkit-scrollbar-thumb': {
                    backgroundColor: alpha(color, 0.2),
                    borderRadius: '4px',
                },
                ...containerSx,
            }}>
                {/* Loading State */}
                {loading && loadingComponent}

                {/* Data Table */}
                {!loading && (
                    <Table
                        size="small"
                        sx={{
                            minWidth: isMobile ? minWidth : 'auto',
                            ...tableSx
                        }}
                    >
                        {/* Table Head */}
                        <TableHead>
                            <TableRow sx={{
                                bgcolor: headerBgColor,
                                '& th': {
                                    borderBottom: `2px solid ${headerBorderColor}`,
                                    py: 1.5,
                                    px: 1.5,
                                    fontSize: isMobile ? '0.75rem' : '0.8rem',
                                    fontWeight: 600,
                                    color: DEFAULT_COLORS.text,
                                    whiteSpace: 'nowrap',
                                }
                            }}>
                                {columns.map((column, index) => (
                                    <TableCell
                                        key={index}
                                        align={column.align || 'left'}
                                        sx={column.headerSx || {}}
                                    >
                                        {column.header}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>

                        {/* Table Body */}
                        <TableBody>
                            {/* Empty State */}
                            {data.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.length}
                                        align="center"
                                    >
                                        <EmptyState
                                            icon={emptyStateIcon}
                                            title={emptyStateTitle}
                                            description={emptyStateDescription}
                                        />
                                    </TableCell>
                                </TableRow>
                            )}

                            {/* Data Rows */}
                            {data.length > 0 && data.map((row, index) => (
                                renderRow
                                    ? renderRow(row, index)
                                    : renderDefaultRow(row, index)
                            ))}
                        </TableBody>
                    </Table>
                )}

                {/* Pagination */}
                {pagination && totalCount > 0 && (
                    <TablePagination
                        rowsPerPageOptions={rowsPerPageOptions}
                        component="div"
                        count={totalCount}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={onPageChange}
                        onRowsPerPageChange={onRowsPerPageChange}
                        sx={{
                            borderTop: `1px solid ${headerBorderColor}`,
                            '& .MuiTablePagination-toolbar': {
                                minHeight: '44px',
                            },
                            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                                fontSize: isMobile ? '0.75rem' : '0.8rem',
                            },
                        }}
                    />
                )}
            </TableContainer>

            {/* Custom Footer Render */}
            {renderFooter && renderFooter()}

            {/* Showing Count (if not using pagination) */}
            {!pagination && data.length > 0 && (
                <Box
                    sx={{
                        p: 1,
                        borderTop: `1px solid ${headerBorderColor}`,
                        bgcolor: alpha(color, 0.02),
                        display: 'flex',
                        justifyContent: 'flex-end',
                    }}
                >
                    <Typography
                        variant="caption"
                        sx={{
                            color: DEFAULT_COLORS.gray,
                            fontSize: '0.75rem',
                        }}
                    >
                        Showing {showingCount} of {totalCount || data.length} items
                    </Typography>
                </Box>
            )}
        </Paper>
    );
};

// Helper HOC for common table configurations
export const withUserTable = (Component) => {
    return (props) => {
        const { color = DEFAULT_COLORS.primary, ...rest } = props;
        return <Component color={color} {...rest} />;
    };
};

// Pre-configured table types
export const UserManagementTable = (props) => (
    <DataTable
        color={DEFAULT_COLORS.primary}
        searchPlaceholder="Search users..."
        emptyStateTitle="No users found."
        emptyStateDescription="Create one to get started."
        {...props}
    />
);

export const TechUserTable = (props) => (
    <DataTable
        color={DEFAULT_COLORS.success}
        searchPlaceholder="Search tech users..."
        emptyStateTitle="No tech users found."
        emptyStateDescription="Create one to get started."
        {...props}
    />
);

export const ReadOnlyUserTable = (props) => (
    <DataTable
        color={DEFAULT_COLORS.success}
        searchPlaceholder="Search users..."
        emptyStateTitle="No users found."
        {...props}
    />
);