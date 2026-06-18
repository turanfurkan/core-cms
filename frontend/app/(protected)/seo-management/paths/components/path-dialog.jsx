'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, LoaderCircleIcon, AlertTriangle } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RightDrawer } from '@/components/common/right-drawer';
import { FileUpload } from '@/components/ui/file-upload';
import { toast } from 'sonner';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';

const ROBOTS_OPTIONS = [
  { value: 'index, follow', label: 'Index, Follow (Varsayılan)' },
  { value: 'noindex, nofollow', label: 'Noindex, Nofollow (Taramayı Engelle)' },
  { value: 'noindex, follow', label: 'Noindex, Follow' },
  { value: 'index, nofollow', label: 'Index, Nofollow' },
  { value: 'custom', label: 'Özel Değer Girin...' },
];

export default function PathDialog({ open, closeDialog, pathItem }) {
  const queryClient = useQueryClient();
  const isEdit = !!pathItem;

  // Form States
  const [path, setPath] = useState('');
  const [metaTitle, setMetaTitle] = useState({});
  const [metaDescription, setMetaDescription] = useState({});
  const [metaKeywords, setMetaKeywords] = useState({});
  const [ogTitle, setOgTitle] = useState({});
  const [ogDescription, setOgDescription] = useState({});
  const [ogImageId, setOgImageId] = useState(null);
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [metaRobots, setMetaRobots] = useState('index, follow');
  const [customRobots, setCustomRobots] = useState('');
  const [robotsSelectValue, setRobotsSelectValue] = useState('index, follow');

  // Fetch active languages
  const { data: languagesResponse, isLoading: isLangLoading } = useQuery({
    queryKey: ['admin-languages-active'],
    queryFn: async () => {
      const res = await apiFetch('/api/admin/languages?active_only=true');
      if (!res.ok) throw new Error('Diller yüklenemedi.');
      const json = await res.json();
      return json.data || [];
    },
  });

  const languages = languagesResponse || [{ id: 1, name: 'Türkçe', code: 'tr', is_default: true }];
  const [activeTab, setActiveTab] = useState('tr');

  // Set default tab when languages are loaded
  useEffect(() => {
    if (languages.length > 0) {
      const defaultLang = languages.find((l) => l.is_default) || languages[0];
      setActiveTab(defaultLang.code);
    }
  }, [languagesResponse]);

  // Load pathItem data on edit
  useEffect(() => {
    if (open) {
      if (pathItem) {
        setPath(pathItem.path || '');
        setMetaTitle(pathItem.meta_title || {});
        setMetaDescription(pathItem.meta_description || {});
        setMetaKeywords(pathItem.meta_keywords || {});
        setOgTitle(pathItem.og_title || {});
        setOgDescription(pathItem.og_description || {});
        setOgImageId(pathItem.og_image_id || null);
        setCanonicalUrl(pathItem.canonical_url || '');

        const robotsVal = pathItem.meta_robots || 'index, follow';
        const isStandard = ROBOTS_OPTIONS.some((o) => o.value === robotsVal);
        if (isStandard) {
          setRobotsSelectValue(robotsVal);
          setMetaRobots(robotsVal);
        } else {
          setRobotsSelectValue('custom');
          setCustomRobots(robotsVal);
          setMetaRobots(robotsVal);
        }
      } else {
        setPath('');
        setMetaTitle({});
        setMetaDescription({});
        setMetaKeywords({});
        setOgTitle({});
        setOgDescription({});
        setOgImageId(null);
        setCanonicalUrl('');
        setMetaRobots('index, follow');
        setRobotsSelectValue('index, follow');
        setCustomRobots('');
      }
    }
  }, [open, pathItem]);

  // Handle local state updates for localization inputs
  const handleLocalChange = (langCode, field, val) => {
    if (field === 'title') {
      setMetaTitle((prev) => ({ ...prev, [langCode]: val }));
    } else if (field === 'desc') {
      setMetaDescription((prev) => ({ ...prev, [langCode]: val }));
    } else if (field === 'keywords') {
      setMetaKeywords((prev) => ({ ...prev, [langCode]: val }));
    } else if (field === 'og_title') {
      setOgTitle((prev) => ({ ...prev, [langCode]: val }));
    } else if (field === 'og_desc') {
      setOgDescription((prev) => ({ ...prev, [langCode]: val }));
    }
  };

  const mutation = useMutation({
    mutationFn: async (payload) => {
      const url = isEdit ? `/api/admin/seo/paths/${pathItem.id}` : '/api/admin/seo/paths';
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
        throw new Error(errJson.message || 'SEO yolu kaydedilemedi.');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-seo-paths'] });
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>{isEdit ? 'SEO sayfası başarıyla güncellendi.' : 'Yeni SEO sayfası tanımlandı.'}</AlertTitle>
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

    if (!path.trim()) {
      toast.error('İnceleme yolu (Path) girmelisiniz.');
      return;
    }

    if (!path.startsWith('/')) {
      toast.error('İnceleme yolu eğik çizgi (/) ile başlamalıdır.');
      return;
    }

    if (!/^\/[a-zA-Z0-9_\-\/]*$/.test(path.trim())) {
      toast.error('İnceleme yolu geçersiz karakterler barındırıyor.');
      return;
    }

    // Resolve meta robots string
    const finalRobots = robotsSelectValue === 'custom' ? customRobots.trim() : robotsSelectValue;

    const payload = {
      path: path.trim(),
      meta_title: metaTitle,
      meta_description: metaDescription,
      meta_keywords: metaKeywords,
      og_title: ogTitle,
      og_description: ogDescription,
      og_image_id: ogImageId ? parseInt(String(ogImageId), 10) : null,
      canonical_url: canonicalUrl.trim() || null,
      meta_robots: finalRobots || null,
    };

    mutation.mutate(payload);
  };

  const footerContent = (
    <>
      <Button type="button" variant="outline" onClick={closeDialog}>
        İptal
      </Button>
      <Button type="submit" form="seo-path-form" disabled={mutation.isPending}>
        {mutation.isPending ? (
          <LoaderCircleIcon className="size-4 animate-spin mr-1.5" />
        ) : (
          <Save className="size-4 mr-1.5" />
        )}
        Kaydet
      </Button>
    </>
  );

  return (
    <RightDrawer
      open={open}
      onOpenChange={closeDialog}
      title={isEdit ? `SEO Ayarlarını Düzenle: ${pathItem.path}` : 'Yeni Sayfa SEO Ayarı Tanımla'}
      size="3xl"
      footer={footerContent}
    >
      {isLangLoading ? (
        <div className="flex items-center justify-center py-20">
          <LoaderCircleIcon className="size-8 animate-spin text-primary" />
        </div>
      ) : (
        <form id="seo-path-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Main Path Field */}
          <div className="space-y-1.5">
            <Label htmlFor="path-input" className="text-xs font-semibold text-muted-foreground">
              İnceleme Yolu (Path - "/" ile başlamalıdır)
            </Label>
            <Input
              id="path-input"
              type="text"
              placeholder="Örn: /hakkimizda veya /urunler/saas-hizmeti"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              disabled={isEdit} // Do not change path on edit, delete and recreate if needed
            />
            {isEdit && (
              <p className="text-[10px] text-muted-foreground flex items-center gap-1 select-none">
                <AlertTriangle className="size-3 text-amber-500" /> Kayıtlı yolların adresi güncellenemez. Yeni adres için yeni bir SEO yolu ekleyebilirsiniz.
              </p>
            )}
          </div>

          <hr className="border-border" />

          {/* Multilingual Tabs */}
          <div className="space-y-4">
            <div className="flex items-center justify-between select-none">
              <h3 className="text-sm font-bold text-foreground">Dile Duyarlı SEO Ayarları</h3>
              <p className="text-xs text-muted-foreground">Aktif diller için meta değerleri girin.</p>
            </div>

            {/* Tab Triggers */}
            {languages.length > 1 && (
              <div className="flex border-b border-border select-none gap-1 bg-muted/20 p-1 rounded-lg">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setActiveTab(lang.code)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      activeTab === lang.code
                        ? 'bg-background text-primary shadow-xs font-bold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
                    }`}
                  >
                    {lang.name} ({lang.code.toUpperCase()})
                  </button>
                ))}
              </div>
            )}

            {/* Tab Contents */}
            {languages.map((lang) => {
              if (lang.code !== activeTab) return null;

              return (
                <div key={lang.code} className="space-y-4 pt-1 animation-fade-in">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor={`meta-title-${lang.code}`} className="text-xs font-semibold text-muted-foreground">
                        Meta Başlık ({lang.name})
                      </Label>
                      <Input
                        id={`meta-title-${lang.code}`}
                        type="text"
                        placeholder="Sayfa başlığı (Title Tag)..."
                        value={metaTitle[lang.code] || ''}
                        onChange={(e) => handleLocalChange(lang.code, 'title', e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor={`meta-keywords-${lang.code}`} className="text-xs font-semibold text-muted-foreground">
                        Anahtar Kelimeler ({lang.name} - Virgülle ayırın)
                      </Label>
                      <Input
                        id={`meta-keywords-${lang.code}`}
                        type="text"
                        placeholder="kelime1, kelime2, kelime3..."
                        value={metaKeywords[lang.code] || ''}
                        onChange={(e) => handleLocalChange(lang.code, 'keywords', e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor={`meta-desc-${lang.code}`} className="text-xs font-semibold text-muted-foreground">
                        Meta Açıklama ({lang.name})
                      </Label>
                      <Textarea
                        id={`meta-desc-${lang.code}`}
                        rows={2}
                        placeholder="Arama motoru sonuçlarında listelenecek açıklama..."
                        value={metaDescription[lang.code] || ''}
                        onChange={(e) => handleLocalChange(lang.code, 'desc', e.target.value)}
                      />
                    </div>

                    {/* Social Shares - Open Graph */}
                    <div className="border border-border/60 bg-muted/5 p-4 rounded-xl space-y-4 mt-1">
                      <h4 className="text-xs font-bold text-foreground select-none uppercase tracking-wider">
                        Sosyal Paylaşım Ayarları (Open Graph - {lang.name})
                      </h4>

                      <div className="space-y-1.5">
                        <Label htmlFor={`og-title-${lang.code}`} className="text-xs font-semibold text-muted-foreground">
                          Sosyal Paylaşım Başlığı (Facebook/Twitter)
                        </Label>
                        <Input
                          id={`og-title-${lang.code}`}
                          type="text"
                          placeholder="Boş bırakılırsa standart Meta Başlığı kullanılır..."
                          value={ogTitle[lang.code] || ''}
                          onChange={(e) => handleLocalChange(lang.code, 'og_title', e.target.value)}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor={`og-desc-${lang.code}`} className="text-xs font-semibold text-muted-foreground">
                          Sosyal Paylaşım Açıklaması
                        </Label>
                        <Textarea
                          id={`og-desc-${lang.code}`}
                          rows={2}
                          placeholder="Boş bırakılırsa standart Meta Açıklaması kullanılır..."
                          value={ogDescription[lang.code] || ''}
                          onChange={(e) => handleLocalChange(lang.code, 'og_desc', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <hr className="border-border" />

          {/* Shared Assets/Properties */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground select-none">Global SEO Ayarları</h3>

            {/* Social Share Image Picker */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">
                Paylaşım Görseli (Open Graph Image)
              </Label>
              <FileUpload
                value={ogImageId}
                onChange={setOgImageId}
                isMultiple={false}
                accept="image/*"
                placeholder="Meta görselini sürükleyin veya seçin"
                description="Sosyal ağlarda paylaşıldığında gösterilecek görsel. PNG, JPG formatlarında olmalıdır."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Robots Select */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Arama Motoru Robots Talimatı (Robots Meta)
                </Label>
                <Select
                  value={robotsSelectValue}
                  onValueChange={(val) => {
                    setRobotsSelectValue(val);
                    if (val !== 'custom') {
                      setMetaRobots(val);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROBOTS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Canonical URL */}
              <div className="space-y-1.5">
                <Label htmlFor="canonical-input" className="text-xs font-semibold text-muted-foreground">
                  Canonical URL (Özgün Adres)
                </Label>
                <Input
                  id="canonical-input"
                  type="text"
                  placeholder="Örn: https://sporfest.com.tr/hakkimizda"
                  value={canonicalUrl}
                  onChange={(e) => setCanonicalUrl(e.target.value)}
                />
              </div>

              {/* Custom Robots Input */}
              {robotsSelectValue === 'custom' && (
                <div className="space-y-1.5 md:col-span-2 animation-slide-down">
                  <Label htmlFor="custom-robots-input" className="text-xs font-semibold text-muted-foreground">
                    Özel Robots Talimatı (Custom Robots Tag)
                  </Label>
                  <Input
                    id="custom-robots-input"
                    type="text"
                    placeholder="Örn: noindex, nofollow, noarchive"
                    value={customRobots}
                    onChange={(e) => setCustomRobots(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>
        </form>
      )}
    </RightDrawer>
  );
}
