import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { backendFetch } from '@/lib/api-server';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';

// GET: Fetch all permissions
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });
    }

    const response = await backendFetch('/api/admin/permissions');
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Failed to fetch permissions from backend.' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      data: data.data,
      pagination: {
        total: data.data.length,
        page: 1,
      },
      empty: data.data.length === 0,
    });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || 'Something went wrong.' },
      { status: 500 }
    );
  }
}
