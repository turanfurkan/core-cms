'use client';

import { useState, useEffect, useMemo, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Save,
  LoaderCircleIcon,
  Globe,
  Settings,
  Sparkles,
  ArrowUpRight,
  Eye,
  FileText,
  FileImage,
  Layers,
  LayoutGrid,
  List,
  Columns,
  ChevronRight,
  RefreshCw,
  Search,
  Check,
  Monitor,
  Tablet,
  Smartphone,
  Plus,
  Trash2,
  Copy,
  EyeOff,
  Unlock,
  Lock,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Database,
  Palette,
  AlignLeft,
  BookOpen,
  MapPin,
  HelpCircle,
  Mail,
  Video,
  UserCheck,
  TrendingUp,
  Sliders,
  Megaphone,
  Bell,
  Code,
  Handshake
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Container } from '@/components/common/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { toast } from 'sonner';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import PublicHeader from '@/components/common/public-header';
import PublicFooter from '@/components/common/public-footer';
import BlockRenderer from '@/components/blocks/block-renderer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUpload } from '@/components/ui/file-upload';

import { cn } from '@/lib/utils';
import { Link2, ChevronDown } from 'lucide-react';

function SearchableRouteSelector({
  value,
  onChange,
  SYSTEM_ROUTES,
  pagesList,
  activeLang
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const safePagesList = pagesList || [];
  
  const pageRoutes = useMemo(() => {
    return safePagesList.map(p => {
      let rawTitle = '';
      if (p.title) {
        if (typeof p.title === 'object') {
          rawTitle = p.title[activeLang] || p.title.tr || p.title.en || '';
        } else {
          rawTitle = p.title;
        }
      }

      let rawSlug = '';
      if (p.slug) {
        if (typeof p.slug === 'object') {
          rawSlug = p.slug[activeLang] || p.slug.tr || p.slug.en || '';
        } else {
          rawSlug = p.slug;
        }
      }

      const path = rawSlug.startsWith('/') ? rawSlug : `/${rawSlug}`;
      const label = rawTitle.trim() || `Sayfa: ${rawSlug || '/'}` || 'İsimsiz Sayfa';

      return {
        label: label,
        path: path,
        isPage: true
      };
    });
  }, [safePagesList, activeLang]);

  const allRoutes = useMemo(() => {
    return [
      { label: 'Bağlantı Yok', path: '', isNone: true },
      ...SYSTEM_ROUTES.map(r => ({ ...r, isSystem: true })),
      ...pageRoutes,
      { label: 'Özel Bağlantı / Dış Link...', path: 'custom', isCustom: true }
    ];
  }, [pageRoutes, SYSTEM_ROUTES]);

  const filtered = useMemo(() => {
    if (!search) return allRoutes;
    const lower = search.toLowerCase();
    return allRoutes.filter(r => 
      r.label.toLowerCase().includes(lower) || 
      (r.path && r.path.toLowerCase().includes(lower))
    );
  }, [allRoutes, search]);

  const currentRoute = allRoutes.find(r => r.path === value);
  const hasMatch = allRoutes.some(r => !r.isCustom && !r.isNone && r.path === value);
  
  const displayLabel = value === ''
    ? 'Bağlantı Yok'
    : hasMatch
      ? currentRoute?.label || value
      : 'Özel Bağlantı / Dış Link...';

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium rounded-xl border border-border bg-background shadow-xs hover:bg-muted/10 transition-all text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <Link2 className="size-4 text-muted-foreground/80 shrink-0" />
        <span className="truncate flex-grow text-foreground/90">{displayLabel}</span>
        <ChevronDown className="size-4 text-muted-foreground/75 shrink-0 ml-auto" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 mt-1.5 z-50 rounded-2xl border border-border/80 bg-popover text-popover-foreground shadow-xl flex flex-col min-h-0 max-h-[320px] animate-in fade-in-50 slide-in-from-top-1 duration-150 p-1.5">
          <div className="relative flex items-center border-b border-border/40 pb-1.5 mb-1 shrink-0 px-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/80" />
            <input
              type="text"
              placeholder="Sayfa veya link ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-8 py-1.5 text-xs rounded-lg border border-border/50 bg-muted/20 focus:outline-none focus:ring-1 focus:ring-primary/45 focus:bg-background text-foreground"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3.5 text-muted-foreground hover:text-foreground text-[10px] font-semibold"
              >
                Temizle
              </button>
            )}
          </div>

          <div className="flex-grow overflow-y-auto min-h-0 space-y-0.5 max-h-[240px] px-0.5">
            {filtered.length > 0 ? (
              <>
                {filtered.map((item, idx) => {
                  const isFirstSystem = item.isSystem && (idx === 0 || !filtered[idx - 1].isSystem);
                  const isFirstPage = item.isPage && (idx === 0 || !filtered[idx - 1].isPage);
                  const isSelected = value === item.path;

                  return (
                    <div key={`${item.isSystem ? 'sys' : item.isPage ? 'page' : 'meta'}-${idx}`}>
                      {isFirstSystem && (
                        <div className="text-[9px] font-bold text-zinc-400 px-2.5 py-1.5 uppercase tracking-wider bg-muted/15 border-y border-border/30 my-1 select-none rounded-sm">
                          Sistem Sayfaları
                        </div>
                      )}
                      {isFirstPage && (
                        <div className="text-[9px] font-bold text-zinc-400 px-2.5 py-1.5 uppercase tracking-wider bg-muted/15 border-y border-border/30 my-1 select-none rounded-sm">
                          Oluşturulan Sayfalar
                        </div>
                      )}
                      
                      <button
                        type="button"
                        onClick={() => {
                          onChange(item.path);
                          setOpen(false);
                          setSearch('');
                        }}
                        className={cn(
                          "w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all text-left cursor-pointer",
                          isSelected 
                            ? "bg-muted/70 text-foreground font-semibold" 
                            : "text-foreground/90 hover:bg-muted/40 hover:text-foreground"
                        )}
                      >
                        <span className="truncate flex-grow">{item.label}</span>
                        {item.path && !isSelected && (
                          <span className="text-[10px] text-muted-foreground/80 font-mono shrink-0 ml-2">{item.path}</span>
                        )}
                        {isSelected && (
                          <Check className="size-3.5 text-primary shrink-0 ml-2" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </>
            ) : (
              <div className="text-center py-6 text-[11px] text-muted-foreground">
                Sayfa bulunamadı.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// 1. Component Library Definitions & Default Configurations
// ----------------------------------------------------
const COMPONENT_LIBRARY = [
  {
    type: 'video_hero',
    name: 'Giriş Bölümü (Hero)',
    category: 'hero',
    popular: true,
    icon: Video,
    defaultData: {
      content: {
        heading: 'Geleceğin Macerasını Bugün Yaşa!',
        subtitle: 'Muhteşem doğa parkurları ve heyecan dolu yarışlarla dolu Türkiye\'nin en büyük outdoor spor festivaline sen de katıl.',
        button_text: 'Yarışları Keşfet',
        button_link: { type: 'custom', url: '/races', target: '_self' },
        video_url: 'https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-background-1611-large.mp4'
      },
      styles: {
        height: '70vh',
        overlay_color: '#09090b',
        overlay_opacity: 50,
        text_align: 'center'
      },
      responsive: { hideMobile: false, hideTablet: false }
    }
  },
  {
    type: 'features_grid',
    name: 'Grid (Izgara) Yapısı',
    category: 'grid',
    popular: true,
    icon: LayoutGrid,
    defaultData: {
      content: {
        section_title: {
          tr: 'Dinamik Izgara Özellikleri',
          en: 'Dynamic Grid Features'
        },
        section_subtitle: {
          tr: 'Doğa sporları festivalimizin öne çıkan özellikleri ve sunduğu imkanlar.',
          en: 'Outstanding features of our outdoor sports festival and facilities.'
        },
        feature_1_title: { tr: 'Macera Parkurları', en: 'Adventure Tracks' },
        feature_1_desc: { tr: 'Her yaşa ve seviyeye uygun dağ parkurları.', en: 'Mountain tracks suitable for all ages.' },
        feature_1_icon: 'Compass',
        
        feature_2_title: { tr: 'Profesyonel Rehberler', en: 'Professional Guides' },
        feature_2_desc: { tr: 'Alanında uzman lisanslı eğitmen kadrosu.', en: 'Expert licensed instructors.' },
        feature_2_icon: 'Users',
        
        feature_3_title: { tr: 'Güvenli Ekipman', en: 'Safe Equipment' },
        feature_3_desc: { tr: 'En son güvenlik sertifikalı modern ekipmanlar.', en: 'Modern safety-certified gear.' },
        feature_3_icon: 'Shield',
        
        feature_4_title: { tr: 'Eşsiz Manzaralar', en: 'Stunning Landscapes' },
        feature_4_desc: { tr: 'Doğanın merkezinde unutulmaz anlar.', en: 'Unforgettable moments in nature.' },
        feature_4_icon: 'Sparkles'
      },
      styles: { columns: '4', gap: '24', paddingTop: '48', paddingBottom: '48', card_style: 'default' },
      responsive: { hideMobile: false, hideTablet: false }
    }
  },
  {
    type: 'categories_grid',
    name: 'Kategori Grid',
    category: 'grid',
    popular: true,
    icon: Layers,
    defaultData: {
      content: {
        section_title: {
          tr: 'Kategoriler',
          en: 'Categories'
        },
        section_subtitle: {
          tr: 'İçerik ve etkinlik kategorilerimizi keşfedin.',
          en: 'Explore all our event categories.'
        }
      },
      styles: { columns: '4', gap: '24', paddingTop: '48', paddingBottom: '48' },
      responsive: { hideMobile: false, hideTablet: false }
    }
  },
  {
    type: 'news_ticker',
    name: 'Duyuru / Haber Bandı (News Ticker)',
    category: 'custom',
    popular: true,
    icon: Megaphone,
    defaultData: {
      content: {
        label: {
          tr: 'SON DAKİKA',
          en: 'BREAKING NEWS'
        },
        source_type: 'manual',
        target_content_type_id: 'posts',
        target_item_ids: [],
        items: [
          { tr: 'Winter Swim Fethiye kayıtları başladı! Hemen kaydolun.', en: 'Winter Swim Fethiye registration is now open! Register now.' },
          { tr: 'Likya Yolu Ultra Maratonu 2026 parkur detayları açıklandı.', en: 'Lycian Way Ultra Marathon 2026 course details announced.' },
          { tr: 'Göcek Open Water yarış sonuçları yayınlandı.', en: 'Göcek Open Water race results have been published.' }
        ]
      },
      styles: {
        speed: '25',
        bg_color: '#03112b',
        text_color: '#ffffff',
        badge_bg: '#f97316',
        badge_text: '#ffffff',
        direction: 'left',
        paddingTop: '12',
        paddingBottom: '12'
      },
      responsive: { hideMobile: false, hideTablet: false }
    }
  },
  {
    type: 'statistics_block',
    name: 'İstatistik Şeridi / Sayaç (Feature Stats)',
    category: 'counter',
    popular: true,
    icon: TrendingUp,
    defaultData: {
      content: {
        section_title: {
          tr: 'Rakamlarla SPORFEST',
          en: 'SPORFEST in Numbers'
        },
        section_subtitle: {
          tr: 'Güven ve prestijimiz; tamamlanan dev etkinliklerimiz, mutlu sporcularımız ve küresel katılımcı sayımızla tescillidir.',
          en: 'Our trust and prestige is proven by completed major events, happy athletes, and global reach.'
        },
        items: [
          {
            number: '12+',
            source: 'manual',
            label: { tr: 'Yarış Sayısı', en: 'Race Count' },
            desc: { tr: 'Her yıl düzenlenen uluslararası standartlarda yarışlar.', en: 'International standard races organized every year.' },
            icon: 'Trophy'
          },
          {
            number: '4.500+',
            source: 'manual',
            label: { tr: 'Toplam Katılımcı', en: 'Total Participants' },
            desc: { tr: 'Parkurlarımızda sınırlarını zorlayan lisanslı sporcular.', en: 'Registered athletes pushing limits on our tracks.' },
            icon: 'Users'
          },
          {
            number: '25+',
            source: 'manual',
            label: { tr: 'Sponsor Adedi', en: 'Sponsors' },
            desc: { tr: 'Bizimle birlikte sporun gelişimine destek veren markalar.', en: 'Brands supporting the growth of sports with us.' },
            icon: 'Shield'
          },
          {
            number: '120 km+',
            source: 'manual',
            label: { tr: 'Parkur Uzunluğu', en: 'Track Length' },
            desc: { tr: 'Zorlu kanyonlar ve vadiler boyunca eşsiz rotalar.', en: 'Unique routes across challenging canyons and valleys.' },
            icon: 'Activity'
          }
        ]
      },
      styles: {
        bg_color: '#03112b',
        text_color: '#ffffff',
        accent_color: '#f97316',
        card_style: 'glass',
        columns: '4',
        paddingTop: '64',
      },
      responsive: { hideMobile: false, hideTablet: false }
    }
  },
  {
    type: 'sponsors_block',
    name: 'Sponsorlar & Partnerler',
    category: 'sponsors',
    popular: true,
    icon: Handshake,
    defaultData: {
      content: {
        section_title: { tr: 'Değerli Sponsorlarımız', en: 'Our Sponsors' },
        section_subtitle: { tr: 'Etkinliklerimizin gerçekleşmesine katkı sağlayan ve spora değer katan partnerlerimiz.', en: 'Partners who contribute to our events and bring value to sports.' },
        items: [
          { name: 'RedBull', logo: '/media/brand-logos/google-webdev.svg', link: 'https://redbull.com', tier: 'gold' },
          { name: 'Garmin', logo: '/media/brand-logos/google-webdev.svg', link: 'https://garmin.com', tier: 'gold' },
          { name: 'Salomon', logo: '/media/brand-logos/google-webdev.svg', link: 'https://salomon.com', tier: 'silver' },
          { name: 'Coca-Cola', logo: '/media/brand-logos/google-webdev.svg', link: 'https://coca-cola.com', tier: 'silver' }
        ]
      },
      styles: {
        layout: 'grid',
        bg_color: '#ffffff',
        text_color: '#09090b',
        accent_color: '#f97316',
        speed: '30',
        paddingTop: '64',
        paddingBottom: '64'
      },
      responsive: { hideMobile: false, hideTablet: false }
    }
  },
  {
    type: 'slider',
    name: 'Slider / Carousel',
    category: 'slider',
    popular: true,
    icon: Sliders,
    defaultData: {
      content: {
        autoplay: true,
        height: '500',
        slides: [
          {
            title: { tr: 'Keşfedilmemiş Doğa Rotaları', en: 'Unexplored Nature Trails' },
            subtitle: { tr: 'Eşsiz kanyonlar ve vadiler boyunca sürecek bir macera.', en: 'An adventure tracing unique canyons and valleys.' },
            image: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=1200&q=80',
            button_text: { tr: 'Detayları İncele', en: 'View Details' },
            button_link: '/tours'
          },
          {
            title: { tr: 'Zirve Yarışları Heyecanı', en: 'Summit Race Excitement' },
            subtitle: { tr: 'Yüksek irtifada sınırlarınızı zorlayacak büyük maraton.', en: 'The high-altitude marathon pushing your limits.' },
            image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
            button_text: { tr: 'Kayıt Ol', en: 'Register Now' },
            button_link: '/races'
          }
        ]
      },
      styles: { height: '500', autoplay: true },
      responsive: { hideMobile: false, hideTablet: false }
    }
  },
  {
    type: 'collection_display',
    name: 'Haberler & Blog (News & Blog)',
    category: 'list_view',
    popular: true,
    icon: List,
    defaultData: {
      content: {
        section_title: { tr: 'Öne Çıkan Rotalar', en: 'Featured Routes' },
        layout_style: 'grid',
        target_content_type_id: 'blog'
      },
      hydrated_data: [
        { id: 1, title: 'Likya Yolu Doğa Yürüyüşü', slug: 'likya-yolu', published_at: new Date().toISOString(), data: { title: 'Likya Yolu Doğa Yürüyüşü', summary: 'Antik kentler ve muhteşem deniz manzaralı rota.' } },
        { id: 2, title: 'Kapadokya Balon Turu', slug: 'kapadokya-balon', published_at: new Date().toISOString(), data: { title: 'Kapadokya Balon Turu', summary: 'Peri bacaları üzerinde eşsiz balon sürüş deneyimi.' } }
      ],
      styles: { columns: '3', gap: '24', paddingTop: '48', paddingBottom: '48' },
      responsive: { hideMobile: false, hideTablet: false }
    }
  },
  {
    type: 'faq_accordion',
    name: 'Akordeon (Accordion)',
    category: 'accordion',
    popular: true,
    icon: HelpCircle,
    defaultData: {
      content: {
        section_title: {
          tr: 'Sıkça Sorulan Sorular',
          en: 'Frequently Asked Questions'
        },
        section_subtitle: {
          tr: 'Katılımcılarımızın en çok merak ettiği sorular ve cevapları.',
          en: 'Frequently asked questions and answers for our participants.'
        },
        faq_1_question: { tr: 'Rezervasyonumu nasıl iptal edebilirim?', en: 'How can I cancel my booking?' },
        faq_1_answer: { tr: 'Yarış veya tur tarihinden 14 gün öncesine kadar ücretsiz iptal edebilirsiniz.', en: 'You can cancel free of charge up to 14 days before the event.' },
        
        faq_2_question: { tr: 'Etkinlikler için yaş sınırı var mıdır?', en: 'Is there an age limit for events?' },
        faq_2_answer: { tr: 'Genel katılımda 18 yaş sınırı vardır, ancak aile turları için sınır 12\'dir.', en: 'General participation limit is 18, but 12 for family tours.' },
        
        faq_3_question: { tr: 'Hangi spor ekipmanları zorunludur?', en: 'Which sports equipment is mandatory?' },
        faq_3_answer: { tr: 'Her yarış ve dağ parkurunun detaylarında zorunlu koruma ekipmanı listelenmiştir.', en: 'Mandatory safety gear is listed under each race/track details.' }
      },
      styles: { paddingTop: '48', paddingBottom: '48' },
      responsive: { hideMobile: false, hideTablet: false }
    }
  },
  {
    type: 'hero_banner',
    name: 'Split (Metin & Medya)',
    category: 'split',
    popular: true,
    icon: Columns,
    variant: 'image_supported',
    defaultData: {
      content: {
        heading: 'Sınırsız Macera Seni Bekliyor',
        subtitle: 'CoreCMS sayfa oluşturucusu ile artık her sayfanızı tamamen görsel olarak özelleştirebilir, dilediğiniz blokları ekleyip çıkartabilirsiniz.',
        ctaText: 'Hemen Başla',
        ctaUrl: { type: 'custom', url: '#', target: '_self' },
        bgImage: 'https://images.unsplash.com/photo-1533240332313-0db49b439ad3?auto=format&fit=crop&w=800&q=80'
      },
      styles: { paddingTop: '64', paddingBottom: '64' },
      responsive: { hideMobile: false, hideTablet: false }
    }
  },
  {
    type: 'cta_section',
    name: 'Harekete Geçirici (CTA)',
    category: 'custom',
    popular: true,
    icon: Bell,
    defaultData: {
      content: {
        section_title: { tr: 'Maceraya Katılmaya Hazır mısın?', en: 'Ready to Join the Adventure?' },
        section_subtitle: { tr: 'Gelişmelerden anında haberdar olmak ve yarış kayıtları başladığında ilk sen duymak için bültene kaydol.', en: 'Subscribe to our newsletter to get instant updates and be the first to know when race registration opens.' },
        cta_mode: 'newsletter',
        placeholder: { tr: 'E-posta adresiniz', en: 'Your email address' },
        button_text: { tr: 'Kayıt Ol', en: 'Subscribe' },
        button_link: '#'
      },
      styles: {
        layout_style: 'centered_gradient',
        bg_gradient: 'gradient_dark',
        paddingTop: '64',
        paddingBottom: '64'
      },
      responsive: { hideMobile: false, hideTablet: false }
    }
  }
];

const CMS_DYNAMIC_MODULES = [
  { id: 'categories', name: 'Kategoriler (Categories)', endpoint: '/api/admin/categories', titleKey: 'name', descKey: 'description' },
  { id: 'pages', name: 'Sayfalar (Pages)', endpoint: '/api/admin/pages', titleKey: 'title', descKey: 'summary' },
  { id: 'posts', name: 'Yazılar (Posts)', endpoint: '/api/admin/posts', titleKey: 'title', descKey: 'summary' },
  { id: 'races', name: 'Yarışlar (Races)', endpoint: '/api/admin/races', titleKey: 'name', descKey: 'description' }
];

const SYSTEM_ROUTES = [
  { label: 'Anasayfa', path: '/' },
  { label: 'Yarışlar / Etkinlikler', path: '/races' },
  { label: 'Turlar', path: '/tours' },
  { label: 'Haberler & Blog', path: '/blog' },
  { label: 'Hakkımızda', path: '/about' },
  { label: 'İletişim', path: '/contact' }
];

// Helper to generate a short random UUID
const generateId = () => `block-${Math.random().toString(36).substr(2, 9)}`;

// Iframe rendering helper for device previews with media query accuracy
function IFramePreview({ children, className, style, ...props }) {
  const [ref, setRef] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!ref) return;
    const doc = ref.contentDocument;
    if (!doc) return;

    const copyStyles = () => {
      const head = doc.head;
      if (!head) return;
      
      head.innerHTML = '';
      
      document.querySelectorAll('style, link[rel="stylesheet"]').forEach(el => {
        head.appendChild(el.cloneNode(true));
      });
    };

    copyStyles();
    
    const html = doc.documentElement;
    const body = doc.body;
    if (html && body) {
      html.className = document.documentElement.className;
      body.className = document.body.className;
      body.style.margin = '0';
      body.style.padding = '0';
      body.style.overflowX = 'hidden';
      body.style.backgroundColor = 'transparent';
    }

    setMounted(true);
    
    const observer = new MutationObserver(() => {
      copyStyles();
    });
    observer.observe(document.head, { childList: true, subtree: true });
    
    return () => observer.disconnect();
  }, [ref]);

  return (
    <iframe
      ref={setRef}
      className={className}
      style={{
        border: 'none',
        width: '100%',
        height: '100%',
        ...style
      }}
      {...props}
    >
      {mounted && ref.contentDocument && createPortal(children, ref.contentDocument.body)}
    </iframe>
  );
}

import { BUILDER_CATEGORIES } from '@/config/builder.config';

export default function BuilderPage({ params }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = use(params);
  const isCreateMode = id === 'new';

  // Fetch admin settings for preview header/footer configuration
  const { data: settings } = useQuery({
    queryKey: ['admin-settings-map'],
    queryFn: async () => {
      const res = await apiFetch('/api/admin/settings');
      if (!res.ok) return {};
      const json = await res.json();
      const settingsMap = {};
      if (json && Array.isArray(json.data)) {
        json.data.forEach(item => {
          settingsMap[item.key] = item.value;
        });
      }
      return settingsMap;
    }
  });

  // Parse frontend settings to get menu keys
  const frontSettings = useMemo(() => {
    if (!settings) return {};
    let fs = settings['frontend.system_settings'] || {};
    if (typeof fs === 'string') {
      try {
        fs = JSON.parse(fs);
      } catch (e) {
        fs = {};
      }
    }
    return fs;
  }, [settings]);

  const headerMenuKey = frontSettings.headerMenu || 'header';
  const footerMenuKey = frontSettings.footerMenu || '';

  // Fetch navigations list to resolve menu ids
  const { data: navigations } = useQuery({
    queryKey: ['admin-navigations-list'],
    queryFn: async () => {
      const res = await apiFetch('/api/admin/navigations?limit=100');
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    }
  });

  // Header menu ID
  const headerMenuId = useMemo(() => {
    if (!navigations) return null;
    const found = navigations.find(nav => nav.key === headerMenuKey);
    return found ? found.id : null;
  }, [navigations, headerMenuKey]);

  // Footer menu ID
  const footerMenuId = useMemo(() => {
    if (!navigations || !footerMenuKey) return null;
    const found = navigations.find(nav => nav.key === footerMenuKey);
    return found ? found.id : null;
  }, [navigations, footerMenuKey]);

  // Fetch Header menu items
  const { data: headerMenuItems } = useQuery({
    queryKey: ['admin-navigation-detail', headerMenuId],
    queryFn: async () => {
      if (!headerMenuId) return [];
      const res = await apiFetch(`/api/admin/navigations/${headerMenuId}`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.data?.items || [];
    },
    enabled: !!headerMenuId
  });

  // Fetch Footer menu items
  const { data: footerMenuItems } = useQuery({
    queryKey: ['admin-navigation-detail', footerMenuId],
    queryFn: async () => {
      if (!footerMenuId) return [];
      const res = await apiFetch(`/api/admin/navigations/${footerMenuId}`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.data?.items || [];
    },
    enabled: !!footerMenuId
  });

  // Fetch global blocks list
  const { data: globalBlocks = [] } = useQuery({
    queryKey: ['admin-global-blocks'],
    queryFn: async () => {
      const res = await apiFetch('/api/admin/global-blocks');
      if (!res.ok) throw new Error('Failed to fetch global blocks');
      const json = await res.json();
      return json.data || [];
    }
  });


  // ----------------------------------------------------
  // States & History Management
  // ----------------------------------------------------
  const [activeLang, setActiveLang] = useState('tr');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedCategories, setExpandedCategories] = useState({
    hero: true,
    grid: true,
    slider: false,
    list_view: false,
    accordion: false,
    split: false,
    custom: true
  });
  const toggleCategory = (catId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };
  const [activeTab, setActiveTab] = useState('general'); // 'general', 'seo', 'data', 'content', 'design', 'responsive'
  const [previewSize, setPreviewSize] = useState('desktop'); // 'desktop', 'tablet', 'mobile'
  const [zoom, setZoom] = useState(70);
  
  // Page Meta states
  const [title, setTitle] = useState({ tr: '', en: '' });
  const [slug, setSlug] = useState({ tr: '', en: '' });
  const [summary, setSummary] = useState({ tr: '', en: '' });
  const [layout, setLayout] = useState('default');
  const [status, setStatus] = useState('draft');
  const [isSystem, setIsSystem] = useState(false);
  const [parentId, setParentId] = useState('none');
  const [order, setOrder] = useState(0);
  const [coverImageId, setCoverImageId] = useState(null);

  // Content Blocks state
  const [blocks, setBlocks] = useState([]);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const [moduleItems, setModuleItems] = useState([]);

  const activeSelectedBlock = useMemo(() => blocks.find(b => b.id === selectedBlockId), [selectedBlockId, blocks]);
  const currentModuleId = activeSelectedBlock?.type === 'categories_grid'
    ? 'categories'
    : (activeSelectedBlock?.type === 'news_ticker'
        ? (activeSelectedBlock?.content?.target_content_type_id || activeSelectedBlock?.content?.[activeLang]?.target_content_type_id || 'posts')
        : activeSelectedBlock?.content?.target_content_type_id);

  useEffect(() => {
    if (!currentModuleId) {
      setModuleItems([]);
      return;
    }
    const moduleConf = CMS_DYNAMIC_MODULES.find(m => m.id === currentModuleId);
    if (moduleConf) {
      apiFetch(moduleConf.endpoint)
        .then(res => {
          if (res.ok) return res.json();
          return { data: [] };
        })
        .then(json => {
          const rawItems = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
          setModuleItems(rawItems);
        })
        .catch(err => console.error('Failed to load module items:', err));
    } else {
      setModuleItems([]);
    }
  }, [currentModuleId, activeLang]);

  // Undo/Redo Stacks
  const [history, setHistory] = useState([]);
  const [historyPointer, setHistoryPointer] = useState(-1);

  // SEO states
  const [seo, setSeo] = useState({
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    og_title: '',
    og_description: '',
    og_image_id: null,
    canonical_url: '',
    meta_robots: 'index, follow'
  });

  // Drag over states
  const [draggedType, setDraggedType] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  // Push to history for undo/redo
  const pushState = (newBlocks) => {
    const nextHistory = history.slice(0, historyPointer + 1);
    nextHistory.push(JSON.parse(JSON.stringify(newBlocks)));
    setHistory(nextHistory);
    setHistoryPointer(nextHistory.length - 1);
  };

  const filteredComponents = useMemo(() => {
    return COMPONENT_LIBRARY.filter((comp) => {
      // 1. Filter by search query
      const matchesSearch = searchQuery
        ? comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (comp.type && comp.type.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;

      // 2. Filter by category
      let matchesCategory = true;
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'popular') {
          matchesCategory = !!comp.popular;
        } else {
          matchesCategory = comp.category === selectedCategory;
        }
      }

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const handleAddBlock = (comp) => {
    const newBlock = {
      id: generateId(),
      type: comp.type,
      variant: comp.variant || null,
      content: JSON.parse(JSON.stringify(comp.defaultData.content || {})),
      styles: JSON.parse(JSON.stringify(comp.defaultData.styles || {})),
      responsive: JSON.parse(JSON.stringify(comp.defaultData.responsive || {})),
      hydrated_data: JSON.parse(JSON.stringify(comp.defaultData.hydrated_data || []))
    };
    const updated = [...blocks, newBlock];
    setBlocks(updated);
    pushState(updated);
    toast.success(`${comp.name} sayfaya eklendi.`);
  };

  const handleDragStartBlock = (e, index) => {
    setDraggingIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `sort:${index}`);
  };

  const handleDragOverBlock = (e, index) => {
    e.preventDefault();
    if (draggingIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDropBlock = (e, targetIndex) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('text/plain');
    
    if (data.startsWith('sort:')) {
      // Sorting existing block
      const sourceIndex = parseInt(data.split(':')[1], 10);
      if (sourceIndex === targetIndex) return;
      
      const updated = [...blocks];
      const [draggedBlock] = updated.splice(sourceIndex, 1);
      updated.splice(targetIndex, 0, draggedBlock);
      
      setBlocks(updated);
      pushState(updated);
      toast.success('Bölüm sırası güncellendi.');
    } else {
      // Dragging new block from library
      const compType = data;
      const comp = COMPONENT_LIBRARY.find(c => c.type === compType);
      if (comp) {
        const newBlock = {
          id: generateId(),
          type: comp.type,
          variant: comp.variant || null,
          content: JSON.parse(JSON.stringify(comp.defaultData.content || {})),
          styles: JSON.parse(JSON.stringify(comp.defaultData.styles || {})),
          responsive: JSON.parse(JSON.stringify(comp.defaultData.responsive || {})),
          hydrated_data: JSON.parse(JSON.stringify(comp.defaultData.hydrated_data || []))
        };
        const updated = [...blocks];
        updated.splice(targetIndex, 0, newBlock);
        setBlocks(updated);
        setSelectedBlockId(newBlock.id); // Automatically open the editing drawer inputs
        pushState(updated);
        toast.success(`${comp.name} sayfaya eklendi.`);
      }
    }
    
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEndBlock = () => {
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  const handleMoveBlock = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === blocks.length - 1) return;
    
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...blocks];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    
    setBlocks(updated);
    pushState(updated);
    toast.success('Bölüm sırası güncellendi.');
  };

  const handleDeleteBlock = (blockId) => {
    const updated = blocks.filter(b => b.id !== blockId);
    setBlocks(updated);
    pushState(updated);
    toast.success('Bölüm silindi.');
  };

  const handleUpdateBlockField = async (blockId, fieldKey, value) => {
    let hydratedData = null;
    
    // Get active values
    const block = blocks.find(b => b.id === blockId);
    const currentSourceType = fieldKey === 'source_type' ? value : (block?.content?.source_type || block?.content?.[activeLang]?.source_type || 'manual');
    const ctId = fieldKey === 'target_content_type_id' ? value : (block?.content?.target_content_type_id || block?.content?.[activeLang]?.target_content_type_id);
    const itemIds = fieldKey === 'target_item_ids' ? value : (block?.content?.target_item_ids || block?.content?.[activeLang]?.target_item_ids || []);

    const isCategoriesGrid = block?.type === 'categories_grid';
    const isNewsTicker = block?.type === 'news_ticker';
    const hasDynamicData = isCategoriesGrid || isNewsTicker || currentSourceType === 'dynamic';
    
    if (hasDynamicData && (fieldKey === 'target_item_ids' || fieldKey === 'target_content_type_id' || (fieldKey === 'source_type' && value === 'dynamic'))) {
      const resolvedCtId = isCategoriesGrid ? 'categories' : (isNewsTicker ? (fieldKey === 'target_content_type_id' ? value : ctId || 'posts') : ctId);
      const moduleConf = CMS_DYNAMIC_MODULES.find(m => m.id === resolvedCtId);
      if (moduleConf) {
        try {
          const res = await apiFetch(`${moduleConf.endpoint}?limit=100`);
          if (res.ok) {
            const json = await res.json();
            const rawItems = json.data && Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
            
            // Filter by selected item IDs
            const filteredItems = Array.isArray(itemIds) && itemIds.length > 0
              ? rawItems.filter(item => itemIds.some(id => String(id) === String(item.id)))
              : (isCategoriesGrid || isNewsTicker ? rawItems : rawItems.slice(0, 4)); // default to all for grid/ticker, 4 for others

            hydratedData = filteredItems.map(item => {
              const rawTitle = item[moduleConf.titleKey] || item.title || item.name || '';
              const displayTitle = typeof rawTitle === 'object' && rawTitle !== null ? rawTitle.tr || rawTitle.en || item.slug : rawTitle;
              
              const rawDesc = item[moduleConf.descKey] || item.summary || item.description || '';
              const displayDesc = typeof rawDesc === 'object' && rawDesc !== null ? rawDesc.tr || rawDesc.en || '' : rawDesc;

              return {
                ...item,
                id: item.id,
                title: displayTitle,
                slug: item.slug || '',
                data: {
                  title: displayTitle,
                  summary: displayDesc
                }
              };
            });
          }
        } catch (e) {
          console.error('Failed to fetch module entries:', e);
        }
      }
    }

    const updated = blocks.map((b) => {
      if (b.id === blockId) {
        const newBlock = { ...b };
        if (newBlock.content[activeLang]) {
          newBlock.content = {
            ...newBlock.content,
            [activeLang]: {
              ...newBlock.content[activeLang],
              [fieldKey]: value
            }
          };
        } else {
          newBlock.content = {
            ...newBlock.content,
            [fieldKey]: value
          };
        }
        if (hydratedData !== null) {
          newBlock.hydrated_data = hydratedData;
        }
        return newBlock;
      }
      return b;
    });
    setBlocks(updated);
    pushState(updated);
  };

  const handleUpdateBlockStyle = (blockId, styleKey, value) => {
    const updated = blocks.map((b) => {
      if (b.id === blockId) {
        return {
          ...b,
          styles: {
            ...b.styles,
            [styleKey]: value
          }
        };
      }
      return b;
    });
    setBlocks(updated);
    pushState(updated);
  };

  const handleUpdateLink = (val, blockId) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    
    const isNested = !!block.content[activeLang];
    const content = isNested ? block.content[activeLang] : block.content;
    const currentLink = content.button_link;

    if (typeof currentLink === 'object' && currentLink !== null) {
      handleUpdateBlockField(blockId, 'button_link', { ...currentLink, url: val });
    } else {
      handleUpdateBlockField(blockId, 'button_link', val);
    }
  };

  const handleUndo = () => {
    if (historyPointer > 0) {
      const nextPointer = historyPointer - 1;
      setHistoryPointer(nextPointer);
      setBlocks(JSON.parse(JSON.stringify(history[nextPointer])));
    }
  };

  const handleRedo = () => {
    if (historyPointer < history.length - 1) {
      const nextPointer = historyPointer + 1;
      setHistoryPointer(nextPointer);
      setBlocks(JSON.parse(JSON.stringify(history[nextPointer])));
    }
  };

  // Keyboard shortcut handlers for Undo/Redo/Save
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyPointer, history, title, slug, blocks, summary, layout, status, isSystem, parentId, order, coverImageId, seo]);

  // Fetch page details in Edit Mode
  const { data: pagePayload, isLoading: isLoadingPage } = useQuery({
    queryKey: ['admin-page-details', id],
    queryFn: async () => {
      const res = await apiFetch(`/api/admin/pages/${id}`);
      if (!res.ok) throw new Error('Failed to fetch page details');
      const json = await res.json();
      return json || null;
    },
    enabled: !isCreateMode,
  });

  // Fetch parent pages list
  const { data: pagesList } = useQuery({
    queryKey: ['admin-pages-select'],
    queryFn: async () => {
      const res = await apiFetch('/api/admin/pages');
      if (!res.ok) throw new Error('Failed to fetch pages');
      const json = await res.json();
      return json.data || [];
    }
  });

  // Filter out self as parent
  const parentOptions = useMemo(() => {
    if (!pagesList) return [];
    return pagesList.filter(p => String(p.id) !== String(id));
  }, [pagesList, id]);

  // Fetch cover image details
  const { data: coverImage } = useQuery({
    queryKey: ['admin-media-file', coverImageId],
    queryFn: async () => {
      if (!coverImageId) return null;
      const res = await apiFetch(`/api/admin/media/files/${coverImageId}`);
      if (!res.ok) throw new Error('Failed to fetch cover image');
      const json = await res.json();
      return json.data || null;
    },
    enabled: !!coverImageId
  });

  // Fetch partner categories
  const { data: partnerCategories } = useQuery({
    queryKey: ['admin-categories-partner-builder'],
    queryFn: async () => {
      const res = await apiFetch('/api/admin/categories?type=partner');
      if (!res.ok) throw new Error('Failed to fetch partner categories');
      const json = await res.json();
      return json || [];
    }
  });

  // Load payload data in edit mode
  useEffect(() => {
    if (pagePayload && !isCreateMode) {
      setTitle({
        tr: pagePayload.data?.title?.tr || '',
        en: pagePayload.data?.title?.en || '',
      });
      setSlug({
        tr: pagePayload.data?.slug?.tr || '',
        en: pagePayload.data?.slug?.en || '',
      });
      setSummary({
        tr: pagePayload.data?.summary?.tr || '',
        en: pagePayload.data?.summary?.en || '',
      });
      setLayout(pagePayload.data?.layout || 'default');
      setStatus(pagePayload.status || 'draft');
      setIsSystem(!!pagePayload.data?.is_system);
      setParentId(pagePayload.data?.parent_id ? String(pagePayload.data.parent_id) : 'none');
      setOrder(pagePayload.data?.order || 0);
      setCoverImageId(pagePayload.data?.cover_image?.id || null);

      if (pagePayload.seo) {
        setSeo({
          meta_title: pagePayload.seo.meta_title || '',
          meta_description: pagePayload.seo.meta_description || '',
          meta_keywords: pagePayload.seo.meta_keywords || '',
          og_title: pagePayload.seo.og_title || '',
          og_description: pagePayload.seo.og_description || '',
          og_image_id: pagePayload.seo.og_image_id || null,
          canonical_url: pagePayload.seo.canonical_url || '',
          meta_robots: pagePayload.seo.meta_robots || 'index, follow'
        });
      }

      const contentBlocks = pagePayload.data?.content || [];
      setBlocks(contentBlocks);
      
      // Initialize history stack
      setHistory([JSON.parse(JSON.stringify(contentBlocks))]);
      setHistoryPointer(0);
    }
  }, [pagePayload, isCreateMode]);

  // Handle Title input with automated slug generator
  const handleTitleChange = (lang, value) => {
    setTitle((prev) => ({ ...prev, [lang]: value }));
    const generatedSlug = value
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    setSlug((prev) => ({ ...prev, [lang]: generatedSlug }));
  };

  const handleBlockClick = (blockId) => {
    setSelectedBlockId(blockId);
    setActiveTab('content');
  };

  // ----------------------------------------------------
  // Drag & Drop Operations
  // ----------------------------------------------------
  const handleDragStart = (type) => {
    setDraggedType(type);
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    setDragOverIdx(idx);
  };

  const handleDrop = () => {
    if (!draggedType) return;
    
    const template = COMPONENT_LIBRARY.find(c => c.type === draggedType);
    if (!template) return;

    const newBlock = {
      id: generateId(),
      type: template.type,
      variant: template.variant || null,
      status: 'active',
      dataSource: template.defaultData.dataSource ? { ...template.defaultData.dataSource } : undefined,
      content: JSON.parse(JSON.stringify(template.defaultData.content || {})),
      styles: JSON.parse(JSON.stringify(template.defaultData.styles || {})),
      responsive: JSON.parse(JSON.stringify(template.defaultData.responsive || { hideMobile: false, hideTablet: false, hideDesktop: false })),
      hydrated_data: JSON.parse(JSON.stringify(template.defaultData.hydrated_data || []))
    };

    const newBlocks = [...blocks];
    if (dragOverIdx !== null) {
      newBlocks.splice(dragOverIdx, 0, newBlock);
    } else {
      newBlocks.push(newBlock);
    }

    setBlocks(newBlocks);
    setSelectedBlockId(newBlock.id);
    setActiveTab('content');
    pushState(newBlocks);

    // Reset drag indicators
    setDraggedType(null);
    setDragOverIdx(null);
  };

  // Move block up or down
  const moveBlock = (idx, direction) => {
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= blocks.length) return;
    
    const newBlocks = [...blocks];
    const temp = newBlocks[idx];
    newBlocks[idx] = newBlocks[newIdx];
    newBlocks[newIdx] = temp;

    setBlocks(newBlocks);
    pushState(newBlocks);
  };

  // Duplicate block
  const duplicateBlock = (block, idx) => {
    const clone = JSON.parse(JSON.stringify(block));
    clone.id = generateId();
    
    const newBlocks = [...blocks];
    newBlocks.splice(idx + 1, 0, clone);

    setBlocks(newBlocks);
    setSelectedBlockId(clone.id);
    pushState(newBlocks);
  };

  // Toggle Visibility status (Active/Hidden)
  const toggleVisibility = (idx) => {
    const newBlocks = [...blocks];
    newBlocks[idx].status = newBlocks[idx].status === 'hidden' ? 'active' : 'hidden';
    setBlocks(newBlocks);
    pushState(newBlocks);
  };

  // Delete Block
  const deleteBlock = (idx) => {
    const targetId = blocks[idx].id;
    const newBlocks = blocks.filter((_, i) => i !== idx);
    setBlocks(newBlocks);
    if (selectedBlockId === targetId) {
      setSelectedBlockId(null);
      setActiveTab('general');
    }
    pushState(newBlocks);
  };

  // ----------------------------------------------------
  // Save Mutation
  // ----------------------------------------------------
  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      const url = isCreateMode ? '/api/admin/pages' : `/api/admin/pages/${id}`;
      const method = isCreateMode ? 'POST' : 'PUT';

      const res = await apiFetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Sayfa kaydedilemedi.');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pages'] });
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>{isCreateMode ? 'Sayfa başarıyla oluşturuldu.' : 'Sayfa başarıyla kaydedildi.'}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
      setTimeout(() => {
        router.push('/content-management/pages');
      }, 1500);
    },
    onError: (err) => {
      toast.error(err.message || 'Kaydedilirken bir hata oluştu.');
    },
  });

  const handleSave = () => {
    if (!title.tr) {
      toast.error('Türkçe sayfa başlığı girmek zorunludur.');
      return;
    }

    const payload = {
      title,
      slug,
      content: blocks,
      summary,
      layout,
      status,
      is_system: isSystem,
      parent_id: parentId === 'none' ? null : Number(parentId),
      order: Number(order) || 0,
      cover_image_id: coverImageId,
      seo
    };

    saveMutation.mutate(payload);
  };

  // Get current active selected block settings
  const selectedBlock = useMemo(() => {
    return blocks.find(b => b.id === selectedBlockId) || null;
  }, [blocks, selectedBlockId]);

  // Update selected block settings
  const updateSelectedBlock = (section, key, value, subkey = null) => {
    const newBlocks = blocks.map(b => {
      if (b.id === selectedBlockId) {
        const updated = { ...b };
        if (subkey) {
          updated[section] = {
            ...updated[section],
            [key]: {
              ...updated[section]?.[key],
              [subkey]: value
            }
          };
        } else {
          updated[section] = {
            ...updated[section],
            [key]: value
          };
        }
        return updated;
      }
      return b;
    });
    setBlocks(newBlocks);
    pushState(newBlocks);
  };

  const renderDropZone = (idx) => (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOverIndex(idx);
      }}
      onDragLeave={() => setDragOverIndex(null)}
      onDrop={(e) => handleDropBlock(e, idx)}
      className={`w-full transition-all duration-200 flex items-center justify-center ${
        dragOverIndex === idx
          ? 'h-10 bg-primary/10 border-2 border-dashed border-primary/40 rounded-xl my-2 text-xs text-primary font-bold uppercase tracking-wider'
          : 'h-2 bg-transparent'
      }`}
    >
      {dragOverIndex === idx && 'Buraya Bırakın'}
    </div>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground animate-fade-in select-none">
      {/* Left Permanent Drawer Panel (Side-by-side) */}
      <div className="h-full w-[350px] border-r border-border bg-card flex flex-col shrink-0">
        <div className="flex-grow flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="h-14 border-b border-border/85 px-4 flex items-center justify-between shrink-0 bg-muted/20">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted shrink-0 cursor-pointer"
                onClick={() => router.push('/content-management/pages')}
                title="Geri Dön"
              >
                <ArrowLeft className="size-4" />
              </Button>
              <div className="h-4 w-px bg-border shrink-0" />
              <div className="flex items-center gap-2 ml-1">
                <span className="p-1.5 rounded-lg bg-primary/5 text-primary shrink-0">
                  <Settings className="size-4" />
                </span>
                <h3 className="text-[15px] font-bold text-foreground tracking-normal">Tasarım Paneli</h3>
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold px-3 py-1.5 h-8 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all select-none"
            >
              {saveMutation.isPending ? (
                <LoaderCircleIcon className="size-3.5 animate-spin" />
              ) : (
                <Save className="size-3.5" />
              )}
              Kaydet
            </Button>
          </div>

          {/* Drawer Body: Tabbed placeholders */}
          <div className="flex-grow overflow-hidden p-6 flex flex-col min-h-0">
            <Tabs defaultValue="blocks" className="flex-grow flex flex-col min-h-0">
              <TabsList className="grid grid-cols-2 w-full shrink-0">
                <TabsTrigger value="blocks" className="text-[14px] lg:text-[15px] font-semibold">Bölümler</TabsTrigger>
                <TabsTrigger value="settings" className="text-[14px] lg:text-[15px] font-semibold">Ayarlar</TabsTrigger>
              </TabsList>
              
              <div className="flex-grow min-h-0 mt-4 flex flex-col">
                <TabsContent value="blocks" className="mt-0 flex-grow flex flex-col min-h-0">
                  {selectedBlockId && blocks.find(b => b.id === selectedBlockId) ? (() => {
                    const block = blocks.find(b => b.id === selectedBlockId);
                    const schema = COMPONENT_LIBRARY.find(c => c.type === block.type);
                    
                    const isNested = !!block.content[activeLang];
                    const content = isNested ? (block.content[activeLang] || {}) : block.content;
                    
                    const headingKey = content.heading !== undefined 
                      ? 'heading' 
                      : (content.title !== undefined 
                        ? 'title' 
                        : (content.section_title !== undefined && !['sponsors_block', 'cta_section', 'statistics_block', 'collection_display'].includes(block.type) 
                          ? 'section_title' 
                          : null));
                    const subtitleKey = content.subtitle !== undefined 
                      ? 'subtitle' 
                      : (content.section_subtitle !== undefined && !['sponsors_block', 'cta_section', 'statistics_block', 'collection_display'].includes(block.type) 
                        ? 'section_subtitle' 
                        : null);
                    
                    const headingValue = headingKey ? (typeof content[headingKey] === 'object' && content[headingKey] !== null ? content[headingKey][activeLang] || content[headingKey].tr || '' : content[headingKey] || '') : '';
                    const subtitleValue = subtitleKey ? (typeof content[subtitleKey] === 'object' && content[subtitleKey] !== null ? content[subtitleKey][activeLang] || content[subtitleKey].tr || '' : content[subtitleKey] || '') : '';
                    const buttonTextValue = content.button_text || '';
                    const buttonLinkValue = typeof content.button_link === 'object' && content.button_link !== null
                      ? content.button_link.url || ''
                      : content.button_link || '';
                    const videoUrlValue = content.video_url || '';
                    const htmlValue = content.html || '';

                    const overlayColor = block.styles.overlay_color || '#09090b';
                    const overlayOpacity = block.styles.overlay_opacity !== undefined ? block.styles.overlay_opacity : 50;

                    return (
                      <div className="flex-grow flex flex-col min-h-0 animate-fade-in">
                        {/* Header */}
                        <div className="flex items-center gap-2 pb-3 border-b border-border/60 shrink-0 mb-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 rounded-lg text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                            onClick={() => setSelectedBlockId(null)}
                            title="Bölüm Listesine Dön"
                          >
                            <ArrowLeft className="size-4" />
                          </Button>
                          <div className="min-w-0">
                            <h4 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Bölüm Düzenle</h4>
                            <p className="text-[13px] font-bold text-foreground truncate">{schema?.name || block.type}</p>
                          </div>
                        </div>

                        {/* Form Inputs Container */}
                        <div className="flex-grow overflow-y-auto min-h-0 space-y-4 pr-1">
                          {/* Data Source Configuration for Features Grid */}
                          {block.type === 'features_grid' && (
                            <div className="space-y-3 pb-3 border-b border-border/40 mb-3 select-none">
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-zinc-500">Veri Kaynağı</Label>
                                <select
                                  value={content.source_type || 'manual'}
                                  onChange={(e) => handleUpdateBlockField(block.id, 'source_type', e.target.value)}
                                  className="w-full text-xs rounded-lg border border-border bg-background p-2.5 outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground font-medium cursor-pointer"
                                >
                                  <option value="manual">Manuel Giriş (Statik Kartlar)</option>
                                  <option value="dynamic">Dinamik Modüller (Seçilen Öğeler)</option>
                                </select>
                              </div>
                            </div>
                          )}

                          {block.type === 'categories_grid' && (
                            <div className="space-y-3 pb-3 border-b border-border/40 mb-3 select-none animate-fade-in">
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-zinc-500">Gösterilecek Kategoriler</Label>
                                <div className="border border-border rounded-lg bg-background p-2.5 max-h-[180px] overflow-y-auto space-y-1.5 shadow-inner">
                                  {moduleItems.map((item) => {
                                    const title = item.name || '';
                                    const displayTitle = typeof title === 'object' && title !== null ? title.tr || title.en || item.slug : title;
                                    const isChecked = Array.isArray(content.target_item_ids)
                                      ? content.target_item_ids.includes(String(item.id)) || content.target_item_ids.includes(Number(item.id))
                                      : false;
                                    return (
                                      <div key={item.id} className="space-y-1 py-1 border-b border-zinc-100 dark:border-zinc-800/40 last:border-0">
                                        <label
                                          className="flex items-center gap-2 text-xs text-foreground cursor-pointer select-none py-0.5 hover:text-primary transition-colors font-medium animate-fade-in"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={(e) => {
                                              const currentIds = Array.isArray(content.target_item_ids) ? [...content.target_item_ids] : [];
                                              let nextIds;
                                              if (e.target.checked) {
                                                nextIds = [...currentIds, item.id];
                                              } else {
                                                nextIds = currentIds.filter(id => String(id) !== String(item.id));
                                                const currentDates = content.custom_dates || {};
                                                const { [item.id]: _, ...restDates } = currentDates;
                                                handleUpdateBlockField(block.id, 'custom_dates', restDates);
                                              }
                                              handleUpdateBlockField(block.id, 'target_item_ids', nextIds);
                                            }}
                                            className="rounded border-zinc-300 text-primary focus:ring-primary size-3.5 cursor-pointer accent-primary"
                                          />
                                          <span>{displayTitle}</span>
                                        </label>

                                        {isChecked && (
                                          <div className="pl-5.5 pr-1 py-0.5 animate-fade-in">
                                            <input
                                              type="date"
                                              value={content.custom_dates?.[item.id] || ''}
                                              onChange={(e) => {
                                                const currentDates = content.custom_dates || {};
                                                const nextDates = { ...currentDates, [item.id]: e.target.value };
                                                handleUpdateBlockField(block.id, 'custom_dates', nextDates);
                                              }}
                                              className="w-full text-[10px] h-7 rounded border border-border bg-background px-2 py-1 outline-none text-foreground cursor-pointer font-medium"
                                              title="Özel Geri Sayım Tarihi (İsteğe Bağlı)"
                                            />
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                  {moduleItems.length === 0 && (
                                    <div className="text-[10px] text-zinc-400 py-1 text-center font-medium">Kategori bulunamadı.</div>
                                  )}
                                </div>
                                <p className="text-[10px] text-zinc-400 font-medium">Seçim yapmazsanız tüm kategoriler listelenir.</p>
                              </div>

                              <div className="space-y-1.5 pt-2">
                                <Label className="text-xs font-semibold text-zinc-500">Sütun Sayısı (Yan Yana)</Label>
                                <select
                                  value={block.styles.columns || '4'}
                                  onChange={(e) => handleUpdateBlockStyle(block.id, 'columns', e.target.value)}
                                  className="w-full text-xs rounded-lg border border-border bg-background p-2.5 outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground font-medium cursor-pointer"
                                >
                                  <option value="1">1 Sütun (Alt Alta)</option>
                                  <option value="2">2 Sütun</option>
                                  <option value="3">3 Sütun</option>
                                  <option value="4">4 Sütun</option>
                                </select>
                              </div>
                            </div>
                          )}

                          {block.type === 'news_ticker' && (
                            <div className="space-y-4 pb-3 border-b border-border/40 mb-3 select-none animate-fade-in">
                              {/* Label input */}
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-zinc-500">Duyuru Başlığı (Sol Rozet)</Label>
                                <Input
                                  type="text"
                                  value={typeof content.label === 'object' && content.label !== null ? content.label[activeLang] || '' : content.label || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const currentLabel = typeof content.label === 'object' && content.label !== null ? content.label : {};
                                    handleUpdateBlockField(block.id, 'label', {
                                      ...currentLabel,
                                      [activeLang]: val
                                    });
                                  }}
                                  className="h-9 text-xs"
                                  placeholder="Örn: SON DAKİKA, DUYURULAR"
                                />
                              </div>

                              {/* Source Type selector */}
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-zinc-500">Veri Kaynağı</Label>
                                <select
                                  value={content.source_type || 'manual'}
                                  onChange={(e) => handleUpdateBlockField(block.id, 'source_type', e.target.value)}
                                  className="w-full text-xs rounded-lg border border-border bg-background p-2.5 outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground font-medium cursor-pointer"
                                >
                                  <option value="manual">Manuel Giriş (Metin Satırları)</option>
                                  <option value="dynamic">Dinamik Modüller (İçerikler)</option>
                                </select>
                              </div>

                              {/* If manual: Form Repeater list of inputs */}
                              {content.source_type === 'manual' ? (
                                <div className="space-y-2.5 animate-fade-in">
                                  <Label className="text-xs font-semibold text-zinc-500 flex items-center justify-between">
                                    <span>Duyuru Metinleri</span>
                                    <span className="text-[10px] text-zinc-400 font-medium">({activeLang.toUpperCase()})</span>
                                  </Label>
                                  <div className="space-y-2">
                                    {Array.isArray(content.items) && content.items.map((item, idx) => {
                                      const textVal = typeof item === 'object' && item !== null ? item[activeLang] || '' : item || '';
                                      return (
                                        <div key={idx} className="flex items-center gap-2 animate-fade-in">
                                          <Input
                                            type="text"
                                            value={textVal}
                                            onChange={(e) => {
                                              const currentItems = Array.isArray(content.items) ? [...content.items] : [];
                                              const updated = typeof currentItems[idx] === 'object' && currentItems[idx] !== null 
                                                ? { ...currentItems[idx], [activeLang]: e.target.value }
                                                : { tr: '', en: '', [activeLang]: e.target.value };
                                              currentItems[idx] = updated;
                                              handleUpdateBlockField(block.id, 'items', currentItems);
                                            }}
                                            className="h-9 text-xs flex-1 bg-background"
                                            placeholder="Duyuru metni girin..."
                                          />
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() => {
                                              const currentItems = Array.isArray(content.items) ? [...content.items] : [];
                                              const nextItems = currentItems.filter((_, i) => i !== idx);
                                              handleUpdateBlockField(block.id, 'items', nextItems);
                                            }}
                                            className="h-9 w-9 shrink-0 border-red-200 hover:bg-red-50 hover:text-red-600 text-red-500 dark:border-red-950 dark:hover:bg-red-950/30"
                                            title="Sil"
                                          >
                                            <Trash2 className="size-3.5" />
                                          </Button>
                                        </div>
                                      );
                                    })}
                                    {(!Array.isArray(content.items) || content.items.length === 0) && (
                                      <div className="text-center py-4 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg text-[11px] text-zinc-400 font-medium">
                                        Henüz duyuru eklenmedi.
                                      </div>
                                    )}
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const currentItems = Array.isArray(content.items) ? [...content.items] : [];
                                      const nextItems = [...currentItems, { tr: '', en: '' }];
                                      handleUpdateBlockField(block.id, 'items', nextItems);
                                    }}
                                    className="w-full text-xs font-semibold h-8 mt-1 border-dashed hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-1.5"
                                  >
                                    <Plus className="size-3.5" /> Duyuru Ekle
                                  </Button>
                                </div>
                              ) : (
                                /* If dynamic: select content type & checklist of items */
                                <div className="space-y-3 pt-1.5 border-t border-border/30 mt-1.5 animate-fade-in">
                                  <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-zinc-500">İçerik Tipi (Modül)</Label>
                                    <select
                                      value={content.target_content_type_id || ''}
                                      onChange={(e) => handleUpdateBlockField(block.id, 'target_content_type_id', e.target.value)}
                                      className="w-full text-xs rounded-lg border border-border bg-background p-2.5 outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground font-medium cursor-pointer"
                                    >
                                      <option value="" disabled>Modül seçin...</option>
                                      {CMS_DYNAMIC_MODULES.filter(m => m.id !== 'categories').map((mod) => (
                                        <option key={mod.id} value={mod.id}>
                                          {mod.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  {content.target_content_type_id && (
                                    <div className="space-y-1.5 animate-fade-in">
                                      <Label className="text-xs font-semibold text-zinc-500">Gösterilecek Öğeler</Label>
                                      <div className="border border-border rounded-lg bg-background p-2.5 max-h-[180px] overflow-y-auto space-y-1.5 shadow-inner">
                                        {moduleItems.map((item) => {
                                          const moduleConf = CMS_DYNAMIC_MODULES.find(m => m.id === content.target_content_type_id);
                                          const title = item[moduleConf?.titleKey || 'title'] || item.title || item.name || '';
                                          const displayTitle = typeof title === 'object' && title !== null ? title.tr || title.en || item.slug : title;
                                          const isChecked = Array.isArray(content.target_item_ids)
                                            ? content.target_item_ids.includes(String(item.id)) || content.target_item_ids.includes(Number(item.id))
                                            : false;
                                          return (
                                            <label
                                              key={item.id}
                                              className="flex items-center gap-2 text-xs text-foreground cursor-pointer select-none py-0.5 hover:text-primary transition-colors font-medium"
                                            >
                                              <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={(e) => {
                                                  const currentIds = Array.isArray(content.target_item_ids) ? [...content.target_item_ids] : [];
                                                  let nextIds;
                                                  if (e.target.checked) {
                                                    nextIds = [...currentIds, item.id];
                                                  } else {
                                                    nextIds = currentIds.filter(id => String(id) !== String(item.id));
                                                  }
                                                  handleUpdateBlockField(block.id, 'target_item_ids', nextIds);
                                                }}
                                                className="rounded border-zinc-300 text-primary focus:ring-primary size-3.5 cursor-pointer accent-primary"
                                              />
                                              <span>{displayTitle}</span>
                                            </label>
                                          );
                                        })}
                                        {moduleItems.length === 0 && (
                                          <div className="text-[10px] text-zinc-400 py-1 text-center font-medium">Öğe bulunamadı.</div>
                                        )}
                                      </div>
                                      <p className="text-[10px] text-zinc-400 font-medium">Seçim yapmazsanız tüm içerikler listelenir.</p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Scrolling speed */}
                              <div className="space-y-1.5 pt-2 border-t border-border/20">
                                <Label className="text-xs font-semibold text-zinc-500">Akış Hızı (Saniye)</Label>
                                <Input
                                  type="number"
                                  min="5"
                                  max="120"
                                  value={block.styles.speed || '25'}
                                  onChange={(e) => handleUpdateBlockStyle(block.id, 'speed', e.target.value)}
                                  className="h-9 text-xs"
                                  placeholder="Örn: 25"
                                />
                                <p className="text-[9px] text-zinc-400">Saniye değeri büyüdükçe akış yavaşlar.</p>
                              </div>
                            </div>
                          )}

                          {block.type === 'statistics_block' && (
                            <div className="space-y-4 pb-3 border-b border-border/40 mb-3 select-none animate-fade-in">
                              {/* Section Title */}
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-zinc-500">Bölüm Başlığı</Label>
                                <Input
                                  type="text"
                                  value={typeof content.section_title === 'object' && content.section_title !== null ? content.section_title[activeLang] || '' : content.section_title || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const currentTitle = typeof content.section_title === 'object' && content.section_title !== null ? content.section_title : {};
                                    handleUpdateBlockField(block.id, 'section_title', {
                                      ...currentTitle,
                                      [activeLang]: val
                                    });
                                  }}
                                  className="h-9 text-xs"
                                  placeholder="Örn: Rakamlarla SPORFEST"
                                />
                              </div>

                              {/* Section Subtitle */}
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-zinc-500">Bölüm Alt Başlığı</Label>
                                <Textarea
                                  value={typeof content.section_subtitle === 'object' && content.section_subtitle !== null ? content.section_subtitle[activeLang] || '' : content.section_subtitle || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const currentSub = typeof content.section_subtitle === 'object' && content.section_subtitle !== null ? content.section_subtitle : {};
                                    handleUpdateBlockField(block.id, 'section_subtitle', {
                                      ...currentSub,
                                      [activeLang]: val
                                    });
                                  }}
                                  className="min-h-[60px] text-xs resize-none leading-normal"
                                  placeholder="Kısa bir alt başlık veya açıklama girin..."
                                />
                              </div>

                              {/* Card Style */}
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-zinc-500">Kart Tasarım Stili</Label>
                                <select
                                  value={block.styles.card_style || 'glass'}
                                  onChange={(e) => handleUpdateBlockStyle(block.id, 'card_style', e.target.value)}
                                  className="w-full text-xs rounded-lg border border-border bg-background p-2.5 outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground font-medium cursor-pointer"
                                >
                                  <option value="glass">Glassmorphism (Buzlu Cam Efekti)</option>
                                  <option value="border">Border Only (Sadece Kenarlık)</option>
                                  <option value="flat">Flat Card (Koyu Düz Zemin)</option>
                                </select>
                              </div>

                              {/* Columns */}
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-zinc-500">Sütun Düzeni (Yan Yana)</Label>
                                <select
                                  value={block.styles.columns || '4'}
                                  onChange={(e) => handleUpdateBlockStyle(block.id, 'columns', e.target.value)}
                                  className="w-full text-xs rounded-lg border border-border bg-background p-2.5 outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground font-medium cursor-pointer"
                                >
                                  <option value="1">1 Sütun</option>
                                  <option value="2">2 Sütun</option>
                                  <option value="3">3 Sütun</option>
                                  <option value="4">4 Sütun</option>
                                </select>
                              </div>

                              {/* Form Repeater */}
                              <div className="space-y-2.5 pt-2 border-t border-border/20">
                                <Label className="text-xs font-semibold text-zinc-500 flex items-center justify-between">
                                  <span>İstatistikler / Sayaçlar</span>
                                  <span className="text-[10px] text-zinc-400 font-medium">({activeLang.toUpperCase()})</span>
                                </Label>
                                <div className="space-y-3">
                                  {Array.isArray(content.items) && content.items.map((item, idx) => {
                                    const itemLabel = typeof item.label === 'object' && item.label !== null ? item.label[activeLang] || '' : item.label || '';
                                    const itemDesc = typeof item.desc === 'object' && item.desc !== null ? item.desc[activeLang] || '' : item.desc || '';
                                    return (
                                      <div key={idx} className="space-y-2 p-3 border border-border/60 rounded-xl bg-muted/20 relative animate-fade-in">
                                        {/* Header / Delete button */}
                                        <div className="flex justify-between items-center pb-1 border-b border-border/20">
                                          <span className="text-[10px] font-bold text-zinc-400 uppercase">Öğe #{idx + 1}</span>
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() => {
                                              const currentItems = Array.isArray(content.items) ? [...content.items] : [];
                                              const nextItems = currentItems.filter((_, i) => i !== idx);
                                              handleUpdateBlockField(block.id, 'items', nextItems);
                                            }}
                                            className="h-6 w-6 border-red-200 hover:bg-red-50 hover:text-red-600 text-red-500 dark:border-red-950 dark:hover:bg-red-950/30 rounded-md"
                                            title="Sil"
                                          >
                                            <Trash2 className="size-3" />
                                          </Button>
                                        </div>

                                        {/* Value Source Select */}
                                        <div className="space-y-1">
                                          <Label className="text-[10px] text-zinc-400">Değer Kaynağı</Label>
                                          <select
                                            value={item.source || 'manual'}
                                            onChange={(e) => {
                                              const currentItems = Array.isArray(content.items) ? [...content.items] : [];
                                              currentItems[idx] = { ...currentItems[idx], source: e.target.value };
                                              handleUpdateBlockField(block.id, 'items', currentItems);
                                            }}
                                            className="w-full text-[11px] h-8 rounded-md border border-border bg-background px-2 outline-none text-foreground font-medium cursor-pointer"
                                          >
                                            <option value="manual">Manuel Giriş (El Yazısı)</option>
                                            <option value="races_count">Veritabanı: Toplam Yarış Sayısı</option>
                                            <option value="categories_count">Veritabanı: Toplam Kategori Sayısı</option>
                                            <option value="orders_count">Veritabanı: Toplam Sipariş Sayısı</option>
                                            <option value="subscribers_count">Veritabanı: Toplam Bülten Abonesi</option>
                                            <option value="posts_count">Veritabanı: Toplam Blog/Haber Sayısı</option>
                                          </select>
                                        </div>

                                        {/* Value & Icon Row */}
                                        <div className="grid grid-cols-2 gap-2">
                                          <div className="space-y-1">
                                            <Label className="text-[10px] text-zinc-400">
                                              {item.source && item.source !== 'manual' ? 'Sonek (Suffix)' : 'Sayı / Değer'}
                                            </Label>
                                            <Input
                                              type="text"
                                              value={item.number || ''}
                                              onChange={(e) => {
                                                const currentItems = Array.isArray(content.items) ? [...content.items] : [];
                                                currentItems[idx] = { ...currentItems[idx], number: e.target.value };
                                                handleUpdateBlockField(block.id, 'items', currentItems);
                                              }}
                                              className="h-8 text-[11px]"
                                              placeholder={item.source && item.source !== 'manual' ? "Örn: +, K, %" : "Örn: 120+, 45K"}
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <Label className="text-[10px] text-zinc-400">İkon</Label>
                                            <select
                                              value={item.icon || 'Trophy'}
                                              onChange={(e) => {
                                                const currentItems = Array.isArray(content.items) ? [...content.items] : [];
                                                currentItems[idx] = { ...currentItems[idx], icon: e.target.value };
                                                handleUpdateBlockField(block.id, 'items', currentItems);
                                              }}
                                              className="w-full text-[11px] h-8 rounded-md border border-border bg-background px-2 outline-none text-foreground font-medium cursor-pointer"
                                            >
                                              <option value="Trophy">Kupa (Trophy)</option>
                                              <option value="Users">Kişiler (Users)</option>
                                              <option value="Globe">Dünya (Globe)</option>
                                              <option value="Heart">Kalp (Heart)</option>
                                              <option value="Medal">Madalya (Medal)</option>
                                              <option value="Star">Yıldız (Star)</option>
                                              <option value="Calendar">Takvim (Calendar)</option>
                                              <option value="Flag">Bayrak (Flag)</option>
                                              <option value="Activity">Aktivite (Activity)</option>
                                              <option value="Shield">Kalkan (Shield)</option>
                                            </select>
                                          </div>
                                        </div>

                                        {/* Label input */}
                                        <div className="space-y-1">
                                          <Label className="text-[10px] text-zinc-400">İstatistik Adı</Label>
                                          <Input
                                            type="text"
                                            value={itemLabel}
                                            onChange={(e) => {
                                              const currentItems = Array.isArray(content.items) ? [...content.items] : [];
                                              const currentLabel = typeof currentItems[idx].label === 'object' && currentItems[idx].label !== null ? currentItems[idx].label : {};
                                              currentItems[idx] = {
                                                ...currentItems[idx],
                                                label: {
                                                  ...currentLabel,
                                                  [activeLang]: e.target.value
                                                }
                                              };
                                              handleUpdateBlockField(block.id, 'items', currentItems);
                                            }}
                                            className="h-8 text-[11px]"
                                            placeholder="Örn: Tamamlanan Etkinlik"
                                          />
                                        </div>

                                        {/* Description input */}
                                        <div className="space-y-1">
                                          <Label className="text-[10px] text-zinc-400">Açıklama (Kısa Detay)</Label>
                                          <Input
                                            type="text"
                                            value={itemDesc}
                                            onChange={(e) => {
                                              const currentItems = Array.isArray(content.items) ? [...content.items] : [];
                                              const currentDesc = typeof currentItems[idx].desc === 'object' && currentItems[idx].desc !== null ? currentItems[idx].desc : {};
                                              currentItems[idx] = {
                                                ...currentItems[idx],
                                                desc: {
                                                  ...currentDesc,
                                                  [activeLang]: e.target.value
                                                }
                                              };
                                              handleUpdateBlockField(block.id, 'items', currentItems);
                                            }}
                                            className="h-8 text-[11px]"
                                            placeholder="Örn: Bugüne kadar organize ettiğimiz..."
                                          />
                                        </div>
                                      </div>
                                    );
                                  })}
                                  {(!Array.isArray(content.items) || content.items.length === 0) && (
                                    <div className="text-center py-4 border border-dashed border-border rounded-lg text-[11px] text-zinc-400 font-medium">
                                      Henüz istatistik kalemi eklenmedi.
                                    </div>
                                  )}
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const currentItems = Array.isArray(content.items) ? [...content.items] : [];
                                    const nextItems = [...currentItems, { number: '0', label: { tr: '', en: '' }, desc: { tr: '', en: '' }, icon: 'Trophy' }];
                                    handleUpdateBlockField(block.id, 'items', nextItems);
                                  }}
                                  className="w-full text-xs font-semibold h-8 mt-2.5 border-dashed hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-1.5"
                                >
                                  <Plus className="size-3.5" /> İstatistik Ekle
                                </Button>
                              </div>
                            </div>
                          )}

                          {block.type === 'collection_display' && (
                            <div className="space-y-4 pb-3 border-b border-border/40 mb-3 select-none animate-fade-in">
                              {/* Section Title */}
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-zinc-500">Bölüm Başlığı</Label>
                                <Input
                                  type="text"
                                  value={typeof content.section_title === 'object' && content.section_title !== null ? content.section_title[activeLang] || '' : content.section_title || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const currentTitle = typeof content.section_title === 'object' && content.section_title !== null ? content.section_title : {};
                                    handleUpdateBlockField(block.id, 'section_title', {
                                      ...currentTitle,
                                      [activeLang]: val
                                    });
                                  }}
                                  className="h-9 text-xs"
                                  placeholder="Örn: Haberler & Duyurular"
                                />
                              </div>

                              {/* Section Subtitle */}
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-zinc-500">Bölüm Alt Başlığı</Label>
                                <Textarea
                                  value={typeof content.section_subtitle === 'object' && content.section_subtitle !== null ? content.section_subtitle[activeLang] || '' : content.section_subtitle || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const currentSub = typeof content.section_subtitle === 'object' && content.section_subtitle !== null ? content.section_subtitle : {};
                                    handleUpdateBlockField(block.id, 'section_subtitle', {
                                      ...currentSub,
                                      [activeLang]: val
                                    });
                                  }}
                                  className="min-h-[60px] text-xs resize-none leading-normal"
                                  placeholder="Kısa bir açıklama veya alt başlık girin..."
                                />
                              </div>

                              {/* Target Content Type */}
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-zinc-500">Veri Kaynağı (İçerik Tipi)</Label>
                                <select
                                  value={content.target_content_type_id || 'blog'}
                                  onChange={(e) => handleUpdateBlockField(block.id, 'target_content_type_id', e.target.value)}
                                  className="w-full text-xs rounded-lg border border-border bg-background p-2.5 outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground font-medium cursor-pointer"
                                >
                                  <option value="blog">Haberler / Yazılar (Blog)</option>
                                  {CMS_DYNAMIC_MODULES.filter(m => m.id !== 'categories' && m.id !== 'posts').map((mod) => (
                                    <option key={mod.id} value={mod.id}>
                                      {mod.name}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Layout Style */}
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-zinc-500">Görünüm Düzeni</Label>
                                <select
                                  value={content.layout_style || 'grid'}
                                  onChange={(e) => handleUpdateBlockField(block.id, 'layout_style', e.target.value)}
                                  className="w-full text-xs rounded-lg border border-border bg-background p-2.5 outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground font-medium cursor-pointer"
                                >
                                  <option value="grid">Grid (Izgara Düzeni)</option>
                                  <option value="carousel">Carousel (Yatay Kaydırılabilir Satır)</option>
                                </select>
                              </div>

                              {/* Columns */}
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-zinc-500">Sütun Düzeni (Masaüstü)</Label>
                                <select
                                  value={block.styles.columns || '3'}
                                  onChange={(e) => handleUpdateBlockStyle(block.id, 'columns', e.target.value)}
                                  className="w-full text-xs rounded-lg border border-border bg-background p-2.5 outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground font-medium cursor-pointer"
                                >
                                  <option value="2">2 Sütun</option>
                                  <option value="3">3 Sütun</option>
                                  <option value="4">4 Sütun</option>
                                </select>
                              </div>

                              {/* Limit */}
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-zinc-500">Maksimum Öğe Sayısı</Label>
                                <select
                                  value={block.styles.limit || '3'}
                                  onChange={(e) => handleUpdateBlockStyle(block.id, 'limit', e.target.value)}
                                  className="w-full text-xs rounded-lg border border-border bg-background p-2.5 outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground font-medium cursor-pointer"
                                >
                                  <option value="2">2 Öğe</option>
                                  <option value="3">3 Öğe</option>
                                  <option value="4">4 Öğe</option>
                                  <option value="6">6 Öğe</option>
                                  <option value="8">8 Öğe</option>
                                  <option value="12">12 Öğe</option>
                                </select>
                              </div>
                            </div>
                          )}

                          {block.type === 'sponsors_block' && (
                            <div className="space-y-4 pb-3 border-b border-border/40 mb-3 select-none animate-fade-in">
                              {/* Section Title */}
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-zinc-500">Bölüm Başlığı</Label>
                                <Input
                                  type="text"
                                  value={typeof content.section_title === 'object' && content.section_title !== null ? content.section_title[activeLang] || '' : content.section_title || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const currentTitle = typeof content.section_title === 'object' && content.section_title !== null ? content.section_title : {};
                                    handleUpdateBlockField(block.id, 'section_title', {
                                      ...currentTitle,
                                      [activeLang]: val
                                    });
                                  }}
                                  className="h-9 text-xs"
                                  placeholder="Örn: Değerli Sponsorlarımız"
                                />
                              </div>

                              {/* Section Subtitle */}
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-zinc-500">Bölüm Alt Başlığı</Label>
                                <Textarea
                                  value={typeof content.section_subtitle === 'object' && content.section_subtitle !== null ? content.section_subtitle[activeLang] || '' : content.section_subtitle || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const currentSub = typeof content.section_subtitle === 'object' && content.section_subtitle !== null ? content.section_subtitle : {};
                                    handleUpdateBlockField(block.id, 'section_subtitle', {
                                      ...currentSub,
                                      [activeLang]: val
                                    });
                                  }}
                                  className="min-h-[60px] text-xs resize-none leading-normal"
                                  placeholder="Kısa bir açıklama girin..."
                                />
                              </div>

                              {/* Source Type */}
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-zinc-500">Veri Kaynağı</Label>
                                <select
                                  value={content.source_type || 'manual'}
                                  onChange={(e) => handleUpdateBlockField(block.id, 'source_type', e.target.value)}
                                  className="w-full text-xs rounded-lg border border-border bg-background p-2.5 outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground font-medium cursor-pointer"
                                >
                                  <option value="manual">Manuel Giriş</option>
                                  <option value="dynamic">Veritabanından Çek (Dinamik)</option>
                                </select>
                              </div>

                              {/* Category Filter (Dynamic mode only) */}
                              {content.source_type === 'dynamic' && (
                                <div className="space-y-1.5 animate-fade-in">
                                  <Label className="text-xs font-semibold text-zinc-500">Sponsor Kategorisi</Label>
                                  <select
                                    value={content.category_slug || ''}
                                    onChange={(e) => handleUpdateBlockField(block.id, 'category_slug', e.target.value)}
                                    className="w-full text-xs rounded-lg border border-border bg-background p-2.5 outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground font-medium cursor-pointer"
                                  >
                                    <option value="">Tüm Sponsorlar</option>
                                    {Array.isArray(partnerCategories) && partnerCategories.map((cat) => {
                                      const catSlug = typeof cat.slug === 'object' ? (cat.slug.tr || cat.slug.en || '') : (cat.slug || '');
                                      const catName = typeof cat.name === 'object' ? (cat.name.tr || cat.name.en || '') : (cat.name || '');
                                      return (
                                        <option key={cat.id} value={catSlug}>
                                          {catName}
                                        </option>
                                      );
                                    })}
                                  </select>
                                </div>
                              )}

                              {/* Layout Style */}
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-zinc-500">Görünüm Düzeni</Label>
                                <select
                                  value={block.styles.layout || 'grid'}
                                  onChange={(e) => handleUpdateBlockStyle(block.id, 'layout', e.target.value)}
                                  className="w-full text-xs rounded-lg border border-border bg-background p-2.5 outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground font-medium cursor-pointer"
                                >
                                  <option value="grid">Grid (Izgara Düzeni)</option>
                                  <option value="marquee">Marquee (Sonsuz Akan Şerit)</option>
                                </select>
                              </div>

                              {/* Speed (Marquee only) */}
                              {block.styles.layout === 'marquee' && (
                                <div className="space-y-1.5 animate-fade-in">
                                  <Label className="text-xs font-semibold text-zinc-500">Akış Hızı (Saniye)</Label>
                                  <Input
                                    type="number"
                                    min="5"
                                    max="120"
                                    value={block.styles.speed || '30'}
                                    onChange={(e) => handleUpdateBlockStyle(block.id, 'speed', e.target.value)}
                                    className="h-9 text-xs"
                                    placeholder="Örn: 30"
                                  />
                                  <p className="text-[9px] text-zinc-400">Saniye değeri küçüldükçe akış hızlanır.</p>
                                </div>
                              )}

                              {/* Sponsor Logos Form Repeater (Manual mode only) */}
                              {content.source_type !== 'dynamic' && (
                                <div className="space-y-2.5 pt-2 border-t border-border/20">
                                  <Label className="text-xs font-semibold text-zinc-500 flex items-center justify-between">
                                    <span>Sponsorlar & Partnerler</span>
                                  </Label>
                                  <div className="space-y-3">
                                    {Array.isArray(content.items) && content.items.map((item, idx) => (
                                      <div key={idx} className="space-y-2 p-3 border border-border/60 rounded-xl bg-muted/20 relative animate-fade-in">
                                        {/* Header / Delete */}
                                        <div className="flex justify-between items-center pb-1 border-b border-border/20">
                                          <span className="text-[10px] font-bold text-zinc-400 uppercase">Sponsor #{idx + 1}</span>
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() => {
                                              const currentItems = Array.isArray(content.items) ? [...content.items] : [];
                                              const nextItems = currentItems.filter((_, i) => i !== idx);
                                              handleUpdateBlockField(block.id, 'items', nextItems);
                                            }}
                                            className="h-6 w-6 border-red-200 hover:bg-red-50 hover:text-red-600 text-red-500 dark:border-red-950 dark:hover:bg-red-950/30 rounded-md"
                                            title="Sil"
                                          >
                                            <Trash2 className="size-3" />
                                          </Button>
                                        </div>

                                        {/* Sponsor Name & Tier */}
                                        <div className="grid grid-cols-2 gap-2">
                                          <div className="space-y-1">
                                            <Label className="text-[10px] text-zinc-400">Sponsor Adı</Label>
                                            <Input
                                              type="text"
                                              value={item.name || ''}
                                              onChange={(e) => {
                                                const currentItems = Array.isArray(content.items) ? [...content.items] : [];
                                                currentItems[idx] = { ...currentItems[idx], name: e.target.value };
                                                handleUpdateBlockField(block.id, 'items', currentItems);
                                              }}
                                              className="h-8 text-[11px]"
                                              placeholder="Örn: RedBull"
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <Label className="text-[10px] text-zinc-400">Derece (Tier)</Label>
                                            <select
                                              value={item.tier || 'silver'}
                                              onChange={(e) => {
                                                const currentItems = Array.isArray(content.items) ? [...content.items] : [];
                                                currentItems[idx] = { ...currentItems[idx], tier: e.target.value };
                                                handleUpdateBlockField(block.id, 'items', currentItems);
                                              }}
                                              className="w-full text-[11px] h-8 rounded-md border border-border bg-background px-2 outline-none text-foreground font-medium cursor-pointer"
                                            >
                                              <option value="gold">Ana Sponsor (Gold)</option>
                                              <option value="silver">Normal Sponsor / Partner</option>
                                            </select>
                                          </div>
                                        </div>

                                        {/* Logo Path */}
                                        <div className="space-y-1">
                                          <Label className="text-[10px] text-zinc-400 font-semibold">Logo Görsel Yolu / Linki</Label>
                                          <Input
                                            type="text"
                                            value={item.logo || ''}
                                            onChange={(e) => {
                                              const currentItems = Array.isArray(content.items) ? [...content.items] : [];
                                              currentItems[idx] = { ...currentItems[idx], logo: e.target.value };
                                              handleUpdateBlockField(block.id, 'items', currentItems);
                                            }}
                                            className="h-8 text-[11px]"
                                            placeholder="Örn: /media/brand-logos/redbull.svg"
                                          />
                                        </div>

                                        {/* Link */}
                                        <div className="space-y-1">
                                          <Label className="text-[10px] text-zinc-400">Web Sitesi Bağlantısı (URL)</Label>
                                          <Input
                                            type="url"
                                            value={item.link || ''}
                                            onChange={(e) => {
                                              const currentItems = Array.isArray(content.items) ? [...content.items] : [];
                                              currentItems[idx] = { ...currentItems[idx], link: e.target.value };
                                              handleUpdateBlockField(block.id, 'items', currentItems);
                                            }}
                                            className="h-8 text-[11px]"
                                            placeholder="Örn: https://redbull.com"
                                          />
                                        </div>
                                      </div>
                                    ))}
                                    {(!Array.isArray(content.items) || content.items.length === 0) && (
                                      <div className="text-center py-4 border border-dashed border-border rounded-lg text-[11px] text-zinc-400 font-medium">
                                        Henüz sponsor eklenmedi.
                                      </div>
                                    )}
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const currentItems = Array.isArray(content.items) ? [...content.items] : [];
                                      const nextItems = [...currentItems, { name: '', logo: '/media/brand-logos/google-webdev.svg', link: '', tier: 'silver' }];
                                      handleUpdateBlockField(block.id, 'items', nextItems);
                                    }}
                                    className="w-full text-xs font-semibold h-8 mt-2.5 border-dashed hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-1.5"
                                  >
                                    <Plus className="size-3.5" /> Sponsor Ekle
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {block.type === 'cta_section' && (
                            <div className="space-y-4 pb-3 border-b border-border/40 mb-3 select-none animate-fade-in">
                              {/* Section Title */}
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-zinc-500">Bölüm Başlığı</Label>
                                <Input
                                  type="text"
                                  value={typeof content.section_title === 'object' && content.section_title !== null ? content.section_title[activeLang] || '' : content.section_title || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const currentTitle = typeof content.section_title === 'object' && content.section_title !== null ? content.section_title : {};
                                    handleUpdateBlockField(block.id, 'section_title', {
                                      ...currentTitle,
                                      [activeLang]: val
                                    });
                                  }}
                                  className="h-9 text-xs"
                                  placeholder="Örn: Bültenimize Abone Olun"
                                />
                              </div>

                              {/* Section Subtitle */}
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-zinc-500">Açıklama</Label>
                                <Textarea
                                  value={typeof content.section_subtitle === 'object' && content.section_subtitle !== null ? content.section_subtitle[activeLang] || '' : content.section_subtitle || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const currentSub = typeof content.section_subtitle === 'object' && content.section_subtitle !== null ? content.section_subtitle : {};
                                    handleUpdateBlockField(block.id, 'section_subtitle', {
                                      ...currentSub,
                                      [activeLang]: val
                                    });
                                  }}
                                  className="min-h-[60px] text-xs resize-none leading-normal"
                                  placeholder="Kısa bir açıklama girin..."
                                />
                              </div>

                              {/* CTA Mode */}
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-zinc-500">CTA Modu</Label>
                                <select
                                  value={content.cta_mode || 'newsletter'}
                                  onChange={(e) => handleUpdateBlockField(block.id, 'cta_mode', e.target.value)}
                                  className="w-full text-xs rounded-lg border border-border bg-background p-2.5 outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground font-medium cursor-pointer"
                                >
                                  <option value="newsletter">Bülten / E-posta Aboneliği</option>
                                  <option value="button_link">Buton / Yönlendirme Linki</option>
                                </select>
                              </div>

                              {/* Email Placeholder (Newsletter only) */}
                              {(content.cta_mode === 'newsletter' || !content.cta_mode) && (
                                <div className="space-y-1.5 animate-fade-in">
                                  <Label className="text-xs font-semibold text-zinc-500">E-posta Giriş İpucu</Label>
                                  <Input
                                    type="text"
                                    value={typeof content.placeholder === 'object' && content.placeholder !== null ? content.placeholder[activeLang] || '' : content.placeholder || ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      const currentPlaceholder = typeof content.placeholder === 'object' && content.placeholder !== null ? content.placeholder : {};
                                      handleUpdateBlockField(block.id, 'placeholder', {
                                        ...currentPlaceholder,
                                        [activeLang]: val
                                      });
                                    }}
                                    className="h-9 text-xs"
                                    placeholder="E-posta adresiniz"
                                  />
                                </div>
                              )}

                              {/* Button Text */}
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-zinc-500">Buton Metni</Label>
                                <Input
                                  type="text"
                                  value={typeof content.button_text === 'object' && content.button_text !== null ? content.button_text[activeLang] || '' : content.button_text || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const currentText = typeof content.button_text === 'object' && content.button_text !== null ? content.button_text : {};
                                    handleUpdateBlockField(block.id, 'button_text', {
                                      ...currentText,
                                      [activeLang]: val
                                    });
                                  }}
                                  className="h-9 text-xs"
                                  placeholder="Kayıt Ol / Başvur"
                                />
                              </div>

                              {/* Button Link (Button link mode only) */}
                              {content.cta_mode === 'button_link' && (() => {
                                const safePagesList = pagesList || [];
                                const availableRoutes = [
                                  ...SYSTEM_ROUTES,
                                  ...safePagesList.map(p => ({
                                    label: p.title?.[activeLang] || p.title || p.slug,
                                    path: p.slug?.[activeLang] ? (p.slug[activeLang].startsWith('/') ? p.slug[activeLang] : `/${p.slug[activeLang]}`) : (p.slug ? (p.slug.startsWith('/') ? p.slug : `/${p.slug}`) : '')
                                  }))
                                ];
                                const linkVal = content.button_link || '';
                                return (
                                  <div className="space-y-1.5 animate-fade-in">
                                    <Label className="text-xs font-semibold text-zinc-500">Buton Yönlendirme Hedefi</Label>
                                    <SearchableRouteSelector
                                      value={linkVal}
                                      onChange={(val) => {
                                        if (val === 'custom') {
                                          handleUpdateBlockField(block.id, 'button_link', '/custom');
                                        } else {
                                          handleUpdateBlockField(block.id, 'button_link', val);
                                        }
                                      }}
                                    />
                                    {linkVal && !availableRoutes.some(r => r.path === linkVal) && (
                                      <div className="space-y-1 pt-1">
                                        <Label className="text-[10px] text-zinc-400 font-semibold">Özel URL</Label>
                                        <Input
                                          type="text"
                                          value={linkVal}
                                          onChange={(e) => handleUpdateBlockField(block.id, 'button_link', e.target.value)}
                                          className="h-8 text-xs font-mono"
                                          placeholder="https://..."
                                        />
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}

                              {/* Layout Style */}
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-zinc-500">Görünüm Düzeni</Label>
                                <select
                                  value={block.styles.layout_style || 'centered_gradient'}
                                  onChange={(e) => handleUpdateBlockStyle(block.id, 'layout_style', e.target.value)}
                                  className="w-full text-xs rounded-lg border border-border bg-background p-2.5 outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground font-medium cursor-pointer"
                                >
                                  <option value="centered_gradient">Ortalanmış Geniş Zemin (Centered)</option>
                                  <option value="split_card">Yan Yana Kart (Split Grid)</option>
                                  <option value="glassmorphic">Buzlu Cam Kartı (Glassmorphic Box)</option>
                                </select>
                              </div>

                              {/* Gradient Theme */}
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-zinc-500">Arka Plan Stili</Label>
                                <select
                                  value={block.styles.bg_gradient || 'gradient_dark'}
                                  onChange={(e) => handleUpdateBlockStyle(block.id, 'bg_gradient', e.target.value)}
                                  className="w-full text-xs rounded-lg border border-border bg-background p-2.5 outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground font-medium cursor-pointer"
                                >
                                  <option value="gradient_dark">Kozmik Karanlık (Deep Space)</option>
                                  <option value="gradient_accent">Enerjik Turuncu (Sunset/Accent)</option>
                                  <option value="solid_dark">Düz Koyu Antrasit (Solid Dark)</option>
                                  <option value="solid_light">Düz Açık Gri/Beyaz (Solid Light)</option>
                                </select>
                              </div>

                              {/* Padding Settings */}
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <Label className="text-[10px] text-zinc-400">Üst Boşluk (px)</Label>
                                  <Input
                                    type="number"
                                    value={block.styles.paddingTop || '64'}
                                    onChange={(e) => handleUpdateBlockStyle(block.id, 'paddingTop', e.target.value)}
                                    className="h-8 text-xs"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[10px] text-zinc-400">Alt Boşluk (px)</Label>
                                  <Input
                                    type="number"
                                    value={block.styles.paddingBottom || '64'}
                                    onChange={(e) => handleUpdateBlockStyle(block.id, 'paddingBottom', e.target.value)}
                                    className="h-8 text-xs"
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {block.type === 'features_grid' && (
                            <div className="space-y-3 pb-3 border-b border-border/40 mb-3 select-none">
                              {(content.source_type === 'dynamic') && (
                                <div className="space-y-3.5 pt-1.5 border-t border-border/30 mt-1.5 animate-fade-in">
                                  <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-zinc-500">İçerik Tipi (Modül)</Label>
                                    <select
                                      value={content.target_content_type_id || ''}
                                      onChange={(e) => handleUpdateBlockField(block.id, 'target_content_type_id', e.target.value)}
                                      className="w-full text-xs rounded-lg border border-border bg-background p-2.5 outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground font-medium cursor-pointer"
                                    >
                                      <option value="" disabled>Modül seçin...</option>
                                      {CMS_DYNAMIC_MODULES.map((mod) => (
                                        <option key={mod.id} value={mod.id}>
                                          {mod.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  {content.target_content_type_id && (
                                    <div className="space-y-1.5 animate-fade-in">
                                      <Label className="text-xs font-semibold text-zinc-500">Gösterilecek Öğeler</Label>
                                      <div className="border border-border rounded-lg bg-background p-2.5 max-h-[180px] overflow-y-auto space-y-1.5 shadow-inner">
                                        {moduleItems.map((item) => {
                                          const moduleConf = CMS_DYNAMIC_MODULES.find(m => m.id === content.target_content_type_id);
                                          const title = item[moduleConf?.titleKey || 'title'] || item.title || item.name || '';
                                          const displayTitle = typeof title === 'object' && title !== null ? title.tr || title.en || item.slug : title;
                                          const isChecked = Array.isArray(content.target_item_ids)
                                            ? content.target_item_ids.includes(String(item.id)) || content.target_item_ids.includes(Number(item.id))
                                            : false;
                                          return (
                                            <label
                                              key={item.id}
                                              className="flex items-center gap-2 text-xs text-foreground cursor-pointer select-none py-0.5 hover:text-primary transition-colors font-medium"
                                            >
                                              <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={(e) => {
                                                  const currentIds = Array.isArray(content.target_item_ids) ? [...content.target_item_ids] : [];
                                                  let nextIds;
                                                  if (e.target.checked) {
                                                    nextIds = [...currentIds, item.id];
                                                  } else {
                                                    nextIds = currentIds.filter(id => String(id) !== String(item.id));
                                                  }
                                                  handleUpdateBlockField(block.id, 'target_item_ids', nextIds);
                                                }}
                                                className="rounded border-zinc-300 text-primary focus:ring-primary size-3.5 cursor-pointer accent-primary"
                                              />
                                              <span>{displayTitle}</span>
                                            </label>
                                          );
                                        })}
                                        {moduleItems.length === 0 && (
                                          <div className="text-[10px] text-zinc-400 py-1 text-center font-medium">Öğe bulunamadı.</div>
                                        )}
                                      </div>
                                      <p className="text-[10px] text-zinc-400 font-medium">Seçim yapmazsanız tüm kategoriler listelenir.</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Heading field */}
                          {headingKey && (
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold text-zinc-500">Başlık</Label>
                              <Input
                                value={headingValue}
                                onChange={(e) => handleUpdateBlockField(block.id, headingKey, e.target.value)}
                                className="text-xs h-9"
                              />
                            </div>
                          )}

                          {/* Subtitle field */}
                          {subtitleKey && (
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold text-zinc-500">Açıklama</Label>
                              <Textarea
                                value={subtitleValue}
                                onChange={(e) => handleUpdateBlockField(block.id, subtitleKey, e.target.value)}
                                className="text-xs min-h-[85px] resize-none"
                              />
                            </div>
                          )}

                          {/* HTML field */}
                          {content.html !== undefined && (
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold text-zinc-500">HTML Kodu</Label>
                              <Textarea
                                value={htmlValue}
                                onChange={(e) => handleUpdateBlockField(block.id, 'html', e.target.value)}
                                className="text-xs min-h-[140px] font-mono leading-normal"
                              />
                            </div>
                          )}

                          {/* Button text field */}
                          {content.button_text !== undefined && (
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold text-zinc-500">Buton Metni</Label>
                              <Input
                                value={buttonTextValue}
                                onChange={(e) => handleUpdateBlockField(block.id, 'button_text', e.target.value)}
                                className="text-xs h-9"
                              />
                            </div>
                          )}

                          {/* Button link field */}
                          {content.button_link !== undefined && (() => {
                            const safePagesList = pagesList || [];
                            const availableRoutes = [
                              ...SYSTEM_ROUTES,
                              ...safePagesList.map(p => ({
                                label: p.title?.[activeLang] || p.title || p.slug,
                                path: p.slug?.[activeLang] ? (p.slug[activeLang].startsWith('/') ? p.slug[activeLang] : `/${p.slug[activeLang]}`) : (p.slug ? (p.slug.startsWith('/') ? p.slug : `/${p.slug}`) : '')
                              }))
                            ];

                            const hasMatch = availableRoutes.some(r => r.path === buttonLinkValue);
                            const selectValue = buttonLinkValue === ''
                              ? 'none'
                              : hasMatch
                                ? buttonLinkValue
                                : 'custom';

                            return (
                              <div className="space-y-2">
                                <Label className="text-xs font-semibold text-zinc-500">Buton Yönlendirme Hedefi</Label>
                                <SearchableRouteSelector
                                  value={buttonLinkValue}
                                  onChange={(val) => {
                                    if (val === 'custom') {
                                      handleUpdateLink('/custom', block.id);
                                    } else {
                                      handleUpdateLink(val, block.id);
                                    }
                                  }}
                                  SYSTEM_ROUTES={SYSTEM_ROUTES}
                                  pagesList={safePagesList}
                                  activeLang={activeLang}
                                />

                                {selectValue === 'custom' && (
                                  <div className="space-y-1.5 mt-1.5 animate-slide-down">
                                    <Label className="text-[10px] font-medium text-muted-foreground">Dış Link veya Özel URL</Label>
                                    <Input
                                      value={buttonLinkValue}
                                      onChange={(e) => handleUpdateLink(e.target.value, block.id)}
                                      placeholder="https://example.com veya /ozel-yol"
                                      className="text-xs h-8"
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          {/* Video background url & upload field */}
                          {content.video_url !== undefined && (
                            <div className="space-y-2.5">
                              <Label className="text-xs font-semibold text-zinc-500">Arka Plan Videosu</Label>
                              
                              {/* File Upload Component */}
                              <div className="rounded-xl border border-dashed border-border/80 p-1 bg-muted/5">
                                <FileUpload
                                  value={typeof videoUrlValue === 'number' || (typeof videoUrlValue === 'string' && /^\d+$/.test(videoUrlValue)) ? videoUrlValue : ''}
                                  onChange={(newVal) => handleUpdateBlockField(block.id, 'video_url', newVal)}
                                  accept="video/*"
                                  placeholder="Video yükleyin (MP4, WebM)"
                                  description="Maksimum 100MB"
                                />
                              </div>
                            </div>
                          )}

                          {/* Style fields */}
                          {block.styles.overlay_color !== undefined && (
                            <div className="space-y-3 pt-2 border-t border-border/40">
                              <h5 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Görünüm Ayarları</h5>
                              
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                  <Label className="text-xs font-semibold text-zinc-500">Karartma Rengi</Label>
                                  <div className="flex gap-2 items-center">
                                    <Input
                                      type="color"
                                      value={overlayColor}
                                      onChange={(e) => handleUpdateBlockStyle(block.id, 'overlay_color', e.target.value)}
                                      className="size-9 p-0 border border-border rounded-lg cursor-pointer overflow-hidden shrink-0"
                                    />
                                    <Input
                                      type="text"
                                      value={overlayColor}
                                      onChange={(e) => handleUpdateBlockStyle(block.id, 'overlay_color', e.target.value)}
                                      className="text-xs h-9 font-mono w-full"
                                    />
                                  </div>
                                </div>

                                <div className="space-y-1.5">
                                  <Label className="text-xs font-semibold text-zinc-500">Karartma (%)</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={overlayOpacity}
                                    onChange={(e) => handleUpdateBlockStyle(block.id, 'overlay_opacity', parseInt(e.target.value, 10) || 0)}
                                    className="text-xs h-9"
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {block.type === 'features_grid' && (
                            <div className="space-y-3 pt-3 border-t border-border/40">
                              <h5 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Kart Tasarımı</h5>
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-zinc-500">Tasarım Şablonu</Label>
                                <select
                                  value={block.styles.card_style || 'default'}
                                  onChange={(e) => handleUpdateBlockStyle(block.id, 'card_style', e.target.value)}
                                  className="w-full text-xs rounded-lg border border-border bg-background p-2.5 outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground font-medium cursor-pointer"
                                >
                                  <option value="default">Varsayılan Tasarım (Proje Teması)</option>
                                  <option value="race_card">Görsel ve Sayaçlı Kart (Race Card)</option>
                                </select>
                              </div>

                              <div className="space-y-1.5 pt-2">
                                <Label className="text-xs font-semibold text-zinc-500">Sütun Sayısı (Yan Yana)</Label>
                                <select
                                  value={block.styles.columns || '4'}
                                  onChange={(e) => handleUpdateBlockStyle(block.id, 'columns', e.target.value)}
                                  className="w-full text-xs rounded-lg border border-border bg-background p-2.5 outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground font-medium cursor-pointer"
                                >
                                  <option value="1">1 Sütun (Alt Alta)</option>
                                  <option value="2">2 Sütun</option>
                                  <option value="3">3 Sütun</option>
                                  <option value="4">4 Sütun</option>
                                </select>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Sticky Action Footer */}
                        <div className="pt-3.5 border-t border-border/50 shrink-0 mt-auto flex flex-col gap-2 bg-background">
                          <Button
                            onClick={() => setSelectedBlockId(null)}
                            className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                          >
                            <Check className="size-4" />
                            Tamam, Listeye Dön
                          </Button>
                        </div>
                      </div>
                    );
                  })() : (
                    <div className="flex-grow flex flex-col min-h-0">
                      {/* Blok Kütüphanesi Header */}
                      <div className="space-y-4 pb-4 border-b border-border/60 shrink-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[15px] font-bold text-foreground tracking-normal">Bölüm Ekle</h4>
                          <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
                            Blok Kütüphanesi
                          </span>
                        </div>
                        {/* Search Bar */}
                        <div className="relative">
                          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/75" />
                          <input
                            type="text"
                            placeholder="Blok ara... (Örn: Slider, İletişim)"
                            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-border bg-muted/20 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground placeholder:text-muted-foreground/60 transition-all font-sans"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>
                        {/* Accordion Categories */}
                        <div className="space-y-3 mt-4 flex-grow overflow-y-auto min-h-0 pr-1">
                          {(() => {
                            const totalMatches = COMPONENT_LIBRARY.filter(comp => {
                              if (!searchQuery) return true;
                              const query = searchQuery.toLowerCase();
                              return comp.name.toLowerCase().includes(query) || comp.type.toLowerCase().includes(query);
                            }).length;

                            if (totalMatches === 0) {
                              return (
                                <div className="text-center text-muted-foreground py-12">
                                  <Search className="size-7 stroke-[1.5] mb-2 mx-auto text-zinc-300 dark:text-zinc-700" />
                                  <p className="text-xs font-bold text-foreground">Blok Bulunamadı</p>
                                  <p className="text-[10px] text-zinc-400 mt-1 max-w-[180px] mx-auto">
                                    Arama kriterlerinize uygun blok bulunamadı.
                                  </p>
                                </div>
                              );
                            }

                            return BUILDER_CATEGORIES.filter(cat => cat.id !== 'all').map((cat) => {
                              const isExpanded = expandedCategories[cat.id];
                              
                              // Filter components in this category matching search query
                              const componentsInCat = COMPONENT_LIBRARY.filter(comp => {
                                if (comp.category !== cat.id) return false;
                                if (searchQuery) {
                                  const query = searchQuery.toLowerCase();
                                  return comp.name.toLowerCase().includes(query) || comp.type.toLowerCase().includes(query);
                                }
                                return true;
                              });

                              // If searching and this category has no matches, skip it
                              if (searchQuery && componentsInCat.length === 0) return null;

                              return (
                                <div key={cat.id} className="transition-all select-none">
                                  {/* Accordion Header */}
                                  <button
                                    type="button"
                                    onClick={() => toggleCategory(cat.id)}
                                    className="w-full flex items-center justify-between py-2.5 border-b border-border/50 hover:text-primary transition-colors select-none text-left cursor-pointer"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="text-[12.5px] font-bold text-foreground tracking-wide select-none">
                                        {cat.label}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground/80">
                                        {componentsInCat.length}
                                      </span>
                                      <ChevronDown className={`size-3.5 text-muted-foreground/60 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                    </div>
                                  </button>

                                  {/* Accordion Content (Grid of Cards) */}
                                  <div className={`transition-all duration-200 overflow-hidden ${isExpanded ? 'h-auto opacity-100 pt-3.5 pb-5' : 'h-0 opacity-0 pointer-events-none'}`}>
                                    {componentsInCat.length > 0 ? (
                                      <div className="grid grid-cols-2 gap-3">
                                        {componentsInCat.map((comp) => {
                                          const IconComponent = comp.icon || Layers;
                                          return (
                                            <button
                                              key={comp.type}
                                              onClick={() => handleAddBlock(comp)}
                                              draggable
                                              onDragStart={(e) => {
                                                e.dataTransfer.setData('text/plain', comp.type);
                                                e.dataTransfer.effectAllowed = 'copy';
                                              }}
                                              className="flex flex-col items-center justify-between p-4 aspect-square rounded-xl border border-border bg-card hover:bg-muted/10 hover:border-primary/45 hover:shadow-xs transition-all text-center group cursor-pointer active:scale-95 select-none relative"
                                            >
                                              {/* Top Right Mini Atomic Icon */}
                                              <span className="absolute top-2 right-2 text-[9px] text-muted-foreground/30 group-hover:text-primary/30 transition-colors">
                                                ⚛
                                              </span>
                                              {/* Center Icon */}
                                              <div className="flex-grow flex items-center justify-center mt-2">
                                                <IconComponent className="size-6 stroke-[1.5] text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all" />
                                              </div>
                                              {/* Bottom Text Label */}
                                              <span className="text-[10px] font-bold text-foreground mt-3 group-hover:text-primary transition-colors leading-tight line-clamp-2">
                                                {comp.name}
                                              </span>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <div className="flex flex-col items-center justify-center p-4 aspect-square rounded-xl border border-dashed border-border/60 bg-muted/5 text-center select-none opacity-60">
                                        <Code className="size-5 stroke-[1.2] text-muted-foreground/50 mb-2" />
                                        <span className="text-[10px] font-semibold text-muted-foreground/70">
                                          Çok Yakında
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="settings" className="mt-0 flex-grow flex flex-col justify-center items-center overflow-y-auto min-h-0">
                  <div className="text-center text-muted-foreground py-10">
                    <Sliders className="size-8 stroke-[1.5] mb-3 mx-auto text-zinc-300 dark:text-zinc-700" />
                    <p className="text-sm font-bold text-foreground">Sayfa Yapılandırması</p>
                    <p className="text-xs text-muted-foreground mt-1.5 max-w-[220px] mx-auto leading-relaxed">
                      Başlık, slug, SEO ve görünüm ayarları gibi sayfa yapılandırmaları bu sekmede yer alacaktır.
                    </p>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Main Workspace (Right Side) */}
      <div className="flex-1 h-full overflow-y-auto flex flex-col justify-between relative bg-background">
        {/* Dynamic Header */}
          <PublicHeader settings={settings || {}} menuItems={headerMenuItems || []} locale={activeLang} />

          {/* Dynamic Blocks or Fallback */}
          <main 
            className="flex-grow flex flex-col bg-zinc-50/20 dark:bg-zinc-950/10"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              if (blocks.length === 0) {
                handleDropBlock(e, 0);
              }
            }}
          >
            {blocks.length > 0 ? (
              <div className="w-full">
                {/* Render Dropzone 0 before first block */}
                {renderDropZone(0)}
                
                {blocks.map((block, index) => (
                  <div key={block.id || index} className="w-full">
                    {/* Block Wrapper */}
                    <div
                      draggable
                      onDragStart={(e) => handleDragStartBlock(e, index)}
                      onDragEnd={handleDragEndBlock}
                      onClick={() => {
                        setSelectedBlockId(block.id);
                        setActiveTab('blocks');
                      }}
                      className="relative group transition-all duration-200"
                    >
                      {/* Block Renderer */}
                      <BlockRenderer blocks={[block]} locale={activeLang} />

                      {/* Visual Border Label */}
                      <div className="absolute left-4 top-4 z-40 opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 rounded-md shadow-sm uppercase tracking-wider select-none pointer-events-none">
                        {COMPONENT_LIBRARY.find(c => c.type === block.type)?.name || block.type}
                      </div>

                      {/* Block Action Overlay */}
                      <div className="absolute top-4 right-4 z-40 opacity-0 group-hover:opacity-100 transition-opacity bg-background/95 hover:bg-background backdrop-blur-md border border-border shadow-lg rounded-xl p-1 flex gap-1 items-center select-none">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 rounded-lg text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                          onClick={() => handleMoveBlock(index, 'up')}
                          disabled={index === 0}
                          title="Yukarı Taşı"
                        >
                          <ArrowUp className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 rounded-lg text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                          onClick={() => handleMoveBlock(index, 'down')}
                          disabled={index === blocks.length - 1}
                          title="Aşağı Taşı"
                        >
                          <ArrowDown className="size-3.5" />
                        </Button>
                        <div className="h-4 w-px bg-border mx-0.5 shrink-0" />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/5 shrink-0 cursor-pointer"
                          onClick={() => handleDeleteBlock(block.id)}
                          title="Bölümü Sil"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                    {/* Intermediate drop zone between blocks (only if not the last block) */}
                    {index < blocks.length - 1 && renderDropZone(index + 1)}
                  </div>
                ))}

                {/* Permanent Visual End-of-Page Dropzone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverIndex(blocks.length);
                  }}
                  onDragLeave={() => setDragOverIndex(null)}
                  onDrop={(e) => handleDropBlock(e, blocks.length)}
                  className={`w-full transition-all duration-200 flex items-center justify-center rounded-xl border border-dashed py-8 px-4 ${
                    dragOverIndex === blocks.length
                      ? 'border-primary bg-primary/5 text-primary scale-[0.99] border-2'
                      : 'border-border/40 hover:border-primary/30 hover:bg-muted/5 text-muted-foreground bg-muted/10'
                  } my-4 cursor-default select-none`}
                >
                  <div className="flex flex-col items-center gap-1.5 pointer-events-none">
                    <Plus className={`size-4 ${dragOverIndex === blocks.length ? 'animate-bounce text-primary' : 'text-muted-foreground/60'}`} />
                    <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">
                      {dragOverIndex === blocks.length ? 'Buraya Bırakın' : 'Yeni Bölüm Sürükleyin'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div 
                className="flex-grow flex flex-col justify-center items-center py-48 w-full select-none cursor-default"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDropBlock(e, 0)}
              >
                <Container className="text-center py-12 flex flex-col justify-center items-center gap-4 pointer-events-none">
                  <Button variant="primary" size="lg" onClick={() => setActiveTab('blocks')} className="pointer-events-auto cursor-pointer">
                    <Plus />
                    Bölüm Ekle
                  </Button>
                  <p className="text-[11px] text-muted-foreground/80 max-w-[200px] leading-relaxed">
                    Veya sol taraftan sürükleyip bu alana bırakın.
                  </p>
                </Container>
              </div>
            )}
          </main>

        {/* Dynamic Footer */}
        <PublicFooter settings={settings || {}} menuItems={footerMenuItems || []} locale={activeLang} />
      </div>
    </div>
  );
}
