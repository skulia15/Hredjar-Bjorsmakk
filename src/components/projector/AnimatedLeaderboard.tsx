'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { RankMedal } from '@/components/RankMedal'

export interface LeaderboardBeer {
  beerId: string
  name: string
  brewery: string
  average: number
  count: number
  rank: number
  imageUrl?: string | null
}

// 'new' = just finished; a number = places moved, positive is up
type Movement = 'new' | number

const rankMap = (beers: LeaderboardBeer[]) => new Map(beers.map(b => [b.beerId, b.rank]))

function diffRanks(previous: Map<string, number>, beers: LeaderboardBeer[]): Record<string, Movement> {
  const movement: Record<string, Movement> = {}
  for (const beer of beers) {
    const before = previous.get(beer.beerId)
    if (before === undefined) movement[beer.beerId] = 'new'
    else if (before !== beer.rank) movement[beer.beerId] = before - beer.rank
  }
  return movement
}

function MovementBadge({ movement }: { movement?: Movement }) {
  if (movement === undefined) return null
  if (movement === 'new') {
    return (
      <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-xs font-bold animate-in zoom-in-50 duration-500">
        NÝTT
      </span>
    )
  }
  const up = movement > 0
  const Icon = up ? ArrowUp : ArrowDown
  return (
    <span className={`inline-flex items-center text-sm font-bold animate-in fade-in duration-500 ${up ? 'text-green-600' : 'text-red-500'}`}>
      <Icon className="h-4 w-4" />
      {Math.abs(movement)}
    </span>
  )
}

/**
 * Top beers that slide into their new places when the ranking changes, with an arrow
 * (or NÝTT) showing how each moved since the last change. Mount it only once scores have
 * loaded, so the first data isn't mistaken for every beer being new.
 */
export function AnimatedLeaderboard({ beers, limit = 6 }: { beers: LeaderboardBeer[]; limit?: number }) {
  const signature = beers.map(b => `${b.beerId}:${b.rank}`).join(',')
  const [snapshot, setSnapshot] = useState(() => ({ signature, ranks: rankMap(beers), movement: {} as Record<string, Movement> }))

  // Movement is derived from the previous ranking, so update it while rendering when the ranking changes
  if (snapshot.signature !== signature) {
    setSnapshot({ signature, ranks: rankMap(beers), movement: diffRanks(snapshot.ranks, beers) })
  }

  // FLIP: rows that changed position animate from where they were
  const rows = useRef(new Map<string, HTMLDivElement>())
  const previousTops = useRef(new Map<string, number>())
  useLayoutEffect(() => {
    rows.current.forEach((el, id) => {
      const top = el.offsetTop
      const before = previousTops.current.get(id)
      if (before !== undefined && before !== top) {
        el.animate(
          [{ transform: `translateY(${before - top}px)` }, { transform: 'translateY(0)' }],
          { duration: 800, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }
        )
      }
      previousTops.current.set(id, top)
    })
  }, [signature])

  return (
    <div className="space-y-3 relative">
      {beers.slice(0, limit).map(beer => (
        <div
          key={beer.beerId}
          ref={el => {
            if (el) rows.current.set(beer.beerId, el)
            else {
              rows.current.delete(beer.beerId)
              previousTops.current.delete(beer.beerId)
            }
          }}
          className={`p-4 rounded-lg border-2 animate-in fade-in slide-in-from-left-4 duration-500 ${
            beer.rank <= 3 ? 'bg-primary/5 border-primary' : 'bg-muted/50 border-border'
          } ${snapshot.movement[beer.beerId] === 'new' ? 'ring-4 ring-amber-400/60' : ''}`}
        >
          <div className="flex items-start gap-3">
            {beer.imageUrl && (
              <div className="flex-shrink-0 h-16 w-16 flex items-center justify-center">
                <Image src={beer.imageUrl} alt={beer.name} width={64} height={64} className="rounded object-contain max-h-16" />
              </div>
            )}
            <div className="flex-1 min-w-0 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <RankMedal rank={beer.rank} className="h-8 w-8" />
                  <span className="text-xl font-bold text-muted-foreground">#{beer.rank}</span>
                  <MovementBadge movement={snapshot.movement[beer.beerId]} />
                </div>
                <h3 className="font-bold text-lg leading-tight mb-1">{beer.name}</h3>
                <p className="text-sm text-muted-foreground truncate">{beer.brewery}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-3xl font-bold text-primary">{beer.average.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">{beer.count} eink.</div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
