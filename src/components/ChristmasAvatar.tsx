import { AVATARS, avatarSrc, resolveAvatar } from '@/lib/avatars'

function AvatarImage({ avatar, className }: { avatar: (typeof AVATARS)[number]; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static local avatar sprite
    <img
      src={avatarSrc(avatar)}
      alt={avatar.name}
      title={avatar.name}
      className={`rounded-full object-cover select-none ${className ?? ''}`}
    />
  )
}

/**
 * The picture handed out when someone joined the tasting (Participant.avatar).
 * Without one (joined before avatars were stored, or not a participant), falls back to a stable pick from the seed
 */
export function ChristmasAvatar({ avatar, seed, className }: { avatar?: string | null; seed: string; className?: string }) {
  return <AvatarImage avatar={resolveAvatar(avatar, seed)} className={className} />
}

/** Everyone gets their Christmas avatar instead of sign-in provider photos */
export const ParticipantAvatar = ChristmasAvatar

/** Every sprite, for previewing the set */
export function ChristmasAvatarSheet({ className }: { className?: string }) {
  return (
    <div className="flex flex-wrap gap-3">
      {AVATARS.map(avatar => (
        <AvatarImage key={avatar.key} avatar={avatar} className={className} />
      ))}
    </div>
  )
}
