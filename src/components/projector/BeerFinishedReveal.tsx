'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { Beer as BeerIcon, Brain, Crown, ThumbsDown, ThumbsUp } from 'lucide-react'
import { CountUp } from '@/components/projector/CountUp'
import { TagCloud } from '@/components/projector/TagCloud'
import type { BeerTagCount } from '@/components/TastingNotes'
import type { Rater } from '@/lib/stats'
import type { BeerAward } from '@/lib/beerAwards'
import { BeerAwardsStrip } from '@/components/projector/BeerAwardsStrip'
import { playDrumroll, playFanfare } from '@/lib/sounds'
import { beerImageSrc } from '@/lib/beerImage'
import { formatAbv } from '@/lib/utils'

export interface FinishedBeerReveal {
  beerId: string
  name: string
  brewery: string
  abv?: number | null
  imageUrl?: string | null
  average: number
  count: number
  rank: number
  totalRanked: number
  highestRater?: Rater
  lowestRater?: Rater
  closestGuess?: { userName: string; guess: number }
  tags: BeerTagCount[]
  /** This beer's awards, as on the score reveal; empty when its scores never came out */
  awards: BeerAward[]
}

const DRUMROLL_MS = 2200
const AUTO_CLOSE_MS = 16000

function placement(rank: number, total: number) {
  if (rank === 1 && total > 1) return 'Nýr toppbjór!'
  if (rank === 1) return 'Fyrsti bjórinn á töflunni'
  return `Lendir í ${rank}. sæti af ${total}`
}

/** Full-screen moment when a beer is finished: drumroll, the average counting up, then where it landed */
export function BeerFinishedReveal({ reveal, onClose, showTags = true }: { reveal: FinishedBeerReveal; onClose: () => void; showTags?: boolean }) {
  const [phase, setPhase] = useState<'drumroll' | 'score' | 'details'>('drumroll')

  useEffect(() => {
    playDrumroll(DRUMROLL_MS)
    const toScore = setTimeout(() => setPhase('score'), DRUMROLL_MS)
    const close = setTimeout(onClose, AUTO_CLOSE_MS)
    return () => {
      clearTimeout(toScore)
      clearTimeout(close)
    }
  }, [onClose])

  const showDetails = useCallback(() => {
    playFanfare()
    setPhase('details')
  }, [])

  const isTop = reveal.rank === 1 && reveal.totalRanked > 1
  const hasAwards = reveal.awards.length > 0
  const differentRaters = !hasAwards && reveal.highestRater && reveal.lowestRater && reveal.highestRater.score !== reveal.lowestRater.score

  return (
    <div
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur flex flex-col items-center justify-center p-8 cursor-pointer animate-in fade-in duration-500"
      onClick={onClose}
    >
      <div className="flex flex-col items-center text-center max-w-7xl w-full space-y-6">
        <p className="text-2xl uppercase tracking-widest text-muted-foreground">Bjór kláraður</p>

        <div className={phase === 'drumroll' ? 'animate-bounce' : ''}>
          {reveal.imageUrl ? (
            <Image src={beerImageSrc(reveal.imageUrl)} alt={reveal.name} width={180} height={180} className="object-contain max-h-44 w-auto" />
          ) : (
            <BeerIcon className="h-32 w-32 text-amber-500" />
          )}
        </div>

        <div>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight">{reveal.name}</h1>
          <p className="text-2xl text-muted-foreground mt-1">
            {reveal.brewery}
            {formatAbv(reveal.abv) && ` · ${formatAbv(reveal.abv)}`}
          </p>
        </div>

        <div className="h-36 flex items-center justify-center">
          {phase === 'drumroll' ? (
            <div className="text-8xl font-bold text-muted-foreground animate-pulse">?</div>
          ) : (
            <div className="text-9xl font-bold text-primary">
              <CountUp value={reveal.average} durationMs={1600} onDone={showDetails} />
            </div>
          )}
        </div>

        {phase === 'details' && (
          <div className="w-full space-y-6">
            <div
              className={`inline-flex items-center gap-3 px-6 py-3 rounded-full text-3xl font-bold animate-in zoom-in-50 duration-500 ${
                isTop ? 'bg-yellow-400 text-yellow-950' : 'bg-primary/10 text-primary'
              }`}
            >
              {isTop && <Crown className="h-8 w-8" />}
              {placement(reveal.rank, reveal.totalRanked)}
            </div>
            <p className="text-lg text-muted-foreground animate-in fade-in duration-700">
              {reveal.count} einkunn{reveal.count !== 1 ? 'ir' : ''}
            </p>

            {hasAwards && (
              <div className="text-left text-foreground">
                <BeerAwardsStrip awards={reveal.awards} />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {differentRaters && (
                <>
                  <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-xl border border-green-300 dark:border-green-800 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both [animation-delay:200ms]">
                    <ThumbsUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <div className="text-sm text-muted-foreground">Hæsta einkunn</div>
                    <div className="text-2xl font-bold truncate">{reveal.highestRater!.userName}</div>
                    <div className="text-xl font-semibold text-green-600">{reveal.highestRater!.score}</div>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-xl border border-orange-300 dark:border-orange-800 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both [animation-delay:400ms]">
                    <ThumbsDown className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                    <div className="text-sm text-muted-foreground">Lægsta einkunn</div>
                    <div className="text-2xl font-bold truncate">{reveal.lowestRater!.userName}</div>
                    <div className="text-xl font-semibold text-orange-600">{reveal.lowestRater!.score}</div>
                  </div>
                </>
              )}
              {reveal.closestGuess && (
                <div className="bg-violet-50 dark:bg-violet-950/20 p-4 rounded-xl border border-violet-300 dark:border-violet-800 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both [animation-delay:600ms]">
                  <Brain className="h-8 w-8 mx-auto mb-2 text-violet-600" />
                  <div className="text-sm text-muted-foreground">Næst meðaltalinu</div>
                  <div className="text-2xl font-bold truncate">{reveal.closestGuess.userName}</div>
                  <div className="text-xl font-semibold text-violet-600">giskaði {reveal.closestGuess.guess.toFixed(1)}</div>
                </div>
              )}
            </div>

            {showTags && (
              <div className="animate-in fade-in duration-700 fill-mode-both [animation-delay:800ms]">
                <TagCloud tags={reveal.tags} raters={reveal.count} limit={reveal.tags.length} />
              </div>
            )}
          </div>
        )}
      </div>

      <p className="absolute bottom-6 text-sm text-muted-foreground">Smelltu til að loka</p>
    </div>
  )
}
