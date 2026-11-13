'use client'

import { CartesianGrid, LabelList, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { MoveRight, TrendingDown, TrendingUp } from 'lucide-react'
import { useChartTheme } from '@/hooks/useChartTheme'
import { linearFit, ratingDomain } from '@/lib/stats'
import { StatCard } from '@/components/StatCard'

export interface RatingTrendPoint {
  beerIndex: number
  beerId: string
  name: string
  average: number
  ratingsCount: number
}

/**
 * Each beer's average in the order they were tasted, with a trend line: are scores climbing as the
 * night goes on? Nothing in it gives the closing awards away, so it shows during the tasting too.
 * Needs two beers to draw a line.
 */
export function RatingTrendChart({ ratingTrend, defaultOpen = false }: { ratingTrend: RatingTrendPoint[]; defaultOpen?: boolean }) {
  const chart = useChartTheme()
  const trendFit = ratingTrend.length > 1
    ? linearFit(ratingTrend.map(p => ({ x: p.beerIndex, y: p.average })))
    : null
  if (!trendFit) return null
  const trendData = ratingTrend.map(p => ({
    ...p,
    fitted: Number((trendFit.intercept + trendFit.slope * p.beerIndex).toFixed(2)),
  }))

  return (
    <StatCard defaultOpen={defaultOpen} icon={TrendingUp} title={<>Þróun einkunna í gegnum smökkunina</>} description={<>Meðaleinkunn hvers bjórs (lóðrétt) í þeirri röð sem þeir voru smakkaðir (lárétt)</>}>
      {/* Axis titles live in the text above; on a phone they ate a fifth of the width */}
      <ResponsiveContainer width="100%" height={280}>
        <LineChart
          data={trendData}
          margin={{ top: 16, right: 8, left: 0, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} stroke={chart.grid} />
          <XAxis
            dataKey="beerIndex"
            tick={{ fontSize: '0.75rem' }}
            stroke={chart.axis}
            minTickGap={16}
          />
          <YAxis
            domain={ratingDomain(ratingTrend.map(p => p.average))}
            tick={{ fontSize: '0.75rem' }}
            stroke={chart.axis}
            width={32}
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
            type="linear"
            dataKey="average"
            stroke={chart.primary}
            strokeWidth={2}
            dot={{ fill: chart.primary, r: ratingTrend.length > 20 ? 2.5 : 4 }}
            activeDot={{ r: 6 }}
          >
            {/* Value labels only while they can fit side by side */}
            {ratingTrend.length <= 15 && (
              <LabelList dataKey="average" position="top" fontSize="0.6875rem" formatter={(v) => Number(v).toFixed(1)} />
            )}
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
    </StatCard>
  )
}
