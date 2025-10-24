import { NextResponse } from 'next/server';
import { isAdminSession } from '@/lib/session';

// GET /api/admin/check - Check if current user has admin session
export async function GET() {
  try {
    const isAdmin = await isAdminSession();

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
