import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { backendFetch, getFrontendSettings } from '@/lib/api-server';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized request' },
        { status: 401 },
      );
    }

    const settings = await getFrontendSettings();

    const rolesRes = await backendFetch('/api/admin/roles');
    const rolesData = await rolesRes.json();

    return NextResponse.json({
      settings,
      roles: rolesData.data || [],
    });
  } catch (error) {
    return NextResponse.json(
      { message: 'Oops! Something went wrong. Please try again in a moment.' + error.message },
      { status: 500 },
    );
  }
}
