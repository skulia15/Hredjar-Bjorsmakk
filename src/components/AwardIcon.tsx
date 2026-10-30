import { Brain, Flame, Gavel, HandHeart, Handshake, type LucideIcon, PiggyBank, Rocket, Swords, Trophy, Users } from 'lucide-react'
import type { AwardKind } from '@/lib/stats'

const AWARD_ICONS: Record<AwardKind, LucideIcon> = {
  generous: HandHeart,
  harsh: Gavel,
  twins: Users,
  opposites: Swords,
  controversial: Flame,
  unanimous: Handshake,
  winnerFan: Trophy,
  mindReader: Brain,
  bestValue: PiggyBank,
  fastest: Rocket,
}

export function AwardIcon({ kind, className }: { kind: AwardKind; className?: string }) {
  const Icon = AWARD_ICONS[kind]
  return <Icon className={className} />
}
