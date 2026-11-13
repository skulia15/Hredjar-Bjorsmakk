export interface BeerRating {
  participantId: string
  name: string
  avatar?: string | null
  score: number
  /** When they first rated this beer */
  ratedAt: string
}

export type BeerAwardKind = 'fastest' | 'slowest' | 'generous' | 'strict' | 'outlier'

export interface BeerAward {
  kind: BeerAwardKind
  label: string
  /** Who, with ties joined: "Anna", "Anna og Jón", "Anna og 2 aðrir" */
  name: string
  /** The first winner, for the avatar */
  participantId: string
  avatar?: string | null
  detail: string
}

/** "Anna", "Anna og Jón", "Anna og 2 aðrir" */
export function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? ''
  if (names.length === 2) return `${names[0]} og ${names[1]}`
  return `${names[0]} og ${names.length - 1} aðrir`
}

function formatScore(score: number): string {
  return score.toFixed(1)
}

/** Minutes and seconds from the beer coming on to the rating: "1:05" */
function formatElapsed(fromIso: string | null | undefined, toIso: string): string | null {
  if (!fromIso) return null
  const seconds = Math.max(0, Math.round((new Date(toIso).getTime() - new Date(fromIso).getTime()) / 1000))
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

// Everyone sharing the top value of `pick`, in rating order
function winners(ratings: BeerRating[], pick: (r: BeerRating) => number): BeerRating[] {
  const best = Math.max(...ratings.map(pick))
  return ratings.filter(r => pick(r) === best)
}

function award(kind: BeerAwardKind, label: string, tied: BeerRating[], detail: string): BeerAward {
  return {
    kind,
    label,
    name: joinNames(tied.map(r => r.name)),
    participantId: tied[0].participantId,
    avatar: tied[0].avatar,
    detail,
  }
}

/**
 * The current beer's own awards for the score reveal: who rated it first and last, who scored it
 * highest and lowest, and who was furthest from the group. Needs at least two ratings to mean
 * anything; when everyone gave the same score, the score awards and Útlaginn are left out.
 */
export function beerAwards(ratings: BeerRating[], currentSince?: string | null): BeerAward[] {
  if (ratings.length < 2) return []
  const byTime = [...ratings].sort((a, b) => a.ratedAt.localeCompare(b.ratedAt))
  const awards: BeerAward[] = []

  const first = byTime[0]
  const last = byTime[byTime.length - 1]
  const firstTime = formatElapsed(currentSince, first.ratedAt)
  const lastTime = formatElapsed(currentSince, last.ratedAt)
  awards.push(award('fastest', 'Hraðastur', [first], firstTime ? `eftir ${firstTime}` : 'fyrsta einkunn'))
  awards.push(award('slowest', 'Hægastur', [last], lastTime ? `eftir ${lastTime}` : 'síðasta einkunn'))

  const scores = byTime.map(r => r.score)
  const allSame = scores.every(score => score === scores[0])
  if (!allSame) {
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length
    const generous = winners(byTime, r => r.score)
    const strict = winners(byTime, r => -r.score)
    const outliers = winners(byTime, r => Math.abs(r.score - average))
    const deviation = outliers[0].score - average
    awards.push(award('generous', 'Rausnarlegastur', generous, `gaf ${formatScore(generous[0].score)}`))
    awards.push(award('strict', 'Strangastur', strict, `gaf ${formatScore(strict[0].score)}`))
    awards.push(award('outlier', 'Útlaginn', outliers, `${deviation > 0 ? '+' : ''}${deviation.toFixed(2)} frá meðaltali`))
  }
  return awards
}
