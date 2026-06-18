'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit, Trash, Plus, Search, X, Flag, HelpCircle, LoaderCircleIcon, Inbox } from 'lucide-react';
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
import TranslationDialog from './components/translation-dialog';

export default function TranslationsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTranslation, setSelectedTranslation] = useState(null);

  // Debounce search query to reduce API requests
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setCurrentPage(1); // Reset page on search
    }, 400);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch translations (Server-paginated and server-filtered)
  const { data: response, isLoading } = useQuery({
    queryKey: ['admin-translations', currentPage, debouncedQuery, selectedGroup],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', String(currentPage));
      params.append('limit', '15');
      if (debouncedQuery) {
        params.append('key', debouncedQuery);
      }
      if (selectedGroup !== 'all') {
        params.append('group', selectedGroup);
      }
      const res = await apiFetch(`/api/admin/translations?${params.toString()}`);
      if (!res.ok) throw new Error('Çeviriler yüklenemedi.');
      return res.json();
    },
  });

  const translations = response?.data || [];
  const meta = response?.meta || { current_page: 1, last_page: 1, total: 0 };

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await apiFetch(`/api/admin/translations/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Çeviri silnemedi.');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-translations'] });
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>Çeviri anahtarı başarıyla silindi.</AlertTitle>
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
    if (confirm('Bu çeviri anahtarını ve tüm dillerdeki karşılıklarını silmek istediğinizden emin misiniz?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (item, e) => {
    e.stopPropagation();
    setSelectedTranslation(item);
    setDialogOpen(true);
  };

  const renderTranslationTexts = (textObj) => {
    if (!textObj) return '-';
    return (
      <div className="flex flex-col gap-0.5 max-w-[320px]">
        {Object.keys(textObj).map((code) => (
          <span key={code} className="text-xs text-muted-foreground truncate" title={textObj[code]}>
            <strong className="uppercase font-mono text-[9px] text-foreground bg-muted/60 px-1 rounded-sm border border-border mr-1.5">{code}:</strong>
            {textObj[code] || <em className="opacity-40 font-normal">boş</em>}
          </span>
        ))}
      </div>
    );
  };

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>Kelime Çevirileri (Translations)</ToolbarTitle>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Çeviriler</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
        </Toolbar>

        {/* Filters Card */}
        <Card className="flex flex-col md:flex-row items-center gap-4 p-5 mb-6 select-none justify-between">
          <div className="flex flex-col md:flex-row items-center gap-3 w-full md:max-w-xl">
            {/* Search Input */}
            <div className="relative w-full">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Çeviri anahtarı (key) ara..."
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

            {/* Quick Group Select Filter */}
            <div className="flex items-center gap-1.5 w-full md:max-w-[180px] shrink-0">
              <Input
                type="text"
                placeholder="Grup filtresi..."
                value={selectedGroup === 'all' ? '' : selectedGroup}
                onChange={(e) => {
                  const val = e.target.value.trim().toLowerCase();
                  setSelectedGroup(val || 'all');
                  setCurrentPage(1);
                }}
                className="h-10 text-xs w-full"
              />
              {selectedGroup !== 'all' && (
                <Button
                  mode="icon"
                  variant="dim"
                  onClick={() => {
                    setSelectedGroup('all');
                    setCurrentPage(1);
                  }}
                  className="h-10 w-10 shrink-0"
                >
                  <X className="size-3.5" />
                </Button>
              )}
            </div>
          </div>

          <Button
            disabled={isLoading}
            onClick={() => {
              setSelectedTranslation(null);
              setDialogOpen(true);
            }}
            className="gap-1.5 shrink-0 w-full md:w-auto"
          >
            <Plus className="size-4" />
            Yeni Çeviri Ekle
          </Button>
        </Card>

        {/* Table List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2 select-none">
            <LoaderCircleIcon className="size-8 text-primary animate-spin" />
            <span className="text-xs text-muted-foreground">Çeviriler listeleniyor...</span>
          </div>
        ) : (
          <Card>
            <CardTable>
              <ScrollArea>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/10 text-muted-foreground text-xs font-bold uppercase tracking-wider select-none">
                      <th className="py-3.5 px-5">Çeviri Anahtarı</th>
                      <th className="py-3.5 px-4 w-40">Grup</th>
                      <th className="py-3.5 px-4">Çeviri Karşılıkları</th>
                      <th className="py-3.5 px-4">Son Güncelleme</th>
                      <th className="py-3.5 px-5 text-right">Aksiyonlar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm">
                    {translations.map((item) => (
                      <tr
                        key={item.id}
                        onClick={(e) => handleEdit(item, e)}
                        className="hover:bg-muted/10 cursor-pointer transition-colors group"
                      >
                        <td className="py-3.5 px-5 font-mono text-xs font-semibold text-primary">
                          {item.key}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant="outline" className="text-[10px] select-none font-bold uppercase border-border/80">
                            {item.group || 'messages'}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4">
                          {renderTranslationTexts(item.text)}
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

            {translations.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 border-t border-border bg-card rounded-b-xl select-none">
                <Inbox className="size-10 text-muted-foreground/60 mb-2.5" />
                <h3 className="font-semibold text-sm text-foreground">Çeviri bulunamadı</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Filtreleri veya arama kriterlerinizi değiştirebilirsiniz.
                </p>
              </div>
            )}

            {/* Pagination Controls */}
            {meta.last_page > 1 && (
              <div className="flex items-center justify-between p-5 border-t border-border bg-muted/5 select-none">
                <span className="text-xs text-muted-foreground">
                  Toplam {meta.total || 0} kayıttan sayfa {currentPage}/{meta.last_page} gösteriliyor
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  >
                    Önceki
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === meta.last_page}
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, meta.last_page))}
                  >
                    Sonraki
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}
      </Container>

      {/* Translation Dialog */}
      {dialogOpen && (
        <TranslationDialog
          open={dialogOpen}
          closeDialog={() => {
            setDialogOpen(false);
            setSelectedTranslation(null);
          }}
          translation={selectedTranslation}
        />
      )}
    </>
  );
}
