'use client'

import { useEffect, useState } from 'react'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
  Label,
  Legend,
  ReferenceLine
} from 'recharts'

interface PriceAnalyticsData {
  hasData: boolean
  overview: {
    totalBeers: number
    avgPrice: number
    medianPrice: number
    avgRating: number
    correlation: number
    premiumGap: number
  }
  valueRanking: Array<{
    rank: number
    beerId: string
    name: string
    brewery: string
    rating: number
    pricePerLiter: number
    valueScore: number
    efficiencyScore: number
    containerSize?: number
    containerType?: string
  }>
  bestValue: {
    name: string
    brewery: string
    rating: number
    pricePerLiter: number
    percentileSavings: number
  }
  quadrants: {
    hiddenGems: Array<{name: string, brewery: string, rating: number, pricePerLiter: number}>
    premiumWorthIt: Array<{name: string, brewery: string, rating: number, pricePerLiter: number}>
    budgetOptions: Array<{name: string, brewery: string, rating: number, pricePerLiter: number}>
    overpriced: Array<{name: string, brewery: string, rating: number, pricePerLiter: number}>
  }
  scatterData: Array<{
    name: string
    brewery: string
    x: number
    y: number
    ratingsCount: number
  }>
}

export function PriceAnalytics({ tastingId }: { tastingId: string }) {
  const [data, setData] = useState<PriceAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showScatter, setShowScatter] = useState(true)

  useEffect(() => {
    loadData()
  }, [tastingId])

  const loadData = async () => {
    try {
      const response = await fetch(`/api/tastings/${tastingId}/price-analytics`)
      const result = await response.json()
      if (result.hasData) {
        setData(result)
      }
    } catch (error) {
      console.error('Error loading price analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Hleður verðupplýsingar...</p>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload
      return (
        <div className="bg-card border rounded-lg p-3 shadow-lg">
          <p className="font-bold">{point.name}</p>
          <p className="text-sm text-muted-foreground">{point.brewery}</p>
          <div className="mt-2 space-y-1">
            <p className="text-sm">
              <span className="text-primary font-semibold">Einkunn:</span> {point.y.toFixed(2)}
            </p>
            <p className="text-sm">
              <span className="text-primary font-semibold">Verð/L:</span> {point.x} kr
            </p>
            <p className="text-xs text-muted-foreground">
              {point.ratingsCount} einkunn{point.ratingsCount !== 1 ? 'ir' : ''}
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  const getCorrelationDescription = (corr: number) => {
    if (corr > 0.7) return { text: 'Sterk jákvæð', emoji: '📈' }
    if (corr > 0.3) return { text: 'Miðlungs jákvæð', emoji: '↗️' }
    if (corr > -0.3) return { text: 'Engin', emoji: '➡️' }
    if (corr > -0.7) return { text: 'Miðlungs neikvæð', emoji: '↘️' }
    return { text: 'Sterk neikvæð', emoji: '📉' }
  }

  const corrDesc = getCorrelationDescription(data.overview.correlation)

  return (
    <div className="mt-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">💰 Verðgreining</h2>
        <p className="text-sm text-muted-foreground">
          {data.overview.totalBeers} bjórar með verð- og einkunnagögnum
        </p>
      </div>

      {/* Statistical Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-lg border bg-card text-center">
          <div className="text-2xl font-bold text-primary">{data.overview.medianPrice} kr</div>
          <div className="text-xs text-muted-foreground mt-1">Miðgildi verðs/L</div>
        </div>
        <div className="p-4 rounded-lg border bg-card text-center">
          <div className="text-2xl font-bold text-primary">{data.overview.avgRating}</div>
          <div className="text-xs text-muted-foreground mt-1">Meðaleinkunn</div>
        </div>
        <div className="p-4 rounded-lg border bg-card text-center">
          <div className="text-2xl font-bold">{corrDesc.emoji}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {corrDesc.text} fylgni
            <div className="text-xs opacity-60">r = {data.overview.correlation.toFixed(2)}</div>
          </div>
        </div>
        <div className="p-4 rounded-lg border bg-card text-center">
          <div className="text-2xl font-bold text-orange-600">
            {data.overview.premiumGap > 0 ? '+' : ''}{data.overview.premiumGap}%
          </div>
          <div className="text-xs text-muted-foreground mt-1">Premium í toppflokki</div>
        </div>
      </div>

      {/* Best Value Highlight */}
      <div className="p-4 rounded-lg border-2 border-primary bg-primary/5">
        <div className="flex items-start gap-3">
          <div className="text-3xl">💎</div>
          <div className="flex-1">
            <div className="font-semibold text-sm text-muted-foreground mb-1">BESTA KAUP</div>
            <div className="font-bold text-lg">{data.bestValue.name}</div>
            <div className="text-sm text-muted-foreground">{data.bestValue.brewery}</div>
            <div className="mt-2 flex gap-4 text-sm">
              <span className="text-primary font-semibold">
                {data.bestValue.rating} einkunn
              </span>
              <span>
                {data.bestValue.pricePerLiter} kr/L
                {data.bestValue.percentileSavings > 0 && (
                  <span className="text-green-600 ml-1">
                    ({data.bestValue.percentileSavings}% ódýrara)
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Toggle View Buttons */}
      <div className="flex justify-center gap-2">
        <button
          onClick={() => setShowScatter(true)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            showScatter
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          📊 Dreifingarrit
        </button>
        <button
          onClick={() => setShowScatter(false)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            !showScatter
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          🏆 Verðgildi
        </button>
      </div>

      {/* Scatter Plot */}
      {showScatter ? (
        <div className="space-y-4">
          <div className="p-4 rounded-lg border bg-card">
            <h3 className="font-semibold mb-4 text-center">Verð vs Einkunn</h3>
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Verð/L"
                  unit=" kr"
                >
                  <Label value="Verð per líter (kr)" offset={-10} position="insideBottom" />
                </XAxis>
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Einkunn"
                  domain={[0, 10]}
                >
                  <Label value="Einkunn" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
                </YAxis>
                <ZAxis type="number" dataKey="ratingsCount" range={[50, 400]} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine
                  y={data.overview.avgRating}
                  stroke="hsl(var(--primary))"
                  strokeDasharray="5 5"
                  label={{ value: 'Meðaleinkunn', position: 'right' }}
                />
                <ReferenceLine
                  x={data.overview.medianPrice}
                  stroke="hsl(var(--primary))"
                  strokeDasharray="5 5"
                  label={{ value: 'Miðgildi verðs', position: 'top' }}
                />
                <Scatter
                  name="Bjórar"
                  data={data.scatterData}
                  fill="hsl(var(--primary))"
                  fillOpacity={0.6}
                />
              </ScatterChart>
            </ResponsiveContainer>
            <div className="mt-4 text-xs text-muted-foreground text-center">
              Stærð bolla = fjöldi einkunna • Línur sýna meðaltöl
            </div>
          </div>

          {/* Quadrants Summary */}
          <div className="grid grid-cols-2 gap-3">
            {data.quadrants.hiddenGems.length > 0 && (
              <div className="p-3 rounded-lg border bg-green-500/10 border-green-500/20">
                <div className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <span>💎</span>
                  <span>Falinn gimsteinn ({data.quadrants.hiddenGems.length})</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Há einkunn, lágt verð
                </div>
              </div>
            )}
            {data.quadrants.premiumWorthIt.length > 0 && (
              <div className="p-3 rounded-lg border bg-blue-500/10 border-blue-500/20">
                <div className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <span>⭐</span>
                  <span>Premium gæði ({data.quadrants.premiumWorthIt.length})</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Há einkunn, hátt verð
                </div>
              </div>
            )}
            {data.quadrants.budgetOptions.length > 0 && (
              <div className="p-3 rounded-lg border bg-yellow-500/10 border-yellow-500/20">
                <div className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <span>💰</span>
                  <span>Sparnaður ({data.quadrants.budgetOptions.length})</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Lág einkunn, lágt verð
                </div>
              </div>
            )}
            {data.quadrants.overpriced.length > 0 && (
              <div className="p-3 rounded-lg border bg-red-500/10 border-red-500/20">
                <div className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <span>⚠️</span>
                  <span>Spurning ({data.quadrants.overpriced.length})</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Lág einkunn, hátt verð
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Value Ranking */
        <div className="space-y-3">
          <h3 className="font-semibold text-center">🏅 Verðgildi stigatafla</h3>
          <p className="text-xs text-center text-muted-foreground mb-4">
            Raðað eftir gæðum í hlutfalli við verð
          </p>
          {data.valueRanking.map((beer) => (
            <div
              key={beer.beerId}
              className={`p-4 rounded-lg border ${
                beer.rank <= 3 ? 'bg-primary/5 border-primary' : 'bg-card'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="text-2xl flex-shrink-0">
                    {beer.rank === 1 && '🥇'}
                    {beer.rank === 2 && '🥈'}
                    {beer.rank === 3 && '🥉'}
                    {beer.rank > 3 && `#${beer.rank}`}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate">{beer.name}</div>
                    <div className="text-sm text-muted-foreground truncate">{beer.brewery}</div>
                    {(beer.containerSize || beer.containerType) && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {beer.containerSize}ml {beer.containerType}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-lg font-bold text-primary">{beer.rating}</div>
                  <div className="text-xs text-muted-foreground">{beer.pricePerLiter} kr/L</div>
                  <div className="text-xs text-green-600 font-semibold mt-1">
                    {beer.efficiencyScore} pts/1000kr
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Insights */}
      <div className="p-4 rounded-lg border bg-muted/30">
        <div className="font-semibold mb-3 flex items-center gap-2">
          <span>🔍</span>
          <span>Tölfræðilegar niðurstöður</span>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>
              <strong>Fylgni verð og einkunna:</strong>{' '}
              {data.overview.correlation > 0
                ? `Bjórar með hærra verð hafa tilhneigingu til að fá hærri einkunn (r = ${data.overview.correlation.toFixed(2)})`
                : data.overview.correlation < -0.1
                ? `Bjórar með hærra verð hafa tilhneigingu til að fá lægri einkunn (r = ${data.overview.correlation.toFixed(2)})`
                : `Ekkert augljóst samband á milli verðs og einkunna (r = ${data.overview.correlation.toFixed(2)})`}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>
              <strong>Premium gap:</strong>{' '}
              Bjórar í efsta fjórðungi í einkunnum kosta að meðaltali{' '}
              <strong className="text-orange-600">{Math.abs(data.overview.premiumGap)}%</strong>
              {data.overview.premiumGap > 0 ? ' meira' : ' minna'} á lítra en meðaltal.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>
              <strong>Besta kaupin:</strong>{' '}
              <strong className="text-primary">{data.bestValue.name}</strong> skilar{' '}
              <strong className="text-green-600">{data.bestValue.rating}</strong> einkunn en kostar aðeins{' '}
              <strong>{data.bestValue.pricePerLiter} kr/L</strong>
              {data.bestValue.percentileSavings > 0 &&
                ` (${data.bestValue.percentileSavings}% undir miðgildi)`}.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
