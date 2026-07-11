'use client';

import { useEffect, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Save, 
  LoaderCircleIcon, 
  Globe, 
  Sparkles, 
  History, 
  Eye, 
  Check, 
  RotateCcw, 
  Smartphone, 
  Tablet, 
  Monitor, 
  AlertTriangle, 
  Info,
  Calendar,
  X,
  FileText,
  Search,
  ExternalLink,
  Plus,
  Trash,
  ChevronUp,
  ChevronDown,
  Grid,
  ArrowLeft
} from 'lucide-react';
import { Sortable, SortableItem, SortableItemHandle } from '@/components/ui/sortable';
import { useTranslation } from '@/hooks/useTranslation';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import RichTextEditor from '@/components/common/rich-text-editor';
import { FileUpload } from '@/components/ui/file-upload';
import { toast } from 'sonner';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { RightDrawer } from '@/components/common/right-drawer';
import BlockRenderer from '@/components/blocks/block-renderer';
import { Toolbar, ToolbarHeading, ToolbarTitle, ToolbarActions } from '@/components/common/toolbar';
const advancedSeoSlugs = [
  'seo_title',
  'seo_description',
  'canonical_url',
  'og_title',
  'og_description',
  'og_image',
  'robots_meta'
];

const labelTranslationMap = {
  'Başlık': 'Başlık',
  'Hero Slider Başlığı': 'Ana Ekran Başlığı',
  'Hero Slider Alt Başlığı': 'Ana Ekran Açıklaması',
  'CTA Buton Metni': 'Buton Yazısı',
  'CTA Buton Linki': 'Butonun Gideceği Sayfa',
  'Tanıtım Bölümü Başlığı': 'Tanıtım Bölümü Başlığı',
  'Şirket Hikayesi': 'Şirket Hikayesi',
  'Vizyon': 'Vizyonumuz',
  'Misyon': 'Misyonumuz',
  'Kapak Görseli': 'Kapak Görseli',
  'Adres': 'Adres Bilgisi',
  'Telefon Numarası': 'Telefon Numarası',
  'E-posta Adresi': 'E-posta Adresi',
  'Google Harita Linki': 'Harita Konumu (URL)',
  'Facebook URL': 'Facebook Adresi',
  'Instagram URL': 'Instagram Adresi',
  'Gizlilik Sözleşmesi': 'Gizlilik Sözleşmesi',
  'KVKK Aydınlatma Metni': 'KVKK Aydınlatma Metni',
  'Kullanım Koşulları': 'Kullanım Koşulları',
};

const fieldMetaMap = {
  'title': {
    placeholder: 'Örn: Ana Sayfa, Kurumsal Tanıtım',
    helpText: 'Sistem içindeki sayfa başlığı.'
  },
  'hero_title': {
    placeholder: 'Örn: Yenilikçi CMS Çözümleri',
    helpText: 'Sayfanın en üstünde, ziyaretçilerin ilk göreceği büyük başlık alanıdır.'
  },
  'hero_subtitle': {
    placeholder: 'Örn: İşinizi büyütmek için esnek ve hızlı çözümler...',
    helpText: 'Ana başlığın hemen altında yer alan açıklayıcı alt metindir.'
  },
  'hero_cta_text': {
    placeholder: 'Örn: Hemen Keşfet, İletişime Geç',
    helpText: 'Kullanıcıları bir aksiyona yönlendiren ana butonun üzerindeki yazıdır.'
  },
  'hero_cta_link': {
    placeholder: 'Örn: /contact, https://...',
    helpText: 'Butona tıklandığında gidilecek sayfa bağlantısı.'
  },
  'features_title': {
    placeholder: 'Örn: Neden Bizi Seçmelisiniz?',
    helpText: 'Hizmetler veya özellikler bölümünün üstünde görünecek ana başlıktır.'
  },
  'story': {
    placeholder: 'Şirketinizin hikayesini ve kuruluşunu detaylandırın...',
    helpText: 'Hakkımızda sayfasında görüntülenecek zengin içerikli şirket hikayesi.'
  },
  'vision': {
    placeholder: 'Şirketinizin gelecek vizyonunu yazın...',
    helpText: 'Şirketin uzun vadeli hedeflerini anlatan vizyon alanı.'
  },
  'mission': {
    placeholder: 'Şirketinizin misyonunu yazın...',
    helpText: 'Müşterilere ve sektöre katılan değeri anlatan misyon alanı.'
  },
  'cover_image': {
    placeholder: 'Görsel seçin',
    helpText: 'Sayfanın en üstünde veya yanında görünecek kurumsal kapak resmi.'
  },
  'address': {
    placeholder: 'Örn: Teknopark Ankara A Blok No: 12, Yenimahalle / Ankara',
    helpText: 'Web sitenizin iletişim sayfasında görünecek resmi ofis adresi.'
  },
  'phone': {
    placeholder: 'Örn: +90 312 444 0 538',
    helpText: 'Müşterilerinizin size ulaşabileceği telefon numarası.'
  },
  'email': {
    placeholder: 'Örn: info@markaniz.com',
    helpText: 'Resmi e-posta yazışmalarınız için kullanılacak adres.'
  },
  'map_url': {
    placeholder: 'Örn: https://maps.google.com/...',
    helpText: 'İletişim sayfasındaki harita simülasyonunda kullanılacak Google Maps linki.'
  },
  'social_facebook': {
    placeholder: 'Örn: https://facebook.com/kullaniciadi',
    helpText: 'Resmi Facebook sayfanızın bağlantısı.'
  },
  'social_instagram': {
    placeholder: 'Örn: https://instagram.com/kullaniciadi',
    helpText: 'Resmi Instagram hesabınızın bağlantısı.'
  }
};

const groupSchema = {
  homepage: [
    {
      id: 'hero',
      name: '📍 Hero Bölümü',
      desc: 'Ana sayfanın en üst kısmında görünen giriş alanı',
      fields: ['hero_title', 'hero_subtitle', 'hero_cta_text', 'hero_cta_link']
    },
    {
      id: 'features',
      name: '📍 Tanıtım Bölümü',
      desc: 'Sayfadaki özellikleri ve tanıtım başlığını içerir',
      fields: ['features_title']
    },
    {
      id: 'general',
      name: '⚙️ Genel Ayarlar',
      desc: 'Sayfa başlığı ve temel yapılandırmalar',
      fields: ['title']
    }
  ],
  'about-us': [
    {
      id: 'general',
      name: '⚙️ Genel Bilgiler',
      desc: 'Sayfa başlığı',
      fields: ['title']
    },
    {
      id: 'story',
      name: '📖 Kurumsal Hikayemiz',
      desc: 'Şirketin kuruluş hikayesi ve kapak resmi',
      fields: ['story', 'cover_image']
    },
    {
      id: 'vision_mission',
      name: '🚀 Vizyon & Misyon',
      desc: 'Gelecek hedefleri ve misyon değerleri',
      fields: ['vision', 'mission']
    }
  ],
  contact: [
    {
      id: 'info',
      name: '📞 İletişim Bilgileri',
      desc: 'Adres, telefon ve e-posta bilgileri',
      fields: ['address', 'phone', 'email']
    },
    {
      id: 'social_map',
      name: '📍 Harita & Sosyal Medya',
      desc: 'Google Harita linki ve sosyal medya bağlantıları',
      fields: ['map_url', 'social_facebook', 'social_instagram']
    }
  ],
  'legal-pages': [
    {
      id: 'privacy',
      name: '⚖️ Gizlilik & Kullanım',
      desc: 'Gizlilik sözleşmesi ve kullanım koşulları metinleri',
      fields: ['privacy_policy', 'terms_of_use']
    },
    {
      id: 'kvkk',
      name: '📄 KVKK Aydınlatma',
      desc: 'KVKK aydınlatma ve rıza metinleri',
      fields: ['kvkk_consent']
    }
  ],
  yarislar: [
    {
      id: 'general_info',
      name: '📝 Genel Bilgiler',
      desc: 'Yarış adı, açıklaması, kategorisi ve görselleri',
      fields: ['title', 'content', 'category_id', 'status_select', 'cover_image', 'graphic_image']
    },
    {
      id: 'management_sales',
      name: '👥 Yönetim & Satış',
      desc: 'Tarihler, katılımcı sınırları, satış ve yetkili yönetimi',
      fields: ['is_multi_race', 'child_races', 'is_sales_active', 'is_free', 'start_date', 'start_time', 'manager_name', 'manager_phone', 'registration_deadline', 'max_participants', 'contest_id']
    },
    {
      id: 'extras',
      name: '🎁 Ekstra',
      desc: 'Parkur detayları, GPX/Strava dosyaları, galeri ve dahil olanlar',
      fields: ['distance', 'elevation', 'descent', 'start_point', 'finish_point', 'location_embed', 'youtube_embed', 'gpx_file', 'strava_file', 'whats_included', 'gallery']
    }
  ]
};

const getGroups = (contentTypeSlug, allFields) => {
  const predefined = groupSchema[contentTypeSlug];
  if (predefined) {
    return predefined.map(g => ({
      ...g,
      resolvedFields: allFields.filter(f => g.fields.includes(f.slug))
    })).filter(g => g.resolvedFields.length > 0);
  }
  
  const titleField = allFields.find(f => f.slug === 'title' || f.slug === 'name');
  const otherFields = allFields.filter(f => f !== titleField);
  
  const groups = [];
  if (titleField) {
    groups.push({
      id: 'general',
      name: '📝 Genel Bilgiler',
      desc: 'Temel başlık ve isim tanımlaması',
      resolvedFields: [titleField]
    });
  }
  if (otherFields.length > 0) {
    groups.push({
      id: 'content',
      name: '✍️ İçerik Detayları',
      desc: 'Diğer içerik alanları ve şablon girdileri',
      resolvedFields: otherFields
    });
  }
  return groups;
};

const blockVariations = {
  hero_banner: [
    { id: 'minimal_centered', name: 'Minimal Ortalanmış Giriş', description: 'Sadece yazı ve buton içerir.', image: '/media/previews/hero_minimal_centered.png' },
    { id: 'image_supported', name: 'Görsel Destekli Giriş', description: 'Solda yazı, sağda görsel önizlemesi içerir.', image: '/media/previews/hero_image_supported.png' },
    { id: 'form_input', name: 'Formlu Giriş', description: 'Sol tarafta başlık, sağ tarafta bülten/kayıt formu içerir.', image: '/media/previews/hero_form_input.png' },
    { id: 'video_popup', name: 'Video Destekli Giriş', description: 'Sol tarafta içerik, sağ tarafta popup açan video kartı içerir.', image: '/media/previews/hero_video_popup.png' },
    { id: 'search_focused', name: 'Arama ve Filtre Odaklı Giriş', description: 'Ortalanmış başlık altında gelişmiş rezervasyon/arama formu barındırır.', image: '/media/previews/hero_search_focused.png' },
    { id: 'dashboard_mockup', name: 'Dashboard Ön İzleme Girişi', description: 'Ortalanmış başlık altında modern 3D eğimli SaaS kontrol paneli barındırır.', image: '/media/previews/hero_dashboard_mockup.png' },
    { id: 'social_proof', name: 'Sosyal Kanıt Odaklı Giriş', description: 'Sol tarafta beş yıldız değerlendirmeleri, sağ tarafta iş ortağı logoları ve kullanıcı avatarları içerir.', image: '/media/previews/hero_social_proof.png' },
    { id: 'split_screen', name: 'Bölünmüş Ekran Girişi', description: 'Ekranı 50-50 ikiye bölerek sol tarafta metin, sağ tarafta tam kaplayan görsel sunar.', image: '/media/previews/hero_split_screen.png' },
    { id: 'background_video', name: 'Arka Plan Videolu Giriş', description: 'Arka planda sessiz döngü video, ön planda ortalanmış şeffaf cam kart üzerinde içerik barındırır.', image: '/media/previews/hero_background_video.png' },
    { id: 'metric_cards', name: 'Metrik ve İstatistik Girişi', description: 'Ana metinlerin hemen altında yan yana 3 adet sayısal başarı kartı/kolonu görüntüler.', image: '/media/previews/hero_metric_cards.png' },
    { id: 'tabbed_interactive', name: 'Etkileşimli Sekmeli Giriş', description: 'Yatay kitle sekmeleri (Geliştirici, Tasarımcı vb.) barındırır ve sekmelere göre dinamik önizleme günceller.', image: '/media/previews/hero_tabbed_interactive.png' },
    { id: 'slider_carousel', name: 'Slider / Carousel Giriş', description: 'Yatay geçişli slaytlar, otomatik oynatma, kontrol butonları ve nokta göstergeleri barındırır.', image: '/media/previews/hero_slider_carousel.png' }
  ],
  rich_text: [
    { id: 'standard_centered', name: 'Ortalanmış Zengin Metin', description: 'Ortalanmış başlık ve paragraf düzeni.' },
    { id: 'two_columns', name: 'İki Sütunlu Metin Düzeni', description: 'Yan yana iki sütundan oluşan uzun metin yerleşimi.' },
    { id: 'callout_highlight', name: 'Öne Çıkarılmış Alıntı', description: 'Vurgulanmış kenar çizgili alıntı ve açıklama kartı.' }
  ],
  collection_display: [
    { id: 'grid_cards', name: '3 Kolonlu Kart Izgarası', description: 'Görselli içerikleri 3 kolonlu ızgara şeklinde listeler.' },
    { id: 'list_items', name: 'Detaylı Liste Düzeni', description: 'Alt alta sıralanmış resimli liste elemanları.' },
    { id: 'carousel_slider', name: 'Yatay Kaydırıcı (Slider)', description: 'Kartları yana kaydırılabilir carousel şeklinde listeler.' }
  ]
};

const getMediaIds = (value) => {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) {
    return value.map(item => (typeof item === 'object' && item !== null ? item.id : item));
  }
  if (typeof value === 'object') {
    return value.id ?? '';
  }
  return value;
};

