'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Calendar, Clock, Trophy, MapPin, Sparkles, User, BadgeInfo, Eye, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// Helper to resolve localized fields
function getLocalized(val, locale = 'tr') {
  if (val && typeof val === 'object') {
    return val[locale] ?? '';
  }
  return val ?? '';
}

function RaceCard({ race, index, locale = 'tr', categorySlug }) {
  const title = getLocalized(race.title, locale);
  const description = getLocalized(race.description, locale);
  const slug = getLocalized(race.slug, locale);

  // Cover image resolution
  let imgUrl = 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=600&q=80'; // default fallback
  if (race.cover_image && typeof race.cover_image === 'object') {
    imgUrl = race.cover_image.url || imgUrl;
  }
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000';
  const resolvedImgUrl = imgUrl.startsWith('http') || imgUrl.startsWith('/') 
    ? (imgUrl.startsWith('/') && !imgUrl.startsWith('//') ? `${backendUrl}${imgUrl}` : imgUrl) 
    : `${backendUrl}/${imgUrl}`;

  // Parse start date & time for countdown
  const targetDateStr = useMemo(() => {
    if (!race.start_date) return '';
    // Format: YYYY-MM-DDTHH:MM:SS
    const timePart = race.start_time || '09:00:00';
    return `${race.start_date}T${timePart}`;
  }, [race.start_date, race.start_time]);

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isCompleted: true
  });

  useEffect(() => {
    if (!targetDateStr) return;
    const targetTime = new Date(targetDateStr).getTime();
    
    const calculateTime = () => {
      const now = new Date().getTime();
      const difference = targetTime - now;
      
      if (difference <= 0 || isNaN(difference)) {
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

  // Format date display (e.g. 18 Ekim 2025)
  const formattedDate = useMemo(() => {
    if (!race.start_date) return '';
    const dateObj = new Date(race.start_date);
    return dateObj.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }, [race.start_date, locale]);

  return (
    <div className="group relative rounded-2xl overflow-hidden border border-border bg-card shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:shadow-md hover:border-primary/20 flex flex-col h-full">
      
      {/* Top Part: Image Container */}
      <div className="relative w-full aspect-video overflow-hidden bg-muted">
        <img
          src={resolvedImgUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=600&q=80';
          }}
        />

        {/* Floating Distance Badge on top of image */}
        {race.distance && (
          <span className="absolute top-2.5 right-2.5 z-10 text-[10px] font-black bg-primary text-white px-2.5 py-1.5 rounded-lg shadow-sm border border-orange-600/20 flex items-center gap-1">
            <Trophy className="size-3 text-white" />
            <span>{parseFloat(race.distance)} KM</span>
          </span>
        )}
      </div>

      {/* Countdown Banner (Underneath Image) */}
      <div className="w-full bg-zinc-950 dark:bg-zinc-900/90 py-2.5 px-2 border-t border-border/40 flex flex-col justify-center items-center text-white select-none shrink-0 min-h-16">
        <div className="w-full flex justify-around items-center max-w-[240px]">
          {timeLeft.isCompleted ? (
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-red-400 flex items-center justify-center gap-1 py-1 w-full">
              YARIŞ SONA ERDİ
            </div>
          ) : (
            <>
              <div className="text-center">
                <span className="block font-black text-xs sm:text-sm leading-none text-white">{String(timeLeft.days).padStart(2, '0')}</span>
                <span className="block text-[8px] font-black text-zinc-500 mt-0.5 uppercase tracking-wider">GÜN</span>
              </div>
              <div className="text-zinc-700 dark:text-zinc-600 font-light text-sm leading-none">:</div>
              <div className="text-center">
                <span className="block font-black text-xs sm:text-sm leading-none text-white">{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="block text-[8px] font-black text-zinc-500 mt-0.5 uppercase tracking-wider">SAAT</span>
              </div>
              <div className="text-zinc-700 dark:text-zinc-600 font-light text-sm leading-none">:</div>
              <div className="text-center">
                <span className="block font-black text-xs sm:text-sm leading-none text-white">{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className="block text-[8px] font-black text-zinc-500 mt-0.5 uppercase tracking-wider">DK</span>
              </div>
              <div className="text-zinc-700 dark:text-zinc-600 font-light text-sm leading-none">:</div>
              <div className="text-center">
                <span className="block font-black text-xs sm:text-sm leading-none text-emerald-400">{String(timeLeft.seconds).padStart(2, '0')}</span>
                <span className="block text-[8px] font-black text-zinc-500 mt-0.5 uppercase tracking-wider">SN</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Body: Title and Details */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <h3 className="text-sm sm:text-base font-black tracking-tight text-zinc-900 dark:text-zinc-50 line-clamp-1 group-hover:text-primary transition-colors duration-200">
            {title}
          </h3>
          {description && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Info Grid Metadata */}
        <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 border-t border-zinc-100 dark:border-white/5 pt-3">
          {formattedDate && (
            <div className="flex items-center gap-1 truncate" title={formattedDate}>
              <Calendar className="size-3.5 text-zinc-400 shrink-0" />
              <span>{formattedDate}</span>
            </div>
          )}
          {race.start_time && (
            <div className="flex items-center gap-1">
              <Clock className="size-3.5 text-zinc-400 shrink-0" />
              <span>{race.start_time.slice(0, 5)}</span>
            </div>
          )}
          {(race.age_limit_min || race.age_limit_max) && (
            <div className="flex items-center gap-1">
              <User className="size-3.5 text-zinc-400 shrink-0" />
              <span>{race.age_limit_min ?? '18'}-{race.age_limit_max ?? '75'} Yaş</span>
            </div>
          )}
          {race.price && parseFloat(race.price) > 0 ? (
            <div className="flex items-center gap-1 text-zinc-800 dark:text-zinc-300 font-bold">
              <Sparkles className="size-3.5 text-amber-500 shrink-0" />
              <span>{parseFloat(race.price)} {race.currency || 'TRY'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
              <Sparkles className="size-3.5 text-emerald-500 shrink-0" />
              <span>Ücretsiz</span>
            </div>
          )}
        </div>

        {/* Card Action Buttons */}
        <div className="flex gap-2 pt-1 w-full">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="flex-1 text-[10px] sm:text-xs font-bold rounded-xl"
          >
            <Link href={categorySlug ? `/yarislar/${categorySlug}/${slug}` : `/yarislar/${slug}`} className="flex items-center justify-center gap-1.5 w-full">
              <Eye className="size-3.5 shrink-0" />
              <span>Detayları Gör</span>
            </Link>
          </Button>
          <Button
            asChild
            variant="primary"
            size="sm"
            className="flex-1 text-[10px] sm:text-xs font-extrabold rounded-xl shadow-sm shadow-orange-600/10"
          >
            <a
              href={race.settings?.registration_link || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 w-full"
            >
              <UserPlus className="size-3.5 shrink-0" />
              <span>Kayıt Ol</span>
            </a>
          </Button>
        </div>
      </div>

    </div>
  );
}

export default function RaceListGrid({ races = [], locale = 'tr', categorySlug }) {
  // Sort races: active countdown first, then by date order
  const sortedRaces = useMemo(() => {
    const nowTime = new Date().getTime();
    return [...races].sort((a, b) => {
      const timePartA = a.start_time || '09:00:00';
      const timePartB = b.start_time || '09:00:00';
      const timeA = a.start_date ? new Date(`${a.start_date}T${timePartA}`).getTime() : 0;
      const timeB = b.start_date ? new Date(`${b.start_date}T${timePartB}`).getTime() : 0;

      const isExpiredA = timeA === 0 || timeA <= nowTime;
      const isExpiredB = timeB === 0 || timeB <= nowTime;

      if (isExpiredA !== isExpiredB) {
        return isExpiredA ? 1 : -1;
      }

      if (!isExpiredA) {
        return timeA - timeB;
      }

      return (a.order ?? 0) - (b.order ?? 0);
    });
  }, [races]);

  if (!races || races.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-muted/10 max-w-lg mx-auto">
        <Trophy className="size-10 text-muted-foreground/35 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-50">Henüz yarış eklenmemiş.</h3>
        <p className="text-xs text-zinc-400 mt-1">Bu kategori altındaki yarış kayıtları yakında başlayacaktır.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {sortedRaces.map((race, index) => (
        <RaceCard 
          key={race.id || index} 
          race={race} 
          index={index} 
          locale={locale} 
          categorySlug={categorySlug}
        />
      ))}
    </div>
  );
}
