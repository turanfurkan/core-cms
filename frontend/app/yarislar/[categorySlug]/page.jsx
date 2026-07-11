import { notFound } from 'next/navigation';
import { getPublicSettings, getPublicNavigation, backendFetch } from '@/lib/api-server';
import PublicHeader from '@/components/common/public-header';
import PublicFooter from '@/components/common/public-footer';
import PageHeader from '@/components/common/page-header';
import { Container } from '@/components/common/container';
import RaceListGrid from '@/app/kategori/[slug]/components/race-list-grid';

export const dynamic = 'force-dynamic';

function getLocalized(val, locale = 'tr') {
  if (val && typeof val === 'object') {
    return val[locale] || val['tr'] || val['en'] || Object.values(val)[0] || '';
  }
  return val || '';
}

async function getCategoryBySlug(slug) {
  try {
    const res = await backendFetch(`/api/categories?slug=${encodeURIComponent(slug)}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data?.[0] || null;
  } catch (e) {
    console.error('Error loading category:', e);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { categorySlug } = await params;
  const category = await getCategoryBySlug(categorySlug);
  if (!category) {
    return { title: 'Kategori | Core CMS' };
  }

  const name = getLocalized(category.name, 'tr');
  return {
    title: `${name} Yarışları | Core CMS`,
    description: getLocalized(category.description, 'tr'),
  };
}

export default async function CategoryPage({ params }) {
  const { categorySlug } = await params;
  const category = await getCategoryBySlug(categorySlug);
  if (!category || category.type !== 'race') {
    notFound();
  }

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

  const categoryName = getLocalized(category.name, 'tr');
  const categoryDesc = getLocalized(category.description, 'tr');
  const races = category.races || [];

  return (
    <div className="w-full min-h-screen bg-background text-foreground flex flex-col justify-between">
      <div>
        <PublicHeader settings={settings} menuItems={headerMenuItems} />
        
        <main className="space-y-10 pb-16">
          <PageHeader 
            title={categoryName}
            description={categoryDesc}
            breadcrumbs={[
              { label: 'Yarışlar', href: '/yarislar' },
              { label: categoryName }
            ]}
          />

          <Container>
            <RaceListGrid races={races} categorySlug={categorySlug} />
          </Container>
        </main>
      </div>
      <PublicFooter settings={settings} menuItems={footerMenuItems} />
    </div>
  );
}
