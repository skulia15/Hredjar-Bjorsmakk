import { describe, expect, it } from 'vitest'
import {
  buildAwards,
  comparePairs,
  extremeRaters,
  linearFit,
  personalStats,
  ratingDomain,
  summarizeScores,
  tasteTwins,
  type RatingEntry,
} from './stats'

describe('summarizeScores', () => {
  it('computes average, population std dev and range', () => {
    expect(summarizeScores([2, 4, 4, 4, 5, 5, 7, 9])).toEqual({ average: 5, standardDeviation: 2, min: 2, max: 9 })
  })

  it('returns zeros for no scores', () => {
    expect(summarizeScores([])).toEqual({ average: 0, standardDeviation: 0, min: 0, max: 0 })
  })

  it('has zero spread for a single score', () => {
    expect(summarizeScores([7.5]).standardDeviation).toBe(0)
  })
})

describe('linearFit', () => {
  it('recovers an exact line', () => {
    const fit = linearFit([1, 2, 3, 4].map(x => ({ x, y: 2 * x + 1 })))
    expect(fit.slope).toBeCloseTo(2)
    expect(fit.intercept).toBeCloseTo(1)
    expect(fit.r).toBeCloseTo(1)
  })

  it('uses every point rather than first vs last', () => {
    // First and last are equal, but the middle rises: slope should be ~0, not driven by endpoints
    const fit = linearFit([{ x: 1, y: 6 }, { x: 2, y: 8 }, { x: 3, y: 8 }, { x: 4, y: 6 }])
    expect(fit.slope).toBeCloseTo(0)
  })

  it('reports negative correlation', () => {
    expect(linearFit([1, 2, 3].map(x => ({ x, y: 10 - x }))).r).toBeCloseTo(-1)
  })

  it('handles no spread in x or y without NaN', () => {
    expect(linearFit([{ x: 5, y: 1 }, { x: 5, y: 9 }])).toEqual({ slope: 0, intercept: 5, r: 0 })
    expect(linearFit([{ x: 1, y: 7 }, { x: 2, y: 7 }]).r).toBe(0)
    expect(linearFit([])).toEqual({ slope: 0, intercept: 0, r: 0 })
  })
})

describe('ratingDomain', () => {
  it('pads and rounds to whole numbers', () => {
    expect(ratingDomain([6.2, 7.8])).toEqual([5, 9])
  })

  it('clamps to 0-10', () => {
    expect(ratingDomain([0.2, 9.9])).toEqual([0, 10])
  })

  it('falls back to the full scale when empty', () => {
    expect(ratingDomain([])).toEqual([0, 10])
  })
})

describe('extremeRaters', () => {
  it('picks highest and lowest scorer', () => {
    expect(extremeRaters([
      { userName: 'Anna', score: 3 },
      { userName: 'Jón', score: 9 },
      { userName: 'Gunna', score: 6 },
    ])).toEqual({
      highestRater: { userName: 'Jón', score: 9 },
      lowestRater: { userName: 'Anna', score: 3 },
    })
  })

  it('does not mutate the input', () => {
    const ratings = [{ userName: 'A', score: 1 }, { userName: 'B', score: 2 }]
    extremeRaters(ratings)
    expect(ratings[0].userName).toBe('A')
  })

  it('returns null for no ratings', () => {
    expect(extremeRaters([])).toBeNull()
  })
})

const names = { a: 'Anna', b: 'Bjarni', c: 'Gunna' }
const rate = (participantId: string, scores: number[]): RatingEntry[] =>
  scores.map((score, i) => ({ participantId, beerId: `beer${i}`, score }))

describe('comparePairs / tasteTwins', () => {
  const ratings = [
    ...rate('a', [8, 6, 4]),
    ...rate('b', [8, 7, 4]), // close to a
    ...rate('c', [2, 9, 9]), // far from both
  ]

  it('sorts pairs from most to least alike', () => {
    const pairs = comparePairs(ratings, names)
    expect(pairs.map(p => [p.a, p.b])).toEqual([['a', 'b'], ['b', 'c'], ['a', 'c']])
    expect(pairs[0].meanDifference).toBe(0.33)
    expect(pairs[0].sharedBeers).toBe(3)
  })

  it('only compares beers both rated and skips pairs below the minimum', () => {
    const sparse = [...rate('a', [8, 6, 4]), { participantId: 'b', beerId: 'beer0', score: 8 }]
    expect(comparePairs(sparse, names)).toEqual([])
    expect(comparePairs(sparse, names, 1)[0]).toMatchObject({ sharedBeers: 1, meanDifference: 0 })
  })

  it('returns closest and furthest pair', () => {
    const twins = tasteTwins(comparePairs(ratings, names))
    expect(twins?.closest).toMatchObject({ aName: 'Anna', bName: 'Bjarni' })
    expect(twins?.furthest).toMatchObject({ aName: 'Anna', bName: 'Gunna' })
  })

  it('needs at least two pairs to name twins and opposites', () => {
    expect(tasteTwins(comparePairs([...rate('a', [1, 2, 3]), ...rate('b', [1, 2, 3])], names))).toBeNull()
  })
})

