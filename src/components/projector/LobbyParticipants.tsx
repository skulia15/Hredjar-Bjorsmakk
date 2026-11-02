export interface LobbyParticipant {
  id: string
  name: string
  imageUrl: string | null
}

// Deep enough for white initials to stay readable
const AVATAR_COLORS = ['bg-cranberry', 'bg-holly', 'bg-blue-700', 'bg-purple-700', 'bg-orange-700', 'bg-red-800', 'bg-teal-700', 'bg-pine-line']

function colorFor(name: string) {
  let hash = 0
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) | 0
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase()
}

/** Everyone who has joined; each avatar pops in as it arrives (keys are stable, so only newcomers animate) */
export function LobbyParticipants({ participants }: { participants: LobbyParticipant[] }) {
  if (participants.length === 0) {
    return <p className="text-2xl text-muted-foreground animate-pulse">Enginn kominn enn…</p>
  }

  return (
    <div className="space-y-3">
      <p className="text-2xl font-extrabold">
        {participants.length} {participants.length === 1 ? 'mættur' : 'mættir'}
      </p>
      <div className="flex flex-wrap justify-center gap-4 max-w-3xl">
        {participants.map((p, index) => (
          <div
            key={p.id}
            className="flex flex-col items-center gap-1.5 w-20 animate-in zoom-in-50 fade-in fill-mode-both duration-500"
            style={{ animationDelay: `${Math.min(index, 12) * 60}ms` }}
          >
            {p.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- Clerk avatars come from a host next/image isn't configured for
              <img src={p.imageUrl} alt="" className="h-16 w-16 rounded-full object-cover ring-2 ring-gold" />
            ) : (
              <div className={`h-16 w-16 rounded-full flex items-center justify-center text-white text-xl font-extrabold ${colorFor(p.name)}`}>
                {initials(p.name)}
              </div>
            )}
            <span className="text-base font-semibold truncate max-w-full">{p.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
