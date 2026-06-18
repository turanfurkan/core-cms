import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { backendFetch } from '@/lib/api-server';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '15';
    const search = searchParams.get('search') || '';
    const logName = searchParams.get('log_name') || '';
    const event = searchParams.get('event') || '';

    // Build query params for Laravel API
    const params = new URLSearchParams({
      page,
      limit,
      search,
      log_name: logName,
      event,
    });

    const response = await backendFetch(`/api/admin/activity-logs?${params.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Error fetching activity logs from backend.' },
        { status: response.status }
      );
    }

    // Transform Laravel pagination to Next.js expectation
    return NextResponse.json({
      data: data.data,
      pagination: {
        total: data.meta?.total || 0,
        page: data.meta?.current_page ? parseInt(data.meta.current_page, 10) : parseInt(page, 10),
        limit: data.meta?.per_page ? parseInt(data.meta.per_page, 10) : parseInt(limit, 10),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || 'Something went wrong.' },
      { status: 500 }
    );
  }
}
