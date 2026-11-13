import { describe, expect, it } from 'vitest'
import { beerAwards, joinNames, type BeerRating } from './beerAwards'

const on = '2026-12-20T20:00:00.000Z'
const rating = (name: string, score: number, secondsAfter: number): BeerRating => ({
  participantId: `p-${name}`,
  name,
  score,
  ratedAt: new Date(new Date(on).getTime() + secondsAfter * 1000).toISOString(),
})

const byKind = (awards: ReturnType<typeof beerAwards>) => Object.fromEntries(awards.map(a => [a.kind, a]))

describe('beerAwards', () => {
  it('needs at least two ratings', () => {
    expect(beerAwards([], on)).toEqual([])
    expect(beerAwards([rating('Anna', 8, 30)], on)).toEqual([])
  })

  it('finds first and last by time on, whatever order the ratings come in', () => {
    const awards = byKind(beerAwards([rating('Jón', 7, 300), rating('Anna', 8, 65), rating('Gunna', 6, 140)], on))
    expect(awards.fastest).toMatchObject({ name: 'Anna', detail: 'eftir 1:05' })
    expect(awards.slowest).toMatchObject({ name: 'Jón', detail: 'eftir 5:00' })
  })

  it('names the most generous, the strictest, and who strayed furthest from the average', () => {
    const awards = byKind(beerAwards([rating('Anna', 9, 10), rating('Jón', 7, 20), rating('Gunna', 7, 30), rating('Palli', 7, 40)], on))
    expect(awards.generous).toMatchObject({ name: 'Anna', detail: 'gaf 9.0' })
    // Ties are joined, not dropped
    expect(awards.strict).toMatchObject({ name: 'Jón og 2 aðrir', detail: 'gaf 7.0' })
    expect(awards.outlier).toMatchObject({ name: 'Anna', detail: '+1.50 frá meðaltali' })
  })

  it('shows a negative deviation when the outlier scored low', () => {
    const awards = byKind(beerAwards([rating('Anna', 3, 10), rating('Jón', 8, 20), rating('Gunna', 8, 30)], on))
    expect(awards.outlier).toMatchObject({ name: 'Anna', detail: '-3.33 frá meðaltali' })
  })

  it('leaves the score awards out when everyone agreed', () => {
    const awards = beerAwards([rating('Anna', 8, 10), rating('Jón', 8, 20)], on)
    expect(awards.map(a => a.kind)).toEqual(['fastest', 'slowest'])
  })

  it('falls back to plain wording when the beer has no start time', () => {
    const awards = byKind(beerAwards([rating('Anna', 8, 10), rating('Jón', 6, 20)], null))
    expect(awards.fastest.detail).toBe('fyrsta einkunn')
    expect(awards.slowest.detail).toBe('síðasta einkunn')
  })
})

describe('joinNames', () => {
  it('joins one, two and more names', () => {
    expect(joinNames(['Anna'])).toBe('Anna')
    expect(joinNames(['Anna', 'Jón'])).toBe('Anna og Jón')
    expect(joinNames(['Anna', 'Jón', 'Gunna'])).toBe('Anna og 2 aðrir')
  })
})
