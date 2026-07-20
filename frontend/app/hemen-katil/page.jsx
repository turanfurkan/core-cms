import { getPublicSettings, getPublicNavigation, backendFetch } from '@/lib/api-server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import RegistrationFlow from './components/registration-flow';

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

async function getRaceCategories() {
  try {
    // Use same endpoint as category page with type=race filter
    const res = await backendFetch('/api/categories?type=race');
    if (!res.ok) {
      console.error('Failed to fetch race categories');
      return [];
    }
    const json = await res.json();
    const rawCategories = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
    console.log('Fetched categories from API:', rawCategories);
    
    return rawCategories;
  } catch (e) {
    console.error('Error loading race categories:', e);
    return [];
  }
}

async function getUserParticipants() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return []; // No user logged in, return empty array
    }
    const res = await backendFetch('/api/user');
    if (!res.ok) {
      console.error('Failed to fetch user data');
      return [];
    }
    const json = await res.json();
    // json.data should have participants array (from earlier search result)
    return json.data?.participants || [];
  } catch (e) {
    console.error('Error loading user participants:', e);
    return [];
  }
}

export async function generateMetadata() {
  const settings = await getPublicSettings();
  const rawSiteName = settings['site.name'];
  const siteName = getLocalizedValue(rawSiteName, 'tr') || 'Core CMS';
  return {
    title: `Hemen Katıl | ${siteName}`,
  };
}

export default async function HemenKatilPage() {
  const settings = await getPublicSettings();
  
  const logoUrl = settings['site.logo'];
  const rawSiteName = settings['site.name'];
  const siteName = getLocalizedValue(rawSiteName, 'tr') || 'Core CMS';
  
  let frontSettings = settings['frontend.system_settings'] || {};
  if (typeof frontSettings === 'string') {
    try {
      frontSettings = JSON.parse(frontSettings);
    } catch (e) {
      frontSettings = {};
    }
  }
  const logoHeight = (parseInt(frontSettings.logoHeight, 10) || 40) * 1.25;
  
  const categories = await getRaceCategories();
  const participants = await getUserParticipants();
  
  // Filter only active categories—be lenient, keep if is_active is undefined/true/1/"1"!
  const activeCategories = categories.filter(cat => {
    if (cat.is_active === undefined || cat.is_active === null) return true;
    return cat.is_active === true || cat.is_active === 1 || cat.is_active === "1";
  });
  
  console.log('Active categories:', activeCategories);
  console.log('Participants:', participants);

  return (
    <div className="w-full min-h-screen bg-background text-foreground flex flex-col justify-between">
      <main>
        <RegistrationFlow 
          logoUrl={logoUrl} 
          siteName={siteName} 
          logoHeight={logoHeight}
          categories={activeCategories}
          participants={participants}
        />
      </main>
    </div>
  );
}
