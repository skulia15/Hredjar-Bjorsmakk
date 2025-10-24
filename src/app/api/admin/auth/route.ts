import { NextRequest, NextResponse } from 'next/server';
import { adminAuthSchema, validateInput } from '@/lib/validation';
import { validateAdmin } from '@/lib/auth';

const ADMIN_COOKIE_NAME = 'bt_admin';
const ADMIN_MAX_AGE = 86400; // 24 hours

// POST /api/admin/auth - Admin authentication
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = validateInput(adminAuthSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { name } = validation.data;

    // Validate admin credentials
    const isValid = await validateAdmin(name);

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create response with admin session cookie
    const response = NextResponse.json({
      success: true
    });

    // Set admin cookie directly on response
    response.cookies.set(ADMIN_COOKIE_NAME, 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: ADMIN_MAX_AGE,
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Error authenticating admin:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
