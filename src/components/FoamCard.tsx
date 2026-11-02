import { cn } from '@/lib/utils'

interface FoamCardProps {
  children: React.ReactNode
  /** cream card (default) or a darker pine panel */
  tone?: 'cream' | 'pine'
  size?: 'md' | 'lg'
  className?: string
  as?: 'div' | 'section' | 'nav'
  'aria-label'?: string
}

/** Card with a scalloped beer-foam / snow top edge. */
export function FoamCard({ children, tone = 'cream', size = 'md', className, as: Tag = 'div', ...rest }: FoamCardProps) {
  return (
    <Tag className="flex flex-col min-h-0" {...rest}>
      <div className={cn('foam shrink-0', tone === 'pine' && 'foam-pine', size === 'lg' && 'foam-lg')} />
      <div
        className={cn(
          'rounded-b-3xl flex-1 min-h-0',
          tone === 'cream' ? 'bg-card text-card-foreground' : 'bg-pine-light text-cream',
          className,
        )}
      >
        {children}
      </div>
    </Tag>
  )
}
