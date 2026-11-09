// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { usePolling } from './usePolling'

let hidden = false

function setHidden(value: boolean) {
  hidden = value
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'))
  })
}

beforeEach(() => {
  vi.useFakeTimers()
  hidden = false
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('usePolling', () => {
  it('calls back on every interval while visible', () => {
    const callback = vi.fn()
    renderHook(() => usePolling(callback, 1000))
    expect(callback).not.toHaveBeenCalled()
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(callback).toHaveBeenCalledTimes(3)
  })

  it('skips ticks while hidden and catches up once visible again', () => {
    const callback = vi.fn()
    renderHook(() => usePolling(callback, 1000))
    setHidden(true)
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(callback).not.toHaveBeenCalled()
    setHidden(false)
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('uses the latest callback without restarting', () => {
    const first = vi.fn()
    const second = vi.fn()
    const { rerender } = renderHook(({ cb }) => usePolling(cb, 1000), { initialProps: { cb: first } })
    rerender({ cb: second })
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })

  it('does nothing when disabled', () => {
    const callback = vi.fn()
    renderHook(() => usePolling(callback, 1000, false))
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    setHidden(true)
    setHidden(false)
    expect(callback).not.toHaveBeenCalled()
  })

  it('stops after unmount', () => {
    const callback = vi.fn()
    const { unmount } = renderHook(() => usePolling(callback, 1000))
    unmount()
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    setHidden(false)
    expect(callback).not.toHaveBeenCalled()
  })
})
