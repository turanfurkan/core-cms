import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api-server';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const queryString = searchParams.toString();
    
    // Server-to-server secure request to backend public categories endpoint
    const targetUrl = `/api/categories${queryString ? `?${queryString}` : ''}`;
    const response = await backendFetch(targetUrl);
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Error fetching categories' },
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
