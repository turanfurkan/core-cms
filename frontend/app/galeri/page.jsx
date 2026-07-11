import { getPublicSettings, getPublicNavigation } from '@/lib/api-server';
import PublicHeader from '@/components/common/public-header';
import PublicFooter from '@/components/common/public-footer';
import PageHeader from '@/components/common/page-header';
import GalleryClient from './components/gallery-client';

export const dynamic = 'force-dynamic';

async function getRaceCategories() {
  try {
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
    const apiKey = process.env.BACKEND_API_KEY;
    const url = `${backendUrl}/api/categories?type=race`;
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'X-API-Key': apiKey || '',
      },
      next: { revalidate: 60 } // Cache categories for 60 seconds
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (e) {
    console.error('Error fetching race categories for gallery:', e);
    return [];
  }
}

export async function generateMetadata() {
  const settings = await getPublicSettings();
  const rawSiteName = settings['site.name'];
  const siteName = typeof rawSiteName === 'object' ? (rawSiteName?.tr || 'Core CMS') : 'Core CMS';
  
  return {
    title: `Fotoğraf Galerisi | ${siteName}`,
    description: 'SporFest festival ve yarışlarından en özel anlar ve fotoğraf albümleri.',
  };
}

export default async function GalleryPage() {
  const settings = await getPublicSettings();
  const categories = await getRaceCategories();
  
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
            title="FOTOĞRAF GALERİSİ"
            description="Festivallerimizden, yarış parkurlarımızdan ve sporcularımızın heyecan dolu anlarından kareler."
            breadcrumbs={[{ label: 'Galeri' }]}
          />

          {/* Interactive Dynamic Gallery Client */}
          <GalleryClient 
            categories={categories}
            locale="tr" 
          />
        </main>
      </div>
      <PublicFooter settings={settings} menuItems={footerMenuItems} />
    </div>
  );
}
