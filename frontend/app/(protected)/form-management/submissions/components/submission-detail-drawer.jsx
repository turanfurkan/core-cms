'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, ShieldAlert, Archive, Trash2, MailOpen, Calendar, Monitor, Globe, Mail } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RightDrawer } from '@/components/common/right-drawer';
import { toast } from 'sonner';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';

export default function SubmissionDetailDrawer({ open, onOpenChange, submission, formId, currentStatus }) {
  const queryClient = useQueryClient();

  // Status Badge Colors mapping
  const statusBadges = {
    unread: { variant: 'destructive', label: 'Okunmadı' },
    read: { variant: 'success', label: 'Okundu' },
    spam: { variant: 'secondary', label: 'Spam' },
    archived: { variant: 'outline', label: 'Arşivlendi' },
  };

  const currentBadge = statusBadges[submission?.status] || { variant: 'secondary', label: submission?.status };

  // Status Change Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (status) => {
      const res = await apiFetch(`/api/admin/forms/submissions/${submission.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Durum güncellenemedi.');
      }

      return res.json();
    },
    onSuccess: (data, status) => {
      queryClient.invalidateQueries({ queryKey: ['admin-submissions', formId, currentStatus] });
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>{`Başvuru durumu "${statusBadges[status]?.label}" olarak güncellendi.`}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
      onOpenChange(false);
    },
    onError: (err) => {
      toast.custom(
        () => (
          <Alert variant="mono" icon="destructive" close={false}>
            <AlertIcon>
              <RiErrorWarningFill />
            </AlertIcon>
            <AlertTitle>{err.message || 'İşlem başarısız.'}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(`/api/admin/forms/submissions/${submission.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Başvuru silinemedi.');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-submissions', formId, currentStatus] });
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>Form başvurusu kalıcı olarak silindi.</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
      onOpenChange(false);
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

  if (!submission) return null;

  // Resolve form field names to human-readable labels from fields schema
  const getFieldLabel = (key) => {
    const fields = submission.form?.fields || [];
    const field = fields.find((f) => f.name === key);
    return field ? field.label : key;
  };

  const handleUpdateStatus = (status) => {
    updateStatusMutation.mutate(status);
  };

  const handleDelete = () => {
    if (confirm('Bu başvuruyu kalıcı olarak silmek istediğinizden emin misiniz?')) {
      deleteMutation.mutate();
    }
  };

  const footerContent = (
    <div className="flex items-center justify-between w-full">
      <Button
        type="button"
        variant="danger"
        onClick={handleDelete}
        disabled={deleteMutation.isPending || updateStatusMutation.isPending}
        className="gap-1.5"
      >
        <Trash2 className="size-4" />
        Sil
      </Button>

      <div className="flex items-center gap-2">
        {submission.status !== 'read' && (
          <Button
            type="button"
            variant="outline"
            onClick={() => handleUpdateStatus('read')}
            disabled={updateStatusMutation.isPending}
            className="gap-1.5 border-success text-success hover:bg-success/5 focus:bg-success/5"
          >
            <MailOpen className="size-4" />
            Okundu
          </Button>
        )}
        {submission.status !== 'spam' && (
          <Button
            type="button"
            variant="outline"
            onClick={() => handleUpdateStatus('spam')}
            disabled={updateStatusMutation.isPending}
            className="gap-1.5 border-amber-500 text-amber-500 hover:bg-amber-500/5 focus:bg-amber-500/5"
          >
            <ShieldAlert className="size-4" />
            Spam Bildir
          </Button>
        )}
        {submission.status !== 'archived' && (
          <Button
            type="button"
            variant="outline"
            onClick={() => handleUpdateStatus('archived')}
            disabled={updateStatusMutation.isPending}
            className="gap-1.5"
          >
            <Archive className="size-4" />
            Arşivle
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <RightDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={`Başvuru İncele: #${submission.id}`}
      size="lg"
      footer={footerContent}
    >
      <div className="space-y-6">
        {/* Core Attributes Panel */}
        <div className="grid grid-cols-2 gap-3.5 bg-muted/10 p-4 border border-border rounded-xl text-xs">
          <div className="space-y-1">
            <span className="text-muted-foreground flex items-center gap-1 font-semibold select-none">
              <Calendar className="size-3.5" /> Gönderim Tarihi
            </span>
            <span className="font-semibold text-foreground">
              {submission.created_at ? new Date(submission.created_at).toLocaleString('tr-TR') : '-'}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-muted-foreground flex items-center gap-1 font-semibold select-none">
              <Mail className="size-3.5" /> Form Şablonu
            </span>
            <span className="font-semibold text-foreground truncate max-w-[150px]" title={submission.form?.title}>
              {submission.form?.title || 'Bilinmeyen Form'}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-muted-foreground flex items-center gap-1 font-semibold select-none">
              <Globe className="size-3.5" /> IP Adresi
            </span>
            <span className="text-foreground font-semibold font-mono">{submission.ip_address || '0.0.0.0'}</span>
          </div>

          <div className="space-y-1">
            <span className="text-muted-foreground flex items-center gap-1 font-semibold select-none">
              <Eye className="size-3.5" /> Okunma Durumu
            </span>
            <Badge variant={currentBadge.variant} className="text-[9px] uppercase font-bold px-1.5 h-4 select-none">
              {currentBadge.label}
            </Badge>
          </div>

          <div className="space-y-1 col-span-2 border-t border-border/60 pt-3 mt-1.5">
            <span className="text-muted-foreground flex items-center gap-1 font-semibold select-none">
              <Monitor className="size-3.5" /> Tarayıcı / Cihaz (User Agent)
            </span>
            <span className="text-foreground font-mono text-[10px] break-all leading-normal">
              {submission.user_agent || 'Bilinmiyor'}
            </span>
          </div>
        </div>

        <hr className="border-border" />

        {/* Submitted Fields and Values */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider select-none">
            Gönderilen Form Verileri (Data Payload)
          </h3>

          <div className="space-y-3">
            {submission.data &&
              Object.keys(submission.data).map((key) => {
                const label = getFieldLabel(key);
                const rawVal = submission.data[key];

                // Render value beautifully based on type
                let valStr = String(rawVal);
                if (Array.isArray(rawVal)) {
                  valStr = rawVal.join(', ');
                } else if (typeof rawVal === 'boolean') {
                  valStr = rawVal ? 'Evet' : 'Hayır';
                }

                // If file upload type, render as link if url, or string
                const isUrl = typeof valStr === 'string' && valStr.startsWith('http');

                return (
                  <div
                    key={key}
                    className="p-3 border border-border rounded-lg bg-card flex flex-col gap-1 hover:border-primary/10 transition-colors"
                  >
                    <span className="text-[10px] font-bold text-muted-foreground font-semibold flex items-center gap-1">
                      {label}
                      {key !== label && (
                        <code className="text-[9px] font-normal text-muted-foreground font-mono">({key})</code>
                      )}
                    </span>
                    {isUrl ? (
                      <a
                        href={valStr}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 mt-0.5 truncate break-all"
                      >
                        Yüklenen Dosyayı Görüntüle
                      </a>
                    ) : (
                      <span className="text-xs text-foreground font-medium leading-relaxed break-words mt-0.5">
                        {valStr || <em className="text-muted-foreground opacity-50 font-normal">Boş bırakıldı</em>}
                      </span>
                    )}
                  </div>
                );
              })}

            {(!submission.data || Object.keys(submission.data).length === 0) && (
              <div className="text-center py-6 text-xs text-muted-foreground">
                Gönderilen herhangi bir veri bulunamadı.
              </div>
            )}
          </div>
        </div>
      </div>
    </RightDrawer>
  );
}
