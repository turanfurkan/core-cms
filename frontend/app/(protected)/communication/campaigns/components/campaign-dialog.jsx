'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, LoaderCircleIcon, Info } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';

export default function CampaignDialog({ open, closeDialog }) {
  const queryClient = useQueryClient();

  // Form states
  const [name, setName] = useState('');
  const [templateCode, setTemplateCode] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  // Fetch active notification templates for selection
  const { data: templatesResponse, isLoading: templatesLoading } = useQuery({
    queryKey: ['admin-notification-templates-active'],
    queryFn: async () => {
      const res = await apiFetch('/api/admin/notifications/templates?limit=100');
      if (!res.ok) throw new Error('Bildirim şablonları yüklenemedi.');
      return res.json();
    },
    enabled: open,
  });

  const activeTemplates = (templatesResponse?.data || []).filter(t => t.is_active);

  useEffect(() => {
    if (open) {
      setName('');
      setTemplateCode('');
      setScheduledAt('');
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: async (payload) => {
      const res = await apiFetch('/api/admin/communication/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Kampanya oluşturulamadı.');
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
            <AlertTitle>Yeni toplu gönderim kampanyası başarıyla oluşturuldu.</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
      closeDialog();
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

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Kampanya Adı girmelisiniz.');
      return;
    }

    if (!templateCode) {
      toast.error('Lütfen kampanyada gönderilecek bir Bildirim Şablonu seçin.');
      return;
    }

    const payload = {
      name: name.trim(),
      template_code: templateCode,
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
    };

    mutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Yeni Toplu Kampanya Oluştur</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-4">
            {/* Kampanya Adı */}
            <div className="space-y-1.5">
              <Label htmlFor="camp-name" className="text-xs font-semibold text-muted-foreground">
                Kampanya Adı
              </Label>
              <Input
                id="camp-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: 2026 Kış Duyuru Bülteni"
              />
            </div>

            {/* Şablon Seçimi */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Bildirim Şablonu (Template)</Label>
              <Select value={templateCode} onValueChange={setTemplateCode} disabled={templatesLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={templatesLoading ? 'Şablonlar yükleniyor...' : 'Şablon seçin'} />
                </SelectTrigger>
                <SelectContent>
                  {activeTemplates.map((item) => (
                    <SelectItem key={item.id} value={item.code}>
                      {item.name} ({item.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">
                Kampanyadaki mesaj içerikleri bu şablonun mail/SMS/sistem bildirim içeriklerini kullanacaktır.
              </p>
            </div>

            {/* Zamanlanmış Tarih */}
            <div className="space-y-1.5">
              <Label htmlFor="camp-sched" className="text-xs font-semibold text-muted-foreground">
                Planlanan Zaman (İleri Tarihli Gönderim - Opsiyonel)
              </Label>
              <Input
                id="camp-sched"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">
                Boş bırakılırsa kampanya el ile tetiklendiğinde anında gönderime başlar.
              </p>
            </div>
          </DialogBody>

          <DialogFooter className="select-none">
            <Button type="button" variant="outline" onClick={closeDialog}>
              İptal
            </Button>
            <Button type="submit" disabled={mutation.isPending || templatesLoading}>
              {mutation.isPending ? (
                <LoaderCircleIcon className="size-4 animate-spin mr-1.5" />
              ) : (
                <Save className="size-4 mr-1.5" />
              )}
              Oluştur
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
