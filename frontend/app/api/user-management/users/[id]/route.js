import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { backendFetch } from '@/lib/api-server';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';

// GET: Fetch a specific user by ID
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });
    }

    const { id } = await params;
    const response = await backendFetch(`/api/admin/users/${id}`);
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Failed to fetch user from backend.' },
        { status: response.status }
      );
    }

    // Unwrap Laravel API Resource wrapping
    return NextResponse.json(data.data);
  } catch (error) {
    return NextResponse.json(
      { message: error.message || 'Something went wrong.' },
      { status: 500 }
    );
  }
}

// PUT: Edit a specific user by ID
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, status, roleId } = body;

    if (!id || !name || !status || !roleId) {
      return NextResponse.json({ message: 'Invalid input.' }, { status: 400 });
    }

    // Convert roleId to Spatie role name
    const rolesRes = await backendFetch('/api/admin/roles');
    const rolesData = await rolesRes.json();

    if (!rolesRes.ok) {
      return NextResponse.json(
        { message: 'Failed to fetch roles from backend.' },
        { status: rolesRes.status }
      );
    }

    const matchedRole = rolesData.data.find((r) => String(r.id) === String(roleId));
    const roleSlug = matchedRole ? matchedRole.slug : 'user';

    const response = await backendFetch(`/api/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name,
        status,
        role: roleSlug,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Failed to update user on backend.' },
        { status: response.status }
      );
    }

    return NextResponse.json(
      { message: 'User profile successfully updated.' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: error.message || 'Something went wrong.' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a user by ID
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });
    }

    const { id } = await params;
    const response = await backendFetch(`/api/admin/users/${id}`, {
      method: 'DELETE',
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Failed to delete user on backend.' },
        { status: response.status }
      );
    }

    return NextResponse.json(
      { message: 'User successfully deleted.' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: error.message || 'Something went wrong.' },
      { status: 500 }
    );
  }
}
