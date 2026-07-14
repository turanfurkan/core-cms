'use client';

import React from 'react';
import { Share2, Copy, ArrowUp } from 'lucide-react';

export function ShareButtons({ title, locale = 'tr' }) {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareOnWhatsApp = () => {
    if (typeof window !== 'undefined') {
      const url = encodeURIComponent(window.location.href);
      const text = encodeURIComponent(`${title} - SporFest Yarış Detayları: `);
      window.open(`https://api.whatsapp.com/send?text=${text}${url}`, '_blank');
    }
  };

  const shareOnTelegram = () => {
    if (typeof window !== 'undefined') {
      const url = encodeURIComponent(window.location.href);
      const text = encodeURIComponent(title);
      window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
    }
  };

  const shareOnFacebook = () => {
    if (typeof window !== 'undefined') {
      const url = encodeURIComponent(window.location.href);
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
    }
  };

  const shareOnTwitter = () => {
    if (typeof window !== 'undefined') {
      const url = encodeURIComponent(window.location.href);
      const text = encodeURIComponent(title);
      window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
    }
  };

  return (
    <div className="pt-4 border-t border-border/40 flex flex-col gap-3">
      {/* Label and Copy Link Button */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
          {locale === 'tr' ? 'Paylaş:' : 'Share:'}
        </span>
        <button
          onClick={copyToClipboard}
          className="px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-border hover:bg-primary/5 dark:hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-all cursor-pointer flex items-center justify-center gap-1.5 text-[10px] font-black uppercase text-zinc-500 dark:text-zinc-400 hover:scale-102 active:scale-98"
          title={locale === 'tr' ? 'Bağlantıyı Kopyala' : 'Copy Link'}
        >
          <Copy className="size-3.5" />
          <span>{copied ? (locale === 'tr' ? 'Kopyalandı!' : 'Copied!') : (locale === 'tr' ? 'Kopyala' : 'Copy')}</span>
        </button>
      </div>

      {/* Social Media Brand Icons - Inline Row */}
      <div className="grid grid-cols-4 gap-2">
        {/* WhatsApp */}
        <button
          onClick={shareOnWhatsApp}
          className="flex items-center justify-center p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-border hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:border-emerald-200/50 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-3xs"
          title="WhatsApp"
        >
          <img 
            src="/media/brand-logos/WhatsApp-Brand-Resouce-Center_2026/01_Glyph/01_Digital RGB/03_SVG/Digital_Glyph_Green_RGB_2026.svg" 
            alt="WhatsApp" 
            className="size-5 shrink-0"
          />
        </button>

        {/* Telegram */}
        <button
          onClick={shareOnTelegram}
          className="flex items-center justify-center p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-border hover:bg-sky-50 dark:hover:bg-sky-950/20 hover:border-sky-200/50 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-3xs"
          title="Telegram"
        >
          <img 
            src="/media/brand-logos/telegram/Logo.svg" 
            alt="Telegram" 
            className="size-5 shrink-0"
          />
        </button>

        {/* Facebook */}
        <button
          onClick={shareOnFacebook}
          className="flex items-center justify-center p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-border hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-200/50 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-3xs"
          title="Facebook"
        >
          <img 
            src="/media/brand-logos/Facebook Brand Asset Pack/Logo/Primary Logo/Facebook_Logo_Primary.png" 
            alt="Facebook" 
            className="size-5 shrink-0 object-contain"
          />
        </button>

        {/* X (Twitter) */}
        <button
          onClick={shareOnTwitter}
          className="flex items-center justify-center p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-border hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:border-zinc-350 dark:hover:border-zinc-700 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-3xs"
          title="X (Twitter)"
        >
          <img 
            src="/media/brand-logos/x-logo-pack/logo-black.png" 
            alt="X" 
            className="size-5 shrink-0 dark:invert"
          />
        </button>
      </div>
    </div>
  );
}

export function BackToTopButton({ locale = 'tr' }) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-[88px] sm:bottom-6 right-6 z-[99] size-11 rounded-2xl bg-primary text-primary-foreground shadow-lg border border-primary/20 flex items-center justify-center cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-200"
      title={locale === 'tr' ? 'Yukarı Çık' : 'Back to Top'}
    >
      <ArrowUp className="size-5 text-white" />
    </button>
  );
}
