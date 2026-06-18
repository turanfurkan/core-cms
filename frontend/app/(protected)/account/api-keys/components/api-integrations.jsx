'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Trash2, Plus, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { formatDateTime } from '@/lib/helpers';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardFooter,
  CardHeader,
  CardTable,
  CardTitle,
  CardToolbar,
} from '@/components/ui/card';
import { DataGrid, useDataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridColumnVisibility } from '@/components/ui/data-grid-column-visibility';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import ApiKeyAddDialog from './api-key-add-dialog';

const ApiIntegrations = () => {
  const queryClient = useQueryClient();
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState([{ id: 'id', desc: true }]);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Fetch API keys from local Next.js proxy route
  const { data: keysData, isLoading } = useQuery({
    queryKey: ['api-keys', pagination, sorting],
    queryFn: async () => {
      const page = pagination.pageIndex + 1;
      const limit = pagination.pageSize;
      const sortField = sorting?.[0]?.id || 'id';
      const sortDir = sorting?.[0]?.desc ? 'desc' : 'asc';

      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sort: sortField,
        dir: sortDir,
      });

      const response = await apiFetch(`/api/user-management/api-keys?${params.toString()}`);
      if (!response.ok) {
        throw new Error('API Anahtarları yüklenirken hata oluştu.');
      }
      return response.json();
    },
    refetchOnWindowFocus: false,
  });

  // Toggle active switch mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active, name, scopes, expires_at }) => {
      const response = await apiFetch(`/api/user-management/api-keys/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active,
          name,
          scopes,
          expires_at,
        }),
      });

      if (!response.ok) {
        throw new Error('Anahtar durumu güncellenemedi.');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('API Anahtarı durumu başarıyla güncellendi.');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Bir hata oluştu.');
    },
  });

  // Delete key mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await apiFetch(`/api/user-management/api-keys/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('API Anahtarı silinemedi.');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('API Anahtarı silindi.');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Silme işlemi başarısız.');
    },
  });

  const columns = useMemo(
    () => [
      {
        id: 'name',
        accessorFn: (row) => row.name,
        header: ({ column }) => (
          <DataGridColumnHeader title="Tanım / İsim" column={column} />
        ),
        cell: (info) => <span className="font-semibold text-gray-800 dark:text-gray-200">{info.getValue()}</span>,
        enableSorting: true,
        size: 200,
      },
      {
        id: 'hint',
        accessorFn: (row) => row.hint,
        header: ({ column }) => (
          <DataGridColumnHeader title="API Anahtarı (Hint)" column={column} />
        ),
        cell: (info) => (
          <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded font-mono text-xs text-danger break-all">
            {info.getValue()}
          </code>
        ),
        enableSorting: false,
        size: 200,
      },
      {
        id: 'scopes',
        accessorFn: (row) => row.scopes,
        header: ({ column }) => (
          <DataGridColumnHeader title="Yetki Alanları (Scopes)" column={column} />
        ),
        cell: (info) => {
          const scopes = info.getValue() || [];
          if (scopes.includes('*')) {
            return <Badge variant="default" className="text-xs bg-success text-white border-none">Tam Yetki (*)</Badge>;
          }
          return (
            <div className="flex flex-wrap gap-1 max-w-xs">
              {scopes.map((scope) => (
                <Badge key={scope} variant="outline" className="text-2xs font-normal">
                  {scope}
                </Badge>
              ))}
            </div>
          );
        },
        enableSorting: false,
        size: 220,
      },
      {
        id: 'expires_at',
        accessorFn: (row) => row.expires_at,
        header: ({ column }) => (
          <DataGridColumnHeader title="Süre Sonu" column={column} />
        ),
        cell: (info) => {
          const dateVal = info.getValue();
          return dateVal ? (
            <span className="text-xs text-gray-700 dark:text-gray-300">{formatDateTime(new Date(dateVal))}</span>
          ) : (
            <Badge variant="secondary" className="text-2xs font-medium bg-gray-200 dark:bg-gray-850">Süresiz</Badge>
          );
        },
        enableSorting: true,
        size: 150,
      },
      {
        id: 'is_active',
        accessorFn: (row) => row.is_active,
        header: ({ column }) => (
          <DataGridColumnHeader title="Durum" column={column} />
        ),
        cell: ({ row }) => {
          const item = row.original;
          return (
            <Switch
              size="sm"
              checked={item.is_active}
              disabled={toggleMutation.isPending}
              onCheckedChange={(checked) => {
                toggleMutation.mutate({
                  id: item.id,
                  is_active: checked,
                  name: item.name,
                  scopes: item.scopes,
                  expires_at: item.expires_at,
                });
              }}
            />
          );
        },
        enableSorting: true,
        size: 100,
      },
      {
        id: 'actions',
        header: () => '',
        cell: ({ row }) => {
          const item = row.original;
          return (
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-danger hover:bg-danger/10"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (confirm('Bu API Anahtarını silmek istediğinizden emin misiniz?')) {
                  deleteMutation.mutate(item.id);
                }
              }}
            >
              <Trash2 size={16} />
            </Button>
          );
        },
        enableSorting: false,
        size: 70,
      },
    ],
    [toggleMutation, deleteMutation]
  );

  const flatData = useMemo(() => keysData?.data || [], [keysData]);

  const table = useReactTable({
    columns,
    data: flatData,
    pageCount: Math.ceil((keysData?.pagination?.total || 0) / pagination.pageSize),
    getRowId: (row) => String(row.id),
    state: {
      pagination,
      sorting,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualSorting: true,
  });

  const Toolbar = () => {
    const { table } = useDataGrid();

    return (
      <CardToolbar>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus size={16} className="mr-1" />
            Yeni Anahtar Üret
          </Button>
          <DataGridColumnVisibility
            table={table}
            trigger={
              <Button variant="outline">
                <Settings2 size={16} />
                Kolonlar
              </Button>
            }
          />
        </div>
      </CardToolbar>
    );
  };

  return (
    <>
      <DataGrid
        table={table}
        recordCount={keysData?.pagination?.total || 0}
        isLoading={isLoading}
        tableLayout={{
          columnsPinnable: true,
          columnsMovable: true,
          columnsVisibility: true,
          cellBorder: true,
        }}
      >
        <Card>
          <CardHeader>
            <CardTitle>API Entegrasyon Anahtarları</CardTitle>
            <Toolbar />
          </CardHeader>
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

      <ApiKeyAddDialog open={isAddOpen} closeDialog={() => setIsAddOpen(false)} />
    </>
  );
};

export { ApiIntegrations };
