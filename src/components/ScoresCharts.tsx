'use client'

import { BarChart, Bar, LineChart, Line, PieChart, Pie, ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ZAxis } from 'recharts'

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

interface AnalyticsData {
  overview: {
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
  // New analytics
  stylePerformanceRanking?: StylePerformanceRanking[]
  styleRatingSpread?: StyleRatingSpread[]
  styleRatingDistribution?: StyleRatingDistribution[]
  participantStylePreferences?: ParticipantStylePreferences[]
  unanimousRatings?: UnanimousRating[]
  participantRatingSpread?: ParticipantRatingSpread[]
}

interface ScoresChartsProps {
  scores: { beers: BeerScore[] }
  analytics: AnalyticsData
}

export function ScoresCharts({ scores, analytics }: ScoresChartsProps) {
  // Colors for pie chart
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16']

  return (
    <div className="mt-8 space-y-8">
      {/* Rating Trend Over Time Chart */}
      {analytics.ratingTrend && analytics.ratingTrend.length > 1 && (
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-xl font-bold mb-4 text-center">Þróun einkunnanna í gegnum smökkunina</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Hvernig meðaleinkunnir breytast eftir því sem bjórum fjölgar
          </p>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart
              data={analytics.ratingTrend}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="beerIndex"
                label={{ value: 'Bjór númer', position: 'insideBottom', offset: -5 }}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                domain={[0, 10]}
                label={{ value: 'Meðaleinkunn', angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 12 }}
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
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            {analytics.ratingTrend[0].average < analytics.ratingTrend[analytics.ratingTrend.length - 1].average ? (
              <p className="text-green-600 font-medium">
                📈 Hækkandi þróun: Einkunnir hækkuðu frá {analytics.ratingTrend[0].average.toFixed(2)} í {analytics.ratingTrend[analytics.ratingTrend.length - 1].average.toFixed(2)}
              </p>
            ) : analytics.ratingTrend[0].average > analytics.ratingTrend[analytics.ratingTrend.length - 1].average ? (
              <p className="text-orange-600 font-medium">
                📉 Lækkandi þróun: Einkunnir lækkuðu frá {analytics.ratingTrend[0].average.toFixed(2)} í {analytics.ratingTrend[analytics.ratingTrend.length - 1].average.toFixed(2)}
              </p>
            ) : (
              <p>
                ➡️ Stöðug þróun: Einkunnir haldast í kringum {analytics.ratingTrend[0].average.toFixed(2)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Beer Style Distribution Pie Chart */}
      {analytics.styleDistribution && analytics.styleDistribution.length > 0 && (
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-xl font-bold mb-4 text-center">Dreifing bjórstegunda</h3>
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
      {analytics.ratingDistribution && Object.keys(analytics.ratingDistribution).length > 0 && (
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-xl font-bold mb-4 text-center">Dreifing einkunnanna</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Hversu oft hver einkunn var gefin
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={Object.entries(analytics.ratingDistribution).map(([rating, count]) => ({
              rating: parseFloat(rating),
              count
            })).filter(d => d.count > 0).sort((a, b) => a.rating - b.rating)}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="rating"
                label={{ value: 'Einkunn', position: 'insideBottom', offset: -5 }}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                label={{ value: 'Fjöldi', angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 12 }}
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
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Beer Comparison Chart */}
      {scores.beers.length > 0 && (
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
      {analytics.beerTimings && analytics.beerTimings.length > 0 && (
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
      {analytics.participantStats && analytics.participantStats.length > 0 && (
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-xl font-bold mb-4 text-center">Þátttaka og meðaleinkunnir</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Meðaleinkunn og fjöldi einkunna hvers þátttakanda
          </p>
          <ResponsiveContainer width="100%" height={Math.max(300, analytics.participantStats.length * 50)}>
            <BarChart
              data={analytics.participantStats}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                type="number"
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
              <Bar dataKey="averageRating" fill="#3b82f6" />
              <Bar dataKey="ratingsCount" fill="#94a3b8" />
              <Legend
                formatter={(value) => value === 'averageRating' ? 'Meðaleinkunn' : 'Fjöldi einkunnanna'}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Beer Controversy Index Chart */}
      {analytics.beerControversy && analytics.beerControversy.length > 0 && (
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-xl font-bold mb-4 text-center">Umdeildir bjórar</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Hvaða bjórar vöktu mest ágreining (hár staðalfrávik = meiri ágreiningur)
          </p>
          <ResponsiveContainer width="100%" height={Math.max(300, analytics.beerControversy.length * 40)}>
            <BarChart
              data={analytics.beerControversy}
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
                        <p className="text-sm">Staðalfrávik: <span className="font-semibold">{data.standardDeviation.toFixed(2)}</span></p>
                        <p className="text-xs mt-1">
                          <span className={
                            data.controversy === 'High' ? 'text-red-600 font-semibold' :
                            data.controversy === 'Medium' ? 'text-orange-600 font-semibold' :
                            'text-green-600 font-semibold'
                          }>
                            {data.controversy === 'High' ? '🔥 Mjög umdeilanlegur' :
                             data.controversy === 'Medium' ? '⚠️ Nokkuð umdeilanlegur' :
                             '✅ Almennt sammála'}
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
              />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Hærra staðalfrávik þýðir meiri ágreiningur um bjórinn
          </p>
        </div>
      )}

      {/* ABV vs Rating Scatter Plot */}
      {analytics.abvVsRating && analytics.abvVsRating.length > 0 && (
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
                domain={[0, 10]}
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
              <Scatter data={analytics.abvVsRating} fill="#3b82f6">
                {analytics.abvVsRating.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Rating Velocity Chart */}
      {analytics.ratingVelocity && analytics.ratingVelocity.length > 0 && (
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
      {analytics.participantDeviation && analytics.participantDeviation.length > 0 && (
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
                          {data.deviation > 0 ? '+' : ''}{data.deviation.toFixed(2)}
                        </span></p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {data.deviation > 0.5 ? '😊 Rausnarlegri en hópurinn' :
                           data.deviation < -0.5 ? '🤔 Gagnrýnni en hópurinn' :
                           '👌 Nálægt hópnum'}
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

      {/* Rating Consensus Radar Chart */}
      {analytics.ratingConsensus && analytics.ratingConsensus.length > 2 && (
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-xl font-bold mb-4 text-center">Samstaða um bjóra</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Hversu sammála voru þátttakendur um hvern bjór? (hærra = meiri samstaða)
          </p>
          <ResponsiveContainer width="100%" height={450}>
            <RadarChart data={analytics.ratingConsensus}>
              <PolarGrid stroke="#94a3b8" opacity={0.3} />
              <PolarAngleAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#666' }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 10]}
                tick={{ fontSize: 10 }}
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
                          {data.consensus > 8 ? '✅ Mjög sammála' :
                           data.consensus > 6 ? '👍 Nokkuð sammála' :
                           '⚠️ Misjafnt álit'}
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Radar
                name="Samstaða"
                dataKey="consensus"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.6}
              />
            </RadarChart>
          </ResponsiveContainer>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Hærri gildi þýða meiri samstöðu (minni ágreiningur)
          </p>
        </div>
      )}

      {/* NEW ANALYTICS - Style Performance Ranking */}
      {analytics.stylePerformanceRanking && analytics.stylePerformanceRanking.length > 0 && (
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-xl font-bold mb-4 text-center">Besti og versti bjórstíllinn</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Hvaða bjórstíllar fengu hæstu og lægstu meðaleinkunnir?
          </p>
          <ResponsiveContainer width="100%" height={Math.max(300, analytics.stylePerformanceRanking.length * 40)}>
            <BarChart
              data={analytics.stylePerformanceRanking}
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
                dataKey="style"
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

      {/* Style Rating Spread - Agreement levels */}
      {analytics.styleRatingSpread && analytics.styleRatingSpread.length > 0 && (
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-xl font-bold mb-4 text-center">Samstaða um bjórstíla</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Hvaða bjórstíllar vöktu mest og minnst ágreining?
          </p>
          <ResponsiveContainer width="100%" height={Math.max(300, analytics.styleRatingSpread.length * 40)}>
            <BarChart
              data={analytics.styleRatingSpread}
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
                dataKey="style"
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
                        }>{data.agreement === 'High' ? '✅ Há' : data.agreement === 'Medium' ? '⚠️ Miðlungs' : '🔥 Lág'}</span></p>
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
      {analytics.participantStylePreferences && analytics.participantStylePreferences.length > 0 && (
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
      {analytics.unanimousRatings && analytics.unanimousRatings.length > 0 && (
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
                            {data.unanimity === 'Very High' ? '✅ Mjög há samstaða' :
                             data.unanimity === 'High' ? '✅ Há samstaða' :
                             '👍 Góð samstaða'}
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
      {analytics.participantRatingSpread && analytics.participantRatingSpread.length > 0 && (
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
                            {data.ratingStyle === 'Consistent' ? '✅ Stöðugur' :
                             data.ratingStyle === 'Moderate' ? '⚠️ Miðlungs' :
                             '🔥 Breitt svið'}
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
    </div>
  )
}
