'use client';

import { Card, CardContent } from '@/components/ui/card';
import { toAbsoluteUrl } from '@/lib/helpers';

export default function TestimonialCard({ data, locale = 'tr' }) {
  const fields = data?.data || {};
  const sectionTitle = getLocalized(fields.section_title, locale);
  const sectionSubtitle = getLocalized(fields.section_subtitle, locale);

  const testimonials = [
    {
      name: fields.testimonial_1_name,
      role: getLocalized(fields.testimonial_1_role, locale),
      quote: getLocalized(fields.testimonial_1_quote, locale),
      avatar: fields.testimonial_1_avatar?.url,
      rating: Number(fields.testimonial_1_rating) || 5,
    },
    {
      name: fields.testimonial_2_name,
      role: getLocalized(fields.testimonial_2_role, locale),
      quote: getLocalized(fields.testimonial_2_quote, locale),
      avatar: fields.testimonial_2_avatar?.url,
      rating: Number(fields.testimonial_2_rating) || 5,
    },
    {
      name: fields.testimonial_3_name,
      role: getLocalized(fields.testimonial_3_role, locale),
      quote: getLocalized(fields.testimonial_3_quote, locale),
      avatar: fields.testimonial_3_avatar?.url,
      rating: Number(fields.testimonial_3_rating) || 5,
    },
  ].filter(t => t.name);

  if (testimonials.length === 0 && !sectionTitle) return null;

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((item, index) => {
            const avatarUrl = item.avatar || toAbsoluteUrl(`/media/avatars/300-${index + 1}.png`);
            return (
              <Card key={index} className="border border-border bg-card shadow-xs hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden flex flex-col justify-between">
                <CardContent className="p-6 sm:p-7 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    {/* Stars rating */}
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg
                          key={i}
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill={i < item.rating ? 'currentColor' : 'none'}
                          stroke="currentColor"
                          strokeWidth="1.5"
                          className="size-4 shrink-0"
                        >
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      ))}
                    </div>

                    {/* Quote text */}
                    {item.quote && (
                      <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed italic">
                        "{item.quote}"
                      </p>
                    )}
                  </div>

                  {/* Profile info footer */}
                  <div className="flex items-center gap-3 pt-4 border-t border-border mt-4">
                    <img
                      src={avatarUrl}
                      className="size-9 rounded-full object-cover border border-border"
                      alt={item.name}
                    />
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-bold text-foreground truncate">
                        {item.name}
                      </div>
                      {item.role && (
                        <div className="text-[10px] sm:text-xs text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
                          {item.role}
                        </div>
                      )}
                    </div>
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
