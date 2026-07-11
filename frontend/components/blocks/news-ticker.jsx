'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Megaphone } from 'lucide-react';

function getLocalized(val, locale = 'tr') {
  if (val && typeof val === 'object') {
    return val[locale] || val['tr'] || val['en'] || Object.values(val)[0] || '';
  }
  return val || '';
}

export default function NewsTicker({ data, locale = 'tr' }) {
  const block = data || {};
  const content = block.content || block.data || {};
  const styles = block.styles || {};

  const label = getLocalized(content.label, locale) || (locale === 'tr' ? 'SON DAKİKA' : 'BREAKING NEWS');
  const sourceType = content.source_type || 'manual';
  const targetContentTypeId = content.target_content_type_id || 'posts';
  const targetItemIds = content.target_item_ids || [];

  // Speed and colors
  const speed = styles.speed || '25';
  const bgColor = styles.bg_color || '#03112b';
  const textColor = styles.text_color || '#ffffff';
  const badgeBg = styles.badge_bg || '#f97316';
  const badgeTextColor = styles.badge_text || '#ffffff';
  const direction = styles.direction || 'left';
  const paddingTop = styles.paddingTop ? `${styles.paddingTop}px` : '12px';
  const paddingBottom = styles.paddingBottom ? `${styles.paddingBottom}px` : '12px';

  // Get scrolling items list
  const tickerItems = useMemo(() => {
    if (sourceType === 'dynamic') {
      const rawItems = block.hydrated_data || [];
      const filtered = Array.isArray(targetItemIds) && targetItemIds.length > 0
        ? rawItems.filter(item => targetItemIds.some(id => String(id) === String(item.id)))
        : rawItems;

      return filtered.map(item => {
        // Resolve dynamic item title
        const rawTitle = item.title || item.name || '';
        const titleText = typeof rawTitle === 'object' && rawTitle !== null
          ? rawTitle[locale] || rawTitle['tr'] || rawTitle['en'] || ''
          : rawTitle;

        // Resolve slug path
        const rawSlug = item.slug || '';
        const slugText = typeof rawSlug === 'object' && rawSlug !== null
          ? rawSlug[locale] || rawSlug['tr'] || rawSlug['en'] || ''
          : rawSlug;

        return {
          id: item.id,
          text: titleText,
          href: slugText ? `/${targetContentTypeId}/${slugText}` : null
        };
      });
    } else {
      const manualItems = content.items || [];
      return manualItems.map((item, idx) => {
        const textVal = typeof item === 'object' && item !== null
          ? item[locale] || item['tr'] || item['en'] || ''
          : item;
        return {
          id: `manual-${idx}`,
          text: textVal,
          href: null
        };
      }).filter(item => item.text.trim().length > 0);
    }
  }, [sourceType, targetContentTypeId, targetItemIds, content.items, block.hydrated_data, locale]);

  // If no items, render a dummy/placeholder to guide the page builder user
  if (tickerItems.length === 0) {
    return (
      <div className="w-full py-4 text-center text-xs font-semibold bg-zinc-100 dark:bg-zinc-900 text-muted-foreground border border-dashed border-zinc-200 dark:border-zinc-800 select-none">
        {locale === 'tr' ? 'Haber bandında gösterilecek duyuru bulunamadı. Lütfen ayarları kontrol edin.' : 'No announcements found to display in the news ticker.'}
      </div>
    );
  }

  // Duplicate items to ensure a seamless infinite scrolling animation loop
  const duplicatedItems = [...tickerItems, ...tickerItems, ...tickerItems];

  const inlineStyles = {
    '--speed': `${speed}s`,
    backgroundColor: bgColor,
    color: textColor,
    paddingTop,
    paddingBottom,
  };

  return (
    <div 
      className="relative z-20 w-full overflow-hidden flex items-center shadow-[0_4px_20px_rgba(0,0,0,0.15)] select-none border-t border-white/5 border-b-2" 
      style={{
        ...inlineStyles,
        borderBottomColor: badgeBg
      }}
    >
      <style>{`
        @keyframes ticker-scroll-left {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-33.333%, 0, 0); }
        }
        @keyframes ticker-scroll-right {
          0% { transform: translate3d(-33.333%, 0, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
        .animate-ticker-left {
          animation: ticker-scroll-left var(--speed, 25s) linear infinite;
        }
        .animate-ticker-right {
          animation: ticker-scroll-right var(--speed, 25s) linear infinite;
        }
        .ticker-wrapper:hover .ticker-scroll-container {
          animation-play-state: paused;
        }
      `}</style>

      {/* Left Badge: Slanted and glowing */}
      <div 
        style={{ backgroundColor: badgeBg, color: badgeTextColor }}
        className="relative z-10 shrink-0 font-black text-[11px] uppercase tracking-wider pl-4 pr-6 py-2 flex items-center gap-2 shadow-[4px_0_12px_rgba(0,0,0,0.5)] select-none before:absolute before:right-0 before:top-0 before:bottom-0 before:w-4 before:bg-inherit before:origin-top-right before:skew-x-12"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
        </span>
        <Megaphone className="size-3.5" />
        <span>{label}</span>
      </div>

      {/* Ticker Content Window */}
      <div className="relative w-full overflow-hidden ticker-wrapper flex items-center">
        {/* Shadow overlays for smooth fading edges */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/20 to-transparent pointer-events-none z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/20 to-transparent pointer-events-none z-10" />

        <div 
          className={`flex items-center gap-12 whitespace-nowrap ticker-scroll-container ${
            direction === 'right' ? 'animate-ticker-right' : 'animate-ticker-left'
          }`}
        >
          {duplicatedItems.map((item, index) => {
            const contentNode = (
              <span className="flex items-center gap-3 font-semibold text-xs sm:text-sm select-none tracking-wide text-zinc-100 hover:text-amber-400 transition-colors duration-200">
                <span className="text-amber-400">•</span>
                <span>{item.text}</span>
              </span>
            );

            if (item.href) {
              return (
                <Link 
                  key={`${item.id}-${index}`} 
                  href={item.href}
                  className="cursor-pointer"
                >
                  {contentNode}
                </Link>
              );
            }

            return (
              <span key={`${item.id}-${index}`}>
                {contentNode}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
