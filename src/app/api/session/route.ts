import { NextResponse } from 'next/server';
import { getParticipantFromSession, canCreateTastings } from '@/lib/session';

// GET /api/session - Get current user session info
export async function GET() {
  try {
    const participant = await getParticipantFromSession();
    const canCreate = await canCreateTastings();

    if (!participant) {
      return NextResponse.json({
        hasSession: false,
        canCreateTastings: canCreate
      }, { status: 200 });
    }

    return NextResponse.json({
      hasSession: true,
      name: participant.user?.name,
      userId: participant.userId,
      canCreateTastings: canCreate
    });
  } catch (error) {
    console.error('Error getting session:', error);
    return NextResponse.json(
      { error: 'Failed to get session' },
      { status: 500 }
    );
  }
}
