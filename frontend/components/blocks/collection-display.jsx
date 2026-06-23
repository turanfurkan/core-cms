import Link from 'next/link';
import { CardPost, CardProject, CardWork } from '@/partials/cards';

export default function CollectionDisplay({ data, locale = 'tr' }) {
  const fields = data?.data || {};
  const sectionTitle = getLocalized(fields.section_title, locale);
  const layoutStyle = fields.layout_style || 'grid';
  const targetType = fields.target_content_type_id || 'blog';
  
  // Hydrated data is fetched/embedded by Laravel resource
  const items = data?.hydrated_data || [];

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-muted/20 border-y border-border/50">
      <div className="container mx-auto px-6 space-y-10">
        {sectionTitle && (
          <div className="flex justify-between items-end border-b border-border pb-4">
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
              {sectionTitle}
            </h2>
            <Link
              href={`/${targetType}`}
              className="text-primary hover:underline font-semibold text-sm transition-colors"
            >
              Tümünü Gör →
            </Link>
          </div>
        )}

        {layoutStyle === 'carousel' ? (
          // Horizontal scrolling carousel layout
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-border scroll-smooth">
            {items.map((item) => (
              <div key={item.id} className="min-w-[280px] sm:min-w-[320px] max-w-[350px]">
                <CollectionItemCard item={item} targetType={targetType} locale={locale} />
              </div>
            ))}
          </div>
        ) : (
          // Responsive grid layout
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <CollectionItemCard key={item.id} item={item} targetType={targetType} locale={locale} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function CollectionItemCard({ item, targetType, locale }) {
  const entryData = item.data || {};
  const title = getLocalized(entryData.title || entryData.name || item.title || 'Untitled', locale);
  const description = getLocalized(entryData.summary || entryData.description || '', locale);
  const slug = entryData.slug || item.slug;
  const imageUrl = getFeaturedImageUrl(entryData);

  const date = item.published_at
    ? new Date(item.published_at).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : null;

  const detailUrl = `/${targetType}/${slug}`;

  // 1. Render CardPost for Blog type
  if (targetType === 'blog') {
    return (
      <CardPost
        image={imageUrl || '1.jpg'}
        label="Blog"
        description={title}
        time={date || 'Yeni'}
        href={detailUrl}
        labelHref={`/${targetType}`}
      />
    );
  }

  // 2. Render CardProject for Project type
  if (targetType === 'projects' || targetType === 'services') {
    return (
      <CardProject
        logo={imageUrl || 'brand-1.png'}
        name={title}
        description={description}
        startDate={date || 'Başlangıç'}
        endDate="Güncel"
        status={{ label: 'Aktif', variant: 'badge-success' }}
        progress={{ value: 100, variant: 'bg-success' }}
        team={{ group: [] }}
        href={detailUrl}
      />
    );
  }

  // 3. Fallback / Render CardWork for general Works/Portfolio items
  return (
    <CardWork
      image={imageUrl || '21.jpg'}
      title={title}
      authorName="Yazar"
      authorAvatar="/media/avatars/300-1.png"
      likes={12}
      comments={3}
      href={detailUrl}
    />
  );
}

// Localized helper
function getLocalized(val, locale) {
  if (val && typeof val === 'object') {
    return val[locale] || val['tr'] || val['en'] || Object.values(val)[0] || '';
  }
  return val || '';
}

// Helper to look for nested image objects
function getFeaturedImageUrl(entryData) {
  // First check if there is an explicit key containing image
  const coverImage = entryData.cover_image || entryData.image || entryData.photo;
  if (coverImage && coverImage.url) {
    return coverImage.url;
  }
  
  // Or check first media array item
  const gallery = entryData.gallery;
  if (Array.isArray(gallery) && gallery.length > 0 && gallery[0].url) {
    return gallery[0].url;
  }

  // Fallback search
  const imageField = Object.values(entryData).find(
    (val) => val && typeof val === 'object' && val.url
  );
  return imageField ? imageField.url : null;
}
