'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { toAbsoluteUrl } from '@/lib/helpers';

export default function IntegrationsLogos({ data, locale = 'tr' }) {
  const fields = data?.data || {};
  const sectionTitle = getLocalized(fields.section_title, locale);
  const sectionSubtitle = getLocalized(fields.section_subtitle, locale);

  const rawItems = [
    {
      name: fields.integration_1_name,
      desc: getLocalized(fields.integration_1_desc, locale),
      logo: fields.integration_1_logo?.url,
    },
    {
      name: fields.integration_2_name,
      desc: getLocalized(fields.integration_2_desc, locale),
      logo: fields.integration_2_logo?.url,
    },
    {
      name: fields.integration_3_name,
      desc: getLocalized(fields.integration_3_desc, locale),
      logo: fields.integration_3_logo?.url,
    },
    {
      name: fields.integration_4_name,
      desc: getLocalized(fields.integration_4_desc, locale),
      logo: fields.integration_4_logo?.url,
    },
  ].filter(item => item.name);

  // Maintain separate switch states to allow active interaction in UI
  const [activeStates, setActiveStates] = useState(
    rawItems.reduce((acc, _, idx) => {
      acc[idx] = true; // default enabled
      return acc;
    }, {})
  );

  const toggleState = (idx) => {
    setActiveStates(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  if (rawItems.length === 0 && !sectionTitle) return null;

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-6 max-w-4xl">
        {(sectionTitle || sectionSubtitle) && (
          <div className="text-center mb-10 space-y-3">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {rawItems.map((item, index) => {
            const logoPath = item.logo || toAbsoluteUrl(`/media/brand-logos/google-webdev.svg`);
            const isActive = !!activeStates[index];

            return (
              <Card key={index} className="border border-border hover:border-primary/30 dark:bg-secondary-clarity hover:shadow-xs transition-all duration-300 rounded-2xl overflow-hidden">
                <CardContent className="flex items-center justify-between gap-4 p-5">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="size-11 shrink-0 rounded-xl bg-muted/30 border border-border p-1.5 flex items-center justify-center bg-white dark:bg-zinc-900">
                      <img
                        src={logoPath}
                        className="max-h-full max-w-full object-contain"
                        alt={`${item.name} logo`}
                      />
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-foreground truncate">
                        {item.name}
                      </span>
                      {item.desc && (
                        <span className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 truncate leading-relaxed">
                          {item.desc}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="shrink-0 flex items-center">
                    <Switch
                      id={`switch-${index}`}
                      checked={isActive}
                      onCheckedChange={() => toggleState(index)}
                      className="data-[state=checked]:bg-green-500"
                    />
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
