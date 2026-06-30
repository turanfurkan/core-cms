'use client';

import * as React from 'react';
import Link from 'next/link';
import { Image as ImageIcon, Calendar, MapPin, ArrowUpRight, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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

  const showElevation = item.elevation && Number(item.elevation) > 0;
  const showParticipants = item.max_participants && Number(item.max_participants) > 0;
  const showStartPoint = item.start_point && item.start_point.trim().length > 0;

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
      <div className="relative aspect-square w-full overflow-hidden bg-muted/20 shrink-0">
        {showPrice && price && discountedPrice && Number(price) > Number(discountedPrice) && (
          <div className="absolute top-3 left-3 z-10 bg-red-600 dark:bg-red-500 text-white text-[10px] font-black uppercase px-2.5 py-1.25 rounded-lg shadow-sm tracking-wide select-none">
            %{Math.round(((Number(price) - Number(discountedPrice)) / Number(price)) * 100)} İndirim
          </div>
        )}
        <img
          src={resolvedCoverUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
          onError={(e) => {
            e.target.src = '/media/previews/placeholder.png';
          }}
        />
      </div>

      {/* Content details */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div className="space-y-3">
          {/* Title */}
          <h4 className="font-black text-sm sm:text-[15px] text-zinc-900 dark:text-zinc-50 line-clamp-2 leading-snug group-hover:text-primary transition-colors text-left">
            {title}
          </h4>

          {/* Metadata Grid */}
          <div className="flex flex-col gap-1.5 pt-0.5 text-xs text-muted-foreground/75 font-medium">
            {date && (
              <div className="flex items-center gap-2 text-left" title={date}>
                <Calendar className="size-3.5 text-muted-foreground/40 shrink-0" />
                <span className="truncate">{date}</span>
              </div>
            )}
            {showStartPoint && (
              <div className="flex items-center gap-2 text-left" title={item.start_point}>
                <MapPin className="size-3.5 text-muted-foreground/40 shrink-0" />
                <span className="truncate">{item.start_point}</span>
              </div>
            )}
            {showElevation && (
              <div className="flex items-center gap-2 text-left" title={`${item.elevation}m`}>
                <ArrowUpRight className="size-3.5 text-muted-foreground/40 shrink-0" />
                <span className="truncate">+{item.elevation}m İrtifa Kazancı</span>
              </div>
            )}
            {showParticipants && (
              <div className="flex items-center gap-2 text-left" title={`${item.max_participants} Kişi`}>
                <Users className="size-3.5 text-muted-foreground/40 shrink-0" />
                <span className="truncate">{item.max_participants} Kişilik Kontenjan</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer/Action Row */}
        <div className="flex items-end justify-between mt-auto pt-2">
          <div className="flex flex-col gap-0.5 text-left select-none">
            {/* Price */}
            {showPrice && (
              <div>
                {isFree ? (
                  <span className="text-sm font-black text-green-600">Ücretsiz</span>
                ) : discountedPrice && Number(discountedPrice) > 0 ? (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-primary font-black text-base tracking-tight">{Number(discountedPrice).toLocaleString('tr-TR')} TL</span>
                    <span className="line-through text-muted-foreground/45 text-xs font-bold">{Number(price).toLocaleString('tr-TR')} TL</span>
                  </div>
                ) : (
                  <span className="text-zinc-900 dark:text-zinc-50 font-black text-base tracking-tight">
                    {price ? `${Number(price).toLocaleString('tr-TR')} TL` : 'Ücretsiz'}
                  </span>
                )}
              </div>
            )}

            {/* Status */}
            {isSalesActive ? (
              <span className="text-[9px] font-extrabold text-green-600 uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                </span>
                Kayıtlar Açık
              </span>
            ) : (
              <span className="text-[9px] font-extrabold text-muted-foreground/60 uppercase tracking-wider mt-0.5">
                Kayıtlar Kapalı
              </span>
            )}
          </div>

          <Button size="sm" className="font-extrabold gap-1.5 h-8 rounded-xl shrink-0 select-none">
            İncele <ArrowUpRight className="size-3.5 shrink-0" />
          </Button>
        </div>
      </div>
    </RootComponent>
  );
}
