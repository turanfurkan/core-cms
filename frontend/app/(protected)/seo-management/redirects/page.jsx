'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit, Trash, Plus, Search, X, ShieldAlert, ArrowRight, CheckCircle, HelpCircle, LoaderCircleIcon, Inbox } from 'lucide-react';
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
import RedirectDialog from './components/redirect-dialog';

export default function SeoRedirectsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRedirect, setSelectedRedirect] = useState(null);

  // Fetch SEO Redirects
  const { data: response, isLoading } = useQuery({
    queryKey: ['admin-seo-redirects'],
    queryFn: async () => {
      const res = await apiFetch('/api/admin/seo/redirects?limit=100');
      if (!res.ok) throw new Error('Yönlendirmeler yüklenemedi.');
      return res.json();
    },
  });

  const redirects = response?.data || [];

  // Filter redirects locally based on search query
  const filteredRedirects = useMemo(() => {
    if (!redirects) return [];
    if (!searchQuery) return redirects;
    const query = searchQuery.toLowerCase();
    return redirects.filter(
      (item) =>
        item.source_path?.toLowerCase().includes(query) ||
        item.target_path?.toLowerCase().includes(query)
    );
  }, [redirects, searchQuery]);

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await apiFetch(`/api/admin/seo/redirects/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Yönlendirme silnemedi.');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-seo-redirects'] });
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>Yönlendirme kuralı başarıyla silindi.</AlertTitle>
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

  // Toggle Is Active Status Mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await apiFetch(`/api/admin/seo/redirects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Yönlendirme durumu güncellenemedi.');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-seo-redirects'] });
      toast.success('Yönlendirme durumu güncellendi.');
    },
    onError: (err) => {
      toast.error(err.message || 'Durum güncelleme başarısız.');
    },
  });

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (confirm('Bu yönlendirme kuralını kalıcı olarak silmek istediğinizden emin misiniz?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (item, e) => {
    e.stopPropagation();
    setSelectedRedirect(item);
    setDialogOpen(true);
  };

  const handleToggleActive = (item, e) => {
    e.stopPropagation();
    toggleActiveMutation.mutate({
      id: item.id,
      payload: {
        source_path: item.source_path,
        target_path: item.target_path,
        status_code: item.status_code,
        is_active: !item.is_active,
      },
    });
  };

  const getStatusBadge = (code) => {
    if (code === 301) {
      return (
        <Badge variant="dim" className="text-[10px] bg-blue-500/10 text-blue-500 hover:bg-blue-500/10 border-blue-500/20 font-bold select-none h-5 px-2">
          301 Kalıcı (Permanent)
        </Badge>
      );
    }
    return (
      <Badge variant="dim" className="text-[10px] bg-amber-500/10 text-amber-500 hover:bg-amber-500/10 border-amber-500/20 font-bold select-none h-5 px-2">
        302 Geçici (Temporary)
      </Badge>
    );
  };

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>URL Yönlendirmeleri (Redirects)</ToolbarTitle>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Yönlendirmeler</BreadcrumbPage>
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
              placeholder="Kaynak veya hedef yol ara..."
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
              setSelectedRedirect(null);
              setDialogOpen(true);
            }}
            className="gap-1.5 shrink-0 w-full md:w-auto"
          >
            <Plus className="size-4" />
            Yeni Yönlendirme Ekle
          </Button>
        </Card>

        {/* List Table */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2 select-none">
            <LoaderCircleIcon className="size-8 text-primary animate-spin" />
            <span className="text-xs text-muted-foreground">Yönlendirme kuralları listeleniyor...</span>
          </div>
        ) : (
          <Card>
            <CardTable>
              <ScrollArea>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/10 text-muted-foreground text-xs font-bold uppercase tracking-wider select-none">
                      <th className="py-3.5 px-5">Eski Adres (Kaynak)</th>
                      <th className="py-3.5 px-2 w-10 text-center"></th>
                      <th className="py-3.5 px-4">Yeni Adres (Hedef)</th>
                      <th className="py-3.5 px-4">Yönlendirme Tipi</th>
                      <th className="py-3.5 px-4">Aktif</th>
                      <th className="py-3.5 px-5 text-right">Aksiyonlar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm">
                    {filteredRedirects.map((item) => (
                      <tr
                        key={item.id}
                        onClick={(e) => handleEdit(item, e)}
                        className="hover:bg-muted/10 cursor-pointer transition-colors group"
                      >
                        <td className="py-3.5 px-5 font-mono text-xs font-semibold text-destructive">
                          {item.source_path}
                        </td>
                        <td className="py-3.5 px-2 text-center text-muted-foreground">
                          <ArrowRight className="size-3.5 mx-auto" />
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs font-semibold text-success">
                          {item.target_path}
                        </td>
                        <td className="py-3.5 px-4">
                          {getStatusBadge(item.status_code)}
                        </td>
                        <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                          <Switch
                            checked={!!item.is_active}
                            onCheckedChange={() => handleToggleActive(item)}
                          />
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
                              <Trash className="size-3.5" />
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

            {filteredRedirects.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 border-t border-border bg-card rounded-b-xl select-none">
                <Inbox className="size-10 text-muted-foreground/60 mb-2.5" />
                <h3 className="font-semibold text-sm text-foreground">Yönlendirme kuralı bulunamadı</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Arama kriterlerinizi değiştirebilirsiniz.
                </p>
              </div>
            )}
          </Card>
        )}
      </Container>

      {/* Redirect Dialog */}
      {dialogOpen && (
        <RedirectDialog
          open={dialogOpen}
          closeDialog={() => {
            setDialogOpen(false);
            setSelectedRedirect(null);
          }}
          redirect={selectedRedirect}
        />
      )}
    </>
  );
}
