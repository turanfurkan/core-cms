import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getContentEntries, getSeoMetadata, getPublicSettings, getPublicNavigation } from '@/lib/api-server';
import { Container } from '@/components/common/container';
import BlockRenderer from '@/components/blocks/block-renderer';
import { CardPost, CardProject, CardWork } from '@/partials/cards';
import PublicHeader from '@/components/common/public-header';
import PublicFooter from '@/components/common/public-footer';
import MaintenanceScreen from '@/components/common/maintenance-screen';

export const dynamic = 'force-dynamic';

// Helper to resolve localized values
function getLocalizedValue(value, lang = 'tr') {
  if (!value) return '';
  if (typeof value === 'object') {
    return value[lang] || value['tr'] || value['en'] || '';
  }
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed === 'object') {
      return parsed[lang] || parsed['tr'] || parsed['en'] || '';
    }
  } catch (e) {}
  return String(value);
}

// Generate dynamic metadata for the listing page using SEO override endpoint
export async function generateMetadata({ params }) {
  const { contentTypeSlug } = await params;
  const path = `/${contentTypeSlug}`;
  
  const seo = await getSeoMetadata(path);
  if (seo) {
    return seo;
  }

  const settings = await getPublicSettings();
  const rawSiteName = settings['site.name'];
  const siteName = getLocalizedValue(rawSiteName, 'tr') || 'Core CMS';

  // Fallback title
  const prettyTitle = contentTypeSlug.charAt(0).toUpperCase() + contentTypeSlug.slice(1) + 's';
  return {
    title: `${prettyTitle} | ${siteName}`,
  };
}

