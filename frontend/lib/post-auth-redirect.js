import { DEMO_SEGMENT_RE } from '@/lib/demo-id';

function withSearch(path, search) {
  if (!search) return path;
  const q = search.startsWith('?') ? search.slice(1) : search;
  return q ? `${path}?${q}` : path;
}

/**
 * Builds the post-sign-in path. `usePathname()` may return the browser path
 * (`/demo5/account`) or the rewritten internal path (`/account`); handle both.
 */
export function callbackPathForDemoRoute(demo, pathname, search) {
  const normalized = pathname && pathname !== '' ? pathname : '/';
  
  // Since there is no rewrite middleware, demo prefixes in paths (e.g. /demo1/...) are not valid routes.
  // We return the actual path directly (e.g. / or /account) to load pages successfully.
  return withSearch(normalized, search);
}

/** Reject open redirects; only same-origin relative paths. */
export function safeCallbackUrl(raw, fallback = '/dashboard') {
  if (raw == null || raw === '') return fallback;
  let decoded;
  try {
    decoded = decodeURIComponent(raw.trim());
  } catch {
    return fallback;
  }
  if (!decoded.startsWith('/') || decoded.startsWith('//')) {
    return fallback;
  }
  return decoded;
}
