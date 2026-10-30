export interface LobbyParticipant {
  id: string
  name: string
  imageUrl: string | null
}

const AVATAR_COLORS = ['bg-amber-500', 'bg-emerald-500', 'bg-sky-500', 'bg-rose-500', 'bg-violet-500', 'bg-orange-500', 'bg-teal-500', 'bg-fuchsia-500']

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
    return <p className="text-lg text-muted-foreground animate-pulse">Enginn kominn enn…</p>
  }

  return (
    <div className="space-y-3">
      <p className="text-lg font-semibold">
        {participants.length} {participants.length === 1 ? 'mættur' : 'mættir'}
      </p>
      <div className="flex flex-wrap justify-center gap-3 max-w-xl">
        {participants.map((p, index) => (
          <div
            key={p.id}
            className="flex flex-col items-center gap-1 w-16 animate-in zoom-in-50 fade-in fill-mode-both duration-500"
            style={{ animationDelay: `${Math.min(index, 12) * 60}ms` }}
          >
            {p.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- Clerk avatars come from a host next/image isn't configured for
              <img src={p.imageUrl} alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-primary/40" />
            ) : (
              <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-bold ${colorFor(p.name)}`}>
                {initials(p.name)}
              </div>
            )}
            <span className="text-xs font-medium truncate max-w-full">{p.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
