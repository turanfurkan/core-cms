'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Edit,
  Trash,
  Plus,
  Search,
  LoaderCircleIcon,
  Globe,
  ListFilter,
  MoreVertical,
  ExternalLink,
  Award
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
import { toast } from 'sonner';
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
import PartnerDialog from './components/partner-dialog';

export default function PartnersPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState(null);

  // Filters & Sorting
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');

  // Fetch partner categories
  const { data: categories } = useQuery({
    queryKey: ['admin-categories-partner-list'],
    queryFn: async () => {
      const res = await apiFetch('/api/admin/categories?type=partner');
      if (!res.ok) throw new Error('Failed to fetch partner categories');
      const json = await res.json();
      return json.data || [];
    },
  });

  // Fetch partners list
  const { data: partners, isLoading } = useQuery({
    queryKey: ['admin-partners', selectedCategoryFilter, selectedStatusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategoryFilter !== 'all') {
        params.append('category_id', selectedCategoryFilter);
      }
      if (selectedStatusFilter !== 'all') {
        params.append('status', selectedStatusFilter);
      }
      const res = await apiFetch(`/api/admin/partners?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch partners');
      const json = await res.json();
      return json.data || [];
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await apiFetch(`/api/admin/partners/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Silme işlemi başarısız.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-partners'] });
      toast.success('Sponsor başarıyla silindi.');
      setDeleteConfirmOpen(false);
      setIdToDelete(null);
    },
    onError: (err) => {
      toast.error(err.message || 'Bir hata oluştu.');
    },
  });

  const handleDeleteClick = (id) => {
    setIdToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleEditClick = (partner) => {
    setSelectedPartner(partner);
    setDialogOpen(true);
  };

  const handleCreateClick = () => {
    setSelectedPartner(null);
    setDialogOpen(true);
  };

  // Client-side search filtering
  const filteredPartners = useMemo(() => {
    if (!partners) return [];
    let list = [...partners];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      list = list.filter((p) => {
        const nameTr = p.name?.tr || '';
        const nameEn = p.name?.en || '';
        return nameTr.toLowerCase().includes(query) || nameEn.toLowerCase().includes(query);
      });
    }

    return list;
  }, [partners, searchQuery]);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000';

  return (
    <Container className="space-y-6 select-none max-w-7xl mx-auto py-8">
      {/* Breadcrumb Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/content-management/pages">İçerik Yönetimi</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Sponsorlar & Partnerler</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Sponsorlar & Partnerler</h1>
        </div>

        <Button
          onClick={handleCreateClick}
          size="sm"
          className="gap-1.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/95 transition-all shadow-xs shrink-0 self-start sm:self-auto"
        >
          <Plus className="size-4" /> Yeni Sponsor Ekle
        </Button>
      </div>

      {/* Filters Strip */}
      <Card className="border border-border/60 p-4 bg-card shadow-xs rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Search Box */}
          <div className="relative flex-grow max-w-md">
            <Search className="size-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Sponsorlarda ara..."
              className="h-10 pl-9 text-xs bg-muted/20 border-border/80 focus:border-primary rounded-xl"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 ml-auto">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5">
              <ListFilter className="size-3.5 text-muted-foreground" />
              <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
                <SelectTrigger className="h-9 text-xs bg-card border-border/80 w-44 rounded-lg">
                  <SelectValue placeholder="Kategori Filtrele" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">Tüm Kategoriler</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name?.tr || cat.name?.en || 'Kategori'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <Select value={selectedStatusFilter} onValueChange={setSelectedStatusFilter}>
              <SelectTrigger className="h-9 text-xs bg-card border-border/80 w-36 rounded-lg">
                <SelectValue placeholder="Durum Seçin" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="published">🟢 Yayında</SelectItem>
                <SelectItem value="draft">⚪ Taslak</SelectItem>
                <SelectItem value="archived">🔴 Arşivlendi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Grid of Partners */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <LoaderCircleIcon className="size-8 animate-spin text-primary" />
        </div>
      ) : filteredPartners.length === 0 ? (
        <Card className="border border-dashed border-border/80 p-12 text-center rounded-2xl">
          <Award className="size-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
          <h3 className="text-sm font-bold text-foreground">Sponsor Bulunamadı</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Arama ve filtre kriterlerine uygun sponsor bulunmamaktadır veya henüz sponsor kaydı girilmemiştir.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredPartners.map((p) => {
            const logoPath = p.logo?.url || '';
            const logoUrl = logoPath
              ? (logoPath.startsWith('http') ? logoPath : `${backendUrl}${logoPath}`)
              : null;

            return (
              <Card
                key={p.id}
                className="border border-border/60 hover:border-primary/30 p-5 rounded-2xl flex flex-col justify-between bg-card hover:shadow-md transition-all duration-300 relative group"
              >
                {/* Status Indicator */}
                <span className="absolute top-4 right-4">
                  {p.status === 'published' ? (
                    <Badge variant="outline" className="text-[10px] py-0 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Yayında</Badge>
                  ) : p.status === 'draft' ? (
                    <Badge variant="outline" className="text-[10px] py-0 bg-zinc-500/10 text-zinc-500 border-zinc-500/20">Taslak</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] py-0 bg-red-500/10 text-red-600 border-red-500/20">Arşiv</Badge>
                  )}
                </span>

                {/* Logo & Name */}
                <div className="space-y-4 flex-grow flex flex-col items-center justify-center py-4">
                  <div className="h-20 w-36 bg-zinc-50 dark:bg-zinc-900/50 border border-border/40 rounded-xl p-3 flex items-center justify-center">
                    {logoUrl ? (
                      <img src={logoUrl} alt={p.name?.tr} className="max-h-full max-w-full object-contain" />
                    ) : (
                      <Award className="size-8 text-zinc-300 dark:text-zinc-700" />
                    )}
                  </div>
                  <div className="text-center space-y-1">
                    <h3 className="text-xs font-black text-foreground truncate max-w-[200px]" title={p.name?.tr}>
                      {p.name?.tr}
                    </h3>
                    {p.name?.en && (
                      <p className="text-[10px] text-muted-foreground truncate max-w-[200px] flex items-center justify-center gap-1">
                        <Globe className="size-2.5" />
                        {p.name.en}
                      </p>
                    )}
                  </div>
                </div>

                {/* Categories & Actions Row */}
                <div className="border-t border-border/40 pt-3 mt-3 flex items-center justify-between">
                  {/* Category badging */}
                  <div className="flex flex-wrap gap-1 items-center max-w-[70%]">
                    {Array.isArray(p.categories) && p.categories.slice(0, 2).map((cat) => (
                      <Badge key={cat.id} variant="outline" className="text-[9px] px-1.5 py-0 border-border bg-muted/20">
                        {cat.name?.tr || cat.name?.en}
                      </Badge>
                    ))}
                    {Array.isArray(p.categories) && p.categories.length > 2 && (
                      <span className="text-[9px] text-muted-foreground font-medium">+{p.categories.length - 2}</span>
                    )}
                  </div>

                  {/* Actions Dropdown */}
                  <div className="flex items-center gap-1.5">
                    {p.link && (
                      <a href={p.link} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg border border-border bg-muted/20 hover:bg-muted text-muted-foreground transition-colors">
                        <ExternalLink className="size-3.5" />
                      </a>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg">
                          <MoreVertical className="size-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-card border-border">
                        <DropdownMenuItem onClick={() => handleEditClick(p)} className="text-xs font-semibold cursor-pointer gap-2">
                          <Edit className="size-3.5 text-zinc-500" /> Düzenle
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteClick(p.id)} className="text-xs font-semibold cursor-pointer gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20">
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

      {/* Dialogs */}
      <PartnerDialog open={dialogOpen} closeDialog={() => setDialogOpen(false)} partner={selectedPartner} />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="bg-card border-border rounded-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-bold text-foreground">Sponsoru Sil?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Bu sponsor kaydı kalıcı olarak silinecektir. Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2.5">
            <AlertDialogCancel className="text-xs rounded-xl">İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(idToDelete)}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Container>
  );
}
