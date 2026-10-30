'use client'

import { useEffect, useRef, useState } from 'react'

interface CountUpProps {
  value: number
  decimals?: number
  durationMs?: number
  // Start from this instead of 0 on mount
  from?: number
  onDone?: () => void
}

/** Animates from the previously shown value (0 on mount) to `value`, easing out */
export function CountUp({ value, decimals = 2, durationMs = 1200, from = 0, onDone }: CountUpProps) {
  const [shown, setShown] = useState(from)
  const shownRef = useRef(from)
  const onDoneRef = useRef(onDone)

  useEffect(() => {
    onDoneRef.current = onDone
  }, [onDone])

  useEffect(() => {
    const start = shownRef.current
    const startedAt = performance.now()
    let frame = requestAnimationFrame(function step(now) {
      const progress = Math.min(1, (now - startedAt) / durationMs)
      const eased = 1 - Math.pow(1 - progress, 3)
      shownRef.current = start + (value - start) * eased
      setShown(shownRef.current)
      if (progress < 1) frame = requestAnimationFrame(step)
      else onDoneRef.current?.()
    })
    return () => cancelAnimationFrame(frame)
  }, [value, durationMs])

  return <span className="tabular-nums">{shown.toFixed(decimals)}</span>
}
