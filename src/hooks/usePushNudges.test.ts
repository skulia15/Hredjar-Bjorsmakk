// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const subscription = { endpoint: 'https://fcm.googleapis.com/fcm/send/x', toJSON: () => ({ endpoint: 'x' }), unsubscribe: vi.fn() }
let existing: typeof subscription | null
let permission: NotificationPermission
const subscribe = vi.fn(async () => subscription)

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY', 'BPublicKey')
  existing = null
  permission = 'default'
  subscribe.mockClear()
  const registration = { pushManager: { getSubscription: async () => existing, subscribe } }
  vi.stubGlobal('navigator', Object.assign(Object.create(navigator), {
    serviceWorker: { register: async () => registration, ready: Promise.resolve(registration) },
  }))
  vi.stubGlobal('PushManager', class {})
  vi.stubGlobal('Notification', { get permission() { return permission }, requestPermission: async () => permission })
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}')))
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.resetModules()
})

// The public key is read when the module loads, so import after stubbing it
async function render() {
  const { usePushNudges } = await import('./usePushNudges')
  return renderHook(() => usePushNudges())
}

describe('usePushNudges', () => {
  it('asks when notifications are not allowed yet', async () => {
    const { result } = await render()
    await waitFor(() => expect(result.current.state).toBe('off'))
    expect(subscribe).not.toHaveBeenCalled()
  })

  it('is on, and re-links the device, when already subscribed', async () => {
    existing = subscription
    const { result } = await render()
    await waitFor(() => expect(result.current.state).toBe('on'))
    expect(fetch).toHaveBeenCalledWith('/api/push/subscriptions', expect.objectContaining({ method: 'POST' }))
    expect(subscribe).not.toHaveBeenCalled()
  })

  it('quietly subscribes again when allowed but the subscription is gone', async () => {
    permission = 'granted'
    const { result } = await render()
    await waitFor(() => expect(result.current.state).toBe('on'))
    expect(subscribe).toHaveBeenCalledOnce()
  })

  it('reports blocked notifications', async () => {
    permission = 'denied'
    const { result } = await render()
    await waitFor(() => expect(result.current.state).toBe('denied'))
  })
})
