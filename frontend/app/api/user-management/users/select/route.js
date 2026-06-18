import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { backendFetch } from '@/lib/api-server';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query') || '';

  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized request' },
        { status: 401 },
      );
    }

    const response = await backendFetch(`/api/admin/users?query=${encodeURIComponent(query)}&limit=100`);
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Error fetching users.' },
        { status: response.status }
      );
    }

    // Map backend User structure to frontend Select expectation
    const mapped = (data.data || []).map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      avatar: u.avatar || u.avatar_url || null,
      status: u.status,
      createdAt: u.createdAt,
    }));

    return NextResponse.json(mapped);
  } catch {
    return NextResponse.json(
      { message: 'Oops! Something went wrong. Please try again in a moment.' },
      { status: 500 },
    );
  }
}
