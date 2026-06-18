import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { backendFetch } from '@/lib/api-server';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';

    const params = new URLSearchParams({
      page,
      limit,
    });

    const response = await backendFetch(`/api/admin/api-keys?${params.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Error fetching API keys from backend.' },
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

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });
    }

    const body = await request.json();
    const { name, scopes, expires_at, is_active } = body;

    if (!name) {
      return NextResponse.json({ message: 'Name is required.' }, { status: 400 });
    }

    const response = await backendFetch('/api/admin/api-keys', {
      method: 'POST',
      body: JSON.stringify({
        name,
        scopes: scopes || [],
        expires_at: expires_at || null,
        is_active: is_active ?? true,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Failed to create API key on backend.' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || 'Something went wrong.' },
      { status: 500 }
    );
  }
}
