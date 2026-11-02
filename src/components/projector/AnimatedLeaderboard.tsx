'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ArrowDown, ArrowUp } from 'lucide-react'

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
      <span className="px-2 py-0.5 rounded-full bg-gold text-ink text-xs font-extrabold animate-in zoom-in-50 duration-500">
        NÝTT
      </span>
    )
  }
  const up = movement > 0
  const Icon = up ? ArrowUp : ArrowDown
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-sm font-extrabold animate-in fade-in duration-500 ${up ? 'bg-holly-soft text-holly' : 'bg-red-50 text-red-600'}`}>
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
// Gold, silver, bronze; everyone else gets mint
const RANK_BADGE: Record<number, string> = { 1: 'bg-gold', 2: 'bg-[#D9D3C4]', 3: 'bg-[#E08A5B]' }

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
    <div className="space-y-2.5 relative">
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
          className={`flex items-center gap-4 min-h-[84px] px-4 py-2 rounded-[20px] animate-in fade-in slide-in-from-left-4 duration-500 ${
            beer.rank === 1 ? 'bg-cream text-ink' : 'bg-pine'
          } ${snapshot.movement[beer.beerId] === 'new' ? 'ring-4 ring-inset ring-gold/70' : ''}`}
        >
          <span className={`w-12 h-12 shrink-0 rounded-full ${RANK_BADGE[beer.rank] ?? 'bg-mint'} text-ink flex items-center justify-center text-2xl font-extrabold`}>
            {beer.rank}
          </span>
          {beer.imageUrl && (
            <Image src={beer.imageUrl} alt="" width={48} height={48} className="h-10 w-auto shrink-0 object-contain" />
          )}
          <span className="flex-1 min-w-0 flex flex-col">
            <span className="text-2xl font-extrabold leading-tight line-clamp-2">{beer.name}</span>
            <span className="flex items-center gap-2 min-w-0">
              <span className="text-base opacity-80 truncate">{beer.brewery} · {beer.count} eink.</span>
              <MovementBadge movement={snapshot.movement[beer.beerId]} />
            </span>
          </span>
          <span className="text-4xl font-extrabold tabular-nums">{beer.average.toFixed(2)}</span>
        </div>
      ))}
    </div>
  )
}
