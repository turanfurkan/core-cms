'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, LoaderCircleIcon, Info } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
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

export default function WidgetDialog({ open, closeDialog, widget }) {
  const queryClient = useQueryClient();
  const isEdit = !!widget;

  // Form states
  const [key, setKey] = useState('');
  const [type, setType] = useState('countdown');
  const [isActive, setIsActive] = useState(true);

  // Config: countdown
  const [countdownTitle, setCountdownTitle] = useState('');
  const [countdownDate, setCountdownDate] = useState('');
  const [countdownBg, setCountdownBg] = useState('#ef4444');

  // Config: highlight
  const [highlightTitle, setHighlightTitle] = useState('');
  const [highlightSubtitle, setHighlightSubtitle] = useState('');
  const [highlightImageUrl, setHighlightImageUrl] = useState('');
  const [highlightBtnText, setHighlightBtnText] = useState('');
  const [highlightBtnLink, setHighlightBtnLink] = useState('');

  useEffect(() => {
    if (open) {
      if (widget) {
        setKey(widget.key || '');
        setType(widget.type || 'countdown');
        setIsActive(widget.is_active ?? true);

        const config = widget.config || {};
        if (widget.type === 'countdown') {
          setCountdownTitle(config.title || '');
          setCountdownBg(config.bg_color || '#ef4444');

          const formatDateTime = (isoStr) => {
            if (!isoStr) return '';
            try {
              return new Date(isoStr).toISOString().slice(0, 16);
            } catch (e) {
              return '';
            }
          };
          setCountdownDate(formatDateTime(config.target_date));
        } else if (widget.type === 'highlight') {
          setHighlightTitle(config.title || '');
          setHighlightSubtitle(config.subtitle || '');
          setHighlightImageUrl(config.image_url || '');
          setHighlightBtnText(config.button_text || '');
          setHighlightBtnLink(config.button_link || '');
        }
      } else {
        setKey('');
        setType('countdown');
        setIsActive(true);

        setCountdownTitle('');
        setCountdownDate('');
        setCountdownBg('#ef4444');

        setHighlightTitle('');
        setHighlightSubtitle('');
        setHighlightImageUrl('');
        setHighlightBtnText('');
        setHighlightBtnLink('');
      }
    }
  }, [open, widget]);

  const mutation = useMutation({
    mutationFn: async (payload) => {
      const url = isEdit
        ? `/api/admin/marketing/widgets/${widget.id}`
        : '/api/admin/marketing/widgets';
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
        throw new Error(errJson.message || 'Widget kaydedilemedi.');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-widgets'] });
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>{isEdit ? 'Widget başarıyla güncellendi.' : 'Yeni widget bileşeni eklendi.'}</AlertTitle>
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

    if (!key.trim()) {
      toast.error('Bileşen Anahtarı (Key) girmelisiniz.');
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(key.trim())) {
      toast.error('Bileşen anahtarı sadece harf, rakam, alt çizgi (_) ve kısa çizgi (-) içerebilir.');
      return;
    }

    // Build config payload
    const configPayload = {};
    if (type === 'countdown') {
      if (!countdownTitle.trim()) {
        toast.error('Geri sayım başlığı girmelisiniz.');
        return;
      }
      if (!countdownDate) {
        toast.error('Geri sayım bitiş tarihi seçmelisiniz.');
        return;
      }
      configPayload.title = countdownTitle.trim();
      configPayload.target_date = new Date(countdownDate).toISOString();
      configPayload.bg_color = countdownBg.trim();
    } else if (type === 'highlight') {
      if (!highlightTitle.trim()) {
        toast.error('Öne çıkarılan alan başlığı girmelisiniz.');
        return;
      }
      configPayload.title = highlightTitle.trim();
      configPayload.subtitle = highlightSubtitle.trim();
      configPayload.image_url = highlightImageUrl.trim();
      configPayload.button_text = highlightBtnText.trim();
      configPayload.button_link = highlightBtnLink.trim();
    }

    const payload = {
      key: key.trim(),
      type,
      config: configPayload,
      is_active: isActive,
    };

    mutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Widget Bileşenini Düzenle' : 'Yeni Widget Ekle'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-4 max-h-[80vh] overflow-y-auto">
            {/* Widget Key */}
            <div className="space-y-1.5">
              <Label htmlFor="widget-key" className="text-xs font-semibold text-muted-foreground">
                Widget Anahtarı (Key - Benzersiz)
              </Label>
              <Input
                id="widget-key"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Örn: home_top_countdown, sidebar_highlight"
                className="font-mono text-xs"
                disabled={isEdit}
              />
            </div>

            {/* Widget Type (Select) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Widget Türü</Label>
              <Select value={type} onValueChange={setType} disabled={isEdit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="countdown">Geri Sayım Sayacı (Countdown)</SelectItem>
                  <SelectItem value="highlight">Öne Çıkarılan Alan (Highlight)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Config Fields */}
            <div className="border-t border-border pt-3.5 space-y-4">
              <div className="flex items-center gap-1.5 mb-2 select-none text-[11px] text-muted-foreground bg-muted px-2.5 py-1.5 rounded">
                <Info className="size-3.5 text-primary" />
                <span>Widget türüne ait yapılandırma (config) ayarları aşağıdadır.</span>
              </div>

              {/* COUNTDOWN CONFIG */}
              {type === 'countdown' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="cd-title" className="text-xs font-semibold text-muted-foreground">
                      Geri Sayım Başlığı
                    </Label>
                    <Input
                      id="cd-title"
                      value={countdownTitle}
                      onChange={(e) => setCountdownTitle(e.target.value)}
                      placeholder="Örn: Büyük Kış Fırsatları Başlıyor!"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cd-date" className="text-xs font-semibold text-muted-foreground">
                      Bitiş Zamanı (Target Date)
                    </Label>
                    <Input
                      id="cd-date"
                      type="datetime-local"
                      value={countdownDate}
                      onChange={(e) => setCountdownDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cd-bg" className="text-xs font-semibold text-muted-foreground">
                      Arka Plan Rengi
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="cd-bg"
                        type="color"
                        value={countdownBg}
                        onChange={(e) => setCountdownBg(e.target.value)}
                        className="w-12 h-10 p-1 cursor-pointer shrink-0"
                      />
                      <Input
                        type="text"
                        value={countdownBg}
                        onChange={(e) => setCountdownBg(e.target.value)}
                        placeholder="#ef4444"
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* HIGHLIGHT CONFIG */}
              {type === 'highlight' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="hl-title" className="text-xs font-semibold text-muted-foreground">
                      Başlık
                    </Label>
                    <Input
                      id="hl-title"
                      value={highlightTitle}
                      onChange={(e) => setHighlightTitle(e.target.value)}
                      placeholder="Örn: Premium Hizmetlerimiz"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="hl-subtitle" className="text-xs font-semibold text-muted-foreground">
                      Alt Başlık / Açıklama
                    </Label>
                    <Input
                      id="hl-subtitle"
                      value={highlightSubtitle}
                      onChange={(e) => setHighlightSubtitle(e.target.value)}
                      placeholder="Örn: Sizler için özel tasarlanmış lüks paketleri keşfedin."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="hl-img" className="text-xs font-semibold text-muted-foreground">
                      Görsel URL
                    </Label>
                    <Input
                      id="hl-img"
                      value={highlightImageUrl}
                      onChange={(e) => setHighlightImageUrl(e.target.value)}
                      placeholder="https://s3.amazonaws.com/bucket/highlight.jpg"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="hl-btn-txt" className="text-xs font-semibold text-muted-foreground">
                        Buton Metni
                      </Label>
                      <Input
                        id="hl-btn-txt"
                        value={highlightBtnText}
                        onChange={(e) => setHighlightBtnText(e.target.value)}
                        placeholder="Katalog İncele"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="hl-btn-lnk" className="text-xs font-semibold text-muted-foreground">
                        Buton Yönlendirme Linki
                      </Label>
                      <Input
                        id="hl-btn-lnk"
                        value={highlightBtnLink}
                        onChange={(e) => setHighlightBtnLink(e.target.value)}
                        placeholder="/hizmetler"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Active Switch */}
            <div className="flex items-center gap-2.5 select-none pt-2 border-t border-border">
              <Switch id="widget-active" checked={isActive} onCheckedChange={setIsActive} />
              <Label htmlFor="widget-active" className="text-xs font-semibold cursor-pointer">
                Widget Aktif (Yayınlansın)
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
