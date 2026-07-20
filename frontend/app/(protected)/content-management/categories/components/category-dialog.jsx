'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Save, Check, LoaderCircleIcon, Globe, Plus, Trash2, ArrowUp, ArrowDown, Layers, Info, Sliders, Zap, ChevronDown } from 'lucide-react';
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

const QUICK_ADD_TABS = [
  {
    id: 'rules', emoji: '📋', label: 'Yarışma Kuralları',
    titleTr: 'Yarışma Kuralları', titleEn: 'Competition Rules',
    contentTr: '<h2>Yarışma Kuralları &amp; Katılım Şartları</h2><ul><li><strong>Yaş Sınırı:</strong> Yarışmaya katılım yaşı minimum 18’dir. 18 yaş altındaki sporcular veli izin belgesiyle katılabilir.</li><li><strong>Zorunlu Malzemeler:</strong> Yarış esnasında göğüs numarası görünür olmalı, acil durum kiti ve su matarası bulundurulmalıdır.</li><li><strong>Diskalifiye Nedenleri:</strong> Parkur dışına çıkmak, çevreye çöp atmak veya sportmenlik dışı davranışlar doğrudan ihraç sebebidir.</li><li><strong>Chip Zorunluluğu:</strong> Yarışmacılar, organizasyon tarafından sağlanan elektronik chip’i ayakkabılarına takmalıdır.</li><li><strong>Hava Koşulları:</strong> Şiddetli hava koşullarında yarış organizasyon kararıyla ertelenebilir veya iptal edilebilir.</li></ul>',
    contentEn: '<h2>Competition Rules &amp; Entry Requirements</h2><ul><li><strong>Age Limit:</strong> Minimum age is 18. Athletes under 18 must present a parental consent form.</li><li><strong>Mandatory Gear:</strong> Race number must be visible at all times; emergency kit and hydration bottle are mandatory.</li><li><strong>Disqualification:</strong> Cutting the course, littering, or unsportsmanlike behavior will result in immediate disqualification.</li><li><strong>Chip Requirement:</strong> All participants must attach the electronic timing chip provided by the organization to their shoe.</li><li><strong>Weather Conditions:</strong> In case of severe weather, the race may be postponed or cancelled at the organizer’s discretion.</li></ul>',
  },
  {
    id: 'program', emoji: '📅', label: 'Etkinlik Programı',
    titleTr: 'Etkinlik Programı', titleEn: 'Event Schedule',
    contentTr: '<h2>Etkinlik Programı</h2><p><strong>07:00 – 08:30</strong> — Sporcu Kit Dağıtımı &amp; Kayıt Kontrol</p><p><strong>08:45</strong> — Teknik Toplantı &amp; Isınma</p><p><strong>09:00</strong> — Yarış Başlangıcı (Start)</p><p><strong>13:00</strong> — Ödül Töreni &amp; Kapanış</p>',
    contentEn: '<h2>Event Schedule</h2><p><strong>07:00 – 08:30</strong> — Race Kit Distribution &amp; Check-in</p><p><strong>08:45</strong> — Technical Briefing &amp; Warm-up</p><p><strong>09:00</strong> — Race Start</p><p><strong>13:00</strong> — Awards Ceremony &amp; Closing</p>',
  },
  {
    id: 'course', emoji: '🗺️', label: 'Parkur Bilgisi',
    titleTr: 'Parkur Bilgisi', titleEn: 'Course Info',
    contentTr: '<h2>Parkur Hakkında</h2><ul><li><strong>Zemin:</strong> Orman yolu, patika ve asfalt karışımı</li><li><strong>En Yüksek Nokta:</strong> — m</li><li><strong>Zorluk Derecesi:</strong> Orta / Orta-Zor</li><li><strong>Kontrol Noktaları:</strong> Belirlenecektir</li></ul><p>Parkur haritası ve GPX dosyası yarıştan önce yayınlanacaktır.</p>',
    contentEn: '<h2>Course Information</h2><ul><li><strong>Surface:</strong> Mixed forest trail, singletrack and asphalt</li><li><strong>Highest Point:</strong> — m</li><li><strong>Difficulty:</strong> Moderate / Moderate-Hard</li><li><strong>Checkpoints:</strong> To be announced</li></ul><p>Course map and GPX file will be published before the race.</p>',
  },
  {
    id: 'awards', emoji: '🏆', label: 'Ödüller &amp; Kupalar',
    titleTr: 'Ödüller &amp; Kupalar', titleEn: 'Awards &amp; Trophies',
    contentTr: '<h2>Ödüller &amp; Kupalar</h2><p>Her kategoride ilk 3 dereceye giren sporculara kupa ve madalya verilecektir.</p><ul><li>🥇 <strong>1. lik:</strong> Kupa + Madalya + Özel Ödül</li><li>🥈 <strong>2. lik:</strong> Kupa + Madalya</li><li>🥉 <strong>3. lük:</strong> Kupa + Madalya</li></ul><p>Tüm katılımcılara finişer madalyası ve katılım sertifikası verilecektir.</p>',
    contentEn: '<h2>Awards &amp; Trophies</h2><p>The top 3 finishers in each category will receive trophies and medals.</p><ul><li>🥇 <strong>1st Place:</strong> Trophy + Medal + Special Prize</li><li>🥈 <strong>2nd Place:</strong> Trophy + Medal</li><li>🥉 <strong>3rd Place:</strong> Trophy + Medal</li></ul><p>All finishers will receive a finisher medal and participation certificate.</p>',
  },
  {
    id: 'faq', emoji: '❓', label: 'Sıkça Sorulan Sorular',
    titleTr: 'Sıkça Sorulan Sorular', titleEn: 'FAQ',
    contentTr: '<h2>Sıkça Sorulan Sorular</h2><p><strong>Soru: Kayıt iptali mümkün müdür?</strong><br>Cevap: Yarıştan 14 gün öncesine kadar iptal talebinde bulunulabilir.</p><p><strong>Soru: Yarış kiti nerede teslim alınır?</strong><br>Cevap: Yarış kitleri, etkinlik günü sabah 07:00–08:30 saatleri arasında start alanındaki stantlardan teslim edilecektir.</p><p><strong>Soru: Eşlik eden kişiler için alan var mı?</strong><br>Cevap: Evet, finiş alanında seyirci bölgesi bulunmaktadır.</p>',
    contentEn: '<h2>Frequently Asked Questions</h2><p><strong>Q: Can I cancel my registration?</strong><br>A: Cancellations are accepted up to 14 days before the race.</p><p><strong>Q: Where do I collect my race kit?</strong><br>A: Race kits will be distributed at the start area from 07:00–08:30 on race day.</p><p><strong>Q: Is there a spectator area?</strong><br>A: Yes, a designated spectator zone is available at the finish area.</p>',
  },
  {
    id: 'transport', emoji: '🚌', label: 'Ulaşım Bilgisi',
    titleTr: 'Ulaşım Bilgisi', titleEn: 'Transportation',
    contentTr: '<h2>Ulaşım &amp; Otopark</h2><p>🚌 <strong>Toplu Taşıma / Servisler:</strong> Yarış sabahı saat 07:15’te belediye binası önünden ücretsiz sporcu servisleri kaldırılacaktır.</p><p>🚗 <strong>Özel Araç &amp; Otopark:</strong> Yarış başlangıç noktasının 100m ilerisinde yer alan ücretsiz açık otopark alanını kullanabilirsiniz.</p><p>📍 <strong>Konum:</strong> Etkinlik alanı adresi ve koordinatları buraya eklenecektir.</p>',
    contentEn: '<h2>Transportation &amp; Parking</h2><p>🚌 <strong>Public Transport / Shuttles:</strong> Free athlete shuttles will depart from the city hall at 07:15 AM on race morning.</p><p>🚗 <strong>Private Vehicles &amp; Parking:</strong> Free public parking is available 100m from the race start gate area.</p><p>📍 <strong>Location:</strong> Venue address and coordinates will be added here.</p>',
  },
  {
    id: 'accommodation', emoji: '🏨', label: 'Konaklama',
    titleTr: 'Konaklama', titleEn: 'Accommodation',
    contentTr: '<h2>Konaklama Seçenekleri</h2><p>Etkinlik bölgesinde çeşitli konaklama seçenekleri mevcuttur. Anlaşmalı oteller için organizasyon ofisiyle iletişime geçebilirsiniz.</p><ul><li>Anlaşmalı oteller için özel fiyat avantajından yararlanabilirsiniz.</li><li>Erken rezervasyon yaptırmanızı öneririz.</li><li>Kampçılık alanı için lütfen organizasyon ekibiyle iletişime geçin.</li></ul>',
    contentEn: '<h2>Accommodation Options</h2><p>Various accommodation options are available near the event venue. Contact the organization office for partner hotels and special rates.</p><ul><li>Special discount rates are available at partner hotels.</li><li>Early booking is recommended.</li><li>Please contact the organization team for camping options.</li></ul>',
  },
  {
    id: 'nutrition', emoji: '🍽️', label: 'Beslenme &amp; İkmal',
    titleTr: 'Beslenme &amp; İkmal Noktaları', titleEn: 'Nutrition &amp; Aid Stations',
    contentTr: '<h2>Beslenme &amp; İkmal Noktaları</h2><p>Parkur boyunca çeşitli noktalarda ikmal istasyonları kurulacaktır.</p><ul><li><strong>İkmal Sıklığı:</strong> Her 5 km’de bir su ve enerji jeli ikmal noktası bulunmaktadır.</li><li><strong>Sunulanlar:</strong> Su, enerji içeceği, muz, enerji jeli, tuzlu krakerler</li><li><strong>Finiş Alanı:</strong> Bitiş noktasında kapsamlı yemek ve içecek servisi yapılacaktır.</li></ul>',
    contentEn: '<h2>Nutrition &amp; Aid Stations</h2><p>Aid stations will be set up at regular intervals along the course.</p><ul><li><strong>Frequency:</strong> Water and energy gel stations every 5 km.</li><li><strong>Available Items:</strong> Water, sports drink, banana, energy gel, salted crackers</li><li><strong>Finish Area:</strong> A comprehensive food and beverage service will be provided at the finish.</li></ul>',
  },
  {
    id: 'safety', emoji: '🏥', label: 'Güvenlik &amp; Sağlık',
    titleTr: 'Güvenlik &amp; Sağlık', titleEn: 'Safety &amp; Health',
    contentTr: '<h2>Güvenlik &amp; Sağlık</h2><ul><li>Parkur boyunca düzenli aralıklarla sağlık ekibi konuml andırılacaktır.</li><li>Acil durum iletişimi telsiz ağı ve tüm iletiimşim kanalları üzerinden sağlanacaktır.</li><li>Tüm katılımcıların geçerli bir sağlık sigortasına sahip olması zorunludur.</li><li>Herhangi bir sağlık problemi yaşayan sporcu diskalifiye olmaksızın güvenli şekilde yarıştan çekilebilir.</li></ul>',
    contentEn: '<h2>Safety &amp; Health</h2><ul><li>Medical teams will be stationed at regular intervals along the course.</li><li>Emergency communication will be maintained via radio network and all communication channels.</li><li>All participants are required to have valid health insurance.</li><li>Any athlete experiencing a health issue may safely withdraw from the race without disqualification.</li></ul>',
  },
  {
    id: 'consent', emoji: '📝', label: 'Muvafakatname',
    titleTr: 'Muvafakatname', titleEn: 'Consent Form',
    contentTr: '<h2>Muvafakatname &amp; Sorumluluk Beyanı</h2><p>Yarışmaya kendi hür irademle katıldığımı, yarış parkurunun zorluk derecesini bildiğimi ve bu mücadeleye katılmak için gerekli fiziksel ve zihinsel hazırlığa sahip olduğumu beyan ederim.</p><p>Etkinlik boyunca meydana gelebilecek herhangi bir kaza, sakatlık, sağlık problemi ya da mal kaybından dolayı organizasyon komitesini, sponsorları ve yetkilileri sorumlu tutmayacağımı kabul ve taahhüt ederim.</p><p>Yarış sırasında sağlık ekiplerinin vereceği her türlü tıbbi karara uymayı, acil durumlarda tıbbi müdahaleyi şimdiden onayladığımı beyan ederim.</p>',
    contentEn: '<h2>Consent &amp; Release Form</h2><p>I declare that I participate in the competition of my own free will, know the difficulty level of the course, and have the necessary physical and mental preparation to participate.</p><p>I accept and undertake that I will not hold the organization committee, sponsors, and officials responsible for any accident, injury, health problem, or loss of property that may occur during the event.</p><p>I declare that I comply with all medical decisions of the medical teams during the race and approve medical intervention in advance in case of emergencies.</p>',
  },
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
  const [expandedTabs, setExpandedTabs] = useState(new Set());

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
    setExpandedTabs((prev) => new Set([...prev, newKey]));
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

  const handleQuickAdd = (template) => {
    setTabsList((prev) => [
      ...prev,
      {
        id: template.id,
        title: { tr: template.titleTr, en: template.titleEn },
        content: { tr: template.contentTr || '', en: template.contentEn || '' },
        is_active: true,
      },
    ]);
    setExpandedTabs((prev) => new Set([...prev, template.id]));
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
      setExpandedTabs(new Set());
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
          <TabsContent value="tabs" className="space-y-5 mt-0">
            {/* Section header */}
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-foreground">Detay Sayfası Sekmeleri</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Bu kategorideki yarışların detay sayfalarında gösterilecek özel sekmeler.
                </p>
              </div>
              <Button type="button" onClick={handleAddTab} size="sm" className="gap-1.5 shrink-0 h-8">
                <Plus className="size-3.5" />
                Yeni Sekme
              </Button>
            </div>

            {/* Quick Add chips */}
            <div className="rounded-xl border border-border/70 bg-muted/30 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="size-3.5 text-primary" />
                <span className="text-[11px] font-bold text-foreground uppercase tracking-wider">Hızlı Ekle</span>
                <span className="text-[10px] text-muted-foreground">— Hazır şablonlardan seçin</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {QUICK_ADD_TABS.filter(qt => !tabsList.some(t => t.id === qt.id)).map(qt => (
                  <button
                    key={qt.id}
                    type="button"
                    onClick={() => handleQuickAdd(qt)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-semibold text-foreground hover:border-primary/60 hover:text-primary hover:bg-primary/5 transition-all duration-150 select-none"
                  >
                    <span className="text-sm leading-none">{qt.emoji}</span>
                    <span>{qt.label}</span>
                  </button>
                ))}
                {QUICK_ADD_TABS.filter(qt => !tabsList.some(t => t.id === qt.id)).length === 0 && (
                  <span className="text-xs text-muted-foreground italic">
                    Tüm hazır şablonlar eklendi.
                  </span>
                )}
              </div>
            </div>

            {/* Tab list */}
            {tabsList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 border border-dashed border-border rounded-xl bg-muted/5 space-y-3">
                <div className="size-10 rounded-xl bg-muted/30 flex items-center justify-center">
                  <Layers className="size-5 text-muted-foreground/50" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-semibold text-foreground">Henüz sekme eklenmemiş</p>
                  <p className="text-xs text-muted-foreground max-w-[260px] leading-relaxed">
                    Yukarıdan hazır şablon seçin ya da "Yeni Sekme" butonuna tıklayın.
                  </p>
                </div>
                <Button type="button" onClick={handleAddTab} size="sm" variant="outline" className="gap-1.5 h-8 mt-1">
                  <Plus className="size-3.5" />
                  Boş Sekme Ekle
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Lang switcher */}
                <Tabs value={activeLang} onValueChange={setActiveLang} className="w-full">
                  <TabsList variant="line" size="sm" className="w-fit bg-transparent pb-0">
                    <TabsTrigger value="tr" className="gap-1.5">
                      <Globe className="size-3.5" /> Türkçe
                    </TabsTrigger>
                    <TabsTrigger value="en" className="gap-1.5">
                      <Globe className="size-3.5" /> English
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* Tab cards */}
                {tabsList.map((tab, idx) => {
                  const isExpanded = expandedTabs.has(tab.id);
                  const tabTitle = tab.title?.[activeLang] || tab.title?.tr || '';
                  return (
                    <div key={tab.id} className="rounded-xl border border-border bg-card overflow-hidden shadow-sm transition-shadow duration-200">
                      {/* Card Header */}
                      <div className="flex items-center gap-3 px-4 py-3 bg-muted/20 border-b border-transparent data-[expanded=true]:border-border/60" data-expanded={isExpanded}>
                        {/* Order controls */}
                        <div className="flex flex-col gap-0.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMoveTab(idx, 'up')}
                            disabled={idx === 0}
                            className="size-5 flex items-center justify-center rounded hover:bg-muted disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                            aria-label="Yukarı taşı"
                          >
                            <ArrowUp className="size-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveTab(idx, 'down')}
                            disabled={idx === tabsList.length - 1}
                            className="size-5 flex items-center justify-center rounded hover:bg-muted disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                            aria-label="Aşağı taşı"
                          >
                            <ArrowDown className="size-3" />
                          </button>
                        </div>

                        {/* Tab title preview */}
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold text-foreground truncate block">
                            {tabTitle || <span className="text-muted-foreground/70 italic font-normal">Başlıksız Sekme</span>}
                          </span>
                          <span className="text-[10px] text-muted-foreground">#{idx + 1}</span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-muted-foreground font-medium">Aktif</span>
                            <Switch
                              checked={tab.is_active !== false}
                              onCheckedChange={(val) => handleUpdateTab(tab.id, 'is_active', null, val)}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteTab(tab.id)}
                            className="size-7 flex items-center justify-center rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                            aria-label="Sekmeyi sil"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedTabs((prev) => {
                                const next = new Set(prev);
                                if (next.has(tab.id)) next.delete(tab.id);
                                else next.add(tab.id);
                                return next;
                              })
                            }
                            className="size-7 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
                            aria-label={isExpanded ? 'Daralt' : 'Genişlet'}
                          >
                            <ChevronDown
                              className={`size-3.5 text-muted-foreground transition-transform duration-200 ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Card body (expanded) */}
                      {isExpanded && (
                        <div className="p-4 space-y-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold">
                              Sekme Başlığı ({activeLang.toUpperCase()})
                            </Label>
                            <Input
                              value={tab.title?.[activeLang] || ''}
                              onChange={(e) =>
                                handleUpdateTab(tab.id, 'title', activeLang, e.target.value)
                              }
                              placeholder={
                                activeLang === 'tr' ? 'Örn: Yarış Kuralları' : 'Example: Race Rules'
                              }
                              className="h-9 text-xs"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold">
                              Sekme İçeriği ({activeLang.toUpperCase()})
                            </Label>
                            <RichTextEditor
                              value={tab.content?.[activeLang] || ''}
                              onChange={(val) =>
                                handleUpdateTab(tab.id, 'content', activeLang, val)
                              }
                              placeholder={
                                activeLang === 'tr'
                                  ? 'Sekme içeriğini buraya girin...'
                                  : 'Enter tab content here...'
                              }
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
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
