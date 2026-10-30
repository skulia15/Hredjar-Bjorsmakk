'use client'

import { BarChart, Bar, LineChart, Line, PieChart, Pie, ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ZAxis, LabelList, ReferenceLine } from 'recharts'
import { useChartTheme } from '@/hooks/useChartTheme'
import { buildAwards, linearFit, ratingDomain, type TastePair } from '@/lib/stats'
import { Brain, CircleCheck, Equal, Flame, Globe, type LucideIcon, MoveRight, Scale, Smile, ThumbsDown, ThumbsUp, TrendingDown, TrendingUp, TriangleAlert } from 'lucide-react'
import { AwardIcon } from '@/components/AwardIcon'
import { RankMedal } from '@/components/RankMedal'

function IconLabel({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1">
      <Icon className="h-3.5 w-3.5 flex-shrink-0" />
      {children}
    </span>
  )
}

interface BeerScore {
  beerId: string
  name: string
  brewery: string
  average: number
  count: number
  rank: number
}

interface BeerTiming {
  beerId: string
  name: string
  durationMinutes: number
}

interface RatingTrendPoint {
  beerIndex: number
  beerId: string
  name: string
  average: number
  ratingsCount: number
}

interface StyleDistribution {
  style: string
  count: number
  averageRating: number
  totalRatings: number
}

interface BeerControversy {
  beerId: string
  name: string
  brewery: string
  average: number
  standardDeviation: number
  ratingsCount: number
  controversy: string
  highestRater?: { userName: string; score: number }
  lowestRater?: { userName: string; score: number }
}

interface AbvVsRating {
  beerId: string
  name: string
  abv: number
  averageRating: number
  ratingsCount: number
}

interface RatingVelocity {
  beerId: string
  name: string
  durationMinutes: number
  ratingsCount: number
  ratingsPerMinute: number
}

interface ParticipantDeviation {
  participantId: string
  userName: string
  userAverage: number
  groupAverage: number
  deviation: number
  ratingsCount: number
}

interface RatingConsensus {
  beerId: string
  name: string
  fullName: string
  consensus: number
  standardDeviation: number
  averageRating: number
}

interface ParticipantStats {
  participantId: string
  userName: string
  code: string
  ratingsCount: number
  possibleRatings: number
  engagementRate: number
  averageRating: number
}

interface StylePerformanceRanking {
  style: string
  beersCount: number
  ratingsCount: number
  averageRating: number
  standardDeviation: number
  minRating: number
  maxRating: number
}

interface StyleRatingSpread {
  style: string
  beersCount: number
  ratingsCount: number
  standardDeviation: number
  agreement: string
}

interface StyleRatingDistribution {
  style: string
  beersCount: number
  ratingsCount: number
  min: number
  q1: number
  median: number
  q3: number
  max: number
  average: number
}

interface ParticipantStylePreferences {
  participantId: string
  userName: string
  favoriteStyle: { style: string; average: number; count: number } | null
  leastFavoriteStyle: { style: string; average: number; count: number } | null
  allStylePreferences: Array<{ style: string; average: number; count: number }>
}

interface UnanimousRating {
  beerId: string
  name: string
  brewery: string
  average: number
  standardDeviation: number
  ratingsCount: number
  minRating: number
  maxRating: number
  range: number
  unanimity: string
}

interface ParticipantRatingSpread {
  participantId: string
  userName: string
  ratingsCount: number
  minRating: number
  maxRating: number
  range: number
  average: number
  standardDeviation: number
  ratingStyle: string
}

interface CountryPerformanceRanking {
  country: string
  beersCount: number
  ratingsCount: number
  averageRating: number
  standardDeviation: number
  minRating: number
  maxRating: number
}

interface LocalVsInternational {
  icelandic: {
    beersCount: number
    ratingsCount: number
    averageRating: number
  }
  international: {
    beersCount: number
    ratingsCount: number
    averageRating: number
  }
  difference: number
  favoritism: string
}

interface CountryDistribution {
  country: string
  count: number
  averageRating: number
  totalRatings: number
}

interface ParticipantCountryPreferences {
  participantId: string
  userName: string
  favoriteCountry: { country: string; average: number; count: number } | null
  leastFavoriteCountry: { country: string; average: number; count: number } | null
  allCountryPreferences: Array<{ country: string; average: number; count: number }>
}

interface CountryRatingConsensus {
  country: string
  beersCount: number
  ratingsCount: number
  averageRating: number
  standardDeviation: number
  agreement: string
}

interface BreweryPerformanceRanking {
  brewery: string
  country?: string
  beersCount: number
  ratingsCount: number
  averageRating: number
  standardDeviation: number
  minRating: number
  maxRating: number
}

interface BreweryConsistency {
  brewery: string
  country?: string
  beersCount: number
  averageRating: number
  standardDeviation: number
  consistency: string
}

interface BreweryDistribution {
  brewery: string
  country?: string
  count: number
  averageRating: number
  totalRatings: number
}

interface BreweryPortfolio {
  brewery: string
  country?: string
  beersCount: number
  averageRating: number
  beers: Array<{
    name: string
    rating: number
    ratingsCount: number
  }>
}

interface IcelandicBrewery {
  brewery: string
  country?: string
  beersCount: number
  ratingsCount: number
  averageRating: number
  standardDeviation: number
  minRating: number
  maxRating: number
  rank: number
}

interface ParticipantBreweryPreferences {
  participantId: string
  userName: string
  favoriteBrewery: { brewery: string; average: number; count: number } | null
  leastFavoriteBrewery: { brewery: string; average: number; count: number } | null
  allBreweryPreferences: Array<{ brewery: string; average: number; count: number }>
}

interface AnalyticsData {
  overview: {
    overallAverage: number
    averageTimePerBeer: number | null
  }
  participantStats: ParticipantStats[]
  ratingDistribution: Record<string, number>
  ratingTrend?: RatingTrendPoint[]
  styleDistribution?: StyleDistribution[]
  beerControversy?: BeerControversy[]
  abvVsRating?: AbvVsRating[]
  ratingVelocity?: RatingVelocity[]
  participantDeviation?: ParticipantDeviation[]
  ratingConsensus?: RatingConsensus[]
  beerTimings: BeerTiming[]
  // Style analytics
  stylePerformanceRanking?: StylePerformanceRanking[]
  styleRatingSpread?: StyleRatingSpread[]
  styleRatingDistribution?: StyleRatingDistribution[]
  participantStylePreferences?: ParticipantStylePreferences[]
  unanimousRatings?: UnanimousRating[]
  participantRatingSpread?: ParticipantRatingSpread[]
  tasteTwins?: { closest: TastePair; furthest: TastePair } | null
  // Brewery analytics
  breweryPerformanceRanking?: BreweryPerformanceRanking[]
  breweryConsistency?: BreweryConsistency[]
  breweryDistribution?: BreweryDistribution[]
  breweryPortfolio?: BreweryPortfolio[]
  icelandicBreweries?: IcelandicBrewery[]
  participantBreweryPreferences?: ParticipantBreweryPreferences[]
  // Country analytics
  countryPerformanceRanking?: CountryPerformanceRanking[]
  localVsInternational?: LocalVsInternational
  countryDistribution?: CountryDistribution[]
  participantCountryPreferences?: ParticipantCountryPreferences[]
  countryRatingConsensus?: CountryRatingConsensus[]
}

interface ScoresChartsProps {
  scores: { beers: BeerScore[] }
  analytics: AnalyticsData
}

// Single-beer styles/breweries just repeat the leaderboard
const MIN_BEERS_PER_GROUP = 2

// Which analytics sections to render. Data is still computed by the API;
// flip a flag to bring a section back.
const VISIBLE_SECTIONS = {
  ratingTrend: true,
  styleDistribution: false,
  ratingDistribution: false,
  beerComparison: false,
  beerTimings: false,
  participantAverages: true,
  beerControversy: true,
  abvVsRating: true,
  ratingVelocity: false,
  participantDeviation: false,
  ratingConsensus: false,
  stylePerformanceRanking: true,
  styleRatingSpread: false,
  participantStylePreferences: true,
  unanimousRatings: false,
  participantRatingSpread: false,
  breweryPerformanceRanking: true,
  breweryDistribution: false,
  breweryConsistency: false,
  icelandicBreweries: false,
  breweryPortfolio: false,
  participantBreweryPreferences: false,
  countryPerformanceRanking: false,
  localVsInternational: true,
  countryDetails: false,
  countryDistribution: false,
  participantCountryPreferences: false,
  countryRatingConsensus: false,
} as const

