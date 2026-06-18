'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Edit, Trash, Plus, Search, X, Globe } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import ContentEntryDialog from './components/content-entry-dialog';

export default function ContentEntriesPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type');
  const [selectedTypeId, setSelectedTypeId] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all content types for dropdown selector
  const { data: contentTypes } = useQuery({
    queryKey: ['admin-content-types'],
    queryFn: async () => {
      const res = await apiFetch('/api/admin/content-types');
      if (!res.ok) throw new Error('Failed to fetch content types');
      const json = await res.json();
      return json.data || [];
    },
  });

  useEffect(() => {
    if (typeParam && contentTypes) {
      const foundType = contentTypes.find(
        (t) => String(t.id) === typeParam || t.slug === typeParam
      );
      if (foundType) {
        setSelectedTypeId(String(foundType.id));
      }
    }
  }, [typeParam, contentTypes]);



  const activeType = useMemo(() => {
    return contentTypes?.find((t) => String(t.id) === selectedTypeId);
  }, [contentTypes, selectedTypeId]);

  // Fetch entries for active content type
  const { data: entries, isLoading } = useQuery({
    queryKey: ['admin-content-entries', selectedTypeId],
    queryFn: async () => {
      if (selectedTypeId === 'all') return [];
      const res = await apiFetch(`/api/admin/content-types/${selectedTypeId}/entries`);
      if (!res.ok) throw new Error('Failed to fetch entries');
      const json = await res.json();
      return json.data || [];
    },
    enabled: selectedTypeId !== 'all',
  });

  // Filter local entries based on search input
  const filteredEntries = useMemo(() => {
    if (!entries) return [];
    if (!searchQuery) return entries;
    const query = searchQuery.toLowerCase();
    return entries.filter((item) => {
      const title = item.data?.title || item.title || '';
      const slug = item.data?.slug || item.slug || '';
      return (
        title.toLowerCase().includes(query) ||
        slug.toLowerCase().includes(query) ||
        String(item.id).includes(query)
      );
    });
  }, [entries, searchQuery]);

  // Delete Entry Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await apiFetch(`/api/admin/content-types/${selectedTypeId}/entries/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete entry');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content-entries', selectedTypeId] });
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>İçerik başarıyla silindi.</AlertTitle>
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
            <AlertTitle>{err.message || 'Silme işlemi başarısız.'}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
    },
  });

  // Publish / Unpublish Entry Mutation
  const publishMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await apiFetch(`/api/admin/content-types/${selectedTypeId}/entries/${id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content-entries', selectedTypeId] });
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>İçerik yayın durumu güncellendi.</AlertTitle>
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
            <AlertTitle>{err.message || 'İşlem başarısız.'}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
    },
  });

  const handleEdit = (entry, e) => {
    e.stopPropagation();
    setSelectedEntry(entry);
    setDialogOpen(true);
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (confirm('Bu içeriği silmek istediğinizden emin misiniz?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleTogglePublish = (entry, e) => {
    e.stopPropagation();
    const newStatus = entry.status === 'published' ? 'draft' : 'published';
    publishMutation.mutate({ id: entry.id, status: newStatus });
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: 'id',
        id: 'id',
        header: ({ column }) => (
          <DataGridColumnHeader title="ID" visibility={true} column={column} />
        ),
        cell: ({ row }) => <span className="text-xs text-muted-foreground font-mono">{row.original.id}</span>,
        size: 60,
      },
      {
        accessorKey: 'title',
        id: 'title',
        header: ({ column }) => (
          <DataGridColumnHeader title="Başlık" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const data = row.original.data || {};
          const title = data.title || row.original.title || 'Untitled';
          const slug = data.slug || row.original.slug || '';
          return (
            <div className="space-y-0.5">
              <div className="font-semibold text-sm">{title}</div>
              {slug && <code className="text-[10px] text-muted-foreground font-mono">/{slug}</code>}
            </div>
          );
        },
        size: 250,
      },
      {
        accessorKey: 'status',
        id: 'status',
        header: ({ column }) => (
          <DataGridColumnHeader title="Durum" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const status = row.original.status;
          const isPublished = status === 'published';
          return (
            <Badge variant={isPublished ? 'success' : 'secondary'} className="text-xs">
              {isPublished ? 'Yayında' : 'Taslak'}
            </Badge>
          );
        },
        size: 100,
      },
      {
        accessorKey: 'published_at',
        id: 'published_at',
        header: ({ column }) => (
          <DataGridColumnHeader title="Yayın Tarihi" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const date = row.original.published_at || row.original.created_at;
          return (
            <span className="text-xs text-muted-foreground">
              {date ? new Date(date).toLocaleString('tr-TR') : '-'}
            </span>
          );
        },
        size: 150,
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
              title="Düzenle"
            >
              <Edit className="size-3.5" />
            </Button>
            <Button
              variant="dim"
              size="sm"
              onClick={(e) => handleTogglePublish(row.original, e)}
              className="h-7 w-7 p-0"
              title={row.original.status === 'published' ? 'Taslağa Çek' : 'Yayınla'}
              disabled={publishMutation.isPending}
            >
              <Globe className="size-3.5" />
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={(e) => handleDelete(row.original.id, e)}
              className="h-7 w-7 p-0"
              disabled={deleteMutation.isPending}
              title="Sil"
            >
              <Trash className="size-3.5" />
            </Button>
          </div>
        ),
        size: 120,
      },
    ],
    [deleteMutation.isPending, publishMutation.isPending]
  );

  const table = useReactTable({
    columns,
    data: filteredEntries,
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
              placeholder="İçerik ara..."
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
              setSelectedEntry(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-4" />
            Yeni İçerik Ekle
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
            <ToolbarTitle>İçerik Yönetimi (Content Entries)</ToolbarTitle>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Content Management</BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Content Entries</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
        </Toolbar>
      </Container>

      <Container className="space-y-4">
        {/* Content Type Selector */}
        <Card className="p-5 flex flex-col md:flex-row items-center gap-4">
          <div className="w-full md:w-64 space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Düzenlenecek İçerik Şablonu</span>
            <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
              <SelectTrigger>
                <SelectValue placeholder="Bir şablon seçin..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Seçiniz...</SelectItem>
                {contentTypes?.map((type) => (
                  <SelectItem key={type.id} value={String(type.id)}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {selectedTypeId !== 'all' && (
          <DataGrid
            table={table}
            recordCount={filteredEntries.length}
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
        )}
      </Container>

      {dialogOpen && activeType && (
        <ContentEntryDialog
          open={dialogOpen}
          closeDialog={() => setDialogOpen(false)}
          contentType={activeType}
          entry={selectedEntry}
        />
      )}
    </>
  );
}
