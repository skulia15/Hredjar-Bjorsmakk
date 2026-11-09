import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { NextRequest } from 'next/server'
import { ImageResponse } from 'next/og'
import { GET as getAnalytics } from '@/app/api/tastings/[id]/analytics/route'
import { GET as getScores } from '@/app/api/tastings/[id]/scores/route'
import { type Award, type AwardKind, buildAwards } from '@/lib/stats'

export const SHARE_CARD_SIZE = { width: 1200, height: 630 }

// Palette from tailwind.config.ts
const PINE = '#123A2C'
const PINE_LIGHT = '#1A4A39'
const PINE_LINE = '#2F6150'
const CREAM = '#FBF6EA'
const INK = '#1E1B16'
const INK_MUTED = '#5E574A'
const GOLD = '#F2A93B'
const SILVER = '#D9D3C4'
const CRANBERRY = '#C8323A'
const MINT = '#A8D5C2'

const PLACE_COLORS = [GOLD, SILVER, CRANBERRY]
const PLACE_TEXT = [INK, INK, '#FFFFFF']

// The most fun to read in a group chat first; the card has room for three
const AWARD_PRIORITY: AwardKind[] = ['controversial', 'twins', 'winnerFan', 'harsh', 'generous', 'bestValue', 'mindReader', 'opposites', 'unanimous', 'fastest']

interface ScoresBeer {
  beerId: string
  name: string
  brewery: string
  average: number
  count: number
}

interface ScoresResponse {
  title: string
  status: string
  beers: ScoresBeer[]
}

type AnalyticsResponse = Parameters<typeof buildAwards>[0] & {
  overview: { totalParticipants: number; finishedBeers: number }
  participantRatingSpeed?: Parameters<typeof buildAwards>[0]['ratingSpeed']
}

// Static instances: satori can't read variable fonts
async function loadFonts() {
  const dir = join(process.cwd(), 'src/assets/fonts')
  const [regular, bold] = await Promise.all([
    readFile(join(dir, 'BricolageGrotesque-400.ttf')),
    readFile(join(dir, 'BricolageGrotesque-800.ttf')),
  ])
  return [
    { name: 'Bricolage', data: regular, weight: 400 as const, style: 'normal' as const },
    { name: 'Bricolage', data: bold, weight: 800 as const, style: 'normal' as const },
  ]
}

async function mugDataUri() {
  const svg = await readFile(join(process.cwd(), 'src/app/icon.svg'))
  return `data:image/svg+xml;base64,${svg.toString('base64')}`
}

// Reuses the API handlers so the card always agrees with the scores page
async function loadTastingResults(id: string) {
  const context = { params: Promise.resolve({ id }) }
  const request = new NextRequest(`http://localhost/api/tastings/${id}`)
  const [scoresResponse, analyticsResponse] = await Promise.all([getScores(request, context), getAnalytics(request, context)])
  if (!scoresResponse.ok) return null
  const scores = (await scoresResponse.json()) as ScoresResponse
  const analytics = analyticsResponse.ok ? ((await analyticsResponse.json()) as AnalyticsResponse) : null
  return { scores, analytics }
}

function pickAwards(scores: ScoresResponse, analytics: AnalyticsResponse | null): Award[] {
  if (!analytics) return []
  const awards = buildAwards({
    participantStats: analytics.participantStats,
    beerControversy: analytics.beerControversy ?? [],
    winner: scores.beers[0],
    tasteTwins: analytics.tasteTwins,
    guessAccuracy: analytics.guessAccuracy,
    bestValue: analytics.bestValue,
    ratingSpeed: analytics.participantRatingSpeed,
  })
  return AWARD_PRIORITY.flatMap(kind => awards.filter(a => a.kind === kind)).slice(0, 3)
}

// Icelandic takes the singular after numbers ending in 1, except 11: 1 bjór, 21 bjór, 11 bjórar
function countOf(n: number, singular: string, plural: string) {
  return `${n} ${n % 10 === 1 && n % 100 !== 11 ? singular : plural}`
}

