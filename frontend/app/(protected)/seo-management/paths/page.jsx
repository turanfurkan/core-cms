'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit, Trash, Plus, Search, X, Globe, FileText, CheckCircle, HelpCircle, LoaderCircleIcon, Inbox } from 'lucide-react';
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
import PathDialog from './components/path-dialog';

export default function SeoPathsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPath, setSelectedPath] = useState(null);

  // Fetch SEO paths
  const { data: response, isLoading } = useQuery({
    queryKey: ['admin-seo-paths'],
    queryFn: async () => {
      const res = await apiFetch('/api/admin/seo/paths?limit=100');
      if (!res.ok) throw new Error('SEO sayfaları yüklenemedi.');
      return res.json();
    },
  });

  const seoPaths = response?.data || [];

  // Filter SEO paths locally based on search query
  const filteredPaths = useMemo(() => {
    if (!seoPaths) return [];
    if (!searchQuery) return seoPaths;
    const query = searchQuery.toLowerCase();
    return seoPaths.filter((item) => {
      const pathStr = item.path?.toLowerCase() || '';
      // Match path or meta titles in TR/EN
      const trTitle = item.meta_title?.tr?.toLowerCase() || '';
      const enTitle = item.meta_title?.en?.toLowerCase() || '';
      return pathStr.includes(query) || trTitle.includes(query) || enTitle.includes(query);
    });
  }, [seoPaths, searchQuery]);

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await apiFetch(`/api/admin/seo/paths/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('SEO sayfası silinemedi.');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-seo-paths'] });
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>SEO ayarı başarıyla kaldırıldı.</AlertTitle>
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
    if (confirm('Bu sayfanın özel SEO ayarlarını kalıcı olarak silmek istediğinizden emin misiniz?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (item, e) => {
    e.stopPropagation();
    setSelectedPath(item);
    setDialogOpen(true);
  };

  const getRobotsBadge = (robots) => {
    const r = robots?.toLowerCase() || 'index, follow';
    if (r.includes('noindex')) {
      return (
        <Badge variant="destructive" className="text-[10px] select-none font-bold uppercase h-5 px-2">
          NOINDEX
        </Badge>
      );
    }
    return (
      <Badge variant="success" className="text-[10px] select-none font-bold uppercase h-5 px-2">
        INDEX
      </Badge>
    );
  };

  // Helper to extract a display title from meta_title json
  const getDisplayTitle = (metaTitle) => {
    if (!metaTitle) return '-';
    return metaTitle.tr || metaTitle.en || Object.values(metaTitle)[0] || '-';
  };

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>SEO Sayfa Ayarları (SEO Paths)</ToolbarTitle>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>SEO Ayarları</BreadcrumbPage>
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
              placeholder="Yol veya başlık ara..."
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
              setSelectedPath(null);
              setDialogOpen(true);
            }}
            className="gap-1.5 shrink-0 w-full md:w-auto"
          >
            <Plus className="size-4" />
            Yeni SEO Sayfası Ekle
          </Button>
        </Card>

        {/* List Table */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2 select-none">
            <LoaderCircleIcon className="size-8 text-primary animate-spin" />
            <span className="text-xs text-muted-foreground">SEO yolları listeleniyor...</span>
          </div>
        ) : (
          <Card>
            <CardTable>
              <ScrollArea>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/10 text-muted-foreground text-xs font-bold uppercase tracking-wider select-none">
                      <th className="py-3.5 px-5">İnceleme Yolu</th>
                      <th className="py-3.5 px-4">Meta Başlık (TR/Varsayılan)</th>
                      <th className="py-3.5 px-4">Arama Motorları</th>
                      <th className="py-3.5 px-4">Canonical URL</th>
                      <th className="py-3.5 px-4">Son Güncelleme</th>
                      <th className="py-3.5 px-5 text-right">Aksiyonlar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm">
                    {filteredPaths.map((item) => (
                      <tr
                        key={item.id}
                        onClick={(e) => handleEdit(item, e)}
                        className="hover:bg-muted/10 cursor-pointer transition-colors group"
                      >
                        <td className="py-3.5 px-5 font-mono text-xs font-semibold text-primary">
                          {item.path}
                        </td>
                        <td className="py-3.5 px-4 max-w-[200px] truncate font-medium text-foreground">
                          {getDisplayTitle(item.meta_title)}
                        </td>
                        <td className="py-3.5 px-4">
                          {getRobotsBadge(item.meta_robots)}
                        </td>
                        <td className="py-3.5 px-4 max-w-[220px] truncate text-muted-foreground text-xs font-mono">
                          {item.canonical_url || '-'}
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

            {filteredPaths.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 border-t border-border bg-card rounded-b-xl select-none">
                <Inbox className="size-10 text-muted-foreground/60 mb-2.5" />
                <h3 className="font-semibold text-sm text-foreground">SEO tanımı bulunamadı</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Filtreleri veya arama kriterlerinizi değiştirebilirsiniz.
                </p>
              </div>
            )}
          </Card>
        )}
      </Container>

      {/* Path Drawer */}
      {dialogOpen && (
        <PathDialog
          open={dialogOpen}
          closeDialog={() => {
            setDialogOpen(false);
            setSelectedPath(null);
          }}
          pathItem={selectedPath}
        />
      )}
    </>
  );
}
