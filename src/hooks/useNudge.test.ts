// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useNudge } from './useNudge'

let nudge: { nudgedAt: string | null; pendingParticipantIds: string[] }

beforeEach(() => {
  vi.useFakeTimers()
  nudge = { nudgedAt: null, pendingParticipantIds: [] }
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify(nudge), { headers: { 'content-type': 'application/json' } }))
  )
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

// Let the in-flight poll resolve, then advance to the next interval tick
async function nextPoll() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(2000)
  })
}

async function settle() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0)
  })
}

describe('useNudge', () => {
  it('does not replay a nudge that already existed when the page opened', async () => {
    nudge = { nudgedAt: '2026-10-30T10:00:00Z', pendingParticipantIds: ['p1'] }
    const onNudge = vi.fn()
    renderHook(() => useNudge({ tastingId: 't1', participantId: 'p1', onNudge }))
    await settle()
    await nextPoll()
    expect(onNudge).not.toHaveBeenCalled()
  })

  it('fires once for a new nudge when the participant is pending', async () => {
    const onNudge = vi.fn()
    renderHook(() => useNudge({ tastingId: 't1', participantId: 'p1', onNudge }))
    await settle()

    nudge = { nudgedAt: '2026-10-30T10:00:00Z', pendingParticipantIds: ['p1', 'p2'] }
    await nextPoll()
    await nextPoll()
    expect(onNudge).toHaveBeenCalledTimes(1)
  })

  it('ignores a new nudge when the participant already rated', async () => {
    const onNudge = vi.fn()
    renderHook(() => useNudge({ tastingId: 't1', participantId: 'p1', onNudge }))
    await settle()

    nudge = { nudgedAt: '2026-10-30T10:00:00Z', pendingParticipantIds: ['p2'] }
    await nextPoll()
    expect(onNudge).not.toHaveBeenCalled()
  })

  it('fires for every new nudge when participantId is null (projector)', async () => {
    const onNudge = vi.fn()
    renderHook(() => useNudge({ tastingId: 't1', participantId: null, onNudge }))
    await settle()

    nudge = { nudgedAt: '2026-10-30T10:00:00Z', pendingParticipantIds: [] }
    await nextPoll()
    nudge = { nudgedAt: '2026-10-30T10:05:00Z', pendingParticipantIds: [] }
    await nextPoll()
    expect(onNudge).toHaveBeenCalledTimes(2)
  })

  it('does not poll while disabled', async () => {
    renderHook(() => useNudge({ tastingId: 't1', participantId: '', enabled: false, onNudge: vi.fn() }))
    await nextPoll()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('stops polling on unmount', async () => {
    const { unmount } = renderHook(() => useNudge({ tastingId: 't1', participantId: 'p1', onNudge: vi.fn() }))
    await settle()
    const callsBeforeUnmount = vi.mocked(fetch).mock.calls.length
    unmount()
    await nextPoll()
    expect(vi.mocked(fetch).mock.calls.length).toBe(callsBeforeUnmount)
  })
})
