import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api-server';

export async function POST(req) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { message: 'Token is required.' },
        { status: 400 }
      );
    }

    const response = await backendFetch('/api/auth/frontend/reset-password-verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Invalid or expired token.' },
        { status: response.status }
      );
    }

    return NextResponse.json({ message: 'Token is valid.' }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || 'Token verification failed.' },
      { status: 500 }
    );
  }
}
