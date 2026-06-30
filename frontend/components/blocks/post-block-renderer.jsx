'use client';

import Link from 'next/link';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';
import { RaceCard } from '@/components/ui/race-card';
import { cn } from '@/lib/utils';

// Localized helper
function getLocalized(val, locale = 'tr') {
  if (val && typeof val === 'object') {
    return val[locale] || val['tr'] || val['en'] || Object.values(val)[0] || '';
  }
  return val || '';
}

function EntityCard({ item, type, showPrice = true, locale = 'tr' }) {
  if (type === 'race') {
    return <RaceCard item={item} showPrice={showPrice} previewOnly={false} locale={locale} />;
  }

  const title = getLocalized(item.title || item.name || '', locale);

  // category card
  const detailUrl = `/blog?category_id=${item.id}`;
  return (
    <Link href={detailUrl} className="group flex items-center justify-between p-3.5 border border-border bg-card rounded-xl shadow-xs hover:shadow-md hover:border-border/60 transition-all duration-200">
      <div className="min-w-0 flex-1">
        <h4 className="font-bold text-xs text-foreground truncate group-hover:text-primary transition-colors">
          {title}
        </h4>
        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5">
          {item.type || 'Kategori'}
        </p>
      </div>
      <span className="text-zinc-400 group-hover:translate-x-0.5 transition-transform text-xs font-bold">→</span>
    </Link>
  );
}

export default function PostBlockRenderer({ blocks = [], locale = 'tr' }) {
  if (!blocks || !Array.isArray(blocks)) return null;

  return (
    <div className="space-y-6 pt-4">
      {blocks.map((block) => {
        const key = block.id;

        switch (block.type) {
          case 'heading': {
            const Level = block.data.level || 'h2';
            const text = getLocalized(block.data.text, locale);
            if (!text) return null;

            const sizeClasses = {
              h2: 'text-2xl font-extrabold tracking-tight mt-8 mb-4 border-b border-border/40 pb-2',
              h3: 'text-xl font-bold tracking-tight mt-6 mb-3',
              h4: 'text-lg font-semibold tracking-tight mt-5 mb-2',
            };

            return (
              <Level key={key} className={sizeClasses[Level] || sizeClasses.h2}>
                {text}
              </Level>
            );
          }

          case 'text': {
            const html = getLocalized(block.data.text, locale);
            if (!html) return null;
            return (
              <div
                key={key}
                className="prose prose-zinc dark:prose-invert max-w-none text-foreground leading-relaxed pt-2"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          }

          case 'image': {
            const imageId = block.data.image_id;
            const caption = getLocalized(block.data.caption, locale);
            let imageUrl = block.resolved_image?.url || '/media/previews/placeholder.png';

            return (
              <figure key={key} className="space-y-2.5 my-6 not-prose">
                <div className="rounded-2xl overflow-hidden border border-border bg-muted/20 relative aspect-video w-full max-w-2xl mx-auto shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt={caption || 'Article Image'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = '/media/previews/placeholder.png';
                    }}
                  />
                </div>
                {caption && (
                  <figcaption className="text-center text-xs text-muted-foreground/80 font-medium italic">
                    {caption}
                  </figcaption>
                )}
              </figure>
            );
          }

          case 'quote': {
            const text = getLocalized(block.data.text, locale);
            const author = block.data.author;
            if (!text) return null;

            return (
              <div key={key} className="my-6 border-l-4 border-primary pl-4 py-1.5 bg-muted/20 rounded-r-xl">
                <p className="text-lg italic font-medium text-foreground">{text}</p>
                {author && (
                  <cite className="block text-xs font-semibold text-muted-foreground mt-2 not-italic">
                    — {author}
                  </cite>
                )}
              </div>
            );
          }

          case 'entity_showcase': {
            const resolved = block.resolved_data || [];
            const entityType = block.data.entity_type || 'race';
            const displayStyle = block.data.display_style || 'grid';
            const cols = block.data.columns || 4;
            const showPrice = block.data.settings?.show_price !== false;

            if (resolved.length === 0) return null;

            const gridColMap = {
              1: "grid-cols-1",
              2: "grid-cols-1 sm:grid-cols-2",
              3: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
              4: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
              5: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
              6: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
            };
            const basisMap = {
              1: "basis-full",
              2: "basis-full sm:basis-1/2",
              3: "basis-full sm:basis-1/2 md:basis-1/3",
              4: "basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4",
              5: "basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5",
              6: "basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6"
            };
            const gridClass = gridColMap[cols] || gridColMap[4];
            const basisClass = basisMap[cols] || basisMap[4];

            return (
              <div key={key} className="my-8 not-prose space-y-4">
                {displayStyle === 'carousel' ? (
                  <div className="relative px-8">
                    <Carousel className="w-full">
                      <CarouselContent className="-ml-4">
                        {resolved.map((item) => (
                          <CarouselItem className={cn("pl-4", basisClass)} key={item.id}>
                            <EntityCard item={item} type={entityType} showPrice={showPrice} locale={locale} />
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious className="-left-4 bg-card/80 border-border" />
                      <CarouselNext className="-right-4 bg-card/80 border-border" />
                    </Carousel>
                  </div>
                ) : (
                  <div className={cn("grid gap-6", gridClass)}>
                    {resolved.map((item) => (
                      <EntityCard key={item.id} item={item} type={entityType} showPrice={showPrice} locale={locale} />
                    ))}
                  </div>
                )}
              </div>
            );
          }

          default:
            return null;
        }
      })}
    </div>
  );
}
