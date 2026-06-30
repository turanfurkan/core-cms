import { notFound } from 'next/navigation';
import { backendFetch, getSeoMetadata, getPublicSettings, getPublicNavigation, getContentEntries } from '@/lib/api-server';
import { Container } from '@/components/common/container';
import PublicHeader from '@/components/common/public-header';
import PublicFooter from '@/components/common/public-footer';
import MaintenanceScreen from '@/components/common/maintenance-screen';
import PostDetailView from '@/components/common/post-detail-view';

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

// Generate dynamic metadata via the backend SEO resolver
export async function generateMetadata({ params }) {
  const { contentTypeSlug, entrySlug } = await params;
  const path = `/${contentTypeSlug}/${entrySlug}`;
  
  const seo = await getSeoMetadata(path);
  if (seo) {
    return seo;
  }

  const settings = await getPublicSettings();
  const rawSiteName = settings['site.name'];
  const siteName = getLocalizedValue(rawSiteName, 'tr') || 'Core CMS';

  // Fallback to title from URL
  const prettyTitle = entrySlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    title: `${prettyTitle} | ${siteName}`,
  };
}

export default async function Page({ params }) {
  const { contentTypeSlug, entrySlug } = await params;

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

  let entry;
  try {
    const res = await backendFetch(`/api/content/delivery/${contentTypeSlug}/${entrySlug}`);
    if (!res.ok) {
      notFound();
    }
    const json = await res.json();
    entry = json.data;
  } catch (error) {
    console.error('Error fetching dynamic content entry:', error);
    notFound();
  }

  if (!entry) {
    notFound();
  }

  // Fetch related/suggested posts of the same content type
  let suggestedEntries = [];
  try {
    const relatedRes = await getContentEntries(contentTypeSlug, { page: 1, limit: 4 });
    if (relatedRes && Array.isArray(relatedRes.data)) {
      suggestedEntries = relatedRes.data.filter(e => e.id !== entry.id).slice(0, 3);
    }
  } catch (err) {
    console.error('Error fetching suggested entries:', err);
  }

  return (
    <div className="w-full min-h-screen bg-background text-foreground flex flex-col justify-between">
      <div>
        {/* Dynamic Header */}
        <PublicHeader settings={settings} menuItems={headerMenuItems} />

        {/* Main Content Area */}
        <main className="py-12">
          <Container>
            <PostDetailView entry={entry} locale="tr" suggestedEntries={suggestedEntries} />
          </Container>
        </main>
      </div>

      {/* Dynamic Footer */}
      <PublicFooter settings={settings} menuItems={footerMenuItems} />
    </div>
  );
}
