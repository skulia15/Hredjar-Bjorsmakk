import { ParticipantAvatar } from '@/components/ChristmasAvatar'

export interface LobbyParticipant {
  id: string
  name: string
  avatar?: string | null
  imageUrl?: string | null
}

/** Everyone who has joined; each avatar pops in as it arrives (keys are stable, so only newcomers animate) */
export function LobbyParticipants({ participants }: { participants: LobbyParticipant[] }) {
  if (participants.length === 0) {
    return <p className="text-2xl text-muted-foreground animate-pulse">Enginn kominn enn…</p>
  }

  return (
    <div className="space-y-4">
      <p className="text-2xl font-extrabold">
        {participants.length} {participants.length === 1 ? 'mættur' : 'mættir'}
      </p>
      <div className="flex flex-wrap justify-center gap-5 max-w-4xl">
        {participants.map((p, index) => (
          <div
            key={p.id}
            className="flex flex-col items-center gap-2 w-28 animate-in zoom-in-50 fade-in fill-mode-both duration-500"
            style={{ animationDelay: `${Math.min(index, 12) * 60}ms` }}
          >
            <ParticipantAvatar avatar={p.avatar} seed={p.id} className="h-24 w-24 2xl:h-28 2xl:w-28 shrink-0 shadow-md" />
            <span className="text-lg font-semibold truncate max-w-full">{p.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
