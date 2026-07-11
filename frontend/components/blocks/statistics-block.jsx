'use client';

import React, { useMemo } from 'react';
import { 
  Trophy, 
  Users, 
  Globe, 
  Heart, 
  Medal, 
  Star, 
  Calendar, 
  Flag, 
  Activity, 
  Shield 
} from 'lucide-react';

const STAT_ICONS = { 
  Trophy, 
  Users, 
  Globe, 
  Heart, 
  Medal, 
  Star, 
  Calendar, 
  Flag, 
  Activity, 
  Shield 
};

function getLocalized(val, locale = 'tr') {
  if (val && typeof val === 'object') {
    return val[locale] ?? '';
  }
  return val ?? '';
}

export default function StatisticsBlock({ data, locale = 'tr' }) {
  const block = data || {};
  const content = block.content || block.data || {};
  const styles = block.styles || {};

  const title = getLocalized(content.section_title, locale);
  const subtitle = getLocalized(content.section_subtitle, locale);

  const bgColor = styles.bg_color || '#03112b';
  const textColor = styles.text_color || '#ffffff';
  const accentColor = styles.accent_color || '#f97316';
  const cardStyle = styles.card_style || 'glass';
  const columns = parseInt(styles.columns || '4', 10);
  const paddingTop = styles.paddingTop ? `${styles.paddingTop}px` : '64px';
  const paddingBottom = styles.paddingBottom ? `${styles.paddingBottom}px` : '64px';

  const [dynamicCounts, setDynamicCounts] = React.useState(null);

  React.useEffect(() => {
    let active = true;
    const fetchCounts = async () => {
      try {
        const res = await fetch('/api/public/statistics/counts', { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (active && json.success) {
            setDynamicCounts(json.data);
          }
        }
      } catch (e) {
        console.error('Failed to fetch dynamic statistics:', e);
      }
    };
    fetchCounts();
    return () => { active = false; };
  }, []);

  const getDisplayNumber = (item) => {
    if (item.source && item.source !== 'manual' && dynamicCounts) {
      const count = dynamicCounts[item.source] ?? 0;
      const userNum = item.number || '';
      const suffix = userNum.replace(/[0-9.]/g, '');
      return `${count.toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US')}${suffix}`;
    }
    return item.number || '0';
  };

  const items = useMemo(() => {
    return Array.isArray(content.items) ? content.items : [];
  }, [content.items]);

  if (items.length === 0) {
    return (
      <div className="w-full py-8 text-center text-xs font-semibold bg-zinc-100 dark:bg-zinc-900 text-muted-foreground border border-dashed border-zinc-200 dark:border-zinc-800 select-none">
        {locale === 'tr' ? 'Gösterilecek istatistik verisi bulunamadı. Lütfen ayarları kontrol edin.' : 'No statistics data found to display.'}
      </div>
    );
  }

  // Grid columns class mapper
  const gridColClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }[columns] || 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

  const inlineStyles = {
    backgroundColor: bgColor,
    color: textColor,
    paddingTop,
    paddingBottom
  };

  return (
    <section 
      style={inlineStyles}
      className="relative w-full overflow-hidden select-none border-y border-white/5 z-10"
    >
      {/* Background gradients for depth */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 z-0" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-3xl pointer-events-none translate-y-1/2 z-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Side: Title & Subtitle */}
          {(title || subtitle) && (
            <div className="lg:col-span-5 text-center lg:text-left space-y-4">
              <div className="w-12 h-1 rounded-full mb-2 hidden lg:block" style={{ backgroundColor: accentColor }} />
              {title && (
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight uppercase" style={{ color: textColor }}>
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-sm sm:text-base text-zinc-300 dark:text-zinc-400 font-medium leading-relaxed">
                  {subtitle}
                </p>
              )}
              <div className="w-12 h-1 mx-auto rounded-full lg:hidden" style={{ backgroundColor: accentColor }} />
            </div>
          )}

          {/* Right Side: 2x2 grid of mini cards */}
          <div className={`${(title || subtitle) ? 'lg:col-span-7' : 'lg:col-span-12'} grid grid-cols-2 gap-4 w-full`}>
            {items.map((item, index) => {
              const itemLabel = getLocalized(item.label, locale);
              const IconComp = STAT_ICONS[item.icon] || Trophy;

              return (
                <div
                  key={index}
                  className={`group relative flex flex-col items-center text-center p-4 sm:p-5 rounded-2xl transition-all duration-300 hover:-translate-y-1 ${
                    cardStyle === 'glass'
                      ? 'bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20 shadow-lg'
                      : cardStyle === 'border'
                      ? 'border border-zinc-700/50 bg-transparent hover:border-zinc-500'
                      : 'bg-zinc-900/40 hover:bg-zinc-900/60'
                  }`}
                >
                  {/* Accent glow on hover */}
                  <div 
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      boxShadow: `0 8px 30px ${accentColor}12`,
                      border: `1px solid ${accentColor}20`
                    }}
                  />

                  {/* Circular Icon Wrapper */}
                  <div 
                    className="size-10 rounded-full flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110 shadow-inner"
                    style={{
                      backgroundColor: `${accentColor}15`,
                      color: accentColor
                    }}
                  >
                    <IconComp className="size-5 stroke-[2]" />
                  </div>

                  {/* Stat Big Number */}
                  <span 
                    className="block font-black text-3xl sm:text-4xl tracking-tight mb-1 select-none uppercase"
                    style={{ color: textColor }}
                  >
                    {getDisplayNumber(item)}
                  </span>

                  {/* Stat Label */}
                  <span 
                    className="block text-xs font-black uppercase tracking-wider text-center"
                    style={{ color: accentColor }}
                  >
                    {itemLabel}
                  </span>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}
