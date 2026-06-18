'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit, Trash, Plus, Search, X, Mail, FileText, CheckCircle, HelpCircle, LoaderCircleIcon } from 'lucide-react';
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
import FormDialog from './components/form-dialog';

export default function FormsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);

  // Fetch all forms
  const { data: response, isLoading } = useQuery({
    queryKey: ['admin-forms'],
    queryFn: async () => {
      const res = await apiFetch('/api/admin/forms?limit=100');
      if (!res.ok) throw new Error('Formlar yüklenemedi.');
      return res.json();
    },
  });

  const forms = response?.data || [];

  // Filter forms based on search query
  const filteredForms = useMemo(() => {
    if (!forms) return [];
    if (!searchQuery) return forms;
    const query = searchQuery.toLowerCase();
    return forms.filter(
      (f) =>
        f.title.toLowerCase().includes(query) ||
        f.slug.toLowerCase().includes(query) ||
        (f.recipient_email && f.recipient_email.toLowerCase().includes(query))
    );
  }, [forms, searchQuery]);

  // Delete Form Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await apiFetch(`/api/admin/forms/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Form silinemedi.');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-forms'] });
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>Form başarıyla silindi.</AlertTitle>
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
            <AlertTitle>{err.message || 'Form silme işlemi başarısız.'}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
    },
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }) => {
      const res = await apiFetch(`/api/admin/forms/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...forms.find(f => f.id === id),
          is_active: isActive
        }),
      });
      if (!res.ok) throw new Error('Durum güncellenemedi.');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-forms'] });
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>Form aktiflik durumu güncellendi.</AlertTitle>
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
            <AlertTitle>{err.message || 'Durum güncelleme işlemi başarısız.'}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
    },
  });

  const handleEdit = (form, e) => {
    e.stopPropagation();
    setSelectedForm(form);
    setDialogOpen(true);
  };

  const handleDelete = (id, title, e) => {
    e.stopPropagation();
    if (confirm(`"${title}" formunu ve ilişkili tüm alan şemalarını silmek istediğinizden emin misiniz? (Not: Bu formla gönderilen tüm başvurular da kalıcı olarak silinebilir.)`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleActive = (form, e) => {
    e.stopPropagation();
    toggleActiveMutation.mutate({ id: form.id, isActive: !form.is_active });
  };

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>Form Yönetimi</ToolbarTitle>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Form Builder</BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Forms</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
        </Toolbar>
      </Container>

      <Container className="space-y-4">
        {/* Actions Bar */}
        <Card className="p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-64">
            <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Form ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-9 w-full"
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
              setSelectedForm(null);
              setDialogOpen(true);
            }}
            className="gap-1.5 shrink-0"
          >
            <Plus className="size-4" />
            Yeni Form Ekle
          </Button>
        </Card>

        {/* Forms Table */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2 select-none">
            <LoaderCircleIcon className="size-8 text-primary animate-spin" />
            <span className="text-xs text-muted-foreground">Formlar listeleniyor...</span>
          </div>
        ) : (
          <Card>
            <CardTable>
              <ScrollArea>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/10 text-muted-foreground text-xs font-bold uppercase tracking-wider select-none">
                      <th className="py-3.5 px-5">Form Başlığı</th>
                      <th className="py-3.5 px-4">Alıcı E-posta</th>
                      <th className="py-3.5 px-4">Alan Sayısı</th>
                      <th className="py-3.5 px-4">Oluşturma Tarihi</th>
                      <th className="py-3.5 px-4">Durum</th>
                      <th className="py-3.5 px-5 text-right">Aksiyonlar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm">
                    {filteredForms.map((form) => (
                      <tr
                        key={form.id}
                        onClick={(e) => handleEdit(form, e)}
                        className="hover:bg-muted/10 cursor-pointer transition-colors group"
                      >
                        <td className="py-3.5 px-5 max-w-sm">
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {form.title}
                            </span>
                            <code className="text-[10px] text-muted-foreground font-mono mt-0.5">/{form.slug}</code>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {form.recipient_email ? (
                            <span className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                              <Mail className="size-3.5 text-muted-foreground" />
                              {form.recipient_email}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground font-medium">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="flex items-center gap-1.5 text-xs text-foreground font-mono font-bold">
                            <FileText className="size-3.5 text-muted-foreground" />
                            {form.fields?.length || 0} alan
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-muted-foreground">
                          {form.created_at ? new Date(form.created_at).toLocaleDateString('tr-TR') : '-'}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge
                            variant={form.is_active ? 'success' : 'secondary'}
                            onClick={(e) => handleToggleActive(form, e)}
                            className="text-[10px] uppercase font-bold cursor-pointer hover:opacity-85 select-none"
                          >
                            {form.is_active ? 'Aktif' : 'Pasif'}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="dim"
                              size="sm"
                              onClick={(e) => handleEdit(form, e)}
                              className="h-7 w-7 p-0"
                              title="Düzenle"
                            >
                              <Edit className="size-3.5" />
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={(e) => handleDelete(form.id, form.title, e)}
                              disabled={deleteMutation.isPending}
                              className="h-7 w-7 p-0"
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

            {filteredForms.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 border-t border-border bg-card rounded-b-xl select-none">
                <HelpCircle className="size-10 text-muted-foreground/60 mb-2.5" />
                <h3 className="font-semibold text-sm text-foreground">Gösterilecek form bulunamadı</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Farklı bir arama terimi deneyebilir veya yeni bir form oluşturabilirsiniz.
                </p>
              </div>
            )}
          </Card>
        )}
      </Container>

      {/* Dialog Rendering */}
      {dialogOpen && (
        <FormDialog
          open={dialogOpen}
          closeDialog={() => {
            setDialogOpen(false);
            setSelectedForm(null);
          }}
          form={selectedForm}
        />
      )}
    </>
  );
}
