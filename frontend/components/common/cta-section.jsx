'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/common/container';

export function CtaSection({
  title = "Sınırlarını Aşmaya Hazır Mısın?",
  description = "Bir sonraki büyük yarışa hemen kaydol, heyecan dolu maceraya ve topluluğumuza ortak ol!",
  primaryBtnText = "Hemen Kaydol",
  primaryBtnLink = "/races",
  secondaryBtnText = "Yarışları İncele",
  secondaryBtnLink = "/races",
  backgroundImage,
  className
}) {
  return (
    <section className={cn("py-12 md:py-20 relative overflow-hidden", className)}>
      <Container>
        {/* Glow Backgrounds */}
        <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden rounded-3xl">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/10 blur-[120px] rounded-full" />
          <div className="absolute top-12 right-12 w-[300px] h-[300px] bg-sky-500/5 blur-[100px] rounded-full" />
        </div>

        <div 
          className={cn(
            "relative w-full rounded-3xl overflow-hidden border border-border/80 bg-gradient-to-br from-card/90 to-card/40 p-8 md:p-16 lg:p-20 text-center space-y-6 md:space-y-8 shadow-xl backdrop-blur-xs",
            backgroundImage ? "before:absolute before:inset-0 before:bg-zinc-950/80 before:-z-10" : ""
          )}
        >
          {backgroundImage && (
            <img
              src={backgroundImage}
              alt=""
              className="absolute inset-0 w-full h-full object-cover -z-20 pointer-events-none"
            />
          )}

          {/* Decorative Top Sparkle */}
          <div className="mx-auto inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] sm:text-xs font-black uppercase tracking-wider select-none animate-pulse">
            <Sparkles className="size-3.5 fill-primary" />
            Yarış Kayıtları Aktif
          </div>

          {/* Headline & Description */}
          <div className="max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-none text-zinc-900 dark:text-zinc-50">
              {title}
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
              {description}
            </p>
          </div>

          {/* Buttons Row */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {primaryBtnText && (
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto h-12 md:h-13 px-8 rounded-xl font-black text-sm shadow-md gap-2 group transition-all duration-300 hover:scale-102"
              >
                <Link href={primaryBtnLink}>
                  {primaryBtnText}
                  <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </Button>
            )}
            
            {secondaryBtnText && (
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full sm:w-auto h-12 md:h-13 px-8 rounded-xl font-black text-sm border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-102"
              >
                <Link href={secondaryBtnLink}>
                  {secondaryBtnText}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
