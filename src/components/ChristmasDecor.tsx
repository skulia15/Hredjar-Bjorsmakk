'use client'

import { useEffect, useMemo, useState } from 'react'
import { Snowflake, TreePine } from 'lucide-react'

/**
 * Non-interactive decorative overlay shown only when `.christmas` theme
 * is active on <body>. Renders falling snow, top garland ornaments and
 * corner trees. Pointer-events are disabled so it never blocks UI.
 */
export function ChristmasDecor() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const body = document.body
    const check = () => setEnabled(body.classList.contains('christmas'))
    check()
    const observer = new MutationObserver(check)
    observer.observe(body, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  const flakes = useMemo(() => Array.from({ length: 5 }, (_, i) => i), [])
  const ornaments = useMemo(() => [
    '#d90429', '#ef233c', '#ffd166', '#06d6a0', '#118ab2', '#ffd166', '#ef233c', '#06d6a0', '#ffd166'
  ], [])
  const lightColors = useMemo(() => ['#ff5a5f','#ffd166','#06d6a0','#4cc9f0','#f72585'], [])

  const Star = ({ color }: { color: string }) => (
    <svg viewBox="0 0 24 24" className="xmas-star" width="28" height="28" aria-hidden>
      <polygon points="12,1 15,9 24,9 17,14 19,23 12,18 5,23 7,14 0,9 9,9" fill={color} stroke="rgba(0,0,0,0.35)" strokeWidth="1" />
    </svg>
  )

  if (!enabled) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-20">
      {/* Snowflakes */}
      {flakes.map((i) => {
        const left = (i * 53) % 100 // pseudo-random spread
        const delay = (i % 6) * 1.2
        const duration = 12 + (i % 7) * 1.5
        const size = 10 + (i % 4) * 3
        return (
          <Snowflake
            key={i}
            size={size}
            className="absolute -top-6 opacity-70 text-sky-200 xmas-snowflake"
            style={{ left: `${left}%`, animationDelay: `${delay}s`, animationDuration: `${duration}s` }}
            />
        )
      })}

      {/* Top masked strip for garland + ornaments (keeps content unobscured) */}
      <div className="xmas-garland-wrap absolute -top-3 md:-top-4 left-0 right-0 h-14 md:h-16">
        {/* Garland string with fairy lights (SVG, scales full width) */}
        <svg className="absolute left-0 right-0 h-full w-full" viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden>
          <path d="M0,30 C 250,70 500,10 750,50 S 1000,10 1000,30" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="2" />
          {Array.from({ length: 20 }, (_, i) => {
            const x = 25 + i * (950 / 19)
            const y = 30 + 14 * Math.sin((x / 1000) * Math.PI * 2)
            const color = lightColors[i % lightColors.length]
            const delay = (i % 5) * 0.25
            return <circle key={i} cx={x} cy={y} r={4} fill={color} className="xmas-light" style={{ animationDelay: `${delay}s` }} />
          })}
        </svg>

        {/* Enhanced ornaments along the top */}
        <div className="absolute left-0 right-0 flex justify-center gap-5 md:gap-6 mt-0 xmas-garland">
          {ornaments.map((color, idx) => {
            const isStar = idx % 3 === 1
            const swingDuration = 2.8 + (idx % 4) * 0.4
            return (
              <div key={idx} className="relative h-20 md:h-24 w-10 md:w-12 flex items-start justify-center opacity-90" style={{ animation: `xmas-swing ${swingDuration}s ease-in-out infinite`, transformOrigin: 'top center' }}>
                <div className="xmas-hook" />
                <div className="xmas-cap" />
                {isStar ? (
                  <div className="xmas-glow" style={{ filter: `drop-shadow(0 0 6px ${color})` }}>
                    <Star color={color} />
                  </div>
                ) : (
                  <div className="xmas-bulb xmas-glow" style={{ background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), rgba(255,255,255,0.05) 40%, ${color} 41%)`, boxShadow: `0 0 0 1px rgba(0,0,0,0.35)` }} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Corner trees */}
      <TreePine className="absolute bottom-3 left-3 h-10 w-10 opacity-80 text-green-600 select-none xmas-tree" />
      <TreePine className="absolute bottom-3 right-3 h-10 w-10 opacity-80 text-green-600 select-none xmas-tree" />
    </div>
  )
}


