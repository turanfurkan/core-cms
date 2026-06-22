import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { backendFetch } from '@/lib/api-server';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Invalid input.' }, { status: 400 });
    }

    const response = await backendFetch(`/api/admin/users/${id}/restore`, {
      method: 'POST',
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Failed to restore user on backend.' },
        { status: response.status }
      );
    }

    const user = data.user;
    if (user) {
      let mappedStatus = 'INACTIVE';
      if (user.status === 'active') mappedStatus = 'ACTIVE';
      else if (user.status === 'blocked') mappedStatus = 'BLOCKED';
      else if (user.status === 'suspended') mappedStatus = 'INACTIVE';
      user.status = mappedStatus;
    }

    return NextResponse.json(
      {
        message: 'User successfully restored.',
        user,
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
