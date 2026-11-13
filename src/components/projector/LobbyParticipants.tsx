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
      <div className="flex flex-wrap justify-center gap-6 max-w-6xl">
        {participants.map((p, index) => (
          <div
            key={p.id}
            className="flex flex-col items-center gap-2 w-36 2xl:w-44 animate-in zoom-in-50 fade-in fill-mode-both duration-500"
            style={{ animationDelay: `${Math.min(index, 12) * 60}ms` }}
          >
            <ParticipantAvatar avatar={p.avatar} seed={p.id} className="h-32 w-32 2xl:h-40 2xl:w-40 shrink-0 shadow-md" />
            <span className="text-xl 2xl:text-2xl font-semibold truncate max-w-full">{p.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
