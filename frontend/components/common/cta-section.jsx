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
  noContainer = false,
  fullWidth = false,
  variant = "default", // "default" or "primary"
  className
}) {
  const isPrimary = variant === 'primary';

  const innerContent = (
    <div className="relative w-full text-center space-y-6 md:space-y-8 py-8 md:py-16 lg:py-20 px-4 md:px-6">
      {/* Decorative Top Sparkle */}
      <div 
        className={cn(
          "mx-auto inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider select-none animate-pulse",
          isPrimary 
            ? "bg-white/10 border border-white/20 text-white" 
            : "bg-primary/10 border border-primary/20 text-primary"
        )}
      >
        <Sparkles className={cn("size-3.5", isPrimary ? "fill-white" : "fill-primary")} />
        Yarış Kayıtları Aktif
      </div>

      {/* Headline & Description */}
      <div className="max-w-3xl mx-auto space-y-4">
        <h2 
          className={cn(
            "text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-none",
            isPrimary ? "text-white" : "text-zinc-900 dark:text-zinc-50"
          )}
        >
          {title}
        </h2>
        <p 
          className={cn(
            "text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl mx-auto",
            isPrimary ? "text-white/85" : "text-muted-foreground"
          )}
        >
          {description}
        </p>
      </div>

      {/* Buttons Row */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        {primaryBtnText && (
          <Button
            asChild
            size="lg"
            variant={isPrimary ? "secondary" : "default"}
            className="w-full sm:w-auto font-bold"
          >
            <Link href={primaryBtnLink}>
              {primaryBtnText}
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        )}
        
        {secondaryBtnText && (
          <Button
            asChild
            size="lg"
            variant="outline"
            className="w-full sm:w-auto font-bold"
          >
            <Link href={secondaryBtnLink}>
              {secondaryBtnText}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );

  const glowBackgrounds = (
    <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
      <div className={cn("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] blur-[120px] rounded-full", isPrimary ? "bg-white/10" : "bg-primary/10")} />
      <div className="absolute top-12 right-12 w-[300px] h-[300px] bg-sky-500/5 blur-[100px] rounded-full" />
    </div>
  );

  // Outer block styles
  const outerStyles = cn(
    "relative overflow-hidden w-full",
    isPrimary ? "bg-primary text-primary-foreground" : "border border-border/80 bg-gradient-to-br from-card/90 to-card/40 rounded-3xl",
    fullWidth ? "w-screen left-1/2 right-1/2 -translate-x-1/2 rounded-none border-x-0" : "",
    backgroundImage ? "before:absolute before:inset-0 before:bg-zinc-950/80 before:-z-10" : "",
    className
  );

  return (
    <section className={outerStyles}>
      {backgroundImage && (
        <img
          src={backgroundImage}
          alt=""
          className="absolute inset-0 w-full h-full object-cover -z-20 pointer-events-none"
        />
      )}
      {glowBackgrounds}
      
      {noContainer || (!fullWidth && !isPrimary) ? (
        innerContent
      ) : (
        <Container>
          {innerContent}
        </Container>
      )}
    </section>
  );
}
