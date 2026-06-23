'use client';

import * as Icons from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function TimelineMilestones({ data, locale = 'tr' }) {
  const fields = data?.data || {};
  const sectionTitle = getLocalized(fields.section_title, locale);
  const sectionSubtitle = getLocalized(fields.section_subtitle, locale);

  const milestones = [
    {
      year: fields.milestone_1_year,
      title: getLocalized(fields.milestone_1_title, locale),
      desc: getLocalized(fields.milestone_1_desc, locale),
      iconName: fields.milestone_1_icon || 'Calendar',
    },
    {
      year: fields.milestone_2_year,
      title: getLocalized(fields.milestone_2_title, locale),
      desc: getLocalized(fields.milestone_2_desc, locale),
      iconName: fields.milestone_2_icon || 'Calendar',
    },
    {
      year: fields.milestone_3_year,
      title: getLocalized(fields.milestone_3_title, locale),
      desc: getLocalized(fields.milestone_3_desc, locale),
      iconName: fields.milestone_3_icon || 'Calendar',
    },
    {
      year: fields.milestone_4_year,
      title: getLocalized(fields.milestone_4_title, locale),
      desc: getLocalized(fields.milestone_4_desc, locale),
      iconName: fields.milestone_4_icon || 'Calendar',
    },
  ].filter(item => item.year || item.title);

  if (milestones.length === 0 && !sectionTitle) return null;

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-6 max-w-3xl">
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

        <div className="relative border-s border-border pl-8 ml-4 space-y-8">
          {milestones.map((item, index) => {
            const IconComponent = Icons[item.iconName] || Icons.Calendar;

            return (
              <div key={index} className="relative group">
                {/* Timeline dot */}
                <div className="absolute -left-[49px] top-1 flex items-center justify-center rounded-full bg-background border border-border size-8 text-primary shadow-xs group-hover:border-primary group-hover:text-primary-active transition-all duration-300">
                  <IconComponent className="size-4 shrink-0" strokeWidth={1.5} />
                </div>

                {/* Milestone Card */}
                <Card className="border border-border bg-card p-5 hover:shadow-xs transition-shadow duration-300 rounded-2xl">
                  <div className="space-y-1.5">
                    {item.year && (
                      <span className="text-xs font-black text-primary uppercase tracking-widest block">
                        {item.year}
                      </span>
                    )}
                    {item.title && (
                      <h3 className="text-base font-bold text-foreground leading-snug">
                        {item.title}
                      </h3>
                    )}
                    {item.desc && (
                      <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed pt-0.5">
                        {item.desc}
                      </p>
                    )}
                  </div>
                </Card>
              </div>
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
