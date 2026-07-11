import { getPublicSettings, getPublicNavigation } from '@/lib/api-server';
import PublicHeader from '@/components/common/public-header';
import PublicFooter from '@/components/common/public-footer';
import PageHeader from '@/components/common/page-header';
import ContactClient from './components/contact-client';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const settings = await getPublicSettings();
  const rawSiteName = settings['site.name'];
  const siteName = typeof rawSiteName === 'object' ? (rawSiteName?.tr || 'Core CMS') : 'Core CMS';
  
  return {
    title: `İletişim | ${siteName}`,
    description: 'Bizimle iletişime geçin, festival ve yarışlar hakkında bilgi alın.',
  };
}

export default async function ContactPage() {
  const settings = await getPublicSettings();
  
  let frontSettings = settings['frontend.system_settings'] || {};
  if (typeof frontSettings === 'string') {
    try {
      frontSettings = JSON.parse(frontSettings);
    } catch (e) {
      frontSettings = {};
    }
  }

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
        <PublicHeader settings={settings} menuItems={headerMenuItems} />
        
        <main>
          {/* Page Header banner */}
          <PageHeader 
            title="İLETİŞİM"
            description="Herhangi bir sorunuz varsa veya bizimle iş birliği yapmak istiyorsanız bize ulaşmaktan çekinmeyin."
            breadcrumbs={[{ label: 'İletişim' }]}
          />

          {/* Interactive Dynamic Contact Client */}
          <ContactClient 
            settings={settings}
            locale="tr" 
          />
        </main>
      </div>
      <PublicFooter settings={settings} menuItems={footerMenuItems} />
    </div>
  );
}
