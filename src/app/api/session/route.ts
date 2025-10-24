import { NextResponse } from 'next/server';
import { getParticipantFromSession } from '@/lib/session';

// GET /api/session - Get current user session info
export async function GET() {
  try {
    const participant = await getParticipantFromSession();

    if (!participant) {
      return NextResponse.json({ hasSession: false }, { status: 200 });
    }

    return NextResponse.json({
      hasSession: true,
      name: participant.user?.name,
      userId: participant.userId
    });
  } catch (error) {
    console.error('Error getting session:', error);
    return NextResponse.json(
      { error: 'Failed to get session' },
      { status: 500 }
    );
  }
}
