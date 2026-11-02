'use client'

import { useEffect, useState } from 'react'

export interface TickerNote {
  key: string
  note: string
}

const ROTATE_MS = 7000

/**
 * One rating note at a time, rotating through the newest few. A single bubble keeps the
 * current-beer card from overflowing on a 1080p projector, however many notes come in.
 * Anonymous on purpose: guessing who wrote what is half the fun.
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
      className="w-full rounded-2xl rounded-bl-sm bg-cream px-5 py-3 text-left text-ink animate-in fade-in slide-in-from-bottom-2 duration-700"
    >
      <blockquote className="text-2xl leading-snug line-clamp-3">„{current.note}“</blockquote>
      {notes.length > 1 && (
        <figcaption className="mt-1 text-right text-base tabular-nums text-ink-soft" aria-hidden>
          {(index % notes.length) + 1}/{notes.length}
        </figcaption>
      )}
    </figure>
  )
}
