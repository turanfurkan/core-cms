import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { backendFetch } from '@/lib/api-server';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';

// GET: Fetch all roles
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });
    }

    const response = await backendFetch('/api/admin/roles');
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Failed to fetch roles from backend.' },
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

// POST: Create a new role
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });
    }

    const body = await request.json();

    const response = await backendFetch('/api/admin/roles', {
      method: 'POST',
      body: JSON.stringify({
        name: body.name,
        slug: body.slug,
        description: body.description,
        permissions: body.permissions,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Failed to create role on backend.' },
        { status: response.status }
      );
    }

    return NextResponse.json(data.data);
  } catch (error) {
    return NextResponse.json(
      { message: error.message || 'Something went wrong.' },
      { status: 500 }
    );
  }
}
