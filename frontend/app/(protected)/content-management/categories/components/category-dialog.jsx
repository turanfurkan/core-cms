'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Save, Check, LoaderCircleIcon, Globe, Plus, Trash2, ArrowUp, ArrowDown, Layers, Info, Sliders } from 'lucide-react';
import RichTextEditor from '@/components/common/rich-text-editor';
import { useTranslation } from '@/hooks/useTranslation';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RightDrawer } from '@/components/common/right-drawer';
import { FileUpload } from '@/components/ui/file-upload';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';

const CATEGORY_TYPES = [
  { value: 'race', label: 'Yarışlar (Races)' },
  { value: 'blog', label: 'Yazılar (Blog)' },
  { value: 'portfolio', label: 'Projeler / Portfolyo' },
  { value: 'service', label: 'Hizmetler / Ürünler' },
  { value: 'partner', label: 'Sponsorlar (Sponsors)' },
  { value: 'general', label: 'Genel (General)' },
];

export default function CategoryDialog({ open, closeDialog, category }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isEdit = !!category?.id;

  const [activeLang, setActiveLang] = useState('tr');
  const [activeMainTab, setActiveMainTab] = useState('general');

  const defaultFieldSettings = {
    gpx_file: true,
    strava_file: true,
    strava_embed: true,
    route_graphic: true,
    youtube_embed: true,
    gallery: true,
    distance: true,
    elevation: true,
    descent: true,
    start_finish_points: true,
    pricing_details: true,
    registration_details: true,
    manager_details: true,
    age_groups: '',
  };

  // Form states
  const [name, setName] = useState({ tr: '', en: '' });
  const [slug, setSlug] = useState({ tr: '', en: '' });
  const [description, setDescription] = useState({ tr: '', en: '' });
  const [imageId, setImageId] = useState(null);
  const [parentId, setParentId] = useState('none');
  const [type, setType] = useState('race');
  const [isActive, setIsActive] = useState(true);
  const [fieldSettings, setFieldSettings] = useState(defaultFieldSettings);
  const [tabsList, setTabsList] = useState([]);

  const handleAddTab = () => {
    const newKey = `tab_${Date.now()}`;
    setTabsList((prev) => [
      ...prev,
      {
        id: newKey,
        title: { tr: '', en: '' },
        content: { tr: '', en: '' },
        is_active: true,
      },
    ]);
  };

  const handleUpdateTab = (id, field, lang, value) => {
    setTabsList((prev) =>
      prev.map((tab) => {
        if (tab.id !== id) return tab;
        if (lang) {
          return {
            ...tab,
            [field]: {
              ...tab[field],
              [lang]: value,
            },
          };
        }
        return {
          ...tab,
          [field]: value,
        };
      })
    );
  };

  const handleDeleteTab = (id) => {
    setTabsList((prev) => prev.filter((tab) => tab.id !== id));
  };

  const handleMoveTab = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= tabsList.length) return;
    const updated = [...tabsList];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    setTabsList(updated);
  };

  // Fetch categories for parent selection
  const { data: categoriesList } = useQuery({
    queryKey: ['admin-categories-all'],
    queryFn: async () => {
      const res = await apiFetch('/api/admin/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      const json = await res.json();
      return json.data || [];
    },
  });

  // Populate data when editing
  useEffect(() => {
    if (open) {
      setActiveLang('tr');
      setActiveMainTab('general');
      if (category) {
        setName({
          tr: category.name?.tr || '',
          en: category.name?.en || '',
        });
        setSlug({
          tr: category.slug?.tr || '',
          en: category.slug?.en || '',
        });
        setDescription({
          tr: category.description?.tr || '',
          en: category.description?.en || '',
        });
        setImageId(category.image_id || null);
        setParentId(category.parent_id ? String(category.parent_id) : 'none');
        setType(category.type || 'race');
        setIsActive(category.is_active !== false);
        setFieldSettings({
          ...defaultFieldSettings,
          ...(category.field_settings || {}),
        });
        setTabsList(category.tabs || []);
      } else {
        setName({ tr: '', en: '' });
        setSlug({ tr: '', en: '' });
        setDescription({ tr: '', en: '' });
        setImageId(null);
        setParentId('none');
        setType('race');
        setIsActive(true);
        setFieldSettings(defaultFieldSettings);
        setTabsList([]);
      }
    }
  }, [open, category]);

  // Handle name input change and auto-slugify
  const handleNameChange = (lang, value) => {
    setName((prev) => ({ ...prev, [lang]: value }));
    
    // Auto slug generation (TR slug from TR name, EN slug from EN name)
    const generatedSlug = value
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    
    setSlug((prev) => ({ ...prev, [lang]: generatedSlug }));
  };

  // Mutation
  const mutation = useMutation({
    mutationFn: async (payload) => {
      const url = isEdit
        ? `/api/admin/categories/${category.id}`
        : '/api/admin/categories';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Failed to save category');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin-categories-all'] });
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>
              {isEdit 
                ? 'Kategori başarıyla güncellendi.' 
                : 'Yeni kategori başarıyla oluşturuldu.'
              }
            </AlertTitle>
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
            <AlertTitle>{err.message || 'Kategori kaydedilemedi.'}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
    },
  });

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!name.tr) {
      toast.error('Türkçe kategori adı girmek zorunludur.');
      return;
    }

    const payload = {
      name,
      slug,
      description,
      image_id: imageId,
      parent_id: parentId === 'none' ? null : Number(parentId),
      type,
      is_active: isActive,
      field_settings: type === 'race' ? fieldSettings : null,
      tabs: type === 'race' ? tabsList : null,
    };

    mutation.mutate(payload);
  };

  // Exclude current category and its children from parent list to prevent loops
  const parentOptions = (categoriesList || []).filter((c) => {
    if (!isEdit) return true;
    return c.id !== category.id && c.parent_id !== category.id;
  });

  const footerContent = (
    <div className="flex justify-end gap-2 w-full">
      <Button type="button" variant="outline" onClick={closeDialog} className="h-9 rounded-lg">
        İptal
      </Button>
      <Button
        type="submit"
        onClick={handleSubmit}
        disabled={mutation.isPending}
        className="gap-1.5 h-9 rounded-lg"
      >
        {mutation.isPending ? (
          <LoaderCircleIcon className="size-4 animate-spin" />
        ) : (
          <Save className="size-4" />
        )}
        {isEdit ? 'Güncelle' : 'Kaydet'}
      </Button>
    </div>
  );

  return (
    <RightDrawer
      open={open}
      onOpenChange={closeDialog}
      title={isEdit ? `Kategori Düzenle: ${category.name?.tr}` : 'Kategori Oluştur'}
      size="2xl"
      footer={footerContent}
    >
      <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="w-full">
        {type === 'race' && (
          <TabsList variant="line" className="w-full justify-start bg-transparent pb-0 mb-6 border-b border-border flex shrink-0">
            <TabsTrigger value="general" className="gap-1.5 text-xs font-bold py-2">
              <Info className="size-3.5" /> Genel Bilgiler
            </TabsTrigger>
            <TabsTrigger value="field_settings" className="gap-1.5 text-xs font-bold py-2">
              <Sliders className="size-3.5" /> Yarış Formu Ayarları
            </TabsTrigger>
            <TabsTrigger value="tabs" className="gap-1.5 text-xs font-bold py-2">
              <Layers className="size-3.5" /> Sekmeler
            </TabsTrigger>
          </TabsList>
        )}

        <TabsContent value="general" className="space-y-6 mt-0">
          {/* Language Tabs for Localized Inputs */}
          <Tabs value={activeLang} onValueChange={setActiveLang} className="w-full">
            <TabsList variant="line" size="sm" className="w-fit bg-transparent pb-0 mb-4">
              <TabsTrigger value="tr" className="gap-1.5">
                <Globe className="size-3.5" /> Türkçe
              </TabsTrigger>
              <TabsTrigger value="en" className="gap-1.5">
                <Globe className="size-3.5" /> English
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tr" className="space-y-4 mt-0">
              <div className="space-y-1.5">
                <Label htmlFor="cat-name-tr">Kategori Adı (TR) <span className="text-red-500">*</span></Label>
                <Input
                  id="cat-name-tr"
                  value={name.tr}
                  onChange={(e) => handleNameChange('tr', e.target.value)}
                  placeholder="Örn: Granfondo Bisiklet Yarışları"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cat-slug-tr">Slug (TR)</Label>
                <Input
                  id="cat-slug-tr"
                  value={slug.tr}
                  onChange={(e) => setSlug((prev) => ({ ...prev, tr: e.target.value }))}
                  placeholder="granfondo-bisiklet-yarislari"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cat-desc-tr">Açıklama (TR)</Label>
                <Textarea
                  id="cat-desc-tr"
                  value={description.tr}
                  onChange={(e) => setDescription((prev) => ({ ...prev, tr: e.target.value }))}
                  placeholder="Kategori açıklaması..."
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="en" className="space-y-4 mt-0">
              <div className="space-y-1.5">
                <Label htmlFor="cat-name-en">Kategori Adı (EN)</Label>
                <Input
                  id="cat-name-en"
                  value={name.en}
                  onChange={(e) => handleNameChange('en', e.target.value)}
                  placeholder="e.g. Granfondo Cycling Races"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cat-slug-en">Slug (EN)</Label>
                <Input
                  id="cat-slug-en"
                  value={slug.en}
                  onChange={(e) => setSlug((prev) => ({ ...prev, en: e.target.value }))}
                  placeholder="granfondo-cycling-races"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cat-desc-en">Açıklama (EN)</Label>
                <Textarea
                  id="cat-desc-en"
                  value={description.en}
                  onChange={(e) => setDescription((prev) => ({ ...prev, en: e.target.value }))}
                  placeholder="Category description..."
                  rows={3}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="h-px bg-border my-6" />

          {/* General Meta Settings */}
          <div className="space-y-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Kategori Ayarları</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category Type Selection */}
              <div className="space-y-1.5">
                <Label>İçerik Türü (Category Type)</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="bg-card">
                    <SelectValue placeholder="İçerik türünü seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Parent Category Hierarchy Selection */}
              <div className="space-y-1.5">
                <Label>Üst Kategori (Parent Category)</Label>
                <Select value={parentId} onValueChange={setParentId}>
                  <SelectTrigger className="bg-card">
                    <SelectValue placeholder="Yok (Ana Kategori)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Yok (Ana Kategori)</SelectItem>
                    {parentOptions.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name?.tr} ({c.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Image Picker */}
            <div className="space-y-2">
              <Label>Kategori Görseli (Cover Image)</Label>
              <FileUpload
                value={imageId ? [imageId] : []}
                onChange={(val) => setImageId(val && val.length > 0 ? val[0] : null)}
                isMultiple={false}
                placeholder="Görsel yükle veya kütüphaneden seç..."
              />
            </div>

            {/* Is Active Status Switch */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-foreground block">Durum (Is Active)</span>
                <span className="text-[10px] text-muted-foreground block">
                  Kategorinin web sitesinde aktif olarak listelenip listelenmeyeceğini belirler.
                </span>
              </div>
              <Switch id="cat-is-active" checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>
        </TabsContent>

        {type === 'race' && (
          <TabsContent value="tabs" className="space-y-6 mt-0">
            <div className="flex justify-between items-center mb-4">
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-foreground">Detay Sayfası Sekmeleri</h4>
                <p className="text-xs text-muted-foreground">Bu kategorideki yarışların detay sayfalarında gösterilecek sekmeler.</p>
              </div>
              <Button type="button" onClick={handleAddTab} size="sm" className="gap-1.5">
                <Plus className="size-3.5" /> Yeni Sekme Ekle
              </Button>
            </div>

            {tabsList.length > 0 && (
              <Tabs value={activeLang} onValueChange={setActiveLang} className="w-full mb-4">
                <TabsList variant="line" size="sm" className="w-fit bg-transparent pb-0">
                  <TabsTrigger value="tr" className="gap-1.5">
                    <Globe className="size-3.5" /> Türkçe
                  </TabsTrigger>
                  <TabsTrigger value="en" className="gap-1.5">
                    <Globe className="size-3.5" /> English
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}

            {tabsList.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-border rounded-xl">
                <p className="text-sm text-muted-foreground">Henüz sekme eklenmemiş. "Yeni Sekme Ekle" butonunu kullanarak başlayabilirsiniz.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tabsList.map((tab, idx) => (
                  <div key={tab.id} className="p-4 border border-border rounded-xl bg-card space-y-4 shadow-sm relative">
                    {/* Tab Header Row */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                      <div className="flex items-center gap-2">
                        {/* Order Buttons */}
                        <div className="flex items-center gap-1 border border-border rounded-lg p-0.5 bg-muted/20">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMoveTab(idx, 'up')}
                            disabled={idx === 0}
                            className="size-6 rounded-md"
                          >
                            <ArrowUp className="size-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMoveTab(idx, 'down')}
                            disabled={idx === tabsList.length - 1}
                            className="size-6 rounded-md"
                          >
                            <ArrowDown className="size-3" />
                          </Button>
                        </div>
                        <span className="text-xs font-bold text-muted-foreground">#{idx + 1}</span>
                        {/* Tab Key Input */}
                        <div className="flex items-center gap-1.5">
                          <Label className="text-xs text-muted-foreground shrink-0">Sekme Kodu:</Label>
                          <Input
                            value={tab.id}
                            onChange={(e) => handleUpdateTab(tab.id, 'id', null, e.target.value)}
                            placeholder="örn: rules"
                            className="h-8 text-xs font-mono w-32 bg-muted/10"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Active Toggle */}
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground">Aktif:</Label>
                          <Switch
                            checked={tab.is_active !== false}
                            onCheckedChange={(val) => handleUpdateTab(tab.id, 'is_active', null, val)}
                          />
                        </div>
                        {/* Delete button */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTab(tab.id)}
                          className="size-8 text-destructive hover:bg-destructive/10 rounded-lg"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Tab Title & Content */}
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Sekme Başlığı ({activeLang.toUpperCase()})</Label>
                        <Input
                          value={tab.title?.[activeLang] || ''}
                          onChange={(e) => handleUpdateTab(tab.id, 'title', activeLang, e.target.value)}
                          placeholder={activeLang === 'tr' ? "Yarış Kuralları" : "Race Rules"}
                          className="h-9 text-xs bg-card"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Sekme İçeriği ({activeLang.toUpperCase()})</Label>
                        <RichTextEditor
                          value={tab.content?.[activeLang] || ''}
                          onChange={(val) => handleUpdateTab(tab.id, 'content', activeLang, val)}
                          placeholder={activeLang === 'tr' ? "Sekme içeriğini buraya girin..." : "Enter tab content here..."}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        )}

        {type === 'race' && (
          <TabsContent value="field_settings" className="space-y-6 mt-0">
            <div className="space-y-5">
              <div className="p-4 rounded-xl border border-blue-500/10 bg-blue-500/5 text-xs text-blue-600 dark:text-blue-400 font-medium leading-relaxed">
                ℹ️ Bu kategoriye bağlı yarışların ekleme/düzenleme formunda gösterilecek alanları seçin. Kapatılan alanlar formdan gizlenecektir.
              </div>

              {/* Group: Yaş Grupları Tanımlama */}
              <div className="space-y-4 rounded-xl border border-border/80 bg-card p-4">
                <h5 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 border-b pb-1.5 mb-2">Yaş Grupları Ayarı</h5>
                <div className="space-y-2">
                  <Label className="text-xs font-bold">Yarış Yaş Kategorileri (Virgülle ayırarak)</Label>
                  <Input 
                    type="text"
                    placeholder="Örn: 18-21, 22-27, 28-33, 34-39, 40-45, 46-51, 52-57, 58-63, 64-69, 70+"
                    value={fieldSettings.age_groups || ''}
                    onChange={(e) => setFieldSettings(p => ({ ...p, age_groups: e.target.value }))}
                    className="h-10 bg-zinc-50/50 dark:bg-zinc-900/10"
                  />
                  <span className="text-[10px] text-muted-foreground block leading-normal">
                    Bu kategori altındaki tüm yarışlarda katılımcıların listeleneceği yaş aralıklarını belirler. Boş bırakılırsa varsayılan dinamik bölünme uygulanır.
                  </span>
                </div>
              </div>

              {/* Group 1: Medya & Harita */}
              <div className="space-y-4 rounded-xl border border-border/80 bg-card p-4">
                <h5 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 border-b pb-1.5 mb-2">Medya & Harita Ayarları</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-bold">GPX Parkur Dosyası</Label>
                      <span className="text-[9px] text-muted-foreground block">GPX yükleme alanını gösterir.</span>
                    </div>
                    <Switch checked={fieldSettings.gpx_file} onCheckedChange={(val) => setFieldSettings(p => ({ ...p, gpx_file: val }))} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-bold">Strava Rota Dosyası</Label>
                      <span className="text-[9px] text-muted-foreground block">Strava yükleme alanını gösterir.</span>
                    </div>
                    <Switch checked={fieldSettings.strava_file} onCheckedChange={(val) => setFieldSettings(p => ({ ...p, strava_file: val }))} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-bold">Strava Harita Embed</Label>
                      <span className="text-[9px] text-muted-foreground block">Strava Iframe kod giriş alanını gösterir.</span>
                    </div>
                    <Switch checked={fieldSettings.strava_embed} onCheckedChange={(val) => setFieldSettings(p => ({ ...p, strava_embed: val }))} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-bold">Parkur Grafiği</Label>
                      <span className="text-[9px] text-muted-foreground block">Görsel parkur grafiği yükleme alanını gösterir.</span>
                    </div>
                    <Switch checked={fieldSettings.route_graphic} onCheckedChange={(val) => setFieldSettings(p => ({ ...p, route_graphic: val }))} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-bold">YouTube Video Linki</Label>
                      <span className="text-[9px] text-muted-foreground block">Youtube video entegrasyon alanını gösterir.</span>
                    </div>
                    <Switch checked={fieldSettings.youtube_embed} onCheckedChange={(val) => setFieldSettings(p => ({ ...p, youtube_embed: val }))} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-bold">Yarış Galerisi</Label>
                      <span className="text-[9px] text-muted-foreground block">Çoklu fotoğraf galerisi yükleme alanını gösterir.</span>
                    </div>
                    <Switch checked={fieldSettings.gallery} onCheckedChange={(val) => setFieldSettings(p => ({ ...p, gallery: val }))} />
                  </div>
                </div>
              </div>

              {/* Group 2: Parkur Detayları */}
              <div className="space-y-4 rounded-xl border border-border/80 bg-card p-4">
                <h5 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 border-b pb-1.5 mb-2">Parkur Detayları</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-bold">Parkur Mesafesi</Label>
                      <span className="text-[9px] text-muted-foreground block">Mesafe (km/m) girişini gösterir.</span>
                    </div>
                    <Switch checked={fieldSettings.distance} onCheckedChange={(val) => setFieldSettings(p => ({ ...p, distance: val }))} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-bold">Yükseklik Kazanımı</Label>
                      <span className="text-[9px] text-muted-foreground block">Elevation gain girişini gösterir.</span>
                    </div>
                    <Switch checked={fieldSettings.elevation} onCheckedChange={(val) => setFieldSettings(p => ({ ...p, elevation: val }))} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-bold">İniş Kazanımı</Label>
                      <span className="text-[9px] text-muted-foreground block">Descent gain girişini gösterir.</span>
                    </div>
                    <Switch checked={fieldSettings.descent} onCheckedChange={(val) => setFieldSettings(p => ({ ...p, descent: val }))} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-bold">Başlangıç & Bitiş Noktaları</Label>
                      <span className="text-[9px] text-muted-foreground block">Nokta adı girişlerini gösterir.</span>
                    </div>
                    <Switch checked={fieldSettings.start_finish_points} onCheckedChange={(val) => setFieldSettings(p => ({ ...p, start_finish_points: val }))} />
                  </div>
                </div>
              </div>

              {/* Group 3: Satış & Kayıt & Sorumlu */}
              <div className="space-y-4 rounded-xl border border-border/80 bg-card p-4">
                <h5 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 border-b pb-1.5 mb-2">Satış, Kayıt & Yönetim</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-bold">Fiyat Bilgileri</Label>
                      <span className="text-[9px] text-muted-foreground block">Fiyat, indirimli fiyat ve ücretsiz alanı.</span>
                    </div>
                    <Switch checked={fieldSettings.pricing_details} onCheckedChange={(val) => setFieldSettings(p => ({ ...p, pricing_details: val }))} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-bold">Kayıt Süresi & Limitleri</Label>
                      <span className="text-[9px] text-muted-foreground block">Kayıt son tarihi, maks. katılımcı ve satış switch.</span>
                    </div>
                    <Switch checked={fieldSettings.registration_details} onCheckedChange={(val) => setFieldSettings(p => ({ ...p, registration_details: val }))} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-bold">Yarış Sorumlusu Bilgileri</Label>
                      <span className="text-[9px] text-muted-foreground block">Yarış direktörü adı ve telefon girişi.</span>
                    </div>
                    <Switch checked={fieldSettings.manager_details} onCheckedChange={(val) => setFieldSettings(p => ({ ...p, manager_details: val }))} />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </RightDrawer>
  );
}
