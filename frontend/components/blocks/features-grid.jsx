'use client';

import * as Icons from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function FeaturesGrid({ data, locale = 'tr' }) {
  const fields = data?.data || {};
  const sectionTitle = getLocalized(fields.section_title, locale);
  const sectionSubtitle = getLocalized(fields.section_subtitle, locale);

  const features = [
    {
      title: getLocalized(fields.feature_1_title, locale),
      desc: getLocalized(fields.feature_1_desc, locale),
      iconName: fields.feature_1_icon || 'Sparkles',
    },
    {
      title: getLocalized(fields.feature_2_title, locale),
      desc: getLocalized(fields.feature_2_desc, locale),
      iconName: fields.feature_2_icon || 'Sparkles',
    },
    {
      title: getLocalized(fields.feature_3_title, locale),
      desc: getLocalized(fields.feature_3_desc, locale),
      iconName: fields.feature_3_icon || 'Sparkles',
    },
    {
      title: getLocalized(fields.feature_4_title, locale),
      desc: getLocalized(fields.feature_4_desc, locale),
      iconName: fields.feature_4_icon || 'Sparkles',
    },
  ].filter(f => f.title);

  if (features.length === 0 && !sectionTitle) return null;

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-6 max-w-6xl">
        {(sectionTitle || sectionSubtitle) && (
          <div className="text-center mb-12 space-y-3">
            {sectionTitle && (
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {sectionTitle}
              </h2>
            )}
            {sectionSubtitle && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
                {sectionSubtitle}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((item, index) => {
            // Dynamically resolve icon component
            const IconComponent = Icons[item.iconName] || Icons.Sparkles;

            return (
              <Card key={index} className="group border border-border bg-card shadow-xs hover:shadow-md hover:-translate-y-1.5 transition-all duration-300 rounded-2xl overflow-hidden">
                <CardContent className="p-6 sm:p-7 space-y-4">
                  <div className="inline-flex items-center justify-center p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                    <IconComponent className="size-6 shrink-0" strokeWidth={1.5} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-foreground leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
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
