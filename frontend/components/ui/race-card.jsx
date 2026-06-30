'use client';

import * as React from 'react';
import Link from 'next/link';
import { Image as ImageIcon, Calendar, MapPin, ArrowUpRight, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

// Helper to get localized values
function getLocalized(val, locale = 'tr') {
  if (val && typeof val === 'object') {
    return val[locale] || val['tr'] || val['en'] || Object.values(val)[0] || '';
  }
  return val || '';
}

export function RaceCard({ item, showPrice = true, previewOnly = false, locale = 'tr' }) {
  const title = getLocalized(item.title || item.name || '', locale);
  
  // Try resolving cover image URL
  let coverUrl = '/media/previews/placeholder.png';
  if (item.cover_image && typeof item.cover_image === 'object') {
    coverUrl = item.cover_image.url || coverUrl;
  } else if (item.image && typeof item.image === 'object') {
    coverUrl = item.image.url || coverUrl;
  }
  
  const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
  const fullCoverUrl = coverUrl.startsWith('http') || coverUrl.startsWith('/') ? coverUrl : `${backendUrl}${coverUrl}`;
  const resolvedCoverUrl = fullCoverUrl.startsWith('/') && !fullCoverUrl.startsWith('//') ? `${backendUrl}${fullCoverUrl}` : fullCoverUrl;

  const date = item.start_date
    ? new Date(item.start_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  const isFree = item.is_free;
  const price = item.price;
  const discountedPrice = item.discounted_price;
  const isSalesActive = item.is_sales_active !== false;

  const detailUrl = `/races/${getLocalized(item.slug, locale)}`;

  const RootComponent = previewOnly ? 'div' : Link;

  return (
    <RootComponent
      href={previewOnly ? undefined : detailUrl}
      className={cn(
        "group flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-all duration-300 w-full select-none h-full",
        previewOnly ? "" : "hover:-translate-y-1 hover:shadow-md hover:border-primary/20 cursor-pointer"
      )}
    >
      {/* Visual Area */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted/20 shrink-0">
        <img
          src={resolvedCoverUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
          onError={(e) => {
            e.target.src = '/media/previews/placeholder.png';
          }}
        />

        {/* Distance Badge */}
        {item.distance && (
          <div className="absolute bottom-3 left-3 px-2.5 py-0.5 rounded-md text-[9px] font-extrabold bg-primary text-primary-foreground tracking-wider uppercase shadow-xs">
            🏃 {item.distance}
          </div>
        )}

        {/* Price Overlay */}
        {showPrice && (
          <div className="absolute top-3 right-3 flex flex-col gap-1 items-end z-10 select-none">
            {isFree ? (
              <div className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-green-600/90 text-white shadow-xs">
                Ücretsiz
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-zinc-950/85 backdrop-blur-xs text-white shadow-md border border-white/5">
                {discountedPrice && Number(discountedPrice) > 0 ? (
                  <>
                    <span className="line-through text-white/50 text-[10px] font-medium">{Number(price).toFixed(0)} TL</span>
                    <span className="text-primary font-extrabold">{Number(discountedPrice).toFixed(0)} TL</span>
                  </>
                ) : (
                  <span>{price ? `${Number(price).toFixed(0)} TL` : 'Ücretsiz'}</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content details */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-4">
        <div className="space-y-2">
          {/* Title */}
          <h4 className="font-extrabold text-sm text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors text-left">
            {title}
          </h4>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 pt-1 text-[10px] text-muted-foreground/80 font-medium">
            {date && (
              <div className="flex items-center gap-1.5 truncate text-left" title={date}>
                <Calendar className="size-3 text-muted-foreground/50 shrink-0" />
                <span className="truncate">{date}</span>
              </div>
            )}
            {item.start_point && (
              <div className="flex items-center gap-1.5 truncate text-left" title={item.start_point}>
                <MapPin className="size-3 text-muted-foreground/50 shrink-0" />
                <span className="truncate">{item.start_point}</span>
              </div>
            )}
            {item.elevation && (
              <div className="flex items-center gap-1.5 truncate text-left" title={`${item.elevation}m`}>
                <ArrowUpRight className="size-3 text-muted-foreground/50 shrink-0" />
                <span className="truncate">+{item.elevation}m İrtifa</span>
              </div>
            )}
            {item.max_participants && (
              <div className="flex items-center gap-1.5 truncate text-left" title={`${item.max_participants} Kişi`}>
                <Users className="size-3 text-muted-foreground/50 shrink-0" />
                <span className="truncate">{item.max_participants} Kontenjan</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer/Action Row */}
        <div className="border-t border-border/40 pt-3 flex items-center justify-between mt-auto">
          {isSalesActive ? (
            <span className="text-[9px] font-extrabold text-green-600 uppercase tracking-wider flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
              </span>
              Kayıtlar Açık
            </span>
          ) : (
            <span className="text-[9px] font-extrabold text-muted-foreground/80 uppercase tracking-wider">
              Kayıtlar Kapalı
            </span>
          )}
          
          <span className="text-[10px] font-bold text-primary flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform duration-200">
            İncele <ArrowUpRight className="size-3 shrink-0" />
          </span>
        </div>
      </div>
    </RootComponent>
  );
}
