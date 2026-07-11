import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api-server';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    
    // Server-to-server secure request to backend public media endpoint
    const response = await backendFetch(`/api/media/files/${id}`);
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Failed to fetch media details.' },
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
