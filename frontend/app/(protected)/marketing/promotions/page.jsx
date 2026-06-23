'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Edit,
  Trash2,
  Plus,
  Search,
  X,
  Gift,
  Megaphone,
  LoaderCircleIcon,
  Inbox,
  Tv,
  MessageSquare,
  Sparkles
} from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';

// Components
import PromotionDialog from './components/promotion-dialog';

export default function PromotionsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState(null);

  // Fetch promotions
  const { data: response, isLoading } = useQuery({
    queryKey: ['admin-promotions'],
    queryFn: async () => {
      const res = await apiFetch('/api/admin/marketing/promotions?limit=100');
      if (!res.ok) throw new Error('Kampanyalar yüklenemedi.');
      return res.json();
    },
  });

  const promotionsList = response?.data || [];

  // Filter promotions locally based on search query
  const filteredPromotions = useMemo(() => {
    if (!searchQuery) return promotionsList;
    const query = searchQuery.toLowerCase();
    return promotionsList.filter(
      (item) =>
        item.name?.toLowerCase().includes(query) ||
        item.type?.toLowerCase().includes(query)
    );
  }, [promotionsList, searchQuery]);

  // Toggle Is Active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active, name, type, content, rules }) => {
      const res = await apiFetch(`/api/admin/marketing/promotions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          type,
          content,
          rules,
          is_active,
        }),
      });
      if (!res.ok) throw new Error('Kampanya durumu güncellenemedi.');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promotions'] });
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>Kampanya aktiflik durumu güncellendi.</AlertTitle>
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
            <AlertTitle>{err.message || 'Hata oluştu.'}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
    },
  });

  const handleToggleActive = (item, e) => {
    e.stopPropagation();
    toggleActiveMutation.mutate({
      id: item.id,
      name: item.name,
      type: item.type,
      content: item.content || {},
      rules: item.rules || {},
      is_active: !item.is_active,
    });
  };

  // Delete Promotion Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await apiFetch(`/api/admin/marketing/promotions/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Kampanya silinemedi.');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promotions'] });
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>Kampanya başarıyla silindi.</AlertTitle>
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

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (confirm('Bu kampanyayı kalıcı olarak silmek istediğinizden emin misiniz?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (item, e) => {
    e.stopPropagation();
    setSelectedPromotion(item);
    setDialogOpen(true);
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'banner':
        return (
          <Badge key={type} variant="mono" className="text-[10px] select-none h-5 px-2 font-semibold bg-primary/10 text-primary gap-1">
            <Tv className="size-3" />
            Görsel Banner
          </Badge>
        );
      case 'popup':
        return (
          <Badge key={type} variant="mono" className="text-[10px] select-none h-5 px-2 font-semibold bg-success/10 text-success gap-1">
            <Sparkles className="size-3" />
            Popup Modal
          </Badge>
        );
      case 'announcement':
        return (
          <Badge key={type} variant="mono" className="text-[10px] select-none h-5 px-2 font-semibold bg-info/10 text-info gap-1">
            <Megaphone className="size-3" />
            Duyuru Çubuğu
          </Badge>
        );
      default:
        return (
          <Badge key={type} variant="mono" className="text-[10px] select-none h-5 px-2 font-semibold">
            {type}
          </Badge>
        );
    }
  };

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>Kampanyalar Yönetimi (Promotions)</ToolbarTitle>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Kampanyalar</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
        </Toolbar>

        {/* Toolbar Filter / Create Actions */}
        <Card className="flex flex-col md:flex-row items-center gap-4 p-5 mb-6 select-none justify-between">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Kampanya adı ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-9 pe-9 h-10 w-full"
            />
            {searchQuery && (
              <Button
                mode="icon"
                variant="dim"
                onClick={() => setSearchQuery('')}
                className="absolute end-1.5 top-1/2 -translate-y-1/2 h-6 w-6"
              >
                <X className="size-3" />
              </Button>
            )}
          </div>

          <Button
            disabled={isLoading}
            onClick={() => {
              setSelectedPromotion(null);
              setDialogOpen(true);
            }}
            className="gap-1.5 shrink-0 w-full md:w-auto font-semibold"
          >
            <Plus className="size-4" />
            Yeni Kampanya Ekle
          </Button>
        </Card>

        {/* List Table */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2 select-none">
            <LoaderCircleIcon className="size-8 text-primary animate-spin" />
            <span className="text-xs text-muted-foreground">Kampanyalar listeleniyor...</span>
          </div>
        ) : (
          <Card>
            <CardTable>
              <ScrollArea>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/10 text-muted-foreground text-xs font-bold uppercase tracking-wider select-none">
                      <th className="py-3.5 px-5">Kampanya Adı</th>
                      <th className="py-3.5 px-4">Kampanya Türü</th>
                      <th className="py-3.5 px-4">Durum (Aktif)</th>
                      <th className="py-3.5 px-4">Zaman Kuralları</th>
                      <th className="py-3.5 px-4">Son Güncelleme</th>
                      <th className="py-3.5 px-5 text-right">Aksiyonlar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm">
                    {filteredPromotions.map((item) => (
                      <tr
                        key={item.id}
                        onClick={(e) => handleEdit(item, e)}
                        className="hover:bg-muted/10 cursor-pointer transition-colors group"
                      >
                        <td className="py-3.5 px-5 font-semibold text-foreground">
                          {item.name}
                        </td>
                        <td className="py-3.5 px-4">
                          {getTypeBadge(item.type)}
                        </td>
                        <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                          <Switch
                            id={`active-${item.id}`}
                            checked={!!item.is_active}
                            onCheckedChange={() => handleToggleActive(item)}
                            disabled={toggleActiveMutation.isPending}
                          />
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground text-xs font-mono">
                          {item.rules?.starts_at || item.rules?.expires_at ? (
                            <div className="flex flex-col gap-0.5">
                              {item.rules.starts_at && <span>Başlangıç: {new Date(item.rules.starts_at).toLocaleDateString('tr-TR')}</span>}
                              {item.rules.expires_at && <span>Bitiş: {new Date(item.rules.expires_at).toLocaleDateString('tr-TR')}</span>}
                            </div>
                          ) : (
                            'Her Zaman Aktif'
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground text-xs">
                          {item.updated_at ? new Date(item.updated_at).toLocaleDateString('tr-TR') : '-'}
                        </td>
                        <td className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                            <Button
                              mode="icon"
                              variant="dim"
                              onClick={(e) => handleEdit(item, e)}
                              className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                              title="Düzenle"
                            >
                              <Edit className="size-3.5" />
                            </Button>
                            <Button
                              mode="icon"
                              variant="dim"
                              onClick={(e) => handleDelete(item.id, e)}
                              className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              title="Sil"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </CardTable>

            {filteredPromotions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 border-t border-border bg-card rounded-b-xl select-none">
                <Inbox className="size-10 text-muted-foreground/60 mb-2.5" />
                <h3 className="font-semibold text-sm text-foreground">Kampanya bulunamadı</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Filtreleri veya arama kriterlerinizi değiştirebilirsiniz.
                </p>
              </div>
            )}
          </Card>
        )}
      </Container>

      {/* Promotion Dialog */}
      {dialogOpen && (
        <PromotionDialog
          open={dialogOpen}
          closeDialog={() => {
            setDialogOpen(false);
            setSelectedPromotion(null);
          }}
          promotion={selectedPromotion}
        />
      )}
    </>
  );
}
