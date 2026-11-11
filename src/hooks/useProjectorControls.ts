'use client'

import { useCallback, useEffect, useState } from 'react'
import { setSoundEnabled } from '@/lib/sounds'
import { useWakeLock } from './useWakeLock'

const SOUND_KEY = 'projector_sound'
const TAGS_KEY = 'projector_tags'

/**
 * Fullscreen, sound and flavor-tag toggles for the projector, and a screen wake lock so the
 * projector laptop doesn't dim or sleep mid-tasting.
 */
export function useProjectorControls() {
  const [isFullscreen, setIsFullscreen] = useState(false)
  // Read once on mount; localStorage isn't available during SSR
  const [soundOn, setSoundOn] = useState(() => typeof window !== 'undefined' && localStorage.getItem(SOUND_KEY) === 'on')
  // The flavor tag cloud is on unless the host switched it off
  const [tagsOn, setTagsOn] = useState(() => typeof window === 'undefined' || localStorage.getItem(TAGS_KEY) !== 'off')

  useEffect(() => {
    localStorage.setItem(TAGS_KEY, tagsOn ? 'on' : 'off')
  }, [tagsOn])

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

  useWakeLock()

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void document.documentElement.requestFullscreen()
  }, [])

  const toggleSound = useCallback(() => setSoundOn(on => !on), [])
  const toggleTags = useCallback(() => setTagsOn(on => !on), [])

  return { isFullscreen, toggleFullscreen, soundOn, toggleSound, tagsOn, toggleTags }
}
