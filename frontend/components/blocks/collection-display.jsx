'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Calendar, Clock, ArrowRight, BookOpen, Newspaper } from 'lucide-react';

function getLocalized(val, locale = 'tr') {
  if (val && typeof val === 'object') {
    return val[locale] ?? '';
  }
  return val ?? '';
}

export default function CollectionDisplay({ data, locale = 'tr' }) {
  const block = data || {};
  const content = block.content || block.data || {};
  const styles = block.styles || {};

  const title = getLocalized(content.section_title, locale);
  const subtitle = getLocalized(content.section_subtitle, locale);
  const layoutStyle = content.layout_style || 'grid';
  const targetType = content.target_content_type_id || 'blog';

  const columns = parseInt(styles.columns || '3', 10);
  const limit = parseInt(styles.limit || '3', 10);
  const gap = parseInt(styles.gap || '24', 10);
  const paddingTop = styles.paddingTop ? `${styles.paddingTop}px` : '64px';
  const paddingBottom = styles.paddingBottom ? `${styles.paddingBottom}px` : '64px';

  // State for client-side fetched posts fallback
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Read server-hydrated data if present, otherwise fallback to client-side fetch
  const hydratedItems = useMemo(() => {
    return Array.isArray(block.hydrated_data) ? block.hydrated_data : [];
  }, [block.hydrated_data]);

  useEffect(() => {
    const isBuilder = typeof window !== 'undefined' && window.location.pathname.includes('/builder');

    // On production pages, if we have server-hydrated items, use them
    if (hydratedItems.length > 0 && !isBuilder) {
      setItems(hydratedItems.slice(0, limit));
      return;
    }

    let active = true;
    const fetchItems = async () => {
      setLoading(true);
      try {
        // Fetch from public posts proxy endpoint (only published blog entries)
        const endpoint = targetType === 'blog' 
          ? `/api/public/posts?limit=${limit}` 
          : `/api/public/posts?type=${targetType}&limit=${limit}`;
          
        const res = await fetch(endpoint, { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (active && json.data) {
            setItems(Array.isArray(json.data) ? json.data : []);
          }
        }
      } catch (e) {
        console.error('Failed to fetch collection items:', e);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchItems();
    return () => { active = false; };
  }, [hydratedItems, targetType, limit]);

  // If no items and not loading, don't show empty block on production site
  if (items.length === 0 && !loading && hydratedItems.length === 0) {
    return (
      <div className="w-full py-12 text-center text-xs font-semibold bg-zinc-100 dark:bg-zinc-900 text-muted-foreground border border-dashed border-zinc-200 dark:border-zinc-800 select-none">
        {locale === 'tr' ? 'Gösterilecek haber veya yazı bulunamadı.' : 'No posts or news found to display.'}
      </div>
    );
  }

  // Grid columns class mapper
  const gridColClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }[columns] || 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

  return (
    <section 
      style={{ paddingTop, paddingBottom }}
      className="w-full bg-white dark:bg-[#060c1d] border-y border-zinc-200/50 dark:border-white/5 relative overflow-hidden select-none"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header Block: Title & Action Link */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div className="space-y-3 max-w-2xl">
            {title && (
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-white uppercase flex items-center gap-2">
                <span className="w-1.5 h-7 bg-[#f97316] rounded-full inline-block" />
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          
          <Link
            href={targetType === 'blog' ? '/haberler' : `/${targetType}`}
            className="group flex items-center gap-1.5 text-xs sm:text-sm font-black uppercase text-[#f97316] hover:text-[#ea580c] transition-colors self-start sm:self-auto shrink-0 tracking-wider"
          >
            {locale === 'tr' ? 'Tümünü Gör' : 'View All'}
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Dynamic content rendering */}
        {loading ? (
          /* Skeleton Loader state */
          <div className={`grid gap-6 ${gridColClass}`} style={{ gap: `${gap}px` }}>
            {[1, 2, 3].map(idx => (
              <div key={idx} className="w-full flex flex-col rounded-2xl overflow-hidden border border-zinc-200/60 dark:border-white/5 bg-white dark:bg-zinc-900/40 shadow-xs">
                <div className="aspect-[16/10] bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                <div className="p-6 space-y-3">
                  <div className="h-4 w-1/3 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
                  <div className="h-6 w-full bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
                  <div className="h-6 w-3/4 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : layoutStyle === 'carousel' ? (
          /* Horizontal Carousel view on all screen sizes */
          <div 
            className="flex overflow-x-auto pb-6 pt-1 px-4 -mx-4 no-scrollbar snap-x snap-mandatory scroll-smooth"
            style={{ gap: `${gap}px` }}
          >
            <style>{`
              .no-scrollbar::-webkit-scrollbar { display: none; }
              .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
            {items.map((item, index) => (
              <div key={item.id || index} className="w-[280px] sm:w-[320px] md:w-[350px] shrink-0 snap-start">
                <PostItemCard item={item} targetType={targetType} locale={locale} />
              </div>
            ))}
          </div>
        ) : (
          /* Grid View layout */
          <div className={`grid gap-6 ${gridColClass}`} style={{ gap: `${gap}px` }}>
            {items.map((item, index) => (
              <PostItemCard key={item.id || index} item={item} targetType={targetType} locale={locale} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function PostItemCard({ item, targetType, locale }) {
  const entryData = item.data || {};
  const title = getLocalized(entryData.title || entryData.name || item.title || 'Untitled', locale);
  const summary = getLocalized(entryData.summary || entryData.description || '', locale);
  const slug = getLocalized(entryData.slug || item.slug || '', locale);
  const readingTime = entryData.reading_time || 5;

  // Resolve cover image url
  let imgUrl = 'https://images.unsplash.com/photo-1502224562085-639556652f33?auto=format&fit=crop&w=600&q=80'; // fallback sports running
  const coverImage = entryData.cover_image || entryData.image || entryData.photo || item.cover_image;
  if (coverImage && typeof coverImage === 'object') {
    imgUrl = coverImage.url || imgUrl;
  } else if (typeof coverImage === 'string') {
    imgUrl = coverImage;
  }

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000';
  const resolvedImgUrl = imgUrl.startsWith('http') || imgUrl.startsWith('/') 
    ? (imgUrl.startsWith('/') && !imgUrl.startsWith('//') ? `${backendUrl}${imgUrl}` : imgUrl) 
    : `${backendUrl}/${imgUrl}`;

  // Get localized category name if exists
  const categoryName = useMemo(() => {
    if (Array.isArray(entryData.categories) && entryData.categories.length > 0) {
      return getLocalized(entryData.categories[0].name, locale);
    }
    return locale === 'tr' ? 'Haberler' : 'News';
  }, [entryData.categories, locale]);

  // Format date
  const dateStr = useMemo(() => {
    const rawDate = item.published_at || item.created_at;
    if (!rawDate) return null;
    return new Date(rawDate).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, [item.published_at, item.created_at, locale]);

  const detailUrl = targetType === 'blog' ? `/haberler/${slug}` : `/${targetType}/${slug}`;

  return (
    <Link 
      href={detailUrl}
      className="group flex flex-col h-full rounded-2xl overflow-hidden border border-zinc-200/60 dark:border-white/5 bg-white dark:bg-[#0b1428] shadow-xs hover:shadow-md dark:hover:border-zinc-700/60 transition-all duration-300 hover:-translate-y-1.5"
    >
      {/* Aspect Ratio Image Container */}
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <img
          src={resolvedImgUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-104"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1502224562085-639556652f33?auto=format&fit=crop&w=600&q=80';
          }}
        />
        

        {/* Floating Reading Time Badge */}
        <span className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white text-[10px] font-extrabold px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow-sm">
          <Clock className="size-3 text-[#f97316]" />
          {readingTime} {locale === 'tr' ? 'dk okuma' : 'min read'}
        </span>
      </div>

      {/* Card Content Details */}
      <div className="p-6 flex flex-col flex-grow">
        {/* Date line */}
        {dateStr && (
          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 mb-2.5">
            <Calendar className="size-3.5 text-[#f97316]" />
            {dateStr}
          </span>
        )}

        {/* Title */}
        <h3 className="text-lg font-black text-zinc-900 dark:text-white leading-snug tracking-tight group-hover:text-[#f97316] transition-colors duration-200 line-clamp-2">
          {title}
        </h3>

        {/* Excerpt Summary */}
        {summary && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2.5 line-clamp-2 font-medium leading-relaxed flex-grow">
            {summary}
          </p>
        )}

        {/* Read More button trigger on bottom */}
        <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#f97316] mt-5 group-hover:text-[#ea580c] transition-colors">
          <span>{locale === 'tr' ? 'Devamını Oku' : 'Read More'}</span>
          <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}
