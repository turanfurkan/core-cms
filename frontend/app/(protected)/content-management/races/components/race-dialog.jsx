'use client';

import { useEffect, useState, useMemo } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Save, LoaderCircleIcon, Globe, Info, Ruler, Landmark, CreditCard, FileImage, ShieldAlert, Check, Search, Plus, Trash2, ArrowUp, ArrowDown, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/useTranslation';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RightDrawer } from '@/components/common/right-drawer';
import { FileUpload } from '@/components/ui/file-upload';
import RichTextEditor from '@/components/common/rich-text-editor';
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

function MultiSelectGrid({ items, selectedIds, onToggle, placeholder, searchPlaceholder }) {
  const [search, setSearch] = useState('');
  
  const filteredItems = useMemo(() => {
    let result = items;
    if (search) {
      const lower = search.toLowerCase();
      result = items.filter(item => {
        const title = item.title || item.name;
        const text = typeof title === 'object' ? (title.tr || title.en || '') : (title || '');
        return text.toLowerCase().includes(lower);
      });
    }

    // Sort selected items to the top, then alphabetically within status groups
    return [...result].sort((a, b) => {
      const aSel = selectedIds.includes(a.id);
      const bSel = selectedIds.includes(b.id);
      if (aSel && !bSel) return -1;
      if (!aSel && bSel) return 1;

      const titleA = a.title || a.name;
      const labelA = typeof titleA === 'object' ? (titleA.tr || titleA.en || '') : (titleA || '');
      const titleB = b.title || b.name;
      const labelB = typeof titleB === 'object' ? (titleB.tr || titleB.en || '') : (titleB || '');
      return labelA.localeCompare(labelB, 'tr');
    });
  }, [items, search, selectedIds]);

  return (
    <div className="space-y-2.5 w-full">
      {items.length > 5 && (
        <div className="relative">
          <Search className="size-3.5 absolute left-3 top-2.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder || "Ara..."}
            className="pl-9 h-8.5 text-xs bg-card"
          />
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-[160px] overflow-y-auto p-1.5 border border-border/80 rounded-xl bg-muted/5">
        {filteredItems.map((item) => {
          const title = item.title || item.name;
          const label = typeof title === 'object' ? (title.tr || title.en || '') : (title || '');
          const isSelected = selectedIds.includes(item.id);

          return (
            <div
              key={item.id}
              onClick={() => onToggle(item.id)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-xs font-semibold cursor-pointer select-none transition-all duration-150 ${
                isSelected
                  ? "border-primary/30 bg-primary/5 text-primary"
                  : "border-border hover:bg-muted/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className={`size-4 rounded border flex items-center justify-center transition-all shrink-0 ${
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card"
              }`}>
                {isSelected && <Check className="size-3 stroke-[3]" />}
              </div>
              <span className="truncate">{label}</span>
            </div>
          );
        })}
        {filteredItems.length === 0 && (
          <div className="col-span-full py-6 text-center text-xs text-muted-foreground">
            {placeholder || "Öğe bulunamadı."}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RaceDialog({ open, closeDialog, race }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isEdit = !!race?.id;

  const [activeTab, setActiveTab] = useState('general');
  const [activeLang, setActiveLang] = useState('tr');

  // Form state
  const [title, setTitle] = useState({ tr: '', en: '' });
  const [slug, setSlug] = useState({ tr: '', en: '' });
  const [content, setContent] = useState({ tr: '', en: '' });
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [locationEmbed, setLocationEmbed] = useState('');
  const [price, setPrice] = useState('0.00');
  const [discountedPrice, setDiscountedPrice] = useState('0.00');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('500');
  
  // Specifications
  const [distance, setDistance] = useState('');
  const [startPoint, setStartPoint] = useState('');
  const [finishPoint, setFinishPoint] = useState('');
  const [elevation, setElevation] = useState('');
  const [descent, setDescent] = useState('');
  
  // Media references
  const [coverImageId, setCoverImageId] = useState(null);
  const [graphicImageId, setGraphicImageId] = useState(null);
  const [gpxFileId, setGpxFileId] = useState(null);
  const [stravaFileId, setStravaFileId] = useState(null);
  const [galleryIds, setGalleryIds] = useState([]);
  
  // Others
  const [youtubeEmbed, setYoutubeEmbed] = useState('');
  const [isMultiRace, setIsMultiRace] = useState(false);
  const [managerName, setManagerName] = useState('');
  const [managerPhone, setManagerPhone] = useState('');
  const [isSalesActive, setIsSalesActive] = useState(true);
  const [contestId, setContestId] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [status, setStatus] = useState('published');
  
  // Relations selection state
  const [categoryIds, setCategoryIds] = useState([]);
  const [childRaceIds, setChildRaceIds] = useState([]);
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');

  // Fetch categories (for race categories)
  const { data: categories } = useQuery({
    queryKey: ['admin-categories-all'],
    queryFn: async () => {
      const res = await apiFetch('/api/admin/categories?type=race');
      if (!res.ok) throw new Error('Failed to fetch categories');
      const json = await res.json();
      return json.data || [];
    },
  });

  // Fetch all other races (for child races selection)
  const { data: racesList } = useQuery({
    queryKey: ['admin-races-list'],
    queryFn: async () => {
      const res = await apiFetch('/api/admin/races');
      if (!res.ok) throw new Error('Failed to fetch races');
      const json = await res.json();
      return json.data || [];
    },
  });

  const [tabsList, setTabsList] = useState([]);
  const [inheritTabs, setInheritTabs] = useState(true);

  const inheritedTabs = useMemo(() => {
    if (!categories || categoryIds.length === 0) return [];
    const matchedCategory = categories.find(
      (c) => categoryIds.includes(c.id) && c.tabs && c.tabs.length > 0
    );
    return matchedCategory ? matchedCategory.tabs : [];
  }, [categories, categoryIds]);

  const inheritedCategoryName = useMemo(() => {
    if (!categories || categoryIds.length === 0) return '';
    const matchedCategory = categories.find(
      (c) => categoryIds.includes(c.id) && c.tabs && c.tabs.length > 0
    );
    return matchedCategory ? (matchedCategory.name?.tr || matchedCategory.name || '') : '';
  }, [categories, categoryIds]);

  const handleInheritChange = (checked) => {
    setInheritTabs(checked);
    if (!checked) {
      setTabsList(JSON.parse(JSON.stringify(inheritedTabs)));
    }
  };

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

  // Check if a field should be shown based on category configurations
  const shouldShowField = (fieldName) => {
    if (!categoryIds || categoryIds.length === 0) return true;
    if (!categories || categories.length === 0) return true;

    const selectedCats = categories.filter(c => categoryIds.includes(c.id));
    if (selectedCats.length === 0) return true;

    // Union logic: Only hide if ALL selected categories explicitly set it to false
    const allDisabled = selectedCats.every(cat => {
      if (cat.field_settings && typeof cat.field_settings === 'object') {
        return cat.field_settings[fieldName] === false;
      }
      return false; // Null/default settings are treated as enabled
    });

    return !allDisabled;
  };

  const showPricingTab = shouldShowField('pricing_details') || shouldShowField('registration_details');
  const showManagerTab = shouldShowField('manager_details');



  // Populate data when editing
  useEffect(() => {
    if (open) {
      setActiveTab('general');
      setActiveLang('tr');

      if (race) {
        setTitle({
          tr: race.title?.tr || '',
          en: race.title?.en || '',
        });
        setSlug({
          tr: race.slug?.tr || '',
          en: race.slug?.en || '',
        });
        setContent({
          tr: race.content?.tr || '',
          en: race.content?.en || '',
        });
        setStartDate(race.start_date || '');
        setStartTime(race.start_time || '08:00');
        setLocationEmbed(race.location_embed || '');
        setPrice(String(race.price || '0.00'));
        setDiscountedPrice(String(race.discounted_price || '0.00'));
        setRegistrationDeadline(race.registration_deadline || '');
        setMaxParticipants(String(race.max_participants || '0'));
        setMinAge(race.min_age !== null && race.min_age !== undefined ? String(race.min_age) : '');
        setMaxAge(race.max_age !== null && race.max_age !== undefined ? String(race.max_age) : '');
        setDistance(race.distance || '');
        setStartPoint(race.start_point || '');
        setFinishPoint(race.finish_point || '');
        setElevation(race.elevation || '');
        setDescent(race.descent || '');
        setCoverImageId(race.cover_image_id || null);
        setGraphicImageId(race.graphic_image_id || null);
        setGpxFileId(race.gpx_file_id || null);
        setStravaFileId(race.strava_file_id || null);
        setGalleryIds(race.gallery_ids || []);
        setYoutubeEmbed(race.youtube_embed || '');
        setIsMultiRace(race.is_multi_race !== false);
        setManagerName(race.manager_name || '');
        setManagerPhone(race.manager_phone || '');
        setIsSalesActive(race.is_sales_active !== false);
        setContestId(race.contest_id ? String(race.contest_id) : '');
        setIsFree(race.is_free === true);
        setStatus(race.status || 'published');
        setCategoryIds((race.categories || []).map((c) => c.id));
        setChildRaceIds((race.child_races || []).map((r) => r.id));
        const isInherited = race.raw_tabs === null;
        setInheritTabs(isInherited);
        setTabsList(race.tabs || []);
      } else {
        setTitle({ tr: '', en: '' });
        setSlug({ tr: '', en: '' });
        setContent({ tr: '', en: '' });
        setStartDate('');
        setStartTime('08:00');
        setLocationEmbed('');
        setPrice('0.00');
        setDiscountedPrice('0.00');
        setRegistrationDeadline('');
        setMaxParticipants('500');
        setMinAge('');
        setMaxAge('');
        setDistance('');
        setStartPoint('');
        setFinishPoint('');
        setElevation('');
        setDescent('');
        setCoverImageId(null);
        setGraphicImageId(null);
        setGpxFileId(null);
        setStravaFileId(null);
        setGalleryIds([]);
        setYoutubeEmbed('');
        setIsMultiRace(false);
        setManagerName('');
        setManagerPhone('');
        setIsSalesActive(true);
        setContestId('');
        setIsFree(false);
        setStatus('published');
        setCategoryIds([]);
        setChildRaceIds([]);
        setInheritTabs(true);
        setTabsList([]);
      }
    }
  }, [open, race]);

  const handleTitleChange = (lang, value) => {
    setTitle((prev) => ({ ...prev, [lang]: value }));
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
      const url = isEdit ? `/api/admin/races/${race.id}` : '/api/admin/races';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Failed to save race');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-races'] });
      queryClient.invalidateQueries({ queryKey: ['admin-races-list'] });
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>
              {isEdit ? 'Yarış başarıyla güncellendi.' : 'Yeni yarış başarıyla oluşturuldu.'}
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
            <AlertTitle>{err.message || 'Yarış kaydedilemedi.'}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
    },
  });

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!title.tr) {
      toast.error('Türkçe yarış başlığı girmek zorunludur.');
      return;
    }
    if (!startDate || !registrationDeadline) {
      toast.error('Yarış tarihi ve kayıt son tarihi zorunludur.');
      return;
    }

    const payload = {
      title,
      slug,
      content,
      start_date: startDate,
      start_time: startTime,
      location_embed: locationEmbed,
      price: Number(price) || 0,
      discounted_price: Number(discountedPrice) || 0,
      registration_deadline: registrationDeadline,
      max_participants: Number(maxParticipants) || 0,
      distance,
      start_point: startPoint,
      finish_point: finishPoint,
      elevation,
      descent,
      cover_image_id: coverImageId,
      graphic_image_id: graphicImageId,
      gpx_file_id: gpxFileId,
      strava_file_id: stravaFileId,
      gallery_ids: galleryIds,
      youtube_embed: youtubeEmbed,
      is_multi_race: isMultiRace,
      manager_name: managerName,
      manager_phone: managerPhone,
      is_sales_active: isSalesActive,
      contest_id: contestId ? Number(contestId) : null,
      is_free: isFree,
      status,
      category_ids: categoryIds,
      child_race_ids: isMultiRace ? childRaceIds : [],
      tabs: inheritTabs ? null : tabsList,
      min_age: minAge ? Number(minAge) : null,
      max_age: maxAge ? Number(maxAge) : null,
    };

    mutation.mutate(payload);
  };

  // Exclude current race and other multi-race packages from child races selection
  const childRaceOptions = (racesList || []).filter((r) => {
    if (r.is_multi_race) return false;
    if (isEdit && r.id === race.id) return false;
    return true;
  });

  const handleCategorySelect = (catId) => {
    const id = Number(catId);
    setCategoryIds((prev) => 
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleChildRaceSelect = (rId) => {
    const id = Number(rId);
    setChildRaceIds((prev) => 
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

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
      title={isEdit ? `Yarış Düzenle: ${race.title?.tr}` : 'Yeni Yarış Kaydı'}
      size="5xl"
      footer={footerContent}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList variant="line" className="w-full justify-start bg-transparent pb-0 mb-6 overflow-x-auto flex flex-nowrap shrink-0">
          <TabsTrigger value="general" className="gap-1.5 text-xs font-bold py-2"><Info className="size-3.5" /> Genel</TabsTrigger>
          <TabsTrigger value="details" className="gap-1.5 text-xs font-bold py-2"><Ruler className="size-3.5" /> Detaylar</TabsTrigger>
          {showPricingTab && <TabsTrigger value="pricing" className="gap-1.5 text-xs font-bold py-2"><CreditCard className="size-3.5" /> Satış</TabsTrigger>}
          <TabsTrigger value="media" className="gap-1.5 text-xs font-bold py-2"><FileImage className="size-3.5" /> Medya & Harita</TabsTrigger>
          {showManagerTab && <TabsTrigger value="manager" className="gap-1.5 text-xs font-bold py-2"><Landmark className="size-3.5" /> Sorumlu</TabsTrigger>}
          <TabsTrigger value="tabs" className="gap-1.5 text-xs font-bold py-2"><Layers className="size-3.5" /> Sekmeler</TabsTrigger>
        </TabsList>

        {/* Tab 1: General Info */}
        <TabsContent value="general" className="space-y-5 mt-0">
          {/* Multi Race Setup */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-blue-500/5">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-foreground block">Çoklu Yarış Paketi (Multi-Race)</span>
                <span className="text-[10px] text-muted-foreground block">
                  Bu kayıt, kendi içinde başka alt yarışları barındıran üst paket mi?
                </span>
              </div>
              <Switch checked={isMultiRace} onCheckedChange={setIsMultiRace} />
            </div>

            {isMultiRace && (
              <div className="space-y-2">
                <Label>Alt Yarışlar (Child Races)</Label>
                <MultiSelectGrid
                  items={childRaceOptions}
                  selectedIds={childRaceIds}
                  onToggle={handleChildRaceSelect}
                  placeholder="Seçilebilir başka yarış bulunmuyor."
                  searchPlaceholder="Yarış ara..."
                />
              </div>
            )}
          </div>

          <div className="h-px bg-border my-6" />

          <Tabs value={activeLang} onValueChange={setActiveLang} className="w-full">
            <TabsList variant="line" size="sm" className="w-fit bg-transparent pb-0 mb-3">
              <TabsTrigger value="tr" className="gap-1 px-2.5 py-1 text-xs">TR</TabsTrigger>
              <TabsTrigger value="en" className="gap-1 px-2.5 py-1 text-xs">EN</TabsTrigger>
            </TabsList>

            <TabsContent value="tr" className="space-y-4 mt-0">
              <div className="space-y-1.5">
                <Label htmlFor="race-title-tr">Yarış Başlığı (TR) <span className="text-red-500">*</span></Label>
                <Input
                  id="race-title-tr"
                  value={title.tr}
                  onChange={(e) => handleTitleChange('tr', e.target.value)}
                  placeholder="Örn: Likya Yarı Maratonu 21K"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="race-slug-tr">Slug (TR)</Label>
                <Input
                  id="race-slug-tr"
                  value={slug.tr}
                  onChange={(e) => setSlug((prev) => ({ ...prev, tr: e.target.value }))}
                  placeholder="likya-yari-maratonu-21k"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Açıklama (TR)</Label>
                <RichTextEditor
                  value={content.tr}
                  onChange={(val) => setContent((prev) => ({ ...prev, tr: val }))}
                  placeholder="Yarış açıklaması..."
                />
              </div>
            </TabsContent>

            <TabsContent value="en" className="space-y-4 mt-0">
              <div className="space-y-1.5">
                <Label htmlFor="race-title-en">Yarış Başlığı (EN)</Label>
                <Input
                  id="race-title-en"
                  value={title.en}
                  onChange={(e) => handleTitleChange('en', e.target.value)}
                  placeholder="e.g. Lycian Half Marathon 21K"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="race-slug-en">Slug (EN)</Label>
                <Input
                  id="race-slug-en"
                  value={slug.en}
                  onChange={(e) => setSlug((prev) => ({ ...prev, en: e.target.value }))}
                  placeholder="lycian-half-marathon-21k"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Açıklama (EN)</Label>
                <RichTextEditor
                  value={content.en}
                  onChange={(val) => setContent((prev) => ({ ...prev, en: val }))}
                  placeholder="Race description..."
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="space-y-2">
            <Label>Kategoriler</Label>
            <MultiSelectGrid
              items={categories || []}
              selectedIds={categoryIds}
              onToggle={handleCategorySelect}
              placeholder="Aktif kategori bulunmuyor."
              searchPlaceholder="Kategori ara..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="race-contest-id">Contest</Label>
              <Input
                id="race-contest-id"
                type="number"
                value={contestId}
                onChange={(e) => setContestId(e.target.value)}
                placeholder="Örn: 24"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Yayın Durumu</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="bg-card">
                  <SelectValue placeholder="Seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">Yayınlandı (Published)</SelectItem>
                  <SelectItem value="draft">Taslak (Draft)</SelectItem>
                  <SelectItem value="archived">Arşivlendi (Archived)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Specs & Details */}
        <TabsContent value="details" className="space-y-5 mt-0">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="race-start-date">Yarış Başlangıç Tarihi <span className="text-red-500">*</span></Label>
              <Input
                id="race-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="race-start-time">Başlangıç Saati</Label>
              <Input
                id="race-start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
          </div>

          {!isMultiRace ? (
            <>
              {(shouldShowField('distance') || shouldShowField('elevation') || shouldShowField('descent')) && (
                <div className="grid grid-cols-3 gap-4">
                  {shouldShowField('distance') && (
                    <div className="space-y-1.5">
                      <Label htmlFor="race-distance">Mesafe (KM)</Label>
                      <Input
                        id="race-distance"
                        value={distance}
                        onChange={(e) => setDistance(e.target.value)}
                        placeholder="Örn: 21"
                      />
                    </div>
                  )}
                  {shouldShowField('elevation') && (
                    <div className="space-y-1.5">
                      <Label htmlFor="race-elevation">Yükseklik Kazanımı (m)</Label>
                      <Input
                        id="race-elevation"
                        value={elevation}
                        onChange={(e) => setElevation(e.target.value)}
                        placeholder="Örn: 500"
                      />
                    </div>
                  )}
                  {shouldShowField('descent') && (
                    <div className="space-y-1.5">
                      <Label htmlFor="race-descent">Yükseklik Kaybı (m)</Label>
                      <Input
                        id="race-descent"
                        value={descent}
                        onChange={(e) => setDescent(e.target.value)}
                        placeholder="Örn: 500"
                      />
                    </div>
                  )}
                </div>
              )}

              {shouldShowField('start_finish_points') && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="race-start-point">Başlangıç Noktası</Label>
                    <Input
                      id="race-start-point"
                      value={startPoint}
                      onChange={(e) => setStartPoint(e.target.value)}
                      placeholder="Örn: Göcek Meydanı"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="race-finish-point">Bitiş Noktası</Label>
                    <Input
                      id="race-finish-point"
                      value={finishPoint}
                      onChange={(e) => setFinishPoint(e.target.value)}
                      placeholder="Örn: Göcek Meydanı"
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-4 rounded-xl border border-blue-500/10 bg-blue-500/5 text-xs text-blue-600 dark:text-blue-400 font-medium leading-relaxed my-2">
              ℹ️ Çoklu yarış paketlerinde mesafe, yükseklik kazanımı/kaybı ve başlangıç/bitiş noktası detayları alt yarışların kendi kayıtları üzerinden tanımlanır.
            </div>
          )}

          {shouldShowField('registration_details') && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="race-max-participants">Maksimum Katılımcı Limiti</Label>
                <Input
                  id="race-max-participants"
                  type="number"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(e.target.value)}
                  placeholder="Örn: 500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="race-min-age">Minimum Yaş Sınırı</Label>
                  <Input
                    id="race-min-age"
                    type="number"
                    value={minAge}
                    onChange={(e) => setMinAge(e.target.value)}
                    placeholder="Örn: 18"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="race-max-age">Maksimum Yaş Sınırı</Label>
                  <Input
                    id="race-max-age"
                    type="number"
                    value={maxAge}
                    onChange={(e) => setMaxAge(e.target.value)}
                    placeholder="Örn: 65"
                  />
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Tab 3: Pricing & Multi-race */}
        {showPricingTab && (
          <TabsContent value="pricing" className="space-y-5 mt-0">
            {shouldShowField('pricing_details') && (
              <>
                <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-emerald-500/5">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-foreground block">Ücretsiz mi?</span>
                    <span className="text-[10px] text-muted-foreground block">
                      Eğer işaretlenirse katılımcılardan ödeme alınmaz.
                    </span>
                  </div>
                  <Switch id="race-is-free" checked={isFree} onCheckedChange={(val) => {
                    setIsFree(val);
                    if (val) {
                      setPrice('0.00');
                      setDiscountedPrice('0.00');
                    }
                  }} />
                </div>

                {!isFree && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="race-price">Kayıt Ücreti (TL)</Label>
                      <Input
                        id="race-price"
                        type="number"
                        step="0.01"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="800.00"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="race-discount-price">İndirimli Kayıt Ücreti (TL)</Label>
                      <Input
                        id="race-discount-price"
                        type="number"
                        step="0.01"
                        value={discountedPrice}
                        onChange={(e) => setDiscountedPrice(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {shouldShowField('registration_details') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="race-deadline">Kayıt Son Tarihi <span className="text-red-500">*</span></Label>
                  <Input
                    id="race-deadline"
                    type="date"
                    value={registrationDeadline}
                    onChange={(e) => setRegistrationDeadline(e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-foreground block">Satışta mı?</span>
                    <span className="text-[10px] text-muted-foreground block">Yarış kayıtları açık mı?</span>
                  </div>
                  <Switch checked={isSalesActive} onCheckedChange={setIsSalesActive} />
                </div>
              </div>
            )}
          </TabsContent>
        )}

        {/* Tab 4: Files and Media */}
        <TabsContent value="media" className="space-y-5 mt-0">
          <div className={isMultiRace || !shouldShowField('route_graphic') ? "grid grid-cols-1" : "grid grid-cols-2 gap-4"}>
            <div className="space-y-1.5">
              <Label>Yarış Kapak Resmi (Cover Image)</Label>
              <FileUpload
                value={coverImageId ? [coverImageId] : []}
                onChange={(val) => setCoverImageId(val && val.length > 0 ? val[0] : null)}
                isMultiple={false}
              />
            </div>
            {!isMultiRace && shouldShowField('route_graphic') && (
              <div className="space-y-1.5">
                <Label>Parkur Grafiği (Route Graphic)</Label>
                <FileUpload
                  value={graphicImageId ? [graphicImageId] : []}
                  onChange={(val) => setGraphicImageId(val && val.length > 0 ? val[0] : null)}
                  isMultiple={false}
                />
              </div>
            )}
          </div>

          {!isMultiRace ? (
            <>
              {(shouldShowField('gpx_file') || shouldShowField('strava_file')) && (
                <div className="grid grid-cols-2 gap-4">
                  {shouldShowField('gpx_file') && (
                    <div className="space-y-1.5">
                      <Label>GPX Parkur Dosyası (GPX File)</Label>
                      <FileUpload
                        value={gpxFileId ? [gpxFileId] : []}
                        onChange={(val) => setGpxFileId(val && val.length > 0 ? val[0] : null)}
                        isMultiple={false}
                      />
                    </div>
                  )}
                  {shouldShowField('strava_file') && (
                    <div className="space-y-1.5">
                      <Label>Strava Rota Dosyası</Label>
                      <FileUpload
                        value={stravaFileId ? [stravaFileId] : []}
                        onChange={(val) => setStravaFileId(val && val.length > 0 ? val[0] : null)}
                        isMultiple={false}
                      />
                    </div>
                  )}
                </div>
              )}

              {shouldShowField('strava_embed') && (
                <div className="space-y-1.5">
                  <Label htmlFor="race-strava-embed">Strava Harita Embed Kodu (Iframe/Embed script)</Label>
                  <Textarea
                    id="race-strava-embed"
                    value={locationEmbed}
                    onChange={(e) => setLocationEmbed(e.target.value)}
                    placeholder="<iframe ...></iframe> veya Strava js scriptleri..."
                    rows={2}
                    className="font-mono text-xs"
                  />
                </div>
              )}
            </>
          ) : (
            (shouldShowField('gpx_file') || shouldShowField('strava_file') || shouldShowField('route_graphic')) && (
              <div className="p-4 rounded-xl border border-blue-500/10 bg-blue-500/5 text-xs text-blue-600 dark:text-blue-400 font-medium leading-relaxed my-2">
                ℹ️ Çoklu yarış paketlerinde GPX dosyası, Strava entegrasyonu ve parkur grafiği yükleme işlemleri alt yarışlar üzerinden yönetilir.
              </div>
            )
          )}

          {shouldShowField('youtube_embed') && (
            <div className="space-y-1.5">
              <Label htmlFor="race-youtube">Tanıtım Videosu Linki (Youtube Embed)</Label>
              <Input
                id="race-youtube"
                value={youtubeEmbed}
                onChange={(e) => setYoutubeEmbed(e.target.value)}
                placeholder="https://www.youtube.com/embed/..."
              />
            </div>
          )}

          {shouldShowField('gallery') && (
            <div className="space-y-1.5">
              <Label>Yarış Galerisi (Gallery Photos)</Label>
              <FileUpload
                value={galleryIds}
                onChange={setGalleryIds}
                isMultiple={true}
              />
            </div>
          )}
        </TabsContent>

        {/* Tab 5: Manager */}
        {showManagerTab && (
          <TabsContent value="manager" className="space-y-5 mt-0">
            <div className="space-y-1.5">
              <Label htmlFor="race-manager-name">Yarış Direktörü / Sorumlu Kişi</Label>
              <Input
                id="race-manager-name"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                placeholder="Örn: Ebubekir Külekaya"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="race-manager-phone">Sorumlu Telefon Numarası</Label>
              <Input
                id="race-manager-phone"
                value={managerPhone}
                onChange={(e) => setManagerPhone(e.target.value)}
                placeholder="Örn: 0532 XXXXXXX"
              />
            </div>
          </TabsContent>
        )}

        {/* Tab 6: Sekmeler (Tabs) */}
        <TabsContent value="tabs" className="space-y-6 mt-0">
          {/* Inherit Switch Card */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-blue-500/5 mb-6">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-foreground block">Kategoriden Miras Al (Inherit from Category)</span>
              <span className="text-[10px] text-muted-foreground block">
                Etkinleştirildiğinde, bu yarışın sekmeleri bağlı olduğu kategoriden miras alınır. Düzenlemek isterseniz kapatıp özelleştirebilirsiniz.
              </span>
            </div>
            <Switch checked={inheritTabs} onCheckedChange={handleInheritChange} />
          </div>

          {inheritTabs ? (
            <div className="space-y-4">
              <div className="p-3 bg-muted/20 border border-border rounded-xl text-xs flex items-center gap-2">
                <Info className="size-4 text-blue-500 shrink-0" />
                <span>
                  Şu anda sekmeler <strong>{inheritedCategoryName || 'seçili kategoriden'}</strong> miras alınıyor.
                  {inheritedTabs.length === 0 && " Seçilen kategorilerde tanımlanmış sekme bulunmamaktadır."}
                </span>
              </div>

              {inheritedTabs.length > 0 && (
                <div className="space-y-2 opacity-85">
                  <span className="text-xs font-bold text-muted-foreground block mb-1">Miras Alınan Sekmeler:</span>
                  {inheritedTabs.map((tab, idx) => (
                    <div key={tab.id} className="flex justify-between items-center p-3 border border-border rounded-xl bg-card text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">#{idx + 1}</span>
                        <span className="font-bold text-foreground">{tab.title?.[activeLang] || tab.title?.tr || 'Başlıksız Sekme'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-muted-foreground">({tab.id})</span>
                        <Badge variant="secondary" className="text-[9px] py-0.5 px-1.5">Miras Alındı</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Editable tab structure */}
              <div className="flex justify-between items-center mb-4">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-foreground">Özelleştirilmiş Yarış Sekmeleri</h4>
                  <p className="text-xs text-muted-foreground">Bu yarışa özel sekmeleri ekleyin, çıkartın veya düzenleyin.</p>
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
            </>
          )}
        </TabsContent>
      </Tabs>
    </RightDrawer>
  );
}
