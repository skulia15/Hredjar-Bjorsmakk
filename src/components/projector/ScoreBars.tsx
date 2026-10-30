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
    <div className="bg-card p-4 rounded-lg border">
      <div className="text-sm font-medium mb-3 text-center">Einkunnir</div>
      <div className="flex items-end justify-between gap-1">
        {counts.map((count, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex flex-col justify-end items-center h-[100px]">
              <div
                className="w-full bg-primary rounded-t flex items-start justify-center transition-[height] duration-700 ease-out"
                style={{
                  height: grown ? `${(count / maxCount) * 100}%` : '0%',
                  minHeight: grown && count > 0 ? '20px' : 0,
                  transitionDelay: `${i * 60}ms`,
                }}
              >
                {count > 0 && grown && (
                  <span className="text-xs font-bold text-primary-foreground pt-1">{count}</span>
                )}
              </div>
            </div>
            <span className="text-xs font-medium">{i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