function DynamicZoneField({ field, value, onChange, languages, activeTab, defaultLangCode, contentTypesList }) {
  const allowedBlocks = field.options?.allowed_blocks || [];
  const [editingBlock, setEditingBlock] = useState(null);
  const [editingBlockDevice, setEditingBlockDevice] = useState('desktop');

  const handleBlockVariantChange = (blockId, variantId) => {
    const newBlocksList = value.map(b => {
      if (b.id !== blockId) return b;
      return { ...b, variant: variantId };
    });
    onChange(newBlocksList);

    if (editingBlock && editingBlock.id === blockId) {
      setEditingBlock(prev => ({ ...prev, variant: variantId }));
    }
  };

  const addBlock = (blockType) => {
    const blockSchema = allowedBlocks.find(b => b.type === blockType);
    if (!blockSchema) return;

    const initialData = {};
    if (blockSchema.fields) {
      blockSchema.fields.forEach(sub => {
        const isLocalized = !!(sub.options?.localized || sub.localized);
        if (isLocalized) {
          const loc = {};
          languages.forEach(l => { loc[l.code] = ''; });
          initialData[sub.slug] = loc;
        } else {
          if (sub.type === 'boolean') {
            initialData[sub.slug] = false;
          } else if (sub.type === 'number' || sub.type === 'integer') {
            initialData[sub.slug] = 0;
          } else {
            initialData[sub.slug] = '';
          }
        }
      });
    }

    if (blockType === 'hero_banner') {
      initialData.heading = initialData.heading || { tr: 'Başlık giriniz...', en: 'Enter heading...' };
      initialData.subtitle = initialData.subtitle || { tr: 'Alt başlık giriniz...', en: 'Enter subtitle...' };
      initialData.background_image = initialData.background_image || null;
      initialData.cta_text = { tr: 'Keşfet', en: 'Explore' };
      initialData.cta_url = '#';
      initialData.video_url = '';
      initialData.video_file = null;
      initialData.form_placeholder = { tr: 'E-posta adresiniz...', en: 'Your email address...' };
    }

    const newBlock = {
      id: `blk_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type: blockType,
      data: initialData
    };

    const newBlocksList = [...value, newBlock];
    onChange(newBlocksList);
    setEditingBlock(newBlock); // Open modal immediately for newly added block
  };

  const removeBlock = (id) => {
    onChange(value.filter(b => b.id !== id));
  };

  const handleSubFieldChange = (blockId, subSlug, val, isLocalized) => {
    const newBlocksList = value.map(b => {
      if (b.id !== blockId) return b;
      const updatedData = { ...b.data };
      if (isLocalized) {
        updatedData[subSlug] = {
          ...(updatedData[subSlug] || {}),
          [activeTab]: val
        };
      } else {
        updatedData[subSlug] = val;
      }
      return { ...b, data: updatedData };
    });
    onChange(newBlocksList);
    
    // Also update the editingBlock state to keep the input values in sync in the modal
    if (editingBlock && editingBlock.id === blockId) {
      setEditingBlock(prev => {
        const updatedData = { ...prev.data };
        if (isLocalized) {
          updatedData[subSlug] = {
            ...(updatedData[subSlug] || {}),
            [activeTab]: val
          };
        } else {
          updatedData[subSlug] = val;
        }
        return { ...prev, data: updatedData };
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 border-b border-slate-200/60 pb-3">
        <span className="text-sm font-bold text-slate-800 tracking-wide flex items-center gap-1.5">
          ✨ Sayfa Bölümleri ve Düzeni
        </span>
        <span className="text-[10px] text-slate-400">
          Sürükle-bırak yöntemiyle sayfa bölümlerini sıralayın ve içeriklerini doldurun.
        </span>
      </div>

      <Sortable value={value} onValueChange={onChange} getItemValue={(item) => item.id} className="space-y-3">
        {value.map((item, index) => {
          const blockSchema = allowedBlocks.find(b => b.type === item.type);
          if (!blockSchema) return null;

          let leftBorderColor = 'border-l-blue-500';
          let displayName = '🖼️ Hero Giriş';
          if (item.type === 'rich_text') {
            leftBorderColor = 'border-l-purple-500';
            displayName = '✍️ Zengin Metin Bloğu';
          } else if (item.type === 'collection_display') {
            leftBorderColor = 'border-l-amber-500';
            displayName = '🗂️ İçerik Koleksiyon Listesi';
          } else if (item.type === 'entry_callout') {
            leftBorderColor = 'border-l-emerald-500';
            displayName = '📢 Görsel Callout Paneli';
          } else if (item.type === 'statistics_block') {
            leftBorderColor = 'border-l-rose-500';
            displayName = '📊 İstatistik Sayacı';
          } else if (item.type === 'faq_accordion') {
            leftBorderColor = 'border-l-teal-500';
            displayName = '❓ SSS Akordiyon Paneli';
          } else if (item.type === 'features_grid') {
            leftBorderColor = 'border-l-indigo-500';
            displayName = '🚀 Özellik Izgarası (Grid)';
          } else if (item.type === 'integrations_logos') {
            leftBorderColor = 'border-l-sky-500';
            displayName = '🔌 Entegrasyon Logoları';
          } else if (item.type === 'testimonial_card') {
            leftBorderColor = 'border-l-pink-500';
            displayName = '💬 Müşteri Değerlendirmeleri';
          } else if (item.type === 'timeline_milestones') {
            leftBorderColor = 'border-l-amber-600';
            displayName = '📅 Kurumsal Zaman Çizelgesi';
          } else if (item.type === 'event_banner') {
            leftBorderColor = 'border-l-violet-500';
            displayName = '🎟️ Etkinlik ve Webinar Duyurusu';
          } else if (item.type === 'team_grid') {
            leftBorderColor = 'border-l-slate-400';
            displayName = '👥 Ekip Üyeleri Izgarası';
          } else if (item.type === 'campaign_banner') {
            leftBorderColor = 'border-l-fuchsia-500';
            displayName = '📈 Kampanya ve Promosyon Paneli';
          }

          return (
            <SortableItem key={item.id} value={item.id}>
              <Card className={`border border-slate-200 border-l-4 ${leftBorderColor} overflow-hidden shadow-xs hover:shadow-sm transition-all bg-white`}>
                <div className="px-4 py-3 flex items-center justify-between gap-3 bg-white">
                  <div className="flex items-center gap-3">
                    <SortableItemHandle className="cursor-grab text-slate-400 hover:text-slate-600 active:cursor-grabbing p-1 rounded hover:bg-slate-100 transition-colors">
                      <Grid className="size-4" />
                    </SortableItemHandle>
                    <span className="font-bold text-xs text-slate-800 tracking-wide flex items-center gap-1.5">
                      {displayName}
                      {(() => {
                        const activeVar = blockVariations[item.type]?.find(v => v.id === item.variant);
                        const variantName = activeVar ? activeVar.name : item.variant;
                        return variantName ? (
                          <span className="text-[9px] font-semibold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">
                            {variantName}
                          </span>
                        ) : null;
                      })()}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="xs" 
                      onClick={() => setEditingBlock(item)} 
                      className="h-7 px-2.5 text-[10px] font-bold text-slate-600 hover:text-primary flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg hover:border-primary/20 hover:bg-primary/5 transition-all"
                    >
                      İçeriği Düzenle
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="xs" 
                      onClick={() => removeBlock(item.id)} 
                      className="h-7 w-7 p-0 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            </SortableItem>
          );
        })}
        {value.length === 0 && (
          <div className="text-center py-10 text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-white shadow-xs">
            Henüz hiç bölüm eklenmemiş. Aşağıdaki paneli kullanarak yeni bir bölüm ekleyin.
          </div>
        )}
      </Sortable>

      {/* Visual Add Blocks Grid Panel */}
      <div className="pt-5 border-t border-slate-200/50 mt-6">
        <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-4">
          ➕ Sayfaya Yeni Bölüm Ekle
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {allowedBlocks.map(b => {
            let blockIcon = '🗂️';
            let blockColorClass = 'hover:border-amber-400 hover:bg-amber-50/10 hover:text-amber-600';
            
            if (b.type === 'hero_banner') {
              blockIcon = '🖼️';
              blockColorClass = 'hover:border-blue-400 hover:bg-blue-50/10 hover:text-blue-600';
            } else if (b.type === 'rich_text') {
              blockIcon = '✍️';
              blockColorClass = 'hover:border-purple-400 hover:bg-purple-50/10 hover:text-purple-600';
            } else if (b.type === 'collection_display') {
              blockIcon = '🗂️';
              blockColorClass = 'hover:border-amber-500 hover:bg-amber-50/10 hover:text-amber-700';
            } else if (b.type === 'entry_callout') {
              blockIcon = '📢';
              blockColorClass = 'hover:border-emerald-500 hover:bg-emerald-50/10 hover:text-emerald-700';
            } else if (b.type === 'statistics_block') {
              blockIcon = '📊';
              blockColorClass = 'hover:border-rose-500 hover:bg-rose-50/10 hover:text-rose-700';
            } else if (b.type === 'faq_accordion') {
              blockIcon = '❓';
              blockColorClass = 'hover:border-teal-500 hover:bg-teal-50/10 hover:text-teal-700';
            } else if (b.type === 'features_grid') {
              blockIcon = '🚀';
              blockColorClass = 'hover:border-indigo-500 hover:bg-indigo-50/10 hover:text-indigo-700';
            } else if (b.type === 'integrations_logos') {
              blockIcon = '🔌';
              blockColorClass = 'hover:border-sky-500 hover:bg-sky-50/10 hover:text-sky-700';
            } else if (b.type === 'testimonial_card') {
              blockIcon = '💬';
              blockColorClass = 'hover:border-pink-500 hover:bg-pink-50/10 hover:text-pink-700';
            } else if (b.type === 'timeline_milestones') {
              blockIcon = '📅';
              blockColorClass = 'hover:border-amber-600 hover:bg-amber-50/10 hover:text-amber-800';
            } else if (b.type === 'event_banner') {
              blockIcon = '🎟️';
              blockColorClass = 'hover:border-violet-500 hover:bg-violet-50/10 hover:text-violet-700';
            } else if (b.type === 'team_grid') {
              blockIcon = '👥';
              blockColorClass = 'hover:border-slate-500 hover:bg-slate-50/10 hover:text-slate-700';
            } else if (b.type === 'campaign_banner') {
              blockIcon = '📈';
              blockColorClass = 'hover:border-fuchsia-500 hover:bg-fuchsia-50/10 hover:text-fuchsia-700';
            }

            return (
              <button
                key={b.type}
                type="button"
                onClick={() => addBlock(b.type)}
                className={`p-3.5 rounded-xl border border-dashed border-slate-300 text-center flex flex-col items-center justify-center gap-1.5 transition-all hover:shadow-xs group cursor-pointer ${blockColorClass} bg-white`}
              >
                <span className="text-lg group-hover:scale-110 transition-transform">{blockIcon}</span>
                <div>
                  <span className="font-bold text-[11px] text-slate-800 block">{b.name.split(' (')[0]}</span>
                  <span className="text-[9px] text-slate-400 leading-normal block mt-0.5 max-w-[150px] mx-auto group-hover:text-current">{b.desc}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modern RightDrawer Editor for block fields */}
      {editingBlock && (() => {
        const blockSchema = allowedBlocks.find(b => b.type === editingBlock.type);
        if (!blockSchema) return null;

        const getVisibleFields = (schema, block) => {
          if (!schema) return [];
          if (block.type !== 'hero_banner') return schema.fields || [];
          
          const variant = block.variant || 'minimal_centered';
          const headingField = { name: 'Başlık (Heading)', slug: 'heading', type: 'string', validation_rules: { required: true }, options: { localized: true } };
          const subtitleField = { name: 'Alt Başlık (Subtitle)', slug: 'subtitle', type: 'text', validation_rules: { required: false }, options: { localized: true } };
          const bgImageField = { name: 'Arka Plan Görseli', slug: 'background_image', type: 'media', validation_rules: { required: false } };
          const ctaTextField = { name: 'Buton Metni (CTA Text)', slug: 'cta_text', type: 'string', validation_rules: { required: false }, options: { localized: true } };
          const ctaUrlField = { name: 'Buton Linki (CTA URL)', slug: 'cta_url', type: 'string', validation_rules: { required: false } };
          const videoUrlField = { name: 'Video Linki / URL (MP4 veya YouTube)', slug: 'video_url', type: 'string', validation_rules: { required: true } };
          const formPlaceholderField = { name: 'Form İçi Metin (Placeholder)', slug: 'form_placeholder', type: 'string', validation_rules: { required: false }, options: { localized: true } };

          if (variant === 'minimal_centered' || variant === 'search_focused') {
            return [headingField, subtitleField, ctaTextField, ctaUrlField];
          }
          if (variant === 'video_popup' || variant === 'background_video') {
            const customBgImageField = { ...bgImageField, name: variant === 'video_popup' ? 'Video Kapak Görseli' : 'Yedek Arka Plan Görseli' };
            const customVideoFileField = { name: 'Video Dosyası Yükle (MP4 / WebM)', slug: 'video_file', type: 'media', validation_rules: { required: false } };
            const customVideoUrlField = { name: 'Veya Video Linki / URL (YouTube veya MP4)', slug: 'video_url', type: 'string', validation_rules: { required: false } };
            return [headingField, subtitleField, customBgImageField, customVideoFileField, customVideoUrlField, ctaTextField, ctaUrlField];
          }
          if (variant === 'form_input') {
            return [headingField, subtitleField, formPlaceholderField, ctaTextField];
          }
          if (variant === 'metric_cards') {
            return [
              headingField, subtitleField, ctaTextField, ctaUrlField,
              { name: '1. İstatistik Sayı', slug: 'metric_1_number', type: 'string' },
              { name: '1. İstatistik Başlık', slug: 'metric_1_label', type: 'string', options: { localized: true } },
              { name: '1. İstatistik Açıklama', slug: 'metric_1_desc', type: 'string', options: { localized: true } },
              { name: '2. İstatistik Sayı', slug: 'metric_2_number', type: 'string' },
              { name: '2. İstatistik Başlık', slug: 'metric_2_label', type: 'string', options: { localized: true } },
              { name: '2. İstatistik Açıklama', slug: 'metric_2_desc', type: 'string', options: { localized: true } },
              { name: '3. İstatistik Sayı', slug: 'metric_3_number', type: 'string' },
              { name: '3. İstatistik Başlık', slug: 'metric_3_label', type: 'string', options: { localized: true } },
              { name: '3. İstatistik Açıklama', slug: 'metric_3_desc', type: 'string', options: { localized: true } }
            ];
          }
          if (variant === 'tabbed_interactive') {
            return [
              ctaTextField, ctaUrlField,
              { name: '1. Sekme Adı (Tab Label)', slug: 'tab_1_title', type: 'string', options: { localized: true } },
              { name: '1. Sekme Başlığı (Heading)', slug: 'tab_1_heading', type: 'string', options: { localized: true } },
              { name: '1. Sekme Açıklaması', slug: 'tab_1_desc', type: 'text', options: { localized: true } },
              { name: '2. Sekme Adı (Tab Label)', slug: 'tab_2_title', type: 'string', options: { localized: true } },
              { name: '2. Sekme Başlığı (Heading)', slug: 'tab_2_heading', type: 'string', options: { localized: true } },
              { name: '2. Sekme Açıklaması', slug: 'tab_2_desc', type: 'text', options: { localized: true } },
              { name: '3. Sekme Adı (Tab Label)', slug: 'tab_3_title', type: 'string', options: { localized: true } },
              { name: '3. Sekme Başlığı (Heading)', slug: 'tab_3_heading', type: 'string', options: { localized: true } },
              { name: '3. Sekme Açıklaması', slug: 'tab_3_desc', type: 'text', options: { localized: true } }
            ];
          }
          if (variant === 'slider_carousel') {
            return [
              { name: '1. Slayt Başlık', slug: 'heading', type: 'string', options: { localized: true } },
              { name: '1. Slayt Açıklama', slug: 'subtitle', type: 'text', options: { localized: true } },
              { name: '1. Slayt Görsel', slug: 'background_image', type: 'media' },
              { name: '1. Slayt Buton Metni', slug: 'cta_text', type: 'string', options: { localized: true } },
              { name: '1. Slayt Buton Linki', slug: 'cta_url', type: 'string' },
              
              { name: '2. Slayt Başlık', slug: 'slide_2_heading', type: 'string', options: { localized: true } },
              { name: '2. Slayt Açıklama', slug: 'slide_2_subtitle', type: 'text', options: { localized: true } },
              { name: '2. Slayt Görsel', slug: 'slide_2_background_image', type: 'media' },
              { name: '2. Slayt Buton Metni', slug: 'slide_2_cta_text', type: 'string', options: { localized: true } },
              { name: '2. Slayt Buton Linki', slug: 'slide_2_cta_url', type: 'string' },
              
              { name: '3. Slayt Başlık', slug: 'slide_3_heading', type: 'string', options: { localized: true } },
              { name: '3. Slayt Açıklama', slug: 'slide_3_subtitle', type: 'text', options: { localized: true } },
              { name: '3. Slayt Görsel', slug: 'slide_3_background_image', type: 'media' },
              { name: '3. Slayt Buton Metni', slug: 'slide_3_cta_text', type: 'string', options: { localized: true } },
              { name: '3. Slayt Buton Linki', slug: 'slide_3_cta_url', type: 'string' }
            ];
          }
          
          const customBgImageField = { ...bgImageField, name: variant === 'dashboard_mockup' ? 'Dashboard Ön İzleme Görseli' : variant === 'split_screen' ? 'Sol/Sağ Görsel' : 'Arka Plan Görseli' };
          return [headingField, subtitleField, customBgImageField, ctaTextField, ctaUrlField];
        };

        const visibleFields = getVisibleFields(blockSchema, editingBlock);
        let displayBlockName = blockSchema.name;

        return (
          <RightDrawer
            open={!!editingBlock}
            onOpenChange={(open) => !open && setEditingBlock(null)}
            title={`⚙️ Bölüm İçeriğini Düzenle: ${displayBlockName}`}
            size="5xl"
            footer={
              <div className="flex justify-end gap-2 w-full">
                <Button 
                  type="button" 
                  onClick={() => setEditingBlock(null)} 
                  className="h-8.5 rounded-lg px-4 text-xs font-bold bg-primary text-white"
                >
                  Tamam
                </Button>
              </div>
            }
          >
            <div className="grid grid-cols-12 gap-6 h-full min-h-[500px]">
              {/* Form Column */}
              <div className="col-span-12 xl:col-span-5 space-y-6">
                {/* Languages selectors inside modal if fields are localized */}
                {languages.length > 1 && visibleFields?.some(sub => !!(sub.options?.localized || sub.localized)) && (
                  <div className="p-1 bg-slate-100 rounded-lg flex gap-1 max-w-xs mb-2">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {}} // Active tab is managed globally at ContentEntryForm level
                        className={`flex-1 text-center py-1 rounded text-[10px] font-bold transition-all ${activeTab === lang.code ? 'bg-white shadow-xs text-slate-800' : 'text-slate-400'}`}
                        disabled // Keep disabled inside modal to follow global language tab state, or let it sync
                      >
                        {lang.name}
                      </button>
                    ))}
                  </div>
                )}



                <div className="grid grid-cols-1 gap-4.5">
                  {visibleFields?.map(sub => {
                    const isSubLocalized = !!(sub.options?.localized || sub.localized);
                    const subVal = isSubLocalized 
                      ? (editingBlock.data?.[sub.slug]?.[activeTab] ?? '') 
                      : (editingBlock.data?.[sub.slug] ?? '');
                    const subRequired = !!(sub.validation_rules?.required);
                    const isSubReq = subRequired && (!isSubLocalized || activeTab === defaultLangCode);
                    const isFullWidth = true; // Use single column inside drawer form for compact vertical spacing

                    return (
                      <div key={sub.slug} className="space-y-1.5 col-span-1">
                        <Label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                          {sub.name}
                          {isSubReq && <span className="text-red-500">*</span>}
                          {isSubLocalized && <Globe className="size-2.5 text-primary" title="Çevrilebilir alan" />}
                        </Label>

                        {sub.type === 'boolean' ? (
                          <div className="pt-1">
                            <Switch
                              checked={!!subVal}
                              onCheckedChange={(checked) => handleSubFieldChange(editingBlock.id, sub.slug, checked, isSubLocalized)}
                            />
                          </div>
                        ) : sub.type === 'text' ? (
                          <RichTextEditor
                            value={subVal}
                            onChange={(html) => handleSubFieldChange(editingBlock.id, sub.slug, html, isSubLocalized)}
                            placeholder={`${sub.name} girin...`}
                          />
                        ) : sub.type === 'media' || sub.type === 'gallery' || sub.type === 'media_gallery' ? (
                          <FileUpload
                            value={getMediaIds(subVal)}
                            onChange={(newVal) => handleSubFieldChange(editingBlock.id, sub.slug, newVal, isSubLocalized)}
                            isMultiple={sub.type !== 'media'}
                            accept={sub.slug === 'video_file' ? 'video/*' : 'image/*'}
                            description={sub.slug === 'video_file' ? 'MP4, WebM veya OGG formatında video yükleyin.' : 'PNG, JPG, GIF veya WEBP formatları desteklenir.'}
                            placeholder={`${sub.name} yüklemek için tıklayın veya sürükleyin`}
                          />
                        ) : sub.type === 'relation_content_type' || sub.slug === 'target_content_type_id' || sub.type === 'relation' ? (
                          <Select
                            value={subVal || ''}
                            onValueChange={(val) => handleSubFieldChange(editingBlock.id, sub.slug, val, isSubLocalized)}
                          >
                            <SelectTrigger className="bg-card h-9 text-xs">
                              <SelectValue placeholder="Koleksiyon seçin..." />
                            </SelectTrigger>
                            <SelectContent>
                              {contentTypesList?.filter(t => t.is_collection).map(t => (
                                <SelectItem key={t.id} value={t.slug} className="text-xs">
                                  {t.name} (/{t.slug})
                                </SelectItem>
                              ))}
                              {(!contentTypesList || contentTypesList.length === 0) && (
                                <SelectItem value="_empty" disabled>Koleksiyon bulunamadı</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        ) : sub.type === 'select' ? (
                          <Select
                            value={subVal || ''}
                            onValueChange={(val) => handleSubFieldChange(editingBlock.id, sub.slug, val, isSubLocalized)}
                          >
                            <SelectTrigger className="bg-card h-9 text-xs">
                              <SelectValue placeholder="Seçim yapın..." />
                            </SelectTrigger>
                            <SelectContent>
                              {sub.options?.choices?.map(c => (
                                <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            type={sub.type === 'number' ? 'number' : 'text'}
                            value={subVal}
                            onChange={(e) => handleSubFieldChange(editingBlock.id, sub.slug, sub.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value, isSubLocalized)}
                            placeholder={`${sub.name} girin...`}
                            className="h-9 text-xs"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Live Preview Column */}
              <div className="col-span-12 xl:col-span-7 border-t xl:border-t-0 xl:border-l border-slate-100 pt-6 xl:pt-0 xl:pl-6 flex flex-col h-full space-y-4">
                <div className="flex items-center justify-between shrink-0">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    🖥️ Canlı Bölüm Önizlemesi (Live Preview)
                  </span>
                  
                  {/* Device selectors */}
                  <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200/40">
                    {[
                      { device: 'desktop', label: 'Masaüstü' },
                      { device: 'tablet', label: 'Tablet' },
                      { device: 'mobile', label: 'Mobil' }
                    ].map((item) => (
                      <button
                        key={item.device}
                        type="button"
                        onClick={() => setEditingBlockDevice(item.device)}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                          editingBlockDevice === item.device
                            ? 'bg-white shadow-xs text-slate-800'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Simulated frame */}
                <div className="flex-1 bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex justify-center items-start overflow-y-auto max-h-[60vh] xl:max-h-none">
                  <div 
                    className="transition-all duration-300 w-full"
                    style={{ 
                      maxWidth: editingBlockDevice === 'mobile' ? '375px' : editingBlockDevice === 'tablet' ? '768px' : '100%',
                      boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)'
                    }}
                  >
                    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                      <BlockRenderer blocks={[editingBlock]} locale={activeTab} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </RightDrawer>
        );
      })()}
    </div>
  );
}
function FloatingLabelInput({
  id,
  type = 'text',
  value,
  onChange,
  labelText,
  isFieldRequired,
  isLocalized,
  helpText,
  placeholderText,
  disabled,
  className,
  onBlur,
  onFocus,
  isAiAvailable,
  aiLoadingField,
  handleAiAction,
  fieldSlug,
  t
}) {
  const [isFocused, setIsFocused] = useState(false);
  const isFloating = type === 'date' || isFocused || (value !== undefined && value !== null && value !== '');

  return (
    <div className="relative w-full group/floating">
      <Input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={isFloating ? placeholderText : ''}
        className={cn(
          'w-full px-4 h-12 text-sm transition-all bg-white border border-slate-200 focus-visible:border-primary focus-visible:ring-primary/20 rounded-xl',
          isAiAvailable && 'pr-28',
          className
        )}
        onFocus={(e) => {
          setIsFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          onBlur?.(e);
        }}
      />
      <label
        htmlFor={id}
        className={cn(
          'absolute text-slate-400 font-semibold left-4 duration-200 transform origin-[0] select-none pointer-events-none flex items-center gap-1.5 transition-all',
          isFloating
            ? 'text-xs text-primary top-0 -translate-y-1/2 bg-white px-1.5'
            : 'text-sm font-medium text-slate-400 top-1/2 -translate-y-1/2'
        )}
      >
        {labelText}
        {isFieldRequired && <span className="text-red-500">*</span>}
      </label>

      {/* Gemini AI Action Button Trigger */}
      {isAiAvailable && (
        <div className="absolute right-3 top-3 z-10 opacity-0 group-hover/floating:opacity-100 focus-within:opacity-100 transition-opacity flex items-center gap-1 select-none">
          <Select onValueChange={(action) => handleAiAction(fieldSlug, action)}>
            <SelectTrigger className="h-6 px-1.5 border border-border text-[9px] font-bold text-primary flex gap-1 bg-primary/5 hover:bg-primary/10 rounded">
              {aiLoadingField === fieldSlug ? (
                <LoaderCircleIcon className="size-2.5 animate-spin" />
              ) : (
                <Sparkles className="size-2.5 text-primary" />
              )}
              <span>GEMINI AI</span>
            </SelectTrigger>
            <SelectContent align="end" className="text-xs w-44">
              <SelectItem value="generate">🤖 İçerik Üret</SelectItem>
              <SelectItem value="refine">✏️ Profesyonelleştir / Geliştir</SelectItem>
              {isLocalized && (
                <SelectItem value="translate">🌐 Diğer Dile Çevir (Typewriter)</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

const getEntryTitle = (entry, lang) => {
  const title = entry?.data?.title;
  if (!title) return `Sürüm #${entry?.id || 'Yeni'}`;
  if (typeof title === 'object') {
    return title[lang] || title['tr'] || title['en'] || Object.values(title)[0] || '';
  }
  return String(title);
};

function MultiSelectRaceField({ field, value, onChange, raceEntries, activeTab, currentEntryId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Exclude current entry if it is in the list
  const availableRaces = useMemo(() => {
    if (!raceEntries) return [];
    return raceEntries.filter(race => String(race.id) !== String(currentEntryId));
  }, [raceEntries, currentEntryId]);

  const selectedIds = useMemo(() => {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(String);
    if (typeof value === 'string') return value.split(',').map(s => s.trim()).filter(Boolean);
    return [];
  }, [value]);

  const selectedRaces = useMemo(() => {
    return availableRaces.filter(race => selectedIds.includes(String(race.id)));
  }, [availableRaces, selectedIds]);

  const filteredRaces = useMemo(() => {
    return availableRaces.filter(race => {
      const title = getEntryTitle(race, activeTab).toLowerCase();
      return title.includes(searchQuery.toLowerCase());
    });
  }, [availableRaces, searchQuery, activeTab]);

  const toggleRace = (raceId) => {
    const idStr = String(raceId);
    let nextIds;
    if (selectedIds.includes(idStr)) {
      nextIds = selectedIds.filter(id => id !== idStr);
    } else {
      nextIds = [...selectedIds, idStr];
    }
    onChange(nextIds);
  };

  const removeRace = (e, raceId) => {
    e.stopPropagation();
    const idStr = String(raceId);
    const nextIds = selectedIds.filter(id => id !== idStr);
    onChange(nextIds);
  };

  // Close dropdown on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = () => setIsOpen(false);
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [isOpen]);

  const labelText = field.name;

  return (
    <div className="space-y-2 relative" onClick={e => e.stopPropagation()}>
      <Label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
        {labelText} <span className="text-red-500">*</span>
      </Label>
      
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "min-h-12 w-full p-2 flex flex-wrap gap-1.5 items-center bg-white border border-slate-200 hover:border-slate-300 rounded-xl cursor-pointer transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
          isOpen && "border-primary ring-2 ring-primary/20"
        )}
      >
        {selectedRaces.length === 0 ? (
          <span className="text-sm text-slate-400 pl-2">Yarış seçin...</span>
        ) : (
          selectedRaces.map(race => (
            <span 
              key={race.id} 
              className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-700 font-medium text-xs px-2.5 py-1 rounded-lg hover:bg-slate-200 transition-colors"
            >
              {getEntryTitle(race, activeTab)}
              <button 
                type="button" 
                onClick={(e) => removeRace(e, race.id)}
                className="text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-300/40 p-0.5"
              >
                <X className="size-3" />
              </button>
            </span>
          ))
        )}
        
        {/* Chevron status indicator */}
        <div className="ml-auto pr-1 text-slate-400">
          <ChevronDown className={cn("size-4 transition-transform duration-200", isOpen && "rotate-180")} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto overflow-x-hidden p-1.5 space-y-1 animate-fade-in-down">
          {/* Search box inside dropdown */}
          <div className="relative px-1 pb-1.5 border-b border-slate-100 flex items-center">
            <Search className="absolute left-3 size-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Yarış ara..." 
              value={searchQuery}
              onClick={e => e.stopPropagation()}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 h-8.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-primary focus:bg-white transition-all"
            />
          </div>
          
          <div className="max-h-44 overflow-y-auto space-y-0.5 pt-1">
            {filteredRaces.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-400">Yarış bulunamadı.</div>
            ) : (
              filteredRaces.map(race => {
                const isSelected = selectedIds.includes(String(race.id));
                return (
                  <div 
                    key={race.id} 
                    onClick={() => toggleRace(race.id)}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg cursor-pointer transition-all hover:bg-slate-50",
                      isSelected ? "text-primary bg-primary/5 hover:bg-primary/10" : "text-slate-700"
                    )}
                  >
                    <span>{getEntryTitle(race, activeTab)}</span>
                    {isSelected && <Check className="size-3.5 text-primary" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ContentEntryForm({ contentType, entry, onSuccess, onCancel, isInline = false }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isEdit = !!entry;
  const fields = contentType?.fields || [];

  // Form states
  const [dataValues, setDataValues] = useState({});
  const [seoValues, setSeoValues] = useState({
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
  });

  const [activeFormTab, setActiveFormTab] = useState('');
  const [splitPreview, setSplitPreview] = useState(false);

  const groups = useMemo(() => getGroups(contentType?.slug, fields), [contentType, fields]);

  const formTabs = useMemo(() => {
    const tabsList = groups.map((g) => ({
      id: g.id,
      name: g.name.replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
                  .replace(/[\u{2700}-\u{27BF}]/gu, '')
                  .replace(/[\u{2600}-\u{26FF}]/gu, '')
                  .replace(/[\u{2B50}]/gu, '')
                  .replace(/^[^\p{L}\p{N}\s]+/gu, '')
                  .trim(),
    }));

    // SEO Ayarları tab is disabled per user request
    // if (contentType?.settings?.seo_enabled || fields.some((f) => advancedSeoSlugs.includes(f.slug))) {
    //   tabsList.push({ id: 'advanced_seo', name: 'SEO Ayarları' });
    // }

    if (contentType?.settings?.monetization?.enabled) {
      tabsList.push({ id: 'monetization', name: 'Erişim & Ücretlendirme' });
    }

    return tabsList;
  }, [groups, contentType, fields]);

  useEffect(() => {
    if (formTabs.length > 0 && (!activeFormTab || !formTabs.some(t => t.id === activeFormTab))) {
      setActiveFormTab(formTabs[0].id);
    }
  }, [formTabs, activeFormTab]);

  // Group Accordion open states
  const [expandedGroups, setExpandedGroups] = useState({
    general: true,
    hero: true,
    story: true,
    info: true,
    privacy: true
  });

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  // UI Panel Toggle States
  const [revisionsOpen, setRevisionsOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState('desktop'); // desktop, tablet, mobile
  const [compareRevision, setCompareRevision] = useState(null);

  const toggleSplitPreview = () => {
    setSplitPreview((prev) => {
      const next = !prev;
      if (next) setRevisionsOpen(false);
      return next;
    });
  };

  const toggleRevisions = () => {
    setRevisionsOpen((prev) => {
      const next = !prev;
      if (next) setSplitPreview(false);
      return next;
    });
  };

  // Auto-save states
  const [autosaveStatus, setAutosaveStatus] = useState('saved'); // saved, saving, idle
  const [hasDraftToRecover, setHasDraftToRecover] = useState(false);
  const [recoveredDraftPayload, setRecoveredDraftPayload] = useState(null);

  // AI assistant loading state
  const [aiLoadingField, setAiLoadingField] = useState(null);

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

  // Fetch content types to populate relations targets inside dynamic zone collection display
  const { data: contentTypesList } = useQuery({
    queryKey: ['admin-content-types-list'],
    queryFn: async () => {
      const res = await apiFetch('/api/admin/content-types');
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    },
  });

  // Fetch existing races entries list for multi-race select
  const { data: raceEntries } = useQuery({
    queryKey: ['admin-race-entries-list', contentType?.id],
    queryFn: async () => {
      if (!contentType?.id || contentType?.slug !== 'yarislar') return [];
      const res = await apiFetch(`/api/admin/content-types/${contentType.id}/entries?limit=100`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    },
    enabled: !!contentType?.id && contentType?.slug === 'yarislar',
  });

  const languages = languagesResponse || [{ id: 1, name: 'Türkçe', code: 'tr', is_default: true }];
  const [activeTab, setActiveTab] = useState('tr');

  const defaultLangCode = useMemo(() => {
    return languages.find((l) => l.is_default)?.code || 'tr';
  }, [languages]);

  // Set default tab when languages are loaded
  useEffect(() => {
    if (languages.length > 0) {
      const defaultLang = languages.find((l) => l.is_default) || languages[0];
      setActiveTab(defaultLang.code);
    }
  }, [languagesResponse]);

  // Fetch revisions history
  const { data: revisionsData, refetch: refetchRevisions } = useQuery({
    queryKey: ['admin-content-revisions', contentType?.id, entry?.id],
    queryFn: async () => {
      if (!entry?.id) return [];
      const res = await apiFetch(`/api/admin/content-types/${contentType.id}/entries/${entry.id}/revisions`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    },
    enabled: !!entry?.id,
  });

  // Rollback Mutation
  const rollbackMutation = useMutation({
    mutationFn: async (revisionId) => {
      const res = await apiFetch(`/api/admin/content-types/${contentType.id}/entries/${entry.id}/revisions/${revisionId}/rollback`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Versiyon geri yüklenemedi.');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-content-entries', String(contentType.id)] });
      queryClient.invalidateQueries({ queryKey: ['admin-content-revisions', contentType?.id, entry?.id] });
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>İçerik başarıyla eski sürüme geri döndürüldü.</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
      setCompareRevision(null);
      setRevisionsOpen(false);
      // Remove recovery drafts as db is updated
      localStorage.removeItem(`core_cms_draft_${contentType.id}_${entry?.id || 'new'}`);
    },
  });

  // Load entry values
  useEffect(() => {
    if (languages.length > 0) {
      const values = {};
      fields.forEach((field) => {
        const isLocalized = !!field.options?.localized;
        const rawVal = entry?.data?.[field.slug];

        if (isLocalized) {
          const locObj = {};
          languages.forEach((lang) => {
            locObj[lang.code] = '';
          });

          if (rawVal && typeof rawVal === 'object' && !Array.isArray(rawVal)) {
            languages.forEach((lang) => {
              locObj[lang.code] = rawVal[lang.code] ?? '';
            });
          } else if (rawVal !== undefined && rawVal !== null) {
            const defaultCode = defaultLangCode;
            locObj[defaultCode] = rawVal;
          }
          values[field.slug] = locObj;
        } else {
          if (rawVal !== undefined && rawVal !== null) {
            values[field.slug] = rawVal;
          } else {
            if (field.type === 'boolean') {
              values[field.slug] = false;
            } else if (field.type === 'integer' || field.type === 'number') {
              values[field.slug] = 0;
            } else if (field.type === 'gallery' || field.type === 'media_gallery') {
              values[field.slug] = [];
            } else {
              values[field.slug] = '';
            }
          }
        }
      });

      if (contentType?.settings?.monetization?.enabled) {
        const defaultAccessType = contentType.settings.monetization.default_access_type || 'free';
        const defaultPrice = contentType.settings.monetization.default_price || 0;
        const defaultCurrency = contentType.settings.monetization.default_currency || 'TRY';

        values.access_type = entry?.data?.access_type ?? defaultAccessType;
        values.price = entry?.data?.price ?? defaultPrice;
        values.currency = entry?.data?.currency ?? defaultCurrency;
      }
      setDataValues(values);

      // Load SEO values
      if (entry?.seo) {
        setSeoValues({
          meta_title: entry.seo.meta_title || '',
          meta_description: entry.seo.meta_description || '',
          meta_keywords: entry.seo.meta_keywords || '',
        });
      } else {
        setSeoValues({
          meta_title: '',
          meta_description: '',
          meta_keywords: '',
        });
      }

      // Check Auto-Save Local Storage Drafts is disabled per user request
    }
  }, [entry, fields, languagesResponse, contentType]);

  // Handle value change helper
  const handleValueChange = (slug, val, langCode) => {
    setDataValues((prev) => {
      const field = fields.find((f) => f.slug === slug);
      const isLocalized = !!field?.options?.localized;
      if (isLocalized) {
        return {
          ...prev,
          [slug]: {
            ...prev[slug],
            [langCode]: val,
          },
        };
      } else {
        return {
          ...prev,
          [slug]: val,
        };
      }
    });
  };

  const renderField = (field) => {
    const isLocalized = !!field.options?.localized;
    const val = isLocalized
      ? (dataValues[field.slug]?.[activeTab] ?? '')
      : (dataValues[field.slug] ?? '');
    const isRequired = !!field.validation_rules?.required;
    const isFieldRequired = isRequired && (!isLocalized || activeTab === defaultLangCode);
    const isAiAvailable = field.type === 'string' || field.type === 'text' || field.type === 'varchar';

    const meta = fieldMetaMap[field.slug] || {};
    const labelText = labelTranslationMap[field.name] || field.name;
    const placeholderText = meta.placeholder || `${labelText} girin...`;
    const helpText = meta.helpText || '';

    if (field.slug === 'child_races') {
      if (!dataValues.is_multi_race) {
        return null;
      }
      return (
        <MultiSelectRaceField
          key={field.id}
          field={field}
          value={val}
          onChange={(newVal) => handleValueChange(field.slug, newVal, activeTab)}
          raceEntries={raceEntries}
          activeTab={activeTab}
          currentEntryId={entry?.id}
        />
      );
    }

    if (field.type === 'boolean') {
      return (
        <div key={field.id} className="pt-1.5 h-full">
          <div className="flex items-center justify-between px-4 py-3 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-colors h-12 select-none shadow-2xs">
            <Label htmlFor={field.slug} className="text-sm font-semibold text-slate-700 cursor-pointer flex-1 select-none pr-2">
              {labelText}
            </Label>
            <Switch
              id={field.slug}
              checked={!!val}
              onCheckedChange={(checked) => handleValueChange(field.slug, checked, activeTab)}
              className="shrink-0"
            />
          </div>
        </div>
      );
    }

    const isFloatingField = ![
      'boolean', 'dynamic_zone', 'text', 'json', 'gallery', 'media_gallery', 'media'
    ].includes(field.type);

    if (isFloatingField) {
      return (
        <div key={field.id} className="space-y-1 relative group/field">
          {field.type === 'integer' || field.type === 'number' ? (
            <FloatingLabelInput
              id={field.slug}
              type="number"
              value={val}
              onChange={(e) => handleValueChange(field.slug, e.target.value === '' ? '' : (parseInt(e.target.value, 10) || 0), activeTab)}
              labelText={labelText}
              isFieldRequired={isFieldRequired}
              isLocalized={isLocalized}
              helpText={helpText}
              placeholderText={placeholderText}
              disabled={aiLoadingField === field.slug}
              isAiAvailable={isAiAvailable}
              aiLoadingField={aiLoadingField}
              handleAiAction={handleAiAction}
              fieldSlug={field.slug}
              t={t}
            />
          ) : field.type === 'date' ? (
            <FloatingLabelInput
              id={field.slug}
              type="date"
              value={val}
              onChange={(e) => handleValueChange(field.slug, e.target.value, activeTab)}
              labelText={labelText}
              isFieldRequired={isFieldRequired}
              isLocalized={isLocalized}
              helpText={helpText}
              placeholderText={placeholderText}
              disabled={aiLoadingField === field.slug}
              isAiAvailable={isAiAvailable}
              aiLoadingField={aiLoadingField}
              handleAiAction={handleAiAction}
              fieldSlug={field.slug}
              t={t}
            />
          ) : field.type === 'email' ? (
            <FloatingLabelInput
              id={field.slug}
              type="email"
              value={val}
              onChange={(e) => handleValueChange(field.slug, e.target.value, activeTab)}
              labelText={labelText}
              isFieldRequired={isFieldRequired}
              isLocalized={isLocalized}
              helpText={helpText}
              placeholderText={placeholderText}
              disabled={aiLoadingField === field.slug}
              isAiAvailable={isAiAvailable}
              aiLoadingField={aiLoadingField}
              handleAiAction={handleAiAction}
              fieldSlug={field.slug}
              t={t}
            />
          ) : field.type === 'phone' ? (
            <FloatingLabelInput
              id={field.slug}
              type="tel"
              value={val}
              onChange={(e) => handleValueChange(field.slug, e.target.value, activeTab)}
              labelText={labelText}
              isFieldRequired={isFieldRequired}
              isLocalized={isLocalized}
              helpText={helpText}
              placeholderText={placeholderText}
              disabled={aiLoadingField === field.slug}
              isAiAvailable={isAiAvailable}
              aiLoadingField={aiLoadingField}
              handleAiAction={handleAiAction}
              fieldSlug={field.slug}
              t={t}
            />
          ) : field.type === 'url' ? (
            <FloatingLabelInput
              id={field.slug}
              type="url"
              value={val}
              onChange={(e) => handleValueChange(field.slug, e.target.value, activeTab)}
              labelText={labelText}
              isFieldRequired={isFieldRequired}
              isLocalized={isLocalized}
              helpText={helpText}
              placeholderText={placeholderText}
              disabled={aiLoadingField === field.slug}
              isAiAvailable={isAiAvailable}
              aiLoadingField={aiLoadingField}
              handleAiAction={handleAiAction}
              fieldSlug={field.slug}
              t={t}
            />
          ) : (
            // Default string/varchar input
            <FloatingLabelInput
              id={field.slug}
              type="text"
              value={val}
              onChange={(e) => handleValueChange(field.slug, e.target.value, activeTab)}
              labelText={labelText}
              isFieldRequired={isFieldRequired}
              isLocalized={isLocalized}
              helpText={helpText}
              placeholderText={placeholderText}
              disabled={aiLoadingField === field.slug}
              className={aiLoadingField === field.slug ? 'animate-pulse' : ''}
              isAiAvailable={isAiAvailable}
              aiLoadingField={aiLoadingField}
              handleAiAction={handleAiAction}
              fieldSlug={field.slug}
              t={t}
              onBlur={(e) => {
                if (field.slug === 'title') {
                  const currentSlugVal = isLocalized 
                    ? dataValues.slug?.[activeTab] 
                    : dataValues.slug;
                  if (!currentSlugVal) {
                    const slugified = e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9 -]/g, '')
                      .replace(/\s+/g, '-')
                      .replace(/-+/g, '-');
                    handleValueChange('slug', slugified, activeTab);
                  }
                }
              }}
            />
          )}
          {helpText && (
            <p className="text-[10px] text-slate-400 font-medium leading-normal pl-3 mt-1 block">
              {helpText}
            </p>
          )}
        </div>
      );
    }

    return (
      <div key={field.id} className="space-y-2 relative group/field">
        <div className="flex items-center justify-between">
          <Label htmlFor={field.slug} className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
            {labelText}
            {isFieldRequired && <span className="text-red-500">*</span>}
            {isLocalized && (
              <Globe className="size-3.5 text-primary/80" title={t('content_entries.translatable_field', 'Çevrilebilir alan')} />
            )}
            {helpText && (
              <span className="cursor-help text-slate-400 hover:text-slate-600 transition-colors" title={helpText}>
                <Info className="size-3.5" />
              </span>
            )}
          </Label>

          {/* Gemini AI Action Button Trigger */}
          {isAiAvailable && (
            <div className="opacity-0 group-hover/field:opacity-100 focus-within:opacity-100 transition-opacity flex items-center gap-1 select-none">
              <Select onValueChange={(action) => handleAiAction(field.slug, action)}>
                <SelectTrigger className="h-6 px-1.5 border border-border text-[9px] font-bold text-primary flex gap-1 bg-primary/5 hover:bg-primary/10 rounded">
                  {aiLoadingField === field.slug ? (
                    <LoaderCircleIcon className="size-2.5 animate-spin" />
                  ) : (
                    <Sparkles className="size-2.5 text-primary" />
                  )}
                  <span>GEMINI AI</span>
                </SelectTrigger>
                <SelectContent align="end" className="text-xs w-44">
                  <SelectItem value="generate">🤖 İçerik Üret</SelectItem>
                  <SelectItem value="refine">✏️ Profesyonelleştir / Geliştir</SelectItem>
                  {isLocalized && (
                    <SelectItem value="translate">🌐 Diğer Dile Çevir (Typewriter)</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Render based on field type schema */}
        {field.type === 'boolean' ? (
          <div className="flex items-center pt-1">
            <Switch
              id={field.slug}
              checked={!!val}
              onCheckedChange={(checked) => handleValueChange(field.slug, checked, activeTab)}
            />
          </div>
        ) : field.type === 'dynamic_zone' ? (
          <DynamicZoneField
            field={field}
            value={val || []}
            onChange={(newVal) => handleValueChange(field.slug, newVal, activeTab)}
            languages={languages}
            activeTab={activeTab}
            defaultLangCode={defaultLangCode}
            contentTypesList={contentTypesList}
          />
        ) : field.type === 'text' ? (
          <div className={aiLoadingField === field.slug ? 'opacity-60 pointer-events-none' : ''}>
            <RichTextEditor
              value={val}
              onChange={(html) => handleValueChange(field.slug, html, activeTab)}
              placeholder={placeholderText}
            />
          </div>
        ) : field.type === 'json' ? (
          <Textarea
            id={field.slug}
            value={val}
            onChange={(e) => handleValueChange(field.slug, e.target.value, activeTab)}
            placeholder={placeholderText}
            rows={4}
            className="font-mono text-sm"
          />
        ) : field.type === 'integer' || field.type === 'number' ? (
          <Input
            id={field.slug}
            type="number"
            value={val}
            onChange={(e) => handleValueChange(field.slug, e.target.value === '' ? '' : (parseInt(e.target.value, 10) || 0), activeTab)}
            placeholder={placeholderText}
          />
        ) : field.type === 'date' ? (
          <Input
            id={field.slug}
            type="date"
            value={val}
            onChange={(e) => handleValueChange(field.slug, e.target.value, activeTab)}
            className="w-full px-4 h-12 text-sm bg-white border border-slate-200 focus-visible:border-primary focus-visible:ring-primary/20 rounded-xl"
          />
        ) : field.type === 'email' ? (
          <Input
            id={field.slug}
            type="email"
            value={val}
            onChange={(e) => handleValueChange(field.slug, e.target.value, activeTab)}
            placeholder={placeholderText}
          />
        ) : field.type === 'phone' ? (
          <Input
            id={field.slug}
            type="tel"
            value={val}
            onChange={(e) => handleValueChange(field.slug, e.target.value, activeTab)}
            placeholder={placeholderText}
          />
        ) : field.type === 'url' ? (
          <Input
            id={field.slug}
            type="url"
            value={val}
            onChange={(e) => handleValueChange(field.slug, e.target.value, activeTab)}
            placeholder={placeholderText}
          />
        ) : field.type === 'gallery' || field.type === 'media_gallery' ? (
          <FileUpload
            value={getMediaIds(val)}
            onChange={(newVal) => handleValueChange(field.slug, newVal, activeTab)}
            isMultiple={true}
            placeholder={placeholderText}
          />
        ) : field.type === 'media' ? (
          <FileUpload
            value={getMediaIds(val)}
            onChange={(newVal) => handleValueChange(field.slug, newVal, activeTab)}
            isMultiple={false}
            placeholder={placeholderText}
          />
        ) : (
          // Default string/varchar input
          <Input
            id={field.slug}
            type="text"
            value={val}
            onChange={(e) => handleValueChange(field.slug, e.target.value, activeTab)}
            placeholder={placeholderText}
            disabled={aiLoadingField === field.slug}
            className={aiLoadingField === field.slug ? 'animate-pulse' : ''}
            onBlur={(e) => {
              if (field.slug === 'title') {
                const currentSlugVal = isLocalized 
                  ? dataValues.slug?.[activeTab] 
                  : dataValues.slug;
                if (!currentSlugVal) {
                  const slugified = e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9 -]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/-+/g, '-');
                  handleValueChange('slug', slugified, activeTab);
                }
              }
            }}
          />
        )}
        {helpText && (
          <p className="text-[11px] text-slate-400 font-medium leading-normal mt-1 block">
            {helpText}
          </p>
        )}
      </div>
    );
  };

  // Auto-Save Effect (Local storage write disabled per user request)
  useEffect(() => {
    if (!contentType) return;
    if (Object.keys(dataValues).length === 0) return;

    setAutosaveStatus('saving');
    const timer = setTimeout(() => {
      setAutosaveStatus('saved');
    }, 1000); // 1 second debounce

    return () => clearTimeout(timer);
  }, [dataValues, seoValues, contentType, entry]);

  // Load draft values
  const recoverDraft = () => {
    if (recoveredDraftPayload) {
      setDataValues(recoveredDraftPayload.data);
      if (recoveredDraftPayload.seo) {
        setSeoValues(recoveredDraftPayload.seo);
      }
      setHasDraftToRecover(false);
      toast.success(t('content_entries.draft.recovered', 'Yerel taslak başarıyla yüklendi.'));
    }
  };

  // Delete local draft
  const discardDraft = () => {
    const draftKey = `core_cms_draft_${contentType.id}_${entry?.id || 'new'}`;
    localStorage.removeItem(draftKey);
    setHasDraftToRecover(false);
    toast.info(t('content_entries.draft.discarded', 'Yerel taslak silindi.'));
  };

  // Submit mutation
  const mutation = useMutation({
    mutationFn: async (payload) => {
      const url = isEdit
        ? `/api/admin/content-types/${contentType.id}/entries/${entry.id}`
        : `/api/admin/content-types/${contentType.id}/entries`;
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
        throw new Error(errJson.message || 'Failed to save entry');
      }

      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-content-entries', String(contentType.id)] });
      queryClient.invalidateQueries({ queryKey: ['admin-content-revisions', contentType?.id, entry?.id] });
      
      // Remove autosave draft
      localStorage.removeItem(`core_cms_draft_${contentType.id}_${entry?.id || 'new'}`);

      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>{isEdit ? 'İçerik başarıyla güncellendi.' : 'Yeni içerik başarıyla eklendi.'}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
      onSuccess?.();
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

    // Basic validation for required fields
    for (const field of fields) {
      const isRequired = field.validation_rules?.required;
      const isLocalized = !!field.options?.localized;

      if (isRequired) {
        if (isLocalized) {
          for (const lang of languages) {
            // Only require for default language
            if (!lang.is_default) continue;

            const val = dataValues[field.slug]?.[lang.code];
            if (val === undefined || val === null || val === '') {
              toast.custom(
                () => (
                  <Alert variant="mono" icon="destructive" close={false}>
                    <AlertIcon>
                      <RiErrorWarningFill />
                    </AlertIcon>
                    <AlertTitle>{t('content_entries.messages.required_field', { name: `${field.name} (${lang.name})` }).replace('{name}', `${field.name} (${lang.name})`)}</AlertTitle>
                  </Alert>
                ),
                { position: 'top-center' }
              );
              return;
            }
          }
        } else {
          const val = dataValues[field.slug];
          if (val === undefined || val === null || val === '') {
            toast.custom(
              () => (
                <Alert variant="mono" icon="destructive" close={false}>
                  <AlertIcon>
                    <RiErrorWarningFill />
                  </AlertIcon>
                  <AlertTitle>{t('content_entries.messages.required_field', { name: field.name }).replace('{name}', field.name)}</AlertTitle>
                </Alert>
              ),
              { position: 'top-center' }
            );
            return;
          }
        }
      }
    }

    mutation.mutate({
      data: dataValues,
      seo: contentType?.settings?.seo_enabled ? seoValues : undefined,
      status: entry?.status || 'published', // default publish
    });
  };

  // Gemini AI simulation typewriter effect helper
  const handleAiAction = (fieldSlug, actionType) => {
    const field = fields.find((f) => f.slug === fieldSlug);
    const isLocalized = !!field?.options?.localized;
    const currentVal = isLocalized 
      ? (dataValues[fieldSlug]?.[activeTab] ?? '') 
      : (dataValues[fieldSlug] ?? '');

    setAiLoadingField(fieldSlug);

    // AI templates dictionary
    const aiResponses = {
      homepage: {
        title: {
          tr: 'Geleceğin Dijital Dünyasına Adım Atın',
          en: 'Step Into The Digital World Of The Future',
        },
        hero_title: {
          tr: 'Yenilikçi Web & Headless CMS Çözümleri',
          en: 'Innovative Web & Headless CMS Solutions',
        },
        hero_subtitle: {
          tr: 'İşletmenizi dijital dünyada büyütmek ve küresel pazarda rekabet gücü elde etmek için aradığınız en esnek, en hızlı CMS çözümleri tek çatı altında.',
          en: 'The most flexible, fastest CMS solutions you are looking for to grow your business in the digital world and compete globally.',
        },
        hero_cta_text: {
          tr: 'Bizimle İletişime Geçin',
          en: 'Get In Touch',
        },
        features_title: {
          tr: 'Neden Bizim Çözümlerimizi Seçmelisiniz?',
          en: 'Why Choose Our Solutions?',
        }
      },
      'about-us': {
        title: {
          tr: 'Hakkımızda - Kurumsal Yolculuğumuz',
          en: 'About Us - Our Corporate Journey',
        },
        story: {
          tr: '1995 yılında kurulan şirketimiz, yenilikçi yaklaşımı ve alanında uzman mühendislik kadrosu ile sektöre öncülük etmektedir. Teknolojik dönüşümlere öncülük ederek müşterilerimizin iş hedeflerine ulaşmalarını sağlıyoruz.',
          en: 'Founded in 1995, our company leads the industry with its innovative approach and expert engineering staff. We enable our customers to reach their goals by leading tech transformations.',
        },
        vision: {
          tr: 'Yenilikçi teknolojiler ve sürdürülebilir vizyon ile küresel pazarda en çok güvenilen, tercih edilen ve ilham veren teknoloji lideri olmak.',
          en: 'To be the most trusted, preferred, and inspiring technology leader in the global market with innovative technologies and a sustainable vision.',
        },
        mission: {
          tr: 'Müşterilerimizin dijital potansiyellerini en üst düzeye çıkaracak kullanıcı dostu ve güvenli yazılım çözümleri üretmek, çalışanlarımıza ve çevreye değer katmak.',
          en: 'To produce user-friendly and secure software solutions that maximize our customers\' digital potential, and to add value to employees and environment.',
        }
      },
      contact: {
        address: 'Merkez Ofis: Teknopark Ankara A Blok No: 12, Yenimahalle / Ankara',
        phone: '+90 312 444 0 538',
        email: 'info@metronic-cms.com',
        social_facebook: 'https://facebook.com/metronic.cms',
        social_instagram: 'https://instagram.com/metronic.cms',
      }
    };

    setTimeout(() => {
      let finalResponse = '';
      const textLang = isLocalized ? activeTab : 'tr';
      const cSlug = contentType?.slug;

      if (actionType === 'generate') {
        const responseSet = aiResponses[cSlug]?.[fieldSlug];
        if (responseSet) {
          finalResponse = typeof responseSet === 'string' ? responseSet : (responseSet[textLang] || responseSet['tr'] || '');
        } else {
          finalResponse = `${field.name} için üretilen örnek AI metni.`;
        }
      } else if (actionType === 'refine') {
        if (!currentVal) {
          finalResponse = `${field.name} için zenginleştirilmiş içerik.`;
        } else {
          finalResponse = `${currentVal} alanına daha profesyonel bir üslup ve akıcılık kazandırılmıştır.`;
        }
      } else if (actionType === 'translate') {
        // Translation simulation
        const currentLang = activeTab;
        const targetLang = currentLang === 'tr' ? 'en' : 'tr';
        const responseSet = aiResponses[cSlug]?.[fieldSlug];
        if (responseSet) {
          finalResponse = typeof responseSet === 'string' ? responseSet : (responseSet[targetLang] || '');
        } else {
          finalResponse = `Translation of "${currentVal}" to ${targetLang.toUpperCase()}`;
        }
        // Apply changes to target language tab instead of active tab
        typewriteText(fieldSlug, finalResponse, targetLang);
        setAiLoadingField(null);
        toast.success(`Çeviri tamamlandı ve diğer dile yazıldı.`);
        return;
      }

      typewriteText(fieldSlug, finalResponse, textLang);
      setAiLoadingField(null);
    }, 1200); // AI Loading delay simulation
  };

  const typewriteText = (fieldSlug, targetText, langCode) => {
    let currentIdx = 0;
    const interval = setInterval(() => {
      handleValueChange(fieldSlug, targetText.slice(0, currentIdx + 1), langCode);
      currentIdx++;
      if (currentIdx >= targetText.length) {
        clearInterval(interval);
      }
    }, 8); // Speedy premium typewriter effect
  };

  // Google SERP Character Counter Rules
  const titleCharCount = seoValues.meta_title?.length || 0;
  const descCharCount = seoValues.meta_description?.length || 0;

  // Mock layout preview builder for different slugs
  const previewMarkup = useMemo(() => {
    const lang = activeTab;
    const getValue = (slug) => {
      const val = dataValues[slug];
      if (val && typeof val === 'object' && !Array.isArray(val) && (val.hasOwnProperty('tr') || val.hasOwnProperty('en'))) {
        return val[lang] || val[defaultLangCode] || '';
      }
      const field = fields.find(f => f.slug === slug);
      if (field?.options?.localized) {
        return val?.[lang] || '';
      }
      return val || '';
    };

    const cSlug = contentType?.slug;

    if (cSlug === 'homepage') {
      return (
        <div className="font-sans antialiased text-slate-800 bg-slate-50 min-h-screen">
          <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
            <span className="font-extrabold text-lg text-primary tracking-tight">BRAND.CMS</span>
            <nav className="flex gap-4 text-xs font-semibold text-slate-500">
              <span className="text-primary border-b border-primary pb-0.5">Ana Sayfa</span>
              <span>Hakkımızda</span>
              <span>Hizmetler</span>
              <span>İletişim</span>
            </nav>
          </header>
          {/* Hero slider */}
          <section className="bg-slate-900 text-white py-20 px-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-cover bg-center opacity-10 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80')]" />
            <div className="max-w-2xl mx-auto relative z-10 space-y-6">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {getValue('hero_title') || 'Kahraman Başlık Belirtilmemiş'}
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed max-w-xl mx-auto">
                {getValue('hero_subtitle') || 'Kahraman alt başlığı buraya yazılacaktır.'}
              </p>
              <div className="pt-2">
                <button className="bg-primary hover:bg-primary/95 text-white font-bold text-xs px-6 py-3 rounded-lg shadow-lg hover:scale-105 transition-all">
                  {getValue('hero_cta_text') || 'Daha Fazla Bilgi'}
                </button>
              </div>
            </div>
          </section>
          {/* Features title */}
          <section className="py-16 px-8 max-w-5xl mx-auto space-y-12">
            <h2 className="text-xl font-bold text-center border-b border-slate-200 pb-4 max-w-sm mx-auto">
              {getValue('features_title') || 'Özellik Başlığı Belirtilmemiş'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: 'Ultra Hızlı Entegrasyon', desc: 'Modern headless altyapımız ile REST/GraphQL API bağlantıları mikro saniyeler içinde tamamlanır.' },
                { title: 'Gelişmiş Çok Dilli Yapı', desc: 'Uluslararası standartlarda yerelleştirme (i18n) özellikleri ile dilediğiniz dili tek tıkla aktif edin.' },
                { title: 'Güvenli Versiyon Kontrolü', desc: 'Her güncellemede sürüm yedekleri oluşturularak veri kaybı tehlikesi tamamen ortadan kaldırılır.' }
              ].map((feat, i) => (
                <div key={i} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-2">
                  <h3 className="font-bold text-sm text-slate-900">{feat.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </section>
          <footer className="bg-slate-900 text-slate-500 text-[10px] py-6 text-center border-t border-slate-800">
            © 2026 Brand CMS - Tüm Hakları Saklıdır.
          </footer>
        </div>
      );
    }

    if (cSlug === 'about-us') {
      return (
        <div className="font-sans antialiased text-slate-800 bg-white min-h-screen">
          <div className="h-44 bg-slate-100 flex items-center justify-center relative overflow-hidden bg-cover bg-center" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80')` }}>
            <div className="absolute inset-0 bg-slate-950/40" />
            <h1 className="text-2xl font-extrabold text-white z-10 tracking-tight">
              {getValue('title') || 'Hakkımızda'}
            </h1>
          </div>
          <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900">Kurumsal Hikayemiz</h2>
              <div 
                className="text-xs text-slate-600 leading-relaxed space-y-2"
                dangerouslySetInnerHTML={{ __html: getValue('story') || '<i>Şirket hikayesi henüz girilmemiş.</i>' }}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 space-y-2">
                <h3 className="font-bold text-sm text-primary flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-primary" /> Vizyonumuz
                </h3>
                <div 
                  className="text-xs text-slate-500 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: getValue('vision') || '<i>Vizyon metni belirtilmemiş.</i>' }}
                />
              </div>
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 space-y-2">
                <h3 className="font-bold text-sm text-success flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-success" /> Misyonumuz
                </h3>
                <div 
                  className="text-xs text-slate-500 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: getValue('mission') || '<i>Misyon metni belirtilmemiş.</i>' }}
                />
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (cSlug === 'contact') {
      return (
        <div className="font-sans antialiased text-slate-800 bg-slate-50 min-h-screen p-6">
          <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="bg-primary p-8 text-white space-y-2">
              <h2 className="text-xl font-bold tracking-tight">İletişime Geçin</h2>
              <p className="text-xs text-primary-foreground/80 leading-relaxed">
                Bizimle e-posta, telefon veya doğrudan merkez ofisimizi ziyaret ederek iletişime geçebilirsiniz.
              </p>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Adres Bilgisi</h4>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {getValue('address') || 'Adres bilgisi eklenmemiş.'}
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Telefon</h4>
                  <p className="text-xs text-slate-700 leading-relaxed font-mono font-bold">
                    {getValue('phone') || 'Telefon numarası eklenmemiş.'}
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">E-posta</h4>
                  <p className="text-xs text-primary leading-relaxed font-mono font-semibold">
                    {getValue('email') || 'E-posta adresi eklenmemiş.'}
                  </p>
                </div>
              </div>
              <div className="bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200 aspect-video relative overflow-hidden">
                <span className="text-slate-400 text-xs font-bold font-mono">MAP INTERACTIVE SIMULATION</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    const dynamicZoneField = fields.find(f => f.type === 'dynamic_zone');
    const dynamicBlocks = dynamicZoneField ? (getValue(dynamicZoneField.slug) || []) : [];

    const renderBlocks = () => {
      return (
        <div className="space-y-12 py-10 bg-white">
          {dynamicBlocks.map((block, idx) => {
            const blockData = block.data || {};
            const getBlockVal = (subSlug, isLoc) => {
              if (isLoc) return blockData[subSlug]?.[lang] || '';
              return blockData[subSlug] || '';
            };

            if (block.type === 'hero_banner') {
              const bg = getBlockVal('background_image');
              const bgUrl = bg && typeof bg === 'object' && bg.url ? bg.url : bg || '';
              const heading = getBlockVal('heading', true) || 'Giriş Başlığı Belirtilmemiş';
              const subtitle = getBlockVal('subtitle', true) || 'Giriş alt başlığı veya açıklama metni buraya gelecektir.';
              const ctaText = getBlockVal('cta_text', true) || 'Keşfet';
              const variant = block.variant || 'minimal_centered';

              const bgStyle = bgUrl ? { backgroundImage: `url('${bgUrl}')` } : {};

              if (variant === 'image_supported') {
                return (
                  <section key={block.id || idx} className="bg-slate-950 text-white py-16 px-8 relative overflow-hidden text-left">
                    <div className="absolute inset-0 bg-cover bg-center opacity-10" style={bgStyle} />
                    <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
                    <div className="max-w-5xl mx-auto relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                      <div className="md:col-span-7 space-y-5">
                        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                          {heading}
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                          {subtitle}
                        </p>
                        {ctaText && (
                          <div className="pt-2">
                            <span className="inline-flex items-center justify-center px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-lg shadow-sm">
                              {ctaText} →
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="md:col-span-5 flex justify-center">
                        <div className="w-full max-w-sm aspect-video bg-slate-800 rounded-xl overflow-hidden shadow-lg border border-slate-700/50 flex items-center justify-center relative group">
                          {bgUrl ? (
                            <img src={bgUrl} alt={heading} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-slate-500 text-xs font-semibold">🖼️ Görsel Seçilmedi</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>
                );
              }

              if (variant === 'form_input') {
                return (
                  <section key={block.id || idx} className="bg-slate-950 text-white py-16 px-8 relative overflow-hidden text-left">
                    <div className="absolute inset-0 bg-cover bg-center opacity-10" style={bgStyle} />
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
                    <div className="max-w-5xl mx-auto relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                      <div className="md:col-span-7 space-y-4">
                        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                          {heading}
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                          {subtitle}
                        </p>
                      </div>
                      <div className="md:col-span-5">
                        <div className="w-full max-w-sm bg-slate-900/60 backdrop-blur-md border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Bültene Katılın</h3>
                          <div className="space-y-3">
                            <input 
                              type="email" 
                              placeholder="E-posta adresiniz" 
                              disabled
                              className="w-full h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none"
                            />
                            <button 
                              type="button" 
                              disabled
                              className="w-full h-9 bg-primary text-white text-xs font-bold rounded-lg shadow-md hover:bg-primary/95 transition-all"
                            >
                              Abone Ol
                            </button>
                          </div>
                          <p className="text-[9px] text-slate-500 text-center leading-normal">
                            Verileriniz KVKK kapsamında gizli tutulmaktadır.
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>
                );
              }

              // default: minimal_centered
              return (
                <section key={block.id || idx} className="bg-slate-950 text-white py-20 px-8 text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-cover bg-center opacity-15" style={bgStyle} />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950/90" />
                  <div className="max-w-2xl mx-auto relative z-10 space-y-6">
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                      {heading}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl mx-auto">
                      {subtitle}
                    </p>
                    {ctaText && (
                      <div className="pt-2">
                        <span className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white text-xs font-bold rounded-xl shadow-md">
                          {ctaText} →
                        </span>
                      </div>
                    )}
                  </div>
                </section>
              );
            }

            if (block.type === 'rich_text') {
              return (
                <section key={block.id || idx} className="max-w-2xl mx-auto px-6 space-y-4">
                  {getBlockVal('title', true) && (
                    <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2">
                      {getBlockVal('title', true)}
                    </h2>
                  )}
                  <div 
                    className="text-xs text-slate-600 leading-relaxed space-y-2"
                    dangerouslySetInnerHTML={{ __html: getBlockVal('content', true) || '<i>İçerik girilmedi...</i>' }}
                  />
                </section>
              );
            }

            if (block.type === 'collection_display') {
              const targetSlug = blockData.target_content_type_id;
              const style = blockData.layout_style || 'grid';
              const limit = blockData.limit || 6;
              
              const targetTypeObj = contentTypesList?.find(t => t.slug === targetSlug || String(t.id) === String(targetSlug));
              const typeName = targetTypeObj ? targetTypeObj.name : 'İçerikler';

              const mockCards = Array.from({ length: Math.min(limit, 3) }).map((_, i) => ({
                id: i,
                title: `${typeName} Başlığı #${i + 1}`,
                summary: `${typeName} için simüle edilmiş arayüz kartı açıklaması. Bu alan canlı sunucudan dinamik olarak çekilir.`
              }));

              return (
                <section key={block.id || idx} className="max-w-4xl mx-auto px-6 space-y-6">
                  <h3 className="text-base font-bold text-slate-800 border-l-4 border-primary pl-2.5">
                    {getBlockVal('section_title', true) || `${typeName} Listesi`}
                  </h3>
                  
                  {style === 'carousel' ? (
                    <div className="flex gap-4 overflow-x-auto pb-2">
                      {mockCards.map((c) => (
                        <div key={c.id} className="min-w-[240px] bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-2 shrink-0">
                          <h4 className="font-bold text-xs text-slate-800">{c.title}</h4>
                          <p className="text-[10px] text-slate-500 leading-relaxed">{c.summary}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {mockCards.map((c) => (
                        <div key={c.id} className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-2">
                          <h4 className="font-bold text-xs text-slate-800">{c.title}</h4>
                          <p className="text-[10px] text-slate-500 leading-relaxed">{c.summary}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              );
            }

            if (block.type === 'entry_callout') {
              const bg = getBlockVal('background_image');
              const bgUrl = bg && typeof bg === 'object' && bg.url ? bg.url : bg || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80';
              return (
                <section key={block.id || idx} className="max-w-4xl mx-auto px-6">
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 bg-cover bg-right" style={{ backgroundImage: `url('${bgUrl}')` }}>
                    <div className="space-y-2 max-w-md bg-white/90 p-4 rounded-xl backdrop-blur-xs">
                      <h3 className="text-base font-extrabold text-slate-800">{getBlockVal('title', true) || 'Callout Başlığı'}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">{getBlockVal('description', true) || 'Açıklama metni...'}</p>
                    </div>
                    {getBlockVal('cta_text', true) && (
                      <div className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-lg shrink-0">
                        {getBlockVal('cta_text', true)}
                      </div>
                    )}
                  </div>
                </section>
              );
            }

            if (block.type === 'statistics_block') {
              return (
                <section key={block.id || idx} className="max-w-4xl mx-auto px-6 space-y-4">
                  {getBlockVal('title', true) && (
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center">{getBlockVal('title', true)}</h3>
                  )}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                      <div className="text-xl font-black text-primary">{getBlockVal('stat_1_number') || '0'}</div>
                      <div className="text-[10px] font-bold text-slate-500">{getBlockVal('stat_1_label', true) || 'Etiket 1'}</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                      <div className="text-xl font-black text-primary">{getBlockVal('stat_2_number') || '0'}</div>
                      <div className="text-[10px] font-bold text-slate-500">{getBlockVal('stat_2_label', true) || 'Etiket 2'}</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                      <div className="text-xl font-black text-primary">{getBlockVal('stat_3_number') || '0'}</div>
                      <div className="text-[10px] font-bold text-slate-500">{getBlockVal('stat_3_label', true) || 'Etiket 3'}</div>
                    </div>
                  </div>
                </section>
              );
            }

            if (block.type === 'faq_accordion') {
              const faqItems = [
                { q: getBlockVal('faq_1_question', true), a: getBlockVal('faq_1_answer', true) },
                { q: getBlockVal('faq_2_question', true), a: getBlockVal('faq_2_answer', true) },
                { q: getBlockVal('faq_3_question', true), a: getBlockVal('faq_3_answer', true) },
                { q: getBlockVal('faq_4_question', true), a: getBlockVal('faq_4_answer', true) },
                { q: getBlockVal('faq_5_question', true), a: getBlockVal('faq_5_answer', true) }
              ].filter(item => item.q);

              return (
                <section key={block.id || idx} className="max-w-4xl mx-auto px-6 space-y-4">
                  <div className="text-center space-y-1">
                    <h3 className="text-base font-bold text-slate-800">{getBlockVal('section_title', true) || 'Sıkça Sorulan Sorular'}</h3>
                    {getBlockVal('section_subtitle', true) && <p className="text-xs text-slate-500">{getBlockVal('section_subtitle', true)}</p>}
                  </div>
                  <div className="space-y-2">
                    {faqItems.length > 0 ? (
                      faqItems.map((item, i) => (
                        <div key={i} className="border border-slate-200/80 rounded-xl p-4 bg-slate-50/50">
                          <h4 className="font-bold text-xs text-slate-800 flex justify-between items-center">
                            <span>{item.q}</span>
                            <span className="text-slate-400 font-normal text-xs">▼</span>
                          </h4>
                          <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">{item.a || 'Cevap belirtilmedi...'}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 border border-dashed border-slate-200 text-xs text-slate-400 rounded-xl">
                        Henüz hiç SSS sorusu eklenmedi.
                      </div>
                    )}
                  </div>
                </section>
              );
            }

            if (block.type === 'features_grid') {
              const features = [
                { t: getBlockVal('feature_1_title', true), d: getBlockVal('feature_1_desc', true), i: getBlockVal('feature_1_icon') },
                { t: getBlockVal('feature_2_title', true), d: getBlockVal('feature_2_desc', true), i: getBlockVal('feature_2_icon') },
                { t: getBlockVal('feature_3_title', true), d: getBlockVal('feature_3_desc', true), i: getBlockVal('feature_3_icon') },
                { t: getBlockVal('feature_4_title', true), d: getBlockVal('feature_4_desc', true), i: getBlockVal('feature_4_icon') }
              ].filter(f => f.t);

              return (
                <section key={block.id || idx} className="max-w-4xl mx-auto px-6 space-y-4">
                  <div className="text-center space-y-1">
                    <h3 className="text-base font-bold text-slate-800">{getBlockVal('section_title', true) || 'Özelliklerimiz'}</h3>
                    {getBlockVal('section_subtitle', true) && <p className="text-xs text-slate-500">{getBlockVal('section_subtitle', true)}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {features.length > 0 ? (
                      features.map((f, i) => (
                        <div key={i} className="border border-slate-100 p-4 rounded-xl bg-slate-50 flex items-start gap-3">
                          <div className="bg-primary/10 text-primary p-2 rounded-lg text-xs font-bold shrink-0">✨</div>
                          <div>
                            <h4 className="font-bold text-xs text-slate-800">{f.t}</h4>
                            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{f.d}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-4 border border-dashed border-slate-200 text-xs text-slate-400 rounded-xl">
                        Henüz hiç özellik kartı doldurulmadı.
                      </div>
                    )}
                  </div>
                </section>
              );
            }

            if (block.type === 'integrations_logos') {
              const items = [
                { name: getBlockVal('integration_1_name'), desc: getBlockVal('integration_1_desc', true), logo: getBlockVal('integration_1_logo') },
                { name: getBlockVal('integration_2_name'), desc: getBlockVal('integration_2_desc', true), logo: getBlockVal('integration_2_logo') },
                { name: getBlockVal('integration_3_name'), desc: getBlockVal('integration_3_desc', true), logo: getBlockVal('integration_3_logo') },
                { name: getBlockVal('integration_4_name'), desc: getBlockVal('integration_4_desc', true), logo: getBlockVal('integration_4_logo') }
              ].filter(item => item.name);

              return (
                <section key={block.id || idx} className="max-w-4xl mx-auto px-6 space-y-4">
                  <div className="text-center space-y-1">
                    <h3 className="text-base font-bold text-slate-800">{getBlockVal('section_title', true) || 'Uyumlu Entegrasyonlar'}</h3>
                    {getBlockVal('section_subtitle', true) && <p className="text-xs text-slate-500">{getBlockVal('section_subtitle', true)}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {items.length > 0 ? (
                      items.map((item, i) => {
                        const imgUrl = item.logo && typeof item.logo === 'object' && item.logo.url ? item.logo.url : item.logo || 'https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=80&q=80';
                        return (
                          <div key={i} className="border border-slate-200/80 p-4 rounded-xl bg-slate-50 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <img src={imgUrl} className="size-8 rounded-lg object-contain bg-white border border-slate-100 p-0.5 shrink-0" alt="logo" />
                              <div>
                                <h4 className="font-bold text-xs text-slate-800">{item.name}</h4>
                                <p className="text-[9px] text-slate-500 leading-normal">{item.desc || 'Hızlı entegrasyon...'}</p>
                              </div>
                            </div>
                            <div className="w-8 h-4 rounded-full bg-primary/20 relative flex items-center p-0.5 cursor-pointer">
                              <div className="size-3 rounded-full bg-primary absolute right-0.5" />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-span-2 text-center py-4 border border-dashed border-slate-200 text-xs text-slate-400 rounded-xl">
                        Henüz entegrasyon kartı tanımlanmadı.
                      </div>
                    )}
                  </div>
                </section>
              );
            }

            if (block.type === 'testimonial_card') {
              const testimonials = [
                { n: getBlockVal('testimonial_1_name'), r: getBlockVal('testimonial_1_role', true), q: getBlockVal('testimonial_1_quote', true), a: getBlockVal('testimonial_1_avatar'), rating: getBlockVal('testimonial_1_rating') },
                { n: getBlockVal('testimonial_2_name'), r: getBlockVal('testimonial_2_role', true), q: getBlockVal('testimonial_2_quote', true), a: getBlockVal('testimonial_2_avatar'), rating: getBlockVal('testimonial_2_rating') },
                { n: getBlockVal('testimonial_3_name'), r: getBlockVal('testimonial_3_role', true), q: getBlockVal('testimonial_3_quote', true), a: getBlockVal('testimonial_3_avatar'), rating: getBlockVal('testimonial_3_rating') }
              ].filter(t => t.n);

              return (
                <section key={block.id || idx} className="max-w-4xl mx-auto px-6 space-y-4">
                  <div className="text-center space-y-1">
                    <h3 className="text-base font-bold text-slate-800">{getBlockVal('section_title', true) || 'Kullanıcı Yorumları'}</h3>
                    {getBlockVal('section_subtitle', true) && <p className="text-xs text-slate-500">{getBlockVal('section_subtitle', true)}</p>}
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {testimonials.length > 0 ? (
                      testimonials.map((t, i) => {
                        const avatarUrl = t.a && typeof t.a === 'object' && t.a.url ? t.a.url : t.a || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80';
                        return (
                          <div key={i} className="border border-slate-200/80 p-4 rounded-xl bg-slate-50 flex flex-col justify-between gap-3">
                            <div className="space-y-2">
                              <div className="text-amber-400 text-xs">{'★'.repeat(Number(t.rating) || 5)}</div>
                              <p className="text-[10px] text-slate-600 italic leading-relaxed">"{t.q}"</p>
                            </div>
                            <div className="flex items-center gap-2 border-t border-slate-100 pt-2.5">
                              <img src={avatarUrl} className="size-6 rounded-full object-cover shrink-0" alt="avatar" />
                              <div className="overflow-hidden">
                                <h4 className="font-bold text-[10px] text-slate-800 truncate">{t.n}</h4>
                                <p className="text-[9px] text-slate-400 truncate">{t.r || 'Müşteri'}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-span-3 text-center py-4 border border-dashed border-slate-200 text-xs text-slate-400 rounded-xl">
                        Henüz hiç yorum kartı doldurulmadı.
                      </div>
                    )}
                  </div>
                </section>
              );
            }

            if (block.type === 'timeline_milestones') {
              const items = [
                { y: getBlockVal('milestone_1_year'), t: getBlockVal('milestone_1_title', true), d: getBlockVal('milestone_1_desc', true) },
                { y: getBlockVal('milestone_2_year'), t: getBlockVal('milestone_2_title', true), d: getBlockVal('milestone_2_desc', true) },
                { y: getBlockVal('milestone_3_year'), t: getBlockVal('milestone_3_title', true), d: getBlockVal('milestone_3_desc', true) },
                { y: getBlockVal('milestone_4_year'), t: getBlockVal('milestone_4_title', true), d: getBlockVal('milestone_4_desc', true) }
              ].filter(item => item.y || item.t);

              return (
                <section key={block.id || idx} className="max-w-4xl mx-auto px-6 space-y-4">
                  <div className="text-center space-y-1">
                    <h3 className="text-base font-bold text-slate-800">{getBlockVal('section_title', true) || 'Kurumsal Tarihçemiz'}</h3>
                    {getBlockVal('section_subtitle', true) && <p className="text-xs text-slate-500">{getBlockVal('section_subtitle', true)}</p>}
                  </div>
                  <div className="relative border-l-2 border-slate-100 pl-6 ml-4 space-y-6">
                    {items.length > 0 ? (
                      items.map((item, i) => (
                        <div key={i} className="relative">
                          <div className="absolute -left-[31px] top-1 size-4 rounded-full border-2 border-primary bg-white" />
                          <div className="space-y-1 bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
                            <span className="text-[10px] font-black text-primary uppercase tracking-wider">{item.y || 'Tarih belirtilmedi'}</span>
                            <h4 className="font-bold text-xs text-slate-800">{item.t || 'Kilometre Taşı Başlığı'}</h4>
                            <p className="text-[10px] text-slate-500 leading-relaxed">{item.d}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 border border-dashed border-slate-200 text-xs text-slate-400 rounded-xl">
                        Henüz hiç kronolojik adım eklenmedi.
                      </div>
                    )}
                  </div>
                </section>
              );
            }

            if (block.type === 'event_banner') {
              const filled = Number(blockData.filled_seats) || 0;
              const total = Number(blockData.total_seats) || 100;
              const pct = total > 0 ? Math.min(Math.round((filled / total) * 100), 100) : 0;
              return (
                <section key={block.id || idx} className="max-w-4xl mx-auto px-6">
                  <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded border border-violet-100">{getBlockVal('event_code') || '#ETKINLIK'}</span>
                        <span className="text-[10px] text-slate-400">Canlı Etkinlik</span>
                      </div>
                      <h3 className="text-sm font-extrabold text-slate-800">{getBlockVal('event_title', true) || 'Etkinlik Başlığı'}</h3>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{getBlockVal('event_subtitle', true) || 'Detaylar ve açıklama...'}</p>
                    </div>
                    <div className="flex flex-col md:items-end gap-3 shrink-0">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                          <span>Kontenjan:</span>
                          <span>{filled} / {total} ({pct}%)</span>
                        </div>
                        <div className="w-40 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      {getBlockVal('cta_text', true) && (
                        <div className="bg-violet-600 text-white text-[10px] font-bold px-3.5 py-1.5 rounded-lg text-center cursor-pointer">
                          {getBlockVal('cta_text', true)}
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              );
            }

            if (block.type === 'team_grid') {
              const members = [
                { n: getBlockVal('member_1_name'), r: getBlockVal('member_1_role', true), a: getBlockVal('member_1_avatar') },
                { n: getBlockVal('member_2_name'), r: getBlockVal('member_2_role', true), a: getBlockVal('member_2_avatar') },
                { n: getBlockVal('member_3_name'), r: getBlockVal('member_3_role', true), a: getBlockVal('member_3_avatar') },
                { n: getBlockVal('member_4_name'), r: getBlockVal('member_4_role', true), a: getBlockVal('member_4_avatar') }
              ].filter(m => m.n);

              return (
                <section key={block.id || idx} className="max-w-4xl mx-auto px-6 space-y-4">
                  <div className="text-center space-y-1">
                    <h3 className="text-base font-bold text-slate-800">{getBlockVal('section_title', true) || 'Ekibimiz'}</h3>
                    {getBlockVal('section_subtitle', true) && <p className="text-xs text-slate-500">{getBlockVal('section_subtitle', true)}</p>}
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    {members.length > 0 ? (
                      members.map((m, i) => {
                        const avatarUrl = m.a && typeof m.a === 'object' && m.a.url ? m.a.url : m.a || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80';
                        return (
                          <div key={i} className="border border-slate-200/80 p-4 rounded-xl bg-slate-50 text-center space-y-3">
                            <img src={avatarUrl} className="size-10 rounded-full object-cover mx-auto border border-slate-200 shadow-xs" alt="avatar" />
                            <div className="space-y-0.5">
                              <h4 className="font-bold text-[11px] text-slate-800 truncate">{m.n}</h4>
                              <p className="text-[9px] text-slate-400 truncate">{m.r || 'Rol Belirtilmedi'}</p>
                            </div>
                            <div className="flex justify-center gap-1.5 text-[9px] text-slate-400">
                              <span>🔗 LinkedIn</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-span-4 text-center py-4 border border-dashed border-slate-200 text-xs text-slate-400 rounded-xl">
                        Henüz hiç ekip üyesi eklenmedi.
                      </div>
                    )}
                  </div>
                </section>
              );
            }

            if (block.type === 'campaign_banner') {
              const promo = getBlockVal('promo_code');
              const pct = Math.min(Math.max(Number(blockData.progress_percent) || 0, 0), 100);
              return (
                <section key={block.id || idx} className="max-w-4xl mx-auto px-6">
                  <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-2 grow min-w-0">
                      <div className="flex items-center gap-2">
                        {getBlockVal('discount_label', true) && (
                          <span className="text-[10px] font-black text-fuchsia-600 bg-fuchsia-50 px-2 py-0.5 rounded border border-fuchsia-100 uppercase">{getBlockVal('discount_label', true)}</span>
                        )}
                        <span className="text-[10px] text-slate-400">Aktif Kampanya</span>
                      </div>
                      <h3 className="text-sm font-extrabold text-slate-800 truncate">{getBlockVal('title', true) || 'Kampanya Başlığı'}</h3>
                      <p className="text-[11px] text-slate-500 leading-relaxed truncate">{getBlockVal('description', true) || 'Açıklama detayı...'}</p>
                      {pct > 0 && (
                        <div className="space-y-1 pt-1 max-w-xs">
                          <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-fuchsia-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="text-[9px] text-slate-400 font-medium">Kampanya Kotası: {pct}% Doldu</div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col md:items-end gap-3 shrink-0">
                      {promo && (
                        <div className="border border-dashed border-slate-300 bg-white px-3 py-1.5 rounded-lg text-center space-y-0.5">
                          <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Kupon Kodu</span>
                          <span className="font-mono text-xs font-black text-slate-700 block tracking-wide">{promo}</span>
                        </div>
                      )}
                      {getBlockVal('cta_text', true) && (
                        <div className="bg-fuchsia-600 text-white text-[10px] font-bold px-4 py-1.5 rounded-lg text-center cursor-pointer">
                          {getBlockVal('cta_text', true)}
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              );
            }

            if (block.type === 'cta_section') {
              return (
                <section key={block.id || idx} className="max-w-4xl mx-auto px-6 py-6">
                  <div className="bg-slate-900 text-white rounded-2xl p-6 text-center space-y-4">
                    <h3 className="text-sm font-extrabold truncate">{getBlockVal('section_title', true) || 'Maceraya Katılmaya Hazır mısın?'}</h3>
                    <p className="text-[11px] text-slate-300 max-w-xl mx-auto leading-relaxed truncate">{getBlockVal('section_subtitle', true) || 'Açıklama detayı...'}</p>
                    <div className="pt-2 max-w-xs mx-auto">
                      <div className="bg-primary text-primary-foreground text-[10px] font-bold py-1.5 px-4 rounded-lg inline-block">
                        {getBlockVal('button_text', true) || 'Buton / Kayıt Ol'}
                      </div>
                    </div>
                  </div>
                </section>
              );
            }

            return null;
          })}
        </div>
      );
    };

    if (dynamicZoneField && dynamicBlocks.length > 0) {
      return (
        <div className="font-sans antialiased text-slate-800 bg-white min-h-screen flex flex-col justify-between">
          <div>
            <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <span className="font-extrabold text-lg text-primary tracking-tight">BRAND.CMS</span>
              <nav className="flex gap-4 text-xs font-semibold text-slate-500">
                <span className="text-primary border-b border-primary pb-0.5">Dinamik Önizleme</span>
              </nav>
            </header>
            {renderBlocks()}
          </div>
          <footer className="bg-slate-900 text-slate-500 text-[10px] py-6 text-center border-t border-slate-800 mt-12">
            © 2026 Brand CMS - Tüm Hakları Saklıdır.
          </footer>
        </div>
      );
    }

    // Default template fallback (like Blog)
    return (
      <div className="font-sans antialiased text-slate-800 bg-white min-h-screen max-w-2xl mx-auto px-6 py-12 space-y-6">
        <div className="space-y-3 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase bg-primary/10 text-primary px-2 py-0.5 rounded">HABERLER</span>
            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1"><Calendar className="size-3" /> 23.06.2026</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {getValue('title') || 'Makale Başlığı Buraya Gelecektir'}
          </h1>
        </div>
        <div className="h-56 bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200/60 bg-cover bg-center" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80')` }}>
          <span className="text-slate-400 text-xs font-bold font-mono bg-white/80 px-3 py-1.5 rounded-lg border border-slate-200">GÖRSEL ÖNİZLEME</span>
        </div>
        <div 
          className="text-xs text-slate-600 leading-relaxed space-y-3"
          dangerouslySetInnerHTML={{ __html: getValue('content') || getValue('story') || '<i>Makale içeriği belirtilmemiş. Sol taraftaki zengin metin editörünü kullanarak detayları girin.</i>' }}
        />
      </div>
    );
  }, [activeTab, fields, dataValues, contentType, contentTypesList]);

  // groups is now memoized at the top of the component

  return (
    <>
      <div className="space-y-4">
        {/* Visual Page Header Panel (Only shown in Inline view) */}
        {/* Unified Page Toolbar (Only shown in Inline view) */}
        {isInline && (
          <Toolbar className="border border-slate-200/85 rounded-2xl p-5 bg-white shadow-xs mb-2">
            <ToolbarHeading>
              <div className="flex items-center gap-3">
                {onCancel && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={onCancel} 
                    className="gap-2 h-11 text-sm font-bold rounded-xl px-4 shrink-0"
                  >
                    <ArrowLeft className="size-4" /> Geri Dön
                  </Button>
                )}
                <div>
                  <ToolbarTitle className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    {contentType?.slug === 'homepage' ? '🏠 ' : contentType?.slug === 'about-us' ? '👥 ' : '📄 '}
                    {isEdit ? 'İçeriği Düzenle' : 'Yeni İçerik Girişi'} ({contentType?.name})
                  </ToolbarTitle>
                  {contentType?.description && (
                    <p className="text-[10px] text-slate-400 font-medium leading-normal mt-0.5">
                      {contentType.description}
                    </p>
                  )}
                </div>
              </div>
            </ToolbarHeading>

            <ToolbarActions>
              {/* Auto-Save dot indicator */}
              <div className="flex items-center gap-2 mr-2">
                <span className="flex h-2 w-2 relative">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${autosaveStatus === 'saving' ? 'bg-amber-400' : 'bg-green-400'} opacity-75`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${autosaveStatus === 'saving' ? 'bg-amber-500' : 'bg-green-500'}`}></span>
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {autosaveStatus === 'saving' ? 'Kaydediliyor...' : 'Otomatik Kaydet'}
                </span>
              </div>

              {/* Language Selector tabs */}
              {languages.length > 1 && (
                <div className="flex items-center gap-1.5 mr-2">
                  <span className="text-[9px] font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                    DİL:
                  </span>
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-[140px] w-full">
                    <TabsList variant="default" size="xs" className="bg-slate-200/60 p-0.5 rounded-lg h-9">
                      {languages.map((lang) => (
                        <TabsTrigger key={lang.code} value={lang.code} className="cursor-pointer text-[11px] font-bold py-0.5 h-8 px-3">
                          {lang.code.toUpperCase()}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {isEdit && (
                  <Button
                    type="button"
                    variant="dim"
                    size="sm"
                    className={`h-11 gap-1.5 font-bold text-sm rounded-xl px-4 border ${revisionsOpen ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/15' : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50'}`}
                    onClick={toggleRevisions}
                  >
                    <History className="size-4" />
                    Geçmiş Değişiklikler
                  </Button>
                )}
                <Button
                  type="button"
                  variant="dim"
                  size="sm"
                  className="h-11 gap-2 font-bold text-sm rounded-xl px-4 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                  onClick={() => setPreviewOpen(true)}
                >
                  <Eye className="size-4" />
                  Önizle
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-11 gap-2 font-bold text-sm rounded-xl px-4 border border-slate-300 hover:bg-slate-50 text-slate-700"
                  onClick={() => {
                    mutation.mutate({
                      data: dataValues,
                      seo: contentType?.settings?.seo_enabled ? seoValues : undefined,
                      status: 'draft',
                    });
                  }}
                  disabled={mutation.isPending}
                >
                  <Save className="size-4" />
                  Taslak Kaydet
                </Button>
                <Button
                  type="submit"
                  form="content-entry-form"
                  size="sm"
                  className="h-11 gap-2 font-bold text-sm rounded-xl px-5 bg-primary text-white hover:bg-primary/90"
                  disabled={mutation.isPending}
                >
                  <Globe className="size-4" />
                  Yayına Al
                </Button>
              </div>
            </ToolbarActions>
          </Toolbar>
        )}

        {/* Dynamic Split Layout: Form on Left, Live Preview on Right */}
        <div className="grid grid-cols-12 gap-6 items-start">
          <div className={`space-y-4 transition-all duration-300 ${splitPreview ? 'col-span-12 xl:col-span-7' : revisionsOpen ? 'col-span-12 lg:col-span-8' : 'col-span-12'}`}>
            <form id="content-entry-form" onSubmit={handleSubmit} className="space-y-6">
              
              {/* Tab Navigation Header (Sticky) */}
              {formTabs.length > 1 && (
                <div className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-[90px] z-10 flex items-center gap-6 overflow-x-auto scrollbar-none px-2 mb-6">
                  {formTabs.map((tab) => {
                    const isActive = activeFormTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveFormTab(tab.id)}
                        className={`pb-3.5 pt-1.5 text-sm font-bold transition-all relative whitespace-nowrap cursor-pointer select-none ${
                          isActive
                            ? 'text-primary font-black'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {tab.name.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim()}
                        {isActive && (
                          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Group Panels (Without outer Card panels) */}
              {groups.map((group) => {
                if (activeFormTab !== group.id) return null;
                return (
                  <div key={group.id} className="animate-fade-in">
                    <div className="grid grid-cols-12 gap-5">
                      {group.resolvedFields.map((field) => {
                        let colSpan = 'col-span-12';
                        
                        const isHalfWidth = [
                          'boolean', 'date', 'time', 'number', 'phone', 'url', 'email', 'relation', 'select', 'string'
                        ].includes(field.type) || [
                          'is_multi_race', 'is_sales_active', 'is_free', 'start_date', 'start_time', 
                          'manager_name', 'manager_phone', 'registration_deadline', 'max_participants', 
                          'distance', 'elevation', 'descent', 'contest_id', 'elevation', 'descent',
                          'start_point', 'finish_point', 'category_id', 'status_select',
                          'cover_image', 'graphic_image', 'gpx_file', 'strava_file'
                        ].includes(field.slug);

                        const isForceFullWidth = (field.type === 'text' || field.type === 'rich_text' || field.type === 'gallery' || field.type === 'media' || field.type === 'dynamic_zone' || field.slug === 'title' || field.slug === 'name' || field.slug === 'content' || field.slug === 'whats_included' || field.slug === 'location_embed' || field.slug === 'youtube_embed' || field.slug === 'child_races') && ![
                          'cover_image', 'graphic_image', 'gpx_file', 'strava_file'
                        ].includes(field.slug);

                        if (isHalfWidth && !isForceFullWidth) {
                          colSpan = 'col-span-12 md:col-span-6';
                        }
                        
                        if (field.type === 'boolean') {
                          colSpan = 'col-span-12 sm:col-span-4';
                        }

                        return (
                          <div key={field.id} className={colSpan}>
                            {renderField(field)}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Advanced Settings (SEO & Meta Fields Panel) (Without outer Card) */}
              {activeFormTab === 'advanced_seo' && (contentType?.settings?.seo_enabled || fields.some((f) => advancedSeoSlugs.includes(f.slug))) && (
                <div className="animate-fade-in space-y-5">
                  {/* Google SERP SEO Preview Panel */}
                  {contentType?.settings?.seo_enabled && (
                    <div className="space-y-4">
                      <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Arama Sonucu Önizlemesi</h5>
                      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs space-y-1">
                        <span className="text-[10px] text-slate-400 font-mono block">
                          https://yourdomain.com/{contentType.slug}/{typeof dataValues.slug === 'object' ? (dataValues.slug?.[activeTab] || dataValues.slug?.[defaultLangCode] || '') : (dataValues.slug || '')}
                        </span>
                        <h4 className="text-base text-[#1a0dab] font-semibold leading-snug hover:underline cursor-pointer tracking-wide">
                          {seoValues.meta_title || (typeof dataValues.title === 'object' ? (dataValues.title?.[activeTab] || dataValues.title?.[defaultLangCode] || '') : (dataValues.title || '')) || 'Arama Motoru Başlığı'}
                        </h4>
                        <p className="text-xs text-[#4d5156] leading-relaxed break-words line-clamp-2">
                          {seoValues.meta_description || 'Bu alan arama sonuçlarında görünecektir. Arama motorları için özel açıklama metni girin...'}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Meta Title */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <Label htmlFor="meta_title" className="font-semibold text-slate-700">Arama Motoru Başlığı (Meta Title)</Label>
                            <span className={`text-[10px] font-bold ${titleCharCount > 60 ? 'text-amber-500' : 'text-slate-400'}`}>
                              {titleCharCount}/60
                            </span>
                          </div>
                          <Input
                            id="meta_title"
                            placeholder={(typeof dataValues.title === 'object' ? (dataValues.title?.[activeTab] || dataValues.title?.[defaultLangCode] || '') : (dataValues.title || '')) || 'Varsayılan başlığı kullan'}
                            value={seoValues.meta_title}
                            onChange={(e) => setSeoValues(prev => ({ ...prev, meta_title: e.target.value }))}
                            className="h-9 text-xs"
                          />
                          <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-300 ${titleCharCount > 60 ? 'bg-amber-500' : titleCharCount > 0 ? 'bg-primary' : 'bg-transparent'}`}
                              style={{ width: `${Math.min((titleCharCount / 60) * 100, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Meta Description */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <Label htmlFor="meta_description" className="font-semibold text-slate-700">Meta Açıklaması (Meta Description)</Label>
                            <span className={`text-[10px] font-bold ${descCharCount > 160 ? 'text-amber-500' : 'text-slate-400'}`}>
                              {descCharCount}/160
                            </span>
                          </div>
                          <Input
                            id="meta_description"
                            placeholder="Arama motoru açıklaması girin..."
                            value={seoValues.meta_description}
                            onChange={(e) => setSeoValues(prev => ({ ...prev, meta_description: e.target.value }))}
                            className="h-9 text-xs"
                          />
                          <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-300 ${descCharCount > 160 ? 'bg-amber-500' : descCharCount > 0 ? 'bg-primary' : 'bg-transparent'}`}
                              style={{ width: `${Math.min((descCharCount / 160) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Keywords */}
                      <div className="space-y-1.5">
                        <Label htmlFor="meta_keywords" className="text-xs font-semibold text-slate-700">Anahtar Kelimeler (Keywords)</Label>
                        <Input
                          id="meta_keywords"
                          placeholder="virgülle ayırarak girin: kurumsal, teknoloji, cms"
                          value={seoValues.meta_keywords}
                          onChange={(e) => setSeoValues(prev => ({ ...prev, meta_keywords: e.target.value }))}
                          className="h-9 text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {/* Advanced SEO fields if any exist */}
                  {fields.some((f) => advancedSeoSlugs.includes(f.slug)) && (
                    <div className="pt-4 border-t border-slate-100 space-y-4">
                      <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Teknik Arama Motoru Parametreleri (OpenGraph, Canonical)</h5>
                      {fields
                        .filter((field) => advancedSeoSlugs.includes(field.slug))
                        .map((field) => renderField(field))
                      }
                    </div>
                  )}
                </div>
              )}

              {/* Standard Monetization if enabled (Without outer Card) */}
              {activeFormTab === 'monetization' && contentType?.settings?.monetization?.enabled && (
                <div className="animate-fade-in grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase">{t('content_entries.monetization.access_type', 'Erişim Tipi')}</Label>
                    <Select 
                      value={dataValues.access_type ?? 'free'} 
                      onValueChange={(val) => handleValueChange('access_type', val)}
                    >
                      <SelectTrigger className="bg-card h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">{t('content_entries.monetization.free', 'Ücretsiz')}</SelectItem>
                        <SelectItem value="protected">{t('content_entries.monetization.members_only', 'Sadece Üye')}</SelectItem>
                        <SelectItem value="premium">{t('content_entries.monetization.single_purchase', 'Tekil Satış (Premium)')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {dataValues.access_type === 'premium' && (
                    <>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase">{t('content_entries.monetization.price', 'Fiyat')}</Label>
                        <Input
                          type="number"
                          value={dataValues.price ?? 0}
                          onChange={(e) => handleValueChange('price', Number(e.target.value))}
                          className="h-9 text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase">{t('content_entries.monetization.currency', 'Para Birimi')}</Label>
                        <Select 
                          value={dataValues.currency ?? 'TRY'} 
                          onValueChange={(val) => handleValueChange('currency', val)}
                        >
                          <SelectTrigger className="bg-card h-9 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TRY">{t('content_entries.monetization.currency_try', 'TL (TRY)')}</SelectItem>
                            <SelectItem value="USD">{t('content_entries.monetization.currency_usd', 'Dolar (USD)')}</SelectItem>
                            <SelectItem value="EUR">{t('content_entries.monetization.currency_eur', 'Euro (EUR)')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Action Buttons Footer */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-border mt-6">
                {onCancel && (
                  <Button type="button" variant="outline" onClick={onCancel} className="h-11 rounded-xl px-4 text-sm font-bold">
                    {t('content_entries.dialog.cancel', 'İptal')}
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={mutation.isPending}
                  className="h-11 rounded-xl px-5 text-sm font-bold"
                >
                  {mutation.isPending ? (
                    <LoaderCircleIcon className="size-4.5 animate-spin mr-1.5" />
                  ) : (
                    <Save className="size-4.5 mr-1.5" />
                  )}
                  {t('content_entries.dialog.save', 'Kaydet')}
                </Button>
              </div>
            </form>
          </div>

          {/* Sticky Inline Split Preview Simulator Panel */}
          {splitPreview && (
            <div className="col-span-12 xl:col-span-5 sticky top-[95px] h-[calc(100vh-140px)] border border-slate-200 rounded-2xl bg-white p-5 flex flex-col justify-between overflow-hidden shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4 shrink-0 bg-white">
                <h4 className="text-xs font-extrabold flex items-center gap-1.5 text-slate-800">
                  <Eye className="size-4 text-primary" />
                  ÖNİZLEME SİMÜLATÖRÜ
                </h4>
                {/* Viewport Width device triggers */}
                <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
                  {[
                    { device: 'desktop', icon: Monitor, label: 'Masaüstü' },
                    { device: 'tablet', icon: Tablet, label: 'Tablet' },
                    { device: 'mobile', icon: Smartphone, label: 'Mobil' }
                  ].map((item) => (
                    <Button
                      key={item.device}
                      variant={previewDevice === item.device ? 'default' : 'ghost'}
                      size="xs"
                      className="h-6 px-2 gap-1 text-[9px] font-bold rounded"
                      onClick={() => setPreviewDevice(item.device)}
                    >
                      <item.icon className="size-3" />
                      <span>{item.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
              {/* Preview frame container */}
              <div className="flex-1 bg-slate-100 flex items-center justify-center p-3 overflow-hidden rounded-xl">
                <div 
                  className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-y-auto transition-all duration-300 h-full w-full max-h-full animate-fade-in"
                  style={{
                    maxWidth: previewDevice === 'mobile' ? '375px' : previewDevice === 'tablet' ? '768px' : '100%',
                  }}
                >
                  {previewMarkup}
                </div>
              </div>
            </div>
          )}

          {/* Revisions sidebar details */}
          {revisionsOpen && (
            <div className="col-span-12 lg:col-span-4 border border-border rounded-xl bg-card p-5 h-[calc(100vh-14rem)] overflow-y-auto kt-scrollable-y-hover flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h4 className="text-xs font-extrabold flex items-center gap-1.5">
                    <History className="size-4 text-primary" />
                    REVİZYON GEÇMİŞİ
                  </h4>
                  <Button variant="ghost" size="xs" onClick={() => { setRevisionsOpen(false); setCompareRevision(null); }} className="h-6 w-6 p-0">
                    <X className="size-3.5" />
                  </Button>
                </div>

                {/* Compare dialog view */}
                {compareRevision ? (
                  <div className="space-y-4 bg-slate-50 border border-slate-200 p-4 rounded-xl relative">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-[10px] font-bold text-primary">SÜRÜM #{compareRevision.version} KARŞILAŞTIRILIYOR</span>
                      <Button variant="ghost" size="xs" onClick={() => setCompareRevision(null)} className="h-5 text-[10px] font-bold">Vazgeç</Button>
                    </div>
                    <div className="space-y-3 max-h-72 overflow-y-auto text-[11px] leading-relaxed">
                      {fields.map((f) => {
                        const isLocalized = !!f.options?.localized;
                        const current = isLocalized 
                          ? (dataValues[f.slug]?.[activeTab] ?? '') 
                          : (dataValues[f.slug] ?? '');
                        const oldVal = isLocalized
                          ? (compareRevision.data?.[f.slug]?.[activeTab] ?? '')
                          : (compareRevision.data?.[f.slug] ?? '');

                        if (current === oldVal) return null;

                        return (
                          <div key={f.id} className="space-y-1 p-2 bg-white rounded border border-border">
                            <span className="font-extrabold text-[10px] uppercase text-muted-foreground block">{f.name}</span>
                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                              <div className="bg-red-50 text-red-700 p-1.5 rounded overflow-x-auto">
                                <span className="font-bold block text-[8px] text-red-500">Mevcut Değer:</span>
                                {String(current) || 'Boş'}
                              </div>
                              <div className="bg-green-50 text-green-700 p-1.5 rounded overflow-x-auto">
                                <span className="font-bold block text-[8px] text-green-500">Eski Versiyon:</span>
                                {String(oldVal) || 'Boş'}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {fields.every(f => {
                        const isLocalized = !!f.options?.localized;
                        const current = isLocalized ? (dataValues[f.slug]?.[activeTab] ?? '') : (dataValues[f.slug] ?? '');
                        const oldVal = isLocalized ? (compareRevision.data?.[f.slug]?.[activeTab] ?? '') : (compareRevision.data?.[f.slug] ?? '');
                        return current === oldVal;
                      }) && <div className="text-center text-xs text-muted-foreground py-6">Bu sürüm ile mevcut form değerleri arasında fark bulunamadı.</div>}
                    </div>

                    <div className="pt-2">
                      <Button
                        type="button"
                        onClick={() => rollbackMutation.mutate(compareRevision.id)}
                        disabled={rollbackMutation.isPending}
                        className="w-full text-xs font-bold gap-1 h-9 rounded-lg"
                      >
                        {rollbackMutation.isPending ? (
                          <LoaderCircleIcon className="size-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="size-3.5" />
                        )}
                        Bu Sürümü Geri Yükle
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {revisionsData && revisionsData.length > 0 ? (
                      revisionsData.map((rev) => (
                        <div 
                          key={rev.id}
                          onClick={() => setCompareRevision(rev)}
                          className="border border-border p-3.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors space-y-1.5 group/rev"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-[11px] text-slate-800">Sürüm #{rev.version}</span>
                            <span className="text-[10px] text-primary opacity-0 group-hover/rev:opacity-100 font-bold transition-opacity">Karşılaştır &gt;</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-1"><Calendar className="size-3.5" /> {new Date(rev.created_at).toLocaleString()}</span>
                            <span className="font-semibold text-slate-700">{rev.creator?.name || 'Anonim'}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-xs text-muted-foreground py-10">Kayıtlı revizyon bulunmamaktadır.</div>
                    )}
                  </div>
                )}
              </div>
              <div className="text-[10px] text-muted-foreground border-t border-border pt-3 mt-4">
                Her kaydettiğinizde otomatik olarak yeni bir sürüm (revizyon) yedeği oluşturulacaktır.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Live Device Viewport Simulator Modal */}
      {previewOpen && (
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-6xl w-[90vw] h-[85vh] p-0 gap-0 overflow-hidden flex flex-col justify-between">
            <DialogHeader className="px-6 py-4 border-b border-border bg-slate-50 flex flex-row items-center justify-between gap-4">
              <div>
                <DialogTitle className="text-sm font-extrabold flex items-center gap-1.5">
                  <Eye className="size-4 text-primary" />
                  CANLI ÖNİZLEME SİMÜLATÖRÜ
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Şu an formda girilen içerik değerlerinin canlı web sayfası üzerindeki mobil, tablet ve masaüstü önizlemesi.
                </DialogDescription>
              </div>

              {/* Viewport Width device triggers */}
              <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
                {[
                  { device: 'desktop', icon: Monitor, label: 'Masaüstü (100%)' },
                  { device: 'tablet', icon: Tablet, label: 'Tablet (768px)' },
                  { device: 'mobile', icon: Smartphone, label: 'Mobil (375px)' }
                ].map((item) => (
                  <Button
                    key={item.device}
                    variant={previewDevice === item.device ? 'default' : 'ghost'}
                    size="xs"
                    className="h-7 px-2 gap-1 text-[10px] font-bold rounded"
                    onClick={() => setPreviewDevice(item.device)}
                  >
                    <item.icon className="size-3.5" />
                    <span>{item.label}</span>
                  </Button>
                ))}
              </div>
            </DialogHeader>

            {/* Simulated Device Frame Sandbox */}
            <div className="flex-1 bg-slate-100 flex items-center justify-center p-6 overflow-hidden">
              <div 
                className="bg-white border border-slate-200 shadow-xl rounded-2xl overflow-y-auto transition-all duration-300 h-full kt-scrollable-y-hover"
                style={{
                  width: previewDevice === 'mobile' ? '375px' : previewDevice === 'tablet' ? '768px' : '100%',
                  maxHeight: '100%',
                }}
              >
                {previewMarkup}
              </div>
            </div>

            <div className="px-6 py-3 border-t border-border bg-slate-50 text-[10px] text-muted-foreground flex justify-between items-center">
              <span>* Önizleme form verilerini veri tabanına kaydetmeden anlık olarak önyüz kodunda işler.</span>
              <Button size="xs" variant="dim" onClick={() => setPreviewOpen(false)} className="h-7 font-bold">Kapat</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

