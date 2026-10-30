'use client'

import { QRCodeSVG } from 'qrcode.react'
import { useSyncExternalStore } from 'react'

// window.location.origin is only known in the browser; null during SSR avoids a hydration mismatch
const subscribe = () => () => {}
const getOrigin = () => window.location.origin
const getServerOrigin = () => null

interface JoinQrCodeProps {
  tastingId: string
  size: number
  showUrl?: boolean
}

/**
 * Scan-to-join code for the tasting's join page. Always black on white with a quiet zone,
 * so it stays scannable on the dark and Christmas themes.
 */
export function JoinQrCode({ tastingId, size, showUrl = false }: JoinQrCodeProps) {
  const origin = useSyncExternalStore(subscribe, getOrigin, getServerOrigin)
  if (!origin) return null

  const joinUrl = `${origin}/t/${tastingId}`

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <div className="bg-white p-3 rounded-xl shadow-lg">
        <QRCodeSVG
          value={joinUrl}
          size={size}
          level="M"
          marginSize={1}
          bgColor="#ffffff"
          fgColor="#000000"
          title="Skannaðu til að taka þátt"
        />
      </div>
      {showUrl && (
        <p className="text-sm text-muted-foreground font-mono break-all text-center max-w-xs">
          {joinUrl.replace(/^https?:\/\//, '')}
        </p>
      )}
    </div>
  )
}
