'use client';

import { useRef } from 'react';
import { ArrowRight, Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export const blockConfig = {
  type: 'glassmorphic_grid',
  name: 'Cam Efektli Kartlar (Glassmorphic Grid)',
  description: 'Görsel içerikli kartları modern cam efektiyle Izgara (Grid), Slider (Carousel) veya Liste (List) şeklinde listeler.',
  contentFields: [
    { key: 'title', label: 'Ana Başlık', type: 'text', default: 'Öne Çıkan Keşifler' },
    { key: 'subtitle', label: 'Alt Başlık', type: 'text', default: 'İlginizi çeken kategorileri, yazıları veya rotaları seçerek detayları inceleyin.' },
    {
      key: 'source_type',
      label: 'Veri Kaynağı',
      type: 'select',
      options: [
        { value: 'custom', label: 'Manuel Kart Ekleme' },
        { value: 'category', label: 'Dinamik Kategoriler' },
        { value: 'race', label: 'Dinamik Yarışlar / Etkinlikler' },
        { value: 'post', label: 'Dinamik Yazılar / Blog' }
      ],
      default: 'category'
    },
    { key: 'entity_ids', label: 'Dinamik Kayıtları Seçin', type: 'relation_multiple', default: [] },
    {
      key: 'custom_items',
      label: 'Özel Manuel Kartlar',
      type: 'json',
      default: [
        {
          title: 'Macera Yarışları',
          desc: 'Doğayla iç içe, zorlu ve heyecan dolu yarış mücadeleleri.',
          badge: 'Yeni Sezon',
          image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=800&q=80',
          link: '#'
        },
        {
          title: 'Yol Rotaları',
          desc: 'Rüzgarı hissedeceğiniz en popüler asfalt bisiklet yolları.',
          badge: 'Popüler',
          image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80',
          link: '#'
        }
      ]
    }
  ],
  styleFields: [
    { key: 'layout', label: 'Yerleşim Düzeni', type: 'select', options: ['grid', 'carousel', 'list'], default: 'grid' },
    { key: 'gridCols', label: 'Sütun Sayısı (Yalnızca Grid İçin)', type: 'select', options: ['3', '4'], default: '3' },
    { key: 'theme', label: 'Tema Tipi', type: 'select', options: ['dark_glass', 'light_glass'], default: 'dark_glass' }
  ]
};

const MOCK_FALLBACKS = [
  {
    id: 'mock-1',
    title: 'Açık Su Yüzme',
    desc: 'Mavi sularda dalgalarla mücadele edin ve doğayla bütünleşin.',
    badge: '5 Yarış',
    image: 'https://images.unsplash.com/photo-1530541930197-ff16ac917b0e?auto=format&fit=crop&w=800&q=80',
    link: '#'
  },
  {
    id: 'mock-2',
    title: 'Patika Koşusu',
    desc: 'Zorlu patikalarda doğayla iç içe koşarak sınırlarınızı keşfedin.',
    badge: '8 Yarış',
    image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=800&q=80',
    link: '#'
  },
  {
    id: 'mock-3',
    title: 'Yol Bisikleti',
    desc: 'Rüzgara karşı pedallayarak en hızlı parkurları fethedin.',
    badge: '4 Yarış',
    image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80',
    link: '#'
  }
];

export default function GlassmorphicGrid({ data, locale = 'tr' }) {
  const fields = data?.content || data?.data || {};
  const styles = data?.styles || {};
  
  const title = getLocalized(fields.title, locale) || 'Öne Çıkan Keşifler';
  const subtitle = getLocalized(fields.subtitle, locale) || '';
  
  const sourceType = fields.source_type || 'category';
  const layout = styles.layout || fields.layout || 'grid';
  const gridCols = styles.gridCols || fields.gridCols || '3';
  const theme = styles.theme || fields.theme || 'dark_glass';
  const isDark = theme === 'dark_glass';

  const scrollContainerRef = useRef(null);

  // 1. Gather display cards from resolved DB categories/races/posts or custom items
  let items = [];

  if (sourceType !== 'custom' && data?.resolved_entities && data.resolved_entities.length > 0) {
    items = data.resolved_entities.map(ent => {
      const isCategory = sourceType === 'category';
      const isRace = sourceType === 'race';
      const isPost = sourceType === 'post';

      let itemTitle = '';
      let itemDesc = '';
      let itemBadge = '';
      let itemLink = '#';
      let itemImage = ent.cover_image?.url || ent.cover_image?.webp_url;

      if (isCategory) {
        itemTitle = getLocalized(ent.name, locale);
        itemDesc = getLocalized(ent.description, locale);
        const isPostType = ent.type === 'post' || ent.type === 'blog';
        const count = isPostType ? (ent.posts_count || 0) : (ent.races_count || 0);
        const countSuffix = isPostType ? 'Yazı' : (ent.type === 'race' ? 'Yarış' : 'İçerik');
        itemBadge = `${count} ${countSuffix}`;
        itemLink = `/${isPostType ? 'blog' : 'kategori'}/${ent.slug ? getLocalized(ent.slug, locale) : ent.id}`;
      } else if (isRace) {
        itemTitle = getLocalized(ent.name || ent.title, locale);
        itemDesc = getLocalized(ent.description || ent.summary, locale);
        itemBadge = ent.status === 'active' ? 'Aktif' : 'Yarış';
        itemLink = `/yaris/${ent.slug ? getLocalized(ent.slug, locale) : ent.id}`;
      } else if (isPost) {
        itemTitle = getLocalized(ent.title || ent.name, locale);
        itemDesc = getLocalized(ent.summary || ent.content, locale);
        itemBadge = 'Yazı';
        itemLink = `/blog/${ent.slug ? getLocalized(ent.slug, locale) : ent.id}`;
      }

      return {
        id: ent.id,
        title: itemTitle,
        desc: itemDesc,
        badge: itemBadge,
        image: itemImage,
        link: itemLink
      };
    });
  } else if (sourceType === 'custom' && fields.custom_items && fields.custom_items.length > 0) {
    items = fields.custom_items.map((item, idx) => ({
      id: `custom-${idx}`,
      title: getLocalized(item.title, locale),
      desc: getLocalized(item.desc || item.description, locale),
      badge: getLocalized(item.badge, locale),
      image: item.image || item.cover_image?.url,
      link: item.link || '#'
    }));
  } else {
    items = MOCK_FALLBACKS;
  }

  // Styles definitions
  const cardBg = isDark
    ? 'bg-black/35 hover:bg-black/45 border-white/10 dark:border-white/5 shadow-black/30 text-white'
    : 'bg-white/40 hover:bg-white/50 border-zinc-200/80 shadow-zinc-200/40 text-zinc-900';

  const descColor = isDark ? 'text-zinc-300' : 'text-zinc-600';

  const renderCard = (item) => {
    const imageUrl = item.image || 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=800&q=80';
    return (
      <div
        className={`group relative h-96 rounded-3xl overflow-hidden border ${cardBg} shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] backdrop-blur-lg hover:-translate-y-2 hover:border-primary/50 transition-all duration-300 flex flex-col justify-end`}
      >
        {/* Background Image Layer */}
        <div 
          className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-700 select-none"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />
        
        {/* Dark Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

        {/* Inner Content Area */}
        <div className="p-6 sm:p-8 relative z-10 space-y-4">
          {/* Badge */}
          {item.badge && (
            <div className="flex items-center gap-2 select-none">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold tracking-wider uppercase rounded-full bg-primary/20 text-primary border border-primary/30 backdrop-blur-xs">
                <Trophy className="size-3" /> {item.badge}
              </span>
            </div>
          )}

          {/* Title & Description */}
          <div className="space-y-2">
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {item.title}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-200 line-clamp-2 leading-relaxed font-light">
              {item.desc}
            </p>
          </div>

          {/* Action Link */}
          <div className="pt-2">
            <Link
              href={item.link}
              className="inline-flex items-center gap-2 text-xs font-semibold text-white group-hover:text-primary transition-colors select-none"
            >
              Detayları İncele <ArrowRight className="size-3.5 group-hover:translate-x-1.5 transition-transform duration-300" />
            </Link>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="py-20 relative overflow-hidden bg-background">
      {/* Glow Blur Decorations */}
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 select-none pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl translate-x-1/2 select-none pointer-events-none" />

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        {/* Header Section */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground bg-gradient-to-r from-foreground via-foreground/90 to-foreground/80 bg-clip-text">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {/* Layout Render Strategy */}
        {layout === 'grid' && (
          <div className={`grid gap-8 ${
            gridCols === '4'
              ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
              : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          }`}>
            {items.map((item) => (
              <div key={item.id}>
                {renderCard(item)}
              </div>
            ))}
          </div>
        )}

        {layout === 'carousel' && (
          <div className="relative group/carousel w-full">
            {/* Nav Arrows */}
            <button
              onClick={() => scrollContainerRef.current?.scrollBy({ left: -360, behavior: 'smooth' })}
              className="absolute -left-5 top-1/2 -translate-y-1/2 z-20 bg-black/60 hover:bg-black/85 text-white p-3.5 rounded-full border border-white/10 opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 backdrop-blur-md hidden md:block cursor-pointer"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              onClick={() => scrollContainerRef.current?.scrollBy({ left: 360, behavior: 'smooth' })}
              className="absolute -right-5 top-1/2 -translate-y-1/2 z-20 bg-black/60 hover:bg-black/85 text-white p-3.5 rounded-full border border-white/10 opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 backdrop-blur-md hidden md:block cursor-pointer"
            >
              <ChevronRight className="size-5" />
            </button>

            {/* Carousel Snap Box */}
            <div
              ref={scrollContainerRef}
              className="flex gap-8 overflow-x-auto scrollbar-none snap-x snap-mandatory py-4 scroll-smooth"
            >
              {items.map((item) => (
                <div key={item.id} className="min-w-[290px] sm:min-w-[360px] snap-start shrink-0 flex-1">
                  {renderCard(item)}
                </div>
              ))}
            </div>
          </div>
        )}

        {layout === 'list' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            {items.map((item) => {
              const imageUrl = item.image || 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=800&q=80';
              return (
                <div
                  key={item.id}
                  className={`group relative rounded-3xl overflow-hidden border ${cardBg} shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] backdrop-blur-lg hover:-translate-y-1 hover:border-primary/50 transition-all duration-300 flex flex-col md:flex-row items-center justify-between p-6 sm:p-8 gap-6`}
                >
                  {/* Left Side Details */}
                  <div className="flex-1 space-y-4 text-left w-full">
                    {item.badge && (
                      <div className="flex items-center gap-2 select-none">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold tracking-wider uppercase rounded-full bg-primary/20 text-primary border border-primary/30">
                          <Trophy className="size-3" /> {item.badge}
                        </span>
                      </div>
                    )}
                    <div className="space-y-2">
                      <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-light">
                        {item.desc}
                      </p>
                    </div>
                    <div className="pt-2">
                      <Link
                        href={item.link}
                        className="inline-flex items-center gap-2 text-xs font-semibold text-white group-hover:text-primary transition-colors select-none"
                      >
                        Detayları İncele <ArrowRight className="size-3.5 group-hover:translate-x-1.5 transition-transform duration-300" />
                      </Link>
                    </div>
                  </div>

                  {/* Right Side Visual Image */}
                  <div className="w-full md:w-56 h-40 md:h-32 rounded-2xl overflow-hidden shrink-0 relative border border-white/10">
                    <div 
                      className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-500"
                      style={{ backgroundImage: `url(${imageUrl})` }}
                    />
                    <div className="absolute inset-0 bg-black/10" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

// Localized helper
function getLocalized(val, locale) {
  if (val && typeof val === 'object') {
    return val[locale] || val['tr'] || val['en'] || Object.values(val)[0] || '';
  }
  return val || '';
}
