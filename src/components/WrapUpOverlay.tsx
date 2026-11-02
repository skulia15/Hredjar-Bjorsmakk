'use client'

import { useEffect, useState } from 'react'
import { Beer as BeerIcon, Star } from 'lucide-react'

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
          // Call onComplete when we reach 0
          onComplete()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      clearInterval(countdownInterval)
    }
  }, [onComplete])

  return (
    // Scrolls when large text makes the card taller than the screen; my-auto keeps it centred otherwise
    <div className="fixed inset-0 bg-black/80 flex overflow-y-auto justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="my-auto bg-card rounded-3xl border-2 border-primary max-w-md w-full p-5 sm:p-8 space-y-6 animate-in zoom-in-95 duration-300">
        {/* Beer Finished Header */}
        <div className="text-center space-y-2">
          <BeerIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
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
            Meðaleinkunn frá {count} þátttakand{count !== 1 ? 'um' : 'a'}
          </div>
        </div>

        {/* Stars Visual */}
        <div className="flex justify-center gap-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <Star
              key={i}
              className={`h-6 w-6 fill-yellow-400 text-yellow-400 ${
                i < Math.round(average) ? 'opacity-100' : 'opacity-20'
              }`}
            />
          ))}
        </div>

        {/* Countdown */}
        <div className="text-center space-y-2">
          <div className="text-sm text-muted-foreground">
            Næsti bjór eftir {timeRemaining} sekúnd{timeRemaining !== 1 ? 'ur' : 'u'}...
          </div>
          {/* Progress bar */}
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-1000 ease-linear"
              style={{ width: `${((minDuration / 1000 - timeRemaining) / (minDuration / 1000)) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
