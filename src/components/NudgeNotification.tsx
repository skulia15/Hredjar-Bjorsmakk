'use client'

import { useEffect, useState, useRef } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { SantaMug } from '@/components/SantaMug'

interface NudgeNotificationProps {
  message?: string
  onComplete?: () => void
  duration?: number
  /** Play the airhorn; the projector passes its mute setting */
  sound?: boolean
}

/**
 * Full-screen "hurry up" for whoever hasn't rated yet. Replaces a 5 Hz red/white strobe
 * (a seizure risk past 3 flashes a second) with motion: the mug pops in and wobbles, the
 * words spring in and shake, and gold rings ripple out. Reduced motion gets a plain fade.
 */
export function NudgeNotification({
  message = 'Drífa sig!',
  onComplete,
  duration = 3000,
  sound = true
}: NudgeNotificationProps) {
  const [visible, setVisible] = useState(true)
  const reduceMotion = useReducedMotion()
  const onCompleteRef = useRef(onComplete)
  // Read once when the nudge appears; toggling mute mid-nudge shouldn't restart it
  const soundRef = useRef(sound)

  // Keep onComplete ref up to date
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    // Play an airhorn sound from MP3 file
    if (soundRef.current) {
      try {
        const audio = new Audio('/airhorn.mp3')
        audio.volume = 0.5
        audio.play().catch(e => {
          console.log('[NudgeNotification] Audio playback failed:', e)
        })
      } catch (e) {
        // Ignore audio errors
        console.log('[NudgeNotification] Audio playback failed:', e)
      }
    }

    // Leave room for the exit animation inside the requested duration
    const hideTimer = setTimeout(() => setVisible(false), duration - 400)
    return () => clearTimeout(hideTimer)
  }, [duration])

  return (
    <AnimatePresence onExitComplete={() => onCompleteRef.current?.()}>
      {visible && (
        <motion.div
          key="nudge"
          role="alert"
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-[4vmin] overflow-hidden bg-cranberry px-4 text-white"
          initial={{ opacity: 0 }}
          animate={reduceMotion
            ? { opacity: 1 }
            // A slow breathing pulse of the background, not a strobe
            : { opacity: 1, backgroundColor: ['#C8323A', '#9A2329', '#C8323A'] }}
          exit={{ opacity: 0, scale: reduceMotion ? 1 : 1.04 }}
          transition={reduceMotion
            ? { duration: 0.3 }
            : { opacity: { duration: 0.2 }, backgroundColor: { duration: 0.9, repeat: Infinity }, scale: { duration: 0.4 } }}
        >
          {/* Gold rings rippling out from the middle */}
          {!reduceMotion && [0, 1, 2].map(i => (
            <motion.span
              key={i}
              aria-hidden
              className="pointer-events-none absolute h-[40vmin] w-[40vmin] rounded-full border-[1.5vmin] border-gold"
              initial={{ scale: 0.3, opacity: 0.8 }}
              animate={{ scale: 3.2, opacity: 0 }}
              transition={{ duration: 1.6, delay: i * 0.45, repeat: Infinity, ease: 'easeOut' }}
            />
          ))}

          {/* The mug pops in, then wobbles like it's being waved at you */}
          <motion.div
            className="relative"
            initial={reduceMotion ? false : { scale: 0.2, rotate: -25, y: 60 }}
            animate={reduceMotion ? undefined : { scale: 1, rotate: 0, y: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 14 }}
          >
            <motion.div
              animate={reduceMotion ? undefined : { rotate: [0, -12, 12, -9, 9, 0], y: [0, -14, 0, -8, 0, 0] }}
              transition={{ duration: 0.7, delay: 0.35, repeat: Infinity, repeatDelay: 0.25 }}
            >
              <SantaMug className="h-auto w-[26vmin] drop-shadow-[0_1.2vmin_0_rgba(0,0,0,0.25)]" />
            </motion.div>
          </motion.div>

          {/* The words spring in big, then keep shaking */}
          <motion.p
            className="relative text-center text-[length:min(15vw,9rem)] font-extrabold leading-none tracking-tight"
            initial={reduceMotion ? false : { scale: 0.3, opacity: 0 }}
            animate={reduceMotion ? undefined : { scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 12, delay: 0.1 }}
          >
            <motion.span
              className="inline-block"
              animate={reduceMotion ? undefined : { x: [0, -16, 16, -12, 12, -6, 6, 0] }}
              transition={{ duration: 0.55, delay: 0.5, repeat: Infinity, repeatDelay: 0.35 }}
            >
              {message}
            </motion.span>
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
