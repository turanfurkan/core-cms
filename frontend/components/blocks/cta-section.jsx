'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Send, Sparkles, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Helper to resolve localized fields
function getLocalized(val, locale = 'tr') {
  if (val && typeof val === 'object') {
    return val[locale] ?? '';
  }
  return val ?? '';
}

export default function CtaSection({ data, locale = 'tr' }) {
  const block = data || {};
  const content = block.content || block.data || {};
  const styles = block.styles || {};

  const title = getLocalized(content.section_title, locale);
  const subtitle = getLocalized(content.section_subtitle, locale);
  const ctaMode = content.cta_mode || 'newsletter'; // 'newsletter' or 'button_link'
  const placeholder = getLocalized(content.placeholder, locale) || (locale === 'tr' ? 'E-posta adresiniz' : 'Your email address');
  const buttonText = getLocalized(content.button_text, locale) || (locale === 'tr' ? 'Kayıt Ol' : 'Subscribe');
  const buttonLink = content.button_link || '#';

  const layoutStyle = styles.layout_style || 'centered_gradient';
  const bgGradient = styles.bg_gradient || 'gradient_dark';
  const paddingTop = styles.paddingTop ? `${styles.paddingTop}px` : '64px';
  const paddingBottom = styles.paddingBottom ? `${styles.paddingBottom}px` : '64px';

  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    
    // Simulate API registration
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsSubscribed(true);
      setEmail('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!title && !subtitle) return null;

  // Background Styles Mapping
  const bgClasses = cn(
    "relative w-full overflow-hidden select-none z-10 transition-all duration-300",
    bgGradient === 'gradient_dark' && "bg-gradient-to-br from-zinc-950 via-[#0a1224] to-[#120b24] text-white border-y border-white/5",
    bgGradient === 'gradient_accent' && "bg-gradient-to-br from-orange-600 via-pink-600 to-purple-700 text-white border-none",
    bgGradient === 'solid_dark' && "bg-zinc-900 text-zinc-50 border-y border-zinc-850",
    bgGradient === 'solid_light' && "bg-zinc-50/50 text-zinc-900 border-y border-zinc-200/80"
  );

  const inlineStyles = {
    paddingTop,
    paddingBottom
  };

  return (
    <section style={inlineStyles} className={bgClasses}>
      {/* Decorative Glow Ambient Elements for Gradient Dark */}
      {bgGradient === 'gradient_dark' && (
        <>
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[350px] h-[350px] bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" />
          <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse [animation-delay:2s]" />
        </>
      )}

      {/* Decorative Glow Ambient Elements for Gradient Accent */}
      {bgGradient === 'gradient_accent' && (
        <>
          <div className="absolute -top-12 -left-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none -z-10" />
          <div className="absolute -bottom-12 -right-12 w-80 h-80 bg-black/20 rounded-full blur-3xl pointer-events-none -z-10" />
        </>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* LAYOUT 1: Centered Gradient Style */}
        {layoutStyle === 'centered_gradient' && (
          <div className="text-center max-w-3xl mx-auto space-y-6 md:space-y-8">
            <div className={cn(
              "mx-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest",
              bgGradient.includes('dark') || bgGradient.includes('accent')
                ? "bg-white/10 text-white border border-white/20" 
                : "bg-primary/10 text-primary border border-primary/20"
            )}>
              <Sparkles className="size-3.5 fill-current" />
              {locale === 'tr' ? 'BİZE KATILIN' : 'JOIN US'}
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight uppercase leading-none">
                {title}
              </h2>
              {subtitle && (
                <p className={cn(
                  "text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed",
                  bgGradient.includes('light') ? "text-zinc-500 dark:text-zinc-400 font-medium" : "text-white/80"
                )}>
                  {subtitle}
                </p>
              )}
            </div>

            {/* CTA Interaction */}
            <div className="pt-2 max-w-md mx-auto">
              {ctaMode === 'newsletter' ? (
                isSubscribed ? (
                  <div className="animate-fade-in flex flex-col items-center justify-center p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl gap-3">
                    <div className="size-10 bg-emerald-500 rounded-full flex items-center justify-center text-white scale-110 shadow-lg shadow-emerald-500/20">
                      <Check className="size-5 stroke-[3]" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold">
                      {locale === 'tr' ? 'Bültene başarıyla kaydoldunuz!' : 'Successfully subscribed to newsletter!'}
                    </span>
                  </div>
                ) : (
                  <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 w-full">
                    <div className="relative flex-grow">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={placeholder}
                        disabled={loading}
                        className={cn(
                          "w-full pl-10 pr-4 py-3 text-xs sm:text-sm rounded-xl outline-none border focus:ring-2 focus:ring-primary/50 transition-all font-semibold",
                          bgGradient.includes('light')
                            ? "bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400"
                            : "bg-white/5 border-white/10 text-white placeholder-white/40 focus:bg-white/10 focus:border-white/20"
                        )}
                      />
                    </div>
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className={cn(
                        "rounded-xl px-6 font-bold select-none h-11 text-xs sm:text-sm flex items-center justify-center gap-2",
                        bgGradient === 'gradient_accent'
                          ? "bg-white text-zinc-900 hover:bg-zinc-150 active:scale-95 transition-all"
                          : ""
                      )}
                    >
                      {buttonText}
                      <Send className="size-3.5" />
                    </Button>
                  </form>
                )
              ) : (
                <Button size="lg" asChild className="rounded-xl px-8 font-black select-none uppercase tracking-wider text-xs sm:text-sm shadow-lg hover:shadow-xl active:scale-95 transition-all group">
                  <Link href={buttonLink}>
                    {buttonText}
                    <ArrowRight className="size-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        )}

        {/* LAYOUT 2: Split Card Layout */}
        {layoutStyle === 'split_card' && (
          <div className={cn(
            "p-8 sm:p-12 rounded-3xl flex flex-col lg:flex-row items-center justify-between gap-8 md:gap-12 relative overflow-hidden border",
            bgGradient.includes('light')
              ? "bg-white border-zinc-200/80 shadow-md"
              : "bg-zinc-900/60 border-white/5 shadow-xl shadow-black/10"
          )}>
            <div className="space-y-4 text-left grow max-w-2xl">
              <span className={cn(
                "inline-flex items-center gap-1 text-[10px] sm:text-xs font-black uppercase tracking-widest",
                bgGradient.includes('light') ? "text-primary" : "text-primary/90"
              )}>
                <Sparkles className="size-3.5 fill-current" />
                {locale === 'tr' ? 'BÜLTEN ABONELİĞİ' : 'NEWSLETTER SUBSCRIBE'}
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight uppercase leading-snug">
                {title}
              </h2>
              {subtitle && (
                <p className={cn(
                  "text-xs sm:text-sm md:text-base leading-relaxed font-medium",
                  bgGradient.includes('light') ? "text-zinc-500 dark:text-zinc-400" : "text-white/70"
                )}>
                  {subtitle}
                </p>
              )}
            </div>

            {/* Interaction Row */}
            <div className="shrink-0 w-full lg:w-96">
              {ctaMode === 'newsletter' ? (
                isSubscribed ? (
                  <div className="animate-fade-in flex flex-col items-center justify-center p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl gap-2 w-full">
                    <Check className="size-6 text-emerald-500 stroke-[3]" />
                    <span className="text-xs sm:text-sm font-bold text-center">
                      {locale === 'tr' ? 'Abonelik Başarılı!' : 'Subscription Successful!'}
                    </span>
                  </div>
                ) : (
                  <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full">
                    <div className="relative flex-grow w-full">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={placeholder}
                        disabled={loading}
                        className={cn(
                          "w-full pl-10 pr-4 py-3 text-xs sm:text-sm rounded-xl outline-none border focus:ring-2 focus:ring-primary/50 transition-all font-semibold",
                          bgGradient.includes('light')
                            ? "bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400"
                            : "bg-white/5 border-white/10 text-white placeholder-white/40 focus:bg-white/10 focus:border-white/20"
                        )}
                      />
                    </div>
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="rounded-xl px-6 font-bold select-none h-11 text-xs sm:text-sm w-full flex items-center justify-center gap-2"
                    >
                      {buttonText}
                      <Send className="size-3.5" />
                    </Button>
                  </form>
                )
              ) : (
                <Button size="lg" asChild className="rounded-xl px-8 font-black select-none uppercase tracking-wider text-xs sm:text-sm w-full flex items-center justify-center gap-2 group">
                  <Link href={buttonLink}>
                    {buttonText}
                    <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        )}

        {/* LAYOUT 3: Glassmorphic Box Style */}
        {layoutStyle === 'glassmorphic' && (
          <div className="p-8 sm:p-12 md:p-16 bg-white/[0.03] dark:bg-white/[0.01] backdrop-blur-md border border-white/10 rounded-[32px] shadow-2xl relative overflow-hidden select-none max-w-4xl mx-auto">
            {/* Corner highlights inside the glass box */}
            <div className="absolute -top-12 -left-12 w-48 h-48 bg-primary/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 text-center max-w-2xl mx-auto space-y-6 md:space-y-8">
              <span className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest",
                bgGradient.includes('light') ? "bg-zinc-200/50 text-zinc-800" : "bg-white/10 text-white border border-white/20"
              )}>
                <Sparkles className="size-3.5 fill-current" />
                {locale === 'tr' ? 'SANA ÖZEL TEKLİF' : 'EXCLUSIVE OFFER'}
              </span>

              <div className="space-y-4">
                <h2 className={cn(
                  "text-2xl sm:text-3xl md:text-4xl font-black tracking-tight uppercase leading-tight",
                  bgGradient.includes('light') ? "text-zinc-950" : "text-white"
                )}>
                  {title}
                </h2>
                {subtitle && (
                  <p className={cn(
                    "text-xs sm:text-sm md:text-base leading-relaxed font-semibold",
                    bgGradient.includes('light') ? "text-zinc-500" : "text-white/70"
                  )}>
                    {subtitle}
                  </p>
                )}
              </div>

              {/* Interaction Block */}
              <div className="pt-2 max-w-md mx-auto">
                {ctaMode === 'newsletter' ? (
                  isSubscribed ? (
                    <div className="animate-fade-in flex flex-col items-center justify-center p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl gap-2">
                      <Check className="size-5 text-emerald-500 stroke-[3]" />
                      <span className="text-xs sm:text-sm font-bold">
                        {locale === 'tr' ? 'Bültene kaydınız alındı!' : 'Subscription received!'}
                      </span>
                    </div>
                  ) : (
                    <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 w-full">
                      <div className="relative flex-grow">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder={placeholder}
                          disabled={loading}
                          className={cn(
                            "w-full pl-10 pr-4 py-3 text-xs sm:text-sm rounded-xl outline-none border focus:ring-2 focus:ring-primary/50 transition-all font-semibold",
                            bgGradient.includes('light')
                              ? "bg-white border-zinc-200 text-zinc-950 placeholder-zinc-400"
                              : "bg-white/5 border-white/10 text-white placeholder-white/40 focus:bg-white/10 focus:border-white/20"
                          )}
                        />
                      </div>
                      <Button 
                        type="submit" 
                        disabled={loading}
                        className="rounded-xl px-6 font-bold select-none h-11 text-xs sm:text-sm flex items-center justify-center gap-2"
                      >
                        {buttonText}
                        <Send className="size-3.5" />
                      </Button>
                    </form>
                  )
                ) : (
                  <Button size="lg" asChild className="rounded-xl px-8 font-black select-none uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2 group shadow-xl">
                    <Link href={buttonLink}>
                      {buttonText}
                      <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
