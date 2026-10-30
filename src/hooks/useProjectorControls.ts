'use client'

import { useCallback, useEffect, useState } from 'react'
import { setSoundEnabled } from '@/lib/sounds'

const SOUND_KEY = 'projector_sound'

/**
 * Fullscreen and sound toggles for the projector, and a screen wake lock so the
 * projector laptop doesn't dim or sleep mid-tasting.
 */
export function useProjectorControls() {
  const [isFullscreen, setIsFullscreen] = useState(false)
  // Read once on mount; localStorage isn't available during SSR
  const [soundOn, setSoundOn] = useState(() => typeof window !== 'undefined' && localStorage.getItem(SOUND_KEY) === 'on')

  useEffect(() => {
    setSoundEnabled(soundOn)
    localStorage.setItem(SOUND_KEY, soundOn ? 'on' : 'off')
    if (!soundOn) return
    // Audio stays suspended until a gesture; any click on the projector unlocks it
    const unlock = () => setSoundEnabled(true)
    window.addEventListener('pointerdown', unlock, { once: true })
    return () => window.removeEventListener('pointerdown', unlock)
  }, [soundOn])

  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement !== null)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  useEffect(() => {
    if (!('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    const acquire = () => {
      if (document.visibilityState !== 'visible') return
      navigator.wakeLock.request('screen').then(l => { lock = l }).catch(() => {})
    }
    // The browser releases the lock whenever the tab is hidden
    acquire()
    document.addEventListener('visibilitychange', acquire)
    return () => {
      document.removeEventListener('visibilitychange', acquire)
      void lock?.release()
    }
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void document.documentElement.requestFullscreen()
  }, [])

  const toggleSound = useCallback(() => setSoundOn(on => !on), [])

  return { isFullscreen, toggleFullscreen, soundOn, toggleSound }
}
