import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { backendFetch } from '@/lib/api-server';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';

// GET: Fetch list of navigations from backend
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '15';

    const params = new URLSearchParams({
      page,
      limit,
    });

    const response = await backendFetch(`/api/admin/navigations?${params.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Failed to fetch navigations from backend.' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      data: data.data,
      pagination: {
        total: data.meta?.total || 0,
        page: data.meta?.current_page ? parseInt(data.meta.current_page, 10) : parseInt(page, 10),
        limit: data.meta?.per_page ? parseInt(data.meta.per_page, 10) : parseInt(limit, 10),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || 'Something went wrong.' },
      { status: 500 }
    );
  }
}

// POST: Create a new navigation menu
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });
    }

    const body = await request.json();
    const { name, key, is_active } = body;

    if (!name || !key) {
      return NextResponse.json({ message: 'Name and key are required fields.' }, { status: 400 });
    }

    const response = await backendFetch('/api/admin/navigations', {
      method: 'POST',
      body: JSON.stringify({
        name,
        key,
        is_active: is_active !== undefined ? is_active : true,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Failed to create navigation menu.' },
        { status: response.status }
      );
    }

    return NextResponse.json(
      {
        message: 'Navigation menu successfully created.',
        data: data.data || data,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: error.message || 'Something went wrong.' },
      { status: 500 }
    );
  }
}
