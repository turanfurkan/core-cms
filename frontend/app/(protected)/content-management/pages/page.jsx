'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Edit,
  Trash,
  Plus,
  Search,
  LoaderCircleIcon,
  Globe,
  ListFilter,
  Calendar,
  Clock,
  MoreVertical,
  X,
  FileText,
  Layers,
  ArrowUpRight,
  Eye,
  Shield,
  Layout,
  Lock,
  Home
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Container } from '@/components/common/container';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
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

export default function PagesPage() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState(null);

  // Filters & Sorting
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [selectedLayoutFilter, setSelectedLayoutFilter] = useState('all');
  const [sortBy, setSortBy] = useState('order'); // order, created_at, alphabetical, layout

  // Fetch pages list
  const { data: pagesList, isLoading } = useQuery({
    queryKey: ['admin-pages', selectedStatusFilter, selectedLayoutFilter],
    queryFn: async () => {
      let url = '/api/admin/pages?';
      if (selectedStatusFilter !== 'all') {
        url += `status=${selectedStatusFilter}&`;
      }
      if (selectedLayoutFilter !== 'all') {
        url += `layout=${selectedLayoutFilter}&`;
      }
      const res = await apiFetch(url);
      if (!res.ok) throw new Error('Failed to fetch pages');
      const json = await res.json();
      return json.data || [];
    },
  });

  // Calculate statistics
  const stats = useMemo(() => {
    if (!pagesList) return { total: 0, published: 0, draft: 0, system: 0 };
    return {
      total: pagesList.length,
      published: pagesList.filter((r) => r.status === 'published').length,
      draft: pagesList.filter((r) => r.status === 'draft').length,
      system: pagesList.filter((r) => r.data?.is_system).length,
    };
  }, [pagesList]);

  // Filter & Sort local data
  const filteredAndSortedData = useMemo(() => {
    if (!pagesList) return [];

    let result = pagesList;

    // 1. Filter by Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.data?.title?.tr?.toLowerCase().includes(q) ||
          r.data?.title?.en?.toLowerCase().includes(q) ||
          r.data?.slug?.tr?.toLowerCase().includes(q) ||
          r.data?.slug?.en?.toLowerCase().includes(q) ||
          r.data?.summary?.tr?.toLowerCase().includes(q)
      );
    }

    // 2. Sort Data
    return [...result].sort((a, b) => {
      if (sortBy === 'order') {
        return (a.data?.order || 0) - (b.data?.order || 0);
      } else if (sortBy === 'created_at') {
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      } else if (sortBy === 'alphabetical') {
        const nameA = a.data?.title?.tr || '';
        const nameB = b.data?.title?.tr || '';
        return nameA.localeCompare(nameB, 'tr');
      } else {
        // layout sorting
        const layoutA = a.data?.layout || '';
        const layoutB = b.data?.layout || '';
        return layoutA.localeCompare(layoutB);
      }
    });
  }, [pagesList, searchQuery, sortBy]);

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await apiFetch(`/api/admin/pages/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete page');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pages'] });
      setDeleteConfirmOpen(false);
      setIdToDelete(null);
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>Sayfa başarıyla silindi.</AlertTitle>
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
            <AlertTitle>{err.message || 'Sayfa silinemedi.'}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
    },
  });

  const handleDeleteClick = (page) => {
    if (page.data?.is_system) {
      toast.custom(
        () => (
          <Alert variant="mono" icon="destructive" close={false}>
            <AlertIcon>
              <RiErrorWarningFill />
            </AlertIcon>
            <AlertTitle>Sistem sayfaları silinemez.</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
      return;
    }
    setIdToDelete(page.id);
    setDeleteConfirmOpen(true);
  };

  const handleEditClick = (page) => {
    router.push(`/content-management/pages/${page.id}/builder`);
  };

  return (
    <Container className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Ana Sayfa</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/content-management/pages">İçerik Yönetimi</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Sayfalar</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dinamik Sayfalar</h1>
          <p className="text-xs md:text-sm text-muted-foreground/80 mt-1">
            Tüm dinamik sayfaları buradan yönetebilir, filtreleyebilir, sıralayabilir ve düzenleyebilirsiniz.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => router.push('/content-management/pages/new/builder')}
            className="gap-1.5 h-9 rounded-lg shadow-xs font-semibold text-xs transition-all duration-150"
          >
            <Plus className="size-4" /> Yeni Sayfa Ekle
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Toplam Sayfa */}
        <Card className="p-3 border border-border/80 bg-card shadow-xs flex flex-col justify-between hover:shadow-sm hover:border-border transition-all duration-150 h-[80px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider block">Toplam Sayfa</span>
            <div className="size-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Layers className="size-3.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-semibold tracking-tight text-foreground leading-none">{stats.total}</span>
            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <ArrowUpRight className="size-2.5" /> Aktif Modüller
            </span>
          </div>
        </Card>

        {/* Card 2: Yayınlananlar */}
        <Card className="p-3 border border-border/80 bg-card shadow-xs flex flex-col justify-between hover:shadow-sm hover:border-border transition-all duration-150 h-[80px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider block">Yayınlananlar</span>
            <div className="size-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
              <Eye className="size-3.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-semibold tracking-tight text-foreground leading-none">{stats.published}</span>
            <span className="text-[9px] font-medium text-muted-foreground">Sitede yayında</span>
          </div>
        </Card>

        {/* Card 3: Taslaklar */}
        <Card className="p-3 border border-border/80 bg-card shadow-xs flex flex-col justify-between hover:shadow-sm hover:border-border transition-all duration-150 h-[80px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider block">Taslaklar</span>
            <div className="size-6 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
              <FileText className="size-3.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-semibold tracking-tight text-foreground leading-none">{stats.draft}</span>
            <span className="text-[9px] font-medium text-amber-600">Taslak modunda</span>
          </div>
        </Card>

        {/* Card 4: Sistem Sayfaları */}
        <Card className="p-3 border border-border/80 bg-card shadow-xs flex flex-col justify-between hover:shadow-sm hover:border-border transition-all duration-150 h-[80px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider block">Sistem Sayfaları</span>
            <div className="size-6 rounded-lg bg-zinc-500/10 flex items-center justify-center text-zinc-500 shrink-0">
              <Shield className="size-3.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-semibold tracking-tight text-foreground leading-none">{stats.system}</span>
            <span className="text-[9px] font-medium text-zinc-500">Silme korumalı</span>
          </div>
        </Card>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-muted/5 p-4 rounded-xl border border-border/80 shadow-xs">
        {/* Search & Inputs Group */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 sm:max-w-xs md:max-w-md">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground/40" />
            <Input
              type="text"
              placeholder="Sayfa adı veya slug ara... (ESC)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setSearchQuery('');
                }
              }}
              className="pl-9 pr-8 h-9 rounded-lg bg-card border border-border shadow-xs focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:border-primary/50 placeholder:text-muted-foreground/45 text-xs transition-all duration-150"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-muted-foreground/50 hover:text-foreground transition-colors duration-100"
                aria-label="Aramayı Temizle"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground shrink-0">Durum:</span>
            <Select value={selectedStatusFilter} onValueChange={setSelectedStatusFilter}>
              <SelectTrigger className="h-9 w-[130px] bg-card border border-border rounded-lg text-xs focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all duration-150">
                <SelectValue placeholder="Tümü" />
              </SelectTrigger>
              <SelectContent className="bg-card border border-border">
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="published">Yayınlandı (Published)</SelectItem>
                <SelectItem value="draft">Taslak (Draft)</SelectItem>
                <SelectItem value="archived">Arşiv (Archived)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Layout Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground shrink-0">Şablon (Layout):</span>
            <Select value={selectedLayoutFilter} onValueChange={setSelectedLayoutFilter}>
              <SelectTrigger className="h-9 w-[130px] bg-card border border-border rounded-lg text-xs focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all duration-150">
                <SelectValue placeholder="Tümü" />
              </SelectTrigger>
              <SelectContent className="bg-card border border-border">
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="default">Varsayılan (Default)</SelectItem>
                <SelectItem value="contact">İletişim (Contact)</SelectItem>
                <SelectItem value="about">Hakkımızda (About)</SelectItem>
                <SelectItem value="full-width">Tam Genişlik (Full-Width)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reset Filters Link */}
          {(searchQuery || selectedStatusFilter !== 'all' || selectedLayoutFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedStatusFilter('all');
                setSelectedLayoutFilter('all');
              }}
              className="text-xs text-muted-foreground hover:text-foreground font-semibold px-2 h-9 rounded-lg hover:bg-muted/50 transition-colors duration-150"
            >
              Filtreleri Temizle
            </Button>
          )}
        </div>

        {/* Sorting Selection */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-9 gap-1.5 rounded-lg border border-border text-xs font-semibold shrink-0 bg-card hover:bg-muted/50 transition-colors duration-150">
                <ListFilter className="size-3.5 text-muted-foreground" /> Sıralama Seçenekleri
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 bg-card border border-border shadow-md">
              <div className="p-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Sıralama Modu</div>
              <DropdownMenuItem onClick={() => setSortBy('order')} className="gap-2 cursor-pointer text-xs font-medium">
                Sayfa Sırası (Küçükten Büyüğe)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('created_at')} className="gap-2 cursor-pointer text-xs font-medium">
                Oluşturulma Tarihi (En Yeni)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('alphabetical')} className="gap-2 cursor-pointer text-xs font-medium">
                Alfabetik (A-Z)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Pages Table List */}
      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <LoaderCircleIcon className="size-8 text-primary animate-spin" />
        </div>
      ) : filteredAndSortedData.length === 0 ? (
        <Card className="h-64 flex flex-col items-center justify-center p-8 text-center border-dashed border-border bg-card rounded-2xl">
          <FileText className="size-10 text-muted-foreground/60 mb-3" />
          <h3 className="font-bold text-base text-foreground mb-1">Sayfa Bulunamadı</h3>
          <p className="text-xs text-muted-foreground max-w-sm mb-4">
            Arama kriterlerinize uygun kayıtlı dinamik sayfa bulunmuyor. Yeni bir sayfa kaydı açarak başlayabilirsiniz.
          </p>
          <Button onClick={() => router.push('/content-management/pages/new/builder')} className="h-9 gap-1.5 rounded-lg">
            <Plus className="size-4" /> Yeni Sayfa Ekle
          </Button>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/80 bg-muted/20 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                <th className="p-3.5 w-32 text-center">Önizleme / Üst Sayfa</th>
                <th className="p-3.5 min-w-[240px] pl-6">Sayfa Bilgisi</th>
                <th className="p-3.5 w-64">Tarih Planı</th>
                <th className="p-3.5 w-28">Durum</th>
                <th className="p-3.5 w-32 text-right">Aksiyon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredAndSortedData.map((item) => {
                const formattedCreatedAt = item.created_at
                  ? new Date(item.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '-';
                
                const formattedUpdatedAt = item.updated_at
                  ? new Date(item.updated_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : '-';

                const coverUrl = item.data?.cover_image?.url || '/media/previews/placeholder.png';
                const parentTitle = item.parent?.data?.title?.tr || null;

                return (
                  <tr key={item.id} className="hover:bg-muted/15 transition-all duration-150 group border-b border-border/30 hover:shadow-xs group/row">
                    {/* Cover Preview & Parent */}
                    <td className="py-2.5 px-4 align-middle">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-28 h-16 rounded-md overflow-hidden border border-border/60 bg-muted/20 relative shadow-xs transition-all duration-200 group-hover/row:shadow-sm group-hover/row:border-border">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={coverUrl} 
                            alt="Cover" 
                            className="w-full h-full object-cover transition-transform duration-200 group-hover/row:scale-102"
                            onError={(e) => {
                              e.target.src = '/media/previews/placeholder.png';
                            }}
                          />
                        </div>
                        {parentTitle ? (
                          <div className="flex flex-wrap mt-1 justify-center max-w-full">
                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-muted/95 text-muted-foreground/80 leading-tight block truncate max-w-[110px]" title={`Üst Sayfa: ${parentTitle}`}>
                              ↑ {parentTitle}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[8px] text-muted-foreground/60">-</span>
                        )}
                      </div>
                    </td>

                    {/* Title & Slug info */}
                    <td className="py-2.5 px-4 align-middle pl-6">
                      <div className="min-w-0">
                        <span className="font-semibold text-xs md:text-sm text-foreground block leading-snug tracking-tight hover:text-primary transition-colors duration-150 cursor-pointer flex items-center gap-1.5" onClick={() => handleEditClick(item)} title={item.data?.title?.tr}>
                          {item.data?.title?.tr || '-'}
                          {item.data?.is_homepage && (
                            <Badge className="bg-primary/15 text-primary border-primary/25 hover:bg-primary/20 text-[8px] font-bold h-4 px-1 rounded flex items-center gap-0.5 select-none shrink-0">
                              <Home className="size-2 bg-transparent" /> Ana Sayfa
                            </Badge>
                          )}
                          {item.data?.is_system && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Lock className="size-3 text-zinc-400 shrink-0" />
                              </TooltipTrigger>
                              <TooltipContent>Sistem Sayfası (Kilitli)</TooltipContent>
                            </Tooltip>
                          )}
                        </span>
                        
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="text-[10px] font-mono text-zinc-400">ID: {item.id}</span>
                          <span className="text-muted-foreground/60 text-[10px]">•</span>
                          <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-0.5">
                            <Globe className="size-3 text-muted-foreground/50" /> {item.data?.is_homepage ? '/' : (item.data?.slug?.tr || '-')}
                          </span>
                          <span className="text-muted-foreground/60 text-[10px]">•</span>
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/5 text-primary text-[8px]">
                            {item.data?.layout || 'default'}
                          </span>
                          <span className="text-muted-foreground/60 text-[10px]">•</span>
                          <span className="text-[10px] font-mono text-muted-foreground">Sıra: {item.data?.order || 0}</span>
                        </div>
                      </div>
                    </td>

                    {/* Dates */}
                    <td className="py-2.5 px-4 align-middle text-xs font-semibold text-muted-foreground">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="size-3 text-primary shrink-0" />
                          <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider w-[64px] shrink-0">Oluşturma:</span>
                          <span className="text-foreground text-xs truncate">{formattedCreatedAt}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="size-3 text-muted-foreground/50 shrink-0" />
                          <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider w-[64px] shrink-0">Güncelleme:</span>
                          <span className="text-muted-foreground text-xs truncate">{formattedUpdatedAt}</span>
                        </div>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-2.5 px-4 align-middle">
                      {item.status === 'published' && (
                        <Badge className="bg-emerald-500/10 hover:bg-emerald-500/15 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded text-[10px]">
                          Yayınlandı
                        </Badge>
                      )}
                      {item.status === 'draft' && (
                        <Badge className="bg-amber-500/10 hover:bg-amber-500/15 border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 rounded text-[10px]">
                          Taslak
                        </Badge>
                      )}
                      {item.status === 'archived' && (
                        <Badge className="bg-zinc-500/10 hover:bg-zinc-500/15 border-zinc-500/20 text-zinc-500 font-bold px-2 py-0.5 rounded text-[10px]">
                          Arşiv
                        </Badge>
                      )}
                    </td>

                    {/* Actions dropdown */}
                    <td className="py-2.5 px-4 align-middle text-right">
                      <div className="flex items-center justify-end gap-1.5 shrink-0">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditClick(item)}
                              className="size-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground inline-flex items-center justify-center transition-colors duration-150"
                            >
                              <Edit className="size-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Düzenle</TooltipContent>
                        </Tooltip>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground inline-flex items-center justify-center transition-colors duration-150"
                            >
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 bg-card border border-border shadow-md">
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(item)}
                              disabled={item.data?.is_system}
                              className={`font-semibold text-xs gap-2 cursor-pointer ${item.data?.is_system ? 'text-zinc-400 cursor-not-allowed' : 'text-destructive'}`}
                            >
                              <Trash className="size-3.5" />
                              Sayfayı Sil
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Alert */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sayfayı Silmek İstiyor musunuz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Sayfa sistemden tamamen silinecektir (Soft Delete uygulanır).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(idToDelete)}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Siliniyor...' : 'Evet, Sil'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Container>
  );
}
