'use client';

import { useMemo, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
  Download,
  Upload,
  Sparkles
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
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
import PostDialog from './components/post-dialog';

export default function PostsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const router = useRouter();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState(null);

  const searchParams = useSearchParams();

  // Filters & Sorting
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at'); // created_at, date, alphabetical, reading_time

  useEffect(() => {
    const catId = searchParams.get('category_id');
    if (catId) {
      setSelectedCategoryFilter(catId);
    }
  }, [searchParams]);

  // Fetch categories of type 'blog'
  const { data: categories } = useQuery({
    queryKey: ['admin-categories-blog'],
    queryFn: async () => {
      const res = await apiFetch('/api/admin/categories?type=blog');
      if (!res.ok) throw new Error('Failed to fetch categories');
      const json = await res.json();
      return json.data || [];
    },
  });

  // Fetch posts list
  const { data: postsList, isLoading } = useQuery({
    queryKey: ['admin-posts', selectedCategoryFilter, selectedStatusFilter],
    queryFn: async () => {
      let url = '/api/admin/posts?';
      if (selectedCategoryFilter !== 'all') {
        url += `category_id=${selectedCategoryFilter}&`;
      }
      if (selectedStatusFilter !== 'all') {
        url += `status=${selectedStatusFilter}&`;
      }
      const res = await apiFetch(url);
      if (!res.ok) throw new Error('Failed to fetch posts');
      const json = await res.json();
      return json.data || [];
    },
  });

  // Calculate statistics
  const stats = useMemo(() => {
    if (!postsList) return { total: 0, published: 0, draft: 0, archived: 0 };
    return {
      total: postsList.length,
      published: postsList.filter((r) => r.status === 'published').length,
      draft: postsList.filter((r) => r.status === 'draft').length,
      archived: postsList.filter((r) => r.status === 'archived').length,
    };
  }, [postsList]);

  // Filter & Sort local data
  const filteredAndSortedData = useMemo(() => {
    if (!postsList) return [];

    let result = postsList;

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
      if (sortBy === 'created_at') {
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      } else if (sortBy === 'alphabetical') {
        const nameA = a.data?.title?.tr || '';
        const nameB = b.data?.title?.tr || '';
        return nameA.localeCompare(nameB, 'tr');
      } else if (sortBy === 'reading_time') {
        return (b.data?.reading_time || 0) - (a.data?.reading_time || 0);
      } else {
        // publish_date (newest first)
        const dateA = a.published_at || a.created_at || 0;
        const dateB = b.published_at || b.created_at || 0;
        return new Date(dateB) - new Date(dateA);
      }
    });
  }, [postsList, searchQuery, sortBy]);

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await apiFetch(`/api/admin/posts/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete post');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      setDeleteConfirmOpen(false);
      setIdToDelete(null);
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>Yazı başarıyla silindi.</AlertTitle>
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
            <AlertTitle>{err.message || 'Yazı silinemedi.'}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
    },
  });

  const handleDeleteClick = (id) => {
    setIdToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleEditClick = (post) => {
    setSelectedPost(post);
    setDialogOpen(true);
  };

  const handleCreateClick = () => {
    setSelectedPost(null);
    setDialogOpen(true);
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
            <BreadcrumbLink href="/content-management/content-entries?type=blog">İçerik Yönetimi</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Blog / Haberler</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Blog / Haberler</h1>
          <p className="text-xs md:text-sm text-muted-foreground/80 mt-1">
            Tüm blog yazılarını buradan yönetebilir, filtreleyebilir, sıralayabilir ve düzenleyebilirsiniz.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push('/content-management/posts/new/builder')}
            className="gap-1.5 h-9 rounded-lg border-primary/20 hover:border-primary/45 text-primary bg-primary/5 hover:bg-primary/10 shadow-xs font-semibold text-xs transition-all duration-150"
          >
            <Sparkles className="size-3.5 text-primary" /> Gelişmiş Yazı Ekle
          </Button>
          <Button onClick={handleCreateClick} className="gap-1.5 h-9 rounded-lg shadow-xs font-semibold text-xs transition-all duration-150">
            <Plus className="size-4" /> Yeni Yazı Ekle
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-9 w-9 p-0 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors duration-150 flex items-center justify-center">
                <MoreVertical className="size-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-card border border-border shadow-md">
              <DropdownMenuItem
                onClick={() => router.push('/content-management/posts/new/builder')}
                className="gap-2 cursor-pointer text-xs font-semibold text-primary"
              >
                <Sparkles className="size-3.5 text-primary" /> Gelişmiş Yazı Ekle
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-semibold">
                <Upload className="size-3.5 text-muted-foreground" /> İçeri Aktar
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-semibold">
                <Download className="size-3.5 text-muted-foreground" /> Dışarı Aktar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Toplam Yazı */}
        <Card className="p-3 border border-border/80 bg-card shadow-xs flex flex-col justify-between hover:shadow-sm hover:border-border transition-all duration-150 h-[80px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider block">Toplam Yazı</span>
            <div className="size-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Layers className="size-3.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-semibold tracking-tight text-foreground leading-none">{stats.total}</span>
            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <ArrowUpRight className="size-2.5" /> +2 bu ay
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
            <span className="text-[9px] font-medium text-muted-foreground">Sitede aktif</span>
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

        {/* Card 4: Arşivlenenler */}
        <Card className="p-3 border border-border/80 bg-card shadow-xs flex flex-col justify-between hover:shadow-sm hover:border-border transition-all duration-150 h-[80px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider block">Arşivlenenler</span>
            <div className="size-6 rounded-lg bg-zinc-500/10 flex items-center justify-center text-zinc-500 shrink-0">
              <X className="size-3.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-semibold tracking-tight text-foreground leading-none">{stats.archived}</span>
            <span className="text-[9px] font-medium text-zinc-500">Pasif durumda</span>
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
              placeholder="Yazı adı veya slug ara... (ESC)"
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

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground shrink-0">Kategori:</span>
            <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
              <SelectTrigger className="h-9 w-[130px] bg-card border border-border rounded-lg text-xs focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all duration-150">
                <SelectValue placeholder="Tümü" />
              </SelectTrigger>
              <SelectContent className="bg-card border border-border">
                <SelectItem value="all">Tümü</SelectItem>
                {(categories || []).map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>
                    {cat.name?.tr || cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          
          {/* Reset Filters Link */}
          {(searchQuery || selectedCategoryFilter !== 'all' || selectedStatusFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategoryFilter('all');
                setSelectedStatusFilter('all');
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
              <DropdownMenuItem onClick={() => setSortBy('created_at')} className="gap-2 cursor-pointer text-xs font-medium">
                Oluşturulma Tarihi (En Yeni)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('date')} className="gap-2 cursor-pointer text-xs font-medium">
                Yayınlanma Tarihi (En Yeni)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('reading_time')} className="gap-2 cursor-pointer text-xs font-medium">
                Okuma Süresi (En Çok)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('alphabetical')} className="gap-2 cursor-pointer text-xs font-medium">
                Alfabetik (A-Z)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Posts Table List */}
      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <LoaderCircleIcon className="size-8 text-primary animate-spin" />
        </div>
      ) : filteredAndSortedData.length === 0 ? (
        <Card className="h-64 flex flex-col items-center justify-center p-8 text-center border-dashed border-border bg-card rounded-2xl">
          <FileText className="size-10 text-muted-foreground/60 mb-3" />
          <h3 className="font-bold text-base text-foreground mb-1">Yazı Bulunamadı</h3>
          <p className="text-xs text-muted-foreground max-w-sm mb-4">
            Arama kriterlerinize uygun kayıtlı yazı bulunmuyor. Yeni bir yazı kaydı açarak başlayabilirsiniz.
          </p>
          <Button onClick={handleCreateClick} className="h-9 gap-1.5 rounded-lg">
            <Plus className="size-4" /> Yeni Yazı Ekle
          </Button>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/80 bg-muted/20 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                <th className="p-3.5 w-32 text-center">Görsel / Kategori</th>
                <th className="p-3.5 min-w-[240px] pl-6">Yazı Bilgisi</th>
                <th className="p-3.5 w-64">Tarih Planı</th>
                <th className="p-3.5 w-28">Durum</th>
                <th className="p-3.5 w-32 text-right">Aksiyon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredAndSortedData.map((item) => {
                const formattedDate = item.published_at
                  ? new Date(item.published_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : '-';
                
                const formattedCreatedAt = item.created_at
                  ? new Date(item.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '-';
                
                const coverUrl = item.data?.cover_image?.url || '/media/previews/placeholder.png';
                const postCategories = item.data?.categories || [];

                return (
                  <tr key={item.id} className="hover:bg-muted/15 transition-all duration-150 group border-b border-border/30 hover:shadow-xs group/row">
                    {/* Cover Photo Preview & Categories */}
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
                        {postCategories.length > 0 ? (
                          <div className="flex flex-wrap gap-0.5 w-28 mt-1 justify-center">
                            {postCategories.map((c) => (
                              <span key={c.id} className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-muted/90 text-muted-foreground/80 leading-tight max-w-full truncate block" title={c.name?.tr || c.name}>
                                {c.name?.tr || c.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[8px] text-muted-foreground">-</span>
                        )}
                      </div>
                    </td>

                    {/* Title & Slug info */}
                    <td className="py-2.5 px-4 align-middle pl-6">
                      <div className="min-w-0">
                        <span className="font-semibold text-xs md:text-sm text-foreground block leading-snug tracking-tight hover:text-primary transition-colors duration-150 cursor-pointer" onClick={() => handleEditClick(item)} title={item.data?.title?.tr}>
                          {item.data?.title?.tr || '-'}
                        </span>
                        
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="text-[10px] font-mono text-zinc-400">ID: {item.id}</span>
                          <span className="text-muted-foreground/60 text-[10px]">•</span>
                          <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-0.5">
                            <Globe className="size-3 text-muted-foreground/50" /> {item.data?.slug?.tr || '-'}
                          </span>
                          <span className="text-muted-foreground/60 text-[10px]">•</span>
                          <span className="text-[10px] text-muted-foreground font-semibold">{item.data?.reading_time || 5} dk okuma</span>
                        </div>
                      </div>
                    </td>

                    {/* Grouped Dates */}
                    <td className="py-2.5 px-4 align-middle text-xs font-semibold text-muted-foreground">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="size-3 text-primary shrink-0" />
                          <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider w-[64px] shrink-0">Yayınlanma:</span>
                          <span className="text-foreground text-xs truncate">{formattedDate}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="size-3 text-muted-foreground/50 shrink-0" />
                          <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider w-[64px] shrink-0">Oluşturma:</span>
                          <span className="text-muted-foreground text-xs truncate">{formattedCreatedAt}</span>
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
                              onClick={() => router.push(`/content-management/posts/${item.id}/builder`)}
                              className="size-8 rounded-lg hover:bg-muted text-primary hover:text-primary-active inline-flex items-center justify-center transition-colors duration-150"
                            >
                              <Sparkles className="size-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Gelişmiş Blok Editörü</TooltipContent>
                        </Tooltip>
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
                              onClick={() => router.push(`/content-management/posts/${item.id}/builder`)}
                              className="font-semibold text-xs gap-2 cursor-pointer text-primary"
                            >
                              <Sparkles className="size-3.5" />
                              Gelişmiş Editör
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(item.id)}
                              className="text-destructive font-semibold text-xs gap-2 cursor-pointer"
                            >
                              <Trash className="size-3.5" />
                              Yazıyı Sil
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

      {/* Create/Edit Right Drawer */}
      <PostDialog
        open={dialogOpen}
        closeDialog={() => setDialogOpen(false)}
        post={selectedPost}
      />

      {/* Delete Confirmation Alert */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Yazıyı Silmek İstiyor musunuz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Yazı sistemden tamamen silinecektir (Soft Delete uygulanır).
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
