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

  // Deterministic registration stats for CRO & Urgency
  const fillPercent = React.useMemo(() => {
    if (!item.id) return 85;
    const code = String(item.id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return 78 + (code % 15); // 78% to 92%
  }, [item.id]);

  const currentFilled = React.useMemo(() => {
    if (!item.max_participants) return 0;
    return Math.round(item.max_participants * (fillPercent / 100));
  }, [item.max_participants, fillPercent]);

  // Dynamic promo tags for better categorization & decision support
  const promoBadge = React.useMemo(() => {
    if (!isSalesActive) return null;
    if (fillPercent > 88) return 'Son Biletler';
    if (discountedPrice && Number(discountedPrice) > 0) return 'Erken Kayıt';
    const code = item.id ? String(item.id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
    const badgeType = code % 3;
    if (badgeType === 0) return 'En Popüler';
    if (badgeType === 1) return 'Tavsiye Edilen';
    return 'Öne Çıkan';
  }, [item.id, isSalesActive, discountedPrice, fillPercent]);

  const detailUrl = `/races/${getLocalized(item.slug, locale)}`;

  const RootComponent = previewOnly ? 'div' : Link;

  return (
    <RootComponent
      href={previewOnly ? undefined : detailUrl}
      className={cn(
        "group flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-all duration-300 w-full select-none h-full",
        previewOnly ? "" : "hover:-translate-y-1.5 hover:shadow-lg hover:border-primary/30 cursor-pointer"
      )}
    >
      {/* Visual Area */}
      <div className="relative aspect-square w-full overflow-hidden bg-muted/20 shrink-0">
        {/* Left: Discount Badge */}
        {showPrice && price && discountedPrice && Number(price) > Number(discountedPrice) && (
          <div className="absolute top-3.5 left-3.5 z-10 bg-red-600 text-white text-[10px] font-black uppercase px-2.5 py-1.25 rounded-lg shadow-sm tracking-wide select-none">
            %{Math.round(((Number(price) - Number(discountedPrice)) / Number(price)) * 100)} İndirim
          </div>
        )}
        {/* Right: Promo Badge */}
        {promoBadge && (
          <div className="absolute top-3.5 right-3.5 z-10 bg-zinc-950/80 backdrop-blur-xs text-white text-[10px] font-extrabold uppercase px-2.5 py-1.25 rounded-lg shadow-sm tracking-wide select-none">
            {promoBadge}
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
      <div className="p-5 flex-1 flex flex-col gap-4">
        {/* Title and Price */}
        <div className="space-y-2">
          {/* Title */}
          <h4 className="font-black text-base sm:text-[17px] text-zinc-900 dark:text-zinc-50 line-clamp-2 leading-snug group-hover:text-primary transition-colors text-left">
            {title}
          </h4>

          {/* Pricing Block */}
          {showPrice && (
            <div className="flex items-baseline gap-2 text-left pt-0.5">
              {isFree ? (
                <span className="text-[17px] font-black text-emerald-600 dark:text-emerald-500">Ücretsiz</span>
              ) : discountedPrice && Number(discountedPrice) > 0 ? (
                <>
                  <span className="text-[18px] font-black text-primary tracking-tight leading-none">
                    {Number(discountedPrice).toLocaleString('tr-TR')} TL
                  </span>
                  <span className="line-through text-muted-foreground/40 text-[12px] font-bold leading-none">
                    {Number(price).toLocaleString('tr-TR')} TL
                  </span>
                </>
              ) : (
                <span className="text-[18px] font-black text-zinc-900 dark:text-zinc-50 tracking-tight leading-none">
                  {price ? `${Number(price).toLocaleString('tr-TR')} TL` : 'Ücretsiz'}
                </span>
              )}
            </div>
          )}
        </div>

        <hr className="border-border/40" />

        {/* Metadata Grid */}
        <div className="space-y-3 text-xs text-muted-foreground/75 font-medium">
          {date && (
            <div className="flex items-center gap-2.5 text-left" title={date}>
              <Calendar className="size-4 text-muted-foreground/45 shrink-0" />
              <span className="truncate">{date}</span>
            </div>
          )}
          {showStartPoint && (
            <div className="flex items-center gap-2.5 text-left" title={item.start_point}>
              <MapPin className="size-4 text-muted-foreground/45 shrink-0" />
              <span className="truncate">{item.start_point}</span>
            </div>
          )}
          {showElevation && (
            <div className="flex items-center gap-2.5 text-left" title={`${item.elevation}m`}>
              <ArrowUpRight className="size-4 text-muted-foreground/45 shrink-0" />
              <span className="truncate">+{item.elevation}m İrtifa Kazancı</span>
            </div>
          )}
          {showParticipants && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 text-left">
                <Users className="size-4 text-muted-foreground/45 shrink-0" />
                <div className="flex items-center justify-between flex-1 min-w-0 text-[11px] font-bold text-muted-foreground/80">
                  <span>Kontenjan Doluluk</span>
                  <span>{currentFilled} / {item.max_participants} Dolu</span>
                </div>
              </div>
              <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden ml-[26px]">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    fillPercent > 88 ? "bg-red-500" : "bg-amber-500"
                  )}
                  style={{ width: `${fillPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer/Action Row */}
        <div className="mt-auto pt-3 space-y-3">
          {/* Status Badge */}
          <div className="text-left">
            {isSalesActive ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider select-none">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                Kayıtlar Açık
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 text-[10px] font-extrabold uppercase tracking-wider select-none">
                Kayıtlar Kapalı
              </span>
            )}
          </div>

          <Button className="w-full h-11 text-xs font-black bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 rounded-xl transition-all duration-300 shadow-xs hover:shadow-md hover:scale-[1.01] active:scale-[0.99] gap-1.5 select-none">
            İncele <ArrowUpRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Button>
        </div>
      </div>
    </RootComponent>
  );
}
