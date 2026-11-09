import { useEffect, useRef } from 'react'

/**
 * Calls `callback` every `intervalMs`, skipping ticks while the tab is hidden (phone locked,
 * another tab in front) and catching up straight away when it comes back. The initial load stays
 * with the caller. The latest `callback` is always used, so it needn't be memoized.
 */
export function usePolling(callback: () => void, intervalMs: number, enabled = true) {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    if (!enabled) return

    const tick = () => {
      if (!document.hidden) callbackRef.current()
    }
    const onVisibilityChange = () => {
      if (!document.hidden) callbackRef.current()
    }

    const interval = setInterval(tick, intervalMs)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [intervalMs, enabled])
}
