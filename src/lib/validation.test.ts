import { describe, expect, it } from 'vitest'
import { ratingSchema, updateUserSchema, validateInput } from './validation'

const ids = {
  beerId: '0549947f-21b4-4feb-8783-56b06cfd0608',
  participantId: '8914fb72-ed2b-4a47-8025-130085fde5d7',
}

describe('ratingSchema', () => {
  it.each([1, 1.5, 7.5, 10])('accepts %s', (score) => {
    expect(ratingSchema.safeParse({ ...ids, score }).success).toBe(true)
  })

  it.each([0.5, 10.5, 7.3, 7.25])('rejects %s', (score) => {
    expect(ratingSchema.safeParse({ ...ids, score }).success).toBe(false)
  })

  it('rejects non-uuid ids', () => {
    expect(ratingSchema.safeParse({ ...ids, beerId: 'nope', score: 5 }).success).toBe(false)
  })
})

describe('updateUserSchema', () => {
  it('requires at least one flag', () => {
    expect(updateUserSchema.safeParse({}).success).toBe(false)
    expect(updateUserSchema.safeParse({ isLeader: true }).success).toBe(true)
  })
})

describe('validateInput', () => {
  it('returns parsed data on success', () => {
    expect(validateInput(ratingSchema, { ...ids, score: 8 })).toEqual({
      success: true,
      data: { ...ids, score: 8 },
    })
  })

  it('joins zod issues as "path: message"', () => {
    const result = validateInput(ratingSchema, { ...ids, score: 11 })
    expect(result).toEqual({ success: false, error: 'score: Score must be at most 10.0' })
  })
})
