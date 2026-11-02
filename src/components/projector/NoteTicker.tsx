'use client'

import { useEffect, useState } from 'react'
import { ParticipantAvatar } from '@/components/ChristmasAvatar'

export interface TickerNote {
  key: string
  avatar?: string | null
  note: string
}

const ROTATE_MS = 7000

/**
 * One rating note at a time, rotating through the newest few. A single bubble keeps the
 * current-beer card from overflowing on a 1080p projector, however many notes come in.
 */
export function NoteTicker({ notes }: { notes: TickerNote[] }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (notes.length < 2) return
    const timer = setInterval(() => setIndex(i => i + 1), ROTATE_MS)
    return () => clearInterval(timer)
  }, [notes.length])

  if (notes.length === 0) return null
  const current = notes[index % notes.length]

  return (
    <figure
      // Remount per note so each one fades in
      key={current.key}
      className="w-full flex items-center gap-3.5 rounded-2xl rounded-bl-sm bg-cream px-4 py-3 text-left text-ink animate-in fade-in slide-in-from-bottom-2 duration-700"
    >
      <ParticipantAvatar
        avatar={current.avatar}
        seed={current.key}
        className="w-14 h-14 2xl:w-16 2xl:h-16 shrink-0 shadow-sm"
      />
      <div className="min-w-0 flex-1">
        <blockquote className="text-xl 2xl:text-2xl leading-snug line-clamp-3">„{current.note}“</blockquote>
        {notes.length > 1 && (
          <figcaption className="mt-1 text-right text-base tabular-nums text-ink-soft" aria-hidden>
            {(index % notes.length) + 1}/{notes.length}
          </figcaption>
        )}
      </div>
    </figure>
  )
}
