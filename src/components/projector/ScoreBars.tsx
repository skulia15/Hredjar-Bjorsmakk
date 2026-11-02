'use client'

import { useEffect, useState } from 'react'

/** 1-10 score histogram whose bars grow in one after another when it mounts */
export function ScoreBars({ scores }: { scores: number[] }) {
  const [grown, setGrown] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setGrown(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  const counts = Array.from({ length: 10 }, (_, i) => scores.filter(s => Math.round(s) === i + 1).length)
  const maxCount = Math.max(...counts, 1)

  return (
    <div className="flex flex-col gap-2.5">
      <div className="text-xl font-semibold text-muted-foreground">Einkunnir</div>
      <div className="flex items-end justify-between gap-2">
        {counts.map((count, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full flex flex-col justify-end items-center h-36">
              <div
                // High scores in cranberry, the rest in a quiet sand so the shape reads at a distance
                className={`w-full rounded-t-[10px] rounded-b flex items-start justify-center transition-[height] duration-700 ease-out ${
                  i >= 6 ? 'bg-cranberry text-white' : 'bg-[#E6D9BC] text-ink'
                }`}
                style={{
                  height: grown ? `${(count / maxCount) * 100}%` : '0%',
                  minHeight: grown ? (count > 0 ? '28px' : '4px') : 0,
                  transitionDelay: `${i * 60}ms`,
                }}
              >
                {count > 0 && grown && (
                  <span className="text-base font-extrabold pt-1">{count}</span>
                )}
              </div>
            </div>
            <span className="text-lg font-extrabold">{i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