const ellipsis = { overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' } as const

/**
 * The tasting's podium and headline awards as a 1200×630 PNG, for link previews and sharing to a group chat.
 * Null when the tasting doesn't exist.
 */
export async function renderShareCard(id: string): Promise<ImageResponse | null> {
  const [results, fonts, mug] = await Promise.all([loadTastingResults(id), loadFonts(), mugDataUri()])
  if (!results) return null
  const { scores, analytics } = results
  const podium = scores.beers.slice(0, 3)
  const awards = pickAwards(scores, analytics)
  const isLive = scores.status !== 'closed'

  const facts = [
    analytics && countOf(analytics.overview.totalParticipants, 'smakkari', 'smakkarar'),
    countOf(scores.beers.length, 'bjór', 'bjórar'),
  ].filter(Boolean).join('  ·  ')

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: PINE, color: CREAM, fontFamily: 'Bricolage', padding: '40px 48px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- satori renders plain img only */}
          <img src={mug} width={84} height={84} alt="" />
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', fontSize: 20, fontWeight: 800, letterSpacing: 3, color: GOLD, textTransform: 'uppercase' }}>
              Hreðjar Bjórsmakk
            </div>
            <div style={{ display: 'block', fontSize: 50, fontWeight: 800, lineHeight: 1.1, ...ellipsis }}>{scores.title}</div>
            <div style={{ display: 'flex', fontSize: 22, color: MINT, marginTop: 2 }}>{facts}</div>
          </div>
          {isLive && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: CRANBERRY, color: '#FFFFFF', fontSize: 22, fontWeight: 800, padding: '10px 20px', borderRadius: 999 }}>
              <div style={{ width: 12, height: 12, borderRadius: 999, background: '#FFFFFF' }} />
              Í gangi
            </div>
          )}
        </div>

        {/* Podium */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24, flex: 1 }}>
          {podium.length === 0 && (
            <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', fontSize: 34, color: MINT }}>
              Engir bjórar hafa fengið einkunn ennþá
            </div>
          )}
          {podium.map((beer, i) => (
            <div key={beer.beerId} style={{ display: 'flex', alignItems: 'center', gap: 20, background: CREAM, color: INK, borderRadius: 20, padding: '0 28px 0 16px', height: i === 0 ? 96 : 80 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: 999, background: PLACE_COLORS[i], color: PLACE_TEXT[i], fontSize: 30, fontWeight: 800 }}>
                {i + 1}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                <div style={{ display: 'block', fontSize: i === 0 ? 36 : 30, fontWeight: 800, lineHeight: 1.1, ...ellipsis }}>{beer.name}</div>
                <div style={{ display: 'block', fontSize: 20, color: INK_MUTED, ...ellipsis }}>{beer.brewery}</div>
              </div>
              <div style={{ display: 'flex', fontSize: i === 0 ? 52 : 42, fontWeight: 800 }}>{beer.average.toFixed(2)}</div>
            </div>
          ))}
        </div>

        {/* Awards */}
        {awards.length > 0 && (
          <div style={{ display: 'flex', gap: 14, marginTop: 20 }}>
            {awards.map(award => (
              <div key={award.kind} style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, background: PINE_LIGHT, border: `2px solid ${PINE_LINE}`, borderRadius: 16, padding: '12px 18px' }}>
                {/* Wraps rather than truncates: "Stærsti aðdáandi sigurvegarans" doesn't fit on one line */}
                <div style={{ display: 'flex', fontSize: 15, fontWeight: 800, letterSpacing: 1.2, lineHeight: 1.2, color: GOLD, textTransform: 'uppercase' }}>{award.title}</div>
                <div style={{ display: 'block', fontSize: 26, fontWeight: 800, marginTop: 'auto', ...ellipsis }}>{award.main}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    ),
    {
      ...SHARE_CARD_SIZE,
      fonts,
      // next/og defaults to a year-long immutable cache; a live tasting's card changes with every beer
      headers: { 'cache-control': isLive ? 'public, max-age=30' : 'public, max-age=3600' },
    }
  )
}
