'use client'

import { useEffect, useState } from 'react'
import { CircleHelp, Medal } from 'lucide-react'
import type { Award } from '@/lib/stats'
import { AwardIcon } from '@/components/AwardIcon'
import { ParticipantAvatar } from '@/components/ChristmasAvatar'

const REVEAL_INTERVAL_MS = 4000

interface AwardsRevealProps {
  awards: Award[]
  winnerName?: string
  /** Each participant's avatar, by id, to put faces on the people awards */
  avatars?: Record<string, string | null | undefined>
  onClose: () => void
}

/**
 * Full-screen projector overlay that reveals awards one card at a time.
 * Click (or space/arrow) skips ahead, Escape closes.
 */
export function AwardsReveal({ awards, winnerName, avatars = {}, onClose }: AwardsRevealProps) {
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
      <h1 className="text-5xl font-bold mb-2 flex items-center gap-3"><Medal className="h-12 w-12 text-yellow-500" /> Verðlaunaafhending</h1>
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
            {index >= revealed ? (
              <CircleHelp className="h-16 w-16 mx-auto mb-3 text-muted-foreground" />
            ) : award.participantIds?.length ? (
              // Faces for the people awards, a pair overlapping for twins and opposites; the award's icon rides on the last
              <div className="flex justify-center mb-3">
                {award.participantIds.map((id, i) => (
                  <span key={id} className={`relative ${i > 0 ? '-ml-6' : ''}`}>
                    <ParticipantAvatar avatar={avatars[id]} seed={id} className="w-24 h-24 2xl:w-28 2xl:h-28 ring-4 ring-card shadow-md" />
                    {i === award.participantIds!.length - 1 && (
                      <span className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center ring-4 ring-card">
                        <AwardIcon kind={award.kind} className="h-5 w-5" />
                      </span>
                    )}
                  </span>
                ))}
              </div>
            ) : (
              <AwardIcon kind={award.kind} className="h-16 w-16 mx-auto mb-3 text-primary" />
            )}
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
