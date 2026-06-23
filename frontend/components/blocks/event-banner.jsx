'use client';

import Link from 'next/link';
import { CalendarCheck2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AvatarGroup } from '@/app/components/partials/common/avatar-group';

export default function EventBanner({ data, locale = 'tr' }) {
  const fields = data?.data || {};
  const eventTitle = getLocalized(fields.event_title, locale);
  const eventSubtitle = getLocalized(fields.event_subtitle, locale);
  const eventCode = fields.event_code || '';
  const filledSeats = Number(fields.filled_seats) || 0;
  const totalSeats = Number(fields.total_seats) || 100;
  const ctaText = getLocalized(fields.cta_text, locale);
  const ctaUrl = fields.cta_url || '#';

  if (!eventTitle) return null;

  const pct = totalSeats > 0 ? Math.min(Math.round((filledSeats / totalSeats) * 100), 100) : 0;

  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-6 max-w-4xl">
        <Card className="border border-border bg-card overflow-hidden rounded-2xl shadow-xs hover:shadow-sm transition-shadow">
          <CardContent className="p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4 min-w-0">
              <div className="size-11 shrink-0 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center">
                <CalendarCheck2 className="size-6" />
              </div>

              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {eventCode && (
                    <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded border border-violet-100 uppercase dark:bg-violet-950/20 dark:text-violet-400 dark:border-violet-900/30">
                      {eventCode}
                    </span>
                  )}
                  <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
                    {locale === 'tr' ? 'Canlı Etkinlik' : 'Live Event'}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-foreground leading-snug truncate">
                  {eventTitle}
                </h3>
                {eventSubtitle && (
                  <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-lg truncate">
                    {eventSubtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col md:items-end gap-4 shrink-0 w-full md:w-auto">
              <div className="flex flex-wrap items-center gap-6 justify-between w-full md:w-auto">
                {/* Seat capacity progress */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] sm:text-xs font-semibold text-zinc-500">
                    <span>{locale === 'tr' ? 'Katılım Doluluğu:' : 'Seats Filled:'}</span>
                    <span>{filledSeats} / {totalSeats} ({pct}%)</span>
                  </div>
                  <Progress
                    value={pct}
                    indicatorClassName="bg-green-500"
                    className="h-1.5 w-40 max-w-full"
                  />
                </div>

                {/* Micro avatar group */}
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">
                    {locale === 'tr' ? 'Eğitmenler' : 'Instructors'}
                  </span>
                  <AvatarGroup
                    size="size-7"
                    group={[
                      { filename: '300-1.png' },
                      { filename: '300-2.png' },
                      { filename: '300-3.png' },
                    ]}
                  />
                </div>
              </div>

              {ctaText && (
                <div className="pt-2 w-full md:w-auto flex md:justify-end">
                  <Button variant="primary" asChild className="w-full md:w-auto text-xs font-bold">
                    <Link href={ctaUrl}>{ctaText}</Link>
                  </Button>
                </div>
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
