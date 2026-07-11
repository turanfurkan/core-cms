import { notFound } from 'next/navigation';
import { getPublicPage, getSeoMetadata, getPublicSettings, getPublicNavigation } from '@/lib/api-server';
import PublicHeader from '@/components/common/public-header';
import PublicFooter from '@/components/common/public-footer';
import MaintenanceScreen from '@/components/common/maintenance-screen';
import BlockRenderer from '@/components/blocks/block-renderer';

export const dynamic = 'force-dynamic';

function getLocalizedValue(value, lang = 'tr') {
  if (!value) return '';
  if (typeof value === 'object') {
    return value[lang] || value['tr'] || value['en'] || '';
  }
  return String(value);
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const path = `/pages/${slug}`;
  
  const seo = await getSeoMetadata(path);
  if (seo) {
    return seo;
  }

  const page = await getPublicPage(slug);
  if (page) {
    const title = getLocalizedValue(page.data?.title, 'tr');
    return {
      title: `${title} | Core CMS`,
      description: getLocalizedValue(page.data?.summary, 'tr') || undefined,
    };
  }

  return {
    title: 'Sayfa | Core CMS',
  };
}

export default async function Page({ params }) {
  const { slug } = await params;

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

  const isMaintenanceMode = !!settings['site.maintenance_mode'];
  const isSiteActive = frontSettings.active !== false;

  if (isMaintenanceMode) {
    return <MaintenanceScreen settings={settings} />;
  }

  if (!isSiteActive) {
    return <MaintenanceScreen settings={settings} isOffline={true} />;
  }

  // Fetch dynamic page details
  const page = await getPublicPage(slug);
  if (!page || page.status !== 'published') {
    notFound();
  }

  const pageData = page.data || {};
  const blocks = pageData.content || [];

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

  return (
    <div className="w-full min-h-screen bg-background text-foreground flex flex-col justify-between">
      <div>
        {/* Dynamic Header */}
        <PublicHeader settings={settings} menuItems={headerMenuItems} />

        {/* Dynamic Blocks rendering via Page Builder schema */}
        <main>
          {blocks.length > 0 ? (
            <BlockRenderer blocks={blocks} locale="tr" />
          ) : (
            <div className="container mx-auto px-6 py-20 text-center text-muted-foreground">
              Sayfa içeriği bulunmamaktadır.
            </div>
          )}
        </main>
      </div>

      {/* Dynamic Footer */}
      <PublicFooter settings={settings} menuItems={footerMenuItems} />
    </div>
  );
}
