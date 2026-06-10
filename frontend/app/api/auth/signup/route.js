import { NextResponse } from 'next/server';
import { verifyRecaptchaToken } from '@/lib/recaptcha';
import { getSignupSchema } from '@/app/(auth)/forms/signup-schema';

export async function POST(req) {
  try {
    const recaptchaToken = req.headers.get('x-recaptcha-token');

    if (!recaptchaToken) {
      return NextResponse.json(
        { message: 'reCAPTCHA verification required' },
        { status: 400 },
      );
    }

    const isValidToken = await verifyRecaptchaToken(recaptchaToken);

    if (!isValidToken) {
      return NextResponse.json(
        { message: 'reCAPTCHA verification failed' },
        { status: 400 },
      );
    }

    // Parse the request body as JSON.
    const body = await req.json();

    // Validate the data using safeParse.
    const result = getSignupSchema().safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          message: 'Invalid input. Please check your data and try again.',
        },
        { status: 400 },
      );
    }

    const { email, password, name } = result.data;

    // Send register request to Laravel backend
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Registration failed on backend.' },
        { status: response.status }
      );
    }

    return NextResponse.json(
      {
        message: 'Registration successful. You can now login.',
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: error.message || 'Registration failed. Please try again later.' },
      { status: 500 }
    );
  }
}
