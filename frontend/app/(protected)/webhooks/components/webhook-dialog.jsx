'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, LoaderCircleIcon } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
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

const AVAILABLE_EVENTS = [
  { id: 'user.registered', label: 'Yeni Kullanıcı Kaydı (user.registered)' },
  { id: 'form.submitted', label: 'Form Başvurusu Alındı (form.submitted)' },
  { id: 'content.published', label: 'İçerik Yayınlandı (content.published)' },
];

export default function WebhookDialog({ open, closeDialog }) {
  const queryClient = useQueryClient();

  // Form states
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [secret, setSecret] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (open) {
      setName('');
      setUrl('');
      setSelectedEvents([]);
      setSecret('');
      setIsActive(true);
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: async (payload) => {
      const res = await apiFetch('/api/admin/webhooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Webhook oluşturulamadı.');
      }

      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-webhooks'] });
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>Yeni webhook entegrasyonu başarıyla oluşturuldu.</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
      closeDialog(data.data);
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

  const handleEventChange = (eventId, checked) => {
    if (checked) {
      setSelectedEvents((prev) => [...prev, eventId]);
    } else {
      setSelectedEvents((prev) => prev.filter((id) => id !== eventId));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Webhook Adı girmelisiniz.');
      return;
    }

    if (!url.trim()) {
      toast.error('Hedef URL girmelisiniz.');
      return;
    }

    try {
      new URL(url.trim());
    } catch (_) {
      toast.error('Geçerli bir URL girmelisiniz.');
      return;
    }

    if (selectedEvents.length === 0) {
      toast.error('En az bir tetikleyici olay seçmelisiniz.');
      return;
    }

    const payload = {
      name: name.trim(),
      url: url.trim(),
      events: selectedEvents,
      secret: secret.trim() || null,
      is_active: isActive,
      headers: {}, // Newly created webhooks start with empty headers
    };

    mutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Yeni Webhook Tanımla</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="webhook-name" className="text-xs font-semibold text-muted-foreground">
                Webhook Adı
              </Label>
              <Input
                id="webhook-name"
                type="text"
                placeholder="Örn: Slack Bildirimleri, Harici CRM Entegrasyonu"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* URL */}
            <div className="space-y-1.5">
              <Label htmlFor="webhook-url" className="text-xs font-semibold text-muted-foreground">
                Hedef URL (Payload URL)
              </Label>
              <Input
                id="webhook-url"
                type="text"
                placeholder="https://example.com/webhook"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>

            {/* Secret */}
            <div className="space-y-1.5">
              <Label htmlFor="webhook-secret" className="text-xs font-semibold text-muted-foreground">
                Gizli Anahtar (Secret Token - İsteğe Bağlı)
              </Label>
              <Input
                id="webhook-secret"
                type="password"
                placeholder="İmza doğrulaması için gizli anahtar girin"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
              />
            </div>

            {/* Events */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground">
                Tetiklenecek Olaylar (Events)
              </Label>
              <div className="space-y-2 pt-1">
                {AVAILABLE_EVENTS.map((event) => {
                  const isChecked = selectedEvents.includes(event.id);
                  return (
                    <div key={event.id} className="flex items-start gap-2">
                      <Checkbox
                        id={`event-${event.id}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => handleEventChange(event.id, !!checked)}
                      />
                      <Label
                        htmlFor={`event-${event.id}`}
                        className="text-xs font-medium text-foreground leading-none cursor-pointer select-none pt-0.5"
                      >
                        {event.label}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active Switch */}
            <div className="flex items-center gap-2.5 select-none pt-2">
              <Switch id="webhook-active" checked={isActive} onCheckedChange={setIsActive} />
              <Label htmlFor="webhook-active" className="text-xs font-semibold cursor-pointer">
                Webhook Aktif
              </Label>
            </div>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialog}>
              İptal
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
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
