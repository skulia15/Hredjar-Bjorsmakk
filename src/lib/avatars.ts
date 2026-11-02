// Christmas avatars, one picture per participant within a tasting.
// Participant.avatar stores the key, so reordering or adding pictures never moves anyone's

export interface Avatar {
  key: string
  name: string
  /** Extra-raunchy tier; picked for 85% of participants */
  cheeky?: boolean
}

/** Festive faces and things — every single one well off the naughty list */
export const AVATARS: Avatar[] = [
  { key: 'thvorusleikir', name: 'Þvörusleikir', cheeky: true },
  { key: 'bossasveinn', name: 'Bossasveinn', cheeky: true },
  { key: 'fastur-i-strompinum', name: 'Fastur í strompinum', cheeky: true },
  { key: 'jolakulurnar', name: 'Jólakúlurnar', cheeky: true },
  { key: 'snjokonan', name: 'Snjókonan', cheeky: true },
  { key: 'osaemilegi-snjokarlinn', name: 'Ósæmilegi snjókarlinn', cheeky: true },
  { key: 'eldflaugasnjokarl', name: 'Eldflaugasnjókarlinn', cheeky: true },
  { key: 'sveinki-a-brokinni', name: 'Sveinki á brókinni', cheeky: true },
  { key: 'pakki', name: 'Pakkinn', cheeky: true },
  { key: 'bitni-piparkokukarlinn', name: 'Bitni piparkökubossinn', cheeky: true },
  { key: 'mistilteinn-a-beltinu', name: 'Mistilteinn á beltinu', cheeky: true },
  { key: 'bjugnakraekir', name: 'Bjúgnakrækir', cheeky: true },
  { key: 'bjugnakraekir-v2', name: 'Bjúgnakrækir á bóner', cheeky: true },
  { key: 'kertasnikir', name: 'Kertasníkir', cheeky: true },
  { key: 'skyrgamur', name: 'Skyrgámur', cheeky: true },
  { key: 'gluggagaegir', name: 'Gluggagægir', cheeky: true },
  { key: 'jolakotturinn', name: 'Jólakötturinn', cheeky: true },
  { key: 'alfastelpa', name: 'Bjórálfastelpan', cheeky: true },
  { key: 'isbjorn', name: 'Leðurbjörninn', cheeky: true },
  { key: 'hreindyr', name: 'Rúdolf á djamminu', cheeky: true },
  { key: 'morgaes', name: 'Partýmörgæsin', cheeky: true },
  { key: 'jolasveinn', name: 'Sveinki í pottinum', cheeky: true },
  { key: 'kutaalfurinn', name: 'Kútaálfurinn', cheeky: true },
  { key: 'hnotubrjoturinn', name: 'Hnotubrjóturinn', cheeky: true },
  { key: 'fastur-i-mursteinum', name: 'Fastur í múrsteinum', cheeky: true },
  { key: 'kulanef', name: 'Kúlanef', cheeky: true },
  { key: 'peysualfur', name: 'Peysuálfurinn', cheeky: true },
  { key: 'tungusnjokarl', name: 'Tungusnjókarlinn', cheeky: true },
  { key: 'nagdakaka', name: 'Nagða kakan', cheeky: true },
  { key: 'bumbusveinn', name: 'Bumbusveinn' },
  { key: 'fulli-jolasveinninn', name: 'Fulli jólasveinninn' },
  { key: 'thunna-hreindyrid', name: 'Þunna hreindýrið' },
  { key: 'gryla', name: 'Grýla á djamminu' },
  { key: 'gryla-v2', name: 'Grýla í kjólnum', cheeky: true },
  { key: 'bumbusveinn-v2', name: 'Bumbusveinn í nærbuxum', cheeky: true },
  { key: 'leppaludi', name: 'Leppalúði', cheeky: true },
  { key: 'stekkjarstaur', name: 'Stekkjarstaur', cheeky: true },
  { key: 'ljosaseria', name: 'Ljósaserían', cheeky: true },
  { key: 'kertastjakinn', name: 'Kertastjakinn', cheeky: true },
  { key: 'jolahermann', name: 'Jólahermanninn', cheeky: true },
  { key: 'hurdaskellir', name: 'Hurðaskellir' },
]

const CHEEKY_SHARE = 0.85

export function avatarSrc(avatar: Avatar): string {
  return `/avatars/${avatar.key}.jpg`
}

/**
 * A picture nobody in the tasting has yet, mostly from the cheeky pool. Once all are taken
 * (more people than pictures), the least used one gets doubled up
 */
export function pickAvatar(taken: Array<string | null>, random: () => number = Math.random): string {
  const uses = new Map(AVATARS.map(a => [a.key, 0]))
  for (const key of taken) if (key && uses.has(key)) uses.set(key, uses.get(key)! + 1)

  const fewest = Math.min(...uses.values())
  const free = AVATARS.filter(a => uses.get(a.key) === fewest)
  const cheeky = free.filter(a => a.cheeky)
  const classic = free.filter(a => !a.cheeky)
  const pool = cheeky.length && (!classic.length || random() < CHEEKY_SHARE) ? cheeky : classic
  return pool[Math.floor(random() * pool.length)].key
}

/** Stable pick from a seed, for participants who joined before avatars were handed out */
function avatarFromSeed(seed: string): Avatar {
  let hash = 0
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) | 0
  const h = hash >>> 0
  const cheeky = AVATARS.filter(a => a.cheeky)
  const classic = AVATARS.filter(a => !a.cheeky)
  const pool = h % 100 < CHEEKY_SHARE * 100 ? cheeky : classic
  return pool[Math.floor(h / 100) % pool.length]
}

export function resolveAvatar(key: string | null | undefined, seed: string): Avatar {
  return AVATARS.find(a => a.key === key) ?? avatarFromSeed(seed)
}
