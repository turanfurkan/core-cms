'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Edit, 
  Trash, 
  Plus, 
  Search, 
  X, 
  Layers, 
  Database, 
  FileText, 
  Copy, 
  Calendar, 
  ExternalLink,
  ChevronDown,
  LayoutGrid
} from 'lucide-react';
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
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import ContentTypeDialog from './components/content-type-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function ContentTypesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // all, collections, singles
  const [sortBy, setSortBy] = useState('last_updated'); // last_updated, created_at, alphabetical

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

  // Calculate statistics
  const stats = useMemo(() => {
    if (!data) return { total: 0, collections: 0, singles: 0, totalEntries: 0 };
    return {
      total: data.length,
      collections: data.filter((t) => t.is_collection).length,
      singles: data.filter((t) => !t.is_collection).length,
      totalEntries: data.reduce((sum, t) => sum + (t.entries_count || 0), 0),
    };
  }, [data]);

  // Filter & Sort local data
  const filteredAndSortedData = useMemo(() => {
    if (!data) return [];
    
    // 1. Filter by Search Query
    let result = data;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.slug.toLowerCase().includes(query) ||
          (item.description && item.description.toLowerCase().includes(query))
      );
    }

    // 2. Filter by Type Tab
    if (activeTab === 'collections') {
      result = result.filter((item) => item.is_collection);
    } else if (activeTab === 'singles') {
      result = result.filter((item) => !item.is_collection);
    }

    // 3. Sort Data
    return [...result].sort((a, b) => {
      if (sortBy === 'alphabetical') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'created_at') {
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      } else {
        // last_updated (default)
        return new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0);
      }
    });
  }, [data, searchQuery, activeTab, sortBy]);

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
    if (e) e.stopPropagation();
    setSelectedType(type);
    setDialogOpen(true);
  };

  const handleDuplicate = (type, e) => {
    if (e) e.stopPropagation();
    
    // De-associate ID and prefix the name for a clean client-side duplication
    const duplicate = {
      ...type,
      id: undefined,
      name: `${type.name} Copy`,
      slug: `${type.slug}_copy`,
    };
    setSelectedType(duplicate);
    setDialogOpen(true);
  };

  const handleDelete = (id, e) => {
    if (e) e.stopPropagation();
    setIdToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (idToDelete) {
      deleteMutation.mutate(idToDelete);
      setDeleteConfirmOpen(false);
      setIdToDelete(null);
    }
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

      {/* Stats Cards Section */}
      <Container className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card className="p-5 flex items-center justify-between border border-border bg-card/60 backdrop-blur-md">
            <div className="space-y-1">
              <span className="text-2xl font-bold tracking-tight block">
                {isLoading ? '...' : stats.total}
              </span>
              <span className="text-xs font-semibold text-muted-foreground block uppercase tracking-wider">
                {t('content_types.stats.total_types', 'Total Content Types')}
              </span>
            </div>
            <div className="p-3 bg-primary/10 rounded-xl text-primary shrink-0">
              <Layers className="size-6" />
            </div>
          </Card>

          <Card className="p-5 flex items-center justify-between border border-border bg-card/60 backdrop-blur-md">
            <div className="space-y-1">
              <span className="text-2xl font-bold tracking-tight block">
                {isLoading ? '...' : stats.collections}
              </span>
              <span className="text-xs font-semibold text-muted-foreground block uppercase tracking-wider">
                {t('content_types.stats.collections', 'Collection Types')}
              </span>
            </div>
            <div className="p-3 bg-success/10 rounded-xl text-success shrink-0">
              <Database className="size-6" />
            </div>
          </Card>

          <Card className="p-5 flex items-center justify-between border border-border bg-card/60 backdrop-blur-md">
            <div className="space-y-1">
              <span className="text-2xl font-bold tracking-tight block">
                {isLoading ? '...' : stats.singles}
              </span>
              <span className="text-xs font-semibold text-muted-foreground block uppercase tracking-wider">
                {t('content_types.stats.singles', 'Single Types')}
              </span>
            </div>
            <div className="p-3 bg-info/10 rounded-xl text-info shrink-0">
              <FileText className="size-6" />
            </div>
          </Card>

          <Card className="p-5 flex items-center justify-between border border-border bg-card/60 backdrop-blur-md">
            <div className="space-y-1">
              <span className="text-2xl font-bold tracking-tight block">
                {isLoading ? '...' : stats.totalEntries}
              </span>
              <span className="text-xs font-semibold text-muted-foreground block uppercase tracking-wider">
                {t('content_types.stats.entries', 'Total Entries')}
              </span>
            </div>
            <div className="p-3 bg-warning/10 rounded-xl text-warning shrink-0">
              <Calendar className="size-6" />
            </div>
          </Card>
        </div>
      </Container>

      {/* Filter and Search Bar Section */}
      <Container className="mb-6">
        <Card className="p-4 border border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Tabs Filter */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList variant="default" size="sm" className="w-fit self-start md:self-auto rounded-xl">
              <TabsTrigger value="all">{t('content_types.filters.all', 'Tümü')}</TabsTrigger>
              <TabsTrigger value="collections">{t('content_types.filters.collections', 'Koleksiyonlar')}</TabsTrigger>
              <TabsTrigger value="singles">{t('content_types.filters.singles', 'Tekil Tipler')}</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Search, Sort and Add buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative">
              <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder={t('content_types.search_placeholder', 'Search templates...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isLoading}
                className="ps-9 w-full sm:w-48 md:w-64 h-9"
              />
              {searchQuery.length > 0 && (
                <Button
                  mode="icon"
                  variant="dim"
                  className="absolute end-1.5 top-1/2 -translate-y-1/2 h-6 w-6"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="size-3" />
                </Button>
              )}
            </div>

            {/* Sorting Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="dim" size="sm" className="h-9 border border-border px-3 gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Sırala:
                  </span>
                  <span className="text-xs font-bold">
                    {sortBy === 'last_updated'
                      ? 'Son Güncellenen'
                      : sortBy === 'created_at'
                      ? 'Oluşturulma Tarihi'
                      : 'Alfabetik'}
                  </span>
                  <ChevronDown className="size-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setSortBy('last_updated')}>
                  Son Güncellenen
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('created_at')}>
                  Oluşturulma Tarihi
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('alphabetical')}>
                  Alfabetik
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Add New Template Button */}
            <Button
              disabled={isLoading}
              onClick={() => {
                setSelectedType(null);
                setDialogOpen(true);
              }}
              size="sm"
              className="h-9 gap-1.5"
            >
              <Plus className="size-4" />
              {t('content_types.add_new', 'Add New Template')}
            </Button>
          </div>
        </Card>
      </Container>

      {/* Cards Grid Section */}
      <Container className="pb-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <Card key={n} className="p-6 border border-border animate-pulse space-y-4">
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-xl bg-muted" />
                  <div className="space-y-1.5 grow">
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="h-3 bg-muted rounded w-1/3" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-5/6" />
                </div>
                <div className="h-8 bg-muted rounded w-full pt-4" />
              </Card>
            ))}
          </div>
        ) : filteredAndSortedData.length === 0 ? (
          <Card className="p-12 text-center border border-dashed border-border bg-card/20 flex flex-col items-center justify-center">
            <LayoutGrid className="size-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-base font-bold mb-1">Şablon Bulunamadı</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-5">
              Arama kriterlerinize uygun veya oluşturulmuş içerik şablonu bulunmamaktadır.
            </p>
            <Button
              onClick={() => {
                setSelectedType(null);
                setDialogOpen(true);
              }}
              size="sm"
            >
              <Plus className="size-4 mr-1.5" />
              Yeni Şablon Oluştur
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedData.map((item) => {
              const iconName = item.settings?.icon || 'Database';
              const iconColor = item.settings?.color || '#3b82f6';
              const fieldsCount = item.fields?.length || 0;
              const entriesCount = item.entries_count || 0;
              const formattedDate = item.updated_at
                ? new Date(item.updated_at).toLocaleDateString()
                : '-';

              return (
                <Card 
                  key={item.id} 
                  className="group hover:shadow-lg transition-all duration-300 border border-border bg-card flex flex-col justify-between overflow-hidden relative"
                >
                  <div className="p-6 space-y-4">
                    {/* Card Header with Icon and Badges */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="size-11 rounded-xl flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: iconColor }}
                        >
                          <Database className="size-5.5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                            {item.name}
                          </h3>
                          <code className="text-[10px] text-muted-foreground font-mono">
                            /{item.slug}
                          </code>
                        </div>
                      </div>
                      <Badge variant={item.is_collection ? 'success' : 'secondary'} className="text-[10px] font-bold px-2 py-0.5">
                        {item.is_collection ? 'Collection' : 'Single'}
                      </Badge>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-muted-foreground line-clamp-2 h-8">
                      {item.description || t('content_types.no_description', 'Açıklama belirtilmemiş.')}
                    </p>

                    {/* Metrics Row */}
                    <div className="grid grid-cols-2 gap-4 bg-muted/30 p-2.5 rounded-lg text-center border border-border/40">
                      <div>
                        <span className="text-[10px] font-semibold text-muted-foreground block uppercase">Alan Sayısı</span>
                        <span className="text-sm font-bold text-foreground">{fieldsCount}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-muted-foreground block uppercase">İçerik Adedi</span>
                        <span className="text-sm font-bold text-foreground">{entriesCount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="border-t border-border bg-muted/10 px-6 py-3.5 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3.5" />
                      {formattedDate}
                    </span>

                    <div className="flex items-center gap-1">
                      {/* Manage Content Button */}
                      <Button
                        variant="dim"
                        size="xs"
                        asChild
                        className="h-7 px-2.5 rounded-lg"
                        title="İçeriği Yönet"
                      >
                        <a href={`/content-management/content-entries?type=${item.slug}`} className="flex items-center gap-1 font-bold text-primary">
                          <ExternalLink className="size-3" />
                          Yönet
                        </a>
                      </Button>

                      {/* Dropdown Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="dim" size="xs" className="h-7 w-7 p-0 rounded-lg">
                            <ChevronDown className="size-3.5 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem onClick={(e) => handleEdit(item, e)} className="gap-2">
                            <Edit className="size-3.5" /> Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => handleDuplicate(item, e)} className="gap-2">
                            <Copy className="size-3.5" /> Kopyala
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => handleDelete(item.id, e)} className="gap-2 text-danger">
                            <Trash className="size-3.5" /> Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Container>

      {dialogOpen && (
        <ContentTypeDialog
          open={dialogOpen}
          closeDialog={() => setDialogOpen(false)}
          contentType={selectedType}
        />
      )}

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>İçerik Şablonunu Sil</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'content_types.delete_confirm',
                'Bu içerik şablonunu silmek istediğinizden emin misiniz? Bu işlem bu şablona ait tüm içerik verilerini kalıcı olarak silecektir!'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button type="button" variant="outline" className="gap-1.5 h-9 rounded-lg">
                <X className="size-4" />
                Vazgeç
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild onClick={confirmDelete}>
              <Button type="button" variant="destructive" className="gap-1.5 h-9 rounded-lg">
                <Trash className="size-4" />
                Kalıcı Olarak Sil
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
