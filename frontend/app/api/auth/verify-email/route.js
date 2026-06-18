import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api-server';

export async function POST(req) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Token is missing' }, { status: 400 });
    }

    const response = await backendFetch('/api/auth/frontend/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Verification failed.' },
        { status: response.status }
      );
    }

    return NextResponse.json(
      { message: 'Email verified successfully!' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
