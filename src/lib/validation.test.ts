import { describe, expect, it } from 'vitest'
import { flavorTagsSchema, ratingSchema, updateOwnNameSchema, updateUserSchema, validateInput } from './validation'

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

  it('ignores tags, they are saved apart', () => {
    expect(ratingSchema.parse({ ...ids, score: 5, tags: ['hoppy'] })).not.toHaveProperty('tags')
  })

  it('trims notes and stores blank ones as null', () => {
    expect(ratingSchema.parse({ ...ids, score: 5, note: '  nice  ' }).note).toBe('nice')
    expect(ratingSchema.parse({ ...ids, score: 5, note: '   ' }).note).toBeNull()
    expect(ratingSchema.safeParse({ ...ids, score: 5, note: 'x'.repeat(281) }).success).toBe(false)
  })
})

describe('flavorTagsSchema', () => {
  it('dedupes tags', () => {
    expect(flavorTagsSchema.parse({ ...ids, tags: ['hoppy', 'hoppy', 'sour'] }).tags).toEqual(['hoppy', 'sour'])
  })

  it('accepts no tags, so the last one can be untapped', () => {
    expect(flavorTagsSchema.parse({ ...ids, tags: [] }).tags).toEqual([])
  })

  it('normalizes custom tags so spellings group, and maps typed labels to their key', () => {
    expect(flavorTagsSchema.parse({ ...ids, tags: [' negull ', 'NEGULL', 'Kaffi', 'appelsínu  börkur'] }).tags)
      .toEqual(['Negull', 'coffee', 'Appelsínu börkur'])
  })

  it('caps custom tags in count and length', () => {
    expect(flavorTagsSchema.safeParse({ ...ids, tags: ['a', 'b', 'c', 'hoppy'] }).success).toBe(true)
    expect(flavorTagsSchema.safeParse({ ...ids, tags: ['a', 'b', 'c', 'd'] }).success).toBe(false)
    expect(flavorTagsSchema.safeParse({ ...ids, tags: ['x'.repeat(25)] }).success).toBe(false)
    expect(flavorTagsSchema.safeParse({ ...ids, tags: ['   '] }).success).toBe(false)
  })

  it('requires a tag list and a beer', () => {
    expect(flavorTagsSchema.safeParse({ ...ids }).success).toBe(false)
    expect(flavorTagsSchema.safeParse({ beerId: 'nope', tags: [] }).success).toBe(false)
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

describe('updateOwnNameSchema', () => {
  it('trims the name', () => {
    expect(updateOwnNameSchema.parse({ name: '  Bjórbangsi ' })).toEqual({ name: 'Bjórbangsi' })
  })

  it('rejects a missing, blank or too long name', () => {
    expect(updateOwnNameSchema.safeParse({}).success).toBe(false)
    expect(updateOwnNameSchema.safeParse({ name: '   ' }).success).toBe(false)
    expect(updateOwnNameSchema.safeParse({ name: 'x'.repeat(51) }).success).toBe(false)
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
