import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ADMIN_COOKIE_NAME = 'bt_admin';

// GET /api/admin/check - Check if current user has admin session
export async function GET(request: NextRequest) {
  try {
    // Check for admin cookie
    const cookieStore = await cookies();
    const adminCookie = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    const isAdmin = adminCookie === 'true';

    console.log('[Admin Check]', { adminCookie, isAdmin });

    return NextResponse.json({
      isAdmin
    });
  } catch (error) {
    console.error('Error checking admin session:', error);
    return NextResponse.json(
      { isAdmin: false },
      { status: 200 }
    );
  }
}
