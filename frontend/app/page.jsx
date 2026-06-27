import Link from 'next/link';
import { getContentEntries, getSeoMetadata, getPublicSettings, getPublicNavigation } from '@/lib/api-server';
import { Container } from '@/components/common/container';
import BlockRenderer from '@/components/blocks/block-renderer';
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

// Generate dynamic SEO metadata for the homepage
export async function generateMetadata() {
  const settings = await getPublicSettings();
  const seo = await getSeoMetadata('/');
  if (seo) {
    return seo;
  }

  const rawSiteName = settings['site.name'];
  const siteName = getLocalizedValue(rawSiteName, 'tr') || 'Core CMS';
  
  const rawSiteDesc = settings['site.description'];
  const siteDesc = getLocalizedValue(rawSiteDesc, 'tr') || 'Core CMS ile güçlendirilmiş kurumsal web sitesi.';

  return {
    title: `Ana Sayfa - ${siteName}`,
    description: siteDesc,
  };
}

export default async function Page() {
  // Fetch system settings
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

  // Check Maintenance Mode
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

  // Fetch entries for the 'homepage' content type
  const resData = await getContentEntries('homepage', {
    page: 1,
    limit: 1,
  });

  const entry = resData?.data?.[0] || null;
  const entryData = entry?.data || {};

  // Find if there are dynamic blocks
  const blocks = entryData.dynamic_blocks || [];

  return (
    <div className="w-full min-h-screen bg-background text-foreground flex flex-col justify-between animate-fade-in">
      <div>
        {/* Dynamic Header */}
        <PublicHeader settings={settings} menuItems={headerMenuItems} />

        {/* Dynamic Blocks or Fallback */}
        <main>
          {blocks.length > 0 ? (
            <BlockRenderer blocks={blocks} locale="tr" />
          ) : (
            <div className="py-20 animate-fade-in">
              <Container className="text-center space-y-6 max-w-2xl">
                <h1 className="text-5xl font-extrabold tracking-tight">Core CMS'e Hoş Geldiniz</h1>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Ana sayfanız için henüz dinamik bloklar tanımlanmamış. CMS panelinden bölümler ekleyerek sayfanızı hemen tasarlamaya başlayabilirsiniz.
                </p>
                <div className="pt-4">
                  <a
                    href="http://localhost:3000/content-management/content-entries?type=homepage"
                    className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/95 transition-colors"
                  >
                    Bölüm Ekle & Düzenle
                  </a>
                </div>
              </Container>
            </div>
          )}
        </main>
      </div>

      {/* Dynamic Footer */}
      <PublicFooter settings={settings} menuItems={footerMenuItems} />
    </div>
  );
}
