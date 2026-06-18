'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, LoaderCircleIcon, Info, Sparkles, Megaphone, Tv } from 'lucide-react';
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

export default function PromotionDialog({ open, closeDialog, promotion }) {
  const queryClient = useQueryClient();
  const isEdit = !!promotion;

  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState('banner');
  const [isActive, setIsActive] = useState(true);

  // Content states (banner)
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [bannerLinkUrl, setBannerLinkUrl] = useState('');
  const [bannerAltText, setBannerAltText] = useState('');

  // Content states (popup)
  const [popupTitle, setPopupTitle] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const [popupBtnText, setPopupBtnText] = useState('');
  const [popupBtnLink, setPopupBtnLink] = useState('');
  const [popupImageUrl, setPopupImageUrl] = useState('');

  // Content states (announcement)
  const [announcementMsg, setAnnouncementMsg] = useState('');
  const [announcementBg, setAnnouncementBg] = useState('#3b82f6');
  const [announcementColor, setAnnouncementColor] = useState('#ffffff');
  const [announcementLink, setAnnouncementLink] = useState('');

  // Rules states
  const [startsAt, setStartsAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [targetDevice, setTargetDevice] = useState('all');

  useEffect(() => {
    if (open) {
      if (promotion) {
        setName(promotion.name || '');
        setType(promotion.type || 'banner');
        setIsActive(promotion.is_active ?? true);

        // Populate content fields
        const content = promotion.content || {};
        if (promotion.type === 'banner') {
          setBannerImageUrl(content.image_url || '');
          setBannerLinkUrl(content.link_url || '');
          setBannerAltText(content.alt_text || '');
        } else if (promotion.type === 'popup') {
          setPopupTitle(content.title || '');
          setPopupMessage(content.message || '');
          setPopupBtnText(content.button_text || '');
          setPopupBtnLink(content.button_link || '');
          setPopupImageUrl(content.image_url || '');
        } else if (promotion.type === 'announcement') {
          setAnnouncementMsg(content.message || '');
          setAnnouncementBg(content.bg_color || '#3b82f6');
          setAnnouncementColor(content.text_color || '#ffffff');
          setAnnouncementLink(content.link_url || '');
        }

        // Populate rules fields
        const rules = promotion.rules || {};
        // Strip timezone suffix from ISO string to match datetime-local inputs: "YYYY-MM-DDTHH:MM"
        const formatDateTime = (isoStr) => {
          if (!isoStr) return '';
          try {
            return new Date(isoStr).toISOString().slice(0, 16);
          } catch (e) {
            return '';
          }
        };

        setStartsAt(formatDateTime(rules.starts_at));
        setExpiresAt(formatDateTime(rules.expires_at));
        setTargetDevice(rules.target_device || 'all');
      } else {
        setName('');
        setType('banner');
        setIsActive(true);

        setBannerImageUrl('');
        setBannerLinkUrl('');
        setBannerAltText('');

        setPopupTitle('');
        setPopupMessage('');
        setPopupBtnText('');
        setPopupBtnLink('');
        setPopupImageUrl('');

        setAnnouncementMsg('');
        setAnnouncementBg('#3b82f6');
        setAnnouncementColor('#ffffff');
        setAnnouncementLink('');

        setStartsAt('');
        setExpiresAt('');
        setTargetDevice('all');
      }
    }
  }, [open, promotion]);

  const mutation = useMutation({
    mutationFn: async (payload) => {
      const url = isEdit
        ? `/api/admin/marketing/promotions/${promotion.id}`
        : '/api/admin/marketing/promotions';
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
        throw new Error(errJson.message || 'Kampanya kaydedilemedi.');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promotions'] });
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>{isEdit ? 'Kampanya başarıyla güncellendi.' : 'Yeni kampanya oluşturuldu.'}</AlertTitle>
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

    // Build content payload
    const contentPayload = {};
    if (type === 'banner') {
      if (!bannerImageUrl.trim()) {
        toast.error('Görsel URL\'si girmelisiniz.');
        return;
      }
      contentPayload.image_url = bannerImageUrl.trim();
      contentPayload.link_url = bannerLinkUrl.trim();
      contentPayload.alt_text = bannerAltText.trim();
    } else if (type === 'popup') {
      if (!popupTitle.trim()) {
        toast.error('Popup Başlığı girmelisiniz.');
        return;
      }
      if (!popupMessage.trim()) {
        toast.error('Popup Mesajı girmelisiniz.');
        return;
      }
      contentPayload.title = popupTitle.trim();
      contentPayload.message = popupMessage.trim();
      contentPayload.button_text = popupBtnText.trim();
      contentPayload.button_link = popupBtnLink.trim();
      contentPayload.image_url = popupImageUrl.trim();
    } else if (type === 'announcement') {
      if (!announcementMsg.trim()) {
        toast.error('Duyuru Mesajı girmelisiniz.');
        return;
      }
      contentPayload.message = announcementMsg.trim();
      contentPayload.bg_color = announcementBg.trim();
      contentPayload.text_color = announcementColor.trim();
      contentPayload.link_url = announcementLink.trim();
    }

    // Build rules payload
    const rulesPayload = {
      starts_at: startsAt ? new Date(startsAt).toISOString() : null,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      target_device: targetDevice,
    };

    const payload = {
      name: name.trim(),
      type,
      content: contentPayload,
      rules: rulesPayload,
      is_active: isActive,
    };

    mutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent className="max-w-xl w-full">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Kampanyayı Düzenle' : 'Yeni Kampanya Ekle'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-4 max-h-[80vh] overflow-y-auto">
            {/* Kampanya Adı */}
            <div className="space-y-1.5">
              <Label htmlFor="promo-name" className="text-xs font-semibold text-muted-foreground">
                Kampanya Adı
              </Label>
              <Input
                id="promo-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: 2026 Kış Sezonu İndirimi"
              />
            </div>

            {/* Kampanya Türü (Select) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Kampanya Türü</Label>
              <Select value={type} onValueChange={setType} disabled={isEdit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="banner">Görsel Banner (Slider/Kutu)</SelectItem>
                  <SelectItem value="popup">Popup Modal (Giriş Karşılaması)</SelectItem>
                  <SelectItem value="announcement">Duyuru Çubuğu (Bar)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dinamik İçerik Alanları */}
            <div className="border-t border-border pt-3.5 space-y-4">
              <div className="flex items-center gap-1.5 mb-2 select-none text-[11px] text-muted-foreground bg-muted px-2.5 py-1.5 rounded">
                <Info className="size-3.5 text-primary" />
                <span>Tür ayarına göre dinamik içerik parametreleri gösterilmektedir.</span>
              </div>

              {/* BANNER FORMS */}
              {type === 'banner' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="banner-img" className="text-xs font-semibold text-muted-foreground">
                      Görsel URL
                    </Label>
                    <Input
                      id="banner-img"
                      value={bannerImageUrl}
                      onChange={(e) => setBannerImageUrl(e.target.value)}
                      placeholder="https://s3.amazonaws.com/bucket/resim.jpg"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="banner-link" className="text-xs font-semibold text-muted-foreground">
                        Yönlendirme URL'i (Link)
                      </Label>
                      <Input
                        id="banner-link"
                        value={bannerLinkUrl}
                        onChange={(e) => setBannerLinkUrl(e.target.value)}
                        placeholder="/urunler/kis-sezonu"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="banner-alt" className="text-xs font-semibold text-muted-foreground">
                        Alternatif Metin (Alt Text)
                      </Label>
                      <Input
                        id="banner-alt"
                        value={bannerAltText}
                        onChange={(e) => setBannerAltText(e.target.value)}
                        placeholder="Örn: Kış sezonu indirim reklamı"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* POPUP FORMS */}
              {type === 'popup' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="popup-title" className="text-xs font-semibold text-muted-foreground">
                      Popup Başlığı
                    </Label>
                    <Input
                      id="popup-title"
                      value={popupTitle}
                      onChange={(e) => setPopupTitle(e.target.value)}
                      placeholder="Hoş Geldiniz!"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="popup-msg" className="text-xs font-semibold text-muted-foreground">
                      Popup Mesajı
                    </Label>
                    <Textarea
                      id="popup-msg"
                      rows={3}
                      value={popupMessage}
                      onChange={(e) => setPopupMessage(e.target.value)}
                      placeholder="Hemen kayıt olun ve ilk siparişte %10 indirim kazanın."
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="popup-btn-txt" className="text-xs font-semibold text-muted-foreground">
                        Buton Metni
                      </Label>
                      <Input
                        id="popup-btn-txt"
                        value={popupBtnText}
                        onChange={(e) => setPopupBtnText(e.target.value)}
                        placeholder="Detayları Gör"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="popup-btn-lnk" className="text-xs font-semibold text-muted-foreground">
                        Buton Linki
                      </Label>
                      <Input
                        id="popup-btn-lnk"
                        value={popupBtnLink}
                        onChange={(e) => setPopupBtnLink(e.target.value)}
                        placeholder="/kampanyalar"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="popup-img" className="text-xs font-semibold text-muted-foreground">
                      Popup Görsel URL'i (Opsiyonel)
                    </Label>
                    <Input
                      id="popup-img"
                      value={popupImageUrl}
                      onChange={(e) => setPopupImageUrl(e.target.value)}
                      placeholder="https://s3.amazonaws.com/bucket/popup-img.jpg"
                    />
                  </div>
                </div>
              )}

              {/* ANNOUNCEMENT FORMS */}
              {type === 'announcement' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="ann-msg" className="text-xs font-semibold text-muted-foreground">
                      Duyuru Metni
                    </Label>
                    <Input
                      id="ann-msg"
                      value={announcementMsg}
                      onChange={(e) => setAnnouncementMsg(e.target.value)}
                      placeholder="Tüm ürünlerde kargo ücretsiz! Son 2 gün."
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="ann-bg" className="text-xs font-semibold text-muted-foreground">
                        Arka Plan Rengi
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="ann-bg"
                          type="color"
                          value={announcementBg}
                          onChange={(e) => setAnnouncementBg(e.target.value)}
                          className="w-12 h-10 p-1 cursor-pointer shrink-0"
                        />
                        <Input
                          type="text"
                          value={announcementBg}
                          onChange={(e) => setAnnouncementBg(e.target.value)}
                          placeholder="#3b82f6"
                          className="font-mono text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ann-color" className="text-xs font-semibold text-muted-foreground">
                        Yazı Rengi
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="ann-color"
                          type="color"
                          value={announcementColor}
                          onChange={(e) => setAnnouncementColor(e.target.value)}
                          className="w-12 h-10 p-1 cursor-pointer shrink-0"
                        />
                        <Input
                          type="text"
                          value={announcementColor}
                          onChange={(e) => setAnnouncementColor(e.target.value)}
                          placeholder="#ffffff"
                          className="font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ann-link" className="text-xs font-semibold text-muted-foreground">
                      Yönlendirme Linki (Opsiyonel)
                    </Label>
                    <Input
                      id="ann-link"
                      value={announcementLink}
                      onChange={(e) => setAnnouncementLink(e.target.value)}
                      placeholder="/kampanya-detay"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Zaman & Hedef Kuralları (Date Ranges, Target Devices) */}
            <div className="border-t border-border pt-3.5 space-y-4">
              <Label className="text-xs font-bold text-foreground">Gösterim Kuralları (Rules)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="starts-at" className="text-xs font-semibold text-muted-foreground">
                    Başlangıç Tarihi
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
                    Bitiş Tarihi
                  </Label>
                  <Input
                    id="expires-at"
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Hedef Cihazlar (Device)</Label>
                <Select value={targetDevice} onValueChange={setTargetDevice}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Cihazlar (Masaüstü ve Mobil)</SelectItem>
                    <SelectItem value="desktop">Sadece Masaüstü (Desktop)</SelectItem>
                    <SelectItem value="mobile">Sadece Mobil (Mobile)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Switch */}
            <div className="flex items-center gap-2.5 select-none pt-2.5 border-t border-border">
              <Switch id="promo-active" checked={isActive} onCheckedChange={setIsActive} />
              <Label htmlFor="promo-active" className="text-xs font-semibold cursor-pointer">
                Kampanya Aktif (Yayınlansın)
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
