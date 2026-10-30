// Pure statistics helpers shared by the analytics API, scores page and projector.
// Kept free of Prisma/React so they can be unit tested.

const round2 = (n: number) => Number(n.toFixed(2))

const mean = (values: number[]) => values.reduce((sum, v) => sum + v, 0) / values.length

/**
 * Average, population standard deviation and range of a set of scores.
 * Returns zeros for an empty set.
 */
export function summarizeScores(scores: number[]) {
  if (scores.length === 0) {
    return { average: 0, standardDeviation: 0, min: 0, max: 0 }
  }
  const average = mean(scores)
  const variance = scores.reduce((sum, s) => sum + (s - average) ** 2, 0) / scores.length
  return {
    average: round2(average),
    standardDeviation: round2(Math.sqrt(variance)),
    min: Math.min(...scores),
    max: Math.max(...scores),
  }
}

/** Least-squares fit through the points; slope is y change per x unit */
export function linearFit(points: Array<{ x: number; y: number }>) {
  const n = points.length
  if (n === 0) return { slope: 0, intercept: 0, r: 0 }
  const meanX = points.reduce((sum, p) => sum + p.x, 0) / n
  const meanY = points.reduce((sum, p) => sum + p.y, 0) / n
  const covXY = points.reduce((sum, p) => sum + (p.x - meanX) * (p.y - meanY), 0)
  const varX = points.reduce((sum, p) => sum + (p.x - meanX) ** 2, 0)
  const varY = points.reduce((sum, p) => sum + (p.y - meanY) ** 2, 0)
  const slope = varX > 0 ? covXY / varX : 0
  return {
    slope,
    intercept: meanY - slope * meanX,
    // Pearson correlation; 0 when either axis has no spread
    r: varX > 0 && varY > 0 ? covXY / Math.sqrt(varX * varY) : 0,
  }
}

/** Zoomed y-axis for line/scatter charts so small differences are visible */
export function ratingDomain(values: number[]): [number, number] {
  if (values.length === 0) return [0, 10]
  const min = Math.min(...values)
  const max = Math.max(...values)
  return [Math.max(0, Math.floor(min - 0.5)), Math.min(10, Math.ceil(max + 0.5))]
}

export interface RatingEntry {
  participantId: string
  beerId: string
  score: number
}

export interface Rater {
  userName: string
  score: number
}

/** Highest and lowest scorer for one beer; null when nobody rated it */
export function extremeRaters(ratings: Array<{ userName: string; score: number }>) {
  if (ratings.length === 0) return null
  const sorted = [...ratings].sort((a, b) => b.score - a.score)
  const highest = sorted[0]
  const lowest = sorted[sorted.length - 1]
  return {
    highestRater: { userName: highest.userName, score: highest.score },
    lowestRater: { userName: lowest.userName, score: lowest.score },
  }
}

export interface TastePair {
  a: string
  b: string
  aName: string
  bName: string
  // Mean absolute score difference over beers both rated
  meanDifference: number
  sharedBeers: number
}

// Fewer shared beers than this and "similarity" is mostly noise
export const MIN_SHARED_BEERS = 3

/**
 * Compare every pair of participants on the beers they both rated.
 * Pairs below `minShared` shared beers are skipped.
 */
export function comparePairs(
  ratings: RatingEntry[],
  names: Record<string, string>,
  minShared = MIN_SHARED_BEERS,
): TastePair[] {
  const byParticipant = new Map<string, Map<string, number>>()
  for (const r of ratings) {
    if (!byParticipant.has(r.participantId)) byParticipant.set(r.participantId, new Map())
    byParticipant.get(r.participantId)!.set(r.beerId, r.score)
  }

  const ids = [...byParticipant.keys()].sort()
  const pairs: TastePair[] = []
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const aScores = byParticipant.get(ids[i])!
      const bScores = byParticipant.get(ids[j])!
      const diffs: number[] = []
      for (const [beerId, score] of aScores) {
        const other = bScores.get(beerId)
        if (other !== undefined) diffs.push(Math.abs(score - other))
      }
      if (diffs.length < minShared) continue
      pairs.push({
        a: ids[i],
        b: ids[j],
        aName: names[ids[i]] ?? ids[i],
        bName: names[ids[j]] ?? ids[j],
        meanDifference: round2(mean(diffs)),
        sharedBeers: diffs.length,
      })
    }
  }
  return pairs.sort((x, y) => x.meanDifference - y.meanDifference)
}

/** Closest and furthest pair; null when fewer than two comparable pairs exist */
export function tasteTwins(pairs: TastePair[]) {
  if (pairs.length < 2) return null
  return { closest: pairs[0], furthest: pairs[pairs.length - 1] }
}

export type AwardKind = 'generous' | 'harsh' | 'twins' | 'opposites' | 'controversial' | 'unanimous' | 'winnerFan'

export interface Award {
  kind: AwardKind
  title: string
  main: string
  sub: string
}

interface AwardInputs {
  participantStats: Array<{ userName: string; averageRating: number; ratingsCount: number }>
  beerControversy: Array<{
    beerId: string
    name: string
    standardDeviation: number
    highestRater?: Rater
    lowestRater?: Rater
  }>
  winner?: { beerId: string; name: string }
  tasteTwins?: { closest: TastePair; furthest: TastePair } | null
}

