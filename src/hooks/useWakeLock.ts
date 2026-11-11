import { useEffect } from 'react'

/**
 * Keeps the screen from dimming and locking on its own while `enabled`. It can't stop someone
 * pressing the power button, and the browser drops the lock whenever the tab is hidden, so it's
 * taken again each time the page comes back.
 */
export function useWakeLock(enabled = true) {
  useEffect(() => {
    if (!enabled || !('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    let cancelled = false

    const acquire = () => {
      if (document.visibilityState !== 'visible') return
      navigator.wakeLock.request('screen')
        .then(l => {
          // Turned off while the request was in flight
          if (cancelled) void l.release()
          else lock = l
        })
        .catch(() => {})
    }

    acquire()
    document.addEventListener('visibilitychange', acquire)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', acquire)
      void lock?.release()
    }
  }, [enabled])
}
