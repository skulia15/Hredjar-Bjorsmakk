'use client'

import { useEffect, useState, useRef } from 'react'

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
  const [fadeOut, setFadeOut] = useState(false)
  const [animationKey, setAnimationKey] = useState(0)
  const onCompleteRef = useRef(onComplete)

  // Keep onComplete ref up to date
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    console.log('[NudgeNotification] Component mounted, will show for', duration, 'ms')

    // Force animation to restart by updating key
    setAnimationKey(prev => prev + 1)

    // Play a sound if available (simple beep)
    let audioContext: AudioContext | null = null
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
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

      // Clean up audio context after the sound finishes
      setTimeout(() => {
        audioContext?.close()
      }, 500)
    } catch (e) {
      // Ignore audio errors
      console.log('[NudgeNotification] Audio playback failed:', e)
      audioContext?.close()
    }

    // Start fade out 500ms before completion
    const fadeTimer = setTimeout(() => {
      console.log('[NudgeNotification] Starting fade out')
      setFadeOut(true)
    }, duration - 500)

    // Complete and unmount
    const completeTimer = setTimeout(() => {
      console.log('[NudgeNotification] Completing and calling onComplete')
      setVisible(false)
      onCompleteRef.current?.()
    }, duration)

    return () => {
      console.log('[NudgeNotification] Component unmounting, cleaning up timers')
      clearTimeout(fadeTimer)
      clearTimeout(completeTimer)
      // Close audio context if it's still open
      audioContext?.close()
    }
  }, [duration])

  if (!visible) {
    console.log('[NudgeNotification] Not visible, returning null')
    return null
  }

  return (
    <div
      key={animationKey}
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        animation: fadeOut ? 'none' : 'blinkRedWhite 0.2s ease-in-out 10'
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
