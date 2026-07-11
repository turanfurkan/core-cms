'use client';

import * as React from 'react';
import Link from 'next/link';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
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
  const readingTime = data.reading_time || item.reading_time || '5';

  // Try resolving cover image URL
  let coverUrl = '/media/previews/placeholder.png';
  if (data.cover_image && typeof data.cover_image === 'object') {
    coverUrl = data.cover_image.url || coverUrl;
  } else if (item.cover_image && typeof item.cover_image === 'object') {
    coverUrl = item.cover_image.url || coverUrl;
  } else {
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
    ? new Date(item.published_at || item.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  const categoriesList = item.categories || data.categories || [];
  const resolvedSlug = getLocalized(data.slug || item.slug || '', locale);
  const detailUrl = `/${item.content_type?.slug || 'posts'}/${resolvedSlug}`;
  const RootComponent = previewOnly ? 'div' : Link;

  return (
    <RootComponent
      href={previewOnly ? undefined : detailUrl}
      className={cn(
        "group flex flex-col h-full rounded-2xl overflow-hidden border border-zinc-200/60 dark:border-white/5 bg-white dark:bg-[#0b1428] shadow-xs hover:shadow-md dark:hover:border-zinc-700/60 transition-all duration-300 hover:-translate-y-1.5 cursor-pointer",
        previewOnly ? "pointer-events-none" : ""
      )}
    >
      {/* Aspect Ratio Image Container */}
      <div className="relative aspect-[16/10] overflow-hidden bg-muted shrink-0">
        <img
          src={resolvedCoverUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-104"
          onError={(e) => {
            e.target.src = '/media/previews/placeholder.png';
          }}
        />

        {/* Floating Reading Time Badge */}
        {readingTime && (
          <span className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white text-[10px] font-extrabold px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow-sm">
            <Clock className="size-3 text-primary" />
            {readingTime} {locale === 'tr' ? 'dk okuma' : 'min read'}
          </span>
        )}
      </div>

      {/* Card Content Details */}
      <div className="p-6 flex flex-col flex-grow">
        {/* Date Row */}
        {date && (
          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 mb-2.5">
            <Calendar className="size-3.5 text-primary" />
            {date}
          </span>
        )}

        {/* Title */}
        <h3 className="text-base font-black text-zinc-900 dark:text-white leading-snug tracking-tight group-hover:text-primary transition-colors duration-200 line-clamp-2 text-left">
          {title}
        </h3>

        {/* Excerpt Summary */}
        {summary && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2.5 line-clamp-2 font-medium leading-relaxed flex-grow text-left">
            {summary}
          </p>
        )}

        {/* Read More link */}
        <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-primary mt-5 group-hover:text-primary/80 transition-colors">
          <span>{locale === 'tr' ? 'DEVAMINI OKU' : 'READ MORE'}</span>
          <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" />
        </div>
      </div>
    </RootComponent>
  );
}
