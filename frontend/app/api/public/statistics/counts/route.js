import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api-server';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const response = await backendFetch('/api/public/statistics/counts');
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Error fetching statistics counts' },
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
