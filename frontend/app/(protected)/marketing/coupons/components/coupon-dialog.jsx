'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, LoaderCircleIcon, Percent, CircleDollarSign } from 'lucide-react';
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

export default function CouponDialog({ open, closeDialog, coupon }) {
  const queryClient = useQueryClient();
  const isEdit = !!coupon;

  // Form states
  const [code, setCode] = useState('');
  const [type, setType] = useState('percentage');
  const [value, setValue] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (open) {
      if (coupon) {
        setCode(coupon.code || '');
        setType(coupon.type || 'percentage');
        setValue(String(coupon.value || ''));
        setIsActive(coupon.is_active ?? true);
        setUsageLimit(coupon.usage_limit ? String(coupon.usage_limit) : '');

        const formatDateTime = (isoStr) => {
          if (!isoStr) return '';
          try {
            return new Date(isoStr).toISOString().slice(0, 16);
          } catch (e) {
            return '';
          }
        };

        setStartsAt(formatDateTime(coupon.starts_at));
        setExpiresAt(formatDateTime(coupon.expires_at));
      } else {
        setCode('');
        setType('percentage');
        setValue('');
        setIsActive(true);
        setUsageLimit('');
        setStartsAt('');
        setExpiresAt('');
      }
    }
  }, [open, coupon]);

  const mutation = useMutation({
    mutationFn: async (payload) => {
      const url = isEdit
        ? `/api/admin/marketing/coupons/${coupon.id}`
        : '/api/admin/marketing/coupons';
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
        throw new Error(errJson.message || 'Kupon kaydedilemedi.');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>{isEdit ? 'Kupon başarıyla güncellendi.' : 'Yeni indirim kuponu tanımlandı.'}</AlertTitle>
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

    if (!code.trim()) {
      toast.error('Kupon Kodu girmelisiniz.');
      return;
    }

    if (!value || isNaN(Number(value)) || Number(value) < 0) {
      toast.error('Geçerli bir indirim değeri girmelisiniz.');
      return;
    }

    if (type === 'percentage' && Number(value) > 100) {
      toast.error('Yüzdesel indirim oranı 100\'den büyük olamaz.');
      return;
    }

    const payload = {
      code: code.trim().toUpperCase(),
      type,
      value: Number(value),
      starts_at: startsAt ? new Date(startsAt).toISOString() : null,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      usage_limit: usageLimit ? parseInt(usageLimit, 10) : null,
      is_active: isActive,
    };

    mutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Kupon Bilgilerini Düzenle' : 'Yeni İndirim Kuponu Tanımla'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-4">
            {/* Kupon Kodu */}
            <div className="space-y-1.5">
              <Label htmlFor="coupon-code" className="text-xs font-semibold text-muted-foreground">
                Kupon Kodu (Benzersiz)
              </Label>
              <Input
                id="coupon-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Örn: WINTER50, YENI20"
                className="font-mono uppercase font-bold"
                disabled={isEdit}
              />
            </div>

            {/* İndirim Türü (Select) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">İndirim Türü</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Yüzdesel İndirim (%)</SelectItem>
                  <SelectItem value="fixed">Sabit İndirim Tutarı (TL)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* İndirim Değeri */}
            <div className="space-y-1.5">
              <Label htmlFor="coupon-value" className="text-xs font-semibold text-muted-foreground">
                İndirim Değeri ({type === 'percentage' ? '%' : 'TL'})
              </Label>
              <Input
                id="coupon-value"
                type="number"
                step="0.01"
                min="0"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={type === 'percentage' ? 'Örn: 20 (%20 İndirim)' : 'Örn: 150 (150 TL İndirim)'}
              />
            </div>

            {/* Kullanım Limiti */}
            <div className="space-y-1.5">
              <Label htmlFor="coupon-limit" className="text-xs font-semibold text-muted-foreground">
                Kullanım Limiti (Adet - Sınırsız için boş bırakın)
              </Label>
              <Input
                id="coupon-limit"
                type="number"
                min="1"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
                placeholder="Örn: 100"
              />
            </div>

            {/* Başlangıç ve Bitiş Zamanları */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="starts-at" className="text-xs font-semibold text-muted-foreground">
                  Başlangıç Zamanı
                </Label>
                <Input
                  id="starts-at"
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="expires-at" className="text-xs font-semibold text-muted-foreground">
                  Sona Erme Zamanı
                </Label>
                <Input
                  id="expires-at"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
            </div>

            {/* Active Switch */}
            <div className="flex items-center gap-2.5 select-none pt-2 border-t border-border">
              <Switch id="coupon-active" checked={isActive} onCheckedChange={setIsActive} />
              <Label htmlFor="coupon-active" className="text-xs font-semibold cursor-pointer">
                Kupon Aktif (Kullanılabilir)
              </Label>
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
              {isEdit ? 'Güncelle' : 'Oluştur'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
