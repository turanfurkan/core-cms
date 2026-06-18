import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { backendFetch } from '@/lib/api-server';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';

// GET: Fetch navigation by ID
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });
    }

    const { id } = await params;

    const response = await backendFetch(`/api/admin/navigations/${id}`);
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Failed to fetch navigation detail.' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { message: error.message || 'Something went wrong.' },
      { status: 500 }
    );
  }
}

// PUT: Update navigation and its menu items
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, key, is_active, items } = body;

    if (!name || !key) {
      return NextResponse.json({ message: 'Name and key are required fields.' }, { status: 400 });
    }

    const response = await backendFetch(`/api/admin/navigations/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name,
        key,
        is_active: is_active !== undefined ? is_active : true,
        items: items || [],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Failed to update navigation.' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      message: 'Navigation successfully updated.',
      data: data.data || data,
    });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || 'Something went wrong.' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a navigation
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });
    }

    const { id } = await params;

    const response = await backendFetch(`/api/admin/navigations/${id}`, {
      method: 'DELETE',
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Failed to delete navigation.' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      message: 'Navigation successfully deleted.',
    });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || 'Something went wrong.' },
      { status: 500 }
    );
  }
}
