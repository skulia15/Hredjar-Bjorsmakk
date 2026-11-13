import { Gift, Rocket, Search, Snail, Target, type LucideIcon } from 'lucide-react'
import { ParticipantAvatar } from '@/components/ChristmasAvatar'
import type { BeerAward, BeerAwardKind } from '@/lib/beerAwards'

// The tasting-wide medal tiles' icons, in darker accents; solid tiles so they read on the cream card and the dark finished overlay alike
const STYLE: Record<BeerAwardKind, { icon: LucideIcon; accent: string }> = {
  fastest: { icon: Rocket, accent: '#A8650F' },
  slowest: { icon: Snail, accent: '#2F6150' },
  generous: { icon: Gift, accent: '#B42A31' },
  strict: { icon: Search, accent: '#1E6B4F' },
  outlier: { icon: Target, accent: '#7A5A00' },
}

/** This beer's own awards on the score reveal: who was quickest, slowest, kindest, harshest and furthest out */
export function BeerAwardsStrip({ awards }: { awards: BeerAward[] }) {
  if (awards.length === 0) return null
  return (
    <ul
      aria-label="Verðlaun fyrir þennan bjór"
      className="w-full grid gap-4 2xl:gap-5 grid-cols-[repeat(var(--award-count),minmax(0,1fr))]"
      style={{ '--award-count': awards.length } as React.CSSProperties}
    >
      {awards.map((award, i) => {
        const { icon: Icon, accent } = STYLE[award.kind]
        return (
          <li
            key={award.kind}
            className="min-w-0 flex items-center gap-4 rounded-2xl border-t-4 bg-[#FFFDF7] text-ink px-4 py-3 2xl:py-4 animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500"
            // Each lands just after the one before, once the bars have grown
            style={{ borderTopColor: accent, animationDelay: `${900 + i * 120}ms` }}
          >
            <span className="relative shrink-0">
              <ParticipantAvatar avatar={award.avatar} seed={award.participantId} className="w-[clamp(4rem,min(5.5vw,9.5vh),7rem)] h-[clamp(4rem,min(5.5vw,9.5vh),7rem)] shadow-sm" />
              <span
                className="absolute -bottom-1 -right-1 w-8 h-8 2xl:w-10 2xl:h-10 rounded-full text-cream flex items-center justify-center ring-2 ring-cream"
                style={{ backgroundColor: accent }}
                aria-hidden
              >
                <Icon className="h-[1.1rem] w-[1.1rem] 2xl:h-5 2xl:w-5" />
              </span>
            </span>
            <span className="min-w-0 flex flex-col">
              <span className="text-[length:clamp(0.85rem,min(0.95vw,1.7vh),1.25rem)] font-extrabold uppercase tracking-[0.02em] truncate" style={{ color: accent }}>{award.label}</span>
              <span className="text-[length:clamp(1.4rem,min(1.7vw,3vh),2.5rem)] font-extrabold leading-tight line-clamp-2 break-words">{award.name}</span>
              <span className="text-[length:clamp(1rem,min(1.1vw,2vh),1.5rem)] text-ink-soft tabular-nums truncate">{award.detail}</span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
