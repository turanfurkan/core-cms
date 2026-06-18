'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Edit,
  Trash2,
  Plus,
  Search,
  X,
  Users,
  LoaderCircleIcon,
  Inbox,
  Filter
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';

// Components
import SubscriberDialog from './components/subscriber-dialog';

export default function SubscribersPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSubscriber, setSelectedSubscriber] = useState(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const limit = 15;

  // Fetch subscribers from backend
  const { data: response, isLoading } = useQuery({
    queryKey: ['admin-subscribers', page, searchQuery, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(limit));
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      const res = await apiFetch(`/api/admin/communication/subscribers?${params.toString()}`);
      if (!res.ok) throw new Error('Aboneler yüklenemedi.');
      return res.json();
    },
  });

  const subscribersList = response?.data || [];
  const meta = response?.meta || {};
  const totalPages = meta.last_page || 1;

  // Delete Subscriber Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await apiFetch(`/api/admin/communication/subscribers/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Abone silinemedi.');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscribers'] });
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>Abone kaydı başarıyla silindi.</AlertTitle>
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
    if (confirm('Bu aboneyi bülten listesinden kalıcı olarak silmek istediğinizden emin misiniz?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (item, e) => {
    e.stopPropagation();
    setSelectedSubscriber(item);
    setDialogOpen(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <Badge key={status} variant="mono" className="text-[10px] select-none h-5 px-2 font-semibold bg-success/10 text-success border-success/20">
            Aktif Abone
          </Badge>
        );
      case 'pending':
        return (
          <Badge key={status} variant="mono" className="text-[10px] select-none h-5 px-2 font-semibold bg-warning/10 text-warning border-warning/20">
            Onay Bekliyor
          </Badge>
        );
      case 'unsubscribed':
        return (
          <Badge key={status} variant="mono" className="text-[10px] select-none h-5 px-2 font-semibold bg-destructive/10 text-destructive border-destructive/20">
            Abonelikten Çıktı
          </Badge>
        );
      default:
        return (
          <Badge key={status} variant="mono" className="text-[10px] select-none h-5 px-2 font-semibold">
            {status}
          </Badge>
        );
    }
  };

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>Bülten Aboneleri (Subscribers)</ToolbarTitle>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Bülten Aboneleri</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
        </Toolbar>

        {/* Filters and Actions */}
        <Card className="flex flex-col md:flex-row items-center gap-4 p-5 mb-6 select-none justify-between">
          <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative w-full md:w-64">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="E-posta ile ara..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="ps-9 pe-9 h-10 w-full"
              />
              {searchQuery && (
                <Button
                  mode="icon"
                  variant="dim"
                  onClick={() => {
                    setSearchQuery('');
                    setPage(1);
                  }}
                  className="absolute end-1.5 top-1/2 -translate-y-1/2 h-6 w-6"
                >
                  <X className="size-3" />
                </Button>
              )}
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-48">
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Durum Filtresi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Abonelikler</SelectItem>
                  <SelectItem value="active">Aktif Aboneler</SelectItem>
                  <SelectItem value="pending">Onay Bekleyenler</SelectItem>
                  <SelectItem value="unsubscribed">Abonelikten Çıkanlar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            disabled={isLoading}
            onClick={() => {
              setSelectedSubscriber(null);
              setDialogOpen(true);
            }}
            className="gap-1.5 shrink-0 w-full md:w-auto font-semibold"
          >
            <Plus className="size-4" />
            Yeni Abone Ekle
          </Button>
        </Card>

        {/* List Table */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2 select-none">
            <LoaderCircleIcon className="size-8 text-primary animate-spin" />
            <span className="text-xs text-muted-foreground">Aboneler yükleniyor...</span>
          </div>
        ) : (
          <Card>
            <CardTable>
              <ScrollArea>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/10 text-muted-foreground text-xs font-bold uppercase tracking-wider select-none">
                      <th className="py-3.5 px-5">E-posta Adresi</th>
                      <th className="py-3.5 px-4">Telefon Numarası</th>
                      <th className="py-3.5 px-4">Abonelik Durumu</th>
                      <th className="py-3.5 px-4 text-center">İletişim İzni</th>
                      <th className="py-3.5 px-4">IP Adresi</th>
                      <th className="py-3.5 px-4">Kayıt Tarihi</th>
                      <th className="py-3.5 px-5 text-right">Aksiyonlar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm">
                    {subscribersList.map((item) => (
                      <tr
                        key={item.id}
                        onClick={(e) => handleEdit(item, e)}
                        className="hover:bg-muted/10 cursor-pointer transition-colors group"
                      >
                        <td className="py-3.5 px-5 font-semibold text-foreground">
                          {item.email || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground font-mono text-xs">
                          {item.phone || '-'}
                        </td>
                        <td className="py-3.5 px-4">
                          {getStatusBadge(item.status)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {item.consent_given ? (
                            <Badge variant="mono" className="bg-success/5 text-success border-success/20 text-[10px]">
                              İzin Verildi
                            </Badge>
                          ) : (
                            <Badge variant="mono" className="bg-destructive/5 text-destructive border-destructive/20 text-[10px]">
                              İzin Yok
                            </Badge>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground text-xs font-mono">
                          {item.ip_address || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground text-xs">
                          {item.created_at ? new Date(item.created_at).toLocaleDateString('tr-TR') : '-'}
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center p-5 border-t border-border select-none">
                <span className="text-xs text-muted-foreground">
                  Toplam {meta.total} kayıttan {limit * (page - 1) + 1} - {Math.min(limit * page, meta.total)} arası gösteriliyor.
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  >
                    Önceki
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  >
                    Sonraki
                  </Button>
                </div>
              </div>
            )}

            {subscribersList.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 border-t border-border bg-card rounded-b-xl select-none">
                <Inbox className="size-10 text-muted-foreground/60 mb-2.5" />
                <h3 className="font-semibold text-sm text-foreground">Abone bulunamadı</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Filtreleri veya arama kriterlerinizi değiştirebilirsiniz.
                </p>
              </div>
            )}
          </Card>
        )}
      </Container>

      {/* Subscriber Dialog */}
      {dialogOpen && (
        <SubscriberDialog
          open={dialogOpen}
          closeDialog={() => {
            setDialogOpen(false);
            setSelectedSubscriber(null);
          }}
          subscriber={selectedSubscriber}
        />
      )}
    </>
  );
}
