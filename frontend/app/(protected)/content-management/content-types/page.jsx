'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Edit, Trash, Plus, Search, X } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { apiFetch } from '@/lib/api';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarTitle,
} from '@/components/common/toolbar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Card, CardHeader, CardTable } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import ContentTypeDialog from './components/content-type-dialog';

export default function ContentTypesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all content types
  const { data, isLoading } = useQuery({
    queryKey: ['admin-content-types'],
    queryFn: async () => {
      const res = await apiFetch('/api/admin/content-types');
      if (!res.ok) throw new Error('Failed to fetch content types');
      const json = await res.json();
      return json.data || [];
    },
  });

  // Filter local data based on search query
  const filteredData = useMemo(() => {
    if (!data) return [];
    if (!searchQuery) return data;
    const query = searchQuery.toLowerCase();
    return data.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.slug.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query))
    );
  }, [data, searchQuery]);

  // Delete Content Type Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await apiFetch(`/api/admin/content-types/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete content type');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content-types'] });
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>{t('content_types.messages.success_delete', 'Content type deleted successfully.')}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
    },
    onError: (err) => {
      toast.custom(
        () => (
          <Alert variant="mono" icon="destructive" close={false}>
            <AlertIcon>
              <RiErrorWarningFill />
            </AlertIcon>
            <AlertTitle>{err.message || t('content_types.messages.error', 'An error occurred.')}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
    },
  });

  const handleEdit = (type, e) => {
    e.stopPropagation();
    setSelectedType(type);
    setDialogOpen(true);
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (
      confirm(
        t('content_types.delete_confirm', 'Are you sure you want to delete this content type? This action will delete all related content!')
      )
    ) {
      deleteMutation.mutate(id);
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        id: 'name',
        header: ({ column }) => (
          <DataGridColumnHeader title={t('content_types.columns.name', 'Template Name')} visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <div className="font-semibold text-sm">{row.original.name}</div>
        ),
        size: 200,
      },
      {
        accessorKey: 'slug',
        id: 'slug',
        header: ({ column }) => (
          <DataGridColumnHeader title={t('content_types.columns.slug', 'Slug')} visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-mono">
            /{row.original.slug}
          </code>
        ),
        size: 150,
      },
      {
        accessorKey: 'description',
        id: 'description',
        header: ({ column }) => (
          <DataGridColumnHeader title={t('content_types.columns.description', 'Description')} visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground truncate block max-w-md">
            {row.original.description || '-'}
          </span>
        ),
        size: 300,
      },
      {
        accessorKey: 'fields',
        id: 'fields',
        header: ({ column }) => (
          <DataGridColumnHeader title={t('content_types.columns.fields', 'Fields')} visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const fields = row.original.fields || [];
          return (
            <div className="flex flex-wrap gap-1">
              {fields.map((field) => (
                <Badge key={field.id} variant="secondary" className="text-xs">
                  {field.name} ({field.type})
                </Badge>
              ))}
              {fields.length === 0 && (
                <span className="text-xs text-muted-foreground">{t('content_types.no_fields_defined', 'No fields defined')}</span>
              )}
            </div>
          );
        },
        size: 250,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              variant="dim"
              size="sm"
              onClick={(e) => handleEdit(row.original, e)}
              className="h-7 w-7 p-0"
            >
              <Edit className="size-3.5" />
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={(e) => handleDelete(row.original.id, e)}
              className="h-7 w-7 p-0"
              disabled={deleteMutation.isPending}
            >
              <Trash className="size-3.5" />
            </Button>
          </div>
        ),
        size: 80,
      },
    ],
    [deleteMutation.isPending, t]
  );

  const table = useReactTable({
    columns,
    data: filteredData,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const DataGridToolbar = () => {
    const [inputValue, setInputValue] = useState(searchQuery);

    const handleSearch = () => {
      setSearchQuery(inputValue);
    };

    return (
      <CardHeader className="flex-col flex-wrap sm:flex-row items-stretch sm:items-center py-5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="relative">
            <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder={t('content_types.search_placeholder', 'Search templates...')}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              disabled={isLoading}
              className="ps-9 w-full sm:w-40 md:w-64"
            />
            {searchQuery.length > 0 && (
              <Button
                mode="icon"
                variant="dim"
                className="absolute end-1.5 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => {
                  setInputValue('');
                  setSearchQuery('');
                }}
              >
                <X />
              </Button>
            )}
          </div>
        </div>
        <div className="flex items-center justify-end">
          <Button
            disabled={isLoading}
            onClick={() => {
              setSelectedType(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-4" />
            {t('content_types.add_new', 'Add New Template')}
          </Button>
        </div>
      </CardHeader>
    );
  };

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{t('content_types.title', 'Content Types')}</ToolbarTitle>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">{t('sidebar.home', 'Home')}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{t('sidebar.content_management', 'Content Management')}</BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{t('content_types.title', 'Content Types')}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
        </Toolbar>
      </Container>

      <Container>
        <DataGrid
          table={table}
          recordCount={filteredData.length}
          isLoading={isLoading}
          tableClassNames={{ edgeCell: 'px-5' }}
        >
          <Card>
            <DataGridToolbar />
            <CardTable>
              <ScrollArea>
                <DataGridTable />
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </CardTable>
          </Card>
        </DataGrid>
      </Container>

      {dialogOpen && (
        <ContentTypeDialog
          open={dialogOpen}
          closeDialog={() => setDialogOpen(false)}
          contentType={selectedType}
        />
      )}
    </>
  );
}
