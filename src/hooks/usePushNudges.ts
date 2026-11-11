import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

/**
 * - unsupported: this browser can't do web push, the server has no keys, or it's the projector's
 *   iframe; nothing to offer
 * - needs-install: iPhone/iPad Safari, where push only works once the app is on the home screen
 * - denied: notifications blocked in the browser's settings
 * - off: not allowed yet, so worth asking
 * - on: this device gets nudges as notifications
 */
export type PushNudgeState = 'checking' | 'unsupported' | 'needs-install' | 'denied' | 'off' | 'on'

function isIOS(): boolean {
  // iPadOS reports itself as a Mac; the touch screen gives it away
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true
}

type Support = 'supported' | 'needs-install' | 'unsupported'

function getSupport(): Support {
  // Inside the projector's iframe: that screen isn't anyone's phone
  if (window.self !== window.top) return 'unsupported'
  if (VAPID_PUBLIC_KEY && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) {
    return 'supported'
  }
  return isIOS() && !isStandalone() ? 'needs-install' : 'unsupported'
}

// Support never changes while the page is open; the server render just doesn't know it yet
const neverChanges = () => () => {}

export function urlBase64ToUint8Array(base64Url: string): Uint8Array<ArrayBuffer> {
  const base64 = (base64Url + '='.repeat((4 - (base64Url.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const bytes = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  return bytes
}

function saveSubscription(subscription: PushSubscription) {
  return fetch('/api/push/subscriptions', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(subscription.toJSON()),
  })
}

/** Needs notification permission already granted; then no user gesture is required */
async function subscribe(registration: ServiceWorkerRegistration, publicKey: string) {
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  })
  const response = await saveSubscription(subscription)
  if (!response.ok) {
    await subscription.unsubscribe()
    throw new Error(`Saving subscription failed: ${response.status}`)
  }
}

/**
 * Nudges as push notifications, so they reach a locked phone. The subscription belongs to the
 * signed-in user, so it covers every tasting they join. Once notifications are allowed there's
 * nothing to ask: a missing subscription is made again without bothering anyone.
 */
export function usePushNudges() {
  const support = useSyncExternalStore(neverChanges, getSupport, () => null)
  const [subscriptionState, setState] = useState<Exclude<PushNudgeState, 'needs-install'>>('checking')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (support !== 'supported' || !VAPID_PUBLIC_KEY) return
    const publicKey = VAPID_PUBLIC_KEY

    let cancelled = false
    ;(async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        const existing = await registration.pushManager.getSubscription()
        if (existing) {
          // Re-link on every visit: covers a device that changed accounts or a lost server row
          void saveSubscription(existing).catch(() => {})
          if (!cancelled) setState('on')
          return
        }
        if (Notification.permission === 'granted') {
          // Allowed before, but the subscription is gone (cleared site data, expired): renew it quietly
          await subscribe(await navigator.serviceWorker.ready, publicKey)
          if (!cancelled) setState('on')
          return
        }
        if (!cancelled) setState(Notification.permission === 'denied' ? 'denied' : 'off')
      } catch (error) {
        console.error('[Push] Service worker setup failed:', error)
        if (!cancelled) setState('unsupported')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [support])

  const enable = useCallback(async () => {
    if (!VAPID_PUBLIC_KEY) return
    setBusy(true)
    try {
      // First thing in the tap handler: Safari only shows the prompt straight from a user gesture
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'denied' : 'off')
        return
      }
      await subscribe(await navigator.serviceWorker.ready, VAPID_PUBLIC_KEY)
      setState('on')
    } catch (error) {
      console.error('[Push] Enabling failed:', error)
    } finally {
      setBusy(false)
    }
  }, [])

  const state: PushNudgeState = support === null ? 'checking'
    : support === 'supported' ? subscriptionState
    : support
  return { state, busy, enable }
}
