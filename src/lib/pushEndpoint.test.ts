import { describe, expect, it } from 'vitest'
import { isPushServiceEndpoint } from './pushEndpoint'

describe('isPushServiceEndpoint', () => {
  it.each([
    'https://fcm.googleapis.com/fcm/send/abc:def',
    'https://updates.push.services.mozilla.com/wpush/v2/abc',
    'https://web.push.apple.com/QGx1',
    'https://api.push.apple.com/3/device/abc',
    'https://wns2-db5p.notify.windows.com/w/?token=abc',
  ])('accepts %s', endpoint => {
    expect(isPushServiceEndpoint(endpoint)).toBe(true)
  })

  it.each([
    'http://fcm.googleapis.com/fcm/send/abc',
    'https://evil.example.com/fcm.googleapis.com',
    'https://fcm.googleapis.com.evil.example.com/x',
    'https://notpush.apple.com/x',
    'https://169.254.169.254/latest/meta-data',
    'not a url',
  ])('refuses %s', endpoint => {
    expect(isPushServiceEndpoint(endpoint)).toBe(false)
  })
})
