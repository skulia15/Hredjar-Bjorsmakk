import { describe, expect, it } from 'vitest'
import { ratingSchema, updateUserSchema, validateInput } from './validation'

const ids = {
  beerId: '0549947f-21b4-4feb-8783-56b06cfd0608',
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

  it('dedupes tags and rejects unknown ones', () => {
    expect(ratingSchema.parse({ ...ids, score: 5, tags: ['hoppy', 'hoppy', 'sour'] }).tags).toEqual(['hoppy', 'sour'])
    expect(ratingSchema.safeParse({ ...ids, score: 5, tags: ['delicious'] }).success).toBe(false)
  })

  it('trims notes and stores blank ones as null', () => {
    expect(ratingSchema.parse({ ...ids, score: 5, note: '  nice  ' }).note).toBe('nice')
    expect(ratingSchema.parse({ ...ids, score: 5, note: '   ' }).note).toBeNull()
    expect(ratingSchema.safeParse({ ...ids, score: 5, note: 'x'.repeat(281) }).success).toBe(false)
  })
})

describe('updateUserSchema', () => {
  it('requires at least one field', () => {
    expect(updateUserSchema.safeParse({}).success).toBe(false)
    expect(updateUserSchema.safeParse({ isLeader: true }).success).toBe(true)
    expect(updateUserSchema.safeParse({ name: 'Jón' }).success).toBe(true)
  })

  it('rejects a blank name', () => {
    expect(updateUserSchema.safeParse({ name: '   ' }).success).toBe(false)
  })
})

describe('validateInput', () => {
  it('returns parsed data on success', () => {
    expect(validateInput(ratingSchema, { ...ids, score: 8 })).toEqual({
      success: true,
      data: { ...ids, score: 8 },
    })
  })

  it('drops identity fields a client tries to smuggle in', () => {
    const result = validateInput(ratingSchema, {
      ...ids,
      score: 8,
      participantId: '8914fb72-ed2b-4a47-8025-130085fde5d7',
      userName: 'skúli',
    })
    expect(result).toEqual({ success: true, data: { ...ids, score: 8 } })
  })

  it('joins zod issues as "path: message"', () => {
    const result = validateInput(ratingSchema, { ...ids, score: 11 })
    expect(result).toEqual({ success: false, error: 'score: Score must be at most 10.0' })
  })
})