export default async function Page({ params, searchParams }) {
  const { contentTypeSlug } = await params;
  const resolvedSearchParams = await searchParams;
  const page = parseInt(resolvedSearchParams.page || '1', 10);

  // Fetch settings
  const settings = await getPublicSettings();

  // Parse frontend settings
  let frontSettings = settings['frontend.system_settings'] || {};
  if (typeof frontSettings === 'string') {
    try {
      frontSettings = JSON.parse(frontSettings);
    } catch (e) {
      frontSettings = {};
    }
  }

  // Check Maintenance Mode & Site Active
  const isMaintenanceMode = !!settings['site.maintenance_mode'];
  const isSiteActive = frontSettings.active !== false;

  if (isMaintenanceMode) {
    return <MaintenanceScreen settings={settings} />;
  }

  if (!isSiteActive) {
    return <MaintenanceScreen settings={settings} isOffline={true} />;
  }

  // Fetch dynamic navigations if configured
  const headerMenuKey = frontSettings.headerMenu || 'header';
  const footerMenuKey = frontSettings.footerMenu || '';
  
  let headerMenuItems = null;
  let footerMenuItems = null;

  if (headerMenuKey && headerMenuKey !== 'none_static') {
    const nav = await getPublicNavigation(headerMenuKey);
    headerMenuItems = nav?.items || null;
  }

  if (footerMenuKey && footerMenuKey !== 'none_static') {
    const nav = await getPublicNavigation(footerMenuKey);
    footerMenuItems = nav?.items || null;
  }

  const resData = await getContentEntries(contentTypeSlug, {
    page,
    limit: 12,
  });

  if (!resData) {
    notFound();
  }

  // Laravel paginator response maps collection entries into `data`
  const entries = resData.data || [];
  const meta = resData.meta || {}; // Pagination metadata
  
  const hasPages = meta.last_page > 1;
  const currentPage = meta.current_page || page;
  const totalPages = meta.last_page || 1;

  const prettyTitle = contentTypeSlug.charAt(0).toUpperCase() + contentTypeSlug.slice(1);

  // Check if this content type should be rendered as a single page view
  const singlePageSlugs = ['homepage', 'about-us', 'contact', 'legal-pages'];
  const isSinglePage = singlePageSlugs.includes(contentTypeSlug) || 
    (entries.length === 1 && !hasPages && (entries[0].data?.dynamic_blocks || entries[0].data?.story || entries[0].data?.address));

  if (isSinglePage && entries.length > 0) {
    const entry = entries[0];
    const data = entry.data || {};
    const title = getLocalized(data.title || entry.title || prettyTitle, 'tr');
    
    // Check for dynamic blocks zone
    const blocks = data.dynamic_blocks || [];
    
    // Find cover image or map URL
    const coverImage = data.cover_image?.url || data.image?.url || null;
    
    // Extract other custom content fields
    const customFields = Object.entries(data).filter(([key, val]) => {
      return (
        key !== 'title' &&
        key !== 'slug' &&
        key !== 'dynamic_blocks' &&
        key !== 'cover_image' &&
        key !== 'image' &&
        !key.startsWith('seo_') &&
        !key.startsWith('og_') &&
        key !== 'canonical_url' &&
        key !== 'robots_meta'
      );
    });

    return (
      <div className="w-full min-h-screen bg-background text-foreground flex flex-col justify-between">
        <div>
          {/* Dynamic Header */}
          <PublicHeader settings={settings} menuItems={headerMenuItems} />

          {/* If page has dynamic blocks structure, render blocks */}
          {blocks.length > 0 ? (
            <main>
              <BlockRenderer blocks={blocks} locale="tr" />
            </main>
          ) : (
            // Custom Structured Single Page Layout (e.g. About-us, Contact)
            <main className="py-12">
              <Container className="max-w-4xl space-y-8">
                {/* Hero Banner */}
                <div className="relative rounded-2xl overflow-hidden bg-zinc-950 py-20 px-8 text-center border border-border">
                  {coverImage && (
                    <div className="absolute inset-0 z-0 opacity-30">
                      <img src={coverImage} alt={title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="relative z-10 space-y-3">
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
                      {title}
                    </h1>
                    <p className="text-zinc-300 max-w-lg mx-auto text-sm sm:text-base">
                      {prettyTitle} sayfasının güncel içerik bilgileri.
                    </p>
                  </div>
                </div>

                {/* Grid Layout of Custom Fields */}
                <div className="grid gap-6 md:grid-cols-2">
                  {customFields.map(([key, val]) => {
                    const fieldLabel = key.replace(/_/g, ' ').toUpperCase();
                    const fieldValue = getLocalized(val, 'tr');
                    
                    if (!fieldValue) return null;

                    // If it looks like HTML, render it as dangerouslySetInnerHTML
                    const isHtml = typeof fieldValue === 'string' && (fieldValue.includes('<p>') || fieldValue.includes('<br>') || fieldValue.includes('</div>'));

                    // Double column for long texts
                    const isLongText = typeof fieldValue === 'string' && fieldValue.length > 200;

                    return (
                      <div
                        key={key}
                        className={`p-6 border border-border bg-card rounded-2xl space-y-3 ${
                          isLongText ? 'md:col-span-2' : ''
                        }`}
                      >
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {fieldLabel}
                        </h3>
                        {isHtml ? (
                          <div
                            className="prose prose-zinc dark:prose-invert max-w-none text-foreground leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: fieldValue }}
                          />
                        ) : (
                          <p className="text-foreground leading-relaxed whitespace-pre-line text-lg">
                            {fieldValue}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Container>
            </main>
          )}
        </div>

        {/* Dynamic Footer */}
        <PublicFooter settings={settings} menuItems={footerMenuItems} />
      </div>
    );
  }

  // --- STANDARD COLLECTION LISTING VIEW ---
  return (
    <div className="w-full min-h-screen bg-background text-foreground flex flex-col justify-between">
      <div>
        {/* Dynamic Header */}
        <PublicHeader settings={settings} menuItems={headerMenuItems} />

        {/* Content Section */}
        <main className="py-12">
          <Container>
            <div className="space-y-8">
              <div className="border-b border-border pb-5">
                <h1 className="text-4xl font-extrabold tracking-tight text-foreground animate-fade-in">
                  {prettyTitle} Listesi
                </h1>
                <p className="text-muted-foreground mt-2">
                  En son yayınlanan {prettyTitle.toLowerCase()} içerikleri.
                </p>
              </div>

              {entries.length === 0 ? (
                <div className="py-20 text-center border border-dashed border-border rounded-xl">
                  <p className="text-muted-foreground text-lg">Yayınlanmış içerik bulunamadı.</p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {entries.map((entry) => {
                    const data = entry.data || {};
                    const title = getLocalized(data.title || data.name || entry.title || 'Untitled', 'tr');
                    const summary = getLocalized(data.summary || data.description || '', 'tr');
                    const slug = data.slug || entry.slug;
                    const date = entry.published_at 
                      ? new Date(entry.published_at).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : null;

                    // Locate featured image or media attachment
                    const imageField = Object.values(data).find(
                      (val) => val && typeof val === 'object' && val.url
                    );
                    const imageUrl = imageField ? imageField.url : null;

                    const detailUrl = `/${contentTypeSlug}/${slug}`;

                    if (contentTypeSlug === 'blog') {
                      return (
                        <div key={entry.id}>
                          <CardPost
                            image={imageUrl || '1.jpg'}
                            label="Blog"
                            description={title}
                            time={date || 'Yeni'}
                            href={detailUrl}
                            labelHref={`/${contentTypeSlug}`}
                          />
                        </div>
                      );
                    }

                    if (contentTypeSlug === 'projects' || contentTypeSlug === 'services') {
                      return (
                        <div key={entry.id}>
                          <CardProject
                            logo={imageUrl || 'brand-1.png'}
                            name={title}
                            description={summary}
                            startDate={date || 'Başlangıç'}
                            endDate="Güncel"
                            status={{ label: 'Aktif', variant: 'badge-success' }}
                            progress={{ value: 100, variant: 'bg-success' }}
                            team={{ group: [] }}
                            href={detailUrl}
                          />
                        </div>
                      );
                    }

                    return (
                      <div key={entry.id}>
                        <CardWork
                          image={imageUrl || '21.jpg'}
                          title={title}
                          authorName="Yazar"
                          authorAvatar="/media/avatars/300-1.png"
                          likes={12}
                          comments={3}
                          href={detailUrl}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination controls */}
              {hasPages && (
                <div className="flex justify-center items-center gap-4 pt-8 border-t border-border">
                  <Link
                    href={`/${contentTypeSlug}?page=${currentPage - 1}`}
                    className={`px-4 py-2 border border-border rounded-lg text-sm transition-colors ${
                      currentPage <= 1 ? 'pointer-events-none opacity-50 bg-muted' : 'hover:bg-muted'
                    }`}
                  >
                    ← Önceki
                  </Link>
                  <span className="text-sm text-muted-foreground">
                    Sayfa {currentPage} / {totalPages}
                  </span>
                  <Link
                    href={`/${contentTypeSlug}?page=${currentPage + 1}`}
                    className={`px-4 py-2 border border-border rounded-lg text-sm transition-colors ${
                      currentPage >= totalPages ? 'pointer-events-none opacity-50 bg-muted' : 'hover:bg-muted'
                    }`}
                  >
                    Sonraki →
                  </Link>
                </div>
              )}
            </div>
          </Container>
        </main>
      </div>

      {/* Dynamic Footer */}
      <PublicFooter settings={settings} menuItems={footerMenuItems} />
    </div>
  );
}

// Localized helper
function getLocalized(val, locale = 'tr') {
  if (val && typeof val === 'object') {
    return val[locale] || val['tr'] || val['en'] || Object.values(val)[0] || '';
  }
  return val || '';
}
