'use client';

import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Edit,
  Trash,
  Plus,
  Search,
  Layers,
  LoaderCircleIcon,
  Globe,
  ListFilter,
  Eye,
  EyeOff,
  User,
  Phone,
  Calendar,
  DollarSign,
  Info,
  Map,
  Compass,
  AreaChart,
  Images,
  Video,
  MoreHorizontal,
  MoreVertical,
  X,
  Copy,
  FileText,
  Clock,
  ArrowUpRight,
  Download,
  Upload,
  CalendarRange,
  ChevronDown,
  ChevronRight
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
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Sortable, SortableItem, SortableItemHandle } from '@/components/ui/sortable';
import { arrayMove } from '@dnd-kit/sortable';
import { GripVertical } from 'lucide-react';
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
import RaceDialog from './components/race-dialog';
import RaceMediaDialog from './components/race-media-dialog';
import { RightDrawer } from '@/components/common/right-drawer';

export default function RacesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const getInitials = (name) => {
    if (!name) return 'U';
    const cleanName = name.replace('Sorumlu Belirtilmedi', 'SB');
    if (cleanName === 'SB') return 'SB';
    return cleanName
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRace, setSelectedRace] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState(null);

  // Quick Media Editor States
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const [mediaSelectedRace, setMediaSelectedRace] = useState(null);
  const [mediaDefaultTab, setMediaDefaultTab] = useState('gpx');

  // Child Races Drawer States
  const [childRacesOpen, setChildRacesOpen] = useState(false);
  const [selectedParentRace, setSelectedParentRace] = useState(null);

  const handleOpenChildRaces = (parentRace) => {
    setSelectedParentRace(parentRace);
    setChildRacesOpen(true);
  };
  
  const searchParams = useSearchParams();

  // Filters & Sorting
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at'); // created_at, custom, date, price, alphabetical

  useEffect(() => {
    const catId = searchParams.get('category_id');
    if (catId) {
      setSelectedCategoryFilter(catId);
    }
  }, [searchParams]);

  // Fetch categories (for filter dropdown)
  const { data: categories } = useQuery({
    queryKey: ['admin-categories-all'],
    queryFn: async () => {
      const res = await apiFetch('/api/admin/categories?type=race');
      if (!res.ok) throw new Error('Failed to fetch categories');
      const json = await res.json();
      return json.data || [];
    },
  });

  // Fetch races list
  const { data: racesList, isLoading } = useQuery({
    queryKey: ['admin-races', selectedCategoryFilter, selectedStatusFilter],
    queryFn: async () => {
      let url = '/api/admin/races?';
      if (selectedCategoryFilter !== 'all') {
        url += `category_id=${selectedCategoryFilter}&`;
      }
      if (selectedStatusFilter !== 'all') {
        url += `status=${selectedStatusFilter}&`;
      }
      const res = await apiFetch(url);
      if (!res.ok) throw new Error('Failed to fetch races');
      const json = await res.json();
      return json.data || [];
    },
  });

  // Calculate statistics
  const stats = useMemo(() => {
    if (!racesList) return { total: 0, multi: 0, activeSales: 0, draft: 0 };
    return {
      total: racesList.length,
      multi: racesList.filter((r) => r.is_multi_race).length,
      activeSales: racesList.filter((r) => r.is_sales_active).length,
      draft: racesList.filter((r) => r.status === 'draft').length,
    };
  }, [racesList]);

  // Filter & Sort local data
  const filteredAndSortedData = useMemo(() => {
    if (!racesList) return [];

    let result = racesList;

    // 1. Filter by Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.title?.tr?.toLowerCase().includes(q) ||
          r.title?.en?.toLowerCase().includes(q) ||
          r.slug?.tr?.toLowerCase().includes(q) ||
          r.slug?.en?.toLowerCase().includes(q) ||
          r.manager_name?.toLowerCase().includes(q)
      );
    }

    // 2. Sort Data
    return [...result].sort((a, b) => {
      if (sortBy === 'custom') {
        return (a.order || 0) - (b.order || 0) || a.id - b.id;
      } else if (sortBy === 'created_at') {
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      } else if (sortBy === 'alphabetical') {
        const nameA = a.title?.tr || '';
        const nameB = b.title?.tr || '';
        return nameA.localeCompare(nameB);
      } else if (sortBy === 'price') {
        return (a.price || 0) - (b.price || 0);
      } else {
        // start_date (newest first)
        return new Date(b.start_date || 0) - new Date(a.start_date || 0);
      }
    });
  }, [racesList, searchQuery, sortBy]);

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await apiFetch(`/api/admin/races/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete race');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-races'] });
      queryClient.invalidateQueries({ queryKey: ['admin-races-list'] });
      setDeleteConfirmOpen(false);
      setIdToDelete(null);
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>Yarış başarıyla silindi.</AlertTitle>
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
            <AlertTitle>{err.message || 'Yarış silinemedi.'}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
    },
  });

  // Reorder Mutation
  const reorderMutation = useMutation({
    mutationFn: async (orderedIds) => {
      const res = await apiFetch('/api/admin/races/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: orderedIds }),
      });
      if (!res.ok) throw new Error('Failed to reorder races');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-races'] });
      toast.success('Yarış sıralaması güncellendi.');
    },
    onError: (err) => {
      toast.error(err.message || 'Yarışlar sıralanamadı.');
    },
  });

  // Generic Update Race Mutation
  const updateRaceMutation = useMutation({
    mutationFn: async ({ id, updatedFields, currentRace }) => {
      const payload = {
        title: currentRace.title,
        slug: currentRace.slug,
        content: currentRace.content,
        start_date: currentRace.start_date,
        start_time: currentRace.start_time,
        location_embed: currentRace.location_embed,
        price: Number(currentRace.price) || 0,
        discounted_price: Number(currentRace.discounted_price) || 0,
        registration_deadline: currentRace.registration_deadline,
        max_participants: Number(currentRace.max_participants) || 0,
        distance: currentRace.distance,
        start_point: currentRace.start_point,
        finish_point: currentRace.finish_point,
        elevation: currentRace.elevation,
        descent: currentRace.descent,
        cover_image_id: currentRace.cover_image_id || currentRace.cover_image?.id || null,
        graphic_image_id: currentRace.graphic_image_id || currentRace.graphic_image?.id || null,
        gpx_file_id: currentRace.gpx_file_id || currentRace.gpx_file?.id || null,
        strava_file_id: currentRace.strava_file_id || currentRace.strava_file?.id || null,
        gallery_ids: currentRace.gallery_ids || (currentRace.gallery || []).map(g => g.id),
        youtube_embed: currentRace.youtube_embed,
        is_multi_race: currentRace.is_multi_race,
        manager_name: currentRace.manager_name,
        manager_phone: currentRace.manager_phone,
        is_sales_active: currentRace.is_sales_active,
        contest_id: currentRace.contest_id ? Number(currentRace.contest_id) : null,
        is_free: currentRace.is_free,
        status: currentRace.status,
        category_ids: currentRace.category_ids || (currentRace.categories || []).map(c => c.id),
        child_race_ids: currentRace.child_race_ids || (currentRace.child_races || []).map(r => r.id),
        min_age: currentRace.min_age !== undefined ? currentRace.min_age : null,
        max_age: currentRace.max_age !== undefined ? currentRace.max_age : null,
        ...updatedFields,
      };

      const res = await apiFetch(`/api/admin/races/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Güncellenemedi');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-races'] });
      queryClient.invalidateQueries({ queryKey: ['admin-races-list'] });
      toast.success('Yarış başarıyla güncellendi.');
    },
    onError: (err) => {
      toast.error(err.message || 'Güncellenirken hata oluştu.');
    },
  });

  const handleMove = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = filteredAndSortedData.findIndex((item) => item.id === active.id);
    const newIndex = filteredAndSortedData.findIndex((item) => item.id === over.id);

    const reorderedData = arrayMove(filteredAndSortedData, oldIndex, newIndex);
    queryClient.setQueryData(['admin-races', selectedCategoryFilter, selectedStatusFilter], reorderedData);

    const orderedIds = reorderedData.map((item) => item.id);
    reorderMutation.mutate(orderedIds);
  };

  const handleEditClick = (race) => {
    setSelectedRace(race);
    setDialogOpen(true);
  };

  const handleCreateClick = () => {
    setSelectedRace(null);
    setDialogOpen(true);
  };

  const handleDeleteClick = (id) => {
    setIdToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleOpenMedia = (race, tab) => {
    setMediaSelectedRace(race);
    setMediaDefaultTab(tab);
    setMediaDialogOpen(true);
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
            <BreadcrumbLink href="/content-management/content-entries?type=yarislar">İçerik Yönetimi</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Yarışlar</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
       {/* Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Yarışlar</h1>
          <p className="text-xs md:text-sm text-muted-foreground/80 mt-1">
            Tüm yarışları buradan yönetebilir, filtreleyebilir, sıralayabilir ve düzenleyebilirsiniz.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleCreateClick} className="gap-1.5 h-9 rounded-lg shadow-xs font-semibold text-xs transition-all duration-150">
            <Plus className="size-4" /> Yeni Yarış Ekle
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-9 w-9 p-0 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors duration-150 flex items-center justify-center">
                <MoreVertical className="size-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 bg-card border border-border shadow-md">
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

      {/* Redesigned Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Toplam Yarış */}
        <Card className="p-3 border border-border/80 bg-card shadow-xs flex flex-col justify-between hover:shadow-sm hover:border-border transition-all duration-150 h-[80px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider block">Toplam Yarış</span>
            <div className="size-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Layers className="size-3.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-semibold tracking-tight text-foreground leading-none">{stats.total}</span>
            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <ArrowUpRight className="size-2.5" /> +5 bu ay
            </span>
          </div>
        </Card>

        {/* Card 2: Kayıtları Açık */}
        <Card className="p-3 border border-border/80 bg-card shadow-xs flex flex-col justify-between hover:shadow-sm hover:border-border transition-all duration-150 h-[80px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider block">Kayıtlar Açık</span>
            <div className="size-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
              <Eye className="size-3.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-semibold tracking-tight text-foreground leading-none">{stats.activeSales}</span>
            <span className="text-[9px] font-medium text-muted-foreground">Aktif başvuru</span>
          </div>
        </Card>

        {/* Card 3: Çoklu Paketler */}
        <Card className="p-3 border border-border/80 bg-card shadow-xs flex flex-col justify-between hover:shadow-sm hover:border-border transition-all duration-150 h-[80px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider block">Çoklu Paketler</span>
            <div className="size-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
              <Info className="size-3.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-semibold tracking-tight text-foreground leading-none">{stats.multi}</span>
            <span className="text-[9px] font-medium text-blue-600 dark:text-blue-400">Yarış paketleri</span>
          </div>
        </Card>

        {/* Card 4: Taslaklar */}
        <Card className="p-3 border border-border/80 bg-card shadow-xs flex flex-col justify-between hover:shadow-sm hover:border-border transition-all duration-150 h-[80px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider block">Taslak Yarışlar</span>
            <div className="size-6 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
              <FileText className="size-3.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-semibold tracking-tight text-foreground leading-none">{stats.draft}</span>
            <span className="text-[9px] font-medium text-amber-600">Taslak modunda</span>
          </div>
        </Card>
      </div>

      {/* Redesigned Filters Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-muted/5 p-4 rounded-xl border border-border/80 shadow-xs">
        {/* Search & Inputs Group */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 sm:max-w-xs md:max-w-md">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground/40" />
            <Input
              type="text"
              placeholder="Yarış adı, şehir veya organizasyon ara... (ESC)"
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
                    {cat.name?.tr}
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
                <SelectItem value="published">Aktif (Published)</SelectItem>
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

        {/* Sorting selection */}
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
              <DropdownMenuItem onClick={() => setSortBy('custom')} className="gap-2 cursor-pointer text-xs font-medium">
                Sürükle-Bırak Özel Sıralama
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('date')} className="gap-2 cursor-pointer text-xs font-medium">
                Yarış Tarihi (En Yeni)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('price')} className="gap-2 cursor-pointer text-xs font-medium">
                Kayıt Ücreti
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('alphabetical')} className="gap-2 cursor-pointer text-xs font-medium">
                Alfabetik (A-Z)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Races List */}
      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <LoaderCircleIcon className="size-8 text-primary animate-spin" />
        </div>
      ) : filteredAndSortedData.length === 0 ? (
        <Card className="h-64 flex flex-col items-center justify-center p-8 text-center border-dashed border-border bg-card rounded-2xl">
          <Layers className="size-10 text-muted-foreground/60 mb-3" />
          <h3 className="font-bold text-base text-foreground mb-1">Yarış Bulunamadı</h3>
          <p className="text-xs text-muted-foreground max-w-sm mb-4">
            Arama kriterlerinize uygun kayıtlı yarış bulunmuyor. Yeni bir yarış kaydı açarak başlayabilirsiniz.
          </p>
          <Button onClick={handleCreateClick} className="h-9 gap-1.5 rounded-lg">
            <Plus className="size-4" /> Yeni Yarış Ekle
          </Button>
        </Card>
      ) : (
        <Sortable
          value={filteredAndSortedData}
          getItemValue={(item) => item.id}
          onMove={handleMove}
          strategy="vertical"
          className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm"
        >
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/80 bg-muted/20 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                {sortBy === 'custom' && <th className="p-3.5 w-12 text-center">Sıra</th>}
                <th className="p-3.5 w-32 text-center">Görsel / Kategori</th>
                <th className="p-3.5 min-w-[240px] pl-6">Yarış Bilgisi</th>
                <th className="p-3.5 w-64">Tarih Planı</th>
                <th className="p-3.5 min-w-[160px]">Sorumlu</th>
                <th className="p-3.5 w-44">İçerik Kontrolü</th>
                <th className="p-3.5 w-28">Durum</th>
                <th className="p-3.5 w-32 text-right">Aksiyon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredAndSortedData.map((item) => {
                const formattedDate = item.start_date
                  ? new Date(item.start_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
                  : '-';
                
                const formattedCreatedAt = item.created_at
                  ? new Date(item.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '-';
                
                const coverUrl = item.cover_image?.url || '/media/previews/placeholder.png';

                return (
                  <SortableItem key={item.id} value={item.id} disabled={sortBy !== 'custom'} className="data-[disabled=true]:opacity-100" asChild>
                    <tr className="hover:bg-muted/15 transition-all duration-150 group border-b border-border/30 hover:shadow-xs group/row">
                      {/* Drag Handle */}
                      {sortBy === 'custom' && (
                        <td className="py-2.5 px-4 text-center align-middle">
                          <SortableItemHandle asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground/40 hover:text-foreground cursor-grab active:cursor-grabbing inline-flex items-center justify-center transition-colors duration-150"
                              type="button"
                            >
                              <GripVertical className="size-4" />
                            </Button>
                          </SortableItemHandle>
                        </td>
                      )}

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
                          {item.categories && item.categories.length > 0 ? (
                            <div className="flex flex-wrap gap-0.5 w-28 mt-1">
                              {item.categories.map((c) => (
                                <span key={c.id} className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-muted/90 text-muted-foreground/80 leading-tight max-w-full truncate block" title={c.name?.tr}>
                                  {c.name?.tr}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[8px] text-muted-foreground">-</span>
                          )}
                        </div>
                      </td>

                      {/* Title, pricing, and package info */}
                      <td className="py-2.5 px-4 align-middle pl-6">
                        <div className="min-w-0">
                          <span className="font-semibold text-xs md:text-sm text-foreground block leading-snug tracking-tight hover:text-primary transition-colors duration-150 cursor-default" title={item.title?.tr}>
                            {item.title?.tr || '-'}
                          </span>
                          
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {/* Fee Text */}
                            {item.is_free ? (
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Ücretsiz</span>
                            ) : (
                              <span className="text-[10px] font-bold text-foreground/80">{item.price} TL</span>
                            )}

                            {/* Multi-Race Info */}
                            {item.is_multi_race && (
                              <button
                                type="button"
                                onClick={() => handleOpenChildRaces(item)}
                                className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-800 dark:hover:text-blue-300 hover:underline cursor-pointer flex items-center gap-0.5 transition-all"
                              >
                                • Çoklu Yarış ({item.child_races?.length || 0})
                              </button>
                            )}

                            {/* Sales Status Info */}
                            {!item.is_sales_active && (
                              <span className="text-[10px] text-red-600 dark:text-red-400 font-medium">• Kayıtlar Kapalı</span>
                            )}

                            {/* Age Limit Info */}
                            {(item.min_age !== null || item.max_age !== null) && (
                              <span className="text-[10px] text-muted-foreground font-semibold">
                                • Yaş: {item.min_age ?? '0'}-{item.max_age ?? '∞'}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Grouped Dates */}
                      <td className="py-2.5 px-4 align-middle text-xs font-semibold text-muted-foreground">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="size-3 text-primary shrink-0" />
                            <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider w-[64px] shrink-0">Yarış:</span>
                            <span className="text-foreground text-xs truncate">{formattedDate} {item.start_time && `(${item.start_time})`}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="size-3 text-red-500 shrink-0" />
                            <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider w-[64px] shrink-0">Kayıt Son:</span>
                            <span className="text-foreground text-xs truncate">
                              {item.registration_deadline
                                ? new Date(item.registration_deadline).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })
                                : '-'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <CalendarRange className="size-3 text-muted-foreground/50 shrink-0" />
                            <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider w-[64px] shrink-0">Oluşturma:</span>
                            <span className="text-muted-foreground text-xs truncate">{formattedCreatedAt}</span>
                          </div>
                        </div>
                      </td>

                      {/* Sorumlu / Manager */}
                      <td className="py-2.5 px-4 align-middle">
                        <div className="flex items-center gap-2">
                          <Avatar className="size-8 rounded-full border border-border/80 shadow-xs shrink-0 bg-background">
                            <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-bold">
                              {getInitials(item.manager_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <span className="block text-xs font-semibold text-foreground truncate" title={item.manager_name}>
                              {item.manager_name || '-'}
                            </span>
                            {item.manager_phone && (
                              <span className="block text-[9px] text-muted-foreground/75 truncate" title={item.manager_phone}>
                                {item.manager_phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contents & Media checks with Tooltips */}
                      <td className="py-2.5 px-4 align-middle">
                        <div className="flex items-center gap-1.5 flex-wrap max-w-[150px]">
                          {/* GPX File */}
                          {!item.is_multi_race && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge
                                  variant="outline"
                                  onClick={() => handleOpenMedia(item, 'gpx')}
                                  className={`h-5 text-[9px] font-bold px-1.5 py-0 rounded-md flex items-center gap-1 cursor-pointer transition-all duration-100 active:scale-95 border ${
                                    item.gpx_file_id || item.gpx_file
                                      ? 'bg-primary/5 text-primary border-primary/20 hover:bg-primary/10 opacity-100'
                                      : 'bg-muted/10 text-muted-foreground/30 border-transparent opacity-35 hover:bg-muted/20'
                                  }`}
                                >
                                  <Map className="size-3 shrink-0" />
                                  GPX
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="top" variant="light" className="text-xs px-2 py-1 font-semibold rounded-md shadow-sm">
                                {item.gpx_file_id || item.gpx_file 
                                  ? 'GPX Rota Dosyası Yüklü (Düzenlemek için tıklayın)' 
                                  : 'GPX Rota Dosyası Eksik (Yüklemek için tıklayın)'}
                              </TooltipContent>
                            </Tooltip>
                          )}

                          {/* Strava Route */}
                          {!item.is_multi_race && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge
                                  variant="outline"
                                  onClick={() => handleOpenMedia(item, 'strava')}
                                  className={`h-5 text-[9px] font-bold px-1.5 py-0 rounded-md flex items-center gap-1 cursor-pointer transition-all duration-100 active:scale-95 border ${
                                    item.location_embed?.includes('strava')
                                      ? 'bg-orange-500/5 text-orange-600 dark:text-orange-400 border-orange-500/20 hover:bg-orange-500/10 opacity-100'
                                      : 'bg-muted/10 text-muted-foreground/30 border-transparent opacity-35 hover:bg-muted/20'
                                  }`}
                                >
                                  <Compass className="size-3 shrink-0" />
                                  STRV
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="top" variant="light" className="text-xs px-2 py-1 font-semibold rounded-md shadow-sm">
                                {item.location_embed?.includes('strava') 
                                  ? 'Strava Entegrasyonu Aktif (Düzenlemek için tıklayın)' 
                                  : 'Strava Entegrasyonu Yok (Eklemek için tıklayın)'}
                              </TooltipContent>
                            </Tooltip>
                          )}

                          {/* Height Graph */}
                          {!item.is_multi_race && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge
                                  variant="outline"
                                  onClick={() => handleOpenMedia(item, 'graphic')}
                                  className={`h-5 text-[9px] font-bold px-1.5 py-0 rounded-md flex items-center gap-1 cursor-pointer transition-all duration-100 active:scale-95 border ${
                                    item.graphic_image_id || item.graphic_image
                                      ? 'bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10 opacity-100'
                                      : 'bg-muted/10 text-muted-foreground/30 border-transparent opacity-35 hover:bg-muted/20'
                                  }`}
                                >
                                  <AreaChart className="size-3 shrink-0" />
                                  GRAF
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="top" variant="light" className="text-xs px-2 py-1 font-semibold rounded-md shadow-sm">
                                {item.graphic_image_id || item.graphic_image 
                                  ? 'Yükseklik Grafiği Yüklü (Düzenlemek için tıklayın)' 
                                  : 'Yükseklik Grafiği Yok (Yüklemek için tıklayın)'}
                              </TooltipContent>
                            </Tooltip>
                          )}

                          {/* Gallery */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge
                                variant="outline"
                                onClick={() => handleOpenMedia(item, 'gallery')}
                                className={`h-5 text-[9px] font-bold px-1.5 py-0 rounded-md flex items-center gap-1 cursor-pointer transition-all duration-100 active:scale-95 border ${
                                  item.gallery_ids?.length > 0 || item.gallery?.length > 0
                                    ? 'bg-blue-500/5 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/10 opacity-100'
                                    : 'bg-muted/10 text-muted-foreground/30 border-transparent opacity-35 hover:bg-muted/20'
                                }`}
                              >
                                <Images className="size-3 shrink-0" />
                                GALR
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent side="top" variant="light" className="text-xs px-2 py-1 font-semibold rounded-md shadow-sm">
                              {item.gallery_ids?.length > 0 || item.gallery?.length > 0
                                ? `Fotoğraf Galerisi Aktif (${item.gallery_ids?.length || item.gallery?.length || 0} Görsel) (Düzenlemek için tıklayın)`
                                : 'Fotoğraf Galerisi Boş (Eklemek için tıklayın)'}
                            </TooltipContent>
                          </Tooltip>

                          {/* Video */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge
                                variant="outline"
                                onClick={() => handleOpenMedia(item, 'video')}
                                className={`h-5 text-[9px] font-bold px-1.5 py-0 rounded-md flex items-center gap-1 cursor-pointer transition-all duration-100 active:scale-95 border ${
                                  item.youtube_embed
                                    ? 'bg-red-500/5 text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/10 opacity-100'
                                    : 'bg-muted/10 text-muted-foreground/30 border-transparent opacity-35 hover:bg-muted/20'
                                }`}
                              >
                                <Video className="size-3 shrink-0" />
                                VİD
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent side="top" variant="light" className="text-xs px-2 py-1 font-semibold rounded-md shadow-sm">
                              {item.youtube_embed 
                                ? 'Tanıtım Videosu Eklenmiş (Düzenlemek için tıklayın)' 
                                : 'Tanıtım Videosu Yok (Eklemek için tıklayın)'}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-2.5 px-4 align-middle">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/20 rounded-md">
                              <Badge
                                variant={
                                  item.status === 'published'
                                    ? 'success'
                                    : item.status === 'draft'
                                    ? 'warning'
                                    : 'secondary'
                                }
                                className="text-[9px] rounded-md h-5 font-bold uppercase tracking-wider pl-2 pr-1.5 cursor-pointer hover:opacity-90 active:scale-97 transition-all duration-100 flex items-center gap-1 select-none border border-current/10"
                              >
                                <span>{item.status === 'published' ? 'Aktif' : item.status === 'draft' ? 'Taslak' : 'Arşiv'}</span>
                                <ChevronDown className="size-2.5 opacity-80 shrink-0" />
                              </Badge>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="center" className="w-32 bg-card border border-border shadow-md">
                            <div className="p-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Durum Seç</div>
                            <DropdownMenuItem 
                              onClick={() => updateRaceMutation.mutate({ id: item.id, updatedFields: { status: 'published' }, currentRace: item })} 
                              className="gap-2 cursor-pointer text-xs font-semibold text-emerald-600 dark:text-emerald-400 focus:bg-emerald-500/10 focus:text-emerald-600 transition-colors duration-100"
                            >
                              Aktif (Publish)
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => updateRaceMutation.mutate({ id: item.id, updatedFields: { status: 'draft' }, currentRace: item })} 
                              className="gap-2 cursor-pointer text-xs font-semibold text-amber-600 focus:bg-amber-500/10 focus:text-amber-600 transition-colors duration-100"
                            >
                              Taslak (Draft)
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => updateRaceMutation.mutate({ id: item.id, updatedFields: { status: 'archived' }, currentRace: item })} 
                              className="gap-2 cursor-pointer text-xs font-semibold text-muted-foreground focus:bg-muted focus:text-foreground transition-colors duration-100"
                            >
                              Arşiv (Archive)
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>

                      {/* Redesigned Quick Actions permanently visible */}
                      <td className="py-2.5 px-4 align-middle text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                                onClick={() => handleEditClick(item)}
                              >
                                <Edit className="size-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent variant="light" className="text-xs px-2 py-1 font-semibold rounded-md shadow-sm">Düzenle</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                                onClick={() => {
                                  toast.success('Yarış kopyalandı.');
                                }}
                              >
                                <Copy className="size-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent variant="light" className="text-xs px-2 py-1 font-semibold rounded-md shadow-sm">Kopyala</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                                onClick={() => {
                                  toast.success(item.status === 'published' ? 'Yarış taslağa çekildi.' : 'Yarış yayınlandı.');
                                }}
                              >
                                {item.status === 'published' ? <FileText className="size-3.5" /> : <Globe className="size-3.5" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent variant="light" className="text-xs px-2 py-1 font-semibold rounded-md shadow-sm">
                              {item.status === 'published' ? 'Taslağa Çek' : 'Yayınla'}
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteClick(item.id)}
                              >
                                <Trash className="size-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent variant="light" className="text-xs px-2 py-1 font-semibold rounded-md shadow-sm">Sil</TooltipContent>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  </SortableItem>
                );
              })}
            </tbody>
          </table>
        </Sortable>
      )}

      {/* Race Add/Edit Dialog Sheet */}
      <RaceDialog
        open={dialogOpen}
        closeDialog={() => setDialogOpen(false)}
        race={selectedRace}
      />

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="bg-card border border-border p-6 rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Yarışı Silmek İstediğinize Emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Bu işlem geri alınamaz. Bu yarış kaydı, katılımcı başvuruları ve ödeme geçmişiyle ilişkili olabilir. Silmeden önce tüm detayları kontrol ettiğinizden emin olun.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel className="h-9 rounded-lg" disabled={deleteMutation.isPending}>Vazgeç</AlertDialogCancel>
            <Button
              variant="destructive"
              className="h-9 rounded-lg font-semibold text-xs"
              onClick={() => deleteMutation.mutate(idToDelete)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <LoaderCircleIcon className="size-4 animate-spin mr-1.5" />
              )}
              Yarışı Sil
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Dynamic Quick Media Editor Dialog */}
      <RaceMediaDialog
        open={mediaDialogOpen}
        onOpenChange={setMediaDialogOpen}
        race={mediaSelectedRace}
        defaultTab={mediaDefaultTab}
        onSave={async ({ id, updatedFields, currentRace }) => {
          await updateRaceMutation.mutateAsync({ id, updatedFields, currentRace });
        }}
      />

      {/* Child Races List Drawer */}
      <RightDrawer
        open={childRacesOpen}
        onOpenChange={setChildRacesOpen}
        title={selectedParentRace ? `${selectedParentRace.title?.tr} - Paket İçeriği` : "Paket İçeriğindeki Yarışlar"}
        size="lg"
      >
        {selectedParentRace && (
          <div className="space-y-6 py-4">
            <div className="p-4 rounded-xl border border-blue-500/10 bg-blue-500/5 text-xs text-blue-600 dark:text-blue-400 font-medium leading-relaxed">
              Bu paket yarış altında satışı ve kaydı gerçekleşen alt yarışlar aşağıda listelenmiştir. Detaylarını görüntülemek veya düzenlemek için ilgili alt yarışın üzerine tıklayabilirsiniz.
            </div>

            <div className="space-y-3">
              {(selectedParentRace.child_races || []).map((subRace) => {
                // Get sub-race dates
                const subDate = subRace.start_date 
                  ? new Date(subRace.start_date).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })
                  : '-';

                return (
                  <div
                    key={subRace.id}
                    onClick={() => {
                      setChildRacesOpen(false);
                      // Trigger opening the standard edit dialog for the subRace
                      handleEditClick(subRace);
                    }}
                    className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:bg-muted/30 cursor-pointer transition-all duration-150 group"
                  >
                    <div className="space-y-1 min-w-0">
                      <span className="text-xs font-bold text-foreground block group-hover:text-primary transition-colors truncate">
                        {subRace.title?.tr}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{subRace.distance ? `${subRace.distance} KM` : '-'}</span>
                        <span>•</span>
                        <span>{subDate} {subRace.start_time && `(${subRace.start_time})`}</span>
                        {subRace.price && (
                          <>
                            <span>•</span>
                            <span className="font-semibold text-foreground">{subRace.price} TL</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Status badge */}
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        subRace.status === 'published'
                          ? 'bg-emerald-500/5 text-emerald-600 border-emerald-500/10 dark:text-emerald-400'
                          : subRace.status === 'draft'
                          ? 'bg-amber-500/5 text-amber-600 border-amber-500/10 dark:text-amber-400'
                          : 'bg-muted/15 text-muted-foreground border-transparent'
                      }`}>
                        {subRace.status === 'published' ? 'Aktif' : subRace.status === 'draft' ? 'Taslak' : 'Arşiv'}
                      </span>
                      
                      {/* Chevron indicator */}
                      <ChevronRight className="size-4 text-muted-foreground/45 group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                );
              })}

              {(selectedParentRace.child_races || []).length === 0 && (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  Bu pakete tanımlanmış herhangi bir alt yarış bulunamadı.
                </div>
              )}
            </div>
          </div>
        )}
      </RightDrawer>
    </Container>
  );
}
