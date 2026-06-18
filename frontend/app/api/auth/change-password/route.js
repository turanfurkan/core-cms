import { NextResponse } from 'next/server';
import { sendEmail } from '@/services/send-email';
import { getChangePasswordApiSchema } from '@/app/(auth)/forms/change-password-schema';
import { backendFetch } from '@/lib/api-server';

export async function POST(req) {
  try {
    const body = await req.json();
    const parsedData = getChangePasswordApiSchema().safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json(
        { message: 'Invalid input. Please check your data and try again.' },
        { status: 400 }
      );
    }

    const { token, newPassword } = parsedData.data;

    const response = await backendFetch('/api/auth/frontend/change-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Password reset failed.' },
        { status: response.status }
      );
    }

    if (data.user) {
      await sendEmail({
        to: data.user.email,
        subject: 'Password Reset Successful',
        content: {
          title: `Hello, ${data.user.name}`,
          subtitle: 'Your password has been successfully updated.',
        },
      });
    }

    return NextResponse.json(
      { message: 'Password reset successful.' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: error.message || 'Password reset failed.' },
      { status: 500 }
    );
  }
}
