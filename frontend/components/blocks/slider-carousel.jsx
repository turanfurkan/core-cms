'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function SliderCarousel({ data, locale = 'tr' }) {
  const fields = data?.data || data?.content || {};
  const [currentSlide, setCurrentSlide] = useState(0);

  // Read slides from the new repeater array structure
  const rawSlides = fields.slides || [];
  
  const slides = rawSlides.map(slide => {
    const rawLink = slide.buttonLink || slide.button_link || '#';
    const linkObj = typeof rawLink === 'object' && rawLink !== null
      ? { url: '#', target: '_self', ...rawLink }
      : { url: rawLink || '#', target: '_self' };

    return {
      title: getLocalized(slide.title, locale) || '',
      subtitle: getLocalized(slide.subtitle, locale) || '',
      image: slide.image || 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80',
      buttonText: getLocalized(slide.buttonText || slide.button_text, locale) || '',
      buttonLinkObj: linkObj
    };
  });

  const height = fields.height || '500'; // Default 500px height
  const autoplay = fields.autoplay !== false;

  useEffect(() => {
    if (!autoplay || slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [autoplay, slides.length]);

  if (slides.length === 0) {
    return (
      <div className="w-full bg-zinc-900 text-zinc-400 py-20 text-center text-sm border-y border-zinc-800">
        🎠 Slayt Kartı Eklenmedi
      </div>
    );
  }

  return (
    <section 
      className="relative overflow-hidden w-full group/slider bg-zinc-950 text-white"
      style={{ height: `${height}px` }}
    >
      {/* Slides Container */}
      <div className="absolute inset-0">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={cn(
              "absolute inset-0 transition-all duration-1000 ease-in-out flex items-center justify-center",
              index === currentSlide ? "opacity-100 scale-100 z-10" : "opacity-0 scale-105 pointer-events-none z-0"
            )}
          >
            {/* Slide Background Image */}
            <div className="absolute inset-0 z-0">
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover opacity-35"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-zinc-950/40 to-zinc-950/30" />
            </div>

            {/* Slide Content */}
            <div className="container mx-auto px-6 relative z-10 max-w-4xl text-center space-y-6">
              {slide.title && (
                <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight drop-shadow-md">
                  {slide.title}
                </h2>
              )}
              {slide.subtitle && (
                <p className="text-sm sm:text-lg text-zinc-200 drop-shadow-xs max-w-xl mx-auto leading-relaxed">
                  {slide.subtitle}
                </p>
              )}
              {slide.buttonText && (
                <div className="pt-2">
                  <Button
                    asChild
                    variant="primary"
                    className="rounded-xl px-6 py-3 h-auto font-semibold hover:scale-105 shadow-lg shadow-primary/20 transition-all duration-300 gap-1.5 cursor-pointer"
                  >
                    <Link href={slide.buttonLinkObj.url} target={slide.buttonLinkObj.target}>
                      {slide.buttonText}
                      <ChevronRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={() => setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 size-10 rounded-full bg-black/30 backdrop-blur-xs border border-white/10 flex items-center justify-center opacity-0 group-hover/slider:opacity-100 text-white hover:bg-primary hover:border-primary transition-all duration-200"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            onClick={() => setCurrentSlide(prev => (prev + 1) % slides.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 size-10 rounded-full bg-black/30 backdrop-blur-xs border border-white/10 flex items-center justify-center opacity-0 group-hover/slider:opacity-100 text-white hover:bg-primary hover:border-primary transition-all duration-200"
          >
            <ChevronRight className="size-5" />
          </button>
        </>
      )}

      {/* Pagination Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 left-0 right-0 z-20 flex items-center justify-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                index === currentSlide ? "w-6 bg-primary" : "w-2 bg-white/40 hover:bg-white/60"
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// Localized helper
function getLocalized(val, locale) {
  if (val && typeof val === 'object') {
    return val[locale] || val['tr'] || val['en'] || Object.values(val)[0] || '';
  }
  return val || '';
}
