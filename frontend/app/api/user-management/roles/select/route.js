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

    const response = await backendFetch('/api/admin/roles');
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Failed to fetch roles from backend.' },
        { status: response.status }
      );
    }

    // The backend returns role collection wrapped in 'data' field.
    // The frontend hooks expect a flat array of roles: [ { id, name }, ... ]
    const roles = (data.data || []).map((role) => ({
      id: String(role.id),
      name: role.name,
      slug: role.slug,
    }));

    return NextResponse.json(roles);
  } catch (error) {
    return NextResponse.json(
      { message: error.message || 'Oops! Something went wrong. Please try again in a moment.' },
      { status: 500 },
    );
  }
}
