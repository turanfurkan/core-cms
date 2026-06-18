import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { backendFetch } from '@/lib/api-server';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized request' },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const name = formData.get('name');
    const avatarFile = formData.get('avatarFile');
    const avatarAction = formData.get('avatarAction');

    // 1. Update Name/Email Profile
    const profileRes = await backendFetch('/api/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        email: session.user.email,
      }),
    });

    if (!profileRes.ok) {
      const errData = await profileRes.json();
      return NextResponse.json(
        { message: errData.message || 'Profile update failed.' },
        { status: profileRes.status }
      );
    }

    // 2. Handle Avatar Update
    if (avatarAction === 'save' && avatarFile && avatarFile.size > 0) {
      const avatarFormData = new FormData();
      avatarFormData.append('avatar', avatarFile);

      const avatarRes = await backendFetch('/api/profile/avatar', {
        method: 'POST',
        body: avatarFormData,
      });

      if (!avatarRes.ok) {
        const errData = await avatarRes.json();
        return NextResponse.json(
          { message: errData.message || 'Avatar upload failed.' },
          { status: avatarRes.status }
        );
      }
    }

    // Return the updated user info
    const finalProfileRes = await backendFetch('/api/profile');
    const finalData = await finalProfileRes.json();

    return NextResponse.json(finalData.data || finalData);
  } catch (error) {
    return NextResponse.json(
      { message: error.message || 'Oops! Something went wrong.' },
      { status: 500 }
    );
  }
}
