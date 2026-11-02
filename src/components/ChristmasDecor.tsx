/**
 * Non-interactive overlay with a handful of slow, soft snowflakes.
 * Kept deliberately sparse so it never competes with the content.
 */
const FLAKES = [
  { left: 6, size: 6, delay: 0, duration: 18 },
  { left: 19, size: 4, delay: 6, duration: 22 },
  { left: 33, size: 5, delay: 11, duration: 20 },
  { left: 52, size: 3, delay: 3, duration: 24 },
  { left: 67, size: 6, delay: 9, duration: 19 },
  { left: 81, size: 4, delay: 14, duration: 23 },
  { left: 93, size: 5, delay: 5, duration: 21 },
]

export function ChristmasDecor() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      {FLAKES.map((f) => (
        <span
          key={f.left}
          className="xmas-snowflake absolute -top-4 rounded-full bg-cream"
          style={{
            left: `${f.left}%`,
            width: f.size,
            height: f.size,
            animationDelay: `${f.delay}s`,
            animationDuration: `${f.duration}s`,
          }}
        />
      ))}
    </div>
  )
}
