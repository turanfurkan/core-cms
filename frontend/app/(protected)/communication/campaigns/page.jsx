'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Trash2,
  Plus,
  Search,
  X,
  Send,
  LoaderCircleIcon,
  Inbox,
  Eye,
  Play
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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';

// Components
import CampaignDialog from './components/campaign-dialog';
import CampaignDetailModal from './components/campaign-detail-modal';

export default function CampaignsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const limit = 15;

  // Fetch campaigns
  const { data: response, isLoading } = useQuery({
    queryKey: ['admin-campaigns', page],
    queryFn: async () => {
      const res = await apiFetch(`/api/admin/communication/campaigns?page=${page}&limit=${limit}`);
      if (!res.ok) throw new Error('Kampanyalar yüklenemedi.');
      return res.json();
    },
  });

  const campaignsList = response?.data || [];
  const meta = response?.meta || {};
  const totalPages = meta.last_page || 1;

  // Send Campaign Mutation
  const sendMutation = useMutation({
    mutationFn: async (id) => {
      const res = await apiFetch(`/api/admin/communication/campaigns/${id}/send`, {
        method: 'POST',
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Kampanya gönderimi başlatılamadı.');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] });
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>Kampanya gönderim kuyruğuna alındı ve başlatıldı.</AlertTitle>
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
            <AlertTitle>{err.message || 'Gönderim işlemi başarısız.'}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
    },
  });

  const handleSend = (id, name, e) => {
    e.stopPropagation();
    if (confirm(`"${name}" kampanyasını aktif tüm abonelere göndermek istediğinizden emin misiniz?`)) {
      sendMutation.mutate(id);
    }
  };

  // Delete Campaign Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await apiFetch(`/api/admin/communication/campaigns/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Kampanya silinemedi.');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] });
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

  const handleShowDetail = (item, e) => {
    e.stopPropagation();
    setSelectedCampaign(item);
    setDetailOpen(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'draft':
        return (
          <Badge variant="mono" className="text-[10px] select-none h-5 px-2 font-semibold bg-muted text-muted-foreground border-muted-foreground/20">
            Taslak (Draft)
          </Badge>
        );
      case 'sending':
        return (
          <Badge variant="mono" className="text-[10px] select-none h-5 px-2 font-semibold bg-primary/10 text-primary border-primary/20 animate-pulse">
            Gönderiliyor...
          </Badge>
        );
      case 'sent':
        return (
          <Badge variant="mono" className="text-[10px] select-none h-5 px-2 font-semibold bg-success/10 text-success border-success/20">
            Gönderildi
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="mono" className="text-[10px] select-none h-5 px-2 font-semibold bg-destructive/10 text-destructive border-destructive/20">
            Başarısız
          </Badge>
        );
      default:
        return <Badge variant="mono" className="text-[10px] select-none h-5 px-2 font-semibold">{status}</Badge>;
    }
  };

  // Filter campaigns locally (simple client-side filter for local search)
  const filteredCampaigns = useMemo(() => {
    if (!searchQuery) return campaignsList;
    const query = searchQuery.toLowerCase();
    return campaignsList.filter(
      (item) =>
        item.name?.toLowerCase().includes(query) ||
        item.template_code?.toLowerCase().includes(query)
    );
  }, [campaignsList, searchQuery]);

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>Toplu Kampanya Gönderimleri (Campaigns)</ToolbarTitle>
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

        {/* Toolbar Filter & Create */}
        <Card className="flex flex-col md:flex-row items-center gap-4 p-5 mb-6 select-none justify-between">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Kampanya veya şablon kodu ara..."
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
              setDialogOpen(true);
            }}
            className="gap-1.5 shrink-0 w-full md:w-auto font-semibold"
          >
            <Plus className="size-4" />
            Yeni Kampanya Oluştur
          </Button>
        </Card>

        {/* List Table */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2 select-none">
            <LoaderCircleIcon className="size-8 text-primary animate-spin" />
            <span className="text-xs text-muted-foreground">Kampanyalar yükleniyor...</span>
          </div>
        ) : (
          <Card>
            <CardTable>
              <ScrollArea>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/10 text-muted-foreground text-xs font-bold uppercase tracking-wider select-none">
                      <th className="py-3.5 px-5">Kampanya Adı</th>
                      <th className="py-3.5 px-4">Bildirim Şablon Kodu</th>
                      <th className="py-3.5 px-4">Gönderim Durumu</th>
                      <th className="py-3.5 px-4">Planlanan Tarih</th>
                      <th className="py-3.5 px-4">Gönderilen Tarih</th>
                      <th className="py-3.5 px-5 text-right">Aksiyonlar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm">
                    {filteredCampaigns.map((item) => (
                      <tr
                        key={item.id}
                        onClick={(e) => handleShowDetail(item, e)}
                        className="hover:bg-muted/10 cursor-pointer transition-colors group"
                      >
                        <td className="py-3.5 px-5 font-semibold text-foreground">
                          {item.name}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs font-semibold text-primary">
                          {item.template_code}
                        </td>
                        <td className="py-3.5 px-4">
                          {getStatusBadge(item.status)}
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground text-xs font-mono">
                          {item.scheduled_at ? new Date(item.scheduled_at).toLocaleString('tr-TR') : 'Hemen'}
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground text-xs font-mono">
                          {item.sent_at ? new Date(item.sent_at).toLocaleString('tr-TR') : '-'}
                        </td>
                        <td className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                            {item.status === 'draft' && (
                              <Button
                                mode="icon"
                                variant="dim"
                                onClick={(e) => handleSend(item.id, item.name, e)}
                                disabled={sendMutation.isPending}
                                className="h-8 w-8 text-success hover:bg-success/10 hover:text-success"
                                title="Gönderimi Başlat"
                              >
                                {sendMutation.isPending && sendMutation.variables === item.id ? (
                                  <LoaderCircleIcon className="size-3.5 animate-spin" />
                                ) : (
                                  <Play className="size-3.5" />
                                )}
                              </Button>
                            )}
                            <Button
                              mode="icon"
                              variant="dim"
                              onClick={(e) => handleShowDetail(item, e)}
                              className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                              title="İstatistik ve Detaylar"
                            >
                              <Eye className="size-3.5" />
                            </Button>
                            <Button
                              mode="icon"
                              variant="dim"
                              disabled={item.status === 'sending' || deleteMutation.isPending}
                              onClick={(e) => handleDelete(item.id, e)}
                              className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
                              title="Kalıcı Olarak Sil"
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

            {/* Pagination */}
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

            {campaignsList.length === 0 && (
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

      {/* Dialogs */}
      {dialogOpen && (
        <CampaignDialog
          open={dialogOpen}
          closeDialog={() => {
            setDialogOpen(false);
          }}
        />
      )}

      {detailOpen && (
        <CampaignDetailModal
          open={detailOpen}
          closeDialog={() => {
            setDetailOpen(false);
            setSelectedCampaign(null);
          }}
          campaign={selectedCampaign}
        />
      )}
    </>
  );
}
