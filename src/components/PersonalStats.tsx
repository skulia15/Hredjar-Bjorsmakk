'use client'

import { Beer, Heart, type LucideIcon, Meh, Users, Wine } from 'lucide-react'
import { StatCard } from '@/components/StatCard'
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
    // Your own results matter most to you, so this one starts open
    <StatCard
      defaultOpen
      className="border-2 border-primary"
      icon={Wine}
      title="Þín smökkun"
      description={`${stats.ratedCount} bjórum gefin einkunn • meðaleinkunn ${stats.myAverage.toFixed(2)}`}
    >
    <div className="space-y-4">
      <p className="font-medium text-center">{offsetText}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Stat icon={Heart} label="Uppáhaldsbjórinn þinn" main={stats.favourite.name} sub={`Þú gafst ${stats.favourite.score}`} />

        {stats.biggestDisagreement && (
          <Stat
            icon={Meh}
            label="Mest ósammála hópnum"
            main={stats.biggestDisagreement.name}
            sub={`Þú: ${stats.biggestDisagreement.myScore} • Hópurinn: ${stats.biggestDisagreement.groupAverage.toFixed(1)}`}
          />
        )}

        {stats.twin && (
          <Stat
            icon={Users}
            label="Bragðtvíburinn þinn"
            main={stats.twin.userName}
            sub={`${stats.twin.meanDifference.toFixed(1)} stig á milli að meðaltali (${stats.twin.sharedBeers} bjórar)`}
          />
        )}

        {favoriteStyle && (
          <Stat
            icon={Beer}
            label="Uppáhalds bjórstíllinn"
            main={favoriteStyle.style}
            sub={`Meðaleinkunn ${favoriteStyle.average.toFixed(2)} (${favoriteStyle.count} bjórar)`}
          />
        )}
      </div>
    </div>
    </StatCard>
  )
}

function Stat({ icon: Icon, label, main, sub }: { icon: LucideIcon; label: string; main: string; sub: string }) {
  return (
    <div className="p-3 rounded-lg bg-muted/50 flex items-start gap-3">
      <Icon className="h-6 w-6 flex-shrink-0 text-primary" />
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
        <div className="font-bold truncate" title={main}>{main}</div>
        <div className="text-xs text-muted-foreground">{sub}</div>
      </div>
    </div>
  )
}
