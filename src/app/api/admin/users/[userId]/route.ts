import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateUserSchema, validateInput } from '@/lib/validation';
import { authErrorResponse, isEnvAdminEmail, requireAdmin } from '@/lib/auth';

// PATCH /api/admin/users/[userId] - Change roles or display name
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const admin = await requireAdmin();

    const body = await request.json();
    const validation = validateInput(updateUserSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { isLeader, isAdmin, name } = validation.data;

    if (isAdmin === false) {
      if (target.id === admin.id) {
        return NextResponse.json({ error: 'You cannot remove your own admin role' }, { status: 400 });
      }
      if (isEnvAdminEmail(target.email)) {
        return NextResponse.json({ error: 'This admin is set by ADMIN_EMAILS and cannot be demoted here' }, { status: 400 });
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isLeader, isAdmin, name: name?.trim() }
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        isLeader: user.isLeader,
        isAdmin: user.isAdmin
      }
    });

  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[userId] - Delete user (ratings are preserved)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const admin = await requireAdmin();

    if (userId === admin.id) {
      return NextResponse.json({ error: 'You cannot delete yourself' }, { status: 400 });
    }

    // Due to onDelete: SetNull on Participant.userId,
    // the participant records will remain but with userId = null
    // Ratings remain connected to participants
    await prisma.user.delete({
      where: { id: userId }
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully. Ratings have been preserved.'
    });

  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
