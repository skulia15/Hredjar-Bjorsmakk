import { NextRequest, NextResponse } from 'next/server';
import { adminAuthSchema, validateInput } from '@/lib/validation';
import { validateAdmin } from '@/lib/auth';
import { createAdminSession } from '@/lib/session';

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

    // Create admin session
    await createAdminSession();

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    console.error('Error authenticating admin:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
