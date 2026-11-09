import { describe, expect, it } from 'vitest'
import {
  bestValue,
  buildAwards,
  closestGuess,
  comparePairs,
  guessAccuracy,
  extremeRaters,
  generousAndHarsh,
  median,
  quantile,
  linearFit,
  personalStats,
  rankByAverage,
  soleWinner,
  winnersName,
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

  it('names everyone sharing the top or bottom score', () => {
    expect(extremeRaters([
      { userName: 'Anna', score: 9 },
      { userName: 'Jón', score: 6 },
      { userName: 'Gunna', score: 9 },
    ])).toEqual({
      highestRater: { userName: 'Anna & Gunna', score: 9 },
      lowestRater: { userName: 'Jón', score: 6 },
    })
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

  it('adds the guessing, value and speed awards when there is competition', () => {
    const awards = buildAwards({
      participantStats: [],
      beerControversy: [],
      guessAccuracy: [
        { participantId: 'a', userName: 'Anna', meanError: 0.25, guesses: 3 },
        { participantId: 'b', userName: 'Jón', meanError: 1, guesses: 3 },
      ],
      bestValue: { name: 'Ódýr', average: 7.456, pricePerLiter: 649.6 },
      ratingSpeed: [{ userName: 'Jón', averageMinutes: 1.2 }, { userName: 'Anna', averageMinutes: 3 }],
    })
    expect(awards.map(a => [a.kind, a.main, a.sub])).toEqual([
      ['mindReader', 'Anna', 'Aðeins 0.25 frá meðaltalinu að jafnaði'],
      ['bestValue', 'Ódýr', '7.46 fyrir 650 kr/L'],
      ['fastest', 'Jón', '1.2 mín að meðaltali'],
    ])
  })

  it('skips the guessing and speed awards with a single contender', () => {
    const awards = buildAwards({
      participantStats: [],
      beerControversy: [],
      guessAccuracy: [{ participantId: 'a', userName: 'Anna', meanError: 0, guesses: 1 }],
      ratingSpeed: [{ userName: 'Jón', averageMinutes: 1.2 }],
    })
    expect(awards).toEqual([])
  })

  it('does not reorder the caller’s participant list', () => {
    const list = [...participantStats]
    buildAwards({ participantStats: list, beerControversy: [] })
    expect(list.map(p => p.userName)).toEqual(['Anna', 'Jón', 'Óvirkur'])
  })

  it('returns nothing with too little data', () => {
    expect(buildAwards({ participantStats: participantStats.slice(0, 1), beerControversy: [] })).toEqual([])
  })

  it('names everyone sharing the top or bottom, and skips both when all averaged the same', () => {
    const tied = buildAwards({
      participantStats: [
        { userName: 'Anna', averageRating: 8, ratingsCount: 2 },
        { userName: 'Jón', averageRating: 8, ratingsCount: 2 },
        { userName: 'Gunna', averageRating: 6, ratingsCount: 2 },
      ],
      beerControversy: [],
    })
    expect(tied.map(a => [a.kind, a.main])).toEqual([['generous', 'Anna & Jón'], ['harsh', 'Gunna']])

    const allSame = buildAwards({
      participantStats: [
        { userName: 'Anna', averageRating: 7, ratingsCount: 2 },
        { userName: 'Jón', averageRating: 7, ratingsCount: 2 },
      ],
      beerControversy: [],
    })
    expect(allSame).toEqual([])
  })

  it('gives the mind reader award to someone who kept guessing, not one lucky guess', () => {
    const awards = buildAwards({
      participantStats: [],
      beerControversy: [],
      guessAccuracy: [
        { participantId: 'a', userName: 'Heppinn', meanError: 0.1, guesses: 1 },
        { participantId: 'b', userName: 'Stöðugur', meanError: 0.2, guesses: 8 },
        { participantId: 'c', userName: 'Hálfur', meanError: 0.5, guesses: 4 },
      ],
    })
    expect(awards).toEqual([expect.objectContaining({ kind: 'mindReader', main: 'Stöðugur' })])
  })

  it('skips the controversy award when everyone agreed exactly', () => {
    const awards = buildAwards({ participantStats: [], beerControversy: [{ beerId: 'x', name: 'X', standardDeviation: 0 }] })
    expect(awards).toEqual([])
  })
})

describe('guessAccuracy', () => {
  it('averages each participant’s error and ranks the closest first', () => {
    expect(guessAccuracy([
      { participantId: 'a', userName: 'Anna', guess: 7, actual: 8 },
      { participantId: 'a', userName: 'Anna', guess: 6, actual: 6 },
      { participantId: 'b', userName: 'Jón', guess: 5, actual: 5.25 },
    ])).toEqual([
      { participantId: 'b', userName: 'Jón', meanError: 0.25, guesses: 1 },
      { participantId: 'a', userName: 'Anna', meanError: 0.5, guesses: 2 },
    ])
  })

  it('breaks ties in favour of more guesses', () => {
    const ranked = guessAccuracy([
      { participantId: 'a', userName: 'Anna', guess: 5, actual: 5 },
      { participantId: 'b', userName: 'Jón', guess: 5, actual: 5 },
      { participantId: 'b', userName: 'Jón', guess: 6, actual: 6 },
    ])
    expect(ranked.map(r => r.userName)).toEqual(['Jón', 'Anna'])
  })
})

describe('closestGuess', () => {
  it('picks the nearest guess', () => {
    expect(closestGuess([{ userName: 'Anna', guess: 6 }, { userName: 'Jón', guess: 7.5 }], 7.2))
      .toMatchObject({ userName: 'Jón', guess: 7.5 })
  })

  it('returns null without guesses', () => {
    expect(closestGuess([], 7)).toBeNull()
  })
})

describe('bestValue', () => {
  it('picks the highest average per kr/L', () => {
    expect(bestValue([
      { name: 'Dýr', average: 9, pricePerLiter: 2000 },
      { name: 'Ódýr', average: 6, pricePerLiter: 800 },
    ])?.name).toBe('Ódýr')
  })

  it('needs two priced beers', () => {
    expect(bestValue([{ name: 'Einn', average: 9, pricePerLiter: 900 }, { name: 'Ekkert verð', average: 5, pricePerLiter: 0 }])).toBeNull()
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

describe('rankByAverage / soleWinner / winnersName', () => {
  const ranked = rankByAverage([
    { name: 'A', average: 7.5 },
    { name: 'B', average: 7.5 },
    { name: 'C', average: 6 },
    { name: 'D', average: 6 },
    { name: 'E', average: 5 },
  ])

  it('shares a place on the same average and skips the places taken', () => {
    expect(ranked.map(b => b.rank)).toEqual([1, 1, 3, 3, 5])
  })

  it('has no sole winner on a shared first place, and names everyone in it', () => {
    expect(soleWinner(ranked)).toBeUndefined()
    expect(winnersName(ranked)).toBe('A & B')
    const clear = rankByAverage([{ name: 'A', average: 8 }, { name: 'B', average: 7 }])
    expect(soleWinner(clear)?.name).toBe('A')
    expect(winnersName(clear)).toBe('A')
    expect(soleWinner([])).toBeUndefined()
    expect(winnersName([])).toBeUndefined()
  })
})

describe('generousAndHarsh', () => {
  it('needs two raters who differ', () => {
    expect(generousAndHarsh([{ userName: 'Anna', averageRating: 8, ratingsCount: 2 }])).toBeNull()
    expect(generousAndHarsh([
      { userName: 'Anna', averageRating: 7, ratingsCount: 2 },
      { userName: 'Jón', averageRating: 7, ratingsCount: 2 },
    ])).toBeNull()
  })

  it('leaves out people who rated nothing', () => {
    expect(generousAndHarsh([
      { userName: 'Anna', averageRating: 8, ratingsCount: 2 },
      { userName: 'Jón', averageRating: 6, ratingsCount: 2 },
      { userName: 'Óvirkur', averageRating: 0, ratingsCount: 0 },
    ])).toEqual({
      generous: { userName: 'Anna', averageRating: 8 },
      harsh: { userName: 'Jón', averageRating: 6 },
    })
  })
})

describe('quantile / median', () => {
  it('takes the mean of the middle two on an even count', () => {
    expect(median([4, 1, 3, 2])).toBe(2.5)
    expect(median([5, 1, 3])).toBe(3)
    expect(median([])).toBe(0)
  })

  it('interpolates quartiles instead of jumping to the max', () => {
    const sorted = [1, 2, 3, 4]
    expect(quantile(sorted, 0.25)).toBe(1.75)
    expect(quantile(sorted, 0.75)).toBe(3.25)
    expect(quantile(sorted, 1)).toBe(4)
  })
})
