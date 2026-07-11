'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, ArrowRight, Hourglass } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function RaceCard({ item, index }) {
  const originalItem = item.item || {};
  
  // Resolve title and description
  const title = item.title || 'Etkinlik Başlığı';
  const desc = item.desc || 'Etkinlik detayları ve parkur açıklaması.';
  
  // Resolve cover image url
  let coverUrl = 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=600&q=80'; // fallback
  if (originalItem.cover_image && typeof originalItem.cover_image === 'object') {
    coverUrl = originalItem.cover_image.url || coverUrl;
  } else if (originalItem.image && typeof originalItem.image === 'object') {
    coverUrl = originalItem.image.url || coverUrl;
  }
  
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000';
  const resolvedCoverUrl = coverUrl.startsWith('http') || coverUrl.startsWith('/') 
    ? (coverUrl.startsWith('/') && !coverUrl.startsWith('//') ? `${backendUrl}${coverUrl}` : coverUrl) 
    : `${backendUrl}/${coverUrl}`;

  // Countdown timer logic
  // Resolve target date (default to 30 days from now if not present)
  const targetDateStr = React.useMemo(() => {
    if (originalItem.start_date) return originalItem.start_date;
    const fallback = new Date();
    fallback.setDate(fallback.getDate() + 30 + index * 5); // offset slightly per card index
    return fallback.toISOString();
  }, [originalItem.start_date, index]);

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

  const detailUrl = originalItem.slug ? `/races/${originalItem.slug}` : '#';

  return (
    <div className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-all duration-300 w-full h-full hover:-translate-y-1.5 hover:shadow-md hover:border-primary/20">
      {/* Cover Image Area */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/20 shrink-0">
        <img
          src={resolvedCoverUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=600&q=80';
          }}
        />

        {/* Live Indicator Badges */}
        {originalItem.is_sales_active !== false && !timeLeft.isCompleted && (
          <span className="absolute top-3 left-3 z-10 text-[9px] font-extrabold bg-green-600/90 text-white backdrop-blur-xs uppercase tracking-wider px-2 py-1 rounded-md flex items-center gap-1.5 shadow-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
            </span>
            Kayıtlar Açık
          </span>
        )}

        {/* Glassmorphic Floating Countdown Banner */}
        <div className="absolute bottom-0 left-0 right-0 bg-zinc-950/75 backdrop-blur-md py-2.5 px-2 border-t border-white/10 flex justify-around text-center text-white select-none">
          {timeLeft.isCompleted ? (
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-red-400 flex items-center justify-center gap-1.5 py-1 w-full select-none">
              <Hourglass className="size-3.5" /> YARIŞ SONA ERDİ
            </div>
          ) : (
            <>
              <div>
                <span className="block font-black text-sm sm:text-base leading-none text-white tracking-tight">{String(timeLeft.days).padStart(2, '0')}</span>
                <span className="block text-[8px] font-extrabold text-zinc-400 mt-1 uppercase tracking-widest">GÜN</span>
              </div>
              <div className="text-zinc-600 font-light select-none text-base sm:text-lg leading-none">:</div>
              <div>
                <span className="block font-black text-sm sm:text-base leading-none text-white tracking-tight">{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="block text-[8px] font-extrabold text-zinc-400 mt-1 uppercase tracking-widest">SAAT</span>
              </div>
              <div className="text-zinc-600 font-light select-none text-base sm:text-lg leading-none">:</div>
              <div>
                <span className="block font-black text-sm sm:text-base leading-none text-white tracking-tight">{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className="block text-[8px] font-extrabold text-zinc-400 mt-1 uppercase tracking-widest">DK</span>
              </div>
              <div className="text-zinc-600 font-light select-none text-base sm:text-lg leading-none">:</div>
              <div>
                <span className="block font-black text-sm sm:text-base leading-none text-emerald-400 tracking-tight">{String(timeLeft.seconds).padStart(2, '0')}</span>
                <span className="block text-[8px] font-extrabold text-zinc-400 mt-1 uppercase tracking-widest">SN</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Details / Text Box */}
      <div className="p-4.5 flex-1 flex flex-col justify-between gap-3.5">
        <div className="space-y-2">
          {/* Title */}
          <h4 className="font-extrabold text-sm sm:text-[15px] text-zinc-900 dark:text-zinc-50 line-clamp-2 leading-snug group-hover:text-primary transition-colors text-left">
            {title}
          </h4>

          {/* Description */}
          <p className="text-xs text-muted-foreground/80 line-clamp-2 text-left leading-relaxed">
            {desc}
          </p>
        </div>

        {/* Card Footer Row */}
        <div className="flex items-center justify-between border-t border-border/40 pt-3 mt-1">
          {/* Price / Distance Info */}
          <div className="flex flex-col text-left">
            {originalItem.distance && (
              <span className="text-[10px] font-bold text-primary/75 dark:text-zinc-400 uppercase tracking-wider">
                {originalItem.distance}
              </span>
            )}
            {originalItem.price ? (
              <span className="text-xs font-black text-zinc-900 dark:text-zinc-50 mt-0.5">
                {originalItem.discounted_price && Number(originalItem.discounted_price) > 0
                  ? `${Number(originalItem.discounted_price).toLocaleString('tr-TR')} TL`
                  : `${Number(originalItem.price).toLocaleString('tr-TR')} TL`}
              </span>
            ) : (
              <span className="text-xs font-black text-green-600 mt-0.5">
                Katılım Ücretsiz
              </span>
            )}
          </div>

          {/* Action Link Button */}
          <a
            href={detailUrl}
            className="flex items-center gap-1 text-[11px] font-extrabold text-primary dark:text-zinc-300 hover:gap-1.5 transition-all select-none"
          >
            Detaylar <ArrowRight className="size-3 shrink-0" />
          </a>
        </div>
      </div>
    </div>
  );
}
