import { NextRequest, NextResponse } from 'next/server'
import { renderShareCard } from '@/lib/shareCard'

// GET /api/tastings/[id]/share-image - Results card PNG for the share button
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const card = await renderShareCard(id)
    if (!card) return NextResponse.json({ error: 'Tasting not found' }, { status: 404 })
    return card
  } catch (error) {
    console.error('Error rendering share card:', error)
    return NextResponse.json({ error: 'Failed to render share card' }, { status: 500 })
  }
}