/** Headline awards; each only included when there's enough data for it to mean something */
export function buildAwards({ participantStats, beerControversy, winner, tasteTwins }: AwardInputs): Award[] {
  const awards: Award[] = []
  const raters = participantStats
    .filter(p => p.ratingsCount > 0)
    .sort((a, b) => b.averageRating - a.averageRating)

  if (raters.length > 1) {
    const generous = raters[0]
    const harsh = raters[raters.length - 1]
    awards.push({
      kind: 'generous',
      title: 'Örlátasti dómarinn',
      main: generous.userName,
      sub: `Meðaleinkunn ${generous.averageRating.toFixed(2)}`,
    })
    awards.push({
      kind: 'harsh',
      title: 'Strangasti dómarinn',
      main: harsh.userName,
      sub: `Meðaleinkunn ${harsh.averageRating.toFixed(2)}`,
    })
  }

  if (tasteTwins) {
    const { closest, furthest } = tasteTwins
    awards.push({
      kind: 'twins',
      title: 'Bragðtvíburar',
      main: `${closest.aName} & ${closest.bName}`,
      sub: `Aðeins ${closest.meanDifference.toFixed(1)} stig á milli að meðaltali`,
    })
    awards.push({
      kind: 'opposites',
      title: 'Algjörar andstæður',
      main: `${furthest.aName} & ${furthest.bName}`,
      sub: `${furthest.meanDifference.toFixed(1)} stig á milli að meðaltali`,
    })
  }

  const mostControversial = beerControversy[0]
  if (mostControversial && mostControversial.standardDeviation > 0) {
    const { highestRater, lowestRater } = mostControversial
    awards.push({
      kind: 'controversial',
      title: 'Umdeildasti bjórinn',
      main: mostControversial.name,
      sub: highestRater && lowestRater
        ? `${highestRater.userName} ${highestRater.score} vs ${lowestRater.userName} ${lowestRater.score}`
        : `Staðalfrávik ${mostControversial.standardDeviation.toFixed(2)}`,
    })
  }

  if (beerControversy.length > 1) {
    const unanimous = beerControversy[beerControversy.length - 1]
    awards.push({
      kind: 'unanimous',
      title: 'Mest sammála um',
      main: unanimous.name,
      sub: `Staðalfrávik ${unanimous.standardDeviation.toFixed(2)}`,
    })
  }

  const winnerFan = winner && beerControversy.find(b => b.beerId === winner.beerId)?.highestRater
  if (winner && winnerFan) {
    awards.push({
      kind: 'winnerFan',
      title: 'Stærsti aðdáandi sigurvegarans',
      main: winnerFan.userName,
      sub: `${winnerFan.score} fyrir ${winner.name}`,
    })
  }

  return awards
}

export interface PersonalStatsInput {
  participantId: string
  participants: Array<{ id: string; userName: string }>
  beers: Array<{
    beerId: string
    name: string
    ratings: Record<string, number | null>
  }>
}

/**
 * One participant's view of the tasting: how they compare to the group,
 * their favourite beer, biggest disagreement and who they agree with most.
 * Returns null if the participant rated nothing.
 */
export function personalStats({ participantId, participants, beers }: PersonalStatsInput) {
  const scored = beers
    .map(beer => {
      const scores = Object.values(beer.ratings).filter((s): s is number => s !== null)
      const mine = beer.ratings[participantId]
      return { beer, mine, groupAverage: scores.length > 0 ? mean(scores) : 0, raters: scores.length }
    })
    .filter((b): b is typeof b & { mine: number } => b.mine !== null && b.mine !== undefined)

  if (scored.length === 0) return null

  const myAverage = mean(scored.map(b => b.mine))
  // Positive = rates above the room on the same beers
  const offset = mean(scored.map(b => b.mine - b.groupAverage))

  const favourite = [...scored].sort((a, b) => b.mine - a.mine)[0]

  // Only beers someone else also rated can be a disagreement
  const disagreement = scored
    .filter(b => b.raters > 1)
    .sort((a, b) => Math.abs(b.mine - b.groupAverage) - Math.abs(a.mine - a.groupAverage))[0]

  const names = Object.fromEntries(participants.map(p => [p.id, p.userName]))
  const entries: RatingEntry[] = beers.flatMap(beer =>
    Object.entries(beer.ratings)
      .filter((e): e is [string, number] => e[1] !== null)
      .map(([pid, score]) => ({ participantId: pid, beerId: beer.beerId, score })),
  )
  const myPairs = comparePairs(entries, names).filter(p => p.a === participantId || p.b === participantId)
  const twin = myPairs[0]

  return {
    ratedCount: scored.length,
    myAverage: round2(myAverage),
    offset: round2(offset),
    favourite: { name: favourite.beer.name, score: favourite.mine },
    biggestDisagreement: disagreement
      ? {
          name: disagreement.beer.name,
          myScore: disagreement.mine,
          groupAverage: round2(disagreement.groupAverage),
        }
      : null,
    twin: twin
      ? {
          userName: twin.a === participantId ? twin.bName : twin.aName,
          meanDifference: twin.meanDifference,
          sharedBeers: twin.sharedBeers,
        }
      : null,
  }
}

export type PersonalStats = NonNullable<ReturnType<typeof personalStats>>
