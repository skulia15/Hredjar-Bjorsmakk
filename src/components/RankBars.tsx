'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface RankBarItem {
  key: string
  label: React.ReactNode
  /** Small second line under the label, e.g. counts */
  detail?: React.ReactNode
  value: number
  /** What to print as the value; defaults to value.toFixed(2) */
  display?: string
  /** Bar colour class, e.g. 'bg-holly' */
  barClass?: string
}

interface RankBarsProps {
  items: RankBarItem[]
  /** Bar length runs from min to max (defaults 0..10, the rating scale) */
  min?: number
  max?: number
  /**
   * Draw bars out from this value instead of from min, left for below and right for above
   * (e.g. the group average). Bar length is the distance from it.
   */
  center?: number
  centerLabel?: string
  /** Show only this many rows until the reader asks for the rest */
  initialCount?: number
  className?: string
}

/**
 * Ranked horizontal bars as plain HTML: the label sits on its own line above a full-width bar,
 * so it reads on a narrow phone and grows with the reader's text size (unlike an SVG chart).
 */
export function RankBars({ items, min = 0, max = 10, center, centerLabel, initialCount, className }: RankBarsProps) {
  const [showAll, setShowAll] = useState(false)
  const collapsible = initialCount !== undefined && items.length > initialCount
  const shown = collapsible && !showAll ? items.slice(0, initialCount) : items
  const span = center === undefined
    ? max - min
    : Math.max(...items.map(i => Math.abs(i.value - center)), 0.01)

  return (
    <div className={cn('space-y-1', className)}>
      {center !== undefined && centerLabel && (
        <div className="flex justify-center text-xs text-muted-foreground">{centerLabel}</div>
      )}
      <ol className="space-y-3">
        {shown.map((item, index) => {
          const display = item.display ?? item.value.toFixed(2)
          const barClass = item.barClass ?? 'bg-cranberry'
          return (
            <li key={item.key} className="space-y-1">
              {/* Score stays beside the name; a long name wraps within its own column */}
              <div className="flex items-baseline gap-x-2">
                <span className="flex-1 min-w-0 font-semibold leading-tight">
                  <span className="text-sm text-muted-foreground tabular-nums">{index + 1}. </span>
                  {item.label}
                </span>
                <span className="shrink-0 font-extrabold tabular-nums">{display}</span>
              </div>
              {center === undefined ? (
                <div className="h-2.5 rounded-full bg-muted overflow-hidden" aria-hidden>
                  <div
                    className={cn('h-full rounded-full', barClass)}
                    style={{ width: `${Math.max(2, ((item.value - min) / span) * 100)}%` }}
                  />
                </div>
              ) : (
                // Two halves around the centre line; the bar grows outwards from it
                <div className="relative h-2.5 rounded-full bg-muted" aria-hidden>
                  <div className="absolute inset-y-[-3px] left-1/2 w-px bg-ink-soft" />
                  <div
                    className={cn('absolute inset-y-0 rounded-full', barClass)}
                    style={item.value >= center
                      ? { left: '50%', width: `${(Math.abs(item.value - center) / span) * 50}%` }
                      : { right: '50%', width: `${(Math.abs(item.value - center) / span) * 50}%` }}
                  />
                </div>
              )}
              {item.detail && <div className="text-xs text-muted-foreground">{item.detail}</div>}
            </li>
          )
        })}
      </ol>
      {collapsible && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center gap-1.5 min-h-11 px-4 rounded-full bg-muted text-sm font-semibold hover:opacity-80"
          >
            {showAll ? 'Sýna færri' : `Sýna alla (${items.length})`}
            {showAll ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      )}
    </div>
  )
}
