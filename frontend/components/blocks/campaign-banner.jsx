'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function CampaignBanner({ data, locale = 'tr' }) {
  const fields = data?.data || {};
  const title = getLocalized(fields.title, locale);
  const description = getLocalized(fields.description, locale);
  const promoCode = fields.promo_code || '';
  const discountLabel = getLocalized(fields.discount_label, locale);
  const progressPercent = Math.min(Math.max(Number(fields.progress_percent) || 0, 0), 100);
  const ctaText = getLocalized(fields.cta_text, locale);
  const ctaUrl = fields.cta_url || '#';

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!promoCode) return;
    navigator.clipboard.writeText(promoCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!title) return null;

  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-6 max-w-4xl">
        <Card className="border border-border bg-card overflow-hidden rounded-2xl shadow-xs hover:shadow-sm transition-shadow">
          <CardContent className="p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3 grow min-w-0">
              <div className="flex items-center gap-2">
                {discountLabel && (
                  <span className="text-[10px] font-black text-fuchsia-600 bg-fuchsia-50 px-2.5 py-0.5 rounded border border-fuchsia-100 uppercase dark:bg-fuchsia-950/20 dark:text-fuchsia-400 dark:border-fuchsia-900/30">
                    {discountLabel}
                  </span>
                )}
                <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
                  {locale === 'tr' ? 'Özel Teklif' : 'Special Offer'}
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-foreground leading-snug truncate">
                  {title}
                </h3>
                {description && (
                  <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xl truncate">
                    {description}
                  </p>
                )}
              </div>

              {progressPercent > 0 && (
                <div className="space-y-1.5 pt-1.5 max-w-xs">
                  <div className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-fuchsia-500 rounded-full" style={{ width: `${progressPercent}%` }} />
                  </div>
                  <div className="text-[10px] font-bold text-zinc-400">
                    {locale === 'tr' ? `Kampanya Kotası: %${progressPercent} Doldu` : `Campaign Limit: ${progressPercent}% Filled`}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col items-center gap-4 shrink-0 w-full md:w-auto">
              {promoCode && (
                <div
                  onClick={handleCopy}
                  className="border border-dashed border-zinc-300 hover:border-primary bg-zinc-50/50 hover:bg-zinc-50 dark:bg-zinc-900/30 dark:border-zinc-800 dark:hover:border-primary px-4 py-2.5 rounded-xl text-center cursor-pointer select-none transition-all w-full sm:w-auto md:w-40 flex items-center justify-between gap-3 group"
                >
                  <div className="text-left space-y-0.5 min-w-0">
                    <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider block">
                      {locale === 'tr' ? 'Kupon Kodu' : 'Coupon Code'}
                    </span>
                    <span className="font-mono text-xs font-black text-foreground block tracking-wider truncate">
                      {promoCode}
                    </span>
                  </div>
                  <div className="text-zinc-400 group-hover:text-primary transition-colors shrink-0">
                    {copied ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
                  </div>
                </div>
              )}

              {ctaText && (
                <Button variant="outline" asChild className="w-full sm:w-auto md:w-40 text-xs font-bold shrink-0">
                  <Link href={ctaUrl}>{ctaText}</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
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
