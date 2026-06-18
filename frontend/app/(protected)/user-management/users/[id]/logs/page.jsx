'use client';

import React, { use, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@/hooks/useTranslation';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronRight, Search, X, Info, Calendar, User, Globe, Laptop, Eye, Terminal } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatDateTime } from '@/lib/helpers';
import { Badge, BadgeDot } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTable } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const getEventBadgeProps = (event) => {
  switch (event?.toLowerCase()) {
    case 'login':
    case 'create':
    case 'store':
    case 'created':
    case 'stored':
      return { variant: 'success', label: event || 'create' };
    case 'logout':
    case 'update':
    case 'updated':
      return { variant: 'warning', label: event || 'update' };
    case 'failed':
    case 'failed-login':
    case 'lockout':
    case 'delete':
    case 'deleted':
    case 'destroy':
    case 'destroyed':
      return { variant: 'destructive', label: event || 'failed' };
    default:
      return { variant: 'info', label: event || 'system' };
  }
};

export default function UserLogsPage({ params }) {
  const { t } = useTranslation();
  const { id } = use(params);

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 15,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLogName, setSelectedLogName] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState('all');
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Fetch logs for specific user
  const fetchLogs = async ({ pageIndex, pageSize, searchQuery, selectedLogName, selectedEvent }) => {
    const queryParams = new URLSearchParams({
      page: String(pageIndex + 1),
      limit: String(pageSize),
      causer_id: id,
      ...(searchQuery ? { search: searchQuery } : {}),
      ...(selectedLogName && selectedLogName !== 'all' ? { log_name: selectedLogName } : {}),
      ...(selectedEvent && selectedEvent !== 'all' ? { event: selectedEvent } : {}),
    });

    const response = await apiFetch(`/api/user-management/logs?${queryParams.toString()}`);
    if (!response.ok) {
      throw new Error(t('messages.system_error', 'Error fetching activity logs.'));
    }
    return response.json();
  };

  const { data, isLoading } = useQuery({
    queryKey: ['user-specific-activity-logs', id, pagination, searchQuery, selectedLogName, selectedEvent],
    queryFn: () =>
      fetchLogs({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        searchQuery,
        selectedLogName,
        selectedEvent,
      }),
    staleTime: 5000,
    refetchOnWindowFocus: false,
  });

  const handleRowClick = (row) => {
    setSelectedLog(row);
    setDetailOpen(true);
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: 'log_name',
        id: 'log_name',
        header: ({ column }) => (
          <DataGridColumnHeader title={t('logs.columns.type', 'Log Type')} visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <Badge variant="outline" className="font-mono text-[10px] capitalize">
            {row.original.log_name || 'default'}
          </Badge>
        ),
        size: 140,
        meta: {
          headerTitle: t('logs.columns.type', 'Log Type'),
          skeleton: <Skeleton className="w-20 h-6" />,
        },
        enableSorting: false,
      },
      {
        accessorKey: 'event',
        id: 'event',
        header: ({ column }) => (
          <DataGridColumnHeader title={t('logs.columns.event', 'Action / Event')} visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const props = getEventBadgeProps(row.original.event);
          return (
            <Badge variant={props.variant} appearance="light" className="capitalize">
              <BadgeDot />
              {props.label}
            </Badge>
          );
        },
        size: 130,
        meta: {
          headerTitle: t('logs.columns.event', 'Event'),
          skeleton: <Skeleton className="w-16 h-6" />,
        },
        enableSorting: false,
      },
      {
        accessorKey: 'description',
        id: 'description',
        header: ({ column }) => (
          <DataGridColumnHeader title={t('logs.columns.description', 'Description')} visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-sm font-medium text-muted-foreground line-clamp-1">
            {row.original.description}
          </span>
        ),
        size: 350,
        meta: {
          headerTitle: t('logs.columns.description', 'Description'),
          skeleton: <Skeleton className="w-60 h-4" />,
        },
        enableSorting: false,
      },
      {
        accessorKey: 'created_at',
        id: 'created_at',
        header: ({ column }) => (
          <DataGridColumnHeader title={t('logs.columns.timestamp', 'Timestamp')} visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {row.original.created_at ? formatDateTime(new Date(row.original.created_at)) : '-'}
          </span>
        ),
        size: 160,
        meta: {
          headerTitle: t('logs.columns.timestamp', 'Timestamp'),
          skeleton: <Skeleton className="w-24 h-4" />,
        },
        enableSorting: false,
      },
      {
        accessorKey: 'actions',
        header: '',
        cell: () => (
          <ChevronRight className="text-muted-foreground/70 size-3.5" />
        ),
        meta: {
          skeleton: <Skeleton className="size-4" />,
        },
        size: 40,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
      },
    ],
    [t]
  );

  const [columnOrder, setColumnOrder] = useState(columns.map((column) => column.id));

  const table = useReactTable({
    columns,
    data: data?.data || [],
    pageCount: Math.ceil((data?.pagination?.total || 0) / pagination.pageSize),
    getRowId: (row) => row.id,
    state: {
      pagination,
      columnOrder,
    },
    columnResizeMode: 'onChange',
    onColumnOrderChange: setColumnOrder,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
  });

  const renderAuditChanges = (properties) => {
    const attributes = properties?.attributes || {};
    const old = properties?.old || {};
    const keys = Object.keys({ ...attributes, ...old }).filter((k) => k !== 'updated_at');

    if (keys.length === 0) return null;

    return (
      <div className="space-y-2.5">
        <h4 className="font-semibold text-xs text-foreground flex items-center gap-1.5 border-b pb-1">
          <Terminal className="size-3.5 text-primary" /> {t('logs.detail.audit', 'Audit Logs (Change Diff)')}
        </h4>
        <div className="border border-border rounded-lg overflow-hidden text-xs">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground text-left font-semibold border-b">
                <th className="p-2 border-r border-border w-1/4">Field</th>
                <th className="p-2 border-r border-border w-3/8">Previous Value</th>
                <th className="p-2 w-3/8">New Value</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => (
                <tr key={key} className="border-b last:border-b-0 hover:bg-muted/30">
                  <td className="p-2 border-r border-border font-mono font-medium text-foreground">{key}</td>
                  <td className="p-2 border-r border-border text-muted-foreground break-all font-mono">
                    {old[key] !== undefined ? JSON.stringify(old[key]) : '-'}
                  </td>
                  <td className="p-2 text-foreground break-all font-mono">
                    {attributes[key] !== undefined ? JSON.stringify(attributes[key]) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderExtraMeta = (properties) => {
    const excluded = ['attributes', 'old', 'ip', 'ip_address', 'user_agent', 'userAgent'];
    const extraKeys = Object.keys(properties || {}).filter((k) => !excluded.includes(k));

    if (extraKeys.length === 0) return null;

    const extraData = extraKeys.reduce((acc, k) => ({ ...acc, [k]: properties[k] }), {});

    return (
      <div className="space-y-2.5">
        <h4 className="font-semibold text-xs text-foreground flex items-center gap-1.5 border-b pb-1">
          <Info className="size-3.5 text-primary" /> {t('logs.detail.extra', 'Additional Information')}
        </h4>
        <div className="bg-muted/50 border border-border p-3 rounded-lg overflow-x-auto">
          <pre className="text-[10px] font-mono text-muted-foreground whitespace-pre-wrap break-all leading-normal">
            {JSON.stringify(extraData, null, 2)}
          </pre>
        </div>
      </div>
    );
  };

  const DataGridToolbar = () => {
    const [inputValue, setInputValue] = useState(searchQuery);

    const handleSearch = () => {
      setSearchQuery(inputValue);
      setPagination({ ...pagination, pageIndex: 0 });
    };

    return (
      <CardHeader className="flex-col flex-wrap sm:flex-row items-stretch sm:items-center py-5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 w-full">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder={t('logs.search_placeholder', 'Search description...')}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                disabled={isLoading}
                className="ps-9 w-full sm:w-60 md:w-80"
              />
              {searchQuery.length > 0 && (
                <Button
                  mode="icon"
                  variant="dim"
                  className="absolute end-1.5 top-1/2 -translate-y-1/2 h-6 w-6"
                  onClick={() => {
                    setInputValue('');
                    setSearchQuery('');
                    setPagination({ ...pagination, pageIndex: 0 });
                  }}
                >
                  <X />
                </Button>
              )}
            </div>
            <Select
              onValueChange={(val) => {
                setSelectedLogName(val);
                setPagination({ ...pagination, pageIndex: 0 });
              }}
              value={selectedLogName}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder={t('logs.filter.type', 'Log Type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('logs.types.all', 'All Log Types')}</SelectItem>
                <SelectItem value="user.auth">{t('logs.types.auth', 'Authentication')}</SelectItem>
                <SelectItem value="user.profile">{t('logs.types.profile', 'User Profile')}</SelectItem>
                <SelectItem value="content">{t('logs.types.content', 'Content Logs')}</SelectItem>
                <SelectItem value="media">{t('logs.types.media', 'Media Logs')}</SelectItem>
              </SelectContent>
            </Select>
            <Select
              onValueChange={(val) => {
                setSelectedEvent(val);
                setPagination({ ...pagination, pageIndex: 0 });
              }}
              value={selectedEvent}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder={t('logs.filter.event', 'Event Action')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('logs.events.all', 'All Events')}</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
                <SelectItem value="failed">Failed Login</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
    );
  };

  const selectedLogPropsBadge = selectedLog ? getEventBadgeProps(selectedLog.event) : null;
  const ipAddress = selectedLog?.properties?.ip || selectedLog?.properties?.ip_address || 'N/A';
  const userAgent = selectedLog?.properties?.user_agent || selectedLog?.properties?.userAgent || 'N/A';

  return (
    <>
      <DataGrid
        table={table}
        recordCount={data?.pagination?.total || 0}
        isLoading={isLoading}
        onRowClick={handleRowClick}
        tableLayout={{
          columnsResizable: true,
          columnsPinnable: true,
          columnsMovable: true,
          columnsVisibility: true,
        }}
        tableClassNames={{
          edgeCell: 'px-5',
        }}
      >
        <Card>
          <DataGridToolbar />
          <CardTable>
            <ScrollArea>
              <DataGridTable />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardTable>
          <CardFooter>
            <DataGridPagination />
          </CardFooter>
        </Card>
      </DataGrid>

      {/* Log Detail Modal */}
      <Dialog open={detailOpen} onOpenChange={() => setDetailOpen(false)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <DialogTitle className="flex items-center gap-2">
                <Eye className="size-5 text-primary" /> {t('logs.detail.title', 'Log Entry Details')}
              </DialogTitle>
              {selectedLogPropsBadge && (
                <Badge variant={selectedLogPropsBadge.variant} appearance="light" className="capitalize">
                  <BadgeDot />
                  {selectedLogPropsBadge.label}
                </Badge>
              )}
            </div>
          </DialogHeader>

          <DialogBody className="space-y-5 py-4 max-h-[70vh] overflow-y-auto">
            {/* General Log Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 border border-border p-4 rounded-xl">
              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <User className="size-4 text-muted-foreground mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">{t('logs.detail.causer', 'Causer (User)')}</span>
                    <span className="text-sm font-semibold text-foreground">
                      {selectedLog?.causer?.name || 'System / Automated'}
                    </span>
                    {selectedLog?.causer?.email && (
                      <span className="text-xs text-muted-foreground block">{selectedLog.causer.email}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Calendar className="size-4 text-muted-foreground mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">{t('logs.detail.timestamp', 'Timestamp')}</span>
                    <span className="text-xs font-semibold text-foreground">
                      {selectedLog?.created_at ? formatDateTime(new Date(selectedLog.created_at)) : '-'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <Globe className="size-4 text-muted-foreground mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">{t('logs.detail.ip', 'IP Address')}</span>
                    <span className="text-xs font-semibold font-mono text-foreground">{ipAddress}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Laptop className="size-4 text-muted-foreground mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">{t('logs.detail.device', 'Device / User Agent')}</span>
                    <span className="text-xs text-muted-foreground break-all line-clamp-2" title={userAgent}>
                      {userAgent}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">{t('logs.detail.description', 'Action Description')}</span>
              <div className="bg-primary/5 border border-primary/20 text-primary-foreground text-sm font-medium px-4 py-3 rounded-xl dark:bg-primary/10">
                <span className="text-foreground">{selectedLog?.description}</span>
              </div>
            </div>

            {/* Audit Log / Changed Diff */}
            {selectedLog && renderAuditChanges(selectedLog.properties)}

            {/* Additional Info / Custom Meta fields */}
            {selectedLog && renderExtraMeta(selectedLog.properties)}
          </DialogBody>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>
              <X /> {t('logs.detail.close', 'Close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
