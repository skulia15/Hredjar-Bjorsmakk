'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Lock } from 'lucide-react'
import { AVATARS, avatarSrc } from '@/lib/avatars'

interface AvatarPickerProps {
  selectedAvatar: string | null
  onSelect: (key: string) => void
  takenAvatars?: string[]
  disabled?: boolean
}

export function AvatarPicker({
  selectedAvatar,
  onSelect,
  takenAvatars = [],
  disabled = false,
}: AvatarPickerProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollDown, setCanScrollDown] = useState(true)

  const takenSet = new Set(takenAvatars)
  // Free pictures first, so the grid doesn't open on a row of padlocks. Ordered once: the taken
  // list refreshes while people join, and a reshuffle would move pictures under someone's finger
  const [order] = useState(() =>
    [...AVATARS].sort((a, b) => Number(takenSet.has(a.key)) - Number(takenSet.has(b.key))),
  )
  const allTaken = AVATARS.every(a => takenSet.has(a.key))
  const chosenObj = AVATARS.find(a => a.key === selectedAvatar)
  const availableCount = allTaken ? AVATARS.length : AVATARS.filter(a => !takenSet.has(a.key)).length

  const updateScrollState = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 16)
  }

  useEffect(() => {
    updateScrollState()
    window.addEventListener('resize', updateScrollState)
    return () => window.removeEventListener('resize', updateScrollState)
  }, [])

  const scrollDownMore = () => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ top: 260, behavior: 'smooth' })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">
          Veldu þér jólamynd
        </span>
        <span className="text-xs font-medium text-muted-foreground">
          {availableCount} af {AVATARS.length} lausar
        </span>
      </div>

      {/* Large featured preview of the currently selected avatar */}
      {chosenObj && (
        <div className="flex flex-col items-center pb-4 border-b">
          <div className="relative w-24 h-24 sm:w-44 sm:h-44 rounded-full overflow-hidden ring-4 ring-amber-500 shadow-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarSrc(chosenObj)}
              alt=""
              className="w-full h-full object-cover select-none"
            />
          </div>
        </div>
      )}

      {/* Scrollable grid container with inner border, partial row peek, and bottom fade indicator */}
      <div className="relative rounded-xl border bg-muted/20 overflow-hidden">
        <div
          ref={scrollRef}
          onScroll={updateScrollState}
          className="grid grid-cols-3 sm:grid-cols-4 gap-3 h-[300px] sm:h-[360px] overflow-y-scroll p-3 pb-12"
        >
          {order.map(avatar => {
            const isTaken = !allTaken && takenSet.has(avatar.key)
            const isSelected = selectedAvatar === avatar.key
            return (
              <button
                key={avatar.key}
                type="button"
                disabled={isTaken || disabled}
                onClick={() => onSelect(avatar.key)}
                aria-label={isTaken ? `${avatar.name} (frátekin)` : avatar.name}
                aria-pressed={isSelected}
                className={`group flex items-center justify-center p-1.5 rounded-xl border transition-all ${
                  isTaken
                    ? 'opacity-35 cursor-not-allowed border-transparent bg-muted/40'
                    : isSelected
                      ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/50 scale-[1.02]'
                      : 'border-border bg-card hover:border-amber-500/50 hover:bg-accent/40'
                }`}
              >
                <div className="relative w-full max-w-28 aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={avatarSrc(avatar)}
                    alt=""
                    className={`w-full h-full rounded-full object-cover select-none ${isTaken ? 'grayscale' : ''}`}
                  />
                  {isTaken && (
                    <div className="absolute inset-0 rounded-full bg-black/55 flex items-center justify-center">
                      <Lock className="w-7 h-7 text-white/90" />
                    </div>
                  )}
                  {isSelected && !isTaken && (
                    <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-amber-500 text-black flex items-center justify-center shadow">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {canScrollDown && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-card via-card/85 to-transparent flex items-end justify-center pb-2">
            <button
              type="button"
              onClick={scrollDownMore}
              className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3.5 py-1 text-xs font-bold text-black shadow-md hover:bg-amber-400 transition-colors"
            >
              <span>Sjá fleiri myndir</span>
              <ChevronDown className="w-4 h-4 animate-bounce" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
