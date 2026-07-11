'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Calendar, Trophy, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

function getLocalized(val, locale = 'tr') {
  if (val && typeof val === 'object') {
    return val[locale] || val['tr'] || val['en'] || Object.values(val)[0] || '';
  }
  return val || '';
}

export default function SimilarRacesCarousel({ races = [], categorySlug, currentRaceId, locale = 'tr' }) {
  // Exclude current race
  const filteredRaces = races.filter(r => r.id !== currentRaceId);
  const scrollRef = useRef(null);

  if (filteredRaces.length === 0) return null;

  const scroll = (direction) => {
    if (scrollRef.current) {
      const card = scrollRef.current.querySelector('.snap-start');
      const cardWidth = card ? card.offsetWidth + 24 : 344;
      const currentScroll = scrollRef.current.scrollLeft;
      const targetScroll = direction === 'left' 
        ? currentScroll - cardWidth 
        : currentScroll + cardWidth;
      
      scrollRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="space-y-6 pt-12 border-t border-border/60">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-[10px] font-black text-primary uppercase tracking-wider">
            {locale === 'tr' ? 'KEŞFETMEYE DEVAM ET' : 'CONTINUE EXPLORING'}
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-[#03112b] dark:text-zinc-50 tracking-tight">
            {locale === 'tr' ? 'Benzer Yarışlar' : 'Similar Races'}
          </h3>
        </div>

        {/* Navigation buttons */}
        {filteredRaces.length > 3 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => scroll('left')}
              className="size-9 rounded-xl border border-border bg-card flex items-center justify-center text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-muted/50 transition-all cursor-pointer shadow-xs"
            >
              <ChevronLeft className="size-4.5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="size-9 rounded-xl border border-border bg-card flex items-center justify-center text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-muted/50 transition-all cursor-pointer shadow-xs"
            >
              <ChevronRight className="size-4.5" />
            </button>
          </div>
        )}
      </div>

      {/* Scrollable Container */}
      <div 
        ref={scrollRef}
        className="flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory pb-4 no-scrollbar scroll-smooth"
      >
        {filteredRaces.map((race, index) => {
          const title = getLocalized(race.title, locale);
          const slug = getLocalized(race.slug, locale);
          
          let imgUrl = 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=600&q=80';
          if (race.cover_image && typeof race.cover_image === 'object') {
            imgUrl = race.cover_image.url || imgUrl;
          }
          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000';
          const resolvedImgUrl = imgUrl.startsWith('http') || imgUrl.startsWith('/') 
            ? (imgUrl.startsWith('/') && !imgUrl.startsWith('//') ? `${backendUrl}${imgUrl}` : imgUrl) 
            : `${backendUrl}/${imgUrl}`;

          // Formatted date
          let formattedDate = '';
          if (race.start_date) {
            const dateObj = new Date(race.start_date);
            formattedDate = dateObj.toLocaleDateString('tr-TR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            });
          }

          // Price calculations
          const price = race.price ? parseFloat(race.price) : 0;
          const discountedPrice = race.discounted_price ? parseFloat(race.discounted_price) : 0;
          const hasDiscount = discountedPrice > 0 && discountedPrice < price;
          const activePrice = hasDiscount ? discountedPrice : price;
          const isFree = race.is_free || price === 0;

          return (
            <div 
              key={race.id || index}
              className="w-[280px] sm:w-[320px] shrink-0 snap-start group relative rounded-2xl overflow-hidden border border-border bg-card shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:shadow-md hover:border-primary/20 flex flex-col h-full"
            >
              {/* Card Image */}
              <div className="relative aspect-video w-full bg-zinc-950 overflow-hidden flex items-center justify-center">
                {/* Blurred Background effect for a premium feel */}
                <div 
                  className="absolute inset-0 bg-cover bg-center filter blur-md opacity-25 scale-105"
                  style={{ backgroundImage: `url(${resolvedImgUrl})` }}
                />
                <img 
                  src={resolvedImgUrl} 
                  alt={title}
                  className="relative z-10 max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                
                {/* Distance Badge */}
                {race.distance && (
                  <span className="absolute top-3 right-3 z-20 text-[10px] font-black bg-primary text-white px-2.5 py-1 rounded-lg border border-orange-600/20 shadow-sm flex items-center gap-1">
                    <Trophy className="size-3 text-white" />
                    <span>{parseFloat(race.distance)} KM</span>
                  </span>
                )}
              </div>

              {/* Card Content */}
              <div className="p-4 sm:p-5 flex flex-col justify-between flex-1 space-y-4">
                <div className="space-y-2">
                  <h4 className="text-sm sm:text-base font-black text-zinc-900 dark:text-zinc-50 line-clamp-1 group-hover:text-primary transition-colors">
                    {title}
                  </h4>
                  
                  {/* Date and Time */}
                  <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                    {formattedDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3.5" />
                        <span>{formattedDate}</span>
                      </span>
                    )}
                    {race.start_time && (
                      <span className="flex items-center gap-1">
                        <Clock className="size-3.5" />
                        <span>{race.start_time.slice(0, 5)}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer CTA */}
                <div className="pt-3 border-t border-border/40 flex justify-end">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-[11px] font-bold px-4 py-2 h-auto cursor-pointer flex items-center justify-center gap-1 hover:bg-primary hover:text-white hover:border-primary transition-all duration-300"
                  >
                    <Link href={`/yarislar/${categorySlug}/${slug}`}>
                      <span>{locale === 'tr' ? 'Detayları Gör' : 'View Details'}</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
