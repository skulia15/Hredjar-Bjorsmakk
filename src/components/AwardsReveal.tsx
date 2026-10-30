'use client'

import { useEffect, useState } from 'react'
import type { Award } from '@/lib/stats'

const REVEAL_INTERVAL_MS = 4000

interface AwardsRevealProps {
  awards: Award[]
  winnerName?: string
  onClose: () => void
}

/**
 * Full-screen projector overlay that reveals awards one card at a time.
 * Click (or space/arrow) skips ahead, Escape closes.
 */
export function AwardsReveal({ awards, winnerName, onClose }: AwardsRevealProps) {
  const [revealed, setRevealed] = useState(0)
  const done = revealed >= awards.length

  useEffect(() => {
    if (done) return
    // First card comes quickly, the rest on a steady beat
    const timer = setTimeout(() => setRevealed(r => r + 1), revealed === 0 ? 1500 : REVEAL_INTERVAL_MS)
    return () => clearTimeout(timer)
  }, [revealed, done])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === ' ' || e.key === 'ArrowRight') setRevealed(r => Math.min(r + 1, awards.length))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [awards.length, onClose])

  return (
    <div
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur flex flex-col items-center justify-center p-8 cursor-pointer"
      onClick={() => (done ? onClose() : setRevealed(r => r + 1))}
    >
      <h1 className="text-5xl font-bold mb-2">🏅 Verðlaunaafhending</h1>
      {winnerName && (
        <p className="text-2xl text-muted-foreground mb-10">Sigurvegari kvöldsins: <span className="font-bold text-primary">{winnerName}</span></p>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-6 w-full max-w-7xl">
        {awards.map((award, index) => (
          <div
            key={award.title}
            className={`bg-card rounded-2xl border-2 p-6 text-center transition-all duration-700 ${
              index < revealed
                ? 'opacity-100 scale-100 border-primary'
                : 'opacity-10 scale-95 border-border'
            }`}
          >
            <div className="text-6xl mb-3">{index < revealed ? award.emoji : '❓'}</div>
            <div className="text-lg text-muted-foreground uppercase tracking-wide">{award.title}</div>
            <div className="text-3xl font-bold mt-2 break-words">{index < revealed ? award.main : '…'}</div>
            <div className="text-lg text-muted-foreground mt-2">{index < revealed ? award.sub : ''}</div>
          </div>
        ))}
      </div>

      <p className="mt-10 text-sm text-muted-foreground">
        {done ? 'Smelltu til að loka' : 'Smelltu eða ýttu á bil til að sýna næstu verðlaun • Esc til að loka'}
      </p>
    </div>
  )
}
