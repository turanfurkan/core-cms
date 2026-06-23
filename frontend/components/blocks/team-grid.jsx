'use client';

import Link from 'next/link';
import { BadgeCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { toAbsoluteUrl } from '@/lib/helpers';

export default function TeamGrid({ data, locale = 'tr' }) {
  const fields = data?.data || {};
  const sectionTitle = getLocalized(fields.section_title, locale);
  const sectionSubtitle = getLocalized(fields.section_subtitle, locale);

  const members = [
    {
      name: fields.member_1_name,
      role: getLocalized(fields.member_1_role, locale),
      avatar: fields.member_1_avatar?.url,
      twitter: fields.member_1_social_twitter,
      linkedin: fields.member_1_social_linkedin,
    },
    {
      name: fields.member_2_name,
      role: getLocalized(fields.member_2_role, locale),
      avatar: fields.member_2_avatar?.url,
      twitter: fields.member_2_social_twitter,
      linkedin: fields.member_2_social_linkedin,
    },
    {
      name: fields.member_3_name,
      role: getLocalized(fields.member_3_role, locale),
      avatar: fields.member_3_avatar?.url,
      twitter: fields.member_3_social_twitter,
      linkedin: fields.member_3_social_linkedin,
    },
    {
      name: fields.member_4_name,
      role: getLocalized(fields.member_4_role, locale),
      avatar: fields.member_4_avatar?.url,
      twitter: fields.member_4_social_twitter,
      linkedin: fields.member_4_social_linkedin,
    },
  ].filter(m => m.name);

  if (members.length === 0 && !sectionTitle) return null;

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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {members.map((item, index) => {
            const avatarUrl = item.avatar || toAbsoluteUrl(`/media/avatars/300-${index + 1}.png`);
            return (
              <Card key={index} className="border border-border bg-card shadow-xs hover:shadow-md transition-shadow duration-300 rounded-2xl overflow-hidden text-center">
                <CardContent className="p-6 space-y-4">
                  <div className="relative inline-block">
                    <img
                      src={avatarUrl}
                      className="size-16 rounded-full object-cover border border-border mx-auto shadow-xs"
                      alt={item.name}
                    />
                    <div className="absolute bottom-0 right-0 rounded-full bg-background p-0.5 border border-border">
                      <BadgeCheck className="size-4 text-primary fill-primary-active stroke-white" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-sm sm:text-base font-bold text-foreground truncate">
                      {item.name}
                    </h3>
                    {item.role && (
                      <span className="inline-block text-[10px] sm:text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider truncate max-w-full">
                        {item.role}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-2 border-t border-border mt-3 text-xs">
                    {item.linkedin && (
                      <Link
                        href={item.linkedin}
                        target="_blank"
                        className="text-zinc-400 hover:text-primary transition-colors font-medium"
                      >
                        LinkedIn
                      </Link>
                    )}
                    {item.twitter && (
                      <Link
                        href={item.twitter}
                        target="_blank"
                        className="text-zinc-400 hover:text-primary transition-colors font-medium"
                      >
                        Twitter
                      </Link>
                    )}
                    {!item.linkedin && !item.twitter && (
                      <span className="text-[10px] text-zinc-400">ekip üyesi</span>
                    )}
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
