import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { backendFetch } from '@/lib/api-server';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized request' },
        { status: 401 },
      );
    }

    const response = await backendFetch('/api/admin/permissions');
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Failed to fetch permissions from backend.' },
        { status: response.status }
      );
    }

    // The backend returns permissions wrapped in 'data'.
    // We map Spatie permission name to both name and slug for frontend compatibility.
    const permissions = (data.data || []).map((p) => ({
      id: String(p.id),
      name: p.name,
      slug: p.slug,
    }));

    return NextResponse.json(permissions);
  } catch (error) {
    return NextResponse.json(
      { message: error.message || 'Oops! Something went wrong. Please try again in a moment.' },
      { status: 500 },
    );
  }
}
