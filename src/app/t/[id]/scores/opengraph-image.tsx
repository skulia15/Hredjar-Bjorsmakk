import { ImageResponse } from 'next/og'
import { renderShareCard, SHARE_CARD_SIZE } from '@/lib/shareCard'

// Link preview when someone pastes the scores link into a group chat
export const alt = 'Niðurstöður bjórsmökkunar'
export const size = SHARE_CARD_SIZE
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const card = await renderShareCard(id)
  // A preview must be an image; unknown tastings get the plain logo card
  return card ?? new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#123A2C', color: '#FBF6EA', fontSize: 64, fontWeight: 700 }}>
        Hreðjar Bjórsmakk
      </div>
    ),
    size
  )
}
