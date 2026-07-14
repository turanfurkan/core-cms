'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Trophy, BookOpen, Compass, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

// Helper to resolve localized fields
function getLocalized(val, locale = 'tr') {
  if (val && typeof val === 'object') {
    if (val[locale] !== undefined && val[locale] !== null) {
      return val[locale];
    }
    return val['tr'] || val['en'] || Object.values(val)[0] || '';
  }
  return val || '';
}

// Icon dictionary based on category type
const TYPE_ICONS = {
  race: Trophy,
  blog: BookOpen,
  post: BookOpen,
  general: Compass
};

// Sub-component for individual category card to manage stable countdown states
function CategoryCard({ cat, index, targetDateOverride, locale }) {
  const name = getLocalized(cat.name, locale);
  const slug = getLocalized(cat.slug, locale);

  // Resolve cover image url
  let imgUrl = 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=600&q=80'; // fallback
  if (cat.cover_image && typeof cat.cover_image === 'object') {
    imgUrl = cat.cover_image.url || imgUrl;
  }
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000';
  const resolvedImgUrl = imgUrl.startsWith('http') || imgUrl.startsWith('/') 
    ? (imgUrl.startsWith('/') && !imgUrl.startsWith('//') ? `${backendUrl}${imgUrl}` : imgUrl) 
    : `${backendUrl}/${imgUrl}`;

  const IconComp = TYPE_ICONS[cat.type] || Compass;
  const isPost = cat.type === 'post' || cat.type === 'blog';
  const count = isPost ? (cat.posts_count || 0) : (cat.races_count || 0);
  const countLabel = isPost ? 'Yazı' : 'Yarış';

  // Determine target date
  // 1. Manual date override
  // 2. Dynamic upcoming race start date
  // 3. Earliest race date fallback
  // 4. Fallback date (30 days from now)
  const targetDateStr = React.useMemo(() => {
    if (targetDateOverride) return targetDateOverride;
    if (cat.countdown_race_date) return cat.countdown_race_date;
    if (cat.earliest_race_date) return cat.earliest_race_date;
    
    const fallback = new Date();
    fallback.setDate(fallback.getDate() + 30 + index * 5);
    return fallback.toISOString();
  }, [targetDateOverride, cat.countdown_race_date, cat.earliest_race_date, index]);

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isCompleted: false
  });

  useEffect(() => {
    const targetTime = new Date(targetDateStr).getTime();
    
    const calculateTime = () => {
      const now = new Date().getTime();
      const difference = targetTime - now;
      
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isCompleted: true });
        return;
      }
      
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      setTimeLeft({ days, hours, minutes, seconds, isCompleted: false });
    };
    
    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDateStr]);

  const detailUrl = isPost ? `/blog/${slug}` : `/yarislar/${slug}`;

  return (
    <Link
      href={detailUrl}
      className="group relative w-[280px] shrink-0 snap-start sm:w-full rounded-2xl overflow-hidden border border-border bg-card shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:shadow-md hover:border-primary/20 flex flex-col"
    >
      {/* Top Part: Image Container */}
      <div className="relative w-full aspect-square overflow-hidden bg-muted">
        <img
          src={resolvedImgUrl}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=600&q=80';
          }}
        />

        {/* Floating type badge on top of image */}
        <span className="absolute top-3 right-3 z-10 text-xs font-extrabold bg-primary text-white px-3 py-1.5 rounded-lg shadow-sm border border-orange-600/20 flex items-center gap-1.5 select-none transition-all duration-300">
          <IconComp className="size-3.5 text-white" />
          <span>{count} {countLabel.toUpperCase()}</span>
        </span>
      </div>

      {/* Bottom Part: Countdown Banner (Underneath Image) */}
      <div className="w-full bg-zinc-950 dark:bg-zinc-900/90 py-3 px-2 border-t border-border/40 flex flex-col justify-center items-center text-white select-none shrink-0 min-h-20">
        <div className="text-xs font-black text-amber-400 dark:text-amber-400 tracking-wider mb-2 uppercase truncate max-w-[95%] text-center select-none">
          {targetDateOverride ? 'ÖZEL ETKİNLİK' : (cat.countdown_race_name ? getLocalized(cat.countdown_race_name, locale) : name)}
        </div>

        <div className="w-full flex justify-around items-center">
          {timeLeft.isCompleted ? (
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-red-400 flex items-center justify-center gap-1.5 py-1 w-full select-none">
              YARIŞLAR SONA ERDİ
            </div>
          ) : (
            <>
              <div>
                <span className="block font-black text-sm sm:text-base leading-none text-white tracking-tight">{String(timeLeft.days).padStart(2, '0')}</span>
                <span className="block text-[8px] font-extrabold text-zinc-400 mt-1 uppercase tracking-widest">GÜN</span>
              </div>
              <div className="text-zinc-700 dark:text-zinc-600 font-light select-none text-base sm:text-lg leading-none">:</div>
              <div>
                <span className="block font-black text-sm sm:text-base leading-none text-white tracking-tight">{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="block text-[8px] font-extrabold text-zinc-400 mt-1 uppercase tracking-widest">SAAT</span>
              </div>
              <div className="text-zinc-700 dark:text-zinc-600 font-light select-none text-base sm:text-lg leading-none">:</div>
              <div>
                <span className="block font-black text-sm sm:text-base leading-none text-white tracking-tight">{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className="block text-[8px] font-extrabold text-zinc-400 mt-1 uppercase tracking-widest">DK</span>
              </div>
              <div className="text-zinc-700 dark:text-zinc-600 font-light select-none text-base sm:text-lg leading-none">:</div>
              <div>
                <span className="block font-black text-sm sm:text-base leading-none text-emerald-400 tracking-tight">{String(timeLeft.seconds).padStart(2, '0')}</span>
                <span className="block text-[8px] font-extrabold text-zinc-400 mt-1 uppercase tracking-widest">SN</span>
              </div>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function CategoriesGrid({ data, locale = 'tr' }) {
  const fields = data?.content || data?.data || {};
  const styles = data?.styles || {};

  const title = getLocalized(fields.section_title, locale);
  const subtitle = getLocalized(fields.section_subtitle, locale);

  const gap = styles.gap || '24';
  const customDates = fields.custom_dates || {};

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const targetItemIds = fields.target_item_ids || [];

  useEffect(() => {
    let active = true;
    
    const loadCategories = async () => {
      try {
        const res = await fetch('/api/public/categories', { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (active) {
            const rawCategories = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
            
            // Filter by active status and targetItemIds if specified
            const filteredCategories = rawCategories.filter(cat => {
              const isActive = cat.is_active === true || cat.is_active === 1 || cat.is_active === "1";
              if (!isActive) return false;
              
              if (Array.isArray(targetItemIds) && targetItemIds.length > 0) {
                return targetItemIds.some(id => String(id) === String(cat.id));
              }
              return true;
            });

            // Sort: active countdowns (time in future) first, then completed ones (time in past/empty)
            const nowTime = new Date().getTime();
            const sortedCategories = [...filteredCategories].sort((a, b) => {
              const dateAStr = customDates[a.id] || a.countdown_race_date || a.earliest_race_date;
              const dateBStr = customDates[b.id] || b.countdown_race_date || b.earliest_race_date;

              const timeA = dateAStr ? new Date(dateAStr).getTime() : 0;
              const timeB = dateBStr ? new Date(dateBStr).getTime() : 0;

              const isExpiredA = timeA === 0 || timeA <= nowTime;
              const isExpiredB = timeB === 0 || timeB <= nowTime;

              if (isExpiredA !== isExpiredB) {
                return isExpiredA ? 1 : -1;
              }

              // Active: closest deadline first
              if (!isExpiredA) {
                return timeA - timeB;
              }

              // Expired/Completed: sort by database order
              return (a.order ?? 0) - (b.order ?? 0);
            });

            setCategories(sortedCategories);
          }
        }
      } catch (err) {
        console.error('Failed to load public categories:', err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadCategories();
    return () => {
      active = false;
    };
  }, [JSON.stringify(targetItemIds)]);

  // Filter out inactive categories and filter by type if configured
  const activeCategories = categories.filter(c => c.is_active !== false && (fields.type ? c.type === fields.type : true));

  // Columns layout selector with dynamic auto-fit/shrink logic
  const selectedColumns = parseInt(styles.columns || '4', 10);
  const activeColumnsCount = Math.min(selectedColumns, activeCategories.length || 1);
  const columns = String(activeColumnsCount);

  const colClass = {
    '1': 'grid-cols-1',
    '2': 'grid-cols-1 sm:grid-cols-2',
    '3': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    '4': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }[columns] || 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

  return (
    <section className="w-full py-16 bg-background relative overflow-hidden animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header section */}
        {(title || subtitle) && (
          <div className="text-center space-y-3 mb-12">
            {title && (
              <h2 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        )}

        <style>{`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>

        {/* Loading state skeleton grid */}
        {loading ? (
          <div 
            className={cn("flex overflow-x-auto pb-4 pt-1 px-4 -mx-4 no-scrollbar snap-x snap-mandatory sm:grid sm:px-0 sm:mx-0 sm:pb-0", colClass)} 
            style={{ gap: `${gap}px` }}
          >
            {[1, 2, 3, 4].map(idx => (
              <div key={idx} className="w-[280px] shrink-0 snap-start sm:w-full flex flex-col rounded-2xl overflow-hidden border border-border bg-card shadow-xs transition-all duration-300">
                <div className="aspect-square bg-muted/40 animate-pulse" />
                <div className="h-16 bg-muted/20 animate-pulse border-t border-border/30" />
              </div>
            ))}
          </div>
        ) : activeCategories.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-2xl bg-muted/10">
            <Layers className="size-8 text-muted-foreground/45 mx-auto mb-2.5" />
            <p className="text-xs font-semibold text-muted-foreground">Gösterilecek kategori bulunamadı.</p>
          </div>
        ) : (
          <div 
            className={cn("flex overflow-x-auto pb-4 pt-1 px-4 -mx-4 no-scrollbar snap-x snap-mandatory sm:grid sm:px-0 sm:mx-0 sm:pb-0", colClass)} 
            style={{ gap: `${gap}px` }}
          >
            {activeCategories.map((cat, index) => (
              <CategoryCard
                key={cat.id || index}
                cat={cat}
                index={index}
                targetDateOverride={customDates[cat.id]}
                locale={locale}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
