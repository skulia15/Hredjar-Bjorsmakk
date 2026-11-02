import { Medal } from 'lucide-react'
import { cn } from '@/lib/utils'

const MEDAL_COLORS: Record<number, string> = {
  1: 'text-yellow-500',
  2: 'text-gray-500',
  3: 'text-amber-700',
}

/** Gold/silver/bronze medal for ranks 1-3; renders nothing for other ranks. */
export function RankMedal({ rank, className }: { rank: number; className?: string }) {
  const color = MEDAL_COLORS[rank]
  if (!color) return null
  return <Medal className={cn('inline-block h-5 w-5', color, className)} aria-label={`Sæti ${rank}`} />
}
