import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateUserSchema, validateInput } from '@/lib/validation';
import { requireAdminSession } from '@/lib/session';

// PATCH /api/admin/users/[userId] - Update user (promote/demote leader)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // Verify admin session
    await requireAdminSession();

    const body = await request.json();
    const validation = validateInput(updateUserSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { isLeader } = validation.data;

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isLeader }
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        isLeader: user.isLeader
      }
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
