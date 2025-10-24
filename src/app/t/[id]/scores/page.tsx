'use client'

import { use, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'

interface BeerScore {
  beerId: string
  name: string
  brewery: string
  average: number
  count: number
  rank: number
}

interface ScoresData {
  tastingId: string
  title: string
  status: string
  beers: BeerScore[]
}

interface ParticipantStats {
  participantId: string
  userName: string
  code: string
  ratingsCount: number
  possibleRatings: number
  engagementRate: number
  averageRating: number
  topBeer: {
    beerId: string
    name: string
    brewery: string
    score: number
  } | null
  favoriteStyle: {
    style: string
    average: number
    count: number
  } | null
  ratingVariance: number
}

interface BeerTiming {
  beerId: string
  name: string
  durationMinutes: number
}

interface AnalyticsData {
  overview: {
    tastingId: string
    title: string
    status: string
    totalParticipants: number
    totalBeers: number
    finishedBeers: number
    totalRatings: number
    overallAverage: number
    averageTimePerBeer: number | null
  }
  participantStats: ParticipantStats[]
  ratingDistribution: Record<string, number>
  beerTimings: BeerTiming[]
  topRatedBeers: Array<{
    beerId: string
    name: string
    brewery: string
    average: number
    ratingsCount: number
    status: string
  }>
}

export default function ScoresPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise)
  const router = useRouter()
  const [scores, setScores] = useState<ScoresData | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    // Refresh scores every 5 seconds during active tasting
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [params.id])

  const loadData = async () => {
    try {
      const [scoresResponse, analyticsResponse] = await Promise.all([
        fetch(`/api/tastings/${params.id}/scores`),
        fetch(`/api/tastings/${params.id}/analytics`)
      ])
      const scoresData = await scoresResponse.json()
      const analyticsData = await analyticsResponse.json()
      setScores(scoresData)
      setAnalytics(analyticsData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getMedal = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🍺</div>
          <p className="text-muted-foreground">Hleður einkunnum...</p>
        </div>
      </div>
    )
  }

  if (!scores) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Einkunnir ekki tiltækar</h2>
          <Link href={`/t/${params.id}`} className="text-primary hover:underline">
            Til baka í smökkun
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">{scores.title}</h1>
          <p className="text-muted-foreground">Stigatafla </p>
          {scores.status === 'active' && (
            <p className="text-sm text-muted-foreground">
              Uppfærslur í beinni • {scores.beers.length} bjórum gefin einkunn
            </p>
          )}
        </div>

        {/* Scores List */}
        {scores.beers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🍺</div>
            <p className="text-muted-foreground">
              Engir bjórar hafa fengið einkunn ennþá
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {scores.beers.map((beer) => (
              <div
                key={beer.beerId}
                className={`p-4 rounded-lg border ${
                  beer.rank <= 3
                    ? 'bg-card border-2 border-primary'
                    : 'bg-card'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getMedal(beer.rank) && (
                        <span className="text-2xl">{getMedal(beer.rank)}</span>
                      )}
                      <span className="text-lg font-semibold text-muted-foreground">
                        #{beer.rank}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg truncate">{beer.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {beer.brewery}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-3xl font-bold text-primary">
                      {beer.average.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {beer.count} einkunn{beer.count !== 1 ? 'ir' : ''}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Charts and Analytics */}
        {analytics && scores.beers.length > 0 && (
          <div className="mt-8 space-y-8">
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
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
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
                    <Bar dataKey="average" radius={[0, 8, 8, 0]}>
                      {scores.beers.map((beer, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={beer.rank === 1 ? '#FFD700' : beer.rank === 2 ? '#C0C0C0' : beer.rank === 3 ? '#CD7F32' : 'hsl(var(--primary))'}
                        />
                      ))}
                    </Bar>
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
                    <Bar dataKey="durationMinutes" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} />
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
                    <Bar dataKey="averageRating" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} />
                    <Bar dataKey="ratingsCount" fill="hsl(var(--muted))" radius={[0, 8, 8, 0]} />
                    <Legend
                      formatter={(value) => value === 'averageRating' ? 'Meðaleinkunn' : 'Fjöldi einkunnanna'}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* User Statistics - Only show for closed tastings */}
        {scores.status === 'closed' && analytics && analytics.participantStats.length > 0 && (
          <div className="mt-8 space-y-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Ítarleg tölfræði þátttakenda</h2>
              <p className="text-sm text-muted-foreground">
                Meðaleinkunn: {analytics.overview.overallAverage.toFixed(2)} • {analytics.overview.totalRatings} einkunnir samtals
              </p>
            </div>

            <div className="space-y-3">
              {analytics.participantStats.map((participant) => (
                <div
                  key={participant.participantId}
                  className="p-4 rounded-lg border bg-card"
                >
                  <div className="space-y-3">
                    {/* Participant name and average */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg">{participant.userName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {participant.ratingsCount} af {participant.possibleRatings} bjórum gefin einkunn ({participant.engagementRate}%)
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-2xl font-bold text-primary">
                          {participant.averageRating.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          meðaleinkunn
                        </div>
                      </div>
                    </div>

                    {/* Top beer and favorite style */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      {participant.topBeer && (
                        <div className="p-2 rounded bg-muted/50">
                          <div className="font-semibold text-muted-foreground mb-1">Besti bjórinn</div>
                          <div className="font-medium">{participant.topBeer.name}</div>
                          <div className="text-xs text-muted-foreground">{participant.topBeer.brewery}</div>
                          <div className="text-primary font-bold mt-1">{participant.topBeer.score.toFixed(2)}</div>
                        </div>
                      )}
                      {participant.favoriteStyle && (
                        <div className="p-2 rounded bg-muted/50">
                          <div className="font-semibold text-muted-foreground mb-1">Uppáhalds stíll</div>
                          <div className="font-medium">{participant.favoriteStyle.style}</div>
                          <div className="text-xs text-muted-foreground">
                            {participant.favoriteStyle.count} bjór{participant.favoriteStyle.count !== 1 ? 'ar' : ''}
                          </div>
                          <div className="text-primary font-bold mt-1">{participant.favoriteStyle.average.toFixed(2)} meðaltal</div>
                        </div>
                      )}
                    </div>

                    {/* Rating consistency */}
                    {participant.ratingVariance > 0 && (
                      <div className="text-xs text-muted-foreground">
                        Samræmi einkunnanna: {participant.ratingVariance < 1.5 ? 'Mjög samræmi' : participant.ratingVariance < 2.5 ? 'Í meðallagi' : 'Misjafnt'} (σ = {participant.ratingVariance})
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-center gap-4 pt-4">
          <button
            onClick={() => router.back()}
            className="text-sm text-muted-foreground hover:text-foreground cursor-pointer"
          >
            ← Til baka
          </button>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Forsíða →
          </Link>
        </div>
      </div>
    </div>
  )
}
