'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit, Trash, Plus, Flag, LoaderCircleIcon, Inbox } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';

// Components
import LanguageDialog from './components/language-dialog';

export default function LanguagesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(null);

  // Fetch languages
  const { data: languages, isLoading } = useQuery({
    queryKey: ['admin-languages'],
    queryFn: async () => {
      const res = await apiFetch('/api/admin/languages');
      if (!res.ok) throw new Error('Diller yüklenemedi.');
      const json = await res.json();
      return json.data || [];
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await apiFetch(`/api/admin/languages/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Dil silinemedi.');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-languages'] });
      queryClient.invalidateQueries({ queryKey: ['admin-languages-active'] });
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>Dil başarıyla kaldırıldı.</AlertTitle>
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

  // Toggle Is Active Mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await apiFetch(`/api/admin/languages/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Dil durumu güncellenemedi.');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-languages'] });
      queryClient.invalidateQueries({ queryKey: ['admin-languages-active'] });
      toast.success('Dil durumu güncellendi.');
    },
    onError: (err) => {
      toast.error(err.message || 'Hata oluştu.');
    },
  });

  const handleDelete = (id, isDefault, e) => {
    e.stopPropagation();
    if (isDefault) {
      toast.error('Varsayılan dil silinemez. Önce başka bir dili varsayılan yapmalısınız.');
      return;
    }
    if (confirm('Bu dili ve sisteme kayıtlı bu dildeki tüm içerik/meta verileri silmek istediğinizden emin misiniz?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (lang, e) => {
    e.stopPropagation();
    setSelectedLanguage(lang);
    setDialogOpen(true);
  };

  const handleToggleActive = (lang, e) => {
    e.stopPropagation();
    if (lang.is_default && lang.is_active) {
      toast.error('Varsayılan dil pasif yapılamaz.');
      return;
    }
    toggleActiveMutation.mutate({
      id: lang.id,
      payload: {
        name: lang.name,
        code: lang.code,
        direction: lang.direction,
        order: lang.order,
        is_default: lang.is_default,
        is_active: !lang.is_active,
      },
    });
  };

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>Çoklu Dil Yönetimi (Languages)</ToolbarTitle>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Dil Ayarları</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
        </Toolbar>

        {/* Toolbar Trigger */}
        <Card className="flex items-center justify-between p-5 mb-6 select-none">
          <div className="text-xs text-muted-foreground">
            Sisteme yeni diller ekleyebilir, yazım yönlerini ve sıralamalarını değiştirebilirsiniz.
          </div>
          <Button
            disabled={isLoading}
            onClick={() => {
              setSelectedLanguage(null);
              setDialogOpen(true);
            }}
            className="gap-1.5 shrink-0"
          >
            <Plus className="size-4" />
            Yeni Dil Ekle
          </Button>
        </Card>

        {/* Table List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2 select-none">
            <LoaderCircleIcon className="size-8 text-primary animate-spin" />
            <span className="text-xs text-muted-foreground">Diller yükleniyor...</span>
          </div>
        ) : (
          <Card>
            <CardTable>
              <ScrollArea>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/10 text-muted-foreground text-xs font-bold uppercase tracking-wider select-none">
                      <th className="py-3.5 px-5">Dil Adı</th>
                      <th className="py-3.5 px-4">Dil Kodu</th>
                      <th className="py-3.5 px-4">Yazım Yönü</th>
                      <th className="py-3.5 px-4">Sıra</th>
                      <th className="py-3.5 px-4">Aktif</th>
                      <th className="py-3.5 px-4">Varsayılan</th>
                      <th className="py-3.5 px-5 text-right">Aksiyonlar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm">
                    {languages.map((lang) => (
                      <tr
                        key={lang.id}
                        onClick={(e) => handleEdit(lang, e)}
                        className="hover:bg-muted/10 cursor-pointer transition-colors group"
                      >
                        <td className="py-3.5 px-5 font-semibold text-foreground">
                          {lang.name}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs font-semibold">
                          {lang.code}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-medium uppercase text-muted-foreground">
                          {lang.direction}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-muted-foreground font-mono">
                          {lang.order}
                        </td>
                        <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                          <Switch
                            checked={!!lang.is_active}
                            onCheckedChange={() => handleToggleActive(lang)}
                          />
                        </td>
                        <td className="py-3.5 px-4">
                          {lang.is_default ? (
                            <Badge variant="success" className="text-[10px] select-none font-bold uppercase px-2 h-5">
                              Varsayılan
                            </Badge>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                            <Button
                              mode="icon"
                              variant="dim"
                              onClick={(e) => handleEdit(lang, e)}
                              className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                              title="Düzenle"
                            >
                              <Edit className="size-3.5" />
                            </Button>
                            <Button
                              mode="icon"
                              variant="dim"
                              onClick={(e) => handleDelete(lang.id, lang.is_default, e)}
                              className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              title="Sil"
                              disabled={lang.is_default}
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

            {languages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 border-t border-border bg-card rounded-b-xl select-none">
                <Inbox className="size-10 text-muted-foreground/60 mb-2.5" />
                <h3 className="font-semibold text-sm text-foreground">Dil bulunamadı</h3>
              </div>
            )}
          </Card>
        )}
      </Container>

      {/* Language Dialog */}
      {dialogOpen && (
        <LanguageDialog
          open={dialogOpen}
          closeDialog={() => {
            setDialogOpen(false);
            setSelectedLanguage(null);
          }}
          language={selectedLanguage}
        />
      )}
    </>
  );
}