describe('buildAwards', () => {
  const participantStats = [
    { userName: 'Anna', averageRating: 5, ratingsCount: 4 },
    { userName: 'Jón', averageRating: 8, ratingsCount: 4 },
    { userName: 'Óvirkur', averageRating: 0, ratingsCount: 0 },
  ]
  const beerControversy = [
    { beerId: 'b1', name: 'Umdeildur', standardDeviation: 3, highestRater: { userName: 'Jón', score: 9 }, lowestRater: { userName: 'Anna', score: 2 } },
    { beerId: 'b2', name: 'Sigurvegari', standardDeviation: 0.5, highestRater: { userName: 'Anna', score: 9.5 }, lowestRater: { userName: 'Jón', score: 8.5 } },
  ]

  it('builds all awards when data allows', () => {
    const awards = buildAwards({
      participantStats,
      beerControversy,
      winner: { beerId: 'b2', name: 'Sigurvegari' },
      tasteTwins: tasteTwins(comparePairs([...rate('a', [8, 6, 4]), ...rate('b', [8, 7, 4]), ...rate('c', [2, 9, 9])], names)),
    })
    expect(awards.map(a => a.title)).toEqual([
      'Örlátasti dómarinn',
      'Strangasti dómarinn',
      'Bragðtvíburar',
      'Algjörar andstæður',
      'Umdeildasti bjórinn',
      'Mest sammála um',
      'Stærsti aðdáandi sigurvegarans',
    ])
    expect(awards[0].main).toBe('Jón')
    // Participants with no ratings can't be "harshest"
    expect(awards[1].main).toBe('Anna')
    expect(awards[4].sub).toBe('Jón 9 vs Anna 2')
    expect(awards[6]).toMatchObject({ main: 'Anna', sub: '9.5 fyrir Sigurvegari' })
  })

  it('does not reorder the caller’s participant list', () => {
    const list = [...participantStats]
    buildAwards({ participantStats: list, beerControversy: [] })
    expect(list.map(p => p.userName)).toEqual(['Anna', 'Jón', 'Óvirkur'])
  })

  it('returns nothing with too little data', () => {
    expect(buildAwards({ participantStats: participantStats.slice(0, 1), beerControversy: [] })).toEqual([])
  })

  it('skips the controversy award when everyone agreed exactly', () => {
    const awards = buildAwards({ participantStats: [], beerControversy: [{ beerId: 'x', name: 'X', standardDeviation: 0 }] })
    expect(awards).toEqual([])
  })
})

describe('personalStats', () => {
  const participants = [
    { id: 'me', userName: 'Ég' },
    { id: 'twin', userName: 'Tvíburi' },
    { id: 'other', userName: 'Annar' },
  ]
  const beers = [
    { beerId: 'w', name: 'Sigurvegari', ratings: { me: 9, twin: 9, other: 9 } },
    { beerId: 'x', name: 'Miðlungs', ratings: { me: 6, twin: 6.5, other: 3 } },
    { beerId: 'y', name: 'Slæmur', ratings: { me: 2, twin: 2.5, other: 8 } },
    { beerId: 'z', name: 'Ósmakkaður', ratings: { me: null, twin: 5, other: 5 } },
  ]

  it('summarises one participant against the group', () => {
    const stats = personalStats({ participantId: 'me', participants, beers })
    expect(stats).toMatchObject({
      ratedCount: 3,
      myAverage: 5.67,
      favourite: { name: 'Sigurvegari', score: 9 },
      biggestDisagreement: { name: 'Slæmur', myScore: 2, groupAverage: 4.17 },
      twin: { userName: 'Tvíburi', sharedBeers: 3 },
    })
    // Offset is mean of (mine - beer average) over beers I rated
    expect(stats?.offset).toBeCloseTo(((9 - 9) + (6 - 5.1667) + (2 - 4.1667)) / 3, 2)
  })

  it('returns null when the participant rated nothing', () => {
    expect(personalStats({ participantId: 'nobody', participants, beers })).toBeNull()
  })
})
