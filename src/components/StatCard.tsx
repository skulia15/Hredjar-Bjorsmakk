import { ChevronDown, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: React.ReactNode
  /** Shown in a round badge before the title, so folded cards are easy to tell apart */
  icon?: LucideIcon
  description?: React.ReactNode
  /** Start expanded */
  defaultOpen?: boolean
  /** 'card' is a cream card; 'section' is a bare heading on the page for a group of cards */
  tone?: 'card' | 'section'
  className?: string
  children: React.ReactNode
}

/**
 * A statistics card that folds to its title and one-line description. The stats page has a
 * dozen of these; folded, the whole list fits a few phone screens and each opens on tap.
 * Native <details> keeps it keyboard and screen-reader friendly without any state.
 */
export function StatCard({ title, icon: Icon, description, defaultOpen = false, tone = 'card', className, children }: StatCardProps) {
  const isCard = tone === 'card'
  const Heading = isCard ? 'h3' : 'h2'
  return (
    <details open={defaultOpen} className={cn('group', isCard && 'bg-card rounded-lg border', className)}>
      <summary
        className={cn(
          'flex cursor-pointer list-none items-start gap-3 [&::-webkit-details-marker]:hidden',
          isCard ? 'p-4 sm:p-6' : 'rounded-2xl bg-pine-light px-4 py-3 hover:bg-pine-line',
        )}
      >
        {Icon && (
          <span
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
              isCard ? 'bg-gold-soft text-[#7A3B12]' : 'bg-pine text-gold',
            )}
            aria-hidden
          >
            <Icon className="h-5 w-5" />
          </span>
        )}
        <span className="flex-1 min-w-0">
          <Heading className={cn('font-bold leading-tight', isCard ? 'text-xl' : 'text-2xl')}>{title}</Heading>
          {description && <span className="mt-1 block text-sm text-muted-foreground">{description}</span>}
        </span>
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted" aria-hidden>
          <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
        </span>
      </summary>
      <div className={isCard ? 'px-4 pb-4 sm:px-6 sm:pb-6' : 'pt-4'}>{children}</div>
    </details>
  )
}
