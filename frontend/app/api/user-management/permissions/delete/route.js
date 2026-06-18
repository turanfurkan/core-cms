import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { backendFetch } from '@/lib/api-server';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });
    }

    const body = await request.json();
    const { permissionIds } = body;

    if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
      return NextResponse.json({ message: 'Invalid input.' }, { status: 400 });
    }

    const response = await backendFetch('/api/admin/permissions/delete', {
      method: 'POST',
      body: JSON.stringify({
        permission_ids: permissionIds,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Failed to delete selected permissions on backend.' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      message: 'Selected permissions successfully deleted.',
    });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || 'Oops! Something went wrong.' },
      { status: 500 }
    );
  }
}
