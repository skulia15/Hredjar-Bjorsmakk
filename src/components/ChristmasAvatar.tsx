interface Sprite {
  name: string
  src: string
  /** Extra-raunchy tier; picked for 85% of participants */
  cheeky?: boolean
}

/** Festive faces and things — every single one well off the naughty list */
const SPRITES: Sprite[] = [
  { name: 'Þvörusleikir', src: '/avatars/thvorusleikir.jpg', cheeky: true },
  { name: 'Bossasveinn', src: '/avatars/bossasveinn.jpg', cheeky: true },
  { name: 'Fastur í strompinum', src: '/avatars/fastur-i-strompinum.jpg', cheeky: true },
  { name: 'Jólakúlurnar', src: '/avatars/jolakulurnar.jpg', cheeky: true },
  { name: 'Snjókonan', src: '/avatars/snjokonan.jpg', cheeky: true },
  { name: 'Ósæmilegi snjókarlinn', src: '/avatars/osaemilegi-snjokarlinn.jpg', cheeky: true },
  { name: 'Eldflaugasnjókarlinn', src: '/avatars/eldflaugasnjokarl.jpg', cheeky: true },
  { name: 'Sveinki á brókinni', src: '/avatars/sveinki-a-brokinni.jpg', cheeky: true },
  { name: 'Pakkinn', src: '/avatars/pakki.jpg', cheeky: true },
  { name: 'Sprautupiparkakan', src: '/avatars/piparkokukarl.jpg', cheeky: true },
  { name: 'Bitni piparkökubossinn', src: '/avatars/bitni-piparkokukarlinn.jpg', cheeky: true },
  { name: 'Mistilteinn á beltinu', src: '/avatars/mistilteinn-a-beltinu.jpg', cheeky: true },
  { name: 'Bjúgnakrækir', src: '/avatars/bjugnakraekir.jpg', cheeky: true },
  { name: 'Kertasníkir', src: '/avatars/kertasnikir.jpg', cheeky: true },
  { name: 'Skyrgámur', src: '/avatars/skyrgamur.jpg', cheeky: true },
  { name: 'Gluggagægir', src: '/avatars/gluggagaegir.jpg', cheeky: true },
  { name: 'Jólakötturinn', src: '/avatars/jolakotturinn.jpg', cheeky: true },
  { name: 'Bjórálfastelpan', src: '/avatars/alfastelpa.jpg', cheeky: true },
  { name: 'Leðurbjörninn', src: '/avatars/isbjorn.jpg', cheeky: true },
  { name: 'Rúdolf á djamminu', src: '/avatars/hreindyr.jpg', cheeky: true },
  { name: 'Partýmörgæsin', src: '/avatars/morgaes.jpg', cheeky: true },
  { name: 'Sveinki í pottinum', src: '/avatars/jolasveinn.jpg', cheeky: true },
  { name: 'Bumbusveinn', src: '/avatars/bumbusveinn.jpg' },
  { name: 'Fulli jólasveinninn', src: '/avatars/fulli-jolasveinninn.jpg' },
  { name: 'Þunna hreindýrið', src: '/avatars/thunna-hreindyrid.jpg' },
  { name: 'Grýla á djamminu', src: '/avatars/gryla.jpg' },
  { name: 'Hurðaskellir', src: '/avatars/hurdaskellir.jpg' },
]

export const CHRISTMAS_AVATAR_COUNT = SPRITES.length

const CHEEKY = SPRITES.map((sprite, i) => (sprite.cheeky ? i : -1)).filter(i => i >= 0)
const CLASSIC = SPRITES.map((sprite, i) => (sprite.cheeky ? -1 : i)).filter(i => i >= 0)
// Share of participants who land on the extra-raunchy pool
const CHEEKY_SHARE = 0.85

/**
 * Stable "random" pick: the same participant always gets the same sprite, on every screen.
 * One part of the hash picks the pool (mostly cheeky), the rest picks within it.
 */
export function avatarIndexFor(seed: string): number {
  let hash = 0
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) | 0
  const h = hash >>> 0
  const pool = h % 100 < CHEEKY_SHARE * 100 ? CHEEKY : CLASSIC
  return pool[Math.floor(h / 100) % pool.length]
}

/** A participant's festive avatar; seed with their participant id so it never changes mid-tasting */
export function ChristmasAvatar({ seed, className }: { seed: string; className?: string }) {
  const sprite = SPRITES[avatarIndexFor(seed)]
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static local avatar sprite
    <img
      src={sprite.src}
      alt={sprite.name}
      title={sprite.name}
      className={`rounded-full object-cover select-none ${className ?? ''}`}
    />
  )
}

/** Everyone gets their Christmas avatar instead of sign-in provider photos */
export function ParticipantAvatar({ seed, className }: { seed: string; imageUrl?: string | null; className?: string }) {
  return <ChristmasAvatar seed={seed} className={className} />
}

/** Every sprite, for previewing the set */
export function ChristmasAvatarSheet({ className }: { className?: string }) {
  return (
    <div className="flex flex-wrap gap-3">
      {SPRITES.map(sprite => (
        // eslint-disable-next-line @next/next/no-img-element -- static local avatar sprite
        <img
          key={sprite.name}
          src={sprite.src}
          alt={sprite.name}
          title={sprite.name}
          className={`rounded-full object-cover select-none ${className ?? ''}`}
        />
      ))}
    </div>
  )
}
