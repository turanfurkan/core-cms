'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Ellipsis,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  X,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatDate } from '@/lib/helpers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTable } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import NavigationAddDialog from './navigation-add-dialog';
import NavigationDeleteDialog from './navigation-delete-dialog';

const NavigationList = () => {
  const router = useRouter();

  // List state
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteNav, setDeleteNav] = useState(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch from proxy
  const fetchNavigations = async ({ pageIndex, pageSize, searchQuery }) => {
    const params = new URLSearchParams({
      page: String(pageIndex + 1),
      limit: String(pageSize),
      ...(searchQuery ? { query: searchQuery } : {}),
    });

    const response = await apiFetch(`/api/user-management/navigations?${params.toString()}`);

    if (!response.ok) {
      throw new Error(
        'Oops! Something didn’t go as planned. Please try again in a moment.'
      );
    }

    return response.json();
  };

  const { data, isLoading } = useQuery({
    queryKey: ['user-navigations', pagination, searchQuery],
    queryFn: () =>
      fetchNavigations({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        searchQuery,
      }),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  // Table Columns
  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        id: 'name',
        header: ({ column }) => (
          <DataGridColumnHeader title="Menu Name" column={column} visibility />
        ),
        cell: ({ row, getValue }) => {
          const value = getValue();
          return <div className="font-semibold text-gray-900 dark:text-gray-100">{value}</div>;
        },
        size: 250,
        enableSorting: false,
        enableHiding: false,
        meta: {
          headerTitle: 'Menu Name',
          skeleton: <Skeleton className="w-40 h-7" />,
        },
      },
      {
        accessorKey: 'key',
        id: 'key',
        header: ({ column }) => (
          <DataGridColumnHeader title="Menu Key" column={column} visibility />
        ),
        cell: ({ getValue }) => {
          const value = getValue();
          return <Badge variant="outline">{value}</Badge>;
        },
        size: 200,
        enableSorting: false,
        enableHiding: false,
        meta: {
          headerTitle: 'Menu Key',
          skeleton: <Skeleton className="w-24 h-7" />,
        },
      },
      {
        accessorKey: 'is_active',
        id: 'is_active',
        header: ({ column }) => (
          <DataGridColumnHeader title="Status" column={column} visibility />
        ),
        cell: ({ getValue }) => {
          const isActive = getValue();
          return isActive ? (
            <Badge variant="outline" className="text-success border-success/30 bg-success/5 gap-1">
              <CheckCircle2 className="size-3" />
              Active
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground gap-1">
              <XCircle className="size-3" />
              Inactive
            </Badge>
          );
        },
        size: 150,
        enableSorting: false,
        enableHiding: false,
        meta: {
          headerTitle: 'Status',
          skeleton: <Skeleton className="w-16 h-7" />,
        },
      },
      {
        accessorKey: 'created_at',
        id: 'created_at',
        header: ({ column }) => (
          <DataGridColumnHeader title="Created At" column={column} visibility />
        ),
        cell: ({ getValue }) => {
          const value = getValue();
          return <span className="text-muted-foreground text-sm">{formatDate(value)}</span>;
        },
        size: 200,
        enableSorting: false,
        enableHiding: true,
        meta: {
          headerTitle: 'Created At',
          skeleton: <Skeleton className="w-28 h-7" />,
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="h-7 w-7" mode="icon" variant="ghost">
                <Ellipsis className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="start">
              <DropdownMenuItem
                onClick={() => {
                  router.push(`/user-management/navigations/${row.original.id}`);
                }}
              >
                Edit Menu Builder
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => {
                  setDeleteNav(row.original);
                  setDeleteDialogOpen(true);
                }}
              >
                Delete Menu
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        size: 80,
        enableSorting: false,
        enableResizing: false,
        meta: {
          skeleton: <Skeleton className="size-5" />,
        },
      },
    ],
    [router]
  );

  const table = useReactTable({
    columns,
    data: data?.data || [],
    pageCount: Math.ceil((data?.pagination?.total || 0) / pagination.pageSize),
    getRowId: (row) => row.id,
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
  });

  const DataGridToolbar = () => {
    const [inputValue, setInputValue] = useState(searchQuery);

    const handleSearch = () => {
      setSearchQuery(inputValue);
      setPagination({ ...pagination, pageIndex: 0 });
    };

    return (
      <CardHeader className="py-5">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search menus..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              disabled={isLoading}
              className="ps-9 w-full md:w-64"
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
                <X className="size-3" />
              </Button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            disabled={isLoading}
            onClick={() => setAddDialogOpen(true)}
          >
            <Plus className="size-4" />
            Add Navigation
          </Button>
        </div>
      </CardHeader>
    );
  };

  return (
    <>
      <DataGrid
        table={table}
        recordCount={data?.pagination?.total || 0}
        isLoading={isLoading}
        tableLayout={{
          columnsResizable: true,
          columnsPinnable: true,
          columnsMovable: true,
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

      <NavigationAddDialog
        open={addDialogOpen}
        closeDialog={() => setAddDialogOpen(false)}
      />

      {deleteNav && (
        <NavigationDeleteDialog
          open={deleteDialogOpen}
          closeDialog={() => setDeleteDialogOpen(false)}
          navigation={deleteNav}
        />
      )}
    </>
  );
};

export default NavigationList;
