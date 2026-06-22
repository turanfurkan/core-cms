import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { backendFetch } from '@/lib/api-server';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ message: 'Invalid user ID.' }, { status: 400 });
    }

    // 1. Fetch user to get their email
    const userRes = await backendFetch(`/api/admin/users/${id}`);
    const userData = await userRes.json();

    if (!userRes.ok) {
      return NextResponse.json(
        { message: userData.message || 'Failed to fetch user details from backend.' },
        { status: userRes.status }
      );
    }

    const email = userData.data.email;
    if (!email) {
      return NextResponse.json({ message: 'User does not have an email address.' }, { status: 400 });
    }

    // 2. Call the forgot password endpoint on the backend
    const resetRes = await backendFetch('/api/auth/password/forgot', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    const resetData = await resetRes.json();

    if (!resetRes.ok) {
      return NextResponse.json(
        { message: resetData.message || 'Failed to send password reset link.' },
        { status: resetRes.status }
      );
    }

    return NextResponse.json(
      { message: resetData.message || 'Password reset link sent successfully.' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: error.message || 'Something went wrong.' },
      { status: 500 }
    );
  }
}
