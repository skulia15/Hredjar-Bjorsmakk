import { ParticipantAvatar } from '@/components/ChristmasAvatar'

export interface LobbyParticipant {
  id: string
  name: string
  imageUrl: string | null
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
            {/* Their photo if they signed in with one, else a festive sprite */}
            <ParticipantAvatar seed={p.id} imageUrl={p.imageUrl} className="h-16 w-16 shrink-0" />
            <span className="text-base font-semibold truncate max-w-full">{p.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
