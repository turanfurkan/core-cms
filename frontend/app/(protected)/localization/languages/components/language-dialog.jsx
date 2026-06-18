'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, LoaderCircleIcon } from 'lucide-react';
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

export default function LanguageDialog({ open, closeDialog, language }) {
  const queryClient = useQueryClient();
  const isEdit = !!language;

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [direction, setDirection] = useState('ltr');
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    if (open) {
      if (language) {
        setName(language.name || '');
        setCode(language.code || '');
        setDirection(language.direction || 'ltr');
        setOrder(language.order ?? 0);
        setIsActive(language.is_active ?? true);
        setIsDefault(!!language.is_default);
      } else {
        setName('');
        setCode('');
        setDirection('ltr');
        setOrder(0);
        setIsActive(true);
        setIsDefault(false);
      }
    }
  }, [open, language]);

  const mutation = useMutation({
    mutationFn: async (payload) => {
      const url = isEdit
        ? `/api/admin/languages/${language.id}`
        : '/api/admin/languages';
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
        throw new Error(errJson.message || 'Dil kaydedilemedi.');
      }

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
            <AlertTitle>{isEdit ? 'Dil ayarları güncellendi.' : 'Yeni dil başarıyla oluşturuldu.'}</AlertTitle>
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
      toast.error('Dil Adı girmelisiniz.');
      return;
    }

    if (!code.trim()) {
      toast.error('Dil Kodu girmelisiniz.');
      return;
    }

    const payload = {
      name: name.trim(),
      code: code.trim().toLowerCase(),
      direction,
      order: parseInt(String(order), 10) || 0,
      is_active: isActive,
      is_default: isDefault,
    };

    mutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Dil Bilgilerini Düzenle' : 'Yeni Dil Tanımla'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="lang-name" className="text-xs font-semibold text-muted-foreground">
                Dil Adı
              </Label>
              <Input
                id="lang-name"
                type="text"
                placeholder="Örn: Türkçe, English, Deutsch"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Code */}
            <div className="space-y-1.5">
              <Label htmlFor="lang-code" className="text-xs font-semibold text-muted-foreground">
                Dil Kodu (Locale Code)
              </Label>
              <Input
                id="lang-code"
                type="text"
                placeholder="Örn: tr, en, de"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={isEdit} // Do not change language code on edit
              />
            </div>

            {/* Direction */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">
                Yazım Yönü (Direction)
              </Label>
              <Select value={direction} onValueChange={setDirection}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ltr">LTR - Soldan Sağa (Türkçe, İngilizce vb.)</SelectItem>
                  <SelectItem value="rtl">RTL - Sağdan Sola (Arapça, Farsça vb.)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Order */}
            <div className="space-y-1.5">
              <Label htmlFor="lang-order" className="text-xs font-semibold text-muted-foreground">
                Sıralama Ağırlığı (Order)
              </Label>
              <Input
                id="lang-order"
                type="number"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
              />
            </div>

            {/* Switches Row */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="flex items-center gap-2.5 select-none pl-0.5">
                <Switch id="lang-active" checked={isActive} onCheckedChange={setIsActive} />
                <Label htmlFor="lang-active" className="text-xs font-semibold cursor-pointer">
                  Dil Aktif
                </Label>
              </div>

              <div className="flex items-center gap-2.5 select-none pl-0.5">
                <Switch id="lang-default" checked={isDefault} onCheckedChange={setIsDefault} />
                <Label htmlFor="lang-default" className="text-xs font-semibold cursor-pointer">
                  Varsayılan Dil
                </Label>
              </div>
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
              {isEdit ? 'Güncelle' : 'Oluştur'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
