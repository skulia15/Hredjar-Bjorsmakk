'use client'

import { useEffect, useState } from 'react'

interface WrapUpOverlayProps {
  beerName: string
  brewery: string
  average: number
  count: number
  onComplete: () => void
  minDuration?: number // milliseconds
}

export function WrapUpOverlay({
  beerName,
  brewery,
  average,
  count,
  onComplete,
  minDuration = 5000
}: WrapUpOverlayProps) {
  const [timeRemaining, setTimeRemaining] = useState(minDuration / 1000)

  useEffect(() => {
    // Countdown timer
    const countdownInterval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // Auto-complete after minDuration
    const timer = setTimeout(() => {
      onComplete()
    }, minDuration)

    return () => {
      clearInterval(countdownInterval)
      clearTimeout(timer)
    }
  }, [minDuration, onComplete])

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-card rounded-lg border-2 border-primary max-w-md w-full p-8 space-y-6 animate-in zoom-in-95 duration-300">
        {/* Beer Finished Header */}
        <div className="text-center space-y-2">
          <div className="text-6xl mb-4">🍺</div>
          <h2 className="text-2xl font-bold">Bjór kláraður!</h2>
        </div>

        {/* Beer Details */}
        <div className="text-center space-y-1 border-y py-4">
          <h3 className="text-xl font-bold">{beerName}</h3>
          <p className="text-muted-foreground">{brewery}</p>
        </div>

        {/* Average Rating */}
        <div className="text-center space-y-2">
          <div className="text-5xl font-bold text-primary">
            {average.toFixed(2)}
          </div>
          <div className="text-sm text-muted-foreground">
            Meðaleinkunn frá {count} þátttakand{count !== 1 ? 'i' : 'a'}
          </div>
        </div>

        {/* Stars Visual */}
        <div className="flex justify-center gap-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <span
              key={i}
              className={`text-2xl ${
                i < Math.round(average) ? 'opacity-100' : 'opacity-20'
              }`}
            >
              ⭐
            </span>
          ))}
        </div>

        {/* Countdown */}
        {timeRemaining > 0 && (
          <div className="text-center text-sm text-muted-foreground">
            Næsti bjór eftir {timeRemaining} sekúnd{timeRemaining !== 1 ? 'ur' : 'u'}...
          </div>
        )}

        {/* Skip Button */}
        <button
          onClick={onComplete}
          className="w-full px-4 py-2 border rounded hover:bg-accent text-sm"
        >
          Halda áfram →
        </button>
      </div>
    </div>
  )
}
