import { NextResponse } from 'next/server';
import { verifyRecaptchaToken } from '@/lib/recaptcha';
import { sendEmail } from '@/services/send-email';
import { backendFetch } from '@/lib/api-server';

export async function POST(req) {
  try {
    const recaptchaToken = req.headers.get('x-recaptcha-token');

    if (!recaptchaToken) {
      return NextResponse.json(
        { message: 'Please complete the reCAPTCHA verification.' },
        { status: 400 }
      );
    }

    const isValidToken = await verifyRecaptchaToken(recaptchaToken);

    if (!isValidToken) {
      return NextResponse.json(
        { message: 'reCAPTCHA verification failed. Please try again.' },
        { status: 400 }
      );
    }

    const { email } = await req.json();

    const response = await backendFetch('/api/auth/frontend/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Failed to process request.' },
        { status: response.status }
      );
    }

    // If a token was generated, send the email
    if (data.token && data.user) {
      const resetUrl = `${process.env.NEXTAUTH_URL}/change-password?token=${data.token}`;

      await sendEmail({
        to: data.user.email,
        subject: 'Password Reset Request',
        content: {
          title: `Hello, ${data.user.name}`,
          subtitle: 'You requested a password reset. Click the below link to reset your password',
          buttonLabel: 'Reset password',
          buttonUrl: resetUrl,
          description: 'This link is valid for 1 hour. If you did not request this email you can safely ignore it.',
        },
      });
    }

    return NextResponse.json(
      {
        message: 'If an account with that email exists, a password reset link has been sent.',
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('Password reset error:', err);
    return NextResponse.json(
      { message: 'Failed to process request.' },
      { status: 500 }
    );
  }
}
