import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';

/**
 * backendFetch - makes a request to the Laravel backend API,
 * automatically attaching the logged-in user's Sanctum Bearer token.
 * Can ONLY be run in Server Components, API routes, or Server Actions.
 */
export async function backendFetch(path, init = {}) {
  const session = await getServerSession(authOptions);
  const token = session?.user?.accessToken;

  const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
  const url = `${backendUrl}${path.startsWith('/') ? path : '/' + path}`;

  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(process.env.BACKEND_API_KEY ? { 'X-API-Key': process.env.BACKEND_API_KEY } : {}),
    ...(init.headers || {}),
  };

  if (init.body instanceof FormData || (init.body && typeof init.body.append === 'function')) {
    delete headers['Content-Type'];
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...init,
    headers,
  });
}

const DEFAULT_SYSTEM_SETTINGS = {
  name: 'Metronic',
  logo: null,
  active: true,
  address: '',
  websiteURL: '',
  supportEmail: '',
  supportPhone: '',
  language: 'en',
  timezone: 'UTC',
  currency: 'USD',
  currencyFormat: '$ {value}',
  socialFacebook: '',
  socialTwitter: '',
  socialInstagram: '',
  socialLinkedIn: '',
  socialPinterest: '',
  socialYoutube: '',
  notifyStockEmail: true,
  notifyStockWeb: true,
  notifyStockThreshold: 10,
  notifyStockRoleIds: [],
  notifyNewOrderEmail: true,
  notifyNewOrderWeb: true,
  notifyNewOrderRoleIds: [],
  notifyOrderStatusUpdateEmail: true,
  notifyOrderStatusUpdateWeb: true,
  notifyOrderStatusUpdateRoleIds: [],
  notifyPaymentFailureEmail: true,
  notifyPaymentFailureWeb: true,
  notifyPaymentFailureRoleIds: [],
  notifySystemErrorFailureEmail: true,
  notifySystemErrorWeb: true,
  notifySystemErrorRoleIds: [],
};

export async function getFrontendSettings() {
  try {
    const res = await backendFetch('/api/admin/settings');
    if (!res.ok) return DEFAULT_SYSTEM_SETTINGS;
    const data = await res.json();
    const item = data.data?.find(i => i.key === 'frontend.system_settings');
    return item ? { ...DEFAULT_SYSTEM_SETTINGS, ...item.value } : DEFAULT_SYSTEM_SETTINGS;
  } catch {
    return DEFAULT_SYSTEM_SETTINGS;
  }
}

export async function updateFrontendSettings(newSettings) {
  const current = await getFrontendSettings();
  const merged = { ...current, ...newSettings };
  return backendFetch('/api/admin/settings', {
    method: 'PUT',
    body: JSON.stringify({
      settings: {
        'frontend.system_settings': merged
      }
    })
  });
}

/**
 * getSeoMetadata - fetches SEO metadata for a path from Laravel and maps it to Next.js metadata structure
 */
export async function getSeoMetadata(path) {
  try {
    const res = await backendFetch(`/api/seo/metadata/resolve?path=${encodeURIComponent(path)}`);
    if (!res.ok) {
      return null;
    }
    const json = await res.json();
    const seo = json.data;
    if (!seo) return null;

    // Convert keywords string to array if it's a string
    const keywords = seo.meta_keywords
      ? seo.meta_keywords.split(',').map(k => k.trim())
      : undefined;

    return {
      title: seo.meta_title || undefined,
      description: seo.meta_description || undefined,
      keywords,
      alternatives: seo.canonical_url
        ? { canonical: seo.canonical_url }
        : undefined,
      robots: seo.meta_robots || undefined,
      openGraph: {
        title: seo.og_title || seo.meta_title || undefined,
        description: seo.og_description || seo.meta_description || undefined,
      },
    };
  } catch (error) {
    console.error('Error fetching SEO metadata:', error);
    return null;
  }
}

/**
 * getContentEntries - fetches paginated and filtered content entries for a content type slug
 */
export async function getContentEntries(contentTypeSlug, options = {}) {
  const { page = 1, limit = 15, filters = {} } = options;
  
  const queryParams = new URLSearchParams();
  queryParams.append('page', page);
  queryParams.append('limit', limit);
  
  Object.keys(filters).forEach(key => {
    if (filters[key] !== undefined && filters[key] !== null) {
      queryParams.append(`filters[${key}]`, filters[key]);
    }
  });

  const url = `/api/content/delivery/${contentTypeSlug}?${queryParams.toString()}`;

  try {
    const res = await backendFetch(url);
    if (!res.ok) {
      return null;
    }
    return res.json();
  } catch (error) {
    console.error(`Error fetching content entries for ${contentTypeSlug}:`, error);
    return null;
  }
}
