import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export default function StatisticsBlock({ data, locale = 'tr' }) {
  const fields = data?.data || {};
  const sectionTitle = getLocalized(fields.title, locale);

  const items = [
    { number: fields.stat_1_number || '0', label: getLocalized(fields.stat_1_label, locale) },
    { number: fields.stat_2_number || '0', label: getLocalized(fields.stat_2_label, locale) },
    { number: fields.stat_3_number || '0', label: getLocalized(fields.stat_3_label, locale) }
  ].filter(item => item.label || item.number !== '0');

  if (items.length === 0) return null;

  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-6 max-w-4xl space-y-6">
        {sectionTitle && (
          <h2 className="text-xl font-bold tracking-tight text-foreground text-center sm:text-left">
            {sectionTitle}
          </h2>
        )}

        <Card className="border border-border shadow-xs">
          <CardContent className="p-8">
            <div className="flex flex-col sm:flex-row justify-around items-stretch gap-6 sm:gap-4">
              {items.map((item, index) => (
                <React.Fragment key={index}>
                  <div className="flex-1 flex flex-col justify-center items-center gap-1.5 text-center px-4">
                    <span className="text-mono text-3xl sm:text-4xl leading-none font-bold text-primary">
                      {item.number}
                    </span>
                    <span className="text-secondary-foreground text-xs sm:text-sm font-medium">
                      {item.label}
                    </span>
                  </div>
                  {index < items.length - 1 && (
                    <span className="hidden sm:inline-block border-e border-border my-2" />
                  )}
                </React.Fragment>
              ))}
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
