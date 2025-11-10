'use client'

import { useEffect, useState } from 'react'

interface NudgeNotificationProps {
  message?: string
  onComplete?: () => void
  duration?: number
}

export function NudgeNotification({
  message = 'Drífa sig!',
  onComplete,
  duration = 3000
}: NudgeNotificationProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    // Play a sound if available (simple beep)
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 800
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    } catch (e) {
      // Ignore audio errors
    }

    const timer = setTimeout(() => {
      setVisible(false)
      onComplete?.()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onComplete])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center animate-blink-red-white"
      style={{
        animation: 'blinkRedWhite 0.5s ease-in-out 4'
      }}
    >
      <div className="text-6xl md:text-8xl font-bold text-center px-4 drop-shadow-2xl">
        {message}
      </div>

      <style jsx>{`
        @keyframes blinkRedWhite {
          0%, 100% {
            background-color: #ff0000;
            color: #ffffff;
          }
          50% {
            background-color: #ffffff;
            color: #ff0000;
          }
        }
      `}</style>
    </div>
  )
}
