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
    const limit = searchParams.get('limit') || '10';
    const query = searchParams.get('query') || '';
    const sort = searchParams.get('sort') || 'createdAt';
    const dir = searchParams.get('dir') || 'asc';
    const status = searchParams.get('status') || '';
    const roleId = searchParams.get('roleId') || '';

    let backendStatus = status;
    if (status === 'ACTIVE') backendStatus = 'active';
    else if (status === 'INACTIVE') backendStatus = 'suspended';
    else if (status === 'BLOCKED') backendStatus = 'blocked';

    // Build query params for Laravel API
    const params = new URLSearchParams({
      page,
      limit,
      query,
      sort,
      dir,
      status: backendStatus,
      role_id: roleId,
    });

    const response = await backendFetch(`/api/admin/users?${params.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Error fetching users from backend.' },
        { status: response.status }
      );
    }

    const mappedUsers = (data.data || []).map(user => {
      let mappedStatus = 'INACTIVE';
      if (user.status === 'active') mappedStatus = 'ACTIVE';
      else if (user.status === 'blocked') mappedStatus = 'BLOCKED';
      else if (user.status === 'suspended') mappedStatus = 'INACTIVE';
      return {
        ...user,
        status: mappedStatus
      };
    });

    // Transform Laravel pagination to Next.js expectation
    return NextResponse.json({
      data: mappedUsers,
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

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, roleId, phone } = body;

    if (!name || !email || !roleId) {
      return NextResponse.json({ message: 'Invalid input.' }, { status: 400 });
    }

    // Convert Next.js roleId to Spatie role name by calling Roles API
    const rolesRes = await backendFetch('/api/admin/roles');
    const rolesData = await rolesRes.json();

    if (!rolesRes.ok) {
      return NextResponse.json(
        { message: 'Failed to fetch roles from backend.' },
        { status: rolesRes.status }
      );
    }

    const matchedRole = rolesData.data.find((r) => String(r.id) === String(roleId));
    const roleSlug = matchedRole ? matchedRole.slug : 'user';

    const response = await backendFetch('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify({
        name,
        email,
        phone: phone || null,
        role: roleSlug,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Failed to create user on backend.' },
        { status: response.status }
      );
    }

    return NextResponse.json(
      {
        message: 'User successfully added.',
        user: data.user,
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
