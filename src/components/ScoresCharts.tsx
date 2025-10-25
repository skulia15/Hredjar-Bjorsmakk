'use client'

import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'

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

interface ParticipantStats {
  participantId: string
  userName: string
  code: string
  ratingsCount: number
  possibleRatings: number
  engagementRate: number
  averageRating: number
}

interface AnalyticsData {
  overview: {
    averageTimePerBeer: number | null
  }
  participantStats: ParticipantStats[]
  ratingDistribution: Record<string, number>
  ratingTrend?: RatingTrendPoint[]
  beerTimings: BeerTiming[]
}

interface ScoresChartsProps {
  scores: { beers: BeerScore[] }
  analytics: AnalyticsData
}

export function ScoresCharts({ scores, analytics }: ScoresChartsProps) {
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
    </div>
  )
}
