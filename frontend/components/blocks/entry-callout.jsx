import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toAbsoluteUrl } from '@/lib/helpers';

export default function EntryCallout({ data, locale = 'tr' }) {
  const fields = data?.data || {};
  const title = getLocalized(fields.title, locale);
  const description = getLocalized(fields.description, locale);
  const ctaText = getLocalized(fields.cta_text, locale);
  const ctaUrl = fields.cta_url || '#';
  const bgImage = fields.background_image?.url || toAbsoluteUrl('/media/images/2600x1600/2.png');

  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-6 max-w-4xl">
        <Card className="overflow-hidden border border-border shadow-xs hover:shadow-md transition-shadow">
          <div 
            className="p-10 md:p-12 bg-no-repeat bg-[length:45%] [background-position:right_center] md:[background-position:95%_center] flex flex-col justify-center gap-4 bg-muted/10 min-h-[300px]"
            style={{ backgroundImage: `url(${bgImage})` }}
          >
            <div className="max-w-xl space-y-4 pr-12 md:pr-0">
              {title && (
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground leading-tight">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-zinc-500 dark:text-zinc-400 text-sm sm:text-base leading-relaxed">
                  {description}
                </p>
              )}
            </div>

            {ctaText && (
              <div className="pt-4">
                <Button variant="outline" mode="link" underlined="dashed" asChild className="text-sm font-semibold">
                  <Link href={ctaUrl}>{ctaText}</Link>
                </Button>
              </div>
            )}
          </div>
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
