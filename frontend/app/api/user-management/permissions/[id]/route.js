import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { backendFetch } from '@/lib/api-server';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';

// GET: Fetch a specific permission by ID
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });
    }

    const { id } = await params;
    const response = await backendFetch(`/api/admin/permissions/${id}`);
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Failed to fetch permission from backend.' },
        { status: response.status }
      );
    }

    return NextResponse.json(data.data);
  } catch (error) {
    return NextResponse.json(
      { message: error.message || 'Oops! Something went wrong.' },
      { status: 500 }
    );
  }
}

// PUT: Edit a specific permission by ID
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ message: 'Invalid input.' }, { status: 400 });
    }

    const body = await request.json();

    const response = await backendFetch(`/api/admin/permissions/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: body.name,
        description: body.description,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Failed to update permission on backend.' },
        { status: response.status }
      );
    }

    return NextResponse.json(data.data);
  } catch (error) {
    return NextResponse.json(
      { message: error.message || 'Oops! Something went wrong.' },
      { status: 500 }
    );
  }
}

// DELETE: Remove a specific permission by ID
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ message: 'Invalid input.' }, { status: 400 });
    }

    const response = await backendFetch(`/api/admin/permissions/${id}`, {
      method: 'DELETE',
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Failed to delete permission on backend.' },
        { status: response.status }
      );
    }

    return NextResponse.json({ message: 'Permission deleted successfully.' });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || 'Oops! Something went wrong.' },
      { status: 500 }
    );
  }
}
