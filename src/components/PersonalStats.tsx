'use client'

import { personalStats, type PersonalStatsInput } from '@/lib/stats'

interface PersonalStatsProps extends PersonalStatsInput {
  favoriteStyle?: { style: string; average: number; count: number } | null
}

export function PersonalStats({ favoriteStyle, ...input }: PersonalStatsProps) {
  const stats = personalStats(input)
  if (!stats) return null

  const offsetText = Math.abs(stats.offset) < 0.1
    ? 'Þú varst alveg í takt við hópinn'
    : stats.offset > 0
    ? `Þú gafst að meðaltali ${stats.offset.toFixed(2)} stigum hærra en hópurinn`
    : `Þú gafst að meðaltali ${Math.abs(stats.offset).toFixed(2)} stigum lægra en hópurinn`

  return (
    <div className="bg-card p-6 rounded-lg border-2 border-primary space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold">🍻 Þín smökkun</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {stats.ratedCount} bjórum gefin einkunn • meðaleinkunn {stats.myAverage.toFixed(2)}
        </p>
        <p className="font-medium mt-2">{offsetText}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Stat emoji="❤️" label="Uppáhaldsbjórinn þinn" main={stats.favourite.name} sub={`Þú gafst ${stats.favourite.score}`} />

        {stats.biggestDisagreement && (
          <Stat
            emoji="🙃"
            label="Mest ósammála hópnum"
            main={stats.biggestDisagreement.name}
            sub={`Þú: ${stats.biggestDisagreement.myScore} • Hópurinn: ${stats.biggestDisagreement.groupAverage.toFixed(1)}`}
          />
        )}

        {stats.twin && (
          <Stat
            emoji="👯"
            label="Bragðtvíburinn þinn"
            main={stats.twin.userName}
            sub={`${stats.twin.meanDifference.toFixed(1)} stig á milli að meðaltali (${stats.twin.sharedBeers} bjórar)`}
          />
        )}

        {favoriteStyle && (
          <Stat
            emoji="🍺"
            label="Uppáhalds bjórstíllinn"
            main={favoriteStyle.style}
            sub={`Meðaleinkunn ${favoriteStyle.average.toFixed(2)} (${favoriteStyle.count} bjórar)`}
          />
        )}
      </div>
    </div>
  )
}

function Stat({ emoji, label, main, sub }: { emoji: string; label: string; main: string; sub: string }) {
  return (
    <div className="p-3 rounded-lg bg-muted/50 flex items-start gap-3">
      <div className="text-2xl">{emoji}</div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
        <div className="font-bold truncate" title={main}>{main}</div>
        <div className="text-xs text-muted-foreground">{sub}</div>
      </div>
    </div>
  )
}
