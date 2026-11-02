'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { beerImageSrc } from '@/lib/beerImage'

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

export function AnimatedLeaderboard({ beers, limit = 6, selectedBeerId, onSelect }: {
  beers: LeaderboardBeer[]
  limit?: number
  selectedBeerId?: string | null
  // Clicking a row shows that beer's scores; clicking the shown one again goes back
  onSelect?: (beerId: string | null) => void
}) {
  const signature = beers.map(b => `${b.beerId}:${b.rank}`).join(',')
  const [snapshot, setSnapshot] = useState(() => ({ signature, ranks: rankMap(beers), movement: {} as Record<string, Movement> }))

  // Movement is derived from the previous ranking, so update it while rendering when the ranking changes
  if (snapshot.signature !== signature) {
    setSnapshot({ signature, ranks: rankMap(beers), movement: diffRanks(snapshot.ranks, beers) })
  }

  // FLIP: rows that changed position animate from where they were
  const rows = useRef(new Map<string, HTMLButtonElement>())
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
    // One equal slot per place so all of them fit the column on the projector, never scrolling
    <div className="flex-1 min-h-0 grid gap-2.5 relative" style={{ gridTemplateRows: `repeat(${limit}, minmax(0, 1fr))` }}>
      {beers.slice(0, limit).map(beer => (
        <button
          type="button"
          key={beer.beerId}
          onClick={() => onSelect?.(selectedBeerId === beer.beerId ? null : beer.beerId)}
          aria-pressed={selectedBeerId === beer.beerId}
          ref={el => {
            if (el) rows.current.set(beer.beerId, el)
            else {
              rows.current.delete(beer.beerId)
              previousTops.current.delete(beer.beerId)
            }
          }}
          className={`flex items-center gap-4 min-h-0 overflow-hidden px-4 py-1 rounded-[20px] text-left cursor-pointer transition-[filter] hover:brightness-110 animate-in fade-in slide-in-from-left-4 duration-500 ${
            beer.rank === 1 ? 'bg-cream text-ink' : 'bg-pine'
          } ${snapshot.movement[beer.beerId] === 'new' ? 'ring-4 ring-inset ring-gold/70' : ''} ${
            selectedBeerId === beer.beerId ? 'outline-4 outline-offset-2 outline-gold' : ''
          }`}
        >
          <span className={`w-11 h-11 shrink-0 rounded-full ${RANK_BADGE[beer.rank] ?? 'bg-mint'} text-ink flex items-center justify-center text-2xl font-extrabold`}>
            {beer.rank}
          </span>
          {/* Fixed slot so names line up; the image grows with the row height */}
          <span className="w-14 self-stretch shrink-0 py-1.5 flex items-center justify-center">
            {beer.imageUrl && (
              <Image src={beerImageSrc(beer.imageUrl)} alt="" width={96} height={96} className="max-h-full max-w-full w-auto h-auto object-contain" />
            )}
          </span>
          <span className="flex-1 min-w-0 flex flex-col">
            <span className="text-xl 2xl:text-2xl font-extrabold leading-tight truncate">{beer.name}</span>
            <span className="flex items-center gap-2 min-w-0">
              <span className="text-sm 2xl:text-base opacity-80 truncate">{beer.brewery} · {beer.count} eink.</span>
              <MovementBadge movement={snapshot.movement[beer.beerId]} />
            </span>
          </span>
          <span className="text-3xl 2xl:text-4xl font-extrabold tabular-nums">{beer.average.toFixed(2)}</span>
        </button>
      ))}
    </div>
  )
}
