'use client'

import { useEffect, useState } from 'react'

/**
 * 1-10 score histogram whose bars grow in one after another when it mounts.
 * `lg` fills the height its parent gives it, for the full-width reveal.
 */
export function ScoreBars({ scores, size = 'md' }: { scores: number[]; size?: 'md' | 'lg' }) {
  const lg = size === 'lg'
  const [grown, setGrown] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setGrown(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  // Scores come in half steps; a bar holds its whole number and the half above it, so 9.5 counts
  // as a 9 rather than rounding up into the 10s
  const counts = Array.from({ length: 10 }, (_, i) => scores.filter(s => Math.floor(s) === i + 1).length)
  const maxCount = Math.max(...counts, 1)

  return (
    <div className={`flex flex-col gap-2.5 ${lg ? 'h-full min-h-0' : ''}`}>
      <div className={`${lg ? 'text-2xl' : 'text-xl'} font-semibold text-muted-foreground`}>Einkunnir</div>
      <div className={`flex justify-between ${lg ? 'flex-1 min-h-0 items-stretch gap-3.5' : 'items-end gap-2'}`}>
        {counts.map((count, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <div className={`w-full flex flex-col justify-end items-center ${lg ? 'flex-1 min-h-0' : 'h-28 2xl:h-32'}`}>
              <div
                // High scores in cranberry, the rest in a quiet sand so the shape reads at a distance
                className={`w-full rounded-t-[10px] rounded-b flex items-start justify-center transition-[height] duration-700 ease-out ${
                  i >= 6 && count > 0 ? 'bg-cranberry text-white' : 'bg-[#E6D9BC] text-ink'
                }`}
                style={{
                  height: grown ? `${(count / maxCount) * 100}%` : '0%',
                  minHeight: grown ? (count > 0 ? (lg ? '44px' : '28px') : '4px') : 0,
                  transitionDelay: `${i * 60}ms`,
                }}
              >
                {count > 0 && grown && (
                  <span className={`${lg ? 'text-3xl' : 'text-base'} font-extrabold pt-1`}>{count}</span>
                )}
              </div>
            </div>
            <span className={`${lg ? 'text-3xl' : 'text-lg'} font-extrabold`}>{i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
