'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Edit,
  Trash,
  Plus,
  Search,
  Folder,
  GripVertical,
  Globe,
  ListFilter,
  Eye,
  EyeOff,
  MoreVertical,
  Copy,
  CheckSquare,
  Square,
  Check,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  TrendingUp,
  AlertCircle,
  LoaderCircleIcon,
  ArrowUpRight,
  Layers,
  ChevronDown
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
import { Sortable, SortableItem, SortableItemHandle } from '@/components/ui/sortable';
import { arrayMove } from '@dnd-kit/sortable';
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
import CategoryDialog from './components/category-dialog';

const CATEGORY_TYPES_MAP = {
  race: { label: 'Yarışlar', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  blog: { label: 'Yazılar', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  portfolio: { label: 'Projeler', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
  service: { label: 'Hizmetler', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  partner: { label: 'Sponsorlar', color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' },
  general: { label: 'Genel', color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' },
};

export default function CategoriesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState(null);

  // Advanced filters and sorting states
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [selectedYearFilter, setSelectedYearFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');

  // Bulk actions states
  const [selectedIds, setSelectedIds] = useState([]);

  // Pagination states
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Reference for search input autofocus
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Fetch all categories
  const { data: categoriesList, isLoading } = useQuery({
    queryKey: ['admin-categories-all'],
    queryFn: async () => {
      const res = await apiFetch('/api/admin/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      const json = await res.json();
      return json.data || [];
    },
  });

  // Calculate statistics with parent/child groups
  const stats = useMemo(() => {
    if (!categoriesList) return { total: 0, active: 0, inactive: 0, parent: 0, child: 0, activePercentage: 0 };
    const total = categoriesList.length;
    const active = categoriesList.filter((c) => c.is_active).length;
    const inactive = total - active;
    const parent = categoriesList.filter((c) => !c.parent_id).length;
    const child = total - parent;
    const activePercentage = total > 0 ? Math.round((active / total) * 100) : 0;
    return { total, active, inactive, parent, child, activePercentage };
  }, [categoriesList]);

  // Extract unique years from category TR names dynamically
  const availableYears = useMemo(() => {
    if (!categoriesList) return [];
    const yearsSet = new Set();
    categoriesList.forEach((c) => {
      const trName = c.name?.tr || '';
      const match = trName.match(/\b(20\d{2})\b/);
      if (match) {
        yearsSet.add(match[1]);
      }
    });
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [categoriesList]);

  // Reset pagination when page size or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedTypeFilter, selectedStatusFilter, selectedYearFilter, pageSize]);

  // Combined local search, filter, and sorting logic
  const filteredAndSortedData = useMemo(() => {
    if (!categoriesList) return [];

    let result = categoriesList;

    // 1. Filter by Type
    if (selectedTypeFilter !== 'all') {
      result = result.filter((c) => c.type === selectedTypeFilter);
    }

    // 2. Filter by Status
    if (selectedStatusFilter !== 'all') {
      const isActiveValue = selectedStatusFilter === 'active';
      result = result.filter((c) => c.is_active === isActiveValue);
    }

    // 3. Filter by Year
    if (selectedYearFilter !== 'all') {
      result = result.filter((c) => {
        const trName = c.name?.tr || '';
        return trName.includes(selectedYearFilter);
      });
    }

    // 4. Filter by Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name?.tr?.toLowerCase().includes(q) ||
          c.name?.en?.toLowerCase().includes(q) ||
          c.slug?.tr?.toLowerCase().includes(q) ||
          c.slug?.en?.toLowerCase().includes(q) ||
          c.description?.tr?.toLowerCase().includes(q) ||
          c.description?.en?.toLowerCase().includes(q)
      );
    }

    // 5. Sort Data
    return [...result].sort((a, b) => {
      if (sortBy === 'custom') {
        return (a.order || 0) - (b.order || 0) || a.id - b.id;
      } else if (sortBy === 'alphabetical') {
        const nameA = a.name?.tr || '';
        const nameB = b.name?.tr || '';
        return nameA.localeCompare(nameB, 'tr');
      } else {
        // created_at DESC with virtual year override alignment
        const getVirtualDate = (item) => {
          if (!item.created_at) return new Date(0);
          const today = new Date();
          const dateObj = new Date(item.created_at);
          dateObj.setMonth(today.getMonth());
          dateObj.setDate(today.getDate());
          const yearMatch = item.name?.tr?.match(/\b(20\d{2})\b/);
          if (yearMatch) {
            dateObj.setFullYear(parseInt(yearMatch[1], 10));
          }
          return dateObj;
        };
        return getVirtualDate(b) - getVirtualDate(a);
      }
    });
  }, [categoriesList, selectedTypeFilter, selectedStatusFilter, selectedYearFilter, searchQuery, sortBy]);

  // Paginated Sliced Data (Disabled pagination when drag sorting to enable full reordering)
  const paginatedData = useMemo(() => {
    if (sortBy === 'custom') {
      return filteredAndSortedData;
    }
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedData.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedData, currentPage, pageSize, sortBy]);

  const totalPages = Math.ceil(filteredAndSortedData.length / pageSize);

  // Bulk select toggles
  const handleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllToggle = () => {
    if (selectedIds.length === filteredAndSortedData.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAndSortedData.map((c) => c.id));
    }
  };

  // Delete Category Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await apiFetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete category');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin-categories-all'] });
      setDeleteConfirmOpen(false);
      setIdToDelete(null);
      setSelectedIds((prev) => prev.filter((id) => id !== idToDelete));
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>Kategori başarıyla silindi.</AlertTitle>
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
            <AlertTitle>{err.message || 'Kategori silinemedi.'}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
    },
  });

  // Reorder Categories Mutation
  const reorderMutation = useMutation({
    mutationFn: async (orderedIds) => {
      const res = await apiFetch('/api/admin/categories/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: orderedIds }),
      });
      if (!res.ok) throw new Error('Failed to reorder categories');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories-all'] });
      toast.success('Kategori sıralaması güncellendi.');
    },
    onError: (err) => {
      toast.error(err.message || 'Kategoriler sıralanamadı.');
    },
  });

  // Duplicate Category Mutation
  const duplicateMutation = useMutation({
    mutationFn: async (cat) => {
      const payload = {
        name: {
          tr: `${cat.name?.tr || ''} (Klon)`,
          en: cat.name?.en ? `${cat.name.en} (Copy)` : '',
        },
        slug: {
          tr: `${cat.slug?.tr || ''}-klon`,
          en: cat.slug?.en ? `${cat.slug.en}-copy` : '',
        },
        description: cat.description,
        image_id: cat.image_id,
        parent_id: cat.parent_id,
        type: cat.type,
        is_active: cat.is_active,
      };

      const res = await apiFetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Kategori klonlanamadı.');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories-all'] });
      toast.success('Kategori başarıyla klonlandı.');
    },
    onError: (err) => {
      toast.error(err.message || 'Kategori kopyalanamadı.');
    },
  });

  // Generic Update Category Mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, updatedFields, currentCategory }) => {
      const payload = {
        name: currentCategory.name,
        slug: currentCategory.slug,
        description: currentCategory.description,
        image_id: currentCategory.image_id,
        parent_id: currentCategory.parent_id,
        type: currentCategory.type,
        is_active: currentCategory.is_active,
        ...updatedFields,
      };

      const res = await apiFetch(`/api/admin/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Failed to update category');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin-categories-all'] });
      toast.success('Kategori durumu güncellendi.');
    },
    onError: (err) => {
      toast.error(err.message || 'Kategori durumu güncellenemedi.');
    },
  });

  // Bulk Status Update Mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, is_active }) => {
      const promises = ids.map((id) => {
        const cat = categoriesList.find((c) => c.id === id);
        if (!cat) return Promise.resolve();
        const payload = {
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          image_id: cat.image_id,
          parent_id: cat.parent_id,
          type: cat.type,
          is_active: is_active,
        };
        return apiFetch(`/api/admin/categories/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      });
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories-all'] });
      setSelectedIds([]);
      toast.success('Seçilen kategorilerin durumları güncellendi.');
    },
    onError: (err) => {
      toast.error(err.message || 'Toplu durum güncellemesi başarısız.');
    },
  });

  // Bulk Delete Mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids) => {
      const promises = ids.map((id) =>
        apiFetch(`/api/admin/categories/${id}`, {
          method: 'DELETE',
        })
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories-all'] });
      setSelectedIds([]);
      toast.success('Seçilen kategoriler silindi.');
    },
    onError: (err) => {
      toast.error(err.message || 'Toplu silme işlemi başarısız.');
    },
  });

  const handleBulkExport = () => {
    const selectedCategories = categoriesList.filter((c) => selectedIds.includes(c.id));
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(selectedCategories, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `kategoriler_export_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('Seçilen kategoriler JSON olarak dışa aktarıldı.');
  };

  const handleMove = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = filteredAndSortedData.findIndex((item) => item.id === active.id);
    const newIndex = filteredAndSortedData.findIndex((item) => item.id === over.id);

    const reorderedData = arrayMove(filteredAndSortedData, oldIndex, newIndex);
    queryClient.setQueryData(['admin-categories-all'], reorderedData);

    const orderedIds = reorderedData.map((item) => item.id);
    reorderMutation.mutate(orderedIds);
  };

  const handleEditClick = (cat) => {
    setSelectedCategory(cat);
    setDialogOpen(true);
  };

  const handleCreateClick = () => {
    setSelectedCategory(null);
    setDialogOpen(true);
  };

  const handleDeleteClick = (id) => {
    setIdToDelete(id);
    setDeleteConfirmOpen(true);
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
            <BreadcrumbPage>Kategoriler</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header Toolbar matching Races layout */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Kategoriler</h1>
          <p className="text-xs md:text-sm text-muted-foreground/80 mt-1">
            Tüm kategorileri buradan yönetebilir, filtreleyebilir, sıralayabilir ve düzenleyebilirsiniz.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleCreateClick} className="gap-1.5 h-9 rounded-lg shadow-xs font-semibold text-xs transition-all duration-150 select-none">
            <Plus className="size-4" /> Yeni Kategori Ekle
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-9 w-9 p-0 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors duration-150 flex items-center justify-center">
                <MoreVertical className="size-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-42 bg-card border border-border shadow-md">
              <DropdownMenuItem onClick={handleBulkExport} className="gap-2 cursor-pointer text-xs font-semibold">
                <Globe className="size-3.5 text-muted-foreground" /> Toplu Dışa Aktar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Redesigned Summary Cards matching Races page structure */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Toplam Kategori */}
        <Card className="p-3 border border-border/80 bg-card shadow-xs flex flex-col justify-between hover:shadow-sm hover:border-border transition-all duration-150 h-[80px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider block">Toplam Kategori</span>
            <div className="size-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Folder className="size-3.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-semibold tracking-tight text-foreground leading-none">{stats.total}</span>
            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <ArrowUpRight className="size-2.5" /> +3 yeni
            </span>
          </div>
        </Card>

        {/* Card 2: Aktif Kategoriler */}
        <Card className="p-3 border border-border/80 bg-card shadow-xs flex flex-col justify-between hover:shadow-sm hover:border-border transition-all duration-150 h-[80px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider block">Aktif Kategoriler</span>
            <div className="size-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
              <Eye className="size-3.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-semibold tracking-tight text-foreground leading-none">{stats.active}</span>
            <span className="text-[9px] font-medium text-muted-foreground">%{stats.activePercentage} yayında</span>
          </div>
        </Card>

        {/* Card 3: Üst Kategoriler */}
        <Card className="p-3 border border-border/80 bg-card shadow-xs flex flex-col justify-between hover:shadow-sm hover:border-border transition-all duration-150 h-[80px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider block">Üst Kategoriler</span>
            <div className="size-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
              <Layers className="size-3.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-semibold tracking-tight text-foreground leading-none">{stats.parent}</span>
            <span className="text-[9px] font-medium text-blue-600 dark:text-blue-400">Ana gruplar</span>
          </div>
        </Card>

        {/* Card 4: Alt Kategoriler */}
        <Card className="p-3 border border-border/80 bg-card shadow-xs flex flex-col justify-between hover:shadow-sm hover:border-border transition-all duration-150 h-[80px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider block">Alt Kategoriler</span>
            <div className="size-6 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
              <AlertCircle className="size-3.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-semibold tracking-tight text-foreground leading-none">{stats.child}</span>
            <span className="text-[9px] font-medium text-amber-600">Alt kırılımlar</span>
          </div>
        </Card>
      </div>

      {/* Advanced Filters and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-muted/10 p-3.5 rounded-xl border border-border/80">
        <div className="flex-1 min-w-0">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Kategori ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 rounded-lg bg-card border border-border/80 shadow-sm focus-visible:ring-1 text-xs"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <Select value={selectedStatusFilter} onValueChange={setSelectedStatusFilter}>
            <SelectTrigger className="h-9 text-xs bg-card border-border/80 w-32 rounded-lg">
              <span className="text-muted-foreground mr-1">Durum:</span>
              <SelectValue placeholder="Tümü" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="active">🟢 Aktif</SelectItem>
              <SelectItem value="passive">⚪ Pasif</SelectItem>
            </SelectContent>
          </Select>

          {/* Type Filter */}
          <Select value={selectedTypeFilter} onValueChange={setSelectedTypeFilter}>
            <SelectTrigger className="h-9 text-xs bg-card border-border/80 w-40 rounded-lg">
              <span className="text-muted-foreground mr-1">Tür:</span>
              <SelectValue placeholder="Tümü" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="race">Yarışlar</SelectItem>
              <SelectItem value="blog">Yazılar</SelectItem>
              <SelectItem value="portfolio">Projeler</SelectItem>
              <SelectItem value="service">Hizmetler</SelectItem>
              <SelectItem value="partner">Sponsorlar</SelectItem>
              <SelectItem value="general">Genel</SelectItem>
            </SelectContent>
          </Select>

          {/* Year Filter */}
          <Select value={selectedYearFilter} onValueChange={setSelectedYearFilter}>
            <SelectTrigger className="h-9 text-xs bg-card border-border/80 w-28 rounded-lg">
              <span className="text-muted-foreground mr-1">Yıl:</span>
              <SelectValue placeholder="Tümü" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">Tümü</SelectItem>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort Option */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-9 text-xs bg-card border-border/80 w-44 rounded-lg">
              <span className="text-muted-foreground mr-1">Sıralama:</span>
              <SelectValue placeholder="Sıralama" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="custom">Sürükle-Bırak</SelectItem>
              <SelectItem value="alphabetical">Alfabetik (A-Z)</SelectItem>
              <SelectItem value="created_at">Oluşturulma Tarihi</SelectItem>
            </SelectContent>
          </Select>

          {/* Reset Filters */}
          {(selectedStatusFilter !== 'all' || selectedTypeFilter !== 'all' || selectedYearFilter !== 'all' || searchQuery !== '') && (
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedStatusFilter('all');
                setSelectedTypeFilter('all');
                setSelectedYearFilter('all');
                setSearchQuery('');
              }}
              className="h-9 text-xs hover:bg-muted text-muted-foreground hover:text-foreground px-3 rounded-lg border border-dashed border-border"
            >
              Filtreleri Temizle
            </Button>
          )}
        </div>
      </div>

      {/* Main Categories Table/List View */}
      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <LoaderCircleIcon className="size-8 text-primary animate-spin" />
        </div>
      ) : filteredAndSortedData.length === 0 ? (
        <Card className="h-64 flex flex-col items-center justify-center p-8 text-center border-dashed border-border bg-card rounded-2xl">
          <Folder className="size-10 text-muted-foreground/60 mb-3" />
          <h3 className="font-bold text-base text-foreground mb-1">Kategori Bulunamadı</h3>
          <p className="text-xs text-muted-foreground max-w-sm mb-4">
            Kriterlere uygun kategori bulunmuyor. Yeni bir kategori ekleyerek başlayabilirsiniz.
          </p>
          <Button onClick={handleCreateClick} className="h-9 gap-1.5 rounded-lg">
            <Plus className="size-4" /> Yeni Kategori Ekle
          </Button>
        </Card>
      ) : (
        <div className="space-y-0.5">
          {/* Table Header Row */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/40 border border-border/80 rounded-t-xl select-none items-center">
            <div className="col-span-4 flex items-center gap-3">
              <button
                type="button"
                onClick={handleSelectAllToggle}
                className="size-4 rounded border border-border hover:border-primary flex items-center justify-center bg-card text-primary shrink-0 transition-colors"
              >
                {selectedIds.length === filteredAndSortedData.length && filteredAndSortedData.length > 0 ? (
                  <CheckSquare className="size-3.5" />
                ) : selectedIds.length > 0 ? (
                  <Square className="size-3.5 fill-muted-foreground/30 text-muted-foreground" />
                ) : (
                  <Square className="size-3.5 text-muted-foreground/40" />
                )}
              </button>
              <span>Kategori Adı / Kod</span>
            </div>
            <div className="col-span-2">Tür</div>
            <div className="col-span-1 text-center">Yıl</div>
            <div className="col-span-1.5">Durum</div>
            <div className="col-span-1.5">Oluşturulma Tarihi</div>
            <div className="col-span-1 text-center">İçerik</div>
            <div className="col-span-1 text-right pr-2">İşlem</div>
          </div>

          {/* Sortable List of Items */}
          <Sortable
            value={paginatedData}
            getItemValue={(item) => item.id}
            onMove={handleMove}
            strategy="vertical"
            className="border-x border-b border-border/80 rounded-b-xl overflow-hidden divide-y divide-border/60"
          >
            {paginatedData.map((item) => {
              const typeInfo = CATEGORY_TYPES_MAP[item.type] || CATEGORY_TYPES_MAP.general;
              const isSelected = selectedIds.includes(item.id);

              // Extract year dynamically
              const yearMatch = item.name?.tr?.match(/\b(20\d{2})\b/);
              const year = yearMatch ? yearMatch[1] : '-';

              // Format creation time
              let createdDate = '-';
              if (item.created_at) {
                const today = new Date();
                const dateObj = new Date(item.created_at);
                dateObj.setMonth(today.getMonth());
                dateObj.setDate(today.getDate());
                if (year !== '-') {
                  dateObj.setFullYear(parseInt(year, 10));
                }
                createdDate = dateObj.toLocaleDateString('tr-TR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });
              }

              // Real content count from API
              const contentCount = item.type === 'race' ? (item.races_count || 0) : 0;

              // SEO verification condition
              const isSeoReady = !!(item.slug?.tr && item.description?.tr && item.description.tr.length > 20);

              return (
                <SortableItem key={item.id} value={item.id} disabled={sortBy !== 'custom'} className="data-[disabled=true]:opacity-100" asChild>
                  <div className={`grid grid-cols-12 gap-4 items-center px-4 py-3 bg-card hover:bg-muted/15 transition-colors group h-[64px] min-w-0 ${isSelected ? 'bg-primary/5 hover:bg-primary/5' : ''}`}>
                    
                    {/* Col 1: Select Box + Drag Handle + Title & Translations */}
                    <div className="col-span-4 flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleSelectRow(item.id)}
                        className={`size-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-border hover:border-primary bg-card text-primary'
                        }`}
                      >
                        {isSelected && <Check className="size-3 stroke-[3]" />}
                      </button>

                      {sortBy === 'custom' && (
                        <SortableItemHandle asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground/35 hover:text-foreground cursor-grab active:cursor-grabbing shrink-0"
                            type="button"
                          >
                            <GripVertical className="size-4" />
                          </Button>
                        </SortableItemHandle>
                      )}

                      <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Folder className="size-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-foreground truncate block">
                            {item.name?.tr || '-'}
                          </span>
                          {item.name?.en && item.name.en !== item.name.tr && (
                            <span className="text-[9px] text-muted-foreground font-semibold flex items-center gap-0.5 shrink-0">
                              <Globe className="size-2.5" /> {item.name.en}
                            </span>
                          )}
                        </div>
                        {item.parent_id ? (
                          <div className="text-[10px] text-muted-foreground truncate">
                            Üst Kategori: <span className="font-semibold text-foreground/80">{categoriesList.find((c) => c.id === item.parent_id)?.name?.tr || 'Yükleniyor'}</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-muted-foreground truncate">
                            /{item.slug?.tr || ''}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Col 2: Category Type */}
                    <div className="col-span-2 min-w-0">
                      <Badge variant="outline" className={`h-5 text-[9px] rounded font-bold uppercase tracking-wider px-2 ${typeInfo.color} border`}>
                        {typeInfo.label}
                      </Badge>
                    </div>

                    {/* Col 3: Dynamic Year */}
                    <div className="col-span-1 text-center font-semibold text-xs text-foreground/85">
                      {year}
                    </div>

                    {/* Col 4: Status Badge (🟢 Aktif / ⚪ Pasif) with Dropdown Toggle */}
                    <div className="col-span-1.5 flex items-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/20 rounded-full">
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1.5 cursor-pointer hover:opacity-90 active:scale-97 transition-all duration-100 select-none ${
                              item.is_active
                                ? 'bg-emerald-500/5 text-emerald-600 border-emerald-500/10 dark:text-emerald-400'
                                : 'bg-muted/15 text-muted-foreground border-transparent'
                            }`}>
                              <span className={`size-1.5 rounded-full ${item.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/60'}`} />
                              <span>{item.is_active ? 'Aktif' : 'Pasif'}</span>
                              <ChevronDown className="size-2.5 opacity-80 shrink-0" />
                            </span>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="center" className="w-32 bg-card border border-border shadow-md">
                          <div className="p-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Durum Seç</div>
                          <DropdownMenuItem 
                            onClick={() => updateCategoryMutation.mutate({ id: item.id, updatedFields: { is_active: true }, currentCategory: item })} 
                            className="gap-2 cursor-pointer text-xs font-semibold text-emerald-600 dark:text-emerald-400 focus:bg-emerald-500/10 focus:text-emerald-600 transition-colors duration-100"
                          >
                            Aktif
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => updateCategoryMutation.mutate({ id: item.id, updatedFields: { is_active: false }, currentCategory: item })} 
                            className="gap-2 cursor-pointer text-xs font-semibold text-muted-foreground focus:bg-muted focus:text-foreground transition-colors duration-100"
                          >
                            Pasif
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Col 5: Creation Date */}
                    <div className="col-span-1.5 text-xs text-muted-foreground/85 font-medium">
                      {createdDate}
                    </div>

                    {/* Col 6: Item Count */}
                    <div className="col-span-1 text-center text-xs font-bold">
                      {(() => {
                        let linkHref = null;
                        if (item.type === 'race') {
                          linkHref = `/admin/races?category_id=${item.id}`;
                        } else if (item.type === 'blog') {
                          linkHref = `/content-management/content-entries?type=blog`;
                        } else if (item.type === 'portfolio') {
                          linkHref = `/content-management/content-entries?type=projects`;
                        } else if (item.type === 'service') {
                          linkHref = `/content-management/content-entries?type=services`;
                        }

                        if (linkHref) {
                          return (
                            <Link
                              href={linkHref}
                              className="inline-flex items-center justify-center min-w-7 h-6 px-2 rounded-md bg-primary/5 border border-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors font-bold select-none cursor-pointer"
                              title="İlgili İçerikleri Listele"
                            >
                              {contentCount}
                            </Link>
                          );
                        }
                        return <span className="text-muted-foreground/60">{contentCount}</span>;
                      })()}
                    </div>

                    {/* Actions direct inline buttons */}
                    <div className="col-span-1 flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditClick(item)}
                        className="size-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted select-none"
                        title="Düzenle"
                      >
                        <Edit className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => duplicateMutation.mutate(item)}
                        className="size-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted select-none"
                        title="Kopyala (Klonla)"
                      >
                        <Copy className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(item.id)}
                        className="size-7 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10 select-none"
                        title="Sil"
                      >
                        <Trash className="size-3.5" />
                      </Button>
                    </div>

                  </div>
                </SortableItem>
              );
            })}
          </Sortable>
        </div>
      )}

      {/* Pagination Footer */}
      {sortBy !== 'custom' && filteredAndSortedData.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-muted/5 border border-t-0 border-border/80 rounded-b-xl text-xs">
          <div className="flex items-center gap-4 text-muted-foreground">
            <span>
              Toplam <strong>{filteredAndSortedData.length}</strong> kayıt arasından{' '}
              <strong>{(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredAndSortedData.length)}</strong> arası gösteriliyor.
            </span>
            <div className="flex items-center gap-2">
              <span>Sayfa Başına:</span>
              <Select value={String(pageSize)} onValueChange={(val) => {
                setPageSize(Number(val));
                setCurrentPage(1);
              }}>
                <SelectTrigger className="h-7 w-16 bg-card border-border/85 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-8 rounded-lg"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8 rounded-lg"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="px-3 text-muted-foreground">
              Sayfa <strong>{currentPage}</strong> / {totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="size-8 rounded-lg"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <ChevronRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8 rounded-lg"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <ChevronsRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Sticky Bottom Bulk Actions Panel */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-slate-50 dark:bg-slate-100 dark:text-slate-900 border border-slate-800 dark:border-slate-200 px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom duration-200">
          <span className="text-xs font-bold tracking-tight">
            {selectedIds.length} Kategori Seçildi
          </span>
          <div className="h-4 w-px bg-slate-700 dark:bg-slate-300" />
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => bulkUpdateMutation.mutate({ ids: selectedIds, is_active: true })}
              className="text-xs font-bold text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 h-8 px-3 rounded-lg"
            >
              Aktifleştir
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => bulkUpdateMutation.mutate({ ids: selectedIds, is_active: false })}
              className="text-xs font-bold text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 h-8 px-3 rounded-lg"
            >
              Pasifleştir
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBulkExport}
              className="text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-200 h-8 px-3 rounded-lg"
            >
              Dışa Aktar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (window.confirm('Seçilen tüm kategorileri silmek istediğinize emin misiniz?')) {
                  bulkDeleteMutation.mutate(selectedIds);
                }
              }}
              className="text-xs font-bold text-red-500 hover:bg-red-500/10 h-8 px-3 rounded-lg"
            >
              Sil
            </Button>
          </div>
        </div>
      )}

      {/* Category Add/Edit Dialog Sheet */}
      <CategoryDialog
        open={dialogOpen}
        closeDialog={() => setDialogOpen(false)}
        category={selectedCategory}
      />

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="bg-card border border-border p-6 rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Kategoriyi Silmek İstediğinize Emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Bu işlem geri alınamaz. Eğer bu kategoriye bağlı alt kategoriler veya içerikler (yarışlar, bloglar) varsa, bu ilişkiler silinebilir veya etkilenebilir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel className="h-9 rounded-lg">Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              className="h-9 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg"
              onClick={() => deleteMutation.mutate(idToDelete)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <LoaderCircleIcon className="size-4 animate-spin mr-1.5" />
              )}
              Kategoriyi Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Container>
  );
}
