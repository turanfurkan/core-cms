'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, LoaderCircleIcon, Info } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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

export default function SubscriberDialog({ open, closeDialog, subscriber }) {
  const queryClient = useQueryClient();
  const isEdit = !!subscriber;

  // Form states
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('active');
  const [consentGiven, setConsentGiven] = useState(true);

  useEffect(() => {
    if (open) {
      if (subscriber) {
        setEmail(subscriber.email || '');
        setPhone(subscriber.phone || '');
        setStatus(subscriber.status || 'active');
        setConsentGiven(subscriber.consent_given ?? true);
      } else {
        setEmail('');
        setPhone('');
        setStatus('active');
        setConsentGiven(true);
      }
    }
  }, [open, subscriber]);

  const mutation = useMutation({
    mutationFn: async (payload) => {
      const url = isEdit
        ? `/api/admin/communication/subscribers/${subscriber.id}`
        : '/api/admin/communication/subscribers';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Abone kaydedilemedi.');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscribers'] });
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>{isEdit ? 'Abone bilgileri güncellendi.' : 'Yeni bülten abonesi kaydedildi.'}</AlertTitle>
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

    if (!email.trim() && !phone.trim()) {
      toast.error('En az bir iletişim kanalı (E-posta veya Telefon) girmelisiniz.');
      return;
    }

    if (email.trim() && !/\S+@\S+\.\S+/.test(email.trim())) {
      toast.error('Geçerli bir e-posta adresi girmelisiniz.');
      return;
    }

    const payload = {
      email: email.trim() || null,
      phone: phone.trim() || null,
      status,
      consent_given: consentGiven,
    };

    mutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Abone Bilgilerini Düzenle' : 'Yeni Bülten Abonesi Ekle'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-4">
            {/* E-posta */}
            <div className="space-y-1.5">
              <Label htmlFor="sub-email" className="text-xs font-semibold text-muted-foreground">
                E-posta Adresi
              </Label>
              <Input
                id="sub-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@alanadi.com"
              />
            </div>

            {/* Telefon */}
            <div className="space-y-1.5">
              <Label htmlFor="sub-phone" className="text-xs font-semibold text-muted-foreground">
                Telefon Numarası
              </Label>
              <Input
                id="sub-phone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Örn: +90 555 555 55 55"
              />
            </div>

            {/* Durum */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Abonelik Durumu</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif Abone (Active)</SelectItem>
                  <SelectItem value="pending">Onay Bekliyor (Pending)</SelectItem>
                  <SelectItem value="unsubscribed">Abonelikten Çıktı (Unsubscribed)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Consent Switch */}
            <div className="flex items-center gap-2.5 select-none pt-2 border-t border-border">
              <Switch id="sub-consent" checked={consentGiven} onCheckedChange={setConsentGiven} />
              <div className="space-y-0.5 cursor-pointer" onClick={() => setConsentGiven(!consentGiven)}>
                <Label htmlFor="sub-consent" className="text-xs font-semibold cursor-pointer">
                  KVKK / İletişim İzni
                </Label>
                <p className="text-[10px] text-muted-foreground">
                  Abonenin ticari elektronik ileti almayı kabul ettiğini onaylar.
                </p>
              </div>
            </div>
          </DialogBody>

          <DialogFooter className="select-none">
            <Button type="button" variant="outline" onClick={closeDialog}>
              İptal
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <LoaderCircleIcon className="size-4 animate-spin mr-1.5" />
              ) : (
                <Save className="size-4 mr-1.5" />
              )}
              {isEdit ? 'Güncelle' : 'Ekle'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
