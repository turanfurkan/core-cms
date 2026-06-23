'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, Trash, Search, X, Inbox, Calendar, Globe, LoaderCircleIcon, CheckCircle, HelpCircle, ShieldAlert } from 'lucide-react';
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

// Components
import SubmissionDetailDrawer from './components/submission-detail-drawer';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tüm Durumlar' },
  { value: 'unread', label: 'Okunmadı' },
  { value: 'read', label: 'Okundu' },
  { value: 'spam', label: 'Spam' },
  { value: 'archived', label: 'Arşivlendi' },
];

export default function SubmissionsPage() {
  const queryClient = useQueryClient();
  const [selectedFormId, setSelectedFormId] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Drawer States
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  // Fetch all forms for selection list
  const { data: formsResponse } = useQuery({
    queryKey: ['admin-forms-select'],
    queryFn: async () => {
      const res = await apiFetch('/api/admin/forms?limit=100');
      if (!res.ok) throw new Error('Formlar yüklenemedi.');
      const json = await res.json();
      return json.data || [];
    },
  });

  const formsList = formsResponse || [];

  // Fetch submissions list
  const { data: submissionsResponse, isLoading } = useQuery({
    queryKey: ['admin-submissions', selectedFormId, selectedStatus, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedFormId !== 'all') {
        params.append('form_id', selectedFormId);
      }
      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus);
      }
      params.append('page', String(currentPage));
      params.append('limit', String(pageSize));

      const res = await apiFetch(`/api/admin/forms/submissions?${params.toString()}`);
      if (!res.ok) throw new Error('Başvurular yüklenemedi.');
      return res.json();
    },
  });

  const submissions = submissionsResponse?.data || [];
  const meta = submissionsResponse?.meta || submissionsResponse?.pagination || { last_page: 1, total: 0 };

  // Filter submissions by local search query
  const filteredSubmissions = useMemo(() => {
    if (!submissions) return [];
    if (!searchQuery) return submissions;
    const query = searchQuery.toLowerCase();
    return submissions.filter((sub) => {
      const name = sub.form?.title?.toLowerCase() || '';
      const ip = sub.ip_address || '';
      const dataStr = sub.data ? JSON.stringify(sub.data).toLowerCase() : '';
      return name.includes(query) || ip.includes(query) || dataStr.includes(query);
    });
  }, [submissions, searchQuery]);

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await apiFetch(`/api/admin/forms/submissions/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Başvuru silinemedi.');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-submissions', selectedFormId, selectedStatus, currentPage] });
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>Başvuru başarıyla silindi.</AlertTitle>
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
    if (confirm('Bu başvuruyu kalıcı olarak silmek istediğinizden emin misiniz?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleRowClick = (sub) => {
    setSelectedSubmission(sub);
    setDrawerOpen(true);
  };

  // Helper to extract a nice description text from submitted JSON fields
  const getSummaryText = (data) => {
    if (!data) return '-';
    const email = data.email || data.eposta || data.mail;
    const name = data.name || data.fullname || data.ad_soyad || data.first_name || data.ad;
    const message = data.message || data.mesaj || data.content || data.body;

    const parts = [];
    if (name) parts.push(name);
    if (email) parts.push(`<${email}>`);
    if (message) {
      parts.push(`- "${message.substring(0, 45)}${message.length > 45 ? '...' : ''}"`);
    }

    return parts.join(' ') || Object.values(data)[0] || '-';
  };

  // Status Badge Colors mapping
  const statusBadges = {
    unread: { variant: 'destructive', label: 'Okunmadı' },
    read: { variant: 'success', label: 'Okundu' },
    spam: { variant: 'secondary', label: 'Spam' },
    archived: { variant: 'outline', label: 'Arşivlendi' },
  };

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>Form Başvuruları</ToolbarTitle>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Form Builder</BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Submissions</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
        </Toolbar>
      </Container>

      <Container className="space-y-4">
        {/* Filters and Search Bar */}
        <Card className="p-5 flex flex-col md:flex-row md:items-center gap-4">
          {/* Search bar */}
          <div className="relative w-full md:w-64">
            <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Başvurularda ara..."
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

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto grow justify-end select-none">
            {/* Form Filter */}
            <div className="w-full sm:w-48 space-y-1">
              <Select value={selectedFormId} onValueChange={(val) => { setSelectedFormId(val); setCurrentPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Form Seçin..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Formlar</SelectItem>
                  {formsList.map((form) => (
                    <SelectItem key={form.id} value={String(form.id)}>
                      {form.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-40 space-y-1">
              <Select value={selectedStatus} onValueChange={(val) => { setSelectedStatus(val); setCurrentPage(1); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Submissions List Table */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2 select-none">
            <LoaderCircleIcon className="size-8 text-primary animate-spin" />
            <span className="text-xs text-muted-foreground">Başvurular listeleniyor...</span>
          </div>
        ) : (
          <Card>
            <CardTable>
              <ScrollArea>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/10 text-muted-foreground text-xs font-bold uppercase tracking-wider select-none">
                      <th className="py-3.5 px-5">Gönderen Form</th>
                      <th className="py-3.5 px-4">Veri Özeti</th>
                      <th className="py-3.5 px-4">IP Adresi</th>
                      <th className="py-3.5 px-4">Gönderim Tarihi</th>
                      <th className="py-3.5 px-4">Durum</th>
                      <th className="py-3.5 px-5 text-right">Aksiyonlar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm">
                    {filteredSubmissions.map((sub) => {
                      const badge = statusBadges[sub.status] || { variant: 'secondary', label: sub.status };

                      return (
                        <tr
                          key={sub.id}
                          onClick={() => handleRowClick(sub)}
                          className="hover:bg-muted/10 cursor-pointer transition-colors group"
                        >
                          <td className="py-3.5 px-5 font-semibold text-foreground truncate max-w-[150px]" title={sub.form?.title}>
                            {sub.form?.title || 'Bilinmeyen Form'}
                          </td>
                          <td className="py-3.5 px-4 max-w-xs md:max-w-md truncate">
                            <span className="text-xs text-foreground font-medium truncate block" title={getSummaryText(sub.data)}>
                              {getSummaryText(sub.data)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-muted-foreground font-mono">
                            {sub.ip_address || '0.0.0.0'}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-muted-foreground">
                            {sub.created_at ? new Date(sub.created_at).toLocaleString('tr-TR') : '-'}
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge variant={badge.variant} className="text-[10px] uppercase font-bold">
                              {badge.label}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="dim"
                                size="sm"
                                onClick={() => handleRowClick(sub)}
                                className="h-7 w-7 p-0"
                                title="İncele"
                              >
                                <Eye className="size-3.5" />
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={(e) => handleDelete(sub.id, e)}
                                disabled={deleteMutation.isPending}
                                className="h-7 w-7 p-0"
                                title="Sil"
                              >
                                <Trash className="size-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </CardTable>

            {filteredSubmissions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 border-t border-border bg-card rounded-b-xl select-none">
                <Inbox className="size-10 text-muted-foreground/60 mb-2.5" />
                <h3 className="font-semibold text-sm text-foreground">Başvuru bulunamadı</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Filtreleri değiştirebilir veya arama teriminizi sıfırlayabilirsiniz.
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

      {/* Submission Detail Drawer */}
      {drawerOpen && selectedSubmission && (
        <SubmissionDetailDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          submission={selectedSubmission}
          formId={selectedFormId}
          currentStatus={selectedStatus}
        />
      )}
    </>
  );
}
