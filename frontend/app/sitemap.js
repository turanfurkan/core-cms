import { backendFetch } from '@/lib/api-server';

export default async function sitemap() {
  try {
    const res = await backendFetch('/api/seo/sitemap');
    if (!res.ok) {
      console.error('Sitemap API response not ok:', res.status);
      return [];
    }

    const data = await res.json();
    const routes = data.routes || [];

    const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || 'http://localhost:3000';

    return routes.map((route) => ({
      url: `${baseUrl}${route.path}`,
      lastModified: route.lastmod ? new Date(route.lastmod) : new Date(),
      changeFrequency: route.changefreq || 'weekly',
      priority: Number(route.priority) || 0.7,
    }));
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return [];
  }
}
