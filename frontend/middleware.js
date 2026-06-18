import { NextResponse } from 'next/server';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // 1. Skip static assets, internal paths, API routes, etc.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
  const apiKey = process.env.BACKEND_API_KEY;

  try {
    const resolveUrl = `${backendUrl}/api/seo/redirects/resolve?path=${encodeURIComponent(pathname)}`;
    
    const response = await fetch(resolveUrl, {
      headers: {
        'Accept': 'application/json',
        'X-API-Key': apiKey || '',
      },
      // Cache the middleware check briefly to avoid DDOSing the backend on multiple assets/page reloads
      next: { revalidate: 60 }
    });

    if (response.ok) {
      const data = await response.json();
      const redirect = data.data;

      if (redirect && redirect.target_path && redirect.is_active) {
        const statusCode = parseInt(redirect.status_code, 10) || 302;
        
        let redirectUrl;
        try {
          redirectUrl = new URL(redirect.target_path);
        } catch {
          redirectUrl = new URL(redirect.target_path, request.url);
        }

        return NextResponse.redirect(redirectUrl, statusCode);
      }
    }
  } catch (error) {
    console.error('SEO Redirect middleware error:', error);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
