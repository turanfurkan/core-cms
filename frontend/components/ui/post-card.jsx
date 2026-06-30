'use client';

import * as React from 'react';
import Link from 'next/link';
import { Calendar, Clock, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// Helper to get localized values
function getLocalized(val, locale = 'tr') {
  if (val && typeof val === 'object') {
    return val[locale] || val['tr'] || val['en'] || Object.values(val)[0] || '';
  }
  return val || '';
}

export function PostCard({ item, previewOnly = false, locale = 'tr' }) {
  if (!item) return null;

  const data = item.data || {};
  const title = getLocalized(data.title || item.title || '', locale) || 'Başlıksız';
  const summary = getLocalized(data.summary || data.description || '', locale);
  const author = data.author || 'Administrator';
  const readingTime = data.reading_time || item.reading_time || '5';

  // Try resolving cover image URL
  let coverUrl = '/media/previews/placeholder.png';
  if (data.cover_image && typeof data.cover_image === 'object') {
    coverUrl = data.cover_image.url || coverUrl;
  } else if (item.cover_image && typeof item.cover_image === 'object') {
    coverUrl = item.cover_image.url || coverUrl;
  } else {
    // Look for any media attachment inside JSON data
    const mediaFields = [];
    Object.entries(data).forEach(([k, v]) => {
      if (v && typeof v === 'object' && v.url) {
        mediaFields.push(v);
      } else if (Array.isArray(v) && v.length > 0 && v[0] && typeof v[0] === 'object' && v[0].url) {
        mediaFields.push(...v);
      }
    });
    const foundImage = mediaFields.find(m => m.mime_type?.startsWith('image/'));
    if (foundImage) {
      coverUrl = foundImage.url;
    }
  }

  const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
  const fullCoverUrl = coverUrl.startsWith('http') || coverUrl.startsWith('/') ? coverUrl : `${backendUrl}${coverUrl}`;
  const resolvedCoverUrl = fullCoverUrl.startsWith('/') && !fullCoverUrl.startsWith('//') ? `${backendUrl}${fullCoverUrl}` : fullCoverUrl;

  const date = item.published_at || item.created_at
    ? new Date(item.published_at || item.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  // Categories resolution
  const categoriesList = item.categories || data.categories || [];

  const detailUrl = `/${item.content_type?.slug || 'post'}/${item.slug}`;
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
        {/* Categories Overlays */}
        {categoriesList.length > 0 && (
          <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5 max-w-[80%]">
            {categoriesList.slice(0, 2).map((cat, idx) => {
              const catName = getLocalized(cat.name || cat.title || '', locale);
              return (
                <Badge
                  key={cat.id || idx}
                  className="bg-background/90 hover:bg-background/90 text-foreground border border-border text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 shadow-sm rounded-lg"
                >
                  {catName}
                </Badge>
              );
            })}
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

      {/* Content Details */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div className="space-y-3">
          {/* Metadata Row */}
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground/75 font-semibold uppercase tracking-wider">
            {date && (
              <span className="flex items-center gap-1">
                <Calendar className="size-3 text-muted-foreground/45 shrink-0" />
                {date}
              </span>
            )}
            {date && readingTime && <span className="text-muted-foreground/30">•</span>}
            {readingTime && (
              <span className="flex items-center gap-1">
                <Clock className="size-3 text-muted-foreground/45 shrink-0" />
                {readingTime} Dk Okuma
              </span>
            )}
          </div>

          {/* Title */}
          <h4 className="font-black text-sm sm:text-base text-zinc-900 dark:text-zinc-50 line-clamp-2 leading-snug group-hover:text-primary transition-colors text-left">
            {title}
          </h4>

          {/* Excerpt */}
          {summary && (
            <p className="text-muted-foreground text-xs line-clamp-2 leading-relaxed text-left">
              {summary}
            </p>
          )}
        </div>

        {/* Footer info row */}
        <div className="flex items-center justify-between border-t border-border/50 pt-3.5 mt-auto">
          <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider">
            Yazar: {author}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-black text-primary uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Devamını Oku <ArrowUpRight className="size-3.5" />
          </span>
        </div>
      </div>
    </RootComponent>
  );
}