export function ScoresCharts({ scores, analytics }: ScoresChartsProps) {
  const chart = useChartTheme()
  // Colors for pie chart
  const COLORS = chart.pieColors

  // Country to flag emoji mapping (Icelandic country names)
  const getCountryFlag = (country: string): string => {
    const flagMap: Record<string, string> = {
      // Icelandic names
      'Ísland': '🇮🇸',
      'Þýskaland': '🇩🇪',
      'Bandaríkin': '🇺🇸',
      'Bretland': '🇬🇧',
      'Írland': '🇮🇪',
      'Belgía': '🇧🇪',
      'Holland': '🇳🇱',
      'Frakkland': '🇫🇷',
      'Spánn': '🇪🇸',
      'Ítalía': '🇮🇹',
      'Portúgal': '🇵🇹',
      'Danmörk': '🇩🇰',
      'Noregur': '🇳🇴',
      'Svíþjóð': '🇸🇪',
      'Finnland': '🇫🇮',
      'Pólland': '🇵🇱',
      'Tékkland': '🇨🇿',
      'Austurríki': '🇦🇹',
      'Sviss': '🇨🇭',
      'Kanada': '🇨🇦',
      'Mexíkó': '🇲🇽',
      'Brasilía': '🇧🇷',
      'Argentína': '🇦🇷',
      'Ástralía': '🇦🇺',
      'Nýja-Sjáland': '🇳🇿',
      'Kína': '🇨🇳',
      'Suður-Kórea': '🇰🇷',
      'Eistland': '🇪🇪',
      'Lettland': '🇱🇻',
      'Litháen': '🇱🇹',
      'Rússland': '🇷🇺',
      'Úkraína': '🇺🇦',
      'Grikkland': '🇬🇷',
      'Króatía': '🇭🇷',
      'Slóvenía': '🇸🇮',
      'Rúmenía': '🇷🇴',
      'Ungverjaland': '🇭🇺',
      'Slóvakía': '🇸🇰',
      'Búlgaría': '🇧🇬',
      'Serbía': '🇷🇸',
      'Færeyjar': '🇫🇴',
      // English names (fallback)
      'Iceland': '🇮🇸',
      'Germany': '🇩🇪',
      'USA': '🇺🇸',
      'United States': '🇺🇸',
      'UK': '🇬🇧',
      'United Kingdom': '🇬🇧',
      'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
      'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
      'Ireland': '🇮🇪',
      'Belgium': '🇧🇪',
      'Netherlands': '🇳🇱',
      'France': '🇫🇷',
      'Spain': '🇪🇸',
      'Italy': '🇮🇹',
      'Portugal': '🇵🇹',
      'Denmark': '🇩🇰',
      'Norway': '🇳🇴',
      'Sweden': '🇸🇪',
      'Finland': '🇫🇮',
      'Poland': '🇵🇱',
      'Czech Republic': '🇨🇿',
      'Austria': '🇦🇹',
      'Switzerland': '🇨🇭',
      'Canada': '🇨🇦',
      'Mexico': '🇲🇽',
      'Brazil': '🇧🇷',
      'Argentina': '🇦🇷',
      'Australia': '🇦🇺',
      'New Zealand': '🇳🇿',
      'Japan': '🇯🇵',
      'China': '🇨🇳',
      'South Korea': '🇰🇷',
      'Estonia': '🇪🇪',
      'Latvia': '🇱🇻',
      'Lithuania': '🇱🇹',
      'Russia': '🇷🇺',
      'Ukraine': '🇺🇦',
      'Greece': '🇬🇷',
      'Croatia': '🇭🇷',
      'Slovenia': '🇸🇮',
      'Romania': '🇷🇴',
      'Hungary': '🇭🇺',
      'Slovakia': '🇸🇰',
      'Bulgaria': '🇧🇬',
      'Serbia': '🇷🇸',
      'Faroe Islands': '🇫🇴',
    }
    return flagMap[country] || '🌍'
  }

  const ratingTrend = analytics.ratingTrend ?? []
  const trendFit = ratingTrend.length > 1
    ? linearFit(ratingTrend.map(p => ({ x: p.beerIndex, y: p.average })))
    : null
  const trendData = ratingTrend.map(p => ({
    ...p,
    fitted: trendFit ? Number((trendFit.intercept + trendFit.slope * p.beerIndex).toFixed(2)) : null,
  }))

  const abvVsRating = analytics.abvVsRating ?? []
  const abvFit = abvVsRating.length > 2
    ? linearFit(abvVsRating.map(b => ({ x: b.abv, y: b.averageRating })))
    : null
  const abvMin = Math.min(...abvVsRating.map(b => b.abv))
  const abvMax = Math.max(...abvVsRating.map(b => b.abv))

  const participantsByAverage = analytics.participantStats
    .filter(p => p.ratingsCount > 0)
    .sort((a, b) => b.averageRating - a.averageRating)

  const beerControversy = analytics.beerControversy ?? []
  const styleRanking = (analytics.stylePerformanceRanking ?? []).filter(s => s.beersCount >= MIN_BEERS_PER_GROUP)
  const breweryRanking = (analytics.breweryPerformanceRanking ?? []).filter(b => b.beersCount >= MIN_BEERS_PER_GROUP)

  const winner = scores.beers[0]
  const awards = buildAwards({
    participantStats: analytics.participantStats,
    beerControversy,
    winner,
    tasteTwins: analytics.tasteTwins,
  })

  return (
    <div className="mt-8 space-y-8">
      {/* Headline awards */}
      {awards.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {awards.map(award => (
            <div key={award.title} className="bg-card p-4 rounded-lg border text-center">
              <AwardIcon kind={award.kind} className="h-8 w-8 mx-auto mb-1 text-primary" />
              <div className="text-xs text-muted-foreground uppercase tracking-wide">{award.title}</div>
              <div className="font-bold mt-1 truncate" title={award.main}>{award.main}</div>
              <div className="text-xs text-muted-foreground mt-1">{award.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Rating Trend Over Time Chart */}
      {VISIBLE_SECTIONS.ratingTrend && trendFit && (
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-xl font-bold mb-4 text-center">Þróun einkunna í gegnum smökkunina</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Hvernig meðaleinkunnir þróast eftir því sem líður á kvöldið
          </p>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart
              data={trendData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} stroke={chart.grid} />
              <XAxis
                dataKey="beerIndex"
                label={{ value: 'Bjór númer', position: 'insideBottom', offset: -5 }}
                tick={{ fontSize: 12 }}
                stroke={chart.axis}
              />
              <YAxis
                domain={ratingDomain(ratingTrend.map(p => p.average))}
                label={{ value: 'Meðaleinkunn', angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 12 }}
                stroke={chart.axis}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-card border rounded-lg p-3 shadow-lg max-w-xs">
                        <p className="font-bold text-sm">Bjór #{data.beerIndex}</p>
                        <p className="text-xs text-muted-foreground mb-2">{data.name}</p>
                        <p className="text-primary font-semibold">Einkunn: {data.average.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{data.ratingsCount} þátttakendur</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Line
                type="monotone"
                dataKey="average"
                stroke={chart.primary}
                strokeWidth={3}
                dot={{ fill: chart.primary, r: 5 }}
                activeDot={{ r: 7 }}
              >
                <LabelList dataKey="average" position="top" fontSize={11} formatter={(v) => Number(v).toFixed(1)} />
              </Line>
              <Line
                type="linear"
                dataKey="fitted"
                stroke={chart.secondary}
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
                activeDot={false}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            {(() => {
              // Regression slope uses every beer, not just first vs last
              const changePerBeer = trendFit.slope
              const totalChange = changePerBeer * (ratingTrend.length - 1)

              if (Math.abs(changePerBeer) < 0.05) {
                return (
                  <p>
                    <MoveRight className="inline h-4 w-4 mr-1 -mt-0.5" />Stöðug þróun: Einkunnir haldast nokkurn veginn stöðugar í gegnum kvöldið
                  </p>
                )
              } else if (changePerBeer > 0) {
                return (
                  <p className="text-green-600 font-medium">
                    <TrendingUp className="inline h-4 w-4 mr-1 -mt-0.5" />Hækkandi þróun: Einkunnir hækka að meðaltali um {changePerBeer.toFixed(2)} stig á hvern bjór (+{totalChange.toFixed(1)} yfir kvöldið)
                  </p>
                )
              } else {
                return (
                  <p className="text-orange-600 font-medium">
                    <TrendingDown className="inline h-4 w-4 mr-1 -mt-0.5" />Lækkandi þróun: Einkunnir lækka að meðaltali um {Math.abs(changePerBeer).toFixed(2)} stig á hvern bjór ({totalChange.toFixed(1)} yfir kvöldið)
                  </p>
                )
              }
            })()}
            <p className="text-xs mt-1">Brotalínan sýnir leitnilínu yfir alla bjóra</p>
          </div>
        </div>
      )}

      {/* Beer Style Distribution Pie Chart */}
      {VISIBLE_SECTIONS.styleDistribution && analytics.styleDistribution && analytics.styleDistribution.length > 0 && (
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-xl font-bold mb-4 text-center">Dreifing bjórtegunda</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Hversu margir bjórar af hverri tegund voru smakkaðir
          </p>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={analytics.styleDistribution.map(({ style: _style, ...item }) => ({
                  ...item,
                  beerStyle: _style
                }))}
                dataKey="count"
                nameKey="beerStyle"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label={({ beerStyle, count, percent }: any) =>
                  `${beerStyle}: ${count} (${((percent as number) * 100).toFixed(0)}%)`
                }
                labelLine={true}
              >
                {analytics.styleDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-card border rounded-lg p-3 shadow-lg">
                        <p className="font-bold text-sm mb-2">{data.style}</p>
                        <p className="text-sm">Bjórar: <span className="font-semibold">{data.count}</span></p>
                        <p className="text-sm">Meðaleinkunn: <span className="text-primary font-semibold">{data.averageRating.toFixed(2)}</span></p>
                        <p className="text-xs text-muted-foreground mt-1">{data.totalRatings} einkunnir samtals</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Style ratings breakdown */}
          <div className="mt-6 space-y-2">
            <p className="text-sm font-semibold text-muted-foreground text-center mb-3">Meðaleinkunnir eftir stíl</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {analytics.styleDistribution.slice(0, 6).map((style, index) => (
                <div key={style.style} className="flex items-center justify-between p-2 rounded bg-muted/30">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm">{style.style}</span>
                  </div>
                  <span className="text-sm font-semibold text-primary">{style.averageRating.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Rating Distribution Chart */}
      {VISIBLE_SECTIONS.ratingDistribution && analytics.ratingDistribution && Object.keys(analytics.ratingDistribution).length > 0 && (
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-xl font-bold mb-4 text-center">Dreifing einkunna</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Hversu oft hver einkunn var gefin
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={Object.entries(analytics.ratingDistribution).map(([rating, count]) => ({
              rating: parseFloat(rating),
              count
            })).filter(d => d.count > 0).sort((a, b) => a.rating - b.rating)}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} stroke={chart.grid} />
              <XAxis
                dataKey="rating"
                label={{ value: 'Einkunn', position: 'insideBottom', offset: -5 }}
                tick={{ fontSize: 12 }}
                stroke={chart.axis}
              />
              <YAxis
                label={{ value: 'Fjöldi', angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 12 }}
                stroke={chart.axis}
                allowDecimals={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-card border rounded-lg p-3 shadow-lg">
                        <p className="font-semibold">Einkunn: {payload[0].payload.rating.toFixed(1)}</p>
                        <p className="text-primary">{payload[0].value} skipti</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar dataKey="count" fill={chart.primary} radius={[chart.barCornerRadius, chart.barCornerRadius, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Beer Comparison Chart */}
      {VISIBLE_SECTIONS.beerComparison && scores.beers.length > 0 && (
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-xl font-bold mb-4 text-center">Samanburður bjóra</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Meðaleinkunn allra bjóra
          </p>
          <ResponsiveContainer width="100%" height={Math.max(300, scores.beers.length * 40)}>
            <BarChart
              data={scores.beers.slice().reverse()}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                type="number"
                domain={[0, 10]}
                label={{ value: 'Meðaleinkunn', position: 'insideBottom', offset: -5 }}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={150}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-card border rounded-lg p-3 shadow-lg max-w-xs">
                        <p className="font-bold text-sm">{data.name}</p>
                        <p className="text-xs text-muted-foreground mb-2">{data.brewery}</p>
                        <p className="text-primary font-semibold">Einkunn: {data.average.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{data.count} einkunnir</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar
                dataKey="average"
                fill="#3b82f6"
                shape={(props: any) => {
                  const { x, y, width, height, index } = props
                  const beer = scores.beers[scores.beers.length - 1 - index]
                  const fill = beer?.rank === 1 ? '#FFD700' : beer?.rank === 2 ? '#C0C0C0' : beer?.rank === 3 ? '#CD7F32' : '#3b82f6'
                  return (
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      fill={fill}
                    />
                  )
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Beer Timing Chart */}
      {VISIBLE_SECTIONS.beerTimings && analytics.beerTimings && analytics.beerTimings.length > 0 && (
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-xl font-bold mb-4 text-center">Tími á hvern bjór</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Hversu lengi var eytt í smökkun hvers bjórs (mínútur)
          </p>
          <ResponsiveContainer width="100%" height={Math.max(300, analytics.beerTimings.length * 40)}>
            <BarChart
              data={analytics.beerTimings}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                type="number"
                label={{ value: 'Mínútur', position: 'insideBottom', offset: -5 }}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={150}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-card border rounded-lg p-3 shadow-lg">
                        <p className="font-semibold text-sm">{payload[0].payload.name}</p>
                        <p className="text-primary font-bold">{payload[0].value} mínútur</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar dataKey="durationMinutes" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
          {analytics.overview.averageTimePerBeer && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              Meðaltími per bjór: {analytics.overview.averageTimePerBeer.toFixed(1)} mínútur
            </p>
          )}
        </div>
      )}

      {/* Participant Engagement Chart */}
      {VISIBLE_SECTIONS.participantAverages && participantsByAverage.length > 0 && (
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-xl font-bold mb-4 text-center">Meðaleinkunnir þátttakenda</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Frá þeim örlátasta til þess strangasta. Brotalínan er meðaltal hópsins ({analytics.overview.overallAverage.toFixed(2)})
          </p>
          <ResponsiveContainer width="100%" height={Math.max(300, participantsByAverage.length * 50)}>
            <BarChart
              data={participantsByAverage}
              layout="vertical"
              margin={{ top: 5, right: 40, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                type="number"
                domain={[0, 10]}
                label={{ value: 'Meðaleinkunn', position: 'insideBottom', offset: -5 }}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="userName"
                width={100}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-card border rounded-lg p-3 shadow-lg">
                        <p className="font-bold text-sm mb-2">{data.userName}</p>
                        <p className="text-sm">Meðaleinkunn: <span className="text-primary font-semibold">{data.averageRating.toFixed(2)}</span></p>
                        <p className="text-sm">Einkunnir: <span className="font-semibold">{data.ratingsCount}/{data.possibleRatings}</span></p>
                        <p className="text-xs text-muted-foreground mt-1">{data.engagementRate}% þátttaka</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <ReferenceLine x={analytics.overview.overallAverage} stroke={chart.axis} strokeDasharray="4 4" />
              <Bar dataKey="averageRating">
                {participantsByAverage.map(p => (
                  <Cell
                    key={p.participantId}
                    fill={p.averageRating >= analytics.overview.overallAverage ? chart.success : chart.warning}
                  />
                ))}
                <LabelList dataKey="averageRating" position="right" fontSize={12} formatter={(v) => Number(v).toFixed(2)} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Beer Controversy Index Chart */}
      {VISIBLE_SECTIONS.beerControversy && beerControversy.length > 0 && (
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-xl font-bold mb-4 text-center">Umdeildir bjórar</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Hvaða bjórar vöktu mest ágreining (hár staðalfrávik = meiri ágreiningur)
          </p>
          <ResponsiveContainer width="100%" height={Math.max(300, beerControversy.length * 40)}>
            <BarChart
              data={beerControversy}
              layout="vertical"
              margin={{ top: 5, right: 40, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                type="number"
                label={{ value: 'Staðalfrávik', position: 'insideBottom', offset: -5 }}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={150}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-card border rounded-lg p-3 shadow-lg max-w-xs">
                        <p className="font-bold text-sm">{data.name}</p>
                        <p className="text-xs text-muted-foreground mb-2">{data.brewery}</p>
                        <p className="text-sm">Meðaleinkunn: <span className="text-primary font-semibold">{data.average.toFixed(2)}</span></p>
                        <p className="text-sm">Staðalfrávik: <span className="font-semibold">{data.standardDeviation.toFixed(2)}</span></p>
                        {data.highestRater && data.lowestRater && (
                          <p className="text-sm">
                            <ThumbsUp className="inline h-3.5 w-3.5 -mt-0.5" /> {data.highestRater.userName} {data.highestRater.score} · <ThumbsDown className="inline h-3.5 w-3.5 -mt-0.5" /> {data.lowestRater.userName} {data.lowestRater.score}
                          </p>
                        )}
                        <p className="text-xs mt-1">
                          <span className={
                            data.controversy === 'High' ? 'text-red-600 font-semibold' :
                            data.controversy === 'Medium' ? 'text-orange-600 font-semibold' :
                            'text-green-600 font-semibold'
                          }>
                            {data.controversy === 'High' ? <IconLabel icon={Flame}>Mjög umdeildur</IconLabel> :
                             data.controversy === 'Medium' ? <IconLabel icon={TriangleAlert}>Nokkuð umdeildur</IconLabel> :
                             <IconLabel icon={CircleCheck}>Almennt sammála</IconLabel>}
                          </span>
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar
                dataKey="standardDeviation"
                shape={(props: any) => {
                  const { x, y, width, height, payload } = props
                  const fill = payload.controversy === 'High' ? '#ef4444' :
                               payload.controversy === 'Medium' ? '#f59e0b' : '#10b981'
                  return (
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      fill={fill}
                    />
                  )
                }}
              >
                <LabelList dataKey="standardDeviation" position="right" fontSize={12} formatter={(v) => Number(v).toFixed(2)} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* Who disagreed on the most divisive beers */}
          <div className="mt-6 space-y-2">
            {beerControversy
              .filter(b => b.controversy !== 'Low' && b.highestRater && b.lowestRater)
              .slice(0, 3)
              .map(b => (
                <div key={b.beerId} className="flex flex-wrap items-center justify-between gap-2 p-3 bg-muted/50 rounded">
                  <div className="font-medium text-sm">{b.name}</div>
                  <div className="text-sm">
                    <span className="text-green-600 font-semibold"><ThumbsUp className="inline h-4 w-4 -mt-0.5" /> {b.highestRater!.userName} {b.highestRater!.score}</span>
                    <span className="text-muted-foreground mx-2">vs</span>
                    <span className="text-red-600 font-semibold"><ThumbsDown className="inline h-4 w-4 -mt-0.5" /> {b.lowestRater!.userName} {b.lowestRater!.score}</span>
                  </div>
                </div>
              ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Hærra staðalfrávik þýðir meiri ágreiningur um bjórinn
          </p>
        </div>
      )}

      {/* ABV vs Rating Scatter Plot */}
      {VISIBLE_SECTIONS.abvVsRating && abvVsRating.length > 0 && (
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-xl font-bold mb-4 text-center">Áfengisstyrkur vs. Einkunn</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Eru sterkari bjórar metnir hærra eða lægra?
          </p>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                type="number"
                dataKey="abv"
                name="ABV"
                label={{ value: 'Áfengisstyrkur (%)', position: 'insideBottom', offset: -10 }}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                type="number"
                dataKey="averageRating"
                name="Einkunn"
                domain={ratingDomain(abvVsRating.map(b => b.averageRating))}
                label={{ value: 'Meðaleinkunn', angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-card border rounded-lg p-3 shadow-lg max-w-xs">
                        <p className="font-bold text-sm">{data.name}</p>
                        <p className="text-sm mt-1">ABV: <span className="font-semibold">{data.abv}%</span></p>
                        <p className="text-sm">Einkunn: <span className="text-primary font-semibold">{data.averageRating.toFixed(2)}</span></p>
                        <p className="text-xs text-muted-foreground">{data.ratingsCount} einkunnir</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              {abvFit && abvMax > abvMin && (
                <ReferenceLine
                  segment={[
                    { x: abvMin, y: abvFit.intercept + abvFit.slope * abvMin },
                    { x: abvMax, y: abvFit.intercept + abvFit.slope * abvMax },
                  ]}
                  stroke={chart.secondary}
                  strokeDasharray="6 4"
                  strokeWidth={2}
                  ifOverflow="extendDomain"
                />
              )}
              <Scatter data={abvVsRating} fill={chart.primary} />
            </ScatterChart>
          </ResponsiveContainer>
          {abvFit && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              {Math.abs(abvFit.r) < 0.3
                ? <IconLabel icon={MoveRight}>Lítið samband milli áfengisstyrks og einkunnar</IconLabel>
                : abvFit.r > 0
                ? <IconLabel icon={TrendingUp}>Sterkari bjórar fengu hærri einkunnir (+{abvFit.slope.toFixed(2)} stig á hvert %)</IconLabel>
                : <IconLabel icon={TrendingDown}>Sterkari bjórar fengu lægri einkunnir ({abvFit.slope.toFixed(2)} stig á hvert %)</IconLabel>}
              <span className="block text-xs opacity-70">Fylgni r = {abvFit.r.toFixed(2)}</span>
            </p>
          )}
        </div>
      )}

      {/* Rating Velocity Chart */}
      {VISIBLE_SECTIONS.ratingVelocity && analytics.ratingVelocity && analytics.ratingVelocity.length > 0 && (
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-xl font-bold mb-4 text-center">Hraði einkunnagjaafar</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Hversu hratt var bjórum gefin einkunn (hraðar einkunnir = greiðara val)
          </p>
          <ResponsiveContainer width="100%" height={Math.max(300, analytics.ratingVelocity.length * 40)}>
            <BarChart
              data={analytics.ratingVelocity}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                type="number"
                label={{ value: 'Mínútur til einkunnagjaafar', position: 'insideBottom', offset: -5 }}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={150}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-card border rounded-lg p-3 shadow-lg">
                        <p className="font-bold text-sm">{data.name}</p>
                        <p className="text-sm mt-1">Tími: <span className="font-semibold">{data.durationMinutes} mín</span></p>
                        <p className="text-sm">Hraði: <span className="text-primary font-semibold">{data.ratingsPerMinute} einkunnir/mín</span></p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar dataKey="durationMinutes" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Styttri tími getur bent til að bjórinn hafi verið auðveldari í vali
          </p>
        </div>
      )}

      {/* Participant Deviation Scatter Plot */}
      {VISIBLE_SECTIONS.participantDeviation && analytics.participantDeviation && analytics.participantDeviation.length > 0 && (
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-xl font-bold mb-4 text-center">Einkunnir vs. Hópmeðaltal</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Hvernig einkunn hver þátttakanda stendur í samanburði við hópinn
          </p>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 20, right: 30, bottom: 60, left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                type="category"
                dataKey="userName"
                name="Þátttakandi"
                angle={-45}
                textAnchor="end"
                height={100}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                type="number"
                dataKey="deviation"
                name="Frávik"
                label={{ value: 'Frávik frá hópmeðaltali', angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => value.toFixed(2)}
                domain={['dataMin - 0.5', 'dataMax + 0.5']}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-card border rounded-lg p-3 shadow-lg">
                        <p className="font-bold text-sm mb-2">{data.userName}</p>
                        <p className="text-sm">Meðaleinkunn: <span className="font-semibold">{data.userAverage.toFixed(2)}</span></p>
                        <p className="text-sm">Hópmeðaltal: <span className="font-semibold">{data.groupAverage.toFixed(2)}</span></p>
                        <p className="text-sm mt-1">Frávik: <span className={data.deviation > 0 ? 'text-green-600 font-semibold' : data.deviation < 0 ? 'text-red-600 font-semibold' : 'font-semibold'}>
                          {data.deviation > 0 ? '+' : ''}{Number(data.deviation.toFixed(2))}
                        </span></p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {data.deviation > 0.5 ? <IconLabel icon={Smile}>Rausnarlegri en hópurinn</IconLabel> :
                           data.deviation < -0.5 ? <IconLabel icon={Brain}>Gagnrýnni en hópurinn</IconLabel> :
                           <IconLabel icon={Equal}>Nálægt hópnum</IconLabel>}
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Scatter data={analytics.participantDeviation} fill="#3b82f6">
                {analytics.participantDeviation.map((entry, index) => {
                  const fill = entry.deviation > 0.5 ? '#10b981' : entry.deviation < -0.5 ? '#ef4444' : '#3b82f6'
                  return <Cell key={`cell-${index}`} fill={fill} />
                })}
              </Scatter>
              {/* Reference line at y=0 */}
              <line x1={0} y1="50%" x2="100%" y2="50%" stroke="#94a3b8" strokeDasharray="5 5" />
            </ScatterChart>
          </ResponsiveContainer>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Jákvætt frávik = rausnarlegri, Neikvætt frávik = gagnrýnni
          </p>
        </div>
      )}

      {/* Rating Consensus Bar Chart */}
      {VISIBLE_SECTIONS.ratingConsensus && analytics.ratingConsensus && analytics.ratingConsensus.length > 0 && (
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-xl font-bold mb-4 text-center">Samstaða um bjóra</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Hversu sammála voru þátttakendur um hvern bjór? (hærra = meiri samstaða)
          </p>
          <ResponsiveContainer width="100%" height={Math.max(300, analytics.ratingConsensus.length * 40)}>
            <BarChart
              data={[...analytics.ratingConsensus].sort((a, b) => b.consensus - a.consensus)}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                type="number"
                domain={[0, 10]}
                label={{ value: 'Samstaða', position: 'insideBottom', offset: -5 }}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={150}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-card border rounded-lg p-3 shadow-lg max-w-xs">
                        <p className="font-bold text-sm">{data.fullName}</p>
                        <p className="text-sm mt-1">Samstaða: <span className="font-semibold">{data.consensus.toFixed(2)}/10</span></p>
                        <p className="text-sm">Meðaleinkunn: <span className="text-primary font-semibold">{data.averageRating.toFixed(2)}</span></p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Staðalfrávik: {data.standardDeviation.toFixed(2)}
                        </p>
                        <p className="text-xs mt-1">
                          <span className={
                            data.consensus > 8 ? 'text-green-600 font-semibold' :
                            data.consensus > 6 ? 'text-orange-600 font-semibold' :
                            'text-red-600 font-semibold'
                          }>
                            {data.consensus > 8 ? <IconLabel icon={CircleCheck}>Mjög sammála</IconLabel> :
                             data.consensus > 6 ? <IconLabel icon={ThumbsUp}>Nokkuð sammála</IconLabel> :
                             <IconLabel icon={TriangleAlert}>Misjafnt álit</IconLabel>}
                          </span>
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar
                dataKey="consensus"
                shape={(props: any) => {
                  const { x, y, width, height, payload } = props
                  const fill = payload.consensus > 8 ? '#10b981' :
                               payload.consensus > 6 ? '#f59e0b' : '#ef4444'
                  return (
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      fill={fill}
                    />
                  )
                }}
              />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Hærri gildi þýða meiri samstöðu (minni ágreiningur)
          </p>
        </div>
      )}

      {/* NEW ANALYTICS - Style Performance Ranking */}
      {VISIBLE_SECTIONS.stylePerformanceRanking && styleRanking.length > 1 && (
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-xl font-bold mb-4 text-center">Besti og versti bjórstíllinn</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Hvaða bjórstíllar fengu hæstu og lægstu meðaleinkunnir? (stílar með {MIN_BEERS_PER_GROUP}+ bjóra)
          </p>
          <ResponsiveContainer width="100%" height={Math.max(300, styleRanking.length * 40)}>
            <BarChart
              data={styleRanking.map(({ style: _style, ...item }) => ({
                ...item,
                beerStyle: _style
              }))}
              layout="vertical"
              margin={{ top: 5, right: 40, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                type="number"
                domain={[0, 10]}
                label={{ value: 'Meðaleinkunn', position: 'insideBottom', offset: -5 }}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="beerStyle"
                width={150}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-card border rounded-lg p-3 shadow-lg">
                        <p className="font-bold text-sm mb-2">{data.beerStyle}</p>
                        <p className="text-sm">Meðaleinkunn: <span className="text-primary font-semibold">{data.averageRating.toFixed(2)}</span></p>
                        <p className="text-sm">Bjórar: <span className="font-semibold">{data.beersCount}</span></p>
                        <p className="text-sm">Einkunnir: <span className="font-semibold">{data.ratingsCount}</span></p>
                        <p className="text-xs text-muted-foreground mt-1">Span: {data.minRating.toFixed(1)} - {data.maxRating.toFixed(1)}</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar dataKey="averageRating" fill={chart.primary}>
                <LabelList dataKey="averageRating" position="right" fontSize={12} formatter={(v) => Number(v).toFixed(2)} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Style Rating Spread - Agreement levels */}
      {VISIBLE_SECTIONS.styleRatingSpread && analytics.styleRatingSpread && analytics.styleRatingSpread.length > 0 && (
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-xl font-bold mb-4 text-center">Samstaða um bjórstíla</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Hvaða bjórstíllar vöktu mest og minnst ágreining?
          </p>
          <ResponsiveContainer width="100%" height={Math.max(300, analytics.styleRatingSpread.length * 40)}>
            <BarChart
              data={analytics.styleRatingSpread.map(({ style: _style, ...item }) => ({
                ...item,
                beerStyle: _style
              }))}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                type="number"
                label={{ value: 'Staðalfrávik', position: 'insideBottom', offset: -5 }}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="beerStyle"
                width={150}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-card border rounded-lg p-3 shadow-lg">
                        <p className="font-bold text-sm mb-2">{data.style}</p>
                        <p className="text-sm">Staðalfrávik: <span className="font-semibold">{data.standardDeviation.toFixed(2)}</span></p>
                        <p className="text-sm">Samstaða: <span className={
                          data.agreement === 'High' ? 'text-green-600 font-semibold' :
                          data.agreement === 'Medium' ? 'text-orange-600 font-semibold' :
                          'text-red-600 font-semibold'
                        }>{data.agreement === 'High' ? <IconLabel icon={CircleCheck}>Há</IconLabel> : data.agreement === 'Medium' ? <IconLabel icon={TriangleAlert}>Miðlungs</IconLabel> : <IconLabel icon={Flame}>Lág</IconLabel>}</span></p>
                        <p className="text-xs text-muted-foreground mt-1">{data.beersCount} bjórar, {data.ratingsCount} einkunnir</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar
                dataKey="standardDeviation"
                shape={(props: any) => {
                  const { x, y, width, height, payload } = props
                  const fill = payload.agreement === 'High' ? '#10b981' :
                               payload.agreement === 'Medium' ? '#f59e0b' : '#ef4444'
                  return (
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      fill={fill}
                    />
                  )
                }}
              />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Lægra staðalfrávik = meiri samstaða um stílinn
          </p>
        </div>
      )}

      {/* Participant Style Preferences */}
      {VISIBLE_SECTIONS.participantStylePreferences && analytics.participantStylePreferences && analytics.participantStylePreferences.length > 0 && (
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-xl font-bold mb-4 text-center">Uppáhalds bjórstíllar þátttakenda</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Hvaða bjórstíllar fengu hæstar og lægstar einkunnir frá hverjum þátttakanda?
          </p>
          <div className="space-y-4">
            {analytics.participantStylePreferences.map((participant) => (
              <div key={participant.participantId} className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3">{participant.userName}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {participant.favoriteStyle && (
                    <div className="bg-green-50 dark:bg-green-950 p-3 rounded">
                      <p className="text-xs text-muted-foreground mb-1">Uppáhald</p>
                      <p className="font-semibold text-green-700 dark:text-green-400">{participant.favoriteStyle.style}</p>
                      <p className="text-sm mt-1">Einkunn: <span className="font-semibold">{participant.favoriteStyle.average.toFixed(2)}</span> ({participant.favoriteStyle.count} bjórar)</p>
                    </div>
                  )}
                  {participant.leastFavoriteStyle && (
                    <div className="bg-red-50 dark:bg-red-950 p-3 rounded">
                      <p className="text-xs text-muted-foreground mb-1">Minnst uppáhald</p>
                      <p className="font-semibold text-red-700 dark:text-red-400">{participant.leastFavoriteStyle.style}</p>
                      <p className="text-sm mt-1">Einkunn: <span className="font-semibold">{participant.leastFavoriteStyle.average.toFixed(2)}</span> ({participant.leastFavoriteStyle.count} bjórar)</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unanimous Ratings */}
      {VISIBLE_SECTIONS.unanimousRatings && analytics.unanimousRatings && analytics.unanimousRatings.length > 0 && (
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-xl font-bold mb-4 text-center">Bjórar með minnstum ágreiningi</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Bjórar þar sem þátttakendur voru mest sammála um einkunnina
          </p>
          <ResponsiveContainer width="100%" height={Math.max(300, analytics.unanimousRatings.length * 40)}>
            <BarChart
              data={analytics.unanimousRatings}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                type="number"
                label={{ value: 'Staðalfrávik', position: 'insideBottom', offset: -5 }}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={150}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-card border rounded-lg p-3 shadow-lg max-w-xs">
                        <p className="font-bold text-sm">{data.name}</p>
                        <p className="text-xs text-muted-foreground mb-2">{data.brewery}</p>
                        <p className="text-sm">Meðaleinkunn: <span className="text-primary font-semibold">{data.average.toFixed(2)}</span></p>
                        <p className="text-sm">Span: <span className="font-semibold">{data.minRating.toFixed(1)} - {data.maxRating.toFixed(1)}</span> (bil: {data.range.toFixed(1)})</p>
                        <p className="text-sm">Staðalfrávik: <span className="font-semibold">{data.standardDeviation.toFixed(2)}</span></p>
                        <p className="text-xs mt-1">
                          <span className={
                            data.unanimity === 'Very High' ? 'text-green-600 font-semibold' :
                            data.unanimity === 'High' ? 'text-green-500 font-semibold' :
                            'text-orange-600 font-semibold'
                          }>
                            {data.unanimity === 'Very High' ? <IconLabel icon={CircleCheck}>Mjög há samstaða</IconLabel> :
                             data.unanimity === 'High' ? <IconLabel icon={CircleCheck}>Há samstaða</IconLabel> :
                             <IconLabel icon={ThumbsUp}>Góð samstaða</IconLabel>}
                          </span>
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar
                dataKey="standardDeviation"
                shape={(props: any) => {
                  const { x, y, width, height, payload } = props
                  const fill = payload.unanimity === 'Very High' ? '#10b981' :
                               payload.unanimity === 'High' ? '#14b8a6' : '#f59e0b'
                  return (
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      fill={fill}
                    />
                  )
                }}
              />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Lægra staðalfrávik þýðir meiri samstöðu um bjórinn
          </p>
        </div>
      )}

      {/* Participant Rating Spread */}
      {VISIBLE_SECTIONS.participantRatingSpread && analytics.participantRatingSpread && analytics.participantRatingSpread.length > 0 && (
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-xl font-bold mb-4 text-center">Einkunna-svið þátttakenda</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Hver hefur breiðasta og þrengsta einkunna-sviðið?
          </p>
          <ResponsiveContainer width="100%" height={Math.max(300, analytics.participantRatingSpread.length * 40)}>
            <BarChart
              data={analytics.participantRatingSpread}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                type="number"
                label={{ value: 'Einkunna-svið (max - min)', position: 'insideBottom', offset: -5 }}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="userName"
                width={100}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-card border rounded-lg p-3 shadow-lg">
                        <p className="font-bold text-sm mb-2">{data.userName}</p>
                        <p className="text-sm">Meðaleinkunn: <span className="font-semibold">{data.average.toFixed(2)}</span></p>
                        <p className="text-sm">Lægsta: <span className="font-semibold">{data.minRating.toFixed(1)}</span></p>
                        <p className="text-sm">Hæsta: <span className="font-semibold">{data.maxRating.toFixed(1)}</span></p>
                        <p className="text-sm">Svið: <span className="text-primary font-semibold">{data.range.toFixed(1)}</span></p>
                        <p className="text-xs mt-1">
                          <span className={
                            data.ratingStyle === 'Consistent' ? 'text-green-600 font-semibold' :
                            data.ratingStyle === 'Moderate' ? 'text-orange-600 font-semibold' :
                            'text-red-600 font-semibold'
                          }>
                            {data.ratingStyle === 'Consistent' ? <IconLabel icon={CircleCheck}>Stöðugur</IconLabel> :
                             data.ratingStyle === 'Moderate' ? <IconLabel icon={TriangleAlert}>Miðlungs</IconLabel> :
                             <IconLabel icon={Flame}>Breitt svið</IconLabel>}
                          </span>
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar
                dataKey="range"
                shape={(props: any) => {
                  const { x, y, width, height, payload } = props
                  const fill = payload.ratingStyle === 'Consistent' ? '#10b981' :
                               payload.ratingStyle === 'Moderate' ? '#f59e0b' : '#ef4444'
                  return (
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      fill={fill}
                    />
                  )
                }}
              />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Breitt svið getur þýtt að þátttakandi sé nákvæmari í vali, eða smakki fleiri bjórtegundir
          </p>
        </div>
      )}

      {/* BREWERY ANALYTICS - Brewery Performance Ranking */}
      {VISIBLE_SECTIONS.breweryPerformanceRanking && breweryRanking.length > 1 && (
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-xl font-bold mb-4 text-center">Bestu og verstu brugghús</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Hvaða brugghús framleiða bjóra sem fengu hæstu og lægstu meðaleinkunnir? (brugghús með {MIN_BEERS_PER_GROUP}+ bjóra)
          </p>
          <ResponsiveContainer width="100%" height={Math.max(300, breweryRanking.length * 40)}>
            <BarChart
              data={breweryRanking}
              layout="vertical"
              margin={{ top: 5, right: 40, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                type="number"
                domain={[0, 10]}
                label={{ value: 'Meðaleinkunn', position: 'insideBottom', offset: -5 }}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="brewery"
                width={150}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-card border rounded-lg p-3 shadow-lg">
                        <p className="font-bold text-sm mb-2">
                          {data.country && getCountryFlag(data.country)} {data.brewery}
                        </p>
                        <p className="text-sm">Meðaleinkunn: <span className="text-primary font-semibold">{data.averageRating.toFixed(2)}</span></p>
                        <p className="text-sm">Bjórar: <span className="font-semibold">{data.beersCount}</span></p>
                        <p className="text-sm">Einkunnir: <span className="font-semibold">{data.ratingsCount}</span></p>
                        <p className="text-xs text-muted-foreground mt-1">Span: {data.minRating.toFixed(1)} - {data.maxRating.toFixed(1)}</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar
                dataKey="averageRating"
                shape={(props: any) => {
                  const { x, y, width, height, payload } = props
                  // Color Icelandic breweries blue, others green
                  const fill = payload.country === 'Ísland' ? '#3b82f6' : '#10b981'
                  return (
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      fill={fill}
                    />
                  )
                }}
              >
                <LabelList dataKey="averageRating" position="right" fontSize={12} formatter={(v) => Number(v).toFixed(2)} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 flex items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Íslensk brugghús</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Erlend brugghús</span>
            </div>
          </div>
        </div>
      )}

      {/* Brewery Distribution Pie Chart */}
      {VISIBLE_SECTIONS.breweryDistribution && analytics.breweryDistribution && analytics.breweryDistribution.length > 0 && (
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-xl font-bold mb-4 text-center">Dreifing brugghúsa</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Hversu margir bjórar frá hverju brugghúsi voru smakkaðir
          </p>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={analytics.breweryDistribution.map(({ brewery: _brewery, ...item }) => ({
                  ...item,
                  breweryName: _brewery
                }))}
                dataKey="count"
                nameKey="breweryName"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label={({ breweryName, count, percent }: any) =>
                  count >= 2 ? `${breweryName}: ${count} (${((percent as number) * 100).toFixed(0)}%)` : ''
                }
                labelLine={true}
              >
                {analytics.breweryDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-card border rounded-lg p-3 shadow-lg">
                        <p className="font-bold text-sm mb-2">
                          {data.country && getCountryFlag(data.country)} {data.breweryName}
                        </p>
                        <p className="text-sm">Bjórar: <span className="font-semibold">{data.count}</span></p>
                        <p className="text-sm">Meðaleinkunn: <span className="text-primary font-semibold">{data.averageRating.toFixed(2)}</span></p>
                        <p className="text-xs text-muted-foreground mt-1">{data.totalRatings} einkunnir samtals</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Brewery ratings breakdown */}
          <div className="mt-6 space-y-2">
            <p className="text-sm font-semibold text-muted-foreground text-center mb-3">Meðaleinkunnir eftir brugghúsi</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {analytics.breweryDistribution.slice(0, 6).map((brewery, index) => (
                <div key={brewery.brewery} className="flex items-center justify-between p-2 rounded bg-muted/30">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm">{brewery.brewery}</span>
                  </div>
                  <span className="text-sm font-semibold text-primary">{brewery.averageRating.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Brewery Consistency Chart */}
      {VISIBLE_SECTIONS.breweryConsistency && analytics.breweryConsistency && analytics.breweryConsistency.length > 0 && (
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-xl font-bold mb-4 text-center">Samræmi í gæðum brugghúsa</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Hvaða brugghús eru stöðugust í gæðum? (Aðeins brugghús með 2+ bjóra)
          </p>
          <ResponsiveContainer width="100%" height={Math.max(300, analytics.breweryConsistency.length * 40)}>
            <BarChart
              data={analytics.breweryConsistency}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                type="number"
                label={{ value: 'Staðalfrávik', position: 'insideBottom', offset: -5 }}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="brewery"
                width={150}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-card border rounded-lg p-3 shadow-lg">
                        <p className="font-bold text-sm mb-2">
                          {data.country && getCountryFlag(data.country)} {data.brewery}
                        </p>
                        <p className="text-sm">Staðalfrávik: <span className="font-semibold">{data.standardDeviation.toFixed(2)}</span></p>
                        <p className="text-sm">Samræmi: <span className={
                          data.consistency === 'Very Consistent' || data.consistency === 'Consistent' ? 'text-green-600 font-semibold' :
                          data.consistency === 'Moderate' ? 'text-orange-600 font-semibold' :
                          'text-red-600 font-semibold'
                        }>{
                          data.consistency === 'Very Consistent' ? <IconLabel icon={CircleCheck}>Mjög stöðugt</IconLabel> :
                          data.consistency === 'Consistent' ? <IconLabel icon={CircleCheck}>Stöðugt</IconLabel> :
                          data.consistency === 'Moderate' ? <IconLabel icon={TriangleAlert}>Miðlungs</IconLabel> :
                          <IconLabel icon={Flame}>Breytilegt</IconLabel>
                        }</span></p>
                        <p className="text-xs text-muted-foreground mt-1">{data.beersCount} bjórar, {data.averageRating.toFixed(2)} meðaleinkunn</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar
                dataKey="standardDeviation"
                shape={(props: any) => {
                  const { x, y, width, height, payload } = props
                  const fill = payload.consistency === 'Very Consistent' || payload.consistency === 'Consistent' ? '#10b981' :
                               payload.consistency === 'Moderate' ? '#f59e0b' : '#ef4444'
                  return (
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      fill={fill}
                    />
                  )
                }}
              />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Lægra staðalfrávik = stöðugra gæði milli bjóra
          </p>
        </div>
      )}

      {/* Icelandic Breweries Leaderboard */}
      {VISIBLE_SECTIONS.icelandicBreweries && analytics.icelandicBreweries && analytics.icelandicBreweries.length > 0 && (
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-xl font-bold mb-4 text-center">🇮🇸 Íslensk brugghús</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Raðað eftir meðaleinkunn
          </p>
          <div className="space-y-3">
            {analytics.icelandicBreweries.map((brewery) => (
              <div
                key={brewery.brewery}
                className={`p-4 rounded-lg border-2 ${
                  brewery.rank === 1 ? 'bg-yellow-50 dark:bg-yellow-950 border-yellow-400' :
                  brewery.rank === 2 ? 'bg-gray-100 dark:bg-gray-900 border-gray-400' :
                  brewery.rank === 3 ? 'bg-orange-50 dark:bg-orange-950 border-orange-400' :
                  'bg-muted/30 border-muted'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {brewery.rank <= 3 ? <RankMedal rank={brewery.rank} className="h-7 w-7" /> : `#${brewery.rank}`}
                    </span>
                    <h4 className="font-bold text-lg">{brewery.brewery}</h4>
                  </div>
                  <span className="text-primary font-bold text-2xl">{brewery.averageRating.toFixed(2)}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Bjórar:</span>
                    <span className="ml-2 font-semibold">{brewery.beersCount}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Einkunnir:</span>
                    <span className="ml-2 font-semibold">{brewery.ratingsCount}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Lægsta:</span>
                    <span className="ml-2 font-semibold">{brewery.minRating.toFixed(1)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Hæsta:</span>
                    <span className="ml-2 font-semibold">{brewery.maxRating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Brewery Portfolio Analysis */}
      {VISIBLE_SECTIONS.breweryPortfolio && analytics.breweryPortfolio && analytics.breweryPortfolio.length > 0 && (
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-xl font-bold mb-4 text-center">Brugghús með mörgum bjórum</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Hvaða brugghús höfðu marga bjóra í smökkuninni og hvernig gekk þeim?
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analytics.breweryPortfolio.map((portfolio) => (
              <div key={portfolio.brewery} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold">
                    {portfolio.country && getCountryFlag(portfolio.country)} {portfolio.brewery}
                  </h4>
                  <span className="text-primary font-bold text-xl">{portfolio.averageRating.toFixed(2)}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{portfolio.beersCount} bjórar í smökkuninni</p>
                <div className="space-y-2">
                  {portfolio.beers.map((beer, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm p-2 rounded bg-muted/30">
                      <span className="truncate flex-1">{beer.name}</span>
                      <span className="ml-2 font-semibold text-primary">{beer.rating.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Participant Brewery Preferences */}
      {VISIBLE_SECTIONS.participantBreweryPreferences && analytics.participantBreweryPreferences && analytics.participantBreweryPreferences.length > 0 && (
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-xl font-bold mb-4 text-center">Uppáhalds brugghús þátttakenda</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Hvaða brugghús fengu hæstar og lægstar einkunnir frá hverjum þátttakanda?
          </p>
          <div className="space-y-4">
            {analytics.participantBreweryPreferences.map((participant) => (
              <div key={participant.participantId} className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3">{participant.userName}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {participant.favoriteBrewery && (
                    <div className="bg-green-50 dark:bg-green-950 p-3 rounded">
                      <p className="text-xs text-muted-foreground mb-1">Uppáhald</p>
                      <p className="font-semibold text-green-700 dark:text-green-400">{participant.favoriteBrewery.brewery}</p>
                      <p className="text-sm mt-1">Einkunn: <span className="font-semibold">{participant.favoriteBrewery.average.toFixed(2)}</span> ({participant.favoriteBrewery.count} bjórar)</p>
                    </div>
                  )}
                  {participant.leastFavoriteBrewery && (
                    <div className="bg-red-50 dark:bg-red-950 p-3 rounded">
                      <p className="text-xs text-muted-foreground mb-1">Minnst uppáhald</p>
                      <p className="font-semibold text-red-700 dark:text-red-400">{participant.leastFavoriteBrewery.brewery}</p>
                      <p className="text-sm mt-1">Einkunn: <span className="font-semibold">{participant.leastFavoriteBrewery.average.toFixed(2)}</span> ({participant.leastFavoriteBrewery.count} bjórar)</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* COUNTRY ANALYTICS - Country Performance Ranking */}
      {VISIBLE_SECTIONS.countryPerformanceRanking && analytics.countryPerformanceRanking && analytics.countryPerformanceRanking.length > 0 && (
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-xl font-bold mb-4 text-center">Besta og versta upprunaland</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Hvaða lönd framleiða bjóra sem fengu hæstu og lægstu meðaleinkunnir?
          </p>
          <ResponsiveContainer width="100%" height={Math.max(300, analytics.countryPerformanceRanking.length * 40)}>
            <BarChart
              data={analytics.countryPerformanceRanking}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                type="number"
                domain={[0, 10]}
                label={{ value: 'Meðaleinkunn', position: 'insideBottom', offset: -5 }}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="country"
                width={120}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-card border rounded-lg p-3 shadow-lg">
                        <p className="font-bold text-sm mb-2">{getCountryFlag(data.country)} {data.country}</p>
                        <p className="text-sm">Meðaleinkunn: <span className="text-primary font-semibold">{data.averageRating.toFixed(2)}</span></p>
                        <p className="text-sm">Bjórar: <span className="font-semibold">{data.beersCount}</span></p>
                        <p className="text-sm">Einkunnir: <span className="font-semibold">{data.ratingsCount}</span></p>
                        <p className="text-xs text-muted-foreground mt-1">Span: {data.minRating.toFixed(1)} - {data.maxRating.toFixed(1)}</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar dataKey="averageRating" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Local vs International Comparison */}
      {VISIBLE_SECTIONS.localVsInternational && analytics.localVsInternational && (analytics.localVsInternational.icelandic.beersCount > 0 || analytics.localVsInternational.international.beersCount > 0) && (
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-xl font-bold mb-4 text-center">Íslenskir vs. Erlendir bjórar</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Eru þátttakendur hlutdrægir gagnvart íslenskum bjórum?
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Icelandic Beers */}
            <div className="bg-blue-50 dark:bg-blue-950 p-6 rounded-lg">
              <div className="flex items-center justify-center mb-4">
                <span className="text-4xl">🇮🇸</span>
              </div>
              <h4 className="font-semibold text-center text-lg mb-3">Íslenskir bjórar</h4>
              <div className="space-y-2">
                <p className="text-sm">Fjöldi bjóra: <span className="font-semibold">{analytics.localVsInternational.icelandic.beersCount}</span></p>
                <p className="text-sm">Einkunnir: <span className="font-semibold">{analytics.localVsInternational.icelandic.ratingsCount}</span></p>
                <p className="text-lg mt-3">Meðaleinkunn: <span className="text-primary font-bold text-2xl">{analytics.localVsInternational.icelandic.averageRating.toFixed(2)}</span></p>
              </div>
            </div>

            {/* International Beers */}
            <div className="bg-green-50 dark:bg-green-950 p-6 rounded-lg">
              <div className="flex items-center justify-center mb-4">
                <Globe className="h-10 w-10 text-green-600" />
              </div>
              <h4 className="font-semibold text-center text-lg mb-3">Erlendir bjórar</h4>
              <div className="space-y-2">
                <p className="text-sm">Fjöldi bjóra: <span className="font-semibold">{analytics.localVsInternational.international.beersCount}</span></p>
                <p className="text-sm">Einkunnir: <span className="font-semibold">{analytics.localVsInternational.international.ratingsCount}</span></p>
                <p className="text-lg mt-3">Meðaleinkunn: <span className="text-primary font-bold text-2xl">{analytics.localVsInternational.international.averageRating.toFixed(2)}</span></p>
              </div>
            </div>
          </div>

          {/* Comparison Result */}
          <div className="mt-6 text-center p-4 bg-muted/30 rounded-lg">
            <p className="text-sm font-semibold mb-2">Niðurstaða:</p>
            <p className="text-lg">
              {analytics.localVsInternational.favoritism === 'Local' && (
                <span className="text-blue-600 dark:text-blue-400 font-bold">🇮🇸 Íslenskir bjórar fengu hærri einkunnir (+{Math.abs(analytics.localVsInternational.difference).toFixed(2)} stig)</span>
              )}
              {analytics.localVsInternational.favoritism === 'International' && (
                <span className="text-green-600 dark:text-green-400 font-bold"><Globe className="inline h-5 w-5 mr-1 -mt-1" />Erlendir bjórar fengu hærri einkunnir (+{Math.abs(analytics.localVsInternational.difference).toFixed(2)} stig)</span>
              )}
              {analytics.localVsInternational.favoritism === 'Neutral' && (
                <span className="font-bold"><Scale className="inline h-5 w-5 mr-1 -mt-1" />Engin marktæk hlutdrægni (mismunur: {Math.abs(analytics.localVsInternational.difference).toFixed(2)} stig)</span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Detailed Per-Country Statistics */}
      {VISIBLE_SECTIONS.countryDetails && analytics.countryPerformanceRanking && analytics.countryPerformanceRanking.length > 0 && (
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-xl font-bold mb-4 text-center">Tölfræði eftir löndum</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Ítarlegur samanburður á meðaleinkunnir, fjölda bjóra og einkunnir fyrir hvert land
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.countryPerformanceRanking.map((country, index) => (
              <div
                key={country.country}
                className={`p-4 rounded-lg border-2 ${
                  country.country === 'Ísland'
                    ? 'bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700'
                    : 'bg-muted/30 border-muted'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getCountryFlag(country.country)}</span>
                    <h4 className="font-semibold text-sm">{country.country}</h4>
                  </div>
                  <RankMedal rank={index + 1} className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Meðaleinkunn:</span>
                    <span className="text-primary font-bold text-lg">{country.averageRating.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Fjöldi bjóra:</span>
                    <span className="font-semibold">{country.beersCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Fjöldi einkunna:</span>
                    <span className="font-semibold">{country.ratingsCount}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-xs text-muted-foreground">Bil:</span>
                    <span className="text-xs font-semibold">{country.minRating.toFixed(1)} - {country.maxRating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Country Distribution Pie Chart */}
      {VISIBLE_SECTIONS.countryDistribution && analytics.countryDistribution && analytics.countryDistribution.length > 0 && (
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-xl font-bold mb-4 text-center">Dreifing landa</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Hversu margir bjórar frá hverju landi voru smakkaðir
          </p>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={analytics.countryDistribution.map(({ country: _country, ...item }) => ({
                  ...item,
                  beerCountry: _country
                }))}
                dataKey="count"
                nameKey="beerCountry"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label={({ beerCountry, count, percent }: any) =>
                  `${beerCountry}: ${count} (${((percent as number) * 100).toFixed(0)}%)`
                }
                labelLine={true}
              >
                {analytics.countryDistribution.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-card border rounded-lg p-3 shadow-lg">
                        <p className="font-bold text-sm mb-2">{getCountryFlag(data.country)} {data.country}</p>
                        <p className="text-sm">Bjórar: <span className="font-semibold">{data.count}</span></p>
                        <p className="text-sm">Meðaleinkunn: <span className="text-primary font-semibold">{data.averageRating.toFixed(2)}</span></p>
                        <p className="text-xs text-muted-foreground mt-1">{data.totalRatings} einkunnir samtals</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Country ratings breakdown */}
          <div className="mt-6 space-y-2">
            <p className="text-sm font-semibold text-muted-foreground text-center mb-3">Meðaleinkunnir eftir landi</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {analytics.countryDistribution.slice(0, 6).map((country, index) => (
                <div key={country.country} className="flex items-center justify-between p-2 rounded bg-muted/30">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm">{country.country}</span>
                  </div>
                  <span className="text-sm font-semibold text-primary">{country.averageRating.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Participant Country Preferences */}
      {VISIBLE_SECTIONS.participantCountryPreferences && analytics.participantCountryPreferences && analytics.participantCountryPreferences.length > 0 && (
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-xl font-bold mb-4 text-center">Uppáhalds upprunalönd þátttakenda</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Hvaða lönd fengu hæstar og lægstar einkunnir frá hverjum þátttakanda?
          </p>
          <div className="space-y-4">
            {analytics.participantCountryPreferences.map((participant) => (
              <div key={participant.participantId} className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3">{participant.userName}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {participant.favoriteCountry && (
                    <div className="bg-green-50 dark:bg-green-950 p-3 rounded">
                      <p className="text-xs text-muted-foreground mb-1">Uppáhalds land</p>
                      <p className="font-semibold text-green-700 dark:text-green-400">{getCountryFlag(participant.favoriteCountry.country)} {participant.favoriteCountry.country}</p>
                      <p className="text-sm mt-1">Einkunn: <span className="font-semibold">{participant.favoriteCountry.average.toFixed(2)}</span> ({participant.favoriteCountry.count} bjórar)</p>
                    </div>
                  )}
                  {participant.leastFavoriteCountry && (
                    <div className="bg-red-50 dark:bg-red-950 p-3 rounded">
                      <p className="text-xs text-muted-foreground mb-1">Minnst uppáhalds land</p>
                      <p className="font-semibold text-red-700 dark:text-red-400">{getCountryFlag(participant.leastFavoriteCountry.country)} {participant.leastFavoriteCountry.country}</p>
                      <p className="text-sm mt-1">Einkunn: <span className="font-semibold">{participant.leastFavoriteCountry.average.toFixed(2)}</span> ({participant.leastFavoriteCountry.count} bjórar)</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Country Rating Consensus */}
      {VISIBLE_SECTIONS.countryRatingConsensus && analytics.countryRatingConsensus && analytics.countryRatingConsensus.length > 0 && (
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-xl font-bold mb-4 text-center">Samstaða um upprunalönd</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Hvaða lönd vöktu mest og minnst ágreining?
          </p>
          <ResponsiveContainer width="100%" height={Math.max(300, analytics.countryRatingConsensus.length * 40)}>
            <BarChart
              data={analytics.countryRatingConsensus}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                type="number"
                label={{ value: 'Staðalfrávik', position: 'insideBottom', offset: -5 }}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="country"
                width={120}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-card border rounded-lg p-3 shadow-lg">
                        <p className="font-bold text-sm mb-2">{getCountryFlag(data.country)} {data.country}</p>
                        <p className="text-sm">Staðalfrávik: <span className="font-semibold">{data.standardDeviation.toFixed(2)}</span></p>
                        <p className="text-sm">Samstaða: <span className={
                          data.agreement === 'High' ? 'text-green-600 font-semibold' :
                          data.agreement === 'Medium' ? 'text-orange-600 font-semibold' :
                          'text-red-600 font-semibold'
                        }>{data.agreement === 'High' ? <IconLabel icon={CircleCheck}>Há</IconLabel> : data.agreement === 'Medium' ? <IconLabel icon={TriangleAlert}>Miðlungs</IconLabel> : <IconLabel icon={Flame}>Lág</IconLabel>}</span></p>
                        <p className="text-xs text-muted-foreground mt-1">{data.beersCount} bjórar, {data.ratingsCount} einkunnir</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar
                dataKey="standardDeviation"
                shape={(props: any) => {
                  const { x, y, width, height, payload } = props
                  const fill = payload.agreement === 'High' ? '#10b981' :
                               payload.agreement === 'Medium' ? '#f59e0b' : '#ef4444'
                  return (
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      fill={fill}
                    />
                  )
                }}
              />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Lægra staðalfrávik = meiri samstaða um bjóra frá landinu
          </p>
        </div>
      )}
    </div>
  )
}
