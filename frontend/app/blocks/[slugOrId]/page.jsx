import { notFound } from 'next/navigation';
import { backendFetch, getPublicSettings } from '@/lib/api-server';
import PublicHeader from '@/components/common/public-header';
import PublicFooter from '@/components/common/public-footer';
import BlockRenderer from '@/components/blocks/block-renderer';

export const dynamic = 'force-dynamic';

function slugify(text) {
  if (!text) return '';
  const map = {
    'ç': 'c', 'Ç': 'c',
    'ğ': 'g', 'Ğ': 'g',
    'ı': 'i', 'I': 'i', 'İ': 'i',
    'ö': 'o', 'Ö': 'o',
    'ş': 's', 'Ş': 's',
    'ü': 'u', 'Ü': 'u'
  };
  let str = text.toString();
  Object.keys(map).forEach(key => {
    str = str.replaceAll(key, map[key]);
  });
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

export default async function BlockPreviewPage({ params }) {
  const { slugOrId } = await params;

  // Fetch settings for header & footer configuration
  const settings = await getPublicSettings();
  
  let frontSettings = settings['frontend.system_settings'] || {};
  if (typeof frontSettings === 'string') {
    try {
      frontSettings = JSON.parse(frontSettings);
    } catch (e) {
      frontSettings = {};
    }
  }

  // Resolve Header and Footer Navigations
  const headerMenuKey = frontSettings.headerMenu || 'header';
  const footerMenuKey = frontSettings.footerMenu || '';
  
  let headerMenuItems = null;
  let footerMenuItems = null;

  const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
  const apiKey = process.env.BACKEND_API_KEY || '';

  if (headerMenuKey && headerMenuKey !== 'none_static') {
    try {
      const navResponse = await fetch(`${backendUrl}/api/navigations/${encodeURIComponent(headerMenuKey)}`, {
        headers: { 'Accept': 'application/json', 'X-API-Key': apiKey }
      });
      if (navResponse.ok) {
        const json = await navResponse.ok ? await navResponse.json() : null;
        headerMenuItems = json?.data?.items || null;
      }
    } catch (e) {
      console.error('Error fetching header menu:', e);
    }
  }

  if (footerMenuKey && footerMenuKey !== 'none_static') {
    try {
      const navResponse = await fetch(`${backendUrl}/api/navigations/${encodeURIComponent(footerMenuKey)}`, {
        headers: { 'Accept': 'application/json', 'X-API-Key': apiKey }
      });
      if (navResponse.ok) {
        const json = await navResponse.json();
        footerMenuItems = json?.data?.items || null;
      }
    } catch (e) {
      console.error('Error fetching footer menu:', e);
    }
  }

  // Fetch the Global Block
  let block = null;
  const isNumeric = /^\d+$/.test(slugOrId);

  try {
    console.log(`[BlockPreview] Fetching block for: ${slugOrId} (isNumeric: ${isNumeric})`);
    if (isNumeric) {
      const res = await backendFetch(`/api/admin/global-blocks/${slugOrId}`);
      console.log(`[BlockPreview] Fetch ID ${slugOrId} status:`, res.status);
      if (res.ok) {
        const json = await res.json();
        block = json.data;
      }
    } else {
      const res = await backendFetch('/api/admin/global-blocks');
      console.log(`[BlockPreview] Fetch list status:`, res.status);
      if (res.ok) {
        const json = await res.json();
        const blocks = json.data || [];
        console.log(`[BlockPreview] Total blocks found in DB:`, blocks.length);
        blocks.forEach(b => console.log(`  - Block ID: ${b.id}, Name: "${b.name}", Slugified: "${slugify(b.name)}"`));
        // Find matching block by slugified name
        block = blocks.find(b => slugify(b.name) === slugOrId || b.name.toLowerCase().includes(slugOrId.replace(/-/g, ' ')));
        console.log(`[BlockPreview] Matched block:`, block ? `ID ${block.id}` : 'none');
      }
    }
  } catch (error) {
    console.error('[BlockPreview] Error fetching global block for preview:', error);
  }

  if (!block) {
    notFound();
  }

  return (
    <div className="w-full min-h-screen bg-background text-foreground flex flex-col justify-between">
      <div>
        <PublicHeader settings={settings} menuItems={headerMenuItems} />
        <main className="w-full">
          <BlockRenderer blocks={[block]} />
        </main>
      </div>
      <PublicFooter settings={settings} menuItems={footerMenuItems} />
    </div>
  );
}
