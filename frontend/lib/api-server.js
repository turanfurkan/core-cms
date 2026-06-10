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
    ...(init.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...init,
    headers,
  });
}
