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
import { ArrowDownRight, ArrowUpRight, Award, Coins, Gem, MoveRight, Star, TrendingDown, TrendingUp, TriangleAlert } from 'lucide-react'
import { RankMedal } from '@/components/RankMedal'
import { linearFit, ratingDomain } from '@/lib/stats'

// Value ranking rows shown before "show all"
const VALUE_RANKING_PREVIEW = 5

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
  const [showAllValue, setShowAllValue] = useState(false)
  const [expandedQuadrants, setExpandedQuadrants] = useState<{
    hiddenGems: boolean
    premiumWorthIt: boolean
    budgetOptions: boolean
    overpriced: boolean
  }>({
    hiddenGems: false,
    premiumWorthIt: false,
    budgetOptions: false,
    overpriced: false
  })

  const toggleQuadrant = (quadrant: keyof typeof expandedQuadrants) => {
    setExpandedQuadrants(prev => ({
      ...prev,
      [quadrant]: !prev[quadrant]
    }))
  }

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
    if (corr > 0.7) return { text: 'Sterk jákvæð', icon: TrendingUp }
    if (corr > 0.3) return { text: 'Miðlungs jákvæð', icon: ArrowUpRight }
    if (corr > -0.3) return { text: 'Engin', icon: MoveRight }
    if (corr > -0.7) return { text: 'Miðlungs neikvæð', icon: ArrowDownRight }
    return { text: 'Sterk neikvæð', icon: TrendingDown }
  }

  const corrDesc = getCorrelationDescription(data.overview.correlation)
  const CorrIcon = corrDesc.icon

  const priceFit = data.scatterData.length > 2
    ? linearFit(data.scatterData.map(p => ({ x: p.x, y: p.y })))
    : null
  const minPrice = Math.min(...data.scatterData.map(p => p.x))
  const maxPrice = Math.max(...data.scatterData.map(p => p.x))

  return (
    <div className="mt-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2"><Coins className="h-6 w-6 text-yellow-500" /> Verðgreining</h2>
        <p className="text-sm text-muted-foreground">
          {data.overview.totalBeers} bjórar með verð- og einkunnagögnum
        </p>
      </div>

      {/* Statistical Overview */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-lg border bg-card text-center">
          <div className="text-2xl font-bold text-primary">{data.overview.medianPrice} kr</div>
          <div className="text-xs text-muted-foreground mt-1">Miðgildi verðs/L</div>
        </div>
        <div className="p-4 rounded-lg border bg-card text-center">
          <CorrIcon className="h-8 w-8 mx-auto" />
          <div className="text-xs text-muted-foreground mt-1">
            {corrDesc.text} fylgni
            <div className="text-xs text-muted-foreground">r = {data.overview.correlation.toFixed(2)}</div>
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
      <div className="p-4 rounded-lg border-2 border-primary bg-card">
        <div className="flex items-start gap-3">
          <Gem className="h-8 w-8 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-muted-foreground mb-1">BESTU KAUP</div>
            <div className="font-bold text-lg">{data.bestValue.name}</div>
            <div className="text-sm text-muted-foreground">{data.bestValue.brewery}</div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
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

      {/* Scatter Plot */}
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
                domain={ratingDomain(data.scatterData.map(p => p.y))}
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
              {priceFit && maxPrice > minPrice && (
                <ReferenceLine
                  segment={[
                    { x: minPrice, y: priceFit.intercept + priceFit.slope * minPrice },
                    { x: maxPrice, y: priceFit.intercept + priceFit.slope * maxPrice },
                  ]}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="6 4"
                  strokeWidth={2}
                  ifOverflow="extendDomain"
                />
              )}
              <Scatter
                name="Bjórar"
                data={data.scatterData}
                fill="hsl(var(--primary))"
                fillOpacity={0.6}
              />
            </ScatterChart>
          </ResponsiveContainer>
          <div className="mt-4 text-xs text-muted-foreground text-center">
            Stærð bolla = fjöldi einkunna • Línur sýna meðaltöl • Brotalína sýnir leitni
          </div>
        </div>

        {/* Quadrants Summary */}
        <div className="space-y-3">
          <h3 className="font-semibold text-center text-sm text-muted-foreground">
            Bjórar eftir svæðum í dreifingarriti
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {data.quadrants.hiddenGems.length > 0 && (
              <div className="rounded-lg border bg-green-50 border-green-500/20">
                <button
                  onClick={() => toggleQuadrant('hiddenGems')}
                  className="w-full p-3 text-left hover:bg-green-500/5 transition-colors"
                >
                  <div className="font-semibold text-sm mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Gem className="h-4 w-4 text-green-600" />
                      <span>Falinn gimsteinn ({data.quadrants.hiddenGems.length})</span>
                    </div>
                    <span className="text-xs">{expandedQuadrants.hiddenGems ? '▼' : '▶'}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Há einkunn, lágt verð
                  </div>
                </button>
                {expandedQuadrants.hiddenGems && (
                  <div className="px-3 pb-3 space-y-2">
                    {data.quadrants.hiddenGems.map((beer, idx) => (
                      <div key={idx} className="text-xs border-t pt-2">
                        <div className="font-semibold">{beer.name}</div>
                        <div className="text-muted-foreground">{beer.brewery}</div>
                        <div className="flex gap-3 mt-1">
                          <span className="text-primary">{beer.rating} einkunn</span>
                          <span>{beer.pricePerLiter} kr/L</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {data.quadrants.premiumWorthIt.length > 0 && (
              <div className="rounded-lg border bg-blue-500/10 border-blue-500/20">
                <button
                  onClick={() => toggleQuadrant('premiumWorthIt')}
                  className="w-full p-3 text-left hover:bg-blue-500/5 transition-colors"
                >
                  <div className="font-semibold text-sm mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-blue-600" />
                      <span>Premium gæði ({data.quadrants.premiumWorthIt.length})</span>
                    </div>
                    <span className="text-xs">{expandedQuadrants.premiumWorthIt ? '▼' : '▶'}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Há einkunn, hátt verð
                  </div>
                </button>
                {expandedQuadrants.premiumWorthIt && (
                  <div className="px-3 pb-3 space-y-2">
                    {data.quadrants.premiumWorthIt.map((beer, idx) => (
                      <div key={idx} className="text-xs border-t pt-2">
                        <div className="font-semibold">{beer.name}</div>
                        <div className="text-muted-foreground">{beer.brewery}</div>
                        <div className="flex gap-3 mt-1">
                          <span className="text-primary">{beer.rating} einkunn</span>
                          <span>{beer.pricePerLiter} kr/L</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {data.quadrants.budgetOptions.length > 0 && (
              <div className="rounded-lg border bg-yellow-500/10 border-yellow-500/20">
                <button
                  onClick={() => toggleQuadrant('budgetOptions')}
                  className="w-full p-3 text-left hover:bg-yellow-500/5 transition-colors"
                >
                  <div className="font-semibold text-sm mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Coins className="h-4 w-4 text-yellow-600" />
                      <span>Sparnaður ({data.quadrants.budgetOptions.length})</span>
                    </div>
                    <span className="text-xs">{expandedQuadrants.budgetOptions ? '▼' : '▶'}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Lág einkunn, lágt verð
                  </div>
                </button>
                {expandedQuadrants.budgetOptions && (
                  <div className="px-3 pb-3 space-y-2">
                    {data.quadrants.budgetOptions.map((beer, idx) => (
                      <div key={idx} className="text-xs border-t pt-2">
                        <div className="font-semibold">{beer.name}</div>
                        <div className="text-muted-foreground">{beer.brewery}</div>
                        <div className="flex gap-3 mt-1">
                          <span className="text-primary">{beer.rating} einkunn</span>
                          <span>{beer.pricePerLiter} kr/L</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {data.quadrants.overpriced.length > 0 && (
              <div className="rounded-lg border bg-red-50 border-red-500/20">
                <button
                  onClick={() => toggleQuadrant('overpriced')}
                  className="w-full p-3 text-left hover:bg-red-500/5 transition-colors"
                >
                  <div className="font-semibold text-sm mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <TriangleAlert className="h-4 w-4 text-red-600" />
                      <span>Spurning ({data.quadrants.overpriced.length})</span>
                    </div>
                    <span className="text-xs">{expandedQuadrants.overpriced ? '▼' : '▶'}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Lág einkunn, hátt verð
                  </div>
                </button>
                {expandedQuadrants.overpriced && (
                  <div className="px-3 pb-3 space-y-2">
                    {data.quadrants.overpriced.map((beer, idx) => (
                      <div key={idx} className="text-xs border-t pt-2">
                        <div className="font-semibold">{beer.name}</div>
                        <div className="text-muted-foreground">{beer.brewery}</div>
                        <div className="flex gap-3 mt-1">
                          <span className="text-primary">{beer.rating} einkunn</span>
                          <span>{beer.pricePerLiter} kr/L</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Value Ranking */}
      <div className="space-y-3">
        <h3 className="font-semibold flex items-center justify-center gap-2"><Award className="h-5 w-5" /> Verðgildi stigatafla</h3>
        <p className="text-xs text-center text-muted-foreground mb-4">
          Raðað eftir gæðum í hlutfalli við verð
        </p>
        {(showAllValue ? data.valueRanking : data.valueRanking.slice(0, VALUE_RANKING_PREVIEW)).map((beer) => (
          <div
            key={beer.beerId}
            className={`p-4 rounded-lg border ${
              beer.rank <= 3 ? 'bg-card border-2 border-primary' : 'bg-card'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="text-2xl flex-shrink-0">
                  <RankMedal rank={beer.rank} className="h-7 w-7" />
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
        {data.valueRanking.length > VALUE_RANKING_PREVIEW && (
          <div className="flex justify-center">
            <button
              onClick={() => setShowAllValue(!showAllValue)}
              className="px-4 py-2 rounded-lg border bg-card hover:bg-muted transition-colors text-sm font-medium"
            >
              {showAllValue ? 'Sýna færri ↑' : `Sýna alla (${data.valueRanking.length - VALUE_RANKING_PREVIEW} í viðbót) ↓`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
