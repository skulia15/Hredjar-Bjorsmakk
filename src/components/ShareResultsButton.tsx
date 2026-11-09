'use client'

import { useEffect, useRef, useState } from 'react'
import { Share2 } from 'lucide-react'

interface ShareResultsButtonProps {
  tastingId: string
  title: string
  // Changes whenever the results do, so the prepared image is never stale
  resultsKey: string
}

/**
 * Shares the results card image to the phone's share sheet (group chat), or downloads it where files can't be shared.
 * The image is fetched ahead of the tap: iOS refuses to open the share sheet once a slow fetch has eaten the tap's user activation.
 */
export function ShareResultsButton({ tastingId, title, resultsKey }: ShareResultsButtonProps) {
  const fileRef = useRef<File | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    fileRef.current = null
    fetch(`/api/tastings/${tastingId}/share-image?k=${encodeURIComponent(resultsKey)}`)
      .then(response => (response.ok ? response.blob() : null))
      .then(blob => {
        if (!cancelled && blob) fileRef.current = new File([blob], 'bjorsmakk.png', { type: 'image/png' })
      })
      .catch(() => {
        // Fetched again on tap
      })
    return () => {
      cancelled = true
    }
  }, [tastingId, resultsKey])

  const share = async () => {
    setBusy(true)
    try {
      let file = fileRef.current
      if (!file) {
        const response = await fetch(`/api/tastings/${tastingId}/share-image`)
        if (!response.ok) return
        file = new File([await response.blob()], 'bjorsmakk.png', { type: 'image/png' })
        fileRef.current = file
      }

      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title })
          return
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') return
          // NotAllowedError and the like: fall back to downloading
        }
      }

      const url = URL.createObjectURL(file)
      const link = document.createElement('a')
      link.href = url
      link.download = file.name
      link.click()
      // Safari drops the download if the URL is revoked in the same tick
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      disabled={busy}
      className="inline-flex items-center gap-2 min-h-12 px-5 rounded-full bg-pine-light hover:bg-pine-line transition-colors font-semibold disabled:opacity-60"
    >
      <Share2 className="h-4 w-4" />
      Deila niðurstöðum
    </button>
  )
}
